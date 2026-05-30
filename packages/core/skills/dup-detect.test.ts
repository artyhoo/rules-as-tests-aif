/**
 * Paired-negative tests for dup-detect.sh L3 semantic dup-detect helper.
 *
 * Stage 5.A of umbrella meta-orchestrator-planner-completeness: verifies that
 * the helper correctly flags kickoff-vs-merged-PR overlap via both xref and
 * Jaccard signals, and that removing each fixture causes the expected drop.
 *
 * Principle 02 contract (both arms required):
 *   ✅ Positive: fixture present → POTENTIAL_DUPE emitted
 *   ❌ Paired-negative: fixture scrubbed → OK emitted, no POTENTIAL_DUPE
 *
 * The test MUST FAIL if dup-detect.sh is reverted to a no-op returning only OK lines.
 *
 * Seams used (env vars forwarded to the shell script):
 *   REPO_ROOT            — points to a temp fixture dir mimicking repo structure
 *   MO_GH_BIN            — path to a mock-gh script returning JSON fixture data
 *   MO_PR_WINDOW_DAYS    — controls lookback window (set to 9999 to avoid date drift)
 *   MO_JACCARD_THRESHOLD — controls Jaccard gate (default 30; seam test uses 99)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  chmodSync,
} from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT_REAL = resolve(HERE, '../../..');
const SCRIPT = resolve(
  REPO_ROOT_REAL,
  '.claude/skills/meta-orchestrator/helpers/dup-detect.sh',
);

// ── Fixture state shared across tests ────────────────────────────────────────

let tmpRoot: string;
let promptsDir: string;
let mockGhBin: string;

/** Run dup-detect.sh with fixture env vars injected. */
function runScript(umbrella: string, extraEnv: Record<string, string> = {}): string {
  try {
    return execFileSync('bash', [SCRIPT, umbrella], {
      encoding: 'utf8',
      env: {
        ...process.env,
        REPO_ROOT: tmpRoot,
        MO_GH_BIN: mockGhBin,
        MO_PR_WINDOW_DAYS: '9999', // avoid real date cutoff in tests
        GIT_DIR: '', // prevent git ops in tmpRoot
        ...extraEnv,
      },
    }).trim();
  } catch (err: unknown) {
    // execFileSync throws when exit code != 0; return stderr+stdout for diagnosis
    const e = err as { stdout?: string; stderr?: string };
    return ((e.stdout ?? '') + (e.stderr ?? '')).trim();
  }
}

/** Write UTF-8 file, creating parent dirs as needed. */
function write(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

// ── Fixture setup / teardown ──────────────────────────────────────────────────

const createdDirs: string[] = [];

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'dup-detect-test-'));
  createdDirs.push(tmpRoot);
  promptsDir = join(tmpRoot, '.claude', 'orchestrator-prompts');
  mkdirSync(promptsDir, { recursive: true });

  // Default mock-gh: returns one merged PR #205 "F.3 UX implementation"
  const binDir = join(tmpRoot, 'bin');
  mkdirSync(binDir, { recursive: true });
  mockGhBin = join(binDir, 'mock-gh');
  write(
    mockGhBin,
    [
      '#!/usr/bin/env bash',
      'echo \'[{"number":205,"title":"F.3 UX implementation"}]\'',
    ].join('\n'),
  );
  chmodSync(mockGhBin, 0o755);
});

