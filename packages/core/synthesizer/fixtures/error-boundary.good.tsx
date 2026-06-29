// GOOD — ErrorBoundary wraps the content at app root (R-SPA-EB satisfied)
import { ErrorBoundary } from 'react-error-boundary';

export function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <main>
        <div>Hello World</div>
      </main>
    </ErrorBoundary>
  );
}
