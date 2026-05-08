# Phase 5 Retrospective — Layer 2 Research Agent v1

> **Date:** 2026-05-08
> **Branch:** `chore/phase-5-research-agent`
> **Phase:** 5 — Layer 2 Research Agent v1 (deterministic-curated, no LLM) per [PHASE-5-PROMPT.md](../PHASE-5-PROMPT.md), refined by [phase-5-research.md](../phase-5-research.md).
> **Verdict:** **GO** to Phase 6

---

## Reordering note (vs EXECUTION-PLAN §6)

EXECUTION-PLAN §6 originally numbered Phase 5 = L4 Validator and Phase 6 = L2 Research Agent. The Phase 5/6 boundaries were swapped in this session: **Phase 5 → L2 Research Agent**, **Phase 6 → L3 Synthesizer**, **L4 Validator pushed to Phase 7+**. Rationale: L4 gates synthesized rules; without L2/L3 there is nothing beyond Phase 2 manifest meta-tests for L4 to validate. Documented in [phase-5-research.md](../phase-5-research.md) header + [PHASE-5-PROMPT.md](../PHASE-5-PROMPT.md) header. EXECUTION-PLAN §6 to be updated in a follow-up retro pass once Phase 6 closes (so the swap is recorded as a single coherent edit, not a partial rebase).

## Architectural pivot — deterministic v1 (no LLM)

[architecture.md §2.4](../architecture.md) describes L2 as fetching docs via `context7` + WebSearch. Phase 5 v1 ships **deterministic-curated**: hand-authored research entries committed to `packages/core/research/store/`, no live LLM/HTTP at runtime. Mirrors Phase 4 detector's «deterministic bridge» playbook. Justifications captured in [phase-5-research.md §1](../phase-5-research.md):
- Project tenet «documents lie; tests don't» demands deterministic v1 — LLM-generated research is non-deterministic and untestable via snapshots.
- No real consumer triggers LLM cost yet ([EXECUTION-PLAN.md §1](../EXECUTION-PLAN.md) no-consumers caveat).
- Anthropic SDK `web_search_20250305` with native `allowed_domains` is documented as the v2 contract for prompt-injection-safe LLM extension when the trigger fires.

---

## Verification block

All 9 verification probes from [PHASE-5-PROMPT.md «Verification probes»](../PHASE-5-PROMPT.md) green; `make self-audit` green; `actionlint` + `zizmor` clean.

### Probe-by-probe evidence

| # | Probe | Expected | Actual |
|---|---|---|---|
| 1 | `npx tsx packages/core/research/cli.ts $(pwd) \| jq '.framework, .patterns \| length'` | non-empty framework value (or null for ts-server) + non-zero patterns | `null` (this repo is ts-server, no framework) + `0` patterns + 5-entry `.missing` — semantically correct |
| 2 | `npm --prefix packages/core test research/load.test.ts` | green, ≥6 tests | **10 tests** (7 loader + 3 schema invariant) |
| 3 | `npm --prefix packages/core test research/allowlist.test.ts` | green, ≥5 tests | **7 tests** (paired positive/negative + registry exposure) |
| 4 | `npm --prefix packages/core test research/diff.test.ts` | green, ≥5 tests | **7 tests** (identical, added, removed, modified, key-order stable, version transitions, mixed) |
| 5 | `npx tsx packages/core/research/cli.ts --self \| jq '.drift.mismatches \| length'` | 0 OR surfaces real mismatches | `0` (after Task 5 doc fix — surfaced real drift first, closed by additive edits to overview.md + ai-traps.md) |
| 6 | CLI emits JSON for all 3 modes | exit 0, valid JSON | ✓ tested manually: default mode, --self, --diff (identical-plans empty delta) |
| 7 | Self-research snapshot frozen vs `expected-self-research.json` | no diff | ✓ snapshot.test.ts green; CI gate `framework-self-research` parity |
| 8 | `actionlint` + `zizmor` | exit 0 | actionlint clean; zizmor `No findings to report. Good job! (6 suppressed)` |
| 9 | Full regression | all green | self-audit 24/24; core **153/153** (124 detector + 29 research); preset 38/38; typecheck 3 workspaces clean |

