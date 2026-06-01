<!-- scope:satellite-architecture-and-dogfooding-positioning -->
# Satellite architecture + honest dogfooding — positioning patch

> Scope: positioning claim record (additive to existing niche framing) + two planned kickoff slots in [wave-sequencing-plan.md](../wave-sequencing-plan.md). Folder-level authority per [research-patches README](README.md); scope-bound by this positioning addition. NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists); per-wave content lives in the kickoffs themselves (gitignored under `.claude/orchestrator-prompts/`).

> **Origin:** 2026-05-24 brainstorm session — maintainer confused why the freshly-merged `meta-orchestrator` skill «не находится»; investigation surfaced a duplicate-under-git pattern (`skills/<own>/` + `.claude/skills/<own>/` both tracked, same tree-hash) and the `install.sh` self-install refuse guard. Maintainer formulated the operating principle behind these as a positioning claim («проект сам себе первый consumer»). This patch records it as the canonical artifact.

> **Status:** POSITIONING — additive to existing project framing (niche-strategy, storm-readiness, companion-to-AIF). Two kickoffs (K1 audit, K2 architecture refactor) are *proposed* for the wave plan via the diff in §6; apply is maintainer-click (one `git apply` command). Not implemented in this PR.

---

## §1 The new positioning (4 points)

**«Satellite architecture + honest dogfooding.»**

The project is a satellite in a constellation of AI-assistance tools (next to Superpowers, AIF, OhMyOpencode, etc.) and is **its own first consumer**. From which:

1. **One source of truth per artifact.** What we ship to a consumer is the file we ourselves use. No «shipping copy» + «using copy» duplicated under git.
2. **Install is symmetric.** Self-install = consumer-install; the only difference is the install target directory. The current `install.sh` self-install refuse guard (`install.sh:42-46`) is **kept** — it's defensive against accidental overwrite of in-flight local state — but the architecture around it must make self-install a coherent, intentional operation.
3. **Each artifact occupies its own niche — and where a companion already does X, evaluate by function (not name) who's better.** If the companion's version is better or equivalent → drop ours, recommend installing theirs. If we have a real improvement → write ours **next to** theirs (depending on / wrapping / extending their base), never duplicate or replace silently. Pattern: «stand beside and improve», not «replace and hide». This is a specific shape of [`build-first-reuse-default` §1](../../../.claude/rules/build-first-reuse-default.md) **ADAPT** verdict — augmentation rather than parallel reimplementation.
4. **Companions stay external.** Our `install.sh` does not bundle Superpowers / AIF / etc. It *offers* them at install-time with a one-line description of what they're for, and delegates to **their own installers** if the user accepts. Never a copy of a companion's files from our repo.

## §2 Why this is a positioning claim, not just refactor scope

The 4 points above are testable / falsifiable:

- A duplicate (same artifact tracked at two paths) ⇒ point 1 violated, claim falsified.
- A `skills/<own>/` change that doesn't appear in `.claude/skills/<own>/` ⇒ point 2 violated (asymmetric).
- A skill in `.claude/skills/` that re-implements a companion skill ⇒ point 3 violated unless documented as a real improvement that depends on the companion.
- An `install.sh` that copies companion files from this repo ⇒ point 4 violated.

This means the positioning is **load-bearing for future PRs**: any architectural change has to pass these four checks. That's why it gets its own artifact (not buried in a wave-plan note).

## §3 Relationship to existing rules + invariants

