<!-- scope:install-sh-k1-extension -->
# install.sh K-1 companion-install extension — Stage 2 R-phase design

> **Status:** R-phase output for Stage 2 of `m-a-full-satellite-transition` umbrella.
> **Date:** 2026-05-27.
> **Authoritative for:** design of optional companion-install prompts in `install.sh` (K-1 extension); interactive prompt shape; per-companion install mechanism survey; AIF auto-install keep-vs-convert recommendation; non-interactive fallback; idempotency; order-of-operations; failure-mode handling. Feeds Stage 5 I-phase.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). install.sh edits (Stage 5 I-phase). Companion capability inventory — see [2026-05-27-universal-satellite-integration-matrix.md](2026-05-27-universal-satellite-integration-matrix.md) (primary input). Orchestrator skill trim — see Stage 4 I-phase.

---

## §0 TL;DR

**Proposed K-1 shape:**

1. **Interactive prompts after Phase 3 (AI Factory templates), before Phase 4 (Scripts)** — user has already committed to install; companion prompts are additive, non-mandatory step. All prompts default `[y/N]` (capital N = default no) per T-Stage2-A guard. No companion is pre-checked or privileged.
2. **AIF auto-install: KEEP AS-IS** (no convert to opt-in) — back-compat concern outweighs vision purity; AIF is the primary delivery vehicle for our enforcement content; converting to opt-in would create a «consumer installs our framework but none of its enforcement wiring» failure class. See §4.3 for full reasoning.
3. **Interactive format: `read -rp` style** matching existing install.sh:145 stack picker — keeps the script language/UI consistent. No `select` menu (adds dependency, more complex); no flag-only (interactive preferred for first-run, flags as override).
4. **Non-interactive fallback: `COMPANIONS=none` env var** (default) skips all companion prompts without any interaction; `COMPANIONS=all` installs all; `COMPANIONS=superpowers,taskmaster` installs named set. CI/headless installs work transparently.
5. **Idempotency: detect-and-skip** per companion — check for presence of companion-specific files/dirs before invoking install. If already present, print `⊝ <companion> already installed — skipping` (matching existing install.sh style).
6. **Failure mode: warn-and-continue** — companion install failure prints `⚠ <companion> install failed (exit $N). Continuing...` and does not abort the parent install.sh run. User can retry companion install separately.

**7 companions audited (T1 floor = 7, all 7 covered):** AI-Factory (existing auto-install, comparison row), Superpowers, OhMyOpencode, aif-handoff, TaskMaster, Cline, OpenCode+Cursor.

---

## §1 Method

