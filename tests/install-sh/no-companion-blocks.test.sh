#!/usr/bin/env bash
# Asserts install.sh no longer ships companion-install logic (migrated to ./setup manifest).
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
INSTALL_SH="$REPO_ROOT/install.sh"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

grep -q 'claude plugin install' "$INSTALL_SH" && bad "install.sh still references 'claude plugin install'" || ok "no 'claude plugin install' in install.sh"
grep -qi 'oh-my-openagent\|ohmyopencode' "$INSTALL_SH" && bad "install.sh still references OhMyOpencode" || ok "no OhMyOpencode in install.sh"
grep -qi 'task-master\|taskmaster' "$INSTALL_SH" && bad "install.sh still references TaskMaster" || ok "no TaskMaster in install.sh"
grep -q 'Optional companion installs' "$INSTALL_SH" && bad "companion section header still present" || ok "companion section removed"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
