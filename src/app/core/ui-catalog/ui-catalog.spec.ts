// Drift guard for the /dashboard/ui-kit finder. Adding a component under
// src/app/components/ui (or a block) without cataloguing it must fail here,
// naming it, so the finder never silently falls behind what the app ships.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installedUi, localBlocks, ROOT, scanUsage, type RegistrySnapshot, type UsageData } from '../../../../scripts/ui-catalog'
import { buildCatalog, searchCatalog } from './catalog'
import { CURATED, CURATED_BLOCKS } from './curated'

const snapshot = JSON.parse(readFileSync(join(ROOT, 'src/app/core/ui-catalog/registry.snapshot.json'), 'utf8')) as RegistrySnapshot
const usage = JSON.parse(readFileSync(join(ROOT, 'src/app/core/ui-catalog/usage.generated.json'), 'utf8')) as UsageData
const entries = buildCatalog({ snapshot: snapshot.items, curated: CURATED, curatedBlocks: CURATED_BLOCKS, usage })

describe('ui catalog drift guard', () => {
  const dirs = installedUi()

  it('has a curated entry for every installed ui component', () => {
    const curated = new Set(CURATED.map(c => c.name))
    const missing = dirs.filter(d => !curated.has(d))
    expect(missing, `add these to src/app/core/ui-catalog/curated.ts: ${missing.join(', ')}`).toEqual([])
  })

  it('has no curated entry for a component that is not installed', () => {
    const stale = CURATED.map(c => c.name).filter(n => !dirs.includes(n))
    expect(stale, `remove from curated.ts (not in src/app/components/ui): ${stale.join(', ')}`).toEqual([])
  })

  it('has a curated entry for every local block', () => {
    const curated = new Set(CURATED_BLOCKS.map(c => c.name))
    const missing = localBlocks().map(b => b.name).filter(n => !curated.has(n))
    expect(missing, `add these to CURATED_BLOCKS in curated.ts: ${missing.join(', ')}`).toEqual([])
  })

  it('only curates names that exist in the registry snapshot', () => {
    const registry = new Set(snapshot.items.filter(i => i.type === 'registry:ui').map(i => i.name))
    // popper is an internal helper installed alongside popover/tooltip/menus.
    const unknown = CURATED.map(c => c.name).filter(n => !registry.has(n) && n !== 'popper')
    expect(unknown, `not in registry.snapshot.json (run npm run catalog:sync): ${unknown.join(', ')}`).toEqual([])
  })

  it('has an up-to-date usage.generated.json', () => {
    // If this fails, run `npm run catalog:scan` and commit the result.
    expect(usage).toEqual(scanUsage())
  })
})

describe('ui catalog data', () => {
  it('derives usage from imports, not hand lists', () => {
    // Button is on nearly every page; a scan that finds only a handful is broken.
    expect(usage.ui['button']!.length).toBeGreaterThanOrEqual(20)
    // Blocks follow up to the pages that render them; layout use is keyed by layout.
    expect(usage.blocks['stat-tile']!.routes).toContain('/dashboard')
    expect(usage.blocks['sidebar-02']!.routes).toEqual(['layout:dashboard'])
  })

  it('marks installed-but-unused components as demo-only, and the rest of the registry as available', () => {
    const byName = new Map(entries.filter(e => e.kind === 'ui').map(e => [e.name, e]))
    for (const [name, routes] of Object.entries(usage.ui)) {
      expect(byName.get(name)!.status, name).toBe(routes.length ? 'installed' : 'demo-only')
    }
    const notInstalled = entries.filter(e => e.kind === 'ui' && !(e.name in usage.ui))
    expect(notInstalled.length).toBeGreaterThan(100)
    expect(notInstalled.every(e => e.status === 'available')).toBe(true)
  })

  it('uses the Angular install command for every registry entry', () => {
    for (const e of entries) {
      if (e.kind === 'ui' && e.name !== 'popper') expect(e.installCmd).toBe(`npx uipkge-ng add ${e.name}`)
    }
  })
})

describe('ui catalog search', () => {
  const top = (q: string, n = 3) => searchCatalog(entries, { q }).slice(0, n).map(e => e.name)

  it('finds components by use case, not only by name', () => {
    expect(top('date range', 1)).toEqual(['range-calendar'])
    expect(top('confirm delete')).toContain('dialog')
    expect(top('upload')).toContain('file-upload')
    expect(top('otp')).toContain('pin-input')
  })

  it('ranks a name match above a description match', () => {
    expect(top('button', 1)).toEqual(['button'])
  })

  it('filters by status and category', () => {
    const available = searchCatalog(entries, { status: 'available' })
    expect(available.length).toBeGreaterThan(0)
    expect(available.every(e => e.status === 'available')).toBe(true)
    const blocks = searchCatalog(entries, { category: 'blocks' })
    expect(blocks.length).toBe(localBlocks().length)
    expect(blocks.every(e => e.kind === 'block')).toBe(true)
  })

  it('returns nothing for gibberish', () => {
    expect(searchCatalog(entries, { q: 'zzqqxx' })).toEqual([])
  })
})
