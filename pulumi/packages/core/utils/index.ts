import { pulumi } from "../imports"
import { HasFields } from "./inputs"

export * from "./shared"
export * from "./inputs"

export function undefinedIfEmpty<T>(value: pulumi.Input<T[]>): pulumi.Output<T[] | undefined> {
  return pulumi.output(value).apply(v => (v.length > 0 ? v : undefined)) as any
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Removes the indentation from a multiline string.
 *
 * @param str The string to trim.
 * @returns The trimmed string.
 */
export function trimIndentation(str: string): string {
  const lines = str.split("\n")
  const indent = lines
    .filter(line => line.trim() !== "")
    .map(line => line.match(/^\s*/)?.[0].length ?? 0)
    .reduce((min, indent) => Math.min(min, indent), Infinity)

  return lines
    .map(line => line.slice(indent))
    .join("\n")
    .trim()
}

export function mapObjectKeys<T extends HasFields>(mapFn: (key: string) => string, obj: T): Record<string, T[keyof T]> {
  const result: Record<string, T[keyof T]> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[mapFn(key)] = value
  }
  return result
}
