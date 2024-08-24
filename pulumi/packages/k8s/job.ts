import { raw } from "./imports"
import { mapMetadata, mapPulumiOptions } from "./options"
import { createPodTemplate, WorkloadOptionsBase } from "./workload"

export type JobOptions = WorkloadOptionsBase<raw.types.input.batch.v1.JobSpec>

/**
 * Creates a new Job with the specified options.
 *
 * @param options The options to create the Job.
 * @returns The Job resource.
 */
export function createJob(options: JobOptions): raw.batch.v1.Job {
  return new raw.batch.v1.Job(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: createJobSpec(options),
    },
    mapPulumiOptions(options),
  )
}

export function createJobSpec(options: JobOptions): raw.types.input.batch.v1.JobSpec {
  const podTemplate: raw.types.input.core.v1.PodTemplateSpec = createPodTemplate(options, "OnFailure")

  return {
    template: podTemplate,
    activeDeadlineSeconds: options.activeDeadlineSeconds,
    backoffLimit: options.backoffLimit,
    backoffLimitPerIndex: options.backoffLimitPerIndex,
    completions: options.completions,
    completionMode: options.completionMode,
    managedBy: options.managedBy,
    manualSelector: options.manualSelector,
    maxFailedIndexes: options.maxFailedIndexes,
    parallelism: options.parallelism,
    podFailurePolicy: options.podFailurePolicy,
    successPolicy: options.successPolicy,
    suspend: options.suspend,
    selector: options.selector,
    podReplacementPolicy: options.podReplacementPolicy,
    ttlSecondsAfterFinished: options.ttlSecondsAfterFinished,
  }
}
