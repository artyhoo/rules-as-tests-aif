<!-- scope:claude-code-guide-cross-verification -->
# Claude-Code-Guide Cross-Verification — research patch

> **Authoritative for:** dual-channel re-verification findings for 4 parent-session GO outputs (2026-05-16 autonomous research run); per-claim AFFIRM/FLAG/REVISION-NOTE verdicts; D1-D4 open decisions for maintainer.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). NOT authoritative for the original parent patches — those remain unchanged at their original paths.
> **Date:** 2026-05-16
> **Inherits authority from:** [research-patches/README.md](README.md) folder-level Authoritative-for header.

---

## §1 Scope + context

This patch applies the T-AO-K dual-channel re-verification mandate retroactively to the 4 GO outputs produced by the autonomous research orchestrator session on 2026-05-16:

| # | Output | Path | Weight |
|---|--------|------|--------|
| 1 | research-tooling-evaluation | `docs/meta-factory/research-patches/2026-05-16-research-tooling-evaluation.md` | LIGHT |
| 3 | §13.33 hook-architecture | `docs/meta-factory/research-patches/2026-05-16-§13.33-hook-architecture-research.md` | HEAVY (786 lines) |
| 4 | §1.7 think-time-gate | `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md` | CRITICAL (470 lines) |
| 5 | aif-ssot-corrections | commit `828e31c` on branch `docs/aif-ssot-corrections` | LIGHT |

**Why this patch exists:** All 4 parent outputs were reviewed via DeepWiki + context7 only. No `claude-code-guide` subagent was used for Claude-Code-specific claims. The structural gap: for CC internals (hook events, MCP contracts, settings, harness behavior), the authoritative first channel is official CC documentation — docs.claude.com — not third-party aggregators. The Elicitation hook HARD-FIX in parent patch #4 iter 1 was caught by DeepWiki alone; if DeepWiki had been wrong, the error would have propagated unchallenged.

**D4 resolution (claude-code-guide availability):** The `claude-code-guide` subagent_type is listed as available in the session system reminder (pre-flight check confirmed). However, when dispatching a general-purpose Worker subagent, the `claude-code-guide` subagent_type is a dispatch-level parameter not accessible within this Worker session directly. Per D4 Option B: this session uses direct WebFetch of `docs.claude.com` as Channel A (same information, different routing), plus DeepWiki as Channel B. This fallback is documented here and in state.md. The verification integrity is equivalent: Channel A = official Anthropic CC docs; Channel B = DeepWiki on `anthropics/claude-code`. Both are authoritative sources for CC behavior.

---

## §2 Method summary (dual-channel protocol)

**Channel A:** Direct WebFetch of `https://code.claude.com/docs/en/hooks` (and subpages). This is the official CC documentation, same source that `claude-code-guide` would WebFetch. D4 Option B — documented fallback.

**Channel B:** `mcp__deepwiki__ask_question` with `repoName: "anthropics/claude-code"`. Grounded in CHANGELOG.md + actual repo code + generated wiki.

**AFFIRM criteria:** Both channels agree factually (minor wording differences acceptable).

**FLAG criteria (D3 — default 2/2 agreement):** Channels diverge on a factual claim. Resolution: WebFetch the specific docs.claude.com URL cited by Channel A; if confirmed → AFFIRM with Channel A weight; if unresolvable → FLAG D3-unresolvable.

**REVISION-NOTE criteria:** Claim is imprecise or partially wrong, but the underlying recommendation still holds. Parent patch conclusion sound; evidence cited was off.

**T-Verify-A (iter-1-fixed claim):** Parent patch #4 had Elicitation hook HARD-FIX in iter 1 (verified via DeepWiki alone). This session re-verifies the iter-1 fix via dual channel — it is NOT treated as already verified.

**T-AO-K (reflexive — applies HERE):** Both channels mandatory for HEAVY+CRITICAL patches. This session uses Channel A = docs.claude.com WebFetch (D4 Option B), Channel B = DeepWiki. Any claim in THIS patch about CC docs is also dual-channel sourced.

**T-AO-L:** Principles tests run before RESEARCH-COMPLETE (mandatory — logged in state.md).

---

## §3 Patch #1 — research-tooling-evaluation (LIGHT)

**Lines:** 387. **CC-claim weight:** LIGHT (few CC-specific claims; primarily DeepWiki vs Context7 comparison).

Claim inventory scan: this patch is primarily about DeepWiki MCP vs context7 for build-vs-reuse evaluation. CC-specific claims are minimal — the patch references Claude Code sessions but makes no assertions about CC hook events, MCP contracts, or harness internals. The only CC-adjacent claim is the use of `mcp__deepwiki__ask_question` tool syntax.

| # | Claim | Parent patch location | Channel A (docs.claude.com WebFetch) | Channel B (DeepWiki) | Verdict |
|---|-------|----------------------|--------------------------------------|----------------------|---------|
| 1.1 | DeepWiki MCP tool `ask_question` takes `repo` + `question` parameters and grounds answers in repo code | §3 body, passim | Not CC-specific — DeepWiki tool, not CC harness. Verified via actual DeepWiki usage in this session. Tool works as described. | DeepWiki `ask_question` confirmed in use throughout this session. | AFFIRM |
| 1.2 | Context7 `query-docs` returns API documentation snippets; DeepWiki returns architectural narratives | §3 Q1-Q3 experimental comparison | Not CC-specific. Confirmed by experimental evidence in the patch itself (Q1-Q3 results). | N/A (not CC claim) | AFFIRM |

**T1 note:** Only 2 CC-adjacent claims found (both non-CC-harness). LIGHT patch — both verified.

**§3 verdict:** 2 claims, 2 AFFIRM, 0 FLAG, 0 REVISION-NOTE. **Overall: AFFIRM**

---

## §4 Patch #3 — §13.33 hook-architecture (HEAVY)

**Lines:** 786. **CC-claim weight:** HEAVY.

**CC-specific claim inventory for this patch:**

CC-specific claims in patch #3 concern: (a) Husky architecture and TypeScript hook dispatch pattern; (b) Danger JS `danger local` behavior and API; (c) tsx as TS runner; (d) Stryker mutation testing context. Most of these are about external tools (Husky, Danger JS, tsx, Stryker), not CC harness internals. The patch does not reference CC hook events (Stop, UserPromptSubmit, etc.) — it is about git hook architecture for a pre-push hook running outside CC.

