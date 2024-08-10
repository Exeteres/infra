#!/bin/bash

# Check if namespace and secret name are provided
if [[ -z "$1" || -z "$2" ]]; then
  echo "Usage: $0 <namespace> <secret_name>"
  exit 1
fi

namespace=$1
secret_name=$2

# Get the secret in the specified namespace
secret=$(kubectl get secret "$secret_name" -n "$namespace" -o json 2>/dev/null)

# Check if the secret exists
if [[ -z "$secret" ]]; then
  echo "Secret '$secret_name' not found in namespace '$namespace'"
  exit 1
fi

# Extract the data field and serialize it to JSON
data=$(echo "$secret" | jq -r '.data')

# Check if the data field exists
if [[ -z "$data" || "$data" == "null" ]]; then
  echo "No data found in secret '$secret_name'"
  exit 1
fi

# Output the data field as JSON
echo "$data"
