// @ts-check
// ESLint flat config for bare React Native projects (non-Expo) — bare-RN baseline.
// Requires: ESLint ^9, @react-native/eslint-config, @eslint/eslintrc, eslint-plugin-react-native@^5, eslint-plugin-react-native-a11y.
//
// Baseline: @react-native/eslint-config (#143, ADOPT via FlatCompat).
// @react-native/eslint-config@0.86.x ships as a legacy eslintrc object, not a flat config.
// FlatCompat from @eslint/eslintrc (a transitive dep of eslint ^9) wraps it for ESLint flat config.
// WATCHLIST: if @callstack/eslint-config ships native flat config support before this is fixed
// upstream, swap to it per ARCHITECTURE.react-native.md §Baseline-choice.
//
// Prior-art: prior-art-evaluations.md#143 (bare-RN baseline, ADOPT).

import { defineConfig } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rnCommon from './eslint.config.rn-common.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FlatCompat wraps @react-native/eslint-config (legacy eslintrc object) for ESLint flat config.
// resolvePluginsRelativeTo ensures plugins in the legacy config resolve from this file's directory.
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const bareRNBase = compat.extends('@react-native');

export default defineConfig(
  // Bare-RN baseline — official @react-native/eslint-config (wrapped via FlatCompat)
  ...bareRNBase,

  // Shared RN layer: style/a11y rules + no-restricted-globals denylist (#144, #145, #146)
  // Applied additively — the denylist forbids DOM globals bare-RN code should never use.
  ...rnCommon,
);
