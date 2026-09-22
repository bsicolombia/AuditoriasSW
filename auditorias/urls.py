from django.urls import path
from . import views

urlpatterns = [
    path('reauditar', views.reauditar, name='reauditar'),
    path('estadistica', views.estadistica, name='estadistica'),
    path('consulta', views.consulta, name='consulta'),
    path("exportar-excel/",views.exportar_excel, name="exportar-excel"),
    path("nueva/",views.auditoria_manual_crear,name="auditoria_manual_crear",),
    path("<int:pk>/editar/",views.auditoria_manual_editar,name="auditoria_manual_editar",),
    path("<int:pk>/eliminar/",views.auditoria_manual_eliminar,name="auditoria_manual_eliminar",),
    path("ver-foto/<str:numero_orden>/",views.ver_foto_auditoria,name="ver_foto_auditoria",),

]