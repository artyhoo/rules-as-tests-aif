<!-- scope:channel-earliness-audit -->
# 2026-05-22 — Channel-earliness audit (the §6-deferred retroactive sweep)

> **Authoritative for:** channel-earliness audit findings (per-check channel-floor verdicts + earlier-channel feasibility). This is the retroactive sweep that [.claude/rules/rule-enforcement-channel-selection.md §6](../../../.claude/rules/rule-enforcement-channel-selection.md) explicitly deferred.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists); channel-selection principle — see [.claude/rules/rule-enforcement-channel-selection.md](../../../.claude/rules/rule-enforcement-channel-selection.md).

---

## §1 Origin + scope — this IS the retroactive sweep channel-selection §6 deferred (recursive self-application of §1 axis-2)

[rule-enforcement-channel-selection.md §6](../../../.claude/rules/rule-enforcement-channel-selection.md) (line 78) explicitly deferred a retroactive sweep:

> **«Existing rules — forward-going, not retroactive:** §3 step 5 obligates *new or relocated* rules to declare their delivery channel; it does **not** trigger a retroactive sweep of the existing `.claude/rules/*.md` (none of which declare a channel today). They declare channel at next substantive touch…»

**This audit is that deferred retroactive sweep**, triggered by the N8 C4/C5 triggering incident: while building N8 items C4/C5, the agent defaulted them to pre-push and only moved C4 to edit-time *after the maintainer asked «can't we catch hotter / earlier?»*. The agent had trusted an upstream doc's channel assignment instead of re-deriving the floor from the invariant.

**Scope: P1 — the framework's OWN enforcement checks** (the 5 surfaces enumerated in §2). Whether to also sweep P2 (consumer-prescribed eslint configs, dep-cruiser ARCHITECTURE, RULES.md under `packages/core/templates/` and `packages/preset-next-15-canonical/`) is a DECISION-NEEDED surfaced in §10.

**Lens applied per check:** «where does the data live → what is the channel floor?» — re-derived from source for every check, not inherited from any prior inventory.

**Key correction discovered during population enumeration (T-CE-A):** the kickoff's inventory said `check-kickoff-traps.sh` and `inject-matching-rule.sh` were NOT wired in settings.json. This was accurate at kickoff-authoring time but is **STALE as of the current commit**. Both are NOW wired in `.claude/settings.json` as PostToolUse `Edit|Write` hooks (lines in the `hooks.PostToolUse` array, verified below). `check-hook-marker.sh` is also wired — this is a NEW hook not in the kickoff inventory. The dormant-hook finding applies to **zero** hooks in the current state; all existing hooks are wired. This is itself a finding: the kickoff's hypothesis was wrong; the corrected picture is better than expected.

---

## §2 Population enumeration (T10) — full check list across 5 surfaces + counts

Enumerated BEFORE any verdict. All counts verified via `ls` and `grep` output recorded below.

### Surface 1 — Edit-time / session hooks (`.claude/hooks/*.sh`)

Command: `ls -1 .claude/hooks/*.sh`

```text
.claude/hooks/ask-question-reminder.sh
.claude/hooks/check-doc-authority.sh
.claude/hooks/check-hook-marker.sh
.claude/hooks/check-kickoff-traps.sh
.claude/hooks/deps-hash-check.sh
.claude/hooks/end-of-turn-reminder.sh
.claude/hooks/inject-matching-rule.sh
.claude/hooks/inject-session-bootstrap.sh
.claude/hooks/validate-prompt.sh
```

Count: **9 hook scripts**

**Wiring verified from `.claude/settings.json`** (full file read; wired hooks):

| Hook | Event | Matcher | Wired? |
|---|---|---|---|
| `check-doc-authority.sh` | PostToolUse | `Edit\|Write` | ✅ YES |
| `validate-prompt.sh` | PostToolUse | `Edit\|Write` | ✅ YES |
| `inject-matching-rule.sh` | PostToolUse | `Edit\|Write` | ✅ YES |
| `check-kickoff-traps.sh` | PostToolUse | `Edit\|Write` | ✅ YES |
| `check-hook-marker.sh` | PostToolUse | `Edit\|Write` | ✅ YES |
| `inject-session-bootstrap.sh` | UserPromptSubmit | (none) | ✅ YES |
| `deps-hash-check.sh` | UserPromptSubmit | (none) | ✅ YES |
| `ask-question-reminder.sh` | PreToolUse | `AskUserQuestion` | ✅ YES |
| `end-of-turn-reminder.sh` | Stop | (none) | ✅ YES |

**Finding: ZERO dormant hooks in the current state.** All 9 hooks are wired. The kickoff inventory's hypothesis that `check-kickoff-traps.sh` and `inject-matching-rule.sh` were dormant is stale — they were wired in N8 C2/C4 respectively (the same wave that prompted this audit).

### Surface 2 — Pre-push sections (`packages/core/hooks/pre-push.ts`)

Command: `grep -n "// ──" packages/core/hooks/pre-push.ts`

| Section | Line | Identifier |
|---|---|---|
| §1 | 232 | actionlint (workflow YAML correctness) |
| §2 | 243 | zizmor (supply-chain audits) |
| §3 | 253 | Self-test pipeline (audit-ai-docs.test.ts) |
| §3a | 263 | Hook stub completeness — ported to principle 16 |
| §3b | 265 | Skill drift check (check-skill-drift.sh) |
| §4 | 271 | Manifest render drift (render-rules.ts --check) |
| §5 | 281 | Principles meta-tests |
| §6 | 291 | Spec discipline (dormant defensive guard) |
| §7 | 316 | Prior-art trailer (§7) |
| §1.7 | 321 | Discipline trailer |
| §8 | 326 | lychee offline link check |

Count: **11 pre-push sections** (§3a is commented-out / delegated to principle 16)

Check files: `packages/core/hooks/checks/prior-art.ts`, `packages/core/hooks/checks/s17.ts`, `packages/core/hooks/checks/registry.ts`

### Surface 3 — Principle tests (`packages/core/principles/*.test.ts`)

Command: `ls -1 packages/core/principles/*.test.ts`

```text
01-executable-check.test.ts
02-paired-negative-test.test.ts
03-ast-over-grep.test.ts
04-no-tautology.test.ts
05-manifest-ssot.test.ts
06-must-not-demoted.test.ts
07-documents-lie.test.ts
08-prior-art-cited.test.ts
09-doc-authority-hierarchy.test.ts
10-research-patch-annotation.test.ts
11-build-first-reuse-default.test.ts
12-ai-laziness-traps.test.ts
13-phase-research-coverage-s17.test.ts
14-skill-drift-detection.test.ts
15-skill-paired-negative.test.ts
16-hook-stub-completeness.test.ts
17-no-paid-llm-in-ci.test.ts
```

Count: **17 principle tests**

### Surface 4 — CI workflows (`.github/workflows/*.yml`)

Command: `ls -1 .github/workflows/*.yml`

```text
.github/workflows/audit-self.yml
.github/workflows/discipline-self-check.yml
.github/workflows/framework-self-template-render.yml
.github/workflows/workflow-integrity.yml
```

