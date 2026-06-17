/**
 * Principle 23 — aif-init passport generation: detectPassportFields returns
 * concrete field values (no <…> placeholders) for real consumer-stack fixtures.
 *
 * Validates acceptance criterion 2 from GH #547 P1 kickoff:
 *   "Detection is derived from repo signals, not hardcoded — proven on ≥2
 *    differently-shaped fixtures (Hono+Drizzle monorepo AND Next.js+Prisma
 *    flat repo) → each yields a stack-correct draft."
 *
 * T-Passport-A (domain-specific trap) counter: the two-fixture assertion proves
 * detection derives from arbitrary repo signals, not a hardcoded reference stack.
 *
 * Prior-art: SSOT #126 (CC /init ADAPT), #128 (own-stack detector reuse).
 */
import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPassportFields } from '../detector/passport.ts';
import type { PassportFields } from '../detector/passport.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, '../detector/fixtures');

function assertNoPlaceholders(fields: PassportFields): void {
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string') {
      expect(
        val,
        `Field "${key}" must not contain <…> placeholders; got: "${val}"`,
      ).not.toMatch(/<[^>]+>/);
    }
  }
}

describe('Principle 23 — detectPassportFields: stack-correct, no placeholders', () => {
  describe('Fixture A: Hono + Drizzle monorepo (apps/api workspace)', () => {
    const root = resolve(FIXTURES, 'hono-drizzle-monorepo');

    it('framework detected as Hono (from apps/api workspace dep)', () => {
      expect(detectPassportFields(root).framework).toBe('Hono');
    });

    it('ORM detected as Drizzle', () => {
      expect(detectPassportFields(root).orm).toBe('Drizzle');
    });

    it('database detected as Postgres (pg in workspace)', () => {
      expect(detectPassportFields(root).database).toBe('Postgres');
    });

    it('observability detected as Honeycomb', () => {
      expect(detectPassportFields(root).observability).toBe('Honeycomb');
    });

    it('test runner detected as Vitest', () => {
      expect(detectPassportFields(root).testRunner).toBe('Vitest');
    });

    it('no <…> placeholder values in any field (acceptance criterion 1)', () => {
      assertNoPlaceholders(detectPassportFields(root));
    });
  });

  describe('Fixture B: Next.js + Prisma flat repo', () => {
    const root = resolve(FIXTURES, 'nextjs-prisma-flat');

    it('framework detected as Next.js (from package.json dep)', () => {
      expect(detectPassportFields(root).framework).toBe('Next.js');
    });

    it('ORM detected as Prisma', () => {
      expect(detectPassportFields(root).orm).toBe('Prisma');
    });

    it('test runner detected as Vitest', () => {
      expect(detectPassportFields(root).testRunner).toBe('Vitest');
    });

    it('no <…> placeholder values in any field (acceptance criterion 1)', () => {
      assertNoPlaceholders(detectPassportFields(root));
    });
  });

  describe('T-Passport-A counter: fixtures yield different stacks (not hardcoded)', () => {
    const honoRoot = resolve(FIXTURES, 'hono-drizzle-monorepo');
    const nextRoot = resolve(FIXTURES, 'nextjs-prisma-flat');

    it('framework differs between fixtures (Hono vs Next.js)', () => {
      const a = detectPassportFields(honoRoot);
      const b = detectPassportFields(nextRoot);
      expect(a.framework).not.toBe(b.framework);
    });

    it('ORM differs between fixtures (Drizzle vs Prisma)', () => {
      const a = detectPassportFields(honoRoot);
      const b = detectPassportFields(nextRoot);
      expect(a.orm).not.toBe(b.orm);
    });
  });

  describe('mutation: empty dir returns all-null fields (degrades gracefully)', () => {
    it('unknown project → framework null, no crash', () => {
      const fields = detectPassportFields(resolve(FIXTURES, 'ts-server'));
      expect(fields.framework).toBeNull();
      expect(fields.orm).toBeNull();
      expect(fields.database).toBeNull();
    });
  });
});
