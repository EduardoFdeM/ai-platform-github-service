from rest_framework import serializers

from .models import Branch, Commit, CommitFile, PullRequest, Repository, WebhookDelivery


class HandshakeRequestSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, max_length=255)


class ErrorSerializer(serializers.Serializer):
    code = serializers.CharField()
    detail = serializers.CharField()


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField(help_text="healthy ou unhealthy")
    database = serializers.CharField(help_text="up ou down")


class GitHubConnectivitySerializer(serializers.Serializer):
    status = serializers.CharField(help_text="up ou down")
    latency_ms = serializers.FloatField()
    github_status = serializers.IntegerField(required=False)
    detail = serializers.CharField(required=False)


class HandshakeResponseSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    login = serializers.CharField(required=False, allow_null=True)
    name = serializers.CharField(required=False, allow_null=True)
    avatar_url = serializers.URLField(required=False, allow_null=True)
    scopes = serializers.ListField(child=serializers.CharField(), required=False)
    detail = serializers.CharField(required=False)


class RepositoryCreateRequestSerializer(serializers.Serializer):
    url = serializers.CharField(required=False, allow_blank=True)
    repository_url = serializers.CharField(required=False, allow_blank=True)
    owner = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField(required=False, allow_blank=True)
    token = serializers.CharField(required=False, allow_blank=True, write_only=True)
    webhook_secret = serializers.CharField(min_length=16, write_only=True)


class RepositorySyncRequestSerializer(serializers.Serializer):
    token = serializers.CharField(required=False, allow_blank=True, write_only=True)


class RepositorySyncResponseSerializer(serializers.Serializer):
    status = serializers.CharField(help_text="synced")
    repository = serializers.CharField()
    commits_synced = serializers.IntegerField(min_value=0)


class FlowMetricAuthorSerializer(serializers.Serializer):
    author__login = serializers.CharField(allow_null=True)
    commits = serializers.IntegerField(min_value=0)


class FlowMetricsSerializer(serializers.Serializer):
    total_commits = serializers.IntegerField(min_value=0)
    commits_by_author = FlowMetricAuthorSerializer(many=True)


class DashboardRepositorySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class DashboardRecentItemSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=("Commit", "Push", "PR"))
    title = serializers.CharField()
    detail = serializers.CharField()
    at = serializers.DateTimeField()
    url = serializers.URLField(allow_blank=True)


class DashboardMetricsSerializer(serializers.Serializer):
    repository = DashboardRepositorySerializer()
    period_days = serializers.IntegerField()
    since = serializers.DateTimeField()
    until = serializers.DateTimeField()
    total_commits = serializers.IntegerField(min_value=0)
    total_pushes = serializers.IntegerField(min_value=0)
    prs_opened = serializers.IntegerField(min_value=0)
    prs_merged = serializers.IntegerField(min_value=0)
    prs_open = serializers.IntegerField(min_value=0)
    prs_overdue = serializers.IntegerField(min_value=0)
    sla_hours = serializers.FloatField()
    sla_on_time = serializers.IntegerField(min_value=0)
    sla_percent = serializers.IntegerField(allow_null=True)
    median_merge_hours = serializers.FloatField(allow_null=True)
    last_processed_at = serializers.DateTimeField(allow_null=True)
    processing_within_2m_percent = serializers.IntegerField(allow_null=True)
    failed_deliveries = serializers.IntegerField(min_value=0)
    recent = DashboardRecentItemSerializer(many=True)


class RepositorySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="__str__", read_only=True)

    class Meta:
        model = Repository
        fields = ("id", "github_id", "owner", "name", "full_name", "default_branch")


class RepositoryCreateResponseSerializer(RepositorySerializer):
    initial_sync_status = serializers.CharField(help_text="completed ou failed")
    initial_sync_detail = serializers.CharField(required=False)

    class Meta(RepositorySerializer.Meta):
        fields = (*RepositorySerializer.Meta.fields, "initial_sync_status", "initial_sync_detail")


class WebhookDeliverySerializer(serializers.ModelSerializer):
    ref = serializers.SerializerMethodField()
    commits_count = serializers.SerializerMethodField()

    class Meta:
        model = WebhookDelivery
        fields = (
            "delivery_id",
            "event",
            "status",
            "attempts",
            "error",
            "received_at",
            "processed_at",
            "ref",
            "commits_count",
        )

    def get_ref(self, obj) -> str:
        return (obj.payload or {}).get("ref", "").removeprefix("refs/heads/")

    def get_commits_count(self, obj) -> int:
        return len((obj.payload or {}).get("commits") or [])


class CommitFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommitFile
        fields = ("path", "change_type")


class CommitSerializer(serializers.ModelSerializer):
    repository = serializers.StringRelatedField()
    branch = serializers.SlugRelatedField(read_only=True, slug_field="name")
    author = serializers.SlugRelatedField(read_only=True, slug_field="login")
    files = CommitFileSerializer(many=True, read_only=True)

    class Meta:
        model = Commit
        fields = ("sha", "repository", "branch", "author", "message", "authored_at", "url", "forced_push", "files")


class BranchSerializer(serializers.ModelSerializer):
    repository = serializers.StringRelatedField()

    class Meta:
        model = Branch
        fields = ("id", "repository", "name", "deleted_at")


class PullRequestSerializer(serializers.ModelSerializer):
    repository = serializers.StringRelatedField()
    author = serializers.SlugRelatedField(read_only=True, slug_field="login")

    class Meta:
        model = PullRequest
        fields = (
            "id",
            "repository",
            "number",
            "title",
            "state",
            "author",
            "opened_at",
            "closed_at",
            "merged_at",
            "updated_at",
        )
