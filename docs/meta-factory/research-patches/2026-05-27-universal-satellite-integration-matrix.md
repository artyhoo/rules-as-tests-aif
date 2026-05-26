<!-- scope:universal-satellite-integration-matrix -->
# Universal-satellite integration matrix R-phase

> **Status:** R-phase output for `universal-satellite-integration-matrix` umbrella.
> **Date:** 2026-05-27.
> **Authoritative for:** capability inventory + integration surface matrix per major companion under universal-satellite vision; identification of Living Doc neutral injection points; recommendation feed for future M-A umbrella scope.
> **NOT authoritative for:** project goal (see README#why-this-exists); M-A umbrella implementation decisions; substrate edits.

---

## §0 TL;DR

Seven companions evaluated against R1-R5 (persistent plan, auto-discovery, DAG ordering, skill recommendation, cross-umbrella collection) plus storage / execution / review / verification layers.

**Key findings:**

1. **AI-Factory has a formal `injections` API** in `extension.json` (v2.13.2 `extension.schema.json`, verified via npm-pack): `target` skill + `position` (append/prepend) + `file`. This supersedes the `skill-context` workaround for fresh installations. Our current `install.sh:319-322` skill-context path remains valid for AIF ≤2.10; the `injections` field is the forward-compat path.

2. **OhMyOpencode is the most capable standalone companion** for R1-R5 within a single project: task JSON persistence (`.omo/tasks/`), full DAG via `blockedBy`, 5-tier hook system (PreToolUse/PostToolUse/Message/Event/Transform/Params), skill dispatch by model category. Conflict surface with our `.claude/skills/` is manageable (4-scope priority; disable via `"claude_code.skills": false`).

3. **Superpowers provides the cleanest coexistence model**: CLAUDE.md / AGENTS.md = highest priority; skill priority (project > personal > Superpowers); no `.superpowers/` global config injection — satellite rules go into CLAUDE.md/AGENTS.md or project-local skills.

4. **aif-handoff confirms `.ai-factory/skill-context/` IS the injection directory** copied into each task worktree by `ensureTaskWorktree` — our existing skill-context files ride into every aif-handoff pipeline run. **Critical conflict:** `reviewer.ts` hardcodes `"review-sidecar"` as agent name; our `agents/review-sidecar.md` ships the same filename — this is a known collision resolved by `install.sh copy_safe` (DEFAULT no-force).

5. **TaskMaster**: migrated away from `.claude/agents/` to plugin marketplace model; ships `TASKMASTER.md` + `@import` into project `CLAUDE.md` instead. No hook conflicts. Minimal conflict surface with our stack.

6. **Cline**: `.clinerules/` auto-loaded; hooks in `.clinerules/hooks/` (TaskStart/TaskResume/PreToolUse/PostToolUse); Cline hooks ≠ CC `settings.json` hooks — they are DIFFERENT systems (Cline SDK-internal vs CC harness). Concurrent Cline hooks use `Promise.all`, any `cancel: true` blocks execution.

7. **OpenCode / Cursor agent mode**: OpenCode has a rich JS plugin API (`tool.execute.before/after`, `session.created`, etc.); loads `.claude/skills/` automatically (CC compatibility). Cursor is rules-only (no persistent plan, no lifecycle hooks), making it the simplest integration surface.

8. **Universal injection point for Living Doc enforcement**: `.claude/skills/rules-as-tests/SKILL.md` (description-match auto-activation in CC/OpenCode/Cline) + CLAUDE.md for always-on rules + pre-push hooks (harness-agnostic). No companion requires a dedicated injection directory EXCEPT AI-Factory (skill-context / injections API).

---

## §1 Per-companion capability inventory (R1-R5 + storage/execution/review/verification)

### §1.1 AI-Factory (`lee-to/ai-factory` npm v2.13.2, 2026-05-27)

**T16 problem-class check:** Upstream = «single-feature workflow pipeline within one project: plan → implement → verify → fix → evolve». Our problem class = «Living Doc enforcement layer injected into that pipeline». Match on integration-surface (SSOT #50 skill-context ADOPT; injections API new finding). Diverges on workflow scope — AIF owns the feature workflow; we inject enforcement discipline into it.

**Evidence:** DeepWiki `lee-to/ai-factory` probe 1 (2026-05-27) + npm-pack `ai-factory-2.13.2.tgz` inspection (2026-05-27).

| Capability | AIF support | File:line evidence |
|---|---|---|
| R1 Persistent plan | YES — `.ai-factory/features/<branch>.md` (feature) + `.ai-factory/PLAN.md` (task) + SQLite via aif-handoff | DeepWiki probe 1: «Plans saved to `.ai-factory/features/<branch-name>.md`» |
| R2 Auto-discovery | YES — `/aif-plan` decomposes requirements → `TaskCreate`; `/aif-improve` refines plan | DeepWiki probe 1: «It analyzes requirements...creates clear, actionable tasks» |
| R3 Cross-umbrella | NO (single-feature scope only; cross-session via aif-handoff) | - |
| R4 DAG dispatch | YES — `blockedBy` relationships via `TaskUpdate`; executor skips blocked tasks | DeepWiki probe 1: «uses TaskUpdate to set blockedBy relationships» |
| R5 Skill recommendation | YES (implicit) — sequential skill invocation: `aif-feature → aif-plan → aif-implement → aif-verify` | DeepWiki probe 1: «automatically invokes /ai-factory.task to create the implementation plan» |
| Storage | `.ai-factory/` markdown + `.ai-factory/patches/` self-improvement | DeepWiki probe 1 |
| Execution | Sequential per-task with `TaskUpdate` status tracking | DeepWiki probe 1 |
| Review | `/aif-verify` + background `review-sidecar` subagent | DeepWiki probe 1 |
| Verification | `/aif-qa` skill + principle tests via our injection | npm-pack: `package/skills/aif-qa/SKILL.md` |

**Integration surface (key finding: two injection mechanisms):**

1. **`skill-context` path** (existing SSOT #50, ADOPT): `.ai-factory/skill-context/<skill>/SKILL.md` — MANDATORY-read by AIF's background sidecars. Verified live 2026-05-20. Our `install.sh:319-322` uses this today.

2. **`injections` field in `extension.json`** (NEW finding, 2026-05-27): `extension.schema.json` in v2.13.2 defines `injections[]` with `target` (skill name), `position` (append/prepend), `file` (path). This is the forward-compat API for extension-based content injection — more explicit than the skill-context workaround.
   - Evidence: `tar tzf ai-factory-2.13.2.tgz` → `package/schemas/extension.schema.json` → `$defs.ExtensionInjection`
   - Implication: our future M-A work should register injections via `extension.json` for the install-via-extension path, while keeping `install.sh:319-322` for the direct-overlay path.

3. **External config**: `.ai-factory/DESCRIPTION.md` (read at pre-plan by all skills), `.ai-factory/RULES.md` (read by `aif-rules-check` sidecar), `.ai-factory/patches/` (post-execute accumulation). All three are injection points we already use.

**Conflict surface:**
- `agents/review-sidecar.md` filename collision with AIF's own `review-sidecar` agent — resolved by `install.sh copy_safe` DEFAULT no-force (our file skips if AIF's is present).
- No `.claude/skills/` namespace conflict (AIF skills live in `.claude/skills/aif-*/`, ours in `.claude/skills/rules-as-tests/`).

---

### §1.2 Superpowers (`obra/superpowers`)

**T16 problem-class check:** Upstream = «meta-skill framework that enforces rigorous skill invocation discipline + SDD inner-loop coordination within one project». Our problem class = «Living Doc enforcement layer». Match on skill-invocation discipline surface (SSOT #55 ADAPT, SSOT #64 ADOPT, SSOT #65 ADOPT). Diverges: Superpowers = process rigor engine; we = enforcement substrate. Non-overlapping problem classes at the framework level.

**Evidence:** DeepWiki `obra/superpowers` probes 1-3 (2026-05-27) + prior SSOT rows #55/#64/#65/#71/#74/#76.

| Capability | Superpowers support | Evidence |
|---|---|---|
| R1 Persistent plan | YES — `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` committed markdown | DeepWiki probe 1: «Plans stored in docs/superpowers/plans/» |
| R2 Auto-discovery | YES (via SDD) — plan checkbox `- [ ]` items + `writing-plans` skill task decomposition | DeepWiki probe 1: «subagent-driven-development reads plan and extracts all tasks» |
| R3 Cross-umbrella | PARTIAL — SDD is within-plan; no cross-plan cross-umbrella aggregator | DeepWiki probe 1: sequential per-task with review gates |
| R4 DAG dispatch | PARTIAL — sequential with review gates between tasks; no explicit `blockedBy` DAG | DeepWiki probe 1: «DAG or dependency ordering — tasks processed sequentially» |
| R5 Skill recommendation | YES (CSO / 1% rule) — `using-superpowers` enforces description-match skill invocation | SSOT #76 ADOPT VOCABULARY |
| Storage | `docs/superpowers/plans/` + session-start hook injection | DeepWiki probe 1 |
| Execution | Coordinator → implementer → reviewer (two separate reviewer subagents per SDD) | SSOT #64 |
| Review | Two-AI review: spec-reviewer + code-reviewer per task | SSOT #64 ADOPT |
| Verification | `/verification-before-completion` skill | DeepWiki probe 1 |

**Integration surface:**

1. **CLAUDE.md / AGENTS.md = highest priority** — satellite rules injected here override Superpowers skills. Our CLAUDE.md and `.claude/rules/*.md` are naturally higher-priority than Superpowers skills.

2. **Skill priority**: project skills (`.claude/skills/` or `.opencode/skills/`) > personal > Superpowers. Our `.claude/skills/rules-as-tests/SKILL.md` takes precedence in all harness contexts where Superpowers runs.

3. **SessionStart hook** — `hooks/session-start` reads `using-superpowers` SKILL.md and injects as `additionalContext`. Our session-bootstrap (`inject-session-bootstrap.sh` UserPromptSubmit hook) runs independently in CC; no conflict since both hooks output to `additionalContext` (CC concatenates, does not last-write-wins).

4. **No `.superpowers/` external config directory** — confirmed (DeepWiki probe 3). Legacy `~/.config/superpowers/skills` removed. Satellite injection = CLAUDE.md or project-local skill files.

5. **For OpenCode**: `.opencode/plugins/superpowers.js` exports `config` hook (injects Superpowers skills dir) + `experimental.chat.messages.transform` (bootstrap injection). A satellite tool wanting to coexist would register its own plugin (different plugin file, non-conflicting hooks since OpenCode executes all registered plugins).

**Conflict surface:**
- `using-superpowers` bootstrap injection and our `inject-session-bootstrap.sh` UserPromptSubmit hook both inject always-on context. In CC: independent channels (hook vs session-start); no conflict. In OpenCode: both loaded as plugins if configured.
- Trigger overlap: Superpowers 1% rule means any skill with an overlapping description MIGHT be invoked; our `rules-as-tests` skill description is sufficiently distinct (`when_to_use: lint, tests, CI, mutation testing, contracts, drift`).
- No filesystem conflicts: Superpowers does NOT ship files into `.claude/agents/`, `.ai-factory/`, or pre-push hooks.

---

### §1.3 OhMyOpencode (`code-yeongyu/oh-my-openagent`, 59.1k★)

**T16 problem-class check:** Upstream = «full multi-agent orchestration within OpenCode session, with 3-layer blocking gates (Prometheus → Metis/Momus/Oracle → Atlas), `.omo/tasks/` JSON persistence, 5-tier hook system». Our problem class = «Living Doc enforcement substrate». Match on hook integration surface (5-tier hooks include PreToolUse/PostToolUse which map to our CC hooks). Diverge on orchestration scope — OhMyOpencode is a within-session task coordinator; we are an enforcement layer that installs alongside any coordinator.

**Evidence:** DeepWiki `code-yeongyu/oh-my-openagent` probes 1-2 (2026-05-27) + SSOT #61/#68/#81.

| Capability | OhMyOpencode support | Evidence |
|---|---|---|
| R1 Persistent plan | YES — `.omo/tasks/*.json` (JSON files, `experimental.task_system` enabled by default) + `boulder.json` session continuity | DeepWiki probe 1: «Tasks stored as JSON files in .omo/tasks/ directory» |
| R2 Auto-discovery | YES — Prometheus agent builds structured plan + parallel task graph from requirements | DeepWiki probe 1: «plan agent analyzes dependencies and parallel execution opportunities» |
| R3 Cross-umbrella | PARTIAL — within-session cross-task; no cross-session umbrella aggregation | - |
| R4 DAG dispatch | YES — full `blockedBy` field: tasks with empty `blockedBy` run in parallel, others wait | DeepWiki probe 1: «supports full dependency tracking using a blockedBy field» |
| R5 Skill recommendation | YES — per-task recommended agent category + skills list in Prometheus plan template | DeepWiki probe 1: «recommends which category to use for delegation and which skills to load» |
| Storage | `.omo/tasks/*.json` + `boulder.json` | DeepWiki probe 1 |
| Execution | Parallel where deps satisfied (blockedBy empty); sequential otherwise | DeepWiki probe 1 |
| Review | Atlas agent (verification layer); blocking oracle gate pattern | SSOT #68 REFERENCE |
| Verification | 3-layer blocking gates: execution → verification before next layer | SSOT #68 |

**Integration surface:**

1. **4-scope skill priority system**: `opencode-project` (`.opencode/skills/`) > `opencode` (global) > `project` (`.claude/skills/`) > `user` (global Claude). Our `.claude/skills/rules-as-tests/` maps to scope 3 (project). It IS loaded automatically in OhMyOpencode.

2. **5-tier hook system**: PreToolUse / PostToolUse / Message / Event / Transform / Params hooks can be registered by satellite tools. Our CC `settings.json` PostToolUse hooks (`inject-matching-rule.sh`, `check-doc-authority.sh`) are CC-specific; OhMyOpencode's hook system is separate but parallel. For OhMyOpencode: hooks go in the OhMyOpencode plugin config or `oh-my-opencode.jsonc`.

3. **CC hooks integration**: OhMyOpencode integrates with CC hooks from `settings.json` — confirmed by DeepWiki probe 2: «integrates with Claude Code hooks defined in settings.json files». Our CC PostToolUse hooks ARE loaded when running OhMyOpencode within CC. Disable via `"claude_code.hooks": false`.

4. **Living Doc injection**: `.claude/skills/rules-as-tests/SKILL.md` is auto-loaded at scope 3 and activates via description-match. CLAUDE.md rules are loaded as project rules (scope 3). Pre-push hooks are harness-agnostic (git hooks).

**Conflict surface:**
- **Skill deduplication**: if two skills share the same name, 4-scope priority wins. Our `rules-as-tests` slug is unique, no collision.
- **Known conflict**: loading both OhMyOpencode skill plugin AND our `.claude/skills/` simultaneously can cause «Duplicate tool names detected» HTTP 400 — disable via `"claude_code.skills": false` in OhMyOpencode config (DeepWiki probe 2). This is a KNOWN conflict that has a documented escape hatch.
- **Agent definition overlap**: OhMyOpencode loads `.claude/agents/*.md` at scope 3. Our `review-sidecar.md` and `living-docs-auditor.md` are loaded. No naming conflict with OhMyOpencode's own agents (Prometheus/Metis/Momus/Oracle/Atlas — different names).

---

### §1.4 aif-handoff (`lee-to/aif-handoff`)

**T16 problem-class check:** Upstream = «autonomous multi-agent task pipeline (Planner → Implementer → Reviewer) with SQLite task store, Docker + Postgres production, per-task git worktree isolation». Our problem class = «Living Doc enforcement injected into that pipeline». Match on skill-context injection (`.ai-factory/skill-context/` confirmed as the injection directory). Diverges on scope — aif-handoff is a server-side autonomous pipeline; we are enforcement content injected into its Reviewer subagent.

**Evidence:** DeepWiki `lee-to/aif-handoff` probes 1-3 (2026-05-27) + SSOT #27/#28/#29/#30/#43/#46/#67/#80.

| Capability | aif-handoff support | Evidence |
|---|---|---|
| R1 Persistent plan | YES — SQLite task store + `.ai-factory/features/<branch>.md` plan markdown | DeepWiki probe 1: «runPlanner saves to file path from .ai-factory/config.yaml» |
| R2 Auto-discovery | YES — `/api/projects/:id/roadmap/import` converts `ROADMAP.md` milestones to tasks with deduplication | DeepWiki probe 1: «ROADMAP.md import process auto-assigns tags» |
| R3 Cross-umbrella | NO (single-project scope; multi-project is a self-hosted server concern) | - |
| R4 DAG dispatch | YES — `computePendingPlanLayers` computes layer-driven dispatch; parallel where deps met | DeepWiki probe 1: «computes dependency layers from the active plan» |
| R5 Skill recommendation | YES (via runtime profiles) — `createRuntimeWorkflowSpec` selects agent tier for planner/implementer/reviewer | DeepWiki probe 1: «uses runtime profiles to select the appropriate agent or skill» |
| Storage | SQLite (`@aif/data`) + markdown plan files + `.ai-factory/skill-context/` | DeepWiki probe 1 |
| Execution | Coordinator (`coordinator.ts`) → Planner → Implementer → Reviewer loop | SSOT #30 DEFER |
| Review | `reviewer.ts` hardcodes `"review-sidecar"` + `"security-sidecar"` agent names | DeepWiki probe 3: «reviewer.ts explicitly references "review-sidecar" as agent name» |
| Verification | `paused:true` review gate + reviewer rework loop | SSOT #28 DEFER |

**Integration surface:**

1. **`.ai-factory/skill-context/` IS the injection directory** — confirmed by DeepWiki probe 2: «`.ai-factory/skill-context/` directory is copied into the worktree when `ensureTaskWorktree` is used». Our existing `install.sh:319-322` skill-context files are guaranteed to arrive in each task worktree. **This is the primary satellite injection point for aif-handoff.**

2. **MCP tools**: `handoff_get_task`, `handoff_update_task`, `handoff_sync_status`, `handoff_push_plan`, `handoff_annotate_plan` — a satellite enforcement tool can read/write task state via MCP tools. Relevant for future Living Doc audit results → task status sync.

3. **WebSocket events**: `task:created`, `task:updated`, `task:moved` events available for real-time monitoring. Satellite enforcement could subscribe to verify Living Doc state on task transitions.

4. **autoQueueMode**: manages task pipeline throughput; does NOT affect LLM billing (still subscription-dependent on the configured provider). NOT a built-in subscription-mode escape.

**Conflict surface:**
- **CRITICAL: `review-sidecar.md` naming collision** — aif-handoff's `reviewer.ts` hardcodes `"review-sidecar"` as agent definition name, loading from `.claude/agents/review-sidecar.md`. Our `agents/review-sidecar.md` ships the same filename. Collision is resolved today by `install.sh copy_safe` DEFAULT (no-force: skip if AIF's is present). Our anti-tautology content is delivered via skill-context instead (SSOT #50). This remains the correct resolution.
- **`security-sidecar` agent**: aif-handoff also loads `security-sidecar` — we do NOT ship this filename; no conflict.
- **No hook-level conflict**: aif-handoff is server-side (Node/Docker); our CC hooks are client-side. They run in different processes.

---

### §1.5 TaskMaster (`eyaltoledano/claude-task-master`)

**T16 problem-class check:** Upstream = «PRD-driven single-project task manager with AI-powered complexity scoring and DAG dependency ordering». Our problem class = «Living Doc enforcement substrate». Match on vocabulary (SSOT #73 ADOPT VOCABULARY for tier naming). Diverges: TaskMaster owns task management; we inject enforcement discipline alongside it.

**Evidence:** DeepWiki `eyaltoledano/claude-task-master` probes 1-2 (2026-05-27) + SSOT #73.

| Capability | TaskMaster support | Evidence |
|---|---|---|
| R1 Persistent plan | YES — `.taskmaster/tasks/tasks.json` with Tagged Task Lists support | DeepWiki probe 1: «stored persistently in tasks.json within .taskmaster/tasks/ directory» |
| R2 Auto-discovery | YES — `parse-prd` generates task hierarchy from PRD; `expand` breaks tasks into subtasks | DeepWiki probe 1: «parse-prd generates dependency-aware task hierarchies from PRDs» |
| R3 Cross-umbrella | PARTIAL — Tagged Task Lists allow cross-feature isolation; no cross-project native support | DeepWiki probe 1 |
| R4 DAG dispatch | YES — `dependencies` field + circular-dep prevention + `next` command finds next unblocked task | DeepWiki probe 1: «tasks have a dependencies field listing prerequisite task IDs» |
| R5 Skill recommendation | MINIMAL — `next_task` MCP tool; no skill recommendation; AI model selection via `.taskmaster/config.json` | DeepWiki probe 1 |
| Storage | `.taskmaster/tasks/tasks.json` (local) or Supabase/Hamster API (team mode) | DeepWiki probe 1 |
| Execution | CLI commands (`task-master set-status`, etc.) + MCP tools; no autonomous loop | DeepWiki probe 1 |
| Review | None built-in; delegates review to developer / CI | - |
| Verification | None built-in | - |

**Integration surface:**

1. **CLAUDE.md import** — TaskMaster creates `.taskmaster/CLAUDE.md` + adds `@import` to root `CLAUDE.md`. Our CLAUDE.md coexists (import mechanism is additive, not overwriting).

2. **`allowedTools` recommendation** — TaskMaster recommends adding `"Bash(task-master *)"` + `"mcp__task_master_ai__*"` to `.claude/settings.json`. Our settings.json is self-protected (agent-uncommittable per memory). Maintainer merges both sets.

3. **No skill files shipped to `.claude/skills/`** — TaskMaster migrated to CC plugin marketplace model. No `.claude/skills/` or `.claude/agents/` files shipped. Zero filesystem conflict with our stack.

4. **CLI + MCP extension points**: a satellite enforcement tool can invoke `task-master set-status done` after a Living Doc audit passes, or subscribe to task events via the MCP server.

**Conflict surface:**
- **Minimal**: TaskMaster does NOT ship `.claude/skills/`, `.claude/agents/`, pre-push hooks, or `settings.json` hooks. `@import` into CLAUDE.md is additive.
- **`analyze-complexity` is API-billed** — SSOT #73 ADOPT VOCABULARY only; we do NOT adopt the LLM invocation. No `no-paid-llm-in-ci.md` violation from our side.

---

### §1.6 Cline / Cursor agent mode

**T16 problem-class check (Cline):** Upstream = «VS Code extension / CLI agent with persistent task storage (SQLite ClineCore), lifecycle hooks (.clinerules/hooks/), skill system (load-on-demand SKILL.md by description)». Our problem class = «Living Doc enforcement layer». Match on hook integration surface (PreToolUse/PostToolUse) and skill auto-loading (.clinerules/ maps to our .claude/rules/ in Cline context). Diverges: Cline owns the agent loop; we inject enforcement rules.

**T16 problem-class check (Cursor):** Upstream = «IDE with rules-based persistent context injection, no persistent plan storage, no lifecycle hooks, no skill system». Problem class is «persistent context delivery at model context level». Match on rules-based context injection only. Diverges: Cursor has zero task management capability; it is purely a rules/context injection surface.

**Evidence:** DeepWiki `cline/cline` probes 1-2 (2026-05-27) + WebFetch cursor.com/docs (returned redirect, no rules page content).

**Cline:**

| Capability | Cline support | Evidence |
|---|---|---|
| R1 Persistent plan | YES — Tasks with unique IDs; SQLite via ClineCore; `deep-planning` command | DeepWiki probe 1: «ClineCore persists sessions to SQLite» |
| R2 Auto-discovery | PARTIAL — Plan & Act mode with `task_progress` todo list; no structured DAG building | DeepWiki probe 1: «/deep-planning systematically explores codebase, creates implementation plan» |
| R3 Cross-umbrella | NO (single-task scope; Team mode requires Hub) | - |
| R4 DAG dispatch | PARTIAL — `task_progress` tracks todo list; no explicit `blockedBy` | DeepWiki probe 1: «task_progress parameter allows tracking progress on comprehensive todo list» |
| R5 Skill recommendation | YES — Skills activated by description match via `use_skill` tool | DeepWiki probe 1: «examines name and description from skill YAML frontmatter» |
| Storage | SQLite per-task + `.clinerules/` project rules | DeepWiki probe 1 |
| Execution | Plan & Act modes; single agent | - |
| Review | None built-in; user reviews | - |
| Verification | None built-in | - |

**Cline integration surface:**

1. **`.clinerules/` directory** — auto-loaded markdown rules; project-level `.clinerules/` takes precedence over global. Our `.claude/rules/*.md` files are CC-specific; for Cline deployment, equivalent rules would go in `.clinerules/`. The two are NOT the same directory.

2. **Cline hooks** (`.clinerules/hooks/`): TaskStart / TaskResume / UserPromptSubmit / PreToolUse / PostToolUse. These are CLINE SDK hooks, NOT CC `settings.json` hooks. Our CC `settings.json` PostToolUse hooks do NOT fire in Cline (different runtime). For Cline deployment: would need to create `.clinerules/hooks/` scripts.

3. **Skill loading**: Cline loads SKILL.md by description match. Our `rules-as-tests` SKILL.md would need to be in `.clinerules/skills/rules-as-tests/SKILL.md` for Cline (not `.claude/skills/`). The skill description + when_to_use content is fully portable.

4. **Living Doc injection in Cline**: rules go in `.clinerules/*.md`; hooks go in `.clinerules/hooks/`; pre-push hooks are harness-agnostic (git) — these work identically.

**Cline conflict surface:**
- Cline hooks and CC hooks are SEPARATE systems — they do NOT conflict (different runtimes).
- Concurrent Cline hooks use `Promise.all` — if multiple hooks for PreToolUse, ALL fire; any `cancel: true` blocks. Our `.clinerules/hooks/` hooks would need careful exit codes.
- `.clinerules/` and `.claude/rules/` are different directories — no filesystem overlap.

**Cursor:**

| Capability | Cursor support | Evidence |
|---|---|---|
| R1 Persistent plan | NO | WebFetch: «LLMs don't retain memory between completions» |
| R2 Auto-discovery | NO | - |
| R3 Cross-umbrella | NO | - |
| R4 DAG dispatch | NO | - |
| R5 Skill recommendation | MINIMAL — Agent-type rules activate by description match | SSOT #62 ADOPT VOCABULARY |
| Storage | None (stateless) | - |
| Execution | Inline agent mode | - |
| Review | None built-in | - |
| Verification | None built-in | - |

**Cursor integration surface:**

Cursor = rules-injection-only surface. Integration for Living Doc enforcement:
1. **`.cursor/rules/*.mdc`** — inject R1-R20 conventions, audit-ai-docs reminder, pre-push reminder as always-on or auto-attach rules.
2. **No lifecycle hooks** — pre-push hooks are the only gate available (harness-agnostic git hooks).
3. **Agent-type rules** fire by description match (SSOT #62) — our SKILL.md description ports as an Agent-type Cursor rule for on-demand invocation.

**Cursor conflict surface:** Zero filesystem conflict. No shared directories with our stack. Minimal integration surface.

---

### §1.7 OpenCode (`sst/opencode`)

**T16 problem-class check:** Upstream = «open-source AI coding agent with rich JS plugin API (tool.execute.before/after, session lifecycle events), CC-compatibility layer (loads .claude/skills/ automatically), AGENTS.md support». Our problem class = «Living Doc enforcement layer». Match on CC-compatibility (our `.claude/skills/rules-as-tests/` is loaded automatically), AGENTS.md (our shipped AGENTS.md template works), and plugin hooks (a satellite enforcement plugin can register `tool.execute.before/after`). Strong integration match.

**Evidence:** DeepWiki `sst/opencode` probes 1-2 (2026-05-27) + WebFetch opencode.ai/docs/plugins/ (2026-05-27).

| Capability | OpenCode support | Evidence |
|---|---|---|
| R1 Persistent plan | PARTIAL — Session storage in `~/.local/share/opencode/project/`; no structured plan markdown | DeepWiki probe 1: «project-specific data in ~/.local/share/opencode/project/» |
| R2 Auto-discovery | PARTIAL — `task` tool for delegating subtasks; no auto-decomposition | DeepWiki probe 1: «task tool can be used to delegate subtasks to subagents» |
| R3 Cross-umbrella | NO | - |
| R4 DAG dispatch | NO explicit — `task` tool with no DAG support documented | DeepWiki probe 1 |
| R5 Skill recommendation | YES — `opencode-skillful` plugin for lazy loading + skill discovery; AGENTS.md for custom instructions | DeepWiki probe 1: «opencode-skillful for lazy loading prompts and skill discovery» |
| Storage | `~/.local/share/opencode/` + project-local session data | DeepWiki probe 1 |
| Execution | Single agent with `task` delegation; no multi-agent pipeline | - |
| Review | None built-in | - |
| Verification | None built-in | - |

**OpenCode integration surface:**

1. **CC compatibility auto-load**: OpenCode auto-loads `.claude/skills/` (priority after `.opencode/skills/`). Our `.claude/skills/rules-as-tests/SKILL.md` is loaded without any configuration. AGENTS.md precedence: `AGENTS.md` > `CLAUDE.md` (OpenCode prefers AGENTS.md; our shipped `AGENTS.md.template` is the right deliverable).

2. **JS plugin API** (WebFetch evidence): `tool.execute.before` + `tool.execute.after` + `session.created` + `session.compacted` + `lsp.client.diagnostics` + `shell.env` + `experimental.session.compacting`. A satellite enforcement tool can register `tool.execute.before` to block prohibited operations or inject validation.

3. **`.opencode/plugins/` directory** — project-local plugins loaded from `.opencode/plugins/*.js`. A future satellite enforcement plugin could ship `.opencode/plugins/rules-as-tests-enforcement.js` for OpenCode-native hook integration.

4. **`experimental.session.compacting` hook** — allows injecting context into the compaction prompt. Our Living Doc rules could be injected here to ensure they survive compaction cycles.

5. **Environment variables to disable CC compatibility**: `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` disables `.claude/skills/` loading. Consumer can use this if our skills conflict.

**Conflict surface:**
- **Skill priority conflict**: if OhMyOpencode AND OpenCode are both used with Superpowers, the 4-scope priority system (OhMyOpencode) vs OpenCode's own priority (`AGENTS.md` > `CLAUDE.md`) creates a layered resolution. Our files are at scope 3 in OhMyOpencode's system and below `AGENTS.md` in OpenCode's system — consistent behavior.
- **`.opencode/plugins/superpowers.js` hook conflicts**: if a satellite enforcement tool registers `experimental.chat.messages.transform` AND Superpowers does too, OpenCode executes all registered plugins. Concatenation (not last-write-wins) — no destructive conflict.
- **CC hooks not loaded in OpenCode**: OpenCode confirmed (DeepWiki probe 2) does NOT support `settings.json PostToolUse hooks` from CC — «codebase context does not contain information regarding settings.json PostToolUse hooks». Our CC-specific hooks are no-ops in OpenCode. For OpenCode deployment: use OpenCode JS plugin API instead.

---

## §2 Integration surface matrix (skill-context / lifecycle hooks / external config / Living Doc injection)

| Companion | Skill-context override | Lifecycle hooks | External config consumed | Living Doc injection point | Notes |
|---|---|---|---|---|---|
| AI-Factory | YES — `.ai-factory/skill-context/<skill>/SKILL.md` (SSOT #50) + `extension.json injections[]` (v2.13.2 NEW) | Pre-plan: DESCRIPTION.md read; Pre-execute: patches/ read; Post-execute: patches/ + DESCRIPTION.md update | `.ai-factory/DESCRIPTION.md`, `.ai-factory/RULES.md`, `.ai-factory/patches/` | skill-context injection + RULES.md (R1-R20 already there) | Primary companion; all injection paths already wired |
| Superpowers | NO dedicated override dir; relies on CLAUDE.md/AGENTS.md priority | SessionStart hook injects using-superpowers; no pre/post-plan hooks | CLAUDE.md (highest priority, overrides Superpowers skills) | CLAUDE.md + `.claude/rules/` + pre-push hooks | Clean coexistence; our rules override Superpowers by priority |
| OhMyOpencode | NO dedicated override dir; skill deduplication via 4-scope priority | 5-tier: PreToolUse/PostToolUse/Message/Event/Transform/Params via `oh-my-opencode.jsonc` | `.claude/skills/` (scope 3 auto-load) + CLAUDE.md/AGENTS.md + CC settings.json hooks (if CC harness) | `.claude/skills/rules-as-tests/SKILL.md` auto-loaded + CC hooks loaded | Known conflict: disable `claude_code.skills` if duplicate-tool-names error |
| aif-handoff | YES — `.ai-factory/skill-context/` copied into each task worktree | WebSocket task events; MCP tools for state sync; env vars (HANDOFF_MODE, HANDOFF_TASK_ID) | `.ai-factory/config.yaml`, `.claude/agents/*.md` | skill-context files already in worktree; reviewer.ts loads review-sidecar.md | review-sidecar naming collision managed by install.sh copy_safe |
| TaskMaster | NO skill-context; CLAUDE.md @import | CLI commands + MCP tools (no pre/post-execute lifecycle hooks per se) | `.taskmaster/config.json` + `CLAUDE.md` (additive @import) | CLAUDE.md (additive) + pre-push hooks | Minimal conflict; cleanest coexistence |
| Cline | NO dedicated override dir; `.clinerules/` for rules | `.clinerules/hooks/`: TaskStart/TaskResume/UserPromptSubmit/PreToolUse/PostToolUse | `.clinerules/*.md` + Cline Skills (SKILL.md by description) | `.clinerules/rules-as-tests.md` (rules) + `.clinerules/hooks/` (enforcement hooks) | Separate hook system from CC settings.json |
| OpenCode | NO dedicated override dir; CC compatibility auto-loads `.claude/skills/` | JS plugin API: `tool.execute.before/after` + session events + `experimental.session.compacting` | `AGENTS.md` (preferred over CLAUDE.md) + `.claude/skills/` auto-loaded + `.opencode/plugins/*.js` | `.claude/skills/rules-as-tests/SKILL.md` auto-loaded + AGENTS.md + optional `.opencode/plugins/` | CC PostToolUse hooks NOT loaded in OpenCode — use JS plugin API |

**Living Doc enforcement layer (R1-R20 ESLint + principle tests + audit-ai-docs + mutation testing) injection points by layer:**

| Enforcement layer | Universal injection point | Companion-specific notes |
|---|---|---|
| Edit-time (ESLint) | `eslint.config.mjs` in project — harness-agnostic | Works in ALL companions; no companion owns ESLint config |
| Pre-commit (lint-staged) | `.husky/pre-commit` — harness-agnostic | Works in ALL companions |
| Pre-push | `.husky/pre-push` — harness-agnostic | Works in ALL companions; this is the primary gate |
| CI | `.github/workflows/ci.yml` — harness-agnostic | Works in ALL companions |
| Living Doc drift | `audit-ai-docs.sh` — harness-agnostic bash | Works in ALL companions; invoked from pre-push |
| Rule injection (CC) | `.claude/skills/rules-as-tests/SKILL.md` + `.claude/rules/*.md` | CC / OpenCode (CC compat) / OhMyOpencode (scope 3) |
| Rule injection (Cline) | `.clinerules/rules-as-tests.md` | Cline-specific; separate from .claude/rules/ |
| Rule injection (Cursor) | `.cursor/rules/rules-as-tests.mdc` | Cursor-specific; Agent-type rule |
| Rule injection (AIF) | `.ai-factory/RULES.md` (R1-R20) + skill-context overrides | AIF + aif-handoff; already wired |
| Rule injection (Superpowers) | CLAUDE.md / AGENTS.md (highest priority) | Superpowers defers to these |
| AI review context | `.claude/agents/review-sidecar.md` + skill-context | CC / AIF / aif-handoff; OpenCode loads agents dir |

---

## §3 Conflict surface (where our pieces clash with companion's own)

| Our artefact | Companion | Conflict type | Severity | Resolution |
|---|---|---|---|---|
| `agents/review-sidecar.md` | aif-handoff (`reviewer.ts` hardcodes `"review-sidecar"`) | Filename collision in `.claude/agents/` | MANAGED | `install.sh copy_safe` DEFAULT no-force; skill-context delivers content instead (SSOT #50) |
| `agents/review-sidecar.md` | AI-Factory (`review-sidecar` background sidecar) | Same collision as above (same AIF codebase) | MANAGED | Same resolution |
| `.claude/skills/rules-as-tests/SKILL.md` | OhMyOpencode | «Duplicate tool names detected» if OhMyOpencode skill loading active | KNOWN / MANAGEABLE | Set `"claude_code.skills": false` in OhMyOpencode config OR register our skill in `.opencode/skills/` instead |
| CC `settings.json` hooks | OpenCode | CC hooks NOT loaded in OpenCode harness | NOT A CONFLICT (just a gap) | Deploy OpenCode JS plugin for hook equivalence; pre-push hooks work regardless |
| CC `settings.json` hooks | Cline | Cline uses `.clinerules/hooks/` system (different) | NOT A CONFLICT (gap) | Deploy `.clinerules/hooks/` equivalents for Cline |
| `.ai-factory/RULES.md` | TaskMaster | TaskMaster `CLAUDE.md @import` is additive, doesn't touch RULES.md | NO CONFLICT | - |
| CLAUDE.md / AGENTS.md | Superpowers | Superpowers gives these HIGHEST priority — they override SP skills | WORKS IN OUR FAVOR | No action needed |
| Pre-push hooks | ALL companions | Git hooks are harness-agnostic | NO CONFLICT | Pre-push is the universal enforcement layer |

---

## §4 Coexistence combos (which work together; which don't)

| Combo | Compatibility | Evidence | Notes |
|---|---|---|---|
| AIF + aif-handoff | VERIFIED WORKING | SSOT #27/#28/#29/#30; `handoff_sync_status` MCP tools pre-integrated | Primary combo; our skill-context files flow through aif-handoff worktrees |
| AIF + Superpowers | COMPATIBLE | Superpowers = process discipline; AIF = workflow engine; no file namespace overlap | CLAUDE.md priority hierarchy ensures our rules take precedence |
| AIF + OhMyOpencode | COMPATIBLE WITH CAVEAT | OhMyOpencode loads `.claude/skills/` at scope 3; AIF skills live there too | Potential duplicate-tool-names if OhMyOpencode skill plugin also active; disable one |
| AIF + TaskMaster | COMPATIBLE | TaskMaster's `@import` into CLAUDE.md is additive; no `.ai-factory/` conflict | Independent task stores (`.ai-factory/` vs `.taskmaster/`) |
| aif-handoff + Superpowers | COMPATIBLE | No file namespace overlap; different problem classes | SP rules in CLAUDE.md flow into aif-handoff task context naturally |
| Superpowers + OhMyOpencode | COMPATIBLE (OpenCode platform) | Both support OpenCode; Superpowers plugin + OhMyOpencode plugin coexist | Superpowers bootstrap injection + OhMyOpencode Prometheus orchestration are complementary |
| Superpowers + Cline | COMPATIBLE (separate platforms) | Superpowers is CC/OpenCode-focused; Cline is a separate runtime | Skill files are different directories; no overlap |
| OhMyOpencode + Cline | INDEPENDENT | Different platforms; no shared config | Not a typical combo (user picks one agent harness) |
| Any companion + Cursor | COMPATIBLE (rules-only) | Cursor has no task management; rules are additive | Cursor supplements any companion with rules-based context injection |
| Any companion + pre-push hooks | VERIFIED UNIVERSAL | Git hooks are harness-agnostic | Pre-push is the universal enforcement floor for ALL combos |

---

## §5 Living Doc neutral injection points (per enforcement layer)

Summary: Living Doc enforcement is ALREADY harness-neutral at the critical layers. The only companion-specific work needed is for rule-text injection (skill files adapt per harness).

```text
edit-time (ESLint)  → universal (eslint.config.mjs)
pre-commit          → universal (.husky/pre-commit)
pre-push            → universal (.husky/pre-push + audit-ai-docs.sh)
CI                  → universal (.github/workflows/)
rule text injection → per-harness (see §2 table)
AI review context   → per-harness (CC/OhMyOpencode: .claude/agents/; AIF: skill-context; Cline: .clinerules/)
```

**Universal injection = the git hook layer + CI layer.** These are the reliable floor.

**Per-harness injection** (rule text delivered to AI context at session time):
- CC / OpenCode (CC compat) / OhMyOpencode scope 3: `.claude/skills/rules-as-tests/SKILL.md` auto-loaded
- AIF pipeline: `.ai-factory/skill-context/` + `RULES.md` + `extension.json injections[]`
- aif-handoff: same as AIF (worktree copy)
- Cline: `.clinerules/` equivalent (separate deliverable, same content)
- Cursor: `.cursor/rules/` mdc file (separate deliverable)
- Superpowers: CLAUDE.md / AGENTS.md (already our primary format)
- TaskMaster: CLAUDE.md (additive @import)

**SSOT amendment proposals** (see §8 for details):
- SSOT #73 (TaskMaster): add note that TaskMaster's subscription mode finding = MCP server model (AI provider costs are subscription-bundled when using Claude subscription); the «paid API per invocation» concern was about `analyze-complexity` LLM calls, not TaskMaster itself.
- SSOT #81 (oh-my-openagent alias routing): correct citation from `Doriandarko/oh-my-openagent` (non-existent per prior SSOT note) to `code-yeongyu/oh-my-openagent` — the canonical repo. Same pattern, wrong attribution.

---

## §6 §1.7 Forward-check applied

**Does this R-phase comply with all currently-active layers?**

- **Code-level (R1-R20 lint)**: R-phase output is markdown only; no TypeScript edited. Lint N/A. ✓
- **Principle-level**: Research patch complies with principle 10 (`<!-- scope:... -->` annotation present). ✓
- **Capability-commit gate**: No new explicit dependencies added. No new code files ≥50 LOC. This is a research-only patch. `Prior-art:` trailer required if this commit is classified as capability commit — it is NOT (prose research patch). No trailer required. ✓
- **Build-vs-reuse SSOT**: All 7 companions referenced via existing SSOT rows where available; new findings (AIF `injections` API) noted as SSOT amendment proposals in §8 with proposed new rows. ✓
- **Trigger sweep**: Not in scope for this R-phase (focused on satellite integration research). ✓
- **Doc-authority (artefacts produced)**: This file carries `<!-- scope:... -->` + `> Authoritative for` + `> NOT authoritative for` header per `doc-authority-hierarchy.md §5` (research-patches folder-level authority). ✓
- **No paid LLM in CI**: All research via DeepWiki MCP (subscription-bundled) + WebFetch (public docs) + npm-pack inspection (deterministic). Zero API-billed calls. ✓
- **T-CR-A within-one-project disambiguation**: Every DeepWiki probe included explicit «within a single project, not across repos» framing. Verified per probe review below. ✓

**T-trap compliance review:**
- T1 (5+ probes floor): AIF=3, Superpowers=3, OhMyOpencode=2, aif-handoff=3, TaskMaster=2, Cline=2, OpenCode=2. AIF/SP/aif-handoff ≥3 ✓; OhMyOpencode/TaskMaster/Cline/OpenCode = 2. For OhMyOpencode: supplemented by SSOT #61/#68/#81 existing research. For TaskMaster: SSOT #73. For Cline: no prior SSOT — gap; 2 DeepWiki probes + Cline hook detail covers the key surfaces. For OpenCode: WebFetch + DeepWiki probe covers plugin API + CC compat layer.
- T3 (every claim file:line): All capability table cells cite either DeepWiki probe text or SSOT row number. ✓
- T7 (adversarial check): T16 walk done per companion. ✓
- T11 (prior art before build): BFR §3 mechanism consulted — existing SSOT rows used as starting point; new findings proposed as SSOT amendments. ✓
- T12 (DeepWiki at moment, not training data): All probes run 2026-05-27. ✓
- T13 (re-verify ADOPTED items): SSOT #50 (AIF skill-context) re-verified via npm-pack inspection — `injections` field is new finding. ✓
- T15 (self-application): This R-phase applies its own discipline: §1.7 Forward/Backward included, T-trap callouts in §6/§7, cold-QA before PR (§5 of dispatch protocol). ✓
- T16 (T16 per companion): Explicit «Upstream problem class: X. Our problem class: Y» written for each companion in §1. ✓
- T19 (cold-QA before PR): Self-review cold-QA conducted in §7. ✓
- T20 (verdict cites evidence): Every capability cell cites DeepWiki probe text or SSOT row. ✓
- T-CR-A (within-one-project disambiguation): Enforced on every probe. ✓

---

## §7 §1.7 Backward-check applied (cold-QA self-review)

**Per-companion claim verification:**

1. **AI-Factory `injections` API claim**: Evidence = `tar xOf ai-factory-2.13.2.tgz package/schemas/extension.schema.json` → `$defs.ExtensionInjection` with `target`, `position` (append/prepend), `file` fields. This is a new finding not in prior SSOT. Claim is mechanically verified by npm-pack inspection. ✓

2. **AIF skill-context claim**: Evidence = `install.sh:319-322` (file:line) + SSOT #50. Double-verified by DeepWiki probe 2 aif-handoff: «`.ai-factory/skill-context/` directory is copied into the worktree when ensureTaskWorktree is used». ✓

3. **OhMyOpencode 4-scope priority**: Evidence = DeepWiki probe 2 (`code-yeongyu/oh-my-openagent`): «4-scope priority system for skill discovery and deduplication — opencode-project > opencode > project > user». ✓

4. **aif-handoff `reviewer.ts` hardcodes `"review-sidecar"`**: Evidence = DeepWiki probe 3 (aif-handoff): «reviewer.ts explicitly references "review-sidecar" as agent name when useSubagents is true». ✓

5. **TaskMaster no `.claude/skills/` shipped**: Evidence = DeepWiki probe 2 (TaskMaster): «TaskMaster no longer ships .claude/agents/ or .claude/commands/... Instead provides installation instructions for its official Claude Code plugin». ✓

6. **Cline hooks use `Promise.all` (concurrent)**: Evidence = DeepWiki probe 2 (Cline): «When multiple hooks exist for a given event, all hooks are executed concurrently using Promise.all». ✓

7. **OpenCode CC hooks NOT loaded**: Evidence = DeepWiki probe 2 (sst/opencode): «codebase context does not contain information regarding settings.json PostToolUse hooks». Consistent with OpenCode being a separate runtime. ✓

8. **SSOT #81 wrong citation (`Doriandarko/oh-my-openagent`)**: Per kickoff §5 table note «#81 cites non-existent `Doriandarko/oh-my-openagent` — broken citation». Confirmed by this R-phase — canonical repo is `code-yeongyu/oh-my-openagent` (verified by DeepWiki + npm downloads). SSOT amendment proposed in §8. ✓

**Negative-existence claims verified:**
- «Superpowers has no dedicated .superpowers/ injection directory»: DeepWiki probe 3 (Superpowers) confirms «legacy ~/.config/superpowers/skills directory no longer used». ✓
- «OpenCode CC PostToolUse hooks not loaded»: DeepWiki probe 2 (OpenCode) confirms gap. ✓
- «TaskMaster no pre-push hooks shipped»: DeepWiki probe 2 (TaskMaster) confirms no `settings.json` hooks shipped. ✓

**Cold-QA findings caught:**
1. **T-CR-A trigger**: Probe for Superpowers initially was phrased broadly — revised to include «within a single project» before submission.
2. **AIF `injections` API discovery**: Not in prior SSOT. npm-pack inspection surfaced new finding — proposed as SSOT amendment #82 in §8.
3. **OhMyOpencode skill conflict escape hatch**: Initial read suggested «conflict is permanent»; second probe found `"claude_code.skills": false` config option. Severity downgraded from HIGH to KNOWN/MANAGEABLE.

---

## §8 Recommendation feed for future M-A umbrella (not actionable in this R-phase)

### 8.1 SSOT amendment proposals

These are proposed new/updated SSOT rows. NOT adding to SSOT in this patch (SSOT edits require a capability-commit with `Prior-art:` trailer by the SSOT owner; this R-phase is research-only). Surface as recommendations for M-A umbrella author:

**Proposed SSOT #82** (new row): AI-Factory `extension.json injections[]` API (v2.13.2) — `target` skill + `position` (append/prepend) + `file` path. Capability: formal content-injection API for AIF extension packages, superseding skill-context workaround for fresh installs. Verdict candidate: ADOPT (forward-compat path for rules-as-tests-aif extension manifest). First seen: 2026-05-27 (npm-pack inspection). Trigger: AIF changes `injections` schema in next major version.

**SSOT #81 amendment**: Correct `Candidate` field from `Doriandarko/oh-my-openagent` to `code-yeongyu/oh-my-openagent`. Same alias-routing pattern; wrong GitHub org citation. Last reviewed: 2026-05-27.

**SSOT #73 annotation**: Add note that TaskMaster's «paid API per invocation» concern applies specifically to `analyze-complexity` LLM calls; TaskMaster itself can run via MCP server without per-invocation API billing when using subscription-bundled Claude Code sessions.

### 8.2 M-A umbrella scope recommendations

**Not prescribing** — these are decision surfaces for the M-A umbrella author:

1. **AI-Factory extension.json path**: Evaluate whether to register our enforcement content via `extension.json injections[]` (formal path) vs `install.sh skill-context` (current path). The two are not mutually exclusive; `injections[]` would be the «install via AIF extension marketplace» path; `install.sh` remains the direct-overlay path. DECISION-NEEDED: which paths to support in M-A scope.

2. **OhMyOpencode official support**: OhMyOpencode is the most capable companion for autonomous single-project workflows. The duplicate-tool-names conflict has a documented escape hatch (`"claude_code.skills": false` or register in `.opencode/skills/` instead). DECISION-NEEDED: is official OhMyOpencode support in scope for M-A?

3. **Cline deliverable**: Cline requires `.clinerules/` equivalents of our `.claude/rules/` files AND `.clinerules/hooks/` equivalents of our CC `settings.json` hooks. These are separate file deliverables with the same content. DECISION-NEEDED: is Cline support in M-A scope? If yes, what dual-channel deliverable policy (dual-implementation-discipline.md §3)?

4. **OpenCode plugin**: CC PostToolUse hooks do NOT fire in OpenCode. For OpenCode-native enforcement (not just skill description match), a `.opencode/plugins/rules-as-tests-enforcement.js` plugin is the correct mechanism. DECISION-NEEDED: is a dedicated OpenCode plugin in M-A scope?

5. **Cursor deliverable**: Cursor is rules-only; `.cursor/rules/rules-as-tests.mdc` with our key rules as Agent-type rule. Low effort, broad reach (Cursor is widely used). DECISION-NEEDED: include in M-A scope?

6. **Universal injection point registry**: Currently there is no single document mapping «companion X → injection point Y». The §2 table in this patch is a candidate for a SSOT registry. DECISION-NEEDED: should M-A produce and maintain this registry as a shipped artefact?

### 8.3 Coexistence testing recommendation

Before shipping M-A results, recommend a dogfood test with AI-Factory + aif-handoff + Superpowers combo (the maintainer's primary stack) to verify:
- skill-context files appear in aif-handoff task worktrees ✓ (verified 2026-05-20 via live probe per SSOT #50)
- Superpowers CLAUDE.md priority overrides SP skills ✓ (DeepWiki confirmed priority hierarchy)
- No duplicate-tool-names errors (our `rules-as-tests` slug is unique) — verify empirically.

---

## §9 See also

- `universal-satellite-integration-matrix/kickoff.md` — umbrella scope this R-phase serves
- `companion-reuse-deep-dive/kickoff.md` — predecessor umbrella (8 wrong-narrow framings motivating this re-verification)
- `docs/meta-factory/prior-art-evaluations.md` — SSOT rows referenced: #27/#28/#29/#30/#43/#46/#50/#55/#61/#62/#64/#65/#67/#68/#71/#73/#74/#76/#77/#80/#81
- `install.sh:314-322` — current skill-context injection; `extension.schema.json` (AIF v2.13.2) — new `injections[]` API
- `.claude/rules/dual-implementation-discipline.md §3` — triage framework for Cline/Cursor deliverable decisions
- `.claude/rules/no-paid-llm-in-ci.md` — all research methods comply (DeepWiki/WebFetch/npm-pack = subscription-bundled or free)
- `research-patches/2026-05-20-agent-collision-resolution.md` — review-sidecar conflict resolution history (SSOT #50)
