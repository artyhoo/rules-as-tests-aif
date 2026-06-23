# S4 — forbid compilation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the generator compile a `declarative` forbid spec into ESLint-rule data + a *generated* `RULES.md` fragment + a provenance header, with no handwritten per-forbid template — activating S3 gates 7-8 on the emitted rule.

**Architecture:** Extend the existing `synthesize → emit` path (Path A). Compilation of `selector → no-restricted-syntax` already exists (`synthesize.ts:89-102`) and is end-to-end tested (`synthesize.test.ts:116`). S4 adds: (1) generate `rulesMd` from the declarative spec instead of `recipe.rulesMdTemplate`; (2) a provenance header in `emit.ts` backed by a shared canonical-hash util (S5 will import it); (3) a validator fixture carrying a declarative forbid so gates 7-8 go `n/a → pass`; (4) a calibration note on gate 7. Detector auto-activation is OUT (G-seed) — the run is proven via `--from-research`.

**Tech Stack:** TypeScript (ESM, `.ts` extensions in imports), Vitest, ESLint `Linter` flat config, Ajv (draft-07, `strict:false`), Node `crypto`. Design SSOT: [`s4-forbid-compilation-design.md`](s4-forbid-compilation-design.md).

---

## Preflight (read once, before Task 1)

- [ ] **P1 — workspace that can run tests.** The host worktree under `.claude/worktrees/` is excluded by `packages/core/vitest.config.ts` and has no `node_modules`. Run tests from a `/tmp/<name>` git worktree with `node_modules` symlinked from the main checkout, OR from the main checkout. Verify: `cd packages/core && npx vitest run synthesizer/synthesize.test.ts` exits 0 before starting.
- [ ] **P2 — baseline green.** `cd packages/core && npx tsc --noEmit` exits 0 and `npx vitest run` is all-green on the branch base. (tsx/vitest do NOT type-check strictly — always run `tsc --noEmit` before any push.)

---

## Task 1: Make `rulesMdTemplate` optional for declarative recipes (schema)

**Files:**
- Modify: `packages/core/synthesizer/recipe.schema.json` (the `required` array at line 7 + add `if/then`)
- Test: `packages/core/synthesizer/synthesize.test.ts`

- [ ] **Step 1: Write the failing test** — a declarative recipe with NO `rulesMdTemplate` must load. Append to `synthesize.test.ts` inside the existing `describe`:

```typescript
it('loads a declarative recipe that omits rulesMdTemplate (data-only)', () => {
  // test-only-forbid-declarative.json will drop rulesMdTemplate in Task 2.
  // Until then this asserts the schema permits the omission.
  const result = synthesize(
    plan({ patterns: [entry('test-only-forbid-declarative')] }),
  );
  expect(result.rules).toHaveLength(1);
  expect(result.rules[0].check.type).toBe('declarative');
});
```

- [ ] **Step 2: Run it — expect PASS now (template still present), it locks the contract.** `cd packages/core && npx vitest run synthesizer/synthesize.test.ts -t 'data-only'` → PASS. (The real failing assertion arrives in Task 2 once the template is removed; this step wires the test.)

- [ ] **Step 3: Make schema accept the omission.** In `recipe.schema.json` remove `"rulesMdTemplate"` from the top-level `required` (line 7), and add a conditional so non-declarative recipes still require it. After the `properties` block, add a top-level `if/then`:

```json
"if": {
  "properties": { "rule": { "properties": { "check": { "properties": { "type": { "const": "declarative" } } } } } }
},
"then": {
  "required": ["patternId", "appliesTo", "rule", "eslintRuleConfig"]
},
"else": {
  "required": ["patternId", "appliesTo", "rule", "rulesMdTemplate", "eslintRuleConfig"]
}
```

Keep `rulesMdTemplate` in `properties` (still a valid optional field).

- [ ] **Step 4: Run schema + existing recipe tests.** `cd packages/core && npx vitest run synthesizer/` → all PASS (the 5 non-declarative recipes still validate; declarative is now permitted without the template).

