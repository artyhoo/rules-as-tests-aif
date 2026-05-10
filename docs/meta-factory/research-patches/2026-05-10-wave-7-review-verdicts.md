# Wave 7 — Review verdicts (joint closure §13.27 + §13.28 + §13.8)

> **Authoritative for:** Wave 7 review verdicts on parent research patch [2026-05-10-wave-7-hot-checks-joint-closure-research.md](2026-05-10-wave-7-hot-checks-joint-closure-research.md) — §1 dimension scoring (8 dims per review prompt), §2 closure of §9 open decisions (7 items), §3 sub-wave outline confirmation, §4 §1.7 forward+backward independent re-check, §5 ATTN escalations.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Implementation — orchestrator sub-waves 7.1+ (per parent §11). Final SSOT entries — landed at orchestrator commit-time per parent §8 + sub-wave 7.5.b.
> **Decisions:** binding once accepted by user (operator confirms before orchestrator-kickoff opens scope).
> **Date:** 2026-05-10
> **Branch:** `wave-7-hot-checks-joint-closure`
> **Reviewer scope:** independent fresh-session review (NOT same Claude session that authored research patch + corrections commits `dadcc0b` + `a64eb58`).

## §1 Dimension scoring (per review prompt 8 dims)

| # | Dimension | Score | Notes |
|---|---|---|---|
| 1 | §0 build-vs-reuse honesty | **PASS** | Adversarial counter-prompt («if a unified harness-hook + code-lint + doc-lint framework existed, where would it live?») yields Trunk Code Quality as closest analog — partial overlap (composition primitive, no harness-hook), confirms «no end-to-end match» NULL result. 5 candidates probed: pre-commit, Trunk, MegaLinter, Husky v9 (raw bash, lint-staged NOT installed — corrected per `a64eb58`), per-editor primitives cluster. Build-vs-reuse honor: reuse primitives (markdownlint, lychee, Claude Code hooks API), build integration layer (Decision-matrix row + scoped `settings.json` hooks). Verified `package.json` is workspaces-only + npm test/typecheck — no lint-staged dep present (matches research claim). Verified no root `eslint.config.*` (only inside `templates/ts-server/`). |
| 2 | §1-§2 candidate floor (≥3 per [phase-research-coverage §1.5](../../../.claude/rules/phase-research-coverage.md)) | **PASS** | O0:5, O1:6, O2:6, O3:7, O4:5, O5:4, O6:7 — all above floor. Category spread: O3 covers Claude Code / Codex / Cline / Cursor / Continue.dev / Aider / AIF (7 distinct paradigms — git-native, Rust-impl, community-built, lint-cmd-only, workflow-framework). Same-vocabulary anti-pattern (`#semantic-anchor`) NOT triggered. |
| 3 | §3 harness-hook framing — «5th enforcement layer vs extension» | **PASS** | 4-criteria gate per §13.8 explicitly exercised: (1) failure-cost MEDIUM-HIGH (AI silently bypasses convention before any git checkpoint); (2) local-cost <100ms-1s; (3) detectability unique — no git-lifecycle stage catches editor write-time; (4) NEW lifecycle stage — sits between «AI thinks» and «author commits». Verdict path SHOULD (project-side) / MAY (consumer-side) acknowledges editor-coupling. Cites §13.8 4-criteria gate explicitly per §10 row 1. |
| 4 | §4 functional template test (§13.27 closure) | **PARTIAL** | P1/P4/P6 ↔ template-renderable, P2/P3/P5 ↔ session-local — translation table is sound (matches Wave 6 D-5 verdicts on probe portability). Mock-skeleton patterns realistic — `tmp/` dir + `install.sh` mirrors existing `framework-self-install` CI job (proven cost). **Fixup at write-time:** quantify expected runtime (30s? 60s?) for `framework-self-template-render` job in sub-wave 7.3.e. Verdaccio cost N/A — direct shell-copy via install.sh, no npm publish loop. LLM-judge probe correctly flagged opt-in (review §2 D3 closure → DEFER per §13.10 v2 trigger pattern). |
| 5 | §5 operator-side path (§13.28 closure) | **PASS** | Default A+B is defensible: A (`make validate-prompts`) covers «advisory baseline» when Claude Code not in use; B (PostToolUse) covers «hot channel at write-time» for Claude Code session. C (un-gitignore) correctly rejected per §13.28 (operator-side context not for upstream). Tradeoffs explicit: A is advisory (no enforced trigger because gitignored), B is editor-coupled (Claude Code only). Both share same TS validator (`validate-batch-spec.ts`) — DRY. |
| 6 | §6 adversarial check completeness | **PASS** | All required failure modes covered: false-positive flooding (Vale, HIGH probability — DEFER mitigation), latency (PostToolUse async for non-blocking), lock-in (HIGH — Claude-Code-only documented in INSTALL-FOR-AI.md per sub-wave 7.2), style conflicts (Russian+English mixed prose — markdownlint hand-roll preferred over Microsoft/Google preset), sample-size manipulation (§13.28 «2nd incident» operationalised: «discovered defect that would have been caught by `validate-batch-spec.ts` had it run» — file:line + verification fingerprint). 7th row (Cursor community CLI risk) is bonus coverage. |
| 7 | §10 Decision-matrix rows (§13.8 4-criteria gate) | **PASS** (with PARTIAL on row brevity) | All 7 proposed rows treat 4 criteria. Row 1 (harness-hook) most thorough; row 2 (markdownlint structure) condensed — would benefit from one explicit «detectability» sentence at write-time (currently leans on «caught only by rendering / human review»). Row 5 (Vale) correctly flagged DEFER (does not fully exercise gate but verdict is defer-not-adopt, so partial-treatment is acceptable). Row 7 (§13.28 B PostToolUse) shares row 1 shape — fine. **Fixup at write-time:** expand row 2 detectability sentence in sub-wave 7.5.a commit. |
| 8 | §12 §1.7 forward+backward (self-reflexive) | **PASS** | Forward-check explicit: Authoritative-for header present (verified lines 3-4); cites SSOT existing #1-#15 + proposes new #16-#22; non-capability commit rationale ≥20 chars. Backward-check correctly defers to sub-wave 7.5.a self-review patch (Decision-matrix rows themselves discipline-bearing — must be applied to existing R1-R20 + principles 01-09). Self-reflexive trigger acknowledged: Wave 7 prompts themselves are §13.28 targets — recursive verification scheduled post-§13.28 closure (sub-wave 7.4 retroactively re-evaluates Wave 7 prompts pass `make validate-prompts`). |

