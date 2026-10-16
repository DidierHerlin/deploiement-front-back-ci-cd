import os
import socket
import sys
import time

def wait_for_database():
    host = os.environ.get("DB_HOST", "localhost").strip()
    port_str = os.environ.get("DB_PORT", "5432").strip()
    try:
        port = int(port_str)
    except ValueError:
        port = 5432

    # Mode local sans PostgreSQL distant
    if host in ("localhost", "127.0.0.1") and not os.environ.get("DB_PASSWORD"):
        print("[WAIT-DB] Environnement local / sqlite detecte, skip.")
        return

    print(f"[WAIT-DB] Verification de la connectivite DB : {host}:{port}...")
    max_attempts = 30
    for attempt in range(1, max_attempts + 1):
        try:
            ip = socket.gethostbyname(host)
            with socket.create_connection((ip, port), timeout=3):
                print(f"[WAIT-DB] Connexion reussie a {host} ({ip}):{port} (tentative {attempt}).")
                return
        except Exception as exc:
            print(f"[WAIT-DB] Tentative {attempt}/{max_attempts} en attente : {exc}. Nouvelle tentative dans 2s...")
            time.sleep(2)

    print(f"[WAIT-DB] ERREUR : Impossible de joindre la base {host}:{port} apres {max_attempts} tentatives.")
    sys.exit(1)

if __name__ == "__main__":
    wait_for_database()
