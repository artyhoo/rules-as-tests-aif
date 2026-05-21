/**
 * Tests for checks/s17.ts (Wave 10.3 §1.7 port).
 *
 * Ports the 11 s17_* scenarios that lived in packages/core/audit-self/pre-push.test.sh
 * (which mocked `git show`) to vitest with the IDENTICAL fixtures, guaranteeing
 * behaviour parity, plus isDisciplineIntroducing cases + boundary mutation-killers
 * for Stryker ≥80% (D4). The bash predecessor had zero mutation coverage.
 */
import { describe, it, expect } from 'vitest';
import type { GitProvider } from '../utils/git.ts';
import {
  isDisciplineIntroducing,
  checkS17TrailerBody,
  runS17Check,
  S17_HISTORICAL_CUTOFF,
} from './s17.ts';

// ─── exact fixtures from pre-push.test.sh ───────────────────────────────────────
const GENERIC =
  '§1.7: forward-check applied — Checked all rules, compliant. Backward-check — complete sweep performed.';
const CITATION =
  '§1.7: forward-check: packages/core/principles/02-paired-negative-test.test.ts:82 mutation arm verified; backward: 0 new .md files';
const BOOTSTRAP =
  '§1.7 Bootstrap: introduces substance arm for §1.7 trailer with 2026-06-10 calibration window';
const RECENT = '2026-05-21'; // after cutoff
const body = (trailer: string) => `feat(test): dummy\n\n${trailer}`;

function fakeGit(over: Partial<GitProvider> = {}): GitProvider {
  return {
    packageJsonDiff: () => '',
    changedFiles: () => [],
    fileContent: () => null,
    subdirExistedAtParent: () => false,
    commitBody: () => '',
    authorDate: () => RECENT,
    commitSubject: () => 'feat: x',
    diffForPaths: () => '',
    ...over,
  };
}

describe('checkS17TrailerBody — ported pre-push.test.sh scenarios', () => {
  it('1. generic stub (no file:line) → substance failure (code 2)', () => {
    expect(checkS17TrailerBody(body(GENERIC), RECENT).code).toBe(2);
  });
  it('2. trailer with file:line citation → pass (code 0)', () => {
    expect(checkS17TrailerBody(body(CITATION), RECENT).code).toBe(0);
  });
  it('3. Bootstrap line unaffected by substance check → pass (code 0)', () => {
    expect(checkS17TrailerBody(body(BOOTSTRAP), RECENT).code).toBe(0);
  });
  it('4. warn-only default: pure fn still signals substance failure (code 2)', () => {
    // The warn-vs-block decision is the caller's; the pure fn always returns 2.
    expect(checkS17TrailerBody(body(GENERIC), RECENT).code).toBe(2);
  });
  it('5. pre-cutoff author date → bypass (code 0)', () => {
    expect(checkS17TrailerBody(body(GENERIC), '2026-05-01').code).toBe(0);
  });
  it('6. prose §1.7, no trailer → substance failure (code 2)', () => {
    expect(
      checkS17TrailerBody(body('I performed §1.7 forward and backward checks per the rule.'), RECENT)
        .code,
    ).toBe(2);
  });
  it('7. prose mention + valid §1.7: trailer → pass (code 0)', () => {
    const b = body(
      'I performed §1.7 forward and backward checks per the rule.\n§1.7: forward-check: packages/core/principles/02-paired-negative-test.test.ts:82 verified; backward: 0 new .md files',
    );
    expect(checkS17TrailerBody(b, RECENT).code).toBe(0);
  });
  it('8. prose mention + Bootstrap line → pass (code 0)', () => {
    const b = body(
      'I performed §1.7 forward and backward checks per the rule.\n§1.7 Bootstrap: introduces body-prose substance arm; B1 exemption — this is the discipline-bearing artifact',
    );
    expect(checkS17TrailerBody(b, RECENT).code).toBe(0);
  });
  it('9. no §1.7 anywhere → missing trailer (code 1)', () => {
    expect(
      checkS17TrailerBody(body('This commit has no reference to the discipline check whatsoever.'), RECENT)
        .code,
    ).toBe(1);
  });
  it('10. §1.7 only inside a URL → not discourse → missing trailer (code 1)', () => {
    expect(
      checkS17TrailerBody(body('See https://example.com/rules/§1.7-spec for the canonical definition.'), RECENT)
        .code,
    ).toBe(1);
  });
  it('11. §1.7 after non-slash punctuation → caught as prose (code 2)', () => {
    expect(
      checkS17TrailerBody(body('Discipline applied.§1.7 forward and backward checks done.'), RECENT).code,
    ).toBe(2);
  });
});

