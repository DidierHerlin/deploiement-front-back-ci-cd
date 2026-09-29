import sys

with open('Back-end/configuration/settings.py', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('DATABASE_URL = os.environ.get("DATABASE_URL")')
end_idx = content.find('import sys')

if start_idx != -1 and end_idx != -1:
    new_db_config = """# Configuration Base de données (AWS RDS ou Local)
if os.environ.get("DB_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME", "gestion-immobilier"),
            "USER": os.environ.get("DB_USER", "postgres"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }
else:
    # Fallback local : SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

"""
    
    content = content[:start_idx] + new_db_config + content[end_idx:]
    
    with open('Back-end/configuration/settings.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced DB config.")
else:
    print("Could not find the block to replace.")
