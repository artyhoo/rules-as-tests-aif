# Meta-Factory: Открытые вопросы (что ещё не решено)

> Source: PROPOSAL.md §13 (split в Phase 1.D, 2026-05-07)
> Companion: [PROPOSAL.md](PROPOSAL.md) (overview)

---

## 13. Открытые вопросы (что ещё не решено)

### 13.1 Granularity research, детально

Как именно сегментировать паттерны в research? «Server Actions» — один паттерн или семь подпаттернов (return type, FormData, revalidatePath, error handling, ...)?

Гипотеза: иерархия в `research-cache.json`:
```
next/16.2.1/
  app-router/
    server-actions/
      return-type.json
      form-data-validation.json
      revalidate-after-mutation.json
    server-components/
      data-fetching.json
      use-cache.json
  build/
    turbopack-vs-webpack.json
```

Granularity ≈ **один файл = один паттерн**, на котором можно построить **одно правило**. Это упрощает diff-режим (изменился один файл → перегенерировано одно правило).

### 13.2 Маркетинг и наименование

«AI генерит твои правила» — половина людей не доверяет. Маркетинг должен быть про **self-validating rule generator** с акцентом на validator, не на LLM.

Возможные названия:
- `meta-factory` — про генерацию фабрик
- `rules-foundry` — про литьё правил
- `aif-stack-aware` — расширение AIF
- `rules-as-tests/core` + `rules-as-tests/cli` — продолжение текущего

### 13.3 Granularity invariant core — где провести границу

R1 (no `as any`) — invariant. R8 (OTel spans) — generated. Где граница?

Гипотеза: правило — invariant если:
- Не зависит от стэка (works on any TS code)
- Защищает фундаментальное свойство языка (типобезопасность, async correctness)
- Не имеет version-specific edge cases

Generated если:
- Завязано на конкретный фреймворк
- Зависит от версии (изменения в API)
- Apply-to пути зависят от структуры проекта

Это **рабочая гипотеза**, нужно валидировать на реальных правилах.

#### Phase 2 empirical update (2026-05-07)

Phase 2 показала: meta-tests **uniformly applicable** ко всем 26 правилам manifest (R1-R20 + IR1-IR6) на manifest level — независимо от классификации invariant/generated. Composite pass rate 100% (26/26 на applicable principles).

**Что Phase 2 НЕ показала:** где конкретно проходит граница invariant ↔ generated. Это финально валидируется только в Phase 3 (monorepo split), когда правила физически разделятся на `packages/core/` (invariant) vs `packages/preset-*/` (generated) и каждый пакет должен пройти standalone test runs (per EXECUTION-PLAN §6 Phase 3 verification).

**Status:** partial closure — manifest-level uniformity подтверждена; physical boundary refinement deferred to Phase 3 retro.

#### Phase 3 empirical closure (2026-05-08)

**CLOSED.** Manifest field `stack` = authoritative invariant marker. Hypothesis validated empirically через Gate 3 ESLint rule allocation (Phase 3 monorepo split):

- `stack: ["ts-server", "react-next"]` (universal) → `packages/core/` (invariant) — 3 rules: R7, R2, R8
- `stack: ["react-next"]` (specific) → `packages/preset-next-15-canonical/` (generated) — 3 rules: R12, R14, R20

Gate 3 allocation matched `stack` field 1:1 без exceptions. Zero hard-to-classify files (REVISE trigger did not fire). Physical split complete: `packages/core/` tests 65/65 pass standalone; `packages/preset-next-15-canonical/` tests 38/38 pass standalone.

**Invariant boundary rule (validated):** rule is invariant IFF `stack` field contains both `["ts-server", "react-next"]`; rule is stack-specific IFF `stack` is a strict subset. This is now the SSOT for future rule classification decisions (Phase 5+).

### 13.4 Обработка legacy кодовой базы

Если мета-фабрика устанавливается в **существующий** проект с кучей legacy кода — все сгенерированные правила сразу дадут тысячи violations. Что делать?

