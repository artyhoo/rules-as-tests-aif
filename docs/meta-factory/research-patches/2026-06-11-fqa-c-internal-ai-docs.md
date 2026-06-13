<!-- scope:final-quality-audit-s1-c -->
# FQA Stage-1 sub-wave C — internal AI-docs audit (read-only)

> **Scope:** final-quality-audit umbrella, Stage 1, sub-wave C. READ-ONLY R-phase — this file is the only artefact created. No fixes applied.
> **Date:** 2026-06-11 · **Branch:** `feature/final-quality-audit-e0fbdd` · harvested by orchestrator after `status=done`.
> **Active anti-laziness traps:** T1, T3, T7, T9, T10, T13, T14, T15.

## §population (count — ALL, no sampling)

Full enumeration of the binding scope. **No sampling** (T1/T9/T10): every file in each category was enumerated; verification depth noted per category.

| Category | Count | Files |
|---|---|---|
| Top-level AI docs | 2 | `CLAUDE.md`, `.claude/session-bootstrap.md` |
| `.claude/rules/*.md` | **12** | ai-laziness-traps, build-first-reuse-default, companion-install-principle, doc-authority-hierarchy, dual-implementation-discipline, memory-codification, no-paid-llm-in-ci, parallel-subwave-isolation, phase-research-coverage, recommendation-laziness-discipline, reviewer-discipline, rule-enforcement-channel-selection |
| `agents/*.md` | 5 | compliance-verifier, living-docs-auditor, memory-codification-auditor, orchestrator-worker-discipline, review-sidecar |
| `.claude/hooks/*.sh` (top-level) | 13 | ask-question-reminder, check-doc-authority, check-hook-marker, check-kickoff-traps, deps-hash-check, end-of-turn-reminder, inject-matching-rule, inject-session-bootstrap, inject-subagent-digest, runtime-bridge-dispatch, validate-prompt, warn-subagent-report, worktree-setup |
| `.claude/hooks/lang/*.sh` | 3 | en, ru, check-parity (all carry `@dual-pair: hook-lang-i18n`) |
| Self-application instruments (T15) | 2 + 21 | `packages/core/audit-self/audit-ai-docs.sh` + `packages/core/principles/*.test.ts` (01–20, slot 20 has 2 files) |

**Total in-scope artefacts enumerated: 58** (2 + 12 + 5 + 16 hooks + 23 self-instruments).

## §method

