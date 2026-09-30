from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="django-insecure-cle-par-defaut-pour-le-dev")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework_simplejwt.token_blacklist",
    "rest_framework",
    "utilisateur",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "bien",
    "notifications",
    "contrats.apps.ContratsConfig",
    "paiement",
    "reservation",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "urls"
AUTH_USER_MODEL = "utilisateur.Utilisateur"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "wsgi.application"
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ["Content-Disposition"]


# ─── Configuration Base de données ───────────────────────────────────────────
# Priorité :
#   1. USE_SQLITE=true          → SQLite local (dev rapide, no postgres needed)
#   2. DATABASE_URL=postgresql://... → PostgreSQL via URL (Railway, RDS...)
#   3. DB_HOST défini           → PostgreSQL via variables séparées
#   4. Aucune config            → SQLite local (fallback)
# ─────────────────────────────────────────────────────────────────────────────

USE_SQLITE = config("USE_SQLITE", default=False, cast=bool)
DATABASE_URL = config("DATABASE_URL", default="")

if USE_SQLITE:
    # Mode SQLite explicite — utile pour dev local sans Docker
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

elif DATABASE_URL:
    # Mode PostgreSQL via URL complète (Railway, RDS, Docker Compose...)
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

elif config("DB_HOST", default=""):
    # Mode PostgreSQL via variables séparées (k8s, EC2, docker-compose)
    db_host = config("DB_HOST", default="localhost")
    # Si on tourne hors Docker et que l'hôte est host.docker.internal → localhost
    if db_host == "host.docker.internal" and not os.path.exists("/.dockerenv"):
        db_host = "localhost"
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="gesion_immobilier_back_end"),
            "USER": config("DB_USER", default="postgres"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": db_host,
            "PORT": config("DB_PORT", default="5432"),
        }
    }

else:
    # Fallback SQLite — aucune variable DB définie (dev local simple)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

import sys
if any(cmd in sys.argv for cmd in ("migrate", "runserver", "test", "shell")):
    db_engine = DATABASES["default"].get("ENGINE", "")
    db_name   = DATABASES["default"].get("NAME", "")
    db_host   = DATABASES["default"].get("HOST", "local")
    print(f"[DB] ENGINE : {db_engine}")
    print(f"[DB] HOST   : {db_host}")
    print(f"[DB] NAME   : {db_name}")

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "utilisateur.validators.ComplexPasswordValidator",
    },
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

PASSWORD_RESET_TIMEOUT = 60 * 60 * 24 * 3  # 3 jours

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}


SPECTACULAR_SETTINGS = {
    "TITLE": "API Gestion Immobilier",
    "DESCRIPTION": "Documentation de l'API REST  cahier des charges Master II",
    "VERSION": "1.0.0",
}


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("ACCESS_TOKEN_LIFETIME_MIN", 30))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("REFRESH_TOKEN_LIFETIME_DAYS", 7))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# â”€â”€â”€ CORS 

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000,http://16.16.115.111:3000,http://16.16.115.111:8000",
    cast=Csv(),
)
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000",
    cast=Csv(),
)


LANGUAGE_CODE = "fr-fr"
TIME_ZONE = config("TIME_ZONE", default="Indian/Antananarivo")
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"



DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default=EMAIL_HOST_USER)

TEST_RUNNER = "test_runner.CoverageRunner"

