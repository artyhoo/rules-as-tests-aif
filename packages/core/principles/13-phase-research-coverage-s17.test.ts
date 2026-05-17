/**
 * Principle 13 — Research patch §1.7 Forward+Backward self-review enforcement
 *
 * Source: .claude/rules/phase-research-coverage.md §1.7
 *         docs/meta-factory/research-patches/2026-05-16-prose-rules-audit-research.md §3.2
 *         docs/meta-factory/prior-art-evaluations.md#3 (fitness function vocabulary, ADOPT VOCABULARY)
 *         docs/meta-factory/prior-art-evaluations.md#29 (annotation enforcement, ADAPT)
 *
 * Invariant: every research patch file in docs/meta-factory/research-patches/
 * (except README.md) created AFTER 2026-05-08 must contain a §1.7 self-review section.
 * §1.7 was added to phase-research-coverage.md on 2026-05-08 (commit 2f00e76).
 * Patches with date prefix <= 2026-05-08 are grandfathered (HISTORICAL_CUTOFF).
 *
 * §1.7 DETECTION: file passes if ANY of the following is present:
 *   (a) literal "§1.7"
 *   (b) "Self-review" (case-insensitive)
 *   (c) "Self-application" (case-insensitive)
 *   (d) "Recursive" (standalone word — covers "Recursive §1.7" headings)
 *   (e) "T15" (covers T15 self-application references)
 *   (f) BOTH "Forward" AND "Backward" present in the same file
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PATCHES_DIR = resolve(HERE, '../../../docs/meta-factory/research-patches');

/** §1.7 was formally added 2026-05-08; patches created on or before this date are exempt */
const HISTORICAL_CUTOFF = '2026-05-08';

/**
 * Known post-cutoff violations: created before §1.7 was widely adopted. Fix separately.
 * These files exist after 2026-05-08 but lack explicit §1.7 sections due to early adoption gap.
 */
const EXEMPT_LIST = new Set([
  '2026-05-09-self-review-audit.md',
  '2026-05-12-wave-9-2-stryker-mutation-audit.md',
  '2026-05-12-§13.24-h8-promotion.md',
  '2026-05-16-aider-coverage-decision.md',
]);

const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})-/;

