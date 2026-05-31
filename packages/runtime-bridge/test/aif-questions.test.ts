/**
 * Paired-positive/negative tests for the parked-question collector (cli/questions.ts).
 *
 * Contract under test (kickoff §10 acceptance criteria):
 *   POSITIVE — a list with one manualReviewRequired:true task → it is selected
 *              and printed in the human format. ✓
 *   NEGATIVE — a list where every task is done with no block flags →
 *              selected set empty → "No parked questions." ✓
 *   FILTER   — projectId mismatch → excluded. ✓
 *
 * Mocking strategy: vi.spyOn(globalThis, 'fetch') returning a Response, exactly
 *   like aif-rest-dispatch.test.ts / aif-status-readback.test.ts. The CLI's
 *   main() is entrypoint-guarded, so importing the module is a clean no-op.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchTasks,
  selectParked,
  isParked,
  parkedReason,
  formatHuman,
  parseQuestionsArgs,
} from '../src/cli/questions.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── POSITIVE ──────────────────────────────────────────────────────────────────
describe('POSITIVE — a manualReviewRequired task is selected and printed', () => {
  it('fetchTasks + selectParked picks the parked task; formatHuman prints it', async () => {
    // Source: cli/questions.ts isParked — manualReviewRequired === true branch.
    const tasks = [
      { id: 't-1', title: 'Done thing', status: 'done', manualReviewRequired: false },
      {
        id: 't-2',
        title: 'Needs a human',
        status: 'review',
        manualReviewRequired: true,
        blockedReason: 'Option A → X / Option B → Y',
        projectId: 'proj-1',
      },
    ];
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(tasks));

    const fetched = await fetchTasks('http://localhost:3009');
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3009/tasks',
      expect.objectContaining({ method: 'GET' }),
    );

    const parked = selectParked(fetched);
    expect(parked).toHaveLength(1);
    expect(parked[0].id).toBe('t-2');

    const out = formatHuman(parked);
    expect(out).toContain('id:     t-2');
    expect(out).toContain('Needs a human');
    expect(out).toContain('Option A → X / Option B → Y');
    expect(out).not.toBe('No parked questions.');
  });

  it('isParked is true for blocked_external and for a non-empty blockedReason', () => {
    expect(isParked({ id: 'a', title: 'A', status: 'blocked_external' })).toBe(true);
    expect(
      isParked({ id: 'b', title: 'B', status: 'review', blockedReason: 'stuck' }),
    ).toBe(true);
  });

  it('parkedReason falls back to a trimmed reviewComments excerpt when blockedReason is absent', () => {
    const long = 'x'.repeat(400);
    const reason = parkedReason({
      id: 'c',
      title: 'C',
      status: 'blocked_external',
      reviewComments: long,
    });
    expect(reason.length).toBeLessThanOrEqual(301); // 300 chars + ellipsis
    expect(reason.endsWith('…')).toBe(true);
  });
});

// ── NEGATIVE ──────────────────────────────────────────────────────────────────
describe('NEGATIVE — all tasks done with no block flags → No parked questions.', () => {
  it('selectParked is empty and formatHuman returns the empty sentinel', async () => {
    // Source: cli/questions.ts isParked — all three conditions false.
    const tasks = [
      { id: 'd-1', title: 'One', status: 'done', manualReviewRequired: false, blockedReason: null },
      { id: 'd-2', title: 'Two', status: 'done', manualReviewRequired: false, blockedReason: '' },
    ];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(tasks));

    const parked = selectParked(await fetchTasks('http://localhost:3009'));
    expect(parked).toHaveLength(0);
    expect(formatHuman(parked)).toBe('No parked questions.');
  });

  it('NEGATIVE: an empty blockedReason string does NOT count as parked', () => {
    expect(
      isParked({ id: 'e', title: 'E', status: 'done', blockedReason: '   ' }),
    ).toBe(false);
  });
});

// ── FILTER ────────────────────────────────────────────────────────────────────
describe('FILTER — projectId mismatch excludes the task', () => {
  it('a parked task in another project is filtered out', () => {
    // Source: cli/questions.ts selectParked — projectId guard.
    const tasks = [
      { id: 'p-1', title: 'Mine', status: 'blocked_external', projectId: 'mine' },
      { id: 'p-2', title: 'Theirs', status: 'blocked_external', projectId: 'theirs' },
    ];
    const parked = selectParked(tasks, 'mine');
    expect(parked).toHaveLength(1);
    expect(parked[0].id).toBe('p-1');
  });

  it('--project arg overrides the env project id', () => {
    const args = parseQuestionsArgs(['--project', 'cli-proj'], {
      RUNTIME_BRIDGE_AIF_PROJECT_ID: 'env-proj',
    } as NodeJS.ProcessEnv);
    expect(args.projectId).toBe('cli-proj');
    expect(args.json).toBe(false);
  });

  it('--json flag is parsed; env project id used when no --project arg', () => {
    const args = parseQuestionsArgs(['--json'], {
      RUNTIME_BRIDGE_AIF_PROJECT_ID: 'env-proj',
    } as NodeJS.ProcessEnv);
    expect(args.projectId).toBe('env-proj');
    expect(args.json).toBe(true);
  });
});

// ── FETCH ERROR ───────────────────────────────────────────────────────────────
describe('fetchTasks error handling', () => {
  it('throws when the response is not a JSON array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ not: 'an array' }));
    await expect(fetchTasks('http://localhost:3009')).rejects.toThrow(/did not return a JSON array/);
  });

  it('throws on a non-ok HTTP status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));
    await expect(fetchTasks('http://localhost:3009')).rejects.toThrow(/HTTP 500/);
  });
});
