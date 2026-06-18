# Consumer-usable /pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shipped `/pipeline` planner operate on a consumer's *own* backlog by (a) shipping the missing storage convention and (b) repointing the skill's framework-only paths to the agnostic `.ai-factory/` home — without breaking the framework's own dogfood.

**Architecture:** Add two shared path resolvers to `helpers/lib/common.sh` that pick the framework path when present (dogfood) and the agnostic `.ai-factory/orchestrator-prompts/` path otherwise (consumer). Rebind every helper's hardcoded default through those resolvers. Ship a "Workflow / orchestration" convention block in `AGENTS.md.template` and create the consumer data dir in `install.sh`. Dispatcher is unchanged.

**Tech Stack:** Bash helpers (POSIX-ish, `set -uo pipefail`), Vitest TS tests that shell into the helpers with a `REPO_ROOT` seam, `tests/install-sh/*.test.sh` harness (`install_into` → assert on installed files), Markdown templates.

**Spec:** [docs/superpowers/specs/2026-06-16-consumer-usable-pipeline-design.md](../specs/2026-06-16-consumer-usable-pipeline-design.md)

---

## File structure

**Create:**
- `tests/install-sh/consumer-pipeline.test.sh` — acceptance: clean install → consumer writes a kickoff under `.ai-factory/orchestrator-prompts/` → `/pipeline` discovery finds it; + framework dogfood smoke (T15).
- `packages/core/skills/orch-home-resolver.test.ts` — unit test for the two resolvers.

**Modify:**
- `.claude/skills/pipeline/helpers/lib/common.sh` — add `resolve_orch_home()` + `resolve_plan_path()`.
- 11 helpers — replace hardcoded `${REPO_ROOT}/.claude/orchestrator-prompts` / `${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md` defaults with resolver calls (exact list in Task 2).
- `packages/core/templates/shared/AGENTS.md.template` — add `## Orchestration — backlog & /pipeline` section.
- `install.sh` — `mkdir_safe "$PROJECT_ROOT/.ai-factory/orchestrator-prompts"`.
- `.claude/skills/pipeline/SKILL.md` — G3 (first-run stub inputs) + G4 (lines 77, 91, 525 framework paths).

**Design note — resolver polarity (presence-detection, one file / two repos):** the skill file is identical in framework and consumer (install `cp`s it). Differentiation is runtime: `resolve_orch_home` returns `.claude/orchestrator-prompts` **iff that dir exists** (framework dogfood — it has 142 committed kickoffs there), else the agnostic `.ai-factory/orchestrator-prompts` (consumer). `.claude/` is shipped to consumers for `skills/`+`hooks/` but NOT `orchestrator-prompts/`, so the check cleanly distinguishes. An explicit `MO_ORCH_HOME` / `MO_WAVE_PLAN` env override wins over detection (used by tests).

---

## Task 1: Shared path resolvers in `common.sh`

