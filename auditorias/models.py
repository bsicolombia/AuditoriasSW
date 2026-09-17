from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Auditoria(models.Model):

    RESULTADO = [
        ("cumple", "Cumple"),
        ("no_cumple", "NO CUMPLE"),
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

    # ------------------------------------------------------
    # NUEVO: para diferenciar auditorías cargadas por Excel
    # de las registradas directamente en el software.
    # ------------------------------------------------------
    ORIGEN = [
        ("excel", "Cargue Excel"),
        ("manual", "Registrada en el software"),
    ]

    fecha = models.DateField()
    nombre_auditor = models.CharField(max_length=100)
    numero_cedula = models.CharField(max_length=10)
    aplicativo = models.CharField(max_length=100)
    fecha_operacion = models.DateField()
    nombre_tecnico = models.CharField(max_length=200)
    numero_cuenta_contrato = models.CharField(max_length=9)

    # IMPORTANTE:
    # unique=True agrega una validación a nivel de base de
    # datos (además de la que hacemos en el formulario/vista)
    # para que jamás se pueda repetir un número de orden.
    numero_orden = models.CharField(max_length=11, unique=True)

    tipo_operacion = models.CharField(max_length=10, choices=TIPO_OPERACION)
    resultado_auditoria = models.CharField(max_length=20, choices=RESULTADO)
    observacion = models.TextField(blank=True)
    tipo_hallazgo = models.CharField(max_length=20, choices=TIPO_HALLAZGO, blank=True)
    hallazgo = models.TextField(blank=True)

    # ========================================================
    # CAMPOS NUEVOS
    # ========================================================

    # Foto de evidencia: OPCIONAL (se puede subir o no).
    foto_evidencia = models.ImageField(
        upload_to="auditorias/evidencias/%Y/%m/",
        blank=True,
        null=True,
        verbose_name="Foto de evidencia",
    )

    # Se llena automáticamente por la vista, nunca por el usuario.
    origen = models.CharField(
        max_length=10,
        choices=ORIGEN,
        default="manual",
        verbose_name="Origen del registro",
    )

    # Usuario que hizo la auditoría desde el software.
    # NULL para los registros antiguos cargados por Excel.
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="auditorias_creadas",
        verbose_name="Usuario que registró",
    )

    # Fecha/hora real de carga o creación (ya existía, se conserva).
    fecha_carga = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha y hora de registro",
    )

    class Meta:
        ordering = ["-fecha_carga"]

    def __str__(self):
        return (
            f"{self.nombre_tecnico} - "
            f"{self.resultado_auditoria}"
        )

    # ========================================================
    # VALIDACIÓN A NIVEL DE MODELO (capa extra de seguridad)
    # ========================================================
    def clean(self):
        super().clean()

        if not self.numero_orden:
            return

        qs = Auditoria.objects.filter(numero_orden=self.numero_orden)

        if self.pk:
            qs = qs.exclude(pk=self.pk)

        if qs.exists():
            raise ValidationError(
                {
                    "numero_orden": (
                        f"Ya existe una auditoría con la orden "
                        f"'{self.numero_orden}'. No se permiten "
                        f"órdenes duplicadas."
                    )
                }
            )
            
# Agregar esta clase a auditorias/models.py (o donde tengas Auditoria)
# NO reemplaza nada, solo se agrega.

from django.conf import settings
from django.db import models


class PerfilUsuario(models.Model):
    """
    Guarda datos adicionales del usuario que Django no tiene
    por defecto (como la cédula), SIN modificar el modelo
    User ni el campo last_name.
    """

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
        nombre = self.usuario.get_full_name() or self.usuario.username
        return f"{nombre} - {self.numero_cedula}"