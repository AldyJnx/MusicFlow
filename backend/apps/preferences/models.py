"""
User preferences models for MusicFlow.
"""
from django.db import models
from apps.auth_app.models import User


class UserPreferences(models.Model):
    """User preferences and settings."""
    PLAYER_LAYOUTS = [
        ('compact', 'Compact'),
        ('standard', 'Standard'),
        ('expanded', 'Expanded'),
        ('minimal', 'Minimal'),
    ]
    LIBRARY_LAYOUTS = [
        ('list', 'List'),
        ('grid', 'Grid'),
        ('card', 'Card'),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE,
        primary_key=True, related_name='preferences'
    )

    # Visual theme
    theme = models.CharField(max_length=30, default='dark_default')
    dynamic_theme_enabled = models.BooleanField(default=False)
    dynamic_theme_intensity = models.IntegerField(default=50)

    # Layouts
    player_layout = models.CharField(max_length=10, choices=PLAYER_LAYOUTS, default='standard')
    library_layout = models.CharField(max_length=10, choices=LIBRARY_LAYOUTS, default='list')
    show_album_art = models.BooleanField(default=True)
    show_visualizer = models.BooleanField(default=False)
    visualizer_type = models.CharField(max_length=20, default='bars')

    # Playback
    crossfade_enabled = models.BooleanField(default=False)
    crossfade_duration_ms = models.IntegerField(default=3000)
    gapless_enabled = models.BooleanField(default=True)
    replay_gain = models.BooleanField(default=False)
    skip_silence = models.BooleanField(default=False)

    # Sleep timer
    sleep_timer_default_min = models.IntegerField(null=True, blank=True)
    sleep_timer_fade_out = models.BooleanField(default=True)

    # Scrobbling
    lastfm_username = models.CharField(max_length=100, blank=True)
    lastfm_session_key = models.CharField(max_length=255, blank=True)
    scrobble_enabled = models.BooleanField(default=False)
    scrobble_threshold = models.IntegerField(default=50)

    # Lyrics
    lyrics_font_size = models.IntegerField(default=16)
    lyrics_auto_scroll = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences - {self.user.email}"
