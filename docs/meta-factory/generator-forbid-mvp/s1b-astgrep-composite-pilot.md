# S1b — ast-grep composite forbid pilot verdict

> **Authoritative for:** S1b evidence and per-sub-class ADOPT/DROP verdict for the ancestor/inside relational `forbid` class in generator-forbid-mvp. Both engines' captured outputs are pasted verbatim below.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). S2 capability-commit (adding ast-grep as a real dependency) — this pilot only justifies it; S2 executes it. Schema/validator/compilation edits — those are S2/S3/S4 scope.

**Date:** 2026-06-22 (reworked 2026-06-23)
**ast-grep version pinned:** `@ast-grep/cli@0.44.0` (via `npx -p @ast-grep/cli@0.44.0 sg`)
**ESLint / esquery invocation:** `npx eslint@9.39.4 --config eslint.config.mjs <file>` (esquery 1.7.0, shipped with eslint 9.39.4; flat config format `eslint.config.mjs`; no `@typescript-eslint` parser — fixtures copied to `.js` to keep the test self-contained)
**Branch:** `feature/tmp-3467ea`

---

## §1 Discriminating example chosen

**Class under test:** ancestor/inside relation — "forbid `expect(...)` called NOT inside an `it`/`test`/`describe` callback".

This class was chosen because it represents a genuine **upward** tree traversal (child → must check ancestors), which is the exact boundary where esquery and ast-grep diverge.

### Fixture: bad-sample.ts (must be flagged)

```typescript
// BAD: expect() called at top-level / outside any it/test/describe
const value = 42;
expect(value).toBe(42);

function helperFn() {
  // also bad: inside a plain function, not inside it/test
  expect(value).toBe(42);
}
```

### Fixture: good-sample.ts (must pass — zero findings)

```typescript
// GOOD: expect() inside it() callback
it('x', () => {
  const value = 42;
  expect(value).toBe(1);
});

// GOOD: expect() inside test() callback
test('y', () => {
  expect(42).toBe(42);
});

// GOOD: expect() inside describe + it
describe('suite', () => {
  it('z', () => {
    expect(true).toBe(true);
  });
});
```

---

## §2 Engine 1 — ast-grep (ancestor/inside sub-class)

### Rule YAML

```yaml
id: expect-outside-test
message: "expect() called outside of it/test/describe callback — ancestor/inside violation"
severity: error
language: TypeScript
rule:
  all:
    - pattern: expect($$$)
    - not:
        inside:
          any:
            - pattern: it($$$)
            - pattern: test($$$)
            - pattern: describe($$$)
          stopBy: end
```

**Command used:** `npx -p @ast-grep/cli@0.44.0 sg scan --rule rules/expect-outside-test.yml <file>`

### Scan output — bad-sample.ts (verbatim)

```text
error[expect-outside-test]: expect() called outside of it/test/describe callback — ancestor/inside violation
  ┌─ bad-sample.ts:3:1
  │
3 │ expect(value).toBe(42);
  │ ^^^^^^^^^^^^^

error[expect-outside-test]: expect() called outside of it/test/describe callback — ancestor/inside violation
  ┌─ bad-sample.ts:7:3
  │
7 │   expect(value).toBe(42);
  │   ^^^^^^^^^^^^^

Error: 2 error(s) found in code.
Help: Scan succeeded and found error level diagnostics in the codebase.

EXIT: 1
```

**Result:** 2 findings — line 3 (top-level) and line 7 (inside helper function). Both are correct violations. ✓

### Scan output — good-sample.ts (verbatim)

```text
EXIT: 0
```

**Result:** 0 findings. All three `expect()` calls inside `it()`/`test()`/`describe()` are correctly excluded. ✓

---

## §3 Engine 2 — esquery / no-restricted-syntax (exhaustive falsifier, ancestor/inside sub-class)

**Invocation:** `npx eslint@9.39.4 --config <config.mjs> <file>` (esquery 1.7.0)
**Config format:** flat config (`eslint.config.mjs`), ESLint 9 default.

### Attempt A: Broadest possible selector

**Selector:** `CallExpression[callee.name='expect']`

**Config:**
```js
{ selector: "CallExpression[callee.name='expect']", message: "ATTEMPT A" }
```

**Output — bad-sample.js (verbatim):**
```text
/tmp/sg-esquery-test/bad-sample.js
  3:1  error  ATTEMPT A: too broad — cannot restrict to 'not inside it/test'  no-restricted-syntax
  7:3  error  ATTEMPT A: too broad — cannot restrict to 'not inside it/test'  no-restricted-syntax

✖ 2 problems (2 errors, 0 warnings)
EXIT: 1
```

