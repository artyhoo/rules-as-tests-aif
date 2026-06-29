// BAD — no ErrorBoundary in JSX tree (blank screen on any unhandled render error)
export function App() {
  return (
    <main>
      <div>Hello World</div>
    </main>
  );
}
