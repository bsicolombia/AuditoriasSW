from django.shortcuts import render
from auditorias.models import Auditoria

def index(request):
    return render(request, '../templates/dashboard/index.html')

