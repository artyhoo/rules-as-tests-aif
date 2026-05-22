# Research-patch — Storm-readiness as positioning (случайная готовность → востребованность)

> **Scope:** один стратегический инсайт + поставленная цель. Наследует авторитет папки `research-patches/` (one patch per gap, append-only).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Niche/wave decomposition — see [niche-strategy roadmap](2026-05-21-niche-strategy-and-growth-roadmap.md). Storm decision-of-record — see [wave-sequencing-plan.md §5.3](../wave-sequencing-plan.md).
>
> **Origin:** 2026-05-22, сессия «Discuss returning unique developments to ecosystem». Maintainer-surfaced инсайт о сходимости двух целей. Narrative record: [project-history-book.md Часть XIV](../project-history-book.md) + [v3 Часть XIV](../project-history-book-v3.md).

## §1 — Insight (the convergence)

Конечная цель проекта (установка одной кнопкой + позиционирование «companion/дополнение, усиливающее соседей и занимающее нишу» — [niche-roadmap §4](2026-05-21-niche-strategy-and-growth-roadmap.md)) и его устойчивость к headless-billing буре 15 июня ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md), N8 deterministic-offload — [N8 R-phase](2026-05-22-n8-rphase-findings.md)) оказались **одной и той же работой**. AI-агностичный детерминированный субстрат строился ради переносимости/чистоплотности; буря превращает то же свойство в экономическую ценность — каждый детерминированный чек = несделанный платный `claude -p`. Цель A (ниша) преследовалась намеренно; цель B (storm-resilience как ценность) закрылась попутно.

## §2 — Goal (set; maintainer-owned, admission = maintainer call)

**Цель:** разобраться, как обратить случайную готовность в реальную востребованность — «оказаться там, где уже ищут», а не «успеть к закрытию двери». Конкретно ответить:

- **(a)** какие части субстрата переносимы как самостоятельная «storm-survival дисциплина» (кандидаты: `no-paid-llm-in-ci` как политика, deterministic-offload как паттерн, channel-selection two-axis как cost-выбор);
- **(b)** форма артефакта — отдельный standalone vs секция-вклад соседу-методологу (Superpowers PR) vs мета-скилл;
- **(c)** аудитория и канал — сегмент headless / Agent-SDK / CI-loop runners (НЕ интерактивная подписка);
- **(d)** тайминг против даты 15 июня и против N7-dogfood-гейта (этот слайс частично декуплен от N7, т.к. дисциплина уже доказана догфудингом с мая).

Композиция [N5 (give-back)](2026-05-21-niche-strategy-and-growth-roadmap.md) + [N1 (niche-validation)](2026-05-21-niche-strategy-and-growth-roadmap.md) с новым demand-driver-фреймингом. Это стратегический пункт — поставлен, не решён ([reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md)).

## §3 — Falsifier (recommendation-discipline H1)

Тезис «спрос материализуется» — **ставка, не факт.** Неверен, если: (i) боль узкая — метеллинг бьёт по headless / Agent SDK / CI-петлям, НЕ по subscription-bundled интерактиву → аудитория сегмент, а не «все»; (ii) затронутые молча доплачивают overage, а не ищут дисциплину; (iii) «снизь LLM-косты» — переполненный месседж, и принципиальный enforcement-угол не дифференцируется. До любого load-bearing хода: валидировать спрос эмпирически (N1 6-item search + сигнал, что люди *активно* ищут).

## §4 — §1.7 self-reflexive note

- **Forward-check:** соответствует [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (ровно то свойство, которое здесь используется как рычаг), [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (отдаём *словарь/дисциплину*, держим интегрированный ров), [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) (цель surfaced + maintainer-owned, не решена здесь).
- **Backward-check:** новое правило не вводится → sweep существующих артефактов не нужен. Ссылается на niche-roadmap §4 (N1/N5) и книгу Часть XIV без их мутации. Названное напряжение (в книге Часть XIV): отдаваемый артефакт — это проза-дисциплина, наименее доверяемый проектом канал; честный give-back = субстрат+проводка, а не одна проза.

## §5 — See also

- [niche-strategy + growth roadmap §4](2026-05-21-niche-strategy-and-growth-roadmap.md) — Wave N0 (буря), N1 (validate), N5 (give-back).
- [wave-sequencing-plan.md §5.3](../wave-sequencing-plan.md) — storm decision-of-record (defer-build + arm utilisation trigger).
- [project-history-book.md Часть XIV](../project-history-book.md) / [v3 Часть XIV](../project-history-book-v3.md) — нарративная запись.
- [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md), [N8 R-phase findings](2026-05-22-n8-rphase-findings.md) — доказательства непромокаемости субстрата.

## §6 — Tags

`#positioning` `#storm-readiness` `#demand-validation` `#give-back` `#convergence` `#bet-not-fact`
