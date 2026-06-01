// packages/runtime-bridge/test/aif-http.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BackendError } from '../src/backend.js';
import { getTask, putTask } from '../src/cli/aifHttp.js';

function okResponse(body: unknown = {}, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => vi.restoreAllMocks());

describe('getTask', () => {
  it('GETs /tasks/:id and returns the parsed task', async () => {
    const task = { id: 't-1', title: 'x', status: 'implementing', plan: 'P', paused: false, blockedReason: null };
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(task));
    const got = await getTask('http://localhost:3009', 't-1');
    expect(spy.mock.calls[0][0]).toBe('http://localhost:3009/tasks/t-1');
    expect((spy.mock.calls[0][1] as RequestInit).method).toBe('GET');
    expect(got).toEqual(task);
  });
  it('maps a non-ok status to a dispatch_failed BackendError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ error: 'nope' }, 404));
    await expect(getTask('http://localhost:3009', 't-x')).rejects.toMatchObject({ code: 'dispatch_failed' });
  });
});

describe('putTask', () => {
  it('PUTs /tasks/:id with the JSON body', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({ id: 't-1', paused: true }));
    await putTask('http://localhost:3009', 't-1', { paused: true });
    expect(spy.mock.calls[0][0]).toBe('http://localhost:3009/tasks/t-1');
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ paused: true });
  });
  it('maps connection refusal to an unavailable BackendError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(putTask('http://localhost:3009', 't-1', {})).rejects.toBeInstanceOf(BackendError);
  });
});
