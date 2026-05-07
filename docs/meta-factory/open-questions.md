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

Это нужно проработать в отдельном документе `meta-factory-and-aif.md`.

### 13.7 Operationalization L2 semantic drift detection

Acceptance criterion для L2 в [self-application.md](self-application.md) §2: «Все три источника (`skills/rules-as-tests/SKILL.md`, `references/overview.md`, `references/ai-traps.md`) семантически синхронизированы; drift detection возвращает 0 расхождений». Но **что значит «семантически»**? Возможные операционализации:

- **Symbolic:** одинаковые term'ы (e.g. «MUST» vs «should» — диcyrepancy при demotion'е)
- **Behavioral:** rule из `overview.md` проверяется тестом из `ai-traps.md` → если изменился principle и не изменился test (или наоборот) — drift
- **Embedding-based:** semantic similarity score; threshold для drift

Решение откладывается до Phase 6. До этого — manual review при любом изменении файлов из этих трёх источников.

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
