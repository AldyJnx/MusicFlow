from django.contrib import admin
from .models import UserPreferences


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'player_layout', 'library_layout', 'updated_at')
    search_fields = ('user__email',)
