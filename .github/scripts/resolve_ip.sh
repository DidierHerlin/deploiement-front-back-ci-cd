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

echo "[INFO] Région AWS ciblée : $AWS_REGION"
echo "[INFO] ID instance prioritaire : $PRIMARY_INSTANCE_ID"
echo "[INFO] Tag Name ciblé : $TARGET_TAG_NAME"

# Vérification des identifiants AWS
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  if [ -n "$TARGET_IP" ]; then
    echo "[WARN] Identifiants AWS non fournis. Utilisation de l'IP de secours : $TARGET_IP"
    if [ -n "$GITHUB_OUTPUT" ]; then
      echo "ec2_ip=$TARGET_IP" >> "$GITHUB_OUTPUT"
    fi
    exit 0
  else
    echo "[ERROR] Échec : Identifiants AWS (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) manquants." >&2
    exit 1
  fi
fi

FOUND_INSTANCE_ID=""
FOUND_INSTANCE_STATE=""

# -----------------------------------------------------------------------------
# 1. Recherche par ID (ID prioritaire)
# -----------------------------------------------------------------------------
if [ -n "$PRIMARY_INSTANCE_ID" ]; then
  echo "[INFO] 1/2 Recherche de l'instance par son ID ($PRIMARY_INSTANCE_ID)..."
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
      echo "[WARN] L'instance $PRIMARY_INSTANCE_ID existe mais est à l'état '$STATE' (inutilisable)."
    elif [ -n "$STATE" ]; then
      echo "[OK] Instance trouvée par ID : $PRIMARY_INSTANCE_ID (État : $STATE)"
      FOUND_INSTANCE_ID="$PRIMARY_INSTANCE_ID"
      FOUND_INSTANCE_STATE="$STATE"
    fi
  else
    if echo "$DESCRIBE_ID_OUT" | grep -qE "InvalidInstanceID.NotFound|InvalidInstanceID.Malformed"; then
      echo "[INFO] L'ID $PRIMARY_INSTANCE_ID n'existe pas ou plus dans la région $AWS_REGION."
    else
      echo "[ERROR] Échec de la vérification AWS pour l'ID $PRIMARY_INSTANCE_ID :" >&2
      echo "$DESCRIBE_ID_OUT" >&2
      exit 1
    fi
  fi
fi

# -----------------------------------------------------------------------------
# 2. Recherche par Tag Name (si ID non trouvé ou inutilisable)
# -----------------------------------------------------------------------------
if [ -z "$FOUND_INSTANCE_ID" ]; then
  echo "[INFO] 2/2 Recherche par tag Name='$TARGET_TAG_NAME' (instances non terminées)..."
  set +e
  DESCRIBE_TAG_OUT=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=$TARGET_TAG_NAME" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --output json 2>&1)
  DESCRIBE_TAG_STATUS=$?
  set -e

  if [ $DESCRIBE_TAG_STATUS -ne 0 ]; then
    echo "[ERROR] Échec de la vérification AWS lors de la recherche par tag Name='$TARGET_TAG_NAME' :" >&2
    echo "$DESCRIBE_TAG_OUT" >&2
    exit 1
  fi

  MATCHED_COUNT=$(echo "$DESCRIBE_TAG_OUT" | jq '[.Reservations[].Instances[]] | length')

  if [ "$MATCHED_COUNT" -gt 1 ]; then
    MATCHED_IDS=$(echo "$DESCRIBE_TAG_OUT" | jq -r '[.Reservations[].Instances[].InstanceId] | join(", ")')
    echo "[ERROR] Conflit détecté : $MATCHED_COUNT instances correspondent au tag Name='$TARGET_TAG_NAME' : $MATCHED_IDS." >&2
    echo "[ERROR] Arrêt du workflow par sécurité pour empêcher toute opération ambiguë." >&2
    exit 1
  elif [ "$MATCHED_COUNT" -eq 1 ]; then
    FOUND_INSTANCE_ID=$(echo "$DESCRIBE_TAG_OUT" | jq -r '.Reservations[0].Instances[0].InstanceId')
    FOUND_INSTANCE_STATE=$(echo "$DESCRIBE_TAG_OUT" | jq -r '.Reservations[0].Instances[0].State.Name')
    echo "[OK] Instance trouvée par tag Name='$TARGET_TAG_NAME' : $FOUND_INSTANCE_ID (État : $FOUND_INSTANCE_STATE)"
  else
    echo "[INFO] Aucune instance correspondante trouvée avec le tag Name='$TARGET_TAG_NAME'."
  fi
