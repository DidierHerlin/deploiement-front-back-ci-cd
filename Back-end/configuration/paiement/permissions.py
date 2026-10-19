from rest_framework import permissions
from utilisateur.models import Utilisateur


class PaiementPermission(permissions.BasePermission):
    """
    Permissions pour les paiements :
    - ADMIN : CRUD complet + supervision
    - AGENT : CRUD complet
    - LOCATAIRE : lecture de ses propres paiements
    - PROPRIETAIRE : lecture des paiements liés à ses biens
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        # Lecture : tout utilisateur authentifié (mais filtré ensuite)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Écriture : seulement ADMIN ou AGENT
        return user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT)

    def has_object_permission(self, request, view, obj):
        user = request.user

        # ADMIN et AGENT : accès total
        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return True

        # Écriture sur un objet existant : seulement ADMIN ou AGENT
        if request.method not in permissions.SAFE_METHODS:
            return False

        # LOCATAIRE : ses propres paiements
        if user.role == Utilisateur.Role.LOCATAIRE:
            return obj.contrat.locataire.user == user

        # PROPRIETAIRE : paiements des biens qu'il possède
        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return obj.contrat.bien.proprietaire.user == user

        return False


class DemandePaiementPermission(permissions.BasePermission):
    """
    Permissions pour les demandes de paiement :
    - ADMIN / AGENT : accès complet (CRUD, validation, refus)
    - LOCATAIRE : peut créer une demande, consulter ses propres demandes, et annuler sa demande en attente
    - PROPRIETAIRE : consultation des demandes liées à ses biens
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return True

        if user.role == Utilisateur.Role.LOCATAIRE:
            # Locataire peut lire, créer une demande, ou déclencher les actions personnalisées autorisées (annuler, factures_eligibles)
            if request.method in permissions.SAFE_METHODS:
                return True
            if request.method == "POST":
                return True
            return False

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return request.method in permissions.SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in (Utilisateur.Role.ADMIN, Utilisateur.Role.AGENT):
            return True

        if user.role == Utilisateur.Role.LOCATAIRE:
            if obj.locataire.user != user:
                return False
            if request.method in permissions.SAFE_METHODS:
                return True
            if getattr(view, "action", None) == "annuler":
                return True
            return False

        if user.role == Utilisateur.Role.PROPRIETAIRE:
            return (
                request.method in permissions.SAFE_METHODS
                and obj.facture.contrat.bien.proprietaire.user == user
            )

        return False