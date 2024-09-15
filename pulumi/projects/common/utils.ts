import { Input, output, Output, Unwrap } from "@infra/core"
import { k8s } from "@infra/k8s"

export function singleton<T>(fn: () => T): () => T {
  let instance: T | undefined
  return () => {
    if (instance === undefined) {
      instance = fn()
    }
    return instance
  }
}

export function memoizeInput<TResult, TArgs extends any[]>(
  makeKey: (...args: TArgs) => Input<string>,
  fn: (...args: TArgs) => Input<TResult>,
): (...args: TArgs) => Output<Unwrap<TResult>> {
  const cache = new Map<string, Output<Unwrap<TResult>>>()

  return (...args: TArgs) => {
    const key = makeKey(...args)

    return output(
      output(key).apply(key => {
        if (cache.has(key)) {
          return cache.get(key)!
        }

        const result = output(fn(...args))
        cache.set(key, result)
        return result
      }),
    ) as Output<Unwrap<TResult>>
  }
}

export function memoizeForNamespace<TResult>(
  fn: (namespace: k8s.raw.core.v1.Namespace) => Input<TResult>,
): (namespace: k8s.raw.core.v1.Namespace) => Output<Unwrap<TResult>> {
  return memoizeInput(namespace => namespace.metadata.name, fn)
}
