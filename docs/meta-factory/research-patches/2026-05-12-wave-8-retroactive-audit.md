<!-- scope:§13.29-retroactive -->

# Wave 8 retroactive audit — pre-Wave-8 PRs vs substance gate

> **Authoritative for:** retroactive §1.7 substance-gate audit of merged PRs #25-#43 (Waves 5-8); `#discipline-theatre` evidence corpus; HISTORICAL_CUTOFF rationale; D5 dead-exemption removal record; calibration-window decision.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).

## §1 Problem

PRs #25–#37 (Waves 5-7, 2026-05-10/11) predate the Wave 8.1 substance gate. Many had
`### §1.7 Forward-check applied` sections in their PR bodies that satisfied form (≥40
chars) but contained no `file.ext:N` citations — the exact `#discipline-theatre` pattern
§13.29 was motivated by. The Wave 8.1 CI gate cannot retroactively block merged PRs;
this document records the evidence and marks it as pre-acceptance corpus.

## §2 Method

1. `gh pr list --state merged --base main --limit 50 --json number,title,body,mergedAt`
2. For each PR, searched body for `### §1.7 Forward-check applied` (or variants) and ran
   `grep -oE '[^[:space:]]+\.[a-z]+:[0-9]+'` on the body to count file:line citations.
3. Verdict: **PASS-retro** = has citations; **FAIL-substance** = §1.7 section present, 0 citations;
   **NO-§1.7** = no Forward-check section (research-patch allowlist or N/A); **EXEMPT** = CI
   paths-filter excluded this PR's changed files.

## §3 Findings

| PR | Date | Citations | Verdict | Notes |
|----|------|-----------|---------|-------|
| #25 | 2026-05-10 | 0 | NO-§1.7 | Research-patch + open-questions only; §1.7 referenced in passing |
| #26 | 2026-05-10 | 0 | EXEMPT | Research-patch follow-up, doc-only |
| #27 | 2026-05-10 | 0 | EXEMPT | Research-patch only |
| #28 | 2026-05-10 | 1 | PASS-retro | `plan.md:1` citation in §1.7 |
| #29 | 2026-05-11 | 1 | PASS-retro | Wave 7; 1 citation in §1.7 section |
| #30 | 2026-05-11 | 0 | NO-§1.7 | Explicit "§1.7 N/A — errata only" |
| #31 | 2026-05-11 | 0 | **FAIL-substance** | Touches `prior-art-evaluations.md`; §1.7 section has prose but no file:line |
| #32 | 2026-05-11 | 0 | **FAIL-substance** | SSOT-ID remap; §1.7 section has prose but no file:line |
| #33 | 2026-05-11 | 0 | EXEMPT | `.github/pull_request_template.md` only; excluded by CI paths-filter |
| #34 | 2026-05-11 | 0 | **FAIL-substance** | `.claude/skills/tool-bootstrapping/SKILL.md`; §1.7 section has prose but no file:line |
| #35 | 2026-05-11 | 0 | **FAIL-substance** | `install.sh` + shipped artefacts; §1.7 section has prose but no file:line |
| #36 | 2026-05-11 | 6 | PASS-retro | Wave-5 follow-up; 6 file:line citations |
| #37 | 2026-05-11 | 1 | PASS-retro | `audit-ai-docs.sh:32` in Backward-check |
| #38 | 2026-05-11 | 1 | PASS-retro | Research patch; 1 citation |
| #39 | 2026-05-12 | 11 | PASS-retro | Wave 8.1b (Wave 8 ships substance gate) |
| #40 | 2026-05-12 | 11 | PASS-retro | Wave 8.2 |
| #41 | 2026-05-12 | 11 | PASS-retro | Wave 8.1 |
| #42 | 2026-05-12 | 2 | PASS-retro | Wave 8.3 |
| #43 | 2026-05-12 | 5 | PASS-retro | Wave 8.4 |

