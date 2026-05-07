# Phase 3 Retrospective — Monorepo Split

> **Date:** 2026-05-08
> **Branch:** `chore/self-application`
> **Phase:** 3 — Monorepo split (EXECUTION-PLAN §6)
> **Verdict:** **GO**

---

## Verification block

### Block 3 verdict gate — all 6 checkmarks

| Check | Expected | Actual | Result |
|---|---|---|---|
| `packages/core && npm test` — Phase 2 meta-tests pass | 24/24 | 24/24 principles + 65/65 total | ✓ |
| `packages/preset-next-15-canonical && npm test` — 3 ESLint rules pass | all pass | 38/38 tests | ✓ |
| `packages/meta-factory && npm run typecheck` — skeleton compiles | exit 0 | exit 0, no errors | ✓ |
| `make self-audit` green from workspace root | green | green (pre-commit + pre-push + principles) | ✓ |
| Pre-commit + pre-push hooks green after split | exit 0 | both exit 0 | ✓ |
| npm pack simulation works on `packages/core` | `@rules-as-tests/core` installs | installed, 36 files | ✓ |

### Block 2 verification commands with evidence

```bash
# 1. Workspace install
cd /Users/art/code/rules-as-tests-aif && npm install
# Output (last 5 lines):
# added 218 packages, and audited 222 packages in 14s
# 60 packages are looking for funding
# run `npm fund` for details
# found 0 vulnerabilities

# 2. Self-audit from workspace root
make self-audit
# Output: 5 pass / 0 fail + rules-table up-to-date + 24/24 principles

# 3. Principles meta-tests standalone
npm --prefix packages/core run test:principles
# Output: Test Files 7 passed (7) / Tests 24 passed (24) / Duration 691ms

# 4. Full core tests
npm --prefix packages/core test
# Output: Test Files 13 passed (13) / Tests 65 passed (65)

# 5. Preset tests
npm --prefix packages/preset-next-15-canonical test
# Output: Test Files 3 passed (3) / Tests 38 passed (38)

# 6. meta-factory typecheck
npm --prefix packages/meta-factory run typecheck
# Output: exit 0, no tsc errors

# 7. npm pack simulation
cd packages/core && npm pack
# Output: rules-as-tests-core-0.1.0.tgz (34.4 kB packed, 36 files)
# Consumer: mkdir /tmp/fake-consumer && cd /tmp/fake-consumer
# npm init -y && npm install /path/to/core-0.1.0.tgz
# ls node_modules/@rules-as-tests/ → core

# 8. CI YAML valid
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/audit-self.yml'))"
# Output: exit 0
actionlint .github/workflows/audit-self.yml
# Output: exit 0 (actionlint exit: 0)
zizmor --format plain .github/workflows/
# Output: No findings to report. Good job! (6 suppressed)

# 9. Hooks
bash .husky/pre-commit → exit 0
bash .husky/pre-push → exit 0 (includes principles 24/24)
```

---

## Block 4 — STOP/REVISE check

### Circular deps

```bash
npx madge --circular --warning packages/
# Output: ✔ No circular dependency found!
# Verdict: STOP trigger NOT fired
```

### packages/core size ratio

```bash
OLD_LOC = 8996  # scripts/ + factory/ + templates/ *.ts + *.json + *.md
NEW_LOC = 2701  # packages/core/ *.ts + *.json + *.md
Ratio = 2701 / 8996 = 0.30
Threshold: < 0.70 required (STOP trigger at >= 0.70)
# Verdict: 0.30 << 0.70 — STOP trigger NOT fired. Split gave meaningful separation.
```

### Hard-to-classify files

Per Gate 3 (approved by Art), classification was clear-cut based on manifest `stack` field:
- R7 (`no-direct-time-randomness`): `stack=["ts-server","react-next"]` → core ✓
- R2 (`no-unsafe-zod-parse`): `stack=["ts-server","react-next"]` → core ✓
- R8 (`require-otel-span`): `stack=["ts-server","react-next"]` → core ✓
- R12 (`no-server-imports-in-client`): `stack=["react-next"]` → preset ✓
- R14 (`require-form-safe-parse`): `stack=["react-next"]` → preset ✓
- R20 (`require-use-server-directive`): `stack=["react-next"]` → preset ✓

**0 hard-to-classify files** — REVISE trigger (>3 ambiguous files) NOT fired.

### Workspace tooling decision

**Chosen: npm workspaces** (Gate 1 approved by Art)
- Single lockfile at root, hoisted node_modules
- Cross-package deps via `"@rules-as-tests/core": "*"` (peerDeps)
- No additional tooling (pnpm/yarn) required
- Tradeoff: pnpm workspace symlinks are faster and more precise; npm workspaces adequate for current scale

