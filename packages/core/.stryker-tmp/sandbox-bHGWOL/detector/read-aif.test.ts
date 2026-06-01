// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectStack } from './index.ts';
import { readAif, AifSchemaError } from './read-aif.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, 'fixtures');
const TMP = resolve(HERE, '../../..', '.tmp-detector-aif-test');

describe('readAif — priority 1-3 fixtures', () => {
  it('with-aif fixture: DESCRIPTION.md (priority 1) → confidence high, source DESCRIPTION', () => {
    const r = detectStack(resolve(FIXTURES, 'with-aif'));
    expect(r.source).toBe('.ai-factory/DESCRIPTION.md');
    expect(r.confidence).toBe('high');
    expect(r.severity).toBe('pass');
    expect(r.weight).toBe(2);
    expect(r.stack).toBe('react-next');
    expect(r.framework.name).toBe('next');
    expect(r.framework.major).toBe(16);
  });

  it('no-aif fixture: falls back to manifest (priority 4) → medium confidence', () => {
    const r = detectStack(resolve(FIXTURES, 'no-aif'));
    expect(r.source).toBe('package.json');
    expect(r.confidence).toBe('medium');
    expect(r.framework.major).toBe(16);
  });

  it('aif-skill-context fixture: SKILL.md (priority 3) when no DESCRIPTION/ARCHITECTURE', () => {
    const r = detectStack(resolve(FIXTURES, 'aif-skill-context'));
    expect(r.source).toMatch(/\.ai-factory\/skill-context\/aif-fix\/SKILL\.md$/);
    expect(r.confidence).toBe('high');
    expect(r.framework.name).toBe('react');
    expect(r.framework.major).toBe(19);
  });
});

describe('readAif — priority order DESCRIPTION → ARCHITECTURE', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(resolve(TMP, '.ai-factory'), { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('DESCRIPTION takes precedence over ARCHITECTURE when both present', () => {
    writeFileSync(
      resolve(TMP, '.ai-factory/DESCRIPTION.md'),
      '# Description\n\n## Stack\n\nNext.js 14, React 18.\n',
    );
    writeFileSync(
      resolve(TMP, '.ai-factory/ARCHITECTURE.md'),
      '# Architecture\n\n## Stack\n\nNext.js 16, React 19.\n',
    );
    const r = detectStack(TMP);
    expect(r.source).toBe('.ai-factory/DESCRIPTION.md');
    expect(r.framework.major).toBe(14);
  });

  it('falls through to ARCHITECTURE when DESCRIPTION absent', () => {
    writeFileSync(
      resolve(TMP, '.ai-factory/ARCHITECTURE.md'),
      '# Architecture\n\n## Stack\n\nReact 18, Vite.\n',
    );
    const r = detectStack(TMP);
    expect(r.source).toBe('.ai-factory/ARCHITECTURE.md');
    expect(r.framework.name).toBe('react');
  });
});

describe('readAif — schema validation (mandatory per phase-4-research §5+§6)', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(resolve(TMP, '.ai-factory'), { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('DESCRIPTION.md without canonical heading throws AifSchemaError', () => {
    writeFileSync(
      resolve(TMP, '.ai-factory/DESCRIPTION.md'),
      'just some prose without a canonical h1/h2 heading',
    );
    expect(() => readAif(TMP)).toThrow(AifSchemaError);
    expect(() => readAif(TMP)).toThrow(/no canonical heading/);
  });

  it('schema error message includes file path for actionable diagnostics', () => {
    writeFileSync(
      resolve(TMP, '.ai-factory/ARCHITECTURE.md'),
      'plain text only',
    );
    try {
      readAif(TMP);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AifSchemaError);
      expect((e as Error).message).toContain('.ai-factory/ARCHITECTURE.md');
    }
  });
});

describe('readAif — graceful degradation when AIF absent', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('no .ai-factory dir → readAif returns null (signals fallback to caller)', () => {
    expect(readAif(TMP)).toBeNull();
  });

  it('empty .ai-factory dir → returns null (no skill-context, no DESCRIPTION/ARCHITECTURE)', () => {
    mkdirSync(resolve(TMP, '.ai-factory'), { recursive: true });
    expect(readAif(TMP)).toBeNull();
  });
});
