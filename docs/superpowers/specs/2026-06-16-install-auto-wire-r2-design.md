# Install auto-wire R2 by reading the repo — design (Point 2 of GH #547)

> **Authoritative for:** design of the install-time R2 auto-wire + conditional-N/A mechanism (Point 2 of [GH #547](https://github.com/Yhooi2/rules-as-tests-aif/issues/547)). Scope-bound to Point 2; Point 1 (AI-generated project passport) is a separate spec.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). R2 rule semantics — see [packages/core/eslint-rules/no-unsafe-zod-parse.ts](../../../packages/core/eslint-rules/no-unsafe-zod-parse.ts).

**Date:** 2026-06-16 · **Status:** design (pre-implementation) · **Branch:** `feat/547-install-auto-wire-r2`

---

## 1. Problem

After a clean install onto a consumer with an inline-router / declarative-validation layout (timeliner: Hono + `@hono/zod-openapi`), the R2 boundary globs (`**/routes/**`, `**/handlers/**`, …) match **zero** files and there is no manual `.parse()` to guard. The shipped `check:globs` gate then exits **1** out of the box ([check-rule-globs.sh:203-206,218](../../../packages/core/audit-self/check-rule-globs.sh)).

The two "obvious" fixes are both bad UX (issue §2):
- **leave it red** → the human must reconcile a framework-shipped gate manually;
- **downgrade to a soft warning** → defers the same manual work AND contradicts "I installed *rules-as-tests* precisely so rules are ON at install".

**Goal:** the installer configures enforcement *by reading the repo*, so the gate is **green-because-understood**, not red-because-unconfigured — without ever silently mutating consumer-authored files, and without re-introducing the silent-inertness the framework exists to kill.

## 2. Scope

**In scope (this spec):**
- **Layer 1 — detect + wire our own globs.** At install, run boundary detection; if a real HTTP boundary exists, set `RULE_GLOBS.boundary` in the **framework-shipped** `eslint.config.mjs` to cover it (our file — editing it at install is not clobbering consumer code).
- **Layer 3 — conditional N/A record.** If detection is *confident* there is no manual-parse boundary (declarative validation), record a **re-checkable** `R2 N/A` decision in `.ai-factory/tool-decisions.md`, and have the inertness gates honor it (green) while re-verifying its precondition (red again if the precondition breaks).

**Out of scope (deferred / separate):**
- **Layer 2 — mutate consumer-authored per-package eslint configs** (inject R2 into a consumer's `apps/api/eslint.config.mjs` that re-exports a base lacking R2, the #535 case). Deferred to a follow-up increment behind an opt-in `--wire-rules` flag (mirrors `--wire-ci` #117). Editing consumer-owned code is the riskiest slice; ship the safe core first.
- **Point 1** (AI-generated DESCRIPTION/ARCHITECTURE passport) — separate spec; reuses the detector wired in by this spec.

## 3. Build-vs-reuse (capability-commit consult)

| Capability | Verdict | Evidence |
|---|---|---|
| Stack/framework detection | **REUSE** | `detectStack()` → `DetectionResult` ([detector/types.ts](../../../packages/core/detector/types.ts)); already shipped. Upstream framework-detectors stay WATCHLIST per [SSOT #2](../../../docs/meta-factory/prior-art-evaluations.md) (deterministic-v1 stop-rule). |
| Opt-in detect-first auto-wire pattern | **REUSE/REFERENCE** | `--wire-ci` yq wirer, [SSOT #117](../../../docs/meta-factory/prior-art-evaluations.md) — the precedent for "detect-first, opt-in, never pin". Layer 2 (deferred) mirrors it. |
| Glob-liveness alarm | **REUSE** | `check-rule-globs.sh` (dependency-free). |
| Config-application-liveness alarm | **REUSE** | `check-rule-enforced.sh` via `eslint --print-config`, [SSOT #118](../../../docs/meta-factory/prior-art-evaluations.md). |
| Decision register | **REUSE** | `.ai-factory/tool-decisions.md` (tracked by `audit-ai-docs.sh` D4 staleness). |
| **Boundary-presence detection** ("does this repo have a manual-parse HTTP boundary, and where?") | **BUILD** | Not in `DetectionResult` today (it returns stack/framework/runtime/patterns, not boundary location or `.parse()` presence). Dependency-free `find`+`grep` probe. No upstream analog — same family as the own-built `check-rule-globs.sh` liveness gates. |
| **Conditional-N/A record + gate honoring it** | **BUILD** | The re-checkable decision marker + gate change. Project-specific. |

`Prior-art:` trailer on the capability commit will cite #2/#117/#118 + the BUILD rationale above.

## 4. Components

### C1 — boundary probe (`scripts/detect-r2-boundary.sh`, dependency-free)

Pure `bash` + `find`/`grep` (runnable with no node/eslint). Classifies the repo into exactly one of three verdicts:

- **`boundary-present`** — ≥1 file matches a `RULE_GLOBS.boundary` token (`routes/`,`handlers/`,`controllers/`,`app/api/`,`actions/`) **OR** non-test source contains a zod-parse call (`.safeParse(` anywhere, or `<ident>.parse(` where `<ident>` is not `JSON`/`Date`/`Number`/`parseInt`/`parseFloat`). → R2 must be active; emit the covering globs.
- **`no-boundary-confident`** — **ALL** of: (a) detected framework ∈ declarative-validation allowlist (seed: `@hono/zod-openapi`; extensible), (b) zero boundary-token files, (c) zero `.safeParse(` and zero non-stdlib `.parse(` in non-test source. → safe to record conditional N/A.
- **`ambiguous`** — anything else. → **stay red** (current behavior); surface to the human. *No auto-green on doubt.*

> **Conservative-detection invariant (load-bearing):** auto-N/A fires only on `no-boundary-confident`. Every uncertain case degrades to today's red gate. A false-N/A (silently un-guarding a real boundary) is therefore structurally unlikely; the worst realistic failure is a *false-red* (asking a human who didn't strictly need it) — the same cost as today.

### C2 — install wiring step (`install.sh`, always-on, non-destructive)

After the detector/PM steps, run C1 and branch:
- `boundary-present` → patch `RULE_GLOBS.boundary` in the **shipped** `eslint.config.mjs` to the emitted globs (only when they differ from the layout-agnostic default; idempotent). Print one line.
- `no-boundary-confident` → append a conditional-N/A block to `.ai-factory/tool-decisions.md` (C3). Print one line.
- `ambiguous` → do nothing (gate stays the alarm). Print the existing "widen RULE_GLOBS" guidance.

Never touches consumer-authored eslint configs (that is deferred Layer 2). Degrades cleanly when the detector is absent (skips with a note, gate behavior unchanged).

### C3 — conditional-N/A record (`.ai-factory/tool-decisions.md`)

A machine-parseable block (HTML-comment delimited so the gates can read it; human-readable body):

```markdown
<!-- aif:r2-na:begin -->
### R2 (no-unsafe-zod-parse) — N/A for this layout (auto-recorded <DATE>)
**Verdict:** N/A — validation is declarative via `@hono/zod-openapi`; no manual `.parse()` boundary.
**Precondition (re-checked by check:globs / check:enforced):**
- no file matches RULE_GLOBS.boundary tokens, AND
- no `.safeParse(` and no non-stdlib `.parse(` in non-test source.
**If this precondition breaks** (you add a hand-rolled parse boundary) the gate goes RED again — wire R2 or update this decision.
<!-- aif:r2-na:end -->
```

### C4 — gate change (`check-rule-globs.sh` + `check-rule-enforced.sh`)

Today: zero-match (with no per-package boundary) → FAIL. New: before failing, check for the C3 marker; if present, **re-verify its precondition mechanically** (re-run C1):
- precondition still `no-boundary-confident` → **PASS** with `· R2 N/A (recorded, precondition holds)`;
- precondition broke (now `boundary-present`) → **FAIL** with `✗ R2 was marked N/A but a parse boundary now exists at <file> — wire R2 or update .ai-factory/tool-decisions.md` (stale-marker alarm);
- no marker → unchanged (today's FAIL).

The re-verification is what makes N/A conditional, not a permanent off-switch — it closes the "empty-now-but-grows-later" gap.

## 5. Data flow

```text
install.sh
  └─ detectStack() ──► framework/stack
  └─ C1 detect-r2-boundary.sh ──► {boundary-present | no-boundary-confident | ambiguous}
        ├─ boundary-present      ► patch RULE_GLOBS.boundary in shipped eslint.config.mjs
        ├─ no-boundary-confident ► append C3 block to .ai-factory/tool-decisions.md
        └─ ambiguous             ► no-op (gate stays the alarm)

later: git push / CI
  └─ check-rule-globs.sh + check-rule-enforced.sh
        └─ on zero-match: read C3 marker → re-run C1 → PASS / stale-FAIL / today's-FAIL
```

## 6. Error handling / degradation

- **Detector / node absent** → C1 is pure bash, runs anyway; C2 skips the `detectStack` allowlist check and treats framework as unknown → at most `ambiguous` (never auto-N/A). Safe.
- **`.ai-factory/` absent** (non-AIF consumer) → C2 skips C3 record; gate unchanged.
- **Re-install** → C2 is idempotent (globs patched only if differing; C3 block replaced between the `aif:r2-na` markers, not duplicated).
- **eslint absent** → `check-rule-enforced.sh` already skips; `check-rule-globs.sh` (bash) still runs the C4 logic.

## 7. Testing

`tests/install-sh/` (bash, the project's install-test harness) + detector unit tests:
- **fixture A — declarative Hono** (`@hono/zod-openapi`, no `.parse()`, no routes folder): install → C1 `no-boundary-confident` → C3 recorded → `check:globs` **green** (asserts exit 0 AND the C3 marker present). *This is the timeliner case — the red→green fix.*
- **fixture B — hand-rolled parse boundary** (`src/api/x.ts` with `schema.parse(req.body)`, no routes folder): install → C1 `boundary-present` → globs patched to cover it → R2 actually fires (RuleTester roundtrip) → `check:globs` green *because wired*.
- **fixture C — precondition breaks** (start from fixture A green, then add a `.safeParse(` boundary): re-run `check:globs` → **stale-marker FAIL** with the C4 message. *Proves N/A is conditional, not a forever off-switch.*
- **fixture D — ambiguous** (a `.parse(` that is `JSON.parse`, framework unknown): C1 `ambiguous` → gate stays today's RED (no false auto-green).
- Install rc asserted `=0` on every arm (a mid-install crash must not false-green — lesson from [GH #531/#544](https://github.com/Yhooi2/rules-as-tests-aif/issues/531)).

## 8. Recursive self-application

This repo is itself an `apps/`+`packages/` monorepo; running C1 on it must yield a defensible verdict (likely `boundary-present` via `packages/core/**` parse sites or `ambiguous`, never a false `no-boundary-confident`). A self-probe arm in the audit-self suite asserts the framework's own layout is classified honestly — the same "make self-audit green" invariant the project applies everywhere.

## 9. Open risks (carry into the plan)

1. **Heuristic precision of C1's `.parse()` discrimination.** Mitigated by the conservative invariant (ambiguity → red), but the allowlist + grep patterns need a real corpus check before shipping. *Falsifier:* a fixture where C1 returns `no-boundary-confident` but a real zod boundary exists → must not happen across fixtures A–D + the self-probe.
2. **Two gates, one marker.** `check:globs` (bash) and `check:enforced` (#118, eslint) must agree on honoring C3 — divergence would re-open a false-green/false-red. Plan must wire C4 into both, with a shared marker-read helper.
3. **Declarative-allowlist coverage.** Seed is `@hono/zod-openapi` only; other declarative stacks (tRPC, Fastify schema, TypeBox) stay `ambiguous` (red) until added — acceptable (safe default), but document the extension path.
