// packages/runtime-bridge/test/aif-park-live.test.ts
import { describe, it, expect } from 'vitest';
import { getTask, putTask } from '../src/cli/aifHttp.js';

const LIVE = process.env.RUNTIME_BRIDGE_LIVE_AIF === '1';
const BASE = process.env.RUNTIME_BRIDGE_AIF_URL || 'http://localhost:3009';
const PID = process.env.RUNTIME_BRIDGE_AIF_PROJECT_ID;

describe.runIf(LIVE && !!PID)('LIVE contract: a paused task is not advanced by the coordinator (F10)', () => {
  it('creates a task, pauses it, and confirms it does not advance over a poll window', async () => {
    const created = await (await fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: PID, title: 'PARK-LIVE-PROBE-delete-me', description: 'guard', autoMode: false }),
    })).json() as { id: string };
    const id = created.id;
    try {
      await putTask(BASE, id, { paused: true, blockedReason: 'PARK-LIVE-PROBE' });
      const before = await getTask(BASE, id);
      await new Promise((r) => setTimeout(r, 15_000)); // > coordinator poll interval
      const after = await getTask(BASE, id);
      expect(after.paused).toBe(true);
      expect(after.blockedReason).toBe('PARK-LIVE-PROBE'); // not clobbered by the watchdog (F4)
      expect(after.status).toBe(before.status); // did not advance while paused
    } finally {
      await fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' }); // cleanup
    }
  }, 30_000);
});
