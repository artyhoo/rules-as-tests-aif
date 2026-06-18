/**
 * Isolated baseline dispatch for the pressure-scenario generator (Pass-1 RED).
 *
 * Spawns `claude -p "<prompt>"` from a temp directory under /tmp (outside the
 * repo tree) so that Claude's upward CLAUDE.md/.claude discovery finds nothing.
 * See isolation.md §2 for the mechanism rationale and §3 for the contamination proof.
 *
 * No --bare flag: plain OAuth keychain auth works from /tmp without an API key.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'INFO';
const LOG_PREFIX = '[psg/isolation]';
const MAX_OUTPUT_BYTES = 8 * 1024; // 8 KB cap

function logDebug(msg: string): void {
  if (LOG_LEVEL === 'DEBUG') process.stderr.write(`DEBUG ${LOG_PREFIX} ${msg}\n`);
}
function logWarn(msg: string): void {
  process.stderr.write(`WARN  ${LOG_PREFIX} ${msg}\n`);
}
function logError(msg: string): void {
  process.stderr.write(`ERROR ${LOG_PREFIX} ${msg}\n`);
}

export interface BaselineDispatchResult {
  output: string;
  exitCode: number;
  /** True when the dispatch ran from a directory guaranteed outside the repo tree */
  isolated: boolean;
}

/**
 * Dispatches `claude -p "<prompt>"` from a freshly created temp directory under
 * /tmp (or os.tmpdir() on non-POSIX systems), captures stdout, and removes the
 * temp directory on completion.
 *
 * Throws if:
 *  - `claude` is not found on PATH
 *  - The temp directory would resolve inside the repo tree (contamination risk)
 *  - The dispatch exits non-zero (unexpected CLI error)
 */
export async function dispatchIsolatedBaseline(prompt: string): Promise<BaselineDispatchResult> {
  // Verify claude CLI is on PATH
  const claudeBin = resolveClaude();

  // Create temp dir outside repo
  const tmpBase = os.tmpdir(); // /tmp on Linux/macOS, %TEMP% on Windows
  const tmpDir = fs.mkdtempSync(path.join(tmpBase, 'psg-baseline-'));

  // Safety check: tmpDir must NOT be inside the repo tree
  const repoRoot = detectRepoRoot();
  if (repoRoot && tmpDir.startsWith(repoRoot)) {
    fs.rmdirSync(tmpDir);
    const msg = `CWD ${tmpDir} is inside repo tree ${repoRoot} — contamination risk! Aborting.`;
    logError(msg);
    throw new Error(msg);
  }

  logDebug(`dispatch command: claude -p "..." cwd=${tmpDir} ambient-rules-visible=no`);
  logDebug(`prompt length: ${prompt.length} chars`);

  try {
    const result = spawnSync(claudeBin, ['-p', prompt], {
      cwd: tmpDir,
      encoding: 'utf8',
      maxBuffer: MAX_OUTPUT_BYTES * 2,
      timeout: 120_000, // 2 minutes per pass
    });

    if (result.error) {
      logError(`spawn error: ${String(result.error)}`);
      throw result.error;
    }

    const output = (result.stdout ?? '').slice(0, MAX_OUTPUT_BYTES);
    const exitCode = result.status ?? 0;

    logDebug(`dispatch complete cwd=${tmpDir} ambient-rules-visible=no exit=${exitCode}`);
    logDebug(`output preview: ${output.slice(0, 200).replace(/\n/g, '↵')}`);

    if (exitCode !== 0) {
      const stderr = (result.stderr ?? '').slice(0, 500);
      logWarn(`non-zero exit (${exitCode}): ${stderr}`);
    }

    return { output, exitCode, isolated: true };
  } finally {
    // Always clean up the temp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      logWarn(`failed to clean up temp dir: ${tmpDir}`);
    }
  }
}

/** Resolve `claude` binary path; throws with actionable message if absent. */
function resolveClaude(): string {
  try {
    const result = execFileSync('which', ['claude'], { encoding: 'utf8' }).trim();
    logDebug(`claude binary: ${result}`);
    return result;
  } catch {
    throw new Error(
      'ERROR [psg/isolation] `claude` CLI not found on PATH.\n' +
        'Install Claude Code CLI: https://docs.anthropic.com/en/docs/claude-code',
    );
  }
}

/** Detect the repo root by walking up from process.cwd() looking for .git */
function detectRepoRoot(): string | null {
  let dir = process.cwd();
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}