- [ ] **Step 5: Commit.**

```bash
git add packages/core/synthesizer/recipe.schema.json packages/core/synthesizer/synthesize.test.ts
git commit -m "feat(synthesizer): S4 — make rulesMdTemplate optional for declarative recipes (if/then)"
```

---

## Task 2: Compile `rulesMd` from the declarative spec

**Files:**
- Create: `packages/core/synthesizer/compile-declarative-md.ts`
- Modify: `packages/core/synthesizer/synthesize.ts:82` (the `mdFragments.push(...)` line)
- Modify: `packages/core/synthesizer/recipes/test-only-forbid-declarative.json` (drop `rulesMdTemplate`)
- Test: `packages/core/synthesizer/compile-declarative-md.test.ts` (create), `synthesize.test.ts`

- [ ] **Step 1: Write the failing unit test** for the new pure helper. Create `compile-declarative-md.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { compileDeclarativeMd } from './compile-declarative-md.ts';
import type { SynthesizedRule } from './types.ts';

const rule = (): SynthesizedRule => ({
  id: 'G1',
  title: 'Forbid `.only` in test calls',
  stack: ['react-next'],
  check: {
    type: 'declarative',
    engine: 'eslint-restricted',
    selector: "CallExpression[callee.property.name='only']",
    message: 'remove .only — it silently disables sibling tests',
    presence: 'forbid',
  },
  examples: { bad: 'it.only(...)', good: 'it(...)' },
  research: { entryId: 'test-only-forbid-declarative', provenance: [] },
});

describe('compileDeclarativeMd — generate RULES.md fragment from a declarative spec', () => {
  it('renders a heading with the assigned id and title', () => {
    const md = compileDeclarativeMd(rule());
    expect(md).toContain('## G1 — Forbid `.only` in test calls');
  });

  it('includes the forbid message and selector (no handwritten template)', () => {
    const md = compileDeclarativeMd(rule());
    expect(md).toContain('remove .only — it silently disables sibling tests');
    expect(md).toContain("CallExpression[callee.property.name='only']");
  });

  it('marks the check as a declarative forbid', () => {
    const md = compileDeclarativeMd(rule());
    expect(md.toLowerCase()).toContain('forbid');
    expect(md).toContain('no-restricted-syntax');
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.** `cd packages/core && npx vitest run synthesizer/compile-declarative-md.test.ts` → FAIL ("Cannot find module './compile-declarative-md.ts'").

- [ ] **Step 3: Implement the helper.** Create `compile-declarative-md.ts`:

```typescript
// S4: deterministic RULES.md fragment generated from a declarative forbid spec.
// Replaces the per-recipe handwritten rulesMdTemplate for check.type==='declarative'
// (T-MVP-A: a new forbid is added as data, not a handwritten template).
import type { SynthesizedRule } from './types.ts';

