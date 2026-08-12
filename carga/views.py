from datetime import datetime, date
import json

from django.contrib import messages
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import render
from django.template.loader import get_template

from openpyxl import load_workbook
from xhtml2pdf import pisa

from .forms import CsvUploadForm, AuditoriaForm
from auditorias.models import Auditoria


# ==========================================================
# CARGA PRINCIPAL
# ==========================================================

def carga(request):

    form = CsvUploadForm()

    return render(
        request,
        "carga/carga.html",
        {
            "form": form,
        }
    )


# ==========================================================
# CONVERTIR TEXTO
# ==========================================================

def convertir_texto(value):

    if value is None:
        return ""

    if isinstance(value, float):

        if value.is_integer():
            return str(int(value))

        return str(value)

    return str(value).strip()


# ==========================================================
# CONVERTIR FECHA
# ==========================================================

def convertir_fecha(value):

    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):

        value = value.strip()

        formatos = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%B %d, %Y",
        ]

        for formato in formatos:

            try:

                return datetime.strptime(
                    value,
                    formato
                ).date()

            except ValueError:
                continue

    return value


# ==========================================================
# NORMALIZAR RESULTADO
# ==========================================================

def normalizar_resultado(value):

    if value is None:
        return ""

    valor = str(value).strip().lower()

    equivalencias = {
        "cumple": "cumple",
        "no cumple": "no_cumple",
        "no_cumple": "no_cumple",
        "nocumple": "no_cumple",
    }

    return equivalencias.get(
        valor,
        valor
    )


# ==========================================================
# NORMALIZAR TIPO DE HALLAZGO
# ==========================================================

def normalizar_tipo_hallazgo(value):

    if value is None:
        return ""

    valor = str(value).strip().lower()

    equivalencias = {
        "alto": "alto",
        "medio": "medio",
        "bajo": "bajo",
    }

    return equivalencias.get(
        valor,
        valor
    )


# ==========================================================
# GENERAR FIRMA DEL REGISTRO
# ==========================================================

def generar_firma_registro(data):

    campos = [
        "fecha",
        "nombre_auditor",
        "numero_cedula",
        "aplicativo",
        "fecha_operacion",
        "nombre_tecnico",
        "numero_cuenta_contrato",
        "numero_orden",
        "tipo_operacion",
        "resultado_auditoria",
        "observacion",
        "tipo_hallazgo",
        "hallazgo",
    ]

    valores = []

    for campo in campos:

        valor = data.get(
            campo,
            ""
        )

        if isinstance(valor, date):

            valor = valor.isoformat()

        elif valor is None:

            valor = ""

        else:

            valor = str(valor).strip().lower()

        valores.append(valor)

    return tuple(valores)


# ==========================================================
# OBTENER HALLAZGO
# ==========================================================

def obtener_hallazgo(
    tipo_hallazgo,
    hallazgo_alto,
    hallazgo_medio,
    hallazgo_bajo
):

    tipo_hallazgo = (
        tipo_hallazgo or ""
    ).strip().lower()

    if tipo_hallazgo == "alto":

        return convertir_texto(
            hallazgo_alto
        )

    if tipo_hallazgo == "medio":

        return convertir_texto(
            hallazgo_medio
        )

    if tipo_hallazgo == "bajo":

        return convertir_texto(
            hallazgo_bajo
        )

    return ""


# ==========================================================
# PREPARAR DATOS PARA JSON
#
# Esto permite enviar los errores al PDF sin sesión.
# Convierte fechas y otros objetos a texto.
# ==========================================================

def preparar_para_json(obj):

    if isinstance(obj, dict):

        return {
            str(key): preparar_para_json(value)
            for key, value in obj.items()
        }

    if isinstance(obj, (list, tuple)):

        return [
            preparar_para_json(value)
            for value in obj
        ]

    if isinstance(obj, (datetime, date)):

        return obj.isoformat()

    if obj is None:

        return ""

    return obj


# ==========================================================
# PROCESAR EXCEL
# ==========================================================

