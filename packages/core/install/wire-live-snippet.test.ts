/**
 * wire-live-snippet.test.ts — the live-research-default-delivery oracle (kickoff §6, T15).
 *
 * THIS is the non-vacuous live-path proof (principle 28 stays recipe-sourced + unmodified — §4).
 * It exercises the real disconnect-fix path end-to-end, $0/no-network:
 *   (1) build the LIVE snippet deterministically from the committed no-head-element fixtures via
 *       synthesizeGenerate(FileResearchClient, FileGenerateClient) — the same builder the live
 *       install path uses (rule-bootstrap-live.test.ts);
 *   (2) build the preset baseline rule set from the react-next recipes (as principle 28 does);
 *   (3) mergeLiveRules(preset, live) — the augment-first union with live precedence;
 *   (4) wireNRules(presetTemplateSource, merged, { overrideKeys }) — REUSE the ts-morph wirer.
 *
 * Three arms, each able to fail (T-LRD-A «green-but-inert»):
 *   Positive   — the generated no-head selector lands in the config AND the preset R12/R14/R20
 *                are retained (augment, not replace).
 *   Negative 1 — absent/empty snippet ⇒ merged == preset ⇒ already-wired byte-identical
 *                (this is what keeps the §5 byte-identical baselines green).
 *   Negative 2 — a live rule reusing R12's id with a different value ⇒ the merged config carries
 *                the LIVE value (D2 live-wins); the paired-negative (no overrideKeys) proves the
 *                override path — not presence-only wiring — is what flips it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadEntries } from '../research/load.ts';
import { synthesize } from '../synthesizer/synthesize.ts';
import { synthesizeGenerate } from '../synthesizer/generate.ts';
import { FileResearchClient, FileGenerateClient, withManualDrop } from '../synthesizer/file-clients.ts';
import { wireNRules } from './wire-eslint-r2.ts';
import { mergeLiveRules } from './synth-and-wire.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');
const TEMPLATE = resolve(REPO_ROOT, 'packages/preset-next-15-canonical/templates/eslint.config.react.mjs');
const RESEARCH = resolve(HERE, '../synthesizer/fixtures/no-head-element.research.json');
const SELECTION = resolve(HERE, '../synthesizer/fixtures/no-head-element.selection.json');

const TS_MORPH_AVAILABLE =
  existsSync(resolve(REPO_ROOT, 'node_modules/ts-morph/package.json')) ||
  existsSync(resolve(REPO_ROOT, 'packages/core/node_modules/ts-morph/package.json'));

const R12 = 'rules-as-tests/no-server-imports-in-client';
const HEAD_SELECTOR = "JSXOpeningElement[name.name='head']";
const R14_SELECTOR_FRAGMENT = "callee.property.name='safeParse'";
const R20_SELECTOR_FRAGMENT = "Literal[value='use server']";

/** Preset baseline rule set — react-next recipes (mirrors principle 28 ORACLE_CONFIG). */
function presetRules(): Record<string, unknown> {
  const entries = loadEntries('next', '15.4.0', [
    'next-r12-no-server-imports-in-client',
    'next-r14-require-form-safe-parse',
    'next-r20-require-use-server-directive',
  ]);
  const plan = synthesize({ framework: 'next', version: '15.4.0', patterns: entries, missing: [], drift: null });
  return JSON.parse(plan.eslintConfigSnippet) as Record<string, unknown>;
}

/** LIVE snippet rules built from the committed no-head-element fixtures ($0, no network). */
async function liveSnippetRules(): Promise<Record<string, unknown>> {
  const researchClient = new FileResearchClient(RESEARCH);
  const generateClient = withManualDrop(new FileGenerateClient(SELECTION), () => {});
  const plan = await researchClient.research({} as never);
  const synthPlan = await synthesizeGenerate(plan, generateClient);
  return JSON.parse(synthPlan.eslintConfigSnippet) as Record<string, unknown>;
}

describe('live-research-default-delivery — wire the live snippet into the preset config', () => {
  it('fixtures + preset template exist (non-vacuous)', () => {
    expect(existsSync(TEMPLATE)).toBe(true);
    expect(existsSync(RESEARCH)).toBe(true);
    expect(existsSync(SELECTION)).toBe(true);
  });

  it('the live snippet genuinely carries the no-head selector (oracle source is real)', async () => {
    const live = await liveSnippetRules();
    expect(JSON.stringify(live)).toContain(HEAD_SELECTOR);
  });

  it.skipIf(!TS_MORPH_AVAILABLE)(
    'Positive (augment) — generated no-head selector lands AND preset R12/R14/R20 retained',
    async () => {
      const preset = presetRules();
      const live = await liveSnippetRules();
      const { rules: merged, overrideKeys } = mergeLiveRules(preset, live);

      const templateSource = readFileSync(TEMPLATE, 'utf8');
      const result = await wireNRules(templateSource, merged, { overrideKeys });

      expect(result.status).toBe('wired');
      // The live rule landed — literal selector present (T-LRD-A: not merely "the step ran").
      expect(result.modified).toContain(HEAD_SELECTOR);
      // Presets retained (augment, not replace).
      expect(result.modified).toContain(`'${R12}'`);
      expect(result.modified).toContain(R14_SELECTOR_FRAGMENT);
      expect(result.modified).toContain(R20_SELECTOR_FRAGMENT);
    },
  );

  it.skipIf(!TS_MORPH_AVAILABLE)(
    'Negative 1 (absent snippet) — merged == preset ⇒ already-wired byte-identical',
    async () => {
      const preset = presetRules();
      const { rules: merged, overrideKeys } = mergeLiveRules(preset, {});
      const templateSource = readFileSync(TEMPLATE, 'utf8');
      const result = await wireNRules(templateSource, merged, { overrideKeys });

      expect(result.status).toBe('already-wired');
      expect(result.modified).toBe(templateSource);
      // The live-only selector must NOT have appeared.
      expect(result.modified).not.toContain(HEAD_SELECTOR);
    },
  );

  it.skipIf(!TS_MORPH_AVAILABLE)(
    'Negative 2 (override / D2 live-wins) — live R12 value overrides the preset value',
    async () => {
      const preset = presetRules();
      // A live rule reusing R12's id with a different value (severity flip).
      const live = { [R12]: 'warn' };
      const { rules: merged, overrideKeys } = mergeLiveRules(preset, live);
      expect(overrideKeys.has(R12)).toBe(true);

      const templateSource = readFileSync(TEMPLATE, 'utf8');
      const result = await wireNRules(templateSource, merged, { overrideKeys });

      expect(result.status).toBe('wired');
      // The R12 block now carries the LIVE value.
      expect(result.modified).toMatch(new RegExp(`${R12}'\\s*:\\s*["']warn["']`));
    },
  );

  it.skipIf(!TS_MORPH_AVAILABLE)(
    'Negative 2 paired-negative — WITHOUT overrideKeys the preset R12 value is kept (non-vacuity)',
    async () => {
      const templateSource = readFileSync(TEMPLATE, 'utf8');
      // Same live value, but drop overrideKeys → presence-only wiring keeps the preset 'error'.
      const result = await wireNRules(templateSource, { [R12]: 'warn' }, {});
      expect(result.status).toBe('already-wired');
      expect(result.modified).toBe(templateSource);
      expect(result.modified).not.toMatch(new RegExp(`${R12}'\\s*:\\s*["']warn["']`));
    },
  );
});
