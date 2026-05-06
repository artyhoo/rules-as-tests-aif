# Rules — React/Next.js extension (R12–R20)

> Дополняет `RULES.md` правилами R12–R20 для React 19 + Next.js 15 App Router.
> Базовые R1–R11 применяются ко всем проектам и описаны в `RULES.md`.
> Эти правила проверяются `best-practices-sidecar` после каждого `/aif-implement`,
> и `audit-ai-docs.react-next.sh` после `/aif-verify`.

## R12 — Server vs Client Components
- Компоненты по умолчанию Server. `'use client'` только если используется one of: `useState`, `useEffect`, `useReducer`, `useRef`, `useCallback`, `useMemo`, обработчик событий, browser API.
- Server Component не импортирует Client Component с client-only side effects.
- `'use client'` ставится в начале файла, до импортов.
- Файлы с `import 'server-only'` не могут быть импортированы из `'use client'` файлов.

**Check:** `audit-ai-docs.react-next.sh` probe `R12` + ESLint `no-restricted-globals` для Server Components.

## R13 — Data fetching
- Server Components: прямые `async`/`await` вызовы (БД, fetch с auth headers).
- Client-side reads: TanStack Query / SWR с типизированной схемой ответа через Zod `.parse()`.
- Writes: Server Actions (`'use server'`) с Zod-валидацией formData.
- Никаких `fetch()` напрямую в Client Component без обёртки `useQuery`/`useSWR`.
- Suspense boundaries вокруг async-границ; `loading.tsx` для маршрутов.

**Check:** R13 — manual review only (AST grep на использование TanStack Query / SWR).

## R14 — Forms
- Все формы — через Server Actions (`'use server'`).
- Валидация Zod-схемой на сервере (не доверяем клиенту).
- `useActionState` для UI feedback (pending, error, success).
- Поля формы имеют `name` (для FormData) и связанный `<label>`.
- Возвращаемый тип Server Action: `{ ok: true, data: T } | { ok: false, error: string, fieldErrors?: Record<string, string[]> }`.
- Errors возвращаются, не throw'ятся (Next десериализует).
- `revalidatePath()` / `revalidateTag()` после мутаций, изменяющих кеш.

**Check:** `audit-ai-docs.react-next.sh` probe `R14`.

## R15 — Accessibility
- Каждый интерактивный элемент имеет accessible name (aria-label, aria-labelledby или text content).
- Все `<button>` имеют `type` (submit, button, reset).
- Никаких `<div onClick>` — для интерактивности `<button>` или `<a>`.
- Color contrast соблюдается (проверяется через axe-playwright в e2e).
- Все form-поля имеют связанный `<label>`.
- Динамический контент с `role="alert"` обновляет text при изменении state.

**Check:** ESLint `jsx-a11y/strict` + `audit-ai-docs.react-next.sh` probe `R15` + axe в Playwright.

## R16 — Performance
- `next/image` для всех изображений (никаких `<img>`).
- `next/link` для внутренней навигации (никаких `<a href="/internal">`).
- Lazy loading через `dynamic()` для тяжёлых компонентов.
- Изображения имеют `width`/`height` (предотвращает CLS).
- Шрифты через `next/font` (предотвращает FOIT/FOUT).
- Bundle size monitored (`@next/bundle-analyzer` в CI).

**Check:** ESLint `@next/next/core-web-vitals` + `audit-ai-docs.react-next.sh` probes `R16a` (no `<img>`), `R16b` (no `<a href="/...">`).

## R17 — Тесты компонентов
- Каждый публичный компонент в `src/shared/ui/` или `src/features/*/ui/` имеет:
  - Минимум 1 story в `.stories.tsx` (как минимум `Default`).
  - Минимум 3 кейса в `.unit.ts` (default render, interaction, edge case).
  - Если интерактивный: хотя бы один `userEvent` тест.
  - Если accessibility-relevant: проверка aria через axe в Storybook или Playwright.
- `userEvent` вместо `fireEvent` (разная семантика).
- `screen.getByRole(...)` с accessible name предпочтительнее `getByTestId(...)`.
- Никакого `screen.debug()` в коммите.

**Check:** `audit-ai-docs.react-next.sh` probe `R17` + `eslint-plugin-testing-library` strict.

## R18 — TanStack Query / SWR
- Каждый `useQuery`/`useSWR` имеет typed response через Zod-схему (через `.parse()` или `.safeParse()` в `queryFn`).
- `queryKey` содержит все параметры, влияющие на запрос.
- `staleTime` / `gcTime` настроены явно (не дефолты).
- В `onError` — реакция (toast, log в Sentry), не молчание.
- Никаких `useEffect(() => fetch(...))` для read-операций.

**Check:** AST grep на `useQuery` без `.parse()` в `queryFn` (project-specific probe).

## R19 — Стили
- Tailwind utilities — основное.
- `cn()` helper для conditional classes (clsx + tailwind-merge).
- Никакого CSS-in-JS (styled-components / emotion) — нарушает RSC.
- shadcn/ui для базовых компонентов, кастомные на их основе.
- CSS Modules допустимо для encapsulated компонентов с сложными state-зависимыми стилями.

**Check:** `dependency-cruiser` правило blocking `styled-components`/`@emotion`.

## R20 — Server Actions
- Декларация `'use server'` в начале файла или в функции.
- Возвращаемый тип: `{ ok: true, data: T } | { ok: false, error: string, fieldErrors?: Record<string, string[]> }`.
- `formData` валидируется через Zod `.safeParse()`.
- Errors возвращаются, не throw'ятся (Next десериализует).
- `revalidatePath()` / `revalidateTag()` после мутаций, изменяющих кеш.
- Server Actions защищены auth-проверкой (если требуется): первая строка функции — `requireUser()` или эквивалент.

**Check:** `audit-ai-docs.react-next.sh` probe `R20` + project-specific probe для auth.

---

## How violations are handled

1. `best-practices-sidecar` flags violation on `/aif-verify`.
2. `docs-auditor` runs `audit-ai-docs.react-next.sh` and reports.
3. `/aif-fix` resolves flagged items.
4. If a rule is genuinely incompatible — `/aif-rules` to discuss update with rationale.

## Adding new project-specific rules

When project develops project-specific patterns:
1. Add rule R21+ to this file with its automated check.
2. Add corresponding probe to `scripts/audit-ai-docs.react-next.sh`.
3. Add **negative test** for the probe — without it, rule is wishful thinking.
4. Update `best-practices-sidecar.md` if the check requires AI interpretation.