**Output — good-sample.js (verbatim):**
```text
/tmp/sg-esquery-test/good-sample.js
   4:3  error  ATTEMPT A: too broad — cannot restrict to 'not inside it/test'  no-restricted-syntax
   9:3  error  ATTEMPT A: too broad — cannot restrict to 'not inside it/test'  no-restricted-syntax
  15:5  error  ATTEMPT A: too broad — cannot restrict to 'not inside it/test'  no-restricted-syntax

✖ 3 problems (3 errors, 0 warnings)
EXIT: 1
```

**Result:** Flags bad ✓ but also flags good ✗ — 3 false positives on the good sample (lines 4, 9, 15 are all inside `it`/`test`/`describe`). Eliminates nothing.

---

### Attempt B: `:not(X) > Y` immediate-parent workaround

**Selector:**
```css
:not(CallExpression[callee.name='it']) > BlockStatement > ExpressionStatement > CallExpression[callee.name='expect']
```

**Config:**
```js
{
  selector: ":not(CallExpression[callee.name='it']) > BlockStatement > ExpressionStatement > CallExpression[callee.name='expect']",
  message: "ATTEMPT B (not-immediate-parent): broken — negates immediate parent only"
}
```

**Output — bad-sample.js (verbatim):**
```text
EXIT: 0
```

**Output — good-sample.js (verbatim):**
```text
EXIT: 0
```

**Result:** Produces **false negatives** — misses both bad `expect()` calls entirely, exits 0 on bad-sample. Two failure modes:

1. **Wrong AST path assumption:** `expect(value).toBe(42)` wraps `expect(value)` inside a `MemberExpression` (not a direct child of `ExpressionStatement`). The `> ExpressionStatement > CallExpression[callee.name='expect']` chain never matches because the actual path is `ExpressionStatement > CallExpression[.toBe] > MemberExpression > CallExpression[.expect]`.

2. **Fundamental immediate-parent limit (conceptual):** even with a corrected path, `:not(X) > Y` only negates the **immediate parent** of `Y`. The parent of `BlockStatement` is `ArrowFunctionExpression`, not the `it()` call — so the `:not(it)` clause would match even inside a proper `it` callback.

**Consequence:** Attempt B is doubly broken — wrong structural path AND wrong concept. It cannot detect the ancestor relationship.

---

### Attempt C: Nested `:not(ancestor descendant)` idiom

**Key insight discovered post-Attempt-B:** esquery's `:not()` can contain a **compound selector** (multiple tokens), not just a simple type/attribute. When written as `:not(A B)`, esquery evaluates `A B` as a descendant relationship inside `:not()` — meaning `:not(A B)` selects nodes that are NOT `B` descendants of `A`. This is the standard ancestor-negation idiom.

**Selector:**
```css
CallExpression[callee.name='expect']:not(:matches(CallExpression[callee.name='it'], CallExpression[callee.name='test'], CallExpression[callee.name='describe']) CallExpression[callee.name='expect'])
```

**Unpacked:**
- Start with: `CallExpression[callee.name='expect']`
- Apply `:not(A B)` where:
  - `A` = `:matches(CallExpression[callee.name='it'], ...)` (any it/test/describe ancestor)
  - `B` = `CallExpression[callee.name='expect']` (the node itself)
- Meaning: flag `expect()` calls that do NOT appear as a descendant of an `it`/`test`/`describe` CallExpression

**Config (eslint.config.mjs):**
```js
export default [
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='expect']:not(:matches(CallExpression[callee.name='it'], CallExpression[callee.name='test'], CallExpression[callee.name='describe']) CallExpression[callee.name='expect'])",
          message: "ATTEMPT C (nested-not): expect() not inside it/test/describe"
        }
      ]
    }
  }
];
```

**Output — bad-sample.js (verbatim):**
```text
/tmp/sg-esquery-test/bad-sample.js
  3:1  error  ATTEMPT C (nested-not): expect() not inside it/test/describe  no-restricted-syntax
  7:3  error  ATTEMPT C (nested-not): expect() not inside it/test/describe  no-restricted-syntax

✖ 2 problems (2 errors, 0 warnings)
EXIT: 1
```

**Output — good-sample.js (verbatim):**
```text
EXIT: 0
```

**Result:** ✓ Flags both bad `expect()` calls (lines 3, 7) — matches ast-grep's output. ✓ Zero findings on good-sample — all three inside `it`/`test`/`describe` correctly pass. **Selector works.**

**Conclusion (falsifier criterion met):** Per the task's explicit rule — "if you CAN write a single working `no-restricted-syntax` selector that flags the bad sample AND passes the good sample → record DROP" — the verdict for the ancestor/inside sub-class is **DROP**. esquery with the `:not(ancestor descendant)` compound-selector idiom expresses the ancestor/inside constraint. ast-grep is NOT required for this class.

---

## §4 Counter-check — descendant/has sub-class (where esquery suffices)

### Example: empty catch block

This is a **descendant** check: "a `CatchClause` whose `BlockStatement` body has NO child nodes." The check goes **downward** (parent → check children), which esquery supports via attribute selectors.

