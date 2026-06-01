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
  /** aif's persisted feature-branch name (planner source-of-truth; read back by harvest). */
  branchName?: string | null;
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
