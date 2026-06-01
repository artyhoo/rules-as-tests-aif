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