**Summary:** 6 PASS, 2 PARTIAL (dim 4 + dim 7 — write-time fixups, do not block GO). 0 FAIL.

## §2 Closure of §9 open decisions (7 items)

### Decision 1 — §13.23 vs harness-hook (REVISED 2026-05-10b — see §7 Revision note)

**CLOSED: SHIP BOTH IN WAVE 7. §13.23 4th-layer pre-push trailer check ships as new sub-wave 7.6 with full research → review → implementation discipline.**

Rationale: harness-hook (5th layer, Claude Code PostToolUse) catches editor write-time defects BEFORE any git checkpoint — covers `git commit --no-verify` bypass for Claude Code sessions. §13.23 (4th layer, pre-push trailer check) catches local-push-without-PR bypass — covers direct push to feature branch sidestepping `discipline-self-check.yml`. Different bypass surfaces; layered defense.

Wave 7 sub-waves 7.1.b (lychee in pre-push) + 7.1.c (principle 09 changed-files) satisfy §13.23 trigger condition #3 (per [open-questions.md:412](../open-questions.md)) — trigger is firing now, Wave 7 owns the closure.

**Initial deferral was false** (caught by user adversarial pushback 2026-05-10 — see §7 Revision note). The 4 «unresolved design problems» have tractable solutions:

