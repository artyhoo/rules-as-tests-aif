# Consumer findings — rules-as-tests-aif (полигон: timeliner)

> **Authoritative for:** historical snapshot (audit 2026-06-13) of framework defects found running the shipped shields on the `timeliner` consumer polygon — the F1–F13 backlog + dedup analysis. The GitHub issue tracker is canonical for current status.
> **NOT authoritative for:** current issue status (GitHub tracker is SSOT) — project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).
>
> **Status note (added 2026-06-16 on preservation from a worktree-archive):** most findings were since filed as issues — mapped: F3→#507/#534/#535, F4→#533, F5→**#549 (OPEN)**, F11→#509, F12→#521, F13→#531, F1/F2→#532/#483 (CLOSED unless noted). No dedicated issue located for ≈F6 (audit-r4 probe not copied), F7 (R7/R8 active without infra), F8 (AGENTS living-docs drift), F10 (base-ref `origin/staging`) — verify before re-filing. This file is the durable record; the live items live in the tracker.
>
> **Tail-verify update (2026-06-16, re-verified against `origin/staging` @ `4aa836d`):** the 4 unmapped findings resolved — **F6 FIXED-SILENTLY** (`install.sh:599` now copies `audit-r4.ts`→`scripts/`; probe wired into `validate`/CI/pre-push), **F7 FIXED-SILENTLY** (R7/R8 gated behind `AIF_STRICT_RUNTIME=1` at `eslint.config.mjs:46,160` + defer-guide `AGENTS.md.template:53`), **F8 FIXED-SILENTLY** (promised scripts/configs now all shipped `install.sh:780,1083-1084`; storybook/playwright honestly caveated `AGENTS.md.template:122`). **F10 → filed #568** (still reproduces: `pre-push.fallback.sh:48` hardcodes default base-ref `origin/staging`, no-ops on default-`main` consumers without git stdin). Net new: 1 (F10).

> **Что это.** Backlog дефектов фреймворка `rules-as-tests-aif`, найденных при попытке
> реально поднять «щиты» в проекте-консьюмере **timeliner** (Hono + Expo 56 + Drizzle,
> pnpm+Turbo монорепо). Мы — консьюмеры; timeliner — полигон. Каждый пункт оформлен как
> готовый к заведению issue (`gh issue create`).
>
> **Куда заводить:** все — в `Yhooi2/rules-as-tests-aif` (решение пользователя).
> **Статус gh:** токен в keyring невалиден + `api.github.com` из песочницы недоступен →
> issue создаются **пачкой через `gh api` после `gh auth login`**. До этого — этот файл SSOT.
>
> **Провенанс:** консьюмер `Yhooi2/timeliner`, установка через `install.sh`, дата аудита 2026-06-13.
> Цитаты: `framework:` = путь в `/Users/art/code/rules-as-tests-aif`; `consumer:` = путь в `/Users/art/code/timeliner`.
> Все факты проверены чтением исходника + зелёным `pnpm turbo run lint typecheck test` + `expo-doctor 21/21`.

## Сводка

| # | Severity | Тема | Тип |
|---|---|---|---|
| F1 | P1 | `install.sh` не отгружает `pre-push.ts` (только fallback) → полный pre-push недостижим | install |
| F2 | P1 | `install.sh` не ставит husky/lint-staged и не вызывает `husky init`/hooksPath → хуки мертвы из коробки | install |
| F3 | P1 | ts-server eslint-шаблон зашит под Next.js/DDD-глобы → R2/R7/R8 не срабатывают на flat-сервере | template |
| F4 | P1 | ts-server eslint-шаблон импортирует `./eslint-rules-local/index.ts`, барбель не кладётся консьюмеру → dangling import | install/template |
| F5 | P2 | ts-server stryker-шаблон зашит на корневой `src/**` + Next.js-исключения → нечего мутировать в монорепо | template |
| F6 | P2 | R4-проба зовёт `scripts/audit-r4.ts`, install не копирует `packages/core/probes/audit-r4.ts` → dangling | install |
| F7 | P2 | Пресет включает R7/R8 by-default без инфры (Clock/Random/OTel) и без defer-гайда | preset/design |
| F8 | P2 | AGENTS.md-шаблон обещает скрипты/конфиги, которых нет ни в одном шаблоне → living-docs drift из коробки | docs |
| F9 | P2 | `/aif-*` команды/воркфлоу не отгружаются, но AGENTS/checks-map обещают `/aif-verify` | install |
| F10 | P3 | `pre-push.fallback.sh` дефолтит base-ref на `origin/staging`, которой нет у дефолт-`main` консьюмера | hook |
| F11 | P3 | AGENTS.md: «CI depends on .nvmrc» — шаблон CI не читает `.nvmrc` | docs |
| F12 | P2 | R11-машинерия (audit-self/workflow-integrity/ci-success) есть в исходнике, но install её не отгружает → R11-check в консьюмере ничем не обеспечен | install/ci |
| F13 | P3 | Артефакты шаблонов: stryker `packageManager:"npm"` зашит; doc-URL правил ведут на отсутствующий `factory/RULES.md` | template |

