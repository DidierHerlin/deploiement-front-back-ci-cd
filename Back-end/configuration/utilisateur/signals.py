import os

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Utilisateur


# SIGNAL : DROITS ADMIN AUTOMATIQUES
@receiver(pre_save, sender=Utilisateur)
def rendre_admin_complet(sender, instance, **kwargs):
    """Seuls les comptes 'ADMIN' ont les droits admin Django (staff + superuser)."""
    if instance.role == Utilisateur.Role.ADMIN:
        instance.is_staff = True
        instance.is_superuser = True


@receiver(post_save, sender=Utilisateur)
def log_creation_admin(sender, instance, created, **kwargs):
    if created and instance.role == Utilisateur.Role.ADMIN:
        print(f"\n[OK] ADMINISTRATEUR CREE -> {instance.email} | Acces admin active !\n")


# ====================== SIGNAL : SUPPRESSION DE L'ANCIENNE PHOTO ======================
@receiver(pre_save, sender=Utilisateur)
def delete_old_profile_photo(sender, instance, **kwargs):
    if not instance.pk:
        return False

    try:
        ancien_utilisateur = Utilisateur.objects.get(pk=instance.pk)
    except Utilisateur.DoesNotExist:
        return False

    if ancien_utilisateur.photo_profil and ancien_utilisateur.photo_profil != instance.photo_profil:
        if os.path.isfile(ancien_utilisateur.photo_profil.path):
            os.remove(ancien_utilisateur.photo_profil.path)
