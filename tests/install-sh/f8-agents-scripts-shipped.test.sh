#!/usr/bin/env bash
# cih-s2 F8 — the shipped AGENTS.md promises only scripts install actually delivers.
# Pre-S1, AGENTS.md listed `npm run test-storybook` + `npx playwright test` as if they were
# core, while install.sh shipped neither (no script key, no dep, no Storybook scaffold). This
# test asserts via the REAL install pipeline (mirror f11/f13) that:
#   (pos)  every `npm run X` in AGENTS.md OUTSIDE the UI-gated subsection is a real key in the
#          shipped package.json — so a doc promise can't outrun the install.
#   (gate) `test-storybook` + `playwright` live ONLY in the "### UI projects" subsection, not in
#          the unconditional core enumeration (an adjacent `# (UI projects)` comment is NOT enough).
#   (neg)  appending a fake `npm run __never__` to the shipped AGENTS.md makes the pos check FAIL —
#          proving the probe bites and is not vacuous.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# ts-server is the load-bearing stack: Storybook/Playwright are legitimately UNshipped there,
# so a doc that lists them as core is the exact F8 defect.
T=$(mktemp -d)
printf '{"name":"f8","version":"0.0.0"}\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
A="$T/AGENTS.md"
P="$T/package.json"

[ -f "$A" ] || { bad "AGENTS.md not shipped by install.sh"; echo "PASS=$PASS FAIL=$FAIL"; exit 1; }

# Lines OUTSIDE the UI-gated subsection (### UI projects … up to the next ## heading).
non_ui() { awk '/^### UI projects/{ui=1; next} /^## /{ui=0} ui==0{print}' "$A"; }

# Required keys = every `npm run <key>` that is NOT inside the UI subsection.
required_keys=$(non_ui | grep -oE 'npm run [A-Za-z0-9:_-]+' | awk '{print $3}' | sort -u)

# package.json key presence via node (guaranteed present — the scripts-merge needs it; no jq dep).
has_script() { node -e 'const p=require(process.argv[1]); process.exit(p.scripts&&(process.argv[2] in p.scripts)?0:1)' "$P" "$1"; }

# (pos) helper — returns 0 iff EVERY required key is a real script. Reused by the neg arm.
all_required_shipped() {
  local k missing=0
  for k in $required_keys; do has_script "$k" || { echo "MISSING:$k"; missing=1; }; done
  return $missing
}

# ── pos ──────────────────────────────────────────────────────────────────────
[ -n "$required_keys" ] \
  && ok "AGENTS core block enumerates $(wc -w <<<"$required_keys" | tr -d ' ') npm-run scripts" \
  || bad "no core 'npm run' scripts found in shipped AGENTS.md (parse/structure broke)"
if missing=$(all_required_shipped); then
  ok "every core 'npm run X' in AGENTS.md exists in shipped package.json"
else
  bad "AGENTS core promises scripts install never ships: ${missing}"
fi

# ── gate (structural move, not a comment) ────────────────────────────────────
if non_ui | grep -qE 'test-storybook|playwright'; then
  bad "test-storybook/playwright still in the unconditional core block — must be UI-gated"
else
  ok "test-storybook + playwright are confined to the '### UI projects' subsection"
fi
# and they DO still appear somewhere (UI subsection) — guards against silent deletion of the gate.
grep -qE 'test-storybook' "$A" && grep -qE 'playwright' "$A" \
  && ok "UI commands documented in the gated subsection (not dropped)" \
  || bad "UI commands vanished from AGENTS.md entirely (over-trimmed)"

# ── neg (load-bearing) ───────────────────────────────────────────────────────
echo 'npm run __fake_never_shipped__' >> "$A"
required_keys=$(non_ui | grep -oE 'npm run [A-Za-z0-9:_-]+' | awk '{print $3}' | sort -u)
if all_required_shipped >/dev/null; then
  bad "neg arm vacuous: fake 'npm run __fake_never_shipped__' did NOT trip the probe"
else
  ok "neg arm bites: injected fake script makes the pos check fail"
fi

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
