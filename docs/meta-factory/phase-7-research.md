# Phase 7 — Step 0 entry research (Layer 4 Validator + Layer 5 Installer)

> **Trigger:** [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) — Phase 7 entry gate.
> **Date:** 2026-05-08.
> **Method:** context7 MCP queries — ESLint `/eslint/eslint` (RuleTester programmatic API + flat config composition), Ajv `/ajv-validator/ajv` (8.x schema validation patterns); informational-only Stryker reference (Phase 9+ trigger). Carried forward: Phase 5/6 context7 results for typescript-eslint, AI Factory.
> **Status:** transient artifact per §5.5 — ≤200 lines; archived after Phase 7 closes.
> **Question answered:** which L4 gates ship in v1 vs deferred, and what is the L5 v1 deliverable shape (consumer disk write extending framework-self-install pattern)?

---

## §1. Capabilities Phase 7 will cover

Per [architecture.md §2.6 + §2.7](architecture.md):

**L4 Validator** — invariant gates against `SynthesisPlan` (Layer 3 output); fail-fast: any gate red ⇒ rule does not reach disk.

**L5 Installer** — write only validated rules to consumer disk; emit `rules-lock.json`; re-run L4 against installed plan (final meta-check per architecture intent #5).

**Self-application** — own repo synth → validate → install on tmp consumer; snapshot stable. CI parity: 2 new jobs `framework-self-validate` + `framework-self-install-validated`.

**Architectural pivot continuity:** deterministic v1 (NO LLM). LLM-driven `review-sidecar` mapping documented but not implemented (gate 5 deferred to Phase 8).

---

## §2. L4 — 6-gate triage (final v1 lock)

| # | Gate | v1 status | Reuse / build | Source |
|---|---|---|---|---|
| 1 | Schema check | **REQUIRED** | Reuse — Ajv pattern from `synthesizer/synthesize.ts:25-28` + `research/load.ts:21-26`; standalone validator wraps `synthesis-plan.schema.json` | architecture.md §2.6 |
| 2 | rule-tester roundtrip | **REQUIRED** | Reuse — `@typescript-eslint/rule-tester` boilerplate from `eslint-rules/require-otel-span.test.ts:1-8`. Built-ins via ESLint `Linter` API; plugin rules via dynamic import from preset workspace. Skip `check.type ∈ {manual,command,script}` | architecture.md §2.6 + Phase 6 retro |
| 3 | Mutation testing | **SKIP v1** | Path B (AST gen) only — Phase 9+ trigger | EXECUTION-PLAN §5 |
| 4 | Tautology check | **REQUIRED** (build) | New — fixed negative-corpus (`empty.ts`, `comment-only.ts`, `unrelated.tsx`); per-rule run via Linter expects 0 violations | architecture.md §2.6 + principles 04 |
| 5 | Two-AI review | **DEFER v1** | Maps to AIF `review-sidecar` (`model: opus`); cost model unresolved; documented as advisory non-blocking gate for Phase 8 | aif-comparison.md §4, EXECUTION-PLAN §5 |
| 6 | Cross-rule conflict | **REQUIRED** (build) | New — read 3 preset rules + synthesized rules; detect same `check.rule` on overlapping `applies-to` glob; B1 fix replaces `Object.assign` with semantic merge in `synthesize.ts:63` | architecture.md §2.6 + post-merge audit B1 |

**v1 delivers gates 1, 2, 4, 6 as REQUIRED.** Gate 3 = SKIP (Path B only). Gate 5 = DEFER (cost-scope decision Phase 8).

---

## §3. L5 v1 scope (architecture.md §2.7 mapping)

| Architecture intent item | v1 status | Rationale |
|---|---|---|
| 1. Write only validated rules | **YES** | `install()` requires `ValidationReport.ok === true` (gate aggregator from Task 6) |
| 2. Generate RULES.md, eslint.config, audit-ai-docs.sh, GHA workflow | **PARTIAL** | Delegate to existing `emit()`: 3 artifacts (`rules-manifest-additions.json`, `RULES-additions.md`, `eslint-rules-snippet.json`). **DEFER** audit-ai-docs.sh + GHA workflow generation — `install.sh` already does this in Phase 1; L5 v1 = additions layer over install.sh basis |
| 3. `rules-lock.json` | **YES** | New artifact — `{ schemaVersion, framework, version, ruleIds[], emittedAt, sourceFingerprint }` |
| 4. npm deps / husky / scripts install | **DEFER** | `install.sh` already handles; v1 = artifact write only |
| 5. Re-run L4 post-install | **YES** | Final meta-check; loads written manifest-additions, re-validates SynthesisPlan, asserts ok |

L5 v1 = **artifact write + lock + post-install validation**. v2 trigger = first real consumer ships (full install workflow).

---

## §4. Reuse posture (proves no scope creep)

| # | Decision | Existing infra | Phase 7 use |
|---|---|---|---|
| 7.1 | Schema gate uses already-built Ajv compile | `synthesizer/synthesize.ts:25-28` validates `SynthesisPlan` end-of-pipeline. L4 standalone gate 1 reuses same schema, runs ahead of consumer. | Reuse |
| 7.2 | Rule-tester gate uses `@typescript-eslint/rule-tester` already in workspace | `packages/core/eslint-rules/*.test.ts` + 3 preset rules — uniform boilerplate per `require-otel-span.test.ts:1-8` | Reuse |
| 7.3 | Recipe schema mirrors `Recipe` TS interface | `synthesize.ts:17-23` — local interface. Phase 7 promotes to JSON Schema (M3 fix). | Build (small) |
| 7.4 | Conflict detector reads existing 3 preset rules | `packages/preset-next-15-canonical/eslint-rules/{no-server-imports-in-client,require-form-safe-parse,require-use-server-directive}.ts` | Read-only |
| 7.5 | Installer extends framework-self-install pattern | `audit-self.yml:211-280` jobs `framework-self-install-{ts-server,react-next}` use `mkdir -p /tmp/fake-consumer-X && git init && bash install.sh` | Mirror for `framework-self-install-validated` |
| 7.6 | Validator + installer mirror L1/L2/L3 module location | `packages/core/{detector,research,synthesizer}/` | New `packages/core/{validator,installer}/` |
| 7.7 | Validate-research-plan reuses `validateEntry` factory | `research/load.ts:24` (local const, not exported) — extract shared `getValidateEntry()` to `research/internal-validators.ts`; both `load.ts` + new `validate-plan.ts` use it (DRY) | Build (small refactor) |
| 7.8 | No new explicit deps | ESLint Linter API + RuleTester reachable via existing transitives (verified: `@typescript-eslint/rule-tester` in lockfile, `eslint` transitive via preset) | Verify in Task 3a |

---

## §5. Open-question routing (post-merge audit findings, PR #5)

Internal review (substitute for unavailable `/ultrareview`) flagged 2 BLOCKER + 3 MAJOR, all routed into Phase 7 deliverables:

| ID | Finding | Closes via |
|---|---|---|
| B1 | `Object.assign` silently drops duplicate ESLint rule keys across recipes | Task 5 — `mergeEslintRuleConfig()` semantic merger + gate 6 conflict detector |
| B2 | `--from-research` loads JSON without schema validation | Task 2 — new `research/validate-plan.ts` exported, called from `synthesizer/cli.ts:43` |
| M1 | `SynthesizedRule` has no `negative-test` field; gate 2 cannot run without it | Task 1 — add `negative-test` field per architecture.md:112-115 (kebab-case key, `expect-violation` references rule name string) |
| M2 | Principle meta-tests don't cover synthesized rules | Task 7 — extend P1 (`01-executable-check`) + P2 (`02-paired-negative-test`) to load `expected-fixture-synth.json` |
| M3 | Recipe loader has no schema validation | Task 1 — `recipe.schema.json` + Ajv validation in `loadRecipe()` |
| m1 | `drift.ts:79` same-line modal attribution trade-off | Task 12 — update [open-questions.md](open-questions.md) §13.7: symbolic v1 closed, behavioral v2 open |
| m4 | `framework-self-synth` job has no `needs:` dep on core-tests | Task 10 — CI causality fix |
| m2 | `fetchedAt` no `format: date` constraint | DEFER v2 (LLM-generated entries) |
| m3 | `appliesTo` exact-string match | Task 1 authoring note in recipe schema description |

---

## §6. Hard constraints (Phase 7 inheritance)

- **NO LLM** — gate 5 mapping documented, not implemented
- **NO new explicit deps** — all transitive (verify Task 3a)
- **NO yargs/commander** — `process.argv` parsing per existing CLIs
- **NO recipe expansion** — 3 recipes stay; R12/R14/R20 trigger Phase 8
- **NO `--no-verify` / force push**
- **NO Path B AST gen** — Phase 9+
- **Atomic commits, Conventional Commits, English subjects**
- **Planner-Executor module surface** on each layer:
  - L4: `validate(plan: SynthesisPlan): ValidationReport` (pure)
  - L5: `install(plan, opts): InstallReport` (side-effect; calls validate twice — pre-write + post-write meta-check)

---

## §7. Acceptance criteria (Phase 7 GO)

- `make self-audit` 24/24 green
- `npm test --workspace=@rules-as-tests/core` ≥200 tests green (167 baseline + ~30 validator + ~10 installer + ~3 principle ext)
- `npm test --workspace=@rules-as-tests/preset-next-15-canonical` 38/38 (unchanged)
- `npm run typecheck --workspaces` clean
- All 4 L4 REQUIRED gates green on next-16 fixture; `manual` rule marked `n/a` in gate 2
- L4 reject scenarios: malformed plan / tautology rule / collision — each fails with explicit gate+reason
- L5 install on tmp consumer: artifacts + `rules-lock.json` + post-install validate green
- 2 new CI jobs (`framework-self-validate`, `framework-self-install-validated`) green
- Snapshots stable: own repo + next-16 fixture × {validate, install}
- B1, B2, M1-M3, m1, m4 closed; m2-m3 deferred with rationale

---

## §8. Versioning

- **2026-05-08** — initial draft, Phase 7 entry. Combined L4+L5 single-session burn mode (Opus 4.7), mirroring Phase 5+6 compression.
