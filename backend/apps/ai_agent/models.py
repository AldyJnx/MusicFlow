"""
AI Agent models for MusicFlow.
"""
from django.db import models
from apps.auth_app.models import User
from apps.library.models import Track
import uuid


class AIRequest(models.Model):
    """Log of AI agent requests and responses."""
    APPLIED_TO = [
        ('global', 'Global'),
        ('playlist', 'Playlist'),
        ('track', 'Track'),
        ('segment', 'Segmento'),
    ]
    FEEDBACK = [
        ('good', 'Buena'),
        ('bad', 'Mala'),
        ('neutral', 'Neutral'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_requests')
    track = models.ForeignKey(Track, on_delete=models.SET_NULL, null=True, blank=True)

    prompt = models.TextField()
    context = models.JSONField(default=dict)
    response = models.JSONField(default=dict)
    explanation = models.TextField(blank=True)

    applied_to = models.CharField(max_length=10, choices=APPLIED_TO, null=True, blank=True)
    applied_id = models.UUIDField(null=True, blank=True)

    was_accepted = models.BooleanField(default=False)
    feedback = models.CharField(max_length=10, choices=FEEDBACK, null=True, blank=True)
    feedback_comment = models.TextField(blank=True)

    tokens_input = models.IntegerField(default=0)
    tokens_output = models.IntegerField(default=0)
    cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    response_time_ms = models.IntegerField(default=0)
    model_used = models.CharField(max_length=50, default='claude-sonnet-4-20250514')

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['feedback', '-created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Request {self.id} - {self.user.email}"