fi

# -----------------------------------------------------------------------------
# 3. Traitement selon l'état ou Création Terraform
# -----------------------------------------------------------------------------
if [ -n "$FOUND_INSTANCE_ID" ]; then
  # L'instance existe
  echo "[INFO] Préservation de l'instance existante $FOUND_INSTANCE_ID et de ses données."

  if [ "$FOUND_INSTANCE_STATE" = "stopping" ]; then
    echo "[INFO] L'instance est en cours d'arrêt (stopping). Attente de l'état 'stopped'..."
    aws ec2 wait instance-stopped --instance-ids "$FOUND_INSTANCE_ID" --region "$AWS_REGION"
    FOUND_INSTANCE_STATE="stopped"
  fi

  if [ "$FOUND_INSTANCE_STATE" = "stopped" ]; then
    echo "[INFO] L'instance est arrêtée. Démarrage de l'instance $FOUND_INSTANCE_ID..."
    aws ec2 start-instances --instance-ids "$FOUND_INSTANCE_ID" --region "$AWS_REGION"
    echo "[INFO] Attente du passage à l'état 'running'..."
    aws ec2 wait instance-running --instance-ids "$FOUND_INSTANCE_ID" --region "$AWS_REGION"
    echo "[OK] Instance $FOUND_INSTANCE_ID démarrée avec succès."
  elif [ "$FOUND_INSTANCE_STATE" = "pending" ]; then
    echo "[INFO] L'instance démarre déjà (pending). Attente de l'état 'running'..."
    aws ec2 wait instance-running --instance-ids "$FOUND_INSTANCE_ID" --region "$AWS_REGION"
  elif [ "$FOUND_INSTANCE_STATE" = "running" ]; then
    echo "[OK] L'instance $FOUND_INSTANCE_ID est déjà active (running)."
  fi

  # Récupération de l'IP publique
  echo "[INFO] Récupération de l'adresse IP publique de l'instance..."
  PUBLIC_IP=""
  for i in $(seq 1 30); do
    PUBLIC_IP=$(aws ec2 describe-instances \
      --instance-ids "$FOUND_INSTANCE_ID" \
      --region "$AWS_REGION" \
      --query "Reservations[0].Instances[0].PublicIpAddress" \
      --output text 2>/dev/null || echo "")
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
      break
    fi
    sleep 2
  done

  if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
    echo "[ERROR] Impossible de récupérer l'adresse IP publique de l'instance $FOUND_INSTANCE_ID." >&2
    exit 1
  fi

