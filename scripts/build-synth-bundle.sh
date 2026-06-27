#!/usr/bin/env bash
# build-synth-bundle.sh — Bundle synth-and-wire.ts into a zero-runtime-dep .mjs (#755).
#
# Precompiles packages/core/install/synth-and-wire.ts + its transitive deps
# (ajv, semver) into a single self-contained .mjs that 99-finalize.sh runs via
# plain `node` — no tsx, no consumer dev-deps required.
#
# Usage:
#   scripts/build-synth-bundle.sh           # (re)generate committed bundle
#   scripts/build-synth-bundle.sh --check   # drift gate: fail if committed != fresh build
#
# The --check mode is the CI-runnable drift guard ("documents lie; tests don't")
# that keeps the committed .mjs in sync with its .ts source.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
ESBUILD="$ROOT/node_modules/.bin/esbuild"
ENTRY="$ROOT/packages/core/install/synth-and-wire.ts"
OUTFILE="$ROOT/packages/core/install/synth-and-wire.bundle.mjs"

# Require esbuild — pinned at root devDependencies per ci-tool-pinning.md
if [ ! -x "$ESBUILD" ]; then
  echo "ERROR: esbuild not found at $ESBUILD — run 'NODE_ENV=development npm install --include=dev' at repo root first." >&2
  exit 2
fi

# Load-bearing banner: defines a real `require` so ajv (CJS) bundled into ESM
# output does not crash with "Dynamic require of X is not supported" (esbuild#1921).
BANNER="import{createRequire as ___cr}from'node:module';const require=___cr(import.meta.url);"

_build() {
  local outfile="$1"
  "$ESBUILD" "$ENTRY" \
    --bundle \
    --platform=node \
    --format=esm \
    --target=node20 \
    --packages=bundle \
    --external:ts-morph \
    --banner:js="$BANNER" \
    --outfile="$outfile" 2>&1
}

MODE="${1:-build}"

if [ "$MODE" = "--check" ]; then
  if [ ! -f "$OUTFILE" ]; then
    echo "DRIFT: committed bundle missing — run: scripts/build-synth-bundle.sh" >&2
    exit 1
  fi
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT
  _build "$tmp" >/dev/null
  if ! diff -q "$OUTFILE" "$tmp" >/dev/null 2>&1; then
    echo "DRIFT: synth-and-wire.bundle.mjs differs from a fresh build of synth-and-wire.ts" >&2
    echo "       Re-run: scripts/build-synth-bundle.sh" >&2
    exit 1
  fi
  echo "✓ synth-and-wire.bundle.mjs in sync with synth-and-wire.ts"
  exit 0
fi

# build mode: (re)generate committed bundle in place
_build "$OUTFILE" >/dev/null
echo "✓ built packages/core/install/synth-and-wire.bundle.mjs (zero-runtime-dep; consumer needs only plain node)"