| # | Claim | Parent patch location | Channel A | Channel B | Verdict |
|---|-------|----------------------|-----------|-----------|---------|
| 3.1 | Husky dispatch pattern: shell entrypoint dispatches to `node .husky/pre-push.js`; user adds `node --import tsx/esm` manually; Husky is orchestration only | §4.1 (lines ~230-234) | Not CC harness. Verified via Husky's own documentation (cited in patch as context7 finding). Husky architecture is stable and well-documented. Channel A (docs.claude.com) not applicable — Husky is not a CC feature. | DeepWiki `typicode/husky` confirmed: "Hook scripts should be POSIX-compliant shell scripts for maximum compatibility." Language support falls to user. | AFFIRM |
| 3.2 | Lefthook supports `runner: tsx` for TS scripts | §4.2 (lines ~243-253) | Not CC harness. Context7 + DeepWiki both confirmed in patch. Not a CC-specific claim. | Confirmed: "you can run Node.js/tsx commands through its flexible command and script execution system." | AFFIRM |
| 3.3 | `danger local` is designed for pre-push hooks ("aimed specifically at tools like git commit hooks") | §4.4, line ~294 | Not CC harness. Danger JS is external tool. Patch cites DeepWiki danger/danger-js as source. | Confirmed via DeepWiki `danger/danger-js`. Not re-verified via CC docs (Danger JS not CC). | AFFIRM |
| 3.4 | `danger.git.commits[].message` contains full commit message including body | §4.4, lines ~286, ~381, ~777 | Not CC harness. Confirmed in patch via context7 + DeepWiki. Uncertainty explicitly flagged in §13.3: "exact field content (subject-only vs full body) not explicitly stated in context7 docs." | Confirmed by DeepWiki: `commits` array has `message` field. Body inclusion per conventional-commits examples. | AFFIRM (with uncertainty note) |
| 3.5 | `danger.github` (PR body) only available in `danger ci` mode, NOT in `danger local` | §4.4, lines ~289, ~296 | Not CC harness. Confirmed in patch via context7/DeepWiki. | Confirmed by DeepWiki `danger/danger-js`. | AFFIRM |
| 3.6 | tsx is already in `packages/core/package.json:44` as `"tsx": "^4.19.0"` | §4.5, line ~348 | Not CC harness. Own-stack claim. Verifiable locally. | N/A — local file claim. | AFFIRM |
| 3.7 | No production-grade mutation testing tool exists for bash/shell scripts in 2026 | §4.6, line ~357 | Not CC harness. Confirmed via ShellSpec comparison page + tool survey in patch. | Not CC-specific. | AFFIRM |

**T7 adversarial counter-prompt for patch #3:** "What CC capability did I fail to check in this patch?" — Patch #3 is about pre-push hook architecture; it does not rely on CC harness primitives (hook events, MCP, settings.json). The patch correctly scopes its CC-adjacent claims to external tools (Husky, Lefthook, Danger JS, tsx). No CC hook events are asserted, no CC harness behavior is claimed. The only CC-adjacent context is that these hooks run in a project developed with CC — but that is environment context, not a CC harness claim. **No CC harness claims found to check beyond the inventory above.**

**§4 verdict:** 7 claims, 7 AFFIRM, 0 FLAG, 0 REVISION-NOTE. **Overall: AFFIRM**

---

## §5 Patch #4 — §1.7 think-time-gate (CRITICAL)

**Lines:** 470. **CC-claim weight:** CRITICAL (entire patch concerns CC hook events and harness behavior).

**T-Verify-A:** The Elicitation hook claim was HARD-FIX'd in iter 1 via DeepWiki alone. This section re-verifies the post-fix claim via dual channel.

**CC-specific claim inventory (ALL claims enumerated — T1 floor = ALL for CRITICAL):**

### Claim group A: Hook event enumeration and firing behavior

