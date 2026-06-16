/**
 * Tests for checks/s17-pr-body.ts — §1.7 CI PR-body citation-existence gate.
 * Paired-negative is mandatory: a fabricated citation MUST fail L2; a resolving
 * citation MUST clear it (mutation arm). In-memory RepoFileReader, no fs/shell-out.
 */
import { describe, it, expect } from 'vitest';
import {
  extractSection,
  findCitations,
  looksLikeRepoPath,
  isSubstantiveLine,
  checkPrBodyCitations,
  type RepoFileReader,
} from './s17-pr-body.ts';

const BODY = [
  '### §1.7 Forward-check applied',
  'Checked packages/core/foo.ts:42 — compliant.',
  '',
  '### §1.7 Backward-check applied',
  'Swept docs/bar.md:7 and Node.js:18 prose.',
].join('\n');

describe('extractSection', () => {
  it('captures from heading to next ### (exclusive)', () => {
    const fwd = extractSection(BODY, '### §1.7 Forward-check applied');
    expect(fwd).toContain('packages/core/foo.ts:42');
    expect(fwd).not.toContain('docs/bar.md:7');
  });
  it('returns empty string when heading absent', () => {
    expect(extractSection(BODY, '### §1.7 Nonexistent')).toBe('');
  });
});

describe('findCitations', () => {
  it('extracts path + line from path.ext:line matches', () => {
    expect(findCitations('see packages/core/foo.ts:42 here')).toEqual([
      { raw: 'packages/core/foo.ts:42', path: 'packages/core/foo.ts', line: 42 },
    ]);
  });
  it('matches prose-shaped tokens too (Node.js:18)', () => {
    expect(findCitations('Node.js:18').map((c) => c.path)).toEqual(['Node.js']);
  });
  it('returns [] when no citation present', () => {
    expect(findCitations('no citations here')).toEqual([]);
  });
  it('strips leading markdown wrapper (backtick / paren / bracket) from the path', () => {
    // PR authors routinely wrap citations in inline-code: `path:line`.
    expect(findCitations('see `packages/core/foo.ts:42` here')).toEqual([
      { raw: 'packages/core/foo.ts:42', path: 'packages/core/foo.ts', line: 42 },
    ]);
    expect(findCitations('(docs/bar.md:7)').map((c) => c.path)).toEqual(['docs/bar.md']);
    expect(findCitations('[a/b.ts:3]').map((c) => c.path)).toEqual(['a/b.ts']);
  });
});

describe('looksLikeRepoPath', () => {
  it('true for slashed paths', () => {
    expect(looksLikeRepoPath('packages/core/foo.ts')).toBe(true);
    expect(looksLikeRepoPath('docs/README.md')).toBe(true);
  });
  it('false for bare filename (ambiguous — README.md, Node.js)', () => {
    // No slash → conservatively not flagged by L3; still counts toward L2.
    expect(looksLikeRepoPath('README.md')).toBe(false);
    expect(looksLikeRepoPath('Node.js')).toBe(false);
  });
});

describe('isSubstantiveLine', () => {
  it('true for a line with identifiers', () => {
    expect(isSubstantiveLine('  const x = 1;')).toBe(true);
  });
  it('false for blank', () => {
    expect(isSubstantiveLine('   ')).toBe(false);
  });
  it('false for brace/punctuation-only', () => {
    expect(isSubstantiveLine('  });')).toBe(false);
  });
});

// In-memory reader: map of path -> lines.
function reader(files: Record<string, string[]>): RepoFileReader {
  return { readLines: (p) => files[p] ?? null };
}

const FILES = {
  'packages/core/foo.ts': ['line1', 'const real = 1;', 'line3'],
  'docs/bar.md': ['# Title', '', 'body'],
};

function bodyWith(fwd: string, bwd: string): string {
  return [
    '### §1.7 Forward-check applied',
    fwd,
    '',
    '### §1.7 Backward-check applied',
    bwd,
  ].join('\n');
}

describe('checkPrBodyCitations — L2 block', () => {
  it('fabricated citation (resolves to nothing) → blocker in both sections', () => {
    const body = bodyWith('see nonexistent/x.ts:9 here', 'see nonexistent/y.ts:9 here');
    const { blockers } = checkPrBodyCitations(body, reader(FILES));
    expect(blockers.length).toBe(2);
  });

  it('PAIRED-NEGATIVE / mutation arm: a resolving citation must clear the blocker', () => {
    const body = bodyWith('packages/core/foo.ts:2 verified', 'docs/bar.md:1 swept');
    const { blockers } = checkPrBodyCitations(body, reader(FILES));
    expect(blockers).toEqual([]);
  });

  it('backtick-wrapped resolving citation clears the L2 blocker', () => {
    const body = bodyWith('see `packages/core/foo.ts:2` verified', 'and `docs/bar.md:1` swept');
    const { blockers } = checkPrBodyCitations(body, reader(FILES));
    expect(blockers).toEqual([]);
  });

  it('≥1 resolves among a fabricated + real mix → no blocker', () => {
    const body = bodyWith(
      'packages/core/foo.ts:2 real + nonexistent/x.ts:9 fake',
      'docs/bar.md:1 ok',
    );
    const { blockers } = checkPrBodyCitations(body, reader(FILES));
    expect(blockers).toEqual([]);
  });

  it('out-of-range line on a real file does not resolve → blocker if sole citation', () => {
    const body = bodyWith('packages/core/foo.ts:9999 claim', 'docs/bar.md:1 ok');
    const { blockers } = checkPrBodyCitations(body, reader(FILES));
    expect(blockers.length).toBe(1);
  });

  it('no citations in a section → no L2 blocker (L1 bash owns presence)', () => {
    const body = bodyWith('prose only, no citation', 'docs/bar.md:1 ok');
    const { blockers } = checkPrBodyCitations(body, reader(FILES));
    expect(blockers).toEqual([]);
  });
});

describe('checkPrBodyCitations — L3 warn', () => {
  it('genuine-looking citation that does not resolve → warning, no blocker', () => {
    const body = bodyWith(
      'packages/core/foo.ts:2 real + docs/missing.md:3 stale',
      'docs/bar.md:1 ok',
    );
    const { blockers, warnings } = checkPrBodyCitations(body, reader(FILES));
    expect(blockers).toEqual([]);
    expect(warnings.some((w) => w.includes('docs/missing.md:3'))).toBe(true);
  });

  it('citation to a filler (blank) line → warning', () => {
    const body = bodyWith('docs/bar.md:2 (blank line)', 'docs/bar.md:1 ok');
    const { warnings } = checkPrBodyCitations(body, reader(FILES));
    expect(warnings.some((w) => w.includes('docs/bar.md:2'))).toBe(true);
  });

  it('prose Node.js:18 is ignored by L3 (not a repo path)', () => {
    const body = bodyWith('packages/core/foo.ts:2 real, also Node.js:18', 'docs/bar.md:1 ok');
    const { warnings } = checkPrBodyCitations(body, reader(FILES));
    expect(warnings.some((w) => w.includes('Node.js:18'))).toBe(false);
  });
});