export function compileDeclarativeMd(rule: SynthesizedRule): string {
  if (rule.check.type !== 'declarative') {
    throw new Error(`compileDeclarativeMd called on non-declarative rule ${rule.id}`);
  }
  const { selector, message, engine } = rule.check;
  const engineName = engine ?? 'eslint-restricted';
  const runner =
    engineName === 'eslint-restricted' ? 'no-restricted-syntax' : engineName;
  const why = message ?? 'forbidden construct';
  return [
    `## ${rule.id} — ${rule.title}`,
    '',
    `**Stack:** ${rule.stack.join(', ')}  `,
    `**Check:** declarative \`${runner}\` forbid (${engineName} engine)  `,
    `**Selector:** \`${selector}\`  `,
    `**Why:** ${why}`,
    '',
  ].join('\n');
}
```

- [ ] **Step 4: Run the helper test — expect PASS.** `cd packages/core && npx vitest run synthesizer/compile-declarative-md.test.ts` → PASS.

- [ ] **Step 5: Wire into `synthesize.ts`.** Replace the single `mdFragments.push(...)` at line 82:

```typescript
// was: mdFragments.push(recipe.rulesMdTemplate.replace(/\{\{id\}\}/g, id));
if (rule.check.type === 'declarative') {
  mdFragments.push(compileDeclarativeMd(rule));
} else {
  mdFragments.push(recipe.rulesMdTemplate.replace(/\{\{id\}\}/g, id));
}
```

Add the import at the top: `import { compileDeclarativeMd } from './compile-declarative-md.ts';`. Also update the `Recipe` interface (`synthesize.ts:19-25`): change `rulesMdTemplate: string;` to `rulesMdTemplate?: string;`.

- [ ] **Step 6: Make the recipe data-only.** In `recipes/test-only-forbid-declarative.json`, delete the `"rulesMdTemplate": "..."` line (and the trailing comma fixup). The recipe now carries data only.

- [ ] **Step 7: Add the synthesize-level assertion.** Append to `synthesize.test.ts`:

```typescript
it('generates rulesMd for a declarative forbid from spec, not from a template', () => {
  const result = synthesize(
    plan({ patterns: [entry('test-only-forbid-declarative')] }),
  );
  expect(result.rulesMd).toContain('## G1 — Forbid `.only` in test calls');
  expect(result.rulesMd).toContain('no-restricted-syntax');
});
```

- [ ] **Step 8: Run synthesizer tests + tsc — expect PASS.** `cd packages/core && npx vitest run synthesizer/ && npx tsc --noEmit` → all PASS, exit 0.

- [ ] **Step 9: Commit.**

```bash
git add packages/core/synthesizer/compile-declarative-md.ts packages/core/synthesizer/compile-declarative-md.test.ts packages/core/synthesizer/synthesize.ts packages/core/synthesizer/recipes/test-only-forbid-declarative.json packages/core/synthesizer/synthesize.test.ts
git commit -m "feat(synthesizer): S4 — compile rulesMd from declarative spec (drop per-recipe template)"
```

---

## Task 3: Canonical rule-hash util (shared with S5)

**Files:**
- Create: `packages/core/synthesizer/canonical-rule-hash.ts`
- Test: `packages/core/synthesizer/canonical-rule-hash.test.ts`

- [ ] **Step 1: Write the failing test.** Create `canonical-rule-hash.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { canonicalRuleHash } from './canonical-rule-hash.ts';
import type { SynthesizedRule } from './types.ts';

const rule = (selector: string): SynthesizedRule => ({
  id: 'G1',
  title: 'T',
  stack: ['react-next'],
  check: { type: 'declarative', engine: 'eslint-restricted', selector, message: 'm', presence: 'forbid' },
  examples: { bad: 'a', good: 'b' },
  research: { entryId: 'x', provenance: [] },
});

