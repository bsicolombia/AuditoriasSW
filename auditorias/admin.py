from django.apps import apps
from django.contrib import admin


# =========================================================
# REGISTRAR MODELOS DE AUDITORIAS
# =========================================================

app = apps.get_app_config("auditorias")

for model in app.get_models():

    try:
        admin.site.register(model)

    except admin.sites.AlreadyRegistered:
        pass


# =========================================================
# REGISTRAR MODELOS DE CARGA
# =========================================================

app = apps.get_app_config("carga")

for model in app.get_models():

    try:
        admin.site.register(model)

    except admin.sites.AlreadyRegistered:
        pass


# =========================================================
# CONFIGURACIÓN DEL ADMIN
# =========================================================

admin.site.site_header = "AuditoríasSW"

admin.site.site_title = "AuditoríasSW"

admin.site.index_title = "Panel administrativo"

admin.site.site_url = "/index/"

admin.site.enable_nav_sidebar = True