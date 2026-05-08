# Phase 5 — Step 0 entry research (Layer 2 Research Agent)

> **Trigger:** [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) — Phase 5 entry gate.
> **Reordering note:** EXECUTION-PLAN §6 originally had Phase 5 = L4 Validator, Phase 6 = L2 Research, Phase 7 = L3 Synth. Phase 5/6 boundaries reassigned 2026-05-08 — L2/L3 first because L4 Validator needs synthesized output to validate; without L2/L3 there is nothing beyond Phase 2 manifest-level meta-tests to gate. Documented in retros/phase-5.md (closure).
> **Method:** context7 MCP queries — AIF `/lee-to/ai-factory`, LangGraph `/websites/langchain_oss_javascript_langgraph`, Anthropic SDK TS `/anthropics/anthropic-sdk-typescript`.
> **Status:** transient artifact per §5.5 — ≤200 lines; archived after Phase 5 closes.
> **Question answered:** which Phase 5 capabilities reuse existing solutions vs build, and what is the deliverable shape for Layer 2?

---

## §1. Capabilities Phase 5 will cover

Per [architecture.md §2.4](architecture.md):
1. **ResearchPlan schema** — versioned hierarchical research store (per framework × version × pattern)
2. **Pattern-to-research lookup** — given `DetectionResult.patterns[]` + framework version → research entries
3. **Source allowlist registry** — trusted docs URLs per stack, provenance attached to each research entry
4. **Diff-mode** — semver-aware delta between two cache versions (Next 15 → 16 case)
5. **Self-application drift detection** — three own sources (`SKILL.md`, `references/overview.md`, `references/ai-traps.md`) checked for symbolic divergence
6. **CLI surface** — `research --self`, `--diff vA vB`, `--pattern X`, JSON to stdout

**Architectural pivot (deterministic v1).** Per Phase 4 «deterministic bridge over AIF» playbook, Phase 5 v1 is **curated research store + lookup**, NO LLM calls. Reasons:
- Project tenet «documents lie; tests don't» demands deterministic v1; LLM-driven research is non-deterministic.
- No real consumer triggers LLM cost yet (per [EXECUTION-PLAN.md §1](EXECUTION-PLAN.md) no-consumers caveat).
- Curated content testable via snapshots (precedent: detector fixtures in Phase 4).
- LLM extension layer on top (v2) when Phase 8 acceptance test or first real consumer triggers it.

**Planner-Executor invariant** ([EXECUTION-PLAN.md:121-124](EXECUTION-PLAN.md)): L2 has no file write privilege except its single contracted output (`research-cache.json`). Enforced by module surface, not permission system — L2 module exports only `research(input) → ResearchPlan`; no other side effects. L3 imports L2's output schema, not L2 internals.

---

## §2. Tools resolved (context7)

| Tool | Library ID | Benchmark | Notes |
|---|---|---|---|
| AI Factory `aif-evolve` | `/lee-to/ai-factory` | 83.7 | Mines patches → skill-context rules. **Post-hoc**, complementary to our pre-emptive L2 |
| LangGraph (JavaScript) | `/websites/langchain_oss_javascript_langgraph` | 89.33 | Plan-and-execute pattern with `withStructuredOutput`; subgraph isolation for namespacing |
| Anthropic SDK TS | `/anthropics/anthropic-sdk-typescript` | 78.13 | `web_search_20250305` with native `allowed_domains` server-side enforcement; structured output + cache_control |

All three resolved via context7; no «not in context7» flags.

---

## §3. Per-capability matrix

### 3.1 ResearchPlan schema

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF skill-context format | `.ai-factory/skill-context/<skill>/SKILL.md` (markdown rules) | Auto-generated from patches; human-readable; no version-pinning per pattern |
| `aif-loop` RULE-SCHEMA | JSON with `{id, severity, weight, check, phase}` | Convergent design; rule-level not research-level |
| LangGraph state schemas | Zod schemas for structured output | Runtime-only; no persistence format |
| Phase 5 plan | `research/<framework>/<version>/<pattern>.json` hierarchy | Versioned per pattern; provenance per finding; diff-mode-friendly |

