import { rolldownBuild } from '@sxzz/test-utils'
import MagicString from 'magic-string'
import { MagicStringAST } from 'magic-string-ast'
import { RolldownMagicString, type Plugin } from 'rolldown'
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
      if (id.startsWith('\0')) return
      s = rolldownString(code, id, meta)

      expect(s.toString()).toBe('export const answer = 42')

      s.replace('42', '43')
      return generateTransform(s, id)
    },
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])

  expect(s!).toBeInstanceOf(RolldownMagicString)
  expect(snapshot).includes('43')
})

test('withMagicString', async () => {
  const plugin: Plugin = {
    name: 'test',
    transform: withMagicString((s, id, meta) => {
      if (id.startsWith('\0')) return
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
    transform: withMagicString(async (code, id) => {
      if (id.startsWith('\0')) return
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
    transform: withMagicString((code, id) => {
      if (id.startsWith('\0')) return
      return Promise.resolve('console.log(43)')
    }),
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])
  expect(snapshot).includes('console.log(43)')
})

test('withMagicString with new magic-string instance', async () => {
  const plugin: Plugin = {
    name: 'test',
    transform: withMagicString((code, id) => {
      if (id.startsWith('\0')) return
      return new RolldownMagicString('console.log()')
    }),
  }
  const { snapshot } = await rolldownBuild('/entry', [entry, plugin])
  expect(snapshot).includes('console.log')
})

test('not in rolldown', () => {
  const s = rolldownString('const a = 1;', '/a')
  expect(s).instanceOf(MagicString)
})

test('co-usage with magic-string-ast', () => {
  const s = new RolldownMagicString('const a = 1')
  const ss = new MagicStringAST(s as any)
  ss.overwriteNode({ start: 6, end: 7 }, 'b')
  expect(s.toString()).toBe('const b = 1')
  expect(ss.toString()).toBe('const b = 1')
})
