from datetime import datetime, date
import json
import re
from django.utils import timezone
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

    ultima_carga = request.session.get(
        "ultima_carga_auditorias"
    )

    return render(
        request,
        "carga/carga.html",
        {
            "form": form,
            "ultima_carga": ultima_carga,
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

    # ------------------------------------------------------
    # DATETIME
    # ------------------------------------------------------

    if isinstance(value, datetime):
        return value.date()

    # ------------------------------------------------------
    # DATE
    # ------------------------------------------------------

    if isinstance(value, date):
        return value

    # ------------------------------------------------------
    # TEXTO
    # ------------------------------------------------------

    if isinstance(value, str):

        value = value.strip()

        if not value:
            return None

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

        return None

    return None


# ==========================================================
# VALIDAR FECHA DE AUDITORÍA
# ==========================================================

def validar_fecha_auditoria(value):

    """
    Valida que la fecha:

    - Sea una fecha válida.
    - Tenga año de 4 dígitos.
    - No sea anterior a 2025.
    - No sea superior a la fecha actual.
    - No tenga años como 0026.
    - No tenga años futuros.
    """

    if value is None:

        return (
            False,
            "La fecha es obligatoria."
        )

    # ------------------------------------------------------
    # CONVERTIR A DATE
    # ------------------------------------------------------

    if isinstance(value, datetime):

        fecha = value.date()

    elif isinstance(value, date):

        fecha = value

    else:

        return (
            False,
            "La fecha no tiene un formato válido."
        )

    # ------------------------------------------------------
    # FECHA ACTUAL
    # ------------------------------------------------------

    hoy = date.today()

    # ------------------------------------------------------
    # AÑO MENOR A 1000
    # ------------------------------------------------------

    if fecha.year < 1000:

        return (
            False,
            (
                f"El año {fecha.year:04d} no es válido. "
                "El año debe tener 4 dígitos."
            )
        )

    # ------------------------------------------------------
    # AÑO MÍNIMO
    # ------------------------------------------------------

    año_minimo = 2025

    if fecha.year < año_minimo:

        return (
            False,
            (
                f"El año {fecha.year} no es válido. "
                f"La fecha debe corresponder al año "
                f"{año_minimo} o posterior."
            )
        )

    # ------------------------------------------------------
    # FECHA FUTURA
    # ------------------------------------------------------

    if fecha > hoy:

        return (
            False,
            (
                f"La fecha {fecha.strftime('%d/%m/%Y')} "
                f"es superior a la fecha actual "
                f"({hoy.strftime('%d/%m/%Y')})."
            )
        )

    # ------------------------------------------------------
    # AÑO FUTURO
    # ------------------------------------------------------

    if fecha.year > hoy.year:

        return (
            False,
            (
                f"El año {fecha.year} no es válido. "
                f"No se permiten años posteriores "
                f"a {hoy.year}."
            )
        )

    return (
        True,
        ""
    )


# ==========================================================
# VALIDAR TEXTO DE FECHA
# ==========================================================

def validar_texto_fecha(value):

    """
    Valida específicamente que un texto tenga año de 4 dígitos.

    Ejemplos inválidos:

        25/08/26
        25/08/0026
        2026/08/25?  -> se valida según formatos permitidos

    Ejemplos válidos:

        25/08/2026
        2026-08-25
        08/25/2026
    """

    if not isinstance(value, str):

        return True

    value = value.strip()

    if not value:
        return True

    numeros = re.findall(
        r"\d+",
        value
    )

    # ------------------------------------------------------
    # Detectar años escritos con cantidad incorrecta
    # ------------------------------------------------------

    for numero in numeros:

        numero_int = int(numero)

        # Si tiene 2 dígitos y parece año
        if len(numero) == 2:

            # Ej: 25/08/26
            if numero_int <= 99:

                return False

        # Año con menos de 4 dígitos
        elif len(numero) == 3:

            return False

        # Año escrito como 0026
        elif len(numero) == 4:

            # Si empieza por 0, no es un año válido
            if numero.startswith("0"):

                return False

    return True


# ==========================================================
# NORMALIZAR RESULTADO
# ==========================================================

def normalizar_resultado(value):

    if value is None:
        return ""

    valor = str(value).strip().lower()

    equivalencias = {

        "cumple":
            "cumple",

        "no cumple":
            "no_cumple",

        "no_cumple":
            "no_cumple",

        "nocumple":
            "no_cumple",
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

        "alto":
            "alto",

        "medio":
            "medio",

        "bajo":
            "bajo",
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

            valor = str(
                valor
            ).strip().lower()

        valores.append(
            valor
        )

    return tuple(
        valores
    )


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
# CREAR REGISTRO DE ERROR
# ==========================================================

def crear_error(
    row_number,
    form_data,
    campo,
    mensaje
):

    return {
        "row": row_number,

        # IMPORTANTE:
        # aquí se conserva TODA la fila
        "data": form_data.copy(),

        "errors": {
            campo: mensaje
        },
    }


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
    # FORMULARIO
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
    # EXTENSIÓN
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
    # FILAS
    # ------------------------------------------------------

    rows = worksheet.iter_rows(
        values_only=True
    )

    # ------------------------------------------------------
    # ENCABEZADOS
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

    # ======================================================
    # MAPEO DE COLUMNAS
    # ======================================================

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

    # ======================================================
    # CAMPOS DEL MODELO
    # ======================================================

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

    # ======================================================
    # VARIABLES
    # ======================================================

    successful_records = []

    error_records = []

    auditorias_creadas = []

    # Registros que ya estaban correctamente guardados
    registros_existentes = []

    # Firmas de registros NUEVOS del archivo
    firmas_excel = set()

    # Órdenes NUEVAS del archivo
    ordenes_excel = set()

    total_rows = 0

    # ======================================================
    # PROCESAR FILAS
    # ======================================================

    for row_number, row in enumerate(
        rows,
        start=2
    ):

        # --------------------------------------------------
        # IGNORAR FILA VACÍA
        # --------------------------------------------------

        if not any(
            value is not None
            and str(value).strip() != ""
            for value in row
        ):

            continue

        total_rows += 1

        # --------------------------------------------------
        # HALLAZGOS
        # --------------------------------------------------

        hallazgo_alto = ""

        hallazgo_medio = ""

        hallazgo_bajo = ""

        # --------------------------------------------------
        # DATOS
        # --------------------------------------------------

        form_data = {}

        # --------------------------------------------------
        # ERRORES DE FECHA
        # --------------------------------------------------

        errores_fecha = []

        # ==================================================
        # LEER TODA LA FILA
        # ==================================================

        for header, value in zip(
            headers,
            row
        ):

            if not header:
                continue

            # ----------------------------------------------
            # HALLAZGO ALTO
            # ----------------------------------------------

            if header == "hallazgo_alto":

                hallazgo_alto = convertir_texto(
                    value
                )

                continue

            # ----------------------------------------------
            # HALLAZGO MEDIO
            # ----------------------------------------------

            if header == "hallazgo_medio":

                hallazgo_medio = convertir_texto(
                    value
                )

                continue

            # ----------------------------------------------
            # HALLAZGO BAJO
            # ----------------------------------------------

            if header == "hallazgo_bajo":

                hallazgo_bajo = convertir_texto(
                    value
                )

                continue

            # ----------------------------------------------
            # COLUMNA DESCONOCIDA
            # ----------------------------------------------

            if header not in campos_modelo:

                continue

            # ==================================================
            # FECHAS
            # ==================================================

            if header in [
                "fecha",
                "fecha_operacion",
            ]:

                valor_original = value

                # ------------------------------------------
                # VALIDAR TEXTO
                # ------------------------------------------

                if isinstance(
                    valor_original,
                    str
                ):

                    if not validar_texto_fecha(
                        valor_original
                    ):

                        errores_fecha.append(
                            (
                                header,
                                (
                                    "La fecha no es válida. "
                                    "El año debe tener "
                                    "exactamente 4 dígitos. "
                                    "Ejemplo: 25/08/2026."
                                )
                            )
                        )

                        form_data[header] = (
                            convertir_texto(
                                valor_original
                            )
                        )

                        continue

                # ------------------------------------------
                # CONVERTIR
                # ------------------------------------------

                fecha_convertida = convertir_fecha(
                    valor_original
                )

                if fecha_convertida is None:

                    errores_fecha.append(
                        (
                            header,
                            (
                                "La fecha no es válida. "
                                "Debe utilizar un formato "
                                "válido y un año de 4 dígitos."
                            )
                        )
                    )

                    form_data[header] = (
                        convertir_texto(
                            valor_original
                        )
                    )

                    continue

                # ------------------------------------------
                # VALIDAR FECHA
                # ------------------------------------------

                fecha_valida, mensaje_fecha = (
                    validar_fecha_auditoria(
                        fecha_convertida
                    )
                )

                if not fecha_valida:

                    errores_fecha.append(
                        (
                            header,
                            mensaje_fecha
                        )
                    )

                form_data[header] = (
                    fecha_convertida
                )

            # ==================================================
            # NÚMEROS COMO TEXTO
            # ==================================================

            elif header in [

                "numero_cedula",

                "numero_cuenta_contrato",

                "numero_orden",
            ]:

                form_data[header] = (
                    convertir_texto(
                        value
                    )
                )

            # ==================================================
            # RESULTADO
            # ==================================================

            elif header == "resultado_auditoria":

                form_data[header] = (
                    normalizar_resultado(
                        value
                    )
                )

            # ==================================================
            # TIPO DE HALLAZGO
            # ==================================================

            elif header == "tipo_hallazgo":

                form_data[header] = (
                    normalizar_tipo_hallazgo(
                        value
                    )
                )

            # ==================================================
            # TEXTOS
            # ==================================================

            elif header in [

                "nombre_auditor",

                "aplicativo",

                "nombre_tecnico",

                "tipo_operacion",

                "observacion",

                "hallazgo",
            ]:

                form_data[header] = (
                    convertir_texto(
                        value
                    )
                )

        # ==================================================
        # VALORES POR DEFECTO
        # ==================================================

        form_data.setdefault(
            "observacion",
            ""
        )

        form_data.setdefault(
            "tipo_hallazgo",
            ""
        )

        # ==================================================
        # OBTENER HALLAZGO
        # ==================================================

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
        # VALIDAR FECHAS
        # ==================================================

        if errores_fecha:

            for campo, mensaje in errores_fecha:

                error_records.append(
                    crear_error(
                        row_number,
                        form_data,
                        campo,
                        mensaje
                    )
                )

            # IMPORTANTE:
            # NO se registra como procesado.
            # En la siguiente carga volverá a intentarse.
            continue

        # ==================================================
        # VALIDAR FORMULARIO
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

                    "data": form_data.copy(),

                    "errors": errors,
                }
            )

            # IMPORTANTE:
            # No se guarda.
            # Por eso, en la próxima carga
            # volverá a aparecer el error.
            continue

        # ==================================================
        # NÚMERO DE ORDEN
        # ==================================================

        numero_orden = str(
            form_data.get(
                "numero_orden",
                ""
            )
        ).strip()

        # ==================================================
        # COMPROBAR SI YA EXISTE EN BD
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

                    "data": form_data.copy(),

                    "errors": {
                        "Base de datos": (
                            "No fue posible comprobar "
                            "si la auditoría ya existe: "
                            f"{e}"
                        )
                    },
                }
            )

            continue

        # ==================================================
        # YA EXISTE EN BD
        # ==================================================

        if registro_existente:

            # NO es error.
            #
            # Significa que esta auditoría ya fue
            # procesada correctamente en una carga
            # anterior.
            registros_existentes.append(
                {
                    "row": row_number,

                    "data": form_data.copy(),
                }
            )

            continue

        # ==================================================
        # DESDE AQUÍ EL REGISTRO ES NUEVO
        # ==================================================

        # ==================================================
        # DUPLICADO EXACTO ENTRE REGISTROS NUEVOS
        # ==================================================

        firma = generar_firma_registro(
            form_data
        )

        if firma in firmas_excel:

            error_records.append(
                {
                    "row": row_number,

                    "data": form_data.copy(),

                    "errors": {
                        "Registro duplicado": (
                            "Esta auditoría aparece "
                            "más de una vez dentro "
                            "de las nuevas auditorías "
                            "del archivo."
                        )
                    },
                }
            )

            continue

        firmas_excel.add(
            firma
        )

        # ==================================================
        # DUPLICADO DE ORDEN ENTRE REGISTROS NUEVOS
        # ==================================================

        if numero_orden:

            if numero_orden in ordenes_excel:

                error_records.append(
                    {
                        "row": row_number,

                        "data": form_data.copy(),

                        "errors": {
                            "Número de orden": (
                                f"La orden "
                                f"{numero_orden} "
                                "aparece más de una vez "
                                "entre las nuevas "
                                "auditorías del archivo."
                            )
                        },
                    }
                )

                continue

            ordenes_excel.add(
                numero_orden
            )

        # ==================================================
        # PREPARAR AUDITORÍA PARA INSERTAR
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

                    "data": form_data.copy(),
                }
            )

        except Exception as e:

            error_records.append(
                {
                    "row": row_number,

                    "data": form_data.copy(),

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
    # GUARDAR AUDITORÍAS
    # ======================================================

    if auditorias_creadas:

        try:

            with transaction.atomic():

                Auditoria.objects.bulk_create(
                    auditorias_creadas,
                    batch_size=1000
                )

            # --------------------------------------------------
            # ÚLTIMA CARGA
            # --------------------------------------------------

            request.session[
                "ultima_carga_auditorias"
            ] = (
                timezone.localtime().strftime(
                    "%d/%m/%Y %H:%M:%S"
                )
            )

            request.session.modified = True

        except Exception as e:

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

    successful_count = len(successful_records)

    # ======================================================
    # TIPOS DE ERROR ÚNICOS
    # ======================================================

    tipos_error_unicos = set()

    for record in error_records:

        for campo in record.get("errors", {}).keys():

            tipos_error_unicos.add(
                str(campo).strip()
            )

    error_count = len(tipos_error_unicos)

    existing_count = len(
        registros_existentes
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
                "_ok."
            )
        )

    if existing_count:

        messages.info(
            request,
            (
                f"{existing_count} auditorías "
                "ya habían sido cargadas anteriormente "
                "y fueron ignoradas."
            )
        )

    if error_count:

        messages.warning(
            request,
            (
                f"{error_count} Auditorias "
                "Presentan Errores por diligenciamiento del Auditor."
            )
        )

    # ======================================================
    # JSON PARA PDF
    # ======================================================

    errores_json_data = preparar_para_json(
        error_records
    )

    errores_json = json.dumps(
        errores_json_data,
        ensure_ascii=False
    )

    # ======================================================
    # ÚLTIMA CARGA
    # ======================================================

    ultima_carga = request.session.get(
        "ultima_carga_auditorias"
    )

    # ======================================================
    # CONTEXTO
    # ======================================================

    context = {

        "form":
            upload_form,

        "successful_count":
            successful_count,

        "error_count":
            error_count,

        "existing_count":
            existing_count,

        "total_rows":
            total_rows,

        "errors_records":
            error_records,

        "successful_records":
            successful_records,

        "existing_records":
            registros_existentes,

        "report_generated":
            True,

        "errores_json":
            errores_json,

        "ultima_carga":
            ultima_carga,
    }

    return render(
        request,
        "carga/carga.html",
        context
    )



# ==========================================================
# GENERAR PDF DE ERRORES
# ==========================================================

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

    # ======================================================
    # TEMPLATE
    # ======================================================

    template = get_template(
        "carga/reporte_errores.html"
    )

    html = template.render(
        {
            "errores": error_records,
        }
    )

    # ======================================================
    # RESPUESTA PDF
    # ======================================================

    response = HttpResponse(
        content_type="application/pdf"
    )

    response[
        "Content-Disposition"
    ] = (
        'attachment; '
        'filename="reporte_errores_auditorias.pdf"'
    )

    # ======================================================
    # GENERAR PDF
    # ======================================================

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
