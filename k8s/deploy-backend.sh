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

# 3. Application des secrets Kubernetes depuis le manifeste k3s-secret.yaml
echo "[INFO] Application des secrets Kubernetes..."
which envsubst &>/dev/null || (sudo apt-get update -y && sudo apt-get install -y gettext-base)
envsubst < /home/ubuntu/k8s/k3s-secret.yaml | sudo k3s kubectl apply -f -

# 4. Mise à jour de l'image et déploiement backend depuis le dossier k8s
echo "[INFO] Application du manifeste k8s backend..."
sed -i "s|image: .*/immobilier-drf:.*|image: $DOCKER_IMAGE|g" /home/ubuntu/k8s/backend.yaml
sudo k3s kubectl apply -f /home/ubuntu/k8s/backend.yaml

# 5. Attente du démarrage (timeout 3 min)
echo "[INFO] Attente du demarrage (timeout 3 min)..."
sudo k3s kubectl rollout status deployment/backend -n immobilier --timeout=180s \
  && echo "[OK] Backend deploye avec succes !" \
  || (echo "[ERROR] ERREUR deploiement backend !" && sudo k3s kubectl describe pod -n immobilier -l app=backend && sudo k3s kubectl logs -n immobilier -l app=backend --tail=100 && exit 1)

# 6. Auto-Scaling (HPA) conditionnel
if [ "$ENABLE_HPA" = "true" ]; then
  echo "[INFO] ENABLE_HPA=true detecte — Application du HPA..."
  sudo k3s kubectl apply -f /home/ubuntu/k8s/hpa.yaml
  echo "[OK] HPA backend applique avec succes !"
else
  echo "[INFO] ENABLE_HPA non defini — HPA ignore (mode economie de ressources)"
fi
