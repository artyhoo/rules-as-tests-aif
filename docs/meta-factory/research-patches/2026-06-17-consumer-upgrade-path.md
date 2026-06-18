<!-- scope:consumer-upgrade-path -->
# 2026-06-17 — consumer-upgrade-path: refresh shipped framework artefacts on already-installed consumers (design R-phase)

> **Authoritative for:** the consumer-upgrade-path **design R-phase** output (2026-06-17 snapshot) — the prior-art sweep, the BFR-default verdict (recommended, with the dependency call surfaced as DECISION-NEEDED), the framework-owned-vs-consumer-owned boundary derivation, and a conditioned implementation plan for the future `/pipeline consumer-upgrade-path` run to decompose.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The **final ADOPT-vs-ADAPT dependency decision** — **PARKED** for the maintainer per [kickoff §9](../../../.claude/orchestrator-prompts/consumer-upgrade-path/kickoff.md) and reviewer-discipline §2 (see §3 + §9 below). SSOT recording-layer discipline — see [CLAUDE.md `Build-vs-reuse invariant`](../../../CLAUDE.md).

> **Type:** R-phase / design-first. Output is a **doc**, not refresh-path code (T2/T5). Base: `staging`.
> **Tracks:** GH #551 residual (systemic refresh gap) under the #550 umbrella.
> **Source kickoffs:** [`.claude/orchestrator-prompts/consumer-upgrade-path/kickoff.md`](../../../.claude/orchestrator-prompts/consumer-upgrade-path/kickoff.md) (authoritative umbrella brief) + the meta-launch dispatch kickoff.

---

## §0 Method + honest caveats

- **Brainstorming forks** (the four design questions) were surfaced via `AskUserQuestion` (the interactive realisation of `superpowers:brainstorming`'s fork-resolution). In this autonomous aif-handoff run there was **no human to answer** — so per the dispatch **Lever 2 (park-don't-guess)** the genuine forks are **parked** (stated below as Option A → consequence / Option B → consequence) and only the unambiguous parts are carried forward. A park is a valid R-phase outcome, not a failure.
- **Prior-art sweep — partial-channel caveat (load-bearing, honest per T11/T12):** the mandated DeepWiki `ask_question` MCP is **not connected** in this dispatch environment (only the claude.ai Google Drive MCP was present). The sweep was therefore run via **WebSearch (≥3 phrasings, §2)** + the **already-recorded SSOT #22** (which was itself DeepWiki/context7-derived at creation, 2026-05-10). This is enough to *back the recommended verdict* against the named candidates, but a maintainer re-run with DeepWiki reachable should confirm the §2 negative-existence claim before the dependency fork (§3) is finalised. The verdict is therefore **recommended/provisional**, explicitly not load-bearing on the parked dependency decision.

---

## §1 Problem (verified — file:line, not prose; T3)

A consumer that installed **before** an upstream fix never receives it, and there is no safe in-place refresh path:

- `copy_safe()` is **skip-if-exists** by default — `install.sh:187` (`if [ -e "$dst" ] && [ "$FORCE" != "--force" ]; then … return 0`). An existing file is never updated.
- `--force` overwrites **wholesale** — `install.sh:187,225-227` (under `--force`, `merge_prettierignore` and the copy helpers `cp -r` over the destination). It clobbers consumer-owned files too (their `ci.yml`, `.prettierrc`, `RULES.md` edits, the `.ai-factory/` passport).
- Concrete strand (from the umbrella kickoff): `timeliner` installed 2026-06-11; the `agents/*.md` tool-name fix landed 2026-06-16 (`81a0251`, guarded by `packages/core/principles/21-shipped-agent-tools-valid.test.ts`); the consumer still runs the broken pre-fix copies. The gap is **not** agent-specific — it bites every shipped artefact class (hooks, rules, skills, templates, agents).

