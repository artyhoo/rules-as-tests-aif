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

### Decision 1 — §13.23 vs harness-hook

**CLOSED: SHIP BOTH (parallel surfaces, different bypass profiles).**

Rationale: harness-hook (5th layer, Claude Code PostToolUse) catches editor write-time defects BEFORE any git checkpoint — covers `git commit --no-verify` bypass for Claude Code sessions. §13.23 (4th layer, pre-push trailer check) catches local-push-without-PR bypass — covers direct push to feature branch sidestepping `discipline-self-check.yml`. Different bypass surfaces; layered defense. Wave 7 sub-waves 7.1.b (lychee in pre-push) + 7.1.c (principle 09 changed-files) DO satisfy §13.23 trigger condition #3 (per [open-questions.md:412](../open-questions.md)) — trigger is firing now.

**However, §13.23 4th-layer design work does NOT ship in Wave 7.** §13.23's 4 unresolved design problems (scope predicate; bootstrap chicken-and-egg; trailer-format interaction; discipline-theatre risk) require a dedicated research session. Wave 7 ships harness-hook (5th layer, well-scoped); §13.23 stays armed with trigger #3 condition formally met — opens for design as separate research session (Wave 8 candidate or operator-prioritised follow-up).

Operator-confirm: §13.23 status note in [open-questions.md §13.23](../open-questions.md) updates to «Trigger #3 fired 2026-05-10 via Wave 7 sub-waves 7.1.b/7.1.c; design work scheduled separately» in sub-wave 7.5.c.

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

## §3 Sub-wave outline confirmation

Parent research §11 lists 5 sub-waves (7.1-7.5). Independent re-check confirms outline is sound for orchestrator-kickoff. Adjustments:

| Sub-wave | Confirmed scope | Notes |
|---|---|---|
| **7.1** — hot-check primitives (code + docs) | 7.1.a markdownlint-cli2; 7.1.b lychee in pre-push; 7.1.c principle 09 changed-files mode; 7.1.d Wave 6 D-3 SHIP-B (goal-phrase parity) | Precondition: lint-staged + root ESLint flat config NOT installed — sub-wave 7.1 ships **bash-driven hot-check variant** (no lint-staged dep) per Decision-summary tradeoff: keep stack minimal until cross-editor parity discussion forces npm-tooling adoption. |
| **7.2** — harness-hook layer (5th lifecycle stage) | 7.2.a UserPromptSubmit injection (Wave 6 D-1 closure); 7.2.b PostToolUse on `.claude/orchestrator-prompts/**/*.md` (§13.28 B); 7.2.c PostToolUse on REQUIRED_HEADER_DOCS paths; 7.2.d Decision-matrix update | INSTALL-FOR-AI.md update for editor-coupling acknowledgement (Decision 4) ships in 7.2.d. |
| **7.3** — functional template test (§13.27 closure) | 7.3.a Vitest `.audit.ts` harness; 7.3.b tmp skeletons (`ts-server` + `react-next`); 7.3.c install.sh invocation; 7.3.d P1/P4/P6 probes; 7.3.e CI gate `framework-self-template-render` | Capability commit: YES (≥80 LOC under `packages/core/audit-self/template-render.audit.ts`). Prior-art trailer cites SSOT #22 Cookiecutter/Copier ADOPT VOCABULARY (vocabulary-only adoption, no Python dep). |
| **7.4** — Operator-side discipline (§13.28 A) | 7.4.a Makefile target `validate-prompts`; 7.4.b README in `.claude/orchestrator-prompts/` if folder gets one per folder-level authority | Non-capability commit (Makefile + folder README, no new `packages/`). Prior-art trailer: skipped — operator-side discipline closure, no new capability. Self-reflexive note: post-7.4 ship, Wave 7 prompts retroactively re-evaluate against `make validate-prompts` (recursive verification). |
| **7.5** — Decision matrix + open-questions update | 7.5.a self-application.md §3 expansion (7 new rows); 7.5.b SSOT entries 16-22 in prior-art-evaluations.md; 7.5.c open-questions §13.27/§13.28 closed + §13.8 expansion + §13.23 trigger #3 fired note + §13.27 LLM-judge re-evaluation trigger; 7.5.d self-review patch per §1.7 backward-check on new rows applied to R1-R20 + principles 01-09 | Capability commit detection: 7.5.a/b/c are doc-only (NOT capability); 7.5.d patch is doc-only (NOT capability). All trailers `Prior-art: skipped — doc-only matrix expansion + closure, no new capability shipped`. |

**Sequencing within Wave 7** (per umbrella-level orchestrator scope): 7.1 + 7.2 can run in parallel (independent file surfaces); 7.3 depends on neither but pulls in `framework-self-install` infrastructure (independent existing); 7.4 depends on 7.2.b (B-side ships first, then A-side wraps with shared validator path); 7.5 closes Wave (depends on all of 7.1-7.4 landing first because 7.5.a Decision-matrix update enumerates final shipped layers).

**Estimated total**: ~6-9 days work (per parent §11). Operator may run 7.1 + 7.2 in parallel sub-batches for ~30% wall-clock compression.

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

## §6 Verdict block (review-prompt format)

```
Verdict: GO
Confidence: high

PASS dimensions: 1, 2, 3, 5, 6, 8
PARTIAL dimensions: 4 (template test runtime quantification — write-time fixup), 7 (Decision-matrix row 2 detectability brevity — write-time fixup)
FAIL dimensions: (none)

Open decisions closed in review:
  Decision 1: SHIP BOTH parallel — harness-hook (5th layer) + §13.23 4th-layer trigger #3 fired but design work scheduled separately
  Decision 2: DEFER Vale (§6 FP risk; trigger = 2nd doc-prose incident markdownlint cannot catch)
  Decision 3: ship deterministic-only P1+P4+P6; LLM-judge probe DEFERRED (mirrors §13.10 v2 trigger pattern)
  Decision 4: Claude Code only (project side dogfood); INSTALL-FOR-AI.md acknowledges editor-coupling
  Decision 5: §13.28 A+B both ship in Wave 7 (sub-waves 7.4 + 7.2.b); shared validator
  Decision 6: hand-roll .markdownlint.json (no Microsoft/Google preset; Russian+English mixed prose FP risk)
  Decision 7: harness-hook = SHOULD project-side / MAY consumer-side (editor-coupling acknowledged)

Sub-wave outline (per parent §11, confirmed):
  7.1 — hot-check primitives (code + docs) — bash-driven variant; no lint-staged dep
  7.2 — harness-hook layer (5th lifecycle stage) — Claude Code PostToolUse + UserPromptSubmit
  7.3 — functional template test (§13.27) — Vitest .audit.ts + tmp skeletons + P1/P4/P6 probes
  7.4 — operator-side discipline (§13.28 A) — make validate-prompts
  7.5 — Decision matrix + open-questions update — 7 rows + §13.27/§13.28 closed + §13.23 trigger #3 fired note

Cross-references:
  - §13.27 closure path: parent §4 O4 deterministic-only (LLM-judge DEFERRED)
  - §13.28 closure path: parent §5 O5 default A+B
  - §13.8 expansion: 7 Decision-matrix rows per parent §10

Next step (GO): operator confirms §5 ATTN action items 1-3, then opens orchestrator-kickoff per filled .claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/orchestrator-kickoff.md (operator-side, gitignored).
```
