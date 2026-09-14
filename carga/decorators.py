from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied


def role_required(*roles):
    def decorator(view_func):

        @wraps(view_func)
        @login_required
        def wrapper(request, *args, **kwargs):

            # Superusuario tiene acceso a todo
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)

            # Obtener grupos del usuario
            user_roles = request.user.groups.values_list("name", flat=True)

            # Comprobar si tiene alguno de los roles permitidos
            if not any(role in user_roles for role in roles):
                raise PermissionDenied

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
