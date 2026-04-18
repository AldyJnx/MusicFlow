from django.contrib import admin
from .models import PlayHistory, ListeningStats


@admin.register(PlayHistory)
class PlayHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'track', 'device', 'completed', 'played_at')
    list_filter = ('device', 'completed', 'skipped')
    search_fields = ('user__email', 'track__title')
    ordering = ('-played_at',)


@admin.register(ListeningStats)
class ListeningStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'period', 'period_start', 'total_plays', 'computed_at')
    list_filter = ('period',)
    search_fields = ('user__email',)
