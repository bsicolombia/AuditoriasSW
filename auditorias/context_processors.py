# auditorias/context_processors.py

from django.db.models import Count, Q
from .models import Auditoria


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def texto_seguro(valor, defecto=""):
    """
    Convierte None en un texto seguro para JavaScript.
    Evita que lleguen null/undefined a los .localeCompare().
    """
    if valor is None:
        return defecto

    return str(valor).strip()


# ============================================================
# FILTROS GENERALES
# ============================================================

def obtener_filtros(request):
    """
    Obtiene los filtros enviados por GET.
    """

    return {
        "anio": request.GET.get("anio", ""),
        "mes": request.GET.get("mes", ""),
        "dia": request.GET.get("dia", ""),
        "tipo_operacion": request.GET.get("tipo_operacion", ""),
        "tecnico": request.GET.get("tecnico", ""),
        "auditor": request.GET.get("auditor", ""),
        "hallazgo": request.GET.get("hallazgo", ""),

    }


def aplicar_filtros(queryset, filtros):
    """
    Aplica los filtros generales a un QuerySet de Auditoria.
    """

    if filtros["anio"]:
        queryset = queryset.filter(
            fecha__year=filtros["anio"]
        )

    if filtros["mes"]:
        queryset = queryset.filter(
            fecha__month=filtros["mes"]
        )

    if filtros["dia"]:
        queryset = queryset.filter(
            fecha__day=filtros["dia"]
        )

    if filtros["tipo_operacion"]:
        queryset = queryset.filter(
            tipo_operacion=filtros["tipo_operacion"]
        )

    if filtros["tecnico"]:
        queryset = queryset.filter(
            nombre_tecnico=filtros["tecnico"]
        )

    if filtros["auditor"]:
        queryset = queryset.filter(
            nombre_auditor=filtros["auditor"]
        )

    if filtros["hallazgo"]:
        queryset = queryset.filter(
            hallazgo=filtros["hallazgo"]
        )

    return queryset


# ============================================================
# OPCIONES PARA LOS FILTROS
# ============================================================

def obtener_opciones_filtros():
    """
    Obtiene las opciones disponibles para los select.
    """

    tecnicos = (
        Auditoria.objects
        .exclude(nombre_tecnico__isnull=True)
        .exclude(nombre_tecnico__exact="")
        .values_list("nombre_tecnico", flat=True)
        .distinct()
        .order_by("nombre_tecnico")
    )

    auditores = (
        Auditoria.objects
        .exclude(nombre_auditor__isnull=True)
        .exclude(nombre_auditor__exact="")
        .values_list("nombre_auditor", flat=True)
        .distinct()
        .order_by("nombre_auditor")
    )

    # ========================================================
    # HALLAZGOS
    # ========================================================

    hallazgos = (
        Auditoria.objects
        .exclude(hallazgo__isnull=True)
        .exclude(hallazgo__exact="")
        .values_list("hallazgo", flat=True)
        .distinct()
        .order_by("hallazgo")
    )

    anios = (
        Auditoria.objects
        .exclude(fecha__isnull=True)
        .dates("fecha", "year", order="DESC")
    )

    return {
        "tecnicos_estadisticas": [
            texto_seguro(tecnico)
            for tecnico in tecnicos
        ],

        "auditores_estadisticas": [
            texto_seguro(auditor)
            for auditor in auditores
        ],

        "hallazgos_estadisticas": [
            texto_seguro(hallazgo)
            for hallazgo in hallazgos
        ],

        "anios_estadisticas": [
            fecha.year
            for fecha in anios
        ],

        "dias_estadisticas": list(range(1, 32)),
    }



# ============================================================
# 1. ESTADÍSTICA POR OPERACIÓN
# ============================================================

def obtener_datos_operaciones(queryset):
    """
    Estadísticas por tipo de operación.
    """

    resultados = (
        queryset
        .values("tipo_operacion")
        .annotate(
            cumple=Count(
                "id",
                filter=Q(resultado_auditoria="cumple")
            ),
            no_cumple=Count(
                "id",
                filter=Q(resultado_auditoria="no_cumple")
            ),
            total=Count("id"),
        )
        .order_by("tipo_operacion")
    )

    

    operaciones_base = {
        "DC00": {
            "cumple": 0,
            "no_cumple": 0,
            "total": 0,
        },
        "RC00": {
            "cumple": 0,
            "no_cumple": 0,
            "total": 0,
        },
        "ZVCL": {
            "cumple": 0,
            "no_cumple": 0,
            "total": 0,
        },
    }

    for item in resultados:

        tipo = texto_seguro(
            item.get("tipo_operacion")
        ).upper()

        if tipo in operaciones_base:

            operaciones_base[tipo] = {
                "cumple": item["cumple"],
                "no_cumple": item["no_cumple"],
                "total": item["total"],
            }

    resultado = []

    for operacion, valores in operaciones_base.items():

        resultado.append({
            "operacion": operacion,
            "cumple": valores["cumple"],
            "no_cumple": valores["no_cumple"],
            "total": valores["total"],
        })


    return resultado


    

