import { Schema } from "zod"

export function getEnvironmentVariable<TValue>(key: string, schema: Schema<TValue>) {
  const value = process.env[key]
  const parsedValue = schema.safeParse(value)

  if (parsedValue.success) {
    return parsedValue.data
  }

  const details = {
    key,
    value,
    errors: parsedValue.error.errors,
  }

  throw new Error(`Invalid environment variable: ${JSON.stringify(details, undefined, 2)}`)
}
