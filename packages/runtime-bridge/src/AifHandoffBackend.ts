/**
 * AifHandoffBackend — adapter for the lee-to/aif-handoff runtime.
 *
 * DISPATCH = REST (:3009). Verdict from research-patch
 * docs/meta-factory/research-patches/2026-05-31-runtime-bridge-mcp-dispatch-fix.md
 * (REST-now + MCP-target). The aif-handoff MCP server (:3100) is the
 * design-sanctioned surface, but as shipped it wires a single shared
 * StreamableHTTPServerTransport (one session, no teardown endpoint) — too
 * fragile for a durable bridge until an upstream per-session-transport fix
 * lands. REST is stateless and was live-verified, so dispatch uses it now.
 *
 * dispatch() — 4-step planner-skip over REST (live-verified mechanics):
 *   1. POST /tasks            { projectId, title, plannerMode:'fast', paused:true }  -> 201 + task id
 *   2. PUT  /tasks/:id        { plan: <kickoff content> }                            -> 200
 *   3. POST /tasks/:id/events { event: 'accept_existing_plan' }                      -> advance to plan_ready
 *   4. PUT  /tasks/:id        { paused: false }                                      -> coordinator picks up
 *   Live-verified notes:
 *     - status is EVENT-only — `PUT { status }` is silently ignored (no direct write).
 *     - step 3 enforces aif-handoff's clean-worktree (branch-isolation) guard; a
 *       dirty target tree surfaces as a 4xx -> dispatch_failed. dispatch() then
 *       best-effort DELETEs the half-created task (rollback, no orphan), and the
 *       CLI (dispatch.ts) falls back to ManualBackend on the BackendError.
 *       (Same guard applies to the MCP path — not REST-specific.)
 * available(): GET /health reachability probe (1s timeout).
 * getStatus(): REST GET /tasks/:id (non-blocking snapshot via aifWsStatus.getTaskStatus).
 * awaitDone(): WebSocket status event stream (aifWsStatus.awaitTaskDone, :3009/ws).
 *
 * Ports: REST + WS = baseUrl (:3009). MCP (HTTP) = mcpUrl (:3100), RESERVED for the
 * MCP-target phase (ADOPT @modelcontextprotocol/sdk) — NOT used by REST dispatch today.
 *
 * @dual-pair: runtime-bridge-aif-handoff
 */
import type { RuntimeBackend } from './backend.js';
import { BackendError } from './backend.js';
import type { KickoffSpec, TaskHandle, TaskStatus, TaskResult } from './types.js';
import {
  awaitTaskDone,
  getTaskStatus,
  mapAifStatusToTaskStatus,
  type WebSocketConstructor,
} from './aifWsStatus.js';

/** Configuration for AifHandoffBackend. */
export interface AifHandoffConfig {
  /**
   * Base URL of the aif-handoff API server (REST + WebSocket).
   * Source: packages/shared/src/env.ts -- PORT default 3009, API_BASE_URL="http://localhost:3009"
   * Default: http://localhost:3009
   */
  readonly baseUrl?: string;
  /**
   * MCP (HTTP-mode) base URL — RESERVED for the MCP-target phase
   * (ADOPT @modelcontextprotocol/sdk). NOT used by REST dispatch today; stored
   * so the MCP-target phase is a config-only migration, not a re-plumb.
   * Source: aif-handoff packages/mcp/src/env.ts — MCP_PORT default 3100.
   * Default: http://localhost:3100
   */
  readonly mcpUrl?: string;
  /**
   * aif-handoff project ID (UUID). Required for task creation.
   * Consumers must configure this to match their aif-handoff project.
   */
  readonly projectId?: string;
  /**
   * WebSocket URL for the aif-handoff status event stream.
   * Source: packages/api/src/ws.ts -- app.get("/ws", upgradeWebSocket(...))
   * Same server as baseUrl (port 3009 by default).
   * Default: derived from baseUrl (http->ws, append /ws)
   */
  readonly wsUrl?: string;
  /**
   * Optional file path to append task status updates to (append-only, no schema rewrite).
   * When set, each status event is appended as a line: [ISO] taskId=<id> status=<status>
   * When unset, status processing is a clean no-op.
   */
  readonly stateFilePath?: string;
  /**
   * Dependency injection: custom WebSocket constructor (for testing).
   * Default: WebSocket from node:http (undici-based, available since Node 22.5+).
   */
  readonly WebSocketImpl?: WebSocketConstructor;
}