describe('checkS17TrailerBody — boundary / mutation-killers', () => {
  it('payload exactly 40 substantive chars + citation → pass', () => {
    // "§1.7: " then a 40+ char payload that includes a file:line citation.
    const b = body('§1.7: fwd a/b.ts:1 and backward sweep done — all good here ok');
    expect(checkS17TrailerBody(b, RECENT).code).toBe(0);
  });
  it('payload shorter than 40 chars → skipped, falls to prose → code 2 (line is prose)', () => {
    // "§1.7: short" is <40 → continue; then the §1.7: line itself matches the prose regex.
    expect(checkS17TrailerBody(body('§1.7: short bit'), RECENT).code).toBe(2);
  });
  it('all-placeholder §1.7: trailer (≥40) → not substantive → prose path → code 2', () => {
    expect(checkS17TrailerBody(body('§1.7: TODO TODO TODO TODO TODO TODO TODO TODO TODO'), RECENT).code).toBe(2);
  });
  it('Bootstrap with <20-char payload does NOT exempt', () => {
    // Falls through bootstrap; no §1.7: trailer; "§1.7 Bootstrap" line is prose → code 2.
    expect(checkS17TrailerBody(body('§1.7 Bootstrap: short'), RECENT).code).toBe(2);
  });
  it('boundary: date equal to cutoff is NOT bypassed (string <)', () => {
    expect(checkS17TrailerBody(body('no mention here'), S17_HISTORICAL_CUTOFF).code).toBe(1);
  });
  it('uses the default cutoff when none supplied', () => {
    expect(checkS17TrailerBody(body('no mention'), '2026-05-10').code).toBe(0);
  });
});

describe('isDisciplineIntroducing', () => {
  const ruleFile = '.claude/rules/foo.md';
  it('false when subject is on the D3 allow-list', () => {
    const g = fakeGit({
      commitSubject: () => 'docs(research-patches): add patch',
      changedFiles: () => [{ status: 'M', path: ruleFile }],
      diffForPaths: () => '+## §5 new section',
    });
    expect(isDisciplineIntroducing('sha', g)).toBe(false);
  });
  it('false when no discipline file changed', () => {
    const g = fakeGit({ changedFiles: () => [{ status: 'A', path: 'src/x.ts' }] });
    expect(isDisciplineIntroducing('sha', g)).toBe(false);
  });
  it('false when a rule file changed but no new ## § / export const marker', () => {
    const g = fakeGit({
      changedFiles: () => [{ status: 'M', path: ruleFile }],
      diffForPaths: () => '+just a prose tweak, no section heading',
    });
    expect(isDisciplineIntroducing('sha', g)).toBe(false);
  });
  it('true when a rule file adds a new ## § heading', () => {
    const g = fakeGit({
      changedFiles: () => [{ status: 'M', path: ruleFile }],
      diffForPaths: () => '+## §7 Promotion / retirement',
    });
    expect(isDisciplineIntroducing('sha', g)).toBe(true);
  });
  it('true when a principle test adds a top-level export const', () => {
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/core/principles/16-x.test.ts' }],
      diffForPaths: () => '+export const RULE_ID: string = "16";',
    });
    expect(isDisciplineIntroducing('sha', g)).toBe(true);
  });
  it('false for a nested (non-direct-child) rule path', () => {
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: '.claude/rules/sub/deep.md' }],
      diffForPaths: () => '+## §1 x',
    });
    expect(isDisciplineIntroducing('sha', g)).toBe(false);
  });
});

