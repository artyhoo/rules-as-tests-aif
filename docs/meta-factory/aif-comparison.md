# AIF v2.11.0 — Comparison & Integration Analysis

> **Verified:** 2026-05-08 via context7 MCP queries against `/lee-to/ai-factory` (no source clones).
> **AIF version:** 2.11.0 (npm `ai-factory`, repo [lee-to/ai-factory](https://github.com/lee-to/ai-factory)).
> **Status:** research output. Operationalization deferred to Phase 6 (Research Agent) and Phase 11 (AIF integration) per [EXECUTION-PLAN.md](EXECUTION-PLAN.md) §6.
> **Source-of-truth rule:** все findings сверены через `mcp__context7__query-docs` против AIF docs, не через git clone (per memory rule on external library research).
>
> **Authoritative for:** AIF v2.11.0 capability matching against this project's roadmap, integration analysis, reuse decisions per Phase 11 backlog (§7).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). AIF deep alignment decision (Option I) — deferred per [open-questions.md §13.18](open-questions.md).

---

## §1. AIF — three validation modes

AIF не одна валидация — **три разных механизма**, каждый со своими гарантиями.

### 1.1 `/aif-rules-check` — LLM-judge advisory

Читает `.ai-factory/RULES.md` (flat markdown bullets) + git diff. LLM решает: PASS / WARN / FAIL.

- Verdict semantics: «FAIL when an explicit hard rule is **clearly** violated» — clearly = LLM judgement
- No AST scan, no schema validation, no executable check
- Это **advisory layer**, не source of truth

### 1.2 `/aif-verify` — real toolchain

Запускает фактический build/test/lint:

| Detection | Command |
|---|---|
| `tsconfig.json` | `npx tsc --noEmit` |
| `package.json` build script | `npm run build` |
| `vitest`/`jest.config.*` | `npm test` |
| `pytest`/`pyproject.toml` | `pytest` |
| `go.mod` | `go build ./...`, `go test ./...` |
| `cargo.toml` | `cargo check`, `cargo test` |
| `eslint.config.*` | `npx eslint [changed files]` |
| `.golangci.yml` | `golangci-lint run ./...` |

Plus Glob/Grep для проверки что implementation реально существует. Strict mode = zero tolerance.

### 1.3 `/aif-loop` PREPARE+EVALUATE — structured executable checks

Multi-phase Reflex Loop (PLAN→PRODUCE‖PREPARE→EVALUATE→CRITIQUE→REFINE). PREPARE materializes rules в machine-executable checks:

```json
{
  "checks": [
    {
      "rule_id": "a.correctness.endpoints",
      "type": "executable",
      "command": "test -s .ai-factory/evolution/<task>/artifact.md",
      "expected": "exit code 0"
    },
    {
      "rule_id": "a.completeness.examples",
      "type": "content",
      "search": "\"example\":|examples:",
      "expected": "At least one JSON example"
    }
  ]
}
```

EVALUATE runs checks через parallel `Task` agents, aggregate в weighted score.

---

## §2. AIF rule schema (`aif-loop` RULE-SCHEMA)

```json
{
  "id": "a.correctness.endpoints",
  "description": "All core CRUD endpoints are present",
  "severity": "fail",
  "weight": 2,
  "phase": "A",
  "check": "Verify each endpoint from the task prompt exists in the artifact"
}
```

- `severity`: `fail` (weight 2, blocks pass) | `warn` (weight 1, reduces score) | `info` (weight 0, tracked only)
- `phase`: A (initial) | B (refinement gate)
- `check`: prose instruction → PREPARE materializes в executable check

**Это convergent design с rules-as-tests-aif manifest** — оба проекта независимо пришли к structured `{id, severity, check, ...}` формату.

---

## §3. Convergent design points

| Concept | AIF | rules-as-tests-aif |
|---|---|---|
| Structured rule format | `aif-loop` RULE-SCHEMA | `factory/rules-manifest.json` + schema |
| Executable validation | `/aif-verify` toolchain + `aif-loop` checks | pre-push hooks + CI + Vitest |
| Schema-validated config | `schemas/extension.schema.json` | `factory/rules-manifest.schema.json` (Ajv) |
| Project-level overrides | `.ai-factory/skill-context/<skill>/SKILL.md` | (currently absent — opportunity) |
| Machine-readable verdicts | `aif-gate-result` JSON block | test exit codes + JUnit-style output |

---

## §4. Differential analysis — что делает каждый уникально

### Только в AIF

- **Workflow runtime:** 30+ skills (init, plan, implement, fix, verify, review, commit, dockerize, ...) с cross-skill choreography через `aif-gate-result` JSON
- **Multi-phase Reflex Loop:** PLAN/PRODUCE/PREPARE/EVALUATE/CRITIQUE/REFINE с persistent state в `.ai-factory/evolution/`
- **Weighted scoring:** severity × weight = aggregate score, не binary pass/fail
- **`aif-evolve` mining:** auto-generates project rules из accumulated fix patches (паттерн «#1 source of bugs in this project — null refs on optional DB relations»)
- **skill-context override pattern:** universal mechanism для project-level skill customization без переписывания самих skills

### Только в rules-as-tests-aif (CONFIRMED via validator 2026-05-08)

- **Mutation testing requirement (Phase 2 P4):** anti-tautology guard для самих meta-tests; нет в AIF и не нашлось в alternatives (Reflexion, LangGraph evaluator-optimizer, AutoGen — никто не делает «тесты тестов на тавтологию»)
- **Manifest as SSOT + auto-render:** `render-rules --check` ловит drift между manifest и rendered RULES.md; AIF RULES.md = manually appended via `/aif-rules`. Не нашлось аналогов в context7
- **Paired bad/good examples** в каждом правиле как first-class schema field — отсутствует в AIF RULE-SCHEMA (только `description` строка) и во всех найденных альтернативах
- **5-layer rule corpus** (architecture/meta-tests/spec-by-example/mutation/living-docs) — фиксированная taxonomy enforcement (best-practice synthesis, не unique mechanism)

### Convention atop AIF infrastructure (NOT uniquely ours — 2026-05-08 correction)

- **Two-AI tautology review:** `review-sidecar` AIF subagent — прямой analog. AIF имеет `model: sonnet|opus|haiku` field в SKILL.md spec + `context: fork` для isolated subagent. **Anti-bias convention** (different model для review) — наша практика поверх AIF infrastructure, **не fundamental differentiator**. Можно конфигурировать в AIF: `review-sidecar` с `model: opus` когда primary `sonnet`.
- **Stack-aware scoping:** наш `stack: []` per-rule field более precise (next-15, react-next, ts-server) чем AIF `rules.<area>` (api/frontend/backend), но **разные axes**, не uniqueness. AIF area rules = «scope в проекте», наш stack = «техстек». Orthogonal — можно использовать вместе. Переоценка из initial draft где было сформулировано как unique.

---

## §5. Four integration touchpoints — matrix

Гипотеза §13.6 («meta-factory feeds AIF») операционализуется в **4 точки контакта**, не одну:

| AIF консумер | Что генерит meta-factory | Mode |
|---|---|---|
| `/aif-rules-check` | `.ai-factory/RULES.md` flat list (downgrade projection из manifest) | Advisory (LLM judge) |
| `/aif-verify` | hooks/CI commands из manifest `check.type=command\|script` | Hard (toolchain) |
| `/aif-loop` rules | JSON conversion манифеста → AIF RULE-SCHEMA format | Structured executable |
| `/aif-fix`, `/aif-architecture`, etc. | `.ai-factory/skill-context/<skill>/SKILL.md` — stack overrides | Per-skill customization — **✓ closed Phase 4** (commit `b5e16b7`, see [retros/phase-4.md](retros/phase-4.md) Reuse posture #4.6) |

Convergent rule format (§2 ↔ rules-manifest.json) делает touchpoint 3 **тривиально mapping'ся** — JSON-to-JSON конвертер, не семантический rewrite.

---

## §6. Risks & open questions

### 6.1 Двойная валидация

`/aif-rules-check` (LLM judge) PASS + pre-push hook (test execution) FAIL — возможно. Mitigation: AIF rules-check как soft advisory, source of truth = test execution. Запретить полагаться на rules-check verdicts для merge decisions.

### 6.2 RULES.md format downgrade

Проектируя touchpoint 1 (RULES.md flat list для `/aif-rules-check`), теряем executable check + examples + mutation guard. Это intentional downgrade под AIF advisory contract; risk — пользователь читает RULES.md и считает что это full enforcement spec.

Mitigation: header `> Auto-generated from manifest. Authoritative source: factory/rules-manifest.json. /aif-rules-check is advisory only.`

**Closure pointer:** see Phase 11.1 deliverable if absorbing this into `aif-gate-result` shape; alternatively → L5 v2 (RULES.md emission) per [open-questions.md §13.13](open-questions.md). Either path resolves the «full enforcement spec vs. advisory downgrade» framing — no action in v1.

### 6.3 Skill-context generation feedback loop

`aif-evolve` mining накапливает project rules из patches. Если meta-factory тоже пишет в `skill-context/`, нужна reconciliation strategy — кто owns какие rules, как избежать конфликтов.

Defer: операционализация в Phase 6 (Research Agent) или 11 (AIF integration).

---

## §7. Phase 11 backlog

> **Status:** SSOT for AIF-integration backlog referenced from [EXECUTION-PLAN.md §11](EXECUTION-PLAN.md).
> **Trigger:** Phase 8 + 9 stable + first real consumer onboard.
> **Scope:** 3 subtasks. Touchpoint 4 already closed in Phase 4; `/aif-verify` spike routed to Phase 8 entry, not Phase 11.

### Closed-elsewhere pointers (NOT Phase 11 subtasks)

- **Touchpoint 4** (`.ai-factory/skill-context/<skill>/SKILL.md` per-skill overrides) — **closed Phase 4** (commit `b5e16b7`, [retros/phase-4.md](retros/phase-4.md) Reuse posture #4.6). Extension (L2-research-derived skill-context content) tracked as Phase 11 watchlist item, not subtask.
- **`/aif-verify` integration spike** — routed to **Phase 8 entry research** per [retros/phase-7.md](retros/phase-7.md) Open Q #5. Aim: forward-spike whether L4 + L5 already produce `aif-gate-result`-compatible JSON shape. Decision moves up to Phase 8 if cost is low; otherwise stays in Phase 11.

### Phase 11 subtasks

#### 11.1 — `aif-gate-result` emission from L4 + L5

> **Status (2026-05-08):** **PARTIAL CLOSE in Phase 8.** L4 wire format shipped via [packages/core/validator/to-aif-gate-result.ts](../../packages/core/validator/to-aif-gate-result.ts) (`fromValidationReport`, `fromInstallReport`); CLI flag `--aif-gate-result` and `framework-self-validate` job summary emission landed in audit-self.yml. Remaining 11.1 work: schema validation against a freshly-fetched AIF GATE-RESULT-CONTRACT.md (deferred until first real consumer or AIF version bump invalidates snapshot).

**Scope.** Emit `aif-gate-result` JSON shape from L4 `ValidationReport` and L5 `InstallReport`. Shape per AIF GATE-RESULT-CONTRACT.md (resolve via `mcp__context7__query-docs` against `/lee-to/ai-factory` at Phase 11 entry — schema may have evolved past current snapshot).

**Acceptance.**
- L4 `validate(plan)` returns `ValidationReport` with optional `aifGateResult` field matching AIF schema. — **closed Phase 8** via pure `fromValidationReport` mapping (additive; no breaking change to ValidationReport).
- L5 `install(plan, opts)` returns `InstallReport` with optional `aifGateResult` field. — **closed Phase 8** via pure `fromInstallReport` mapping; postValidation falls back to preValidation; artifacts → affected_files.
- Round-trip: parse L4/L5 output → AIF gate result → AIF consumer (`/aif-implement` dispatcher) accepts without parse error. — **wire format shipped Phase 8**; live `/aif-implement` consumption deferred to first AIF integration.
- Schema validation against AIF GATE-RESULT-CONTRACT.md schema (fetched fresh via context7). — **deferred** to Phase 11 entry (snapshot may drift; refetch needed at integration time).

#### 11.2 — `/aif-loop` RULE-SCHEMA convertor

**Scope.** JSON-to-JSON mapping `rules-manifest.json` → AIF `aif-loop` RULE-SCHEMA (§2 above). Bidirectional if needed; one-direction first.

**Acceptance.**
- Convertor: `convert-to-aif-rules.ts` reads `factory/rules-manifest.json`, emits AIF RULE-SCHEMA JSON.
- Round-trip on 3 existing R-rules: R1 (TS hygiene), R7 (async correctness), R12 (Server vs Client Components).
- Each round-trip preserves `id`, `severity`, `check`, paired bad/good examples (where AIF schema supports them; degrade gracefully where it doesn't, per §6.2 RULES.md downgrade pattern).
- AIF EVALUATE phase consumes the converted JSON and runs checks without modification.

#### 11.3 — `contributing-recipes.md` onboarding guide

**Scope.** New doc `docs/meta-factory/contributing-recipes.md` — external-author onboarding for adding new recipes to `packages/core/synthesizer/recipes/`. ≤300 lines (shipped reference invariant), examples-driven.

**Acceptance.**
- Step-by-step: clone → write recipe JSON → wire into synthesis plan → run validator → snapshot test.
- Worked example: walk through adding a hypothetical recipe (e.g. for a Next 16 pattern not in the canonical preset).
- Sections: recipe schema reference (link), `appliesTo` semantics (link to m3 authoring note), negative-test field requirements, snapshot stability expectations.
- Onboarding test: a fresh contributor can add a recipe end-to-end without internal knowledge.

### Earlier deferrals (still valid)

| Item | Defer to | Rationale |
|---|---|---|
| `aif-evolve` ↔ skill-context reconciliation | Phase 6 | Research Agent territory; reconciliation policy (who owns which rules) needs L2 design context |
| RULES.md downgrade projection format | Phase 7 | Synthesizer + Installer (closure pointer: see Phase 11.1 deliverable if absorbing this into `aif-gate-result` shape; alternatively → L5 v2 «RULES.md emission» per [open-questions.md §13.13](open-questions.md)) |
| Cross-validation policy (rules-check advisory + tests authoritative) | Phase 11 | Becomes part of Phase 11.1 acceptance (the `aif-gate-result` shape encodes which gate is authoritative) |

---

## §8. Conclusion

AIF и rules-as-tests-aif **не конкуренты** — они работают на разных слоях:

- AIF = **workflow runtime** (как делать AI-driven dev), rules как один из inputs
- rules-as-tests-aif = **enforcement layer + rule corpus** (logical self-application: правила доказывают свою корректность через себя), плагин для AIF runtime

Интеграция через 4 touchpoint'а (§5), convergent rule format упрощает mapping. Initial §13.6 hypothesis верифицирована и расширена. Operationalization Phase 6/11.

---

## §9. Reuse vs build matrix (added 2026-05-08 after independent validator pass)

Validator пас (general-purpose subagent с context7-only constraint) проверил 6 overlap claims + research альтернатив. Findings →

### Strongest reuse candidates (брать готовое, не строить)

| Capability | Готовое решение | Reuse rationale |
|---|---|---|
| Cross-skill verdict JSON contract | `aif-gate-result` ([GATE-RESULT-CONTRACT.md](https://github.com/lee-to/ai-factory/blob/2.x/skills/aif-verify/references/GATE-RESULT-CONTRACT.md)) | **Единственный formalized standard** в context7 ландшафте. OPA/Rego = authorization, GitHub status = слишком low-level. Naши retros должны emit его. |
| Phase task delegation | `/aif-implement` + `implement-coordinator` | Dependency graph + while-loop dispatch. Заменяет ручные `PHASE-N-PROMPT.md`. |
| Iterative refinement loops | `aif-loop` (PLAN/PRODUCE/PREPARE/EVALUATE/CRITIQUE/REFINE) | Наиболее зрелая реализация. Reflexion / LangGraph менее structured. |
| Incident → rule generation | `aif-evolve` | Уникальная capability — никто кроме AIF не делает auto-rule generation из patches. **Phase 8.8 cross-ref (added 2026-05-08):** complementary, не replacement. `aif-evolve` auto-generates project rules из patches — incident-derived, high-volume, post-fix lifecycle. Phase 8.8 prior-art mechanism ([prior-art-evaluations.md](prior-art-evaluations.md) + [§5.5 Step 1.5](EXECUTION-PLAN.md) consult gate + `Prior-art:` trailer per [CONTRIBUTING.md](../../CONTRIBUTING.md)) is the manual analog: curated, low-volume, pre-build lifecycle. Different signal sources (CVE/incident patches vs. capability-area research), different lifecycle stages. Re-evaluate integration when LLM v2 trigger fires per [open-questions.md §13.10 entry #1](open-questions.md). |
| Structured executable check format | `aif-loop` RULE-SCHEMA | Convergent с нашим manifest; JSON-to-JSON conversion тривиален. |
| Independent reviewer infrastructure | `review-sidecar` + `model: opus` config | Anti-bias convention применяется поверх AIF (не своя инфраструктура). |

### Where AIF + alternatives **insufficient** (наш build)

См. §4 «Только в rules-as-tests-aif» — 4 confirmed differentiators (mutation testing для meta-tests, manifest-SSOT с drift detection, paired bad/good examples, 5-layer taxonomy).

### Phase impact

| Phase | До analysis | После analysis |
|---|---|---|
| 3 (split) | Custom monorepo structure | **Pause + retrofit** — context7 research для top monorepo patterns перед resume |
| 4 (Stack Detector) | Build своё | Research AIF `aif-explore` + skill-context для autodetection logic |
| 5 (Validator) | Build своё | **Use `aif-loop`** для quality-gated validation; build только validator-specific corpus |
| 6 (Research Agent) | Build своё | **Use `aif-evolve` pattern**; build только domain-specific strategies |
| 7 (Synthesizer) | Build своё | Без изменений — uniquely ours |
| 8 (Acceptance) | Custom CI matrix | **Use `/aif-verify --strict`** для acceptance gate |
| 9-11 | AIF integration | Уточнить: integration = adopting AIF runtime, не bidirectional bridge |

Estimated reuse savings: **30-40%** оригинального roadmap scope (sizing требует уточнения при Phase 3 retrofit entry).

---

## §10. Confirmed differentiators (validator 2026-05-08)

Что **остаётся уникальным** к проекту после AIF + alternatives research:

1. **Mutation testing of meta-tests** (Phase 2 P4) — anti-tautology guard для самих принципов-тестов. Никто из найденных решений (AIF, Reflexion, LangGraph, AutoGen, CrewAI) не делает «тесты тестов на тавтологию».

2. **Manifest-as-SSOT с auto-render drift detection** (`render-rules --check`) — drift между machine-readable manifest и human-readable RULES.md ловится автоматически. AIF RULES.md = manually appended, нет SSOT.

3. **Paired bad/good examples в каждом правиле** как first-class schema field. AIF RULE-SCHEMA имеет только `description` string. Все найденные альтернативы — single description.

4. **Recursive self-application в трёх формах:**
   - Principles testing manifest (Phase 2 — strange loop)
   - Generator reproduces canonical example (Phase 7 — output = input)
   - Mutation tests of meta-tests (Phase 2 P4 — three levels of self-reference)

   **Phase 8.8 note (2026-05-08):** the prior-art evaluation mechanism (principle 08 + SSOT + commit trailer + pre-push hook anti-tautology test) is itself recursive — it applies to its own implementation, with Phase 8.8 commits T2-T11 carrying `Prior-art:` trailers. It does **not** introduce a fourth form: it operates within the existing three forms — form #1 (principles testing the manifest is generalised by principle 08 testing the SSOT) and form #3 (the T9 anti-tautology test of the T8 hook is a mutation test of a meta-test, applied to the bash/process surface rather than the TypeScript/manifest surface). The «split design» (artifact validation + process discipline + SSOT) operates within existing axes; the recursion thesis stays at three forms.

Это и есть **actual contribution** проекта — всё остальное (workflow infrastructure, validation runtime, rule storage) — best practices applied / reused from AIF.
