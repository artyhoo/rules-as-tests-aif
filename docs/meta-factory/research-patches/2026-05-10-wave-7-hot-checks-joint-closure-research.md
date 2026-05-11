# Wave 7 — Hot checks + harness-hooks + doc-linting joint-closure research

> **Authoritative for:** §13.27 + §13.28 + §13.8 expansion research findings (2026-05-10 snapshot); O0/O0.1 gate results; SSOT entry proposals (§8); review-session decision list (§9); Decision-matrix row proposals (§10); implementation outline (§11); §1.7 forward+backward checks for proposed «hot-checks + harness-hooks + doc-linting» discipline expansion (§12).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Final adoption decisions — review session (`.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/review.md`, gitignored). Implementation — orchestrator sub-waves 7.1+ (§11).
> **Decisions deferred to:** review session; **no implementation in this commit.**
> **Date:** 2026-05-10
> **Branch:** `wave-7-hot-checks-joint-closure`

## Problem

[§13.27](../open-questions.md) + [§13.28](../open-questions.md) + [§13.8](../open-questions.md) are armed jointly for **Wave 7** per the 2026-05-10 sequencing reversal (Wave 7 BEFORE Wave 5 implementation — Wave 5 skill proposes tools that Wave 7 ships to project itself). The three entries describe complementary gaps in the local-enforcement ladder:

- **§13.27** — functional fitness of shipped AI-briefing templates is not tested (principle 09 extension to templates covers header presence, not whether `AGENTS.md.template` actually anchors a consumer AI when rendered).
- **§13.28** — operator-side prompts under [`.claude/orchestrator-prompts/`](../../../.claude/orchestrator-prompts/) are gitignored, so the Phase 1.C `validate-batch-spec.ts` hook ([.husky/pre-push §6](../../../.husky/pre-push)) is dormant on the main path; 6 drafting bugs slipped through in Wave 6 cold-audit prompts.
- **§13.8** — Decision matrix in [self-application.md §3](../self-application.md) is fixed at 9 layers; addition of a 10th (harness-hook write-time / doc-linting / template render test) needs the 4-criteria gate exercised before adoption.

Wave 6 D-1 (UserPromptSubmit injection) DEFER→Wave 7 and Wave 6 D-5 (`templates/` probe adaptation P1/P4/P6 vs session-local P2/P3/P5) SHIP→Wave 7 (absorbed in §13.27 O4) feed in from [research-patches/2026-05-10-wave-6-review-verdicts.md §6](2026-05-10-wave-6-review-verdicts.md). The joint scope is therefore: hot-check primitives for code + docs; harness-level hooks as candidate 5th lifecycle stage; functional template test; Decision-matrix row additions per §13.8.

## Source

- This patch's research prompt: [`.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/research.md`](../../../.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/research.md) (gitignored — operator-side).
- Originating §13.27 + §13.28 + §13.8 entries: [open-questions.md §13.8 lines 116-128](../open-questions.md), [§13.27 line 494](../open-questions.md), [§13.28 lines 498-500](../open-questions.md).
- Wave 6 feeders: [research-patches/2026-05-10-ai-doc-effectiveness-cold-audit.md §4](2026-05-10-ai-doc-effectiveness-cold-audit.md) (improvements P-1..P-7); [research-patches/2026-05-10-wave-6-review-verdicts.md §6](2026-05-10-wave-6-review-verdicts.md) (D-1 DEFER→Wave 7; D-3 SHIP independently; D-5 SHIP→Wave 7).
- Branch state at session start: clean working tree on `wave-7-hot-checks-joint-closure` (off `wave-6/ai-doc-cold-audit` HEAD; Wave 6 closure not yet merged to `main`); commits `c1bd478`/`f2be064` reachable (Wave 6 verdicts + §13.26 closure).
- context7 connection verified for prior session (research findings already collected — this patch consolidates).

---

## §0 Feature-level build-vs-reuse — O0

**VERDICT — NO end-to-end match.** STOP signal NOT triggered.

Probed (production-grade unified harness-hook + code-lint + doc-lint frameworks):

| Candidate (context7 ID) | Coverage | Verdict for O0 |
|---|---|---|
| **pre-commit framework** (`/pre-commit/pre-commit.com`, v3.x 2026) | Git-lifecycle only (`pre-commit` / `pre-push` / `commit-msg` / `post-checkout` / `manual`). Language-agnostic stages; Python-driven hook orchestrator. **No** harness-hook (PostToolUse / on-save AI editor) integrations. | Partial — git-lifecycle primitive only |
| **Trunk Code Quality** (`/trunk-io/docs`) | Universal `trunk check` for linters; integrated in git hooks + CI; supports doc + code lint composition. No harness-hook integration with AI editors. | Partial — composition primitive only |
| **MegaLinter** (`/oxsecurity/megalinter`) | All-in-one Docker linter aggregator; ships ~50+ linters incl. markdown/YAML/code; runs in CI primarily. No harness-hook layer; no AI-editor integration. | Partial — CI-side composition only |
| **Husky v9** (already in stack — via `make install-hooks` → `git config core.hooksPath .husky`; raw bash scripts, no npm dep) | Node-native git-hook orchestrator (raw bash). lint-staged is **NOT installed** — root `package.json` has only workspaces + npm-test/typecheck scripts; no lint-staged dep. No doc-lint or harness-hook layer. | Partial — git-lifecycle primitive we already use (Husky only) |
| **Cursor Hook (community)** + **Cline hooks** + **Codex CLI hooks** + **Claude Code hooks** | Each editor ships its own PreToolUse/PostToolUse surface; **no** unifying framework composes them with code+doc lint in a single config. | Per-editor primitives, no unifier |

