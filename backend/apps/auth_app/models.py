"""
User and Device models for MusicFlow.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """Custom user model with UUID and role support."""
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('client', 'Cliente'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_premium = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        indexes = [models.Index(fields=['email', 'role'])]

    def __str__(self):
        return self.email


class Device(models.Model):
    """Registered devices for multi-device sync."""
    DEVICE_TYPES = [
        ('desktop_win', 'Desktop Windows'),
        ('desktop_mac', 'Desktop macOS'),
        ('desktop_linux', 'Desktop Linux'),
        ('web', 'Web Browser'),
        ('mobile_android', 'Mobile Android'),
        ('mobile_ios', 'Mobile iOS'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    device_name = models.CharField(max_length=100)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    fcm_token = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.device_name}"
