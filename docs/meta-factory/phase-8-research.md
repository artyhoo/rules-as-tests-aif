# Phase 8 — Step 0 entry research (Acceptance Next 15 → 16 + canonical regen ≤5%)

> **Trigger:** [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) — Phase 8 entry gate.
> **Date:** 2026-05-08.
> **Method:** context7 MCP queries against `/vercel/next.js/v16.2.2` (upgrade guide), `/lee-to/ai-factory` (review-sidecar + GATE-RESULT contract), local reads of `packages/preset-next-15-canonical/eslint-rules/*` + `packages/core/{validator,installer}/types.ts` + `packages/core/synthesizer/recipes/*.json`. Anthropic pricing via WebSearch (constants only, no auth).
> **Status:** transient artifact per §5.5 — ≤200 lines; archived after Phase 8 closes.
> **Question answered:** is Phase 8 implementation scope valid given current state of Next 16 spec, recipe inventory, diff-metric design, AIF gate-result shape, and gate 5 cost envelope?

---

## §1. Capability matrix (5 areas × build/reuse verdict)

| # | Capability | Existing solution found | Convergent design | Verdict |
|---|---|---|---|---|
| C1 | Next 15 → 16 breaking changes diff | Vercel `version-16.mdx` upgrade guide (15+ items) — context7 `/vercel/next.js/v16.2.2` | Recipe authoring follows upgrade-guide categories | **Reuse** (consume guide as authoritative) |
| C2 | Canonical regen diff metric | None as direct OSS lib; `deep-diff`, `fast-deep-equal`, `json-diff` exist but solve raw structural diff, not weighted preset comparison | Hand-author 3-component weighted formula over rule IDs / eslintConfigSnippet keys / appliesTo glob coverage | **Build** (small, ≤80 LOC; transitive `deep-equal` if needed) |
| C3 | `/aif-verify` integration spike | AIF `aif-gate-result` JSON contract via `/lee-to/ai-factory` | L4 ValidationReport + L5 InstallReport already structurally compatible — additive mapping only | **Reuse** (Phase 8 includes spike — cost low) |
| C4 | Recipe expansion R12/R14/R20 | Existing 3 rules in `packages/preset-next-15-canonical/eslint-rules/` with paired tests + RuleTester corpus | Mechanical lift — each rule already has positive/negative test cases that map directly to recipe `examples.good/bad` + `negative-test.expect-violation` | **Build via mechanical lift** (not hand re-author) |
| C5 | Gate 5 (two-AI review) cost-scoping | AIF `review-sidecar` (`model: opus`) sub-agent — context7 `/lee-to/ai-factory` | Per-plan invocation, advisory non-blocking, cached via `rules-lock.json` sourceFingerprint | **Reuse mapping; defer impl past Phase 8** (estimated <$0.50 per Phase 8 acceptance run) |

≥1 reuse decision per §5.5 acceptance: **C1, C3, C5 reuse; C2, C4 build (small / mechanical)**. No red flag of all-build.

---

## §2. C1 — Next 15 → 16 breaking changes diff (CRITICAL)

**Query log:**
- `mcp__context7__resolve-library-id` `Next.js` → `/vercel/next.js` (versions: …, v15.x, v16.0.3, v16.1.1, v16.2.2)
- `query-docs /vercel/next.js/v16.2.2` × 4 phrasings: «upgrading from version 15 to 16 breaking changes»; «Pages Router removal AMP Babel async params»; «codemod next/image objectFit Turbopack default removed config flags»; «minimum Node.js version React 19 deprecated config options removed».
- All 4 returned substantive content from `version-16.mdx`. Source repeatedly cited: `https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/02-guides/upgrading/version-16.mdx`.

**Findings (15 breaking changes; recipe-relevant = 13/15):**

- **Structural (3):** `middleware.ts` → `proxy.ts` (export rename + `nodejs`-only runtime; edge users keep `middleware.ts`); `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`. *All recipe-relevant.*
- **API (5):** sync access to `cookies()`/`headers()`/`draftMode()`/`params`/`searchParams` **fully removed**; `unstable_cacheLife`/`unstable_cacheTag` stabilized; `PageProps<...>` requires `npx next typegen`; Server Actions default `default-no-store` (runtime — not source-rule). *4/5 recipe-relevant.*
- **Deprecations (2):** `next/legacy/image` (`objectFit`/`objectPosition` removed → `style`); AMP fully removed (`useAmp`, `amp` config, page-level config). *Both recipe-relevant.*
- **Config (3):** `eslint` option removed from `next.config.js`; `turbopack` graduated `experimental.turbopack` → top-level; `experimental.swcMinify` + assorted experimental flags graduated/removed. *All recipe-relevant.*
- **Runtime (3):** Node 18 dropped, min **20.9.0**; min TS **5.1.0**; browsers Chrome/Edge/Firefox 111+, Safari 16.4+ (last is runtime — not source-rule). *2/3 recipe-relevant (engine guards).*

