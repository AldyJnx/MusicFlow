from django.contrib import admin
from .models import SyncLog, ConflictLog


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'device', 'success', 'entities_uploaded', 'entities_downloaded', 'started_at')
    list_filter = ('success',)
    search_fields = ('user__email',)
    ordering = ('-started_at',)


@admin.register(ConflictLog)
class ConflictLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'entity_type', 'resolved', 'resolution', 'created_at')
    list_filter = ('resolved', 'entity_type')
    search_fields = ('user__email',)
