#!/bin/bash

# Check if domain was provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <domain>"
  exit 1
fi

# The domain or subdomain to check, passed as an argument
DOMAIN="$1"

# Time to wait between checks (in seconds)
SLEEP_INTERVAL=5

# The maximum number of attempts (optional)
MAX_ATTEMPTS=50

# Attempt counter
attempts=0

echo "Waiting for DNS record for $DOMAIN to become available..."

while true; do
  # Increment attempt counter
  attempts=$((attempts + 1))

  # Check if the DNS record is available using the `host` command
  if [[ "$(host $DOMAIN)" != "" ]] ; then
    echo "DNS record for $DOMAIN is now available!"
    break
  fi

  # Check if the maximum number of attempts has been reached
  if [ "$attempts" -ge "$MAX_ATTEMPTS" ]; then
    echo "Reached maximum attempts ($MAX_ATTEMPTS). Exiting..."
    exit 1
  fi

  echo "DNS record not available yet. Attempt $attempts/$MAX_ATTEMPTS. Retrying in $SLEEP_INTERVAL seconds..."
  
  # Wait for the specified interval before checking again
  sleep "$SLEEP_INTERVAL"
done
