/**
 * UI catalog data generator for the /dashboard/ui-kit finder. Port of
 * nuxt-boilerplate's scripts/ui-catalog.ts.
 *
 *   node scripts/ui-catalog.ts sync-registry  -> src/app/core/ui-catalog/registry.snapshot.json
 *   node scripts/ui-catalog.ts scan-usage     -> src/app/core/ui-catalog/usage.generated.json
 *
 * sync-registry reads the uipkge Angular registry index (the sibling
 * uipkge-ui checkout when present, else https://uipkge.dev/r/angular/registry.json)
 * and keeps the trimmed `registry:ui` items plus the registry blocks that
 * match a local block. Review the diff before committing it.
 *
 * scan-usage maps every installed ui component and local block to the routes
 * that render it, following imports (pages -> helpers -> blocks) up to the
 * route table in src/app/app.routes.ts. The drift spec re-runs scanUsage()
 * and compares it with the committed file.
 *
 * Plain Node (>= 22.18 strips types natively): only erasable TS syntax here.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const DATA_DIR = join(ROOT, 'src/app/core/ui-catalog')
export const SNAPSHOT_FILE = join(DATA_DIR, 'registry.snapshot.json')
export const USAGE_FILE = join(DATA_DIR, 'usage.generated.json')

const REGISTRY_URL = 'https://uipkge.dev/r/angular/registry.json'
const LOCAL_REGISTRY = resolve(ROOT, '../uipkge-ui/apps/astro-site/public/r/angular/registry.json')

export interface SnapshotItem {
  name: string
  title: string
  type: 'registry:ui' | 'registry:block' | 'registry:page'
  description: string
  categories: string[]
}

export interface RegistrySnapshot {
  source: string
  items: SnapshotItem[]
}

export interface UsageData {
  /** installed ui component name -> sorted route keys ('/dashboard', 'layout:dashboard', 'app:root') */
  ui: Record<string, string[]>
  /** local block name -> main file (relative to src/app/components/blocks) and route keys */
  blocks: Record<string, { file: string, routes: string[] }>
}

const toPosix = (p: string) => p.split(sep).join('/')

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter(d => statSync(join(dir, d)).isDirectory()).sort()
}

/** Top-level `src/app/components/ui/<name>` dirs. */
export function installedUi(root = ROOT): string[] {
  return listDirs(join(root, 'src/app/components/ui'))
}

/** Chart primitives vendored inside `ui/charts/<name>` (each is its own registry item). */
export function installedChartParts(root = ROOT): string[] {
  return listDirs(join(root, 'src/app/components/ui/charts'))
}

/** Local blocks: `src/app/components/blocks/<name>/` dirs. */
export function localBlocks(root = ROOT): { name: string, file: string }[] {
  const dir = join(root, 'src/app/components/blocks')
  return listDirs(dir).map((name) => {
    const main = existsSync(join(dir, name, `${name}.component.ts`)) ? `${name}.component.ts` : 'index.ts'
    return { name, file: `${name}/${main}` }
  })
}

// ---------------------------------------------------------------- sync-registry

