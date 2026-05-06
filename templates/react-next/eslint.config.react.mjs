// @ts-check
// ESLint flat config for React 19 / Next.js 15 App Router projects
// Requires: ESLint ^10.0.0, typescript-eslint ^8.59.0, @next/eslint-plugin-next, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import vitestPlugin from 'eslint-plugin-vitest';
import testingLibrary from 'eslint-plugin-testing-library';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import customRules from '../shared/eslint-rules/index.ts';

export default defineConfig(
  {
    ignores: [
      '.next/**',
      'dist/**',
      'coverage/**',
      '.stryker-tmp/**',
      'node_modules/**',
      'public/**',
      '**/*.d.ts',
      'next-env.d.ts',
      'reports/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Base TS block
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      // ─── Error handling ─────────────────────────────
      'no-throw-literal': 'error',
      '@typescript-eslint/no-useless-catch': 'error',

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

      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use union types or `as const` objects instead of enum.',
        },
      ],
    },
  },

  // React / JSX
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11y.configs.strict.rules,

      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',

      // Strong React-specific rules
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary'] }],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/no-array-index-key': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/no-unescaped-entities': 'error',

      // Hooks — error, not warn (AI breaks this all the time)
      'react-hooks/exhaustive-deps': 'error',

      // Accessibility (catches AI's <div onClick> habit)
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
    },
  },

  // Next.js
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-script-component-in-head': 'error',
    },
  },

  // Server Components: ban client-only globals
  {
    files: ['app/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    ignores: ['**/*.client.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message:
            "Server Component cannot use window. Add 'use client' if interactivity is needed.",
        },
        {
          name: 'document',
          message: 'Server Component cannot use document.',
        },
        {
          name: 'localStorage',
          message: 'localStorage does not exist on server.',
        },
        {
          name: 'sessionStorage',
          message: 'sessionStorage does not exist on server.',
        },
      ],
    },
  },

  // Custom AST rules (R2 / R7 / R8)
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
      'app/**/actions/**/*.{ts,tsx}',
      'src/app/**/actions/**/*.{ts,tsx}',
      'app/api/**/*.{ts,tsx}',
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

  // Tests
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**'],
    plugins: {
      vitest: vitestPlugin,
      'testing-library': testingLibrary,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      ...testingLibrary.configs.react.rules,
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-conditional-tests': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/expect-expect': 'error',

      'testing-library/no-debugging-utils': 'error',
      'testing-library/no-dom-import': 'error',
      'testing-library/prefer-screen-queries': 'error',
      'testing-library/await-async-queries': 'error',
      'testing-library/no-await-sync-queries': 'error',
      'testing-library/no-node-access': 'error',
      'testing-library/no-container': 'error',
    },
  },

  prettierConfig,
);
