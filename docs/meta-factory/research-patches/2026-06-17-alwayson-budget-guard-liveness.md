<!-- scope:alwayson-budget-guard-liveness -->
# Always-on budget guard liveness — measure fix + honest ceiling + channel verdict

> **Date:** 2026-06-17
> **Slug:** alwayson-budget-guard-liveness
> **Type:** R-phase (research / survey / verdict) — **no source mutation.** This patch RECOMMENDS; it implements nothing.
> **Umbrella:** `.ai-factory/plans/language-discipline-s3-budget-guard.md` — Stage 3 of the language-discipline-residue umbrella (merged #590).
> **Park status:** Q3 (is wiring warranted, and via which channel?) is **PARKED as DECISION-NEEDED** for the maintainer (§4) per the umbrella's autonomous-dispatch park contract + [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md). Q1 (measure fix) and Q2 (ceiling formula) carry reasoned, evidence-backed recommendations; the channel commitment in Q3 is the maintainer's call and seeds the downstream I-phase.

---

## §0 The gap (one line)

[`scripts/check-alwayson-budget.sh`](../../../scripts/check-alwayson-budget.sh) is a "standing drift-guard" that, run today, fails ~84% over its ceiling — yet it is **wired to nothing**. The project's own thesis («documents lie; tests don't; every rule fails at the earliest reachable channel» — [README.md#why-this-exists](../../../README.md)) turned on itself: an armed-but-never-fired guard, and the meter it depends on over-counts. Verdict: **fix the meter and the ceiling FIRST; the wiring channel is a genuine fork (DECISION-NEEDED).**

## §1 Evidence base (verified in-container, not re-derived from prose)

Loading model (authoritative, [rule-enforcement-channel-selection.md §4 lines 59–62](../../../.claude/rules/rule-enforcement-channel-selection.md) + §7 line 94; SSOT #101): a `.claude/rules/*.md` file **without** `paths:` YAML frontmatter is auto-loaded **always-on** at CC session-start; **with** `paths:` it is **path-scoped** — CC loads the whole rule only at read-time on matching files, *not* every session. Verified the repo carries no `@`-import of rules in [CLAUDE.md](../../../CLAUDE.md) and no SessionStart rule-injection ([`.claude/settings.json` SessionStart](../../../.claude/settings.json) runs only `link-coordination.sh`); always-on delivery is therefore CC-native auto-load plus the UserPromptSubmit bootstrap *digest* ([`inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh)), which carries invariant **summaries**, not full rule text.

Per-file census (`wc -c`, current `staging` working tree; `paths:` detected in frontmatter head):

| File | Bytes | Frontmatter `paths:`? | Loaded |
|---|---:|---|---|
| `CLAUDE.md` | 15 707 | n/a (native) | **always-on** |
| `ai-laziness-traps.md` | 19 997 | no | always-on |
| `build-first-reuse-default.md` | 12 605 | no | always-on |
| `companion-install-principle.md` | 5 125 | no | always-on |
| `doc-authority-hierarchy.md` | 12 142 | no | always-on |
| `dual-implementation-discipline.md` | 17 880 | no | always-on |
| `kickoff-staging-placement.md` | 5 826 | no (only `<!-- globs: -->`) | always-on |
| `language-discipline.md` | 6 517 | no | always-on |
| `memory-codification.md` | 11 553 | no | always-on |
| `recommendation-laziness-discipline.md` | 11 150 | no | always-on |
| `reviewer-discipline.md` | 7 397 | no | always-on |
| `no-paid-llm-in-ci.md` | 5 638 | **yes** | path-scoped |
| `parallel-subwave-isolation.md` | 8 536 | **yes** | path-scoped |
| `phase-research-coverage.md` | 29 063 | **yes** | path-scoped |
| `rule-enforcement-channel-selection.md` | 16 300 | **yes** | path-scoped |

Derived totals:

- **Naive measure** (what [`measure-always-on.sh`](../../../scripts/measure-always-on.sh) reports today = `CLAUDE.md` + all 15 rules): **185 436 B → 83.6 % over** the 101 000 ceiling.
- **True always-on** (discount the 4 `paths:`-scoped rules): **125 899 B → 24.7 % over** the ceiling.
- **Overstatement by the current meter:** **59 537 B = +47.3 %** above the true always-on load (trap **T-LangRes-A**, confirmed empirically). Stage 1's path-scoping did not move the naive number because the meter counts path-scoped rules identically — exactly the predicted blind spot.

## §2 Q1 — Should `measure-always-on.sh` discount `paths:`-scoped rules? **Yes.**

**Recommendation (clear on the evidence): yes — the meter is wrong and must skip `paths:`-scoped rules.** [`measure-always-on.sh:10-11`](../../../scripts/measure-always-on.sh) globs `find .claude/rules -maxdepth 1 -name '*.md'` and byte-sums every match with `CLAUDE.md`. It makes no distinction between always-on and path-scoped rules, so it reports the always-on baseline 47.3 % too high. Falsifiable: if CC's loading model ever changed so that `paths:`-scoped rules *were* loaded every session, this finding would be wrong — but the model is verified above (§1) and the rule itself dogfoods it.

Fix sketch (for the downstream I-phase — **not implemented here**): when assembling the file list, skip any rule whose YAML frontmatter contains a `paths:` key, e.g. before the byte-sum, `head -8 "$f" | grep -qE '^paths:' && continue`. Emit both numbers if useful (`total_bytes` = always-on; an optional `scoped_bytes` for visibility), so the meter never silently re-bloats.

**True always-on baseline after the meter fix + further path-scoping.** Of the 10 always-on rules, two groups:

- **Path-scopable** (carry a determinate file scope, so they *can* move to `paths:`-scoped exactly like their already-scoped peers) — `ai-laziness-traps` (→ kickoffs/research-patches/rules/skills/agents), `build-first-reuse-default` (→ `package.json`/`packages/**`), `companion-install-principle` (→ `setup`/`install.sh`/`setup.d/**`), `doc-authority-hierarchy` (→ `docs/**`/`.claude/rules/**`/root `*.md`), `dual-implementation-discipline` (→ `.claude/hooks/**`/`agents/**`/`.claude/skills/**`/`packages/**`), `kickoff-staging-placement` (→ `.claude/orchestrator-prompts/**`), `language-discipline` (→ machinery: `.claude/hooks/**`/`.claude/skills/**`/`scripts/**`). **Subtotal 80 092 B.**
- **Irreducible always-on floor** (no determinate repo path — fire on a turn regardless of which file is touched) — `CLAUDE.md` (project instructions), `memory-codification` (fires on memory writes, outside the repo), `recommendation-laziness-discipline` (inline-verdict on any turn), `reviewer-discipline` (review-session turns). **Subtotal 45 807 B.**

Resulting baselines:

| Scenario | Always-on bytes | vs 101 000 ceiling |
|---|---:|---|
| **B0** — naive meter (today's bug) | 185 436 | +83.6 % |
| **B1** — meter fix only (discount the 4 existing `paths:` rules) | 125 899 | +24.7 % |
| **B2** — B1 + path-scope the 7 file-scopable rules | 45 807 | **−54.6 %** |

Note the load-bearing consequence: **the meter fix alone (B1) does not bring always-on under the current ceiling** — the surface is genuinely 24.7 % over even when measured honestly. Only path-scoping the file-scopable rules (B2) yields a lean surface. A concrete, free sub-finding: `kickoff-staging-placement.md` already carries a `<!-- globs: .claude/orchestrator-prompts/** -->` marker (for the edit-time injector) but **lacks the matching `paths:` frontmatter** its sibling `parallel-subwave-isolation.md` (identical scope) has — adding `paths:` there is a one-line, zero-judgment scoping win.

## §3 Q2 — What is an honest ceiling?

**Recommendation (formula clear; final number depends on the I-phase scope decision).** The 101 000 default is stale: it was set on 2026-06-04 against the naive over-counting meter and predates Stage 1, so it gates a number that does not reflect true always-on load. An honest ceiling = `ceil(true_baseline × (1 + headroom))`, where `true_baseline` is the post-fix always-on figure and `headroom` absorbs legitimate growth of `CLAUDE.md` and the 3–4 sweeping invariants.

| If the I-phase targets… | Baseline | Honest ceiling @30 % headroom | @40 % headroom |
|---|---:|---:|---:|
| **B2** (path-scope file-scopable rules) | 45 807 | ~60 000 B | ~64 000 B |
| **B1** (meter fix only) | 125 899 | ~164 000 B | ~176 000 B |

The B1 ceiling (~164 KB) is honest arithmetic but **legitimizes a large standing surface** — i.e. it would bless the very always-on bloat the guard exists to prevent (`#always-on-bloat`, [rule-enforcement-channel-selection.md §5](../../../.claude/rules/rule-enforcement-channel-selection.md)). The B2 ceiling (~60 KB) reflects a genuinely lean surface and still catches re-bloat. **The ceiling cannot be finalized until the maintainer/I-phase decides which rules get path-scoped** — Q2's deliverable is this formula + scenario table, finalized post-decision. Headroom of 30 % is defensible for a slow-growth surface (rules are added rarely and deliberately); document whichever % is chosen in the script comment so the next reader sees the derivation, not a magic number.

## §4 Q3 — Which channel, and is wiring even warranted? — DECISION-NEEDED (do NOT auto-pick)

This is a **genuine strategy fork** with no determinate answer on the evidence, surfaced per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) and the umbrella park contract. Two facts narrow but do **not** resolve it: (a) per [rule-enforcement-channel-selection.md §1](../../../.claude/rules/rule-enforcement-channel-selection.md), the byte-*sum* is mechanically detectable → a gate is *possible*; but (b) "is this always-on surface legitimately this big?" is a **judgment** call, and a hard byte gate is a proxy that can false-fail on a legitimately-added invariant. Ruled OUT regardless of channel: **wiring at the stale 101 000 ceiling** — a guard that hard-fails every commit at 84 % over is worse than no guard (trap **T-LangRes-C**); fix meter + ceiling (Q1/Q2) *before* any wiring.

- **Option A — pre-push gate** ([`.husky/pre-push`](../../../.husky/pre-push), the script's own original intent, line 4). → *Consequence:* earliest-reachable deterministic gate; blocks re-bloat at push, zero standing context cost. *Cost:* hard-fails local pushes; brittle if the ceiling/measure are even slightly wrong; couples every contributor's push to a fuzzy proxy.
- **Option B — principle test** (`packages/core/principles/<N>-alwayson-budget.test.ts`). → *Consequence:* natural home beside the other 22 principle tests; repo-wide, deterministic. *Cost:* CI is the **last-resort** channel per the project goal — fires latest, not earliest; weaker than A on the "earliest reachable" invariant.
- **Option C — periodic re-audit only, no gate** (parallel to [memory-codification.md §4(c)](../../../.claude/rules/memory-codification.md)). → *Consequence:* lowest friction; treats the metric as a judgment-shaped signal (no false-fails); matches the slow drift rate (rules are added rarely). *Cost:* re-introduces the "armed-but-not-fired" risk this very patch indicts — drift sits until someone re-runs the audit.

**The reviewer cannot pick between A / B / C** — the choice trades the project's "earliest reachable channel" thesis against the "don't gate a judgment rule" thesis ([`#gate-where-judgment-needed`](../../../.claude/rules/rule-enforcement-channel-selection.md) §5), and depends on how stable the B1-vs-B2 baseline is after the I-phase. **Maintainer decides; that decision seeds the downstream I-phase (meter fix → ceiling → chosen channel).**

## §5 Folder-required sections

- **Problem.** `scripts/check-alwayson-budget.sh` is unwired (`grep -rl` across `.github/`, `.husky/`, `.claude/settings.json`, `package.json`, `packages/core/principles/` returns empty) and, run today, fails at 83.6 % over its stale 101 000 ceiling; its meter `scripts/measure-always-on.sh:10-11` over-counts always-on load by +47.3 % (59 537 B) because it byte-sums `paths:`-scoped rules as if always-on.
- **Root Cause.** Two compounding gaps: (1) the C1-I follow-up that was to wire the guard "once the real ceiling is known" ([`check-alwayson-budget.sh:4`](../../../scripts/check-alwayson-budget.sh)) never landed (`#recursive-self-application-gap`, [phase-research-coverage.md §4](../../../.claude/rules/phase-research-coverage.md)); (2) the meter never modelled CC's `paths:` path-scoping, so the ceiling was calibrated against an inflated number (`#measure-vs-reality`).
- **Solution (backstop — research deliverable only).** This patch: documents the true baselines (B0/B1/B2), the meter fix sketch (§2), the honest-ceiling formula (§3), and parks the channel choice as DECISION-NEEDED (§4). No source mutated.
- **Prevention.** Before wiring any "standing drift-guard", verify the *meter it depends on measures the real quantity* (here: discount path-scoped rules) AND that the threshold derives from the post-fix baseline + documented headroom — never wire a guard at a threshold the current surface already violates. Generic "be careful" is rejected; the operational rule is: *meter-correctness and threshold-derivation precede wiring.*
- **Tags.** `#armed-but-not-fired` `#measure-vs-reality` `#recursive-self-application-gap` `#always-on-bloat` `#stale-threshold` `#gate-vs-judgment`

## §6 §1.7 self-reflexive note

- **Forward-check.** This patch complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (all evidence is deterministic `wc -c` / `grep` / file reads — zero API-billed calls); [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) (the recommended meter fix REUSES the existing `paths:` frontmatter mechanism — SSOT #101 — rather than building new measurement infra; the only proposed BUILD is a `grep -qE '^paths:'` skip, justified by the confirmed measure bug at `measure-always-on.sh:10-11`); and [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) (Q3's strategy choice is surfaced as DECISION-NEEDED, not decided here).
- **Backward-check.** This patch extends, and supersedes nothing. It is the Stage-3 deliverable of the language-discipline-residue umbrella (#590) and the empirical confirmation of trap T-LangRes-A named in its kickoff. It self-applies the project's own «documents lie; tests don't» thesis to one of the project's own enforcement artefacts (`#recursive-self-application-gap`).

## See also

- [`scripts/check-alwayson-budget.sh`](../../../scripts/check-alwayson-budget.sh) — the unwired guard under analysis.
- [`scripts/measure-always-on.sh`](../../../scripts/measure-always-on.sh) — the over-counting meter (fix target, §2).
- [rule-enforcement-channel-selection.md §1, §4, §5, §7](../../../.claude/rules/rule-enforcement-channel-selection.md) — channel framing (§4) + the `paths:` loading model (§4 catalogue, §7) the baselines depend on.
- [memory-codification.md §4(c)](../../../.claude/rules/memory-codification.md) — periodic-re-audit precedent (Option C).
- [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) — surface-as-decision-needed pattern governing §4.
