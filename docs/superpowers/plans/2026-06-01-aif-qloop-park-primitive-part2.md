# aif Question-Loop PARK Primitive — Implementation Plan (Part 2 of 2: resume side)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. **Execute [Part 1](2026-06-01-aif-qloop-park-primitive-part1.md) FIRST** (it creates `aifHttp.ts`, which Part 2 imports).

**Goal (Part 2):** Add the symmetric operator-side resume for an A-park — `answer.ts --decision resume` unpauses the task and injects the answer into the plan — plus the optional live contract test and the agent's A-vs-B selection docs.

**Binding spec:** [docs/superpowers/specs/2026-06-01-aif-qloop-park-primitive-design.md](../specs/2026-06-01-aif-qloop-park-primitive-design.md).

---

## Task 4: answer.ts `resume` decision (pure parts)

**Files:**
- Modify: `packages/runtime-bridge/src/cli/answer.ts`
- Test: `packages/runtime-bridge/test/aif-answer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to packages/runtime-bridge/test/aif-answer.test.ts
import { appendAnswerToPlan } from '../src/cli/answer.js';

describe('resume decision — pure parts', () => {
  it('VALID_DECISIONS includes resume', () => {
    expect([...VALID_DECISIONS]).toEqual(['request_changes', 'approve', 'retry', 'resume']);
  });
  it('resume requires --answer', () => {
    const err = validateAnswerArgs({ taskId: 't-1', answer: undefined, decision: 'resume', json: false });
    expect(err).toMatch(/requires --answer/);
  });
  it('appendAnswerToPlan appends a marked OPERATOR ANSWER block', () => {
    const out = appendAnswerToPlan('# Plan\n## ⏸ OPEN QUESTION\nq', 'use Option A');
    expect(out).toContain('## ✅ OPERATOR ANSWER (resumed)');
    expect(out).toContain('use Option A');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-answer.test.ts`
Expected: FAIL — `appendAnswerToPlan` not exported; `VALID_DECISIONS` lacks `resume`.

- [ ] **Step 3: Edit answer.ts — widen the decision type + add the pure helper**

In `packages/runtime-bridge/src/cli/answer.ts`:

Change the decision type and list:

```ts
export type AnswerDecision = 'request_changes' | 'approve' | 'retry' | 'resume';

export const VALID_DECISIONS: readonly AnswerDecision[] = ['request_changes', 'approve', 'retry', 'resume'];
```

Update `validateAnswerArgs` so `resume` also requires `--answer` (replace the request_changes-only check):

```ts
  if ((args.decision === 'request_changes' || args.decision === 'resume') && !args.answer?.trim()) {
    return `decision "${args.decision}" requires --answer <text> (the resolution to push back)`;
  }
```

Add the import + pure helper near the top (after the existing imports):

```ts
import { getTask, putTask } from './aifHttp.js';

/** Append a marked OPERATOR ANSWER block to the plan (read by the implementer on the next tick). */
export function appendAnswerToPlan(existingPlan: string | null | undefined, answer: string): string {
  const base = (existingPlan ?? '').trimEnd();
  const block = `\n\n## ✅ OPERATOR ANSWER (resumed)\n\n${answer.trim()}\n`;
  return base + block;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-answer.test.ts`
Expected: PASS (existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add packages/runtime-bridge/src/cli/answer.ts packages/runtime-bridge/test/aif-answer.test.ts
git commit -m "feat(runtime-bridge): answer.ts — add resume decision (pure parts)

Prior-art: skipped — extends shipped answer.ts with one decision + a pure string helper, no new capability artifact"
```

---

## Task 5: answer.ts `resume` network path (unpause + inject)

**Files:**
- Modify: `packages/runtime-bridge/src/cli/answer.ts` (`resumePark` + route it in `pushAnswer`)
- Test: `packages/runtime-bridge/test/aif-answer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to packages/runtime-bridge/test/aif-answer.test.ts
describe('POSITIVE — resume: GET plan, then PUT { plan+answer, paused:false, blockedReason:null }', () => {
  it('injects the answer into the plan and unpauses', async () => {
    const task = { id: 't-7', title: 'x', status: 'implementing', plan: '# Plan\n## ⏸ OPEN QUESTION\nq', paused: true, blockedReason: 'q' };
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) =>
      Promise.resolve(
        String(url).endsWith('/tasks/t-7')
          ? new Response(JSON.stringify(task), { status: 200, headers: { 'Content-Type': 'application/json' } })
          : new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
      ),
    );

    const result = await pushAnswer('http://localhost:3009', 't-7', 'resume', 'use Option A');

    expect((spy.mock.calls[0][1] as RequestInit).method).toBe('GET');
    const put = spy.mock.calls[1][1] as RequestInit;
    expect(put.method).toBe('PUT');
    const body = JSON.parse(put.body as string);
    expect(body.plan).toContain('## ✅ OPERATOR ANSWER (resumed)');
    expect(body.plan).toContain('use Option A');
    expect(body.paused).toBe(false);
    expect(body.blockedReason).toBeNull();
    expect(result).toMatchObject({ taskId: 't-7', decision: 'resume', commented: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-answer.test.ts`
Expected: FAIL — `pushAnswer` does not handle `resume` (sends an event instead of GET+PUT).

- [ ] **Step 3: Add `resumePark` + route it first in `pushAnswer`**

Add the function (after `postEvent`):

