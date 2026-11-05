FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Installation des utilitaires système minimaux et nettoyage du cache apt
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Couche isolée pour les dépendances Python avec cache pip BuildKit
# --only-binary :all: : seules les wheels pré-compilées sont installées,
# aucun script setup.py arbitraire ne peut s'exécuter (CWE-78 / SonarQube S6586 résolu)
# Versions verrouillées strictement (==) pour garantir la reproductibilité et la sécurité (SonarQube S6587 résolu)
COPY requirements.txt ./
RUN pip install --no-cache-dir --only-binary :all: \
    pip==25.0.1 \
    setuptools==79.0.1 \
    wheel==0.46.3 \
    jaraco.context==6.1.0
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --require-hashes --only-binary :all: -r requirements.txt

# Copie du code applicatif après les dépendances pour maximiser l'effet du cache Docker
COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "wsgi:application"]
