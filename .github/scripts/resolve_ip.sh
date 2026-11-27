#!/bin/bash
set -eo pipefail

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Vérification & Résolution de l'instance AWS EC2 pour le déploiement"
echo "═══════════════════════════════════════════════════════════════════════════"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TARGET_TAG_NAME="gestion-immobilier-devops"
PRIMARY_INSTANCE_ID="${AWS_INSTANCE_ID:-i-06299e2b1578249f2}"
AWS_REGION="${AWS_REGION:-eu-north-1}"
TARGET_IP="${PREV_IP:-$STATIC_IP}"
CREATED_BY_TERRAFORM=false

# Fonction pour écrire les outputs GitHub Actions de façon sûre et vérifiable
write_github_output() {
  local IP="$1"
  local ID="$2"
  if [ -z "$IP" ]; then
    echo "[ERROR] write_github_output : IP vide, impossible d'exporter l'output." >&2
    exit 1
  fi
  echo "[INFO] Export GitHub Output → ec2_ip=$IP  instance_id=$ID"
  if [ -n "$GITHUB_OUTPUT" ]; then
    echo "ec2_ip=$IP"      >> "$GITHUB_OUTPUT"
    echo "instance_id=$ID" >> "$GITHUB_OUTPUT"
  else
    # Fallback si GITHUB_OUTPUT n'est pas défini (exécution locale)
    echo "::set-output name=ec2_ip::$IP"
    echo "::set-output name=instance_id::$ID"
  fi
}

echo "[INFO] Région AWS ciblée : $AWS_REGION"
echo "[INFO] ID instance prioritaire : $PRIMARY_INSTANCE_ID"
echo "[INFO] Tag Name ciblé : $TARGET_TAG_NAME"

# -----------------------------------------------------------------------------
# Vérification des identifiants AWS
# -----------------------------------------------------------------------------
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  if [ -n "$TARGET_IP" ]; then
    echo "[WARN] Identifiants AWS non fournis. Utilisation de l'IP de secours : $TARGET_IP"
    write_github_output "$TARGET_IP" "unknown"
    exit 0
  else
    echo "[ERROR] Identifiants AWS (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) manquants." >&2
    echo "[ERROR] Configurez les secrets GitHub : AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY" >&2
    exit 1
  fi
fi

# Vérifie que aws CLI est disponible
if ! command -v aws &>/dev/null; then
  echo "[ERROR] aws CLI introuvable. Installation nécessaire." >&2
  exit 1
fi

FOUND_INSTANCE_ID=""
FOUND_INSTANCE_STATE=""

