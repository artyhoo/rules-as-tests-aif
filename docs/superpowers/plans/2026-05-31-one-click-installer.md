# One-click installer (`./setup`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single `./setup` entry point that orchestrates the existing `install.sh` (framework) + a declarative companion manifest + `setup-runtime-bridge.sh` into one consented y/n flow, installing everything free-on-subscription via official installers.

**Architecture:** `./setup` is a thin bash orchestrator (preflight → install.sh → companion-manifest engine → runtime-bridge guided-detect → summary). Companions install via their own official installers (detect-first, no version pin) driven by a data-only `companions.manifest`. `install.sh` is reduced to framework-file deploy only — its three companion blocks move out (Superpowers → manifest; TaskMaster/OhMyOpencode → removed). External services (aif-handoff) are detected by `/health` reachability (runtime-agnostic — docker OR native), never by assuming docker.

**Tech Stack:** Bash (POSIX-ish, `set -euo pipefail`), `tests/install-sh/*.test.sh` custom PASS/FAIL harness (no framework), `python3` for the settings.json JSON patch (already shipped in PR #311), `jq`-free.

**Spec:** [`docs/superpowers/specs/2026-05-31-one-click-installer-design.md`](../specs/2026-05-31-one-click-installer-design.md).

**Repo:** all paths relative to `rules-as-tests-aif` root. Branch from `staging` via `bash scripts/create-worktree.sh one-click-installer` (parallel-subwave-isolation.md). PR base = `staging`.

## Task 0: Worktree + branch setup

**Files:** none (git environment).

- [ ] **Step 1: Create isolated worktree off staging**

Run: `bash scripts/create-worktree.sh one-click-installer`
Expected: worktree at `.claude/worktrees/one-click-installer/` on branch `worktree-one-click-installer`, based off refreshed `origin/staging`.

- [ ] **Step 2: Move the spec + this plan into the worktree if not already there**

The spec + plan live under `docs/superpowers/{specs,plans}/`. Confirm both exist in the worktree checkout (they are committable — not gitignored). If absent, copy them in.

- [ ] **Step 3: Commit the spec + plan**

```bash
git add docs/superpowers/specs/2026-05-31-one-click-installer-design.md docs/superpowers/plans/2026-05-31-one-click-installer.md
git commit -m "docs(installer): one-click installer spec + plan"
```

## Task 1: Reduce `install.sh` to framework-only (remove all 3 companion blocks)

**Files:**
- Modify: `install.sh` — delete the "Optional companion installs" section (`install.sh:340-455`: the `echo "▶ Optional companion installs"` line through the end of the OhMyOpencode block, stopping BEFORE the `# ── aif-handoff integration note` block at `:457`).
- Test: `tests/install-sh/no-companion-blocks.test.sh` (create)

- [ ] **Step 1: Write the failing test**

```bash
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/install-sh/no-companion-blocks.test.sh`
Expected: FAIL — all 4 assertions currently fail (the blocks still exist).

- [ ] **Step 3: Delete the companion section from install.sh**

Remove lines from `echo "▶ Optional companion installs"` (`:340`) through the final line of the OhMyOpencode block (`:455`, ending with the `set "claude_code.skills": false` note `echo`). Keep the `# ── aif-handoff integration note` block (`:457+`) intact — that is framework skill-context, not a companion install. Also remove the now-unused `COMPANIONS` arg parse (`install.sh:62` `--companions=*` case + the `COMPANIONS="${COMPANIONS:-}"` init at `:60`) since companion selection moves to `./setup`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/install-sh/no-companion-blocks.test.sh`
Expected: `PASS=4 FAIL=0`.

- [ ] **Step 5: Verify install.sh still parses and dry-runs**

Run: `bash -n install.sh && cd /tmp && rm -rf st && mkdir st && cd st && echo '{}' > package.json && bash "$OLDPWD/install.sh" ts-server --dry-run | tail -5`
Expected: dry-run completes with "✅ Dry-run complete." and no companion prompts.

- [ ] **Step 6: Commit**

```bash
git add install.sh tests/install-sh/no-companion-blocks.test.sh
git commit -m "refactor(install): remove companion blocks — companions move to ./setup manifest"
```

## Task 2: Companion manifest (data file)

**Files:**
- Create: `setup.d/companions.manifest`
- Test: `tests/install-sh/manifest-parse.test.sh` (create)

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
MANIFEST="$REPO_ROOT/setup.d/companions.manifest"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

[ -f "$MANIFEST" ] && ok "manifest exists" || bad "manifest missing"
# Every non-comment line has exactly 4 pipe-delimited fields
awk -F'|' '!/^#/ && NF && NF!=4 {bad=1} END{exit bad}' "$MANIFEST" && ok "all rows have 4 fields" || bad "a row does not have 4 fields"
grep -qE '^[[:space:]]*superpowers[[:space:]]*\|' "$MANIFEST" && ok "superpowers row present" || bad "no superpowers row"
# No version pins (no '@x.y.z' style) in install commands
grep -qE '@[0-9]+\.[0-9]+' "$MANIFEST" && bad "manifest pins a version" || ok "no version pin"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/install-sh/manifest-parse.test.sh`
Expected: FAIL — manifest missing.

- [ ] **Step 3: Create the manifest**

`setup.d/companions.manifest`:

```text
# name | detect_cmd | install_cmd | kind
# Companions install via THEIR official installer, detect-first, no version pin.
# kind=cc-plugin → install_cmd is run on consent. kind=external-service → routed to bridge guided-detect (setup-runtime-bridge.sh), install_cmd ignored.
superpowers | claude plugin list 2>/dev/null | grep -q superpowers | claude plugin install superpowers@claude-plugins-official --scope user | cc-plugin
runtime-bridge | curl -sf "${RUNTIME_BRIDGE_AIF_URL:-http://localhost:3009}/health" | (bridge) | external-service
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/install-sh/manifest-parse.test.sh`
Expected: `PASS=4 FAIL=0`.

- [ ] **Step 5: Commit**

```bash
git add setup.d/companions.manifest tests/install-sh/manifest-parse.test.sh
git commit -m "feat(setup): companion manifest data file"
```

## Task 3: Manifest engine (sourceable function lib)

**Files:**
- Create: `setup.d/engine.sh`
- Test: `tests/install-sh/engine.test.sh` (create)

The engine exposes `companion_step <name> <detect_cmd> <install_cmd> <kind> <mode>` where `mode` ∈ `interactive|yes|dry-run`. It must be sourceable for testing (guard the same way install.sh uses `INSTALL_SH_LIB_ONLY`).

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

ENGINE_LIB_ONLY=1 source "$REPO_ROOT/setup.d/engine.sh"

# detect succeeds → skip, never runs install
out=$(companion_step "fake" "true" "echo SHOULD_NOT_RUN" "cc-plugin" "yes")
echo "$out" | grep -q SHOULD_NOT_RUN && bad "ran install despite detect-present" || ok "detect-present → skip"
echo "$out" | grep -qi 'skip' && ok "skip message emitted" || bad "no skip message"

# detect fails + mode=yes → runs install
out=$(companion_step "fake" "false" "echo INSTALLED_OK" "cc-plugin" "yes")
echo "$out" | grep -q INSTALLED_OK && ok "detect-absent + yes → installs" || bad "did not install"

# mode=dry-run → never runs install even when detect fails
out=$(companion_step "fake" "false" "echo SHOULD_NOT_RUN" "cc-plugin" "dry-run")
echo "$out" | grep -q SHOULD_NOT_RUN && bad "dry-run ran install" || ok "dry-run → no install"

# external-service kind → does not run install_cmd (routed elsewhere)
out=$(companion_step "rb" "false" "echo SHOULD_NOT_RUN" "external-service" "yes")
echo "$out" | grep -q SHOULD_NOT_RUN && bad "external-service ran install_cmd" || ok "external-service → not a plain install"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/install-sh/engine.test.sh`
Expected: FAIL — `setup.d/engine.sh` missing → source error.

- [ ] **Step 3: Implement the engine**

`setup.d/engine.sh`:

```bash
#!/usr/bin/env bash
# Companion manifest engine. Sourceable in lib-only mode (ENGINE_LIB_ONLY=1).
# companion_step <name> <detect_cmd> <install_cmd> <kind> <mode>
#   mode: interactive | yes | dry-run
# Principle: detect-first; install only via the companion's own official command; no version pin.

companion_step() {
  local name="$1" detect_cmd="$2" install_cmd="$3" kind="$4" mode="$5"

  # External services are not plain installs — the caller (setup) routes them to bridge guided-detect.
  if [ "$kind" = "external-service" ]; then
    printf '[%s] external service — handled by runtime-bridge guided-detect\n' "$name"
    return 0
  fi

  if eval "$detect_cmd" >/dev/null 2>&1; then
    printf '  ⊝ %s already present — skipping\n' "$name"
    return 0
  fi

  if [ "$mode" = "dry-run" ]; then
    printf '  [dry-run] would install %s: %s\n' "$name" "$install_cmd"
    return 0
  fi

  local do_it="$mode"
  if [ "$mode" = "interactive" ]; then
    printf '  Install %s? [y/N]: ' "$name"
    read -r ans || ans=""
    case "$ans" in [yY]|[yY][eE][sS]) do_it="yes" ;; *) do_it="no" ;; esac
  fi

  if [ "$do_it" = "yes" ]; then
    if eval "$install_cmd"; then
      printf '  ✓ %s installed\n' "$name"
    else
      printf '  ⚠ %s install failed — run manually: %s\n' "$name" "$install_cmd"
    fi
  else
    printf '  ⊝ %s skipped\n' "$name"
  fi
}

