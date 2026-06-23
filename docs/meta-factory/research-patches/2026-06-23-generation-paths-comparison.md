<!-- scope:generation-paths-comparison -->
# Сравнение двух путей генерации — research-patch

> Scope: gap «два независимо смёрженных на `staging` подхода к генерации правил — конкурируют, поглощают или слоятся?». Folder-authority: [research-patches/](./) (scope-bound by gap). Kickoff-источник: [`.claude/orchestrator-prompts/generation-paths-comparison/kickoff.md`](../../../.claude/orchestrator-prompts/generation-paths-comparison/kickoff.md).
> Метод: чтение кода с `origin/staging` (не с рабочей ветки — `#verify-against-source-of-truth`), prior-art WebSearch ≥3 формулировки, T11/T15. **Эта сессия победителя не выбирает** — §4 = DECISION-NEEDED оператору ([reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md)).
> Дата: 2026-06-23.

## §0 Два пути (что именно сравнивается)

- **Путь A — `generator-forbid-mvp` / S4 «спека → компиляция forbid».** Детерминированный компилятор forbid-спеки в данные ESLint-правила + RULES.md + провенанс; sole-writer (S5); анти-пустышка-гейты до коммита. `$0`, CI-safe.
- **Путь B — `stage-2-generate-path` / live-LLM generate-path (#646).** LLM «выбирает из меню» (S2, `menu-pick.ts`) или авторит rule-body для recipe-less стека (S4, `generate.ts`); install-time на подписке консьюмера, никогда в CI.

## §1 Гипотеза → ВЕРДИКТ: **СЛОЯТСЯ** (layer), не конкурируют

Гипотеза кикоффа §1 (слоятся / поглощение / конкуренция) разрешается на **факте кода**, а не на нарративе:

1. **Оба пути живут в одном пакете** `packages/core/synthesizer/` и экспортятся из одного `index.ts`:
   `index.ts:7-8` — `export { synthesize } from './synthesize.ts'` (A) **и** `export { synthesizeLive } from './menu-pick.ts'` (B). Комментарий `index.ts:5`: «Stage 2 adds synthesizeLive… both paths compose via the same primitives».

2. **Путь B импортирует и вызывает примитивы пути A** (а не дублирует их):
   `menu-pick.ts:10-11` — `import { loadRecipe } from './synthesize.ts'` + `import { compileDeclarativeMd } from './compile-declarative-md.ts'`. Хедер `menu-pick.ts:2-3`: «Reuses loadRecipe + mergeEslintRuleConfig from the curated path additively. The curated synthesize() is not touched; both paths compose via the same primitives». В теле `synthesizeLive` для `rule.check.type === 'declarative'` вызывается **`compileDeclarativeMd(rule)`** — т.е. компилятор пути A исполняется внутри пути B.

3. **Общий барьер L4 provenance-agnostic.** `validator/validate.ts:21` — `export function validate(plan: SynthesisPlan)`; берёт `SynthesisPlan` независимо от того, кто его собрал (`synthesize` / `synthesizeLive` / `synthesizeGenerate`). Хедер `generate.ts:8`: «L4 + L5 are byte-identical — this is a new input path, not a change to the validator».

**Вывод:** A = back-half (синтез тела правила + RULES.md + провенанс), B = front-half (LLM выбирает/сорсит, что синтезировать). Это **разные стадии одного пайплайна**, уже физически скомпонованные. Поглощения нет (ни один не делает работу другого), конкуренции за одну роль нет.

**Точность (independent cross-check 2026-06-23):** функций генерации **три**, не две — `synthesize` (чистый A), `synthesizeLive` (`menu-pick.ts:16`, Stage 2 «LLM из меню»), `synthesizeGenerate` (`generate.ts:15`, Stage 4 recipe-less). Все три → один `validate`. Сшивка с `compileDeclarativeMd` сейчас живёт в `synthesizeLive` (`menu-pick.ts:58`), а `generate.ts` его НЕ зовёт (grep=0) — поэтому шов i-2 добавляется именно в `generate.ts`. Второго конкурирующего генератора нет (sweep `export function (synthesize|generate|compile)*` = эти четыре; `meta-factory/src/synthesizer/index.ts` = чистый реэкспорт core).

**Prior-art подтверждает (T11, §3):** «детерминированное-сначала, LLM-добор, выход LLM через детерминированную валидацию» — это зрелый индустриальный паттерн (two-stage regex→LLM; DSL-компиляция стандартов в линтер-конфиг; DSPy; guardrails self-heal). Слоение — норма, не самодеятельность проекта.

## §2 Оси сравнения (факты; каждая ячейка — `file:line`/прогон, ноль «would»)

| Ось | Путь A (forbid-compile) | Путь B (LLM generate: `menu-pick` S2 + `generate` S4) |
|---|---|---|
| Роль в пайплайне | back-half: `synthesize(plan)→SynthesisPlan`, `synthesize.ts:63` | front-half: выбор/сорсинг тела, `menu-pick.ts`/`generate.ts` |
| Класс правил | `forbid` declarative selector; require/type-aware = G3b, OUT (kickoff §0) | S2: только существующие рецепты (LLM **выбирает**, `menu-pick.ts:21` filter `loadRecipe`); S4: любой `eslint`-config или `manual` plugin (`generate.ts:51-55`) |
| Детерминизм | полный — `synthesize` pure, без I/O | недетерминирован (`client.generate`/`pick`), но за DI-портом; тесты на stub (`generate-port.ts`, `menu-pick-port.ts`) |
| Стоимость / LLM в CI | `$0`, CI-safe (компиляция данных) | install-time на подписке консьюмера, **никогда в CI** ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)) |
| Канал отказа | S3 анти-пустышка **до коммита** + S5; `declarative`→L4 roundtrip | существующий L4 на выходе — **но `manual` L4 пропускает** (см. след. строка) |
| Безопасность выхода (adversarial/malformed в репо консьюмера) | `declarative` всегда исполняемо-валидируется: `gate-rule-tester.ts:69` гоняет `eslint`+`declarative` | **ЗАЗОР (тихий):** S4 эмитит `manual` для plugin вне `KNOWN_PLUGINS` (`generate.ts:51-55`); `gate-rule-tester.ts:5` пропускает `manual` → правило едет **без исполняемого roundtrip**, причём `validate().ok` остаётся **true** даже когда часть правил `manual` (доказано `generate.test.ts` — план с manual-правилами ПРИНЯТ). L4 говорит «ок», сторож не проверен. |
| Генерализация на новый стек без оракула | нет (нужна спека/рецепт) | **да** — S4 recipe-less, главный пруф (`generate.ts:1-2`) |
| Sole-writer / провенанс | да — `verify-provenance.ts` + `canonical-rule-hash.ts` (S5) | наследует, если идёт через тот же `emit`; для `manual` — не покрыто roundtrip'ом |
| Общий субстрат | `SynthesisPlan`, `mergeEslintRuleConfig`, `compileDeclarativeMd`, L4 `validate` | **те же** — B **импортирует** их у A (`menu-pick.ts:10-11`) |