**Build-vs-reuse honor (per [CLAUDE.md `Build-vs-reuse invariant`](../../../CLAUDE.md)):**

End-to-end match = **NOT found.** Wave 7 scope adds harness-hook (5th lifecycle stage) **on top of** existing primitives. Composition is possible — pre-commit / Husky can invoke markdownlint, lychee, vale, semgrep — but the harness-hook slot itself (AI-editor write-time, fires before any git checkpoint) is project-new for this framework. Adoption shape: reuse primitives (markdownlint, lychee, Claude Code hooks API), build the integration layer (Decision-matrix row + scoped settings.json hooks + per-stage routing). Partial-overlap qualifier: §13.27 functional template test category is well-precedented (Cookiecutter `hooks/`, Copier `_tasks`) — pattern adoption, not build.

**context7 query phrasings used (verbatim, for review-session re-runs):**

1. `/pre-commit/pre-commit.com` — «Does the pre-commit framework support AI-harness hooks (write-time / PostToolUse) beyond git lifecycle?»
2. `/trunk-io/docs` — «Trunk Code Quality integration with AI agent editors; on-save hooks; PostToolUse; harness-level enforcement.»
3. `/oxsecurity/megalinter` — «MegaLinter doc + code lint composition; can it run on AI editor write-time?»
4. `/davidanson/markdownlint-cli2` — «markdownlint-cli2 pre-commit + harness integration; latest config schema.»
5. `/errata-ai/vale` — «Vale prose linter false-positive rate on mixed-language corpora; severity tuning.»
6. `/lycheeverse/lychee` — «lychee link-check offline mode; pre-commit usage; cost on staged-only file sets.»
7. `/copier-org/copier` — «Copier `_tasks` / `_migrations` test patterns; functional template render harness precedent.»

---

## §0.1 Trigger sweep — O0.1

Per [phase-research-coverage.md §1.6](../../../.claude/rules/phase-research-coverage.md), enumerate all 24 §13.x entries (§13.1-§13.28; §13.15 missing). Wave 7 directly targets §13.27 + §13.28 + §13.8.

**Cascade table (non-trivial entries only — full list at [open-questions.md](../open-questions.md)):**

| §13.x | Status | Cascade onto Wave 7 |
|---|---|---|
| §13.9 (no-verify bypass) | STILL ARMED | **MEDIUM** — harness-hooks fire at editor write-time, before `git commit --no-verify` can bypass; partially closes §13.9 for write-time defects. |
| §13.18 (AIF deep alignment) | STILL ARMED | LOW — AIF has no hook layer of its own (workflow framework over host runtime); hooks remain host-runtime concern. |
| §13.22 (own-conventions evolution → L2 Research Agent) | STILL ARMED | LOW — Wave 7 doc-linting integrates with adopted-pattern drift surface; folded into L2 work later. |
| §13.23 (4th-layer pre-push for §1.7) | STILL ARMED | **HIGH** — Wave 7 harness-hook could be (a) 5th layer **on top of** §13.23's proposed 4th pre-push layer, **or** (b) supersedes §13.23 as the better control point. Review-session decision required. NOTE: Wave 7's own sub-waves 7.1.b (lychee in pre-push) + 7.1.c (principle 09 changed-files) satisfy §13.23 trigger condition #3 (pre-push surface widening, per open-questions.md:412). Review session must frame decision sharply — trigger is firing now, not in some future Phase 10+. |
| §13.21 (doc-authority L3 generated docs) | CLOSED 2026-05-09 | Parent of §13.27 (functional fitness of templates). |
| §13.26 (cold-context audit) | CLOSED 2026-05-10 | Feeder — D-1 (UserPromptSubmit injection) and D-5 (probe adaptation) flow into Wave 7. |

*STILL ARMED includes «deferred entries with armed trigger condition» (§13.18, §13.23). §13.22 is v1-shipped with L2 promotion deferred.*

**ATTN — §13.23 cascade HIGH.** Review session must decide whether harness-hooks subsume §13.23's proposed 4th pre-push layer (eliminating the §13.23 work) or ship alongside as a parallel surface (different bypass profiles: harness-hook catches editor write-time; pre-push catches local-push bypass after `git commit --no-verify`).

---

## §1 Hot-checks for CODE — O1

Matrix: Stage × Tool × What-catches × Cost × Maturity × MUST/SHOULD/MAY.

