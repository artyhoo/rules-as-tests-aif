<!-- scope:f2-runtime-bridge-fire -->
# F2 — CC Routines `/fire` as CC-native dispatch alternative (REST stays agnostic default)

> **Authoritative for:** R-phase research on CC Routines `/fire` HTTP endpoint as CC-native dispatch substrate; cost-model finding; status-read-back parity analysis vs `cli/await.ts`; dual-channel dispatch selector design; SSOT #102 stale-framing observation.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The I-phase implementation — that is a separate commit once the DECISION-NEEDED below is resolved.

**Date:** 2026-06-01
**Origin:** SSOT #102 DECISION-NEEDED-2 from [`2026-06-01-capability-census.md §3 F2`](2026-06-01-capability-census.md) (`capability-census.md:108`). Companion to census F2 row; this patch is the dedicated R-phase that census §3 deferred.

---

## §0 Recommendation (lead per `phase-research-coverage §1.12`)

**Recommendation: REST remains the agnostic default dispatch path; `/fire` is a viable CC-native operator opt-in for unattended/cloud dispatch — but its I-phase wiring is blocked on one DECISION-NEEDED (status read-back gap, §3 below).** The design (§2) is sound; spike is skipped because the status-read-back parity mismatch is a blocking design question that an I-phase must resolve before writing code, not a cost-model block.

Cost model (§1) is **VERIFIED subscription-bundled** with an optional org-gated metered overage — the base behavior is draw-from-plan, identical to interactive sessions. This clears the `no-paid-llm-in-ci §1` gate for operator-manual use; committed automation (CI) still requires explicit opt-in to overage credits, which is operator-controlled.

---

## §1 STEP 1 — `/fire` contract + cost model

### §1.1 Dual-channel sources

**Channel 1 — `code.claude.com/docs/en/routines` (WebFetch, live 2026-06-01):**

Direct fetch of the routines documentation page. Returns 200. Key verbatim quotes used throughout this section.

**Channel 2 — `mcp__deepwiki__ask_question` on `anthropics/claude-code` (2026-06-01):**

DeepWiki reports: "there is no explicit mention or definition of a 'Routines /fire HTTP endpoint'" in the codebase context — it finds only internal "fire" usage in a security-guidance plugin. This is **expected and informative**: `/fire` is a cloud-UI / API-surface feature, not implemented in the open-source `claude-code` CLI repo. The DeepWiki negative confirms the endpoint is not CLI-resident; the docs (Channel 1) are the authoritative source. Two structurally-different sources used per kickoff §2 contract.

**Pricing pages checked (per kickoff INCONCLUSIVE path mandate):** `anthropic.com/pricing` (→ redirected → `claude.com/pricing`) and `anthropic.com/claude/pricing` (404). **Neither page mentions Routines, `/fire`, or routine billing** — no additional billing detail found there.

### §1.2 Cost model — VERIFIED (subscription-bundled, with org-gated metered overage)

From the routines doc (Channel 1), verbatim:

> "Routines draw down subscription usage the same way interactive sessions do."

> "organizations with usage credits turned on can keep running routines on metered overage. Without usage credits, additional runs are rejected until the window resets."

> "One-off runs do not count against the daily routine cap. They consume your plan's regular subscription usage like any other session."

**Analysis:**
- **Base model = subscription-bundled.** Each routine run draws from the operator's Pro/Max/Team/Enterprise plan subscription, same as interactive sessions. This is the default.
- **Metered overage = org-gated opt-in.** Organizations can enable "usage credits" to allow runs beyond the daily cap at metered cost. This is not the default; it requires explicit operator action ("Turn on usage credits from Settings > Billing").
- **Daily cap exists** (research preview): "each account" has a daily routine run allowance; cap visible at `claude.ai/code/routines` or `claude.ai/settings/usage`.
- **No-paid-llm-in-ci §1 implication:** base subscription-bundled behavior is NOT a "paid-API call" in the ANTHROPIC_API_KEY sense — it is operator's existing plan. The `no-paid-llm-in-ci §2` scope definition: "any binary or script invoked from CI that calls Anthropic API / OpenAI API / Claude SDK / ANTHROPIC_API_KEY / OPENAI_API_KEY" — `/fire` uses a routine-scoped bearer token (`sk-ant-oat01-...`), not an ANTHROPIC_API_KEY. However, the spirit of the rule is: no unexpected cost to operators running CI. Given the daily cap + optional metered overage, committed automation (CI) using `/fire` could silently consume the daily cap or trigger overage charges if usage credits are on. **For operator-manual dispatch (a human fires it): subscription-bundled, clean.** For committed CI automation: DECISION-NEEDED on cap/overage governance (§4).