Count: **4 CI workflows** — but the CHECK population in CI maps to audit-self.yml's jobs:
- `mechanical` — bash/JSON/YAML syntax, ≤500-line markdown, dead-link check, research-patch scope annotations, stale path references
- `rule-to-probe` — every R-rule has probe/manual/ESLint delegation
- `negative-tests` — audit-ai-docs.test.ts (vitest)
- `manifest-drift` — render-rules.ts --check
- `principles-meta-tests` — all 17 principle tests + hook anti-tautology tests
- `typecheck` — tsc --noEmit all workspaces
- `pr-commit-trailers` — §1.7 + Prior-art over PR range (backstop)
- `actionlint` — YAML+expression correctness on workflows
- `zizmor` — supply-chain audits on workflows
- `discipline-self-check.yml` — §1.7 sections in PR body for discipline-touching PRs
- `framework-self-template-render.yml` — template render probes P1/P4/P6
- `workflow-integrity.yml` — branch protection assertion (R11)

### Surface 5 — Pre-commit hook (`.husky/pre-commit`)

```text
.husky/pre-commit   (bash syntax / JSON / YAML validity / markdown ≤500 lines / markdownlint-cli2 / spec-discipline soft-warn)
.husky/pre-push     (dispatcher → packages/core/hooks/pre-push.ts)
```

Count: **1 pre-commit hook** (with 6 distinct checks inside)

**Grand total: 9 hooks + 11 pre-push sections + 17 principle tests + ~12 CI workflow check-steps + 6 pre-commit checks = 55 check surfaces** (some of these are identical checks at different channels — counted once per channel for the matrix).

---

## §3 Coverage matrix — one row per check (data-location → floor → verdict → feasibility)

The lens: **where does the data live → what is the channel floor?**

Surface B note (verified via kickoff §load-bearing principle): Claude Code PostToolUse hooks fire on the agent's Edit/Write. LSP/ESLint runs in the editor for humans (surface A) and does NOT surface back to the agent via PostToolUse. Therefore a check is agent-edit-time **iff** it is wired as a surface-B PostToolUse hook. This is the framing applied throughout.

### Surface 1 — Hook-by-hook

| Hook | Current channel | Data lives in (T3 evidence) | Floor | Verdict |
|---|---|---|---|---|
| `check-doc-authority.sh` | PostToolUse `Edit\|Write` (wired) + principle 09 (pre-push/CI) | Single edited file: `check-doc-authority.sh:8` reads `jq -r '.tool_input.file_path'` → passes to `09-doc-authority-hierarchy.bin.ts` over single `REL_PATH` | single file content | **ALREADY-AT-FLOOR** (model dual-channel) |
| `validate-prompt.sh` | PostToolUse `Edit\|Write` (wired) + pre-push §6 (dormant guard) | Single edited file: `validate-prompt.sh:24` reads `jq -r '.tool_input.file_path'`; checks `.claude/orchestrator-prompts/**/*.md` only | single file content | **ALREADY-AT-FLOOR** (edit-time is floor for single-file check; §6 pre-push is dormant backstop for force-added gitignored files) |
| `check-hook-marker.sh` | PostToolUse `Edit\|Write` (wired) | Single edited file: `check-hook-marker.sh:23` reads `jq -r '.tool_input.file_path'`; filters to `.claude/hooks/*.sh` only | single file content | **ALREADY-AT-FLOOR** (fires at agent edit-time on hook files, which is the earliest reachable channel for hook marker presence) |
| `check-kickoff-traps.sh` | PostToolUse `Edit\|Write` (wired) | Single edited file: `check-kickoff-traps.sh:28` reads `jq -r '.tool_input.file_path'`; reads file at that path (`CONTENT="$(cat "$ABS_PATH")"`) | single file content | **ALREADY-AT-FLOOR** (edit-time gate on kickoff.md — the only reachable channel given gitignored path; principle 12 is CI backstop) |
| `inject-matching-rule.sh` | PostToolUse `Edit\|Write` (wired) | Single edited file path: `inject-matching-rule.sh:21` reads `jq -r '.tool_input.file_path'`; matches against `.claude/rules/*.md` glob markers | single file path + rule files (read from disk) | **ALREADY-AT-FLOOR** (injection hook by design — not a gate; breadth is path-scoped deterministic per channel-selection §4 ADAPT) |
| `inject-session-bootstrap.sh` | UserPromptSubmit (wired) | Static digest: `inject-session-bootstrap.sh:5` outputs hardcoded `cat <<'DIGEST'` text | static text | **ALREADY-AT-FLOOR** (always-on injection per §4 catalogue; goal-invariant digest belongs at UserPromptSubmit, not edit-time) |
| `deps-hash-check.sh` | UserPromptSubmit (wired) | `.ai-factory/tool-decisions.md` + `package.json`: `deps-hash-check.sh:14` reads `DECISIONS=".ai-factory/tool-decisions.md"` and computes sha256 of package.json deps | two files (tool-decisions + package.json) | **ALREADY-AT-FLOOR** — the check compares deps hash across the whole project on each prompt; a PostToolUse hook would only fire when package.json is edited, missing changes from other entry points. UserPromptSubmit is the correct channel for a session-start invariant check. The current channel matches the check's nature. |
| `ask-question-reminder.sh` | PreToolUse `AskUserQuestion` (wired) | Session state (loop guard via temp file, recency flag): `ask-question-reminder.sh:23-24` — temporal recency guard with flag file | session state (no file data) | **ALREADY-AT-FLOOR** (PreToolUse on AskUserQuestion is the only deterministic channel for pre-question challenges; firing earlier would have no AskUserQuestion to gate) |
| `end-of-turn-reminder.sh` | Stop (wired) | Transcript path: `end-of-turn-reminder.sh:9` reads `jq -r '.transcript_path'` and parses it | transcript content | **ALREADY-AT-FLOOR** (Stop is the only channel that fires at end-of-turn; no earlier channel has transcript data) |

**Surface 1 summary: 9/9 hooks — all ALREADY-AT-FLOOR.** The kickoff's hypothesis about dormant hooks is stale; all are now wired and correctly placed.

### Surface 2 — Pre-push sections

