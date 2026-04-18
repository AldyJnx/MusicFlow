from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Device


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'is_premium', 'is_active', 'created_at')
    list_filter = ('role', 'is_premium', 'is_active', 'is_staff')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('MusicFlow', {'fields': ('role', 'is_premium', 'avatar')}),
    )


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_name', 'device_type', 'is_active', 'last_sync_at')
    list_filter = ('device_type', 'is_active')
    search_fields = ('user__email', 'device_name')
