#!/bin/bash
set -eo pipefail

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Terraform & AWS EC2 : Gestion du cycle de vie de l'infrastructure"
echo "═══════════════════════════════════════════════════════════════════════════"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PRIMARY_ID="${INPUT_INSTANCE_ID:-${AWS_INSTANCE_ID:-i-06299e2b1578249f2}}"
TARGET_NAME="${INPUT_TAG_NAME:-${AWS_TAG_NAME:-gestion-immobilier-devops}}"
AWS_REGION="${INPUT_AWS_REGION:-${AWS_REGION:-eu-north-1}}"
FALLBACK_IP="${STATIC_IP:-${PREV_IP:-}}"

echo "[INFO] Région AWS configurée : $AWS_REGION"
echo "[INFO] ID d'instance prioritaire : $PRIMARY_ID"
echo "[INFO] Tag Name recherché : $TARGET_NAME"

# Fonction d'écriture sécurisée des outputs GitHub Actions
write_outputs() {
  local ip="$1"
  local id="$2"
  local status="$3"
  echo "[INFO] Exportation des outputs -> ec2_ip=$ip | instance_id=$id | status=$status"
  if [ -n "$GITHUB_OUTPUT" ]; then
    echo "ec2_ip=$ip" >> "$GITHUB_OUTPUT"
    echo "instance_id=$id" >> "$GITHUB_OUTPUT"
    echo "instance_status=$status" >> "$GITHUB_OUTPUT"
  fi
}

# -----------------------------------------------------------------------------
# 0. Vérification des identifiants AWS
# -----------------------------------------------------------------------------
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  if [ -n "$FALLBACK_IP" ]; then
    echo "[WARN] Identifiants AWS non fournis, utilisation de l'IP de secours : $FALLBACK_IP"
    write_outputs "$FALLBACK_IP" "fallback" "fallback"
    exit 0
  else
    echo "[ERROR] Échec : Identifiants AWS (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) manquants." >&2
    exit 1
  fi
fi

FOUND_ID=""
FOUND_STATE=""

# -----------------------------------------------------------------------------
# 1. Étape 1 : Recherche de l'instance par son ID prioritaire
# -----------------------------------------------------------------------------
if [ -n "$PRIMARY_ID" ]; then
  echo "[INFO] 1/2 Recherche de l'instance par son ID : $PRIMARY_ID dans $AWS_REGION..."
  set +e
  DESC_ID_OUT=$(aws ec2 describe-instances \
    --instance-ids "$PRIMARY_ID" \
    --region "$AWS_REGION" \
    --output json 2>&1)
  DESC_ID_STATUS=$?
  set -e

  if [ $DESC_ID_STATUS -eq 0 ]; then
    STATE=$(echo "$DESC_ID_OUT" | jq -r '.Reservations[0].Instances[0].State.Name // empty')
    if [ "$STATE" = "terminated" ] || [ "$STATE" = "shutting-down" ]; then
      echo "[WARN] L'instance $PRIMARY_ID a été trouvée mais est à l'état '$STATE' (inutilisable)."
    elif [ -n "$STATE" ]; then
      echo "[OK] Instance trouvée par ID : $PRIMARY_ID (État actuel : $STATE)"
      FOUND_ID="$PRIMARY_ID"
      FOUND_STATE="$STATE"
    fi
  else
    if echo "$DESC_ID_OUT" | grep -qE "InvalidInstanceID.NotFound|InvalidInstanceID.Malformed"; then
      echo "[INFO] L'ID $PRIMARY_ID n'existe pas ou n'est plus accessible dans $AWS_REGION."
    else
      echo "[ERROR] Échec critique de la vérification AWS pour l'ID $PRIMARY_ID :" >&2
      echo "$DESC_ID_OUT" >&2
      exit 1
    fi
  fi
fi