**In-repo precedent already exists** for the non-destructive shape we need: `merge_prettierignore()` (`install.sh:207-249`) — a plain-bash, marker-delimited (`# >>> rules-as-tests-aif (managed) >>>`), **idempotent** "framework-managed block, preserve consumer content" merge, built with **no new dependency** (explicitly "NO yq"). This is the load-bearing reuse anchor for the recommended path.

---

## §2 Prior-art sweep (build-first-reuse-default §3)

WebSearch, 3 phrasings, 2026-06-17:

1. *"copier update 3-way merge regenerate template without overwriting user changes idempotent"*
2. *"cruft update sync drift project template cookiecutter keep local modifications"*
3. *"re-sync vendored scaffold files upgrade without clobbering user edits npm CLI tool 2026"*

| Candidate | Upstream problem class | Our problem class | Match? (T16) | Verdict |
|---|---|---|---|---|
| **Copier `update`** ([docs](https://copier.readthedocs.io/en/stable/updating/)) | Re-render an evolving **template** into a project the **user is expected to edit**; 3-way merge (old-render ⊕ user-diff ⊕ new-render), state in `.copier-answers.yml`, conflict markers/`.rej`, idempotent. **Python.** | Re-sync **framework-owned** artefacts the consumer is *not* expected to edit in place (divergence belongs in `.override.md`). | **Partial.** Same "re-sync without clobber" class; but our framework-owned files are not user-edit targets, so the expensive 3-way-merge core is largely unneeded. | **ADAPT** (concept) — see SSOT #22; **NOT ADOPT** as a dep (Python). |
| **cruft `update`** ([gh](https://github.com/cruft/cruft)) | Keep a cookiecutter-generated project in sync; commit hash in `.cruft.json` computes the diff; **`skip` glob list** (in `.cruft.json` / `pyproject.toml [tool.cruft]`) preserves local modifications. **Python.** | Same. The **`skip`-glob** = our "consumer-owned ⇒ keep" boundary; the commit-hash stamp = our optional version-awareness. | **Partial** (same as Copier). The `skip`-glob + version-stamp **concepts** map cleanly onto our need. | **ADAPT** (concept). |
| **Node-native analog** (`@timeax/scaffold`, `npm update`, npm `keywords:scaffolding`) | `npm update` = package-version bumps, not scaffold re-sync. `@timeax/scaffold` = generate-with-cache/hooks/watch-reapply, not a 3-way "preserve user edits" merge. | — | **No canonical Node-consumable "re-sync templated files preserving edits" tool exists** (adversarial counter-prompt §1.4 run: "if it existed it would live as an `npx … upgrade` primitive" → none found). | **BUILD/ADAPT** unavoidable for a no-Python path. |

**SSOT consult (mandatory before adding):** existing entry **#22** (`Cookiecutter + Copier`, verdict **ADOPT VOCABULARY**, 2026-05-10/11) already records the dependency blocker — *both are Python; vendoring violates the §6.0 no-new-dep stop-rule.* Its `Trigger to revisit` includes *"Copier ships answer-file-replay primitive consumable from Node without Python interpreter."* The WebSearch sweep confirms **that trigger has NOT fired** (Copier/cruft remain Python-only). #22's verdict therefore still holds and **directly biases the dependency fork toward ADAPT**.

New SSOT rows added by this R-phase: **#124** (cruft — distinct candidate, concept-level ADAPT) and **#125** (the consumer-refresh capability decision, recommended ADAPT, dependency call parked). #22 is **not** rewritten (append-only) — these rows cross-reference it.

---

## §3 BFR-default verdict — recommended, with the dependency call PARKED

**Recommended verdict: ADAPT (no new dependency).** Reuse `copy_safe` + the `merge_prettierignore` marker-block pattern (`install.sh:207-249`); add a per-file **"framework-owned ⇒ overwrite, consumer-owned/`.override.md` ⇒ keep"** classifier. Adapt cruft's **`skip`-glob** concept (as the consumer-owned boundary) and, *if* version-awareness is wanted, copier/cruft's **answer/stamp** concept — without adopting either Python runtime.

- **Why ADAPT over ADOPT:** SSOT #22 (Python-vendoring blocked, trigger un-fired) + the absent Node-consumable analog (§2) + the structural insight that **framework-owned files are not consumer-edit targets**, so copier's 3-way-merge complexity is mostly unneeded for our boundary. Distributing maintenance to a Python upstream would force a Python interpreter into Linux/Windows/OSI-only Node consumer stacks — contradicting [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) (AI/OS/license-agnostic core, degrade gracefully).
- **Falsifier (what would flip this to ADOPT):** if the recommended simple "re-copy framework-owned set + respect `.override.md`" path proves insufficient because consumers legitimately need *partial/3-way* merges of framework files (i.e. files that are *both* framework-owned *and* expected-to-be-locally-edited) — then copier's real 3-way merge earns its keep and the Python cost must be weighed. No such consumer signal exists today.
- **Anti-`#parallel-evolution-creep` guard:** the recommended path is **not** a bespoke 3-way merger (that would be `#parallel-evolution-creep` vs copier/cruft, and a §8 STOP). It is the *minimal* classifier over the existing copy machinery; the rich-merge case is explicitly deferred to the ADOPT branch.

> **DECISION-NEEDED (maintainer / Phase -1 reviewer — NOT the R-phase author, per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) + kickoff §9):**
> **Refresh mechanism — ADOPT a dependency vs ADAPT into our machinery vs BUILD bespoke.**
> - **Option A — ADAPT, no dependency (recommended).** → Lowest maintenance, no Python, reuses proven `merge_prettierignore` shape; cost = we hand-roll the classifier (small) and accept no rich 3-way merge in v1.
> - **Option B — ADOPT `copier` as a dependency.** → Real 3-way merge + `.copier-answers.yml` stamp for free; cost = a **Python interpreter dependency** in every consumer stack, contradicting SSOT #22's recorded blocker + the agnostic-core discipline. Re-opens #22.
> - **Option C — BUILD bespoke 3-way merger.** → Maximum control; cost = highest maintenance + `#parallel-evolution-creep` risk vs tools that already solve this. Not recommended unless Option A demonstrably fails.

---

## §4 Framework-owned vs consumer-owned boundary (T-Upgrade-A — derived, not guessed)

The boundary is **derived from existing authoritative signals**, never a hand-maintained allowlist (T-Upgrade-A counter):

1. **`SHIPPED_DOCS`** (`install.sh:102,109-128`) — the *single source of truth* for the shipped-artefact set (already used for header-verify **and** the copy step so the two can't drift). The framework-owned candidate set = `SHIPPED_DOCS` ∪ the other `copy_safe`'d framework artefacts (hooks, `scripts/*`, `agents/*.md`, skills, templates).
2. **Three-layer authority model** ([INSTALL-FOR-AI.md:237-270](../../../INSTALL-FOR-AI.md)) — Layer 1 = framework default (read-only for consumers; changes flow upstream via PR), Layer 2 = consumer in-place edit (default, preserved by skip-if-exists), Layer 3 = `<file>.override.md` sibling (wholesale replacement; AI reads it *instead of* the base file — `INSTALL-FOR-AI.md:245,259`).
3. **`.override.md` presence** = the **authoritative consumer-ownership signal**. If `<file>.override.md` exists next to a framework-owned file, the consumer has explicitly taken Layer-3 ownership → **refresh MUST skip the base file's overwrite and preserve the override.**

**Honest tension (the real T-Upgrade-A hazard, not hidden):** the three-layer model grants consumers **Layer-2 in-place edits to *any* installed file as the default**. So a consumer *may* have edited an installed framework-owned file in place **without** using `.override.md`. A stateless "re-copy framework-owned set" refresh **would clobber such Layer-2 edits** — irreversibly. SHIPPED_DOCS membership alone therefore does **not** prove "safe to overwrite." Two principled resolutions, which is exactly the **version-awareness fork (design Q3)**:

> **DECISION-NEEDED (maintainer):** **does refresh need a shipped-version/hash stamp?**
> - **Option A — stateless v1 (recommended).** "Re-copy framework-owned set, skip any file with a sibling `.override.md`, leave everything else." Idempotent, no new state file. Cost: in-place (Layer-2) edits to framework-owned files are **not** preserved — **mitigated** by (i) refresh being **opt-in + `--dry-run`-first** (consumer previews every overwrite, reusing the existing `--dry-run` plumbing) and (ii) documenting "to diverge from a framework file, use `.override.md`, not an in-place edit." Acceptance test customises **via `.override.md`** (the model's intended mechanism).
> - **Option B — per-file shipped stamp now (à la `.cruft.json`).** Record a content hash/version at install; refresh overwrites a framework-owned file only when it **still matches** the shipped hash (untouched) and **skips/warns** when it diverges (consumer edited in place). Safer for Layer-2 edits; cost = a new state file to ship + maintain, and the install path must write it.

**Derivation evidence per file class (T-Upgrade-A: state the evidence, don't guess):** `agents/*.md`, `skills/*`, `packages/core/templates/*`, `.claude/hooks/*` are framework-authored, header-verified, and carry no consumer-specific data → framework-owned (Layer 1). `AGENTS.md`, `RULES.md`, `ci.yml`, `.prettierrc`, `.ai-factory/` passport are placeholder-filled or consumer-authored → consumer-owned / Layer-2 by design → **never** in the overwrite set. The ambiguous middle (a framework file Layer-2-edited in place) is precisely what the §4 fork resolves.

---

## §5 Conditioned implementation plan (for the future `/pipeline consumer-upgrade-path` to decompose)

Conditioned on the **recommended** path (Option A / Option A). If the maintainer picks B/C the decomposition changes — re-run this R-phase's §3/§4 against the chosen branch.

- **T1 — refresh entrypoint.** Opt-in only (NOT auto-on-install — out of scope). Shape: `install.sh --refresh` (or `refresh-framework.sh` helper) that iterates the framework-owned set and calls a new `refresh_safe()` = `copy_safe` semantics inverted ("overwrite **unless** consumer-owned signal present"). Honors `--dry-run` (preview every overwrite) and reuses `SHIPPED_DOCS` + the `copy_safe`/marker machinery. **Reuse, ≤ the merge_prettierignore footprint.**
- **T2 — boundary classifier.** Per-file: framework-owned (in set) AND no sibling `.override.md` ⇒ overwrite; else keep. Derived from §4 signals; no hand allowlist.
- **T3 — acceptance tests (paired, MUST run green — kickoff goal #2/#3, T2-trap):**
  - **customise-survives:** create `<framework-file>.override.md`, run refresh, assert the `.override.md` is untouched **and** the base framework file was updated.
  - **paired-negative (stale-refreshed):** plant a framework-owned file with stale content (e.g. an `agents/*.md` with old tool names), run refresh, assert new content present after. A test that can't fail when refresh no-ops is `#discipline-theatre`.
- **T4 — docs.** INSTALL-FOR-AI.md gains a "refreshing framework artefacts" section wiring the three-layer model to the refresh contract ("diverge via `.override.md`, then refresh is safe").
- **Self-application (T15):** dogfood on this repo's own shipped surface — run the refresh against a scratch consumer checkout of this repo's `install.sh` output and confirm a known-stale `agents/*.md` is refreshed while an `.override.md` survives.
- **SDD?** No for the R-phase; the implementation phase is ≥3 tasks → SDD applies then.

---

## §6 §1.7 self-reflexive note (phase-research-coverage §1.7)

- **Forward-check (this design complies with existing disciplines):**
  - [`build-first-reuse-default.md §3`](../../../.claude/rules/build-first-reuse-default.md) — prior-art sweep run **before** any "I propose"; default verdict is ADAPT (reuse), BUILD explicitly rejected as `#parallel-evolution-creep`. Evidence: §2 + §3 above.
  - [`no-paid-llm-in-ci.md`](../../../.claude/rules/no-paid-llm-in-ci.md) — R-phase is session-bound; zero API-billed CI calls; acceptance tests are deterministic bash/vitest.
  - [`doc-authority-hierarchy.md §2-§3`](../../../.claude/rules/doc-authority-hierarchy.md) — this patch carries an Authoritative-for + NOT-authoritative-for header (top of file).
  - [`dual-implementation-discipline.md §3`](../../../.claude/rules/dual-implementation-discipline.md) — the recommended path keeps the core OS/license/AI-agnostic (plain bash), the reason ADOPT-Python is disfavoured.
  - [`reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md) — the ADOPT-vs-ADAPT strategy call is surfaced as DECISION-NEEDED with both consequences, **not** picked by the R-phase author.
- **Backward-check (sweep of existing artefacts under the new design's scope):**
  - `install.sh:187,225-227` — verified `copy_safe` skip-if-exists + `--force` wholesale; the refresh path is a *third* mode beside these, reusing their plumbing.
  - `install.sh:207-249` — `merge_prettierignore` is the existing non-destructive-merge precedent the recommended path generalises (no new dep).
  - `INSTALL-FOR-AI.md:237-270` — the three-layer model + `.override.md` is the boundary source; refresh extends it, does not redefine it.
  - SSOT #22 — consulted; not rewritten; #124/#125 cross-reference it.

---

## §7 AI-traps addressed (ai-laziness-traps §2; active set T2, T3, T11, T12, T15, T16, T-Upgrade-A)

- **T2** — this doc *designs* the classifier; it explicitly does not ship it, and §5/T3 makes the paired tests an acceptance gate (designing ≠ done).
- **T3** — every "broken/preserved" claim carries file:line (§1, §4) or WebSearch output (§2).
- **T11/T12** — the prior-art sweep ran at proposal time (WebSearch ≥3 phrasings + SSOT #22), not from training-data memory; no bespoke merger proposed without it.
- **T15** — self-application step in §5.
- **T16** — "Upstream problem class X vs our problem class Y. Match?" stated explicitly per candidate in §2's table (partial match → upstream validation does not fully transfer → ADAPT not ADOPT).
- **T-Upgrade-A** — the framework-owned set is **derived** from SHIPPED_DOCS + three-layer + `.override.md` (§4), with the Layer-2-edit hazard surfaced as a fork, not guessed away.

---

## §8 Parked decisions (summary for the maintainer + Phase -1 cold-review)

1. **Refresh mechanism — ADOPT(dep) / ADAPT(no dep, recommended) / BUILD.** §3. Genuine BFR-default + dependency-cost fork; reviewer surfaces, maintainer decides.
2. **Version-awareness — stateless (recommended) / shipped-hash-stamp.** §4. Couples to the Layer-2-edit safety hazard.
3. **DeepWiki re-confirmation** of the §2 negative-existence claim, if a maintainer wants the sweep on both mandated channels (DeepWiki was unreachable this run; WebSearch + SSOT #22 used).

Until #1 and #2 are resolved, **do NOT** dispatch the implementation `/pipeline` (kickoff §3 design→implementation gate).

---

## See also

- [`.claude/orchestrator-prompts/consumer-upgrade-path/kickoff.md`](../../../.claude/orchestrator-prompts/consumer-upgrade-path/kickoff.md) — authoritative umbrella brief (design questions this patch resolves/parks).
- [`docs/meta-factory/prior-art-evaluations.md`](../prior-art-evaluations.md) #22 / #124 / #125 — SSOT register.
- [`install.sh:187,207-249,225-227`](../../../install.sh) — `copy_safe` / `merge_prettierignore` / `--force`.
- [`INSTALL-FOR-AI.md:237-270`](../../../INSTALL-FOR-AI.md) — three-layer authority model + `.override.md`.
- [`.claude/rules/build-first-reuse-default.md §3`](../../../.claude/rules/build-first-reuse-default.md) · [`dual-implementation-discipline.md §3`](../../../.claude/rules/dual-implementation-discipline.md) · [`reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md).
