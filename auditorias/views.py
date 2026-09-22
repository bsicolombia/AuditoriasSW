import pandas as pd
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import get_template
from django.utils import timezone
import json

from xhtml2pdf import pisa
from carga.decorators import role_required

from .forms import AuditoriaManualForm

from .models import (
    Auditoria,
    HALLAZGOS_ALTO,
    HALLAZGOS_MEDIO,
    HALLAZGOS_BAJO,
)
from carga.models import Tecnicos


import re
import unicodedata


def texto_seguro(valor, defecto=""):
    if valor is None:
        return defecto

    return str(valor).strip()


def normalizar_texto(valor):
    if valor is None:
        return ""

    valor = str(valor).strip().lower()

    valor = unicodedata.normalize(
        "NFKD",
        valor
    )

    valor = "".join(
        caracter
        for caracter in valor
        if not unicodedata.combining(caracter)
    )

    valor = re.sub(
        r"\s+",
        " ",
        valor
    )

    return valor.strip()


def normalizar_cedula(valor):
    if valor is None:
        return ""

    return re.sub(
        r"\D",
        "",
        str(valor).strip()
    )


def extraer_cedula_nombre_tecnico(nombre):
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

# ============================================================
# CARGAR EXCEL
# ============================================================
@login_required
@role_required("Administrador", "Coordinador", "Digitador")
def cargar_excel(request):

    if request.method != "POST":
        return render(
            request,
            "carga/carga.html"
        )

    archivo = request.FILES.get("archivo")

    if not archivo:
        messages.error(
            request,
            "Debe seleccionar un archivo Excel."
        )
        return redirect("cargar_excel")

    try:
        excel = pd.read_excel(archivo)

    except Exception as e:
        messages.error(
            request,
            f"No fue posible leer el archivo Excel: {e}"
        )
        return redirect("cargar_excel")

    columnas_requeridas = [
        "Fecha",
        "Auditor",
        "Cedula",
        "Aplicativo",
        "Fecha Operacion",
        "Tecnico",
        "Cuenta",
        "Orden",
        "Tipo Operacion",
        "Resultado",
        "Observacion",
        "Tipo Hallazgo",
        "Hallazgo",
    ]

    columnas_faltantes = [
        columna
        for columna in columnas_requeridas
        if columna not in excel.columns
    ]

    if columnas_faltantes:
        messages.error(
            request,
            "Faltan las siguientes columnas en el Excel: "
            + ", ".join(columnas_faltantes)
        )

        return redirect("cargar_excel")

    creadas = 0
    errores = []

    for numero_fila, fila in excel.iterrows():

        fila_excel = numero_fila + 2

        try:

            # ------------------------------------------------
            # FECHAS
            # ------------------------------------------------

            fecha = pd.to_datetime(
                fila["Fecha"],
                errors="coerce"
            )

            fecha_operacion = pd.to_datetime(
                fila["Fecha Operacion"],
                errors="coerce"
            )

            if pd.isna(fecha):
                raise ValueError(
                    "La fecha de auditoría no es válida."
                )

            if pd.isna(fecha_operacion):
                raise ValueError(
                    "La fecha de operación no es válida."
                )

            # ------------------------------------------------
            # CUENTA
            # ------------------------------------------------

            numero_cuenta = str(
                fila["Cuenta"]
            ).strip()

            if numero_cuenta.endswith(".0"):
                numero_cuenta = numero_cuenta[:-2]

            # ------------------------------------------------
            # ORDEN
            # ------------------------------------------------

            numero_orden = str(
                fila["Orden"]
            ).strip()

            if numero_orden.endswith(".0"):
                numero_orden = numero_orden[:-2]

            # ------------------------------------------------
            # RESULTADO
            # ------------------------------------------------

            resultado = str(
                fila["Resultado"]
            ).strip().lower()

            mapa_resultados = {
                "cumple": "cumple",
                "no cumple": "no_cumple",
                "no_cumple": "no_cumple",
            }

            resultado = mapa_resultados.get(
                resultado,
                resultado
            )

            # ------------------------------------------------
            # TIPO HALLAZGO
            # ------------------------------------------------

            tipo_hallazgo = str(
                fila["Tipo Hallazgo"]
            ).strip()

            if tipo_hallazgo.lower() in (
                "",
                "nan",
                "none",
            ):
                tipo_hallazgo = None

            # ------------------------------------------------
            # HALLAZGO
            # ------------------------------------------------

            hallazgo = str(
                fila["Hallazgo"]
            ).strip()

            if hallazgo.lower() in (
                "",
                "nan",
                "none",
            ):
                hallazgo = None

            # ------------------------------------------------
            # OBSERVACIÓN
            # ------------------------------------------------

            observacion = str(
                fila["Observacion"]
            ).strip()

            if observacion.lower() in (
                "nan",
                "none",
            ):
                observacion = ""

            # ------------------------------------------------
            # APLICATIVO
            # ------------------------------------------------

            aplicativo = str(
                fila["Aplicativo"]
            ).strip().upper()

            if aplicativo not in ("SAP", "FIVE"):
                raise ValueError(
                    "El aplicativo debe ser 'SAP' o 'FIVE'."
                )

            # ------------------------------------------------
            # CREAR AUDITORÍA
            # ------------------------------------------------

            auditoria = Auditoria(
                fecha=fecha.to_pydatetime(),

                nombre_auditor=str(
                    fila["Auditor"]
                ).strip(),

                numero_cedula=str(
                    fila["Cedula"]
                ).strip(),

                aplicativo=aplicativo,

                fecha_operacion=fecha_operacion.date(),

                nombre_tecnico=str(
                    fila["Tecnico"]
                ).strip(),

                numero_cuenta_contrato=numero_cuenta,

                numero_orden=numero_orden,

                tipo_operacion=str(
                    fila["Tipo Operacion"]
                ).strip(),

                resultado_auditoria=resultado,

                observacion=observacion,

                tipo_hallazgo=tipo_hallazgo,

                hallazgo=hallazgo,

                origen="excel",
            )

            # ------------------------------------------------
            # VALIDAR Y GUARDAR
            # ------------------------------------------------

            auditoria.full_clean()
            auditoria.save()

            creadas += 1

        except Exception as e:

            errores.append(
                f"Fila {fila_excel}: {str(e)}"
            )

    if creadas:

        messages.success(
            request,
            f"Se cargaron correctamente {creadas} auditorías."
        )

    if errores:

        messages.warning(
            request,
            f"No se pudieron cargar {len(errores)} filas."
        )

    return render(
        request,
        "carga/carga.html",
        {
            "mensaje": (
                f"Registros cargados: {creadas}. "
                f"Errores: {len(errores)}."
            ),
            "errores": errores,
        }
    )

