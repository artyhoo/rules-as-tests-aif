> **Authoritative for:** S1 `setup.d/` layer registry — layer list, execution order, `lib.sh` public API, stub markers. Input spec consumed by S2/S3/S4 of the `modular-install-fullpack` umbrella.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../README.md#why-this-exists). S1 implementation details — see `.ai-factory/plans/feature-modular-install-fullpack-217bcf.md`.

# setup.d Layer Registry — S1 Output

This file is the S1 predecessor-output that S2/S3/S4 consume, parallel to how S1 consumed `kickoff-s0.md`. Created by S1 (`mif-s1-lib-and-layers`). Update when layers change.

## Layer list (execution order)

Layers are sourced in lexicographic order by `install.sh`. Binding constraints: 40 before 60 (R2-L1 reads eslint.config.mjs shipped in 40); 70 before 99-finalize (R2-L2 needs ts-morph installed in 70); 99 last (ignore_shipped_configs reads complete SKIPPED).

| # | File | Purpose | Depends on | Status |
|---|---|---|---|---|
| 05 | `05-mcp.sh` | MCP configuration (`.mcp.json` + stack MCPs) | entry | **STUB — S2 populates** |
| 10 | `10-skills.sh` | Copy rules-as-tests + tool-bootstrapping skills + orchestration skills (pipeline/dispatcher/aif-doctor/template-audit) → `.claude/skills/` | lib | live |
| 15 | `15-companions-stack.sh` | Stack-aware companion installs (tool-bootstrapping revival, deps-hash cycle) | entry | **STUB — S3 populates** |
| 20 | `20-agents.sh` | Copy agents → `.claude/agents/`; copy skill-context overrides (derived from SHIPPED_DOCS) | lib, SHIPPED_DOCS (entry) | live |
| 30 | `30-templates.sh` | Copy `.ai-factory/` templates (DESCRIPTION, ARCHITECTURE, RULES, integration-rules, tool-decisions.md seed, react-next templates); deploy AGENTS.md | lib | live |
| 40 | `40-configs.sh` | Copy scripts → `scripts/`; shared configs (.nvmrc, .lintstagedrc, .prettierignore merge, tsconfig, .prettierrc); custom ESLint rules + barrel-gen; stack configs (eslint.config.mjs, vitest.config, stryker + patch — **NOT** workflow copies) | lib | live |
| 50 | `50-hooks.sh` | CC hook (`deps-hash-check.sh` + `settings.json` registration); `.husky/` cluster + TS-core hooks + `core.hooksPath` activation | lib | live |
| 60 | `60-ci.sh` | `.github/workflows/` mkdir + workflow copies (ci.yml, workflow-integrity.yml); .nvmrc↔CI drift WARN; R2 auto-wire Layer 1 (sets `_r2_verdict`); CI-orphan WARN + yq auto-wire | lib, 40-configs | live |
| 70 | `70-deps.sh` | package.json scripts merge + hook devDeps; dev-dep install (prompt/`--full`); tsx-at-root probe+install (sets `DEPS_INSTALLED`, `DEVDEPS`) | lib | live |
| 99 | `99-finalize.sh` | R2 Layer-2 AST-wire (ts-morph, reads `_r2_verdict`); V2 otel-arming WARN; `ignore_shipped_configs` CALL (reads complete `SKIPPED`); Done/summary/Next-steps (reads `DEPS_INSTALLED`, `DEVDEPS`) | lib, 60 (`_r2_verdict`), 70 (`DEPS_INSTALLED`, `DEVDEPS`) | live |

### Stubs awaiting later stages

| Layer | Owning stage | Source in original repo |
|---|---|---|
| `05-mcp.sh` | **S2** | Net-new (no install.sh source). Prior art: legacy `setup.sh:289-307` context7 `.mcp.json` jq-merge. Runs EARLY (before 70-deps). |
| `15-companions-stack.sh` | **S3** | Sourced from `setup` wrapper + `setup.d/engine.sh` + `setup.d/companions.manifest`, extended with a stack column. Tool-bootstrap revival (deps-hash cycle) is the S3 concern. |

---

## `lib.sh` public API

All helpers are sourced verbatim from `install.sh` (S1 refactor — no logic changes). Use by sourcing:
```bash
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
```

In tests (lib-only mode, no side effects):
```bash
INSTALL_SH_LIB_ONLY=1 source "setup.d/lib.sh"
```

### Constants (defined in lib.sh)

| Name | Description |
|---|---|
| `UPSTREAM_BLOB_URL` | GitHub blob URL prefix for `transform_internal_refs`. Override via env var when forking. |
| `PRETTIERIGNORE_BEGIN` / `PRETTIERIGNORE_END` | Markers for the AIF-managed `.prettierignore` block (used by `merge_prettierignore`). |
| `PRETTIERIGNORE_CFG_BEGIN` / `PRETTIERIGNORE_CFG_END` | Markers for the shipped-configs ignore block (used by `ignore_shipped_configs`). |

### Helper functions

