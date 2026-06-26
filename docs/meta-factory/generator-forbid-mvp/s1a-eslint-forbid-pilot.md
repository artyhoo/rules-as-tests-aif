# S1a — ESLint forbid pilot (no-restricted-syntax selector-as-data)

> **Stage:** S1a of the generator-forbid-mvp umbrella.
> **Authoritative for:** the `.only` test-focus forbid pilot — selector data, fixture paths, run command, captured Linter.verify output, and the 4 pipeline anchor points for S2–S5.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## Principle chosen

**Forbid `.only` test focus** (`it.only`, `describe.only`, `test.only`).

When a test suite contains `.only`, all sibling tests in the file are silently skipped.
CI stays green while the skipped tests are not running — a silent regression gate bypass.

**Why this principle for the pilot:**
- Single selector, no type-information needed (acceptable false-positive: `describe` used as a
  shadowed identifier is rare and safe to flag).
- Not configured anywhere in this repo (`grep -rn no-restricted-syntax` → 0 hits before this PR).
- Free to implement as built-in ESLint `no-restricted-syntax` (zero new dependencies).

## Selector-as-data

```json
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "CallExpression[callee.object.name=/^(describe|it|test)$/][callee.property.name='only']",
      "message": "remove .only — it silently disables sibling tests"
    }
  ]
}
```

**Where this data would live in a recipe** (S2 anchor):
Today `check.type:"eslint"` carries a rule *name* string and the full config lives in the
recipe's top-level `eslintRuleConfig` field (see `nextjs-app-router.json` precedent).
S2 will add a new `check.type:"declarative"` variant where `selector` + `message` are fields
directly in `check` — no separate named rule, no `eslintRuleConfig` wrapper.

## Fixture files

| File | Role |
|---|---|
| `packages/core/synthesizer/pilot/no-only-test-focus.bad.ts` | BAD — contains `it.only(...)`, must be flagged |
| `packages/core/synthesizer/pilot/no-only-test-focus.good.ts` | GOOD — plain `it(...)`, must be clean |

**Naming constraint:** `.good.ts`/`.bad.ts` (not `.test.ts`) so vitest never collects a file
containing a real `it.only(...)` and silently disables sibling tests in the suite
(vitest.config.ts `include` patterns require `.test.ts` or `.audit.ts`).

## Pilot script

`packages/core/synthesizer/pilot/s1a-pilot.ts`

Mirrors `gate-rule-tester.ts:33-115` (`buildSingleRuleConfig` + `new Linter().verify(...)`)
using path **(b)**: standalone script, avoids assembling a full `SynthesisPlan` object.

**Run command:**

```sh
tsx packages/core/synthesizer/pilot/s1a-pilot.ts
# (worktree without node_modules: NODE_PATH=/app/node_modules tsx ...)
```

## Captured Linter.verify output (T2/T3 evidence)

```text
=== S1a Linter.verify pilot — no-restricted-syntax .only forbid ===

Rule config (selector-as-data):
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "CallExpression[callee.object.name=/^(describe|it|test)$/][callee.property.name='only']",
      "message": "remove .only — it silently disables sibling tests"
    }
  ]
}

--- RED: no-only-test-focus.bad.ts ---
  2:1  no-restricted-syntax  remove .only — it silently disables sibling tests

--- GREEN: no-only-test-focus.good.ts ---
  (0 violations)

PASS: bad fixture flagged + good fixture clean
```

Bad fixture **flagged** at line 2, column 1. Good fixture **clean** (0 violations).

## 4 Pipeline anchor points for S2–S5

| # | Anchor | Current location | S2+ evolution |
|---|---|---|---|
| 1 | **Spec** — where the rule is defined | This doc + pilot script comment block | S2: `check.type:"declarative"` field in `recipe.schema.json`; S5: generated `RULES.md` entry |
| 2 | **Data** — where selector+message live | Inline in `s1a-pilot.ts` (`SELECTOR`/`MESSAGE` consts) | S2: `check.selector` + `check.message` fields in recipe JSON; compiled to `eslintConfigSnippet` in S4 |
| 3 | **Fixtures** — paired good/bad samples | `packages/core/synthesizer/pilot/no-only-test-focus.{bad,good}.ts` | S2: `rule.examples.{good,bad}` + `rule.negative-test.input` in recipe JSON (existing schema fields — no change needed) |
| 4 | **Runner** — how Linter.verify is invoked | `packages/core/synthesizer/pilot/s1a-pilot.ts` (standalone) | S2+: reuse existing `gate-rule-tester.ts:runEslintRoundtrip` — it already calls `Linter.verify` against `parsedSnippet[ruleName]`, which is exactly what a compiled `declarative` rule would produce |

**Key reuse insight** (T16 — don't duplicate): the runner (`gate-rule-tester.ts`) and the schema
(`recipe.schema.json` `examples`/`negative-test` fields) are NOT rebuilt by S2–S5. The only
net-new artifacts across the umbrella are:
- S2: `check.type:"declarative"` schema extension + `engine` field
- S4: compilation step (selector → `eslintConfigSnippet` entry)
- S5: full pipeline wiring

## Observations (not acted on — T5 scope fence)

- The pilot uses ESLint 9 flat config (`files: ['**/*.{ts,tsx,js,jsx}']` required when
  `filename` is passed to `verify()`). The repo targets ESLint 10; the flat-config call
  signature is the same in both — migration cost is zero.
- The regex selector `/^(describe|it|test)$/` matches the callee object name literally;
  known false-positive: `describe` used as a variable shadowing the global is caught.
  Acceptable for the pilot; S2 can optionally add a `scope: "global"` constraint.