**Drift vs EXECUTION-PLAN.md §3.5 snapshot (2026-05-07):** snapshot listed Pages Router, async params, middleware→proxy, Turbopack default, Babel removed, AMP, image-deprecation = 7 items. Findings above add **at minimum** 8 new items (`eslint` config removed, `unstable_cache*` stabilized, `skipProxy*` flag, Node 20.9 min, TS 5.1 min, `experimental.turbopack` → top-level, edge-runtime guard, PageProps codegen). Snapshot is **broadly accurate** in direction; **incomplete** for recipe authoring.

**Decision:** **Reuse** — `version-16.mdx` is the authoritative diff source. Phase 8 recipe authoring grounds each new recipe in a numbered upgrade-guide section, with cross-reference comment `// from version-16.mdx#<anchor>` per recipe (provenance trail).

**Rationale:** all 15 items came from a single curated source updated alongside the framework — quoting the upgrade guide sentence «*Starting with Next.js 16, synchronous access to request APIs is fully removed*» is more durable than scraping changelog. Stop-rule signal: snapshot drift is **non-blocking** for Phase 8 entry but **mandates a refresh edit to §3.5** during Phase 8 implementation (Task: «sync §3.5 snapshot with version-16.mdx»). Does not REVISE the entry decision.

---

## §3. C2 — Canonical regen diff metric (CRITICAL)

**Query log:**
- `resolve-library-id` `deep-diff` → no JS NPM match in top 5 results (returned `csv-diff`, `openapi-diff`, Go/PHP libs).
- `resolve-library-id` `json-diff` → top 5: `/josephburnett/jd` (Go), `/weichch/system-text-json-jsondiffpatch` (.NET), `/yudai/gojsondiff` (Go), `/rexskz/json-diff-kit` (TS, 4 snippets), `/simonw/csv-diff`. Only `/rexskz/json-diff-kit` is JS/TS.
- `query-docs /openapitools/openapi-diff` → confirmed pattern: per-change-type weight config (`incompatible.response.enum.increased`, etc.); breaking-change classification rather than scalar score.
- `query-docs /rexskz/json-diff-kit` → produces raw `DiffResult[]` (added/removed/modified at path); no scoring/weighting; would require a JS dep.

**Findings:**

1. **No NPM library produces a weighted preset-comparison scalar.** Existing libs (`json-diff-kit`, `gojsondiff`) emit raw structural deltas; the consumer must aggregate.
2. **`openapi-diff` philosophy is the closest analog** — categorize changes (added endpoint = compatible; removed endpoint = breaking; type change = breaking) and decide compatibility from the categories rather than from a generic edit distance.
3. **Adopting `json-diff-kit` violates [retros/phase-7.md §«NO new explicit deps»](retros/phase-7.md)** stop-rule. Verified gain (raw diff array) is small relative to the cost (new transitive surface, `viewer.css` ship-in cost).

**Decision:** **Build** a small inline metric (≤80 LOC pure TS, no deps), shipped at `packages/core/diff/preset-similarity.ts`. Three-component weighted formula:

```
similarity(P_synth, P_canon) =
    0.40 · jaccard( ruleIds(P_synth), ruleIds(P_canon) )
  + 0.40 · jaccard( eslintKeys(P_synth), eslintKeys(P_canon) )
  + 0.20 · glob_overlap( appliesTo(P_synth), appliesTo(P_canon) )

where:
  jaccard(A, B) = |A ∩ B| / |A ∪ B|       ∈ [0, 1]
  eslintKeys(P) = flat keys of merged eslintConfigSnippet across rules
  glob_overlap(A, B) = mean over rule pairs of (overlap of resolved file globs)
                      using minimatch ↦ glob → set (pre-sample fixture corpus)
                                                                  ∈ [0, 1]

acceptance gate (Phase 8): similarity(P_regen, P_canonical_v15) ≥ 0.95
                           ⟺ diff ≤ 5%
```

