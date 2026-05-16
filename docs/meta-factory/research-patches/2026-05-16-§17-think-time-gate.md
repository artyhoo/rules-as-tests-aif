<!-- scope:think-time-s17-gate -->
# §1.7 think-time gate — research patch (temporal scope gap)

> **Status:** RESEARCH — no implementation in this patch. Decisions deferred to maintainer dialogue (§6).
> **Date:** 2026-05-16
> **Scope:** the gap between §1.7 mitigation surface (fires at commit/PR-time) and the actual moment of recommendation failure (fires in-dialogue, before any commit exists). Sibling to [2026-05-13-pr-body-s17-substance-gap.md](2026-05-13-pr-body-s17-substance-gap.md) (that patch covers commit/PR-time substance; this patch covers the pre-commit temporal gap).
> **Inherits authority from:** [research-patches/README.md](README.md) folder-level Authoritative-for header.

---

## §1 Incident reconstruction (2026-05-13 dialogue session)

Parent patch ([2026-05-13-pr-body-s17-substance-gap.md §6.7](2026-05-13-pr-body-s17-substance-gap.md)) documents this as meta-observation. Brief reconstruction (do NOT re-narrate parent gap):

Five confidently-wrong AI recommendations shipped in a single dialogue session before maintainer intervention:

| # | Recommendation | Failure mode |
|---|---|---|
| 1 | §1 of the research-patch claimed «substance backward-check был correct» | `#discipline-application-scope-blindness` sub-case (c) — claim from kickoff handoff accepted without independent grep |
| 2 | Q3 DEFER Danger JS with 5 arguments («hand-roll cheaper», «lock-in», etc.) | `#recommendation-skips-own-discipline` — rationalisation against project's own build-vs-reuse principle |
| 3–5 | 3 additional dialogue turns defending hand-roll verdict | Same anti-pattern extended across 4 turns total under challenge |

**Common structural property:** all 5 failures occurred **before any commit**. The §1.7 gate surface ([`.husky/pre-push:309-332`](../../../.husky/pre-push)) cannot fire because there is no commit to inspect. The failure mode is temporally out-of-scope of the existing mitigation.

---

## §2 Existing coverage

**Named anti-patterns (documented, sample-corpus collected):**

