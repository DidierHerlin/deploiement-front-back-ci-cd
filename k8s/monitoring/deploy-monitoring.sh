#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Déploiement de la stack de supervision (Prometheus, Loki, Grafana, RDS)..."

# 1. Vérification de kubectl / k3s
if command -v k3s &>/dev/null; then
    KUBECTL="k3s kubectl"
elif command -v kubectl &>/dev/null; then
    KUBECTL="kubectl"
else
    echo "Erreur : Ni k3s ni kubectl n'ont été trouvés."
    exit 1
fi

echo "[1/8] Application du namespace et des rôles RBAC..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/00-namespace.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/01-rbac.yaml"

echo "[2/8] Vérification du secret AWS RDS PostgreSQL..."
if ! sudo $KUBECTL get secret rds-postgres-exporter-secret -n monitoring &>/dev/null; then
    if sudo $KUBECTL get secret backend-secrets -n immobilier &>/dev/null; then
        echo "Création automatique du secret rds-postgres-exporter-secret depuis backend-secrets..."
        DB_HOST=$(sudo $KUBECTL get secret backend-secrets -n immobilier -o jsonpath="{.data.DB_HOST}" | base64 -d)
        DB_PORT=$(sudo $KUBECTL get secret backend-secrets -n immobilier -o jsonpath="{.data.DB_PORT}" | base64 -d 2>/dev/null || echo "5432")
        DB_NAME=$(sudo $KUBECTL get secret backend-secrets -n immobilier -o jsonpath="{.data.DB_NAME}" | base64 -d)
        DB_USER=$(sudo $KUBECTL get secret backend-secrets -n immobilier -o jsonpath="{.data.DB_USER}" | base64 -d)
        DB_PASS=$(sudo $KUBECTL get secret backend-secrets -n immobilier -o jsonpath="{.data.DB_PASSWORD}" | base64 -d)

        sudo $KUBECTL create secret generic rds-postgres-exporter-secret \
          -n monitoring \
          --from-literal=DATA_SOURCE_NAME="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" \
          --from-literal=DB_USER="${DB_USER}" \
          --from-literal=DB_PASSWORD="${DB_PASS}" \
          --from-literal=DB_HOST="${DB_HOST}" \
          --from-literal=DB_PORT="${DB_PORT}" \
          --from-literal=DB_NAME="${DB_NAME}" \
          --dry-run=client -o yaml | sudo $KUBECTL apply -f -
    else
        echo "Erreur : Secret introuvable. Veuillez configurer rds-postgres-exporter-secret."
        exit 1
    fi
fi

echo "[3/8] Application des alertes et de Prometheus..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/09-prometheus-rules.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/02-prometheus.yaml"

echo "[4/8] Application de Loki et Promtail..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/03-loki.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/04-promtail.yaml"

echo "[5/8] Application du collecteur PostgreSQL RDS..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/08-rds-postgres-exporter.yaml"

echo "[6/8] Configuration des sources et dashboards Grafana..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/05-grafana-datasources.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/06-grafana-dashboards.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/07-grafana.yaml"

echo "[7/8] Attente du démarrage complet des charges de travail..."
sudo $KUBECTL rollout status deployment/prometheus -n monitoring --timeout=120s
sudo $KUBECTL rollout status deployment/loki -n monitoring --timeout=120s
sudo $KUBECTL rollout status daemonset/promtail -n monitoring --timeout=120s
sudo $KUBECTL rollout status deployment/rds-postgres-exporter -n monitoring --timeout=120s
sudo $KUBECTL rollout status deployment/grafana -n monitoring --timeout=120s

echo "[8/8] Rechargement à chaud de la configuration Prometheus..."
sudo $KUBECTL exec -n monitoring deploy/prometheus -- wget -qO- --post-data='' http://localhost:9090/-/reload 2>/dev/null || true

PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")
echo "Déploiement terminé. Grafana accessible sur http://${PUBLIC_IP}:3001 (identifiant: admin / admin)"
