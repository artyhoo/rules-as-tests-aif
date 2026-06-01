<!-- scope:dispatch-worktree-automation-umbrella -->
# Retro — `dispatch-worktree-automation` umbrella

> Scope: retrospective for the `dispatch-worktree-automation` umbrella (R-phase #271 → I-phase Sub-waves A #279 / B #282 / C #284). Inherits folder authority from [retros/README.md](README.md) — closed historical artifact post-merge.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The hook contract — see [`.claude/hooks/worktree-setup.sh`](../../../.claude/hooks/worktree-setup.sh). The R-phase verdict — see [research-patches/2026-05-29-dispatch-worktree-automation.md](../research-patches/2026-05-29-dispatch-worktree-automation.md).

**Date:** 2026-05-29 · **Verdict: GO (umbrella DONE).** Self-application score 10/10 (this retro authored inside a worktree the umbrella's own hook created — see headline).

---

## Headline — the retro is the artifact

This retro session was spawned by `claude -w retro-dispatch-worktree-auto`. The `WorktreeCreate` hook this umbrella shipped (PR #279) fired before the first prompt: the worktree lives at `.claude/worktrees/retro-dispatch-worktree-auto/`, the branch is `worktree-retro-dispatch-worktree-auto`, and both `node_modules` symlinks were created at 19:18 (`ls -la node_modules` → `… -> /Users/art/code/rules-as-tests-aif/node_modules`; `packages/core/node_modules -> ../../node_modules`). **The umbrella that exists to remove worktree-setup friction is being retro'd in a worktree set up with zero friction.** Project invariant #2 (recursive self-application green) is satisfied not by assertion but by the live environment.

It is also the **fourth** independent dispatch of the hook (after `iphase-acceptance` @18:32, `aif-handoff-sw-A-resume` @18:42 per [the acceptance patch §2](../research-patches/2026-05-29-dispatch-worktree-iphase-acceptance.md), and this one @19:18) — and it **reproduced the §3.2 base-ref MINOR a third time** (see Finding F1).

---

## §1 Verification block

### What shipped (5 commits, all merged to `origin/staging`, all PRs MERGED)

```text
$ git log --oneline origin/staging | grep -i dispatch-worktree
55e9522 docs … I-phase Sub-wave C — recursive acceptance test (step count 7→2 verified) (#284)
3a7337a docs … I-phase Sub-wave B follow-up — §7.6 antipattern bug #39886 backstop + template §4a removal (#271 §8 item 4)
193758a docs … I-phase Sub-wave B — meta-orchestrator skill prose migrates to claude -w (#271 §8 items 1+2+5)
9780d4c feat … I-phase Sub-wave A — WorktreeCreate hook + paired-negative test (Candidate D2)
c6b11bf research … R-phase — ADOPT `claude -w` + ADAPT WorktreeCreate hook (#271)
```

| Phase | PR | Deliverable |
|---|---|---|
| R-phase | [#271](https://github.com/Yhooi2/rules-as-tests-aif/pull/271) | Research patch: 7 candidates (A–G) × 5 criteria; 6-item search coverage. Verdict **ADOPT Candidate E** (`claude -w` native flag, CC ≥2.1.143) **+ ADAPT Candidate D2** (`WorktreeCreate` hook for `node_modules` symlinks). |
| I-phase A | [#279](https://github.com/Yhooi2/rules-as-tests-aif/pull/279) | `.claude/hooks/worktree-setup.sh` (107 LOC) + paired-negative test. Closed §8 ATTN 4 — stdin schema empirically verified `{.session_id,.transcript_path,.cwd,.hook_event_name,.name}`. |
| I-phase B | [#282](https://github.com/Yhooi2/rules-as-tests-aif/pull/282) | meta-orchestrator skill prose → `claude -w`; §7.6 bug #39886 backstop; template §4a (bash fallback) removal. PR #271 §8 items 1+2+4+5. |
| I-phase C | [#284](https://github.com/Yhooi2/rules-as-tests-aif/pull/284) | Acceptance report: step count **7 → 2** (→1 headless), measured on two live dispatches. STOP §10 not triggered. |

### Executable verification (re-run at retro time)

```text
$ claude --version
2.1.156 (Claude Code)                          # ≥ 2.1.143 kickoff floor ✓

$ npx vitest run packages/core/hooks/worktree-setup.test.ts
Test Files  1 passed (1)
Tests  10 passed (10)                           # paired-negative contract holds ✓

$ ls -la node_modules packages/core/node_modules     # in THIS worktree
node_modules -> /Users/art/code/rules-as-tests-aif/node_modules
packages/core/node_modules -> ../../node_modules     # hook fired for this session ✓

$ git rev-parse --short origin/HEAD origin/staging
bb3ecec  55e9522                                # base-ref drift — see Finding F1
```

CI: all four PRs merged green into `staging` (the inverted-automerge trunk). No revert.

---

## §2 Self-reflection block (per [phase-research-coverage.md §2](../../../.claude/rules/phase-research-coverage.md))

1. **Когда ошибся — почему?** No coverage gap was *introduced* in the umbrella research — the R-phase ran the full 6-item checklist, surfaced the native `claude -w` primitive (Candidate E) by probing `claude --help` rather than trusting training data (countered T-DWA-A), and refused two BUILD verdicts (Candidates C, F) because the CC primitive already exists (BFR layer 5). The one residual is the §3.2 base-ref MINOR — not a research gap but a *real-world ref-hygiene fact* (`origin/HEAD` doesn't advance on plain `git fetch`) that only surfaces empirically, which is exactly why Sub-wave C measured on live dispatches instead of a reconstructed trace.
2. **Мог ли пропускать раньше?** The friction this umbrella removes had been paid for months (the ~7-step manual paste-block lived in the orchestrator skill). The *14-hour drift* that motivated the umbrella was the cost of never abstracting it. The shortcut available earlier — "just keep pasting the block" — was taken repeatedly and only caught when the cumulative tax became visible. Systemic, not one-off.
3. **Как не пропускать?** The lesson maps to **[build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md)** + **[parallel-subwave-isolation.md §4 (N7)](../../../.claude/rules/parallel-subwave-isolation.md)**: when a recurring manual ritual exists, check whether the *harness* already provides the primitive (it did — `claude -w`, ADOPT) before building. The ADAPT-not-BUILD split (native flag for the worktree; a thin 107-LOC hook only for the project-specific `node_modules` symlinks) is the model: adopt the engine, build only the residue.
4. **Какой урок?** *Before re-pasting a multi-step setup ritual for the Nth time, search for a one-flag harness primitive that collapses it — and if found, build only the project-specific glue the primitive omits.* Operationalised: `claude -w <name>` + WorktreeCreate hook = 7 steps → 2.
5. **Did the principle apply to its own design choices?** Yes — and uniquely so. The umbrella's deliverable is a dispatch mechanism, and every dispatch *after* Sub-wave A landed has used it: Sub-wave C's acceptance dispatch, the parked `aif-handoff` resume, and **this retro session itself**. The discipline isn't just documented; it is the substrate the documentation is being written on. (T15 satisfied by environment, not narrative.)

---

## §3 Findings carried forward

### F1 — `claude -w` branches from a stale `origin/HEAD` (MINOR, now 3× reproduced) — OPEN follow-up

[`worktree-setup.sh:73`](../../../.claude/hooks/worktree-setup.sh) resolves base ref via `origin/HEAD → origin/main → main → HEAD`. But `origin/HEAD` is a symbolic ref refreshed only by clone / `git remote set-head` — a plain `git fetch` advances `origin/staging` and leaves `origin/HEAD` pinned. Result: every `claude -w` worktree is born behind the live trunk.

- **Acceptance patch §3.2** observed it on two dispatches (both at `bb3ecec`).
- **This retro session** reproduced it a **third** time: spawned at `origin/HEAD = bb3ecec` (#187) = **138 commits behind** `origin/staging` (`55e9522`). I had to `git switch -c retro/dispatch-worktree-automation origin/staging` to author against live CLAUDE.md and the live rules.

This is the hook *behaving exactly as written against a drifted ref* — a content-freshness caveat, not a step-count or flag failure (hence MINOR, not a STOP). But three independent reproductions in one day means it bites the default workflow every time, not occasionally.

**Recommended follow-up (NOT shipped here — Sub-wave C/retro are docs-only; the hook is owned by the enforcement layer):** harden `worktree-setup.sh` base-ref resolution to prefer an explicitly fetched trunk tip (`origin/staging`) over the symbolic `origin/HEAD`, or run `git remote set-head origin -a` before branching. Surfaced per backward-check; do not silently patch. *Suggested as a dedicated single-concern follow-up PR — flagging as observation per [CLAUDE.md «PR strategy»](../../../CLAUDE.md), not auto-spawning.*

### F2 — VS Code-tab dispatch is a fourth channel `claude -w` doesn't serve (DECISION-NEEDED, from [R-patch §8](../research-patches/2026-05-29-dispatch-worktree-automation.md))

`claude -w` is a CLI command; a maintainer dispatching by opening VS Code in a worktree cannot invoke it as a VS Code action. The R-phase flagged this as DECISION-NEEDED. Not blocking the umbrella (the CLI path is the primary), but unresolved for the VS-Code-first workflow.

### F3 — no principle test on worktree-automation discipline (deferred by design)

Per kickoff §12 the umbrella ships test-free at the *discipline* level (the hook itself has a paired-negative test; the "always dispatch via `claude -w`" convention does not). Promote to a principle test only if drift recurs — consistent with the project's incident-driven promotion ceiling for delivery-channel conventions ([rule-enforcement-channel-selection.md](../../../.claude/rules/rule-enforcement-channel-selection.md)).

---

## §4 Evaluation block

| Dimension | Value |
|---|---|
| Self-application score | **10/10** — retro authored inside a hook-created worktree; 4 live dispatches of the shipped substrate |
| Time-vs-plan | R+A+B+C all landed 2026-05-29 (single day). No >2× overrun → **no RCA triggered** |
| Acceptance criterion 2 (≤2 steps) | **MET** — 7 → 2 (→1 headless), measured on live dispatches not reconstructed traces |
| BFR discipline | ADOPT (`claude -w`) + ADAPT (D2 hook) + REFERENCE SSOT #65; zero gratuitous BUILD |
| New risks | F1 base-ref drift (bites every dispatch until hardened); F2 VS-Code-channel gap |
| Open follow-ups | F1 (hook base-ref hardening — recommend dedicated PR), F2 (VS-Code dispatch DECISION-NEEDED) |
| Verdict | **GO — umbrella DONE.** No revert condition. |

---

## 🟢 Простыми словами

Раньше, чтобы запустить параллельную сессию в отдельной папке, приходилось вручную набирать ~7 команд (создать worktree, перейти в него, два симлинка `node_modules`, новая ветка, открыть вкладку, вставить промпт). Накопленный «налог» однажды стоил 14 часов дрейфа — ради этого и затеяли umbrella.

Теперь хватает **одной команды** — `claude -w <имя>`, — и хук сам делает папку, ветку и симлинки. Проверено четыре раза вживую, в том числе **этой самой сессией**: ретро написано внутри папки, которую создал хук этого же umbrella. Цель «≤2 шага» достигнута (было 7 → стало 2, в headless вообще 1).

Один нюанс (не блокер, но повторился уже трижды): `claude -w` делает ветку от `origin/HEAD`, а этот указатель устаревает при обычном `git fetch` — поэтому новая папка рождается позади свежего `staging` (у этой сессии — на 138 коммитов). Чинится одним `git rebase`/`switch`, но хук стоит подкрутить отдельной правкой, чтобы он брал свежий `origin/staging`. Записал как follow-up F1, сам хук в этой волне не трогал.

---

## See also

- [research-patches/2026-05-29-dispatch-worktree-automation.md](../research-patches/2026-05-29-dispatch-worktree-automation.md) — R-phase verdict (7 candidates, 5 criteria).
- [research-patches/2026-05-29-dispatch-worktree-iphase-acceptance.md](../research-patches/2026-05-29-dispatch-worktree-iphase-acceptance.md) — Sub-wave C acceptance (step-count measurement + §3.2 base-ref MINOR).
- [`.claude/hooks/worktree-setup.sh`](../../../.claude/hooks/worktree-setup.sh) — the `WorktreeCreate` hook (PR #279); F1 target.
- [`packages/core/hooks/worktree-setup.test.ts`](../../../packages/core/hooks/worktree-setup.test.ts) — paired-negative test (10/10).
- [parallel-subwave-isolation.md §4 (N7)](../../../.claude/rules/parallel-subwave-isolation.md) — Superpowers `using-git-worktrees` dogfood `claude -w` realises.
- [prior-art-evaluations.md #65](../prior-art-evaluations.md) — SSOT for `using-git-worktrees` REFERENCE.
