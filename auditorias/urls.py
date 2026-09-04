from django.urls import path
from . import views

urlpatterns = [
    path('reauditar', views.reauditar, name='reauditar'),
    path('estadistica', views.estadistica, name='estadistica'),
    path('consulta', views.consulta, name='consulta'),
    path("consulta/pdf/", views.generate_pdf, name="generar_pdf"),
    path("exportar-excel/",views.exportar_excel, name="exportar-excel"),
    path("exportar-estadisticas/",views.exportar_estadisticas,name="exportar-estadisticas"),
]