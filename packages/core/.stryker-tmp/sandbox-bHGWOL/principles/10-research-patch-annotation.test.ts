/**
 * Principle 10 — Research patch scope annotation invariant
 *
 * Source: docs/meta-factory/prior-art-evaluations.md#29 (ADAPT verdict)
 *         docs/meta-factory/research-patches/2026-05-11-aif-handoff-overlap-analysis.md
 *
 * Invariant: every research patch file in docs/meta-factory/research-patches/
 * (except README.md) must have a machine-parseable <!-- scope:<slug> --> comment
 * as its first line. This enables automated §1.6 trigger sweep via grep instead
 * of prose-level filename pattern matching.
 *
 * Adapts AIF `<!-- handoff:task:<id> -->` first-line plan annotation pattern
 * (SSOT #29) for research patch scope classification.
 */
// @ts-nocheck

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PATCHES_DIR = resolve(HERE, '../../../docs/meta-factory/research-patches');

const SCOPE_ANNOTATION_RE = /^<!-- scope:[a-zA-Z0-9.§-]+ -->$/;

function getPatchFiles(): string[] {
  return readdirSync(PATCHES_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => resolve(PATCHES_DIR, f))
    .sort();
}

function checkAnnotation(filePath: string): void {
  const content = readFileSync(filePath, 'utf8');
  const firstLine = content.split('\n')[0] ?? '';
  if (!SCOPE_ANNOTATION_RE.test(firstLine)) {
    const filename = filePath.split('/').pop()!;
    throw new Error(
      `${filename}: missing or malformed <!-- scope:... --> annotation on first line (got: ${JSON.stringify(firstLine)})`,
    );
  }
}

describe('Principle 10 — every research patch has <!-- scope:<slug> --> on first line', () => {
  it('all patch files carry a valid scope annotation', () => {
    const files = getPatchFiles();
    expect(files.length, 'expected at least one research patch file').toBeGreaterThan(0);

    const violations: string[] = [];
    for (const f of files) {
      try {
        checkAnnotation(f);
      } catch (err) {
        violations.push((err as Error).message);
      }
    }
    expect(violations, `Violations:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('README.md is excluded from the annotation requirement', () => {
    const files = getPatchFiles();
    const fileNames = files.map((f) => f.split('/').pop()!);
    expect(fileNames).not.toContain('README.md');
  });

  it('fails when annotation is missing (anti-tautology mutation)', () => {
    const files = getPatchFiles();
    expect(files.length, 'need at least one patch file for mutation test').toBeGreaterThan(0);
    const firstFile = files[0];
    const content = readFileSync(firstFile, 'utf8');
    const withoutFirstLine = content.split('\n').slice(1).join('\n');
    const firstLineOfRemainder = withoutFirstLine.split('\n')[0] ?? '';
    expect(SCOPE_ANNOTATION_RE.test(firstLineOfRemainder)).toBe(false);
  });

  it('fails when annotation is malformed (anti-tautology mutation)', () => {
    const malformed = '<!-- scope: has spaces -->\n# Content';
    const firstLine = malformed.split('\n')[0] ?? '';
    expect(SCOPE_ANNOTATION_RE.test(firstLine)).toBe(false);
  });

  it('positive: well-formed annotations pass the regex', () => {
    for (const slug of ['phase-8.8', '§13.21', 'wave-7', 'methodology', 'aif-handoff-mandate']) {
      expect(SCOPE_ANNOTATION_RE.test(`<!-- scope:${slug} -->`)).toBe(true);
    }
  });
});