# Lib-only guard: when sourced for tests, expose the function without parsing the manifest.
if [ "${ENGINE_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/install-sh/engine.test.sh`
Expected: `PASS=5 FAIL=0`.

- [ ] **Step 5: Commit**

```bash
git add setup.d/engine.sh tests/install-sh/engine.test.sh
git commit -m "feat(setup): companion manifest engine (detect-first, no-pin)"
```

---

## Task 4: Bridge guided-detect layer

**Files:**
- Create: `setup.d/bridge-guided.sh`
- Test: `tests/install-sh/bridge-guided.test.sh` (create)

Exposes `bridge_health_ok <url>` (runtime-agnostic — succeeds whether aif runs in docker or natively) and `bridge_diagnose <url>` (returns one of `up|docker|native|absent`). Keep `setup-runtime-bridge.sh` as the existing our-side writer (env + hook + settings.json per PR #311); this layer wraps the external-detect around it.

- [ ] **Step 1: Write the failing test**

```bash
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/install-sh/bridge-guided.test.sh`
Expected: FAIL — `setup.d/bridge-guided.sh` missing.

- [ ] **Step 3: Implement the guided-detect layer**

`setup.d/bridge-guided.sh`:

```bash
#!/usr/bin/env bash
# Runtime-bridge guided-detect. Sourceable in lib-only mode (BRIDGE_LIB_ONLY=1).
# Detection keys on /health (works for docker OR native aif-handoff) — never assumes docker.

bridge_health_ok() {
  local url="$1"
  curl -sf "${url}/health" >/dev/null 2>&1
}

# Returns: up | docker | native | absent
bridge_diagnose() {
  local url="$1"
  if bridge_health_ok "$url"; then echo "up"; return 0; fi
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo "docker"; return 0; fi
  if command -v aif-handoff >/dev/null 2>&1; then echo "native"; return 0; fi
  echo "absent"
}

# Interactive flow: diagnose → offer matching bring-up → re-poll → report.
# (Calls setup-runtime-bridge.sh for the our-side env/hook/settings.json writes.)
bridge_guided_run() {
  local url="${RUNTIME_BRIDGE_AIF_URL:-http://localhost:3009}"
  local state; state=$(bridge_diagnose "$url")
  case "$state" in
    up)      printf '  ✓ aif-handoff reachable at %s\n' "$url" ;;
    docker)  printf '  aif-handoff not responding; docker is available. Start it with: docker compose up -d (in your aif-handoff checkout), then re-run.\n' ;;
    native)  printf '  aif-handoff CLI present but not responding — start it, then re-run.\n' ;;
    absent)  printf '  aif-handoff not detected (docker down + no CLI). See docs/runtime-bridge-setup.md for install.\n' ;;
  esac
  # our-side writes are delegated to the existing, tested script:
  if [ "$state" = "up" ]; then
    bash packages/runtime-bridge/scripts/setup-runtime-bridge.sh
  fi
}

if [ "${BRIDGE_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/install-sh/bridge-guided.test.sh`
Expected: `PASS=3 FAIL=0`.

- [ ] **Step 5: Commit**

```bash
git add setup.d/bridge-guided.sh tests/install-sh/bridge-guided.test.sh
git commit -m "feat(setup): bridge guided-detect (health-first, runtime-agnostic)"
```

---

## Task 5: `./setup` orchestrator

**Files:**
- Create: `setup` (executable, repo root)
- Test: `tests/install-sh/setup-orchestrator.test.sh` (create)

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
SETUP="$REPO_ROOT/setup"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

[ -x "$SETUP" ] && ok "setup is executable" || bad "setup not executable"
bash -n "$SETUP" && ok "setup parses" || bad "setup has syntax error"

# --dry-run in a throwaway project writes nothing and prints preflight + summary
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
( cd "$TMP" && echo '{}' > package.json && bash "$SETUP" ts-server --dry-run >out.txt 2>&1 )
grep -qi 'preflight' "$TMP/out.txt" && ok "preflight ran" || bad "no preflight"
grep -qi 'dry-run' "$TMP/out.txt" && ok "dry-run acknowledged" || bad "dry-run not acknowledged"
[ ! -f "$TMP/AGENTS.md" ] && ok "dry-run wrote nothing" || bad "dry-run wrote files"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/install-sh/setup-orchestrator.test.sh`
Expected: FAIL — `setup` missing.

- [ ] **Step 3: Implement `./setup`**

`setup` (repo root, `chmod +x`):

```bash
#!/usr/bin/env bash
# setup — one-click orchestrator: framework (install.sh) + companions (manifest) + runtime-bridge.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"

MODE="interactive"; DRY=""; STACK=""
for a in "$@"; do
  case "$a" in
    --yes)      MODE="yes" ;;
    --all)      MODE="all" ;;
    --dry-run)  DRY="--dry-run"; MODE="dry-run" ;;
    ts-server|react-next) STACK="$a" ;;
  esac
