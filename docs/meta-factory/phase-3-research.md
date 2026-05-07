# Phase 3 — Step 0 retrospective research

> **Trigger:** [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) «Existing solutions research» retrofit applied to Phase 3 (monorepo split, completed 2026-05-08, commits `a46a8bf` + `962d557` + `3ad531f` merged via PR #2).
> **Method:** context7 MCP queries against `/websites/nx_dev`, `/websites/turborepo_dev`, `/pnpm/pnpm.io`, `/lerna/lerna`, `/changesets/changesets`. No git clones (per memory rule 2026-05-08).
> **Status:** transient artifact per §5.5 — ≤200 lines, may be archived once Phase 4-11 absorb forward implications.
> **Question answered:** what existed at the time of Phase 3 execution that we should have evaluated, and does the validated outcome warrant revert + redo?

---

## §1. Capabilities Phase 3 covered

Phase 3 split the repo from flat `scripts/`/`factory/`/`templates/` layout into 3-package monorepo (`packages/core`, `packages/preset-next-15-canonical`, `packages/meta-factory`) with these capabilities:

1. **Workspace declaration** — root `package.json` `"workspaces": ["packages/*"]`
2. **Cross-package linking** — `peerDependencies: {"@rules-as-tests/core": "*"}` in preset
3. **Build orchestration** — minimal: each package self-contained, no cross-package compile chain
4. **Cross-package test execution** — root `npm test --workspaces --if-present`
5. **Version management** — none (all packages at `0.1.0`, no publish workflow)

These match the 5 areas supplied by user. Per §5.5, each requires existing-solution evaluation.

---

## §2. Tools resolved (context7)

| Tool | Library ID | Benchmark |
|---|---|---|
| Nx | `/websites/nx_dev` | 86.87 |
| Turborepo | `/websites/turborepo_dev` | 85.55 |
| pnpm | `/pnpm/pnpm.io` | 84.6 |
| Lerna | `/lerna/lerna` | 46.5 |
| Changesets | `/changesets/changesets` | 94.65 |

---

## §3. Per-capability matrix

### 3.1 Workspace declaration

| Solution | Mechanism | Differentiator |
|---|---|---|
| npm workspaces | `"workspaces": ["packages/*"]` | hoisted node_modules, single lockfile |
| pnpm workspaces | `pnpm-workspace.yaml` + **`catalog:` protocol** (v9+) | centralized dep versions across packages |
| Yarn workspaces | similar `"workspaces"` field | n/a vs npm |

**Convergent baseline:** all three converge on `packages/*` glob + cross-package linking via package name. **Only pnpm** offers `catalog:` for de-duping shared dev-dep versions.

**State of dev-dep duplication 2026-05-08:** `vitest^4.1.5`, `typescript^5.6.0`, `@types/node^22.0.0`, `@typescript-eslint/utils^8.59.0`, `@typescript-eslint/rule-tester^8.59.0` — all duplicated across `packages/core` and `packages/preset-next-15-canonical`. 5 deps × 2 packages = real but bounded drift surface.

### 3.2 Cross-package linking

| Solution | Syntax | Strict at publish? |
|---|---|---|
| npm workspaces | `"@org/pkg": "*"` (peerDep or dep) | Loose — `*` allowed in published `package.json` |
| pnpm | `"@org/pkg": "workspace:*"` (or bare `"workspace:"` v10.29+) | Strict — refuses publish if not replaced with concrete version |

**Phase 3 chose:** `peerDependencies: {"@rules-as-tests/core": "*"}` in preset. Preset is consumed alongside core, not bundled — peer is correct dep type. In workspace, npm resolves `*` to local package; in published context, consumer must install core separately.

### 3.3 Build orchestration

| Solution | Mechanism | Pay-off threshold |
|---|---|---|
| Nx | `targets.build.dependsOn: ["^build"]` + content-hash caching + `nx affected -t build` | ≥5 packages OR cross-package compile chain OR ≥1 min builds |
| Turborepo | `tasks.build.dependsOn: ["^build"]` + caching + remote cache | same threshold |
| Lerna v6+ | wraps Nx task runner internally | inherits Nx pay-off |
| pnpm `-r` | `pnpm -r --topological run build` | no caching; topological order only |

**Convergent design Nx ↔ Turbo:** identical `dependsOn: ["^X"]` syntax (Turbo borrowed from Nx). Both add caching on top of basic recursive run.

**Verification:** 3 packages, no compile chain (preset re-exports core source TS via `eslint-rules/index.ts`, no transpile step). Total `npm test --workspaces` runtime ~2-3s per Phase 3 retro Block 3 numbers. CI bottleneck = lint/security scan, not test execution.

### 3.4 Cross-package test execution

| Solution | Filtered run | Affected detection |
|---|---|---|
| npm workspaces | `npm test --workspaces` (all) | none |
| pnpm | `pnpm -r --filter='./packages/*' test` | none built-in |
| Nx | `nx affected -t test` | git-diff-based affected graph |
| Turborepo | `turbo run test --filter=...` | task graph + cache |

**Pay-off threshold for affected/filter:** test runtime ≥30s in CI. Currently <3s. No threshold crossed.

### 3.5 Version management

| Solution | Model | Output |
|---|---|---|
| Lerna | Auto-detect changed packages → `lerna publish` | versions + tags + npm publish |
| Changesets | Per-PR `.changeset/<id>.md` intent files; `changeset version` consumes; `changeset publish` releases | declarative, PR-driven |

**Differentiators:**
- Changesets is **intent-declarative** — every PR explicitly states semver bump in `.changeset/*.md`. Aligns with our PR-driven workflow + audit-trail philosophy («logical self-application»: each rule change carries explicit changelog intent).
- Lerna v6+ pulls Nx transitively (per `/lerna/lerna` docs: «Lerna leverages Nx's task runner for enhanced performance»).
- `changesets/action@v1` GitHub Action pre-built; benchmark 94.65 dominates Lerna 46.5.

---

## §4. Reuse-vs-build decisions

| # | Capability | Decision | Rationale |
|---|---|---|---|
| 4.1 | Workspace declaration | **KEEP npm workspaces.** Track pnpm migration for Phase 9+ if dev-dep dup grows. | Catalog benefit triggers at ≥5 dev deps × ≥4 packages — currently borderline at 5×2. |
| 4.2 | Cross-package linking | **KEEP `peerDependencies: "*"`.** Migrate to `workspace:*` if/when pnpm. | Works in npm workspaces; strict-publish only matters at Phase 8+ npm publish. |
| 4.3 | Build orchestration | **DEFER (none).** Revisit when test runtime ≥30s OR cross-package compile chain emerges. | Nx/Turbo benefit thresholds far above current state. |
| 4.4 | Cross-package test execution | **KEEP `npm test --workspaces`.** | Affected/filter pay off at ≥30s runtime; current ~2-3s. |
| 4.5 | Version management | **ADD Changesets at Phase 8 (acceptance gate before publish) OR Phase 11 (AIF integration release coupling).** Out of current scope. | Required only before npm publish; PR-driven aligns with workflow; benchmark dominates Lerna. |

**Acceptance per §5.5:** ≥1 reuse decision required. Output: 4 KEEP/DEFER (validating Phase 3 choices) + 1 forward-ADD (Changesets) + 1 watch-list (pnpm catalog at scale). Reuse posture **mostly validates** Phase 3 ex-post; one forward-add explicit.

---

## §5. Verdict — keep merged Phase 3, or revert + redo?

**KEEP. Do NOT revert.**

Reasoning:
1. All 5 capabilities pass Step 0 reuse review at current scale. Nx/Turbo/Lerna/pnpm-catalog add complexity without current benefit.
2. The single capability gap (Changesets) is Phase 8-11 scope, not Phase 3. Phase 3 was split, not release.
3. Phase 3 + 3.1 closed all 6 MAJOR violations (retros/phase-3.md lines 244-285), principles 24/24 pass, hooks green, no circular deps. Reverting destroys validated SSOT enforcement.
4. Retroactive Step 0 result: validates Phase 3 choices ex-post — best possible outcome.

**Cost-benefit of revert + redo:**
- Cost: discard ≥40h junior effort, re-run 6 MAJOR-violation cleanup, re-validate principles + CI + hooks + snapshots.
- Benefit: zero — no capability change warranted at current scale.

---

## §6. Forward implications (watch-list)

| Item | Trigger | Owner |
|---|---|---|
| Add Changesets when entering Phase 8 (acceptance gate) | Phase 8 entry | Phase 8 prompt author |
| Re-evaluate pnpm catalog migration | N packages ≥5 OR shared dev-dep count ≥8 | Phase 9+ prompt author |
| Re-evaluate Nx/Turbo task runner | CI test runtime ≥30s OR cross-package compile chain emerges | continuous |
| `peerDeps: "*"` → `workspace:*` migration | only if/when adopting pnpm | tied to pnpm decision |

These are watch-list items, not commitments. Re-validate via context7 at each Phase entry per §5.5.
