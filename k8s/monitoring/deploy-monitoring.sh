#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " 🚀 Déploiement de la Stack Monitoring K3s (Master 2)     "
echo "    Prometheus + Loki + Promtail + Grafana (Dashboards)   "
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

echo "[1/7] Application du Namespace 'monitoring'..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/00-namespace.yaml"

echo "[2/7] Application des rôles RBAC (Prometheus & Promtail)..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/01-rbac.yaml"

echo "[3/7] Déploiement de Prometheus..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/02-prometheus.yaml"

echo "[4/7] Déploiement de Loki..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/03-loki.yaml"

echo "[5/7] Déploiement de Promtail (DaemonSet)..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/04-promtail.yaml"

echo "[6/7] Configuration des Sources & Dashboards Grafana..."
sudo $KUBECTL apply -f "$SCRIPT_DIR/05-grafana-datasources.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/06-grafana-dashboards.yaml"
sudo $KUBECTL apply -f "$SCRIPT_DIR/07-grafana.yaml"

echo "[7/7] Attente du démarrage complet des composants (timeout 180s)..."
sudo $KUBECTL rollout status deployment/prometheus -n monitoring --timeout=180s
sudo $KUBECTL rollout status deployment/loki -n monitoring --timeout=180s
sudo $KUBECTL rollout status daemonset/promtail -n monitoring --timeout=180s
sudo $KUBECTL rollout status deployment/grafana -n monitoring --timeout=180s

# Désactiver l'ancien Promtail systemd s'il tournait sur l'hôte (pour éviter les doublons de collecte)
if systemctl is-active --quiet promtail 2>/dev/null; then
    echo "ℹ️ Désactivation de l'ancien service systemd promtail (remplacé par le DaemonSet K3s)..."
    sudo systemctl stop promtail || true
    sudo systemctl disable promtail || true
fi

PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "<IP-PUBLIQUE-VPS>")

echo ""
echo "=========================================================="
echo " ✅ STACK DE MONITORING DÉPLOYÉE AVEC SUCCÈS !            "
echo "=========================================================="
echo " 📊 Accès Grafana :"
echo "    URL : http://${PUBLIC_IP}:3001"
echo "    User : admin"
echo "    Pass : admin"
echo ""
echo " 📁 Dashboards préinstallés dans le dossier 'Projet DevOps M2' :"
echo "    1. Cluster K3s & Infrastructure - Vue Soutenance"
echo "    2. Application & Logs en Direct - Vue Soutenance"
echo "=========================================================="
