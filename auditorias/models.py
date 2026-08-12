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

    fecha = models.DateField()

    nombre_auditor = models.CharField(
        max_length=100
    )

    numero_cedula = models.CharField(
        max_length=10
    )

    aplicativo = models.CharField(
        max_length=100
    )

    fecha_operacion = models.DateField()

    nombre_tecnico = models.CharField(
        max_length=200
    )

    numero_cuenta_contrato = models.CharField(
        max_length=9
    )

    numero_orden = models.CharField(
        max_length=11
    )

    tipo_operacion = models.CharField(
        max_length=10,
        choices=TIPO_OPERACION
    )

    resultado_auditoria = models.CharField(
        max_length=20,
        choices=RESULTADO
    )

    observacion = models.TextField(
        blank=True
    )

    tipo_hallazgo = models.CharField(
        max_length=20,
        choices=TIPO_HALLAZGO,
        blank=True
    )

    hallazgo = models.TextField(
        blank=True
    )

    fecha_carga = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.nombre_tecnico} - "
            f"{self.resultado_auditoria}"
        )
