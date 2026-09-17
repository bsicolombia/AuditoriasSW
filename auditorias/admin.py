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

# auditorias/admin.py
#
# Esto hace que, al editar un usuario en /admin/auth/user/,
# aparezca un campo "Número de cédula" justo ahí, sin tener
# que ir a otra pantalla.

from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import PerfilUsuario


class PerfilUsuarioInline(admin.StackedInline):
    model = PerfilUsuario
    can_delete = False
    verbose_name_plural = "Cédula del auditor"


class UserAdmin(DjangoUserAdmin):
    inlines = (PerfilUsuarioInline,)


# Solo si User no está ya registrado con otro admin personalizado
admin.site.unregister(User)
admin.site.register(User, UserAdmin)