| Existing artifact | Relationship |
|---|---|
| [`README.md` invariant #2](../../../README.md) («recursive self-application green») | **Extended.** Before: self-tests. Now also: self-install. The project applies its own discipline at every layer it ships. |
| [`build-first-reuse-default.md` §1](../../../.claude/rules/build-first-reuse-default.md) | **Refined.** Point 3 (augmentation pattern) is a specific shape of the ADAPT verdict — «use their base + add our layer», distinct from «take their pattern + reimplement locally». May warrant adding a verdict row `ADAPT-AUGMENT` to that rule's §1 table at a future touch. |
| [`dual-implementation-discipline.md`](../../../.claude/rules/dual-implementation-discipline.md) | **Adjacent, not subsumed.** dual-implementation governs *delivery channel choice* (CC hook vs portable agent) for a feature we ship. Satellite-positioning governs whether we ship at all (vs. delegate to companion) — and how source-of-truth is shaped across `skills/` ↔ `.claude/skills/`. Different axis. |
| [`doc-authority-hierarchy.md`](../../../.claude/rules/doc-authority-hierarchy.md) | **Followed.** This patch ships with the folder-level `research-patches/` authority + scope-bound origin; the upstream `README.md§Why this exists` retains project-goal authority unchanged. |
| Existing niche framing — `project_niche_strategy_roadmap` memory + [niche-strategy patch](2026-05-21-niche-strategy-and-growth-roadmap.md) | **Additive.** Niche = «conscience/enforcement-substrate» (where we play). Satellite-positioning = «how we relate to other players in the constellation». Both true simultaneously. |

## §4 Falsifiers (what would invalidate this positioning)

- The companion ecosystem stops existing (Superpowers / AIF / etc. discontinued) → «stand beside» loses target; revisit as standalone tool.
- A companion explicitly says «do not depend on us» → point 3 augmentation requires re-evaluation per-companion.
- `install.sh` symmetric self-install proves impossible without architectural cost greater than its benefit → revisit point 2 (e.g. accept asymmetry as documented exception).
- The project gains material non-maintainer consumers who don't want companion-installation offers → revisit point 4 (e.g. opt-out flag).

## §5 Two planned kickoffs (K1 audit, K2 architecture refactor)

These are the proposed work units. Each gets its own kickoff document at admission time (lives in `.claude/orchestrator-prompts/`, gitignored). Slot placement in §6.

### K1 — Niche audit: `self-reflection` + `template-audit` vs companions

- **Shape:** R-phase (audit), $0 deterministic, parallel-safe.
- **Scope:** read [`.claude/skills/self-reflection/SKILL.md`](../../../.claude/skills/self-reflection/) and [`.claude/skills/template-audit/SKILL.md`](../../../.claude/skills/template-audit/); for each, evaluate function vs. companion-installed alternatives (Superpowers v5.1.0 at `~/.claude/plugins/cache/superpowers-dev/superpowers/5.1.0/skills/`, AIF, OhMyOpencode); apply §1 point 3.
- **Deliverable:** `docs/meta-factory/research-patches/<date>-niche-audit-self-reflection-and-template-audit.md` with per-skill verdict: `KEEP-AS-IS` / `REWRITE-AS-AUGMENTATION` / `REMOVE-USE-COMPANION-INSTEAD`.
- **Track:** Track 2 (cheap, no deadline, parallel-safe) — same shape as existing `2.3 channel-earliness audit`.

### K2 — Satellite-architecture refactor: install.sh symmetry + companion-offer + source-of-truth

- **Shape:** R-phase + I-phase. Larger work.
- **R-phase inputs needed:**
  - Build-first-reuse check on «interactive companion-offer at install-time» — does any companion ship this pattern?
  - How Superpowers / AIF themselves handle their own `~/.claude/skills/<own>/` (symlink, install-into-self, ignore, ...)?
  - Symlink vs copy-into-self vs gitignore-the-mirror trade-offs for `.claude/skills/<own>/`.
- **I-phase:** rewrite `install.sh` to (a) allow self-install behind explicit flag (the existing refuse guard at `install.sh:42-46` stays as default), (b) ship interactive companion-offer prompt, (c) remove the `skills/<own>/` ↔ `.claude/skills/<own>/` duplicate-under-git pattern via chosen mechanism.
- **Predecessor of:** `Track 3.3 N6b — one-button install` (consumer-facing scaffold should not inherit the architecture defects K2 fixes).
- **Successor of:** K1 (K1 verdicts determine which existing `.claude/skills/<own>/` items K2 migrates vs drops).

## §6 Proposed wave-sequencing-plan diff (apply-ready)

This patch does **not** edit [`wave-sequencing-plan.md`](../wave-sequencing-plan.md) directly: at the time of writing, that file has un-committed foreign edits in the working tree (a new §5.5 section by a parallel session, lines 207–251), and a clean re-edit by this session would commit those foreign edits alongside ours. The drift pattern itself is recorded in [`project_gitignored_coordination_doc_drift`](../../../) memory + the cross-worktree-sync R-phase queue. The safe path is: **maintainer applies the diff below** as a separate commit (their working tree, their call on whether to land the foreign §5.5 in the same commit or separately).

Save the snippet below as `/tmp/sat-arch-plan.patch` and run `git apply /tmp/sat-arch-plan.patch` from repo root.

```diff
--- a/docs/meta-factory/wave-sequencing-plan.md
+++ b/docs/meta-factory/wave-sequencing-plan.md
@@ -63,6 +63,7 @@ Origin: §5.4 decision record. All Track M items are cheap, deterministic (no pa
 | 2.1 | N1 — niche-validation research (DeepWiki/WebSearch, $0) | parallel to 1.1 |
 | 2.2 | N4b — design recommendation-moment gate | detector (N4a) already shipped; frontier |
 | 2.3 | **Channel-earliness audit** — retroactive sweep of every existing check vs «earliest reachable channel» (the sweep [channel-selection §6](../../.claude/rules/rule-enforcement-channel-selection.md) deferred) | $0 read-only research; own research-patch (`research-patches/<date>-channel-earliness-audit.md`), **no shared-file writes → parallel-safe**. **Run BEFORE any future check-building wave** (incl. N8 A-phase C1–C5): it sets the channel *default* so new checks don't land later than their data permits. Kickoff authored: `.claude/orchestrator-prompts/channel-earliness-audit/kickoff.md` |
+| 2.4 | **K1 — niche audit: `self-reflection` + `template-audit` vs companions** — $0 read-only audit per [satellite-architecture positioning §1 point 3](research-patches/2026-05-24-satellite-architecture-and-dogfooding-positioning.md). Read each skill's `SKILL.md` and evaluate function vs companion-installed alternatives. Output: research-patch with per-skill verdict (`KEEP-AS-IS` / `REWRITE-AS-AUGMENTATION` / `REMOVE-USE-COMPANION-INSTEAD`). Parallel-safe. **Precedes K2 (3.4)** — verdicts determine which `.claude/skills/<own>/` entries K2 migrates. |
 
 ### Track 3 — after dependencies clear
 | # | Task | Gate |
@@ -70,6 +71,7 @@ Origin: §5.4 decision record. All Track M items are cheap, deterministic (no pa
 | 3.1 | N7 — dogfood companions | DECISION=C (0.2); overlaps N8 A3 |
 | 3.2 | N5 — give the conscience back | after N7 |
 | 3.3 | N6b — one-button install | last (after portable core + coexistence) |
+| 3.4 | **K2 — satellite-architecture refactor: install.sh symmetry + companion-offer + source-of-truth** — per [satellite-architecture positioning §5 K2](research-patches/2026-05-24-satellite-architecture-and-dogfooding-positioning.md). R-phase (BFR check on companion-offer + companion self-install patterns) + I-phase (`install.sh` rewrite, dedupe `skills/<own>/` ↔ `.claude/skills/<own>/`, interactive companion-offer prompt). **Predecessor of 3.3 N6b** (consumer-facing scaffold should not inherit defects K2 fixes). **Successor of 2.4 K1** (audit verdicts gate migration scope). |
 
 ### Track I — infra (independent of niche waves; maintainer-gated)
 | # | Task | Note |
@@ -119,6 +121,7 @@ M.1 (T20 trap) ──→ M.2 (commit-msg grep gate)
 ## §3 — Dependency edges (why this order)
 
 - **N4a → N4b:** detector fixed (#98) → gate design unblocked.
+- **K1 (2.4) → K2 (3.4) → N6b (3.3):** audit verdicts gate refactor migration scope; refactor must fix architecture before consumer-facing one-button install ships. Per [satellite-architecture positioning §3 + §5](research-patches/2026-05-24-satellite-architecture-and-dogfooding-positioning.md).
 - **N3 (done) + N6a (done) → N6b:** portable core + coexistence both landed → one-button is last build.
 - **N7 gated on DECISION C; N5 follows N7** (know what's unique before giving back).
 - **N8 R-phase feeds N0** (the cost/autonomy answer N0 lacked); **N8 A3 overlaps N7** (process-layer dispatch) and **N0 options a/e**.
```

## §7 §1.7 self-reflexive check

**Forward-check (compliance with existing disciplines):**
- [`no-paid-llm-in-ci.md`](../../../.claude/rules/no-paid-llm-in-ci.md) §1 — this patch introduces zero CI-side paid calls; K1 is `$0` deterministic; K2 R-phase uses free channels (file reads + WebSearch ≥3 phrasings if needed).
- [`build-first-reuse-default.md`](../../../.claude/rules/build-first-reuse-default.md) §3 — the positioning *extends* BFR (point 3 augmentation pattern); does not bypass it. K2's R-phase explicitly mandates the §3 mechanism on «companion-offer at install-time» (BFR row to be added at I-phase admission).
- [`doc-authority-hierarchy.md`](../../../.claude/rules/doc-authority-hierarchy.md) §2 — folder-level authority for `research-patches/` applies; this file carries scope marker `<!-- scope:... -->` + folder-inheritance line in the blockquote (per [research-patches README](README.md)).
- [`reviewer-discipline.md`](../../../.claude/rules/reviewer-discipline.md) §2 — admission of K1/K2 to the wave plan = maintainer call (kickoffs not pre-written; §6 diff is a proposal, not auto-apply); no role-swap.
- [`phase-research-coverage.md`](../../../.claude/rules/phase-research-coverage.md) §1.7 — this section is itself the §1.7 self-reflexive check.

**Backward-check (sweep of artefacts under the new positioning's scope):**

Scope of «satellite-architecture positioning»: artefacts that ship to consumers AND determine self/consumer install symmetry.

| Artefact | Status under §1 point check | Action |
|---|---|---|
| `skills/meta-orchestrator/` + `.claude/skills/meta-orchestrator/` (both tracked, same tree-hash on `origin/staging` `60397658`) | Point 1 violation: duplicate under git. | Recorded as K2 migration target. |
| `skills/rules-as-tests/` + `.claude/skills/<n/a>` | Asymmetric. `.claude/skills/rules-as-tests/` exists on dev machines only (per `install.sh` line 182). Point 1 not violated (single git source); point 2 (symmetry) compliant in spirit — install.sh is the bridge. | No action; already compliant. |
| `skills/tool-bootstrapping/` + `.claude/skills/tool-bootstrapping/` (both tracked) | Point 1 violation: duplicate under git (same pattern as `meta-orchestrator`). | K2 migration target. |
| `.claude/skills/self-reflection/`, `.claude/skills/template-audit/` (no `skills/<same>/` counterpart) | Point 1 not violated (no duplicate); point 3 *unverified* (companion overlap?). | K1 audit target. |
| `install.sh:42-46` self-install refuse guard | Point 2: keeps self-install impossible by default — but maintainer kept the guard intentionally as defensive (this session). K2 to add `--self` opt-in flag, guard stays default-on. | K2 scope. |
| `install.sh:169-211` skill copy logic | Same source `skills/<x>/` → `.claude/skills/<x>/` copy means consumer-side files diverge from author-side over time without sync mechanism. | K2 scope (resolves point 1 + point 2). |

Backward sweep is **incomplete by design** for this patch: full sweep is K1+K2 deliverables. This patch records the positioning + slots, not the exhaustive remediation. The 6 artefacts above are the *visible* surface from this session; deeper sweep is K2 R-phase work.

## See also

- [README.md#why-this-exists](../../../README.md) — project goal (authoritative; this patch is additive positioning, not a goal redefine).
- [niche-strategy and growth roadmap](2026-05-21-niche-strategy-and-growth-roadmap.md) — existing positioning artifact this patch sits alongside.
- [`.claude/rules/build-first-reuse-default.md`](../../../.claude/rules/build-first-reuse-default.md) — discipline this patch refines (augmentation as ADAPT subtype).
- [`.claude/rules/dual-implementation-discipline.md`](../../../.claude/rules/dual-implementation-discipline.md) — adjacent discipline (delivery channel choice; different axis).
- [`wave-sequencing-plan.md`](../wave-sequencing-plan.md) — operational queue; proposed diff in §6 above.
- `install.sh:42-46` (self-install refuse guard, kept) + `install.sh:169-211` (skill copy logic; K2 rewrite target).
