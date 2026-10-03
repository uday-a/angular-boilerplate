import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Pattern copied from uipkge-ui/packages/registry-angular/vitest.config.ts:
// inline Angular packages through Vite (one copy via dedupe), JIT-friendly
// test setup, and a `@` alias mirroring tsconfig paths.
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'server/**/*.spec.ts'],
    setupFiles: ['./test-utils/setup.ts'],
    // Let Vite (not Node) resolve Angular + lucide-angular + ngx-translate
    // so resolve.dedupe below yields one copy (and partially compiled FESM
    // goes through the JIT compiler loaded in setup.ts).
    server: { deps: { inline: [/@angular\//, /lucide-angular/, /ngx-translate/] } },
  },
  resolve: {
    // One Angular copy: without dedupe a second @angular/core can load and
    // rendered specs break (NG0203 / firstCreatePass).
    dedupe: [
      '@angular/core',
      '@angular/common',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/compiler',
      '@ngx-translate/core',
      '@ngx-translate/http-loader',
      'rxjs',
    ],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
