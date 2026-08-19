from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import get_template
import pandas as pd
from xhtml2pdf import pisa
from .models import Auditoria
from django.db.models import Count
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl import Workbook

def cargar_excel(request):

    if request.method == "POST":

        archivo = request.FILES["archivo"]

        excel = pd.read_excel(archivo)

        for _, fila in excel.iterrows():

            Auditoria.objects.create(
                fecha=fila["Fecha"],
                nombre_auditor=fila["Auditor"],
                numero_cedula=fila["Cedula"],
                aplicativo=fila["Aplicativo"],
                fecha_operacion=fila["Fecha Operacion"],
                nombre_tecnico=fila["Tecnico"],
                numero_cuenta_contrato=fila["Cuenta"],
                numero_orden=fila["Orden"],
                tipo_operacion=fila["Tipo Operacion"],
                resultado_auditoria=fila["Resultado"],
                observacion=fila["Observacion"],
                tipo_hallazgo=fila["Tipo Hallazgo"],
                hallazgo=fila["Hallazgo"]
            )

        return render(
            request,
            "carga/carga.html",
            {
                "mensaje": "Excel cargado correctamente"
            }
        )

    return render(
        request,
        "carga/carga.html"
    )


def filtrar_auditorias(request):

    auditorias = Auditoria.objects.all()

    # ==========================================
    # FILTROS NORMALES
    # ==========================================

    filtros = {

        "fecha": "fecha",

        "nombre_auditor": "nombre_auditor__icontains",

        "numero_cedula": "numero_cedula__icontains",

        "aplicativo": "aplicativo__icontains",

        "fecha_operacion": "fecha_operacion",

        "nombre_tecnico": "nombre_tecnico__icontains",

        "numero_cuenta_contrato": "numero_cuenta_contrato__icontains",

        "numero_orden": "numero_orden__icontains",
        
        "tipo_operacion": "tipo_operacion",

        "resultado_auditoria": "resultado_auditoria",

        "tipo_hallazgo": "tipo_hallazgo",

        "hallazgo": "hallazgo__icontains",
    }

    # ==========================================
    # APLICAR FILTROS NORMALES
    # ==========================================

    for parametro, campo in filtros.items():

        valor = request.GET.get(parametro)

        if valor:

            auditorias = auditorias.filter(
                **{campo: valor}
            )

    # ==========================================
    # FECHA OPERACIÓN DESDE
    # ==========================================

    fecha_inicio = request.GET.get("fecha_inicio")

    if fecha_inicio:

        auditorias = auditorias.filter(
            fecha__gte=fecha_inicio
        )

    # ==========================================
    # FECHA OPERACIÓN HASTA
    # ==========================================

    fecha_fin = request.GET.get("fecha_fin")

    if fecha_fin:

        auditorias = auditorias.filter(
            fecha__lte=fecha_fin
        )

    # ==========================================
    # FECHA AUDITORÍA DESDE
    # Campo: fecha
    # ==========================================

    fecha_inicio_auditoria = request.GET.get(
        "fecha_inicio_auditoria"
    )

    if fecha_inicio_auditoria:

        auditorias = auditorias.filter(
            fecha__gte=fecha_inicio_auditoria
        )

    # ==========================================
    # FECHA AUDITORÍA HASTA
    # Campo: fecha
    # ==========================================

    fecha_fin_auditoria = request.GET.get(
        "fecha_fin_auditoria"
    )

    if fecha_fin_auditoria:

        auditorias = auditorias.filter(
            fecha__lte=fecha_fin_auditoria
        )
    
    return auditorias


