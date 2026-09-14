from django.shortcuts import render
from auditorias.models import Auditoria
from django.contrib.auth.decorators import login_required


def login(request):
    return render(request, '../templates/dashboard/login.html')

@login_required
def index(request):
    return render(request, '../templates/dashboard/index.html')