```ts
/**
 * Resume an A-park (paused mid-implementation): read the plan, inject the answer
 * under an OPERATOR ANSWER block, and PUT { plan, paused:false, blockedReason:null }.
 * The implementer re-reads the plan on its next tick (spec §3 resume / A).
 */
export async function resumePark(baseUrl: string, taskId: string, answer: string): Promise<PushResult> {
  const task = await getTask(baseUrl, taskId);
  const plan = appendAnswerToPlan(task.plan, answer);
  await putTask(baseUrl, taskId, { plan, paused: false, blockedReason: null });
  return { taskId, decision: 'resume', event: 'unpause (PUT paused=false)', commented: false };
}
```

At the TOP of `pushAnswer`, before `resolveStep`, route resume:

```ts
  if (decision === 'resume') {
    if (!answer || !answer.trim()) {
      throw new BackendError(`decision "resume" requires answer text`, 'dispatch_failed', 'aif-handoff');
    }
    return resumePark(baseUrl, taskId, answer.trim());
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/runtime-bridge && npx vitest run`
Expected: PASS (full package suite green).

- [ ] **Step 5: Commit**

```bash
git add packages/runtime-bridge/src/cli/answer.ts packages/runtime-bridge/test/aif-answer.test.ts
git commit -m "feat(runtime-bridge): answer.ts resume — unpause + inject answer into plan

Symmetric resolver for an A-park: GET plan, append OPERATOR ANSWER, PUT
{ plan, paused:false, blockedReason:null }. B-park (done->request_changes) unchanged.

Prior-art: skipped — extends shipped answer.ts resolve path, no new capability file"
```

---

## Task 6: OPTIONAL live contract test (the full F10 proof)

**Files:**
- Create: `packages/runtime-bridge/test/aif-park-live.test.ts`

> Env-gated so CI/normal runs SKIP it (the package convention is pure unit tests). Run it
> deliberately: `RUNTIME_BRIDGE_LIVE_AIF=1 RUNTIME_BRIDGE_AIF_URL=http://localhost:3009 RUNTIME_BRIDGE_AIF_PROJECT_ID=<pid> npx vitest run test/aif-park-live.test.ts`.
> This is the executable form of spec §4's "paused ⇒ excluded from candidacy" / F10.

- [ ] **Step 1: Write the test**

```ts
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
```

- [ ] **Step 2: Run it (skipped by default)**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-park-live.test.ts`
Expected: 0 tests run / SKIPPED (no `RUNTIME_BRIDGE_LIVE_AIF=1`). With a live aif + the env set: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/runtime-bridge/test/aif-park-live.test.ts
git commit -m "test(runtime-bridge): optional live contract test — paused task not advanced (F10)

Env-gated (RUNTIME_BRIDGE_LIVE_AIF=1); skipped in CI. The full executable proof of
the spec §4 dependency, complementing the pure GUARD in aif-park.test.ts.

Prior-art: skipped — test-only, no capability artifact"
```

---

## Task 7: Document the agent's A-vs-B selection rule

**Files:**
- Modify: `docs/runtime-bridge-setup.md`

- [ ] **Step 1: Append a "Hard-fork park" section**

```markdown
## Hard-fork park — when the agent cannot pick a default

Soft/advisory questions already flow non-blocking to chat — the agent picks a
reasonable default and keeps going. Use the PARK primitive ONLY for a genuine
**hard fork that blocks continuing the implementation**.

- **Mid-flight hard fork (A):** the agent runs
  `tsx packages/runtime-bridge/src/cli/park.ts --question "<fork + A/B options>"`
  (`--task` defaults to `$HANDOFF_TASK_ID`). This pauses the task (`paused:true`,
  the only agent-reachable stop) and records the question. The operator resolves it
  with `answer.ts --decision resume --answer "<...>"`, which unpauses and injects
  the answer into the plan.
- **Finish-line fork (B):** the work is essentially done and the question is about
  direction/acceptance -> the agent finishes to `done`; the operator answers via the
  existing `answer.ts --decision request_changes` rework path. No new code.

Never use `blockedReason` alone to stop the agent — the coordinator does not honor it
(it filters on `paused`). The `aif-park.test.ts` GUARD enforces this.
```

- [ ] **Step 2: Commit**

```bash
git add docs/runtime-bridge-setup.md
git commit -m "docs(runtime-bridge): agent A-vs-B hard-fork park selection rule

Prior-art: skipped — documentation only, no capability artifact"
```

---

## Self-Review (completed at plan-writing time)

- **Spec coverage:** §3 A-park → Part 1 Tasks 2-3 (`park.ts`); §3 resume → Tasks 4-5 (`answer.ts resume`); §3 B-park → unchanged (documented Task 7); §4 guard-test → Part 1 Task 3 GUARD (pure) + Task 6 (live); §3 OPEN QUESTION/ANSWER markers → `buildOpenQuestionPlan`/`appendAnswerToPlan`; §3 selection rule → Task 7; §5 BFR/Prior-art → Part 1 Task 3 capability-commit note. No gaps.
- **Placeholder scan:** every code/test step shows complete code; no TBD/TODO.
- **Type consistency:** `getTask`/`putTask` (aifHttp) used identically in park.ts + answer.ts; `AifTaskFull.plan` is `string|null|undefined`, matching the plan-builder signatures; `AnswerDecision` widened once (Task 4) and consumed in Task 5; `PushResult` shape reused by `resumePark`.
- **Known divergence from spec (intentional, noted):** park.ts sets `blockedReason` AND writes the OPEN QUESTION anchor into the plan (spec §3 implied the anchor only) — the anchor gives `resume` a stable place to inject the answer; functionally equivalent, slightly more self-documenting.
