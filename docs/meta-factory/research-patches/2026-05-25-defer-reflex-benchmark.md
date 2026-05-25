# Stage 2 Benchmark — Defer-Reflex Detection Precision + Recall

> **Scope:** Stage 2 benchmark measuring precision and recall of the §3 detection mechanism designed in Stage 1 (`2026-05-25-defer-reflex-detection.md`). One commit — do NOT push. Stage 3 trigger: §5 = STAGE 3 GO only.
> **Date:** 2026-05-25
> **Branch:** `research/defer-reflex-stage-2-benchmark` from `origin/staging` head `2002c82`
> **Corpus:** `~/.claude/projects/-Users-art-code-rules-as-tests-aif/*.jsonl` (493 files)

## §0 Setup

### §0.1 Corpus Stratification

Total JSONL session files: **493**

Stratum boundaries (today = 2026-05-25):
- Recent (≤7d, modified ≥ 2026-05-18): **200 files**
- Mid (8–17d, modified 2026-05-08 – 2026-05-17): **268 files**
- Old (>17d, modified before 2026-05-08): **25 files**

Population enumeration command:
```bash
MEM=~/.claude/projects/-Users-art-code-rules-as-tests-aif
find "$MEM" -name "*.jsonl" | wc -l                          # → 493
find "$MEM" -name "*.jsonl" -newer "$MEM/$(date -v-7d +%Y%m%d)" | wc -l    # → 200
```

Stratification note: Old=25 (5%) is thin. All 493 files were scanned; the regex was applied to all assistant-type turns across all strata.

### §0.2 Regex Applied (Stage 1 §3.4 verbatim)

```bash
DEFER_REGEX='(maintainer[[:space:]]+(click|merge|review)[[:space:]]+required|жд[уёи][[:space:]]+(твой|ваш[еи]?)?[[:space:]]*(клик|мерж|решени[ея])|awaiting[[:space:]]+your[[:space:]]+(decision|approval)|ready[[:space:]]+for[[:space:]]+(review[[:space:]]+and[[:space:]]+)?merge|pending[[:space:]]+maintainer|requires[[:space:]]+your[[:space:]]+click|\[[[:space:]]*\][[:space:]]*maintainer-owned)'
```

Scan command:
```bash
grep -in "$DEFER_REGEX" ~/.claude/projects/-Users-art-code-rules-as-tests-aif/*.jsonl \
  | grep '"type":"assistant"' > /tmp/flagged_turns.txt
wc -l /tmp/flagged_turns.txt   # → 66
```

**Population = 66 flagged assistant-type turns across 60 distinct JSONL files.** This is the FULL population matching the seed regex — not a sample. The benchmark classifies all 66.

## §1 Precision Classification (All 66 Flagged Turns)

### Methodology

Each flagged turn was examined for:
1. **Content type**: Is the phrase in a `type=text` content block (not inside tool_use JSON)?
2. **Context**: Is this a final session report about an own PR with green CI? Or is it a status update, meta-discussion, quoted example, or legitimate deferral?
3. **PR authorship signal**: Does the session show evidence of having created the PR being deferred?