Варианты:
- Bulk `// audit:exempt` для existing files (не рекомендуется — заглушает)
- Baseline file типа eslint-baseline (фиксирует current violations, новые ловятся)
- Postpone enforcement — правила в WARN режиме первый месяц, потом ERROR

Это UX-вопрос, не архитектурный, но важный для adoption.

### 13.5 Multi-stack monorepos

Что если в одном репо `apps/web` (Next 16) и `apps/api` (Fastify 5) и `packages/shared` (TS-only)? Три фабрики? Одна с разными scoped правилами?

Гипотеза: одна meta-factory invocation, на выходе — слой scoping в ESLint flat config, разные правила scoped к разным каталогам. Lock-файл общий, в нём отметки «правило R12 applies-to apps/web/**».

Это требует более продвинутого Layer 1 ([architecture.md](architecture.md) §2.3), который понимает workspace structure.

### 13.6 Relationship с AIF core

AIF — это workflow framework (slash-команды, sub-agents, .ai-factory/). Meta-factory — это генератор enforcement layer. Они **ортогональны**. Но как они стыкуются?

Гипотеза: `meta-factory` генерит **в том числе** обновлённые `.ai-factory/RULES.md`, sub-agent prompts (`best-practices-sidecar.md`), AGENTS.md секции. То есть AIF получает stack-aware контент через meta-factory.

**Status (2026-05-08):** hypothesis verified против AIF v2.11.0 через context7 MCP — see [aif-comparison.md](aif-comparison.md). Convergent structured-check format (§3); 4 integration touchpoints identified (§5). Operationalization Phase 6 (Research Agent) и Phase 11 (AIF integration).

### 13.7 Operationalization L2 semantic drift detection

Acceptance criterion для L2 в [self-application.md](self-application.md) §2: «Все три источника (`skills/rules-as-tests/SKILL.md`, `references/overview.md`, `references/ai-traps.md`) семантически синхронизированы; drift detection возвращает 0 расхождений». Но **что значит «семантически»**? Возможные операционализации:

- **Symbolic:** одинаковые term'ы (e.g. «MUST» vs «should» — диcyrepancy при demotion'е) — **CLOSED Phase 5** ([retros/phase-5.md](retros/phase-5.md), [packages/core/research/drift.ts](../../packages/core/research/drift.ts)): symbolic v1 ships modal-verb + term-presence detection over the 3 canonical sources; `framework-self-research` CI gate enforces 0 mismatches per commit. Same-line modal attribution trade-off documented inline at [drift.ts:79](../../packages/core/research/drift.ts#L79) (m1 from PR #5 review). Phase 7 closing edit — symbolic v1 is the v1 deliverable for this open question.
- **Behavioral:** rule из `overview.md` проверяется тестом из `ai-traps.md` → если изменился principle и не изменился test (или наоборот) — drift — **OPEN, v2 trigger**. Behavioral drift requires linking each principle to a runnable assertion; closed by either a real consumer reporting the gap or Phase 8 acceptance test.
- **Embedding-based:** semantic similarity score; threshold для drift — **OPEN, v2 trigger** (orthogonal to symbolic + behavioral; can layer on later).

> **Filename history (2026-05-07):** ранее три источника описывались как `skills/`, `principles.md`, `ai-traps.md` — но `principles.md` не существовал в репо (phantom file). Phase 1.D resync (per Art's Option A decision) исправил формулировку на реальные filenames; `references/overview.md` играет роль «principles» — содержит детальное описание 5 layers framework. Reviewer flagged это как MAJOR-2; canonical source — [self-application.md](self-application.md) §2.

### 13.8 Decision matrix expansion rule

Decision matrix в [self-application.md](self-application.md) §3 фиксирует 9 layer'ов локального enforcement. Добавление 10-го (например, типизация YAML schema, ESM/CJS coherence check, dependency policy) — по какому правилу включается / исключается?

Гипотеза: 4-критерия gate перед включением в matrix:
1. Failure-cost (low/medium/high) — пропуск через локальный gate
2. Local-cost (<100ms / 100ms-1s / 1s-10s / >10s)
3. Detectability только в runtime/не имеет обратной совместимости
4. Stage в lifecycle (pre-commit / pre-push / CI-only)

Решение принять при добавлении 10-го layer'а; до этого — текущая matrix фиксирована.

### 13.9 Bypass через `--no-verify` — структурное решение

Локальный pre-commit / pre-push не блокирует автора который запускает `git commit --no-verify`. Без mitigation invariant декоративен.

Гипотеза (для Phase 1.A scope expansion):
- **CI gate на наличие `.husky/`** в root репо. Если директория пуста или hooks не executable — CI fail. Это не блокирует локальный bypass, но не позволяет push'нуть в main без setup hooks.
- **Audit-self job на наличие framework-self-install passing** — если автор закоммитил без локального запуска (любым путём, включая `--no-verify`), эту ситуацию ловит CI.

Это не silver bullet (контрибьютор всё ещё может временно отключить hooks), но превращает bypass из «invisible» в «visible breach» через CI signal.

### 13.10 LLM v2 trigger conditions

**Status:** OPEN, v2 trigger.
**Origin:** Phase 7 close (2026-05-08). EXECUTION-PLAN.md §6.0 locks deterministic-v1 stance and defers LLM extension as a strict-superset v2 trigger. This section is the SSOT for the trigger conditions per area.

| # | v2 area | Layer | Trigger condition | Verification gate |
|---|---|---|---|---|
| 1 | LLM-driven research extension (context7 MCP + Anthropic `web_search_20250305` with allowed_domains) | L2 | First real consumer reports a research gap on a non-curated framework, OR Phase 8 acceptance shows curated store insufficient for Next 16 patterns | New gate: `framework-self-research --llm` returns drift = 0 against curated baseline + cost ≤$0.10 per `research --self` invocation |
| 2 | Path A LLM gen («picks from menu» — LLM selects existing ESLint plugins / configures options) | L3 | Phase 8 acceptance test passes deterministic; Phase 9 entry research validates ROI | Two-AI review (gate 5) + cost ≤$1 per generated rule + diff with hand-authored ≤10% |
| 3 | Path B AST gen (LLM writes ESLint rule TypeScript source) | L3 | Phase 9+ entry; new pattern with no existing ESLint plugin | Mutation testing (gate 3) green + paired bad/good corpus passes + human-review checkpoint before commit |
| 4 | Gate 5 — two-AI review via AIF `review-sidecar` (`model: opus` override) | L4 | Phase 8 cost-scope decision (per-rule vs per-plan; advisory vs blocking; integration vs reimplementation) | Cost tracked per §13.11 + false-positive rate <20% on 10+ real PRs |
| 5 | Gate 3 — mutation testing via Stryker | L4 | Path B activation (gate 3 only mutates AST; nothing to mutate in Path A) | Stryker score ≥80% on Path B rules + runtime ≤5 min per CI run |

**Closure criteria.** Each v2 area closes when (a) trigger fires AND (b) verification gate passes for ≥1 real example AND (c) cost model in §13.11 reports a stable per-invocation budget. Until then: deterministic v1 ships.

**Entry #2 — Phase 9 entry coverage gap (recorded post-merge 2026-05-08).** [Phase 9 entry research](phase-9-entry-research.md) (merged via PR #13) closed §13.10 entry #2 ROI re-evaluation **negative** based on 5-candidate context7 coverage (Cursor, Continue.dev, [Factory ESLint Plugin](prior-art-evaluations.md), Cody, Aider — see [phase-9-entry-research.md §4.A1](phase-9-entry-research.md)). Two production-grade candidates with potentially-relevant rule-synthesis surface were NOT checked at the time: **AIF `/aif-evolve`** (LLM-driven rule synthesis from accumulated fix patches in skill-context domain — structurally adjacent paradigm to «LLM picks rules from menu», already an integrated dependency per [aif-comparison.md](aif-comparison.md)) and **Oh My ClaudeCode** family (multi-agent orchestration with autonomous workflows in our exact runtime — `/code-yeongyu/oh-my-openagent`, `/yeachan-heo/oh-my-claudecode`, etc.). Next entry research session that re-opens §13.10 entry #2 **must** include these candidates in the base before any verdict change. The current DEFER stance carries forward; this note records the gap for future-session discipline.

### 13.11 LLM cost model + tracking

**Status:** OPEN, v2 trigger.
**Origin:** Phase 8 verdict gate already mentions «cost ≤$5» (EXECUTION-PLAN §6 Phase 8 evaluation), but no tracking infrastructure exists. First LLM v2 invocation triggers this.

**Trigger condition:** first LLM v2 invocation in any of L2/L3/L4 (per §13.10).

**Open questions to answer at trigger time:**

- Where are per-invocation cost records stored? (proposal: `<consumerRoot>/.ai-factory/synthesizer-output/llm-cost-log.json`, ring buffer 30 days)
- Aggregation granularity — per rule, per plan, per phase, per consumer?
- Budget cap enforcement — soft warn vs hard fail? At which threshold?
- Authoritative source for token pricing — Anthropic billing API, hand-maintained constants, or both?
- Cross-model accounting (Sonnet vs Opus when gate 5 overrides) — how is cost attributed?

**Decision deferred** until first invocation; tracking shape emerges from real data, not speculation.

#### Gate 5 v2 invocation shape (decided 2026-05-08 Phase 8)

Phase 8 entry research (see [phase-8-research.md §6](phase-8-research.md)) closed the **scoping** decision for gate 5 — the **implementation** is still deferred per [§13.10 entry #4](#1310-llm-v2-trigger-conditions) v2 trigger.

| Dimension | Decision | Rationale |
|---|---|---|
| **Invocation mode** | **per-plan** (1 invocation per validate run, full plan in context) | ~3× cheaper than per-rule (~$0.29 vs ~$0.72 at Opus 4.7 list pricing on a 26-rule plan), amortizes system-prompt overhead, ≤8s wall-clock vs ≥30s sequential per-rule |
| **Model** | **Opus 4.7** | Quality gate (catches semantics gates 1/2/4/6 cannot); $0.15 Opus-vs-Sonnet premium is rounding error vs the §6 «≤$5» Phase 8 budget |
| **Severity** | **advisory non-blocking** | LLM-driven review carries FP risk; promote to blocking only after [§13.10 entry #4](#1310-llm-v2-trigger-conditions) verification gate fires («false-positive rate <20% on 10+ real PRs») |
| **Caching** | keyed on `rules-lock.json.sourceFingerprint` (sha256/16) | Lock already carries the fingerprint; rerun only when fingerprint changes — repeated CI runs cut to ~$0 |
| **Per-run budget** | **<$0.30 typical / <$5 with 10× retries** | 17× headroom under EXECUTION-PLAN.md §6 Phase 8 «cost ≤$5» gate; stop-rule «>$10 ⇒ REVISE» does not fire |

**Cost arithmetic** (Anthropic May 2026 list pricing — Opus 4.7 $5/M input, $25/M output; cached input ≤90% off):

```
per-plan, cold: 32K input · $5/M + 5K output · $25/M = $0.16 + $0.125 = $0.285
per-plan, warm: 32K input · $0.50/M + 5K output · $25/M = $0.016 + $0.125 = $0.141
per-rule × 26: 78K input · $5/M + 13K output · $25/M = $0.39  + $0.325 = $0.715
```

**Implementation status:** the *invocation shape* is now SSOT; *building* gate 5 is still deferred. Trigger to start build = §13.10 entry #4 v2 condition (Phase 8 cost-scope decision DONE; verification gate FP rate still pending real-PR data).

**Cost-tracking infrastructure** (scoped above as a v2 deliverable per §13.11) is **not** built in Phase 8 — keyed on the same `sourceFingerprint`, but the storage shape (proposal: `<consumerRoot>/.ai-factory/synthesizer-output/llm-cost-log.json`) emerges with the first real invocation, not on speculation.

### 13.12 Real-corpus validation strategy

**Status:** OPEN, v2 trigger.
**Origin:** Phase 7 close — gate 4 (tautology) ships with a 3-file negative corpus (`empty.ts`, `comment-only.ts`, `unrelated.tsx`). This is sanitary, not exhaustive. Fullness depends on gate 3 + gate 5 + a real-world corpus.

**Trigger condition:** first real consumer onboard, OR Phase 8 acceptance test runs `meta-factory upgrade --from=next@15 --to=next@16` against a real Next 16 codebase.

**Open questions:**

- Corpus source — Vercel example apps, OSS Next.js projects on GitHub, hand-curated «representative» bundle?
- Negative corpus expansion — what categories beyond empty/comment-only/unrelated? (proposal: minified output, generated code, vendored libs, monorepo-shared utils, test fixtures)
- Corpus refresh policy — bound to framework version bumps (Next 15 → 16 = new corpus) or independent cadence?
- False-positive budget — what fraction of corpus may trigger an existing rule before the rule is rejected as too aggressive?
- Storage — in-repo fixtures, external git submodule, or pulled fresh from registry per CI run?

**Decision deferred** until first real consumer or Phase 8 acceptance, whichever fires first.

### 13.13 Versioning strategy для preset / recipes

**Status:** OPEN, v2 trigger.
**Origin:** Phase 7 retro — `rules-lock.json` ships with `schemaVersion` + `framework` + `version` fields (per [retros/phase-7.md L5 v1 scope](retros/phase-7.md)), but no policy yet on how recipe / preset versioning relates to consumer upgrades.

**Trigger condition:** Phase 11 entry research, OR first consumer who needs to upgrade across a recipe-incompatible boundary.

**Open questions:**

- SemVer for recipes — what counts as breaking? (proposal: removing a rule = MAJOR; relaxing severity = MINOR; tightening severity = MAJOR; adding new rule = MINOR)
- Preset versioning vs framework versioning — independent or coupled? (e.g. `preset-next-15-canonical@1.2.3` ↔ `next@15.4.x` — N:1 or 1:1?)
- Recipe deprecation flow — how is a removed recipe communicated to consumers with active locks?
- Channel discipline — stable / canary / nightly recipes, or single channel?
- Backports — does `preset-next-15-canonical@1.x` continue to receive fixes after `preset-next-16-canonical` ships?

**Decision deferred** to Phase 11 entry.

### 13.14 Backwards compatibility / rules-lock.json migration

**Status:** OPEN, v2 trigger.
**Origin:** Phase 7 close — `rules-lock.json` v1 schema is `{ schemaVersion, framework, version, ruleIds[], emittedAt, sourceFingerprint }` (sha256/16). First schema bump (e.g. adding `cost` field per §13.11, or `diagnosticsVersion` per self-diagnostics-design.md) needs a migration story.

**Trigger condition:** first additive change to `rules-lock.json` schema, OR first consumer with a v0 lock requesting upgrade.

**Open questions:**

- Schema bump policy — bump `schemaVersion`, write both fields during a deprecation window, drop old field after N releases?
- Lock auto-migration — does `meta-factory install` rewrite the lock to the current schema, or refuse and require explicit `meta-factory migrate`?
- Cross-version installer compatibility — can `meta-factory@1.2.0` read a lock written by `1.0.0`? Forward and/or backward?
- Drift detection during migration — sourceFingerprint changes shape (e.g. sha256/16 → sha256/full) — does that count as drift or as a schema-only event?
- Documentation locus — `rules-lock.json` reference doc separate from this open-question, or inline in `architecture.md §2.7`?

**Decision deferred** until first additive schema change.
