from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render


@staff_member_required
def home(request):
    # get_app_list es la misma función que usa el admin de Django por dentro:
    # nos da la lista real de tus apps y modelos, con permisos ya aplicados.
    app_list = admin.site.get_app_list(request)

    total_models = sum(len(app["models"]) for app in app_list)

    context = {
        "app_list": app_list,
        "total_apps": len(app_list),
        "total_models": total_models,
    }
    return render(request, "panel/home.html", context)