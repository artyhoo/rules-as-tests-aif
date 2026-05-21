<!-- scope:recommendation-gate-iterative -->
# Research-patch — recommendation-moment gate (iterative re-validation)

> **Authoritative for:** iterative re-validation of the think-time-gate §7 recommendation bundle (H1+H10+W1, MEDIUM confidence); anchor consolidation of what is already decided; Round 0 of the iterative research structure described in [`.claude/orchestrator-prompts/recommendation-gate-iterative/kickoff.md`](./../../../.claude/orchestrator-prompts/recommendation-gate-iterative/kickoff.md).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The mechanism catalogue and prior-art evidence — those are authoritative in the predecessor patch (§0.1 below). Strategy/implementation decision — maintainer after Round 5 surfaces decision-needed.
> **Date:** 2026-05-21
> **Status:** COMPLETE — all 5 rounds done + committed (Gates 0–5 PASS). §3/§4/§5 each split to per-round files for the 500-line limit (see §3–§5 block below). Round 5 = decision-needed surface for the maintainer (reviewer-discipline: no pick). Open maintainer decisions live in [round-5](2026-05-21-recommendation-gate-iterative-round-5.md) §5: D6 mechanism choice (H2 vs H10 vs combination), four Round-4 residuals, and consolidation-with-autonomous-self-audit. (Round 3 Gate 3: H2 4/10 + 67% FP; H10 5/9 + 0% FP; no single mechanism covers both classes. Round 4 Gate 4: patch's own §2 verdicts skipped Step 4 adversarial falsification.)
> **Predecessor:** [2026-05-16-§17-think-time-gate.md](2026-05-16-§17-think-time-gate.md) (mechanism catalogue, §4 H1–H11 + W1–W4, §7 recommendation bundle) + [2026-05-16-think-time-s17-gate-correction.md](2026-05-16-think-time-s17-gate-correction.md) (Stop-hook errata). This patch is a **re-validation** of those delivered conclusions (Option B, maintainer decision 2026-05-21), NOT a replacement or re-derivation.
> **Inherits authority from:** [research-patches/README.md](README.md) folder-level Authoritative-for header.

---

## §0 Anchor consolidation — what is already decided / delivered / verdicts issued

> **Gate 0 self-declaration:** This section cites the delivered patch by reference throughout. The mechanism catalogue is NOT re-derived here. All H/W descriptions are one-line pointers to `2026-05-16-§17-think-time-gate.md §4` — the authoritative source.

### §0.1 Mechanism catalogue — by reference

Full catalogue lives at `2026-05-16-§17-think-time-gate.md §4`. Catalogue items enumerated below as references only (no re-description):

**HOT class (in-dialogue, fires before verdict reaches user):**

| ID | One-line label | Patch §4 location |
|---|---|---|
| H1 | UserPromptSubmit hook injection extension — add recommendation-specific checklist to existing digest | `§4 H1` |
| H2 | Stop hook post-turn audit — scan `last_assistant_message` for verdict-shape phrases, block if no evidence | `§4 H2` |
| H3 | Skill auto-trigger expansion — harness-architectural constraint: NOT supported (AI-output trigger unavailable) | `§4 H3` |
| H4 | In-conversation TodoList discipline — AI creates TodoWrite checklist before each verdict | `§4 H4` |
| H5 | MCP server pre-output validator (`verdict_gate` tool) — custom MCP, AI must call before verdict prose | `§4 H5` |
| H6 | Multi-pass output / visible second pass — explicit re-read draft through numbered checklist | `§4 H6` |
| H7 | Confidence calibration discipline — verbal hedge ban in verdict context | `§4 H7` |
| H8 | Pre-output sentinel scan (sub-agent reviewer) — Elicitation hook verified INAPPLICABLE (see §0.3) | `§4 H8` |
| H9 | Adversarial counter-prompt requirement inline — mandatory «What would make this wrong?» per verdict | `§4 H9` |
| H10 | Tool-call-as-gate — verdict IS a structured tool call; schema enforces required SSOT + evidence fields | `§4 H10` |
| H11 | Behavioural eval suite — fixed test battery of recommendation-discipline scenarios (WARM/COLD shape) | `§4 H11` |

**WARM/COLD class (fires at commit-time or post-merge):**

| ID | One-line label | Patch §4 location |
|---|---|---|
| W1 | Recommendation-anchored §1.7 gate — remove research-patches allowlist for `## Verdict:`/`## Recommendation:` bearing patches | `§4 W1` |
| W2 | Compliance-verifier expansion to research-patch §6 decisions | `§4 W2` |
| W3 | Two-AI session discipline — fresh session reviews recommendations before maintainer acts | `§4 W3` |
| W4 | Maintainer-facing review protocol (friction-based checklist, human gate) | `§4 W4` |

### §0.2 Delivered §7 recommendation bundle

Source: `2026-05-16-§17-think-time-gate.md §7`.

**Bundle: H1 + H10 + W1.**

- **H1 extension now** (`§7.1` rationale): cheap (one-line addition to [`.claude/hooks/inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh)), reversible, adds specificity missing from current injection (generic goal/invariants vs. specific SSOT-row + context7 + file:line + adversarial-counter instruction). Rationale: the 2026-05-13 session had generic injection but not specific recommendation-verification steps — gap may be specificity, not text-in-context as mechanism.
- **H10 scoped into Wave 10** (`§7.1` rationale): verdict-as-tool-call is architecturally strongest HOT mechanism — schema enforces structure at call-time; prose shortcutting structurally prevented. Wave 10-scale work, fits TS-core migration.
- **W1 now** (`§7.1` rationale): modify `S17_ALLOWLIST_RE` at [`.husky/pre-push:317`](../../../.husky/pre-push) to exclude recommendation-bearing patches (`## Verdict:` / `## Recommendation:` headers). Closes WARM gap.

**Confidence declared by delivering patch:** MEDIUM (`§7.4` verbatim: «reasonable bet, not a verified finding»). Q1 (does H1 extension empirically change behaviour?) explicitly unanswered.

**Why W3 not primary** (`§7.2`): same-model-class reviewer risks `#reviewer-as-secondary-orchestrator` per [`.claude/rules/reviewer-discipline.md §3`](../../../.claude/rules/reviewer-discipline.md); empirical precedent — 2026-05-09 incident where reviewer-cycle reinforced wrong goal.

**Why HOT gate not declared impossible** (`§7.3`): H1's causal mechanism is unresolved (instruction insufficiency vs. fundamental cognitive limitation); H10's tool-schema enforcement property is genuine without requiring after-turn hook.

### §0.3 Errata correction

Source: `2026-05-16-think-time-s17-gate-correction.md §2`.

**What the parent patch claimed (`§5.1`):** Stop hook fires once at session end; therefore H2 cannot intercept per-turn verdicts.

**What is actually true:** Stop hook fires **per assistant turn** (`StopHookInput`); `SessionEnd` is a separate event. Evidence: TypeScript SDK `StopHookInput` and `SessionEndHookInput` are distinct interfaces — type-system evidence over prose (`correction §2`).

**Impact on parent patch (`correction §3`):** H2 temporal-coverage argument changes — H2 *can* intercept per-turn verdicts. Architectural conclusion (H10 over H2 bundle) **survives** but reasoning shifts: H10 advantage is now «structured-tool semantics that Stop hook's stream-edit model does not provide», not «fires too late». Maintainer decision D6 (re-open H2 vs H10 comparison / accept H10 on revised rationale / treat both as viable) is open (`correction §3`).

**What the errata invalidated in §5.1:** the «fires at session end» premise used to argue against H2. The §7 bundle recommendation (H1+H10+W1) is not invalidated but its rationale for H10-over-H2 requires the revised argument.

**Methodological finding promoted to §1.10:** Three-channel verification (Worker WebFetch + Reviewer WebFetch converged on prose misreading; Orchestrator + claude-code-guide subagent with TypeScript SDK resolved definitively) demonstrated that type-system evidence is more reliable than prose for SDK-shaped claims. This candidate was surfaced in `correction §4` and promoted to [`phase-research-coverage.md §1.10`](../../../.claude/rules/phase-research-coverage.md) as «Type-system over prose for SDK-shaped claims».

### §0.4 Open questions Q1–Q3 (verbatim-brief)

Source: `2026-05-16-§17-think-time-gate.md §6`.

**Q1** (`§6 Q1`): Does H1 extension (more specific recommendation instruction) empirically change AI behaviour? Three options: (a) ship as cheap interim attempt, (b) skip if text-in-context fundamentally insufficient, (c) structured empirical comparison ≥5 sessions. Maintainer decides.

**Q2** (`§6 Q2`): HOT mechanism priority — H10 (tool-call-as-gate, architectural investment) vs H2+H9 (Stop hook combination, weaker but cheaper)? Sub-question Q2.1 retracted post-errata: Elicitation hook verified INAPPLICABLE (MCP-dialog-only, NOT general output interception — `§5.2` verified). Revised sub-question: given no after-turn hook exists, is H10 worth architectural investment over H1 as HOT-mechanism ceiling?

**Q3** (`§6 Q3`): Scope placement — (a) Wave 9.x interim H1 now + Wave 10/11 structural, (b) Wave 10 inline (blocked on Wave 9 M1-M5), (c) new §13.34 umbrella, (d) accept gap permanently (W4 maintainer checklist only).

### §0.5 Companion autonomous-self-audit scope

`autonomous-self-audit-research/research-prompt.md` covers the **no-self-trigger gap** — AI structurally does not initiate self-check without external trigger. Distinct from this patch's focus (think-time gate at recommendation-formation moment) but overlapping nerve: both study recommendation-moment failure, just at different granularities (session-level self-trigger vs. per-verdict gate). Scope overlap to be surfaced as decision-needed in Round 5 (merge vs. keep separate — per kickoff §6, reviewer-discipline: do not pick strategy).

---

## §0.6 What Round 0 establishes for later rounds

Later rounds (1–5) re-validate the §7 bundle (H1+H10+W1) against a corpus under structural gates. They do NOT re-derive the mechanism catalogue. Specifically:

- **Round 1** builds the corpus of real + fabricated «wrong recommendation at think-time» cases with ground-truth labels.
- **Round 2** shortlists 2–3 catalogue candidates and verifies prior-art only for delta cases (H2 re-examination given Stop-hook errata; any candidate not in delivered `§5`).
- **Round 3** paper-prototypes the top candidate and dry-runs it against the full Round 1 corpus; reports catch-rate and false-positive-rate per case.
- **Round 4** runs the selected mechanism on the verdicts of this research-patch itself (T15 + T-recgate-B self-application).
- **Round 5** surfaces decision-needed for maintainer (mechanism, catch-rate, cost, class HOT/WARM) without strategy choice.

The §7 bundle is the **null hypothesis** for this re-validation: «H1+H10+W1 at MEDIUM confidence is the correct recommendation». Round 0 establishes the anchor; Rounds 1–4 test it; Round 5 reports whether it survives, narrows, or requires revision.

---

## Tags

`#recommendation-skips-own-discipline` `#think-time-gap` `#temporal-scope` `#hot-vs-cold-gate` `#iterative-revalidation` `#anchor-consolidation`

---

## §1 — Corpus of wrong-recommendation-at-think-time cases

> **Round 1 status:** COMPLETE. Gate 1 self-check at end of section.
> **T-recgate-A compliance:** this section contains NO catch-rate or mechanism-coverage claims. Those belong to Round 3.

### §1.0 Population enumeration

**Order discipline (T10): population is stated here, before any individual case is presented.**

The full known population of documented «load-bearing wrong recommendation issued at think-time» incidents consists of sources that explicitly name a failure of the shape: AI issued a confident recommendation (ADOPT/DEFER/RECOMMEND/VERDICT or equivalent claim about the correct project path) before any commit existed, without adequate verification, and the error was consequential enough to be recorded in a project artefact.

**Known source documents searched for population:**

| Source | Cases found | Nature of evidence |
|---|---|---|
| `2026-05-16-§17-think-time-gate.md §1` (table, lines 17–21) | 5 | Numbered table of recommendations from the 2026-05-13 dialogue session (PR #51 incident) |
| `2026-05-13-pr-body-s17-substance-gap.md §6.7` (lines 347–364) | 3 (overlap with above; same 5 incidents, different framing — confirms not distinct) | Meta-observation prose paragraph naming the same 5 + noting 3 prior incidents listed in `#recommendation-skips-own-discipline` corpus |
| `.claude/rules/phase-research-coverage.md §4 line 113` — `#recommendation-skips-own-discipline` corpus | 3 prior incidents named explicitly | «PR #16 EXECUTION-PLAN drift; the «defer until consumer pain» reasoning anti-pattern across 4 turns of one session; L3 generated-docs research recommendation 2026-05-09» |
| `.claude/orchestrator-prompts/autonomous-self-audit-research/research-prompt.md` §incident table (lines 21–27) | 6 catch/trigger pairs | Table enumerates every documented «catch» requiring external trigger in one session chain; not all are think-time recommendation errors — some are annotation/citation/drive-by-scope misses |

**Population count method:**

From the sources above, the incidents that match the specific definition («wrong recommendation issued at think-time, before any commit, consequential enough to record») are:

- **PR #51 session cluster (2026-05-13):** 5 incidents, all confirmed in `§17-think-time-gate.md §1` table. These are the anchor corpus. 1 case from this cluster is also framed in `pr-body-s17-substance-gap.md §6.7` confirming the same count.
- **`#recommendation-skips-own-discipline` prior instances:** 3 explicitly named in `phase-research-coverage.md §4 line 113` — PR #16, defer-until-consumer-pain 4-turn case, L3 generated-docs 2026-05-09. These are pre-PR-#51 incidents.
- **Autonomous-self-audit incident table:** 6 catch/trigger pairs. Of these, 3 directly match the think-time-recommendation definition (numeric claim error, negative-existence claim, drive-by commit scope addition). The other 3 (F1-F6 handoff findings, NIT line citation, missing annotation) are adjacent but are accuracy/completeness failures at write-time rather than think-time recommendation errors at the recommendation-formation moment — they are borderline and included as separate population sub-class below.

**POPULATION TOTAL:**

- **Core think-time recommendation errors (strict definition):** 8 documented cases (5 from PR-#51 session + 3 from `#recommendation-skips-own-discipline` corpus).
- **Adjacent at-write-time accuracy failures (broader class):** at least 3 additional from the autonomous-self-audit table; these share the «external trigger required» shape but are not «wrong recommendation» per se — they are «wrong fact/claim at write time». Included as a separate sub-class in §1.1 for completeness; excluded from strict denomination in the Gate 1 ≥8 count.

**Denominator for subsequent rounds:** **8 real cases** (strict) + at least 3 fabricated edge-cases (§1.2). Total corpus for Round 3 dry-run: ≥11 cases.

---

### §1.1 Real cases

Each case carries: (i) short ID, (ii) one-line description, (iii) file:line or incident ref, (iv) ground-truth (what was wrong), (v) which channel should have caught it (HOT / WARM / COLD).

---

**C1 — «Substance backward-check was correct» (unverified handoff claim)**

- **ID:** C1
- **Description:** AI accepted a kickoff handoff claim that the PR #51 backward-check substance was correct, stated it in §1 of the research-patch without independent verification.
- **Evidence:** `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md:19` — table row 1: «§1 of the research-patch claimed «substance backward-check был correct» — `#discipline-application-scope-blindness` sub-case (c) — claim from kickoff handoff accepted without independent grep».
- **Ground-truth:** The claim was taken directly from handoff without running a grep to verify. The actual finding (backward-check DID have a substance gap) contradicted it. This is a «trust-collaborator-claim» failure at the recommendation-formation moment.
- **Channel that should have caught it:** HOT (in-dialogue, before the claim shipped in the response). A per-recommendation verification instruction (H1-class extension) requiring «state the independent grep you ran before accepting a collaborator's factual claim» would have surfaced the missing verification.

---

**C2 — Q3 DEFER Danger JS (build-vs-reuse rationalization)**

- **ID:** C2
- **Description:** AI recommended DEFER for Danger JS in Q3 with 5 arguments («hand-roll cheaper», «lock-in», «minimal deps», etc.) — directly rationalizing against the project's own build-vs-reuse principle.
- **Evidence:** `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md:20` — table row 2: «Q3 DEFER Danger JS with 5 arguments («hand-roll cheaper», «lock-in», etc.) — `#recommendation-skips-own-discipline` — rationalisation against project's own build-vs-reuse principle». Also: `docs/meta-factory/research-patches/2026-05-13-pr-body-s17-substance-gap.md:311` — «The DEFER reasoning («hand-roll cheaper», «lock-in», «minimal deps») is exactly the path-of-least-resistance rationalisation that build-vs-reuse discipline was created to block.»
- **Ground-truth:** The recommendation violated the build-first-reuse-default discipline explicitly; the verdict reversed to ADOPT after maintainer challenge. The error was not factual (Danger JS exists and was described accurately) but disciplinary (the reasoning path bypassed SSOT consult and BFR-default application).
- **Channel that should have caught it:** HOT. At the moment the AI was forming the DEFER verdict, a required step «before issuing DEFER on a library: state which SSOT entry you consulted and run the T16 problem-class check» would have exposed the gap. WARM (W1 research-patch allowlist removal) would not catch this because no commit existed yet.

---

**C3 — Four-turn hand-roll defence (prolonged rationalization under challenge)**

- **ID:** C3
- **Description:** After C2 was initially challenged, the AI defended the DEFER verdict across 4 dialogue turns with additional rationalizations (the «same anti-pattern extended», per source).
- **Evidence:** `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md:21` — table row 3–5: «3 additional dialogue turns defending hand-roll verdict — Same anti-pattern extended across 4 turns total under challenge». Also `docs/meta-factory/research-patches/2026-05-13-pr-body-s17-substance-gap.md:352` — «Hand-roll defence arguments through 4 dialogue turns — same anti-pattern, prolonged».
- **Ground-truth:** The structural failure here is «same-session bias» — once the AI committed to DEFER in C2, it defended it under challenge rather than re-running the discipline check from scratch. This is a distinct failure shape from C2: C2 is wrong initial verdict; C3 is failure to revise on valid challenge.
- **Channel that should have caught it:** HOT. A Stop-hook (H2) that fires at session end and scans the transcript for verdict-defence patterns without accompanying evidence update would catch C3's shape — it would detect that the same verdict phrase appeared in turns 2–5 without any new file:line evidence being added across those turns. W3 (fresh session) would also catch by design — a new session has no prior commitment to DEFER.

---

**C4 — PR #16 EXECUTION-PLAN drift (recommendation elevated goal)**

- **ID:** C4
- **Description:** A recommendation in or around PR #16 introduced «recursive self-application is the north star» language in EXECUTION-PLAN.md §1, silently redefining the project goal (the `#operational-doc-redefines-goal` anti-pattern).
- **Evidence:** `.claude/rules/phase-research-coverage.md:113` — `#recommendation-skips-own-discipline` corpus entry: «Surfaced repeatedly across distinct sessions (PR #16 EXECUTION-PLAN drift; ...». Also: `.claude/rules/doc-authority-hierarchy.md` origin block (visible in session-bootstrap context): «2026-05-09 goal-hierarchy restructure incident — `EXECUTION-PLAN.md §1` silently re-defined the project's goal as «recursive self-application is the north star», overriding `README.md#why-this-exists`».
- **Ground-truth:** The recommendation to frame «recursive self-application» as «north star» in an operational doc exceeded the doc's authority scope and contradicted README's goal declaration. The error persisted undetected for months (per doc-authority-hierarchy.md origin) before surfacing in a reviewer cycle.
- **Channel that should have caught it:** HOT at recommendation-formation time was absent; the claim shipped in the session response and was accepted into a commit. WARM (§1.7 gate) was not yet designed for this shape. COLD (post-merge reviewer) eventually caught it, but only after the drift accumulated over months.

---

**C5 — «Defer until consumer pain» (4-turn deferral rationalization)**

- **ID:** C5
- **Description:** Across a 4-turn session, the AI recommended «defer until there is consumer pain» as a verdict against some capability/discipline, rationalizing the deferral without applying the project's build-vs-reuse SSOT consult.
- **Evidence:** `.claude/rules/phase-research-coverage.md:113` — `#recommendation-skips-own-discipline` corpus: «the «defer until consumer pain» reasoning anti-pattern across 4 turns of one session». The source names this as a distinct documented instance in the anti-pattern's occurrence corpus.
- **Ground-truth:** «Defer until consumer pain» is a rationalization that defers the SSOT consult and BFR-default discipline application to a future moment — structurally the same failure shape as C2/C3 but in a different session and about a different capability. The AI formed a confident deferral verdict without running the required SSOT lookup.
- **Channel that should have caught it:** HOT. Same channel logic as C2 — a per-verdict checklist requiring SSOT entry citation would have forced the consult at recommendation-formation time.

---

**C6 — L3 generated-docs research recommendation (2026-05-09)**

- **ID:** C6
- **Description:** A research session on L3 generated-docs discipline produced a recommendation that failed forward+backward checks across 6 distinct existing disciplines; the gap was surfaced only via reviewer pushback.
- **Evidence:** `.claude/rules/phase-research-coverage.md:34` — §1.7 origin footnote: «research session on L3 generated-docs discipline produced a recommendation that itself failed forward+backward checks across 6 distinct existing disciplines; gap surfaced only via reviewer pushback, not via existing §1.1-§1.6». Also: `.claude/rules/phase-research-coverage.md:113` — `#recommendation-skips-own-discipline` corpus: «L3 generated-docs research recommendation 2026-05-09».
- **Ground-truth:** The recommendation was formed without running §1.7 forward+backward checks on itself (the exact discipline the recommendation was about). This is the purest instance of `#recursive-self-application-gap` in the corpus: the recommendation-introducing discipline was not applied to the recommendation itself.
- **Channel that should have caught it:** HOT (ideally). In practice, COLD (reviewer session) caught it. HOT mechanism would have needed to require «before finalising a recommendation that introduces a discipline: run §1.7 forward+backward checks on the recommendation itself and cite the results in your response».

---

**C7 — Numeric claim error «4+ files vs real 10» (autonomous-self-audit)**

- **ID:** C7 (adjacent at-write-time class)
- **Description:** During a session chain, the AI stated a numeric claim («4+ files») about the count of some set that was actually 10, without re-verifying before claiming.
- **Evidence:** `.claude/orchestrator-prompts/autonomous-self-audit-research/research-prompt.md:22` — incident table row 1: «Numeric claim error «4+ files vs real 10» — External trigger: Maintainer сказал «обсудим аудит»».
- **Ground-truth:** The claim was a confabulated count; the correct number was available via `ls | wc -l`. The AI formed a numeric recommendation («about 4+ files») without running the mechanical check. This is not a strategy-level wrong recommendation but a factual-level wrong claim embedded in a recommendation context.
- **Channel that should have caught it:** HOT. A per-response rule requiring «for any numeric claim: state the command you ran to produce this number» would have forced the verification step before the claim shipped.

---

**C8 — Negative-existence claim weakly supported (autonomous-self-audit)**

- **ID:** C8 (adjacent at-write-time class)
- **Description:** An AI session made a negative-existence claim (about prior art or population not existing) without running the 6-item search-coverage checklist.
- **Evidence:** `.claude/orchestrator-prompts/autonomous-self-audit-research/research-prompt.md:23` — incident table row 2: «Negative-existence claim weakly supported — External trigger: Maintainer сказал «оцени сам то что ты сделал»».
- **Ground-truth:** The claim «no production tool implements X» (or equivalent negative-existence) is a strong assertion requiring the 6-item §1 checklist per `phase-research-coverage.md §1`. The AI issued the verdict without completing the checklist, and the claim was weakly supported.
- **Channel that should have caught it:** HOT. A per-recommendation instruction specifically for negative-existence claims («before stating no analog exists: enumerate which of the 6 §1 checklist items you ran, cite the search result for each») would have exposed the incomplete coverage at formation time.

---

### §1.2 Fabricated edge-cases

The following cases are FABRICATED — plausible shapes not yet observed in the documented corpus, designed to stress different failure modes. Labeled clearly as FABRICATED throughout.

---

**F1 — Verdict issued without SSOT consult for a known capability area (FABRICATED)**

- **ID:** F1 — FABRICATED
- **Description:** AI recommends ADOPT for a new library (e.g. «adopt ts-morph for AST analysis in Wave 10») without consulting `prior-art-evaluations.md` for any existing entry in the capability area.
- **Fabricated evidence ref:** No real instance found; constructed to stress the «SSOT consult skipped entirely» failure shape (different from C2 where SSOT was consulted but BFR-default application was wrong).
- **Ground-truth:** The capability area (TypeScript AST analysis tooling) already has a prior-art entry (hypothetical: row #44 with verdict DEFER or WATCHLIST). Skipping the consult means the recommendation contradicts an existing SSOT verdict without acknowledging the conflict.
- **Channel that should have caught it:** HOT. A mandatory step «before ADOPT/DEFER/RECOMMEND: state the SSOT row number and its current verdict» would catch the case where no row number is stated — it signals the consult was not run.

---

**F2 — Numeric claim carried forward from earlier session without re-count (FABRICATED)**

- **ID:** F2 — FABRICATED
- **Description:** In a second session reviewing a PR, the AI states «the 13 principle tests were all audited in the previous session» — carrying forward a count from a prior session prompt context without re-running `ls packages/core/principles/*.test.ts | wc -l`.
- **Fabricated evidence ref:** No real instance; constructed to stress the «count carried forward across sessions» failure shape. Real analog is C7 (within-session) but this is a cross-session forward-carry variant.
- **Ground-truth:** The actual count at the time of the second session is 10 (the PR #51 incident found this exact discrepancy). The AI carried forward «13» from prior session context without mechanical re-verification. The number is plausible (close to true) which makes it more dangerous — maintainer is less likely to challenge a near-true number.
- **Channel that should have caught it:** HOT. A per-numeric-claim rule requiring a fresh command output (not memory) for any count claim would catch this. WARM (W1 on research patches bearing the count) would catch it post-commit.

---

**F3 — Negative-existence claim without 6-item checklist but with superficially complete framing (FABRICATED)**

- **ID:** F3 — FABRICATED
- **Description:** AI states «no production framework implements recommendation-moment gating for LLM agents — I checked context7 and found no results» — citing only 1 of the 6 checklist items (context7 only), omitting DeepWiki, WebSearch ≥3 phrasings, own-stack sweep, category sweep, and adversarial counter-prompt.
- **Fabricated evidence ref:** No real instance; constructed to stress the «checklist partial completion — looks complete, is not» failure shape. This is more dangerous than C8 (no evidence at all) because it cites one search tool, creating an appearance of due diligence.
- **Ground-truth:** The context7 search alone is insufficient (per `build-first-reuse-default.md §3` tooling caveat: «context7 is intentionally excluded» from the BFR-default mechanism list for problem-class existence claims). DeepWiki + WebSearch ≥3 phrasings are required. The negative-existence claim is therefore provisional, not load-bearing.
- **Channel that should have caught it:** HOT. A per-recommendation rule that specifically requires «for negative-existence claims: state all 6 checklist items with their outputs» would force complete enumeration rather than stopping at the first search that returns nothing. WARM via W1 would catch it post-commit if the recommendation is committed.

---

### §1.3 Gate 1 self-check

**Gate 1 requirements (from kickoff §3 Round 1):**

1. **≥8 cases total (real + fabricated):** Total cases = 8 real (C1–C8) + 3 fabricated (F1–F3) = **11 cases. PASS.**
2. **Each case carries `file:line` citation OR incident/PR reference:** See citation table below. **PASS** (each real case has a verified `file:line`; fabricated cases marked FABRICATED with explicit «No real instance»).
3. **Population enumerated in §1.0 BEFORE any case list:** §1.0 is the first subsection; §1.1 cases follow. The sentence «Population count method» and «POPULATION TOTAL» appear on lines before any case block. **PASS.**
4. **No «mechanism X catches N of these» statements in this round:** No such claim appears anywhere in §1. **PASS.**

**T10 self-check (quote the line proving population was enumerated before cases):**
The section heading `### §1.0 Population enumeration` and the sentence «**Order discipline (T10): population is stated here, before any individual case is presented.**» appear at lines preceding all individual case blocks in §1.1.

---

### §1.4 Citation table (for Reviewer spot-check)

| Case ID | Citation used | Verified by reading source |
|---|---|---|
| C1 | `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md:19` — table row 1 text | Read: line 19 contains «§1 of the research-patch claimed «substance backward-check был correct» — `#discipline-application-scope-blindness` sub-case (c)» |
| C2 | `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md:20` and `2026-05-13-pr-body-s17-substance-gap.md:311` | Read: line 20 contains DEFER/build-vs-reuse table row; line 311 contains «The DEFER reasoning … is exactly the path-of-least-resistance rationalisation» |
| C3 | `docs/meta-factory/research-patches/2026-05-16-§17-think-time-gate.md:21` and `2026-05-13-pr-body-s17-substance-gap.md:352` | Read: line 21 contains «3 additional dialogue turns defending hand-roll verdict»; line 352 contains «Hand-roll defence arguments through 4 dialogue turns» |
| C4 | `.claude/rules/phase-research-coverage.md:113` — `#recommendation-skips-own-discipline` corpus mention of «PR #16 EXECUTION-PLAN drift» | Read: line 113 contains «Surfaced repeatedly across distinct sessions (PR #16 EXECUTION-PLAN drift; …» |
| C5 | `.claude/rules/phase-research-coverage.md:113` — corpus mention of «defer until consumer pain» | Read: same line 113 contains «the «defer until consumer pain» reasoning anti-pattern across 4 turns of one session» |
| C6 | `.claude/rules/phase-research-coverage.md:34` (§1.7 origin) and `:113` (corpus) | Read: line 34 contains «research session on L3 generated-docs discipline produced a recommendation that itself failed forward+backward checks across 6 distinct existing disciplines»; line 113 names «L3 generated-docs research recommendation 2026-05-09» |
| C7 | `.claude/orchestrator-prompts/autonomous-self-audit-research/research-prompt.md:22` | Read: line 22 contains «Numeric claim error «4+ files vs real 10» — Maintainer сказал «обсудим аудит»» |
| C8 | `.claude/orchestrator-prompts/autonomous-self-audit-research/research-prompt.md:23` | Read: line 23 contains «Negative-existence claim weakly supported — Maintainer сказал «оцени сам то что ты сделал»» |
| F1 | FABRICATED — no source | Marked FABRICATED explicitly; no claim of real existence |
| F2 | FABRICATED — no source | Marked FABRICATED explicitly; references C7 as real analog |
| F3 | FABRICATED — no source | Marked FABRICATED explicitly; references C8 as real analog |

---

## §2 — Shortlist + prior-art delta

> **Round 2 status:** COMPLETE. Gate 2 self-check at §2.5.
> **T-recgate-A compliance:** this section contains NO catch-rate or false-positive-rate claims. Those belong to Round 3.
> **Gate 0 re-declaration:** The mechanism catalogue is NOT re-derived here. All H-descriptions reference `2026-05-16-§17-think-time-gate.md §4` as authoritative. Only prior-art delta evidence that meets one of conditions (a)/(b)/(c) is newly generated.

---

### §2.0 Shortlist selection rationale

**Shortlisted: H1, H2, H10.**

**Selection criteria applied (explicit):**

Three criteria determined in/out:

1. **Temporal enforceability:** can the mechanism fire at or before the moment a verdict reaches the user? (HOT enforceability criterion)
2. **Structural vs. behavioural:** does the mechanism enforce discipline via harness structure (schema, hook return code, tool schema) or rely solely on AI instruction compliance?
3. **Architectural scope vs. D6 relevance:** is the candidate directly implicated in the open D6 question (H2 vs H10 re-examination post-errata)?

**Per-candidate in/out:**

| Candidate | In/Out | One-line reason |
|---|---|---|
| H1 | IN | Cheapest HOT mechanism; fires on UserPromptSubmit (before AI turn); §7 bundle includes it; Q1 unresolved — must carry into Round 3 to dry-run whether specificity closes the gap |
| H2 | IN | Errata reopened: Stop hook fires per-turn (confirmed by two independent channels — errata §2 TypeScript SDK type evidence + DeepWiki anthropics/claude-code); D6 requires explicit re-examination against H10; scan-pattern prior art found in springzero/codex-plugin-cc (firing cadence of that repo: INCONCLUSIVE — see §2.2) |
| H10 | IN | Architecturally strongest HOT mechanism; §7 bundle primary; sole mechanism with structural enforcement (tool schema vs. keyword scan); D6 question specifically asks H2 vs H10 on revised rationale |
| H3 | OUT | Harness architectural constraint verified: skill auto-trigger on AI output NOT supported (`§4 H3`); no delta condition applies |
| H4 | OUT | TodoWrite checkbox-marking is bypassable; no new harness support found; same weakness as H1 but higher friction; collapses into H1 extension shape |
| H5 | OUT | Custom MCP gate requires AI to voluntarily call it — not structural; §5.3 confirmed no production MCP recommendation-validator exists; H10 subsumes the structural tool-call insight |
| H6 | OUT | Multi-pass output is a behavioural pattern (H1 extension shape); no independent harness property; collapses into H1 |
| H7 | OUT | Verbal hedge detection only; doesn't catch disciplinary failures that avoid trigger words (C2, C4, C5 all lack hedge words yet are wrong) |
| H8 | OUT | Elicitation hook verified INAPPLICABLE for general output interception (`§5.2`); sub-agent reviewer carries `#reviewer-as-secondary-orchestrator` risk (`§7.2`); no delta condition changes this |
| H9 | OUT | Adversarial section requirement is a complement to H2 (implemented as H2 scan target), not a standalone mechanism; if H2 shortlisted, H9 is a scan parameter within it |
| H11 | OUT | Behavioural eval suite is WARM/COLD classification; does not fire HOT; Round 3 corpus IS an ad-hoc H11 run — if H11 merits recommendation, Round 5 surfaces it |
| W1 | NOT SHORTLISTED FOR ROUND 3 DRY-RUN (but retained in bundle) | W1 is WARM class; dry-run in Round 3 is against in-dialogue corpus (C1–C8, F1–F3), which are all pre-commit failures. W1 catches post-commit shape; out of Round 3 scope. Still part of §7 bundle. |

**Adversarial counter-prompt (T7 obligation — run it, don't claim it):**

> «Which catalogue item did I wrongly drop?»

The strongest challenge is **W3 (two-AI session discipline)**. W3 directly addresses the 4-turn same-session defence pattern (C3) — a fresh session has no prior commitment to the DEFER verdict. I dropped W3 because: (a) Round 3 dry-run targets in-dialogue corpus (C1–C8, F1–F3) which are pre-commit; W3 is a WARM-adjacent mechanism that fires between sessions, not within; (b) the `#reviewer-as-secondary-orchestrator` risk is documented in `§7.2` and `2026-05-16-§17-think-time-gate.md:352`; (c) the Round-3 dry-run scope is HOT mechanisms only. **Assessment: W3 drop was correct for Round 3 scope; must surface in Round 5 as separate option for the 4-turn-defence shape.**

Second strongest challenge: **H9 dropped as standalone.** H9 (adversarial counter-prompt requirement) directly addresses C6 (L3 recommendation without §1.7 forward+backward) — the «Falsification:» block absence is exactly what C6 lacked. However, H9 is architecturally a scan parameter for H2 (Stop hook checks for «Falsification:» section presence in `last_assistant_message`). Carrying H9 as a separate shortlist entry would duplicate H2's mechanism. **Assessment: H9 is a sub-parameter of H2 in Round 3; not a separate mechanism.**

---

### §2.1 H1 — prior-art verdict (CITE route)

**Route: CITE from `2026-05-16-§17-think-time-gate.md §5.1`.**

Delta condition: none. H1 is not implicated in the Stop-hook errata (H1 is UserPromptSubmit, not Stop). No dry-run contradiction anticipated at this stage. §5 evidence is unaffected.

**Cited prior-art verdict** (`§5.1` SSOT table, row #20):
> «[#20] Claude Code hooks API | ADOPT | All HOT mechanisms using Stop/UserPromptSubmit/PreToolUse hooks build on adopted surface. No new dep.»

H1 extends the existing `inject-session-bootstrap.sh` (SSOT #20, ADOPT). H1 itself is scoped as «extends existing hook #20 (Claude Code hooks API, ADOPT). No new capability, no new dep» (`2026-05-16-§17-think-time-gate.md:100`).

**Cited §5.1 SSOT proposed entry** (`§5.1 §Entry #49 candidate`):
> «Constitutional AI self-critique pattern (Anthropic, 2022+) — Verdict candidate: ADOPT VOCABULARY — the pattern name and mechanism are well-known; project already implements a version via H1 (prompt injection). T16 check: CAI problem class = harmlessness alignment; our problem class = recommendation-discipline compliance. Partial match on the self-critique mechanism shape; full match on «revise before output» paradigm.»

**T16 problem-class-match block (H1):**

> **Upstream problem class:** Claude Code UserPromptSubmit hook — injects `additionalContext` into AI prompt context on every user turn. Constitutional AI self-critique — AI generates draft, critiques against principle, revises.
> **Our problem class:** injecting a recommendation-specific discipline checklist into the AI's context at the moment a recommendation dialogue turn begins, so the AI has explicit per-step instructions (state SSOT row, run context7, cite file:line, run adversarial counter) before forming the verdict.
> **Match?** Partial (UserPromptSubmit hook) / Vocabulary (CAI). The hook mechanism is an exact match for delivery channel. CAI is vocabulary-match for the self-critique pattern embedded in the instruction. **Evidence:** `2026-05-16-§17-think-time-gate.md:100` (SSOT #20 cite); `§5.1 §Entry #49` (CAI vocabulary match documented); `inject-session-bootstrap.sh` (existing hook confirmed operational by bash execution per `§8.1`).

---

### §2.2 H2 — prior-art verdict (FRESH route — delta condition a)

**Route: FRESH — delta condition (a).** The §5.1 dismissal of H2 rested on the claim «Stop hook only fires when the session actually terminates» (`2026-05-16-§17-think-time-gate.md:104` — «Stop hook fires when AI stops, not after each turn mid-conversation»). The errata (`2026-05-16-think-time-s17-gate-correction.md §2`) definitively corrects this: «Stop hook fires per assistant turn». The §5 H2 prior-art conclusion requires a fresh look given this changed premise.

**Fresh prior-art research — ≥3 phrasings:**

**Phrasing 1:** «claude code Stop hook per turn post-turn transcript audit discipline compliance 2026»
- **Tool:** WebSearch
- **Result:** «Stop hooks execute after each turn completes» (per-turn scope confirmed); «A Stop hook can check the session-specific transcript to verify actions like plan completion»; transcript_path field allows grepping the session transcript with zero cross-contamination; link: [Claude Code Hooks: Complete Guide — claudefa.st](https://claudefa.st/blog/tools/hooks/hooks-guide)
- **Key finding:** Stop hook is documented in 2026 production sources as **per-turn**, receiving `transcript_path` for session-specific transcript access and `last_assistant_message` for direct text access without transcript parsing.

**Phrasing 2:** «LLM post-turn output audit hook agent self-critique verdict compliance before next turn»
- **Tool:** WebSearch
- **Result:** SAVER (Self-Audited Verified Reasoning) — framework enforcing verification over internal belief states within the agent before action commitment; performs adversarial auditing to localise violations. Agent-as-a-Judge patterns in multi-turn systems check entire conversation for policy compliance. AgentForesight-7B: compact online auditor for step-level failure localisation. Links: [arxiv.org/pdf/2604.08401 (SAVER)](https://arxiv.org/pdf/2604.08401); [arxiv.org/html/2605.08715 (AgentForesight)](https://arxiv.org/html/2605.08715)
- **Key finding:** Academic literature in 2026 explicitly addresses per-turn agent output auditing for compliance; production patterns exist (SAVER, AgentForesight) but are framework-level, not Claude Code Stop-hook implementations.

**Phrasing 3:** «Stop hook transcript scan recommendation discipline gate claude code last_assistant_message per turn»
- **Tool:** WebSearch
- **Result:** `springzero/codex-plugin-cc` «Stop Review Gate Hook» — production implementation that binds to the `"Stop"` event, constructs a review prompt including `last_assistant_message`, returns `ALLOW: <reason>` or `BLOCK: <reason>` verdict, prevents Claude from continuing on BLOCK. Link: [DeepWiki: springzero/codex-plugin-cc §4.2](https://deepwiki.com/springzero/codex-plugin-cc/4.2-stop-review-gate-hook)
- **Key finding (partial):** Production prior art EXISTS for the Stop-hook + `last_assistant_message` + ALLOW/BLOCK scan-pattern. Firing cadence (per-turn vs. session-exit) was NOT resolved by WebSearch alone — requires separate DeepWiki verification (see Phrasing 5 below).

**Phrasing 4 (DeepWiki — confirm Claude Code Stop per-turn semantics, independent of springzero):**
- **Tool:** DeepWiki `ask_question("anthropics/claude-code", "Does the Stop hook fire after every assistant turn...")`
- **Result:** «The Stop hook fires after each assistant turn, not only at session end»; «SessionEnd is a separate hook type»; distinct `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` confirms they are separate systems. Link: [DeepWiki search result](https://deepwiki.com/search/does-the-stop-hook-fire-after_7b457c20-a5d0-4a8e-a4d9-550c1d0ac300)
- **Key finding:** Claude Code's OWN Stop hook fires per-turn. This evidence is independent of springzero — it comes from the `anthropics/claude-code` repo and the errata §2 TypeScript SDK type-system evidence (`StopHookInput` vs `SessionEndHookInput` are distinct interfaces). H2's per-turn viability rests on this channel, not on springzero.

**Phrasing 5 (DeepWiki — verify springzero firing cadence, independent resolution of Reviewer BLOCKING FINDING #1):**
- **Tool:** DeepWiki `ask_question("springzero/codex-plugin-cc", "Does the Stop Review Gate Hook fire after every assistant turn, or only when the session exits? What event does its hooks config bind to?")`
- **Result:** «The Stop Review Gate Hook fires only when the session exits, and it binds to the `"Stop"` event... This means it runs when Claude Code attempts to stop/exit the session, not after every assistant turn.» It does read `last_assistant_message`, but the firing cadence is session-exit. Link: [DeepWiki search result](https://deepwiki.com/search/does-the-stop-review-gate-hook_7b2a9dba-5fc2-4786-bead-b20455d6e4d8)
- **Key finding: INCONCLUSIVE-resolved.** springzero's Stop Review Gate Hook fires at session exit (same temporal pattern as §5.1's original claim about Claude Code's Stop), NOT per-turn. The WebSearch (Phrasing 3) surfaced springzero as a scan-pattern precedent but WebSearch did not resolve firing cadence. DeepWiki resolution contradicts the per-turn inference. **Consequence:** springzero is prior art for the ALLOW/BLOCK scan-pattern and `last_assistant_message` usage only — it is NOT prior art for per-turn firing. The per-turn viability claim for H2 stands on Phrasing 4 (Claude Code harness) + errata §2 (TypeScript SDK types), which do not depend on springzero.

**T16 problem-class-match block (H2):**

> **Upstream problem class (springzero/codex-plugin-cc Stop Review Gate Hook):** session-exit Stop hook review of the assistant's code-change output for engineering quality issues (second-order failures, rollback risk, design tradeoffs). Reads `last_assistant_message`; returns ALLOW/BLOCK verdict; blocks session exit on BLOCK. Firing cadence: session-exit (verified by DeepWiki Phrasing 5 above — NOT per-turn).
> **Our problem class:** per-turn Stop hook scan of `last_assistant_message` for recommendation-discipline violations — specifically: verdict-shape phrases (ADOPT/DEFER/RECOMMEND/VERDICT) without accompanying SSOT row citation and file:line evidence; adversarial counter-prompt section absence.
> **Match?** Partial on scan-pattern / Mismatch on firing cadence. **Evidence:** The scan pattern matches (Stop hook + `last_assistant_message` + ALLOW/BLOCK contract is established precedent in springzero). The review domain differs (code quality vs. recommendation-discipline). The firing cadence mismatches: springzero fires at session exit; H2 for this project needs per-turn firing. Per-turn firing is harness-supported (Phrasing 4, errata §2) but springzero does NOT demonstrate per-turn Stop hook in production. The ALLOW/BLOCK contract and `last_assistant_message` access are reusable (ADOPT VOCABULARY). The specific scan predicates and per-turn firing configuration are project-BUILD.

**Updated H2 prior-art verdict (delta):** ADOPT VOCABULARY for the Stop-hook + `last_assistant_message` + ALLOW/BLOCK scan-pattern (from springzero/codex-plugin-cc production prior art for the pattern shape; per-turn firing cadence confirmed by Claude Code harness evidence — Phrasing 4 + errata §2 — not by springzero). BUILD for the specific recommendation-discipline scan predicates (per-turn firing configuration + SSOT-citation-presence scanning: no production analog found).

**Critical weaknesses NOT changed by errata:**

1. **AI bypass via keyword avoidance:** H2 scans `last_assistant_message` for verdict-shape phrases. The 2026-05-13 session (C2-C3) used «DEFER» explicitly, which would trigger detection. But a semantically equivalent verdict without the keyword («Based on available evidence, Danger JS is unsuitable because...») bypasses the keyword scan. This weakness is unchanged by the per-turn firing correction.

2. **Stream-edit vs. structured-tool semantics:** The Stop hook can return `{"decision": "block", "systemMessage": "..."}` to inject context and continue the session (`§5.2` confirmed). But the hook fires *after* the AI response is generated — the response is already formed. Block + inject = ask AI to try again, not prevent the formation of the wrong verdict. H10 (tool-call-as-gate) prevents formation at schema-enforcement time; H2 catches and rejects *after* formation. This is a genuine remaining distinction even post-errata.

---

### §2.3 H10 — prior-art verdict (CITE route)

**Route: CITE from `2026-05-16-§17-think-time-gate.md §5.1` and `§5.3`.**

Delta condition: none. H10 is not implicated in the Stop-hook errata (H10 is a tool-call mechanism, not a Stop/SessionEnd hook). No §5 evidence was errata-invalidated for H10.

**Cited prior-art verdict** (`§5.1` — no SSOT entry):
> «No SSOT entry covers: dialogue-time recommendation gating, «verdict-as-tool-call» pattern (H10), behavioural eval suite for recommendation discipline (H11). These would be new entries if implemented.» (`2026-05-16-§17-think-time-gate.md:220`)

**Cited §5.3 MCP ecosystem finding:**
> «No «recommendation pre-validator», «output linter», or «verdict gate» MCP server exists in the ecosystem. MCP servers implement input validation via Zod schemas at tool-definition level (per DeepWiki) but do not operate as middleware interceptors on AI responses.» (`2026-05-16-§17-think-time-gate.md:276`)

**Cited §4 H10 SSOT check:**
> «This is a HOT mechanism with no prior art in the ecosystem search. No production «verdict-as-tool-call» pattern found in context7, DeepWiki, or WebSearch. Would be a project-BUILD capability.» (`2026-05-16-§17-think-time-gate.md:169`)

**Prior-art verdict:** BUILD. No production «verdict-as-tool-call» recommendation gate found. MCP ecosystem provides tool-schema input validation (Zod) but not as recommendation-discipline gate. Project-specific BUILD for the `issue_verdict(type, candidate, ssot_id, evidence[], adversarial_falsification)` tool contract.

**T16 problem-class-match block (H10):**

> **Upstream problem class (MCP tool-call pattern, SSOT #20):** Claude Code tool-use capability — AI calls a structured MCP tool with schema-validated parameters; tool returns result. Zod schema enforces required fields at call time; missing required field → tool call rejected before AI output is generated.
> **Our problem class:** requiring that the act of issuing a recommendation IS a tool call to `issue_verdict(...)` with mandatory fields: `ssot_id` (SSOT row consulted), `evidence[]` (file:line citations), `adversarial_falsification` (non-empty). Verdict prose is derived FROM the tool call output, not authored as free text. Empty SSOT field → tool call fails schema validation before verdict can ship.
> **Match?** Yes at the harness level (tool-call with schema validation is exactly MCP tool-use capability). No at the problem-class level for the specific discipline gate: no production tool enforces recommendation-discipline compliance via a mandatory `issue_verdict` contract. **Evidence:** `2026-05-16-§17-think-time-gate.md:169` («No production «verdict-as-tool-call» pattern found»); `§5.3` MCP ecosystem sweep; SSOT #20 (Claude Code hooks/tool-use API, ADOPT — the substrate is adopted, the application is BUILD).

---

### §2.4 D6 — explicit re-examination (reviewer-discipline: surface, do not decide)

**D6 context** (`2026-05-16-think-time-s17-gate-correction.md §3`): «Maintainer should decide whether to: (a) accept H10 over H2 on the revised rationale and treat parent §5.1 as superseded by this errata; (b) re-open the H2 vs H10 comparison given Stop can fire per turn — Stop hook becomes a viable candidate; (c) treat both as viable, ship H10 first, retain H2 as deferred alternative.»

**What changed with the Stop-hook errata:**

The original §5.1 argument against H2 was temporal: «Stop hook fires at session end, not per turn; therefore 4 of the 5 failures in the 2026-05-13 session would not be caught» (`§5.2:244-248`). This argument is now **invalidated**. Stop fires per turn. H2 CAN intercept after each individual assistant turn in a multi-turn conversation — including turns 1 through 4 of the 4-turn defence pattern (C3).

Specifically: C3 («4-turn hand-roll defence») was a case where `§1` analysis noted H2 could catch the pattern *only if the Stop hook fires per turn*. The errata removes the barrier. H2 could detect that the same DEFER verdict appeared in turns 2–5 without any new file:line evidence across those turns.

**What did NOT change:**

1. **H10's independent advantage remains.** H10 enforces discipline via tool schema *before* the verdict text is generated. H2 fires *after* the response is generated (block + reinject = retry). The distinction is: H10 prevents formation; H2 catches-and-rejects formation. This is a genuine architectural difference that the errata does not affect.

2. **H2's keyword-bypass weakness remains.** AI can convey the same DEFER verdict without using ADOPT/DEFER/RECOMMEND keywords. H10's schema enforcement cannot be bypassed by keyword avoidance — the tool call itself must have `ssot_id` populated. H2's keyword scan can be bypassed semantically.

3. **H2 has production prior art for the scan-pattern (springzero/codex-plugin-cc); H10 remains project-BUILD.** This is a NEW finding post-errata delta search, with one qualification: springzero's Stop Review Gate Hook fires at session-exit, not per-turn (DeepWiki Phrasing 5 verified). It is therefore prior art for the ALLOW/BLOCK scan-pattern and `last_assistant_message` usage — but NOT for per-turn Stop hook firing in production. H2's per-turn viability rests on Claude Code harness evidence (Phrasing 4, errata §2), not on springzero. The scan-pattern prior art still lowers H2's implementation cost relative to H10: the ALLOW/BLOCK contract is established precedent, `last_assistant_message` access is confirmed, and the hook infrastructure is ADOPT VOCABULARY. H10 requires building a custom MCP server from scratch and restructuring recommendation dialogue flow.

**Implication framing (reviewer-discipline — surface, do not decide):**

- **H2-now-viable implies:** the cost gap between H2 and H10 is larger than §7 assumed. H2 has production prior art (ADOPT VOCABULARY); H10 is project-BUILD. If temporal coverage is no longer H10's sole advantage over H2, the cost/benefit calculus shifts. A maintainer who previously accepted H10's architectural investment because H2 «fires too late» may reconsider given H2 now covers per-turn.
- **H10's distinguishing property is still:** structured-tool semantics that prevent verdict formation (not just catch-and-reject); keyword-bypass resistance (schema field required regardless of prose); Wave 10 natural scope fit (TS-core migration). H10 is architecturally stronger; H2 is architecturally achievable with less investment.
- **Decision-needed for maintainer (D6):** which of (a)/(b)/(c) in `correction §3` to select. Round 3 dry-run will report catch-rate and false-positive-rate for both H2 and H10 against the C1–C8, F1–F3 corpus, providing the evidence base for that decision. Maintainer decides in Round 5.

---

### §2.5 Gate 2 self-check

**Gate 2 requirement:** each shortlisted candidate must carry BOTH (1) a prior-art verdict (CITE-from-§5 OR FRESH delta a/b/c) AND (2) an explicit T16 problem-class-match block. A candidate missing either is NOT validly shortlisted.

| Candidate | Prior-art route | T16 match stated? | D6 addressed? |
|---|---|---|---|
| H1 | CITE — `§5.1` SSOT #20 row + Entry #49 candidate (CAI vocabulary) | Yes — §2.1 T16 block present | N/A — H1 not part of D6 question |
| H2 | FRESH — delta condition (a): errata invalidated «fires at session end» premise; 5 phrasings run (WebSearch ×3 + DeepWiki ×2); scan-pattern prior art found (springzero/codex-plugin-cc — ALLOW/BLOCK + last_assistant_message); springzero per-turn cadence: INCONCLUSIVE-resolved as session-exit (Phrasing 5); per-turn viability confirmed by Claude Code harness independently (Phrasing 4 + errata §2) | Yes — §2.2 T16 block present; upstream problem class corrected to session-exit; cadence mismatch noted explicitly | Yes — §2.4 lays out what changed and what did NOT change; point 3 qualified re: springzero cadence; framed as H2-implies-X / H10-distinguishing-property-is-Y; decision not picked |
| H10 | CITE — `§5.1` («no SSOT entry covers») + `§5.3` (MCP ecosystem sweep) + `§4 H10` SSOT check («no production verdict-as-tool-call found») | Yes — §2.3 T16 block present | Yes — §2.4 addresses H10's distinguishing property post-errata |

**All three candidates: Gate 2 PASS.**

**T15 self-application check:** does this §2 section apply its own shortlist discipline to itself? §2 surfaces candidates with prior-art evidence and T16 blocks — it does not issue a verdict on which to adopt. Reviewer-discipline maintained. D6 framed as decision-needed, not decided. Gate 2 self-check table present. **Self-application: PASS.**

**Residuals flagged for Round 3:**

1. **H2 keyword-bypass weakness vs. H10 schema-bypass resistance:** Round 3 dry-run must test how many corpus cases use verdict-shape keywords explicitly (triggerable by H2 scan) vs. how many use semantically equivalent non-keyword forms (H2-bypassable). This is the empirical question that determines H2's actual catch-rate vs. H10's structural advantage.

2. **H2 «catch-and-reject vs. prevent-formation» latency:** the stop-hook-fires-after-response-generation property means H2 adds one retry loop per intercepted turn. For the 4-turn defence (C3), H2 would fire 4 times — 4 retry loops. H10 would enforce at the first tool-call attempt. Round 3 should note which mechanism is less disruptive to dialogue flow.

3. **H1 specificity vs. session-start sufficiency:** the 2026-05-13 session had generic injection but not the specific 4-step recommendation checklist. Round 3 dry-run must evaluate whether the corpus cases (C1–C8) would plausibly have been caught by the specific checklist instruction vs. the generic goal/invariants that were present and failed. This is the Q1 empirical question in dry-run form.

---

## §3–§5 — round files (each in its own file for the 500-line `.husky/pre-commit` limit)

> - **§3 — Paper prototype + dry-run** → [round-3](2026-05-21-recommendation-gate-iterative-round-3.md). **COMPLETE, Gate 3 PASS.** H2 keyword-scan 4/10 genuine catches + 67% FP (two structural FP causes); H10 schema-gate 5/9 firm + 0% FP but fabrication-bypass risk; H1 instruction-delta concrete only for the at-write-time factual class (C7/C8/F2/F3), strategy-verdict class Q1-unresolved at paper fidelity; no single mechanism covers both failure classes.
> - **§4 — Self-application (recursive)** → [round-4](2026-05-21-recommendation-gate-iterative-round-4.md). **COMPLETE, Gate 4 PASS.** The patch's own §2 verdicts (R2a/R2b/R2c = H1/H2/H10) skip Step 4 (adversarial falsification) — H2 fires (HAS_ADVERSARIAL=0), H10 blocks, H1 marks Step 4 absent on all three; verified deterministically against committed §2.1/§2.2/§2.3. Recursive first-class finding: the research-patch commits the very failure mode it studies — three consecutive Worker-draft → review-cycle catches (R2 cadence, R3 F3, R4 §4.4 mis-citation) plus the standing committed-text Step-4 gap.
> - **§5 — Decision-needed surface (reviewer-discipline)** → [round-5](2026-05-21-recommendation-gate-iterative-round-5.md). **COMPLETE, Gate 5 PASS.** Surfaces for the maintainer (zero reviewer-side picks): D6 mechanism choice (H2 vs H10 vs combination) with the three adversarial-falsification sentences from round-4 §4.4; the four Round-4 residuals; and the consolidation question — merge with the un-executed autonomous-self-audit R-phase vs keep separate. No GO/REVISE verdict, no strategy pick.
