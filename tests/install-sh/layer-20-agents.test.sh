#!/usr/bin/env bash
set -euo pipefail
LAYER_DIR="$(cd "$(dirname "$0")/../../setup.d" && pwd)"
INSTALL_SH_LIB_ONLY=1 source "$LAYER_DIR/20-agents.sh"
echo "PASS: 20-agents.sh sources in lib-only mode"
