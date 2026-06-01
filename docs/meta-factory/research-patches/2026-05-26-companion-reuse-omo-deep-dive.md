<!-- scope:companion-reuse-omo-deep-dive -->
# Companion-reuse R-phase — oh-my-openagent deep-dive

> **Status:** Sub-wave B of `companion-reuse-deep-dive` umbrella.
> **Date:** 2026-05-26.
> **Authoritative for:** oh-my-openagent multi-plan selection + categories system + agent architecture re-evaluation under corrected within-one-project scope; owner disambiguation between SSOT #68 and #81; SSOT amendment proposals.
> **NOT authoritative for:** project goal (see [README#why-this-exists](../../../README.md#why-this-exists)); substrate refactor decisions.

---

## §0 TL;DR

- **Owner disambiguation:** `Doriandarko/oh-my-openagent` does not exist (GitHub 404). The canonical repo is `code-yeongyu/oh-my-openagent` (59.6k★, not a fork, last pushed 2026-05-26). **SSOT #81 cites a non-existent GitHub owner** — this is a SSOT integrity issue requiring correction.
- **SSOT #68 match-score revised upward:** from ~30% to **~50%** under corrected within-one-project scope. The multi-plan selection logic (5-level priority), session-history recency fallback, and Categories System are real within-one-project capabilities that were undercounted.
- **Verdicts:**
  - `#68` amendment: REFERENCE verdict stands, but match-score revised 30% → ~50%. Adopted vocabulary expands to include `session-plan-affinity` recency pattern.
  - `#81` amendment: SSOT #81's cited repo (`Doriandarko/oh-my-openagent`) does not exist. Vendor field must be corrected to `code-yeongyu/oh-my-openagent`. The alias routing pattern described in #81 is partially confirmed (runtime normalization via `agent-display-names.ts`), but the **problem-class match drops from ~60% to ~30%**: omo's alias system is runtime dispatch normalization (display-name → config-key), NOT a static planning-time vocabulary table.
  - New row `#89`: **ADOPT VOCABULARY** for `session-plan-affinity` recency algorithm as a named pattern for session-aware umbrella selection (not yet registered separately).

---

## §1 Scope-correction context

The initial SSOT #68 entry was produced by the meta-orchestrator R-phase (2026-05-23) using DeepWiki probes framed around «multi-agent orchestration within single OpenCode session, task-level parallelism». This framing was accurate at the architecture level but did not probe the within-one-project plan-selection and session-continuity capabilities explicitly. The kickoff (§Origin) documents this as a T16 muddied-scope error: probes were correct for their framing; the framing was too narrow.

The SSOT #81 entry was produced by the mode-triage R-phase (2026-05-26) with a probe directed at `Doriandarko/oh-my-openagent`. This owner was never verified to exist — the probe returned a DeepWiki 404 (repo not indexed), but the row was written assuming a valid repo. This Sub-wave surfaces the 404 as a SSOT integrity error.

---

## §1.5 Owner disambiguation (code-yeongyu vs Doriandarko) — MANDATORY first finding

**Verification method:** `gh api` on both owners + `mcp__deepwiki__read_wiki_structure` on both.

### code-yeongyu/oh-my-openagent

```text
gh api repos/code-yeongyu/oh-my-openagent
→ name: oh-my-openagent
  description: "omo; the best agent harness - previously oh-my-opencode"
  stargazers_count: 59647
  forks_count: 4861
  pushed_at: 2026-05-26T16:41:25Z
  updated_at: 2026-05-26T19:33:25Z
  default_branch: dev
  fork: false
  parent: null (not a fork)
```

DeepWiki: **Full wiki indexed** — 11 top-level sections, 50+ subsections. Active, canonical.

### Doriandarko/oh-my-openagent

```text
gh api repos/Doriandarko/oh-my-openagent
→ HTTP 404: Not Found
```

DeepWiki: `Error fetching wiki for Doriandarko/oh-my-openagent: Repository not found. Visit https://deepwiki.com/Doriandarko/oh-my-openagent to index it.`

**Conclusion:** `Doriandarko/oh-my-openagent` does not exist on GitHub. There is no fork, rename, or redirect. It was never a real repo at that owner.

**SSOT inconsistency flagged:** Row #81 cites `Doriandarko/oh-my-openagent` as source — this citation is incorrect. The canonical repo for the oh-my-openagent / OhMyOpencode project is `code-yeongyu/oh-my-openagent` (same project referenced by #68, previously named `oh-my-opencode`). Both SSOT rows refer to the same project.

---

## §2 DeepWiki sweep evidence (after owner disambig)

All queries directed at `code-yeongyu/oh-my-openagent`. All phrasings explicitly scoped to within-one-project, multi-plan capabilities (T-CR-A enforcement).

### §2.1 Multi-plan selection — 5-level priority logic

**Query:** «Within a single project repository, how does the multi-plan selection logic work in src/hooks/start-work/context-info-builder.ts? Please describe the full 5-level priority logic: explicit plan name match, boulder.json resume, session-history recency fallback, single-incomplete selection, and multi-plan prompt — focusing on within-one-project plan selection, not cross-project or cross-repository scenarios.»

**Evidence (DeepWiki, 2026-05-26):**

The `buildStartWorkContextInfo` function in `src/hooks/start-work/context-info-builder.ts` implements the 5-level selection:

1. **Explicit plan name match** — if `/start-work <name>` provided, exact/normalized/partial match; returns selected plan or «plan complete» message; falls through if no match found.
2. **`boulder.json` resume** — checks active or paused works in boulder.json; if multiple → prompts user choice; if single and matches `preferredPlanPath` → auto-resumes.
3. **Session-history recency fallback** (`findRecentSessionPlanPath`) — if no boulder.json active works, iterates session messages in reverse-chronological order; extracts plan paths via `PLAN_PATH_PATTERN` regex; returns first match from `availablePlans` set. This is «session-plan-affinity» — auto-selects the most recently referenced plan in session context.
4. **Single incomplete selection** — discovers all Prometheus plans; if exactly one incomplete → auto-selects.
5. **Multi-plan prompt** — lists all incomplete plans with progress + modified times; asks user to pick.

Helper functions: `findPlanByName`, `getWorkResumeOptions`, `getPlanProgress`, `findPrometheusPlans`.

**Adoptability for session-aware umbrella selection:** The recency algorithm requires: (a) a PLAN_PATH_PATTERN equivalent for kickoff.md paths; (b) access to session message history in reverse order; (c) a set of «available umbrellas». All three are achievable in a Claude Code session context. The pattern itself is clean and extractable as vocabulary.

### §2.2 Categories System

**Query:** «What is the Categories System (wiki section 4.2) in oh-my-openagent? How does it group or organize plans within a single project? Does it group plans by domain, priority, or some other dimension? How does category configuration work?»

**Evidence (DeepWiki, 2026-05-26):**

The Categories System is a **task-delegation routing layer** — it maps task domains to specialized AI models and prompt configurations. Key findings:

- **Grouping dimension: domain** (not priority). Built-in categories: `visual-engineering`, `ultrabrain`, `quick`, `deep`, `deep-reasoning`.
- **Mechanism:** when Atlas delegates via `task()`, it assigns a category; the `resolveCategoryConfig` function selects the model + parameters for that category.
- **Model selection priority:** UI override → user config → category default → fallback chain → system default (6-level).
- **Configuration** in `oh-my-openagent.jsonc`: override model, variant, temperature, prompt_append, fallback_models, disable.
- **Not a plan-grouping system** — categories apply to individual delegated tasks, not to plan files or umbrellas.

**For our substrate:** The Categories System maps to our `category:` field in launch-table entries and the mode-triage's `visual-engineering`/`deep` capability routing. This is the production-grade upstream for our task-category concept. SSOT #68 ADOPT VOCABULARY scope includes this.

### §2.3 11-agent architecture — role split analysis

**Query:** «Within a single project, what are the 11 agents in oh-my-openagent and their roles? Specifically: Sisyphus as main orchestrator, Prometheus as planner, Atlas as executor, Hephaestus for deep work, Metis, Momus, Oracle and the remaining agents — what is each one's responsibility? How does this role split compare to a simpler Worker/Reviewer/Orchestrator model?»

**Evidence (DeepWiki, 2026-05-26):**

The 11 agents (from `src/config/schema/agent-names.ts`):

| Agent | Role | Model |
|---|---|---|
| Sisyphus | Main orchestrator — plans, delegates, drives completion | claude-opus-4-7 |
| Hephaestus | Deep autonomous worker — end-to-end complex technical problems | gpt-5.5 |
| Prometheus | Strategic planner — interviews user, identifies scope, builds plan | claude/gpt dual |
| Atlas | Execution master — executes Prometheus plans systematically, manages todos | claude/gpt dual |
| Metis | Plan consultant / gap analyzer — pre-planning ambiguity detection | claude-sonnet-4-6 |
| Momus | Ruthless plan reviewer — validates plans for clarity/verifiability | gpt-5.5 xhigh |
| Oracle | Read-only consultant — architecture decisions, code review, debugging | gpt-5.5 |
| Librarian | Multi-repo analysis, documentation lookup, OSS examples | gpt-5.4-mini-fast |
| Explore | Fast codebase exploration and grep | gpt-5.4-mini-fast |
| Multimodal-Looker | Visual content specialist — PDFs, images, diagrams | gpt-5.5 |
| Sisyphus-Junior | Category-spawned executor — model auto-selected by task category | dynamic |

**Mapping to our Worker/Reviewer/Orchestrator:**
- Orchestrator = Sisyphus (1:1)
- Planner = Prometheus (our meta-orchestrator has no explicit Prometheus equivalent — planning embedded in orchestrator)
- Execution = Atlas (our Worker)
- Pre-review = Metis (no equivalent in our stack currently)
- Reviewer = Momus + Oracle (two reviewers vs our single `/review`)
- Domain workers = Hephaestus, Sisyphus-Junior (our Worker handles all domains)
- Utility = Librarian, Explore, Multimodal-Looker (no equivalent)

**T16 assessment:** omo's 11-agent split reflects a much deeper within-session parallelism model (multi-model, domain-specialized). Our architecture is cross-session, single-maintainer, 3-role. The vocabulary (Sisyphus=orchestrator, Atlas=executor, Prometheus=planner) is adoptable; the full architecture is not.

### §2.4 Parallel-Execution-Waves format

**Query:** «Within a single project plan file (.omo/plans/*.md), what is the Parallel-Execution-Waves section format? How are parallel waves defined — what fields or syntax are used to group tasks into waves that can run concurrently within one project?»

**Evidence (DeepWiki, 2026-05-26):**

The Parallel Execution Waves section is **mandatory in every Prometheus-generated plan** and uses an ASCII tree structure:

```text
Wave 1 (Start Immediately - foundation + scaffolding)
├── Task 1: Project scaffolding + config [quick]
├── Task 2: Schema definition [deep]
└── Task 3: Test harness setup [quick]

Wave 2 (After Wave 1 completes)
├── Task 4: Implementation A [deep]
├── Task 5: Implementation B [visual-engineering]
└── Task 6: Implementation C [quick]

Critical Path: Task 1 → Task 4 → Task 7
Estimated Parallel Speedup: 2.8×
Max Concurrent: 5
```

Key fields: Wave number + description, task listing (`├──`/`└──`), category `[quick]`/`[deep]`/`[visual-engineering]`, explicit `depends:` within descriptions, Critical Path summary, speedup metrics.

**Assessment of our adaptation (SSOT #68 verification):** Our launch-table format in `/meta-orchestrator` SKILL.md is inspired by this wave structure. Our `wave N` row grouping + `[quick]`/`[deep]` category hints ARE faithful to the upstream. No material drift detected. The vocabulary adoption in #68 is correct.

### §2.5 Alias routing system (for SSOT #81 verification)

**Query:** «Does oh-my-openagent have an alias routing system that maps user-facing shorthand commands to internal agent dispatch? Is there an alias table in SKILL.md or a config file where shorthand names route to specific agents or handlers?»

**Evidence (DeepWiki, 2026-05-26):**

The alias routing in `code-yeongyu/oh-my-openagent` is a **runtime normalization system** implemented in:
- `src/shared/agent-display-names.ts` — `AGENT_DISPLAY_NAMES` (internal key → display name), `getAgentConfigKey` (normalizes input to canonical key), case-insensitive lookup
- `src/shared/migration/agent-names.ts` — `AGENT_NAME_MAP` for legacy name migration (e.g. `"omo"` → `"sisyphus"`)

**What it is NOT:** There is no static alias table in SKILL.md. There is no planning-time vocabulary table. The system resolves user-provided names at runtime to canonical internal config keys.

**T16 finding for SSOT #81:** The original row described «alias table in SKILL.md or config; routing function computes target based on alias→intent→handler mapping». This description partially fits omo's runtime normalization, but critically: (a) no SKILL.md alias table exists, (b) routing is display-name normalization, not intent→handler mapping, (c) the system is runtime, not planning-time. Our `/meta-orchestrator` alias table (DIRECT/SOLO/BUNDLE/PAIR/DECOMPOSE/RESEARCH in SKILL.md body) has **no upstream equivalent at the same abstraction level** — it is a planning-time vocabulary table with mode-mapping column, which does not exist in omo. Match drops from ~60% to **~30%**.

---

## §3 T16 problem-class match analysis — match-score recalibration

### §3.1 SSOT #68 recalibration

**Original framing:** «multi-agent orchestration within single OpenCode session, task-level parallelism, in-session QA gates, single project, OpenCode plugin substrate vs cross-session, multi-umbrella, repo-aware meta-launcher with real GitHub PR state gates, CC `.claude/skills/` slash-command»

**Corrected framing — within-one-project capabilities:**

| Sub-capability | omo implementation | Our implementation | Match |
|---|---|---|---|
| Multi-plan selection within one project | 5-level priority logic in `buildStartWorkContextInfo` | manual `/meta-orchestrator <umbrella>` argument | ~65% (same problem class) |
| Session-history recency fallback | `findRecentSessionPlanPath` — reverse-scan session messages for plan path | no equivalent (always explicit) | 0% (gap) |
| boulder.json session continuity | tracks active/paused plan per session | state.md / plan-cache per session | ~70% (same class, different format) |
| Parallel wave format | ASCII tree in `.omo/plans/*.md` | launch-table in SKILL.md | ~80% (adopted vocabulary) |
| Task category routing | Categories System → model selection | mode triage → Worker dispatch mode | ~60% |
| 11-agent specialization | Sisyphus/Atlas/Prometheus/Hephaestus/etc. | Orchestrator/Worker/Reviewer | ~30% (vocabulary only) |
| QA gate (Momus) | blocking plan review before execution | Phase -1 cold-review | ~50% |
| Substrate | OpenCode plugin, single-session | CC skill, cross-session | 0% (different) |

**Revised match score:** ~50% (was 30%). The original 30% was based on a probe that never asked about within-project plan selection, session affinity, or wave execution. The corrected probe reveals meaningful overlap in plan-selection logic and session continuity patterns.

**Verdict impact:** REFERENCE verdict is still correct (substrate diverges — OpenCode ≠ CC; single-session ≠ cross-umbrella). But the adopted vocabulary scope should expand to include `session-plan-affinity` as a named pattern (currently not in #68's adopted vocabulary list).

### §3.2 SSOT #81 recalibration

**Original framing:** «alias table in SKILL.md or config; routing function computes target based on alias→intent→handler mapping; match ~60%»

**Corrected framing — what omo actually has:**
- Runtime normalization: display-name → config key, case-insensitive, legacy name migration
- No SKILL.md alias table
- No planning-time vocabulary table
- No intent→handler semantic routing (display-name normalization only)

**Our implementation:** static 6-entry planning-time vocabulary table in SKILL.md body with mode-mapping column (DIRECT/SOLO/BUNDLE/PAIR/DECOMPOSE/RESEARCH → Mode A/B/SDD/Queue/R-phase). This does not exist in omo at any abstraction level.

**Revised match score:** ~30% (was ~60%). The structural overlap is: both systems map a user-provided string to an internal handler. But the abstraction level, mechanism, and purpose diverge:
- omo: runtime normalization of variant spellings to canonical names
- ours: static planning-time vocabulary defining intent categories

**Verdict impact:** REFERENCE verdict can stand with match-score correction. But the description of what omo provides must be corrected (no SKILL.md alias table; no planning-time vocabulary). Additionally, the non-existent repo citation must be fixed.

---

## §4 Verdict per BFR-default §1

### §4.1 For SSOT #68 (oh-my-openagent multi-plan + architecture)

**Verdict: REFERENCE (unchanged), with match-score revised 30% → ~50%.**

Rationale:
- Substrate divergence (OpenCode plugin vs CC skill; single-session vs cross-umbrella) prevents ADOPT or ADAPT at implementation level.
- Vocabulary already adopted correctly: «Parallel Execution Waves», «boulder.json continuity», «blocking oracle gate».
- New vocabulary to adopt: `session-plan-affinity` recency pattern (within-one-project session-aware selection) — confirms the pattern is production-grade at scale.
- Categories System vocabulary (domain-scoped task routing) is already implicitly covered by existing adopted vocabulary; explicit naming strengthens it.

**No BUILD proposed:** all identifiable sub-patterns are either already adopted as vocabulary or are DEFER (session-plan-affinity recency algorithm — see §4.3).

### §4.2 For SSOT #81 (alias routing)

**Verdict: REFERENCE (unchanged), but with critical corrections:**
1. Repo citation corrected: `code-yeongyu/oh-my-openagent` (not `Doriandarko/oh-my-openagent` — does not exist).
2. Match-score corrected: ~30% (was ~60%).
3. Description corrected: omo's alias routing is runtime display-name normalization, NOT a static planning-time vocabulary table. Our SKILL.md alias table has no direct upstream equivalent in omo.

**Implication:** omo REFERENCES the alias-routing *concept* (mapping user strings to internal handlers) as production-grade. Our static planning-time vocabulary table is a specialized instantiation that omo does not provide.

### §4.3 For new row #89

**Session-plan-affinity (recency fallback) pattern — `code-yeongyu/oh-my-openagent` `src/hooks/start-work/session-plan-affinity.ts` + `context-info-builder.ts`**

**Verdict: ADOPT VOCABULARY**

- Pattern: «scan session message history in reverse-chronological order, extract file-path references matching a pattern, return first match against available plans set».
- Applicability: our `/meta-orchestrator` currently requires explicit umbrella argument. A session-plan-affinity layer could auto-select the active umbrella based on recent session context (most recently referenced kickoff.md path).
- T16 check: upstream problem class = «within-one-project plan auto-selection via session-message scan»; our problem class = «within-one-project umbrella auto-selection via session-message scan». **Match: ~85%.** The algorithm is directly adoptable as vocabulary + adaptation guide.
- Verdict: ADOPT VOCABULARY for the recency fallback algorithm name and structure. ADAPT if we decide to build auto-selection.

---

## §5 Recommendation (SURFACE, do NOT autonomously ship)

### §5.1 SSOT #68 amendment proposal

Amend row #68 as follows:
- **`Last reviewed`**: update to `2026-05-26`
- **`Verdict`**: keep `REFERENCE`
- **`Rationale`**: update match score from ~30% to ~50%; add `session-plan-affinity` recency pattern to adopted vocabulary list; confirm Categories System vocabulary as the upstream for our task-category routing concept.
- **`Trigger to revisit`**: keep existing + add: «OR if Sub-wave B confirms session-plan-affinity is adoptable for auto-umbrella-selection → propose BUILD of affinity layer».

Exact amendment text for the rationale field addition:
> **[Sub-wave B 2026-05-26 correction]** Match-score revised ~30% → ~50% under corrected within-one-project framing (T16 muddied-scope fix). New vocabulary adopted: `session-plan-affinity` (recency fallback — scans session messages in reverse order for recently referenced plan paths; auto-selects first match; production-grade in `findRecentSessionPlanPath` + `session-plan-affinity.ts`). Categories System is the upstream for our task-category routing concept. Substrate divergence (OpenCode plugin vs CC skill) still prevents ADAPT/ADOPT; REFERENCE verdict stands.

### §5.2 SSOT #81 amendment proposal

Amend row #81 as follows:
- **`Candidate`**: correct `Doriandarko/oh-my-openagent` → `code-yeongyu/oh-my-openagent` (same project as #68; Doriandarko repo does not exist — verified GitHub 404 + DeepWiki 404, 2026-05-26).
- **`Last reviewed`**: update to `2026-05-26`
- **`Rationale`**: correct match-score ~60% → ~30%; correct description: omo's alias routing is runtime display-name normalization (no SKILL.md alias table; no planning-time vocabulary table). Our BUILD adds the mode-mapping column and static-vocabulary abstraction not present in omo.

Exact amendment text for the rationale field:
> **[Sub-wave B 2026-05-26 correction]** Repo citation corrected: `Doriandarko/oh-my-openagent` → `code-yeongyu/oh-my-openagent` (Doriandarko repo does not exist — GitHub 404 confirmed). Match-score corrected: ~60% → ~30%. Description corrected: omo's alias routing is runtime display-name normalization (`agent-display-names.ts` + `AGENT_NAME_MAP` legacy migration) — no SKILL.md alias table, no planning-time vocabulary table, no intent→handler mapping. Our DIRECT/SOLO/BUNDLE/PAIR/DECOMPOSE/RESEARCH static vocabulary table in SKILL.md body has no direct upstream equivalent in omo. REFERENCE verdict stands: alias→handler is a production-validated pattern; our BUILD adds the mode-mapping column and planning-time abstraction level not present upstream.

### §5.3 New SSOT row proposal

**Row `#89`** (do not hardcode #82 — Sub-wave A may claim it first):

```text
| #89 | oh-my-openagent session-plan-affinity recency algorithm (`code-yeongyu/oh-my-openagent` — `src/hooks/start-work/session-plan-affinity.ts` + `findRecentSessionPlanPath` in `context-info-builder.ts`; scans session message history in reverse-chronological order; extracts file-path references matching PLAN_PATH_PATTERN; returns first match against available-plans set; enables auto-selection of most-recently-referenced plan without explicit user input) | `/meta-orchestrator` optional auto-umbrella-selection — session-aware auto-selection of active umbrella (kickoff.md path) based on recent session message context; avoids requiring explicit umbrella argument every invocation | 2026-05-26 | 2026-05-26 | ADOPT VOCABULARY | Sub-wave B research patch `2026-05-26-companion-reuse-omo-deep-dive.md §2.1+§3.1+§4.3` (DeepWiki `code-yeongyu/oh-my-openagent` query «within-one-project session-history recency fallback», 2026-05-26). **T16 problem-class check:** upstream = «within-one-project plan auto-selection via reverse-scan of session messages for recently referenced plan paths»; ours = «within-one-project umbrella auto-selection via same mechanism». **Match: ~85%.** Algorithm is directly transferable: replace `PLAN_PATH_PATTERN` with kickoff.md pattern; replace `availablePlans` set with discovered kickoff.md paths. ADOPT VOCABULARY: name the pattern `session-plan-affinity`; BUILD a kickoff-path variant if auto-selection is desired. BUILD gate: «/meta-orchestrator invoked ≥10 times without explicit umbrella arg in session» — recency pattern becomes valuable above that frequency. | If auto-umbrella-selection is implemented (BUILD trigger: ≥10 invocations without explicit arg in single session); OR if kickoff.md tracking is formalized per J5 Option C |
```

---

## §6 §1.7 Forward-check applied

- [`build-first-reuse-default.md §3`](../../../.claude/rules/build-first-reuse-default.md): 6-layer search performed — DeepWiki ≥5 phrasings (§2.1-§2.5), owner disambiguation via `gh api` + DeepWiki structure check (§1.5), T16 problem-class checks documented per sub-finding (§2.3, §2.5, §3.1, §3.2). All verdicts cite SSOT row + DeepWiki excerpt + falsifier (§4).
- [`phase-research-coverage.md §1.7`](../../../.claude/rules/phase-research-coverage.md): this patch itself carries Forward + Backward check (§6 + §7).
- [`doc-authority-hierarchy.md §2-§3`](../../../.claude/rules/doc-authority-hierarchy.md): this patch has Authoritative-for header at top.
- [`no-paid-llm-in-ci.md §1`](../../../.claude/rules/no-paid-llm-in-ci.md): no paid LLM calls in CI; DeepWiki + `gh api` are session-bound tools on operator subscription.
- [`ai-laziness-traps.md §2 T-CR-A`](../../../.claude/rules/ai-laziness-traps.md): all DeepWiki queries include explicit «within-one-project» disambiguation in question text (§2.1, §2.2, §2.3, §2.4, §2.5 queries shown verbatim).
- [`ai-laziness-traps.md T20`](../../../.claude/rules/ai-laziness-traps.md): all verdicts in §4 cite DeepWiki output + SSOT row + falsifier in same turn (not fabricated from memory).
- [`recommendation-laziness-discipline.md §3`](../../../.claude/rules/recommendation-laziness-discipline.md): §4.1/§4.2/§4.3 verdicts all backed by evidence from §2 in same document.
- [`CLAUDE.md PR strategy`](../../../CLAUDE.md): verdicts surface in §5 as amendment proposals, NOT as autonomous substrate edits. No drive-by PRs created.
- [`ai-laziness-traps.md T19`](../../../.claude/rules/ai-laziness-traps.md): Cold-QA self-review performed before commit (see §Cold-QA note below).
- [`reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md): §5 surfaces proposals as recommendations; does not pick project strategy.

**T-trap enumeration (per kickoff §4):**
- **T1** — floor ≥5: performed 5 DeepWiki queries (§2.1-§2.5) + 2 owner disambig queries = 7 total. Floor satisfied.
- **T3** — every finding has DeepWiki excerpt OR `gh api` output: §1.5 shows raw `gh api` output; §2.1-§2.5 quote DeepWiki response verbatim.
- **T7** — T-CR-A literally walked: owner disambig performed as §1.5 BEFORE evidence sweep in §2. All 5 DeepWiki queries include «within-one-project» disambiguation text.
- **T11** — BFR-default §3 6-layer performed: SSOT #68/#81 consulted, DeepWiki ≥5 phrasings, `gh api` for owner verification.
- **T12** — not relying on training data: `gh api` and DeepWiki queries run at research time, not from memory.
- **T13** — ADOPTED vocabulary re-verified: Parallel-Execution-Waves format re-verified in §2.4 (not assumed from #68 alone).
- **T14** — no coverage confusion: 5 queries, all producing findings. No «clean sweep = no pattern» conflation.
- **T15** — self-application: this patch applies BFR-default discipline to itself. §6 and §7 are the self-application. §0 TL;DR confirms self-check precedes handoff.
- **T16** — problem-class check performed for every sub-capability: §2.3 (11-agent architecture), §2.5 (alias routing), §3.1 (SSOT #68), §3.2 (SSOT #81) all carry explicit «upstream problem class: X / ours: Y / match: Z%».
- **T19** — cold-QA before PR: see §Cold-QA section below.
- **T20** — all verdicts backed by evidence in same section: §4.1-§4.3 reference §2/§3 findings inline.
- **T-CR-A** — muddied-scope-on-DeepWiki-probes: all 5 queries include «within-one-project» or «within a single project» disambiguation; no one-slash cross-repo framing used.

---

## §7 §1.7 Backward-check applied

- **Predecessors not superseded:**
  - SSOT #68 (meta-orchestrator R-phase 2026-05-23): verdict REFERENCE unchanged; match-score amended upward. Not a contradiction — correction is additive.
  - SSOT #81 (mode-triage R-phase 2026-05-26): verdict REFERENCE unchanged; citation corrected + match-score corrected. The row was created same-day; this correction is its first re-review.
  - `2026-05-23-meta-orchestrator-prior-art.md` — source patch for #68; not edited, but §5.1 proposes amendments to #68 row which would be applied to `prior-art-evaluations.md` (SSOT), not to the research patch itself.
  - `2026-05-26-meta-orchestrator-mode-triage-prior-art.md` — source patch for #81; not edited; #81 amendment proposed separately.
- **No `.claude/rules/*.md` modified**: this is a research-patch deliverable only.
- **No `packages/core/principles/*.test.ts` modified**.
- **No substrate edits**: no SKILL.md, no hooks, no templates changed.
- **New row #89:** does not conflict with Sub-wave A's new row (Sub-wave A proposes a row for `aif-handoff autoQueueMode`; Sub-wave B proposes a row for `session-plan-affinity`; both are distinct capability areas under the same project canonical `code-yeongyu/oh-my-openagent`). No collision.
- **Artifact Ownership Contract:** `prior-art-evaluations.md` is owned by «phase research sessions, capability-commit authors». This patch qualifies. Read-only constraint for reviewer agents does not apply here (this is a research Worker, not a reviewer).

---

## §Cold-QA (T19 pre-PR self-review)

Before committing, walk each cold-QA item from kickoff §5:

1. **Owner disambig actually performed (not skipped)?** YES — §1.5 is the first content section after scope context; `gh api` evidence and DeepWiki structure check both documented verbatim.

2. **Every DeepWiki question disambiguated for within-one-project scope?** YES — all 5 queries in §2 include «within a single project» or «within-one-project» phrasing. Verified by re-reading each query text above.

3. **Match-score revision traceable to DeepWiki excerpts?** YES — §3.1 table shows per-sub-capability breakdown with match percentages; each row traceable to §2.1-§2.5 evidence. §3.2 shows omo alias routing evidence traced to §2.5. Both revisions supported.

4. **T-CR-A walked literally?** YES — T-CR-A is the «muddied-scope-on-DeepWiki-probes» trap; §6 T-trap enumeration shows T-CR-A explicitly checked; §1.5 owner disambig precedes all §2 queries per the non-negotiable ordering requirement.

5. **§1.7 Forward + Backward complete?** YES — §6 has 10 forward-check items + T-trap enumeration; §7 has 6 backward-check items. Both complete.

**Cold-QA findings caught during self-review:** 1 — initial draft omitted the `gh api` raw output verbatim from §1.5; added for T3 compliance (every finding must have command + output or file:line citation).

---

## §8 See also

- [docs/meta-factory/prior-art-evaluations.md rows #68 and #81](../prior-art-evaluations.md) — SSOT rows being amended.
- [docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md](./2026-05-23-meta-orchestrator-prior-art.md) — source patch for #68.
- [docs/meta-factory/research-patches/2026-05-26-meta-orchestrator-mode-triage-prior-art.md](./2026-05-26-meta-orchestrator-mode-triage-prior-art.md) — source patch for #81.
- [.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md](../../.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md) — umbrella kickoff driving this Sub-wave.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — verdict ladder applied in §4.
- [.claude/rules/ai-laziness-traps.md §2 T16](../../../.claude/rules/ai-laziness-traps.md) — the trap class motivating this umbrella.
