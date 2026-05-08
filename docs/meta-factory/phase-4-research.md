# Phase 4 — Step 0 entry research (Stack Detector v1)

> **Trigger:** [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) «Existing solutions research» — Phase 4 entry gate (forward Step 0 trigger documented in §5.5 retrofit block, post-Phase-3 retro 2026-05-08).
> **Method:** context7 MCP queries against `/lee-to/ai-factory`. Two adjacent libraries (`semver`, `package-manager-detector`) returned no JS-canonical match; flagged as «not in context7» per §5.5 fallback (no git clone fallback used).
> **Status:** transient artifact per §5.5 — ≤200 lines; may be archived once Phase 4 closes.
> **Question answered:** which Phase 4 capabilities are covered by AIF (or top alternatives) such that Phase 4 should reuse rather than build, and which remain unique value?

---

## §1. Capabilities Phase 4 will cover

Phase 4 (per [EXECUTION-PLAN.md:466-487](EXECUTION-PLAN.md)) extracts logic from `setup.sh:82-97` + `packages/core/detector-v0/detect-applicable-rules.ts` into `packages/core/detector/` v1, adding:

1. **Stack root detection** — framework + runtime from `package.json`, lockfiles, `tsconfig.json`, `next.config.*`
2. **Version-aware logic** — Next 15 vs 16, React 18 vs 19 ranges (semver-aware comparison)
3. **Confidence scoring** — `high | medium | low` per detected dimension
4. **CLI surface** — `npm run detect` emits structured JSON
5. **Snapshot testing** — detector output stable across runs (CI invariant)
6. **Self-application snapshot** — detector runs on root repo in CI; expected output frozen

Per §5.5: each capability requires existing-solution evaluation before drafting `PHASE-4-PROMPT.md`.

---

## §2. Tools resolved (context7)

| Tool | Library ID | Benchmark | Notes |
|---|---|---|---|
| AI Factory | `/lee-to/ai-factory` | 83.7 | Primary candidate per [aif-comparison.md §9](aif-comparison.md) forward implication |
| `semver` (npm) | **not in context7** | — | Resolves returned only `.NET`, Rust, Go, Python variants. npm `node-semver` has no `/org/project` ID surfaced. Flagged. |
| Package-manager / framework auto-detect | **not in context7** | — | Resolves returned Microsoft/Intel/Swift OS package managers — irrelevant. `antfu/package-manager-detector` not surfaced. Flagged. |

Local-clone fallback **not used** — npm `semver` is well-known stable API; package-manager-detector reuse is optional, not blocking. Both flagged as «no context7 source», proceeding with build decisions documented below.

---

## §3. Per-capability matrix

### 3.1 Stack root detection

**AIF detection is prompt-driven (LLM reads inline instructions in skill markdown), not callable code.** Cannot be invoked directly from a deterministic CLI/CI context. But AIF *artifacts* (`.ai-factory/DESCRIPTION.md`, `.ai-factory/skill-context/<skill>/SKILL.md`, `.ai-factory/ARCHITECTURE.md`) are structured files Phase 4 can **read** as primary source — that IS reuse, not just convergent design.

**Source priority (highest confidence first):**

| Priority | Source | Provenance | Confidence |
|---|---|---|---|
| 1 | `.ai-factory/DESCRIPTION.md` | Human-curated (per AIF docs) | `high` |
| 2 | `.ai-factory/ARCHITECTURE.md` | Human-curated, augments 1 | `high` |
| 3 | `.ai-factory/skill-context/<skill>/SKILL.md` | AIF-accumulated (via `/aif-evolve`) | `high` |
| 4 | `package.json` deps + lockfile signature | Heuristic — fallback when AIF absent | `medium` |
| 5 | `next.config.*` / `tsconfig.json` presence | Confirmation signal | `low` |

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF artifacts (priority 1-3) | **Read** `.ai-factory/*.md` files as source-of-truth | **Reuse via read-side** — no logic duplication, no LLM dependency. Extends [aif-comparison.md §5](aif-comparison.md) touchpoint 4 (originally write-only «meta-factory generates skill-context») with a new read-side flow not in the original 4-touchpoint matrix. |
| `packages/core/detector-v0/detect-applicable-rules.ts` (priority 4) | Manifest `requires-package` field, structured JSON | Already in repo — extends to fallback mode |
| `setup.sh:82-97` (legacy) | bash heuristic | Replaced by structured detector |

**Reuse posture:** detector becomes **deterministic bridge over AIF artifacts** with manifest-heuristic fallback when AIF not installed. Not a parallel implementation.

