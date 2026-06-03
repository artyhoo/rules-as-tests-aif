---
name: aif-doctor
description: Use when the aif-handoff runtime is misbehaving — a task is stuck/crash-looping, new tasks stay backlog at capacity, the claude runtime is broken, or "why won't my task start / aif health / aif не отвечает / задача висит / рантайм сломан". Read-only diagnosis runs autonomously; any mutation (delete task, bump cap, rebuild, in-container install) is surfaced with evidence + reversibility and waits for operator GO. Invokable when the dispatcher is NOT running. Triggers: aif-doctor, aif health, task stuck, task висит, runtime broken, рантайм сломан, capacity skipping, native binary not installed, why won't my task start. Does NOT run the dispatch loop (/dispatcher) or planning (/pipeline).
arguments: []
disable-model-invocation: false
model: opus
allowed-tools:
  - Bash(curl *)
  - Bash(docker *)
  - Bash(git *)
  - Bash(bash *)
  - Bash(ls *)
  - Bash(cat *)
  - Bash(grep *)
  - Read
---

<!-- @cc-only-rationale: operator-internal diagnostic runbook for the maintainer's local aif-handoff stack; the markdown content is harness-agnostic (any session can read it), only the slash-command auto-invocation is CC-native. No portable counterpart to keep in sync → §6 dual-implementation-discipline.md marker is @cc-only, not @dual-pair. -->

> **Class:** C — prose-only runbook; mechanical substrate = existing $0 helpers (`bridge-health.sh`, `verify-bridge.sh`) + upstream read-only endpoints (`/health`, `/agent/status`). No new code, no npm deps. Promotion criterion: ≥2 «re-derived aif operational knowledge» incidents after ship → consider a session-start `bridge-health.sh` auto-run hook (`.claude/hooks/`).
> **Authoritative for:** /aif-doctor behaviour — §0 invocation through §8; the read-only health-sweep → classify → emit-mapped-fix → mutation-needs-GO flow; the empirically-observed failure-mode catalogue (§3) and its detector→fix→reversibility mapping.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The dispatch/execution loop — see [.claude/skills/dispatcher/SKILL.md](../dispatcher/SKILL.md). Planning / priority / launch-table — see [.claude/skills/pipeline/SKILL.md](../pipeline/SKILL.md). Global `~/.claude/skills/orchestrator/` (agent-uncommittable, owner=maintainer). The host proxy tunnel itself (§3.3 names it and stops — fixing it is operator machine-level work).

# /aif-doctor — aif operational-health triage

**Origin:** BUILD verdict 2026-06-03. The `/dispatcher` loop works, but the *operating environment* repeatedly breaks (runtime crash-loop, capacity saturation, flaky proxy) and nothing captured how to triage it in seconds instead of re-deriving every session. SSOT #112. Kickoff: `.claude/orchestrator-prompts/aif-doctor-skill/kickoff.md` (gitignored — local-only, not a resolvable link).

**Substrate:** existing helpers + upstream read-only endpoints. Zero new scripts, zero npm deps, zero LLM/API-billed calls ([no-paid-llm-in-ci.md §1](../../rules/no-paid-llm-in-ci.md)). A full agent run costs tokens; this skill spends none — `curl` + `docker exec` + `grep` only.

---

## §0 Invocation

**Slash command:** `/aif-doctor` — or auto-fires on the trigger phrases above (`disable-model-invocation: false`, tight description). Must NOT fire during a normal `/dispatcher` run; it is for when something is *wrong*.

**Two decisions baked in (Q1/Q2, do not re-litigate):**

1. **Separate skill, not `dispatcher §4`.** `/dispatcher` owns the happy-path loop and is `disable-model-invocation:true`; its NOT-authoritative-for header names only planning/pipeline/orchestrator — operational-environment health was left implicit, and this skill makes it explicit. Operational triage has a distinct trigger and must be invokable when the dispatcher is NOT running.
2. **Diagnose autonomously, mutate only on operator GO.** Read-only probing (curl `/tasks`+`/agent/status`, `docker ps/logs`, `claude --version`, mode classification, emitting the exact fix command) runs without asking. **Any mutation** — delete a task, free a slot, `npm install`/`install.cjs` in-container, image rebuild, bump `COORDINATOR_MAX_CONCURRENT_TASKS` — is surfaced with **evidence + reversibility**, then waits for GO. Rationale: [`operator-control-not-decide-everything`], [`stop-surface-not-hack-on-dispatch-fail`], [recommendation-laziness-discipline.md §3](../../rules/recommendation-laziness-discipline.md).

