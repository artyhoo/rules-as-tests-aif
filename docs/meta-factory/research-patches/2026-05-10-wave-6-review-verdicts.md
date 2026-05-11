<!-- scope:§13.21 -->
# §13.26 Wave 6 review verdicts + §7 P-3 capability-gate correction

> **Authoritative for:** Wave 6 review verdicts (§6 D-1..D-6 of parent audit) + §7 P-3 capability-gate correction (MAJOR-1). Date snapshot 2026-05-10.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Probe re-scoring or audit findings re-litigation — see parent audit (frozen).
> **Cross-ref:** parent audit deliverable [2026-05-10-ai-doc-effectiveness-cold-audit.md](2026-05-10-ai-doc-effectiveness-cold-audit.md) (frozen post-merge per Artifact Ownership Contract).
> **Date:** 2026-05-10
> **Branch:** `wave-6/ai-doc-cold-audit`

## §1 Six verdicts (D-1..D-6)

**D-1: DEFER-B (absorb into Wave 7)** — Per parent audit [§4 P-1 Cross-reference](2026-05-10-ai-doc-effectiveness-cold-audit.md) and Wave 7 [research.md §3 (5th-enforcement-layer comparison)](../../../.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/research.md) + [§13.8 Decision-matrix expansion mechanism](../open-questions.md): shipping `UserPromptSubmit` standalone in a Wave 6 follow-up bypasses Wave 7's atomic 5th-layer closure and forces retroactive matrix justification. With reversed sequence (Wave 7 → Wave 5 implementation per commit `5d3d9c0`) Probe 2 FAIL closes BEFORE any Wave 5 code runs — original tradeoff («Probe 2 FAIL waits weeks») is dissolved; deferral is now strictly optimal. Confidence: **high**.

**D-2: SHIP-A** — Per parent audit §3 mechanism table «*CLAUDE.md does not link README's 5-layer taxonomy → Probe 6 FAIL*» + §7 backward-check «*doc edit only, non-capability; CLAUDE.md owned by maintainers + planning sessions, eligible for edit*»: ~5-line edit closes the audit's strongest single finding (per §8 honest meta-assessment) at minimal risk. Companion ~3-line update in [`.claude/rules/doc-authority-hierarchy.md`](../../../.claude/rules/doc-authority-hierarchy.md) parallel-disciplines list. Operator-confirm before merge per Artifact Ownership Contract (CLAUDE.md = «maintainers (deliberate edit)» surface). Independent of Wave 6 closure timeline; ships in separate PR. Confidence: high.

**D-3: SHIP-B (D3+D4 only) — REVISED per MAJOR-1** — Per parent audit §6 audit's preferred + §3 mechanism table «*Probe 1 PARTIAL-revised, Probe 6 FAIL*»: D3 (goal-phrase parity, audit §5 row) + D4 (CLAUDE.md→README link check, audit §5 row) — additions to existing [packages/core/audit-self/audit-ai-docs.sh](../../../packages/core/audit-self/audit-ai-docs.sh) (currently 152 lines; commit produces git `status=M`). **NOT a capability commit** per [CLAUDE.md `What is a capability commit?`](../../../CLAUDE.md) prose definition («*Adds a new file ≥80 LOC anywhere under packages/*») + [.husky/pre-push:115-152](../../../.husky/pre-push#L115-L152) detector logic (`[ "$status" = "A" ] || continue` — only Added, not Modified). Build-vs-reuse consult is discipline-RECOMMENDED (new conceptual capability «doc-vs-doc parity» / «AI-doc drift detection» / «paraphrase drift»): ≥3 context7 phrasings mandatory, SSOT BUILD entry created only if no production-grade analog surfaces; this is wider build-vs-reuse hygiene, not a mechanical pre-push trailer requirement. D5/D6/D7 (audit §5) defer with their parents (D-1, D-4, P-5). Independent of Wave 6 closure timeline; ships in separate PR. Confidence: medium (depends on context7 surface — may flip to WATCHLIST if analog found).

**D-4: DEFER-C** — Per parent audit §3 mechanism row «*Brittle keyword-match*» + §4 P-4 caveat «*keyword-match is structurally brittle; semantic-intent classifier would outperform — out of scope*»: tuning may shift failure modes (e.g. resolve current false-negatives by introducing new false-positives) without net improvement; corpus-replay evidence (option B) not collected and out of audit scope. Trigger: «*next over/under-trigger incident reported*» (audit's specified condition). Inherited trigger ambiguity flagged for Wave 7 §10 Decision-matrix expansion to operationalise (current wording lacks observable signal definition unlike D-6's quantified «3 incidents in 12 months»). Confidence: high (ship deferral); trigger-clarity confidence: low.

