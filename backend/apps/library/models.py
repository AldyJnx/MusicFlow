"""
Track and Playlist models for MusicFlow.
"""
from django.db import models
from apps.auth_app.models import User
import uuid


class Track(models.Model):
    """Audio track with metadata and hybrid storage support."""
    SOURCE_CHOICES = [
        ('local', 'Local'),
        ('synced', 'Sincronizado'),
        ('both', 'Ambos'),
    ]
    SYNC_STATUS = [
        ('pending', 'Pendiente'),
        ('synced', 'Sincronizado'),
        ('failed', 'Fallido'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tracks')

    # Metadata
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255, db_index=True)
    album = models.CharField(max_length=255, db_index=True, blank=True)
    album_artist = models.CharField(max_length=255, blank=True)
    genre = models.CharField(max_length=100, blank=True, db_index=True)
    year = models.IntegerField(null=True, blank=True)
    track_number = models.IntegerField(null=True, blank=True)
    disc_number = models.IntegerField(null=True, blank=True)
    composer = models.CharField(max_length=255, blank=True)
    comment = models.TextField(blank=True)
    duration_ms = models.IntegerField()

    # Files
    file_path_local = models.CharField(max_length=500, null=True, blank=True)
    file_url_remote = models.URLField(null=True, blank=True)
    file_hash = models.CharField(max_length=64, db_index=True)
    file_size_bytes = models.BigIntegerField(null=True)
    codec = models.CharField(max_length=20, blank=True)
    bitrate = models.IntegerField(null=True)
    sample_rate = models.IntegerField(null=True)
    cover_art = models.ImageField(upload_to='covers/', null=True, blank=True)

    # Hybrid storage
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='local')
    sync_status = models.CharField(max_length=10, choices=SYNC_STATUS, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'file_hash']),
            models.Index(fields=['user', 'sync_status']),
            models.Index(fields=['user', '-updated_at']),
        ]
        unique_together = [('user', 'file_hash')]
        ordering = ['artist', 'album', 'track_number']

    def __str__(self):
        return f"{self.artist} - {self.title}"


class Playlist(models.Model):
    """User playlist with tracks."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playlists')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    cover_art = models.ImageField(upload_to='playlist_covers/', null=True, blank=True)
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=32, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tracks = models.ManyToManyField(Track, through='PlaylistTrack', related_name='playlists')

    class Meta:
        indexes = [models.Index(fields=['user', '-updated_at'])]
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.user.email})"


class PlaylistTrack(models.Model):
    """Through model for playlist-track relationship."""
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    position = models.IntegerField()
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position']
        unique_together = [('playlist', 'track')]

    def __str__(self):
        return f"{self.playlist.name} - {self.track.title} (pos {self.position})"
