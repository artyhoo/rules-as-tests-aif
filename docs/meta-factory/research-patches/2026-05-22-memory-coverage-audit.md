<!-- scope:memory-coverage-audit -->
# 2026-05-22 — Memory coverage audit (memory → docs → tests)

> **Authoritative for:** memory-coverage-audit findings 2026-05-22 (coverage matrix + standing-discipline proposal).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists); discipline design — see [.claude/rules/ai-laziness-traps.md](../../../.claude/rules/ai-laziness-traps.md), [.claude/rules/phase-research-coverage.md](../../../.claude/rules/phase-research-coverage.md).

## §1 Origin + scope + pipeline framing (stage 0/1/2)

Memory is the weakest enforcement channel: it lives outside the repo, outside CI, invisible to a fresh session on another machine/harness. A convention living **only** in `~/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/` is exactly the "undocumented convention" the project exists to kill — the author obeys it; nobody else does. This is `#recursive-self-application-gap` at the AI-session-persistence layer.

This audit is the successor and re-sweep of [2026-05-13 memory-to-docs codification audit](2026-05-13-memory-to-docs-codification-audit.md), which closed 6 entries `memory → docs`. Two changes since: (a) new feedback conventions accrued (own-qa, no-human-verification, monitor-ci, reasoned-recommendation, …); (b) even codified entries reached only **stage 1 (prose-rule)**, not **stage 2 (test)** — half of `.claude/rules/*` is Class C/B with no executable artifact.

**Pipeline lens (3 stages):**

| Stage | Meaning |
|---|---|
| **0 — memory-only** | convention lives only in `memory/*.md`; nothing in repo. Worst case — invisible to fresh sessions. |
| **1 — repo prose** | codified in `CLAUDE.md` / `.claude/rules/*` (or global skill), but Class C/B — no executable test. |
| **2 — executable** | enforced by an artefact: principle test / pre-push / edit-time hook / harness deny-list / CI. |

**Hard constraint (carried in, not re-litigated).** Memory is user-scope, outside repo + CI. Verified: `grep -rln "/memory/|agent-memory" .github/ packages/ .husky/ .claude/rules/` → **zero hits** — no repo artefact reads memory, and a CI/principle test physically *cannot*. The only reachable enforcement channels for the memory layer are **(a) write-time discipline**, **(b) session-time / local audit** (script or AI-agnostic sub-agent run in a session with memory access), **(c) periodic re-audit**. This matches [2026-05-13 §8:222](2026-05-13-memory-to-docs-codification-audit.md) ("mechanical detection requires external access to user-scope memory — out of repo scope; detection lives at session-discipline level, not CI") and [no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md).

## §2 Population enumeration (T10)

`ls -1 memory/*.md | grep -v MEMORY.md | wc -l` → **51** files.

| type | count | files |
|---|---|---|
| `feedback` | 30 | all `feedback_*.md` |
| `project` | 20 | all `project_*.md` |
| `reference` | 1 | `reference_skill_when_to_use_field.md` |
| `user` | 0 | — |

(6 `feedback_*` entries use top-level `type: feedback` rather than nested `metadata.type:` — older format; confirmed all `feedback` by reading the raw frontmatter.)

## §3 Convention triage — CONVENTION vs EXEMPT

**CONVENTION = 30** (every `feedback_*` entry — each is durable behavioural guidance applicable to any future session).
**EXEMPT = 21** (20 `project` = ephemeral state; 1 `reference`).

T-Mem-C applied: every `project_*` body was read for a durable imperative hiding inside ephemeral state. **Finding: none orphaned** — each durable imperative inside a `project` entry already traces to a `feedback_*` convention row in §4 (e.g. `project_eot_hook`'s "keep recap in `reason`, `@cc-only-rationale`" → dual-implementation §6 + SDK fact; `project_wave10`'s stale-branch/hook-coupling traps → `orchestrator_verify_state` + `check_inflight`). So the `project` set is correctly EXEMPT-state.

