<!-- scope:dispatch-worktree-automation-iphase -->
# I-phase acceptance — `dispatch-worktree-automation` Sub-wave C: recursive step-count measurement

> **Status:** I-phase Sub-wave C acceptance report. Empirical, self-applying. No code shipped here — measures the substrate landed by PR #279 (hook) + PR #282 (skill prose) against kickoff §4 criterion 2 (step count ≤2).
> **Authoritative for:** the empirical acceptance verdict for `dispatch-worktree-automation` I-phase — step-count measurement of `claude -w <name>` + `WorktreeCreate` hook on two real dispatches, scoring against kickoff §4 criteria, and the base-ref-hygiene MINOR finding (§3.2).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The R-phase verdict — see [PR #271 research-patch](2026-05-29-dispatch-worktree-automation.md). The hook contract — see [`.claude/hooks/worktree-setup.sh`](../../../.claude/hooks/worktree-setup.sh) (the spec lives at its header + PR #279).
> **Origin kickoff:** [`.claude/orchestrator-prompts/dispatch-worktree-automation-iphase/kickoff.md`](../../../.claude/orchestrator-prompts/dispatch-worktree-automation-iphase/kickoff.md) §3 Sub-wave C + §4 criterion 2 + §10 STOP + §11 self-application.

---

## §1 What this acceptance tests

The R-phase verdict (PR #271) was: **ADOPT `claude -w <name>` native flag + ADAPT a `WorktreeCreate` hook** to collapse the old 7-step manual worktree-setup paste-block to ≤2 steps per dispatch. PR #279 shipped [`.claude/hooks/worktree-setup.sh`](../../../.claude/hooks/worktree-setup.sh) (merge `5278675`, state MERGED — verified `gh pr view 279 --json state`); PR #282 migrated the meta-orchestrator skill prose to the `claude -w` form (merge `9f8dc84`, state MERGED). Both are ancestors of live `origin/staging` (`3fe1336`) — verified `git merge-base --is-ancestor`.

Kickoff §4 **criterion 2** is the binding target: *step count BEFORE/AFTER measured on a real dispatch; target ≤2.* This report measures it on **two** real, independent dispatches — and the measurement is self-applying: **this very session was spawned by `claude -w iphase-acceptance`**, so the primary data point is not a fabricated trace but the live environment the report is being written in.

Environment verified at write-time: CC `2.1.156` (≥ 2.1.143 required by kickoff §4 criterion 4 — `claude --version`); the `-w, --worktree [name]` flag present (`claude --help`); this session's `GIT_DIR` = `.git/worktrees/iphase-acceptance` ≠ `GIT_COMMON_DIR` `.git` (confirms isolated worktree, not primary checkout).

---

## §2 Empirical step-count measurement table

| # | Intent | Command(s) | Outcome (command-verified) | Steps |
|---|---|---|---|---|
| **Baseline (pre-#279/#282)** | spawn isolated session ready for parallel work | `cd primary` → `git fetch origin <base>` → `git worktree add <abs> origin/<base>` → `cd worktree` → `ln -s` ×2 (node_modules) → `git checkout -b <branch>` → open fresh CC tab + paste | worktree + symlinks + branch, manually | **7** (+ paste) |
| **Primary (THIS session)** | spawn isolated session for Sub-wave C I-phase | `claude -w iphase-acceptance` → paste `/orchestrator …` prompt | worktree `.claude/worktrees/iphase-acceptance/`; branch `worktree-iphase-acceptance`; `node_modules → …/rules-as-tests-aif/node_modules` + `packages/core/node_modules → ../../node_modules`, both ctime **May 29 18:32** | **2** (cmd + paste) |
| **Secondary (parked umbrella, fresh name)** | spawn isolated session for `aif-handoff` SW-A | `claude -w aif-handoff-sw-A-resume -p "<probe>"` | worktree `.claude/worktrees/aif-handoff-sw-A-resume/`; branch `worktree-aif-handoff-sw-A-resume`; both symlinks live, ctime **May 29 18:42**; returned `PROBE-OK`; HEAD `bb3ecec` | **1** (headless folds paste into the command) |

**Criterion 2 verdict: MET (7 → 2, and → 1 in headless form).** Both empirical invocations land an isolated worktree with workspace deps available in ≤2 steps. The hook fires transparently at worktree-creation moment — the maintainer types one command and pastes one prompt; zero `git worktree add` / `cd` / `ln -s` / `git checkout -b` ritual.

**T15 honesty note — the measurement IS the dispatch.** I did not reconstruct the primary trace from memory: the symlinks I cite were read live (`ls -la`) inside the worktree this report is authored in, ctime 18:32. The only friction in the primary path beyond the 2 steps was *content freshness* (§3.2), not *step count* — the worktree, branch, and symlinks all materialised from the single `claude -w` command exactly as PR #279's hook contract describes.

---

## §3 Findings

### §3.1 PASS — substrate behaves as specified

- **Hook fires on `claude -w`** (kickoff §4 criterion 3, idempotence): both worktrees received the two symlinks at creation. The hook's idempotent reuse branch (worktree-setup.sh:65-68) means re-dispatch of an existing name is a no-op print+exit 0 — not re-measured here but read in source.
- **CC-default conventions adopted** (per ATTN 1+2 DECIDED): path `.claude/worktrees/<name>/`, branch `worktree-<name>`. Both invocations produced exactly these — no manual rename needed.
- **No regression** (criterion 1): the old 7-step path still works (the hook only *adds* behaviour at `claude -w` time; manual `git worktree add` is untouched). Graceful degradation holds for CC < 2.1.143 — `claude -w` is absent there, maintainer falls back to the manual block, hook still symlinks if the worktree is later opened.
- **No paid LLM** (audit trail / no-paid-llm-in-ci): the pipeline is a shell flag + deterministic bash hook. The secondary test's `-p` probe is a subscription-bundled interactive-equivalent call (pre-2026-06-15; negligible single-token probe) — used only to trigger the hook non-interactively from this session; the production pipeline is interactive and uses no `-p`.

### §3.2 MINOR — `claude -w` branches from a stale `origin/HEAD`, not the live staging tip

**Observation (two independent data points):** both the primary (`iphase-acceptance`) and secondary (`aif-handoff-sw-A-resume`) worktrees were created at HEAD `bb3ecec` — *behind* live `origin/staging` (`3fe1336`), so they did **not** contain the very PRs (#279/#282) being accepted.

**Root cause (command-verified, not inferred):** the hook resolves its base ref via a preference loop `origin/HEAD → origin/main → main → HEAD` (worktree-setup.sh:73). At dispatch time `git rev-parse origin/HEAD` = `bb3ecec` while `git rev-parse origin/staging` = `3fe1336`. The symbolic ref `origin/HEAD` is **only** refreshed by `git remote set-head` / clone — a plain `git fetch` advances `origin/staging` but leaves `origin/HEAD` pointing at the old default-branch commit. The hook's header comment (worktree-setup.sh:70) optimistically assumes «`origin/HEAD` (= `origin/staging` for this repo post-migration)»; that equality silently breaks once `origin/HEAD` drifts.

**Why this is MINOR, not a STOP:** the UX win criterion 2 measures is *step count to an isolated, deps-ready worktree* — delivered in ≤2 steps, hook fired, flag behaved exactly as coded. The stale base is a *content-freshness* caveat orthogonal to the step-count target. It bites only when a fresh worktree must contain very recent staging commits; the worker can `git rebase origin/staging` in one step (as this session did to author safely against live CLAUDE.md).

**Recommended follow-up (not shipped here — surfaced per backward-check, do not silently patch):** harden worktree-setup.sh base-ref resolution — either prefer an explicit fetched branch tip (`origin/staging`) ahead of the symbolic `origin/HEAD`, or `git remote set-head origin -a` (or a `git fetch` of the default branch) before branching. Tracked as a dedicated follow-up; out of Sub-wave C scope (C is acceptance + docs, not hook edits).

---

## §4 Scoring against kickoff §4 five criteria

| Criterion | Score | Evidence |
|---|---|---|
| 1 — No regression on existing dispatch | **PASS** | manual 7-step path untouched; hook only adds at `claude -w` time (§3.1) |
| 2 — Step count BEFORE/AFTER on real dispatch | **2** (and 1 headless) | §2 table; target ≤2 MET on two independent dispatches |
| 3 — Hook idempotence | **PASS** | idempotent reuse branch read in source (worktree-setup.sh:65-68); both live runs produced exactly-correct symlinks, no duplicates |
| 4 — CC version dependency | **≥2.1.143** | `claude --version` = 2.1.156 ≥ pinned floor; degrades to 7-step path below it |
| 5 — Audit trail | **PASS** | every claim in this patch is command-output- or file:line-backed (§2, §3); PR body carries §1.7 + the reproduction commands |

---

## §5 STOP §10 assessment

Kickoff §10 Sub-wave C STOP fires on: *step count > 2 OR hook doesn't fire OR `claude -w` doesn't behave as documented.* All three negated:

- Step count ≤ 2 on both invocations (§2). ✗ not triggered.
- Hook fired on both (symlinks present, ctimes 18:32 / 18:42). ✗ not triggered.
- `claude -w` behaved exactly as the flag + hook are coded (worktree at default path, default branch name, symlinks). The stale-`origin/HEAD` base is the hook *behaving as written* against a drifted ref — not a flag malfunction. ✗ not triggered.

**STOP NOT triggered → no revert of PR #279 / #282. Acceptance doc ships.** The §3.2 base-ref item is a follow-up hardening, not a revert condition.

---

### §1.7 Forward-check applied

- **[no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md):** the accepted pipeline is a shell flag + deterministic bash hook — zero API-billed calls. The `-p` probe used to trigger the hook non-interactively is a single subscription-bundled call, pre-2026-06-15, not a CI-side cost. ✓
- **[build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md):** the substrate accepted here is ADOPT (`claude -w` native flag) + ADAPT (`tfriedel/claude-worktree-hooks` → symlink variant), SSOT [#65](../../../docs/meta-factory/prior-art-evaluations.md) `using-git-worktrees` REFERENCE. This acceptance report builds nothing new — it measures. ✓
- **[doc-authority-hierarchy.md §2-§3](../../../.claude/rules/doc-authority-hierarchy.md):** carries `<!-- scope:dispatch-worktree-automation-iphase -->` (principle 10) + Authoritative-for header; inherits folder-level authority of `research-patches/`. ✓
- **[parallel-subwave-isolation.md §4 N7](../../../.claude/rules/parallel-subwave-isolation.md):** `claude -w` is the harness-native realisation of Superpowers `using-git-worktrees` Red Flag #1 (use the native worktree tool); this acceptance confirms the dogfood works empirically. ✓
- **[phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md):** every verdict in §3-§5 is command-output- or file:line-backed; the one negative-leaning claim (stale `origin/HEAD`) is `git rev-parse`-verified, not asserted. ✓

### §1.7 Backward-check applied

- **[`.claude/hooks/worktree-setup.sh`](../../../.claude/hooks/worktree-setup.sh):** NOT edited by this Sub-wave (C = acceptance + docs). The §3.2 base-ref finding is surfaced as an explicit follow-up so it is not silently absorbed or silently patched. No supersession. ✓
- **[PR #271 R-phase patch](2026-05-29-dispatch-worktree-automation.md):** this report *implements/measures* its §6 verdict; does not modify or supersede it. ✓
- **[CLAUDE.md](../../../CLAUDE.md):** receives a 1-line forward-pointer in `## See also` (pointer, not duplication — dual-implementation-discipline §7). No existing CLAUDE.md content rewritten. ✓
- **Kickoff §3 Sub-wave C scope:** this report is exactly its deliverable; no scope creep into Sub-wave A/B artefacts, no edit to parked-umbrella kickoffs (§12 anti-scope respected). ✓
- **No principle test added:** worktree-automation discipline remains test-free per kickoff §12 (future work if drift recurs). ✓

---

## 🟢 Простыми словами

Раньше, чтобы запустить параллельную сессию в изолированной папке, мейнтейнеру приходилось вручную набирать ~7 команд (`git worktree add`, `cd`, два симлинка `node_modules`, `git checkout -b`, открыть вкладку, вставить промпт). Это и был тот «налог», вокруг которого случился 14-часовой дрейф.

Теперь хватает **одной команды** — `claude -w <имя>` — и хук сам создаёт рабочую папку и проставляет симлинки. Я это проверил **на себе**: эту самую сессию так и запустили (`claude -w iphase-acceptance`), симлинки стоят, время создания 18:32. Потом повторил на свежем имени для запаркованной задачи `aif-handoff` (`claude -w aif-handoff-sw-A-resume`) — хук сработал точно так же, симлинки 18:42, после проверки папку убрал. **Цель «≤2 шага» достигнута (было 7 → стало 2, а в headless-режиме вообще 1).**

Один нюанс (не блокер): `claude -w` создаёт ветку от `origin/HEAD`, а этот указатель устаревает при обычном `git fetch` — поэтому обе папки родились на коммите чуть позади свежего `staging`. На скорость это не влияет (один `git rebase` чинит), но хук стоит позже подкрутить, чтобы он брал свежий `origin/staging`. Записал как отдельную доработку — трогать хук в этой волне не стал.

---

## See also

- [PR #271 research-patch — R-phase verdict](2026-05-29-dispatch-worktree-automation.md) — the verdict this acceptance measures.
- [`.claude/hooks/worktree-setup.sh`](../../../.claude/hooks/worktree-setup.sh) — the `WorktreeCreate` hook under test (PR #279).
- [`.claude/orchestrator-prompts/dispatch-worktree-automation-iphase/kickoff.md`](../../../.claude/orchestrator-prompts/dispatch-worktree-automation-iphase/kickoff.md) — §3/§4/§10/§11 spec.
- [parallel-subwave-isolation.md §4 N7](../../../.claude/rules/parallel-subwave-isolation.md) — Superpowers Red Flag #1 dogfood `claude -w` realises.
- [prior-art-evaluations.md #65](../../../docs/meta-factory/prior-art-evaluations.md) — SSOT for `using-git-worktrees` REFERENCE.

Prior-art: prior-art-evaluations.md#65 (`using-git-worktrees` REFERENCE — this acceptance empirically confirms the harness-native `claude -w` realisation Red Flag #1 mandates; no new capability, measurement only).
