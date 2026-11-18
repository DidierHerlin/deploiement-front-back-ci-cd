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
