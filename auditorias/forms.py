from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone

from carga.models import Tecnicos

from .models import (
    Auditoria,
    HALLAZGOS_ALTO,
    HALLAZGOS_MEDIO,
    HALLAZGOS_BAJO,
)


class AuditoriaManualForm(forms.ModelForm):

    # ========================================================
    # TÉCNICO
    # ========================================================

    nombre_tecnico = forms.ModelChoiceField(
        queryset=(
            Tecnicos.objects
            .exclude(
                tecnico_cedula__isnull=True
            )
            .exclude(
                tecnico_cedula__exact=""
            )
            .exclude(
                tecnico_apellido_nombres__isnull=True
            )
            .exclude(
                tecnico_apellido_nombres__exact=""
            )
            .order_by(
                "tecnico_apellido_nombres"
            )
        ),
        empty_label="Seleccione un técnico",
        required=True,
        label="Técnico",
        widget=forms.Select(
            attrs={
                "autocomplete": "off",
            }
        ),
    )

    class Meta:

        model = Auditoria

        fields = [
            "aplicativo",
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

            "aplicativo": forms.Select(
                attrs={
                    "autocomplete": "off",
                }
            ),

            "fecha_operacion": forms.DateInput(
                attrs={
                    "type": "date",
                    "max": timezone.localdate().isoformat(),
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

    # ========================================================
    # INICIALIZACIÓN
    # ========================================================

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        self.fields["hallazgo"].choices = [
            (
                "",
                "Seleccione primero el tipo de hallazgo"
            )
        ]

        tipo = self.data.get("tipo_hallazgo")

        if not tipo and self.instance and self.instance.pk:
            tipo = self.instance.tipo_hallazgo

        if tipo:
            self._cargar_hallazgos(tipo)


    # ========================================================
    # GUARDAR
    # ========================================================

    def save(self, commit=True):

        auditoria = super().save(
            commit=False
        )

        tecnico = self.cleaned_data.get(
            "nombre_tecnico"
        )

        if tecnico:

            nombre = (
                str(
                    tecnico.tecnico_apellido_nombres
                )
                .strip()
            )

            cedula = (
                str(
                    tecnico.tecnico_cedula
                )
                .strip()
            )

            # -----------------------------------------------
            # NORMALIZAR CÉDULA
            # -----------------------------------------------

            import re

            cedula = re.sub(
                r"\D",
                "",
                cedula
            )

            # -----------------------------------------------
            # FORMATO HISTÓRICO DEL EXCEL
            # -----------------------------------------------

            if cedula:

                auditoria.nombre_tecnico = (
                    f"{nombre}-{cedula}"
                )

            else:

                auditoria.nombre_tecnico = nombre

        else:

            auditoria.nombre_tecnico = ""

        if commit:

            auditoria.save()

            self.save_m2m()

        return auditoria

    # ========================================================
    # CARGAR HALLAZGOS
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
            (
                "",
                "Seleccione un hallazgo"
            )
        ] + list(choices)
        
    def get_hallazgos_json(self):
        return {
            "alto": list(HALLAZGOS_ALTO),
            "medio": list(HALLAZGOS_MEDIO),
            "bajo": list(HALLAZGOS_BAJO),
        }

    # ========================================================
    # VALIDAR CUENTA / CONTRATO
    # ========================================================

    def clean_numero_cuenta_contrato(self):

        valor = self.cleaned_data.get(
            "numero_cuenta_contrato"
        )

        if valor and not valor.isdigit():

            raise ValidationError(
                "La cuenta contrato solo puede contener números."
            )

        return valor

    # ========================================================
    # VALIDAR NÚMERO DE ORDEN
    # ========================================================

    def clean_numero_orden(self):

        valor = self.cleaned_data.get(
            "numero_orden"
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

    # ========================================================
    # VALIDAR FECHA
    # ========================================================

    def clean_fecha_operacion(self):

        fecha = self.cleaned_data.get(
            "fecha_operacion"
        )

        if fecha and fecha > timezone.localdate():

            raise ValidationError(
                "La fecha de operación no puede ser "
                "posterior a hoy."
            )

        return fecha

    # ========================================================
    # VALIDACIÓN GENERAL
    # ========================================================

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

        if resultado == "no_cumple":

            if (
                not observacion
                or not observacion.strip()
            ):

                self.add_error(
                    "observacion",
                    (
                        "La observación es obligatoria "
                        "cuando la auditoría no cumple."
                    )
                )

        if resultado == "cumple":

            cleaned_data["tipo_hallazgo"] = ""
            cleaned_data["hallazgo"] = ""

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

            if tipo == "alto":

                permitidos = dict(
                    HALLAZGOS_ALTO
                )

            elif tipo == "medio":

                permitidos = dict(
                    HALLAZGOS_MEDIO
                )

            elif tipo == "bajo":

                permitidos = dict(
                    HALLAZGOS_BAJO
                )

            else:

                permitidos = {}

            if (
                hallazgo
                and hallazgo not in permitidos
            ):

                self.add_error(
                    "hallazgo",
                    (
                        "El hallazgo seleccionado no "
                        "corresponde al tipo seleccionado."
                    )
                )

        return cleaned_data
