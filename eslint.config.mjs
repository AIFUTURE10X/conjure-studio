import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

// react-hooks v6 ships React Compiler-era diagnostics as errors. The
// codebase has long-standing patterns they flag (sync state in effects,
// refs during render, components created in render), so everything except
// the foundational rules-of-hooks runs as a warning until those are
// redesigned. New code should not add warnings.
const hooksRules = Object.fromEntries(
  Object.entries(reactHooks.configs.recommended.rules ?? {}).map(([rule, level]) => [
    rule,
    rule === 'react-hooks/rules-of-hooks' ? 'error' : (level === 'off' ? 'off' : 'warn'),
  ]),
)

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'dist/**',
      '*.config.mjs',
      'scripts/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...hooksRules,
      // Warnings initially — ratcheted to errors as the codebase is cleaned
      // up (Phase 2 plan). New code should not add any of these.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
)
