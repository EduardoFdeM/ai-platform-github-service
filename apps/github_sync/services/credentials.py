from django.db import transaction
from django.utils import timezone

from ..models import CredentialAuditEvent, Repository
from .crypto import encrypt_secret


@transaction.atomic
def store_repository_credential(repo_data: dict, raw_secret: str, expires_at, actor: str) -> tuple[Repository, bool]:
    repository = Repository.objects.select_for_update().filter(github_id=repo_data["id"]).first()
    created = repository is None
    if created:
        repository = Repository(github_id=repo_data["id"], webhook_secret_version=1)
        action = CredentialAuditEvent.Action.CREATED
    else:
        repository.webhook_secret_version += 1
        action = CredentialAuditEvent.Action.ROTATED

    repository.owner = repo_data["owner"]["login"]
    repository.name = repo_data["name"]
    repository.default_branch = repo_data.get("default_branch", "main")
    repository.webhook_secret = encrypt_secret(raw_secret)
    repository.webhook_secret_rotated_at = timezone.now()
    repository.webhook_secret_expires_at = expires_at
    repository.active = True
    repository.save()

    CredentialAuditEvent.objects.create(
        repository=repository,
        action=action,
        version=repository.webhook_secret_version,
        actor=actor[:255],
        metadata={"credential": "webhook_secret", "expires": expires_at.isoformat() if expires_at else None},
    )
    return repository, created
