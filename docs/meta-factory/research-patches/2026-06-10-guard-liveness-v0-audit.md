<!-- scope:guard-liveness-v0-audit -->
# guard-liveness v0 — value-weighted distribution audit

> **Date:** 2026-06-10
> **Slug:** guard-liveness-v0-audit
> **Type:** R-phase (research / classification) — no code, no schema change.
> **Design SSOT:** `docs/meta-factory/research-patches/2026-05-23-guard-liveness-gate.md` §3 sub-wave row v0.
> **Consumed by:** v1.5 kickoff (`guard-liveness-v1.5-cmd-script/`) and v3 kickoff (`guard-liveness-v3-manual-sp/`).

## §0 Why this audit

The umbrella's earlier framing claimed v1 (ESLint, 11 rules) covers «most value». The actual
`rules-manifest.json` distribution is **non-ESLint-majority**:

```text
eslint:11 / command:7 / manual:5 / script:3  →  15/26 = 58% non-ESLint
```

Closing v1 alone leaves the larger half uncovered. This audit produces a per-rule criticality
classification so v1.5 / v3 kickoffs can be authored against load-bearing reality.

**Tooling note (minor finding — record for downstream executors):** `jq` is absent in this
execution environment; `node -e` (available) was used for all JSON parsing. Downstream
executors must not assume `jq`.

## §1 Per-rule criticality table

Evidence basis per row: `packages/preset-next-15-canonical/RULES.md` (R1–R20 canonical template),
`packages/core/templates/shared/integration-rules.md` (IR1–IR6 canonical template),
`packages/core/manifest/rules-manifest.json` (all fields), recipe layer
(`packages/core/synthesizer/recipes/*.json`).

Negative-test field: structurally absent from the manifest (`rules-manifest.schema.json`,
`additionalProperties: false` on RuleEntry — see §2 Finding 1). Checked recipe layer for
each rule id. Results shown in the `neg-test` column.