| Function | Signature | Description |
|---|---|---|
| `transform_internal_refs` | `(file)` | Rewrites repo-internal markdown links to `$UPSTREAM_BLOB_URL` paths in-place. |
| `copy_safe` | `(src dst)` | Copies src→dst; skips if dst exists (unless `--force`); appends to `SKIPPED`; respects `--dry-run`. |
| `refresh_safe` | `(src dst)` | Inverted: overwrites dst UNLESS a sibling `<dst%.md>.override.md` signals consumer ownership; respects `--dry-run`. |
| `merge_prettierignore` | `(src dst)` | Non-destructive `.prettierignore` merge: copies if dst absent (greenfield); appends AIF block if block not already present; respects `--force` / `--dry-run`. |
| `_prettierignore_in_skipped` | `(needle)` | Returns 0 if `needle` is in `SKIPPED` array (bash-3.2-safe empty-array guard). |
| `ignore_shipped_configs` | `()` | Appends freshly-shipped framework config paths to `.prettierignore` (only configs NOT in `SKIPPED`). Call AFTER all `copy_safe` calls (finalize tail). |
| `mkdir_safe` | `(dir)` | `mkdir -p` respecting `--dry-run`. |
| `chmod_safe` | `(mode... files)` | `chmod` respecting `--dry-run`. |
| `detect_pm` | `()` | Detects consumer PM from corepack/workspace/lockfile signals. Echoes `npm` | `pnpm` | `yarn`. SSOT — shared by `patch_stryker_package_manager` and 70-deps §8. |
| `patch_stryker_package_manager` | `()` | Patches `stryker.config.json`'s `packageManager` value to match `detect_pm()` output. Respects `--dry-run`, no-node. |
| `copy_skill_with_transform` | `(slug)` | Copies `.claude/skills/<slug>/` to consumer + rewrites repo-internal markdown cross-refs via `transform_internal_refs`. Respects `--force` / `--dry-run`. |
| `refresh_skill_with_transform` | `(slug)` | Like `copy_skill_with_transform` but with refresh_safe semantics (override signal = `<dst>.override.md`). |

### Globals consumed by helpers (declared in dispatcher `install.sh`)

Helpers read these globals from dispatcher scope. lib.sh does NOT declare them.

| Global | Set where | Read by |
|---|---|---|
| `PKG_ROOT` | dispatcher (`install.sh`) | all helpers that reference `$PKG_ROOT/...` source paths |
| `PROJECT_ROOT` | dispatcher (`install.sh`) | all helpers that write to the consumer tree |
| `FORCE` | dispatcher flag-parse | `copy_safe`, `merge_prettierignore`, `copy_skill_with_transform` |
| `DRY_RUN` | dispatcher flag-parse | all helpers |
| `SKIPPED` | dispatcher (`SKIPPED=()`) | `copy_safe`, `copy_skill_with_transform` (append); `_prettierignore_in_skipped`, `ignore_shipped_configs` (read) |

---

## Shared globals set by layers (read by later layers / finalize)

These are set by live layers and read by downstream layers in the same dispatcher shell (sourced, not subshelled — O2).

| Global | Set by | Read by | Notes |
|---|---|---|---|
| `_r2_verdict` | `60-ci.sh` (§6b-bis R2 L1) | `99-finalize.sh` (§6b-bis-L2 R2 L2) | `boundary-present` / `no-boundary-confident` / other |
| `DEPS_INSTALLED` | `70-deps.sh` (§8) | `99-finalize.sh` (Done/Next-steps) | `"1"` if deps were installed, else `""` |
| `DEVDEPS` | `70-deps.sh` (§8) | `99-finalize.sh` (Done/Next-steps) | bash array of installed dev-dep package names |
| `SHIPPED_DOCS` | dispatcher (`install.sh`) | `20-agents.sh` (§3c skill-context loop) | declared before layer loop; array of shipped doc paths |

---

## Parked forks (S1 — operator decisions pending)

These three forks have no determinate best answer on the project's merits. Surfaced per §4c park-don't-guess contract:

1. **Dispatcher style** (fork #2): Provisional glob loop `for _layer in "$PKG_ROOT/setup.d/"[0-9]*.sh; do source "$_layer"; done` used. Alternative: explicit ordered call-list (visible deps). Operator decides.
2. **Rollback depth** (fork #3): No undo-stack added (current behavior preserved — same as original install.sh). Alternative: `trap ERR` + LIFO per-layer undo. Note: adding a rollback stack WOULD change behavior and would violate the byte-identical constraint for S1. Must land as a new feature, not a refactor step.
3. **O4 — `do_refresh()` duplication**: Kept as-is in dispatcher. Alternative: refactor layers to accept `MODE` arg (`copy`|`refresh`) so dispatcher iterates twice. Operator decides — taste/strategy.

---

## Shellcheck compliance note

Task 14 calls for `shellcheck setup.d/*.sh install.sh` clean with a pinned version. Shellcheck was not available in the S1 implementation environment. Add a CI step pinned to the version present in the CI runner (e.g. the Ubuntu runner's `shellcheck --version`) when wiring the shellcheck gate. The layer files follow bash 3.2 conventions and should be clean under shellcheck with appropriate SC2034/SC2154 directives for globals injected from dispatcher scope.