**Files:**
- Modify: `.claude/skills/pipeline/helpers/lib/common.sh` (append after `mo_filter_tokens`, ~line 45)
- Test: `packages/core/skills/orch-home-resolver.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/core/skills/orch-home-resolver.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const COMMON = join(__dirname, "../../../.claude/skills/pipeline/helpers/lib/common.sh");

// Source common.sh with REPO_ROOT seamed to `repo`, then echo the resolver output.
function resolve(fn: string, repo: string, env: Record<string, string> = {}): string {
  return execFileSync(
    "bash",
    ["-c", `source "${COMMON}"; ${fn}`],
    { env: { ...process.env, REPO_ROOT: repo, ...env }, encoding: "utf8" },
  ).trim();
}

describe("resolve_orch_home", () => {
  it("returns .claude path when .claude/orchestrator-prompts exists (framework dogfood)", () => {
    const repo = mkdtempSync(join(tmpdir(), "orchhome-fw-"));
    mkdirSync(join(repo, ".claude/orchestrator-prompts"), { recursive: true });
    expect(resolve("resolve_orch_home", repo)).toBe(join(repo, ".claude/orchestrator-prompts"));
  });

  it("returns .ai-factory path when .claude/orchestrator-prompts is absent (consumer)", () => {
    const repo = mkdtempSync(join(tmpdir(), "orchhome-cons-"));
    expect(resolve("resolve_orch_home", repo)).toBe(join(repo, ".ai-factory/orchestrator-prompts"));
  });

  it("honours MO_ORCH_HOME override over detection", () => {
    const repo = mkdtempSync(join(tmpdir(), "orchhome-ovr-"));
    mkdirSync(join(repo, ".claude/orchestrator-prompts"), { recursive: true });
    expect(resolve("resolve_orch_home", repo, { MO_ORCH_HOME: "/custom/home" })).toBe("/custom/home");
  });
});

describe("resolve_plan_path", () => {
  it("returns the framework wave-plan when it exists", () => {
    const repo = mkdtempSync(join(tmpdir(), "plan-fw-"));
    mkdirSync(join(repo, "docs/meta-factory"), { recursive: true });
    writeFileSync(join(repo, "docs/meta-factory/wave-sequencing-plan.md"), "# plan");
    expect(resolve("resolve_plan_path", repo)).toBe(join(repo, "docs/meta-factory/wave-sequencing-plan.md"));
  });

  it("returns <orch-home>/plan.md for a consumer (no framework plan)", () => {
    const repo = mkdtempSync(join(tmpdir(), "plan-cons-"));
    expect(resolve("resolve_plan_path", repo)).toBe(join(repo, ".ai-factory/orchestrator-prompts/plan.md"));
  });

  it("honours MO_WAVE_PLAN override", () => {
    const repo = mkdtempSync(join(tmpdir(), "plan-ovr-"));
    expect(resolve("resolve_plan_path", repo, { MO_WAVE_PLAN: "/x/p.md" })).toBe("/x/p.md");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run skills/orch-home-resolver.test.ts`
Expected: FAIL — `resolve_orch_home: command not found` (function not yet defined).

- [ ] **Step 3: Add the resolvers to common.sh**

Append to `.claude/skills/pipeline/helpers/lib/common.sh` (after the `mo_filter_tokens` definition):

```bash
# ── Orchestration-home resolution (consumer-usable /pipeline, 2026-06-16) ───────────────
# The skill file is identical in framework and consumer (install copies it). Differentiate at
# RUNTIME by presence: the framework dogfoods kickoffs in .claude/orchestrator-prompts/ (a
# Claude-Code dir); a consumer must NOT couple its backlog to one harness, so its data lives in
# the agnostic .ai-factory/ namespace (dual-implementation-discipline.md §3). MO_ORCH_HOME /
# MO_WAVE_PLAN env overrides win over detection (test seam + power-user escape hatch).
resolve_orch_home() {
  if [ -n "${MO_ORCH_HOME:-}" ]; then printf '%s\n' "${MO_ORCH_HOME}"; return; fi
  if [ -d "${REPO_ROOT}/.claude/orchestrator-prompts" ]; then
    printf '%s\n' "${REPO_ROOT}/.claude/orchestrator-prompts"      # framework dogfood
  else
    printf '%s\n' "${REPO_ROOT}/.ai-factory/orchestrator-prompts"  # agnostic consumer default
  fi
}

# The backlog-priority registry ("wave plan"). Framework keeps docs/meta-factory/wave-sequencing-plan.md;
# a consumer's plan lives beside its kickoffs at <orch-home>/plan.md (created on first run, SKILL §1).
resolve_plan_path() {
  if [ -n "${MO_WAVE_PLAN:-}" ]; then printf '%s\n' "${MO_WAVE_PLAN}"; return; fi
  if [ -f "${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md" ]; then
    printf '%s\n' "${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md"
  else
    printf '%s\n' "$(resolve_orch_home)/plan.md"
  fi
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run skills/orch-home-resolver.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/pipeline/helpers/lib/common.sh packages/core/skills/orch-home-resolver.test.ts
git commit -m "feat(pipeline): agnostic orch-home + plan-path resolvers (consumer-usable /pipeline)"
```

