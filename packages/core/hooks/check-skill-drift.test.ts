/**
 * Content-level paired-negative mutation test for scripts/check-skill-drift.sh.
 *
 * Script under test: scripts/check-skill-drift.sh
 *
 * Exit code contract:
 *   0 = clean (no broken refs, no missing frontmatter; trigger-overlap is WARN-only to stderr)
 *   1 = broken refs OR missing frontmatter detected
 *
 * Checks covered:
 *   - Broken internal refs: markdown links [text](relative/path.md) whose target does not exist
 *   - Missing frontmatter: SKILL.md / agents/*.md lacking `---` + `name:` + `description:`
 *   - Combined: both errors present in one run
 *
 * Paired-negative contract (4 cases):
 *
 *   Case 1 — Clean state:
 *     POSITIVE (implicit baseline): empty .claude/skills, agents, skills dirs → exit 0
 *     stdout contains "check-skill-drift: PASS (0 errors)"
 *
 *   Case 2 — Broken internal ref:
 *     POSITIVE: SKILL.md with link to nonexistent.md → exit 1,
 *       stdout contains "BROKEN-REF:" and "check-skill-drift: FAIL"
 *     NEGATIVE: same SKILL.md but link points to an EXISTING file → exit 0,
 *       stdout does NOT contain "BROKEN-REF:"
 *
 *   Case 3 — Missing frontmatter:
 *     POSITIVE: agents/my-agent.md starting with `# heading` (no ---) → exit 1,
 *       stdout contains "MISSING-FRONTMATTER:"
 *     NEGATIVE: same file WITH valid frontmatter (---/name:/description:/---) → exit 0,
 *       stdout does NOT contain "MISSING-FRONTMATTER:"
 *
 *   Case 4 — Combined errors:
 *     agents/my-agent.md missing frontmatter + skills/test/SKILL.md (with frontmatter)
 *     linking to nonexistent file → exit 1,
 *     stdout contains BOTH "BROKEN-REF:" AND "MISSING-FRONTMATTER:"
 *
 * Isolation strategy:
 *   The script derives REPO_ROOT from its own file location via:
 *     SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
 *     REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
 *   REPO_ROOT cannot be overridden via env. To isolate tests, each test case:
 *     1. Creates a mkdtempSync sandbox
 *     2. Copies check-skill-drift.sh into sandbox/scripts/
 *     3. Creates fixture .claude/skills, agents, skills subdirs in sandbox
 *     4. Runs sandbox/scripts/check-skill-drift.sh — which derives REPO_ROOT = sandbox
 *   This ensures the script scans only fixture files, not the real repo.
 *
 * Mutation-sanity (M.4 pattern):
 *   - If the script's "BROKEN-REF:" output string changes → Case 2 POSITIVE test FAILS.
 *   - If the script's "MISSING-FRONTMATTER:" output string changes → Case 3 POSITIVE test FAILS.
 *   - If the script's "check-skill-drift: PASS" string changes → Case 1 test FAILS.
 *   - If the script's "check-skill-drift: FAIL" string changes → Case 2/3/4 tests FAIL.
 *   - If exit code logic is mutated (1 → 0) → Case 2/3/4 POSITIVE tests FAIL.
 *   - If exit code logic is mutated (0 → 1) → Case 2/3 NEGATIVE and Case 1 tests FAIL.
 *
 * T3 compliance: each assertion cites the script source line/region it targets.
 * T15: this test file's own isolation approach is noted in the docstring above.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
  chmodSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const REAL_SCRIPT = resolve(REPO_ROOT, 'scripts/check-skill-drift.sh');

const sandboxes: string[] = [];
afterEach(() => {
  for (const d of sandboxes.splice(0)) rmSync(d, { recursive: true, force: true });
});

/**
 * Create an isolated sandbox directory that looks like a minimal repo:
 *   sandbox/
 *     scripts/
 *       check-skill-drift.sh  ← copy of the real script
 *     .claude/skills/         ← empty fixture dir
 *     agents/                 ← empty fixture dir
 *     skills/                 ← empty fixture dir
 *
 * When sandbox/scripts/check-skill-drift.sh runs, it derives:
 *   SCRIPT_DIR = sandbox/scripts
 *   REPO_ROOT  = sandbox
 * and scans .claude/skills, agents, skills relative to sandbox.
 */
