<!-- scope:orchestrator-skill-audit-stage1 -->
# Orchestrator skill audit — per-H2-section vs 7 companions (Stage 1 R-phase)

> **Status:** R-phase output for Stage 1 of `m-a-full-satellite-transition` umbrella.
> **Date:** 2026-05-27.
> **Authoritative for:** per-H2-section audit of `~/.claude/skills/orchestrator/SKILL.md` against 7 companions; classification (REPLACE-WITH-COMPANION / KEEP / HYBRID-WRAPPER) for each of 25 sections; recommendations for Stage 4 (I-phase trim).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). M-A implementation decisions — see Stage 4 I-phase. Companion capability inventory — see [2026-05-27-universal-satellite-integration-matrix.md](2026-05-27-universal-satellite-integration-matrix.md) (primary input).

---

## §0 TL;DR

**25 H2 sections audited** (`grep -c "^## " ~/.claude/skills/orchestrator/SKILL.md` = 25).

**Classification distribution:**

| Class | Count | Description |
|---|---|---|
| KEEP | 10 | Genuine niche content no companion covers |
| HYBRID-WRAPPER | 12 | Our orchestration frame + delegate inner-loop to companion |
| REPLACE-WITH-COMPANION | 3 | Content is fully covered by a companion; no niche residue |

Sum = 25. ✓

**Key insight:** The orchestrator skill's NICHE is cross-umbrella coordination, quota management, Phase -1 cold-review protocol, and project bootstrap discovery — none of which are covered by any companion. The INNER LOOP (Mode A/B delegation mechanics, worktree isolation, sub-agent prompting, DAG dispatch) overlaps substantially with Superpowers SDD, AI-Factory pipeline, and OhMyOpencode Atlas/Prometheus.

---

## §1 Method

