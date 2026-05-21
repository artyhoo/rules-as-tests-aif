<!-- scope:recommendation-gate-iterative -->
# Research-patch — recommendation-moment gate (iterative) — Round 5

> **Continuation of:** [2026-05-21-recommendation-gate-iterative.md](2026-05-21-recommendation-gate-iterative.md) (Rounds 0–2, §0–§2), [2026-05-21-recommendation-gate-iterative-round-3.md](2026-05-21-recommendation-gate-iterative-round-3.md) (Round 3, §3), [2026-05-21-recommendation-gate-iterative-round-4.md](2026-05-21-recommendation-gate-iterative-round-4.md) (Round 4, §4). Read all three before this file.
> **Authoritative for:** Round 5 — the decision-needed surface for the maintainer (no reviewer-side strategy picks).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists); mechanism catalogue — see [2026-05-16-§17-think-time-gate.md §4](2026-05-16-§17-think-time-gate.md); the strategy/implementation decisions surfaced below are the MAINTAINER'S to make — this file does not pick.
> **Date:** 2026-05-21
> **Inherits authority from:** [research-patches/README.md](README.md) folder-level Authoritative-for header.

---

## §5 — Decision-needed surface (reviewer-discipline)

> **Governing rule:** [.claude/rules/reviewer-discipline.md §1–§2](../../../.claude/rules/reviewer-discipline.md). Every item below names a decision, describes both options' downstream consequences, and flags «→ maintainer / `/orchestrator` decides». This file issues NO strategy picks.

---

### §5.1 — DECISION-NEEDED: D6 — mechanism choice (central decision)

**Context:** The parent patch §7 bundle (H1+H10+W1, MEDIUM confidence, `2026-05-16-§17-think-time-gate.md §7`) pre-dated the Stop-hook errata. The errata (`2026-05-16-think-time-s17-gate-correction.md §3`) opened D6: three options for the maintainer. Round 3 dry-run now provides catch-rate evidence. Round 4 confirms all three prior-art verdicts (R2a/R2b/R2c) lack adversarial falsification — H2 and H10 would both have blocked them. The adversarial sentences now stated in round-4 §4.4 are embedded verbatim below.

**Mechanism one-liners:**

