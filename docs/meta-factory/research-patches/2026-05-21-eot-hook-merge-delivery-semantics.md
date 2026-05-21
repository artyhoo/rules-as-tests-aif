<!-- scope:eot-hook-merge-delivery-semantics -->
# Research-patch — end-of-turn hook MERGE: Stop-hook delivery semantics (`reason` vs `systemMessage`) + best-of-both of three diverged versions

> **Authoritative for:** the load-bearing finding that on a **Stop** hook `decision:"block"`, the `reason` field reaches the model (injected; agent gets one more turn) while `systemMessage` is user-only — and the resulting merge of three diverged `.claude/hooks/end-of-turn-reminder.sh` versions (#81 `cfa28a3`, `d695ac5`, redesign `cf650d4`). Records the three fork resolutions (supersede #81 / restore visible header marker / 3-branch) confirmed by the maintainer 2026-05-21.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The content/purpose/audience **redesign** design (session-anchor / dual-audience / R1–R8) — see [2026-05-21-end-of-turn-hook-redesign.md](2026-05-21-end-of-turn-hook-redesign.md) (the design-history record this patch builds on).
> **Status:** finding verified + merged hook implemented and tested. Drafted 2026-05-21.

---

## §1 — Problem

The hook diverged into three versions ([[orchestrator-branch-state-drift]]):

| Version | Where | Branches | Delivery | Visible header |
|---|---|---|---|---|
| #81 `cfa28a3` | `origin/main` (merged PR #81) | 3 (report / question / both) | recap text in **`systemMessage`**; `reason` static | forces «## 🟢 Простыми словами» |
| `d695ac5` | working branch (live hook) | 2 (long wins over asked) | recap text in **`reason`**; `systemMessage` static | none |
| redesign `cf650d4` | `feat/eot-hook-anchor` + chore | = `d695ac5` 2-branch | = `d695ac5` (`reason`) | none; adds session-anchor + drift-verdict + recommendation-first |

#81 and `d695ac5` made **opposite assumptions** about which Stop-hook field reaches the model. One is wrong. This had to be settled by evidence, not reasoning ([ai-laziness-traps.md §2 T3](../../../.claude/rules/ai-laziness-traps.md)).

## §2 — The load-bearing finding (Stop-hook `reason` reaches the model)

Verified **dual-channel** 2026-05-21 (the [[no-paid-llm-in-ci]]-compatible path: docs + WebSearch, no API):

- **`reason` on Stop + `decision:"block"` → reaches the model.** Claude Code hooks reference (Stop decision-control): «`decision:"block"` prevents Claude from stopping, and the **reason field must be provided for Claude to know how to proceed**» — «the agent doesn't stop and instead **gets one more turn with the `reason` injected**.» Corroborated by multiple independent WebSearch sources.
- **`systemMessage` → user-UI only, does NOT reach the model.** Universal-field table: «Warning message shown to the user»; Agent SDK note: «shows a message to the user, not the model.»

**Consequences:**
- **#81 `cfa28a3` is functionally broken** for its stated purpose: it delivers the entire recap *instruction* via `systemMessage` (user-only), so the model **never receives** the prompt to write the «## 🟢 Простыми словами» block. Its `reason` is a static placeholder. #81 → **supersede** (it is a bug, not a design alternative).
- **`d695ac5`/redesign are correct**: recap in `reason`. `d695ac5`'s in-code comment («systemMessage НЕ доходит до модели») is verified-accurate. (`d695ac5` was written ~1.5 h after #81 — it is the fix for #81's delivery bug.)
- **Both fields usable together, each to its own destination:** `reason` (model instruction) + `systemMessage` (short human-visible note). The merged hook keeps `systemMessage: "End-of-turn recap requested"` as the human marker.

### §2.1 — Method note: type-system was SILENT here; prose dual-channel was the correct fallback (refines [phase-research-coverage.md §1.10](../../../.claude/rules/phase-research-coverage.md))

