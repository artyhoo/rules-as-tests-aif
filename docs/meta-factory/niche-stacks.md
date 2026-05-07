# Meta-Factory: Нишевые стеки

> Source: PROPOSAL.md §8 (split в Phase 1.D, 2026-05-07)
> Companion: [PROPOSAL.md](PROPOSAL.md) (overview)

---

## 8. Нишевые стеки

(Ответ на открытый вопрос 4: «как минимум предупредить точно стоит».)

### 8.1 Confidence score

Research-agent для каждого паттерна оценивает confidence:
- **High**: official docs дают чёткий best practice (Next, React, TypeScript)
- **Medium**: community consensus есть, но не в official docs (Hono, Bun)
- **Low**: данных мало, паттерны нестабильны (новые/нишевые фреймворки)

### 8.2 Поведение по уровню

| Confidence | Что делает фабрика |
|---|---|
| High | Генерит правила, прогоняет validator, устанавливает |
| Medium | Генерит, **выводит warning**: «правила основаны на community sources; ревью рекомендуется» |
| Low | **Не генерит автоматически**. Сообщает: «стек поддерживается только в research-only mode; включаем generic R1-R10, остальное напиши руками» |

### 8.3 Список поддерживаемых стеков

В `core/supported-stacks.json` — реестр с confidence-уровнями:
```json
{
  "next@>=15": "high",
  "react@>=19": "high",
  "fastify@>=4": "high",
  "hono@>=4": "medium",
  "astro@>=4": "medium",
  "bun-runtime": "low"
}
```

Реестр обновляется по мере того, как стеки набирают зрелость и accumulated research.