# ============================================================
# FUNCIÓN GENERAL DE FILTROS
# ============================================================

def filtrar_auditorias(request):

    auditorias = Auditoria.objects.all()

    # ========================================================
    # AÑO
    # ========================================================

    ano_auditoria = request.GET.get(
        "ano_auditoria",
        ""
    ).strip()

    if ano_auditoria and ano_auditoria != "todos":
        try:
            auditorias = auditorias.filter(
                fecha__year=int(ano_auditoria)
            )
        except (ValueError, TypeError):
            pass

    # ========================================================
    # MES
    # ========================================================

    mes_auditoria = request.GET.get(
        "mes_auditoria",
        ""
    ).strip()

    if mes_auditoria and mes_auditoria != "todos":
        try:
            auditorias = auditorias.filter(
                fecha__month=int(mes_auditoria)
            )
        except (ValueError, TypeError):
            pass

    # ========================================================
    # FILTROS
    # ========================================================

    filtros = {
        "nombre_auditor": "nombre_auditor",
        "numero_cedula": "numero_cedula",
        "aplicativo": "aplicativo",
        "nombre_tecnico": "nombre_tecnico",
        "numero_cuenta_contrato": "numero_cuenta_contrato",
        "numero_orden": "numero_orden",
        "tipo_operacion": "tipo_operacion",
        "resultado_auditoria": "resultado_auditoria",
        "tipo_hallazgo": "tipo_hallazgo",
        "hallazgo": "hallazgo",
    }

    for parametro, campo in filtros.items():

        valor = request.GET.get(
            parametro,
            ""
        ).strip()

        if valor:
            auditorias = auditorias.filter(
                **{campo: valor}
            )

    # ========================================================
    # FECHA OPERACIÓN DESDE
    # ========================================================

    fecha_operacion_desde = request.GET.get(
        "fecha_operacion_desde",
        ""
    ).strip()

    if fecha_operacion_desde:
        auditorias = auditorias.filter(
            fecha_operacion__gte=fecha_operacion_desde
        )

    # ========================================================
    # FECHA OPERACIÓN HASTA
    # ========================================================

    fecha_operacion_hasta = request.GET.get(
        "fecha_operacion_hasta",
        ""
    ).strip()

    if fecha_operacion_hasta:
        auditorias = auditorias.filter(
            fecha_operacion__lte=fecha_operacion_hasta
        )

    # ========================================================
    # FECHA AUDITORÍA DESDE
    # ========================================================

    fecha_inicio_auditoria = request.GET.get(
        "fecha_inicio_auditoria",
        ""
    ).strip()

    if fecha_inicio_auditoria:
        auditorias = auditorias.filter(
            fecha__date__gte=fecha_inicio_auditoria
        )

    # ========================================================
    # FECHA AUDITORÍA HASTA
    # ========================================================

    fecha_fin_auditoria = request.GET.get(
        "fecha_fin_auditoria",
        ""
    ).strip()

    if fecha_fin_auditoria:
        auditorias = auditorias.filter(
            fecha__date__lte=fecha_fin_auditoria
        )

    # ========================================================
    # ORDEN
    # ========================================================

    return auditorias.order_by(
        "-fecha",
        "-fecha_operacion",
        "-id"
    )