§1.10 says «for SDK-shaped claims, type-system wins over prose». Here the TypeScript SDK type (`SyncHookJSONOutput.reason?: string`) carries **no JSDoc** describing routing — the type system does **not** disambiguate where `reason` goes. §1.10 step 4 applies: «only prose available → dual-channel prose verification». Done (docs + WebSearch).

### §2.2 — A second-channel catch worth recording (T16 / [[reviewer-webfetch-second-pass-value]])

The first channel (a `claude-code-guide` sub-agent) concluded `reason` is «user-only, not added to context» — by reading the **`UserPromptSubmit`** row («Not added to context») and **generalizing it to the Stop event**. That is the [ai-laziness-traps.md §2 T16](../../../.claude/rules/ai-laziness-traps.md) «pattern-matching field semantics across hook events» trap. The independent WebSearch second channel surfaced the Stop-specific line («reason must be provided for Claude to know how to proceed») and corrected it. **Lesson:** Stop and UserPromptSubmit have *genuinely different* `reason` semantics; never carry one event's field behaviour to another without the event-specific doc line.

## §3 — Fork resolutions (maintainer-confirmed 2026-05-21, each led with reasoned recommendation per [[feedback-reasoned-recommendation-default]])

- **Supersede #81** — YES. Merged hook (reason-delivery) lands on `main` via clean PR off `origin/main`, no drive-by `c470873` (Karpathy SSOT #49 — unrelated). Reviewer-discipline §2: surfaced, maintainer confirmed.
- **Restore visible header marker** — YES. reason-delivery already renders the recap (the model writes it as its next turn), but the redesign dropped #81's recognizable «## 🟢 Простыми словами» header. Re-added so the human spots the block at a glance (dual-audience). Best-of-both: #81's scannable header + redesign's correct delivery + anchor.
- **3 branches (incl. combined)** — YES. On «long answer AND trailing fork-question» turns, the 2-branch (long-wins) version drops the recommendation-first/fork-challenge exactly when a fork is on the table. Branch C carries **both** the work recap (+ drift verdict) AND recommendation-first/fork-challenge.

Kept from redesign (approved D1–D3): session-goal anchor (aiTitle primary / first-user-msg fallback), 3-way drift verdict, recommendation-first Branch B, statelessness (R7 — no `/tmp`, no aggregation), bullets over numbered (stronger concreteness-forcing, anti-theatre).

## §4 — Merged hook spec (implemented + tested)

[.claude/hooks/end-of-turn-reminder.sh](../../../.claude/hooks/end-of-turn-reminder.sh): redesign base + 3 branches + forced header marker + reason-delivery. **Not a capability commit** (modifies existing <50-LOC-logic CC hook; no new dep; not under `packages/`) per [CLAUDE.md](../../../CLAUDE.md); `@cc-only-rationale` retained per [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md). No new SSOT entry (existing #8 AIF Step 0 / #9 Cline Memory Bank / #20 CC hooks cover the family).

Tested 2026-05-21 against synthetic JSONL fixtures: `bash -n` clean; Branch A (long→work recap, no question section); Branch B (question→fork-challenge + recommendation-first); Branch C (long+question→both); silent on bare tool_use; AskUserQuestion→Branch B; anchor aiTitle-primary + first-user-msg fallback + graceful default; §1.8 skip smoke-test exit 0 no stderr.

## §5 — Self-application (T15)

This patch's own thesis — «one Stop-hook field reaches the model, the other doesn't; verify, don't assume» — was itself first answered wrong by an authoritative-sounding sub-agent (§2.2) and corrected only by running the second channel. The patch obeys what it preaches: the merged hook delivers via the field the evidence (not the first plausible answer) identified.

## §6 — Note for chore-branch merge

`chore/ssot-karpathy-skills-ref` (`cf650d4`) carries the older 2-branch redesign hook. When that branch later merges to `main`, its hook change will conflict with this merged hook — surfaced here so the conflict resolves toward this (newer, 3-branch) version, not silently reverts it.

## §7 — Tags
`#end-of-turn-hook` `#stop-hook-delivery-semantics` `#reason-vs-systemmessage` `#branch-state-drift` `#second-channel-catch` `#pattern-matching-on-name` `#sdk-shaped-claim` `#dual-audience-recap`
