# Meta-Factory: Текущий пакет → canonical example

> Source: PROPOSAL.md §9 (split в Phase 1.D, 2026-05-07)
> Companion: [PROPOSAL.md](PROPOSAL.md) (overview)

---

## 9. Текущий пакет → canonical example

### 9.1 Новая роль

Текущий `rules-as-tests-aif` (Next 15 + TS-server) **не выкидывается**. Он получает две новые функции:

1. **Для людей** — обучающий артефакт: «вот как должна выглядеть законченная фабрика правил для Next 15. Изучи структуру, поймёшь принципы, которые core применяет ко всем стекам».
2. **Для агента** — few-shot example для генератора: «вот образец output'а; стремись к такой структуре и качеству при генерации под другие стеки».

### 9.2 Структура нового монорепо

```
rules-as-tests-aif/                     ← repo
  packages/
    core/                                ← invariant core
      principles.md
      manifest-schema.json
      validator/
      generic-rules/                     ← R1-R10
      audit-self/
    meta-factory/                        ← генератор (CLI)
      bin/meta-factory.mjs
      detector/
      research/
      synthesizer/
      installer/
    preset-next-15-canonical/            ← текущий пакет (frozen)
    preset-next-16/                      ← сгенерированный + полишинг
    preset-fastify/                      ← сгенерированный + полишинг
  examples/                              ← reference output для агента
    canonical-next-15/
    canonical-fastify-5/
  docs/
    meta-factory/                        ← этот документ и потомки
```

### 9.3 Миграционный путь

1. Извлечь invariant из текущего пакета → `packages/core/`. См. [architecture.md](architecture.md) §2.2 — список того, что invariant.
2. Текущий пакет переименовать → `packages/preset-next-15-canonical/`, заморозить.
3. Создать пустой `packages/meta-factory/` со skeleton.
4. Вдохнуть жизнь в Layer 1 (Stack Detector) — простой, хорошо тестируемый.
5. Layer 2 (Research) — средняя сложность, использует MCP.
6. Layer 3 Path A (Conservative Synthesis) — конфигурация плагинов.
7. Layer 4 (Validator) — переиспользует существующие custom ESLint rules + rule-tester.
8. Layer 5 (Installer) — переиспользует существующий `setup.sh` логику с расширениями.
9. Acceptance test: `meta-factory generate --stack=next@15` → diff с `preset-next-15-canonical` → ожидаем minimal diff.
10. Когда зелёный — запустить генерацию `preset-next-16`, ручной review, commit.
11. Path B (Creative Synthesis) — позже, когда Path A стабилизируется.
