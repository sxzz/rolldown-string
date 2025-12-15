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
export type HandlerReturn =
  | string
  | MagicString
  | BindingMagicString
  | RolldownString
  | void
  | undefined
export type Handler<Args extends any[], This> = (
  this: This,
  s: RolldownString,
  id: string,
  ...args: Args
) => Awaitable<HandlerReturn>

export function withMagicString<Args extends any[], This>(
  handler: Handler<Args, This>,
): (
  this: This,
  code: string,
  id: string,
  ...args: Args
) => Awaitable<CodeTransform | undefined> {
  return function (this: This, code: string, id: string, ...args: Args) {
    const meta = args.at(-1)
    const s = rolldownString(code, id, meta)
    const res = handler.call(this, s, id, ...args)
    const callback = (res: HandlerReturn) => {
      if (typeof res === 'string') {
        return { code: res }
      }
      return generateTransform(res || s, id, !!res)
    }

    if (res instanceof Promise) {
      return res.then(callback)
    }
    return callback(res)
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
  force?: boolean,
): CodeTransform | undefined {
  if (s?.constructor.name === 'BindingMagicString') {
    return { code: s }
  }

  if (s && (force || s.hasChanged())) {
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