done

echo "▶ Preflight"
for tool in bash git python3 curl; do
  if command -v "$tool" >/dev/null 2>&1; then echo "  ✓ $tool"; else echo "  ⚠ $tool missing"; fi
done

echo "▶ Framework (install.sh)"
bash "$HERE/install.sh" ${STACK:+$STACK} ${DRY:+$DRY}

echo "▶ Companions"
source "$HERE/setup.d/engine.sh"
emode="$MODE"; [ "$MODE" = "all" ] && emode="yes"
# manifest fields are pipe-delimited; detect/install may themselves contain pipes, so split on the
# 4 logical fields using a fixed-field parser: name | detect | install | kind
while IFS= read -r line; do
  case "$line" in ''|\#*) continue ;; esac
  name="$(printf '%s' "$line" | awk -F'|' '{gsub(/^ +| +$/,"",$1); print $1}')"
  kind="$(printf '%s' "$line" | awk -F'|' '{gsub(/^ +| +$/,"",$NF); print $NF}')"
  detect="$(printf '%s' "$line" | sed -E 's/^[^|]*\|//; s/\|[^|]*\|[^|]*$//; s/^ +| +$//g')"
  install="$(printf '%s' "$line" | sed -E 's/^([^|]*\|){2}//; s/\|[^|]*$//; s/^ +| +$//g')"
  if [ "$kind" = "external-service" ]; then continue; fi   # handled in bridge step
  companion_step "$name" "$detect" "$install" "$kind" "$emode"