# -----------------------------------------------------------------------------
# 1. Recherche par ID prioritaire
# -----------------------------------------------------------------------------
if [ -n "$PRIMARY_INSTANCE_ID" ]; then
  echo "[INFO] 1/2 Recherche de l'instance par ID : $PRIMARY_INSTANCE_ID ..."
  set +e
  DESCRIBE_ID_OUT=$(aws ec2 describe-instances \
    --instance-ids "$PRIMARY_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --output json 2>&1)
  DESCRIBE_ID_STATUS=$?
  set -e

  if [ $DESCRIBE_ID_STATUS -eq 0 ]; then
    STATE=$(echo "$DESCRIBE_ID_OUT" | jq -r '.Reservations[0].Instances[0].State.Name // empty')
    if [ "$STATE" = "terminated" ] || [ "$STATE" = "shutting-down" ]; then
      echo "[WARN] Instance $PRIMARY_INSTANCE_ID trouvée mais à l'état '$STATE' (inutilisable)."
    elif [ -n "$STATE" ]; then
      echo "[OK] Instance trouvée par ID : $PRIMARY_INSTANCE_ID (État : $STATE)"
      FOUND_INSTANCE_ID="$PRIMARY_INSTANCE_ID"
      FOUND_INSTANCE_STATE="$STATE"
    fi
  else
    if echo "$DESCRIBE_ID_OUT" | grep -qE "InvalidInstanceID.NotFound|InvalidInstanceID.Malformed"; then
      echo "[INFO] L'ID $PRIMARY_INSTANCE_ID n'existe pas dans la région $AWS_REGION."
    else
      echo "[ERROR] Échec de la vérification AWS pour l'ID $PRIMARY_INSTANCE_ID :" >&2
      echo "$DESCRIBE_ID_OUT" >&2
      exit 1
    fi
  fi
fi

# -----------------------------------------------------------------------------
# 2. Recherche par Tag Name (si ID non trouvé / terminé)
# -----------------------------------------------------------------------------
if [ -z "$FOUND_INSTANCE_ID" ]; then
  echo "[INFO] 2/2 Recherche par tag Name='$TARGET_TAG_NAME' ..."
  set +e
  DESCRIBE_TAG_OUT=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters \
      "Name=tag:Name,Values=$TARGET_TAG_NAME" \
      "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --output json 2>&1)
  DESCRIBE_TAG_STATUS=$?
  set -e

  if [ $DESCRIBE_TAG_STATUS -ne 0 ]; then
    echo "[ERROR] Échec AWS lors de la recherche par tag Name='$TARGET_TAG_NAME' :" >&2
    echo "$DESCRIBE_TAG_OUT" >&2
    exit 1
  fi

  MATCHED_COUNT=$(echo "$DESCRIBE_TAG_OUT" | jq '[.Reservations[].Instances[]] | length')

  if [ "$MATCHED_COUNT" -gt 1 ]; then
    MATCHED_IDS=$(echo "$DESCRIBE_TAG_OUT" | jq -r '[.Reservations[].Instances[].InstanceId] | join(", ")')
    echo "[ERROR] Conflit : $MATCHED_COUNT instances correspondent au tag Name='$TARGET_TAG_NAME' : $MATCHED_IDS" >&2
    echo "[ERROR] Arrêt du workflow pour éviter toute opération ambiguë." >&2
    exit 1
  elif [ "$MATCHED_COUNT" -eq 1 ]; then
    FOUND_INSTANCE_ID=$(echo "$DESCRIBE_TAG_OUT" | jq -r '.Reservations[0].Instances[0].InstanceId')
    FOUND_INSTANCE_STATE=$(echo "$DESCRIBE_TAG_OUT" | jq -r '.Reservations[0].Instances[0].State.Name')
    echo "[OK] Instance trouvée par tag : $FOUND_INSTANCE_ID (État : $FOUND_INSTANCE_STATE)"
  else
    echo "[INFO] Aucune instance trouvée avec tag Name='$TARGET_TAG_NAME'."
  fi
fi

# -----------------------------------------------------------------------------
# 3. Instance existante : démarrage si nécessaire + récupération IP
# -----------------------------------------------------------------------------
PUBLIC_IP=""

if [ -n "$FOUND_INSTANCE_ID" ]; then
  echo "[INFO] Instance existante préservée : $FOUND_INSTANCE_ID"

  # Attente si en cours d'arrêt
  if [ "$FOUND_INSTANCE_STATE" = "stopping" ]; then
    echo "[INFO] Instance en cours d'arrêt (stopping). Attente de l'état 'stopped'..."
    aws ec2 wait instance-stopped \
      --instance-ids "$FOUND_INSTANCE_ID" \
      --region "$AWS_REGION"
    FOUND_INSTANCE_STATE="stopped"
  fi

  # Démarrage si arrêtée
  if [ "$FOUND_INSTANCE_STATE" = "stopped" ]; then
    echo "[INFO] Instance arrêtée. Démarrage en cours..."
    aws ec2 start-instances --instance-ids "$FOUND_INSTANCE_ID" --region "$AWS_REGION"
    echo "[INFO] Attente de l'état 'running'..."
    aws ec2 wait instance-running \
      --instance-ids "$FOUND_INSTANCE_ID" \
      --region "$AWS_REGION"
    echo "[OK] Instance $FOUND_INSTANCE_ID démarrée."
  elif [ "$FOUND_INSTANCE_STATE" = "pending" ]; then
    echo "[INFO] Instance en démarrage (pending). Attente..."
    aws ec2 wait instance-running \
      --instance-ids "$FOUND_INSTANCE_ID" \
      --region "$AWS_REGION"
  elif [ "$FOUND_INSTANCE_STATE" = "running" ]; then
    echo "[OK] Instance déjà active (running)."
  fi

  # Récupération de l'IP publique (jusqu'à 60 secondes)
  echo "[INFO] Récupération de l'adresse IP publique..."
  for i in $(seq 1 30); do
    PUBLIC_IP=$(aws ec2 describe-instances \
      --instance-ids "$FOUND_INSTANCE_ID" \
      --region "$AWS_REGION" \
      --query "Reservations[0].Instances[0].PublicIpAddress" \
      --output text 2>/dev/null || echo "")
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ] && [ "$PUBLIC_IP" != "null" ]; then
      echo "[OK] IP publique récupérée : $PUBLIC_IP"
      break
    fi
    echo "[INFO] Tentative $i/30 : IP non encore disponible, attente 2s..."
    sleep 2
  done

  if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ] || [ "$PUBLIC_IP" = "null" ]; then
    echo "[ERROR] Impossible de récupérer l'IP publique de $FOUND_INSTANCE_ID après 60s." >&2
    exit 1
  fi