### Self-application invariants closed

| Invariant | Source | Status |
|---|---|---|
| L2 (a) drift detection symbolic v1 returns 0 mismatches | [self-application.md §2 row L2](../self-application.md), [open-questions.md §13.7](../open-questions.md) first half | **CLOSED.** drift detection lands; non-vacuous (surfaced + closed real drift on first run). Behavioral and embedding-based v2/v3 explicitly deferred. |
| L2 (b) snapshot stability point-in-time | [self-application.md §7 row L2](../self-application.md) | **CLOSED point-in-time.** Long-horizon stability evaluated at Phase 7+ entry per same pattern as Phase 4 detector. |

---

## Created/modified files (commit hashes)

```
c3d18a8 docs(phase-5):  Step 0 entry gate — research matrix + implementation prompt
6af6f20 feat(research): Task 1 — types + ResearchPlan JSON schema
e957aa8 feat(research): Task 2 — curated store (6 entries) + semver-aware loader
dd58cf3 feat(research): Task 3 — source allowlist + provenance validator
54a6398 feat(research): Task 4 — diff-mode (pattern-keyed delta)
a21c85c feat(research): Task 5 — symbolic drift detection (closes §13.7 v1)
7ec4302 feat(research): Task 6 — public API + CLI
d722454 ci(audit-self): Task 7 — framework-self-research job + frozen snapshot
```

Net change: 9 source files in `packages/core/research/` (`types`, `load`, `allowlist`, `diff`, `drift`, `index`, `cli`, `snapshot.test`, paired `*.test`), 1 JSON schema, 6 curated store entries, 6 drift fixtures, 1 frozen snapshot, 1 CI job, 2 doc edits in `skills/rules-as-tests/references/{overview,ai-traps}.md` (closing real drift surfaced by Task 5).

---

## Reuse posture validated (per [phase-5-research.md §4](../phase-5-research.md))

| # | Reuse decision | Status | Evidence |
|---|---|---|---|
| 5.1 | ResearchPlan internal SSOT + AIF skill-context as one of multiple sinks | **DEFERRED to Phase 6 decision.** | Phase 4 already shipped detector → skill-context (touchpoint 4, commit `b5e16b7` from Phase 4). Phase 5 reads detector's `patterns[]` and `missing[]`; skill-context projection from L2 (research-derived) deferred to Phase 6/11. |
| 5.2 | semver as transitive dep — no explicit add | **CLOSED** | `grep -c '"semver"' packages/core/package.json` → 0; load.ts uses `import semver from 'semver'`. |
| 5.3 | Anthropic `allowed_domains` for v2 (deterministic v1 has no live fetch) | **DEFERRED to v2 trigger** | Allowlist registry built statically; allowlist.ts API mirrors Anthropic's hostname pattern for friction-free upgrade. |
| 5.4 | Diff-mode pattern-keyed | **CLOSED** | diff.ts ~70 LOC; 7 tests. |
| 5.5 | Symbolic drift v1 (open-questions §13.7 first half) | **CLOSED** | drift.ts ~110 LOC; 4 tests; surfaced + closed one real drift. |
| 5.6 | CLI mirroring detector pattern | **CLOSED** | cli.ts 51 LOC, no yargs/commander. |