done < "$HERE/setup.d/companions.manifest"

echo "▶ Runtime-bridge"
if [ "$MODE" = "dry-run" ]; then
  echo "  [dry-run] would run bridge guided-detect"
elif [ "$MODE" = "yes" ] || [ "$MODE" = "all" ]; then
  source "$HERE/setup.d/bridge-guided.sh"; bridge_guided_run
else
  printf '  Set up runtime-bridge (aif-handoff)? [y/N]: '
  read -r ans || ans=""
  case "$ans" in [yY]|[yY][eE][sS]) source "$HERE/setup.d/bridge-guided.sh"; bridge_guided_run ;; *) echo "  ⊝ runtime-bridge skipped" ;; esac
fi

echo ""
echo "✅ ./setup complete (${MODE})."
```

> **Manifest-parse note for the implementer:** the awk/sed field split above assumes detect/install commands contain pipes (e.g. `... | grep -q ...`). If that proves fragile, switch the manifest delimiter to a tab and split on tab — but verify against the actual `companions.manifest` rows in Task 2 first (write a parse sub-test before trusting it).

- [ ] **Step 4: Make executable + run test**

Run: `chmod +x setup && bash tests/install-sh/setup-orchestrator.test.sh`
Expected: `PASS=5 FAIL=0`.

- [ ] **Step 5: Commit**

```bash
git add setup tests/install-sh/setup-orchestrator.test.sh
git commit -m "feat(setup): ./setup one-click orchestrator (framework + companions + bridge)"
```

---

## Task 6: SSOT annotation (TaskMaster withdrawn)

**Files:**
- Modify: `docs/meta-factory/prior-art-evaluations.md:152` (SSOT #84)

- [ ] **Step 1: Append a withdrawal note to SSOT #84**

Edit row #84's trigger/rationale to add: "TaskMaster (TM) install withdrawn 2026-05-31 — `claude-task-master@claude-plugins-official` does not resolve in the marketplace (verified `claude plugin install` → 'not found'); TaskMaster is MCP/CLI-based, not a CC plugin. SP-half of the row remains valid; companions now install via `./setup` manifest. SSOT #73 (TM vocabulary) unaffected."

- [ ] **Step 2: Verify principle 08 (SSOT citations) still green**

Run: `npx vitest run packages/core/principles/08-prior-art-cited.test.ts` (from a node-workspaces-symlinked checkout).
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/meta-factory/prior-art-evaluations.md
git commit -m "docs(ssot): withdraw TaskMaster install from #84 (marketplace slug unresolved)"
```

