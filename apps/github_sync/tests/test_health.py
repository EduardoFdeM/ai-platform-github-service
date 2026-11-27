import base64
from unittest.mock import Mock, patch

import requests
from django.urls import reverse

from apps.github_sync.services.health import crypto_check, readiness_report


def test_crypto_check_never_exposes_key(monkeypatch):
    monkeypatch.setenv("CREDENTIAL_MASTER_KEY", "invalid-secret-value")

    result = crypto_check()

    assert result == {"status": "down", "detail": "credential master key is missing or invalid"}
    assert "invalid-secret-value" not in str(result)


def test_eager_readiness_does_not_require_broker(monkeypatch, settings, db):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    monkeypatch.setenv("CREDENTIAL_MASTER_KEY", base64.urlsafe_b64encode(b"0" * 32).decode())

    report = readiness_report()

    assert report["status"] == "ready"
    assert report["checks"]["schema"]["status"] == "up"
    assert report["checks"]["redis"]["status"] == "not_required"
    assert report["checks"]["worker"]["status"] == "not_required"


def test_modules_health_reports_operational_and_degraded_states(client, monkeypatch, settings, db):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.MODULE1_FALLBACK_ENABLED = True
    settings.MODULE6_NOTIFICATIONS_ENABLED = False
    settings.AI_INSIGHTS_ENABLED = False
    monkeypatch.setenv("CREDENTIAL_MASTER_KEY", base64.urlsafe_b64encode(b"0" * 32).decode())

    ok_response = Mock(status_code=200)
    with patch("apps.github_sync.services.health.requests.get", return_value=ok_response):
        res_ok = client.get(reverse("modules-health"))

    assert res_ok.status_code == 200
    payload_ok = res_ok.json()
    assert payload_ok["overall_status"] == "operational"
    assert payload_ok["fallback_enabled"] is True
    assert len(payload_ok["modules"]) == 6

    def fail_module1(url, **_kwargs):
        if "mod1-" in url or "jwks" in url or "/projects" in url:
            raise requests.ConnectTimeout("timeout")
        return ok_response

    with patch("apps.github_sync.services.health.requests.get", side_effect=fail_module1):
        res_deg = client.get(reverse("modules-health"))

    assert res_deg.status_code == 200
    payload_deg = res_deg.json()
    assert payload_deg["overall_status"] == "degraded"
    statuses = {item["id"]: item["status"] for item in payload_deg["modules"]}
    assert statuses["module2_core"] == "up"
    assert statuses["module1_auth"] == "down"
    assert statuses["module1_projects"] == "down"
    assert statuses["github_api"] == "up"
