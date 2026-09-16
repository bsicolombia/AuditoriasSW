from django.db import models
from django.conf import settings


# Create your models here.
class Tecnicos (models.Model):
    supervisor = models.CharField(max_length=150)
    tecnico_cedula = models.CharField(max_length=10, unique=True)
    tecnico_apellido_nombres = models.CharField(max_length=150)
    
    class Meta:
        verbose_name = "Técnico"
        verbose_name_plural = "Técnicos"
    
    def __str__(self):
        return self.tecnico_apellido_nombres
    
class Bitacora(models.Model):

    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='bitacoras')
    observaciones = models.TextField()

    def __str__(self):
        return f"{self.usuario.username} - {self.fecha}"

from django.conf import settings

class EstadoCarga(models.Model):
    """
    Guarda un único registro global con la fecha/hora y el
    usuario de la última carga de auditorías y de técnicos.
    Visible para todos los usuarios y dispositivos porque
    vive en la base de datos, no en la sesión.
    """

    ultima_carga_auditorias = models.DateTimeField(
        null=True,
        blank=True,
    )

    ultima_carga_tecnicos = models.DateTimeField(
        null=True,
        blank=True,
    )

    usuario_carga_auditorias = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    usuario_carga_tecnicos = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    class Meta:
        verbose_name = "Estado de carga"
        verbose_name_plural = "Estado de carga"

    def __str__(self):
        return "Estado de carga del sistema"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj