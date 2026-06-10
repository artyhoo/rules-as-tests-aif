#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

BRIDGE_LIB_ONLY=1 source "$REPO_ROOT/setup.d/bridge-guided.sh"

# Health check keys on the URL responding, not on docker. Use a curl stub.
curl() { case "$*" in *"/health"*) return 0 ;; *) return 1 ;; esac; }
export -f curl
bridge_health_ok "http://localhost:3009" && ok "health ok → reachable (docker-agnostic)" || bad "health check failed"

curl() { return 1; }  # nothing responds
export -f curl
bridge_health_ok "http://localhost:3009" && bad "health ok despite no response" || ok "no response → not reachable"

# diagnose returns 'up' when health ok
curl() { case "$*" in *"/health"*) return 0 ;; *) return 1 ;; esac; }
export -f curl
[ "$(bridge_diagnose http://localhost:3009)" = "up" ] && ok "diagnose=up when reachable" || bad "diagnose not up"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