- **H2** (HOT, in-dialogue): Stop hook fires per assistant turn; scans `last_assistant_message` for verdict-shape keywords; blocks if SSOT citation / file:line evidence / adversarial counter absent. Prior-art verdict: ADOPT VOCABULARY (scan-pattern + ALLOW/BLOCK contract from springzero/codex-plugin-cc; per-turn firing from Claude Code harness). Source: main patch §2.2.
- **H10** (HOT, in-dialogue): verdict IS a structured tool call to `issue_verdict(...)`; schema enforces `ssot_id`, `evidence[]`, `adversarial_falsification`, `external_search_summary` at call-time before verdict prose exists. Prior-art verdict: BUILD (no production verdict-as-tool-call gate found). Source: main patch §2.3.
- **H1** (HOT, at turn-start): UserPromptSubmit hook injects a 4-step recommendation checklist into context before the AI turn; no structural enforcement. Prior-art verdict: ADOPT (SSOT #20, Claude Code hooks API). Source: main patch §2.1.

**Catch-rates and FP-rates (cited from round-3 §3.7):**

| Mechanism | Firm catch-rate | FP rate | Class coverage |
|---|---|---|---|
| H2 | 4/10 decidable = **40%** genuine verdict-keyword fires | **2/3 = 67%** (CTRL2 «no SSOT ID» + F3 topical noun) | MEDIUM for keyword-matching strategy-verdict; structural miss on keyword-bypass (5/11 cases) and factual-claim class |
| H10 | 5/9 firm = **56%** (up to 64% with partials) | **0/3 = 0%** | MEDIUM-HIGH for strategy-verdict; structural miss on framing (C4) and standalone factual claims (C7, F2); fabrication-bypass risk (schema enforces structure, not truthfulness — `2026-05-16-§17-think-time-gate.md §4 H10`) |
| H1 | 4/5 decidable-firm = PREDICATE-MATCH (instruction-compliance-dependent, not structural FIRE) | **0/3 = 0%** | PREDICATE-MATCH for factual-claim class (C7,C8,F2,F3); CANNOT-DETERMINE for strategy-verdict class (C1–C6, F1) — Q1 unresolved |

**Adversarial falsification sentences for R2a/R2b/R2c (verbatim from round-4 §4.4 — these were absent from the committed §2):**

> **R2a (H1 ADOPT):** «What would make the SSOT #20 ADOPT citation wrong for H1: if Claude Code hooks API has changed semantics since the SSOT entry was written, or if the `UserPromptSubmit additionalContext` field no longer injects at the moment of user turn.»

> **R2b (H2 ADOPT VOCABULARY / BUILD):** «What would make the H2 ADOPT VOCABULARY / BUILD wrong: if an existing production tool (not found in 5-phrasing search) implements per-turn recommendation-discipline scanning — in that case the BUILD verdict on scan predicates should become ADAPT.»

> **R2c (H10 BUILD):** «What would make the H10 BUILD wrong: if the MCP tool-call architecture already has a recommendation-gate implementation in a non-indexed repository, or if the tool-call enforcement model changes in a future Claude Code version.»

**Cost summary (latency / build / maintenance / prior-art):**

| | H2 | H10 | H1 |
|---|---|---|---|
| Build effort | LOW — bash hook extending existing Stop infrastructure; ALLOW/BLOCK contract established precedent (springzero) | HIGH — custom MCP server from scratch; restructures recommendation dialogue flow; `issue_verdict` schema design + registration | LOW — one-line addition to `inject-session-bootstrap.sh` |
| Latency cost | MEDIUM — fires after response is generated; block+reinject = retry loop per turn (4 loops for C3; round-3 §3.2) | LOW per-turn (schema validation at call-time, before prose generation) but HIGH if AI must restructure dialogue flow | ZERO — fires at UserPromptSubmit before AI turn |
| Maintenance | LOW — grep predicate; keyword list evolves | MEDIUM — MCP server versioning; schema migrations | LOW — text block in hook |
| Prior-art | ADOPT VOCABULARY (scan-pattern) / BUILD (predicates) | BUILD (no production analog) | ADOPT (SSOT #20) |

**D6 framing (correction §3 options — `2026-05-16-think-time-s17-gate-correction.md §3`):**

**Option (a) — accept H10 over H2 on revised rationale; treat parent §5.1 as superseded by errata:**
→ Consequence: H10 remains the primary HOT mechanism; H2 is not pursued. Revised argument: H10's advantage is «structured-tool semantics prevent verdict formation» (not «fires too late» — that argument is errata-invalidated). H1 ships as cheap interim. Implementation cost: HIGH for H10 (Wave 10 scope). 67% H2 FP rate is not incurred. No ADOPT-VOCABULARY savings from H2 prior art.

**Option (b) — re-open H2 vs H10 comparison; Stop hook is now viable; choose H2 as interim:**
→ Consequence: H2 ships as a HOT mechanism now (lower build cost, ADOPT VOCABULARY prior art lowers effort); H10 deferred to Wave 10 or dropped. 67% FP rate is accepted as operational cost (or predicate is refined to reduce FP). H2's keyword-bypass weakness (5/11 structural misses) is accepted residual. C4 and factual-claim class remain uncovered.

**Option (c) — treat both as viable; ship H10 first; retain H2 as deferred alternative:**
→ Consequence: H10 is the primary HOT investment; H2 is a fallback or complementary mechanism. Decision deferred until H10 implementation reveals practical constraints. Risk: two parallel open workstreams; neither fully validated before next Wave.

→ **maintainer / `/orchestrator` decides.** Dry-run results (round-3 §3.7) and errata impact (main §2.4) are the evidence base. No strategy pick in this file.

---

### §5.2 — Four Round-4 residuals (decision-needed items)

#### §5.2.1 — DECISION-NEEDED: Adversarial sentences — fold into D6 framing or leave in §4 only?

The three adversarial falsification sentences for R2a/R2b/R2c are stated in round-4 §4.4 (discovered after the committed §2 gap was found). They were NOT in the committed §2.1/§2.2/§2.3. Source: `2026-05-21-recommendation-gate-iterative-round-4.md §4.4`.

**Disclosure:** §5.1 above has already embedded these sentences as a drafting convenience — to give the maintainer the D6 mechanism verdicts together with their adversarial counters in one place. This embedding was a choice made by this file, not a maintainer decision. The maintainer may accept or reverse it.

**Option "keep the fold as embedded in §5.1" (current state of this file):**
→ Consequence: the maintainer sees the mechanism verdicts WITH their adversarial counters in the D6 decision-surface; §5.1 is self-contained; round-4 §4.4 remains the gap-discovery record. The embedded sentences stay in §5.1.

**Option "remove the fold from §5.1; leave adversarial sentences in §4 only":**
→ Consequence: §5.1 references D6 options (a)/(b)/(c) by label only; reader must cross-reference round-4 §4.4 for the adversarial counters. The three quoted R2a/R2b/R2c blocks in §5.1 above are removed, keeping only the option labels and cost table. Reduces §5.1 length; makes round-4 §4.4 the sole location for the sentences.

→ **maintainer / `/orchestrator` decides.** This includes deciding whether the fold currently in §5.1 stays or is removed. Whether to retroactively amend the committed §2 is a separate question addressed in §5.2.4.

---

#### §5.2.2 — DECISION-NEEDED: R1 shortlist meta-decision lacks ssot_id — does it count as a "recommendation" the H10 schema must gate?

The shortlist sentence «Shortlisted: H1, H2, H10» (main §2.0) has `ssot_id` absent and no external-search summary for the shortlist-selection meta-decision itself. Source: `2026-05-21-recommendation-gate-iterative-round-4.md §4.2 R1`. H10's schema BLOCKS it on those fields.

This is an implementation-boundary question: does a meta-synthesis sentence («here are the candidates for deeper examination») require the same `issue_verdict(...)` call as a final ADOPT/DEFER verdict?

**Option "shortlist selections ARE recommendations — H10 schema applies":**
→ Consequence: the `issue_verdict` schema applies to shortlist decisions; `verdict_type` must include a "SHORTLIST" or "EXAMINE" type; `ssot_id` must reference each shortlisted item's existing prior-art entry; `external_search_summary` must cover the selection rationale. Build effort for H10 increases (more `verdict_type` enum values; more intermediate schema calls). Research documents become more schema-disciplined.

**Option "shortlist selections are NOT recommendations — H10 schema does not apply":**
→ Consequence: `issue_verdict` is scoped to final ADOPT/DEFER/BUILD/REJECT/RECOMMEND/RULE_CHANGE verdicts only; intermediate research selections are prose-only. The R1 H10-BLOCK finding is a false positive on the schema (design-scope mismatch). Simpler H10 implementation.

→ **maintainer / `/orchestrator` decides.** This is a schema-design boundary the H10 implementer must resolve before building. Round 4 surfaces it as a borderline ambiguity (`2026-05-21-recommendation-gate-iterative-round-4.md §4.5 "What this self-application CANNOT establish" item 2`).

---

#### §5.2.3 — DECISION-NEEDED: H2 fires on the patch's own §2 meta-discourse — 67% FP rate confirmed self-referentially. Is that FP rate acceptable for a HOT gate?

H2's predicate fires on R2a («ADOPT» in «H1 extends the existing `inject-session-bootstrap.sh` (SSOT #20, ADOPT).»), R2b («ADOPT VOCABULARY» + «BUILD verdict»), and R2c («VERDICT» in «Prior-art verdict: BUILD»). These are citations of prior-art verdicts in research-patch prose, not verdict-issuance acts. Source: `2026-05-21-recommendation-gate-iterative-round-4.md §4.1`.

The Round-3 dry-run found a 67% FP rate on control cases (round-3 §3.7). The Round-4 self-application confirms that the same FP shape instantiates on research-patch meta-discourse — the patch's own mechanism descriptions trigger H2's keyword predicate.

**Option "67% FP rate is acceptable — H2 ships as-is with known FP":**
→ Consequence: H2 fires frequently in research/meta-discourse contexts; each false-positive triggers a BLOCK + reinject cycle; operational cost in research sessions is high. H2's lower build cost (LOW vs H10's HIGH) and ADOPT VOCABULARY prior art (scan-pattern from springzero, round-3 §3.7) remain available advantages. FP rate may be reduced by adding a meta-discourse exemption — but that refinement is a separate implementation decision and may introduce new false-negatives.

**Option "67% FP rate is disqualifying for a HOT gate — H2 requires predicate refinement before shipping":**
→ Consequence: H2 is not shipped until the predicate distinguishes verdict-issuance acts from topical-noun usage and citation-of-existing-verdict contexts. Refinement effort is non-trivial (requires context-window or parse-level awareness). H10's 0% FP rate (round-3 §3.7) is the factual contrast on FP grounds; H10's higher build cost (HIGH vs H2's LOW, cost table in §5.1) is the factual contrast on effort grounds.

→ **maintainer / `/orchestrator` decides.** The FP rate was deterministic in round-3 §3.4, CTRL2 + F3; the self-application confirms the same shape on production prose. No judgment call on acceptability in this file.

---

#### §5.2.4 — DECISION-NEEDED: Retroactively amend main §2 to add adversarial counters, or accept the gap as-documented in §4?

The committed §2.1/§2.2/§2.3 lack Step 4 adversarial falsification sentences for all three prior-art verdicts (R2a/R2b/R2c). This is a standing gap in the committed artifact (commit 6bbde92). Source: `2026-05-21-recommendation-gate-iterative-round-4.md §4.4(b)` — «the patch introduces the adversarial-counter requirement but did not apply it to its own §2 recommendations».

**Option "retroactively amend main §2" (add adversarial sentences to §2.1, §2.2, §2.3):**
→ Consequence: the committed patch gains the adversarial counters it was missing; the gap is fixed in-place; future readers of §2 see the complete H1/H2/H10 prior-art verdicts with their falsifications. Requires an additional commit touching the main patch file. Consistent with the h2/h10 enforcement logic (they would have blocked §2 until the sentences existed).

**Option "accept the gap as-documented in §4; do not amend main §2":**
→ Consequence: the gap is acknowledged in round-4 §4.4 and the sentences are stated there; main §2 remains incomplete but its incompleteness is now traceable. The iterative-patch structure documents the discovery process; amending earlier rounds retroactively conflates the record. Consistent with append-only patch discipline (research-patches/README.md folder authority).

→ **maintainer / `/orchestrator` decides.** The gap is factual; both paths acknowledge it. This file has already embedded the adversarial sentences in §5.1 for the D6 framing purpose (Option "fold" path from §5.2.1), which partially mitigates the documentation gap regardless of which amendment option is chosen.

---

### §5.3 — DECISION-NEEDED: Consolidation — merge overlapping scope with un-executed `autonomous-self-audit-research` R-phase?

**Scope verification (T16 — verify from the actual research-prompt.md, not from the name):**

Reading `autonomous-self-audit-research/research-prompt.md` §Q1 (lines 51–69): the un-executed R-phase addresses the **no-self-trigger gap** — AI structurally does not initiate self-check without external trigger. Its candidate categories are: A (CC hooks — Stop/PreToolUse/PostToolUse/SubagentStop/UserPromptSubmit), B (skill auto-trigger), C (AI-agnostic sub-agent invocation), D (structured output schema), E (pre-completion checklist), F (external LLM — excluded by no-paid-llm-in-ci), G (hybrid combinations — A+B, B+C, etc.). The 2026-05-21 refresh note (lines 8–9) confirms a live `end-of-turn-reminder.sh` Stop hook already shipped as a partial A/E instantiation (PR #71 → d695ac5); the un-executed R-phase must answer «what does the existing Stop hook NOT catch?», not «does candidate A exist?».

**Overlap nerve:** both this patch and the un-executed R-phase study the recommendation-moment / failure-without-external-trigger problem. H2 (this patch) is a Stop hook that fires per turn and scans for recommendation-discipline failures — structurally the same event type as candidate A/E in the companion. The live `end-of-turn-reminder.sh` hook is already a partial instantiation of both A and E.

**Scope difference:** this patch is scoped to the *per-verdict gate* — does the AI have the required evidence when it issues a verdict? The un-executed R-phase is scoped to the *session-level self-trigger* — does the AI initiate self-check at all before declaring «done»? The two failure modes are related (both are triggered at session-close or turn-close) but distinct: one is per-verdict gate at the moment of recommendation-formation; the other is session-end checklist before the AI stops.

**Option "merge" — combine this re-validation scope with the un-executed autonomous-self-audit R-phase into one R-phase:**
→ Consequence: one coherent R-phase covering both per-verdict gate (H2/H10/H1 from this patch) and session-level self-trigger (candidates A–G from companion). Less fragmentation; the live `end-of-turn-reminder.sh` hook becomes the common evidence anchor. Larger un-scoped session risk: the merged scope spans mechanism design (already done here for H1/H2/H10) plus no-self-trigger mechanism design for A/B/C/D/E/G — two distinct research questions in one session. The un-executed R-phase's dispatch-timing decision (promote now vs. await Wave 10 — `open-questions.md §13.34`) must be resolved first or the merged scope inherits that uncertainty.

**Option "keep separate" — this patch ships its decision-surface independently; autonomous-self-audit stays its own scoped session:**
→ Consequence: this re-validation completes as a self-contained decision surface (§5 done, maintainer decides on D6); the companion R-phase is dispatched separately with its own timing decision (per `open-questions.md §13.34` trigger criteria). Less coverage of the common Stop-hook nerve in one session, but each session has a clear done-criterion and bounded scope. The live `end-of-turn-reminder.sh` hook serves as evidence in the companion session's Q1 (candidate A — «what does it NOT catch?»), independent of this patch's results.

→ **maintainer / `/orchestrator` decides.** Kickoff §6 explicitly designates this as the Round 5 decision-surface item, not a reviewer-side pick (`kickoff.md §6`: «surface in Round 5 as decision-needed»).

---

### §5.4 — Gate 5 self-check

**Strategy-imperative phrase grep (T7 — run it, do not claim it):**

```bash
grep -inE "(we should|I recommend|the decision is|the best option|stronger choice|go with|should (adopt|use|defer|build|ship)|I suggest)" \
  /Users/art/code/rules-as-tests-aif-recgate/docs/meta-factory/research-patches/2026-05-21-recommendation-gate-iterative-round-5.md
```

Output (run against the final file — actual result; regex truncated in display to avoid self-referential hits):

```text
line 157 — the bash code block containing the grep command itself
line 164 — this output block quoting line 157
```

**1 hit. False-positive diagnosis:**
- Line 157: the grep command string itself inside the `bash` code block — the regex pattern contains the keywords being searched. Code-block content, not a first-person prose assertion.

**0 genuine strategy-imperative phrases in §5 prose.**

**Gate 5 table:**

| Surfaced item | Names both/all options? | Consequence per option? | «Maintainer/orchestrator decides» flag? | Zero reviewer-side strategy pick? |
|---|---|---|---|---|
| §5.1 D6 — H2 vs H10 vs combination | YES — options (a)/(b)/(c) from correction §3 | YES — cost, coverage, FP rate, build effort per option | YES — «→ maintainer / `/orchestrator` decides» at end | YES — no mechanism recommended |
| §5.2.1 — adversarial sentences fold/leave | YES — "fold" vs "leave in §4" | YES — D6 self-containment vs cross-reference burden | YES — «→ maintainer / `/orchestrator` decides» | YES |
| §5.2.2 — R1 shortlist scope boundary | YES — "applies" vs "does not apply" to H10 schema | YES — implementation complexity vs simpler schema | YES — «→ maintainer / `/orchestrator` decides» | YES |
| §5.2.3 — H2 67% FP rate acceptability | YES — "acceptable" vs "disqualifying" | YES — operational FP cost vs refinement effort | YES — «→ maintainer / `/orchestrator` decides» | YES |
| §5.2.4 — retroactive §2 amendment | YES — "amend" vs "accept gap as-documented" | YES — patch completeness vs append-only discipline | YES — «→ maintainer / `/orchestrator` decides» | YES |
| §5.3 — consolidation with companion R-phase | YES — "merge" vs "keep separate" | YES — coherent scope vs bounded session risk | YES — «→ maintainer / `/orchestrator` decides» | YES |

**Count of surfaced items:** 6 (§5.1 + four §5.2 sub-items + §5.3).

**T-recgate-B confirmation:** Round 4 ran the self-application gate over this patch's own mechanism recommendations before Round 5 was authored. The patch's recommendations (R2a/R2b/R2c) were gated in round-4 §4.1–§4.3 (H2 BLOCK, H10 BLOCK, H1 Step-4-ABSENT — all three). The adversarial sentences now stated in round-4 §4.4 are the gate-result that Round 5 surfaces. The mechanism recommendation is NOT issued un-gated: the round-4 findings surface the standing Step-4 gap, and this file propagates the adversarial sentences rather than issuing new un-gated verdicts. T-recgate-B counter is satisfied.

**Closing:** this file issues NO GO/REVISE verdict and NO strategy pick. All six items name options and consequences; all six flag «maintainer / `/orchestrator` decides». The grep above found 1 hit (line 157 — the grep command itself in its own code block); 0 genuine strategy-imperative phrases in §5 prose.

---

## Citations used in this file

| Citation | What it grounds |
|---|---|
| `2026-05-16-§17-think-time-gate.md §7` | §7 bundle (H1+H10+W1, MEDIUM confidence) — §5.1 context |
| `2026-05-16-think-time-s17-gate-correction.md §3` | D6 options (a)/(b)/(c) — §5.1 option framing |
| Main patch §2.2 | H2 one-liner + prior-art verdict ADOPT VOCABULARY/BUILD |
| Main patch §2.3 | H10 one-liner + BUILD verdict |
| Main patch §2.1 | H1 one-liner + SSOT #20 ADOPT |
| Main patch §2.4 | D6 «what changed / what did NOT change» |
| Round-3 §3.7 | Catch-rates (H2 4/10 40%; H10 5/9 56%; H1 PREDICATE-MATCH 4/5); FP rates (H2 67%, H10 0%) |
| Round-3 §3.2 | H2 latency: 4 retry loops for C3 |
| Round-3 §3.4 CTRL2 + F3 | H2 FP causes: «no SSOT ID» + topical-noun regex |
| Round-4 §4.4 | Adversarial sentences for R2a/R2b/R2c (verbatim) |
| Round-4 §4.1 | H2 fires on patch's §2 meta-discourse (§5.2.3 evidence) |
| Round-4 §4.2 R1 | R1 shortlist ssot_id absent (§5.2.2) |
| Round-4 §4.4(b) | Committed-text Step-4 gap (§5.2.4) |
| Round-4 §4.5 «CANNOT establish» item 2 | R1 borderline ambiguity (§5.2.2) |
| `autonomous-self-audit-research/research-prompt.md §Q1 lines 51–69 + lines 8–9` | Companion scope (T16 verify) — §5.3 |
| `open-questions.md §13.34` | Companion dispatch-timing uncertainty — §5.3 |
| Kickoff §6 | Consolidation surfaced as Round 5 decision-needed (not reviewer pick) — §5.3 |
| Kickoff §3 Round 4 | T-recgate-B counter satisfied — §5.4 |
