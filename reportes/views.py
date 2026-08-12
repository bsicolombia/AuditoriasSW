from django.shortcuts import render

def reporte(request):
    return render(request, '../templates/reportes/reportes.html')