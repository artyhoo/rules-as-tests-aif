# Phase 8.8 Retrospective — Prior-art evaluation mechanism

> **Date:** 2026-05-08
> **Branch:** `docs/phase-8.8-mechanism` (forked from `main` HEAD `4949487`, the merge commit of PR #11 closing Phase 8)
> **Phase:** 8.8 — implementation phase (NOT mirror Phase 7.5 docs-only); SSOT + principle test + process gate + commit trailer convention + pre-push hook + anti-tautology meta-test
> **Verdict:** **GO** to Phase 9 entry research (Path B AST gen + Path A LLM gen ROI scoping). No hard-blocker escalation — Phase 8 retroactive audit (§4 below) found no reinvented capability.

---

## Scope

Phase 8.8 ships the build-vs-reuse mechanism in three enforcement layers, each validating a different artifact:

| Layer | Surface | Artifact | Commit |
|---|---|---|---|
| 1 — meta-test | `packages/core/principles/08-prior-art-cited.test.ts` | research files cite SSOT by ID; broken refs caught | T3 |
| 2 — process gate | `EXECUTION-PLAN.md §5.5 Step 1.5` | phase research consult before drafting | T6 |
| 3 — developer-time | `.husky/pre-push` capability detection + commit trailer | capability commits carry `Prior-art:` trailer | T7 + T8 |

The SSOT is `docs/meta-factory/prior-art-evaluations.md` (T1, 3 entries shipped: Autogrep / Netlify framework-info / fitness-functions vocabulary). The hook itself has a paired anti-tautology meta-test (T9) under `tests/hooks/`. T10 closes cross-references (staleness policy, aif-evolve overlap in `aif-comparison.md §9`, fitness-functions vocabulary in `overview.md L2`, recursion thesis preserved at 3 forms in `aif-comparison.md §10`).

---

## Verification block

| # | Probe | Expected | Actual |
|---|---|---|---|
| 1 | Commits ahead of main (excl retro) | 9 atomic | **9 atomic + this retro = 10** (Phase 8.8 prompt header «8 atomic + retro» miscounted by one — see New finding #5) |
| 2 | Conventional-commits compliance | 10/10 (English subjects) | **10/10** |
| 3 | `Prior-art:` trailers on T2+ commits | ≥8 trailer lines (T2-T11) | **10 lines** (T4-T5 + T10 each ship two stacked trailers) |
| 4 | T1 verification: SSOT skeleton + format spec | exists, ≤500 LOC, header line present | **94 lines, header `\| ID \| Candidate \|` present** |
| 5 | T2 verification: Autogrep entry (ID 1) | row present, trailer present | **row at table line, trailer recorded in `git log -1 4382b93`** |
| 6 | T3 verification: principle 08 | 7 sub-tests pass | **7/7** |
| 7 | T4-T5 verification: ID 2 (Netlify) + ID 3 (fitness functions) | both rows present | **`grep -E "^\\| [23] "` → 2 matches** |
| 8 | T6 verification: «Step 1.5» literal in EXECUTION-PLAN | `grep -n "Step 1.5"` | **line 226** |
| 9 | T7 verification: PR template + Prior-art in CLAUDE.md + CONTRIBUTING.md | all 3 conditions | **PR template exists; Prior-art mentioned in both; CONTRIBUTING.md = 190 lines ≤500** |
| 10 | T8 verification: `bash -n .husky/pre-push` | syntax OK | **OK** |
| 11 | T9 verification: hook anti-tautology test | 6/6 sub-tests pass | **6/6** |
| 12 | T10 verification: cross-refs | grep matches all three | **Staleness policy / aif-evolve / fitness functions all present** |
| 13 | Existing tests still green | 239+/239+ core | **239/239** (no regression) |
| 14 | `make self-audit` | green | **green** |
| 15 | New principle test in CI | `principles-meta-tests` job picks up via glob | **✓** (`principles/**/*.test.ts` covers principle 08) |
| 16 | T9 hook test in CI | new step in `principles-meta-tests` job | **added to audit-self.yml** |
| 17 | Each shipped reference doc ≤500 lines | required | prior-art-evaluations.md = 94; CONTRIBUTING.md = 190; CLAUDE.md = 58 — **all ≤500** |

---

## Phase 8 retroactive audit (CRITICAL — escalation trigger)

For each Phase 8 build-vs-reuse decision, post-hoc consult: did Phase 8 reinvent a capability with prior art that was missed? If yes → escalate Phase 9 entry to require Phase 8.8 as hard blocker. If no → soft GO.

| # | Phase 8 decision | Capability area | Prior art that exists | Reuse considered? | Verdict |
|---|---|---|---|---|---|
| 1 | Next 16 detection approach (Phase 8 C1, file-based via Stack Detector v1 inherited from Phase 4) | L1 multi-framework version-aware detection | Netlify CLI framework-info (now SSOT #2, verdict WATCHLIST) | Yes — Phase 4 selected hand-rolled to honour §6.0 #2 (no new explicit deps); Phase 8 inherited the decision, no rebuild | Pass — decision predates Phase 8.8; SSOT now records the Netlify analog for Phase 9+ re-evaluation when stop-rule shifts |
| 2 | Regen diff metric (Phase 8 C2, `preset-similarity.ts`, weighted score 0.4/0.4/0.2) | preset-shape similarity for canonical-regen acceptance | None — context7 lookup at audit time confirms no standard for «preset plan similarity» (snapshot-test diffs / semver-diff don't fit) | Yes — Phase 8 research §3 notes the gap explicitly; no analog to consult | Pass — genuine our build; SSOT entry can be added at Phase 9 entry if Phase 9 wants to record «no analog» as audit trail |
| 3 | Recipe expansion strategy R12/R14/R20 (Phase 8 C4, mechanical lift) | preset → recipe transformation | The `rules-as-tests/preset-next-15-canonical` preset (own product) | Yes — explicit lift from existing preset, no third-party analog needed | Pass — reuse from own surface; principle 08 baseline-exempts the lift commits naturally (test changes, not new abstractions ≥80 LOC under packages/) |
| 4 | Gate 5 invocation mode (Phase 8 C5, per-plan + Opus + advisory + cached) | LLM-driven review infrastructure | AIF `review-sidecar` + `model:` config (already in `aif-comparison.md §1` + §9) | Yes — Phase 8 C5 cites AIF directly; the mode is an *invocation-shape* decision over reused infrastructure | Pass — reuse explicit |
| 5 | `aif-gate-result` emission shape (Phase 8 Task 8.4, Phase 11.1 partial close) | cross-skill verdict JSON contract | AIF GATE-RESULT-CONTRACT.md (already in `aif-comparison.md §9` strongest reuse candidates) | Yes — Phase 8 C3 + Task 8.4 directly consume the AIF schema; mapping is purely additive | Pass — reuse explicit |
| 6 | `/aif-verify` integration spike status | acceptance gate orchestration | AIF `/aif-verify` skill (already in `aif-comparison.md §9` reuse table) | Yes — Phase 8 C3 spike confirmed integration shape; Phase 11 backlog tracks remaining work | Pass — reuse explicit |

**Summary:** zero reinvention found. Phase 8 either (a) inherited Phase 4-7 build decisions, (b) explicitly consulted AIF prior art (per `aif-comparison.md §9`), or (c) built genuinely-new capabilities (regen diff metric) where no analog exists. Phase 8.8 retroactively formalises what Phase 8 informally observed; no hard-blocker escalation. Phase 8.8 acts as a forward gate (Phase 9+ must use §5.5 Step 1.5 + principle 08 + `Prior-art:` trailer) rather than a corrective gate (no Phase 8 capability needs revert/redo).

---

## Self-application at-creation evidence

The principle being established (Phase 8.8 prior-art mechanism) applies retroactively to its own implementation:

- **2026-05-08 analog research session (PR #9 C-park)** — original «Autogrep closest analog» discovery. Pre-Phase-8.8, no SSOT existed; this session is the genesis evidence.
- **PR #9 ultraview verdict (2026-05-08)** — independent reviewer pass that froze the architectural decisions (A1-A6 in Phase 8.8 prompt §3). The ultraview itself was a prior-art consult before formal codification.
- Both predate principle 08 — retroactively legitimate per this retro's acknowledgment that the convention starts at T2 (first SSOT entry + first `Prior-art:` trailer); T1 establishes the base file without trailer per Risk register entry.
- Phase 8.8 commits T2-T11 carry `Prior-art:` trailers (10 trailer lines across 8 commits — T4-T5 and T10 ship two stacked trailers per the ≥1-trailer-per-cited-entry convention).

---

## Stop-rule audit (§6.0)

- **NO LLM at runtime in v1** — held. Hook + principle test + meta-test all deterministic; context7 only at research/edit time, never at hook execution.
- **NO new explicit deps** — held. `package.json` diff = 0 across all T1-T11 commits.
- **NO yargs/commander** — held. Hook uses pure bash + `process.argv`-style argument inspection (no CLI lib).
- **NO Path B AST gen** — held. T8 is bash-on-commits, not AST-on-source.
- **Atomic commits, conventional-commits, English subjects, no emoji** — held (9/9).
- **Apply principle to itself** — held (T2-T11 trailer convention; principle 08 validates SSOT citations; T9 mutation-tests T8 hook).
- **TESTED bash** — held. T8 standalone tests pre-commit caught a placeholder-detection bug (single-word check missed «TODO TODO TODO TODO TODO»); switched to word-tokenizer before committing. T9 caught an early-draft single-line-JSON test fixture that didn't match the hook's regex; rewrote to multi-line before committing. Per Hard Constraint #10 / PR #9 m4 lesson: write standalone test invocations BEFORE committing the hook code.

---

## Time-vs-plan ratio

- Target: 3-5 days wall-clock per Phase 8.8 prompt §0
- Actual: ≪1 day (single session, ≈3 hours including PR #11 review + fix cycle for Phase 8 close-out before Phase 8.8 branch fork)
- Ratio: well under target; same compression as Phase 4-8 burn mode
- >2x trigger: did NOT fire (no RCA needed)

---

## New findings

1. **Hook regex sensitivity to package.json formatting.** The capability detection regex `^\+\s+"[^"]+":\s*"\^?[0-9]` anchors on indented dep entries — flat single-line JSON in T9's first test draft did not match. Real-world package.json is always multi-line, so the regex is correct; the test fixture had to be adjusted, not the hook. Documented in T9 commit body as «TESTED bash» application.
2. **Gaming surface on escape-hatch placeholder rationales.** T8's first draft used a single-token placeholder check (`case "$stripped" in todo|...|placeholder`); pure-repeated placeholders like «TODO TODO TODO TODO TODO» bypass that. Switched to word-tokenizer (every word in rationale must be non-placeholder). T9 sub-test 5 currently doesn't exercise this specific bypass — opportunity for a 7th sub-test if Phase 9 sees gaming attempts.
3. **Recipe `applies-to` glob redundancy** (uncovered during PR #11 review, fixed pre-merge but worth recording at Phase 8.8 level): three Phase 8 recipes had subset-globs duplicating superset-globs. Cleaned up before Phase 8 merge (commit `9fe5a5b`). The `globToRegex` correctness was M1 in the same PR review — Phase 8 acceptance trivially held at similarity=1.0 (regen vs frozen identical) but the metric was undercounting glob overlap on divergent plans, which Phase 9 entry research will rely on for ROI scoping. Both fixed before Phase 8 merge.
4. **«Step 1.5» label vs. list position drift.** §5.5 Step 0 had 5 numbered items; T6 inserted a new sub-step keeping the «1.5» label even though the actual list position became «item 2». The label is preserved per Phase 8.8 prompt T6 wording and matches the prose description («inserted between List capability areas and Resolve candidates»). Future renderings may render it as «2.» — the bold label «Step 1.5 — Consult prior-art-evaluations.md» is the canonical identifier; the auto-numbering is decoration.
5. **Phase 8.8 prompt commit-count off-by-one.** Prompt §0 / §5 / §6 say «8 atomic commits + retro = 9 total», but the task list explicitly enumerates T1, T2, T3, T4-T5, T6, T7, T8, T9, T10, T11 = **9 atomic** (T4-T5 combined into one commit per prompt) **+ T11 retro = 10 total**. The «8» appears to be a prompt-author miscount; the task list itself is consistent. Acceptance §6 grep `wc -l = 9` should be read as `wc -l = 10`. Future Phase-N prompts: count tasks via the explicit task list, not the header summary.

---

## Verdict

**GO** to Phase 9 entry research (Path B AST gen + Path A LLM gen ROI scoping per §13.10 entry #2 trigger fired at Phase 8 close).

Phase 9 entry session **MUST** use:
1. §5.5 Step 1.5 mandatory consult against `prior-art-evaluations.md` for each capability area surfaced.
2. Principle 08 enforcement on the new `phase-9-research.md` (or `phase-9-entry-research.md`) — file must cite SSOT entries by ID; broken refs caught.
3. `Prior-art:` commit trailer convention on capability commits per CONTRIBUTING.md.

Phase 8.8 itself is dogfooded by being the first phase to use the mechanism (T2-T11 trailers + recursive principle 08 application). Phase 9 will be the first downstream consumer; observed false-positive rate from Phase 9 → input to Phase 8.8 retro decision on widening principle 08 scope (currently phase research files only; design docs / retros / commit messages deferred per §3 T3 commit).

Phase 8 retroactive audit (§4) found zero reinvention — Phase 8.8 ships as a **forward gate**, not a corrective gate.

---

## Versioning

- **2026-05-08** — Phase 8.8 close, **GO** verdict for Phase 9 entry. 9 atomic commits + this retro = 10 total on `docs/phase-8.8-mechanism` (forked from `main` HEAD `4949487`, post-PR-#11-merge state). Single-session burn mode (Opus 4.7) ≈3 hours wall-clock. Same compression as Phase 4-8. Stop-rules from §6.0 all held. (Prompt header said «8 atomic», but the explicit task list enumerates 9 — see New finding #5.)
