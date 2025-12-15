import MagicString from 'magic-string'
import { BindingMagicString, rolldown } from 'rolldown'
import { expect, test } from 'vitest'
import { generateTransform, rolldownString, type RolldownString } from '../src'

test('basic', async () => {
  let m: RolldownString
  const bundle = await rolldown({
    input: '/entry',
    plugins: [
      {
        name: 'test',
        resolveId: {
          filter: { id: /entry/ },
          handler: () => '/entry',
        },
        load: {
          filter: { id: /entry/ },
          handler: () => 'export const answer = 42',
        },
        transform(code, id, meta) {
          m = rolldownString(code, id, meta)
          expect(m.toString()).toBe('export const answer = 42')

          m.replace('42', '43')
          return generateTransform(m, id)
        },
      },
    ],
  })

  const { output } = await bundle.generate()
  expect(m!).toBeInstanceOf(BindingMagicString)
  expect(output[0].code).include('43')
})

test('not in rolldown', () => {
  const s = rolldownString('const a = 1;', '/a')
  expect(s).instanceOf(MagicString)
})