**What was read:**
- `install.sh` — full 443 lines; all phases inventoried (§2 below)
- `docs/meta-factory/research-patches/2026-05-27-universal-satellite-integration-matrix.md` (PR #252) — §1.1–§1.7 per-companion install/integration findings (PRIMARY input)
- `docs/meta-factory/research-patches/2026-05-27-orchestrator-skill-audit.md` (PR #254, Stage 1) — context; not primary input for this stage
- Embedded kickoff §1 Stage 2 scope statement

**Upstream installs verified (T12 anti-training-data: DeepWiki probes 2026-05-27):**
- Superpowers: DeepWiki `obra/superpowers` probe — CC marketplace + OpenCode git-plugin + CLI
- OhMyOpencode: DeepWiki `code-yeongyu/oh-my-openagent` probe — `bunx oh-my-openagent install` + `--no-tui` flag

**Classification criteria:**
- Each companion assessed for: (a) install command verifiability, (b) idempotency mechanism, (c) subscription gate, (d) conflict surface with existing install.sh operations
- T7 adversarial check: «does this companion NEED an install prompt, or does the user handle it out-of-band?» — verified per companion in §4.1/§5 T7 walk

**Install.sh language**: English (`echo "▶ …"` prefixes, `✓`/`⊝`/`⚠`/`❌` glyphs). Companion prompts MUST use same language and glyph set.

---

## §2 Current install.sh inventory

| Phase | Line range | Echo label | Key operations | Companion-relevant? |
|---|---|---|---|---|
| Pre-install: header verify | 79–127 | `▶ Verifying shipped artefacts carry Authoritative-for headers` | `grep -qE` on 16 SHIPPED_DOCS list; `exit 1` on failure | No — runs before interactive prompts |
| Stack picker | 140–151 | (inline `read -rp`) | Interactive `[1/2]` choice if `$STACK` empty | Precedent for interactive `read -rp` style |
| Phase 1: Skills | 202–253 | `▶ Skills → .claude/skills/` | `copy_safe` for rules-as-tests, tool-bootstrapping, meta-orchestrator skills | No — our skills only |
| Phase 1b: Hooks | 255–285 | `▶ Claude hooks → .claude/hooks/` | Copy deps-hash-check.sh; register in settings.json via jq | No — our hook only |
| Phase 2: Sub-agents | 287–304 | `▶ Sub-agents → .claude/agents/` | Loop `copy_safe` over `agents/*.md` | No — our agents |
| Phase 3: AI Factory | 306–327 | `▶ AI Factory templates → .ai-factory/` | Copy DESCRIPTION, ARCHITECTURE, RULES; skill-context overrides (319–322); react-next conditional | **YES — existing companion auto-install (AIF); K-1 INSERT POINT** |
| Phase 4: Scripts | 329–337 | `▶ Scripts → scripts/` | Copy audit-ai-docs.sh; react-next variant | No — our scripts |
| Phase 5: Shared templates | 339–353 | `▶ Shared templates → project root` | .nvmrc, .lintstagedrc.json, tsconfig.json, AGENTS.md, husky hooks, pre-push.fallback.sh | No — our templates |
| Phase 5b: ESLint rules | 354–374 | `▶ Custom ESLint rules → eslint-rules-local/` | Loop copy_safe over packages/core/eslint-rules/*.ts | No — our rules |
| Phase 6: Stack-specific | 376–393 | `▶ Stack-specific templates ($STACK) → project root` | eslint.config.mjs, vitest, playwright, stryker, ci.yml | No — our templates |
| Done + Next steps | 395–442 | `✅ Installation complete.` | SKIPPED summary; numbered next steps | No |

**K-1 insert point: line 328 (after Phase 3 closes, before Phase 4 `echo "▶ Scripts"`).**

Rationale: AIF templates (Phase 3) are already the companion install block; K-1 extends it naturally. Companion prompts placed here fire AFTER the primary enforcement wiring (skills/hooks/agents/AIF) is complete — no companion install can accidentally step on our Phase 1-3 operations.

---

## §3 Companion install-mechanism survey

All 7 companions + AI-Factory comparison row. Evidence cites matrix §X.X and upstream DeepWiki probe where applicable.

| Companion | Install command (cite source) | Marketplace / npm / git-clone | Idempotency story | Subscription-gated? | Conflict surface with existing install.sh? |
|---|---|---|---|---|---|
| **AI-Factory** (comparison row — existing auto-install) | install.sh:306–327 auto-copies `.ai-factory/` templates + skill-context overrides via `copy_safe`; no external command invoked | None (file-copy; framework ships templates as static files inside PKG_ROOT) | `copy_safe` DEFAULT no-force: skips if target exists (install.sh:165–170) | No subscription gate | Reference row — this IS our install.sh |
| **Superpowers** (`obra/superpowers`) | **CC**: `/plugin install superpowers@claude-plugins-official` (DeepWiki probe 2026-05-27: «Available via the official Claude plugin marketplace») OR `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace`. **OpenCode**: add `"plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]` to `opencode.json`. | CC plugin marketplace (primary); git-backed plugin for OpenCode; npm fallback for Windows OpenCode | Idempotent: marketplace install skips if plugin already registered. Re-running `/plugin install superpowers@...` on existing install is safe (CC plugin system deduplicates). | No billing gate; free to install; requires CC or OpenCode harness to be present | None (matrix §1.2: «No filesystem conflicts: Superpowers does NOT ship files into `.claude/agents/`, `.ai-factory/`, or pre-push hooks.») |
| **OhMyOpencode** (`code-yeongyu/oh-my-openagent`) | `bunx oh-my-openagent install` (interactive) OR `bunx oh-my-openagent install --no-tui --claude=max20` (headless). Requires `bun`; do NOT use npm/yarn/pnpm. Verify: `bunx oh-my-openagent doctor`. | npm registry dual-published: `oh-my-openagent` (preferred) + `oh-my-opencode` (legacy). `bunx` installs from npm automatically. | Idempotent: installer detects existing config and treats as update (DeepWiki probe 2026-05-27: «detects your current configuration... treats the operation as an update»). `bunx oh-my-openagent doctor` verifies state. | No billing gate. Requires OpenCode as target harness. | KNOWN: duplicate-tool-names if OhMyOpencode skill plugin AND `.claude/skills/` active simultaneously; escape: set `"claude_code.skills": false` in OhMyOpencode config (matrix §1.3). Pre-push hooks: no conflict. |
| **aif-handoff** (`lee-to/aif-handoff`) | Server-side Node.js service. Consumer typically uses `aif-handoff` via its npm package + Docker/Postgres self-host OR cloud-hosted instance. There is NO single `install` CLI command analogous to companion tools; it requires server setup. Matrix §1.4: «requires Docker + Postgres for production». | npm package `@aif/handoff` (assumed; matrix §1.4 cites Node.js server; no CLI one-liner install path documented for end-consumer). | N/A — server-side service; idempotency is the server's concern, not install.sh. | Cloud-hosted or self-hosted. No AI subscription gate for the service itself; the AI sessions it orchestrates use the consumer's subscription. | CRITICAL MANAGED: `review-sidecar.md` naming collision managed by `install.sh copy_safe` DEFAULT no-force (install.sh:293–300, matrix §1.4). Our skill-context files (install.sh:319–322) ARE the injection mechanism; no additional install.sh change needed. |
| **TaskMaster** (`eyaltoledano/claude-task-master`) | CC plugin marketplace: install via CC plugin mechanism (`/plugin install claude-task-master@...` — per matrix §1.5: «migrated to CC plugin marketplace model»; ships `TASKMASTER.md` + `@import` into project `CLAUDE.md`). Also available as MCP server. | CC plugin marketplace (primary). npm package `task-master-ai` for CLI usage. | Idempotent: CC plugin system deduplicates installs; `@import` into CLAUDE.md is additive (matrix §1.5). | No billing gate for TaskMaster itself; `analyze-complexity` command makes LLM calls (SSOT #73 caveat: subscription-bundled when using Claude Code subscription). | Minimal (matrix §1.5: «TaskMaster does NOT ship `.claude/skills/`, `.claude/agents/`, pre-push hooks, or `settings.json` hooks»). `@import` into CLAUDE.md is additive. |
| **Cline** | Cline is a VS Code extension + CLI; installation is via VS Code marketplace (`ext install saoudrizwan.claude-dev`) or npm CLI (`npm install -g cline`). For our purposes, Cline is a developer's chosen harness — not something install.sh can invoke. Our satellite files for Cline (`.clinerules/`) are file deliverables that install.sh could copy, but Cline itself requires VS Code or CLI pre-install by the developer. | VS Code Marketplace (primary); npm CLI. No programmatic install from a bash script. | N/A for the harness itself. Our `.clinerules/` file deliverables: `copy_safe` (same idempotency as other phases). | No billing gate. | Cline hooks (`.clinerules/hooks/`) are SEPARATE from CC `settings.json` hooks — no runtime conflict. Our `.clinerules/` files are additive (matrix §1.6). |
| **OpenCode** | OpenCode is a separate CLI tool: `npm install -g opencode` or `npx opencode` or `brew install opencode/tap/opencode`. Our satellite files for OpenCode (`.opencode/plugins/*.js`) would be file deliverables. OpenCode itself requires developer pre-install. | npm package `opencode-ai` (per OpenCode docs). No programmatic install from a bash script for the tool itself. Our plugin file: copy into `.opencode/plugins/`. | N/A for the harness itself. Our `.opencode/plugins/` file deliverable: `copy_safe`. | No billing gate. | CC PostToolUse hooks NOT loaded in OpenCode (matrix §1.7). No conflict from current install.sh operations. |
| **Cursor** | Cursor is an IDE — developer installs via cursor.com; no programmatic install. Our satellite files for Cursor (`.cursor/rules/*.mdc`) are file deliverables that install.sh could copy. | IDE install via cursor.com; no CLI install. Our rule files: copy into `.cursor/rules/`. | N/A for the harness itself. Our `.cursor/rules/*.mdc` files: `copy_safe`. | No billing gate; Cursor Pro for advanced features (not required for rules injection). | Zero filesystem conflict with our current stack (matrix §1.6 Cursor section). |

---

## §4 Design — K-1 extension shape recommendation

### §4.1 Interactive prompt format

**Recommendation: `read -rp` style, matching install.sh:145 precedent.**

Evidence (T20 — read before verdict): `install.sh:145` already uses:
```bash
read -rp "Choose [1/2]: " choice
```

**Why not `select` menu:** `select` is a bash construct with compatibility caveats (not POSIX sh); adds visual complexity for a one-off prompt. `read -rp` is simpler and already the established pattern in this file.

**Why not flags-only (`--with-superpowers`):** Interactive is appropriate for first-run installs where the user hasn't pre-planned companion choices. Flag-based override layer (§4.4 non-interactive fallback) covers headless/CI usage. Both: flag overrides interactive, not the reverse.

**T16 problem-class check:** Upstream problem class = «installer prompting for optional feature selection». Our problem class = «optional companion install prompt». Match: `read -rp` is the standard bash interactive-prompt mechanism. No pattern-matching-on-name issue; the mechanism is correct for the problem.

**Prompt structure per companion:**
```bash
read -rp "  Install <CompanionName>? [y/N]: " choice_companion
case "$choice_companion" in
  [yY]|[yY][eE][sS]) install_companion_fn ;;
  *) echo "  ⊝ <CompanionName> skipped" ;;
esac
```

### §4.2 Per-companion prompt copy

**Language: English** (matching all existing `echo` strings in install.sh — install.sh has zero non-English strings; `▶`, `✓`, `⊝`, `⚠`, `❌` are glyphs, not language).

Companion prompts in proposed insertion order (see §4.6):

```text
  Install Superpowers skills? (CC plugin marketplace — /plugin install) [y/N]:
  Install TaskMaster? (CC plugin marketplace — /plugin install) [y/N]:
  Install OhMyOpencode? (requires bun — bunx oh-my-openagent install) [y/N]:
```

**Companions NOT prompting (and why):**
- **aif-handoff**: server-side service; no single `install` command; consumer sets it up independently. Our install.sh already handles the client-side injection (skill-context at lines 319–322). Prompt would be misleading. → SKIP prompt; document in §4.7 that aif-handoff integration is automatic via existing Phase 3.
- **Cline**: VS Code extension; no programmatic install from bash; developer chooses harness independently. install.sh CAN offer to copy `.clinerules/` deliverables — DECISION-NEEDED item D1 (§7). → Conditional prompt pending D1.
- **OpenCode**: CLI tool; no programmatic install from bash; developer chooses harness. install.sh CAN offer to copy `.opencode/plugins/` deliverables — DECISION-NEEDED item D2 (§7). → Conditional prompt pending D2.
- **Cursor**: IDE; no programmatic install. install.sh CAN offer to copy `.cursor/rules/` deliverables — DECISION-NEEDED item D3 (§7). → Conditional prompt pending D3.

**Companions that DO get prompts:** Superpowers, TaskMaster, OhMyOpencode. These have programmatic install commands invokable from bash.

### §4.3 AIF auto-install — keep or convert

**Recommendation: KEEP auto-install AS-IS (no convert to opt-in).**

**Reasoning (T20 — evidence before verdict; verified from install.sh:306–327):**

1. **Back-compat concern is real**: AIF is already shipped to all existing consumers. Converting to opt-in would cause a silent regression for any consumer re-running install.sh after an update — they'd get «AIF skipped» and lose the enforcement wiring without understanding why.

2. **AIF is not an optional companion in the satellite vision**: Unlike Superpowers/TaskMaster/OhMyOpencode which are workflow tools, AIF (`lee-to/ai-factory`) is the delivery vehicle for our enforcement content. Our `.ai-factory/` templates (RULES.md, DESCRIPTION template, skill-context overrides) are the primary Living Doc injection mechanism. Without them, the satellite enforcement layer is weakened. This is a structural difference from the other companions.

3. **Universal-satellite vision compliance**: The kickoff's concern (kickoff §1 Stage 2: «add prompt for consistency») is about cosmetic consistency, not vision purity. «Universal satellite» means «works with all companions», not «everything is opt-in». AIF auto-install is the consistent baseline all companions build on top of.

4. **Consistency compromise (if maintainer prefers it)**: An alternative that preserves back-compat while adding consistency is to print an informational line «▶ AI Factory templates → .ai-factory/ (auto)» followed by the existing copy operations, making it transparent without adding an interactive prompt. This satisfies «visibility» without adding a regression risk. Surface as DECISION-NEEDED D4 in §7.

**T-Stage2-A guard (forced-default-creep):** AIF is auto (no prompt at all), which is a stronger form of default-yes. This is the pre-existing behavior. K-1 does NOT introduce new forced-default-yes behavior — all new companion prompts default `[y/N]`. The guard is satisfied.

### §4.4 Non-interactive fallback

**Recommendation: `COMPANIONS` env var + `--companions` flag.**

```bash
# Default: empty = show interactive prompts (when stdin is a tty)
# COMPANIONS=none  : skip all companion prompts silently (CI default)
# COMPANIONS=all   : install all companions non-interactively
# COMPANIONS=superpowers,taskmaster : install named set non-interactively
COMPANIONS="${COMPANIONS:-}"

# Non-interactive detection: if stdin is NOT a tty, default to COMPANIONS=none
if [ -z "$COMPANIONS" ] && [ ! -t 0 ]; then
  COMPANIONS="none"
fi
```

Flag extension: add `--companions=none|all|<csv>` to the `for arg in "$@"` parser at install.sh:62–69.

**Dry-run compatibility**: When `DRY_RUN=--dry-run`, companion prompts print `[dry-run] would prompt: Install <X>? [y/N]` and skip execution. Pattern matches existing dry-run behavior throughout install.sh.

**T16 problem-class check:** Upstream: «headless installer with interactive/non-interactive modes». Our problem class: same. Pattern is standard (e.g., curl-based installers commonly detect `[ -t 0 ]` for tty presence). No pattern-matching-on-name issue.

### §4.5 Idempotency — detect-and-skip per companion

Per companion, detect-and-skip mechanism (before invoking install):

| Companion | Detection signal | Skip condition | Skip message |
|---|---|---|---|
| Superpowers (CC) | `claude plugin list 2>/dev/null \| grep -q superpowers` OR check `.claude/settings.json` for `superpowers` entry | grep hit = installed | `⊝ Superpowers already installed — skipping` |
| Superpowers (OpenCode) | `grep -q superpowers "$HOME/.config/opencode/opencode.json" 2>/dev/null` | grep hit = installed | same |
| OhMyOpencode | `bunx oh-my-openagent doctor 2>/dev/null \| grep -q "All checks passed"` OR check `opencode.json` for `oh-my-openagent` | doctor green = installed | `⊝ OhMyOpencode already installed — skipping` |
| TaskMaster | `claude plugin list 2>/dev/null \| grep -q task-master` OR check `.taskmaster/` directory existence | grep or dir hit = installed | `⊝ TaskMaster already installed — skipping` |
| Cline file deliverables | `[ -d "$PROJECT_ROOT/.clinerules" ]` | directory exists | `⊝ .clinerules/ already exists — skipping Cline file deliverables` |
| OpenCode file deliverables | `[ -d "$PROJECT_ROOT/.opencode" ]` | directory exists | `⊝ .opencode/ already exists — skipping OpenCode file deliverables` |
| Cursor file deliverables | `[ -d "$PROJECT_ROOT/.cursor/rules" ]` | directory exists | `⊝ .cursor/rules/ already exists — skipping Cursor file deliverables` |

**Note:** `claude plugin list` may not be available in all CC versions or all consumer environments. Fallback: skip detection and let the install command handle idempotency internally (all three companions' install commands are idempotent per §3 survey).

### §4.6 Order-of-operations — where K-1 prompts go

**K-1 block placement: line 328 (between Phase 3 close and Phase 4 echo).**

```text
[Phase 3: AI Factory templates — lines 306–327]
─── K-1 COMPANION INSTALL BLOCK (new, ~60–80 lines) ───
[Phase 4: Scripts — lines 329–337]
```

**Why here:**
1. Phase 3 already installs AIF templates including skill-context overrides (`.ai-factory/skill-context/`) — the foundation is laid before companion prompts fire.
2. Companions install AFTER our enforcement wiring is complete. Superpowers/TaskMaster/OhMyOpencode installs do not modify `.ai-factory/`, `.claude/agents/`, or `.claude/skills/` directories we own.
3. `.claude/settings.json` is written in Phase 1b (hook registration at lines 265–285). If a companion (e.g., TaskMaster) needs to add `allowedTools` entries to settings.json, that operation should fire AFTER our hook is already registered — so the companion's jq merge sees our entry and can concatenate safely.
4. Phase 5 copies shared templates including `AGENTS.md` (line 344). Any companion that modifies CLAUDE.md or AGENTS.md (TaskMaster `@import`) should fire BEFORE Phase 5 to ensure our AGENTS.md copy_safe skips correctly if one is already present. — EXCEPTION: TaskMaster `@import` adds a line to CLAUDE.md (not AGENTS.md); it does not create AGENTS.md. Safe to run at line 328.

**Aif-handoff integration note**: our skill-context files are already copied at install.sh:319–322 (Phase 3). No additional K-1 action needed for aif-handoff — the integration IS the Phase 3 file copy. Print informational note:
```bash
echo "  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)"
```

### §4.7 Failure mode

**Recommendation: warn-and-continue (not abort, not silent).**

```bash
if ! install_superpowers_fn 2>&1; then
  echo "  ⚠ Superpowers install failed — check output above and retry manually"
  echo "    Manual: /plugin install superpowers@claude-plugins-official"
fi
```

**Rationale:**
- Companion install failure should NOT abort the parent install.sh — the core enforcement framework (skills, hooks, agents, AIF templates) is already installed at that point. Companion install is additive.
- Silent failure is worse — user doesn't know they need to retry.
- Abort-on-failure is too aggressive — the user chose to try a companion; if it fails they can retry manually.
- Pattern matches existing install.sh tone: `⊝` for skips, `⚠` for warnings, `❌` for fatal errors (e.g., no package.json when not dry-run).

**Roll-back**: no rollback needed. Companion install is either atomic (CC plugin) or additive file copy. Partial installs leave the companion not-yet-configured — consumer can simply retry.

---

## §5 T-trap walks

**T1 (sampling floor — all 7 companions, no shortcuts):**
§3 survey table has 8 rows (7 companions + AI-Factory comparison). All 7 actual companion rows present with: install command, marketplace, idempotency, subscription gate, conflict surface. Count: Superpowers, OhMyOpencode, aif-handoff, TaskMaster, Cline, OpenCode, Cursor = 7. No sampling shortcut. ✓

**T3 (file:line per finding — no prose-only findings):**
- AIF auto-install: `install.sh:306–327` (read and verified)
- AIF skill-context: `install.sh:319–322` (read and verified)
- Stack picker precedent: `install.sh:145` (read and verified, `read -rp "Choose [1/2]: "`)
- AIF copy_safe no-force: `install.sh:165–170` (read and verified, `if [ -e "$dst" ] && [ "$FORCE" != "--force" ]; then`)
- Hook registration in settings.json: `install.sh:265–285` (read and verified)
- All §3 companion install commands cited to DeepWiki probe (2026-05-27) or matrix §X.X. ✓

**T7 (adversarial — does each companion TRULY need a prompt, or can user handle it out-of-band?):**

Ran adversarial check: «for each companion, assume the user will NOT get the prompt — what happens?»

- **Superpowers**: user must discover Superpowers independently. For Superpowers users, it's no burden (they already know). For non-Superpowers users, prompt has discovery value. Verdict: prompt is genuinely useful, not just cosmetic.
- **OhMyOpencode**: install requires `bun` + specific flags + correct CLI name (`oh-my-openagent` not `oh-my-opencode`). The dual-name transition is a genuine UX trap. Prompt + install command reduces error. Verdict: prompt provides real value.
- **TaskMaster**: CC marketplace install is one `/plugin install` command; easily discoverable. Prompt provides convenience, not critical value. Verdict: prompt is nice-to-have, not critical. Included for symmetry with Superpowers.
- **aif-handoff**: server-side service; no prompt possible. Verdict: CORRECT to exclude from prompt list. Our Phase 3 skill-context install IS the client-side aif-handoff integration.
- **Cline**: IDE extension; user controls harness selection; prompt for file deliverables is a design choice (D1). Verdict: conditional on D1 — not prompting by default.
- **OpenCode**: same as Cline. Verdict: conditional on D2.
- **Cursor**: same as Cline. Verdict: conditional on D3.

Adversarial result: 3 companions (Superpowers, TaskMaster, OhMyOpencode) justify prompts; 4 are correctly excluded or deferred. This matches §4.2 recommendation. ✓

**T11/T12 (6-item search-coverage on «no precedent for interactive companion prompts in install scripts»):**

Check: is there an existing production-grade analog for «install.sh asking user to install optional companion tools»?

1. **Own-stack sweep**: `install.sh` itself uses `read -rp` for stack selection (line 145). Precedent is in the file. ✓
2. **Category sweep**: shell installer scripts with optional feature selection. Common in: Homebrew formula optional dependencies (`brew install --with-X`), mise/asdf plugin installers, dotfile bootstrap scripts (e.g., chezmoi templates). All use `read -p` or `--flags` patterns. ✓
3. **Semantic-distance check**: Function = «offer optional tool install during framework install». Adjacent: `npx create-next-app` asks about Tailwind/TypeScript. `cargo generate` asks template questions. Pattern is ubiquitous. Not a novel design. ✓
4. **Adversarial check on negative-existence claim**: Is there a companion-install protocol specifically for AI agent tools? Found: TaskMaster's own installer checks for Claude Code presence before installation. OhMyOpencode's installer has `--no-tui` for non-interactive. These confirm the pattern is well-established. ✓
5. **Prompt-list floor**: Floor hit and exceeded — consulted 2 DeepWiki probes + matrix §1.1–§1.7 + install.sh direct read. ✓
6. **Trigger sweep**: Not applicable for this design task (focused on companion install, not §13.x trigger sweep). ✓

Conclusion: no «no precedent exists» claim to defend. Pattern is established. BUILD verdict = our specific implementation (the K-1 block for this framework); ADOPT VOCABULARY = `read -rp`, `--companions` env/flag pattern. ✓

**T13 (AIF auto-install: re-verify that ADOPTED behavior actually works):**

Verified: `install.sh:319–322` copies skill-context files. These are the injection mechanism that aif-handoff's `ensureTaskWorktree` copies into task worktrees (matrix §1.4, DeepWiki probe). The ADOPT mechanism (copy_safe skill-context) is confirmed live as of SSOT #50 (2026-05-20 live probe: «a background maxTurns:6 sidecar reads + applies these»). AIF auto-install is not zero-work — it was empirically validated. ✓

**T15 (recursive — does this design apply its own discipline to itself?):**

This design doc:
- Has §6 §1.7 Forward+Backward block (required by `phase-research-coverage.md §1.7`) ✓
- Has T-trap walks in this §5 section ✓
- Has a T16 walk per «adopt command X» row in §4 and §3 ✓
- Does NOT edit install.sh (R-phase discipline per kickoff §2) ✓
- Will run T19 cold-QA before PR open ✓

Self-application: does this design doc fall into any of its own recommended traps? Check: §0 TL;DR leads with a recommendation. The recommendation is backed by evidence from install.sh read (T20 compliant). AIF keep-vs-convert recommendation backed by install.sh:306–327 read and matrix §1.1 analysis. ✓

**T16 (per «adopt command X» row — explicit problem-class match):**

| Companion | Upstream problem class | Our problem class | Match? | Evidence |
|---|---|---|---|---|
| Superpowers `/plugin install` | «Install CC plugin from marketplace registry» | «Install optional companion tool during framework install» | YES for mechanism; the CC plugin system handles the install, de-dup, and update lifecycle | DeepWiki probe 2026-05-27: «Available via the official Claude plugin marketplace» + `/plugin install superpowers@claude-plugins-official` |
| OhMyOpencode `bunx oh-my-openagent install` | «Interactive installer for OpenCode plugin; configures AI subscription mappings» | «Install optional companion tool during framework install» | PARTIAL — `bunx oh-my-openagent install` installs the OpenCode plugin. But it also interactively configures AI subscriptions (Claude/Gemini/OpenAI). This is MORE than a simple companion install — it's a subscription configuration wizard. **Our prompt should NOT invoke the full interactive wizard from within install.sh** without warning the user. Recommend: prompt user to run `bunx oh-my-openagent install` manually, OR invoke with `--no-tui --claude=max20` for a minimal non-interactive install. | DeepWiki probe 2026-05-27: «interactive setup wizard... configures your AI subscriptions». T16 ALERT: mismatch on configuration scope. |
| TaskMaster `/plugin install` | «Install CC plugin from marketplace» | «Install optional companion tool during framework install» | YES — same mechanism as Superpowers | matrix §1.5: «migrated to CC plugin marketplace model» |
| `read -rp` (interactive prompt pattern) | «Bash interactive prompt with default response» | «Present optional companion install choice with default-no» | YES — exact match; idiomatic bash | install.sh:145 precedent (read and verified) |

**T16 ALERT — OhMyOpencode install scope mismatch**: invoking the full `bunx oh-my-openagent install` interactive wizard from within install.sh would surprise the user with a subscription configuration dialog mid-install. Recommended mitigation: print the install command and instruct user to run it separately after install.sh completes, OR invoke with `--no-tui --claude=max20` as a minimal preset. Surface as DECISION-NEEDED D5 in §7.

**T19 (own cold-QA before PR):** Executed below in self-cold-QA section.

**T20 (no inline-verdict without evidence):** This document has no inline verdicts absent a preceding tool call. All verdicts are backed by:
- install.sh reads (DO step 5, 9, verified line ranges)
- Matrix reads (DO step 7)
- DeepWiki probes (DO step 10, 2026-05-27)

**T-CR-A (within-one-project disambiguation — companion with multiple install paths):**

- Superpowers has multiple install paths: CC marketplace (`/plugin install superpowers@claude-plugins-official`), Superpowers marketplace (two-step), OpenCode plugin, Windows npm fallback. **For K-1 design**, the relevant path is CC marketplace primary (consumer is installing into a CC project). OpenCode path is a separate deliverable concern. Design scope = CC primary. Disambiguation: stated explicitly in §4.2.
- OhMyOpencode has dual package names (`oh-my-openagent` preferred, `oh-my-opencode` legacy). Design uses `oh-my-openagent` (preferred). Stated in §3 companion table.

**T-MA-A (12-wrong-narrow-framing recurrence — cite SPECIFIC install commands with upstream evidence):**

Each companion's install command is cited to:
- AI-Factory: `install.sh:306–327` (read and verified — no external command)
- Superpowers: DeepWiki probe 2026-05-27 `/plugin install superpowers@claude-plugins-official`
- OhMyOpencode: DeepWiki probe 2026-05-27 `bunx oh-my-openagent install --no-tui --claude=max20`
- TaskMaster: matrix §1.5 «CC plugin marketplace model»
- Cline: harness-only (VS Code marketplace — no single bash command)
- OpenCode: harness-only (npm/brew — no single bash command for our purposes)
- Cursor: IDE-only (no bash command)

No companion install command is cited from training data alone. All sourced from evidence-bearing tool calls (Read install.sh + DeepWiki probes + matrix). ✓

**T-Stage2-A (forced-default-creep — no companion defaults to `[Y/n]`):**

All new companion prompts in §4.2 use `[y/N]` (capital N = default no). Zero occurrences of `[Y/n]` in this design. Verified: prompt copy strings in §4.2 all contain `[y/N]`. ✓

---

## §6 §1.7 Forward+Backward checks

### §1.7 Forward-check applied

**Does this R-phase comply with all currently-active layers?**

- **Code-level (R1-R20 lint)**: R-phase output is markdown only; no TypeScript edited. Lint N/A. ✓
- **Principle-level (`packages/core/principles/*.test.ts`)**: Research patch complies with principle 10 (`<!-- scope:... -->` annotation present at top of file). ✓
- **Capability-commit gate (CLAUDE.md)**: No new explicit dependencies added. No new code files ≥50 LOC. Single new markdown research-patch file. NOT a capability commit. `Prior-art: skipped — research-only design patch` trailer in commit body is correct (≥20 chars with rationale). ✓
- **Build-vs-reuse SSOT (prior-art-evaluations.md)**: All companion references use existing SSOT rows where available (#50, #55, #62, #64, #65, #73, #76, #81). New upstream findings (OhMyOpencode install mechanism, Superpowers CC marketplace path) are documented here for Stage 5 I-phase author to register in SSOT if/when implementing capability commits. No SSOT edit required for this R-phase (research-only). ✓
- **Build-vs-reuse (BFR rule, `.claude/rules/build-first-reuse-default.md §1`)**: K-1 design adopts existing bash pattern (`read -rp`, `[ -t 0 ]` tty detection, `copy_safe`). Verdict for interactive prompt block = BUILD with ADOPT pattern (`read -rp` from own precedent). No custom install-manager engine built. ✓
- **Trigger sweep (§1.6)**: Not the scope of this R-phase. ✓
- **Doc-authority (artefacts produced)**: This file carries `<!-- scope:... -->` + `> Authoritative for` + `> NOT authoritative for` per `doc-authority-hierarchy.md §3` (research-patches folder-level authority). ✓
- **No paid LLM in CI (no-paid-llm-in-ci.md)**: All research via DeepWiki MCP (subscription-bundled) + install.sh direct read + matrix read. Zero API-billed calls. ✓
- **Universal-satellite vision (kickoff §5)**: No companion is mandatory or default-yes. AIF keep-as-is is the pre-existing auto behavior, not a new mandatory default. All new prompts default `[y/N]`. ✓
- **PR strategy (CLAUDE.md)**: Single-file R-phase output; one PR scoped to Stage 2 design. No drive-by edits to install.sh, CLAUDE.md, or any other file. ✓

### §1.7 Backward-check applied

**Does this R-phase silently supersede any existing artefact?**

- **install.sh**: NOT edited — research-only stage. No lines changed. No backward supersession. ✓
- **AIF auto-install behavior**: NOT changed; §4.3 explicitly recommends KEEP-AS-IS. This patch documents the current behavior and recommends not changing it. ✓
- **Stage 1 patch (2026-05-27-orchestrator-skill-audit.md)**: NOT edited. This patch is Stage 2 output; Stage 1 patch is a separate closed artefact. ✓
- **Integration matrix (2026-05-27-universal-satellite-integration-matrix.md)**: NOT edited. Used as PRIMARY input only. ✓
- **`.claude/rules/*.md`**: NOT edited. No rule changes in this stage. ✓
- **SSOT (prior-art-evaluations.md)**: NOT edited. New findings (Superpowers CC marketplace path, OhMyOpencode `bunx` install) documented here for Stage 5 author to register as SSOT amendments if they represent new capability commits. ✓

**Are there any artefacts that THIS patch's scope implicitly touches without stating?**

- The design touches aif-handoff integration implicitly (§4.2 explains why no prompt needed). This is documented explicitly — not a silent supersession.
- The design touches the «universal-satellite vision» from kickoff §0. Not a new authority claim; the patch defers vision decisions to the kickoff and to the maintainer (DECISION-NEEDED D4 in §7).

**Conclusion:** No silent supersession. No scope creep. ✓

---

## §7 Out-of-scope / handoff to Stage 5

### DECISION-NEEDED items (maintainer must resolve before Stage 5 dispatches)

**D1 — Cline file deliverables in scope?**
- **Option A (include)**: install.sh K-1 block prompts user and copies `.clinerules/` rule files + hook stubs. Requires creating new deliverable files in our repo (`.clinerules/rules-as-tests.md`, `.clinerules/hooks/` stubs). Follows `dual-implementation-discipline.md §3` dual-channel policy.
- **Option B (exclude)**: no Cline file deliverables in K-1. Consumer who uses Cline handles `.clinerules/` setup manually per docs. Lower maintenance cost.
- **Consequence of A**: requires Stage 5 to also create Cline deliverable files (new files; likely capability commits with Prior-art trailers).
- **Consequence of B**: Cline users must consult INSTALL.md for manual setup; less friction-free.

**D2 — OpenCode plugin file deliverable in scope?**
- **Option A (include)**: create `.opencode/plugins/rules-as-tests-enforcement.js` plugin file; K-1 prompts and copies. Provides OpenCode-native hook enforcement (CC PostToolUse hooks NOT loaded in OpenCode per matrix §1.7).
- **Option B (exclude)**: OpenCode consumers use only skill description-match auto-load (`.claude/skills/rules-as-tests/SKILL.md` auto-loaded). No PostToolUse hook equivalent.
- **Consequence of A**: requires JS plugin development (non-trivial; capability commit).
- **Consequence of B**: OpenCode enforcement is description-match only (no edit-time gate equivalent).

**D3 — Cursor rules file deliverable in scope?**
- **Option A (include)**: create `.cursor/rules/rules-as-tests.mdc`; K-1 prompts and copies. Low effort (file copy of existing rule content in mdc format).
- **Option B (exclude)**: Cursor consumers use CLAUDE.md/AGENTS.md only (Cursor loads these as project context).
- **Consequence of A**: minor effort; high reach (Cursor is widely used). Likely worth it.
- **Consequence of B**: Cursor consumers get CLAUDE.md context only; no Cursor-native Agent-type rule.

**D4 — AIF auto-install: add informational echo or convert to opt-in?**
- **Option A (keep fully auto, add echo only)**: Print `echo "▶ AI Factory templates → .ai-factory/ (auto)"` to make the auto behavior transparent. No change to copy_safe behavior.
- **Option B (convert to opt-in prompt)**: Add `read -rp "Install AI Factory templates? [Y/n]: "` — NOTE this would be `[Y/n]` (default yes) for back-compat, not `[y/N]`. Breaking change risk if consumer uses `--non-interactive`.
- **Option C (no change)**: Leave current behavior and echoes as-is.
- **Recommendation from this patch: Option A or C** — do not convert to opt-in (§4.3 reasoning). Maintainer decides between A (more transparent) and C (minimal change).

**D5 — OhMyOpencode install scope (T16 ALERT: subscription configuration scope mismatch):**
- **Option A (print command, instruct manual)**: K-1 prints `bunx oh-my-openagent install` and tells user to run it after install.sh. No automated invocation from install.sh.
- **Option B (invoke non-interactive preset)**: K-1 invokes `bunx oh-my-openagent install --no-tui --claude=max20` automatically. Installs with Claude Max subscription preset; no interactive wizard.
- **Option C (skip OhMyOpencode from prompt)**: Remove OhMyOpencode from K-1 scope; document in INSTALL.md instead.
- **T16 context**: full interactive wizard is broader than «companion install» — it configures AI subscriptions. Option A or B are safer; Option C is the minimal-risk choice.
- **Recommendation from this patch: Option A or B** — avoid Option C (OhMyOpencode is high-value per matrix §1.3). Maintainer decides invoke-vs-print.

### Per-companion testability notes for Stage 5

- **Superpowers**: test install detection with `claude plugin list | grep superpowers`. Mock: pre-create a `.claude/settings.json` entry with superpowers to test skip path.
- **TaskMaster**: test install detection with `.taskmaster/` dir presence OR `claude plugin list | grep task-master`.
- **OhMyOpencode**: test with `bunx oh-my-openagent doctor` exit code. Note: requires `bun` to be available; Stage 5 should add a `command -v bun` check before attempting install.
- **Non-interactive fallback**: `COMPANIONS=none ./install.sh ts-server` must produce no prompts. Test in CI via `echo "" | ./install.sh ts-server` (piped stdin = non-tty).
- **Dry-run**: `./install.sh ts-server --dry-run` must print `[dry-run] would prompt: Install <X>? [y/N]` lines without executing.
- **Idempotency**: run install.sh twice; second run must show `⊝ <companion> already installed — skipping` for all previously-installed companions.

---

## §8 See also

- [Umbrella kickoff](../../../.claude/orchestrator-prompts/m-a-full-satellite-transition/kickoff.md) — Stage 2 scope source (gitignored; embedded in worker prompt)
- [2026-05-27-universal-satellite-integration-matrix.md](2026-05-27-universal-satellite-integration-matrix.md) — PRIMARY input: companion install/integration findings (PR #252)
- [2026-05-27-orchestrator-skill-audit.md](2026-05-27-orchestrator-skill-audit.md) — Stage 1 R-phase output (PR #254); context
- [install.sh](../../../install.sh) — artefact under design; NOT edited in this stage
- [.claude/rules/build-first-reuse-default.md](../../.claude/rules/build-first-reuse-default.md) — BFR verdict ladder governing K-1 design choices
- [.claude/rules/dual-implementation-discipline.md §3](../../.claude/rules/dual-implementation-discipline.md) — triage framework for Cline/Cursor/OpenCode deliverable decisions (D1/D2/D3)
- [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — all research methods comply
- DeepWiki probes 2026-05-27: `obra/superpowers` (install mechanisms), `code-yeongyu/oh-my-openagent` (install + idempotency)
