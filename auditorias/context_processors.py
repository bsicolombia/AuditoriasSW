from django.db.models import Count, Q
from django.utils import timezone
from .models import Auditoria
from carga.models import Tecnicos, EstadoCarga
import re
import unicodedata

# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def texto_seguro(valor, defecto=""):
    """
    Convierte cualquier valor en texto limpio.

    None -> ""
    "   Hola   " -> "Hola"
    """

    if valor is None:
        return defecto

    return str(valor).strip()


def normalizar_texto(valor):
    """
    Normaliza nombres para poder compararlos.

    Ejemplo:

        "Acosta Leiva Duvan Esteban"
        " ACOSTA LEIVA DUVAN ESTEBAN "
        "Acosta  Leiva Duvan Esteban"

    terminan siendo equivalentes.
    """

    if valor is None:
        return ""

    valor = str(valor).strip().lower()

    # Quitar tildes
    valor = unicodedata.normalize(
        "NFKD",
        valor
    )

    valor = "".join(
        caracter
        for caracter in valor
        if not unicodedata.combining(caracter)
    )

    # Espacios múltiples
    valor = re.sub(
        r"\s+",
        " ",
        valor
    )

    return valor.strip()


def normalizar_cedula(valor):
    """
    Deja únicamente números.

    Ejemplos:

        79.765.301 -> 79765301
        79 765 301 -> 79765301
        79-765-301 -> 79765301
        "79765301 " -> 79765301
    """

    if valor is None:
        return ""

    return re.sub(
        r"\D",
        "",
        str(valor).strip()
    )


def extraer_cedula_nombre_tecnico(nombre):
    """
    Extrae la cédula que viene al final del nombre.

    Soporta:

        Acosta Leiva Duvan Esteban-1234643864

        Acosta Leiva Duvan Esteban -1234643864

        Acosta Leiva Duvan Esteban - 1234643864

        Acosta Leiva Duvan Esteban 1234643864
    """

    if not nombre:
        return ""

    nombre = str(nombre).strip()

    coincidencia = re.search(
        r"(?:-\s*)?(\d{6,15})\s*$",
        nombre
    )

    if coincidencia:

        return normalizar_cedula(
            coincidencia.group(1)
        )

    return ""


def obtener_nombre_sin_cedula(nombre):
    """
    Quita la cédula del final del nombre.

    Ejemplo:

        Acosta Leiva Duvan Esteban-1234643864

    devuelve:

        Acosta Leiva Duvan Esteban
    """

    if not nombre:
        return ""

    nombre = str(nombre).strip()

    nombre = re.sub(
        r"\s*-\s*\d{6,15}\s*$",
        "",
        nombre
    )

    nombre = re.sub(
        r"\s+\d{6,15}\s*$",
        "",
        nombre
    )

    return nombre.strip()


def obtener_cedula_auditoria(auditoria):
    """
    Obtiene la cédula del técnico desde un registro de Auditoria.

    numero_cedula corresponde al auditor,
    por eso no se utiliza como cédula del técnico.

    La cédula del técnico está al final de nombre_tecnico.
    """

    nombre_tecnico = texto_seguro(
        auditoria.get(
            "nombre_tecnico"
        )
    )

    cedula = extraer_cedula_nombre_tecnico(
        nombre_tecnico
    )

    return cedula


def obtener_nombre_tecnico_auditoria(auditoria):
    """
    Obtiene el nombre del técnico sin la cédula.
    """

    nombre = texto_seguro(
        auditoria.get(
            "nombre_tecnico"
        )
    )

    return obtener_nombre_sin_cedula(
        nombre
    )


# ============================================================
# FECHA ACTUAL
# ============================================================

ahora = timezone.localtime()

anio_actual = str(
    ahora.year
)

mes_actual = str(
    ahora.month
)

# ============================================================
# FILTROS
# ============================================================

def obtener_filtros(request):

    # ========================================================
    # VALORES POR DEFECTO
    # ========================================================

    anio_default = str(
        timezone.localtime().year
    )

    mes_default = str(
        timezone.localtime().month
    )

    filtros = {

        "anio":
            texto_seguro(
                request.GET.get(
                    "anio",
                    anio_default
                )
            ),

        "mes":
            texto_seguro(
                request.GET.get(
                    "mes",
                    mes_default
                )
            ),

        "dia":
            texto_seguro(
                request.GET.get(
                    "dia",
                    ""
                )
            ),

        "tipo_operacion":
            texto_seguro(
                request.GET.get(
                    "tipo_operacion",
                    ""
                )
            ),

        "tecnico":
            texto_seguro(
                request.GET.get(
                    "tecnico",
                    ""
                )
            ),

        "auditor":
            texto_seguro(
                request.GET.get(
                    "auditor",
                    ""
                )
            ),

        "hallazgo":
            texto_seguro(
                request.GET.get(
                    "hallazgo",
                    ""
                )
            ),

        "resultado":
            texto_seguro(
                request.GET.get(
                    "resultado",
                    ""
                )
            ),

        "supervisor":
            texto_seguro(
                request.GET.get(
                    "supervisor",
                    ""
                )
            ),
    }

    # ========================================================
    # SEGURIDAD RESULTADO
    # ========================================================

    resultado_invalido = (
        filtros["resultado"]
        .strip()
        .lower()
        in (
            "",
            "undefined",
            "null",
            "n/a",
            "na",
            "tecnico",
            "tecnicos",
            "todos",
        )
    )

    if resultado_invalido:
        filtros["resultado"] = ""

    return filtros
# ============================================================
# FILTROS
# ============================================================