**Rejected alternatives:** raw `deep-diff` change count ÷ total fields (weights every field equally — `emittedAt` churn dominates); `toMatchSnapshot()` (forces zero-diff, contradicts «≤5%»); sha256-of-canonicalized-JSON (opaque on failure); adopting `json-diff-kit` (violates `NO new explicit deps` and still needs the weighting layer).

**Weight provenance:** rule presence and ESLint config keys are the two user-observable preset surfaces (0.40 each); glob coverage is downstream of rule presence (0.20). Initial guesses per [EXECUTION-PLAN.md §5 thresholds caveat](EXECUTION-PLAN.md); revisit on Phase 8 retro.

---

## §4. C3 — `/aif-verify` integration forward-spike (HIGH)

**Query log:**
- `query-docs /lee-to/ai-factory` «aif-gate-result GATE-RESULT-CONTRACT schema» → returned 5 cited sources: `skills/aif-verify/references/GATE-RESULT-CONTRACT.md`, `docs/quality-gates.md`, `skills/aif-verify/SKILL.md`, plus 2 example blocks in `llms.txt`.
- Local reads: [packages/core/validator/types.ts](../../packages/core/validator/types.ts) (27 lines), [packages/core/installer/types.ts](../../packages/core/installer/types.ts) (50 lines).

**`aif-gate-result` schema v1 (per AIF):**
```
schema_version: 1
gate: "verify"|"review"|"security"|"rules"
status: "pass"|"warn"|"fail"
blocking: boolean
blockers: [{id, severity: "error"|"warning", file?, summary}]
affected_files: [path]
suggested_next: {command, reason}
```

**Mapping (current → AIF, all gaps additive):** `schema_version: 1` constant; `gate: "rules"` constant; `status` = `ok ? "pass" : "fail"` (2-state vs AIF 3-state — `warn` is the only minor gap, non-blocking); `blocking` = `!ok`; `blockers[]` = flatten `gates.{schema,ruleTester,tautology,conflict}.failures` to `{id: gate+ruleId, severity: "error", file: null, summary: reason}`; `affected_files` = `InstallReport.artifacts[]` for L5, `[]` for standalone L4; `suggested_next` derived (`pass → /aif-commit`, `fail → /aif-fix`).

**Findings:** (1) mapping is purely additive — no breaking change to `ValidationReport`/`InstallReport`; new pure module `to-aif-gate-result.ts` (~60 LOC). (2) `warn` 3rd-state gap optionally closed by v1.5 `ValidationReport.severity?: 'error'|'warning'` field, default `'error'` — advisory gates (gate 5) would map to `warn`. (3) `InstallReport.artifacts` is already 1:1 with `affected_files`. (4) AIF `schema_version: 1` and `RulesLock.schemaVersion: 1` carry independent bump cadence — safe.

**Decision:** **Integration cost is LOW. Phase 8 includes the spike.**

**Concrete Phase 8 deliverable:** ship `to-aif-gate-result.ts` + 1 emit point (e.g. `framework-self-validate` CI job appends an `aif-gate-result` JSON block to its log per AIF SKILL.md «Append machine-readable gate result»). Closes [aif-comparison.md §7 Phase 11.1](aif-comparison.md) **partially in Phase 8** rather than Phase 11.

**Rationale:** the mapping is purely structural and ≤60 LOC. Skipping it now means Phase 11.1 must do the same work plus relearn the report shapes. AIF docs explicitly state «*Orchestrators should parse this block for gate results*» — emitting it is the wire format for any future AIF orchestrator-driven CI.

---

## §5. C4 — Recipe expansion strategy R12/R14/R20 (HIGH)

**Inputs (read, no edits):** R12 [no-server-imports-in-client.ts](../../packages/preset-next-15-canonical/eslint-rules/no-server-imports-in-client.ts) 69 LOC, R14 [require-form-safe-parse.ts](../../packages/preset-next-15-canonical/eslint-rules/require-form-safe-parse.ts) 105 LOC, R20 [require-use-server-directive.ts](../../packages/preset-next-15-canonical/eslint-rules/require-use-server-directive.ts) 76 LOC. Each rule has paired `.test.ts` (72-73 LOC) with ≥6 invalid + ≥7 valid cases. [eslint-rules/index.ts](../../packages/preset-next-15-canonical/eslint-rules/index.ts) already exports flat `plugin: { rules: {...} }` — directly consumable as ESLint plugin (Phase 7 gate-conflict already loads it). Existing recipes (e.g. [nextjs-app-router.json](../../packages/core/synthesizer/recipes/nextjs-app-router.json)) use **built-in** ESLint rules; R12/R14/R20 are **custom AST rules**.

