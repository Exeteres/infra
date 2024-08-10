#!/bin/bash
set -euo pipefail

# Check if at least two arguments are provided
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <source-stack> <destination-stack1> [<destination-stack2> ...]"
  exit 1
fi

# Assign the source stack and destination stacks
SOURCE_STACK=$1
shift
DEST_STACKS=("$@")

# Fetch all configuration keys from the source stack
CONFIG_KEYS=$(pulumi config --stack $SOURCE_STACK --json | jq -r 'keys[] | select(. != "kubernetes:context")')

for DEST_STACK in "${DEST_STACKS[@]}"; do
  echo "Resetting destination stack: $DEST_STACK"
  # Get all keys in the destination stack
  DEST_KEYS=$(pulumi config --stack $DEST_STACK --json | jq -r 'keys[] | select(. != "kubernetes:context")')

  # Remove keys from the destination stack that are not in the source stack
  for KEY in $DEST_KEYS; do
    if ! echo "$CONFIG_KEYS" | grep -q "^$KEY$"; then
      pulumi config rm --stack $DEST_STACK $KEY
      echo "Removed key: $KEY from $DEST_STACK"
    fi
  done

  # Copy each configuration value from source to destination stack
  for KEY in $CONFIG_KEYS; do
    VALUE=$(pulumi config get --stack $SOURCE_STACK $KEY --json)
    IS_SECRET=$(echo $VALUE | jq -r '.secret')

    if [ "$IS_SECRET" = "true" ]; then
      # Copy secret value
      SECRET_VALUE=$(echo $VALUE | jq -r '.value')
      pulumi config set --stack $DEST_STACK $KEY --secret "$SECRET_VALUE"
    else
      # Copy plain value
      PLAIN_VALUE=$(echo $VALUE | jq -r '.value')
      pulumi config set --stack $DEST_STACK $KEY "$PLAIN_VALUE"
    fi
  done

  echo "Configuration values and secrets have been successfully copied to $DEST_STACK"
done
