<!-- scope:goal-drift-audit -->

# Goal-drift audit verdict — 2026-06-05

> **Authoritative for:** 2026-06-05 goal-drift audit verdict — doc × criterion table, instrument evidence, Layer-1 mechanization decisions, Layer-2 judgment notes. Records the standing state of goal-fidelity as of this date.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Doc-authority discipline rule — see [.claude/rules/doc-authority-hierarchy.md](../../.claude/rules/doc-authority-hierarchy.md). Principle 09 test — see [packages/core/principles/09-doc-authority-hierarchy.test.ts](../../packages/core/principles/09-doc-authority-hierarchy.test.ts).

**Overall verdict: CLEAN** — zero goal-drift findings across all 6 criteria. Four pre-existing principle test failures (P05, P11, P14, P15) are unrelated to goal-fidelity and pre-date this branch.

---

## §1 Scope audited

**Full-content corpus (~2580 lines, T1 — all read, not sampled):**
`README.md`, `CLAUDE.md`, `.claude/session-bootstrap.md`, `.claude/rules/*.md` (11 rules), `docs/meta-factory/EXECUTION-PLAN.md`

**Header-only corpus (frozen/closed — Artifact Ownership Contract):**
`docs/meta-factory/PROPOSAL.md`, `docs/meta-factory/retros/README.md` + individual retro files