**VERDICT: Cost-model VERIFIED subscription-bundled** (base). The STEP-3 spike gate is cleared. However, the **status-read-back parity gap** (§1.4) is a stronger blocker than cost — spike is skipped on that basis (§3).

### §1.3 Contract — verbatim from Channel 1

**Full URL pattern:**
```text
POST https://api.anthropic.com/v1/claude_code/routines/<routine-trigger-id>/fire
```

**Auth:** routine-scoped bearer token in `Authorization: Bearer <token>` header. Token is generated per-routine in the UI (claude.ai/code/routines → Add API trigger → Generate token). Token is shown once; scoped to that routine only.

**Required headers (verbatim curl from doc):**
```bash
curl -X POST https://api.anthropic.com/v1/claude_code/routines/trig_01ABCDEFGHJKLMNOPQRSTUVW/fire \
  -H "Authorization: Bearer sk-ant-oat01-xxxxx" \
  -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"text": "optional freeform context passed to the routine alongside its prompt"}'
```

**Beta header required:** `anthropic-beta: experimental-cc-routine-2026-04-01`. Doc verbatim: "The `/fire` endpoint ships under the `experimental-cc-routine-2026-04-01` beta header. Request and response shapes, rate limits, and token semantics may change while the feature is in research preview. Breaking changes ship behind new dated beta header versions, and the two most recent previous header versions continue to work so that callers have time to migrate."

**Request body:** optional `text` field (freeform string; JSON/structured payload received as literal string, not parsed).

**Success response (200):**
```json
{
  "type": "routine_fire",
  "claude_code_session_id": "session_01HJKLMNOPQRSTUVWXYZ",
  "claude_code_session_url": "https://claude.ai/code/session_01HJKLMNOPQRSTUVWXYZ"
}
```

**Cloud execution confirmed:** doc verbatim: "Routines execute on Anthropic-managed cloud infrastructure, so they keep working when your laptop is closed." This is the core value-add vs localhost REST — the session outlives the caller's machine.

### §1.4 Status read-back parity — MISMATCH (blocking design question)

This is the T2/T16 check: does `/fire`'s status-model match our `cli/await.ts` interface?

**Our `cli/await.ts` interface** (read directly, `packages/runtime-bridge/src/cli/await.ts:105-148`):
- Calls `backend.getStatus(handle)` → returns `{ status: string }` (point-in-time)
- Calls `backend.awaitDone(handle, timeoutMs)` → polls/streams until terminal state, returns `TaskResult`
- Terminal states: `done`/`verified` (success exit 0), `blocked_external` (exit 1), `error` (exit 1)
- Uses `backend.name` to identify which backend (e.g. `'aif-handoff'`)

**What `/fire` returns:** a `claude_code_session_id` and a `claude_code_session_url`. The doc says: "Open the session URL in a browser to watch the run in real time, review changes, or continue the conversation." — **no programmatic status polling API is documented**.

**The gap:** `/fire` is fire-and-forget with a human-readable URL. The routines doc describes run management via the web UI (claude.ai/code/routines → view runs → click to open session) but documents NO REST endpoint for polling `claude_code_session_id` to get a machine-readable terminal status. The "green status in the run list means the session started and exited without an infrastructure error" note is UI-only.

**T16 problem-class match assessment:**
- `/fire` problem class: fire a cloud session + watch it via browser
- Our problem class (via `cli/await.ts`): fire a task + programmatically poll terminal state + surface to an orchestrator

These are **partially matched** — the fire half matches; the read-back half **does not** (browser URL vs programmatic `getStatus`/`awaitDone`). A `/fire`-backed `AifFireBackend` could implement `dispatch()` but would need a workaround for `getStatus()` / `awaitDone()` — either a manual poll of the session URL (scraping, fragile) or accepting fire-and-forget-only (no status read-back to orchestrator).

