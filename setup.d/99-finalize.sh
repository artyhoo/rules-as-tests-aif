#!/usr/bin/env bash
# setup.d/99-finalize.sh — synth-wire + R2 AST-wire + V2 otel WARN + ignore_shipped_configs + Done.
#
# Sources: lib.sh (already in dispatcher scope)
# S0 rows: R2-L2 (install.sh:1597-1641), otel (install.sh:1643-1657),
#          ignore_shipped_configs CALL (install.sh:1659-1661), Done (install.sh:1663-1705)
# Depends on: 70-deps (ts-morph installed; DEPS_INSTALLED + DEVDEPS set),
#             60-ci (_r2_verdict set), ALL prior layers (SKIPPED fully accumulated)
# @cc-only-rationale: sourced by install.sh dispatcher, not standalone
# O3: HIGHEST-RISK ordering item — must run AFTER 70-deps (ts-morph) and LAST (SKIPPED complete)
# O2: reads _r2_verdict (from 60-ci) + DEPS_INSTALLED + DEVDEPS (from 70-deps)

# ─── synth-wire: deterministic synthesizer → root eslint.config.mjs ─────────────
# Runs synthesize() for the detected stack and AST-merges emitted rules-as-tests rules
# (R12/R14/R20 for react-next) into the consumer's root eslint.config.mjs.  Idempotent:
# the preset template already hand-inlines these rules (principle 26 guarantees sync),
# so this is a fast string-check no-op for a freshly-installed consumer.  Its value is
# architectural: the synthesizer is now the declared source of truth; future recipe
# additions will wire into the config without template edits.
#
# Runs regardless of _r2_verdict (R12/R14/R20 are not boundary-gated like R2) and
# honours --dry-run (writes nothing, prints what would change).
# rc=0 on every branch — install must not abort on wirer failure.
if command -v node >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/eslint.config.mjs" ]; then
  _synth_wirer="$PKG_ROOT/packages/core/install/synth-and-wire.bundle.mjs"
  if [ ! -f "$_synth_wirer" ]; then
    echo "  · synth-and-wire: bundle not found at $_synth_wirer — skipped"
  else
    echo "▶ synth-wire: confirming synthesized rules-as-tests slice in eslint.config.mjs"
    # Run from PROJECT_ROOT so ts-morph resolves from consumer node_modules.
    # AIF_SYNTH_PKG_ROOT anchors the bundle's fs-based recipe + schema reads to the
    # correct framework payload dir (packages/core/) — import.meta.url collapses to
    # install/ under bundling (zero-dep Path-3, #755); env var is the load-bearing bridge.
    ( cd "$PROJECT_ROOT" && AIF_SYNTH_PKG_ROOT="$PKG_ROOT/packages/core" \
        node "$_synth_wirer" \
          --stack "${STACK:-ts-server}" \
          --path "$PROJECT_ROOT/eslint.config.mjs" \
          ${DRY_RUN:+--dry-run} 2>&1 ) || true
  fi
fi

# ─── 6b-bis-L2. GH #547 Layer 2: AST-wire R2 into consumer per-package configs ─
# Runs AFTER §8 dep-install so ts-morph is resolvable when --full is set.
# Option A (migration-ast Stage 4): gated on --full; ensure-then-use; degrade
# when engine absent. rc=0 on every branch (lesson GH #531/#544).
# Layer 1 (§6b-bis above) patches OUR eslint.config.mjs; this Layer 2 patches
# CONSUMER per-package eslint.config.mjs files that re-export a base lacking R2.
if [ "${_r2_verdict:-}" = "boundary-present" ] && [ "$DRY_RUN" != "--dry-run" ] \
   && [ -f "$PROJECT_ROOT/eslint.config.mjs" ]; then
  _l2_degrade() {
    echo "  · R2 not auto-wired: AST editor unavailable (Node or ts-morph not present)."
    echo "    Add to <pkg>/eslint.config.mjs:"
    echo "      export default [...base, { rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }];"
    echo "    (or run ./install.sh ts-server --full to install dev-deps and auto-wire)"
  }
  if ! command -v node >/dev/null 2>&1; then
    _l2_degrade
  elif [ ! -f "$PROJECT_ROOT/node_modules/ts-morph/package.json" ]; then
    _l2_degrade
  else
    _wirer="$PKG_ROOT/packages/core/install/wire-eslint-r2.ts"
    if [ ! -f "$_wirer" ]; then
      echo "  · R2 Layer-2 wirer not found at $_wirer — skipped"
    else
      # Find per-package eslint.config.mjs files (not the root one, not node_modules)
      _l2_configs=()
      while IFS= read -r -d '' _cfg; do
        _l2_configs+=("$_cfg")
      done < <(find "$PROJECT_ROOT" \
        -name 'eslint.config.mjs' \
        ! -path "$PROJECT_ROOT/eslint.config.mjs" \
        ! -path '*/node_modules/*' \
        -print0 2>/dev/null)
      if [ "${#_l2_configs[@]}" -eq 0 ]; then
        : # no per-package configs — nothing to wire
      else
        echo "▶ R2 Layer-2: wiring ${#_l2_configs[@]} per-package eslint config(s)"
        for _cfg in "${_l2_configs[@]}"; do
          # rc=0 forced by || true — never abort install on wirer failure
          ( cd "$PROJECT_ROOT" && npx --no-install tsx "$_wirer" \
              --path "$_cfg" ${FULL:+--yes} 2>&1 ) || true
        done
      fi
    fi
  fi