function makeSandbox(): { root: string; scriptsDir: string } {
  const root = mkdtempSync(join(tmpdir(), 'skill-drift-test-'));
  sandboxes.push(root);

  const scriptsDir = join(root, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });

  // Copy the real script into the sandbox's scripts/ directory
  cpSync(REAL_SCRIPT, join(scriptsDir, 'check-skill-drift.sh'));
  chmodSync(join(scriptsDir, 'check-skill-drift.sh'), 0o755);

  // Create the three scan target directories (empty = no findings)
  mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
  mkdirSync(join(root, 'agents'), { recursive: true });
  mkdirSync(join(root, 'skills'), { recursive: true });

  return { root, scriptsDir };
}

/**
 * Run the sandboxed script. The script derives REPO_ROOT from its own location,
 * so we simply invoke it by path with no special env overrides needed.
 *
 * Note: stdout contains the main output; stderr contains WARN-only trigger-overlap lines.
 */
function run(sandboxRoot: string): { status: number; stdout: string; stderr: string } {
  const r = spawnSync('bash', [join(sandboxRoot, 'scripts', 'check-skill-drift.sh')], {
    encoding: 'utf8',
  });
  return { status: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// ──────────────────────────────────────────────────────────────────────────────
// Case 1 — Clean state: no files → PASS
// ──────────────────────────────────────────────────────────────────────────────

describe('check-skill-drift.sh — paired-negative mutation contract', () => {
  it('Case 1 — Clean state: empty fixture dirs → exit 0 + PASS message', () => {
    // Script lines 202-204: if ERRORS == 0 → echo "check-skill-drift: PASS (0 errors)" + exit 0
    // find .claude/skills agents skills -name "*.md" returns no files → BROKEN_REF_COUNT=0
    // find agents -name "*.md" returns no files → FRONTMATTER_ERRORS=0
    const { root } = makeSandbox();

    const { status, stdout } = run(root);

    expect(status).toBe(0);
    // Script line 203: "check-skill-drift: PASS (0 errors)"
    expect(stdout).toContain('check-skill-drift: PASS (0 errors)');
    // No error categories should appear
    expect(stdout).not.toContain('BROKEN-REF:');
    expect(stdout).not.toContain('MISSING-FRONTMATTER:');
    expect(stdout).not.toContain('check-skill-drift: FAIL');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Case 2 — Broken internal ref
  // ──────────────────────────────────────────────────────────────────────────

  it('Case 2 POSITIVE: SKILL.md with link to nonexistent.md → exit 1 + BROKEN-REF output', () => {
    // Script lines 47-84: scans .claude/skills/**/*.md for markdown links.
    // Line 78-81: if target file does not exist → echo "BROKEN-REF: $md_file → $href"
    // Line 88-93: BROKEN_REF_COUNT > 0 → ERRORS++ → exit 1
    const { root } = makeSandbox();

    const skillDir = join(root, '.claude', 'skills', 'my-skill');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      [
        '---',
        'name: my-skill',
        'description: A test skill',
        '---',
        '',
        '# My Skill',
        '',
        'See [something](nonexistent.md) for details.',
      ].join('\n'),
      'utf8',
    );

    const { status, stdout } = run(root);

    // Script line 204-207: ERRORS > 0 → exit 1
    expect(status).toBe(1);
    // Script line 79: echo "BROKEN-REF: $md_file → $href"
    expect(stdout).toContain('BROKEN-REF:');
    // Script line 206: echo "check-skill-drift: FAIL ($ERRORS error category/categories)"
    expect(stdout).toContain('check-skill-drift: FAIL');
    expect(stdout).not.toContain('check-skill-drift: PASS');
  });

  it('Case 2 NEGATIVE: same SKILL.md but link points to an EXISTING file → exit 0, no BROKEN-REF', () => {
    // Paired-negative for Case 2 POSITIVE: when the linked file actually exists,
    // the broken-ref check passes. Script line 78: if [ ! -f "$resolved" ] — condition false.
    const { root } = makeSandbox();

    const skillDir = join(root, '.claude', 'skills', 'my-skill');
    mkdirSync(skillDir, { recursive: true });

    // Create the target file that will be linked
    writeFileSync(join(skillDir, 'existing.md'), '# Existing file\n', 'utf8');

    writeFileSync(
      join(skillDir, 'SKILL.md'),
      [
        '---',
        'name: my-skill',
        'description: A test skill',
        '---',
        '',
        '# My Skill',
        '',
        'See [something](existing.md) for details.',
      ].join('\n'),
      'utf8',
    );

    const { status, stdout } = run(root);

    expect(status).toBe(0);
    // No broken refs → PASS
    expect(stdout).not.toContain('BROKEN-REF:');
    expect(stdout).toContain('check-skill-drift: PASS (0 errors)');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Case 3 — Missing frontmatter
  // ──────────────────────────────────────────────────────────────────────────

  it('Case 3 POSITIVE: agents/my-agent.md with no --- frontmatter → exit 1 + MISSING-FRONTMATTER', () => {
    // Script lines 103-141: check_frontmatter() reads file; line 109: if first_line != "---"
    // → echo "MISSING-FRONTMATTER: $file (no opening --- found)"
    // Script line 157: FRONTMATTER_ERRORS > 0 → ERRORS++ → exit 1
    const { root } = makeSandbox();

    writeFileSync(
      join(root, 'agents', 'my-agent.md'),
      [
        '# My Agent',
        '',
        'This agent does things.',
      ].join('\n'),
      'utf8',
    );

    const { status, stdout } = run(root);

    expect(status).toBe(1);
    // Script line 110-111: echo "MISSING-FRONTMATTER: $file (no opening --- found)"
    expect(stdout).toContain('MISSING-FRONTMATTER:');
    expect(stdout).toContain('check-skill-drift: FAIL');
    expect(stdout).not.toContain('check-skill-drift: PASS');
  });

  it('Case 3 NEGATIVE: same agent file WITH valid frontmatter → exit 0, no MISSING-FRONTMATTER', () => {
    // Paired-negative for Case 3 POSITIVE: when frontmatter contains name: and description:,
    // check_frontmatter() passes. Script lines 135-141: only emits error if has_name=0 or has_desc=0.
    const { root } = makeSandbox();

    writeFileSync(
      join(root, 'agents', 'my-agent.md'),
      [
        '---',
        'name: my-agent',
        'description: test agent description',
        '---',
        '',
        '# My Agent',
        '',
        'This agent does things.',
      ].join('\n'),
      'utf8',
    );

    const { status, stdout } = run(root);

    expect(status).toBe(0);
    expect(stdout).not.toContain('MISSING-FRONTMATTER:');
    expect(stdout).toContain('check-skill-drift: PASS (0 errors)');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Case 4 — Combined: both broken ref AND missing frontmatter
  // ──────────────────────────────────────────────────────────────────────────

  it('Case 4 — Combined: missing frontmatter + broken ref → exit 1, both error types present', () => {
    // Both check phases fire:
    //   Phase 1 (lines 47-93): SKILL.md in skills/ links to nonexistent.md → BROKEN-REF
    //   Phase 2 (lines 103-161): agents/my-agent.md has no --- → MISSING-FRONTMATTER
    // ERRORS incremented twice (one per category), ERRORS >= 2 → exit 1
    // Script line 206: "check-skill-drift: FAIL (2 error category/categories)"
    const { root } = makeSandbox();

    // Broken ref: skills/test/SKILL.md has valid frontmatter but links to nonexistent file
    const skillDir = join(root, 'skills', 'test');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      [
        '---',
        'name: test-skill',
        'description: A test skill for combined errors',
        '---',
        '',
        '# Test Skill',
        '',
        'See [reference](nonexistent-target.md) for more.',
      ].join('\n'),
      'utf8',
    );

    // Missing frontmatter: agents/my-agent.md starts with heading, no ---
    writeFileSync(
      join(root, 'agents', 'my-agent.md'),
      [
        '# My Agent',
        '',
        'No frontmatter here.',
      ].join('\n'),
      'utf8',
    );

    const { status, stdout } = run(root);

    expect(status).toBe(1);
    // Both error types must appear
    // Script line 79: "BROKEN-REF: ..."
    expect(stdout).toContain('BROKEN-REF:');
    // Script line 110 or 139: "MISSING-FRONTMATTER: ..."
    expect(stdout).toContain('MISSING-FRONTMATTER:');
    // Overall failure
    expect(stdout).toContain('check-skill-drift: FAIL');
    expect(stdout).not.toContain('check-skill-drift: PASS');
  });
});
