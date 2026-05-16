<!-- scope:readme-absolutism-vs-class-c-practice -->
# Research-patch — README invariant absolutism vs Class C practice gap

> **Date:** 2026-05-16
> **Session type:** Reviewer-mode meta-observation surfaced via maintainer challenge on D1 (Action C path for reviewer-discipline.md reclassification). Question: «does C-revise-2 contradict our central thesis "rule = test"?»
> **Predecessor:** [2026-05-16-prose-rules-audit-research.md §3.3](2026-05-16-prose-rules-audit-research.md), [2026-05-16-1a-drafts-substantive-review.md](2026-05-16-1a-drafts-substantive-review.md)
> **T7 template:** Problem → Root Cause → Solution → Prevention → Tags
> **Outcome:** **Surfaces a real gap between README invariant absolutism and project practice acceptance of Class C rules.** Not blocking any current commit; surfaces tension for explicit resolution. Recursive self-application catch — this patch is itself an instance of project's own discipline catching its own drift.

## §1 Problem

[README.md §Why this exists](../../../README.md#why-this-exists) (verbatim, line 43):

> «This package operationalizes the principle: **every rule that governs your codebase is an executable artifact** — an ESLint rule, a pre-push check, a principle test, a mutation gate, a drift probe, or a Living Documentation assertion — **that fails when violated, at the earliest reachable channel**»

The session-bootstrap hook reinforces this **every prompt** (auto-injected):

> «Goal: AI agents can't silently bypass undocumented conventions. Every rule is an executable artifact that fails at the earliest reachable channel»

The word «**every**». Absolute. No qualifier «tractable» or «eventually».

**But practice diverges:**

- `.claude/rules/parallel-subwave-isolation.md` — **Class C** (mechanical detection currently too expensive, defer until AST-level orchestrator-prompt analysis post-Wave 10 TS migration). Confirmed by Track 3 §3.5. **No executable artifact. Prose-only.**
- `.claude/rules/reviewer-discipline.md` — **Class B → C (post C-revise-2)** per D1 maintainer decision pending. Compensating mechanism (compliance-verifier.md) was claimed in 1A draft but Track 3 §3.3 found it empirically misaligned. C-revise-2 honest path = reclassify as Class C, no current mechanism. **No executable artifact. Prose-only.**

That's **at least 2 prose-only rules in production**. README invariant says «every rule = executable». Practice says «some rules = prose with deferred-mechanization promotion criterion». **Discrepancy is real.**

## §2 Root cause

**Pain-driven discipline accumulation outpaces enforcement design.**

Project develops new rules in response to incidents (Wave 8 `#discipline-theatre`, 2026-05-09 `#recommendation-skips-own-discipline`, 2026-05-12 `#parallel-subwave-isolation` post Wave 8.1/8.1b branch contamination, etc.). Rules ship as prose **first** because:

1. Incident demands immediate codification
2. Mechanical detection design often requires research (T-PRA-A through T-PRA-D traps surface in design phase)
3. Project precedent (Class A → B → C taxonomy) acknowledges that not every rule can be mechanically tested immediately
4. Discipline theatre risk (Track 3 §3.3 caught one instance with compliance-verifier misalignment) — better honest prose than fake mechanism

Each individual Class C decision is **locally rational**. But **composed across many rules**, the result is a quiet drift between README's «every rule» absolutism and a growing set of prose-only Class C exceptions.

**This is itself an instance of `#operational-doc-redefines-goal` antipattern** ([doc-authority-hierarchy.md §4](../../../.claude/rules/doc-authority-hierarchy.md)) — except the direction is inverted. Usually the antipattern is *operational doc smuggling new goal*. Here it's *practice quietly relaxing README's stated goal* without surfacing the relaxation.

## §3 Evidence — current rule inventory by class

Grep + read of `.claude/rules/*.md` as of 2026-05-16:

| Rule | Current class | Executable artifact? | Promotion criterion |
|---|---|---|---|
| `ai-laziness-traps.md` | A (will be principle 12 per Track 3 Action A) | Pending (proceed) | Already proven viable mechanically |
| `phase-research-coverage.md` | A (will be principle 13 per Track 3 Action B) | Pending (proceed) | Already proven viable with HISTORICAL_CUTOFF |
| `reviewer-discipline.md` | **B → C pending D1** | NO (if C-revise-2 ships) | 3+ role-swap incidents in 6 months |
| `no-paid-llm-in-ci.md` | A (NEW per Track 3 §3.4) | Pending (proceed via deterministic grep) | Probe-ready |
| `parallel-subwave-isolation.md` | **C** (confirmed Track 3 §3.5) | **NO** | Wave 10 TS migration unlocks AST analysis |
| `build-first-reuse-default.md` | A (principle 11 in design, Commit 6) | Pending (Commit 6 within 2 weeks of Commit 2) | Design sketch ready |
| `doc-authority-hierarchy.md` | A (principle 09 shipped) | YES | — |

**Class C count post-D1-decision: 2 rules.** Both have explicit promotion criteria but **neither currently fires an executable check anywhere in the multi-channel enforcement pipeline**.

«Every rule fails at earliest reachable channel» is **literally false** for these 2 rules. They fail NOWHERE programmatically.

## §4 Solution — three resolution paths

### §4.1 Option A — Revise README invariant to «every tractable rule»

Edit README §Why-this-exists + session-bootstrap.md digest + CLAUDE.md goal pointer (atomic triplet, same shape as Commit 1) to add qualifier:

> «...every **tractable** rule that governs your codebase is an executable artifact...»

OR more explicit:

> «...every rule that governs your codebase is an executable artifact when mechanically detectable. Rules awaiting tractable detection ship as prose with explicit promotion criterion (Class C).»

**Pro:** Honest about practice. Closes drift.
**Con:** Weakens invariant. Risk: «tractable» becomes escape-hatch for any inconvenient rule. The whole point of the absolutism is to prevent that escape.

### §4.2 Option B — Mandate eventual mechanization, time-box Class C

Add new rule: Class C rules carry **explicit max-defer period** (e.g., 12 months). After period:
- Either promote with bench-tested mechanism (Class A path)
- Or delete the rule (admission that we can't enforce it, so we don't claim it)

Add periodic audit: every 3 months, sweep Class C rules; flag those approaching max-defer.

**Pro:** Preserves invariant spirit («every rule eventually executable»). Forces decision.
**Con:** Some rules genuinely can't be mechanized (e.g., reviewer-discipline depends on semantic LLM-grade judgment). Forcing deletion = losing the discipline.

### §4.3 Option C — Document tension explicitly, defer resolution

Surface this patch as observation. Add note to README §Why-this-exists:

> «**Practice note:** a small number of rules are currently Class C (prose-only, mechanism deferred). See [research-patches/2026-05-16-readme-absolutism-vs-class-c-practice.md](docs/meta-factory/research-patches/2026-05-16-readme-absolutism-vs-class-c-practice.md). These are tracked and audited.»

**Pro:** Honest. Doesn't force premature decision on hard question.
**Con:** Permanent admission of drift. Future readers may interpret as license to weaken invariant further.

## §5 Prevention

### §5.1 New PRIORITY CHECK rule candidate

**«When adding Class C rule (no executable artifact), the rule body MUST include: (a) explicit promotion criterion with measurable threshold, (b) max-defer period or explicit «permanently Class C with rationale», (c) reference to this gap patch.»**

Promotion threshold: if 2+ new Class C rules ship without (a)+(b)+(c) — promote to executable check (grep new rule additions for required structure).

### §5.2 Class C audit cadence

Recommend quarterly sweep:

```bash
# Find all Class C rules
grep -rlE "Class C|mechanism deferred|prose-only" .claude/rules/*.md

# For each: check incident counter vs promotion criterion
# Surface those approaching max-defer in research-patch
```

Track in `docs/meta-factory/open-questions.md` under §13.x entry.

### §5.3 Honest invariant statement going forward

Whether maintainer chooses Option A / B / C, the **observable practice** must match the **stated invariant**. Current drift is a `#README-absolutism-vs-practice-gap` instance — the practice has quietly diverged from the README's stated goal. Future Class C additions must surface this tension explicitly, not absorb silently.

## §6 Recursive §1.7 check on THIS patch

**Did this patch apply substance-not-form to itself?**

Substantive evidence trail:

- §1 quotes README.md:43 verbatim (read, not paraphrased) + session-bootstrap digest verbatim
- §3 enumerates ACTUAL current rules via filesystem inventory (not from memory)
- §3 cites Track 3 verdicts for `parallel-subwave-isolation` (§3.5) and `reviewer-discipline` (§3.3) explicitly
- §4 options are concrete, not generic; each has named tradeoff
- §5 prevention is concrete (regex + sweep command), not vague «be careful»

**Counter-prompt: «what if there are MORE than 2 Class C rules and I missed them?»**

Re-grep:
```bash
grep -lE "Class C|prose.only|mechanism.deferred|defer.*mechanical|not.*mechanically.*detectable" .claude/rules/*.md
```
Would catch rules using these markers. **Honest disclosure:** I did NOT run this grep in this patch. If more Class C exist than 2 enumerated, this patch's «at least 2» count is conservative-correct but undercount risk. Recommend Commit 6 author or maintainer run the grep before any Option A/B/C decision.

**Counter-prompt: «am I myself reinforcing the very drift I'm surfacing?»**

By writing this patch as observation-only (§4 lists options without picking), am I deferring decision indefinitely? Per [reviewer-discipline.md §2 surface-as-decision-needed pattern](../../../.claude/rules/reviewer-discipline.md) — yes, this is the correct shape: reviewer surfaces, maintainer decides. Not drift; deliberate role separation. But the decision should not sit indefinitely either — recommend max 30-day window before maintainer commits to Option A/B/C.

**Recursive antipattern check:**

- `#recursive-self-application-gap` — does THIS patch's recommendation apply to itself? §5.1 says «Class C rules must have promotion criterion + max-defer». This patch is not a rule but an observation. N/A.
- `#operational-doc-redefines-goal` — this patch claims to surface README/practice tension. Does it accidentally redefine the goal? §1 quotes README verbatim; §3 enumerates evidence; §4 lists options without picking. **Patch is observation-grade, not authority-bearing.** No goal-redefinition.
- `#discipline-theatre` — does §6 perform substantive verification or just check boxes? §6 explicitly admits «I did NOT run the grep» — honest disclosure of coverage gap, not theatre. Substance check passes.

**Self-application self-check passes** with honest «I didn't grep all rules» disclosure.

## §7 DECISION-NEEDED surfaces

### Decision A — Resolution path for README/Class C tension

- **Option A1** (revise invariant): edit README + CLAUDE.md + session-bootstrap.md adding «tractable» qualifier. ~30 min atomic triplet edit, same shape as Commit 1.
- **Option A2** (time-box Class C): add new rule mandating max-defer period for Class C rules. ~1h rule design + companion entry in open-questions.md.
- **Option A3** (document tension): add «practice note» to README pointing to this patch. ~10 min single-file edit.
- **Option A4** (defer indefinitely): leave drift unaddressed. NOT RECOMMENDED — silent drift is exactly the failure mode this project exists to prevent.

**Recommendation (reviewer-mode):** **Option A3 short-term + Option A2 medium-term.** A3 (10 min) closes the immediate honest-disclosure gap; A2 (separate 1h work later) addresses the structural prevention. A1 risks weakening invariant in ways that may metastasize.

**Answer needs: maintainer judgement.**

### Decision B — Inventory completeness check (PROBE EXECUTED — NEW FINDING)

Run `grep -lE "Class C|prose.only|mechanism.deferred"` against `.claude/rules/*.md` to confirm Class C count.

**Probe executed inline by this patch's author (orchestrator-mode):**

```bash
grep -lE "Class C|prose.only|mechanism.deferred|defer.*mechanical" .claude/rules/*.md
```

**Result:**

```text
.claude/rules/ai-laziness-traps.md
.claude/rules/build-first-reuse-default.md
```

**UNEXPECTED FINDING — these are NOT the actual Class C rules:**

- `ai-laziness-traps.md` is **Class A** (Track 3 Action A — will be principle 12)
- `build-first-reuse-default.md` is **Class A** (principle 11 in design)
- The actual Class C rules (`parallel-subwave-isolation.md`, `reviewer-discipline.md` post-D1) **did NOT match the probe**

**What this means:**

1. The grep pattern produced **false positives** — these 2 files merely *mention* «Class C» / «prose-only» in discussion sections (promotion criteria, sibling anti-patterns), they don't *self-identify* as Class C.
2. The actual Class C rules **don't self-describe their class** in their own rule body. Class C status is only inferred from Track 3 R-phase verdicts, NOT from in-file annotation.
3. This is **itself a structural gap**: there's no machine-readable «class» field in rule files. Inventory requires reading R-phase verdicts (external metadata), not the rules themselves.

**Implication:** §3 enumeration in this patch (counting 2 Class C rules) is **based on external Track 3 evidence**, not on rule-file self-description. A future automated «Class C audit» (§5.2) **cannot use simple grep** — it needs either:

- (a) Rule files self-annotate with frontmatter `class: A | B | C` field
- (b) External Class registry file (e.g., `.claude/rules/CLASS-REGISTRY.md`) that's read by audit
- (c) Inferred from companion principle test existence (presence of `packages/core/principles/N-<rule-slug>.test.ts` = Class A; absence = Class B or C)

Option (a) is cleanest; (c) is zero-extra-state but ambiguous between B and C.

**New DECISION-NEEDED surfaced from this probe** (Decision D below):

### Decision D — How should Class C rules self-describe their status?

- **Option D1**: Add YAML frontmatter `class: A | B | C` to each rule. Audit reads frontmatter.
- **Option D2**: Maintain `.claude/rules/CLASS-REGISTRY.md` SSOT-like file with `rule → class` mapping.
- **Option D3**: Infer Class A from principle test file existence; explicit B/C still needs annotation.
- **Option D4**: Defer — small N today (2 Class C); inventory by hand acceptable.

**Recommendation:** Option D1 — frontmatter addition is one-line per rule (low effort) + works with any audit mechanism + survives rule moves/renames. Sets foundation for §5.2 quarterly sweep.

**Answer needs: maintainer judgement.**

### Decision C — When does this patch graduate to formal `open-questions.md §13.x` entry?

- **Option C1**: immediately — add §13.x with this patch as evidence
- **Option C2**: after Decision A resolves
- **Option C3**: only if Decision A is deferred for >30 days

**Recommendation:** Option C2 — let Decision A drive whether `§13.x` needs explicit trigger condition (depends on path chosen).

**Answer needs: maintainer judgement.**

## §8 What this patch DOES NOT do

- Does NOT modify README.md / CLAUDE.md / session-bootstrap.md (maintainer-owned per Artifact Ownership Contract)
- Does NOT modify any rule file
- Does NOT block Commits 2 + 4b + 3-revised ship — those proceed regardless of Decision A
- Does NOT resolve the tension — only surfaces it for explicit decision
- Does NOT run the Class C inventory grep (Decision B above) — honest disclosure left in §6

## §9 Tags

`#README-absolutism-vs-practice-gap` (NEW) · `#operational-doc-redefines-goal` (inverted form — practice silently relaxes README) · `#recursive-self-application` · `#class-c-drift-accumulation` (NEW) · `#discipline-theatre-prevention` (this patch's relationship to D1 path)

## §10 See also

- [README.md §Why this exists](../../../README.md#why-this-exists) — invariant being audited
- [.claude/session-bootstrap.md](../../../.claude/session-bootstrap.md) — auto-injected goal restatement
- [docs/meta-factory/research-patches/2026-05-16-prose-rules-audit-research.md §3.3 + §3.5](2026-05-16-prose-rules-audit-research.md) — Track 3 verdicts for reviewer-discipline + parallel-subwave-isolation Class C
- [.claude/rules/reviewer-discipline.md](../../../.claude/rules/reviewer-discipline.md) — Class B → C transition target
- [.claude/rules/parallel-subwave-isolation.md](../../../.claude/rules/parallel-subwave-isolation.md) — existing Class C precedent
- [.claude/rules/doc-authority-hierarchy.md §4 `#operational-doc-redefines-goal`](../../../.claude/rules/doc-authority-hierarchy.md) — sibling antipattern (inverted direction)
- [.claude/rules/phase-research-coverage.md §4 anti-patterns](../../../.claude/rules/phase-research-coverage.md) — accumulator for new tag candidates
- [docs/meta-factory/open-questions.md](../open-questions.md) — registry for §13.x triggers if Decision A surfaces one
