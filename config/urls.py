from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.github_sync.views import github_webhook


def spa_index_view(request):
    index_file = settings.BASE_DIR / "frontend" / "dist" / "index.html"
    if index_file.exists():
        return HttpResponse(index_file.read_text(encoding="utf-8"), content_type="text/html")
    return HttpResponse("Frontend build not found.", status=404)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("webhooks/github", github_webhook, name="github-webhook-unversioned"),
    path("api/v1/", include("apps.github_sync.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    re_path(r"^(?!api/|docs/|admin/|webhooks/|static/).*$", spa_index_view, name="spa-index"),
]
