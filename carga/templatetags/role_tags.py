from django import template

register = template.Library()


@register.filter
def has_any_role(user, roles):
    # No autenticado
    if not user.is_authenticated:
        return False

    # Superusuario: acceso a todo
    if user.is_superuser:
        return True

    # Roles separados por coma
    role_list = [role.strip() for role in roles.split(",") if role.strip()]

    # Solo revisamos los grupos. NO revisamos permisos.
    return user.groups.filter(name__in=role_list).exists()