**LOC reused vs built ratio (rough):**
- Reused: `semver` (transitive, ~thousands of LOC), `Ajv` (already in lockfile, ~hundreds), AIF skill-context output sink contract (carried over from Phase 4 — zero new code).
- Built: research module ~430 LOC (types + load + allowlist + diff + drift + index + cli) + ~390 LOC tests + 6 curated entries (~150 LOC JSON) + 6 drift fixtures (~50 LOC) + 1 CI job (~30 LOC YAML) + 1 schema (~80 LOC JSON).
- Posture: research v1 = deterministic bridge over **curated** content (vs Phase 4's bridge over **AIF artifacts**). Same playbook, different content source. LLM-driven layer is a future strict-superset.

### ResearchPlan sample (root repo, evidence of L2 output contract)

```json
{
  "framework": null,
  "version": null,
  "patterns": [],
  "missing": ["@opentelemetry/api", "@playwright/test", "vitest", "@storybook/nextjs", "tailwindcss"],
  "drift": { "sources": [...3 self-app sources...], "mismatches": [] }
}
```

Single-emit triple-contract verified: detector→research forwarding (`missing[]`, `patterns[]` plumb correctly), drift detection wired in (mismatches: 0 at HEAD), schema-validated (Ajv passes via load.ts).

---

## Self-reflection block

- **Which curated entry was hardest to author?** None substantially harder than another; the existing detector pattern catalogue (5 patterns) provided clear scaffolding. **Signal:** the 5-pattern initial set is appropriately scoped — adding more curated entries is ~10-15 minutes per pattern, well under the «store >1MB» stop-rule (current store ≈10KB). No format pressure observed.
- **Did the symbolic drift v1 produce false positives on real HEAD?** No — but it surfaced **one real drift** on first run: «paired negative tests» appeared only in `skills/SKILL.md`, not in `references/overview.md` or `references/ai-traps.md`. Closed by adding a substantive bullet to overview.md Layer 2 section + a new anti-pattern entry («Tautological tests») to ai-traps.md. **Crucially: the drift detector did its job — caught a documented divergence, not random noise.** Symbolic v1 self-justifies for v1; behavioral and embedding-based escalations deferred to Phase 7+ when L4 Validator infra exists.
- **Was the `extras: Record<string, unknown>` escape hatch used?** No — none of the 6 curated entries needed it. **Signal:** schema rigidity is manageable for v1. If Phase 6 synthesizer needs additional fields, expand schema deliberately rather than abusing extras.
- **Touchpoint 4 sink — write to skill-context from L2 in Phase 5 or wait?** Waited (deferred to Phase 6/11). Rationale: detector→skill-context already shipped Phase 4. L2-derived content (best practices, anti-patterns) might augment skill-context but should be a deliberate Phase 6 design choice, not bolted on now. Avoids reconciliation pressure with `aif-evolve` mining (open-questions §13.6 spillover).
- **Phase 5/6 reordering vs EXECUTION-PLAN §6 — clearly documented?** Yes. Rationale captured in:
  - phase-5-research.md header reordering note
  - PHASE-5-PROMPT.md header reordering note
  - this retro top section
  - EXECUTION-PLAN §6 update **deferred** to Phase 6 close (single coherent edit covering both swaps).
- **Modal-verb attribution edge case (caught during Task 5):** initial implementation used a ±2 line window for modal-verb detection, which picked up MUST/SHOULD from neighbouring sentences belonging to *other* principles, producing false negatives in the with-drift fixture. Switched to **same-line attribution** — modal verb must appear on the same line as the principle alias. Loses some signal (a multi-line bullet's modal in line 1 is ignored if the principle alias is on line 3) but eliminates the cross-principle pollution that produced incorrect modal rankings. Trade-off documented inline in `drift.ts:strongestModalNear`. v2 (behavioral) will resolve this with sentence-level NLP.
- **CLI minimal-argv design (≤40 LOC target):** ended at **51 LOC** for cli.ts. Reason: 4 modes (default + --self + --diff + --pattern) require more dispatch than detector's 2 modes (default + --emit-skill-context). 40 LOC was a reach; 51 is still hand-rolled `process.argv` slice with no library, well within the «no yargs/commander» Hard constraint. Acceptable as ~10 LOC overage for additional functional scope.

---

## Evaluation block

| Metric | Target | Actual | Verdict |
|---|---|---|---|
| Self-application score | 8/10 | **9/10** — both L2 invariants closed; drift detection non-vacuous (caught + closed real drift); snapshot point-in-time stable. ‑1 only because long-horizon stability still point-in-time at retro time (decays naturally). | ✓ exceeds |
| Time-vs-plan ratio | ≤6h orchestrator path | **≪1h wall-clock** (single-session, opus burn-mode direct execution; no junior delegation needed) | ✓ well under |
| Tasks 1-7 closed | required | All 7 closed with verified acceptance | ✓ |
| Snapshot stable | required | snapshot.test.ts green; CI gate `framework-self-research` mirrors detector pattern | ✓ |
| Curated store >1MB stop-rule | not triggered | Total store size ≈10KB; well within budget | ✓ |
| Drift detection produces ≤2 false-positives on HEAD | required | 0 false positives + 1 true positive (surfaced and closed real drift in skills/) | ✓ |
| Verdict | GO | **GO** to Phase 6 (Layer 3 Synthesizer Path A) | ✓ |

### Stop-rule audit

- Curated store size: **≈10KB**, threshold 1MB → not triggered.
- LLM cost: $0 (deterministic v1, zero API calls).
- Drift detection cascade: 1 mismatch on first run → closed in same task (additive doc edits) → 0 mismatches at retro time.
- Touchpoint 4 split-point: explicitly deferred (Phase 6/11), not snuck through.

---

## RCA section

**Skipped** — Time-vs-plan ratio well under 2x threshold, no snapshot fragility, no quality regressions detected. One discovered issue (real drift in own docs) closed in-scope as part of Task 5; not an RCA trigger.

---

## Open questions for orchestrator session Phase 6 entry (§5.5 Step 0 trigger)

1. **L3 Synthesizer Path A scope** — Phase 6 entry must answer: takes ResearchPlan → emits what exactly?
   - (a) extended `rules-manifest.json` entries (new generated rules slot)
   - (b) ESLint flat-config snippets keyed to detected stack
   - (c) Negative test cases per generated rule (project tenet)
   - (d) RULES.md fragments
   - All of the above for v1, or subset?
2. **Touchpoint 4 from L2 perspective** — should Phase 6 wire L2-research-derived content into skill-context (extending Phase 4's L1 → skill-context flow)? Or keep skill-context strictly L1-driven? Decision needed before Phase 6 implementation begins.
3. **LLM-driven research v2 trigger** — Phase 8 acceptance test (Next 15→16 upgrade) likely first realistic trigger. Until then, deterministic store grows by hand. Document in Phase 6 entry research as «watch-list» continuation.
4. **AIF `aif-evolve` ↔ ResearchPlan reconciliation** — still deferred to Phase 11 per [aif-comparison.md §7](../aif-comparison.md). No Phase 6 trigger expected.
5. **Behavioral drift detection (open-questions §13.7 second half)** — needs L4 Validator infra. Phase 7+ trigger. Not a Phase 6 dependency.
6. **EXECUTION-PLAN §6 update** — Phase 5/6/7 numbering swap should be reflected in plan after Phase 6 closes (single coherent edit covering both swaps). Track this as Phase 6 retro closing item.
7. **Cross-version research delta seeding** — Phase 5 ships Next 15.x + Next 16.x for one pattern (`nextjs-app-router`) to enable diff-mode tests. Phase 6 may need more cross-version pairs (e.g. server-actions 15→16). Deferred until L3 demand emerges.

---

## Versioning

- **2026-05-08** — Phase 5 close, GO verdict for Phase 6 entry. 8 atomic commits on `chore/phase-5-research-agent` ahead of merge. Single-session orchestrator-direct path (Opus 4.7 burn mode) compressed 6h estimate to <1h wall-clock — same compression pattern as Phase 4.
