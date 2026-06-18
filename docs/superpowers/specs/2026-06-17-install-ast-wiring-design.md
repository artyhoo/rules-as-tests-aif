# Install-time AST config wiring — "AST where they're better" (GH #547 Point 2, Layer 2)

> **Authoritative for:** design of the install-time **AST-based** wiring that injects R2 (`no-unsafe-zod-parse`) into a **consumer-authored** per-package eslint flat config (the #535 `export default base` case) — Layer 2 of [GH #547](https://github.com/Yhooi2/rules-as-tests-aif/issues/547) Point 2. Resolves §4 of [`.claude/orchestrator-prompts/install-ast-wiring/kickoff.md`](../../../.claude/orchestrator-prompts/install-ast-wiring/kickoff.md).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Layer 1 (detect + wire OUR globs / record R2 N/A) — see [2026-06-16-install-auto-wire-r2-design.md](2026-06-16-install-auto-wire-r2-design.md) (shipped #553). R2 rule semantics — see [packages/core/eslint-rules/no-unsafe-zod-parse.ts](../../../packages/core/eslint-rules/no-unsafe-zod-parse.ts).

**Date:** 2026-06-17 · **Status:** design (pre-implementation; T5 — design only, no wirer code) · **Branch:** `claude/busy-rubin-c91c6f`

---

## 1. Problem

Layer 1 ([#553](https://github.com/Yhooi2/rules-as-tests-aif/issues/547)) made the installer wire R2 into **our own** shipped `eslint.config.mjs` (patch `RULE_GLOBS.boundary`) or record a re-checkable `R2 N/A`. It deliberately deferred the **riskiest slice**: editing a **consumer-authored** per-package config.

The remaining gap (the #535 case): a consumer package has its own `eslint.config.mjs` that re-exports a base lacking R2 — e.g.

```js
// apps/api/eslint.config.mjs
import base from '../../eslint.config.mjs';
export default base;                       // or: export default [...base, { rules: {…} }]
```

R2 is shipped, but for files under `apps/api/**` it is **silently inert** — the exact false-green the `check:enforced` gate ([SSOT #118](../../../docs/meta-factory/prior-art-evaluations.md)) was built to catch. Today the human must hand-wire R2 into that file. That contradicts "I installed *rules-as-tests* precisely so the rules are ON at install."

**Goal:** the installer **edits the consumer's own config correctly and safely** so R2 is actually enforced there — using AST (structure-aware editing), with a diff preview, confirmation, and idempotency, in the polished style of the best modern installers (cargo, shadcn, astro). The operator's framing: **"AST там, где они лучше"** — AST where it is genuinely better; thin bash everywhere else.

## 2. Goal / acceptance (of the eventual implementation — this spec scopes it)

1. On a fixture monorepo with a real `.parse()` boundary AND a per-package `eslint.config.mjs` that re-exports a base lacking R2: after `./install.sh ts-server --full`, R2 is **actually enforced** in that package — proven by `eslint --print-config` showing the rule (the #535 gate) — **without** clobbering the consumer's other config, comments, or formatting.
2. The edit is **AST-based** (ts-morph), **idempotent** (re-run = no-op), shows a **diff preview**, and **confirms** (auto-yes under `--full`).
3. **Degrades cleanly** when the AST engine cannot run (Node truly absent): never errors, never half-edits; prints a precise manual-wire snippet and leaves the gate as today's honest alarm.
4. AI-agnostic, no paid-LLM-in-CI ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)); `install.sh` itself stays bash (the AST lives in a TS-core module it calls).

## 3. §4 resolution (the brainstorm deliverable)

Every verdict below is backed by an evidence-bearing tool call run this session (per [phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md) H1 + [ai-laziness-traps.md §2 T20](../../../.claude/rules/ai-laziness-traps.md)). Prior-art sweep: DeepWiki ×5 (`unjs/magicast`, `dsherret/ts-morph`, `withastro/astro`, `shadcn-ui/ui`, `rust-lang/cargo`) + WebSearch ×5.

### Q3 — Tool: **ts-morph (REUSE)**. magicast = REJECT-as-engine / ADOPT-VOCABULARY-as-UX.

**The decisive finding (a T16 trap avoided):** the kickoff cited astro→magicast as the industry pattern. But DeepWiki on `unjs/magicast` shows magicast **structurally fails on our exact target shape**:
- `export default [...baseConfig, {…}]` → throws `MagicastError` ("Casting 'SpreadElement' is not supported").
- `export default someBase` is editable **only** if `someBase` is a local variable — **not** when imported/re-exported from another module.

That *is* the #535 case. "astro uses magicast → we use magicast" would pattern-match on name onto the wrong problem class.

DeepWiki on `dsherret/ts-morph` confirms ts-morph **can** open `.mjs`, modify exported array/object literals, and write back preserving comments/formatting of unchanged code, transactionally (`project.save()`). It is **already a direct dependency** (`packages/core/node_modules/.pnpm/ts-morph@28`, used by [audit-r4.ts:11](../../../packages/core/probes/audit-r4.ts), [audit-ai-docs.ts](../../../packages/core/audit-self/audit-ai-docs.ts), [cmd-script-liveness.ts](../../../packages/core/hooks/checks/cmd-script-liveness.ts)) → **zero new dependency**.

> **T16 problem-class check (own-stack reuse, written explicitly):** existing ts-morph use (`audit-r4.ts`) *reads & analyses* `.ts`. Our problem class is *edit & write-back* a `.mjs` config with formatting preserved. **Match? Partial.** Same engine, broader operation. The reuse is the *dependency + Project API*, not a transfer of validation — the write-back-with-formatting path is new and carries its own risk (§9 risk 1), tested explicitly (§8 fixture E).

*Wrong if:* a future ts-morph version drops `.js`/`.mjs` manipulation, or a fixture proves it cannot wrap an imported-base export without corrupting the file → revisit magicast-with-fallback or a string-splice for the trivial case.

### Q3-cross — **cargo `add` / `toml_edit` = REFERENCE** (cross-language proof the pattern is right).

DeepWiki on `rust-lang/cargo`: `cargo add` edits the user's `Cargo.toml` via `toml_edit` (a format-preserving CST), using **decorator preservation** (clone whitespace/comments from the old node onto the new before replacement) and **minimal in-place edits** rather than reprinting whole tables; it is idempotent and has a `--dry-run`. Its changelog explicitly fixed "don't duplicate comments when editing." This is **our problem class in another language** and proves: (a) format-preserving AST edit of a user config is the correct, shipped-at-scale pattern; (b) format preservation must be a **tested invariant**, not assumed.

### Q1 — Scope: **B** (AST is the primary path for classify + write; bash-grep is the degrade fallback).

Per the operator's steer ("AST там где можно; bash тонким"), AST is primary. The earlier worry that "B dual-maintains a grep + an AST classifier" is resolved by the operator's **ensure-then-use** model (Q4): bash *ensures the AST engine is present, then uses it*, so AST is near-universal and the grep path shrinks to a rare emergency rather than a co-equal feature. Layer 1's shipped grep classifier ([detect-r2-boundary.sh](../../../packages/core/audit-self/detect-r2-boundary.sh)) is **kept**, not expanded — it becomes the node-absent degrade, not a parallel feature with ongoing parity cost.

*Wrong if:* implementation shows the AST classifier and the grep classifier drift in verdicts on real fixtures → collapse back to grep-classify + AST-write-only (the original "A").

### Q4 — Where the wirer runs: **bash ensures the AST engine, then calls it (`ensure-then-use`)** — the operator's model.

The wirer runs from the framework's bundled `$PKG_ROOT/node_modules` (ts-morph already there) via `node`/`npx tsx`, the established pattern ([audit-r4 invoked via `npx tsx`](../../../install.sh) at install.sh:815). Crucially, `install.sh` runs **before** the consumer's `npm install` and checks `command -v node` before node work ([install.sh:411,428,1261](../../../install.sh)). So "ensure" =:
1. ts-morph is **shipped with us** (bundled) — no consumer install needed for the engine itself.
2. bash checks `command -v node`. Present (the norm for any JS/TS consumer) → run the AST wirer against the bundled engine. Truly absent → degrade (§6).

> This honors "поставить AST-движок первым, bash тонким": the engine ships with the framework; bash's only job is *is Node here? → call TS-core*. We do **not** silently bootstrap a Node runtime from bash (OS-specific, invasive); a missing Node is surfaced, not magicked.

### Q5 — `--full` = `assumeYes` (confirmed).

ONE wirer, one `assumeYes` switch — not a separate code path. Interactive default → diff preview + `[y/N]`. `--full` → auto-apply (skip prompt), mirroring shadcn/astro `--yes` and the existing `--full` semantics ([install.sh:9,27,78](../../../install.sh)). Non-interactive (no tty) without `--full` → **No** (print the manual snippet in Next steps), matching the existing dep-install posture ([install.sh:1375](../../../install.sh)).

### Q6 — Safety triad: idempotency + diff preview + **skip git-clean**.

astro (DeepWiki) does **not** gate on a clean git tree — it relies on diff + confirm + idempotency. We adopt the same: a git-clean gate adds friction and breaks `--full` in CI/automation with uncommitted changes, for protection that diff+confirm+idempotency+(opt-in `--dry-run`) already provide. Rollback via the consumer's own VCS is always available.

*Wrong if:* a real incident shows a confirmed-but-regretted edit with no easy rollback → add an opt-in `--require-clean` flag (not default).

### Q7 — "AST where better" boundary: **AST for the WRITE (and, under ensure-then-use, the classify); grep stays for the node-absent degrade only.**

AST is genuinely better exactly where regex cannot safely act: rewriting `export default base` → a wrapped, R2-bearing array without corrupting the file. That only runs where the runtime is ensured. The dependency-free grep classifier must remain runnable with no Node ([detect-r2-boundary.sh](../../../packages/core/audit-self/detect-r2-boundary.sh)) — it is the degrade path and Layer 1's already-shipped gate input. This is the literal answer to "AST там, где они лучше."

### Q2 — Umbrella home: **reuse `migration-ast`** (operator decision — "two birds").

The work lands as a **new stage under the existing `migration-ast` umbrella** ([.claude/orchestrator-prompts/migration-ast/](../../../.claude/orchestrator-prompts/migration-ast/)), reusing its ts-morph infrastructure; its `done.md` is written when this stage ships (closing the currently-unclosed umbrella — the operator's "two birds").

> **T16 honesty note:** `migration-ast`'s prior stages converted *probes → AST eslint rules* (writing rules); this stage is an *AST config-editor* (editing a user's config) — a different problem class. They are co-located by the operator's deliberate call (shared AST tooling + closing the dangling umbrella), **not** because the names both say "AST". Recorded so a future reader does not mistake co-location for problem-class identity.

## 4. Build-vs-reuse (capability-commit consult)

| Capability | Verdict | Evidence |
|---|---|---|
| AST engine to edit `.mjs` config | **REUSE** | `ts-morph@28`, already a direct dep ([audit-r4.ts](../../../packages/core/probes/audit-r4.ts)); zero new dep. |
| Format-preserving AST edit of a user config (pattern) | **REFERENCE** | cargo `add`/`toml_edit` (DeepWiki `rust-lang/cargo`) — decorator preservation + minimal edit + tested format preservation. New SSOT entry at implementation. |
| Diff→confirm→idempotent install UX | **ADOPT VOCABULARY** | astro `add` (`diffWords`+`clack.box`+`askToContinue` respecting `--yes`); shadcn (`--dry-run`/`--diff`/`--view`, `--yes`/`--overwrite`, content-equality idempotency). New SSOT entry(ies). |
| magicast as the editing engine | **REJECT** | DeepWiki `unjs/magicast`: `SpreadElement`/imported-base re-export unsupported = our #535 shape. Keep as UX vocabulary only. |
| Opt-in detect-first auto-wire posture | **REUSE/REFERENCE** | `--wire-ci` precedent ([SSOT #117](../../../docs/meta-factory/prior-art-evaluations.md), [install.sh:79](../../../install.sh)). |
| Per-package rule-application liveness | **REUSE** | `check:enforced` via `eslint --print-config` ([SSOT #118](../../../docs/meta-factory/prior-art-evaluations.md)) — the acceptance oracle for "R2 actually enforced". |
| boundary classifier | **REUSE (grep, Layer 1)** | [detect-r2-boundary.sh](../../../packages/core/audit-self/detect-r2-boundary.sh) — kept as the node-absent degrade. |
| The AST config-wirer itself | **BUILD** | New TS-core module; no upstream wires *our R2* into *an arbitrary consumer eslint flat-config*. Built on REUSEd ts-morph; REFERENCEs cargo's technique. |

`Prior-art:` trailer on the implementation's capability commit will cite #117/#118 + the new ts-morph/cargo/astro/shadcn/magicast entries.

## 5. Architecture — "AST-first, bash-thin, ensure-then-use"

```text
install.sh  (thin bash; node-optional; runs BEFORE consumer `npm install`)
  └─ §6b-bis  (install.sh:1042 — Layer 1 today)
       └─ scripts/detect-r2-boundary.sh  ──► boundary-present | no-boundary-confident | ambiguous
            ├─ boundary-present:
            │     • Layer 1 (shipped): patch RULE_GLOBS.boundary in OUR eslint.config.mjs
            │     • Layer 2 (THIS spec): if a CONSUMER per-package config leaves R2 inert →
            │           if `command -v node`:  npx tsx <wirer>  (AST: ensure-then-use)
            │           else:                  print manual snippet, gate stays honest alarm
            ├─ no-boundary-confident: Layer 1 N/A record (unchanged)
            └─ ambiguous:             leave the alarm (unchanged)
```

Three units, each with one job:

- **Thin bash probe (in `install.sh` §6b-bis, `boundary-present` arm).** Decides *whether* a consumer-config edit is even needed; checks `command -v node`; calls the TS wirer or degrades. ≤~15 new lines. No AST logic in bash.
- **TS-core AST wirer (`packages/core/install/wire-eslint-r2.ts`, new — BUILD).** The only smart unit. Input: a target config path + the R2 rule id/plugin. Does: parse with ts-morph → locate the export → compute the minimal edit (add R2 to a rules object; or wrap `export default base` → `export default [...base, { rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }]`) → idempotency check (already present? no-op) → render diff → (confirm | assumeYes) → `project.save()`. Pure module; testable in isolation against fixtures.
- **UX/diff helper (small, in the wirer or a sibling).** Produces the diff preview and the manual-snippet fallback text. One source for both the interactive box and the degrade output (no two-prompt drift, per [dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md)).

## 6. UX specification (the "топовый UX" payload)

What the consumer sees, modeled on cargo + shadcn + astro:

1. **Preview before write** — a unified/word-level diff of *only* the lines the wirer will add, in a boxed preview (astro `diffWords`+`clack.box`).
2. **Confirm** — `Apply this change? [y/N]`. `--full` (or `--yes`) auto-applies; non-interactive without `--full` → No + manual snippet.
3. **Inspect-only flags** — `--dry-run` (show what would change, write nothing) and `--diff` (show the diff, imply dry-run), per shadcn. Lets a cautious consumer look first.
4. **Idempotent** — re-running detects R2 already wired (AST-level check) and prints `· R2 already enforced in <file> (no change)`; never duplicates (astro `input===output` + shadcn content-equality).
5. **Minimal edit, format preserved** — add the smallest node; preserve surrounding comments/whitespace (cargo decorator-preservation technique). Mitigates ts-morph reprint drift (§9 risk 1).
6. **Informative next step** — on degrade or `--dry-run`: print the exact manual snippet and `Re-run with --full to apply automatically.`
7. **No git-clean gate** (Q6).

**Degrade output (node absent), verbatim-style:**
```text
· R2 not auto-wired: Node not found, AST editor unavailable.
  Add to apps/api/eslint.config.mjs:
    export default [...base, { rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }];
  (or install Node and re-run ./install.sh ts-server --full)
```

## 7. Positioning / promotion (operator's explicit ask)

This is a deliberate, documented product-positioning point, to surface in README / marketing when the tool is promoted:

> **rules-as-tests installs the way the best modern tools do.** Like **cargo** (`cargo add` edits `Cargo.toml` via `toml_edit`), **shadcn** (`--dry-run`/`--diff`, owns-your-files philosophy), and **astro** (`astro add` AST-edits your config with a diff preview), our installer edits your config **with AST, shows you the diff, asks before writing, and is safe to re-run** — never a regex hack, never a silent clobber.

Concretely: the README install section should name cargo/shadcn/astro as the UX lineage. (Implementation-phase doc edit; recorded here so it is not lost.)

## 8. Testing (no paid LLM; bash install-harness + TS unit tests)

`tests/install-sh/` + ts-morph unit tests on fixtures:

- **Fixture A — re-export base, real boundary** (`apps/api/eslint.config.mjs: export default base`, base lacks R2, a `.parse()` boundary exists): `install --full` → wirer edits the consumer config → `eslint --print-config` shows R2 (#535 acceptance). *The headline red→green.*
- **Fixture B — spread re-export** (`export default [...base, {…}]`): wirer adds an R2 rules element → enforced. *(The exact magicast-failure shape — proves ts-morph clears it.)*
- **Fixture C — idempotency:** run the wirer twice → second run is a no-op, byte-identical file.
- **Fixture D — node absent:** `command -v node` fails → install completes **rc=0**, prints the manual snippet, no half-edit. *(Falsifier for T-ASTwire-A.)*
- **Fixture E — formatting preserved:** a consumer config with comments + custom indentation → after wiring, all unchanged lines are byte-identical; only the R2 addition differs. *(cargo's hard-won invariant.)*
- **Install rc asserted `=0` on every arm** (a mid-install crash must not false-green — [GH #531/#544](https://github.com/Yhooi2/rules-as-tests-aif/issues/531)).

## 9. Open risks (carry into the plan)

1. **ts-morph reprint can shift indentation.** WebSearch + ts-morph docs: edits may reflow formatting; the common fix is `formatText()` or an `eslint --fix` pass. Mitigation: minimal-edit technique (cargo) + **Fixture E** as a blocking gate. *Falsifier:* Fixture E fails → add a post-edit `formatText()`/`--fix` step or fall back to a targeted string splice for the trivial `export default base` case.
2. **Wrapping an imported base is a structural transform**, not a literal push. The wirer must handle: array literal (push element), `export default base` (wrap in array), `export default defineConfig([...])` (insert), and bail safely to the manual snippet on anything it does not recognize (never a partial edit).
3. **Two gates already honor R2 N/A** (`check:globs` + `check:enforced`); Layer 2 only *adds* enforcement to a consumer file — it must not interfere with the Layer 1 N/A path. Plan keeps Layer 2 strictly inside the `boundary-present` arm.
4. **`migration-ast` co-location** (Q2) mixes problem classes by design; the stage doc must carry the §3 T16 note so the umbrella's scope stays legible.

## 10. Recursive self-application

This repo is itself an `apps/`+`packages/` monorepo. A self-probe in the audit-self suite should confirm that running the wirer's *classification* + a *dry-run* against the framework's own configs yields a defensible result (R2 already wired here → idempotent no-op), exercising the "already enforced → no change" path on real code — the same "make self-audit green" invariant the project applies everywhere.

## 11. AI-traps honored (per [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md))

- **T5** — design only; no wirer code in this session. ✓
- **T11/T12** — DeepWiki ×5 + WebSearch ×5 run at proposal time, ≥3 phrasings, not from memory. ✓
- **T13/T16** — ts-morph reuse problem-class match written explicitly (§3 Q3); magicast name-match trap caught and documented. ✓
- **T20** — every §4 verdict carries an evidence-bearing tool call from this session. ✓
- **T-ASTwire-A** (kickoff domain trap) — node-absent degrade is a first-class acceptance dimension (Fixture D), not bolted on. ✓

## 12. See also

- [.claude/orchestrator-prompts/install-ast-wiring/kickoff.md](../../../.claude/orchestrator-prompts/install-ast-wiring/kickoff.md) — origin kickoff (§4 resolved here).
- [2026-06-16-install-auto-wire-r2-design.md](2026-06-16-install-auto-wire-r2-design.md) — Layer 1 (shipped #553); the deferral this closes.
- [install.sh](../../../install.sh) — runtime model (node-optional `:411,428`; `--full` `:9,78`; §6b-bis `:1042`).
- [packages/core/audit-self/detect-r2-boundary.sh](../../../packages/core/audit-self/detect-r2-boundary.sh) — Layer 1 grep classifier (kept as degrade).
- [.claude/orchestrator-prompts/migration-ast/](../../../.claude/orchestrator-prompts/migration-ast/) — umbrella home (Q2).
- [.claude/rules/build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) · [dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md) · [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md).
