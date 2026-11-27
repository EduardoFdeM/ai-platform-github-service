from dataclasses import dataclass
from functools import lru_cache
from uuid import UUID

import jwt
from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header


@dataclass(frozen=True)
class PlatformPrincipal:
    """Authenticated identity issued by Module 1 or local M2 fallback."""

    id: UUID
    claims: dict
    auth_mode: str = "module1"

    @property
    def is_fallback(self) -> bool:
        return self.auth_mode == "fallback"

    @property
    def pk(self):
        return self.id

    @property
    def username(self) -> str:
        return str(self.id)

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    def get_username(self) -> str:
        return self.username


_LAST_KNOWN_SIGNING_KEYS: dict[str, object] = {}


@lru_cache(maxsize=8)
def _jwks_client(url: str, cache_seconds: int, timeout: int) -> PyJWKClient:
    return PyJWKClient(
        url,
        cache_keys=True,
        cache_jwk_set=True,
        lifespan=cache_seconds,
        timeout=timeout,
    )


class Module1JWTAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header:
            return None
        if header[0].decode("ascii", errors="ignore").lower() != self.keyword.lower():
            return None
        if len(header) != 2:
            raise exceptions.AuthenticationFailed("Cabeçalho Bearer inválido.")
        try:
            token = header[1].decode("ascii")
        except UnicodeError as exc:
            raise exceptions.AuthenticationFailed("Token inválido.") from exc

        from .services.fallback_auth import decode_fallback_token

        fallback_claims = decode_fallback_token(token)
        if fallback_claims is not None:
            try:
                subject = UUID(str(fallback_claims["sub"]))
            except (ValueError, KeyError) as exc:
                raise exceptions.AuthenticationFailed("Token de contingência inválido.") from exc
            return PlatformPrincipal(id=subject, claims=fallback_claims, auth_mode="fallback"), token

        try:
            kid = jwt.get_unverified_header(token).get("kid")
            client = _jwks_client(
                settings.MODULE1_JWKS_URL,
                settings.MODULE1_JWKS_CACHE_SECONDS,
                settings.MODULE1_JWKS_TIMEOUT,
            )
            try:
                signing_key = client.get_signing_key_from_jwt(token)
                key = signing_key.key
                if kid:
                    _LAST_KNOWN_SIGNING_KEYS[kid] = key
            except PyJWKClientError:
                if settings.MODULE1_FALLBACK_ENABLED and kid and kid in _LAST_KNOWN_SIGNING_KEYS:
                    key = _LAST_KNOWN_SIGNING_KEYS[kid]
                else:
                    raise
            claims = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=settings.MODULE1_JWT_AUDIENCE,
                issuer=settings.MODULE1_JWT_ISSUER,
                options={"require": ["sub", "iss", "aud", "iat", "exp", "jti"]},
            )
            subject = UUID(str(claims["sub"]))
        except (InvalidTokenError, PyJWKClientError, ValueError, KeyError) as exc:
            raise exceptions.AuthenticationFailed("Token do Módulo 1 inválido ou expirado.") from exc

        return PlatformPrincipal(id=subject, claims=claims, auth_mode="module1"), token

    def authenticate_header(self, request) -> str:
        return self.keyword


class Module1JWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.github_sync.authentication.Module1JWTAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT RS256 emitido pelo serviço de autenticação do Módulo 1.",
        }
