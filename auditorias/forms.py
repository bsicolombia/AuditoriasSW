from django import forms
from django.core.exceptions import ValidationError

from .models import Auditoria


# auditorias/forms.py

from django import forms
from django.core.exceptions import ValidationError

from carga.models import Tecnicos
from .models import Auditoria


class AuditoriaManualForm(forms.ModelForm):
    """
    Formulario para registrar auditorías DIRECTAMENTE desde
    el software.

    Campos que YA NO se piden aquí porque se llenan solos
    desde la vista (auditoria_manual_crear):
        - fecha             -> fecha de hoy
        - nombre_auditor     -> nombre del usuario en sesión
        - numero_cedula      -> cédula del perfil del usuario
        - aplicativo         -> siempre "AuditoriasSW"

    El técnico ya no se escribe a mano: se elige de un
    <select> que se llena con la tabla Tecnicos, para
    buscarlo fácil y evitar nombres mal escritos.
    """

    tecnico = forms.ModelChoiceField(
        queryset=Tecnicos.objects.all().order_by("tecnico_apellido_nombres"),
        label="Técnico",
        empty_label="Seleccione un técnico...",
        widget=forms.Select(attrs={"class": "form-select"}),
    )

    class Meta:
        model = Auditoria
        fields = [
            "fecha_operacion",
            "numero_cuenta_contrato",
            "numero_orden",
            "tipo_operacion",
            "resultado_auditoria",
            "observacion",
            "tipo_hallazgo",
            "hallazgo",
            "foto_evidencia",
        ]

        widgets = {
            "fecha_operacion": forms.DateInput(
                attrs={"type": "date", "class": "form-control"}
            ),
            "numero_cuenta_contrato": forms.TextInput(
                attrs={"class": "form-control"}
            ),
            "numero_orden": forms.TextInput(attrs={"class": "form-control"}),
            "tipo_operacion": forms.Select(attrs={"class": "form-select"}),
            "resultado_auditoria": forms.Select(attrs={"class": "form-select"}),
            "tipo_hallazgo": forms.Select(attrs={"class": "form-select"}),
            "observacion": forms.Textarea(
                attrs={"rows": 3, "class": "form-control"}
            ),
            "hallazgo": forms.Textarea(
                attrs={"rows": 3, "class": "form-control"}
            ),
            "foto_evidencia": forms.ClearableFileInput(
                attrs={"class": "form-control"}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["foto_evidencia"].required = False
        self.fields["observacion"].required = False
        self.fields["tipo_hallazgo"].required = False
        self.fields["hallazgo"].required = False

        # Si estamos editando una auditoría ya creada, preseleccionar
        # el técnico buscando por nombre (porque nombre_tecnico se
        # guarda como texto en el modelo Auditoria).
        if self.instance and self.instance.pk and self.instance.nombre_tecnico:
            tecnico_actual = Tecnicos.objects.filter(
                tecnico_apellido_nombres__iexact=self.instance.nombre_tecnico
            ).first()

            if tecnico_actual:
                self.fields["tecnico"].initial = tecnico_actual.pk

    # ========================================================
    # VALIDAR: NÚMERO DE ORDEN NO DUPLICADO
    # ========================================================
    def clean_numero_orden(self):

        numero_orden = self.cleaned_data.get("numero_orden", "").strip()

        if not numero_orden:
            raise ValidationError("El número de orden es obligatorio.")

        qs = Auditoria.objects.filter(numero_orden=numero_orden)

        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise ValidationError(
                f"Ya existe una auditoría registrada con la orden "
                f"'{numero_orden}'. No se permiten órdenes duplicadas."
            )

        return numero_orden

    # ========================================================
    # VALIDAR: REGISTRO COMPLETO NO DUPLICADO
    #
    # Nota: fecha, nombre_auditor, numero_cedula y aplicativo
    # ya no están en el formulario, así que se leen desde
    # self.instance (la vista los deja puestos antes de validar).
    # ========================================================
    def clean(self):

        cleaned_data = super().clean()

        tecnico = cleaned_data.get("tecnico")
        fecha_operacion = cleaned_data.get("fecha_operacion")
        numero_cuenta_contrato = cleaned_data.get("numero_cuenta_contrato")
        tipo_operacion = cleaned_data.get("tipo_operacion")
        resultado_auditoria = cleaned_data.get("resultado_auditoria")

        datos_completos = all([
            tecnico,
            fecha_operacion,
            numero_cuenta_contrato,
            tipo_operacion,
            resultado_auditoria,
            self.instance.fecha,
            self.instance.nombre_auditor,
        ])

        if datos_completos:

            qs = Auditoria.objects.filter(
                fecha=self.instance.fecha,
                nombre_auditor__iexact=self.instance.nombre_auditor,
                numero_cedula=self.instance.numero_cedula,
                aplicativo__iexact=self.instance.aplicativo,
                fecha_operacion=fecha_operacion,
                nombre_tecnico__iexact=tecnico.tecnico_apellido_nombres,
                numero_cuenta_contrato=numero_cuenta_contrato,
                tipo_operacion=tipo_operacion,
                resultado_auditoria=resultado_auditoria,
            )

            if self.instance.pk:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise ValidationError(
                    "Ya existe una auditoría idéntica registrada "
                    "(mismo auditor, técnico, fecha, aplicativo y "
                    "tipo de operación)."
                )

        return cleaned_data

    # ========================================================
    # VALIDAR LA FOTO (si el usuario decide subirla)
    # ========================================================
    def clean_foto_evidencia(self):

        foto = self.cleaned_data.get("foto_evidencia")

        if foto:

            if foto.size > 5 * 1024 * 1024:
                raise ValidationError("La foto no puede superar los 5MB.")

            extensiones_validas = (".jpg", ".jpeg", ".png", ".webp")

            if not foto.name.lower().endswith(extensiones_validas):
                raise ValidationError(
                    "Formato de imagen no válido. Use JPG, PNG o WEBP."
                )

        return foto

    # ========================================================
    # GUARDAR: copiar el nombre del técnico elegido al modelo
    # ========================================================
    def save(self, commit=True):

        auditoria = super().save(commit=False)

        tecnico = self.cleaned_data.get("tecnico")

        if tecnico:
            auditoria.nombre_tecnico = tecnico.tecnico_apellido_nombres

        if commit:
            auditoria.save()

        return auditoria