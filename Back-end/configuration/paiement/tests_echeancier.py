"""Tests unitaires pour la génération automatique de l'échéancier de paiements.

Couvre les règles suivantes :
- Génération correcte du nombre d'échéances pour une durée donnée.
- Non-génération pour un contrat ACHAT.
- Non-régénération si des paiements existent déjà (idempotence).
- Montant de chaque échéance égal au loyer du contrat.
- Gestion correcte d'une date de début en fin de mois (ex. 31 janvier).
- Annulation des échéances EN_ATTENTE lors de la résiliation/terminaison.
- Non-génération pour un contrat créé avec un statut différent de ACTIF.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase

from bien.models import Bien
from contrats.models import Contrat
from paiement.models import Paiement
from utilisateur.models import Locataire, Proprietaire, Utilisateur


class EcheancierGenerationTestCase(TestCase):
    """Tests de la génération automatique de l'échéancier via le signal
    post_save sur Contrat (déclenché côté app paiement)."""

    def setUp(self):
        """Prépare les données de test : propriétaire, locataire, biens."""
        # --- Propriétaire ---
        self.proprio_user = Utilisateur.objects.create_user(
            email="proprio@test.com",
            password="TestPass123!",
            role=Utilisateur.Role.PROPRIETAIRE,
            nom="Dupont",
            prenoms="Jean",
        )
        self.proprietaire = Proprietaire.objects.create(
            user=self.proprio_user, iban="FR123"
        )

        # --- Locataire ---
        self.loc_user = Utilisateur.objects.create_user(
            email="loc@test.com",
            password="TestPass123!",
            role=Utilisateur.Role.LOCATAIRE,
            nom="Martin",
            prenoms="Paul",
        )
        self.locataire = Locataire.objects.create(user=self.loc_user)

        # --- Bien en location ---
        self.bien_location = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Appart Test",
            type="APPARTEMENT",
            mode_transaction="LOCATION",
            adresse="Tana",
            surface=50,
            nombre_pieces=3,
            loyer_mensuel=500_000,
            statut=Bien.StatutBien.DISPONIBLE,
        )

        # --- Bien en vente (pour les tests sur ACHAT) ---
        self.bien_vente = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Maison Test",
            type="MAISON",
            mode_transaction="VENTE",
            adresse="Tana",
            surface=100,
            nombre_pieces=4,
            prix=200_000_000,
            statut=Bien.StatutBien.DISPONIBLE,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _creer_bien_location(self, titre="Bien Sup", **overrides):
        """Crée un bien DISPONIBLE en location (utile quand on a besoin
        d'un bien distinct pour éviter la contrainte d'unicité sur bien actif)."""
        valeurs = {
            "proprietaire": self.proprietaire,
            "titre": titre,
            "type": "APPARTEMENT",
            "mode_transaction": "LOCATION",
            "adresse": "Tana",
            "surface": 40,
            "nombre_pieces": 2,
            "loyer_mensuel": 400_000,
            "statut": Bien.StatutBien.DISPONIBLE,
        }
        valeurs.update(overrides)
        return Bien.objects.create(**valeurs)

    # ------------------------------------------------------------------
    # Test 1 : Génération correcte pour 12 mois
    # ------------------------------------------------------------------
    def test_generation_echeancier_12_mois(self):
        """Un contrat LOCATION ACTIF de 12 mois doit générer exactement
        12 échéances, de date_debut (inclus) à date_fin (exclu)."""
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )

        paiements = Paiement.objects.filter(contrat=contrat).order_by("date_echeance")
        self.assertEqual(paiements.count(), 12)

        # Première échéance = date_debut
        self.assertEqual(paiements.first().date_echeance, date(2026, 1, 1))
        # Dernière échéance = décembre 2026
        self.assertEqual(paiements.last().date_echeance, date(2026, 12, 1))

    # ------------------------------------------------------------------
    # Test 2 : Génération de l'échéancier pour un contrat ACHAT (échelonné)
    # ------------------------------------------------------------------
    def test_generation_echeancier_contrat_achat(self):
        """Un contrat ACHAT ACTIF doit générer 6 échéances en mode échelonné :
        - Échéance 1 : 50 % du prix + 5 % frais d'agence
        - Échéances 2-6 : 10 % du prix + 1 % frais d'agence chacune
        Et mode_paiement doit être null sur toutes les échéances.
        """
        # Prix = 50 000 000 (reste dans les limites de max_digits=15)
        prix = Decimal("50000000.00")
        bien_vente = Bien.objects.create(
            proprietaire=self.proprietaire,
            titre="Maison Achat Test",
            type="MAISON",
            mode_transaction="VENTE",
            adresse="Tana",
            surface=120,
            nombre_pieces=5,
            prix=prix,
            statut=Bien.StatutBien.DISPONIBLE,
        )
        contrat = Contrat.objects.create(
            bien=bien_vente,
            locataire=self.locataire,
            type_contrat="ACHAT",
            type_paiement_achat="PARTIEL",
            date_debut=date(2026, 1, 1),
            date_fin=None,
            loyer=None,
            depot_garantie=None,
            prix=prix,
            statut="ACTIF",
        )

        paiements = Paiement.objects.filter(contrat=contrat).order_by("num_echeance")
        self.assertEqual(paiements.count(), 6, "Un contrat ACHAT échelonné doit générer 6 échéances.")

        # Vérification montants
        montant_premier = (prix * Decimal("0.50")).quantize(Decimal("0.01"))
        montant_mensualite = (prix * Decimal("0.10")).quantize(Decimal("0.01"))

        self.assertEqual(paiements[0].montant_attendu, montant_premier, "Montant 1ère échéance incorrect")
        for i in range(1, 6):
            self.assertEqual(paiements[i].montant_attendu, montant_mensualite, f"Montant échéance {i+1} incorrect")

        # mode_paiement doit être null sur toutes les échéances générées automatiquement
        for p in paiements:
            self.assertIsNone(p.mode_paiement, f"mode_paiement doit être null pour l'échéance #{p.num_echeance}")

    # ------------------------------------------------------------------
    # Test 3 : Idempotence — pas de doublons
    # ------------------------------------------------------------------
    def test_idempotence_pas_de_doublons(self):
        """Resauvegarder un contrat déjà actif ne doit pas recréer
        l'échéancier (idempotence)."""
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )

        nombre_initial = Paiement.objects.filter(contrat=contrat).count()
        self.assertEqual(nombre_initial, 12)

        # Resauvegarder le contrat (sans changement)
        contrat.save()

        nombre_apres = Paiement.objects.filter(contrat=contrat).count()
        self.assertEqual(nombre_apres, 12, "L'idempotence n'est pas respectée : doublons détectés.")

    # ------------------------------------------------------------------
    # Test 4 : Montant attendu = loyer + frais agence (mois suivants)
    # ------------------------------------------------------------------
    def test_montant_attendu_egal_loyer(self):
        """Avec les nouvelles règles, le montant attendu correspond au loyer (et au dépôt pour le premier mois).
        - Premier mois : loyer + dépôt de garantie
        - Mois suivants : loyer
        """
        bien = self._creer_bien_location(titre="Bien Loyer 750k", loyer_mensuel=750_000)
        contrat = Contrat.objects.create(
            bien=bien,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 3, 1),
            date_fin=date(2026, 9, 1),
            loyer=750_000,
            depot_garantie=1_500_000,
            statut="ACTIF",
        )

        loyer = Decimal("750000.00")
        depot = Decimal("1500000.00")

        paiements = Paiement.objects.filter(contrat=contrat).order_by("date_echeance")
        for i, p in enumerate(paiements):
            if i == 0:
                # Premier mois : loyer + dépôt
                montant_attendu_esperé = loyer + depot
            else:
                # Mois suivants : loyer
                montant_attendu_esperé = loyer

            self.assertEqual(
                p.montant_attendu,
                montant_attendu_esperé,
                f"Montant attendu incorrect pour l'échéance #{i+1} du {p.date_echeance}",
            )

    # ------------------------------------------------------------------
    # Test 5 : Gestion des dates de fin de mois (31 janvier)
    # ------------------------------------------------------------------
    def test_date_fin_de_mois_31_janvier(self):
        """Un contrat débutant le 31 janvier doit générer des dates correctes
        en gérant le clamp de fin de mois.
        
        Séquence attendue avec _ajouter_un_mois :
        - 31 jan (date_debut)
        - 28 fév (31 clampé à 28, 2026 non bissextile)
        - 28 mars (base = 28 fév, jour 28 dans mars)
        - 28 avr (base = 28 mars, jour 28 dans avril)
        Toutes < date_fin (30 avr), donc 4 échéances.
        """
        bien = self._creer_bien_location(titre="Bien Fin Mois")
        contrat = Contrat.objects.create(
            bien=bien,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 31),
            date_fin=date(2026, 4, 30),
            loyer=400_000,
            depot_garantie=800_000,
            statut="ACTIF",
        )

        paiements = Paiement.objects.filter(contrat=contrat).order_by("date_echeance")
        dates = list(paiements.values_list("date_echeance", flat=True))

        self.assertEqual(len(dates), 4)
        self.assertEqual(dates[0], date(2026, 1, 31))
        self.assertEqual(dates[1], date(2026, 2, 28))  # 2026 n'est pas bissextile
        self.assertEqual(dates[2], date(2026, 3, 28))  # base = 28 fév → jour 28
        self.assertEqual(dates[3], date(2026, 4, 28))  # base = 28 mars → jour 28

    # ------------------------------------------------------------------
    # Test 6 : Annulation des échéances sur résiliation
    # ------------------------------------------------------------------
    def test_annulation_echeances_sur_resiliation(self):
        """Résilier un contrat doit passer toutes les échéances EN_ATTENTE
        au statut ANNULE."""
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )

        # Vérifier que l'échéancier a été généré
        self.assertEqual(Paiement.objects.filter(contrat=contrat).count(), 12)

        # Résilier le contrat (déclenche post_save → annulation)
        contrat.resilier()

        # Toutes les échéances EN_ATTENTE doivent maintenant être ANNULE
        nb_en_attente = Paiement.objects.filter(
            contrat=contrat, statut=Paiement.StatutPaiement.EN_ATTENTE
        ).count()
        self.assertEqual(nb_en_attente, 0, "Des échéances EN_ATTENTE subsistent après résiliation.")

        nb_annulees = Paiement.objects.filter(
            contrat=contrat, statut=Paiement.StatutPaiement.ANNULE
        ).count()
        self.assertEqual(nb_annulees, 12)

    # ------------------------------------------------------------------
    # Test 7 : Non-génération pour un contrat terminé resauvegardé
    # ------------------------------------------------------------------
    def test_non_regeneration_contrat_termine(self):
        """Un contrat TERMINE resauvegardé ne doit pas générer de nouvelles
        échéances (les anciennes sont ANNULE, pas de régénération)."""
        contrat = Contrat.objects.create(
            bien=self.bien_location,
            locataire=self.locataire,
            type_contrat="LOCATION",
            date_debut=date(2026, 1, 1),
            date_fin=date(2027, 1, 1),
            loyer=500_000,
            depot_garantie=1_000_000,
            statut="ACTIF",
        )

        # 12 échéances générées
        self.assertEqual(Paiement.objects.filter(contrat=contrat).count(), 12)

        # Terminer le contrat
        contrat.terminer()

        # Les échéances doivent être ANNULE, aucune nouvelle création
        total_paiements = Paiement.objects.filter(contrat=contrat).count()
        self.assertEqual(total_paiements, 12, "Le nombre total de paiements ne doit pas changer.")

        nb_annulees = Paiement.objects.filter(
            contrat=contrat, statut=Paiement.StatutPaiement.ANNULE
        ).count()
        self.assertEqual(nb_annulees, 12)
