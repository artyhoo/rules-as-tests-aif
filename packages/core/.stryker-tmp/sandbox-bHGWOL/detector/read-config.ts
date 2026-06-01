// @ts-nocheck
// Priority 5: next.config.* / tsconfig.json presence — confirmation/fallback signal.

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DetectionResult } from './types.ts';
import { toConfidence } from './confidence.ts';

const NEXT_CONFIGS = ['next.config.ts', 'next.config.js', 'next.config.mjs', 'next.config.cjs'];

export function readConfig(projectRoot: string): DetectionResult | null {
  const tuple = toConfidence(5);
  const baseRules = { applicable: [] as string[], skipped: [] as string[] };

  for (const cfg of NEXT_CONFIGS) {
    if (existsSync(resolve(projectRoot, cfg))) {
      return {
        stack: 'react-next',
        framework: { name: 'next', version: null, major: null },
        runtime: { name: 'node', major: null },
        ...tuple,
        source: cfg,
        rules: baseRules,
      };
    }
  }

  if (existsSync(resolve(projectRoot, 'tsconfig.json'))) {
    return {
      stack: 'ts-server',
      framework: { name: null, version: null, major: null },
      runtime: { name: 'node', major: null },
      ...tuple,
      source: 'tsconfig.json',
      rules: baseRules,
    };
  }

  return null;
}
