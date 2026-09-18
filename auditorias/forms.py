from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import (
    Auditoria,
    HALLAZGOS_ALTO,
    HALLAZGOS_MEDIO,
    HALLAZGOS_BAJO,
)


class AuditoriaManualForm(forms.ModelForm):

    class Meta:
        model = Auditoria

        fields = [
            "fecha_operacion",
            "nombre_tecnico",
            "numero_cuenta_contrato",
            "numero_orden",
            "tipo_operacion",
            "resultado_auditoria",
            "tipo_hallazgo",
            "hallazgo",
            "observacion",
            "foto_evidencia",
        ]

        widgets = {

            "fecha_operacion": forms.DateInput(
                attrs={
                    "type": "date",
                    "max": timezone.localdate().isoformat(),
                }
            ),

            "nombre_tecnico": forms.TextInput(
                attrs={
                    "autocomplete": "off",
                }
            ),

            "numero_cuenta_contrato": forms.TextInput(
                attrs={
                    "inputmode": "numeric",
                    "pattern": "[0-9]*",
                    "maxlength": "9",
                }
            ),

            "numero_orden": forms.TextInput(
                attrs={
                    "inputmode": "numeric",
                    "pattern": "[0-9]*",
                    "maxlength": "11",
                }
            ),

            "resultado_auditoria": forms.Select(),

            "tipo_hallazgo": forms.Select(),

            "hallazgo": forms.Select(),

            "observacion": forms.Textarea(
                attrs={
                    "rows": 4,
                }
            ),

            "foto_evidencia": forms.ClearableFileInput(),
        }

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        # ----------------------------------------------------
        # HALLAZGO VACÍO INICIAL
        # ----------------------------------------------------

        self.fields["hallazgo"].choices = [
            ("", "Seleccione primero el tipo de hallazgo")
        ]

        # ----------------------------------------------------
        # SI ESTAMOS EDITANDO
        # ----------------------------------------------------

        tipo = self.data.get(
            "tipo_hallazgo"
        )

        if not tipo and self.instance:
            tipo = self.instance.tipo_hallazgo

        if tipo:

            self._cargar_hallazgos(tipo)

    # ========================================================
    # CARGAR HALLAZGOS SEGÚN TIPO
    # ========================================================

    def _cargar_hallazgos(self, tipo):

        if tipo == "alto":

            choices = HALLAZGOS_ALTO

        elif tipo == "medio":

            choices = HALLAZGOS_MEDIO

        elif tipo == "bajo":

            choices = HALLAZGOS_BAJO

        else:

            choices = []

        self.fields["hallazgo"].choices = [
            ("", "Seleccione un hallazgo")
        ] + list(choices)

    # ========================================================
    # VALIDACIÓN
    # ========================================================

    def clean_numero_cuenta_contrato(self):

        valor = (
            self.cleaned_data
            .get("numero_cuenta_contrato")
        )

        if valor and not valor.isdigit():

            raise ValidationError(
                "La cuenta contrato solo puede contener números."
            )

        return valor

    def clean_numero_orden(self):

        valor = (
            self.cleaned_data
            .get("numero_orden")
        )

        if valor and not valor.isdigit():

            raise ValidationError(
                "El número de orden solo puede contener números."
            )

        qs = Auditoria.objects.filter(
            numero_orden=valor
        )

        if self.instance.pk:
            qs = qs.exclude(
                pk=self.instance.pk
            )

        if qs.exists():

            raise ValidationError(
                "Esta orden ya existe. "
                "No se permiten órdenes duplicadas."
            )

        return valor

    def clean_fecha_operacion(self):

        fecha = (
            self.cleaned_data
            .get("fecha_operacion")
        )

        if fecha and fecha > timezone.localdate():

            raise ValidationError(
                "La fecha de operación no puede ser "
                "posterior a hoy."
            )

        return fecha

    def clean(self):

        cleaned_data = super().clean()

        resultado = cleaned_data.get(
            "resultado_auditoria"
        )

        tipo = cleaned_data.get(
            "tipo_hallazgo"
        )

        hallazgo = cleaned_data.get(
            "hallazgo"
        )

        observacion = cleaned_data.get(
            "observacion"
        )

        # ----------------------------------------------------
        # OBSERVACIÓN SIEMPRE OBLIGATORIA
        # ----------------------------------------------------

        # OBSERVACIÓN OBLIGATORIA SOLO PARA NO CUMPLE

        if resultado == "no_cumple":

            if not observacion or not observacion.strip():

                self.add_error(
                    "observacion",
                    (
                        "La observación es obligatoria "
                        "cuando la auditoría no cumple."
                    )
                )


        # ----------------------------------------------------
        # CUMPLE
        # ----------------------------------------------------

        if resultado == "cumple":

            cleaned_data["tipo_hallazgo"] = ""
            cleaned_data["hallazgo"] = ""

        # ----------------------------------------------------
        # NO CUMPLE
        # ----------------------------------------------------

        elif resultado == "no_cumple":

            if not tipo:

                self.add_error(
                    "tipo_hallazgo",
                    "Debe seleccionar el tipo de hallazgo."
                )

            if not hallazgo:

                self.add_error(
                    "hallazgo",
                    "Debe seleccionar el hallazgo."
                )

            # ------------------------------------------------
            # VALIDAR QUE EL HALLAZGO PERTENEZCA AL TIPO
            # ------------------------------------------------

            if tipo == "alto":

                permitidos = dict(HALLAZGOS_ALTO)

            elif tipo == "medio":

                permitidos = dict(HALLAZGOS_MEDIO)

            elif tipo == "bajo":

                permitidos = dict(HALLAZGOS_BAJO)

            else:

                permitidos = {}

            if hallazgo and hallazgo not in permitidos:

                self.add_error(
                    "hallazgo",
                    "El hallazgo seleccionado no "
                    "corresponde al tipo seleccionado."
                )

        return cleaned_data