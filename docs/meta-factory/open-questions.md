# Meta-Factory: Открытые вопросы (что ещё не решено)

> Source: PROPOSAL.md §13 (split в Phase 1.D, 2026-05-07)
> Companion: [PROPOSAL.md](PROPOSAL.md) (overview)
>
> **Authoritative for:** unresolved design questions registry in §13.x format (each entry: Status / Origin / Why deferred / Trigger condition for revisit / Cross-references). Append-only; entries are not deleted, only updated with status transitions.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Resolved questions migrate to retros; this file holds open ones only.

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

### 13.16 Search-coverage discipline (methodology layer, parallel to §13.10)

**Status:** v1-shipped (Phase 8.8.1, 2026-05-08).
**Origin:** Phase 9 entry research §4.A1 closed §13.10 entry #2 ROI re-evaluation negative on a 5-candidate context7 sweep; post-merge surfaced AIF `/aif-evolve` and Oh My ClaudeCode family as production-grade analogs in adjacent paradigms (recorded in §13.10 trailer note + commit `f92f60b`). Methodology gap, not a content gap — the recording layer (Phase 8.8 mechanism: SSOT + principle 08 + `Prior-art:` trailer + pre-push hook) was operating correctly; nothing forced the **searching** layer to widen the candidate base before closing a load-bearing «no production analog» claim.

**Phase 8.8.1 v1 ships** as a docs-only methodology layer:

| Layer | Surface | Artifact |
|---|---|---|
| Rule | [`.claude/rules/phase-research-coverage.md`](../../.claude/rules/phase-research-coverage.md) | 5-item coverage checklist + 4 self-reflection prompts + 4 anti-patterns |
| Patches accumulator | [`docs/meta-factory/research-patches/`](research-patches/) | one file per discovered gap; AIF `/aif-evolve` patch format |
| Discipline-layer SSOT trigger | this entry (§13.16) | when to widen / promote the rule |

**This entry is the SSOT for the discipline-layer gate**, parallel to §13.10 (which is the SSOT for LLM-bearing v2 capability triggers). §13.10 governs *when to build LLM features*; §13.16 governs *when the search-discipline rule itself needs revision*.

**Trigger condition for re-evaluation:**

- **Promote to mandatory pre-Step-1.5 checklist** if the next phase entry research session reports observed false-positive rate >0% (i.e. ≥1 verdict-changing coverage gap surfaces post-merge despite the rule being active). Promotion path: bake the §1 checklist into [EXECUTION-PLAN.md §5.5 Step 1.5](EXECUTION-PLAN.md) as a hard process gate, parallel to the existing SSOT consult.
- **Widen rule scope** if a tag accumulates on ≥3 patches in `research-patches/` — distillation pass folds the prevention rules into [`.claude/rules/phase-research-coverage.md` §1](../../.claude/rules/phase-research-coverage.md). Threshold mirrors AIF `/aif-evolve` 6/10 heuristic, scaled to our smaller corpus.
- **Retire** if 3 consecutive phase entry research sessions report observed-zero-FP and no tag accumulates above threshold over the same window. Retirement = collapse the rule into prose guidance in [CLAUDE.md](../../CLAUDE.md) + delete the rule file.

**Verification gate:** the rule applies recursively to itself per Phase 8.8.1 retro §7 — the rule's §1 checklist must, in retrospect, catch the AIF + Oh-My gap that triggered its creation. If self-review fails, the rule is REVISE not GO. (Outcome of the recursive check lives in [retros/phase-8.8.1-coverage-discipline.md](retros/phase-8.8.1-coverage-discipline.md).)

**Closure criteria.** v1 closes when (a) ≥3 phase entry research sessions consume the rule with observed-zero-FP AND (b) no tag accumulates above the distillation threshold over the same window AND (c) no 6th-item candidate is proposed via §2.3 self-reflection. Until then: v1 carries forward, distillation pass at each accumulation threshold.

### 13.17 Three-tier hot/warm/cold context tiering (deferred, arxiv pattern)