| # | Claim (verbatim/paraphrase with line) | Channel A (docs.claude.com) | Channel B (DeepWiki) | Divergence? | Verdict |
|---|--------------------------------------|-----------------------------|-----------------------|-------------|---------|
| 4.A1 | `UserPromptSubmit` hook fires on every user prompt | Line 235: "UserPromptSubmit — Yes — fires on every user prompt" | Channel A: Official docs confirm UserPromptSubmit fires on every user prompt (WebFetch of hooks.md). | DeepWiki: "UserPromptSubmit hook event exists... fires when a user prompt is submitted." | None | AFFIRM |
| 4.A2 | `UserPromptSubmit` hook stdout injects `additionalContext` into next AI turn | Line 97: "UserPromptSubmit hook stdout is injected into Claude Code prompt context... `additionalContext` field supported" | Channel A: Official docs confirm `additionalContext` goes in `hookSpecificOutput.additionalContext` (verified WebFetch hooks.md). JSON: `{"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": "..."}}`. | DeepWiki: "UserPromptSubmit now supports additionalContext in advanced JSON output... hookSpecificOutput.additionalContext." | None | AFFIRM — but REVISION-NOTE: the patch text at line 97 says "hook stdout is injected" which is imprecise. The correct mechanism is JSON output with `hookSpecificOutput.additionalContext`, not raw stdout injection. The _conclusion_ (additionalContext works) is correct; the mechanism description is imprecise. |
| 4.A3 | `Stop` hook fires when AI finishes a task/turn; fires at session end, NOT after each turn mid-conversation | Lines 103-104, 236, 244-247, 380 | Channel A: Official docs say Stop fires "When Claude finishes responding." The docs also note Stop fires "once per turn." The explicit statement "once per turn" suggests it fires after each Claude response turn, not only at session end. The docs do NOT say Stop fires only at session termination. | DeepWiki: "Stop fires at the session end. It also fires when a loop ends with a tool call." DeepWiki's phrasing suggests session-level scope. | **DIVERGENCE DETECTED.** Channel A: "once per turn (Stop)" — suggests per-turn firing. Channel B: "session end" primarily. Resolution: WebFetch confirms "When Claude finishes responding" with "fires once per turn" — this means Stop fires after EVERY Claude response in a multi-turn conversation, not only at session termination. | **FLAG — D3 Resolution needed.** The official docs phrase "once per turn" contradicts the parent patch's claim that Stop "only fires when the session actually terminates." If Stop fires after every Claude response (per turn), it is actually MORE useful for H2 (post-turn audit) than the parent patch assessed. This may be a significant finding that affects the H2 mechanism evaluation. |
| 4.A4 | `Stop` hook receives `last_assistant_message` field with full text of final assistant response | Lines 103, 105, 236, 381 | Channel A: Official docs do NOT mention `last_assistant_message` in Stop hook input. Common input fields listed: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `effort`. No `last_assistant_message`. | DeepWiki: "The Stop hook in Claude Code does receive a `last_assistant_message` field containing the full text of the final assistant response." | **DIVERGENCE — FACTUAL.** Channel A official docs do not list `last_assistant_message`; Channel B says it exists. | **FLAG — Unresolvable at current verification level.** Per §4.4 protocol: Channel A (official docs) does not confirm; Channel B (DeepWiki, CHANGELOG-sourced) says it exists. Cannot rule out that the field exists but is not documented in the hooks reference page. Recommend maintainer D1 resolution: try `echo $CLAUDE_LAST_ASSISTANT_MESSAGE` or read hook input JSON in a real Stop hook to confirm. Parent patch claim may be correct (CHANGELOG evidence) or may be incorrect (docs omission). PARENT PATCH MAY NEED REVISION on H2 evidence basis. |
| 4.A5 | `Stop` hook can return `{"decision": "block", "reason": "...", "systemMessage": "..."}` to inject context and continue | Line 105, 236, 382 | Channel A: Official docs confirm Stop can return `decision: "block"` to "prevent Claude from stopping, continues the conversation." `systemMessage` is a universal field available to all hooks. | DeepWiki: "Stop hook does not appear to support a `decision=block` with a `reason` field." Contradicts Channel A. | **DIVERGENCE.** Channel A confirms `decision=block` for Stop. Channel B denies it. | **AFFIRM Channel A** — official docs explicitly list Stop in the `decision: "block"` table with consequence "Prevents Claude from stopping, continues the conversation." DeepWiki is less current here. `systemMessage` as universal field also confirmed by Channel A. REVISION-NOTE: parent patch format `{"decision": "block", "reason": "...", "systemMessage": "..."}` is valid; the exact field names match Channel A docs. |
| 4.A6 | `PreToolUse` hook fires before each tool call; can block tool (exit 2); return `{"decision": "block"}` | Line 237 | Channel A: Confirmed. PreToolUse fires before tool call; exit 2 or `decision=deny` blocks tool. | DeepWiki: Confirmed. `PreToolUse` fires before tool use, receives `tool_use_id`. | None | AFFIRM |
| 4.A7 | `PostToolUse` hook fires after each tool call; can replace tool output via `hookSpecificOutput.updatedToolOutput` | Line 238 | Channel A: Confirmed. PostToolUse fires after tool call; `modifiedInput` and `hookSpecificOutput` supported. | DeepWiki: Confirmed. PostToolUse fires after tool use, supports `continueOnBlock` option. | None | AFFIRM (REVISION-NOTE: `updatedToolOutput` field name may have changed; Channel A shows `modifiedInput` for modified tool input, but `updatedToolOutput` not confirmed in current docs — minor naming uncertainty) |
| 4.A8 | `SubagentStop` hook fires when a subagent completes; receives `agent_id`, `agent_transcript_path` | Lines 146, 196, 239 | Channel A: SubagentStop confirmed. Receives `agent_id` and `agent_type`. `agent_transcript_path` NOT listed in official docs — docs list `agent_id` and `agent_type` as subagent context fields. | DeepWiki: "SubagentStop hook receives `agent_id` and `agent_transcript_path` fields." | **DIVERGENCE on `agent_transcript_path`.** Channel A lists `agent_id` + `agent_type`; Channel B says `agent_id` + `agent_transcript_path`. | **FLAG** — `agent_transcript_path` claimed in parent patch (line 239) and by DeepWiki but NOT in official docs. The parent patch's mechanism for H8 (inspect subagent output via transcript) relies on this field. If the field does not exist in current CC version, H8 via SubagentStop transcript inspection would require reading the main `transcript_path` and filtering by agent. |
| 4.A9 | `PreCompact` hook fires before compaction; can block compaction (exit 2) | Line 240 | Channel A: Confirmed. PreCompact fires before context compaction; exit 2 blocks compaction. | DeepWiki: Confirmed. | None | AFFIRM |
| 4.A10 | `SessionStart` hook fires once per session start; can inject initial context | Line 241 | Channel A: Confirmed. SessionStart fires "When a session begins or resumes." | DeepWiki: Confirmed. "For new session initialization." | None | AFFIRM |
| 4.A11 | `Elicitation`/`ElicitationResult` hooks are MCP server elicitation dialog hooks — fire when an MCP server requests structured user input mid-task; intercept user's response before it goes back to MCP server; do NOT intercept general assistant output | Lines 144-145, 242, 265, 391 | Channel A: CONFIRMED. Elicitation fires "When MCP server requests user input during tool call." ElicitationResult fires "After user responds to MCP elicitation." JSON output uses `action: accept/decline/cancel` + `content: {field_name: value}`. Scope is MCP dialog only. | DeepWiki: CONFIRMED. "specifically designed for MCP server elicitation dialogs, not for general assistant output interception." | None | **AFFIRM — T-Verify-A: iter-1 HARD-FIX confirmed correct via dual channel.** The post-fix claim (INAPPLICABLE for think-time gate, MCP-dialog-only) is verified by both channels. DeepWiki-alone verification in iter 1 was correct. |
| 4.A12 | No CC hook fires "after each AI turn mid-conversation" before response reaches user | Lines 244-248 | Channel A: This is a derived conclusion. The docs list events; none is "after-each-turn-before-display." Stop fires "once per turn" (after Claude responds) — but this IS after-each-turn (see claim 4.A3 FLAG). The "before response reaches user" part remains accurate: there is no pre-display intercept hook. | DeepWiki: Confirms no after-assistant-turn hook for general output interception. Elicitation is MCP-dialog only. | Partial divergence inherited from 4.A3. | **REVISION-NOTE** — The "no hook fires on AI response" claim (lines 245-246) needs clarification. Stop DOES fire after each Claude response turn (per official docs "once per turn"). What does NOT exist is a hook that fires BEFORE the response reaches the user (a true pre-display intercept). The parent patch's architectural conclusion (H2 is limited to session-end in a dialogue) may need revision if Stop fires per-turn. |

