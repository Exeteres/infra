import { Input, all } from "@pulumi/pulumi"
import * as k8s from "@pulumi/kubernetes"

export const mapEnvironment = (environment?: Record<string, Input<string | k8s.types.input.core.v1.EnvVarSource>>) => {
  return Object.entries(environment ?? {}).map(([name, value]) => {
    return all([value]).apply(([value]) => {
      if (typeof value === "string") {
        return { name, value }
      }

      return { name, valueFrom: value }
    })
  })
}

export const trimIndentation = (str: string) => {
  const lines = str.split("\n")
  const indent = lines
    .filter(line => line.trim() !== "")
    .map(line => line.match(/^\s*/)?.[0].length ?? 0)
    .reduce((min, indent) => Math.min(min, indent), Infinity)

  return lines.map(line => line.slice(indent)).join("\n")
}