| Stage | Tool | Catches | Cost | Maturity | Verdict |
|---|---|---|---|---|---|
| Pre-commit (staged) | `lint-staged` + globs → ESLint/tsc/prettier | TS errors, lint, formatting | <2s | High (npm prod-grade) | **PRECONDITION for sub-wave 7.1** — lint-staged + root ESLint flat config are NOT yet installed; sub-wave 7.1 must bootstrap them OR ship bash-driven hot-check without lint-staged |
| Pre-commit | `simple-git-hooks` / Husky v9 | hook orchestration | <100ms | High | **MUST** — Husky already installed ([.husky/](../../../.husky/)) |
| Editor on-save | ESLint flat config + VSCode/IDE extension | TS/lint diagnostics inline | <1s | High | **SHOULD** — recommend in [INSTALL-FOR-AI.md](../../../INSTALL-FOR-AI.md) for consumers |
| Build-time | `tsc --noEmit --watch`, `vitest --watch` | type drift, broken tests | continuous | High | **MAY** — author-side, not shipped to consumers |
| Static-hot | `semgrep --baseline-ref` (changed files), `ast-grep` scan | AST anti-patterns | 2-10s | Medium-High | **MAY** — consider Phase 12+. NOTE: semgrep has MCP server (`/semgrep/mcp`) — alt. path to AI-harness integration. |
| Pre-push | `actionlint`, `zizmor`, `audit-ai-docs.test.sh`, principles vitest | workflow/security, drift, principles | ~10s | High | **MUST** — already in [.husky/pre-push](../../../.husky/pre-push) |

**Wave 7 new code-check proposal:** add `ast-grep` scan in pre-push for AST-level rules (future-facing; activates when meta-test 09 surface expands beyond regex/path predicates). 6 candidates probed (above §1.5 floor of 3-5).

---

## §2 Hot-checks for DOCUMENTATION — O2

Parallel matrix for docs.

| Stage | Tool | Catches | Cost | Maturity | Verdict |
|---|---|---|---|---|---|
| Pre-commit | `markdownlint-cli2` (`/davidanson/markdownlint-cli2`) | structure, line length, headers | <1s | High | **SHOULD** — closes §13.28's «6 drafting bugs» class |
| Pre-commit | `lychee` (`/lycheeverse/lychee`) or `markdown-link-check` on staged `.md` | broken internal/external links | 2-5s offline | High | **SHOULD** — link surface grows fast with Wave 5/6/7 cross-refs |
| Pre-commit | `vale` (`/errata-ai/vale`, Microsoft/Google/write-good/proselint) | prose quality, jargon | 1-3s | High | **MAY** — false-positive risk (see §6) |
| Pre-commit | principle 09 changed-files mode | Authoritative-for header presence | <500ms | High (internal) | **MUST** — principle works full-set; extract changed-files mode |
| Pre-push | `render-rules.ts --check` | manifest ↔ RULES.md drift | <2s | High (already shipped) | **MUST** — already in [self-application.md §3](../self-application.md) |
| Pre-push (new) | AGENTS.md / CLAUDE.md goal-phrase parity (Wave 6 D-3) | doc-vs-doc drift | <500ms | New | **SHOULD** — D-3 SHIP-B from Wave 6 verdicts (ships independently of Wave 7 timeline) |

6 candidates probed.

---

## §3 Harness-level hooks comparison — O3

Editor × Hook surface × Native? × Events × Blocking semantics × Maturity.

