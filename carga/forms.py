from django import forms
from auditorias.models import Auditoria


class CsvUploadForm(forms.Form):

    csv_file = forms.FileField(
        label="Archivo Excel",
        required=True,
        help_text="Seleccione un archivo Excel (.xlsx)."
    )


class AuditoriaForm(forms.ModelForm):

    class Meta:

        model = Auditoria

        fields = "__all__"