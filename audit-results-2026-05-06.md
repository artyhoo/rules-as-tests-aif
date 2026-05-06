# Отчёт аудита — rules-as-tests-aif

> Аудитор: фреш-сессия Claude Code, без памяти о решениях разработки.
> Дата: 2026-05-06
> Промпт: AUDIT-PROMPT.md
> Изменений в файлах не делал — только репорт.

---

## Сводка фаз

| Фаза | Результат |
|---|---|
| 1. Механические проверки | 58 файлов, 804K. Все 7 `.sh` валидны. Все 5 `.json` валидны. Нет `.md` >500 строк. 1 «мёртвая» ссылка (анти-паттерн, обоснован). Stale-paths: чисто. |
| 2. Rule→probe маппинг | Все R1-R20 имеют либо probe, либо явную пометку manual/delegated. Но **regex CI-чека сломан** (см. Finding 2). |
| 3. Качество контента | overview.md и checks-map.md НЕ дублируют друг друга (5 слоёв vs 8 уровней). best-practices-sidecar и review-sidecar разделены чисто. ai-traps lessons (#1-#8) корректны. |
| 4. Самоприменение | **Пакет НЕ проходит свой собственный audit-ai-docs.sh** — артефакты негативных тестов лежат в корне и роняют 7 проверок. |
| 5. Setup verification | Не запускал в sandbox (нет необходимости — дефекты найдены раньше). |
| 6. Известные пробелы | **Phase 6 промпта устарел**: оба ожидаемых пробела (audit-self.yml + tests/audit/) уже существуют. |

---

## Finding 1

- **Severity**: BLOCKER
- **Phase**: 4 (self-application)
- **Location**: корень пакета — `src/`, `AGENTS.md`, `.mcp.json` (все untracked)
- **What I saw**: В корне пакета лежат файлы-артефакты от запуска негативных тестов: `src/domain/bad.ts` с `as any`, `src/web/handlers/order.ts` с `OrderSchema.parse`, `src/lib/bad.ts` с `import _ from "lodash"`, `AGENTS.md` со ссылкой на `phantom-skill`, `.mcp.json` с `_comment_TODO`. Запуск `bash scripts/audit-ai-docs.sh` из корня пакета даёт 7 FAIL + 1 WARN.
- **Why it's a problem**: Пакет проповедует «documents lie; tests don't» и принцип «каждое правило — исполнимый тест», но сам не проходит свой же аудит. Это подрывает основной тезис. Кроме того, файлы untracked — то есть были оставлены после ad-hoc запусков и попали бы в `npm pack`/zip.
- **Suggested fix**: Удалить из пакета все 13 файлов в `src/`, `AGENTS.md` и `.mcp.json`; добавить эти пути в `.gitignore`; в `tests/audit/audit-ai-docs.test.sh` выяснить, откуда они появились (mktemp работает корректно — значит, кто-то когда-то запускал тесты вручную в корне); добавить в `audit-self.yml` запуск `bash scripts/audit-ai-docs.sh` против собственного репо как mechanical check.

---

## Finding 2

- **Severity**: BLOCKER
- **Phase**: 2 (rule-to-probe)
- **Location**: `.github/workflows/audit-self.yml` строки 73-93 (job `rule-to-probe`)
- **What I saw**: Регулярка job `rule-to-probe` ловит две ложные «orphan rule» ошибки на собственном репо: (1) `## Rule maintenance` секция в RULES.md распознаётся как правило с именем `Rule` (регекс `R[0-9a-z]+` жадно матчит `Rule`); (2) `R16` объявлен orphan, потому что `skip_unless R16\b` не матчит `skip_unless R16a` / `skip_unless R16b` (разделение probe-имени на части). Локальный прогон даёт `exit=1`.
- **Why it's a problem**: CI самопроверки сломан и постоянно красный. Пакет, вводящий концепцию «every rule has executable check», поставил себе сломанный исполнимый чек. Это будет шуметь на каждом PR и приучит игнорировать audit-self.yml.
- **Suggested fix**: Поменять регекс на `^## R[0-9]+[a-z]?` (учитывая R16a/R16b и исключая `## Rule…`); либо ослабить word-boundary до `[a-z]*` после номера; добавить негативный тест на сам этот workflow-step.

---

## Finding 3

- **Severity**: MAJOR
- **Phase**: 3 (content quality)
- **Location**: 3 источника описывают R2 по-разному:
  - `factory/RULES.md` строки 16-25
  - `agents/best-practices-sidecar.md` строка 32
  - `scripts/audit-ai-docs.sh` строки 98-114
- **What I saw**: RULES.md R2: «MUST parse `request.body` через Zod, use `.safeParse()`». best-practices-sidecar: «grep `request.body` без рядом стоящего `.parse`-вызова». Реальный probe: `grep -rEn "Schema\.parse\(|schema\.parse\("` минус `safeParse` — то есть запрещает `.parse()` и требует только `.safeParse()`. Три семантики: «parse в любой форме обязателен» / «должен быть рядом parse-вызов» / «parse запрещён, только safeParse».
- **Why it's a problem**: Это ровно та трещина «documents lie», против которой пакет позиционируется. Чек best-practices-sidecar пропустит код с `Schema.parse()`, который probe тут же зарубит. AI-агент будет получать противоречивую обратную связь и в итоге переключится на «MUST should» (Lesson #6 из ai-traps).
- **Suggested fix**: Привести три источника к одной формулировке — выбрать политику (рекомендую `safeParse`-only, как в probe), переписать RULES.md R2 однозначно, обновить таблицу best-practices-sidecar чтобы её grep совпадал с probe, добавить explicit пример «valid/invalid» в RULES.md.

---

## Finding 4

- **Severity**: MAJOR
- **Phase**: 6 (known gaps)
- **Location**: `AUDIT-PROMPT.md` строки 159-209
- **What I saw**: Phase 6 явно говорит: «These two findings are EXPECTED in the first audit. Reporting them confirms the audit prompt is working». Имеется в виду отсутствие `.github/workflows/audit-self.yml` и `tests/audit/audit-ai-docs.test.sh`. Оба файла существуют и работают (16/16 негативных тестов проходят, workflow содержит 3 job-а).
- **Why it's a problem**: Промпт сам себя инвалидировал: фреш-сессия следует ему буквально, репортит «MAJOR — gap exists» там, где gap уже закрыт, либо удивлённо отвечает «expected gap absent». Пользователь, копирующий промпт в новую сессию, получит шумные и некорректные finding'и. Это пример того, как «specification by example» (промпт — это пример) дрейфует от реальности — Layer 5 анти-паттерн.
- **Suggested fix**: Переписать Phase 6 как «verify these two artifacts exist and pass»: проверить `.github/workflows/audit-self.yml` syntax + наличие 3 job-ов, прогнать `bash tests/audit/audit-ai-docs.test.sh` с ожиданием `0 fail`. Из «known gaps» сделать «known regression points».

---

## Finding 5

- **Severity**: MINOR
- **Phase**: 4 (self-application — R10 naming)
- **Location**: `factory/ARCHITECTURE.template.md`
- **What I saw**: Файл назван `*.template.md`, но не содержит ни одного `<PLACEHOLDER>`. Это законченный конкретный документ архитектуры серверного TS. Соседний `DESCRIPTION.template.md` — настоящий шаблон с `<PROJECT_NAME>` и `<Fastify | Hono | Express>`. Соседний `ARCHITECTURE.react-next.md` тоже без суффикса `.template`. Конвенция нейминга в `factory/` непоследовательна.
- **Why it's a problem**: R10 (Naming) собственного пакета: «filename matches content». Имя обещает шаблон с пробелами под заполнение, контент — готовый документ. AI, читающий описание из INSTALL-FOR-AI.md «replace placeholders below», не найдёт placeholder'ов и потенциально сломает рабочий файл.
- **Suggested fix**: Либо переименовать в `ARCHITECTURE.ts-server.md` (по аналогии с `ARCHITECTURE.react-next.md`) и убрать суффикс `.template`, либо добавить в верхушку файла комментарий «if you keep server-TS layout — rename to ARCHITECTURE.md and use as-is».

---

## Finding 6

- **Severity**: MINOR
- **Phase**: 3 (item 11 — SKILL.md frontmatter)
- **Location**: `skills/rules-as-tests/SKILL.md` строка 3
- **What I saw**: `description:` начинается с «Convert any codebase rule…», а не с «Use when…». Промпт явно требует «description starts with 'Use when'».
- **Why it's a problem**: Триггер-конвенция Claude Code (см. описания других skills — `ai-docs`, `keybindings-help` etc.) ожидает старт с «Use when». Не блокер — описание содержит «Use this skill whenever…» во второй фразе и большой список keywords — но косметическое нарушение собственной нормы.
- **Suggested fix**: Перефразировать первую фразу: «Use when enforcing code quality, fighting AI-generated drift, setting up linters/tests/CI/pre-commit, or treating any codebase rule as an executable test…».

---

## Дополнительные наблюдения (INFO)

- **INFO 1**: SKILL.md = 133 строки (~4k токенов всегда), 5 references = 1337 строк (~40k токенов max при загрузке всего). README.md заявляет «lightweight» только в контексте «mutation testing», а не пакета. Token economy не пере-проверяется в SKILL.md, но сам hot/cold split реально работает (133 строки — компактно).
- **INFO 2**: `tests/audit/audit-ai-docs.test.sh` отлично сделан — 16 тестов, чистая изоляция через `mktemp -d`, обработка PASS/WARN отдельно. Это сильная сторона пакета, заслуживающая внимания при чтении.
- **INFO 3**: Мёртвая ссылка `docs/architecture.md` в `overview.md:105` — корректна, это пример анти-паттерна. `audit-self.yml` правильно её исключает (special case).
- **INFO 4**: `D2 probe` в `.mcp.json` пакета корректно срабатывает на `_comment_TODO` (видно в выводе аудита) — то есть пакет своим же D2 ловит свой же `.mcp.json`. Это связано с Finding 1 и подтверждает, что D2 работает.

---

## Итог

- **Total**: 6 findings (2 BLOCKER, 2 MAJOR, 2 MINOR, 4 INFO)
- **Recommendation**: **REWORK**

Любой BLOCKER переводит пакет в REWORK по правилу из промпта. Здесь два независимых BLOCKER:

1. Пакет **не проходит свой же аудит** из-за артефактов в корне → подрывает основной тезис.
2. Свой же CI самопроверки **сломан в двух регекс-местах** → не сможет пасти регрессии.

После исправления BLOCKER + Finding 3 (R2 drift) — статус FIX-AND-SHIP. Finding 4-6 — параллельно, не блокеры, но влияют на UX следующих аудитов и AI-агентов.

---

## Следующий шаг (по AUDIT-PROMPT.md «After the audit»)

В новой сессии прогнать:

```
Read audit-results-2026-05-06.md. For each finding I marked as "AGREE",
apply the suggested fix. Do not touch findings I marked "DISAGREE".
After fixes, re-run AUDIT-PROMPT.md PHASE 1-2 to verify.
```

Перед этим — пройти findings 1-6 и пометить AGREE/DISAGREE.
