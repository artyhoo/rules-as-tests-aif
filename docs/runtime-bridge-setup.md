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

- **yes** → it writes the required `RUNTIME_BRIDGE_*` env to your shell rc, copies the PostToolUse hook into `.claude/hooks/`, and **offers to auto-write** the PostToolUse entry to `.claude/settings.json` (idempotent — skips if the entry is already present; backs up to `settings.json.bak` before writing; JSON-validates before swapping; preserves all existing hooks). Pass `--no-write-settings` or decline the prompt to fall back to printing the snippet for manual pasting. Note: the *agent* (Claude Code) is deny-listed from editing `settings.json` via its `Edit(.claude/settings.json)` / `Write(.claude/settings.json)` tool permissions — that deny-list binds the agent's tool calls, not this human-run setup script, which is why the script may write safely with backup + validation + consent.
- **no** → it prints the per-task opt-out marker and changes nothing.

The script **detects and instructs — it never installs aif-handoff for you** (`docker compose up`, MCP server bring-up, and the `transport: "cli"` profile change are yours to run).

## Required config env

The bridge is **non-functional** if `RUNTIME_BRIDGE_AIF_PROJECT_ID` is unset — `AifHandoffBackend.dispatch()` throws `dispatch_failed` and silently falls back to `ManualBackend` with no obvious signal. Set all of:

| Env var | Required? | Default | Purpose |
|---|---|---|---|
| `RUNTIME_BRIDGE_MODE` | no | `auto` | `auto` / `manual` (force ManualBackend) / `aif-handoff` (force or fail). `amux` is reserved for Phase 2 — present as an enum value but **not yet functional** (it warns and falls back to ManualBackend). |
| `RUNTIME_BRIDGE_AIF_PROJECT_ID` | **yes** (for the bridge to dispatch) | — | Your aif-handoff project UUID. Without it the bridge cannot create tasks. |
| `RUNTIME_BRIDGE_AIF_URL` | only for non-default deployments | `http://localhost:3009` | aif-handoff REST/WS base URL. **Dispatch + status both use this** (dispatch is REST as of 2026-05-31). Set if aif-handoff runs on another host/port. |
| `RUNTIME_BRIDGE_AIF_MCP_URL` | no | `http://localhost:3100` | MCP (HTTP-mode) URL. **RESERVED for the MCP-target phase** — read into config but **not used by REST dispatch today**. Set now to avoid a later migration. |

## Required aif-handoff-side config

- **`transport: "cli"`** in the aif-handoff Claude runtime profile. This is **NOT** the default — the default is the metered SDK transport (`RuntimeTransport.SDK`, `packages/runtime/src/adapters/claude/index.ts:449`). The CLI transport runs through the official Claude Code CLI and is safe on a Max/Pro subscription; the SDK transport is API-metered. Verify with `aif-handoff config show`.
- **`AGENT_AUTO_REVIEW_STRATEGY=closure_first`** — aligns aif-handoff's auto-review with the layered-review design (see *Auto-review escalation* below).

## Ports

aif-handoff exposes more than one surface; they do **not** share a port:

| Surface | Default port | Used by |
|---|---|---|
| REST + WebSocket | `3009` | **dispatch** (REST `POST /tasks` → `PUT` plan → `POST /events` → `PUT` paused) **and** status read-back (`getStatus` REST `GET /tasks/:id`, `awaitDone` WS `ws://…:3009/ws`) |
| MCP (HTTP mode) | `3100` | **RESERVED for the MCP-target phase** — not used by REST dispatch today (MCP's default transport is **stdio**, not HTTP) |

`RUNTIME_BRIDGE_AIF_URL` points at the **REST/WS** surface (`:3009`) — both dispatch and status use it. `RUNTIME_BRIDGE_AIF_MCP_URL` (`:3100`) is read into config but **reserved** for the future MCP-target dispatch path; switching to MCP is gated on an upstream aif-handoff fix (per-session transport — see research-patch `2026-05-31-runtime-bridge-mcp-dispatch-fix.md`). The dispatch-vs-status URL split (previously a tracked follow-up) is now wired.

## Verify + result read-back

- **Smoke test (paste-and-run):** edit `PROJECT_ID` (or `export RUNTIME_BRIDGE_AIF_PROJECT_ID`) and run

  ```bash
  bash packages/runtime-bridge/scripts/verify-bridge.sh
  ```

  It checks dependencies + reachability + the clean-worktree precondition, then creates **one** throwaway task, reads its status back, and deletes it — printing a PASS/FAIL summary. It changes no persistent config (use `setup-runtime-bridge.sh` for that).

- **Result read-back:** dispatch is fire-and-forget (it runs inside a PostToolUse hook that must not block). To watch a dispatched task to completion and print the result, run the await CLI with the `taskId` printed at dispatch:

  ```bash
  tsx packages/runtime-bridge/src/cli/await.ts <taskId>            # block until done/verified/blocked
  tsx packages/runtime-bridge/src/cli/await.ts <taskId> --once     # one-shot status snapshot
  ```

  Exit code: `0` = terminal success, `1` = non-success / timeout / error.

> **Clean-worktree precondition (verify this before relying on autonomy):** aif-handoff refuses to advance a task to `plan_ready` while the target project worktree is dirty (a branch-isolation guard). A dirty tree surfaces as `dispatch_failed`; `dispatch()` then best-effort **deletes** the half-created task (rollback — no orphan) and the bridge falls back to `ManualBackend`. Commit/stash/gitignore the target tree, then re-run `verify-bridge.sh` to confirm a full `backlog → plan_ready` run. (The same guard applies to the MCP path — it is not REST-specific.) The REST dispatch HTTP mechanics + error mapping are unit- and live-verified; the end-to-end `plan_ready` + coordinator-pickup step is the operator's clean-worktree smoke-test check.

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
