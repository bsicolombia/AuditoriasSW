from .models import Auditoria
from django.db.models import Count

def estadisticas(request):
    estadisticas_tecnico = list(Auditoria.objects.values("nombre_tecnico").annotate(total=Count("id")).order_by("-total"))
    cantidad_tecnicos = len(estadisticas_tecnico)
    estadisticas_dia = list(Auditoria.objects.values("fecha_operacion").annotate(total=Count("id")).order_by("fecha_operacion"))
    datos_no_cumplen = list(Auditoria.objects.filter(resultado_auditoria="no_cumple").values("fecha_operacion").annotate(total=Count("id")).order_by("fecha_operacion"))
    estadisticas_hallazgos_tecnico = list(Auditoria.objects.filter(resultado_auditoria="no_cumple")
        .values("nombre_tecnico","fecha_operacion").annotate(total=Count("id")).order_by("fecha_operacion","-total"))
    errores_por_tecnicos = list(Auditoria.objects.filter(resultado_auditoria="no_cumple").exclude(nombre_tecnico__isnull=True)
        .exclude(nombre_tecnico__exact="").exclude(hallazgo__isnull=True).exclude(hallazgo__exact="").values("nombre_tecnico","hallazgo","fecha_operacion").order_by("fecha_operacion"))
    errores_por_hallazgo = list(Auditoria.objects.filter(resultado_auditoria="no_cumple")
        .values("hallazgo","fecha_operacion").annotate(total=Count("id")).order_by("fecha_operacion"))
    auditorias_por_digitador = list(
        Auditoria.objects
        .exclude(nombre_auditor__isnull=True)
        .exclude(nombre_auditor__exact="")
        .values(
            "fecha_operacion",
            "nombre_auditor"
        )
        .annotate(
            total=Count("id")
        )
        .order_by(
            "fecha_operacion",
            "nombre_auditor"
        )
    )

        
    return {
        "Cantidad": Auditoria.objects.count(),
        "Suspensiones": Auditoria.objects.filter(tipo_operacion="DC00").count(),
        "Reconexiones": Auditoria.objects.filter(tipo_operacion="RC00").count(),
        "Zvcl": Auditoria.objects.filter(tipo_operacion="ZVCL").count(),
        "Estadisticas_Tecnico": estadisticas_tecnico,
        "Cantidad_Tecnicos": cantidad_tecnicos,
        "Auditoria_Dia": estadisticas_dia,
        "Datos_No_Cumplen":datos_no_cumplen,
        "Estadisticas_Hallazgos_Tecnico":estadisticas_hallazgos_tecnico,
        "Errores_Por_Tecnicos": errores_por_tecnicos,
        "Errores_Por_Hallazgo": errores_por_hallazgo,
        "Auditorias_Por_Digitador": auditorias_por_digitador,


    }
    
