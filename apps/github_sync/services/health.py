import time
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from urllib.parse import urlsplit

import requests
from celery import current_app
from django.conf import settings
from django.db import connection
from redis import Redis

from .crypto import validate_master_key
from .notifications import module6_notifications_enabled


def _result(status: str, detail: str | None = None) -> dict:
    value = {"status": status}
    if detail:
        value["detail"] = detail
    return value


def database_check() -> dict:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        return _result("down", "database query failed")
    return _result("up")


def schema_check() -> dict:
    """Confirma as colunas usadas pelo escopo de projeto antes de declarar prontidão."""
    try:
        table = "github_sync_repository"
        if table not in connection.introspection.table_names():
            return _result("down", "repository schema migration is pending")
        with connection.cursor() as cursor:
            columns = {column.name for column in connection.introspection.get_table_description(cursor, table)}
    except Exception:
        return _result("down", "database schema inspection failed")

    required = {"project_id", "platform_user_id"}
    if not required.issubset(columns):
        return _result("down", "repository schema migration is pending")
    return _result("up")


def redis_check() -> dict:
    if settings.CELERY_TASK_ALWAYS_EAGER:
        return _result("not_required", "tasks run eagerly in this environment")
    try:
        Redis.from_url(settings.REDIS_URL, socket_connect_timeout=1, socket_timeout=1).ping()
    except Exception:
        return _result("down", "redis ping failed")
    return _result("up")


def worker_check() -> dict:
    if settings.CELERY_TASK_ALWAYS_EAGER:
        return _result("not_required", "tasks run eagerly in this environment")
    try:
        replies = current_app.control.inspect(timeout=1).ping() or {}
    except Exception:
        return _result("down", "worker inspection failed")
    if not replies:
        return _result("down", "no Celery worker replied")
    return _result("up", f"{len(replies)} worker(s) replied")


def crypto_check() -> dict:
    try:
        validate_master_key()
    except RuntimeError:
        return _result("down", "credential master key is missing or invalid")
    return _result("up")


def readiness_report() -> dict:
    checks = {
        "database": database_check(),
        "schema": schema_check(),
        "redis": redis_check(),
        "worker": worker_check(),
        "crypto": crypto_check(),
    }
    ready = all(check["status"] in {"up", "not_required"} for check in checks.values())
    return {"status": "ready" if ready else "not_ready", "checks": checks}


def _probe_module1_auth(timeout: int) -> dict:
    started = time.monotonic()
    try:
        response = requests.get(settings.MODULE1_JWKS_URL, timeout=timeout)
        latency = round((time.monotonic() - started) * 1000, 1)
        if response.status_code == 200:
            return {
                "id": "module1_auth",
                "name": "Módulo 1 · Autenticação (JWKS)",
                "role": "dependency_with_fallback",
                "status": "up",
                "latency_ms": latency,
                "detail": "Serviço de identidade e chaves públicas RS256 respondendo normalmente.",
            }
        detail = f"JWKS retornou HTTP {response.status_code}."
    except requests.RequestException:
        latency = round((time.monotonic() - started) * 1000, 1)
        detail = "Serviço de autenticação do Módulo 1 inacessível."
    fallback_note = (
        " Fallback automático de contingência está ativo."
        if settings.MODULE1_FALLBACK_ENABLED
        else " Fallback desativado."
    )
    return {
        "id": "module1_auth",
        "name": "Módulo 1 · Autenticação (JWKS)",
        "role": "dependency_with_fallback",
        "status": "down",
        "latency_ms": latency,
        "detail": detail + fallback_note,
    }


def _probe_module1_projects(timeout: int) -> dict:
    started = time.monotonic()
    try:
        response = requests.get(
            f"{settings.MODULE1_PROJECTS_BASE_URL}/projects",
            timeout=timeout,
        )
        latency = round((time.monotonic() - started) * 1000, 1)
        if response.status_code < 500:
            return {
                "id": "module1_projects",
                "name": "Módulo 1 · Projetos",
                "role": "dependency_with_fallback",
                "status": "up",
                "latency_ms": latency,
                "detail": "API de projetos do Módulo 1 acessível.",
            }
        detail = f"API de projetos retornou HTTP {response.status_code}."
    except requests.RequestException:
        latency = round((time.monotonic() - started) * 1000, 1)
        detail = "API de projetos do Módulo 1 indisponível."
    fallback_note = (
        " Cache local e projetos de contingência ativos."
        if settings.MODULE1_FALLBACK_ENABLED
        else ""
    )
    return {
        "id": "module1_projects",
        "name": "Módulo 1 · Projetos",
        "role": "dependency_with_fallback",
        "status": "down",
        "latency_ms": latency,
        "detail": detail + fallback_note,
    }


