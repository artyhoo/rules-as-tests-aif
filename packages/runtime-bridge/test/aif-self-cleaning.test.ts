// packages/runtime-bridge/test/aif-self-cleaning.test.ts
// Self-cleaning junk producers (2026-06-01): junk must NOT accumulate, and must NOT
// require an AI/manual sweep each session. These cover the two pure cores:
//   - idempotency.pruneStaleEntries: dedup log self-prunes on every write (bounded +
//     stale-manual entries auto-expire → Finding B never recurs after TTL).
//   - ManualBackend.isStaleArtifact: /tmp kickoffs self-prune on the next dispatch.
import { describe, it, expect } from 'vitest';
import { parseEntries, pruneStaleEntries } from '../src/idempotency.js';
import { isStaleArtifact } from '../src/ManualBackend.js';
import type { TaskHandle } from '../src/types.js';

const HANDLE: TaskHandle = { backend: 'manual', taskId: 't', dispatchedAt: '2026-06-01T00:00:00.000Z' };
const at = (iso: string) => ({ hash: 'h', taskHandle: HANDLE, timestamp: iso });
const DAY = 24 * 60 * 60 * 1000;

describe('pruneStaleEntries — dedup log self-prunes by TTL', () => {
  const now = Date.parse('2026-06-02T00:00:00.000Z');
  it('keeps entries within the 24h TTL', () => {
    const fresh = at('2026-06-01T12:00:00.000Z'); // 12h old
    expect(pruneStaleEntries([fresh], now, DAY)).toEqual([fresh]);
  });
  it('drops entries older than the TTL (a stale manual fallback expires on its own)', () => {
    const stale = at('2026-05-30T00:00:00.000Z'); // 48h old
    expect(pruneStaleEntries([stale], now, DAY)).toEqual([]);
  });
  it('keeps the exact-boundary entry (age == TTL is not yet stale)', () => {
    const edge = at('2026-06-01T00:00:00.000Z'); // exactly 24h
    expect(pruneStaleEntries([edge], now, DAY)).toEqual([edge]);
  });

  // Negative guard: green now; RED if prune regressed to a no-op (kept the stale entry).
  it('GUARD: a 48h-old entry must NOT survive the prune', () => {
    expect(pruneStaleEntries([at('2026-05-30T00:00:00.000Z')], now, DAY)).not.toContainEqual(
      at('2026-05-30T00:00:00.000Z'),
    );
  });
});

describe('parseEntries — tolerant JSONL parse', () => {
  it('parses valid lines and skips malformed ones', () => {
    const jsonl = `${JSON.stringify(at('2026-06-01T00:00:00.000Z'))}\nNOT JSON\n`;
    expect(parseEntries(jsonl)).toHaveLength(1);
  });
});

describe('isStaleArtifact — /tmp kickoff self-prune predicate', () => {
  const now = Date.parse('2026-06-08T00:00:00.000Z');
  const SEVEN_D = 7 * DAY;
  it('flags an old runtime-bridge kickoff as stale', () => {
    expect(isStaleArtifact('runtime-bridge-2026-05-01.md', now - 30 * DAY, now, SEVEN_D)).toBe(true);
  });
  it('does NOT flag a fresh kickoff', () => {
    expect(isStaleArtifact('runtime-bridge-2026-06-07.md', now - DAY, now, SEVEN_D)).toBe(false);
  });
  it('does NOT touch unrelated files even when old (scope safety)', () => {
    expect(isStaleArtifact('important-notes.md', now - 365 * DAY, now, SEVEN_D)).toBe(false);
    expect(isStaleArtifact('runtime-bridge-dedup.jsonl', now - 365 * DAY, now, SEVEN_D)).toBe(false);
  });

  // Negative guard: green now; RED if the scope check regressed to match any old file.
  it('GUARD: an unrelated old .md must NOT be considered a prunable artefact', () => {
    expect(isStaleArtifact('my-research.md', now - 365 * DAY, now, SEVEN_D)).not.toBe(true);
  });
});