Ни одной `INCONCLUSIVE`: все ячейки закрыты кодом с `origin/staging`.

## §3 Prior-art (T11, WebSearch ≥3 формулировки)

Доминирующий паттерн в литературе/индустрии — **именно слоение A+B**, с детерминированной валидацией LLM-выхода:

- **DSL-компиляция стандартов в линтер-конфиг** — «Still Manual? Automated Linter Configuration via DSL-Based LLM Compilation of Coding Standards» ([arxiv 2602.07783](https://arxiv.org/html/2602.07783v1)). Близкий аналог пути A (spec→compile), но с LLM на парсинге NL-стандарта. Вердикт: **REFERENCE** (наш A детерминирован полностью; их фронт — LLM).
- **Two-stage deterministic→LLM** — детерминированные правила первыми, LLM только когда первые молчат/конфликтуют (экономия токенов/времени) — [Hybrid AI, Towards Data Science](https://towardsdatascience.com/hybrid-ai-combining-deterministic-analytics-with-llm-reasoning/). Прямой аналог рекомендуемого шва. Вердикт: **ADOPT VOCABULARY** (паттерн «deterministic-first, LLM-fallback»).
- **Guardrails self-heal / GuardAgent** — LLM-выход исполняется как детерминированная политика, re-ask на провале ([LlamaFirewall, arxiv 2505.03574](https://arxiv.org/pdf/2505.03574); [LLM guardrails](https://www.leanware.co/insights/llm-guardrails)). Аналог «L4 отвергает → degrade/re-ask». Вердикт: **REFERENCE**.
- **Линтеры как исполняемая спека для агентов / fitness functions** — [Factory.ai «Using Linters to Direct Agents»](https://factory.ai/news/using-linters-to-direct-agents), [Fitness Functions as architecture unit tests](https://xpromx.me/articles/fitness-functions-unit-tests-for-your-architecture/). Подтверждает тезис проекта; не меняет вердикт.

**Ни один источник не предлагает «выбрать один путь».** Все зрелые системы комбинируют. Предлагаемые SSOT-записи (для append в `prior-art-evaluations.md` на merge-шаге, не в этой doc-only сессии): DSL-compile-standards → REFERENCE; deterministic-first/LLM-fallback → ADOPT VOCABULARY.

## §4 DECISION-NEEDED (решает оператор — [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md))

```text
DECISION-NEEDED: как роутить recipe-less forbid-class выход пути B (S4), чтобы не терять
исполняемую валидацию — единственный остаточный шов между путями (всё остальное уже слоится).

Контекст-факт: gate-rule-tester.ts:5,69 ПРОПУСКАЕТ check.type=manual; generate.ts:51-55
эмитит manual для plugin вне KNOWN_PLUGINS → такое правило едет в репо консьюмера БЕЗ
исполняемого roundtrip'а, ТИХО (validate().ok=true даже при manual-правилах, доказано
generate.test.ts). Путь A для forbid-класса этого зазора не имеет (declarative→L4).

Option A (status quo) → B свободно эмитит eslint/manual; A держит declared forbids.
   Последствие: просто, но manual-выход обходит тезис «documents lie; tests don't».
Option B (жёсткий роутинг) → весь forbid-class выход B обязан идти через declarative-компилятор A.
   Последствие: максимум безопасности; но B сужается до declarative-выразимого подмножества,
   теряя часть generalize-силы S4 (eslint-plugin правила).
Option A+B (гибрид) → B предлагает; если выразимо как declarative forbid → компилировать через A
   (детерминизм + L4 + S5 sole-writer); иначе eslint (если KNOWN_PLUGIN — всё ещё roundtrip);
   иначе manual С явным human-review флагом + провенансом.
   Последствие: закрывает manual-зазор для forbid-класса, не урезая reach пути B; ровно то
   слоение, которое код уже наполовину реализует (menu-pick уже зовёт compileDeclarativeMd).

Рекомендация сессии (backed, НЕ приказ): Option A+B (гибрид). Основания на факте:
  (1) код уже половину этого делает — menu-pick.ts:58 вызывает compileDeclarativeMd для declarative;
  (2) prior-art §3 — «deterministic-first, LLM-fallback с детерминированной валидацией» = зрелый паттерн;
  (3) закрывает единственный найденный зазор безопасности (§2 строка «Безопасность выхода»)
      минимальным изменением, без сужения B.
Решает: оператор или отдельная /orchestrator-сессия. Эта сессия останавливается здесь.

Готовый-к-GO TDD-план Option A+B: docs/superpowers/plans/2026-06-23-generation-path-seam.md
  (артефакт, НЕ исполнение — код не тронут до GO).

РЕШЕНИЕ ОПЕРАТОРА (Art, 2026-06-23): **Option A+B (гибрид)**. План un-gated; реализация — capability-commit
через staging + Phase -1 review (см. план §Execution Handoff). Шов: B forbid-выразимое → declarative-компилятор A.
```

## §5 Self-application (T15)

Применил ли я к этому сравнению собственный тезис «documents lie; tests don't»? — Да, частично:
каждая ячейка §2 backed `file:line` с `origin/staging` (не прозой, не памятью), а ключевой
вывод §1 — исполняемым фактом импорта (`menu-pick.ts:10-11` + `index.ts:7-8`), не заявлением
кикоффов. Остаточная честность: §3 prior-art-вердикты (REFERENCE/ADOPT VOCABULARY) — это
суждение, не прогон; помечены как предлагаемые SSOT-записи, не как принятые. Cold-review самого
кикоффа уже поймал один `#verify-against-source-of-truth` промах (ложное «спека не на staging» —
диагностика не с той ветки), что подтверждает: проверять надо против `origin/staging`, что и сделано.

## §6 См. также

- [`.claude/orchestrator-prompts/generation-paths-comparison/kickoff.md`](../../../.claude/orchestrator-prompts/generation-paths-comparison/kickoff.md) — kickoff-источник.
- [`docs/superpowers/plans/2026-06-23-generation-path-seam.md`](../../superpowers/plans/2026-06-23-generation-path-seam.md) — готовый TDD-план Option A+B (gated на GO).
- [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) · [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) · [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md).
