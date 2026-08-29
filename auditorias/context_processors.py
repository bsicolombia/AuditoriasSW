# auditorias/context_processors.py
from django.db.models import Count, Q
from .models import Auditoria
from carga.models import Tecnicos
import re

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
        "resultado": request.GET.get("resultado", ""),
        "supervisor": request.GET.get("supervisor", ""),
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

    if filtros["resultado"] in ["cumple", "no_cumple"]:
        queryset = queryset.filter(
            resultado_auditoria=filtros["resultado"]
        )

    # =========================================================
    # FILTRO POR SUPERVISOR
    # =========================================================

    if filtros["resultado"] in ["cumple", "no_cumple"]:
        queryset = queryset.filter(
            resultado_auditoria=filtros["resultado"]
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
        Tecnicos.objects
        .exclude(tecnico_apellido_nombres__isnull=True)
        .exclude(tecnico_apellido_nombres__exact="")
        .values_list(
            "tecnico_apellido_nombres",
            flat=True
        )
        .distinct()
        .order_by(
            "tecnico_apellido_nombres"
        )
    )

    auditores = (
        Auditoria.objects
        .exclude(nombre_auditor__isnull=True)
        .exclude(nombre_auditor__exact="")
        .values_list(
            "nombre_auditor",
            flat=True
        )
        .distinct()
        .order_by(
            "nombre_auditor"
        )
    )

    hallazgos = (
        Auditoria.objects
        .exclude(hallazgo__isnull=True)
        .exclude(hallazgo__exact="")
        .values_list(
            "hallazgo",
            flat=True
        )
        .distinct()
        .order_by("hallazgo")
    )

    anios = (
        Auditoria.objects
        .exclude(fecha__isnull=True)
        .dates(
            "fecha",
            "year",
            order="DESC"
        )
    )

    # =========================================================
    # SUPERVISORES
    # =========================================================

    supervisores = (
        Tecnicos.objects
        .exclude(supervisor__isnull=True)
        .exclude(supervisor__exact="")
        .values_list(
            "supervisor",
            flat=True
        )
        .distinct()
        .order_by("supervisor")
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

        "supervisores_estadisticas": [
            texto_seguro(supervisor)
            for supervisor in supervisores
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
        .order_by("-fecha")
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
            "-fecha",
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

def extraer_cedula_nombre_tecnico(nombre):
    """
    Extrae la cédula que aparece al final de nombre_tecnico.

    Ejemplo:
    'Rodriguez Mendez Hector Daniel -79939032'
    -> '79939032'
    """

    if not nombre:
        return ""

    nombre = str(nombre).strip()

    coincidencia = re.search(r"-\s*(\d+)\s*$", nombre)

    if coincidencia:
        return coincidencia.group(1)

    return ""

def obtener_resultado_auditorias_tecnico(
    queryset,
    supervisor=""
):
    """
    Compara los técnicos ACTUALES de carga.Tecnicos
    contra las auditorías.

    La coincidencia se realiza por la cédula que está
    al final del campo Auditoria.nombre_tecnico.

    Ejemplo:

        Rodriguez Mendez Hector Daniel -79939032
                                              ↑
                                           cédula

    Se compara contra:

        Tecnicos.tecnico_cedula = 79939032
    """

    # =========================================================
    # 1. TÉCNICOS ACTUALES
    # =========================================================

    tecnicos_query = (
        Tecnicos.objects
        .exclude(
            tecnico_cedula__isnull=True
        )
        .exclude(
            tecnico_cedula__exact=""
        )
    )

    # =========================================================
    # 2. FILTRO POR SUPERVISOR
    # =========================================================

    if supervisor:

        tecnicos_query = tecnicos_query.filter(
            supervisor=supervisor
        )

    tecnicos_query = (
        tecnicos_query
        .values(
            "supervisor",
            "tecnico_cedula",
            "tecnico_apellido_nombres"
        )
        .order_by(
            "supervisor",
            "tecnico_apellido_nombres"
        )
    )

    # =========================================================
    # 3. AGRUPAR AUDITORÍAS POR CÉDULA
    # =========================================================

    auditorias_por_cedula = {}

    auditorias = queryset.values(
        "nombre_tecnico",
        "resultado_auditoria",
        "fecha"
    )

    for auditoria in auditorias:

        nombre_tecnico = texto_seguro(
            auditoria.get("nombre_tecnico")
        )

        # -----------------------------------------------------
        # SACAR LA CÉDULA DESDE nombre_tecnico
        # -----------------------------------------------------

        cedula = extraer_cedula_nombre_tecnico(
            nombre_tecnico
        )

        if not cedula:
            continue

        # -----------------------------------------------------
        # CREAR REGISTRO DEL TÉCNICO SI NO EXISTE
        # -----------------------------------------------------

        if cedula not in auditorias_por_cedula:

            auditorias_por_cedula[cedula] = {
                "total": 0,
                "no_cumple": 0,
                "cumple": 0,
                "fechas": set(),
            }

        estadisticas = auditorias_por_cedula[cedula]

        # -----------------------------------------------------
        # TOTAL
        # -----------------------------------------------------

        estadisticas["total"] += 1

        # -----------------------------------------------------
        # RESULTADO
        # -----------------------------------------------------

        if auditoria.get(
            "resultado_auditoria"
        ) == "cumple":

            estadisticas["cumple"] += 1

        elif auditoria.get(
            "resultado_auditoria"
        ) == "no_cumple":

            estadisticas["no_cumple"] += 1

        # -----------------------------------------------------
        # DÍA AUDITADO
        # -----------------------------------------------------

        fecha = auditoria.get("fecha")

        if fecha:

            estadisticas["fechas"].add(
                fecha
            )

    # =========================================================
    # 4. COMPARAR TÉCNICOS ACTUALES
    #    CONTRA LAS AUDITORÍAS
    # =========================================================

    resultado = []

    for tecnico in tecnicos_query:

        supervisor_tecnico = texto_seguro(
            tecnico.get("supervisor"),
            "Sin supervisor"
        )

        # -----------------------------------------------------
        # CÉDULA DEL TÉCNICO ACTUAL
        # -----------------------------------------------------

        cedula = texto_seguro(
            tecnico.get("tecnico_cedula")
        )

        # -----------------------------------------------------
        # NOMBRE ACTUAL
        # -----------------------------------------------------

        nombre = texto_seguro(
            tecnico.get(
                "tecnico_apellido_nombres"
            ),
            "Sin técnico"
        )

        # -----------------------------------------------------
        # BUSCAR SUS AUDITORÍAS
        # -----------------------------------------------------

        estadisticas = (
            auditorias_por_cedula.get(
                cedula
            )
        )

        # =====================================================
        # TIENE AUDITORÍAS
        # =====================================================

        if estadisticas:

            total = estadisticas["total"]
            no_cumple = estadisticas["no_cumple"]
            cumple = estadisticas["cumple"]

            # -------------------------------------------------
            # % ERROR
            # -------------------------------------------------

            porcentaje_error = (
                (no_cumple / total) * 100
                if total > 0
                else 0
            )

            resultado.append({

                "supervisor":
                    supervisor_tecnico,

                "tecnico":
                    nombre,

                "cedula":
                    cedula,

                "total":
                    total,

                "porcentaje_error":
                    round(
                        porcentaje_error,
                        2
                    ),

                "no_cumple":
                    no_cumple,

                "cumple":
                    cumple,

                "dias_auditados":
                    len(
                        estadisticas["fechas"]
                    ),

                "tiene_auditorias":
                    True,

                "estado":
                    "auditado",
            })

        # =====================================================
        # NO TIENE AUDITORÍAS
        # =====================================================

        else:

            resultado.append({

                "supervisor":
                    supervisor_tecnico,

                "tecnico":
                    nombre,

                "cedula":
                    cedula,

                "total":
                    0,

                "porcentaje_error":
                    0,

                "no_cumple":
                    0,

                "cumple":
                    0,

                "dias_auditados":
                    0,

                "tiene_auditorias":
                    False,

                "estado":
                    "falta_auditar",
            })

    # =========================================================
    # 5. ORDEN
    # =========================================================

    resultado.sort(
        key=lambda x: (
            x["supervisor"].lower(),
            not x["tiene_auditorias"],
            -x["porcentaje_error"],
            x["tecnico"].lower()
        )
    )

    return resultado

# ============================================================
# RESULTADO DE AUDITORÍAS POR DIGITADOR
# ============================================================

def obtener_resultado_auditorias_digitador(queryset):
    """
    Resumen de auditorías realizadas por digitador.

    Columnas:
        Digitador
        Técnicos auditados
        Auditorías realizadas
        % No Cumple
        No Cumplen
        Cumplen

    Orden:
        Mayor % No Cumple -> menor % No Cumple
    """

    datos = (
        queryset
        .values("nombre_auditor")
        .annotate(
            auditorias_realizadas=Count("id"),

            no_cumplen=Count(
                "id",
                filter=Q(
                    resultado_auditoria="no_cumple"
                )
            ),

            cumplen=Count(
                "id",
                filter=Q(
                    resultado_auditoria="cumple"
                )
            ),

            tecnicos_auditados=Count(
                "nombre_tecnico",
                distinct=True
            ),
        )
    )

    resultado = []

    for item in datos:

        digitador = texto_seguro(
            item.get("nombre_auditor"),
            "Sin digitador"
        )

        total = item["auditorias_realizadas"] or 0
        no_cumplen = item["no_cumplen"] or 0
        cumplen = item["cumplen"] or 0
        tecnicos = item["tecnicos_auditados"] or 0

        if total > 0:

            porcentaje_no_cumple = (
                no_cumplen / total
            ) * 100

        else:

            porcentaje_no_cumple = 0

        resultado.append({
            "digitador": digitador,

            "tecnicos_auditados": tecnicos,

            "auditorias_realizadas": total,

            "porcentaje_no_cumple": round(
                porcentaje_no_cumple,
                2
            ),

            "no_cumplen": no_cumplen,

            "cumplen": cumplen,
        })

    # ========================================================
    # ORDENAR POR % NO CUMPLE
    # ========================================================

    resultado.sort(
        key=lambda x: x["porcentaje_no_cumple"],
        reverse=True
    )

    return resultado

def obtener_cantidad_auditorias_por_auditor(queryset):

    datos = (
        queryset
        .values("nombre_auditor")
        .annotate(
            total=Count("id")
        )
        .order_by("-total", "nombre_auditor")
    )

    resultado = []

    for item in datos:

        resultado.append({
            "auditor": texto_seguro(
                item.get("nombre_auditor"),
                "Sin auditor"
            ),
            "total": item["total"],
        })

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
        
        "Resultado_Auditorias_Tecnico":
        obtener_resultado_auditorias_tecnico(
            queryset,
            filtros["supervisor"]
        ),

        
        "Resultado_Auditorias_Digitador":
        obtener_resultado_auditorias_digitador(
            queryset
        ), 
        
        "Cantidad_Auditorias_Auditor":
        obtener_cantidad_auditorias_por_auditor(
            queryset
        ),


    }
