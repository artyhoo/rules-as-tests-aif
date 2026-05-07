# Meta-Factory: Архитектурные слои и Path A/B

> Source: PROPOSAL.md §2 + §3 (split в Phase 1.D, 2026-05-07)
> Companion: [PROPOSAL.md](PROPOSAL.md) (overview)

---

## 2. Архитектурные слои

### 2.1 Шесть слоёв

```
Layer 0 — Invariant Core (никогда не генерится)
Layer 1 — Stack Detector
Layer 2 — Research Agent
Layer 3 — Rule Synthesizer
Layer 4 — Self-Validator
Layer 5 — Installer
```

Поток данных: `0 → 1 → 2 → 3 → 4 → 5`. Layer 4 имеет **обратную связь** в Layer 3 (отклонённые правила возвращаются на регенерацию или в human review).

### 2.2 Layer 0 — Invariant Core

**Что внутри.** То, что никогда не генерится и определяет «настоящий пакет»:

| Компонент | Содержание | Почему invariant |
|---|---|---|
| Принципы | 5 layers framework, AST > grep, paired negative tests, mutation testing, two-AI review (via AIF `review-sidecar` with `model: opus` override) | Это сам тезис; если генерировать — теряется опора |
| Meta-rules | «every rule has executable check», «no tautology», «documents lie», «MUST не демотируется до should» | Критерии валидности любого LLM-output |
| Workflow контракт | detect → research → synthesize → validate → install | Контракт между фазами |
| Schema manifest | JSON Schema для `rules-manifest.json` | Фиксирует формат, в который research должен попадать |
| Generic R-rules | TS hygiene (R1), async correctness (R5), errors (R6), naming (R10) — стэк-независимы | Одинаковы для Next 14/15/16, Fastify 4/5, Astro |
| Validator | rule-tester прогон, mutation testing, negative-test gate | Стоит на выходе, режет мусор |
| Audit-self CI | Проверка пакета своими же принципами | Без этого «принципы» — пустые слова |

**Граница invariant ↔ generated.** Каждый компонент инварианта покрыт **тестами на сам инвариант**: при любом изменении core эти тесты прогоняются и проверяют, что:
- Schema manifest не сломана
- Validator не пропускает заведомо плохие правила (positive test)
- Validator не отвергает заведомо хорошие правила (negative test)
- Generic R-rules компилируются и проходят rule-tester

См. [acceptance-tests.md](acceptance-tests.md) §6.3 «Acceptance test для самого core».

### 2.3 Layer 1 — Stack Detector

**Что делает.** Парсит `package.json`, lock-файлы, конфиги, структуру каталогов. Возвращает structured `stack.json`:

```json
{
  "framework": { "name": "next", "version": "16.2.1", "router": "app" },
  "runtime": { "name": "node", "version": "20.18.0" },
  "language": { "name": "typescript", "version": "5.7.2" },
  "patterns": ["server-actions", "rsc", "form-data", "use-cache"],
  "structure": {
    "kind": "monolith-app",
    "src-layout": "app-router",
    "test-runner": "vitest"
  },
  "missing": ["opentelemetry", "playwright", "storybook"]
}
```

**Что НЕ делает.** Не принимает решений о правилах. Только наблюдение, факты, без интерпретации.

### 2.4 Layer 2 — Research Agent

**Что делает.** Для каждого detected паттерна:
1. Идёт в `context7` MCP за официальной документацией (allowlist).
2. WebSearch с allowlist (nextjs.org, react.dev, vercel.com/docs, MDN, official changelogs).
3. Извлекает best practices + anti-patterns.
4. Структурирует в `research-cache.json` под версию.

**Granularity (см. ответ на вопрос 1).** Двойная: **и** на уровне фреймворка целиком («Next 16.2 patterns»), **и** на уровне отдельных фич («Server Actions return type pattern в Next 16.2»). При генерации правил учитываются их взаимодействия — например, Turbopack default в 16 влияет на то, как Stryker должен мутировать.

**Diff-режим (см. ответ на вопрос 2).** При апгрейде версии (Next 15 → 16):
1. Берётся существующий `rules-lock.json` для Next 15.
2. Research даёт **только дельту**: что изменилось между 15 и 16 в best practices.
3. Synthesizer актуализирует правила точечно, не переписывая всё.
4. Diff показывается человеку на review.

Это решает «не переписываем заново, только актуализируем».

