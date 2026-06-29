# Architecture — React 19 SPA (Vite)

> Layer rules + Feature-Sliced Design. Enforced by `dependency-cruiser` + ESLint (boundaries plugin) + custom AST rules.
>
> **Authoritative for:** Feature-Sliced + hexagonal layer structure for React 19 SPA (Vite) projects (consumer-customisable).
> **NOT authoritative for:** project goal — see consumer's README.md.

## Layer structure (Feature-Sliced Design + hexagonal)

```text
src/
├── main.tsx                  # Vite entry point — mounts <App /> via createRoot()
├── App.tsx                   # App root — MUST wrap content in <ErrorBoundary>
├── domain/                   # Pure business types + schemas. Stdlib + Zod.
│   ├── entities/
│   ├── value-objects/
│   └── events/
├── application/              # Use cases. Client-side orchestration.
│   ├── commands/
│   ├── queries/
│   └── ports/
├── infrastructure/           # External integrations. Fetch adapters, storage, queues.
│   ├── http/
│   ├── storage/
│   └── messaging/
├── features/                 # Feature-Sliced. Each is self-contained.
│   └── checkout/
│       ├── ui/               # React components (all client-side in SPA)
│       ├── lib/              # Utilities
│       ├── api/              # Fetch wrappers (R2: safeParse boundaries here)
│       ├── model/            # Zod schemas / types
│       └── index.ts          # Public API of the feature
├── shared/                   # Shared layer
│   ├── ui/                   # Reusable UI: Buttons, Inputs, Dialogs
│   ├── lib/                  # cn(), date format helpers, etc.
│   ├── api/                  # fetch wrappers, API clients
│   └── config/
└── config/
    └── env.ts                # Zod-validated import.meta.env
```

## Key differences from Next.js (App Router)

| Concern        | Next.js                                               | React SPA (Vite)                                   |
| -------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Rendering      | Server Components + Client Components                 | Client-only (all components run in browser)        |
| Server Actions | `'use server'` directive, `use-server-directive` rule | ❌ No Server Actions                               |
| `'use client'` | Required for client-interactivity                     | ❌ Not needed — everything is client               |
| Error boundary | Next.js `error.tsx` convention                        | ✅ **Must wrap App root manually** (R-SPA-EB rule) |
| Routing        | App Router file conventions                           | Library: `react-router`, `tanstack-router`, etc.   |
| Data fetching  | React Server Components, streaming                    | TanStack Query, SWR, or native fetch               |
| Entry point    | `app/layout.tsx`                                      | `src/main.tsx` + `src/App.tsx`                     |

## Error boundary requirement (R-SPA-EB)

Unlike Next.js (which has the `error.tsx` convention), Vite SPA has **no built-in error boundary** at the
route/app level. You must add one explicitly.

The `rules-as-tests/require-error-boundary` ESLint rule enforces this on app-root files (see
`RULES.react-spa.md#r-spa-eb-error-boundary-presence`).

**Minimal pattern:**

```tsx
// src/App.tsx
import { ErrorBoundary } from 'react-error-boundary';
import { Router } from './Router';

function AppFallback({ error }: { error: Error }) {
  return (
    <main role="alert">
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
    </main>
  );
}

export function App() {
  return (
    <ErrorBoundary FallbackComponent={AppFallback}>
      <Router />
    </ErrorBoundary>
  );
}
```

## Boundary rules (enforced by ESLint + dependency-cruiser)

```text
presentation  ──×──►  domain         (no direct domain imports in UI)
presentation  ──×──►  infrastructure (no infra imports in UI)
application   ──×──►  infrastructure (no infra imports in use-cases)
```

Features communicate only through their public `index.ts`.

## API boundary code (R2)

In SPA, the «boundary code» is:

- Feature API modules (`src/features/*/api/**`)
- Shared API clients (`src/shared/api/**`)
- Infrastructure HTTP adapters (`src/infrastructure/http/**`)

These receive untrusted external data (API responses) — always use `.safeParse()`, never `.parse()`.

## Router conventions

The preset is router-agnostic. Common choices:

- **TanStack Router** — type-safe file-based routing; `routeTree.gen.ts` is generated
- **React Router v7** — `<createBrowserRouter>` + `<RouterProvider>`
- **Wouter** — lightweight, hook-based

For route-level error handling (complement to app-root ErrorBoundary):

- TanStack Router: `errorComponent` prop on route definitions
- React Router v7: `errorElement` prop on route objects
- Wouter: wrap individual routes in per-route `<ErrorBoundary>`