export class AifHandoffBackend implements RuntimeBackend {
  readonly name = 'aif-handoff' as const;

  private readonly baseUrl: string;
  /** RESERVED for the MCP-target phase; not used by REST dispatch. */
  readonly mcpUrl: string;
  private readonly projectId: string | undefined;
  private readonly wsUrl: string;
  private readonly stateFilePath: string | undefined;
  private readonly WebSocketImpl: WebSocketConstructor | undefined;

  constructor(config: AifHandoffConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:3009';
    this.mcpUrl = config.mcpUrl ?? 'http://localhost:3100';
    this.projectId = config.projectId;
    this.wsUrl = config.wsUrl ?? AifHandoffBackend._deriveWsUrl(this.baseUrl);
    this.stateFilePath = config.stateFilePath;
    this.WebSocketImpl = config.WebSocketImpl;
  }

  /** Derive ws:// URL from http:// baseUrl (same host:port, append /ws). */
  private static _deriveWsUrl(httpUrl: string): string {
    return httpUrl.replace(/^http(s?):\/\//, (_match: string, s: string) => `ws${s}://`) + '/ws';
  }

  async available(): Promise<boolean> {
    // Cheap reachability probe: GET /health (or root) with 1s timeout.
    // Returns true on any 2xx or 4xx (server is up but auth needed is still
    // "available"). Returns false on connection refused, ECONNREFUSED, timeout.
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      try {
        const res = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        return res.status < 500;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      return false;
    }
  }

  async dispatch(kickoff: KickoffSpec): Promise<TaskHandle> {
    if (!this.projectId) {
      throw new BackendError(
        'AifHandoffBackend requires projectId -- set RUNTIME_BRIDGE_AIF_PROJECT_ID env var',
        'dispatch_failed',
        'aif-handoff',
      );
    }

    // -- Step 1: Create task in paused state (REST POST /tasks) -------------
    // paused:true so the coordinator does not advance the task while we set
    // its plan in step 2. Live-verified: returns 201 + full task object.
    const createResult = await this._rest('POST', '/tasks', {
      projectId: this.projectId,
      title: kickoff.umbrellaName,
      description: `Runtime-bridge dispatch: ${kickoff.filePath}`,
      plannerMode: 'fast',
      paused: true,
      autoMode: true,
      skipReview: false, // reviewer runs per reviewer-discipline.md §2
    });

    if (!createResult || typeof createResult !== 'object' || !('id' in createResult)) {
      throw new BackendError(
        'POST /tasks returned unexpected shape (no id)',
        'dispatch_failed',
        'aif-handoff',
      );
    }
    const taskId = (createResult as { id: string }).id;

    // Steps 2-4 are wrapped so a mid-sequence failure (e.g. the dirty-worktree
    // guard on step 3) does not strand the paused task created in step 1.
    // Best-effort DELETE rolls it back, then we re-throw — the CLI then falls
    // back to ManualBackend (dispatch.ts) with no orphan left on the project.
    try {
      // -- Step 2: Push the kickoff content as the task plan (PUT /tasks/:id) --
      await this._rest('PUT', `/tasks/${taskId}`, { plan: kickoff.content });

      // -- Step 3: Advance to plan_ready via the state-machine event ----------
      // Status is EVENT-only — `PUT { status }` is silently ignored (live-verified
      // §3.3 of the dispatch-fix research-patch). aif-handoff enforces a clean-
      // worktree (branch-isolation) guard here: a dirty target tree surfaces as a
      // 4xx -> dispatch_failed (same guard applies to the MCP path, not REST-specific).
      await this._rest('POST', `/tasks/${taskId}/events`, { event: 'accept_existing_plan' });

      // -- Step 4: Clear paused so the coordinator picks the task up ----------
      await this._rest('PUT', `/tasks/${taskId}`, { paused: false });
    } catch (err) {
      // Best-effort rollback; ignore delete failures (the throw below is what matters).
      await this._rest('DELETE', `/tasks/${taskId}`).catch(() => undefined);
      throw err;
    }

    return {
      backend: 'aif-handoff',
      taskId,
      dispatchedAt: new Date().toISOString(),
    };
  }

  async getStatus(handle: TaskHandle): Promise<TaskStatus> {
    // Non-blocking point-in-time snapshot via REST GET /tasks/:id.
    // Source: aifWsStatus.getTaskStatus -> packages/api/src/routes/tasks.ts GET /:id
    // REST is used (not WS) because getStatus must NOT block.
    // WS is subscribe-and-wait; REST returns immediately.
    const { rawStatus, checkedAt } = await getTaskStatus(handle.taskId, this.baseUrl);
    return {
      status: mapAifStatusToTaskStatus(rawStatus),
      rawStatus,
      checkedAt,
    };
  }

  async awaitDone(handle: TaskHandle, timeoutMs?: number): Promise<TaskResult> {
    // Real WebSocket status readback via aif-handoff broadcast stream.
    // Source: aifWsStatus.awaitTaskDone -> ws://localhost:3009/ws
    // WS event: { type: "task:updated", payload: { id, title, status } }
    // taskId filter: payload.id === handle.taskId (client-side, per kickoff §3 SW-C item 2)
    // Terminal states: done/verified -> success; blocked_external -> !success (resolves, not throws)
    // Transport failures (disconnect after retries) -> throws BackendError('unavailable')
    try {
      const result = await awaitTaskDone({
        taskId: handle.taskId,
        wsUrl: this.wsUrl,
        stateFilePath: this.stateFilePath,
        timeoutMs,
        WebSocketImpl: this.WebSocketImpl,
      });
      return {
        success: result.success,
        content: '',
        finalStatus: result.finalStatus,
        completedAt: result.completedAt,
      };
    } catch (err) {
      // Re-throw BackendErrors (unavailable, timeout) as-is.
      // Other errors are wrapped as dispatch_failed.
      if (err instanceof BackendError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new BackendError(
        `aif-handoff awaitDone unexpected error for task ${handle.taskId}: ${msg}`,
        'dispatch_failed',
        'aif-handoff',
      );
    }
  }

  // -- Private helpers -------------------------------------------------------

  /**
   * Call an aif-handoff REST endpoint (plain JSON, no MCP handshake).
   * Used by dispatch() for the 4-step planner-skip sequence on baseUrl (:3009).
   *
   * Error mapping (per RuntimeBackend BackendError contract):
   *   - connection refused / abort / timeout -> 'unavailable' (triggers Manual fallback)
   *   - HTTP 429                              -> 'quota_exceeded' (triggers Manual fallback)
   *   - any other non-2xx (incl. the dirty-worktree 4xx guard) -> 'dispatch_failed'
   *
   * @param method  HTTP method (POST / PUT / ...).
   * @param path    Path appended to baseUrl (e.g. '/tasks', '/tasks/:id/events').
   * @param body    Optional JSON body. Omitted bodies send no payload.
   */
  private async _rest(method: string, path: string, body?: unknown): Promise<unknown> {
    let res: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      try {
        res = await fetch(`${this.baseUrl}${path}`, {
          method,
          // Only declare a JSON content-type when we actually send a body
          // (a no-body DELETE with Content-Type: application/json is malformed
          // to some servers).
          headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      const msg = err instanceof Error ? err.message : String(err);
      // Prefer the canonical AbortError name; fall back to message-substring.
      if (name === 'AbortError' || msg.includes('abort') || msg.includes('timeout')) {
        throw new BackendError(
          `aif-handoff REST ${method} ${path} timed out`,
          'unavailable',
          'aif-handoff',
        );
      }
      throw new BackendError(
        `aif-handoff REST ${method} ${path} unreachable: ${msg}`,
        'unavailable',
        'aif-handoff',
      );
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      if (res.status === 429) {
        throw new BackendError(
          `aif-handoff rate limit (${method} ${path}): ${errBody}`,
          'quota_exceeded',
          'aif-handoff',
        );
      }
      throw new BackendError(
        `aif-handoff REST ${method} ${path} HTTP ${res.status}: ${errBody}`,
        'dispatch_failed',
        'aif-handoff',
      );
    }

    // REST returns plain JSON (no SSE framing). Tolerate an empty body.
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
