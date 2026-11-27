#!/bin/bash
set -e

# Priorité : PREV_IP transmis par le job Terraform, sinon STATIC_IP
TARGET_IP="${PREV_IP:-$STATIC_IP}"

# Si une IP est déjà fournie par le workflow Terraform réutilisable, l'utiliser immédiatement
if [ -n "$TARGET_IP" ]; then
  echo "[OK] IP EC2 transmise par le workflow Terraform : $TARGET_IP"
  if [ -n "$GITHUB_OUTPUT" ]; then
    echo "ec2_ip=$TARGET_IP" >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

# Résolution dynamique de secours si les identifiants AWS sont présents
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "[INFO] Détection dynamique de l'IP EC2 via AWS CLI..."
  INSTANCE_ID="${AWS_INSTANCE_ID:-i-06299e2b1578249f2}"
  DYNAMIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "${AWS_REGION:-eu-north-1}" \
    --query "Reservations[0].Instances[0].PublicIpAddress" \
    --output text 2>/dev/null || echo "")

  if [ -n "$DYNAMIC_IP" ] && [ "$DYNAMIC_IP" != "None" ] && [ "$DYNAMIC_IP" != "null" ]; then
    echo "[OK] IP dynamique AWS détectée : $DYNAMIC_IP"
    TARGET_IP="$DYNAMIC_IP"
  fi
fi

if [ -z "$TARGET_IP" ]; then
  echo "[ERROR] Aucune adresse IP trouvée. Veuillez renseigner AWS_EC2_IP ou vérifier le workflow Terraform." >&2
  exit 1
fi

echo "[INFO] IP utilisée : $TARGET_IP"
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "ec2_ip=$TARGET_IP" >> "$GITHUB_OUTPUT"
fi
