// packages/runtime-bridge/test/harvest.test.ts
import { describe, it, expect, vi } from 'vitest';
import { harvestTask } from '../src/harvest.js';
import type { HarvestDeps } from '../src/harvest.js';

/** A deps double that records call order; each fn resolves successfully by default. */
function makeDeps(over: Partial<HarvestDeps> = {}): { deps: HarvestDeps; calls: string[] } {
  const calls: string[] = [];
  const deps: HarvestDeps = {
    pushBranch: vi.fn(async (b: string) => {
      calls.push(`push:${b}`);
    }),
    createPr: vi.fn(async (o) => {
      calls.push(`pr:${o.branch}->${o.base}`);
      return 'https://github.com/x/y/pull/42';
    }),
    enableAutoMerge: vi.fn(async (url: string) => {
      calls.push(`automerge:${url}`);
    }),
    ...over,
  };
  return { deps, calls };
}

const DONE_TASK = { id: 't1', title: 'feat: thing', status: 'done', branchName: 'feature/thing-abc' };

describe('harvestTask — positive', () => {
  it('pushes branch, opens PR vs base, enables auto-merge, returns PR url (in order)', async () => {
    const { deps, calls } = makeDeps();
    const res = await harvestTask(DONE_TASK, { baseBranch: 'staging', body: 'B', autoMerge: true }, deps);
    expect(res).toEqual({ prUrl: 'https://github.com/x/y/pull/42', branch: 'feature/thing-abc', pushed: true, autoMerge: true });
    // push BEFORE pr BEFORE automerge — ordering is load-bearing (can't PR an unpushed branch)
    expect(calls).toEqual(['push:feature/thing-abc', 'pr:feature/thing-abc->staging', 'automerge:https://github.com/x/y/pull/42']);
  });

  it('verified status is also harvestable (terminal)', async () => {
    const { deps } = makeDeps();
    const res = await harvestTask({ ...DONE_TASK, status: 'verified' }, { baseBranch: 'staging', body: 'B', autoMerge: false }, deps);
    expect(res.pushed).toBe(true);
  });

  it('autoMerge:false skips enableAutoMerge', async () => {
    const { deps } = makeDeps();
    await harvestTask(DONE_TASK, { baseBranch: 'staging', body: 'B', autoMerge: false }, deps);
    expect(deps.enableAutoMerge).not.toHaveBeenCalled();
  });
});

describe('harvestTask — paired-negative (must NOT push/PR on bad input)', () => {
  it('throws on non-terminal status and does NOT push (nothing to harvest yet)', async () => {
    const { deps } = makeDeps();
    await expect(
      harvestTask({ ...DONE_TASK, status: 'implementing' }, { baseBranch: 'staging', body: 'B', autoMerge: true }, deps),
    ).rejects.toThrow(/not terminal/i);
    expect(deps.pushBranch).not.toHaveBeenCalled();
    expect(deps.createPr).not.toHaveBeenCalled();
  });

  it('throws on missing branchName AFTER status ok, and does NOT open a PR', async () => {
    const { deps } = makeDeps();
    await expect(
      harvestTask({ ...DONE_TASK, branchName: undefined }, { baseBranch: 'staging', body: 'B', autoMerge: true }, deps),
    ).rejects.toThrow(/no branchName/i);
    expect(deps.createPr).not.toHaveBeenCalled();
  });

  it('does NOT enable auto-merge if PR creation throws (no half-merged state)', async () => {
    const { deps } = makeDeps({
      createPr: vi.fn(async () => {
        throw new Error('gh pr create failed');
      }),
    });
    await expect(harvestTask(DONE_TASK, { baseBranch: 'staging', body: 'B', autoMerge: true }, deps)).rejects.toThrow(
      /gh pr create failed/,
    );
    expect(deps.enableAutoMerge).not.toHaveBeenCalled();
  });
});