---

## Task 7: Codify the companion-install principle as a rule

**Files:**
- Create: `.claude/rules/companion-install-principle.md`
- Modify: `packages/core/principles/09-doc-authority-hierarchy.ts` (add to `REQUIRED_HEADER_DOCS` if rules are listed there — verify first)

- [ ] **Step 1: Write the rule file**

`.claude/rules/companion-install-principle.md` — Class C (prose; promotion criterion = a grep gate over `./setup` + manifest asserting no version pin). Header per `doc-authority-hierarchy.md §3`:

```markdown
# Companion / external-service install principle — discipline rule

> **Class:** C — prose-only; promotion criterion in §4 (grep gate: no version pin in `setup.d/companions.manifest` + official-installer-only).
> **Authoritative for:** how this project installs companions/external services — §1 the principle, §2 trigger, §3 the manifest mechanism, §4 promotion.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Build-vs-reuse macro discipline — see [build-first-reuse-default.md](build-first-reuse-default.md). No-paid-LLM — see [no-paid-llm-in-ci.md](no-paid-llm-in-ci.md).

> **Origin:** 2026-05-31 one-click-installer brainstorm. Maintainer principle: our installer installs only our own artefacts; companions/external services install via their own official installer, detect-first, no version pin, configured to the free-on-subscription path by default.

## §1 The principle
[State the principle + the "satellite update → installer untouched" table from spec §4.]

## §2 Trigger
When adding/changing how a companion or external service is installed by `./setup` / `install.sh`.

## §3 Mechanism
Declarative `setup.d/companions.manifest` (name | detect | install | kind) + generic engine. No version pin; official top-level installer only; free-on-subscription config (never paid-API-by-default — e.g. the aif-handoff `transport:"cli"` offer).

## §4 Promotion / retirement
Promote to a grep gate (`setup.d/companions.manifest` has no `@x.y.z` pin) at ≥3 manifest rows or first version-pin incident. Retire after 12 months with zero incidents.
```

