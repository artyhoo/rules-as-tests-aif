/**
 * Principle 12 — ai-laziness-traps kickoff citation enforcement
 *
 * Source: .claude/rules/ai-laziness-traps.md §3 (kickoff-author obligations)
 *         docs/meta-factory/research-patches/2026-05-16-prose-rules-audit-research.md §3.1
 *         (Track 3 evidence-based probe confirming BUILD verdict; principle 10 precedent)
 *
 * Invariant: every kickoff.md file under .claude/orchestrator-prompts/<dir>/
 * (excluding pre-rule exempt dirs) must satisfy the COMPOUND CITATION CHECK:
 * at least ONE of the following must be present —
 *   (a) string "ai-laziness-traps" anywhere in the file (explicit rule citation)
 *   (b) pattern **T\d+** (bold Markdown T-number reference)
 *   (c) "Active traps" or "Active.*T\d+" section header
 *   (d) domain-specific T-label pattern "T-[A-Z]+-[A-Z]"
 *
 * A file that fails ALL four checks is a §3 violation: it names no traps and
 * cites no rule — equivalent to the #trap-catalogue-blanket-reference anti-pattern
 * (treating the catalogue as decoration rather than discipline).
 *
 * EXEMPT_LIST: kickoffs created before 2026-05-12 (when ai-laziness-traps.md
 * was added). No git dates available (files are gitignored); exemption is
 * maintained as an explicit list rather than a date filter.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const KICKOFFS_DIR = resolve(REPO_ROOT, '.claude/orchestrator-prompts');

/**
 * Pre-rule kickoffs (created before 2026-05-12, when ai-laziness-traps.md was added).
 * These dirs have inline T-refs but lack an explicit rule citation — pre-dates the
 * obligation. Maintained as an allowlist; must grow only with documented rationale.
 */
const EXEMPT_LIST: readonly string[] = ['aif-ssot-corrections'];

// Compound citation check — returns true if ANY of (a)(b)(c)(d) is present.
const RULE_CITATION_RE = /ai-laziness-traps/;
const BOLD_TNUM_RE = /\*\*T\d+/;
const ACTIVE_TRAPS_RE = /Active[^\n]*T\d+/;
const DOMAIN_TNUM_RE = /T-[A-Z][A-Z0-9]*-[A-Z0-9]/;

function passesCompoundCheck(content: string): boolean {
  return (
    RULE_CITATION_RE.test(content) ||
    BOLD_TNUM_RE.test(content) ||
    ACTIVE_TRAPS_RE.test(content) ||
    DOMAIN_TNUM_RE.test(content)
  );
}

interface KickoffEntry {
  dir: string;
  path: string;
}

function getKickoffEntries(): KickoffEntry[] {
  if (!existsSync(KICKOFFS_DIR)) return [];
  return readdirSync(KICKOFFS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({
      dir: e.name,
      path: resolve(KICKOFFS_DIR, e.name, 'kickoff.md'),
    }))
    .filter((e) => existsSync(e.path))
    .sort((a, b) => a.dir.localeCompare(b.dir));
}

function getNonExemptEntries(): KickoffEntry[] {
  return getKickoffEntries().filter((e) => !EXEMPT_LIST.includes(e.dir));
}

// KICKOFFS_DIR is gitignored — only present in local dev, absent in CI.
// Tests that require actual kickoff files skip in CI; pure-logic tests always run.
const KICKOFFS_AVAILABLE = existsSync(KICKOFFS_DIR) && getKickoffEntries().length > 0;

describe('Principle 12 — every kickoff.md cites ai-laziness-traps rule', () => {
  it.skipIf(!KICKOFFS_AVAILABLE)(
    'all non-exempt kickoffs satisfy the compound citation check',
    () => {
      const entries = getNonExemptEntries();
      const violations: string[] = [];
      for (const { dir, path } of entries) {
        const content = readFileSync(path, 'utf8');
        if (!passesCompoundCheck(content)) {
          violations.push(dir);
        }
      }
      expect(
        violations,
        `Kickoffs missing ai-laziness-traps citation AND T-number references:\n${violations.join('\n')}`,
      ).toHaveLength(0);
    },
  );

  it.skipIf(!KICKOFFS_AVAILABLE)(
    'positive: exempt dirs ARE present in the kickoff list (non-empty exempt guard)',
    () => {
      // Guards against accidental zero-file exemption list or missing dirs.
      // If exempt dirs disappear, they no longer need exemption — remove from EXEMPT_LIST.
      const allDirs = getKickoffEntries().map((e) => e.dir);
      for (const exemptDir of EXEMPT_LIST) {
        expect(
          allDirs,
          `Exempt dir '${exemptDir}' is not in kickoffs — it was exempted but now absent. Remove from EXEMPT_LIST.`,
        ).toContain(exemptDir);
      }
    },
  );

  it.skipIf(!KICKOFFS_AVAILABLE)(
    'anti-tautology: compliant kickoff stripped of citations fails the check',
    () => {
      // Pick the first compliant kickoff and strip all citation markers.
      // Verifies that the check actually detects absence — not always-true.
      const entries = getNonExemptEntries();
      const compliant = entries.find(({ path }) =>
        passesCompoundCheck(readFileSync(path, 'utf8')),
      );
      expect(compliant, 'expected at least one compliant kickoff to mutate').toBeDefined();

      const original = readFileSync(compliant!.path, 'utf8');
      // Mutate: strip every citation marker the compound check looks for.
      const stripped = original
        .replace(/ai-laziness-traps/g, 'REDACTED')
        .replace(/\*\*T\d+/g, '**REDACTED')
        .replace(/Active[^\n]*T\d+/g, 'Active traps: REDACTED')
        .replace(/T-[A-Z]+-[A-Z]/g, 'REDACTED');

      expect(
        passesCompoundCheck(stripped),
        'stripped content should FAIL the compound check (anti-tautology)',
      ).toBe(false);
    },
  );

  it('anti-tautology: blank file fails compound check', () => {
    expect(passesCompoundCheck('')).toBe(false);
    expect(passesCompoundCheck('# Kickoff\n\nSome plan without citations.')).toBe(false);
  });

  it('positive: each citation pattern individually satisfies compound check', () => {
    // Verify all four arms of the compound check independently.
    expect(passesCompoundCheck('See .claude/rules/ai-laziness-traps.md §2')).toBe(true);
    expect(passesCompoundCheck('Active traps: **T1**, **T3**, **T7**')).toBe(true);
    expect(passesCompoundCheck('Active traps for this R-phase: T1, T3, T7')).toBe(true);
    expect(passesCompoundCheck('Domain trap: T-WAVE9-A captures specific failure')).toBe(true);
  });

  it.skipIf(!KICKOFFS_AVAILABLE)(
    'population sentinel — catches accidental empty-out or explosion of kickoff dirs',
    () => {
      const all = getKickoffEntries();
      // Loose bounds: at least 10 kickoffs, at most 100.
      // If count drops to 0, the main test would pass vacuously — sentinel prevents it.
      expect(all.length).toBeGreaterThanOrEqual(10);
      expect(all.length).toBeLessThanOrEqual(100);
    },
  );
});
