# Memory-to-docs codification audit — full sweep of 14 personal-memory entries

> **Scope:** post-Wave-9 audit of [/Users/art/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/](file:///Users/art/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/) against the project thesis. Each entry classified: **codify in repo** vs **legitimate personal memory**. Inherits folder authority per [README.md](README.md).

## §1 Incident framing — the maintainer call-out

2026-05-13, immediately after PR #51 (Wave 9 closure). Maintainer flagged the recursive shape:

> «мы делаем проект где этого не должно быть [conventions in agent heads] а ты себе в память записываешь вместо того чтобы в проекте документацию изменять»

This is **exactly** the failure mode the project's thesis names ([README.md#why-this-exists](../../../README.md#why-this-exists)):

> «AI agents (Claude, Cursor, Copilot, Aider) write plausible-looking code that **reliably violates undocumented conventions** … This package operationalizes the principle: **every rule that governs your codebase is an executable test that fails the build when violated**.»

A memory entry in `~/.claude/projects/<repo>/memory/` is an **undocumented convention** for every fresh AI session that does not load this session's user-scope memory store. The author of the memory satisfies the rule; nobody else does. Reactive surfacing by the maintainer — incident-driven, not CI-driven — is the exact opposite of the project's enforcement posture.

This is `#recursive-self-application-gap` at the documentation surface (parallel to `#discipline-theatre` which Wave 9 closed at the code surface). The project's discipline accumulated bottom-up (code → principles → trailers → research) but never applied top-down to **its own AI session's persistence layer**.

## §2 Independent re-audit (re-grep, not trust-prior-list)

Method: read every file in [memory/](file:///Users/art/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/) directly, classify against four buckets:

- **A — action-ready strong**: project-wide constraint, incident occurred OR high blast radius, mechanism exists in current toolchain.
- **B — strong but status-blocked**: belongs in repo but coordination or its own threshold gates promotion now.
- **C — soft (extension)**: extends an existing rule rather than seeding a new file.
- **D — legitimate personal**: agent-operational, user-pref, ephemeral state, or already-codified-reminder.

Full inventory (14 entries, all read body-content not just MEMORY.md titles):

| # | File | My class | Body evidence | Prior session class | Δ |
|---|---|---|---|---|---|
| 1 | `feedback_delegation_model.md` | **D** | Body is Path 0/A/B agent-quota guidance, framed «for this orchestrator». Not a project rule. | D | = |
| 2 | `feedback_external_docs_via_context7.md` | **C** | First half (context7 over git-clone) is in `~/.claude/CLAUDE.md` user-global; second half (Phase entry «existing solutions» checklist) is **already codified** in [`.claude/rules/phase-research-coverage.md §1.1-§1.5`](../../../.claude/rules/phase-research-coverage.md). Memory is redundant-or-extension. | C | = |
| 3 | `feedback_reviewer_orchestrator_role_separation.md` | **A** | Process discipline ; incident occurred (2026-05-07); no current home in repo. | A | = |
| 4 | `feedback_ai_doc_research_priority_pool.md` | **C** | Tier 1/2/3 source priority list; advisory, not gateable; extension to [`phase-research-coverage.md §1.1`](../../../.claude/rules/phase-research-coverage.md) own-stack sweep. | C | = |
| 5 | `feedback_no_drive_by_prs.md` | **A** | Orchestrator scope discipline; incident PR #33 (2026-05-11); affects any future AI orchestrator session. | A | = |
| 6 | `feedback_pr_s17_header_level.md` | **D** | Memory describes mechanical CI behavior already enforced by `discipline-self-check.yml:54-64` awk pattern (H3 verbatim match). Reminder, not rule. | D | = |
| 7 | `feedback_pr_body_count_claims_unverified.md` | **B-coordinated** | PR #51 incident (2026-05-13). **Handled by [companion handoff `post-9-pr-body-substance-research.md`](../../../.claude/orchestrator-prompts/wave-9-discipline-theatre-audit/post-9-pr-body-substance-research.md).** Do not duplicate research; flag here for cross-ref. | A (with note) | = |
| 8 | `feedback_s17_scope_vs_path_filter.md` | **A** | When to use Skipped marker vs substantive Forward+Backward. CI path filter is broad; substance arm gates ALL files. Mechanical maintenance produces theatre-shaped §1.7 bullets if author doesn't know to use Skipped. PR template does not currently surface the branch (template body only shows TODO Forward+Backward; Skipped is hidden in HTML comment). | A | = |
| 9 | `feedback_no_paid_llm_in_ci.md` | **A** | Project-wide policy. Currently referenced only in research-patches (`2026-05-11-llm-usage-audit.md`) + sub-agent prompts, never as a top-level rule. `grep -rn "no.paid\|paid.LLM" CLAUDE.md README.md .claude/rules/` returns zero matches. **Not codified.** | A | = |
| 10 | `feedback_worktrees_for_parallel_subwaves.md` | **A** | Orchestrator parallel-execution discipline. Wave 8.1/8.1b incident (2026-05-12) caused branch contamination. No mention in `.claude/rules/`, `CLAUDE.md`, or project-local skills. | A | = |
| 11 | `feedback_hook_self_test_pipeline_stubs.md` | **A** | Wave 8.3 regression. **Highest mechanical fit** — `make_test_repo()` calls and `.husky/pre-push:37-46` hard-fail invocations are both grep-enumerable. Prime principle-test candidate. | A | = |
| 12 | `feedback_preserve_before_destructive_delegation.md` | **B-gated** | **Disagree with prior «A» class.** Memory's own body specifies promotion at incident counter **3/3**; current is **1/3**. Codifying now bypasses the threshold rule the memory itself established. Wait. | A → **B-gated** | **Δ** |
| 13 | `feedback_ci_runner_allocation_diagnostic.md` | **D** | Investigative heuristic — «when ALL jobs fail in 3-13s with empty steps, check runner_id». Diagnostic playbook, not a rule (can't pre-empt billing failure). Could become CONTRIBUTING.md tip; very low priority. | D | = |
| 14 | `project_wave_sequencing.md` | **D** | Type=project, by nature ephemeral state pointer (Wave 10 after Wave 9). Correct memory type. | D | = |

**Totals (re-counted from table, not trust-prior-numbers):** A = 6, B = 2 (1 coordinated + 1 gated), C = 2, D = 4. Sum = 14. Matches population.

**Adversarial counter-prompt (T-Audit-B):** is any «D» actually a hidden «A»?

- #1 delegation_model — could become a CLAUDE.md «when to delegate» section. But its content is about how the operator's quota worked on a specific day — re-reading it confirms «Art сказал quota достаточно» is framed as user-feedback to the orchestrator, not project policy. Stays D.
- #6 pr_s17_header_level — could become a CLAUDE.md «PR pitfalls» section so fresh sessions learn the H3 requirement without memory access. But mechanism is *already* gating in CI; the memory exists as preference-reminder («I made this mistake again on PR #51»). The mechanism that fails CI is already in repo. Stays D, but a `### Common PR-body pitfalls` section in CLAUDE.md is plausible — low-priority C-class extension at best.
- #13 ci_runner_allocation_diagnostic — could be in CONTRIBUTING.md as «debugging CI» tip. Adding it is harmless but not load-bearing. Stays D.
- #14 project_wave_sequencing — by definition ephemeral state. Cannot be codified meaningfully.

No hidden A's found.

## §3 Prioritization criteria

| Criterion | Weight | Operationalized |
|---|---|---|
| Incident occurred ≥1 time | high | flag in memory body with date |
| Affects fresh AI sessions (not just operator) | high | rule would catch behavior in any AI session, not just this one |
| Mechanism is mechanical (not pure prose discipline) | medium | grep / regex / AST / file-state probe possible |
| No current home in repo | medium | grep across `CLAUDE.md`, `.claude/rules/*`, `agents/*`, workflows returns 0 |
| Cost to codify low (extension > new file > new test) | low (tiebreaker) | adding a section beats adding a new file beats adding a new test |

Ranked A-class candidates by (incident × blast-radius × mechanism-fit):

1. **#11 hook_self_test_pipeline_stubs** — incident occurred (Wave 8.3 regression); 100% mechanical (TS principle test); affects code correctness not just discipline. **Highest mechanical fit.**
2. **#9 no_paid_llm_in_ci** — no incident yet but **load-bearing policy** referenced in 4+ artefacts without canonical home; **highest blast radius**.
3. **#8 s17_scope_vs_path_filter** — incident category (every rule-touching PR); fix is small (PR template edit + maybe rule §1.7 doc note); affects every fresh AI session that opens a PR touching rules.
4. **#3 reviewer_orchestrator_role_separation** — incident occurred (2026-05-07); affects any AI session running `/review` or `/ultrareview`; mechanism is prose-or-grep.
5. **#10 worktrees_for_parallel_subwaves** — incident occurred (Wave 8.1/8.1b 2026-05-12); affects any orchestrator session; mechanism is prose-skill-update.
6. **#5 no_drive_by_prs** — incident PR #33; affects any orchestrator session; mechanism is prose-only.

## §4 Mechanism per A-class candidate (test-interface sketches per T-Audit-C)

### A1 — #11 hook stub completeness → `principles/11-hook-stub-completeness.test.ts`

```typescript
// packages/core/principles/11-hook-stub-completeness.test.ts
import { describe, it, expect } from 'vitest';
import { auditHookStubs } from './11-hook-stub-completeness';

describe('Principle 11 — every hard-fail invocation in .husky/pre-push has a stub in every make_test_repo() block', () => {
  it('positive arm: current state passes', () => {
    const violations = auditHookStubs({
      hookPath: '.husky/pre-push',
      testFiles: ['tests/hooks/prior-art-trailer-hook.test.sh'],
    });
    expect(violations).toEqual([]);
  });

  it('mutation arm: remove pre-push.test.sh stub from make_test_repo → MUST detect', () => {
    const violations = auditHookStubs({
      hookPath: '.husky/pre-push',
      testFiles: ['<mutated fixture without pre-push.test.sh stub>'],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].missingStub).toBe('pre-push.test.sh');
  });
});
```

Detector logic: parse `.husky/pre-push` for `^if \[ -x packages/core/audit-self/(.+\.sh) \]` → build set H. For each test file using `make_test_repo()`, parse the heredoc stub block → build set S. Assert H ⊆ S per test file. Confirmed enumerable: `.husky/pre-push:37-46` has 2 such invocations; `tests/hooks/prior-art-trailer-hook.test.sh:38` has 1 `make_test_repo` definition.

### A2 — #9 no-paid-LLM-in-CI → `.claude/rules/no-paid-llm-in-ci.md` + optional workflow grep

Two-layer:

1. **`.claude/rules/no-paid-llm-in-ci.md`** — top-level project rule with header `Authoritative for: no-paid-LLM-in-CI policy + rationale + escape-hatch process (explicit operator override per session)`. Establishes canonical home.
2. **Optional principle test** — `principles/12-no-paid-llm-in-ci.test.ts` greps `.github/workflows/*.yml` for `anthropic\|openai\|claude.*sdk\|ANTHROPIC_API_KEY` patterns; positive arm passes, mutation arm adds a fake call → fails.

The rule alone closes the «no canonical home» gap. The principle test closes the «AI session could add a workflow that violates the policy without notice» gap. Land in two commits per [§5 placement options](#§5-scope-placement-options).

### A3 — #8 §1.7 scope vs path-filter → PR template edit + phase-research-coverage.md §1.7 note

`.github/pull_request_template.md:46-53` currently shows:

```markdown
### §1.7 Forward-check applied
_TODO: enumerate disciplines checked_

### §1.7 Backward-check applied
_TODO: enumerate sweep performed_
```

The Skipped option lives only in the HTML comment block above. Fresh AI sessions don't read HTML comments as authoritative; they fill in the visible TODOs and produce theatre-shaped bullets for mechanical-maintenance PRs.

**Minimal fix:** replace lines 47-53 with a branching block:

```markdown
### Choose ONE — substantive rule extension OR mechanical maintenance:

**A) Substantive rule extension** — keep these two H3 sections:
### §1.7 Forward-check applied
_TODO_
### §1.7 Backward-check applied
_TODO_

**B) Mechanical maintenance** (file split, cross-ref redirect, list extension, typo) — DELETE A above and use ONE line:
### §1.7 Skipped: <reason ≥60 chars on same line>
```

And extend [`.claude/rules/phase-research-coverage.md §1.7`](../../../.claude/rules/phase-research-coverage.md) with one paragraph distinguishing «protected scope = rule introduction» vs «CI path filter = broad».

### A4 — #3 reviewer/orchestrator role separation → `.claude/rules/reviewer-discipline.md`

New prose rule with explicit `### §3 Anti-patterns` section naming `#role-swap-mid-session`. Auto-loaded via auto-trigger keywords («review», «проверь», «вердикт») in the existing reviewer skill (if one exists in the global `~/.claude/skills/reviewer/`) or in a project-local skill mirror.

Optional mechanical detector: grep reviewer outputs for strategy-imperative phrases («we should», «I recommend the project», «the decision is»), but this requires sub-agent integration (active session checks itself before posting verdict) — defer to companion handoff #7 scope (compliance-verifier extension).

### A5 — #10 worktrees → orchestrator skill update + `.claude/rules/parallel-subwave-isolation.md`

The orchestrator skill at `~/.claude/skills/orchestrator/SKILL.md` (user-scope, not in this repo) already documents Mode B with file-prompts. It does NOT currently mention worktrees. Project-local rule in `.claude/rules/parallel-subwave-isolation.md` is the canonical home; orchestrator skill (when it loads in this repo) reads the project rule.

No mechanical enforcement available — worktree usage is operator-side. Detection of *violation* possible after-the-fact (`git log` shows commits with conflicting branch sources), but pre-emption requires skill-level discipline.

### A6 — #5 no-drive-by-PRs → CLAUDE.md «PR strategy» section OR `.claude/rules/orchestrator-pr-scope.md`

Lightest-touch fix: add a paragraph to `CLAUDE.md` under a new H2 «PR strategy» section. Heavier-touch: dedicated rule file. Maintainer choice — adding to CLAUDE.md keeps the rule surface flat; new rule file matches the existing pattern (`.claude/rules/<scope>-discipline.md`).

Mechanical detection difficult — orchestrator opening a second PR is shared-state-modifying behavior, not artefact state. Skill-level discipline.

## §5 Scope placement options

| Option | What | Argument for | Argument against |
|---|---|---|---|
| **Wave 9.6 micro-batch** | Close A1+A2+A3 (highest-mechanical + highest-blast-radius + smallest-surface) in one PR | Thematic continuity with Wave 9 (`#discipline-theatre` was code surface; this is doc surface). Urgent. Small enough for single Sonnet pass. | A1 (principle 11) is real code work — bigger than Wave 9 «trailing» suggests. |
| **Wave 10 inline** | Fold into TS-core hook migration (#11 becomes part of TS hook refactor) | Natural place where new mechanical gates land. | Wave 10 blocked on Wave 9 M1-M5 + Dn answers per [`project_wave_sequencing.md`](file:///Users/art/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/project_wave_sequencing.md); delays the urgent fixes. |
| **New §13.x umbrella** | E.g. §13.34 «memory-vs-docs codification umbrella»; 6 A-class entries closed over 3-4 waves | Matches scope size (6 candidates × distinct mechanisms). Tracks long-tail. | Heavy ceremony for what's mostly «move 6 things into the right place». |
| **Roll into existing rules** | Extend `.claude/rules/phase-research-coverage.md` + CLAUDE.md sections; minimize new files | Lightest touch. | Some entries (#9 no-paid-LLM, #10 worktrees) don't fit any existing rule's scope. |

**Hybrid (recommended below in §10):** Wave 9.6 closes the 3 highest-priority **plus** establishes the umbrella for the long-tail (#3, #5, #10).

## §6 Memory cleanup policy after codification

Three options:

- **Delete immediately** — once rule lands, remove the memory file. Pro: single source of truth in repo. Con: loses diagnostic trail for *why* the rule exists (incident reconstruction useful for future rule-evolution).
- **Mark «codified at <commit-SHA>»** — keep memory file but add a frontmatter or top-line marker like `> Codified at <SHA> in <file>; this memory now serves as historical diagnostic.`. Pro: preserves trail; cheap. Con: memory still influences my future sessions unless I explicitly ignore «historical» entries.
- **Keep as helper-link** — memory entry trimmed to one line pointing at the repo location: `> Codified — see [.claude/rules/no-paid-llm-in-ci.md](repo-path)`. Pro: memory becomes navigational. Con: requires update each rename.

Recommendation: **option 2 (mark codified)** for the strong candidates that codify, **delete-immediately** for cleanups (e.g. if #6 promotes to «pitfalls section», the personal memory entry becomes redundant). Handle in same commit as the rule landing — atomicity.

## §7 Prior art

context7 queries run (≥3 phrasings per T11):

1. `/anthropics/claude-code`, query «CLAUDE.md vs personal memory — when should project conventions be in CLAUDE.md vs ~/.claude memory or auto-memory» — surfaced the **official scope hierarchy**: `user` scope (`~/.claude/agent-memory/<name>/`) for cross-project learnings; `project` scope (`.claude/agent-memory/<name>/`) for **project-specific shareable-via-version-control**; `local` scope (`.claude/agent-memory-local/`) for project-specific non-committed. Also: «CLAUDE.md files act as persistent, project-specific memory … ideal for sharing team-wide coding standards, project conventions, and common workflows».
2. `/cline/cline`, query «memory bank vs project rules» — surfaced **Cline Memory Bank** as the canonical pattern. Cline's framing: «memory resets completely between sessions … I rely ENTIRELY on my Memory Bank». Memory Bank = **structured committed markdown files** in repo (`projectbrief.md`, `productContext.md`, etc.) **NOT personal agent memory**. Cline FAQ explicitly: «a README file is typically a static overview … the Memory Bank is a dynamic, structured documentation methodology **specifically designed for AI context management**».
3. `/websites/code_claude`, query «when conventions persist in agent memory vs CLAUDE.md — failure mode where personal memory holds project rules that should be committed» — surfaced explicit sub-agent memory scope table (cited above) and «settingSources … project conventions … without repeated instructions in prompts».

**Convergent finding across both Anthropic and Cline:** the project-shareable knowledge layer must be **repo-committed files** (`CLAUDE.md` / `.claude/rules/*` / `.claude/agent-memory/`), not user-scope personal memory. The failure mode «personal memory holds project rule invisible to fresh sessions» is named in both ecosystems' design rationale. **Externally validated** — this audit is not novel discipline, it is alignment with established AI-tooling architecture.

SSOT cross-refs: this maps to `prior-art-evaluations.md` entries on Cline Memory Bank (if present) and Claude Code's three-tier scope hierarchy. Verifying SSOT presence is out of scope for this patch; flag for follow-up.

**Build-vs-reuse verdict:** REUSE — the «codify project conventions in repo, not memory» pattern is established practice; this patch documents application, not invention.

## §8 §1.7 self-application

Does this research patch itself comply with the substance discipline it surfaces?

**Forward-check on substance arm (file:line citations):**

- §2 cites `discipline-self-check.yml:54-64` (awk pattern), `pull_request_template.md:46-53` (TODO visibility), `.husky/pre-push:37-46` (hard-fail invocations), `tests/hooks/prior-art-trailer-hook.test.sh:38` (`make_test_repo` definition).
- §4 A1 mechanism cites the same `.husky/pre-push:37-46` plus the `make_test_repo` surface, both confirmed by `grep` before writing.
- §7 quotes verbatim from context7 query responses, not paraphrased from memory.

**Backward-check on count claims (T15 + companion-incident lesson):**

- «14 entries» — verified by `ls /Users/art/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/` → 14 `.md` files + 1 `MEMORY.md` index. ✓
- «A = 6, B = 2, C = 2, D = 4» — re-counted from the §2 table, not from initial draft estimates. Sum 14 verifies against population. ✓
- «4 disciplines accumulated bottom-up: code → principles → trailers → research» (§1) — R1-R20 (code), principles 01-10 (principles), Phase 8.8 `Prior-art:` trailer (trailers), `phase-research-coverage.md §1.6` (research). Each layer is in-repo and verifiable. ✓
- «context7 returned zero matches for `no.paid\|paid.LLM` in CLAUDE.md/README/rules» (§2 #9 evidence) — re-ran `grep` against current branch state; confirmed. ✓

**Self-application gap candidates (T-Audit-A on this patch):**

- This patch *itself* would be in a future audit if its findings sit untouched for months. Discipline applies recursively. Maintainer must decide §5 scope placement to land in finite time, else this patch becomes the same anti-pattern.
- The patch makes a **new claim**: «hidden conventions in agent memory are a failure mode». If maintainer adopts, candidate principle test territory: «no project-wide convention lives only in `~/.claude/projects/*/memory/`». But mechanical detection requires *external* access to user-scope memory — out of repo scope. Detection lives at session-discipline level, not CI.

## §9 Open questions for maintainer (Q2-Q5)

These need maintainer answers; Q1 (independent re-audit) is the work above.

- **Q2 — Prioritization.** Ranking in §3: #11 → #9 → #8 → #3 → #10 → #5. Accept ranking, or re-order?
- **Q3 — Mechanism per A-class.** §4 sketches A1-A6. Per item: accept sketched mechanism, propose alternative, or defer?
- **Q4 — Scope placement.** §5 four options + hybrid recommendation. Wave 9.6 micro-batch closes top-3 + opens umbrella for long-tail; OR Wave 10 inline; OR new §13.34 umbrella; OR roll into existing rules.
- **Q5 — Memory cleanup policy.** §6 three options. Recommendation: option 2 (mark codified) for strong candidates, delete-immediately for cleanups, atomic with rule landing.

## §10 Recommended next-action

**Hybrid path:**

1. **Open §13.34 umbrella entry** in `open-questions.md` — «memory-to-docs codification umbrella», parking long-tail (#3, #5, #10 plus C-class extensions #2, #4).
2. **Wave 9.6 micro-batch PR** closes top-3 in this order:
   - **#11 hook stub completeness** → `principles/11-hook-stub-completeness.test.ts` + minimal detector — biggest mechanical win, builds confidence in the codification chain.
   - **#9 no-paid-LLM-in-CI** → `.claude/rules/no-paid-llm-in-ci.md` (rule first; principle test deferred to §13.34 or Wave 10).
   - **#8 PR template branching** → `pull_request_template.md` edit + `phase-research-coverage.md §1.7` paragraph.
3. **Memory cleanup atomic with the PR** — codified entries marked per §6 option 2.
4. **Defer (covered by other handoffs / thresholds):**
   - #7 → companion handoff `post-9-pr-body-substance-research.md`.
   - #12 → wait for 3/3 threshold (currently 1/3).

Rationale: Wave 9.6 is small (3 surgical commits), thematically continues `#discipline-theatre` closure, removes the most-load-bearing «hidden convention» entries first. Long-tail goes into the umbrella for paced execution.

## §10.A Audit update — final structure (supersedes §10 above)

This section captures the **post-Q1-Q5 audit outcome** after maintainer dialogue 2026-05-13. Section §10 above is preserved as the pre-audit recommendation; this section reflects 6 pivots reached during the dialogue:

### Pivots from §10

| Item | Pre-audit (§10) | Post-audit (§10.A) | Reason |
|---|---|---|---|
| **Q1 ranking** | #11 → #9 → #8 | **#8 → #11 → #9 → #10 → #5 → #3** | original biased to «implementation pleasure» not «friction frequency» |
| **#11 mechanism** | TS principle test | **bash audit-self.sh** with 3-place migration tracker to TS for Wave 10 | `audit-self/*.sh` pattern established (`pre-push.test.sh`, `audit-ai-docs.test.sh`); Wave 10 migrates `.husky/pre-push` itself, not audit-self meta-tests; bash impl = regression-fixture spec for eventual TS port |
| **#9 mechanism** | `.claude/rules/no-paid-llm-in-ci.md` | **README §What must not break bullet + .claude/rules/ operational expansion** | invariants owned by README per ownership contract; rules subordinate |
| **#8 mechanism** | PR template branching | **invert template default (Skipped visible) + CI Backward substance arm** | info already in template HTML comment; AI fills most-visible TODO; also a CI gap — Forward has substance arm, Backward doesn't |
| **#3, #10 mechanism** | global skill canonical, project pointer | **project rule canonical, global skill = optional personal aid** | conventions live in repo not agent heads; project rule must be self-contained for fresh clones |
| **Q3 wrapper** | 6 atomic PRs | **1 PR with 9 atomic commits** | maintainer preference; no cross-dependencies between items so umbrella vs atomic-PR is style choice |
| **Q4 cleanup** | mark codified at SHA | **trim to one-line pointer, after merge** | preserves operational clarity; trail retained in git history of this patch |

### Final commit plan — single PR «memory-to-docs codification»

| # | Commit | Files touched | §1.7 gate? | Prior-art trailer? |
|---|---|---|---|---|
| 1 | `docs(research-patches): memory-to-docs codification audit (post-Wave-9)` | this file | no (allowlist subject) | `skipped — research patch only` |
| 2 | `docs(readme): add no-paid-LLM-in-CI to invariants list` | `README.md §What must not break` (1 bullet) | no | `skipped — README invariant addition, no new capability` |
| 3 | `feat(claude-rules): no-paid-llm-in-ci operational rule + escape hatch` | `.claude/rules/no-paid-llm-in-ci.md` (new) | **yes** — fires on `.claude/rules/**` | yes — context7 search citing «no-paid-LLM» policy precedents |
| 4 | `feat(pr-template): invert §1.7 default — Skipped marker visible` | `.github/pull_request_template.md` | no (path not in filter) | `skipped — template UX edit, no new capability` |
| 5 | `feat(ci): substance arm on §1.7 Backward-check (parity with Forward)` | `.github/workflows/discipline-self-check.yml` + sanity test | no (workflow file not in path filter) | `skipped — CI extension of existing substance arm, no new capability` |
| 6 | `docs(claude): add PR strategy section — no drive-by PRs outside umbrella` | `CLAUDE.md` (new section) | **yes** — fires on `CLAUDE.md` | `skipped — CLAUDE.md convention addition, no new capability` |
| 7 | `feat(claude-rules): reviewer-discipline (project-canonical)` | `.claude/rules/reviewer-discipline.md` (new) | **yes** | yes — context7 search on reviewer/orchestrator role separation |
| 8 | `feat(claude-rules): parallel-subwave-isolation (project-canonical)` | `.claude/rules/parallel-subwave-isolation.md` (new) | **yes** | yes — context7 search on git worktree parallel agent patterns |
| 9 | `feat(audit-self): hook-stub-completeness bash audit + Wave 10 TS migration note` | `packages/core/audit-self/hook-stub-completeness.test.sh` (new, ~70-85 LOC), `.husky/pre-push` (add §N invocation), `tests/hooks/prior-art-trailer-hook.test.sh` (add stub in `make_test_repo()` — recursive self-application: the very rule being introduced applies to its own introduction) | no (path not in filter) | yes — context7 search on hook self-test stub patterns |

**§1.7 PR body sections required** (PR touches `.claude/rules/**` × 3 + `CLAUDE.md` — substantive rule introductions, NOT Skipped):
- `### §1.7 Forward-check applied` — cite each existing discipline checked, with file:line evidence per discipline
- `### §1.7 Backward-check applied` — enumerate sweep of existing artefacts under new rules' scope, with file:line evidence

### #11 Wave 10 migration tracking — 3 places

When TS-core hook infrastructure lands in Wave 10, port `hook-stub-completeness.test.sh` to `packages/core/principles/11-hook-stub-completeness.test.ts`. Bash impl serves as **regression-fixture spec**: TS port must produce identical violation output on the same fixture.

Tracking placed in:

1. **Top comment of `packages/core/audit-self/hook-stub-completeness.test.sh`** (file-local, discoverable on read).
2. **Wave 10 kickoff** `.claude/orchestrator-prompts/wave-10-hook-architecture/kickoff.md` — bullet in scope (wave-level discoverable).
3. **This research patch §10.A** (audit-trail discoverable).

Three-place tracking is intentional belt-and-suspenders for known migration tasks; open-questions.md entry not added because the migration is **scope-bound to Wave 10**, not awaiting trigger evaluation.

### Memory cleanup — post-merge action

After PR merges to main:

- Trim `feedback_no_paid_llm_in_ci.md` → `See README §What must not break + .claude/rules/no-paid-llm-in-ci.md — codified at <SHA>.`
- Trim `feedback_s17_scope_vs_path_filter.md` → `See pull_request_template.md (Skipped default) + discipline-self-check.yml (Backward substance arm) — codified at <SHA>.`
- Trim `feedback_no_drive_by_prs.md` → `See CLAUDE.md §PR strategy — codified at <SHA>.`
- Trim `feedback_reviewer_orchestrator_role_separation.md` → `See .claude/rules/reviewer-discipline.md — codified at <SHA>.`
- Trim `feedback_worktrees_for_parallel_subwaves.md` → `See .claude/rules/parallel-subwave-isolation.md — codified at <SHA>.`
- Trim `feedback_hook_self_test_pipeline_stubs.md` → `See packages/core/audit-self/hook-stub-completeness.test.sh — codified at <SHA>. TS port tracked in Wave 10 kickoff.`

Diagnostic trail retained in this patch's git history.

### Out of scope for this PR

- **#11 TS principle port** — Wave 10 backlog, tracked in 3 places.
- **#7 PR body counts** — companion handoff `post-9-pr-body-substance-research.md`.
- **#12 preserve-before-destructive** — incident counter 1/3, await threshold per memory's own promotion rule.
- **#2, #4** (soft extensions) — leave in memory until incident or natural opportunity to fold into `phase-research-coverage.md §1.10` extension.
- **Global skill edits** (`~/.claude/skills/reviewer/SKILL.md`, `~/.claude/skills/orchestrator/SKILL.md`) — optional personal aid for maintainer; not part of PR diff. Project rules are self-contained.

## Root Cause (per README.md format)

`#recursive-self-application-gap` (focus-tunnel family, see [`phase-research-coverage.md §4`](../../../.claude/rules/phase-research-coverage.md)) — discipline applied bottom-up to user code, never top-down to AI-session persistence layer. Sibling of `#discipline-application-scope-blindness` sub-case (a) self-commentary lag — agent's own memory is structurally out-of-frame when discipline loads for whatever is «in the codebase at the moment of analysis».

Candidate new tag: **`#convention-in-memory-not-repo`** — specific to the AI-tooling-persistence-layer instance of the above family. Surfaces when an AI session accumulates project-wide constraints in user-scope memory instead of repo-committed files.

## Tags

`#recursive-self-application-gap` `#discipline-application-scope-blindness` `#convention-in-memory-not-repo` (candidate; promote when ≥3 patches accumulate per [§3 aggregation](README.md))
