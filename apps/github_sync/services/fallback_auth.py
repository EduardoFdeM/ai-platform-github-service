"""Contingencia local para manter o Modulo 2 operante se o Modulo 1 cair."""

from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from django.conf import settings
from django.utils import timezone
from jwt import InvalidTokenError

from ..models import Repository
from .platform import PlatformServiceError

FALLBACK_ISSUER = "m2-local-fallback"
DEFAULT_FALLBACK_PROJECT_ID = uuid.UUID("00000000-0000-4000-8000-000000000002")
UNAVAILABLE_STATUSES = frozenset({502, 503, 504})


def _signing_key() -> str:
    return hashlib.sha256(f"m2-fallback:{settings.SECRET_KEY}".encode()).hexdigest()


def is_module1_unavailable(exc: PlatformServiceError) -> bool:
    return bool(settings.MODULE1_FALLBACK_ENABLED and exc.status_code in UNAVAILABLE_STATUSES)


def _display_name_from_email(email: str) -> str:
    local_part = email.split("@", 1)[0].replace(".", " ").replace("_", " ").strip()
    return (local_part.title() or "Usuario Contingencia")[:120]


def issue_fallback_token(email: str, display_name: str | None = None) -> dict:
    normalized_email = email.strip().lower()
    user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"m2-fallback:{normalized_email}")
    name = (display_name or _display_name_from_email(normalized_email)).strip()[:120]
    now = datetime.now(UTC)
    ttl = int(settings.MODULE1_FALLBACK_TTL_SECONDS)
    token = jwt.encode(
        {
            "sub": str(user_id),
            "iss": FALLBACK_ISSUER,
            "aud": settings.MODULE1_JWT_AUDIENCE,
            "iat": now,
            "exp": now + timedelta(seconds=ttl),
            "jti": str(uuid.uuid4()),
            "auth_mode": "fallback",
            "email": normalized_email,
            "display_name": name,
        },
        _signing_key(),
        algorithm="HS256",
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ttl,
        "auth_mode": "fallback",
    }


def decode_fallback_token(token: str) -> dict | None:
    if not settings.MODULE1_FALLBACK_ENABLED:
        return None
    try:
        header = jwt.get_unverified_header(token)
        if header.get("alg") != "HS256":
            return None
        claims = jwt.decode(
            token,
            _signing_key(),
            algorithms=["HS256"],
            audience=settings.MODULE1_JWT_AUDIENCE,
            issuer=FALLBACK_ISSUER,
            options={"require": ["sub", "iss", "aud", "iat", "exp", "jti", "auth_mode"]},
        )
    except InvalidTokenError:
        return None
    if claims.get("auth_mode") != "fallback":
        return None
    return claims


def fallback_user_from_claims(principal_id: uuid.UUID, claims: dict) -> dict:
    return {
        "id": str(principal_id),
        "email": claims.get("email") or f"usuario-{str(principal_id)[:8]}@contingencia.local",
        "display_name": claims.get("display_name") or "Modo Contingência (M2)",
        "is_active": True,
        "created_at": timezone.now().isoformat(),
        "auth_mode": claims.get("auth_mode", "fallback"),
    }


def fallback_projects_for_user(principal_id: uuid.UUID, *, is_fallback: bool) -> dict:
    queryset = Repository.objects.filter(active=True).order_by("created_at", "id")
    if not is_fallback:
        queryset = queryset.filter(platform_user_id=principal_id)

    grouped: dict[uuid.UUID, list[Repository]] = {}
    for repo in queryset:
        pid = repo.project_id or DEFAULT_FALLBACK_PROJECT_ID
        grouped.setdefault(pid, []).append(repo)

    items = []
    for pid, repos in grouped.items():
        first = repos[0]
        if len(repos) == 1:
            name = f"Projeto {first.name} (Contingência)"
        else:
            name = f"Projeto {first.name} +{len(repos) - 1} (Contingência)"
        repo_names = ", ".join(str(r) for r in repos[:3])
        if len(repos) > 3:
            repo_names += f" (+{len(repos) - 3})"
        items.append(
            {
                "id": str(pid),
                "owner_id": str(first.platform_user_id or principal_id),
                "name": name,
                "description": f"Contexto local de contingência ({repo_names}).",
                "created_at": first.created_at.isoformat(),
            }
        )

    if not items:
        items.append(
            {
                "id": str(DEFAULT_FALLBACK_PROJECT_ID),
                "owner_id": str(principal_id),
                "name": "Projeto Local · Modo Contingência",
                "description": "Projeto local temporário enquanto o Módulo 1 está indisponível.",
                "created_at": timezone.now().isoformat(),
            }
        )

    return {
        "items": items,
        "total": len(items),
        "limit": 100,
        "offset": 0,
        "fallback": True,
    }


def create_fallback_project(principal_id: uuid.UUID, payload: dict) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "owner_id": str(principal_id),
        "name": payload["name"],
        "description": payload.get("description", ""),
        "created_at": timezone.now().isoformat(),
    }