# ============================================================
# 2. AUDITORÍAS POR DÍA
# ============================================================

def obtener_auditorias_dia(queryset):
    """
    Cantidad de auditorías realizadas por día.
    """

    datos = (
        queryset
        .exclude(fecha__isnull=True)
        .values("fecha")
        .annotate(
            cumple=Count(
                "id",
                filter=Q(resultado_auditoria="cumple")
            ),
            no_cumple=Count(
                "id",
                filter=Q(resultado_auditoria="no_cumple")
            ),
            total=Count("id"),
        )
        .order_by("fecha")
    )

    resultado = []

    for item in datos:

        fecha = item.get("fecha")

        if not fecha:
            continue

        resultado.append({
            "fecha": fecha.strftime("%Y-%m-%d"),
            "cumple": item["cumple"],
            "no_cumple": item["no_cumple"],
            "total": item["total"],
        })

    return resultado


# ============================================================
# 3. RESUMEN GENERAL CUMPLE / NO CUMPLE
# ============================================================

def obtener_datos_no_cumplen(queryset):
    """
    Resumen general de cumplimiento.
    """

    cumple = queryset.filter(
        resultado_auditoria="cumple"
    ).count()

    no_cumple = queryset.filter(
        resultado_auditoria="no_cumple"
    ).count()

    total = queryset.count()

    return {
        "cumple": cumple,
        "no_cumple": no_cumple,
        "total": total,
    }



# ============================================================
# 4. HALLAZGOS POR TÉCNICO
# ============================================================

def obtener_hallazgos_tecnico(queryset):
    """
    Técnicos que tienen auditorías NO CUMPLE
    y cantidad de hallazgos por tipo.
    """

    queryset = queryset.filter(
        resultado_auditoria="no_cumple"
    )

    datos = (
        queryset
        .values(
            "nombre_tecnico",
            "tipo_hallazgo"
        )
        .annotate(
            cantidad=Count("id")
        )
        .order_by(
            "nombre_tecnico",
            "tipo_hallazgo"
        )
    )

    tecnicos = {}

    for item in datos:

        tecnico = texto_seguro(
            item.get("nombre_tecnico"),
            "Sin técnico"
        )

        tipo = texto_seguro(
            item.get("tipo_hallazgo"),
            "sin_tipo"
        ).lower()

        if tecnico not in tecnicos:

            tecnicos[tecnico] = {
                "alto": 0,
                "medio": 0,
                "bajo": 0,
                "sin_tipo": 0,
            }

        if tipo in tecnicos[tecnico]:

            tecnicos[tecnico][tipo] += item["cantidad"]

        else:

            # Si aparece un tipo de hallazgo no contemplado,
            # lo contabilizamos como sin_tipo.
            tecnicos[tecnico]["sin_tipo"] += item["cantidad"]

    resultado = []

    for tecnico, valores in tecnicos.items():

        total = (
            valores["alto"]
            + valores["medio"]
            + valores["bajo"]
            + valores["sin_tipo"]
        )

        resultado.append({
            "tecnico": tecnico,
            "alto": valores["alto"],
            "medio": valores["medio"],
            "bajo": valores["bajo"],
            "sin_tipo": valores["sin_tipo"],
            "total": total,
        })

    return resultado


# ============================================================
# 5. ERRORES POR TÉCNICO
# ============================================================

def obtener_errores_por_tecnico(queryset):
    """
    Permite identificar qué técnicos presentan
    mayor cantidad de cada tipo de error.
    """

    queryset = queryset.filter(
        resultado_auditoria="no_cumple"
    )

    datos = (
        queryset
        .values(
            "nombre_tecnico",
            "tipo_hallazgo"
        )
        .annotate(
            cantidad=Count("id")
        )
        .order_by("-cantidad")
    )

    resultado = []

    for item in datos:

        resultado.append({
            "tecnico": texto_seguro(
                item.get("nombre_tecnico"),
                "Sin técnico"
            ),

            "tipo_hallazgo": texto_seguro(
                item.get("tipo_hallazgo"),
                "sin_tipo"
            ).lower(),

            "cantidad": item["cantidad"],
        })

    return resultado


# ============================================================
# 6. CANTIDAD DE HALLAZGOS POR TÉCNICO
# ============================================================

# ============================================================
# CANTIDAD DE HALLAZGOS
# ============================================================

def obtener_cantidad_por_hallazgo(queryset):
    """
    Cuenta la cantidad de registros por el texto exacto
    del campo hallazgo.

    NO agrupa por:
        - técnico
        - tipo_hallazgo

    Agrupa únicamente por:
        - hallazgo
    """

    queryset = queryset.filter(
        resultado_auditoria="no_cumple"
    )

    datos = (
        queryset
        .exclude(hallazgo__isnull=True)
        .exclude(hallazgo__exact="")
        .values("hallazgo")
        .annotate(
            cantidad=Count("id")
        )
        .order_by("-cantidad")
    )

    resultado = []

    for item in datos:

        hallazgo = texto_seguro(
            item.get("hallazgo"),
            "Sin hallazgo"
        )

        resultado.append({
            "hallazgo": hallazgo,
            "cantidad": item["cantidad"],
        })

    return resultado