**Findings:** (1) `check.rule: string` already accepts any rule name; switching to plugin-namespaced `rules-as-tests-preset/<rule>` is a string change, no recipe-shape breaking change. (2) Test corpus is rich enough for mechanical lift — pick first invalid → `negative-test.input` + `examples.bad`; first valid → `examples.good`. (3) R12/R14/R20 = 250 LOC stable rules, already pass 38/38 preset tests; no behavioral re-implementation needed.

**Decision:** **Build via mechanical lift** — 3 thin-pointer recipes referencing existing preset plugin rules.

Per-rule recipe shape: `check.rule = "rules-as-tests-preset/<name>"`; `eslintConfigSnippet = { "rules-as-tests-preset/<name>": "error" }`; `examples.bad/good` lifted from `.test.ts` invalid[0]/valid[0]; `negative-test.input` = invalid[0].code; `negative-test.expect-violation` = plugin-namespaced rule name.

**Effort estimate:** 3 rules × 10-15 min = ~45 min burn mode. Plus verify `gate-rule-tester.ts` registers preset plugin (likely yes per [retros/phase-7.md reuse 7.4](retros/phase-7.md), `gate-conflict.ts` already does).

**Rationale:** mechanical lift preserves provenance via inline `// from preset-next-15-canonical/eslint-rules/<name>.ts` comment. Hand re-author would either duplicate 250 LOC × 3 (DRY violation, two SSOTs) or rewrite outside preset (4-8h cost). Thin-pointer recipes preserve «Path A only» invariant per [§6.0](EXECUTION-PLAN.md).

---

## §6. C5 — Gate 5 two-AI review cost-scoping (MEDIUM)

**Query log:** `query-docs /lee-to/ai-factory` «review-sidecar configuration model opus override two-AI review cost» → confirmed `subagents/review-sidecar.md` shape (read-only, bounded scope, never edits/clarifies; `model: opus` is a subagent extension field per `SPECIFICATION.md`). Anthropic pricing (May 2026, via WebSearch): Opus 4.7 $5/M input / $25/M output; Sonnet 4.6 $3/M input / $15/M output; prompt-caching ≤90% savings; batch 50% savings.

**Cost models compared (Phase 8 acceptance = 26 rules × canonical regen):**

| Mode | Input tokens | Output tokens | Cost per run | Latency |
|---|---|---|---|---|
| Per-rule (26 invocations) | 3K × 26 = 78K | 0.5K × 26 = 13K | 78K · $5/M + 13K · $25/M = $0.39 + $0.325 = **$0.72** | sequential ≥30s; parallel ≤10s |
| Per-plan (1 invocation) | full plan ~30K + system 2K = 32K | 5K | 32K · $5/M + 5K · $25/M = $0.16 + $0.125 = **$0.29** | ≤8s |
| Per-plan + caching (warm) | 32K with 90% cached | 5K | 0.1·$0.16 + $0.125 = **$0.14** | ≤8s |
| Per-rule + Sonnet 4.6 | 78K + 13K | | 78K · $3/M + 13K · $15/M = $0.234 + $0.195 = **$0.43** | as above |

**Decision:** **Per-plan + Opus 4.7 + advisory non-blocking + cached via `rules-lock.json.sourceFingerprint`.**

