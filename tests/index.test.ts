import { rolldownBuild } from '@sxzz/test-utils'
import MagicString from 'magic-string'
import { BindingMagicString, type Plugin } from 'rolldown'
import { expect, test } from 'vitest'
import {
  generateTransform,
  rolldownString,
  withMagicString,
  type RolldownString,
} from '../src'

const entry: Plugin = {
  name: 'entry',
  resolveId: {
    filter: { id: /entry/ },
    handler: () => '/entry',
  },
  load: {
    filter: { id: /entry/ },
    handler: () => 'export const answer = 42',
  },
}

test('rolldownString + generateTransform', async () => {
  let s: RolldownString
  const plugin: Plugin = {
    name: 'test',
    transform(code, id, meta) {
      s = rolldownString(code, id, meta)
      expect(s.toString()).toBe('export const answer = 42')

      s.replace('42', '43')
      return generateTransform(s, id)
    },
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])

  expect(s!).toBeInstanceOf(BindingMagicString)
  expect(snapshot).includes('43')
})

test('withMagicString', async () => {
  const plugin: Plugin = {
    name: 'test',
    transform: withMagicString((s, id, meta) => {
      s.replace('42', '43')
      expect(id).includes('entry')
      expect(meta).a('object')
    }),
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])
  expect(snapshot).includes('43')
})

test('withMagicString with returning Promise', async () => {
  const plugin: Plugin = {
    name: 'test',
    transform: withMagicString(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return new MagicString('console.log(43)')
    }),
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])
  expect(snapshot).includes('console.log(43)')
})

test('withMagicString with returning string', async () => {
  const plugin: Plugin = {
    name: 'test',
    transform: withMagicString(() => Promise.resolve('console.log(43)')),
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])
  expect(snapshot).includes('console.log(43)')
})

test('withMagicString with new magic-string instance', async () => {
  const plugin: Plugin = {
    name: 'test',
    transform: withMagicString(() => new BindingMagicString('console.log()')),
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])
  expect(snapshot).includes('console.log')
})

test('not in rolldown', () => {
  const s = rolldownString('const a = 1;', '/a')
  expect(s).instanceOf(MagicString)
})
