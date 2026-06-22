# CC plugin packaging (superpowers-style, hybrid) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship rules-as-tests-aif as a Claude-Code-first plugin installable from an in-repo marketplace (soft layer: skills/agents/session-hooks auto-triggering via a `using-rules-as-tests` bootstrap) + a `/rules-as-tests:install-enforcement` command that bridges to the bundled `install.sh` hard layer. Degrade gracefully to non-CC (OpenCode). Enforce the packaging with its own principle test. **No regression to existing `install.sh`.**

**Architecture:** A dedicated `plugin/` payload subtree (so the maintainer-internal `.claude/` dev harness never ships) addressed by an in-repo `.claude-plugin/marketplace.json`. Session hooks use `${CLAUDE_PLUGIN_ROOT}` for plugin-data and `$CLAUDE_PROJECT_DIR` for consumer-data (per-hook audit, not a blanket swap). The hard layer (git-hooks/CI) is reached only through the `/install-enforcement` command running the bundled installer. Adopted verbatim-where-allowed from superpowers (`plugin.json`, `hooks.json` SessionStart, `run-hook.cmd`, the bootstrap-skill mechanism).

**Tech Stack:** JSON manifests, Bash (`set -euo pipefail`) hooks, extensionless hook scripts + polyglot `run-hook.cmd`, one TypeScript Vitest principle test (`packages/core/principles/`), `tests/` custom PASS/FAIL harnesses. No paid LLM.

**Spec:** [`docs/superpowers/specs/2026-06-22-cc-plugin-packaging-design.md`](../specs/2026-06-22-cc-plugin-packaging-design.md). **Read it first; this plan implements its §9 stage map and does not re-derive the architecture.**

**Repo:** all paths relative to `rules-as-tests-aif` root. Branch from `staging` via `bash scripts/create-worktree.sh plug-<stage>-<name>` (parallel-subwave-isolation.md). PR base = `staging`. Each Task ≈ one stage = its own PR; stage-gate between.

**AI-laziness traps (kickoff §4):** T3, T5, T11, T13, T15, T16, T19 + domain T-PLUG-A (no blanket `$CLAUDE_PROJECT_DIR`↔`${CLAUDE_PLUGIN_ROOT}` swap), T-PLUG-B (ship only the consumer-facing subset).

---

## Task 0: Prior-art SSOT + worktree (S0)

**Files:**
- Modify: `docs/meta-factory/prior-art-evaluations.md` (append entries)
- Env: git worktree

- [ ] **Step 1: Worktree off staging** — `bash scripts/create-worktree.sh plug-s0-ssot`. Expected: worktree on `worktree-plug-s0-ssot` off refreshed `origin/staging`.
- [ ] **Step 2: Append ≥3 SSOT entries** (each with `Verdict` / `Rationale` / `Trigger to revisit`, per prior-art-evaluations.md §3):
  - superpowers plugin+marketplace schema — **ADOPT** (official CC format; verbatim shape; trigger: CC schema change).
  - superpowers `run-hook.cmd` polyglot wrapper — **ADOPT (audited)** (Windows/Unix + extensionless dodge; trigger: CC drops the Windows `.sh`-auto-bash quirk).
  - superpowers `using-superpowers` bootstrap — **ADAPT** (their mechanism, our content; trigger: SessionStart contract change).
  - CC `plugins-reference` docs — **REFERENCE**.
- [ ] **Step 3: Verify** — `npx vitest run packages/core/principles/08-prior-art-cited.test.ts`. Expected: green (no broken `#<id>` refs).
- [ ] **Step 4: Commit** — `docs(plugin): prior-art SSOT entries for CC plugin packaging`. Trailer: `Prior-art: prior-art-evaluations.md#<new-ids> (this commit IS the SSOT entry).`

## Task 1: Plugin skeleton + in-repo marketplace (S1)

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Create: `plugin/hooks/run-hook.cmd`, `plugin/.gitkeep` tree (`plugin/{hooks,skills,agents,commands,install}/`)
- Test: `tests/plugin/manifest-valid.test.sh` (create)

