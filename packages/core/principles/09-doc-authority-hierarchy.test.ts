/**
 * Principle 9 — Doc authority hierarchy (every authority-bearing doc declares Authoritative-for)
 *
 * Source: .claude/rules/doc-authority-hierarchy.md (added 2026-05-09 after
 *         goal-hierarchy restructure incident).
 *
 * Invariant: every doc designated by the rule §2 "Required for" or "Folder-
 * level authority" categories carries an explicit "> **Authoritative for:**"
 * header at the top. Filename-convention category (PHASE-*-PROMPT.md, phase-*-
 * research.md) is exempt — filename itself establishes scope.
 *
 * Why this exists: 2026-05-09 incident where docs/meta-factory/EXECUTION-PLAN.md
 * §1 silently re-defined the project goal as "recursive self-application is
 * north star", overriding README.md#why-this-exists. The drift went uncaught
 * for months because the project had code-level discipline (R1-R20, principles
 * 01-08, build-vs-reuse SSOT, search-coverage rule) but no doc-authority
 * discipline. Per arxiv:2505.02709, AI agents drift via pattern-matching on
 * authoritative-language in context, not via token-distance forgetting — so
 * structural authority declarations matter for AI-driven workflows.
 *
 * Mirrors principle 08 (prior-art-cited) test structure: positive + mutation
 * (anti-tautology) + sentinel for catalog stability.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

const AUTHORITY_HEADER_RE = /> \*\*Authoritative for:\*\*/;

/**
 * Canonical list of authority-bearing docs per `.claude/rules/doc-authority-
 * hierarchy.md` §2 "Required for" + "Folder-level authority" categories.
 *
 * Filename-convention category (PHASE-*-PROMPT.md, phase-*-research.md) is
 * intentionally NOT enumerated — those derive scope from filename pattern.
 *
 * When updating this list, also update the rule's §2 to match (drift sentinel
 * test below catches list-shape changes; semantic alignment with the rule is
 * the maintainer's responsibility).
 */
const REQUIRED_HEADER_DOCS = [
  // Project-root docs
  'README.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'INSTALL.md',
  'INSTALL-FOR-AI.md',

  // Hot operational
  '.claude/session-bootstrap.md',
  '.claude/rules/phase-research-coverage.md',
  '.claude/rules/doc-authority-hierarchy.md',

  // docs/meta-factory/ reference docs (excluding sub-folders + filename-convention transients)
  'docs/meta-factory/EXECUTION-PLAN.md',
  'docs/meta-factory/PROPOSAL.md',
  'docs/meta-factory/architecture.md',
  'docs/meta-factory/self-application.md',
  'docs/meta-factory/principles-as-tests.md',
  'docs/meta-factory/aif-comparison.md',
  'docs/meta-factory/open-questions.md',
  'docs/meta-factory/prior-art-evaluations.md',
  'docs/meta-factory/acceptance-tests.md',
  'docs/meta-factory/core-stability.md',
  'docs/meta-factory/failure-modes.md',
  'docs/meta-factory/migration-from-current.md',
  'docs/meta-factory/niche-stacks.md',
  'docs/meta-factory/risks.md',
  'docs/meta-factory/roadmap.md',
  'docs/meta-factory/versioning-and-locks.md',
  'docs/meta-factory/self-diagnostics-design.md',

  // Folder-level READMEs (sub-folder authority covers individual files)
  'docs/meta-factory/retros/README.md',
  'docs/meta-factory/research-patches/README.md',

  // skills/ — primary doc + cold references
  'skills/rules-as-tests/SKILL.md',
  'skills/rules-as-tests/references/ai-traps.md',
  'skills/rules-as-tests/references/checks-map.md',
  'skills/rules-as-tests/references/doc-organization.md',
  'skills/rules-as-tests/references/overview.md',
  'skills/rules-as-tests/references/self-testing-docs.md',
];

function readFile(p: string): string {
  return readFileSync(p, 'utf8');
}

function hasAuthorityHeader(content: string): boolean {
  return AUTHORITY_HEADER_RE.test(content);
}

describe('Principle 9 — every authority-bearing doc declares Authoritative-for header', () => {
  it('all required-header docs declare Authoritative-for', () => {
    const violations: string[] = [];
    for (const relPath of REQUIRED_HEADER_DOCS) {
      const fullPath = resolve(REPO_ROOT, relPath);
      if (!existsSync(fullPath)) {
        violations.push(`${relPath}: file does not exist`);
        continue;
      }
      const content = readFile(fullPath);
      if (!hasAuthorityHeader(content)) {
        violations.push(
          `${relPath}: missing "> **Authoritative for:**" header — see .claude/rules/doc-authority-hierarchy.md §3 for format`,
        );
      }
    }
    expect(
      violations,
      `Doc-authority violations:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('mutation: doc without authority header fails check (anti-tautology)', () => {
    const fake = '# Fake doc\n\nSome content without authority header.\n';
    expect(hasAuthorityHeader(fake)).toBe(false);
  });

  it('positive: doc with valid authority header passes check', () => {
    const valid =
      '# Doc title\n\n> **Authoritative for:** something specific.\n> **NOT authoritative for:** project goal — see README.md.\n\nContent.\n';
    expect(hasAuthorityHeader(valid)).toBe(true);
  });

  it('header check is case-sensitive (matches exact format from rule §3)', () => {
    const lowercase = '# Doc\n\n> **authoritative for:** something\n';
    expect(hasAuthorityHeader(lowercase)).toBe(false);
  });

  it('header check requires bold formatting (Markdown blockquote with **)', () => {
    const noBold = '# Doc\n\n> Authoritative for: something\n';
    expect(hasAuthorityHeader(noBold)).toBe(false);
  });

  it('canonical list shape sentinel — catches accidental empty-out / explosion', () => {
    // Drift sentinel: catches if someone deletes the canonical list (would
    // otherwise pass vacuously) or accidentally explodes it. Semantic alignment
    // with rule §2 is the maintainer's responsibility on each list update.
    expect(REQUIRED_HEADER_DOCS.length).toBeGreaterThanOrEqual(20);
    expect(REQUIRED_HEADER_DOCS.length).toBeLessThanOrEqual(60);
    // Canonical roots must always be present
    expect(REQUIRED_HEADER_DOCS).toContain('README.md');
    expect(REQUIRED_HEADER_DOCS).toContain('CLAUDE.md');
    expect(REQUIRED_HEADER_DOCS).toContain('.claude/session-bootstrap.md');
    expect(REQUIRED_HEADER_DOCS).toContain(
      'docs/meta-factory/EXECUTION-PLAN.md',
    );
  });
});
