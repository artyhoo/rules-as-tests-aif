# R2 Layer-2 wirer — plugin-registration fix (GH #644) — design

> **Authoritative for:** design of the fix for GH #644 — the R2 Layer-2 wirer ([`wire-eslint-r2.ts`](../../../packages/core/install/wire-eslint-r2.ts)) emitting a rule reference (`rules-as-tests/no-unsafe-zod-parse`) without registering the `rules-as-tests` plugin, which crashes a consumer's ESLint config. Scope-bound to the W1 (issue) + W2 (wirer mechanism) + W3 (loadability gate) work below.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The wirer's broader behaviour spec — see the AST-wiring design [2026-06-17-install-ast-wiring-design.md](2026-06-17-install-ast-wiring-design.md). Implementation steps — see the `writing-plans` output that follows this spec.

**Date:** 2026-06-19 · **Status:** design (pre-implementation) · **Branch:** `claude/dazzling-colden-b53939` (off `staging`); PR → `staging`

---

## 1. Problem & goal

The R2 Layer-2 wirer ([`wire-eslint-r2.ts:33`](../../../packages/core/install/wire-eslint-r2.ts)) appends `{ rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }` to a consumer's per-package ESLint flat-config. In ESLint flat config, a rule that references a plugin namespace (`rules-as-tests/…`) requires that plugin to be **registered** (`plugins: { 'rules-as-tests': <obj> }`) somewhere in the resolved config array. The wired element registers nothing — it **assumes `...base` already registers the plugin**.

That assumption holds for the framework's own shipped root template ([`templates/ts-server/eslint.config.mjs:155`](../../../templates/ts-server/eslint.config.mjs) registers the plugin alongside the rule), but **not** for an arbitrary consumer base. In the timeliner monorepo the shared base (`@timeliner/config/eslint/base.mjs`) registers the plugin only in the consumer's **root** config, not in the shared base that per-package configs extend → the wired per-package config references an unregistered plugin → ESLint aborts config load:

```text
A configuration object specifies rule "rules-as-tests/no-unsafe-zod-parse", but could not find plugin "rules-as-tests".
```

This regression was **activated** (not introduced) by [#642](https://github.com/Yhooi2/rules-as-tests-aif/pull/642): before it, the wirer falsely degraded (could not resolve `ts-morph` from the consumer cwd) so the bad element was never written (R2 silently inert, `lint` rc 0); #642 fixed the resolution → the wirer now succeeds → the latent plugin-less element surfaces (`lint` rc 2). The bad line itself dates to [#632](https://github.com/Yhooi2/rules-as-tests-aif/pull/632) (`:33`).

**Goal:** the wirer must produce a config that **loads** — never one that references an unregistered plugin (crash) and never one that silently drops R2 (inert). And the framework must have a **test that fails when the wired output does not load** — the current tests only assert the edit's text is present, never that ESLint can load it (the real reason #642 passed CI; see §6).

Why it matters: a config-load crash fails **every** `eslint` invocation in the consumer (lint, `lint-staged` pre-commit) regardless of file content — it bricks the consumer's commit flow. For a framework whose thesis is "rules are enforced, not theatre" ([README.md#why-this-exists](../../../README.md#why-this-exists)), a wirer that emits a non-loading config is the worst failure class.

## 2. Evidence — reproduced ESLint behaviour (eslint v10.4.1, local probes)

| # | Config (file matched) | `eslint <file>` | `eslint --print-config <file>` |
|---|---|---|---|
| A | rule refs plugin, **registered nowhere** | rc=2 `could not find plugin` | rc=2 same |
| B | rule refs plugin, **registered** (any block) | rc=0 | rc=0 |
| C | plugin registered **twice, same module object** | rc=0 | rc=0 |
| D | plugin registered **twice, different objects** | rc=2 `Cannot redefine plugin` | rc=2 same |
| E | bare global rule + plugin registered only under a **narrow `files` glob**, probe a file **outside** that glob | **rc=0** | **rc=0** |

Two load-bearing facts established:

1. **`--print-config` is a faithful oracle:** it crashes (rc≠0) on the exact same conditions as a real lint (A, D) and succeeds (rc=0) when the config loads (B, C). So a deterministic, no-API gate can use it ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) clean).
2. **Plugin registration is config-array-global, not per-file (E):** registering the plugin in *any one* block makes the namespace resolvable for rule references in *all* blocks, even blocks/files the registration's `files` glob does not match. Therefore the "could not find plugin" crash fires **iff the plugin is registered in zero blocks across the whole resolved config** — the probe file's location is irrelevant.

(Consumer ESLint is `eslint@^9` — [`install.sh:1351`](../../../install.sh) `CORE_DEVDEPS`. The `could not find` / `Cannot redefine` semantics are identical on v9; the existing [`gh-535-rule-enforced.test.sh`](../../../tests/install-sh/gh-535-rule-enforced.test.sh) v9 arm covers the version. Confirm under v9 at implementation — §7 R1.)

## 3. Root cause & the three failure modes

