#!/usr/bin/env bash
# setup.d/05-mcp.sh — STUB (S1). Content populated by S2.
# shellcheck source=./lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
if [ "${INSTALL_SH_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi
# S1 stub — intentionally empty. Does not modify installed tree.
