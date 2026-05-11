<!-- scope:wave-7 -->
---
# Wave 7 Decision Matrix — §1.7 Backward-Check Self-Review Patch

> **Authoritative for:** §1.7 backward-sweep record for the 9 new Decision matrix rows landed in sub-wave 7.5.a. Scope: one patch per matrix expansion ≥3 rows (mirrors §13.8 4-criteria gate dogfooding). Append-only, scope-bound by Wave 7 7.5.a commit `0aae1b9`.

## Problem

Sub-wave 7.5.a added 9 new rows to `self-application.md §3` Decision matrix (commit `0aae1b9`). §1.7 backward-check is mandatory for every discipline-bearing artefact: each new row must be swept against all existing artefacts under the rule's scope (R1-R20 lint rules, principles 01-09 meta-tests). Without an explicit record, the backward sweep cannot be verified in future reviewer cycles.

## Root Cause

Decision matrix expansion is an implicit discipline-bearing act — each new row codifies an enforcement verdict (MUST / SHOULD / MAY) that future implementers will treat as authoritative. The §1.7 forward-check (applied at write-time in 7.5.a commit body) is visible in git log; the backward-check needs a permanent record beyond the commit body to survive compaction and reviewer-agent context loss.

## Backward Sweep

### Existing artefacts under scope

**R1-R20 (code-level lint rules):** TypeScript hygiene (R1), validation at boundaries (R2), architectural boundaries (R3), tests for new public code (R4), async correctness (R5), errors (R6), time/randomness/IO (R7), observability (R8), imports/dependencies (R9), naming (R10), CI integrity (R11), Server vs Client Components (R12), data fetching (R13), forms (R14), accessibility (R15), performance (R16), component tests (R17), TanStack Query/SWR (R18), styles (R19), Server Actions (R20).

**Principles 01-09 (meta-tests):** P01 executable-check, P02 paired-negative-test, P03 ast-over-grep, P04 no-tautology, P05 manifest-ssot, P06 must-not-demoted, P07 documents-lie, P08 prior-art-cited, P09 doc-authority-hierarchy.

### Row-by-row sweep

**All R1-R20 vs all 9 rows:** R1-R20 are code-layer lint rules scoped to TypeScript/ESLint/AST enforcement on consumer project code. The 9 new Decision matrix rows operate at the framework's own enforcement layer (pre-commit hooks, pre-push hooks, CI jobs, harness hooks, Makefile targets). These are orthogonal layers with no overlap. **Batch verdict: all R1-R20 trivially complementary across all 9 rows — different layers.**

**P01 (executable-check) vs rows 1-9:** every new row describes an enforcement mode with a concrete mechanism (pre-commit hook, CI job, Makefile target, etc.) — each is itself an executable check. Row 5 (local advisory skill) is the only MAY-not-blocking row; advisory is still an observable signal, not a silent pass. **No conflict.**

**P02 (paired-negative-test) vs rows 1-9:** rows describe enforcement layers, not individual tests. Negative-test discipline applies within the layer (e.g., row 1 markdownlint has anti-tautology tests in `audit-ai-docs.test.sh`). The matrix itself doesn't introduce new tests — it records existing ones. **No conflict.**

**P03 (ast-over-grep) vs rows 1-9:** rows 1 (markdownlint structural) and 9 (goal-phrase parity audit) use grep/bash probes, not AST. P03 applies to code-rule enforcement (ESLint AST > grep for TypeScript). Markdown/doc probes have no AST equivalent — bash grep is the correct tool. **No conflict.**

**P04 (no-tautology) vs rows 1-9:** P04 prohibits tests that only assert the rule configuration, not the rule behavior. The matrix rows reference enforcement mechanisms that have their own paired-negative tests (e.g., audit-ai-docs.test.sh negative probes for markdownlint, template-render.audit.ts P1 negative test). **No conflict.**

**P05 (manifest-ssot) vs rows 1-9:** matrix rows are not rule definitions; they are enforcement-layer verdicts. They don't add R-numbered rules to the manifest. **No conflict.**

**P06 (must-not-demoted) vs rows 1-9:** none of the 9 rows removes or demotes an existing MUST verdict. Rows 1 and 4 add new MUST verdicts; rows 2, 6-9 add SHOULD/MAY. No demotion. **No conflict.**

**P07 (documents-lie) vs rows 1-9:** this is the principle the matrix embodies — enforcement mechanisms replace trust in docs. All 9 new rows satisfy P07 by pointing to concrete enforcement artifacts (commits, CI jobs, Makefile targets). **Complementary.**

**P08 (prior-art-cited) vs row 7 (§1.7 trailer check):** both check commit trailers. P08 checks for `Prior-art:` trailer on capability commits. Row 7 checks for `§1.7:` trailer on rule-introducing commits. Different keys (`Prior-art:` vs `§1.7:`), different scopes (capability commits vs discipline-bearing commits), different hooks (pa_check_trailer vs s17_check_trailer in `.husky/pre-push`). Coexistence proven by Batch F.c implementation. **Complementary, no conflict.**

**P09 (doc-authority-hierarchy) vs row 4 (template-render audit):** P09 checks that canonical docs have `Authoritative-for` headers. The template-render audit P4 probe checks that _rendered_ templates (installed at consumer site) carry authority headers. P09 checks the static doc list (REQUIRED_HEADER_DOCS in principle test); row 4 checks the post-install rendered output. Complementary — P09 catches static drift, row 4 catches install-time rendering drift. **Complementary, no conflict.**

**Non-trivial pair highlight — row 1 (markdownlint structural) vs doc-content R-rules:** R1-R20 have no doc-content rules (all are code lint). The 500-line limit is enforced by `.husky/pre-commit` as a custom bash check, not a markdownlint rule. Row 1 (markdownlint structural lint) enforces _structural_ markdown primitives (heading levels, list indent, blank lines, trailing whitespace). The 500-line custom rule and markdownlint structural rules are additive, not duplicative. **Complementary.**

### Summary verdict

All 9 new rows are **complementary** to or **extend** existing R1-R20 + P01-P09 artefacts. No conflicts detected. Backward sweep complete.

## Prevention Rule

Any Decision matrix expansion of ≥3 rows triggers a self-review patch in `research-patches/` (this pattern). The patch:
1. Lists artefacts under scope (R1-R20 + P01-P09 at time of expansion)
2. Documents batch verdict for trivially-orthogonal groups
3. Calls out non-trivial pairs with reasoning
4. Records summary verdict

This mirrors the §13.8 4-criteria gate dogfooding loop — the mechanism is applied to its own activation event.

## Tags

- `#recommendation-skips-own-discipline` — if this §1.7 backward sweep were skipped, the matrix expansion itself would fail §1.7 forward-check on rule-introducing artefact (recursive trap caught by the rule it skips)
- `#recursive-self-application-gap` — Wave 7 surfaced this gap by demonstrating the sweep must be explicit, not implicit in the commit body: AI agents can't verify the sweep from a commit message alone
