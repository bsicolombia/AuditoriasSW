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
    

    return render(
        request,
        "auditorias/estadistica.html"
    )