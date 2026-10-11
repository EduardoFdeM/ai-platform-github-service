from rest_framework import serializers

from .models import Commit, CommitFile, Repository, WebhookDelivery


class HandshakeRequestSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, max_length=255)


class RepositorySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="__str__", read_only=True)

    class Meta:
        model = Repository
        fields = ("id", "github_id", "owner", "name", "full_name", "default_branch")


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