**Verdict:** **Build domain-specific** — versioned-per-pattern hierarchy is unique to our diff-mode requirement (architecture.md §2.4). Adopt AIF skill-context **as one of multiple output sinks** (touchpoint 4 already shipped Phase 4); ResearchPlan is the SSOT internal format that feeds skill-context, manifest, and L3 synthesizer.

### 3.2 Pattern-to-research lookup

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF `/aif-evolve` | Patches → grep tags → skill-context rules | Mining-mode (post-hoc); doesn't index by stack pattern |
| Phase 5 plan | `loadResearch(framework, version, pattern)` — file read, semver-aware fallback to nearest version | Deterministic; testable via fixtures; aligns with detector's deterministic-bridge posture |

**Verdict:** **Build** — small surface area (≤30 LOC), semver-aware fallback necessary for «next@16.0.0 inherits next@16.0.x research until override». Reuse `semver` (already transitive — same as Phase 4).

### 3.3 Source allowlist registry

| Solution | Mechanism | Differentiator |
|---|---|---|
| Anthropic `web_search_20250305` | Native `allowed_domains: string[]` on tool definition; server-enforced | **Cannot be bypassed by prompt injection** — enforcement at API tier. **Reuse for v2** when LLM-driven research lands. |
| Static registry | TS const `ALLOWED_SOURCES: Record<string, string[]>` keyed by framework | Phase 5 v1 needs only provenance attachment, not active fetching |

**Verdict:** **Build static registry for v1 (deterministic)**; **reuse Anthropic native allowlist for v2** (when LLM call lands). Single `provenance: { url: string, allowlistKey: string }` field on each research entry validates against the registry.

### 3.4 Diff-mode

| Solution | Mechanism | Differentiator |
|---|---|---|
| Git native diff | `git diff vA -- research/` | Line-level, not semantic; misses pattern-level moves |
| AIF `aif-evolve` cursor (`patch-cursor.json`) | Tracks last-analyzed patch for incremental rescan | Linear cursor; not version-comparison |
| Phase 5 plan | `diffResearch(versionA, versionB)` — set diff over `(framework, pattern)` keys + content compare | Pattern-level granularity matches «one pattern → one rule» from [open-questions.md §13.1](open-questions.md) |

**Verdict:** **Build** — pattern-keyed diff is the contract upgrade-mode needs (architecture.md §2.4 «only delta between 15 and 16»). Trivial implementation (~40 LOC) over the file hierarchy.

### 3.5 Self-application drift detection

| Solution | Mechanism | Differentiator |
|---|---|---|
| Manual review (current state per [open-questions.md §13.7](open-questions.md)) | Human reads 3 sources side-by-side | Doesn't scale; not enforceable |
| Symbolic drift | `MUST` vs `should`, term presence — string-based | Per §13.7 first proposed operationalization |
| Behavioral drift | Test from `ai-traps.md` validates principle from `overview.md` | Per §13.7 second; needs L4 Validator infrastructure (deferred) |
| Embedding-based | semantic similarity score | Per §13.7 third; needs LLM, deferred |

**Verdict:** **Build symbolic v1** — extract MUST/SHOULD/MUST NOT vocabulary + cross-source term matching; report mismatches. Operationalizes [open-questions.md §13.7](open-questions.md) per `self-application.md` L2 acceptance criterion. Behavioral v2 deferred to Phase 7+ (when L4 Validator lands).

### 3.6 CLI surface

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF `/aif-rules` slash-command | Inside AI session | Different audience |
| Phase 4 detector CLI | `npx tsx packages/core/detector/cli.ts <root>` | Standalone, well-established pattern in repo |
| Phase 5 plan | `npx tsx packages/core/research/cli.ts [--self|--diff vA vB|--pattern X|--framework next@16]` | Same pattern as Phase 4 detector |

**Verdict:** **Build (mirror Phase 4 pattern).** ≤40 LOC plain `process.argv` parsing.

---

## §4. Reuse-vs-build decisions

