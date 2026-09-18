import os
import sys
from pathlib import Path


def main():
    if 'test' in sys.argv:
        import coverage
        cov = coverage.Coverage(
            source=['.'],
            omit=[
                '*/migrations/*', 'manage.py', '*/tests.py', '*/test_*.py',
                'configuration/*', '*/apps.py', '*/admin.py', '*/venv/*', '*/.venv/*',
                'utilisateur/serializers.py', 'utilisateur/views.py',
            ]
        )
        cov.start()
        
        sys._called_cov = cov

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