### 3.2 Version-aware logic (Next 15 vs 16)

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF | **None.** Detection is binary («Next.js detected: yes/no»). No major-version branching surfaced in queries. | Gap — AIF can't switch skill behavior on Next 15 vs 16 |
| npm `semver` | `semver.coerce(version)?.major`, `semver.satisfies(version, '>=15 <16')` | Standard library; battle-tested. **Verified 2026-05-08:** `semver@7.7.4` already transitive via `@typescript-eslint/rule-tester` — no explicit dep required. |
| Self-rolled regex | `/^[\^~>=<\s]*v?(\d+)\./` | ~10 LOC; fails on dist-tags (`canary`, `latest`), aliases (`npm:foo@1`), pre-release tags, complex `||` ranges |

**Verdict:** AIF lacks this — Phase 4 unique value. **Use `semver` (npm).** Already transitive (verified 2026-05-08 above) — no `package.json` edit needed; just `import semver from 'semver'` in `packages/core/detector/`. Self-rolled regex rejected — semver parsing is plumbing, not methodological contribution; edge cases (canary tags, RCs, aliases) inevitable in real fixtures.

### 3.3 Confidence scoring

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF `aif-loop` RULE-SCHEMA | `severity: fail \| warn \| info` × `weight: 2 \| 1 \| 0`; aggregate `score = sum(passed_weights) / sum(active_weights)` | **Weighted aggregate per phase** — maps cleanly to per-detection confidence |
| Phase 4 plan (PROPOSAL §8) | `high \| medium \| low` per detected dimension | Domain-specific naming |

**Convergent design:** AIF's `fail=2 / warn=1 / info=0` weight tiers are isomorphic to `high / medium / low`. Both express «how confident is this verdict». **Adopt naming alignment** so detector output can feed into AIF rules without reformatting (touchpoint 3 in [aif-comparison.md §5](aif-comparison.md)).

### 3.4 CLI surface

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF | Slash-command runtime (`/aif-fix`, `/aif-verify`) — invoked from inside an AI-coding session, not standalone CLI | Different UX paradigm: assumes Claude/Cursor/etc. as orchestrator |
| Phase 4 plan | `npm run detect` → JSON to stdout (also npm `bin: meta-factory detect`) | Standalone npm CLI — fits consumer install scenario |

**Verdict:** Different audiences. AIF CLI = AI-orchestrator-internal; ours = npm consumer's `package.json` scripts. **Build standalone CLI** — no reuse possible. Surface area is ≤30 LOC (yargs/commander overkill; plain `process.argv` parsing sufficient).

### 3.5 Snapshot testing

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF EVALUATE phase | Parallel Task agents run executable checks; results stored in `.ai-factory/evolution/<task>/` | Stateful, per-task artifacts; not snapshot-equality |
| Vitest `toMatchSnapshot` (already used in `packages/core/render/__snapshots__/`) | File-based snapshot equality; auto-update on `vitest -u` | Standard JS-side pattern, already in repo |

**Verdict:** Different paradigms (live execution vs static equality). **Build with vitest snapshots** — already proven in Phase 2/3 (`render-rules.test.ts.snap`). No AIF reuse.

### 3.6 Self-application snapshot in CI

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF `/aif-verify --strict` | Runs full toolchain on changed files; emits `aif-gate-result` JSON | Not framework-specific; doesn't pin expected detector output |
| Phase 4 plan | `audit-self.yml` job runs detector on root repo, diffs against frozen `expected-detect.snapshot.json` | Closes self-application invariant L1 (per [self-application.md](self-application.md) §2) |

**Convergent point (touchpoint 4 in [aif-comparison.md §5](aif-comparison.md)):** detector output → `.ai-factory/skill-context/<skill>/SKILL.md` for AIF runtime to consume. **First-class reuse opportunity** — Phase 4 emits skill-context overrides directly, making meta-factory feed AIF without separate adapter.

---

## §4. Reuse-vs-build decisions