| id | type | criticality | rationale (evidence) | neg-test |
|----|------|-------------|----------------------|----------|
| R1 | command | LOAD-BEARING | RULES.md:18 — `tsc --noEmit && eslint <files>`; core TS hygiene gate applied to all ts-server+react-next projects | absent — not in manifest schema; no recipe for R1 |
| R2 | eslint | LOAD-BEARING | RULES.md:19 — `rules-as-tests/no-unsafe-zod-parse`; custom ESLint rule in `packages/preset-next-15-canonical/eslint-rules/` | absent — no recipe for R2 |
| R3 | command | LOAD-BEARING | RULES.md:20 — `npm run arch:check` (dependency-cruiser); referenced in ARCHITECTURE.ts-server.md:88 | absent — no recipe for R3 |
| R4 | script | LOAD-BEARING | RULES.md:21 — `scripts/audit-r4.ts`; actual source at `packages/core/probes/audit-r4.ts`; referenced ARCHITECTURE.ts-server.md:92 (see §2 Finding 2a: dangling path) | absent — no recipe for R4 |
| R5 | eslint | LOAD-BEARING | RULES.md:22 — `@typescript-eslint/no-floating-promises`; standard TS rule for async correctness | absent — no recipe for R5 |
| R6 | eslint | LOAD-BEARING | RULES.md:23 — `no-throw-literal`; core error-handling discipline | absent — no recipe for R6 |
| R7 | eslint | LOAD-BEARING | RULES.md:24 — `rules-as-tests/no-direct-time-randomness`; custom rule, referenced ARCHITECTURE.ts-server.md:89 | absent — no recipe for R7 |
| R8 | eslint | LOAD-BEARING | RULES.md:25 — `rules-as-tests/require-otel-span`; custom rule; `auto-skip-if-missing:true` + `requires-package:"@opentelemetry/api"` | absent — no recipe for R8 |
| R9 | eslint | LOAD-BEARING | RULES.md:26 — `no-restricted-imports`; referenced ARCHITECTURE.ts-server.md:90 | absent — no recipe linked to R9 (nextjs-app-router.json uses same ESLint rule for a specific sub-case but patternId not R9) |
| R10 | manual | LOAD-BEARING | RULES.md:27 — manual AI sidecar grep on diff; delivered via `packages/core/templates/shared/skill-context/aif-rules-check/SKILL.md` | absent — manual type; no recipe |
| R11 | command | LOAD-BEARING | RULES.md:28 — `audit-self.yml` (actionlint + zizmor) + `workflow-integrity.yml`; multi-layer CI gate | absent — no recipe for R11 |
| R12 | eslint | LOAD-BEARING | RULES.md:29 — `rules-as-tests/no-server-imports-in-client`; `auto-skip:true` requires `next`; dedicated recipe `next-r12-no-server-imports-in-client.json` | `next-r12-no-server-imports-in-client.json` rule.negative-test: input `'use client';\nimport fs from 'fs';`, expect-violation `rules-as-tests/no-server-imports-in-client` |
| R13 | manual | LOAD-BEARING | RULES.md:30 — AST grep on TanStack Query / SWR; `auto-skip:true` requires `next`; T-V0-A applies — manual ≠ unimportant | absent — manual type; no recipe |
| R14 | eslint | LOAD-BEARING | RULES.md:31 — `rules-as-tests/require-form-safe-parse`; `auto-skip:true` requires `next`; dedicated recipe `next-r14-require-form-safe-parse.json` | `next-r14-require-form-safe-parse.json` rule.negative-test: input `export async function action(formData: FormData) { return formData.get('name'); }`, expect-violation `rules-as-tests/require-form-safe-parse` |
| R15 | eslint | LOAD-BEARING | RULES.md:32 — `jsx-a11y/strict`; react-next stack; no auto-skip | absent — no recipe for R15 |
| R16 | eslint | LOAD-BEARING | RULES.md:33 — `@next/next/no-img-element`; `auto-skip:true` requires `next` | absent — no recipe for R16 |
| R17 | script | LOAD-BEARING | RULES.md:34 — `scripts/audit-ai-docs.react-next.sh`; actual at `packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh`; `auto-skip:true` requires `storybook` (see §2 Finding 2b: dangling path) | absent — script type; no recipe for R17 |
| R18 | manual | LOAD-BEARING | RULES.md:35 — AST grep on `useQuery` without `.parse()`; `auto-skip:true` requires `@tanstack/react-query`; T-V0-A applies | absent — manual type; no recipe |
| R19 | command | LOAD-BEARING | RULES.md:36 — `depcruise --validate` (blocks styled-components/@emotion); react-next; no auto-skip | absent — no recipe for R19 |
| R20 | eslint | LOAD-BEARING | RULES.md:37 — `rules-as-tests/require-use-server-directive`; `auto-skip:true` requires `next`; dedicated recipe `next-r20-require-use-server-directive.json` | `next-r20-require-use-server-directive.json` rule.negative-test: input `export async function action() { return 1; }`, expect-violation `rules-as-tests/require-use-server-directive` |
| IR1 | command | LOAD-BEARING | integration-rules.md:21 — CI job: zod-to-openapi diff vs published OpenAPI; microservices stack | absent — no recipe for IR1 |
| IR2 | command | LOAD-BEARING | integration-rules.md:29 — `pact-publish + pact-verify + can-i-deploy`; microservices stack | absent — no recipe for IR2 |
| IR3 | script | LOAD-BEARING | integration-rules.md:38 — `publish()` calls reference `@org/event-schemas`; check.script is **prose, not a path** (see §2 Finding 2c: IR3 sub-finding); actual probe in `packages/core/audit-self/audit-ai-docs.sh` | absent — no recipe for IR3 |
| IR4 | command | LOAD-BEARING | integration-rules.md:47 — `depcruise blocks bare fetch()` to internal service URLs; microservices stack | absent — no recipe for IR4 |
| IR5 | manual | LOAD-BEARING | integration-rules.md:54 — trace propagation; verified in integration tests + Jaeger/Tempo; T-V0-A applies | absent — manual type; no recipe |
| IR6 | manual | LOAD-BEARING | integration-rules.md:62 — resilience patterns; verified by chaos tests in staging; T-V0-A applies | absent — manual type; no recipe |