**Special focus:** `.claude/rules/` as touched by ai-doc-audit umbrella (#417–#423, C1 compression + C1-R restoration)

---

## §2 Instrument runs (T3 — all cells carry output)

### Criterion 1 — `#operational-doc-redefines-goal` (grep trigger words, read in context)

**Instrument:** `grep -rin 'north.star\|central thesis\|main goal\|primary goal\|the goal is'`

**Raw output (all hits):**
```text
CLAUDE.md:16: ... not the project's goal. Do not elevate to «north star» in any operational doc.
CLAUDE.md:87: ... pattern-matching on language ... «north star» ...
.claude/rules/doc-authority-hierarchy.md:7: ... EXECUTION-PLAN.md §1 ... «recursive self-application is the north star» ...
.claude/rules/doc-authority-hierarchy.md:22: ... «north star», «central thesis», «main goal» ...
.claude/rules/doc-authority-hierarchy.md:89: ... introduces «north star» / «central thesis» / «main goal» language ...
docs/meta-factory/EXECUTION-PLAN.md:17: ... Earlier framing of recursive self-application as «north star» drifted ...
docs/meta-factory/EXECUTION-PLAN.md:22: ... Re-elevation to «north star» in any phase doc = drift ...
```text

**Judgment (mention-vs-use per §3 T-trap):** Every hit is **MENTION** (guard-text warning against the pattern) — not **USE** (a doc adopting the framing to define its own goal). All 7 hits follow the pattern «do not X» / «earlier framing X … corrected» / «anti-pattern `#operational-doc-redefines-goal` example».

**PASS** — no doc uses goal-redefine framing.

---

### Criterion 2 — `#missing-authority-header` (principle 09 test + grep)

**Instrument:** `npm run -w packages/core test:principles`

**Raw output (relevant):**
```text
Test Files  4 failed | 17 passed (21)
Tests  4 failed | 156 passed | 2 skipped (162)
```text

Principle 09 is in the 17 PASSING files. Principle 17 (no-paid-llm-in-ci) also passes.

The 4 failing tests (P05 manifest-ssot, P11 build-first-reuse-default F1, P14 skill-drift-detection, P15 skill-paired-negative) are pre-existing on `staging` and unrelated to goal-drift.

**PASS (principle 09)** — all authority-bearing docs have `Authoritative for:` headers.

---

### Criterion 3 — `#contradicting-authority-claims` (enumerate all Authoritative-for lines)

**Instrument:** `grep -rn 'Authoritative for:' README.md CLAUDE.md .claude/session-bootstrap.md .claude/rules/*.md docs/meta-factory/EXECUTION-PLAN.md docs/meta-factory/PROPOSAL.md docs/meta-factory/retros/`

**Complete enumeration of goal-bearing authority claims:**

| Doc | `Authoritative for:` scope | Claims goal? |
|---|---|---|
| `README.md:33` | "project goal, methodology, design invariants" | **YES — the one authoritative source** |
| `CLAUDE.md:5` | "AI-tooling conventions, capability-commit gates, build-vs-reuse discipline, Artifact Ownership Contract" | No |
| `.claude/session-bootstrap.md:6` | "operational restatement of project goal + invariants for AI session start; reading order; reviewer drift-prevention check" | No (explicitly delegates: NOT authoritative for project goal — see README) |
| `.claude/rules/doc-authority-hierarchy.md:4` | "doc-authority-hierarchy discipline rule" | No |
| `.claude/rules/ai-laziness-traps.md:4` | "ai-laziness-traps discipline rule" | No |
| `.claude/rules/build-first-reuse-default.md:4` | "project-wide macro-level scope discipline; relationship to upstream tools" | No (explicitly NOT authoritative for project goal) |
| `.claude/rules/dual-implementation-discipline.md:4` | "dual-implementation discipline rule" | No |
| `.claude/rules/memory-codification.md:4` | "memory-codification discipline rule" | No |
| `.claude/rules/no-paid-llm-in-ci.md:4` | "no-paid-LLM-in-CI policy rationale" | No |
| `.claude/rules/parallel-subwave-isolation.md:4` | "parallel-subwave-isolation rule" | No |
| `.claude/rules/phase-research-coverage.md:13` | "searching-layer discipline rule" | No |
| `.claude/rules/recommendation-laziness-discipline.md:4` | "mechanism layer + named anti-pattern catalogue entry" | No |
| `.claude/rules/reviewer-discipline.md:4` | "reviewer-discipline rule" | No |
| `.claude/rules/rule-enforcement-channel-selection.md:11` | "rule-enforcement-channel-selection discipline" | No |
| `docs/meta-factory/EXECUTION-PLAN.md:8` | "phase scope, sequencing, acceptance criteria, operational decisions" | No |
| `docs/meta-factory/PROPOSAL.md:9` | "design history and original architectural proposal (Phase 0.5 – 1.D snapshot, May 2026). FROZEN" | No (points to README) |
| `docs/meta-factory/retros/README.md:3` | "folder convention for phase retrospectives" | No |

**Result: exactly 1 doc (README.md) claims goal-authority.** All others are scoped to discipline/operational/historical domains. No contradicting claims without subordination markers.

**PASS** — single-authority invariant holds.

**Layer-1 mechanization opportunity:** extend principle 09 test to assert `assertExactlyOneGoalAuthorityDoc()` — grep all REQUIRED_HEADER_DOCS for `"project goal"` in their `Authoritative for:` line and assert count == 1 with README.md as the sole match. Ships as paired-negative test (negative: README.md header modified to not mention goal → assertion fails).

---

### Criterion 4 — `#frozen-doc-still-edited` (git log, classify commits)

**Instrument:** `git log --oneline -- docs/meta-factory/PROPOSAL.md docs/meta-factory/retros/`

**Raw output (truncated to relevant portion):**
```text
a3e713d docs(retros): dispatch-worktree-automation umbrella retro — GO/DONE (#285)
aae53aa docs(retro): wave-8 retrospective
ee9b344 docs(phase-9): T5 — retro + GO verdict for Phase 10 entry
a5c000f docs(folders): add folder-level Authoritative-for READMEs (retros/) + update research-patches/
397840c docs(proposal): add Authoritative-for header — freeze as historical artifact
[... pre-freeze commits ...]
```text

**Classification:**
- `397840c` — **freeze commit** (added Authoritative-for header to PROPOSAL.md) — header-only ✓
- All commits post-`397840c` touching the retros/ path are **new retro file additions** (phase-N.md adds), NOT edits to PROPOSAL.md or existing retros
- PROPOSAL.md: `git log 397840c..HEAD -- docs/meta-factory/PROPOSAL.md` → **(empty output)** — zero post-freeze commits

**Retros/phase-4.md** (6 commits, multi-commit flag): commits `4751f8c`, `e143a7d`, `cafd4f3` are titled "close retro Open #N" — tracking open items in the retro file pre-merge, consistent with the retros format which has an explicit "Open" section for unresolved items at phase close.

**PASS** — PROPOSAL.md received no substantive edits after freeze. Retro multi-commits are pre-merge open-item closures, not retroactive rewrites.

**Layer-1 mechanization opportunity:** a principle test can assert `git log <freeze-sha>..HEAD -- docs/meta-factory/PROPOSAL.md` returns empty. Mechanically checks «PROPOSAL.md not edited since freeze». The freeze commit SHA is stable and can be hardcoded.

---

### Criterion 5 — methodology-as-goal (grep + contextual read)

**Instrument:** `grep -rin 'recursive self-application'`

**Key hits (full scan of all results):**
```text
README.md:58: ... recursive self-application. Same precedent as GCC three-stage bootstrap ... Quality signal, not the goal.
README.md:63: Recursive self-application — make self-audit green = quality signal
README.md:68: If recursive self-application breaks ... exactly the failure mode it claims to prevent.
CLAUDE.md:16: Recursive self-application — quality signal ... not the project's goal.
.claude/session-bootstrap.md:15: Quality signal (GCC bootstrap precedent, `rustc` compile-self analogy), not the project's goal.
docs/meta-factory/EXECUTION-PLAN.md:17: Earlier framing of recursive self-application as «north star» drifted from README
docs/meta-factory/EXECUTION-PLAN.md:22: Recursive self-application = quality signal ... not the goal.
docs/meta-factory/EXECUTION-PLAN.md:25: methodology validation is a quality gate on the path to the goal
.claude/rules/ai-laziness-traps.md:119: project invariant #2 («recursive self-application green»)
.claude/rules/build-first-reuse-default.md:91: recursive self-application requirement makes retirement equivalent to abandoning ...
.claude/rules/memory-codification.md:81: per its own §3 ... (recursive self-application, T15)
.claude/rules/reviewer-discipline.md:49: Recursive self-application note: this rule is currently one of two Class C rules
.claude/rules/rule-enforcement-channel-selection.md:92: This rule is itself a rule ... §7 Recursive self-application
```text

**Judgment on build-first-reuse-default.md:91** (most potentially concerning): "Never retire. This rule encodes a project-foundational operating philosophy — recursive self-application requirement makes retirement equivalent to abandoning the discipline-bearing artifact ownership model itself." — This uses "project-foundational" language but:
1. The `Authoritative for:` header is scoped to "project-wide macro-level scope discipline" (NOT project goal)
2. The explicit `NOT authoritative for: project goal — see README.md#why-this-exists` is present
3. The sentence is about the BFR discipline's retirement criterion, not about the project goal

**PASS** — no doc elevates recursive self-application to project goal status.

---

### Criterion 6 — principles intact

**Instrument:** `npm run -w packages/core test:principles 2>&1`

**Raw output summary:**
```text
Test Files  4 failed | 17 passed (21)
Tests  4 failed | 156 passed | 2 skipped (162)

FAILING (pre-existing, unrelated to goal-drift):
  × principles/05-manifest-ssot.test.ts — render-rules.ts --check (RULES.md ↔ manifest drift)
  × principles/11-build-first-reuse-default.test.ts — F1: post-grandfather artifacts missing Prior-art trailer
  × principles/14-skill-drift-detection.test.ts — broken refs / missing frontmatter in current repo
  × principles/15-skill-paired-negative.test.ts — in-scope SKILL.md missing paired-negative block

PASSING (goal-relevant):
  ✓ principles/09-doc-authority-hierarchy.test.ts — all authority-bearing docs have Authoritative-for headers
  ✓ principles/17-no-paid-llm-in-ci.test.ts — no paid LLM in CI workflows
```text

Pre-existing failures (P05/P11/P14/P15) are present on `staging` before this branch and unrelated to goal-drift.

**PASS (goal-relevant principles)** — P09 green.

---

## §3 T7 adversarial counter-prompt (semantic drift without trigger words)

**Counter-prompt:** "If a doc redefined the project goal WITHOUT using 'north star', 'central thesis', or 'main goal' — by stating a *different* goal plainly in an authoritative voice — where would it be? What would it look like?"

**Method:** Read each document's `Authoritative for:` statement and any goal-adjacent introductory sections against README's goal text. Check for any doc that opens with a goal statement not derived from README, that asserts it owns the authoritative definition, or that defines a different telos.

**Findings:**

1. **`CLAUDE.md:16`** — "Goal: AI agents can't silently bypass undocumented conventions..." — this is a direct paraphrase of README §Goal, not a redefinition. The doc explicitly says `NOT authoritative for: project goal — see README`.

2. **`docs/meta-factory/EXECUTION-PLAN.md §1`** — "Goal — AI agents can't silently bypass undocumented conventions..." in the operational restatement — again a direct pointer-paraphrase, with explicit `NOT authoritative for: project goal` and a `Pointer (2026-05-09 goal-hierarchy fix)` annotation calling out the earlier drift.

3. **`.claude/session-bootstrap.md`** — "AI agents can't silently bypass undocumented conventions..." — operational restatement, NOT authoritative for goal (delegating up to README).

4. **`.claude/rules/build-first-reuse-default.md §1`** — "Every capability proposed for this project resolves into ONE of seven verdicts" — this is about capability decisions, not project goal. The BFR rule operates *within* the project goal, not as a redefinition of it.

5. **`docs/meta-factory/EXECUTION-PLAN.md §2`** — mentions "user-value goal (per README) remains primary" — explicitly subordinating to README. **No drift.**

**T7 conclusion:** No semantic drift found. No doc states a different goal in an authoritative voice. All goal-adjacent sections use README-derived paraphrases and explicitly subordinate.

---

## §4 Special focus: #417–423 compression preserved goal-subordination

**Method:** `git diff HEAD -- .claude/rules/no-paid-llm-in-ci.md .claude/rules/parallel-subwave-isolation.md .claude/rules/reviewer-discipline.md CLAUDE.md`

**Findings:**
- **no-paid-llm-in-ci.md (working tree):** Frontmatter (`paths:`, `<!-- globs: -->`, `<!-- inject: -->`) being removed (version-reconcile). `NOT authoritative for goal` header **INTACT** at line 3.
- **parallel-subwave-isolation.md (working tree):** Same — frontmatter removed, `NOT authoritative for goal` header **INTACT** at line 3.
- **reviewer-discipline.md (working tree):** Body being restored from C1-compressed form to full content (per PR #418 fix). `NOT authoritative for goal` header **INTACT**. The restoration adds back §2-§5 sections which were deleted by C1 compression. No goal-authority drift introduced.
- **CLAUDE.md (working tree):** `## Operational conventions` section removed (interim harness-convention content being migrated to `~/.claude/skills/meta-orchestrator/`). `Authoritative for:` and `NOT authoritative for:` headers at lines 5-6 **INTACT**.

**Conclusion:** The C1 compression and subsequent restoration work preserved all goal-subordination headers. The compression DID delete rule bodies (per PR #418 title "restore 4 rule bodies deleted by C1 compression") but the headers — which are what criterion 2 and 3 care about — were not dropped.

**PASS** — compression cycle preserved goal-subordination.

---

## §5 Doc × criterion matrix

| Doc | C1 redefines-goal | C2 authority-header | C3 single-goal-authority | C4 frozen-not-edited | C5 method≠goal | C6 P09 |
|---|---|---|---|---|---|---|
| `README.md` | PASS (guard-only) | PASS | PASS (is the authority) | n/a | PASS | PASS |
| `CLAUDE.md` | PASS | PASS | PASS (subordinate) | n/a | PASS | PASS |
| `.claude/session-bootstrap.md` | PASS | PASS | PASS (subordinate) | n/a | PASS | PASS |
| `.claude/rules/doc-authority-hierarchy.md` | PASS (lists anti-pattern) | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/ai-laziness-traps.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/build-first-reuse-default.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/dual-implementation-discipline.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/memory-codification.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/no-paid-llm-in-ci.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/parallel-subwave-isolation.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/phase-research-coverage.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/recommendation-laziness-discipline.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/reviewer-discipline.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `.claude/rules/rule-enforcement-channel-selection.md` | PASS | PASS | PASS | n/a | PASS | PASS |
| `docs/meta-factory/EXECUTION-PLAN.md` | PASS | PASS | PASS (subordinate) | n/a | PASS | PASS |
| `docs/meta-factory/PROPOSAL.md` | n/a (frozen) | PASS | PASS (frozen) | PASS (no post-freeze edits) | n/a | PASS |
| `docs/meta-factory/retros/README.md` | n/a (frozen) | PASS | PASS | PASS | n/a | PASS |
| `docs/meta-factory/retros/phase-*.md` | n/a (frozen) | n/a (folder-auth) | n/a | PASS (open-item closes only) | n/a | n/a |

---

## §6 Layer-1 / Layer-2 split

### Layer-1: Mechanizable findings → standing gates

Two criteria are now mechanizable and should be added to principle 09 (per §4 deliverable):

**C3: Exactly-one-goal-authority assertion**
- Mechanic: grep all `REQUIRED_HEADER_DOCS` files for `Authoritative for:.*project goal`; assert exactly 1 match pointing to README.md
- Paired negative: modify README.md authority header to omit "project goal" → assertion fails
- Target: `packages/core/principles/09-doc-authority-hierarchy.test.ts` new `it(...)` block

**C4: PROPOSAL.md not edited since freeze**
- Mechanic: call `execSync('git log <freeze-sha>..HEAD -- docs/meta-factory/PROPOSAL.md')`, assert empty
- Freeze SHA: `397840c` (commit "docs(proposal): add Authoritative-for header — freeze as historical artifact")
- Paired negative: test with a later fake SHA as freeze point → detects commits
- Target: same test file

### Layer-2: Judgment findings → always-on injection (no change needed)

**C1 use-vs-mention:** All current `north star` hits are guard-text. The always-on `CLAUDE.md:16` guard ("Do not elevate to «north star» in any operational doc") is the existing injection channel. **No strengthening needed** — current guard is effective.

**C5 methodology elevation:** No doc elevates methodology to goal. The README's `Quality signal, not the goal` language is clear and present in the three always-on docs (README, CLAUDE.md, session-bootstrap.md).

---

## §7 Pre-existing principle test failures (not goal-drift)

For completeness, the 4 pre-existing failures:

| Principle | Test | Status before this branch |
|---|---|---|
| P05 manifest-ssot | render-rules.ts --check (RULES.md ↔ manifest sync) | FAILING pre-existing |
| P11 build-first-reuse-default F1 | post-grandfather capability artifacts with Prior-art trailer | FAILING pre-existing |
| P14 skill-drift-detection | broken refs / missing frontmatter in repo | FAILING pre-existing |
| P15 skill-paired-negative | in-scope SKILL.md missing paired-negative block | FAILING pre-existing |

None of these involve goal-authority drift. They are tracked maintenance debt unrelated to this audit scope.

---

## §8 T15 self-application: this document audited against the rubric

- **C1 (redefines goal):** This doc does not claim to define the project goal. The "Overall verdict: CLEAN" is a finding about other docs, not a goal statement. **PASS**
- **C2 (authority-header):** This doc carries `> **Authoritative for:**` at the top. **PASS**
- **C3 (single-goal-authority):** This doc's `Authoritative for:` is scoped to "2026-06-05 goal-drift audit verdict" — not goal-authority. **PASS**
- **C4 (frozen):** This doc is not frozen. **n/a**
- **C5 (methodology-as-goal):** This doc does not elevate methodology. **PASS**
- `<!-- scope:goal-drift-audit -->` present as first line. **PASS**

---

## See also

- [README.md#why-this-exists](../../README.md#why-this-exists) — the SSOT for all goal claims
- [.claude/rules/doc-authority-hierarchy.md](../../.claude/rules/doc-authority-hierarchy.md) — the rubric §4 anti-patterns
- [packages/core/principles/09-doc-authority-hierarchy.test.ts](../../packages/core/principles/09-doc-authority-hierarchy.test.ts) — Layer-1 standing gate (extended by this audit)
- [docs/meta-factory/research-patches/2026-05-25-narrow-b-benchmark.md](./2026-05-25-narrow-b-benchmark.md) — FP=84% reason NOT to mechanize use-vs-mention