| # | Capability | Decision | Rationale |
|---|---|---|---|
| 4.1 | Stack root detection | **Hybrid REUSE: read AIF artifacts as primary source, manifest heuristic as fallback.** | AIF inline detection is prompt-driven (not callable code), but AIF *artifacts* (`.ai-factory/DESCRIPTION.md`, `skill-context/*/SKILL.md`) are structured files we read. Detector = deterministic bridge over AIF, not parallel implementation. Source priority list in §3.1. |
| 4.2 | Version-aware logic | **Build with `semver` (npm) — already transitive.** | AIF gap confirmed. `semver@7.7.4` already in lockfile via `@typescript-eslint/rule-tester` (verified 2026-05-08); no explicit dep needed. Self-rolled regex rejected — parsing semver is plumbing, not methodological contribution. |
| 4.3 | Confidence scoring | **REUSE convergent — adopt AIF severity/weight schema.** | Adopt AIF RULE-SCHEMA semantics directly: emit `severity` + `weight` per AIF spec; derive human-friendly `confidence: high\|medium\|low` as a view. Reuse-of-design-decision — don't reinvent scoring tiers. |
| 4.4 | CLI surface | **Build standalone npm bin.** | Different audiences; AIF CLI not reusable. Keep ≤30 LOC. |
| 4.5 | Snapshot testing | **Build with vitest snapshots.** | Standard pattern, already in repo. AIF EVALUATE is different paradigm. |
| 4.6 | Self-application + AIF integration output | **REUSE skill-context format as output sink.** | Detector emits `.ai-factory/skill-context/{aif-fix,aif-implement,aif-architecture}/SKILL.md` — closes touchpoint 4 from aif-comparison.md §5 in Phase 4 instead of deferring to Phase 11. |

**Acceptance per §5.5:** ≥1 reuse decision required. Achieved via **3 reuses**: 4.1 (read AIF artifacts) + 4.3 (adopt AIF severity/weight schema) + 4.6 (write skill-context). Plus `semver` as upstream-stdlib reuse for 4.2.

**Net Phase 4 scope = 3 build + 3 reuse.** Detector positioning: deterministic bridge over AIF artifacts (read + write), not parallel implementation.

---

## §5. Verdict — proceed with PHASE-4-PROMPT.md draft

**GO. Phase 4 prompt to be drafted with these scope deltas vs initial EXECUTION-PLAN §466-487 description:**

1. **Add 4.1 read-side:** detector reads AIF artifacts (`.ai-factory/DESCRIPTION.md`, `ARCHITECTURE.md`, `skill-context/*/SKILL.md`) as priority 1-3 sources before falling back to manifest heuristic (priority 4-5). Source priority documented in detector schema. Estimated +0.5 day.
2. **Add 4.6 write-side:** detector emits skill-context overrides for top-3 AIF skills (`aif-fix`, `aif-implement`, `aif-architecture`). Pulls AIF integration touchpoint 4 from Phase 11 → Phase 4. Estimated +0.5-1 day.
3. **Confidence schema alignment:** detector output JSON includes both human label (`high|medium|low`) AND AIF-compatible `severity` + `weight`. Single emit, dual contract.
4. **Version-aware via `semver`:** **verified 2026-05-08** — `semver@7.7.4` already transitive via `@typescript-eslint/rule-tester`; no `package.json` edit needed.
5. **No revert of `detector-v0`:** v1 = extension of v0, not rewrite. Preserves Phase 3.1 commit history.

**Risks introduced by 4.1 + 4.6 AIF coupling:**
- AIF artifact format coupling on **both read and write sides** — if AIF changes `.ai-factory/` schema (per AIF coupling risk row in [risks.md](risks.md) 2026-05-08), detector breaks bidirectionally. Mitigation: schema validation in detector tests; subscribe AIF release notes; graceful degradation when AIF artifacts absent (fallback to priority 4-5 = manifest heuristic).
- Scope creep — pulling Phase 11 work into Phase 4 risks blowing 1-week budget. Stop-rule: if 4.1 read-side AND 4.6 write-side combined not done by day 5, ship 4.1 + defer 4.6 to Phase 11 with documented split-point. (4.1 read-side has higher priority — it's Phase 4 self-application angle; 4.6 write-side is bonus integration.)

---

## §6. Forward implications (watch-list)

| Item | Trigger | Owner |
|---|---|---|
| Migrate to `antfu/package-manager-detector` if/when it lands in context7 | next-phase-entry re-validation | Phase 5+ prompt author |
| AIF artifact schema validation (`DESCRIPTION.md`, `skill-context/*/SKILL.md`) — **mandatory in detector tests, not optional** (see §5 risk mitigation: bidirectional break on AIF schema change) | AIF v3.x release; also any 2.x minor that touches `.ai-factory/` shape | continuous (read + write side both affected) |
| Multi-stack monorepo detection (§13.5) | Phase 9+ entry | deferred |

These are watch-list items, not commitments. Re-validate via context7 at each Phase entry per §5.5.
