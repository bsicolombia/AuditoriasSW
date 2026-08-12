from django.contrib import admin
from django.urls import path, include

urlpatterns = [
     path('', include('dashboard.urls')),
     path('carga/', include('carga.urls')),
     path('auditorias/', include('auditorias.urls')),
     path('reportes/', include('reportes.urls')),
]
 