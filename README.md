# Projet de Gestion Immobilière — Architecture Conteneurisée (Docker Compose, K3s, CI/CD)

Projet de gestion immobilière composé d'un **Frontend Next.js** et d'un **Backend Django REST Framework**, relié à une base de données **PostgreSQL externe** :
- **Sur AWS :** base de données gérée sur **Amazon RDS** (PostgreSQL).
- **En local :** instance **PostgreSQL installée sur l'hôte** (gérée via **pgAdmin 4**), ou exécutable hors conteneur applicatif.

---

## 1. Architecture Docker & Services

Le projet utilise un **fichier unique et centralisé [docker-compose.yml](file:///docker-compose.yml)** situé à la racine du dépôt pour orchestrer les conteneurs applicatifs.

### Services applicatifs principaux (démarrage standard)
- **`backend`** : Application Django REST Framework (Python 3.11).
  - Contexte de build : `./Back-end/configuration`
  - Dockerfile : `./Back-end/configuration/Dockerfile`
  - Port exposé : `8000:8000`
  - Connexion base de données : PostgreSQL externe (sur l'hôte via `host.docker.internal` en local ou AWS RDS selon `DB_HOST`).
  - Résolution hôte : `extra_hosts: host.docker.internal:host-gateway`.
  - Attente de disponibilité : Script `wait_for_db.py` vérifie que la base est joignable avant les migrations.
  - Healthcheck : Sonde HTTP native Python sur `/api/health/`.
  - Volumes : `./Back-end/configuration:/app` (live reload en dev) et `media_data:/app/media` (uploads).

- **`frontend`** : Application Next.js (Node.js 20 Alpine standalone).
  - Contexte de build : `./Front`
  - Dockerfile : `./Front/Dockerfile`
  - Build args : `NEXT_PUBLIC_API_URL`
  - Port exposé : `3000:3000`
  - Dépendance : Attend la disponibilité et l'état `healthy` de `backend`.
  - Réseau : Connecté au bridge `immobilier-net`.
  - Résolution d'API double-contexte :
    - Côté client (navigateur) : via `NEXT_PUBLIC_API_URL` (ex: `http://localhost:8000/api`).
    - Côté serveur (SSR / Route Handler) : via `INTERNAL_API_URL` (`http://backend:8000/api`).

### Services optionnels (sous profils)
- **`sonarqube`** (`--profile tools`) : Serveur SonarQube Community pour analyse statique locale du code.
- **`db`** (`--profile with-db`) : Conteneur PostgreSQL de secours, uniquement si aucune instance PostgreSQL locale n'est installée sur la machine hôte.

---

## 2. Commandes d'utilisation de Docker Compose

Toutes les commandes s'exécutent depuis la racine du projet :

### Lancement et validation
```bash
# Valider la syntaxe et la résolution des variables
docker compose config

# Construire les images Docker (frontend et backend)
docker compose build

# Démarrer les conteneurs applicatifs (backend + frontend)
docker compose up -d

# Vérifier l'état des conteneurs et leur santé
docker compose ps

# Consulter les journaux en temps réel
docker compose logs -f

# Arrêter les services
docker compose down
```

---

## 3. Configuration des environnements (.env)

Copier le fichier modèle [.env.example](file:///.env.example) vers `.env` à la racine :
```bash
cp .env.example .env
```

### Variables clés :
- **Mode PostgreSQL Local (sur machine hôte avec pgAdmin 4)** :
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=gestion-immobilier
  DB_USER=postgres
  DB_PASSWORD=
  ```
- **Mode PostgreSQL AWS RDS (Production / Staging)** :
  ```env
  DB_HOST=votre-endpoint-rds.eu-north-1.rds.amazonaws.com
  DB_PORT=5432
  DB_NAME=gestion_immobilier_back_end
  DB_USER=postgres
  DB_PASSWORD=votre_mot_de_passe_rds
  ```

---

## 4. Exécution 100% Locale sans Docker

Si vous travaillez directement sur votre machine sans Docker :
1. Démarrer PostgreSQL / pgAdmin 4 sur l'hôte.
2. Démarrer le backend Django :
   ```powershell
   cd Back-end/configuration
   python manage.py migrate
   python manage.py runserver
   ```
3. Démarrer le frontend Next.js :
   ```powershell
   cd Front
   npm run dev
   ```