def auditoria_crear(request):

    # ------------------------------------------------------
    # SOLO POST
    # ------------------------------------------------------

    if request.method != "POST":

        form = CsvUploadForm()

        return render(
            request,
            "carga/carga.html",
            {
                "form": form,
            }
        )

    # ------------------------------------------------------
    # FORMULARIO DE CARGA
    # ------------------------------------------------------

    upload_form = CsvUploadForm(
        request.POST,
        request.FILES
    )

    if not upload_form.is_valid():

        return render(
            request,
            "carga/carga.html",
            {
                "form": upload_form,
                "report_generated": False,
            }
        )

    # ------------------------------------------------------
    # ARCHIVO
    # ------------------------------------------------------

    excel_file = request.FILES.get(
        "csv_file"
    )

    if not excel_file:

        return render(
            request,
            "carga/carga.html",
            {
                "form": upload_form,
                "error": (
                    "No se recibió ningún archivo."
                ),
            }
        )

    # ------------------------------------------------------
    # VALIDAR EXTENSIÓN
    # ------------------------------------------------------

    if not excel_file.name.lower().endswith(".xlsx"):

        return render(
            request,
            "carga/carga.html",
            {
                "form": upload_form,
                "error": (
                    "El archivo debe ser un Excel "
                    "con extensión .xlsx."
                ),
            }
        )

    # ------------------------------------------------------
    # ABRIR EXCEL
    # ------------------------------------------------------

    try:

        workbook = load_workbook(
            excel_file,
            data_only=True
        )

        worksheet = workbook.active

    except Exception as e:

        return render(
            request,
            "carga/carga.html",
            {
                "form": upload_form,
                "error": (
                    "No se pudo abrir el archivo Excel: "
                    f"{e}"
                ),
            }
        )

    # ------------------------------------------------------
    # OBTENER FILAS
    # ------------------------------------------------------

    rows = worksheet.iter_rows(
        values_only=True
    )

    # ------------------------------------------------------
    # OBTENER ENCABEZADOS
    # ------------------------------------------------------

    try:

        headers = next(rows)

    except StopIteration:

        return render(
            request,
            "carga/carga.html",
            {
                "form": upload_form,
                "error": (
                    "El archivo Excel está vacío."
                ),
            }
        )

    # ------------------------------------------------------
    # NORMALIZAR ENCABEZADOS
    # ------------------------------------------------------

    headers = [
        str(header).strip().lower()
        if header is not None
        else ""
        for header in headers
    ]

    # ------------------------------------------------------
    # MAPEO DE COLUMNAS
    # ------------------------------------------------------

    column_mapping = {

        "marca temporal":
            "fecha",

        "fecha":
            "fecha",

        "nombre auditor":
            "nombre_auditor",

        "numero de cedula":
            "numero_cedula",

        "número de cédula":
            "numero_cedula",

        "numero cedula":
            "numero_cedula",

        "aplicativo":
            "aplicativo",

        "fecha operación":
            "fecha_operacion",

        "fecha operacion":
            "fecha_operacion",

        "nombres y apellidos técnico":
            "nombre_tecnico",

        "nombres y apellidos tecnico":
            "nombre_tecnico",

        "nombre técnico":
            "nombre_tecnico",

        "nombre tecnico":
            "nombre_tecnico",

        "número de cuenta contrato":
            "numero_cuenta_contrato",

        "numero de cuenta contrato":
            "numero_cuenta_contrato",

        "número de orden":
            "numero_orden",

        "numero de orden":
            "numero_orden",

        "tipo de operación":
            "tipo_operacion",

        "tipo de operacion":
            "tipo_operacion",

        "resultado auditoria":
            "resultado_auditoria",

        "resultado auditoría":
            "resultado_auditoria",

        "observacion":
            "observacion",

        "observación":
            "observacion",

        "tipo de hallazgo":
            "tipo_hallazgo",

        "hallazgo":
            "hallazgo",

        "columna 12":
            "hallazgo_alto",

        "columna 13":
            "hallazgo_medio",

        "columna 14":
            "hallazgo_bajo",
    }

    headers = [
        column_mapping.get(
            header,
            None
        )
        for header in headers
    ]

    # ------------------------------------------------------
    # CAMPOS DEL MODELO
    # ------------------------------------------------------

    campos_modelo = {
        "fecha",
        "nombre_auditor",
        "numero_cedula",
        "aplicativo",
        "fecha_operacion",
        "nombre_tecnico",
        "numero_cuenta_contrato",
        "numero_orden",
        "tipo_operacion",
        "resultado_auditoria",
        "observacion",
        "tipo_hallazgo",
        "hallazgo",
    }

    # ------------------------------------------------------
    # VARIABLES DE PROCESAMIENTO
    # ------------------------------------------------------

    successful_records = []

    error_records = []

    auditorias_creadas = []

    firmas_excel = set()

    ordenes_excel = set()

    total_rows = 0

    # ======================================================
    # PROCESAR CADA FILA
    # ======================================================

    for row_number, row in enumerate(
        rows,
        start=2
    ):

        # --------------------------------------------------
        # IGNORAR FILAS COMPLETAMENTE VACÍAS
        # --------------------------------------------------

        if not any(
            value is not None
            and str(value).strip() != ""
            for value in row
        ):

            continue

        total_rows += 1

        # --------------------------------------------------
        # VARIABLES DE HALLAZGO
        # --------------------------------------------------

        hallazgo_alto = ""

        hallazgo_medio = ""

        hallazgo_bajo = ""

        # --------------------------------------------------
        # DATOS DEL FORMULARIO
        # --------------------------------------------------

        form_data = {}

        # --------------------------------------------------
        # RECORRER COLUMNAS
        # --------------------------------------------------

        for header, value in zip(
            headers,
            row
        ):

            if not header:
                continue

            # ----------------------------------------------
            # HALLAZGOS ESPECIALES
            # ----------------------------------------------

            if header == "hallazgo_alto":

                hallazgo_alto = convertir_texto(
                    value
                )

                continue

            if header == "hallazgo_medio":

                hallazgo_medio = convertir_texto(
                    value
                )

                continue

            if header == "hallazgo_bajo":

                hallazgo_bajo = convertir_texto(
                    value
                )

                continue

            # ----------------------------------------------
            # IGNORAR COLUMNAS DESCONOCIDAS
            # ----------------------------------------------

            if header not in campos_modelo:

                continue

            # ----------------------------------------------
            # FECHAS
            # ----------------------------------------------

            if header in [
                "fecha",
                "fecha_operacion",
            ]:

                value = convertir_fecha(
                    value
                )

            # ----------------------------------------------
            # NÚMEROS QUE DEBEN SER TEXTO
            # ----------------------------------------------

            elif header in [
                "numero_cedula",
                "numero_cuenta_contrato",
                "numero_orden",
            ]:

                value = convertir_texto(
                    value
                )

            # ----------------------------------------------
            # RESULTADO
            # ----------------------------------------------

            elif header == "resultado_auditoria":

                value = normalizar_resultado(
                    value
                )

            # ----------------------------------------------
            # TIPO DE HALLAZGO
            # ----------------------------------------------

            elif header == "tipo_hallazgo":

                value = normalizar_tipo_hallazgo(
                    value
                )

            # ----------------------------------------------
            # TEXTOS
            # ----------------------------------------------

            elif header in [
                "nombre_auditor",
                "aplicativo",
                "nombre_tecnico",
                "tipo_operacion",
                "observacion",
                "hallazgo",
            ]:

                value = convertir_texto(
                    value
                )

            form_data[header] = value

        # --------------------------------------------------
        # VALORES POR DEFECTO
        # --------------------------------------------------

        form_data.setdefault(
            "observacion",
            ""
        )

        form_data.setdefault(
            "tipo_hallazgo",
            ""
        )

        # --------------------------------------------------
        # OBTENER HALLAZGO SEGÚN TIPO
        # --------------------------------------------------

        form_data["hallazgo"] = obtener_hallazgo(
            form_data.get(
                "tipo_hallazgo",
                ""
            ),
            hallazgo_alto,
            hallazgo_medio,
            hallazgo_bajo
        )

        # ==================================================
        # DUPLICADO EXACTO DENTRO DEL EXCEL
        # ==================================================

        firma = generar_firma_registro(
            form_data
        )

        if firma in firmas_excel:

            error_records.append(
                {
                    "row": row_number,
                    "data": form_data,
                    "errors": {
                        "Registro duplicado": (
                            "Este registro aparece "
                            "más de una vez dentro "
                            "del archivo Excel."
                        )
                    },
                }
            )

            continue

        firmas_excel.add(
            firma
        )

        # ==================================================
        # NÚMERO DE ORDEN
        # ==================================================

        numero_orden = form_data.get(
            "numero_orden",
            ""
        )

        numero_orden = str(
            numero_orden
        ).strip()

        # --------------------------------------------------
        # DUPLICADO DE ORDEN DENTRO DEL EXCEL
        # --------------------------------------------------

        if numero_orden:

            if numero_orden in ordenes_excel:

                error_records.append(
                    {
                        "row": row_number,
                        "data": form_data,
                        "errors": {
                            "Número de orden": (
                                f"La orden "
                                f"{numero_orden} "
                                "aparece más de una vez "
                                "en el archivo Excel."
                            )
                        },
                    }
                )

                continue

            ordenes_excel.add(
                numero_orden
            )

        # ==================================================
        # VALIDAR CON AUDITORIAFORM
        # ==================================================

        row_form = AuditoriaForm(
            data=form_data
        )

        if not row_form.is_valid():

            errors = {}

            for field, error_list in row_form.errors.items():

                errors[field] = ", ".join(
                    str(error)
                    for error in error_list
                )

            error_records.append(
                {
                    "row": row_number,
                    "data": form_data,
                    "errors": errors,
                }
            )

            continue

        # ==================================================
        # COMPROBAR BASE DE DATOS
        # ==================================================

        try:

            registro_existente = None

            if numero_orden:

                registro_existente = (
                    Auditoria.objects
                    .filter(
                        numero_orden=numero_orden
                    )
                    .first()
                )

        except Exception as e:

            error_records.append(
                {
                    "row": row_number,
                    "data": form_data,
                    "errors": {
                        "Base de datos": (
                            "No fue posible comprobar "
                            "si la orden ya existe: "
                            f"{e}"
                        )
                    },
                }
            )

            continue

        # ==================================================
        # ORDEN YA EXISTENTE EN BASE DE DATOS
        # ==================================================

        if registro_existente:

            error_records.append(
                {
                    "row": row_number,
                    "data": form_data,
                    "errors": {
                        "Registro duplicado": (
                            f"La orden "
                            f"{numero_orden} "
                            "ya existe en la base "
                            "de datos. "
                            "No se creó nuevamente."
                        )
                    },
                }
            )

            continue

        # ==================================================
        # PREPARAR AUDITORÍA
        # ==================================================

        try:

            auditoria = row_form.save(
                commit=False
            )

            auditorias_creadas.append(
                auditoria
            )

            successful_records.append(
                {
                    "row": row_number,
                    "data": form_data,
                }
            )

        except Exception as e:

            error_records.append(
                {
                    "row": row_number,
                    "data": form_data,
                    "errors": {
                        "Registro": (
                            "No fue posible preparar "
                            "el registro para guardar: "
                            f"{e}"
                        )
                    },
                }
            )

    # ======================================================
    # GUARDAR TODAS LAS AUDITORÍAS
    # ======================================================

    if auditorias_creadas:

        try:

            with transaction.atomic():

                Auditoria.objects.bulk_create(
                    auditorias_creadas,
                    batch_size=1000
                )

        except Exception as e:

            # ----------------------------------------------
            # Si falla la carga masiva, ninguna se considera
            # creada correctamente.
            # ----------------------------------------------

            error_records.append(
                {
                    "row": "-",
                    "data": {},
                    "errors": {
                        "Base de datos": (
                            "No fue posible guardar "
                            "las auditorías. "
                            f"Error: {e}"
                        )
                    },
                }
            )

            successful_records = []

            auditorias_creadas = []

    # ======================================================
    # CONTADORES
    # ======================================================

    successful_count = len(
        successful_records
    )

    error_count = len(
        error_records
    )

    # ======================================================
    # MENSAJES
    # ======================================================

    if successful_count:

        messages.success(
            request,
            (
                "Proceso finalizado correctamente. "
                f"{successful_count} auditorías "
                "creadas."
            )
        )

    if error_count:

        messages.warning(
            request,
            (
                f"{error_count} registros "
                "no fueron creados."
            )
        )

    # ======================================================
    # PREPARAR ERRORES
    # ======================================================

    errores_json_data = preparar_para_json(
        error_records
    )

    errores_json = json.dumps(
        errores_json_data,
        ensure_ascii=False
    )

    # ======================================================
    # CONTEXTO
    # ======================================================

    context = {

        "form": upload_form,

        "successful_count":
            successful_count,

        "error_count":
            error_count,

        "total_rows":
            total_rows,

        "errors_records":
            error_records,

        "successful_records":
            successful_records,

        "report_generated":
            True,

        "errores_json":
            errores_json,
    }

    return render(
        request,
        "carga/carga.html",
        context
    )

def generar_pdf_errores(request):

    if request.method != "POST":
        return HttpResponse(
            "Método no permitido.",
            status=405
        )

    errores_json = request.POST.get(
        "errores_json"
    )

    if not errores_json:
        return HttpResponse(
            "No se recibieron errores para generar el PDF.",
            status=400
        )

    try:

        error_records = json.loads(
            errores_json
        )

    except json.JSONDecodeError as e:

        return HttpResponse(
            (
                "Los datos de errores no son válidos: "
                f"{e}"
            ),
            status=400
        )

    template = get_template(
        "carga/reporte_errores.html"
    )

    html = template.render(
        {
            "errores": error_records,
        }
    )

    response = HttpResponse(
        content_type="application/pdf"
    )

    response[
        "Content-Disposition"
    ] = (
        'attachment; '
        'filename="reporte_errores_auditorias.pdf"'
    )

    pisa_status = pisa.CreatePDF(
        html,
        dest=response
    )

    if pisa_status.err:

        return HttpResponse(
            "Error al generar el PDF.",
            status=500
        )

    return response