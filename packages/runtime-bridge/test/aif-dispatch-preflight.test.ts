// packages/runtime-bridge/test/aif-dispatch-preflight.test.ts
// "The dispatcher calls the doctor; the doctor heals." runPreflight is the env-gated,
// ship-safe, non-blocking seam dispatch.ts uses to invoke the aif-doctor heal entrypoint
// before a real dispatch (stale container base → false-`done` garbage; aif-doctor §3.4).
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runPreflight } from '../src/cli/dispatch.js';

const marker = join(tmpdir(), `aif-preflight-marker-${process.pid}.txt`);
afterEach(() => {
  if (existsSync(marker)) rmSync(marker);
});

describe('runPreflight — the doctor-heal seam', () => {
  it('NO-OP when RUNTIME_BRIDGE_PREFLIGHT is unset (ship-safe for consumers)', () => {
    runPreflight({});

    expect(existsSync(marker)).toBe(false);
  });

  it('runs the configured preflight command when the env var is set', () => {
    runPreflight({ RUNTIME_BRIDGE_PREFLIGHT: `touch '${marker}'` });

    expect(existsSync(marker)).toBe(true);
  });

  it('non-blocking: a failing preflight does NOT throw (dispatch must proceed)', () => {
    expect(() => runPreflight({ RUNTIME_BRIDGE_PREFLIGHT: 'exit 7' })).not.toThrow();
  });

  // Negative guard: proves the unset path truly skips execution — RED if runPreflight
  // ever starts running a default / hard-coded command when the env is empty.
  it('GUARD: unset env must NOT execute anything (no marker created)', () => {
    runPreflight({});

    expect(existsSync(marker)).not.toBe(true);
  });
});
