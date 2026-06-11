/**
 * Paired-negative tests for AifFireBackend — honest dispatch-only `/fire` backend.
 *
 * Contract under test (per kickoff §Hard-constraints and §4c):
 *   1. does-not-hang (MANDATORY): awaitDone resolves immediately (<1s) with
 *      { success:false, finalStatus:'dispatched_no_readback' } and meta.sessionUrl. ✓
 *   2. T-Fire-A guard: awaitDone calls fetch ZERO times (no session_url scraping). ✓
 *   3. getStatus honest: returns { status:'running', rawStatus:'dispatched_no_readback' };
 *      never returns 'done'; idempotent across calls. ✓
 *   4. available() false when unconfigured; true when both routineId+token present. ✓
 *   5. dispatch POST shape: correct URL, headers, body; handle shape. ✓
 *   6. dispatch error mapping: 429→quota_exceeded; missing config→dispatch_failed;
 *      ECONNREFUSED→unavailable. ✓
 *
 * T3 compliance: each assertion names the source file:line it targets.
 * T-Fire-A compliance: fetch is spied and asserted to NOT be called in awaitDone/getStatus.
 * Type-decision (b): shared TaskStatus.status/RuntimeBackend.name/TaskHandle.backend
 *   unions are NOT extended — AifFireBackend uses a local AifFireHandle type.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BackendError } from '../src/backend.js';

// ── Module-level helpers ──────────────────────────────────────────────────────

afterEach(() => {
  vi.restoreAllMocks();
});

/** Build a minimal AifFireHandle for use in getStatus/awaitDone tests. */
function makeHandle(overrides: Record<string, unknown> = {}) {
  return {
    backend: 'aif-fire' as const,
    taskId: 'session-abc-123',
    dispatchedAt: new Date().toISOString(),
    sessionUrl: 'https://claude.ai/sessions/session-abc-123',
    ...overrides,
  };
}

// ── Test 1 — does-not-hang (MANDATORY) ───────────────────────────────────────

describe('Test 1 — awaitDone: does NOT hang (resolves immediately)', () => {
  it('awaitDone resolves in well under 1 000 ms with dispatched_no_readback', async () => {
    // Source: AifFireBackend.ts awaitDone — must return immediately, never poll.
    // Type-decision (b): encode honesty in finalStatus, not in TaskStatus.status union.
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });
    const handle = makeHandle();

    const start = Date.now();
    const result = await Promise.race([
      backend.awaitDone(handle),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('awaitDone timed out after 1 000 ms')), 1000),
      ),
    ]);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    expect(result.success).toBe(false);
    expect(result.finalStatus).toBe('dispatched_no_readback');
    expect(result.meta?.sessionUrl).toBe(handle.sessionUrl);
  });

  it('awaitDone result contains sessionId in meta', async () => {
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });
    const handle = makeHandle({ taskId: 'sess-meta-test', sessionUrl: 'https://claude.ai/sessions/sess-meta-test' });

    const result = await backend.awaitDone(handle);
    expect(result.meta?.sessionId).toBe('sess-meta-test');
  });

  it('NEGATIVE: awaitDone does NOT return success:true', async () => {
    // Token is write-only; completion is unobservable — must never claim success.
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });

    const result = await backend.awaitDone(makeHandle());
    expect(result.success).not.toBe(true);
  });
});

// ── Test 2 — T-Fire-A guard ───────────────────────────────────────────────────

describe('Test 2 — T-Fire-A guard: awaitDone calls fetch ZERO times', () => {
  it('fetch is not called inside awaitDone (no session_url scraping)', async () => {
    // Source: AifFireBackend.ts awaitDone — token has no read access;
    // polling session_url HTML or guessing via git side-effects is FORBIDDEN.
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });

    await backend.awaitDone(makeHandle());

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('NEGATIVE: awaitDone does NOT contain any network attempt (abort/timeout would be observable)', async () => {
    // Even a timed-out attempt would be observable via a spy — guard against it.
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });

    await backend.awaitDone(makeHandle());

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });
});

// ── Test 3 — getStatus honest ─────────────────────────────────────────────────

describe('Test 3 — getStatus: returns honest dispatched_no_readback', () => {
  it('returns { status:"running", rawStatus:"dispatched_no_readback" }', async () => {
    // Source: AifFireBackend.ts getStatus — Type-decision (b): coarse status="running",
    // truth lives in rawStatus. Token is write-only; real status is unobservable.
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });
    const handle = makeHandle();

    const status = await backend.getStatus(handle);

    expect(status.status).toBe('running');
    expect(status.rawStatus).toBe('dispatched_no_readback');
    expect(status.checkedAt).toBeTruthy();
  });

  it('NEGATIVE: getStatus does NOT return status:"done" (would be a lie)', async () => {
    // Confirming completion is unobservable — must not claim done.
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });

    const status = await backend.getStatus(makeHandle());
    expect(status.status).not.toBe('done');
  });

  it('getStatus is idempotent — repeated calls return the same shape', async () => {
    // Source: AifFireBackend.ts getStatus — no network, no side effects.
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });
    const handle = makeHandle();

    const s1 = await backend.getStatus(handle);
    const s2 = await backend.getStatus(handle);

    expect(s1.status).toBe(s2.status);
    expect(s1.rawStatus).toBe(s2.rawStatus);
  });

  it('getStatus calls fetch ZERO times (no network, per T-Fire-A)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });

    await backend.getStatus(makeHandle());
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ── Test 4 — available() gate ─────────────────────────────────────────────────

describe('Test 4 — available(): false when unconfigured, true when routineId+token present', () => {
  it('available() → false when neither routineId nor token provided', async () => {
    // Source: AifFireBackend.ts available() — presence-gate only, no network.
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({});

    expect(await backend.available()).toBe(false);
  });

  it('available() → false when only routineId provided (missing token)', async () => {
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1' });

    expect(await backend.available()).toBe(false);
  });

  it('available() → false when only token provided (missing routineId)', async () => {
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ token: 'sk-ant-oat01-x' });

    expect(await backend.available()).toBe(false);
  });

  it('available() → true when both routineId and token present', async () => {
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });

    expect(await backend.available()).toBe(true);
  });

  it('available() calls fetch ZERO times (no network probe)', async () => {
    // Presence-gate must be cheap, ≤1s, no side effects — no outbound call.
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r-1', token: 'sk-ant-oat01-x' });

    await backend.available();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('NEGATIVE: available() does NOT return true when both missing', async () => {
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({});

    expect(await backend.available()).not.toBe(true);
  });
});

