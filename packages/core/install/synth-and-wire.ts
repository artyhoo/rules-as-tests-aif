#!/usr/bin/env -S node --experimental-strip-types
/**
 * synth-and-wire.ts — deterministic synthesizer → install wiring entry point.
 *
 * Runs synthesize() for the detected stack, then calls wireNRules() to merge the
 * emitted rules-as-tests slice into the consumer's eslint.config.mjs. Idempotent:
 * if the preset template already contains all synthesized selectors (which principle 26
 * guarantees for in-sync templates), this is a fast no-op with no writes.
 *
 * Called from setup.d/99-finalize.sh BEFORE the R2-per-package wirer so the root
 * eslint.config is confirmed/updated first. R2 (no-unsafe-zod-parse) still uses its
 * own wirer (wire-eslint-r2.ts) for the bare→self-contained probe escalation.
 *
 * Usage (from consumer cwd, PKG_ROOT points to the framework checkout):
 *   npx --no-install tsx "$PKG_ROOT/packages/core/install/synth-and-wire.ts" \
 *       --stack react-next --path ./eslint.config.mjs [--dry-run]
 *
 * Prior-art: prior-art-evaluations.md#120 (install auto-wires R2 by reading repo),
 *            #131 (ts-morph REUSE), #135 (wirer BUILD).
 * @cc-only-rationale: runs in consumer context after install; the bash gate in
 *   99-finalize.sh is the primary gatekeeper.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { loadEntries } from '../research/load.ts';
import { synthesize } from '../synthesizer/synthesize.ts';
import { wireNRules } from './wire-eslint-r2.ts';

// ─── Canonical pattern sets per install stack ─────────────────────────────────
// Mirrors the WRAPPER_TEMPLATES in packages/core/principles/26-template-selector-sync.test.ts.
// Only patterns that produce eslint config entries for the consumer's root config (R12/R14/R20);
// opt-in runtime rules (R7/R8) and R2 are excluded (R2 uses its own wirer for probe escalation).
// ts-server has no qualifying patterns → synthesizer emits {} → fast idempotent no-op.
const STACK_PATTERNS: Record<string, { framework: string; version: string; patterns: string[] }> = {
  'react-next': {
    framework: 'next',
    version: '15.4.0',
    patterns: [
      'next-r12-no-server-imports-in-client',
      'next-r14-require-form-safe-parse',
      'next-r20-require-use-server-directive',
    ],
  },
};

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log([
      'synth-and-wire — run the deterministic synthesizer and wire emitted rules-as-tests rules',
      '                  into the consumer eslint.config.mjs',
      '',
      'Usage: npx tsx synth-and-wire.ts [options]',
      '  --stack <name>  Install stack identifier (react-next | ts-server | ...)',
      '  --path <file>   Config file to wire (default: ./eslint.config.mjs)',
      '  --dry-run       Print what would change; no writes',
    ].join('\n'));
    process.exit(0);
  }

  const stackIdx = argv.indexOf('--stack');
  if (stackIdx < 0 || !argv[stackIdx + 1]) {
    console.error('  · synth-and-wire: --stack <name> is required');
    process.exit(0); // rc=0 — install must not abort
  }
  const stack = argv[stackIdx + 1];

  const pathIdx = argv.indexOf('--path');
  const configPath = resolve(pathIdx >= 0 ? argv[pathIdx + 1] : './eslint.config.mjs');
  const dryRun = argv.includes('--dry-run');

  // Unknown stack → no declared patterns → synthesizer would emit {} → skip early
  const stackDef = STACK_PATTERNS[stack];
  if (!stackDef) {
    console.log(`  [synth-wire] stack '${stack}' has no synthesizer pattern set — skipped (no-op)`);
    process.exit(0);
  }

  // Run the deterministic synthesizer (no LLM; no network — principle 17)
  console.debug(`  [synth-wire] DEBUG: synthesizing rules for stack '${stack}' (${stackDef.framework}@${stackDef.version})`);
  const entries = loadEntries(stackDef.framework, stackDef.version, stackDef.patterns);
  const plan = synthesize({
    framework: stackDef.framework,
    version: stackDef.version,
    patterns: entries,
    missing: [],
    drift: null,
  });
  const synthRules = JSON.parse(plan.eslintConfigSnippet) as Record<string, unknown>;

  if (Object.keys(synthRules).length === 0) {
    console.log(`  [synth-wire] synthesizer emitted no rules for '${stack}' — no-op`);
    process.exit(0);
  }

  console.debug(`  [synth-wire] DEBUG: emitted ${Object.keys(synthRules).length} rule(s): ${Object.keys(synthRules).join(', ')}`);

  // Dry-run: check config existence and report what would happen, no writes
  if (dryRun) {
    if (!existsSync(configPath)) {
      console.log(`  [dry-run] [synth-wire] ${configPath} not found — would skip`);
    } else {
      const source = readFileSync(configPath, 'utf8');
      const result = await wireNRules(source, synthRules);
      if (result.status === 'already-wired') {
        console.log(`  [dry-run] [synth-wire] all synthesized rules already present in ${configPath} (no change needed)`);
      } else {
        console.log(`  [dry-run] [synth-wire] would wire synthesized rules into ${configPath} (status: ${result.status})`);
      }
    }
    process.exit(0);
  }

  // Check config file
  if (!existsSync(configPath)) {
    console.log(`  [synth-wire] ${configPath} not found — skipped`);
    process.exit(0);
  }

  const source = readFileSync(configPath, 'utf8');
  const result = await wireNRules(source, synthRules);

  switch (result.status) {
    case 'already-wired':
      console.log(`  [synth-wire] ✓ all synthesized rules confirmed in ${configPath} (idempotent — no change)`);
      break;
    case 'wired':
      writeFileSync(configPath, result.modified, 'utf8');
      console.log(`  [synth-wire] ✓ synthesized rules wired into ${configPath}`);
      break;
    case 'degrade':
      console.log(
        `  · synth-and-wire: could not auto-wire (${result.degradeReason ?? 'unknown'}).` +
        `\n    Add the rules-as-tests slice manually to ${configPath}:` +
        `\n    (run \`npx tsx synth-and-wire.ts --stack ${stack} --dry-run\` to preview)`,
      );
      break;
    case 'unrecognised':
      console.log(
        `  · synth-and-wire: unrecognised export shape in ${configPath} — add rules-as-tests slice manually.`,
      );
      break;
  }

  process.exit(0);
}

// Only run as CLI; when imported as a module, skip main() (allows unit-testing imports)
if (process.argv[1] && process.argv[1].endsWith('synth-and-wire.ts')) {
  main().catch((err) => {
    console.error('synth-and-wire fatal:', err);
    process.exit(0); // rc=0 — install must not abort
  });
}
