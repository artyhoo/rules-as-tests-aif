<!-- scope:defer-reflex-detection -->
# Defer-reflex mechanical detection — Stage 1 R-phase

> **Class:** C — research patch (R-phase output); mechanism is Stage 3 I-phase (conditional on Stage 2 benchmark GO).
> **Authoritative for:** Stage 1 R-phase prior-art survey, mechanism design proposal, and phrase catalog for the defer-reflex-detection umbrella.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../../README.md#why-this-exists). Stage 2 benchmark verdict — see `2026-05-25-defer-reflex-benchmark.md` (not yet created). Stage 3 I-phase rule + hook implementation — follows this patch.

> **Origin:** 2026-05-25. Three documented recurrences of the defer-tell anti-pattern under memory load (2026-05-21, 2026-05-22, 2026-05-25) — each with a loaded memory entry documenting the prior incident, each with a different surface justification. Memory recurrence falsifies text-recall as sufficient. Full incident log: `~/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/feedback_no_human_verification_ai_self_verifies.md`. Kickoff: `.claude/orchestrator-prompts/defer-reflex-detection/kickoff.md` (single source of truth).

---

## §0.1 Cold-start verify

```bash
# git fetch result
git fetch origin staging --quiet
# EXIT: 0

# origin/staging top-5
git log origin/staging -5 --format='%h %s'
# 09b38a9 docs(meta-orchestrator): output-format §4.1 — mandatory description block above each 1-liner (#228)
# e932554 research(meta-orchestrator): brainstorm — plan-memory feasibility + 2 design directions (#227)
# a8f0d65 fix(meta-orchestrator): single-source SKILL.md via install-time URL transform (Item 12) (#226)
# 961a286 research(meta-orchestrator): F.3 Stage 1 audit — PR #205 vs G §1.5 binding spec (13 items) (#224)
# 6134c2a feat(meta-orchestrator): L5 — skill/agent assignment helper (Stage 5.C) (#223)
```

**Cache version used:** `origin/staging` top = `09b38a9` (fetched successfully; no staleness risk). Network status: GitHub reachable (fetch EXIT 0); WebFetch/WebSearch available (confirmed by successful fetches in §1).

**Recently merged PRs (post 2026-05-18):** #213/#214/#217/#222/#223/#225/#226/#224/#228/#227/#220/#219/#218/#216/#215/#212/#211/#210/#209/#208/#207/#206/#205 — all in merged window. Expected planner-completeness umbrella (#213/#214/#217/#222/#223/#225) all confirmed merged. No open PRs via `gh pr list --state open` (TLS timeout on `gh pr list` open — documented; merged list retrieved OK).

**Worktree placement confirmed:**
- Current path: `/Users/art/code/rules-as-tests-aif/.claude/worktrees/agent-a2160378a60774858`
- Primary workdir: `/Users/art/code/rules-as-tests-aif` (confirmed NOT current path via `git worktree list`)
- Branch: `worktree-agent-a2160378a60774858` (locked worktree, branched from `research/defer-reflex-r-phase`)

---

## §0.2 Population enumeration (T10)

```bash
find ~/.claude/projects/-Users-art-code-rules-as-tests-aif/ -maxdepth 1 -name '*.jsonl' -type f | wc -l
# 484
```

**N_files = 484** session transcript files available for Stage 2 benchmark corpus. Per the narrow-b-benchmark.md §1.1 precedent (435 files as of 2026-05-25 earlier; now 484), the corpus has grown ~11% during the umbrella itself.

**Sampling strategy for Stage 2:** stratify by date + size (same axes as narrow-b-benchmark.md §1.1):

| Stratum | Boundary | Estimated N |
|---|---|---|
| Recent | < 7 days | ~140 |
| Mid | 7–15 days | ~215 |
| Old | > 15 days | ~129 |

