from django.contrib import admin
from .models import AIRequest


@admin.register(AIRequest)
class AIRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'track', 'was_accepted', 'feedback', 'cost_usd', 'created_at')
    list_filter = ('was_accepted', 'feedback', 'applied_to')
    search_fields = ('user__email', 'prompt')
    readonly_fields = ('tokens_input', 'tokens_output', 'cost_usd', 'response_time_ms')
    ordering = ('-created_at',)
