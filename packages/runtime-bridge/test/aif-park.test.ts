// packages/runtime-bridge/test/aif-park.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseParkArgs, validateParkArgs, buildOpenQuestionPlan } from '../src/cli/park.js';
import { parkTask } from '../src/cli/park.js';

afterEach(() => vi.restoreAllMocks());

describe('parseParkArgs', () => {
  it('reads --task and --question; --task overrides HANDOFF_TASK_ID env', () => {
    const args = parseParkArgs(['--task', 't-9', '--question', 'tone: A or B?'], { HANDOFF_TASK_ID: 't-env' });
    expect(args).toMatchObject({ taskId: 't-9', question: 'tone: A or B?', json: false });
  });
  it('falls back to HANDOFF_TASK_ID when --task is absent', () => {
    const args = parseParkArgs(['--question', 'q'], { HANDOFF_TASK_ID: 't-env' });
    expect(args.taskId).toBe('t-env');
  });
});

describe('validateParkArgs', () => {
  it('rejects a missing task id', () => {
    expect(validateParkArgs({ taskId: undefined, question: 'q', json: false })).toMatch(/missing.*task/i);
  });
  it('rejects an empty question', () => {
    expect(validateParkArgs({ taskId: 't-1', question: '   ', json: false })).toMatch(/question/i);
  });
  it('accepts a valid pair', () => {
    expect(validateParkArgs({ taskId: 't-1', question: 'q', json: false })).toBeNull();
  });
});

describe('buildOpenQuestionPlan', () => {
  it('appends a marked OPEN QUESTION block to the existing plan', () => {
    const out = buildOpenQuestionPlan('# Plan\n- step 1', 'tagline tone: A=playful / B=serious');
    expect(out).toContain('# Plan\n- step 1');
    expect(out).toContain('## ⏸ OPEN QUESTION (awaiting operator)');
    expect(out).toContain('tagline tone: A=playful / B=serious');
  });
  it('handles a null/empty existing plan', () => {
    expect(buildOpenQuestionPlan(null, 'q')).toContain('## ⏸ OPEN QUESTION (awaiting operator)');
  });
});

function okResponse(body: unknown = {}, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('parkTask — GET current plan then PUT the park fields', () => {
  it('GETs the task, then PUTs { paused, blockedReason, plan-with-OPEN-QUESTION }', async () => {
    const task = { id: 't-9', title: 'x', status: 'implementing', plan: '# Plan', paused: false, blockedReason: null };
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) =>
      Promise.resolve(
        String(url).endsWith('/tasks/t-9') ? okResponse(task) : okResponse({ ...task, paused: true }),
      ),
    );
    const q = 'tagline tone: A=playful / B=serious';
    await parkTask('http://localhost:3009', 't-9', q);

    expect((spy.mock.calls[0][1] as RequestInit).method).toBe('GET');
    const put = spy.mock.calls[1][1] as RequestInit;
    expect(put.method).toBe('PUT');
    const body = JSON.parse(put.body as string);
    expect(body.blockedReason).toBe(q);
    expect(body.plan).toContain('## ⏸ OPEN QUESTION (awaiting operator)');
  });

  // ── THE GUARD (spec §4): paused:true is the stop, NOT blockedReason alone (F2/F3). ──
  // If a refactor ever regresses park to blockedReason-only, this fails loudly —
  // turning the undocumented "coordinator skips paused" dependency into an executable one.
  it('GUARD: the PUT body sets paused === true (blockedReason-only would NOT stop the agent)', async () => {
    const task = { id: 't-9', title: 'x', status: 'implementing', plan: '# Plan', paused: false, blockedReason: null };
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) =>
      Promise.resolve(String(url).endsWith('/tasks/t-9') ? okResponse(task) : okResponse({})),
    );
    await parkTask('http://localhost:3009', 't-9', 'q');
    const putBody = JSON.parse((spy.mock.calls[1][1] as RequestInit).body as string);
    expect(putBody.paused).toBe(true);
  });
});