describe('checkS17TrailerBody — message + regex/boundary mutation-killers', () => {
  it('code-1 message names the missing trailer', () => {
    expect(checkS17TrailerBody(body('nothing relevant'), RECENT).message).toMatch(
      /no valid §1\.7: trailer/,
    );
  });
  it('code-2 substance message names the file:line citation gap', () => {
    expect(checkS17TrailerBody(body(GENERIC), RECENT).message).toMatch(/lacks file:line citation/);
  });
  it('code-2 prose message names the prose-without-trailer case', () => {
    const r = checkS17TrailerBody(body('I did §1.7 forward and backward checks thoroughly here.'), RECENT);
    expect(r.message).toMatch(/mentioned in commit body prose/);
  });
  it('citation needs digits after the colon (foo.md:10 cites, foo.md does not)', () => {
    const cited = '§1.7: forward done at .claude/rules/x.md:10 and backward sweep complete here ok';
    const uncited = '§1.7: forward done at .claude/rules/x.md and backward sweep complete here okay';
    expect(checkS17TrailerBody(body(cited), RECENT).code).toBe(0);
    expect(checkS17TrailerBody(body(uncited), RECENT).code).toBe(2);
  });
  it('empty author date is NOT treated as pre-cutoff (still checked)', () => {
    expect(checkS17TrailerBody(body('no mention at all here'), '').code).toBe(1);
  });
  it('bootstrap exactly 20 substantive chars exempts; 19 does not', () => {
    const twenty = 'covers exactly twenty';  // ≥20 substantive
    expect(checkS17TrailerBody(body(`§1.7 Bootstrap: ${twenty}`), RECENT).code).toBe(0);
  });
  it('all-placeholder bootstrap does NOT exempt (falls to prose → code 2)', () => {
    expect(checkS17TrailerBody(body('§1.7 Bootstrap: TODO TODO TODO TODO TODO TODO'), RECENT).code).toBe(2);
  });
  it('placeholder words with trailing punctuation still count as placeholder', () => {
    // "TODO, TODO; TODO." → stripPunctLower removes punctuation → all placeholder.
    expect(checkS17TrailerBody(body('§1.7: TODO, TODO; TODO. TODO! TODO? TODO: na'), RECENT).code).toBe(2);
  });
  it('a bootstrap of all six placeholder words does NOT exempt (kills each word literal)', () => {
    // Each of todo/later/na/tbd/fixme/placeholder is present; mutating any one to ''
    // makes that token substantive → bootstrap would wrongly exempt (code 0).
    expect(
      checkS17TrailerBody(body('§1.7 Bootstrap: todo later na tbd fixme placeholder'), RECENT).code,
    ).toBe(2);
  });
  it('citation extension must be lowercase (.TS:10 is not a citation)', () => {
    expect(
      checkS17TrailerBody(body('§1.7: forward at FOO.TS:10 and backward sweep complete enough here'), RECENT)
        .code,
    ).toBe(2);
  });
});

describe('isDisciplineIntroducing — section-marker discrimination', () => {
  const rule = () => [{ status: 'M', path: '.claude/rules/r.md' }];
  it('matches a new "## §" heading', () => {
    expect(isDisciplineIntroducing('s', fakeGit({ changedFiles: rule, diffForPaths: () => '+## § New' }))).toBe(true);
  });
  it('requires an UPPERCASE export const name (lowercase does not match)', () => {
    expect(
      isDisciplineIntroducing('s', fakeGit({ changedFiles: rule, diffForPaths: () => '+export const ruleId: x' })),
    ).toBe(false);
  });
  it('ignores section markers on context (non-+) lines', () => {
    expect(
      isDisciplineIntroducing('s', fakeGit({ changedFiles: rule, diffForPaths: () => ' ## § unchanged heading' })),
    ).toBe(false);
  });
  it('ignores a "## §" heading on a REMOVED (-) diff line (anchor ^+ required)', () => {
    expect(
      isDisciplineIntroducing('s', fakeGit({ changedFiles: rule, diffForPaths: () => '-## § deleted heading' })),
    ).toBe(false);
  });
  it('does NOT bypass when an allow-list prefix appears mid-subject (anchor ^ required)', () => {
    // "docs(research-patches):" only bypasses at the START of the subject.
    const g = fakeGit({
      commitSubject: () => 'feat: see docs(research-patches): note',
      changedFiles: rule,
      diffForPaths: () => '+## § new',
    });
    expect(isDisciplineIntroducing('s', g)).toBe(true);
  });
  it('finds the discipline file among several non-discipline changes', () => {
    const g = fakeGit({
      changedFiles: () => [
        { status: 'A', path: 'src/a.ts' },
        { status: 'M', path: 'README.md' },
        { status: 'M', path: '.claude/rules/r.md' },
      ],
      diffForPaths: () => '+## § new',
    });
    expect(isDisciplineIntroducing('s', g)).toBe(true);
  });
});