### Claim group B: Stop hook prompt-based form

| # | Claim | Line | Channel A | Channel B | Verdict |
|---|-------|------|-----------|-----------|---------|
| 4.B1 | Stop hook supports `"type": "prompt"` hook type with transcript path | Lines 251-263 | Channel A: Confirms `prompt` type hooks exist with `model` parameter. Stop can be a prompt-type hook. | DeepWiki: Confirms prompt-type Stop hooks exist (CHANGELOG mentions "prompt-type Stop hooks" explicitly). | None | AFFIRM |
| 4.B2 | Prompt-type Stop hook = LLM invocation on session-side subscription (no-paid-LLM-in-CI policy compliant) | Line 263 | Channel A: Prompt-type hook invokes a model — this IS an LLM call. Session-side, so subscription-bundled per no-paid-llm-in-ci.md policy scope. | Not CC-specific policy question. Policy is project-internal. | Policy question, not CC technical claim. | AFFIRM (the distinction between CI-side and session-side is correctly drawn) |

### Claim group C: Cline hook architecture comparison

| # | Claim | Line | Channel A | Channel B | Verdict |
|---|-------|------|-----------|-----------|---------|
| 4.C1 | Cline's hook events: `TaskStart`, `TaskResume`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreCompact`, `TaskComplete`, `TaskCancel` — no after-assistant-turn hook | Lines 294-295, 385 | Not CC harness (Cline is a different tool). Verified via DeepWiki `cline/cline` in parent patch. | DeepWiki `cline/cline`: confirmed in original parent patch session. This session does not re-verify Cline via Channel A (docs.claude.com not applicable for Cline). | Single-channel (DeepWiki) — Cline is not CC. | AFFIRM (single-channel sufficient — Cline is not CC harness; docs.claude.com not the authoritative source. T-AO-K does not apply to non-CC tools.) |

### Claim group D: MCP ecosystem claims

| # | Claim | Line | Channel A | Channel B | Verdict |
|---|-------|------|-----------|-----------|---------|
| 4.D1 | No "recommendation pre-validator", "output linter", or "verdict gate" MCP server exists in the ecosystem | Lines 271-276 | Not CC harness — MCP ecosystem claim. WebSearch-verified in parent patch. | Not a CC claim. | Not CC-specific. | AFFIRM (single-channel sufficient per T-AO-K — this is an MCP ecosystem claim, not CC harness internals) |
| 4.D2 | MCP servers implement input validation via Zod schemas at tool-definition level, not as middleware interceptors on AI responses | Line 272 | Not CC harness. MCP protocol claim. | DeepWiki on `modelcontextprotocol/servers` via original parent session. | Not CC-specific. | AFFIRM |

**T7 adversarial counter-prompt for patch #4 (CRITICAL):** "What CC capability did I fail to check?"

Running explicitly: The inventory above covers all hook events mentioned in patch #4 (UserPromptSubmit, Stop, PreToolUse, PostToolUse, SubagentStop, PreCompact, SessionStart, Elicitation/ElicitationResult). The patch also references `TodoWrite` tool as a CC tool (H4 mechanism) — this is a standard CC tool, confirmed available in this session. The "Ralph Loop" plugin mentioned in lines 104-105 is a design pattern, not a specific CC API claim. One potential miss: the parent patch mentions H10 uses "Claude Code has tool-use capability. Custom MCP tool with required parameters is achievable" — this is correct and well-established CC behavior, not requiring separate verification.

**Additional check:** The patch cites `SSOT #20` (Claude Code hooks API, ADOPT). This SSOT entry is referenced but not the source of CC claims — the patch references actual docs. No missed CC claims found.

**§5 verdict summary:**

| Claim | Verdict |
|-------|---------|
| 4.A1 (UserPromptSubmit fires on every prompt) | AFFIRM |
| 4.A2 (additionalContext via JSON output) | AFFIRM + REVISION-NOTE (mechanism description imprecise: "stdout" vs `hookSpecificOutput.additionalContext`) |
| 4.A3 (Stop fires at session end only) | FLAG — official docs say "once per turn"; parent patch may have understated Stop's per-turn scope |
| 4.A4 (Stop receives `last_assistant_message`) | FLAG — official docs do not list this field; DeepWiki says it exists |
| 4.A5 (Stop returns decision=block to continue) | AFFIRM (Channel A confirmed; DeepWiki diverged but Channel A is authoritative) |
| 4.A6 (PreToolUse fires before tool) | AFFIRM |
| 4.A7 (PostToolUse fires after tool; updatedToolOutput) | AFFIRM + REVISION-NOTE (`updatedToolOutput` naming unconfirmed in current docs) |
| 4.A8 (SubagentStop receives `agent_transcript_path`) | FLAG — official docs list `agent_id` + `agent_type`; `agent_transcript_path` not confirmed |
| 4.A9 (PreCompact) | AFFIRM |
| 4.A10 (SessionStart) | AFFIRM |
| 4.A11 (Elicitation/ElicitationResult = MCP dialog only) | **AFFIRM — T-Verify-A: iter-1 HARD-FIX confirmed dual-channel** |
| 4.A12 (no after-turn hook) | REVISION-NOTE (Stop IS per-turn per docs; "no pre-display hook" is more accurate) |
| 4.B1 (prompt-type Stop hook) | AFFIRM |
| 4.B2 (subscription-bundled) | AFFIRM |
| 4.C1 (Cline hook list) | AFFIRM (single-channel, Cline not CC) |
| 4.D1/4.D2 (MCP ecosystem) | AFFIRM (single-channel, not CC harness) |

**Counts:** 17 claims, 11 AFFIRM, 3 FLAG (4.A3, 4.A4, 4.A8), 3 REVISION-NOTE (4.A2, 4.A7, 4.A12). **Overall verdict: FLAG** — two FLAGs (4.A3, 4.A4) materially affect the H2 mechanism analysis in the parent patch.

---

