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
set +x
envsubst < /home/ubuntu/k8s/k3s-secret.yaml | sudo k3s kubectl apply -f -
set -x

# 4. Mise à jour de l'image et déploiement backend depuis le dossier k8s
echo "[INFO] Application du manifeste k8s backend..."
sed -i "s|image: .*/immobilier-drf:.*|image: $DOCKER_IMAGE|g" /home/ubuntu/k8s/backend.yaml
sudo k3s kubectl apply -f /home/ubuntu/k8s/backend.yaml

# 5. Attente du démarrage (timeout 3 min)
echo "[INFO] Attente du demarrage (timeout 3 min)..."
sudo k3s kubectl rollout status deployment/backend -n immobilier --timeout=180s \
  && echo "[OK] Backend deploye avec succes !" \
  || (echo "[ERROR] ERREUR deploiement backend !" && sudo k3s kubectl describe pod -n immobilier -l app=backend && sudo k3s kubectl logs -n immobilier -l app=backend --tail=100 && exit 1)

# 5b. Vérification de la transmission de BACKEND_PUBLIC_URL au conteneur (hors logs)
echo "[INFO] Verification de la variable BACKEND_PUBLIC_URL dans le conteneur..."
if sudo k3s kubectl exec -n immobilier deployment/backend -c backend -- sh -c '[ -n "$BACKEND_PUBLIC_URL" ]'; then
  echo "[OK] BACKEND_PUBLIC_URL est bien transmise et active dans le conteneur Django."
else
  echo "[WARN] BACKEND_PUBLIC_URL non detectee dans le conteneur Django."
fi

# 6. Auto-Scaling (HPA) conditionnel
if [ "$ENABLE_HPA" = "true" ]; then
  echo "[INFO] ENABLE_HPA=true detecte — Application du HPA..."
  sudo k3s kubectl apply -f /home/ubuntu/k8s/hpa.yaml
  echo "[OK] HPA backend applique avec succes !"
else
  echo "[INFO] ENABLE_HPA non defini — HPA ignore (mode economie de ressources)"
fi

# 7. Installation de cert-manager (si absent) et application Ingress / ClusterIssuer
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
