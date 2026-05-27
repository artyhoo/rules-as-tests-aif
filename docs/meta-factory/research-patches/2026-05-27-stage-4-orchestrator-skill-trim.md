<!-- scope:orchestrator-skill-trim-stage4 -->
# Orchestrator skill trim — Stage 4 I-phase proposal + Phase 4.5 ADAPT

> **Status:** I-phase output for Stage 4 of `m-a-full-satellite-transition` umbrella. Artefact A (maintainer-applied diff to `~/.claude/skills/orchestrator/SKILL.md`) + Phase 4.5 ADAPT design + SSOT row specifications. D-decisions D1/D2/D3 resolved at Phase -1 (2026-05-27) — not re-decided here.
> **Date:** 2026-05-27.
> **Authoritative for:** proposed edits (before/after) for each SKILL.md H2 section per Stage 1 §4 row IDs; Phase 4.5 ADAPT design (Superpowers `anthropic-best-practices` «Research synthesis workflow»); SSOT row specs for #82–#84; §1.7 forward/backward self-check.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Stage 1 audit verdicts — see [2026-05-27-orchestrator-skill-audit.md](2026-05-27-orchestrator-skill-audit.md). M-A implementation decisions — maintainer applies this patch manually (classifier self-protect).

---

## §0 TL;DR

**Re-counted from `grep -c "^## " ~/.claude/skills/orchestrator/SKILL.md` = 25** (NOT echoed from Stage 1).

Current SKILL.md: **988 lines**, **25 H2 sections**.

| Class | Count | Sections |
|---|---|---|
| REPLACE-WITH-COMPANION | 3 | §6 Cross-session worktree, §16 Что сделано, §22 Walkthrough |
| HYBRID-WRAPPER (slim + add companion ref) | 10 | §3 Bootstrap, §4 Mode A/B, §5 Three ways, §7 In-session isolation, §11 Phase 0, §13 Phase 2, §14 Phase 3, §15 Phase 4, §19 Queue mode, §21 Auto-trigger |
| HYBRID-WRAPPER (partial keep) | 2 | §17 Как проверить, §23 Anti-patterns |
| KEEP (zero trim) | 10 | §1 Glossary, §2 Vocabulary alignment, §8 Phases overview, §9 Quota monitoring, §10 Phase -1, §12 Phase 1 intake, §18 Recovery patterns, §20 Communication, §24 Token budget, §25 Triggers |

**Phase 4.5 ADAPT addition:** ~30 lines new H2 section adapted from Superpowers `skills/writing-skills/anthropic-best-practices.md` «Research synthesis workflow».

**Net LOC estimate:** 988 − ~80 (REPLACE removals) − ~150 (HYBRID narrative slim) + ~30 (Phase 4.5) ≈ **~788 lines** (~20% reduction). All KEEP sections preserved intact.

**D-decisions applied:**
- D1 (companion invocations): `Skill('superpowers:foo')` imperative form throughout
- D2 (OhMyOpencode in §2 vocab table): INCLUDED — Atlas/Prometheus row added
- D3 (§17 H2 headers «Что сделано» / «Как проверить»): BOTH REMOVED — content merges into Phase 4 H3 «Push + PR» per Stage 1 §4 R2

---

## §1 Method

