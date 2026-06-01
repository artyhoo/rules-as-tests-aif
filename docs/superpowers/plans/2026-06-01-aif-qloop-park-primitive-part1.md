# aif Question-Loop PARK Primitive — Implementation Plan (Part 1 of 2: park side)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **Execute Part 1 first, then [Part 2](2026-06-01-aif-qloop-park-primitive-part2.md).**

**Goal:** Give the autonomous aif agent a way to PARK itself on a genuine *hard* fork mid-implementation (stop, ask the operator, resume with the answer), closing the smoke-`701a52e3` bug where the agent flailed and finished `done` with a placeholder.

**Architecture:** A thin consumer CLI `cli/park.ts` sets `paused:true` + `blockedReason` via `PUT /tasks/:id` (the only agent-reachable stop — the coordinator candidate query filters `paused=false`). A guard-test pins that load-bearing dependency (`paused:true` is the stop, NOT `blockedReason` alone) so an upstream aif change fails loudly. Part 2 adds the symmetric `answer.ts resume`. Soft questions already flow non-blocking to chat — this plan covers ONLY the hard fork.

**Tech Stack:** TypeScript (ESM), `tsx` entrypoints, Vitest (`vi.spyOn(globalThis,'fetch')`), plain HTTP to the aif-handoff REST API. No new deps, no paid LLM.

**Binding spec:** [docs/superpowers/specs/2026-06-01-aif-qloop-park-primitive-design.md](../specs/2026-06-01-aif-qloop-park-primitive-design.md) (§2 F1–F10 verified facts, §3 design, §4 guard-test, §5 BFR).

---

## File Structure (whole feature, both parts)

- **Create** `packages/runtime-bridge/src/cli/aifHttp.ts` — shared `getTask` + `putTask` helpers (GET/PUT with the standard `BackendError` mapping). New code only; the shipped `answer.ts` `post` helper is untouched.
- **Create** `packages/runtime-bridge/src/cli/park.ts` — the agent-side park CLI (Part 1).
- **Modify** `packages/runtime-bridge/src/cli/answer.ts` — add the `resume` decision (Part 2).
- **Create** `packages/runtime-bridge/test/aif-park.test.ts`, `test/aif-http.test.ts` — Part 1.
- **Modify** `packages/runtime-bridge/test/aif-answer.test.ts` — Part 2.
- **Create** `packages/runtime-bridge/test/aif-park-live.test.ts` — OPTIONAL env-gated live proof (Part 2).
- **Modify** `docs/runtime-bridge-setup.md` — agent A-vs-B selection rule (Part 2).

---

## Task 1: Shared aif HTTP helpers (`aifHttp.ts`)

**Files:**
- Create: `packages/runtime-bridge/src/cli/aifHttp.ts`
- Test: `packages/runtime-bridge/test/aif-http.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-http.test.ts`
Expected: FAIL — `Cannot find module '../src/cli/aifHttp.js'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/runtime-bridge/src/cli/aifHttp.ts
/**
 * Shared aif-handoff REST helpers for the field-mutating CLIs (park, answer-resume).
 * GET a task and PUT field updates, with the same BackendError mapping as
 * answer.ts `post` (connection → unavailable, 429 → quota_exceeded, other → dispatch_failed).
 * @cc-only-rationale: pure TS over plain HTTP — no CC-only primitive, no paid LLM.
 */
import { BackendError } from '../backend.js';

/** The subset of an aif-handoff task these CLIs read/mutate (GET /tasks/:id). */
export interface AifTaskFull {
  id: string;
  title: string;
  status: string;
  plan?: string | null;
  paused?: boolean;
  blockedReason?: string | null;
}

async function request(method: 'GET' | 'PUT', baseUrl: string, path: string, body?: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new BackendError(`aif-handoff ${method} ${path} unreachable: ${msg}`, 'unavailable', 'aif-handoff');
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    if (res.status === 429) {
      throw new BackendError(`aif-handoff rate limit (${method} ${path}): ${errBody}`, 'quota_exceeded', 'aif-handoff');
    }
    throw new BackendError(`aif-handoff ${method} ${path} HTTP ${res.status}: ${errBody}`, 'dispatch_failed', 'aif-handoff');
  }
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** GET /tasks/:id → the task object. */
export async function getTask(baseUrl: string, taskId: string): Promise<AifTaskFull> {
  return (await request('GET', baseUrl, `/tasks/${taskId}`)) as AifTaskFull;
}

/** PUT /tasks/:id with a partial field update (updateTaskSchema-accepted fields only). */
export async function putTask(baseUrl: string, taskId: string, body: Record<string, unknown>): Promise<void> {
  await request('PUT', baseUrl, `/tasks/${taskId}`, body);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-http.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/runtime-bridge/src/cli/aifHttp.ts packages/runtime-bridge/test/aif-http.test.ts
git commit -m "feat(runtime-bridge): aifHttp getTask/putTask helpers for field-mutating CLIs

Prior-art: skipped — thin HTTP helper extraction, no new capability (siblings of answer.ts post)"
```

