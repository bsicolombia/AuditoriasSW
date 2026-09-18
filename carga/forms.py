from django import forms
from .models import Bitacora
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
# ==========================================================
# FORMULARIO PARA CARGA MASIVA DE AUDITORÍAS
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

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        # --------------------------------------------------
        # EN LA CARGA MASIVA LA OBSERVACIÓN PUEDE VENIR VACÍA
        # --------------------------------------------------

        self.fields["observacion"].required = False

        # --------------------------------------------------
        # HALLAZGO Y TIPO DE HALLAZGO
        # NO SON OBLIGATORIOS PARA "CUMPLE"
        # --------------------------------------------------

        self.fields["tipo_hallazgo"].required = False
        self.fields["hallazgo"].required = False

    # ======================================================
    # VALIDACIÓN GENERAL
    # ======================================================

    def clean(self):

        cleaned_data = super().clean()

        resultado = cleaned_data.get(
            "resultado_auditoria"
        )

        observacion = cleaned_data.get(
            "observacion"
        )

        tipo_hallazgo = cleaned_data.get(
            "tipo_hallazgo"
        )

        hallazgo = cleaned_data.get(
            "hallazgo"
        )

        # ==================================================
        # CUMPLE
        # ==================================================

        if resultado == "cumple":

            # Para una auditoría que cumple,
            # estos campos pueden quedar vacíos.

            cleaned_data["tipo_hallazgo"] = ""
            cleaned_data["hallazgo"] = ""

        # ==================================================
        # NO CUMPLE
        # ==================================================

        elif resultado == "no_cumple":

            # ------------------------------------------------
            # TIPO DE HALLAZGO
            # ------------------------------------------------

            if not tipo_hallazgo:

                self.add_error(
                    "tipo_hallazgo",
                    (
                        "Debe seleccionar el tipo "
                        "de hallazgo."
                    )
                )

            # ------------------------------------------------
            # HALLAZGO
            # ------------------------------------------------

            if not hallazgo:

                self.add_error(
                    "hallazgo",
                    (
                        "Debe seleccionar el hallazgo."
                    )
                )

        return cleaned_data



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

class BitacoraForm(forms.ModelForm):

    class Meta:
        model = Bitacora
        fields = ['observaciones']