| §13.23 problem | Tractable solution direction (validated in 7.6.a research) |
|---|---|
| **Scope predicate** | Smart predicate: file-glob match (`.claude/rules/*.md`, `packages/core/principles/*.test.ts`) **AND** diff content includes a `## §` section heading change OR `+/-` lines inside such sections. Refactors and typo fixes touching prose outside numbered sections pass. |
| **Bootstrap chicken-and-egg** | Explicit bootstrap marker — first-commit-on-branch carrying `§1.7 Bootstrap: <reason>` trailer (≥20 chars rationale). Verified via `git rev-list --count <upstream>..HEAD` = 1 OR commit subject prefix matches `chore(bootstrap-§1.7):`. Mirrors `Prior-art: skipped — ...` escape-hatch pattern from CLAUDE.md. |
| **Trailer-format interaction** | Separate stanzas. Existing `Prior-art:` parser uses `grep -E '^Prior-art:'` (line-anchored, single-key). New parser adds `grep -E '^§1\.7 Forward-check:'` and `grep -E '^§1\.7 Backward-check:'` independently. Order in commit body irrelevant per `git interpret-trailers` semantics. **Not actually a problem under closer inspection.** |
| **Discipline-theatre risk** | Same risk applies to ALL hooks (markdownlint, lychee, principle 09 — all bypassable via `--no-verify`). Accept as universal hook tradeoff, not §13.23-specific blocker. Mitigation: warn-only mode for first 30 days post-ship to calibrate FP rate before promoting to hard-fail. |

These solutions need formal research-prior-art consult (≥3 phrasings on git-trailer enforcement frameworks; Conventional Commits + commitlint + semantic-release + commitizen as primary candidates) per [phase-research-coverage §1](../../../.claude/rules/phase-research-coverage.md). Sub-wave 7.6 ships full discipline cycle: 7.6.a research → 7.6.b review → 7.6.c implementation → 7.6.d open-questions §13.23 closure.

Operator-confirm: §13.23 status note in [open-questions.md §13.23](../open-questions.md) → «closed by Wave 7 sub-wave 7.6» (NOT deferred to Wave 8) at sub-wave 7.5.c. Sub-wave 7.6 dependencies: nothing — runs in parallel with 7.1-7.4. Sub-wave 7.5 (Wave closeout) depends on 7.1-7.6 ship.

### Decision 2 — Vale adoption now or DEFER

**CLOSED: DEFER.**

Rationale: §6 false-positive risk on Russian+English mixed prose ≥30% per SSOT entry 18 proposed verdict. Markdownlint covers structural drift class for §13.28 «6 drafting bugs» mitigation; prose-quality is orthogonal layer that adds FP noise ≫ signal. Trigger to revisit (per SSOT 18): 2nd documented doc-prose-drift incident that markdownlint cannot catch.

Confidence: high. The 6 Wave 6 cold-audit drafting bugs are structural (link integrity, section ordering, metadata format) — markdownlint + lychee close them. Vale would catch a different drift class (prose register, jargon, voice consistency) for which sample-size = 0 currently.

### Decision 3 — §13.27 LLM-judge probe pilot

**CLOSED: ship deterministic-only (P1+P4+P6); LLM-judge probe DEFERRED.**

Rationale: pilot semantic probe pays full Claude API cost (≥$0.05/run × N tests × 2 stacks) + flakiness risk (rubric calibration unstable on first invocation per §13.11) without immediate evidence motivating it. Mirrors §13.10 entry #1 v2 trigger pattern: «first real consumer reports a research gap» / «curated baseline insufficient». For §13.27: deterministic baseline must accumulate ≥30 days of pass/fail data before LLM-judge becomes load-bearing.

Trigger to revisit: deterministic-only PASS rate <80% over 30-day window OR consumer reports «AI agent did not pick up goal phrase from rendered AGENTS.md despite probe PASS».

### Decision 4 — Project-side scope for harness-hook

**CLOSED: Claude Code only (project side, dogfood).**

Rationale: per [README.md](../../../README.md) multi-editor framing acknowledged but narrowed in research §3 ATTN — primary artefacts (`skills/rules-as-tests/`, `agents/`) are harness-agnostic per AGENTS.md spec; bias concentrates in `.claude/skills/self-reflection/` + harness-hook layer (sub-wave 7.2). Cross-editor reference shape stays WATCHLIST per SSOT entry 21; consumer-side multi-editor parity is consumer task. INSTALL-FOR-AI.md explicit acknowledgement required in sub-wave 7.2 commit.

Operator-confirm: do NOT ship Cursor/Cline/Codex reference scripts in `templates/` in Wave 7. If consumer pain materialises (1+ consumer report «I use Cursor and harness-hook layer is missing»), open dedicated SSOT-21 promotion path.

### Decision 5 — §13.28 A+B vs A only