---

## Task 2: Rebind every helper default through the resolvers

All helpers already `source .../lib/common.sh` (or can — verify each). Replace the hardcoded defaults below with resolver calls. **Exact replacements:**

| File:line | BEFORE | AFTER |
|---|---|---|
| `priority-score.sh:83` | `PROMPTS_DIR="${REPO_ROOT}/.claude/orchestrator-prompts"` | `PROMPTS_DIR="$(resolve_orch_home)"` |
| `priority-score.sh:95` | `MO_WAVE_PLAN="${MO_WAVE_PLAN:-${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md}"` | `MO_WAVE_PLAN="$(resolve_plan_path)"` |
| `priority-score-synthetic.sh:22` | `PROMPTS_DIR="${PROMPTS_DIR:-${REPO_ROOT}/.claude/orchestrator-prompts}"` | `PROMPTS_DIR="${PROMPTS_DIR:-$(resolve_orch_home)}"` |
| `priority-score-synthetic.sh:26` | `MO_WAVE_PLAN="${MO_WAVE_PLAN:-${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md}"` | `MO_WAVE_PLAN="$(resolve_plan_path)"` |
| `plan-currency-check.sh:37` | `KICKOFF_PATH="${REPO_ROOT}/.claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"` | `KICKOFF_PATH="$(resolve_orch_home)/${UMBRELLA}/kickoff.md"` |
| `plan-currency-check.sh:53` | `MO_WAVE_PLAN="${MO_WAVE_PLAN:-${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md}"` | `MO_WAVE_PLAN="$(resolve_plan_path)"` |
| `plan-currency-check.sh:59` | `_PROMPTS_DIR_BASE="${REPO_ROOT}/.claude/orchestrator-prompts"` | `_PROMPTS_DIR_BASE="$(resolve_orch_home)"` |
| `plan-currency-check.sh:156` | `PROMPTS_DIR="${REPO_ROOT}/.claude/orchestrator-prompts"` | `PROMPTS_DIR="$(resolve_orch_home)"` |
| `launch-table-generator.sh:26` | `KICKOFF="${REPO_ROOT}/.claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"` | `KICKOFF="$(resolve_orch_home)/${UMBRELLA}/kickoff.md"` |
| `classify-each-candidate.sh:57` | `bash "${CLASSIFY}" ".claude/orchestrator-prompts/${name}/kickoff.md"` | `bash "${CLASSIFY}" "$(resolve_orch_home)/${name}/kickoff.md"` |
| `dup-detect.sh:34` | `PROMPTS_DIR="${REPO_ROOT}/.claude/orchestrator-prompts"` | `PROMPTS_DIR="$(resolve_orch_home)"` |
| `dispatch-from-state.sh:53` | `STATE_FILE="${MO_STATE_FILE:-${REPO_ROOT}/.claude/orchestrator-prompts/_meta-orch-state.json}"` | `STATE_FILE="${MO_STATE_FILE:-$(resolve_orch_home)/_meta-orch-state.json}"` |
| `dispatch-from-state.sh:54` | `KICKOFF_DIR="${MO_KICKOFF_DIR:-${REPO_ROOT}/.claude/orchestrator-prompts}"` | `KICKOFF_DIR="${MO_KICKOFF_DIR:-$(resolve_orch_home)}"` |
| `delta-write-from-state.sh:62` | `DELTA_FILE="${MO_DELTA_FILE:-${REPO_ROOT}/.claude/orchestrator-prompts/_master-backlog-delta.json}"` | `DELTA_FILE="${MO_DELTA_FILE:-$(resolve_orch_home)/_master-backlog-delta.json}"` |
| `update-delta.sh:53` | `DELTA_FILE="${MO_DELTA_FILE:-${REPO_ROOT}/.claude/orchestrator-prompts/_master-backlog-delta.json}"` | `DELTA_FILE="${MO_DELTA_FILE:-$(resolve_orch_home)/_master-backlog-delta.json}"` |
| `update-cache.sh:52` | `CACHE_FILE="${MO_CACHE_FILE:-${REPO_ROOT}/.claude/orchestrator-prompts/_plan-cache.md}"` | `CACHE_FILE="${MO_CACHE_FILE:-$(resolve_orch_home)/_plan-cache.md}"` |
| `integer-name-guard.sh:39` | `dir="${1:-${MO_ORCH_PROMPTS_DIR:-.claude/orchestrator-prompts}}"` | `dir="${1:-${MO_ORCH_PROMPTS_DIR:-$(resolve_orch_home)}}"` |

