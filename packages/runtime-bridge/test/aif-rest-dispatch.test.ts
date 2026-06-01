/**
 * Tests for AifHandoffBackend.dispatch() over REST (:3009).
 *
 * Verdict source: docs/meta-factory/research-patches/2026-05-31-runtime-bridge-mcp-dispatch-fix.md
 * (REST-now + MCP-target). These tests assert the 4-step planner-skip REST
 * sequence + BackendError mapping. Live HTTP mechanics were verified against a
 * running instance in the R-phase; these unit tests lock the contract.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AifHandoffBackend } from '../src/AifHandoffBackend.js';
import { BackendError } from '../src/backend.js';
import type { KickoffSpec } from '../src/types.js';

const KICKOFF: KickoffSpec = {
  filePath: '/repo/.claude/orchestrator-prompts/demo-meta-launch/kickoff.md',
  content: '# Demo kickoff\nDo the thing.\n',
  umbrellaName: 'demo-meta-launch',
  contentHash: 'abc123',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AifHandoffBackend.dispatch() — REST 4-step sequence', () => {
  it('issues POST /tasks → PUT plan → POST events → PUT paused, in order, and returns the task id', async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method, body });
        // Step 1 (POST /tasks) returns the created task with an id.
        if (method === 'POST' && url.endsWith('/tasks')) {
          return Promise.resolve(jsonResponse({ id: 'task-123', status: 'backlog' }, 201));
        }
        // Steps 2-4 return empty 200.
        return Promise.resolve(new Response('', { status: 200 }));
      },
    );

    const backend = new AifHandoffBackend({
      baseUrl: 'http://localhost:3009',
      projectId: 'proj-uuid',
    });
    const handle = await backend.dispatch(KICKOFF);

    expect(handle.backend).toBe('aif-handoff');
    expect(handle.taskId).toBe('task-123');
    expect(fetchSpy).toHaveBeenCalledTimes(4);

    expect(calls[0]).toMatchObject({ url: 'http://localhost:3009/tasks', method: 'POST' });
    expect(calls[0].body).toMatchObject({ projectId: 'proj-uuid', paused: true, plannerMode: 'fast' });
    expect(calls[1]).toMatchObject({ url: 'http://localhost:3009/tasks/task-123', method: 'PUT' });
    expect(calls[1].body).toMatchObject({ plan: KICKOFF.content });
    expect(calls[2]).toMatchObject({
      url: 'http://localhost:3009/tasks/task-123/events',
      method: 'POST',
    });
    expect(calls[2].body).toMatchObject({ event: 'accept_existing_plan' });
    expect(calls[3]).toMatchObject({ url: 'http://localhost:3009/tasks/task-123', method: 'PUT' });
    expect(calls[3].body).toMatchObject({ paused: false });
  });

  it('throws dispatch_failed (no fetch) when projectId is unset', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const backend = new AifHandoffBackend({ baseUrl: 'http://localhost:3009' });
    await expect(backend.dispatch(KICKOFF)).rejects.toMatchObject({
      code: 'dispatch_failed',
      backend: 'aif-handoff',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws dispatch_failed when POST /tasks returns no id', async () => {
    // mockImplementation → a fresh Response per call (bodies are single-read).
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(jsonResponse({ notAnId: true }, 201)),
    );
    const backend = new AifHandoffBackend({ baseUrl: 'http://localhost:3009', projectId: 'p' });
    const err = await backend.dispatch(KICKOFF).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BackendError);
    expect(err).toMatchObject({ code: 'dispatch_failed', backend: 'aif-handoff' });
  });

  it('maps the dirty-worktree 4xx guard to dispatch_failed AND rolls back (DELETE) the half-created task', async () => {
    const calls: Array<{ url: string; method: string }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        calls.push({ url, method });
        if (method === 'POST' && url.endsWith('/tasks')) {
          return Promise.resolve(jsonResponse({ id: 'task-9', status: 'backlog' }, 201));
        }
        if (url.endsWith('/events')) {
          return Promise.resolve(
            new Response('Branch isolation failure (dirty_worktree): uncommitted changes', {
              status: 409,
            }),
          );
        }
        return Promise.resolve(new Response('', { status: 200 }));
      },
    );
    const backend = new AifHandoffBackend({ baseUrl: 'http://localhost:3009', projectId: 'p' });
    await expect(backend.dispatch(KICKOFF)).rejects.toMatchObject({
      code: 'dispatch_failed',
      backend: 'aif-handoff',
    });
    // Rollback: the created task must be DELETEd so no orphan is stranded.
    expect(calls).toContainEqual({ url: 'http://localhost:3009/tasks/task-9', method: 'DELETE' });
  });

  it('maps HTTP 429 to quota_exceeded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('slow down', { status: 429 }));
    const backend = new AifHandoffBackend({ baseUrl: 'http://localhost:3009', projectId: 'p' });
    await expect(backend.dispatch(KICKOFF)).rejects.toMatchObject({ code: 'quota_exceeded' });
  });

  it('maps a connection failure to unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNREFUSED' } }),
    );
    const backend = new AifHandoffBackend({ baseUrl: 'http://localhost:3009', projectId: 'p' });
    await expect(backend.dispatch(KICKOFF)).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('REST dispatch targets baseUrl and never the (reserved) mcpUrl', async () => {
    const urls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        urls.push(String(input));
        const method = init?.method ?? 'GET';
        if (method === 'POST' && String(input).endsWith('/tasks')) {
          return Promise.resolve(jsonResponse({ id: 't1' }, 201));
        }
        return Promise.resolve(new Response('', { status: 200 }));
      },
    );
    const backend = new AifHandoffBackend({
      baseUrl: 'http://localhost:3009',
      mcpUrl: 'http://localhost:9999', // distinct sentinel — REST dispatch must never hit it
      projectId: 'p',
    });
    await backend.dispatch(KICKOFF);
    expect(backend.mcpUrl).toBe('http://localhost:9999');
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((u) => u.startsWith('http://localhost:3009'))).toBe(true);
    expect(urls.some((u) => u.includes(':9999'))).toBe(false);
  });

  it('defaults mcpUrl to :3100 when not configured', () => {
    const backend = new AifHandoffBackend({ baseUrl: 'http://localhost:3009', projectId: 'p' });
    expect(backend.mcpUrl).toBe('http://localhost:3100');
  });
});
