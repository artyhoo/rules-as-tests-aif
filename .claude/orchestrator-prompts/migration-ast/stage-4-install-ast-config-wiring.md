# migration-ast / Stage 4 — Install-time AST config wiring (GH #547 Point 2, Layer 2)

> **Type:** IMPLEMENTATION (I-phase). Takes the FROZEN design spec to shippable code + tests.
> **Umbrella:** `migration-ast` / Stage 4 (next free stage after 1, 2, 2A, 2B, 2C, 3).
> **Base:** `staging`.
> **Frozen design SSOT:** [`docs/superpowers/specs/2026-06-17-install-ast-wiring-design.md`](../../../docs/superpowers/specs/2026-06-17-install-ast-wiring-design.md) (PR #628). **Do NOT re-open §4 verdicts** — they are resolved (table in §1 below). This stage implements them.
> **Origin kickoff (brainstorm):** [`.claude/orchestrator-prompts/install-ast-wiring/kickoff.md`](../install-ast-wiring/kickoff.md).
> **Closes:** the deferred **Layer 2** of [GH #547](https://github.com/Yhooi2/rules-as-tests-aif/issues/547) Point 2 (Layer 1 shipped #553). When this stage ships, **write `migration-ast/done.md`** (spec Q2 — "two birds": close the long-open umbrella). See §11.

---

## 1. Frozen design — the resolved verdicts (build on these, do NOT re-derive)

Every verdict below is **decided** in the spec with an evidence-bearing tool call. Treat as given.

| Question | FROZEN verdict | Spec ref |
|---|---|---|
| Q1 Scope | **B** — AST is the primary classify+write path; bash-grep (`detect-r2-boundary.sh`) is the node/engine-absent **degrade** fallback only (kept, not expanded). | spec §3 Q1, Q7 |
| Q2 Umbrella | **Reuse `migration-ast`**, land as a new stage; write its `done.md` when this ships. | spec §3 Q2 |
| Q3 Tool | **ts-morph = REUSE** (engine). **magicast = REJECT-as-engine** (fails on our exact `SpreadElement` / imported-base shape) / **ADOPT-VOCABULARY-as-UX**. | spec §3 Q3 |
| Q3-cross | **cargo `add` / `toml_edit` = REFERENCE** — format-preserving CST edit of a user config is the correct, shipped-at-scale pattern; format preservation is a **tested invariant**. | spec §3 Q3-cross |
| Q4 Where the wirer runs | **`ensure-then-use`** — thin bash checks the engine is reachable, then calls the TS-core wirer; no silent Node bootstrap. **(⚠ premise correction — §3.)** | spec §3 Q4 |
| Q5 `--full` | `--full` = `assumeYes` — ONE wirer, one switch (not a separate code path). Interactive default → diff + `[y/N]`; non-tty without `--full` → No + manual snippet. | spec §3 Q5 |
| Q6 Safety triad | idempotency + diff preview + **skip git-clean gate** (astro pattern; rollback via consumer VCS). Opt-in `--dry-run` / `--diff`. | spec §3 Q6 |
| Q7 "AST where better" | AST for the WRITE (and, under ensure-then-use, the classify); grep stays for the degrade path only. | spec §3 Q7 |

**The headline acceptance** (spec §2.1): on a fixture monorepo with a real `.parse()` boundary AND a per-package `eslint.config.mjs` re-exporting a base that lacks R2, after `./install.sh ts-server --full` R2 is **actually enforced** there — proven by `eslint --print-config` showing the rule (the #535 gate) — **without** clobbering the consumer's other config, comments, or formatting.

---

## 2. Implementation components (spec §5 — three units, one job each)

> **Architecture invariant:** AST-first, **bash-thin**, ensure-then-use. `install.sh` stays bash; ALL AST logic lives in TS-core. No paid LLM, AI-agnostic ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)).

### (a) Thin bash probe — in `install.sh` §6b-bis, the `boundary-present` arm

- **Where:** [`install.sh:1042`](../../../install.sh) is the `# ─── 6b-bis ───` block; [`install.sh:1055`](../../../install.sh) is the `boundary-present)` case. Layer 1 (shipped #553) already patches `RULE_GLOBS.boundary` in **our** `eslint.config.mjs` there. **Layer 2 (this stage)** adds: if a CONSUMER per-package config leaves R2 inert, hand off to the TS wirer.
- **Job:** decide *whether* a consumer-config edit is even needed; check the engine is reachable (`command -v node` **and** ts-morph resolvable — §3); call `npx tsx <wirer>` or print the degrade snippet. **≤~15 new lines. NO AST logic in bash.**
- **rc=0 on every branch** — a crash here must never abort install (lesson [GH #531/#544](https://github.com/Yhooi2/rules-as-tests-aif/issues/531); the §6b-bis comment at install.sh:1047 already states this).
- **Placement caveat (§3 fork):** §6b-bis at install.sh:1042 runs **before** the consumer dep-install (`--full` dep-install is at ~install.sh:1340). The AST write needs ts-morph, which under the current model only lands at dep-install time. Resolve per §3 — do **not** assume the engine is present at line 1042.

### (b) TS-core AST wirer — `packages/core/install/wire-eslint-r2.ts` (NEW — the BUILD)

Confirmed absent today (`packages/core/install/` does not exist) → this is the BUILD target. The only smart unit. Pure module, testable in isolation against fixtures.

- **Input:** target config path + R2 rule id/plugin (`rules-as-tests/no-unsafe-zod-parse`).
- **Does:** parse with ts-morph → locate the `export default` → compute the **minimal** edit:
  - array literal (`export default [...]`) → push a `{ rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }` element;
  - `export default base` (imported/re-exported base) → wrap: `export default [...base, { rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }]`;
  - `export default defineConfig([...])` → insert into the array arg;
  - **anything unrecognised → bail safely to the manual snippet** (never a partial/half edit — spec §9 risk 2).
- **Idempotency:** AST-level check — R2 already present → no-op, byte-identical file (spec §6.4).
- **Render diff** → (confirm | `assumeYes`) → `project.save()`.
- **Format preservation** (spec §9 risk 1): ts-morph reprint can shift indentation. Use the minimal-edit technique (cargo decorator-preservation); if Fixture E (§4) fails, add a post-edit `formatText()` / `eslint --fix` pass OR fall back to a targeted string-splice for the trivial `export default base` case.

### (c) UX / diff helper (small — in the wirer or a sibling)

Produces the diff preview **and** the manual-snippet fallback text from **one source** (no two-prompt drift — [dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md)). UX payload (spec §6): boxed word-level diff before write; `Apply this change? [y/N]` (`--full`/`--yes` auto-applies; non-tty without `--full` → No); `--dry-run` / `--diff` inspect-only flags; idempotent re-run prints `· R2 already enforced in <file> (no change)`; degrade output verbatim-style:

```text
· R2 not auto-wired: AST editor unavailable (Node or ts-morph not present).
  Add to <pkg>/eslint.config.mjs:
    export default [...base, { rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }];
  (or run ./install.sh ts-server --full to install dev-deps and auto-wire)
```

---

## 3. ⚠ VERIFIED PREMISE CORRECTION (T13 — do not trust "already a dep" without confirming)

**The frozen spec §4/§5/Q4 claims ts-morph is "already a direct dependency … `packages/core/node_modules/.pnpm/ts-morph@28` … shipped with us (bundled) — zero new dep."** Ground-truth verification on `staging` (2026-06-17) shows this premise is **FALSE as stated**:

- `ts-morph` is **not** in `packages/core/package.json` (deps or devDeps) — verified: the file lists `tsx`, `typescript`, `@typescript-eslint/*`, `eslint`, `vitest`, `remark*`, `ajv` only. It is **not in any `package.json` in the repo** (`grep -rln 'ts-morph' --include=package.json` → 0 hits).
- It **is** a **CONSUMER dev-dependency** — [`setup.sh:336`](../../../setup.sh) (`"ts-morph@^24.0.0"`), installed into the *consumer's* `node_modules` by `setup.sh` / the `--full` dep-install. **Version note:** the engine the wirer actually runs against is the consumer's **`ts-morph@^24`** (not the `28` the spec cites). The wirer MUST use v24-available APIs (`Project`, `getExportedDeclarations`, array/object-literal manipulation, `project.save()` all exist in v24); if any API you reach is v28-only, that surfaces as a Fixture B/E failure — pin/check the version at implementation.
- CI runs `audit-r4.ts` (its only ts-morph user, [`packages/core/probes/audit-r4.ts:11`](../../../packages/core/probes/audit-r4.ts)) in the **consumer/fixture** context where the dev-dep is present ([`tests/install-sh/audit-r4-shipped.test.sh`](../../../tests/install-sh/audit-r4-shipped.test.sh), `audit-self.yml`). The shipped probe **degrades** when ts-morph is absent — the pattern to mirror lives at [`packages/core/audit-self/audit-ai-docs.sh:81`](../../../packages/core/audit-self/audit-ai-docs.sh) (`[ ! -f node_modules/ts-morph/package.json ] … warn "skipped"`) and [`audit-ai-docs.ts:196`](../../../packages/core/audit-self/audit-ai-docs.ts) (`existsSync('node_modules/ts-morph/package.json')`). *(`detect-r2-boundary.sh` does NOT check ts-morph — it is the grep boundary classifier; do not look there.)*

**Why this is load-bearing, not pedantic:** the spec's degrade trigger (Q4) is keyed on **`command -v node`** only. With node present but ts-morph absent (the actual fresh-install reality at §6b-bis time), the wirer would **crash on `import { Project } from 'ts-morph'`, not degrade.** And §6b-bis (install.sh:1042) runs **before** the dep-install (~install.sh:1340), so even under `--full` the engine is not yet present at that line.

**This is NOT re-opening §4.** The Q3 verdict (ts-morph REUSE) and the Q4 model (`ensure-then-use`) stand. What changes is only the spec's incidental **belief** about *where ts-morph already lives*. The implementer MUST make "ensure" real:

1. **Broaden the ensure-check** from "node present" to "node present **and** ts-morph resolvable" (mirror the existing `node_modules/ts-morph/package.json` check pattern). **Degrade on engine-absent too**, not just node-absent. Add **Fixture F** (§4) for node-present / ts-morph-absent → rc=0 + manual snippet.
2. **Resolve the engine-availability + install.sh-ordering fork** below. **This is a genuine fork the spec left unresolved → PARK it** (§8) if not deterministically clear in the implementer's context; do not guess.

### Engine-availability fork (PARK as `manualReviewRequired` if ambiguous)

| Option | What it does | Consequence |
|---|---|---|
| **A — move Layer-2 after dep-install** | Run the Layer-2 wirer step *after* the `--full` dep-install (~install.sh:1340+), gating the AST auto-apply on `--full`; degrade otherwise. | Smallest change; honors ensure-then-use; AST only fires when `--full` guaranteed the engine. Layer-2 splits from Layer-1's §6b-bis position. |
| **B — add ts-morph as a framework dep + bundle** | Add `ts-morph` to `packages/core` deps and ensure `$PKG_ROOT/node_modules` ships/installs it, so the wirer runs anytime node is present (at §6b-bis position). | Makes the spec's "bundled" literally true; **a NEW framework capability-commit** (contradicts the spec's "zero new dep" wording — record honestly). Heavier; raises "does the framework ship its node_modules?" — verify before choosing. |
| **C — on-the-fly engine fetch** | The bash probe `npx`-installs ts-morph on demand before the wirer. | Network-dependent, slower, violates "no silent bootstrap" (Q4). **Least preferred.** |

**Recommended deterministic path (decide + report unless your context makes it genuinely ambiguous):** **Option A** — it is the smallest diff, honors the frozen `ensure-then-use` model literally, and keeps "zero new framework dep" true (ts-morph stays the consumer dev-dep `--full` already installs). Option A makes the AST auto-apply a **`--full`-gated** capability and the non-`--full`/lite path a clean degrade — exactly the spec's posture. *Wrong if:* a fixture proves the consumer dep-install does not reliably leave ts-morph resolvable from where the wirer runs → fall back to B (framework dep). If you cannot disprove A's premise mechanically, **PARK A-vs-B** rather than guess.

---

## 4. Acceptance fixtures (spec §8 — no paid LLM; bash install-harness + TS unit tests)

`tests/install-sh/` + ts-morph unit tests on fixtures. **Every fixture asserts the install/wirer exit code explicitly** — a mid-install crash must not false-green ([GH #531/#544](https://github.com/Yhooi2/rules-as-tests-aif/issues/531)).

- **Fixture A — re-export base, real boundary** (`apps/api/eslint.config.mjs: export default base`, base lacks R2, a `.parse()` boundary exists): `install --full` → wirer edits the consumer config → `eslint --print-config` shows R2 (#535 acceptance). *The headline red→green.*
- **Fixture B — spread re-export** (`export default [...base, {…}]`): wirer adds an R2 rules element → enforced. *(The exact magicast-failure shape — proves ts-morph clears it.)*
- **Fixture C — idempotency:** run the wirer twice → second run is a no-op, **byte-identical** file.
- **Fixture D — node absent:** `command -v node` fails → install completes **rc=0**, prints the manual snippet, no half-edit. *(Falsifier for T-ASTwire-A.)*
- **Fixture E — formatting preserved (🔴 BLOCKING GATE):** a consumer config with comments + custom indentation → after wiring, all unchanged lines are **byte-identical**; only the R2 addition differs. *(cargo's hard-won invariant; spec §8 + §9 risk 1. This gate blocks ship — if it fails, apply the §2(b) format-preservation mitigation, do not relax the assertion.)*
- **Fixture F — node present, ts-morph absent (NEW — §3):** the engine cannot be imported → install completes **rc=0**, prints the manual snippet, **no crash, no half-edit**. *(Falsifier for T-ASTwire-B; the premise-correction gate.)*
- **Install rc asserted `= 0` on every arm.**
- **Self-probe (spec §10 — recursive self-application):** the wirer's *classify + dry-run* against this repo's own `apps/`+`packages/` configs yields a defensible result (R2 already wired here → idempotent no-op), exercising the "already enforced → no change" path on real code.

---

## 5. Build-vs-reuse — capability-commit gate (MANDATORY before the wirer commit)

The wirer (`wire-eslint-r2.ts`) is a **capability commit** (new file ≥80 LOC under `packages/`, per [CLAUDE.md «What is a capability commit?»](../../../CLAUDE.md)). Before committing it you **MUST** register SSOT entries in [`docs/meta-factory/prior-art-evaluations.md`](../../../docs/meta-factory/prior-art-evaluations.md) (append-only, §3) and carry a `Prior-art:` trailer. Per spec §4, register:

| Capability | Verdict | SSOT entry to add |
|---|---|---|
| AST engine to edit `.mjs` config | **REUSE** | `ts-morph` — but record the §3 correction: it is the **consumer dev-dep** (`setup.sh:336`), not a framework dep. Cite existing use ([audit-r4.ts](../../../packages/core/probes/audit-r4.ts)). |
| Format-preserving AST edit of a user config (pattern) | **REFERENCE** | cargo `add` / `toml_edit` (DeepWiki `rust-lang/cargo`) — decorator preservation + minimal edit + tested format preservation. |
| Diff→confirm→idempotent install UX | **ADOPT VOCABULARY** | astro `add` (`diffWords`+`clack.box`+`askToContinue` respecting `--yes`); shadcn (`--dry-run`/`--diff`, `--yes`, content-equality idempotency). |
| magicast as the editing engine | **REJECT** | DeepWiki `unjs/magicast`: `SpreadElement` / imported-base re-export unsupported = our #535 shape. UX vocabulary only. |
| The AST config-wirer itself | **BUILD** | New TS-core module; no upstream wires *our R2* into *an arbitrary consumer eslint flat-config*. Built on REUSEd ts-morph; REFERENCEs cargo's technique. |

Reuse the existing precedents where they already cover the area: `--wire-ci` opt-in posture ([SSOT #117](../../../docs/meta-factory/prior-art-evaluations.md)); `check:enforced` via `eslint --print-config` as the acceptance oracle ([SSOT #118](../../../docs/meta-factory/prior-art-evaluations.md)); `detect-r2-boundary.sh` grep classifier as the degrade ([Layer 1, #553](../../../packages/core/audit-self/detect-r2-boundary.sh)).

**`Prior-art:` trailer** on the wirer commit must cite #117/#118 + the new ts-morph/cargo/astro/shadcn/magicast entries. Run the [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) consult (DeepWiki ≥3 phrasings + WebSearch ≥3 phrasings) if you BUILD anything the spec did not already evidence; the spec already ran DeepWiki ×5 + WebSearch ×5, so reuse that evidence and only extend it where your implementation diverges (e.g. Option B framework-dep changes the verdict — re-consult then).

---

## 6. AI-laziness traps (per [`.claude/rules/ai-laziness-traps.md §2`](../../../.claude/rules/ai-laziness-traps.md))

See [`.claude/rules/ai-laziness-traps.md §2`](../../../.claude/rules/ai-laziness-traps.md). **Active canonical traps for this IMPLEMENTATION phase: T3, T5(inverse), T13, T15, T16, T19, T20.**

- **T3 (file:line evidence)** — every finding/claim in the REPORT carries a command+output or `file:line` + the line's actual content. The §3 premise correction is the model: ground-truth `grep`/`sed`, not "the spec says so".
- **T5 inverse** — the brainstorm was T5 (design-only). This is the I-phase: **write the code + tests**. Do not stop at "I would implement"; ship the wirer, the bash arm, and Fixtures A–F.
- **T13 / T16 (problem-class match, don't trust "already validated")** — the spec's "ts-morph already bundled" claim is the exact T13 trap; §3 catches it. For the REUSE, write explicitly: *"Upstream/own problem class: audit-r4 **reads & analyses** `.ts`. Our problem class: **edit & write-back** a `.mjs` config with formatting preserved. Match? Partial — same engine, broader op; the write-back path is new (Fixture E)."*
- **T15 (self-application)** — satisfied via the §4 **self-probe** (run the wirer's classify + dry-run against this repo's own `apps/`+`packages/` configs → idempotent no-op). I-phase, so not separately R-phase-enumerated, but the recursive-self-application invariant is honored on real code.
- **T19 (own cold-QA before handoff)** — CI green ≠ design review. Before handoff, run your **own** adversarial cold-review of the diff (fresh reviewer over the actual change). The §3 finding is itself a T19/T13 catch a green CI would have missed.
- **T20 (no inline verdict without evidence)** — every verdict (engine-availability A/B/C, format-preservation mitigation choice) needs an evidence-bearing tool call in the same turn.

**Domain-specific traps (NOT in the canonical catalogue):**

- **T-ASTwire-A** (from the brainstorm) — designing the wirer for the **happy path only** (node present, one config shape) and forgetting the **node-absent** degrade, which is the *default* install path. Counter: Fixture D is a first-class acceptance dimension, not bolted on.
- **T-ASTwire-B (NEW)** — **engine-presence assumed from a spec claim.** The implementer trusts the spec's "ts-morph already bundled" and writes the degrade trigger on **node-absence only**, so a node-present / ts-morph-absent install **crashes** (`import 'ts-morph'` throws) instead of degrading. Counter: the ensure-check tests **engine resolvability** (`node_modules/ts-morph` present), degrade when absent; **Fixture F** is the falsifier (node present, ts-morph absent → rc=0 + manual snippet). This trap is the operational form of T13 for *this* stage.

---

## 7. Worktree, branch, commit, verify

1. **Worktree isolation** (never the shared checkout — [parallel-subwave-isolation.md](../../../.claude/rules/parallel-subwave-isolation.md)): `bash scripts/create-worktree.sh migration-ast-stage4`. Base auto-resolves to `origin/staging`.
2. **Atomic commits within this umbrella scope** are fine (multiple files OK); stay strictly inside Stage-4 scope ([CLAUDE.md «PR strategy»](../../../CLAUDE.md)). Do not retroactively track migration-ast Stages 1-3 (separate concern — surface as an observation if relevant).
3. **VERIFY before handoff:**
   - `bash -n install.sh` (bash syntax OK).
   - `npx tsx packages/core/install/wire-eslint-r2.ts --help` (or a unit harness) parses.
   - **Full principle suite green:** `cd packages/core && npx vitest run principles/` — the §6b-bis change touches `install.sh` and adds a tracked file under `orchestrator-prompts`; principle 12 globs only `*/kickoff.md` so this stage file is invisible to it, but **run the suite to confirm** (T19; principle-12 has surprised twice — do not assume).
   - **Fixtures A–F all pass; Fixture E (format-preserved) is the blocking gate.**
   - Install-sh harness: `bash tests/install-sh/<new-test>.sh` → rc reported, all arms rc=0.
4. **Commit** the wirer as a capability commit with the `Prior-art:` trailer (§5). Suggested subject:
   `feat(install): AST-wire R2 into consumer eslint config (ts-morph; #547 Layer 2)`

---

## 8. Park-don't-guess levers (autonomous aif-handoff dispatch)

This stage has at least one **genuine fork the frozen spec left unresolved** (the §3 engine-availability A/B/C + install.sh ordering) and a conditional one (format-preservation mitigation if Fixture E fails). If dispatched autonomously, the park-don't-guess levers are **non-negotiable** (else `#autonomous-dispatch-without-park`):

- Set **`AGENT_MAX_REVIEW_ITERATIONS=1`**.
- **PARK any genuine fork as a `manualReviewRequired` question** in `Option A → consequence X / Option B → consequence Y` form — specifically:
  - the §3 engine-availability fork (**A** move-after-dep-install / **B** framework-dep / **C** on-the-fly) if you cannot mechanically disprove Option A's premise in your context;
  - the format-preservation mitigation (`formatText()` vs `eslint --fix` vs string-splice) **only if** Fixture E fails and the choice is non-obvious.
- **Proceed only on the deterministic path:** the §1 frozen verdicts, the §2 component shapes, Fixtures A–F, and the §3 **recommended** Option A where its premise holds. A clear call (one option better on the merits, premise verified) is **decided and reported**, NOT routed through a question ([recommendation-laziness-discipline.md §3](../../../.claude/rules/recommendation-laziness-discipline.md)).

---

## 9. Anti-scope

- Do **NOT** re-open §4 spec verdicts (Q1–Q7) — they are frozen. The §3 correction is a *premise* fix, not a verdict change.
- Do **NOT** redo #547 Layer 1 (#553, shipped) — only ADD the consumer-config Layer 2 inside the `boundary-present` arm; never interfere with the Layer 1 `R2 N/A` path (spec §9 risk 3: the `check:globs` + `check:enforced` N/A gates must stay green).
- Do **NOT** put AST logic in `install.sh` — bash stays thin; the engine lives in TS-core.
- Do **NOT** add a paid-LLM-in-CI path; do **NOT** make any companion mandatory for consumers.
- Do **NOT** retroactively track migration-ast Stages 1-3 in this PR (drive-by scope).
- Do **NOT** modify `~/.claude/skills/` (agent-uncommittable).

---

## 10. Egress (after the worker is done)

```bash
npx tsx packages/runtime-bridge/src/cli/harvest.ts <taskId> --base staging
```

---

## 11. Umbrella closure (spec Q2 — "two birds")

When this stage's PR merges, the merging session **writes** `.claude/orchestrator-prompts/migration-ast/done.md` per [CLAUDE.md «Umbrella closure convention»](../../../CLAUDE.md):

```text
# migration-ast — DONE
- Final PR: #<num>
- Closed: <YYYY-MM-DD>
- Summary: probes→AST eslint rules (Stages 1-3) + install-time AST config wiring (Stage 4, #547 Layer 2).
```

The umbrella is currently OPEN (no `done.md` on `staging`, verified 2026-06-17). This is the spec's deliberate "close the long-open umbrella" call.

---

## 12. REPORT (what the worker returns)

- **Files:** `<list>` (expect: `packages/core/install/wire-eslint-r2.ts`, the UX helper, `install.sh` §6b-bis edit, `tests/install-sh/<new>.sh` + ts-morph unit tests, SSOT entries, possibly `packages/core/package.json` if Option B).
- **Engine-availability resolution:** which of §3 A/B/C — decided (with evidence) or PARKED (with the question text).
- **Fixtures:** A–F results; **Fixture E (format-preserved) = PASS/FAIL** called out explicitly.
- **Install rc:** =0 on every arm (state the assertion).
- **Build-vs-reuse:** SSOT entries added; `Prior-art:` trailer SHA.
- **Diff:** `git diff --stat`.
- **T19 own cold-QA:** what your adversarial self-review found.
- **Confidence + ATTN:** explicit predicates, not "high".

---

## 13. See also

- [`docs/superpowers/specs/2026-06-17-install-ast-wiring-design.md`](../../../docs/superpowers/specs/2026-06-17-install-ast-wiring-design.md) — FROZEN design SSOT (this stage implements it).
- [`docs/superpowers/specs/2026-06-16-install-auto-wire-r2-design.md`](../../../docs/superpowers/specs/2026-06-16-install-auto-wire-r2-design.md) — Layer 1 (shipped #553); the deferral this closes.
- [`install.sh`](../../../install.sh) — §6b-bis `boundary-present` arm (`:1042`/`:1055`); node-optional (`:411`,`:428`); `--full` (`:9`,`:78`); dep-install (`~:1340`).
- [`packages/core/audit-self/detect-r2-boundary.sh`](../../../packages/core/audit-self/detect-r2-boundary.sh) — Layer 1 grep classifier (kept as degrade).
- [`packages/core/probes/audit-r4.ts`](../../../packages/core/probes/audit-r4.ts) · [`setup.sh:336`](../../../setup.sh) — ts-morph reality (§3).
- [`.claude/rules/ai-laziness-traps.md §2`](../../../.claude/rules/ai-laziness-traps.md) · [`build-first-reuse-default.md §3`](../../../.claude/rules/build-first-reuse-default.md) · [`dual-implementation-discipline.md §7`](../../../.claude/rules/dual-implementation-discipline.md) · [`no-paid-llm-in-ci.md`](../../../.claude/rules/no-paid-llm-in-ci.md) · [`kickoff-staging-placement.md`](../../../.claude/rules/kickoff-staging-placement.md).
</content>
</invoke>