---

## Task 2: park.ts pure helpers (args + plan builder)

**Files:**
- Create: `packages/runtime-bridge/src/cli/park.ts` (helpers only this task)
- Test: `packages/runtime-bridge/test/aif-park.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/runtime-bridge/test/aif-park.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseParkArgs, validateParkArgs, buildOpenQuestionPlan } from '../src/cli/park.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-park.test.ts`
Expected: FAIL — `Cannot find module '../src/cli/park.js'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/runtime-bridge/src/cli/park.ts
/**
 * CLI park entrypoint — the agent-side "I hit a hard fork, stop and ask" half.
 *
 * Usage (the autonomous agent runs this on a genuine BLOCKING fork it cannot default):
 *   tsx packages/runtime-bridge/src/cli/park.ts --task <id> --question "<fork + options>"
 *   # --task defaults to $HANDOFF_TASK_ID (set in the aif agent context).
 *
 * Mechanism (spec §2 F2/F3/F5): PUT /tasks/:id { paused:true, blockedReason, plan }.
 *   - paused:true is THE stop — the coordinator candidate query filters paused=false,
 *     so the agent is NOT re-picked (blockedReason ALONE does NOT stop it — F2).
 *   - blockedReason carries the question + makes questions.ts isParked() true.
 *   - plan gains a "## ⏸ OPEN QUESTION" anchor the resume answer is injected under.
 *
 * Soft/advisory questions do NOT use this — they already flow non-blocking to chat.
 * This is ONLY for a hard fork that blocks continuing the implementation.
 *
 * Config: RUNTIME_BRIDGE_AIF_URL (default http://localhost:3009).
 * Exit codes: 0 parked; 1 bad args or REST error (message on stderr).
 *
 * @cc-only-rationale: pure TS over plain HTTP — also callable from a smoke-test
 *   and an orchestrator session. No CC-only primitive, no Superset import, no paid LLM.
 */
import { fileURLToPath } from 'node:url';
import { getTask, putTask } from './aifHttp.js';

const DEFAULT_AIF_URL = 'http://localhost:3009';

export interface ParkArgs {
  taskId?: string;
  question?: string;
  json: boolean;
}

/** Parse CLI args: --task <id> (else $HANDOFF_TASK_ID), --question <text>, --json. */
export function parseParkArgs(argv: string[], env: NodeJS.ProcessEnv): ParkArgs {
  const valueOf = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined;
  };
  return {
    taskId: valueOf('--task') ?? env.HANDOFF_TASK_ID ?? undefined,
    question: valueOf('--question'),
    json: argv.includes('--json'),
  };
}

/** Validate parsed args. Returns an error message, or null when valid. */
export function validateParkArgs(args: ParkArgs): string | null {
  if (!args.taskId) return 'missing required --task <id> (or $HANDOFF_TASK_ID)';
  if (!args.question?.trim()) return 'missing required --question <text> (the fork + options)';
  return null;
}

/** Append a marked OPEN QUESTION block to the existing plan (anchor for the resume answer). */
export function buildOpenQuestionPlan(existingPlan: string | null | undefined, question: string): string {
  const base = (existingPlan ?? '').trimEnd();
  const block = `\n\n## ⏸ OPEN QUESTION (awaiting operator)\n\n${question.trim()}\n`;
  return base + block;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-park.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/runtime-bridge/src/cli/park.ts packages/runtime-bridge/test/aif-park.test.ts
