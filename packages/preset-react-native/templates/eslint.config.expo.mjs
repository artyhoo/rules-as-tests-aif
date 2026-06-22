// @ts-check
// ESLint flat config for Expo (React Native) projects — Expo baseline.
// Requires: ESLint ^9, eslint-config-expo, eslint-plugin-react-native@^5, eslint-plugin-react-native-a11y.
//
// Baseline: eslint-config-expo/flat (#142, ADOPT).
// CRITICAL (#651, T-MS-B): eslint-config-expo/flat spreads globals.browser + sets window:false
// (≡ "window is readonly but defined"), which WHITELISTS web globals — it does NOT forbid them.
// The no-restricted-globals denylist in rn-common MUST fire ADDITIVELY under this config.
// Confirmed: no-restricted-globals is a separate rule key; it fires even when globals.browser
// is spread — the globals layer and the restricted-globals rule are independent ESLint mechanisms.
//
// Prior-art: prior-art-evaluations.md#142 (Expo baseline, ADOPT).

import { defineConfig } from 'eslint/config';
import expo from 'eslint-config-expo/flat.js';
import rnCommon from './eslint.config.rn-common.mjs';

export default defineConfig(
  // Expo baseline — handles React, TypeScript, React Native basics + globals
  ...(Array.isArray(expo) ? expo : [expo]),

  // Shared RN layer: style/a11y rules + no-restricted-globals denylist (#144, #145, #146)
  // These EXTEND the Expo baseline — the denylist fires ADDITIVELY over the globals.browser spread.
  ...rnCommon,
);
