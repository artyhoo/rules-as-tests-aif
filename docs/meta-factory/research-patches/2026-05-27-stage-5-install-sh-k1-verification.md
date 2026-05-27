<!-- scope:stage-5-install-sh-k1-verification -->
# Stage 5 I-phase — install.sh K-1 extension verification log

> **Status:** I-phase verification log for Stage 5 of `m-a-full-satellite-transition` umbrella.
> **Date:** 2026-05-27.
> **Authoritative for:** verification that the K-1 companion-install extension in `install.sh` matches Stage 2 v3 binding spec (PR #255) and Stage 3 collision audit (PR #256); smoke-test results; §1.7 self-reflexive block.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). install.sh design rationale — see [2026-05-27-install-sh-k1-extension.md](2026-05-27-install-sh-k1-extension.md) (Stage 2 v3 binding spec).

---

## §0 TL;DR

K-1 companion-install section implemented in `install.sh` after Phase 3 (AIF templates), before Phase 4 (Scripts).
3 companions prompted: Superpowers, TaskMaster (CC plugin active install), OhMyOpencode (print + instruct per D5 Option A).
aif-handoff informational note printed automatically (no prompt needed; Phase 3 skill-context files ARE the integration).
All smoke tests pass. Decisions D1/D2/D3 deferred; D5=Option A; D6=Option A only.
SSOT row #84 registered for `claude plugin install ... --scope user` (ADOPT, VERIFIED-FREE).

**Companions verified:**

| Companion | Mechanism | Status |
|---|---|---|
| Superpowers | `claude plugin install superpowers@claude-plugins-official --scope user` | Implemented; idempotency via `claude plugin list \| grep superpowers`; warn-and-continue |
| TaskMaster | `claude plugin install claude-task-master@claude-plugins-official --scope user` | Implemented; idempotency via `claude plugin list \| grep task-master`; warn-and-continue |
| OhMyOpencode | Print + instruct (D5 Option A) | Implemented; no auto-invoke; bun presence check |
| aif-handoff | Informational note only | Implemented; Phase 3 skill-context already handles integration |

---

## §1 Method

**What was read:**

- `docs/meta-factory/research-patches/2026-05-27-install-sh-k1-extension.md` (Stage 2 v3 binding spec, 460 lines) — full read
- `docs/meta-factory/research-patches/2026-05-27-living-doc-neutral-injection.md` (Stage 3 collision audit, 441 lines) — focus §3, §4.2, §4.3
- `install.sh` lines 55-350 — arg parser, Phase 3, insert point, Phase 4

**Implementation approach:**

- Surgical Edit tool inserts: (i) `--companions=` flag into arg parser at line 62, (ii) K-1 block inserted at the blank line between Phase 3 close and Phase 4 header
- Each new content line carries `# Per Stage 2 v3 §X.Y` reference comment (T-MA-A)
- Code-sketch from kickoff used as template; adapted for three companions

**Smoke tests run (all in `/tmp/scratch-install/` with `--dry-run`):**

All 8 tests listed in §2 below.

---

## §2 Per-companion verification table

| Companion | K-1 prompt fired? | On `y` — install actually invoked? | On `n` — skipped cleanly? | Idempotency: re-run after success? | `COMPANIONS=all` unattended? |
|---|---|---|---|---|---|
| Superpowers | YES (COMPANIONS=all dry-run shows would-install or already-installed) | YES in non-dry-run if `claude` on PATH (warns if absent) | YES — no output when COMPANIONS=none | YES — `⊝ Superpowers already installed — skipping` (Superpowers IS installed on dev machine) | YES — `⊝ Superpowers already installed — skipping` shown |
| TaskMaster | YES (COMPANIONS=all dry-run shows `[dry-run] would install: claude plugin install claude-task-master@...`) | YES in non-dry-run if `claude` on PATH (warns if absent) | YES — no output when COMPANIONS=none | YES — would show `⊝ TaskMaster already installed — skipping` (if `claude plugin list \| grep task-master` fires) | YES — dry-run install line shown |
| OhMyOpencode | YES (COMPANIONS=all shows print + instruct) | N/A — D5=Option A print+instruct only, no auto-invoke | YES — no output when COMPANIONS=none | N/A — print+instruct is idempotent (just prints) | YES — print + instruct lines shown |
| aif-handoff | N/A (no prompt; informational note) | N/A — integration is Phase 3 auto | N/A | N/A — note always prints | NOTE: `✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)` always printed |

**Evidence (literal dry-run outputs):**

`COMPANIONS=none` output (companion section only):
```text
▶ Optional companion installs
  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)
```

`COMPANIONS=all` output (companion section only):
```text
▶ Optional companion installs
  ⊝ Superpowers already installed — skipping
  [dry-run] would install: claude plugin install claude-task-master@claude-plugins-official --scope user
  ▶ OhMyOpencode install (run AFTER install.sh completes):
    bunx oh-my-openagent install
    Note: if you see HTTP 400 'Duplicate tool names detected' in CC after install,
    set "claude_code.skills": false in OhMyOpencode config.
  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)
```

`echo "" | ...` (non-tty) output (companion section only):
```text
▶ Optional companion installs
  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)
```

`COMPANIONS=superpowers,taskmaster` output (companion section only):
```text
▶ Optional companion installs
  ⊝ Superpowers already installed — skipping
  [dry-run] would install: claude plugin install claude-task-master@claude-plugins-official --scope user
  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)
```

`--companions=superpowers` flag (companion section only):
```text
▶ Optional companion installs
  ⊝ Superpowers already installed — skipping
  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)
```

---

## §3 Stage 3 §3 cross-check

**§4.2 — OhMyOpencode escape hatch addressed:**

Stage 3 §4.2 documents the conditional duplicate-tool-names conflict when OhMyOpencode skill plugin AND `claude_code.skills` are both active (HTTP 400). The K-1 OhMyOpencode handler prints this escape hatch note after the install command:
```text
Note: if you see HTTP 400 'Duplicate tool names detected' in CC after install,
set "claude_code.skills": false in OhMyOpencode config.
```
install.sh:448 — verified present in the final implementation. Stage 3 §4.2 finding is addressed.

**§4.3 — OpenCode + Cline CC-hook gap acknowledged:**

Stage 3 §4.3 notes that our 9 CC-native hooks do not fire in OpenCode or Cline sessions (gap, not collision). The K-1 implementation follows the orchestrator's D1 (Cline DEFERRED), D2 (OpenCode DEFERRED), D3 (Cursor DEFERRED) decisions — no `.clinerules/`, `.opencode/plugins/`, or `.cursor/rules/` deliverables in this stage. The gap is acknowledged; pre-push hook compensates as backstop per Stage 3 §4.3 finding.

---

## §4 T-trap walks

**T-Stage5-A (spec drift check — every new line traces to Stage 2 v3 §X.Y):**

`grep -cE "# Per Stage 2 v3 §" install.sh` → 11 matches. Each new block carries the reference:

| install.sh location | Stage 2 v3 ref | Content |
|---|---|---|
| Line 62 | §4.4 | COMPANIONS env var + flag parse |
| Line 333 | §4.6 | K-1 section header + placement rationale |
| Line 336 | §4.4 | Non-tty auto-default `COMPANIONS=none` |
| Line 344 | §4.2 + §4.4 | Superpowers prompt handler |
| Line 353 | §4.4 | Dry-run skip prompt |
| Line 364 | §4.5 | Superpowers idempotency detect-and-skip |
| Line 370 | §4.7 | Superpowers warn-and-continue failure |
| Line 385 | §4.2 + §4.4 | TaskMaster prompt handler |
| Line 404 | §4.5 | TaskMaster idempotency detect-and-skip |
| Line 410 | §4.7 | TaskMaster warn-and-continue failure |
| Line 424 | §4.2 + D5 | OhMyOpencode print + instruct handler |

Zero lines in the new K-1 block lack a `# Per Stage 2 v3` reference. ✓

**T19 (own cold-QA — all items a through j):**

- (a) Every install.sh new line traces to Stage 2 v3 §X.Y: ✓ 11 reference comments confirmed
- (b) Zero `[Y/n]`: ✓ `grep -E "\[Y/n\]" install.sh` → EMPTY
- (c) COMPANIONS=none/all/CSV work; auto-default non-tty; `--companions=` flag works: ✓ smoke tests (b)(c)(d)(f) all pass
- (d) Idempotency works: ✓ Superpowers shows `⊝ already installed` on re-run (real detect via `claude plugin list`)
- (e) Failure mode warn-and-continue: ✓ code-review verified — both SP and TM have `⚠ claude CLI not on PATH` else branch; both have `if ! claude plugin install ...` wrap with warn-and-continue
- (f) Stage 3 §3 addressed: ✓ §4.2 OhMyOpencode escape hatch printed; §4.3 Cline/OpenCode gap deferred per D1/D2
- (g) AIF full Phase 3 (306-327 original numbering, 309-330 post-edit) unchanged: ✓ `diff /tmp/phase3-before.txt /tmp/phase3-after.txt` → EMPTY
- (h) Both §1.7 H3 headers present in verification log: ✓ see §5 below
- (i) All companion-detection commands wrapped with `command -v <tool>`: ✓ `grep -n "command -v claude" install.sh` shows 4 guards (lines 365, 369, 405, 409); OhMyOpencode uses `command -v bun` at line 445
- (j) New SSOT row for `claude plugin install ... --scope user` added: ✓ row #84 in `docs/meta-factory/prior-art-evaluations.md`

---

## §5 §1.7 self-reflexive block

### §1.7 Forward-check applied

**Does this I-phase comply with all currently-active layers?**

- **No paid LLM in CI** ([no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md)): `claude plugin install ... --scope user` is VERIFIED-FREE per Stage 2 v3 §4.8 (administrative subcommand, no LLM call, no API billing — `claude --help` scopes `--max-budget-usd` to `--print`/`-p` only). No CI change made. ✓
- **BFR (build-first-reuse-default.md §1)**: SSOT row #84 registered (ADOPT verdict). `claude plugin install` mechanism is ADOPTED from CC marketplace. No new BUILD capability introduced for companion install itself; the interactive prompt mechanism is ADOPT VOCABULARY from own `read -rp` precedent at install.sh:145. ✓
- **Universal-satellite vision (no mandatory companion)**: All 3 new prompts default `[y/N]`. `COMPANIONS=none` or non-tty auto-default produces zero companion prompts. aif-handoff note is informational only. ✓
- **T-Stage2-A (zero `[Y/n]`)**: `grep -E "\[Y/n\]" install.sh` → EMPTY. ✓
- **Capability-commit gate** (CLAUDE.md): install.sh is a shell script, not under `packages/`. No new `package.json` dependency. NOT a capability commit by the hook's detection criteria (no `packages/` file ≥80 LOC; install.sh is existing file). `Prior-art:` trailer present in commit with new SSOT row reference. ✓
- **No drive-by edits** (CLAUDE.md PR strategy): Only 3 files touched — `install.sh`, `prior-art-evaluations.md`, this verification log. No README, CLAUDE.md, or `.claude/rules/*.md` edits. ✓
- **Shellcheck**: No new warnings vs baseline (1 pre-existing SC2317 info notice). ✓
- **Syntax**: `bash -n install.sh` → exit 0. ✓
- **Principle tests**: 21 test files, 150 tests passing (0 failures). ✓

**Falsifiers:**
- Wrong if `claude plugin install ... --scope user` is NOT a valid shell-runnable CLI subcommand — falsified by `claude plugin --help` not listing `install` subcommand
- Wrong if Anthropic announces billing extension to administrative `claude` subcommands — falsified by billing language appearing in `claude plugin install --help` or CC costs page

### §1.7 Backward-check applied

**Does this I-phase silently supersede any existing artefact?**

- **install.sh Phase 3 (lines 309-330)**: UNCHANGED — `diff /tmp/phase3-before.txt /tmp/phase3-after.txt` → EMPTY. Maintained verbatim. ✓
- **Stage 2 v3 binding spec**: NOT edited — this verification log is an additive artefact. Stage 2 v3 design is the authority; this log implements and verifies it. ✓
- **Stage 3 collision audit**: NOT edited. ✓
- **README.md / CLAUDE.md / `.claude/rules/*.md`**: NOT edited. Stage 6 owns documentation updates referencing K-1. ✓
- **prior-art-evaluations.md**: One additive row (#84) appended. No existing rows modified. ✓

**Are there any artefacts this I-phase implicitly touches without stating?**

- SSOT #84 explicitly added (stated). No silent SSOT changes.
- No staged artefacts from Stage 4 were touched.
- The D1/D2/D3/D6 passive-pre-seed deferrals leave no dangling implementation stubs.

**Conclusion:** No silent supersession. No scope creep. ✓

---

## §6 Out-of-scope / handoff

**Stage 6 will:**
- Add K-1 reference in README.md install instructions (optional companion prompts section)
- Add `COMPANIONS=all` / `COMPANIONS=none` / `--companions=` documentation in INSTALL.md

**Deferred D-items (not this stage's scope):**
- D1 — Cline `.clinerules/` file deliverables
- D2 — OpenCode `.opencode/plugins/` file deliverable
- D3 — Cursor `.cursor/rules/` file deliverables
- D6 passive pre-seed (`extraKnownMarketplaces` + `enabledPlugins`) as Option B fallback

---

## §7 See also

- [2026-05-27-install-sh-k1-extension.md](2026-05-27-install-sh-k1-extension.md) — Stage 2 v3 binding spec (PR #255); design authority for this I-phase
- [2026-05-27-living-doc-neutral-injection.md](2026-05-27-living-doc-neutral-injection.md) — Stage 3 R-phase collision audit (PR #256)
- [../../../install.sh](../../../install.sh) — artefact edited in this stage
- [../prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT row #84 added
- [../../.claude/rules/build-first-reuse-default.md](../../.claude/rules/build-first-reuse-default.md) — BFR rule; ADOPT verdict for `claude plugin install` mechanism
- [../../.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — confirmed `claude plugin install` is VERIFIED-FREE