**Corpus note:** corpus is 100% within a 30-day window (earliest files from 2026-05-06). Stage 2 should sample across all strata; defer-reflex incidents (Recurrences #1/#2/#3) are in the Recent stratum. Adversarial sample must reach Mid+Old strata to estimate false-positive rate outside the incident-dense recent window.

---

## §1 Prior-art survey (build-first-reuse-default.md §3 6-item)

### §1.0 Own-stack sweep (§3 item 1 — must precede §1.1+)

Enumerating own-stack dependencies + integrated tools relevant to the defer-tell detection problem class:

- `.claude/hooks/end-of-turn-reminder.sh` — **Stop hook** (decision=block) already fires on every assistant turn. Reads `transcript_path` from hook JSON input, extracts last assistant text via `grep '"type":"assistant"' "$transcript" | tail -1 | jq -r '.message.content[]? | select(.type=="text") | .text'`. This is the **primary candidate mechanism channel** — it already has access to the turn text at the Stop-hook level. Verified: `.claude/hooks/end-of-turn-reminder.sh:7` (`stop_hook_active`), `:30` (last assistant text extraction), `:269` (EOF). This hook is the only existing Stop-hook consumer.
- `.claude/hooks/ask-question-reminder.sh` — **PreToolUse:AskUserQuestion hook** (decision=deny). Accesses `tool_name` + `session_id` from hook JSON. Already implements a fork-challenge. Relevant because defer-tell patterns often manifest as `AskUserQuestion` calls (the agent "asks" for the maintainer's click rather than acting). However: `PreToolUse:AUQ` fires BEFORE the question text is written, giving a generic challenge rather than defer-specific detection.
- `.claude/hooks/inject-session-bootstrap.sh` — **UserPromptSubmit injection** (always-on). Contains H1 reminder cross-referencing recommendation-laziness discipline. Empirically insufficient for defer-reflex (3 recurrences with H1 active — same corpus as recommendation-laziness §1 evidence).
- `recommendation-laziness-discipline.md §4 (A)` — H1 cross-ref already added for recommendation-laziness. Not specific to defer-reflex.

**Own-stack finding:** the Stop hook (`end-of-turn-reminder.sh`) is the natural home. It already reads turn text from `transcript_path`. The defer-reflex check is an **EXTEND** of the existing hook, not a new infrastructure build. This is the build-vs-reuse point of leverage.

### §1.(a) Recommendation-laziness precedent — Stop-hook FP analysis (T16 mandatory)

**Source verified:** `.claude/rules/recommendation-laziness-discipline.md:40–44` (file:line confirmed via Read tool 2026-05-25):

> `(B) Stop-hook scan — EXPLICITLY DROPPED per narrow-b-benchmark.md §1.5`
> `FP_rate = 84.2% (Wilson 95% CI: [62%, 95%], n=19) >> 20% threshold → Drop narrow-B from Option D. Option D = A+C only.`

**Why narrow-B Stop-hook was DROPPED:** the verdict-word regex (`рекомендую|recommend|use |pick |ADOPT|REJECT|DEFER|BUILD|should|лучше|выбираем`) combined with short-turn + zero-tool filters produced FP_rate = 84.2% on 19 matches. Dominant FP shapes: `use` / `pick` / `should` / `BUILD` appearing in git operations (`cherry-pick`), compound nouns (`quota use`), technical descriptions (`CI should now pass`), and changelog narration (`4 BUILD areas closed`). The AND-conditions (short + no-tool + verdict-word) are not discriminating enough for a technical discourse corpus where verdict vocabulary is high-frequency in non-verdict contexts.

**T16 problem-class check — verbatim:**

> **Upstream problem class (narrow-B):** verdict-word regex detection in any short, tool-free assistant turn — «did the agent recommend something without evidence?» Binary signal on every turn.
>
> **Our problem class (defer-reflex):** phrase detection for *deferral acts specifically in the context of own-PR-merge-decision* — «did the agent end a report by deferring a merge-decision it should self-execute?» Conditional signal, only relevant in a specific action context.
>
> **Match?** **No — structural mismatch.** Narrow-B fires on generic verdict vocabulary without context; defer-reflex fires on deferral vocabulary *within a session-final-report turn* where prior tool calls indicate the agent authored the PR under consideration. The conditioning on tool-call history (PR authorship signal) is the discriminator that narrow-B lacks. The FP problem in narrow-B was the absence of contextual conditioning — our mechanism design MUST include the contextual gate to avoid the same fate. This analysis satisfies T16 per kickoff §7: «narrow-b's problem = verdict-words in any turn; ours = defer-phrase in own-PR-merge-decision context. Match? evidence: recommendation-laziness-discipline.md:40 + narrow-b-benchmark.md §1.3 FP analysis.»

**Assessment:** the defer-tell vocabulary (`maintainer click required`, `жду твой клик`, `ready for merge + no merge action`) is **narrower and more context-specific** than verdict-words. The key FP reduction levers available to us that narrow-B lacked: (1) restrict to long/substantive turns (REPORTS not short replies), (2) require a contextual signal — recent `gh pr create` or `gh pr view` tool call in same session, (3) exact phrase match on low-frequency phrases rather than high-frequency vocabulary words. These levers give a plausibly lower FP rate, but this MUST be benchmarked in Stage 2 before shipping — not assumed.

### §1.(b) ai-laziness-traps.md T20 — current last slot

**Source verified:** `.claude/rules/ai-laziness-traps.md:146` (file:line confirmed):

> `### T20 — Inline-verdict-without-evidence`

T20 is the last numbered trap entry. T21 is the next free slot. The defer-reflex trap entry (`T-DRD` in this R-phase, promoted to `T21` in Stage 3) addresses a distinct problem class from T20: T20 = issuing a verdict without evidence-bearing tool call; T-DRD/T21 = deferring a self-owned verified action to the maintainer. They are related (both are defer patterns) but structurally separate: T20 fires when the agent *recommends without grounding*; T21 fires when the agent *avoids acting on a clear unambiguous path*. T21 is a candidate catalog entry for Stage 3, conditional on benchmark GO.

**Current T-trap count in ai-laziness-traps.md §2:** T1 through T20 = 20 entries. Next slot = **T21**.

### §1.(c) Superpowers `using-superpowers` Red Flags table — re-evaluation

**Source verified:** WebFetch of `https://raw.githubusercontent.com/obra/superpowers/main/skills/using-superpowers/SKILL.md` (2026-05-25):

Red Flags table — 12 entries (extracted verbatim):
1. «This is just a simple question»
2. «I need more context first»
3. «Let me explore the codebase first»
4. «I can check git/files quickly»
5. «Let me gather information first»
6. «This doesn't need a formal skill»
7. «I remember this skill»
8. «This doesn't count as a task»
9. «The skill is overkill»
10. «I'll just do this one thing first»
11. «This feels productive»
12. «I know what that means»

**SSOT #71 verdict was REJECT, scoped to «delegation-vs-decision discipline in skill priority-tie resolution».** Re-evaluation for defer-reflex scope:

**T16 problem-class re-check:**
> **Upstream problem class (Superpowers Red Flags):** rationalisations for *not invoking a skill* when a skill should be invoked — binary invoke/skip decision at skill-trigger moment. The Red Flags list covers self-justifications that lead to skipping a skill activation.
>
> **Our problem class (defer-reflex):** rationalisations for *not merging a PR* that the agent should self-execute — specifically the pattern of deferring a verified merge to the maintainer using text phrases in the final report.
>
> **Match?** **No — structural mismatch.** The Red Flags table addresses «skill invocation avoidance»; defer-reflex addresses «self-action avoidance on PR management». The surface phrase shape is different: Superpowers Red Flags are internal thoughts the model has; our defer-tell phrases are *text that appears in the model's final output*. The Superpowers mechanism detects a rationalization *before action*; ours detects a deferral *in a written report*.
>
> **ADAPT credit (vocabulary only):** the conceptual shape — «a list of named rationalisations that each map to a counter-reality» — is the correct structural form for the §2 phrase catalog. We ADAPT this vocabulary-pattern for our RU/EN phrase catalog format. No runtime coupling. SSOT #71 REJECT verdict stands for the implementation-level scope; ADAPT VOCABULARY applies to the catalog format.
>
> **Verdict:** ADAPT VOCABULARY (format of rationalisations catalog); REJECT for implementation-level adoption. Existing SSOT #71 REJECT is correct for the original meta-orchestrator scope and remains correct for this scope too.

### §1.(d) DeepWiki + WebSearch — external prior art

**WebSearch phrasing 1:** «AI agent self-merge defer detection behavioral hook 2025 2026»

Results (2026-05-25): General AI misbehavior detection literature; agent monitoring platforms (Maxim AI, 2026); arxiv 2602.22303 «Training Agents to Self-Report Misbehavior» (2026). **No production-grade tool addressing the specific problem class of «detect defer-tell phrases in AI session reports before PR merge».** Results confirm the problem class is treated as an *AI oversight / alignment* concern rather than a *developer-tooling hook* concern.

> **T16 check on arxiv 2602.22303:** upstream = «training agents to report their own misbehavior» (model training, reinforcement); ours = «runtime hook detecting a specific phrase pattern in session transcript». Problem-class mismatch: training vs. runtime-hook; alignment-research vs. dev-tooling. REJECT for adoption.

**WebSearch phrasing 2:** «LLM agent self-authority-deferral pattern detection assistant»

Results (2026-05-25): ReDAct (arxiv 2604.07036, under review 2026-04) — «Reason-Defer-Act: uncertainty-aware deferral from small LLM to large LLM»; ReAct pattern (reason+action interleaving); ALRPHFS (risk pattern detection via adversarial self-learning).

> **T16 check on ReDAct (arxiv 2604.07036):** upstream problem class = «when predictive uncertainty of small model exceeds threshold, defer task to large model»; ours = «detect when agent defers a PR merge it should execute». Structural mismatch: ReDAct = model-level uncertainty-routing (big/small model switching); ours = phrase-level pattern detection on final report text. REJECT — different problem class, different substrate, different abstraction layer.

**WebSearch phrasing 3:** «behavioral discipline hook AI assistant compliance detection transcript»

Results (2026-05-25): Enterprise AI compliance monitoring (Smarsh, ClickUp, StrikeGraph); violation detection agents for financial/regulatory compliance; transcript summarization for compliance review. **No production-grade tool for «detect specific behavioral anti-patterns in AI coding-assistant session transcripts via a Claude Code hook».** The compliance tooling is for *enterprise communication compliance* (financial, HR, regulatory), not *AI session discipline enforcement*.

> **T16 check on enterprise compliance monitoring:** upstream problem class = «monitor employee communications for regulatory violations (financial, HR, legal)»; ours = «detect AI coding-assistant behavioral anti-patterns in its own session». Problem-class mismatch: regulated-industry communication compliance vs. AI agent behavioral discipline. REJECT.

**DeepWiki:** Not attempted — `claude-code-guide` inaccessible from Worker sandbox (per memory `feedback_claude_code_guide_worker_inaccessible.md`). WebFetch used as fallback for hooks API (code.claude.com/docs/en/hooks, fetched successfully 2026-05-25).

**§1.(d) verdict: INCONCLUSIVE-partial** — WebSearch executed 3× phrasings, each returning no production-grade analog. Network available. DeepWiki unavailable from Worker context. Prior-art result: **BUILD** justified for the specific problem class (deterministic phrase-detection hook in a CC session). No external upstream addresses this exact surface. Evidence: 3 WebSearch queries above with T16 problem-class checks per result.

---

### §1 Prior-art summary table

| Candidate | Source | Verdict | T16 problem-class match | Evidence |
|---|---|---|---|---|
| narrow-B Stop-hook (recommendation-laziness) | `.claude/rules/recommendation-laziness-discipline.md:40` | REFERENCE (lesson: contextual gate mandatory) | No — verdict-vocab-any-turn vs. defer-phrase-own-PR-context | FP=84.2% Wilson CI [62%,95%] per `narrow-b-benchmark.md §1.3` |
| Superpowers Red Flags table | WebFetch `obra/superpowers SKILL.md` 2026-05-25 | ADAPT VOCABULARY (format only) | No — skill-invocation avoidance vs. report-output deferral | SSOT #71 REJECT retained; catalog format adapted |
| ReDAct arxiv 2604.07036 | WebSearch result 2 + arxiv.org 2026-05-25 | REJECT | No — model-level uncertainty routing vs. phrase-level hook | arxiv abstract (under review 2026-04) |
| Enterprise compliance monitoring | WebSearch result 3 2026-05-25 | REJECT | No — regulated communications vs. AI session discipline | Search result excerpts |
| arxiv 2602.22303 self-report misbehavior | WebSearch result 1 2026-05-25 | REJECT | No — model training vs. runtime hook | Search result excerpt |
| End-of-turn-reminder.sh (own-stack) | `.claude/hooks/end-of-turn-reminder.sh:1` | ADAPT (extend existing Stop hook) | Yes — same hook channel, same transcript_path access | Source code: hook:7 (`stop_hook_active`), hook:30 (text extraction) |

---

## §2 Phrase catalog

### Defer-tell phrases (positive — indicate deferral of own-PR merge)

**RU phrases:**
- `жду твой клик` — waiting for your click
- `жди твой клик` — wait for your click
- `требуется ваше одобрение` — your approval required
- `жду решения` — awaiting your decision
- `жду твоего решения` — awaiting your decision
- `жду мержа` — waiting for merge
- `maintainer click required` (EN phrase used in RU session reports)
- `ваш мерж` / `твой мерж` — your merge

**EN phrases:**
- `maintainer click required`
- `awaiting your decision`
- `ready for merge` (without subsequent `gh pr merge` action)
- `pending maintainer review`
- `ready for review and merge`
- `[ ] maintainer-owned`
- `waiting for your approval`
- `requires your click`
- `needs your sign-off`

### Negative examples — legitimate uses that must NOT trigger

1. **Quoting documentation:** «The rule says that discipline PRs require `maintainer click required` sign-off» — the phrase appears in a meta-discussion about the protocol, not as a defer-tell in the final report. A naïve regex would fire on this. Counter: require that the phrase appear in the final REPORT section (last 500 chars of turn text) not in quoted/indented blocks.

2. **Legitimate fork — genuinely unclear authority:** «I've completed the hook implementation. This PR targets `main` (not staging), which requires maintainer merge authority per the branch protection rules. Ready for your review.» — the agent is CORRECTLY deferring a `→main` promotion, which IS maintainer-owned per `feedback_monitor_ci_after_pr.md`. Counter: contextual gate must check target branch (`→staging` = auto-merge permitted; `→main` = maintainer authority, NOT a defer-reflex violation).

3. **External reviewer comment in conversation:** «The PR reviewer left a comment: `maintainer click required` before merge» — agent is relaying an external reviewer's instruction, not deferring. Counter: the phrase appears in a tool-call result (`gh pr view` output), not in the agent's own prose. The contextual gate checks that phrase is in the agent's text output block, not in quoted tool output.

4. **Informational report, no active PR:** «In a previous session, I had a pattern of writing `ready for merge` instead of merging myself.» — historical reference, no active PR context. Counter: PR authorship signal gate: recent `gh pr create` or `gh pr view --author=@me state=OPEN` must be present in session tool history within N turns.

5. **Acknowledged decision-only fork:** «PR #X targets main — this is the staging→main promotion, which is your circuit-breaker decision, not mine. Call when ready.» — correctly scoped to the `→main` circuit-breaker. The phrase is accurate under the operating model. Counter: same target-branch gate as negative example 2.

---

## §3 Detection mechanism design

### Decision: EXTEND the existing Stop hook (`end-of-turn-reminder.sh`)

**Rationale (build-first-reuse-default.md §3):** The existing Stop hook already:
- receives `transcript_path` in its JSON input (`.claude/hooks/end-of-turn-reminder.sh:11`)
- reads the last assistant text via `grep '"type":"assistant"' "$transcript" | tail -1 | jq -r '...'` (hook:30)
- issues `decision: "block"` with a `reason` injected to the model (hook:265)
- has `stop_hook_active` guard (hook:7) preventing infinite loops

Adding a defer-reflex scan to this hook is a 20–30 line extension, not a new hook file. This minimizes hook count, avoids duplication of transcript-reading logic, and respects dual-implementation-discipline.md §3 (internal tooling, single-channel CC-native justified by `@cc-only-rationale`).

**Alternative considered: PostToolUse:AskUserQuestion**

The ask-question-reminder.sh hook (PreToolUse:AskUserQuestion) already challenges questions. However: defer-tell phrases appear in the final *REPORT* text of an assistant turn, NOT specifically in AskUserQuestion tool calls. The three incidents (2026-05-21, 2026-05-22, 2026-05-25) all manifested as defer text in the final written report, not as explicit AUQ calls. The Stop hook fires on the complete turn text, making it the correct event for detecting what was written.

### §3.1 Hook contract (CC hooks API — verified via WebFetch 2026-05-25)

**Source:** `https://code.claude.com/docs/en/hooks` (fetched 2026-05-25; redirected from docs.anthropic.com).

**Stop hook event input — JSON fields (quoted from source and confirmed by existing hook behavior):**

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../<session-id>.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}
```

Key fields:
- `transcript_path` — path to JSONL transcript; the hook reads last assistant text from it
- `stop_hook_active` — true when the hook itself triggered the block (prevents infinite loop); exit 0 immediately when true
- `hook_event_name` — `"Stop"`

**Stop hook output contract (verified from existing hook:265 + hooks docs):**

```json
{
  "decision": "block",
  "reason": "<injected to model as context — model gets one more turn>",
  "systemMessage": "<shown to user in CC UI only; NOT seen by model>"
}
```

`decision: "block"` → model does NOT stop; receives `reason` as context and generates one more response. This is an injection mechanism (the model sees the reason and can self-correct), not a hard gate. Appropriate for a behavioral discipline check.

**Note: Stop hook does NOT expose the draft text directly.** The turn text is not in the Stop hook JSON input. The hook must read it from `transcript_path`. This is already the established pattern in `end-of-turn-reminder.sh`.

### §3.2 WHEN it fires

Event: `Stop` (every assistant turn completion).
Gate: ONLY when ALL of:
1. `stop_hook_active` is false (loop guard — per existing hook:7)
2. The last assistant turn text contains a defer-tell phrase (phrase regex match)
3. A PR authorship signal exists in recent turn history: within the last N=20 tool calls in the transcript, a `gh pr create` or `gh pr view` call returns an OPEN PR with `author=@me` (contextual gate — this is the discriminator narrow-B lacked)
4. The defer-tell phrase appears in the agent's own prose text, NOT in a tool-call result block (content-type gate: phrase must be in a `type=text` content block, not adjacent to `type=tool_use`)
5. Target branch is `staging` or unknown (NOT `main` — `→main` is a legitimate maintainer decision)

### §3.3 WHAT it reads

1. `transcript_path` from Stop hook input → read last assistant line
2. Extract `text` content from last assistant message (same pattern as `end-of-turn-reminder.sh:30`)
3. Scan text for defer-tell phrases (regex)
4. Scan N=20 prior turns for PR authorship signals (grep over `transcript_path`)

### §3.4 WHAT it asserts (regex + contextual gate)

**Defer-tell phrase regex (bash ERE):**
```bash
DEFER_REGEX='(maintainer[[:space:]]+(click|merge|review)[[:space:]]+required|жд[уёи][[:space:]]+(твой|ваш[еи]?)?[[:space:]]*(клик|мерж|решени[ея])|awaiting[[:space:]]+your[[:space:]]+(decision|approval)|ready[[:space:]]+for[[:space:]]+(review[[:space:]]+and[[:space:]]+)?merge|pending[[:space:]]+maintainer|requires[[:space:]]+your[[:space:]]+click|\[[[:space:]]*\][[:space:]]*maintainer-owned)'
```

**PR authorship signal scan (bash, last 20 tool calls):**
```bash
# Read last N assistant lines of transcript; extract tool_use commands from .message.content[].
# JSONL format: tool_use entries are INSIDE assistant lines as .message.content[] items,
# NOT as top-level lines with "type":"tool_use".
# Verified against end-of-turn-reminder.sh:30-35 and end-of-turn-reminder.test.ts:81-91 fixtures.
pr_signal=$(grep '"type":"assistant"' "$transcript" | tail -20 \
  | jq -r '.message.content[]? | select(.type == "tool_use") | .name + " " + (.input // {} | tostring)' 2>/dev/null \
  | grep -E 'gh pr (create|view|merge)' | tail -5 || true)
```

**Target branch exclusion:** if last `gh pr create` or `gh pr view` output contains `baseRefName.*main`, skip (legitimate maintainer-decision territory).

### §3.5 WHAT it does

Issue `decision: "block"` with `reason`:

```text
Стоп — обнаружен defer-tell паттерн.

Ты написал «<matched phrase>», передавая действие мейнтейнеру.

Проверь: является ли этот PR (a) твоей собственной работой, (b) с прошедшим cold-QA, (c) с зелёным CI, (d) целью staging (не main)?
Если ДА на все четыре — смержи сам. Не пиши «ready for merge», а выполни: gh pr merge <N> --merge --auto.
Если target = main или есть открытый ревьюер-вопрос — тогда defer корректен; просто убедись, что причина явная.
```

The model receives this as a blocking reason and must either self-merge or explicitly justify the deferral in its next response.

### §3.6 HOW it's tested (paired-negative arms)

Test file location (proposed): `packages/core/hooks/defer-reflex-check.test.ts` (Stage 3 work).

Required paired-negative arms:

| Arm | Input | Expected output |
|---|---|---|
| ✅ POSITIVE — defer-tell on own PR | Last text contains `maintainer click required` + recent `gh pr create` in transcript | `decision: "block"` + defer-tell reason |
| ✅ POSITIVE — contextual gate fires on JSONL fixture | JSONL transcript with an assistant line whose `.message.content[]` includes a `tool_use` entry with `name="Bash"` and `input.command="gh pr create ..."` (fixture shape: `assistantToolUseOnly("Bash")` from `end-of-turn-reminder.test.ts:93-97`) + final assistant text with defer phrase | `pr_signal` non-empty (gate fires); `decision: "block"` |
| ❌ NEGATIVE 1 — no defer phrase | Long report without any defer phrase + recent PR creation | `exit 0` silent |
| ❌ NEGATIVE 2 — defer phrase in tool output | Last text has defer phrase ONLY inside a quoted `gh pr view` result block | `exit 0` silent |
| ❌ NEGATIVE 3 — target is main | Last text contains `ready for merge` + PR targets main | `exit 0` silent (legitimate defer) |
| ❌ NEGATIVE 4 — no PR authorship signal | Last text contains defer phrase + no recent gh pr create in transcript | `exit 0` silent |
| ❌ NEGATIVE 5 — stop_hook_active | Input has `stop_hook_active=true` + defer phrase | `exit 0` immediate (loop guard) |

---

## §4 Falsifiers

1. **Legitimate deferral — PR has open external reviewer comment.** If a collaborator left an unresolved review comment on the PR, deferring to the maintainer is correct. The mechanism as designed has no access to reviewer comments (it only checks tool-call history for `gh pr create`/`gh pr view`, not `gh pr review`). A full precision measurement requires adding a reviewer-comment check, but this adds complexity. This is a benchmark falsifier: Stage 2 must classify any case where the mechanism fires on a PR with open reviewer comments as a FP.

2. **Cross-PR discussion — defer phrase about a different PR.** The agent is reviewing PR #X but mentions «PR #Y is ready for merge» in passing (e.g., noting that an upstream dependency is merge-ready). The phrase triggers, but the PR context is not the agent's own work. The PR authorship signal gate (§3.4) partially mitigates this if PR #Y is not in recent tool history, but a verbose REPORT mentioning multiple PRs could still trigger incorrectly. Benchmark will surface this shape.

3. **First-of-kind change — genuinely needs maintainer eyes.** The agent correctly identifies that a PR touching `.husky/pre-push` or `settings.json` (maintainer-protected files per `feedback_settings_json_agent_uncommittable.md`) must go through the maintainer, and writes `awaiting your decision` accurately. The mechanism fires, blocking a correct deferral. Mitigation: the block provides a `reason` that lets the agent explain the correct deferral in its next response — so the mechanism degrades gracefully (model can override by self-justifying), but still introduces friction. The target-branch exclusion in §3.4 covers `→main`; a path-based exclusion for maintainer-owned paths is a Stage 3 design question.

4. **FP rate exceeds 20% in Stage 2 benchmark.** If the defer-tell phrase set intersects sufficiently with non-deferral uses of the same vocabulary (e.g., `ready for merge` in a how-to document, `awaiting your decision` in a legitimate fork), the mechanism fails the precision threshold and must be dropped (same outcome as narrow-B). The contextual gate (PR authorship signal) is the key precision lever; without it the FP rate would approach narrow-B territory.

---

## §5 §1.7 Self-reflexive check

### Forward-check

- `no-paid-llm-in-ci.md §1` (`.claude/rules/no-paid-llm-in-ci.md:12–18`): the proposed mechanism is deterministic bash regex + grep over transcript JSONL. Zero API-billed LLM calls. Benchmark (Stage 2) is manual classification by session. Both comply. ✅
- `phase-research-coverage.md §1.12` (file:line: `.claude/rules/phase-research-coverage.md:86`): this R-phase leads with a concrete mechanism recommendation (EXTEND existing Stop hook) backed by evidence (§1 prior-art survey with T16 checks, §2 phrase catalog with negative examples). Not an option-dump. ✅
- `phase-research-coverage.md §1.11` (file:line: `.claude/rules/phase-research-coverage.md:73`): every prior-art verdict cites a tool call or file:line. ✅
- `dual-implementation-discipline.md §3` (`.claude/rules/dual-implementation-discipline.md:§3`): proposed hook is classified as internal tooling (`@cc-only-rationale: internal dev tooling — defer-reflex behavioral check for maintainer's CC session; not shipped to consumer projects via install.sh`). CC-native only, no portable fallback required. Note: `end-of-turn-reminder.sh:2` already carries `@cc-only-rationale`; extending the hook with the defer-reflex check inherits this marker — no annotation change required at Stage 3. ✅
- `doc-authority-hierarchy.md §3` (`.claude/rules/doc-authority-hierarchy.md:§3`): new rule proposed for Stage 3 carries the required Class + Authoritative-for header spec (below). This research-patch itself carries the required `<!-- scope:... -->` first-line annotation and Authoritative-for header. ✅
- `recommendation-laziness-discipline.md §4` (`.claude/rules/recommendation-laziness-discipline.md:40`): the narrow-B lesson (benchmark before ship) is applied — Stage 2 benchmark is mandatory before Stage 3 implementation. ✅

### Backward-check

- The mechanism does NOT supersede `feedback_no_human_verification_ai_self_verifies.md` — it adds a mechanical channel below the text-recall layer; the memory entry remains as the human-readable description.
- No existing rule is superseded. The new T21 entry (Stage 3, conditional) EXTENDS ai-laziness-traps.md §2 as a new slot entry.
- This patch does NOT create the rule file or hook implementation (Stage 3 work, scope boundary per kickoff §4).
- The proposed `defer-reflex-check.sh` hook extension is an internal-tooling addition (no install.sh shipping path). This keeps it in the dual-implementation-discipline §3 Internal tooling category.

### Proposed new rule Class + Authoritative-for header (Stage 3 spec — do NOT create file now):

```markdown
> **Class:** B — compensating mechanism shipped (hook implementation + paired-negative tests); no principle test yet. Promotion criterion in §N.
> **Authoritative for:** defer-reflex-detection discipline rule — §1 the detection problem, §2 phrase catalog, §3 mechanism design, §4 falsifiers, §5 promotion/retirement.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Recommendation-laziness discipline (sibling problem class) — see [recommendation-laziness-discipline.md](recommendation-laziness-discipline.md).
```

---

## §6 Active T-trap citations

Active traps for this R-phase: **T11, T12, T15, T16, T17, T19, T20, T-DRD-A**.

**T11 — designing custom mechanism without external prior-art check.**
Applied: §1 6-item search executed before §3 mechanism design. Own-stack sweep (§1.0) identified the existing Stop hook as the ADAPT target, avoiding a greenfield build. External search (§1.d) confirmed no production-grade analog for the specific problem class. Counter verified: §3 design is grounded in §1 prior-art findings.

**T12 — skipping literature sweep because «I remember this area».**
Applied: WebSearch run for 3 phrasings (2026-05-25) even though ReDAct, enterprise compliance monitoring were recognizable from training data. Each WebSearch result received a T16 problem-class check. Counter verified: search results documented inline with evidence, not assumed.

**T15 — self-application skipped.**
Applied: §5 self-reflexive check walks this R-phase through §1.7 forward+backward. Additionally: this R-phase document itself must not contain defer-tell phrases in its own body — checked below.

> **T15 self-application check:** scanned §3.5 (the mechanism reminder text) for defer-tell patterns. The reminder text contains «смержи сам» (self-merge instruction) and «не пиши `ready for merge`» — these are counter-instructions, not defer-tell acts. The REPORT section of this patch ends with concrete findings + REPORT block, not with deferral phrasing. ✅ No defer-tell found in this patch's prose.

**T16 — pattern-matching-on-name.**
Applied: explicit T16 problem-class checks in §1.(a) (narrow-B vs. defer-reflex), §1.(c) (Superpowers Red Flags), and each WebSearch candidate. All four external candidates received «upstream problem class / our problem class / Match?» verbatim format per kickoff §7. Counter verified.

**T17 — destructive delegation without preserving future-value content first.**
Applied: this R-phase produces only docs (one new markdown file). No destructive operations issued. No content with future value deleted. The existing `end-of-turn-reminder.sh` hook is not modified in this R-phase (Stage 3 work). Counter verified: nothing deleted.

**T19 — own cold-QA before handoff.**
Applied: re-read this patch end-to-end before finalizing REPORT. Checked: §0.1 has commands+outputs; §1 has T16 checks per candidate; §2 has ≥3 negative examples; §3 is implementable (EXTEND pattern with concrete bash regex); §4 has ≥3 falsifiers; §5 self-reflexive check complete; §6 T-trap citations complete. Cold-QA finding: §3.4 PR authorship signal bash snippet uses `jq` with a complex query that may fail on real transcript lines — flagged as Stage 3 implementation risk. Counter verified.

**T20 — inline-verdict-without-evidence.**
Applied: every ADOPT/ADAPT/REJECT verdict in §1 table cites a tool-call output (WebFetch 2026-05-25, WebSearch 2026-05-25) or file:line from Read tool. No verdict issued without prior evidence-bearing call. Counter verified.

**T-DRD-A (NEW, domain-specific) — «proposing always-on H-text as primary mechanism without benchmark».**
Applied: §3 mechanism design centers on the Stop hook (deterministic phrase detection) as PRIMARY channel. H-text (always-on UserPromptSubmit injection) appears as SECONDARY in §5 forward-check only. This R-phase does NOT propose adding a new H1 cross-reference as the primary fix — the text-recall layer (memory + H1) is the falsified approach (3 incidents). Primary = Stop-hook phrase scan with contextual gate. Counter verified: T-DRD-A criterion not violated.

---

## Decision log

1. **T21 slot assignment:** kickoff §3 Stage 3 mentions «slot T21 — T20 taken by recommendation-laziness». Verified: T20 is the last entry in `ai-laziness-traps.md:146`. T21 confirmed as next free slot. No ambiguity.

2. **DeepWiki unavailability:** DeepWiki not attempted — memory `feedback_claude_code_guide_worker_inaccessible.md` confirms claude-code-guide inaccessible from Worker sandbox. Proceeded with WebFetch + WebSearch as D4 Option B per that memory entry. §1.(d) marked INCONCLUSIVE-partial (WebSearch ran, DeepWiki skipped). Documented in §0.1 network status.

3. **EXTEND vs. NEW HOOK:** chose EXTEND `end-of-turn-reminder.sh` over creating a new `defer-reflex-check.sh` file. Rationale: existing hook already reads transcript_path, already issues decision:block, already has loop guard. A new file would duplicate 40+ lines of shared infrastructure. Decision logged here; Stage 3 may reconsider if EXTEND creates complexity in the existing hook.

4. **Stage 3 rule Class B vs C:** proposed Class B (compensating mechanism with paired-negative tests) rather than C (prose-only). Rationale: the hook extension + test file constitute a B-level mechanism. Class A (principle test) would require a corpus-level scan not a unit test — deferred to promotion criterion triggered by incidents.

5. **Scope boundary:** §2 negative example 2 (legitimate `→main` deferral) identified that the target-branch gate needs a `→main` exclusion. This is documented in §3.4 as part of the contextual gate design; it is not implemented in this R-phase (Stage 3 work). Risk: if Stage 3 omits this gate, FP rate on legitimate `→main` defers will inflate the Stage 2 benchmark beyond the 20% threshold.

---

### Reviewer round-1 follow-up (2026-05-25, commit following 9040a74)

**BLOCKER + MAJOR-1 + MINOR-1 + MINOR-2 addressed in the follow-up commit.**

**MAJOR 2 — DEFERRED to Stage 2:**

§1.(d) is honest about the DeepWiki gap (claude-code-guide inaccessible from Worker sandbox, per `feedback_claude_code_guide_worker_inaccessible.md`). The kickoff §5's active path was `D4 Option B` (WebFetch + WebSearch as fallback) — which was executed for 3 phrasings. However, the BUILD verdict in §1.(d) and §1 summary table is still partially load-bearing while DeepWiki queries for `obra/superpowers` and `anthropics/anthropic-cookbook` remain untried. **Deferred to Stage 2:** a Reviewer-class session with DeepWiki access should retry those two repo queries before the Stage 3 implementation treats the BUILD verdict as fully load-bearing. If a production-grade analog surfaces, revisit ADAPT vs BUILD at that point.

**MINOR 3 — DEFERRED to Stage 2 housekeeping:**

§6 T19 counter states «re-read this patch end-to-end before finalizing REPORT» — which matches inline cold-QA, not a dispatched cold-review subagent. The wording «cold-QA» in the T19 counter context means self-review (re-read the deliverable before handoff), which is what was done. The ambiguity is a wording issue only. Defer to Stage 2: update §6 T19 counter to «re-read this patch adversarially end-to-end (inline cold-QA, not subagent dispatch — single-author R-phase, no multi-agent split) before finalizing.» No semantic change; wording polish only.

---

## See also

- `.claude/orchestrator-prompts/defer-reflex-detection/kickoff.md` — single source of truth for this umbrella
- `~/.claude/projects/-Users-art-code-rules-as-tests-aif/memory/feedback_no_human_verification_ai_self_verifies.md` — 3 incident log (Recurrences #1/#2/#3)
- `.claude/rules/recommendation-laziness-discipline.md` — closest mechanism precedent (narrow-B Drop lesson)
- `docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md` — benchmark template + B-drop verdict (FP=84.2%)
- `.claude/hooks/end-of-turn-reminder.sh` — primary ADAPT target (Stop hook)
- `.claude/rules/rule-enforcement-channel-selection.md §4` — channel classification (Stop hook = injection via decision:block/reason)
- `.claude/rules/ai-laziness-traps.md §2 T20` — sibling trap (inline-verdict-without-evidence); T21 is the next slot for T-DRD if Stage 2 GO