**CLOSED: A+B (both ship in Wave 7).**

Rationale: per parent research default + §13.28 itself. A as advisory baseline (gitignored dir, no enforced trigger; author opts in via `make validate-prompts`); B as hot channel at write-time (Claude Code PostToolUse blocks via JSON `decision:block` on validation fail). Same TS validator (`packages/core/spec-validation/validate-batch-spec.ts`) reused — no DRY violation. Cost: A ≈ Makefile target (≤30 LOC); B ≈ `.claude/settings.json` hook entry + small wrapper (≤50 LOC).

Sub-wave atomicity: 7.4 (operator-side A) + 7.2.b (harness-hook B) ship in separate sub-waves but reference shared validator. No coupling beyond validator path.

### Decision 6 — Markdownlint config (Microsoft/Google preset OR hand-roll)

**CLOSED: hand-roll project-specific config.**

Rationale: project mixes Russian + English prose ([open-questions.md](../open-questions.md) Russian; [CLAUDE.md](../../../CLAUDE.md) English). Microsoft + Google style presets carry English-jargon rules with high FP rate on Russian prose. Hand-roll: ship `.markdownlint.json` with structural rules only (line length, heading levels, link syntax, code-fence language) — no prose-style rules at this layer. Vale layer (deferred per Decision 2) is where prose-style would live if/when triggered.

Operator-confirm: sub-wave 7.1.a `.markdownlint.json` schema must be reviewable in <5 minutes (≤30 lines of config); large preset adoption surfaces FP debt.

### Decision 7 — Decision-matrix verdict for harness-hook (MUST or SHOULD)

**CLOSED: SHOULD (project-side) / MAY (consumer-side).**

Rationale: per parent research §10 row 1 default. SHOULD-not-MUST acknowledges editor-coupling — non-Claude operators don't lose project functionality, only lose detection at the harness-hook stage. MAY-not-SHOULD for consumer-side because consumer adopts editor on their own; framework cannot mandate Claude Code use.

Trigger to promote SHOULD→MUST: 3 documented `#recommendation-skips-own-discipline` or §13.28-shape incidents in Wave 7+ that harness-hook would have caught and pre-push could not. Trigger to promote MAY→SHOULD (consumer-side): cross-editor parity stops being WATCHLIST + Claude Code share of consumer base ≥80%.

## §3 Sub-wave outline confirmation (REVISED 2026-05-10b — added 7.6)

Parent research §11 lists 5 sub-waves (7.1-7.5). Review revision adds **7.6** (§13.23 4th-layer closure with full discipline cycle). Total: **6 sub-waves**.

