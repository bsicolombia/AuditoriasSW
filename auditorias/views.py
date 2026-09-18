from datetime import datetime, time
import pandas as pd
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import get_template
from django.utils import timezone
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from xhtml2pdf import pisa
from carga.decorators import role_required
from .forms import AuditoriaManualForm
from .models import (
    Auditoria,
    HALLAZGOS_ALTO,
    HALLAZGOS_MEDIO,
    HALLAZGOS_BAJO,
)

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

            numero_orden = str(
                fila["Orden"]
            ).strip()

            if numero_orden.endswith(".0"):
                numero_orden = numero_orden[:-2]

            numero_cuenta = str(
                fila["Cuenta"]
            ).strip()

            if numero_cuenta.endswith(".0"):
                numero_cuenta = numero_cuenta[:-2]

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

            tipo_hallazgo = str(
                fila["Tipo Hallazgo"]
            ).strip()

            if tipo_hallazgo.lower() in (
                "",
                "nan",
                "none",
            ):
                tipo_hallazgo = None

            hallazgo = str(
                fila["Hallazgo"]
            ).strip()

            if hallazgo.lower() in (
                "",
                "nan",
                "none",
            ):
                hallazgo = None

            observacion = str(
                fila["Observacion"]
            ).strip()

            if observacion.lower() in (
                "nan",
                "none",
            ):
                observacion = ""

            auditoria = Auditoria(
                fecha=fecha.to_pydatetime(),
                nombre_auditor=str(
                    fila["Auditor"]
                ).strip(),
                numero_cedula=str(
                    fila["Cedula"]
                ).strip(),
                aplicativo=str(
                    fila["Aplicativo"]
                ).strip(),
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

def filtrar_auditorias(request):

    auditorias = Auditoria.objects.all()

    # =====================================================
    # FILTROS DE TEXTO
    # =====================================================

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

    nombre_tecnico = request.GET.get(
        "nombre_tecnico",
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

    tipo_operacion = request.GET.get(
        "tipo_operacion",
        ""
    ).strip()

    resultado_auditoria = request.GET.get(
        "resultado_auditoria",
        ""
    ).strip()

    tipo_hallazgo = request.GET.get(
        "tipo_hallazgo",
        ""
    ).strip()

    hallazgo = request.GET.get(
        "hallazgo",
        ""
    ).strip()

    # =====================================================
    # APLICAR FILTROS
    # =====================================================

    if nombre_auditor:
        auditorias = auditorias.filter(
            nombre_auditor__icontains=nombre_auditor
        )

    if numero_cedula:
        auditorias = auditorias.filter(
            numero_cedula__icontains=numero_cedula
        )

    if aplicativo:
        auditorias = auditorias.filter(
            aplicativo__icontains=aplicativo
        )

    if nombre_tecnico:
        auditorias = auditorias.filter(
            nombre_tecnico__icontains=nombre_tecnico
        )

    if numero_cuenta_contrato:
        auditorias = auditorias.filter(
            numero_cuenta_contrato__icontains=numero_cuenta_contrato
        )

    if numero_orden:
        auditorias = auditorias.filter(
            numero_orden__icontains=numero_orden
        )

    if tipo_operacion:
        auditorias = auditorias.filter(
            tipo_operacion=tipo_operacion
        )

    if resultado_auditoria:
        auditorias = auditorias.filter(
            resultado_auditoria=resultado_auditoria
        )

    if tipo_hallazgo:
        auditorias = auditorias.filter(
            tipo_hallazgo=tipo_hallazgo
        )

    if hallazgo:
        auditorias = auditorias.filter(
            hallazgo__icontains=hallazgo
        )

    # =====================================================
    # FECHA DE OPERACIÓN
    #
    # Es DateField
    # =====================================================

    fecha_operacion_desde = request.GET.get(
        "fecha_operacion_desde",
        ""
    ).strip()

    fecha_operacion_hasta = request.GET.get(
        "fecha_operacion_hasta",
        ""
    ).strip()

    if fecha_operacion_desde:
        auditorias = auditorias.filter(
            fecha_operacion__gte=fecha_operacion_desde
        )

    if fecha_operacion_hasta:
        auditorias = auditorias.filter(
            fecha_operacion__lte=fecha_operacion_hasta
        )

    # =====================================================
    # FECHA DE AUDITORÍA
    #
    # Es DateTimeField
    # =====================================================

    fecha_inicio_auditoria = request.GET.get(
        "fecha_inicio_auditoria",
        ""
    ).strip()

    fecha_fin_auditoria = request.GET.get(
        "fecha_fin_auditoria",
        ""
    ).strip()

    if fecha_inicio_auditoria:
        auditorias = auditorias.filter(
            fecha__date__gte=fecha_inicio_auditoria
        )

    if fecha_fin_auditoria:
        auditorias = auditorias.filter(
            fecha__date__lte=fecha_fin_auditoria
        )

    # =====================================================
    # ORDEN
    # =====================================================

    return auditorias.order_by(
        "-fecha",
        "-fecha_operacion"
    )


@role_required("Administrador", "Coordinador", "Digitador")
def consulta(request):

    # =====================================================
    # CONSULTA BASE
    # =====================================================

    auditorias = Auditoria.objects.all()


    # =====================================================
    # OBTENER VALORES DE LOS FILTROS
    # =====================================================

    nombre_auditor = request.GET.get(
        "nombre_auditor", ""
    ).strip()

    numero_cedula = request.GET.get(
        "numero_cedula", ""
    ).strip()

    aplicativo = request.GET.get(
        "aplicativo", ""
    ).strip()

    nombre_tecnico = request.GET.get(
        "nombre_tecnico", ""
    ).strip()

    numero_cuenta_contrato = request.GET.get(
        "numero_cuenta_contrato", ""
    ).strip()

    numero_orden = request.GET.get(
        "numero_orden", ""
    ).strip()

    tipo_operacion = request.GET.get(
        "tipo_operacion", ""
    ).strip()

    resultado_auditoria = request.GET.get(
        "resultado_auditoria", ""
    ).strip()

    tipo_hallazgo = request.GET.get(
        "tipo_hallazgo", ""
    ).strip()

    hallazgo = request.GET.get(
        "hallazgo", ""
    ).strip()

    # =====================================================
    # FECHA ACTUAL
    # =====================================================

    fecha_actual = datetime.now()

    mes_actual = str(fecha_actual.month)
    ano_actual = str(fecha_actual.year)


    # =====================================================
    # OBTENER VALORES DE LOS FILTROS
    # =====================================================

    mes_auditoria = request.GET.get(
        "mes_auditoria",
        mes_actual
    ).strip()

    ano_auditoria = request.GET.get(
        "ano_auditoria",
        ano_actual
    ).strip()


    fecha_operacion_desde = request.GET.get(
        "fecha_operacion_desde", ""
    ).strip()

    fecha_operacion_hasta = request.GET.get(
        "fecha_operacion_hasta", ""
    ).strip()


    # =====================================================
    # APLICAR FILTROS
    # =====================================================

    if nombre_auditor:
        auditorias = auditorias.filter(
            nombre_auditor=nombre_auditor
        )

    if numero_cedula:
        auditorias = auditorias.filter(
            numero_cedula=numero_cedula
        )

    if aplicativo:
        auditorias = auditorias.filter(
            aplicativo=aplicativo
        )

    if nombre_tecnico:
        auditorias = auditorias.filter(
            nombre_tecnico=nombre_tecnico
        )

    if numero_cuenta_contrato:
        auditorias = auditorias.filter(
            numero_cuenta_contrato=numero_cuenta_contrato
        )

    if numero_orden:
        auditorias = auditorias.filter(
            numero_orden=numero_orden
        )

    if tipo_operacion:
        auditorias = auditorias.filter(
            tipo_operacion=tipo_operacion
        )

    if resultado_auditoria:
        auditorias = auditorias.filter(
            resultado_auditoria=resultado_auditoria
        )

    if tipo_hallazgo:
        auditorias = auditorias.filter(
            tipo_hallazgo=tipo_hallazgo
        )

    if hallazgo:
        auditorias = auditorias.filter(
            hallazgo=hallazgo
        )


    # =====================================================
    # MES DE AUDITORÍA
    # =====================================================

    if mes_auditoria:
        auditorias = auditorias.filter(
            fecha__month=int(mes_auditoria)
        )


    # =====================================================
    # AÑO DE AUDITORÍA
    # =====================================================

    if ano_auditoria:
        auditorias = auditorias.filter(
            fecha__year=int(ano_auditoria)
        )


    # =====================================================
    # FECHA OPERACIÓN DESDE
    # =====================================================

    if fecha_operacion_desde:
        auditorias = auditorias.filter(
            fecha_operacion__gte=fecha_operacion_desde
        )


    # =====================================================
    # FECHA OPERACIÓN HASTA
    # =====================================================

    if fecha_operacion_hasta:
        auditorias = auditorias.filter(
            fecha_operacion__lte=fecha_operacion_hasta
        )


    # =====================================================
    # ORDENAR RESULTADOS
    # =====================================================

    auditorias = auditorias.order_by(
        "-fecha",
        "-fecha_operacion"
    )


    # =====================================================
    # CANTIDAD
    # =====================================================

    cantidad = auditorias.count()


    # =====================================================
    # OPCIONES PARA LOS SELECT
    #
    # Estas se obtienen de TODA la base de datos,
    # no del queryset filtrado.
    # =====================================================

    nombres_auditores = (
        Auditoria.objects
        .exclude(nombre_auditor="")
        .values_list("nombre_auditor", flat=True)
        .distinct()
        .order_by("nombre_auditor")
    )

    cedulas = (
        Auditoria.objects
        .exclude(numero_cedula="")
        .values_list("numero_cedula", flat=True)
        .distinct()
        .order_by("numero_cedula")
    )

    aplicativos = (
        Auditoria.objects
        .exclude(aplicativo="")
        .values_list("aplicativo", flat=True)
        .distinct()
        .order_by("aplicativo")
    )

    nombres_tecnicos = (
        Auditoria.objects
        .exclude(nombre_tecnico="")
        .values_list("nombre_tecnico", flat=True)
        .distinct()
        .order_by("nombre_tecnico")
    )

    cuentas_contrato = (
        Auditoria.objects
        .exclude(numero_cuenta_contrato="")
        .values_list("numero_cuenta_contrato", flat=True)
        .distinct()
        .order_by("numero_cuenta_contrato")
    )

    numeros_orden = (
        Auditoria.objects
        .exclude(numero_orden="")
        .values_list("numero_orden", flat=True)
        .distinct()
        .order_by("numero_orden")
    )

    tipos_operacion = (
        Auditoria.objects
        .exclude(tipo_operacion="")
        .values_list("tipo_operacion", flat=True)
        .distinct()
        .order_by("tipo_operacion")
    )

    resultados_auditoria = (
        Auditoria.objects
        .exclude(resultado_auditoria="")
        .values_list("resultado_auditoria", flat=True)
        .distinct()
        .order_by("resultado_auditoria")
    )

    tipos_hallazgo = (
        Auditoria.objects
        .exclude(tipo_hallazgo="")
        .values_list("tipo_hallazgo", flat=True)
        .distinct()
        .order_by("tipo_hallazgo")
    )

    hallazgos = (
        Auditoria.objects
        .exclude(hallazgo="")
        .values_list("hallazgo", flat=True)
        .distinct()
        .order_by("hallazgo")
    )

    anos_auditoria = (
        Auditoria.objects
        .dates("fecha", "year", order="DESC")
    )


    # =====================================================
    # CONTEXTO
    # =====================================================

    context = {

        "Auditorias": auditorias,

        "Cantidad": cantidad,

        "ano_auditoria": ano_auditoria,

        "mes_auditoria": mes_auditoria,

        # Select dinámicos
        "nombres_auditores": nombres_auditores,
        "cedulas": cedulas,
        "aplicativos": aplicativos,
        "nombres_tecnicos": nombres_tecnicos,
        "cuentas_contrato": cuentas_contrato,
        "numeros_orden": numeros_orden,
        "tipos_operacion": tipos_operacion,
        "resultados_auditoria": resultados_auditoria,
        "tipos_hallazgo": tipos_hallazgo,
        "hallazgos": hallazgos,
        "anos_auditoria": anos_auditoria,
    }

    return render(
        request,
        "auditorias/consulta.html",
        context
    )

def generate_pdf(request):

    auditorias = filtrar_auditorias(request)

    cantidad = auditorias.count()

    # Evitar generar PDFs demasiado grandes
    if cantidad > 50000:

        return HttpResponse(
            f"""
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Demasiados registros</title>
                </head>

                <body>

                    <h2>Demasiados registros para generar el PDF</h2>

                    <p>
                        La consulta contiene
                        <strong>{cantidad}</strong>
                        registros.
                    </p>

                    <p>
                        Por favor, aplique uno o varios filtros
                        antes de generar el PDF.
                    </p>

                    <a href="/auditorias/consulta/">
                        Volver a consultas
                    </a>

                </body>
            </html>
            """,
            status=400
        )

    template = get_template(
        "auditorias/pdf_auditorias.html"
    )

    context = {
        "Auditorias": auditorias
    }

    html = template.render(context)

    response = HttpResponse(
        content_type="application/pdf"
    )

    response["Content-Disposition"] = (
        'attachment; filename="auditorias.pdf"'
    )

    pisa_status = pisa.CreatePDF(
        html,
        dest=response
    )

    if pisa_status.err:

        return HttpResponse(
            "Error al generar el PDF",
            status=500
        )

    return response

def exportar_excel(request):
    auditorias = filtrar_auditorias(request)
    datos =[]
    
    for a in auditorias:
        datos.append({
            "Fecha": a.fecha,
            "Nombre Auditor": a.nombre_auditor,
            "Numero Cedula": a.numero_cedula,
            "Aplicativo": a.aplicativo,
            "Fecha Operacion": a.fecha_operacion,
            "Nombre Tecnico": a.nombre_tecnico,
            "Numero Cuenta Contrato": a.numero_cuenta_contrato,
            "Numero Orden": a.numero_orden,
            "Tipo Operacion": a.tipo_operacion,
            "Resultado Auditoria": a.resultado_auditoria,
            "Observacion": a.observacion,
            "Tipo Hallazgo": a.tipo_hallazgo,
            "Hallazgo": a.hallazgo
        })
    
    df = pd.DataFrame(datos)
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

def estadistica(request):

    return render(
        request,
        "auditorias/estadistica.html"
    )
    
@role_required("Administrador", "Coordinador", "Digitador")
def reauditar(request):

    return render(
        request,
        "auditorias/reauditar.html"
    )
    
def exportar_estadisticas_excel(request):

    # ==========================================
    # ESTADÍSTICAS GENERALES
    # ==========================================

    cantidad = Auditoria.objects.count()

    suspensiones = Auditoria.objects.filter(
        tipo_operacion="DC00"
    ).count()

    reconexiones = Auditoria.objects.filter(
        tipo_operacion="RC00"
    ).count()

    zvcl = Auditoria.objects.filter(
        tipo_operacion="ZVCL"
    ).count()


    # ==========================================
    # ESTADÍSTICAS POR TÉCNICO
    # ==========================================

    estadisticas_tecnico = list(
        Auditoria.objects
        .values("nombre_tecnico")
        .annotate(total=Count("id"))
        .order_by("-total")
    )


    datos_tecnicos = []

    for tecnico in estadisticas_tecnico:

        datos_tecnicos.append({

            "Nombre Técnico":
                tecnico["nombre_tecnico"],

            "Cantidad de Auditorías":
                tecnico["total"]

        })


    df_tecnicos = pd.DataFrame(
        datos_tecnicos
    )


    # ==========================================
    # ESTADÍSTICAS POR DÍA
    # ==========================================

    estadisticas_dia = list(
        Auditoria.objects
        .values("fecha_operacion")
        .annotate(total=Count("id"))
        .order_by("fecha_operacion")
    )


    datos_dias = []

    for dia in estadisticas_dia:

        datos_dias.append({

            "Fecha":
                dia["fecha_operacion"],

            "Cantidad de Auditorías":
                dia["total"]

        })


    df_dias = pd.DataFrame(
        datos_dias
    )


    # ==========================================
    # RESUMEN
    # ==========================================

    datos_resumen = [

        {
            "Estadística":
                "Total de Auditorías",

            "Cantidad":
                cantidad
        },

        {
            "Estadística":
                "Suspensiones",

            "Cantidad":
                suspensiones
        },

        {
            "Estadística":
                "Reconexiones",

            "Cantidad":
                reconexiones
        },

        {
            "Estadística":
                "ZVCL",

            "Cantidad":
                zvcl
        },

        {
            "Estadística":
                "Total de Técnicos",

            "Cantidad":
                len(estadisticas_tecnico)
        }

    ]


    df_resumen = pd.DataFrame(
        datos_resumen
    )


    # ==========================================
    # CREAR EXCEL
    # ==========================================

    response = HttpResponse(

        content_type=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    )


    response["Content-Disposition"] = (
        'attachment; filename="estadisticas_auditorias.xlsx"'
    )


    # ==========================================
    # ESCRIBIR LAS 3 HOJAS
    # ==========================================

    with pd.ExcelWriter(
        response,
        engine="openpyxl"
    ) as writer:

        df_resumen.to_excel(

            writer,

            index=False,

            sheet_name="Resumen"

        )


        df_tecnicos.to_excel(

            writer,

            index=False,

            sheet_name="Por Tecnico"

        )


        df_dias.to_excel(

            writer,

            index=False,

            sheet_name="Por Dia"

        )

    return response

@login_required
@role_required("Administrador", "Coordinador", "Digitador")
def auditoria_manual_crear(request):
    """
    Crea una auditoría directamente desde el software.

    Automático (el usuario NO lo digita):
        - fecha         -> fecha de hoy
        - nombre_auditor -> nombre del usuario en sesión
        - numero_cedula  -> cédula guardada en PerfilUsuario
        - aplicativo     -> siempre "AuditoriasSW"
        - creado_por     -> request.user
        - origen         -> "manual"
    """

    # ------------------------------------------------------
    # CÉDULA DEL USUARIO EN SESIÓN
    # ------------------------------------------------------
    perfil = getattr(request.user, "perfil", None)
    cedula_usuario = perfil.numero_cedula if perfil else ""

    if not cedula_usuario:
        messages.error(
            request,
            "Su usuario no tiene una cédula registrada. "
            "Pida a un Administrador que se la agregue en "
            "/admin/ antes de registrar auditorías.",
        )
        return redirect("index")

    nombre_auditor = (
        request.user.get_full_name() or request.user.username
    )

    # ------------------------------------------------------
    # INSTANCIA BASE CON LOS DATOS AUTOMÁTICOS YA PUESTOS
    # ------------------------------------------------------
    auditoria_base = Auditoria(
        fecha=timezone.localdate(),
        nombre_auditor=nombre_auditor,
        numero_cedula=cedula_usuario,
        aplicativo="AuditoriasSW",
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

            return redirect("auditoria_manual_crear")

        else:

            messages.error(
                request,
                "Revise los errores del formulario. "
                "No fue posible guardar la auditoría.",
            )

    else:

        form = AuditoriaManualForm(instance=auditoria_base)

    return render(
        request,
        "auditorias/auditoria_manual_form.html",
        {
            "form": form,
            "modo": "crear",
            "nombre_auditor": nombre_auditor,
            "cedula_usuario": cedula_usuario,
            "fecha_hoy": timezone.localdate(),
        },
    )


@login_required
@role_required("Administrador", "Coordinador", "Digitador")
def auditoria_manual_editar(request, pk):
    """
    Edita una auditoría ya registrada.

    IMPORTANTE: al editar NO se vuelve a pisar la fecha,
    el auditor ni la cédula originales (esos quedan tal
    cual quedaron al crearla). Solo Administrador y
    Coordinador pueden editar cualquier registro; el
    Digitador solo los que él mismo creó.
    """

    auditoria = get_object_or_404(Auditoria, pk=pk)

    es_admin_o_coordinador = (
        request.user.is_superuser
        or request.user.groups.filter(
            name__in=["Administrador", "Coordinador"]
        ).exists()
    )

    if not es_admin_o_coordinador and auditoria.creado_por_id != request.user.id:
        messages.error(
            request,
            "No tiene permiso para editar esta auditoría.",
        )
        return redirect("auditoria_manual_crear")

    if request.method == "POST":

        form = AuditoriaManualForm(
            request.POST,
            request.FILES,
            instance=auditoria,
        )

        if form.is_valid():
            form.save()
            messages.success(request, "Auditoría actualizada correctamente.")
            return redirect("consulta")

        else:
            messages.error(request, "Revise los errores del formulario.")

    else:
        form = AuditoriaManualForm(instance=auditoria)

    return render(
        request,
        "auditorias/auditoria_manual_form.html",
        {
            "form": form,
            "modo": "editar",
            "auditoria": auditoria,
            "nombre_auditor": auditoria.nombre_auditor,
            "cedula_usuario": auditoria.numero_cedula,
            "fecha_hoy": auditoria.fecha,
        },
    )


@login_required
@role_required("Administrador", "Coordinador")
def auditoria_manual_eliminar(request, pk):
    """
    Elimina una auditoría.

    Solo Administrador y Coordinador pueden eliminar
    (el Digitador NO tiene permiso de borrar).
    """

    auditoria = get_object_or_404(Auditoria, pk=pk)

    if request.method == "POST":

        auditoria.delete()

        messages.success(
            request,
            "Auditoría eliminada correctamente.",
        )

        return redirect("consulta")

    return render(
        request,
        "auditorias/auditoria_confirmar_eliminar.html",
        {
            "auditoria": auditoria,
        },
    )