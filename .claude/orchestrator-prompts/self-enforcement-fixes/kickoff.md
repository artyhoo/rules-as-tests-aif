# Self-enforcement-fixes — umbrella kickoff (I-phase)

> **Class:** operational kickoff (dispatch input). **Type:** I-phase fix — закрывает находки аудита `self-enforcement-liveness-audit` (Track A/B). Каждая задача несёт реальный gate.
> **Authoritative for:** scope починки само-энфорсмента — подключение companion-install к edit-time каналу (S1), портируемый `globs:`-сиблинг для phase-research-coverage (S2), решение по self-application living-docs-auditor + стоячим триггерам judgment-агентов (S3 — DECISION-NEEDED).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Реестр находок + доказательства — `../../AUDIT-РЕЗУЛЬТАТ-2026-06-27.md`. Методика проб — `../self-enforcement-liveness-audit/kickoff.md`.
> **Base branch:** `staging`. (Кикофф пишется → мёржится в staging → только потом dispatch — см. [kickoff-staging-placement.md](../../../.claude/rules/kickoff-staging-placement.md).)

> **Происхождение.** Аудит 2026-06-27 доказал: инъекция правил жива (5/5 FIRES), THEATRE среди суб-агентов нет, НО найден 1 SILENT-GAP (companion-install не подключён ни к одному каналу доставки) + наблюдения PARTIAL по dual-pair-паритету и стоячим триггерам. Доказательства — в реестре.

---

## §1 Цель (одной фразой)

Подключить **companion-install-principle** к edit-time каналу доставки (его детерминированный триггер `setup.d/companions.manifest` сейчас не доставляет правило ничем), достичь dual-pair-паритета для phase-research-coverage, и вынести решение по self-application living-docs-auditor — **с реальным gate'ом на каждую механическую задачу**.

## §2 Зафиксированные решения

1. Это **починка**, не аудит. Каждая механическая задача (S1, S2) обязана иметь прогон-доказательство (хук с фейковым JSON: позитив инъектит, негатив молчит), а не «добавил маркер».
2. S3 — **DECISION-NEEDED** (не механизм): living-docs source self-application и стоячие триггеры judgment-агентов — это судебные/архитектурные развилки; surface обе опции, решает мейнтейнер (см. [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md)). Не баковать выбор молчаливым действием.
3. Build-first-reuse: НЕ строить новый хук. Переиспользовать существующий `inject-matching-rule.sh` (доставляет по `<!-- globs: -->`) и `paths:` frontmatter — оба уже работают (доказано в аудите).

## §3 Стадии

| Стадия | Что даёт | Зависит от |
|---|---|---|
| **S1 — companion-install → edit-time injection** | в `.claude/rules/companion-install-principle.md` добавлен `<!-- globs: setup.d/** -->` + `<!-- inject: … -->`; прогон хука: правка `setup.d/companions.manifest` инъектит, правка вне-триггера молчит | — (старт) |
| **S2 — phase-research-coverage dual-pair паритет** | добавлен портируемый `<!-- globs: docs/meta-factory/** -->` (**обязательно prefix-форма**, НЕ `phase-*-research.md` — mid-path звезда молча не матчится, T-SEF-A) ЛИБО зафиксировано «native-only by design»; прогон хука позитив/негатив | — (∥ S1) |
| **S4 — inject-matching-rule matcher + MultiEdit** | в `.claude/settings.json` matcher для `inject-matching-rule` расширен до `Edit|Write|MultiEdit` (хук внутри уже принимает MultiEdit); прогон не нужен — but см. §7 verify | — (∥ S1) |
| **S3 — DECISION-NEEDED: living-docs self-application + judgment-нуджи** | сформулированы 2 опции по каждому пункту, переданы мейнтейнеру; механизм НЕ внедряется без выбора | S1, S2, S4 |

**Порядок:** S1 ∥ S2 ∥ S4 → S3.

> **NB по S4:** `.claude/settings.json` в `deny`-листе на `Edit/Write` — правка matcher может требовать ручного действия мейнтейнера (harness-gate). Если агент не может править settings.json — surface как ручной шаг в summary, не обходить.

## §4 S1 — детальная задача (companion-install SILENT-GAP)

**Находка (реестр Track A):** `setup.d/companions.manifest` — детерминированный триггер из §2 правила, но канал доставки на edit-time отсутствует (нет `globs:`, нет `paths:`, нет в bootstrap, нет гейта). По `rule-enforcement-channel-selection.md` шаг 3 → положено path-scoped injection.

**Сделать:** добавить в `.claude/rules/companion-install-principle.md` (на своих строках, anchored `^`):
- `<!-- globs: setup.d/** -->` (форма `prefix/**` — в подмножестве хука; покрывает `companions.manifest` + `engine.sh`).
- `<!-- inject: Companion/external-service install: detect-first, official installer only, NO version pin, free-on-subscription default. См. §1-§3. -->`

Опционально добавить `paths:` frontmatter-сиблинг (`setup.d/**`) для CC-native канала (dual-pair).

## §4b S2 — детальная задача (phase-research-coverage паритет)

**Находка:** есть `paths:` (CC-native), нет портируемого `globs:` → для не-CC хорнесса edit-time напоминание отсутствует. Добавить `<!-- globs: -->`-сиблинг, зеркалящий существующие `paths:` (`docs/meta-factory/phase-*-research.md` не в подмножестве — точные/prefix формы только; использовать `docs/meta-factory/** ` префиксом ИЛИ оставить как осознанный native-only, если приоритет низкий — зафиксировать выбор). Низкий приоритет; если мейнтейнер решает оставить native-only — это валидный NOT-SCOPED-BY-DESIGN, задача закрывается записью.

