# Output format — `/pipeline <umbrella>` inline session report

> **Authoritative for:** the 3-layer structure shape emitted by `/pipeline <umbrella>` invocations — §1 grammar, §2 dependency-graph template, §3 action-queue template, §4 1-liner block grammar, §5 four worked examples (Mode A / SDD / Mode B × N / Queue mode), §6 anti-patterns for 1-liner format. Principle 18 (`packages/core/principles/18-meta-orchestrator-output-format.test.ts`) enforces the literal substrings below.
> **NOT authoritative for:** project goal — see [`../../../../README.md#why-this-exists`](../../../../README.md#why-this-exists). The `/pipeline` skill body authority — see [`../SKILL.md`](../SKILL.md).

> **Origin:** F.3 (2026-05-24). The 3-layer structure synthesises F.1 prior-art (PR #203) — Argo Workflows' `├── / └──` ASCII tree (ADAPT vocabulary, SSOT row TBA) + maintainer's binding 1-liner format refinement (parent kickoff §1 Sub-wave F.3 lines 237-254). The slash-tag draft (`/Mode-A /Roles-… /Skills-…`) was rated «not convenient» by the maintainer and has zero upstream precedent across 10 surveyed tools (GHA, Concourse, Argo, Dagger, just, LangGraph, Cline, Superpowers, gh workflow run, orchestrator-guide).

---

## §1 Top-level shape

Every `/pipeline <umbrella>` invocation that proceeds to dispatch (i.e. plan-currency check returned «актуален», priority chose a winner, kickoff loaded) emits one **inline session report** in this exact shape:

```text
═══════════════════════════════════════════════════════════════
EXECUTION PLAN — <umbrella> (<YYYY-MM-DD>)
═══════════════════════════════════════════════════════════════

## Dependency graph

<Stage tree — §2>

## Action queue — что ты делаешь

<5-column table — §3>

## 1-liner blocks (копируй ОДИН блок = ОДНА новая CC сессия)

### Stage 1 — <name> (<Mode>, ~<cost>)

**Что делает:** <1-2 sentences plain language — что эта fresh CC-сессия сделает; что НЕ сделает если scope узкий>
**Deliverable:** <конкретный артефакт — путь к файлу / PR shape / verdict tag>
**Почему сейчас:** <зачем именно эта стадия именно в этот момент — какой gate она открывает / какой trap counter'ит / какая зависимость её admit'нула>

<1-liner — §4>

### Stage 2 — <name> (<Mode>, ~<cost>)

**Что делает:** <…>
**Deliverable:** <…>
**Почему сейчас:** <…>

<1-liner — §4>

[...]
═══════════════════════════════════════════════════════════════
```

The three layers (`## Dependency graph` / `## Action queue` / `### Stage N` blocks) are **mandatory** — principle 18 fails if any of the literal headings or the column substrings (§3) is missing from this file.

**Description block (3 lines `Что делает / Deliverable / Почему сейчас`) is mandatory above every `<1-liner>`** — see §4.1 below for rationale + falsifiers. The block is not principle-18-checked (per maintainer scope decision 2026-05-25, Option A); enforcement is prose-discipline at session time. The block exists because `### Stage X — name (Mode, cost)` heading answers «how» but not «what / why now»; without it the receiving fresh CC-session can be paste'd without the maintainer-reader understanding what they just dispatched.

---

## §1A No-arg overview format

> **Origin:** V3 binding per [research-patch §3](../../../../docs/meta-factory/research-patches/2026-05-29-meta-orch-no-arg-overview-s0-remainder.md), Stage 3 I-phase. Sibling format to §1 — coexists, does not replace.

Emitted by `/pipeline` (no arg) OR `/pipeline 0`. Renders ALL open umbrellas surviving §2.5 completion-filter (DONE entries dropped by [`priority-score.sh`](../helpers/priority-score.sh) tri-layer classifier — C1 branch / C2 jaccard / C3 done.md). Wave-style grouping ADAPTs SSOT #68 (OhMyOpencode Atlas/Prometheus `## Parallel Execution Graph` `Wave N`). Reuses **all 6** principle-18 substrings (`## Dependency graph` / `↓` / `## Action queue` / `Paste в новый CC tab` / `Можно параллельно с` / `### Stage`) — **zero churn** on [`packages/core/principles/18-meta-orchestrator-output-format.test.ts`](../../../../packages/core/principles/18-meta-orchestrator-output-format.test.ts) (whole-file scope passes; §10 SKILL.md scope unchanged).

**Skeleton (binding, ≤30 lines body):**

```text
═══════════════════════════════════════════════════════════════
PROJECT OVERVIEW — all open umbrellas (<YYYY-MM-DD>)
═══════════════════════════════════════════════════════════════

## Dependency graph

Wave 1 — СЕЙЧАС (parallel-OK):
├── <umbrella-A>   (Stage <N>, ~<cost>, <Mode>)   PARALLEL-OK ↔
└── <umbrella-B>   (Stage <N>, ~<cost>, <Mode>)
                                  ↓
Wave 2 — после мержа Wave 1:
└── <umbrella-C>   (Stage <N>, ~<cost>, <Mode>)

## Action queue — что ты делаешь дальше

| # | Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |
|---|----------------------|-------|-------|---------------------|
| 1 | /pipeline <umbrella-A> | Сейчас | — | <umbrella-B> |
| 2 | /pipeline <umbrella-B> | Сейчас | — | <umbrella-A> |
| 3 | /pipeline <umbrella-C> | После Wave 1 | Wave 1 merged | — |

Всего открытых umbrellas: <K> (после §2.5 completion-filter; DONE-recently скрыты).

### Stage — overview only
(no per-stage 1-liner; this overview MUST be drilled-down via /pipeline <umbrella> for dispatch)
═══════════════════════════════════════════════════════════════
```

**Wave-grouping rules:**

- **Wave 1 — СЕЙЧАС:** candidates whose dependencies are already merged (free to dispatch now).
- **Wave N (N ≥ 2):** candidates dependent on Wave N-1 merges; ordered by Wave label.
- **Intra-wave parallel/sequential markers:** derived from each candidate's kickoff §2 `Parallel-with` column (V2 binding). Pairwise rule — if A claims B AND B claims A → emit `PARALLEL-OK ↔` between them; if either side omits the column or they disagree → treat as sequential `↓` + emit ATTN.

**Coexistence with §1 (dispatch path):**

- §1 fires on `/pipeline <umbrella-name>` (string arg) — proceeds to §3/§4/§5 dispatch.
- §1A fires on `/pipeline` (no arg) OR `/pipeline 0` — emits overview, STOPS.
- Heading prefixes differ verbatim (`EXECUTION PLAN — <umbrella>` vs `PROJECT OVERVIEW — all open umbrellas`) — no collision; §0 routing in [`../SKILL.md`](../SKILL.md) branches BEFORE format selection (no mixed renderer).

**Falsifiers:**

- Wrong if principle-18 test fails after §1A lands — run `npx vitest run packages/core/principles/18-meta-orchestrator-output-format.test.ts` BEFORE push; expect green (whole-file scope sees the 6 substrings from §1A's skeleton even if §1's example were stripped, but §1's example is preserved → both surfaces pass).
- Wrong if dispatch path mistakenly fires §1A (cross-mode rendering) — §0 routing's regex check decides; format selection follows routing, never the reverse.
- Wrong if `### Stage — overview only` placeholder is interpreted by a downstream tool as a real Stage block — placeholder text explicitly disambiguates («overview only; drilled-down via /pipeline <umbrella>»).

---

## §2 Dependency graph

ADAPTed from Argo Workflows' CLI tree (F.1 §A.1 Candidate 3). Prospective (shows WILL run), not retrospective (which is what Argo shows during execution).

**Symbols:**

- `├──` — sibling node (parallel-safe with other `├──` / `└──` at same indent)
- `└──` — last sibling at this indent
- `↓` — inter-stage dependency edge (Stage N → Stage N+1)
- `PARALLEL-OK ↔` (optional inline annotation) — explicit parallel marker between sibling sub-waves at the same stage

**Template:**

```text
Stage 1 — СЕЙЧАС:
├── Sub-wave A   (Mode A, ~30k, read-only)
└── Sub-wave B   (Mode A, ~30k, read-only)
                                  ↓
Stage 2 — после мержа Stage 1:
├── Sub-wave C   (Mode A, ~40k)   PARALLEL-OK ↔
└── Sub-wave D   (Mode B × 3, ~120k)
                                  ↓
Stage 3 — после мержа Stage 2:
└── Sub-wave E   (Mode A, ~30k)
```

**Conventions:**

- One stage header per stage with descriptive label («СЕЙЧАС» / «после мержа Stage N» / «после maintainer GO»).
- Each sub-wave bullet carries the Mode + cost estimate + role hint in parentheses.
- `↓` arrow alone on a line communicates the inter-stage edge.
- Single-sub-wave stages use `└──` only (no `├──`).
- Stages where execution depends on a maintainer DECISION rather than just a merge get the label «после maintainer DECISION on <fork>».

---

## §3 Action queue

5-column markdown table mapping each Stage's 1-liner block to a row. The `Можно параллельно с` column is a genuine BUILD contribution — no upstream renders static parallel-safety; F.1 §A.4 Q3 documents the gap (all CI tools show parallelism dynamically during execution, not statically in a plan).

**Required columns** (principle 18 grep-checks these column-header substrings):

| # | Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |
|---|----------------------|-------|-------|---------------------|
| 1 | Stage 1 block ниже | Сейчас | — | Stage 1 sibling (если есть) |
| 2 | Stage 2 block ниже | После мержа Stage 1 | <PR# / event> | Stage 2 sibling (если есть) |
| 3 | … | … | … | … |

Tail line below the table:

```text
Всего твоих paste'ов: <N> (зависит от <conditions>; max=<M> если все GO).
```

---

## §4 1-liner block grammar

Exactly one block per stage. Maintainer pastes the entire block into a fresh CC session.

**Grammar:**

```text
/orchestrator <umbrella-name> §<section-anchor> — <natural-language payload>, остальное в kickoff
```

**Tokens:**

- `/orchestrator` — deterministic CC slash-command routing token. Activates the global `~/.claude/skills/orchestrator/SKILL.md`.
- `<umbrella-name>` — kebab-case identifier matching the kickoff directory `.claude/orchestrator-prompts/<umbrella-name>/kickoff.md`.
- `§<section-anchor>` — exact section header from the kickoff (e.g. `§1`, `§4 Stage 1`, `§1 Sub-wave F.3`).
- `— <natural-language payload>` — free-form description naming Mode/role/autonomous?/iterative-review-status. The global `orchestrator` skill parses this as natural language, NOT as `--flag=value` args.
- `, остальное в kickoff` — closing token instructing the receiving session to read the kickoff at the anchor for acceptance criteria, T-traps, skills, stop conditions, etc.

**Why this shape (F.1 evidence):**

- 10 mature tools surveyed (GHA, Concourse, Argo, Dagger, just, LangGraph, Cline, Superpowers, `gh workflow run`, chat-orchestrator pattern article) — all converge on `/<command> <natural-language-payload>` for chat-medium dispatch. None use `/Flag-Value /Flag-Value …` shape.
- Maintainer (2026-05-24) explicitly rated the earlier `/Mode-A /Roles-worker /Skills-foo /Autonomous-yes /Iterative-review-no` draft «не удобный формат мне не нравится».
- The global orchestrator skill at `~/.claude/skills/orchestrator/SKILL.md` parses natural-language payload (no structured-args parser).

## §4.1 Description block above each 1-liner (mandatory, prose-discipline)

> **Origin:** 2026-05-25 maintainer feedback («А почему нет описание что каждая делает? … разве в meta-orchestrator не должны быть с описанием промты»). Spec gap identified post-F.3-ship: §1 template + §5 examples produced heading + 1-liner with no plain-language context, which is paste-able but not *reader-comprehensible* without opening the kickoff. Maintainer chose **Option A** (template + examples patch, no principle 18 extension) over Option B (mechanical gate via `**Что делает:**` substring grep).

Every `### Stage X — <name> (<Mode>, <cost>)` heading MUST be followed by a 3-line description block BEFORE the `/orchestrator …` 1-liner:

```text
### Stage X — <name> (<Mode>, <cost>)

**Что делает:** <1-2 sentences plain language — what the fresh CC-session will do; what it explicitly will NOT do if scope is narrow>
**Deliverable:** <concrete artefact — file path / PR shape / verdict tag / data point captured>
**Почему сейчас:** <why this stage at this moment — what gate it opens / what trap it counters / what dependency admitted it>

/orchestrator <umbrella> §<anchor> — <NL payload>, остальное в kickoff
```

**Why this block is load-bearing:**

- `/pipeline`'s entire purpose is to dispatch *fresh CC-sessions without the maintainer's current session context*. Each paste = one autonomous world. The 1-liner starts with `/orchestrator` and is optimised for the **receiving** session (it re-reads kickoff). The description block is optimised for the **maintainer-reader who must decide whether to paste**.
- Without the block, the reader must open `kickoff.md §<anchor>` to learn what the dispatched session will produce — which defeats the one-message-one-session pattern.
- `### Stage X — <name> (<Mode>, <cost>)` heading answers «**how** big / **what** mode» — not «**what** the work is / **why** now». The three triplet fields close that gap.

**Falsifiers / when the block is allowed to be terser:**

- One-line stages where the heading already names the deliverable verbatim (e.g. `### Stage 1 — Append SSOT row #79 (Mode A, ~5k)`) — `**Что делает:**` may be a single noun phrase, but **must still appear** to keep the format machine-readable for future grep promotion.
- Description block is **NOT principle-18-checked** (per maintainer scope decision 2026-05-25). Promotion to mechanical gate (Option B) is a separate trigger — if 3+ sessions ship dispatches without the block within 6 months, promote to principle 18 substring check on `**Что делает:**` presence between `### Stage` and `/orchestrator`.

**Anti-patterns:**

- `#description-as-restated-heading` — content of `**Что делает:**` paraphrases the `### Stage X — <name>` heading. Adds zero context. Counter: name what the SESSION will execute (verbs: «опрашивает», «пишет», «extends», «runs»), not what the stage is called.
- `#deliverable-without-path` — `**Deliverable:**` says «a research-patch» without naming the file path. Reader can't grep for it post-merge. Counter: give the actual path or PR-title shape.
- `#why-now-as-tautology` — `**Почему сейчас:**` says «это следующий шаг» (it's the next step). Adds zero reasoning. Counter: name the gate / trap / dependency edge.

---

## §5 Four worked examples

### Example 1 — Mode A single (R-phase audit, ~30k Opus)

```text
═══════════════════════════════════════════════════════════════
EXECUTION PLAN — meta-orchestrator-followup-audit (2026-05-24)
═══════════════════════════════════════════════════════════════

## Dependency graph

Stage 1 — СЕЙЧАС:
└── F.2 — Cold review of SKILL.md   (Mode A, ~30k, read-only)

## Action queue — что ты делаешь

| # | Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |
|---|----------------------|-------|-------|---------------------|
| 1 | Stage 1 block ниже | Сейчас | — | — |

Всего твоих paste'ов: 1.

## 1-liner blocks (копируй ОДИН блок = ОДНА новая CC сессия)

### Stage 1 — Cold review (Mode A, ~30k)

**Что делает:** прогоняет cold-eye review по SKILL.md как fresh-reader (без контекста твоей сессии), ищет structural drift / missing sections / broken refs; **НЕ** редактирует файлы — только REPORT.
**Deliverable:** REPORT с GO/REVISE/STOP verdict + по-секционные findings (file:line + предложения) inline в session output, никаких commits.
**Почему сейчас:** F.1+G-design + F.3 UX shipped; перед закрытием audit umbrella нужна независимая проверка что F.2 deliverable (cold-review of SKILL.md) consistent с binding spec G §1.5 — иначе T19 (own QA before handoff).

/orchestrator meta-orchestrator-followup-audit §1 Sub-wave F.2 — Mode A reviewer cold-eye по SKILL.md, return REPORT, no edits, остальное в kickoff
═══════════════════════════════════════════════════════════════
```

### Example 2 — Mode SDD (build with implementer + 2 reviewers, ~80k Opus)

```text
═══════════════════════════════════════════════════════════════
EXECUTION PLAN — feature-X-SDD-build (2026-05-25)
═══════════════════════════════════════════════════════════════

## Dependency graph

Stage 1 — СЕЙЧАС:
├── Implementer session   (Mode A, ~50k, writes code)
├── Spec reviewer         (Mode A subagent, ~15k, read-only)
└── Code-quality reviewer (Mode A subagent, ~15k, read-only)
                                  ↓
Stage 2 — после merge Stage 1 PR:
└── Smoke test runner    (Mode A, ~10k)

## Action queue — что ты делаешь

| # | Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |
|---|----------------------|-------|-------|---------------------|
| 1 | Stage 1 block ниже | Сейчас | — | — |
| 2 | Stage 2 block ниже | После мержа Stage 1 PR | Stage 1 PR merged | — |

Всего твоих paste'ов: 2.

## 1-liner blocks (копируй ОДИН блок = ОДНА новая CC сессия)

### Stage 1 — SDD build (Mode SDD, ~80k)

**Что делает:** Implementer пишет feature-X end-to-end (~50k); spec reviewer subagent проверяет соответствие kickoff §3 binding spec (~15k); code-quality reviewer subagent гоняет lint+tests+style (~15k). Все три в одной session через Agent tool, NOT в worktrees.
**Deliverable:** PR feature-X с code + tests + spec-review GO + code-quality-review GO, ready для merge to staging.
**Почему сейчас:** kickoff §3 binding spec frozen, dependencies все resolved; SDD threshold (≥3 independent tasks: implementer + 2 reviewer roles) пройден; single complex feature без parallel-decomposition surface = SDD beats Mode A solo по catch-rate.

/orchestrator feature-X-SDD-build §3 — Mode SDD implementer + 2 reviewers (spec + code-quality), full autonomous, остальное в kickoff

### Stage 2 — Smoke test (Mode A, ~10k)

**Что делает:** запускает feature-X integration smoke (curl endpoints / `npm test -- smoke` / любая manual-liveness probe per kickoff §4), не редактирует код.
**Deliverable:** smoke output (pass/fail per probe) inline в session report, либо BLOCKER finding если что-то не работает после merge.
**Почему сейчас:** Stage 1 PR merged, feature-X в staging; CI pass ≠ runtime-verified (T19), нужна independent post-merge probe BEFORE umbrella closure.

/orchestrator feature-X-SDD-build §4 — Mode A runner проверяет smoke, остальное в kickoff
═══════════════════════════════════════════════════════════════
```

### Example 3 — Mode B × N parallel workers in worktrees (~150k Opus)

```text
═══════════════════════════════════════════════════════════════
EXECUTION PLAN — refactor-large-module (2026-05-25)
═══════════════════════════════════════════════════════════════

## Dependency graph

Stage 1 — СЕЙЧАС (3 parallel worktrees):
├── Worker 1 — module/auth   (Mode B worktree, ~50k)   PARALLEL-OK ↔
├── Worker 2 — module/api    (Mode B worktree, ~50k)   PARALLEL-OK ↔
└── Worker 3 — module/db     (Mode B worktree, ~50k)
                                  ↓
Stage 2 — после merge всех Stage 1 PRs:
└── Integration smoke    (Mode A, ~20k)

## Action queue — что ты делаешь

| # | Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |
|---|----------------------|-------|-------|---------------------|
| 1 | Stage 1 Worker-1 block ниже | Сейчас | — | Worker-2 + Worker-3 |
| 2 | Stage 1 Worker-2 block ниже | Сейчас | — | Worker-1 + Worker-3 |
| 3 | Stage 1 Worker-3 block ниже | Сейчас | — | Worker-1 + Worker-2 |
| 4 | Stage 2 block ниже | После мержа 3 Stage 1 PRs | 3 PRs merged | — |

Всего твоих paste'ов: 4 (3 параллельно в Stage 1 + 1 в Stage 2).

## 1-liner blocks (копируй ОДИН блок = ОДНА новая CC сессия)

### Stage 1 Worker-1 — auth refactor (Mode B worktree, ~50k)

**Что делает:** рефакторит `module/auth` в отдельном worktree (parallel-subwave-isolation §1 + §4a node_modules links MANDATORY); все edits внутри `module/auth/**`, тесты в `module/auth/__tests__/`.
**Deliverable:** PR `refactor/auth-<scope>` с green CI, file:line evidence для cold-review.
**Почему сейчас:** kickoff §4 декомпозировал refactor на 3 независимых модуля (auth/api/db); auth не имеет dependency edges к api/db → safe для parallel dispatch; запуск всех 3 worker'ов одновременно сокращает wall-clock ×3 при том же quota total.

/orchestrator refactor-large-module §4 Worker-1 auth — Mode B implementer в worktree, автономно, остальное в kickoff

### Stage 1 Worker-2 — api refactor (Mode B worktree, ~50k)

**Что делает:** рефакторит `module/api` в worktree #2; scope ограничен `module/api/**`; не трогает auth и db (shared file race trap counter).
**Deliverable:** PR `refactor/api-<scope>` с green CI.
**Почему сейчас:** parallel-safe с Worker-1 и Worker-3 (разные file-scopes); один из 3 sub-waves Stage 1.

/orchestrator refactor-large-module §4 Worker-2 api — Mode B implementer в worktree, автономно, остальное в kickoff

### Stage 1 Worker-3 — db refactor (Mode B worktree, ~50k)

**Что делает:** рефакторит `module/db` в worktree #3; scope `module/db/**`.
**Deliverable:** PR `refactor/db-<scope>` с green CI.
**Почему сейчас:** третий из 3 parallel-safe sub-waves; завершает Stage 1.

/orchestrator refactor-large-module §4 Worker-3 db — Mode B implementer в worktree, автономно, остальное в kickoff

### Stage 2 — Integration smoke (Mode A, ~20k)

**Что делает:** прогоняет integration tests на staging после merge всех 3 refactor-PRs, проверяет что auth↔api↔db не сломались на границах (regression surface от parallel refactor).
**Deliverable:** integration test output inline; либо BLOCKER finding если cross-module contracts нарушены.
**Почему сейчас:** Stage 1 ×3 PRs merged → staging имеет all 3 refactored modules; unit tests в каждом PR ОК, но integration surface ловит только cross-module post-merge — критично для validate parallel-refactor pattern.

/orchestrator refactor-large-module §5 — Mode A runner integration smoke по 3 модулям, остальное в kickoff
═══════════════════════════════════════════════════════════════
```

### Example 4 — Mode Queue (sequential research kickoff queue, ~120k Opus)

```text
═══════════════════════════════════════════════════════════════
EXECUTION PLAN — research-umbrella-Q (2026-05-25)
═══════════════════════════════════════════════════════════════

## Dependency graph

Stage 1 — СЕЙЧАС (sequential queue):
├── R1 — prior-art sweep    (Queue iter 1, ~30k)
├── R2 — gap analysis       (Queue iter 2, ~30k, after R1)
├── R3 — verdict synthesis  (Queue iter 3, ~30k, after R2)
└── R4 — patch draft        (Queue iter 4, ~30k, after R3)

## Action queue — что ты делаешь

| # | Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |
|---|----------------------|-------|-------|---------------------|
| 1 | Stage 1 Queue block ниже | Сейчас | — | — |

Всего твоих paste'ов: 1 (Queue mode внутренне обрабатывает все 4 R-iter автономно).

## 1-liner blocks (копируй ОДИН блок = ОДНА новая CC сессия)

### Stage 1 — Queue mode R1→R4 (Queue mode, ~120k)

**Что делает:** одна Opus session iterates R1 (prior-art sweep) → Reviewer GO/REVISE → R2 (gap analysis) → Reviewer GO → R3 (verdict synthesis) → Reviewer GO → R4 (patch draft) → Reviewer GO; каждая R-итерация produces inkremental output, между ними cold-review checkpoint автоматически.
**Deliverable:** один research-patch с R1-R4 sections + Reviewer GO chain logged; либо REVISE-loop with explicit escalation.
**Почему сейчас:** kickoff §2 enumerated 4 sequential R-iterations с iterative-review-каждой semantics; Queue mode threshold (≥2 sequential R-kickoffs) пройден; flat-queue dispatch без stage-gates ОК потому что R-only umbrella (no I-phase build downstream).

/orchestrator research-umbrella-Q §2 — Mode Queue iterative review каждой итерации (R1 → R2 → R3 → R4), автономно, остальное в kickoff
═══════════════════════════════════════════════════════════════
```

---

## §6 Anti-patterns for the 1-liner format

- **`#slash-tag-flag-format`** — formatting payload as `/Mode-A /Roles-… /Skills-… /Autonomous-yes /Iterative-review-no /Kickoff:<path>`. F.1 §A.5(i) — ZERO upstream precedent across 10 surveyed tools. Maintainer 2026-05-24 explicit «не удобный формат». Counter: natural-language payload after `— ` (em-dash + space). **Falsifier:** if a future revision of `~/.claude/skills/orchestrator/SKILL.md` adds a structured-args parser, the slash-tag format may regain viability — verify by reading the global skill body before falsifying.
- **`#paste-block-with-kickoff-content-inlined`** — copying acceptance criteria / T-traps / skills list / stop conditions INTO the 1-liner. Defeats `остальное в kickoff` deferral; the new session re-reads the kickoff at the anchor anyway. Counter: keep the 1-liner under ~150 chars; anything more belongs in the kickoff.
- **`#missing-section-anchor`** — emitting `/orchestrator <umbrella> — Mode A …` without `§<section>`. The receiving session has no anchor to read; defaults to the kickoff top, which may be `§0 Status` or `§-1 RE-VERIFY` rather than the action body. Counter: every 1-liner carries an explicit `§<section>` anchor.
- **`#pattern-matching-on-name-T16`** — assuming the format works because it visually resembles `/aif-handoff` slash-tag examples (which DO have structured args). Our `/orchestrator` is a different problem class — it parses NL payload, not args. Verify by reading the global skill body, not by analogy.

---

## §7 Falsifiers

- **Wrong if** `~/.claude/skills/orchestrator/SKILL.md` is replaced by a structured-args parser — re-read the global skill body before relying on the natural-language form documented here. (Agent-uncommittable: F.3 reads the global skill but does NOT edit it.)
- **Wrong if** Argo Workflows discontinues the `├── / └──` ASCII tree convention or the upstream pattern is superseded by a better chat-medium-renderable graph notation. Re-check F.1 SSOT entry on a 12-month cadence.
- **Wrong if** the Можно параллельно с column proves redundant in practice (e.g. maintainer never consults it; or all umbrellas turn out to be strictly sequential). Promotion-to-drop trigger: 3 consecutive umbrellas where the column is empty for every row.

---

## §A — See also

- [`../SKILL.md` §10](../SKILL.md) — the meta-orchestrator skill that emits this output structure.
- [F.1 prior-art research-patch](../../../../docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-ux-research.md) — Argo `├── / └──` ADAPT verdict, slash-tag REJECT verdict, 10 surveyed tools.
- [G refactor design](../../../../docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-refactor-design.md) + [G §1.5 F.3 binding scope](../../../../docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-refactor-f3-scope.md) — Items 7-9 (F3-S1/S2/S3).
- [`packages/core/principles/18-meta-orchestrator-output-format.test.ts`](../../../../packages/core/principles/18-meta-orchestrator-output-format.test.ts) — principle 18 enforcement.
- [`../../../rules/dual-implementation-discipline.md`](../../../rules/dual-implementation-discipline.md) §5 — channel-split discipline for SKILL ↔ references file pairing.