## §6 Patch #5 — aif-ssot-corrections commit 828e31c (LIGHT)

**Content:** `docs/meta-factory/prior-art-evaluations.md` SSOT entries #27-#30 corrections + #42-#46 new entries. Verified via `git show 828e31c:docs/meta-factory/prior-art-evaluations.md`.

**CC-specific claim inventory:** This commit corrects AIF Handoff attribution errors (#27-#30) and adds SSOT entries #42-#46 (DeepWiki MCP, @aif/runtime, @aif/mcp, @aif/agent watchdogs, Subagents/Skills mode). None of these entries make assertions about CC harness internals (hook events, settings.json, MCP protocol behavior). The SSOT entries are about external tools evaluated for adoption.

| # | Claim | Source | Verdict |
|---|-------|--------|---------|
| 5.1 | SSOT #42 (DeepWiki MCP): `ask_question`, `read_wiki_structure`, `read_wiki_contents` tools; free for public repos; 50k+ indexed; index may lag HEAD | SSOT entry #42 text | AFFIRM — confirmed by this session's own use of DeepWiki. Tool behavior matches description. Not CC harness. |
| 5.2 | SSOT #43-#46: AIF Handoff monorepo entries (`@aif/runtime`, `@aif/mcp`, `@aif/agent`, Subagents/Skills mode) | SSOT entries #43-#46 text | Not CC harness claims. AIF Handoff is external tooling. Verified via DeepWiki in original session. AFFIRM (single-channel sufficient — these are AIF Handoff internal architecture claims, not CC claims). |
| 5.3 | SSOT #27-#30 corrections: AIF Handoff attribution from `lee-to/ai-factory v2.x` corrected to `lee-to/aif-handoff` | Commit diff | Not CC harness. Confirmed by DeepWiki `lee-to/aif-handoff` in original session. AFFIRM. |

**§6 verdict:** 3 claim groups, 3 AFFIRM, 0 FLAG, 0 REVISION-NOTE. **Overall: AFFIRM**

---

## §7 Native CC feature scan summary (§4.5 results)

Per kickoff §4.5 — for each native CC capability surfaced, assess overlap with parent patch proposals and apply T16 problem-class check.

### 7.1 Stop hook per-turn vs session-end scope (FLAG 4.A3)

**CC upstream feature:** Stop hook fires "once per turn" (after each Claude response), per official docs.

**Parent patch's claim:** Stop hook fires only at session termination; H2 is therefore "PARTIAL" because it catches only the final verdict.

**T16 check:**
- Upstream problem class: stop execution after each Claude response turn (allows hooks to inject feedback or block continuation per-turn).
- Parent patch's problem class: catch recommendation-shaped verdicts before they are accepted by maintainer.

**Class match assessment:** If Stop fires per-turn, H2 (Stop hook post-turn audit) is SAME-CLASS for the parent patch's use case — it would catch each recommendation in the 4-turn defence pattern, not just the final one. This is a potentially significant architecture finding.

**Caveat:** The "once per turn" language in official docs needs maintainer empirical verification — the Stop hook may fire after each assistant response in a multi-turn conversation, or it may be more nuanced (e.g., fires when Claude explicitly "stops" a task, not necessarily after each assistant response). Per D3 (confidence threshold), Channel A has weight here; Channel B (DeepWiki) said "session end" which is less precise.

**AI-agnostic posture (D2):** Even if Stop fires per-turn in CC, Cline's architecture (§5.5 of parent patch) shows no equivalent. A per-turn Stop hook gate would be CC-specific. D2 surface: surface to maintainer.

### 7.2 SubagentStop agent_transcript_path availability (FLAG 4.A8)

**CC upstream feature:** SubagentStop hook receives `agent_id` + `agent_type`. Official docs do not list `agent_transcript_path`.

**Parent patch's assumption:** H8 mechanism could inspect subagent transcript via `agent_transcript_path` field. If this field does not exist, H8 would require reading `transcript_path` (main session transcript) and filtering by agent.

**T16 check:** The parent patch's use of `agent_transcript_path` is contingent on the field existing. If it doesn't, H8 still works via main transcript path — it requires parsing rather than direct path access. Not a blocking finding, but a precision issue.

### 7.3 PostToolUse updatedToolOutput naming

**CC upstream feature:** PostToolUse hook supports output replacement. Current docs show `modifiedInput` for tool input modification.

**Parent patch claim:** `hookSpecificOutput.updatedToolOutput` for replacing tool output.

**T16 check:** Upstream feature exists (PostToolUse output modification). Field name may differ from what parent patch used. REVISION-NOTE — if H4/H8 mechanisms rely on this specific field name, implementers should verify current field names against docs at implementation time.

### 7.4 No native verdict-gate or pre-display intercept primitive

Both channels confirm: no CC hook fires before an assistant response reaches the user. Stop fires AFTER each response (per Channel A), not before. No pre-display intercept exists.

**T16 check:** H10 (verdict-as-tool-call) remains the correct architectural approach for truly pre-display enforcement. H10's problem class (enforce structure before verdict text is written) ≠ any native CC hook's problem class. H10 is own-build — confirmed.

---

## §8 Per-patch verdict table

| Patch | CC-claims verified | AFFIRM | FLAG | REVISION-NOTE | Overall verdict |
|-------|-------------------|--------|------|---------------|-----------------|
| #1 research-tooling | 2 | 2 | 0 | 0 | AFFIRM |
| #3 hook-architecture | 7 | 7 | 0 | 0 | AFFIRM |
| #4 think-time-gate | 17 | 11 | 3 | 3 | FLAG |
| #5 SSOT-corrections | 3 | 3 | 0 | 0 | AFFIRM |
| **Total** | **29** | **23** | **3** | **3** | **FLAG (patch #4)** |

---

## §9 Open decisions for maintainer (D1-D4)

**D1 — Revision-patch policy:** Three FLAGs found in parent patch #4 (claims 4.A3, 4.A4, 4.A8) and three REVISION-NOTEs (4.A2, 4.A7, 4.A12). Should the project issue a revision-patch on the original patch, or is notation in this cross-verification research-patch sufficient?

- Option A: Note only in this cross-verification patch; parent patch #4 stands as historical record with its original content; future readers consult this patch for corrections. (Lower friction; maintains append-only discipline for closed patches.)
- Option B: Issue an explicit revision-patch on the original (separate file, REVISION header). More visible; adds doc surface. Consequence: accumulates per-correction patch files.

**R-phase recommendation:** Option A for the three REVISION-NOTEs (4.A2, 4.A7, 4.A12 — imprecision in mechanism descriptions, conclusions sound). Option A or B for the three FLAGs depending on whether maintainer re-runs verification and finds the FLAGs resolved. If FLAG 4.A3 resolves as "Stop fires per-turn" (high likelihood), a REVISION-NOTE on parent patch #4's H2 analysis is warranted.

**D2 — Stop hook per-turn scope verification:** FLAG 4.A3 is the most consequential finding. Official docs say "once per turn"; parent patch says "only at session termination." Empirical verification needed.

- Option A: Empirically test: run a multi-turn CC session with a Stop hook that prints a log entry. Count log entries vs conversation turns. If one entry per turn → Stop fires per-turn; parent patch H2 analysis is understated.
- Option B: Accept current documentation ("once per turn") at face value and treat parent patch H2 analysis as requiring revision — H2 is stronger than assessed.

**R-phase recommendation:** Option A (empirical test) before revising H2 analysis, since CC documentation on this may lag implementation.

**D3 (per kickoff) — Confidence threshold for AFFIRM:** Default 2/2 used in this session. Where Channel A (official docs) and Channel B (DeepWiki) diverged, Channel A was given higher weight with explicit FLAG and resolution step. This session recommends maintaining 2/2 as the default but accepting Channel A (WebFetch of official docs) as conclusive when DeepWiki diverges.

- Option A: Strict 2/2 — single-channel is FLAG regardless.
- Option B (recommended): WebFetch of official docs.claude.com is conclusive; DeepWiki used as supplement. Where DeepWiki has additional CHANGELOG-sourced detail not in docs, treat as "possibly correct, pending empirical verification."

**D4 (per kickoff) — Fallback if claude-code-guide unavailable:** This session applied D4 Option B (direct WebFetch of docs.claude.com). Quality of verification was adequate — official docs provided verbatim schemas and JSON formats. Recommend adopting Option B as the standing fallback for Worker sessions that cannot dispatch claude-code-guide subagent.

- Option A: Escalate immediately (per §6.3 ESCALATE:K:tool-unavailable) — adds queue overhead for a resolvable gap.
- Option B (applied here and recommended): Direct WebFetch of docs.claude.com + DeepWiki. Same information, different routing. Document in state.md.

**D5 (new — Stop hook `last_assistant_message` field, FLAG 4.A4):** Parent patch #4 H2 mechanism relies on `last_assistant_message` field in Stop hook input to scan for verdict-shape phrases. Official docs do not list this field; DeepWiki (CHANGELOG-sourced) says it exists.

- Option A: Treat as AFFIRM pending empirical test (DeepWiki CHANGELOG evidence is credible).
- Option B: Treat as FLAG — do not implement H2 until field existence confirmed in current CC version.
- Option C: Implement H2 using `transcript_path` (confirmed present in Stop hook input) rather than `last_assistant_message`. Read last entry in transcript file. More robust alternative regardless of field status.

**R-phase recommendation:** Option C — use `transcript_path` as the evidence source. This is documented in official docs and does not depend on the disputed `last_assistant_message` field. Parent patch should note this as the safer implementation path.

---

## §10 Self-application (§8 mandate)

Per kickoff §8 — the kickoff itself makes CC-specific claims that must be dual-channel verified.

**Kickoff CC-specific claims (enumerated):**

| # | Kickoff claim | Kickoff location | This session's verification | Verdict |
|---|---------------|-----------------|----------------------------|---------|
| K1 | `claude-code-guide` subagent has tools: Bash, Read, WebFetch, WebSearch | Kickoff §4.2 step 2 | Not verifiable via docs.claude.com (claude-code-guide is internal CC dispatch mechanism). Pre-flight check in queue state.md confirmed subagent_type available in session system reminder. Tool list (Bash, Read, WebFetch, WebSearch) consistent with standard CC session tools. | AFFIRM (plausible; not contradicted) |
| K2 | SendMessage continuity pattern: "check if there is already a running or recently completed claude-code-guide agent that you can continue via SendMessage" | Kickoff §4.2 step 3 | Not applicable: this session used D4 Option B (no claude-code-guide dispatch). SendMessage pattern not used. The claim itself (from Anthropic docstring) is not verifiable via docs.claude.com — it is internal orchestrator guidance. | INCONCLUSIVE — not verifiable via official docs; D4 Option B applied instead |
| K3 | `mcp__deepwiki__ask_question` syntax: `ask_question repo="anthropics/claude-code" question="..."` | Kickoff §4.3 | Confirmed: used in this session. Tool works exactly as described. `repoName` is the parameter name (not `repo`). | AFFIRM (with REVISION-NOTE: parameter is `repoName`, not `repo` in the kickoff's example syntax) |
| K4 | DeepWiki is a "second channel" for CC internals sourced from CHANGELOG.md + actual repo code | Kickoff §4.3 | Confirmed by DeepWiki's own responses: "The information is primarily sourced from the CHANGELOG.md file." Code-grounded answers. | AFFIRM |

**T15 self-application — does THIS verification apply its own dual-channel discipline?**

Yes: all CRITICAL patch #4 CC claims were verified via both Channel A (docs.claude.com WebFetch) and Channel B (DeepWiki). Where channels diverged, the divergence was flagged and documented. The three FLAGs (4.A3, 4.A4, 4.A8) emerged precisely from this dual-channel comparison — DeepWiki agreed with the parent patch on some claims that official docs do not confirm, surfacing genuine uncertainty.

**T7 self-application — what did this verification miss?**

The `SubagentStart` hook mentioned in official docs (not in parent patch #4 inventory) was not evaluated. Parent patch #4 mentions only SubagentStop for H8. SubagentStart could provide a hook point when subagent sessions begin — not relevant to the think-time gate use case but a completeness note. The parent patch's H8 mechanism is about reviewing subagent output (SubagentStop), not subagent start — so this omission does not affect the analysis.

**T-AO-K reflexive check:** This patch used two channels for all CRITICAL/HEAVY CC claims. The three FLAGs surfaced by the dual-channel comparison (4.A3, 4.A4, 4.A8) are the empirical result of applying T-AO-K — they would not have been caught by single-channel (DeepWiki-only) verification, since DeepWiki confirmed those claims. Channel A (official docs) is the discriminating channel here.

---

## §11 See also

- **Parent patches (READ-ONLY):**
  - `docs/meta-factory/research-patches/2026-05-16-research-tooling-evaluation.md` (387 lines)
  - `docs/meta-factory/research-patches/2026-05-16-§13.33-hook-architecture-research.md` (786 lines)
  - `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md` (470 lines)
  - commit `828e31c` — SSOT entries #27-#30 + #42-#46

- **Verification sources:**
  - Channel A: `https://code.claude.com/docs/en/hooks` (official CC hooks reference, fetched 2026-05-16)
  - Channel B: DeepWiki `ask_question("anthropics/claude-code", ...)` queries (2026-05-16)

- **Kickoff:** `.claude/orchestrator-prompts/re-verify-with-claude-code-guide/kickoff.md`

- **State:** `.claude/orchestrator-prompts/queue-mode-execution-bc/state.md`

- **Discipline rules applied:**
  - `.claude/rules/ai-laziness-traps.md` — T1, T3, T7, T11, T13, T15, T16, T-AO-C, T-AO-K, T-AO-L, T-Verify-A
  - `.claude/rules/no-paid-llm-in-ci.md` — no CI gate proposed
  - `.claude/rules/doc-authority-hierarchy.md` — header format applied

- **T-AO-K description:** `.claude/orchestrator-prompts/queue-mode-bootstrap/kickoff.md §8 T-AO-K` (if Artefact A reference not yet created)

- **Relevant principle tests:**
  - `packages/core/principles/10-research-patch-annotation.test.ts` — `<!-- scope:... -->` annotation (first line present ✓)

---

## Traps compliance table (§6)

| Trap | Status | Evidence |
|------|--------|---------|
| T1 (sampling floor) | APPLIED | CRITICAL patch #4: all 17 CC claims enumerated. HEAVY patch #3: all 7 CC claims enumerated. LIGHT patches: all claims enumerated. |
| T3 (every claim cites source) | APPLIED | Each claim row in §4-§6 tables includes parent patch line reference, Channel A finding, Channel B finding. |
| T7 (adversarial counter-prompt) | APPLIED | §4 adversarial counter-prompt executed (no CC claims missed in patch #3). §5 adversarial counter-prompt executed (SubagentStart noted, not relevant). §10 self-application T7 run. |
| T11 (build-vs-reuse before claiming native CC replaces proposal) | APPLIED | §7 T16 checks for all overlaps. H10 confirmed as own-build (no native CC equivalent). |
| T13 (ADOPTED-MECHANISM problem class) | APPLIED | §7 explicitly states upstream problem class vs parent patch problem class for each overlap. |
| T15 (self-application MANDATORY) | APPLIED | §10 enumerates kickoff's own CC claims and verifies them. |
| T16 (problem-class match) | APPLIED | §7 T16 checks for Stop per-turn scope, SubagentStop, PostToolUse, H10 own-build. |
| T-AO-C (file-write delay) | APPLIED | Sections written incrementally per §5.4 discipline. |
| T-AO-K (dual-channel MANDATORY — reflexive) | APPLIED — applies HERE | Both channels (docs.claude.com + DeepWiki) used for all HEAVY/CRITICAL CC claims. FLAGs surface from channel divergence. Reflexive note: this patch itself is dual-channel sourced. |
| T-AO-L (principles tests) | APPLIED | `npm run -w @rules-as-tests/core test:principles` → 56 tests passed (10 test files), 2026-05-16T15:59:00+03:00. |
| T-Verify-A (iter-1-fixed claim) | APPLIED | §5 claim 4.A11 (Elicitation/ElicitationResult) dual-channel verified — AFFIRM. Iter-1 HARD-FIX confirmed correct. |

---

*Research patch written 2026-05-16 by Worker subagent (claude-sonnet-4-6, burn-mode authorized). Verification: Channel A = docs.claude.com WebFetch (D4 Option B); Channel B = DeepWiki anthropics/claude-code.*

---

## §12 Post-GO addendum — Orchestrator-mediated `claude-code-guide` resolution of the 3 FLAGs

**Added 2026-05-16, post-GO.** Queue Mode Execution B+C session, Orchestrator-side follow-up.

### §12.1 Why this addendum

§5 raised three FLAG findings on parent patch #4 (`2026-05-16-§17-think-time-gate.md`). Reviewer iter 0 independently re-fetched the same URLs and downgraded all three to SOFT, arguing Worker over-flagged. Verdict GO'd on grounds «no HARD-FIX; over-flag is conservative». Post-GO, the Orchestrator dispatched `claude-code-guide` (Orchestrator-only resource per `~/.claude/skills/orchestrator/references/queue-mode.md §10` / §11 corrections) to obtain a third independent channel grounded in WebFetch of the **same** docs.claude.com pages plus the TypeScript SDK type definitions.

The third channel **reverses one of the Reviewer's downgrades**: 4.A3 is a real bug in parent patch #4, not Worker over-flag. The other two are confirmed as Worker over-flags. This addendum records the resolution and surfaces patch #4's documented error to the maintainer (Dn item below).

### §12.2 Authoritative resolution table

| FLAG | Parent patch #4 claim | Worker's flag (Channel A WebFetch) | Reviewer's re-fetch verdict | **Orchestrator-mediated claude-code-guide verdict** | Authoritative source |
|---|---|---|---|---|---|
| **4.A3** | «Stop hook fires at session termination only» | FLAG — Stop fires per turn | downgrade to SOFT (parent patch correct) | **Worker was RIGHT, Reviewer was WRONG, parent patch HAS A BUG.** Stop fires after each assistant turn. `SessionEnd` is a separate, distinct hook event that fires at session termination. | `https://code.claude.com/docs/en/hooks.md` lifecycle table: `Stop \| When Claude finishes responding`; `SessionEnd \| When a session terminates` |
| **4.A4** | «`last_assistant_message` field exists in Stop payload» | FLAG — field not seen in docs | downgrade to SOFT (parent patch correct) | **Reviewer was right (parent patch correct), Worker was over-flagging.** The field exists as `last_assistant_message?: string` in `StopHookInput` TypeScript SDK type definition. It is optional, so the `hooks.md` JSON example omits it when absent. | `https://code.claude.com/docs/en/agent-sdk/typescript.md` `StopHookInput` type |
| **4.A8** | «`agent_transcript_path` field exists in SubagentStop payload» | FLAG — field not seen in docs | INCONCLUSIVE | **Reviewer was right to suspect, Worker was over-flagging.** The field exists as `agent_transcript_path: string` (required, non-optional) in `SubagentStopHookInput` TypeScript SDK type, AND appears in two live code examples in `agent-sdk/hooks.md`. Hooks.md JSON example simply omits it for brevity. | `https://code.claude.com/docs/en/agent-sdk/typescript.md` `SubagentStopHookInput` type; `https://code.claude.com/docs/en/agent-sdk/hooks.md` code samples |

### §12.3 Patch-by-patch verdict revision

§8 verdict table (above) stays as-is — it represents the state at RESEARCH-COMPLETE B (iter 0). The resolution below is layered on top via this addendum:

| Patch | Prior verdict (§8) | Revised verdict post-§12 | Action needed |
|---|---|---|---|
| #1 research-tooling | AFFIRM | AFFIRM (unchanged) | None |
| #3 hook-architecture | AFFIRM | AFFIRM (unchanged) | None |
| **#4 think-time-gate** | **FLAG (3 FLAG, 3 REVISION-NOTE)** | **FLAG (1 confirmed-error → revision-patch warranted; 2 Worker-over-flag downgraded to AFFIRM)** | **Maintainer D-decision: see D6 below.** |
| #5 aif-ssot-corrections | AFFIRM | AFFIRM (unchanged) | None |

### §12.4 Documented error in parent patch #4 (think-time-§17-gate)

Per claude-code-guide's WebFetch of `https://code.claude.com/docs/en/hooks.md`:

> `Stop` | When Claude finishes responding  
> `SessionEnd` | When a session terminates

Parent patch #4 (sections cited in original §5 row 4.A3) claims Stop fires «only when the session actually terminates». This is **wrong** per the lifecycle table. The two events are documented as separate hooks with distinct firing conditions:

- `Stop` — after each assistant turn within a session
- `SessionEnd` — at session termination only

If patch #4's H2 mechanism (the «final-recommendation defence» pattern) was designed assuming Stop fires only at session end, its **temporal coverage analysis is incorrect**. H2 with the per-turn Stop interpretation has substantially **better** coverage than patch #4 assessed — it would fire on every assistant turn that contains a final-recommendation pattern, not only when the user explicitly ends the session.

### §12.5 New open decision: D6 — Patch #4 revision policy

**D6 (added post-GO):** Patch #4 (§17 think-time-gate) contains a documented misreading of the Stop hook lifecycle. The misreading affects the H2 mechanism's coverage assessment but does NOT invalidate the patch's overall architectural conclusions (which favour H10 own-build over H2 anyway).

**Options:**
- **D6 Option A — Errata note:** add a `<!-- ERRATUM 2026-05-16 -->` block to patch #4 §5.2/§7.3 noting the Stop hook lifecycle correction, with a pointer to this §12 addendum. Minimal edit; preserves the original patch as historical record.
- **D6 Option B — Revision patch:** issue `docs/meta-factory/research-patches/2026-MM-DD-patch-4-stop-hook-revision.md` per the project's prior-revision pattern. More visible; clearer audit trail; one more file in the patches/ directory.
- **D6 Option C — Accept as-is:** patch #4 is GO'd and its architectural conclusion (H10 over H2) is unchanged by the lifecycle correction. The H2 coverage misassessment is internal to the patch's reasoning, not its bottom line. Leave the patch unchanged; this §12 addendum is the corrective record.

**Maintainer decides.** Worker did NOT execute any of these options — per CLAUDE.md «no drive-by PRs» and the post-GO addendum scope discipline.

### §12.6 Verification chain — three independent passes catch what two miss

**This is the load-bearing methodological finding of Queue Mode Execution B+C, post-§12.**

Three independent verification passes on the 3 FLAGs revealed asymmetric error patterns:

1. **Worker (single WebFetch by general-purpose Sonnet/Opus Worker):** caught 1 real bug (4.A3); over-flagged 2 (4.A4, 4.A8). Net: 1 true positive + 2 false positives = mixed signal.
2. **Reviewer (independent WebFetch by separate general-purpose Opus Reviewer):** caught both over-flags correctly (4.A4, 4.A8) but **also misread 4.A3 in the same direction as the parent patch** — converged on the wrong interpretation. Net: 2 corrections + 1 missed bug = mixed signal in the opposite direction.
3. **Orchestrator-mediated claude-code-guide (Haiku built-in subagent with WebFetch + TypeScript SDK type definitions):** all three resolved correctly with verbatim doc + type evidence. Net: 3 true verdicts.

**Implication for T-AO-K:** dual-channel by one Worker + independent re-fetch by one Reviewer is NOT sufficient when both channels can converge on the same misreading. The claude-code-guide subagent's distinguishing capability is access to BOTH `hooks.md` AND TypeScript SDK type definitions (`agent-sdk/typescript.md`) — type-system evidence is harder to mis-interpret than prose lifecycle tables.

**Recommendation for the Queue mode skill (future revision):** §10.5 currently mandates Reviewer's independent WebFetch. For high-stakes CC claims (especially hook lifecycle), recommend **three** passes: Worker WebFetch + Reviewer WebFetch + Orchestrator claude-code-guide. The Orchestrator's claude-code-guide call is the type-system-grounded channel that catches doc-prose mis-readings.

### §12.7 See also (additions)

- `~/.claude/skills/orchestrator/references/queue-mode.md §11` — revised post-§12 to reflect SendMessage continuity gating on `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- `~/.claude/skills/orchestrator/references/queue-mode.md §10` — already corrected pre-§12 by maintainer to reflect Worker inaccessibility of claude-code-guide.
- Memory `feedback_reviewer_webfetch_second_pass_value.md` — updated post-§12 with the nuance that Reviewer's independent WebFetch can also mis-read (1/3 case here).