**Leave unchanged (degrade-to-nothing per spec §5):** `*-synthetic.sh:27,29` (`MO_OPEN_QUESTIONS`, `MO_PATCHES_DIR`), `priority-score.sh:96,98`, `dup-detect.sh:39` (`MO_DELIVERABLE_DIRS`) — these point at framework research-doc surfaces that simply find nothing in a consumer. Keep as-is.

**Files:**
- Modify: the 11 helpers above. Each must `source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"` before first resolver use — verify `classify-each-candidate.sh`, `integer-name-guard.sh`, `launch-table-generator.sh`, `update-delta.sh`, `delta-write-from-state.sh` source it; add the source line if missing (1:1 with the existing `REPO_ROOT=` line per common.sh header).
- Test: existing `packages/core/{hooks,skills}/*.test.ts` must stay green (they seam `REPO_ROOT` to a fixture that contains `.claude/orchestrator-prompts/` → resolver returns the same path → behaviour unchanged).

- [ ] **Step 1: Apply each replacement above** (Edit tool, one per row). For any helper missing the `source .../lib/common.sh` line, add it immediately after the shebang/`set` block.

- [ ] **Step 2: Run the full helper test suite to verify no regression**

Run: `cd packages/core && npx vitest run hooks/ skills/`
Expected: PASS — all existing helper tests green (fixtures contain `.claude/orchestrator-prompts/` so the resolver returns the legacy path; zero behaviour change).

- [ ] **Step 3: Add a consumer-fixture discovery test** to `packages/core/skills/planner-discovery.test.ts` (append a case):

```ts
it("discovers a kickoff under .ai-factory/orchestrator-prompts when .claude/ is absent (consumer)", () => {
  const repo = mkdtempSync(join(tmpdir(), "consumer-disc-"));
  const k = join(repo, ".ai-factory/orchestrator-prompts/demo");
  mkdirSync(k, { recursive: true });
  writeFileSync(join(k, "kickoff.md"), "Type: fix\n\n## §1 Sub-wave\n| A | do x |\n");
  const out = execFileSync("bash",
    [join(__dirname, "../../../.claude/skills/pipeline/helpers/priority-score.sh")],
    { env: { ...process.env, REPO_ROOT: repo }, encoding: "utf8" });
  expect(out).toContain("demo");
});
```
(Match the existing import block in `planner-discovery.test.ts`; reuse its helpers if present rather than re-importing.)

- [ ] **Step 4: Run it**

Run: `cd packages/core && npx vitest run skills/planner-discovery.test.ts`
Expected: PASS — the consumer kickoff is discovered via the agnostic path.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/pipeline/helpers/ packages/core/skills/planner-discovery.test.ts
git commit -m "feat(pipeline): route helper paths through agnostic orch-home resolver"
```

---

## Task 3: Ship the storage convention in AGENTS.md.template (G1 — the real gap)

**Files:**
- Modify: `packages/core/templates/shared/AGENTS.md.template` (insert a new `## Orchestration` section after the `## Workflow` block, before `## Skills available` at line 73)
- Test: `tests/install-sh/consumer-pipeline.test.sh` (Task 6) asserts the shipped `AGENTS.md` contains the marker.

