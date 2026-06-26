# S2-A Engine Seam Rationale — esquery cannot isolate metavariable back-refs

> **Authoritative for:** the justification for the `engine` field in `check.type:"declarative"` — why a single-engine design was insufficient, and why ast-grep is the documented-but-deferred fill for the metavariable class.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Declarative schema spec — see `packages/core/synthesizer/types.ts` + `synthesis-plan.schema.json`. Decision (i) scope — see umbrella kickoff `.claude/orchestrator-prompts/generator-forbid-mvp/kickoff.md §0`.

## §1 Summary

`check.type:"declarative"` carries an optional `engine` field (`"eslint-restricted"` | `"ast-grep"`) because esquery (the selector language behind ESLint's `no-restricted-syntax`) **cannot isolate metavariable back-references** — patterns where the same named entity appears on both sides of an expression (`x === x`, `c ? a : a`, `f(x, x)`, `a || a`). A single `eslint-restricted` engine suffices for simple and composite structural forbids (the S1a + S1b class), but the metavar class requires ast-grep's pattern-variable matching (`$A === $A`). The `engine` seam reserves the ast-grep slot without adding the npm dependency in S2.

## §2 Reproduced gap: esquery over-flags on metavar self-compare

**Goal:** catch `x === x` (self-compare, always true/false — likely a bug) but NOT `x === y` (valid cross-compare).

**Best-effort esquery selector** — using `BinaryExpression[operator="==="][left.name][right.name]` to match any `=== ` where both sides are identifiers (no back-reference syntax exists in esquery):

```text
Selector: BinaryExpression[operator="==="][left.name][right.name]
```

**Command (run via Linter.verify in S2 context, 2026-06-23):**

```typescript
import { Linter } from 'eslint';
import * as tseslintParser from '@typescript-eslint/parser';

const linter = new Linter();
const config = [{
  files: ['**/*.ts'],
  languageOptions: { parser: tseslintParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  rules: {
    'no-restricted-syntax': [
      'error',
      { selector: 'BinaryExpression[operator="==="][left.name][right.name]', message: 'self-compare detected' },
    ],
  },
}];

linter.verify('const x = 1; if (x === x) {}',           config, { filename: 'test.ts' });
linter.verify('const x = 1, y = 2; if (x === y) {}',    config, { filename: 'test.ts' });
```

**Captured output:**

```text
--- esquery metavar self-compare attempt ---
BAD fixture (`x === x`, must flag):
  violations: [ { rule: 'no-restricted-syntax', msg: 'self-compare detected' } ]
GOOD fixture (`x === y`, must NOT flag):
  violations: [ { rule: 'no-restricted-syntax', msg: 'self-compare detected' } ]
RESULT: esquery OVER-FLAGS — selector catches bad but also flags good; cannot isolate
```

**Interpretation:** the selector `BinaryExpression[operator="==="][left.name][right.name]` matches any `a === b` where both sides are identifiers — it cannot express the constraint "left.name must equal right.name". esquery has no back-reference syntax. No esquery selector can express `$A === $A` (same variable on both sides) without over-flagging valid cross-compares.

This is **not a gap fixable by a cleverer esquery selector** — it is a fundamental capability boundary. esquery attributes are independent; there is no `[left.name = right.name]` cross-attribute equality in the esquery specification or the underlying estree-walker implementation.

## §3 DN-1 finding: ast-grep isolates the metavar class

From the umbrella NIGHT-REPORT §DN-1 (generator-forbid-mvp orchestrator research, 2026-06-22):

> ast-grep's rule pattern `$A === $A` matches a binary expression where the left and right operands are the same captured metavariable. The 4 metavar back-ref cases are:
> - `x === x` → `$A === $A`
> - `c ? a : a` → `$C ? $A : $A`
> - `f(x, x)` → `$F($A, $A)` (same argument repeated)
> - `a || a` → `$A || $A`
>
> Each of these produces zero false positives on valid cross-variable code because ast-grep's pattern variables are scoped: `$A` on the left binds the captured node, and `$A` on the right asserts the same node matches.

**Caveat:** the full positive ast-grep proof (running ast-grep CLI against a fixture and capturing the output) is **deferred to ast-grep wiring time** per generator-forbid-mvp decision (i). S2 does NOT install or run ast-grep — the npm dependency + runner are reserved for the first novel metavar forbid in a later stage. The DN-1 finding is cited as the design rationale, not as a captured S2 output.

## §4 Conclusion

The engine seam (`engine?: "eslint-restricted" | "ast-grep"`) is justified by a concrete, reproduced incapability:

| Forbid class | Example | esquery sufficient? | Engine |
|---|---|---|---|
| Simple structural (S1a) | `.only` in test calls | Yes (single selector, no back-ref) | `eslint-restricted` (S1a proved) |
| Composite relational (S1b) | `:not(ancestor > descendant)` | Yes (esquery `:not()` idiom) | `eslint-restricted` (S1b proved) |
| **Metavar back-ref** | `x === x`, `c ? a : a` | **No (over-flags; see §2)** | **`ast-grep` (reserved; deferred to S3+)** |

The `engine` field reserves the ast-grep slot in the schema now, so future declarative recipes can opt into `engine:"ast-grep"` without a schema change. The ast-grep runner is an explicit deferred-marker in S2 (`gate-rule-tester.ts:runEslintRoundtrip`) — it surfaces a named failure rather than silently passing. The npm dependency is NOT added until the first novel metavar forbid recipe ships.

## See also

- `packages/core/synthesizer/types.ts` — `ManifestCheck` declarative variant definition
- `packages/core/synthesizer/synthesis-plan.schema.json` — `ManifestCheck` declarative JSON schema branch
- `packages/core/validator/gate-rule-tester.ts` — deferred-marker for `engine:"ast-grep"` at `runEslintRoundtrip`
- `docs/meta-factory/generator-forbid-mvp/s1a-eslint-forbid-pilot.md` — S1a pilot (eslint-restricted proof)
- `docs/meta-factory/generator-forbid-mvp/s1b-astgrep-composite-pilot.md` — S1b pilot (composite esquery proof)
- `.claude/orchestrator-prompts/generator-forbid-mvp/kickoff.md §0` — decision (i) scope rule
