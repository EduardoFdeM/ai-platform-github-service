from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.github_sync.models import Branch, Contributor, PullRequest, Repository

pytestmark = pytest.mark.django_db


def test_health_check(client):
    response = client.get(reverse("health"))

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "database": "up"}


def test_commit_list_is_paginated(client):
    response = client.get(reverse("commit-list"))

    assert response.status_code == 200
    assert response.json() == {"count": 0, "next": None, "previous": None, "results": []}


def test_branch_list_filters_repository_and_hides_deleted(client):
    repo = Repository.objects.create(github_id=991, owner="owner", name="repo", webhook_secret=b"sec")
    other = Repository.objects.create(github_id=992, owner="owner", name="other", webhook_secret=b"sec")
    Branch.objects.create(repository=repo, name="main")
    Branch.objects.create(repository=repo, name="old", deleted_at=timezone.now())
    Branch.objects.create(repository=other, name="develop")

    response = client.get(reverse("branch-list"), {"repository_id": repo.pk})

    assert response.status_code == 200
    assert [item["name"] for item in response.json()["results"]] == ["main"]


def test_pull_request_list_filters_repository_state_and_author(client):
    repo = Repository.objects.create(github_id=993, owner="owner", name="repo", webhook_secret=b"sec")
    author = Contributor.objects.create(github_id=123, login="aluna")
    now = timezone.now()
    PullRequest.objects.create(
        repository=repo,
        author=author,
        number=42,
        title="Integra o módulo",
        state="open",
        opened_at=now,
        updated_at=now,
    )

    response = client.get(
        reverse("pull-request-list"),
        {"repository_id": repo.pk, "state": "open", "author": "aluna"},
    )

    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert response.json()["results"][0]["number"] == 42


def test_repository_sync_endpoint(client):
    repo = Repository.objects.create(github_id=999, owner="owner", name="repo", webhook_secret=b"sec")
    with patch("apps.github_sync.views.sync_repository_from_github", return_value=5):
        response = client.post(reverse("repository-sync", kwargs={"pk": repo.pk}))
        assert response.status_code == 200
        assert response.json()["commits_synced"] == 5
        assert response.json()["status"] == "synced"


def test_repository_sync_returns_stable_error_without_exception_detail(client):
    repo = Repository.objects.create(github_id=998, owner="owner", name="repo-error", webhook_secret=b"sec")
    with patch(
        "apps.github_sync.views.sync_repository_from_github",
        side_effect=RuntimeError("temporary failure with token=secret-value"),
    ):
        response = client.post(reverse("repository-sync", kwargs={"pk": repo.pk}))

    assert response.status_code == 500
    assert response.json() == {
        "code": "repository_sync_failed",
        "detail": "A sincronização falhou. Tente novamente mais tarde.",
    }
    assert "secret-value" not in response.content.decode()


def test_create_repository_via_github_url(client, monkeypatch):
    import base64
    monkeypatch.setenv("CREDENTIAL_MASTER_KEY", base64.urlsafe_b64encode(b"0" * 32).decode())
    fake_data = {"id": 12345, "name": "bar", "owner": {"login": "foo"}, "default_branch": "main"}
    with patch("apps.github_sync.services.github.GitHubClient.get_repository", return_value=fake_data), patch(
        "apps.github_sync.views.sync_repository_from_github", return_value=10
    ):
        response = client.post(
            reverse("repository-list"),
            {"url": "https://github.com/foo/bar", "webhook_secret": "unique-webhook-secret"},
        )
        assert response.status_code == 201
        assert response.json()["owner"] == "foo"
        assert response.json()["name"] == "bar"
        assert response.json()["initial_sync_status"] == "completed"


def test_create_repository_reports_initial_sync_failure(client, monkeypatch):
    import base64

    monkeypatch.setenv("CREDENTIAL_MASTER_KEY", base64.urlsafe_b64encode(b"0" * 32).decode())
    fake_data = {"id": 54321, "name": "bar", "owner": {"login": "foo"}, "default_branch": "main"}
    with patch("apps.github_sync.services.github.GitHubClient.get_repository", return_value=fake_data), patch(
        "apps.github_sync.views.sync_repository_from_github", side_effect=RuntimeError("temporary failure")
    ):
        response = client.post(
            reverse("repository-list"),
            {"url": "https://github.com/foo/bar", "webhook_secret": "unique-webhook-secret"},
        )

    assert response.status_code == 201
    assert response.json()["initial_sync_status"] == "failed"
    assert "sincronização inicial falhou" in response.json()["initial_sync_detail"]


def test_reject_non_github_url(client):
    response = client.post(
        reverse("repository-list"),
        {"url": "https://gitlab.com/foo/bar", "webhook_secret": "unique-webhook-secret"},
    )
    assert response.status_code == 400
    assert "github.com" in response.json()["detail"]


def test_repository_requires_unique_webhook_secret(client):
    response = client.post(reverse("repository-list"), {"url": "https://github.com/foo/bar"})

    assert response.status_code == 400
    assert "webhook_secret" in response.json()["detail"]