**Защита от prompt injection.** Жёсткий allowlist источников. WebSearch без allowlist для best practices — запрещён. Только официальные docs.

### 2.5 Layer 3 — Rule Synthesizer

**Что делает.** На основе research'а выводит:
- ESLint правила (конфигурация существующих плагинов — Path A) или сам AST-плагин (Path B, см. §3)
- Negative test cases (обязательно для каждого правила)
- Audit probes
- RULES.md fragments под стек
- ESLint flat config с правильным scoping

**Output формат.** Tentative `rules-manifest.json`:

```json
{
  "R12": {
    "title": "Server vs Client Components (Next 16)",
    "stack": ["next@>=15"],
    "applies-to": ["src/app/**/*.tsx"],
    "requires-package": "next",
    "check": {
      "type": "eslint",
      "plugin": "rules-as-tests",
      "rule": "no-server-imports-in-client",
      "config": "error"
    },
    "negative-test": {
      "input": "'use client'\\nimport fs from 'node:fs'\\nexport default function X() {}",
      "expect-violation": "no-server-imports-in-client"
    },
    "examples": {
      "bad": "...",
      "good": "..."
    },
    "research-source": "nextjs.org/docs/app/building-your-application/rendering",
    "research-version": "16.2.1",
    "research-fetched-at": "2026-05-07T10:00:00Z"
  }
}
```

### 2.6 Layer 4 — Self-Validator

**Что делает.** Прогоняет invariant-проверки против каждого сгенерированного правила:

1. **Schema check** — соответствует JSON Schema.
2. **rule-tester прогон** — для каждого правила запускается positive case (нарушение → ошибка) и negative case (валидный код → ошибки нет).
3. **Mutation на правиле** — Stryker мутирует AST-логику правила; тесты должны убить мутантов.
4. **Tautology check** — правило не должно срабатывать на пустом коде или на коде без целевой конструкции.
5. **Two-AI review** — второй агент в холодную смотрит правило и его тесты, ищет тавтологию или пропуски.
6. **Cross-rule conflict check** — новое правило не противоречит существующим (например, не запрещает паттерн, который другое правило требует).

**Отклонение.** Если хоть один gate провален — правило **не пишется на диск**. Возврат в Layer 3 для регенерации (с feedback'ом от validator) или в human review.

**Это и есть применение собственных принципов пакета к LLM-output.**

### 2.7 Layer 5 — Installer

**Что делает.**
1. Записывает только validated правила в проект.
2. Генерит `RULES.md`, `eslint.config.mjs`, `audit-ai-docs.sh`, GitHub Actions workflow из manifest.
3. Создаёт `rules-lock.json` для воспроизводимости.
4. Устанавливает npm deps, husky, скрипты.
5. После установки запускает Layer 4 ещё раз против установленного — финальная meta-проверка.

---

## 3. Path A vs Path B (генерация AST-правил)

### 3.1 Path A — безопасный (default)

**Что генерится:** конфигурация существующих плагинов + список применимых плагинов.

Research отвечает на вопрос «какие плагины и в каких настройках нужны для Next 16.2». Например:
- Включить `eslint-plugin-react-compiler` (новый для React 19+)
- Выключить часть `react-hooks/exhaustive-deps` (компилятор делает за нас)
- Скорректировать scoping `no-restricted-imports` под App Router

LLM не пишет TypeScript код, он **выбирает из меню**. Риск ошибки минимальный.

### 3.2 Path B — амбициозный (опционально)

**Что генерится:** сам AST-плагин TypeScript.

LLM получает описание паттерна → генерит `eslint-rule.ts` + `rule-tester.test.ts`. Validator прогоняет. Если все negative tests падают и positive проходят — правило допускается.

**Риск.** Сгенерированный TS-код может зависнуть на edge cases (template strings, JSX spread, conditional rendering). Validator должен покрывать их matrix-тестами.

**Когда применять.** Только когда Path A не покрывает потребность (новый паттерн, для которого нет готового плагина). С обязательным **human review checkpoint** перед commit'ом.

### 3.3 Переключение

Конфигурация в `meta-factory.config.json`:
```json
{
  "synthesis-mode": "conservative",  // только Path A
  "synthesis-mode": "creative",       // Path A + Path B с human review
  "synthesis-mode": "research-only"   // не генерить, только репортить findings
}
```

Default — `conservative`.
