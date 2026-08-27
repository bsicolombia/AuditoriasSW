from django.db import models

# Create your models here.
class Tecnicos (models.Model):
    supervisor = models.CharField(max_length=150)
    tecnico_cedula = models.CharField(max_length=10, unique=True)
    tecnico_apellido_nombres = models.CharField(max_length=150)
    
    def __str__(self):
        return self.tecnico_apellido_nombres