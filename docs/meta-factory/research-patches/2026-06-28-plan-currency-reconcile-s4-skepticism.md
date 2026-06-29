<!-- scope:plan-currency-reconcile-S4 -->

# plan-currency-reconcile S4 — skepticism pass on three "DONE" surfaces

> **Stream:** `plan-currency-reconcile` (getff-to-prod U1), sub-wave **S4**. **Date:** 2026-06-28. **Class of artefact:** read-only skepticism audit (T5 — no source edits; findings only). Individual patch files inherit the folder Authoritative-for header ([research-patches/README.md](README.md)).
> **Method:** source of truth = `git` / the code on `staging` (HEAD `010148b6a`, == `origin/staging` at audit time), **never** a tracker's prose. Every verdict line is backed by a command + its output or a `file:line` citation (T3). A clean pass at low coverage is reported as "coverage insufficient", not "verified-done" (T14). Genuine forks are **parked**, not guessed (dispatch park-don't-guess rule).

---

## Summary

| # | Target | Verdict | Coverage |
|---|--------|---------|----------|
| 1 | `migration-ast` (closed umbrella, done.md → PR #632) | **verified-done** | high (Stage-4 artefact + live invocation + CI gate) |
| 2 | plugin payload (#673) | **verified-done** | high (every named component enumerated + non-empty + content-checked) |
| 3 | generator "forbid-MVP" | **PARKED — genuine fork** (claim ≠ dispatch path; the two readings give opposite verdicts) | high evidence on both candidate surfaces; verdict label not picked |

---

## Target 1 — `migration-ast` (closed umbrella) → **verified-done**

**Claim** (`.claude/orchestrator-prompts/migration-ast/done.md`):

```text
# migration-ast — DONE
- Final PR: #632
- Closed: 2026-06-18
- Summary: probes→AST ESLint rules (Stages 1-3) + install-time AST config wiring for R2
  into consumer per-package configs (Stage 4, GH #547 Layer 2).
```

**Verification (against staging code, not the doc text):**

1. **The Final PR is on staging.** `git log --oneline --all | grep migration-ast` →
   `c4c19de80 feat(install): AST-wire R2 into consumer eslint config (migration-ast Stage 4, #547 Layer 2) (#632)` and `5d9b33086 chore(umbrella): close migration-ast — done.md (... #632) (#633)`. Both are ancestors of HEAD.

2. **The Stage-4 artefact exists on `origin/staging`** (not just in a feature branch):
   ```text
   $ git ls-tree origin/staging -- packages/core/install/wire-eslint-r2.ts packages/core/install/wire-eslint-r2.test.ts
   100644 blob 55a5758a…  packages/core/install/wire-eslint-r2.test.ts
   100644 blob d09dfa11…  packages/core/install/wire-eslint-r2.ts
   ```
   Working tree: `wire-eslint-r2.ts` = 25 937 bytes, `wire-eslint-r2.test.ts` = 10 846 bytes. Non-empty, real AST wirer.

3. **The "install-time wiring" claim is LIVE, not orphaned code.** PR #632's commit message said the invocation was a `§6b-bis-L2` block in `install.sh`. On staging that block is **no longer in `install.sh`** (`grep -nE 'wire-eslint-r2|6b-bis|ts-morph' install.sh` → empty) — because install was modularized into `setup.d/` layers (getff §0). The invocation moved, intact, to:
   - `setup.d/99-finalize.sh:42` — `# ─── 6b-bis-L2. GH #547 Layer 2: AST-wire R2 into consumer per-package configs ─` (lines 42–53, with the documented degrade-on-absent-ts-morph path).
   - `packages/core/install/synth-and-wire.bundle.mjs:9270` — bundled wirer (`"wire-eslint-r2 — wire R2 (rules-as-tests/no-unsafe-zod-parse) into eslint.config.mjs"`).
   - CI gate: `.github/workflows/audit-self.yml:362` — `install-sh — wire-eslint-r2 (GH #547 Layer 2 AST wirer degrade fixtures D+F)`.
   - Bash test: `tests/install-sh/wire-eslint-r2.test.sh`.

4. **Stages 1-3 (probes→AST ESLint rules):** the AST-over-grep discipline is enforced by `packages/core/principles/03-ast-over-grep.test.ts` (127 lines, present on staging). Verified at the principle-test level.

**Coverage:** high for the headline artefact (Stage 4 = the Final-PR deliverable): file existence on `origin/staging` + a real install-time invocation point + a CI gate + a bash test. Stage 1-3 verified at principle-test presence level only (not line-by-line). The skeptic's trap — "file exists therefore wiring works" — was actively checked: the original `install.sh` site is gone, but the capability is genuinely wired via `setup.d/`. **Verdict: verified-done.**

---

## Target 2 — plugin payload (#673) → **verified-done**

**Claim** (`getff-to-prod-meta-launch/kickoff.md:21`): "✅ Плагин наполнен (агенты/команда/hooks.json/скиллы/мост)" — plugin populated (agents / command / hooks.json / skills / bridge).

**Verification — every named component present and non-empty** (`find plugin .claude-plugin -type f` + `wc -l` per file):

| Named component | Evidence (path — line count / content) | Non-empty? |
|---|---|---|
| **agents** | `plugin/agents/compliance-verifier.md` (223), `living-docs-auditor.md` (173), `review-sidecar.md` (198) | ✅ |
| **command** | `plugin/commands/install-enforcement.md` (54) | ✅ |
| **hooks.json** | `plugin/hooks/hooks.json` (27) — valid JSON; registers `SessionStart` (`run-hook.cmd session-start`) + `PostToolUse` matcher `Edit\|Write\|MultiEdit` (`inject-matching-rule`); accompanied by executable hooks `session-start` (42), `inject-matching-rule` (84), `run-hook.cmd` (47) | ✅ |
| **skills** | `plugin/skills/rules-as-tests/SKILL.md` (138) + 5 references (overview 174, doc-organization 361, checks-map 216, self-testing-docs 287, ai-traps 416); `installing-enforcement/SKILL.md` (52); `using-rules-as-tests/SKILL.md` (53) | ✅ |
| **bridge ("мост")** | `plugin/install/fetch-and-wire.sh` (81) — self-described header: *"the rules-as-tests 'hybrid seam': reach the HARD enforcement layer (git hooks + CI) by fetching the project's OWN official installer… the opt-in bridge to the HARD layer, invoked by /rules-as-tests:install-enforcement"* | ✅ |
| (manifest) | `.claude-plugin/plugin.json` (10), `.claude-plugin/marketplace.json` (17) | ✅ |

Every one of the five named pieces is present with real content — no zero-byte stubs. The "bridge" claim resolves unambiguously to `fetch-and-wire.sh` (the SOFT→HARD-layer seam), which matches the `companion-install-principle.md` "fetch the official installer" posture.

**Coverage:** high — exhaustive file enumeration (not a sample), `hooks.json` parsed for both hook registrations, bridge content read to confirm it is a real seam (not a placeholder). **Verdict: verified-done.**

---

## Target 3 — generator "forbid-MVP" → **PARKED (genuine fork)**

The dispatch gives **two pointers that resolve to different code**, and the two readings produce **opposite verdicts**. Per the dispatch's non-negotiable park-don't-guess rule ("two defensible readings of a 'done' claim … do NOT pick and proceed"), the verdict label is **parked for the operator**. Full evidence for both readings is below so the resolution is mechanical.

### The fork

- **Dispatch path pointer:** `packages/core/scenario-generator/`.
- **Dispatch claim (verbatim from getff §0, `getff-to-prod-meta-launch/kickoff.md:19`):** "Генератор forbid-MVP (декларативный ярус + анти-пустышка + forbid-компиляция + provenance + live-LLM путь)."

These do not co-locate:

- `packages/core/scenario-generator/` is a **pressure-scenario auto-generator** (SSOT #115), per its own `README.md`: types + a static reject-gate for W1/W3/W4/W5 weak-trap anti-patterns + a scenario store + an isolation (`/tmp` dispatch) mechanism. `grep -niE 'forbid-compil|declarative tier|anti-?empty|декларатив|анти-?пуст' packages/core/scenario-generator/*.ts` → **0 hits**. The five "forbid-MVP" capabilities are **not** in this module — it is a different generator.
- The verbatim claim string traces to the **`generator-forbid-mvp` umbrella** (`done.md`/`kickoff.md`), whose code is **`packages/core/synthesizer/`** — established by `generator-forbid-mvp-meta-launch/kickoff.md:73,227` ("S4 … `synthesize` **compiles** a `forbid` spec → rule data"; "Do NOT change `synthesize.ts` beyond forbid-compilation") and `generation-paths-comparison/kickoff.md:16` (commits `9fcab2696` S4, `065a99db7` S5).

### Option A — read it as the literal path (`packages/core/scenario-generator/`)

→ **finding-filed.** The five forbid-MVP capabilities are absent from that module (it is the pressure-scenario generator, SSOT #115). Consequence: a finding that the dispatch path pointer is wrong / the forbid-MVP claim is not satisfied at the named path.

### Option B — read it as the claim's real surface (`packages/core/synthesizer/`)

→ **verified-done.** All five capabilities are present on staging with `file:line` evidence:

1. **Declarative tier** — `packages/core/synthesizer/recipe.schema.json:79-84`: `"type": { "const": "declarative" }`, `"engine": { "enum": ["eslint-restricted","ast-grep"] }`, `"presence": { "enum": ["forbid","require"] }`.
2. **Forbid-compilation** — `packages/core/synthesizer/compile-declarative-md.ts:3,6` ("a new forbid/require rule is added as data, not a handwritten template"; "the ESLint rule the `eslint-restricted` engine compiles its selector(s) into"); `synthesize.ts` is the compiler entrypoint.
3. **Anti-empty / анти-пустышка guard** — gate structure present: `generate.test.ts:99` asserts `report.gates.messageIdCoverage.status === 'pass'`; `emit.test.ts:58` "writes 3 files with content for a non-empty SynthesisPlan". (Gate *implementation* not opened line-by-line — see coverage note.)
4. **Provenance** — `packages/core/synthesizer/emit.ts:45-64` writes `provenance.json` (`generatedBy: 'rules-as-tests-synth'`, `note: 'GENERATED — do not edit … S5 enforces this mechanically'`, per-rule content hash via `canonical-rule-hash.ts`); enforced by `verify-provenance.ts` (S5 anti-hand-edit gate) + `verify-provenance-cli.ts`.
5. **Live-LLM path** — `packages/core/synthesizer/generate-adapter-anthropic.ts:10-67`: real Anthropic Messages API call (`https://api.anthropic.com/v1/messages`, `DEFAULT_MODEL = 'claude-sonnet-4-6'`, `ANTHROPIC_API_KEY` required).

### Park statement (for the operator)

> **DECISION-NEEDED:** which surface does Target 3's audit mean?
> - **Option A** (literal dispatch path `packages/core/scenario-generator/`) → **finding-filed**: that module is the pressure-scenario generator (SSOT #115), not the forbid-MVP generator; the dispatch path pointer is wrong.
> - **Option B** (the getff §0 claim's real surface `packages/core/synthesizer/`) → **verified-done**: all five forbid-MVP capabilities are real (evidence above).
>
> The auditor did not pick between them (park-don't-guess). **Best-supported reading:** the getff §0 claim string is unambiguously about the `generator-forbid-mvp` umbrella (`synthesizer`), so the most likely root cause is a **wrong path pointer in the dispatch** (`scenario-generator` written where `synthesizer` was meant) — i.e. the *product* claim is verifiable-true (Option B), and the *dispatch* carries a path typo. This is a recommendation, not a verdict; resolving "A vs B" is the operator's call because it flips the deliverable's verdict label.

**Coverage:** high on evidence (both candidate surfaces audited; `scenario-generator` grepped to 0 forbid-vocab hits; `synthesizer` confirmed on all 5 with file:line). One residual depth gap under Option B: the anti-empty gate was confirmed via its tests + the `gates.*` report shape, not by opening the gate implementation — a deeper Option-B pass would read the gate source directly.

---

## Targets touched / code changed

None. This is a read-only audit (T5). No product code, no audited surface, was modified. The only file written is this research-patch.

## Method self-check (T-PCR-A — the bug class this umbrella kills)

Every verdict above is backed by a real command output or `file:line` — none is "looks ok" or prose-only. The Target-1 skeptic check explicitly caught that the original `install.sh` wiring site no longer exists and confirmed the live `setup.d/` invocation instead of trusting the done.md text. The Target-3 fork was surfaced, not papered over with a guessed verdict.

## §1.7 self-review (per [phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md))

This patch is an **append-only audit finding**, not a rule/principle/discipline introduction — so the §1.7 checks are light but present (principle 13 requires the substance marker on any post-cutoff research-patch).

- **Forward-check applied:** complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — the audit ran in an autonomous aif-handoff session on subscription, zero API-billed CI calls. Complies with [ai-laziness-traps.md §2 T5](../../../.claude/rules/ai-laziness-traps.md) — read-only audit, "Targets touched / code changed: None". Complies with [doc-authority-hierarchy.md §5](../../../.claude/rules/doc-authority-hierarchy.md) — inherits folder-level authority from `research-patches/README.md` (no per-file Authoritative-for header needed). Complies with the research-patch format ([phase-research-coverage.md §3](../../../.claude/rules/phase-research-coverage.md)): per-target evidence + tags. Method = `git`/code on `staging`, never tracker prose (T-PCR-A).
- **Backward-check applied:** supersedes nothing — append-only finding under `research-patches/`. The Target-3 PARK is a DECISION-NEEDED surfaced for the operator (dispatch path pointer `scenario-generator` vs the getff §0 claim's real surface `synthesizer/`), not a rule change; the getff §0 generator-forbid-MVP claim is verified-true at `packages/core/synthesizer/` (Option B). No existing rule, principle, or prior finding is invalidated. The dispatch-path-typo is a finding about the S4 dispatch input, recorded here for the operator to resolve.

## Tags

`plan-currency-reconcile` `skepticism-audit` `getff-to-prod-U1` `T-PCR-A` `claim-vs-code` `park-dont-guess`