**DECISION-NEEDED-1 (status read-back):** see §4.

---

## §2 STEP 2 — Dual-channel dispatch selector design

### §2.1 Architecture: REST = agnostic default; `/fire` = CC-native operator opt-in

Per `dual-implementation-discipline §3` (consumer-facing default = dual: CC-native primary + portable fallback):

```text
┌─────────────────────────────────────────────────────────────────┐
│  runtime-bridge dispatch()                                       │
│                                                                  │
│  selector (capability-check, not brand-name):                    │
│    if CC_ROUTINE_ID env var is set                               │
│      AND CC_ROUTINE_TOKEN env var is set                         │
│    → use AifFireBackend (/fire)         [CC-native, operator]    │
│    else                                                          │
│    → use AifHandoffBackend (REST)       [agnostic, default]      │
└─────────────────────────────────────────────────────────────────┘
```

**Capability check rationale** (per `dual-implementation-discipline §4`):
- `CC_ROUTINE_ID` presence means "a routine has been provisioned for this" — without a routine ID, `/fire` structurally cannot work. Its absence is the cleanest capability signal.
- `CC_ROUTINE_TOKEN` presence means "the bearer token is available for this session". Both required.
- **NOT** `ANTHROPIC_API_KEY` presence — that would be `#brand-name-detection` since `ANTHROPIC_API_KEY` is present in many non-CC contexts and its presence doesn't imply a routine exists.
- **NOT** a brand string like `"claude"` or `AI_HARNESS == "claude"`.

**Default = REST (agnostic).** If either env var is absent, REST is used. A consumer without a claude.ai subscription sets neither env var and gets REST with zero degradation. `/fire` is never a hard dependency.

### §2.2 Decision rule (prose)

```text
dispatch(task):
  if CC_ROUTINE_ID and CC_ROUTINE_TOKEN are both set:
    POST /fire with {text: task.prompt + context}
    → returns session_id + session_url
    → AifFireBackend.dispatch() stores session_id as the handle
    → AifFireBackend.getStatus() / awaitDone() — see §1.4 gap
  else:
    REST POST to aif-handoff /tasks
    → AifHandoffBackend.dispatch() as today (#313)
```

**Shipped-axis (§3 consumer):** a consumer without claude.ai sub never sets `CC_ROUTINE_ID`. REST path is taken. Full graceful degradation. `/fire` is never in `install.sh` as a required dependency.

**Operator-axis:** maintainer sets `CC_ROUTINE_ID` + `CC_ROUTINE_TOKEN` in their shell/environment. The same orchestrator session then auto-upgrades to `/fire` when present — cloud dispatch, laptop-closed capable, no code change needed.

### §2.3 `@dual-pair` anchor (per `dual-implementation-discipline §5`)

The eventual I-phase will create two backend files:

```text
packages/runtime-bridge/src/backends/aif-handoff.ts   # @dual-pair: dispatch-backend-aif
packages/runtime-bridge/src/backends/aif-fire.ts      # @dual-pair: dispatch-backend-aif
```

The selector in `resolver.ts` (or `dispatch.ts`) carries `// @dual-pair: dispatch-backend-aif` too. SSOT anchor: `prior-art-evaluations.md#102`. Both backends reference the same dispatch SSOT entry so drift between them is detectable via `dual-implementation-discipline §5` grep.

**Note for I-phase authors:** `cli/await.ts:38` carries `@cc-only-rationale: pure TS, callable from the maintainer's bash smoke-test script and from an orchestrator session alike — no CC-only primitive used`. The await entrypoint is channel-agnostic; the backend selector is the seam. The `@dual-pair` anchor goes on the backend files, not on `cli/await.ts`.

### §2.4 SSOT #102 stale-framing observation (do not drive-by edit)

SSOT #102 in `prior-art-evaluations.md` (merged, census §3 F2 `capability-census.md:110`) states the rationale as "vs broken dispatch" — framing the `/fire` adoption motivation as a fix for a broken REST. **This framing is stale per #313** (PR merged, E2E-verified live, memory `project_runtime_bridge_mcp_dispatch_fix`): REST dispatch works; `/fire` is the CC-native *alternative for cloud/unattended dispatch*, not a repair.

