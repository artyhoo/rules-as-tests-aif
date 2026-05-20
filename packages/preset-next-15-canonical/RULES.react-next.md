# Rules — React/Next.js extension (R12–R20)

> Дополняет `RULES.md` правилами R12–R20 для React 19 + Next.js 15 App Router.
> Базовые R1–R11 применяются ко всем проектам и описаны в `RULES.md`.
> Эти правила проверяются AIF `rules-sidecar` (читает `.ai-factory/RULES.md`) после каждого `/aif-implement`,
> и `audit-ai-docs.react-next.sh` после `/aif-verify`.
>
> **Authoritative for:** R12–R20 rule extension for React 19 + Next.js 15 (consumer-customisable per preset).
> **NOT authoritative for:** project goal — see consumer's README.md.

## R12 — Server vs Client Components
- Компоненты по умолчанию Server. `'use client'` только если используется one of: `useState`, `useEffect`, `useReducer`, `useRef`, `useCallback`, `useMemo`, обработчик событий, browser API.
- Server Component не импортирует Client Component с client-only side effects.
- `'use client'` ставится в начале файла, до импортов.
- Файлы с `import 'server-only'` не могут быть импортированы из `'use client'` файлов.

**Check:** ESLint `no-restricted-globals` (Server Components: window/document/localStorage)
+ ESLint `rules-as-tests/no-server-imports-in-client` ('use client' files: forbid imports from
infrastructure/, config/env, fs, node:fs, node:crypto, node:path).

### Examples

```tsx
// BAD
// no 'use client' directive
export function Counter() {
  const [n, setN] = useState(0); // useState in Server Component
}
```

```tsx
// GOOD
'use client';
export function Counter() {
  const [n, setN] = useState(0);
}
```

## R13 — Data fetching
- Server Components: прямые `async`/`await` вызовы (БД, fetch с auth headers).
- Client-side reads: TanStack Query / SWR с типизированной схемой ответа через Zod `.parse()`.
- Writes: Server Actions (`'use server'`) с Zod-валидацией formData.
- Никаких `fetch()` напрямую в Client Component без обёртки `useQuery`/`useSWR`.
- Suspense boundaries вокруг async-границ; `loading.tsx` для маршрутов.

**Check:** R13 — manual review only (AST grep на использование TanStack Query / SWR).

### Examples

```tsx
// BAD
'use client';
export function Orders() {
  useEffect(() => { fetch('/api/orders').then(r => r.json()).then(setData); }, []);
}
```

```tsx
// GOOD
'use client';
export function Orders() {
  const { data } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });
}
```

## R14 — Forms
- Все формы — через Server Actions (`'use server'`).
- Валидация Zod-схемой на сервере (не доверяем клиенту).
- `useActionState` для UI feedback (pending, error, success).
- Поля формы имеют `name` (для FormData) и связанный `<label>`.
- Возвращаемый тип Server Action: `{ ok: true, data: T } | { ok: false, error: string, fieldErrors?: Record<string, string[]> }`.
- Errors возвращаются, не throw'ятся (Next десериализует).
- `revalidatePath()` / `revalidateTag()` после мутаций, изменяющих кеш.

**Check:** ESLint `rules-as-tests/require-form-safe-parse` (любая функция с параметром
`FormData` обязана вызывать `.safeParse(...)` в теле).

### Examples

```ts
// BAD
'use server';
export async function submit(fd: FormData) {
  await save(fd.get('name') as string); // no safeParse
}
```

```ts
// GOOD
'use server';
export async function submit(fd: FormData) {
  const r = Schema.safeParse(Object.fromEntries(fd));
  if (!r.success) return { ok: false, error: r.error.message };
  await save(r.data);
}
```

## R15 — Accessibility
- Каждый интерактивный элемент имеет accessible name (aria-label, aria-labelledby или text content).
- Все `<button>` имеют `type` (submit, button, reset).
- Никаких `<div onClick>` — для интерактивности `<button>` или `<a>`.
- Color contrast соблюдается (проверяется через axe-playwright в e2e).
- Все form-поля имеют связанный `<label>`.
- Динамический контент с `role="alert"` обновляет text при изменении state.

**Check:** ESLint `jsx-a11y/strict` + axe в Playwright.

### Examples

```tsx
// BAD
<div onClick={handleClick}>Click me</div>
<button>✕</button>
```

```tsx
// GOOD
<button type="button" onClick={handleClick}>Click me</button>
<button type="button" aria-label="Close">✕</button>
```

