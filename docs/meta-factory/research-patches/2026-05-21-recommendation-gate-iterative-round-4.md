<!-- scope:recommendation-gate-iterative -->
# Research-patch — recommendation-moment gate (iterative) — Round 4

> **Continuation of:** [2026-05-21-recommendation-gate-iterative.md](2026-05-21-recommendation-gate-iterative.md) (Rounds 0–2, §0–§2) and [2026-05-21-recommendation-gate-iterative-round-3.md](2026-05-21-recommendation-gate-iterative-round-3.md) (Round 3, §3). Read both before this file.
> **Authoritative for:** Round 4 — recursive self-application of the H1/H2/H10 predicates to the patch's own recommendations.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists); mechanism catalogue — see [2026-05-16-§17-think-time-gate.md §4](2026-05-16-§17-think-time-gate.md); strategy/implementation decision — maintainer after Round 5.
> **Date:** 2026-05-21
> **Inherits authority from:** [research-patches/README.md](README.md) folder-level Authoritative-for header.

---

## §4 — Self-application (recursive)

> **T15 compliance:** this section runs H1/H2/H10 predicates on the patch's own recommendation-shaped outputs. It does NOT exempt the patch as «this is about mechanisms, not itself» (the exact anti-pattern §2 T15 warns against).
> **T2 compliance:** predicates are executed against quoted text, not declared as «applied».
> **T-recgate-B counter:** if a patch recommendation skips gate steps, that is the headline finding.

---

### §4.0 Step A — Enumerate the patch's own recommendations

**T10 discipline: population enumerated before predicate runs.**

The following are the recommendation-shaped outputs of this research patch (Rounds 0–3). A «recommendation» here means: a statement that asserts what should be done, which approach is better, what the evidence shows, or what the project should conclude — ADOPT/DEFER/RECOMMEND/VERDICT/should/need/best/stronger/achievable/no single mechanism.