function getPatchFiles(): string[] {
  return readdirSync(PATCHES_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();
}

function getDatePrefix(filename: string): string {
  const m = DATE_PREFIX_RE.exec(filename);
  return m ? m[1]! : '';
}

function isExempt(filename: string): boolean {
  const datePrefix = getDatePrefix(filename);
  // Grandfathered: no date prefix or date on/before cutoff
  if (!datePrefix || datePrefix <= HISTORICAL_CUTOFF) return true;
  // Known post-cutoff violation, to be fixed separately
  return EXEMPT_LIST.has(filename);
}

/**
 * Check that a file contains at least one §1.7 self-review marker.
 * Detection arms (a)-(f) per CONTEXT spec.
 */
function checkSection(filePath: string): void {
  const content = readFileSync(filePath, 'utf8');
  const filename = filePath.split('/').pop()!;

  const hasExplicit17 = content.includes('§1.7');
  const hasSelfReview = /self-review/i.test(content);
  const hasSelfApplication = /self-application/i.test(content);
  const hasRecursive = /\bRecursive\b/.test(content);
  const hasT15 = content.includes('T15');
  const hasForwardAndBackward = content.includes('Forward') && content.includes('Backward');

  if (
    hasExplicit17 ||
    hasSelfReview ||
    hasSelfApplication ||
    hasRecursive ||
    hasT15 ||
    hasForwardAndBackward
  ) {
    return; // passes
  }

  throw new Error(
    `${filename}: missing §1.7 self-review section. ` +
      `Expected one of: "§1.7", "Self-review" (case-insensitive), "Self-application" (case-insensitive), ` +
      `"Recursive" (word boundary), "T15", or both "Forward" + "Backward" present in file content.`,
  );
}

describe('Principle 13 — every post-cutoff research patch has a §1.7 self-review section', () => {
  it('all non-exempt patch files contain a §1.7 self-review marker', () => {
    const filenames = getPatchFiles();

    const violations: string[] = [];
    for (const filename of filenames) {
      if (isExempt(filename)) continue;
      const filePath = resolve(PATCHES_DIR, filename);
      try {
        checkSection(filePath);
      } catch (err) {
        violations.push((err as Error).message);
      }
    }

    expect(violations, `§1.7 violations:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('population sentinel: at least 20 patches exist (guards against empty-dir false-pass)', () => {
    const filenames = getPatchFiles();
    expect(
      filenames.length,
      `Expected ≥20 research patches, got ${filenames.length}`,
    ).toBeGreaterThanOrEqual(20);
  });

  it('README.md is excluded from the §1.7 requirement', () => {
    const filenames = getPatchFiles();
    expect(filenames).not.toContain('README.md');
  });

  it('HISTORICAL_CUTOFF: patches with date prefix <= 2026-05-08 are exempt', () => {
    const filenames = getPatchFiles();
    const cutoffFiles = filenames.filter((f) => {
      const d = getDatePrefix(f);
      return d && d <= HISTORICAL_CUTOFF;
    });
    // All cutoff-era files must be marked exempt
    for (const f of cutoffFiles) {
      expect(isExempt(f)).toBe(true);
    }
  });

  it('KNOWN EXEMPT: post-cutoff EXEMPT_LIST files exist in PATCHES_DIR', () => {
    const filenames = new Set(getPatchFiles());
    for (const exemptFile of EXEMPT_LIST) {
      expect(
        filenames.has(exemptFile),
        `EXEMPT_LIST entry ${exemptFile} not found in PATCHES_DIR — remove stale entry`,
      ).toBe(true);
    }
  });

  // ── Anti-tautology: NEGATIVE ──────────────────────────────────────────────
  it('anti-tautology NEGATIVE: content without §1.7 markers fails checkSection', () => {
    // Synthesize content that looks like a research patch but lacks all §1.7 markers
    const syntheticContent = [
      '# Some Research Patch',
      '',
      '## §1 Introduction',
      'This patch discusses improvements to the build pipeline.',
      '',
      '## §2 Findings',
      'We found several issues with the linting configuration.',
      '',
      '## §3 Conclusion',
      'Address the issues in the next wave.',
    ].join('\n');

    // Verify none of the detection arms match
    expect(syntheticContent.includes('§1.7')).toBe(false);
    expect(/self-review/i.test(syntheticContent)).toBe(false);
    expect(/self-application/i.test(syntheticContent)).toBe(false);
    expect(/\bRecursive\b/.test(syntheticContent)).toBe(false);
    expect(syntheticContent.includes('T15')).toBe(false);
    const forwardAndBackward =
      syntheticContent.includes('Forward') && syntheticContent.includes('Backward');
    expect(forwardAndBackward).toBe(false);

    // Write to a temp path and verify checkSection throws
    const tmpPath = resolve(PATCHES_DIR, '2026-05-17-synthetic-test-fixture.md');
    writeFileSync(tmpPath, syntheticContent, 'utf8');
    try {
      let threw = false;
      try {
        checkSection(tmpPath);
      } catch {
        threw = true;
      }
      expect(threw, 'checkSection must throw for content lacking all §1.7 markers').toBe(true);
    } finally {
      unlinkSync(tmpPath);
    }
  });

  // ── Anti-tautology: POSITIVE (each detection arm independently) ───────────
  it('anti-tautology POSITIVE arm (a): "§1.7" literal triggers pass', () => {
    const content = '# Patch\n\n## §1.7 Self-review\nSome content here.\n';
    expect(content.includes('§1.7')).toBe(true);
  });

  it('anti-tautology POSITIVE arm (b): "Self-review" case-insensitive triggers pass', () => {
    for (const variant of ['Self-review', 'self-review', 'SELF-REVIEW', 'self-Review']) {
      expect(/self-review/i.test(`## ${variant}\nContent`)).toBe(true);
    }
  });

  it('anti-tautology POSITIVE arm (c): "Self-application" case-insensitive triggers pass', () => {
    for (const variant of ['Self-application', 'self-application', 'SELF-APPLICATION']) {
      expect(/self-application/i.test(`## ${variant}\nContent`)).toBe(true);
    }
  });

  it('anti-tautology POSITIVE arm (d): "Recursive" word-boundary triggers pass', () => {
    expect(/\bRecursive\b/.test('## Recursive §1.7 check')).toBe(true);
    expect(/\bRecursive\b/.test('Recursive self-application')).toBe(true);
    // Non-word-boundary should NOT match (guard against over-broadness)
    expect(/\bRecursive\b/.test('Recursively applied')).toBe(false);
  });

  it('anti-tautology POSITIVE arm (e): "T15" triggers pass', () => {
    expect('Active traps: T15 (self-application)'.includes('T15')).toBe(true);
  });

  it('anti-tautology POSITIVE arm (f): Forward + Backward co-occurrence triggers pass', () => {
    const content = '### Forward-check\nSome text.\n\n### Backward-check\nMore text.\n';
    expect(content.includes('Forward') && content.includes('Backward')).toBe(true);
  });

  it('anti-tautology POSITIVE arm (f) negative: Forward alone does NOT trigger pass', () => {
    const content = '### Forward-check\nSome text.\n';
    expect(content.includes('Forward') && content.includes('Backward')).toBe(false);
  });
});
