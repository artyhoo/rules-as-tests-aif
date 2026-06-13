#!/usr/bin/env bash
# cic-s3 #483 — one-button completeness: install.sh now RUNS the dev-dep install it used to only
# DECLARE (T-CIC-C "declare≠install"). The bug: the scripts-merge declared the toolchain + the
# Next-steps handed back a manual `npm install`, so the wired hooks (core.hooksPath=.husky →
# .husky/pre-commit runs `npx lint-staged`) fired with their tools ABSENT → ENOENT on the
# consumer's first commit (#478 root, #483). The fix: detect the PM (detect_pm SSOT) and actually
# install, OPT-IN via [y/N] default-No or --full.
#
# NO REAL INSTALL / NO NETWORK: a FAKE package manager on PATH records its argv and simulates the
# install by dropping node_modules/.bin/{lint-staged,husky} stubs (same "fake the .bin" tactic as
# f14-lintstaged-resolves.test.sh). Asserting "the PM was invoked with the dep list" is what proves
# RUN-not-just-declare — exactly the T-CIC-C distinction.
#
# PAIRED-NEGATIVES:
#   - Arm B: no --full + non-interactive stdin → PM is NOT invoked and node_modules/.bin/lint-staged
#     stays ABSENT (the dead/declared-only state) → gate works AND declare≠install is real.
#   - Arm D: a FLAT pnpm consumer → `pnpm add -D` is emitted WITHOUT the workspace `-w` flag
#     (Arm C's monorepo arm proves -w IS added) → the -w branch is non-vacuous.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# ── fake PM: $FAKEBIN/{npm,pnpm} record argv to $AIF_PM_LOG and, on install/add, drop bin stubs
#    into the cwd's node_modules/.bin (install.sh cd's to PROJECT_ROOT before invoking the PM).
#    node / npx / git are NOT shadowed (only npm + pnpm live here) so the real hook chain runs. ──
FAKEBIN=$(mktemp -d)
make_fake_pm() {  # $1=name
  cat > "$FAKEBIN/$1" <<'PM'
#!/bin/sh
printf '%s\n' "$*" >> "$AIF_PM_LOG"
case "$1" in
  install|add)
    mkdir -p "$PWD/node_modules/.bin"
    for b in lint-staged husky sort-package-json; do
      printf '#!/bin/sh\nexit 0\n' > "$PWD/node_modules/.bin/$b"
      chmod +x "$PWD/node_modules/.bin/$b"
    done ;;
esac
exit 0
PM
  chmod +x "$FAKEBIN/$1"
}
make_fake_pm npm
make_fake_pm pnpm
export PATH="$FAKEBIN:$PATH"

run_install() {  # $1=dir  ; rest=args ; stdin from /dev/null unless caller pipes
  local d="$1"; shift
  ( cd "$d" && bash "$REPO_ROOT/install.sh" "$@" ) >/dev/null 2>&1
}

# ════ Arm A — flat consumer, --full → npm install RUNS; hooks get tools; commit SUCCEEDS ════
A=$(mktemp -d); export AIF_PM_LOG="$A.log"; : > "$AIF_PM_LOG"
printf '{ "name":"a","version":"0.0.0" }\n' > "$A/package.json"
( cd "$A" && git init -q && git config user.email t@t && git config user.name t )
run_install "$A" ts-server --force --full < /dev/null

grep -q -- '--save-dev' "$AIF_PM_LOG" \
  && ok "A: --full → fake npm invoked with 'install --save-dev …' (RUN, not just declared)" \
  || bad "A: PM not invoked with --save-dev (still declare-only — #483 not fixed)"
grep -q 'lint-staged' "$AIF_PM_LOG" \
  && ok "A: the declared hook tool (lint-staged) is in the install arg list" \
  || bad "A: lint-staged absent from install args"
[ -x "$A/node_modules/.bin/lint-staged" ] \
  && ok "A: post-install node_modules/.bin/lint-staged present (tools landed)" \
  || bad "A: node_modules/.bin/lint-staged missing after --full install"
if ( cd "$A" && git add -A && git commit -q -m "smoke: first commit" ) >/dev/null 2>&1; then
  ok "A: first commit SUCCEEDS — pre-commit 'npx lint-staged' resolves (no ENOENT)"
else
  bad "A: first commit failed — wired hook could not find its tool"
fi

# ════ Arm B (paired-negative) — flat, NO --full, non-interactive → NO install (gate + declare≠install) ════
B=$(mktemp -d); export AIF_PM_LOG="$B.log"; : > "$AIF_PM_LOG"
printf '{ "name":"b","version":"0.0.0" }\n' > "$B/package.json"
( cd "$B" && git init -q )
run_install "$B" ts-server --force < /dev/null   # no --full, stdin not a tty → default No

[ ! -s "$AIF_PM_LOG" ] \
  && ok "B neg: no --full + non-interactive → PM NOT invoked (default-No gate holds)" \
  || bad "B neg: PM invoked without consent ($(tr '\n' ';' < "$AIF_PM_LOG"))"
[ ! -e "$B/node_modules/.bin/lint-staged" ] \
  && ok "B neg: node_modules/.bin/lint-staged ABSENT (the declared-only dead state)" \
  || bad "B neg: tools present without an install — fake leaked?"

# ════ Arm C — pnpm WORKSPACE, --full → 'pnpm add -D -w' (workspace-root flag) ════
C=$(mktemp -d); export AIF_PM_LOG="$C.log"; : > "$AIF_PM_LOG"
printf '{ "name":"c","version":"0.0.0" }\n' > "$C/package.json"
printf 'packages:\n  - "apps/*"\n' > "$C/pnpm-workspace.yaml"
( cd "$C" && git init -q )
run_install "$C" ts-server --force --full < /dev/null

grep -Eq 'add .*-D' "$AIF_PM_LOG" \
  && ok "C: pnpm consumer → 'pnpm add -D …' invoked" \
  || bad "C: pnpm add not invoked ($(tr '\n' ';' < "$AIF_PM_LOG"))"
grep -q -- '-w' "$AIF_PM_LOG" \
  && ok "C: workspace present → -w (workspace-root) flag passed (avoids pnpm's add-to-root refusal)" \
  || bad "C: -w flag missing on a workspace install"

# ════ Arm D (paired-negative for -w) — FLAT pnpm → 'pnpm add -D' WITHOUT -w ════
D=$(mktemp -d); export AIF_PM_LOG="$D.log"; : > "$AIF_PM_LOG"
printf '{ "name":"d","version":"0.0.0" }\n' > "$D/package.json"
printf '' > "$D/pnpm-lock.yaml"     # flat pnpm marker, NO pnpm-workspace.yaml
( cd "$D" && git init -q )
run_install "$D" ts-server --force --full < /dev/null

grep -Eq 'add .*-D' "$AIF_PM_LOG" \
  && ok "D: flat pnpm consumer → 'pnpm add -D …' invoked" \
  || bad "D: pnpm add not invoked on flat pnpm ($(tr '\n' ';' < "$AIF_PM_LOG"))"
if grep -q -- '-w' "$AIF_PM_LOG"; then
  bad "D neg: -w passed on a FLAT pnpm consumer (no workspace) → -w branch is vacuous"
else
  ok "D neg: flat pnpm → NO -w flag (the -w branch keys on the workspace marker, non-vacuous)"
fi

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
