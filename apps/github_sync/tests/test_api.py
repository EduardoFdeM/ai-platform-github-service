from unittest.mock import patch

import pytest
from django.urls import reverse

from apps.github_sync.models import Repository

pytestmark = pytest.mark.django_db


def test_health_check(client):
    response = client.get(reverse("health"))

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "database": "up"}


def test_commit_list_is_paginated(client):
    response = client.get(reverse("commit-list"))

    assert response.status_code == 200
    assert response.json() == {"count": 0, "next": None, "previous": None, "results": []}


def test_repository_sync_endpoint(client):
    repo = Repository.objects.create(github_id=999, owner="owner", name="repo", webhook_secret=b"sec")
    with patch("apps.github_sync.views.sync_repository_from_github", return_value=5):
        response = client.post(reverse("repository-sync", kwargs={"pk": repo.pk}))
        assert response.status_code == 200
        assert response.json()["commits_synced"] == 5
        assert response.json()["status"] == "synced"


def test_create_repository_via_github_url(client, monkeypatch):
    import base64
    monkeypatch.setenv("CREDENTIAL_MASTER_KEY", base64.urlsafe_b64encode(b"0" * 32).decode())
    fake_data = {"id": 12345, "name": "bar", "owner": {"login": "foo"}, "default_branch": "main"}
    with patch("apps.github_sync.services.github.GitHubClient.get_repository", return_value=fake_data), patch(
        "apps.github_sync.views.sync_repository_from_github", return_value=10
    ):
        response = client.post(reverse("repository-list"), {"url": "https://github.com/foo/bar"})
        assert response.status_code == 201
        assert response.json()["owner"] == "foo"
        assert response.json()["name"] == "bar"


def test_reject_non_github_url(client):
    response = client.post(reverse("repository-list"), {"url": "https://gitlab.com/foo/bar"})
    assert response.status_code == 400
    assert "github.com" in response.json()["detail"]
