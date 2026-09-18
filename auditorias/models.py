from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
import os
from django.utils import timezone

# ============================================================
# HALLAZGOS
# ============================================================

HALLAZGOS_ALTO = [
    ("1.Medidor Erróneo", "1.Medidor Erróneo"),
    ("2.Fugas  superior de a  1Vol", "2.Fugas superior de a 1Vol"),
    ("3.Troques de pdf", "3.Troques de pdf"),
    ("4.Foto original del ht", "4.Foto original del ht"),
    ("5.Lectura errónea", "5.Lectura errónea"),
    ("6.Anomalía", "6.Anomalía"),
    ("7.Precintado", "7.Precintado"),
    ("8.Troque de válvula.", "8.Troque de válvula."),
    ("9.Tachones y enmendaduras en el HT", "9.Tachones y enmendaduras en el HT"),
    ("10.Sentido del maneral.", "10.Sentido del maneral"),
    ("11.Sin anexos SAP", "11.Sin anexos SAP"),
    ("12.Falta o error de información en el  ht.", "12.Falta o error de información en el ht."),
    ("13.Retiro de material y residuos.", "13.Retiro de material y residuos."),
    ("14.Pruebas con detector de fugas.", "14.Pruebas con detector de fugas."),
    ("15.Prueba de estanqueidad.", "15.Prueba de estanqueidad."),
    ("16.Diligenciamiento de datos en aplicativo", "16.Diligenciamiento de datos en aplicativo"),
    ("17.Registro fotográfico incompleto", "17.Registro fotográfico incompleto"),
]


HALLAZGOS_MEDIO = [
    ("1.Anexos adicionales no correspondientes a la cuenta",
     "1.Anexos adicionales no correspondientes a la cuenta"),

    ("2.Justificación de falta material",
     "2.Justificación de falta material"),

    ("3.Foto acrílica.",
     "3.Foto acrílica"),

    ("4.Observaciones de novedades",
     "4.Observaciones de novedades"),

    ("5.Diligenciamiento información del acrílico.",
     "5.Diligenciamiento información del acrílico"),

    ("6.Registro fotográfico del centro medición y nicho antes de iniciar la operación",
     "6.Registro fotográfico del centro medición y nicho antes de iniciar la operación"),

    ("7.Foto de odómetro con lectura y número de medidor legible",
     "7.Foto de odómetro con lectura y número de medidor legible"),

    ("8.No relaciona material en el aplicativo SAP",
     "8.No relaciona material en el aplicativo SAP"),

    ("9.Copia ht",
     "9.Copia ht"),

    ("10.Registro fotográfico borrosas",
     "10.Registro fotográfico borrosas"),
]


HALLAZGOS_BAJO = [
    ("1.Color de marcador y esfero",
     "1.Color de marcador y esfero"),

    ("2.Acrílico deteriorado",
     "2.Acrílico deteriorado"),

    ("3.Calidad de fotos",
     "3.Calidad de fotos"),

    ("4.Stampa.",
     "4.Stampa"),

    ("5.Foto fachada.",
     "5.Foto fachada"),

    ("6.Observaciones en el aplicativo SAP",
     "6.Observaciones en el aplicativo SAP"),
]


HALLAZGOS = (
    HALLAZGOS_ALTO
    + HALLAZGOS_MEDIO
    + HALLAZGOS_BAJO
)