def obtener_opciones_filtros():

    # ========================================================
    # TÉCNICOS
    # ========================================================

    tecnicos = (
        Tecnicos.objects
        .exclude(
            tecnico_apellido_nombres__isnull=True
        )
        .exclude(
            tecnico_apellido_nombres__exact=""
        )
        .values_list(
            "tecnico_apellido_nombres",
            flat=True
        )
        .distinct()
        .order_by(
            "tecnico_apellido_nombres"
        )
    )

    # ========================================================
    # AUDITORES
    # ========================================================

    auditores = (
        Auditoria.objects
        .exclude(
            nombre_auditor__isnull=True
        )
        .exclude(
            nombre_auditor__exact=""
        )
        .values_list(
            "nombre_auditor",
            flat=True
        )
        .distinct()
        .order_by(
            "nombre_auditor"
        )
    )

    # ========================================================
    # HALLAZGOS
    # ========================================================

    hallazgos = (
        Auditoria.objects
        .exclude(
            hallazgo__isnull=True
        )
        .exclude(
            hallazgo__exact=""
        )
        .values_list(
            "hallazgo",
            flat=True
        )
        .distinct()
        .order_by(
            "hallazgo"
        )
    )

    # ========================================================
    # AÑOS
    # ========================================================

    fechas = (
        Auditoria.objects
        .exclude(
            fecha__isnull=True
        )
        .values_list(
            "fecha",
            flat=True
        )
        .order_by(
            "-fecha"
        )
    )

    anios = sorted(
        {
            fecha.year
            for fecha in fechas
            if fecha is not None
        },
        reverse=True
    )

    # ========================================================
    # SUPERVISORES
    # ========================================================

    supervisores = (
        Tecnicos.objects
        .exclude(
            supervisor__isnull=True
        )
        .exclude(
            supervisor__exact=""
        )
        .values_list(
            "supervisor",
            flat=True
        )
        .distinct()
        .order_by(
            "supervisor"
        )
    )

    # ========================================================
    # RESULTADO
    # ========================================================

    return {

        "tecnicos_estadisticas": [
            texto_seguro(t)
            for t in tecnicos
        ],

        "auditores_estadisticas": [
            texto_seguro(a)
            for a in auditores
        ],

        "hallazgos_estadisticas": [
            texto_seguro(h)
            for h in hallazgos
        ],

        "supervisores_estadisticas": [
            texto_seguro(s)
            for s in supervisores
        ],

        "anios_estadisticas": anios,

        "dias_estadisticas": list(
            range(1, 32)
        ),
    }


# ============================================================
# APLICAR FILTROS
# ============================================================

