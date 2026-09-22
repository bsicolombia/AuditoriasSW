from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", include("dashboard.urls")),

    # /admin/ manda al panel nuevo
    path(
        "admin/",
        RedirectView.as_view(
            pattern_name="panel:home",
            permanent=False
        )
    ),

    # Panel nuevo
    path("panel/", include("panel.urls")),

    # Carga
    path("carga/", include("carga.urls")),

    # Auditorías
    path("auditorias/", include("auditorias.urls")),
    
    path("admin/", admin.site.urls),

]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
