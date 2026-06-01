// packages/runtime-bridge/test/aif-dispatch-dedup.test.ts
// Finding B (qloop-ux-probe 2026-06-01): a dispatch that fell back to ManualBackend
// still recorded a dedup entry, blocking a legitimate real retry for the 24h TTL with
// no --force escape. These guards cover the two pure decisions that fix it.
import { describe, it, expect } from 'vitest';
import { dispatchUsesForce, resolveKickoffPath, shouldRecordDedup } from '../src/cli/dispatch.js';

describe('dispatchUsesForce', () => {
  it('true when --force is present (anywhere in argv)', () => {
    expect(dispatchUsesForce(['k.md', '--force'])).toBe(true);
    expect(dispatchUsesForce(['--force', 'k.md'])).toBe(true);
  });
  it('false when --force is absent', () => {
    expect(dispatchUsesForce(['k.md'])).toBe(false);
  });
});

describe('resolveKickoffPath', () => {
  it('returns the first non-flag token regardless of --force position', () => {
    expect(resolveKickoffPath(['path/to/kickoff.md', '--force'])).toBe('path/to/kickoff.md');
    expect(resolveKickoffPath(['--force', 'path/to/kickoff.md'])).toBe('path/to/kickoff.md');
  });
  it('returns undefined when only flags are present', () => {
    expect(resolveKickoffPath(['--force'])).toBeUndefined();
  });
});

describe('shouldRecordDedup — the Finding B fix', () => {
  it('records for a real backend success (aif-handoff)', () => {
    expect(shouldRecordDedup('aif-handoff')).toBe(true);
  });
  it('does NOT record for a ManualBackend fallback (would block a legit retry)', () => {
    expect(shouldRecordDedup('manual')).toBe(false);
  });

  // Negative guard: green now, RED if the manual carve-out ever regresses to
  // "record everything" (the exact Finding-B breakage).
  it('GUARD: a manual fallback must NOT be treated as recordable', () => {
    expect(shouldRecordDedup('manual')).not.toBe(true);
  });
});