- [ ] **Step 1: Insert the convention section** into `packages/core/templates/shared/AGENTS.md.template` (before `## Skills available`):

```markdown
## Orchestration — backlog & /pipeline

> Where multi-step work is planned and prioritised. The `/pipeline` skill reads these.

- **Kickoffs / handoffs** (one task-brief per work item) live at:
  `.ai-factory/orchestrator-prompts/<work-item-name>/kickoff.md`
- **Backlog plan** (priority registry across all work items) lives at:
  `.ai-factory/orchestrator-prompts/plan.md` — `/pipeline` **creates it on first run** if absent.
- **`/pipeline`** (Claude Code; manual workflow on other harnesses) reads the kickoffs + plan,
  ranks them, and emits a launch-table telling you what to start next. An **empty** backlog
  (no kickoffs yet) is normal — it reports "nothing queued", not an error.
- **Kickoff format:** a markdown file beginning with a `Type:` line (`fix` / `research` /
  `feature`), the goal, and — if the work splits into parallel sub-steps — a `## §1 Sub-wave`
  section with one table row per sub-step. Without sub-steps, a plain task brief is fine.

These paths are harness-agnostic (`.ai-factory/`, not `.claude/`) so the backlog is portable
across Claude Code / Cursor / Codex / Aider.
```

- [ ] **Step 2: Verify the doc-authority header is intact** — `AGENTS.md.template:1-7` already carries `Authoritative-for`; the new section is additive, no header change needed. Confirm `bash scripts/check-doc-authority.sh packages/core/templates/shared/AGENTS.md.template` (or the repo's doc-authority probe) still passes.

Run: `bash scripts/audit-ai-docs.sh 2>&1 | grep -i agents || echo "no AGENTS finding"`
Expected: no new failure attributable to AGENTS.md.template.

- [ ] **Step 3: Commit**

```bash
git add packages/core/templates/shared/AGENTS.md.template
git commit -m "docs(install): ship /pipeline backlog storage convention in AGENTS.md (GH #482)"
```

---

## Task 4: Create the consumer data dir in install.sh

**Files:**
- Modify: `install.sh` — near the `.ai-factory/` template block (~line 548, after `mkdir_safe "$PROJECT_ROOT/.ai-factory/rules"`)

- [ ] **Step 1: Add the mkdir** in `install.sh` after `mkdir_safe "$PROJECT_ROOT/.ai-factory/rules"` (line 549):

```bash
# Consumer backlog home for /pipeline (kickoffs + plan + scratch). Agnostic namespace so the
# backlog is portable across harnesses (.claude/ is Claude-Code-specific). Empty until the
# consumer writes their first kickoff; /pipeline treats empty as "nothing queued", not an error.
mkdir_safe "$PROJECT_ROOT/.ai-factory/orchestrator-prompts"
```

- [ ] **Step 2: Verify install still exits 0** (a mid-install crash false-greens — lesson GH #531/#544):

Run: `D=$(mktemp -d); ( cd "$D" && git init -q && bash "$OLDPWD/install.sh" ts-server --force </dev/null ) >"$D/.log" 2>&1; echo "rc=$?"; test -d "$D/.ai-factory/orchestrator-prompts" && echo "DIR OK"`
Expected: `rc=0` and `DIR OK`.

- [ ] **Step 3: Commit**

```bash
git add install.sh
git commit -m "feat(install): create .ai-factory/orchestrator-prompts consumer backlog home"
```

---

## Task 5: Repoint SKILL.md framework-only paths (G3 + G4)

SKILL.md is prose the AI follows (not executable) — verified by reading, covered end-to-end by Task 6's acceptance run. Make these exact edits:

**Files:**
- Modify: `.claude/skills/pipeline/SKILL.md` lines 77, 91, 100, 525

- [ ] **Step 1 (G4 — line 77 `!shell` block):** the injected plan head must use the resolved path.

BEFORE:
```text
head -400 docs/meta-factory/wave-sequencing-plan.md 2>/dev/null || echo "MISSING: wave-sequencing-plan.md"
```
AFTER:
```text
head -400 "$(bash "${CLAUDE_SKILL_DIR}/helpers/lib/print-plan-path.sh" 2>/dev/null)" 2>/dev/null || echo "MISSING: plan (will be created on first run — see §1 Step 3)"
```
Then create `.claude/skills/pipeline/helpers/lib/print-plan-path.sh` (tiny wrapper so the `!shell` block stays declarative):
```bash
#!/usr/bin/env bash
# Prints the resolved backlog-plan path (framework wave-plan or consumer .ai-factory plan).
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
resolve_plan_path
```
Make it executable: `chmod +x .claude/skills/pipeline/helpers/lib/print-plan-path.sh`.

- [ ] **Step 2 (G3 — line 100, first-run stub inputs):** drop the framework-only `EXECUTION-PLAN.md` input.

BEFORE:
```text
**If `wave-sequencing-plan.md` is MISSING entirely:** skill writes a stub from `README.md` + `EXECUTION-PLAN.md` + `ls .claude/orchestrator-prompts/` listing, presents to maintainer for OK, then halts until confirmed.
```
AFTER:
```text
**If the backlog plan is MISSING entirely:** skill writes a stub at the resolved plan path (`.ai-factory/orchestrator-prompts/plan.md` in a consumer) from `README.md` + `.ai-factory/DESCRIPTION.md` (if present) + the kickoff listing under the resolved orch-home, presents to the maintainer for OK, then halts until confirmed. (`EXECUTION-PLAN.md` is framework-only — do not require it.)
```

- [ ] **Step 3 (G4 — line 91):** the stale-ref check path is framework-only; make it conditional.

BEFORE:
```text
4. For every research-patch cited — verify `ls docs/meta-factory/research-patches/<file>.md` exists. Missing → **STALE REF**.
```
AFTER:
```text
4. For every research-patch cited — verify the cited file exists under the project's research/patches dir (framework: `docs/meta-factory/research-patches/`). If the project has no such dir, skip this check. Missing (where the dir exists) → **STALE REF**.
```

- [ ] **Step 4 (G4 — line 525 glob hint):** add the agnostic path.

BEFORE:
```text
<!-- globs: .claude/orchestrator-prompts/**, docs/meta-factory/wave-sequencing-plan.md -->
```
AFTER:
```text
<!-- globs: .claude/orchestrator-prompts/**, .ai-factory/orchestrator-prompts/**, docs/meta-factory/wave-sequencing-plan.md -->
```

- [ ] **Step 5: Verify SKILL.md still parses + line count under the 600 gate**

Run: `wc -l .claude/skills/pipeline/SKILL.md` (expect < 600) and re-read lines 75-101 to confirm coherence.
Expected: edits read coherently; no broken `!shell` fences.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/pipeline/SKILL.md .claude/skills/pipeline/helpers/lib/print-plan-path.sh
git commit -m "fix(pipeline): repoint SKILL.md framework-only paths to resolved agnostic home"
```

---

## Task 6: Acceptance test + framework dogfood smoke (T15)

**Files:**
- Create: `tests/install-sh/consumer-pipeline.test.sh`

- [ ] **Step 1: Write the acceptance test**

Create `tests/install-sh/consumer-pipeline.test.sh`:

```bash
#!/usr/bin/env bash
# consumer-pipeline.test.sh — GH #482 / consumer-usable-pipeline. Proves: (1) install ships the
# backlog convention + dir; (2) /pipeline discovery finds a consumer kickoff under .ai-factory/;
# (3) framework dogfood still resolves to .claude/ (T15). Asserts install rc=0 (no false-green).
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

C=$(mktemp -d)
( cd "$C" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force </dev/null ) >"$C/.install.log" 2>&1
rc=$?
[ "$rc" = "0" ] || bad "install rc=$rc (tail: $(tail -3 "$C/.install.log" | tr '\n' '|'))"

# (1) convention shipped + dir created
grep -qF 'Orchestration — backlog & /pipeline' "$C/AGENTS.md" \
  && ok "AGENTS.md ships the backlog storage convention" \
  || bad "AGENTS.md missing the orchestration convention section"
test -d "$C/.ai-factory/orchestrator-prompts" \
  && ok ".ai-factory/orchestrator-prompts created by install" \
  || bad ".ai-factory/orchestrator-prompts not created"

# (2) consumer writes a kickoff under the agnostic home → discovery finds it
mkdir -p "$C/.ai-factory/orchestrator-prompts/demo"
printf 'Type: fix\n\n## §1 Sub-wave\n| A | do x |\n' > "$C/.ai-factory/orchestrator-prompts/demo/kickoff.md"
DISC=$( REPO_ROOT="$C" bash "$C/.claude/skills/pipeline/helpers/priority-score.sh" 2>&1 || true )
echo "$DISC" | grep -q 'demo' \
  && ok "discovery finds the consumer kickoff via the agnostic .ai-factory home" \
  || bad "discovery did NOT find the consumer kickoff. out: $(printf '%s' "$DISC" | tail -3 | tr '\n' '|')"

# (3) T15 dogfood — in THIS framework repo the resolver still returns the .claude path
FW=$( source "$REPO_ROOT/.claude/skills/pipeline/helpers/lib/common.sh"; REPO_ROOT="$REPO_ROOT" resolve_orch_home )
[ "$FW" = "$REPO_ROOT/.claude/orchestrator-prompts" ] \
  && ok "T15: framework dogfood still resolves to .claude/orchestrator-prompts" \
  || bad "T15: framework orch-home drifted to '$FW' (dogfood broken)"

echo "consumer-pipeline: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = "0" ]
```

- [ ] **Step 2: Run it**

Run: `bash tests/install-sh/consumer-pipeline.test.sh`
Expected: 4 `✓`, `FAIL=0`, exit 0.

- [ ] **Step 3: Wire it into the install-sh meta-suite** (the repo auto-wires install-sh tests — confirm `meta-all-wired.test.sh` does not flag it as unwired; if there's an explicit list, add `consumer-pipeline.test.sh`).

Run: `bash tests/install-sh/meta-all-wired.test.sh 2>&1 | tail -5`
Expected: PASS (new test recognised as wired).

- [ ] **Step 4: Commit**

```bash
git add tests/install-sh/consumer-pipeline.test.sh
git commit -m "test(install): consumer-pipeline acceptance + framework dogfood smoke (GH #482)"
```

---

## Final verification (before PR)

- [ ] `cd packages/core && npx vitest run hooks/ skills/` — all helper tests green.
- [ ] `bash tests/install-sh/consumer-pipeline.test.sh` — acceptance green.
- [ ] `bash tests/install-sh/r2-auto-wire.test.sh` and the broader install-sh suite — no regression from the `install.sh` mkdir.
- [ ] `bash scripts/audit-ai-docs.sh` — no new doc-drift finding.
- [ ] Manual: in THIS repo run `/pipeline` (no arg) → still ranks the framework's own umbrellas (T15 live check, not just the unit smoke).

## Notes for the executor

- **Branch:** create `feat/consumer-usable-pipeline` off `staging` at execution start. The maintainer's uncommitted `#547` WIP (`install.sh` + R2 plan/test) must be preserved first — stash under a named tag or have the maintainer commit it onto `feat/547` — because Task 4 also edits `install.sh` (collision point). Confirm with the maintainer before touching their WIP (Pre-flight rule).
- **Not a capability commit:** this is a rebind + doc, no new dependency and no new ≥50/80-LOC module under `packages/`. If that changes, add a `Prior-art:` trailer (CLAUDE.md).
- **§1.7 PR body:** the repo's discipline-self-check gate wants Forward + Backward sections each with a file:line citation — include them in the PR description.
