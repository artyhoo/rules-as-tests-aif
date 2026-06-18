#!/usr/bin/env bash
# check-arch-boundaries.sh — GH #534. The R3 inertness alarm, parallel to check:globs (R2).
#
# The shipped .dependency-cruiser.cjs carries layered + monorepo boundary rules, but every rule is
# PATH-keyed and silently INERT on a layout it doesn't match. On a pnpm-workspace monorepo (apps/* +
# packages/*) the boundaries that matter are packages↛apps and apps↔apps — and if the consumer's
# arch config carries no such rule (e.g. a pre-existing config that install did not overwrite, or a
# config hand-trimmed to layered-only), `arch:check` passes GREEN while those imports go unguarded.
# Unlike R2 — where check:globs loudly fails on a rule that matches zero files — R3 had NO detector,
# so the inertness was silent. This gate is that alarm: on an apps/+packages/ monorepo it FAILS when
# the arch config has no packages→apps boundary rule.
#
# Dependency-free (pure bash; dependency-cruiser has NO built-in inert-rule report — verified
# DeepWiki sverweij/dependency-cruiser 2026-06-15 — so this is the R3 analog of the own-built
# check-rule-globs.sh, not a reimplementation of an upstream feature). Layout-scoped: SKIPS on a
# flat / layered single project and on a single-tree workspace (only packages/, only services/),
# where there is no packages↛apps boundary to guard.
set -uo pipefail

CFG="${DEPCRUISE_CONFIG:-.dependency-cruiser.cjs}"
if [ ! -f "$CFG" ]; then
  echo "check-arch-boundaries: $CFG not found — skipped (no architecture config to verify)."
  exit 0
fi

# Monorepo signal: BOTH an apps/ tree and a packages/ tree (the layout where packages↛apps applies).
is_mono=0
{ [ -d apps ] && [ -d packages ]; } && is_mono=1
if [ "$is_mono" = 0 ] && [ -f pnpm-workspace.yaml ] \
   && grep -q 'apps/' pnpm-workspace.yaml 2>/dev/null \
   && grep -q 'packages/' pnpm-workspace.yaml 2>/dev/null; then
  is_mono=1
fi

if [ "$is_mono" = 0 ]; then
  echo "check-arch-boundaries: not an apps/+packages/ monorepo — skipped (no packages↛apps boundary to enforce here)."
  exit 0
fi

# Monorepo: the arch config MUST carry a rule guarding packages → apps. Detect a forbidden rule
# whose from/to path patterns reference BOTH packages/ and apps/ (our shipped `no-package-to-app`,
# or any consumer-authored equivalent). Match on `path:` lines so prose comments don't count.
if grep -E "path:.*packages/" "$CFG" >/dev/null 2>&1 \
   && grep -E "path:.*apps/" "$CFG" >/dev/null 2>&1; then
  echo "✓ check-arch-boundaries: monorepo detected; $CFG carries packages/ + apps/ boundary rule(s)."
  echo "check-arch-boundaries: OK"
  exit 0
fi

echo "✗ check-arch-boundaries: apps/+packages/ monorepo detected, but $CFG has NO packages↛apps boundary rule." >&2
echo "   arch:check passes GREEN while a packages/* → apps/* import goes unguarded (R3 silent inertness)." >&2
echo "   Add a forbidden rule guarding the boundary, e.g.:" >&2
echo "       { name: 'no-package-to-app', severity: 'error', from: { path: '(?:^|/)packages/' }, to: { path: '(?:^|/)apps/' } }" >&2
exit 1
