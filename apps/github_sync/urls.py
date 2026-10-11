from django.urls import path

from .views import (
    CommitListView,
    RepositoryListView,
    WebhookDeliveryListView,
    dashboard_metrics,
    flow_metrics,
    github_connectivity,
    github_handshake,
    github_webhook,
    health,
)

urlpatterns = [
    path("health", health, name="health"),
    path("health/github-connectivity", github_connectivity, name="github-connectivity"),
    path("github/handshake", github_handshake, name="github-handshake"),
    path("repositories", RepositoryListView.as_view(), name="repository-list"),
    path("webhooks/github", github_webhook, name="github-webhook"),
    path("webhooks/deliveries", WebhookDeliveryListView.as_view(), name="webhook-deliveries"),
    path("commits", CommitListView.as_view(), name="commit-list"),
    path("metrics/flow", flow_metrics, name="flow-metrics"),
    path("metrics/dashboard", dashboard_metrics, name="dashboard-metrics"),
]
