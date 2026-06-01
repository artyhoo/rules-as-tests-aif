#!/usr/bin/env bash
# .husky/pre-push — TS-core dispatcher (shipped by install.sh via husky-pre-push.sh).
#
# Runtime feature detection, NOT install-time (dual-implementation-discipline.md §3):
# checks at every push whether Node ≥20 is available, routes accordingly.
#
# Capability-check, NOT brand-name detection (dual-implementation-discipline.md §4 / §8):
# gates on `command -v node` + major-version, never on a harness brand string.
#
# Routes:
#   Node ≥20 + pre-push.ts present → TS-core hook (full checks: §7 substance, §1.7 substance, etc.)
#   Otherwise                       → bash critical-only fallback (§7/§1.7 presence only)
#
# Both hooks are installed by install.sh alongside this file.
# See packages/core/hooks/pre-push.fallback.sh for the fallback's check set.
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
TS_HOOK="$REPO_ROOT/packages/core/hooks/pre-push.ts"
FALLBACK="$REPO_ROOT/packages/core/hooks/pre-push.fallback.sh"

node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 20 ] && [ -f "$TS_HOOK" ]; then
  exec node --import tsx/esm "$TS_HOOK"
elif [ -x "$FALLBACK" ]; then
  exec bash "$FALLBACK"
else
  echo "⚠ pre-push: Node ≥20 unavailable and bash fallback not present — skipping checks."
  echo "  Install Node ≥20 to enable the full TS-core pre-push hook."
  exit 0
fi