**Population count verified:** 26 rules enumerated (T10). Zero UNKNOWN, zero DEPRECATED, zero AUTO-GEN found.

## §2 Consolidated findings (input to v1 / v1.5 / v3)

### Finding 1 — Manifest-vs-recipe negative-test schema split (input to v1)

**Surface:** `packages/core/manifest/rules-manifest.schema.json` vs `packages/core/synthesizer/recipe.schema.json`.

The `negative-test` field (`{input: string, 'expect-violation': string}`) lives in the **recipe schema** only:
- `recipe.schema.json` defines it under `rule.negative-test` with `additionalProperties: false` (see `packages/core/synthesizer/types.ts:14–17` — `NegativeTest` interface).
- `rules-manifest.schema.json` uses `additionalProperties: false` on the rule entry object and does NOT include `negative-test` — the field is **structurally illegal** in the manifest.

Consequence: three recipes carry negative tests for manifest rules (R12, R14, R20) but there is **no manifest-level mechanism** to record or query negative-test coverage for the remaining 23 rules. The guard-liveness v1 ESLint gate will need to decide whether to: (a) add `negative-test` to the manifest schema, or (b) keep the two-layer separation and look up tests only in recipes.

**Do not fix in this PR** — record as input to v1 kickoff.

### Finding 2 — Dangling `check.script` paths (3 instances)

