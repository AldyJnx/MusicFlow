from django.contrib import admin
from .models import Track, Playlist, PlaylistTrack


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'album', 'user', 'source', 'sync_status', 'created_at')
    list_filter = ('source', 'sync_status', 'genre')
    search_fields = ('title', 'artist', 'album', 'user__email')
    ordering = ('-created_at',)


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_public', 'created_at')
    list_filter = ('is_public',)
    search_fields = ('name', 'user__email')


@admin.register(PlaylistTrack)
class PlaylistTrackAdmin(admin.ModelAdmin):
    list_display = ('playlist', 'track', 'position')
    list_filter = ('playlist',)
