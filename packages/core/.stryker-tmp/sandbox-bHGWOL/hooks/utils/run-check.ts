/**
 * run-check.ts — testable external-command runner for the pre-push hook.
 *
 * ADAPT of Aider's `Linter.run_cmd` (`Aider-AI/aider`, aider/linter.py): run an
 * external command via the OS, capture exit code + stdout + stderr, route on the
 * result. The matched slice is the part Aider itself unit-tests by mocking the
 * subprocess boundary (`@patch("subprocess.Popen")`); the LLM-fix-loop layer
 * (Aider's `Coder`) does NOT transfer to a pre-push gate, so it is dropped.
 * Prior-art / T16 problem-class analysis:
 *   docs/meta-factory/research-patches/2026-05-16-§13.33-hook-architecture-research.md §4.8.X.1
 *
 * Difference from upstream: we add a **timeout** case Aider omits — a hung
 * actionlint / lychee must not hang the hook — so coverage strictly exceeds it.
 */
// @ts-nocheck

import { spawnSync } from 'node:child_process';

export interface CheckResult {
  /** Process exit code; synthesised for timeout (124) and spawn-failure (127). */
  exitCode: number;
  stdout: string;
  stderr: string;
  /** True when the command was killed for exceeding `timeoutMs`. */
  timedOut: boolean;
  /** True when the command binary could not be located (ENOENT). */
  notFound: boolean;
}

export interface RunCheckOptions {
  cwd?: string;
  /** Wall-clock cap; the child is killed with SIGTERM past this. Default 120s. */
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export const DEFAULT_TIMEOUT_MS = 120_000;
/** Conventional exit code for a command terminated by timeout (matches `timeout(1)`). */
export const TIMEOUT_EXIT_CODE = 124;
/** Conventional exit code for "command not found / not executable". */
export const SPAWN_FAILURE_EXIT_CODE = 127;

/**
 * Run `cmd args` synchronously, capturing exit code + output. Never throws on a
 * non-zero exit or a missing binary — the caller routes on the returned shape.
 */
export function runCheck(
  cmd: string,
  args: readonly string[] = [],
  opts: RunCheckOptions = {},
): CheckResult {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const result = spawnSync(cmd, args as string[], {
    cwd: opts.cwd,
    env: opts.env ?? process.env,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 32 * 1024 * 1024,
  });

  const errCode = (result.error as NodeJS.ErrnoException | undefined)?.code;
  // spawnSync sets `error` (code ETIMEDOUT) AND `signal` (the killSignal,
  // default SIGTERM) on timeout. ETIMEDOUT is the precise signal; SIGTERM is a
  // fallback for runtimes that surface only the signal.
  const timedOut = errCode === 'ETIMEDOUT' || result.signal === 'SIGTERM';
  const notFound = errCode === 'ENOENT';

  let exitCode: number;
  if (timedOut) {
    exitCode = TIMEOUT_EXIT_CODE;
  } else if (result.error) {
    // Could not be spawned (e.g. ENOENT, EACCES) — no status to report.
    exitCode = SPAWN_FAILURE_EXIT_CODE;
  } else {
    // status is null only for unusual signal exits; treat as failure.
    exitCode = result.status ?? 1;
  }

  // On a spawn failure the OS leaves stderr null/empty; surface the error
  // message so the operator sees *why* (e.g. the ENOENT for a missing binary).
  let stderr = result.stderr ?? '';
  if (result.error && stderr.length === 0) {
    stderr = `${result.error.message}\n`;
  }

  return {
    exitCode,
    stdout: result.stdout ?? '',
    stderr,
    timedOut,
    notFound,
  };
}