**Status:** deferred 2026-05-09 (recorded during goal-hierarchy restructure as «include in plan, do not implement now»).
**Origin:** [arxiv:2602.20478, «Codified Context: Infrastructure for AI Agents in a Complex Codebase»](https://arxiv.org/html/2602.20478v1) — 283-session production study describing three-tier architecture (hot ~660-line constitution + warm 19 domain-specialist agents + cold 34 on-demand spec docs ~16k LOC). Surfaced in goal-hierarchy research 2026-05-09 §9.4 as state-of-the-art compaction-resilience pattern.

**Why deferred:** current scale (9 phases, 1-3 maintainers, single-domain) does not warrant tier-loading infrastructure. Implementing tier-routing mechanism for a problem we don't have = over-engineering. The two-tier hot/cold split (per user's `~/.claude/skills/ai-docs/SKILL.md`) plus Step 0 read-first pattern (per [.claude/session-bootstrap.md](../../.claude/session-bootstrap.md)) cover current needs.

**Trigger condition for revisit:** any of —
- Phase count exceeds 12 (currently 9), with each phase having distinct invariant set.
- Project gains ≥3 distinct domains (parallel to arxiv's 19 specialists scenario).
- Observed compaction events lose load-bearing context ≥2× per quarter despite Step 0 pattern.
- Session length routinely exceeds 50k tokens (compaction frequency dominates).

**Cross-references:** [research-patches/](research-patches/) (AI-doc lens analyses); [.claude/session-bootstrap.md](../../.claude/session-bootstrap.md) (current two-tier implementation).

### 13.18 AIF deep alignment — rules hierarchy adoption (deferred, Option I)

**Status:** deferred 2026-05-09. Recorded during goal-hierarchy restructure.
**Origin:** goal-hierarchy research 2026-05-09 §9.7 surfaced AIF's three-level rules hierarchy (`AGENTS.md` + `.ai-factory/RULES.md` axiom tier + `rules/base.md` project tier + `rules.<area>` area-specific) and proposed Option I — `rules-as-tests-aif` declares principles as entries in AIF's structure rather than maintaining own.

**Why deferred:** AIF integration is Phase 11 work per [PROPOSAL.md §1.4](PROPOSAL.md). Tight alignment NOW = premature lock-in to AIF release lifecycle, weakens standalone-CLI use case (Q4 super-linter dual-positioning pattern). The package currently ships standalone with own install.sh + CLI; alignment decision belongs at Phase 11 entry research, not as a Phase 9.x doc-restructure side-effect.

**Trigger condition for revisit:** any of —
- Phase 11 (AIF integration) entry research kicks off — alignment vs independence is then a primary entry-research question.
- AIF ships `extension.json` schema finalization (currently «in active development» per [README.md §Forward-compatibility note](../../README.md)) — the schema may dictate alignment shape.
- Real consumer adopts the package as AIF plug-in (currently 0 consumers per [no-consumers caveat in §1](EXECUTION-PLAN.md)) — usage signal would clarify whether plug-in framing or standalone framing is the dominant mode.

**Cross-references:** [PROPOSAL.md §1.4](PROPOSAL.md), [aif-comparison.md §9](aif-comparison.md), [README.md `Forward-compatibility note`](../../README.md).

### 13.19 Cline Memory Bank full pattern adoption (deferred)

**Status:** deferred 2026-05-09. Recorded during goal-hierarchy restructure.
**Origin:** goal-hierarchy research 2026-05-09 §9.3 surfaced [Cline Memory Bank](https://docs.cline.bot/) — 6-file hierarchy (`projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`) + Mermaid diagrams in instructions + explicit re-read protocol enforced by Cline's own code.

**What was adopted now:** Step 0 re-read pattern (per [.claude/session-bootstrap.md](../../.claude/session-bootstrap.md)) + Mermaid drift-prevention diagram. This is the load-bearing subset.

**What was deferred:** the 6-file hierarchy itself. For a 1-3 maintainer single-domain project, 6 always-read files is heavier than current need. Risk: «every doc is a drift surface» (matklad) — adding 5 more files to maintain may produce more drift than it prevents.

**Trigger condition for revisit:** any of —
- Project gains multi-domain structure (e.g. separate domains for «framework core» + «consumer-facing presets» + «meta-factory generator») — Cline's productContext / systemPatterns / techContext separation maps directly.
- Active context (current task / focus area) becomes dominant maintenance burden in retros — `activeContext.md` would extract that load.
- Session-bootstrap file approaches 200 LOC (currently ~50) — split into multiple targeted files becomes natural.

**Cross-references:** [.claude/session-bootstrap.md](../../.claude/session-bootstrap.md) (current load-bearing subset implementation); [Cline Memory Bank docs](https://docs.cline.bot/).

### 13.20 ADR formal adoption (deferred — `docs/adrs/` directory + first ADR file)

**Status:** deferred 2026-05-09. Recorded during goal-hierarchy restructure.
**Origin:** [research-patches/2026-05-08-phase-8.8-ssot-format-vs-adr.md](research-patches/2026-05-08-phase-8.8-ssot-format-vs-adr.md) noted prior-art-evaluations.md format converged with ADR/MADR fields without consult; goal-hierarchy research 2026-05-09 §6 OQ2 surfaced ADR-supersede as the canonical pattern for the §6.0 #2 trigger change.

**What was adopted now:** ADR-supersede *semantics* applied inline in [EXECUTION-PLAN.md §6.0 #2](EXECUTION-PLAN.md) — original rule retained, supersede note states new evaluative trigger, no automatic unblock. AWS ADR practice cited inline. **No `docs/adrs/` directory created**, no separate ADR file format adopted.

**Why deferred:** project's existing pattern is SSOT entries + research-patches (similar functional outcome to ADRs per the 2026-05-08 patch finding). Adopting a separate ADR format for a single supersede = adding format-surface for one event. Per the same patch's recommendation: if a future session promotes ADR/MADR to a 6th SSOT entry («Decision Records, ADOPT VOCABULARY»), the SSOT itself can carry the precedent.

**Trigger condition for revisit:** any of —
- 3rd structural supersede or revisit-decision needed — pattern accumulation justifies dedicated format. Threshold mirrors the project's «3 patches per tag → distill» convention.
- A consumer requests formal ADRs (e.g. for compliance / audit purposes).
- Phase 11 AIF integration wants `aif-gate-result`-shaped decisions (cross-tooling format requirement).

**Promotion path when triggered:**
1. Add prior-art-evaluations.md entry «ADR / MADR Decision Records, ADOPT VOCABULARY» with retroactive citation of the §6.0 #2 supersede + this §13.20 entry.
2. Create `docs/adrs/` directory + ADR-001 backfilling the §6.0 #2 supersede.
3. Future supersedes ship as ADR files; EXECUTION-PLAN inline supersede notes link to ADRs by ID.

**Cross-references:** [research-patches/2026-05-08-phase-8.8-ssot-format-vs-adr.md](research-patches/2026-05-08-phase-8.8-ssot-format-vs-adr.md); [EXECUTION-PLAN.md §6.0 #2 supersede block](EXECUTION-PLAN.md); [prior-art-evaluations.md §3](prior-art-evaluations.md) entry-trigger criteria.

### 13.21 Doc-authority discipline applied to generated user-facing docs (deferred L3)

**Status:** deferred 2026-05-09. Recorded during goal-hierarchy follow-up (L1 + L2 shipped this branch; L3 = generated docs scope).
**Origin:** L1 of the goal-hierarchy follow-up shipped `.claude/rules/doc-authority-hierarchy.md` (rule) + `packages/core/principles/09-doc-authority-hierarchy.test.ts` (executable principle). L2 audited all project-internal docs and added Authoritative-for headers to 30 canonical authority-bearing docs. **L3** — applying the same discipline to docs the framework GENERATES for consumer projects — is feature work, not docs-restructure.

**Why deferred:** L3 requires changes across multiple shipped surfaces:
- `templates/shared/AGENTS.md.template` and stack-specific templates under `templates/{ts-server,react-next}/`
- `.ai-factory/` shipped sub-agent prompts (`best-practices-sidecar.md`, `review-sidecar.md`, `docs-auditor.md`)
- Generated artifacts in consumer projects: `RULES.md`, `CLAUDE.md`, `AGENTS.md`, `DESCRIPTION.template.md`, `ARCHITECTURE.*.md`
- `install.sh` step 5 (husky setup) and step 6 (npm-script injection) — extend to write `> **Authoritative for:**` headers into consumer-facing files
- Possibly: `synthesizer/emit.ts` to inject Authoritative-for in generated `RULES.md`

This is feature scope (Phase 9.x or 10.x), not goal-hierarchy fix. Shipping L3 in this branch would conflate documentation discipline (L1 + L2) with installer feature work (L3) — bad atomicity.

**Trigger condition for revisit:** any of —
- A real consumer adopts the framework via `install.sh` AND reports doc-authority drift in their consumer project (i.e. their AI agents read EXECUTION-PLAN-equivalent file as goal source).
- Framework starts generating consumer-facing AI docs programmatically (currently most are static templates copied verbatim — programmatic generation is L3 Synthesizer evolution, Phase 9+).
- Phase 9.x or 10.x feature work explicitly targets template enhancement / installer evolution.

**Promotion path when triggered:**
1. Audit all `templates/` files; add `> **Authoritative for:**` headers per the rule §3 format. Where the template will be filled with project-specific content (e.g. `DESCRIPTION.template.md`), the header points to consumer's `README.md` (not framework's).
2. Audit `.ai-factory/` sub-agent prompts; add headers declaring sub-agent scope (e.g. `> **Authoritative for:** best-practices validation against consumer's `RULES.md`; NOT authoritative for project goal — consumer's own `README.md` owns it`).
3. Update `install.sh` to verify headers in shipped artifacts pre-install (sanity check) AND inject consumer-pointing headers into generated files.
4. Extend `principles/09-doc-authority-hierarchy.test.ts` canonical list with template/`.ai-factory/` files; CI gate flips from project-internal-only to project-internal + shipped-artifact verification.
5. Document the consumer-side convention in `INSTALL-FOR-AI.md` so AI agents installing the framework understand that consumer's `README.md` is the goal source for the consumer project.

**Cross-references:** [.claude/rules/doc-authority-hierarchy.md §2](../../.claude/rules/doc-authority-hierarchy.md) «Not required for: generated user-facing docs» exemption; [packages/core/principles/09-doc-authority-hierarchy.test.ts](../../packages/core/principles/09-doc-authority-hierarchy.test.ts) canonical list (will widen at L3 trigger); [README.md](../../README.md) §«What gets installed automatically» enumerates shipped surfaces.

### 13.22 Own-conventions evolution mechanism — fold into L2 Research Agent (Phase 5+)

**Status:** v1-shipped (Phase A baseline 2026-05-09: SSOT entries #6-#10 + research-patches `adopted-pattern-drift` tag). Promotion to L2 Research Agent integration deferred until Phase 5+ ships.
**Origin:** goal-hierarchy follow-up research 2026-05-09 (`/tmp/own-conventions-evolution-research.md`) — Option E (Hybrid). Q4 finding: novel territory — no surveyed OSS project does meta-research on own adopted conventions. Q2 finding: industry-wide gap on prose-convention drift detection. Filling the gap from scratch = open research problem; cheaper to ride existing infrastructure when it ships.

**v1 baseline (this branch):**
- 5 SSOT entries (#6 Arc42, #7 AGENTS.md, #8 AIF Step 0, #9 Cline Memory Bank, #10 matklad) with velocity tags.
- 180-day staleness policy from `prior-art-evaluations.md` §5 applies to SLOW/STABLE entries; tighter explicit cadence per FAST/UNCERTAIN entries (90-day) in their `Trigger to revisit` lines.
- `adopted-pattern-drift` tag in `research-patches/` (per `.claude/rules/phase-research-coverage.md` §4 anti-pattern taxonomy) for incident-driven recording.

**Trigger condition for revisit:**
- L2 Research Agent ships (Phase 5 closes per [EXECUTION-PLAN.md §6](EXECUTION-PLAN.md)) — extension is natural at that point.
- ≥2 `adopted-pattern-drift` tag patches accumulate in `research-patches/` — pattern signal that incident-driven mechanism is bearing weight, fold into systematic.
- Real consumer reports drift between framework's adopted convention and downstream stack (currently 0 consumers per no-consumers caveat).

**Promotion path when triggered:**
1. L2 Research target list extended: research own-conventions parallel to user-stacks. Source list = SSOT entries #6-#10 (and any new adopted-pattern entries by then).
2. Diff-mode at version-bump events: when AIF / AGENTS.md / Cline ships a new version, L2 fetches current pattern via context7, compares to last-cached pattern in research-cache, surfaces diff as `research-patches/` entry.
3. CI integration: weekly cron job (or per-phase-entry sweep) running L2 own-conventions check; staleness flags become CI warnings.

**Out of scope for v1:** continuous polling (Option C — over-engineered for 1-3 maintainer scale, conflicts with own §6.0 #2 build-vs-reuse discipline); custom drift-detection tool (open research problem, disproportionate cost for one class of drift).

**Cross-references:** [`.claude/rules/phase-research-coverage.md` §4 anti-patterns](../../.claude/rules/phase-research-coverage.md) — `adopted-pattern-drift` tag added in same branch; [`prior-art-evaluations.md` §5 staleness policy](prior-art-evaluations.md) — extends to entries #6-#10; [open-questions.md §13.16](open-questions.md) — discipline-layer SSOT (parallel cadence-trigger pattern).
