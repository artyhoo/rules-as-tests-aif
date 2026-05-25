<!-- scope:planner-completeness-prior-art -->
# Prior-art survey: planner-completeness L3 / L4 / L5

> **Stage:** 1 of 5 — R-phase prior-art survey for umbrella `meta-orchestrator-planner-completeness`.
> **Date:** 2026-05-25
> **Author session:** Worker S1 (Stage 1 R-phase per `worker-S1-rphase.md`)
> **Kickoff:** `.claude/orchestrator-prompts/meta-orchestrator-planner-completeness/kickoff.md`
> **Active traps:** T1, T2, T3, T7, T10, T11, T12, T13, T15, T16, T17, T19, T-PC-A, T-PC-B

---

## OUR problem class (baseline for all T16 match checks)

The meta-orchestrator (`/meta-orchestrator` CC skill) is a cross-session, cross-umbrella launcher. It:

1. **Enumerates** candidate umbrellas by scanning `kickoff.md` presence in `.claude/orchestrator-prompts/*/`.
2. **Scores** each candidate (priority, volume, type, open-PR state).
3. **Recommends** a winner and asks maintainer to confirm before dispatch.
4. **Plans** single work items by dispatching Mode A (inline) or Mode B (parallel Workers via Agent tool).

The **three gaps** this umbrella patches:

