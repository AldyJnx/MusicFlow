from django.contrib import admin
from .models import EQPreset, EQConfig, EQSegment


@admin.register(EQPreset)
class EQPresetAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_global', 'created_at')
    list_filter = ('is_global',)
    search_fields = ('name', 'user__email')


@admin.register(EQConfig)
class EQConfigAdmin(admin.ModelAdmin):
    list_display = ('user', 'scope_type', 'is_active', 'preset', 'updated_at')
    list_filter = ('scope_type', 'is_active')
    search_fields = ('user__email',)


@admin.register(EQSegment)
class EQSegmentAdmin(admin.ModelAdmin):
    list_display = ('track', 'label', 'start_ms', 'end_ms', 'created_by')
    list_filter = ('created_by',)
    search_fields = ('track__title', 'label')