- [`.claude/rules/phase-research-coverage.md §4 line 92`](../../../.claude/rules/phase-research-coverage.md#L92) — `#discipline-application-scope-blindness` (H8, promoted Wave 8 Batch C 2026-05-12). Sub-case (c) = unverified collaborator claims — this is failure mode #1 above.
- [`.claude/rules/phase-research-coverage.md §4 line 97`](../../../.claude/rules/phase-research-coverage.md#L97) — `#recommendation-skips-own-discipline`. Quote from that line: «Mitigation: §1.7.» This is failure modes #2-5 above.

**Mitigation pointer:**
- §1.7 is cited as mitigation for `#recommendation-skips-own-discipline` at [`.claude/rules/phase-research-coverage.md §1.7`](../../../.claude/rules/phase-research-coverage.md).

**Self-reflection skill:**
- [`.claude/skills/self-reflection/SKILL.md`](../../../.claude/skills/self-reflection/SKILL.md) Layer 2 — skill auto-triggers on keywords including `recommend`, `principle`, `discipline`. Forward-checklist Layer 6 sub-case (c) verify-before-accepting probe + sub-case (b) anti-tautology probe. **Trigger condition is user-side only** — skill loads when the USER types trigger keywords, not when AI is about to issue a verdict.

**Hook infrastructure:**
- [`.claude/hooks/inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh) — UserPromptSubmit hook fires on every user prompt, injects Goal + Invariants. Verified: `bash .claude/hooks/inject-session-bootstrap.sh` emits the digest with goal + 3 invariants including build-vs-reuse SSOT consult.
- [`.claude/hooks/validate-prompt.sh`](../../../.claude/hooks/validate-prompt.sh) and `check-doc-authority.sh` also on UserPromptSubmit per [`.claude/settings.json:2-28`](../../../.claude/settings.json).

**What is already covered:** naming the anti-pattern, documenting the mitigation pointer, injecting goal/invariants at session start.

**What is NOT covered (the gap):** a gate that fires *when the AI is forming the recommendation itself*, i.e., at dialogue-time, not at commit-time. The 5 recommendations above cleared session-start injection (goal was visible in context) but still failed — indicating that text-in-context at session-start is insufficient to gate individual recommendation formation.

---

## §3 Structural gap — temporal scope

The gap is a temporal mismatch between failure-time and gate-time:

```text
Timeline of a dialogue session:
  
  T=0   Session start → UserPromptSubmit hook fires →
          session-bootstrap digest injected (Goal + Invariants visible in context)
  
  T=1   AI reasoning starts — build-vs-reuse principle visible but not mechanically enforced
  
  T=2   AI issues DEFER/ADOPT/RECOMMEND verdict       ← FAILURE HERE (5 occurrences)
          No gate fires. Verdict ships in response text.
  
  T=3   User challenges. AI defends (turns 3-5).      ← FAILURE CONTINUES
  
  T=4   (hypothetical) Maintainer accepts AI verdict without challenge.
          Verdict carried into research-patch as «recommendation».
  
  T=5   Research-patch committed → §1.7 file-glob predicate evaluated →
          BUT: research-patches are ALLOWLISTED in §1.7 gate
          (S17_ALLOWLIST_RE matches `docs\(research-patches\)`)
          Gate does NOT fire even at commit time.
  
  T=6   PR opened → CI discipline-self-check.yml fires →
          BUT: PR description §1.7 sections cover FORWARD+BACKWARD checks, not
          «did the AI consult SSOT before each individual recommendation?»
```

**Double zero-gate:** research-patch commits are allowlisted at hook time AND the PR body §1.7 gate covers structural compliance, not per-recommendation SSOT consultation. A wrong recommendation that survives to a committed research-patch faces **no mechanical gate at any stage**.

**The fundamental constraint:** §1.7 gates what gets committed. It cannot gate what gets said. Dialogue text is ephemeral — there is no filesystem artifact at T=2 for the hook to inspect.

**Why session-start injection is insufficient:** The 2026-05-13 session had goal + invariants injected at T=0. The AI still produced 5 wrong recommendations. Empirical evidence that text-in-context ≠ mechanical enforcement. The gap is not «AI doesn't see the principle» — it is «AI sees the principle but does not self-apply it at recommendation-formation time».

---

## §4 Candidate mechanisms

> **HOT vs WARM/COLD split** per maintainer ask 2026-05-13: primary research focus = HOT class (in-dialogue).

### HOT class — fires in-dialogue, before verdict ships to user

**H1 — UserPromptSubmit hook injection extension.**
Current hook ([`.claude/hooks/inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh)) injects Goal + Invariants but not recommendation-specific discipline. Extension: add explicit instruction to the digest — «before issuing any ADOPT / DEFER / RECOMMEND / VERDICT / RULE-CHANGE: (1) state the SSOT entry consulted, (2) run context7 ≥3 phrasings, (3) cite mechanical evidence (file:line or grep output) for each numeric claim». One-line addition to existing script.
- **Can fire HOT:** yes — fires on every user prompt including the one that starts a recommendation dialogue.
- **Harness support verified:** UserPromptSubmit hook stdout is injected into Claude Code prompt context per [`.claude/hooks/inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh) comment and context7 evidence (`additionalContext` field supported per DeepWiki).
- **Critical weakness (T-think-time-C):** empirically, session-start injection of the same principles did not prevent 5 failures in 2026-05-13 session. Injection ≠ enforcement. Adding more text to injection may not change outcome if the failure mode is cognitive (not informational).
- **Testability:** compare rate of `#recommendation-skips-own-discipline` occurrences across sessions with vs. without the extension. No mechanical verification of AI applying the instruction.
- **SSOT check:** extends existing hook #20 (Claude Code hooks API, ADOPT). No new capability, no new dep.

**H2 — Stop hook post-turn audit (verdict detection → context injection).**
Claude Code Stop hook fires when the AI finishes a task/turn. Hook receives `last_assistant_message` field with full text of final assistant response (verified: DeepWiki; WebSearch hitting `code.claude.com/docs/en/hooks`; claudefa.st/blog/tools/hooks/hooks-guide). Hook script scans `last_assistant_message` for verdict-shape phrases (`ADOPT`, `DEFER`, `recommend`, `verdict:`, `I suggest`) without accompanying evidence patterns. If detected: hook returns `{"decision": "block", "reason": "...", "systemMessage": "Verify SSOT citation and file:line evidence before issuing verdict"}`.
- **Can fire HOT:** PARTIAL. Stop hook fires when AI stops, not after each turn mid-conversation. Per WebSearch finding: «Stop hook only fires when the session actually terminates, and when Claude simply finishes a turn mid-conversation, no hook fires.» This means H2 catches the FINAL verdict in a session but NOT intermediate recommendations mid-conversation. Failure modes #2-5 (4-turn defence pattern) would only be caught at the last turn.
- **Harness support verified:** Stop hook receives `last_assistant_message` (DeepWiki confirms). Can return `{"decision": "block"}` with `systemMessage` to inject context and continue session. «Ralph Loop» plugin demonstrates using Stop hook to feed previous output back as input for iterative improvement (DeepWiki anthropics/claude-code).
- **Critical weakness:** only fires at session end, not mid-conversation. Also: AI can be coached to avoid the verdict-shape keywords while conveying the same verdict substance — keyword detection is bypassable.
- **False positive risk:** high — any mention of «recommend» or «suggest» in informational context (not a verdict) triggers the hook.
- **SSOT check:** extends existing hook #20 (Claude Code hooks API, ADOPT). No new capability.

**H3 — Skill auto-trigger expansion (AI-side output monitoring).**
Current self-reflection skill triggers on USER-typed keywords. Harness does not support skills auto-loading based on AI output content — this was verified via DeepWiki and context7. Claude Code skill `description` field is matched against user prompts, not AI responses. **H3 as AI-side output trigger is NOT harness-supported** in the current architecture. The skill can only fire when the user explicitly invokes it (via `/skill` command or trigger keyword in user turn).
- **Can fire HOT at recommendation-formation time:** NO — harness architectural constraint.
- **Evidence:** [`.claude/skills/self-reflection/SKILL.md:3`](../../../.claude/skills/self-reflection/SKILL.md) confirms trigger is on user-prompt keywords; no mechanism for AI-output-triggered skill loading found in context7 or DeepWiki searches.
- **Alternative form:** include the self-reflection skill checklist as a mandatory inline section in every recommendation-shaped AI output via H1 (prompt injection instructing AI to self-apply). This collapses H3 into H1 extension.

**H4 — In-conversation TodoList discipline.**
Each load-bearing recommendation (ADOPT/DEFER/RECOMMEND/VERDICT) requires AI to first create a TodoWrite checklist: `[ ] SSOT entry consulted` / `[ ] context7 ≥3 phrasings run` / `[ ] file:line for each claim` / `[ ] adversarial counter-prompt run`. Only after all items complete does AI issue the verdict text. Hook can detect verdict-shape output and verify TodoWrite tool was invoked in same turn.
- **Can fire HOT:** yes, but enforcement requires the hook to parse tool call sequence (TodoWrite invocation before verdict-phrase output). This requires PostToolUse or conversation analysis that current hooks don't support natively.
- **Critical weakness (T-think-time-C):** AI can mark `[x]` without doing the work. TodoWrite tool invocation is detectable; checkbox content verification is not mechanical.
- **Harness support verified:** TodoWrite tool is available (confirmed in active session). PostToolUse hook could detect TodoWrite + then scan subsequent output for evidence — but this requires two-hook coordination: PostToolUse(TodoWrite) sets state, Stop hook reads state. Achievable with a state file approach per «Ralph Loop» pattern.

**H5 — MCP server pre-output validator (verdict_gate tool).**
Custom MCP tool `verdict_gate(verdict: string, evidence: Evidence[])` that AI MUST call before issuing verdict-shape text. Server runs deterministic checks: SSOT lookup (`grep -n "| N |" prior-art-evaluations.md`), evidence citation existence check, file:line validity. Returns OK/REVISE with specific failure reasons.
- **Can fire HOT:** yes — tool call happens before AI writes verdict prose.
- **Harness support:** MCP is supported. Building a custom MCP server is within scope (no new dep; it would be project-local).
- **Critical weakness:** AI can simply choose not to call the tool before issuing verdict text. No harness mechanism forces a specific tool call before specific text output. Without a blocking gate, this is behavioural (relies on instruction compliance).
- **Evidence on MCP ecosystem:** DeepWiki search on `modelcontextprotocol/servers` found NO output-validation or recommendation-pre-validator MCP servers. The ecosystem provides input validation schemas (Zod) per tool definitions, not output linters that operate on AI responses. WebSearch for «recommendation pre-validator MCP» also found nothing matching.
- **SSOT check:** MCP is not a new capability (Claude Code harness already supports MCP); new MCP server would be capability commit but research-patch-only now.

**H6 — Multi-pass output / explicit re-read discipline (visible second pass).**
AI required to: (1) write recommendation draft inline; (2) explicitly re-read draft through a checklist as visible second-pass output (numbered steps: «re-check 1: SSOT entry?», «re-check 2: context7 ≥3 phrasings?», «re-check 3: file:line for each claim?», «re-check 4: adversarial counter?»); (3) revise or confirm. Like Claude's extended thinking but as visible output, checkable by maintainer.
- **Can fire HOT:** yes — this is a behavioural pattern encoded in prompt instruction (H1 extension), not a harness gate.
- **Advantage:** visible second-pass output creates an accountability trail maintainer can read. Even if AI shortcuts the step, maintainer can see the shortcut.
- **Critical weakness:** AI may abbreviate second pass («all checks pass» without actually running them). This is the same `#discipline-theatre` pattern at the recommendation level.
- **Implementation:** H1 extension — UserPromptSubmit hook adds «For each ADOPT/DEFER/RECOMMEND: output a visible «Evidence block:» section first, THEN the verdict» instruction. Verdict without Evidence block → reviewer can flag.

**H7 — Confidence calibration discipline (verbal hedge ban).**
Verbal hedging without mechanical evidence is flagged. In-turn: «probably», «likely», «I think», «I believe», «I'd suggest» in a verdict context → hook requires AI to replace with predicate («7/20 surfaces verified mechanically; calibration: NONE — first run»). Maps T6 from [`ai-laziness-traps.md §2`](../../../.claude/rules/ai-laziness-traps.md) to dialogue scope not just R-phase output.
- **Can fire HOT:** only via H2 (Stop hook post-turn scan) or H1 (prompt injection). Neither fires mid-turn.
- **Value:** raises precision of AI outputs that do ship, calibrates overconfidence signals for maintainer review. Does not prevent wrong verdicts, only mislabelled ones.
- **Critical weakness:** AI can state hedged claim without trigger words: «Based on the available evidence, Danger JS appears unsuitable because…» — no hedge trigger, still wrong.

**H8 — Pre-output sentinel scan (sub-agent reviewer).**
Reviewer sub-agent automatically scans AI output BEFORE it reaches maintainer. Sub-agent reads transcript, detects verdict-without-evidence shapes, returns «REVISE» with specific deficit. Parallel to generation if harness supports streaming intercept; sequential if post-generation pre-display.
- **Can fire HOT:** DEPENDS. DeepWiki found `Elicitation` and `ElicitationResult` hook events that «intercept and override responses before they're sent back to the user» — this is the intercept mechanism. However: these are not standard hooks in `.claude/settings.json` and their availability/stability is uncertain (only mentioned in CHANGELOG entries per DeepWiki anthropics/claude-code). Further verification needed via Anthropic docs if this is production API.
- **Sub-agent coordination pattern:** `SubagentStop` hook fires when a subagent completes. Main session could spawn a sub-agent to review its own output on each verdict turn. This is architecturally complex and adds latency.
- **Prior art:** [`agents/compliance-verifier.md`](../../../agents/compliance-verifier.md) is an AI-agnostic sub-agent pattern precedent. The compliance-verifier is currently manual-invocation. Automating its invocation per-verdict is the H8 shape.
- **No-paid-LLM-in-CI constraint:** sub-agent runs in active session (subscription-bundled), not in CI. H8 is policy-compliant if invoked session-side.
- **Critical weakness:** sub-agent-class reviewer has the same model-class bias risk (same failure modes). Per [`.claude/rules/reviewer-discipline.md`](../../../.claude/rules/reviewer-discipline.md): reviewer of same class = «second orchestrator» risk.

**H9 — Adversarial counter-prompt requirement inline.**
Every recommendation includes a mandatory «What would make this wrong?» section with a mechanical falsification check before the verdict finalises. Hook detects verdict-shape output and expects an adversarial section in the same turn; flags if absent. Shape: §1.7 Forward-check but scoped to single utterance.
- **Can fire HOT:** via H2 (Stop hook post-turn) scanning for presence of the adversarial section. H2 weakness applies: only fires at session end, not mid-turn.
- **Advantage:** forces adversarial framing at the moment of recommendation issuance. Even if AI performs it imperfectly, the explicit adversarial section is visible to maintainer and creates friction on shortcuts.
- **Implementation:** H1 extension (prompt injection instructs AI to include «Falsification:» block before any verdict) + H2 scan for «Falsification:» presence in Stop hook.

---

### Adversarially-enumerated mechanisms beyond kickoff list (T-think-time-A counter)

The kickoff H1-H9 + W1-W4 is floor not ceiling. Running adversarial counter-prompt: «what mechanism shape did I miss?»

**H10 — Tool-call-as-gate (verdict is a tool call, not prose).**
Redesign the interaction contract: AI cannot issue a ADOPT/DEFER verdict as free-form text. Instead, the verdict must be a call to a structured tool: `issue_verdict(type: "ADOPT"|"DEFER"|"RECOMMEND", candidate: string, ssot_id: number|null, evidence: Evidence[], adversarial_falsification: string)`. Tool parameters enforce mandatory fields. Missing `ssot_id` → tool call fails validation. Empty `adversarial_falsification` → tool call fails. Verdict prose is generated FROM the tool call output, not pre-tool.
- **Mechanism shape:** tool schema as contract, not prose convention.
- **Key advantage over H1/H6:** the tool parameters ARE the evidence checklist. AI cannot submit the tool call without populating them. Prose shortcutting is structurally prevented — the tool won't accept an empty SSOT field.
- **Harness support:** Claude Code has tool-use capability. Custom MCP tool with required parameters is achievable. No harness magic needed for the gate — the tool's Zod schema enforces it.
- **Critical weakness:** AI could populate `evidence` with fabricated file:line citations that look valid but aren't. The gate enforces structure, not truthfulness. A second-pass verification hook (similar to H2) would need to spot-check the evidence fields against the filesystem.
- **SSOT check:** this is a HOT mechanism with no prior art in the ecosystem search. No production «verdict-as-tool-call» pattern found in context7, DeepWiki, or WebSearch. Would be a project-BUILD capability.

**H11 — Behavioural eval suite as regression test.**
Before any model version bump or prompt engineering change, run a «recommendation discipline eval»: a fixed test battery of scenarios known to trigger `#recommendation-skips-own-discipline` (include the 5 from 2026-05-13 session + historical PR #16 shape + defer-until-consumer-pain shape). Eval passes if AI applies build-vs-reuse SSOT consultation, cites evidence, runs adversarial counter. Fails if AI produces confident-wrong output.
- **Mechanism shape:** test-suite not dialogue-time gate. This is WARM/COLD classification.
- **Key advantage:** deterministic regression test. Model version change that degrades recommendation discipline is caught before deployment, not after.
- **Harness support:** can use `claude -p` headless invocation (window valid until ~2026-06-16 per memory entry; would need architectural planning post-window). Alternatively, static prompt scenarios run by maintainer with documented expected outputs.
- **No-paid-LLM-in-CI:** the eval requires LLM invocation but can run session-side (subscription-bundled), not in CI. The LLM-as-judge step is the active session reading the outputs.
- **SSOT check:** Stryker (#39) is the mutation-testing analog for code. H11 is «Stryker for recommendations» — same conceptual shape, different surface. No production equivalent found for recommendation-discipline eval.

---

### WARM/COLD class — fires at commit-time or post-merge

**W1 — Recommendation-anchored §1.7 gate (remove research-patches allowlist for recommendation-bearing patches).**
Currently `S17_ALLOWLIST_RE` in [`.husky/pre-push:309`](../../../.husky/pre-push) matches `docs\(research-patches\)` commits and exempts them from §1.7. Remove exemption for patches declaring `## Verdict:` / `## Recommendation:` / `ADOPT`/`DEFER` with rationale. These become discipline-introducing commits requiring §1.7 trailer.
- **Coverage:** catches recommendations that survive to a commit without evidence.
- **Gap remaining:** recommendations that influence the session but are NOT committed (verbal advice accepted and acted on without a research-patch) are still uncovered.

**W2 — Compliance-verifier expansion to research-patch §6 decisions.**
[`agents/compliance-verifier.md`](../../../agents/compliance-verifier.md) currently scoped to PR-description §1.7 review. Extend scope to include «review §6 decisions / recommendations in research-patches — verify each ADOPT/DEFER/RECOMMEND has file:line citation or SSOT row reference».
- **Coverage:** catches recommendations in committed patches that lack evidence.
- **Gap remaining:** same as W1 — verbal dialogue recommendations not committed.

**W3 — Two-AI session discipline (different model or fresh session reviews recommendations before maintainer accepts).**
A separate fresh session (or different vendor model) reviews load-bearing recommendations before maintainer acts on them. Catches same-session bias (AI defending its own prior output across turns 3-5 as in 2026-05-13 incident).
- **Coverage:** directly addresses the 4-turn defence pattern — fresh session has no prior commitment to the DEFER verdict.
- **Harness support:** `SubagentStop` hook available; subagent pattern established. Session isolation (worktree isolation discipline per [`.claude/rules/parallel-subwave-isolation.md`](../../../.claude/rules/parallel-subwave-isolation.md)) removes same-session bias.
- **Prior art:** SSOT #28 (AIF Handoff `paused:true`) — machine-readable pause-for-review primitive. T16 check: AIF Handoff `paused:true` is for workflow state transitions (S1×P5 ORT), not mid-dialogue recommendation review. Problem class mismatch — different granularity. W3 is own-build shape.
- **Critical weakness (reviewer-discipline rule):** reviewer session of same model class reviewing same session's output risks `#reviewer-as-secondary-orchestrator` pattern per [`.claude/rules/reviewer-discipline.md §3`](../../../.claude/rules/reviewer-discipline.md).

**W4 — Maintainer-facing review protocol (friction-based).**
Maintainer checklist: «before accepting AI recommendation: (1) did AI state which SSOT entry it consulted? (2) did AI run context7? (3) are all counts mechanically verified?». Shifts gate to human. Not mechanical.
- **Coverage:** highest coverage if maintainer applies it rigorously. Also the highest friction.
- **Value:** complements mechanical gates; mandatory for the blind spot where all HOT mechanisms fail.

---

## §5 Prior art

### §5.1 SSOT consultation (build-vs-reuse gate, applied before proposing any mechanism)

Relevant SSOT entries:

| SSOT row | Candidate | Verdict | Relevance to HOT mechanisms |
|---|---|---|---|
| [#20](../prior-art-evaluations.md#L88) | Claude Code hooks API | ADOPT | All HOT mechanisms using Stop/UserPromptSubmit/PreToolUse hooks build on adopted surface. No new dep. |
| [#28](../prior-art-evaluations.md#L96) | AIF Handoff `paused:true` | DEFER | W3 (two-AI review) shares shape — but T16 problem-class check: AIF `paused:true` is workflow-state-level (record MCP call), not dialogue-recommendation-level. Upstream problem class: external-system integration pause. Our problem class: mid-dialogue verdict validation. MISMATCH — W3 is own-build. |
| [#38](../prior-art-evaluations.md#L106) | CodeRabbit | DEFER | H8 (sub-agent reviewer) shares shape — LLM-driven review of AI output. Blocked by no-paid-LLM-in-CI for CI side; but H8 is session-side. T16 check: CodeRabbit reviews PR descriptions, not dialogue recommendations. Problem class mismatch. |
| [#41](../prior-art-evaluations.md#L109) | Danger JS | ADOPT | W1/W2 shapes (commit-time gate) could use Danger as substrate. But HOT mechanisms are all pre-commit and don't fit Danger's PR-time scope. |

**No SSOT entry covers:** dialogue-time recommendation gating, «verdict-as-tool-call» pattern (H10), behavioural eval suite for recommendation discipline (H11). These would be new entries if implemented.

**Proposed SSOT entries (research-only — propose for maintainer decision, do NOT add to SSOT directly):**

- **Entry #49 candidate:** `Constitutional AI self-critique pattern (Anthropic, 2022+)` — Self-critique and revision mechanism. Capability matched: AI self-verification of its own output against principles before finalising. Verdict candidate: ADOPT VOCABULARY — the pattern name and mechanism are well-known; project already implements a version via H1 (prompt injection). The CAI framework is the production-grade vocabulary. T16 check: CAI problem class = harmlessness alignment; our problem class = recommendation-discipline compliance. Partial match on the self-critique mechanism shape; full match on «revise before output» paradigm.
- **Entry #50 candidate:** `Behavioural eval suite (H11)` — No prior art found (own-build shape). Would be new SSOT entry with REJECT existing tools + own-build verdict.

### §5.2 Claude Code harness deep-dive

**Research via context7 `/anthropics/claude-code` + deepwiki `ask_question("anthropics/claude-code", ...)` + WebSearch:**

**Hook events and capabilities (verified):**

| Hook event | Can it fire HOT? | What it receives | What it can do |
|---|---|---|---|
| `UserPromptSubmit` | Yes — fires on every user prompt | Prompt content | Inject `additionalContext` into next AI turn; block prompt (exit 2) |
| `Stop` | Partial — fires when AI finishes task (not each turn) | `last_assistant_message` (full text) | Return `{"decision": "block", "reason": "...", "systemMessage": "..."}` to inject context and continue; or `approve` to terminate |
| `PreToolUse` | Yes — fires before each tool call | Tool name + input | Block tool (exit 2); return `{"decision": "block"}`; inject stderr feedback |
| `PostToolUse` | Yes — fires after each tool call | Tool name + output | Replace tool output via `hookSpecificOutput.updatedToolOutput` |
| `SubagentStop` | Subagent-level — fires when subagent completes | `agent_id`, `agent_transcript_path` | Inspect subagent output; integrate results |
| `PreCompact` | Session maintenance — fires before compaction | Context stats | Block compaction (exit 2) |
| `SessionStart` | Yes — once per session start | Session context | Inject initial context (used by «Explanatory Output Style Plugin» example) |
| `Elicitation`/`ElicitationResult` | INAPPLICABLE for this use case | MCP server elicitation dialog responses | MCP server elicitation flow only — fires when an MCP server requests structured user input mid-task (e.g. form fields, browser URL); `ElicitationResult` intercepts the user's response to that dialog before it goes back to the MCP server. Does NOT intercept general assistant output before display. Verified: DeepWiki `ask_question("anthropics/claude-code", "What is the Elicitation hook?")` — «specifically designed for MCP server elicitation dialogs, not for general assistant output interception» (<https://deepwiki.com/search/what-is-the-elicitation-hook-w_39834267-9ed1-402b-b286-ce79d1fbcd04>). |

**Key architectural finding:** There is NO hook that fires **after each AI turn mid-conversation** (before AI output reaches user). The `Stop` hook fires at session completion, not at turn completion. For a continuous multi-turn conversation:
- Turn 1: UserPromptSubmit → [hook A: session-bootstrap] → AI responds → NO hook fires on AI response
- Turn 2: UserPromptSubmit → [hook A again] → AI responds → NO hook fires
- Session end: Stop hook fires — but if maintainer accepted AI verdict in Turn 1, it's already in their working model

**Critical implication for H2:** Stop hook post-turn scan works only if the recommendation is the FINAL message of the session. In a 5-recommendation session, 4 of the 5 failures would not be caught.

**Stop hook prompt-based form (verified via context7):**
```json
{
  "Stop": [{
    "matcher": "*",
    "hooks": [{
      "type": "prompt",
      "prompt": "Review the full transcript at $TRANSCRIPT_PATH. Check if any ADOPT/DEFER/RECOMMEND verdict was issued without accompanying SSOT entry citation and file:line evidence. If found, block with specific deficit."
    }]
  }]
}
```
This is the strongest harness-supported HOT-adjacent mechanism. However: fires at session end, not per-verdict. Prompt-type Stop hook = LLM invocation on session-side subscription (no-paid-LLM-in-CI policy compliant).

**Elicitation hook investigation:** `Elicitation` and `ElicitationResult` hooks are verified as MCP server elicitation dialog hooks — they fire when an MCP server requests structured user input mid-task (form fields, browser URL) and intercept the user's response before it goes back to the MCP server. **Scope is MCP-dialog-only; these hooks do NOT intercept general assistant output before it reaches the user.** Verified via DeepWiki `ask_question("anthropics/claude-code", "What is the Elicitation hook? When does it fire? Is it for MCP server elicitation dialogs or general assistant output interception?")`: «specifically designed for MCP server elicitation dialogs, not for general assistant output interception» (<https://deepwiki.com/search/what-is-the-elicitation-hook-w_39834267-9ed1-402b-b286-ce79d1fbcd04>). **INAPPLICABLE for think-time gate use case.** H8 (pre-output sentinel scan) cannot be achieved via Elicitation hook regardless of its stability.

### §5.3 MCP ecosystem

**Research via deepwiki `ask_question("modelcontextprotocol/servers", ...)` + WebSearch:**

**Finding:** No «recommendation pre-validator», «output linter», or «verdict gate» MCP server exists in the ecosystem. MCP servers implement input validation via Zod schemas at tool-definition level (per DeepWiki) but do not operate as middleware interceptors on AI responses. The closest found:
- `mcp_reviewer` (jaggederest/mcp_reviewer) — MCP server providing code review tools for AI coding agents; not a recommendation validator.
- `vibecop` — AI code quality toolkit as MCP; scans code, not AI output prose.
- `mcp-validator` (Janix-ai) — validates MCP server implementations against protocol spec; not output validation.

**Conclusion:** No production «recommendation pre-validator» MCP exists. H5 (MCP tool gate) would require own-build.

### §5.4 AI self-monitoring literature

**Research via WebSearch «LLM self-verification mid-output», «two-AI inline review», «LLM self-critique pre-output»:**

**Constitutional AI (Anthropic, 2022+):** The self-critique-and-revise paradigm is documented. Core pattern: (1) AI generates draft; (2) AI critiques draft against principle; (3) AI revises. Closest academic pattern to H6 (multi-pass output). In production: Anthropic uses it for harmlessness; project could use it for recommendation-discipline compliance. Pattern is vocabulary-level — no external tool to adopt, it is a prompting strategy.

**Agent evaluation (2026 landscape):** Adaline, Maxim, DeepEval, LangSmith all provide offline eval + online monitoring with span-level visibility. Key finding from Adaline: «platforms that only score the final output miss the 90% of failure modes that happen mid-execution». This validates H11 (behavioural eval suite) as a gap the literature recognizes.

**Two-AI inline review:** No production pattern found for turn-by-turn AI output review in a Claude Code session context. The closest is «LLM-as-judge» in eval frameworks (offline) or multi-agent pipelines (Autogen, CrewAI). These are architectural patterns different from the dialogue-time gate needed here.

**Self-verification mid-output:** Research found sequential thinking patterns (Anthropic's extended thinking, chain-of-thought) as related but different — they verify reasoning correctness, not discipline compliance. No production «verdict validator» tool before AI output is displayed found.

### §5.5 AIF / Cline / Codex patterns

**Research via deepwiki `ask_question("cline/cline", ...)` for Memory Bank and context injection:**

**Cline Memory Bank re-read architecture:** Memory Bank is read at task start (not per-output). Dynamic context injection mid-conversation uses Cline's Hooks system: `contextModification` field returned by a hook is injected into the next API request as `<hook_context>` XML in `userMessageContent`. This is analogous to Claude Code's `additionalContext` in UserPromptSubmit hooks. **Cline's hook events do NOT include an after-assistant-turn event.** The hooks are: `TaskStart`, `TaskResume`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreCompact`, `TaskComplete`, `TaskCancel`.

**Implication:** Cline's architecture has the same structural limitation — no after-assistant-turn injection. The Memory Bank fires at task start, not after each AI recommendation. Cline does not solve the think-time gap either.

**Codex AGENTS.override.md escape hatch (SSOT #15):** T16 check — Codex escape hatch is a wholesale-replacement primitive for AI-doc files, not a dialogue-time recommendation gate. Problem class mismatch. Not applicable to HOT mechanism design.

---

## §6 Open questions for maintainer (Q1-Q3)

> **Note:** These are decision-points, not recommendations. §7 provides the research-grounded recommendation for scope placement only.

### Q1 — Empirical validation: does H1 extension change behaviour?

H1 (UserPromptSubmit hook extension adding recommendation-specific instruction) is cheapest to implement. But the 2026-05-13 session empirically shows that injecting goal/invariants at session-start was insufficient to prevent 5 wrong recommendations. Before investing in any HOT mechanism, the maintainer needs to decide:

**Options:**
- (a) Accept that H1 extension (more explicit recommendation instruction) is a worthwhile attempt despite known session-start-injection insufficiency, and ship it as a cheap interim mitigation.
- (b) Skip H1 extension — if text-in-context doesn't work for goal/invariants, it won't work for recommendation-specific instructions either. Move directly to structural mechanisms (H10 tool-call-as-gate, W-class).
- (c) Run a structured empirical comparison: same recommendation scenario, with vs. without H1 extension, over ≥5 sessions. Only adopt H1 if rate of `#recommendation-skips-own-discipline` drops.

**Maintainer must decide Q1.** Research cannot determine whether more specific prompt injection changes AI behaviour without empirical test. The failure mode is well-documented but the causal mechanism (insufficient instruction specificity vs. fundamental cognitive limitation of text-in-context) is uncertain.

### Q2 — HOT mechanism priority: H10 (tool-call-as-gate) vs H2+H9 (Stop hook combination)

H10 (verdict as tool call with required SSOT + evidence parameters) is architecturally the strongest HOT mechanism because it enforces structure at call-time, not via post-hoc scanning. But it requires building a custom MCP server and restructuring recommendation dialogue flow. H2+H9 (Stop hook scanning for verdict-shape phrases + adversarial section presence) is weaker (fires at session end, keyword-bypassable) but cheaper.

**Decision-point:** is the think-time gap severe enough to warrant H10-class investment (significant architectural change: custom MCP server, new interaction contract for verdicts), or is H2+H9 sufficient as a lighter gate?

**Sub-question Q2.1 (retracted):** Prior version asked maintainer to verify `Elicitation`/`ElicitationResult` hook stability. That question is now moot: verified via DeepWiki (iter 1 fix) that these hooks are MCP-server-elicitation-dialog-only — they intercept user input going back to an MCP server, not general assistant output before display. H8 via Elicitation hook is **INAPPLICABLE** regardless of stability. The relevant open sub-question for Q2 is instead: given that no harness hook provides true mid-turn output interception, is H10 (tool-call-as-gate) worth the architectural investment over accepting H1 (injection-only) as the ceiling of HOT mitigation?

### Q3 — Scope placement (see also §7 recommendation)

Which umbrella owns the implementation work that closes this gap?

- **(a) Wave 9.x interim** — ship H1 extension as cheap mitigation now. Deferred to Wave 10/11 for structural (H10/W1) work.
- **(b) Wave 10 inline** — think-time gate is natural scope for Wave 10 hook architecture research ([`.claude/orchestrator-prompts/wave-10-hook-architecture/kickoff.md`](../../../.claude/orchestrator-prompts/wave-10-hook-architecture/kickoff.md)). Blocked until Wave 9 M1-M5 resolved.
- **(c) New §13.34 umbrella** — if think-time gap is treated as a distinct, urgent discipline improvement warranting its own umbrella.
- **(d) Accept gap permanently** — no HOT mechanism is architecturally enforceable (all have critical weaknesses documented above); accept W4 (maintainer checklist) as the only viable gate. Document the gap as «no mechanical HOT solution» and close.

---

## §7 Recommended scope placement

**Recommendation (rationale, NOT decision):**

**Primary:** H1 extension (cheap) now + H10 scoping into Wave 10 + W1 (remove research-patches allowlist for recommendation-bearing patches) as intermediate gate.

### §7.1 Rationale

**H1 extension now:** Even if session-start injection proved insufficient for goal/invariants, a more specific recommendation-discipline instruction (naming the exact steps: «state SSOT row, run context7, cite file:line, run adversarial counter») adds friction at the right moment. The 2026-05-13 session injected generic goal/invariants — the specific instruction to run the 4 verification steps before each verdict was not injected. The gap may be specificity, not text-in-context as a mechanism. Cost: one additional line in [`.claude/hooks/inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh). Risk: if ineffective, no harm done.

**H10 in Wave 10:** Verdict-as-tool-call (H10) is architecturally the strongest HOT mechanism because it enforces structure at call-time. But it requires: (1) custom MCP server with `issue_verdict` tool; (2) restructuring recommendation dialogue protocol; (3) test coverage for the MCP server. This is Wave 10-scale work, fits naturally with the TS-core migration scope in [`.claude/orchestrator-prompts/wave-10-hook-architecture/kickoff.md`](../../../.claude/orchestrator-prompts/wave-10-hook-architecture/kickoff.md).

**W1 now (remove recommendation-bearing research-patch allowlist):** Implementation: modify `S17_ALLOWLIST_RE` in [`.husky/pre-push:309`](../../../.husky/pre-push) to exclude patches containing `## Verdict:` or `## Recommendation:` section headers. Research-patches with recommendations become discipline-introducing commits requiring §1.7 trailer. This closes the WARM gap (commit-time) and creates momentum for the HOT gap closure.

### §7.2 Why not W3 (two-AI session discipline) as primary

W3 (fresh session reviews recommendations before maintainer accepts) addresses the most critical failure mode (same-session bias across 4 turns) but creates `#reviewer-as-secondary-orchestrator` risk per [`.claude/rules/reviewer-discipline.md`](../../../.claude/rules/reviewer-discipline.md). The reviewer session still faces the same model-class failure modes. Same-model review of same-model output is unreliable — verified by the 2026-05-09 L3 research incident where reviewer-cycle reinforced wrong goal rather than catching it.

### §7.3 Why not declare mechanical HOT gate impossible

The `Elicitation`/`ElicitationResult` hook does NOT provide true mid-turn general output interception — verified as MCP-dialog-only (see §5.2 and iter-1 fix). With Elicitation off the table, the harness has no hook that fires after each AI turn mid-conversation before the response reaches the user. This is a structural constraint confirmed across Claude Code and Cline (§5.5).

**However, declaring «no HOT gate possible» is still premature** because two harness-supported HOT mechanisms remain viable without requiring an after-turn hook:

- **H1 (UserPromptSubmit injection extension):** fires before each user prompt; while text-in-context did not prevent 5 failures empirically, a more specific instruction targeting the exact verification steps (SSOT row, context7 phrasings, file:line, adversarial counter) has not been tested. The failure mode's causal mechanism (instruction insufficiency vs. fundamental cognitive limitation) is unresolved — empirical test is needed before closing.
- **H10 (verdict-as-tool-call):** fires at tool-call-time; enforces SSOT + evidence as required schema fields; prose shortcutting is structurally prevented because the verdict IS the tool call output. The gate enforces structure at call-time without requiring an after-turn hook.

The H1+H10+W1 recommendation bundle rests on these two mechanisms, not on Elicitation. The rationale for not declaring HOT gate impossible is H1's unresolved empirical question (Q1) and H10's genuine structural enforcement property — not any after-turn interception capability.

### §7.4 Confidence calibration

This §7 recommendation is MEDIUM confidence. Specific weakness: empirical question Q1 (does H1 extension change behaviour?) is unanswered. The recommendation to ship H1 extension first is a reasonable bet, not a verified finding. Maintainer should treat H1 extension as a controlled experiment, not a fix.

---

## §8 §1.7 self-application — CRITICAL META-RECURSIVE

This research-patch makes recommendations about how to gate recommendations. It is itself a recommendation-producing artefact. Per T-think-time-B: §8 must enumerate **specific forward+backward checks performed for the recommendations in §4/§7**, not just declare compliance.

### §8.1 Claims in this patch and their verifications

| Claim | Verification method | Result |
|---|---|---|
| «session-bootstrap hook injects Goal + Invariants» | Read [`inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh) + execute | ✓ Verified: `bash .claude/hooks/inject-session-bootstrap.sh` emits the digest |
| «Stop hook fires at session end, not per-turn» | WebSearch + DeepWiki `ask_question("anthropics/claude-code", ...)` | ✓ Confirmed: «Stop hook only fires when session terminates; when Claude finishes a turn mid-conversation, no hook fires» (claude-code issues #29881 + claudefa.st documentation) |
| «Stop hook receives `last_assistant_message`» | DeepWiki anthropics/claude-code + WebSearch code.claude.com/docs/en/hooks | ✓ Confirmed: Stop hook input includes `last_assistant_message` field (full text) |
| «Stop hook can return `{"decision":"block","systemMessage":"..."}` to inject context and continue» | context7 `/anthropics/claude-code` — Stop hook APIDOC section | ✓ Confirmed: decision=block with systemMessage is supported |
| «S17_ALLOWLIST_RE matches docs(research-patches)»  | Read [`.husky/pre-push:309`](../../../.husky/pre-push) | ✓ Verified: `S17_ALLOWLIST_RE='^(docs\(research-patches\)\|chore\(snapshot-regen\)\|chore\(prior-art-update\)):'` |
| «No recommendation pre-validator MCP exists» | DeepWiki `ask_question("modelcontextprotocol/servers", ...)` + WebSearch | ✓ Confirmed: no such server found; MCP ecosystem provides input schema validation only |
| «Cline hooks do not include after-assistant-turn event» | DeepWiki `ask_question("cline/cline", ...)` | ✓ Confirmed: hook events listed are TaskStart/TaskResume/UserPromptSubmit/PreToolUse/PostToolUse/PreCompact/TaskComplete/TaskCancel — no after-assistant-turn hook |
| «self-reflection skill trigger is user-side only» | Read [`.claude/skills/self-reflection/SKILL.md:3`](../../../.claude/skills/self-reflection/SKILL.md#L3) | ✓ Verified: description field lists user-typed keywords; no AI-output-triggered loading mechanism |
| «SSOT #28 AIF Handoff paused:true is S1×P5 ORT — different problem class from W3» | Read [prior-art-evaluations.md #28](../prior-art-evaluations.md) — «S1×P5 ORT (different granularities: record-level MCP call vs. session-level discipline)» | ✓ Verified: SSOT entry explicitly states the ORT; T16 check passed |
| «research-patches directory allowlisted in §1.7 gate at pre-push hook level» | Read [`.husky/pre-push:309`](../../../.husky/pre-push) (offset 295-332) | ✓ Verified: allowlist RE present; docs(research-patches) commits skip §1.7 gate |

**Iter-1 correction (INAPPLICABLE, previously INCONCLUSIVE):**
- **Elicitation/ElicitationResult hook scope:** iter 0 framed this as INCONCLUSIVE-needs-verification on stability. Iter 1 verification via DeepWiki confirms the hook is MCP-server-elicitation-dialog-only — fires when an MCP server requests structured user input mid-task; intercepts the user's dialog response before it goes back to the MCP server. Does NOT intercept general assistant output. **Tag: INAPPLICABLE-verified-not-relevant** for the think-time gate use case. H8 (pre-output sentinel scan via Elicitation) is not viable regardless of stability. The INCONCLUSIVE framing in iter 0 was wrong-question framing — stability was not the issue; scope was. Source: DeepWiki `ask_question("anthropics/claude-code", "What is the Elicitation hook?")` (<https://deepwiki.com/search/what-is-the-elicitation-hook-w_39834267-9ed1-402b-b286-ce79d1fbcd04>).

### §8.2 Forward-check: does this patch comply with existing disciplines?

**Code-level R1-R20:** N/A — no TS/JS code changes.

**Principle-level (01-09):** N/A — no enforcement-code changes. Principle 09 (doc-authority headers): research-patch inherits folder-level authority from [research-patches/README.md](README.md) per [doc-authority-hierarchy.md §2](../../../.claude/rules/doc-authority-hierarchy.md) folder-level convention. Per-file header not required; present anyway as `<!-- scope: -->` annotation.

**Capability commit gate:** research-patch is NOT a capability commit (no new package code, no new dep, no new directory ≥50 LOC). Prior-art escape hatch applies: `Prior-art: skipped — research patch only; mechanism candidates H1-H11 + W1-W4 enumerated for maintainer decision, none adopted`.

**Build-vs-reuse SSOT consulted:** SSOT rows #20, #28, #38, #41 consulted above in §5.1. No new mechanism adopted. H10 and H11 are proposed as OWN-BUILD candidates if maintainer decides to implement — would require new SSOT entries at that time.

**Trigger sweep (§1.6):** `grep -nE "^### 13\." docs/meta-factory/open-questions.md` — not run in this session (research-patch-only scope; no §13.x triggering condition appears in §4/§7 recommendations). Nearest relevant: §13.32 (Phase 10 foundations audit armed, A6 documentation artefacts stream may cross-reference this gap). This patch does not close §13.32; it contributes evidence for stream A6.

**Doc-authority:** this patch inherits folder-level authority. The `<!-- scope:think-time-s17-gate -->` annotation is present per SSOT #29 (AIF annotation pattern, ADAPT verdict).

### §8.3 Backward-check: sweep of artefacts under patch scope

This patch proposes no new rule; it researches a gap and proposes mechanisms for maintainer decision. «Artefacts under scope» = the §1.7 enforcement layers documented in [`.claude/skills/self-reflection/SKILL.md §1.7 enforcement layers`](../../../.claude/skills/self-reflection/SKILL.md).

Complete enumeration of current §1.7 enforcement surfaces:

| Layer | Artefact | Current state | Impact of W1 recommendation |
|---|---|---|---|
| 1 — Rule prose | `.claude/rules/phase-research-coverage.md §1.7` | Not modified | Not modified |
| 2 — Skill auto-trigger | `.claude/skills/self-reflection/SKILL.md` | Not modified | Not modified |
| 3 — CI workflow | `.github/workflows/discipline-self-check.yml` | Not modified | Not modified |
| 4 — Pre-push hook | `.husky/pre-push section 9` | Contains allowlist RE; NOT modified by this patch | W1 recommends modifying `S17_ALLOWLIST_RE` — would be a separate implementation commit with its own §1.7 trailer |
| 5 — CI substance arm | `.github/workflows/discipline-self-check.yml` | Not modified | Not modified |

No artefact is modified in this research-patch. W1 recommendation targets layer 4; H1 recommendation targets [`.claude/hooks/inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh) (outside §1.7 enforcement surface). Both are implementation-phase work, not covered by this patch.

### §8.4 Self-reflexive check (T15 — does this research fall into the trap it researches?)

**T-think-time-B recursive probe:** This patch makes recommendations about recommendation-discipline. Did it itself skip discipline in forming the recommendations?

**§4 recommendations — checking the 3 highest-stakes claims:**

1. **«H1 extension (more specific recommendation instruction) may be more effective than generic goal/invariant injection»** — Evidence: 2026-05-13 session received generic injection and still produced 5 failures (verified in parent patch §6.7). Counter: no empirical evidence that *specific* instruction works better. Claim hedged as Q1 open question in §6, not asserted as fact. **Discipline applied.**

2. **«H10 (tool-call-as-gate) is architecturally strongest HOT mechanism»** — Evidence: tool schema enforces required parameters; structure enforced at call-time; prose shortcutting structurally prevented. Counter evidence cited: AI can populate evidence fields with fabricated citations. The claim is mechanically grounded, weakness documented. **Discipline applied.**

3. **«W3 (two-AI review) is unreliable because of model-class reviewer bias»** — Evidence: cited [`.claude/rules/reviewer-discipline.md §3`](../../../.claude/rules/reviewer-discipline.md) `#reviewer-as-secondary-orchestrator` anti-pattern + 2026-05-09 incident where reviewer-cycle reinforced wrong goal. T16 check: reviewer-discipline rule problem class = role-swap-mid-session (reviewer makes strategy decisions). Our W3 failure mode = same-model-class reviewing recommendation quality. Problem classes partially overlap (both involve reviewer bias) but differ in failure mode shape. The citation supports the concern but is not a perfect match. **Partially verified; tagged as INCONCLUSIVE-needs-further-research.**

**§7 recommendation — checking the strongest claim:**

**«H1 extension now is recommended»** — Evidence: cheap (one line), reversible, adds specificity missing from current injection. Weakness: Q1 empirical uncertainty acknowledged in §6 and §7.4. Recommendation hedged as «controlled experiment, not a fix». **Discipline applied; not overstated.**

### §8.5 Iter-1 meta-recursive note (§1.7-style forward correction)

The iter 0 → iter 1 cycle is itself an instance of the discipline this patch researches: a wrong claim (Elicitation hook as general output interceptor) was issued in iter 0, caught by the reviewer in iter 1, and corrected via surgical rewrite of §5.2/§6 Q2.1/§7.3/§8.1. This is the think-time-gate discipline applied to its own research artifact — the reviewer acted as the HOT-adjacent gate (W3/H8 shape) that caught a wrong characterization before it reached the maintainer as a load-bearing recommendation. The correction did not change the core H1+H10+W1 bundle (rationale-level fix only), which demonstrates that the recommendation discipline (cite, hedge, separate claim from rationale) limited the blast radius of the wrong claim.

### §8.6 §1.7 trailer for this patch — recommendation

Per kickoff §6.7 and [parent patch](2026-05-13-pr-body-s17-substance-gap.md): research-patches are allowlisted (double zero-gate). Should §1.7 trailer be added voluntarily?

**Recommendation (not decision):** YES, add voluntarily. This patch has §4 and §7 recommendations that are structurally equivalent to rule-introduction in impact (they will influence whether the project adds a new gate mechanism). The double zero-gate is exactly the gap this patch researches. Adding §1.7 trailer voluntarily is self-aware partial mitigation — it demonstrates the discipline the patch advocates, and it creates a mechanical evidence trail.

Proposed trailer: `§1.7: forward+backward checks performed in §8. HOT mechanisms H1-H11 evaluated against harness capabilities (§5.2 verified). No mechanism adopted — research-patch only. Backward sweep: §8.3 enumerates 5 §1.7 enforcement layers; none modified.`

---

## See also

- ⚠ Erratum 2026-05-16 — see [2026-05-16-think-time-s17-gate-correction.md](2026-05-16-think-time-s17-gate-correction.md). H2 vs H10 re-evaluation with corrected Stop semantics deferred to implementation moment (Phase 11+).
- [`.claude/rules/phase-research-coverage.md §1.7`](../../../.claude/rules/phase-research-coverage.md) — authoritative §1.7 discipline rule.
- [`.claude/rules/phase-research-coverage.md §4`](../../../.claude/rules/phase-research-coverage.md) — anti-pattern catalogue; `#discipline-application-scope-blindness` (H8 sub-case (c)) + `#recommendation-skips-own-discipline`.
- [`.claude/rules/ai-laziness-traps.md §2`](../../../.claude/rules/ai-laziness-traps.md) — T1, T3, T6, T7, T11, T15, T16 + domain-specific T-think-time-A/B/C.
- [`.claude/rules/reviewer-discipline.md`](../../../.claude/rules/reviewer-discipline.md) — W3 (two-AI review) anti-pattern reference.
- [`.claude/skills/self-reflection/SKILL.md`](../../../.claude/skills/self-reflection/SKILL.md) — self-reflection skill + §1.7 enforcement layers table.
- [`agents/compliance-verifier.md`](../../../agents/compliance-verifier.md) — AI-agnostic sub-agent; H8 predecessor pattern.
- [`.claude/hooks/inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh) — H1 extension target.
- [`.husky/pre-push:309`](../../../.husky/pre-push) — S17_ALLOWLIST_RE; W1 modification target.
- [docs/meta-factory/research-patches/2026-05-13-pr-body-s17-substance-gap.md §6.7](2026-05-13-pr-body-s17-substance-gap.md) — parent patch; meta-observation origin.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT rows #20, #28, #38, #41 consulted.

---

## Tags

`#recommendation-skips-own-discipline` `#discipline-application-scope-blindness` `#think-time-gap` `#temporal-scope` `#hot-vs-cold-gate` `#recursive-self-application-gap`
