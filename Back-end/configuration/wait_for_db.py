import os
import socket
import sys
import time

def wait_for_database():
    host = os.environ.get("DB_HOST", "localhost").strip() or "localhost"

    # Si on s'exécute dans un conteneur Docker et que l'hôte indiqué est localhost/127.0.0.1,
    # la base PostgreSQL locale de l'hôte (pgAdmin 4) est accessible via host.docker.internal.
    # Inversement, hors Docker, host.docker.internal redevient localhost.
    if os.path.exists("/.dockerenv") and host in ("localhost", "127.0.0.1"):
        host = "host.docker.internal"
    elif not os.path.exists("/.dockerenv") and host == "host.docker.internal":
        host = "localhost"

    port_str = os.environ.get("DB_PORT", "5432").strip()
    try:
        port = int(port_str)
    except ValueError:
        port = 5432

    print(f"[WAIT-DB] Verification de la connectivite PostgreSQL : {host}:{port}...")
    max_attempts = 30
    for attempt in range(1, max_attempts + 1):
        try:
            ip = socket.gethostbyname(host)
            with socket.create_connection((ip, port), timeout=3):
                print(f"[WAIT-DB] Connexion reussie a PostgreSQL sur {host} ({ip}):{port} (tentative {attempt}).")
                return
        except Exception as exc:
            print(f"[WAIT-DB] Tentative {attempt}/{max_attempts} en attente ({host}:{port}) : {exc}. Nouvelle tentative dans 2s...")
            time.sleep(2)

    print(f"[WAIT-DB] ERREUR : Impossible de joindre la base PostgreSQL {host}:{port} apres {max_attempts} tentatives.")
    sys.exit(1)

if __name__ == "__main__":
    wait_for_database()