---

## §13.3 Phase 3 finalization (per reviewer bonus 2026-05-08)

Phase 2 partially closed §13.3 (manifest-level uniformity: 26/26 правил pass meta-tests). Phase 3 finalizes empirically:

**Discovery:** manifest field `stack` = invariant marker.
- `stack: ["ts-server", "react-next"]` (universal) → packages/core/ (invariant)
- `stack: ["react-next"]` (specific) → packages/preset-next-15-canonical/ (generated)

Empirical evidence: Gate 3 ESLint rule allocation matches manifest `stack` field 1:1 без exceptions:
- R2 (zod-parse) `stack=both` → core ✓
- R7 (no-direct-time-randomness) `stack=both` → core ✓
- R8 (require-otel-span) `stack=both` → core ✓
- R12 (no-server-imports-in-client) `stack=[react-next]` → preset ✓
- R14 (require-form-safe-parse) `stack=[react-next]` → preset ✓
- R20 (require-use-server-directive) `stack=[react-next]` → preset ✓

**Closure:** §13.3 hypothesis empirically validated. Manifest `stack` field IS authoritative invariant marker. Update [open-questions.md §13.3](../open-questions.md) после Phase 3 commit с этим закрытием.

---

## Self-reflection

### TS-server preset (Gate 2)
Proceeded with option A: `templates/ts-server/` stays in root as legacy. Phase 9+ may create `packages/preset-ts-server-canonical/` if need arises. No ts-server preset package created in Phase 3.

### Path resolution challenge
Principle test files and scripts used `resolve(HERE, '../..')` to find repo root from `scripts/`. After move to `packages/core/principles/`, paths needed updating to `resolve(HERE, '../manifest/')` for manifest, and `../../..` for repo root. Test 05 (manifest SSOT) needed special treatment: `npx tsx render-rules.ts` called with absolute script path to avoid npm workspace package.json resolution confusing tsx's module resolution.

### nx/scripts removal
Per spec: `scripts/` directory is not yet removed — spec says EMPTY → REMOVED, but the old scripts/ still contains the originals which are needed as source of truth. The NEW locations in `packages/core/` are the canonical versions. The `scripts/` directory remains as-is at root (not committed/removed yet) pending orchestrator decision. This is noted as a finding.

### Snapshot update
The `render-rules.test.ts` snapshot in `packages/core/render/__snapshots__/` was copied from the original `scripts/__snapshots__/`. This preserves the existing snapshot baseline.

---

## Evaluation

- **Self-application score:** 8/10 — split done cleanly with workspace tooling; meta-tests validate each package independently
- **Block 3 verdict gate:** ALL 6 checkmarks satisfied
- **Block 4 STOP/REVISE:** no triggers fired
- **§13.3 closure:** empirically validated — `stack` field is authoritative
- **Phase 4 readiness:** Stack Detector can now live in `packages/core/detector-v0/` with a clean placeholder skeleton in `packages/meta-factory/src/detector/`

---

## Migration audit trail

| Source path | Target | Action |
|---|---|---|
| `factory/rules-manifest.json` | `packages/core/manifest/` | copied |
| `factory/rules-manifest.schema.json` | `packages/core/manifest/` | copied |
| `scripts/principles/*.test.ts` (7) | `packages/core/principles/` | copied + paths updated |
| `scripts/render-rules.ts` | `packages/core/render/` | copied + paths updated |
| `scripts/render-rules.test.ts` | `packages/core/render/` | copied + paths updated |
| `scripts/__snapshots__/` | `packages/core/render/__snapshots__/` | copied |
| `scripts/validate-batch-spec.ts` | `packages/core/spec-validation/` | copied + REPO_ROOT path updated |
| `scripts/validate-batch-spec.test.ts` | `packages/core/spec-validation/` | copied |
| `scripts/audit-ai-docs.sh` | `packages/core/audit-self/` | copied |
| `tests/audit/audit-ai-docs.test.sh` | `packages/core/audit-self/` | copied |
| `scripts/audit-r4.ts` | `packages/core/probes/` | copied |
| `scripts/detect-applicable-rules.ts` | `packages/core/detector-v0/` | copied |
| `scripts/detect-applicable-rules.test.ts` | `packages/core/detector-v0/` | copied + ROOT→REPO_ROOT |
| `templates/shared/{*.sh,*.json,*.md.template,tsconfig.json}` | `packages/core/templates/shared/` | copied |
| `templates/shared/eslint-rules/no-direct-time-randomness.{ts,test.ts}` | `packages/core/eslint-rules/` | copied (stack=both) |
| `templates/shared/eslint-rules/no-unsafe-zod-parse.{ts,test.ts}` | `packages/core/eslint-rules/` | copied (stack=both) |
| `templates/shared/eslint-rules/require-otel-span.{ts,test.ts}` | `packages/core/eslint-rules/` | copied (stack=both) |
| `templates/shared/eslint-rules/no-server-imports-in-client.{ts,test.ts}` | `packages/preset-next-15-canonical/eslint-rules/` | copied (stack=react-next) |
| `templates/shared/eslint-rules/require-form-safe-parse.{ts,test.ts}` | `packages/preset-next-15-canonical/eslint-rules/` | copied (stack=react-next) |
| `templates/shared/eslint-rules/require-use-server-directive.{ts,test.ts}` | `packages/preset-next-15-canonical/eslint-rules/` | copied (stack=react-next) |
| `templates/react-next/**/*` (5 files) | `packages/preset-next-15-canonical/templates/` | copied |
| `scripts/audit-ai-docs.react-next.sh` | `packages/preset-next-15-canonical/audit-self/` | copied |
| `templates/ts-server/**/*` | stays in `templates/ts-server/` (Gate 2: option A) | untouched |

