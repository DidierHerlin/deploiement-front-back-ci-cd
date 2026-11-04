# ─────────────────────────────────────────────────────────────────────────────
# BASE IMAGE : python:3.11-slim-bookworm
# "bookworm" = Debian 12 (version stable la plus récente)
# Préféré à "slim" sans suffixe car le tag bookworm est plus fréquemment
# rebasé par Docker avec les patches de sécurité Debian.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ─────────────────────────────────────────────────────────────────────────────
# CORRECTIF 1 — Vulnérabilités OS (CVE niveau OS / Debian)
# apt-get upgrade -y : applique TOUS les patches de sécurité Debian disponibles
# au moment du build (libssl, libexpat, curl, zlib, glibc, etc.)
# ─────────────────────────────────────────────────────────────────────────────
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ─────────────────────────────────────────────────────────────────────────────
# CORRECTIF 2 — Vulnérabilités Python (setuptools, pip, wheel)
# setuptools < 70.x a plusieurs CVE HIGH/CRITICAL connues
# pip lui-même peut avoir des CVE sur d'anciennes versions
# ─────────────────────────────────────────────────────────────────────────────
RUN pip install --no-cache-dir --upgrade \
    pip \
    setuptools \
    wheel

# ─────────────────────────────────────────────────────────────────────────────
# CORRECTIF 3 — Dépendances applicatives isolées (cache BuildKit)
# --no-cache-dir évite de stocker le cache pip dans l'image finale
# ─────────────────────────────────────────────────────────────────────────────
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt gunicorn

# ─────────────────────────────────────────────────────────────────────────────
# CORRECTIF 4 — Principe du moindre privilège
# Exécuter l'application avec un utilisateur non-root (pas root)
# réduit la surface d'attaque en cas de faille d'exécution de code
# ─────────────────────────────────────────────────────────────────────────────
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup --no-create-home appuser

# Copie du code applicatif après les dépendances (cache Docker optimal)
COPY . .

# Droits sur les fichiers pour l'utilisateur non-root
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "wsgi:application"]