git commit -m "feat(runtime-bridge): park.ts pure helpers (args + OPEN QUESTION plan builder)

Prior-art: skipped — pure arg/string helpers, no new capability yet (network in next commit)"
```

---

## Task 3: park.ts network (`parkTask`) + the GUARD test

**Files:**
- Modify: `packages/runtime-bridge/src/cli/park.ts` (add `parkTask` + `main`)
- Test: `packages/runtime-bridge/test/aif-park.test.ts` (add network + guard tests)

- [ ] **Step 1: Write the failing test (incl. the load-bearing GUARD)**

```ts
// append to packages/runtime-bridge/test/aif-park.test.ts
import { parkTask } from '../src/cli/park.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-park.test.ts`
Expected: FAIL — `parkTask is not exported`.

- [ ] **Step 3: Add `parkTask` + `main` to park.ts**

```ts
// append to packages/runtime-bridge/src/cli/park.ts

export interface ParkResult {
  taskId: string;
  paused: true;
  blockedReason: string;
}

/**
 * Park the task on a hard fork: read the current plan, append the OPEN QUESTION
 * anchor, and PUT { paused:true, blockedReason, plan }. paused:true is the stop (F3).
 */
export async function parkTask(baseUrl: string, taskId: string, question: string): Promise<ParkResult> {
  const reason = question.trim();
  const task = await getTask(baseUrl, taskId);
  const plan = buildOpenQuestionPlan(task.plan, reason);
  await putTask(baseUrl, taskId, { paused: true, blockedReason: reason, plan });
  return { taskId, paused: true, blockedReason: reason };
}

/** Render a ParkResult as a human-readable confirmation. */
export function formatParkResult(result: ParkResult): string {
  return `task:   ${result.taskId}\nparked: paused=true\nreason: ${result.blockedReason}`;
}

async function main(): Promise<void> {
  const baseUrl = process.env.RUNTIME_BRIDGE_AIF_URL || DEFAULT_AIF_URL;
  const args = parseParkArgs(process.argv.slice(2), process.env);

  const argError = validateParkArgs(args);
  if (argError) {
    process.stderr.write(`[runtime-bridge] park: ${argError}\n`);
    process.exit(1);
  }

  let result: ParkResult;
  try {
    result = await parkTask(baseUrl, args.taskId!, args.question!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[runtime-bridge] park: failed to park task: ${msg}\n`);
    process.exit(1);
  }

  process.stdout.write((args.json ? JSON.stringify(result) : formatParkResult(result)) + '\n');
  process.exit(0);
}

// Run only as a real entrypoint — importing the module (tests) must not fetch/exit.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    process.stderr.write(`[runtime-bridge] park: unhandled error: ${err}\n`);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/runtime-bridge && npx vitest run test/aif-park.test.ts`
Expected: PASS (9 tests, incl. the GUARD).

- [ ] **Step 5: Commit**

```bash
git add packages/runtime-bridge/src/cli/park.ts packages/runtime-bridge/test/aif-park.test.ts
git commit -m "feat(runtime-bridge): park.ts parkTask + guard-test (paused:true is the stop)

The guard pins spec §4: a paused task is excluded from coordinator candidacy
(verified data/dist/index.js:901 eq(tasks.paused,false)); regressing to
blockedReason-only fails the test loudly instead of silently shipping a no-op park.

Prior-art: prior-art-evaluations.md — no upstream deliberate-park primitive for the
autonomous pipeline (aif AskUserQuestion is chat-synchronous, different problem class, T16);
thin consumer BUILD, dual of shipped answer.ts (#323)."
```

> **NOTE for the worker:** this commit adds a new file ≥80 LOC under `packages/` → it is a **capability commit** per CLAUDE.md. The `Prior-art:` trailer above is required; if `prior-art-evaluations.md` has no matching row, add one (Verdict BUILD, rationale: no upstream pipeline park primitive) in THIS commit per the build-vs-reuse invariant.

---

**➡ Continue with [Part 2](2026-06-01-aif-qloop-park-primitive-part2.md): answer.ts resume + live contract test + agent docs.**