---

## §1 Reuse-first inventory (BFR — do NOT rebuild)

Run these in order; each is $0 and read-only. **Reuse, do not reimplement.**

| Probe | Command | What it answers |
|---|---|---|
| Container-side health | `bash packages/runtime-bridge/scripts/bridge-health.sh` | dirty_worktree (409), stale park code (#357), container→aif net, dedup hygiene |
| Host-side dispatch smoke | `bash packages/runtime-bridge/scripts/verify-bridge.sh` | REST dispatch round-trip (creates+deletes ONE throwaway task) |
| Liveness | `curl -s -m5 http://localhost:3009/health` | API up? → `{"status":"ok","uptime":N}` |
| Active tasks + staleness | `curl -s -m5 http://localhost:3009/agent/status` | per-task `status`, `heartbeatLagMs`, `heartbeatStale`, `activeTaskCount`, `staleTasks` (upstream's own watchdog view) |
| Container state | `docker ps --filter name=aif --format '{{.Names}}\t{{.Status}}'` | are agent/api/mcp/web all Up? |
| Self-heal parallel flag | `tsx packages/runtime-bridge/src/cli/ensure-parallel.ts` | restores `parallelEnabled` DB flag (worktree-isolation gate) |

**Upstream watchdog already covers slow-stale tasks.** aif-handoff's coordinator runs `recoverStaleInProgressTasks()` each poll: tasks in `planning`/`implementing`/`review` with no heartbeat for `AGENT_STAGE_STALE_TIMEOUT_MS` (default ~90 min) auto-move to `blocked_external`, retry ≤3×, then quarantine (`retryAfter=null`, needs manual intervention). **Implication (BFR):** do NOT manually clear a *slow-stale* task — the watchdog will. The §3 modes below are precisely the ones the watchdog **cannot** see (a fast crash-loop keeps the heartbeat fresh; a `plan_ready` slot-holder is not in the watchdog's status set; a host-proxy block is off-box). Verified live 2026-06-03 — see §7.

> `/agent/readiness` was probed and **404s on :3009** in the current image (do not trust the upstream wiki claim — verified, T20). Use `docker exec … claude --version` for the runtime-binary check (§3.1), not that endpoint.

---

## §2 The triage flow

1. **Read-only sweep** (autonomous, no GO): run §1 probes top-to-bottom. Stop early only if `/health` is unreachable → containers down → `docker ps`/`docker logs` first.
2. **Classify** the failure into one §3 mode using the detector signatures. If no §3 mode matches and `bridge-health.sh` is green → report «no known failure mode; collect a fresh symptom» (do NOT speculate, T-AIFDOC-B).
3. **Emit the mapped fix command** with its file:line / log-line evidence and a one-line reversibility note. Read-only fixes (re-run a probe) you may run; **mutations stop here for GO**.
4. **On GO** (and only then): run the mutation, re-run the relevant §1 probe to confirm, report the delta.

---

## §3 Failure-mode catalogue (empirically observed only — T-AIFDOC-B)

Three modes `bridge-health.sh` does **not** cover (confirmed by reading its source 2026-06-03: it checks container-present / dirty_worktree / park-code+net / dedup). Grow this list on incidence, never speculatively.

> The commands below hard-code `aif-handoff-agent-1`. If the compose project was renamed, resolve the real name first (same logic `bridge-health.sh` uses): `C=$(docker ps --filter name=agent --format '{{.Names}}' | grep -i aif | head -1)` and substitute `$C`, or set `RUNTIME_BRIDGE_AGENT_CONTAINER`.

### §3.1 Runtime native-binary missing → task crash-loops in `planning`

- **Detect (read-only):**
  - `docker exec aif-handoff-agent-1 claude --version` → `exec format error` **or** `Error: claude native binary not installed`.
  - `docker exec aif-handoff-agent-1 sh -c 'ls /usr/local/lib/node_modules/@anthropic-ai/claude-code-linux-arm64/'` → **empty** (optional dep never downloaded).
  - Coordinator log: `docker logs aif-handoff-agent-1 --tail 60 | grep -iE 'native binary|ClaudeRuntimeAdapterError'` → `ClaudeRuntimeAdapterError … Claude CLI exited with code 1: Error: claude native binary not installed … the platform-native optional dependency was not downloaded (--omit=optional)`, `transport:"cli"`.
  - Symptom on `/agent/status`: task stuck `status:"planning"`, **fresh** heartbeat (`heartbeatStale:false`) that resets each tick → the upstream 90-min watchdog NEVER fires (this is why it's a real gap).
- **Root cause:** image rebuilt while the proxy was down → optional `@anthropic-ai/claude-code-<platform>` never fetched from the npm registry.
- **Fix A — durable (operator GO):** rebuild the agent with a working proxy:
  `HTTPS_PROXY=<live-proxy> NO_PROXY=localhost,127.0.0.1,::1,api,agent,web,mcp docker compose build agent && docker compose up -d agent`. **Reversibility:** rebuild is additive; the OAuth credential volume + `env_file` survive (§ topology). Blocked if §3.3 (proxy) is also down.
- **Fix B — in-container install (operator GO):** `docker exec aif-handoff-agent-1 npm i -g @anthropic-ai/claude-code` — works ONLY if the container can reach the registry (fails under §3.3). **Reversibility:** in-place, no data loss; superseded by next image rebuild.
- **Fix C — bypass the binary (operator GO, paid-aware):** switch the claude runtime profile to **API transport** (`aif-handoff docs/providers.md:64`; needs `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_BASE_URL`). **Flag the paid-vs-subscription nuance** ([no-paid-llm-in-ci.md](../../rules/no-paid-llm-in-ci.md)): a paid API key is NOT the default — DEFER unless the operator explicitly authorizes (§7 stop condition).

### §3.2 Capacity cap saturated by stale/zombie slot-holders

- **Detect (read-only):**
  - New task stays `backlog`; coordinator log: `docker logs aif-handoff-agent-1 --tail 60 | grep -i capacity` → `"active":N,"limit":N,"msg":"Auto-queue: project pipeline at capacity, skipping"` (note: cap is **per-project** when `parallelEnabled`; the log names the `projectId`).
  - `docker exec aif-handoff-agent-1 sh -c 'echo ${COORDINATOR_MAX_CONCURRENT_TASKS:-unset}'` → `unset` means default **3** (range 1–10).
  - `curl -s :3009/tasks` → find the N occupiers; a true zombie is `plan_ready`/`review` whose sibling umbrella is already verified/merged.
- **Fix 1 — free a slot via the official route (operator GO):** `curl -s -X DELETE http://localhost:3009/tasks/<id>` (same REST route the web UI uses; upstream `lee-to/aif-handoff api/src/routes/tasks.ts` `DELETE /tasks/:id`, in the aif image — not this repo) on a **verified** zombie. **MUST verify zombie status first** (T-AIFDOC-A) — `implementationLog:false` AND sibling umbrella verified/merged; never delete on name/jaccard match alone. **Reversibility:** DELETE is destructive (task record gone) → this is exactly why it needs GO + verification.
- **Fix 2 — raise the cap (operator GO, reversible):** bump `COORDINATOR_MAX_CONCURRENT_TASKS` (1–10) in compose env + `docker compose up -d agent`. **Reversibility:** trivially revert the env value. Prefer this over DELETE when the occupiers are legitimately in-flight.

### §3.3 Host↔npm-registry proxy block (flaky tunnel) — NAME IT AND STOP

- **Detect (read-only):** `curl --max-time 25 -sSL -o /dev/null -w '%{http_code}' https://registry.npmjs.org/@anthropic-ai/claude-code` times out from **both** host and container. Matches memory [`project_github_push_flaky_proxy_tunnel`] (Clash-family fake-ip via `utun4`).
- **This skill's job is to name it, not fix it.** It is the deferred machine-level proxy issue; the lever is operator-side (real-ip/DIRECT routing for the registry/github hosts). It blocks §3.1 Fix-A/B's npm path → push toward rebuild-with-a-known-good-proxy or §3.1 Fix-C (API transport). **Do not** attempt to mutate the tunnel from this skill.

---

## §4 Mutation discipline (the Q2 contract)

Every §3 fix that changes state (`DELETE`, `npm i`, `docker compose build/up`, cap bump, transport switch) is a **mutation**. For each, the skill prints:

```text
MUTATION (needs GO): <exact command>
  Evidence: <file:line | log line | probe output that justifies it>
  Reversibility: <how to undo, or "DESTRUCTIVE — task record gone">
  Awaiting operator GO.
```

Then **stops**. No mutation runs without an explicit GO in the same session. Read-only fixes (re-running a probe) run freely. This is the discipline the whole 2026-06-03 session exercised — the skill codifies it so it is not re-improvised.

---

## §5 Anti-scope

- **Does NOT run the dispatch loop** — that is `/dispatcher`. `/aif-doctor` diagnoses the environment the loop runs in.
- **Does NOT plan / score priority** — that is `/pipeline`.
- **Does NOT add npm deps or new scripts** — reuses §1 helpers + endpoints only; a genuinely-needed new probe = surface as a finding, do not build it here.
- **Does NOT auto-mutate the aif runtime** — every state change needs operator GO (§4).
- **Does NOT fix the host proxy tunnel** — names it (§3.3) and stops.
- **Does NOT edit `~/.claude/skills/orchestrator/`** — maintainer-owned, agent-uncommittable.

---

## §6 AI-traps active ([ai-laziness-traps.md §2](../../rules/ai-laziness-traps.md))

- **T11/T13/T16** — verified `bridge-health.sh` scope by reading its source (not by name); confirmed it does NOT cover §3's three modes. Upstream `/agent/status` watchdog reused for slow-stale; §3 modes are the watchdog's blind spots, proven live not assumed.
- **T15 self-application** — see §7: the skill is bench-tested against the three real 2026-06-03 symptoms and classifies each correctly.
- **T20** — every fix command above carries file:line / log-line / probe-output evidence, not a remembered string.
- **T-AIFDOC-A «jaccard/sibling ⇒ blind delete»** — before any `DELETE /tasks/:id`, confirm a true zombie (`implementationLog:false` AND sibling umbrella verified/merged); never delete on name-match alone.
- **T-AIFDOC-B «speculative failure catalogue»** — codify only empirically-observed modes; grow §3 on incidence (pain-driven), never pre-enumerate.

---

## §7 Bench-test (T15 self-application) — verified live 2026-06-03

The skill was run against the three real symptoms of the originating session; each classified correctly:

| Symptom (live) | Detector output | Classified | Evidence |
|---|---|---|---|
| Task `cf8534d9` stuck `planning`, crash-loops | `claude --version` → `exec format error`; native-binary dir empty; log `ClaudeRuntimeAdapterError … native binary not installed (--omit=optional)`, transport=cli; `/agent/status` heartbeatStale:false | **§3.1** | watchdog can't catch it (fresh heartbeat) ✅ |
| New task stays `backlog` | log `"active":3,"limit":3,"msg":"Auto-queue: project pipeline at capacity, skipping"`; cap `unset`→default 3 | **§3.2** | per-project cap saturated ✅ |
| npm fetch hangs | dual-side `curl registry.npmjs.org` timeout (host+container) | **§3.3** | proxy block; name-and-stop ✅ |

## §8 Stop conditions

- BFR surfaces an existing helper/endpoint that already does a §3 detection → **reuse it, shrink the skill to a pointer** (already applied: §1 reuses `/health`+`/agent/status` rather than building probes; the upstream stale-watchdog is referenced, not re-implemented).
- Any §3 fix requires a **paid-LLM path** (API transport with a paid key) → mark **DEFER** per [no-paid-llm-in-ci.md](../../rules/no-paid-llm-in-ci.md), never bake it as default (§3.1 Fix-C).

---

## Without this skill

The operator re-derives aif operational knowledge every session: which port the API is on, what `claude --version` should print, whether a stuck `planning` task is a crash-loop or a slow-stale one the watchdog will recover, whether `backlog` means a cap hit or a dispatch failure, and which of rebuild / in-container-install / API-transport / cap-bump / DELETE actually applies. Each diagnosis is improvised under pressure, mutations get attempted without checking reversibility (e.g. blind-`DELETE`-ing a slot-holder), and the host-proxy block gets mistaken for an aif bug and «fixed» in the wrong layer.

## With this skill

`/aif-doctor` runs the $0 read-only sweep, classifies the failure against the empirically-grounded §3 catalogue, and prints the one mapped fix with its evidence and reversibility — in seconds, without re-derivation. It distinguishes the watchdog-recoverable cases (leave them) from the three modes the watchdog cannot see (act on them), refuses to speculate beyond observed modes, and gates every state-changing fix behind an explicit operator GO. The host-proxy block is named and handed back to the operator instead of being chased in the wrong layer.

---

## §9 §1.7 self-reflexive note

**Forward-check:**
- [build-first-reuse-default.md §3](../../rules/build-first-reuse-default.md) + [phase-research-coverage.md §1](../../rules/phase-research-coverage.md) — BUILD verdict (the *runbook*) confirmed via the full mechanism: SSOT consult (#27/#28/#65/#67/#88/#109/#111 reviewed — none is an operator-facing aif health runbook); DeepWiki ≥3 phrasings on `lee-to/aif-handoff` (health/doctor, capacity-enforcement, runtime-transports — surfaced `/health`, `/agent/status`, `probeClaudeCli`, the stale-watchdog → REUSED, shrinking the skill); **WebSearch ≥3 phrasings** (operator health/doctor for aif-handoff; CLI diagnose AI-agent runtime native-binary/capacity; operator runbook self-hosted agent docker-compose triage) — surfaced only **wrong-problem-class** generic tools (Docker "Container Doctor" LLM-agents, `docker-ai` skill, Bedrock AgentCore arm64-binary diagnostics): generic Docker log-analysis, several **paid-LLM** (T16 mismatch + [no-paid-llm-in-ci.md](../../rules/no-paid-llm-in-ci.md)), none triages the aif coordinator + claude-native-binary + per-project-capacity class. **Adversarial counter-prompt** (§1 item 4 — «if an aif operator-doctor existed it would live in `lee-to/aif-handoff` or the docs site») surfaced no candidate → negative-existence claim holds. New SSOT #112 added in this commit.
- [dual-implementation-discipline.md §6](../../rules/dual-implementation-discipline.md) — operator-internal diagnostic; `@cc-only-rationale` marker present (markdown content is harness-agnostic, only invocation is CC-native — no portable counterpart to drift).
- [no-paid-llm-in-ci.md §1](../../rules/no-paid-llm-in-ci.md) — every probe is `curl`/`docker`/`grep`; zero API-billed calls. The one paid path (§3.1 Fix-C API transport) is explicitly DEFER-gated, never default.
- [doc-authority-hierarchy.md §3](../../rules/doc-authority-hierarchy.md) — Class C + Authoritative-for/NOT-authoritative-for header present.
- Principle 15 — `## Without this skill` / `## With this skill` paired-negative block present, halves differ.
- [recommendation-laziness-discipline.md §3](../../rules/recommendation-laziness-discipline.md) — every emitted fix is evidence-backed; mutations surface for GO rather than auto-acting (the fork-surfacing companion).

**Backward-check:**
- [.claude/skills/dispatcher/SKILL.md](../dispatcher/SKILL.md) (SSOT #111) — COMPLEMENTARY, not superseded: dispatcher owns the loop; its NOT-authoritative-for header (verified, line 24) names only planning/pipeline/orchestrator and is silent on operational-environment health — this skill makes that implicit gap explicit. No overlap in trigger (dispatcher = `disable-model-invocation:true`, explicit `/dispatcher`; doctor = fires on failure phrases).
- [.claude/skills/pipeline/SKILL.md](../pipeline/SKILL.md) — untouched; planning stays pipeline's.
- `packages/runtime-bridge/scripts/bridge-health.sh` / `verify-bridge.sh` / `src/cli/ensure-parallel.ts` — REUSED as-is, zero edits; this skill points to them.
- No existing rule or skill is superseded; this is a new operational artefact added on incidence (the 2026-06-03 environment breakage).