There is **no single static element that is safe for every base** — the correct element depends on whether the base already registers the plugin, which the wirer cannot read statically (the base may be a sealed published package):

| Base state | bare `{ rules }` (today) | self-contained `{ plugins, rules }` |
|---|---|---|
| registers plugin **nowhere** (timeliner) | ❌ could not find plugin | ✅ rc 0 |
| registers, **same** module object | ✅ | ✅ rc 0 (C) |
| registers, **different** object (sealed pkg) | ✅ | ❌ Cannot redefine plugin (D) |

## 4. W2 — the mechanism: try-bare → escalate via `print-config` oracle

Do not guess the base's state statically. Use ESLint itself as the oracle, and **always try the registration-free element first** so the "Cannot redefine" branch (D) is unreachable by construction.

### 4.1 Algorithm (per per-package config)

1. Write the **bare** element `{ rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }` (today's behaviour) into the config.
2. Run `eslint --print-config <probe>` from the config's governing dir, where `<probe>` is any `.ts` file the bare (global, no-`files`) rule matches — an existing one, or a synthesized throwaway (§4.4).
   - **rc 0** → base registers the plugin somewhere → bare is correct → **done**.
   - **rc≠0 + "could not find plugin"** → base registers it nowhere → rewrite the element as **self-contained** `{ plugins: { 'rules-as-tests': customRules }, rules: { … } }` and inject `import customRules from '<rel>'` (§4.4) → re-probe → rc 0 → **done**.
   - **oracle unavailable** (eslint not resolvable) or re-probe still ≠0 → **degrade**: restore the original file and emit the manual self-contained snippet (§4.5). Never leave a half-edit; `install` stays rc 0.

### 4.2 Why it is safe by construction

- The bare element registers **no** plugin → it can never trigger "Cannot redefine" (D).
- We add a registration **only** when the probe proved the base registers nowhere → there is then **no second registration** to conflict with → "Cannot redefine" still cannot fire.
- Both crash classes (A "could not find", D "Cannot redefine") are eliminated structurally, not by a heuristic guess. Per fact §2.2 the probe-file location does not affect the verdict, so no boundary-glob-shaped probe path is required.

### 4.3 Where the ESLint call lives (testable seam)

Inside the wirer ([`wire-eslint-r2.ts`](../../../packages/core/install/wire-eslint-r2.ts)). It already resolves an engine (`ts-morph`) from the consumer cwd via `createRequire(cwd)` (the #642 pattern, `:95`); reuse that to resolve the consumer's `eslint` binary and `execFile` `--print-config`. The probe is injected as a function parameter into the core logic so unit tests pass a mock (no real ESLint in the vitest unit suite); the install-harness test exercises the real binary (§5).

The wirer writes the candidate to disk before probing (ESLint reads config from disk) and rewrites/restores on the escalation/degrade branches. Transient on-disk state during install is acceptable — `install` already forces rc 0 on every wirer branch ([`wire-eslint-r2.ts:256`](../../../packages/core/install/wire-eslint-r2.ts), [`install.sh:1516`](../../../install.sh)).

### 4.4 The self-contained element + relative import path

`install` ships `eslint-rules-local/` at the **consumer root** and generates the `eslint-rules-local/index.ts` barrel ([`install.sh:940`](../../../install.sh), [`:969`](../../../install.sh)) — the same module the root template imports ([`templates/ts-server/eslint.config.mjs:12`](../../../templates/ts-server/eslint.config.mjs)). The wirer runs with cwd = consumer root ([`install.sh:1515`](../../../install.sh) `cd "$PROJECT_ROOT"`), so for a config at `<root>/apps/api/eslint.config.mjs` the injected import is:

```text
rel = path.relative(dirname(configPath), resolve(cwd, 'eslint-rules-local/index.ts'))
   // e.g. "../../eslint-rules-local/index.ts"
import customRules from '<rel>';
```

The import is injected once, at the top of the config, only on the escalation branch. Idempotency: the existing `source.includes(R2_RULE_ID)` early-return ([`:82`](../../../packages/core/install/wire-eslint-r2.ts)) still guards re-runs.

### 4.5 Edit sites (all three currently emit the plugin-less form)

- [`wire-eslint-r2.ts:33`](../../../packages/core/install/wire-eslint-r2.ts) — `R2_ELEMENT` (the AST-appended element). Bare stays the default; escalation produces the self-contained variant.
- [`wire-eslint-r2.ts:52`](../../../packages/core/install/wire-eslint-r2.ts) — `generateDegradedSnippet` manual instruction.
- [`wire-eslint-r2.ts:208`](../../../packages/core/install/wire-eslint-r2.ts) — the "unrecognised export shape" manual instruction.
  The two manual snippets (`:52`, `:208`) must show the **self-contained** form (import + `plugins` + `rules`) — a human following them against a plugin-less base would otherwise hit the same crash.

## 5. W3 — loadability test gate (the missing channel)

Add an install-harness fixture that reproduces the timeliner shape and asserts the wired output **loads**:

- Build a per-package config `export default [...base]` where `base` sets up TS file-matching but registers **no** `rules-as-tests` plugin.
- Run the wirer (`--yes`).
- Assert: `eslint --print-config <matching .ts>` from the package dir → **rc 0** *and* its output contains `rules-as-tests/no-unsafe-zod-parse` (loads **and** the rule is actually applied — guards both the crash and the inert regressions).
- Companion fixture: a base that **does** register the plugin → assert the wirer keeps the bare element and still loads rc 0 (no double-registration / no "Cannot redefine").

Home: extend [`tests/install-sh/wire-eslint-r2.test.sh`](../../../tests/install-sh/wire-eslint-r2.test.sh) (it gates real ESLint via the framework's own binary; runs in [`audit-self.yml:312`](../../../.github/workflows/audit-self.yml)). This is the "Fixture A headline red→green" the file's header already *claims* exists "in CI via consumer-pipeline" but does **not** (see §6). Reuse the governing-dir `--print-config` pattern from [`check-rule-enforced.sh:140`](../../../packages/core/audit-self/check-rule-enforced.sh).

## 6. W1 — issue #644 update (review findings + reproduced evidence)

Append to #644:

- **MAJOR — the real CI-miss mechanism:** [`wire-eslint-r2.test.sh:9-10`](../../../tests/install-sh/wire-eslint-r2.test.sh) claims a print-config integration ("Fixture A … runs in CI via consumer-pipeline"). [`consumer-pipeline.test.sh`](../../../tests/install-sh/consumer-pipeline.test.sh) runs **zero** ESLint (it tests `/pipeline` backlog discovery). The promised loadability gate never existed → the only wirer check is `grep` for the rule string ([`:130`](../../../tests/install-sh/wire-eslint-r2.test.sh)), which a crashing config still passes. Fix: correct the false comment + ship the real gate (W3). This is "documents lie; tests don't" — the lying document was a test comment.
- **Evidence:** the §2 table (reproduced rc values, incl. the new **`Cannot redefine plugin`** mode D not in the original issue).
- **MINOR ×2:** (a) state "fix forward, do not revert #642" — reverting re-masks R2 as inert; (b) the fix's injected import path must be **computed** per config depth, not hardcoded `../../`.

## 7. Risks & residuals (resolve in plan / implementation)

- **R1 — ESLint v9 parity:** all probes ran on v10.4.1; the consumer runs v9. Re-confirm the §2 A/D/E behaviours under v9 (the `gh-535` v9 arm is the precedent harness). Low risk — flat-config plugin-resolution semantics are stable across v9/v10.
- **R2 — worktree has no `node_modules`:** this worktree cannot run `eslint`/`vitest` (the probes borrowed eslint from the main checkout). Implementation/verification must install deps in the worktree or run from the main checkout — otherwise W3 "passes" without actually loading ESLint, repeating the #644 sin.
- **R3 — capability-commit check:** the change modifies an existing file (bug fix) + adds a shell test; per [CLAUDE.md](../../../CLAUDE.md) likely **not** a capability commit (no new dep — eslint already present; no new ≥80-LOC module under `packages/`). Plan confirms and adds the `Prior-art:` trailer only if the threshold is actually crossed.
- **R4 — probe target when a package has no `.ts` file:** synthesize a throwaway `.ts` under the governing dir, probe, delete. Confirm cleanup on every branch (incl. failure).

## 8. Scope

**In:** W1 (#644 update), W2 (wirer mechanism + 3 edit sites), W3 (loadability gate + the false-comment fix). One PR → `staging`.

**Out (do not drive-by):** generalising the wirer to non-`.mjs` configs; redesigning Layer-2 architecture; touching the root-config Layer-1 path ([`install.sh` §6b-bis](../../../install.sh)); any consumer-repo (timeliner) change — that repo verifies independently.

## 9. Acceptance criteria

1. Wirer over a **plugin-less** base → `eslint --print-config` on a matching file rc 0 **and** R2 in the resolved config.
2. Wirer over a **plugin-registering** base → keeps bare element, rc 0, no "Cannot redefine".
3. Oracle-unavailable / unrecognised → degrade with the **self-contained** manual snippet, original file byte-unchanged, `install` rc 0.
4. W3 gate fails (red) against the pre-fix wirer and passes (green) against the fixed wirer — verified in that order.
5. `wire-eslint-r2.test.sh` header comment matches reality (no claim of a test that does not run).
6. #644 carries the MAJOR + evidence + 2 MINOR.

## 10. Recursive self-application note (§1.7)

- **Forward-check:** the fix's own gate (W3) runs **real ESLint** and asserts the config **loads** — it does not repeat the grep-only theatre it replaces (the §6 MAJOR turned on this work itself). Deterministic, no paid LLM ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)). Earliest reachable channel: the gate runs in CI `audit-self`, and the wirer self-probes at **install time** (earlier than CI) — multi-channel per invariant 4.
- **Backward-check:** supersedes nothing; extends the #632/#642 AST-wiring line. The "test asserts the edit happened, not that it loads" anti-pattern (T3 / [ai-laziness-traps.md](../../../.claude/rules/ai-laziness-traps.md)) is the precise failure W3 closes.
