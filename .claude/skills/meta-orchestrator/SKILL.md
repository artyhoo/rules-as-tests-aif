---
name: meta-orchestrator
description: Use when you have ≥2 in-flight wave umbrellas with cross-stage dependencies, suspect drift between wave-sequencing-plan.md and live git reality, or need to dispatch the next wave with verified Stage N→N+1 gates. Russian triggers: «мета-оркестратор», «оркестратор волн», «план волн», «stage-gate», «приоритет umbrella», «волны параллельно/последовательно», «дрифт wave-sequencing-plan». Invoked explicitly via /meta-orchestrator slash command only — never auto-triggered on Claude Code (disable-model-invocation:true). On non-CC harnesses (Cursor/Aider/Codex) consumers should treat this as a manually-invoked workflow skill — the body §0 specifies invocation form.
arguments: [umbrella]
argument-hint: "[umbrella-name]"
disable-model-invocation: true
model: opus
allowed-tools:
  - Bash(git *)
  - Bash(gh *)
  - Bash(ls *)
  - Bash(cat *)
  - Bash(bash ${CLAUDE_SKILL_DIR}/helpers/*.sh *)
  - Read
  - Write
  - Edit
  - Agent
---

> **Class:** B (mixed): §0/§7.1 + §10/§7.12 = Class A (CC primitive enforces structurally — slash-command exists or not, Write tool writes file or not, frontmatter parses or not). §4/§7.5 = partial Class A via principle 12 test enforcing §5 AI-traps section presence in generated kickoffs. §1/§7.2 · §2/§7.3 · §3/§7.4 · §5/§7.6 · §6/§7.7 · §7/§7.8 · §9/§7.11 · §11/§7.13 = **Class C** (prose-only enforcement; AI can ignore `!shell`-injected data and proceed; acceptable per [parallel-subwave-isolation.md §4](../../rules/parallel-subwave-isolation.md) precedent and [research-patches/2026-05-16-readme-absolutism-vs-class-c-practice.md](../../../docs/meta-factory/research-patches/2026-05-16-readme-absolutism-vs-class-c-practice.md) maintainer-owned tension). **Re-promotion triggers per Class C:** ≥2 stage-gate-ignored incidents within 6 months → consider mechanical post-hoc check (commit-on-branch-B-only-if-PR-on-branch-A-merged via pre-push hook).
> **Authoritative for:** /meta-orchestrator slash-command behaviour — §0 invocation through §11 failures; plan-currency check discipline; cross-umbrella priority scoring; Mode A/B/SDD/Queue launch-table generation; meta-kickoff authoring; stage-gate enforcement; reviewer dispatch.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Existing global `~/.claude/skills/orchestrator/` (agent-uncommittable, owner=maintainer). The actual R-phase verdict — see [research-patches/2026-05-23-meta-orchestrator-prior-art.md](../../../docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md).

# /meta-orchestrator — plan-preflight + launch-table + stage-gate dispatch

**Origin:** BUILD verdict 2026-05-23. R-phase patch: [research-patches/2026-05-23-meta-orchestrator-prior-art.md](../../../docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md). Closes 4 named gaps in the global `orchestrator` skill (plan-actuality / cross-umbrella priority / auto-launch-table / stage-gate-vs-flat-queue).

**Binding spec:** `.claude/orchestrator-prompts/meta-orchestrator-prior-art/kickoff.md §7` (gitignored, 14 sub-sections §7.1-§7.14).

**Substrate:** CC slash-command primitive + `!shell` injection + Write tool + Agent tool. Zero npm deps. Zero paid-LLM-in-CI calls (all dispatch is session-bound per [no-paid-llm-in-ci.md §1](../../rules/no-paid-llm-in-ci.md)).

---

## §0 Invocation

**Slash command:** `/meta-orchestrator [<umbrella-name> | <N>]`

**`disable-model-invocation: true`** — fires ONLY on explicit `/meta-orchestrator` invocation. The flag suppresses CC's default auto-load into subagent contexts when description matches a subagent's task — it is **not** a recursive-invocation guard (no such risk exists: subagent depth is hard-capped at 2 by CC's harness, per [sub-agents.md](https://code.claude.com/docs/en/sub-agents.md)).

**Arg routing (V1 binding per [research-patch §3](../../../docs/meta-factory/research-patches/2026-05-29-meta-orch-no-arg-overview-s0-remainder.md)):** regex check at invocation start — empty → V3 overview; `^[0-9]+$` → V4 top-N (N=0 routes to V3); else → named-umbrella dispatch (existing §1→§3→§4→§5). **Pre-invocation guard (V1 mandatory):** assert no umbrella basename is `^[0-9]+$` (otherwise `/meta-orchestrator 1` is ambiguous):

```!
bash "${CLAUDE_SKILL_DIR}/helpers/integer-name-guard.sh" .claude/orchestrator-prompts
```

**Permissions model:** `allowed-tools` list above constrains the skill to read/git/gh/write — no arbitrary Bash. If a check requires a command outside the list, escalate to maintainer. **Caveat — Issue [#14956](https://github.com/anthropics/claude-code/issues/14956) (open as of 2026-05-28):** specific `Bash(<pattern>)` patterns in skill-scoped `allowed-tools` do not auto-approve matching commands in current CC versions. The load-bearing fallback is a `~/.claude/settings.json` `permissions.allow` entry `Bash(bash *helpers/*.sh *)` shipped in this repo's `.claude/settings.json` (per DN-1 Option C verdict, PR #262 §3). The frontmatter glob above remains for forward-compatibility when #14956 closes — remove the settings.json fallback line at that point.

**§7.14 gap closed by this section:** none (trigger mechanism; CC primitive verbatim-ADOPT per R-phase patch §3).

---

## §1 Plan-currency check

> **§7.2 binding.** Runs before ANY other action. Skipping this section = T4 anti-pattern (premature closure without plan verification).

**Step 1 — inject live state:**

```!
cat .claude/orchestrator-prompts/_plan-cache.md 2>/dev/null | head -200 || echo "(no cache — fresh session; will be created by helpers/update-cache.sh on this invocation's exit)"
```

```!
git status --short && echo "---" && git branch --show-current && echo "---" && git rev-list --count --left-right origin/staging...HEAD 2>/dev/null || echo "(no upstream)"
```

```!
gh pr list --search "is:open" --json number,title,state,headRefName,baseRefName --limit 20 2>/dev/null || echo "gh unavailable"
```

```!
head -200 docs/meta-factory/wave-sequencing-plan.md 2>/dev/null || echo "MISSING: wave-sequencing-plan.md"
```

```!
bash "${CLAUDE_SKILL_DIR}/helpers/plan-currency-check.sh" "${umbrella:-}" 2>/dev/null
```

**Step 2 — drift detection (judgment call on injected data):**

Compare the `wave-sequencing-plan.md` claims against the live `gh pr list` output:

1. For every wave marked «✅ merged» — verify a merged PR with that head branch exists in `gh pr list --state merged`. If not found → **DRIFT**.
2. For every wave marked «🟡 partial» — verify at least one open PR matches. If none → **DRIFT**.
3. For every kickoff path referenced — verify `ls .claude/orchestrator-prompts/<path>/kickoff.md` returns a file (the `plan-currency-check.sh` output provides this). Missing file → **STALE REF**.
4. For every research-patch cited — verify `ls docs/meta-factory/research-patches/<file>.md` exists. Missing → **STALE REF**.
5. **REPORT reconciliation:** if a maintainer-passed REPORT contradicts the `gh pr list` injection (e.g. REPORT says «Stage 1 merged» but `gh pr list` shows nothing), emit «REPORT says X; mechanical state shows Y; trusting `gh pr list`; possible causes: stale REPORT / pending GitHub-API sync (<60s) / different branch. Proceeding on mechanical state.» REPORT is welcome **supplementary** input, not load-bearing — mechanical state always wins (3-layer responsibility model; memory `feedback_no_human_verification_ai_self_verifies`).
6. **Cache reconciliation:** if cache (Step 1 first `!shell` block) «Last invocation» Git HEAD diverges from current `git rev-parse HEAD` AND `wave-sequencing-plan.md` was touched in the SHA diff → emit «CACHE STALE …»; cache stays supplementary, never load-bearing (T-mem-A counter — re-verify «PR merged» / «umbrella DONE» claims via `gh pr list`). Full rule + anti-patterns: [`references/plan-cache.md §2`](references/plan-cache.md).

**Step 3 — emit verdict:**

- «**План актуален**» if zero drift or stale-ref items found.
- OR emit a numbered list: `DRIFT-N: <wave-name> — plan says <claim>, gh shows <reality>. Proposed correction: <update wave-sequencing-plan.md line X to Y>.`

**If `wave-sequencing-plan.md` is MISSING entirely:** skill writes a stub from `README.md` + `EXECUTION-PLAN.md` + `ls .claude/orchestrator-prompts/` listing, presents to maintainer for OK, then halts until confirmed.

**§7.14 gap closed:** plan-actuality verification (gap 1).

---

## §2 Priority

> **§7.3 binding.** Runs only in no-argument mode after §1 confirms plan is current (or after drift items are accepted). Skip to §3 if `<umbrella>` was provided.

**Step 1 — inject candidate list:**

```!
bash "${CLAUDE_SKILL_DIR}/helpers/priority-score.sh" 2>/dev/null
```

**Step 2 — score each candidate (multi-criteria, judgment):**

For each candidate umbrella from `priority-score.sh` output, assign scores on four axes:

| Axis | Weight | Signal |
|---|---|---|
| blocks-other-waves | 3× | Does this umbrella's output unblock ≥1 other candidate? (check kickoff §0 for cross-wave deps) |
| give-back-value | 2× | Does this close a N5 give-back gap or ship a consumer-facing artifact? |
| size-fit | 1× | Smaller is preferred when score is tied (S < M < L volume signal from launch-table §3) |
| maintainer-prefs | 2× | Explicit preference signals in wave-sequencing-plan §0 (e.g. «do next», «urgent», «after C-1») |

**Step 3 — emit ranked list:**

```text
Priority ranking (as of <date> <git-HEAD-short>):
1. <umbrella-A> — score <N> — rationale: <one line>
2. <umbrella-B> — score <N> — rationale: <one line>
...
```

**Step 4 — clear winner or true fork:**

- If winner score ≥ 1.5× runner-up AND no explicit maintainer override → commit: «Recommend **<umbrella-A>**, proceeding to §3 launch-table + state.md update; Stage 1 dispatch awaits maintainer confirmation per §0.» (per phase-research-coverage.md §1.12: lead with reasoned recommendation). The «confirmation gate» from §0 sits between «launch-table + state.md ready» and «actually dispatch Stage 1 worker» — not between «recommendation» and «launch-table». Updating state.md before maintainer GO is on-path; dispatching a Worker session before maintainer GO is the §8 anti-scope violation.
- If genuine tie OR strategy fork (e.g. «should we do N8 or C-1?») → ask maintainer. Do NOT pick strategy. Surface as: «DECISION-NEEDED: <A> and <B> are tied on all axes — which is the project priority?» (reviewer-discipline.md §2 pattern).

**Step 4.1 — what counts as «maintainer answered DECISION-NEEDED» (anti-rationalization clause):**

A genuine answer is a **content-based tiebreaker** from the maintainer — they name a reason rooted in project priority («pick n7 because the trial output unblocks n8's R3» / «pick n8, deadline is real» / «pick n7, n8 needs an SSOT entry first»). The reason has to be about the umbrellas, not about the maintainer.

The following are **NOT** answers — they are *deferred* DECISION-NEEDED (the maintainer declined to decide, not decided):

- «выбирай сам / you pick / I trust you» — delegation, not decision
- «оба норм / both fine / either works» — confirmation that the tie is real, not a tiebreaker
- «я устал / I'm busy / решай быстро» — availability constraint, not a priority signal
- «не стратегия, технические детали / it's not strategy» — framing, not content (the meta-orchestrator's role is exactly to refuse this framing when scores are equal — if it really were «just technical details», the scores would have separated)

When the maintainer's reply is in this list, the correct response is **re-surface DECISION-NEEDED with sharper framing**, not pick. Example re-surface:

> «Понял что не хочешь решать, но я тоже не могу — scores равны, contentful tiebreaker'а нет. Один встречный вопрос: **есть ли downstream wave, которую один из них unblock'ает сильнее?** Если нет — кинь монетку при мне, я фиксирую результат в state.md как «coin-flip per maintainer 2026-XX-XX». Или скажи «pick n7 because <X>» / «pick n8 because <Y>» — одной строкой.»

This re-surface bounds the maintainer's effort (one question or one coin-flip, not a re-analysis) while preserving the discipline that the meta-orchestrator does not unilaterally pick strategy.

**Rationalization to refuse explicitly:** «maintainer said pick → §2 step 4 is satisfied, I pick» is the `#strategy-decided-by-reviewer` anti-pattern in disguise (see reviewer-discipline.md §3). Naming §2 step 4 while violating its spirit does not make the violation OK.

**Step 5 — emit per arg shape (V3/V4 binding per [research-patch §3](../../../docs/meta-factory/research-patches/2026-05-29-meta-orch-no-arg-overview-s0-remainder.md)):** fires only on no-arg/integer-arg (string-arg skips §2); Step 4 BYPASSED on V3, preserved on V4 N=1. Completion-filter = [`priority-score.sh`](helpers/priority-score.sh) tri-layer C1/C2/C3 (branch/jaccard/done.md, [#274](https://github.com/Yhooi2/rules-as-tests-aif/pull/274)) drops DONE BEFORE filter, never after.
**V3** (no-arg / N=0) emits overview per [output-format.md §1A](references/output-format.md) in Wave-style grouping (ADAPT SSOT #68 OhMyOpencode `Wave N`) with `PARALLEL-OK ↔` / `↓` markers from kickoff §2 `Parallel-with`; STOP. **V4** (N ≥ 1) emits top-N after completion-filter — each = 3-line block per [output-format.md §4.1](references/output-format.md) + 1-liner, markers from kickoff §2 `Parallel-with`; `N=1` = old winner-recommend; `N > K` emits K + warning `Only K candidates available; you requested N.`

**§7.14 gap closed:** cross-umbrella priority resolution (gap 2).

---

## §2.5 Dedup + classify + assign + route

> **Integration layer (no separate §7.x binding).** Runs after §2 priority winner selected (no-arg mode) OR after §1 (arg mode). Wires §7.3 (priority) → §7.4 (launch-table) via L3/L4/L5 helpers + design §5 routing tree. Skipping = T7 anti-pattern (premature dispatch without routing).

**Step 1 — read prior delta state** (context-priming; deterministic diff in Step 8; reconciliation + T-mem-A counter — [`references/master-backlog-delta.md §2`](references/master-backlog-delta.md)): <!-- @dual-pair: meta-orchestrator-master-backlog-delta -->

```!
if [[ -f .claude/orchestrator-prompts/_master-backlog-delta.json ]]; then
  jq -r '.untracked_seen[]?.id' .claude/orchestrator-prompts/_master-backlog-delta.json 2>/dev/null || echo "(delta file present but unreadable; treat as empty)"
else
  echo "(no delta file — first invocation; will be created at end via update-delta.sh)"
fi
```

**Step 2 — L3 dup-detect + in-flight ledger** (dup-detect catches *merged* dupes; inflight-check catches *live* work — open PR / un-merged branch carrying the slug, e.g. a parallel session dispatching the same sub-wave before it merges):

```!
bash "${CLAUDE_SKILL_DIR}/helpers/dup-detect.sh" "${umbrella:-}" 2>/dev/null; bash "${CLAUDE_SKILL_DIR}/helpers/inflight-check.sh" "${umbrella:-}" 2>/dev/null
```

`POTENTIAL_DUPE:`/`MISSING:` (dup-detect) → surface per [reviewer-discipline.md §2](../../rules/reviewer-discipline.md). `INFLIGHT:` → **confirmation-needed before dispatch** (possible parallel-session collision); `CLEAR:` → proceed.

**Step 3 — L4 classify each surviving candidate from Step 2:**

```!
bash "${CLAUDE_SKILL_DIR}/helpers/classify-each-candidate.sh" 2>/dev/null
```

Helper iterates `priority-score.sh` candidate set; per candidate routes to classify-work.sh (file-mode for `kickoff=exists`, string-mode for `kickoff=synthetic`, skip for `kickoff=missing`). DN-3 preserved — classify-work.sh UNCHANGED. Per-candidate stdout: `--- candidate: <name> ---` + TYPE/DISPATCH/LOC/SURFACES/RATIONALE. **stderr NOT suppressed** (J1 from Stage 5): if a candidate exits 3 with `MISSING-FILE:` that is **F8 for that candidate** — recorded inline, iteration continues; collect all F8s for the §10 report per [`references/failures.md`](references/failures.md). Steps 5–9 below require N classifications (`sibling_count`, multi-Stage rendering, multi-id delta-diff); single-shot would break them.

**Step 4 — L5 assign-skill:**

```bash
bash "${CLAUDE_SKILL_DIR}/helpers/assign-skill.sh" "<TYPE-from-Step-3>" "<one-line description from kickoff title>" 2>/dev/null
```

Advisory: `recommended_skill: <slug>` / `recommended_agent: <path>` / `recommended: none`.
**Step 5 — routing decision tree (judgment on injected data):**

6 predicates: `load_bearing` (paths ∩ principle-09 REQUIRED_HEADER_DOCS), `sibling_count` (same-TYPE disjoint candidates), `scope_decided` (kickoff §binding non-empty OR non-DEFER research-patch; else FALSE → RESEARCH), `parallel_safe` (explicit decl OR disjoint scopes; default=FALSE → PAIR), `bundle_opt_in` (`--mode-bundle` OR silent TRUE for fix), `review_required` (`--mode-pair` OR kickoff hint OR `load_bearing`).

```text
if TYPE == "R-phase":
    Mode = RESEARCH
elif TYPE == "fix":
    if sibling_count >= 3 AND bundle_opt_in: Mode = BUNDLE
    else: Mode = DIRECT
elif TYPE == "I-phase-small":
    if review_required: Mode = PAIR
    else: Mode = SOLO
elif TYPE == "I-phase-large":
    if not scope_decided: Mode = RESEARCH
    elif SURFACES >= 2 AND parallel_safe: Mode = DECOMPOSE
    else: Mode = PAIR
```

**Step 6 — ALIAS mapping (single source — computed AFTER routing tree; `classify-work.sh` UNCHANGED per DN-3):**

| ALIAS | DISPATCH (internal) | Fires when Step 5 resolves to |
|---|---|---|
| DIRECT | direct-Edit | TYPE=fix AND (sibling_count<3 OR NOT bundle_opt_in) |
| BUNDLE | Mode-A-bundle | TYPE=fix AND sibling_count≥3 AND bundle_opt_in |
| SOLO | Mode-A | TYPE=I-phase-small AND NOT review_required |
| PAIR | Mode-SDD | (TYPE=I-phase-small AND review_required) OR (TYPE=I-phase-large AND scope_decided AND (SURFACES<2 OR NOT parallel_safe)) |
| DECOMPOSE | Mode-B | TYPE=I-phase-large AND scope_decided AND SURFACES≥2 AND parallel_safe |
| RESEARCH | R-phase-session (single) / Queue-mode (≥2 sequential) | TYPE=R-phase OR (TYPE=I-phase-large AND NOT scope_decided) |

1:1 with Step 5 routing tree. Principle 19 (`packages/core/principles/19-meta-orchestrator-alias-routing-consistency.test.ts`) enforces mechanically. `Mode-A-bundle` sub-dispatch defined in bundle-autonomous umbrella.

**Step 7 — emit ALIAS in §10 rendered output:** Stage heading: `### Stage N — <name> (<ALIAS> / <Mode>, ~<cost>)`. Dep-graph bullet: `├── <name>   (<ALIAS> / <Mode>, ~<cost>, <role>)`. Template update deferred to follow-up PR per `feedback_no_drive_by_prs`.
**Step 8 — delta diff:** invoke `bash ${CLAUDE_SKILL_DIR}/helpers/delta-diff.sh .claude/orchestrator-prompts/_master-backlog-delta.json "<id-1>" "<id-2>" "<...>"` (post-dedup ids from Steps 2-3 as positional args) → emits `NEW-SINCE-LAST: <id>` (current ∖ seen) + `RESOLVED-SINCE-LAST: <id>` (seen ∖ current), sorted; missing delta → all current = NEW; lines feed §10; maintainer manually updates `wave-sequencing-plan.md §0` (Direction A REJECTED per R-phase β-2); semantics + contract: [`references/master-backlog-delta.md`](references/master-backlog-delta.md) + [`packages/core/hooks/delta-diff.test.ts`](../../../packages/core/hooks/delta-diff.test.ts). <!-- @dual-pair: meta-orchestrator-delta-diff -->
**Step 9 — write-back to `_master-backlog-delta.json`:** `untracked_seen` ← current candidate set (overwrite-shape; `first_seen` = current ts). `closed_since_last` ← prior ids that no longer surface. Concrete `jq` shape in §10 step 5 — do NOT re-specify here.

**§7.14 gap closed:** routing-tree alias-mapping consistency (Stage 2C gap).

---

## §3 Launch-table

> **§7.4 binding.** Produces the per-sub-wave Mode decision table for the selected umbrella.

**Step 1 — inject umbrella kickoff + dispatch state:**

```!
bash "${CLAUDE_SKILL_DIR}/helpers/launch-table-generator.sh" "${umbrella:-}" 2>/dev/null
```

```!
bash "${CLAUDE_SKILL_DIR}/helpers/dispatch-from-state.sh" "${umbrella:-}"
```

**Step 2 — classify each sub-wave (judgment on injected data):**

Read the kickoff's sub-wave decomposition (§2 or §3 table). For each sub-wave, fill columns:

| Column | Decision rule |
|---|---|
| Sub-wave id | from kickoff (e.g. A, B, C, D or 1, 2, 3) |
| Type | R-phase / execution-build / wiring / manual-liveness — from kickoff §0 `Type:` header |
| Mode | **Mode A** (inline Opus) if execution-build single OR wiring OR R-phase single; **Mode B × N worktrees** if execution-parallel ≥2 sub-waves in the same stage (per parallel-subwave-isolation.md §1); **Queue mode (sequential)** if R-phase-only or maintainer-specified sequential |
| SDD? | Yes if execution-build with ≥3 independent tasks (SSOT #64 mechanism); No for wiring / single-task R-phase / borderline (overhead > value). Threshold rationale: 1-2 tasks → SDD review overhead roughly equals catch-rate; 3+ → net positive |
| Stage | 1 / 2 / 3 — from kickoff dependency declaration (what must land before this sub-wave starts) |
| Parallel sibling | which other sub-wave runs concurrently — **V2 binding (research-patch §3, ADAPT SSOT #68 OhMyOpencode `Wave N`):** populated from each sub-wave's kickoff §2 `Parallel-with` column. Column omitted OR sub-waves disagree (A claims B; B does not claim A) → sequential default + ATTN. Rendered in [output-format.md §1A](references/output-format.md) Wave-style grouping (V3 no-arg overview). |
| Volume | small / medium / large — NOT calendar time; based on estimated LOC + files changed. S=<100 LOC, M=100-500 LOC, L=>500 LOC |

**Step 3 — emit table:**

```text
Launch table — <umbrella> (as of <git-HEAD-short>):

| Sub-wave | Type | Mode | SDD? | Stage | Parallel sibling | Volume |
|---|---|---|---|---|---|---|
| A | <type> | <mode> | <Y/N> | 1 | B or — | <S/M/L> |
| B | <type> | <mode> | <Y/N> | 1 | A or — | <S/M/L> |
...
```

**Blocking rule:** if either helper (`launch-table-generator.sh` or `dispatch-from-state.sh`) emits «MISSING kickoff» → halt and report. Do NOT produce a launch-table without reading the actual kickoff. The two helpers are complementary: `launch-table-generator.sh` emits the auto-detected sub-wave skeleton; `dispatch-from-state.sh` emits state-file context (`winner_id`, `sub_wave_state`) plus the head-120 kickoff body for the AI to read in Step 2 when filling judgment columns. The §3 inline `cat .../kickoff.md` block that previously injected the kickoff body was removed 2026-05-28 (DN-3 A verdict, PR #261); its function is now owned by `dispatch-from-state.sh` (F.3 helper-collapse — single source for §3 dispatch context). <!-- @dual-pair: meta-orchestrator-dispatch-from-state -->

**§7.14 gap closed:** auto-generated launch-table (gap 3, partial — §4 completes it with meta-kickoff).

---

## §4 Meta-kickoff write

> **§7.5 binding.** Writes `.claude/orchestrator-prompts/<umbrella>-meta-launch/kickoff.md` using the template.

**Step 1 — read template:**

```!
cat "${CLAUDE_SKILL_DIR}/templates/meta-kickoff.template.md"
```

**Step 2 — instantiate template (Write tool):**

Substitute every `{{<PLACEHOLDER_NAME>}}` token in both templates. The canonical 39-token list — grouped by source (plan-currency / launch-table / AI-traps / state-companion) with one-line resolution rules per token — lives in [`references/placeholders.md`](references/placeholders.md). Read it once, then substitute from §1+§3 output. The mechanical check that 1:1 enumeration matches the live templates is the maintainer's responsibility (re-run a `comm -23` between the templates' placeholders and the references file when either changes).

**Step 3 — write file:**

Target path: `.claude/orchestrator-prompts/<umbrella>-meta-launch/kickoff.md`

**Mandatory sections in generated kickoff (principle 12 will validate):**

1. `## §5 AI-traps active` with explicit T-number list (NOT «see ai-laziness-traps.md» alone — that is a T7 anti-pattern per ai-laziness-traps.md §3).
2. Stage-gate rules as ACTUAL `gh pr list --search 'is:merged head:<branch> base:<base>'` commands (not prose).
3. Recursive-self-application clause.
4. Stop conditions per stage.

**Write the state.md companion:**

Target path: `.claude/orchestrator-prompts/<umbrella>-meta-launch/state.md`

Use `${CLAUDE_SKILL_DIR}/templates/state.md.template` as the skeleton; fill §1 Inputs from plan-currency check output.

---

## §5 Dispatch tree

> **§7.6 binding.** Mutually exclusive routing per sub-wave type. Pick exactly ONE row that matches the sub-wave's nature.

**Decision table (rows are mutually exclusive):**

| Sub-wave nature | Dispatch mode | Mechanism |
|---|---|---|
| R-phase, single | Mode A inline | Single-focus R-phase = one Opus session. Queue mode is for ≥2 sequential kickoffs (queue-mode.md §1 Triggers). |
| R-phase, multiple sequential | Queue mode (sequential) | ≥2 R-phase kickoffs queued; each completes before the next begins (queue-mode.md §1 Triggers: «≥2 sequential kickoffs»). |
| R-phase, multiple parallel | Mode A × N inline Agents | Single-session multi-dispatch via Agent tool calls in one message. No worktrees needed (R-phases produce docs, not code). |
| Execution-build, single | Mode A inline | Direct Opus session with kickoff pasted or Read. |
| Execution-build, parallel ≥2 in same stage | Mode B × N worktrees | Preferred: `claude -w <umbrella>-<wave-N>` per CC native `--worktree` (worktree under `.claude/worktrees/`, branch `worktree-<name>`, base `origin/HEAD`; PR #279 hook auto-symlinks `node_modules`). Fallback (non-CC harness or settings.json unwired): `git worktree add ../<repo>-<wave>-<N> staging && git checkout -b <branch>` per `parallel-subwave-isolation.md §1`. SP `using-git-worktrees` SSOT #65 is the upstream preventive mechanism (dogfooded, not rebuilt). |
| Wiring (thin CI/config) | Mode A inline | Single session; low blast radius; worktrees add overhead without isolation benefit. |
| Manual liveness probing | Session-bound | Never CI-side. SP companion-type. |

**SDD sub-wave dispatch (within execution-build):**

When SDD?=Yes per §3 launch-table:
- Implementer session: standard Mode A or B kickoff.
- Spec-reviewer session: Agent tool with explicit spec-review role (reads kickoff, verifies implementation matches spec).
- Code-quality-reviewer session: Agent tool with code-quality role (lints, tests, structure).

Use SP `subagent-driven-development` SSOT #64 vocabulary for role names (ADOPT-VOCABULARY per R-phase patch §3 leapfrog table).

**Mode A parallel workaround (nesting constraint):**

When Mode B worktrees are unavailable (e.g. filesystem constraints per parallel-subwave-isolation.md §2), fall back to sequential Mode A — NOT concurrent shared-dir execution (§3 anti-pattern `#shared-workdir-parallel`).

**Vocabulary alignment (T16 verified):**

- «Mode A / Mode B» = primary orchestrator skill vocabulary (SSOT in orchestrator SKILL.md).
- «SDD» = `subagent-driven-development` SSOT #64, verified T16 match: upstream problem class = «single complex feature implemented iteratively with spec+code+quality reviewers»; ours = same, used at sub-wave level.
- «Queue mode» = orchestrator skill queue-mode.md vocabulary.

**Antipatterns (§7.6 binding):**
- `#worker-dispatch-via-subagent` — Worker dispatch via Agent tool from the meta-orchestrator session. Agent tool is ONLY for Phase -1 read-only reviewer (`reviewer-discipline.md §2`) + read-only research subagents (text return). Write-task Worker dispatch belongs in a fresh CC session opened by the maintainer pasting a §10 1-liner block. Channel matters — maintainer-paste = external loop-close; Agent-tool = subagent = wrong channel for writes. **Empirical backstop:** [bug #39886](https://github.com/anthropics/claude-code/issues/39886) confirms Agent tool + `isolation:"worktree"` for WRITE tasks silently fails (closed-as-duplicate; status uncertain in CC 2.1.143) — independent evidence the channel boundary holds for writes; read-only Agent dispatch remains OK. **Falsifier:** the channel boundary holds even when prompt shapes converge — the test is «who invokes», not «what the prompt looks like».
- `#commit-on-behalf-of-worker` — the meta-orchestrator running `git commit` / `gh pr create` for work it dispatched. Worker commits its own work under its own audit trail. **Falsifier:** Worker session crashed mid-task with the diff fully authored there → surface to maintainer, never silently absorb.
---
## §5.5 Bundle composition
> **B1/B2/B3a binding.** After §2.5 BUNDLE routing, before §6. Meta-orchestrator = planner/router; executor = downstream `orchestrator` skill. Full spec: [`references/bundle-composition.md`](references/bundle-composition.md). **B1:** `bundle-curate.sh "<backlog>"` → eligibility filter (`fix`/`I-phase-small`), file-overlap reject, max-5 cap. **T-BA-C:** `R-phase`/`I-phase-large` in output = BLOCKER. **B2:** save `composed-plan.md` (gitignored) + emit one-way launch-prompt. **Auto-approve FORBIDDEN.** **B3a (5 checks):** Independence · Mode coherence · Skill coherence · Order rationale · Caps respected. ≥1 BLOCKER → DO NOT emit. Anti-patterns: `#bundle-execution-loop` · `#auto-approve-bypass` · `#bundle-with-ineligible`.
---
## §6 Stage gates

> **§7.7 binding.** Between stages: REAL git merge check, not in-memory FIFO.

**Step 1 — inject merge state before each stage transition:**

```bash
gh pr list --search "is:merged head:<stage-N-branch> base:staging" --json number,title,mergedAt,headRefName --limit 10 2>/dev/null || echo "gh unavailable — cannot verify stage gate"
```

Replace `<stage-N-branch>` with the actual head branch from the Stage N sub-wave (derived from kickoff or launch-table). See T-MOB-B below for the recycled-branch case.

**Step 2 — evaluate gate:**

If Stage N PRs are NOT merged → **HALT**. Emit:

```text
STAGE GATE: Stage N is NOT clear.
Required: <list of PRs that must be merged>
Current state: <gh output>
Action: do NOT dispatch Stage N+1 until the above PRs are merged to staging.
```

If Stage N PRs ARE merged → proceed to Stage N+1 dispatch.

**Step 3 — Phase -1 cold-review between every stage (mandatory):**

After Stage N lands and before Stage N+1 dispatch, invoke §7 Reviewer dispatch. This is NOT optional. Auto-continuing without GO = T4 anti-pattern.

**Class C compromise (honest):**

This section is **prose enforcement** — the `!shell` injection surfaces the PR merge state, but the AI can technically ignore the injected data and dispatch Stage N+1 anyway. This is the same cost-benefit compromise as [parallel-subwave-isolation.md §4](../../rules/parallel-subwave-isolation.md) (Class C accepted; re-promotion trigger = ≥2 stage-gate-ignored incidents within 6 months). The `!shell` data is surfaced so the AI has no excuse for ignorance; the discipline relies on session-bound AI judgment.

**T-MOB-B anti-pattern (search gotcha):** `gh pr list --search 'is:merged head:<branch>'` returns ALL merged PRs ever with that head. The `base:staging` filter above prevents false-positives from recycled branch names that landed on a different base. If a branch name has been reused across umbrellas and a date scope is genuinely needed, pass `created:>=<YYYY-MM-DD>` derived from the umbrella's kickoff timestamp — never a hardcoded literal.

**§7.14 gap closed:** stage-gate vs flat-queue distinction (gap 4).

---

## §7 Reviewer dispatch

> **§7.8 binding.** Phase -1 cold-review between stages. Required before Stage N+1 admission.

**Trigger:** after each stage completes (all sub-wave PRs merged, §6 gate confirmed green).

**Dispatch via Agent tool:**

```text
Agent: Phase -1 cold-review for <umbrella> Stage <N>
Role: reviewer (not orchestrator, not implementer)
Skill: requesting-code-review (SP SSOT, REFERENCE — see R-phase patch §3 leapfrog table)
```

**Reviewer discipline (reviewer-discipline.md §2 pattern — mandatory):**

The dispatched reviewer:
1. Reads the Stage N diff (`git diff staging...<stage-N-head>`).
2. Reads the meta-kickoff Stage N acceptance criteria.
3. Emits GO / REVISE / STOP verdict with BLOCKER/MAJOR/MINOR classification.
4. For any finding requiring strategy choice: emits «DECISION-NEEDED: <one-line>. Option A → consequence X. Option B → consequence Y. Maintainer decides.» — does NOT pick the strategy.

The reviewer does NOT:
- Edit any file.
- Pick project strategy.
- Approve on behalf of the maintainer.
- Skip surface review if «CI is green» (T19 — CI ≠ design review).

**Verdict routing:**

- **GO** → proceed to §5 Dispatch tree for Stage N+1.
- **REVISE** → surface findings to maintainer; worker fixes; repeat Phase -1.
- **STOP** → escalate to maintainer; halt Stage N+1 dispatch.

**T16 verification (upstream problem-class match):**

SP `requesting-code-review` upstream problem class = «dispatch a reviewer subagent with git SHA references to review a specific change». Our problem class = same. **Match: YES** (per R-phase patch §3 leapfrog table — SP `requesting-code-review` row). ADOPT the SP dispatch template; add reviewer-discipline.md §2 strategy-fork-surface discipline on top.

---

## §8 Anti-scope

> **§7.9 binding.** What this skill MUST NOT do.

- **Does NOT write sub-wave code.** Writing implementation code is the Worker's job. If invoked on an execution-build sub-wave, meta-orchestrator generates the kickoff and dispatch instructions — it does NOT implement.
- **Does NOT finalize project strategy.** Meta-orchestrator can recommend a priority winner (§2) and say «proceeding»; it asks the maintainer on genuine strategy forks (§7.3 item 5).
- **Does NOT modify `~/.claude/skills/orchestrator/`.** That is the global orchestrator, agent-uncommittable, owner=maintainer. Meta-orchestrator wraps and calls it; it never forks or modifies it. All paths in this skill begin with `.claude/skills/meta-orchestrator/` or consumer-repo relative refs.
- **Does NOT violate no-paid-llm-in-ci.md §1.** All dispatch is session-bound CC subscription. Zero API-billed calls in CI. `!shell` injections are deterministic bash.
- **Does NOT add npm deps.** Substrate stays bash + markdown + CC primitives + existing `gh` CLI.
- **Does NOT re-litigate R-phase verdicts.** If a missed candidate is noticed, write `docs/meta-factory/research-patches/2026-<date>-meta-orchestrator-followup-<gap>.md` and surface to maintainer.

**§7.10 one-button-install coupling (load-bearing):** this skill lives at `.claude/skills/meta-orchestrator/` (project-scope, committed). It is templatable for N6b `npx` scaffold via `install.sh` payload. All cross-references use `${CLAUDE_SKILL_DIR}` or repo-relative paths — no absolute paths inside skill body. Mirrors at repo-root `skills/meta-orchestrator/` for `install.sh` consumption (per `install.sh:168-198` pattern verified against `tool-bootstrapping` precedent). Sub-wave D wired this.

---

## §9 Dogfood test

> **§7.11 binding.** The FIRST live invocation of this skill MUST run on the BUILD umbrella that produced the skill itself. This is the recursive-self-application gate (T15 from ai-laziness-traps.md §2 — cannot be skipped).

**How to invoke the dogfood test:**

1. Open a fresh worktree session via `claude -w meta-orchestrator-iphase` (CC native `--worktree`; manual `git worktree add` fallback when outside CC). In the new session, run:

   ```bash
   bash .claude/skills/meta-orchestrator/helpers/plan-currency-check.sh meta-orchestrator-iphase
   bash .claude/skills/meta-orchestrator/helpers/priority-score.sh
   bash .claude/skills/meta-orchestrator/helpers/launch-table-generator.sh meta-orchestrator-iphase
   gh pr list --search "is:merged head:feat/meta-orchestrator-build base:staging" \
     --json number,title,mergedAt,headRefName --limit 10
   ```

2. Capture all output to `.claude/orchestrator-prompts/meta-orchestrator-iphase/dogfood-run-output.md` with sections:
   - `## Step 1 — plan-currency-check` (command + output)
   - `## Step 2 — priority-score` (command + output)
   - `## Step 3 — launch-table-generator` (command + output)
   - `## Step 4 — stage-gate gh pr list` (command + output)
   - `## Coherence call` — judgment paragraph: is the launch-table coherent for this umbrella?

**Expected output shape for meta-orchestrator-iphase:**

The launch-table-generator will detect sub-waves from the kickoff (A, B, C, D). The expected coherent launch-table:

```text
| Sub-wave | Type | Mode | SDD? | Stage | Parallel sibling | Volume |
|---|---|---|---|---|---|---|
| A | I-phase build | Mode A | No | 1 | — | M |
| B | I-phase build | Mode A | No | 1 | — | S |
| C | I-phase build | Mode A | No | 1 | — | S |
| D | I-phase build | Mode A | No | 1 | — | M |
```

**HARD GATE:** if the helpers produce no sub-waves (empty table), STOP and report «Dogfood gate: HARD FAIL — launch-table-generator found no sub-waves in kickoff.md». Do NOT commit. Surface failure trace to orchestrator.

**Note on dogfood coherence for this BUILD:** sub-waves A+B+C were dispatched as a single Mode A session (reasonable for a single worker covering skeleton + helpers + templates). Sub-wave D is this session. The launch-table helper detects sub-wave rows from kickoff §2/§3 tables — it may or may not find them depending on kickoff structure. If it finds rows: coherent. If it finds no rows but the kickoff is real: partial tool limitation (not a HARD FAIL — document as «tool limitation: kickoff table format not auto-parseable; manual launch-table produced above»).

---

## §10 Output artifacts

> **§7.12 binding.** Specifies exactly what files this skill writes per invocation — paths, format, and cleanup policy.

**Per invocation, this skill writes:**

1. **Meta-kickoff:** `.claude/orchestrator-prompts/<umbrella>-meta-launch/kickoff.md`
   - Template: `${CLAUDE_SKILL_DIR}/templates/meta-kickoff.template.md`
   - Required sections: `## §5 AI-traps active` with explicit T-numbers; stage-gate commands; recursive-self-application clause; stop conditions per stage.
   - Validated by: `packages/core/principles/12-ai-laziness-traps.test.ts` (checks `## §5 AI-traps` presence and T-enumeration syntax).

2. **State companion:** `.claude/orchestrator-prompts/<umbrella>-meta-launch/state.md`
   - Template: `${CLAUDE_SKILL_DIR}/templates/state.md.template`
   - Filled sections: §1 Inputs (from plan-currency-check output) · §2 Launch-table (from §3) · §3 Dispatch log (updated per stage).
   - Lifecycle: updated in-place via **Edit (section-by-section), NOT Write (full-rewrite)**. Section history preserved unless explicitly stale — replacing the whole file loses §1.1 / §1.2 prior-snapshot context that downstream sessions read. «Not append-only» means «can mutate in place», which is Edit semantics, not Write-clobber semantics. Falsifier: if the next invocation must rebuild §1 Inputs from scratch because the previous snapshot was wiped → §10 was violated.

3. **Inline session report** (not a file — written to the conversation) — emitted as a **3-layer structure**: `## Dependency graph` (Argo-style `├── / └──` ASCII tree, prospective; inter-stage edge `↓`), `## Action queue` (5-column markdown table: `Paste в новый CC tab` / `Когда` / `Ждёшь` / `Можно параллельно с`), and one `### Stage N` heading per stage carrying the 1-liner `/orchestrator <umbrella> §<section> — <NL: Mode/role/autonomous?>, остальное в kickoff`. Full grammar + 4 worked examples (Mode A / SDD / Mode B × N / Queue mode) + ASCII templates live in [`references/output-format.md`](references/output-format.md); principle 18 (`packages/core/principles/18-meta-orchestrator-output-format.test.ts`) enforces those substrings literally in `references/output-format.md`, with SKILL.md §10 required to point at it.
   **§10.3a Plain-language checkpoint tail** <!-- @dual-pair: plain-language-tail --> <!-- spec: references/plain-language-tail.md + .claude/hooks/end-of-turn-reminder.sh --> — mandatory `## 🟢 Простыми словами` block at 3 orchestrator-checkpoint moments (sub-wave boundary / mid-session quota / final umbrella); content names orchestration artefacts (sub-wave, AC item, REPORT-trace), not per-turn personal reasoning. Full table + anti-patterns: [`references/plain-language-tail.md`](references/plain-language-tail.md). Falsifier: verbatim-copyable from `end-of-turn-reminder.sh` → `#two-prompts-drift`.
4. **Dogfood evidence** (first invocation only): `.claude/orchestrator-prompts/<umbrella>/dogfood-run-output.md`
   - Contains: 4-step helper invocation outputs + coherence-call paragraph.
   - This path is gitignored (`.claude/orchestrator-prompts/` in `.gitignore`) — evidence for session tracing only, not repo-committed.

5. **Plan-cache + delta update:** at end of invocation, run TWO writes in this order:

   a. **Cache (existing):** `bash ${CLAUDE_SKILL_DIR}/helpers/update-cache.sh "<umbrella-or-no-arg>" "<outcome-one-liner>"` — helper writes `## Last invocation` only; non-«Last invocation» sections populated by direct `Edit` before invocation. Detail + helper-scope contract + anti-patterns: [`references/plan-cache.md §3`](references/plan-cache.md). <!-- @dual-pair: meta-orchestrator-plan-cache -->

   b. **Delta arrays (sibling-helper pattern, DN-2 B verdict 2026-05-27):** invoke `delta-write-from-state.sh` to write the two arrays, THEN invoke `update-delta.sh` for metadata. Concrete shape (`<current_ids_json_array>` and `<resolved_ids_json_array>` are angle-bracket placeholders that the rendering AI substitutes with real JSON-array literals derived from §2.5 Step 8/9; the syntax is correct only after substitution):

      ```bash
      bash ${CLAUDE_SKILL_DIR}/helpers/delta-write-from-state.sh "${umbrella:-no-arg}" '<current_ids_json_array>' '<resolved_ids_json_array>'
      bash ${CLAUDE_SKILL_DIR}/helpers/update-delta.sh "${umbrella:-no-arg}" "<outcome-one-liner>"
      ```

      The TWO sibling helpers are deliberately split: `update-delta.sh` owns metadata + fresh-template bootstrap (idempotent paired-negative test at `packages/core/hooks/update-delta.test.ts`, UNCHANGED post-F.3); `delta-write-from-state.sh` owns arrays-only rewrite (paired-negative test at `packages/core/hooks/delta-write-from-state.test.ts`, F.3 helper-collapse 2026-05-28 — sibling pattern preserves the existing update-delta.sh test contract per DN-2 B verdict). The inline `!shell` `jq` block that previously did the arrays rewrite was removed 2026-05-28 (F.3 PR #261); its function is now owned by `delta-write-from-state.sh`. **`first_seen` semantics are «most recent sighting», NOT «first-ever sighting»** — the overwrite-shape inside the helper is the bound choice (matches §2.5 Step 9 prose; simpler atomic write; trades historical-first-seen for shape simplicity). DO NOT introduce a preserve-shape variant. <!-- @dual-pair: meta-orchestrator-master-backlog-delta -->

**File cleanup policy:**

- `<umbrella>-meta-launch/` directory is NOT auto-deleted. It persists as the dispatch record for that umbrella's lifecycle.
- If a second invocation occurs on the same umbrella, state.md is updated; kickoff.md is preserved (not overwritten) unless `--force` arg is passed.

**Failure path:** if Write tool fails on any output artifact, skill emits a diagnostic and halts before dispatch. No partial state left unrecorded.

---

## §11 Failures

> **§7.13 binding.** Class C prose enforcement — `!shell` data is surfaced so AI has no excuse for ignorance; per-code trigger + required-response table lives at [`references/failures.md`](references/failures.md). Read once before invoking; halt + surface (never assume) on any F-code. Re-promotion trigger: ≥2 stage-gate-ignored incidents within 6 months → add pre-push hook verifying stage dependency merged before sub-wave commit.

---

## Red flags / Common mistakes

When operating under this skill, the following rationalizations mean STOP and re-read the relevant section:

| Rationalization | Reality | Counter (section) |
|---|---|---|
| «Plan looked current last session, skip §1» | Plan-currency is per-invocation, not per-session — PRs merge between invocations | §1 (T4 anti-pattern) |
| «Launch-table can be from memory, kickoff hasn't changed» | Kickoff edits between invocations are invisible without re-read | §3 (T3 anti-pattern) |
| «Stage 1 was 'about to land' so dispatch Stage 2 now» | Stage gate is real `gh pr list --search "is:merged"` — never «about to» | §6 (Class C honesty) |
| «Both candidates feel similar — I'll pick A» | True ties go to maintainer as DECISION-NEEDED, not the meta-orchestrator | §2 step 4 + reviewer-discipline §2 |
| «Maintainer said 'выбирай сам' so DECISION-NEEDED is satisfied, I'll pick» | **NO** — «pick for me» / «оба норм» / «я устал» = *deferred* DECISION-NEEDED, not answered. Genuine answer is a content tiebreaker («pick X because Y about the umbrellas»). Re-surface with sharper framing or propose a coin-flip; do NOT silently pick. | §2 step 4.1 (anti-rationalization clause) |
| «Phase -1 reviewer between stages is optional when stage was small» | Mandatory regardless of stage size (CI ≠ design review, T19) | §6 step 3 + §7 |
| «I'll quickly implement this trivial sub-wave inline» | Anti-scope: meta-orchestrator dispatches kickoffs; never implements | §8 anti-scope |
| «Modify `~/.claude/skills/orchestrator/` to align with this skill» | That file is agent-uncommittable; wrap, never fork or edit | §8 anti-scope |
| «`!shell` injection failed — proceed anyway with assumed values» | F6: emit DIAGNOSTIC and halt; do NOT assume gate is clear | §11 F6 |
| «Reviewer returned REVISE 3× — try once more» | F5: after 3 REVISE cycles, escalate to maintainer | §11 F5 |
| «`see ai-laziness-traps.md` is enough in the meta-kickoff §5» | Blanket reference is itself T7 — explicit T-enumeration mandatory | §4 step 3 + §5 + ai-laziness-traps.md §3 |

**Red flag phrases — STOP and re-verify:**

- «обновлю план потом / I'll fix the plan-sequencing entry after» → fix BEFORE dispatch; §1 stale plan blocks §2
- «достаточно одного reviewer'а / one reviewer's enough» → meta-orchestrator's Phase -1 is mandatory between every stage
- «merged значит runtime-verified / merged means runtime-verified» → stage-gate verifies merge, not runtime behaviour; verify-trace dispatch is separate
- «гипотетический stage 3 / hypothetical Stage 3» → if Stage 3 isn't in the kickoff, do NOT invent it; surface to maintainer

## With this skill

`/meta-orchestrator` provides a single slash-command entry point that:

1. **Verifies plan currency** — compares `wave-sequencing-plan.md` claims to live `gh pr list` output; surfaces DRIFT items before any dispatch.
2. **Scores cross-umbrella priority** — multi-criteria scoring (blocks-other-waves × 3, give-back-value × 2, size-fit × 1, maintainer-prefs × 2) with a structured ranked list.
3. **Generates a launch-table** — auto-detected sub-waves with Mode A/B/SDD/Queue decisions, Stage, Parallel-sibling, Volume columns; written to a meta-kickoff file.
4. **Enforces stage gates** — real `gh pr list --search "is:merged head:<branch> base:staging"` checks before each stage transition; HALT on unmerged dependencies.

## Without this skill

Without `/meta-orchestrator`, multi-wave umbrella orchestration relies on:

- **Manual plan-currency check:** the orchestrator must manually scan `wave-sequencing-plan.md`, compare to `gh pr list` output, and notice drift — error-prone under time pressure (T3 without verification).
- **Flat queue dispatch:** orchestrator dispatches sub-waves sequentially without verifying Stage N dependencies are merged first (`#flat-queue-no-gates` anti-pattern — dispatching Stage 2 before Stage 1 PRs merge leads to branch contamination or rebase work).
- **Ad-hoc launch-table:** Mode / SDD / Stage / Volume decisions are made inline without a structured decision framework — inconsistent across sessions, no audit trail.
- **No structured meta-kickoff:** each umbrella kickoff is hand-authored with variable §5 AI-traps enumeration quality — principle 12 violations go undetected until pre-push.

The cost of absence: orchestrator surgery time when a parallel branch contaminates main (incident 2026-05-12, the origin event), plus AI-trap violations accumulating in kickoffs.
<!-- globs: .claude/orchestrator-prompts/**, docs/meta-factory/wave-sequencing-plan.md -->
<!-- inject: Meta-orchestrator — ≥2 in-flight wave umbrellas or wave-sequencing-plan.md drift: /meta-orchestrator (plan-currency + priority + launch-table + stage-gate dispatch). Forward-going annotation: activates when inject-matching-rule.sh is extended to scan .claude/skills/*/SKILL.md (today scans .claude/rules/ only). -->

## See also

- [R-phase patch (binding spec)](../../../docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md)
- R-phase kickoff §7 (functional spec — 14 sub-sections) — `.claude/orchestrator-prompts/meta-orchestrator-prior-art/kickoff.md` (gitignored executor reference)
- Global `~/.claude/skills/orchestrator/SKILL.md` — the queue/dispatch primitive this skill wraps. Agent-uncommittable. (tilde-path, not a repo link)
- [parallel-subwave-isolation.md §1](../../rules/parallel-subwave-isolation.md) — worktree isolation (§5 Mode B) · [reviewer-discipline.md §2](../../rules/reviewer-discipline.md) — reviewer role (§7)
- [no-paid-llm-in-ci.md §1](../../rules/no-paid-llm-in-ci.md) — hard constraint on all dispatch · [ai-laziness-traps.md §3](../../rules/ai-laziness-traps.md) — T-enumeration + [principle 12 test](../../../packages/core/principles/12-ai-laziness-traps.test.ts)
- [SSOT rows #66-#70](../../../docs/meta-factory/prior-art-evaluations.md) — R-phase survey evidence; [references/bundle-composition.md](references/bundle-composition.md) — §5.5 full spec (B1/B2/B3a)
- [references/plan-cache.md](references/plan-cache.md) + [references/master-backlog-delta.md](references/master-backlog-delta.md) — §2.5 Step 1/8 + §10 item 5