# -----------------------------------------------------------------------------
# 4. Aucune instance → Création avec Terraform
# -----------------------------------------------------------------------------
else
  echo "[INFO] Aucune instance existante. Création avec Terraform..."

  if [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ]; then
    echo "[WARN] Pull Request : création d'infrastructure ignorée."
    write_github_output "${STATIC_IP:-127.0.0.1}" "pr-skipped"
    exit 0
  fi

  CREATED_BY_TERRAFORM=true

  # Vérification / création du bucket S3 pour l'état Terraform
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  TF_BUCKET="${AWS_TF_STATE_BUCKET:-gestion-immo-tfstate-${ACCOUNT_ID}-${AWS_REGION}}"

  echo "[INFO] Vérification du bucket S3 : $TF_BUCKET..."
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
    echo "[OK] Bucket S3 créé avec versioning activé."
  else
    echo "[OK] Bucket S3 déjà existant."
  fi

  # Terraform init + apply
  echo "[INFO] Initialisation Terraform avec backend S3..."
  cd "$REPO_ROOT/terraform"
  terraform init \
    -backend-config="bucket=$TF_BUCKET" \
    -backend-config="key=ec2/terraform.tfstate" \
    -backend-config="region=$AWS_REGION" \
    -reconfigure

  echo "[INFO] Création de l'instance EC2 (terraform apply)..."
  terraform apply -auto-approve \
    -var="aws_region=$AWS_REGION" \
    -var="key_pair_name=${AWS_KEY_NAME:-gestion-immobilier}"

  # Récupération des outputs Terraform (sans le wrapper hashicorp)
  PUBLIC_IP=$(terraform output -raw public_ip 2>/dev/null || echo "")
  FOUND_INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null || echo "")
  cd "$REPO_ROOT"

  if [ -z "$PUBLIC_IP" ] || [ -z "$FOUND_INSTANCE_ID" ]; then
    echo "[ERROR] Terraform apply réussi mais outputs manquants (public_ip ou instance_id)." >&2
    exit 1
  fi

  echo "[OK] Nouvelle instance créée : $FOUND_INSTANCE_ID → IP : $PUBLIC_IP"
fi

# -----------------------------------------------------------------------------
# 5. Vérification accessibilité SSH (port 22)
# -----------------------------------------------------------------------------
echo "[INFO] Attente de l'accessibilité SSH sur $PUBLIC_IP:22 (timeout 3 min)..."
PORT_OPEN=false
for i in $(seq 1 60); do
  if nc -z -w 3 "$PUBLIC_IP" 22 2>/dev/null; then
    PORT_OPEN=true
    echo "[OK] Port 22 ouvert sur $PUBLIC_IP !"
    break
  fi
  sleep 3
done

if [ "$PORT_OPEN" != "true" ]; then
  echo "[ERROR] Timeout : port 22 inaccessible sur $PUBLIC_IP après 3 minutes." >&2
  exit 1
fi

# Vérification connexion SSH réelle et configuration prérequis si nouvelle VM
if [ -n "$AWS_EC2_SSH_KEY" ]; then
  KEY_FILE=$(mktemp)
  echo "$AWS_EC2_SSH_KEY" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"

  echo "[INFO] Test de connexion SSH ubuntu@$PUBLIC_IP..."
  SSH_READY=false
  for i in $(seq 1 30); do
    if ssh -i "$KEY_FILE" \
         -o StrictHostKeyChecking=no \
         -o ConnectTimeout=5 \
         -o BatchMode=yes \
         ubuntu@"$PUBLIC_IP" 'echo READY' 2>/dev/null | grep -q 'READY'; then
      SSH_READY=true
      echo "[OK] Connexion SSH confirmée !"
      break
    fi
    sleep 3
  done

  if [ "$SSH_READY" != "true" ]; then
    echo "[WARN] SSH pas encore prêt après 90s, mais le port est ouvert. Le déploiement tentera quand même."
  fi

  if [ "$CREATED_BY_TERRAFORM" = "true" ]; then
    echo "[INFO] Nouvelle VM : configuration des prérequis..."
    ssh -i "$KEY_FILE" \
        -o StrictHostKeyChecking=no \
        -o ConnectTimeout=15 \
        ubuntu@"$PUBLIC_IP" \
        "cloud-init status --wait || true; sudo apt-get update -y && sudo apt-get install -y gettext-base jq curl netcat-openbsd; mkdir -p /home/ubuntu/k8s"
    echo "[OK] Prérequis configurés sur la nouvelle VM."
  fi

  rm -f "$KEY_FILE"
fi

# -----------------------------------------------------------------------------
# 6. Export final des outputs GitHub Actions
# -----------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  SUCCÈS : Instance=$FOUND_INSTANCE_ID | IP=$PUBLIC_IP"
echo "═══════════════════════════════════════════════════════════════════════════"

write_github_output "$PUBLIC_IP" "$FOUND_INSTANCE_ID"