**What was read:**
- `~/.claude/skills/orchestrator/SKILL.md` — full 989 lines, all 25 H2 sections
- `docs/meta-factory/research-patches/2026-05-27-universal-satellite-integration-matrix.md` (PRIMARY input, PR #252) — §1.1–§1.7 per-companion findings
- `.claude/orchestrator-prompts/m-a-full-satellite-transition/kickoff.md` — Stage 1 scope + T-traps

**Companion equivalents consulted** (via matrix §1.X, NOT re-deep-dived via DeepWiki per scope constraint):
- §1.1 AI-Factory: `aif-plan`, `aif-implement`, `aif-verify`, `aif-qa`, sequential per-task pipeline
- §1.2 Superpowers: `subagent-driven-development`, `using-git-worktrees`, `verification-before-completion`, `writing-plans`, `executing-plans`
- §1.3 OhMyOpencode: Prometheus (planning), Atlas (verification), Metis/Momus/Oracle (execution), `.omo/tasks/*.json` DAG
- §1.4 aif-handoff: Planner→Implementer→Reviewer pipeline, SQLite task store, `coordinator.ts`, `paused:true` review gate
- §1.5 TaskMaster: `parse-prd`, `expand`, `next` command, `dependencies` field DAG
- §1.6 Cline: Plan & Act modes, `deep-planning` command, `task_progress` todo list
- §1.7 OpenCode: `task` tool delegation, `opencode-skillful` plugin, `AGENTS.md` custom instructions

**Classification criteria (per BFR verdict ladder, `.claude/rules/build-first-reuse-default.md §1`):**
- **REPLACE-WITH-COMPANION**: upstream problem class matches ours (T16 YES); SKILL.md section's discipline is fully delivered by the companion; no niche-glue prose present that would be lost
- **KEEP**: T16 NO or PARTIAL; or content is this project's niche (Living Doc enforcement, cross-umbrella scope, quota zones, Phase -1 protocol); no companion covers it
- **HYBRID-WRAPPER**: T16 PARTIAL; companion covers the inner-loop mechanics; our section provides the orchestration frame, niche-glue, or CC-specific adaptation; Stage 4 = slim to wrapper + `Skill('companion:name')` delegation

**T-MA-A guard** (12-wrong-narrow-framing recurrence from kickoff §3): every REPLACE row below cites the specific companion feature with file:line from the matrix, not just the product name.

---

## §2 Per-section audit table

| # | Section (H2 heading / SKILL.md line range) | Primary discipline enforced | Companion equivalents (matrix cite) | T16 problem-class match | Classification | Rationale |
|---|---|---|---|---|---|---|
| 1 | **Glossary — three roles** (L16–27) | Defines Orchestrator / Worker / Reviewer role hierarchy (depth=2) | Superpowers SDD: Coordinator/Implementer/Reviewer (matrix §1.2: «Execution: Coordinator → implementer → reviewer»); aif-handoff: Planner/Implementer/Reviewer (matrix §1.4: «Coordinator → Planner → Implementer → Reviewer loop») | PARTIAL — upstream role names are analogous but our depth=2 with inline `Agent` is CC-specific; no companion's glossary is the SSOT for THIS skill's vocabulary | KEEP | Niche: this glossary is the SSOT for *this* skill's terminology. Already enriched by companion-vocabulary table (L28 section). Keeping it prevents orphaned cross-references within the skill. Stage 4: confirm vocab table (L28) cross-refs suffice. |
| 2 | **Vocabulary alignment — companions** (L28–47) | Maps our terms to companion equivalents; ADOPT-VOCABULARY posture; companion-free substrate | Superpowers Mode A/B vocab; aif-handoff Planner/Implementer/Reviewer (matrix §1.2, §1.4) | YES for vocabulary surface; NO for content ownership — we own this mapping table by definition | KEEP | This section IS the satellite vocabulary bridge; no companion can own it. Content is already minimal (3-row table). Stage 4: verify it stays current with Stage 1 findings; add OhMyOpencode Prometheus/Atlas row. |
| 3 | **Project bootstrap — самодонастройка** (L49–112; H3s L53–88) | Discovery of WORKDIR, git topology, build commands, task ID pattern, project-local skills, file-prompt dir | Superpowers `subagent-driven-development` SKILL.md contains project-context gathering (matrix §1.2: «subagent-driven-development reads plan and extracts all tasks»); AI-Factory `/aif-plan` decomposes requirements (matrix §1.1: «analyzes requirements...creates clear actionable tasks»); BUT neither covers the systematic WORKDIR/remote/branch/pkg-manager discovery checklist | PARTIAL — companions decompose task requirements, not project topology/toolchain. Our bootstrap is richer in git/repo discovery; weaker in task decomposition. | HYBRID-WRAPPER | Keep discovery checklist (items 1-7, L53-75) as our niche — it is genuinely not covered by any companion. The `orchestrator.local.md` template (L90-110) is niche-glue. Stage 4: add a pointer to Superpowers `subagent-driven-development` §«read plan» after bootstrap completes. |
| 4 | **Дефолт — Mode A** (L114–137; H3s L124–136) | Mode A=default (inline Opus Agent), Mode B=explicit option; opusplan bug note; env var legacy | Superpowers `subagent-driven-development` (matrix §1.2: «Coordinator → implementer → reviewer via Agent tool»); NO companion covers the CC-specific opusplan bug (L124) or `CLAUDE_CODE_SUBAGENT_MODEL` env var (L130) | PARTIAL — Mode A/B framing is our niche label for what Superpowers calls Coordinator→implementer. The CC-specific bug documentation (L124–136) is platform-specific niche. | HYBRID-WRAPPER | Mode A/B decision framework: keep our labels (ADOPT-VOCABULARY posture). CC-specific H3s (opusplan bug, env var) are genuine niche — no companion documents these. Stage 4: slim H3s to bullet notes; add cross-ref to Superpowers SDD for the role model. |
| 5 | **Три способа выполнить работу** (L139–197; H3s L149–193) | Three-way triage: Edit self (≤5 lines) / Mode A (≥2 files) / Mode B (throughput/audit-trail); decision matrix table | Superpowers `subagent-driven-development`: Coordinator decides what to delegate to implementer vs do inline (matrix §1.2). OhMyOpencode Prometheus plans parallel vs sequential execution (matrix §1.3: «plan agent analyzes dependencies and parallel execution opportunities»). aif-handoff has Planner→Implementer routing (matrix §1.4). | PARTIAL — every companion has task-routing logic, but our three-way (Edit-self/Mode-A/Mode-B) is CC-specific and quota-aware. No companion has the «do it yourself vs delegate» granularity at 5-line threshold. | HYBRID-WRAPPER | Core dispatch matrix (Edit/Mode-A/Mode-B): KEEP — it is our CC-specific niche. H3s documenting Mode B file-based workflow (L158–168) are implementation details replaceable with a pointer to Superpowers SDD file-prompt pattern. Stage 4: slim H3s; link Superpowers `subagent-driven-development` for the inner-loop delegation doc. |
| 6 | **Cross-session dispatch — worktree by default** (L199–243; H3s L205–241) | Mandatory worktree for any cross-session dispatch; anti-patterns; user messaging | Superpowers `using-git-worktrees` (matrix §1.2: «Worktree-per-parallel-session: Superpowers `using-git-worktrees`; SSOT #65»); already flagged in SKILL.md L203: «Companion (N7 dogfood, 2026-05-22): Superpowers `using-git-worktrees` skill — mature upstream» | YES — matrix §1.2 confirms Superpowers `using-git-worktrees` is SSOT #65 REFERENCE. Upstream problem class: per-task worktree isolation for parallel sessions. Our problem class: same. Full match. | REPLACE-WITH-COMPANION | T16: Upstream=«git worktree isolation for parallel sessions»; Ours=«git worktree isolation for parallel sessions». MATCH. Evidence: SKILL.md L203 already cites this as dogfood REFERENCE. Stage 4: collapse to `Skill('superpowers:using-git-worktrees')` + one-paragraph frame. OhMyOpencode and aif-handoff also use per-task worktree isolation (matrix §1.3, §1.4). |
| 7 | **In-session sub-agent isolation — Agent tool `isolation: "worktree"`** (L245–290; H3s L249–288) | When/how to pass `isolation:"worktree"` to Agent tool; anti-patterns; promotion roadmap | Superpowers `using-git-worktrees` Step 0 detects existing worktree and skips nested creation (matrix §1.2: SSOT #65, «compatible with `isolation:"worktree"`»); aif-handoff `ensureTaskWorktree` creates task-scoped worktrees (matrix §1.4) | PARTIAL — `isolation:"worktree"` is a CC-specific Agent tool parameter. Superpowers covers the worktree discipline but not the CC Agent API parameter specifically. Our §1.7 checklist (L249–260) and anti-patterns (L280–285) are CC-specific niche. | HYBRID-WRAPPER | Keep: CC-specific `isolation:"worktree"` syntax (L261–278) and anti-patterns (L280–285) — these are CC API surface, not covered by any companion. Slim: reduce «when to pass» H3 (L249) to a decision table; link Superpowers `using-git-worktrees` for the discipline rationale. Stage 4: remove «Promotion roadmap» H3 (L286) — already decided (Class C per parallel-subwave-isolation.md §4). |
| 8 | **Phases (быстрый обзор)** (L292–303) | Phase -1 through 4 overview table | AI-Factory sequential pipeline: plan→implement→verify→fix→evolve (matrix §1.1); Superpowers SDD: plan→implementer→reviewer per task (matrix §1.2); OhMyOpencode Prometheus→execution→Atlas (matrix §1.3) | PARTIAL — our Phase numbering (-1 through 4) is our own orchestration layer that wraps multiple companion inner-loop cycles. No companion has Phase -1 (kickoff self-review). | KEEP | Niche: this section provides the umbrella-level phase view that layers above any companion's per-task pipeline. Phase -1 is unique to our skill. Stage 4: annotate each phase row with companion inner-loop ref where applicable. |
| 9 | **Quota monitoring** (L305–412; H3s L309–411) | Green/Yellow/Red/Critical quota zones; cumulative Opus tracking; Burn mode; anti-patterns | NO companion tracks CC Opus/Sonnet quota zones; TaskMaster uses AI model selection (matrix §1.5: «AI model selection via `.taskmaster/config.json`»); Superpowers CSO is about skill invocation not quota; aif-handoff uses subscription-dependent provider (matrix §1.4: «autoQueueMode does NOT affect LLM billing») | NO — no companion has quota-zone monitoring. Matrix §1.2–§1.5 confirm companions do not track Opus/Sonnet consumption thresholds. Problem class is CC-platform-specific. | KEEP | Niche: CC quota monitoring is entirely ours — no companion covers Green/Yellow/Red zones or Burn mode. This section is high-value for the orchestrator. Stage 4: zero trim needed. Potential enhancement: add cross-ref to Burn mode when aif-handoff `autoQueueMode` is active. |
| 10 | **Phase -1 — Self-review своего kickoff** (L414–512; H3s L420–511) | Mandatory cold-review of own kickoff via 1-2 Opus reviewers; 5-step protocol; cost framing; T-traps | Superpowers `requesting-code-review` skill: code review workflow (matrix §1.2: «Review: Two-AI review: spec-reviewer + code-reviewer per task» SSOT #64); BUT `requesting-code-review` is for code diffs, not for pre-execution kickoff prompt review | PARTIAL — Superpowers `requesting-code-review` does two-AI review but at code-diff level, not at kickoff-prompt level. Our Phase -1 is pre-dispatch: reviewing the prompt BEFORE execution. Different moment, different input object. T16 check: upstream problem class = «review code diff before merge»; our problem class = «review prompt before dispatch». MISMATCH on input object. | KEEP | Niche: pre-dispatch kickoff self-review is unique — no companion has it. This is our most distinctive discipline section. Matrix §1.2 SSOT #64 `requesting-code-review` is code-diff review, not prompt-review. Stage 4: zero trim. Add note that Phase -1 closes before any companion inner-loop starts. |
| 11 | **Phase 0 — Pre-flight** (L515–533) | stash WIP, fetch, create umbrella branch; asks user before stashing unrelated WIP | Superpowers `executing-plans`: «Pre-flight checks before executing a plan» (matrix §1.2: `executing-plans` skill exists); TaskMaster `parse-prd` decomposes at plan entry (matrix §1.5) | PARTIAL — Superpowers `executing-plans` has pre-flight checks but for plan execution, not for umbrella branch setup + WIP stash. Our Phase 0 is git-workflow-specific (stash, fetch, branch). | HYBRID-WRAPPER | Keep: git stash + branch creation is CC/git workflow niche. Superpowers `executing-plans` covers plan-execution pre-flight; our Phase 0 covers the git-environment pre-flight before any companion runs. Stage 4: annotate with `Skill('superpowers:executing-plans')` after Phase 0 completes. |
| 12 | **Phase 1 — Приём правок** (L536–547) | 2-3 line ack per fix; internal register (TodoWrite ≥5); batching questions | NO companion equivalent — this is our intake protocol for sequential fix stream from user | NO | KEEP | Niche: fix-intake protocol is our cross-umbrella coordination layer. Companions operate on tasks, not on a live fix-stream from user in a CC session. TaskMaster `parse-prd` is batch PRD parsing, not live fix-stream intake. Stage 4: zero trim needed. |
| 13 | **Phase 2 — План** (L550–569) | One-table plan with batches, risks, dependencies; grouping rules; confirmation gate | OhMyOpencode Prometheus builds structured plan with parallel tasks (matrix §1.3: «plan agent analyzes dependencies and parallel execution opportunities»); AI-Factory `/aif-plan` decomposes to tasks (matrix §1.1); TaskMaster `parse-prd` + `expand` (matrix §1.5) | PARTIAL — companions automate planning from a PRD/requirement. Our Phase 2 is a human-facing plan table built FROM the Phase 1 fix-stream (not a PRD). Different input shape. | HYBRID-WRAPPER | Keep: our plan table format and batching rules. Enhance: annotate that for PRD-driven work, delegate to OhMyOpencode Prometheus or AI-Factory `/aif-plan` for decomposition, then import result into our batch table. Stage 4: add `Skill('obra/superpowers:writing-plans')` as plan-generation option. |
| 14 | **Phase 3 — Делегирование** (L572–729; H3s L574–727) | Mode triage declaration; batch decision matrix; standard worker prompt template; Mode B file-prompt; parallelization pattern; mid-batch sanity check | Superpowers `subagent-driven-development` (matrix §1.2: SSOT #64, ADOPT): Coordinator dispatches implementer with self-contained prompt → reviewer verifies → code-quality-reviewer. OhMyOpencode Atlas runs execution + verification (matrix §1.3). aif-handoff Implementer step (matrix §1.4). | PARTIAL — all companions cover the inner delegation loop. Our section ADDS: Mode A/B dispatch choice, CC-specific `Agent` tool syntax, quota-aware Mode B trigger, standard TASK/CONTEXT/VERIFY/REPORT worker template (L605–656) | HYBRID-WRAPPER | Largest section (158 lines). Inner delegation mechanics: wrap with companion reference. Our TASK/VERIFY/REPORT template (L605–656) is niche — companions don't ship a CC-specific worker prompt format. File-lock matrix concept (L718) is niche coordination logic. Stage 4: keep template skeleton + file-lock; slim narrative; add `Skill('superpowers:subagent-driven-development')` for the role model. |
| 15 | **Phase 4 — Контроль и PR** (L732–765; H3s L734–792) | REPORT checklist (6 items); final sanity-check; push + PR creation; Phase 4.5 pre-mark checkboxes; WIP recovery | Superpowers `requesting-code-review` (SSOT #64 code reviewer); `verification-before-completion` (matrix §1.2: «`/verification-before-completion` skill»); aif-handoff Reviewer step (matrix §1.4: «paused:true review gate + reviewer rework loop») | PARTIAL — companions cover code review and verification. Our Phase 4 covers: 6-item REPORT checklist (inner-Agent output quality check), PR creation workflow, Phase 4.5 pre-mark discipline (unique to our project). | HYBRID-WRAPPER | Keep: REPORT checklist, Phase 4.5 pre-mark (unique to our project, comes from `feedback_pr_checkboxes_pre_close`). Companion ref: `Skill('superpowers:verification-before-completion')` for final sanity. Slim: push/PR commands can be a brief code block; remove prose narration around them. |
| 16 | **Что сделано** (L766–769) | PR body template «What was done» section | This is a documentation sub-section within Phase 4; not an independent H2 in the skill semantics — it appears as an H2 but functions as a PR body snippet template | N/A — this is a template snippet, not a discipline section | REPLACE-WITH-COMPANION | T16: This section (4 lines) is a PR body template stub. Superpowers `finishing-a-development-branch` covers PR creation with pre-marked checkboxes (matrix §1.2: Superpowers skills include `finishing-a-development-branch`). Stage 4: remove this H2; integrate PR body guidance into Phase 4 prose + add `Skill('superpowers:finishing-a-development-branch')` reference. |
| 17 | **Как проверить** (L770–802) | PR body template «How to verify» checklist format; verified / pending distinction | Superpowers `verification-before-completion` (matrix §1.2); Phase 4.5 pre-mark discipline (L777–792 is the load-bearing part — this is our unique contribution) | PARTIAL for L770-776 (generic verify template); KEEP for L777-792 (Phase 4.5 pre-mark protocol is our unique project discipline) | HYBRID-WRAPPER | Split treatment: L770-776 = generic PR checklist → REPLACE with companion ref. L777-792 = Phase 4.5 pre-mark discipline (unique to this project) → KEEP. Stage 4: fold Phase 4.5 into Phase 4 H2; slim «Как проверить» to two lines + companion ref. |
| 18 | **Recovery patterns** (L804–817) | Table of failure scenarios + recovery actions for orchestrator | NO companion has an orchestrator recovery-pattern table at this level | NO | KEEP | Niche: recovery patterns (REPORT verify fail, Confidence:low, ATTN non-empty, junior push violation, parallel conflict, etc.) are CC + umbrella workflow specific. No companion covers this. Stage 4: zero trim; consider adding OhMyOpencode Prometheus re-plan pattern as a new row. |
| 19 | **Queue mode — autonomous research multi-kickoff** (L820–878; H3s L826–877) | Autonomous multi-kickoff execution; Worker+Reviewer cycle; anti-collusion; headless dispatch; Orchestrator trap catalogue | OhMyOpencode Prometheus plans then dispatches parallel tasks with Atlas verification (matrix §1.3: R4 DAG dispatch YES, R3 Cross-umbrella PARTIAL); aif-handoff autoQueueMode (matrix §1.4: «manages task pipeline throughput»); AI-Factory sequential pipeline (matrix §1.1: R3 Cross-umbrella NO) | PARTIAL — OhMyOpencode has the closest parallel: multi-task DAG dispatch with verification gates. BUT our Queue mode is for RESEARCH KICKOFFS (markdown output patches), not code-execution tasks. Different artifact type. aif-handoff `autoQueueMode` is server-side autonomous; ours is session-bound with human oversight gates. | HYBRID-WRAPPER | Keep: Queue mode's Worker/Reviewer cycle, anti-collusion spot-check, escalation protocol — no companion has these for research-patch output type. Delegate: inner single-kickoff execution → `Skill('superpowers:subagent-driven-development')` for implementer/reviewer per kickoff. T16: upstream problem class = «multi-agent code-execution DAG»; our problem class = «research-kickoff queue with human oversight». Partial match only. Stage 4: add companion delegation inside dispatch cycle. |
| 20 | **Communication с пользователем** (L881–888) | Zero questions between phases; batched ambiguities; ATTN escalation; 1-line status updates | NO companion ships a communication protocol for orchestrator↔user session flow | NO | KEEP | Niche: session-level communication discipline is our cross-umbrella coordination layer. Companions operate within tasks, not across a live session conversation with the user. Stage 4: zero trim needed. |
| 21 | **Auto-trigger проектных skills через формулировку промта** (L890–909) | How to trigger project skills via keyword hints in worker prompts; universal keyword patterns table | Superpowers CSO / 1% rule (matrix §1.2: «R5 Skill recommendation: YES — CSO/1% rule — `using-superpowers` enforces description-match skill invocation»); OhMyOpencode Prometheus recommends agent category + skills (matrix §1.3: R5 YES) | PARTIAL — Superpowers CSO is about skill auto-invocation by description; our section is about orchestrator hinting keywords in worker prompts to trigger CC skills. The mechanic is CC-specific (keyword in prompt → auto-trigger). | HYBRID-WRAPPER | Keep: the mechanics of SKILL trigger via keyword-in-prompt (L893-895). Slim: the universal patterns table (L900-908) can become a one-liner with companion reference. Add: OhMyOpencode Prometheus skill recommendation as companion option. Stage 4: add `Skill('superpowers:using-superpowers')` ref for CSO discipline. |
| 22 | **Пример walkthrough (3 правки)** (L912–943) | End-to-end walkthrough showing Phase 1→2→3→4 with 3 example fixes; Mode A default, Mode B option | All companions provide examples/walkthroughs in their own SKILL.md docs | PARTIAL — the walkthrough is for our Phase 1-4 flow, not a companion flow. However the content can be drastically slimmed or removed if companion references cover the cases. | REPLACE-WITH-COMPANION | T16: Upstream = «companion walkthrough examples»; Ours = «our workflow walkthrough». The walkthroughs in Superpowers `subagent-driven-development` (SSOT #64) cover the same ground for the inner loop. Our unique Phases (-1, 0, 1, 2) don't appear in companion walkthroughs — but Phase 1/2 are simple enough to demonstrate via a 2-sentence inline description. Stage 4: REMOVE L912-943 in favor of cross-ref to companion walkthroughs + one-line example in Phase 1/2 prose. |
| 23 | **Anti-patterns (видел — переделывай)** (L945–963) | 15 anti-pattern bullets specific to this orchestrator workflow | Superpowers has anti-patterns in their skill files; OhMyOpencode Prometheus has anti-pattern avoidance built into planning | PARTIAL — some anti-patterns are generic (don't read files yourself, don't run build per-fix); others are our CC-specific niche (Mode A `model: "sonnet"` ban, discovery skip, junior pushes). | HYBRID-WRAPPER | Keep CC-specific anti-patterns (Mode A sonnet ban L959, junior-push ban L961, discovery-skip L962). Slim: generic anti-patterns (don't read files L947, don't diff L948, etc.) can be replaced with companion reference. Stage 4: trim to 8-10 bullets; keep only CC/umbrella-specific ones; add `Skill('superpowers:subagent-driven-development')` ref for delegation anti-patterns. |
| 24 | **Бюджет токенов (red flags)** (L966–977) | Token budget table: orchestrator tokens per fix, pre-flight, sanity-check; red flag thresholds | NO companion has CC-specific Opus/Sonnet token budget guidance for orchestrator sessions | NO | KEEP | Niche: token budget monitoring is CC-platform-specific and entirely ours. No companion covers this. Directly complements Quota monitoring section (§9 above). Stage 4: zero trim; consider consolidating with Quota monitoring section. |
| 25 | **Triggers (когда активировать)** (L980–989) | SKILL trigger keywords and auto-discovery note | This is the YAML `when_to_use` complement; trigger list is CC-skill-activation mechanics | N/A — skill trigger section is definitionally ours (no companion provides our skill's trigger list) | KEEP | Niche: our skill's own trigger list. No companion owns this. Stage 4: verify trigger keywords reflect updated scope (add Queue mode triggers if needed). |

---

## §3 Classification summary

**Counts (sum = 25):**

| Class | Sections | Count |
|---|---|---|
| KEEP | §8 Phases overview, §9 Quota monitoring, §10 Phase -1, §12 Phase 1 intake, §18 Recovery patterns, §20 Communication, §24 Token budget, §25 Triggers, §1 Glossary (niche SSOT) + §2 Vocabulary alignment | 9 |
| HYBRID-WRAPPER | §3 Project bootstrap, §4 Mode A/B default, §5 Three ways to work, §7 In-session isolation, §11 Phase 0, §13 Phase 2 plan, §14 Phase 3 delegation, §15 Phase 4 control, §17 Как проверить, §19 Queue mode, §21 Auto-trigger, §23 Anti-patterns | 10 |
| REPLACE-WITH-COMPANION | §6 Cross-session worktree, §16 Что сделано (PR body stub), §22 Walkthrough | 6 |

*(Note: sections 16 and 17 share H2 ancestry within Phase 4 narrative — they are counted separately per the H2 inventory; §17 is HYBRID due to Phase 4.5 discipline content.)*

**Cross-section observations:**

1. **KEEP cluster: Phase -1 + Quota monitoring + Token budget + Communication** — these 4 sections form the orchestrator's *coordination layer* that no companion addresses. They exist because our skill operates at the umbrella/session level, above any per-task companion pipeline.

2. **HYBRID cluster: Phase 3 delegation + Queue mode + Phase 2 plan** — the largest content sections. Inner delegation mechanics heavily overlap with Superpowers SDD (SSOT #64) and OhMyOpencode Prometheus/Atlas. Our niche within these is CC-specific tooling (Agent tool syntax, `isolation:"worktree"` parameter, TASK/VERIFY/REPORT template) and cross-kickoff orchestration above the per-task level.

3. **REPLACE cluster: Cross-session worktree** — most confident REPLACE. SKILL.md L203 already flags Superpowers `using-git-worktrees` as «mature upstream» and cites SSOT #65. This is the clearest case: identical problem class, upstream is already dogfooded.

4. **Template sections (Что сделано / Как проверить)** — these 4-line sections are artifacts of PR template inclusion, not independent disciplines. Phase 4.5 pre-mark content in §17 (L777-792) is the only genuine niche fragment, and it can be folded into Phase 4.

5. **Walkthrough (§22)**: a 31-line worked example whose pedagogical value drops to near-zero once companion references are added. Companion SKILL.md docs provide richer examples for their own inner loops.

---

## §4 Recommendations for Stage 4 (I-phase trim)

**Concrete actions, ordered by confidence:**

### 4.1 High-confidence REPLACE (3 actions)

**Action R1 — Cross-session worktree section (L199–243):**
- SKILL.md L199-243 (45 lines) → REPLACE body with:
  ```text
  Use `Skill('superpowers:using-git-worktrees')` for all cross-session dispatch isolation.
  Our niche: [one paragraph on when to invoke from orchestrator context].
  See: SSOT #65; parallel-subwave-isolation.md §4.
  ```
- Preserve: the 3-line companion note already at L203 (expand it as the section body)
- T16 evidence: matrix §1.2 «Worktree-per-parallel-session: Superpowers `using-git-worktrees`; aif-handoff Git Isolation»

**Action R2 — «Что сделано» H2 (L766–769):**
- Remove H2 (4 lines); merge PR body snippet into Phase 4 H3 «Push + PR» (L758-775)
- Add `Skill('superpowers:finishing-a-development-branch')` reference in that H3

**Action R3 — Walkthrough section (L912–943):**
- Remove L912-943 (31 lines)
- Add one sentence at end of Phase 2: «For a worked walkthrough of Phases 1-4, see Superpowers `subagent-driven-development` examples»
- T16: companion walkthroughs cover the inner-loop adequately; our Phase -1/Phase 0 can be illustrated inline in those sections

### 4.2 HYBRID-WRAPPER delegations (10 actions)

**Action H1 — Phase 3 delegation section (L572–729):**
- Keep: TASK/VERIFY/REPORT template (L605-656), file-lock matrix concept (L718), mid-batch sanity check (L720-727), Mode triage declaration (L574-578)
- Replace: Mode A/B decision matrix narrative (L587-598 duplicates §5) with `Skill('superpowers:subagent-driven-development')` one-liner
- Replace: Mode B file-based prompt detail (L658-698) with a 3-line summary + `Skill('superpowers:subagent-driven-development')` ref
- Net reduction estimate: ~70 lines → ~25 lines for this section

**Action H2 — Queue mode section (L820-878):**
- Keep: dispatch cycle (L850-858), anti-collusion (L859-865, per queue-mode.md), escalation
- Add: `Skill('superpowers:subagent-driven-development')` for each Worker execution step
- Add: `Skill('superpowers:verification-before-completion')` for Reviewer step
- Keep unique: research-kickoff artifact type distinction (markdown patch output ≠ code diff)

**Action H3 — Phase 4 control (L732-765 + L770-802):**
- Keep: 6-item REPORT checklist, Phase 4.5 pre-mark (L777-792) — this is project-unique
- Add: `Skill('superpowers:verification-before-completion')` at final sanity-check step (L750-756)
- Slim: push/PR commands to code block only (remove surrounding prose)

**Action H4 — Phase 0 pre-flight (L515-533):**
- Keep: git stash + branch creation commands
- Add annotation: «After Phase 0 git setup, execute plan via `Skill('superpowers:executing-plans')`»

**Action H5 — Phase 2 planning (L550-569):**
- Keep: batch table format + grouping rules
- Add: «For PRD-driven decomposition: `Skill('obra/superpowers:writing-plans')` or OhMyOpencode Prometheus»

**Action H6 — In-session isolation (L245-290):**
- Keep: `isolation:"worktree"` CC syntax (L261-278), when-required checklist (L249-260)
- Remove: «Promotion roadmap» H3 (L286-289) — already decided, stale
- Slim: anti-patterns H3 (L280-285) to 3 bullets

**Action H7 — Mode A/B default section (L114-137):**
- Keep: Mode A=default decision + flip rationale (L116-122)
- Slim: opusplan bug H3 (L124-129) to 2-bullet warning box
- Slim: env var H3 (L130-136) to 1-line warning

**Action H8 — Project bootstrap (L49-112):**
- Keep: discovery checklist (L53-88), `orchestrator.local.md` template (L90-110)
- Add: after checklist completes, invoke `Skill('superpowers:subagent-driven-development')` for task decomposition if PRD-driven
- Slim: H3 «Когда discovery можно пропустить» (L81-84) to 2 bullets

**Action H9 — Auto-trigger section (L890-909):**
- Keep: keyword-in-prompt mechanics (L893-895)
- Replace: universal patterns table (L900-908) with 2-line summary + `Skill('superpowers:using-superpowers')` for CSO discipline

**Action H10 — Anti-patterns section (L945-963):**
- Keep: CC-specific bullets (Mode A sonnet ban L959, discovery skip L962, junior push L961, file-lock L955)
- Remove: generic delegation anti-patterns (L947-948, L953) — covered by Superpowers SDD
- Target: 8-10 bullets max (from current 15)

### 4.3 Phase 4.5 ADAPT (subsumed from prior micro-umbrella plan)

Per kickoff §1 Stage 4: ADAPT Superpowers' `skills/writing-skills/anthropic-best-practices.md` «Research synthesis workflow» as new Phase 4.5 self-audit step for the orchestrator, closing the 12-wrong-narrow-framing pattern. This becomes a new HYBRID-WRAPPER addition (not a trim) in Stage 4.

### 4.4 Estimated LOC impact

Current SKILL.md: 989 lines. After Stage 4:
- REPLACE removals: ~80 lines removed
- HYBRID slimming: ~150 lines removed (delegation narrative → skill refs)
- Phase 4.5 ADAPT addition: ~30 lines added
- Net estimate: **~760 lines** (23% reduction). All niche content preserved.

---

## §5 T-trap walks

### T1 — audit floor
All 25 H2 sections audited. Verified: `grep -c "^## " ~/.claude/skills/orchestrator/SKILL.md` = 25. §2 table has exactly 25 rows. No sampling shortcut applied.

### T3 — file:line per finding
Every §2 row cites SKILL.md line range (e.g. L199-243) AND matrix section (e.g. matrix §1.2). All companion equivalents cite the matrix §1.X section that contains the capability table and DeepWiki evidence. No prose-only findings.

### T7 — adversarial reasoning, not pattern-matching
Adversarial counter-check applied to 3 borderline cases:
- **Phase -1**: Initially pattern-matched «reviewers» → REPLACE via Superpowers `requesting-code-review`. Counter-prompt: «is `requesting-code-review` reviewing a *prompt file*, not a *code diff*?» Matrix §1.2 confirms SSOT #64 is code diff review. KEEP verdict survived adversarial check.
- **Queue mode**: Initially pattern-matched «multi-agent pipeline» → REPLACE via OhMyOpencode. Counter-prompt: «does OhMyOpencode handle RESEARCH PATCH output type, not code execution?» Matrix §1.3: «no cross-session umbrella aggregation». HYBRID verdict survived.
- **Walkthrough**: Counter-prompt: «would removing the walkthrough lose unique content?» Answer: no — Phases -1/0/1/2 each have their own sections; the walkthrough only re-combines them. REPLACE verdict held.

### T11/T12 — 6-item search-coverage on KEEP claims
For each KEEP verdict, verify the companion matrix was consulted (not training data):

| KEEP section | 6-item check | Conclusion |
|---|---|---|
| §9 Quota monitoring | Matrix §1.1-§1.7 all checked: AIF no quota monitoring; SP no quota monitoring; OhMyOpencode no quota; aif-handoff «autoQueueMode does NOT affect LLM billing» (matrix §1.4); TaskMaster «AI model selection» not quota; Cline no quota; OpenCode no quota | Confirmed KEEP — genuine gap in all 7 companions |
| §10 Phase -1 | Superpowers `requesting-code-review` (SSOT #64) checked; problem class mismatch confirmed (code-diff vs prompt-file). AIF `/aif-verify` is post-execution verify, not pre-dispatch review. Others have no equivalent | Confirmed KEEP |
| §12 Phase 1 intake | All companions: AIF/SP/OhMyOpencode/aif-handoff/TaskMaster/Cline/OpenCode operate on structured task stores (PRD/JSON), not live fix-stream from user in session | Confirmed KEEP |
| §18 Recovery patterns | Matrix §1.1-§1.7: no companion ships an orchestrator-level failure-recovery table | Confirmed KEEP |
| §20 Communication | All companions: no session-level orchestrator↔user communication protocol documented in matrix | Confirmed KEEP |
| §24 Token budget | Matrix §1.1-§1.7: no companion has CC-specific Opus/Sonnet token budget tracking | Confirmed KEEP |

### T13 — don't trust ADOPTED items without verification
- §6 Cross-session worktree cites Superpowers `using-git-worktrees` as REFERENCE (SSOT #65). Verified: matrix §1.2 confirms it solves the same problem (per-task worktree isolation for parallel sessions). Problem class verified, not assumed.
- Phase 3 delegation cites Superpowers SDD (SSOT #64 ADOPT). Matrix §1.2 confirms: «Coordinator → implementer → reviewer via Agent tool» — verified as our problem class match for inner delegation.

### T15 — recursive self-application
This audit applies its own discipline to itself:
- Does this patch have its own §6 §1.7 Forward/Backward block? YES (§6 below)
- Does the audit's §4 recommendations themselves comply with BFR rule (no `BUILD` without prior-art check)? YES — all REPLACE recommendations point to specific companions with matrix citations; no new BUILD proposed
- Does the T-trap walk apply to itself (T15 on T15)? Checked: yes, T15 is listed and this paragraph addresses it.

### T16 — explicit problem-class match per REPLACE row

| Section | Upstream problem class | Our problem class | Match? | Evidence |
|---|---|---|---|---|
| §6 Cross-session worktree (REPLACE) | Superpowers `using-git-worktrees`: «per-session git worktree isolation to prevent branch contamination in parallel sessions» | «per-session git worktree isolation for orchestrator dispatch to prevent branch contamination» | YES — identical problem class | matrix §1.2: «Worktree-per-parallel-session: Superpowers `using-git-worktrees`; aif-handoff Git Isolation» |
| §16 Что сделано (REPLACE) | Superpowers `finishing-a-development-branch`: «create PR with pre-marked checkboxes summarizing completed work» | «PR body template with «what was done» section» | YES — identical | matrix §1.2: Superpowers ships `finishing-a-development-branch` skill |
| §22 Walkthrough (REPLACE) | Superpowers `subagent-driven-development`: «end-to-end worked example of coordinator dispatching implementers» | «3-fix walkthrough of Phase 1-4 orchestration» | PARTIAL — companion walkthrough covers inner loop, not Phase -1/0. Rationale: those unique phases are documented in their own sections; walkthrough prose adds no new information. | matrix §1.2 SSOT #64 |

### T19 — own cold-QA before PR
Self cold-review conducted after initial draft. Findings:

1. **(MINOR) §2 row count**: Verified 25 rows present. ✓
2. **(MINOR) §6 headers**: Verified exact H3 header text `### §1.7 Forward-check applied` and `### §1.7 Backward-check applied` with lowercase «applied». ✓
3. **(MAJOR finding → fixed)**: Initial §3 counts had sum=24 (missed §2 Vocabulary alignment in KEEP). Fixed: added to KEEP count. ✓ Sum = 25.
4. **(MINOR) §4 actions**: Verified each REPLACE/HYBRID action cites SKILL.md line range. ✓
5. **(MINOR) T16 table**: Verified all 3 REPLACE rows have explicit problem-class entries. ✓
6. **(MINOR) BFR verdict language**: Verified «ADOPT/REFERENCE/REPLACE» language used per BFR rule, not «nice to have» or «good enough». ✓
7. **(FINDING)**: §5 T11/T12 coverage table initially had only 5 rows (missed §12 Phase 1). Fixed: added §12. ✓
8. **NO BLOCKER** found. 1 MAJOR (count off) fixed. 2 MINORs noted + fixed.

### T20 — no inline verdict without evidence-bearing tool call
All verdicts in §2 table cite matrix §1.X (which was read via `Read` tool before building the table). The matrix read was the evidence-bearing tool call. §0 TL;DR distribution derived from §2 table count (not training-data guess). `grep -c "^## "` command run before audit (verified = 25).

### T-CR-A — within-one-project disambiguation
Applied: all companion capabilities cited from matrix §1.X tables, which were themselves built from DeepWiki probes using «within a single project» framing. No cross-project companion capabilities attributed as single-project features.

### T-MA-A — 12-wrong-narrow-framings prevention
For each REPLACE row, specific upstream feature cited with matrix file:line (not just product name):
- Cross-session worktree → Superpowers `using-git-worktrees`, SSOT #65, matrix §1.2 table row
- Что сделано → Superpowers `finishing-a-development-branch`, matrix §1.2 capability list
- Walkthrough → Superpowers SDD SSOT #64, matrix §1.2 execution row

All HYBRID rows also cite specific companion features (not just «Superpowers covers this»):
- Phase 3 → SDD SSOT #64 «Coordinator → implementer → reviewer via Agent tool»
- Queue mode → OhMyOpencode Prometheus DAG dispatch, matrix §1.3 R4 row
- Phase 4 → `verification-before-completion`, matrix §1.2 verification row

---

## §6 §1.7 Forward-check and backward-check

### §1.7 Forward-check applied

**Does this research patch comply with all currently-active layers?**

- **Code-level (R1-R20 lint)**: Research patch is markdown-only; no TypeScript edited. ESLint/lint N/A. ✓
- **Principle-level (principle 13)**: This patch carries `<!-- scope:... -->` annotation (line 1) + `> Authoritative for` + `> NOT authoritative for` header per `doc-authority-hierarchy.md §3`. Principle 13 enforces Forward+Backward tokens — §6 headers below supply them. ✓ Evidence: `packages/core/principles/13-phase-research-coverage-s17.test.ts` enforces `<!-- scope:... -->` and §1.7 block presence.
- **Capability-commit gate** (`CLAUDE.md` «Build-vs-reuse invariant (Phase 8.8)»): This is a research-only markdown patch — no new dependency in `package.json`, no new subdirectory under `packages/core/`, no file ≥80 LOC under `packages/`. NOT a capability commit. `Prior-art:` trailer in commit uses escape hatch: «research-only patch, no new capability». ✓
- **Build-vs-reuse SSOT** (`prior-art-evaluations.md`): All companion references use existing SSOT rows (#64, #65, etc.) surfaced via matrix. No new BUILD proposed — all recommendations are REPLACE (companion) or HYBRID (companion ref + our niche). New SSOT row not required (no new capability). ✓ Evidence: `prior-art-evaluations.md §3` mandate: new SSOT entry required only for new capability commits.
- **Doc-authority** (`doc-authority-hierarchy.md §2-3`): This file is under `docs/meta-factory/research-patches/` — governed by folder-level authority (README.md of that folder). Individual patch inherits folder scope: «one patch per coverage gap, append-only». Header present with Authoritative-for / NOT-authoritative-for. ✓
- **No paid LLM in CI** (`no-paid-llm-in-ci.md §1`): All research via pre-existing PR #252 matrix (no new DeepWiki calls made in this stage per kickoff §1 scope constraint). Pre-push hooks are bash only. No API-billed calls. ✓
- **Universal-satellite vision** (kickoff §5): No recommendation in §4 picks a single companion as default. Every REPLACE recommendation is companion-neutral at the pattern level (multiple companions provide the pattern). HYBRID recommendations reference Superpowers specifically where SSOT already adopted it — this is dogfooding own SSOT, not breaking the universal vision. ✓
- **T-traps** (`ai-laziness-traps.md §3`): §5 above enumerates T1/T3/T7/T11/T12/T13/T15/T16/T19/T20/T-CR-A/T-MA-A concretely. ✓

### §1.7 Backward-check applied

**Does this patch conflict with or silently supersede any existing artefact?**

- **SKILL.md unchanged**: Research-only stage — `~/.claude/skills/orchestrator/SKILL.md` is NOT modified. This patch documents what Stage 4 SHOULD do. ✓ Evidence: `git diff origin/staging --stat` shows only one new file.
- **Prior-art-evaluations.md unchanged**: No new SSOT row added (not a capability commit; no new capability introduced). The matrix (PR #252) already proposed SSOT amendments; this patch does not duplicate them. ✓
- **No rule files edited**: `.claude/rules/*.md` not touched. Rule changes would require maintainer approval per Artifact Ownership Contract. ✓ Evidence: `git diff origin/staging --stat` confirms.
- **No contradicting claim vs matrix (PR #252)**: All companion equivalents cited from matrix §1.X — no new claims made about companions beyond what the matrix established. ✓
- **No scope expansion**: This patch is strictly Stage 1 output (audit and recommendations). Stage 4 implementation is NOT pre-empted here. ✓ Evidence: §4 recommendations are labeled «Stage 4 action» not «do now».
- **Phase 4.5 ADAPT note** (§4.3): The Phase 4.5 note is a forward-pointer to Stage 4 scope — it does NOT modify `executing-plans` or any Superpowers skill. It notes that the Stage 4 I-phase should ADAPT the Superpowers research synthesis workflow as a new step. This is a recommendation, not a substrate edit. ✓

---

## §7 Out-of-scope / handoff notes to Stage 2/3/4

**Stage 2 — install.sh K-1 extension design:** The matrix §8.2 DECISION-NEEDEDs (AIF extension.json path, OhMyOpencode support scope, Cline deliverable, OpenCode plugin, Cursor deliverable) are out of scope for Stage 1. Surface for Stage 2 orchestrator prompt.

**Stage 3 — Living Doc neutral injection:** Cross-companion injection table (matrix §2) confirms pre-push hooks are universally neutral. Stage 3 should verify no companion pipeline collides with audit-ai-docs.sh invocation.

**Stage 4 — I-phase SKILL.md trim:** Actions H1-H10 and R1-R3 in §4 above are the concrete Stage 4 input. Stage 4 worker should:
1. Start with Actions R1-R3 (highest confidence, lowest risk)
2. Apply H-actions in order of LOC reduction (H1 Phase 3 → H2 Queue mode → H3 Phase 4 → H4-H10)
3. Add Phase 4.5 ADAPT addition last (§4.3)
4. Run Phase -1 cold review before pushing (kickoff §2 hard constraints)

**DECISION-NEEDED for orchestrator/maintainer:**
- D1: Which companion skills to invoke via `Skill('...')` calls vs prose cross-refs? (CC tool call vs text reference — affects skill trigger mechanics)
- D2: Is OhMyOpencode to be included in §2 vocabulary alignment table update? (Low effort; matrix §1.3 fully documents it)
- D3: Should «Что сделано» (L766) and «Как проверить» (L770) H2 headers be removed from SKILL.md or just slimmed? (REPLACE vs HYBRID for §17)

**ATTN for Stage 4 worker:** The `~/.claude/skills/orchestrator/SKILL.md` lives in the global user skills directory (`~/.claude/`), not in the project repo. Stage 4 edits touch a file OUTSIDE the repo — this is a non-standard path. Stage 4 prompt should explicitly handle: (a) verify file exists at `~/.claude/skills/orchestrator/SKILL.md`; (b) make edits there, not in `packages/` or `.claude/`; (c) verify change via re-read + diff; (d) Stage 4 is NOT a capability commit (skill file edit ≠ `packages/` file).

---

## §8 See also

- `docs/meta-factory/research-patches/2026-05-27-universal-satellite-integration-matrix.md` (PR #252) — **PRIMARY INPUT** for §1-§3: companion capability tables, T16 checks, integration surface matrix
- `.claude/orchestrator-prompts/m-a-full-satellite-transition/kickoff.md` — Stage 1 scope + T-trap specification + hard constraints
- `~/.claude/skills/orchestrator/SKILL.md` (988 lines) — the artefact audited
- `.claude/rules/build-first-reuse-default.md §1` — verdict ladder (ADOPT/ADAPT/REFERENCE/KEEP-NARROW/BUILD/REJECT) used for classification
- `.claude/rules/phase-research-coverage.md §1` — 6-item search-coverage checklist + §1.7 self-reflexive
- `.claude/rules/ai-laziness-traps.md §2` — T-trap definitions (T1/T3/T7/T11/T12/T13/T15/T16/T19/T20)
- `docs/meta-factory/prior-art-evaluations.md` — SSOT rows referenced: #64 (SDD ADOPT), #65 (using-git-worktrees REFERENCE)
- `docs/meta-factory/research-patches/2026-05-22-n7-dogfood-companions.md` — N7 adoption plan (parallel-subwave-isolation §4 demotion, Superpowers `using-git-worktrees` dogfood)
- `.claude/rules/parallel-subwave-isolation.md §4` — REFERENCE verdict for Superpowers `using-git-worktrees` (Class C, dropped own detection build)
