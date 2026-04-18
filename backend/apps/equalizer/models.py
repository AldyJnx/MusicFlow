"""
Equalizer models for MusicFlow.
"""
from django.db import models
from django.core.exceptions import ValidationError
from apps.auth_app.models import User
from apps.library.models import Track
import uuid


class EQPreset(models.Model):
    """Preset de ecualizador (global o de usuario)."""
    REVERB_CHOICES = [
        ('none', 'None'),
        ('small_room', 'Small Room'),
        ('medium_room', 'Medium Room'),
        ('large_room', 'Large Room'),
        ('small_hall', 'Small Hall'),
        ('large_hall', 'Large Hall'),
        ('cathedral', 'Cathedral'),
        ('plate', 'Plate'),
        ('spring', 'Spring'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        null=True, blank=True, related_name='eq_presets'
    )
    name = models.CharField(max_length=100)
    is_global = models.BooleanField(default=False)

    # 10 bands: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1k, 2k, 4k, 8k, 16k
    # Values between -15 and +15 dB
    bands = models.JSONField(default=list)

    bass_boost = models.IntegerField(default=0)  # 0-100
    virtualizer = models.IntegerField(default=0)  # 0-100
    loudness = models.IntegerField(default=0)  # 0-100
    reverb_preset = models.CharField(max_length=20, choices=REVERB_CHOICES, default='none')
    reverb_amount = models.IntegerField(default=0)  # 0-100

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['user', 'is_global'])]
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({'Global' if self.is_global else self.user})"


class EQConfig(models.Model):
    """EQ configuration applied to a specific scope."""
    SCOPE_CHOICES = [
        ('global', 'Global del usuario'),
        ('playlist', 'Por playlist'),
        ('track', 'Por cancion'),
        ('segment', 'Por segmento'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='eq_configs')

    scope_type = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    scope_id = models.UUIDField(null=True, blank=True)

    preset = models.ForeignKey(
        EQPreset, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='configs'
    )

    # Custom config (if preset is null)
    bands = models.JSONField(default=list)
    bass_boost = models.IntegerField(default=0)
    virtualizer = models.IntegerField(default=0)
    loudness = models.IntegerField(default=0)
    reverb_preset = models.CharField(max_length=20, default='none')
    reverb_amount = models.IntegerField(default=0)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'scope_type', 'scope_id']),
            models.Index(fields=['user', '-updated_at']),
        ]
        unique_together = [('user', 'scope_type', 'scope_id')]

    def __str__(self):
        return f"EQ {self.scope_type} - {self.user}"


class EQSegment(models.Model):
    """EQ configuration for a time segment within a track."""
    CREATED_BY = [
        ('manual', 'Manual'),
        ('ai', 'Agente IA'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='segments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    label = models.CharField(max_length=50, blank=True)
    start_ms = models.IntegerField()
    end_ms = models.IntegerField()
    transition_ms = models.IntegerField(default=500)

    eq_config = models.OneToOneField(
        EQConfig, on_delete=models.CASCADE, related_name='segment'
    )

    created_by = models.CharField(max_length=10, choices=CREATED_BY, default='manual')
    ai_request = models.ForeignKey(
        'ai_agent.AIRequest', on_delete=models.SET_NULL,
        null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_ms']
        indexes = [
            models.Index(fields=['track', 'start_ms', 'end_ms']),
            models.Index(fields=['user', '-updated_at']),
        ]

    def clean(self):
        if self.start_ms >= self.end_ms:
            raise ValidationError("start_ms debe ser menor que end_ms")
        if self.end_ms > self.track.duration_ms:
            raise ValidationError("end_ms excede la duracion del track")

    def __str__(self):
        return f"{self.track.title} [{self.start_ms}-{self.end_ms}ms] {self.label}"