# -----------------------------------------------------------------------------
# 2. Étape 2 : Recherche par Tag Name (si l'ID est absent ou inutilisable)
# -----------------------------------------------------------------------------
if [ -z "$FOUND_ID" ]; then
  echo "[INFO] 2/2 Recherche par tag Name='$TARGET_NAME' (instances actives/existantes)..."
  set +e
  SEARCH_TAG_OUT=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=$TARGET_NAME" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --output json 2>&1)
  SEARCH_TAG_STATUS=$?
  set -e

  if [ $SEARCH_TAG_STATUS -ne 0 ]; then
    echo "[ERROR] Échec de la vérification AWS lors de la recherche par tag Name='$TARGET_NAME' :" >&2
    echo "$SEARCH_TAG_OUT" >&2
    exit 1
  fi

  MATCHED_COUNT=$(echo "$SEARCH_TAG_OUT" | jq '[.Reservations[].Instances[]] | length')

  if [ "$MATCHED_COUNT" -gt 1 ]; then
    MATCHED_IDS=$(echo "$SEARCH_TAG_OUT" | jq -r '[.Reservations[].Instances[].InstanceId] | join(", ")')
    echo "[ERROR] Conflit détecté : $MATCHED_COUNT instances correspondent au nom '$TARGET_NAME' : $MATCHED_IDS." >&2
    echo "[ERROR] Arrêt du workflow par mesure de sécurité pour empêcher toute opération ambiguë." >&2
    exit 1
  elif [ "$MATCHED_COUNT" -eq 1 ]; then
    FOUND_ID=$(echo "$SEARCH_TAG_OUT" | jq -r '.Reservations[0].Instances[0].InstanceId')
    FOUND_STATE=$(echo "$SEARCH_TAG_OUT" | jq -r '.Reservations[0].Instances[0].State.Name')
    echo "[OK] Instance trouvée par tag Name='$TARGET_NAME' : $FOUND_ID (État actuel : $FOUND_STATE)"
  else
    echo "[INFO] Aucune instance correspondante trouvée avec le tag Name='$TARGET_NAME'."
  fi
fi

# -----------------------------------------------------------------------------
# 3. Traitement selon les 3 cas principaux
# -----------------------------------------------------------------------------
PUBLIC_IP=""
ACTION_STATUS=""

if [ -n "$FOUND_ID" ]; then
  echo "[INFO] Préservation de l'instance existante $FOUND_ID et de ses données (aucun terraform apply)."

  # Si l'instance est en cours d'arrêt, attendre qu'elle soit arrêtée
  if [ "$FOUND_STATE" = "stopping" ]; then
    echo "[INFO] L'instance est en cours d'arrêt (stopping). Attente de l'état 'stopped'..."
    aws ec2 wait instance-stopped --instance-ids "$FOUND_ID" --region "$AWS_REGION"
    FOUND_STATE="stopped"
  fi

  # CAS 2 : L'instance est arrêtée -> Démarrage
  if [ "$FOUND_STATE" = "stopped" ]; then
    echo "[INFO] Cas 2 détecté : L'instance $FOUND_ID est arrêtée. Démarrage en cours..."
    aws ec2 start-instances --instance-ids "$FOUND_ID" --region "$AWS_REGION"
    echo "[INFO] Attente du passage à l'état 'running'..."
    aws ec2 wait instance-running --instance-ids "$FOUND_ID" --region "$AWS_REGION"
    echo "[OK] Instance $FOUND_ID démarrée avec succès."
    ACTION_STATUS="started"
  elif [ "$FOUND_STATE" = "pending" ]; then
    echo "[INFO] L'instance est déjà en cours de démarrage (pending). Attente de l'état 'running'..."
    aws ec2 wait instance-running --instance-ids "$FOUND_ID" --region "$AWS_REGION"
    ACTION_STATUS="started"
  elif [ "$FOUND_STATE" = "running" ]; then
    # CAS 1 : L'instance est active
    echo "[OK] Cas 1 détecté : L'instance $FOUND_ID est déjà active (running)."
    ACTION_STATUS="running"
  fi

  # Récupération de l'adresse IP publique de l'instance
  echo "[INFO] Récupération de l'adresse IP publique..."
  for i in $(seq 1 30); do
    PUBLIC_IP=$(aws ec2 describe-instances \
      --instance-ids "$FOUND_ID" \
      --region "$AWS_REGION" \
      --query "Reservations[0].Instances[0].PublicIpAddress" \
      --output text 2>/dev/null || echo "")
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ] && [ "$PUBLIC_IP" != "null" ]; then
      break
    fi
    sleep 2
  done

  if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ] || [ "$PUBLIC_IP" = "null" ]; then
    echo "[ERROR] Impossible de récupérer l'adresse IP publique de l'instance $FOUND_ID." >&2
    exit 1
  fi

