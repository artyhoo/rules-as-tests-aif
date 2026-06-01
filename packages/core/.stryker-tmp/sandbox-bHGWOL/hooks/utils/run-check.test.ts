/**
 * Paired-negative + behaviour tests for runCheck().
 *
 * Mocks the `child_process` boundary à la Aider's `@patch("subprocess.Popen")`
 * (test_linter.py) — no real shell-outs. Covers the cases Aider's test covers
 * (non-zero exit, stderr capture) PLUS the timeout case Aider omits, which is
 * the gap this port deliberately exceeds (research patch §4.8.X.1).
 */
// @ts-nocheck

import { describe, it, expect, vi, beforeEach } from 'vitest';

const spawnSyncMock = vi.fn();
vi.mock('node:child_process', () => ({
  spawnSync: (...args: unknown[]) => spawnSyncMock(...args),
}));

const {
  runCheck,
  DEFAULT_TIMEOUT_MS,
  TIMEOUT_EXIT_CODE,
  SPAWN_FAILURE_EXIT_CODE,
} = await import('./run-check.ts');

type SpawnReturn = {
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string | null;
  stderr: string | null;
  error?: NodeJS.ErrnoException;
};
const ret = (o: Partial<SpawnReturn>): SpawnReturn => ({
  status: 0,
  signal: null,
  stdout: '',
  stderr: '',
  error: undefined,
  ...o,
});

describe('runCheck', () => {
  beforeEach(() => spawnSyncMock.mockReset());

  it('returns exit 0 + stdout on success', () => {
    spawnSyncMock.mockReturnValue(ret({ status: 0, stdout: 'ok\n' }));
    const r = runCheck('echo', ['hi']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toBe('ok\n');
    expect(r.timedOut).toBe(false);
    expect(r.notFound).toBe(false);
  });

  it('propagates a non-zero exit code and stderr (Aider non-zero case)', () => {
    spawnSyncMock.mockReturnValue(ret({ status: 2, stderr: 'boom\n' }));
    const r = runCheck('actionlint', []);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toBe('boom\n');
    expect(r.timedOut).toBe(false);
  });

  it('maps an ETIMEDOUT timeout to exit 124 + timedOut (case Aider omits)', () => {
    const error = Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' });
    spawnSyncMock.mockReturnValue(
      ret({ status: null, signal: 'SIGTERM', stdout: 'partial', error }),
    );
    const r = runCheck('lychee', ['--offline'], { timeoutMs: 5 });
    expect(r.timedOut).toBe(true);
    expect(r.exitCode).toBe(TIMEOUT_EXIT_CODE);
  });

  it('detects a timeout from ETIMEDOUT alone (no SIGTERM signal)', () => {
    // Isolates the errCode branch from the signal fallback.
    const error = Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' });
    spawnSyncMock.mockReturnValue(ret({ status: null, signal: null, error }));
    const r = runCheck('slow', []);
    expect(r.timedOut).toBe(true);
    expect(r.exitCode).toBe(TIMEOUT_EXIT_CODE);
  });

  it('treats a bare SIGTERM (no error object) as a timeout too', () => {
    spawnSyncMock.mockReturnValue(ret({ status: null, signal: 'SIGTERM' }));
    const r = runCheck('hang', []);
    expect(r.timedOut).toBe(true);
    expect(r.exitCode).toBe(TIMEOUT_EXIT_CODE);
  });

  it('flags notFound + exit 127 when the binary is missing (ENOENT)', () => {
    const error = Object.assign(new Error('spawn missing ENOENT'), { code: 'ENOENT' });
    spawnSyncMock.mockReturnValue(ret({ status: null, error }));
    const r = runCheck('missing-tool', []);
    expect(r.notFound).toBe(true);
    expect(r.timedOut).toBe(false);
    expect(r.exitCode).toBe(SPAWN_FAILURE_EXIT_CODE);
    expect(r.stderr).toContain('ENOENT');
  });

  it('maps a non-ENOENT spawn error (e.g. EACCES) to exit 127 without notFound', () => {
    const error = Object.assign(new Error('permission denied'), { code: 'EACCES' });
    spawnSyncMock.mockReturnValue(ret({ status: null, error }));
    const r = runCheck('blocked', []);
    expect(r.notFound).toBe(false);
    expect(r.exitCode).toBe(SPAWN_FAILURE_EXIT_CODE);
  });

  it('preserves real stderr on a spawn error instead of overwriting with the message', () => {
    // Guards the `stderr.length === 0` condition: a non-empty stderr wins.
    const error = Object.assign(new Error('boom message'), { code: 'EACCES' });
    spawnSyncMock.mockReturnValue(ret({ status: null, stderr: 'actual stderr\n', error }));
    const r = runCheck('blocked', []);
    expect(r.stderr).toBe('actual stderr\n');
    expect(r.stderr).not.toContain('boom message');
  });

  it('coerces a null status (signal exit, no error) to exit 1', () => {
    spawnSyncMock.mockReturnValue(ret({ status: null, signal: 'SIGINT' }));
    const r = runCheck('interrupted', []);
    expect(r.exitCode).toBe(1);
    expect(r.timedOut).toBe(false);
  });

  it('passes cwd / args / timeout / env through to spawnSync', () => {
    spawnSyncMock.mockReturnValue(ret({}));
    const env = { FOO: 'bar' } as NodeJS.ProcessEnv;
    runCheck('git', ['status'], { cwd: '/tmp/x', timeoutMs: 9999, env });
    const [cmd, args, options] = spawnSyncMock.mock.calls[0];
    expect(cmd).toBe('git');
    expect(args).toEqual(['status']);
    expect(options.cwd).toBe('/tmp/x');
    expect(options.timeout).toBe(9999);
    expect(options.env).toBe(env);
    expect(options.encoding).toBe('utf8');
  });

  // Guards the ArithmeticOperator mutants on maxBuffer (32 * 1024 * 1024).
  // Mutations produce 32 (32 * 1024 / 1024) or 32 (32 / 1024 * 1024 ≈ 32).
  // Both are far below the intended 32 MB; asserting > 1 MB kills both survivors.
  it('passes a maxBuffer of at least 1 MB to spawnSync (guards 32*1024*1024 arithmetic)', () => {
    spawnSyncMock.mockReturnValue(ret({}));
    runCheck('git', ['status']);
    const options = spawnSyncMock.mock.calls[0][2];
    expect(options.maxBuffer).toBe(32 * 1024 * 1024); // exact: 33_554_432
  });

  it('defaults the timeout to DEFAULT_TIMEOUT_MS', () => {
    spawnSyncMock.mockReturnValue(ret({}));
    runCheck('git', ['status']);
    expect(spawnSyncMock.mock.calls[0][2].timeout).toBe(DEFAULT_TIMEOUT_MS);
  });

  it('defaults args to an empty array', () => {
    spawnSyncMock.mockReturnValue(ret({}));
    runCheck('actionlint');
    expect(spawnSyncMock.mock.calls[0][1]).toEqual([]);
  });
});
