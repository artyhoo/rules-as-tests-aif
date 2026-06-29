/*
 * Principle 27 — the synthesizer-driven installer does not drift from the preset oracle.
 *
 * T-GIW-B discipline: the oracle (gold side) is the shipped preset template read as a
 * STATIC STRING; the generated side is the synthesizer output.  Never compare
 * `synth == synth` — that stays green even when the template (the real consumer baseline)
 * drifts.
 *
 * Two complementary guards:
 *
 *  A) Applied-to-config: wireNRules(presetTemplateSource, synthRules) → 'already-wired'.
 *     Proves the synthesized rules-as-tests slice is APPLIED in the preset template
 *     (the consumer's starting eslint.config.mjs). Goes RED if:
 *       • a recipe changes and the synthesizer emits a new rule not in the template
 *       • the template is edited to remove a synthesized rule
 *       • wireNRules has a bug that misidentifies presence
 *
 *  B) Paired-negative: inject a fake selector into synthRules → wireNRules returns
 *     'wired' (not 'already-wired').  Proves this test is non-vacuous: if the presence
 *     check were broken, the fake selector would pass and the positive arm would be
 *     meaningless.
 *
 * Companion to principle 26 (template selector sync). Principle 26 checks that each
 * synthesized SELECTOR string appears verbatim in the template source; principle 27 checks
 * that wireNRules() agrees the template is already wired — a higher-level integration
 * assertion that exercises the wirer's own presence logic.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesize } from '../synthesizer/synthesize.ts';
import { loadEntries } from '../research/load.ts';
// @ts-ignore — wireNRules is exported from wire-eslint-r2.ts (install module)
import { wireNRules } from '../install/wire-eslint-r2.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');

// ─── Oracle configuration ──────────────────────────────────────────────────────
// Mirrors packages/core/principles/26-template-selector-sync.test.ts WRAPPER_TEMPLATES.
// Both principles must agree on the framework/version/pattern set — divergence here
// means one of them is out of sync with the canonical install-time recipe set.
const ORACLE_CONFIG = {
  label: 'preset-next-15-canonical / eslint.config.react.mjs',
  template: 'packages/preset-next-15-canonical/templates/eslint.config.react.mjs',
  framework: 'next' as const,
  version: '15.4.0',
  patterns: [
    'next-r12-no-server-imports-in-client',
    'next-r14-require-form-safe-parse',
    'next-r20-require-use-server-directive',
  ],
} as const;

/** Run the deterministic synthesizer and return the parsed eslintConfigSnippet. */
function synthesizedRules(
  framework: string,
  version: string,
  patterns: readonly string[],
): Record<string, unknown> {
  const entries = loadEntries(framework, version, [...patterns]);
  const plan = synthesize({
    framework,
    version,
    patterns: entries,
    missing: [],
    drift: null,
  });
  return JSON.parse(plan.eslintConfigSnippet) as Record<string, unknown>;
}

describe('Principle 27 — synth-wire oracle: installed consumer config is not stale', () => {
  // Guard: at least one oracle config is registered
  it('at least one oracle config registered (non-vacuous)', () => {
    expect(ORACLE_CONFIG.patterns.length).toBeGreaterThan(0);
  });

  // A: wireNRules on the preset template returns already-wired
  it(
    `A: ${ORACLE_CONFIG.label} — wireNRules(templateSource, synthRules) → already-wired`,
    async () => {
      const synthRules = synthesizedRules(
        ORACLE_CONFIG.framework,
        ORACLE_CONFIG.version,
        ORACLE_CONFIG.patterns,
      );
      expect(Object.keys(synthRules).length, 'synthesizer emitted no rules — patterns wrong?').toBeGreaterThan(0);

      // Oracle: read the preset template as a static string (NOT re-run synthesize)
      // T-GIW-B: gold side = template file; never synth == synth
      const templateSource = readFileSync(resolve(REPO_ROOT, ORACLE_CONFIG.template), 'utf8');

      const result = await wireNRules(templateSource, synthRules);

      expect(
        result.status,
        `wireNRules reported '${result.status}' — the preset template is missing synthesized rules. ` +
          `Regenerate the template from the synthesizer (or update the recipe if the template intentionally diverges). ` +
          `Degraded: ${result.degradeReason ?? 'n/a'}`,
      ).toBe('already-wired');

      // Byte-identical: wireNRules must not modify when already-wired
      expect(result.modified, 'already-wired must be byte-identical').toBe(templateSource);
    },
  );

  // B: Paired-negative — fake selector → wireNRules returns 'wired' (not 'already-wired')
  // This falsifies T-GIW-B: if the presence check were broken, this would return 'already-wired'
  // and the A arm would be vacuous.
  it(
    `B: paired-negative — injecting a fake synthesized selector → wireNRules returns 'wired'`,
    async () => {
      const realRules = synthesizedRules(
        ORACLE_CONFIG.framework,
        ORACLE_CONFIG.version,
        ORACLE_CONFIG.patterns,
      );
      // Inject a completely fake rule that is NOT in the template
      const fakeRules = {
        ...realRules,
        'rules-as-tests/restricted-syntax-audit-exempt': [
          'error',
          ...(Array.isArray(realRules['rules-as-tests/restricted-syntax-audit-exempt'])
            ? (realRules['rules-as-tests/restricted-syntax-audit-exempt'] as unknown[]).slice(1)
            : []),
          // Fake selector that will NOT be found in the template
          { selector: '__FAKE_SELECTOR_THAT_DOES_NOT_EXIST__', message: 'fake' },
        ],
      };

      const templateSource = readFileSync(resolve(REPO_ROOT, ORACLE_CONFIG.template), 'utf8');
      const result = await wireNRules(templateSource, fakeRules);

      // Must NOT be already-wired — the fake selector is absent from the template
      expect(
        result.status,
        `paired-negative FAILED: wireNRules said '${result.status}' even though a fake selector was injected. ` +
          `The presence check is broken (vacuous positive in arm A).`,
      ).not.toBe('already-wired');
    },
  );

  // C: Paired-negative via simple rule injection
  it(
    `C: paired-negative — injecting a fake simple rule → wireNRules returns 'wired'`,
    async () => {
      const realRules = synthesizedRules(
        ORACLE_CONFIG.framework,
        ORACLE_CONFIG.version,
        ORACLE_CONFIG.patterns,
      );
      const fakeRules = {
        ...realRules,
        'rules-as-tests/__fake-rule-that-does-not-exist__': 'error',
      };

      const templateSource = readFileSync(resolve(REPO_ROOT, ORACLE_CONFIG.template), 'utf8');
      const result = await wireNRules(templateSource, fakeRules);

      expect(
        result.status,
        `paired-negative C FAILED: wireNRules said '${result.status}' even though a fake rule was injected.`,
      ).not.toBe('already-wired');
    },
  );
});