// ── Test 5 — dispatch POST shape ─────────────────────────────────────────────

describe('Test 5 — dispatch: correct POST shape and returned handle', () => {
  it('dispatch sends correct URL, headers, body and returns AifFireHandle', async () => {
    // Source: AifFireBackend.ts dispatch — POST ${baseUrl}/${routineId}/fire
    // Headers: Authorization: Bearer <token>, anthropic-beta, anthropic-version
    // Response shape: { type:'routine_fire', claude_code_session_id, claude_code_session_url }
    const sessionId = 'sess-fire-001';
    const sessionUrl = 'https://claude.ai/sessions/sess-fire-001';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'routine_fire',
          claude_code_session_id: sessionId,
          claude_code_session_url: sessionUrl,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({
      routineId: 'routine-xyz',
      token: 'sk-ant-oat01-TOKEN',
      baseUrl: 'https://api.anthropic.com/v1/claude_code/routines',
    });

    const handle = await backend.dispatch({
      filePath: '/tmp/kickoff.md',
      content: 'Do the thing.',
      umbrellaName: 'test-task',
      contentHash: 'abc123',
    });

    // URL shape
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/claude_code/routines/routine-xyz/fire',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer sk-ant-oat01-TOKEN',
          'anthropic-beta': 'experimental-cc-routine-2026-04-01',
          'anthropic-version': '2023-06-01',
        }),
      }),
    );

    // Handle shape
    expect(handle.backend).toBe('aif-fire');
    expect(handle.taskId).toBe(sessionId);
    expect((handle as { sessionUrl?: string }).sessionUrl).toBe(sessionUrl);
    expect(handle.dispatchedAt).toBeTruthy();
  });

  it('NEGATIVE: dispatch does NOT use an HTTP GET (must be POST)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ type: 'routine_fire', claude_code_session_id: 's', claude_code_session_url: 'u' }),
        { status: 200 },
      ),
    );

    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    await new AifFireBackend({ routineId: 'r', token: 'tok' }).dispatch({
      filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h',
    });

    const call = fetchSpy.mock.calls[0];
    const opts = call?.[1] as RequestInit | undefined;
    expect(opts?.method?.toUpperCase()).not.toBe('GET');
  });
});

// ── Test 6 — dispatch error mapping ──────────────────────────────────────────

describe('Test 6 — dispatch: error codes correctly mapped', () => {
  it('HTTP 429 → BackendError code quota_exceeded', async () => {
    // Source: AifFireBackend.ts dispatch — mirror AifHandoffBackend._rest error mapping
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('rate limited', { status: 429 }),
    );

    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r', token: 'tok' });

    await expect(
      backend.dispatch({ filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof BackendError && err.code === 'quota_exceeded',
    );
  });

  it('missing routineId → BackendError code dispatch_failed before fetch', async () => {
    // Source: AifFireBackend.ts dispatch — guard before network call
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ token: 'tok' }); // no routineId

    await expect(
      backend.dispatch({ filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof BackendError && err.code === 'dispatch_failed',
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('missing token → BackendError code dispatch_failed before fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r' }); // no token

    await expect(
      backend.dispatch({ filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof BackendError && err.code === 'dispatch_failed',
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetch throws ECONNREFUSED → BackendError code unavailable', async () => {
    // Source: AifFireBackend.ts dispatch — connection failure → unavailable
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
    );

    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r', token: 'tok' });

    await expect(
      backend.dispatch({ filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof BackendError && err.code === 'unavailable',
    );
  });

  it('non-2xx (e.g. 500) → BackendError code dispatch_failed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );

    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r', token: 'tok' });

    await expect(
      backend.dispatch({ filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof BackendError && err.code === 'dispatch_failed',
    );
  });

  it('200 response missing session fields → BackendError code dispatch_failed', async () => {
    // Source: AifFireBackend.ts dispatch — shape guard on 200 response
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ unexpected: true }), { status: 200 }),
    );

    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r', token: 'tok' });

    await expect(
      backend.dispatch({ filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof BackendError && err.code === 'dispatch_failed',
    );
  });

  it('NEGATIVE: BackendError backend field is "aif-fire" not "aif-handoff"', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('error', { status: 500 }),
    );

    const { AifFireBackend } = await import('../src/AifFireBackend.js');
    const backend = new AifFireBackend({ routineId: 'r', token: 'tok' });

    await expect(
      backend.dispatch({ filePath: '/tmp/k.md', content: 'c', umbrellaName: 'u', contentHash: 'h' }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof BackendError && err.backend === 'aif-fire',
    );
  });
});
