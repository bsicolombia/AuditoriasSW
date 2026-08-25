from django import forms
from auditorias.models import Auditoria


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
