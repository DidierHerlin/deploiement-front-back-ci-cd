#!/bin/bash
set -ex

# 1. Installation automatique de k3s s'il n'est pas présent
if ! command -v k3s &> /dev/null; then
    echo "[INFO] Installation de K3s..."
    curl -sfL https://get.k3s.io | sh - 2>&1 | tail -5
    sleep 10
else
    echo "[OK] K3s deja installe : $(k3s --version)"
fi

# 2. Application du namespace
echo "[INFO] Application du namespace immobilier..."
sudo k3s kubectl apply -f /home/ubuntu/k8s/namespace.yaml

# 3. Mise à jour de l'image et déploiement frontend depuis le dossier k8s
echo "[INFO] Application du manifeste k8s frontend..."
sed -i "s|image: .*/login-page-immobilier:.*|image: $DOCKER_IMAGE|g" /home/ubuntu/k8s/frontend.yaml
sudo k3s kubectl apply -f /home/ubuntu/k8s/frontend.yaml

# 4. Attente du démarrage (timeout 3 min)
echo "[INFO] Attente du demarrage (timeout 3 min)..."
sudo k3s kubectl rollout status deployment/frontend -n immobilier --timeout=180s \
  && echo "[OK] Frontend deploye avec succes !" \
  || (echo "[ERROR] ERREUR deploiement frontend !" && sudo k3s kubectl describe pod -n immobilier -l app=frontend && sudo k3s kubectl logs -n immobilier -l app=frontend --tail=50 && exit 1)

# 5. Installation de cert-manager (si absent) et application Ingress / ClusterIssuer
if ! sudo k3s kubectl get crd clusterissuers.cert-manager.io &> /dev/null; then
  echo "[INFO] Installation de cert-manager pour HTTPS/ACME..."
  sudo k3s kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml
  echo "[INFO] Attente du deploiement de cert-manager..."
  sudo k3s kubectl rollout status deployment/cert-manager -n cert-manager --timeout=120s || true
  sudo k3s kubectl rollout status deployment/cert-manager-webhook -n cert-manager --timeout=120s || true
fi

if [ -f /home/ubuntu/k8s/cluster-issuer.yaml ]; then
  echo "[INFO] Application du ClusterIssuer Let's Encrypt..."
  for i in 1 2 3 4 5; do
    if sudo k3s kubectl apply -f /home/ubuntu/k8s/cluster-issuer.yaml; then
      break
    fi
    echo "[INFO] Webhook cert-manager pas encore prêt, nouvelle tentative dans 5s..."
    sleep 5
  done
fi

if [ -f /home/ubuntu/k8s/ingress.yaml ]; then
  echo "[INFO] Application de l'Ingress..."
  sudo k3s kubectl apply -f /home/ubuntu/k8s/ingress.yaml
fi
