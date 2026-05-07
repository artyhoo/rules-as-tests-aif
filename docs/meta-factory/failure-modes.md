# Meta-Factory: Failure modes и пауза/возобновление

> Source: PROPOSAL.md §5 (split в Phase 1.D, 2026-05-07)
> Companion: [PROPOSAL.md](PROPOSAL.md) (overview)

---

## 5. Failure modes и пауза/возобновление

(Ответ на открытый вопрос 5: «устанавливается база, и на паузу, можно продолжить потом».)

### 5.1 Stateful installer

Установка — не атомарная команда, а **state machine** с persistent state в `.meta-factory-state.json`:

```json
{
  "phase": "research-completed",
  "last-completed-step": "synthesize-R12",
  "pending-steps": ["validate-R12", "synthesize-R13", "validate-R13", ...],
  "started-at": "2026-05-07T10:00:00Z",
  "stack": { ... },
  "research-cache-ref": "..."
}
```

Каждая фаза:
1. Базовая установка (Layer 0 + 1 + skeleton). **Атомарная**, быстрая.
2. Stack detection. **Атомарная**.
3. Research. **Можно прервать**, возобновится с того же места.
4. Synthesis. **По правилу за раз**, прерывание безопасно.
5. Validation. **По правилу за раз**, прерывание безопасно.
6. Final install. **Атомарная**, должна пройти целиком.

### 5.2 Команды

```
npx meta-factory install                  # начать или продолжить с last state
npx meta-factory install --resume         # явно продолжить
npx meta-factory install --restart        # начать с нуля
npx meta-factory status                   # показать где остановились
npx meta-factory status --verify          # проверить, что сделано
```

### 5.3 Защита от прерываний

- Atomic file writes (через temp + rename)
- Lock-файл `.meta-factory.lock` с PID, чтобы не запустить параллельно две установки
- При offline-режиме на фазе research: пауза + сообщение «нужен интернет, повтори когда будет»
- Каждое сгенерированное правило записывается отдельным коммитом (опционально), чтобы можно было откатить точечно

### 5.4 Failure без интернета (ответ на вопрос 4)

Минимальный режим: использовать локальный `research-cache.json`, если он есть. Если нет:
- Установить только invariant core (R1-R10)
- Сообщить: «research недоступен; установлены generic правила; запустите `meta-factory install --resume` когда появится интернет»
- Не падать, не блокировать пользователя
