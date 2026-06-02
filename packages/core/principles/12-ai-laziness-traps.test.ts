/**
 * Principle 12 — ai-laziness-traps kickoff citation enforcement
 *
 * Source: .claude/rules/ai-laziness-traps.md §3 (kickoff-author obligations)
 *         docs/meta-factory/research-patches/2026-05-16-prose-rules-audit-research.md §3.1
 *         (Track 3 evidence-based probe confirming BUILD verdict; principle 10 precedent)
 *
 * Invariant: every REAL (non-symlink) kickoff.md file under
 * .claude/orchestrator-prompts/<dir>/ (excluding pre-rule exempt dirs AND
 * coordination mirrors — symlinks into $CANON authored in another worktree, see
 * isCoordinationMirror) must satisfy the COMPOUND CITATION CHECK:
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
import { readFileSync, readdirSync, existsSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const KICKOFFS_DIR = resolve(REPO_ROOT, '.claude/orchestrator-prompts');

/**
 * Exempt kickoff dirs (allowlist; must grow only with documented rationale):
 *  - 'aif-ssot-corrections' — pre-rule kickoff (created before 2026-05-12, when
 *    ai-laziness-traps.md was added); has inline T-refs but no explicit rule citation.
 *
 * ('qloop-ux-probe' was exempted 2026-06-01 as a question-loop test fixture, then
 *  removed 2026-06-02 once the fixture dir was gone — a stale exempt entry that the
 *  §positive-guard test correctly flagged.)
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

/**
 * A "coordination mirror" is an umbrella whose kickoff.md is a SYMLINK into the
 * shared coordination store ($CANON), materialised locally by channel G
 * (.husky/post-checkout → scripts/link-coordination.sh). Such an umbrella was
 * authored in some other worktree and adopted into $CANON; its citation was (or
 * should have been) checked AT ITS AUTHORING worktree while its kickoff.md was a
 * real file. Re-checking every mirror in every worktree made this gate fail on
 * historical umbrellas the current worktree never wrote — the principle-12-vs-G
 * conflict. The citation check therefore runs only on REAL (non-symlink) kickoffs
 * = the ones locally authored / not-yet-adopted. The population sentinel, by
 * contrast, deliberately counts the FULL set (mirrors included) as a "mirror
 * present" guard. (maintainer-directed 2026-06-02)
 */
function isCoordinationMirror(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function getNonExemptEntries(): KickoffEntry[] {
  return getKickoffEntries()
    .filter((e) => !EXEMPT_LIST.includes(e.dir))
    .filter((e) => !isCoordinationMirror(e.path));
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
      // Bounds: ≥100 / ≤300. Raised 2026-06-02 (maintainer-directed) — the project
      // legitimately accumulated >100 umbrellas of history, mirrored locally by the
      // coordination-persistence channel (G), so the old ≤100 was a stale guess that
      // tripped every push. ≥100 doubles as a "mirror is present" guard; ≤300 still
      // catches a runaway glob. (If count drops to 0, the main test passes vacuously.)
      expect(all.length).toBeGreaterThanOrEqual(100);
      expect(all.length).toBeLessThanOrEqual(300);
    },
  );
});