## §5 S3 — DECISION-NEEDED (surface, не решать)

- **DECISION-NEEDED: living-docs-auditor source self-application.** Фреймворк не аудирует собственные `AGENTS.md`/code-vs-docs (нет source-варианта `audit-ai-docs.sh`).
  - Опция A → завести source-вариант (аудит собственных доков) → +покрытие, +поддержка.
  - Опция B → задокументировать явное принятие (source ≠ consumer; логика юнит-тестирована) → 0 кода, риск self-application-зазора остаётся.
- **DECISION-NEEDED: стоячий триггер judgment-агентов** (compliance-verifier / review-sidecar в source). Судебное правило гейтить нельзя ([rule-enforcement-channel-selection §5](../../../.claude/rules/rule-enforcement-channel-selection.md)).
  - Опция A → дешёвый inject-нудж на path-триггере (например при правке `.claude/rules/**` / `agents/**`: «перед мёржем discipline-PR прогони compliance-verifier»).
  - Опция B → принять как inherent (нельзя гейтить судебное; всё уже кодифицировано в CLAUDE.md / skill-context).

## §6 AI-laziness traps (per [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md))

**Активные:** **T2** (design≠run — после правки маркера прогнать хук, не «добавил → работает»), **T3** (gate = команда+вывод), **T5** (это I-phase: не тащить сюда новые находки аудита — только closure найденного), **T13/T16** (маркер `globs:` ≠ инъекция срабатывает — доказывать прогоном), **T15** (self-application — S3 о самоприменении фреймворка к себе), **T20** (S3 — не решать судебную развилку молчаливым действием; surface через AskUserQuestion / DECISION-NEEDED).

**Domain-specific:**
- **T-SEF-A** — «добавил `globs:` в правило → доставка работает». Контр: подмножество хука детерминированное (`prefix/**` | `*.ext` | exact); проверить, что выбранный паттерн реально матчит целевой путь прогоном, а не глазами (например `docs/meta-factory/phase-*-research.md` со звездой в середине **не** сматчится — silent-gap).
- **T-SEF-B** — «PARTIAL Track B → надо доделать механизм». Может быть by-design (DORMANT prober, нельзя-гейтить-судебное). Не внедрять механизм без подтверждённого намерения (S3 = surface, не autopilot).

## §7 Гейты (реальные проверки)

- **S1 gate (прогон):**
  ```bash
  printf '{"tool_name":"Edit","tool_input":{"file_path":"<ROOT>/setup.d/companions.manifest"},"session_id":"g"}' | bash .claude/hooks/inject-matching-rule.sh   # → additionalContext с companion-install сводкой
  printf '{"tool_name":"Edit","tool_input":{"file_path":"<ROOT>/README.md"},"session_id":"g2"}' | bash .claude/hooks/inject-matching-rule.sh                  # → ПУСТО
  ```
  Плюс: `grep -c '^[[:space:]]*<!-- globs:' .claude/rules/companion-install-principle.md` = 1.
- **S2 gate:** аналогичный прогон позитив/негатив для phase-research-coverage ЛИБО зафиксированное решение «native-only by design» в теле правила.
- **S4 gate:** `python3 -c "import json;print([h['matcher'] for h in json.load(open('.claude/settings.json'))['hooks']['PostToolUse'] if 'inject-matching-rule' in h['hooks'][0]['command']])"` → `['Edit|Write|MultiEdit']`. Прогон: `printf '{"tool_name":"MultiEdit","tool_input":{"file_path":"<ROOT>/.github/workflows/ci.yml"},"session_id":"s4"}' | bash .claude/hooks/inject-matching-rule.sh` уже инъектит (хук-логика готова — gate на settings, не на хук). **Done-условие S4:** settings.json в deny-листе на Edit/Write → агент settings править НЕ может; валидное закрытие S4 = **«ручной шаг вынесен мейнтейнеру в summary»** (не блокер для merge остального PR).
- **S3 gate (закрытие):** обе DECISION-NEEDED вынесены мейнтейнеру с 2 опциями каждая; выбранная опция реализована ИЛИ записано принятие; никакого механизма без выбора.
- **Инвариант-гард:** `make self-audit` зелёный; принципы 17 (no-paid-LLM) и 21 не регрессировали; правки только в `.claude/rules/*.md` (+ опц. `agents/`), хук `inject-matching-rule.sh` НЕ трогается.

## §8 Build-first-reuse

Ноль нового кода: S1/S2 переиспользуют существующий `inject-matching-rule.sh` (читает `globs:`) + CC-native `paths:`. Capability-commit отсутствует (правка markdown-правил) → `Prior-art: skipped — rule-marker wiring, no new capability`.

## §9 Вынесено
- Promotion companion-install Class C→A (grep-гейт на отсутствие version-pin) — отдельный триггер (≥3 строки манифеста / первый pin-инцидент), НЕ в этот PR.
- Пересечение с U2 (enforcement-liveness-fix): здесь — само-проверка фреймворка; там — срабатывание правил у консьюмера. In-flight probe перед dispatch.
- **Pre-dispatch in-flight probe (CLAUDE.md):** проверить, не идёт ли параллельно `research-application-fixes` (оба кикоффа из staging одной пачкой) — `gh pr list --state all` + ahead-commits; не задвоить shared-state.

## §10 Закрытие
`done.md`: `# self-enforcement-fixes — DONE` · Final PR · Closed · Summary + ссылка на реестр аудита.