# ============================================================
# 7. AUDITORÍAS POR DIGITADOR
# ============================================================

def obtener_auditorias_por_digitador(queryset):
    """
    Estadísticas de auditorías realizadas por cada auditor.
    """

    datos = (
        queryset
        .exclude(fecha__isnull=True)
        .values(
            "nombre_auditor",
            "fecha"
        )
        .annotate(
            total=Count("id"),

            cumple=Count(
                "id",
                filter=Q(resultado_auditoria="cumple")
            ),

            no_cumple=Count(
                "id",
                filter=Q(resultado_auditoria="no_cumple")
            ),
        )
        .order_by(
            "fecha",
            "nombre_auditor"
        )
    )

    resultado = []

    for item in datos:

        fecha = item.get("fecha")

        if not fecha:
            continue

        resultado.append({
            "fecha": fecha.strftime("%Y-%m-%d"),

            "auditor": texto_seguro(
                item.get("nombre_auditor"),
                "Sin auditor"
            ),

            "total": item["total"],
            "cumple": item["cumple"],
            "no_cumple": item["no_cumple"],
        })

    return resultado

# ============================================================
# ERRORES DETALLADOS POR TÉCNICO
# ============================================================

def obtener_errores_detallados_por_tecnico(queryset):
    """
    Obtiene los hallazgos NO CUMPLE agrupados por técnico
    y posteriormente por el texto exacto del hallazgo.

    Ejemplo:

    Técnico A
        total: 50
        hallazgos:
            Registro fotográfico incompleto: 50

    Técnico B
        total: 36
        hallazgos:
            Registro fotográfico incompleto: 30
            Troque de válvula: 6
    """

    queryset = queryset.filter(
        resultado_auditoria="no_cumple"
    )

    datos = (
        queryset
        .values(
            "nombre_tecnico",
            "hallazgo"
        )
        .annotate(
            cantidad=Count("id")
        )
        .order_by(
            "nombre_tecnico",
            "-cantidad"
        )
    )

    tecnicos = {}

    for item in datos:

        tecnico = texto_seguro(
            item.get("nombre_tecnico"),
            "Sin técnico"
        )

        hallazgo = texto_seguro(
            item.get("hallazgo"),
            "Sin hallazgo"
        )

        cantidad = item["cantidad"]

        if tecnico not in tecnicos:

            tecnicos[tecnico] = {
                "tecnico": tecnico,
                "total": 0,
                "hallazgos": []
            }

        tecnicos[tecnico]["total"] += cantidad

        tecnicos[tecnico]["hallazgos"].append({
            "hallazgo": hallazgo,
            "cantidad": cantidad
        })

    # Convertir a lista y ordenar por total
    resultado = list(tecnicos.values())

    resultado.sort(
        key=lambda x: x["total"],
        reverse=True
    )

    return resultado

# ============================================================
# CONTEXT PROCESSOR PRINCIPAL
# ============================================================

def estadisticas_auditorias(request):

    filtros = obtener_filtros(request)

    queryset = Auditoria.objects.all()

    queryset = aplicar_filtros(
        queryset,
        filtros
    )

    opciones = obtener_opciones_filtros()

    # ====================================================
    # TOTALES POR TIPO DE OPERACIÓN
    # ====================================================

    total_dc00 = queryset.filter(
        tipo_operacion="DC00"
    ).count()

    total_rc00 = queryset.filter(
        tipo_operacion="RC00"
    ).count()

    total_zvcl = queryset.filter(
        tipo_operacion="ZVCL"
    ).count()
    
    total_operaciones = (
        total_dc00
        + total_rc00
        + total_zvcl
    )

    return {

        # ====================================================
        # FILTROS
        # ====================================================

        "filtros_estadisticas": filtros,

        **opciones,

        # ====================================================
        # TOTALES DE OPERACIONES
        # ====================================================

        "Suspensiones": total_dc00,
        "Reconexiones": total_rc00,
        "Zvcl": total_zvcl,
        "total_operaciones": total_operaciones,

        # ====================================================
        # ESTADÍSTICAS
        # ====================================================

        "datos_operaciones": obtener_datos_operaciones(
            queryset
        ),

        "Auditoria_Dia": obtener_auditorias_dia(
            queryset
        ),

        "Datos_No_Cumplen": obtener_datos_no_cumplen(
            queryset
        ),

        "Estadisticas_Tecnico": obtener_hallazgos_tecnico(
            queryset
        ),

        "Cantidad_Por_Hallazgo": obtener_cantidad_por_hallazgo(
            queryset
        ),

        "Auditorias_Por_Digitador": obtener_auditorias_por_digitador(
            queryset
        ),
        
        "Errores_Detallados_Tecnico": obtener_errores_detallados_por_tecnico(
            queryset
        ),
        
        "Errores_Por_Tecnicos": obtener_errores_por_tecnico(
            queryset
        ),

    }
