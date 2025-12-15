import MagicString from 'magic-string'
import { BindingMagicString } from 'rolldown'

type ObjectIntersection<A, B> = {
  [K in keyof A & keyof B]: A[K]
}

export type RolldownString = ObjectIntersection<MagicString, BindingMagicString>

export function rolldownString(
  code: string,
  id: string,
  meta: any,
): RolldownString {
  return meta?.magicString || new MagicString(code, { filename: id })
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
  if (s instanceof BindingMagicString) {
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