def aplicar_filtros(queryset, filtros):

    # ========================================================
    # AÑO
    # ========================================================

    anio = filtros.get(
        "anio"
    )

    if anio:

        if str(anio).isdigit():

            queryset = queryset.filter(
                fecha__year=int(anio)
            )

    # ========================================================
    # MES
    # ========================================================

    mes = filtros.get(
        "mes"
    )

    if mes:

        if str(mes).isdigit():

            queryset = queryset.filter(
                fecha__month=int(mes)
            )

    # ========================================================
    # DÍA
    # ========================================================

    dia = filtros.get(
        "dia"
    )

    if dia:

        if str(dia).isdigit():

            queryset = queryset.filter(
                fecha__day=int(dia)
            )

    # ========================================================
    # TIPO DE OPERACIÓN
    # ========================================================

    tipo_operacion = texto_seguro(
        filtros.get(
            "tipo_operacion"
        )
    )

    if tipo_operacion:

        queryset = queryset.filter(
            tipo_operacion__iexact=tipo_operacion
        )

    # ========================================================
    # TÉCNICO
    # ========================================================

    tecnico_seleccionado = texto_seguro(
        filtros.get(
            "tecnico"
        )
    )

    if tecnico_seleccionado:

        nombre_tecnico_normalizado = (
            normalizar_texto(
                tecnico_seleccionado
            )
        )

        # ----------------------------------------------------
        # BUSCAR TÉCNICO EN TABLA TECNICOS
        # ----------------------------------------------------

        tecnicos_bd = list(
            Tecnicos.objects
            .exclude(
                tecnico_apellido_nombres__isnull=True
            )
            .exclude(
                tecnico_apellido_nombres__exact=""
            )
            .values(
                "tecnico_cedula",
                "tecnico_apellido_nombres"
            )
        )

        cedulas_tecnico = set()

        for tecnico_bd in tecnicos_bd:

            nombre_bd = texto_seguro(
                tecnico_bd.get(
                    "tecnico_apellido_nombres"
                )
            )

            cedula_bd = normalizar_cedula(
                tecnico_bd.get(
                    "tecnico_cedula"
                )
            )

            nombre_bd_normalizado = (
                normalizar_texto(
                    nombre_bd
                )
            )

            if (
                nombre_bd_normalizado
                == nombre_tecnico_normalizado
            ):

                if cedula_bd:

                    cedulas_tecnico.add(
                        cedula_bd
                    )

        # ----------------------------------------------------
        # BUSCAR AUDITORÍAS
        # ----------------------------------------------------

        ids_tecnico = []

        auditorias = (
            queryset
            .values(
                "id",
                "nombre_tecnico"
            )
        )

        for auditoria in auditorias:

            nombre_auditoria = (
                texto_seguro(
                    auditoria.get(
                        "nombre_tecnico"
                    )
                )
            )

            # Cédula al final del nombre
            cedula_auditoria = (
                extraer_cedula_nombre_tecnico(
                    nombre_auditoria
                )
            )

            # Nombre sin cédula
            nombre_auditoria_limpio = (
                obtener_nombre_sin_cedula(
                    nombre_auditoria
                )
            )

            nombre_auditoria_normalizado = (
                normalizar_texto(
                    nombre_auditoria_limpio
                )
            )

            # Match por cédula
            match_cedula = (

                cedula_auditoria
                and cedula_auditoria
                in cedulas_tecnico
            )

            # Match por nombre
            match_nombre = (

                nombre_auditoria_normalizado
                == nombre_tecnico_normalizado
            )

            if match_cedula or match_nombre:

                ids_tecnico.append(
                    auditoria["id"]
                )

        # ----------------------------------------------------
        # QUITAR DUPLICADOS
        # ----------------------------------------------------

        ids_tecnico = list(
            dict.fromkeys(
                ids_tecnico
            )
        )

        queryset = queryset.filter(
            id__in=ids_tecnico
        )

    # ========================================================
    # AUDITOR
    # ========================================================

    auditor = texto_seguro(
        filtros.get(
            "auditor"
        )
    )

    if auditor:

        queryset = queryset.filter(
            nombre_auditor__iexact=auditor
        )

    # ========================================================
    # HALLAZGO
    # ========================================================

    hallazgo = texto_seguro(
        filtros.get(
            "hallazgo"
        )
    )

    if hallazgo:

        queryset = queryset.filter(
            hallazgo__iexact=hallazgo
        )

    # ========================================================
    # RESULTADO
    # ========================================================

    resultado = texto_seguro(
        filtros.get(
            "resultado"
        )
    ).lower()

    resultados_validos = {
        "cumple",
        "no_cumple",
    }

    if resultado in resultados_validos:

        queryset = queryset.filter(
            resultado_auditoria__iexact=resultado
        )

    # ========================================================
    # SUPERVISOR
    # ========================================================

    supervisor = texto_seguro(
        filtros.get(
            "supervisor"
        )
    )

    if supervisor:

        tecnicos_supervisor = list(
            Tecnicos.objects
            .filter(
                supervisor__iexact=supervisor
            )
            .exclude(
                tecnico_cedula__isnull=True
            )
            .exclude(
                tecnico_cedula__exact=""
            )
            .values(
                "tecnico_cedula",
                "tecnico_apellido_nombres"
            )
        )

        cedulas_supervisor = set()

        nombres_supervisor = set()

        for item in tecnicos_supervisor:

            cedula = normalizar_cedula(
                item.get(
                    "tecnico_cedula"
                )
            )

            nombre = texto_seguro(
                item.get(
                    "tecnico_apellido_nombres"
                )
            )

            if cedula:

                cedulas_supervisor.add(
                    cedula
                )

            if nombre:

                nombres_supervisor.add(
                    normalizar_texto(
                        nombre
                    )
                )

        ids_supervisor = []

        auditorias_supervisor = (
            queryset
            .values(
                "id",
                "nombre_tecnico"
            )
        )

        for auditoria in auditorias_supervisor:

            nombre = texto_seguro(
                auditoria.get(
                    "nombre_tecnico"
                )
            )

            cedula = (
                extraer_cedula_nombre_tecnico(
                    nombre
                )
            )

            nombre_limpio = (
                obtener_nombre_sin_cedula(
                    nombre
                )
            )

            nombre_normalizado = (
                normalizar_texto(
                    nombre_limpio
                )
            )

            if (

                (
                    cedula
                    and cedula in cedulas_supervisor
                )

                or

                (
                    nombre_normalizado
                    and nombre_normalizado
                    in nombres_supervisor
                )

            ):

                ids_supervisor.append(
                    auditoria["id"]
                )

        ids_supervisor = list(
            dict.fromkeys(
                ids_supervisor
            )
        )

        queryset = queryset.filter(
            id__in=ids_supervisor
        )

    return queryset

# ============================================================
# 1. ESTADÍSTICA POR OPERACIÓN
# ============================================================

def obtener_datos_operaciones(queryset):

    resultados = (
        queryset
        .values(
            "tipo_operacion"
        )
        .annotate(

            cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="cumple"
                )
            ),

            no_cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="no_cumple"
                )
            ),

            total=Count("id"),
        )
        .order_by(
            "tipo_operacion"
        )
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
            item.get(
                "tipo_operacion"
            )
        ).upper()

        if tipo in operaciones_base:

            operaciones_base[tipo] = {

                "cumple":
                    item["cumple"],

                "no_cumple":
                    item["no_cumple"],

                "total":
                    item["total"],
            }

    resultado = []

    for operacion, valores in (
        operaciones_base.items()
    ):

        resultado.append({

            "operacion":
                operacion,

            "cumple":
                valores["cumple"],

            "no_cumple":
                valores["no_cumple"],

            "total":
                valores["total"],
        })

    return resultado


# ============================================================
# 2. AUDITORÍAS POR DÍA
# ============================================================

def obtener_auditorias_dia(queryset):

    datos = (
        queryset
        .exclude(
            fecha__isnull=True
        )
        .values(
            "fecha"
        )
        .annotate(

            cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="cumple"
                )
            ),

            no_cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="no_cumple"
                )
            ),

            total=Count("id"),
        )
        .order_by(
            "-fecha"
        )
    )

    resultado = []

    for item in datos:

        fecha = item.get(
            "fecha"
        )

        if not fecha:
            continue

        resultado.append({

            "fecha":
                fecha.strftime(
                    "%Y-%m-%d"
                ),

            "cumple":
                item["cumple"],

            "no_cumple":
                item["no_cumple"],

            "total":
                item["total"],
        })

    return resultado


# ============================================================
# 3. RESUMEN GENERAL
# ============================================================

