/*
 * Principle 26 — a shipped eslint.config template may not drift from the generated rule selectors.
 *
 * The declarative rule tier compiles each recipe's {selector, message} into the synthesized
 * eslintConfigSnippet under the `rules-as-tests/restricted-syntax-audit-exempt` wrapper key. A
 * shipped consumer template that wires that wrapper HAND-INLINES the same selectors so the
 * canonical preset enforces them out-of-box (no `synth` run needed). That inline is a THIRD copy
 * of the selector (recipe -> generated snippet -> template) and nothing guarded it: a refined
 * recipe selector the template copy did not track would silently UNDER-ENFORCE in every consumer
 * — the project's own "documents lie; tests don't" gap, one level up (a hand-copied selector lies).
 *
 * This principle is that guard: every selector the synthesizer generates under the wrapper for a
 * preset MUST appear verbatim in that preset's shipped template. missingSelectors() is PURE
 * (template source + generated selectors) so it runs GREEN on the real tree AND RED on an inline
 * paired-negative — the principle-02 discipline that keeps the gate non-tautological.
 *
 * Companion to principle 25 (no DANGLING ref): 25 guards "a referenced rule has a backing export";
 * 26 guards "an inlined selector still matches its generating recipe". Together they bracket the
 * template-as-hand-copy risk from both ends.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesize } from '../synthesizer/synthesize.ts';
import { loadEntries } from '../research/load.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');

const WRAPPER_KEY = 'rules-as-tests/restricted-syntax-audit-exempt';

// Presets whose shipped template hand-inlines the audit-exempt wrapper selectors. Each maps the
// template to the recipe set the synthesizer compiles those selectors from (the SSOT). Mirrors
// the canonical-v15 pattern set used by tests/acceptance/canonical-regen.test.ts.
const WRAPPER_TEMPLATES = [
  {
    label: 'preset-next-15-canonical / eslint.config.react.mjs',
    template: 'packages/preset-next-15-canonical/templates/eslint.config.react.mjs',
    framework: 'next',
    version: '15.4.0',
    patterns: [
      'next-r12-no-server-imports-in-client',
      'next-r14-require-form-safe-parse',
      'next-r20-require-use-server-directive',
    ],
  },
] as const;

/** Selectors the synthesizer emits under the audit-exempt wrapper for a recipe set (the SSOT). */
function generatedWrapperSelectors(framework: string, version: string, patterns: string[]): string[] {
  const plan = synthesize({
    framework,
    version,
    patterns: loadEntries(framework, version, patterns),
  });
  const snippet = JSON.parse(plan.eslintConfigSnippet) as Record<string, unknown>;
  const entry = snippet[WRAPPER_KEY];
  if (!Array.isArray(entry)) return [];
  // entry = ['error', { selector, message }, ...] — drop the severity, keep the selector strings.
  return entry
    .slice(1)
    .map((e) => (e as { selector?: string }).selector)
    .filter((s): s is string => typeof s === 'string');
}

/** Generated selectors NOT present verbatim in the template source (i.e. the inline copy drifted). */
export function missingSelectors(templateSource: string, selectors: string[]): string[] {
  return selectors.filter((s) => !templateSource.includes(s));
}

describe('Principle 26 — shipped templates do not drift from generated rule selectors', () => {
  it('discovers at least one wrapper-using template (guard non-vacuous)', () => {
    expect(WRAPPER_TEMPLATES.length).toBeGreaterThan(0);
  });

  for (const t of WRAPPER_TEMPLATES) {
    it(`real-tree: ${t.label} inlines every generated audit-exempt selector verbatim`, () => {
      const selectors = generatedWrapperSelectors(t.framework, t.version, [...t.patterns]);
      expect(
        selectors.length,
        `synthesizer produced no ${WRAPPER_KEY} selectors for ${t.label} — recipe set wrong?`,
      ).toBeGreaterThan(0);

      const src = readFileSync(resolve(REPO_ROOT, t.template), 'utf8');
      expect(
        missingSelectors(src, selectors),
        `${t.label} is missing generated selector(s): the hand-inlined restricted-syntax-audit-exempt copy drifted from the recipe SSOT. Regenerate the template's wrapper block from the recipes (run \`npm --prefix packages/core run synth -- <consumer>\` and copy the selectors, or update the recipe).`,
      ).toEqual([]);
    });
  }

  // paired-negative: the guard MUST flag a template that dropped/changed a generated selector.
  it('paired-negative: missingSelectors flags a selector absent from the source', () => {
    const selectors = ['SELECTOR_A', 'SELECTOR_B'];
    expect(missingSelectors('only SELECTOR_A is present here', selectors)).toEqual(['SELECTOR_B']);
    expect(missingSelectors('both SELECTOR_A and SELECTOR_B are present', selectors)).toEqual([]);
  });
});
