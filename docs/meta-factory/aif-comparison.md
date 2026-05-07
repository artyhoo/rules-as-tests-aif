# AIF v2.11.0 — Comparison & Integration Analysis

> **Verified:** 2026-05-08 via context7 MCP queries against `/lee-to/ai-factory` (no source clones).
> **AIF version:** 2.11.0 (npm `ai-factory`, repo [lee-to/ai-factory](https://github.com/lee-to/ai-factory)).
> **Status:** research output. Operationalization deferred to Phase 6 (Research Agent) and Phase 11 (AIF integration) per [EXECUTION-PLAN.md](EXECUTION-PLAN.md) §6.
> **Source-of-truth rule:** все findings сверены через `mcp__context7__query-docs` против AIF docs, не через git clone (per memory rule on external library research).

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

### Только в rules-as-tests-aif

- **Mutation testing requirement (Phase 2 P4):** anti-tautology guard для самих meta-tests; нет в AIF
- **Manifest as SSOT + auto-render:** `render-rules --check` ловит drift между manifest и rendered RULES.md; AIF RULES.md = manually appended via `/aif-rules`
- **5-layer rule corpus** (architecture/meta-tests/spec-by-example/mutation/living-docs) — фиксированная архитектура enforcement, не workflow
- **Two-AI tautology review** (`review-sidecar` pattern) — independent reviewer pass на тесты
- **Stack-aware scoping** через `stack: []` field в каждом правиле (vs AIF skill-context)
- **Paired bad/good examples** в каждом правиле — P2 принцип

---

## §5. Four integration touchpoints — matrix

Гипотеза §13.6 («meta-factory feeds AIF») операционализуется в **4 точки контакта**, не одну:

| AIF консумер | Что генерит meta-factory | Mode |
|---|---|---|
| `/aif-rules-check` | `.ai-factory/RULES.md` flat list (downgrade projection из manifest) | Advisory (LLM judge) |
| `/aif-verify` | hooks/CI commands из manifest `check.type=command\|script` | Hard (toolchain) |
| `/aif-loop` rules | JSON conversion манифеста → AIF RULE-SCHEMA format | Structured executable |
| `/aif-fix`, `/aif-architecture`, etc. | `.ai-factory/skill-context/<skill>/SKILL.md` — stack overrides | Per-skill customization |

Convergent rule format (§2 ↔ rules-manifest.json) делает touchpoint 3 **тривиально mapping'ся** — JSON-to-JSON конвертер, не семантический rewrite.

---

## §6. Risks & open questions

### 6.1 Двойная валидация

`/aif-rules-check` (LLM judge) PASS + pre-push hook (test execution) FAIL — возможно. Mitigation: AIF rules-check как soft advisory, source of truth = test execution. Запретить полагаться на rules-check verdicts для merge decisions.

### 6.2 RULES.md format downgrade

Проектируя touchpoint 1 (RULES.md flat list для `/aif-rules-check`), теряем executable check + examples + mutation guard. Это intentional downgrade под AIF advisory contract; risk — пользователь читает RULES.md и считает что это full enforcement spec.

Mitigation: header `> Auto-generated from manifest. Authoritative source: factory/rules-manifest.json. /aif-rules-check is advisory only.`

### 6.3 Skill-context generation feedback loop

`aif-evolve` mining накапливает project rules из patches. Если meta-factory тоже пишет в `skill-context/`, нужна reconciliation strategy — кто owns какие rules, как избежать конфликтов.

Defer: операционализация в Phase 6 (Research Agent) или 11 (AIF integration).

---

## §7. Phase deferrals

| Item | Defer to | Rationale |
|---|---|---|
| Convertor manifest → AIF RULE-SCHEMA | Phase 11 | AIF integration phase |
| `aif-evolve` ↔ skill-context reconciliation | Phase 6 | Research Agent territory |
| RULES.md downgrade projection format | Phase 7 | Synthesizer + Installer |
| Cross-validation policy (rules-check advisory + tests authoritative) | Phase 11 | Documented in PROPOSAL §14 by then |

---

## §8. Conclusion

AIF и rules-as-tests-aif **не конкуренты** — они работают на разных слоях:

- AIF = **workflow runtime** (как делать AI-driven dev), rules как один из inputs
- rules-as-tests-aif = **enforcement layer** (как гарантировать что AI не наврал), глубокие anti-tautology механизмы

Интеграция через 4 touchpoint'а (§5), convergent rule format упрощает mapping. Initial §13.6 hypothesis верифицирована и расширена. Operationalization Phase 6/11.