def obtener_datos_no_cumplen(queryset):

    cumple = queryset.filter(
        resultado_auditoria__iexact="cumple"
    ).count()

    no_cumple = queryset.filter(
        resultado_auditoria__iexact="no_cumple"
    ).count()

    total = queryset.count()

    return {

        "cumple":
            cumple,

        "no_cumple":
            no_cumple,

        "total":
            total,
    }


# ============================================================
# 4. HALLAZGOS POR TÉCNICO
# ============================================================

def obtener_hallazgos_tecnico(queryset):

    queryset = queryset.filter(
        resultado_auditoria__iexact="no_cumple"
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
            item.get(
                "nombre_tecnico"
            ),
            "Sin técnico"
        )

        tipo = texto_seguro(
            item.get(
                "tipo_hallazgo"
            ),
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

            tecnicos[tecnico][tipo] += \
                item["cantidad"]

        else:

            tecnicos[tecnico]["sin_tipo"] += \
                item["cantidad"]

    resultado = []

    for tecnico, valores in tecnicos.items():

        total = (
            valores["alto"]
            + valores["medio"]
            + valores["bajo"]
            + valores["sin_tipo"]
        )

        resultado.append({

            "tecnico":
                tecnico,

            "alto":
                valores["alto"],

            "medio":
                valores["medio"],

            "bajo":
                valores["bajo"],

            "sin_tipo":
                valores["sin_tipo"],

            "total":
                total,
        })

    return resultado


# ============================================================
# 5. ERRORES POR TÉCNICO
# ============================================================

def obtener_errores_por_tecnico(queryset):

    queryset = queryset.filter(
        resultado_auditoria__iexact="no_cumple"
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
            "-cantidad"
        )
    )

    resultado = []

    for item in datos:

        resultado.append({

            "tecnico":
                texto_seguro(
                    item.get(
                        "nombre_tecnico"
                    ),
                    "Sin técnico"
                ),

            "tipo_hallazgo":
                texto_seguro(
                    item.get(
                        "tipo_hallazgo"
                    ),
                    "sin_tipo"
                ).lower(),

            "cantidad":
                item["cantidad"],
        })

    return resultado


# ============================================================
# 6. CANTIDAD POR HALLAZGO
# ============================================================

def obtener_cantidad_por_hallazgo(queryset):

    queryset = queryset.filter(
        resultado_auditoria__iexact="no_cumple"
    )

    datos = (
        queryset
        .exclude(
            hallazgo__isnull=True
        )
        .exclude(
            hallazgo__exact=""
        )
        .values(
            "hallazgo"
        )
        .annotate(
            cantidad=Count("id")
        )
        .order_by(
            "-cantidad"
        )
    )

    resultado = []

    for item in datos:

        resultado.append({

            "hallazgo":
                texto_seguro(
                    item.get(
                        "hallazgo"
                    ),
                    "Sin hallazgo"
                ),

            "cantidad":
                item["cantidad"],
        })

    return resultado


# ============================================================
# 7. AUDITORÍAS POR DIGITADOR
# ============================================================

def obtener_auditorias_por_digitador(queryset):

    datos = (
        queryset
        .exclude(
            fecha__isnull=True
        )
        .values(
            "nombre_auditor",
            "fecha"
        )
        .annotate(

            total=Count("id"),

            cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="cumple"
                )
            ),

            no_cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="no_cumple"
                )
            ),
        )
        .order_by(
            "-fecha",
            "nombre_auditor"
        )
    )

    resultado = []

    for item in datos:

        fecha = item.get(
            "fecha"
        )

        if not fecha:
            continue

        resultado.append({

            "fecha":
                fecha.strftime(
                    "%Y-%m-%d"
                ),

            "auditor":
                texto_seguro(
                    item.get(
                        "nombre_auditor"
                    ),
                    "Sin auditor"
                ),

            "total":
                item["total"],

            "cumple":
                item["cumple"],

            "no_cumple":
                item["no_cumple"],
        })

    return resultado


# ============================================================
# 8. ERRORES DETALLADOS POR TÉCNICO
# ============================================================

def obtener_errores_detallados_por_tecnico(
    queryset
):

    queryset = queryset.filter(
        resultado_auditoria__iexact="no_cumple"
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
            item.get(
                "nombre_tecnico"
            ),
            "Sin técnico"
        )

        hallazgo = texto_seguro(
            item.get(
                "hallazgo"
            ),
            "Sin hallazgo"
        )

        cantidad = item["cantidad"]

        if tecnico not in tecnicos:

            tecnicos[tecnico] = {

                "tecnico":
                    tecnico,

                "total":
                    0,

                "hallazgos":
                    []
            }

        tecnicos[tecnico]["total"] += \
            cantidad

        tecnicos[tecnico]["hallazgos"].append({

            "hallazgo":
                hallazgo,

            "cantidad":
                cantidad
        })

    resultado = list(
        tecnicos.values()
    )

    resultado.sort(
        key=lambda x: x["total"],
        reverse=True
    )

    return resultado


# ============================================================
# 9. RESULTADO AUDITORÍAS POR TÉCNICO
# ============================================================