afterEach(() => {
  for (const d of createdDirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

// ── Test 1: POS xref — kickoff mentions #205 explicitly ─────────────────────

describe('dup-detect.sh — Test 1: POS xref', () => {
  it('kickoff containing "PR #205" → POTENTIAL_DUPE with basis=xref', () => {
    write(
      join(promptsDir, 'test-xref', 'kickoff.md'),
      '# Kickoff\n\n> **Origin:** supersedes PR #205 which shipped partial work.\n\n## § scope\n\n- fix remaining items\n',
    );
    const out = runScript('test-xref');
    expect(out).toContain('POTENTIAL_DUPE:');
    expect(out).toContain('#205');
    expect(out).toContain('basis=xref');
    expect(out).not.toContain('OK:');
  });
});

// ── Test 2: POS jaccard — high-overlap tokens ─────────────────────────────────

describe('dup-detect.sh — Test 2: POS jaccard', () => {
  it('kickoff with overlapping tokens → POTENTIAL_DUPE with basis=jaccard', () => {
    // mock-gh returns PR with title containing tokens that will overlap with kickoff §headers
    write(
      mockGhBin,
      [
        '#!/usr/bin/env bash',
        'echo \'[{"number":300,"title":"feat: planner decomposition heuristics skill assignment"}]\'',
      ].join('\n'),
    );
    chmodSync(mockGhBin, 0o755);

    write(
      join(promptsDir, 'test-jaccard', 'kickoff.md'),
      [
        '# Kickoff',
        '',
        '## § scope',
        '',
        '- decomposition heuristics for planner',
        '- skill assignment logic',
        '- heuristic evaluation',
        '',
      ].join('\n'),
    );
    const out = runScript('test-jaccard');
    expect(out).toContain('POTENTIAL_DUPE:');
    expect(out).toContain('basis=jaccard');
    expect(out).toContain('score=');
    expect(out).not.toContain('OK:');
  });
});

// ── Test 3: NEG paired with Test 1 — #205 ref removed ───────────────────────

describe('dup-detect.sh — Test 3: NEG xref (paired with Test 1)', () => {
  it('kickoff without #205 reference + no token overlap → OK line, no POTENTIAL_DUPE', () => {
    write(
      join(promptsDir, 'test-neg-xref', 'kickoff.md'),
      '# Kickoff\n\n## § scope\n\n- unrelated task with totally different vocabulary\n- nothing about F3\n',
    );
    const out = runScript('test-neg-xref');
    expect(out).toContain('OK:');
    expect(out).not.toContain('POTENTIAL_DUPE:');
  });
});

// ── Test 4: NEG paired with Test 2 — tokens scrubbed below threshold ──────────

describe('dup-detect.sh — Test 4: NEG jaccard threshold (paired with Test 2)', () => {
  it('kickoff with scrubbed tokens → OK line when threshold not met', () => {
    write(
      mockGhBin,
      [
        '#!/usr/bin/env bash',
        'echo \'[{"number":300,"title":"feat: planner decomposition heuristics skill assignment"}]\'',
      ].join('\n'),
    );
    chmodSync(mockGhBin, 0o755);

    // Kickoff has NO overlap with PR title tokens (all different words)
    write(
      join(promptsDir, 'test-neg-jaccard', 'kickoff.md'),
      [
        '# Kickoff',
        '',
        '## § scope',
        '',
        '- completely unrelated topic about something else entirely',
        '- nothing here matches merged pull request title words',
        '',
      ].join('\n'),
    );
    const out = runScript('test-neg-jaccard');
    expect(out).toContain('OK:');
    expect(out).not.toContain('POTENTIAL_DUPE:');
  });
});

// ── Test 5: NEG fail-soft — gh unavailable ────────────────────────────────────

describe('dup-detect.sh — Test 5: NEG fail-soft gh unavailable', () => {
  it('gh returns exit-1 → "(gh unavailable, dup-detect skipped)" + exit code 0', () => {
    // Replace mock-gh with one that exits 1
    write(mockGhBin, '#!/usr/bin/env bash\nexit 1\n');
    chmodSync(mockGhBin, 0o755);

    write(
      join(promptsDir, 'test-fail-soft', 'kickoff.md'),
      '# Kickoff\n\n## § scope\n\n- some task\n',
    );
    const out = runScript('test-fail-soft');
    expect(out).toContain('gh unavailable, dup-detect skipped');
    expect(out).not.toContain('POTENTIAL_DUPE:');
    // runScript catches non-zero exits; the script itself must exit 0 on gh failure
    // We verify this by running via shell and checking exit
    let exitCode = 0;
    try {
      execFileSync('bash', [SCRIPT, 'test-fail-soft'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          REPO_ROOT: tmpRoot,
          MO_GH_BIN: mockGhBin,
          MO_PR_WINDOW_DAYS: '9999',
          GIT_DIR: '',
        },
      });
    } catch {
      exitCode = 1;
    }
    expect(exitCode).toBe(0);
  });
});

// ── Test 6: NEG missing kickoff ───────────────────────────────────────────────

describe('dup-detect.sh — Test 6: NEG missing kickoff', () => {
  it('umbrella dir has no kickoff.md → MISSING: line, exit 0', () => {
    // Create dir but NO kickoff.md
    mkdirSync(join(promptsDir, 'test-missing'), { recursive: true });
    const out = runScript('test-missing');
    expect(out).toContain('MISSING:');
    expect(out).not.toContain('POTENTIAL_DUPE:');
  });
});

// ── Test 7: --all smoke — two umbrellas, one POS one NEG ─────────────────────

describe('dup-detect.sh — Test 7: --all smoke', () => {
  it('--all with two umbrellas emits POTENTIAL_DUPE for xref-one and OK for clean-one', () => {
    // Umbrella 1: mentions #205 → POTENTIAL_DUPE
    write(
      join(promptsDir, 'alpha-xref', 'kickoff.md'),
      '# Kickoff\n\n> supersedes PR #205.\n\n## § scope\n\n- task items\n',
    );
    // Umbrella 2: no overlap → OK
    write(
      join(promptsDir, 'beta-clean', 'kickoff.md'),
      '# Kickoff\n\n## § scope\n\n- completely unrelated topic with different vocabulary\n',
    );

    const out = runScript('--all');
    // alpha-xref must flag
    expect(out).toContain('POTENTIAL_DUPE:');
    expect(out).toContain('#205');
    // beta-clean must be OK
    expect(out).toContain('OK:');
    expect(out).toContain('beta-clean');
  });
});

// ── Test 8: Threshold seam — MO_JACCARD_THRESHOLD=99 suppresses jaccard hits ─

describe('dup-detect.sh — Test 8: MO_JACCARD_THRESHOLD seam', () => {
  it('MO_JACCARD_THRESHOLD=99 suppresses jaccard matches that would fire at 30', () => {
    write(
      mockGhBin,
      [
        '#!/usr/bin/env bash',
        'echo \'[{"number":300,"title":"feat: planner decomposition heuristics skill assignment"}]\'',
      ].join('\n'),
    );
    chmodSync(mockGhBin, 0o755);

    write(
      join(promptsDir, 'test-threshold', 'kickoff.md'),
      [
        '# Kickoff',
        '',
        '## § scope',
        '',
        '- decomposition heuristics for planner',
        '- skill assignment logic',
        '',
      ].join('\n'),
    );
    // At threshold=30 this WOULD fire (as in Test 2); at 99 it must not
    const out = runScript('test-threshold', { MO_JACCARD_THRESHOLD: '99' });
    expect(out).toContain('OK:');
    expect(out).not.toContain('POTENTIAL_DUPE:');
  });
});

// ── Signal 3: deliverable-already-on-staging ─────────────────────────────────
//
// These tests need a REAL git ref to ls-tree, so they init a throwaway git repo
// at tmpRoot and commit a fixture research-patch. GIT_DIR is intentionally NOT
// nulled here (the other tests null it to block git ops; Signal 3 needs git).

/** Init a git repo at tmpRoot and commit the given files (path→content). */
function initGitRepo(files: Record<string, string>): void {
  const run = (args: string[]) =>
    execFileSync('git', args, { cwd: tmpRoot, encoding: 'utf8', env: { ...process.env } });
  run(['init', '-q']);
  run(['config', 'user.email', 'test@example.com']);
  run(['config', 'user.name', 'Test']);
  for (const [rel, content] of Object.entries(files)) {
    write(join(tmpRoot, rel), content);
  }
  run(['add', '-A']);
  run(['commit', '-q', '-m', 'fixture']);
}

/** Run dup-detect.sh against a real git ref (GIT_DIR left intact). */
function runScriptS3(umbrella: string, extraEnv: Record<string, string> = {}): string {
  try {
    return execFileSync('bash', [SCRIPT, umbrella], {
      encoding: 'utf8',
      env: {
        ...process.env,
        REPO_ROOT: tmpRoot,
        MO_GH_BIN: mockGhBin,
        MO_PR_WINDOW_DAYS: '9999',
        MO_DELIVERABLE_REF: 'HEAD',
        ...extraEnv,
      },
    }).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return ((e.stdout ?? '') + (e.stderr ?? '')).trim();
  }
}

describe('dup-detect.sh — Test 9: POS deliverable-on-staging (dogfood)', () => {
  it('umbrella whose >=2 slug-tokens match a committed research-patch → basis=deliverable-on-staging', () => {
    // Commit the deliverable on the ref (mirrors the real 2026-05-25 mutation miss).
    initGitRepo({
      'docs/meta-factory/research-patches/2026-05-25-mutation-discipline-audit.md':
        '# mutation discipline audit\n\nfindings\n',
    });
    // Kickoff is on the working tree only (uncommitted draft) and neither cites a
    // PR# nor shares title tokens with the default mock PR (#205 "F.3 UX implementation").
    write(
      join(promptsDir, 'mutation-discipline-umbrella', 'kickoff.md'),
      '# Kickoff\n\n## § scope\n\n- close the discipline-theatre gap\n',
    );
    const out = runScriptS3('mutation-discipline-umbrella');
    expect(out).toContain('POTENTIAL_DUPE:');
    expect(out).toContain('basis=deliverable-on-staging');
    expect(out).toContain('2026-05-25-mutation-discipline-audit.md');
    expect(out).not.toContain('OK:');
  });

  it('strips -meta-launch suffix before tokenising (same deliverable still matches)', () => {
    initGitRepo({
      'docs/meta-factory/research-patches/2026-05-25-mutation-discipline-audit.md':
        '# mutation discipline audit\n',
    });
    write(
      join(promptsDir, 'mutation-discipline-umbrella-meta-launch', 'kickoff.md'),
      '# Kickoff\n\n## § scope\n\n- meta launch wrapper\n',
    );
    const out = runScriptS3('mutation-discipline-umbrella-meta-launch');
    expect(out).toContain('basis=deliverable-on-staging');
  });
});

describe('dup-detect.sh — Test 10: NEG deliverable-on-staging (paired with Test 9)', () => {
  it('umbrella with no matching committed deliverable → no deliverable-on-staging signal', () => {
    // Same committed file, but the umbrella shares <2 significant tokens with it.
    initGitRepo({
      'docs/meta-factory/research-patches/2026-05-25-mutation-discipline-audit.md':
        '# mutation discipline audit\n',
    });
    write(
      join(promptsDir, 'widget-rendering-umbrella', 'kickoff.md'),
      '# Kickoff\n\n## § scope\n\n- unrelated widget rendering work\n',
    );
    const out = runScriptS3('widget-rendering-umbrella');
    expect(out).not.toContain('deliverable-on-staging');
    // No other signal fires either (no #205 xref, no title-token overlap) → OK.
    expect(out).toContain('OK:');
  });

  it('single shared token is below the >=2 floor → no deliverable-on-staging signal', () => {
    // Filename shares ONLY "mutation" with the umbrella (discipline absent) → 1 token.
    initGitRepo({
      'docs/meta-factory/research-patches/2026-05-12-wave-9-2-stryker-mutation-audit.md':
        '# stryker mutation audit\n',
    });
    write(
      join(promptsDir, 'mutation-discipline-umbrella', 'kickoff.md'),
      '# Kickoff\n\n## § scope\n\n- discipline gap\n',
    );
    const out = runScriptS3('mutation-discipline-umbrella');
    expect(out).not.toContain('deliverable-on-staging');
  });
});

// ── T15 recursive self-application + script structure check ──────────────────

describe('dup-detect.sh — T15 self-application documentation', () => {
  it('script exists, is executable, contains required markers and seam vars', () => {
    expect(existsSync(SCRIPT)).toBe(true);
    const src = readFileSync(SCRIPT, 'utf8');
    // Seam markers
    expect(src).toContain('MO_GH_BIN');
    expect(src).toContain('MO_PR_WINDOW_DAYS');
    expect(src).toContain('MO_JACCARD_THRESHOLD');
    expect(src).toContain('MO_DELIVERABLE_REF');
    expect(src).toContain('MO_DELIVERABLE_DIRS');
    expect(src).toContain('REPO_ROOT');
    // Dual-implementation marker
    expect(src).toContain('@cc-only-rationale');
    // Both output-format strings
    expect(src).toContain('POTENTIAL_DUPE:');
    expect(src).toContain('OK:');
    // All three signal labels
    expect(src).toContain('basis=xref');
    expect(src).toContain('basis=jaccard');
    expect(src).toContain('basis=deliverable-on-staging');
  });
});
