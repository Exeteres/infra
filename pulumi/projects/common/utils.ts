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

export function memoize2<T, U, V>(fn: (arg1: T, arg2: U) => V): (arg1: T, arg2: U) => V {
  const cache = new Map<string, V>()
  return (arg1: T, arg2: U) => {
    const key = `${arg1}:${arg2}`
    if (!cache.has(key)) {
      cache.set(key, fn(arg1, arg2))
    }
    return cache.get(key)!
  }
}
