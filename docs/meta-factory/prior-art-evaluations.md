# Prior-art evaluations — SSOT

> **Purpose:** single source of truth for build-vs-reuse decisions on this framework. Every capability area where we build something new (script, abstraction, dependency, lint rule, gate, recipe pattern) is evaluated against existing prior art before commitment. This file records that evaluation: what analog exists, when it was last reviewed, what verdict we reached, and the trigger condition that would re-open the decision.
>
> **Status:** shipped reference doc (≤500 LOC).
> **Created:** Phase 8.8 T1 (2026-05-08).
> **Consult gate:** [EXECUTION-PLAN.md §5.5 Step 1.5](EXECUTION-PLAN.md) — mandatory pre-build review (added Phase 8.8 T6).
> **Process discipline:** [CONTRIBUTING.md](../../CONTRIBUTING.md) + `Prior-art:` commit trailer convention (added Phase 8.8 T7).
> **Principle:** [`packages/core/principles/08-prior-art-cited.test.ts`](../../packages/core/principles/08-prior-art-cited.test.ts) validates that capability claims in research files cite entries in this file by ID (added Phase 8.8 T3).

---

## 1. Format specification

Each entry is a row in the table at §4 below. The row schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `ID` | integer (monotonic) | ✓ | Stable identifier. Cite as `prior-art-evaluations.md#<ID>` from research files, retros, commit trailers. Once assigned, never reused. Increments only — gaps allowed if an entry is later removed (preserves citation stability). |
| `Candidate` | string | ✓ | Name of the prior art (project, paper, vocabulary, framework, blog post). Include version / commit / publication date if relevant. |
| `Capability matched` | string | ✓ | Which capability area of *this* framework the candidate maps to. Examples: «L3 LLM-driven rule generation», «L1 multi-framework version-aware detection», «framework-level meta-test pattern vocabulary». Be specific — vague matches like «testing» get rejected at review. |
| `First seen` | ISO 8601 date | ✓ | When the candidate first surfaced in our research, regardless of verdict. Frozen at entry creation. |
| `Last reviewed` | ISO 8601 date | ✓ | When the entry was last actively re-examined for current applicability. Updated whenever §5.5 Step 1.5 consult matches this entry, regardless of whether the verdict changes. |
| `Verdict` | enum | ✓ | One of `ADOPT` / `DEFER` / `WATCHLIST` / `REJECT`. See §2 for semantics. May be qualified (e.g. `ADOPT VOCABULARY` means adopt the framing but not the code). |
| `Rationale` | string (≤500 chars) | ✓ | Why this verdict. Must reference concrete differences (not «didn't fit») and cite at least one external link, prior-art entry, or open-questions ref. |
| `Trigger to revisit` | string | ✓ | The precondition under which this entry's verdict should be re-opened. Examples: «LLM v2 trigger fires per [open-questions.md §13.10 entry #1]», «Phase 9+ detector v2 entry research», «new framework requires version-aware detection». An entry without a non-trivial trigger condition is a sign of weak rationale. |

---

## 2. Verdict semantics

| Verdict | Meaning | Action implied |
|---|---|---|
| `ADOPT` | Use the candidate directly — adopt as a dependency, ship its API surface, or reuse its artifacts. | Add as explicit dep / vendored module / cited algorithm; document in [EXECUTION-PLAN.md §3.3 Prior art table](EXECUTION-PLAN.md). |
| `ADOPT VOCABULARY` | Sub-form of `ADOPT`. Adopt the candidate's *framing or terminology* without adopting code. Useful when an established name exists for what we built. | Update doc / README / glossary to use the established term; cite the candidate. |
| `DEFER` | Candidate solves a related problem in a different domain, or has incompatible constraints. Not used now, but the option stays open. | Document the difference in `Rationale`; specify `Trigger to revisit`. Do **not** silently rebuild the candidate's surface — re-examine when trigger fires. |
| `WATCHLIST` | Candidate is mature in production but blocked by our current stop-rules / scope (e.g. deterministic-v1 stance forbids new deps). Re-examine when stance shifts. | Document the blocking stop-rule; trigger condition references the stop-rule's relax-criterion. |
| `REJECT` | Candidate is **not** applicable — fundamentally different problem space, abandoned project, security disqualification, license incompatible. Re-opening requires new evidence (not just time). | Document concrete disqualifier; trigger condition must specify what would invalidate the disqualifier (rare). |

**Heuristic:** if the rationale would be the same one year from now without any new evidence, the verdict is `REJECT`. Otherwise it's `DEFER` / `WATCHLIST`.

---

## 3. How to add an entry

1. **§5.5 Step 1.5** (phase research): when listing capability areas, run `context7` queries (≥3 phrasings) for each capability. For each candidate that surfaces:
   - Check this file for an existing entry on the candidate. If present: update `Last reviewed` and re-evaluate per its `Trigger to revisit`.
   - If absent: add a new row to §4 with the next `ID`.
2. **Capability commits** (per [CONTRIBUTING.md](../../CONTRIBUTING.md) — added T7): include a `Prior-art:` commit trailer citing the relevant entry by ID, even when the verdict was set in an earlier commit.
3. **Edits to existing rows** are tracked via git history — no in-file changelog. The file's git log is the audit trail.

### Entry template (paste into §4 table)

```
| <next ID> | <Candidate name + version/date> | <Capability area, specific> | <YYYY-MM-DD first seen> | <YYYY-MM-DD reviewed today> | <ADOPT|DEFER|WATCHLIST|REJECT> | <Rationale ≤500 chars with at least one cited link/ref> | <Trigger condition> |
```

---

## 4. Entry table

| ID | Candidate | Capability matched | First seen | Last reviewed | Verdict | Rationale | Trigger to revisit |
|---:|---|---|---|---|---|---|---|

<!-- Entries are appended below this line. Do not edit existing rows in place except for `Last reviewed` updates per §3 step 1; substantive verdict changes are new commits with git history audit. -->
| 1 | Autogrep (Semgrep + LLM, 2024–2025) | L3 LLM-driven rule generation | 2026-05-08 | 2026-05-08 | DEFER | Closest single analog per ultraview verdict 2026-05-08; context7 lookup 2026-05-08 confirms Semgrep auto-generates rules from CVE / GHSA / Electron release-note feeds (security-only domain). No stack-aware `stack:[]` field, no self-application invariant, no best-practice-doc source signal — fundamentally different problem space (CVE patches → rules vs. framework version-bump docs → rules). Re-evaluate when LLM v2 trigger fires per [open-questions.md §13.10 entry #1](open-questions.md). **Phase 9 entry consult (2026-05-08):** trigger condition fired — [open-questions.md §13.10 entry #2](open-questions.md) (Path A LLM gen) fired at Phase 8 close per [retros/phase-8.md Open Q #1](retros/phase-8.md); re-evaluation performed via fresh context7 lookup in T3, verdict review in [phase-9-entry-research.md §5](phase-9-entry-research.md). DEFER stance carries forward unless T3 surfaces new Semgrep rule-synthesis-from-docs feature post-2026-05-08. | LLM v2 trigger fires; OR Phase 9+ entry research surfaces new Autogrep release / Semgrep rule-synthesis-from-docs feature |
| 2 | Netlify CLI `framework-info` / `detect-server-settings` (production CLI plugin) | L1 multi-framework version-aware detection | 2026-05-08 | 2026-05-08 | WATCHLIST | Production-ready multi-framework detection — context7 lookup 2026-05-08 confirms `netlify dev --framework` flag with `#auto` default, plus `src/utils/detect-server-settings.ts` orchestrating framework detection across Next.js / Fastify / Hugo / others. Heuristics include Next 13.5+ App Router probe and Fastify entrypoint sniffing. **Blocked now by deterministic-v1 stop-rule (§6.0 #2 — no new explicit deps).** Vendoring detection logic violates the spirit of the rule even with transitive-only deps. WATCHLIST verdict means: when stop-rule relaxes (Phase 9+ stance shift) OR a new framework requires version-aware detection that our hand-rolled detector can't cover, re-open. | Phase 9+ detector v2 entry research; OR new framework target requires version-aware semantics our v1 detector can't express; OR §6.0 #2 stop-rule relaxes |
| 3 | Fitness functions (Ford / Parsons / Kua, *Building Evolutionary Architectures*, 2017 / 2nd ed. 2023) | framework-level meta-test pattern vocabulary | 2026-05-08 | 2026-05-08 | ADOPT VOCABULARY | Established academic/industry term for exactly the principles-as-tests pattern shipped in Phase 2 (`packages/core/principles/01-07*.test.ts`, now +08 from T3). The term «fitness function» captures «automated invariant test for an architectural property», which is precisely what 01-08 are. Vocabulary adoption only — no code change, no dep, no behavioral change. Adopting the framing improves onboarding (readers familiar with evolutionary architecture map to our Phase 2 immediately) and academic citation. Implementation: T10 updates [overview.md L2](../skills/rules-as-tests/references/overview.md) terminology where applicable. (Vocabulary entry — context7 not consulted; the term is documented in published books not indexed as a library, and re-verification is unnecessary for a stable academic reference.) | New competing vocabulary supersedes «fitness functions» in industry/academic discourse; OR scope of principles widens beyond what the original term covers |

---

## 5. Staleness policy

Entries with `Last reviewed` >180 days surface as candidates for re-evaluation during the next phase entry research session (manual review during [§5.5 Step 1.5](EXECUTION-PLAN.md)). The 180-day threshold reflects the typical cadence between major framework releases — Next.js / Fastify / etc. ship breaking changes on roughly that scale, and a SSOT entry whose «last reviewed» predates the release window is presumed stale until re-verified.

**Format:** all dates ISO 8601 (`YYYY-MM-DD`). Older formats (e.g. `2026-05-08T15:30:00Z` ISO 8601 timestamp) are accepted for parsing but the date column is canonical date-only.

**No automated CI gate yet** — staleness detection is currently a manual phase-research activity, not a workflow check. Rationale: the cost of a false positive (flagging a still-current entry as stale and forcing re-verification) exceeds the cost of a false negative (a stale entry persisting one extra phase). Automated staleness gating is deferred to Phase 8.X+ self-diagnostics tooling per [self-diagnostics-design.md §6](self-diagnostics-design.md). When activated, the gate should warn-only at first (per the same false-positive logic) and only escalate to hard fail after observed FP rate <10% on 10+ phase research sessions.

**Re-verification scope:** when Step 1.5 surfaces a stale entry, the phase research must run a fresh context7 query (≥3 phrasings per Hard Constraint #5) and update the entry in the same commit:
- If still applicable: bump `Last reviewed` only.
- If new evidence changes verdict: new commit changing `Verdict` and `Rationale` (audit trail in git history; do not edit history).
- If the candidate has been deprecated/abandoned: change `Verdict` to `REJECT` with the disqualifier in `Rationale`.

---

## 6. Cross-references

- [EXECUTION-PLAN.md §5.5 Step 1.5](EXECUTION-PLAN.md) — mandatory consult gate.
- [EXECUTION-PLAN.md §3.3](EXECUTION-PLAN.md) — Prior art table (high-level, links into this SSOT).
- [aif-comparison.md §9](aif-comparison.md) — reuse matrix (aif-evolve overlap; cross-ref added Phase 8.8 T10).
- [open-questions.md §13.10](open-questions.md) — LLM v2 triggers referenced from Autogrep entry rationale (Phase 8.8 T2).
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — `Prior-art:` commit trailer convention (added Phase 8.8 T7).
- [packages/core/principles/08-prior-art-cited.test.ts](../../packages/core/principles/08-prior-art-cited.test.ts) — Phase 2 principle validating that research files cite entries here (added Phase 8.8 T3).