| Exempt entry | type | one-line reason |
|---|---|---|
| project_agent_collision_resolution | state | C-1 resolution DONE (#79/#82); historical |
| project_ask_question_reminder_hook | state | hook shipped #94; convention = `askuserquestion_triggers_reminder` |
| project_audit_tooling_findings | state | 2 open findings = separate tasks |
| project_automerge_staging_plan | state | PLANNED; "click = decision not verification" → `no_human_verification` |
| project_autonomous_self_audit_triggering_evidence | state | append-only incident log for §13.34 (armed trigger lives in open-questions.md) |
| project_claude_p_headless_window | state | dated billing fact |
| project_companion_abc_decisions_closed | state | decisions closed; "don't re-open" → `check_decided_status` |
| project_eot_hook_redesign_approved | state | hook shipped #89; hook-edit conventions → dual-implementation §6 |
| project_gitignored_coordination_doc_drift | state | RESOLVED via Item 2.5 R-phase (ADAPT symlink); impl pending |
| project_goal_framing_narrow_vs_broad | state | resolved — BROAD framing shipped |
| project_history_book_ongoing | state | ongoing in-repo artefact (docs/meta-factory/project-history-book.md) |
| project_instruction_compliance_empirical | state | #97/#98/#99 merged; §13.34 +15pp gate codified in repo |
| project_memory_coverage_audit_kickoff | state | THIS audit's kickoff (self-referential; see §9) |
| project_niche_strategy_roadmap | state | roadmap; ⚠ MEMORY.md notes a stale N6a line |
| project_recommendation_gate_iterative_execution | state | research closed; "don't re-litigate §5" → decided-status |
| project_scope_philosophy_companion_to_aif | state | vision codified in README |
| project_swarm_research_scope_correction | state | scope correction applied to patch |
| project_warn_only_flip_and_ci_backstop | state | #119/#121/#123 merged; edit-perm facts = reference |
| project_wave10_rphase_d3_decision | state | Wave 10 in progress |
| project_worktree_isolation_post_wave_10_promotion | state | promotion-tracker for parallel-subwave-isolation rule |
| reference_skill_when_to_use_field | reference | CC-harness fact (`when_to_use` not `triggers:`); embedded authoring convention codified in *global* ai-docs skill, outside this repo |

## §4 Coverage matrix (30 conventions)

Stage / mechanizability legend: **0/1/2** = pipeline stage; **mech** = deterministically checkable; **cc** = Class-C (needs judgment / named undetectable input); **xt** = exempt-from-test (enforceable only at write-time/session, never a repo test). All stage≥1 artefacts confirmed by file:line; all stage-2 rule-class claims confirmed against actual on-disk artefacts (T16).

| # | Convention (entry) | Stage | Repo artefact (file:line or NONE) | Enforce evidence (what it actually catches — T14) | Mech | Gap → nearest reachable channel |
|---|---|---|---|---|---|---|
| 1 | no `git reset --hard` (`no_git_reset_hard`) | **2** | `.claude/settings.json:20`; global `~/.claude/settings.json:584-585` + PreToolUse hook `:631` | edit-time deny: `git reset .*--hard` → `permissionDecision:deny` | mech | covered |
| 2 | settings.json agent-uncommittable (`settings_json_agent_uncommittable`) | **2** | `.claude/settings.json` deny `Edit/Write(.claude/settings.json)` | self-protecting deny-list; verified recursively (hook blocks the write) | mech | covered (recipe-handoff = xt residue) |
| 3 | harness merge-block + 500-line md gate (`harness_merge_block_and_500line_gate`) | **2** | `~/.claude/hooks/git-safety.sh:58`; `.husky/pre-commit:63-64` | merge allowed only base=`epic/ID-*` (hook fired live on this audit's own command); md >500 → commit fails | mech | covered (both are facts of existing gates) |
| 4 | §1.7 PR-body forward/backward (`pr_s17_authoring_checklist`) | **2** | `.github/workflows/discipline-self-check.yml:29-30` + substance-gate sanity jobs `:135,:178` | CI rejects PR body missing H3 `applied` headers or with 0 file:line citations | mech (CI) | **author pre-flight grep = stage-0 xt** — PR body is GitHub-side, pre-push can't see it; recurred 4× (#58/#69/#105/#111). Local grep is the only earlier mitigation; cannot be a test |
| 5 | AskUserQuestion triggers reminder (`askuserquestion_triggers_reminder`) | **2** | PreToolUse:AskUserQuestion hook (#94), registered in `.claude/settings.json` (maintainer-landed) | deny+`permissionDecisionReason`, 45s loop-guard | mech | covered |
| 6 | hook self-test stub completeness (`hook_self_test_pipeline_stubs`) | **2** | `packages/core/audit-self/hook-stub-completeness.test.sh` (FOUND) | grep-checks hook test invocations have stubs | mech | covered |
| 7 | no drive-by PRs (`no_drive_by_prs`) | **1** | `CLAUDE.md:87` (`## PR strategy`) | prose only — no detector for "drive-by" | cc | could add §13.x; detection = "is this a new shared-state op outside umbrella?" (judgment) → likely permanent cc |
| 8 | no paid LLM in CI (`no_paid_llm_in_ci`) | **1** | `.claude/rules/no-paid-llm-in-ci.md:3` (Class A, "grep mechanism ready, test pending") | rule prose + README invariant; **grep NOT wired** — `grep -rln "ANTHROPIC_API\|OPENAI_API" .github/` finds no guard gate | mech (deferred) | **stage 1→2 gap**: promote the ready grep to a workflow-diff check / principle test on `.github/workflows/*.yml`. This one IS mechanizable and in-repo |
| 9 | reviewer/orchestrator role separation (`reviewer_orchestrator_role_separation`) | **1** | `.claude/rules/reviewer-discipline.md:3` (Class C) | prose only | cc | rule §5 names undetectable input: "detection requires sub-agent integration (active session reads own output before posting verdict)" |
| 10 | worktrees for parallel sub-waves (`worktrees_for_parallel_subwaves`) | **1** | `.claude/rules/parallel-subwave-isolation.md:3` (Class C) | prose only | cc | rule §4 names undetectable input: "post-hoc detection via `git log --graph` requires heuristics; defer until AST-level orchestrator-prompt analysis post-Wave-10" |
| 11 | external docs via context7 (`external_docs_via_context7`) | **1** | global `~/.claude/CLAUDE.md` (Documentation Workflow); `build-first-reuse-default.md §3` tooling caveat | prose only; global scope | cc | global-CLAUDE convention; in-repo enforcement n/a (process habit) |
| 12 | delegation model Path 0/A/B (`delegation_model`) | **1** | global `~/.claude/skills/orchestrator/SKILL.md` (Mode A default flip 2026-05-21) | prose in global skill, outside repo | xt | global-skill territory; out of repo-scope per audit OUT-OF-SCOPE |
| 13 | monitor CI after PR + epic-flow (`monitor_ci_after_pr`) | **1** | global orchestrator skill; epic-merge gate at `~/.claude/hooks/git-safety.sh:58` | epic→main click enforced by hook (stage-2 *part*); "watch to green" = behavioural | cc | the watch-loop is session-behavioural (xt); the merge-gate is already stage-2 |
| 14 | reviewer WebFetch 2nd/3rd pass (`reviewer_webfetch_second_pass_value`) | **1** | `.claude/rules/phase-research-coverage.md §1.10` (type-system over prose) | prose; partial — §1.10 covers type>prose, not the 3-pass mandate | xt | research-process judgment; no test |
| 15 | prior-art re-verify scope (`prior_art_reverify_scope`) | **1** | scopes `build-first-reuse-default.md §3` ("re-search only for CC-internal work") | prose refinement | cc | judgment ("does this touch CC internals?") |
| 16 | check decided-status before recommending (`check_decided_status_before_recommending`) | **0** | NONE | memory only | cc | **codify** → `.claude/rules/`; channel = session-discipline (grep memory + decision docs). xt at enforcement |
| 17 | check in-flight PRs before building (`check_inflight_prs_before_building`) | **0** | NONE | memory only | cc | codify; "scan `gh pr list --state open` for tracked items" — the scan is mechanical, the *trigger* is judgment |
| 18 | CI runner-allocation diagnostic (`ci_runner_allocation_diagnostic`) | **0** | NONE | memory only | xt | diagnostic heuristic, not a rule-to-enforce; codify as troubleshooting doc/skill |
| 19 | claude-code-guide worker-inaccessible (`claude_code_guide_worker_inaccessible`) | **0** | NONE | memory only | xt | CC-harness fact + kickoff-authoring habit (plan D4 fallback) |
| 20 | don't ask when best path clear (`dont_ask_when_best_path_clear`) | **0** | NONE | memory only | cc | codify; pairs with reviewer-discipline §2 + reasoned-recommendation |
| 21 | AI self-verifies, human decides only (`no_human_verification_ai_self_verifies`) | **0** | NONE (entry says codify via research-patch / §13.34 reframe) | memory only | cc | **major** — project-thesis-one-layer-up; codify; widens §13.34. Hard to mechanize directly (it IS the recursive thesis) |
| 22 | verify state before claim (`orchestrator_verify_state_before_claim`) | **0** | NONE | memory only | cc | codify; "re-verify HEAD/closure before ship/negative-existence claim". §13.34-adjacent |
| 23 | own QA cold-review before handoff (`own_qa_before_handoff`) | **0** | NONE | memory only | cc | codify; channel = AI-agnostic `agents/*.md` cold-review run per load-bearing PR (session-time, no CI) |
| 24 | Phase -1 memory sweep (`phase_minus_1_no_memory_inheritance`) | **0** | NONE (promotion: 2+ in 6mo → orchestrator skill) | memory only | mech | the keyword grep is deterministic; "absorb constraints" is judgment. Codify the grep step |
| 25 | preserve before destructive delegation (`preserve_before_destructive_delegation`) | **0** | NONE (counter 1/3 → ai-laziness-traps T17 at 3) | memory only | cc | codify; orchestrator judgment ("future value elsewhere?") |
| 26 | preserve unique residue via skill-context (`preserve_unique_residue_via_skill_context`) | **0** | NONE | memory only | xt | judgment-heavy directive; codify as discipline note |
| 27 | reasoned recommendation default (`reasoned_recommendation_default`) | **0** | NONE (recommendation-gate research H10 explores) | memory only | cc | codify; detector recall ~0.43 (per #97) → mechanization blocked until detector fixed |
| 28 | verify diff direction before "live" claim (`verify_diff_direction_before_live_claim`) | **0** | NONE | memory only | cc | codify; per-file content-probe is mechanical, invocation is judgment |
| 29 | worktree node_modules symlink (`worktree_node_modules_symlink`) | **0** | NONE | memory only | mech | codify as orchestrator setup step / script; dev-env convenience |
| 30 | AI-doc research priority pool (`ai_doc_research_priority_pool`) | **0** | NONE | memory only | xt | research-source guidance; codify into phase-research-coverage / AI-doc research doc |

## §5 Gap summary

- **By stage:** stage-0 (memory-only) = **15**; stage-1 (prose, no test) = **9**; stage-2 (executable) = **6**.
- **By mechanizability:** mechanical-available = **8** (mostly already stage-2, plus #8 no-paid-llm grep + #24 grep + #29 script that are *codifiable* further); class-C = **15**; exempt-from-test = **7**.
- **Headline:** half the corpus (15/30) is **stage 0** — pure memory, the worst case the project exists to prevent. Only 6/30 reach stage 2, and 3 of those (`no_git_reset_hard`, `settings_json`, `harness_merge_block`) are *facts of pre-existing harness gates the memory merely documents*, not conventions the project promoted memory→test.
- **One clean stage-1→2 win available in-repo:** #8 `no-paid-llm-in-ci` — its "grep mechanism ready" (rule header) is unwired; promoting it to a workflow-diff/principle check is mechanical and in-scope (does not touch user-memory). Every other gap's nearest channel is write-time/session, per §1 constraint.
- **T16 finding (stale rule headers):** `build-first-reuse-default.md:3`, `ai-laziness-traps.md:3`, `phase-research-coverage.md:12` all say "companion principle test **pending**", but `packages/core/principles/11/12/13-*.test.ts` **exist on disk and run** (11 = capability-commit Prior-art trailers; 12 = kickoff cites ai-laziness-traps + T-enumeration; 13 = post-cutoff patches carry §1.7 self-review). The headers are stale — those rules are Class A *with shipped tests*. Surfaced as DECISION-NEEDED-5.

## §6 Standing-discipline proposal (write-time + local-audit + re-audit)

**Prior-art (T11 — REUSE, not invention).** Per [2026-05-13 §7:200](2026-05-13-memory-to-docs-codification-audit.md): "codify project conventions in repo, not memory" is **externally validated** — Claude Code's own scope hierarchy (project-shareable knowledge → version-controlled files, not user-scope memory) + Cline Memory Bank (structured *committed* markdown, "README is static, Memory Bank is dynamic AI-context methodology"). Build-vs-reuse verdict there = **REUSE**. This proposal *applies* that pattern; the only BUILD is a thin project-specific local-audit grep, since no upstream tool audits *user-scope agent memory for un-codified conventions* (that surface is project-specific by construction — [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) BUILD-after-confirmed-gap).

Three coordinated mechanisms, all respecting the §1 constraint (memory outside CI → no CI-test):

**(1) Write-time rule — `.claude/rules/memory-codification.md` (new).** When a session is about to write a *durable convention* to memory: in the same step, codify it in the repo (`CLAUDE.md` / `.claude/rules/*`) and reduce the memory entry to a one-line pointer — `See <repo-path> — codified at <SHA>` (2026-05-13 §6 option 2/3). Durable convention = behavioural rule applicable to *any future session* (not ephemeral state, not identity, not a reference fact). Header carries Class + Authoritative-for per [doc-authority-hierarchy.md §2-§3](../../../.claude/rules/doc-authority-hierarchy.md).

**(2) Local-audit artefact (deterministic, session/local — NOT CI).** A grep that flags convention-shaped `feedback_*` entries lacking a pointer line. Sketch (≤20 LOC; *not implemented here* — T5):

```bash
# Run in a session with memory access; flags durable conventions not yet codified.
MEM=~/.claude/projects/-Users-art-code-rules-as-tests-aif/memory
for f in "$MEM"/feedback_*.md; do
  grep -qiE 'codified at|See \.claude/rules|See CLAUDE\.md|→ \.claude/rules' "$f" && continue
  # "How to apply" = behavioural-rule shape; absence of a pointer = candidate gap
  grep -qiE 'how to apply|how to apply:' "$f" && echo "UNCODIFIED: $(basename "$f")"
done
```

Heuristic only (false-positives expected — judgment confirms each hit). Complement/alternative: AI-agnostic `agents/memory-codification-auditor.md` (pattern = [agents/compliance-verifier.md](../../../agents/compliance-verifier.md)), read by an active session — no paid LLM, per [no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md).

**(3) Periodic re-audit.** Re-run this kickoff as a repeatable sweep, cadence ~every N waves — parallel to the trigger-sweep in [phase-research-coverage.md §1.6](../../../.claude/rules/phase-research-coverage.md) ("push-based sweep complements pull-based recording — armed-but-not-fired items sit indefinitely without it"). The memory-codification gap is exactly that shape: stage-0 conventions sit indefinitely unless a sweep pushes them up.

## §7 §1.7 Forward-check applied

The proposed standing discipline complies with every active layer:

- **no-paid-llm-in-ci** ([no-paid-llm-in-ci.md:1](../../../.claude/rules/no-paid-llm-in-ci.md)): mechanisms are write-time + local grep + session-read sub-agent — zero API-billed calls, zero CI-LLM. Satisfied.
- **build-first-reuse-default** ([build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md)): prior-art cited (§6 — 2026-05-13 §7 REUSE verdict, Cline Memory Bank + CC scope hierarchy); the lone BUILD (local-audit grep) is justified by confirmed absence of an upstream user-memory auditor.
- **doc-authority-hierarchy** ([doc-authority-hierarchy.md §2](../../../.claude/rules/doc-authority-hierarchy.md)): new rule `memory-codification.md` is a `.claude/rules/*` file → must carry Class + Authoritative-for header; this patch carries one (top).
- **dual-implementation-discipline** ([dual-implementation-discipline.md §5](../../../.claude/rules/dual-implementation-discipline.md)): IF both a bash local-audit script and `agents/memory-codification-auditor.md` ship, they form a dual-pair → require `@dual-pair: memory-codification` anchor in both. Flagged for the impl PR (not built here).
- **ai-laziness-traps** ([ai-laziness-traps.md §3](../../../.claude/rules/ai-laziness-traps.md)): the re-audit kickoff cites the rule + enumerates T-numbers (this audit's kickoff did: T3/T5/T10/T11/T14/T15/T16 + T-Mem-A/B/C). Principle 12 (`packages/core/principles/12-ai-laziness-traps.test.ts`) mechanically enforces that on `kickoff.md` files.

## §8 §1.7 Backward-check applied

`grep -rln "memory.*codif\|codification.*memory\|only.*in.*memory\|user-scope memory" docs/ .claude/rules/` → 7 hits; the load-bearing prior is [2026-05-13-memory-to-docs-codification-audit.md](2026-05-13-memory-to-docs-codification-audit.md).

**Relationship: this audit EXTENDS / SUPERSEDES-IN-SCOPE the 2026-05-13 audit, does NOT duplicate it.**
- 2026-05-13 did `memory → docs` for **6** entries (14-file corpus then) and produced the codification PR + cleanup policy.
- This audit does the stricter `memory → docs → tests` sweep over **all 51** current files, distinguishing stage 1 (prose) from stage 2 (test) — a distinction 2026-05-13 did not draw.
- 2026-05-13 §8:222 already *named* the candidate principle ("no project-wide convention lives only in memory") and the out-of-repo constraint, but left the standing discipline open. This audit operationalizes it (§6) and supplies the full coverage matrix (§4). No finding is re-derived as novel; the constraint is inherited (§1).

## §9 Self-application (T15)

Not N/A — three concrete findings:

- **(a) This artefact is in the repo, not memory.** The patch lives at `docs/meta-factory/research-patches/2026-05-22-memory-coverage-audit.md` — it self-complies with its own thesis ("don't leave conventions in memory"). Had it been a memory note, it would be its own stage-0 violation.
- **(b) The proposed rule would have caught the gap that motivated it** (§1.7 self-reflexive trigger). Run against today's state, the §6 write-time rule + local-audit grep flags all 15 stage-0 rows in §4 — i.e. it fires on exactly the corpus that prompted the audit. The rule passes itself.
- **(c) Recursive instance:** `project_memory_coverage_audit_kickoff.md` is *itself* a stage-0 memory entry stating a project convention (the 3-stage lens + hard constraint). Per the proposed rule, once this patch lands, that kickoff entry should be reduced to a pointer to this file. The audit's own kickoff is subject to the discipline the audit proposes — and **if this patch sits un-actioned for months it becomes the same anti-pattern**, exactly as 2026-05-13 §8 warned of itself.

## §10 DECISIONS-NEEDED (surface, not decided — reviewer-discipline §2)

- **DN-1 — Rule home.** New `.claude/rules/memory-codification.md` *vs* extend `CLAUDE.md` memory-instructions *vs* the harness/global memory-instructions block. Option A → discoverable, owns its scope, but is one more rule file. Option B → lighter, but buries it in CLAUDE.md. Option C → closest to where memory-writes are actually instructed, but global/out-of-repo (can't be version-controlled per-project). Shared-state + scope-expansion → maintainer.
- **DN-2 — Class of the new rule.** Class B (ship the §6(2) local-audit grep as the compensating mechanism now) *vs* Class C (prose-only, promote on violation evidence). B → has a real mechanism but adds a script to maintain; C → matches peer rules (reviewer-discipline, parallel-subwave) and defers build.
- **DN-3 — Memory cleanup policy** (3 options from [2026-05-13 §6](2026-05-13-memory-to-docs-codification-audit.md)): delete-immediately / mark-`codified at <SHA>` / one-line-pointer. 2026-05-13 chose "mark codified for strong candidates, delete for cleanups, atomic with rule landing". Re-confirm or revise. *Out of this audit's scope to execute — post-merge action.*
- **DN-4 — Scope-placement / priority of closing the 15 stage-0 gaps.** New §13.x umbrella *vs* fold into existing waves *vs* batch-codify in one PR. Constraint: `open-questions.md` is at 496/500-line pre-commit cap (per `project_automerge_staging_plan`) — a new §13.x needs an archive-to-`closed-questions.md` first, or a dedicated tracker doc.
- **DN-5 — Stale rule headers (T16, §5).** `build-first-reuse-default.md:3` / `ai-laziness-traps.md:3` / `phase-research-coverage.md:12` say "test pending" but principle tests 11/12/13 exist and run. Fix the headers to "shipped at `packages/core/principles/NN-*.test.ts`"? Trivial doc edit but touches maintainer-owned rule files → handoff.
- **DN-6 — #8 no-paid-llm grep promotion.** The one clean stage-1→2 win in-repo: wire the "ready grep" into a workflow-diff check / principle test. Do it as part of gap-closure, or leave the rule Class-A-with-pending-test? (Mechanizable, in-scope, no user-memory dependency.)

---

*Method note: matrix verified per T3 (file:line or command-output for every stage≥1 / stage-2 claim), T14 (enforce-evidence column distinguishes "artefact exists" from "convention enforced"), T16 (rule-class claims checked against on-disk tests, surfacing the stale-header finding). No source files edited (T5) — output is this patch only.*
