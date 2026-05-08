import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import { loadEntries } from './load.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(HERE, 'research-plan.schema.json');

describe('loadEntries — semver-aware research store lookup', () => {
  it('returns exact-major hit for next@16.0.1 + nextjs-app-router', () => {
    const entries = loadEntries('next', '16.0.1', ['nextjs-app-router']);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('nextjs-app-router');
    expect(entries[0].summary).toMatch(/App Router.*Next 16/);
  });

  it('coerces semver range syntax (`^16.2.0`) to major and resolves 16.x', () => {
    const entries = loadEntries('next', '^16.2.0', ['nextjs-app-router']);
    expect(entries).toHaveLength(1);
    expect(entries[0].provenance[0].url).toMatch(/nextjs\.org/);
  });

  it('returns 15.x entry when version is 15.4.2', () => {
    const entries = loadEntries('next', '15.4.2', ['nextjs-app-router']);
    expect(entries).toHaveLength(1);
    expect(entries[0].summary).toMatch(/Next\.js 15/);
    expect(entries[0].summary).not.toMatch(/Next 16/);
  });

  it('falls back to shared/ for version-agnostic pattern (tailwind-v3-config under any framework)', () => {
    const entries = loadEntries('next', '16.0.0', ['tailwind-v3-config']);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('tailwind-v3-config');
    expect(entries[0].provenance[0].allowlistKey).toBe('tailwind.official');
  });

  it('skips patterns with no entry rather than throwing', () => {
    const entries = loadEntries('next', '16.0.0', ['unknown-pattern-xyz']);
    expect(entries).toHaveLength(0);
  });

  it('returns mixed result: some framework-specific, some shared, some missing — sorted by id', () => {
    const entries = loadEntries('next', '16.0.0', [
      'tailwind-v4-css-tokens',
      'nextjs-app-router',
      'unknown-pattern-xyz',
      'react-server-components',
    ]);
    expect(entries.map((e) => e.id)).toEqual([
      'nextjs-app-router',
      'react-server-components',
      'tailwind-v4-css-tokens',
    ]);
  });

  it('handles framework=null + version=null by checking only shared/', () => {
    const entries = loadEntries(null, null, [
      'tailwind-v3-config',
      'nextjs-app-router',
    ]);
    expect(entries.map((e) => e.id)).toEqual(['tailwind-v3-config']);
  });
});

describe('research-plan.schema.json — invariants', () => {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(schema, 'research-plan');
  const validateEntry = ajv.compile({
    $ref: 'research-plan#/definitions/ResearchEntry',
  });

  it('rejects an entry missing required fields', () => {
    const bad = { id: 'x', summary: 'y' };
    expect(validateEntry(bad)).toBe(false);
  });

  it('rejects provenance with a non-allowlist URL via additionalProperties=false on Provenance', () => {
    const bad = {
      id: 'x',
      summary: 'y',
      bestPractices: [],
      antiPatterns: [],
      provenance: [{ url: 'http://example.com', allowlistKey: 'x', fetchedAt: '2026-05-08', extra: true }],
    };
    expect(validateEntry(bad)).toBe(false);
  });

  it('accepts a minimal valid entry', () => {
    const good = {
      id: 'x',
      summary: 'y',
      bestPractices: [],
      antiPatterns: [],
      provenance: [{ url: 'https://nextjs.org/docs', allowlistKey: 'next.official', fetchedAt: '2026-05-08' }],
    };
    expect(validateEntry(good)).toBe(true);
  });
});
