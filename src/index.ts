import MagicString from 'magic-string'
import type { BindingMagicString } from 'rolldown'

type ObjectIntersection<A, B> = {
  [K in keyof A & keyof B]: A[K]
}

export type RolldownString = ObjectIntersection<MagicString, BindingMagicString>

export function rolldownString(
  code: string,
  id: string,
  meta?: any,
): RolldownString {
  return meta?.magicString || new MagicString(code, { filename: id })
}

type Awaitable<T> = T | Promise<T>

export type Handler<Meta> = (
  s: RolldownString,
  id: string,
  meta: Meta,
) => Awaitable<
  MagicString | BindingMagicString | RolldownString | void | undefined
>

export function withMagicString<Meta>(
  handler: Handler<Meta>,
): (
  code: string,
  id: string,
  meta: Meta,
) => Awaitable<CodeTransform | undefined> {
  return (code: string, id: string, meta: Meta) => {
    const s = rolldownString(code, id, meta)
    const res = handler(s, id, meta)
    if (res instanceof Promise) {
      return res.then((res) => generateTransform(res || s, id))
    }
    return generateTransform(res || s, id)
  }
}

/**
 * The result of code transformation.
 */
export interface CodeTransform {
  code: any
  map?: any
}

/**
 * Generate an object of code and source map from MagicString.
 */
export function generateTransform(
  s: MagicString | BindingMagicString | RolldownString | undefined,
  id: string,
): CodeTransform | undefined {
  if (s?.constructor.name === 'BindingMagicString') {
    return { code: s }
  }

  if (s?.hasChanged()) {
    return {
      code: s.toString(),
      get map() {
        return (s as MagicString).generateMap({
          source: id,
          includeContent: true,
          hires: 'boundary',
        })
      },
    }
  }
}
