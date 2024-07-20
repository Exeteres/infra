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

export function memoize<T, U>(fn: (arg: T) => U): (arg: T) => U {
  const cache = new Map<T, U>()
  return (arg: T) => {
    if (!cache.has(arg)) {
      cache.set(arg, fn(arg))
    }
    return cache.get(arg)!
  }
}

export const getSharedStack = singleton(() => resolveStack("shared"))
