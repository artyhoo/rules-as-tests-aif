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

**Findings (≥10 breaking changes, categorized):**

| # | Category | Change | Recipe-relevant? |
|---|---|---|---|
| 1 | structural | `middleware.ts` → `proxy.ts` rename; `middleware` export → `proxy` | YES — R-new («prefer-proxy-over-middleware») candidate |
| 2 | structural | `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize` config flag | YES — config-snippet rule update |
| 3 | structural | `proxy` runtime is `nodejs` only; edge runtime NOT supported in proxy (keep `middleware.ts` for edge) | YES — guard rule for edge-runtime users |
| 4 | api | Async Request APIs: `cookies()`, `headers()`, `draftMode()`, `params` (layout/page/route/default/og-image/twitter-image/icon/apple-icon), `searchParams` (page) — **sync access fully removed** | YES — extends existing R12 («await-async-request-apis») coverage |
| 5 | api | `unstable_cacheLife`, `unstable_cacheTag` → stable (drop `unstable_` prefix) | YES — codemod-grade rule |
| 6 | deprecation | `next/legacy/image` deprecated; `objectFit` / `objectPosition` props removed → `style`/`className` | YES — R-new («next-image-no-objectFit-prop») |
| 7 | deprecation | AMP fully removed: `useAmp` hook, `amp` config in `next.config.js`, page-level `export const config = { amp: true }` | YES — 3 sub-rules |
| 8 | config | `eslint` option **removed** from `next.config.js` | YES — config-snippet rule («no-eslint-in-next-config») |
| 9 | config | `turbopack` moved from `experimental.turbopack` → top-level `turbopack` | YES — config rule |
| 10 | config | `experimental.swcMinify`, several other experimental flags graduated/removed (per upgrade-guide §config) | YES — sweep rule |
| 11 | runtime | Node.js 18 dropped; min **20.9.0** | YES — engine guard rule (package.json check) |
| 12 | runtime | Min TypeScript **5.1.0** | YES — engine guard rule |
| 13 | runtime | Browser support: Chrome/Edge/Firefox 111+, Safari 16.4+ | NO — runtime concern, not source-rule |
| 14 | api | `PageProps<...>` helper requires `npx next typegen` codegen step | YES — install-time check |
| 15 | api | Server Actions default fetch cache `'default-no-store'` (reaffirms v15 default; v16 spec hardens) | NO — runtime semantic, not source-rule |

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

**Rejected alternatives:**
- **Raw `deep-diff` change count ÷ total fields** — rejected: weights all field changes equally; severity flip and `emittedAt` timestamp churn would dominate; opaque to debug. Not aligned with «what makes presets equivalent» — rule presence + ESLint-rule-key parity matters more than serialized-field equality.
- **`expect.toMatchSnapshot()` jest equality** — rejected: forces zero-diff which contradicts §6 Phase 8 acceptance text «≤5%»; brittle to recipe-author re-orderings; would block Phase 8 acceptance on whitespace.
- **sha256 of canonicalized JSON** — rejected: same brittleness as snapshot but without surfacing *which* component drifted; opaque on failure.
- **Adopt `json-diff-kit`** — rejected per stop-rule; gain (raw delta array) is small; we still need to author the weighting logic.

**Provenance for weights:**
- 0.40 / 0.40 — rule presence and config keys are the two user-observable surfaces of a preset. Equal weight.
- 0.20 — glob coverage matters but is downstream of rule presence (a rule with same ID + same key on slightly different glob still mostly matches).
- These are **initial guesses** per [EXECUTION-PLAN.md §5 numerical-thresholds caveat](EXECUTION-PLAN.md); revisit on Phase 8 retro with actual regen data.

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

**Mapping table (current `ValidationReport` + `InstallReport` × `aif-gate-result`):**

| `aif-gate-result` field | Current source | Gap |
|---|---|---|
| `schema_version` | n/a — emit constant `1` | **additive** |
| `gate` | n/a — emit constant `"rules"` (this framework's gate kind) | **additive** |
| `status` | `ValidationReport.ok ? "pass" : "fail"` | **minor — current is 2-state, AIF is 3-state** (no `"warn"`) |
| `blocking` | derived `!ValidationReport.ok` | **none** |
| `blockers[]` | flatten `gates.{schema,ruleTester,tautology,conflict}.failures` with `{id: ${gate}+${ruleId}, severity: "error", file: null, summary: failure.reason}` | **additive transformation** |
| `affected_files` | `InstallReport.artifacts[]` (L5 only); `[]` for standalone L4 | **none — L4 has no disk side-effect** |
| `suggested_next.command` | derived: `pass → /aif-commit`, `fail → /aif-fix` | **none — advisory only** |
| `suggested_next.reason` | derived: aggregate first 3 blocker summaries | **none** |

**Findings:**

1. **Mapping is purely additive — no breaking change to `ValidationReport`/`InstallReport`.** A new module `packages/core/validator/to-aif-gate-result.ts` (~60 LOC, pure) transforms either report into the contract shape.
2. **`"warn"` 3rd state gap is non-blocking.** Current 2-state `ok: boolean` covers the «pass | fail» spectrum AIF needs for L4-equivalent enforcement. Optional v1.5 enhancement: add `ValidationReport.severity?: 'error'|'warning'` (default `'error'`) so that future advisory-only gates (e.g. gate 5 review-sidecar) map to `warn`. Captured as Phase 11.1 SSOT input per [aif-comparison.md §7](aif-comparison.md).
3. **L5 `affected_files` is already accurate.** `InstallReport.artifacts: string[]` lists exactly the files L5 wrote — direct 1:1 mapping.
4. **Schema-version invariant naturally aligns.** AIF's `schema_version: 1` and `RulesLock.schemaVersion: 1` (per [installer/types.ts:33](../../packages/core/installer/types.ts#L33)) carry the same semantic — independent bump cadence is safe.

**Decision:** **Integration cost is LOW. Phase 8 includes the spike.**

**Concrete Phase 8 deliverable:** ship `to-aif-gate-result.ts` + 1 emit point (e.g. `framework-self-validate` CI job appends an `aif-gate-result` JSON block to its log per AIF SKILL.md «Append machine-readable gate result»). Closes [aif-comparison.md §7 Phase 11.1](aif-comparison.md) **partially in Phase 8** rather than Phase 11.

**Rationale:** the mapping is purely structural and ≤60 LOC. Skipping it now means Phase 11.1 must do the same work plus relearn the report shapes. AIF docs explicitly state «*Orchestrators should parse this block for gate results*» — emitting it is the wire format for any future AIF orchestrator-driven CI.

---
