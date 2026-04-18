"""
URL configuration for MusicFlow project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1
    path('api/auth/', include('apps.auth_app.urls')),
    path('api/library/', include('apps.library.urls')),
    path('api/equalizer/', include('apps.equalizer.urls')),
    path('api/ai/', include('apps.ai_agent.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/sync/', include('apps.sync.urls')),
    path('api/preferences/', include('apps.preferences.urls')),
    path('api/admin-dashboard/', include('apps.admin_dashboard.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    # Debug toolbar
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
