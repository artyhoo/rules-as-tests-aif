# Self-application как cross-cutting architectural invariant

> **Тип:** Reference-документ (shipped, не transient). Живёт после закрытия Phase 1.
> **Аудитория:** будущие фреш-сессии, контрибьюторы, оркестраторы Phase 2+.
> **Связи:** [EXECUTION-PLAN.md](EXECUTION-PLAN.md) §3.1, §3.2, §7 | [PROPOSAL.md](PROPOSAL.md) §2.2, §6 | [../audits/2026-05-07-self-application-gap.md](../audits/2026-05-07-self-application-gap.md) | [../audits/2026-05-06.md](../audits/2026-05-06.md)

---

## 1. Тезис self-application gap

Self-application gap — это **не технический долг**. Это фальсификация центрального тезиса пакета: «documents lie; tests don't». Когда фреймворк поставляет enforcement-инструменты потребителю, но не применяет их к себе, документация о принципах превращается в декларацию без доказательства.

На момент 2026-05-07 репо имело 4 непокрытых слоя локального enforcement:

| Слой | Что есть | Что отсутствует | Цена отсутствия |
|---|---|---|---|
| **Spec discipline** | `.claude/orchestrator-prompts/` директория | SHA-validation, проверка существования action | Фейковые SHA коммитятся (`rhysd/actionlint@<fake>` в batch-D); обнаруживается только IDE случайно |
| **Pre-commit** | `templates/shared/husky-pre-commit.sh` для потребителя | `.husky/pre-commit` в репо автора | Markdown >500 строк, broken bash синтаксис проходят в историю |
| **Pre-push** | `templates/shared/husky-pre-push.sh` для потребителя | `.husky/pre-push` в репо автора | actionlint/zizmor ошибки уходят в CI (итог: 3-fix cycle в PR #1) |
| **CI-as-self-test** | `audit-self.yml` — 4 job'а | job `framework-self-install` (E2E install.sh+setup.sh) | Регрессии в installer обнаруживает потребитель, не автор |

**Историческое свидетельство.** PR #1 (`feat/audit-fixes-2026-05`) потребовал трёх отдельных push-циклов для закрытия 16 zizmor-находок в `workflow-integrity.yml`. Причина — отсутствие pre-push hook'а с actionlint/zizmor. Это ровно тот паттерн (push → fail → diagnose → fix → push), который пакет декларирует решённым для потребителей.

---

## 2. Invariant table по слоям L0–L5 + Spec discipline

Self-application — **не отдельный шаг**, а cross-cutting invariant. Каждый слой мета-фабрики должен иметь explicit self-application clause и measurable acceptance criteria.

| Слой | Self-application clause | Acceptance criteria |
|---|---|---|
| **L0 Invariant Core** | Принципы прогоняются как тесты против собственного `rules-manifest.json` в pre-commit/pre-push/CI | Автор не может закоммитить нарушение принципа; попытка блокируется `.husky/pre-commit` |
| **L1 Stack Detector** | Detector запускается на самом репо в CI; expected output зафиксирован snapshot-тестом | `setup.sh --stack=$(detect)` идемпотентен на собственном репо; snapshot стабилен ≥3 недели |
| **L2 Research Agent** | Research прогоняется на трёх источниках: `skills/rules-as-tests/SKILL.md` (entry-point), `skills/rules-as-tests/references/overview.md` (5-layer principles), `skills/rules-as-tests/references/ai-traps.md` (anti-patterns) | Все три источника семантически синхронизированы; drift detection возвращает 0 расхождений. Operationalization semantic-drift — TBD per [open-questions.md](open-questions.md) §13.7 (Phase 6); до Phase 6 — manual review при изменении любого из трёх источников |
| **L3 Rule Synthesizer** | Synthesizer регенерирует canonical Next 15 preset, diff сравнивается с live | Поведенческий diff с canonical ≤5%; генерация детерминирована (два запуска = один output) |
| **L4 Self-Validator** | Validator прогоняется на `rules-manifest.json` перед каждым CI run | Каждое существующее правило R1-R20 проходит все meta-tests; validator не пропускает тавтологии |
| **L5 Installer** | `install.sh` + `setup.sh` запускается в CI на tmp-dir; результат проходит framework's own audits | Job `framework-self-install` зелёный; артефакты tmp-потребителя проходят `audit-ai-docs.sh` |
| **Spec discipline** | `.claude/orchestrator-prompts/` валидируются как код (SHA-check, action existence) | Невозможно закоммитить spec с фейковым SHA или несуществующим action-repo |

Эта таблица — **сердце документа**: фиксирует, что self-application не опциональная фича, а структурное требование к каждому компоненту.

---

## 3. Decision matrix Phase 1

Из [EXECUTION-PLAN.md §7](EXECUTION-PLAN.md) с расширенным rationale для каждой строки.

| Слой | Mode | Verdict | Rationale |
|---|---|---|---|
| Bash syntax | Hard fail (pre-commit) | **MUST** | Сломанный `.sh` не обнаруживается до первого запуска в CI. Стоимость <100ms, неисправность обнаруживается до коммита — нет оснований откладывать. |
| YAML/JSON parse | Hard fail (pre-commit) | **MUST** | Невалидный YAML ломает все workflow немедленно. Одно сломанное `audit-self.yml` делает невидимыми все последующие проблемы. <100ms стоимость. |
| Markdown ≤500 строк | Hard fail (pre-commit) | **MUST** | Собственный invariant shipped docs. Нарушение этого правила в собственных файлах фальсифицирует принцип «documents lie». Стоимость <100ms. |
| actionlint | Hard fail (pre-push) | **MUST** | Каждый workflow-дефект = red CI на всех PR. 4-цикл fix в PR #1 — прямое свидетельство того, что отсутствие pre-push дорого. ~200ms. |
| zizmor plain | Hard fail (pre-push) | **MUST** | Security-класс находок (permissions, injection). Не блокировать = нормализовать уязвимости. ~3s — приемлемо для pre-push. |
| Self-test pipeline | Hard fail (pre-push) | **SHOULD** | `audit-ai-docs.test.sh` занимает ~5s, ловит регрессии в probe-logic. SHOULD а не MUST: может иметь external dependency (python yaml), требует установки. |
| Manifest render drift | Hard fail (pre-push, scoped) | **SHOULD** | Drift между manifest.json и RULES.md — тот же класс «documents lie». Скоупировано на `*.json` + `*.md` diff. SHOULD: дорогостоящий typecheck. |
| Spec validation (SHAs) | Soft warn (pre-commit, scoped) | **MAY** | GitHub API rate-limit, требует `gh auth login`. Soft warn, не hard fail: контрибьютор без токена не должен быть заблокирован. |
| Framework-self-install | CI only | **MAY in CI** | ~30s, требует tmp-dir setup. Только CI: нет смысла запускать при каждом локальном push. MAY: не на критическом пути автора. |

---

## 4. Эпистемологический разрыв

**Template path vs runtime path:**

```
templates/shared/husky-pre-commit.sh   ← автор видит как ШАБЛОН
               ↓ install.sh копирует в потребителя
.husky/pre-commit                        ← потребитель видит как СВОЙ hook
```

Автор разрабатывает шаблон, тестирует его глазами и синтаксически. Но **никогда не запускает `install.sh` на собственном репо** → `.husky/` у него не создаётся → шаблон может быть сломан до того, как потребитель его установит.

Это не ошибка невнимательности — это **структурный разрыв**:

1. Автор создаёт шаблон в `templates/` → воспринимает его как «будущее чужого репо».
2. Нет механизма, который бы применил шаблон к текущему репо автоматически.
3. Gap нормализуется через «CI поймает» — и действительно ловит, но уже у потребителя или в post-push.

**Heuristic test (из EXECUTION-PLAN §3.1):** удалить из CI всё CI-specific. Что осталось — должно работать локально. Если разработчик не запускает это локально — self-application нет. Применительно к `audit-self.yml`: mechanical job, `audit-ai-docs.test.sh`, actionlint, zizmor — всё запускаемо одной командой локально. Не запускается не потому что нельзя, а потому что не сделано.

**Закрытие разрыва.** Phase 1 закрывает его явным шагом: создание `.husky/pre-commit` и `.husky/pre-push` непосредственно в репо автора, независимо от содержимого `templates/`. При расхождении — template обновляется, а не hook.

---

## 5. Связь с audit findings

### Finding F1 из `2026-05-06.md` — root cause не закрыт

F1 (артефакты в `src/`, `AGENTS.md`, `.mcp.json`) был закрыт удалением файлов. Но root cause — отсутствие pre-commit gate, блокирующего commit untracked-артефактов из tmp-запусков — остался открытым. Без `.husky/pre-commit` с проверкой bash/json/yaml патологическая ситуация воспроизведётся при следующем ad-hoc запуске тестов вручную в корне репо.

### Finding F3 из `2026-05-06.md` — R2 drift

R2 drift (три источника описывают правило по-разному: RULES.md, best-practices-sidecar, probe) закрыт по wording. Pre-commit gate с `manifest render drift` (§3 выше, SHOULD) предотвратит возникновение нового дрейфа: при любом изменении `factory/rules-manifest.json` рендер RULES.md проверяется автоматически.

### `2026-05-07-self-application-gap.md` — что новое здесь

Тот audit-snapshot (82 строки) фиксирует факт: «что сломано и как воспроизвелось в PR #1». Настоящий документ добавляет:
- Invariant table по всем 7 слоям (§2) с acceptance criteria — то, чего нет в snapshot'е.
- Decision matrix с rationale для каждой строки (§3) — snapshot только перечисляет gaps.
- Эпистемологический анализ разрыва (§4) — snapshot описывает симптом, не структуру.
- Anti-pattern deconstruction (§6) — в snapshot перечислены как антипаттерны без разбора.
- 6-month projection (§8) — в snapshot нет последствий.

### PR #1 timeline как evidence

3-fix cycle (push → zizmor fail → fix → push × 3) — конкретное измеримое доказательство того, что «CI поймает» не равно «достаточно». Каждый fix-cycle = один review-round потерян, один CI-minute сожжён, одна итерация добавлена к PR-хвосту. Без pre-push hook'а это не одноразовая ошибка, а **предсказуемый паттерн** при каждом workflow-изменении.

---

## 6. Anti-patterns которые gap нормализует

### «CI поймает»

**Deconstruction.** CI ловит ровно то же самое что pre-push, но за 60–90 секунд вместо <10 секунд, с ценой review-cycle вместо локального fail. Каждый CI-fix-cycle = один commit в истории с сообщением типа «fix: address zizmor finding». Таких коммитов в PR #1 — три. История репо кодирует паттерн «CI ловит то, что должен ловить pre-push».

### «Я смотрю diff перед push»

**Deconstruction.** Ручной diff-review — привычка, не систематический enforcement. Ломается на больших PR (28 файлов, 16 коммитов в PR #1), на context-switch, на усталости. zizmor нашёл 16 находок в файле, который автор читал несколько раз. Человеческий review дополняет инструменты, но не заменяет.

### «У меня IDE-плагины»

**Deconstruction.** IDE diagnostic однажды поймал `rhysd/actionlint@<fake-sha>` в batch-D. При следующем появлении того же паттерна диагностика была проигнорирована. Привыкание к IDE warning'ам — known phenomenon; единственная надёжная защита — hard-fail gate, которую нельзя проигнорировать.

### «Это small repo»

**Deconstruction.** «Small» не коррелирует с «low failure cost». 16 коммитов, 28 файлов, 8 batch'ей делегации, 4 workflow-файла — достаточная сложность для того, чтобы зависимости между файлами создавали не-очевидные дефекты. Кроме того, small repo — аргумент против sunk cost, не против enforcement.

### «Husky медленный»

**Deconstruction.** actionlint <200ms, zizmor 2–3s, bash syntax <100ms, `audit-ai-docs.test.sh` ~5s. Итого pre-push <10s. Это норма для pre-push. Сравни с одним CI-cycle: 60–90s ожидания + время diagnose + context-restore. Pre-push hook быстрее по совокупности в любом разумном сценарии.

---

## 7. Acceptance criteria — что считать решённым

Для каждого слоя — measurable signal закрытия.

| Слой | Closed when |
|---|---|
| **L0 Invariant Core** | `git commit` с нарушением принципа (broken bash в `.sh`) блокируется локально. Верифицируется: `echo "broken bash" > scripts/test.sh && git add . && git commit` — выход не 0. |
| **L1 Stack Detector** | `make self-audit` зелёный. Snapshot-тест детектора стабилен на протяжении ≥3 недель без ложных срабатываний. |
| **L2 Research Agent** | Команда `meta-factory research --self` завершается без drift-finding'ов между `skills/rules-as-tests/SKILL.md`, `references/overview.md`, `references/ai-traps.md` (см. §2 canonical list). |
| **L3 Rule Synthesizer** | `diff -r packages/preset-next-15-canonical /tmp/regenerated-preset` — поведенческий diff ≤5%. Два независимых запуска дают идентичный output. |
| **L4 Self-Validator** | Все правила R1–R20 проходят meta-tests в `tests/principles/`. Mutation-style проверка: сломать одно правило в manifest → соответствующий meta-test падает. Если не падает — meta-test тавтологичен. |
| **L5 Installer** | Job `framework-self-install` в `audit-self.yml` зелёный. Артефакты tmp-потребителя проходят `bash tests/audit/audit-ai-docs.test.sh` с 0 FAIL. Верифицируется: намеренно сломать `install.sh` → job становится красным. |
| **Spec discipline** | Попытка закоммитить spec с паттерном `<owner>/<repo>@<40-char-sha>` где SHA не верифицирован — выдаёт warn (pre-commit) или hard-fail (pre-push). `scripts/validate-batch-spec.ts` существует и интегрирован. |

**Composite gate.** Phase 1 считается закрытой только если `make self-audit` зелёный **и** хотя бы один класс ошибок из §1 (spec/pre-commit/pre-push/CI) покрыт автоматическим enforcement'ом, не позволяющим ошибке пройти незаметно.

---

## 8. 6-month projection

Что произойдёт, если self-application gap не закрыть перед Phase 2+:

**Phase 2 (principles as meta-tests).** Без pre-commit gate тест может принять тавтологичное правило. Meta-test, который не падает при сломанном manifest — не meta-test, а театр. Без enforcement механизма это обнаружится только при manual review, если обнаружится вообще.

**Phase 3 (monorepo split).** Без `framework-self-install` job в CI — `install.sh` может сломаться в рамках split-рефакторинга. Узнаем от потребителя (которого пока нет) или из ручного тестирования.

**Phase 5 (validator).** К этому моменту в `rules-manifest.json` будет 30+ правил. Без систематического meta-test прогона часть из них тавтологична (negative test не ловит ничего). Validator будет создавать иллюзию покрытия.

**Phase 6 (research agent).** Без spec discipline в orchestrator-prompts `research-cache.json` может содержать fabricated SHA или несуществующие action-ссылки. Planner-Executor паттерн (L2 не имеет file write) защищает от prompt injection, но не от некорректных references в specs.

**Phase 7 (installer release).** Без `framework-self-install` CI job — релиз shipped с installer'ом, не проверенным на чистом потребителе. Первый реальный потребитель обнаружит сломанный install.sh.

**Systemic.** Каждая фаза без self-application добавляет технический долг, который обнаруживается позже и дороже. Наблюдаемый паттерн (PR #1, Finding F1, F3) — это не случайность, а предсказуемое следствие отсутствия enforcement'а. К Phase 7 накопленный drift между тем что декларирует пакет и тем как он разрабатывается станет структурным противоречием, не точечным дефектом.

---

**0.1.0** — 2026-05-07 (создан в Phase 0.5 step 1, ветка `chore/self-application`)
