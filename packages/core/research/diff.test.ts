import { describe, expect, it } from 'vitest';
import { diffPlans } from './diff.ts';
import type { ResearchEntry, ResearchPlan } from './types.ts';

const provenance = {
  url: 'https://nextjs.org/docs',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

const entry = (overrides: Partial<ResearchEntry>): ResearchEntry => ({
  id: 'e',
  summary: 'summary',
  bestPractices: [],
  antiPatterns: [],
  provenance: [provenance],
  ...overrides,
});

const plan = (overrides: Partial<ResearchPlan> = {}): ResearchPlan => ({
  framework: 'next',
  version: '16.0.0',
  patterns: [],
  missing: [],
  drift: null,
  ...overrides,
});

describe('diffPlans — pattern-keyed delta', () => {
  it('returns empty delta for identical plans', () => {
    const a = plan({ patterns: [entry({ id: 'x' })] });
    const b = plan({ patterns: [entry({ id: 'x' })] });
    const delta = diffPlans(a, b);
    expect(delta.added).toEqual([]);
    expect(delta.removed).toEqual([]);
    expect(delta.modified).toEqual([]);
    expect(delta.frameworkChanged).toBeNull();
    expect(delta.versionChanged).toBeNull();
  });

  it('detects added entries', () => {
    const a = plan();
    const b = plan({ patterns: [entry({ id: 'new' })] });
    const delta = diffPlans(a, b);
    expect(delta.added.map((e) => e.id)).toEqual(['new']);
    expect(delta.removed).toEqual([]);
    expect(delta.modified).toEqual([]);
  });

  it('detects removed entries', () => {
    const a = plan({ patterns: [entry({ id: 'gone' })] });
    const b = plan();
    const delta = diffPlans(a, b);
    expect(delta.removed).toEqual(['gone']);
    expect(delta.added).toEqual([]);
  });

  it('detects modified entries by stable content hash', () => {
    const a = plan({ patterns: [entry({ id: 'x', bestPractices: ['old'] })] });
    const b = plan({ patterns: [entry({ id: 'x', bestPractices: ['new'] })] });
    const delta = diffPlans(a, b);
    expect(delta.modified).toHaveLength(1);
    expect(delta.modified[0].id).toBe('x');
    expect(delta.modified[0].before.bestPractices).toEqual(['old']);
    expect(delta.modified[0].after.bestPractices).toEqual(['new']);
  });

  it('does NOT mark unchanged-content but reordered-key entries as modified (stable hash)', () => {
    const a = plan({
      patterns: [
        {
          id: 'x',
          summary: 's',
          bestPractices: ['p1'],
          antiPatterns: ['ap1'],
          provenance: [provenance],
        },
      ],
    });
    const b = plan({
      patterns: [
        {
          // same content, different key order in the source
          provenance: [provenance],
          antiPatterns: ['ap1'],
          bestPractices: ['p1'],
          summary: 's',
          id: 'x',
        },
      ],
    });
    expect(diffPlans(a, b).modified).toEqual([]);
  });

  it('reports framework / version transitions when they differ', () => {
    const a = plan({ framework: 'next', version: '15.4.0' });
    const b = plan({ framework: 'next', version: '16.0.1' });
    const delta = diffPlans(a, b);
    expect(delta.frameworkChanged).toBeNull();
    expect(delta.versionChanged).toEqual({ before: '15.4.0', after: '16.0.1' });
  });

  it('handles mixed added + removed + modified in a single delta with stable sort', () => {
    const a = plan({
      patterns: [
        entry({ id: 'a' }),
        entry({ id: 'b', summary: 'old' }),
        entry({ id: 'c' }),
      ],
    });
    const b = plan({
      patterns: [
        entry({ id: 'a' }),
        entry({ id: 'b', summary: 'new' }),
        entry({ id: 'd' }),
      ],
    });
    const delta = diffPlans(a, b);
    expect(delta.added.map((e) => e.id)).toEqual(['d']);
    expect(delta.removed).toEqual(['c']);
    expect(delta.modified.map((m) => m.id)).toEqual(['b']);
  });
});
