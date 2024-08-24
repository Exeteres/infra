import { raw } from "./imports"
import { createJobSpec, JobOptions } from "./job"
import { mapMetadata, mapPulumiOptions } from "./options"

export type CronJobOptions = JobOptions & Omit<raw.types.input.batch.v1.CronJobSpec, "jobTemplate">

/**
 * Creates a new CronJob with the specified options.
 *
 * @param options The options to create the CronJob.
 * @returns The CronJob resource.
 */
export function createCronJob(options: CronJobOptions): raw.batch.v1.CronJob {
  return new raw.batch.v1.CronJob(
    options.name,
    {
      metadata: mapMetadata(options),
      spec: {
        jobTemplate: {
          spec: createJobSpec(options),
        },
        schedule: options.schedule,
        concurrencyPolicy: options.concurrencyPolicy,
        failedJobsHistoryLimit: options.failedJobsHistoryLimit,
        startingDeadlineSeconds: options.startingDeadlineSeconds,
        successfulJobsHistoryLimit: options.successfulJobsHistoryLimit,
        suspend: options.suspend,
        timeZone: options.timeZone,
      },
    },
    mapPulumiOptions(options),
  )
}
