from django.urls import path
from . import views

urlpatterns = [
    path("", views.carga, name="carga"),
    path("auditoria-crear/",views.auditoria_crear,name="auditoria_crear"),
    path("errores/pdf/",views.generar_pdf_errores,name="reporte_errores_pdf"),
    path("tecnicos/crear/",views.tecnicos_crear,name="tecnicos_crear",)
    
]