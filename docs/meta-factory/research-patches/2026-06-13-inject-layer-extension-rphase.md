<!-- scope:inject-layer-extension -->
# inject-layer-extension — R-phase findings (G1-T16 / DN-3 auto-populate inject layer)

> **Read-only R-phase.** Run inline by the orchestrator (Mode A, single session) per `/pipeline inject-layer-extension` classification: `TYPE=R-phase → Mode=RESEARCH`. Folder authority inherited from [research-patches/README.md](README.md); scope-bound to the G1-T16 / DN-3 finding.
> **Verdict in one line:** **DEFER (Option C-revised) — keep the inject layer manually-marked, with the now-concrete BUILD design recorded and a *cheaper, sharper* re-trigger.** The reuse-vs-build boundary from [G1-T16](2026-05-31-doc-audit-ship-boundary-findings.md#g1-t16--reuse-vs-build-boundary-finding) holds, but it **shifted** since 2026-05-31: SSOT #101 native `paths:` frontmatter landed 2026-06-01 (one day later), making the *marker-format half* of the BUILD native (zero-code on CC) and reframing the remaining BUILD as **convenience automation** (auto-authoring markers), **not capability enablement** (CC consumers already get path-scoping by hand-editing `paths:`). Per [build-first-reuse-default.md §1 default](../../../.claude/rules/build-first-reuse-default.md), an unconfirmed-demand convenience BUILD = DEFER, not BUILD. **BUILD-now-vs-defer is ultimately a maintainer placement call** ([reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md)) — this R-phase recommends, does not decide.

## §scope (what DN-3 parked)

[DN-3](2026-05-31-doc-audit-ship-boundary-findings.md#dn-3-g1-t16-inject-layer-extension-build-sized-verdict) parked §G1-T16 as a BUILD-sized placement decision: *the auto-populate step — stack-detect → generate `<!-- globs: … -->` markers per artifact class — does not exist; is it BUILD now (own kickoff), bundle, or defer?* G1-T16's own proposal was Option C (defer until 2+ consumer reports). This R-phase re-runs the reuse-vs-build analysis with current (2026-06-13) evidence, does the prior-art consult G1-T16 deferred, and renders a verdict.

## §method

- File:line verification of every existing-loop component (T3 — no prose-only claims).
- Prior-art consult per [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md): SSOT sweep (`prior-art-evaluations.md`) + WebSearch ×1 (this session; caveat in §coverage).
- T16 problem-class checks on every adopted/referenced analog.
- §1.7 forward/backward self-review (§self-reflection).

## §findings

### F1 — The reuse-vs-build picture shifted: native `paths:` landed *after* G1-T16

G1-T16 (dated 2026-05-31) wrote the marker format as ADAPT (`<!-- globs: … -->` from [inject-matching-rule.sh:11-12](../../../.claude/hooks/inject-matching-rule.sh)). **One day later**, SSOT #101 (2026-06-01) recorded that **Claude Code ships native `paths:` frontmatter** scoping a rule to glob-matched files — the CC-native sibling of our hook's `<!-- globs: -->` marker, already dogfooded in-repo on [`phase-research-coverage.md`](../../../.claude/rules/phase-research-coverage.md). Per [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md), a shipped rule should carry **both** channels (`paths:` for CC read-time + `<!-- globs: -->` for the portable edit-time hook, `@dual-pair`).

**WebSearch corroboration (2026-06-13):** Cursor `.cursor/rules/*.mdc` `globs:` frontmatter and Claude Code's native `paths:` frontmatter are now *standard, cross-tool* formats for path-scoped agent rules — but **no surveyed tool auto-generates that frontmatter from project stack detection** (negative-existence, single-sweep — provisional per §coverage).

**Consequence:** the format half of the BUILD (G1-T16's «injection marker format / ADAPT») is now **native, not BUILD** on CC. What remains is purely the *populate glue*.

### F2 — Updated reuse-vs-build breakdown (supersedes G1-T16 table for the format row)

| Layer | Verdict | Evidence |
|---|---|---|
| Stack detection | **REUSE** | `detectStack()` in [packages/core/detector/index.ts](../../../packages/core/detector/index.ts) → `DetectionResult` (framework/runtime/db, confidence-tiered) |
| Rule applicability filter | **REUSE** | detector v1 `patterns.ts` / `index.ts` |
| Scope-marker **format** | **REUSE (was ADAPT)** | CC-native `paths:` (SSOT #101) + portable `<!-- globs: -->` ([inject-matching-rule.sh](../../../.claude/hooks/inject-matching-rule.sh)). Both already exist; **no format code to build.** |
| **Auto-populate loop** | **BUILD (only true BUILD)** | Nothing maps `detectStack()` output → emitted/refreshed `paths:` + `<!-- globs: -->` per artifact class. ~1 script + test + wire = a capability commit. |
| Update on deps change | **REUSE** | [deps-hash-check.sh](../../../packages/core/hooks/deps-hash-check.sh) hash-compare-then-WARN pattern |
| Consumer bootstrap loop | **REUSE** | [tool-bootstrapping/SKILL.md Rule 1-6](../../../skills/tool-bootstrapping/SKILL.md) (analyse → propose → confirm → persist) |

**Net BUILD = one populate step.** Confirmed unchanged-in-existence from G1-T16, but the *format* row demoted ADAPT→REUSE → the BUILD is **smaller and more portable** than G1-T16 estimated.

### F3 — Prior-art consult (the consult G1-T16 deferred)

| Ref | Verdict | T16 problem-class check |
|---|---|---|
| SSOT #61 OhMyOpencode `rulesInjector` | ADAPT (= our hook) | inject-by-glob = our delivery channel; **not** a populate-generator |
| SSOT #60 Agent RuleZ | REFERENCE | policy-engine matchers; CC hooks already native (no auto-populate) |
| SSOT #63 agent-situations | REFERENCE | check-gated injection; no marker generation |
| SSOT #101 CC native `paths:` | ADAPT | the format, now native — **consumed by F1/F2** |
| SSOT #22 Cookiecutter / Copier | ADOPT VOCABULARY | **T16 mismatch:** render-template-once vs ongoing detect→re-populate. Scaffolders emit files at init; the populate step *refreshes scoping markers on deps change*. Different problem class. |
| WebSearch (Cursor/CC frontmatter ecosystem) | — | standard formats exist; **no stack-detect→frontmatter generator surfaced** (provisional) |

**Conclusion:** the populate step is project-specific glue over reused components; the closest upstreams (codemods/scaffolders) operate on **code**, not **rule-scoping frontmatter**, and at **init-time**, not **on-change** — confirmed problem-class mismatch (`#pattern-matching-on-name` avoided). No ADOPT candidate; BUILD-if-pursued remains correct.

### F4 — Design sketch (recorded so a future I-phase starts warm, NOT an implementation)

A `populate-rule-scopes` step (CC-native primary + portable, per dual-implementation-discipline §3):

1. `detectStack(projectRoot)` → `DetectionResult`.
2. Per shipped rule **artifact class**, map detected stack → glob set (reuse detector `patterns.ts` mapping; classes: framework rules, db rules, CI rules…).
3. **Emit/refresh both channels** in each rule's header: `paths:` YAML frontmatter (CC-native) **and** `<!-- globs: … -->` marker (portable hook), kept `@dual-pair`.
4. Re-run on deps change via the deps-hash-check trigger (reuse).

Scope: 1 script + paired-negative test + install/tool-bootstrapping wire = one capability commit (needs a `Prior-art:` trailer + SSOT row at build time). **Dual-channel is mandatory**, else `#cc-only-without-rationale`.

## §verdict — DEFER (Option C-revised), recommended; placement is maintainer's call

Leading with a reasoned pick per [phase-research-coverage.md §1.12](../../../.claude/rules/phase-research-coverage.md):

- **Option A — BUILD now (own I-phase):** scoped, but spends a capability commit on **unconfirmed demand**.
- **Option B — bundle into a wave sub-task:** same BUILD cost, less design review; worse than A on a capability-class change.
- **Option C-revised — DEFER with recorded design + cheaper trigger (RECOMMENDED).**

**Why C-revised, reasoned against the project's own disciplines (not a hedge):**

1. **Demand is unmeasured, and now partly *moot*.** Only **3 of 12** in-repo rules carry markers today (`grep -rl '^<!-- globs:' .claude/rules/` → 3); the manual path works at current scale. More decisively, native `paths:` (F1) means a CC consumer already gets path-scoping by hand-editing one frontmatter line — the populate step automates **authoring**, not the **capability**. Per [build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md), BUILD is for a *confirmed load-bearing gap*; a convenience-automation gap defaults to DEFER.
2. **The BUILD got cheaper but no more urgent.** F1 lowering format ADAPT→REUSE reduces *cost*, not *demand* — cheaper-to-build ≠ should-build (`#integration-overhead-overestimate`'s inverse trap).
3. **Placement is the maintainer's, not the reviewer's.** BUILD-now-vs-defer is a strategy/placement fork ([reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md)) — this R-phase surfaces options + a recommendation; it does not silently start the I-phase.

**Sharpened re-trigger (replaces G1-T16's vague «2+ consumer reports»)** — BUILD when **any one** fires:
- ≥6 shipped rules (half) need path-scope markers (manual authoring crosses the convenience threshold), OR
- ≥1 consumer report of mis-scoped/unscoped rules causing wrong-context injection, OR
- a recipe ships **per-artifact-class** generated rules (markers must be machine-authored at render time — manual no longer reaches).

## §AI-traps active (per [ai-laziness-traps.md §3](../../../.claude/rules/ai-laziness-traps.md))

T11 (prior-art before proposing — §F3 SSOT+WebSearch done, not skipped), T12 (literature sweep run, not from memory), T15 (self-application — §self-reflection), T16 (codemod/scaffolder problem-class mismatch checked, §F3), T20 (no inline verdict without evidence — every claim file:line/SSOT/WebSearch-cited).

**T-ILE-A (domain-specific):** *«G1-T16 already did the table, so just rubber-stamp its DEFER».* Counter — re-verified each row against current code AND swept for state-change since G1-T16; surfaced SSOT #101 (`#adopted-pattern-drift` — the adopted `paths:` analog moved after the finding froze), which materially reframes the verdict's *rationale* (capability→convenience). A rubber-stamp would have missed it.

## §self-reflection (§1.7)

- **Forward-check:** complies with [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (DEFER-with-recorded-trigger is the §1 default for unconfirmed gaps), [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) (F4 mandates dual-channel), [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (research only, $0), [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) (placement surfaced, not decided), doc-authority (folder-inherited header). This patch introduces **no new rule/principle** — so the backward-sweep obligation is N/A (a verdict, not a discipline-bearing artefact).
- **Backward-check:** the only standing convention this *touches* is the inject-layer marker convention; F4 keeps it intact and adds the native-`paths:` sibling rather than replacing it.

## §coverage caveats (T6 / T14)

- **Negative-existence claim is PROVISIONAL** (`#negative-existence-claim`): «no upstream auto-generates rule frontmatter from stack detection» rests on **WebSearch ×1** this session — below the §1 ≥3-phrasing floor; DeepWiki `ask_question` not run (MCP availability unverified in this env). A future I-phase entry-research MUST complete the 6-item sweep before treating it as load-bearing.
- **REUSE-side claims are NOT provisional** — every component is file:line-verified against current HEAD (`aa741d0`).
- T14: clean prior-art sweep at *low* coverage ⇒ «coverage insufficient to fully close», not «no analog exists». The verdict's load-bearing leg is the *demand/convenience* argument (F1, in-repo-verified), not the negative-existence leg.

## Tags

`#own-stack-blind-spot` (surfaced native `paths:` own-stack channel) · `#adopted-pattern-drift` (SSOT #101 landed after G1-T16 froze → verdict rationale shifted) · `#negative-existence-claim` (provisional, single sweep) · `#pattern-matching-on-name` (codemod/scaffolder mismatch checked)
