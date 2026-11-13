
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView
from django.conf import settings
from django.views.static import serve

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

    # Administración de Django
    path("admin/", admin.site.urls),
]

# Servir archivos multimedia
urlpatterns += [
    re_path(
        r"^media/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
]