else
  # Aucune instance n'existe -> Création requise via Terraform
  echo "[INFO] Aucune instance existante trouvée. Création requise avec Terraform."

  if [ "$GITHUB_EVENT_NAME" = "pull_request" ]; then
    echo "[WARN] Exécution sur Pull Request : la création d'infrastructure est ignorée sur les PRs."
    PUBLIC_IP="${STATIC_IP:-127.0.0.1}"
  else
    CREATED_BY_TERRAFORM=true

    # Installation de Terraform si non présent
    if ! command -v terraform &>/dev/null; then
      echo "[INFO] Installation de Terraform..."
      sudo apt-get update -y && sudo apt-get install -y gnupg software-properties-common curl jq
      curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg --yes
      echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
      sudo apt-get update -y && sudo apt-get install -y terraform
    fi

    # Conservation du state Terraform via bucket S3 dédié
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    TF_BUCKET="${AWS_TF_STATE_BUCKET:-gestion-immo-tfstate-${ACCOUNT_ID}-${AWS_REGION}}"

    echo "[INFO] Vérification du bucket S3 pour le state Terraform : $TF_BUCKET..."
    if ! aws s3api head-bucket --bucket "$TF_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
      echo "[INFO] Création du bucket S3 '$TF_BUCKET' pour conserver l'état Terraform..."
      if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$TF_BUCKET" --region "$AWS_REGION"
      else
        aws s3api create-bucket --bucket "$TF_BUCKET" --region "$AWS_REGION" \
          --create-bucket-configuration LocationConstraint="$AWS_REGION"
      fi
      aws s3api put-bucket-versioning --bucket "$TF_BUCKET" \
        --versioning-configuration Status=Enabled
      echo "[OK] Bucket S3 configuré avec versioning."
    fi

    # Initialisation et application Terraform
    echo "[INFO] Initialisation de Terraform avec backend S3 distant..."
    cd "$REPO_ROOT/terraform"
    terraform init \
      -backend-config="bucket=$TF_BUCKET" \
      -backend-config="key=ec2/terraform.tfstate" \
      -backend-config="region=$AWS_REGION" \
      -reconfigure

    echo "[INFO] Création de l'instance avec le tag Name='$TARGET_TAG_NAME'..."
    terraform apply -auto-approve \
      -var="aws_region=$AWS_REGION" \
      -var="key_pair_name=${AWS_KEY_NAME:-gestion-immobilier}"

    PUBLIC_IP=$(terraform output -raw public_ip)
    FOUND_INSTANCE_ID=$(terraform output -raw instance_id)
    cd "$REPO_ROOT"

    echo "[OK] Nouvelle instance créée par Terraform : $FOUND_INSTANCE_ID (IP: $PUBLIC_IP)"
  fi
fi

# -----------------------------------------------------------------------------
# 4. Vérification de l'accessibilité SSH & Configuration des prérequis
# -----------------------------------------------------------------------------
echo "[INFO] Attente de la disponibilité réseau (port 22) sur $PUBLIC_IP..."
PORT_OPEN=false
for i in $(seq 1 60); do
  if nc -z -w 3 "$PUBLIC_IP" 22 2>/dev/null; then
    PORT_OPEN=true
    echo "[OK] Port SSH 22 ouvert sur $PUBLIC_IP !"
    break
  fi
  sleep 3
done

if [ "$PORT_OPEN" != "true" ]; then
  echo "[ERROR] Timeout : le port 22 n'est pas joignable sur $PUBLIC_IP après 3 minutes." >&2
  exit 1
fi

# Si la clé SSH est disponible, vérifier la session SSH et configurer les prérequis si nouvelle machine
if [ -n "$AWS_EC2_SSH_KEY" ]; then
  KEY_FILE=$(mktemp)
  echo "$AWS_EC2_SSH_KEY" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"

  echo "[INFO] Test de connexion SSH sur ubuntu@$PUBLIC_IP..."
  SSH_READY=false
  for i in $(seq 1 30); do
    if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes ubuntu@"$PUBLIC_IP" 'echo READY' 2>/dev/null | grep -q 'READY'; then
      SSH_READY=true
      echo "[OK] Connexion SSH confirmée et opérationnelle !"
      break
    fi
    sleep 3
  done

  if [ "$SSH_READY" != "true" ]; then
    echo "[WARN] La négociation SSH a pris plus de temps que prévu, le port reste néanmoins ouvert."
  fi

  if [ "$CREATED_BY_TERRAFORM" = "true" ]; then
    echo "[INFO] Configuration des prérequis de déploiement sur la nouvelle machine..."
    ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@"$PUBLIC_IP" \
      "cloud-init status --wait || true; sudo apt-get update -y && sudo apt-get install -y gettext-base jq curl; mkdir -p /home/ubuntu/k8s"
    echo "[OK] Prérequis configurés avec succès (dossier k8s créé, cloud-init libéré)."
  fi

  rm -f "$KEY_FILE"
fi

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Résolution terminée avec succès : IP = $PUBLIC_IP (Instance: $FOUND_INSTANCE_ID)"
echo "═══════════════════════════════════════════════════════════════════════════"

# Export outputs GitHub Actions
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "ec2_ip=$PUBLIC_IP" >> "$GITHUB_OUTPUT"
  echo "instance_id=$FOUND_INSTANCE_ID" >> "$GITHUB_OUTPUT"
fi