describe('canonicalRuleHash — deterministic content hash for provenance', () => {
  it('is stable across calls for identical content', () => {
    expect(canonicalRuleHash(rule('S'))).toBe(canonicalRuleHash(rule('S')));
  });

  it('is a 64-char hex sha256', () => {
    expect(canonicalRuleHash(rule('S'))).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when identity-bearing content changes', () => {
    expect(canonicalRuleHash(rule('S1'))).not.toBe(canonicalRuleHash(rule('S2')));
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.** `cd packages/core && npx vitest run synthesizer/canonical-rule-hash.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement.** Create `canonical-rule-hash.ts`:

```typescript
// S4: deterministic content hash over a rule's identity-bearing fields.
// S5's anti-hand-edit gate imports THIS function (single source of truth).
// Hashes canonical (key-sorted) JSON of check + examples + title — stable
// against reformatting, sensitive to semantic edits.
import { createHash } from 'node:crypto';
import type { SynthesizedRule } from './types.ts';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = canonicalize((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

export function canonicalRuleHash(rule: SynthesizedRule): string {
  const identity = { title: rule.title, check: rule.check, examples: rule.examples };
  const json = JSON.stringify(canonicalize(identity));
  return createHash('sha256').update(json).digest('hex');
}
```

- [ ] **Step 4: Run — expect PASS.** `cd packages/core && npx vitest run synthesizer/canonical-rule-hash.test.ts` → PASS.

- [ ] **Step 5: Commit.**

```bash
git add packages/core/synthesizer/canonical-rule-hash.ts packages/core/synthesizer/canonical-rule-hash.test.ts
git commit -m "feat(synthesizer): S4 — canonical rule-hash util (shared with S5 anti-hand-edit gate)"
```

---

## Task 4: Provenance header in `emit.ts`

**Files:**
- Modify: `packages/core/synthesizer/emit.ts`
- Test: `packages/core/synthesizer/emit.test.ts`

- [ ] **Step 1: Write the failing test.** Append to `emit.test.ts` (uses the existing `plan`/`entry` helpers; add a declarative entry):

```typescript
it('writes a provenance header for declarative rules (generated-marker + hash)', () => {
  const synthPlan = synthesize(
    plan({ patterns: [entry('test-only-forbid-declarative')] }),
  );
  emit(synthPlan, dir);
  const prov = JSON.parse(
    readFileSync(resolve(dir, 'provenance.json'), 'utf8'),
  );
  expect(prov.generatedBy).toBe('rules-as-tests-synth');
  expect(prov.rules.G1.contentHash).toMatch(/^[0-9a-f]{64}$/);
  expect(prov.rules.G1.source.entryId).toBe('test-only-forbid-declarative');
});
```

- [ ] **Step 2: Run it — expect FAIL.** `cd packages/core && npx vitest run synthesizer/emit.test.ts -t provenance` → FAIL (no `provenance.json`).

- [ ] **Step 3: Implement.** In `emit.ts`, import the hash util and write a 4th file. Add at top: `import { canonicalRuleHash } from './canonical-rule-hash.ts';`. After the existing three `writeFileSync` calls, add:

```typescript
const provenance: Record<string, unknown> = {
  generatedBy: 'rules-as-tests-synth',
  note: 'GENERATED — do not edit emitted rule files by hand; regenerate via the synthesizer. S5 enforces this.',
  rules: {} as Record<string, unknown>,
};
for (const rule of plan.rules) {
  (provenance.rules as Record<string, unknown>)[rule.id] = {
    source: { entryId: rule.research.entryId, provenance: rule.research.provenance },
    contentHash: canonicalRuleHash(rule),
  };
}
writeFileSync(
  resolve(dir, 'provenance.json'),
  JSON.stringify(provenance, null, 2) + '\n',
);
```

- [ ] **Step 4: Run emit tests + confirm idempotence still holds.** `cd packages/core && npx vitest run synthesizer/emit.test.ts` → all PASS (the existing idempotence test covers manifest; provenance is deterministic via the canonical hash).

- [ ] **Step 5: Run tsc.** `cd packages/core && npx tsc --noEmit` → exit 0.

- [ ] **Step 6: Check L5 installer snapshot.** `cd packages/core && npx vitest run` — if an installer snapshot embeds emitted files and now fails, regenerate it in the same commit (memory lesson: emit-shape change ripples to L5). If no installer test references emitted file output, skip.

- [ ] **Step 7: Commit.**

```bash
git add packages/core/synthesizer/emit.ts packages/core/synthesizer/emit.test.ts
git commit -m "feat(synthesizer): S4 — emit provenance.json (generated-marker + content-hash) for sole-writer / S5"
```

---

## Task 5: Activate S3 gates 7-8 on a fixture declarative forbid

**Files:**
- Modify: `packages/core/validator/snapshot.test.ts` (the `fixturePlan()` factory)
- Modify: `packages/core/validator/expected-fixture-validate.json` (regenerate)

- [ ] **Step 1: Add the declarative forbid to the fixture plan.** In `snapshot.test.ts`, add to the `fixturePlan()` `patterns` array a 4th entry:

```typescript
entry('test-only-forbid-declarative'),
```

- [ ] **Step 2: Run the snapshot test — expect FAIL (snapshot drift).** `cd packages/core && npx vitest run validator/snapshot.test.ts` → FAIL: `singleTokenDiff` and `messageIdCoverage` move from `n/a` to `pass`, `ruleTester` stays `pass`, `autofixClean` stays `n/a` (forbid has no fixer).

- [ ] **Step 3: Inspect the new report to confirm the expected transition.** Add a temporary `console.log(JSON.stringify(report, null, 2))` OR diff the vitest output. Confirm: `singleTokenDiff: pass`, `messageIdCoverage: pass`, `autofixClean: n/a`, `ok: true`. This is the live activation evidence (T2/T3).

- [ ] **Step 4: Regenerate `expected-fixture-validate.json`** to the new report (set `singleTokenDiff.status` and `messageIdCoverage.status` to `"pass"`; leave `autofixClean` `"n/a"`).

- [ ] **Step 5: Run — expect PASS.** `cd packages/core && npx vitest run validator/snapshot.test.ts` → PASS.

- [ ] **Step 6: Commit.**

```bash
git add packages/core/validator/snapshot.test.ts packages/core/validator/expected-fixture-validate.json
git commit -m "test(validator): S4 — fixture declarative forbid activates gates 7-8 (n/a → pass)"
```

---

## Task 6: End-to-end `--from-research` run evidence + gate-7 calibration note

**Files:**
- Create: `packages/core/synthesizer/fixtures/s4-declarative-research-plan.json` (a `ResearchPlan`)
- Modify: `packages/core/validator/gate-single-token-diff.ts:9-15` (comment only)

- [ ] **Step 1: Create the `--from-research` input.** Create `fixtures/s4-declarative-research-plan.json`:

```json
{
  "framework": "next",
  "version": "16.0.0",
  "patterns": [
    {
      "id": "test-only-forbid-declarative",
      "summary": "Forbid .only in test calls — it silently disables sibling tests.",
      "bestPractices": ["Remove .only before commit; use --testNamePattern for focused local runs."],
      "antiPatterns": ["Committing it.only/describe.only — CI passes while most tests are skipped."],
      "provenance": [
        { "url": "https://nextjs.org/docs/app", "allowlistKey": "next.official", "fetchedAt": "2026-05-08" }
      ]
    }
  ],
  "missing": [],
  "drift": null
}
```

- [ ] **Step 2: Run the generator end-to-end and capture output (acceptance §4 evidence).**

```bash
cd packages/core
# synthesizer accepts --from-research: emits the SynthesisPlan on stdout AND the
# 3 artifacts via --output. Capture stdout as the SynthesisPlan for the validator.
npx tsx synthesizer/cli.ts --from-research synthesizer/fixtures/s4-declarative-research-plan.json --output /tmp/s4-emit > /tmp/s4-synth.json
echo "--- eslint-rules-snippet.json ---"; cat /tmp/s4-emit/eslint-rules-snippet.json
echo "--- RULES-additions.md ---";        cat /tmp/s4-emit/RULES-additions.md
echo "--- provenance.json ---";           cat /tmp/s4-emit/provenance.json
# validator accepts --from-synth (a SynthesisPlan), NOT --from-research (cli.ts:4-7).
echo "--- validate report (gates) ---";   npx tsx validator/cli.ts --from-synth /tmp/s4-synth.json
```

Expected: `eslint-rules-snippet.json` has `no-restricted-syntax` with the `.only` selector; `RULES-additions.md` has the generated `## G1 — Forbid` heading (no template text); `provenance.json` has `G1.contentHash`; the validate report shows `singleTokenDiff: pass`, `messageIdCoverage: pass`, `autofixClean: n/a`, `ok: true`. **Paste this output into the PR body** (T2/T3 — "run", not "would").

- [ ] **Step 3: Calibrate the gate-7 comment.** In `gate-single-token-diff.ts`, replace the lines stating "no real pair exists yet (until S4 this gate is n/a…)" with the measured fact:

```typescript
// THRESHOLD: MAX_TOKEN_EDITS = 5 is a CONSERVATIVE bound. CALIBRATED at S4
// against the first real declarative pair (`it.only(...)` vs `it(...)`),
// which measures token-distance = 1 — confirming real forbid pairs are ≈1
// token (the umbrella §S3 ideal). The threshold 5 stays a conservative-safe
// upper bound; tighten only if a future pair class proves a lower ceiling.
```

- [ ] **Step 4: Run the gate's adversarial test (unchanged behavior).** `cd packages/core && npx vitest run validator/gate-single-token-diff.adversarial.test.ts` → PASS (comment-only change; 22-edit BAD fixture still rejected).

- [ ] **Step 5: Commit.**

```bash
git add packages/core/synthesizer/fixtures/s4-declarative-research-plan.json packages/core/validator/gate-single-token-diff.ts
git commit -m "test(synthesizer): S4 — --from-research e2e fixture + gate-7 calibration note (real pair = 1 token)"
```

---

## Task 7: Full verify + PR

- [ ] **Step 1: Whole-package green.** `cd packages/core && npx tsc --noEmit && npx vitest run` → exit 0, all green. Also run any installer (L5) + `to-aif-gate-result` tests; GATE_NAMES is unchanged (no new gate added) so those should pass untouched — confirm.
- [ ] **Step 2: Author PR body** with the §1.7 Forward/Backward-check blocks (meta-launch §4b — CI substance gate is strict). Headings MUST be `### §1.7 Forward-check applied` / `### §1.7 Backward-check applied`, ≥40 non-whitespace chars each, ≥1 `path:line` citation each. Include the Task 6 Step 2 captured output. `Prior-art:` trailer with SSOT consult per design §6.
- [ ] **Step 3: Pre-flight greps.**

```bash
grep -cE '^### §1\.7 (Forward|Backward)-check applied' /tmp/s4-prbody.md   # must be 2
grep -cE '[^[:space:]]+\.[a-z]+:[0-9]+' /tmp/s4-prbody.md                  # must be >=2
```

- [ ] **Step 4: Phase -1 cold-review** (reviewer role, `requesting-code-review`) on `git diff staging...<branch>` against design acceptance §7. Max 1 REVISE.
- [ ] **Step 5: PR to staging + auto-merge.**

```bash
gh pr create --base staging --head <branch> --title "feat(synthesizer): S4 forbid compilation (generator-forbid-mvp)" --body-file /tmp/s4-prbody.md
gh pr merge <N> --auto --squash
```

---

## Self-Review (filled by author before handoff)

- **Spec coverage:** design §3.1→Task 2; §3.2→Tasks 3-4; §3.3→Tasks 5-6; §3.4→Task 6 Step 3; §2.1 (drop template)→Tasks 1-2; §2.4 (detector OUT, from-research)→Task 6. All §7 acceptance bullets mapped.
- **Type consistency:** `compileDeclarativeMd(rule: SynthesizedRule): string`, `canonicalRuleHash(rule: SynthesizedRule): string` — used identically in Tasks 2/3/4. `provenance.json` shape (`generatedBy`/`rules.<id>.contentHash`/`source.entryId`) consistent across Task 4 test + impl.
- **Placeholder scan:** no TBD/TODO; every code step shows the code; every run step shows the command + expected outcome.
- **Out of scope (do NOT do):** detector `patterns.ts` edit (G-seed); S5 CI hash-compare gate; ast-grep runner; require/type-aware codegen.

## See also

- [`s4-forbid-compilation-design.md`](s4-forbid-compilation-design.md) — design SSOT.
- [`.claude/orchestrator-prompts/generator-forbid-mvp-meta-launch/kickoff.md`](../../../.claude/orchestrator-prompts/generator-forbid-mvp-meta-launch/kickoff.md) — §4b §1.7 mandate, §4c aif-dispatch, §5 traps, §7 Phase -1.