| ID | Source location | Quoted recommendation sentence(s) |
|---|---|---|
| **R1** | Main patch §2.0 shortlist | «**Shortlisted: H1, H2, H10.**» |
| **R2a** | Main patch §2.1 | «H1 extends the existing `inject-session-bootstrap.sh` (SSOT #20, ADOPT).» |
| **R2b** | Main patch §2.2 | «**Updated H2 prior-art verdict (delta):** ADOPT VOCABULARY for the Stop-hook + `last_assistant_message` + ALLOW/BLOCK scan-pattern [...] BUILD for the specific recommendation-discipline scan predicates.» |
| **R2c** | Main patch §2.3 | «**Prior-art verdict:** BUILD. No production «verdict-as-tool-call» recommendation gate found.» |
| **R3a** | Round-3 §3.7 | «**Firm catch-rate (genuine verdict-keyword FIRE only):** 4/10 (excluding 1 CANNOT-DETERMINE from denominator) = **40% of decidable cases.**» |
| **R3b** | Round-3 §3.7 | «**False-positive rate: 2/3 = 67%** — CTRL2 (no SSOT ID present) + F3 shape (over-broad topical noun).» |
| **R3c** | Round-3 §3.7 | «**H10 catch-rate [...] Firm catch-rate (FIRE only):** 5/9 (excluding 2 CANNOT-DETERMINE-equivalent partial cases) = **56% of decidable-firm cases.** [...] **False-positive rate: 0/3 = 0%.**» |
| **R3d** | Round-3 §3.10 | «H1 PREDICATE-MATCH is NOT on the same scale as H2/H10 FIRE. Coverage: LOW for strategy-verdict class; MEDIUM for factual-claim class (instruction covers the gap, voluntary compliance required).» |
| **R4** | Round-3 §3.6 | «no single mechanism covers both classes. H1 + H2 combined would cover [...] H1 + H10 combined would cover [...] Neither combination covers C1 [...] C4 [...] or C6.» |
| **R5** | Main patch §2.4 / §0.2 | «**Decision-needed for maintainer (D6):** which of (a)/(b)/(c) in `correction §3` to select.» (Keep both H2 and H10 live, surface as decision-needed, not decided.) |
| **R6** | Round-3 §3.10 | «**These results are sufficient to inform D6 framing but NOT sufficient to declare a mechanism «empirically effective» — that requires live session testing.**» |
| **R7** | Main patch §0.2 | «**Confidence declared by delivering patch:** MEDIUM [...] Q1 (does H1 extension empirically change behaviour?) explicitly unanswered.» (Re-affirmed without change by this patch.) |

**Population count: 7 distinct recommendation clusters (R1–R7), with sub-items R2a/R2b/R2c and R3a/R3b/R3c/R3d.** Population is enumerated above before any predicate run.

---

### §4.1 Step B — Run H2 keyword-predicate against each recommendation

**H2 predicate (from Round-3 §3.0):**
```text
VERDICT_KEYWORDS = (ADOPT|DEFER|RECOMMEND(ATION)?|VERDICT|verdict:|I (suggest|recommend|propose)|should (adopt|use|defer|build))
```
Then check for: `HAS_SSOT` (prior-art-evaluations.md#N or SSOT row/entry #N), `HAS_FILELINE` (file.ext:N), `HAS_ADVERSARIAL` (What would make this wrong / Falsification:).

BLOCK if `VERDICT_KEYWORDS` matches AND any of {HAS_SSOT, HAS_FILELINE, HAS_ADVERSARIAL} = 0.

**T16 obligation (applied here):** when H2 fires on the patch's verdict-keyword tokens, I must distinguish genuine catch (the recommendation skips required evidence) from false positive on meta-discourse (the patch *discusses* ADOPT/DEFER while analyzing mechanisms, not issuing a new recommendation). This is the 67%-FP shape applied to itself.

| Rec | Matched token (quoted) | VERDICT_KEYWORDS fire? | HAS_SSOT | HAS_FILELINE | HAS_ADVERSARIAL | H2 result | Genuine catch or FP? |
|---|---|---|---|---|---|---|---|
| R1 | «**Shortlisted: H1, H2, H10.**» | NO — «shortlisted» not in regex | — | — | — | NO-FIRE | N/A |
| R2a | «H1 extends the existing `inject-session-bootstrap.sh` (SSOT #20, ADOPT).» | YES — «ADOPT» matches | YES — «SSOT #20» in same sentence matches `SSOT (row |entry )?#?[0-9]+` | YES — `.claude/hooks/inject-session-bootstrap.sh` is a file ref (no `:N` line number though — see note) | NO — no «What would make this wrong» in §2.1 | BLOCK (HAS_ADVERSARIAL = 0) | **FP on meta-discourse:** «ADOPT» here describes the SSOT #20 verdict already-documented in the predecessor patch. The patch is *citing* an existing ADOPT verdict, not *issuing* a new ADOPT recommendation. However, no adversarial falsification for this citation exists in §2.1. **H2 fires legitimately on the missing adversarial counter, even if the ADOPT label is a citation.** This is a genuine partial-catch: the patch should have written «What would make the SSOT #20 ADOPT citation wrong?» — it didn't. |
| R2b | «**Updated H2 prior-art verdict (delta):** ADOPT VOCABULARY for [...] BUILD for the specific recommendation-discipline scan predicates.» | YES — «ADOPT» and «BUILD» tokens (BUILD not in regex but «verdict» in «prior-art verdict» matches `VERDICT` case-insensitively) | YES — §2.2 T16 block cites `2026-05-16-§17-think-time-gate.md:104` and errata §2. SSOT pattern not in `prior-art-evaluations.md#N` form (it says «no SSOT entry covers») → HAS_SSOT = 0 by the ID-number regex | YES — `inject-session-bootstrap.sh` referenced + errata cites TypeScript SDK type evidence | NO — §2.2 has no «What would make this wrong» sentence | BLOCK (HAS_SSOT = 0, HAS_ADVERSARIAL = 0) | **Genuine catch on two missing fields:** (1) R2b correctly says «no SSOT entry covers» verdict-as-tool-call — same CTRL2 false-positive shape, but in this case the «no SSOT entry» text for H10's BUILD verdict does not include `prior-art-evaluations.md#[ID]` because there IS no entry. H2's ID-number regex fires on the absence. (2) No adversarial counter present in §2.2 for the «BUILD for scan predicates» sub-verdict. Both are genuine structural absences — the patch's own recommendation for H2 BUILD does not include «What would make this wrong: BUILD is incorrect if…». |
| R2c | «**Prior-art verdict:** BUILD. No production «verdict-as-tool-call» recommendation gate found.» | YES — «VERDICT» in «Prior-art verdict» matches case-insensitively | HAS_SSOT: «No SSOT entry covers» phrasing, no `#N` ID → = 0 | YES — `§4 H10`, `§5.3`, `2026-05-16-§17-think-time-gate.md:169` are file-section refs (section refs, not `file.ext:N`). Strict regex: `[a-zA-Z0-9_/.-]+\.(ts|md|sh|json|yml|yaml):[0-9]+` — a `§-ref` is NOT matched; `2026-05-16-§17-think-time-gate.md:169` IS matched (the `:169` makes it file:N). HAS_FILELINE ≥ 1. | NO — §2.3 has no «What would make this wrong» sentence | BLOCK (HAS_SSOT = 0, HAS_ADVERSARIAL = 0) | **Same pattern as R2b:** «no SSOT entry covers» is the correct description of the state, but H2's regex cannot distinguish that from a missing consultation. The adversarial counter absence is a genuine catch: the BUILD recommendation for H10's tool schema should have stated «What would make BUILD wrong: if a production verdict-as-tool-call system already exists but was missed by the §5.3 MCP ecosystem sweep». That was not stated. |
| R3a | «**Firm catch-rate [...] 4/10 [...] = 40% of decidable cases.**» | NO — «40%» and «catch-rate» are not in VERDICT_KEYWORDS | — | — | — | NO-FIRE | N/A — statistical summary, not a recommendation verb |
| R3b | «**False-positive rate: 2/3 = 67%**» | NO — rate-statement, no VERDICT_KEYWORDS | — | — | — | NO-FIRE | N/A |
| R3c | «**H10 catch-rate [...] Firm catch-rate (FIRE only):** 5/9 [...] = 56% [...] **False-positive rate: 0/3 = 0%.**» | NO — rate-statement | — | — | — | NO-FIRE | N/A |
| R3d | «H1 PREDICATE-MATCH is NOT on the same scale as H2/H10 FIRE. Coverage: LOW for strategy-verdict class; MEDIUM for factual-claim class.» | NO — «PREDICATE-MATCH», «LOW», «MEDIUM» not in regex | — | — | — | NO-FIRE | N/A |
| R4 | «no single mechanism covers both classes. [...] Neither combination covers C1 [...] C4 [...] or C6.» | NO — no VERDICT_KEYWORDS token | — | — | — | NO-FIRE | N/A |
| R5 | «**Decision-needed for maintainer (D6):** which of (a)/(b)/(c) in `correction §3` to select.» | NO — «decision-needed» is not in regex | — | — | — | NO-FIRE | N/A |
| R6 | «**These results are sufficient to inform D6 framing but NOT sufficient to declare a mechanism «empirically effective» — that requires live session testing.**» | NO — «sufficient» not in VERDICT_KEYWORDS | — | — | — | NO-FIRE | N/A |
| R7 | «**Confidence declared by delivering patch:** MEDIUM [...] Q1 [...] explicitly unanswered.» | NO | — | — | — | NO-FIRE | N/A |

**H2 Step B summary:**

H2 fires (BLOCK) on R2a, R2b, R2c — the prior-art verdict sentences in §2. H2 does NOT fire on R1, R3a–R3d, R4, R5, R6, R7 (statistical summaries, decision-surface sentences, and confidence statements). The fires are a mix of:
- Genuine catches: R2b and R2c lack adversarial counters for their BUILD verdicts.
- Partial-genuine / partial-FP: R2a fires on missing adversarial counter (genuine) but the ADOPT label is a citation of an existing verdict (meta-discourse component).
- SSOT ID-regex FP (CTRL2 shape): all three fires include the «no SSOT entry covers» situation, which the regex correctly cannot distinguish from a skipped consult.

**T16 resolution:** H2 fires on 3 of 12 items. 3 of those 3 fires involve the ADOPT/BUILD/VERDICT keywords appearing in the context of mechanism-meta-discourse (the patch discussing what ADOPT means for H1, H2, H10). HOWEVER: the missing adversarial counter is a GENUINE gap in all three cases — the patch never wrote a «What would make this BUILD recommendation wrong?» sentence for R2b or R2c. The 67%-FP finding from Round 3 does apply here (the SSOT-ID-absent trigger is structurally unavoidable for new-capability-area BUILD verdicts), but the adversarial-counter absence is a real finding that H2 correctly surfaces.

---

### §4.2 Step C — Run H10 schema against each recommendation

**H10 schema fields required (from Round-3 §3.0):**
- `ssot_id` (prior-art-evaluations.md row number, or "none" with rationale ≥20 chars)
- `evidence[]` (≥1 item, each with `claim`, `citation` = file:line or URL, `citation_content`)
- `adversarial_falsification` (≥30 chars)
- `external_search_summary` (≥20 chars)

For each Rn: mark field present/absent with the §-location where it appears (or its absence).

| Rec | ssot_id | evidence[] (≥1 file:line) | adversarial_falsification | external_search_summary | H10 result |
|---|---|---|---|---|---|
| R1 (shortlist) | ABSENT — shortlist sentence does not cite a SSOT row. §2.0 selection rationale cites `2026-05-16-§17-think-time-gate.md §4` but no `prior-art-evaluations.md#N`. | PRESENT — §2.0 table cites `§4 H3`, `§4 H4`, etc. as location refs; not strict file:line with `:N`. By strict schema: file:line pattern not met. BORDERLINE. | ABSENT — §2.0 has a T7 adversarial counter-prompt section («Which catalogue item did I wrongly drop?»), which runs concrete challenges against H4/H9/W3. This IS an adversarial counter. PRESENT (≥30 chars). | ABSENT — §2.0 does not summarise an external search for the shortlist decision itself (external searches were done in §2.1/§2.2 for individual candidates, not for the shortlist-selection meta-decision). | BLOCK — ssot_id absent; evidence[] borderline-absent by strict file:N; external_search_summary absent for the shortlist decision. |
| R2a (H1 ADOPT cite) | PRESENT — «SSOT #20» named. §2.1 cites `2026-05-16-§17-think-time-gate.md:100` line-number form. | PRESENT — `2026-05-16-§17-think-time-gate.md:100`, `§5.1 §Entry #49`, `inject-session-bootstrap.sh` referenced. | ABSENT — no «What would make this wrong» sentence in §2.1 for the H1-ADOPT citation verdict. The T16 block mentions partial match but has no adversarial falsification statement. | PRESENT — «Partial (UserPromptSubmit hook) / Vocabulary (CAI). Evidence cited.» External search summary implicit in §5.1 citation. BORDERLINE but counted as present. | BLOCK — adversarial_falsification absent. |
| R2b (H2 ADOPT VOCABULARY / BUILD) | PRESENT — «SSOT #20» for the ADOPT substrate appears in §2.0's shortlist note (not within §2.2's T16 block). For the BUILD sub-verdict on scan predicates: «no SSOT entry covers» — ssot_id = "none" WITH rationale (§2.2 T16 block explicitly states no production analog found). ssot_none_rationale ≥20 chars: «no production analog found». PRESENT (using "none" path). | PRESENT — `2026-05-16-§17-think-time-gate.md:104` cited with content description (errata invalidated «fires at session end»). Multiple DeepWiki + WebSearch phrasings referenced by finding description. Strict `:N` form: `springzero/codex-plugin-cc §4.2` is section-ref not line-num; errata §2 TypeScript SDK is paraphrased. `2026-05-16-think-time-s17-gate-correction.md §2` cited — section ref, not line. No strict `file.md:N` form for the search results. BORDERLINE — section refs present, line-number citations absent for the external search results. | ABSENT — §2.2 has no «What would make this wrong» sentence for the H2 BUILD-scan-predicates verdict. The «Critical weaknesses NOT changed by errata» block (§2.2 end) addresses H2 weaknesses but is not an adversarial falsification of the BUILD recommendation itself. | PRESENT — 5 phrasings enumerated with tool, result, and key finding for each (WebSearch ×3, DeepWiki ×2). §2.2 is the most evidenced section. | BLOCK — adversarial_falsification absent for the BUILD sub-verdict. |
| R2c (H10 BUILD) | PRESENT — «no SSOT entry covers» stated with rationale (§2.3: «No SSOT entry covers dialogue-time recommendation gating...»). ssot_id = "none" path applicable. | PRESENT — `2026-05-16-§17-think-time-gate.md:169`, `§5.3`, `§4 H10` cited. `:169` is a valid file:N citation. | ABSENT — §2.3 has no «What would make this BUILD recommendation wrong» sentence. The T16 block states «No production verdict-as-tool-call pattern found» as evidence, but this is absence-evidence, not falsification. | PRESENT — «MCP ecosystem sweep» + DeepWiki cited in §5.3. External search summary implicit. | BLOCK — adversarial_falsification absent. |
| R3a (H2 catch-rate 40%) | ssot_id: N/A — statistical finding derived from the dry-run, not an adoption recommendation. | evidence[]: the 40% figure is derived from the §3.3 matrix (all 11 cases enumerated). The derivation is traced. | adversarial_falsification: §3.8 T7 runs the adversarial counter on the matrix scores (finds C3 turns 3-5 inferred). PRESENT. | external_search_summary: N/A — statistical summary from own corpus, no external search. | ALLOW (partially — statistical finding, not a verdict-as-tool-call target; adversarial present in §3.8). |
| R3b (H2 FP 67%) | Same as R3a — statistical finding. §3.4 CTRL2 analysis derivation is traced. Adversarial counter in §3.8. | ALLOW (statistical finding). |
| R3c (H10 rates) | Same as R3a — statistical finding. §3.4 controls traced. §3.8 addresses C8/F3 downgrade. | ALLOW (statistical finding). |
| R3d (H1 coverage LOW/MEDIUM) | Same — qualitative synthesis of §3.5 case-by-case analysis. §3.8 T7 challenge 3 addresses this. | ALLOW (qualitative synthesis with adversarial check). |
| R4 (no single mechanism) | ssot_id: N/A. evidence[]: §3.6 table provides per-mechanism per-class breakdown — fully traced. adversarial_falsification: «the strongest challenge is W3» discussed in §2.0 adversarial section; §3.6 does not repeat but §3.8 T7 runs the challenge. external_search: N/A (synthesis). | ALLOW (synthesis with cross-referenced adversarial check). |
| R5 (D6 surface) | N/A — this is a reviewer-discipline output (decision-needed surface), not an adoption recommendation. | ALLOW (not a verdict-as-tool-call target). |
| R6 (empirical sufficiency) | ssot_id: N/A. adversarial_falsification: §3.9 Gate 3 self-check lists specific items. external_search: N/A. | ALLOW (meta-qualification, not a verdict). |
| R7 (MEDIUM confidence) | Re-statement of predecessor patch §7.4 — no new verdict issued. | ALLOW (citation of predecessor). |

**H10 Step C summary:** H10 schema BLOCKS R1 (shortlist — no ssot_id, no external_search_summary for the meta-decision), R2a (adversarial_falsification absent), R2b (adversarial_falsification absent), R2c (adversarial_falsification absent). Statistical findings R3a–R3d, synthesis R4, surface R5, qualification R6, citation R7 are not verdict-as-tool-call targets and are ALLOWED or N/A.

**Pattern: adversarial_falsification is absent from every prior-art verdict (R2a, R2b, R2c).** The patch systematically issued three BUILD/ADOPT VOCABULARY verdicts without a «What would make this wrong» sentence. H10 would have blocked all three at schema-validation time.

---

### §4.3 Step D — Run H1 4-step checklist against each recommendation

**H1 checklist (from Round-3 §3.0):**
- Step 1: State SSOT row ID and its current verdict.
- Step 2: Run context7 ≥3 phrasings OR DeepWiki ≥3 phrasings; quote ≥1 result.
- Step 3: For every factual claim, state the command run and its output, or exact file:line.
- Step 4: Write «What would make this wrong:» sentence.

For each Rn: which steps does the patch actually perform? Marked with file:section location.

| Rec | Step 1 (SSOT row ID) | Step 2 (external search ≥3) | Step 3 (file:line for factual claims) | Step 4 (adversarial counter) | H1 verdict |
|---|---|---|---|---|---|
| R1 (shortlist) | ABSENT — shortlist sentence cites no SSOT row. §2.0 references `§4` of predecessor but no `prior-art-evaluations.md#N`. | ABSENT for the shortlist-selection decision itself. Searches done in §2.1/§2.2 for individual candidates but not for the shortlist decision. | PRESENT — §2.0 selection-criteria table; §2.5 Gate 2 table. Evidence for each candidate cited by reference. | PRESENT — §2.0 contains explicit «Adversarial counter-prompt (T7 obligation — run it, don't claim it)» section with concrete challenges against H4/H9/W3. | Steps 1 and 2 absent for shortlist meta-decision. **CANNOT-DETERMINE** (Step 1/2 gap is real but the shortlist is a meta-synthesis of already-checked candidates, so the absence may be structurally correct). |
| R2a (H1 ADOPT) | PRESENT — «SSOT #20» (§2.1, `2026-05-16-§17-think-time-gate.md:100`). | PRESENT — context7 pattern cited in predecessor §5.1; CAI reference cited. | PRESENT — `inject-session-bootstrap.sh` operational confirmed by bash execution (§8.1 predecessor). Line-number form present for predecessor citation. | ABSENT — no Step 4 «What would make this wrong» sentence in §2.1. | Step 4 ABSENT. PREDICATE-MATCH on 3/4 steps; Step 4 gap real. |
| R2b (H2 ADOPT VOCABULARY / BUILD) | PRESENT — SSOT #20 for substrate; «no SSOT entry» with rationale for BUILD predicates. | PRESENT — 5 phrasings (WebSearch ×3, DeepWiki ×2) enumerated with findings (§2.2). | PRESENT — errata §2 TypeScript SDK type evidence; `springzero/codex-plugin-cc §4.2`; `2026-05-16-think-time-s17-gate-correction.md §2`. | ABSENT — §2.2 has no «What would make the BUILD recommendation wrong» sentence. «Critical weaknesses» block addresses mechanism weaknesses, not BUILD-recommendation falsification. | Step 4 ABSENT. Best-evidenced section; only adversarial counter for the BUILD verdict missing. |
| R2c (H10 BUILD) | PRESENT — «no SSOT entry covers» with explicit evidence (§2.3: `2026-05-16-§17-think-time-gate.md:169`). | PRESENT — MCP ecosystem sweep, DeepWiki on MCP servers (predecessor §5.3). | PRESENT — `2026-05-16-§17-think-time-gate.md:169`, `:276`, `:434` (predecessor §4 H10, §5.3, §5.1). | ABSENT — §2.3 T16 block ends with the evidence statement; no «What would make BUILD wrong» sentence. | Step 4 ABSENT. |
| R3a–R3d (rates and coverage) | N/A — derived from corpus, not adoption recommendations. Step 3: §3.3 matrix is the evidence (all 11 cases with predicate). Step 4: §3.8 T7 is the adversarial counter. | H1 applied: Steps 3 and 4 present. Steps 1 and 2 N/A for statistical findings. PASS for H1 scope. |
| R4 (no single mechanism) | N/A for Step 1/2. Step 3: §3.6 table. Step 4: §2.0 adversarial counter (W3 challenge) + §3.8. | PASS for H1 scope. |
| R5 (D6 surface) | Not an adoption recommendation. N/A. | PASS. |
| R6, R7 | Not adoption recommendations. N/A. | PASS. |

**H1 Step D summary:** Steps 1, 2, and 3 are performed for R2a, R2b, R2c. **Step 4 is absent from ALL THREE prior-art verdict recommendations (R2a, R2b, R2c).** This is the consistent failure across all mechanisms across all three mechanisms' §2 verdicts: no adversarial falsification sentence exists for any of the three BUILD/ADOPT VOCABULARY recommendations.

---

### §4.4 Step E — First-class recursive finding

**The pattern — three review-cycle catches (cited by file/section):**

**Round 2 instance (Worker draft → review-cycle catch):** The Round-2 Worker draft claimed springzero/codex-plugin-cc «fires per-turn» — an unverified inference from WebSearch Phrasing 3. The Reviewer's re-check via DeepWiki Phrasing 5 falsified the claim: springzero fires at session-exit, not per-turn. The committed §2.2 reflects the correction (INCONCLUSIVE-resolved) and correctly states «Firing cadence (per-turn vs. session-exit) was NOT resolved by WebSearch alone — requires separate DeepWiki verification (see Phrasing 5 below)» — §2.2 itself is the post-correction artifact, NOT the failure. Source for the failure: `STATE.md §Round 2 outcome` (this worktree): «Worker's H2 prior-art claim "springzero/codex-plugin-cc fires per-turn" was unverified — DeepWiki re-check (Phrasing 5) confirmed **session-exit**, not per-turn. Downgraded to INCONCLUSIVE-resolved.» Pattern: failure in Worker draft, caught at review before commit.

**Round 3 instance (Worker draft → review-cycle catch):** F3/H2 was scored CANNOT-DETERMINE in the Worker draft. The Reviewer ran the grep against the F3 quoted text and caught the misclassification — regex fires on the topical noun «recommendation» (FIRE over-broad). Documented in `2026-05-21-recommendation-gate-iterative-round-3.md §3.8 iteration-2 changelog`: «BLOCKING 1 fixed — F3/H2 reclassified from CANNOT-DETERMINE to FIRE(over-broad)». The committed §3 reflects the correction. Pattern: failure in Worker draft, caught at review before commit.

**Round 4 instance — two simultaneous catches:**

*(a) Worker draft → review-cycle catch (this round's §4.4 mischaracterization):* The Round-4 Worker draft cited committed §2.2 as evidence of a failure (the springzero «per-turn» claim). The Reviewer correctly identified that §2.2 shows the POST-CORRECTION text, not the uncorrected claim — the failure was in the Worker draft, not in §2.2. This is the fix you are reading now. The failure-and-correction pattern applies recursively to the §4.4 description of Round 2: the description of the failure mode itself committed the failure mode (mis-citing a source to support a claim without verifying what the source actually says). Pattern: failure in Worker draft, caught at review before commit. Three rounds in a row.

*(b) Committed-text finding (R2a/R2b/R2c Step-4 absence — in the committed §2, not a draft):* Steps B, C, and D above surface a consistent gap in the COMMITTED §2 text: **all three prior-art verdict recommendations (R2a, R2b, R2c) are missing Step 4 (adversarial falsification).** This is deterministic — no «What would make this wrong» sentence exists in §2.1, §2.2, or §2.3. This is FIRE by H2 (HAS_ADVERSARIAL = 0), BLOCK by H10 (adversarial_falsification absent), and Step 4 ABSENT under H1. This finding is NOT a Worker-draft-only catch — it is present in the committed artifact (commit 6bbde92).

**Does Round 4 repeat the studied failure mode?**

YES, on both dimensions:
- The Worker draft's §4.4 mischaracterization (mis-citing §2.2) is the third consecutive review-cycle catch — research again committed the very failure mode it studies (in this case: a factual claim about a source without verifying the source's actual content, directly analogous to C1).
- The committed §2's absent adversarial counters (R2a/R2b/R2c) are a standing gap in the artifact itself: the patch introduces the adversarial-counter requirement but did not apply it to its own §2 recommendations.

**Causal shape (honest — not papering over):** The §2 prior-art verdicts are the most research-intensive sections of the patch (H2 has 5 phrasings, full DeepWiki resolution, T16 block). Steps 1–3 are well-executed. Step 4 alone is absent from all three. The adversarial counter is the discipline step most directly called for by the H1 injectable instruction («STEP 4 — ADVERSARIAL COUNTER: Write one sentence beginning with «What would make this wrong:»»). The patch that introduces this requirement did not apply it to its own recommendations.

**The recursive failure is structurally the same class as C6 (L3 research recommendation that failed its own §1.7 checks) for the committed-text dimension, and C1 (accepting a handoff claim without independent verification) for the review-cycle-catch dimension.**

What the adversarial falsification sentences would have been (stated now, after the gap is found — not fixing the prior sections):
- R2a: «What would make the SSOT #20 ADOPT citation wrong for H1: if Claude Code hooks API has changed semantics since the SSOT entry was written, or if the `UserPromptSubmit additionalContext` field no longer injects at the moment of user turn.»
- R2b: «What would make the H2 ADOPT VOCABULARY / BUILD wrong: if an existing production tool (not found in 5-phrasing search) implements per-turn recommendation-discipline scanning — in that case the BUILD verdict on scan predicates should become ADAPT.»
- R2c: «What would make the H10 BUILD wrong: if the MCP tool-call architecture already has a recommendation-gate implementation in a non-indexed repository, or if the tool-call enforcement model changes in a future Claude Code version.»

These sentences were not present in §2. H2 and H10 would have blocked the recommendations until they were added.

---

### §4.5 Step F — Gate 4 self-check

**Gate 4 requirement (kickoff §3 Round 4):** «§self-application lists CONCRETE forward+backward checks EXECUTED over the patch's own recommendations (quoted sentence + predicate result + file:line), NOT a declaration «applied».»

| Gate 4 bullet | Satisfied? | §-anchor in this file |
|---|---|---|
| §4 lists concrete forward+backward checks EXECUTED over recommendations | YES — Steps B/C/D enumerate all 7 recommendation clusters (12 items total), quoted sentence + predicate result per item | §4.1 (H2), §4.2 (H10), §4.3 (H1) |
| Recursive signal (research commits the failure mode) is a FIRST-CLASS finding with Round-2 and Round-3 instances cited by file/section | YES — §4.4 cites Round-2 instance via `STATE.md §Round 2 outcome`; Round-3 via `round-3.md §3.8 changelog`; Round-4 in two sub-instances (§4.4(a) Worker-draft catch + §4.4(b) committed-text Step-4 absence) | §4.4 |
| No «would catch» language — only «predicate fires on this quoted text» or «cannot determine» | YES — all cells use FIRE/BLOCK/ALLOW/ABSENT/PRESENT. §4.3 uses PREDICATE-MATCH for H1 consistently with Round-3 terminology | §4.1, §4.2, §4.3 |
| Every claim carries a file:line or §-section citation (T3) | YES — all quoted sentences carry §-location from main patch or round-3 file; all predicate results reference §3.0 predicate definitions | §4.0 table (source column), §4.1–§4.3 (§-locations per cell) |

**Confidence stated as predicates (T6/T14):**

**What this self-application CAN establish deterministically:**
1. The H2 keyword-predicate fires on R2a, R2b, R2c — because «ADOPT», «VERDICT», «BUILD verdict» tokens appear in those sentences and HAS_ADVERSARIAL = 0 for all three (no «What would make this wrong» sentence exists in §2.1, §2.2, §2.3).
2. The H10 schema BLOCKS R2a, R2b, R2c on `adversarial_falsification` absent. BLOCKS R1 on `ssot_id` absent and `external_search_summary` absent for the shortlist meta-decision.
3. The H1 Step 4 is absent from R2a, R2b, R2c — deterministic given the text of §2.1, §2.2, §2.3.
4. Statistical findings (R3a–R3d) and decision-surface outputs (R5) are correctly outside the verdict-as-tool-call target class.

**What this self-application CANNOT establish:**
1. Whether the adversarial falsification absence was causally important — the BUILD verdicts may be correct even without the adversarial sentence. The H2/H10 mechanisms enforce the discipline regardless of whether the verdict turns out right.
2. Whether the R1 shortlist meta-decision «needs» an ssot_id — the shortlist is a synthesis of already-checked candidates, not a new adoption recommendation. The schema's applicability to meta-synthesis decisions is ambiguous. Flagged as BORDERLINE in §4.2.
3. The recursive finding (Round 4 repeats the failure mode) is established on observable text absences, not on whether the omission caused harm. The severity is lower than C2/C3 (no fabricated evidence, just missing a sentence).

---

### §4.6 Open residuals for Round 5

1. **Adversarial sentences for R2a/R2b/R2c are now stated in §4.4.** Round 5 (decision-needed surface) should include these with the D6 framing — the maintainer needs to know the mechanism verdicts with adversarial falsification, not just the verdict labels.

2. **R1 (shortlist meta-decision) has ssot_id absent.** Whether shortlist-selection counts as a «recommendation» requiring H10 schema is a design question for the H10 implementer — worth surfacing in Round 5 as an implementation boundary decision.

3. **H2 fires on the patch's own §2 text.** This is the 67%-FP problem instantiated on research-patch meta-discourse. Round 5 should surface this as concrete evidence that H2's FP problem applies to non-recommendation contexts the mechanism cannot distinguish. The self-application CONFIRMS the FP finding rather than contradicting it.

4. **The recursive failure (R2a/R2b/R2c lacking adversarial falsification) is a Class-C gap** in the patch itself. Round 5 surfaces whether the maintainer wants the main patch's §2 retroactively amended, or accepts the gap as-documented here in §4.

> **Non-verdict surface note:** Round 4 does not issue a GO/REVISE verdict. The §4.4 recursive finding and §4.5 Gate 4 results are reported as findings for the Reviewer.
