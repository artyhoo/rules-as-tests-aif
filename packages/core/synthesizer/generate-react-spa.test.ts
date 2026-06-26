// Stage 4 — L4-verdict tests for synthesizeGenerate (recipe-less generate-path) — React SPA.
// Mirrors generate.test.ts (React Native) for SPA parity (GH #727).
// Testable surface = the L4 verdict on the output + rule firing, NOT the plan bytes.
// Stubs inject deterministic selections; no live LLM calls (no-paid-llm-in-ci.md).
// Principle 02 (paired-negative): bad fixture (no ErrorBoundary) + good fixture (with ErrorBoundary).
// Oracle coverage (T7): emitted set covers R-SPA-EB/R-SPA-A11Y/R-SPA-HOOKS from RULES.react-spa.md.
//
// Design note on R-SPA-EB (manual vs eslint):
//   require-error-boundary is a glob-scoped rule (valid only on app-root files).
//   The L4 tautology gate runs eslint rules against a generic JSX negative-corpus
//   (unrelated.tsx), which has JSX without an ErrorBoundary → the rule fires tautologically.
//   This is correct behaviour for a scoped rule. So R-SPA-EB is emitted as check.type:'manual'
//   (same honesty as RN R14/R15 which are plugin rules outside KNOWN_PLUGINS).
//   Test (b) verifies the rule itself works via a direct Linter call, NOT through the L4 path.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';
import { synthesizeGenerate } from './generate.ts';
import { stubGenerateReactSPA } from './generate-stubs.ts';
import { validate } from '../validator/validate.ts';
import type { ResearchPlan } from '../research/types.ts';
import spaPlugin from '@rules-as-tests/preset-react-spa/eslint-rules';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, 'fixtures');

// Frozen SPA ResearchPlan — recipe-less proving case (no recipes/*.json for react-spa)
const spaPlan: ResearchPlan = JSON.parse(
  readFileSync(resolve(FIXTURES, 'react-spa-research-plan.json'), 'utf8'),
) as ResearchPlan;

// R-SPA-EB fixture strings — SOURCE of truth; gate reads strings, not files
const ebBadCode = readFileSync(resolve(FIXTURES, 'error-boundary.bad.tsx'), 'utf8');
const ebGoodCode = readFileSync(resolve(FIXTURES, 'error-boundary.good.tsx'), 'utf8');

describe('synthesizeGenerate — Stage 4 recipe-less generate-path (React SPA)', () => {
  // (a) L4 accepts: validate(synthesizeGenerate(spaPlan, stubGenerateReactSPA)).ok === true
  // All 3 SPA rules are manual → tautology gate n/a, rule-tester gate n/a → plan valid.
  it('(a) stubGenerateReactSPA: L4 accepts the generated SynthesisPlan', async () => {
    const plan = await synthesizeGenerate(spaPlan, stubGenerateReactSPA);
    const report = validate(plan);
    expect(report.ok).toBe(true);
  });

  // (b) R-SPA-EB require-error-boundary fires on error-boundary.bad.tsx, clean on .good.tsx.
  // Direct Linter call (not mediated by L4 pipeline) — rule is glob-scoped so must be
  // verified against targeted fixtures, not the generic negative-corpus.
  it('(b) require-error-boundary: fires on bad code (no ErrorBoundary), clean on good code', () => {
    const ruleName = 'rules-as-tests/require-error-boundary';
    const config: Linter.Config[] = [
      {
        files: ['**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
          parser: tseslintParser,
          parserOptions: {
            ecmaFeatures: { jsx: true },
            ecmaVersion: 'latest',
            sourceType: 'module',
          },
        },
        plugins: { 'rules-as-tests': spaPlugin },
        rules: { [ruleName]: 'error' },
      },
    ] as unknown as Linter.Config[];
    const linter = new Linter();

    // Bad: no ErrorBoundary in JSX tree — rule must fire
    const badMessages = linter.verify(ebBadCode, config, { filename: 'error-boundary.bad.tsx' });
    expect(badMessages.some((m) => m.ruleId === ruleName)).toBe(true);

    // Good: ErrorBoundary present as ancestor — rule must be clean
    const goodMessages = linter.verify(ebGoodCode, config, { filename: 'error-boundary.good.tsx' });
    expect(goodMessages.filter((m) => m.ruleId === ruleName)).toHaveLength(0);
  });
});

// T7 — Oracle coverage: emitted rule set covers RULES.react-spa.md oracle IDs.
// All 3 SPA rules are manual — honest about harness limits:
//   R-SPA-EB: glob-scoped rule, tautological on generic corpus → manual (not a KNOWN_PLUGINS gap)
//   R-SPA-A11Y + R-SPA-HOOKS: third-party plugin rules → manual (not in KNOWN_PLUGINS)
describe('synthesizeGenerate — oracle coverage against RULES.react-spa.md', () => {
  it('covers R-SPA-EB (spa-error-boundary) as manual (glob-scoped rule, tautological on corpus)', async () => {
    const plan = await synthesizeGenerate(spaPlan, stubGenerateReactSPA);
    const eb = plan.rules.find((r) => r.research.entryId === 'spa-error-boundary');
    expect(eb).toBeDefined();
    expect(eb?.check.type).toBe('manual');
  });

  it('covers R-SPA-A11Y (spa-a11y) as manual (plugin rule, not in L4 KNOWN_PLUGINS)', async () => {
    const plan = await synthesizeGenerate(spaPlan, stubGenerateReactSPA);
    const a11y = plan.rules.find((r) => r.research.entryId === 'spa-a11y');
    expect(a11y).toBeDefined();
    expect(a11y?.check.type).toBe('manual');
  });

  it('covers R-SPA-HOOKS (spa-hooks) as manual (plugin rule, not in L4 KNOWN_PLUGINS)', async () => {
    const plan = await synthesizeGenerate(spaPlan, stubGenerateReactSPA);
    const hooks = plan.rules.find((r) => r.research.entryId === 'spa-hooks');
    expect(hooks).toBeDefined();
    expect(hooks?.check.type).toBe('manual');
  });

  it('total coverage: all 3 oracle entry IDs present in emitted rule set', async () => {
    const plan = await synthesizeGenerate(spaPlan, stubGenerateReactSPA);
    const coveredEntryIds = plan.rules.map((r) => r.research.entryId);
    // R-SPA-EB + R-SPA-A11Y + R-SPA-HOOKS (all manual — factory selected the right rules)
    expect(coveredEntryIds).toContain('spa-error-boundary');
    expect(coveredEntryIds).toContain('spa-a11y');
    expect(coveredEntryIds).toContain('spa-hooks');
    // Proof: recipe-less path produced all 3 SPA oracle rules with NO recipe file present
    const allRules = plan.rules;
    expect(allRules.length).toBe(3);
  });
});