| # | Capability | Decision | Rationale |
|---|---|---|---|
| 5.1 | ResearchPlan schema | **Build domain-specific.** Adopt AIF skill-context as **one** output sink (Phase 4 touchpoint 4). | Versioned-per-pattern hierarchy is unique to diff-mode requirement. AIF format too rule-level, not research-level. |
| 5.2 | Pattern-to-research lookup | **Build with `semver` (transitive, no new dep).** | Same posture as Phase 4 — deterministic semver-aware lookup. |
| 5.3 | Source allowlist registry | **Build static for v1; reuse Anthropic `allowed_domains` for v2.** | v1 deterministic-curated has no active fetching; provenance attachment only. v2 LLM-driven layer reuses native server-side enforcement. |
| 5.4 | Diff-mode | **Build pattern-keyed delta.** | ≤40 LOC; aligns with «one pattern → one rule» granularity. |
| 5.5 | Self-application drift detection | **Build symbolic v1.** | Operationalizes [open-questions.md §13.7](open-questions.md) deferred to Phase 6 → now landing in Phase 5. Behavioral v2 deferred to Phase 7+. |
| 5.6 | CLI surface | **Build (mirror Phase 4 pattern).** | Established repo pattern. |

**Acceptance per §5.5:** matrix complete + per-capability verdict + ≥1 reuse decision. Achieved via:
- **Reuse 5.1 (sink):** AIF skill-context format as one of L2's output sinks (extends Phase 4 touchpoint 4).
- **Reuse 5.2 + 5.6 (transitive deps):** `semver` already in lockfile; CLI pattern from detector.
- **Reuse 5.3 (deferred):** Anthropic `allowed_domains` as v2 contract (documented, not yet imported).

**Net Phase 5 scope = 5 build (domain-specific) + 1 strong reuse (skill-context sink) + 2 transitive reuses.**

---

## §5. Verdict — proceed with PHASE-5-PROMPT.md draft

**GO.** Phase 5 prompt drafted with these design decisions:

1. **Curated v1 (no LLM):** research store at `packages/core/research/store/<framework>/<version>/<pattern>.json`, hand-authored. LLM-driven generation deferred to v2 trigger.
2. **Planner-Executor enforcement at module surface:** `packages/core/research/index.ts` exports only `research(detection) → ResearchPlan`. No filesystem writes outside `research-cache.json` write helper used by CLI. L3 in Phase 6 imports the schema, not the module internals.
3. **Self-application landing in Phase 5:** symbolic drift detection on the 3 own sources closes [open-questions.md §13.7](open-questions.md) first half; behavioral drift remains deferred.
4. **Touchpoint 4 extension:** L2 can additionally project subset of ResearchPlan into existing skill-context infrastructure (already shipped Phase 4); decided after first end-to-end pipeline runs in Phase 6.
5. **Diff-mode minimal:** delta = added/removed/modified `(framework, pattern)` keys + content hash; full semantic diff deferred to v2.

**Risks:**
- **Curated content drift** — research store is hand-written; can become stale if Next.js/React updates land. Mitigation: version-pinned entries + Phase 8 acceptance test (Next 15→16) forces real-world refresh.
- **Schema rigidity** — over-specifying ResearchPlan now constrains Phase 6 synthesizer creativity. Mitigation: define minimal required fields + `extras: Record<string, unknown>` escape hatch.
- **Drift detection false-positives** — symbolic comparison misses semantic equivalence (`MUST` vs `is required`). Acceptable: Phase 5 v1 is a regression guard, not full audit; defers to v2.

**Stop-rule:** if curated store size grows >1MB before Phase 6 starts → research format too verbose; redesign before continuing. (Initial expectation ≤50KB for 5 patterns × 3 frameworks × 2 versions = 30 entries.)

---

## §6. Forward implications (watch-list)

| Item | Trigger | Owner |
|---|---|---|
| LLM-driven research generation (v2) | First real consumer OR Phase 8 acceptance test | Phase 5 v2 retrofit |
| Behavioral drift detection (own docs) | Phase 7+ when L4 Validator infrastructure exists | Phase 7 prompt author |
| AIF `aif-evolve` ↔ ResearchPlan reconciliation | If both write to skill-context, conflict resolution policy | Phase 11 (AIF integration) |
| Multi-stack monorepo research projection | Phase 9+ (per [open-questions.md §13.5](open-questions.md)) | Deferred |
| Embedding-based drift v3 | Cost vs symbolic v1 ROI proven | Phase 12+ |

These are watch-list items, not Phase 5 commitments. Re-validate via context7 at each Phase entry per §5.5.