## R16 — Performance
- `next/image` для всех изображений (никаких `<img>`).
- `next/link` для внутренней навигации (никаких `<a href="/internal">`).
- Lazy loading через `dynamic()` для тяжёлых компонентов.
- Изображения имеют `width`/`height` (предотвращает CLS).
- Шрифты через `next/font` (предотвращает FOIT/FOUT).
- Bundle size monitored (`@next/bundle-analyzer` в CI).

**Check:** ESLint `@next/next/no-img-element` + `@next/next/no-html-link-for-pages` (правила core-web-vitals).

### Examples

```tsx
// BAD
<img src="/hero.jpg" alt="Hero" />
<a href="/about">About</a>
```

```tsx
// GOOD
import Image from 'next/image';
<Image src="/hero.jpg" width={800} height={400} alt="Hero" />
<Link href="/about">About</Link>
```

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

### Examples

```ts
// BAD
// Button.tsx has no Button.stories.tsx or Button.unit.ts
export function Button({ label }: { label: string }) { return <button>{label}</button>; }
```

```ts
// GOOD
// Button.stories.tsx
export const Default: Story = { args: { label: 'Submit' } };
// Button.unit.ts: default render + userEvent click + empty label edge case
```

## R18 — TanStack Query / SWR
- Каждый `useQuery`/`useSWR` имеет typed response через Zod-схему (через `.parse()` или `.safeParse()` в `queryFn`).
- `queryKey` содержит все параметры, влияющие на запрос.
- `staleTime` / `gcTime` настроены явно (не дефолты).
- В `onError` — реакция (toast, log в Sentry), не молчание.
- Никаких `useEffect(() => fetch(...))` для read-операций.

**Check:** AST grep на `useQuery` без `.parse()` в `queryFn` (project-specific probe).

### Examples

```ts
// BAD
const { data } = useQuery({
  queryKey: ['orders'],
  queryFn: () => fetch('/api/orders').then(r => r.json()),
});
```

```ts
// GOOD
const { data } = useQuery({
  queryKey: ['orders', userId],
  queryFn: () => fetch('/api/orders').then(r => r.json()).then(OrderSchema.parse),
  staleTime: 60_000,
});
```

## R19 — Стили
- Tailwind utilities — основное.
- `cn()` helper для conditional classes (clsx + tailwind-merge).
- Никакого CSS-in-JS (styled-components / emotion) — нарушает RSC.
- shadcn/ui для базовых компонентов, кастомные на их основе.
- CSS Modules допустимо для encapsulated компонентов с сложными state-зависимыми стилями.

**Check:** `dependency-cruiser` правило blocking `styled-components`/`@emotion`.

### Examples

```tsx
// BAD
import styled from 'styled-components';
const Card = styled.div`padding: 1rem;`;
```

```tsx
// GOOD
import { cn } from '@/lib/utils';
<div className={cn('p-4', active && 'bg-primary')}>...</div>
```

## R20 — Server Actions
- Декларация `'use server'` в начале файла или в функции.
- Возвращаемый тип: `{ ok: true, data: T } | { ok: false, error: string, fieldErrors?: Record<string, string[]> }`.
- `formData` валидируется через Zod `.safeParse()`.
- Errors возвращаются, не throw'ятся (Next десериализует).
- `revalidatePath()` / `revalidateTag()` после мутаций, изменяющих кеш.
- Server Actions защищены auth-проверкой (если требуется): первая строка функции — `requireUser()` или эквивалент.

**Check:** ESLint `rules-as-tests/require-use-server-directive` (`export async function`
требует `'use server'` директивы в начале файла) + project-specific probe для auth.

### Examples

```ts
// BAD
export async function deleteItem(id: string) {
  await db.delete(id); // no 'use server'
}
```

```ts
// GOOD
'use server';
export async function deleteItem(id: string) {
  await db.delete(id);
  revalidatePath('/items');
}
```

---

## How violations are handled

1. AIF's `rules-sidecar` flags violation on `/aif-verify`.
2. `living-docs-auditor` runs `audit-ai-docs.react-next.sh` and reports.
3. `/aif-fix` resolves flagged items.
4. If a rule is genuinely incompatible — `/aif-rules` to discuss update with rationale.

## Adding new project-specific rules

When project develops project-specific patterns:
1. Add rule R21+ to this file with its automated check.
2. Add corresponding probe to `scripts/audit-ai-docs.react-next.sh`.
3. Add **negative test** for the probe — without it, rule is wishful thinking.
4. Update `.ai-factory/RULES.md` and the `aif-rules-check` skill-context if the check requires AI interpretation.
