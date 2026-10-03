// @ts-check
// Flat ESLint config: base JS rules + typescript-eslint (non-type-checked
// set, so no tsconfig wiring needed). Style (2-space, no semicolons, single
// quotes) is enforced by example — match neighbors.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'node_modules/**',
      'out-tsc/**',
      'playwright-report/**',
      'test-results/**',
      'server/db/migrations/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Seed/demo code uses `any` for brevity; code users replace.
      '@typescript-eslint/no-explicit-any': 'off',
      // Unused imports aren't worth blocking commits on; still surface them.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
    },
  },
)