**Summary:** 4 FAIL-substance (PRs #31, #32, #34, #35), all pre-Wave-8, all 2026-05-11.
Wave 8 PRs (#39-#43) all PASS-retro — substance gate ships with its own evidence.

## §4 Action taken — PR description amendments

For each FAIL-substance PR, a footer was appended via `gh pr edit` (no git-history rewrite;
PR descriptions are external GitHub metadata):

Footer text appended to PRs #31, #32, #34, #35:

```
---
**2026-05-12 retroactive Wave 8.5 note:** This PR's §1.7 Forward-check section would not
pass the Wave 8.1 substance gate (no file:line citations present). Pre-Wave-8 acceptance —
kept as historical evidence of the `#discipline-theatre` gap that motivated §13.29.
```

Edited PRs: #31, #32, #34, #35.

## §5 D5 dead-exemption removal

`packages/core/audit-self/audit-ai-docs.sh` contained `D5_FALSE_POSITIVE_PATTERNS` with
`packages/preset-next-15-canonical/RULES.md` — a preemptive allowlist added in case the
file evolved to carry a canon phrase. Wave 8.2 junior finding (PR #40 DECISIONS) noted
the entry was dead; this PR confirms via:

```
grep -F "AI agents can't silently bypass undocumented conventions" \
    packages/preset-next-15-canonical/RULES.md  → 0 matches
grep -F "AI cannot silently bypass what fails CI" \
    packages/preset-next-15-canonical/RULES.md  → 0 matches
```

Entry removed; `D5` probe still PASS after removal (`bash audit-ai-docs.sh` confirmed).

## §6 HISTORICAL_CUTOFF rationale

`S17_HISTORICAL_CUTOFF="2026-05-12"` and `PA_HISTORICAL_CUTOFF="2026-05-12"` added to
`.husky/pre-push`. Date chosen = first date Wave 8 substance arms were available to
authors. Commits with `author-date < cutoff` return 0 early in `s17_check_trailer` and
`pa_check_trailer`, preventing retroactive blocking of pre-Wave-8 history replayed via
interactive rebase or cherry-pick. Paired tests: `pre-push.test.sh` arms 5 + 6.

## §7 Early calibration close decision

**Decision: DEFER.** `S17_SUBSTANCE_WARN_ONLY` remains `true` (warn-only).

Waves 8.3 and 8.4 shipped on 2026-05-12 (today). Zero elapsed time since ship; FP rate
is undefined. Flip date per D4 remains **2026-06-10** (30-day window). Condition for
early flip (observed FP rate = 0 across ≥7 days of push activity) has not been met.

## §8 §1.7 Forward-check applied

Per [`.claude/rules/phase-research-coverage.md §1.7`](../../.claude/rules/phase-research-coverage.md):

- **Principle 09** ([`09-doc-authority-hierarchy.test.ts`](../../packages/core/principles/09-doc-authority-hierarchy.test.ts)) — this doc is under `docs/meta-factory/research-patches/`; folder-level authority per `doc-authority-hierarchy.md §5` (README.md in folder carries authority header). Per-file `Authoritative-for:` block above included as belt-and-suspenders.
- **D5 probe** ([`packages/core/audit-self/audit-ai-docs.sh:245`](../../packages/core/audit-self/audit-ai-docs.sh)) — removal of `D5_FALSE_POSITIVE_PATTERNS` verified safe: `bash audit-ai-docs.sh` → D5 PASS.
- **Artifact Ownership Contract** (`CLAUDE.md`) — this doc is a new research-patch; no existing owner override. Appended to append-only accumulator per `doc-authority-hierarchy.md §5`.
- **Trigger sweep §1.6** — §13.29 status updated to `closed`; §13.30 + §13.31 armed in same commit.
- **`#discipline-theatre` propagation** — anti-pattern entry added to `phase-research-coverage.md §4` in same commit, cross-referencing this doc as retroactive evidence corpus.

## §8 §1.7 Backward-check applied

Sweep of `docs/meta-factory/research-patches/` for any existing retroactive-audit pattern:

- No prior retroactive audit doc found in directory. This is the first instance.
- `research-patches/README.md` checked: folder authority covers this doc; no per-file header required beyond the included block.
- `docs/meta-factory/open-questions.md §13.29` updated from `armed` → `closed` in same commit, consistent with this doc's §7 decision.
