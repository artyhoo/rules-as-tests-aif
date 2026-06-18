# Post-install liveness smoke — design

> **Status:** DESIGN (brainstorm output, 2026-06-17). No code, no kickoff — design only.
> **Authoritative for:** the design of the post-install liveness smoke — the remaining scope of the `shipped-artifact-liveness-gap` umbrella (GH #550): channel architecture, per-capability live-signal inventory, fail-vs-warn model, the `doctor` command shape + output contract, behavioural-probe wiring, framework-vs-consumer boundary, phasing, and the build-vs-reuse verdict.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The M1 form-gate (shipped) — see [packages/core/principles/21-shipped-agent-tools-valid.test.ts](../../../packages/core/principles/21-shipped-agent-tools-valid.test.ts). The M2 behavioural prober (shipped, DORMANT) — see [agents/shipped-agent-liveness-prober.md](../../../agents/shipped-agent-liveness-prober.md). No-paid-LLM constraint — see [.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md).
>
> **Umbrella:** `shipped-artifact-liveness-gap` (remaining scope per GH #550). **NO new umbrella** — homed under the existing one.
> **Predecessor R-phase:** [docs/meta-factory/research-patches/2026-06-16-shipped-artifact-liveness.md](../../meta-factory/research-patches/2026-06-16-shipped-artifact-liveness.md).

---

## §1 Problem

The framework ships capabilities into consumer projects (sub-agents, skills, hooks, a mutation gate, custom lint rules, scripts). Today nothing proves a shipped capability actually **runs** after install — only that the file is present / frontmatter parses / config exists. `npm run validate` stays green while a capability is silently dead. Two incidents demonstrate the class empirically on a real consumer (timeliner):

- **#549** — Stryker (mutation testing) installed but produced **0 mutants** on pnpm (checker plugins not discovered). Silently dead; `validate` green. The existing harness test `f13-stryker-pm.test.sh:14-28` only `grep`s for `"packageManager": "pnpm"` in the config — it checks **presence of config**, not that Stryker generates ≥1 mutant. This is the exact form-vs-behaviour gap.
- **#548** — `deps-hash-check` hook false-warned on every prompt on a fresh install. A check that misfires misleads as badly as one that's silent.

This is `#recursive-self-application-gap` at the delivery layer: the project's thesis («documents lie; tests don't; every rule is an executable artifact») was applied bottom-up to *consumer* code but not top-down to the framework's own *shipped delivery artefacts*. M1 (form-gate) and M2 (behavioural prober) closed the sub-agent slice. The **post-install liveness smoke** generalises «registers-but-does-nothing» detection across all shipped capability classes.

**Design rule (T-smoke-A):** every check must name an **observable runtime signal** — a thing the capability emits when actually run — never «present / configured».

---

## §2 Channel architecture — verdict: two-channel by defect class

A liveness defect is routed to its **earliest reachable channel** (README invariant), and the two motivating incidents fall into two distinct classes:

| Defect class | Example | Earliest reachable channel | Why not the other channel |
|---|---|---|---|
| **By-construction-dead** — dead on a clean install regardless of env | #548 (false-warn on fresh install); #551 (invalid agent `tools:`) | **Framework-side** — extend `tests/install-sh/*.test.sh` to assert live-signals on reference fixtures | A consumer-side `doctor` would only catch it *when a consumer runs it*, later than a deterministic gate before release |
| **Env-variant-dead** — dead only on the consumer's actual machine/env | #549 (Stryker 0 mutants on pnpm) | **Consumer-side `doctor`** — operator-run on the real project/env | The framework reference env (npm) structurally cannot reproduce every consumer's pnpm/monorepo/binary setup |

**Channel A — framework-side** (catches by-construction-dead): extend the existing `tests/install-sh` harness to run live-signal assertions, not just file-presence. This runs in the existing `audit-self.yml`. **CI-last-resort is honored:** this is **not a new CI surface** — it deepens the *one* gate where install-correctness is already asserted (`tests/install-sh` already runs in `audit-self.yml`, already installs onto a tmp consumer, and already runs some capabilities live — `c1-wiring` runs `deps-hash-check`, `consumer-pipeline` runs `npm run test:coverage`). Form→behaviour on the same surface.

**Channel B — consumer-side `doctor`** (catches env-variant-dead): a new operator-run command that runs each shipped capability on the consumer's actual project and reports the live signal. **Operator-run, never CI** — the deterministic checks bill nothing; the behavioural half (M2) is a session-bound LLM dispatch, never a GitHub Action ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)). A `--json` mode lets a consumer wire it into *their own* CI on *their own* subscription — that is their call, not a paid-LLM-in-our-CI gate.

**Framework-vs-consumer boundary (§7 condensed):** Channel A asserts «live on the reference fixtures (npm + pnpm + monorepo)»; Channel B asserts «live on YOUR actual project». Both real; neither subsumes the other.

---

## §3 Capability inventory + per-capability live signal

Each shipped capability class, its **observable runtime signal** (not presence), the fail/warn disposition, and the channel(s):

| Capability (shipped) | Live signal (observable runtime, NOT presence) | Fail / Warn | Channel |
|---|---|---|---|
| **Sub-agents** (5 shipped) | M1: `tools:` names ∈ CC allow-list (resolve) · M2: `tool_uses>0` + real `file:line` when dispatched | Fail (M1) / report-only (M2) | framework pre-push (M1, principle 21) + consumer doctor `--probe` (M2) — **already shipped** |
| **Skills** (pipeline/dispatcher/aif-doctor/template-audit/…) | resolves + referenced helper scripts exist and run without error (behaviour: invoke → non-error) | Fail (resolve) / Warn→probe (behaviour) | framework harness (resolve) + consumer doctor (`--probe`, M2-extension) |
| **Hooks** (pre-commit / pre-push / deps-hash-check) | run on representative input: **no false-warn on a fresh install** (#548) + correct exit code | Fail | framework harness (reference fresh install) + consumer doctor (real repo) |
| **Mutation gate (Stryker)** | `stryker run` on a tiny fixture → **mutants ≥ 1** (NOT config presence — the `f13` gap) (#549) | Fail framework-side / **Warn+`--strict`** consumer-side | both |
| **Custom lint rules** (R2/R7/R8 + react-next) | a planted violation is **flagged** AND the rule is active in `eslint --print-config` (reaches files) | Fail | framework harness (reuse `check-rule-globs.sh` / `check-rule-enforced.sh`) + consumer doctor |
| **Shipped scripts** (audit-ai-docs.sh, audit-r4.ts, …) | exit 0 + non-empty meaningful output on the consumer project (not crash, not no-op) | Fail (crash) / Warn (empty-but-clean) | framework harness + consumer doctor |

---

## §4 Fail-vs-warn model (two independent thresholds)

Borrowed from Astro `check` (`--minimumSeverity` for what to **print** vs `--minimumFailingSeverity` for what trips the **exit code**) — the cleanest validated formalisation of the topic-3 knob.

- **Severity per check:** `pass` / `warn` / `fail`.
- **Two thresholds:** `--show <level>` (what to print, default `warn`) and `--fail-on <level>` (what makes exit non-zero, default `fail`).
- **Disposition rule (lesson from #548 — a false-warn misleads):**
  - **Fail** for deterministic, low-false-positive signals: a lint rule flags a planted violation; a script exits 0; a hook does **not** false-warn on a fresh install.
  - **Warn (+ `--strict` escalates to fail)** only for genuinely **env-variant** signals where 0 may be legitimate on the consumer's env (e.g. Stryker mutant count depends on the consumer's testable surface).
  - **Never warn on a healthy fresh install** — that *was* #548. A warn must always be real and actionable.

---

## §5 `doctor` command — shape + output contract

**Topic-5 verdict (T16 resolved empirically):** a **separate** command, not an extension of the existing `aif-doctor` skill. `aif-doctor`'s problem-class is the health of the **aif-handoff runtime** (container stuck, capacity, proxy, stale base — its §5 anti-scope is explicit); ours is **«does the installed capability actually run»**. Same word «doctor» + same flow-shape (read-only sweep → classify → emit fix + reversibility → mutation-needs-GO), different subject. → **ADOPT-VOCABULARY** the doctor vocabulary + check-runner architecture from the broader ecosystem; **REFERENCE** `aif-doctor`'s flow (Tier-1 auto / Tier-2 GO) as the in-repo precedent.

### §5.1 Check-runner architecture (ADOPT-VOCABULARY)

Each capability check is a discrete module with a common interface (expo `DoctorCheck.runAsync → {success, issues[], advice[]}`; oh-my-opencode / Codex `CheckDefinition → {status: pass|fail|warn|skip, summary, details}`). The **residue we BUILD** is the live-signal assertion *inside* each check — the thing no upstream doctor does (they all stop at presence/version/config; verified via DeepWiki on `expo/expo`).

### §5.2 Output contract (from clig.dev + oxlint/biome + the framework UX sweep)

```text
aif doctor

Sub-agents      ✓ 5/5 live        tools resolve · prober: tool_uses>0
Lint R2/R7/R8   ✓ fire            planted violation flagged on each
Hooks           ✓ deps-hash       no false-warn on fresh install        (#548 class)
Scripts         ✓ audit-ai-docs   exit 0 + non-empty output
Mutation gate   ✗ Stryker [LIVE-STRYKER-0MUT]   0 mutants generated (expected ≥1)   (#549 class)
                  signal: `stryker run` → "0 mutants" — checker plugin not discovered under pnpm
                  fix:    npx stryker run --logLevel trace   # verify @stryker-mutator/* checkers
Skills          ⚠ template-audit  not behaviourally probed → run `aif doctor --probe`

1 failed · 1 warning · 5 passed
Next: fix Stryker above, then re-run `aif doctor`.        (-v for signals, --json for CI, --explain LIVE-STRYKER-0MUT)
```

Conventions (ADOPT-VOCABULARY, do not reinvent):

- **Symbols + color:** `✓ / ⚠ / ✗`, consistent; color auto-disabled on `NO_COLOR` / non-TTY / `--no-color` (clig.dev).
- **Every line carries the observed signal**, not just a glyph — the live signal IS the UX payload (our differentiator).
- **Every failure carries an exact copy-paste fix command** + a one-line «why this matters» (clig.dev; expo advice).
- **Progressive disclosure:** terse by default, `-v` for the per-check signal detail (clig.dev).
- **Collect-all-then-report** (Next `--debug-prerender`): run *every* capability and list *all* dead ones in one pass — never die on the first failure.
- **Stable check codes + `--explain`** (Rust `error[Exxxx]` + `rustc --explain`): each check has a greppable code (e.g. `LIVE-STRYKER-0MUT`), in the project's R2/R7/R8/principle-number idiom; `aif doctor --explain <CODE>` prints the concept + a minimal repro + fix recipes.
- **Machine output:** `--json` (with an embedded human-`rendered` string, rustc model) + clean exit codes (`0` ok / non-zero per `--fail-on`); stdout = results, stderr = messaging.
- **Auto-fix (typed applicability, deferrable):** if/when a `--fix` mode ships, tag each fix `machine-applicable` / `maybe-incorrect` / `has-placeholders` (rustfix model); auto-apply **only** `machine-applicable`, and **only** against a clean VCS tree (reversible). Confirm-before-mutate with a `--yes` escape (Astro/shadcn boxed-diff → «Continue?»). `--fix` is **not** required for v1.

### §5.3 Drift-as-liveness (future extension, REFERENCE shadcn `diff`)

shadcn `diff` re-derives the canonical artifact and shows line-level `-/+` vs. the installed copy — detecting *silent drift from source*, a liveness-adjacent signal distinct from «dead». Noted as a future extension; **not** core v1 (v1 = «does it run»).

---

## §6 Behavioural half — wiring the M2 prober + extending to skills

- **Sub-agents:** the consumer doctor's `--probe` mode is the **documented operator step** that invokes the already-shipped, DORMANT [`agents/shipped-agent-liveness-prober.md`](../../../agents/shipped-agent-liveness-prober.md) (M2). No rebuild — the prober already does fresh-subagent RED→GREEN (`tool_uses>0` + real `file:line`). Session-bound, operator-run, never CI.
- **Skills (M2-extension):** a skill «registers but does nothing» when its helper scripts are missing or its `allowed-tools` are invalid. Behavioural skill liveness = invoke the skill against a fixture and observe it produces its expected artifact (e.g. `template-audit` emits its probes; `pipeline` resolves a plan). Same RED→GREEN shape as M2, retargeted from sub-agent to skill. Heaviest, session-bound — Phase 3.

---

## §7 Framework-vs-consumer boundary

- **On our own releases (framework-side, Channel A):** assert by-construction liveness on reference fixtures `{npm, pnpm, monorepo}` — the env classes we can reproduce. Catches #548, #549-class, #551-class **before release**, in the existing harness/CI.
- **On the consumer's machine (Channel B):** assert liveness on the consumer's *actual* env — the part we cannot reproduce (their pnpm version, monorepo layout, installed binaries). This is the only channel that catches a defect that materialises only there.

---

## §8 Phasing (smallest valuable slice first)

> **Resolved 2026-06-17 (maintainer):** framework-first → consumer-last confirmed. The phase order below is decided, not provisional.

- **Phase 1 — framework-side live-signals (deterministic, in the existing `audit-self` harness).** Extend `tests/install-sh` to assert: deps-hash no-false-warn on fresh install (#548); Stryker ≥1 mutant on a tiny reference fixture across npm+pnpm (#549); lint R2/R7/R8 flags a planted violation; shipped scripts exit-0-with-output. **Smallest slice that catches BOTH motivating incidents — before release.** Reuses the harness + `check-rule-globs.sh` / `check-rule-enforced.sh`.
- **Phase 2 — consumer-side `aif doctor` (deterministic checks only).** The check-runner + output contract (§5) running the same signals on the consumer's actual project. Operator-run, `--json` available, never our CI.
- **Phase 3 — behavioural (`--probe`).** Wire the M2 prober as the doctor's behavioural section for sub-agents; extend M2 to skills. Session-bound, never CI.

Rationale: Phase 1 is cheapest and catches the two real incidents at the earliest channel (before release); Phase 2 generalises to the consumer env; Phase 3 adds LLM-behavioural depth last (heaviest, gated). Honors «CI dispreferred» (Phase 1 deepens the existing gate; Phases 2–3 are operator-run).

---

## §9 Build-vs-reuse verdict + prior art

Per [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) §3 (DeepWiki + WebSearch ≥3 phrasings run — §12).

| Element | Verdict | Basis |
|---|---|---|
| «doctor» vocabulary + check-runner interface + output conventions (✓/⚠/✗, `--json`/`--plain`, exit codes, progressive disclosure, reporters) | **ADOPT-VOCABULARY** | expo-doctor, flutter doctor, Codex doctor, clig.dev, oxlint/biome — validated, do not reinvent |
| modular check architecture + the read-only-sweep→classify→fix flow | **REFERENCE** | expo `DoctorCheck`; in-repo `aif-doctor` flow (Tier-1 auto / Tier-2 GO) |
| typed-fix-applicability, `--explain CODE`, caret-precise fix rendering | **ADOPT-VOCABULARY** | Rust rustfix / rustc `--explain` (gold standard) |
| the **live-signal assertion** inside each check; the consumer-side runner | **BUILD** (residue) | no upstream doctor verifies runtime function — all stop at presence/version/config (DeepWiki `expo/expo`) |
| framework-side harness extension; behavioural prober | **REUSE** | `tests/install-sh` harness; `shipped-agent-liveness-prober.md` (M2, #115 ADAPT); `check-rule-*.sh` |

**Prior-art by SSOT ID:** #53 (promptfoo/Inspect/METR behavioural-eval — BUILD), #114 (ESLint guard-liveness gate — BUILD), #115 (manual-rule-liveness-prober — ADAPT), #121 (M1 form-gate — BUILD). **T16 problem-class:** upstream doctors = «is the project configured correctly» (static); ours = «does the installed capability actually run» (behavioural). Shape matches → ADOPT-VOCABULARY; assertion-depth differs → BUILD the live-signal.

### §9.1 Proposed SSOT entry (to land WITH the implementing capability commit, not now)

> **#131 — Post-install liveness smoke (capability runtime-signal doctor).** Two-channel: framework-side harness extension (by-construction-dead, deterministic, reuses `tests/install-sh`) + consumer-side `aif doctor` (env-variant-dead, operator-run, never CI) + `--probe` wiring of the M2 prober (#115). **Verdict: ADOPT-VOCABULARY** (doctor vocabulary + check-runner + rustfix applicability + clig.dev/oxlint output) **+ REFERENCE** (expo-doctor modular checks; in-repo `aif-doctor` flow) **+ BUILD** (the live-signal assertion residue — no upstream doctor verifies runtime function; verified DeepWiki `expo/expo`) **+ REUSE** (harness, M2 prober, `check-rule-*.sh`). Cites #53/#114/#115/#121. Problem class = the framework's own shipped delivery artefacts (delivery-layer `#recursive-self-application-gap`). **Trigger to revisit:** an upstream ships a doctor that verifies runtime function (not just presence) → flip BUILD→ADOPT; or the CC tool-list / Stryker checker-discovery behaviour changes → re-verify the signals.

---

## §10 Recursive self-application (T15)

**Would this smoke have caught the motivating incidents?**

- **#549 (Stryker 0 mutants on pnpm):** YES — the `LIVE-STRYKER-0MUT` check runs `stryker run` on a fixture and asserts mutants ≥ 1. Framework-side (Phase 1) on the pnpm reference fixture catches it before release; consumer-side (Phase 2) catches the same on the consumer's real pnpm. The existing `f13` test would NOT — it checks config presence only.
- **#548 (deps-hash false-warn on fresh install):** YES — the hook check runs `deps-hash-check` on a freshly-installed consumer and asserts **no WARN**; a misfire trips `fail`.

**Self-application — would it catch the prober's own deadness?** The M2 prober is itself a shipped-liveness artefact. Its `tools:` names are already form-gated by principle 21 (M1). Its behavioural liveness (does the prober actually dispatch fresh subagents?) is a meta-probe-of-the-probe — out of scope for v1, but the design must not claim «liveness solved» while the prober's own behaviour is unproven (honest DORMANCY, per the M2 doc). The doctor's `--probe` running the prober against a fixture is the first point its behaviour is exercised.

**Anti-`#discipline-theatre`:** every check names an observable signal and is paired-negative-able (inject a defect → check must go RED). Shipping the form-only half and declaring liveness «solved» is the exact theatre this umbrella exists to kill.

---

## §11 Resolved forks (no open decisions)

- **Phasing priority — RESOLVED 2026-06-17 (maintainer).** Framework-first → consumer-last confirmed: Phase 1 framework-side (cheapest, deterministic, catches both incidents before release), Phase 2 consumer `aif doctor`, Phase 3 behavioural. Not provisional.
- Channel architecture (A), doctor-shape (separate command), and the build-vs-reuse verdict were decided on the merits earlier in the brainstorm.

No open forks remain.

---

## §12 Search-coverage record (BFR-default §3)

- **WebSearch (≥3 phrasings):** post-install smoke / plugin-liveness; expo-doctor/flutter/npm doctor architecture; CLI doctor pattern + exit codes; modern CLI diagnostic UX 2026; doctor output UX (symbols/summary/remediation); oxlint/biome/cargo actionable-error UX.
- **DeepWiki:** `expo/expo` (expo-doctor check architecture + verification depth — confirmed presence/version-only, not runtime); `shadcn-ui/ui` (CLI verification depth + `diff` drift primitive); `oxc-project/oxc` (oxlint reporters); `withastro/astro` + language-tools (`astro check` runs real type-analysis; `astro add` two-threshold severity).
- **WebFetch:** `clig.dev` (canonical CLI output/error UX).
- **Framework UX sweep (operator-directed):** shadcn (step-spinner + `diff` drift), Astro (`check` runs real work; two severity thresholds; boxed-diff confirm), Next (`next info` env-dump; `--debug-prerender` collect-all), Rust (rustfix typed-applicability; `--explain`; caret-precise rendering; `cargo-deny`/`cargo audit` as «run a check, emit coded actionable signal»), bun/pnpm (one-line outcome + integrity + reporters).

---

## §1.7 self-reflexive note

- **Forward-check:** complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (deterministic framework-side; behavioural half session-bound, never CI); [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (§9 verdict with DeepWiki+WebSearch evidence + T16 problem-class statement); README «earliest reachable channel» (§2 routing); [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) (this doc carries Status + Authoritative-for header). CI-last-resort honored (§2 — framework-side deepens the existing gate, no new CI surface).
- **Backward-check:** no code, schema, or shipped artefact changed — design only (per the umbrella's hard-stop). The proposed SSOT #131 is a *proposal* for the implementing commit, not landed here. Supersedes nothing; extends the R-phase verdict and the shipped M1/M2.

## See also

- [docs/meta-factory/research-patches/2026-06-16-shipped-artifact-liveness.md](../../meta-factory/research-patches/2026-06-16-shipped-artifact-liveness.md) — the binding R-phase (M1/M2, gate-vs-probe rationale).
- [packages/core/principles/21-shipped-agent-tools-valid.test.ts](../../../packages/core/principles/21-shipped-agent-tools-valid.test.ts) — M1 form-gate (shipped).
- [agents/shipped-agent-liveness-prober.md](../../../agents/shipped-agent-liveness-prober.md) — M2 behavioural prober (shipped, DORMANT) — wired by the doctor's `--probe`.
- [.claude/skills/aif-doctor/SKILL.md](../../../.claude/skills/aif-doctor/SKILL.md) — the *runtime*-health doctor (different problem class; flow-shape REFERENCE).
- GH #550 — parent tracker (post-install functional acceptance; remaining umbrella scope).
