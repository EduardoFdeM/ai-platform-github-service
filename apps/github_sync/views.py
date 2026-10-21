import json
import logging
import time
import uuid

import requests
from django.db import IntegrityError, connection, transaction
from django.db.models import Count
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .dashboard import dashboard_repository, dashboard_summary
from .models import Branch, Commit, PullRequest, Repository, WebhookDelivery
from .serializers import (
    BranchSerializer,
    CommitSerializer,
    DashboardMetricsSerializer,
    ErrorSerializer,
    FlowMetricsSerializer,
    GitHubConnectivitySerializer,
    HandshakeRequestSerializer,
    HandshakeResponseSerializer,
    HealthSerializer,
    PullRequestSerializer,
    RepositoryCreateRequestSerializer,
    RepositoryCreateResponseSerializer,
    RepositorySerializer,
    RepositorySyncRequestSerializer,
    RepositorySyncResponseSerializer,
    WebhookDeliverySerializer,
)
from .services.crypto import decrypt_secret, encrypt_secret
from .services.github import GitHubClient
from .services.signatures import is_valid_github_signature
from .services.sync import sync_repository_from_github
from .tasks import process_webhook

logger = logging.getLogger(__name__)


@extend_schema(
    responses={
        200: HealthSerializer,
        503: HealthSerializer,
    },
)
@api_view(["GET"])
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        return Response({"status": "unhealthy", "database": "down"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({"status": "healthy", "database": "up"})


@extend_schema(
    responses={
        200: GitHubConnectivitySerializer,
        503: GitHubConnectivitySerializer,
    },
)
@api_view(["GET"])
def github_connectivity(request):
    started_at = time.monotonic()
    try:
        response = GitHubClient().get("/meta")
        return Response(
            {
                "status": "up",
                "latency_ms": round((time.monotonic() - started_at) * 1000, 2),
                "github_status": response.status_code,
            }
        )
    except requests.RequestException as exc:
        return Response(
            {"status": "down", "latency_ms": round((time.monotonic() - started_at) * 1000, 2), "detail": str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


@extend_schema(
    request=HandshakeRequestSerializer,
    responses={
        200: HandshakeResponseSerializer,
        400: HandshakeResponseSerializer,
        401: HandshakeResponseSerializer,
        502: HandshakeResponseSerializer,
        503: HandshakeResponseSerializer,
    },
)
@api_view(["POST"])
def github_handshake(request):
    # O token so e usado nesta chamada: nao e persistido, logado nem devolvido.
    serializer = HandshakeRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"valid": False, "detail": "Informe um token."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user, scopes = GitHubClient(token=serializer.validated_data["token"]).handshake()
    except requests.HTTPError as exc:
        code = exc.response.status_code if exc.response is not None else None
        if code in (401, 403):
            return Response(
                {"valid": False, "detail": "Token recusado pelo GitHub."}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(
            {"valid": False, "detail": f"GitHub respondeu com status {code}."}, status=status.HTTP_502_BAD_GATEWAY
        )
    except requests.RequestException:
        return Response(
            {"valid": False, "detail": "Nao foi possivel contatar o GitHub."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(
        {
            "valid": True,
            "login": user.get("login"),
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
            "scopes": sorted(scopes),
        }
    )


@extend_schema(
    request=None,
    responses={
        202: OpenApiResponse(description="Evento aceito"),
        401: OpenApiResponse(description="Assinatura invalida"),
    },
)
@api_view(["POST"])
def github_webhook(request):
    signature = request.headers.get("X-Hub-Signature-256", "")
    event = request.headers.get("X-GitHub-Event", "")
    delivery_header = request.headers.get("X-GitHub-Delivery", "")
    try:
        delivery_id = uuid.UUID(delivery_header)
        payload = json.loads(request.body)
        repository = Repository.objects.get(github_id=payload["repository"]["id"], active=True)
    except (ValueError, json.JSONDecodeError, KeyError, Repository.DoesNotExist):
        return Response(
            {"detail": "Invalid delivery, payload, or unknown repository"}, status=status.HTTP_400_BAD_REQUEST
        )

    if not is_valid_github_signature(request.body, signature, decrypt_secret(repository.webhook_secret)):
        return Response({"detail": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        with transaction.atomic():
            delivery = WebhookDelivery.objects.create(
                delivery_id=delivery_id,
                repository=repository,
                event=event,
                payload=payload,
            )
            transaction.on_commit(lambda: process_webhook.delay(delivery.pk))
    except IntegrityError:
        return Response({"status": "ignored", "reason": "duplicate delivery"}, status=status.HTTP_200_OK)
    return Response({"status": "accepted", "delivery_id": str(delivery_id)}, status=status.HTTP_202_ACCEPTED)


class CommitListView(ListAPIView):
    serializer_class = CommitSerializer

    def get_queryset(self):
        queryset = (
            Commit.objects.select_related("repository", "branch", "author")
            .prefetch_related("files")
            .order_by("-authored_at")
        )
        repository_id = self.request.query_params.get("repository_id")
        author = self.request.query_params.get("author")
        since = self.request.query_params.get("since")
        until = self.request.query_params.get("until")
        if repository_id:
            queryset = queryset.filter(repository_id=repository_id)
        if author:
            queryset = queryset.filter(author__login=author)
        if since:
            queryset = queryset.filter(authored_at__gte=since)
        if until:
            queryset = queryset.filter(authored_at__lte=until)
        return queryset


class BranchListView(ListAPIView):
    serializer_class = BranchSerializer

    def get_queryset(self):
        queryset = Branch.objects.select_related("repository").order_by("repository_id", "name")
        repository_id = self.request.query_params.get("repository_id")
        if repository_id:
            queryset = queryset.filter(repository_id=repository_id)
        if self.request.query_params.get("include_deleted", "false").lower() != "true":
            queryset = queryset.filter(deleted_at__isnull=True)
        return queryset


class PullRequestListView(ListAPIView):
    serializer_class = PullRequestSerializer

    def get_queryset(self):
        queryset = PullRequest.objects.select_related("repository", "author").order_by("-updated_at")
        repository_id = self.request.query_params.get("repository_id")
        state_filter = self.request.query_params.get("state")
        author = self.request.query_params.get("author")
        if repository_id:
            queryset = queryset.filter(repository_id=repository_id)
        if state_filter:
            queryset = queryset.filter(state=state_filter)
        if author:
            queryset = queryset.filter(author__login=author)
        return queryset


@extend_schema(responses={200: FlowMetricsSerializer})
@api_view(["GET"])
def flow_metrics(request):
    queryset = Commit.objects.all()
    repository_id = request.query_params.get("repository_id")
    if repository_id:
        queryset = queryset.filter(repository_id=repository_id)
    by_author = list(queryset.values("author__login").annotate(commits=Count("id")).order_by("-commits"))
    return Response({"total_commits": queryset.count(), "commits_by_author": by_author})


def _dashboard_params(params):
    days = params.get("days", "7")
    repository_id = params.get("repository_id")
    if days not in ("7", "30") or (repository_id is not None and not repository_id.isdecimal()):
        raise ValueError("Selecione um período de 7 ou 30 dias e um repositório válido.")
    return int(days), repository_id


@extend_schema(
    responses={
        200: DashboardMetricsSerializer,
        400: ErrorSerializer,
        401: ErrorSerializer,
        404: ErrorSerializer,
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    try:
        days, repository_id = _dashboard_params(request.query_params)
        repository, _ = dashboard_repository(repository_id)
    except (ValueError, Repository.DoesNotExist):
        return Response({"detail": "Parâmetros inválidos."}, status=status.HTTP_400_BAD_REQUEST)
    if repository is None:
        return Response({"detail": "Nenhum repositório ativo cadastrado."}, status=status.HTTP_404_NOT_FOUND)
    return Response(dashboard_summary(repository, days))


@extend_schema(
    request=RepositorySyncRequestSerializer,
    responses={
        200: RepositorySyncResponseSerializer,
        404: ErrorSerializer,
        500: ErrorSerializer,
        502: ErrorSerializer,
    },
)
@api_view(["POST"])
def repository_sync(request, pk):
    """Sincroniza commits e dados reais de um repositorio via GitHub API (M2-111 / M2-114)."""
    try:
        repository = Repository.objects.get(pk=pk, active=True)
    except Repository.DoesNotExist:
        return Response({"detail": "Repositório não encontrado."}, status=status.HTTP_404_NOT_FOUND)
    token = request.data.get("token")
    try:
        commits_count = sync_repository_from_github(repository, token=token)
    except requests.HTTPError as exc:
        code = exc.response.status_code if exc.response is not None else 502
        return Response({"detail": f"Erro na API do GitHub (HTTP {code})."}, status=code)
    except Exception as exc:
        return Response({"detail": f"Erro na sincronização: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({
        "status": "synced",
        "repository": str(repository),
        "commits_synced": commits_count,
    })


class RepositoryListView(ListCreateAPIView):
    serializer_class = RepositorySerializer
    pagination_class = None

    def get_queryset(self):
        return Repository.objects.filter(active=True).order_by("owner", "name")

    @extend_schema(
        request=RepositoryCreateRequestSerializer,
        responses={
            201: RepositoryCreateResponseSerializer,
            400: ErrorSerializer,
            404: ErrorSerializer,
            502: ErrorSerializer,
        },
    )
    def create(self, request, *args, **kwargs):
        url_input = request.data.get("url") or request.data.get("repository_url") or ""
        owner = request.data.get("owner", "").strip()
        name = request.data.get("name", "").strip()
        token = request.data.get("token")
        raw_secret = request.data.get("webhook_secret", "").strip()

        if len(raw_secret) < 16:
            return Response(
                {
                    "detail": (
                        "Informe webhook_secret com pelo menos 16 caracteres "
                        "e use um valor exclusivo por repositório."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if url_input:
            from urllib.parse import urlparse

            cleaned = url_input.strip().rstrip("/")
            if "github.com" in cleaned:
                parsed = urlparse(cleaned if "://" in cleaned else f"https://{cleaned}")
                if parsed.netloc not in ("github.com", "www.github.com"):
                    return Response(
                        {"detail": "A URL precisa ser do domínio oficial github.com."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                parts = [p for p in parsed.path.strip("/").split("/") if p]
                if len(parts) >= 2:
                    owner, name = parts[0], parts[1].removesuffix(".git")
            elif "/" in cleaned:
                parts = [p for p in cleaned.split("/") if p]
                if len(parts) == 2:
                    owner, name = parts[0], parts[1]

        if not owner or not name:
            return Response(
                {"detail": "Informe uma URL válida do GitHub (ex: https://github.com/owner/repo) ou o owner e o name."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            client = GitHubClient(token=token)
            repo_data = client.get_repository(owner, name)
        except requests.HTTPError as exc:
            code = exc.response.status_code if exc.response is not None else 502
            return Response({"detail": f"Repositório não encontrado no GitHub (HTTP {code})."}, status=code)
        except Exception as exc:
            return Response({"detail": f"Erro de conexão com o GitHub: {str(exc)}"}, status=status.HTTP_502_BAD_GATEWAY)

        repository, created = Repository.objects.update_or_create(
            github_id=repo_data["id"],
            defaults={
                "owner": repo_data["owner"]["login"],
                "name": repo_data["name"],
                "default_branch": repo_data.get("default_branch", "main"),
                "webhook_secret": encrypt_secret(raw_secret),
                "active": True,
            },
        )
        sync_status = "completed"
        sync_detail = None
        try:
            sync_repository_from_github(repository, token=token)
        except Exception as exc:
            sync_status = "failed"
            sync_detail = "Repositório cadastrado, mas a sincronização inicial falhou. Tente sincronizar novamente."
            logger.warning(
                "initial_repository_sync_failed",
                extra={"repository_id": repository.pk, "repository": str(repository)},
                exc_info=exc,
            )

        serializer = self.get_serializer(repository)
        response_data = {**serializer.data, "initial_sync_status": sync_status}
        if sync_detail:
            response_data["initial_sync_detail"] = sync_detail
        return Response(response_data, status=status.HTTP_201_CREATED)


class WebhookDeliveryListView(ListAPIView):
    serializer_class = WebhookDeliverySerializer
    pagination_class = None

    def get_queryset(self):
        queryset = WebhookDelivery.objects.select_related("repository").order_by("-received_at")
        repository_id = self.request.query_params.get("repository_id")
        if repository_id:
            queryset = queryset.filter(repository_id=repository_id)
        return queryset[:15]