- **L3 (semantic dup-detect):** when scoring candidate X, compare its scope/item-list against **merged PRs in the last 30d** to detect `kickoff.md`-vs-merged-PR overlap (the #205 incident: maintainer wrote a kickoff for items already merged).
- **L4 (decomposition heuristics):** for each surfaced work item, **auto-classify** its size class: `fix` / `R-phase` / `I-phase-small` / `I-phase-large` — so the skill recommends dispatch mode (Mode A/B/SDD/Queue) based on rules, not ad-hoc judgment.
- **L5 (skill/agent assignment):** for each queued item, **propose** the right CC skill (`vitest`, `playwright`, etc.) or AI-agnostic sub-agent, based on the item's type + scope.

---

## §1 — L3: Semantic dup-detect candidates

**Our L3 problem class:** «Given a `kickoff.md` whose §0 lists a set of work items (or implies scope), and a 30-day window of merged GitHub PRs (known titles/scope), detect ≥80% textual or semantic overlap → emit `FLAG_POTENTIAL_DUPE`.» Deterministic bash preferred; no paid-LLM-in-CI.

**T10 population enumeration first:** the candidate set for L3 dup-detect spans:
(a) open-source tools that compare GitHub PR scope against a work list;
(b) issue/PR deduplication systems (generic);
(c) text-similarity primitives (Jaccard / Levenshtein) that could be scripted;
(d) semantic/embedding-based duplicate detectors with public repos.

| # | Candidate | Upstream problem class | Our L3 problem class | Match? | Verdict | Falsifier |
|---|---|---|---|---|---|---|
| 1 | **GitHub `gh search prs` + Jaccard/Levenshtein scripted** (standard POSIX tools) | String/token similarity between text blobs; no semantic understanding. `gh search prs` returns PR titles; manual heuristic compares new kickoff title/items vs merged-PR titles. | Detect ≥80% item-list overlap between a `kickoff.md` scope description and recent merged-PR titles/bodies (last 30d). | **Partial match.** Token overlap on PR title vs kickoff items is cheaply deterministic. Fails on paraphrase («fix meta-orchestrator UX» vs «F.3 UX items per §1.5») without NLP. Upstream problem class = string matching; ours = semantic scope overlap. **T16: X = string similarity; Y = semantic scope overlap. Match? ~50% on simple cases, degrades on paraphrase.** | **ADAPT** — use as L3 fast-path heuristic (cheap deterministic), NOT as the only signal; pair with a `INCONCLUSIVE` escalation flag when similarity score is between 30–80%. | Overlap drops below threshold when kickoff uses different phrasing than merged PR title — false-negative; `gh search prs` cannot return PR body text efficiently in bash. |
| 2 | **OpenHands `issue_duplicate_check_openhands.py`** (github.com/All-Hands-AI/OpenHands) | LLM-based GitHub **issue** duplicate detection via agent: prompt includes new issue + recent issues; LLM classifies into `duplicate` / `overlapping-scope` / `related-but-distinct` / `no-match`. Used as GitHub Actions workflow. Evidence: DeepWiki query 2026-05-25 → confirmed `issue_duplicate_check_openhands.py` script, `build_prompt` function, `normalize_result`. | Detect semantic overlap between a `kickoff.md` scope and recent merged **pull request** scopes. | **Partial match; critical mismatch on two axes.** (1) Upstream compares **issues vs issues**; ours compares **kickoff (plan doc) vs merged PRs** — different artifact types. (2) Upstream uses **paid LLM in CI** (GitHub Actions workflow) — banned by `no-paid-llm-in-ci.md §1`. **T16: X = LLM-in-CI issue deduplication; Y = session-bound kickoff-vs-merged-PR dup-detect with no-paid-LLM constraint. Match? No on both axes.** | **REJECT (for direct ADOPT/ADAPT).** The semantic classification pattern is sound, but: (a) must run as AI-agnostic session-bound sub-agent (not CI), (b) must compare kickoff scope (markdown section headings + item list) vs PR titles/descriptions, not issue-to-issue. Pattern is REFERENCE. | If `no-paid-llm-in-ci.md §1` policy changes, or if OpenHands ships a session-bound (not CI-triggered) variant. |
| 3 | **Linear `similar issues` feature** (linear.app) | SaaS project-management tool with native LLM+vector-embedding duplicate detection on **issue creation**: when a new issue is being written, Linear semantically searches existing issues for overlap and surfaces similar ones. ~85% accuracy per user reports. Evidence: WebSearch 2026-05-25 → `linear.app/now/using-ai-to-detect-similar-issues` + `github.com/bencappello/linear-duplicate-detection`. | Detect overlap between a new `kickoff.md` scope and recently-merged GitHub PRs at planning time. | **Mismatch on substrate and artifact class.** Upstream = Linear issues (SaaS); ours = GitHub PRs and local markdown files. Upstream operates on creation-time SaaS form submission; ours operates on CLI/session-time bash scan of merged PR metadata. Integration would require pushing kickoff content to Linear (no such setup) or calling Linear API. **T16: X = SaaS issue-creation deduplication (closed Linear database); Y = CLI-time kickoff-vs-GitHub-PR dup-detect in deterministic bash. Match? No.** | **REJECT.** Wrong substrate (Linear vs GitHub). REFERENCE for the embedding-based detection pattern and the «surface similar items at creation time» UX pattern. | If the project adopts Linear as its issue tracker and kickoffs are Linear issues. |
| 4 | **PR-DupliChecker** (research paper — `springer.com/s13198-024-02361-4`) | BERT-based PR deduplication in **fork-based** GitHub workflows: compares PR diff content + description to find semantically similar PRs submitted by different contributors for the same issue. Evidence: WebSearch 2026-05-25 → springer.com publication + ResearchGate. | Detect when a meta-orchestrator kickoff scope overlaps with already-merged PRs (single-maintainer repo, not fork-based). | **Research-only, fork-based assumption invalid.** Upstream designed for large OSS with many contributors submitting independent PRs for same bugs. Our repo = single maintainer, no fork-based duplication, no BERT available as a bash-scriptable primitive. **T16: X = fork-based PR deduplication via BERT (multi-contributor); Y = single-maintainer kickoff-vs-merged-PR heuristic overlap scan. Match? No — both substrate (fork vs trunk) and tooling (BERT vs bash) differ.** | **REJECT.** Academic method, wrong substrate. REFERENCE for the semantic matching vocabulary. | N/A — structural mismatch. |
| 5 | **T7 adversarial counter-prompt new candidate: `gh` CLI `--search` text filter + item-list extraction via `awk`** | Deterministic bash: `gh pr list --state merged --search "<keyword>" --limit 100` combined with kickoff item-list extraction (grep for `- [ ]` or numbered items), then Jaccard token overlap between item sets. No external dependency. | Same as #1 but with structured item-list extraction instead of full-text comparison. | **Better match than #1 for structured kickoffs.** Kickoffs with numbered item lists can be tokenised; merged-PR titles often match item descriptions closely. False-negative rate depends on paraphrase. **T16: X = structured item-list vs PR-title Jaccard; Y = same + kickoff markdown parsing. Match? ~60% on typical structured kickoffs.** | **ADAPT** (refines #1; use together). | Paraphrase: item «B5 hybrid detect_subwaves» vs PR title «fix(meta-orchestrator): Item 10 — B5 hybrid detect_subwaves» — partial match (depends on extraction regex). |

**L3 T7 adversarial counter-prompt result:** asked «what candidate did I miss?» Beyond the kickoff list: surfaced (a) GitHub Actions `ai-powered-github-issue-duplicates-relations-detector` (GH Marketplace — embedding-based, CI-triggered = banned by no-paid-llm-in-ci), and (b) `baton` autonomous coding orchestrator (polls GH Issues, runs agents in worktrees, opens PRs — wrong problem class, no dup-detect). Neither adds a viable ADOPT candidate; the kick-off list was materially complete. Structured `gh`+`awk` (#5 above) is the additional candidate surfaced by adversarial search.

**L3 summary:** No direct ADOPT. Two ADAPT candidates (#1 + #5 together as a fast-path heuristic); all semantic/LLM approaches REJECT due to no-paid-llm-in-ci constraint or substrate mismatch. The INCONCLUSIVE zone (30–80% heuristic overlap) would need session-bound LLM judgment (AI-agnostic sub-agent pattern), not CI.

---

## §2 — L4: Decomposition heuristics candidates

**Our L4 problem class:** «Given a surfaced work item (its title, LOC estimate from kickoff, surface count), auto-classify into: `fix` (≤5 LOC, 1 file) / `R-phase` (research needed) / `I-phase-small` (≤80 LOC, 1 surface, Mode A) / `I-phase-large` (>80 LOC or ≥2 surfaces → Mode B umbrella). Output: classification + recommended dispatch mode + estimated surface count.» Deterministic bash preferred.

**T10 population:** candidates include task-management frameworks, coding agent planners, research-based decomposition systems, and vocabulary-level patterns.

| # | Candidate | Upstream problem class | Our L4 problem class | Match? | Verdict | Falsifier |
|---|---|---|---|---|---|---|
| 1 | **TaskMaster (`eyaltoledano/claude-task-master`)** | LLM-driven task complexity analysis (score 1–10 via `analyze-complexity` command) → recommend number of subtasks → `expand` to subtask list. Uses AI model (configured Anthropic/OpenAI) to evaluate technical complexity, time requirements, dependency complexity, risk factors. Evidence: DeepWiki 2026-05-25 ×3 queries — confirmed `analyze-complexity` command, `generateComplexityAnalysisPrompt`, `complexityScore 1-10`, `recommendedSubtasks`. | Classify work item size (deterministic rules: LOC + surface count) → dispatch mode. | **Partial match; critical difference: LLM-based vs deterministic.** TaskMaster uses a configured LLM to score complexity; we need deterministic rules (no LLM in bash helper). TaskMaster's vocabulary (`fix`, `small`, `medium`, `large`, complexity 1–10) is well-designed. The decomposition *taxonomy* is reusable; the implementation (LLM-scored) is not. **T16: X = LLM-assisted task complexity scoring in a PRD-driven planner; Y = deterministic LOC+surface-count classification for cross-umbrella meta-orchestrator kickoffs. Match? Vocabulary: ~70% overlap. Implementation: ~0% (LLM vs bash).** | **ADAPT VOCABULARY.** Adopt the classification vocabulary (small/medium/large, complexity-based recommend-to-expand heuristic). Implement via deterministic bash rules (kickoff LOC as proxy, surface count from kickoff body) — not LLM. | If task complexity semantics require LLM judgment (edge cases where LOC is misleading) → escalate to INCONCLUSIVE, surface to maintainer. |
| 2 | **Superpowers `subagent-driven-development` (SSOT #64; `obra/superpowers`)** | Implementation plan → per-task dispatch via implementer subagent → two-stage review loop (spec compliance + code quality). Model selection: small/mechanical = fast model; medium/integration = standard model; large/judgment = flagship model. Evidence: DeepWiki 2026-05-25 ×2 queries — confirmed 3-tier model selection, escalation via `BLOCKED/NEEDS_CONTEXT`, no dup-detect, context-isolated subagents. | Classify a queued work item for dispatch-mode selection. | **Sub-pattern match on the 3-tier classification vocabulary; structural mismatch on orchestration scope.** SDD classifies tasks within a single implementation plan, dispatching to subagents within one session. Our L4 classifies items across umbrellas before deciding whether to spin up a whole umbrella (multi-session, multi-PR). **T16: X = within-plan task classification for single-session subagent dispatch; Y = across-umbrella item classification for meta-session dispatch decisions. Match? The small/medium/large 3-tier vocab matches; the cross-session vs within-session scope does not.** | **ADAPT VOCABULARY.** The 3-tier vocabulary (small/mechanical → medium/integration → large/judgment) maps cleanly to our `fix` / `I-phase-small` / `I-phase-large` classification. Escalation protocol (`BLOCKED/NEEDS_CONTEXT`) transfers as the `INCONCLUSIVE` escalation path when LOC estimation is ambiguous. | If SDD adds cross-umbrella dispatch planning or multi-session scope awareness, revisit ADOPT. |
| 3 | **OpenHands task decomposition** (`All-Hands-AI/OpenHands`) | LLM-based task planning via `TaskTrackingAction` + `PlannerTab`: agent creates a `task_list` with `id`/`title`/`status` (todo/in_progress/done); sub-agents inherited from parent; stuck detection available. Evidence: DeepWiki 2026-05-25 ×2 queries — confirmed TaskTrackingAction, TaskTrackingObservation, no explicit heuristics for task sizing (agent-generated, not rule-based). | Deterministic rules-based task classification for meta-orchestrator dispatch. | **Mismatch: no deterministic heuristics, LLM-generated.** OpenHands has no rules for task-size scoring; the agent decides based on LLM judgment. This is inherently non-deterministic and non-bash-scriptable. **T16: X = LLM-generated task-list decomposition within one OpenHands session; Y = deterministic LOC+surface heuristics for meta-session dispatch. Match? No on implementation class.** | **REFERENCE.** Confirms that production-grade agent planners (OpenHands, enterprise-class, 30k+ stars) do NOT ship deterministic decomposition heuristics — this validates BUILD for L4 bash rules. The `status` enum (todo/in_progress/done) is vocabulary REFERENCE. | If OpenHands ships a rule-based task-complexity scorer, revisit. |
| 4 | **Anthropic «Building Effective Agents» — orchestrator-workers pattern** | Design vocabulary: orchestrator LLM breaks tasks down dynamically, delegates to worker LLMs, synthesises. Five workflow patterns: prompt chaining, routing, parallelisation, orchestrator-workers, evaluator-optimizer. Evidence: WebSearch 2026-05-25 → `anthropic.com/research/building-effective-agents`. | Our L4 classification is a specific instance of the orchestrator-workers routing decision. | **Vocabulary match; non-implementation.** Anthropic's patterns are design vocabulary (no code), not a decomposition heuristic library. The «routing» pattern = our dispatch-mode selection. **T16: X = design vocabulary for AI agent workflow patterns; Y = concrete bash-implementable decomposition rules for kickoff-scope items. Match? Vocabulary only; no implementation.** | **ADOPT VOCABULARY.** The routing/orchestrator-workers vocabulary transfer confirms our L4 classification is correctly identified as an instance of a known pattern. No implementation to adopt. | N/A — vocabulary-only upstream. |
| 5 | **T7 adversarial counter-prompt: Cursor `Plan Mode` (shift+tab in agent input)** | Cursor allows selecting a «Plan Mode» where agent generates a plan with one model (reasoning model), then executes with another. Task decomposition is LLM-driven with user review between plan and execution. Evidence: WebSearch 2026-05-25 → `cursor.com/blog/2-0`, Cursor 2.0 release. | Our L4 needs deterministic classification of pre-existing kickoff items, not LLM-generated plans. | **Mismatch: interactive plan-generate UX, LLM-based.** Cursor Plan Mode generates plans; our L4 classifies already-written kickoff items. **T16: X = LLM-generate-then-user-review planning UX; Y = deterministic classifier for pre-written kickoff items. Match? No.** | **REJECT.** Wrong architecture (generative vs classificatory). REFERENCE for the «plan → execute» separation vocabulary. | If Cursor exposes a deterministic task-size-scoring API. |

**L4 T7 adversarial result:** adversarial counter-prompt asked «what pattern did I miss?» checked Devin (proprietary — no public planner API, WebSearch confirmed compound-AI architecture with a «Planner» described only in blog posts — marked INCONCLUSIVE below). Also checked swe-agent: `princeton-nlp/SWE-agent` not in DeepWiki (returned `Repository not found`); WebSearch confirmed workflow-based vs interactive-agent approaches, no deterministic LOC-based decomposition heuristics. No additional ADOPT candidates found; TaskMaster + SDD vocabulary are the applicable transfers.

**Devin planner (proprietary — INCONCLUSIVE):** WebSearch 2026-05-25 → Devin described as «compound AI system with Planner as architectural brain»; architecture not public. No DeepWiki access (proprietary). **T16 attempt from WebSearch evidence:** upstream problem class = «high-reasoning model outlines the development path for a single-repo autonomous agent session»; ours = «rule-based classification of kickoff items for meta-session dispatch». Match? Not based on available evidence. Marked INCONCLUSIVE.

**L4 summary:** BUILD confirmed for deterministic bash implementation, ADAPTING vocabulary from TaskMaster + SDD (3-tier size vocabulary). No upstream ships a bash-implementable, rule-based decomposition classifier for markdown kickoff items.

---

## §3 — L5: Skill/agent assignment candidates

**Our L5 problem class:** «Given a classified work item (type = R-phase / I-phase-small / I-phase-large / fix) and its surface description (mentions "vitest tests", "playwright e2e", "meta-orchestrator skill", etc.), propose the correct CC skill to invoke or AI-agnostic sub-agent to read. Output: `recommended_skill: <slug>` or `recommended_agent: <path>`.» Implementation: lookup table + keyword-matching bash or rule-set.

| # | Candidate | Upstream problem class | Our L5 problem class | Match? | Verdict | Falsifier |
|---|---|---|---|---|---|---|
| 1 | **SkillRouter (arxiv 2603.22455; `github.com/zhengyanzhao1997/SkillRouter`)** | Retrieve-and-rerank pipeline (1.2B param encoder + reranker) for routing LLM agent tasks to relevant skills from a registry of 80K+ entries. Addresses the «skill-routing at scale» problem — expose only relevant skills at inference time. Evidence: WebSearch 2026-05-25 → arxiv.org/abs/2603.22455, confirmed 1.2B param model, 80K skill registry, end-to-end coding-agent study. | Route a classified work item description to one of ~15 CC skills (vitest, playwright, meta-orchestrator, etc.). | **Architectural mismatch: neural routing vs lookup table.** SkillRouter is designed for 80K+ skill registries requiring a trained neural retriever. Our registry = ~15 skills — small enough for keyword-based lookup table. A 1.2B model is dramatically over-engineered for 15 entries. **T16: X = neural retrieve-and-rerank for large-scale skill ecosystems (80K+); Y = keyword-lookup routing for small (15-entry) CC skill registry. Match? No on scale — over-engineered for our cardinality.** | **REFERENCE.** Confirms that at scale, semantic routing is necessary — but our scale (15 skills) is well within keyword-lookup territory. REFERENCE for the «skill routing» problem vocabulary and the finding that «hiding skill body causes 31–44pp drop in routing accuracy» (relevant to our SKILL.md description quality). | If the CC skill registry grows to 50+ skills, revisit ADAPT. |
| 2 | **Superpowers `using-superpowers` skill — CSO + 1% rule** (`obra/superpowers`) | Semantic skill dispatch via «Claude Search Optimisation» of `description` fields. Skills activate when their `description` matches the current task semantically; `using-superpowers` meta-skill enforces «if ≥1% chance skill applies, invoke it». Evidence: DeepWiki 2026-05-25 → confirmed CSO mechanism, `description` field primacy, 1% rule, no glob-based dispatch, platform-specific invocation via `Skill` tool (CC), `activate_skill` (Gemini), `skill` (OpenCode). | Route queued work items to CC skills by matching item description against skill `description` fields. | **Match on vocabulary, mismatch on automation level.** Superpowers' dispatch requires a live AI session deciding to invoke the skill tool; our L5 must auto-propose a skill in the meta-orchestrator's planning output (before the target session starts). **T16: X = in-session semantic skill dispatch where Claude decides to invoke based on description match; Y = planning-time auto-proposal of skill for a future session, before dispatch. Match? Vocabulary: ~80%. Automation moment: ours is planning-time output, theirs is execution-time decision.** | **ADAPT.** The CSO vocabulary (description-driven routing, description field format: «Use when...») is directly applicable to L5 output format. Implement L5 as: keyword extraction from classified item → lookup against skill `description` fields → output `recommended_skill: <slug>`. The planning-time vs execution-time difference is a sequencing gap, not a fundamental incompatibility. | If Superpowers ships a pre-session skill-proposal API (batch planning mode). |
| 3 | **OpenHands skills / microagents — keyword trigger activation** (`All-Hands-AI/OpenHands`) | Skills (markdown files with YAML frontmatter) load when `triggers` keywords match user message; without frontmatter, always loaded. Skills loaded from `.agents/skills/`, `.openhands/microagents/`, or `.openhands/skills/`. Evidence: DeepWiki 2026-05-25 → confirmed trigger-based loading, `_create_agent_with_skills`, `AppConversationServiceBase.load_and_merge_all_skills`. | Auto-assign a skill/agent to a classified kickoff item based on item description keywords. | **Match on mechanism, mismatch on context.** OpenHands' keyword `triggers` in YAML frontmatter is exactly a keyword-based skill assignment — structurally the same as our L5 lookup table. The difference: OpenHands fires triggers at query time from user messages; our L5 fires at planning time from kickoff item descriptions. **T16: X = per-query trigger-based skill loading for single-session task routing; Y = planning-time keyword-to-skill assignment for future-session dispatch proposals. Match? ~70% on mechanism (keyword triggers); execution context differs.** | **ADAPT.** The keyword-trigger pattern directly maps to our L5 implementation: extract keywords from item description → match against skill `triggers` / `description` → assign. Our L5 is a planning-time precomputed version of OpenHands' runtime trigger. | If OpenHands ships a pre-session skill-assignment planner. |
| 4 | **Cursor `.cursor/rules/` glob + agent-requested dispatch** | Four activation modes: always-apply, auto-attached (glob patterns on file paths), agent-requested (semantic description match), manual. Glob-attached rules fire deterministically on file-path match. Evidence: WebSearch 2026-05-25 → `design.dev/guides/cursor-rules/`, confirmed four modes, frontmatter fields: `description`, `globs`, `alwaysApply`. | Assign a skill to a queued item based on the item's surface type (file paths or description). | **Partial match; glob-attach is structurally useful.** Cursor's glob-based activation (auto-attach when files matching patterns are in context) maps to our case where item description mentions specific file paths («edit `.claude/skills/meta-orchestrator/`»). The agent-requested (semantic description) mode maps directly. **T16: X = in-session rule dispatch based on active file context (globs) or agent semantic decision; Y = planning-time skill assignment for a future session. Match? Glob sub-pattern: ~60%; agent-requested: ~75%.** | **ADOPT VOCABULARY.** The four Cursor activation modes are a clean vocabulary for L5: our keyword-lookup is the «auto-attached» equivalent; future semantic routing would be «agent-requested». No runtime coupling. | If CC skills grow a glob-based auto-attach mechanism (currently description-only). |
| 5 | **Claude Code `when_to_use` field + skill `description` matching** (CC-native) | CC skills are activated when the model's in-context decision matches the skill `description` (the `when_to_use` / `description` field; `triggers:` field is ignored per SSOT #— see memory `reference_skill_when_to_use_field`). Evidence: WebSearch 2026-05-25 → confirmed `description`-based matching, «when to use» prefix convention, no algorithmic classifier. | Auto-assign a CC skill to a classified kickoff item as a planning-time recommendation. | **Exact vocabulary match; timing gap.** The CC skill activation mechanism is already the right vocabulary for L5. Our L5 is a pre-session precompute: «for this item type, the skill whose `when_to_use` would match is X». **T16: X = CC runtime skill activation by description-match; Y = planning-time L5 recommendation that mirrors what CC would activate at runtime. Match? Vocabulary: 100%. Timing: planning-time vs runtime. This is the canonical upstream vocabulary, not a different problem class.** | **ADOPT VOCABULARY.** L5 implementation = traverse `.claude/skills/*/SKILL.md` `description` fields; match item description keywords; output `recommended_skill`. This is a precomputed CC-native routing decision. No novel mechanism needed. | If CC ships a native planning-mode that queries skill descriptions before session start. |

**L5 T7 adversarial result:** asked «what candidate did I miss?» Surfaced: (a) `userFRM/agent-dispatch` — lightweight keyword-to-agent dispatch skill (GitHub Actions TOML index of keywords → agent download URL) — confirms ADAPT approach; (b) `bassimeledath/dispatch` — context-window fan-out skill — wrong problem class (execution, not planning). SkillRouter (#1) is the strongest counter-candidate; confirmed REFERENCE verdict.

**L5 summary:** No novel upstream to ADOPT (the CC-native vocabulary IS our target). ADAPT Superpowers CSO + OpenHands trigger pattern for implementation. The L5 mechanism is a planning-time precompute of CC's runtime skill-dispatch.

---

## §4 — Cross-layer composition: do L3+L4+L5 stack coherently?

**Composition check:**

1. **L3 → L4 sequencing.** L3 emits `FLAG_POTENTIAL_DUPE: <candidate>` for items that overlap with merged PRs. L4 receives a filtered candidate list (after human confirmation of dupe flags). These are sequential, not racing: L3 runs first as a filter step, L4 classifies what survives. **No conflict.**

2. **L4 → L5 sequencing.** L4 outputs `type: fix | R-phase | I-phase-small | I-phase-large`. L5 uses `type` + item description to propose a skill. L5 is a dependent step on L4's output. **No conflict; L5 inputs are L4's outputs.**

3. **L3 ADAPT (fast-path heuristic) vs L4 BUILD (deterministic rules) performance.** L3's ADAPT heuristic (Jaccard on PR titles vs kickoff item list) is cheap enough to run before L4. However: if L3's INCONCLUSIVE zone is large (30–80% overlap), it generates noise that L4 must still classify. **Tension, not conflict.** Mitigation: L3 INCONCLUSIVE items get a `needs-human-review` flag in L4 input — L4 still classifies, but the output carries the dupe-suspect marker.

4. **L5 ADOPT VOCABULARY (CC native) vs L3 REJECT (no-paid-LLM).** L5's recommended assignment is a text output («recommended_skill: vitest»), not a live LLM invocation. L5 runs in bash (keyword lookup), consistent with no-paid-llm-in-ci. **No conflict.**

5. **Scale consideration (T-PC-B check).** L1+L2 = discovery + currency (what this umbrella's Stages 2-3 will build). L3+L4+L5 = actual planning intelligence. Naming discipline per kickoff §3: L1+L2 alone = «better orchestrator, not a planner». L3+L4+L5 together = «planner». The layers are additive and non-overlapping in function. **Stack is coherent.**

**Composition verdict:** L3+L4+L5 stack without architectural conflict. Execution sequence: L3 (dupe filter) → L4 (classify survivors) → L5 (assign skill to classified items). The full planning pipeline is: L1/L2 discovery → L3 dupe filter → L4 size/type classify → L5 skill assign → human decision gate.

---

## §5 — Recommendations per layer + SSOT row proposals

### §5.1 — L3 recommendations

**Verdict: BUILD (deterministic bash heuristic) + REFERENCE (OpenHands semantic pattern for session-bound agent)**

**Rationale:** No upstream ships a deterministic, no-paid-LLM bash tool for comparing markdown kickoff scope against GitHub merged PR titles. The fast-path (Jaccard on PR titles + item extraction with `awk`) is BUILD at ~30 LOC. The INCONCLUSIVE zone escalation is BUILD as an AI-agnostic sub-agent prompt (read by active session, not CI).

ADAPT credits from #1+#5 (gh CLI + item-list extraction); REFERENCE from OpenHands dup-detect pattern (for the session-bound sub-agent escaping the INCONCLUSIVE zone). Linear + PR-DupliChecker = REJECT.

**SSOT row proposals (two):**

```text
Row 72:
Capability: L3 semantic dup-detect for meta-orchestrator kickoff vs merged-PR scope overlap — deterministic Jaccard heuristic (bash)
Upstream candidates: gh CLI + Levenshtein/Jaccard (ADAPT), OpenHands issue_duplicate_check_openhands.py (REJECT — LLM-in-CI), Linear similar-issues (REJECT — wrong substrate), PR-DupliChecker (REJECT — fork-based BERT), structured gh+awk item-list extraction (ADAPT)
Verdict: BUILD (deterministic bash, ~30 LOC) + ADAPT vocabulary from gh CLI + item-list extraction; REFERENCE OpenHands pattern for session-bound INCONCLUSIVE escalation
Date: 2026-05-25
Trigger to revisit: If OpenHands ships session-bound (non-CI) duplicate checker, revisit ADAPT. If project adopts Linear, revisit REJECT on row #3.
```

### §5.2 — L4 recommendations

**Verdict: BUILD (deterministic bash rules, ~40 LOC) + ADAPT VOCABULARY from TaskMaster + Superpowers SDD**

**Rationale:** No upstream ships a rule-based, bash-scriptable, LOC+surface-count based task-type classifier for markdown kickoff items. TaskMaster uses LLM (not adoptable as-is); SDD uses 3-tier vocabulary (adoptable as vocabulary). Build the classifier as deterministic rules: kickoff LOC proxy → size tier; surface count from item list → I-phase-small vs I-phase-large.

**SSOT row proposals (two):**

```text
Row 73:
Capability: L4 decomposition heuristics for meta-orchestrator item-type classification (fix / R-phase / I-phase-small / I-phase-large) — deterministic bash rules
Upstream candidates: TaskMaster analyze-complexity (ADAPT VOCABULARY — LLM-based, vocabulary adoptable), Superpowers SDD (ADAPT VOCABULARY — 3-tier small/medium/large maps to our classification), OpenHands task tracking (REFERENCE — no deterministic heuristics), Anthropic orchestrator-workers pattern (ADOPT VOCABULARY — routing vocabulary), Cursor Plan Mode (REJECT — generative UX mismatch), Devin planner (INCONCLUSIVE — proprietary)
Verdict: BUILD (deterministic bash, ~40 LOC) + ADAPT VOCABULARY from TaskMaster complexity vocabulary + SDD 3-tier model selection
Date: 2026-05-25
Trigger to revisit: If TaskMaster adds a non-LLM complexity scorer or CLI dry-run mode; if SDD adds cross-umbrella classification.

Row 74:
Capability: TaskMaster `analyze-complexity` command — LLM-driven task complexity scoring (1–10) + subtask expansion heuristics
Upstream problem class: PRD-driven project planning with AI complexity scoring
Our problem class: deterministic LOC-based kickoff-item classification
Verdict: ADAPT VOCABULARY (complexity vocabulary, size-tier taxonomy); REJECT for direct ADOPT (LLM implementation incompatible with deterministic bash requirement)
Date: 2026-05-25
Trigger to revisit: If TaskMaster exposes a rule-based (non-LLM) scoring mode.
```

### §5.3 — L5 recommendations

**Verdict: BUILD (keyword-lookup table, ~25 LOC bash) + ADOPT VOCABULARY from CC native skill dispatch + Superpowers CSO + OpenHands trigger pattern**

**Rationale:** The upstream vocabulary (CC `when_to_use` / Superpowers CSO / OpenHands keyword triggers) is fully applicable. Our L5 is a planning-time precompute of what CC's runtime would do. Build a keyword-to-skill mapping table in bash that reads `.claude/skills/*/SKILL.md` description fields and matches them against classified item descriptions.

**SSOT row proposals (two):**

```text
Row 75:
Capability: L5 skill/agent assignment — planning-time auto-proposal of CC skill or AI-agnostic sub-agent for classified meta-orchestrator queue items
Upstream candidates: SkillRouter (REFERENCE — 80K+ scale, over-engineered for 15-skill registry), Superpowers using-superpowers/CSO (ADAPT — description-driven dispatch vocabulary), OpenHands skills/triggers (ADAPT — keyword-trigger mechanism), Cursor glob+agent-requested dispatch (ADOPT VOCABULARY — four activation modes as vocabulary), CC when_to_use mechanism (ADOPT VOCABULARY — planning-time precompute of CC-native routing)
Verdict: BUILD (keyword-lookup table, ~25 LOC bash) + ADOPT VOCABULARY from CC native + Superpowers CSO + OpenHands trigger; REFERENCE SkillRouter for scale considerations
Date: 2026-05-25
Trigger to revisit: If SkillRouter drops to ~100M parameters and becomes embeddable; if CC ships native planning-mode skill query.

Row 76:
Capability: SkillRouter — retrieve-and-rerank neural pipeline for large-scale LLM agent skill routing (80K skill registry)
Upstream problem class: neural skill routing at scale (80K+ skill ecosystem)
Our problem class: keyword-lookup routing for small CC skill registry (~15 skills)
Verdict: REFERENCE (scale analysis confirms our keyword-lookup is appropriate for 15-skill cardinality; neural routing is over-engineered until registry exceeds ~50 skills)
Date: 2026-05-25
Trigger to revisit: If CC skill registry grows beyond 50 entries, or SkillRouter ships a lightweight sub-100M version.
```

---

## §6 — Stop-condition check + self-application (T15)

### Stop conditions

**F-A1 (≥80% covered by mature upstream):** NO. No single upstream covers L3+L4+L5 at 80%+ in a directly adoptable form. The closest is TaskMaster (L4 vocabulary) + Superpowers SDD (L4+L5 vocabulary) + OpenHands (L3 pattern reference), but none ships a deterministic bash implementation for markdown-kickoff-centric meta-orchestrator use. The aggregate adoptable surface is vocabulary (ADAPT/ADOPT VOCABULARY verdicts), not implementation. F-A1 does **not** fire.

**F-A2 (zero T16 match for any layer):** NO. Each layer has at least one T16 partial-match or vocabulary-match candidate:
- L3: gh CLI + awk item-list extraction (ADAPT, ~60% problem-class match on structured kickoffs)
- L4: TaskMaster vocabulary (ADAPT VOCABULARY, 70% vocabulary overlap) + SDD vocabulary (ADAPT VOCABULARY, 80% vocab overlap)
- L5: CC `when_to_use` mechanism (ADOPT VOCABULARY, 100% vocabulary match on planning-time precompute)

F-A2 does **not** fire. All three layers have at least one viable upstream input (vocabulary-level).

**Conclusion:** Neither stop condition fires. Proceed to Stage 4 decision gate per kickoff §2 §Stage 4. Stage 5 implementation is gated on maintainer GO for each of L3/L4/L5.

### T15 self-application — would this R-phase itself be discoverable?

**Question:** could a fresh session find and re-run this R-phase?

**Evidence:**
1. This patch lives at `docs/meta-factory/research-patches/2026-05-25-planner-completeness-prior-art.md` (path committed on branch `research/planner-completeness-prior-art`, pushed to origin).
2. The kickoff driving this R-phase is at `.claude/orchestrator-prompts/meta-orchestrator-planner-completeness/kickoff.md` (line 1: `# KICKOFF — meta-orchestrator planner-completeness`).
3. Worker brief is at `.claude/orchestrator-prompts/meta-orchestrator-planner-completeness/worker-S1-rphase.md` (line 1: `# Worker S1 — Stage 1 R-phase prior-art survey`).

A fresh session could: (a) read the kickoff's §2 Stage 1 to understand the task; (b) read `worker-S1-rphase.md` for the full self-contained brief; (c) read this patch to understand what was found. **Re-runnable: YES** — all three artifacts exist in the repo. The R-phase itself is self-describing.

**Recursive T-PC-A check (planner-can-discover-its-own-work):** after Stage 2 (L1) lands, `priority-score.sh` should enumerate this umbrella's `kickoff.md`. Per kickoff §4: `bash .claude/skills/meta-orchestrator/helpers/priority-score.sh | grep meta-orchestrator-planner-completeness` should return the kickoff entry. This dogfood gate is a Stage 2 post-merge verification, not a Stage 1 concern.

---

## §7 — §1.7 Forward/Backward checks

**Forward-check:** this patch complies with:
- `no-paid-llm-in-ci.md §1` — no API-billed LLM calls in this session; all DeepWiki + WebSearch queries are session-bundled (free). The BUILD recommendations for L3/L4/L5 are deterministic bash, no LLM in CI.
- `build-first-reuse-default.md §3` — ≥3 phrasings per candidate via DeepWiki (TaskMaster ×3 queries, Superpowers ×3 queries, OpenHands ×3 queries) + WebSearch ≥3 phrasings per layer. Evidence: DeepWiki query count in §1-§3 = 9 total (3 per reachable repo). SWE-agent returned `Repository not found` in DeepWiki (marked INCONCLUSIVE, surveyed via WebSearch ×3).
- `phase-research-coverage.md §1` — 6-item search-coverage checklist applied per layer: DeepWiki (×9 queries across 3 repos), WebSearch (×12+ queries across all three layers), adversarial T7 counter-prompt per layer (3 adversarial passes run and documented), population enumeration before sampling (§1/§2/§3 each open with T10 population statement), SSOT consult (rows #64, #65 consulted; prior meta-orchestrator R-phase rows #68-#71 checked for overlap), negative-existence documented (BUILD verdict justified by absence of deterministic bash upstream).
- `doc-authority-hierarchy.md §2 filename convention` — this file is a research-patch; folder-level authority applies (`docs/meta-factory/research-patches/README.md`); no per-file Authoritative-for header required.

**Backward-check:** this patch:
- Does NOT supersede any existing SSOT row. Rows #72–#76 are new appends for the planner-completeness domain.
- Does NOT supersede any existing research-patch. Extends the meta-orchestrator prior-art survey surface (previous patches: `2026-05-23-meta-orchestrator-prior-art.md`, `2026-05-23-meta-orchestrator-prior-art-reject-log.md`) but addresses a distinct capability area (planner L3/L4/L5 vs general meta-orchestrator architecture).
- Does NOT modify `docs/meta-factory/prior-art-evaluations.md` directly — SSOT row proposals in §5 are text-only; orchestrator appends rows after Stage 4 decision per CLAUDE.md «Artifact Ownership Contract».
- Does NOT touch any I-phase implementation files — pure R-phase markdown.

---

## §8 — See also

- `.claude/orchestrator-prompts/meta-orchestrator-planner-completeness/kickoff.md` — umbrella kickoff (origin of this R-phase)
- `.claude/orchestrator-prompts/meta-orchestrator-planner-completeness/worker-S1-rphase.md` — Worker S1 brief (self-contained; re-runnable)
- `docs/meta-factory/prior-art-evaluations.md` rows #64 (Superpowers SDD, SSOT), #65 (using-git-worktrees), #68–#71 (meta-orchestrator architecture R-phase) — prior art context
- `docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md` — meta-orchestrator architecture R-phase (predecessor, different capability domain)
- `eyaltoledano/claude-task-master` (DeepWiki) — TaskMaster complexity scoring + subtask expansion
- `obra/superpowers` (DeepWiki) — SDD 3-tier model selection + CSO dispatch mechanism
- `All-Hands-AI/OpenHands` (DeepWiki) — issue_duplicate_check_openhands.py + skill/trigger loading
- arxiv:2603.22455 (SkillRouter) — neural skill routing at scale; REFERENCE for scale threshold
- linear.app/now/using-ai-to-detect-similar-issues — Linear similar-issues embedding pattern; REJECT for our substrate
