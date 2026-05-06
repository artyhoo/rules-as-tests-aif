// @ts-check
// ESLint flat config for server-side TypeScript projects (Node.js, Fastify, Hono, etc.)
// Requires: ESLint ^10.0.0, typescript-eslint ^8.59.0
// For React/Next.js, see eslint.config.react.mjs

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vitestPlugin from 'eslint-plugin-vitest';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import customRules from '../shared/eslint-rules/index.ts';

export default defineConfig(
  // 1. Global ignores
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.stryker-tmp/**',
      'node_modules/**',
      '**/*.d.ts',
      'reports/**',
    ],
  },

  // 2. Base JS recommended
  js.configs.recommended,

  // 3. typescript-eslint strict + stylistic (type-aware)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 4. TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    rules: {
      // ─── Hygiene ────────────────────────────────────
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],

      // ─── Error handling ─────────────────────────────
      'no-throw-literal': 'error',
      '@typescript-eslint/no-useless-catch': 'error',

      // ─── Switch / control flow ──────────────────────
      'default-case': 'error',
      'no-fallthrough': 'error',

      // ─── Forbidden imports (banned dependencies) ────
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['lodash', 'lodash/*'],
              message: 'Use native methods or lodash-es with tree-shaking.',
            },
            {
              group: ['moment'],
              message: 'Use date-fns or Temporal instead of moment.',
            },
            {
              group: ['axios'],
              message: 'Use native fetch.',
            },
            {
              group: ['request', 'request/*'],
              message: 'request is deprecated. Use native fetch.',
            },
            {
              group: ['node-fetch', 'node-fetch/*'],
              message: 'Use native fetch (Node 18+).',
            },
          ],
        },
      ],

      // ─── Forbidden syntax ────────────────────────────
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message:
            'Use union types or `as const` objects instead of enum (verbatimModuleSyntax-incompatible).',
        },
        {
          selector:
            'CallExpression[callee.object.name="Date"][callee.property.name="now"]',
          message:
            'Use an injected Clock instead of Date.now() in production code.',
        },
        {
          selector:
            'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
          message:
            'Use an injected Random source instead of Math.random() in production code.',
        },
      ],
    },
  },

  // 4b. Custom AST rules (R2 / R7 / R8)
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/infrastructure/**/*.{ts,tsx}'],
    plugins: { 'rules-as-tests': customRules },
    rules: {
      'rules-as-tests/no-direct-time-randomness': 'error',
    },
  },
  {
    files: [
      'src/web/handlers/**/*.{ts,tsx}',
      'src/app/actions/**/*.{ts,tsx}',
      'src/app/api/**/*.{ts,tsx}',
    ],
    plugins: { 'rules-as-tests': customRules },
    rules: {
      'rules-as-tests/no-unsafe-zod-parse': 'error',
    },
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    ignores: ['src/application/**/ports/**'],
    plugins: { 'rules-as-tests': customRules },
    rules: {
      'rules-as-tests/require-otel-span': 'error',
    },
  },

  // 5. Test files — relax strict rules, enable test-specific ones
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      '**/__tests__/**',
      'tests/**/*.{ts,tsx}',
    ],
    plugins: { vitest: vitestPlugin },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-restricted-syntax': 'off',

      // Test quality rules
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/expect-expect': 'error',
      'vitest/no-conditional-tests': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/no-standalone-expect': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/valid-expect': 'error',
    },
  },

  // 6. Configs and scripts — relaxed
  {
    files: ['**/*.config.{ts,mjs,js}', 'scripts/**/*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },

  // 7. Prettier — must be LAST to disable conflicting rules
  prettierConfig,
);
