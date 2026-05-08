// L4 gate 4 negative-corpus fixture — a real but unrelated TSX file:
// no 'use client' directive (so RSC-import rules stay silent),
// no `next/router` import (App-Router restriction stays silent),
// no FormData parameter (R14 stays silent),
// no async export (R20 use-server stays silent).
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
