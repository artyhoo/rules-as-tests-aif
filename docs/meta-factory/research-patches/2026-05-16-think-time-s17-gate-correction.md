<!-- scope:think-time-s17-gate-correction -->
# Research-patch — §1.7 think-time gate, Stop hook claim correction (errata)

> **Authoritative for:** errata note for parent research-patch `2026-05-16-§17-think-time-gate.md` §5.1 (H2 mechanism evaluation) — corrects the Stop hook temporal characterization based on dual-channel cross-verification + TypeScript SDK type evidence. Affects only the H2 rationale; architectural conclusion (H10 over H2 bundle recommendation) unchanged.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). NOT authoritative for the original parent patch §1-§4, §6-§8 — those remain unchanged.

> **Date:** 2026-05-16
> **Predecessor:** [2026-05-16-§17-think-time-gate.md](2026-05-16-§17-think-time-gate.md) (parent) + [2026-05-16-claude-code-guide-cross-verification.md](2026-05-16-claude-code-guide-cross-verification.md) (cross-verification §12 addendum that surfaced this correction)
> **Trigger:** Queue Mode Execution B+C session (2026-05-16) ran dual-channel verification on parent's claims; orchestrator post-GO third-channel check via `claude-code-guide` subagent (with TypeScript SDK access) produced definitive resolution on three FLAG'd claims.

---

## §1 What the parent patch said

[`2026-05-16-§17-think-time-gate.md`](2026-05-16-§17-think-time-gate.md) §5.1 evaluating mechanism H2 «Stop hook for verdict gate» argued, in substance:

- Stop hook fires once at session end (i.e., when the user ends the dialogue)
- Therefore Stop cannot intercept per-turn assistant verdicts
- Therefore H2 is structurally inadequate for the per-turn think-time-gate problem
- This was used to argue H10 (verdict-as-tool-call MCP) over H2

The architectural conclusion (H10 over H2) survived intact through review iter 1. The HARD-FIX in iter 1 was about §5.2 Elicitation hook (separate issue). The Stop hook claim in §5.1 was not flagged in iter 1.

## §2 What is actually true (definitive)

Per Claude Code official documentation and TypeScript SDK type definitions:

- **Stop hook fires per assistant turn**, not once at session end. Payload is `StopHookInput` containing fields like `last_assistant_message?: string`.
- **SessionEnd is a separate event** that fires once when the session terminates.
- These are distinct hook events in the lifecycle table.

Evidence sources (all 2026-05-16):

| Source | Citation |
|---|---|
| Claude Code official docs — hooks lifecycle table | `code.claude.com/docs/en/hooks.md` (per Queue Mode B+C orchestrator's claude-code-guide subagent fetch) |
| TypeScript SDK type definitions | `agent-sdk/typescript.md` — `StopHookInput` interface includes `last_assistant_message?: string` (optional) |
| TypeScript SDK type definitions | `agent-sdk/typescript.md` + `agent-sdk/hooks.md` — `SubagentStopHookInput` includes required `agent_transcript_path: string` used in 2 code samples |

## §3 Impact on parent patch

**§5.1 H2 evaluation — incorrect premise, conclusion to be re-examined.** If Stop fires per turn, H2's temporal-coverage argument changes: H2 *can* intercept per-turn verdicts; the question becomes whether the Stop hook's hook-execution semantics fit the «think-time gate» problem (timing relative to message emission, ability to block/rewrite, etc.) — that's a different analysis than the «fires too late» argument the parent made.

**Architectural conclusion (H10 over H2 bundle) — survives, but reasoning shifts.** H10 (verdict-as-tool-call MCP) still has independent merits: explicit verdict capture, structured tool-result contract, MCP-native delivery semantics. The original argument «H2 fires too late, so we need H10» is wrong; the replacement argument is «H10 provides structured-tool semantics that Stop hook's stream-edit model does not». The maintainer should decide whether to:

- (a) accept H10 over H2 on the revised rationale (and treat parent §5.1 as superseded by this errata)
- (b) re-open the H2 vs H10 comparison given Stop *can* fire per turn — Stop hook becomes a viable candidate
- (c) treat both as viable, ship H10 first, retain H2 as deferred alternative

This is **D6** from the cross-verification patch §12 — listed as open decision for maintainer.

## §4 Methodological note (cross-cuts §1 search-coverage rule)

Three-channel verification of B+C session caught what dual-channel did not:

1. **Worker (WebFetch on docs)** — flagged the parent claim correctly
2. **Reviewer (independent WebFetch on docs)** — converged with parent on misreading; two channels still one perspective on one prose surface
3. **Orchestrator + claude-code-guide subagent (with TypeScript SDK access)** — definitive resolution via type-system evidence

**Type-system evidence (interface fields, required vs optional) is more reliable than prose evidence (lifecycle tables, narrative descriptions) when the two diverge.** Prose can be stale or imprecise; types must compile. For SDK-shaped questions about Claude Code internals, prefer the SDK type definitions as primary source; treat prose docs as cross-reference.

This is a candidate 7th item for [`.claude/rules/phase-research-coverage.md` §1 coverage methodology checklist](../../.claude/rules/phase-research-coverage.md): «for SDK-shaped questions, prefer type-system evidence over prose when they diverge». Surfacing as observation; maintainer decides whether to promote.

## §5 Recommendation

**No edit to parent patch `2026-05-16-§17-think-time-gate.md` itself** — parent session owns that file per Artifact Ownership Contract (research-patches owner = «session that discovered the gap»). This errata documents the correction in a separate patch, preserving audit trail of the original claim + the correction + the evidence chain.

Maintainer decision on D6 (per §3 above) determines whether further action is needed — revision-patch, re-analysis of H2 vs H10, or accept-as-is with this errata as the canonical correction note.

## §6 §1.7 self-review — Skipped (errata patch)

This patch introduces no new rule, principle, or discipline-bearing change. It is a factual correction note for an existing patch, with a single recommendation surfaced as observation (no action taken). Per [`.claude/rules/phase-research-coverage.md` §1.7](../../.claude/rules/phase-research-coverage.md): §1.7 forward+backward checks protect rule-introduction drift; corrections without rule introduction are out of §1.7 scope.

## §7 See also

- [`2026-05-16-§17-think-time-gate.md`](2026-05-16-§17-think-time-gate.md) — parent patch; §5.1 H2 evaluation is the subject of this errata
- [`2026-05-16-claude-code-guide-cross-verification.md`](2026-05-16-claude-code-guide-cross-verification.md) §12 addendum — three-channel verification that surfaced this correction
- [`.claude/rules/phase-research-coverage.md` §1](../../.claude/rules/phase-research-coverage.md) — candidate location for the «type-system over prose» 7th methodology item (maintainer decides)
- [`~/.claude/skills/orchestrator/references/queue-mode.md` §10-§11](../../../../.claude/skills/orchestrator/references/queue-mode.md) — already-revised dual-channel discipline that this finding empirically validates (and pushes toward three-channel for SDK-shaped questions)
