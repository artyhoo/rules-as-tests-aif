# Output format — `/meta-orchestrator <umbrella>` inline session report

> **Authoritative for:** the 3-layer structure shape emitted by `/meta-orchestrator <umbrella>` invocations — §1 grammar, §2 dependency-graph template, §3 action-queue template, §4 1-liner block grammar, §5 four worked examples (Mode A / SDD / Mode B × N / Queue mode), §6 anti-patterns for 1-liner format. Principle 18 (`packages/core/principles/18-meta-orchestrator-output-format.test.ts`) enforces the literal substrings below.
> **NOT authoritative for:** project goal — see source repo `README.md#why-this-exists`. The `/meta-orchestrator` skill body authority — see [`../SKILL.md`](../SKILL.md).

> **Origin:** F.3 (2026-05-24). The 3-layer structure synthesises F.1 prior-art (PR #203) — Argo Workflows' `├── / └──` ASCII tree (ADAPT vocabulary, SSOT row TBA) + maintainer's binding 1-liner format refinement (parent kickoff §1 Sub-wave F.3 lines 237-254). The slash-tag draft (`/Mode-A /Roles-… /Skills-…`) was rated «not convenient» by the maintainer and has zero upstream precedent across 10 surveyed tools (GHA, Concourse, Argo, Dagger, just, LangGraph, Cline, Superpowers, gh workflow run, orchestrator-guide).

---

## §1 Top-level shape

Every `/meta-orchestrator <umbrella>` invocation that proceeds to dispatch (i.e. plan-currency check returned «актуален», priority chose a winner, kickoff loaded) emits one **inline session report** in this exact shape:

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

<1-liner — §4>

### Stage 2 — <name> (<Mode>, ~<cost>)

<1-liner — §4>

[...]
═══════════════════════════════════════════════════════════════
```

The three layers (`## Dependency graph` / `## Action queue` / `### Stage N` blocks) are **mandatory** — principle 18 fails if any of the literal headings or the column substrings (§3) is missing from this file.

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

/orchestrator feature-X-SDD-build §3 — Mode SDD implementer + 2 reviewers (spec + code-quality), full autonomous, остальное в kickoff

### Stage 2 — Smoke test (Mode A, ~10k)

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

/orchestrator refactor-large-module §4 Worker-1 auth — Mode B implementer в worktree, автономно, остальное в kickoff

### Stage 1 Worker-2 — api refactor (Mode B worktree, ~50k)

/orchestrator refactor-large-module §4 Worker-2 api — Mode B implementer в worktree, автономно, остальное в kickoff

### Stage 1 Worker-3 — db refactor (Mode B worktree, ~50k)

/orchestrator refactor-large-module §4 Worker-3 db — Mode B implementer в worktree, автономно, остальное в kickoff

### Stage 2 — Integration smoke (Mode A, ~20k)

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

## §A — See also (source-repo paths; not all available in consumer install)

- [`../SKILL.md` §10](../SKILL.md) — the meta-orchestrator skill that emits this output structure.
- `docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-ux-research.md` — F.1 prior-art: Argo `├── / └──` ADAPT verdict, slash-tag REJECT verdict, 10 surveyed tools.
- `docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-refactor-design.md` + `2026-05-24-meta-orchestrator-refactor-f3-scope.md` — G refactor design + §1.5 F.3 binding scope (Items 7-9).
- `packages/core/principles/18-meta-orchestrator-output-format.test.ts` — principle 18 enforcement.
- `.claude/rules/dual-implementation-discipline.md §5` — channel-split discipline for SKILL ↔ references file pairing.
