from unittest.mock import Mock, call, patch

from apps.github_sync.services.github import GitHubClient


def test_handshake_returns_user_and_oauth_scopes(settings):
    settings.GITHUB_API_URL = "https://github.example/api/v3"
    settings.GITHUB_CA_BUNDLE = "/certs/ca.pem"
    response = Mock()
    response.headers = {
        "X-OAuth-Scopes": "repo:status, read:org",
        "X-RateLimit-Remaining": "10",
    }
    response.json.return_value = {"login": "student"}
    client = GitHubClient(token="token")
    client.session.get = Mock(return_value=response)

    user, scopes = client.handshake()

    assert user == {"login": "student"}
    assert scopes == {"repo:status", "read:org"}
    assert client.session.headers["Authorization"] == "Bearer token"
    client.session.get.assert_called_once_with(
        "https://github.example/api/v3/user",
        params=None,
        timeout=10,
        verify="/certs/ca.pem",
    )
    response.raise_for_status.assert_called_once()


def test_get_repository_returns_github_payload():
    client = GitHubClient()
    response = Mock()
    response.json.return_value = {"id": 42, "name": "service"}
    client.get = Mock(return_value=response)

    result = client.get_repository("team", "service")

    assert result == {"id": 42, "name": "service"}
    client.get.assert_called_once_with("/repos/team/service")


def test_repository_resource_wrappers_use_expected_github_routes():
    client = GitHubClient()
    client.get_paginated = Mock(side_effect=[[{"name": "main"}], [{"number": 7}]])
    response = Mock()
    response.json.return_value = {"sha": "a" * 40, "files": []}
    client.get = Mock(return_value=response)

    branches = client.get_branches("team", "service")
    pull_requests = client.get_pull_requests("team", "service")
    commit = client.get_commit("team", "service", "a" * 40)

    assert branches == [{"name": "main"}]
    assert pull_requests == [{"number": 7}]
    assert commit["sha"] == "a" * 40
    assert client.get_paginated.call_args_list == [
        call("/repos/team/service/branches", per_page=100),
        call(
            "/repos/team/service/pulls",
            params={"state": "all", "sort": "updated", "direction": "desc"},
            per_page=100,
        ),
    ]
    client.get.assert_called_once_with(f"/repos/team/service/commits/{'a' * 40}")


def test_get_commits_paginates_with_since_and_stops_at_200():
    client = GitHubClient()
    first = Mock()
    first.json.return_value = [{"sha": f"a{i}"} for i in range(100)]
    second = Mock()
    second.json.return_value = [{"sha": f"b{i}"} for i in range(100)]
    client.get = Mock(side_effect=[first, second])

    commits = client.get_commits("team", "service", since="2026-10-01T00:00:00Z")

    assert len(commits) == 200
    assert client.get.call_args_list == [
        call(
            "/repos/team/service/commits",
            params={"per_page": 100, "page": 1, "since": "2026-10-01T00:00:00Z"},
        ),
        call(
            "/repos/team/service/commits",
            params={"per_page": 100, "page": 2, "since": "2026-10-01T00:00:00Z"},
        ),
    ]


def test_get_waits_until_rate_limit_reset(settings):
    settings.GITHUB_API_URL = "https://api.github.test"
    response = Mock()
    response.headers = {"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "110"}
    client = GitHubClient()
    client.session.get = Mock(return_value=response)
    clock = Mock()
    clock.time.return_value = 100

    with patch("apps.github_sync.services.github.time", clock):
        client.get("/meta")

    clock.sleep.assert_called_once_with(10)
    response.raise_for_status.assert_called_once()