- [ ] **Step 1: Write the failing test** — `tests/plugin/manifest-valid.test.sh`:
```bash
#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0; ok(){ PASS=$((PASS+1)); echo "  ✓ $1"; }; bad(){ FAIL=$((FAIL+1)); echo "  ✗ $1"; }
P="$REPO_ROOT/.claude-plugin/plugin.json"; M="$REPO_ROOT/.claude-plugin/marketplace.json"
python3 -c "import json,sys; json.load(open('$P'))" 2>/dev/null && ok "plugin.json parses" || bad "plugin.json invalid"
python3 -c "import json,sys; json.load(open('$M'))" 2>/dev/null && ok "marketplace.json parses" || bad "marketplace.json invalid"
PV=$(python3 -c "import json;print(json.load(open('$P'))['version'])" 2>/dev/null)
MV=$(python3 -c "import json;print(json.load(open('$M'))['plugins'][0]['version'])" 2>/dev/null)
[ -n "$PV" ] && [ "$PV" = "$MV" ] && ok "version parity ($PV)" || bad "version drift: plugin=$PV marketplace=$MV"
[ -x "$REPO_ROOT/plugin/hooks/run-hook.cmd" ] && ok "run-hook.cmd present+exec" || bad "run-hook.cmd missing/not exec"
echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```
- [ ] **Step 2: Run → fails** (`bash tests/plugin/manifest-valid.test.sh`).
- [ ] **Step 3: Write `plugin.json`:**
```json
{
  "name": "rules-as-tests",
  "description": "Rules-as-Tests: turn any codebase convention into an executable test that fails at the earliest reachable channel. Skills, sub-agents, session hooks + an opt-in command to wire git-hook/CI enforcement.",
  "version": "0.1.0",
  "author": { "name": "rules-as-tests-aif contributors" },
  "homepage": "https://github.com/<user>/rules-as-tests-aif",
  "repository": "https://github.com/<user>/rules-as-tests-aif",
  "license": "MIT",
  "keywords": ["rules", "tests", "enforcement", "eslint", "discipline", "ai-agnostic"]
}
```
- [ ] **Step 4: Write `marketplace.json`** — **VERIFY the same-repo `source` key against [plugins-reference](https://docs.claude.com/en/docs/claude-code/plugins-reference) BEFORE writing (T3 — do not guess).** Expected shape (confirm `source` form):
```json
{
  "name": "rules-as-tests-aif",
  "owner": { "name": "rules-as-tests-aif contributors" },
  "metadata": { "description": "Rules-as-Tests plugin", "version": "0.1.0" },
  "plugins": [
    {
      "name": "rules-as-tests",
      "source": "./plugin",
      "description": "Core: rules-as-tests skill, sub-agents, session hooks, enforcement-install command",
      "version": "0.1.0",
      "strict": true
    }
  ]
}
```
- [ ] **Step 5: Adopt `run-hook.cmd`** — copy superpowers' `hooks/run-hook.cmd` verbatim into `plugin/hooks/run-hook.cmd`, `chmod +x`. **Read every line (T13)**; add `tests/plugin/run-hook.test.sh` asserting the Unix `exec bash` path resolves a named script and the missing-arg path exits 1.
- [ ] **Step 6: Run → passes** (`PASS=4 FAIL=0`).
- [ ] **Step 7: Real load smoke (T3/T19)** — in a throwaway dir: `/plugin marketplace add <abs-path-to-repo>` then `/plugin install rules-as-tests@rules-as-tests-aif`; capture output proving zero schema errors. Record the exact command + output in the PR body.
- [ ] **Step 8: Commit** — `feat(plugin): plugin.json + in-repo marketplace + run-hook.cmd skeleton`. Trailer: `Prior-art: prior-art-evaluations.md#<id> (superpowers plugin/marketplace ADOPT; run-hook.cmd ADOPT-audited).`

## Task 2: Hook relocation — per-hook path-class audit (S2)

**Files:**
- Create: `plugin/hooks/hooks.json`, `plugin/hooks/<relocated extensionless scripts>`
- Create: `docs/superpowers/plans/plugin-hook-triage.md` (the audit table — a reviewable artifact)
- Test: `tests/plugin/hook-paths.test.sh` (create)

- [ ] **Step 1: Triage table (T-PLUG-A + T-PLUG-B).** Enumerate **all 14** `.claude/hooks/*.sh` (population-first, T10) and classify each: **SHIP** (consumer-relevant) vs **INTERNAL** (do not ship); and for each SHIP hook, classify every path it references as **plugin-data** (`${CLAUDE_PLUGIN_ROOT}`) or **project-data** (`$CLAUDE_PROJECT_DIR`). Write the table to `plugin-hook-triage.md`. The full 14, with a starting classification (confirm each):
  - **INTERNAL (do not ship):** `adopt-orchestrator-prompts.sh`, `runtime-bridge-dispatch.sh`, `worktree-setup.sh`, `check-kickoff-traps.sh` (gates `orchestrator-prompts/`), `check-hook-marker.sh` (dual-impl marker gate, maintainer-repo), `deps-hash-check.sh` (internal dev), `inject-subagent-digest.sh` / `warn-subagent-report.sh` (orchestration-internal — confirm).
  - **SHIP candidates:** `inject-session-bootstrap.sh` (→ the bootstrap injector, project+plugin mix), `inject-matching-rule.sh` (reads **consumer** `.claude/rules/` → project-data), `check-doc-authority.sh` (audits **consumer** files → project-data), `validate-prompt.sh`, `ask-question-reminder.sh`, `end-of-turn-reminder.sh`.
- [ ] **Step 2: Write the failing test** — `tests/plugin/hook-paths.test.sh`: for every script under `plugin/hooks/` (excluding `run-hook.cmd`), assert (a) no plugin-data reference hardcodes `$CLAUDE_PROJECT_DIR/.claude/hooks/` (that's a relocation bug), (b) the file is extensionless, (c) it self-resolves its own dir via `$(cd "$(dirname "$0")" && pwd)` if it sources siblings, (d) it carries a `@dual-pair`/`@cc-only-rationale` marker (dual-implementation §6).
- [ ] **Step 3: Run → fails** (nothing relocated yet).
- [ ] **Step 4: Relocate the SHIP hooks** — copy into `plugin/hooks/` with **extensionless** names; rewrite paths per the triage (plugin-data → `${CLAUDE_PLUGIN_ROOT}`, project-data stays `$CLAUDE_PROJECT_DIR`); add the dual-pair marker. **Do NOT sed-swap globally (T-PLUG-A).**
- [ ] **Step 5: Write `plugin/hooks/hooks.json`** — map events through `run-hook.cmd` (superpowers pattern):
```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|clear|compact",
        "hooks": [ { "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start", "async": false } ] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [ { "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" inject-matching-rule" } ] }
    ]
  }
}
```
(Final event set = whatever the triage marks SHIP. `session-start` is authored in Task 3.)
- [ ] **Step 6: Run → passes.**
- [ ] **Step 7: Real-fire smoke (T19)** — install the plugin into a throwaway repo, trigger an `Edit`, confirm the relocated hook fires and resolves both env vars correctly. Capture output.
- [ ] **Step 8: Commit** — `feat(plugin): relocate shippable hooks to plugin payload (path-class audit)`.

## Task 3: `using-rules-as-tests` bootstrap + skills (S3 — parallel w/ Task 4)

**Files:**
- Create: `plugin/skills/using-rules-as-tests/SKILL.md`, `plugin/hooks/session-start`
- Copy: `skills/rules-as-tests/` + `skills/tool-bootstrapping/` → `plugin/skills/`
- Test: `tests/plugin/bootstrap.test.sh`

- [ ] **Step 1: Worktree** `bash scripts/create-worktree.sh plug-s3-skills`.
- [ ] **Step 2: Author `using-rules-as-tests/SKILL.md`** (ADAPT superpowers `using-superpowers` — our content). MUST encode the instruction-priority ladder (user CLAUDE.md/AGENTS.md > skills > system) and «invoke relevant skills before responding». Keep our voice; do not copy their skill list.
- [ ] **Step 3: Author `plugin/hooks/session-start`** (extensionless, run via `run-hook.cmd`) — emits the bootstrap context that points the agent at the `using-rules-as-tests` skill. Self-resolves its dir; uses `${CLAUDE_PLUGIN_ROOT}`.
- [ ] **Step 4: Copy the consumer-facing skill(s)** into `plugin/skills/`. **Pre-decided (m1):** ship only `rules-as-tests` in v1 — it is the sole skill declared in `extension.json`. `tool-bootstrapping` stays OUT of v1 (promote to a follow-up only if a need surfaces); do not leave this as a worker judgment call.
- [ ] **Step 5: Test** — `bootstrap.test.sh`: assert `session-start` exits 0 and prints a non-empty bootstrap mentioning `using-rules-as-tests`; assert each `plugin/skills/*/SKILL.md` has valid frontmatter (`name`+`description`).
- [ ] **Step 6: Real session smoke (T19)** — fresh session in a throwaway repo with the plugin installed surfaces the bootstrap on `startup`; `rules-as-tests` is invocable via the Skill tool. Capture transcript snippet.
- [ ] **Step 7: Commit** — `feat(plugin): using-rules-as-tests bootstrap + shippable skills`.

## Task 4: Consumer-facing agents (S4 — parallel w/ Task 3)

**Files:**
- Copy: consumer-facing agent subset → `plugin/agents/`
- Test: extend/run `packages/core/principles/21-shipped-agent-tools-valid.test.ts`

- [ ] **Step 1: Worktree** `bash scripts/create-worktree.sh plug-s4-agents`.
- [ ] **Step 2: Triage agents (T-PLUG-B).** SHIP: `review-sidecar.md`, `living-docs-auditor.md` (both **declared in `extension.json`**) + `compliance-verifier.md` (consumer-facing per CLAUDE.md Artifact Ownership Contract but **NOT** in `extension.json` — so this step must **add it to `extension.json`**; do not claim «per extension.json» until then). INTERNAL (do not ship): `aif-init.md`, `manual-rule-liveness-prober.md`, `memory-codification-auditor.md`, `orchestrator-worker-discipline.md`, `shipped-agent-liveness-prober.md` — confirm each against the contract; record the call.
- [ ] **Step 3: Copy the SHIP subset** into `plugin/agents/`.
- [ ] **Step 4: Run `21-shipped-agent-tools-valid.test.ts`** — `npx vitest run packages/core/principles/21-shipped-agent-tools-valid.test.ts` (full filename — slot 21 is shared with `21-agnosticism-conformance.test.ts`); ensure it covers `plugin/agents/` (extend its glob if needed). Expected: green; no unresolvable tool names (the #551 class).
- [ ] **Step 5: Commit** — `feat(plugin): ship consumer-facing agent subset`.

## Task 5: Hybrid seam — `/install-enforcement` (S5)

**Files:**
- Create: `plugin/commands/install-enforcement.md`, `plugin/skills/installing-enforcement/SKILL.md`
- Bundle: `plugin/install/` ← `install.sh` + `templates/` + `setup.d/` (copied, not symlinked)
- Test: `tests/plugin/install-seam.test.sh`

- [ ] **Step 1: Worktree** `bash scripts/create-worktree.sh plug-s5-seam`.
- [ ] **Step 2: Bundle the installer** — copy `install.sh` + `templates/` into `plugin/install/` (a copy — the plugin must be self-contained when installed). Note in the spec that this copy is kept in sync by the Task 6 self-test (version/hash check).
- [ ] **Step 3: Author `commands/install-enforcement.md`** — a slash command that: runs `${CLAUDE_PLUGIN_ROOT}/install/install.sh <stack> --dry-run` against `$CLAUDE_PROJECT_DIR`, shows the diff, then asks `[y/N]` before the real run. Consent-gated; dry-run first.
- [ ] **Step 4: Author `installing-enforcement/SKILL.md`** (gerund, superpowers house style) — documents WHEN to wire the hard layer + the soft/hard boundary (T16).
- [ ] **Step 5: Test** — `install-seam.test.sh`: in a throwaway repo, `install.sh --dry-run` via the bundled copy writes nothing and exits 0; a non-dry run creates `.husky/` + the CI workflow. Use the existing `tests/install-sh/` harness style.
- [ ] **Step 6: Commit** — `feat(plugin): /install-enforcement seam to bundled installer`. Trailer: `Prior-art: prior-art-evaluations.md#<id> (companion-install-principle: own installer installs own artefacts).`

## Task 6: Recursive self-test (S6)

**Files:**
- Create: `packages/core/principles/24-plugin-manifest-integrity.test.ts` (confirm 24 is the lowest free slot at write time)
- Create: `tests/fixtures/plugin-broken-manifest/` (paired-negative fixture)

- [ ] **Step 1: Worktree** `bash scripts/create-worktree.sh plug-s6-selftest`.
- [ ] **Step 2: Write the principle test** asserting on the real `.claude-plugin/` + `plugin/`:
  - every skill/agent/command referenced by `plugin.json`/`marketplace.json` exists on disk;
  - `plugin.json.version` === `marketplace.json.plugins[0].version`;
  - no `plugin/hooks/*` plugin-data path hardcodes `$CLAUDE_PROJECT_DIR/.claude/hooks/` (relocation correctness);
  - every `plugin/hooks/*` (non-`.cmd`) carries `@dual-pair`/`@cc-only-rationale`;
  - the bundled `plugin/install/install.sh` matches the root `install.sh` (hash/version — no silent drift).
- [ ] **Step 3: Paired-negative fixture** — `tests/fixtures/plugin-broken-manifest/` with a deliberately broken manifest (missing skill ref + version drift); a test case asserts the integrity logic **fails** on it (guards the gate, per `discipline-self-check.yml` precedent — T15).
- [ ] **Step 4: Run** — `npx vitest run packages/core/principles/24-plugin-manifest-integrity.test.ts`. Expected: green on real tree, red on fixture.
- [ ] **Step 5: Doc-authority** — ensure the new spec carries Class/Authoritative-for headers; run `npx vitest run packages/core/principles/09-doc-authority-hierarchy*`.
- [ ] **Step 6: Commit** — `test(plugin): principle 24 — plugin manifest integrity + paired-negative`. Trailer: `Prior-art: skipped — principle test for existing capability, no new external dependency.`

## Task 7: OpenCode adapter (S7)

**Files:** Create `.opencode/INSTALL.md`; reconcile `extension.json` + `AGENTS.md`.

- [ ] **Step 1: Worktree** `bash scripts/create-worktree.sh plug-s7-opencode`.
- [ ] **Step 2: Author `.opencode/INSTALL.md`** (superpowers OpenCode pattern: «fetch + follow») pointing at the shared `plugin/skills/`. Document the accepted degradation: SessionStart auto-injection may not fire → the `using-rules-as-tests` skill is read on demand (dual-implementation §3 posture).
- [ ] **Step 3: Reconcile** `extension.json` (point its skill/agent paths at `plugin/`) + note the cross-harness instruction layer already in `AGENTS.md`.
- [ ] **Step 4: Commit** — `feat(plugin): OpenCode degradation adapter`.

## Task 8: Docs + publish + integration (S8 — last)

**Files:** `README.md` (install section), version bump, `.claude/orchestrator-prompts/plugin-packaging/done.md`.

- [ ] **Step 1: Worktree** `bash scripts/create-worktree.sh plug-s8-integration`.
- [ ] **Step 2: README install section** — superpowers-style per-harness (Claude Code marketplace-add/install + `/install-enforcement`; OpenCode fetch-and-follow). **State the soft/hard boundary explicitly (T16).**
- [ ] **Step 3: Version bump** `plugin.json` + `marketplace.json` in lockstep (the Task 6 test enforces parity).
- [ ] **Step 4: Full e2e (T19, own cold-QA BEFORE handoff)** — throwaway repo: `/plugin marketplace add .` → `/plugin install` → skills active → `/install-enforcement` dry-run wires nothing, real run wires `.husky`+CI. Capture the whole transcript in the PR body.
- [ ] **Step 5: Write `done.md`** per CLAUDE.md Umbrella closure convention (`Final PR`, `Closed`, `Summary`).
- [ ] **Step 6: Integration PR to `staging`** with §1.7 forward+backward, capability-commit `Prior-art:` trailers, and `## 🟢 Простыми словами`.

---

## Stage-gate (between every Task)

```bash
gh pr list --search "is:merged head:worktree-plug-<stage> base:staging" --json number,title,mergedAt --limit 10
```
Prior stage not merged → HALT. Then Phase -1 cold-review (Agent, read-only, `reviewer-discipline.md §2`) → GO/REVISE/STOP.

## Done when

`/plugin marketplace add <user>/rules-as-tests-aif` → `/plugin install rules-as-tests@rules-as-tests-aif` makes skills/agents/session-hooks live with the bootstrap auto-triggering; `/rules-as-tests:install-enforcement` opt-in-wires the hard layer into the current repo; principle 24 + paired-negative are green; `install.sh` unchanged in behaviour; README states the boundary honestly.
