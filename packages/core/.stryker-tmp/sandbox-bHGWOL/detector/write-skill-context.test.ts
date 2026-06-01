// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectStack } from './index.ts';
import { writeSkillContext, TOP_SKILLS } from './write-skill-context.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const TMP = resolve(HERE, '../../..', '.tmp-detector-emit-test');

describe('writeSkillContext — emit 3 top-skill SKILL.md files', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('emits SKILL.md for aif-fix, aif-implement, aif-architecture', () => {
    const result = detectStack(resolve(HERE, 'fixtures', 'next-16'));
    const written = writeSkillContext(TMP, result);
    expect(written).toHaveLength(3);
    for (const skill of TOP_SKILLS) {
      const file = resolve(TMP, skill, 'SKILL.md');
      expect(existsSync(file)).toBe(true);
    }
  });

  it('schema validation: each SKILL.md starts with the canonical "# <skill> — project-level overrides" heading (per Task 6 verify probe)', () => {
    const result = detectStack(resolve(HERE, 'fixtures', 'next-16'));
    writeSkillContext(TMP, result);
    for (const skill of TOP_SKILLS) {
      const content = readFileSync(resolve(TMP, skill, 'SKILL.md'), 'utf8');
      const firstLine = content.split('\n', 1)[0];
      expect(firstLine).toBe(`# ${skill} — project-level overrides`);
    }
  });

  it('embeds detection result fields (stack, framework name + major, source, confidence)', () => {
    const result = detectStack(resolve(HERE, 'fixtures', 'next-16'));
    writeSkillContext(TMP, result);
    const content = readFileSync(resolve(TMP, 'aif-fix', 'SKILL.md'), 'utf8');
    expect(content).toContain('Stack:** react-next');
    expect(content).toContain('Framework:** next');
    expect(content).toContain('major: 16');
    expect(content).toContain('Detection source:** `package.json`');
    expect(content).toContain('Confidence:** medium');
  });

  it('handles ts-server result (framework.name=null) gracefully — no "null"/"undefined" leaks in output', () => {
    const result = detectStack(resolve(HERE, 'fixtures', 'ts-server'));
    writeSkillContext(TMP, result);
    const content = readFileSync(resolve(TMP, 'aif-implement', 'SKILL.md'), 'utf8');
    expect(content).not.toMatch(/\bnull\b/);
    expect(content).not.toMatch(/\bundefined\b/);
    expect(content).toContain('Framework:** unknown');
  });

  it('idempotent: emitting twice produces identical output (no stale artifacts, no diff)', () => {
    const result = detectStack(resolve(HERE, 'fixtures', 'next-16'));
    writeSkillContext(TMP, result);
    const first = readFileSync(resolve(TMP, 'aif-fix', 'SKILL.md'), 'utf8');
    writeSkillContext(TMP, result);
    const second = readFileSync(resolve(TMP, 'aif-fix', 'SKILL.md'), 'utf8');
    expect(first).toBe(second);
  });
});
