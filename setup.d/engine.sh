#!/usr/bin/env bash
# Companion manifest engine. Sourceable in lib-only mode (ENGINE_LIB_ONLY=1).
# companion_step <name> <detect_cmd> <install_cmd> <kind> <mode>
#   mode: interactive | yes | dry-run
# Principle: detect-first; install only via the companion's own official command; no version pin.

companion_step() {
  local name="$1" detect_cmd="$2" install_cmd="$3" kind="$4" mode="$5"

  # External services are not plain installs — the caller (setup) routes them to bridge guided-detect.
  if [ "$kind" = "external-service" ]; then
    printf '[%s] external service — handled by runtime-bridge guided-detect\n' "$name"
    return 0
  fi

  if eval "$detect_cmd" >/dev/null 2>&1; then
    printf '  ⊝ %s already present — skipping\n' "$name"
    return 0
  fi

  if [ "$mode" = "dry-run" ]; then
    printf '  [dry-run] would install %s: %s\n' "$name" "$install_cmd"
    return 0
  fi

  local do_it="$mode"
  if [ "$mode" = "interactive" ]; then
    printf '  Install %s? [y/N]: ' "$name"
    read -r ans || ans=""
    case "$ans" in [yY]|[yY][eE][sS]) do_it="yes" ;; *) do_it="no" ;; esac
  fi

  if [ "$do_it" = "yes" ]; then
    if eval "$install_cmd"; then
      printf '  ✓ %s installed\n' "$name"
    else
      printf '  ⚠ %s install failed — run manually: %s\n' "$name" "$install_cmd"
    fi
  else
    printf '  ⊝ %s skipped\n' "$name"
  fi
}

# Lib-only guard: when sourced for tests, expose the function without parsing the manifest.
if [ "${ENGINE_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi
