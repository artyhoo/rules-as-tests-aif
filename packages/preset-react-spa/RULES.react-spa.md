# Rules — React 19 SPA extension

> Дополняет `RULES.md` правилами для React 19 SPA on Vite (no SSR, no Server Actions).
> Базовые R1–R11 применяются ко всем проектам и описаны в `RULES.md`.
> Эти правила enforce-ятся на самом раннем достижимом канале: edit-time custom ESLint,
> pre-push `audit-ai-docs.react-spa.sh`, и AI Factory `rules-sidecar` (читает этот файл) на `/aif-verify`.
>
> **Authoritative for:** R-SPA-* rule extension for React 19 SPA on Vite (consumer-customisable per preset).
> **NOT authoritative for:** project goal — see consumer's README.md. Canonical R1–R11 — see `RULES.md`.

## Summary table

| Rule | Stack | Check |
|---|---|---|
| **R-SPA-EB Error-boundary presence** | react-spa | ESLint `rules-as-tests/require-error-boundary` on app-root globs |
| **R-SPA-A11Y Accessibility** | react-spa | ESLint `eslint-plugin-jsx-a11y` (flatConfigs.recommended) |
| **R-SPA-ARCH Architectural boundaries** | react-spa | ESLint `eslint-plugin-boundaries` + dependency-cruiser |
| **R-SPA-HOOKS Rules of Hooks + Compiler** | react-spa | ESLint `eslint-plugin-react-hooks@^6` (react-hooks/rules-of-hooks, react-hooks/exhaustive-deps, react-hooks/react-compiler) |

---

## R-SPA-EB — Error-boundary presence {#r-spa-eb-error-boundary-presence}

**Why:** Unlike Next.js (which provides `error.tsx` as a built-in error boundary at the route level), Vite SPA has no framework-level boundary. Without one, an unhandled render error causes the entire app to unmount with a blank screen — no user feedback, no recovery path.

**Policy:** App-root files (glob-scoped via `eslint.config.mjs`) must render their content inside an ErrorBoundary JSX element. «App-root files» are entry-point components like `src/App.tsx`, `src/main.tsx`, `src/Root.tsx`.

**Implementation:** `eslint-rules/require-error-boundary.ts` — custom AST rule (BUILD, prior-art-evaluations.md#140). Scope CONSTRAINT v1: narrow in-file check only (no cross-file boundary-tree walk). The rule checks for the presence of a JSX element whose name contains `ErrorBoundary` as an ancestor in the file's JSX tree.

**Escape hatch:** `// audit:exempt` on the same line as the first JSX element — for files intentionally operating without a boundary (e.g. a root-level error page that IS the fallback).

**Check:** ESLint `rules-as-tests/require-error-boundary` (glob-scoped to app-root files in `eslint.config.react.mjs` under `RULE_GLOBS.appRoot`).

### Examples

```tsx
// BAD — no ErrorBoundary in JSX tree
function App() {
  return (
    <main>
      <Router />
    </main>
  );
}
```

```tsx
// BAD (T-MS-A) — ErrorBoundary imported but NOT mounted; string-grep would miss this
import ErrorBoundary from './ErrorBoundary';
function App() {
  return (
    <main>
      <Router />
    </main>
  );
}
```

```tsx
// GOOD — ErrorBoundary is an ancestor in the JSX tree
import { ErrorBoundary } from 'react-error-boundary';
function App() {
  return (
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <Router />
    </ErrorBoundary>
  );
}
```

```tsx
// GOOD — Sentry.ErrorBoundary member expression also detected
import * as Sentry from '@sentry/react';
function App() {
  return (
    <Sentry.ErrorBoundary>
      <Router />
    </Sentry.ErrorBoundary>
  );
}
```

```tsx
// GOOD (exempt) — Root error page intentionally has no wrapper
function RootErrorPage() {
  return <main>Critical error — cannot recover</main>; // audit:exempt
}
```

---

## R-SPA-A11Y — Accessibility

**Policy:** All interactive elements must be keyboard-accessible and have appropriate ARIA attributes. Uses `eslint-plugin-jsx-a11y` (flatConfigs.recommended).

**Key rules enforced:**
- `jsx-a11y/click-events-have-key-events` — `<div onClick>` without keyboard equivalent
- `jsx-a11y/no-static-element-interactions` — static elements with mouse handlers
- `jsx-a11y/anchor-is-valid` — `<a>` must have valid href or role

**Check:** ESLint `eslint-plugin-jsx-a11y` (enabled in `eslint.config.react.mjs`).

---

## R-SPA-ARCH — Architectural boundaries

**Policy:** Feature-Sliced Design. Presentation layer cannot import from domain or infrastructure. Features communicate only via their public `index.ts`.

**Check:** `eslint-plugin-boundaries` (configured in `eslint.config.react.mjs`) + `dependency-cruiser` (ADOPT, SSOT #119).

---

## R-SPA-HOOKS — Rules of Hooks + React Compiler

**Policy:** All React Hooks rules enforced. Uses `eslint-plugin-react-hooks@^6`.

**Key rules enforced:**
- `react-hooks/rules-of-hooks` — Hooks called conditionally or in non-component functions
- `react-hooks/exhaustive-deps` — Missing dependencies in `useEffect`/`useCallback`/`useMemo`
- `react-hooks/react-compiler` — Code the React Compiler cannot optimize (v6+, set to `warn` by default for gradual adoption)

**IMPORTANT:** Do NOT install `eslint-plugin-react-compiler` separately — it is deprecated and merged into `eslint-plugin-react-hooks@^6`. The `react-hooks/react-compiler` rule is available directly in react-hooks v6.

**Check:** ESLint `eslint-plugin-react-hooks@^6` (enabled in `eslint.config.react.mjs`).

---

## What is NOT in this preset (vs Next.js preset)

| Feature | Next.js | React SPA |
|---|---|---|
| Server Actions | ✅ `require-use-server-directive` | ❌ No Server Actions |
| Server/Client boundary | ✅ `no-server-imports-in-client`, `no-restricted-globals` | ❌ All client |
| Next.js plugin | ✅ `@next/eslint-plugin-next` | ❌ Not applicable |
| Route-level error.tsx | ✅ Framework convention | ❌ Manual (R-SPA-EB) |

## How violations are handled

1. AI Factory's `rules-sidecar` flags the violation in `/aif-verify` output (and edit-time ESLint / pre-push `audit-ai-docs.react-spa.sh` flag it earlier).
2. `/aif-fix` is invoked automatically on flagged items.
3. If the rule is genuinely incompatible with the task — `/aif-rules` to discuss updating the rule (with rationale), not to silently bypass it.