All three `script`-type rules reference **consumer-install-relative paths** that do not resolve in this source repo. This is expected behaviour (paths resolve in the consumer's installed project), but the manifest carries no metadata to help locate the source.

**2a — R4** (`scripts/audit-r4.ts`): source at `packages/core/probes/audit-r4.ts`. Install step copies/symlinks to `<consumer>/.ai-factory/scripts/`.

**2b — R17** (`scripts/audit-ai-docs.react-next.sh`): source at `packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh`. Same install-time mechanism.

**2c — IR3** (`audit-ai-docs.sh probe — \`publish()\` calls reference @org/event-schemas`): `check.script` value is **descriptive prose, not a path**. The `script` check type expects a path (per `rules-manifest.schema.json`: `check.type: const "script"`, `check.script: string`). Related actual file: `packages/core/audit-self/audit-ai-docs.sh` — but the probe described is service-specific logic, not the core audit script. This is the most severe dangling-path issue: the value is non-resolvable by any path tooling.

**Do not fix in this PR** — record as input to v1.5 kickoff (the v1.5 liveness gate for command/script rules will need to handle these).

## §3 Weighted re-statement

Criticality filter: **LOAD-BEARING only**. Count = 26 (all rules are LOAD-BEARING).

| check.type | total | LOAD-BEARING | % of LB pool |
|------------|-------|--------------|--------------|
| eslint     |  11   |     11       |  42.3%       |
| command    |   7   |      7       |  26.9%       |
| manual     |   5   |      5       |  19.2%       |
| script     |   3   |      3       |  11.5%       |
| **total**  |  26   |     26       | 100.0%       |

**Conclusion:** ESLint (v1) covers exactly **42.3%** of LOAD-BEARING rules — same as the raw ratio.
The «most value» claim is factually incorrect: v1 covers less than half.
The weighted data does NOT change the sub-wave sequencing recommendation (all rules are equally
LOAD-BEARING), but it confirms that v1.5 + v3 together cover the larger share (57.7%):
command+script (v1.5) = 38.5%, manual (v3) = 19.2%.

## §4 Sub-wave scope recommendations

Rule-id lists are **verbatim-inheritable** by v1.5 and v3 kickoff authors.

### v1 — ESLint (11 rules, 42.3% of LOAD-BEARING)
Rules: `R2, R5, R6, R7, R8, R9, R12, R14, R15, R16, R20`

Notes:
- R8 needs `auto-skip-if-missing` handling (requires `@opentelemetry/api`).
- R12, R14, R20 have existing recipes + negative tests — v1 liveness gate can reuse them directly.
- R9 (`no-restricted-imports`): project-level config in `eslint.config.mjs`; v1 probe must
  read config rather than assert a fixed rule body.

### v1.5 — Command + Script (10 rules, 38.5% of LOAD-BEARING)
Rules: `R1, R3, R4, R11, R17, R19, IR1, IR2, IR3, IR4`

Notes:
- **R4** (`scripts/audit-r4.ts`): dangling path — v1.5 kickoff must resolve to
  `packages/core/probes/audit-r4.ts` (Finding 2a). Consumer-side: verify script is
  present at install-time path before running.
- **R17** (`scripts/audit-ai-docs.react-next.sh`): dangling path — v1.5 must resolve to
  `packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh` (Finding 2b).
  `auto-skip-if-missing` requires `storybook`.
- **IR3**: check.script is prose (Finding 2c) — v1.5 cannot auto-run this as a script.
  Recommend: treat IR3 as «manual-equivalent» in v1.5 liveness scope, or defer to a
  bespoke probe; do not attempt path resolution.
- **R1** (`tsc --noEmit && eslint <files>`): compound command; v1.5 gate must split and
  handle each sub-command independently.
- **R11**: CI-internal command (`audit-self.yml`); v1.5 liveness check is «does the workflow
  file exist and reference the required jobs» rather than running the CI locally.
- **IR1, IR2** (Pact, OpenAPI): CI-gated only — v1.5 liveness = «are the required CI jobs
  present in `.github/workflows/`» + `can-i-deploy` presence check.

**Skip/defer:** none — all 10 are LOAD-BEARING and addressable by v1.5 (with IR3 note above).

### v3 — Manual (5 rules, 19.2% of LOAD-BEARING)
Rules: `R10, R13, R18, IR5, IR6`

Notes:
- All 5 are manual by design; guard-liveness v3 (`guard-liveness-v3-manual-sp/`) should
  implement an AI-agnostic sub-agent probe (sidecar) rather than a deterministic check.
- **R10** (Naming): sidecar already referenced via
  `packages/core/templates/shared/skill-context/aif-rules-check/SKILL.md` — v3 can
  leverage existing skill-context rather than building a new probe.
- **R13** (Data fetching) and **R18** (TanStack Query): `auto-skip-if-missing` applies
  (`next` and `@tanstack/react-query` respectively) — v3 probe must respect this.
- **IR5, IR6**: integration-test / chaos-test verification only; v3 liveness = «does
  the repo have integration tests or chaos test configuration?» plus sidecar review.

**Skip/defer:** none — all 5 are LOAD-BEARING; v3 should address all.

## §5 Triggers (UNKNOWN-criticality rules)

**None.** All 26 rules classified as LOAD-BEARING with repo evidence per §1. T-V0-B
counter-check: 0 UNKNOWN < 3 threshold → audit complete, no re-probe required.

## §1.7 Self-review — Forward and Backward checks

**Forward-check:** this audit complies with:
- T10 (population enumeration before classification): manifest enumerated first, count
  confirmed at 26 before any row was classified (§1 opening assertion).
- T16 (classify by evidence, not name): each row cites file:line from RULES.md,
  integration-rules.md, or manifest field. T-V0-A applied — manual rules (R10, R13, R18,
  IR5, IR6) were read before classification; none marked DEPRECATED.
- §3 kickoff discipline: patch under `docs/meta-factory/research-patches/` (folder-level
  authority per doc-authority-hierarchy §5); `<!-- scope:guard-liveness-v0-audit -->` on
  first line (principle 10); BOTH «Forward» and «Backward» present (principle 13 arm f);
  no per-file Authoritative-for header; no SSOT row; no Prior-art trailer.

**Backward-check:** scope is bounded to single-umbrella research. No other artifact was
silently changed in this PR. Explicit drive-by bans observed:
- 3 dangling `check.script` paths recorded as findings only — not patched.
- No wave-sequencing-plan §0 candidate row added.
- No `negative-test` added to the manifest schema.
- No v1.5/v3 kickoff stale-ref patches applied.
- No new code, tests, or schema changes introduced.
