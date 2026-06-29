/**
 * Principle 29 — `#worker-dispatch-via-subagent` channel-discipline gate (M6, CI half).
 *
 * Source: .claude/skills/pipeline/SKILL.md §5 `#worker-dispatch-via-subagent`
 *         docs/meta-factory/research-patches/2026-06-27-meta-orch-channel-discipline-mechanism.md
 *         (Stage A R-phase — M6 design, candidate matrix, regex sketch, escape-token)
 *
 * Invariant: no TRACKED `.claude/orchestrator-prompts/<umbrella>/kickoff.md` may
 * carry an unescaped line that instructs Agent-tool write-dispatch of a Worker.
 * This is the harness-agnostic backstop of the dual pair — it fires for every PR
 * via CI regardless of who authored the kickoff or in what tool. The edit-time
 * half (.claude/hooks/check-worker-dispatch-channel.sh) moves the same single
 * matcher (29-worker-dispatch-channel.ts) earlier, to the authoring session.
 *
 * @dual-pair: channel-discipline-worker-dispatch
 *
 * Paired-negative (T15 recursive self-application + T2): the matcher MUST fire on
 * the §1 ground-truth fixture and MUST stay silent on a clean / read-only / escaped
 * kickoff — proving the gate actually discriminates (a test that cannot fail on the
 * violation does not enforce). Kickoffs are TRACKED (.gitignore:18), so this scan
 * reaches them in CI via `git ls-files` — unlike principle 12, which reads the
 * directory and skips in CI.
 *
 * Slot 29 rationale: slots 01-28 occupied as of 2026-06-27.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  lineIsViolation,
  findViolations,
  FIXTURE_POSITIVE,
  FIXTURE_CLEAN,
  FIXTURE_READONLY,
  FIXTURE_ESCAPED,
  ESCAPE_TOKEN,
} from './29-worker-dispatch-channel.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

/** Tracked kickoffs only (CI-robust). Empty list (no git / fresh tree) is a valid state. */
function trackedKickoffs(): string[] {
  try {
    const out = execFileSync(
      'git',
      ['ls-files', '-z', '.claude/orchestrator-prompts/*/kickoff.md'],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    return out.split('\0').filter(Boolean);
  } catch {
    return [];
  }
}

describe('Principle 29 — kickoffs do not instruct Agent-tool write-dispatch of a Worker', () => {
  // ---- Paired-negative: prove the matcher DISCRIMINATES (non-tautological) ----
  it('FIRES on the §1 ground-truth fixture (positive)', () => {
    expect(lineIsViolation(FIXTURE_POSITIVE)).toBe(true);
  });

  it('SILENT on a clean kickoff line', () => {
    expect(lineIsViolation(FIXTURE_CLEAN)).toBe(false);
  });

  it('SILENT on a legitimate read-only Agent dispatch (clause c)', () => {
    expect(lineIsViolation(FIXTURE_READONLY)).toBe(false);
  });

  it('SILENT when the escape token is present on the line (clause d)', () => {
    expect(lineIsViolation(FIXTURE_ESCAPED)).toBe(false);
  });

  it('anti-tautology: the fixture stops firing once the escape token is appended', () => {
    expect(lineIsViolation(FIXTURE_POSITIVE)).toBe(true);
    const escaped = `${FIXTURE_POSITIVE} <!-- ${ESCAPE_TOKEN} historical pre-rule quote -->`;
    expect(lineIsViolation(escaped)).toBe(false);
  });

  it('each clause is load-bearing (removing any one makes the fixture stop firing)', () => {
    // (a) drop the Agent-tool channel signal → silent
    expect(lineIsViolation('Dispatch Worker in a fresh session, isolation: worktree')).toBe(false);
    // (b) drop the Worker target → silent
    expect(lineIsViolation('Run the review via Agent tool with model: opus')).toBe(false);
    // (c) add read-only context → silent
    expect(
      lineIsViolation('Dispatch Worker via Agent tool (read-only research subagent, text return)'),
    ).toBe(false);
  });

  it('blank / unrelated content never fires', () => {
    expect(findViolations('')).toHaveLength(0);
    expect(findViolations('# Kickoff\n\nStage 1 — Mode A inline session.\n')).toHaveLength(0);
  });

  // ---- Live-tree sweep: every tracked kickoff is clean (or explicitly escaped) ----
  const kickoffs = trackedKickoffs();

  it.skipIf(kickoffs.length === 0)(
    'all tracked kickoffs are free of unescaped Agent-tool write-dispatch instructions',
    () => {
      const violations: string[] = [];
      for (const rel of kickoffs) {
        const hits = findViolations(readFileSync(resolve(REPO_ROOT, rel), 'utf8'));
        for (const h of hits) {
          violations.push(`${rel}:${h.line}  ${h.text}`);
        }
      }
      expect(
        violations,
        `Kickoffs instruct Agent-tool write-dispatch of a Worker ` +
          `(append "<!-- ${ESCAPE_TOKEN} <reason> -->" if a line legitimately quotes/teaches the rule):\n` +
          violations.join('\n'),
      ).toHaveLength(0);
    },
  );
});