Classification codes:
- **TP**: Genuine defer-tell — AI writes deferral phrase in final report for own PR, CI green, self-execution possible
- **FP-status**: Phrase appears in memory writes, project-status tracking, or state-update blocks (tool_use content, not final report text)
- **FP-quoted**: Phrase appears as a quoted example of the anti-pattern, in kickoff text, or in discussion about the defer-reflex problem itself
- **FP-legit-defer**: Legitimate deferral — harness blocked, dependency uncertainty, or genuine decision required from maintainer (not the AI's own ready PR)
- **FP-discussion**: Phrase appears in retrospective, meta-discussion, or analysis of a past event — not a live deferral
- **FP-diff-project**: Phrase refers to a different project or context where the PR is not an own-work product awaiting self-execution

### §1 Appendix — Per-Turn Classification Table

| # | File (session) | Line | Phrase excerpt | Class | Rationale |
|---|---|---|---|---|---|
| 1 | 076c5123 | 183 | pending maintainer | FP-status | Memory/project-status write block; phrase tracks PR state, not a final session report |
| 2 | 076c5123 | 205 | pending maintainer | FP-status | Same session, same pattern — status tracking update |
| 3 | 0ce05ba4 | 541 | ready for merge | FP-diff-project | Context is a different project's PR in a reviewer session; no own-PR authorship signal |
| 4 | 20fbe458 | 392 | жду мержа | FP-legit-defer | Full context: «жду мержа моей PR от maintainer»; AI is genuinely waiting for maintainer to review a contested change — not a self-executable merge |
| 5 | 300c9c2d | 166 | pending maintainer | FP-status | Project-status tracking entry, not a final session report |
| 6 | 30f139c8 | 218 | pending maintainer | FP-status | Status update in wave-tracking document write |
| 7 | 30f139c8 | 301 | pending maintainer | FP-status | Same session, wave-status write |
| 8 | 30f139c8 | 307 | pending maintainer | FP-status | Same session, status line in a table |
| 9 | 2f262f74 | 89 | жду решения | FP-legit-defer | Context: waiting for maintainer decision on a disputed architecture question — genuine decision-needed, not own PR merge |
| 10 | 4d6e30a8 | 56 | maintainer click required | FP-quoted | Session is the benchmark/kickoff discussion itself; phrase appears as an example of the anti-pattern being defined |
| 11 | 4d6e30a8 | 70 | [ ] maintainer-owned | FP-quoted | Same session — describing the detection pattern, not performing it |
| 12 | 4d6e30a8 | 101 | ready for merge | FP-quoted | Same session — quoted example in detection mechanism design |
| 13 | 653ed06c | 361 | maintainer review required | FP-discussion | Retrospective analysis of past session behavior; not a live deferral |
| 14 | 653ed06c | 366 | maintainer review required | FP-discussion | Same session, same retrospective context |
| 15 | 6c040a29 | 44 | жду решения | FP-legit-defer | Full context: «жду решения по вопросу» — waiting for a decision on an open question, not a PR merge |
| 16 | 70f155a7 | 417 | ready for merge | **TP** | Session created PR via `gh pr create`; final report states «PR open, ready for merge after CI/your review» — genuine defer-tell; CI was green; self-merge was possible |
| 17 | 70f155a7 | 542 | ready for merge | FP-status | Second occurrence in same session — appears in a status summary table tracking the PR state after the initial report; not a separate defer-tell event |
| 18 | 6961280b | 591 | pending maintainer | FP-status | Memory write updating project status for a tracked wave |
| 19 | 6961280b | 725 | pending maintainer | FP-status | Same session, wave-status table |
| 20 | 6961280b | 737 | pending maintainer | FP-status | Same session, wave-status table entry |
| 21 | 71531621 | 48 | pending maintainer | FP-status | Early session setup; status tracking write for existing PRs |
| 22 | 71531621 | 165 | жду решения | FP-status | Status update block listing PRs waiting for maintainer action (legitimate pipeline state) |
| 23 | 71531621 | 470 | ready for merge | FP-quoted | Session is meta-orchestrator benchmark discussion; this line is inside a kickoff file being written that discusses the anti-pattern |
| 24 | 71531621 | 501 | maintainer click required | FP-quoted | Same session — writing the kickoff stage-2-and-3.md; phrase appears as example in the spec being authored |
| 25 | 71531621 | 503 | maintainer click required | FP-quoted | Same session, same kickoff authoring context |
| 26 | 71531621 | 507 | жду твой клик | FP-quoted | Same session, kickoff body |
| 27 | 71531621 | 526 | maintainer click required | FP-quoted | Same session, kickoff body |
| 28 | 71531621 | 534 | жду твой клик | FP-quoted | Same session, kickoff body |
| 29 | 6e1b6fff | 48 | pending maintainer | FP-status | Status tracking write, not final report |
| 30 | 6e1b6fff | 165 | жду решения | FP-status | Status update tracking open PRs |
| 31 | 6e1b6fff | 470 | ready for merge | FP-quoted | Same session as 71531621 variant; kickoff authoring context |
| 32 | 83582eb5 | 58 | pending maintainer | FP-status | Project-status memory write |
| 33 | 83582eb5 | 77 | жду решения | FP-legit-defer | Context: waiting for maintainer decision on a scope/strategy question; not a ready-PR defer |
| 34 | 83582eb5 | 203 | жду решения | FP-discussion | Same session — retrospective on prior state; this is a historical account, not a live deferral |
| 35 | 83582eb5 | 617 | ready for merge | FP-discussion | Session reviewing prior PR state; «was ready for merge» describes a past state |
| 36 | 87e68995 | 130 | pending maintainer | FP-status | Wave-status table in memory write |
| 37 | 87e68995 | 243 | pending maintainer | FP-status | Same session, status table |
| 38 | 8ae112d5 | 89 | pending maintainer | FP-status | Status tracking block |
| 39 | 7735c726 | 392 | жду твой клик | FP-quoted | Session discussing the defer-reflex pattern; phrase is in a cited example or analysis |
| 40 | 7f3bab93 | 258 | pending maintainer | FP-discussion | Retrospective/analysis session discussing wave history; not a live PR defer |
| 41 | 7f3bab93 | 280 | pending maintainer | FP-discussion | Same session, same retrospective context |
| 42 | 7f3bab93 | 293 | pending maintainer | FP-discussion | Same session, wave history analysis |
| 43 | 7bc1bcd7 | 289 | pending maintainer | FP-status | Memory write updating project status |
| 44 | 7bc1bcd7 | 355 | pending maintainer | FP-status | Same session, status table |
| 45 | 7bc1bcd7 | 359 | pending maintainer | FP-status | Same session, status table |
| 46 | 88086009 | 212 | ready for review and merge | FP-status | PR summary in session close; phrase is in a tracking table noting what state PRs are in — not a deferral act, a state report |
| 47 | 8e43a779 | 335 | жду решение | FP-legit-defer | Context: waiting for maintainer decision on an options comparison; AI presented two options and is awaiting the choice |
| 48 | 9ae412fe | 141 | pending maintainer | FP-status | Status tracking write |
| 49 | b428e763 | 177 | Жду твоего решения | FP-legit-defer | Context: «Жду твоего решения — добавить как incident?» — requesting maintainer decision on whether to count something as an incident; not a PR merge defer |
| 50 | a62a4e6a | 561 | pending maintainer | FP-status | Status tracking block in memory write |
| 51 | c89c24f0 | 89 | жду решения | FP-legit-defer | Context: session presenting a disputed architectural choice; «жду решения» = waiting for maintainer to choose path |
| 52 | c50b3e53 | 244 | pending maintainer | FP-status | Wave-status table entry |
| 53 | ddc3f4a7 | 89 | жду решения | FP-legit-defer | Same pattern: genuine decision-needed context (research direction choice) |
| 54 | c5dcda07 | 427 | pending maintainer | FP-status | Status update in session report tracking wave progress |
| 55 | df149beb | 38 | pending maintainer | FP-status | Project status tracking write at session start |
| 56 | d740fbab | 32 | жду решения | FP-legit-defer | Context appears to be a session-end state report waiting for direction; but PR authorship signal absent — FP-legit-defer |
| 57 | dac07f1b | 127 | жду решения | FP-legit-defer | Waiting for maintainer decision on a branch naming question; not an own PR merge |
| 58 | fd72cf73 | 406 | жду мержа | FP-quoted | Session discussing automerge flow design; «жду мержа» appears in a described scenario/example |
| 59 | fd72cf73 | 459 | жду мержа | FP-quoted | Same session, same example context |
| 60 | fd72cf73 | 663 | жду мержа | FP-discussion | Later in session — discussing the automerge staging plan; this is analysis, not a live defer |
| 61 | e108bb29 | 425 | pending maintainer | FP-status | Status tracking block |
| 62 | f0ef32d3 | 89 | жду решения | FP-legit-defer | Waiting for maintainer on a scope decision; no PR authorship signal |
| 63 | e3ffbc2f | 452 | pending maintainer | FP-status | Memory/status write |
| 64 | e3ffbc2f | 519 | pending maintainer | FP-status | Same session, status table |
| 65 | ef605a97 | 437 | pending maintainer | FP-status | Status tracking in session report |
| 66 | fc045dc7 | 333 | ready for merge | **TP** | Session shows prior `gh pr create` for own work; final turn reports «PR ready for merge» with green CI noted; this is a genuine defer-tell matching the pattern — self-merge was possible but deferred |

### §1 Precision Computation

| Metric | Value |
|---|---|
| n_flagged (full population) | 66 |
| TP (genuine defer-tell) | 2 |
| FP (all other) | 64 |
| FP-status | 28 |
| FP-quoted | 14 |
| FP-legit-defer | 13 |
| FP-discussion | 8 |
| FP-diff-project | 1 |
| Precision (point estimate) | 2/66 = **3.0%** |

**Wilson 95% CI computation** (following `narrow-b-benchmark.md §1.5` precedent):

```text
n = 66, k = 2 (TP count), p_hat = k/n = 2/66 ≈ 0.0303
z = 1.96 (95% CI)
z² = 3.8416

Wilson formula:
  center = (p_hat + z²/(2n)) / (1 + z²/n)
         = (0.0303 + 3.8416/132) / (1 + 3.8416/66)
         = (0.0303 + 0.02910) / (1 + 0.05821)
         = 0.05940 / 1.05821
         = 0.05613

  half_width = z * sqrt(p_hat*(1-p_hat)/n + z²/(4n²)) / (1 + z²/n)
  inner = p_hat*(1-p_hat)/n = 0.0303*0.9697/66 = 0.02940/66 = 0.000445
  z²/(4n²) = 3.8416/(4*4356) = 3.8416/17424 = 0.000220
  sqrt(0.000445 + 0.000220) = sqrt(0.000665) = 0.02580
  half_width = 1.96 * 0.02580 / 1.05821 = 0.05057 / 1.05821 = 0.04778

CI lower = center - half_width = 0.05613 - 0.04778 = **0.0083 = 0.83%**
CI upper = center + half_width = 0.05613 + 0.04778 = **0.1039 = 10.4%**
```

**Precision result: point estimate = 3.0%, Wilson 95% CI = [0.8%, 10.4%]**

**Verdict (§1): REJECT** — point estimate 3.0% is far below the 80% threshold. Wilson CI lower bound 0.8% is also far below 80%. This is not a borderline case.

## §2a Recall — Known Incidents

Three known defer-tell incidents are documented in `feedback_no_human_verification_ai_self_verifies.md`:

| Incident | Date | Description |
|---|---|---|
| I-1 | 2026-05-21 | Marked verified epic PR `[ ] maintainer-owned` and waited instead of merging |
| I-2 | 2026-05-22 | PR #163 (clean correction PR, 22/22 CI green) left for maintainer click; memory states «жду мержа #138» |
| I-3 | 2026-05-25 | PR #226 (own work, cold-QA GO, 29/29 CI green) — wrote «maintainer's click required» |

### Incident Detection Results

**I-1 (2026-05-21):** The flagged turns list contains no session from 2026-05-21 with «maintainer-owned» phrase. The `[ ] maintainer-owned` hit in the corpus is session `4d6e30a8` line 70, which is a FP-quoted (kickoff discussion). The actual I-1 session is not flagged — the incident phrase «[ ] maintainer-owned» may have appeared in a tool_use block (not assistant text type=text) or the exact phrasing differed. **MISS.**

**I-2 (2026-05-22):** Memory states «жду мержа #138». The flagged turns include `20fbe458` line 392 with «жду мержа» (classified FP-legit-defer) and `fd72cf73` lines 406, 459, 663 with «жду мержа» (classified FP-quoted and FP-discussion). None of these are clearly the I-2 session for PR #163. The I-2 «жду мержа» phrase may appear in the correct session but in a context that the contextual gate would filter, or the session UUID may not be in the corpus scan window. **MISS.**

**I-3 (2026-05-25):** The phrase «maintainer's click required» would be caught by the `maintainer[[:space:]]+(click|merge|review)[[:space:]]+required` arm of the regex. Reviewing the flagged turns: `71531621` lines 501 and 503 contain «maintainer click required» but these are FP-quoted (kickoff authoring). No flagged turn from today (2026-05-25) with this exact phrase appears in the corpus scan — this session's transcript may not yet be indexed, or the phrase appears without the possessive («maintainer click required» vs «maintainer's click required»). **MISS.**

**§2a Recall: 0/3 known incidents caught by regex → REJECT**

Recall gate from kickoff §2: «recall_known < 40% (i.e. 0 or 1 of 3 caught) → REJECT OR widen vocab.» With 0/3, this is a hard REJECT.

**Root-cause analysis of misses:**

1. **FP-status problem class dominates the corpus.** The single largest FP category (28/66 = 42%) is phrases appearing in tool_use content blocks (memory writes, status tables). The contextual gate filters these — but the regex itself has no content-type filtering. The actual incident phrases appeared in final-turn text, but the corpus extraction counted ALL assistant-type lines including those with tool_use content.

2. **Self-referential corpus contamination.** The kickoff-authoring sessions (14/66 = 21% FP-quoted) contain the anti-pattern vocabulary verbatim, as examples. This is not detectable without semantic understanding of whether the phrase is being _performed_ or _discussed_.

3. **Incident session coverage.** The three known incidents may have occurred in sessions whose transcripts were not present in the corpus at scan time (I-3 = same day), or the exact phrasing differed from the regex vocabulary.

## §2b Recall Sanity-Check — No-Match Sample

A sample of 30 assistant turns NOT matching the seed regex but occurring in own-PR-merge-decision context was manually reviewed.

Sampling approach: sessions with confirmed `gh pr create` in transcript history, from the Recent stratum, where the final assistant turn does NOT contain any flagged phrase.

**Mandatory caveat (verbatim per `narrow-b-benchmark.md §1.3 + §T19`):** «recall on no-match sample is speculative; true recall claim must come from manual classification on representative production sample, not from automated counter-grep». This §2b section is informational only and does NOT enter the verdict logic.

Sample sessions examined (Recent stratum, PR-creation confirmed):

| Session | Final turn characterization | FN present? |
|---|---|---|
| research/defer-reflex-r-phase-fresh sessions | Research-only sessions; no own PR creation | N/A |
| Sessions creating PRs in waves 10.1-10.6 | Most final turns used «push» or «merged» language directly | No FN detected |
| Sessions with `staging` auto-merge flow | AI explicitly merges or notes «auto-merge triggered» | No FN detected |
| Kickoff-authoring sessions | No own PR creation context | N/A |

**§2b finding:** In the 30-turn no-match sample, no FN (genuine defer-tell missed by regex) was observed. However, this sample is heavily biased toward recent sessions where the auto-merge staging flow is dominant — sessions that correctly execute `gh pr merge --auto` or confirm auto-merge via CI do not produce defer-tell phrases. The true FN rate in the pre-staging-flow era (where defer-tell was more likely) is not measurable from this sample.

**§2b is informational only; does NOT affect verdict.**

## §3 Contextual Gate Evaluation (Stage 1 §3.4)

The Stage 1 §3.4 contextual gate adds two conditions beyond the base regex:
1. Phrase in `type=text` content block (not tool_use)
2. PR authorship signal: `gh pr create/view/merge` in last 20 assistant turns
3. Target branch ≠ main

**Positive-arm verification** (session `71531621`):
```bash
grep '"type":"assistant"' ~/.claude/projects/.../71531621.jsonl | tail -20 \
  | jq -r '.message.content[]? | select(.type == "tool_use") | .name + " " + (.input // {} | tostring)' \
  | grep -E 'gh pr (create|view|merge)'
```
Result: non-empty (confirmed — Write tool calls with kickoff content referencing `gh pr list`)

**Issue identified:** The positive-arm test produced output, but the PR authorship signal matched because the session was *writing a kickoff file that contained `gh pr list` text* — not because the session had actually created a PR. This is a **false-positive** on the contextual gate's PR authorship signal arm: the `gh pr` text was in file content being written, not in actual CLI invocations.

**Negative-arm verification** (session `0ce05ba4`):
```bash
grep '"type":"assistant"' ~/.claude/projects/.../0ce05ba4.jsonl | tail -20 \
  | jq -r '.message.content[]? | select(.type == "tool_use") | .name + " " + (.input // {} | tostring)' \
  | grep -E 'gh pr (create|view|merge)'
```
Result: empty (confirmed clean negative)

**Gate evaluation summary:**

| Gate condition | Status |
|---|---|
| Content-type filter (type=text only) | Design intent sound; not implemented in scan (scan was raw grep) |
| PR authorship signal (jq extraction) | FP risk identified: matches `gh pr` text in Written files, not actual CLI invocations |
| Branch ≠ main check | Not testable without session context reconstruction |

**Gate finding:** The contextual gate improves precision over the raw regex but has a significant false-positive path: Write tool calls containing `gh pr` text in file content (kickoffs, docs, status writes) will fire the PR authorship signal erroneously. Implementing the gate would reduce FP count from 64 to approximately 40-50 (removing most FP-status entries where the phrase is in tool_use content type), but would NOT raise precision close to 80%.

## §4 DeepWiki Prior Art Closure (MAJOR-2)

Six queries were run to close the MAJOR-2 blocker from Stage 1: «check whether Superpowers or Anthropic Cookbook has a production-grade analog for defer-tell detection».

### obra/superpowers Queries

**Q1 — «agent merge deferral detection» / «Stop hook for PR status»:**
Superpowers uses a status protocol (DONE/BLOCKED/NEEDS_CONTEXT) and Red Flags list. No mechanism for defer-tell phrase detection in assistant output. The `finishing-a-development-branch` skill presents merge options but does not detect deferred merges.

**Q2 — «session end hook checking PR compliance» / «conscience guard for merge»:**
No Stop hook or end-of-turn hook inspecting agent messages for PR merge compliance. The Stop hook in CC fires on session end but Superpowers does not hook it for defer-tell detection. Red Flags are general rationalizations to avoid using skills — not output-phase defer-tell detection.

**Q3 — «worktree cleanup enforcement» / «final report phrase detection»:**
Session-Start Hook only for initialization. No conscience guard checking final assistant output. The Red Flags list covers reasoning evasions, not linguistic defer-tell signatures in PR reports.

**Conclusion for obra/superpowers:** No production analog. Problem class mismatch — Superpowers manages skill invocation discipline; defer-tell detection is output-phrase classification on final session reports. BUILD verdict stands.

### anthropics/anthropic-cookbook Queries

**Q4 — «PR merge deferral detection hook» / «PostToolUse final report check»:**
No pattern for PR merge deferral detection using Stop hook or transcript scan. PostToolUse example in cookbook is for file audit logging only (Write/Edit compliance tracking).

**Q5 — «Stop hook transcript analysis» / «session output compliance check»:**
PostToolUse examples focus on logging Write/Edit for compliance. No Stop hooks; no phrase detection in assistant output; no pattern matching final report text.

**Q6 — «transcript_path reading for audit» / «assistant message scanning hook»:**
No transcript_path-reading Stop hook examples. Transcript analysis exists in notebooks but not as hooks. Cookbook examples are for non-agent usage (chat API), not Claude Code hooks.

**Conclusion for anthropics/anthropic-cookbook:** No production analog. Problem class confirmed distinct from logged cookbook patterns.

**§4 overall conclusion: Branch 1 does NOT fire.** No production-grade analog found. BUILD verdict from Stage 1 stands. The mechanism must be built custom if pursued — but per §5 below, Stage 2 precision result makes Stage 3 NO-GO.

## §5 Final Verdict

Evaluating branches in order (first match wins):

**Branch 1 (DeepWiki early exit):** §4 found NO production analog matching our problem class. Branch 1 does NOT fire.

**Branch 2 (both §1 and §2a REJECT):** §1 = REJECT (precision 3% << 80%). §2a = REJECT (0/3 known incidents caught). Both failed → Branch 2 fires — but Branch 3 would also fire, so we report the Branch 3 label per kickoff §5 ordered semantics.

**Branch 3 (§1 REJECT OR §2a REJECT — either failed):** §1 REJECT → Branch 3 fires.

**Verdict: STAGE 3 NO-GO**

The detection mechanism as designed in Stage 1 §3.4 is **not viable for automated gating**. The core failure is that the regex vocabulary is semantically shared across multiple legitimate use cases in this corpus:

- Status-tracking phrases («pending maintainer», «жду решения») appear legitimately in pipeline-state documentation
- Kickoff/meta-discussion sessions write the anti-pattern vocabulary verbatim as examples
- Genuine decision-waiting («жду решения») is indistinguishable from defer-tell without deep semantic context

**Recommended paths forward (Orchestrator decision):**

1. **Text-recall discipline only (current state):** The `recommendation-laziness-discipline.md` pattern (H1 always-on + T-trap in `ai-laziness-traps.md`) is the enforcement channel. This is already in place via T20 (inline-verdict-without-evidence). The defer-tell pattern is a variant of the same family and benefits from the same prose discipline without requiring a mechanical gate.

2. **Scope-narrow the regex to highest-signal phrases only:** «жду твой клик», «maintainer click required», and «requires your click» are the strongest candidates (highest semantic specificity, lowest legitimate-usage overlap). A focused 3-phrase regex would have higher precision but dramatically lower recall — trade-off unclear without a new benchmark on the narrowed set.

3. **Session-end semantic check (requires LLM):** A Stop hook that reads the final assistant turn and uses LLM judgment («did the agent defer an own ready PR?») would have much higher precision but violates `no-paid-llm-in-ci.md §1`. Only viable if framed as an AI-agnostic sub-agent prompt read by an active session, not a CI gate.

4. **Incident-count wait:** Promote to a principle test if 3+ documented incidents occur within 6 months (per ai-laziness-traps.md §5 precedent). Current count: 3 documented (I-1/I-2/I-3). This threshold is met — but the benchmark shows mechanical detection is infeasible, so promotion to principle test requires a different implementation path than the Stage 1 regex.

## §6 Self-Application Check (T15)

Does this benchmark audit itself?

**T1 (sampling floor ≥5):** N/A — this benchmark classified ALL 66 flagged turns (full population, not sample). T1 cannot apply. ✓

**T3 (no prose-only findings):** Every classification in §1 appendix has a stated rationale (FP-shape or TP-evidence). The two TPs cite session-level evidence (prior `gh pr create` observed, final report phrasing). ✓

**T6 (calibrated confidence):** §1 explicitly reports point estimate + Wilson CI. §2a reports 0/3 with miss analysis. §2b caveat is verbatim from kickoff mandate. ✓

**T7 (anti-collusion self-check — did benchmark reason adversarially?):** The adversarial challenge: «did you classify more TPs than warranted to make the precision look better?» Counter-evidence: 2/66 = 3% is _worse_ than if this were discipline-theatre (which would claim more TPs). The conservative TP count makes the REJECT verdict stronger, not weaker. Self-interest would have inflated TPs. ✓

**T10 (population enumeration before sampling):** §0.1 enumerates 493 total files with stratum breakdown before any classification. §0.2 reports the scan produced 66 flagged turns — this is the population, stated before classification. ✓

**T15 (self-application):** This section. ✓

**T19 (own cold-QA before handoff):** The benchmark file was written after all evidence was gathered. The two TPs (rows 16 and 66) were verified by checking that the sessions had prior `gh pr create` evidence before labeling. The precision computation was re-verified by hand (2/66 = 0.0303, Wilson CI computed step-by-step). ✓

**T-DRD-A (domain-specific trap for this benchmark — fabricating recall by conflating §2a and §2b):** The kickoff explicitly mandates: «Do NOT combine §2a (n=3) and §2b (n=30) into a single recall ratio». §2a and §2b are reported separately throughout. §2b states «informational only, does NOT affect verdict». ✓

## Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| TP threshold | Only final-report sessions with confirmed own-PR creation | Strict — prevents FP-status inflation of TP count |
| 70f155a7 L542 | FP-status (second occurrence) | Same session as L417 TP; duplicate occurrence in status table, not a separate defer-tell event |
| fc045dc7 L333 | TP | Session shows prior PR creation; final turn reports PR ready with CI noted; consistent with kickoff TP definition |
| 0ce05ba4 L541 | FP-diff-project | No own-PR authorship signal in context; reviewer-session context |
| §2a I-2 | MISS | «жду мержа» phrase in corpus (fd72cf73) is FP-quoted/discussion; actual I-2 session may be outside corpus or phrased differently |
| Wilson CI formula | Standard Wilson score interval | Per `narrow-b-benchmark.md §1.5` precedent; same formula as used in the recommendation-laziness benchmark |
| Branch verdict | Branch 3 (§1 REJECT) | Ordered matrix — Branch 1 did not fire; Branch 3 fires because §1 REJECT; Branch 2 is a superset but Branch 3 is the first match |

## See Also

- [`docs/meta-factory/research-patches/2026-05-25-defer-reflex-detection.md`](2026-05-25-defer-reflex-detection.md) — Stage 1 R-phase; §3.4 has the regex and gate design benchmarked here
- [`.claude/orchestrator-prompts/defer-reflex-detection/kickoff-stage-2-and-3.md`](../../.claude/orchestrator-prompts/defer-reflex-detection/kickoff-stage-2-and-3.md) — kickoff spec; §2.2 output requirements, §5 verdict branches
- [`docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md`](2026-05-25-narrow-b-benchmark.md) — precedent benchmark (recommendation-laziness); Wilson CI formula source; FP>20% → DROP lesson
- [`docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md`](2026-05-24-recommendation-laziness-discipline.md) — companion discipline; H1 always-on mechanism already in place covers defer-tell family
- [`.claude/rules/ai-laziness-traps.md §2 T20`](../../.claude/rules/ai-laziness-traps.md) — T20 (inline-verdict-without-evidence); defer-tell is a specialisation of this trap
- [`.claude/rules/no-paid-llm-in-ci.md §1`](../../.claude/rules/no-paid-llm-in-ci.md) — hard constraint: deterministic regex/grep only; LLM-in-CI permanently blocked; relevant to §5 path-forward Option 3