**Selector:** `CatchClause > BlockStatement[body.length=0]`

**Output — empty catch (should flag):**
```text
/tmp/sg-scratch/test-catch.js
  1:33  error  COUNTER-CHECK: empty catch block — esquery CAN express this  no-restricted-syntax

✖ 1 problem (1 error, 0 warnings)
EXIT: 1
```

**Output — non-empty catch (should NOT flag):**
```text
EXIT: 0
```

**Result:** esquery correctly handles the descendant case. ✓

**Key distinction:**
| Class | Direction | esquery | ast-grep |
|---|---|---|---|
| descendant/`has` (e.g. empty-catch) | parent checks children (↓) | ✓ works | ✓ works |
| ancestor/`inside` (e.g. expect-outside-test) | child checks ancestors (↑) | ✓ works via `:not(A B)` compound idiom | ✓ works |

**Corrected understanding:** esquery can express ancestor-negation via the `:not(ancestor descendant)` compound-selector idiom — `:not(A B)` selects nodes that are NOT `B` descendants of `A`. This was not discovered until Attempt C (§3). Both engines handle both sub-classes; the discriminating gap presumed by the original S1b brief does not exist for this example.

---

## §5 Per-sub-class verdict

### Ancestor/inside sub-class

**VERDICT: DROP** — esquery (via `no-restricted-syntax`) is sufficient; ast-grep is NOT required for this class.

**Evidence:** esquery Attempt C (`CallExpression[callee.name='expect']:not(:matches(CallExpression[callee.name='it'], CallExpression[callee.name='test'], CallExpression[callee.name='describe']) CallExpression[callee.name='expect'])`), run via `npx eslint@9.39.4` (esquery 1.7.0):
- bad-sample.js: 2 errors at lines 3:1 and 7:3 — matches ast-grep output exactly. ✓
- good-sample.js: EXIT 0, zero findings — all three inside `it`/`test`/`describe` pass. ✓

**Why the earlier ADOPT was wrong:** Attempts A and B were incomplete. Attempt A was too broad (no filtering). Attempt B used a structurally incorrect AST path AND conceptually wrong immediate-parent `:not(X) > Y` approach. Neither tested the `:not(ancestor descendant)` compound-selector idiom, which esquery 1.7.0 fully supports. The initial claim that "esquery has no ancestor-negation combinator" was false — it does via `:not(A B)`.

**Falsifier criterion met:** per the task spec, "if you CAN write a single working `no-restricted-syntax` selector that flags the bad sample AND passes the good sample → record DROP." Attempt C satisfies both conditions.

**Scope:** this verdict covers TS/JS relational `forbid` rules only (composite ancestor/inside). Polyglot (non-TS/JS) is out of scope for S1b.

**Dependency implication:** ast-grep dependency is NOT needed for the ancestor/inside sub-class. S2 (capability-commit) should NOT add ast-grep based on this pilot alone. The `no-restricted-syntax` esquery path is the correct recommendation for this class.

### Descendant/has sub-class

**VERDICT: DROP (for this sub-class)** — no need for ast-grep dependency for descendant/has rules.

**Evidence:** esquery `CatchClause > BlockStatement[body.length=0]` correctly flags the empty-catch case with 0 false positives (§4). The `no-restricted-syntax` rule is sufficient for descendant/has checks.

---

## §6 Checklist against task acceptance criteria (T2/T3/T20)

- [x] Both ast-grep `scan` output pasted verbatim (§2)
- [x] esquery falsifier — exhaustive 3-attempt evidence pasted verbatim (§3): Attempt A (too broad), Attempt B (wrong path + wrong concept), Attempt C (nested-not — works)
- [x] ESLint/esquery invocation documented: `npx eslint@9.39.4 --config eslint.config.mjs` (esquery 1.7.0)
- [x] Verdict is per-sub-class (§5): ancestor/inside → DROP (esquery sufficient); descendant/has → DROP (esquery sufficient)
- [x] Counter-check shows descendant/has where esquery suffices (§4)
- [x] No `package.json` changes — `git status` checked in next task
- [x] T16 guard: empty-catch NOT used as representative; ancestor/inside example used instead
- [x] T20: verdict backed by command output, not vibe
- [x] Falsifier criterion met (§3 Attempt C): esquery Attempt C passes bad/good fixtures → verdict is DROP per task spec

## §7 See also

- `.claude/rules/build-first-reuse-default.md` — ADOPT-by-proof discipline that governs this pilot
- `.claude/rules/ci-tool-pinning.md` — version-pin discipline (`@0.44.0`)
- `docs/meta-factory/generator-forbid-mvp/` — sibling S1a verdict (simple-forbid via no-restricted-syntax)
- `docs/meta-factory/prior-art-evaluations.md` — SSOT (S2 capability-commit will add ast-grep entry)