- [ ] **Step 2: Verify principle 09 + any rule-header CI stays green**

Run: `npx vitest run packages/core/principles/09-doc-authority-hierarchy.test.ts`
Expected: PASS (the new rule carries Class + Authoritative-for header).

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/companion-install-principle.md
git commit -m "docs(rule): codify companion-install principle (official-installer, no-pin, free-default)"
```

---

## Task 8: Docs (README + runtime-bridge-setup)

**Files:**
- Modify: `README.md` (install section → point to `./setup`)
- Modify: `docs/runtime-bridge-setup.md` (Quick-start → guided-detect, runtime-agnostic)

- [ ] **Step 1: Update README install section**

Add `./setup` as the primary entry (`bash setup` / `./setup --all`); keep `install.sh` documented as the advanced/direct path.

- [ ] **Step 2: Update runtime-bridge-setup Quick-start**

Replace docker-centric wording with the §5 health-first flow (docker OR native; `/health` re-poll; transport-config offer; explicit no-UUID signal). Keep the Authoritative-for header.

- [ ] **Step 3: Lint docs**

Run: `npx markdownlint-cli2 README.md docs/runtime-bridge-setup.md`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/runtime-bridge-setup.md
git commit -m "docs(installer): ./setup as primary entry + runtime-agnostic bridge setup"
```

---

## Task 9: Full integration check + PR

**Files:** none (verification).

- [ ] **Step 1: Run the whole install-sh test suite**

Run: `for t in tests/install-sh/*.test.sh; do echo "== $t =="; bash "$t" || exit 1; done`
Expected: every test `FAIL=0`.

- [ ] **Step 2: End-to-end dry-run in a throwaway project**

```bash
cd /tmp && rm -rf e2e && mkdir e2e && cd e2e && echo '{}' > package.json
bash "$OLDPWD"/setup ts-server --dry-run
```
Expected: preflight table → framework dry-run → companion dry-run lines ("would install superpowers...") → bridge "[dry-run] would run guided-detect" → "✅ ./setup complete (dry-run)." and NO files written (`ls` shows only package.json).

- [ ] **Step 3: shellcheck the new scripts**

Run: `shellcheck setup setup.d/engine.sh setup.d/bridge-guided.sh` (warn-only; fix real issues).

- [ ] **Step 4: Open PR to staging with §1.7 forward+backward body**

Use the spec §10 §1.7 text. PR body must include `### …Forward-check applied` + `### …Backward-check applied` with file:line evidence, the capability-commit check (spec §11), and a `## 🟢 Простыми словами` tail.

```bash
git push -u origin worktree-one-click-installer
gh pr create --base staging --title "feat(setup): one-click ./setup installer (framework + companions + bridge)" --body "<§1.7 body>"
```

---

## Self-review notes (filled by plan author)

- **Spec coverage:** §2 scope → Tasks 1/2/3/5; §3 architecture → Task 5; §4 manifest+principle → Tasks 2/3/7; §5 bridge guided-detect → Task 4; §6 removals → Task 1 + SSOT Task 6; §7 testing → tests in every task + Task 9; §8 docs → Task 8; §10 §1.7 → Task 9 PR body; §11 capability-commit → Task 9. **§9 out-of-scope items (TaskMaster planning R-phase, plan-memory done.md, manifest-at-4) intentionally NOT tasked** — they are observations, surfaced for the maintainer separately.
- **Type/name consistency:** `companion_step <name> <detect> <install> <kind> <mode>` used identically in engine.sh (Task 3) and setup (Task 5); `bridge_health_ok` / `bridge_diagnose` / `bridge_guided_run` consistent across Task 4 and Task 5.
- **Known fragility flagged:** the manifest pipe-split in Task 5 Step 3 (commands contain `|`) — implementer must validate the parser against real rows before trusting it (note inline). Consider tab-delimiting if fragile.
