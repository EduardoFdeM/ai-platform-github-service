import base64
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from django.core.cache import cache
from django.urls import reverse
from rest_framework.settings import api_settings

from apps.github_sync.models import Repository

pytestmark = pytest.mark.django_db


@pytest.fixture
def signing_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def _token(signing_key, subject, *, audience="engenharia-software-api", expires_in=1800):
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": str(subject),
            "iss": "https://mod1-auth.whitemeadow-deba1090.brazilsouth.azurecontainerapps.io",
            "aud": audience,
            "iat": now,
            "exp": now + timedelta(seconds=expires_in),
            "jti": str(uuid4()),
        },
        signing_key,
        algorithm="RS256",
        headers={"kid": "test-key"},
    )


def _enable_auth(settings):
    settings.MODULE1_AUTH_REQUIRED = True
    settings.MODULE1_JWT_ISSUER = "https://mod1-auth.whitemeadow-deba1090.brazilsouth.azurecontainerapps.io"
    settings.MODULE1_JWT_AUDIENCE = "engenharia-software-api"


def _fake_jwks(signing_key):
    return SimpleNamespace(get_signing_key_from_jwt=lambda token: SimpleNamespace(key=signing_key.public_key()))


def test_valid_module1_token_authenticates_and_filters_repositories(client, settings, signing_key):
    _enable_auth(settings)
    owner = uuid4()
    mine = Repository.objects.create(
        project_id=uuid4(), platform_user_id=owner, github_id=8101, owner="team", name="mine", webhook_secret=b"sec"
    )
    Repository.objects.create(
        project_id=uuid4(), platform_user_id=uuid4(), github_id=8102, owner="team", name="other", webhook_secret=b"sec"
    )
    bearer = _token(signing_key, owner)

    with patch(
        "apps.github_sync.authentication._jwks_client",
        return_value=_fake_jwks(signing_key),
    ):
        response = client.get(reverse("repository-list"), HTTP_AUTHORIZATION=f"Bearer {bearer}")

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [mine.id]


def test_invalid_audience_is_rejected(client, settings, signing_key):
    _enable_auth(settings)
    bearer = _token(signing_key, uuid4(), audience="wrong-audience")

    with patch(
        "apps.github_sync.authentication._jwks_client",
        return_value=_fake_jwks(signing_key),
    ):
        response = client.get(reverse("repository-list"), HTTP_AUTHORIZATION=f"Bearer {bearer}")

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_repository_creation_verifies_project_owner(client, settings, monkeypatch, signing_key):
    _enable_auth(settings)
    monkeypatch.setenv("CREDENTIAL_MASTER_KEY", base64.urlsafe_b64encode(b"0" * 32).decode())
    owner = uuid4()
    project_id = uuid4()
    bearer = _token(signing_key, owner)
    repo_data = {"id": 8201, "name": "repo", "owner": {"login": "team"}, "default_branch": "main"}

    with (
        patch(
            "apps.github_sync.authentication._jwks_client",
            return_value=_fake_jwks(signing_key),
        ),
        patch("apps.github_sync.views.get_project", return_value={"id": str(project_id), "owner_id": str(owner)}),
        patch("apps.github_sync.views.GitHubClient.get_repository", return_value=repo_data),
        patch("apps.github_sync.views.sync_repository_from_github", return_value=0),
    ):
        response = client.post(
            reverse("repository-list"),
            {
                "project_id": str(project_id),
                "url": "https://github.com/team/repo",
                "webhook_secret": "unique-webhook-secret",
            },
            HTTP_AUTHORIZATION=f"Bearer {bearer}",
        )

    assert response.status_code == 201
    repository = Repository.objects.get(github_id=8201)
    assert repository.project_id == project_id
    assert repository.platform_user_id == owner
    assert response.json()["project_id"] == str(project_id)


def test_repository_creation_rejects_project_owned_by_another_user(client, settings, signing_key):
    _enable_auth(settings)
    owner = uuid4()
    project_id = uuid4()
    bearer = _token(signing_key, owner)

    with (
        patch(
            "apps.github_sync.authentication._jwks_client",
            return_value=_fake_jwks(signing_key),
        ),
        patch(
            "apps.github_sync.views.get_project",
            return_value={"id": str(project_id), "owner_id": str(uuid4())},
        ),
    ):
        response = client.post(
            reverse("repository-list"),
            {"project_id": str(project_id), "url": "team/repo", "webhook_secret": "unique-webhook-secret"},
            HTTP_AUTHORIZATION=f"Bearer {bearer}",
        )

    assert response.status_code == 403
    assert response.json()["code"] == "project_access_denied"


def test_project_deletion_forwards_to_module1_only_without_m2_repository_links(client, settings, signing_key):
    _enable_auth(settings)
    owner = uuid4()
    project_id = uuid4()
    bearer = _token(signing_key, owner)

    with (
        patch("apps.github_sync.authentication._jwks_client", return_value=_fake_jwks(signing_key)),
        patch("apps.github_sync.views.delete_project") as delete_project,
    ):
        response = client.delete(
            reverse("platform-project-detail", kwargs={"project_id": project_id}),
            HTTP_AUTHORIZATION=f"Bearer {bearer}",
        )

    assert response.status_code == 204
    delete_project.assert_called_once_with(bearer, project_id)


