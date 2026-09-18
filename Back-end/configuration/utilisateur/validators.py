import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ComplexPasswordValidator:

    def validate(self, password, user=None):
        errors = []

        if not re.search(r"[A-Z]", password):
            errors.append(
                ValidationError(
                    _("Le mot de passe doit contenir au moins une lettre majuscule."),
                    code="password_no_upper",
                )
            )

        if not re.search(r"[0-9]", password):
            errors.append(
                ValidationError(
                    _("Le mot de passe doit contenir au moins un chiffre."),
                    code="password_no_digit",
                )
            )

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            "Votre mot de passe doit contenir au moins 8 caractères, "
            "dont une lettre majuscule et un chiffre."
        )