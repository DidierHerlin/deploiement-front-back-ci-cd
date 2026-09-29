import sys

with open('Back-end/configuration/settings.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """elif os.environ.get("DB_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME", "gestion_immobilier"),
            "USER": os.environ.get("DB_USER", "postgres"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }
elif os.environ.get("PGHOST"):"""

content = content.replace('elif os.environ.get("PGHOST"):', replacement)

with open('Back-end/configuration/settings.py', 'w', encoding='utf-8') as f:
    f.write(content)
