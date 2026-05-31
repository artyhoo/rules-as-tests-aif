<!-- scope:runtime-bridge-mcp-dispatch-fix -->
# Research patch — runtime-bridge dispatch fix (MCP-vs-REST, live-verified)

> **Class:** R-phase deliverable (research-patch). No code changes; live findings + scored verdict + I-phase design only (T5).
> **Authoritative for:** the runtime-bridge dispatch-path decision — §1 live findings (port/Accept-header/init-handshake/SSE-framing/single-session/never-run), §2 the MCP Streamable-HTTP contract (evidenced live + source), §3 MCP-vs-REST brainstorm + scored verdict (**REST-now + MCP-target**), §4 BFR §3 (MCP-SDK adopt — DEFER to MCP-target phase), §5 config refactor (`mcpUrl`), §6 I-phase sketch + live-test harness, §7 §1.7.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The bridge architecture/interface — see [packages/runtime-bridge/DESIGN.md](../../../packages/runtime-bridge/DESIGN.md). Consumer setup — see [docs/runtime-bridge-setup.md](../../runtime-bridge-setup.md).

> **Origin:** live setup session 2026-05-31 — first time `AifHandoffBackend` was exercised against a *running* aif-handoff instance. Kickoff: [`.claude/orchestrator-prompts/runtime-bridge-mcp-dispatch-fix/kickoff.md`](../../../.claude/orchestrator-prompts/runtime-bridge-mcp-dispatch-fix/kickoff.md). Successor context: [`project_aif_handoff_bridge_umbrella_phase1_state`](#) follow-up #1 (MCP-port split origin).

> **DECISION (maintainer-confirmed 2026-05-31):** dispatch = **REST-now + MCP-target**. The maintainer's earlier stated preference («the bridge should work through MCP») *predated* the live single-session-fragility finding (§1.5). With that evidence, REST-now is the better engineering call for a *working* bridge; MCP stays the documented design-aligned target gated on an upstream aif-handoff fix (§3.4). Surfaced as a genuine fork; maintainer confirmed via orchestrator dialogue after the fragility was explained.

Running instance (this session): docker-compose — `api:3009`, `mcp:3100`, `web:5180`, `agent:3010`. Test project `441c1c0c-b633-4612-a34c-2cc0c4d0eaf2`, isolated clone `/home/www/rules-as-tests-aif`.

---

## §1 Live findings (T3 — every claim = file:line or live command output)

### §1.1 Wrong port (confirmed)

`_mcpCall` POSTs `${baseUrl}/mcp`; `baseUrl` defaults to `:3009` ([`AifHandoffBackend.ts:123`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L123), [`:275`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L275)). Live:

```text
POST http://localhost:3009/mcp  → 404
GET  http://localhost:3009/health → 200
```

The real MCP server is on **:3100** (separate `mcp` docker-compose service). The docstring ([`:264-267`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L264-L267)) is **internally contradictory**: line 264 correctly notes "MCP HTTP mode uses port 3100", but line 265 then claims `baseUrl` (:3009, the API server) "hosts /mcp when MCP_TRANSPORT=http is set" — and the code follows the *wrong* half (POSTs to `baseUrl`/`:3009`). The :3009-hosts-/mcp half is **false** for standard docker-compose — MCP is its own service, confirmed by source ([aif-handoff `packages/mcp/src/index.ts` `startHttp`](https://github.com/lee-to/aif-handoff/blob/main/packages/mcp/src/index.ts) listens on `env.httpPort`, routes only `/health` + `/mcp`).

### §1.2 No separate `mcpUrl` (confirmed)

One `baseUrl` (:3009) serves BOTH MCP dispatch (`/mcp`) AND REST/WS status (`getTaskStatus` REST `GET /tasks/:id`, function at [`aifWsStatus.ts:294`](../../../packages/runtime-bridge/src/aifWsStatus.ts#L294); `awaitTaskDone` WS call at [`AifHandoffBackend.ts:233`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L233)). REST/WS = :3009, MCP = :3100. A single base URL cannot serve both. The Ports table in [`docs/runtime-bridge-setup.md:38-46`](../../runtime-bridge-setup.md) already documents the split as a "tracked follow-up" — this patch wires it into config (§5).

### §1.3 The Accept-header requirement (NEW — more specific than the kickoff's documented 400)

A bare `tools/call` POST to `:3100/mcp` **without** the Streamable-HTTP `Accept` header:

```text
POST :3100/mcp  {"jsonrpc":"2.0","method":"tools/call",...}   (no Accept header)
→ {"jsonrpc":"2.0","error":{"code":-32000,
   "message":"Not Acceptable: Client must accept both application/json and text/event-stream"},"id":null}
```

`_mcpCall` sets only `Content-Type: application/json` ([`AifHandoffBackend.ts:277`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L277)) — it never sends `Accept: application/json, text/event-stream`. This is **one of three** further failures a fixed-port `_mcpCall` would still hit (Accept header §1.3, init/session §1.5, SSE parsing §1.4 — order depends on which is fixed first).

### §1.4 SSE-framed responses (NEW — `_mcpCall`'s `res.json()` would break)

A successful `initialize` (with the Accept header) returns:

```text
HTTP/1.1 200 OK
content-type: text/event-stream
mcp-session-id: 58ea08f1-4fd5-43ce-9a5b-cd4631908847

event: message
data: {"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},
       "serverInfo":{"name":"handoff-mcp","version":"0.1.0"}},"jsonrpc":"2.0","id":1}
```

The body is **SSE-framed** (`event: message\ndata: {…}`), not raw JSON. `_mcpCall` does `await res.json()` ([`:321`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L321)) and reads `json.result?.content?.[0]?.text` — this **throws on an SSE body**. This is a **third** bug beyond port + handshake. (Note: JSON-RPC *error* responses before session setup come back as plain `application/json`; only successful streamed responses are SSE — so the hand-rolled parser may "work" on errors and break on successes, the worst kind of partial.)

### §1.5 Single-session server — the decisive fragility (NEW, source-confirmed)

`tools/call` *with* the Accept header but *without* a session id:

```text
→ {"error":{"code":-32000,"message":"Bad Request: Mcp-Session-Id header is required"},"id":null}
```

A **second** `initialize` (a live session already exists from the first probe):

```text
→ {"error":{"code":-32600,"message":"Invalid Request: Server already initialized"},"id":null}
DELETE :3100/mcp (no session id) → HTTP 400  (no teardown path)
```

**Root cause (authoritative — aif-handoff source, refutes DeepWiki):** [`packages/mcp/src/index.ts` `startHttp`](https://github.com/lee-to/aif-handoff/blob/main/packages/mcp/src/index.ts) connects **ONE** `StreamableHTTPServerTransport` at startup and routes every `/mcp` request to that single transport instance:

```js
async function startHttp(env) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
  await server.connect(transport);                       // ← ONE transport, connected ONCE
  const httpServer = createServer((req, res) => {
    if (url.pathname === "/mcp") transport.handleRequest(req, res);   // ← every req → same transport
    // only /health + /mcp + 404 — NO DELETE-session handler
  });
}
```

This is the **single-shared-transport anti-pattern**. The MCP SDK's recommended stateful pattern is a *new* `StreamableHTTPServerTransport` per `initialize`, stored in a session-id→transport map. As wired, the first client to `initialize` binds the one transport; every subsequent `initialize` returns `-32600 "Server already initialized"`, and there is no teardown endpoint → **recovery = restart the MCP container**.

> **Dual-channel note (T-AO-K / [`feedback_dual_channel_agreement_not_ground_truth`](#)):** DeepWiki (`lee-to/aif-handoff`) claimed the server "creates a new session per `initialize`… does not return Server already initialized." **Live + source refute this.** DeepWiki described the SDK's *capability* (the `randomUUID` generator is real); it missed that aif-handoff *wires a single shared transport*, making it effectively single-session. **Primary source wins.**

**Consequence for the bridge:** even a perfectly-coded MCP client (or the official SDK) cannot obtain a session id if the one transport is already initialized by anything else — and cannot release it. Right now this session's probes hold session `58ea08f1…`; a real MCP dispatch would fail with `-32600` until the MCP container restarts.

**Conditional, not absolute (fair-representation caveat):** on a *pristine* MCP container (freshly restarted, no prior `initialize`) with the bridge as the *sole* MCP client, the first `initialize` succeeds and MCP-via-SDK works. The fragility bites whenever: (a) the bridge process restarts without a container restart (its 2nd `initialize` → `-32600`), (b) any *other* MCP client connects first (a Claude Code session's own handoff MCP connection, a probe, a second dispatch), or (c) the container isn't restarted between bridge sessions. That is "normal operation" — and requiring "fresh container per bridge session" *is* the manual ritual the bridge exists to remove. So "decisive" = decisive **for a durable/repeatable bridge**, conditional for a one-shot pristine dispatch. This is the more immediate falsifier than the upstream-fix one in §3.4.

### §1.6 Never run live (confirmed)

The dispatch was built from source-reading ([`AifHandoffBackend.ts:5-11`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L5-L11) "NC-1 MCP SCHEMA DISCOVERY" via `gh api …/tools/*.ts`), never an end-to-end round-trip — so variant (c) is untested code carrying all four bugs above.

---

## §2 The MCP Streamable-HTTP contract (minimal client sequence, live-evidenced)

For the **MCP-target phase**, the minimal correct client sequence against `handoff-mcp v0.1.0` (protocol `2024-11-05`) is:

1. **`initialize`** — POST `:3100/mcp` with headers `Content-Type: application/json` **and** `Accept: application/json, text/event-stream`; body `{jsonrpc, id, method:"initialize", params:{protocolVersion:"2024-11-05", capabilities:{}, clientInfo:{…}}}`. → capture the `Mcp-Session-Id` **response header**; parse the **SSE-framed** body (`event: message\ndata:{…}`).
2. **`notifications/initialized`** — POST with the `Mcp-Session-Id` header (MCP spec post-init notification).
3. **`tools/call`** — POST with the `Mcp-Session-Id` header; response is SSE-framed; the tool payload is `result.content[0].text` (a JSON string to parse).

Session lifecycle: **single global session** as currently wired (§1.5); no `DELETE /mcp` teardown; reset = MCP container restart.

Tools available (from `tools/list` + [`AifHandoffBackend.ts:13-58`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L13-L58)): `handoff_create_task`, `handoff_update_task`, `handoff_get_task`, `handoff_list_projects`, `handoff_list_tasks`, `handoff_search_tasks`, `handoff_annotate_plan`, `handoff_push_plan`, `handoff_sync_status`. `handoff_sync_status` sets `status`+`paused` atomically (last-write-wins conflict resolution; terminal `done`/`verified` guarded) — SSOT #44.

---

## §3 MCP-vs-REST brainstorm + scored verdict

### §3.1 The fork

The dispatch path is the only contested surface — **status read-back already uses REST/WS on :3009** ([`aifWsStatus.ts`](../../../packages/runtime-bridge/src/aifWsStatus.ts), unaffected by this decision). The question is purely: how does `dispatch()` create-task → push-plan → advance-to-`plan_ready`?

### §3.2 Scored comparison (evidence-backed)

| Criterion | MCP-via-SDK | REST (:3009) | Winner |
|---|---|---|---|
| Alignment with aif-handoff design | sanctioned integration surface (SSOT #44, DeepWiki §2) | "core CRUD", less-sanctioned | MCP |
| The 4 live bugs (§1.1-§1.4) | SDK handles port/Accept/init/SSE automatically (§4) | none apply — plain-JSON REST | tie (both solvable) |
| **Single-session fragility (§1.5)** | **broken: 1 connection, no teardown, restart-to-reset** | **stateless: no session, every call independent** | **REST (decisive)** |
| Atomicity / status-write | `handoff_sync_status` = 1 privileged call sets status+paused atomically | **no direct status-write** (live-probed §3.3: `PUT {status}` is ignored) — must use `POST /events` (state machine) + separate `PUT {paused}` | MCP (now larger than "minor") |
| New dependency | adds `@modelcontextprotocol/sdk` + consumer must set `MCP_TRANSPORT=http`/`MCP_PORT` | zero new dep; one port for everything | REST |
| Implementation effort | medium (adopt SDK, connection mgmt, config) | low (native `fetch`, same style as `getTaskStatus`) | REST |
| Live this session | blocked — server already initialized (§1.5) | **HTTP mechanics verified** (201/200/event-accepted/200/200); **`plan_ready` outcome NOT reached** — dirty-worktree guard (§3.3) | REST (mechanics only) |

### §3.3 REST dispatch — live-verified this session (T-MCPfix-A counter)

Full sequence on test project `441c1c0c…`, then cleanup:

```text
POST /tasks {projectId,title,paused:true,autoMode:true}  → 201  (id=a6c71b9c…, status:"backlog")
PUT  /tasks/:id {plan:"…"}                                → 200
POST /tasks/:id/events {event:"accept_existing_plan"}     → event ACCEPTED, then failed on:
   "Branch isolation failure (dirty_worktree): Working tree at /home/www/rules-as-tests-aif
    has uncommitted changes (?? .ai-factory.json, …)"
PUT  /tasks/:id {paused:false}                            → 200
GET  /tasks/:id                                           → 200  (status:"backlog", paused:false)
DELETE /tasks/:id                                         → 200  (cleanup)
```

Three findings:
- **`accept_existing_plan` exists as a REST event** (the endpoint accepted the event name and processed it) — resolves the flag-vs-event ambiguity in [`AifHandoffBackend.ts:27-30`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L27-L30) (it does NOT exist as a `handoff_create_task` *flag*, but DOES exist as a task *event*).
- **No direct REST status-write (probed this session).** `PUT /tasks/:id {status:"plan_ready", paused:false}` → HTTP 200 but `status` stays `"backlog"` (only `paused` flipped); `PUT {status:"planning"}` → 200, status unchanged. **`PUT` silently ignores `status`.** So status transitions are **state-machine-only via `POST /events`** — there is **no clean REST mirror of `handoff_sync_status`**. Consequence (reviewer MAJOR-2, confirmed): the REST advance is irreducibly **event-driven** (a state-machine transition), not a direct write, and requires a separate `PUT {paused:false}`. This makes MCP's atomic-write advantage **larger than "minor"** (§3.2) — but does **not** flip the verdict, because MCP remains single-session-blocked (§1.5).
- **Branch-isolation / clean-worktree precondition** — aif-handoff refuses to advance a task (via the `accept_existing_plan` event) while the target project worktree is dirty. **This precondition is path-independent** — `handoff_sync_status` (MCP) enforces the same guard. So it is NOT a REST disadvantage; it is an operational requirement for the live-test harness (§6).

**What was and was NOT verified (T14 — mechanics ≠ outcome):** the REST *HTTP mechanics* are verified (POST/PUT/events/GET/DELETE all reachable, correct codes; `accept_existing_plan` accepted). The *semantic outcome* — `backlog` → `plan_ready` via the event, then coordinator pickup — was **NOT** reached this run (dirty-worktree guard fired first) and remains an **I-phase MUST-verify with a clean worktree** (§6).

### §3.4 Verdict — **REST-now + MCP-target**

- **Now (I-phase):** switch `dispatch()` to the REST sequence above (native `fetch`, no new dependency). The single-session fragility (§1.5) makes the MCP path unreliable for a *working* bridge today; REST is stateless, verified, and the bridge already auto-falls-back to `ManualBackend` on any error ([`docs/runtime-bridge-setup.md:54`](../../runtime-bridge-setup.md)) — covering the minor non-atomic window.
- **Target (deferred):** MCP-via-SDK (§4) becomes the dispatch path **once aif-handoff lands a per-session-transport fix upstream** (transport map keyed by `Mcp-Session-Id`, plus a `DELETE /mcp` teardown). This honors the sanctioned-surface + atomicity advantages without blocking a working bridge on an upstream PR.
- **Falsifiers (when this verdict is wrong):** (1) if aif-handoff ships per-session transports before the REST I-phase lands, MCP-via-SDK becomes immediately viable — re-score §3.2 row "single-session fragility" flips to tie; (2) if the operating model is genuinely *one-shot pristine container, bridge-as-sole-client, no bridge restart* (§1.5 caveat), MCP-via-SDK already works today and the only blocker is the §1.1-§1.4 client bugs — but that operating model reintroduces a manual container-restart ritual, which is why it is not the default; (3) if I-phase live-testing (clean worktree) reveals `accept_existing_plan` does NOT reach `plan_ready` from `backlog` (§3.3 unverified), the REST dispatch sequence itself needs redesign (e.g. `start_ai` → `planning` path) before REST-now is shippable.

---

## §4 BFR §3 — hand-roll the MCP handshake vs ADOPT `@modelcontextprotocol/sdk` (for the MCP-target phase)

**Search performed (T11/T12):**
- **SSOT consult** ([`prior-art-evaluations.md`](../prior-art-evaluations.md)): #44 (`@aif/mcp` server, DEFER — the dispatch target), #43 (`@aif/runtime`, ADOPT-VOCABULARY), #42 (DeepWiki MCP over Streamable HTTP, ADOPT-CONDITIONAL — project already recognises this transport). **No entry exists for the MCP *client* SDK** → a new entry is required when the MCP-target phase begins.
- **WebSearch** (`@modelcontextprotocol/sdk StreamableHTTPClientTransport`, 2026-05): the official TS SDK `StreamableHTTPClientTransport` automatically handles (a) the `Accept` header, (b) the `initialize` handshake, (c) `Mcp-Session-Id` capture + reuse on subsequent requests, (d) SSE framing, plus reconnection/resumption. Sources: [typescript-sdk client.md](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/client.md), [npm @modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk), [MCP transports spec](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports).

**T16 problem-class check:** SDK client = "programmatic MCP client connecting to an HTTP MCP server." Our need = "programmatic one-shot dispatch of `tools/call` from the runtime-bridge." **Match** — we need a programmatic client, not an interactive session; the SDK `Client` + transport is exactly that.

**Verdict (BFR §3): ADOPT `@modelcontextprotocol/sdk` — DEFERRED to the MCP-target phase.** Hand-rolling would reimplement all four of §1.1-§1.4 correctly (Accept header, init, session reuse, SSE parsing) — perpetual maintenance of protocol plumbing the official SDK already maintains. Per [build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md) default = ADOPT. **Not adopted now** only because the REST-now verdict (§3.4) makes the MCP client unnecessary until the upstream server fix lands.

**Draft SSOT entry (to land with the MCP-target capability commit, next free ID #92):**

> `#92 | @modelcontextprotocol/sdk StreamableHTTPClientTransport (modelcontextprotocol/typescript-sdk) | Programmatic MCP client over Streamable HTTP — automatic Accept-header, initialize handshake, Mcp-Session-Id reuse, SSE framing | ADOPT (deferred) | WebSearch + live contract §2; replaces hand-rolled _mcpCall plumbing. Trigger to revisit: MCP-target phase begins (after aif-handoff per-session-transport upstream fix).`

> **Note:** the **REST-now** I-phase adds **no new explicit dependency** (native `fetch`, mirroring `aifWsStatus.getTaskStatus`) and edits an existing file → **not a capability commit** under [CLAUDE.md «What is a capability commit?»](../../../CLAUDE.md). It carries a `Prior-art: skipped — refactor of existing dispatch path, no new capability/dependency` trailer.

---

## §5 Config refactor — `mcpUrl` decoupled from `baseUrl` (do regardless of verdict, per kickoff §3.3)

Even with REST-now, decouple the two surfaces so the MCP-target phase is a drop-in:

- Add `mcpUrl?: string` to `AifHandoffConfig` (default `http://localhost:3100`), separate from `baseUrl` (`http://localhost:3009`, REST/WS). `_mcpCall` (when MCP-target lands) targets `mcpUrl`; REST/WS stay on `baseUrl`.
- Add env `RUNTIME_BRIDGE_AIF_MCP_URL` (default `:3100`); the existing `RUNTIME_BRIDGE_AIF_URL` stays `:3009` (REST/WS). Wire both in [`setup-runtime-bridge.sh`](../../../packages/runtime-bridge/scripts/setup-runtime-bridge.sh).
- Update [`docs/runtime-bridge-setup.md`](../../runtime-bridge-setup.md): the Ports table already documents the :3009/:3100 split (lines 38-46) — promote it from "tracked follow-up" prose to a wired `RUNTIME_BRIDGE_AIF_MCP_URL` row in the env table.

For REST-now this `mcpUrl` is unused at runtime (dispatch is REST on `baseUrl`), but landing it now avoids a second config migration when MCP-target arrives.

---

## §6 I-phase sketch + live-test harness

**I-phase scope (REST-now):**
1. Rewrite `AifHandoffBackend.dispatch()` to the REST sequence (§3.3): `POST /tasks {paused:true}` → `PUT /tasks/:id {plan}` → `POST /tasks/:id/events {event:"accept_existing_plan"}` → `PUT /tasks/:id {paused:false}`. Reuse the `fetch`+`AbortController`+`BackendError` style of [`aifWsStatus.getTaskStatus`](../../../packages/runtime-bridge/src/aifWsStatus.ts#L294). **MUST-verify FIRST (gating §3.3/§3.4 falsifier 3):** against a *clean* target worktree, confirm `accept_existing_plan` actually moves `backlog`→`plan_ready`. If it routes through `planning` instead, switch step 3 to the correct event (`start_ai`) or sequence. Status is **event-only** — do NOT attempt `PUT {status}` (silently ignored, §3.3).
2. Keep `getStatus`/`awaitDone` unchanged (already REST/WS on `baseUrl`).
3. Add the `mcpUrl` config + env (§5) — inert until MCP-target.
4. Map REST failures onto existing `BackendError` codes: `429`→`quota_exceeded`, connection refusal/timeout→`unavailable`, dirty-worktree / other 4xx→`dispatch_failed` (→ auto-fallback to Manual).
5. Tests: unit (mock `fetch`, assert the 4-call sequence + error mapping) + a documented manual live-test harness (below). No paid LLM (§6 no-paid-LLM check: client-side HTTP only; aif-handoff runs on the operator's CLI-transport subscription — trivially compliant).

**Live-test harness (manual, against running instance):**
- **Precondition:** the dispatched project's worktree (`/home/www/rules-as-tests-aif`) is **clean** (§3.3 — branch-isolation guard blocks advance on a dirty tree). Document `git -C <project> status` as step 0.
- **Pass:** `dispatch()` → task created `paused:true` → plan set → `accept_existing_plan` → `paused:false` → `GET /tasks/:id` shows `status:"plan_ready"` → coordinator advances to `implementing` → terminal `done`/`verified`. `awaitDone` resolves `success:true`.
- **Fail / fallback:** any step errors → `BackendError` → bridge prints copy-paste Manual instructions (existing behaviour).
- **Cleanup:** `DELETE /tasks/:id` for any test task.

**MCP-target phase (separate umbrella, deferred):** (a) upstream aif-handoff PR — per-session transport map + `DELETE /mcp` teardown; (b) ADOPT `@modelcontextprotocol/sdk` (§4), land SSOT #92; (c) switch `dispatch()` to MCP via `mcpUrl`; (d) live end-to-end re-test.

---

## §7 §1.7 self-reflexive forward + backward check

**Forward-check** — this patch complies with:
- [no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md): the fix is client-side HTTP dispatch; aif-handoff runs on the operator's CLI-transport subscription; no API-billed call, no CI LLM. ✅
- [build-first-reuse-default.md §1/§3](../../../.claude/rules/build-first-reuse-default.md): BFR §3 search done (§4); REST-now adds no dependency (reuse native `fetch`); MCP-target ADOPT-verdict for the SDK recorded as draft SSOT #92, not hand-rolled. ✅
- [dual-implementation-discipline.md](../../../.claude/rules/dual-implementation-discipline.md): `AifHandoffBackend` carries `@dual-pair: runtime-bridge-aif-handoff` ([`:68`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L68)); the REST-now refactor edits the same `@dual-pair` artefact — no new channel introduced, no drift. ✅
- [doc-authority-hierarchy.md §2-§3](../../../.claude/rules/doc-authority-hierarchy.md): this file carries scope annotation (line 1) + Class + Authoritative-for header. ✅
- [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md): the MCP-vs-REST fork collided with the maintainer's stated MCP preference → surfaced as DECISION-NEEDED with both paths' consequences, not unilaterally picked; maintainer confirmed (header DECISION block). ✅

**Backward-check** — supersedes/extends: this patch is the live-verified successor to the source-only "NC-1 MCP SCHEMA DISCOVERY" assumptions in [`AifHandoffBackend.ts:5-61`](../../../packages/runtime-bridge/src/AifHandoffBackend.ts#L5-L61) and the "MCP-port split" follow-up in [`docs/runtime-bridge-setup.md:46`](../../runtime-bridge-setup.md). It does NOT rewrite those (frozen-as-shipped); the I-phase will. SSOT #44 (`@aif/mcp`, DEFER) is unaffected — this patch does not adopt the *server*; it defers the *client* SDK (#92 draft). No other artefact silently superseded.

**T15 self-application:** this R-phase audited the dispatch path against live ground truth, refuted a DeepWiki claim with primary source (§1.5), and re-verified the *recommended* path itself (§3.3) rather than inheriting the kickoff's REST claims — applying T3/T-MCPfix-A to its own verdict.

---

## 🟢 Простыми словами

Бридж — это «отправлятор задач» в aif-handoff, чтобы не копировать промпты руками. У aif-handoff два входа: «парадный» (MCP, порт 3100) и «служебный» (REST, порт 3009). Я впервые потыкал **живой** сервер и нашёл: у парадного входа сломан замок — он пускает только **одного** гостя, пока не перезагрузишь контейнер (это косяк в самом aif-handoff, со стороны бриджа не чинится). Плюс старый код стучался не в тот порт, без нужного заголовка, и не умел читать ответ в формате SSE — три бага сразу.

Служебный вход (REST) я проверил вживую: создать задачу → положить план → событие принято → снять паузу → почистить — все HTTP-вызовы отвечают правильно. **Честная оговорка:** до самого «запустилось» (статус `plan_ready` → координатор взял в работу) в этот раз не дошло — aif-handoff не двигает задачу, пока рабочая папка проекта грязная (это требование общее и для MCP). Это первый шаг I-фазы: проверить переход на чистой папке. Поэтому **вердикт: сейчас ходим через REST** (механика работает, без новых зависимостей, без ритуала перезагрузки), а **MCP записываем как цель на потом** — когда в aif-handoff починят замок (отдельная правка в их репозитории), тогда возьмём официальный MCP-SDK (он сам делает всё рукопожатие). Код в этой фазе не трогал — это исследование с планом внедрения; ты ревьюишь перед любым кодом.