Corrected framing: REST = working agnostic default (dispatch anywhere, no sub required); `/fire` = CC-native operator opt-in that adds cloud/unattended capability REST structurally cannot provide.

The SSOT row (#102) should not be edited drive-by (per CLAUDE.md PR strategy — surface as observation, await explicit invite). The I-phase PR that wires the `/fire` backend is the natural place to update #102's rationale in a targeted SSOT-row amendment commit.

---

## §3 STEP 3 — Spike

**Skipped.** Not because cost is INCONCLUSIVE (cost is VERIFIED subscription-bundled, §1.2), but because the **status read-back parity gap** (§1.4) is a blocking design question:

An `AifFireBackend` can implement `dispatch()` (POST `/fire` → store `claude_code_session_id`), but `getStatus()` / `awaitDone()` have no documented programmatic equivalent. Before writing spike code it is necessary to resolve whether the I-phase will (a) accept fire-and-forget (operator watches the `claude_code_session_url` manually), (b) discover/use an undocumented session-status endpoint, or (c) poll a CC-native hook instead. Writing placeholder code around this unresolved gap produces misleading SPEC-ONLY output.

A SPEC-ONLY spike with a placeholder that explicitly marks the `getStatus` gap would look like:

```typescript
// SPIKE ONLY — /fire is the CC-native operator opt-in; REST is the agnostic default.
// Do NOT remove or replace dispatch() with this.
// STATUS READ-BACK: UNRESOLVED — /fire returns session_id; no REST poll endpoint documented.
// I-phase must resolve DECISION-NEEDED-1 (§4) before this becomes real code.

async function fireDispatch(routineId: string, token: string, text: string) {
  const res = await fetch(
    `https://api.anthropic.com/v1/claude_code/routines/${routineId}/fire`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }
  );
  // Expected 200: { type: "routine_fire", claude_code_session_id: "session_...", claude_code_session_url: "https://..." }
  // Error: 401 (bad token), 404 (routine not found), 429 (daily cap), 4xx (beta header missing/wrong)
  const data = await res.json();
  return data; // { claude_code_session_id, claude_code_session_url }
  // getStatus(sessionId): ??? — no documented REST poll; DECISION-NEEDED-1
}
```

This is included here for reference only, NOT committed as a file (throwaway, no capability commit).

---

## §4 DECISION-NEEDED (reviewer-discipline §2 — not decided here)

### DECISION-NEEDED-1: Status read-back strategy for `/fire` backend

The `/fire` endpoint returns a `claude_code_session_url` for human viewing but no documented programmatic polling endpoint. Our `cli/await.ts` interface requires `backend.getStatus()` + `backend.awaitDone()` (see `packages/runtime-bridge/src/cli/await.ts:123-139`).

**Option A — Fire-and-forget only.** `AifFireBackend.dispatch()` returns immediately; `getStatus()` always returns `{ status: 'running' }` or `{ status: 'unknown' }`; `awaitDone()` throws `NotSupported`. Operator watches `claude_code_session_url` manually. Simpler but breaks orchestrator status-loop.

**Option B — Discover a status endpoint.** Investigate whether the CC API (or the platform docs at `platform.claude.com/docs/en/api/claude-code/routines-fire`) exposes a session-status endpoint for `claude_code_session_id`. The doc references "For the full API reference, including all error responses, validation rules, and field limits, see Trigger a routine via API in the Claude Platform documentation" — worth fetching before deciding.

**Option C — Hook-based completion signal.** Use CC's `Stop` or `SessionEnd` hook (already in the hook catalogue from `capability-census.md:86`) to write a completion file when the cloud session ends; `awaitDone()` polls the file. Cloud-session hooks may not write to the caller's local filesystem — needs verification.

**Consequence of A:** operator-manual-only; orchestrator cannot close the status loop; no change to `cli/await.ts` semantics.
**Consequence of B:** if a status endpoint exists, full parity with REST is achievable; `/fire` backend feature-complete.
**Consequence of C:** depends on whether cloud session hooks fire locally — likely not (cloud infra); probably infeasible without investigation.

Before the I-phase begins, **check `platform.claude.com/docs/en/api/claude-code/routines-fire`** (the full API reference linked in the routines doc) for a status endpoint. This is a one-fetch verification the I-phase author should run first.

### DECISION-NEEDED-2: Committed automation daily-cap governance

If `/fire` is ever wired into committed CI automation (not operator-manual dispatch), the daily cap + optional metered overage create a cost surface. Routine runs count against the account's daily allowance; overage requires "usage credits" opt-in (Settings > Billing). An orchestrator that fires many sub-tasks per push could exhaust the cap.

**This is not a blocker for operator-manual dispatch** — manual fire is subscription-bundled and the operator consciously fires each run. It is only a question if we later consider auto-wiring `/fire` into a CI step.

---

## §5 §1.7 self-reflexive check

### §1.7 Forward-check applied

This patch complies with:
- **no-paid-llm-in-ci §1/§2** (`no-paid-llm-in-ci.md:17`): base billing = subscription-draw, not `ANTHROPIC_API_KEY` metered; operator-manual use is clean; CI automation DECISION-NEEDED-2 deferred to maintainer decision, not auto-wired.
- **dual-implementation-discipline §3/§4** (`dual-implementation-discipline.md:1`): selector by capability presence (`CC_ROUTINE_ID` + `CC_ROUTINE_TOKEN`), never brand-name; REST stays agnostic default; `/fire` is presence-gated opt-in; shipped-axis degrades gracefully.
- **build-first-reuse-default §1.1** (own-stack-first, `build-first-reuse-default.md:35`): own-stack-first ran — REST dispatch (#313) is working; `/fire` adds the CC-native cloud-dispatch capability REST cannot provide structurally (cloud-side execution).
- **reviewer-discipline §2** (`reviewer-discipline.md:1`): both DECISION-NEEDEDs (status read-back, CI governance) surfaced with options + consequences, not unilaterally resolved.
- **T-F2-A** (anti-creep, kickoff §T-traps): REST explicitly remains default throughout; `/fire` is presence-gated alternative; §2.1 selector makes the priority order code-explicit.

### §1.7 Backward-check applied

This patch EXTENDS `capability-census.md` §3 F2 + SSOT #102 — neither is superseded or edited (SSOT #102 stale framing is an observation only, per §2.4). The eventual I-phase will use `@dual-pair: dispatch-backend-aif` anchors on `aif-handoff.ts` + `aif-fire.ts` (§2.3) — this R-phase names the anchor convention so the I-phase has it; the anchor itself is not yet wired (no shipped artefact exists). `cli/await.ts` is not modified (T5 — REST dispatch is working and untouched). No existing artefact retired; no `@dual-pair` annotation pre-exists for the dispatch backend pair, so there is no drift to flag retroactively (`dual-implementation-discipline §9` forward-going annotation convention).

---

## §6 T-trap audit

- **T20 (own-stack-first/inline-verdict-without-evidence):** cost model quoted from doc before verdict (`§1.2`); status-read-back gap found by reading actual `cli/await.ts:123-139` (T2 — not assumed from design prose).
- **T2 (designing ≠ verifying):** status-read-back parity checked against real file `await.ts` lines 123-139, found the `getStatus`/`awaitDone` interface; doc checked for polling endpoint; gap is a real finding, not a design assumption.
- **T3 (quoted doc lines):** cost model = three verbatim doc quotes; contract = verbatim curl + JSON; Channel 2 negative quoted verbatim.
- **T12 (verify NOW):** both channels fetched live 2026-06-01; pricing pages also fetched (both 404/silent on Routines).
- **T15 (self-application):** this patch keeps REST as the non-CC fallback throughout (`§2.1`), applying its own agnostic doctrine to itself.
- **T16 (problem-class match):** `/fire` problem class (fire cloud session + browser view) vs ours (dispatch + programmatic status read-back) — **partial match**, gap stated explicitly (`§1.4`).
- **T-F2-A (alternative-becomes-default creep):** REST stays default in §2.1 selector; `/fire` is only taken when both env vars present.
- **reviewer-discipline §2:** two DECISION-NEEDEDs surfaced with options, not resolved.

---

## Tags

`#f2-runtime-bridge-fire` `#cc-routines` `#dual-channel-dispatch` `#status-read-back-gap` `#subscription-bundled` `#cost-model-verified` `#ssot-102-stale-framing`