@role_required(
    "Administrador",
    "Coordinador",
    "Digitador"
)
def consulta(request):

    # ========================================================
    # FECHA ACTUAL
    # ========================================================

    hoy = timezone.localdate()

    ano_actual = str(hoy.year)
    mes_actual = str(hoy.month)

    # ========================================================
    # AÑO Y MES SELECCIONADOS
    # ========================================================

    ano_auditoria = request.GET.get(
        "ano_auditoria",
        ""
    ).strip()

    mes_auditoria = request.GET.get(
        "mes_auditoria",
        ""
    ).strip()

    # ========================================================
    # PRIMERA CARGA: AÑO Y MES ACTUAL
    # ========================================================

    if not request.GET:

        ano_auditoria = ano_actual
        mes_auditoria = mes_actual

    else:

        if ano_auditoria == "todos":
            ano_auditoria = ""

        if mes_auditoria == "todos":
            mes_auditoria = ""

    # ========================================================
    # QUERYSET
    # ========================================================

    auditorias = Auditoria.objects.all()

    # ========================================================
    # FILTRO AÑO
    # ========================================================

    try:

        auditorias = auditorias.filter(
            fecha__year=int(ano_auditoria)
        )

    except (ValueError, TypeError):

        pass

    # ========================================================
    # FILTRO MES
    # ========================================================

    try:

        auditorias = auditorias.filter(
            fecha__month=int(mes_auditoria)
        )

    except (ValueError, TypeError):

        pass

    # ========================================================
    # OBTENER FILTROS
    # ========================================================

    nombre_tecnico = request.GET.get(
        "nombre_tecnico",
        ""
    ).strip()

    supervisor = request.GET.get(
        "supervisor",
        ""
    ).strip()

    hallazgo = request.GET.get(
        "hallazgo",
        ""
    ).strip()

    resultado_auditoria = request.GET.get(
        "resultado_auditoria",
        ""
    ).strip()

    tipo_operacion = request.GET.get(
        "tipo_operacion",
        ""
    ).strip()

    nombre_auditor = request.GET.get(
        "nombre_auditor",
        ""
    ).strip()

    numero_cedula = request.GET.get(
        "numero_cedula",
        ""
    ).strip()

    aplicativo = request.GET.get(
        "aplicativo",
        ""
    ).strip()

    numero_cuenta_contrato = request.GET.get(
        "numero_cuenta_contrato",
        ""
    ).strip()

    numero_orden = request.GET.get(
        "numero_orden",
        ""
    ).strip()

    tipo_hallazgo = request.GET.get(
        "tipo_hallazgo",
        ""
    ).strip()

    fecha_operacion_desde = request.GET.get(
        "fecha_operacion_desde",
        ""
    ).strip()

    fecha_operacion_hasta = request.GET.get(
        "fecha_operacion_hasta",
        ""
    ).strip()

    origen = request.GET.get(
        "origen",
        ""
    ).strip()

    # ========================================================
    # APLICAR FILTROS
    # ========================================================

    if nombre_tecnico:

        auditorias = auditorias.filter(
            nombre_tecnico=nombre_tecnico
        )

    if supervisor:

        supervisor_limpio = texto_seguro(
            supervisor
        )

        tecnicos_supervisor = list(
            Tecnicos.objects
            .filter(
                supervisor__iexact=supervisor_limpio
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

        for tecnico in tecnicos_supervisor:

            cedula = normalizar_cedula(
                tecnico.get(
                    "tecnico_cedula"
                )
            )

            nombre = texto_seguro(
                tecnico.get(
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
            auditorias
            .values(
                "id",
                "nombre_tecnico"
            )
        )

        for auditoria in auditorias_supervisor:

            nombre_original = texto_seguro(
                auditoria.get(
                    "nombre_tecnico"
                )
            )

            cedula_auditoria = (
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

            match_cedula = (
                cedula_auditoria
                and cedula_auditoria
                in cedulas_supervisor
            )

            match_nombre = (
                nombre_normalizado
                and nombre_normalizado
                in nombres_supervisor
            )

            if match_cedula or match_nombre:

                ids_supervisor.append(
                    auditoria["id"]
                )

        ids_supervisor = list(
            dict.fromkeys(
                ids_supervisor
            )
        )

        auditorias = auditorias.filter(
            id__in=ids_supervisor
        )

    if hallazgo:

        auditorias = auditorias.filter(
            hallazgo=hallazgo
        )

    if resultado_auditoria:

        auditorias = auditorias.filter(
            resultado_auditoria=resultado_auditoria
        )

    if tipo_operacion:

        auditorias = auditorias.filter(
            tipo_operacion=tipo_operacion
        )

    if nombre_auditor:

        auditorias = auditorias.filter(
            nombre_auditor=nombre_auditor
        )

    if numero_cedula:

        cedula_buscada = normalizar_cedula(
            numero_cedula
        )

        ids_cedula = []

        auditorias_cedula = (
            auditorias
            .values(
                "id",
                "nombre_tecnico"
            )
        )

        for auditoria in auditorias_cedula:

            nombre_tecnico = texto_seguro(
                auditoria.get(
                    "nombre_tecnico"
                )
            )

            cedula_tecnico = (
                extraer_cedula_nombre_tecnico(
                    nombre_tecnico
                )
            )

            if (
                cedula_tecnico
                and cedula_buscada
                in cedula_tecnico
            ):

                ids_cedula.append(
                    auditoria["id"]
                )

        auditorias = auditorias.filter(
            id__in=ids_cedula
        )

    if aplicativo:

        auditorias = auditorias.filter(
            aplicativo=aplicativo
        )

    if numero_cuenta_contrato:

        auditorias = auditorias.filter(
            numero_cuenta_contrato__icontains=numero_cuenta_contrato
        )

    if numero_orden:

        auditorias = auditorias.filter(
            numero_orden__icontains=numero_orden
        )

    if tipo_hallazgo:

        auditorias = auditorias.filter(
            tipo_hallazgo=tipo_hallazgo
        )

    if fecha_operacion_desde:

        auditorias = auditorias.filter(
            fecha_operacion__gte=fecha_operacion_desde
        )

    if fecha_operacion_hasta:

        auditorias = auditorias.filter(
            fecha_operacion__lte=fecha_operacion_hasta
        )

    if origen:

        auditorias = auditorias.filter(
            origen=origen
        )

    # ========================================================
    # ORDEN
    # ========================================================

    auditorias = auditorias.order_by(
        "-fecha",
        "-fecha_operacion",
        "-id"
    )

    # ========================================================
    # CANTIDAD
    # ========================================================

    cantidad = auditorias.count()

    # ========================================================
    # ESTADÍSTICAS
    # ========================================================

    suspensiones = auditorias.filter(
        tipo_operacion="DC00"
    ).count()

    reconexiones = auditorias.filter(
        tipo_operacion="RC00"
    ).count()

    zvcl = auditorias.filter(
        tipo_operacion="ZVCL"
    ).count()

    total_operaciones = cantidad

    # ========================================================
    # OPCIONES DE LOS SELECT
    # ========================================================

    nombres_auditores = (
        Auditoria.objects
        .exclude(nombre_auditor__isnull=True)
        .exclude(nombre_auditor="")
        .values_list(
            "nombre_auditor",
            flat=True
        )
        .distinct()
        .order_by("nombre_auditor")
    )

    aplicativos = (
        Auditoria.objects
        .exclude(aplicativo__isnull=True)
        .exclude(aplicativo="")
        .values_list(
            "aplicativo",
            flat=True
        )
        .distinct()
        .order_by("aplicativo")
    )

    nombres_tecnicos = (
        Auditoria.objects
        .exclude(nombre_tecnico__isnull=True)
        .exclude(nombre_tecnico="")
        .values_list(
            "nombre_tecnico",
            flat=True
        )
        .distinct()
        .order_by("nombre_tecnico")
    )

    tipos_operacion = (
        Auditoria.objects
        .exclude(tipo_operacion__isnull=True)
        .exclude(tipo_operacion="")
        .values_list(
            "tipo_operacion",
            flat=True
        )
        .distinct()
        .order_by("tipo_operacion")
    )

    resultados_auditoria = (
        Auditoria.objects
        .exclude(resultado_auditoria__isnull=True)
        .exclude(resultado_auditoria="")
        .values_list(
            "resultado_auditoria",
            flat=True
        )
        .distinct()
        .order_by("resultado_auditoria")
    )

    tipos_hallazgo = (
        Auditoria.objects
        .exclude(tipo_hallazgo__isnull=True)
        .exclude(tipo_hallazgo="")
        .values_list(
            "tipo_hallazgo",
            flat=True
        )
        .distinct()
        .order_by("tipo_hallazgo")
    )

    hallazgos = (
        Auditoria.objects
        .exclude(hallazgo__isnull=True)
        .exclude(hallazgo="")
        .values_list(
            "hallazgo",
            flat=True
        )
        .distinct()
        .order_by("hallazgo")
    )

    # ========================================================
    # AÑOS DISPONIBLES
    # ========================================================

    anos_auditoria = (
        Auditoria.objects
        .filter(fecha__isnull=False)
        .dates(
            "fecha",
            "year",
            order="DESC"
        )
    )

    # ========================================================
    # SUPERVISORES
    # ========================================================

    supervisores = (
        Tecnicos.objects
        .exclude(supervisor__isnull=True)
        .exclude(supervisor="")
        .values_list(
            "supervisor",
            flat=True
        )
        .distinct()
        .order_by("supervisor")
    )

    # ========================================================
    # CONTEXTO
    # ========================================================

    context = {

        "Auditorias": auditorias,

        "Cantidad": cantidad,

        "Suspensiones": suspensiones,

        "Reconexiones": reconexiones,

        "Zvcl": zvcl,

        "total_operaciones": total_operaciones,

        "ano_auditoria": ano_auditoria,

        "mes_auditoria": mes_auditoria,

        "nombres_auditores": nombres_auditores,

        "aplicativos": aplicativos,

        "nombres_tecnicos": nombres_tecnicos,

        "tipos_operacion": tipos_operacion,

        "resultados_auditoria": resultados_auditoria,

        "tipos_hallazgo": tipos_hallazgo,

        "hallazgos": hallazgos,

        "anos_auditoria": anos_auditoria,

        "supervisores": supervisores,
    }

    return render(
        request,
        "auditorias/consulta.html",
        context
    )
def exportar_excel(request):

    auditorias = filtrar_auditorias(request)

    datos = []

    for a in auditorias:

        # ------------------------------------------------
        # QUITAR ZONA HORARIA PARA EXCEL
        # ------------------------------------------------

        fecha_sin_tz = a.fecha

        if fecha_sin_tz and timezone.is_aware(fecha_sin_tz):
            fecha_sin_tz = timezone.localtime(
                fecha_sin_tz
            ).replace(tzinfo=None)

        datos.append({

            "Fecha":
                fecha_sin_tz,

            "Nombre Auditor":
                a.nombre_auditor,

            "Numero Cedula":
                a.numero_cedula,

            "Aplicativo":
                a.aplicativo,

            "Fecha Operacion":
                a.fecha_operacion,

            "Nombre Tecnico":
                a.nombre_tecnico,

            "Numero Cuenta Contrato":
                a.numero_cuenta_contrato,

            "Numero Orden":
                a.numero_orden,

            "Tipo Operacion":
                a.tipo_operacion,

            "Resultado Auditoria":
                a.resultado_auditoria,

            "Observacion":
                a.observacion,

            "Tipo Hallazgo":
                a.tipo_hallazgo,

            "Hallazgo":
                a.hallazgo
        })

    df = pd.DataFrame(datos)

    response = HttpResponse(
        content_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        )
    )

    response["Content-Disposition"] = (
        'attachment; filename="auditorias.xlsx"'
    )

    with pd.ExcelWriter(
        response,
        engine="openpyxl"
    ) as writer:

        df.to_excel(
            writer,
            index=False,
            sheet_name="Auditorias"
        )

    return response
# ============================================================
# ESTADÍSTICAS
# ============================================================

def estadistica(request):

    return render(
        request,
        "auditorias/estadistica.html"
    )


# ============================================================
# REAUDITAR
# ============================================================

@role_required(
    "Administrador",
    "Coordinador",
    "Digitador"
)
def reauditar(request):

    return render(
        request,
        "auditorias/reauditar.html"
    )

# ============================================================
# CREAR AUDITORÍA MANUAL
# ============================================================
@role_required(
    "Administrador",
    "Coordinador",
    "Digitador"
)
def auditoria_manual_crear(request):

    perfil = getattr(
        request.user,
        "perfil",
        None
    )

    cedula_usuario = (
        perfil.numero_cedula
        if perfil
        else ""
    )

    if not cedula_usuario:

        messages.error(
            request,
            "Su usuario no tiene una cédula registrada. "
            "Pida a un Administrador que se la agregue en "
            "/admin/ antes de registrar auditorías.",
        )

        return redirect("index")

    nombre_auditor = (
        request.user.get_full_name()
        or request.user.username
    )

    auditoria_base = Auditoria(

        fecha=timezone.now(),

        nombre_auditor=nombre_auditor,

        numero_cedula=cedula_usuario,

        origen="manual",

        creado_por=request.user,
    )

    if request.method == "POST":

        form = AuditoriaManualForm(
            request.POST,
            request.FILES,
            instance=auditoria_base,
        )

        if form.is_valid():

            auditoria = form.save()

            messages.success(
                request,
                f"Auditoría registrada correctamente "
                f"(Orden {auditoria.numero_orden}).",
            )

            return redirect(
                "auditoria_manual_crear"
            )

        messages.error(
            request,
            "Revise los errores del formulario. "
            "No fue posible guardar la auditoría.",
        )

    else:

        form = AuditoriaManualForm(
            instance=auditoria_base
        )

    return render(
    request,
    "auditorias/auditoria_manual_form.html",
    {
        "form": form,

        "modo": "crear",

        "nombre_auditor": nombre_auditor,

        "cedula_usuario": cedula_usuario,

        "fecha_hoy": timezone.localdate(),

        "hallazgos_json": json.dumps(
            form.get_hallazgos_json()
        ),
    },
)


# ============================================================
# EDITAR AUDITORÍA
# ============================================================
@role_required(
    "Administrador",
    "Coordinador",
    "Digitador"
)
def auditoria_manual_editar(request, pk):

    auditoria = get_object_or_404(
        Auditoria,
        pk=pk
    )

    es_admin_o_coordinador = (
        request.user.is_superuser
        or request.user.groups.filter(
            name__in=[
                "Administrador",
                "Coordinador"
            ]
        ).exists()
    )

    if (
        not es_admin_o_coordinador
        and auditoria.creado_por_id != request.user.id
    ):

        messages.error(
            request,
            "No tiene permiso para editar esta auditoría.",
        )

        return redirect(
            "auditoria_manual_crear"
        )

    if request.method == "POST":

        form = AuditoriaManualForm(
            request.POST,
            request.FILES,
            instance=auditoria,
        )

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Auditoría actualizada correctamente."
            )

            return redirect(
                "consulta"
            )

        messages.error(
            request,
            "Revise los errores del formulario."
        )

    else:

        form = AuditoriaManualForm(
            instance=auditoria
        )

    return render(
        request,
        "auditorias/auditoria_manual_form.html",
        {
            "form": form,

            "modo": "editar",

            "auditoria":
                auditoria,

            "nombre_auditor":
                auditoria.nombre_auditor,

            "cedula_usuario":
                auditoria.numero_cedula,

            "fecha_hoy":
                auditoria.fecha,
        },
    )


# ============================================================
# ELIMINAR AUDITORÍA
# ============================================================

@login_required
@role_required(
    "Administrador",
    "Coordinador"
)
def auditoria_manual_eliminar(request, pk):

    auditoria = get_object_or_404(
        Auditoria,
        pk=pk
    )

    if request.method == "POST":

        auditoria.delete()

        messages.success(
            request,
            "Auditoría eliminada correctamente.",
        )

        return redirect(
            "consulta"
        )

    return render(
        request,
        "auditorias/auditoria_confirmar_eliminar.html",
        {
            "auditoria":
                auditoria,
        },
    )

def ver_foto_auditoria(request, numero_orden):

    auditoria = get_object_or_404(
        Auditoria,
        numero_orden=numero_orden
    )

    if not auditoria.foto_evidencia:
        messages.error(
            request,
            "Esta auditoría no tiene una foto de evidencia."
        )
        return redirect("consulta")

    return redirect(
        auditoria.foto_evidencia.url
    )
