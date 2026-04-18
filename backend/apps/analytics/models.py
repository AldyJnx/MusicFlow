"""
Analytics models for MusicFlow.
"""
from django.db import models
from apps.auth_app.models import User
from apps.library.models import Track
from apps.equalizer.models import EQConfig
import uuid


class PlayHistory(models.Model):
    """Play history tracking."""
    DEVICES = [
        ('desktop', 'Desktop'),
        ('web', 'Web'),
        ('mobile', 'Mobile'),
        ('auto', 'Auto'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='play_history')
    track = models.ForeignKey(Track, on_delete=models.CASCADE)

    played_at = models.DateTimeField(db_index=True)
    duration_listened_ms = models.IntegerField()
    completed = models.BooleanField(default=False)
    skipped = models.BooleanField(default=False)

    eq_config_used = models.ForeignKey(
        EQConfig, on_delete=models.SET_NULL, null=True, blank=True
    )
    device = models.CharField(max_length=10, choices=DEVICES)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-played_at']),
            models.Index(fields=['track', '-played_at']),
        ]
        ordering = ['-played_at']

    def __str__(self):
        return f"{self.user.email} - {self.track.title} ({self.played_at})"


class ListeningStats(models.Model):
    """Pre-computed listening statistics."""
    PERIODS = [
        ('day', 'Dia'),
        ('week', 'Semana'),
        ('month', 'Mes'),
        ('all_time', 'Todo el tiempo'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stats')
    period = models.CharField(max_length=10, choices=PERIODS)
    period_start = models.DateField()

    total_plays = models.IntegerField(default=0)
    total_time_ms = models.BigIntegerField(default=0)
    unique_tracks = models.IntegerField(default=0)
    unique_artists = models.IntegerField(default=0)

    top_tracks = models.JSONField(default=list)
    top_artists = models.JSONField(default=list)
    top_albums = models.JSONField(default=list)
    top_eq_presets = models.JSONField(default=list)

    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'period', 'period_start')]
        indexes = [models.Index(fields=['user', 'period', '-period_start'])]

    def __str__(self):
        return f"{self.user.email} - {self.period} ({self.period_start})"
