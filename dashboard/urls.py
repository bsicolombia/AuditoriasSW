from django.urls import path
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [

    # LOGIN
    path(
        "",
        auth_views.LoginView.as_view(
            template_name="dashboard/login.html"
        ),
        name="login",
    ),

    # LOGOUT
    path(
        "accounts/logout/",
        auth_views.LogoutView.as_view(),
        name="logout",
    ),

    # INDEX / DASHBOARD
    path(
        "index/",
        views.index,
        name="index",
    ),

    # ADMIN
    path(
        "admin/",
        admin.site.urls
    ),
]