def test_project_deletion_preserves_m2_repository_links(client, settings, signing_key):
    _enable_auth(settings)
    owner = uuid4()
    project_id = uuid4()
    bearer = _token(signing_key, owner)
    Repository.objects.create(
        project_id=project_id,
        platform_user_id=owner,
        github_id=8203,
        owner="team",
        name="linked",
        webhook_secret=b"secret",
    )

    with (
        patch("apps.github_sync.authentication._jwks_client", return_value=_fake_jwks(signing_key)),
        patch("apps.github_sync.views.delete_project") as delete_project,
    ):
        response = client.delete(
            reverse("platform-project-detail", kwargs={"project_id": project_id}),
            HTTP_AUTHORIZATION=f"Bearer {bearer}",
        )

    assert response.status_code == 409
    assert response.json()["code"] == "project_has_github_links"
    delete_project.assert_not_called()


def test_public_platform_auth_proxy_is_rate_limited(client, settings):
    cache.clear()
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {
            **settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],
            "platform_auth": "1/minute",
        },
    }
    api_settings.reload()
    payload = {
        "email": "rate-limit@example.com",
        "display_name": "Rate Limit",
        "password": "safe-test-password",
    }

    try:
        with patch("apps.github_sync.views.register_user", return_value={"message": "created"}):
            first = client.post(reverse("platform-register"), payload)
            second = client.post(reverse("platform-register"), payload)
    finally:
        api_settings.reload()
        cache.clear()

    assert first.status_code == 200
    assert second.status_code == 429


def test_login_uses_seamless_fallback_when_module1_is_unavailable(client, settings):
    _enable_auth(settings)
    settings.MODULE1_FALLBACK_ENABLED = True
    project_id = uuid4()
    repo = Repository.objects.create(
        project_id=project_id,
        platform_user_id=uuid4(),
        github_id=8301,
        owner="team",
        name="demo-repo",
        webhook_secret=b"sec",
    )

    from apps.github_sync.services.platform import PlatformServiceError

    with patch(
        "apps.github_sync.views.issue_token",
        side_effect=PlatformServiceError(503, {"detail": "O Módulo 1 está temporariamente indisponível."}),
    ):
        token_res = client.post(
            reverse("platform-token"),
            {"email": "eduardo@mackenzie.br", "password": "any-password"},
            content_type="application/json",
        )

    assert token_res.status_code == 200
    token_data = token_res.json()
    assert token_data["auth_mode"] == "fallback"
    bearer = token_data["access_token"]

    me_res = client.get(reverse("platform-me"), HTTP_AUTHORIZATION=f"Bearer {bearer}")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "eduardo@mackenzie.br"
    assert me_res.json()["auth_mode"] == "fallback"

    projects_res = client.get(reverse("platform-projects"), HTTP_AUTHORIZATION=f"Bearer {bearer}")
    assert projects_res.status_code == 200
    assert projects_res.json()["fallback"] is True
    assert projects_res.json()["items"][0]["id"] == str(project_id)

    repos_res = client.get(reverse("repository-list"), HTTP_AUTHORIZATION=f"Bearer {bearer}")
    assert repos_res.status_code == 200
    assert [item["id"] for item in repos_res.json()] == [repo.id]


def test_login_does_not_fallback_on_invalid_credentials(client, settings):
    _enable_auth(settings)
    settings.MODULE1_FALLBACK_ENABLED = True

    from apps.github_sync.services.platform import PlatformServiceError

    with patch(
        "apps.github_sync.views.issue_token",
        side_effect=PlatformServiceError(401, {"detail": "E-mail ou senha inválidos."}),
    ):
        response = client.post(
            reverse("platform-token"),
            {"email": "eduardo@mackenzie.br", "password": "wrong"},
            content_type="application/json",
        )

    assert response.status_code == 401


def test_jwks_stale_cache_keeps_valid_module1_token_working_when_jwks_drops(client, settings, signing_key):
    from jwt import PyJWKClientError

    from apps.github_sync.authentication import _LAST_KNOWN_SIGNING_KEYS

    _enable_auth(settings)
    settings.MODULE1_FALLBACK_ENABLED = True
    _LAST_KNOWN_SIGNING_KEYS.clear()
    owner = uuid4()
    bearer = _token(signing_key, owner)

    with patch("apps.github_sync.authentication._jwks_client", return_value=_fake_jwks(signing_key)):
        first = client.get(reverse("repository-list"), HTTP_AUTHORIZATION=f"Bearer {bearer}")
    assert first.status_code == 200

    failing_jwks = SimpleNamespace(
        get_signing_key_from_jwt=lambda _tok: (_ for _ in ()).throw(PyJWKClientError("jwks unreachable"))
    )
    with patch("apps.github_sync.authentication._jwks_client", return_value=failing_jwks):
        second = client.get(reverse("repository-list"), HTTP_AUTHORIZATION=f"Bearer {bearer}")
    assert second.status_code == 200
