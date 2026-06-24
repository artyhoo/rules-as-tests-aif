#!/usr/bin/env bash
set -euo pipefail
LAYER_DIR="$(cd "$(dirname "$0")/../../setup.d" && pwd)"
INSTALL_SH_LIB_ONLY=1 source "$LAYER_DIR/05-mcp.sh"
echo "PASS: 05-mcp.sh sources in lib-only mode"
