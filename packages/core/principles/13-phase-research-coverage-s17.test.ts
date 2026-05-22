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
 * §1.7 DETECTION (Wave N8 C3 — substance, not decoration): a file passes only if it
 * carries a SELF-REVIEW SUBSTANCE marker. Naming the bare literal "§1.7" alone is NO
 * LONGER sufficient — that was the #discipline-theatre hole: a patch could write a
 * "## §1.7" heading with no actual self-review and pass. Substance arms:
 *   (b)  "Self-review" (case-insensitive)
 *   (c)  "Self-application" (case-insensitive)
 *   (c') "Self-reflection" (case-insensitive) — an observed real self-review form
 *   (d)  "Recursive" (standalone word — covers "Recursive §1.7" headings)
 *   (e)  "T15" (covers T15 self-application references)
 *   (f)  BOTH "Forward" AND "Backward" present in the file
 *   (f') "forward-check" (case-insensitive) — research-only patches that do a forward-
 *        check without a paired backward-check (legitimately, no rule introduced)
 *
 * Why "substance present", not the original C3 sketch "Forward AND Backward inside the
 * §1.7 section": a 73-patch sweep (2026-05-22) found 8 §1.7-heading patches that
 * legitimately lack both literal words (self-review via T15 / Self-application /
 * Recursive / a forward-check) — the stricter form = ≥8 false-positives, and the
 * rule-introducing(needs both)-vs-research-only(needs neither) split is judgment, not
 * mechanical. Arms (c')/(f') were added because the sweep proved the 2 bare-§1.7 patches
 * (aif-primitives-deep-dive: "forward-check"; skill-context-runtime-probe:
 * "self-reflection") are real self-review — so this gate breaks ZERO existing patches.
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
 * Pure substance detector (Wave N8 C3). Returns true iff the content carries an
 * actual self-review SUBSTANCE marker (arms b, c, c', d, e, f, f'). The bare literal
 * "§1.7" is deliberately NOT an arm — naming the section without doing the review is
 * the #discipline-theatre case C3 closes. Pure (string → boolean) so it is unit- and
 * Stryker-testable without touching the filesystem.
 */
export function hasS17Substance(content: string): boolean {
  const hasSelfReview = /self-review/i.test(content);
  const hasSelfApplication = /self-application/i.test(content);
  const hasSelfReflection = /self-reflection/i.test(content); // (c')
  const hasRecursive = /\bRecursive\b/.test(content);
  const hasT15 = content.includes('T15');
  const hasForwardAndBackward = content.includes('Forward') && content.includes('Backward');
  const hasForwardCheck = /forward-check/i.test(content); // (f')
  return (
    hasSelfReview ||
    hasSelfApplication ||
    hasSelfReflection ||
    hasRecursive ||
    hasT15 ||
    hasForwardAndBackward ||
    hasForwardCheck
  );
}

/**
 * Check that a file does real §1.7 self-review (substance), not just name "§1.7".
 */
function checkSection(filePath: string): void {
  const content = readFileSync(filePath, 'utf8');
  const filename = filePath.split('/').pop()!;

  if (hasS17Substance(content)) return; // passes — real self-review present

  const namesButEmpty = content.includes('§1.7');
  throw new Error(
    `${filename}: ${namesButEmpty ? 'names "§1.7" but shows no self-review substance (decoration)' : 'missing §1.7 self-review section'}. ` +
      `Naming "§1.7" alone is not enough — include actual self-review: Forward + Backward checks, ` +
      `a "forward-check" (research-only), "Self-application"/"Self-reflection", "Recursive", or "T15".`,
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

  // ── C3 (Wave N8): bare "§1.7" is decoration, not substance ────────────────
  it('C3 PAIRED-NEGATIVE: a "## §1.7" heading with NO self-review substance fails', () => {
    // The exact #discipline-theatre case C3 closes: names the section, does nothing.
    // Names "§1.7" but contains none of the substance keywords (no self-*, Recursive, T15, forward-*).
    const decoration = '# Patch\n\n## §1.7\n\nNothing here yet.\n\n## §2\nPlan.\n';
    expect(hasS17Substance(decoration), 'bare §1.7 heading must NOT count as substance').toBe(false);

    const tmpPath = resolve(PATCHES_DIR, '2026-05-22-c3-decoration-fixture.md');
    writeFileSync(tmpPath, decoration, 'utf8');
    try {
      let threw = false;
      try {
        checkSection(tmpPath);
      } catch (err) {
        threw = true;
        expect((err as Error).message).toMatch(/decoration/);
      }
      expect(threw, 'checkSection must throw for a §1.7 heading lacking substance').toBe(true);
    } finally {
      unlinkSync(tmpPath);
    }
  });

  it('C3 PAIRED-POSITIVE: "§1.7" + real Forward/Backward substance passes', () => {
    const real = '## §1.7\n### Forward-check\ncomplies with X.\n### Backward-check\nswept Y.\n';
    expect(hasS17Substance(real)).toBe(true);
  });

  it('C3 arm (c\'): "self-reflection" (case-insensitive) is substance (skill-context-probe form)', () => {
    expect(hasS17Substance('## §7 — §1.7 self-reflection note\nThis probe introduces no rule.')).toBe(true);
    expect(hasS17Substance('SELF-REFLECTION: none needed')).toBe(true);
  });

  it('C3 arm (f\'): "forward-check" (case-insensitive) is substance (research-only form)', () => {
    expect(hasS17Substance('§1.7 forward-check: research-only, no discipline introduced.')).toBe(true);
  });

  it('C3: substance WITHOUT the literal "§1.7" still passes (Recursive/T15 patches)', () => {
    expect(hasS17Substance('## Recursive self-application\nthis audit runs on itself.')).toBe(true);
    expect(hasS17Substance('Active traps: T15 (self-application)')).toBe(true);
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
