<!-- scope:plugin-packaging -->
# Plugin hook relocation — per-hook path-class triage (S2)

> **Scope:** the S2 reviewable artifact mandated by kickoff §5 + trap T-PLUG-B. Classifies every `.claude/hooks/*.sh` as **SHIP** (consumer-facing → relocate into `plugin/hooks/`) or **INTERNAL** (maintainer dev harness → stays out), and for each SHIP hook classifies every path it touches as **plugin-data** (`${CLAUDE_PLUGIN_ROOT}`) or **project-data** (`$CLAUDE_PROJECT_DIR`). This is the per-hook audit that trap **T-PLUG-A** demands instead of a blanket env-var swap.
>
> **Method:** read all 14 hooks (2026-06-22). Primary evidence is each hook's own `@dual-pair` / `@cc-only-rationale` channel-intent marker (dual-implementation-discipline §6) plus its actual path references and runtime dependencies.

## §1 Population (14 hooks)

`ls .claude/hooks/*.sh` → 14 files. Each carries a self-declared delivery-channel marker (dual-implementation-discipline §6) except three (`check-doc-authority.sh`, `inject-session-bootstrap.sh`, `validate-prompt.sh`) — classified by their code.

## §2 Triage table

| # | Hook | Event | Marker (self-declared) | Verdict | Why |
|---|---|---|---|---|---|
| 1 | `adopt-orchestrator-prompts.sh` | (manual) | `@cc-only-rationale: internal orchestrator coordination tooling` | **INTERNAL** | CANON↔repo orchestrator-prompts sync; maintainer-only. |
| 2 | `ask-question-reminder.sh` | PreToolUse:AskUserQuestion | `@cc-only-rationale: internal dev tooling … not shipped` | **INTERNAL** | Pre-question fork-challenge for the maintainer's session; self-declares not-shipped. |
| 3 | `check-doc-authority.sh` | PostToolUse:Edit\|Write | (none) | **INTERNAL** | Delegates to `packages/core/principles/09-…bin.ts` via `node_modules/.bin/tsx` — a plugin carries no TS toolchain, so it would only ever no-op. Its home is the **hard layer** (`install.sh` installs `packages/` + deps), not the plugin soft layer. |
| 4 | `check-hook-marker.sh` | PostToolUse:Edit\|Write | `@cc-only-rationale: PostToolUse edit-time gate` | **INTERNAL** | Enforces the framework's *own* hook-authoring discipline (`@dual-pair` markers on `.claude/hooks/*.sh`); not a consumer concern. |
| 5 | `check-kickoff-traps.sh` | PostToolUse:Edit\|Write | `@cc-only-rationale: … kickoffs are gitignored` | **INTERNAL** | Operates on `.claude/orchestrator-prompts/*/kickoff.md` — maintainer orchestration artifacts. |
| 6 | `deps-hash-check.sh` | UserPromptSubmit | `@dual-pair: deps-hash-check-dogfood` | **INTERNAL (already shipped via install.sh)** | Consumer-facing, but the SOURCE is `packages/core/hooks/deps-hash-check.sh`, **already shipped by `install.sh:261`** (hard layer). Re-shipping as a plugin hook would dual-deliver the same hook. Plugin-v2 candidate iff the `tool-bootstrapping` skill ships. |
| 7 | `end-of-turn-reminder.sh` | Stop | `@cc-only-rationale: internal dev tooling … not shipped` | **INTERNAL** | End-of-turn recap + goal-drift verdict for the maintainer's session; self-declares not-shipped; reads `$CLAUDE_PROJECT_DIR/.claude/orchestration-mode` (maintainer state). |
| 8 | `inject-matching-rule.sh` | PostToolUse:Edit\|Write | `@dual-pair: rule-path-scoping` | **SHIP** | Reads the **consumer's** `.claude/rules/*.md` `globs:`/`inject:` markers and injects a path-scoped reminder. Genuinely consumer-facing; only runtime dep is `jq` (graceful no-op without it). |
| 9 | `inject-session-bootstrap.sh` | UserPromptSubmit | (none) | **SHIP → `session-start` (S3)** | Pure `cat` content (the rules-as-tests methodology digest + `AIF_HOOK_LANG` line); zero path deps. Becomes the plugin `SessionStart` bootstrap, re-authored in S3 to point at the `using-rules-as-tests` skill. |
| 10 | `inject-subagent-digest.sh` | SubagentStart | `@cc-only-rationale: internal orchestrator hook, maintainer-env only` | **INTERNAL** | Orchestrator subagent context injection. |
| 11 | `runtime-bridge-dispatch.sh` | PostToolUse | `@cc-only-rationale: edit-time PostToolUse enforcement` | **INTERNAL** | aif-handoff runtime bridge dispatch; maintainer autonomy infra. |
| 12 | `validate-prompt.sh` | PostToolUse:Edit\|Write | (none) | **INTERNAL** | Validates batch-spec on `.claude/orchestrator-prompts/**/*.md` only; needs `tsx` + `packages/core/spec-validation`. |
| 13 | `warn-subagent-report.sh` | SubagentStop | `@cc-only-rationale: internal orchestrator hook, maintainer-env only` | **INTERNAL** | Orchestrator subagent report warning. |
| 14 | `worktree-setup.sh` | (WorktreeCreate) | `@dual-pair: worktree-create-setup` | **INTERNAL** | Sets up the maintainer's parallel-session worktrees (node_modules symlinks); dev-environment only. |

