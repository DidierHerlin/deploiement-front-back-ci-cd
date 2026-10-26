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
    'TypeBien',
    'Transaction',
    'Status',
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



# Configuration de la base de donnees (PostgreSQL sur AWS RDS ou PostgreSQL local pgAdmin 4)
# Priorite : DATABASE_URL -> variables DB_* (PostgreSQL obligatoire, SQLite retire)

DATABASE_URL = config("DATABASE_URL", default="")

if DATABASE_URL:
    # Mode PostgreSQL via URL complete (Railway, RDS...)
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

else:
    # Mode PostgreSQL par defaut (k8s EC2 RDS, dev local pgAdmin 4 ou docker-compose)
    db_host = config("DB_HOST", default="localhost").strip()
    # Si on s'execute dans un conteneur Docker et que l'hote indique est localhost ou 127.0.0.1,
    # la base PostgreSQL locale de l'hote (pgAdmin 4) est accessible via host.docker.internal.
    # Inversement, hors Docker, host.docker.internal redevient localhost.
    if os.path.exists("/.dockerenv") and db_host in ("localhost", "127.0.0.1"):
        db_host = "host.docker.internal"
    elif not os.path.exists("/.dockerenv") and db_host == "host.docker.internal":
        db_host = "localhost"

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="gestion-immobilier"),
            "USER": config("DB_USER", default="postgres"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": db_host,
            "PORT": config("DB_PORT", default="5432"),
            "CONN_MAX_AGE": config("CONN_MAX_AGE", default=600, cast=int),
            "CONN_HEALTH_CHECKS": True,
        }
    }

import sys
if any(cmd in sys.argv for cmd in ("migrate", "runserver", "test", "shell", "createsuperuser")):
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

# Optimisation vitesse des tests unitaires (MD5 au lieu de BCrypt + synchronous_commit off)
if "test" in sys.argv:
    PASSWORD_HASHERS = [
        "django.contrib.auth.hashers.MD5PasswordHasher",
    ]
    DATABASES["default"].setdefault("OPTIONS", {})["options"] = "-c synchronous_commit=off" 

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
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/minute",
        "user": "1000/minute",
        "auth": "20/minute",
        "password_reset": "10/minute",
    },
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


CORS_ALLOW_ALL_ORIGINS = config("CORS_ALLOW_ALL_ORIGINS", default=False, cast=bool)
_raw_cors_origins = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000",
    cast=Csv(),
)
CORS_ALLOWED_ORIGINS = [origin.rstrip("/") for origin in _raw_cors_origins if origin]

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000,http://localhost:3001")

_raw_csrf_origins = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000",
    cast=Csv(),
)
CSRF_TRUSTED_ORIGINS = [origin.rstrip("/") for origin in _raw_csrf_origins if origin]

CORS_PREFLIGHT_MAX_AGE = config("CORS_PREFLIGHT_MAX_AGE", default=86400, cast=int)


LANGUAGE_CODE = "fr-fr"
TIME_ZONE = config("TIME_ZONE", default="Indian/Antananarivo")
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"
MEDIA_URL = "/media/"

MEDIA_ROOT_ENV = config("MEDIA_ROOT", default="")
if MEDIA_ROOT_ENV:
    MEDIA_ROOT = Path(MEDIA_ROOT_ENV)
elif Path("/app/media").exists() or (Path("/app").is_dir() and Path(__file__).resolve().parent == Path("/app")):
    MEDIA_ROOT = Path("/app/media")
else:
    MEDIA_ROOT = BASE_DIR / "media"

try:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    (MEDIA_ROOT / "biens").mkdir(parents=True, exist_ok=True)
except Exception:
    pass


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

