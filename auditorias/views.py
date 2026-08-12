from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import get_template
import pandas as pd
from xhtml2pdf import pisa
from .models import Auditoria


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
        # Fecha diligenciamiento - EXACTA
        "fecha": "fecha",

        "nombre_auditor": "nombre_auditor__icontains",

        "numero_cedula": "numero_cedula__icontains",

        "aplicativo": "aplicativo__icontains",

        # Fecha operación - EXACTA
        "fecha_operacion": "fecha_operacion",

        "nombre_tecnico": "nombre_tecnico__icontains",

        "numero_cuenta_contrato": "numero_cuenta_contrato__icontains",

        "numero_orden": "numero_orden__icontains",

        # Tipo operación - EXACTA
        # DC00 NO encontrará DC000
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
            fecha_operacion__gte=fecha_inicio
        )

    # ==========================================
    # FECHA OPERACIÓN HASTA
    # ==========================================

    fecha_fin = request.GET.get("fecha_fin")

    if fecha_fin:

        auditorias = auditorias.filter(
            fecha_operacion__lte=fecha_fin
        )

    return auditorias


def consulta(request):

    auditorias = filtrar_auditorias(request)

    return render(
        request,
        "auditorias/consulta.html",
        {
            "Auditorias": auditorias
        }
    )


def generate_pdf(request):

    auditorias = filtrar_auditorias(request)

    cantidad = auditorias.count()

    # Evitar generar PDFs demasiado grandes
    if cantidad > 2000:

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


def estadistica(request):

    return render(
        request,
        "auditorias/estadistica.html"
    )