def obtener_resultado_auditorias_tecnico(
    queryset,
    supervisor=""
):

    supervisor = texto_seguro(
        supervisor
    )

    tecnicos_queryset = (
        Tecnicos.objects
        .exclude(
            tecnico_apellido_nombres__isnull=True
        )
        .exclude(
            tecnico_apellido_nombres__exact=""
        )
    )

    if supervisor:

        tecnicos_queryset = (
            tecnicos_queryset
            .filter(
                supervisor__iexact=supervisor
            )
        )

    tecnicos = list(
        tecnicos_queryset
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

    # ========================================================
    # MAPA DE AUDITORÍAS
    # ========================================================

    auditorias_por_cedula = {}

    auditorias_por_nombre = {}

    auditorias = (
        queryset
        .exclude(
            fecha__isnull=True
        )
        .values(
            "id",
            "nombre_tecnico",
            "resultado_auditoria",
            "fecha"
        )
    )

    for auditoria in auditorias:

        nombre_original = texto_seguro(
            auditoria.get(
                "nombre_tecnico"
            )
        )

        cedula = (
            extraer_cedula_nombre_tecnico(
                nombre_original
            )
        )

        nombre_limpio = (
            obtener_nombre_sin_cedula(
                nombre_original
            )
        )

        nombre_normalizado = (
            normalizar_texto(
                nombre_limpio
            )
        )

        resultado_auditoria = (
            texto_seguro(
                auditoria.get(
                    "resultado_auditoria"
                )
            ).lower()
        )

        if resultado_auditoria not in (
            "cumple",
            "no_cumple"
        ):
            continue

        fecha = auditoria.get(
            "fecha"
        )

        if not fecha:
            continue

        # ----------------------------------------------------
        # DATOS BASE
        # ----------------------------------------------------

        clave = cedula or nombre_normalizado

        if not clave:
            continue

        if clave not in auditorias_por_cedula:

            auditorias_por_cedula[clave] = {

                "total": 0,

                "cumple": 0,

                "no_cumple": 0,

                "fechas": set(),
            }

        datos = (
            auditorias_por_cedula[
                clave
            ]
        )

        datos["total"] += 1

        if resultado_auditoria == "cumple":

            datos["cumple"] += 1

        else:

            datos["no_cumple"] += 1

        datos["fechas"].add(
            fecha
        )

        # ----------------------------------------------------
        # MAPA POR NOMBRE
        # ----------------------------------------------------

        if nombre_normalizado:

            auditorias_por_nombre[
                nombre_normalizado
            ] = datos

    # ========================================================
    # CREAR RESULTADO
    # ========================================================

    resultado = []

    for tecnico in tecnicos:

        supervisor_tecnico = texto_seguro(
            tecnico.get(
                "supervisor"
            ),
            "Sin supervisor"
        )

        cedula = normalizar_cedula(
            tecnico.get(
                "tecnico_cedula"
            )
        )

        nombre = texto_seguro(
            tecnico.get(
                "tecnico_apellido_nombres"
            ),
            "Sin técnico"
        )

        nombre_normalizado = (
            normalizar_texto(
                nombre
            )
        )

        # ----------------------------------------------------
        # PRIMERA BÚSQUEDA: CÉDULA
        # ----------------------------------------------------

        estadisticas = None

        if cedula:

            estadisticas = (
                auditorias_por_cedula.get(
                    cedula
                )
            )

        # ----------------------------------------------------
        # SEGUNDA BÚSQUEDA: NOMBRE
        # ----------------------------------------------------

        if not estadisticas:

            estadisticas = (
                auditorias_por_nombre.get(
                    nombre_normalizado
                )
            )

        # ----------------------------------------------------
        # CON AUDITORÍAS
        # ----------------------------------------------------

        if estadisticas:

            total = (
                estadisticas["total"]
            )

            cumple = (
                estadisticas["cumple"]
            )

            no_cumple = (
                estadisticas["no_cumple"]
            )

            porcentaje_error = (

                (
                    no_cumple
                    / total
                ) * 100

                if total > 0

                else 0
            )

            fila = {

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
            }

        # ----------------------------------------------------
        # SIN AUDITORÍAS
        # ----------------------------------------------------

        else:

            fila = {

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
            }

        resultado.append(
            fila
        )

    # ========================================================
    # ORDEN
    # ========================================================

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
# 10. RESULTADO AUDITORÍAS POR DIGITADOR
# ============================================================

def obtener_resultado_auditorias_digitador(
    queryset
):

    datos = (
        queryset
        .values(
            "nombre_auditor"
        )
        .annotate(

            auditorias_realizadas=Count(
                "id"
            ),

            no_cumplen=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="no_cumple"
                )
            ),

            cumplen=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="cumple"
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

        total = (
            item["auditorias_realizadas"]
            or 0
        )

        no_cumplen = (
            item["no_cumplen"]
            or 0
        )

        cumplen = (
            item["cumplen"]
            or 0
        )

        tecnicos = (
            item["tecnicos_auditados"]
            or 0
        )

        porcentaje_no_cumple = (

            (
                no_cumplen
                / total
            ) * 100

            if total > 0

            else 0
        )

        resultado.append({

            "digitador":
                texto_seguro(
                    item.get(
                        "nombre_auditor"
                    ),
                    "Sin digitador"
                ),

            "tecnicos_auditados":
                tecnicos,

            "auditorias_realizadas":
                total,

            "porcentaje_no_cumple":
                round(
                    porcentaje_no_cumple,
                    2
                ),

            "no_cumplen":
                no_cumplen,

            "cumplen":
                cumplen,
        })

    resultado.sort(

        key=lambda x:
            x["porcentaje_no_cumple"],

        reverse=True
    )

    return resultado


# ============================================================
# 11. CANTIDAD AUDITORÍAS POR AUDITOR
# ============================================================

def obtener_cantidad_auditorias_por_auditor(
    queryset
):

    datos = (
        queryset
        .values(
            "nombre_auditor"
        )
        .annotate(

            total=Count("id"),

            cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="cumple"
                )
            ),

            no_cumple=Count(
                "id",
                filter=Q(
                    resultado_auditoria__iexact="no_cumple"
                )
            ),
        )
        .order_by(
            "-total",
            "nombre_auditor"
        )
    )

    resultado = []

    for item in datos:

        total = (
            item["total"]
            or 0
        )

        cumple = (
            item["cumple"]
            or 0
        )

        no_cumple = (
            item["no_cumple"]
            or 0
        )

        resultado.append({

            "auditor":
                texto_seguro(
                    item.get(
                        "nombre_auditor"
                    ),
                    "Sin auditor"
                ),

            "total":
                total,

            "cumple":
                cumple,

            "no_cumple":
                no_cumple,
        })

    return resultado


