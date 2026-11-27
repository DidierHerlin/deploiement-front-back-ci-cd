#!/bin/bash
set -e

# Récupération de l'IP (priorité : PREV_IP si défini, sinon STATIC_IP)
TARGET_IP="${PREV_IP:-$STATIC_IP}"

# Résolution dynamique si les identifiants AWS et l'ID d'instance sont configurés
if [ -n "$AWS_INSTANCE_ID" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "[INFO] Detection dynamique de l'IP EC2 via AWS CLI..."
  DYNAMIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$AWS_INSTANCE_ID" \
    --region "${AWS_REGION:-eu-north-1}" \
    --query "Reservations[0].Instances[0].PublicIpAddress" \
    --output text 2>/dev/null || echo "")

  if [ -n "$DYNAMIC_IP" ] && [ "$DYNAMIC_IP" != "None" ]; then
    echo "[OK] IP dynamique AWS detectee : $DYNAMIC_IP"
    TARGET_IP="$DYNAMIC_IP"
  fi
fi

# Vérification finale
if [ -z "$TARGET_IP" ]; then
  echo "[ERROR] Aucune adresse IP trouvee. Veuillez renseigner AWS_EC2_IP ou AWS_INSTANCE_ID."
  exit 1
fi

echo "[INFO] IP utilisee : $TARGET_IP"

# Export vers l'output du step GitHub Actions
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "ec2_ip=$TARGET_IP" >> "$GITHUB_OUTPUT"
fi