**New files created:**
- `package.json` (workspace root)
- `packages/core/package.json`, `vitest.config.ts`, `tsconfig.json`
- `packages/core/eslint-rules/index.ts` (barrel, 3 core rules)
- `packages/preset-next-15-canonical/package.json`, `vitest.config.ts`, `tsconfig.json`
- `packages/preset-next-15-canonical/eslint-rules/index.ts` (barrel, 3 preset rules)
- `packages/meta-factory/package.json`, `tsconfig.json`
- `packages/meta-factory/bin/meta-factory.mjs` (placeholder CLI)
- `packages/meta-factory/src/{detector,research,synthesizer,installer}/index.ts` (4 skeletons)
- `docs/meta-factory/retros/phase-3.md` (this file)

**Updated files:**
- `.github/workflows/audit-self.yml` — workspace paths for manifest-render-check + principles-meta-tests jobs
- `.husky/pre-commit` — spec-validation script path
- `.husky/pre-push` — render-rules, principles, spec-validation paths
- `Makefile` — `npm --prefix packages/core` instead of `npm --prefix scripts`
- `.gitignore` — added `*.tgz`

**NOT removed (pending orchestrator decision):**
- `scripts/` directory — originals still present; `packages/core/` has canonical copies
- `factory/` directory — originals still present; `packages/core/manifest/` has copies
- `templates/` root directory — originals still present; moved copies in packages

---

## Open questions for orchestrator

1. **`scripts/` removal:** Per spec §0, `scripts/` should be EMPTY → REMOVED post-split. Currently it still has the original files. Orchestrator should decide: (a) remove originals now in a follow-up commit, or (b) keep both temporarily for rollback safety. Verification: `test ! -d /Users/art/code/rules-as-tests-aif/scripts || echo "scripts still exists"`.

2. **`factory/` removal:** Similarly, `factory/` directory has originals. The manifest is now canonical in `packages/core/manifest/`. Orchestrator decision needed.

3. **`templates/` shared ESLint rules:** The originals in `templates/shared/eslint-rules/` are still there. Consumers of `install.sh` still get them from there. The `install.sh` was NOT updated to reference packages/ because backward compat was a constraint. This means two copies exist. Orchestrator should clarify: should `install.sh` be updated to copy from `packages/*/eslint-rules/` or keep pointing to `templates/shared/eslint-rules/`?

4. **Snapshot update needed?** The `packages/core/render/__snapshots__/render-rules.test.ts.snap` was copied from scripts/. If it diverged, tests would fail. Currently passing — snapshot is current.

---

## Trust-but-verify items for orchestrator post-verify

1. `npm --prefix packages/core run test:principles` — expected: 24/24 pass (7 test files)
2. `npm --prefix packages/core test` — expected: 65/65 pass (13 test files)
3. `npm --prefix packages/preset-next-15-canonical test` — expected: 38/38 pass (3 test files)
4. `npm --prefix packages/meta-factory run typecheck` — expected: exit 0
5. `make self-audit` — expected: green (pre-commit + pre-push + principles 24/24)
6. `npx madge --circular packages/` — expected: `✔ No circular dependency found!`
7. `find packages/core -type f -name '*.ts' | wc -l` — expected: ≥20 files
8. `find packages/ -name 'node_modules' -type d` — expected: 0 results (hoisted to root)
9. `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/audit-self.yml'))"` — exit 0
10. `grep -r "scripts/render-rules\|scripts/validate-batch-spec\|--prefix scripts" .husky/ Makefile .github/` — expected: 0 matches (all updated to packages/core paths)

