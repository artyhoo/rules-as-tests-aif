# Runtime bridge — consumer setup

> **Authoritative for:** consumer-facing setup of the runtime bridge (Phase 1, aif-handoff backend) — install/opt-out flow, required config env, cost-cap behaviour, port layout, and the auto-review escalation path.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../README.md#why-this-exists). The bridge architecture/interface — see [packages/runtime-bridge/DESIGN.md](../packages/runtime-bridge/DESIGN.md). amux backend — Phase 2 (not yet functional).

The runtime bridge lets `/meta-orchestrator` kickoffs dispatch cross-session work to an aif-handoff runtime instead of manual copy-paste. It is **opt-in**: with nothing installed, `ManualBackend` (copy-paste) is always the default, and the bridge never degrades that experience — it only adds automation when aif-handoff is present and you opt in.

## Quick start

```bash
# run from your project root
bash packages/runtime-bridge/scripts/setup-runtime-bridge.sh
```

The script probes for a reachable aif-handoff coordinator, then asks whether to enable the bridge:

- **yes** → it writes the required `RUNTIME_BRIDGE_*` env to your shell rc, copies the PostToolUse hook into `.claude/hooks/`, and prints the exact `settings.json` entry for you to paste (it never edits `settings.json` for you — that file is agent-protected).
- **no** → it prints the per-task opt-out marker and changes nothing.

The script **detects and instructs — it never installs aif-handoff for you** (`docker compose up`, MCP server bring-up, and the `transport: "cli"` profile change are yours to run).

## Required config env

The bridge is **non-functional** if `RUNTIME_BRIDGE_AIF_PROJECT_ID` is unset — `AifHandoffBackend.dispatch()` throws `dispatch_failed` and silently falls back to `ManualBackend` with no obvious signal. Set all of:

| Env var | Required? | Default | Purpose |
|---|---|---|---|
| `RUNTIME_BRIDGE_MODE` | no | `auto` | `auto` / `manual` (force ManualBackend) / `aif-handoff` (force or fail). `amux` is reserved for Phase 2 — present as an enum value but **not yet functional** (it warns and falls back to ManualBackend). |
| `RUNTIME_BRIDGE_AIF_PROJECT_ID` | **yes** (for the bridge to dispatch) | — | Your aif-handoff project UUID. Without it the bridge cannot create tasks. |
| `RUNTIME_BRIDGE_AIF_URL` | only for non-default deployments | `http://localhost:3009` | aif-handoff REST/WS base URL. Set this if aif-handoff runs on another host/port. |

## Required aif-handoff-side config

- **`transport: "cli"`** in the aif-handoff Claude runtime profile. This is **NOT** the default — the default is the metered SDK transport (`RuntimeTransport.SDK`, `packages/runtime/src/adapters/claude/index.ts:449`). The CLI transport runs through the official Claude Code CLI and is safe on a Max/Pro subscription; the SDK transport is API-metered. Verify with `aif-handoff config show`.
- **`AGENT_AUTO_REVIEW_STRATEGY=closure_first`** — aligns aif-handoff's auto-review with the layered-review design (see *Auto-review escalation* below).

## Ports

aif-handoff exposes more than one surface; they do **not** share a port:

| Surface | Default port | Used by |
|---|---|---|
| REST + WebSocket | `3009` | bridge status read-back (`getStatus` REST `GET /tasks/:id`, `awaitDone` WS `ws://…:3009/ws`) |
| MCP (HTTP mode) | `3100` | task dispatch when MCP runs in HTTP mode (MCP's default transport is **stdio**, not HTTP) |

`RUNTIME_BRIDGE_AIF_URL` points at the **REST/WS** surface (`:3009`). If you run aif-handoff's MCP in HTTP mode on a different port, dispatch and status currently share one `baseUrl` — a known limitation; a dedicated dispatch-vs-status URL split is a tracked follow-up.

## Opt-out

The bridge is fully optional and degrades gracefully:

- **Session-wide:** `export RUNTIME_BRIDGE_MODE=manual` forces `ManualBackend` even when aif-handoff is installed.
- **Per task:** make the **first line** of a kickoff `<!-- bridge: skip -->` → that one task uses `ManualBackend` (copy-paste) even when the bridge is active.
- **Automatic:** on any backend exception — `quota_exceeded`, `unavailable`, a dropped WebSocket — the bridge auto-falls-back to `ManualBackend` and prints copy-paste instructions. This is expected behaviour, not a bug; the worst case is a return to the manual status quo.

## Cost cap (read before enabling)

> ⚠️ After **2026-06-15**, `claude -p` — and therefore the aif-handoff CLI transport — draws from a **separate monthly Agent SDK credit** ($20 on Pro / $100 on Max 5x / $200 on Max 20x), distinct from your interactive Claude Code usage. Monitor it via `/usage` or the Anthropic billing dashboard. If your monthly use exceeds the credit cap, dispatch fails with `quota_exceeded` and the bridge auto-falls-back to `ManualBackend` until the credit refreshes. The bridge cannot exceed the cap silently — it degrades, it does not overspend.

## Auto-review escalation (non-blocking)

With `AGENT_AUTO_REVIEW_STRATEGY=closure_first`, aif-handoff runs its own review loop on each dispatched task. When that loop cannot converge (unresolved blocking findings, or `maxReviewIterations` reached), the task is **not** left hanging in a review state — it moves to **`done`** with `manualReviewRequired: true` set, and the pipeline continues. This is **non-blocking** by design (verified in `packages/agent/src/coordinator.ts:403` `if (outcome?.status === "manual_review_required")` → `:416` `manualReviewRequired: true` → `:432` log *"Auto review gate stopped at manual review handoff"*, transition `to: "done"`; field defined in `packages/shared/src/stateMachine.ts`).

So strategy decisions never get silently picked by the runtime — they surface as a flag for you to review in batch:

- **Kanban / Task detail:** flagged tasks show a **"MANUAL REVIEW"** badge (`TaskCard` / `TaskDetailHeader`).
- **REST:** `GET /tasks/:id` returns `manualReviewRequired` + `autoReviewState` (review strategy, iteration, findings).
- **Batch-review pattern:** periodically open a fresh Claude Code session, walk the accumulated flagged tasks, and resolve each with aif-handoff's **Approve** / **Request changes** actions (which clear the flag). Pair this with a brainstorming pass when a flagged task needs a real decision rather than a yes/no.

The flag is distinct from `blocked_external` (a runtime/resource error that stops automated processing) — `manualReviewRequired` means automated processing *completed* but wants human oversight.

## See also

- [packages/runtime-bridge/DESIGN.md](../packages/runtime-bridge/DESIGN.md) — bridge architecture + `RuntimeBackend` interface.
- [.claude/hooks/runtime-bridge-dispatch.sh](../.claude/hooks/runtime-bridge-dispatch.sh) — the PostToolUse hook the setup script wires in.