## Дедуп против upstream (сверено 2026-06-14, токен валиден ✓)

Апстрим `Yhooi2/rules-as-tests-aif` — **всего 4 issue** (полный список): `#483` (open), `#482` (open), `#487` (open), `#478` (closed/fixed). Дедуп F1–F13:

| F | Вердикт | Основание |
|---|---|---|
| F1 | 🆕 НЕ заведено | missing-artifact (`pre-push.ts`); #483 про «manual steps», не про отсутствующий файл |
| F2 | ✅ ПОКРЫТО `#483` | «no dep/husky setup» = ядро #483; смежно `#478` (closed) |
| F3 | 🆕 НЕ заведено | template Next.js-глобы → R2/R7/R8 мертвы на flat |
| F4 | 🆕 НЕ заведено (барбель) | barrel `index.ts`; peer-deps facet ⊂ #483 |
| F5 | 🆕 НЕ заведено | stryker template `src/**` |
| F6 | 🆕 НЕ заведено | R4 probe `audit-r4.ts` не копируется |
| F7 | 🆕 НЕ заведено | R7/R8 active-by-default без Clock/OTel-инфры |
| F8 | 🆕 НЕ заведено | AGENTS living-docs drift |
| F9 | 🆕 НЕ заведено | `/aif-*` обещаны, не отгружены (зеркало #482, др. направление) |
| F10 | 🆕 НЕ заведено | base-ref `origin/staging` (смежно branch-model #483, но отдельный баг) |
| F11 | 🆕 НЕ заведено | `.nvmrc`/CI doc-drift |
| F12 | ⚠️ частично | over-claim facet ~ область `#487`; «machinery не отгружена» facet 🆕 НЕ заведено |
| F13 | 🆕 НЕ заведено | template artifacts (stryker npm hardwired; битый doc-URL) |

**Итог:** покрыто/закрыто — **F2** (+`#478` closed). Готовы к filing после ОК — **F1, F3, F4(барбель), F5, F6, F7, F8, F9, F10, F11, F12(machinery), F13 = 11 находок**. `#482`/`#487` — отдельные находки, не из F1–F13. Связь с парком: F3/F4/F7 — это ровно то, что phase4 чинил руками; теперь они идут **issue наверх**, а не ручная сборка (парк-решение в действии).

---

## F1 — `install.sh` отгружает диспетчер pre-push + fallback, но НЕ сам `pre-push.ts`

**Severity:** P1 · **Labels:** `bug`, `install`, `hooks`

**Где:**
- `framework: install.sh:352-357` — копирует `husky-pre-commit.sh`, диспетчер `husky-pre-push.sh` и `packages/core/hooks/pre-push.fallback.sh`. **Не копирует** `packages/core/hooks/pre-push.ts`.
- `framework: packages/core/hooks/pre-push.ts` — существует в исходнике, но в консьюмер не попадает.
- `consumer: .husky/pre-push:19,24` — диспетчер маршрутизирует на `$REPO_ROOT/packages/core/hooks/pre-push.ts` при Node≥20.

**Симптом:** на любом консьюмере с Node≥20 проверка `[ -f "$TS_HOOK" ]` ложна (файла нет) → диспетчер всегда уходит в `fallback.sh` (только presence-арм трейлеров §7/§1.7), а полноценный TS-core pre-push (substance-проверки) **недостижим из коробки**. В timeliner `packages/core/hooks/` содержит только `pre-push.fallback.sh`.

**Repro:** `bash install.sh` в чистый репо → `ls packages/core/hooks/` → только `pre-push.fallback.sh`. Диспетчер ссылается на отсутствующий `pre-push.ts`.

**Fix:** добавить в `install.sh` копирование `packages/core/hooks/pre-push.ts` (и его зависимостей: `registry.ts`, резолвер base-ref, и т.п.) рядом с fallback; либо инлайнить TS-хук. Иначе — убрать ветку `pre-push.ts` из диспетчера и не обещать substance-арм.

**Acceptance:** после install на репо с Node≥20 `git push` исполняет TS-core hook (а не fallback); добавить установочный тест, что `packages/core/hooks/pre-push.ts` присутствует у консьюмера.

---

## F2 — `install.sh` не ставит husky/lint-staged и не активирует хуки → они мертвы из коробки

**Severity:** P1 · **Labels:** `bug`, `install`, `hooks`, `ux`

**Где:**
- `framework: install.sh:351-358` — `mkdir .husky` + `copy_safe` хуков + `chmod +x`.
- `framework: install.sh:432,444` — лишь **печатает** инструкции: `husky lint-staged sort-package-json \` и `6. npx husky init && verify hooks installed`. Реального `npm/pnpm add`, `npx husky init` или `git config core.hooksPath` — нет.

**Симптом:** после install файлы `.husky/pre-commit|pre-push` лежат, но git их **не вызывает** (`core.hooksPath` не задан), а `lint-staged`/`sort-package-json`, на которые ссылается pre-commit и `.lintstagedrc.json`, **не установлены и не в lockfile**. В timeliner: `git config core.hooksPath` пусто; в `pnpm-lock.yaml` нет husky/lint-staged/sort-package-json. Итог — pre-commit и pre-push **не работают вообще**.

**Repro:** `bash install.sh` → `git config core.hooksPath` пусто → коммит/пуш проходят без проверок.

**Fix:** install.sh должен сам (а) добавить devDeps `husky lint-staged sort-package-json`, (б) выполнить `npx husky init` (или `git config core.hooksPath .husky`), (в) добавить `prepare: husky` в `package.json`. Либо явно гейтить установку как «manual required» и проверять результат, а не печатать в конце.

**Acceptance:** после install `core.hooksPath` указывает на `.husky`, `lint-staged` резолвится, тест-смоук «коммит с lint-ошибкой → pre-commit падает» проходит.

---

## F3 — ts-server eslint-шаблон зашит под Next.js/DDD-глобы → R2/R7/R8 не срабатывают на flat-сервере

**Severity:** P1 · **Labels:** `bug`, `template`, `eslint`

**Где:** `framework: templates/ts-server/eslint.config.mjs`
- `:120` `ignores: ['src/infrastructure/**']`
- `:128-130` R2 на `src/web/handlers/**`, `src/app/actions/**`, `src/app/api/**`
- `:138-139` R8 на `src/application/**` (ignore `src/application/**/ports/**`)

**Симптом:** «ts-server» позиционируется как generic-серверный TS (Hono/Fastify), но глобы кастом-правил предполагают слоистый Next.js-монолит (app-router + DDD-слои `web/application/infrastructure`). На flat-структуре (`apps/api/src`: `app.ts`, `db.ts`, `index.ts`) эти глобы **не матчат ничего** → R2/R7/R8 молча никогда не срабатывают. Консьюмер думает, что щит стоит, а он мёртв.

**Fix:** параметризовать глобы (через переменную/`AIF_SRC_GLOBS` или вопрос инсталлятора), либо дать flat-вариант шаблона для не-Next серверов, либо документировать обязательную правку глобов после install с проверкой.

**Acceptance:** на flat Hono-репо R2 ловит `.parse()` в реальном хендлере (негативный тест), а не «0 матчей».

---

## F4 — eslint-шаблон импортирует `./eslint-rules-local/index.ts`, барбель не доезжает → dangling import

**Severity:** P1 · **Labels:** `bug`, `install`, `eslint`

**Где:**
- `framework: templates/ts-server/eslint.config.mjs:12` `import customRules from './eslint-rules-local/index.ts';`
- `framework: packages/core/eslint-rules/index.ts` — барбель существует (экспортирует 3 правила).
- `consumer: eslint-rules-local/` — лежат 3 файла-правила (`no-unsafe-zod-parse.ts`, `no-direct-time-randomness.ts`, `require-otel-span.ts`), **`index.ts` отсутствует**.

**Симптом:** шаблон импортирует барбель по пути `./eslint-rules-local/index.ts`, но у консьюмера в `eslint-rules-local/` барбеля нет (правила есть, `index.ts` — нет). Если этот конфиг кто-то реально подключит — ESLint падает на неразрешённом импорте. (Плюс не отгружены peer-deps `@typescript-eslint/utils`, `eslint-plugin-vitest`, `globals`.)

**Fix:** install должен класть `index.ts`-барбель рядом с правилами (сгенерировать из набора или скопировать из `packages/core/eslint-rules/index.ts` с корректным путём) и добавлять peer-deps `@typescript-eslint/utils`/`eslint-plugin-vitest`/`globals`.

**Acceptance:** `node -e "import('./eslint-rules-local/index.ts')"` (или загрузка конфига) у консьюмера не падает; smoke-lint проходит.

---

## F5 — ts-server stryker-шаблон зашит на корневой `src/**` + Next.js-исключения

**Severity:** P2 · **Labels:** `bug`, `template`, `mutation`

**Где:** `framework: templates/ts-server/stryker.config.json:14,23-29`
- `:14` `"src/**/*.{ts,tsx}"` — предполагает исходник в корневом `src/`.
- `:23-29` исключения `src/app/**/layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `src/web/server.ts`, `src/config/env.ts` — Next.js app-router.

**Симптом:** в монорепо/не-Next исходник лежит в `packages/*/src`, `apps/*/src`, а не в корневом `src/` → glob `src/**` матчит ноль → Stryker нечего мутировать. Исключения отсылают к несуществующим Next.js-файлам.

**Fix:** монорепо-aware глобы (per-package `mutate`) или плейсхолдер, заполняемый при install по факту структуры.

**Acceptance:** на validation-пакете Stryker реально мутирует `src/*.ts` и считает kill-rate.

---

## F6 — R4-проба зовёт `scripts/audit-r4.ts`, install не копирует `packages/core/probes/audit-r4.ts`

**Severity:** P2 · **Labels:** `bug`, `install`, `probes`

**Где:**
- `framework: packages/core/probes/audit-r4.ts` — существует.
- `consumer: scripts/audit-ai-docs.sh:83` — `npx --no-install tsx scripts/audit-r4.ts` (+ комментарии стр.11,70 «scripts/audit-r4.ts in consumer project»).
- `consumer: scripts/audit-r4.ts` — **отсутствует**.

**Симптом:** проба R4 в `audit-ai-docs.sh` ссылается на `scripts/audit-r4.ts`, который install не отгружает (исходник лежит в `packages/core/probes/audit-r4.ts`). Сам `audit-ai-docs.sh` к тому же **нигде не вызывается** (ни CI, ни pre-push).

**Fix:** install копирует `packages/core/probes/audit-r4.ts` → `scripts/audit-r4.ts` (с адаптацией глобов под структуру), либо `audit-ai-docs.sh` ссылается на реальный установленный путь.

**Acceptance:** `./scripts/audit-ai-docs.sh` проходит R4-пробу (или явно её skip-ает с сообщением, а не падает на отсутствующем файле).

---

## F7 — пресет включает R7/R8 by-default без инфры и без defer-гайда

**Severity:** P2 · **Labels:** `design`, `preset`, `rules`

**Где:** `framework: templates/ts-server/eslint.config.mjs:117-144` (R7 `no-direct-time-randomness` на `src/**` кроме infrastructure; R8 `require-otel-span` на `src/application/**`); `RULES.md` R7/R8 в каноническом наборе R1-R11.

**Симптом:** R7 предполагает injected Clock/Random + `infrastructure/`, R8 — наличие OpenTelemetry-трейсера (`tracer.startActiveSpan`/`withSpan`). Свежий консьюмер (Hono-скелет, только healthcheck) **не имеет ни того, ни другого**. Включённые by-default, эти правила либо ничего не ловят (мимо глобов — см. F3), либо требуют инфру, которой нет («используй injected Clock», «открой OTel-спан»), создавая трение без выгоды. Нет указания «отложи R7/R8 до появления Clock/OTel».

**Fix:** в пресете пометить R7/R8 как **opt-in / deferred-by-default** для свежих проектов; добавить в RULES/AGENTS примечание про требуемую инфраструктуру и условие включения.

**Acceptance:** дефолтный install не навязывает R7/R8; гайд явно описывает, когда их включать.

---

## F8 — AGENTS.md-шаблон обещает несуществующие скрипты/конфиги (living-docs drift из коробки)

**Severity:** P2 · **Labels:** `bug`, `docs`, `living-docs`

**Где:** `consumer: AGENTS.md:77-101` (и соответствующий framework-шаблон):
- обещает `npm run validate / test:coverage / test:integration / test:mutation / test:watch / arch:check / test-storybook`, `npx playwright test`;
- «Architecture rules in `.dependency-cruiser.cjs`»; «ESLint 10 flat config — see `eslint.config.mjs`» (а он сломан/осиротевший); «Mutation kill rate ≥70%».

**Симптом:** ни один из этих скриптов не присутствует ни в одном `package.json` консьюмера; `.dependency-cruiser.cjs` нет; указанный `eslint.config.mjs` не используется и сломан. Документация врёт из коробки — нарушает собственный принцип RULES §299 «нет проверки — нет правила».

**Fix:** AGENTS.md-шаблон должен перечислять только то, что install реально отгружает; недостающее — генерировать вместе с обещанием, либо убирать строку.

**Acceptance:** проба docs-audit: каждый `npm run X` из AGENTS.md существует в каком-либо `package.json` (негатив: фейк-скрипт → проба падает).

---

## F9 — `/aif-*` команды/воркфлоу не отгружаются, но документация обещает `/aif-verify`

**Severity:** P2 · **Labels:** `bug`, `install`, `workflow`

**Где:** `consumer:` нет `.claude/commands/`; агенты `review-sidecar`, `living-docs-auditor` лежат в `.claude/agents/`, но воркфлоу их не запускает. `AGENTS.md:44-50`, `checks-map.md` (уровень 4) обещают `/aif-explore|plan|implement|verify|fix|commit` как «required before commit».

**Симптом:** обещанный pre-PR гейт `/aif-verify` физически отсутствует у консьюмера; sub-agents есть, но их нечем вызвать.

**Fix:** install отгружает `/aif-*` команды (или AGENTS не объявляет того, что не установлено — см. собственное правило AGENTS «Skills are declared after they exist»).

**Acceptance:** либо `/aif-verify` доступен после install, либо документация не обещает его.

---

## F10 — `pre-push.fallback.sh` дефолтит base-ref на `origin/staging` (которой нет у `main`-консьюмера)

**Severity:** P3 · **Labels:** `bug`, `hook`

**Где:** `framework: packages/core/hooks/pre-push.fallback.sh:48-51` — при отсутствии `PREPUSH_UPSTREAM_REF` и git-stdin дефолт `origin/staging`; иначе «could not determine a base ref … skipping».

**Симптом:** дефолтная ветка большинства консьюмеров — `main` (timeliner: `main`); ветки `staging` нет. При запусках без stdin (ручной/CI) fallback не находит base-ref и no-op-ит. Комментарий в исходнике сам признаёт прошлую версию «silently no-op'd on any consumer repo lacking a staging branch».

**Fix:** дефолт base-ref выводить из `git symbolic-ref refs/remotes/origin/HEAD` (реальная дефолт-ветка), а не хардкод `origin/staging`.

**Acceptance:** на репо с дефолт-`main` без stdin fallback резолвит base-ref и реально проверяет коммиты.

---

## F11 — AGENTS.md: «Node pinned in .nvmrc — CI depends on it», но CI-шаблон не читает `.nvmrc`

**Severity:** P3 · **Labels:** `docs`

**Где:** `consumer: AGENTS.md:97` «Node.js version pinned in `.nvmrc` — CI depends on it»; `consumer: .github/workflows/ci.yml:20` хардкод `node-version: 22`; `consumer: .nvmrc` = `20.19.0`.

**Симптом:** утверждение про «CI depends on .nvmrc» не подкреплено — CI хардкодит Node и игнорирует `.nvmrc`; вдобавок значения расходятся (20.19.0 vs 22).

**Fix:** либо CI-шаблон читает `.nvmrc` (`node-version-file: .nvmrc`), либо убрать утверждение из AGENTS.

**Acceptance:** значение Node в CI и `.nvmrc` согласованы; формулировка AGENTS соответствует поведению CI.

---

## F12 — R11-машинерия не отгружается консьюмеру (CI-integrity check ничем не обеспечен)

**Severity:** P2 · **Labels:** `bug`, `install`, `ci`

**Где:**
- `framework: .github/workflows/audit-self.yml`, `.github/workflows/workflow-integrity.yml` — существуют (фреймворк догфудит R11 на себе: actionlint+zizmor→ci-success, branch-protection-assertion).
- `framework: install.sh:338,341` — копирует **только** `packages/core/audit-self/audit-ai-docs.sh` → `scripts/audit-ai-docs.sh` (+ react-next вариант). **Не копирует** ни `audit-self.yml`, ни `workflow-integrity.yml`, ни CI с агрегатом `ci-success`.
- `framework: RULES.md R11 (стр.262-273)` — «check»: `audit-self.yml (actionlint+zizmor → ci-success) + workflow-integrity.yml (branch-protection-assertion)`.
- `consumer: .github/workflows/ci.yml:10` — единственный job `name: lint + typecheck + test`, без `ci-success`/`needs:`; branch protection на `main` выключен.

**Симптом:** RULES.md объявляет R11 проверяемым через `audit-self.yml`/`workflow-integrity.yml`/`ci-success`, но install их консьюмеру не отгружает. Скопированный `audit-ai-docs.sh` к тому же ничем не вызывается (нет CI-воркфлоу, который бы его звал). Итог: R11 — «wish, not a rule» из коробки.

**Fix:** install отгружает consumer-вариант `audit-self.yml` + `workflow-integrity.yml` + базовый `ci.yml` с `ci-success`-агрегатом (`needs:`), и подключает `audit-ai-docs.sh` шагом CI. Либо RULES.md не объявляет R11 проверяемым тем, что не ставится.

**Acceptance:** после install у консьюмера есть `ci-success` required-context и воркфлоу, реально вызывающий `audit-ai-docs.sh`; `workflow-integrity` ассертит branch protection.

---

## F13 — Артефакты шаблонов: `packageManager:"npm"` в stryker; doc-URL правил на отсутствующий `factory/RULES.md`

**Severity:** P3 · **Labels:** `template`, `polish`

**Где:**
- `framework: templates/ts-server/stryker.config.json:3` `"packageManager": "npm"` — зашито; консьюмер на pnpm (timeliner: `packageManager: pnpm@10.19.0`) получает несоответствие test-runner/PM.
- `framework: packages/core/eslint-rules/*.ts` (`RuleCreator(() => 'https://github.com/Yhooi2/rules-as-tests-aif/blob/main/factory/RULES.md#...')`) — путь `factory/RULES.md` в чекауте отсутствует (канон — `packages/preset-next-15-canonical/RULES.md`). Проверить, есть ли он на `main`.

**Симптом:** мелкие портабельность/стейл-ссылки: stryker зашит на npm; doc-URL правил могут вести в 404.

**Fix:** параметризовать `packageManager` в stryker-шаблоне (детект из консьюмера); выверить `RuleCreator`-URL на реальный путь RULES.md.

**Acceptance:** stryker `packageManager` совпадает с PM консьюмера; doc-URL правил резолвятся (200).

---

## Как заводить (когда `gh auth` починен)

```bash
# пример для одного issue (повторить по каждому F#):
gh issue create --repo Yhooi2/rules-as-tests-aif \
  --title "install.sh ships pre-push dispatcher but not pre-push.ts → full pre-push unreachable" \
  --label bug,install,hooks \
  --body-file <(sed -n '/## F1 /,/## F2 /p' CONSUMER-FINDINGS-timeliner.md)
```

> Сначала: `gh auth login -h github.com`. Создание issue идёт через `api.github.com` (REST),
> что в этой сети работает в отличие от `git push` (см. память «github-network-api-only»).
