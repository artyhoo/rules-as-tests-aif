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
 *
 * Sub-wave 7.1.c: logic extracted to 09-doc-authority-hierarchy.ts for
 * changed-files mode (pre-push hook + harness-hook PostToolUse).
 * No behavioural change to existing tests.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REQUIRED_HEADER_DOCS,
  EXEMPT_PATTERNS,
  isExempt,
  hasAuthorityHeader,
  checkDocsHaveAuthorityHeader,
} from './09-doc-authority-hierarchy.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

describe('Principle 9 — every authority-bearing doc declares Authoritative-for header', () => {
  it('all required-header docs declare Authoritative-for', () => {
    const result = checkDocsHaveAuthorityHeader(
      REQUIRED_HEADER_DOCS as string[],
      REPO_ROOT,
    );
    expect(
      result.violations,
      `Doc-authority violations:\n${result.violations.map((v) => `${v.path}: ${v.reason}`).join('\n')}`,
    ).toHaveLength(0);
  });

  it('mutation: doc without authority header fails check (anti-tautology)', () => {
    const fake = '# Fake doc\n\nSome content without authority header.\n';
    expect(hasAuthorityHeader(fake)).toBe(false);
  });

  it('mutation: example-only header inside fenced code block does NOT count as compliant', () => {
    const fakeWithExampleOnly =
      '# Doc title\n\nProse without real header.\n\n```markdown\n# Example\n\n> **Authoritative for:** illustrative example only\n```\n\nMore prose.\n';
    expect(hasAuthorityHeader(fakeWithExampleOnly)).toBe(false);
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

  // §13.21 Wave 2 — exemption mechanism for fixture files intentionally lacking
  // Authoritative-for header. Anti-tautology pair: positive proves exemption
  // works; mutation proves exemption is the only reason a missing header is
  // not flagged (i.e. the rule's failure detection still functions outside the
  // exempt scope).
  it('positive: file under exempt glob is recognised as exempt', () => {
    expect(isExempt('packages/core/research/fixtures/drift/with-drift/skills/rules-as-tests/SKILL.md')).toBe(true);
    expect(isExempt('packages/core/detector/fixtures/with-aif/.ai-factory/ARCHITECTURE.md')).toBe(true);
  });

  it('positive: file outside exempt glob is NOT exempt (negative case)', () => {
    expect(isExempt('packages/core/templates/shared/AGENTS.md.template')).toBe(false);
    expect(isExempt('agents/best-practices-sidecar.md')).toBe(false);
    expect(isExempt('docs/meta-factory/EXECUTION-PLAN.md')).toBe(false);
    expect(isExempt('packages/preset-next-15-canonical/RULES.md')).toBe(false);
  });

  it('mutation: removing exemption would flag a real fixture without authority header', () => {
    // Anti-tautology: proves the rule's failure-detection works outside the
    // exempt scope. Pick a fixture path that matches the exempt glob — if its
    // file exists and lacks a header, exemption is the only reason it does
    // not appear in the canonical violations list.
    const fixtureRel = 'packages/core/research/fixtures/drift/with-drift/skills/rules-as-tests/SKILL.md';
    const fullPath = resolve(REPO_ROOT, fixtureRel);
    if (!existsSync(fullPath)) return; // skip if fixture relocated; sentinel-only assertion
    const content = readFileSync(fullPath, 'utf8');
    expect(hasAuthorityHeader(content)).toBe(false); // confirms fixture truly lacks header
    expect(isExempt(fixtureRel)).toBe(true); // confirms exemption is what hides it from violations
    // With exemption active, checkDocsHaveAuthorityHeader skips it → no violation
    const result = checkDocsHaveAuthorityHeader([fixtureRel], REPO_ROOT);
    expect(result.violations).toHaveLength(0);
  });

  // §13.21 Wave 4 / M1 — drift detection between install.sh SHIPPED_DOCS and
  // the Wave 2 subset of REQUIRED_HEADER_DOCS (paths under packages/core/
  // templates/shared/, packages/preset-next-15-canonical/, agents/). Both
  // lists must remain identical: install.sh is the release-time check,
  // principle 09 is the PR-time check; drift between them defeats Wave 3's
  // purpose (catching header drift between PR-side and release-time copy).
  it('§13.21 Wave 4 — install.sh SHIPPED_DOCS matches Wave 2 subset of REQUIRED_HEADER_DOCS', () => {
    const installShPath = resolve(REPO_ROOT, 'install.sh');
    expect(existsSync(installShPath)).toBe(true);
    const installSh = readFileSync(installShPath, 'utf8');

    const arrayMatch = installSh.match(/SHIPPED_DOCS=\(\s*([\s\S]*?)\s*\)/);
    expect(arrayMatch, 'install.sh: SHIPPED_DOCS array not found').not.toBeNull();
    const installShipped = arrayMatch![1]
      .split('\n')
      .map((line) => {
        const stripped = line.replace(/^\s*#.*$/, '').trim();
        const m = stripped.match(/^"([^"]+)"$/);
        return m ? m[1] : '';
      })
      .filter(Boolean);

    const WAVE_2_PREFIXES = [
      'packages/core/templates/shared/',
      'packages/preset-next-15-canonical/',
      'agents/',
    ];
    const wave2Subset = REQUIRED_HEADER_DOCS.filter((p) =>
      WAVE_2_PREFIXES.some((pref) => p.startsWith(pref)),
    );

    expect(installShipped).toHaveLength(11);
    expect(new Set(installShipped)).toEqual(new Set(wave2Subset));
  });

  // 7.1.c — changed-files mode API smoke tests (positive + mutation pair)
  it('checkDocsHaveAuthorityHeader: ok:true for valid compliant path', () => {
    const result = checkDocsHaveAuthorityHeader(['README.md'], REPO_ROOT);
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('checkDocsHaveAuthorityHeader: violation for non-existent path', () => {
    const result = checkDocsHaveAuthorityHeader(['does-not-exist.md'], REPO_ROOT);
    expect(result.ok).toBe(false);
    expect(result.violations[0]?.reason).toContain('does not exist');
  });

  it('EXEMPT_PATTERNS exported and matches known fixture paths', () => {
    expect(EXEMPT_PATTERNS.length).toBeGreaterThan(0);
    expect(
      EXEMPT_PATTERNS.some((re) =>
        re.test('packages/core/research/fixtures/drift/with-drift/skills/rules-as-tests/SKILL.md'),
      ),
    ).toBe(true);
  });
});
