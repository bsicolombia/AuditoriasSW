from .models import Auditoria
from django.db.models import Count
from django.db.models.functions import TruncDate

def estadisticas(request):
    estadisticas_tecnico = list(Auditoria.objects.values("nombre_tecnico").annotate(total=Count("id")).order_by("-total"))
    cantidad_tecnicos = len(estadisticas_tecnico)
    estadisticas_dia = Auditoria.objects.annotate(dia=TruncDate("fecha")).values("dia").annotate(total=Count("id")).order_by("dia")
    
    
    
    return {
        "Cantidad": Auditoria.objects.count(),
        "Suspensiones": Auditoria.objects.filter(tipo_operacion="DC00").count(),
        "Reconexiones": Auditoria.objects.filter(tipo_operacion="RC00").count(),
        "Zvcl": Auditoria.objects.filter(tipo_operacion="ZVCL").count(),
        "Estadisticas_Tecnico": estadisticas_tecnico,
        "Cantidad_Tecnicos": cantidad_tecnicos,
        "Auditoria_Dia": estadisticas_dia,
        
    }
    