else
  # CAS 3 : Aucune instance correspondante n'existe -> Création via Terraform
  echo "[INFO] Cas 3 détecté : Aucune instance existante trouvée. Création avec Terraform..."

  if [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ]; then
    echo "[WARN] Exécution sur Pull Request : la création d'infrastructure est ignorée sur les PRs."
    write_outputs "${FALLBACK_IP:-127.0.0.1}" "pr-skipped" "skipped"
    exit 0
  fi

  ACTION_STATUS="created_by_terraform"

  # Installation de Terraform si absent
  if ! command -v terraform &>/dev/null; then
    echo "[INFO] Installation de Terraform..."
    sudo apt-get update -y && sudo apt-get install -y gnupg software-properties-common curl jq
    curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg --yes
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
    sudo apt-get update -y && sudo apt-get install -y terraform
  fi

  # Configuration du bucket S3 pour l'état distant
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  TF_BUCKET="${AWS_TF_STATE_BUCKET:-gestion-immo-tfstate-${ACCOUNT_ID}-${AWS_REGION}}"

  echo "[INFO] Vérification du bucket S3 distant pour le state : $TF_BUCKET..."
  if ! aws s3api head-bucket --bucket "$TF_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
    echo "[INFO] Création du bucket S3 '$TF_BUCKET' avec versioning..."
    if [ "$AWS_REGION" = "us-east-1" ]; then
      aws s3api create-bucket --bucket "$TF_BUCKET" --region "$AWS_REGION"
    else
      aws s3api create-bucket --bucket "$TF_BUCKET" --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi
    aws s3api put-bucket-versioning --bucket "$TF_BUCKET" \
      --versioning-configuration Status=Enabled
    echo "[OK] Bucket S3 configuré avec succès."
  else
    echo "[OK] Bucket S3 existant vérifié."
  fi

  # Initialisation et application Terraform
  cd "$REPO_ROOT/terraform"
  echo "[INFO] Initialisation de Terraform avec backend S3..."
  terraform init \
    -backend-config="bucket=$TF_BUCKET" \
    -backend-config="key=ec2/terraform.tfstate" \
    -backend-config="region=$AWS_REGION" \
    -reconfigure

  echo "[INFO] Application Terraform (création de l'infrastructure requise)..."
  terraform apply -auto-approve \
    -var="aws_region=$AWS_REGION" \
    -var="key_pair_name=gestion-immobilier"

  PUBLIC_IP=$(terraform output -raw public_ip 2>/dev/null || echo "")
  FOUND_ID=$(terraform output -raw instance_id 2>/dev/null || echo "")
  cd "$REPO_ROOT"

  if [ -z "$PUBLIC_IP" ] || [ -z "$FOUND_ID" ]; then
    echo "[ERROR] Échec : impossible d'extraire les sorties Terraform (public_ip / instance_id)." >&2
    exit 1
  fi

  echo "[OK] Nouvelle instance créée par Terraform : $FOUND_ID (IP: $PUBLIC_IP)"
fi

# -----------------------------------------------------------------------------
# 4. Attente de l'accessibilité réseau SSH (Port 22)
# -----------------------------------------------------------------------------
echo "[INFO] Attente de la disponibilité réseau SSH (port 22) sur $PUBLIC_IP..."
PORT_OPEN=false
for i in $(seq 1 60); do
  if nc -z -w 3 "$PUBLIC_IP" 22 2>/dev/null; then
    PORT_OPEN=true
    echo "[OK] Port SSH (22) ouvert et accessible sur $PUBLIC_IP !"
    break
  fi
  sleep 3
done

if [ "$PORT_OPEN" != "true" ]; then
  echo "[ERROR] Timeout : le port SSH (22) n'est pas joignable sur $PUBLIC_IP après 3 minutes." >&2
  exit 1
fi

# -----------------------------------------------------------------------------
# 5. Préparation des prérequis du serveur (si nouvelle machine créée)
# -----------------------------------------------------------------------------
if [ -n "$AWS_EC2_SSH_KEY" ]; then
  KEY_FILE=$(mktemp)
  echo "$AWS_EC2_SSH_KEY" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"

  echo "[INFO] Vérification de la connexion SSH sur ubuntu@$PUBLIC_IP..."
  SSH_READY=false
  for i in $(seq 1 30); do
    if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes ubuntu@"$PUBLIC_IP" 'echo READY' 2>/dev/null | grep -q 'READY'; then
      SSH_READY=true
      echo "[OK] Session SSH authentifiée et opérationnelle !"
      break
    fi
    sleep 3
  done

  if [ "$ACTION_STATUS" = "created_by_terraform" ]; then
    echo "[INFO] Préparation des prérequis de déploiement sur la nouvelle VM..."
    ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=15 ubuntu@"$PUBLIC_IP" \
      "cloud-init status --wait || true; sudo apt-get update -y && sudo apt-get install -y gettext-base jq curl; mkdir -p /home/ubuntu/k8s"
    echo "[OK] Prérequis de déploiement configurés avec succès (dossier k8s prêt, apt locks libérés)."
  fi

  rm -f "$KEY_FILE"
fi

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Opération réussie : IP = $PUBLIC_IP | ID = $FOUND_ID ($ACTION_STATUS)"
echo "═══════════════════════════════════════════════════════════════════════════"

write_outputs "$PUBLIC_IP" "$FOUND_ID" "$ACTION_STATUS"