**Rationale:**
1. **Per-plan is ~3× cheaper than per-rule** at equal model — fewer invocations amortize the system-prompt / context overhead.
2. **Opus over Sonnet for review** — gate 5 is the *quality* gate (catches semantics that gates 1/2/4/6 can't). The `$0.15` premium over Sonnet is a rounding error vs. the Phase 8 `≤$5` budget per [EXECUTION-PLAN.md §6 Phase 8](EXECUTION-PLAN.md).
3. **Advisory non-blocking** — gate 5 was deferred from L4 v1 [retros/phase-7.md gate 5 row](retros/phase-7.md) precisely because LLM-driven review carries false-positive risk. Advisory in Phase 8; promote to blocking only after [open-questions.md §13.10 v2 entry #4](open-questions.md) verification gate hits «false-positive rate <20% on 10+ real PRs».
4. **Caching via `sourceFingerprint`** — `rules-lock.json` already carries `sourceFingerprint: sha256/16`. Reuse: gate 5 stores `{fingerprint, verdict, timestamp}`; rerun only when fingerprint changes. Cuts repeated CI runs to ~$0.

**Phase 8 dollar estimate:** **<$0.30 per acceptance run; <$5 even with 10× retries.** No revision to §6 Phase 8 «cost ≤$5» verdict gate. Stop-rule «>$10 ⇒ REVISE» does not fire.

**Phase 8 deliverable scope:** decision documented + cost-tracking shape captured per [open-questions.md §13.11](open-questions.md). Actual gate 5 *implementation* still defers to v2 trigger (per [§13.10 entry #4](open-questions.md)) — this research closes the **scoping** decision, not the build.

---

## §7. Phase 8 task list (ordered C1 → C4 → C2 → C3 → C5)

Each task ≈ one commit; conventional-commits, English subjects.

#### Task 8.1 — Refresh §3.5 Next 15 → 16 snapshot from `version-16.mdx`
Sync EXECUTION-PLAN.md §3.5 with the 15-item list from §2 above. Doc-only.

#### Task 8.2 — Lift R12/R14/R20 to recipes (C4)
Author 3 new recipes under `packages/core/synthesizer/recipes/` referencing `rules-as-tests-preset/<rule>` plugin names. Pull `examples.bad/good` + `negative-test.input` from existing `.test.ts` corpora. Update `gate-rule-tester.ts` if it does not already register the preset plugin during gate 2.

#### Task 8.3 — Build similarity metric module (C2)
Ship `packages/core/diff/preset-similarity.ts` (≤80 LOC, no deps): jaccard helpers + glob_overlap + weighted score. Tests: synthetic equal/disjoint/partial-overlap fixtures.

#### Task 8.4 — `/aif-verify` integration spike (C3)
Ship `packages/core/validator/to-aif-gate-result.ts` (≤60 LOC, pure). Wire emission in `framework-self-validate` CI job per [aif-comparison.md §7 Phase 11.1](aif-comparison.md). Closes Phase 11.1 partial.

#### Task 8.5 — Document gate 5 cost-scoping decision (C5)
Edit [open-questions.md §13.11](open-questions.md) with per-plan + Opus 4.7 + advisory + sourceFingerprint-cached scoping. No implementation.

#### Task 8.6 — Acceptance run: canonical regen + similarity ≥0.95
Synthesize `preset-next-15-canonical` regen via L2 + L3 + L4 pipeline; compute similarity vs frozen `expected-canonical-v15.json` snapshot; assert ≥0.95. CI job `phase-8-canonical-regen-acceptance`.

#### Task 8.7 — Phase 8 retro + verdict
Standard retro per §5 + GO/REVISE verdict on Phase 9 entry.

---

## §8. Open questions for Phase 8 implementation session

1. **Gate 2 plugin registration** — does `gate-rule-tester.ts` already register the preset plugin (Phase 7 [reuse 7.4](retros/phase-7.md) implies yes for `gate-conflict.ts`; gate 2 unverified)? Phase 8 first task verifies and patches if needed.
2. **Glob-overlap implementation cost** — naive «expand globs over a fixture corpus + compare sets» needs a fixture corpus. Pick existing `tests/fixtures/` or build a 20-file representative bundle? Decide at Task 8.3 start.
3. **Acceptance run reproducibility** — `expected-canonical-v15.json` snapshot must be frozen before Task 8.6 to avoid moving-target. Snapshot at end of Task 8.2 (post-recipe-lift, pre-similarity-build) or at Phase 8 start (pre-Task-8.2)?
4. **`framework-self-research --llm` v2 trigger overlap** — Phase 8 acceptance is the trigger condition for [open-questions.md §13.10 entry #1](open-questions.md). If acceptance hits a research gap (Next 16 pattern not in curated store), Phase 8 retro must record the trigger fire and flag for Phase 9 v2 entry.
5. **Snapshot storage shape for cost-tracking** — `rules-lock.json` extension vs separate `gate-5-cache.json`? Defer until Phase 9+ when gate 5 actually ships; Task 8.5 documents both options in §13.11.

---

## §9. Versioning

- **2026-05-08** — Phase 8 entry research close. 5 capability matrix rows + per-capability decisions; verdict in [retros/phase-8-entry.md](retros/phase-8-entry.md). Forked from `main` HEAD post-PR-#7-merge state (Phase 7.5 close commits c8005c1..c7c7d27). Single-session burn mode (Opus 4.7), context7 round-trips on `/vercel/next.js/v16.2.2` × 4, `/lee-to/ai-factory` × 2, library-resolve × 3, WebSearch × 1.

