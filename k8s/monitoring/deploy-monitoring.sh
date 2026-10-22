#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " 🚀 Déploiement de la Stack Monitoring K3s & AWS RDS     "
echo "    Prometheus + Loki + Promtail + Grafana + RDS Exporter"
echo "=========================================================="

# 1. Vérification de kubectl / k3s
if command -v k3s &>/dev/null; then
    KUBECTL="k3s kubectl"
elif command -v kubectl &>/dev/null; then
    KUBECTL="kubectl"
else
    echo "❌ Erreur : Ni k3s ni kubectl n'ont été trouvés !"
    exit 1
fi

echo "[1/9] Application du Namespace 'monitoring'..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/00-namespace.yaml"

echo "[2/9] Application des rôles RBAC..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/01-rbac.yaml"

echo "[3/9] Vérification du Secret AWS RDS PostgreSQL..."
if ! sudo $KUBECTL get secret rds-postgres-exporter-secret -n monitoring &>/dev/null; then
    echo "⚠️ Le Secret 'rds-postgres-exporter-secret' n'existe pas encore dans le namespace 'monitoring'."
    if sudo $KUBECTL get secret backend-secrets -n immobilier &>/dev/null; then
        echo "ℹ️ Génération automatique du secret RDS depuis 'backend-secrets' (immobilier)..."
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
        echo "❌ Impossible de générer le secret. Veuillez appliquer '08-rds-postgres-secret.example.yaml' avec les bons identifiants."
        exit 1
    fi
fi

echo "[4/9] Application des règles d'alerte Prometheus..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/09-prometheus-rules.yaml"

echo "[5/9] Déploiement de Prometheus..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/02-prometheus.yaml"

echo "[6/9] Déploiement de Loki & Promtail..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/03-loki.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/04-promtail.yaml"

echo "[7/9] Déploiement de postgres-exporter pour AWS RDS..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/08-rds-postgres-exporter.yaml"

echo "[8/9] Configuration des Sources & Dashboards Grafana..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/05-grafana-datasources.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/06-grafana-dashboards.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/07-grafana.yaml"

echo "[9/9] Attente du démarrage complet des composants (timeout 180s)..."
sudo $KUBECTL rollout status deployment/prometheus -n monitoring --timeout=180s
sudo $KUBECTL rollout status deployment/loki -n monitoring --timeout=180s
sudo $KUBECTL rollout status daemonset/promtail -n monitoring --timeout=180s
sudo $KUBECTL rollout status deployment/rds-postgres-exporter -n monitoring --timeout=180s
sudo $KUBECTL rollout status deployment/grafana -n monitoring --timeout=180s

# Recharger Prometheus pour prendre en compte les règles sans redémarrage
sudo $KUBECTL exec -n monitoring deploy/prometheus -- wget -qO- --post-data='' http://localhost:9090/-/reload 2>/dev/null || true

PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "<IP-PUBLIQUE-VPS>")

echo ""
echo "=========================================================="
echo " ✅ STACK DE MONITORING DÉPLOYÉE ET OPÉRATIONNELLE !      "
echo "=========================================================="
echo " 📊 Accès Grafana :"
echo "    URL : http://${PUBLIC_IP}:3001"
echo "    User : admin"
echo "    Pass : admin"
echo ""
echo " 📁 Dashboards provisionnés dans 'Projet DevOps M2' :"
echo "    1. Cluster K3s & Infrastructure - Vue Soutenance"
echo "    2. Application & Logs en Direct - Vue Soutenance"
echo "    3. AWS RDS PostgreSQL Monitoring"
echo "=========================================================="