describe('checkS17TrailerBody — exact boundaries (kill <40 / >=20 / startsWith-colon)', () => {
  // payload after "§1.7: " is exactly 40 chars AND carries a citation → code 0.
  it('§1.7: payload of exactly 40 chars with citation → pass', () => {
    const payload = 'x.ts:1 ' + 'a'.repeat(33); // 7 + 33 = 40
    expect(payload.length).toBe(40);
    expect(checkS17TrailerBody(body(`§1.7: ${payload}`), RECENT).code).toBe(0);
  });
  // 39-char payload with citation is below the threshold → skipped → prose → code 2.
  it('§1.7: payload of 39 chars with citation → below threshold → code 2', () => {
    const payload = 'x.ts:1 ' + 'a'.repeat(32); // 39
    expect(payload.length).toBe(39);
    expect(checkS17TrailerBody(body(`§1.7: ${payload}`), RECENT).code).toBe(2);
  });
  it('a "§1.7 " line WITHOUT the colon is not a trailer (citation ignored) → prose code 2', () => {
    const line = '§1.7 forward at x.ts:1 and backward sweep complete forty plus chars';
    expect(checkS17TrailerBody(body(line), RECENT).code).toBe(2);
  });
  it('bootstrap of exactly 20 substantive chars exempts (code 0)', () => {
    const bs = 'abcde fghij klmno pq'; // 20 chars, substantive
    expect(bs.length).toBe(20);
    expect(checkS17TrailerBody(body(`§1.7 Bootstrap: ${bs}`), RECENT).code).toBe(0);
  });
  it('bootstrap of 19 substantive chars does NOT exempt (→ prose code 2)', () => {
    const bs = 'abcde fghij klmno p'; // 19 chars
    expect(bs.length).toBe(19);
    expect(checkS17TrailerBody(body(`§1.7 Bootstrap: ${bs}`), RECENT).code).toBe(2);
  });
});

describe('isDisciplineIntroducing — per-path-type + allow-list mutation-killers', () => {
  const marker = () => '+## §1 new';
  it.each([
    ['.claude/rules/r.md', true],
    ['packages/core/principles/16-x.test.ts', true],
    ['.claude/skills/foo/SKILL.md', true],
    ['packages/core/principles/16-x.ts', false], // not .test.ts
    ['.claude/skills/foo/other.md', false], // not SKILL.md
  ])('discipline-file match for %s → %s', (path, expected) => {
    const g = fakeGit({ changedFiles: () => [{ status: 'A', path }], diffForPaths: marker });
    expect(isDisciplineIntroducing('sha', g)).toBe(expected);
  });
  it.each([
    'docs(research-patches): x',
    'chore(snapshot-regen): x',
    'chore(prior-art-update): x',
  ])('allow-list subject %s bypasses (false)', (subject) => {
    const g = fakeGit({
      commitSubject: () => subject,
      changedFiles: () => [{ status: 'M', path: '.claude/rules/r.md' }],
      diffForPaths: marker,
    });
    expect(isDisciplineIntroducing('sha', g)).toBe(false);
  });
  it('a non-allow-listed feat subject does NOT bypass', () => {
    const g = fakeGit({
      commitSubject: () => 'feat(rules): real change',
      changedFiles: () => [{ status: 'M', path: '.claude/rules/r.md' }],
      diffForPaths: marker,
    });
    expect(isDisciplineIntroducing('sha', g)).toBe(true);
  });
});

describe('runS17Check — paired-negative', () => {
  const ruleFile = '.claude/rules/foo.md';
  const introducing: Partial<GitProvider> = {
    commitSubject: () => 'feat(rules): add §X',
    changedFiles: () => [{ status: 'M', path: ruleFile }],
    diffForPaths: () => '+## §9 new section',
  };
  it('NEGATIVE: discipline commit with generic stub → substanceFailures', () => {
    const g = fakeGit({ ...introducing, commitBody: () => body(GENERIC) });
    const r = runS17Check(['deadbeef0000'], g);
    expect(r.substanceFailures).toHaveLength(1);
    expect(r.substanceFailures[0].sha).toBe('deadbeef00');
    expect(r.failures).toHaveLength(0);
  });
  it('POSITIVE: discipline commit with file:line citation → clean', () => {
    const g = fakeGit({ ...introducing, commitBody: () => body(CITATION) });
    const r = runS17Check(['abc'], g);
    expect(r.failures).toHaveLength(0);
    expect(r.substanceFailures).toHaveLength(0);
  });
  it('NEGATIVE: discipline commit with no §1.7 at all → failures (code 1)', () => {
    const g = fakeGit({ ...introducing, commitBody: () => body('no discipline reference here') });
    const r = runS17Check(['abc'], g);
    expect(r.failures).toHaveLength(1);
  });
  it('non-discipline commit is skipped entirely', () => {
    const g = fakeGit({ commitBody: () => body(GENERIC), changedFiles: () => [{ status: 'A', path: 'src/x.ts' }] });
    const r = runS17Check(['abc'], g);
    expect(r.failures).toHaveLength(0);
    expect(r.substanceFailures).toHaveLength(0);
  });
});