def consulta(request):

    auditorias = filtrar_auditorias(request)
    cantidad = auditorias.count()

    return render(
        request,
        "auditorias/consulta.html",

        {
            "Auditorias": auditorias,
            "Cantidad": cantidad
        }
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

    # ==========================================
    # ESTADÍSTICAS DE OPERACIONES
    # ==========================================

    suspensiones = Auditoria.objects.filter(
        tipo_operacion="DC00"
    ).count()

    reconexiones = Auditoria.objects.filter(
        tipo_operacion="RC00"
    ).count()

    zvcl = Auditoria.objects.filter(
        tipo_operacion="ZVCL"
    ).count()

    datos_operaciones = {
        "Suspensiones": suspensiones,
        "Reconexiones": reconexiones,
        "Zvcl": zvcl,
    }

    return render(
        request,
        "auditorias/estadistica.html",
        {
            "datos_operaciones": datos_operaciones,
        }
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

    return respons

def exportar_estadisticas(request):

    auditorias = Auditoria.objects.all()

    wb = Workbook()

    # ==========================================================
    # COLORES
    # ==========================================================

    COLOR_HEADER = "1E293B"
    COLOR_TOTAL = "D1FAE5"
    COLOR_SUBHEADER = "E2E8F0"


    # ==========================================================
    # FUNCIONES AUXILIARES
    # ==========================================================

    def aplicar_encabezado(ws):

        for celda in ws[1]:

            celda.font = Font(
                bold=True,
                color="FFFFFF"
            )

            celda.fill = PatternFill(
                "solid",
                fgColor=COLOR_HEADER
            )

            celda.alignment = Alignment(
                horizontal="center",
                vertical="center"
            )


    def aplicar_total(ws):

        fila = ws.max_row

        for celda in ws[fila]:

            celda.font = Font(
                bold=True
            )

            celda.fill = PatternFill(
                "solid",
                fgColor=COLOR_TOTAL
            )


    def ajustar_columnas(ws):

        for columna in ws.columns:

            maximo = 0

            letra = get_column_letter(
                columna[0].column
            )

            for celda in columna:

                if celda.value is not None:

                    longitud = len(
                        str(celda.value)
                    )

                    if longitud > maximo:
                        maximo = longitud

            ws.column_dimensions[
                letra
            ].width = min(
                maximo + 3,
                40
            )


    # ==========================================================
    # 1. RESUMEN
    # ==========================================================

    ws = wb.active

    ws.title = "Resumen"

    ws.append([
        "Estadística",
        "Cantidad"
    ])

    aplicar_encabezado(ws)


    ws.append([
        "Total de auditorías",
        auditorias.count()
    ])

    ws.append([
        "Suspensiones",
        auditorias.filter(
            tipo_operacion="DC00"
        ).count()
    ])

    ws.append([
        "Reconexiones",
        auditorias.filter(
            tipo_operacion="RC00"
        ).count()
    ])

    ws.append([
        "ZVCL",
        auditorias.filter(
            tipo_operacion="ZVCL"
        ).count()
    ])

    ws.append([
        "Cantidad técnicos",
        auditorias.values(
            "nombre_tecnico"
        ).distinct().count()
    ])

    ajustar_columnas(ws)


    # ==========================================================
    # 2. OPERACIONES
    # ==========================================================

    ws = wb.create_sheet(
        "Operaciones"
    )

    ws.append([
        "Tipo operación",
        "Cantidad"
    ])

    aplicar_encabezado(ws)


    operaciones = [
        ("Suspensiones", "DC00"),
        ("Reconexiones", "RC00"),
        ("ZVCL", "ZVCL"),
    ]


    total_operaciones = 0


    for nombre, codigo in operaciones:

        cantidad = auditorias.filter(
            tipo_operacion=codigo
        ).count()

        ws.append([
            nombre,
            cantidad
        ])

        total_operaciones += cantidad


    ws.append([
        "Total general",
        total_operaciones
    ])

    aplicar_total(ws)

    ajustar_columnas(ws)


    # ==========================================================
    # 3. AUDITORÍAS POR DÍA
    # ==========================================================

    ws = wb.create_sheet(
        "Auditorias por dia"
    )

    ws.append([
        "Fecha",
        "Cantidad"
    ])

    aplicar_encabezado(ws)


    datos = (
        auditorias
        .values("fecha_operacion")
        .annotate(
            total=Count("id")
        )
        .order_by(
            "fecha_operacion"
        )
    )


    total = 0


    for dato in datos:

        ws.append([
            dato["fecha_operacion"],
            dato["total"]
        ])

        total += dato["total"]


    ws.append([
        "Total general",
        total
    ])

    aplicar_total(ws)

    ajustar_columnas(ws)


    # ==========================================================
    # 4. NO CUMPLEN
    # ==========================================================

    ws = wb.create_sheet(
        "No cumplen"
    )

    ws.append([
        "Fecha",
        "Cantidad"
    ])

    aplicar_encabezado(ws)


    datos = (
        auditorias
        .filter(
            resultado_auditoria="no_cumple"
        )
        .values("fecha_operacion")
        .annotate(
            total=Count("id")
        )
        .order_by(
            "fecha_operacion"
        )
    )


    total = 0


    for dato in datos:

        ws.append([
            dato["fecha_operacion"],
            dato["total"]
        ])

        total += dato["total"]


    ws.append([
        "Total general",
        total
    ])

    aplicar_total(ws)

    ajustar_columnas(ws)


    # ==========================================================
    # 5. TÉCNICOS
    # ==========================================================

    ws = wb.create_sheet(
        "Tecnicos"
    )

    ws.append([
        "Nombre técnico",
        "Cantidad"
    ])

    aplicar_encabezado(ws)


    datos = (
        auditorias
        .values("nombre_tecnico")
        .annotate(
            total=Count("id")
        )
        .order_by(
            "-total"
        )
    )


    total = 0


    for dato in datos:

        ws.append([
            dato["nombre_tecnico"],
            dato["total"]
        ])

        total += dato["total"]


    ws.append([
        "Total general",
        total
    ])

    aplicar_total(ws)

    ajustar_columnas(ws)


    # ==========================================================
    # 6. HALLAZGOS POR TÉCNICO
    # ==========================================================

    ws = wb.create_sheet(
        "Hallazgos tecnico"
    )

    ws.append([
        "Nombre técnico",
        "Fecha",
        "Cantidad"
    ])

    aplicar_encabezado(ws)


    datos = (
        auditorias
        .filter(
            resultado_auditoria="no_cumple"
        )
        .values(
            "nombre_tecnico",
            "fecha_operacion"
        )
        .annotate(
            total=Count("id")
        )
        .order_by(
            "fecha_operacion",
            "-total"
        )
    )


    for dato in datos:

        ws.append([
            dato["nombre_tecnico"],
            dato["fecha_operacion"],
            dato["total"]
        ])


    ajustar_columnas(ws)


    # ==========================================================
    # 7. ERRORES POR TÉCNICO
    # ==========================================================

    ws = wb.create_sheet(
        "Errores tecnico"
    )

    ws.append([
        "Nombre técnico",
        "Hallazgo",
        "Fecha"
    ])

    aplicar_encabezado(ws)


    datos = (
        auditorias
        .filter(
            resultado_auditoria="no_cumple"
        )
        .exclude(
            nombre_tecnico__isnull=True
        )
        .exclude(
            nombre_tecnico__exact=""
        )
        .exclude(
            hallazgo__isnull=True
        )
        .exclude(
            hallazgo__exact=""
        )
        .values(
            "nombre_tecnico",
            "hallazgo",
            "fecha_operacion"
        )
        .order_by(
            "fecha_operacion"
        )
    )


    for dato in datos:

        ws.append([
            dato["nombre_tecnico"],
            dato["hallazgo"],
            dato["fecha_operacion"]
        ])


    ajustar_columnas(ws)


    # ==========================================================
    # 8. CANTIDAD DE HALLAZGOS
    # ==========================================================

    ws = wb.create_sheet(
        "Cantidad hallazgos"
    )

    ws.append([
        "Hallazgo",
        "Fecha",
        "Cantidad"
    ])

    aplicar_encabezado(ws)


    datos = (
        auditorias
        .filter(
            resultado_auditoria="no_cumple"
        )
        .values(
            "hallazgo",
            "fecha_operacion"
        )
        .annotate(
            total=Count("id")
        )
        .order_by(
            "fecha_operacion"
        )
    )


    for dato in datos:

        ws.append([
            dato["hallazgo"],
            dato["fecha_operacion"],
            dato["total"]
        ])


    ajustar_columnas(ws)


    # ==========================================================
    # 9. AUDITORÍAS POR DIGITADOR
    # ==========================================================

    ws = wb.create_sheet(
        "Auditorias digitador"
    )


    datos = list(
        auditorias
        .exclude(
            nombre_auditor__isnull=True
        )
        .exclude(
            nombre_auditor__exact=""
        )
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


    # ----------------------------------------------------------
    # DIGITADORES
    # ----------------------------------------------------------

    digitadores = sorted(
        set(
            dato["nombre_auditor"]
            for dato in datos
        )
    )


    encabezado = [
        "Fecha"
    ]

    encabezado.extend(
        digitadores
    )

    encabezado.append(
        "Total general"
    )


    ws.append(encabezado)

    aplicar_encabezado(ws)


    # ----------------------------------------------------------
    # CREAR MAPA
    # ----------------------------------------------------------

    mapa = {}


    for dato in datos:

        fecha = dato[
            "fecha_operacion"
        ]

        digitador = dato[
            "nombre_auditor"
        ]

        cantidad = dato[
            "total"
        ]


        if fecha not in mapa:

            mapa[fecha] = {}


        mapa[fecha][
            digitador
        ] = cantidad


    # ----------------------------------------------------------
    # TOTALES
    # ----------------------------------------------------------

    totales = {
        digitador: 0
        for digitador in digitadores
    }


    total_general = 0


    # ----------------------------------------------------------
    # FILAS
    # ----------------------------------------------------------

    for fecha in sorted(mapa.keys()):

        fila = [
            fecha
        ]

        total_dia = 0


        for digitador in digitadores:

            cantidad = mapa[
                fecha
            ].get(
                digitador,
                0
            )


            fila.append(
                cantidad
            )


            totales[
                digitador
            ] += cantidad


            total_dia += cantidad


        fila.append(
            total_dia
        )


        total_general += total_dia


        ws.append(fila)


    # ----------------------------------------------------------
    # TOTAL GENERAL
    # ----------------------------------------------------------

    fila_total = [
        "Total general"
    ]


    for digitador in digitadores:

        fila_total.append(
            totales[digitador]
        )


    fila_total.append(
        total_general
    )


    ws.append(
        fila_total
    )


    aplicar_total(ws)

    ajustar_columnas(ws)


    # ==========================================================
    # DESCARGAR
    # ==========================================================

    response = HttpResponse(
        content_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        )
    )


    response[
        "Content-Disposition"
    ] = (
        'attachment; '
        'filename="Estadisticas_Auditorias.xlsx"'
    )


    wb.save(response)


    return response
