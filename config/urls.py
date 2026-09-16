from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path("", include("dashboard.urls")),

    # /admin/ exacto (sin nada más después) te manda directo al panel nuevo
    path("admin/", RedirectView.as_view(pattern_name="panel:home", permanent=False)),

    # tu panel nuevo
    path("panel/", include("panel.urls")),

    # el admin real de Django sigue vivo aquí para los formularios de
    # agregar/editar/eliminar (/admin/auditorias/auditoria/, etc.)
    path("admin/", admin.site.urls),


    path("carga/", include("carga.urls")),

    path("auditorias/", include("auditorias.urls")),
]