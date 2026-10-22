import hmac

from django.conf import settings
from rest_framework.permissions import SAFE_METHODS, BasePermission


class ModuleWritePermission(BasePermission):
    """Compatibility gate until the platform-wide JWT contract is delivered by Module 1."""

    message = "Autenticação é obrigatória para alterar dados deste módulo."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS or not settings.MODULE_ENFORCE_WRITE_AUTH:
            return True
        if request.user and request.user.is_authenticated:
            return True
        configured_key = settings.MODULE_API_KEY
        supplied_key = request.headers.get("X-Module-API-Key", "")
        return bool(configured_key and supplied_key and hmac.compare_digest(configured_key, supplied_key))
