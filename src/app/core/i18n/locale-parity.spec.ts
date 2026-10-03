// Locale key-parity guard: en.json and es.json must expose identical key
// trees (auth.*, nav.*), so a template that renders in English can never hit
// a missing key in Spanish. Also rejects vue-i18n-isms left over from the
// Nuxt port — ngx-translate interpolates {{ }} and needs no @ escaping.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const en = JSON.parse(readFileSync(join(dir, '../../../assets/i18n/en.json'), 'utf8')) as unknown
const es = JSON.parse(readFileSync(join(dir, '../../../assets/i18n/es.json'), 'utf8')) as unknown

type Leaf = { path: string, value: unknown }

function leaves(node: unknown, prefix = ''): Leaf[] {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return [{ path: prefix, value: node }]
  return Object.entries(node).flatMap(([key, value]) => leaves(value, prefix ? `${prefix}.${key}` : key))
}

// Single-brace {param} outside a {{ }} interpolation — a vue-i18n leftover
// ngx-translate would render literally instead of interpolating.
const SINGLE_BRACE_PARAM = /(?<!\{)\{[a-zA-Z]+\}(?!\})/

describe('locale parity (en ↔ es)', () => {
  it('exposes the auth.* and nav.* namespaces in both locales', () => {
    for (const locale of [en, es]) {
      expect(locale).toHaveProperty('auth')
      expect(locale).toHaveProperty('nav')
    }
  })

  it('has identical key sets in en and es', () => {
    const enKeys = leaves(en).map((l) => l.path).sort()
    const esKeys = leaves(es).map((l) => l.path).sort()
    expect(enKeys.length).toBeGreaterThan(0)
    expect(esKeys).toEqual(enKeys)
  })

  it('has a non-empty string for every leaf in both locales', () => {
    for (const { path, value } of [...leaves(en), ...leaves(es)]) {
      expect(typeof value, path).toBe('string')
      expect((value as string).length, path).toBeGreaterThan(0)
    }
  })

  it('contains no vue-i18n leftovers ({\'@\'} escapes or {param} interpolation)', () => {
    for (const { path, value } of [...leaves(en), ...leaves(es)]) {
      expect(value as string, path).not.toContain("{'@'}")
      expect(value as string, path).not.toMatch(SINGLE_BRACE_PARAM)
    }
  })
})