- **Staleness:** `git log --oneline -55` (PRs #405–#461) as merged-reality baseline → grep each doc for claims contradicted by it (one-click `./setup`, companion-install manifest, markdown gate 500→600, guard-liveness, AifFireBackend).
- **Class-field:** `grep -n "Class:" .claude/rules/*.md` → per-rule verification (A: cited test path exists + subject intact; B: named mechanism exists + wired; C: promotion-threshold quote + evidence count).
- **Marker coverage:** dual-implementation §6 grep, verbatim output below.
- **Authority sweep:** `grep "Authoritative for:"` across all rules + CLAUDE.md + bootstrap → overlap scan.
- **Self-application (T15):** read `audit-ai-docs.sh` header-vs-probe consistency; extract principle-test subject paths and confirm each subject still exists.
- **Environment limit (honest, T3):** the worktree has **no `node_modules`** (`ls node_modules` → absent; no `vitest` anywhere). Class-A test *runtime pass/fail could NOT be executed*. Existence + subject-intactness verified mechanically; runtime-pass marked **INCONCLUSIVE-needs-CI**, not guessed.

## §findings (severity-tagged, file:line evidence each)

### F1 — MINOR — broken skill path in dual-implementation-discipline
`​.claude/rules/dual-implementation-discipline.md:65` cites `​.claude/skills/rules-as-tests/` as a live example ("skill consumed in CC-compatible harnesses"). Evidence: `ls -d .claude/skills/rules-as-tests` → **MISSING**; the skills dir contains no `rules-as-tests` entry (34 skills present, none by that name). Illustrative example, not load-bearing logic → MINOR, but a concrete dangling reference.

### F2 — MINOR — stale pre-rename self-name in living-docs-auditor
`agents/living-docs-auditor.md:159` body text reads "*that's not a failure of `docs-auditor`*" — the old name. The agent was renamed `docs-auditor`→`living-docs-auditor` (its own frontmatter line 3 + CLAUDE.md Artifact-Ownership row D-AuditC-6). The header/name are updated; line 159 is a missed body reference.

### F3 — INFO (defensible) — dual-impl §9 "reports 4 MISSING" count drifted to 3
`​.claude/rules/dual-implementation-discipline.md:214` states the §6 grep "reports 4 «MISSING marker» findings for `check-doc-authority.sh`, `deps-hash-check.sh`, `inject-session-bootstrap.sh`, `validate-prompt.sh`." Current grep reports **3** (see §coverage) — `deps-hash-check.sh` now carries `# @dual-pair: deps-hash-check-dogfood` (verified, counterpart `packages/core/hooks/deps-hash-check.{sh,test.ts}` exists). **Defensible:** the sentence is explicitly timestamped "Current state at codification (2026-05-17)" — a historical snapshot, not a live claim. Flagged for awareness, not asserted as a bug.

### F4 — LOW — compliance-verifier self-check example lists 4 of 5 agents
`agents/compliance-verifier.md:75` example: "`grep … agents/*.md` → one match per shipped agent (e.g. review-sidecar.md:9, living-docs-auditor.md:9, compliance-verifier.md:9, memory-codification-auditor.md:11)." Omits the 5th, `orchestrator-worker-discipline.md:9` (header confirmed present). Framed "e.g." (illustrative) → LOW; grep would now return 5 matches.

### F5 — LOW — CLAUDE.md does not mention the `./setup` one-click installer
`grep -nE 'setup|install\.sh|companion' CLAUDE.md` → only INSTALL-FOR-AI pointer (line 30) + CONTRIBUTING pointer (line 127) + worktree-setup hook (line 132). PRs #447/#451 made `./setup` the **primary** install entry (companion manifest + bridge). CLAUDE.md never references it. Gap, not contradiction — installer docs arguably belong in INSTALL/CONTRIBUTING, so this is a discoverability LOW, not a staleness MAJOR.

### F6 — INFO (out-of-scope, adjacent) — `.husky/pre-commit` comment still says "≤500"
While locating the actual gate value: `.husky/pre-commit:10` comment reads "Markdown ≤500 lines"; the enforcing code `.husky/pre-commit:64-65` uses `-gt 600` / "exceeds 600 lines". The comment header is stale vs its own code. **Out of binding scope** (`.husky/` ≠ `.claude/hooks/`) — surfaced as an observation only, not counted in the in-scope fix-list. Belongs to whichever sub-wave owns repo-root hooks / the markdown-gate reconciliation.

## §FORK — surfaced, NOT decided (aif fork discipline)

### Q1 — EXECUTION-PLAN.md ≤500 references: stale vs deliberate stricter budget
`docs/meta-factory/EXECUTION-PLAN.md:307,309,318` use `≤500` for `self-application.md`'s size and call it "собственный invariant ≤500" / "PROPOSAL.md = 709 строк уже превышает invariant ≤500". The enforced global markdown gate is now **600** (`.husky/pre-commit:64`). This is a **genuine fork, not decided here**:
- **Option A → these are the global markdown invariant, now drifted.** Consequence: update the three refs 500→600 for consistency with the enforced gate.
- **Option B → these are a deliberately stricter per-doc budget for *shipped-reference* docs (500 < the 600 blanket gate).** Consequence: leave as-is; they are intentionally tighter than the global ceiling and updating them would loosen an intentional target.
No determinate best answer on the project's merits (taste/policy call on whether shipped-reference docs carry a tighter budget). **Parked for maintainer / orchestrator** — set this task slice to `manualReviewRequired`. The task note in the known-issue check ("verify current state") is satisfied: `CONTRIBUTING.md` **is** fixed (≤600, line 38); the EXECUTION-PLAN refs are this fork, not a clean stale-ref.

## §class-field-table (rule × declared Class × verified state)

| Rule | Declared | Verified state |
|---|---|---|
| ai-laziness-traps | **A** | Test `12-ai-laziness-traps.test.ts` exists ✓. Subject = kickoffs under gitignored `.claude/orchestrator-prompts/`; test skips file-based assertions in CI and runs pure-logic (lines 106-107) — **not a tautology**. Runtime-pass **INCONCLUSIVE-needs-CI**. Class **correct**. |
| build-first-reuse-default | **A** | Test `11-build-first-reuse-default.test.ts` exists ✓ + design sketch present. Runtime-pass INCONCLUSIVE. Class **correct**. |
| doc-authority-hierarchy | **A** | Test `09-doc-authority-hierarchy.test.ts` exists ✓ (`REQUIRED_HEADER_DOCS`). Runtime-pass INCONCLUSIVE. Class **correct**. |
| no-paid-llm-in-ci | **A** | Test `17-no-paid-llm-in-ci.test.ts` exists ✓ (grep over `.github/workflows/*.yml`). Runtime-pass INCONCLUSIVE. Class **correct**. |
| phase-research-coverage | **A** | Test `13-phase-research-coverage-s17.test.ts` exists ✓ (HISTORICAL_CUTOFF). Runtime-pass INCONCLUSIVE. Class **correct**. |
| memory-codification | **B** | Mechanism `agents/memory-codification-auditor.md` EXISTS ✓ + local-audit grep (§4a). Ceiling-B rationale (memory outside CI) sound. Class **correct**. |
| rule-enforcement-channel-selection | **B** | Mechanism `.claude/hooks/inject-matching-rule.sh` + test `packages/core/hooks/inject-matching-rule.test.ts` EXISTS ✓; PostToolUse `Edit|Write` wiring present in `.claude/settings.json` (≈line 114) ✓. Class **correct**. |
| companion-install-principle | **C** | Promotion = ≥3 manifest rows OR first version-pin. `setup.d/companions.manifest` = **2 rows** (superpowers, runtime-bridge); `grep -E '@[0-9]'` → **no pins**. Threshold **not hit** → Class **correct**. |
| dual-implementation-discipline | **C** | Promotion = 3 violations OR 5th dual-channel artefact. Distinct `@dual-pair` anchors in hooks = **4** (hook-lang-i18n, deps-hash-check-dogfood, rule-path-scoping, worktree-create-setup). Threshold (5) **not hit but approaching** → Class **correct**; watch for the 5th. |
| parallel-subwave-isolation | **C** | Own build-target explicitly **dropped** (§4, N7) — REFERENCE upstream `using-git-worktrees`. No promotion path; retirement-only. Class **correct**. |
| recommendation-laziness-discipline | **C** | Promotion = 3+ documented in-session violations / 6mo with file:line. No evidence of 3 logged → threshold **not hit**. Class **correct**. |
| reviewer-discipline | **C** | Promotion = 3 role-swap incidents / 6mo. No evidence of 3 → threshold **not hit**. Class **correct**. |

**Retirement check (T item 3):** every rule was codified 2026-05 / 2026-06 (oldest ~1 month before today 2026-06-11). No rule's 12-month zero-incident retirement window has elapsed → **none due**. Clean.

**Authority-conflict sweep (`#contradicting-authority-claims`):** each rule's `Authoritative for:` scope names its own distinct discipline; the only shared scope (build-vs-reuse) is explicitly subordinated — CLAUDE.md owns per-commit gate, `build-first-reuse-default.md §1.1` owns macro (relocation marker dated 2026-06-01). The two `<placeholder>` "Authoritative for" hits are template examples inside `doc-authority-hierarchy.md §3`, not real headers. **No conflict found.**

## §self-application (T15 — instrument audit, NOT optional)

**`packages/core/audit-self/audit-ai-docs.sh`** — header declares "Code-vs-docs consistency audit for server-side TypeScript projects; each probe maps EXPLICITLY to a rule number from `.ai-factory/RULES.md`" (R1–R11 + drift D1–D4). This is a **consumer-shipped** instrument: its subjects are consumer-side paths (`.ai-factory/RULES.md`, `src/domain`, `scripts/audit-r4.ts`) that are **absent in the source repo by design** (cf. living-docs-auditor Step-2 graceful-degradation note). Verified: the R1–R11/D1–D4 probe→rule mapping in the header is internally consistent with the probe bodies; no probe references a moved in-repo subject. **Still tests what it claims** (for the consumer surface it targets). T13 note: it is an ADOPTED/shipped instrument and was audited at face value, not waved through.

**`packages/core/principles/*.test.ts`** — subject-drift sweep (extract path/glob targets → confirm subject exists):
- Principles 18/19 are **named** `meta-orchestrator-*` but their actual subject is `.claude/skills/pipeline/SKILL.md §10` (historical rename meta-orchestrator→pipeline). `pipeline` skill **exists** ✓ — subject intact; the name is legacy vocabulary, not drift.
- **INFO:** `.claude/skills/meta-orchestrator/` is present but **untracked** (`git status` → `?? .claude/skills/meta-orchestrator/`) — a new, uncommitted skill outside the committed corpus. Not audited (out of committed scope); flagged so a later sub-wave confirms whether principles 18/19 should re-point or the new skill needs its own coverage.
- Principle 12's gitignored `orchestrator-prompts` subject is handled by an explicit CI-skip guard (no vacuous pass).
- No principle test found whose subject has **vanished**. All extracted target paths (`.claude/skills/pipeline/SKILL.md`, `packages/core/hooks/{pre-push,check-hook-marker}`, `packages/core/render/render-rules`, `packages/preset-next-15-canonical/RULES`, `.claude/rules/*`) resolve to existing files.

## §adversarial-counter-prompt (run + quote — T7)

**Prompt run:** *"Which doc category in the binding scope did I NOT enumerate or under-cover?"*

**Result of running it:** First pass had enumerated rules/hooks/instruments but had only *listed* `agents/*.md` without reading their bodies. The counter-prompt forced a second sweep of all 5 agents — which **surfaced F2 (living-docs-auditor:159 stale name) and F4 (compliance-verifier:75 4-of-5 list)**, neither of which the first pass had. Re-run with a rephrase *"any scoped file type whose markers I checked but whose prose I didn't?"* → confirmed `.claude/hooks/lang/*.sh` carry markers (covered) and that `check-hook-marker.sh` is itself the PostToolUse gate enforcing the §6 marker convention (so the 3 marker-less legacy hooks are flagged only when edited — by design, not a violation). No further uncovered category surfaced on the second rephrase → enumeration judged complete for the binding scope. Categories deliberately **excluded** (README, INSTALL*, `.claude/skills/*`, `docs/meta-factory/*` large-prose) are other sub-waves' scope (A/B/D), not mine.

## §fix-list (for a later I-phase — NOT applied here)

| # | Severity | File:line | Fix |
|---|---|---|---|
| F1 | MINOR | `.claude/rules/dual-implementation-discipline.md:65` | Replace `.claude/skills/rules-as-tests/` with an existing skill example (or drop the skill example). |
| F2 | MINOR | `agents/living-docs-auditor.md:159` | `docs-auditor` → `living-docs-auditor` in body text. |
| F3 | INFO | `.claude/rules/dual-implementation-discipline.md:214` | Optional: note grep now reports 3 (deps-hash-check.sh acquired a marker); or leave as timestamped historical snapshot. |
| F4 | LOW | `agents/compliance-verifier.md:75` | Add `orchestrator-worker-discipline.md:9` to the e.g. list (or write "5 shipped agents"). |
| F5 | LOW | `CLAUDE.md` | Optional: add a one-line `./setup` pointer under "See also" / parallel-session dispatch. |
| F6 | INFO (out-of-scope) | `.husky/pre-commit:10` | Comment "≤500" → "≤600" to match line 64. Owned by repo-root-hooks / markdown-gate sub-wave. |
| Q1 | FORK | `docs/meta-factory/EXECUTION-PLAN.md:307,309,318` | **Do not auto-fix.** Maintainer decides Option A (500→600 drift) vs Option B (deliberate stricter shipped-ref budget). |

## §coverage

- **Population coverage: 100% of binding scope** — all 58 in-scope artefacts enumerated (no sampling, T1/T9/T10). Verification depth: every rule's Class-field verified mechanically for existence/threshold; every hook marker grepped; every agent body read; both self-instruments read.
- **Verbatim §6 marker grep output** (the §5-mandated quote):
  ```text
  MISSING marker: .claude/hooks/check-doc-authority.sh
  MISSING marker: .claude/hooks/inject-session-bootstrap.sh
  MISSING marker: .claude/hooks/validate-prompt.sh
  ```
  These 3 are pre-`check-hook-marker.sh` legacy hooks; the PostToolUse gate `check-hook-marker.sh` flags a hook only when edited (forward-going per dual-impl §9), so their absence is **expected state, not a violation**. (dual-impl §9:214 still says "4" — see F3.)
- **Known limitation (T3, T14 — distinguish "no findings" from "couldn't verify"):** Class-A **runtime** pass/fail is **INCONCLUSIVE** — the worktree has no `node_modules`/`vitest`, so the 5 principle tests could not be executed. Verified: test files exist + subjects intact. A CI run (or `npm install && npm test --workspaces`) is required to confirm green. This is a coverage gap on *runtime* status, not a clean pass — stated explicitly rather than asserted.
- **Findings:** 2 MINOR, 2 LOW, 2 INFO (1 out-of-scope), 1 FORK parked. **No MAJOR/CRITICAL staleness, no authority conflict, no mis-declared Class, no retirement due.** The internal AI-docs corpus is substantively current vs merged reality (PRs #405–#461).