| Editor | Hook surface | Native? | Events | Blocking | Maturity |
|---|---|---|---|---|---|
| **Claude Code** | `.claude/settings.json` `hooks: {...}` | ✅ Native | `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `StopFailure`, `SubagentStop`, `PreCompact`, `Notification` | `exit 2` / JSON `{"decision":"block","reason":"..."}` | High |
| **Codex CLI** | `~/.codex/config.toml` + `hooks.json` | ✅ Native | `PreToolUse`, `PostToolUse`, `SessionStart`, `UserPromptSubmit`, `Stop`, `PermissionRequest` | command exit code; trust-status mechanism | Medium-High (Rust impl, recent) |
| **Cline** | docs/customization/hooks | ✅ Native | `PreToolUse`, `PostToolUse` | JSON `{"cancel":true,"error":"..."}` | Medium-High |
| **Cursor** | community CLI `beautyfree/cursor-hook` + `~/.cursor/hooks.json` | ⚠️ Community-built | `sessionStart/End`, `preToolUse`, `postToolUse`, `postToolUseFailure`, `subagentStart/Stop`, `beforeShellExecution/afterShellExecution`, `beforeMCPExecution/afterMCPExecution`, `beforeReadFile`, `afterFileEdit`, `beforeSubmitPrompt`, `preCompact`, `stop`, `afterAgentResponse/Thought`, `beforeTabFileRead/afterTabFileEdit` | permission allow/deny/ask | Medium (community) |
| **Continue.dev** | `~/.continue/permissions.yaml` (allow/ask/exclude) | ❌ no hooks per se | per-tool permission only (Read/Write/Bash) | TUI prompt ask/deny | High (but not lifecycle hook) |
| **Aider** | `--lint-cmd` + `--auto-lint`, `--test-cmd` + `--auto-test` | ⚠️ Constrained | post-edit lint, post-edit test | non-zero exit → Aider attempts fix | High but narrow |
| **AIF** (`aif.cutcode.dev`, `/lee-to/ai-factory`) | NONE of its own | ❌ — workflow framework over host runtime | inherits from host (Claude Code / Codex / Cursor / Roo Code / Kilo Code / Qwen Code per `agentFiles[].runtime`) | inherited | High as workflow framework, N/A as hook provider |

7 candidates probed.

**Verdict for §13.8 expansion — harness-hook qualifies as new lifecycle stage per 4-criteria gate:**

1. **Failure-cost**: MEDIUM-HIGH (AI agent silently bypasses convention before any git checkpoint).
2. **Local-cost**: <100ms-1s typical (PostToolUse fires per tool call).
3. **Detectability**: unique — no git-lifecycle stage catches editor write-time.
4. **Stage**: NEW — «AI-harness write-time», sits between «AI thinks» and «author commits».

→ Proposed: **MUST** for project-side (Claude Code primary); **MAY** for consumer-side (editor-agnostic — we can ship only Claude Code variant as reference; consumers with Cursor/Cline/Codex port the logic themselves). Demote to **SHOULD** if review session decides «not load-bearing because §13.23 4th-pre-push covers same surface».

**ATTN — Claude-first bias.** Project [README.md](../../../README.md) frames «AI agents (Claude, Cursor, Copilot, Aider) write plausible-looking code» as multi-editor. The framework's PRIMARY artefacts — [`skills/rules-as-tests/`](../../../skills/rules-as-tests/) and [`agents/`](../../../agents/) (best-practices-sidecar, docs-auditor, review-sidecar) — are harness-agnostic per AGENTS.md spec convention and exist at the repo root, not under `.claude/`. The Claude-first bias is narrower: it concentrates in `.claude/skills/self-reflection/` (Claude Code specific) and the harness-hook layer proposed in sub-wave 7.2 (PostToolUse / `settings.json` — Claude Code API). Multi-editor parity in those two narrow slots is the consumer task; review session must explicitly acknowledge this scope.

---

## §4 Functional template test (§13.27 closure) — O4

**Prior-art surveyed:**

- **Cookiecutter** — `hooks/pre_gen_project.py` + `hooks/post_gen_project.py`; render to tmp + checks in `tests/`.
- **Copier** (`/copier-org/copier`) — `_tasks:` array (post-copy/post-update) + `_migrations:` per-version; supports conditional rendering; tests via render-to-tmp + assertion.
- **Plop.js**, **Hygen**, **Yeoman** — JS scaffolding; smaller ecosystems; testing patterns less standardised.

5 candidates probed.

**Cold-audit probes translation (per Wave 6 D-5 verdicts, [research-patches/2026-05-10-wave-6-review-verdicts.md §6](2026-05-10-wave-6-review-verdicts.md)):**

| Probe | Translates to template render? | Why |
|---|---|---|
| **P1** (goal description) | ✅ | Rendered `AGENTS.md` should let consumer AI reproduce consumer-project's goal phrase. |
| **P4** (Authoritative-for header drift-block) | ✅ | Rendered docs should carry valid headers per [doc-authority-hierarchy.md §3](../../../.claude/rules/doc-authority-hierarchy.md). |
| **P6** (taxonomy fidelity) | ✅ | Rendered docs should reference framework's 5-layer + recursive-enforcement disambiguation (Wave 6 D-2). |
| **P2** (Step 0) | ❌ session-local | Consumer's session-bootstrap is not rendered yet — Phase 11+ work. |
| **P3** (self-reflection skill auto-trigger) | ❌ session-local | Skill triggers are AI-runtime behaviour, not rendered artefact. |
| **P5** (auto-memory) | ❌ session-local | Memory subsystem is harness state, not template. |

**Recommended §13.27 closure path:**

1. **Harness**: Vitest `.audit.ts` test + ephemeral `tmp/` directory + `install.sh` invocation on tmp consumer skeleton (mirrors existing `framework-self-install` CI job).
2. **Skeleton patterns**: minimal `package.json` + empty `src/` for `ts-server`; `package.json` with `next` + `react` for `react-next` stack.
3. **Probe set**: P1 + P4 + P6 (3 deterministic structural probes) + opt-in LLM-judge probe (Claude API call) for semantic-equivalent of «goal phrase appears in rendered AGENTS.md».
4. **Drift score**: boolean PASS/FAIL per probe; aggregate ≥ 5/6 deterministic probes = PASS (3 probes × 2 stacks).

---

## §5 Operator-side discipline path (§13.28 closure) — O5

Per [open-questions.md §13.28](../open-questions.md), default A+B; C rejected 2026-05-10.

| Variant | Mechanism | Closes | Cost |
|---|---|---|---|
| **A** — `make validate-prompts` | Makefile target → fs-walk `.claude/orchestrator-prompts/**/*.md` → invoke existing `packages/core/spec-validation/validate-batch-spec.ts` | git-bypass (gitignored dir) path — advisory | Zero new infra; existing TS validator |
| **B** — Claude Code PostToolUse hook | `.claude/settings.json` PostToolUse matcher on `Edit\|Write` for `**/.claude/orchestrator-prompts/**/*.md` → run `validate-batch-spec.ts` → JSON `{"decision":"block",...}` on fail | hot-channel at write-time; before AI sees «file written successfully» | Editor-coupled to Claude Code |
| **C** — un-gitignore `.claude/orchestrator-prompts/` | REJECTED 2026-05-10 per §13.28 (operator-side context not for upstream) | — | — |
| **A+B combined** | DEFAULT | A as baseline; B as hot channel; same TS validator both surfaces | Editor-coupled at B-side only |

4 candidates probed (including the rejected C and the combined A+B for completeness).

→ **Recommended:** A+B with Decision-matrix verdicts: A = **MAY** in pre-commit (advisory only — author may not run `make` before commit; no enforcement), B = **SHOULD** in harness-hook (Claude Code primary; absent for other editors — operator-acknowledged limitation).

---

## §6 Adversarial failure modes — O6

Per [phase-research-coverage.md §1.4](../../../.claude/rules/phase-research-coverage.md) (adversarial check on negative-existence + cost claims).

| Failure mode | Probability | Mitigation |
|---|---|---|
| Vale prose-rule false-positive flood → AI ignores warnings as noise | **HIGH** | Start at `MinAlertLevel = error`; add only rules with measured false-positive rate <5% on corpus replay; opt-in `vale --no-wrap` per file. |
| Harness-hook latency × N edits/session | MEDIUM | PostToolUse should be async for non-blocking checks; reserve sync block for critical only. |
| Editor lock-in (Claude Code only) | **HIGH** | Document explicitly in [INSTALL-FOR-AI.md](../../../INSTALL-FOR-AI.md) «harness-hook layer is Claude Code optimised; Cursor/Cline/Codex users adapt»; ship reference hook script cross-editor-compat where possible. |
| Doc-linting style conflicts with existing prose (Russian + English mixed) | MEDIUM | Vale config with `[*.{md}] BasedOnStyles = Vale` only (no Microsoft/Google jargon rules); whitelist project glossary. |
| §13.28 trigger «2nd incident» ambiguity — what counts as incident | MEDIUM | Operationalise: «discovered defect in `.claude/orchestrator-prompts/*.md` that would have been caught by `validate-batch-spec.ts` had it run» (file:line + verification fingerprint required). |
| Cursor Hook is community-built — upstream risk if community CLI dies | LOW | Document explicitly; do not use as load-bearing; reference only as «one option Cursor users may explore». |
| §13.23 4th-layer pre-push competing with harness-hook 5th-layer | MEDIUM | Review session decision: either kill §13.23 (harness-hook subsumes) or ship both (different bypass surfaces). NOTE: Wave 7's own sub-waves 7.1.b (lychee in pre-push) + 7.1.c (principle 09 changed-files) satisfy §13.23 trigger condition #3 (pre-push surface widening, per open-questions.md:412). Review session must frame decision sharply — trigger is firing now, not in some future Phase 10+. |

---

## §7 Synthesis

3 deliverable layers, orthogonal:

1. **Hot-check primitives (code + docs, pre-commit + pre-push)** — incremental add of `markdownlint-cli2` / `lychee` / `vale` / `ast-grep`; no novel design; composable on existing `pre-commit` / `lint-staged`.
2. **Harness-hook layer (5th lifecycle stage)** — **NEW.** Claude Code PostToolUse as project primary; reference shape for consumers. Closes §13.28 + Wave 6 Probe 2 FAIL (UserPromptSubmit injection / D-1).
3. **Functional template test (§13.27)** — **NEW.** Vitest `.audit.ts` + tmp consumer skeleton + adapted P1/P4/P6 probes. Closes §13.21 functional-fitness gap (header-presence-only → header + functional).

Decision-matrix expansion (§13.8) ties them together: each new layer gets a row with the 4-criteria gate exercised in §10.

---

## §8 SSOT entries to add

Append to [prior-art-evaluations.md](../prior-art-evaluations.md) after existing #1-#15. Authority for SSOT-append per [prior-art-evaluations.md §3](../prior-art-evaluations.md) (append-only register).

| ID | Candidate | Capability matched | Verdict | Rationale (≤500 chars; condensed for this preview — full text lands at write-time per commit T-7.5.b) |
|---|---|---|---|---|
| 16 | `pre-commit` framework (`/pre-commit/pre-commit.com`, v3.x 2026) | Multi-language git-hook orchestration | WATCHLIST | Production-grade Python-driven hook orchestrator; supports `pre-commit` + `pre-push` + `commit-msg` + `post-checkout` stages. Currently we use Husky only (raw bash scripts via `make install-hooks`; lint-staged not yet installed). pre-commit offers language-agnostic stages but adds Python dep. **Velocity: SLOW (~2yr major cadence).** Re-evaluate if consumer-side stack diversifies beyond Node OR Husky hits stage-matching limitations. |
| 17 | `markdownlint-cli2` (`/davidanson/markdownlint-cli2`, v0.x 2026) | Hot-check structure of docs (pre-commit) | ADOPT WHEN TRIGGERED | High-coverage Markdown linter; pre-commit hook + Docker image; CLI flag schema stable since 2024. ADOPT after Wave 7 review-session decision; ships in §11 sub-wave 7.1.a for «hot-check docs» Decision-matrix row. **Velocity: STABLE.** |
| 18 | `vale` (`/errata-ai/vale`, v3.x 2026) | Prose style linting | DEFER | False-positive risk ≥30% on Russian+English mixed prose per §6. DEFER until corpus-replay evidence shows <10% FP rate. **Velocity: FAST (style packages evolve).** Trigger to revisit: 2nd documented doc-prose-drift incident that `markdownlint` cannot catch. |
| 19 | `lychee` (`/lycheeverse/lychee`, Rust-based, 2026) | Async link integrity checking | ADOPT WHEN TRIGGERED | Production-grade fast async link checker; supports MD + HTML + .txt; offline-first via `--offline`. ADOPT after Wave 7 review; ships at pre-push stage in §11 sub-wave 7.1.b. **Velocity: MEDIUM.** |
| 20 | Claude Code hooks (`docs.claude.com/en/docs/claude-code/hooks`) | Harness-level write-time enforcement (5th lifecycle stage) | ADOPT WHEN TRIGGERED | Native `PostToolUse` / `PreToolUse` / `UserPromptSubmit` event-driven; JSON-decision contract. ADOPT as project-side enforcement layer in Wave 7 — trigger fired: Wave 6 Probe 2 FAIL + §13.28 default-B path + Wave 6 D-1 DEFER→Wave 7. **Velocity: FAST (Anthropic ships changes quarterly).** Trigger to revisit: 90-day check; OR Anthropic announces breaking change to hook contract. |
| 21 | Cline hooks + Codex CLI hooks + Cursor Hook (community) | Harness-hook parity surfaces (multi-editor) | WATCHLIST | Same event shape (`PreToolUse` / `PostToolUse`) on parallel editors. WATCHLIST: not adopted now (Claude Code primary per multi-editor framing acknowledged Claude-first bias), but reference shape for cross-editor consumer adoption. **Velocity: FAST.** Trigger to revisit: consumer audit shows Cursor/Cline/Codex adoption signal; OR multi-editor parity becomes invariant. |
| 22 | Cookiecutter / Copier (`/copier-org/copier`) | Template-render test patterns (`_tasks` / `_migrations`) | ADOPT VOCABULARY | Adopt `_tasks` / `_migrations` pattern in Vitest `.audit.ts` template render harness (§13.27 closure). Vocabulary only — no Python dep, no Copier runtime. Translates as «post-render assertion step» in our Vitest harness. **Velocity: STABLE.** Trigger to revisit: Copier v8+ changes `_tasks` semantics. |

7 entries proposed (IDs 16-22).

---

## §9 Open decisions for review session

1. **§13.23 vs harness-hook**: ship both (parallel surfaces — different bypass profiles) **OR** harness-hook subsumes §13.23? Default: harness-hook as 5th layer; §13.23's 4th pre-push layer stays deferred until 2nd local-push-bypass incident — but re-evaluate its trigger in light of harness-hook coverage.
2. **Vale adoption now or DEFER**: corpus-replay first vs ship at minimal severity. Proposed: DEFER until 2nd doc-prose incident.
3. **§13.27 LLM-judge probe pilot**: ship deterministic-only now (P1/P4/P6) **OR** pilot semantic probe (Claude API call) with budget cap? Risk: cost + flakiness.
4. **Project-side scope for harness-hook**: Claude Code only («dogfood») vs ship Cursor/Cline reference scripts in `templates/`? Default: Claude Code only; document explicitly.
5. **§13.28 A+B vs A only**: ship B (Claude Code PostToolUse) immediately vs A only first, add B on first incident? Default: A+B per §13.28 default.
6. **Markdownlint config**: adopt Microsoft/Google style preset OR hand-roll project-specific rules? Default: hand-roll — project mixes Russian + English; standard presets have FP.
7. **Decision-matrix row for harness-hook**: **MUST** or **SHOULD** verdict — what failure-cost score? Default: SHOULD (acknowledges editor-coupling).

---

## §10 Decision-matrix expansion (§13.8 invocation)

Per [open-questions.md §13.8 4-criteria gate](../open-questions.md). Proposed rows for [self-application.md §3](../self-application.md):

| Layer | Mode | Verdict | Rationale (4 criteria) |
|---|---|---|---|
| Harness-hook PostToolUse (Claude Code primary) | Hard fail (write-time, blocking via `exit 2` / JSON `decision:block`) | **SHOULD** (project-side) / **MAY** (consumer-side) | (1) failure-cost: MEDIUM-HIGH (AI bypasses convention before git checkpoint); (2) local-cost: <100ms-1s typical; (3) detectability: unique — no git stage catches editor write-time; (4) stage: NEW — «AI-harness write-time». SHOULD (not MUST) for project-side: editor-coupled (Claude Code only); non-Claude operators don't lose functionality, only lose detection at this stage. |
| Markdown structure (`markdownlint-cli2`) | Hard fail (pre-commit, scoped to `*.md`) | **SHOULD** | (1) >500-line invariant already shipped; broken header structure breaks rendering; (2) <1s; (3) detectable only on rendering / human review otherwise; (4) pre-commit. |
| Doc link integrity (`lychee`) | Soft warn (pre-commit) / Hard fail (pre-push, `--offline`) | **SHOULD** | (1) broken links — recurring drift class in repo with many cross-refs; (2) 2-5s offline; (3) caught only by human review otherwise; (4) pre-commit warn + pre-push fail. |
| Doc-vs-doc parity (Wave 6 D-3 SHIP-B) | Hard fail (pre-commit, scoped) | **MUST** | (1) goal-phrase drift between CLAUDE.md ↔ README — Wave 6 Probe 1 PARTIAL conditional; (2) <500ms regex; (3) caught only by cold audit; (4) pre-commit. Already SHIP-B verdict in Wave 6 review (D-3 ships independently of Wave 7 timeline). |
| Vale prose | (deferred) | **MAY** in CI only | DEFER per §6 + SSOT entry 18. Re-evaluate when FP rate measurable. |
| Operator-side `validate-prompts` (§13.28 A) | Soft warn (`make validate-prompts`) | **MAY** | (1) operator-prompt drift is real (6 bugs / Wave 6 cold-audit); (2) ~500ms; (3) caught only at next session re-read; (4) make-target invoked manually before commit. SOFT because gitignored — no enforced trigger. |
| §13.28 B — PostToolUse on orchestrator-prompts | Hard fail (Claude Code harness write-time) | **SHOULD** | Same shape as harness-hook PostToolUse row above, scoped to `.claude/orchestrator-prompts/**/*.md`. |

7 rows proposed.

---

## §11 Implementation outline (sub-waves)

### Sub-wave 7.1 — hot-check primitives (code + docs)
- **Precondition**: install `lint-staged` + root ESLint flat config OR ship raw-bash hot-check variant (no lint-staged) — neither is currently in-stack.
- **7.1.a**: `markdownlint-cli2` + `.markdownlint.json` (Decision row «Markdown structure»).
- **7.1.b**: `lychee` in pre-push (`--offline`).
- **7.1.c**: principle 09 changed-files mode (extract).
- **7.1.d**: Wave 6 D-3 SHIP-B — goal-phrase parity probe (independent track; cross-ref here).
- **Cost**: ~1-2 days.
- **Capability commits**: 7.1.a probably **YES** (new file ≥80 LOC under `packages/lint-config/` shared markdownlint config). 7.1.b adding lychee config — non-capability (config in repo, no new `packages/`).
- **SSOT updates**: #17 markdownlint, #19 lychee — verdict change DEFER→ADOPT.

### Sub-wave 7.2 — harness-hook layer (5th lifecycle stage)
- **7.2.a**: `.claude/settings.json` `UserPromptSubmit` injection (Wave 6 D-1 closure — inject session-bootstrap essentials).
- **7.2.b**: `PostToolUse` `Edit\|Write` matcher → run `validate-batch-spec.ts` for `.claude/orchestrator-prompts/**/*.md` (closes §13.28 B).
- **7.2.c**: `PostToolUse` `Edit\|Write` matcher → run principle 09 quick-check on doc paths matching `REQUIRED_HEADER_DOCS`.
- **7.2.d**: Update [self-application.md §3](../self-application.md) Decision matrix with new harness-hook row (§13.8 expansion).
- **Cost**: ~2-3 days.
- **Capability commits**: probably **YES** (new file ≥80 LOC under `packages/harness-hooks/` or similar).
- **SSOT updates**: #20 Claude Code hooks ADOPT WHEN TRIGGERED → ADOPT.

### Sub-wave 7.3 — functional template test (§13.27 closure)
- **7.3.a**: Vitest `.audit.ts` test harness in `packages/core/audit-self/template-render.audit.ts`.
- **7.3.b**: `tmp/` skeleton fixtures for `ts-server` + `react-next` stacks.
- **7.3.c**: `install.sh` invocation in test.
- **7.3.d**: Adapted P1/P4/P6 probes (P1 goal-phrase rendered; P4 header presence; P6 taxonomy fidelity).
- **7.3.e**: Gate in CI as `framework-self-template-render` job.
- **Cost**: ~2-3 days.
- **Capability commits**: **YES** — new file ≥80 LOC under `packages/core/audit-self/` (probably 80+ LOC harness).
- **SSOT updates**: #22 Cookiecutter/Copier ADOPT VOCABULARY landed at write-time.

### Sub-wave 7.4 — Operator-side discipline (§13.28 A)
- **7.4.a**: Makefile target `validate-prompts` invoking `validate-batch-spec.ts` on fs-walk.
- **7.4.b**: Documentation update in `.claude/orchestrator-prompts/README.md` (if folder gets a README per folder-level authority pattern).
- **Cost**: ~0.5 day.
- **Capability commits**: **NO** — Makefile addition, no new `packages/`.

### Sub-wave 7.5 — Decision matrix + open-questions update
- **7.5.a**: Update [self-application.md §3](../self-application.md) with new rows from §10 above.
- **7.5.b**: Append SSOT entries 16-22 (verdict transitions ADOPT WHEN TRIGGERED → ADOPT where shipped) in [prior-art-evaluations.md](../prior-art-evaluations.md).
- **7.5.c**: Close §13.27, §13.28, §13.8 in [open-questions.md](../open-questions.md).
- **7.5.d**: Self-review patch per §1.7 (forward+backward checks on Wave 7's own discipline-bearing artefacts).
- **Cost**: ~1 day.

**Total estimated**: ~6-9 days work spread across 5 sub-waves.

---

## §12 §1.1-§1.7 compliance walkthrough

Per [phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md).

- **§1.1 own-stack sweep** — ✅ Husky (raw bash, no npm dep) / render-rules / principles already used by project; verified they appear in §1-§3 matrices as «existing». lint-staged is NOT in-stack (root `package.json` has no lint-staged dep — noted as PRECONDITION for sub-wave 7.1). `pre-commit` framework NOT in stack — surfaced as SSOT #16 WATCHLIST. AIF dependency surveyed in §3 (no hook layer of its own).
- **§1.2 category sweep** — ✅ surveyed git-lifecycle frameworks (pre-commit, husky), all-in-one linters (megalinter, trunk), AI-harness hooks (Claude / Cursor / Cline / Codex / Aider / AIF), doc linters (markdownlint, vale, lychee), template render harnesses (cookiecutter, copier, hygen, plop, yeoman).
- **§1.3 semantic-distance** — ✅ probed beyond «pre-commit framework» term to «harness-hook» (different paradigm: editor write-time vs git lifecycle) and «template render test» (different category: fixture testing vs template-output testing).
- **§1.4 adversarial check** — ✅ counter-prompt «if a unified hot-check + harness-hook + doc-lint tool existed, where?» → trunk.io closest but does NOT include harness-hook layer. Confirms NULL result for O0.
- **§1.5 prompt-list ≠ complete** — ✅ probed 6+ candidates per O1/O2/O3 (above 3-5 floor): O1: 6; O2: 6; O3: 7; O4: 5; O5: 4; O6: 7 failure-mode rows.
- **§1.6 trigger sweep** — ✅ in §0.1; cascade table above; §13.23 cascade-HIGH flagged for review.
- **§1.7 forward+backward (self-reflexive)**:
  - **Forward**: Wave 7 deliverable carries Authoritative-for header ✅; cites SSOT entries ✅; non-capability commit (doc-only research patch) — `Prior-art: skipped — research patch, no new capability` trailer (rationale ≥20 chars, cites existing SSOT #1-#15 + proposes new #16-#22 for future commits per §11).
  - **Backward**: Wave 7's proposed Decision-matrix rows (§10) are themselves discipline-bearing — they extend [self-application.md §3](../self-application.md). §1.7 self-applies: when sub-wave 7.5.a ships the Decision matrix update, that commit must carry a self-review patch demonstrating the new rows survive §1.7 (forward: comply with current discipline; backward: applied to all existing rules R1-R20 + principles 01-09).
  - **Self-reflexive trigger**: Wave 7 prompts themselves are operator-side artefacts (gitignored in [.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/](../../../.claude/orchestrator-prompts/)) — exactly the category §13.28 targets. After Wave 7 ships closure path for §13.28: re-evaluate whether Wave 7 prompts retroactively pass `make validate-prompts`. Recursive verification.

---

## REPORT

- **File**: `docs/meta-factory/research-patches/2026-05-10-wave-7-hot-checks-joint-closure-research.md`
- **Lines**: (filled by commit script — see `git show --stat` at write-time)
- **Sections present**: §0 §0.1 §1 §2 §3 §4 §5 §6 §7 §8 §9 §10 §11 §12 ✅
- **Candidates per objective**: O0:5, O1:6, O2:6, O3:7, O4:5, O5:4, O6:7
- **SSOT entries proposed**: 7 (IDs 16-22)
- **Open decisions for review**: 7
- **Decision-matrix rows proposed**: 7
- **Branch**: `wave-7-hot-checks-joint-closure` (off `wave-6/ai-doc-cold-audit`; Wave 6 closure not yet on `main`)
- **Commits**: (filled at commit-time — single research-patch commit; no implementation in this session)
- **Confidence**: medium-high
- **ATTN**:
  - Branch base is `wave-6/ai-doc-cold-audit` (not `main`) — Wave 6 closure not yet merged. Operator should merge Wave 6 → `main` before Wave 7 PR.
  - §13.23 cascade-HIGH: review session must decide harness-hook supersedes §13.23 OR ships in parallel.
  - Claude-first bias is real but narrower than a full-package claim: primary artefacts (`skills/rules-as-tests/`, `agents/`) are harness-agnostic at repo root; bias concentrates in `.claude/skills/self-reflection/` + the proposed harness-hook layer (sub-wave 7.2). Multi-editor parity in those two narrow slots = consumer task; explicit acknowledgement required in [INSTALL-FOR-AI.md](../../../INSTALL-FOR-AI.md) during sub-wave 7.2.