| Sub-wave | Confirmed scope | Notes |
|---|---|---|
| **7.1** — hot-check primitives (code + docs) | 7.1.a markdownlint-cli2; 7.1.b lychee in pre-push; 7.1.c principle 09 changed-files mode; 7.1.d Wave 6 D-3 SHIP-B (goal-phrase parity) | Precondition: lint-staged + root ESLint flat config NOT installed — sub-wave 7.1 ships **bash-driven hot-check variant** (no lint-staged dep) per Decision-summary tradeoff: keep stack minimal until cross-editor parity discussion forces npm-tooling adoption. |
| **7.2** — harness-hook layer (5th lifecycle stage) | 7.2.a UserPromptSubmit injection (Wave 6 D-1 closure); 7.2.b PostToolUse on `.claude/orchestrator-prompts/**/*.md` (§13.28 B); 7.2.c PostToolUse on REQUIRED_HEADER_DOCS paths; 7.2.d Decision-matrix update | INSTALL-FOR-AI.md update for editor-coupling acknowledgement (Decision 4) ships in 7.2.d. |
| **7.3** — functional template test (§13.27 closure) | 7.3.a Vitest `.audit.ts` harness; 7.3.b tmp skeletons (`ts-server` + `react-next`); 7.3.c install.sh invocation; 7.3.d P1/P4/P6 probes; 7.3.e CI gate `framework-self-template-render` | Capability commit: YES (≥80 LOC under `packages/core/audit-self/template-render.audit.ts`). Prior-art trailer cites SSOT #22 Cookiecutter/Copier ADOPT VOCABULARY (vocabulary-only adoption, no Python dep). |
| **7.4** — Operator-side discipline (§13.28 A) | 7.4.a Makefile target `validate-prompts`; 7.4.b README in `.claude/orchestrator-prompts/` if folder gets one per folder-level authority | Non-capability commit (Makefile + folder README, no new `packages/`). Prior-art trailer: skipped — operator-side discipline closure, no new capability. Self-reflexive note: post-7.4 ship, Wave 7 prompts retroactively re-evaluate against `make validate-prompts` (recursive verification). |
| **7.6** — §13.23 4th-layer pre-push trailer check (NEW per Decision 1 revision) | **7.6.a — research session**: prior-art consult on git-trailer enforcement frameworks (≥3 phrasings: Conventional Commits + commitlint, semantic-release, commitizen, husky commit-msg patterns); cover 4 problems with concrete solution candidates + adversarial check + §1.7 forward+backward + SSOT proposals. Lands as `research-patches/2026-MM-DD-§13.23-4th-layer-research.md`. **7.6.b — review session**: independent fresh-session reviewer scores dimensions, closes any §11 open decisions from research, GO/REVISE verdict. Lands as `research-patches/2026-MM-DD-§13.23-4th-layer-review-verdicts.md`. **7.6.c — implementation**: `.husky/pre-push` extension (≤80 LOC for the 4-problem-aware check); changes to `.claude/skills/self-reflection/SKILL.md` ladder description (3 active layers + 1 deferred → 4 active layers); self-review patch demonstrating hook catches `local-push-bypasses-CI` failure mode (per §13.23 promotion path #4). **7.6.d — open-questions update**: §13.23 status → «closed by Wave 7 sub-wave 7.6» (lands in 7.5.c with other open-questions updates for atomicity). | Capability commit: depends on `.husky/pre-push` LOC delta. If ≤50 LOC delta: NO. If ≥80 LOC delta to existing file: still NO per Wave 6 MAJOR-1 reading (`status=M`, not `status=A`). Build-vs-reuse consult RECOMMENDED for 7.6.a (new conceptual capability «git-trailer enforcement» — context7 ≥3 phrasings; SSOT entry only if no production analog). Cost estimate: 7.6.a ~1 day; 7.6.b ~0.5 day; 7.6.c ~1-2 days; 7.6.d folded into 7.5.c. **Total ~2.5-3.5 days.** Parallelisable with 7.1-7.4. |
| **7.5** — Decision matrix + open-questions update (closeout — depends on 7.1-7.6) | 7.5.a self-application.md §3 expansion (8 new rows — 7 from review §3 + 1 for §13.23 4th-layer); 7.5.b SSOT entries 16-22 + new entries from 7.6.a (if any); 7.5.c open-questions §13.27/§13.28/§13.23 ALL closed + §13.8 expansion + §13.27 LLM-judge re-evaluation trigger; 7.5.d self-review patch per §1.7 backward-check on new rows applied to R1-R20 + principles 01-09 | Capability commit detection: 7.5.a/b/c are doc-only (NOT capability); 7.5.d patch is doc-only (NOT capability). All trailers `Prior-art: skipped — doc-only matrix expansion + closure, no new capability shipped`. **§13.23 row added to Decision matrix** with 4-criteria gate verdict per §13.8 mechanism. |

**Sequencing within Wave 7**: 7.1 + 7.2 + 7.3 + 7.4 + 7.6.a all parallelisable (independent file surfaces). 7.6.b depends on 7.6.a. 7.6.c depends on 7.6.b. 7.5 closes Wave (depends on all of 7.1-7.4 + 7.6.a/b/c landing first because 7.5.a Decision-matrix update enumerates final shipped layers including §13.23 row). 7.4 depends on 7.2.b (shared validator path).

**Estimated total**: ~8-12 days work (revised from 6-9 days; +2.5-3.5 days for sub-wave 7.6). Operator may run 7.1+7.2+7.3+7.6.a in parallel batch for wall-clock compression.

## §4 §1.7 forward+backward independent re-check

This review patch itself is a discipline-bearing artefact (verdicts shape Wave 7 implementation). Apply §1.7 to it.

**Forward-check:**
- Authoritative-for header: ✅ (lines 3-4).
- Cites SSOT IDs: ✅ (references parent §8 entries 16-22 — to be appended at sub-wave 7.5.b commit-time).
- Non-capability commit (doc-only verdict patch): trailer `Prior-art: skipped — review verdict patch consolidating §9 open-decision closures, no new capability shipped` (rationale ≥20 chars per CLAUDE.md hook).
- Doc-authority compliance: ✅ verdict scope explicit; not redefining project goal; not modifying frozen artefacts.
- Trigger sweep cascade-aware: ✅ §13.23 cascade-HIGH closed in Decision 1 with trigger #3 firing acknowledged.

**Backward-check:**
- Scope of new discipline: 7 verdicts × Wave 7 implementation timeline. Backward-check applied to all sub-waves 7.1-7.5 — each has explicit decision routing (Decision 1 ↔ no §13.23 work; Decision 4 ↔ Claude Code only; Decision 5 ↔ A+B atomic split; Decision 6 ↔ hand-roll markdownlint). No scope leak beyond Wave 7.

**Self-reflexive:**
- This verdict patch's own decisions affect Wave 7 prompts (operator-side, gitignored). Per §13.28 closure path B: after sub-wave 7.4 ships, `make validate-prompts` re-evaluates Wave 7 prompts retroactively. If validate fails → recursive-self-application gap surfaces → handle as research-patch follow-up.

## §5 ATTN escalations

- **None of the prompt's STOP conditions fire.** Decision-matrix expansion mechanism (§13.8): all 7 rows treat 4 criteria (PASS dim 7, with row 2 brevity flagged for write-time fixup). §1.7 forward+backward checks: explicit in parent §12 + this verdict's §4. Reviewer = fresh independent session ≠ research-author session.
- **Operator action items** (before orchestrator-kickoff opens scope):
  1. Confirm Decision 1 routing (§13.23 4th-layer design work scheduled separately, NOT folded into Wave 7) — alternative is to expand Wave 7 scope which the verdict explicitly recommends against.
  2. Confirm Decision 4 (Claude Code only project side) — alternative is to ship Cursor/Cline reference scripts in `templates/` which the verdict recommends against until consumer pain materialises.
  3. Note Wave 7 branch base is `wave-6/ai-doc-cold-audit` (Wave 6 closure not yet on `main`). Operator merges Wave 6 → `main` BEFORE Wave 7 PR opens.
- **Cross-references for orchestrator-kickoff:**
  - §13.27 closure path: parent §4 O4 (deterministic P1+P4+P6 probes; LLM-judge DEFERRED per Decision 3).
  - §13.28 closure path: parent §5 O5 default A+B (per Decision 5).
  - §13.8 expansion: 7 Decision-matrix rows per parent §10 (per Decision 7 verdicts MUST/SHOULD/MAY routing).

## §6 Verdict block (review-prompt format — REVISED 2026-05-10b)

```
Verdict: GO
Confidence: high

PASS dimensions: 1, 2, 3, 5, 6, 8
PARTIAL dimensions: 4 (template test runtime quantification — write-time fixup), 7 (Decision-matrix row 2 detectability brevity — write-time fixup)
FAIL dimensions: (none)

Open decisions closed in review:
  Decision 1: SHIP BOTH IN WAVE 7 — harness-hook (5th layer, sub-wave 7.2) + §13.23 4th-layer (sub-wave 7.6 with full research→review→implementation cycle). REVISED 2026-05-10b after user adversarial check revealed initial deferral was false.
  Decision 2: DEFER Vale (§6 FP risk; trigger = 2nd doc-prose incident markdownlint cannot catch)
  Decision 3: ship deterministic-only P1+P4+P6; LLM-judge probe DEFERRED (mirrors §13.10 v2 trigger pattern)
  Decision 4: Claude Code only (project side dogfood); INSTALL-FOR-AI.md acknowledges editor-coupling
  Decision 5: §13.28 A+B both ship in Wave 7 (sub-waves 7.4 + 7.2.b); shared validator
  Decision 6: hand-roll .markdownlint.json (no Microsoft/Google preset; Russian+English mixed prose FP risk)
  Decision 7: harness-hook = SHOULD project-side / MAY consumer-side (editor-coupling acknowledged)

Sub-wave outline (6 sub-waves per revision):
  7.1 — hot-check primitives (code + docs) — bash-driven variant; no lint-staged dep
  7.2 — harness-hook layer (5th lifecycle stage) — Claude Code PostToolUse + UserPromptSubmit
  7.3 — functional template test (§13.27) — Vitest .audit.ts + tmp skeletons + P1/P4/P6 probes
  7.4 — operator-side discipline (§13.28 A) — make validate-prompts
  7.6 — §13.23 4th-layer pre-push trailer check (NEW) — 7.6.a research → 7.6.b review → 7.6.c impl → 7.6.d closure
  7.5 — Decision matrix + open-questions update (closeout) — 8 rows + §13.27/§13.28/§13.23 ALL closed + §13.8 expansion

Cross-references:
  - §13.27 closure path: parent §4 O4 deterministic-only (LLM-judge DEFERRED)
  - §13.28 closure path: parent §5 O5 default A+B
  - §13.8 expansion: 8 Decision-matrix rows (7 per parent §10 + 1 for §13.23 4th-layer)
  - §13.23 closure path: review §2 Decision 1 revised — 4 problems have tractable solutions; sub-wave 7.6 ships full discipline cycle

Estimated total: ~8-12 days (revised from 6-9 days; +2.5-3.5 days for sub-wave 7.6)

Next step (GO): operator confirms §5 ATTN action items, then opens orchestrator-kickoff per filled .claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/orchestrator-kickoff.md (operator-side, gitignored).
```

## §7 Revision note — 2026-05-10b adversarial-check correction

This verdict patch was originally committed as `b9b19ed` with Decision 1 routing «§13.23 4th-layer DESIGN scheduled separately, NOT Wave 7 scope». User adversarial pushback («ты просто отложил потому что поленился делать?») triggered §1.4 adversarial check on the load-bearing claim «§13.23 has 4 unresolved design problems unfit for Wave 7 scope».

**Adversarial check result:** the original deferral was **false**. Closer inspection of each of the 4 problems revealed tractable solutions (per Decision 1 revised table above):
- Problem 1 (scope predicate): smart predicate with `## §`-section diff content match — solvable in research session
- Problem 2 (bootstrap chicken-and-egg): explicit `§1.7 Bootstrap:` trailer or commit-subject prefix pattern — mirrors existing `Prior-art: skipped — ...` escape-hatch
- Problem 3 (trailer-format interaction): NOT a problem — separate stanzas work fine; existing `^Prior-art:` parser is line-anchored and unaffected
- Problem 4 (discipline-theatre risk): universal hook tradeoff (applies to markdownlint/lychee/principle-09 too), not §13.23-specific blocker; warn-only-first-30-days mitigation

**Anti-pattern identified:** `#deferral-by-pattern-match-on-deferred-status` — reviewer (this session) read «Status: deferred» + 4 listed problems in [open-questions.md §13.23](../open-questions.md) and accepted the deferral as load-bearing without running §1.4 adversarial check on each problem individually. Same shape as `#own-stack-blind-spot` but applied to negative-existence claims about design tractability (not capability existence).

**Surface to coverage methodology:** this incident is a candidate for §4 anti-pattern catalog promotion ([phase-research-coverage.md §4](../../../.claude/rules/phase-research-coverage.md)) under tag `#deferral-by-pattern-match-on-deferred-status` — sample size 1/3 (this incident); two more to trigger formal §3 distillation per AIF-aggregation threshold. Track here to seed the count.

**Forward-check on this revision** (per §1.7):
- Authoritative-for header: existing patch header still applies (Decision 1 + §3 sub-wave outline within scope).
- Self-reflexive trigger: this revision IS a discipline-bearing change (modifies verdict routing) — §7 itself is the §1.7 forward+backward documentation per «every new discipline-bearing artefact ships with self-review patch».
- Backward-check: no existing artefacts are retroactively affected (revision is forward-looking); sub-wave 7.6 is the addition; §13.23 status note in open-questions.md updates from «trigger #3 fired, design separate» (would have been written by 7.5.c per original Decision 1) to «closed by Wave 7 sub-wave 7.6».
- Build-vs-reuse: 7.6.a research session itself runs ≥3 phrasings on git-trailer enforcement frameworks per `phase-research-coverage §1.5`; SSOT consult discipline applied at write-time.
