"""
Sync models for MusicFlow.
"""
from django.db import models
from apps.auth_app.models import User, Device
import uuid


class SyncLog(models.Model):
    """Synchronization log for debugging and auditing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    device = models.ForeignKey(Device, on_delete=models.CASCADE)

    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    entities_uploaded = models.IntegerField(default=0)
    entities_downloaded = models.IntegerField(default=0)
    conflicts_detected = models.IntegerField(default=0)

    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        status = 'OK' if self.success else 'FAILED'
        return f"Sync {self.user.email} - {status} ({self.started_at})"


class ConflictLog(models.Model):
    """Sync conflicts for manual resolution."""
    RESOLUTIONS = [
        ('local_wins', 'Local Wins'),
        ('server_wins', 'Server Wins'),
        ('merge', 'Merge'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    entity_type = models.CharField(max_length=50)
    entity_id = models.UUIDField()

    local_version = models.JSONField()
    server_version = models.JSONField()

    resolved = models.BooleanField(default=False)
    resolution = models.CharField(max_length=20, choices=RESOLUTIONS, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = 'Resolved' if self.resolved else 'Pending'
        return f"Conflict {self.entity_type} - {status}"