**D-5: SHIP-A (schedule as Wave 7, no scope expansion)** — Per Wave 7 [research.md §4 O4](../../../.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/research.md): «*Cold-audit probe adaptation: which of P1-P6 from cold-audit.md translate to consumer-perspective (P1 goal description fits; P4 Authoritative-for header drift-block fits; P6 taxonomy fidelity fits; P2 Step 0, P3 self-reflection skill, P5 auto-memory don't translate — they're session-local).*» Consumer-side cold-audit is already inside Wave 7 §13.27 closure scope (per O4 + «*Recommend concrete §13.27 closure path: harness tool + skeleton pattern + probe set + scoring*»); D-5 is absorbed, not a scope expansion. With reversed sequence (Wave 7 → Wave 5 implementation), consumer-side audit infrastructure is in place BEFORE Wave 5 implementation runs — original confidence-medium hedge dissolves. Confidence: **high**.

**D-6: DEFER-B** — Per parent audit §5 cost summary «*LLM-judge requires Claude API integration; rubric calibration; infrastructure beyond current `audit-ai-docs.sh` scope*»: deterministic D3+D4 ship first (D-3 SHIP-B), and the «*D3-D7 insufficient over 6 months*» trigger requires the data those new probes will start producing post-ship. Pilot-first option (A: «*pilot L-1 only on N=5 fresh sessions*») pays the same Claude API + rubric infrastructure cost without immediate evidence motivating it. Trigger combination (audit's specified): «*D3-D7 insufficient over 6 months*» OR «*3 cross-doc semantic-drift incidents in 12 months*». Confidence: high.

## §2 §7 P-3 capability-gate correction (MAJOR-1)

The parent audit's [§7 forward-check P-3 row](2026-05-10-ai-doc-effectiveness-cold-audit.md) (around line 430 of the parent file) states:

> *P-3 (D3 probe) + D4-D7 probes | Capability commit IF probes total ≥80 LOC inside `packages/core/audit-self/`. Most likely YES — would require `Prior-art:` consult against [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md). Specifically: search SSOT for «doc-vs-doc parity check», «AI-doc drift detection», «paraphrase drift». No SSOT entry currently matches; new entry with `Verdict: BUILD` would need to land in same commit*

This row mis-reads both the [CLAUDE.md `What is a capability commit?`](../../../CLAUDE.md) prose definition and the [.husky/pre-push:115-152](../../../.husky/pre-push#L115-L152) detection logic.

### Evidence

#### CLAUDE.md prose (load-bearing phrase)

> *Adds a new file ≥80 LOC anywhere under packages/.*

The trigger condition is **«new file»**, not «80+ LOC of new content». Adding 80+ lines to an existing file is not a «new file».

#### .husky/pre-push detector implementation

The function `pa_is_new_packages_80loc` (lines 135-144 of [.husky/pre-push](../../../.husky/pre-push#L115-L152)):

```bash
pa_is_new_packages_80loc() {
    local sha="$1" status path lines
    while IFS=$'\t' read -r status path; do
      [ "$status" = "A" ] || continue
      case "$path" in packages/*) ;; *) continue ;; esac
      lines=$(git show "$sha:$path" 2>/dev/null | wc -l | tr -d ' ')
      [ "${lines:-0}" -ge 80 ] && return 0
    done < <(git diff-tree --no-commit-id --name-status -r "$sha" 2>/dev/null || true)
    return 1
}
```

The line `[ "$status" = "A" ] || continue` is load-bearing: it filters out everything except git status `A` (Added). Modified files (`M`) — including additions to existing files — are skipped. CLAUDE.md prose and hook implementation are deliberately synchronised per CLAUDE.md (`mirrors .husky/pre-push detection — the prose definition and the hook stay in sync`).

### Application to D-3

D-3 SHIP-B plan: add probes D3 (goal-phrase parity) and D4 (CLAUDE.md→README 5-layer link check) to existing [packages/core/audit-self/audit-ai-docs.sh](../../../packages/core/audit-self/audit-ai-docs.sh) (currently 152 lines per `wc -l` 2026-05-10). Resulting commit: `git status=M` on the existing path. Pre-push hook does not fire `pa_is_new_packages_80loc` because the file is not `status=A`. Conclusion: **D-3 ship is not a mechanical capability commit**; pre-push hook does not require Prior-art trailer.

### Discipline-recommended consult (separate from mechanical gate)

The build-vs-reuse principle (CLAUDE.md `Build-vs-reuse invariant`) is wider than the mechanical pre-push gate. New conceptual capability «doc-vs-doc parity check» / «AI-doc drift detection» / «paraphrase drift» surfaces in D-3 even though the commit format does not trigger the hook. Consult discipline applies: ≥3 context7 phrasings on those terms; SSOT entry only if no production-grade analog surfaces (per [prior-art-evaluations.md §3](../prior-art-evaluations.md)).

This is a recommendation, not a gate. If the implementation session finds a production analog (e.g. some doc-linting tool with parity-check capability), the SSOT verdict becomes WATCHLIST or DEFER, not BUILD; D-3 ship still proceeds because the hook doesn't fire.

### Implication for parent audit's source-prompt ATTN

The parent audit's source review prompt ([wave-6-review.md L86-87](../../../.claude/orchestrator-prompts/wave-6-ai-doc-cold-audit/wave-6-review.md)) carries this ATTN:

> *STOP if D-3 SHIP path cannot satisfy `Prior-art:` consult — search SSOT first; if no match found and counter-prompt surfaces no production-grade analog, new SSOT entry must land in same commit per CLAUDE.md `Build-vs-reuse invariant`.*

Given the corrected reading: this ATTN does NOT fire as a SHIP-blocker. Discipline-recommended consult is still good practice; but if context7 surfaces a production analog and SSOT verdict becomes WATCHLIST/DEFER, D-3 still ships (the hook doesn't gate it). Revised ATTN guidance for D-3 implementation session: «*If context7 surfaces production-grade analog → consider WATCHLIST verdict in SSOT instead of BUILD; do not block D-3 ship.*»

### Trace of the audit's mis-reading

The parent audit §7 row condition «*Capability commit IF probes total ≥80 LOC inside `packages/core/audit-self/`*» conflates LOC count (≥80) with file novelty (new file). The CLAUDE.md prose «*≥80 LOC*» is a property of «*a new file*»; the audit treated it as a property of «*the diff*». Same arithmetic, different scope. The mis-reading propagated into the [§6 D-3 «Recommendation under mandate»](2026-05-10-ai-doc-effectiveness-cold-audit.md) framing (option D «out of scope (Wave 6 mandate)» pre-supposes Prior-art consult would be needed if mandate lifted) and into the source review prompt's ATTN. This correction patches both surfaces.

## §3 Wave 7 research feeders + Wave 5 implementation downstream notes

**Wave 7 research session is the PRIMARY consumer of these verdicts** per reversed sequence (commit `5d3d9c0`). Wave 5 implementation orchestrator is the secondary consumer, reading these notes only after Wave 7 closes.

### Wave 7 research feeders (PRIMARY)

**Joint-closure handoff to Wave 7 (main business of this feeder):**
- **D-1** absorbed into Wave 7 §13.28 work (5th-enforcement-layer / harness-hooks / `UserPromptSubmit` channel) + Wave 7 §13.8 Decision-matrix expansion (new lifecycle-stage row).
- **D-5** absorbed into Wave 7 §13.27 / O4 work (consumer-perspective cold-audit probe adaptation: P1/P4/P6 translate; P2/P3/P5 are session-local).

**SHIP decisions affecting Wave 7 §10 Decision-matrix expansion + §11 sub-wave outline:**
- **D-1** → one new matrix row for `UserPromptSubmit` lifecycle stage (firing-time, blocking-semantics, configurability per Wave 7 research.md §3).
- **D-5** → §11 sub-wave 7.X for consumer-side audit infrastructure (render-harness + mock-consumer-skeleton + adapted cold-audit probes per Wave 7 research.md §4 O4).

**DEFER decisions Wave 7 should know about (informational, do not preempt triggers):**
- **D-4** trigger («next over/under-trigger incident reported») — Wave 7 §10 may operationalise this trigger if §10 matrix gains a doc-linting / self-reflection-keyword row. Trigger-clarity is currently ambiguous (no observable-signal definition).
- **D-6** triggers («*D3-D7 insufficient over 6 months*» OR «*3 cross-doc semantic-drift incidents in 12 months*») — informational; Wave 7 §10 deterministic-vs-advisory split should not preempt these triggers.

### Wave 5 implementation downstream notes (SECONDARY — read after Wave 7 closes)

**SHIP decisions affecting Wave 5 §11 layering:**
- **D-3** (when shipped, independent of Wave 5/Wave 7 timeline): D3+D4 probes added to `audit-ai-docs.sh`. Wave 5 bootstrapping work may need to inherit propagation pipeline ([install.sh:203](../../../install.sh#L203) repo→consumer copy). Wave 7 infrastructure (5th-enforcement-layer hook + consumer-side audit) is in place by Wave 5 implementation start.

**DEFER decisions Wave 5 should not fold in:** D-4, D-6 triggers as above.

### Operator-confirm gates (independent of Wave 5/Wave 7 timeline)

- **D-2 ship gate** (parallel to anything): maintainer approval per Artifact Ownership Contract for [CLAUDE.md `Project goal pointer`](../../../CLAUDE.md) edit + companion in [.claude/rules/doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) parallel-disciplines list. ~5-line CLAUDE.md edit + ~3-line companion. Maintainer-confirm explicit per Artifact Ownership Contract.
- **D-3 ship gate** (parallel to anything, NOT mechanical capability gate per §2 above): context7 ≥3 phrasings consult on «doc-vs-doc parity» / «AI-doc drift detection» / «paraphrase drift»; SSOT entry only if no production analog surfaces (verdict BUILD if absent, WATCHLIST/DEFER if present).

## §4 REPORT

```text
Session: Wave 6 review (§6 D-1..D-6)
Parent audit: docs/meta-factory/research-patches/2026-05-10-ai-doc-effectiveness-cold-audit.md (497 lines, frozen post-merge)
Verdicts: D-1:DEFER-B(→Wave-7) D-2:SHIP-A D-3:SHIP-B D-4:DEFER-C D-5:SHIP-A(→Wave-7) D-6:DEFER-B
Capability-commit gate triggered for: NONE.
  - D-1 deferred to Wave 7 atomic closure.
  - D-3 ships as additions to existing audit-ai-docs.sh (status=M, not A — pre-push hook does not fire per .husky/pre-push:115-152). Build-vs-reuse consult RECOMMENDED as discipline (new conceptual capability «doc-vs-doc parity»), not mechanical gate.
  - Audit deliverable §7 P-3 row corrected per MAJOR-1 — see §2 of this patch.
Operator-confirm needed before SHIP:
  - D-2: CLAUDE.md + .claude/rules/doc-authority-hierarchy.md disambiguation edits per Artifact Ownership Contract — maintainer approval.
  - D-3: context7 ≥3 phrasings consult on «doc-vs-doc parity» / «AI-doc drift detection» / «paraphrase drift»; SSOT entry only if no production analog (BUILD if absent, WATCHLIST/DEFER if present).
Wave 7 research feeder: produced (PRIMARY consumer per reversed sequence 2026-05-10).
Wave 5 implementation downstream notes: produced (SECONDARY consumer, after Wave 7 closes).
Wave 7 absorption noted:
  - D-1 → §13.28 5th-enforcement-layer + §13.8 Decision-matrix expansion (one new lifecycle-stage row).
  - D-5 → §13.27 O4 consumer-perspective probes (no Wave 7 scope expansion; absorption per O4 explicit P1/P4/P6 translation list).
Confidence: high.
ATTN: none. Source-prompt ATTN «STOP if D-3 SHIP path cannot satisfy Prior-art consult» does NOT fire as ship-blocker per MAJOR-1 correction (gate is non-mechanical; consult is discipline-recommended).
```

## §5 §1.7 forward+backward check (per phase-research-coverage.md)

Applied per [phase-research-coverage.md §1.7](../../.claude/rules/phase-research-coverage.md). This patch introduces an **analytical artefact about discipline** (verdicts on audit findings + capability-gate correction). It does NOT introduce a new rule, principle, or process step — but it edits the operational understanding of an existing one (capability-commit gate). §1.7 applies.

### Forward-check — does this patch comply with existing R/principles/SSOT?

- **Code-level (R1-R20 lint):** patch has no code; non-applicable.
- **Principle-level meta-tests:** patch is a research-patch markdown file; passes principle 09 (Authoritative-for header per [doc-authority-hierarchy.md §3](../../.claude/rules/doc-authority-hierarchy.md)). research-patches/ has folder-level authority via [research-patches/README.md](../research-patches/README.md); per-file header is permitted (escape hatch) — and this patch carries one for clarity.
- **Commit-level (Build-vs-reuse + `Prior-art:` trailer):** patch creation commit and §13.26 status-update commit are both doc edits; neither triggers capability-commit gate (no new file ≥80 LOC under packages/ — research-patches lives under docs/, not packages/; no new dep; no new packages/core/ subdir). Both commits use `Prior-art: skipped — <rationale ≥20 chars>` escape hatch with explicit rationale per CONTRIBUTING.md.
- **Build-vs-reuse SSOT:** the patch itself surfaces a build-vs-reuse claim about D-3 («doc-vs-doc parity» as new conceptual capability), but defers the actual consult to D-3 implementation session. SSOT not edited in this patch.
- **Trigger sweep (§1.6):** Wave 6 audit's parent §7 already performed the trigger sweep at audit close. This patch does not introduce new triggers; it surfaces D-4's trigger ambiguity for Wave 7 to operationalise (§3 informational note).
- **Doc-authority (`doc-authority-hierarchy.md`):** patch carries Authoritative-for + NOT-authoritative-for header per §3 spec.

**Forward-check verdict:** PASS.

### Backward-check — what existing artefacts are affected?

- **Parent audit deliverable** [research-patches/2026-05-10-ai-doc-effectiveness-cold-audit.md](2026-05-10-ai-doc-effectiveness-cold-audit.md): NOT edited (frozen per Artifact Ownership Contract). §2 of this patch corrects the parent audit's §7 P-3 row reading; correction lives here, not in parent.
- **open-questions.md §13.26**: status changes «in-flight» → «closed» + closure paragraph added. No goal-redefinition.
- **wave-6-review.md** ([source review prompt](../../../.claude/orchestrator-prompts/wave-6-ai-doc-cold-audit/wave-6-review.md)): NOT edited (gitignored operator-side artefact). The prompt's «Wave 5 implementation cannot start until this block exists» framing (lines 60-61) is now stale per reversed sequence; operator updates separately. This patch's §3 supersedes the «Wave 5 §12 feeder» framing.
- **Wave 7 prompts** ([research.md](../../../.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/research.md), [review.md](../../../.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/review.md), [orchestrator-kickoff.md](../../../.claude/orchestrator-prompts/wave-7-hot-checks-joint-closure/orchestrator-kickoff.md)): already updated per operator (per session communication 2026-05-10). This patch's §3 feeder block is consumed by Wave 7 research session; Wave 7 prompts already reflect reversed sequence.
- **CLAUDE.md, README.md, .claude/rules/**: NOT edited. D-2 ship (which would touch CLAUDE.md + doc-authority-hierarchy.md) is OUT OF SCOPE of this patch.

**Backward-check verdict:** PASS.

### Self-reflexive trigger (§1.7 self-applies)

This patch IS a discipline-bearing artefact (it claims authority over verdicts + correction reading). §1.7 self-applies. The forward+backward checks above ARE the self-review. The check itself walks §1.1-§1.7 of phase-research-coverage:

- **§1.1 own-stack sweep:** the corrected reading rests on existing project artefacts (.husky/pre-push + CLAUDE.md prose) — own-stack first. No external dependency cited.
- **§1.2 category sweep:** correction is a re-reading of existing rule, not a new format/category proposal. Not applicable.
- **§1.3 semantic-distance:** correction stays in the same vocabulary as parent audit (capability-commit / Prior-art / SSOT) — no paradigm shift needed.
- **§1.4 adversarial check:** the negative-existence claim («D-3 is NOT a capability commit») was tested by reading the actual hook code (positive proof: `[ "$status" = "A" ] || continue` line) and the actual prose (positive proof: «Adds a new file»). Adversarial counter-prompt («could the hook fire on Modified status?») resolved by direct code-reading.
- **§1.5 prompt-list ≠ complete:** not applicable — this patch is responsive to reviewer findings, not a prompt-driven research session.
- **§1.6 trigger sweep:** addressed in forward-check above.
- **§1.7 forward+backward (this section):** done.

**Self-reflexive verdict:** PASS — patch corrects discipline reading and complies with own discipline.

## §6 ATTN

```text
ATTN: none.

Source-prompt ATTN «STOP if D-3 SHIP path cannot satisfy Prior-art consult» from [wave-6-review.md L86-87](../../.claude/orchestrator-prompts/wave-6-ai-doc-cold-audit/wave-6-review.md) does NOT fire as ship-blocker per MAJOR-1 correction (§2 of this patch). Discipline-recommended consult is good practice; if context7 surfaces production-grade analog, SSOT verdict becomes WATCHLIST/DEFER (not BUILD), but D-3 ship is not blocked because pre-push hook does not gate Modified-status commits.

Branch wave-6/ai-doc-cold-audit ready for push (N commits ahead of origin). Push + PR — operator confirms (a) push now / (b) hold / (c) defer.
```