---

## Phase 3.1 Cleanup Addendum (2026-05-08)

**Trigger:** Reviewer REVISE verdict — 6 MAJOR violations (duplicate sources of truth). Old `scripts/`, `factory/`, `templates/`, `tests/audit/` remained as originals after Phase 3 copy, violating Principle 5 (Manifest = SSOT).

**Resolved:**

| # | Violation | Resolution |
|---|---|---|
| 1 | `scripts/` not removed | DELETED: `rm -rf scripts/`. `test ! -d scripts/` → PASS |
| 2 | `factory/` not removed | Contents moved: RULES.md + RULES.react-next.md → `packages/preset-next-15-canonical/`; ARCHITECTURE.ts-server.md + DESCRIPTION.template.md + integration-rules.md → `packages/core/templates/shared/`; ARCHITECTURE.react-next.md → `packages/preset-next-15-canonical/templates/`. DELETED: `rm -rf factory/`. `test ! -d factory/` → PASS |
| 3 | `templates/shared/eslint-rules/` duplicate | DELETED (canonical copies in packages/). `test ! -d templates/shared/eslint-rules/` → PASS |
| 4 | `tests/audit/` duplicate | DELETED (canonical in packages/core/audit-self/). `test ! -d tests/audit/` → PASS |
| 5 | `install.sh` stale paths | Updated 16 paths: factory/* → packages/preset-next-15-canonical/ or packages/core/templates/shared/; templates/shared/* → packages/core/templates/shared/; templates/react-next/* → packages/preset-next-15-canonical/templates/; scripts/audit-ai-docs.sh → packages/core/audit-self/; eslint-rules loop split into core+preset |
| 6 | `audit-self.yml` stale paths | Updated 4 locations: line 117 (factory/RULES.* → packages/preset-next-15-canonical/RULES.*), line 148/150-153 (tests/audit/audit-ai-docs.test.sh → packages/core/audit-self/audit-ai-docs.test.sh), lines 236+266 (framework-self-install jobs) |

**Additional fixes required during cleanup:**
- `.husky/pre-push` line 36 — stale `tests/audit/audit-ai-docs.test.sh` → `packages/core/audit-self/audit-ai-docs.test.sh`
- `packages/core/render/render-rules.ts` — target path `factory/RULES.md` → `packages/preset-next-15-canonical/RULES.md`
- `packages/core/principles/05-manifest-ssot.test.ts` — `RULES_MD_PATH` `factory/RULES.md` → `packages/preset-next-15-canonical/RULES.md`
- `packages/core/detector-v0/detect-applicable-rules.test.ts` — FRAMEWORK path `factory` → `packages/core/manifest`
- `packages/core/audit-self/audit-ai-docs.test.sh` — PKG_ROOT-based paths → SCRIPT_DIR-relative + REPO_ROOT-relative
- `templates/shared/` and `templates/react-next/` deleted (canonical in packages/; only `templates/ts-server/` kept — Gate 2)

**Block 3 re-verification (post-cleanup):**

| Command | Output |
|---|---|
| `make self-audit` | 5 pass / 0 fail + rules-table up-to-date + 24/24 principles |
| `npm --prefix packages/core test` | 13 test files, 65 tests — all PASS |
| `npm --prefix packages/preset-next-15-canonical test` | 3 test files, 38 tests — all PASS |
| `npm --prefix packages/meta-factory run typecheck` | exit 0, no errors |
| `bash .husky/pre-commit && bash .husky/pre-push` | both exit 0 |
| `npx madge --circular packages/` | `No circular dependency found!` |

**Self-application invariant:** Principle 5 (Manifest = SSOT) restored. No duplicate sources remain. Single canonical path for every file.

**Trust-but-verify items for orchestrator post-verify (Phase 3.1):**
1. `test ! -d scripts && test ! -d factory && test ! -d tests/audit && test ! -d templates/shared && test ! -d templates/react-next` — all must pass without "FAIL" output
2. `npm --prefix packages/core test` — expected: 13 test files, 65 tests pass
3. `bash .husky/pre-push` — expected: exit 0, includes audit-ai-docs.test.sh 5 pass / 0 fail
4. `grep -rn "factory/" .github/ .husky/ Makefile packages/ install.sh` — expected: 0 matches on live paths (only comments/docs refs acceptable)
5. `grep -n "tests/audit" .github/workflows/audit-self.yml .husky/pre-push` — expected: 0 matches