class Auditoria(models.Model):

    RESULTADO = [
        ("cumple", "Cumple"),
        ("no_cumple", "No cumple"),
    ]

    TIPO_HALLAZGO = [
        ("alto", "Alto"),
        ("medio", "Medio"),
        ("bajo", "Bajo"),
    ]

    TIPO_OPERACION = [
        ("ZVCL", "ZVCL"),
        ("DC00", "DC00"),
        ("RC00", "RC00"),
    ]

    ORIGEN = [
        ("excel", "Cargue Excel"),
        ("manual", "Registrada en el software"),
    ]

    # ========================================================
    # FECHA Y HORA
    # ========================================================
    # Corresponde a "Marca temporal" del Excel.
    # ========================================================

    fecha = models.DateTimeField(
        verbose_name="Marca temporal",
        default=timezone.now,
    )

    # ========================================================
    # DATOS DEL AUDITOR
    # ========================================================

    nombre_auditor = models.CharField(
        max_length=100
    )

    numero_cedula = models.CharField(
        max_length=10
    )

    aplicativo = models.CharField(
        max_length=100
    )

    # ========================================================
    # FECHA DE OPERACIÓN
    # ========================================================

    fecha_operacion = models.DateField(
        verbose_name="Fecha de operación"
    )

    # ========================================================
    # TÉCNICO
    # ========================================================

    nombre_tecnico = models.CharField(
        max_length=200
    )

    # SOLO NÚMEROS
    numero_cuenta_contrato = models.CharField(
        max_length=9
    )

    # SOLO NÚMEROS Y ÚNICA
    numero_orden = models.CharField(
        max_length=11,
        unique=True,
    )

    # ========================================================
    # OPERACIÓN
    # ========================================================

    tipo_operacion = models.CharField(
        max_length=10,
        choices=TIPO_OPERACION,
    )

    # ========================================================
    # RESULTADO
    # ========================================================

    resultado_auditoria = models.CharField(
        max_length=20,
        choices=RESULTADO,
    )

    # ========================================================
    # OBSERVACIÓN
    # ========================================================

    observacion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Observación",
    )


    # ========================================================
    # TIPO DE HALLAZGO
    # ========================================================

    tipo_hallazgo = models.CharField(
        max_length=20,
        choices=TIPO_HALLAZGO,
        blank=True,
        null=True,
    )

    # ========================================================
    # HALLAZGO ESPECÍFICO
    # ========================================================

    hallazgo = models.CharField(
        max_length=255,
        choices=HALLAZGOS,
        blank=True,
        null=True,
        verbose_name="Hallazgo",
    )

    # ========================================================
    # FOTO
    # ========================================================

    foto_evidencia = models.ImageField(
        upload_to="auditorias/evidencias/%Y/%m/",
        blank=True,
        null=True,
        verbose_name="Foto de evidencia",
    )

    # ========================================================
    # ORIGEN
    # ========================================================

    origen = models.CharField(
        max_length=10,
        choices=ORIGEN,
        default="manual",
    )

    # ========================================================
    # USUARIO
    # ========================================================

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="auditorias_creadas",
    )

    # ========================================================
    # FECHA REAL DE CARGA
    # ========================================================

    fecha_carga = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha y hora de registro",
    )

    class Meta:
        ordering = ["-fecha"]

    def __str__(self):
        return (
            f"{self.nombre_tecnico} - "
            f"{self.resultado_auditoria}"
        )

    # ========================================================
    # VALIDACIONES
    # ========================================================

    def clean(self):
        super().clean()

        # ----------------------------------------------------
        # CUENTA CONTRATO: SOLO NÚMEROS
        # ----------------------------------------------------

        if self.numero_cuenta_contrato:
            if not self.numero_cuenta_contrato.isdigit():
                raise ValidationError({
                    "numero_cuenta_contrato":
                        "El número de cuenta contrato solo puede "
                        "contener números."
                })

        # ----------------------------------------------------
        # ORDEN: SOLO NÚMEROS
        # ----------------------------------------------------

        if self.numero_orden:

            if not self.numero_orden.isdigit():
                raise ValidationError({
                    "numero_orden":
                        "El número de orden solo puede "
                        "contener números."
                })

            qs = Auditoria.objects.filter(
                numero_orden=self.numero_orden
            )

            if self.pk:
                qs = qs.exclude(pk=self.pk)

            if qs.exists():
                raise ValidationError({
                    "numero_orden":
                        f"Ya existe una auditoría con la orden "
                        f"'{self.numero_orden}'."
                })

        # ----------------------------------------------------
        # FECHA DE OPERACIÓN
        # ----------------------------------------------------

        hoy = timezone.localdate()

        if self.fecha_operacion and self.fecha_operacion > hoy:
            raise ValidationError({
                "fecha_operacion":
                    "La fecha de operación no puede ser "
                    "superior a la fecha de hoy."
            })

        # ----------------------------------------------------
        # CUMPLE
        # ----------------------------------------------------

        if self.resultado_auditoria == "cumple":

            self.tipo_hallazgo = None
            self.hallazgo = None

        # ----------------------------------------------------
        # NO CUMPLE
        # ----------------------------------------------------

        elif self.resultado_auditoria == "no_cumple":

            if not self.tipo_hallazgo:
                raise ValidationError({
                    "tipo_hallazgo":
                        "Debe seleccionar el tipo de hallazgo."
                })

            if not self.hallazgo:
                raise ValidationError({
                    "hallazgo":
                        "Debe seleccionar el hallazgo."
                })

        # ----------------------------------------------------
        # OBSERVACIÓN OBLIGATORIA
        # ----------------------------------------------------

                # ----------------------------------------------------
        # OBSERVACIÓN OBLIGATORIA SOLO SI NO CUMPLE
        # ----------------------------------------------------

                # ----------------------------------------------------
        # OBSERVACIÓN OBLIGATORIA
        #
        # Solo aplica para registros cargados desde el
        # software (origen "manual"), y únicamente cuando
        # el resultado es "no_cumple". Los registros que
        # vienen del Excel NUNCA exigen observación,
        # sin importar el resultado.
        # ----------------------------------------------------

                # ----------------------------------------------------
        # OBSERVACIÓN OBLIGATORIA
        #
        # Solo aplica a registros del software (origen
        # "manual"), y solo cuando el resultado es
        # "no_cumple". Los registros que vienen del Excel
        # nunca exigen observación, sin importar el resultado.
        # ----------------------------------------------------

        if self.origen == "manual" and self.resultado_auditoria == "no_cumple":
            if not self.observacion or not self.observacion.strip():
                raise ValidationError({
                    "observacion":
                        "La observación es obligatoria "
                        "cuando la auditoría no cumple."
                })

    


# ============================================================
# PERFIL DE USUARIO
# ============================================================

class PerfilUsuario(models.Model):

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil",
    )

    numero_cedula = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="Número de cédula",
    )

    class Meta:
        verbose_name = "Perfil de usuario"
        verbose_name_plural = "Perfiles de usuario"

    def __str__(self):
        nombre = (
            self.usuario.get_full_name()
            or self.usuario.username
        )

        return f"{nombre} - {self.numero_cedula}"
