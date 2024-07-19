import { resolveStack } from "./stack"

export function singleton<T>(fn: () => T): () => T {
  let instance: T | undefined
  return () => {
    if (instance === undefined) {
      instance = fn()
    }
    return instance
  }
}

export const getSharedStack = singleton(() => resolveStack("shared"))