**Result: SHIP = 2** (`inject-matching-rule`, `inject-session-bootstrap`→`session-start`). **INTERNAL = 12.** This is the honest consumer-facing subset (T-PLUG-B): the plugin's session-hook value is the methodology bootstrap (S3) + the one genuinely consumer-facing rule-injector (S2). The remaining 12 are framework-TS-dependent, orchestrator-internal, or already shipped by `install.sh`.

## §3 Path-class audit for the SHIP hooks (T-PLUG-A)

### `inject-matching-rule` (relocated in S2)

| Path it touches | Class | Plugin resolution |
|---|---|---|
| its `RULES_DIR` = `<repo>/.claude/rules` | **project-data** (the consumer's rules) | `${CLAUDE_PROJECT_DIR}/.claude/rules` |
| the edited file's absolute path (`tool_input.file_path`) → `REL_PATH` stripping | **project-data** | strip `${CLAUDE_PROJECT_DIR}/` prefix |
| its session cache (`$TMPDIR/cc-rule-injector-*`) | neither (tmp) | unchanged |
| its own siblings / templates | — none — | hook sources nothing |

**Zero `${CLAUDE_PLUGIN_ROOT}` paths.** Every path is project-data. A blanket `$CLAUDE_PROJECT_DIR → ${CLAUDE_PLUGIN_ROOT}` swap (T-PLUG-A) would make the hook read the *plugin's* (non-existent) rules instead of the consumer's — breaking it. The original code resolves the repo root via `$(cd "$(dirname "$0")/../.." && pwd)`, which assumes the hook lives in the consumer repo (true after `install.sh`, false in a plugin where `$0` is `${CLAUDE_PLUGIN_ROOT}/hooks/…`). Fix: resolve the project dir as `${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}` — context-agnostic, so **one file** serves both the plugin channel and the in-repo dogfood (CC always sets `CLAUDE_PROJECT_DIR`; the fallback covers a bare invocation).

### `session-start` (authored in S3, from `inject-session-bootstrap`)

Pure content emission — no path-class audit needed. Listed here for completeness; its `hooks.json` `SessionStart` entry is added in S3 when the file lands (kept out of S2's `hooks.json` to avoid a dangling reference).

## §4 Drift note (dual-implementation-discipline §7/§8)

`plugin/hooks/inject-matching-rule` is the **relocated channel** of `.claude/hooks/inject-matching-rule.sh`; it carries a `# spec:` pointer back to that source. The only divergence is the project-dir resolution line (the relocation itself) and the extensionless filename — the glob-match + inject logic is identical. The S6 manifest-integrity self-test is the natural home for a byte-level drift guard between the two (parallel to `deps-hash-check.test.ts`); flagged there, not built in S2.
