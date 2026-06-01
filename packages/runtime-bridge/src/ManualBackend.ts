/**
 * ManualBackend — always-available fallback backend.
 *
 * Behaviour:
 *   dispatch: copies kickoff to /tmp/runtime-bridge-<task-id>.md, prints
 *             copy-paste instructions to stderr, returns a TaskHandle.
 *   getStatus: checks for /tmp/runtime-bridge-<task-id>.response.md existence.
 *   awaitDone: polls every 30s until the response file appears (no MVP timeout —
 *              documented acceptable limitation per kickoff §12 mn2).
 *
 * Task ID: ISO-timestamp + first 8 chars of SHA-256 hash of umbrellaName.
 * This keeps IDs human-readable and deterministically reproducible for the
 * same umbrella (useful for troubleshooting), while remaining unique per
 * dispatch timestamp.
 *
 * @cc-only-rationale: ManualBackend is dual-channel via index.ts export —
 *   callable from both the PostToolUse hook (CC) and any portable entrypoint.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { RuntimeBackend } from './backend.js';
import type { KickoffSpec, TaskHandle, TaskStatus, TaskResult } from './types.js';

export class ManualBackend implements RuntimeBackend {
  readonly name = 'manual' as const;

  available(): Promise<boolean> {
    // ManualBackend is always available — no infrastructure required.
    return Promise.resolve(true);
  }

  dispatch(kickoff: KickoffSpec): Promise<TaskHandle> {
    const taskId = this._makeTaskId(kickoff);
    const kickoffPath = `/tmp/runtime-bridge-${taskId}.md`;
    const responsePath = `/tmp/runtime-bridge-${taskId}.response.md`;

    writeFileSync(kickoffPath, kickoff.content, 'utf8');

    // Print bilingual copy-paste instructions to stderr (non-blocking).
    // Using process.stderr.write to avoid console.error adding extra formatting.
    process.stderr.write(
      [
        '',
        '╔══════════════════════════════════════════════════════════════════╗',
        '║  runtime-bridge: ManualBackend — ручной запуск                  ║',
        '╚══════════════════════════════════════════════════════════════════╝',
        `  Kickoff сохранён: ${kickoffPath}`,
        `  Откройте новое окно Claude Code и запустите задачу.`,
        `  Положите отчёт в: ${responsePath}`,
        `  Task ID: ${taskId}`,
        '',
      ].join('\n'),
    );

    const handle: TaskHandle = {
      backend: 'manual',
      taskId,
      dispatchedAt: new Date().toISOString(),
    };
    return Promise.resolve(handle);
  }

  getStatus(handle: TaskHandle): Promise<TaskStatus> {
    const responsePath = `/tmp/runtime-bridge-${handle.taskId}.response.md`;
    const responseExists = existsSync(responsePath);
    return Promise.resolve({
      status: responseExists ? 'done' : 'pending',
      rawStatus: responseExists ? 'response_file_present' : 'awaiting_response_file',
      checkedAt: new Date().toISOString(),
    });
  }

  async awaitDone(handle: TaskHandle, timeoutMs?: number): Promise<TaskResult> {
    const responsePath = `/tmp/runtime-bridge-${handle.taskId}.response.md`;
    const pollIntervalMs = 30_000;
    const startedAt = Date.now();

    while (true) {
      if (existsSync(responsePath)) {
        const content = readFileSync(responsePath, 'utf8');
        return {
          success: true,
          content,
          finalStatus: 'done',
          completedAt: new Date().toISOString(),
        };
      }

      if (timeoutMs !== undefined && Date.now() - startedAt >= timeoutMs) {
        return {
          success: false,
          content: '',
          finalStatus: 'timeout',
          completedAt: new Date().toISOString(),
          meta: { timeoutMs, taskId: handle.taskId, responsePath },
        };
      }

      await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  _makeTaskId(kickoff: KickoffSpec): string {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const shortHash = createHash('sha256')
      .update(kickoff.umbrellaName)
      .digest('hex')
      .slice(0, 8);
    return `${ts}-${shortHash}`;
  }
}