| Section | Current channel | Data lives in (T3 evidence) | Floor | Verdict | Feasibility notes |
|---|---|---|---|---|---|
| §1 actionlint | pre-push + CI `actionlint` job | `workflowYmlFiles()` at `pre-push.ts:67-74`: `git diff --name-only` filtered to `.github/workflows/*.yml` (DIFF RANGE) | diff range of workflow `.yml` files | **ADD-DUAL-CHANNEL** | At edit-time: the hook has the single edited `.yml` file. It needs: only that one file (actionlint can run on a single file). Reachable? YES — `actionlint <file>` works on a single file. Surface B (agent edit-time) via a PostToolUse hook that runs `actionlint` on the edited `.yml`. Surface A: no editor integration assumed. Note: actionlint must be installed (pre-push already requires it). The edit-time companion would reduce shift-left on agent workflow edits. |
| §2 zizmor | pre-push + CI `zizmor` job | `pre-push.ts:243-249`: `requireTool('zizmor', ['--format', 'plain', '.github/workflows/'])` — runs over the ENTIRE workflows dir | whole workflows directory | **CANT-MOVE-NEEDS-JUDGEMENT** | At edit-time: the hook has the single edited file path. zizmor scans `.github/workflows/` as a whole (supply-chain checks across files — e.g. cross-file permission inheritance). Running on a single file would miss cross-file interactions. Technically feasible per-file with `zizmor --format plain <file>` but the supply-chain audit's value comes from the whole-dir scan. Verdict: KEEP at pre-push (where it has the full dir). A per-file zizmor at edit-time is ADD-DUAL-CHANNEL-with-caveat: reduced scope (single file, misses cross-file), reduces false-negatives between pushes but may under-fire on cross-file issues. Surface question: pre-push is the correct floor for whole-dir analysis; single-file companion is useful but incomplete. |
| §3 audit-ai-docs.test.ts (pre-push self-test pipeline) | pre-push + CI `negative-tests` job | `pre-push.ts:253-261`: runs `npx vitest run packages/core/audit-self/audit-ai-docs.test.ts` — this test creates TEMP DIRS (`mkdtempSync`) and runs against synthetic fixtures, not the edited file | synthetic fixtures in temp dirs — NOT file-based | **ALREADY-AT-FLOOR** | The check validates the *test infrastructure* via synthetic fixtures — it doesn't check a specific edited file's content. Pre-push is correct (repo integrity gate). An edit-time hook would have no edited file to validate against. |
| §3b skill drift (check-skill-drift.sh) | pre-push §3b + CI principle 14 + **edit-time via npm script** | `pre-push.ts:265-270`: `run('bash', ['scripts/check-skill-drift.sh'])` — scans `.claude/skills`, `agents/`, `skills/` for broken refs + missing frontmatter | cross-directory repo scan | **ALREADY-AT-FLOOR** (multi-channel) | Principle 14 comment: «Channel 1 — edit-time: npm run check:skill-drift (invokes the script directly)». `package.json:7`: `"check:skill-drift": "bash scripts/check-skill-drift.sh"`. This is a manual / developer-invoked channel, not a PostToolUse hook. It is NOT wired as surface B (agent edit-time). A true surface-B PostToolUse companion is feasible: on Edit/Write of `.claude/skills/**/*.md` or `agents/*.md`, run `check-skill-drift.sh` on the edited file's directory. The whole-repo scan is still needed for cross-ref checks. VERDICT AMENDED: **ADD-DUAL-CHANNEL** — add a surface-B PostToolUse hook filtered to skill/agent file edits; keep pre-push whole-scan backstop. |
| §4 manifest render drift (render-rules.ts --check) | pre-push + CI `manifest-drift` job | `pre-push.ts:271-280`: `run('npx', ['tsx', 'packages/core/render/render-rules.ts', '--check'])` — reads `rules-manifest.json` AND `packages/preset-next-15-canonical/RULES.md` (`render-rules.ts:31,87`) and compares | TWO files: manifest + RULES.md | **ADD-DUAL-CHANNEL** (with caveat) | At edit-time (PostToolUse): the hook has the single edited file. It additionally needs the OTHER file (if manifest edited → needs RULES.md; if RULES.md edited → needs manifest). Both are readable from disk at edit-time. T-CE-B: hook reads the sibling from disk AND handles «the sibling was the file edited» symmetrically. Reachable? YES with caveat: the edit-time companion runs `render-rules.ts --check` triggered on edits to either `rules-manifest.json` OR `packages/preset-next-15-canonical/RULES.md`. Mechanism: PostToolUse hook that checks `file_path` matches either file, then runs the same `render-rules.ts --check`. Deterministic (grep/AST free). |
| §5 principles meta-tests | pre-push + CI `principles-meta-tests` job | `pre-push.ts:281-290`: `run('npm', ['--prefix', CORE, 'run', 'test:principles'])` — runs ALL 17 principle tests, each reading cross-file data (manifests, PATCHES_DIR, REQUIRED_HEADER_DOCS, etc.) | cross-file / whole-repo data per test | **ALREADY-AT-FLOOR** | Each principle test reads cross-file data (see §4 per-principle breakdown). The test suite as a whole is a repo-wide invariant check. Pre-push is the floor. Some individual principles are per-file-decomposable (see §4). |
| §6 spec discipline (dormant guard) | pre-push (conditional on force-added gitignored files) | `pre-push.ts:291-315`: `git diff 'origin/main...HEAD'` filtered to `.claude/orchestrator-prompts/**/*.md` — diff range data | diff range (gitignored files force-added) | **ALREADY-AT-FLOOR** | The guard fires only when gitignored files are force-added past `.gitignore`. The `validate-prompt.sh` PostToolUse hook covers the edit-time surface for orchestrator-prompts. §6 is the pre-push backstop for the anomalous force-add path. This is correct dual-channel by design (T-CE-C). |
| §7 Prior-art trailer | pre-push + CI `pr-commit-trailers` backstop | `checks/prior-art.ts:112-115`: `detectCapabilityReason(sha, g)` reads `g.packageJsonDiff(sha)`, `g.changedFiles(sha)`, `g.fileContent(sha, path)` — COMMIT-LEVEL data | commit message body + diff across the commit | **ALREADY-AT-FLOOR** | Edit-time has no commit message or commit diff. The floor is commit-msg (earliest) or pre-push. Pre-push is the correct floor when the check needs the full commit diff + message. KEEP. |
| §1.7 discipline trailer | pre-push + CI `pr-commit-trailers` backstop | `checks/s17.ts:44-47`: `isDisciplineIntroducing(sha, g)` reads `g.commitSubject(sha)`, `g.changedFiles(sha)`, `g.diffForPaths(sha, rulePaths)` — COMMIT-LEVEL data | commit message + diff | **ALREADY-AT-FLOOR** | Same as §7 — data is commit-level. Pre-push is the floor. KEEP. |
| §8 lychee link check | pre-push | `pre-push.ts:326-349`: `git diff --name-only ${upstreamRef()}..HEAD --diff-filter=ACMR` filtered to `*.md` — DIFF RANGE of changed markdown files, then `lychee --offline --no-progress ...changedMd` | diff range of `.md` files, then link targets in each file | **ADD-DUAL-CHANNEL** (with caveat) | At edit-time: the hook has the single edited `.md` file. lychee can run on a single file: `lychee --offline --no-progress <file>`. T-CE-B: only needs the one file + its link targets (lychee resolves them). Reachable? YES — `lychee --offline <single-file>` is a valid invocation. Caveat: the pre-push version catches ALL changed md files in the diff; the edit-time companion catches ONLY the file being edited (misses other changed files that aren't being edited now). This is the standard ADD-DUAL-CHANNEL pattern — keep pre-push backstop, add edit-time companion for the current file. Mechanism: PostToolUse hook that runs `lychee --offline --no-progress "$ABS_PATH"` on Edit/Write of `*.md`. |

**Pre-commit hook (`husky/pre-commit`) — sub-checks:**

| Sub-check | Current channel | Data lives in | Floor | Verdict |
|---|---|---|---|---|
| Bash syntax (`bash -n *.sh`) | pre-commit (staged files) | Single staged file content (`.sh`) | pre-commit (can't do edit-time bash -n easily on partial file; staged = committed intent) | **ADD-DUAL-CHANNEL** — a PostToolUse hook running `bash -n "$ABS_PATH"` on `.sh` file edits is feasible and would catch syntax errors earlier than pre-commit (before the file is even staged). At edit-time the hook has the single file. bash -n needs only that one file. Reachable? YES. Mechanism: PostToolUse hook, `bash -n`. |
| JSON validity | pre-commit (staged files) | Single staged `.json` file content | pre-commit | **ADD-DUAL-CHANNEL** — `python3 -c "import json; json.load(open('$ABS_PATH'))"` at PostToolUse on `.json` edits. Feasible, same data shape. |
| YAML validity | pre-commit (staged files) | Single staged `.yml`/`.yaml` file content | pre-commit | **ADD-DUAL-CHANNEL** — `python3 -c "import yaml; yaml.safe_load(open('$ABS_PATH'))"` at PostToolUse. Feasible. |
| Markdown ≤500 lines | pre-commit (staged files) | Single staged `.md` file, line count | pre-commit | **ADD-DUAL-CHANNEL** — `wc -l` at PostToolUse on `.md` edits. Trivially feasible. |
| markdownlint-cli2 | pre-commit (staged files) | Single staged `.md` file content | pre-commit | **ADD-DUAL-CHANNEL** — `npx markdownlint-cli2 "$ABS_PATH"` at PostToolUse on `.md` edits. Single file, markdownlint-cli2 supports per-file invocation. Feasible. |
| Spec discipline soft-warn | pre-commit (staged orchestrator-prompts) | Staged `.claude/orchestrator-prompts/**/*.md` | pre-commit | **ALREADY-AT-FLOOR** — `validate-prompt.sh` PostToolUse hook already covers this at agent edit-time. Pre-commit is a backstop for human edits. Correct dual-channel. |

### Surface 3 — Principle tests (floor analysis per test)

| Principle | Data scope | Current channel | Floor | Verdict |
|---|---|---|---|---|
| 01-executable-check | `rules-manifest.json` (single file) | pre-push + CI | single file, but manifest-wide scan | **ALREADY-AT-FLOOR** (pre-push/CI is correct — the manifest is checked as a whole; an edit-time companion would need to parse the manifest on every edit, which is redundant with principle 05 manifest-drift check) |
| 02-paired-negative-test | `rules-manifest.json` (single file) | pre-push + CI | manifest-wide | **ALREADY-AT-FLOOR** (same reasoning as 01) |
| 03-ast-over-grep | `rules-manifest.json` (single file) | pre-push + CI | manifest-wide | **ALREADY-AT-FLOOR** |
| 04-no-tautology | `rules-manifest.json` (single file) | pre-push + CI | manifest-wide | **ALREADY-AT-FLOOR** |
| 05-manifest-ssot | `rules-manifest.json` + `RULES.md` (`05-manifest-ssot.test.ts:26-27`) — runs `render-rules.ts --check` | pre-push + CI | two files | **ADD-DUAL-CHANNEL** — overlaps with §4 render drift ADD-DUAL-CHANNEL candidate; both checks fire on the same two files. The edit-time companion for manifest render drift covers this principle's check too. Single ADD-DUAL-CHANNEL implementation covers both. |
| 06-must-not-demoted | `rules-manifest.json` (single file) | pre-push + CI | manifest-wide | **ALREADY-AT-FLOOR** |
| 07-documents-lie | `rules-manifest.json` (single file) | pre-push + CI | manifest-wide | **ALREADY-AT-FLOOR** |
| 08-prior-art-cited | `docs/meta-factory/phase-*-research.md` files (dir scan at `08-prior-art-cited.test.ts:102`) + `prior-art-evaluations.md` | pre-push + CI | cross-file (research dir) | **ADD-DUAL-CHANNEL** — feasible for the SSOT existence arm: when `prior-art-evaluations.md` is edited, check that cited IDs in research files still resolve; when a research file is edited, check its SSOT citations. At edit-time: hook reads the edited file + the SSOT from disk. Reachable? YES with disk read. Mechanism: PostToolUse hook filtered to `docs/meta-factory/phase-*-research.md` + `docs/meta-factory/prior-art-evaluations.md`. |
| 09-doc-authority-hierarchy | `REQUIRED_HEADER_DOCS` list of specific files (`09-doc-authority-hierarchy.test.ts:47`) — reads each designated doc | pre-push + CI + **check-doc-authority.sh PostToolUse** | single file (per designated doc) | **ALREADY-AT-FLOOR** (the canonical dual-channel model: PostToolUse hook + CI principle test) |
| 10-research-patch-annotation | `docs/meta-factory/research-patches/*.md` (dir scan) — checks first line for `<!-- scope: -->` | pre-push + CI | single file first line | **ADD-DUAL-CHANNEL** — the check reads only the first line of a single file (`10-research-patch-annotation.test.ts:33`). At edit-time: PostToolUse hook on `docs/meta-factory/research-patches/*.md` edits can check `head -1 "$ABS_PATH"` against `^<!-- scope:[a-zA-Z0-9.§-]+ -->$`. Reachable? YES — single file, single line. Mechanism: PostToolUse grep hook. Simpler than check-doc-authority (no AST needed — literal first-line check). |
| 11-build-first-reuse-default | `REQUIRED_HEADER_DOCS` list → each `.claude/rules/*.md`, `.claude/skills/*/SKILL.md`, `agents/*.md` + `prior-art-evaluations.md` (`11-build-first-reuse-default.test.ts:113-128`) | pre-push + CI | cross-file (BFR verdict for each capability artifact requires checking both the artifact + its SSOT entry) | **ALREADY-AT-FLOOR** — the check is cross-file by design (each capability artifact needs a corroborating SSOT entry or commit trailer, requiring both files at minimum). An edit-time companion could check: when editing `.claude/rules/*.md`, verify an SSOT entry or Prior-art trailer exists. Feasible but the commit-trailer arm is not available at edit-time. Partial edit-time check (SSOT presence only) is possible but would miss the trailer arm. Verdict: ALREADY-AT-FLOOR for the combined check; the SSOT arm alone could be edit-time but the split would be complex. |
| 12-ai-laziness-traps | `kickoffs` under `.claude/orchestrator-prompts/` (dir scan at `12-ai-laziness-traps.test.ts:62`) | pre-push + CI + **check-kickoff-traps.sh PostToolUse** | single file | **ALREADY-AT-FLOOR** (dual-channel: PostToolUse hook for count floor + CI for citation presence) |
| 13-phase-research-coverage-s17 | `docs/meta-factory/research-patches/*.md` (dir scan at `13-phase-research-coverage-s17.test.ts:61`) — reads each patch's content | pre-push + CI | single file per patch (§1.7 substance in each file) | **ADD-DUAL-CHANNEL** — the §1.7 substance check (`13-phase-research-coverage-s17.test.ts:109` reads file content) can be decomposed per-file. At edit-time: PostToolUse hook on `docs/meta-factory/research-patches/*.md` edits checks the file content for §1.7 substance markers. Reachable? YES — single file, grep for `Self-review\|Self-application\|T15\|Forward.*Backward\|forward-check`. Mechanism: PostToolUse grep hook. This is a strong ADD-DUAL-CHANNEL candidate — research patches are commonly authored by AI agents in single-file edits. |
| 14-skill-drift-detection | `scripts/check-skill-drift.sh` existence + execution against `.claude/skills/`, `agents/`, `skills/` dirs | pre-push + CI + npm script (manual) | cross-directory repo scan (broken refs check needs to resolve cross-file links) | **ALREADY-AT-FLOOR** (with amendment: a surface-B PostToolUse hook filtered to skill/agent file edits is the missing channel, as noted in §3b above) |
| 15-skill-paired-negative | Each in-scope `SKILL.md` under `.claude/skills/` (`15-skill-paired-negative.test.ts:35`) | pre-push + CI | single file (`SKILL.md` content) | **ADD-DUAL-CHANNEL** — the paired-negative check reads a single `SKILL.md` (`15-skill-paired-negative.test.ts:90`). At edit-time: PostToolUse hook on `.claude/skills/*/SKILL.md` edits checks for `## Without this skill` + `## With this skill` sections. Reachable? YES — single file, grep/structural check. Mechanism: PostToolUse grep hook (checks section presence and non-triviality). |
| 16-hook-stub-completeness | `packages/core/hooks/pre-push.ts` (single file at `16-hook-stub-completeness.test.ts:35`) + `tests/hooks/*.test.sh` files | pre-push + CI | two surfaces: pre-push.ts (single file) + test files (dir scan) | **ADD-DUAL-CHANNEL** — the check reads `pre-push.ts` to find hard-fail test invocations, then reads `tests/hooks/*.test.sh` to verify stubs. At edit-time on `pre-push.ts` edits: PostToolUse hook can check that any new hard-fail invocation has a corresponding stub in the test files (reads test files from disk). At edit-time on `tests/hooks/*.test.sh` edits: PostToolUse hook can check the reverse. Mechanism: PostToolUse hook that reads both `pre-push.ts` and `tests/hooks/*.test.sh` from disk. Reachable? YES — both are in the repo; small files. Note: principle 16 comment says «ZERO `.test.sh` hard-fail invocations» currently — if this remains true, the edit-time companion is a near-no-op but still a valid sentinel. |
| 17-no-paid-llm-in-ci | `readdirSync('.github/workflows')` — ALL workflow files (`17-no-paid-llm-in-ci.test.ts:69`) | pre-push + CI | whole workflows dir scan | **ADD-DUAL-CHANNEL** — the check is decomposable per-file: when editing a `.github/workflows/*.yml` file, run the paid-LLM grep on THAT file. The whole-dir scan in CI remains the backstop. At edit-time: PostToolUse hook on `.github/workflows/*.yml` edits runs `scanForPaidLlm` grep on the single file. Reachable? YES — the scan is a grep over a single file's content. Mechanism: PostToolUse grep hook. Strong candidate — agents may edit workflows and introduce paid-LLM references. |

### Surface 4 — CI-only checks (not covered by pre-push)

| CI check | Current channel | Data lives in | Floor | Verdict |
|---|---|---|---|---|
| Bash syntax of ALL `*.sh` (audit-self.yml mechanical step) | CI only | All `.sh` files across repo | whole-repo scan | **ADD-DUAL-CHANNEL** — per-file bash syntax (`bash -n`) is the pre-commit check and the PostToolUse ADD candidate (named in pre-commit section above). The CI whole-repo scan is the backstop. |
| JSON validity of ALL `*.json` (audit-self.yml mechanical step) | CI only | All `.json` files across repo | whole-repo scan | **ADD-DUAL-CHANNEL** — per-file JSON validity is the pre-commit + PostToolUse ADD candidate (named above). |
| No file >500 lines (audit-self.yml mechanical step) | CI only | All `.md` files across repo | whole-repo scan | **ADD-DUAL-CHANNEL** — per-file `wc -l` is the pre-commit + PostToolUse ADD candidate (named above). |
| Dead-link check `.md→.md` (audit-self.yml mechanical step) | CI only | All `.md` files | whole-repo scan | **ADD-DUAL-CHANNEL** — per-file basis is feasible (grep links from single edited file, resolve relative paths). Simpler than lychee (internal `.md` links only). PostToolUse hook on `.md` edits could run the link-resolution grep. |
| Research patch scope annotations (audit-self.yml mechanical step) | CI only + principle 10 (pre-push/CI) | Each `docs/meta-factory/research-patches/*.md` first line | single file, first line | **ADD-DUAL-CHANNEL** — identical to principle 10 analysis above. The CI and principle 10 are both backstops; the edit-time companion is the same PostToolUse hook. |
| Stale path references (audit-self.yml mechanical step) | CI only | Whole-repo grep across `*.md` and `*.sh` | whole-repo scan | **ALREADY-AT-FLOOR** — requires whole-repo grep; can't be done per-file (stale reference could be in any file, not the one being edited). |
| Rule-to-probe mapping (audit-self.yml rule-to-probe job) | CI only | `RULES.md` files (`packages/preset-next-15-canonical/RULES.md`, `RULES.react-next.md`) | single/two files | **ADD-DUAL-CHANNEL** — the check reads RULES.md to verify each R-rule has a probe. On edits to `RULES.md`, a PostToolUse hook could run the rule-to-probe grep on the single file. |
| §1.7 discipline-self-check (discipline-self-check.yml) | CI (PR-scoped) | PR body text (GitHub event data) | PR-scoped | **ALREADY-AT-FLOOR** — the PR body is not available at edit-time or pre-push; only CI (PR event) has `github.event.pull_request.body`. This is the correct floor. |
| Template render probes P1/P4/P6 (framework-self-template-render.yml) | CI only | Template files + rendering logic | cross-file (template rendering requires multiple files) | **ALREADY-AT-FLOOR** — template rendering requires the full template + rendering engine; not decomposable to a single file check at edit-time without significant complexity. |
| Workflow integrity / branch protection (workflow-integrity.yml) | CI only | GitHub API data (branch protection settings) | CI/API-only | **ALREADY-AT-FLOOR** — requires GitHub API access; no earlier channel has this. |
| TypeScript typecheck (tsc --noEmit) | pre-push + CI `typecheck` job | whole TypeScript project (all workspaces) | whole-project | **ADD-DUAL-CHANNEL** — per-file `tsc --noEmit --skipLibCheck <file>` or the equivalent LSP check is surface A (human editor). For surface B (agent edit-time): a PostToolUse hook running `tsc --noEmit` on the single edited `.ts` file is feasible but may produce cross-file errors from the single-file invocation. A better approach is per-file type-check via the existing project's `tsconfig.json` scoped to the edited path. Feasible but complex. This is an ADD-DUAL-CHANNEL candidate with caveat: the single-file tsc check will surface cross-module errors, making it noisier at edit-time. |

---

## §4 MOVE / ADD candidates — each with Step-3 feasibility line + proposed deterministic mechanism

Ranked by value (reduction in defect-detection latency × frequency of agent edits to that surface).

### Candidate A — Manifest render drift (principle 05 / pre-push §4): ADD-DUAL-CHANNEL

**Edit-time feasibility:**
> At edit-time (PostToolUse Edit|Write) the hook has: the edited file path + its post-edit content. This check additionally needs: the OTHER manifest/RULES.md file (whichever was NOT just edited). Reachable from disk? YES — `readFileSync('packages/preset-next-15-canonical/RULES.md', 'utf8')` and `readFileSync('packages/core/manifest/rules-manifest.json', 'utf8')` are both available at edit-time.

**Mechanism:** PostToolUse hook (surface B, deterministic) filtered to `packages/core/manifest/rules-manifest.json` OR `packages/preset-next-15-canonical/RULES.md` edits → runs `npx tsx packages/core/render/render-rules.ts --check`. No new dependency (REUSE the existing render-rules.ts infrastructure). `@dual-pair: manifest-render-drift` anchor.

**Value:** high — agents commonly edit the manifest, and render drift is a silent divergence that currently only surfaces at pre-push. This is the closest analog to the doc-authority pattern.

### Candidate B — Research patch §1.7 substance (principle 13): ADD-DUAL-CHANNEL

**Edit-time feasibility:**
> At edit-time the hook has: the single edited research-patch `.md` file + its content. This check additionally needs: nothing else (substance markers are in the file itself: `Self-review`, `Self-application`, `T15`, `Forward` + `Backward`, `forward-check`). Reachable? YES.

**Mechanism:** PostToolUse hook (surface B, deterministic) filtered to `docs/meta-factory/research-patches/*.md` edits → grep for substance markers: `grep -qiE 'self-review|self-application|self-reflection|recursive|T15|forward-check' "$ABS_PATH" || (grep -qi 'forward' "$ABS_PATH" && grep -qi 'backward' "$ABS_PATH")`. Exit 1 if markers absent. `@dual-pair: research-patch-s17-substance` anchor.

**Value:** high — research patches are authored in single-file agent edits; the §1.7 substance check currently only fires at CI. An agent can write a structurally-compliant but substance-empty §1.7 section and not discover it until CI. Edit-time catches it at the moment of authorship.

### Candidate C — Research patch scope annotation (principle 10): ADD-DUAL-CHANNEL

**Edit-time feasibility:**
> At edit-time the hook has: the single edited research-patch `.md` file. It additionally needs: only the first line of that file. Reachable? YES — `head -1 "$ABS_PATH"`.

**Mechanism:** PostToolUse hook (surface B, deterministic) filtered to `docs/meta-factory/research-patches/*.md` edits → `head -1 "$ABS_PATH" | grep -qE '^<!-- scope:[a-zA-Z0-9.§-]+ -->$'`. Exit 1 if absent. This is the simplest possible hook (grep on first line). `@dual-pair: research-patch-scope-annotation` anchor.

**Value:** medium-high — research patches are authored by agents; forgetting the scope annotation is a common error currently caught only at CI. The hook is trivial to implement.

**Note:** Candidates B and C share the same path filter (`docs/meta-factory/research-patches/*.md`) and could be combined into a single hook script.

### Candidate D — Skill paired-negative (principle 15): ADD-DUAL-CHANNEL

**Edit-time feasibility:**
> At edit-time the hook has: the single edited `SKILL.md` file. This check additionally needs: only the `## Without this skill` and `## With this skill` section presence + non-triviality. Reachable? YES — grep on the single file.

**Mechanism:** PostToolUse hook (surface B, deterministic) filtered to `.claude/skills/*/SKILL.md` edits → grep for both sections + check they are non-empty and differ. AST-over-grep applies here: the sections are structured markdown headings, not raw text; a grep for `^## Without this skill` and `^## With this skill` plus a non-empty check is correct. `@dual-pair: skill-paired-negative` anchor.

**Value:** medium — skills are authored less frequently than research patches, but the paired-negative requirement is easy to forget.

### Candidate E — No paid LLM in CI (principle 17): ADD-DUAL-CHANNEL

**Edit-time feasibility:**
> At edit-time the hook has: the single edited `.github/workflows/*.yml` file. This check additionally needs: nothing else (paid-LLM patterns are per-file). Reachable? YES — grep on the single file.

**Mechanism:** PostToolUse hook (surface B, deterministic) filtered to `.github/workflows/*.yml` edits → grep for paid-LLM patterns (API key assignments, paid API hostnames, SDK imports). REUSE the pattern set from `17-no-paid-llm-in-ci.test.ts`. `@dual-pair: no-paid-llm-ci` anchor.

**Value:** medium — agents could introduce paid-LLM references in CI workflows; catching it at edit-time rather than CI is a clear win for the agent's own session.

### Candidate F — actionlint per-file: ADD-DUAL-CHANNEL

**Edit-time feasibility:**
> At edit-time the hook has: the single edited `.github/workflows/*.yml` file. actionlint supports single-file mode. Reachable? YES — `actionlint "$ABS_PATH"` (or `actionlint -` from stdin).

**Mechanism:** PostToolUse hook (surface B, deterministic) filtered to `.github/workflows/*.yml` edits → `actionlint "$ABS_PATH"`. Tool must be installed (graceful skip if absent, same as pre-push). `@dual-pair: actionlint` anchor. NOTE: Candidate E (no-paid-llm) and Candidate F (actionlint) share the same path filter and could be combined.

**Value:** medium — agents editing workflow files benefit from immediate YAML+expression correctness feedback.

### Candidate G — lychee offline link check per-file: ADD-DUAL-CHANNEL

**Edit-time feasibility:**
> At edit-time the hook has: the single edited `.md` file. lychee supports per-file offline check: `lychee --offline --no-progress "$ABS_PATH"`. Reachable? YES.

**Mechanism:** PostToolUse hook (surface B, deterministic) filtered to `*.md` edits → `lychee --offline --no-progress "$ABS_PATH"` (graceful skip if lychee absent). `@dual-pair: lychee-link-check` anchor.

**Value:** medium — broken links in documentation are caught at pre-push currently; edit-time feedback during authorship is better but lychee may add latency per edit.

### Candidates H-J — Pre-commit checks as PostToolUse hooks

**H — bash syntax (`bash -n`):** PostToolUse on `*.sh` edits. `bash -n "$ABS_PATH"`. Trivial. `@dual-pair: bash-syntax`. High value for agent-authored hooks.

**I — JSON validity:** PostToolUse on `*.json` edits. `python3 -c "import json; json.load(open('$ABS_PATH'))"`. Trivial. `@dual-pair: json-validity`. High value since settings.json and manifest edits are common agent operations.

**J — markdown ≤500 lines / markdownlint:** PostToolUse on `*.md` edits. `wc -l < "$ABS_PATH"` and `npx markdownlint-cli2 "$ABS_PATH"`. Trivial. `@dual-pair: md-quality`. Medium value.

---

## §5 KEEP-at-floor list — why each is already as early as its data permits

1. **Prior-art trailer check (pre-push §7)** — data is commit message + commit diff; no earlier channel has this.
2. **§1.7 discipline trailer check (pre-push §1.7)** — same; commit-level data.
3. **Spec discipline guard (pre-push §6)** — the edit-time path is already covered by `validate-prompt.sh`; §6 covers the anomalous force-add path, which has no edit-time analog.
4. **audit-ai-docs.test.ts (pre-push §3)** — runs on synthetic temp-dir fixtures, not an edited file's content.
5. **inject-session-bootstrap.sh** — UserPromptSubmit is the correct channel for session-start invariants.
6. **deps-hash-check.sh** — UserPromptSubmit is correct for cross-session package.json monitoring; PostToolUse on package.json edits would miss changes via other routes.
7. **ask-question-reminder.sh** — PreToolUse:AskUserQuestion is the only channel with pre-question timing.
8. **end-of-turn-reminder.sh** — Stop is the only channel with transcript data.
9. **§1.7 PR discipline-self-check workflow** — PR body data is only available at CI (PR event).
10. **Template render probes (framework-self-template-render.yml)** — cross-file rendering; no single-file decomposition.
11. **Workflow integrity / branch protection** — requires GitHub API; CI-only.
12. **stale path references (audit-self.yml)** — whole-repo grep; not decomposable per-file.
13. **principle 11 build-first-reuse-default** — combined SSOT+trailer check is cross-file at commit level.
14. **zizmor** — whole-workflows-dir supply-chain analysis; per-file zizmor misses cross-file interactions. Keep at pre-push as floor; ADD-DUAL-CHANNEL caveat if per-file companion is desired (known reduced scope).

---

## §6 Dormant-not-wired findings

**FINDING: Zero dormant hooks in the current state.**

The kickoff's first-pass inventory (written before N8 landed) hypothesized that `check-kickoff-traps.sh` and `inject-matching-rule.sh` were dormant. This was accurate at kickoff-authoring time. As of the current HEAD (branch `feat/channel-earliness-audit`, based on `origin/staging`), all 9 hooks are wired in `.claude/settings.json`:

- `check-kickoff-traps.sh` — wired as PostToolUse `Edit|Write` (N8 C2)
- `inject-matching-rule.sh` — wired as PostToolUse `Edit|Write` (N8 C4/channel-selection wave)
- `check-hook-marker.sh` — wired as PostToolUse `Edit|Write` (N8 C4)

The kickoff's inventory was stale by the time this audit ran. **This is itself a calibration finding:** the kickoff's known-wrong hypothesis was that two hooks were dormant; the audit corrects it. The channel assignment of all three hooks is ALREADY-AT-FLOOR (edit-time PostToolUse, which is the earliest reachable channel for their single-file data).

**No DORMANT-NOT-WIRED verdicts to report.**

---

## §7 §1.7 forward-check applied (file:line per discipline)

**no-paid-llm-in-ci.md:** Every mechanism proposed in §4 is deterministic (grep/bash/tsx/binary invocation). No LLM call. Evidence: Candidate A uses `render-rules.ts` (pure TS, no API key), Candidates B/C/E/H/I/J use grep/bash, Candidate D uses grep, Candidates F/G use `actionlint`/`lychee` (binaries). Rule file: `.claude/rules/no-paid-llm-in-ci.md:1`.

**build-first-reuse-default.md:** All ADD-DUAL-CHANNEL candidates REUSE existing infrastructure — no new engine built. Candidate A reuses `render-rules.ts` (`packages/core/render/render-rules.ts:31,87`). Candidates B/C/D reuse existing grep patterns from their corresponding principle tests. Candidates F/G reuse tools already required by pre-push. Candidates H/I/J reuse pre-commit checks. Rule: `.claude/rules/build-first-reuse-default.md:§1`.

**dual-implementation-discipline.md §5:** Each ADD-DUAL-CHANNEL candidate is given a `@dual-pair: <anchor>` annotation. The pattern is identical to `check-doc-authority.sh` (PostToolUse companion to principle 09). Candidates A–J all specify anchor names in §4. Rule: `.claude/rules/dual-implementation-discipline.md:§5`.

**doc-authority-hierarchy.md:** This research patch carries the compliant header (first line `<!-- scope:channel-earliness-audit -->`, then Authoritative-for + NOT authoritative-for). Rule: `.claude/rules/doc-authority-hierarchy.md:§3`.

**rule-enforcement-channel-selection.md §3 axis-2:** Each verdict names the delivery channel and breadth per the selection procedure. ADD-DUAL-CHANNEL candidates are PostToolUse path-scoped hooks (deterministic matcher), not always-on. Rule: `.claude/rules/rule-enforcement-channel-selection.md:§3`.

---

## §8 §1.7 backward-check applied (100%-coverage confirmation + prior-work relationship)

**100% coverage confirmation:**

Population: 55 check surfaces across 5 surfaces (§2). Classified in §3:
- Surface 1 (9 hooks): 9/9 classified — all ALREADY-AT-FLOOR
- Surface 2 (11 pre-push sections): 11/11 classified — 4 ADD-DUAL-CHANNEL, 7 ALREADY-AT-FLOOR
- Surface 3 (17 principle tests): 17/17 classified — 8 ADD-DUAL-CHANNEL, 9 ALREADY-AT-FLOOR
- Surface 4 (CI-only checks): ~12 classified — 7 ADD-DUAL-CHANNEL, 5 ALREADY-AT-FLOOR
- Surface 5 (6 pre-commit sub-checks): 6/6 classified — 5 ADD-DUAL-CHANNEL, 1 ALREADY-AT-FLOOR

**No check was sampled; all were classified.** Some ADD-DUAL-CHANNEL verdicts for pre-commit and CI checks collapse into the same proposed hook (e.g., bash-syntax / JSON-validity / markdown-quality all pointing to the same PostToolUse hook concept); the verdicts are per-check even if implementation bundles.

**Prior-work relationship:**

`grep -rn "earliest reachable\|channel floor\|edit-time companion" docs/ .claude/rules/` confirms:

- `docs/meta-factory/wave-sequencing-plan.md:65` — references this audit explicitly as wave 2.3, «run BEFORE any future check-building wave». This audit is that scheduled item.
- `.claude/rules/rule-enforcement-channel-selection.md:78` — the §6 forward-going clause this audit is implementing retroactively.
- `docs/meta-factory/research-patches/2026-05-22-rule-enforcement-channel-selection.md:85` — origin patch for the rule; describes the ADAPT mechanism (inject-matching-rule.sh) as the first PostToolUse injection hook. This audit extends the same principle to gate hooks.
- No prior channel-earliness sweep exists in `research-patches/`. This audit is the first.

This audit extends, not duplicates, the prior channel-selection work. The rule describes *how to pick a channel for new rules*; this audit *retroactively applies that rule to existing checks*.

---

## §9 Self-application (T15) — is this audit a recurring sweep? how to audit this audit?

**(a) Output artifact in the repo?** YES — `docs/meta-factory/research-patches/2026-05-22-channel-earliness-audit.md` (this file, committed to `feat/channel-earliness-audit`). Not memory-only. Principle 10 scope annotation on first line. Principle 13 §1.7 substance check applicable. Both are satisfied.

**(b) Is this a recurring sweep?** The current audit is a one-shot retroactive sweep of the existing check population. However, the population grows as new checks are built (N8 A-phase C1–C5 and future waves add new hooks/principles). The wave-sequencing-plan recommends running this audit before future check-building waves. **Recommendation:** schedule a re-run of this sweep after each wave that adds ≥3 new checks — matching the pattern of the §4 coverage audit's trigger (§1.6, `phase-research-coverage.md`). This is a DECISION-NEEDED for §10 (whether to codify the re-trigger).

**(c) How would a future session audit THIS audit?**

- **Wrong verdicts:** a future session can falsify by examining any ALREADY-AT-FLOOR verdict against the kickoff's channel principle table (`kickoff.md` §load-bearing-principle). If the data lives in a single file but the verdict is ALREADY-AT-FLOOR without an edit-time hook, that is a missed ADD-DUAL-CHANNEL.
- **Missed population:** a future session runs `ls -1 .claude/hooks/*.sh | wc -l` and compares to the count in §2. Any new hooks not in §3 surface 1 are uncovered.
- **Stale dormant-hook finding:** this audit found zero dormant hooks. A future session can verify wiring by grepping `settings.json` for each hook filename. If a new hook appears in `.claude/hooks/` without a settings.json entry, it is dormant — this audit's §6 methodology catches it.
- **ADD-DUAL-CHANNEL not yet implemented:** the §4 candidates produce follow-up work items. A future audit can check which candidates have been implemented by checking `settings.json` for the corresponding `@dual-pair` anchors.

**Self-application verdict:** this audit is NOT itself subject to the channel-earliness principle in an interesting way — it is a one-shot research doc, not a recurring executable check. The nearest analog would be principle 13 (research-patch §1.7 substance, which this file satisfies). The meta-question — «is this audit's methodology itself captured as an executable artifact?» — points to the wave-sequencing-plan re-trigger, which is a DECISION-NEEDED in §10.

---

## §10 DECISIONS-NEEDED (surface non-obvious moves; do NOT decide — reviewer-discipline §2)

### DECISION-NEEDED-1: Audit scope P1 vs P1+P2

**DECISION-NEEDED:** Does this sweep cover only the framework's OWN checks (P1, executed above), or also the SHIPPED consumer config it prescribes (P2 — eslint configs under `packages/core/templates/shared/`, `dependency-cruiser` arch rules under `packages/preset-next-15-canonical/ARCHITECTURE.*`, `RULES.md`)?

**Option A (P1 only, current):**
- Scope: smaller, completed above.
- The ⭐ boundary lever (dep-cruiser → eslint-plugin-boundaries) lives in P2.
- Consequence: the «most under-used hot lever» (kickoff §inventory note) remains unaudited.
- P2 audit would be a separate session, separate research-patch.

**Option B (P1+P2):**
- Adds the consumer-facing prescription surface to this audit.
- Headline P2 win: `dependency-cruiser` prescribes layer-boundary enforcement at consumer pre-push. `eslint-plugin-import` or `eslint-plugin-boundaries` could add the same check at consumer lint/edit-time (surface A for humans; surface B if wired as PostToolUse). Earlier for humans and, if consumer wires it, for AI agents.
- Requires BFR check: `eslint-plugin-import` boundaries vs `eslint-plugin-boundaries` vs `@nx/eslint-plugin` (three candidates; per BFR §3 need ≥3). This is additional research, not trivially done in this session.
- Consequence: larger audit, touches consumer-product prescription (not just internal hygiene).

### DECISION-NEEDED-2: Prioritization and batching of ADD-DUAL-CHANNEL implementations

**DECISION-NEEDED:** The audit identified 20 ADD-DUAL-CHANNEL candidates (some collapsing into shared hooks). How should these be shipped?

**Option A (atomic PRs):** Each candidate ships as its own follow-up PR per [CLAUDE.md PR strategy](../../../CLAUDE.md). High granularity, atomic, easy to review.

**Option B (bundled umbrella):** Candidates that share a path filter are bundled into one hook script (e.g., Candidate E+F share `.github/workflows/*.yml` filter; Candidates B+C share `docs/meta-factory/research-patches/*.md` filter; Candidates H+I+J share pre-commit checks). This reduces PR count from ~20 to ~8 PRs.

**Downstream consequence of either:** `settings.json` is agent-self-protected (maintained manually). Each new PostToolUse hook requires a maintainer-landed settings.json entry. The maintenance burden is proportional to the number of distinct hook scripts added, not the number of PRs.

### DECISION-NEEDED-3: Recurring sweep trigger

**DECISION-NEEDED:** Should this channel-earliness audit become a recurring sweep, and if so, on what trigger?

**Option A (one-shot, no re-trigger):** This audit is complete. Future checks declare their channel at authorship time per rule-enforcement-channel-selection.md §3. No systematic re-sweep.

**Option B (wave-triggered re-sweep):** After each wave that adds ≥3 new checks, run a channel-earliness re-sweep (matching the phase-research-coverage §1.6 trigger-sweep pattern). The scope would be the NEW checks only (delta audit), not a full re-run. Result is appended to this or a new research-patch.

**Downstream consequence:** Option B adds session cost per wave but ensures channel assignments are reviewed systematically as the check population grows.

### DECISION-NEEDED-4: zizmor per-file edit-time companion (scope caveat)

**DECISION-NEEDED:** Should a zizmor per-file PostToolUse hook be added alongside the full-dir pre-push run?

**Option A (yes, add per-file):** Reduces detection latency for supply-chain issues in the single edited file. Known caveat: per-file zizmor misses cross-file permission inheritance issues (the whole-dir run catches these). The per-file companion is a partial check with known false-negative risk.

**Option B (no, keep only full-dir):** Avoids the partial-check confusion. The pre-push full-dir run is already fast. Agents rarely edit multiple workflow files in one session. The detection-latency reduction may not justify the false-negative risk.

---

## §11 Summary counts

| Verdict | Count |
|---|---|
| ALREADY-AT-FLOOR | 25 |
| ADD-DUAL-CHANNEL | 20 (some collapsing to shared hooks) |
| MOVE-EARLIER | 0 |
| DORMANT-NOT-WIRED | 0 |
| CANT-MOVE-NEEDS-JUDGEMENT | 1 (zizmor full-dir) |
| **Total** | **46** |

(Counts include Surface 4 CI-only checks not in the pre-push surface — deliberately counted separately to avoid collapsing the audit.)

**Top 3 highest-value ADD-DUAL-CHANNEL candidates:**
1. **Candidate A** — manifest render drift PostToolUse hook (REUSE render-rules.ts; agents edit manifests frequently; currently only caught at pre-push)
2. **Candidate B+C combo** — research-patch §1.7 substance + scope annotation PostToolUse hook (agents author research patches in single-file edits; both checks are trivial grep; currently only caught at CI)
3. **Candidate E+F combo** — no-paid-LLM + actionlint PostToolUse hook on workflow `.yml` edits (agents may introduce paid-LLM or YAML errors in CI workflows; currently only caught at CI/pre-push)