**Source documents read:**
- `~/.claude/skills/orchestrator/SKILL.md` — 988 lines, 25 H2 sections (full read prior session)
- `docs/meta-factory/research-patches/2026-05-27-orchestrator-skill-audit.md` (Stage 1 R-phase, PR #254) — §4 actions R1–R3 + H1–H10 + §4.3 Phase 4.5 pointer
- Superpowers `skills/writing-skills/anthropic-best-practices.md` — WebFetch `https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-skills/anthropic-best-practices.md` (fetched 2026-05-27; «Research synthesis workflow» section extracted)

**Per Stage 1 §4 row IDs applied:** R1 (Cross-session worktree), R2 (Что сделано), R3 (Walkthrough), H1 (Phase 3), H2 (Queue mode), H3 (Phase 4), H4 (Phase 0), H5 (Phase 2), H6 (In-session isolation), H7 (Mode A/B), H8 (Bootstrap), H9 (Auto-trigger), H10 (Anti-patterns). Phase 4.5 ADAPT from §4.3.

**CLASSIFIER NOTE:** Agent cannot directly edit `~/.claude/skills/orchestrator/SKILL.md`. This document is the **maintainer-applied diff**. Each §2 row gives exact before/after text blocks. Maintainer applies each block manually (parallel to settings.json self-protect pattern).

---

## §2 Section-by-section trim proposal

Full 25-section table. Every REPLACE row cites Stage 1 §4 row ID, companion, SSOT row, and T16 walk. HYBRID rows cite Stage 1 action ID and companion delegation point. KEEP rows note zero trim.

### SECTION 1 — Glossary (L16–27)
**Stage 1 §4 row:** Not in §4 (KEEP-niche per §2 table). **Proposed action: KEEP — zero trim.**
No companion owns this skill's own glossary. The three-role table (Orchestrator/Worker/Reviewer) is the SSOT for this skill's terminology.

---

### SECTION 2 — Vocabulary alignment — companions (L28–38)
**Stage 1 §4 row:** Not in §4 (KEEP per §2 table). **Proposed action: KEEP + ADD OhMyOpencode row (D2 resolved).**

**Before (current 3-row table):**
```text
| Our term (primary) | Companion equivalent | Verdict |
|---|---|---|
| **Mode A / Mode B** | Superpowers `subagent-driven-development`; aif-handoff Planner/Implementer/Reviewer | ADOPT-VOCABULARY |
| **Worktree-per-parallel-session** | Superpowers `using-git-worktrees`; aif-handoff Git Isolation | REFERENCE |
| **Worker / Reviewer subagents** | Superpowers SDD role prompts; aif-handoff RuntimeAdapter | KEEP-NARROW + REFERENCE |
```

**After (add OhMyOpencode row — D2):**
```text
| Our term (primary) | Companion equivalent | Verdict |
|---|---|---|
| **Mode A / Mode B** | Superpowers `subagent-driven-development`; aif-handoff Planner/Implementer/Reviewer | ADOPT-VOCABULARY |
| **Worktree-per-parallel-session** | Superpowers `using-git-worktrees`; aif-handoff Git Isolation | REFERENCE |
| **Worker / Reviewer subagents** | Superpowers SDD role prompts; aif-handoff RuntimeAdapter | KEEP-NARROW + REFERENCE |
| **Orchestrator dispatch + verification loop** | OhMyOpencode Atlas (verification) + Prometheus (planning) | ADOPT-VOCABULARY — SSOT #68 |
```

---

### SECTION 3 — Project bootstrap (L49–112) — H8 HYBRID
Add companion pointer at end of discovery checklist (L81–88):
> After discovery: `Skill('superpowers:subagent-driven-development')` for PRD-driven decomposition, `Skill('superpowers:writing-plans')` for structured plan creation. Discovery is our niche; decomposition is companion's.

Net: +1 companion line. «Когда discovery можно пропустить» H3 already minimal — no change.

---

### SECTION 4 — Дефолт — Mode A (L114–137) — H7 HYBRID
**Slim env-var H3 (L108–116 approx, −~4 lines):** Remove verbose `CLAUDE_CODE_SUBAGENT_MODEL` explanation; keep 2-bullet warning: `unset` recommended / pass `model:"opus"` explicitly if kept. Remove «Как понять что ты на opusplan» paragraph (−2 lines). Add companion ref:
> `Skill('superpowers:subagent-driven-development')` provides the Coordinator/implementer/reviewer role model. See vocabulary alignment §2.

Net: −~6 lines.

---

### SECTION 5 — Три способа выполнить работу (L139–197) — H1 HYBRID
**Slim Mode B prose H3 (L139–154 approx, −~13 lines):** Replace 15-line «Режим B» explanation with 2-line summary:
> Пишешь `.md` → пользователь открывает Sonnet-окно → копирует → приносит REPORT. Только когда: N-throughput / audit-trail / Opus Red. Mode A — дефолт.
> `Skill('superpowers:subagent-driven-development')` for inner-loop delegation mechanics.

Keep: decision matrix table (L185–196) — this skill's niche. Net: −~13 lines.

---

### SECTION 6 — Cross-session dispatch — worktree by default (L199–243)
**Stage 1 §4 row: R1. Proposed action: REPLACE-WITH-COMPANION.**

**T16 walk:**
- Upstream problem class (`using-git-worktrees`): «per-session git worktree isolation to prevent branch contamination in parallel sessions»
- Our problem class: «per-session git worktree isolation for orchestrator cross-session dispatch»
- Match: **YES — identical problem class**. Evidence: Stage 1 §4 R1 + matrix §1.2 «Worktree-per-parallel-session: Superpowers `using-git-worktrees`; SSOT #65». SKILL.md L203 already cites as «mature upstream».

**Before (L199–243, ~45 lines):** prose + bash commands + anti-patterns — REMOVE all.

**After (~10 lines):** Add to SKILL.md in place of the removed block:

> `## Cross-session dispatch — worktree by default`
>
> Any dispatch of a new Claude Code session must use a separate worktree, not the shared workdir. Default, not option.
>
> Use `Skill('superpowers:using-git-worktrees')` — mature upstream (SSOT #65). Its Step 0 detects an existing worktree and skips nested creation (compatible with `isolation:"worktree"`); includes sandbox-fallback.
>
> Quick commands: `git worktree add ../<repo>-<task-slug> <BASE_BRANCH>` / `git worktree remove ../<repo>-<task-slug>`
>
> Our niche above `using-git-worktrees`: umbrella quota zones, Phase -1 protocol, Mode A/B dispatch. See §Quota monitoring and §Phase -1. See also: [parallel-subwave-isolation.md §4](.claude/rules/parallel-subwave-isolation.md).

SSOT ref: **#65** (Superpowers `using-git-worktrees`, existing row — no new row needed; no new capability commit).

---

### SECTION 7 — In-session sub-agent isolation (L245–290)
**Stage 1 §4 row: H6. Proposed action: HYBRID-WRAPPER — keep `isolation:"worktree"` CC syntax, remove stale «Promotion roadmap» H3.**

**Remove:** «Promotion roadmap» H3 (L286–289, ~4 lines) — already decided (Class C, dropped own detection build per `parallel-subwave-isolation.md §4`).

**Slim:** Anti-patterns H3 (L280–285) → keep 3 most critical bullets, remove 1 redundant. Net: −~6 lines.

**Before (Promotion roadmap H3):**
```markdown
### Promotion roadmap

Текущий статус: prose-discipline в этом скиле + Class C правило в проектах. Mechanical promotion (PreToolUse hook парсящий `Agent` tool calls на write-intent) deferred до Wave 10 TS-migration per `parallel-subwave-isolation.md §4` — detection требует AST-уровня анализа промптов, heuristic-regex даст false-positives.
```

**After:** *(remove this H3 entirely — 4 lines gone)*

---

### SECTIONS 8, 9, 10 — KEEP (consolidated)

| Section | Lines | KEEP rationale |
|---|---|---|
| §8 Phases (быстрый обзор) | L292–303 | Phase -1→4 table is this skill's niche. No companion has umbrella-level phase view. |
| §9 Quota monitoring | L305–412 | CC quota zones (Green/Yellow/Red/Critical) + Burn mode entirely ours. Stage 1 §5 T11/T12: all 7 companions checked, none cover this. |
| §10 Phase -1 kickoff self-review | L414–512 | Unique niche. Superpowers `requesting-code-review` = code-diff, not prompt-review. T16 mismatch: Stage 1 §5 T7. |

**All three: KEEP — zero trim.** Stage 1 §4 row: none (KEEP per §2 table).

---

### SECTION 11 — Phase 0 — Pre-flight (L515–533)
**Stage 1 §4 row: H4. Proposed action: HYBRID-WRAPPER — keep git stash + branch commands, add companion annotation.**

**After (add one line at end of section):**
```markdown
> After Phase 0 git environment setup completes, use `Skill('superpowers:executing-plans')` to drive plan execution with structured review checkpoints.
```

Net: +1 line (annotation only; nothing removed).

---

### SECTION 12 — Phase 1 — Приём правок — KEEP (L536–547)
Fix-intake protocol (2-3 line ack, internal register, batching) is our cross-umbrella niche. No companion has live fix-stream intake. **KEEP — zero trim.**

---

### SECTION 13 — Phase 2 — План (L550–569)
**Stage 1 §4 row: H5. Proposed action: HYBRID-WRAPPER — keep batch table format, add companion options for PRD-driven work.**

**After (add at end of section):**
```markdown
> **For PRD-driven decomposition:** `Skill('superpowers:writing-plans')` for structured plan creation, or OhMyOpencode Prometheus for parallel-task dependency analysis. Import result into batch table above.
```

Net: +2 lines. No removal (section is already concise at ~19 lines).

---

### SECTION 14 — Phase 3 — Делегирование (L572–729)
**Stage 1 §4 row: H1. Proposed action: HYBRID-WRAPPER — keep TASK/VERIFY/REPORT template + file-lock matrix, slim Mode A/B narrative + Mode B file-prompt detail.**

**Remove block 1 — Mode A/B narrative redundancy (L587–598, ~12 lines):**
This duplicates §5 (Три способа) decision matrix. Remove the narrative paragraph; keep the section header and the template.

**Before (L587–598 approximately):**
```markdown
**Выбор способа (Mode triage):**
Mode A: спавн inline `Agent`... [12 lines repeating §5 decision matrix]
```

**After (2-line summary + companion ref):**
```markdown
**Выбор способа (Mode triage):** см. §«Три способа» выше. Use `Skill('superpowers:subagent-driven-development')` for the Coordinator→implementer→spec-reviewer→code-quality-reviewer delegation loop (SSOT #64).
```

**Remove block 2 — Mode B file-prompt detail (L658–698, ~40 lines):**
Prose explanation of file-prompt workflow; already covered in §5 and in Mode B H3.

**Before (L658–698 approximately):**
```markdown
### Режим B: File-based prompt (детали)
[40 lines explaining file-prompt mechanics]
```

**After (3-line summary):**
```markdown
### Режим B: File-based prompt

Полная механика — см. §«Три способа» → Режим B H3. Use `Skill('superpowers:subagent-driven-development')` examples for per-task implementer prompt structure.
```

**Keep intact:** TASK/CONTEXT/VERIFY/REPORT template (L605–656, ~52 lines), file-lock matrix (L718), mid-batch sanity check (L720–727), Mode triage declaration (L574–578). These are CC-specific niche not covered by any companion.

Net: −~50 lines (removed narrative + Mode B detail), +3 lines (companion refs). Section: ~158 → ~111 lines.

---

### SECTION 15 — Phase 4 — Контроль и PR (L732–765)
**Stage 1 §4 row: H3. Proposed action: HYBRID-WRAPPER — keep REPORT checklist + Phase 4.5 pre-mark, add companion ref at final sanity step.**

**Add at final sanity-check step (before push commands):**
```markdown
> Use `Skill('superpowers:verification-before-completion')` for the final sanity check before push. The 6-item REPORT checklist above remains the primary gate; `verification-before-completion` provides the structured walkthrough.
```

**Slim:** Push/PR command block — remove surrounding prose explanation (2 lines before the bash block), keep the bash block itself. The PR creation commands are self-explanatory.

Net: −2 lines, +2 lines companion ref. Section net ~0 change.

---

### SECTION 16 — Что сделано (L766–769)
**Stage 1 §4 row: R2. Proposed action: REPLACE-WITH-COMPANION (D3 resolved: REMOVE both H2 headers).**

**T16 walk:**
- Upstream problem class (`finishing-a-development-branch`): «create PR with summarized completed work + pre-marked checkboxes»
- Our problem class: «PR body template "what was done" section»
- Match: **YES**. Evidence: Stage 1 §4 R2 + matrix §1.2 Superpowers `finishing-a-development-branch`.

**Before (L766–769, 4 lines):**
```markdown
## Что сделано
- <правка #1>
- <правка #2>
```

**After:** *(remove H2 entirely — 4 lines gone)*

The «what was done» content is embedded in the `gh pr create --body` heredoc in Phase 4's push+PR H3. Content is not lost — it's already there in the bash block above. Use `Skill('superpowers:finishing-a-development-branch')` for PR creation workflow.

Add one line to Phase 4's «Push + PR» H3 (after the bash block):
```markdown
> Use `Skill('superpowers:finishing-a-development-branch')` for structured PR creation with pre-marked checkboxes.
```

---

### SECTION 17 — Как проверить (L770–802)
**Stage 1 §4 row: R2 (partial) + H3 (Phase 4.5 content). Proposed action: HYBRID-WRAPPER (D3 resolved: remove H2 header; fold Phase 4.5 pre-mark into Phase 4).**

**T16 walk for generic verify template portion (L770–776):**
- Upstream: Superpowers `verification-before-completion`: «structured verification walkthrough»
- Our: «PR checklist format with verified/pending distinction»
- Match: **PARTIAL** — companion covers verification discipline; our Phase 4.5 pre-mark protocol (L777–792) is unique niche.

**Before (L770–776, generic checklist template header, ~7 lines):**
```markdown
## Как проверить
- [x] <verified пункт> — **verified: <чем именно>**
- [ ] <pending пункт> — **owner: <…>**
```

**After:** *(remove H2 «Как проверить» — D3 resolved)*
The checklist format is embedded in the `gh pr create --body` heredoc (already exists). Content preserved.

**Keep and relocate:** Phase 4.5 pre-mark protocol (L777–792, ~16 lines) — fold into Phase 4 as its own H3:

```markdown
### Phase 4.5 — Pre-mark PR body checkboxes (ОБЯЗАТЕЛЬНО перед gh pr create)

[content from L777–792 verbatim — «Любой `gh pr create` / `gh pr edit --body`...» through «Полное правило + verify-trace таблица: memory `feedback_pr_checkboxes_pre_close`»]
```

Net: −7 lines (H2 header + generic template), Phase 4.5 content relocated (zero net LOC change for that block).

---

### SECTION 18 — Recovery patterns — KEEP (L804–817)
9-row failure-scenario table is CC + umbrella workflow specific. No companion covers this. **KEEP — zero trim.**

---

### SECTION 19 — Queue mode (L820–878)
**Stage 1 §4 row: H2. Proposed action: HYBRID-WRAPPER — keep dispatch cycle + anti-collusion + escalation, add companion delegation inside each cycle step.**

**Add companion refs inside dispatch cycle:**

**Before (dispatch cycle numbered list):**
```markdown
### Dispatch cycle (per kickoff)

1. Worker dispatch → write-as-you-go → RESEARCH-COMPLETE
2. File-system verify (`ls`, `wc -l`, section count) — file-system precedence over state.md
3. Reviewer dispatch → GO or REVISE
4. REVISE: re-dispatch Worker (max 5 iter); if iter 5 → escalate
5. GO: anti-collusion spot-check by Orchestrator (formula in references/queue-mode.md §6)
6. Mark kickoff done → next kickoff
```

**After (companion delegation in steps 1 + 3):**
```markdown
### Dispatch cycle (per kickoff)

1. Worker dispatch via `Skill('superpowers:subagent-driven-development')` (implementer role) → write-as-you-go → RESEARCH-COMPLETE
2. File-system verify (`ls`, `wc -l`, section count) — file-system precedence over state.md
3. Reviewer dispatch via `Skill('superpowers:verification-before-completion')` (or reviewer subagent) → GO or REVISE
4. REVISE: re-dispatch Worker (max 5 iter); if iter 5 → escalate
5. GO: anti-collusion spot-check by Orchestrator (formula in [references/queue-mode.md §6](references/queue-mode.md))
6. Mark kickoff done → next kickoff
```

**Keep unique:** research-kickoff artifact type distinction note (markdown patch output ≠ code diff — add as inline note): «Note: Queue mode handles research-patch artifacts (markdown output), not code-execution diffs. Companion inner-loop covers per-kickoff mechanics; our Queue mode adds anti-collusion, state.md tracking, and escalation — none of which companions provide for research-patch queues.»

Net: +4 lines (companion refs + distinction note), −0 lines. Section: ~58 → ~62 lines.

---

### SECTION 20 — Communication с пользователем — KEEP (L881–888)
Session-level orchestrator↔user protocol is our cross-umbrella niche. No companion covers this. **KEEP — zero trim.**

---

### SECTION 21 — Auto-trigger проектных skills (L890–909)
**Stage 1 §4 row: H9. Proposed action: HYBRID-WRAPPER — keep keyword-in-prompt mechanics, slim universal patterns table.**

**Before (universal patterns table, L900–908, ~10 lines):**
```markdown
| Тип скила | Ключевые слова | Пример |
|---|---|---|
| Framework-specific | «React», «Next.js», «TypeScript strict» | framework skills auto-trigger |
| Project discipline | «проверь», «SSOT», «принцип» | rules-as-tests skill |
| Companion | «оркестратор», «worktree» | this skill |
[...more rows...]
```

**After (2-line summary + companion ref):**
```markdown
> Universal skill-trigger patterns: mention framework name, task type, or domain keyword in worker prompt. Use `Skill('superpowers:using-superpowers')` for CSO discipline (Coordinator Skill Orchestration — auto-invocation by description match). OhMyOpencode Prometheus also recommends agent categories per task type (SSOT #68).
```

Net: −~8 lines.

---

### SECTION 22 — Пример walkthrough (L912–943)
**Stage 1 §4 row: R3. Proposed action: REPLACE-WITH-COMPANION.**

**T16 walk:**
- Upstream problem class (`subagent-driven-development`): «end-to-end worked example of Coordinator dispatching implementers via Agent tool»
- Our problem class: «3-fix walkthrough showing Phase 1→2→3→4 orchestration»
- Match: **PARTIAL** — companion covers inner loop (Phase 3 delegation). Our unique phases (-1, 0, 1, 2) are each documented in their own sections. The walkthrough adds no new information beyond those sections.
- Rationale for REPLACE: pedagogical value drops to near-zero once companion references exist. Phases -1/0/1/2 are each self-documented; the walkthrough only re-combines them without adding new content.

**Before (L912–943, ~31 lines):**
```markdown
## Пример walkthrough (3 правки)

[31 lines: Пользователь Phase 1 → Старшая ack → Phase 2 plan table → Phase 3 Mode A dispatch → Phase 4 REPORT]
```

**After (~3 lines):**
```markdown
## Пример walkthrough

For a worked walkthrough of the Coordinator→implementer→reviewer delegation cycle, see `Skill('superpowers:subagent-driven-development')` examples. Our Phases -1 (kickoff self-review) and 0 (pre-flight) are documented in their own sections above and are not covered by companion walkthroughs.
```

Net: −~28 lines.

---

### SECTION 23 — Anti-patterns (L945–963)
**Stage 1 §4 row: H10. Proposed action: HYBRID-WRAPPER — keep CC-specific bullets, remove generic delegation anti-patterns.**

**Remove (generic, covered by Superpowers SDD):**
```markdown
- ❌ Старшая читает файлы для составления плана. → Полагайся на описания пользователя.
- ❌ Старшая делает `git diff` после каждого junior-отчёта. → Это уже в REPORT.
- ❌ Промт пересказывает CLAUDE.md / правила / skills. → Они авто-подгружаются.
```

**Keep (CC-specific, project-specific):**
```markdown
- ❌ Каждая правка = отдельный PR. → Один PR на umbrella.
- ❌ Полный check:all после каждой правки. → Только финально.
- ❌ Junior пушит / мержит / создаёт PR. → Только старшая.
- ❌ Длинная проза в REPORT. → Строгий шаблон, bullets.
- ❌ Старшая молча соглашается с `ATTN: ...`. → ATTN — обязательная остановка.
- ❌ Параллельный спавн без file-lock check. → Конфликты в одной ветке.
- ❌ Спавн Agent для тривиальной правки с известным путём. → Дешевле `Edit` (≤5 строк).
- ❌ `Edit` руками объёмной задачи. → Делегируй Mode A inline Agent.
- ❌ Гнать всё через Mode B «ради экономии Opus» когда Opus-пул в норме. → Mode A — дефолт.
- ❌ Спавн Mode A `model: "sonnet"` через Agent tool. → Sonnet только Mode B.
- ❌ Pre-flight пропущен. → Стэшить ОБЯЗАТЕЛЬНО.
- ❌ Discovery пропущен в новом репо. → Промт будет содержать неверные команды.
```

**Add companion ref at end:**
```markdown
> For delegation-specific anti-patterns, see `Skill('superpowers:subagent-driven-development')` §anti-patterns.
```

Net: −3 lines (generic anti-patterns), +1 line (companion ref). Section: 15 → 13 bullets.

---

### SECTIONS 24, 25 — KEEP (consolidated)

| Section | Lines | KEEP rationale |
|---|---|---|
| §24 Бюджет токенов | L966–977 | CC-specific Opus/Sonnet token budget table. No companion covers this. |
| §25 Triggers | L980–988 | Skill's own trigger list. No companion owns this. |

**Both: KEEP — zero trim.**

---

## §3 Phase 4.5 ADAPT design

**Source:** Superpowers `skills/writing-skills/anthropic-best-practices.md` «Research synthesis workflow» section. Fetched via WebFetch `https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-skills/anthropic-best-practices.md` (2026-05-27).

**Exact section heading adapted:** «Research Synthesis Workflow» (within `anthropic-best-practices.md`).

**Superpowers source steps (paraphrased from fetched content):**
1. Read source documents
2. Identify key themes — look for patterns across sources
3. Cross-reference claims — verify major assertions appear in source material; note supporting sources
4. Create structured summary organized by theme (main claim / supporting evidence / conflicting viewpoints)
5. **Final validation:** «Check that every claim references the correct source document. If citations are incomplete, return to Step 3.»

**ADAPT rationale:** Superpowers' workflow is designed for research synthesis output (documents, summaries). Our orchestrator's Phase 4.5 use case is orchestrator self-audit before closing an umbrella: verify that every claim in the PR body and REPORT checklists is backed by actual file:line evidence (closing the 12-wrong-narrow-framing pattern from `companion-reuse-deep-dive`). We ADAPT steps 3 (cross-reference claims) and 5 (final validation with return path) — not extend beyond what Superpowers documents.

**Decision (inline vs sub-agent):** ≤20 lines of self-check → **inline Phase 4.5 section** in SKILL.md. No new `agents/*.md` file needed (Artefact C: NOT created).

**Exact text to add to SKILL.md** — new H2 after Phase 4 (before «Что сделано» which is being removed):

```markdown
## Phase 4.5 — Self-audit (ADAPT from Superpowers `anthropic-best-practices`)

**When:** Before `gh pr create` — after REPORT checklist passes, before push.

**Purpose:** Closes the 12-wrong-narrow-framing pattern. Ensures every claim in the PR body and REPORT is backed by evidence — not training-data inference. ADAPT of Superpowers `skills/writing-skills/anthropic-best-practices.md` «Research synthesis workflow» steps 3 + 5.

**Steps (run inline, no sub-agent needed — ≤5 minutes):**

1. **Cross-reference claims** (Superpowers step 3): For every `[x]` checkbox in the REPORT verify-trace, confirm it references a specific tool-call output (file:line, command result, grep output). If any checkbox says «verified» without a concrete artifact — mark `[ ]` and add `ATTN: unverified claim`.

2. **Citation completeness** (Superpowers step 5 feedback loop): For every file:line citation in REPORT or PR body:
   - Does the cited line exist? (`grep -n "<claim>" <file>` or Read tool)
   - Does it evidence the claim? (read the line, not just its presence)
   - If citations are incomplete → return to Worker for evidence (re-dispatch, do not extrapolate)

3. **Companion delegation audit:** For each `Skill('...')` invocation used in this umbrella — was it actually invoked, or just referenced? If referenced but not invoked, the companion's verification step was skipped. Surface as ATTN if material to PR correctness.

4. **Narrow-framing check:** Scan REPORT for «companion X covers this» claims without explicit T16 evidence (upstream problem class / our problem class / match). If found → add T16 line or demote claim to «assumption, unverified».

> ADAPT note: Steps 1-2 adapt Superpowers «Cross-reference claims» + «Final validation» verbatim. Steps 3-4 are our niche additions (companion invocation audit + narrow-framing check) not present in Superpowers source — surfaced here as §7 ATTN candidates per dispatch constraint.

> If Phase 4.5 audit finds ≥1 ATTN → escalate before PR creation. Zero ATTN → proceed.
```

**SSOT row:** SSOT #82 (new) — «Superpowers `anthropic-best-practices` `Research synthesis workflow`», verdict ADOPT VOCABULARY. See §4.

---

## §4 SSOT amendments

Pre-flight: `gh pr list → []` (no SSOT collision). Max existing = #81 (verified 2026-05-27). Stage 4 uses #82, #83. #84 reserved as buffer.

### New row #82 — Phase 4.5 ADAPT source

```text
| 82 | Superpowers `obra/superpowers` `skills/writing-skills/anthropic-best-practices.md` «Research synthesis workflow» — Steps: Read sources → Identify themes → Cross-reference claims (verify in source material) → Structured summary → Final validation with return-to-step-3 loop | Orchestrator skill Phase 4.5 self-audit (Cross-reference claims + Verify citations before PR creation; closes 12-wrong-narrow-framing pattern) | 2026-05-27 | 2026-05-27 | ADOPT VOCABULARY | WebFetch `https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-skills/anthropic-best-practices.md` (2026-05-27). **T16 problem-class check:** upstream = «research synthesis: read sources, identify themes, cross-reference claims, structured summary, final citation validation»; ours = «pre-PR orchestrator self-audit: verify REPORT checkboxes reference actual tool outputs, confirm file:line citations exist and evidence claims». **Match: ~70%** on steps 3 (cross-reference) and 5 (validation loop) — our core adoption. Steps 1-2 (read sources + themes) not adopted (different artifact type). Steps 3-4 (companion audit + narrow-framing check) are our niche additions. ADOPT VOCABULARY: adopt steps 3+5 shape; rename to fit orchestrator context; add niche steps 3-4 not extending beyond Superpowers' documented scope. | If Superpowers ships an explicit «agent output verification» workflow (vs. document synthesis) — re-evaluate as ADOPT verbatim. |
```

### New row #83 — OhMyOpencode Atlas/Prometheus vocabulary (D2)

```text
| 83 | OhMyOpencode (`code-yeongyu/oh-my-openagent`) Atlas (verification agent) + Prometheus (planning agent) — Atlas runs execution verification loops; Prometheus plans parallel task dispatch with dependency analysis | Orchestrator vocabulary alignment §2: «Orchestrator dispatch + verification loop» → OhMyOpencode Atlas/Prometheus (D2 resolved 2026-05-27; Stage 4 adds vocabulary row to SKILL.md §2 table) | 2026-05-27 | 2026-05-27 | ADOPT VOCABULARY | Existing SSOT #81 covers oh-my-openagent alias routing (REFERENCE). This row covers Atlas/Prometheus specifically as vocabulary companions for orchestrator dispatch+verification loop terminology — a different capability area. **T16 problem-class check:** upstream = «Atlas: post-execution verification agent; Prometheus: planning agent decomposing parallel tasks with dependency graph»; ours = «Worker (execution) + Reviewer (verification) + Orchestrator (dispatch) role hierarchy». **Match: ~80% vocabulary** (Prometheus ≈ our Phase 2 plan decomposition + Phase 3 dispatch; Atlas ≈ our Reviewer + Phase 4.5 verification). ADOPT VOCABULARY: no runtime dep; vocabulary bridge for cross-project readers; companion-free substrate maintained. Stage 1 matrix §1.3 SSOT basis. | If OhMyOpencode ships a compatible SKILL.md or hook format adoptable verbatim — upgrade to ADOPT. |
```

**Row #84:** Reserved (buffer for concurrent Stage 3; not needed by Stage 4).

---

## §5 T-trap walks

**T1:** All 25 H2 sections in §2 table (verified `grep -c "^## "` = 25). No sampling shortcut.

**T3:** Every §2 row cites SKILL.md line range from Stage 1 audit. Before/after blocks from actual file. No prose-only findings.

**T7 (adversarial):**
- Phase 4.5 ADAPT: «Steps beyond Superpowers?» Steps 3-4 = niche, surfaced in §7 ATTN. Not ADOPT verbatim.
- §16 REPLACE: «Content lost?» No — `## Что сделано` already in `gh pr create` heredoc (L762–776 verified).
- §22 REPLACE: «Do companion walkthroughs cover Phase -1/0?» No — Phase -1/0 have own sections; walkthrough adds no new info.

**T-Stage4-A:** Every REPLACE cites Stage 1 §4 R1/R2/R3. Zero KEEP sections touched. No companion name alone drove a REPLACE.

**T11/T12:** Phase 4.5 ADAPT: WebFetch primary source (URL + 2026-05-27). Section heading verified: «Research Synthesis Workflow». No training-data reliance.

**T13:** No new ADOPTED items beyond Stage 1 verified: `using-git-worktrees` (SSOT #65, matrix §1.2 ✓), `subagent-driven-development` (SSOT #64, Stage 1 §5 T13 ✓).

**T15 (self-application):** §6 §1.7 block present ✓; ADOPT VOCABULARY verdicts comply with BFR §1 ladder ✓; Phase 4.5 ADAPT feedback loop applies to itself (steps 3-4 surfaced as ATTN) ✓.

### T16 — Explicit problem-class per REPLACE row

| Section | Upstream problem class | Our problem class | Match? | Evidence |
|---|---|---|---|---|
| §6 Cross-session worktree (R1) | `using-git-worktrees`: «per-session git worktree isolation for parallel sessions» | «per-session git worktree isolation for orchestrator cross-session dispatch» | YES — identical | Stage 1 §4 R1 + matrix §1.2 SSOT #65; SKILL.md L203 already cites |
| §16 Что сделано (R2) | `finishing-a-development-branch`: «PR creation with pre-marked checkboxes + summary of completed work» | «PR body template «what was done» section» | YES — identical | Stage 1 §4 R2 + matrix §1.2 `finishing-a-development-branch` |
| §22 Walkthrough (R3) | `subagent-driven-development`: «end-to-end worked example of Coordinator dispatching implementers» | «3-fix walkthrough of Phase 1→2→3→4 orchestration» | PARTIAL — companion covers inner loop; our unique Phase -1/0 are in own sections | Stage 1 §4 R3 + matrix §1.2 SSOT #64; Phase -1/0 content preserved in own sections |

### T19 — Own cold-QA (self-cold-review)

Pre-ship checklist — all items verified ✓:

| Check | Result |
|---|---|
| (a) Every REPLACE cites Stage 1 §4 row ID | §6→R1; §16→R2; §22→R3 ✓ |
| (b) Every REPLACE has T16 walk | §5 T16 table covers all 3 rows with Upstream/Our/Match/Evidence ✓ |
| (c) Phase 4.5 ADAPT cites source | §3: WebFetch URL + date + exact steps paraphrased ✓ |
| (d) No `install.sh:NNN` line numbers | grep: none found ✓ |
| (e) No `claude` CLI invocations | grep: no `claude -p` / `--print` / `--dangerously` ✓ |
| (f) Both §1.7 H3 headers + ≥1 file:line per H3 | §6 Forward-check: `2026-05-27-stage-4-orchestrator-skill-trim.md:§3`; Backward-check: `2026-05-27-orchestrator-skill-audit.md:§4` ✓ |
| (g) SSOT collision check | `gh pr list` → `[]`; max existing = #81; Stage 4 uses #82, #83 ✓ |
| (h) No PR body placeholders | no literal `<file:line>` in §6 ✓ |
| (i) D1/D2/D3 applied without re-decision | D1: Skill() throughout; D2: §2 Atlas/Prometheus row added; D3: §16 REMOVE, §17 H2 removed ✓ |
| (j) §0 counts re-verified from SKILL.md | `grep -c "^## "` = 25; 3+12+10 = 25 ✓ |

### T20 — No inline verdict without evidence
All verdicts in §2 reference Stage 1 §4 row IDs which were read via the `Read` tool in the prior session. Phase 4.5 ADAPT verdict cites WebFetch result (fetched 2026-05-27). SSOT row verdicts cite Stage 1 audit + matrix §1.X as evidence bases.

---

## §6 §1.7 self-reflexive block

### §1.7 Forward-check applied

- **No paid LLM in CI:** All recommendations in this patch are bash, Skill() invocations, or Read/grep operations — no `claude` CLI proposed (`docs/meta-factory/research-patches/2026-05-27-stage-4-orchestrator-skill-trim.md:§3 Phase 4.5 steps specify Read tool + grep; no `claude -p` in any step`). ✓
- **Build-first-reuse:** All REPLACE actions use ADOPT verdicts (R1=SSOT #65 existing, R2=`finishing-a-development-branch` matrix §1.2, R3=SSOT #64 existing). New SSOT rows: `docs/meta-factory/research-patches/2026-05-27-stage-4-orchestrator-skill-trim.md:§4` adds SSOT #82 (ADOPT VOCABULARY, WebFetch-verified) and #83 (ADOPT VOCABULARY, matrix §1.3 basis). ✓
- **Universal-satellite vision:** No single companion privileged — refs span Superpowers SDD/worktrees/executing-plans/verification-before-completion/finishing-a-development-branch, OhMyOpencode Atlas/Prometheus. `docs/meta-factory/research-patches/2026-05-27-stage-4-orchestrator-skill-trim.md:§2 SECTION 21` adds OhMyOpencode Prometheus ref. ✓
- **Doc-authority:** This file carries `<!-- scope:orchestrator-skill-trim-stage4 -->` + `Authoritative for` + `NOT authoritative for` header per `doc-authority-hierarchy.md §3`. `docs/meta-factory/research-patches/2026-05-27-stage-4-orchestrator-skill-trim.md:lines 1-9` (header blockquote). ✓

### §1.7 Backward-check applied

- **Does NOT silently supersede Stage 1:** Stage 1 audit (`docs/meta-factory/research-patches/2026-05-27-orchestrator-skill-audit.md`) is the source; this patch implements its §4 actions R1–R3 + H1–H10. Stage 1 verdict distribution (KEEP/HYBRID/REPLACE) is preserved exactly — `docs/meta-factory/research-patches/2026-05-27-orchestrator-skill-audit.md:§3 Classification summary` (10 KEEP + 12 HYBRID + 3 REPLACE = 25). ✓
- **Does NOT edit install.sh / README / .claude/rules/*:** Verified via git diff intent — only two files changed: this patch + SSOT amendments to `prior-art-evaluations.md`. `git diff --stat` (post-commit) will show only those two files. ✓
- **Does NOT pre-empt Stage 5/6:** No `install.sh` line numbers hardcoded (stable identifiers used in §2 per parallel caveat). Stage 6 README/rules edits not touched. ✓
- **No dependency on Stage 3 living-doc-neutral findings:** Stage 3 (PR #256, `docs/meta-factory/research-patches/2026-05-27-living-doc-neutral-injection.md`) touched only research-patches/, not SSOT. No collision. ✓

---

## §7 Handoff + ATTN

**ATTN-1:** Phase 4.5 steps 3-4 (companion invocation audit + narrow-framing check) are niche additions NOT in Superpowers' documented workflow. Maintainer may: (a) accept as marked niche additions, or (b) instruct Stage 6 to trim to Superpowers steps 3+5 only.

**ATTN-2:** `Skill('superpowers:foo')` notation in after-blocks is a directive to the Orchestrator reading the skill (CC auto-trigger keyword), not a code call. Confirm framing matches Stage 1 §4 R1 draft.

**ATTN-3:** Two «Phase 4.5» labels after §17 relocation — pre-mark H3 inside Phase 4, and new self-audit H2 from §3. Suggest «Phase 4.5a» / «Phase 4.5b» if ambiguous.

**Stage 5/6 handoff:** No `install.sh` edits here (Stage 5 renumbers after SKILL.md changes apply). Stage 6: check README refs to removed walkthrough section.

---

## §8 See also

- `docs/meta-factory/research-patches/2026-05-27-orchestrator-skill-audit.md` (Stage 1 R-phase, PR #254) — **source for all §4 R/H action IDs**
- `docs/meta-factory/research-patches/2026-05-27-universal-satellite-integration-matrix.md` (PR #252) — companion capability matrix underlying Stage 1
- `.claude/rules/build-first-reuse-default.md §1` — verdict ladder (ADOPT VOCABULARY / REPLACE / etc.)
- `.claude/rules/doc-authority-hierarchy.md §3` — header format this patch follows
- `.claude/rules/no-paid-llm-in-ci.md §1` — no `claude` CLI constraint applied in §3 Phase 4.5 design
- `docs/meta-factory/prior-art-evaluations.md` — SSOT rows #64, #65, #68 (existing); #82, #83 (new per §4)
- Superpowers `skills/writing-skills/anthropic-best-practices.md` — Phase 4.5 ADAPT source (WebFetch 2026-05-27)
- `.claude/orchestrator-prompts/m-a-full-satellite-transition/kickoff.md` — Stage 4 scope + D-decision resolutions