# ============================================================
# 12. RESULTADO DIARIO POR TÉCNICO
# ============================================================

def obtener_resultado_diario_tecnico(
    queryset,
    supervisor=""
):

    supervisor = texto_seguro(
        supervisor
    )

    tecnicos_query = (
        Tecnicos.objects
        .exclude(
            tecnico_apellido_nombres__isnull=True
        )
        .exclude(
            tecnico_apellido_nombres__exact=""
        )
    )

    if supervisor:

        tecnicos_query = (
            tecnicos_query
            .filter(
                supervisor__iexact=supervisor
            )
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

    auditorias = (
        queryset
        .exclude(
            fecha__isnull=True
        )
        .values(
            "nombre_tecnico",
            "fecha",
            "resultado_auditoria"
        )
        .order_by(
            "fecha",
            "nombre_tecnico"
        )
    )

    auditorias_por_clave = {}

    dias = set()

    for auditoria in auditorias:

        nombre_original = texto_seguro(
            auditoria.get(
                "nombre_tecnico"
            )
        )

        cedula = (
            extraer_cedula_nombre_tecnico(
                nombre_original
            )
        )

        nombre_limpio = (
            obtener_nombre_sin_cedula(
                nombre_original
            )
        )

        nombre_normalizado = (
            normalizar_texto(
                nombre_limpio
            )
        )

        clave = (
            cedula
            or nombre_normalizado
        )

        if not clave:
            continue

        fecha = auditoria.get(
            "fecha"
        )

        if not fecha:
            continue

        dia = fecha.strftime(
            "%Y-%m-%d"
        )

        resultado_auditoria = (
            texto_seguro(
                auditoria.get(
                    "resultado_auditoria"
                )
            ).lower()
        )

        if resultado_auditoria not in (
            "cumple",
            "no_cumple"
        ):
            continue

        dias.add(
            dia
        )

        if clave not in auditorias_por_clave:

            auditorias_por_clave[clave] = {
                "dias": {}
            }

        datos_tecnico = (
            auditorias_por_clave[
                clave
            ]
        )

        if resultado_auditoria == "cumple":

            valor = "OK"

        else:

            valor = 1

        if dia not in datos_tecnico["dias"]:

            datos_tecnico["dias"][dia] = valor

        else:

            anterior = (
                datos_tecnico["dias"][dia]
            )

            if (
                anterior == "OK"
                and valor == "OK"
            ):

                datos_tecnico["dias"][dia] = "OK"

            elif (
                anterior == "OK"
                and isinstance(
                    valor,
                    int
                )
            ):

                datos_tecnico["dias"][dia] = valor

            elif (
                isinstance(
                    anterior,
                    int
                )
                and valor == "OK"
            ):

                datos_tecnico["dias"][dia] = anterior

            elif (
                isinstance(
                    anterior,
                    int
                )
                and isinstance(
                    valor,
                    int
                )
            ):

                datos_tecnico["dias"][dia] = (
                    anterior + valor
                )

    resultado = []

    for tecnico in tecnicos_query:

        supervisor_tecnico = texto_seguro(
            tecnico.get(
                "supervisor"
            ),
            "Sin supervisor"
        )

        cedula = normalizar_cedula(
            tecnico.get(
                "tecnico_cedula"
            )
        )

        nombre = texto_seguro(
            tecnico.get(
                "tecnico_apellido_nombres"
            ),
            "Sin técnico"
        )

        nombre_normalizado = (
            normalizar_texto(
                nombre
            )
        )

        # ----------------------------------------------------
        # BUSCAR POR CÉDULA
        # ----------------------------------------------------

        datos = None

        if cedula:

            datos = (
                auditorias_por_clave.get(
                    cedula
                )
            )

        # ----------------------------------------------------
        # FALLBACK POR NOMBRE
        # ----------------------------------------------------

        if not datos:

            datos = (
                auditorias_por_clave.get(
                    nombre_normalizado
                )
            )

        if not datos:

            datos = {
                "dias": {}
            }

        dias_tecnico = datos["dias"]

        errores = 0

        auditados = 0

        for valor in dias_tecnico.values():

            if valor == "OK":

                auditados += 1

            elif isinstance(
                valor,
                int
            ):

                auditados += 1

                errores += valor

        if auditados == 0:

            estado = "Sin auditorías"

        elif errores == 0:

            estado = "Todo bien"

        elif errores >= 5:

            estado = "Crítico"

        else:

            estado = "Mejora"

        if errores == 0:

            accion = "Todo bien"

        else:

            accion = "Volver a auditar"

        resultado.append({

            "supervisor":
                supervisor_tecnico,

            "tecnico":
                nombre,

            "cedula":
                cedula,

            "dias":
                dias_tecnico,

            "total":
                auditados,

            "auditados":
                auditados,

            "errores":
                errores,

            "estado":
                estado,

            "accion":
                accion,

            "tiene_auditorias":
                auditados > 0,
        })

    resultado.sort(

        key=lambda x: (

            x["supervisor"].lower(),

            -x["errores"],

            x["tecnico"].lower()
        )
    )

    return {

        "dias":
            sorted(dias),

        "tecnicos":
            resultado,
    }


# ============================================================
# AGREGAR ESTA FUNCIÓN AL context_processors.py EXISTENTE
# (usa las mismas funciones auxiliares: texto_seguro,
#  normalizar_texto, normalizar_cedula,
#  extraer_cedula_nombre_tecnico, obtener_nombre_sin_cedula)
# ============================================================


def obtener_auditorias_totales_diario_tecnico(
    queryset,
    supervisor=""
):
    """
    Obtiene las auditorías totales por técnico y día.

    Además calcula:
    - Total de auditorías realizadas.
    - Total de auditorías que cumplen.
    - Técnicos auditados por día.
    """

    supervisor = texto_seguro(
        supervisor
    )

    tecnicos_query = (
        Tecnicos.objects
        .exclude(
            tecnico_apellido_nombres__isnull=True
        )
        .exclude(
            tecnico_apellido_nombres__exact=""
        )
    )

    if supervisor:
        tecnicos_query = (
            tecnicos_query
            .filter(
                supervisor__iexact=supervisor
            )
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

    # ========================================================
    # AUDITORÍAS
    # ========================================================

    auditorias = (
        queryset
        .exclude(
            fecha__isnull=True
        )
        .values(
            "nombre_tecnico",
            "fecha",
            "resultado_auditoria"
        )
        .order_by(
            "fecha",
            "nombre_tecnico"
        )
    )

    auditorias_por_clave = {}

    dias = set()

    for auditoria in auditorias:

        nombre_original = texto_seguro(
            auditoria.get(
                "nombre_tecnico"
            )
        )

        cedula = (
            extraer_cedula_nombre_tecnico(
                nombre_original
            )
        )

        nombre_limpio = (
            obtener_nombre_sin_cedula(
                nombre_original
            )
        )

        nombre_normalizado = (
            normalizar_texto(
                nombre_limpio
            )
        )

        clave = (
            cedula
            or nombre_normalizado
        )

        if not clave:
            continue

        fecha = auditoria.get(
            "fecha"
        )

        if not fecha:
            continue

        dia = fecha.strftime(
            "%Y-%m-%d"
        )

        dias.add(dia)

        if clave not in auditorias_por_clave:
            auditorias_por_clave[clave] = {
                "dias": {},
                "cumplen": {}
            }

        datos_tecnico = (
            auditorias_por_clave[
                clave
            ]
        )

        # ====================================================
        # TOTAL DE AUDITORÍAS DEL DÍA
        # ====================================================

        if dia not in datos_tecnico["dias"]:
            datos_tecnico["dias"][dia] = 1
        else:
            datos_tecnico["dias"][dia] += 1

        # ====================================================
        # TOTAL DE AUDITORÍAS QUE CUMPLEN
        # ====================================================

        resultado = texto_seguro(
            auditoria.get(
                "resultado_auditoria"
            )
        ).lower()

        if resultado == "cumple":

            if (
                dia
                not in datos_tecnico["cumplen"]
            ):
                datos_tecnico["cumplen"][dia] = 1

            else:
                datos_tecnico["cumplen"][dia] += 1

    # ========================================================
    # ARMAR RESULTADO POR TÉCNICO
    # ========================================================

    resultado = []

    for tecnico in tecnicos_query:

        supervisor_tecnico = texto_seguro(
            tecnico.get(
                "supervisor"
            ),
            "Sin supervisor"
        )

        cedula = normalizar_cedula(
            tecnico.get(
                "tecnico_cedula"
            )
        )

        nombre = texto_seguro(
            tecnico.get(
                "tecnico_apellido_nombres"
            ),
            "Sin técnico"
        )

        nombre_normalizado = (
            normalizar_texto(
                nombre
            )
        )

        # ----------------------------------------------------
        # BUSCAR POR CÉDULA
        # ----------------------------------------------------

        datos = None

        if cedula:

            datos = (
                auditorias_por_clave.get(
                    cedula
                )
            )

        # ----------------------------------------------------
        # FALLBACK POR NOMBRE
        # ----------------------------------------------------

        if not datos:

            datos = (
                auditorias_por_clave.get(
                    nombre_normalizado
                )
            )

        if not datos:

            datos = {
                "dias": {},
                "cumplen": {}
            }

        dias_tecnico = (
            datos.get(
                "dias",
                {}
            )
        )

        cumplen_tecnico = (
            datos.get(
                "cumplen",
                {}
            )
        )

        total_auditorias = sum(
            dias_tecnico.values()
        )

        total_cumplen = sum(
            cumplen_tecnico.values()
        )

        dias_auditados = len(
            dias_tecnico
        )

        estado = (
            "Auditado"
            if dias_auditados > 0
            else "Sin auditorías"
        )

        resultado.append({

            "supervisor":
                supervisor_tecnico,

            "tecnico":
                nombre,

            "cedula":
                cedula,

            "dias":
                dias_tecnico,

            "cumplen":
                cumplen_tecnico,

            "total":
                total_auditorias,

            "total_cumplen":
                total_cumplen,

            "dias_auditados":
                dias_auditados,

            "estado":
                estado,

            "tiene_auditorias":
                dias_auditados > 0,
        })

    # ========================================================
    # ORDENAMIENTO
    # ========================================================

    resultado.sort(
        key=lambda x: (
            x["supervisor"].lower(),
            not x["tiene_auditorias"],
            -x["total"],
            x["tecnico"].lower()
        )
    )

    return {
        "dias":
            sorted(dias),

        "tecnicos":
            resultado,
    }


# ============================================================
# EN estadisticas_auditorias(request), DENTRO DEL DICCIONARIO
# "contexto", AGREGAR:
# ============================================================
#
#   "Auditorias_Totales_Diario_Tecnico":
#       obtener_auditorias_totales_diario_tecnico(
#           queryset,
#           filtros["supervisor"]
#       ),
#
# ============================================================

def estadisticas_auditorias(request):

    # ========================================================
    # FILTROS
    # ========================================================

    filtros = obtener_filtros(
        request
    )

    # ========================================================
    # SEGURIDAD DEL FILTRO RESULTADO
    # ========================================================

    resultado = texto_seguro(
        filtros.get(
            "resultado"
        )
    ).strip().lower()

    resultado_invalido = resultado in {
        "",
        "undefined",
        "null",
        "n/a",
        "na",
        "tecnico",
        "tecnicos",
        "todos",
    }

    if resultado_invalido:

        filtros["resultado"] = ""

    # ========================================================
    # QUERYSET BASE
    # ========================================================

    queryset = Auditoria.objects.all()

    # ========================================================
    # APLICAR FILTROS
    # ========================================================

    queryset = aplicar_filtros(
        queryset,
        filtros
    )

    # ========================================================
    # OPCIONES DE FILTROS
    # ========================================================

    opciones = obtener_opciones_filtros()

    # ========================================================
    # TOTALES POR OPERACIÓN
    # ========================================================

    total_dc00 = queryset.filter(
        tipo_operacion__iexact="DC00"
    ).count()

    total_rc00 = queryset.filter(
        tipo_operacion__iexact="RC00"
    ).count()

    total_zvcl = queryset.filter(
        tipo_operacion__iexact="ZVCL"
    ).count()

    # ========================================================
    # ESTADO DE CARGA
    # ========================================================

    estado = EstadoCarga.get_solo()

    if estado is None:
        estado = EstadoCarga()


    # ========================================================
    # TOTAL GENERAL
    # ========================================================

    total_operaciones = (
        total_dc00
        + total_rc00
        + total_zvcl
    )

    # ========================================================
    # CONTEXTO
    # ========================================================

    contexto = {

        # ----------------------------------------------------
        # FILTROS
        # ----------------------------------------------------

        "filtros_estadisticas":
            filtros,

        # ----------------------------------------------------
        # OPCIONES
        # ----------------------------------------------------

        **opciones,

        # ----------------------------------------------------
        # TOTALES
        # ----------------------------------------------------

        "Suspensiones":
            total_dc00,

        "Reconexiones":
            total_rc00,

        "Zvcl":
            total_zvcl,

        "total_operaciones":
            total_operaciones,

        # ----------------------------------------------------
        # ESTADÍSTICAS
        # ----------------------------------------------------

        "datos_operaciones":
            obtener_datos_operaciones(
                queryset
            ),

        "Auditoria_Dia":
            obtener_auditorias_dia(
                queryset
            ),

        "Datos_No_Cumplen":
            obtener_datos_no_cumplen(
                queryset
            ),

        "Estadisticas_Tecnico":
            obtener_hallazgos_tecnico(
                queryset
            ),

        "Cantidad_Por_Hallazgo":
            obtener_cantidad_por_hallazgo(
                queryset
            ),

        "Auditorias_Por_Digitador":
            obtener_auditorias_por_digitador(
                queryset
            ),

        "Errores_Detallados_Tecnico":
            obtener_errores_detallados_por_tecnico(
                queryset
            ),

        "Errores_Por_Tecnicos":
            obtener_errores_por_tecnico(
                queryset
            ),

        # ----------------------------------------------------
        # RESULTADO POR TÉCNICO
        # ----------------------------------------------------

        "Resultado_Auditorias_Tecnico":
            obtener_resultado_auditorias_tecnico(
                queryset,
                filtros.get(
                    "supervisor",
                    ""
                )
            ),

        # ----------------------------------------------------
        # RESULTADO POR DIGITADOR
        # ----------------------------------------------------

        "Resultado_Auditorias_Digitador":
            obtener_resultado_auditorias_digitador(
                queryset
            ),

        # ----------------------------------------------------
        # CANTIDAD DE AUDITORÍAS POR AUDITOR
        # ----------------------------------------------------

        "Cantidad_Auditorias_Auditor":
            obtener_cantidad_auditorias_por_auditor(
                queryset
            ),

        # ----------------------------------------------------
        # RESULTADO DIARIO POR TÉCNICO
        # ----------------------------------------------------

        "Resultado_Diario_Tecnico":
            obtener_resultado_diario_tecnico(
                queryset,
                filtros.get(
                    "supervisor",
                    ""
                )
            ),

        # ----------------------------------------------------
        # TOTAL DIARIO POR TÉCNICO
        # ----------------------------------------------------

        "Resultado_Total_Diario_Tecnico":
            obtener_auditorias_totales_diario_tecnico(
                queryset,
                filtros.get(
                    "supervisor",
                    ""
                )
            ),

        # ----------------------------------------------------
        # INFORMACIÓN DE ÚLTIMAS CARGAS
        # ----------------------------------------------------

        "ultima_carga_auditorias_global":
            estado.ultima_carga_auditorias,

        "ultima_carga_tecnicos_global":
            estado.ultima_carga_tecnicos,

        "usuario_ultima_carga_auditorias_global":
            estado.usuario_carga_auditorias,

        "usuario_ultima_carga_tecnicos_global":
            estado.usuario_carga_tecnicos,
    }

    # ========================================================
    # RETORNAR CONTEXTO
    # ========================================================

    return contexto