def _probe_github_api(timeout: int) -> dict:
    started = time.monotonic()
    try:
        response = requests.get(
            f"{settings.GITHUB_API_URL.rstrip('/')}/meta",
            headers={"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"},
            timeout=timeout,
            verify=settings.GITHUB_CA_BUNDLE,
        )
        latency = round((time.monotonic() - started) * 1000, 1)
        if response.status_code < 500:
            return {
                "id": "github_api",
                "name": "GitHub REST API",
                "role": "external",
                "status": "up",
                "latency_ms": latency,
                "detail": "Sincronização REST e metadados do GitHub acessíveis.",
            }
        detail = f"GitHub API retornou HTTP {response.status_code}."
    except requests.RequestException:
        latency = round((time.monotonic() - started) * 1000, 1)
        detail = "Não foi possível contatar a API REST do GitHub."
    return {
        "id": "github_api",
        "name": "GitHub REST API",
        "role": "external",
        "status": "down",
        "latency_ms": latency,
        "detail": detail,
    }


def _probe_module6(timeout: int) -> dict:
    if not module6_notifications_enabled():
        return {
            "id": "module6_notifications",
            "name": "Módulo 6 · Central de Notificações",
            "role": "optional_isolated",
            "status": "not_configured",
            "latency_ms": None,
            "detail": "Envio opt-in desabilitado; eventos permanecem registrados no M2.",
        }
    parsed = urlsplit(settings.MODULE6_NOTIFICATIONS_URL)
    probe_url = f"{parsed.scheme}://{parsed.netloc}/health"
    started = time.monotonic()
    try:
        response = requests.get(probe_url, timeout=timeout)
        latency = round((time.monotonic() - started) * 1000, 1)
        if response.status_code < 500:
            return {
                "id": "module6_notifications",
                "name": "Módulo 6 · Central de Notificações",
                "role": "optional_isolated",
                "status": "up",
                "latency_ms": latency,
                "detail": "Central de notificações acessível; envio opt-in ativo.",
            }
        detail = f"Central do M6 retornou HTTP {response.status_code}; falhas são isoladas no M2."
    except requests.RequestException:
        latency = round((time.monotonic() - started) * 1000, 1)
        detail = "Central do M6 inacessível; sincronizações e webhooks do M2 continuam isolados."
    return {
        "id": "module6_notifications",
        "name": "Módulo 6 · Central de Notificações",
        "role": "optional_isolated",
        "status": "degraded",
        "latency_ms": latency,
        "detail": detail,
    }


def modules_health_report() -> dict:
    timeout = int(getattr(settings, "MODULE1_HEALTH_TIMEOUT", 3))
    started_core = time.monotonic()
    core_readiness = readiness_report()
    core_latency = round((time.monotonic() - started_core) * 1000, 1)
    core_status = "up" if core_readiness["status"] == "ready" else "down"
    core_detail = (
        "Banco, schema e criptografia AES-256-GCM operacionais."
        if core_status == "up"
        else "Uma ou mais verificações internas de prontidão falharam."
    )
    core_item = {
        "id": "module2_core",
        "name": "Módulo 2 · GitHub Sync",
        "role": "core",
        "status": core_status,
        "latency_ms": core_latency,
        "detail": core_detail,
    }

    with ThreadPoolExecutor(max_workers=4) as executor:
        f_auth = executor.submit(_probe_module1_auth, timeout)
        f_projects = executor.submit(_probe_module1_projects, timeout)
        f_github = executor.submit(_probe_github_api, timeout)
        f_m6 = executor.submit(_probe_module6, timeout)
        m1_auth = f_auth.result()
        m1_projects = f_projects.result()
        github_item = f_github.result()
        m6_item = f_m6.result()

    if settings.AI_INSIGHTS_ENABLED and settings.AI_PROVIDER_URL:
        ai_item = {
            "id": "ai_insights",
            "name": "IA Externa (Insights)",
            "role": "optional_isolated",
            "status": "configured",
            "latency_ms": None,
            "detail": f"Provedor ({settings.AI_PROVIDER_MODEL}) habilitado com fallback determinístico.",
        }
    else:
        ai_item = {
            "id": "ai_insights",
            "name": "IA Externa (Insights)",
            "role": "optional_isolated",
            "status": "not_configured",
            "latency_ms": None,
            "detail": "Motor determinístico local ativo (deterministic-v1).",
        }

    modules = [core_item, m1_auth, m1_projects, github_item, m6_item, ai_item]
    if core_item["status"] == "down":
        overall = "down"
    elif all(item["status"] == "up" for item in (core_item, m1_auth, m1_projects, github_item)):
        overall = "operational"
    else:
        overall = "degraded"

    return {
        "checked_at": datetime.now(UTC).isoformat(),
        "overall_status": overall,
        "fallback_enabled": bool(settings.MODULE1_FALLBACK_ENABLED),
        "modules": modules,
    }
