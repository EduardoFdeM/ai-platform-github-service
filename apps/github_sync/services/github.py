import time

import requests
from django.conf import settings


class GitHubClient:
    def __init__(self, token=None):
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"

    def get(self, path, params=None):
        response = self.session.get(
            f"{settings.GITHUB_API_URL.rstrip('/')}/{path.lstrip('/')}",
            params=params,
            timeout=settings.GITHUB_HTTP_TIMEOUT,
            verify=settings.GITHUB_CA_BUNDLE,
        )
        remaining = int(response.headers.get("X-RateLimit-Remaining", "1"))
        if remaining == 0:
            reset_at = int(response.headers.get("X-RateLimit-Reset", "0"))
            time.sleep(max(0, reset_at - int(time.time())))
        response.raise_for_status()
        return response

    def handshake(self):
        response = self.get("/user")
        scopes = {scope.strip() for scope in response.headers.get("X-OAuth-Scopes", "").split(",") if scope.strip()}
        return response.json(), scopes

    def get_repository(self, owner: str, name: str) -> dict:
        return self.get(f"/repos/{owner}/{name}").json()

    def get_paginated(self, path: str, params: dict | None = None, per_page: int = 100, limit: int = 200) -> list:
        items_found = []
        page = 1
        while True:
            page_params = {**(params or {}), "per_page": per_page, "page": page}
            response = self.get(path, params=page_params)
            items = response.json()
            if not items or not isinstance(items, list):
                break
            items_found.extend(items)
            if len(items) < per_page or len(items_found) >= limit:
                break
            page += 1
        return items_found[:limit]

    def get_commits(self, owner: str, name: str, since: str = None, per_page: int = 100) -> list:
        params = {}
        if since:
            params["since"] = since
        return self.get_paginated(f"/repos/{owner}/{name}/commits", params=params, per_page=per_page)

    def get_branches(self, owner: str, name: str, per_page: int = 100) -> list:
        return self.get_paginated(f"/repos/{owner}/{name}/branches", per_page=per_page)

    def get_pull_requests(self, owner: str, name: str, per_page: int = 100) -> list:
        return self.get_paginated(
            f"/repos/{owner}/{name}/pulls",
            params={"state": "all", "sort": "updated", "direction": "desc"},
            per_page=per_page,
        )

    def get_commit(self, owner: str, name: str, sha: str) -> dict:
        return self.get(f"/repos/{owner}/{name}/commits/{sha}").json()
