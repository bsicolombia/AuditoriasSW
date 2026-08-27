from django import forms

from auditorias.models import Auditoria
from .models import Tecnicos


# ==========================================================
# CARGA MASIVA DE AUDITORÍAS
# ==========================================================

class CsvUploadForm(forms.Form):

    csv_file = forms.FileField(
        label="Archivo Excel",
        required=True,
        help_text="Seleccione un archivo Excel (.xlsx).",
    )

    def clean_csv_file(self):

        archivo = self.cleaned_data["csv_file"]

        if not archivo.name.lower().endswith(".xlsx"):

            raise forms.ValidationError(
                "El archivo debe tener formato .xlsx."
            )

        return archivo


# ==========================================================
# CARGA MASIVA DE TÉCNICOS
# ==========================================================

class TecnicoCargaForm(forms.Form):

    xlsx_file = forms.FileField(
        label="Archivo Excel de técnicos",
        required=True,
        help_text="Seleccione un archivo Excel (.xlsx).",
    )

    def clean_xlsx_file(self):

        archivo = self.cleaned_data["xlsx_file"]

        if not archivo.name.lower().endswith(".xlsx"):

            raise forms.ValidationError(
                "El archivo debe tener formato .xlsx."
            )

        return archivo


# ==========================================================
# FORMULARIO INDIVIDUAL DE AUDITORÍA
# ==========================================================

class AuditoriaForm(forms.ModelForm):

    class Meta:

        model = Auditoria

        fields = [
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


# ==========================================================
# FORMULARIO INDIVIDUAL DE TÉCNICO
# ==========================================================

class TecnicoForm(forms.ModelForm):

    class Meta:

        model = Tecnicos

        fields = [
            "supervisor",
            "tecnico_cedula",
            "tecnico_apellido_nombres",
        ]
