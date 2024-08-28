#!/bin/bash

# Check if at least one argument is provided
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <context> [namespace1 namespace2 ...]"
  exit 1
fi

# Get the first argument as context
context=$1

# Shift arguments so the rest are namespaces
shift

if [[ $# -gt 0 ]]; then
  # Get namespaces from the remaining arguments
  namespaces=$@
else
  # Get all namespaces
  namespaces=$(kubectl --context=$context get namespaces -o json | jq -r '.items[].metadata.name')
fi

# Iterate through all namespaces
for namespace in $namespaces; do
  # Get all cronjobs in the namespace that contain "backup" in their name
  cronjobs=$(kubectl --context=$context get cronjob -n "$namespace" -o json | jq -r '.items[] | select(.metadata.name | contains("backup")) | .metadata.name')

  # Iterate through all found cronjobs
  for cronjob in $cronjobs; do
    echo "Triggering CronJob $cronjob in namespace $namespace"

    # Create a job from the cronjob
    job_name="${cronjob}-manual-$(date +%s)"
    kubectl --context=$context create job --from=cronjob/$cronjob $job_name -n $namespace

    # Function to monitor job status
    monitor_job() {
      local job_name=$1
      local namespace=$2

      # Wait for the job to complete
      echo "Waiting for job $job_name to complete..."
      while true; do
        job_status=$(kubectl --context=$context get job $job_name -n $namespace -o json | jq -r '.status')
        succeeded=$(echo $job_status | jq -r '.succeeded')
        failed=$(echo $job_status | jq -r '.failed')

        if [[ "$succeeded" == "1" ]]; then
          echo "Job $job_name completed successfully."
          break
        elif [[ "$failed" -gt 0 ]]; then
          echo "Job $job_name failed."
          exit 1
          break
        else
          echo "Job $job_name is still running..."
          sleep 10
        fi
      done
    }

    # Monitor the job status in the background
    monitor_job $job_name $namespace &
  done
done

# Wait for all background jobs to finish
wait || exit 1
echo "All jobs completed."