export function trimRegistry(index: { items: any[] }, blockNames: string[]): SnapshotItem[] {
  const blocks = new Set(blockNames)
  return index.items
    .filter(i => i.type === 'registry:ui' || ((i.type === 'registry:block' || i.type === 'registry:page') && blocks.has(i.name)))
    .map(i => ({
      name: String(i.name),
      title: String(i.title ?? i.name),
      type: i.type,
      description: String(i.description ?? ''),
      categories: Array.isArray(i.categories) ? i.categories.map(String) : [],
    }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
}

async function syncRegistry(): Promise<void> {
  let index: { items: any[] }
  let source: string
  if (existsSync(LOCAL_REGISTRY)) {
    index = JSON.parse(readFileSync(LOCAL_REGISTRY, 'utf8'))
    source = 'uipkge-ui/apps/astro-site/public/r/angular/registry.json'
  }
  else {
    const res = await fetch(REGISTRY_URL)
    if (!res.ok) throw new Error(`registry fetch failed: ${res.status} ${REGISTRY_URL}`)
    index = await res.json() as { items: any[] }
    source = REGISTRY_URL
  }
  const items = trimRegistry(index, localBlocks().map(b => b.name))
  writeFileSync(SNAPSHOT_FILE, JSON.stringify({ source, items }, null, 2) + '\n')
  const ui = items.filter(i => i.type === 'registry:ui').length
  console.log(`catalog:sync  ${ui} ui + ${items.length - ui} block items  (${source})`)
}

// ---------------------------------------------------------------- scan-usage

const EXCLUDE = [
  /^src\/app\/components\/ui\//,
  /^src\/app\/pages\/dashboard\/ui-kit\.ts$/,
  /^src\/app\/core\/ui-catalog\//,
  /\.spec\.ts$/,
]

/** Page file (relative, no extension) -> route key, from src/app/app.routes.ts. */
export function routeTable(root = ROOT): Map<string, string> {
  const src = readFileSync(join(root, 'src/app/app.routes.ts'), 'utf8')
  const table = new Map<string, string>()
  // `path: 'x'` followed by its loadComponent import. Children of `admin`
  // carry relative paths, so prefix them by the page folder.
  for (const m of src.matchAll(/path:\s*'([^']*)'(?:(?!path:)[^])*?import\('\.\/(pages\/[^']+)'\)/g)) {
    const [, path, file] = m as unknown as [string, string, string]
    if (path === '**' || table.has(`src/app/${file}`)) continue
    const full = file.startsWith('pages/admin/') && !path.startsWith('admin') ? `admin/${path}` : path
    table.set(`src/app/${file}`, `/${full}`.replace(/\/$/, '') || '/')
  }
  return table
}

function routeKey(rel: string, table: Map<string, string>): string | null {
  const noExt = rel.replace(/\.ts$/, '')
  const route = table.get(noExt)
  if (route) return route
  if (rel.startsWith('src/app/layouts/')) return `layout:${rel.split('/')[3]!.replace(/-layout$/, '')}`
  if (rel === 'src/app/app.ts') return 'app:root'
  return null
}

function resolveImport(from: string, spec: string, root: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = join(root, 'src', spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(join(root, from)), spec)
  else return null
  for (const candidate of [`${base}.ts`, join(base, 'index.ts'), base]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return toPosix(relative(root, candidate))
  }
  return null
}

/** Unit a file belongs to: 'ui:<dir>' (+ chart part) or 'block:<dir>', else none. */
function unitsOf(rel: string, chartParts: string[]): string[] {
  const ui = /^src\/app\/components\/ui\/([^/]+)\/(?:([^/]+)\/)?/.exec(rel)
  if (ui) {
    const out = [`ui:${ui[1]}`]
    if (ui[1] === 'charts' && ui[2] && chartParts.includes(ui[2])) out.push(`ui:${ui[2]}`)
    return out
  }
  const block = /^src\/app\/components\/blocks\/([^/]+)\//.exec(rel)
  return block ? [`block:${block[1]}`] : []
}

export function scanUsage(root = ROOT): UsageData {
  const uiDirs = installedUi(root)
  const chartParts = installedChartParts(root)
  const blocks = localBlocks(root)
  const table = routeTable(root)

  const files = walk(join(root, 'src/app'))
    .map(f => toPosix(relative(root, f)))
    .filter(rel => rel.endsWith('.ts'))

  // consumer file -> imported files. A file importing a block or ui file
  // "uses" that unit; non-route consumers are followed up their importers.
  const consumersOfUnit = new Map<string, Set<string>>()
  const importersOf = new Map<string, Set<string>>()
  for (const rel of files) {
    if (EXCLUDE.some(r => r.test(rel))) continue
    const src = readFileSync(join(root, rel), 'utf8')
    for (const m of src.matchAll(/(?:from\s+|import\()\s*'([^']+)'/g)) {
      const target = resolveImport(rel, m[1]!, root)
      if (!target || target === rel) continue
      if (!importersOf.has(target)) importersOf.set(target, new Set())
      importersOf.get(target)!.add(rel)
      for (const unit of unitsOf(target, chartParts)) {
        // A block importing its own files is not usage.
        if (unitsOf(rel, chartParts).includes(unit)) continue
        if (!consumersOfUnit.has(unit)) consumersOfUnit.set(unit, new Set())
        consumersOfUnit.get(unit)!.add(rel)
      }
    }
  }

  function resolveRoutes(unit: string): string[] {
    const routes = new Set<string>()
    const seen = new Set<string>()
    const queue = [...(consumersOfUnit.get(unit) ?? [])]
    while (queue.length) {
      const rel = queue.shift()!
      if (seen.has(rel)) continue
      seen.add(rel)
      const key = routeKey(rel, table)
      if (key) {
        routes.add(key)
        continue
      }
      // Route files are only reached through the lazy import in
      // app.routes.ts, which routeKey already covers; follow everything else.
      if (rel === 'src/app/app.routes.ts') continue
      for (const up of importersOf.get(rel) ?? []) queue.push(up)
    }
    return [...routes].sort()
  }

  const ui: UsageData['ui'] = {}
  for (const name of [...uiDirs, ...chartParts.filter(p => !uiDirs.includes(p))].sort()) {
    ui[name] = resolveRoutes(`ui:${name}`)
  }
  const blockUsage: UsageData['blocks'] = {}
  for (const b of blocks) blockUsage[b.name] = { file: b.file, routes: resolveRoutes(`block:${b.name}`) }
  return { ui, blocks: blockUsage }
}

// ---------------------------------------------------------------- CLI

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const cmd = process.argv[2]
  if (cmd === 'sync-registry') {
    await syncRegistry()
  }
  else if (cmd === 'scan-usage') {
    const usage = scanUsage()
    writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2) + '\n')
    const unused = Object.entries(usage.ui).filter(([, r]) => r.length === 0).map(([n]) => n)
    console.log(`catalog:scan  ${Object.keys(usage.ui).length} ui, ${Object.keys(usage.blocks).length} blocks; demo-only: ${unused.join(', ') || 'none'}`)
  }
  else {
    console.error('usage: node scripts/ui-catalog.ts <sync-registry|scan-usage>')
    process.exit(1)
  }
}
