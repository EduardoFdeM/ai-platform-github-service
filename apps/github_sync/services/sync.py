from django.db import transaction
from django.utils.dateparse import parse_datetime

from apps.github_sync.models import Branch, Commit, Contributor, ContributorEmail, Repository
from apps.github_sync.services.github import GitHubClient


def sync_repository_from_github(repository: Repository, token: str = None) -> int:
    """Sincroniza metadados e commits reais de um repositório via API oficial do GitHub (M2-111 / M2-114)."""
    client = GitHubClient(token=token)
    repo_data = client.get_repository(repository.owner, repository.name)

    default_branch_name = repo_data.get("default_branch") or repository.default_branch or "main"
    fields_to_update = []
    if repository.default_branch != default_branch_name:
        repository.default_branch = default_branch_name
        fields_to_update.append("default_branch")
    if "id" in repo_data and repository.github_id != repo_data["id"]:
        repository.github_id = repo_data["id"]
        fields_to_update.append("github_id")

    if fields_to_update:
        repository.save(update_fields=fields_to_update)

    branch, _ = Branch.objects.get_or_create(repository=repository, name=default_branch_name)

    commits_data = client.get_commits(repository.owner, repository.name, per_page=100)
    synced_count = 0
    synced_shas = set()

    with transaction.atomic():
        for item in commits_data:
            commit_info = item.get("commit") or {}
            author_info = commit_info.get("author") or {}
            gh_author = item.get("author") or {}

            login = gh_author.get("login") or author_info.get("name") or "unknown"
            display_name = author_info.get("name") or login
            email = author_info.get("email")

            contributor, _ = Contributor.objects.get_or_create(
                login=login,
                defaults={"display_name": display_name, "is_bot": login.endswith("[bot]")},
            )
            if email:
                ContributorEmail.objects.get_or_create(email=email, defaults={"contributor": contributor})

            authored_at = parse_datetime(author_info.get("date") or "")
            sha = item.get("sha")
            if not sha or not authored_at:
                continue

            url = item.get("html_url") or f"https://github.com/{repository.owner}/{repository.name}/commit/{sha}"

            Commit.objects.update_or_create(
                repository=repository,
                sha=sha,
                defaults={
                    "branch": branch,
                    "author": contributor,
                    "message": commit_info.get("message", ""),
                    "authored_at": authored_at,
                    "url": url,
                    "forced_push": False,
                },
            )
            synced_count += 1
            synced_shas.add(sha)

        # Reconciliação estrita: remove commits que não existem no GitHub para este repositório
        if synced_shas:
            Commit.objects.filter(repository=repository).exclude(sha__in=synced_shas).delete()

    return synced_count