fi

# ─── cih-s3 V2: runtime-discipline arming WARN (consumer-side, deps-free) ───
# R7/R8 (no-direct-time-randomness / require-otel-span) ship DEFERRED behind AIF_STRICT_RUNTIME=1
# in the eslint config templates. If the consumer already depends on @opentelemetry/* yet has not
# armed the runtime rules, R8 silently never fires — surface that. Greps the package.json TEXT
# (deps may be uninstalled at install time → no module/require check). Non-fatal: WARN only,
# exit stays 0 (a fresh skeleton legitimately defers). --dry-run-aware.
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "  [dry-run] would check @opentelemetry/* vs AIF_STRICT_RUNTIME for the R7/R8 arming WARN"
elif [ -f "$PROJECT_ROOT/package.json" ] && \
     grep -q '@opentelemetry/' "$PROJECT_ROOT/package.json" && \
     [ "${AIF_STRICT_RUNTIME:-}" != "1" ]; then
  echo ""
  echo "⚠  Detected @opentelemetry/* but AIF_STRICT_RUNTIME is unset — R8 (require-otel-span) will not fire."
  echo "   Set AIF_STRICT_RUNTIME=1 to arm runtime-discipline rules (R7/R8)."
fi

# GH #531 (reopen): ignore the framework configs we shipped FRESH (consumer-owned ones stay checked).
# Runs after ALL copy_safe calls so SKIPPED is complete, and after the static .prettierignore merge.
ignore_shipped_configs

# ─── Done ───────────────────────────────────────────────
if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo ""
  echo "⚠  ${#SKIPPED[@]} files were skipped because they already exist."
  echo "    Your project may now have a configuration that diverges from the framework's expectations."
  echo "    To overwrite them: re-run with --force"
  echo "    To preview what would change: re-run with --dry-run --force"
  echo "    Skipped paths:"
  printf '      - %s\n' "${SKIPPED[@]}"
  echo ""
fi

echo ""
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "✅ Dry-run complete. Nothing was written."
else
  echo "✅ Installation complete."
fi
echo ""
echo "Next steps:"
echo "  1. Edit .ai-factory/DESCRIPTION.template.md → save as .ai-factory/DESCRIPTION.md"
echo "  2. Edit .ai-factory/ARCHITECTURE.ts-server.md (or ARCHITECTURE.react-next.md) → save as .ai-factory/ARCHITECTURE.md"
echo "  3. Edit AGENTS.md placeholders to match your project"
if [ "${DEPS_INSTALLED:-}" = "1" ]; then
  echo "  4. ✓ Dev-dependencies installed into node_modules/ — nothing to do."
else
  # step 4 fallback: the manual dep-install (run only when --full/[y/N] consent was not given).
  # Built from the same DEVDEPS array the installer uses → list cannot drift from what we install.
  case "$(detect_pm)" in
    pnpm) _add="pnpm add -D" ;;
    yarn) _add="yarn add -D" ;;
    *)    _add="npm install --save-dev" ;;
  esac
  echo "  4. Install dev-dependencies (or re-run: ./install.sh ${STACK:-ts-server} --full):"
  echo ""
  echo "     $_add \\"
  printf '       %s\n' "${DEVDEPS[*]}"
fi
echo "  5. Verify git hooks: 'git config core.hooksPath' should print .husky (install activated it; do NOT run 'npx husky init' — it would clobber the shipped .husky/pre-commit + pre-push)"
echo "  6. Run: ./scripts/audit-ai-docs.sh — should PASS"
echo "  7. Run: npm run validate"
echo ""
echo "For full guide: see INSTALL.md"
