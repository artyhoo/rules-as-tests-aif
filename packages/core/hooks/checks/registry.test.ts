/**
 * registry.test.ts — Vitest tests for checks/registry.ts (Wave 10.5).
 *
 * Asserts the two invariants mandated by research patch §4.8.X.2:
 *   1. Every criticalForFallback entry has runner: 'bash' (bash-expressible invariant).
 *   2. At least 2 critical checks are present, and both required ones exist
 *      ('prior-art-presence' + 's17-presence') — per D2 §7.2 table.
 *
 * C3 multi-assertion lesson applied: assert BOTH the predicate AND the identity
 * of the critical entries (not just count), catching rename/typo regressions.
 *
 * T15 self-application: the registry invariant is itself unit-tested here —
 * the rule «every criticalForFallback check is bash-expressible» is an executable
 * artifact that applies to its own enforcement mechanism.
 */
import { describe, it, expect } from 'vitest';
import { CHECK_REGISTRY } from './registry.ts';

describe('CHECK_REGISTRY — bash-expressible invariant (§4.8.X.2)', () => {
  it('every criticalForFallback entry has runner: bash', () => {
    const criticalEntries = CHECK_REGISTRY.filter((c) => c.criticalForFallback);
    expect(criticalEntries.length).toBeGreaterThanOrEqual(1);
    for (const entry of criticalEntries) {
      expect(entry.runner, `${entry.id} is criticalForFallback but runner is not 'bash'`).toBe(
        'bash',
      );
    }
  });

  it('at least 2 critical checks exist (D2 §7.2 mandates both presence checks)', () => {
    const criticalEntries = CHECK_REGISTRY.filter((c) => c.criticalForFallback);
    expect(criticalEntries.length).toBeGreaterThanOrEqual(2);
  });

  it('prior-art-presence check is present and critical', () => {
    const entry = CHECK_REGISTRY.find((c) => c.id === 'prior-art-presence');
    expect(entry, 'prior-art-presence must be in the registry').toBeDefined();
    expect(entry!.criticalForFallback).toBe(true);
    expect(entry!.runner).toBe('bash');
  });

  it('s17-presence check is present and critical', () => {
    const entry = CHECK_REGISTRY.find((c) => c.id === 's17-presence');
    expect(entry, 's17-presence must be in the registry').toBeDefined();
    expect(entry!.criticalForFallback).toBe(true);
    expect(entry!.runner).toBe('bash');
  });

  it('non-critical checks are NOT required to have runner: bash (TS-core checks allowed)', () => {
    const nonCritical = CHECK_REGISTRY.filter((c) => !c.criticalForFallback);
    // Some non-critical checks should be ts — confirms the registry captures both kinds.
    const tsEntries = nonCritical.filter((c) => c.runner === 'ts');
    expect(tsEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('all entries have non-empty id and description', () => {
    for (const entry of CHECK_REGISTRY) {
      expect(entry.id.length, `entry with empty id`).toBeGreaterThan(0);
      expect(entry.description.length, `${entry.id} has empty description`).toBeGreaterThan(0);
    }
  });
});
