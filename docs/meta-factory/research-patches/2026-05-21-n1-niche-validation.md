<!-- scope:n1-niche-validation -->
# Research-patch — N1 niche-validation R-phase (positioning, negative-existence)

> **Inherits authority from** [research-patches/README.md](README.md) folder-level Authoritative-for header. Scope-bound to: the empirical validation (and sharpening) of the niche-positioning claim proposed in [2026-05-21-niche-strategy-and-growth-roadmap.md §3](2026-05-21-niche-strategy-and-growth-roadmap.md) — Wave **N1** of that roadmap. **NOT authoritative for** project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)) nor for SSOT admission / Commit 7 README wording — those are maintainer/I-phase calls surfaced as decision-needed in §7.
> **Date:** 2026-05-21 · **Author session:** Opus 4.7, N1 research. No rule codified, no SSOT row written, no README edited. Research deliverable only.

---

## §1 — Question (N1 goal, from roadmap §4)

Lock the positioning **empirically**: is there ANY existing tool that combines, *together*, the project's two load-bearing properties —

- **(a) enforcement-substrate** — installs *executable* rule-enforcement artifacts **into the consumer codebase** (lint rules, git hooks, mutation/drift gates, doc-authority checks) that **fail at the earliest reachable channel** (edit-time → pre-commit → pre-push → CI → production audit) when an *undocumented* convention is bypassed; AND
- **(b) recursive self-application** — applies that same enforcement **to its own design/docs** via *failing* meta-tests (the «documents lie; tests don't» thesis turned on the framework itself)?

If no tool combines (a)+(b), the positioning is defensible. The dominant blind-spot to close (per [phase-research-coverage.md §1.1](../../../.claude/rules/phase-research-coverage.md)) is the **own-stack sweep** — AIF and aif-handoff, the project's own upstream, had only been probed at the *macro-scope-discipline* granularity (SSOT [#47](../prior-art-evaluations.md)), never at this two-axis granularity.

## §2 — Method (no-paid-LLM: DeepWiki + WebSearch only)

- **Own-stack sweep (§1.1):** 3 fresh DeepWiki `ask_question` probes each on `lee-to/ai-factory` and `lee-to/aif-handoff` — one per axis + one combined/adversarial. 6 probes total, 2026-05-21.
- **Category sweep (§1.2):** the artefact is a *capability*, so enumerated capability-host categories: architecture-fitness-functions / architectural-tests, living-documentation / executable-specification, spec-driven-development, policy-as-code.
- **Semantic-distance (§1.3):** probed the *function* («enforce undocumented conventions an AI agent could silently bypass, at the earliest channel»), not the vocabulary («rules-as-tests» — which [Superpowers already shares](2026-05-16-companion-target-comparison.md), so vocabulary-match would be a false positive).
- **Adversarial counter-prompt (§1.4):** «if a tool combining (a)+(b) existed, where would it live?» → a meta-linter / fitness-function framework that ships rules AND tests its own rules. Ran 3 WebSearch phrasings assuming the tool exists.
- **Prompt-list ≠ ceiling (§1.5):** went past the 7 companion candidates already in [companion-target-comparison](2026-05-16-companion-target-comparison.md) into the fitness-function category.

## §3 — Evidence

### §3.1 Own-stack: `lee-to/ai-factory`

| Axis | Verdict | Evidence (DeepWiki, 2026-05-21) |
|---|---|---|
| (a) enforcement-substrate into consumer | **NO** | Primary mechanism = generate/scaffold + orchestrate AI via recipes. `/ai-factory.ci` generates CI *pipeline configs*, `/ai-factory.build-automation` generates Makefile/Taskfile — scaffolded files, not installed gates. Explicitly: «leaves rule enforcement to the developer». `init` installs *skills* (agent instructions), not enforcement artifacts. ([probe 1](https://deepwiki.com/search/does-aifactory-install-enforce_66deddbf-6b5c-49d2-80f9-1c5afafbb35e), [probe 3](https://deepwiki.com/search/consider-a-tool-with-two-prope_8c5382ec-acad-4a2c-8dc7-517974f03ec2)) |
| (b) recursive self-application via failing tests | **NO** | `/ai-factory.evolve` = *generative, human-approval* self-improvement; reads `.ai-factory/patches/`, proposes SKILL.md enhancements. «No executable tests that gate these changes… no meta-tests… no drift-detection that fails… advisory rather than enforced». `/ai-factory.docs` + `/ai-factory.verify` validate *user* projects, not ai-factory's own skills. ([probe 2](https://deepwiki.com/search/does-aifactory-apply-its-own-v_848c6766-7dca-4090-a5c4-9cd2e5ffcc7e)) |

### §3.2 Own-stack: `lee-to/aif-handoff`

| Axis | Verdict | Evidence (DeepWiki, 2026-05-21) |
|---|---|---|
| (a) enforcement-substrate into consumer | **NO** | Multi-provider AI runtime + task-orchestration (`@aif/runtime`, `@aif/api`, `@aif/agent`, `@aif/web`). `husky` + `lint-staged` are dev-deps **for aif-handoff's own repo only**. Only consumer-side artefact = `initProject()` → `ai-factory init --agents` scaffolding `.ai-factory/`. Internal `npm run ai:validate` gate is **not propagated to consumers**. ([probe 4](https://deepwiki.com/search/does-aifhandoff-install-enforc_da112061-193d-4700-b997-aedd7c4ee7e4), [probe 6](https://deepwiki.com/search/consider-a-tool-with-two-prope_616eb73b-16e7-40b7-9d3d-352605fb6994)) |
| (b) recursive self-application via failing tests | **NO** | Validation is **unidirectional / external-facing** — validates agent outputs, git branch state (`assertCurrentBranch()`), env config (Zod). Has a DB-boundary lint guard + Stryker mutation testing **for its own repo**, but «no meta-tests that validate documentation against code… validation flows outward, not inward». ([probe 5](https://deepwiki.com/search/does-aifhandoff-apply-its-own_99747d86-cd40-4e75-b3a0-98e4802ceafa)) |

> Confirms and *sharpens* SSOT #47's earlier «ai-factory 0/7 enforcement patterns; aif-handoff 3/7 different application surface» — at this finer two-axis granularity, **both lack axis (a) entirely** (the enforcement-substrate-into-consumer property). aif-handoff's «3/7» were its *own-repo* dev gates (husky/lint-staged/Stryker/lint-guard), not consumer-installed enforcement.

### §3.3 Category sweep — the honest qualification

The adversarial counter-prompt **did** surface candidates on axis (a) alone — and they must be analysed, not dismissed:

| Category | Representatives | Axis (a)? | Axis (b)? | Combined? |
|---|---|---|---|---|
| Architecture fitness functions / architectural tests | ArchUnit, ts-arch, dependency-cruiser, NetArchTest, pytestarch | **partial** — executable rules that fail the build on violation, but *architecture/dependency-scoped*, single-channel (test-suite/CI), and **author-written** (developer writes the rules), not a substrate that captures *existing undocumented* conventions across the multi-channel cascade | NO — libraries, no self-applying meta-tests on own docs | NO |
| Living documentation / executable specs | Cucumber, Concordion, FitNesse | partial — makes *specs* executable | NO | NO |
| Spec-driven development | GitHub Spec Kit, Tessl, Kiro | partial — «build fails when an agent violates spec constraints», CI-integrated | NO — enforces *spec→generated-code*, not arbitrary codebase conventions, and not self-applied | NO |

**Key finding:** the WebSearch itself concluded no single tool «dogfoods its own rules with meta-tests on its own documentation» — «a more specific implementation pattern rather than a named tool».

## §4 — Verdict

**Negative-existence claim VALIDATED at the combined (a)+(b) granularity** — 10-item checklist coverage in §8; load-bearing, not provisional.

But N1 produces a **sharpening, not just a confirmation**, and this is the load-bearing output:

> **The moat is NOT «rules as executable tests».** Architecture fitness functions (ArchUnit family) already enforce rules-as-tests, and Superpowers already *uses the «rules-as-tests» vocabulary* ([companion-target-comparison §3.1](2026-05-16-companion-target-comparison.md)). Claiming that axis as the niche would be `#pattern-matching-on-name` ([ai-laziness-traps.md §2 T16](../../../.claude/rules/ai-laziness-traps.md)) / `#semantic-anchor` ([phase-research-coverage.md §4](../../../.claude/rules/phase-research-coverage.md)).
>
> **The moat is the *conjunction* of three properties no surveyed tool combines:**
> 1. **target = *undocumented* conventions an AI agent could silently bypass** (fitness functions target *architecture*; SDD targets *specs*) —
> 2. **enforced across the *multi-channel cascade*** edit-time → pre-commit → pre-push → CI → production audit, CI as last resort (fitness functions + SDD are single-channel: the test-suite/CI) —
> 3. **with recursive self-application** as a *design invariant* (the framework's own docs/rules carry doc-authority headers + principle meta-tests + a prior-art SSOT meta-test that fail on drift).

## §5 — Positioning statement (proposed, for SSOT + README)

> An **enforcement-substrate for AI-resistant codebases**: it converts a project's *undocumented* conventions into executable artifacts that fail at the earliest reachable channel, and it applies that same discipline recursively to its own design. Companion — not competitor — to process-methodology frameworks (Superpowers) and AI-orchestration runtimes (AI Factory, aif-handoff): they automate *how the agent works* and *what gets generated*; this automates *the mechanical constraints they explicitly delegate away*.

## §6 — §1.7 self-reflexive (per [phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md))

- **Forward-check:** complies with `no-paid-llm-in-ci` (DeepWiki/WebSearch only — both free); `build-first-reuse-default` §3 (DeepWiki ≥3 phrasings + WebSearch ≥3 phrasings + SSOT consult #43/#47/#48/#49 done); `phase-research-coverage` §1.1–§1.5 (own-stack + category + semantic-distance + adversarial + past-the-floor — coverage table §8); `reviewer-discipline` (the maintainer-strategy items — SSOT admission, Commit 7 wording — are surfaced as decision-needed in §7, not decided here); `doc-authority-hierarchy` (this patch declares scope + subordinates to README).
- **Backward-check:** introduces no rule → no existing-artefact sweep owed. Proposes a SSOT row + README edit; those carry their own checks when authored (§7).
- **Self-application:** N1 walked the project's own «verify, don't assert» discipline before asserting the niche — and the §3.3 honest qualification is itself the discipline catching a tempting overclaim (axis (a) is not novel). The recommendation ran its own talk.

## §7 — Decision-needed (maintainer / I-phase; per `reviewer-discipline` §2)

1. **SSOT entry.** Should the validated positioning land as a new `prior-art-evaluations.md` negative-existence row (verdict BUILD; «no upstream combines enforcement-substrate-into-consumer + multi-channel cascade + recursive self-application»; revisit-trigger = any of ArchUnit-family / SDD-tools / Superpowers grows the missing axis)? **Recommendation:** yes — it is the durable record N1 was chartered to produce. Draft row available on request; not written unilaterally because SSOT admission is a maintainer/capability-author act.
2. **Commit 7 README subline (roadmap N1 output + [companion-target-comparison §7 Decision A](2026-05-16-companion-target-comparison.md)).** N1 evidence *strengthens* Decision A Option A1 (name Superpowers + AI Factory + aif-handoff as companions; add deployment-surface line). **Recommendation:** A1, but with the §5 positioning sentence as the lead (it now has empirical backing). Final wording is a maintainer call — `reviewer-discipline` forbids this session from picking it.

## §8 — 10-item checklist coverage (per [phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md))

| Item | Status | Where |
|---|---|---|
| 1 Own-stack sweep | ✓ | §3.1/§3.2 — AIF + aif-handoff, 6 fresh probes |
| 2 Category sweep | ✓ | §3.3 — fitness-functions, living-doc, SDD, policy-as-code |
| 3 Semantic-distance | ✓ | §2 — probed function not vocabulary; avoided «rules-as-tests» false-positive |
| 4 Adversarial on negative-existence | ✓ | §2/§3.3 — counter-prompt surfaced ArchUnit family + SDD; analysed, not dismissed |
| 5 Prompt-list ≠ ceiling | ✓ | went past the 7 companion candidates into fitness-function category |
| 6 Trigger sweep | n/a | not a Step 1.5 phase-entry research |
| 7 Recommendation self-discipline | ✓ | §6 forward/backward/self-application |
| 1.10 Type-system over prose | n/a | no SDK-shaped claims |

## §9 — Tags

`#niche-positioning` `#negative-existence-claim` `#own-stack-blind-spot` `#enforcement-substrate-moat` `#pattern-matching-on-name` `#semantic-anchor`

## §10 — See also

- [2026-05-21-niche-strategy-and-growth-roadmap.md](2026-05-21-niche-strategy-and-growth-roadmap.md) — parent roadmap; this is its Wave N1.
- [2026-05-16-companion-target-comparison.md](2026-05-16-companion-target-comparison.md) — 7-candidate matrix; Decision A (Commit 7 subline).
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT; rows #43/#47/#48/#49 bound the prior enforcement-substrate evidence this patch sharpens.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — §3 research mechanism this N1 followed.
- [.claude/rules/phase-research-coverage.md](../../../.claude/rules/phase-research-coverage.md) — 10-item checklist + §1.7.
