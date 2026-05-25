# Wave sequencing plan — when to do/launch what

> **Authoritative for:** execution *ordering* of the open waves (N0–N8) + infra tracks — the «when / in what order / gated by what» layer. Sequencing rationale: single hard date, dependency edges, cost-first (free research before paid build).
> **NOT authoritative for:** project goal — see [../../README.md#why-this-exists](../../README.md#why-this-exists); each wave's *content* — see [research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md) (N0–N7) and [research-patches/2026-05-22-deterministic-offload-autonomy-economy.md](research-patches/2026-05-22-deterministic-offload-autonomy-economy.md) (N8); the storm/billing facts — see N0 in the niche roadmap; the automerge/staging infra — see [automerge-staging-plan.md](automerge-staging-plan.md).
>
> **Status:** ACTIVE — committed to staging (#151, 2026-05-22). Wave *admission* + launch order = maintainer call per [reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md). The ordering/dependency structure (§2–§6) is the durable layer; **per-wave statuses drift** — §0 holds the snapshot reconciled 2026-05-25 against merged PRs + per-wave research-patches. Re-verify §0 before relying on it.

---

## §0 — Verified status snapshot (reconciled 2026-05-25)

> Verified against merged PRs (`gh pr view`) + per-wave research-patches present in `research-patches/`. Supersedes any «pending/next» framing in older prose below — mirrors the `#stale-claim` correction the niche roadmap §STATUS-RECONCILIATION already needed once.

| Wave | What | Verified status | Evidence |
|---|---|---|---|
| N0 | headless billing change (15 Jun) | ✅ **decision CLOSED 2026-05-22** — defer-action + arm utilisation trigger (D1/D2/D3 resolved) | §5.3; niche-roadmap §N0 |
| N1 | niche-validation research | ✅ research deliverable complete | `2026-05-21-n1-niche-validation.md` §4 verdict («research deliverable only») |
| N2 | adopt-from-Superpowers | 🟡 verdicts done → application (rule/SSOT edits) pending, maintainer-owned | `2026-05-21-n2-adopt-from-superpowers.md` §3 |
| N3 | enforcement substrate (= Wave 10) | ✅ DONE | #107/#114/#116/#119/#120/#127/#129 MERGED |
| N4a | claim-detector fix | ✅ DONE | #98 MERGED |
| N4b | recommendation-moment gate | 🟡 D6 resolved: H1 SHIPPED (#117), H2 REJECTED, H10 DEFERRED/trigger-gated | `2026-05-22-n4b-recommendation-gate-design.md` (design #136); open-questions §13.39 (record #118) |
| N5 | give the conscience back | 🔲 not started — **BLOCKED** (dependency): gated on N7 *live-dogfood trial* (N7 decision=C ✅ + repo-side applied, but live trial still pending) + N2 application. By design you can't give back until dogfooding reveals what's genuinely unique (niche-roadmap line 91/116) | niche-roadmap §N5 |
| N6a | coexistence / C-1 | ✅ DONE | #79/#82 MERGED |
| N6b | one-button install | 🔲 not started — **NOT blocked** (deps met): N3 portable TS-core ✅ (`packages/core/hooks/pre-push.ts` + `checks/`; the 7 `.claude/hooks/*.sh` are thin CC-event glue, not the engine) + N6a ✅. Sequenced "last" by *choice*, **startable anytime**. Scaffold (`npx`) must also template the 7 CC-event hooks | niche-roadmap §N6 (line 82/107) |
| N7 | dogfood companions | ✅ **applied + verified** (SSOT #64/#65, rule §4 demotion, retention=A coexist; Superpowers v5.1.0 installed + source/installed-file verified §7b/c; orchestrator-skill REFERENCE note landed). Sole open item: one organic end-to-end SDD run (§7a, deferred to first real umbrella); **DECISION=C** | `2026-05-22-n7-dogfood-companions.md` §9 + dogfood-companions research-patch #135 + §4 demotion #166 + live-trial verified #171 |
| N8 | deterministic-offload autonomy economy | ✅ **R-phase DONE** (#158→staging; autonomous Queue-mode: Worker→Reviewer **GO**→orchestrator anti-collusion passed). **A-phase 🟡 C1–C4 SHIPPED** (correctness offloads): C1 SSOT-existence arm (#170), C2 kickoff T-enumeration floor (#174), C3 principle 13 §1.7 substance (#178), C4 delivery-channel marker (#177), activation #180 (C2+C4 wired). **C5 + cost-levers** still gated on the §5.3 utilisation trigger | findings `2026-05-22-n8-rphase-findings.md` (R1–R4; ⚠ R2 category-survey coverage **provisional** — only 1/6 categories hit the ≥3-candidate floor, corrected #163 §10 → treat R2 verdicts as non-load-bearing until completed) + plan `2026-05-22-deterministic-offload-autonomy-economy.md` |
| **Channel-audit + mutation-hardening** | session 2026-05-23 wrap-up | ✅ **PR #181 + #183 MERGED**; channel-audit §10 DN-1..DN-4 all resolved (see §5.4); follow-up queue ⇒ Track M (M.1–M.6) — **M.1 ✅ DONE (#212), M.4 ✅ DONE (#195/#196/#197/#198/#199/#200, 6 hooks tested), M.2/M.3/M.5/M.6 still queued**; principle 11 testTimeout tightened #184 | §5.4 decision record + Track M sequencing |
| **Meta-orchestrator skill** (Track P) | n8-c3 BUILD (Sub-wave D) + audit rounds + UX refactor (F.1/G/F.3) + planner-completeness (L1/L2 + L3–L5 R-phase) + §1.7 PR-body mandate + **skill-memory (cache + injection + writer)** | 🟡 BUILD ✅ / audits ✅ / UX ✅ / L1+L2 ✅ / **L3–L5 I-phase 🔲** / **skill-memory 🔲** | #186 (BUILD root) · #192/#193/#194 (audit r1) · #201/#202 (audit r2 + follow-ups) · #203 (F.1 prior-art) · #204 (G refactor design) · #205 (F.3 UX impl) · #208 (EOT guard) · #209 (Item 10 B5 hybrid) · #213 (L3–L5 R-phase prior-art) · #214 (L1 discovery surface) · #217 (L2 reverse-currency UNTRACKED) · #216 (§1.7 PR-body mandate in kickoff template) · #227 (plan-memory brainstorm) · #230 (plan-memory R-phase — ADOPT Direction B + SSOT #77) · (this PR: `meta-orchestrator-skill-memory/kickoff.md`) |
| **Recommendation-laziness discipline** | R-phase + production-corpus benchmark + I-phase Sub-waves A/C/D (covers M.1 T20 codification + new Class-C mechanism rule) | ✅ **DONE 2026-05-25** — Option D = A+C only (narrow-B dropped, FP=84.2%) | #206 (R-phase design) · #207 (BFR own-stack-blind-spot amend) · #210 (narrow-b benchmark) · #211 (I·A — H1 cross-ref) · #212 (I·C — T20 trap; **closes M.1**) · #215 (I·D — `.claude/rules/recommendation-laziness-discipline.md` Class C mechanism layer for `phase-research-coverage §1.12`) |

**Infra:** I.1 staging-trunk migration **DONE** (#144/#150 — default branch = `staging`, `main` push-blocked, `ci-success` on both; native Merge Queue unavailable on this repo → `strict:false` substitute). I.1 follow-ups: ci-success aggregate #125 / non-main-base trailer backstop #123 / sole-required-gate fold-in #130 / tsc --noEmit gate #131 / EOT recap fix #145 / pre-push default origin/staging #146 / LIVE status correction #147+#148 / merge-queue dry-run #149 / runbook preserve #172 / resync staging→main #143+#187 / branch-from-main flow doc #128 / automerge plan #124 / §1.7 trailer CI backstop #121. I.2 channel-selection promote + SSOT #60–#63 still maintainer-click; channel-selection rule + survey #139 + path-scoped rule-injector #142 + activation #175 + SSOT #60–#63 codify #154. I.3 DN-4 incremental: memory-codification gap tracker #140 + memory-codification rule + auditor #138 + verify-before-claim family codification #159 + DN-4 round 2 #161 + round 3 #162 + #21 (human-verifies-nothing) #167 + DN-5 Class headers fix #152 + memory coverage audit #126 + principle 17 no-paid-LLM CI #132+#133.

**What actually remains:** apply N2 verdicts (maintainer-owned rule/SSOT edits); **N7 applied + verified** (SSOT #64/#65, rule §4 demotion, Superpowers installed + verified) — sole open item = one organic end-to-end SDD run (deferred) · **N8 A-phase C5 + cost-levers** (C1–C4 ✅ SHIPPED — see N8 row; cost-levers gated on §5.3 utilisation trigger) · **Meta-orchestrator L3–L5 I-phase** (R-phase done #213; implementation pending) · **Meta-orchestrator skill-memory I-phase** (this PR: cache + injection + writer; ADAPT Cline Memory Bank per SSOT #77) · **Track M.2/M.3/M.5/M.6** (M.1+M.4 ✅ DONE) · N4b H10 (deferred, trigger-gated) · **N6b** (NOT blocked — deps met, deprioritized) · N5 (blocked on N7 live-dogfood). *(N0 decision CLOSED 2026-05-22 — see §5.3; 0.3 promote→`EXECUTION-PLAN.md` CLOSED 2026-05-22 — see §5.2; channel-earliness audit ✅ DONE — see channel-audit row + §5.4.)*

> **⚠ SSOT-ID collision:** N8 findings §7 proposed rows **#64–#68**, but N7 application already **took #64/#65** (see N7 row). When N8 A-phase admits its SSOT rows they must renumber to **#66+** (next free). The N8 findings file's §7 numbers are stale on this point — corrected at A-phase admission, not now (findings is a research deliverable, ID assignment happens at capability-commit). The N0 decision record (§5.3) likewise refers to these by *role* (prompt-caching / local-model rows), not by frozen number.

> **🔲 legend (read the cell, don't assume):** 🔲 = *not started* — the cell says **why**. **BLOCKED** = unmet dependency (N5). **NOT blocked** = deps met, just deprioritized → startable now (N6b). 🟡 = partially done (research/repo-side done, application/live-trial pending). ✅ = done+merged. Distinguishing blocked-🔲 from deprioritized-🔲 is the thing sessions keep confusing.

**Mostly research-complete:** the bulk of per-wave *research* across N1/N2/N4b/N7/N8 is done; the open frontier is **application** of verdicts + N0/N8 cost work, not new research.

**Standalone work + plan-revision history (not tied to a named wave):**

- **Standalone research-patches / cleanups:** satellite-architecture + honest-dogfooding positioning + K1/K2 plan slots #191 (K1 audit / K2 refactor planned, not started); guard-liveness-gate research-patch #189; storm-readiness→positioning goal + book Часть XIV #173; Wave-10 legacy/drift cleanup #182; ported §10 correction from `channel-earliness-audit.md` #176.
- **Wave 10 / N3 follow-ups:** SSOT #54 Aider `run_cmd` ADAPT #110; principle 15 — skill paired-negative test #112 (TDD-for-Skills §13.36 RESOLVED) + record patch #113.
- **Plan revision history (this file's own commit trail):** #108 (reconcile N6a + N4a), #109 (close companion A/B/C decisions ⇒ §5.1), #153 (close decision 0.2 — companion = C ⇒ §5.1), #155 (reconcile statuses), #157 (close decision 0.3 — promote → `EXECUTION-PLAN.md` ⇒ §5.2), #160 (N8 R-phase status DONE), #164 (close N0 decision ⇒ §5.3), #165 (clarify N5/N6b readiness + SSOT-ID collision), #168 (flag N8 R2 coverage provisional), #179 (schedule channel-earliness audit Track 2.3), #185 (record DN closures + Track M follow-up queue ⇒ §5.4).

---

## §1 — The single hard anchor

**2026-06-15 = N0** (headless `claude -p` / Agent-SDK / GH-Actions move to a metered monthly credit). ~3.5 weeks out from 2026-05-22. **This is the only externally-fixed date.** Everything else has no deadline → ordered by «cheap + unblocks-most» and dependency edges. N0 is a *meter, not a ban* — substrate is already weatherproof (`no-paid-llm-in-ci`); the storm hits only the dispatch/process layer.

## §2 — Tracks + ordering

### Track 0 — now, cheap, clears the table (days, ~$0)
| # | Task | Why now | Note |
|---|---|---|---|
| 0.1 | Commit books (facts + chronicle v3) + N8 patch + this doc | «don't lose plans» (session theme); currently uncommitted | maintainer commits |
| 0.2 | ✅ **CLOSED — companion = C** (both, on separate layers) | unblocks N7 | maintainer-delegated decision 2026-05-22 («Твоё решение»); rationale below |
| 0.3 | ✅ **CLOSED — promote via pointer** (cross-ref, not duplication) | plans «active» from canonical plan; SSOT stays single | maintainer-delegated 2026-05-22; see §5.2 |

### Track 1 — critical path to June 15 (maintainer's stated top priority: autonomy without extra spend)
| # | Task | When | Depends on |
|---|---|---|---|
| 1.1 | **N8 R-phase** (free: local-model dispatch / batch / caching / offload-sweep + «$ above subscription» estimate) | ✅ **DONE** (#158→staging, 2026-05-22) | — |
| 1.2 | **N0 decision** — how to stay autonomous + cheap, informed by 1.1 | ✅ **DONE 2026-05-22** (§5.3: defer-build + arm trigger) | 1.1 |
| 1.3 | **N8 A-phase** — apply cheap wins (migrate checks into hooks, autonomy hooks) | C1 startable now (correctness); cost-levers gated on the §5.3 utilisation trigger | 1.1; **D1/D2/D3 resolved by N0 §5.3** ([findings §7](research-patches/2026-05-22-n8-rphase-findings.md)) — was: maintainer gates |

### Track 2 — cheap, no deadline, parallel-safe
| # | Task | Note |
|---|---|---|
| 2.1 | N1 — niche-validation research (DeepWiki/WebSearch, $0) | parallel to 1.1 |
| 2.2 | N4b — design recommendation-moment gate | detector (N4a) already shipped; frontier |
| 2.3 | **Channel-earliness audit** — ✅ **DONE 2026-05-23** (PR #181) | retroactive sweep of every existing check vs «earliest reachable channel» (the sweep [channel-selection §6](../../.claude/rules/rule-enforcement-channel-selection.md) deferred). Findings: 55 surfaces classified (ADD-DUAL-CHANNEL 20 / ALREADY-AT-FLOOR 25); §10 DN-1..DN-4 resolved (see §5.4); follow-ups → Track M.5a/b/c + M.6 |

### Track 3 — after dependencies clear
| # | Task | Gate |
|---|---|---|
| 3.1 | N7 — dogfood companions | DECISION=C (0.2); overlaps N8 A3 |
| 3.2 | N5 — give the conscience back | after N7 |
| 3.3 | N6b — one-button install | last (after portable core + coexistence) |

### Track I — infra (independent of niche waves; maintainer-gated)
| # | Task | Note |
|---|---|---|
| I.1 | ✅ **DONE** — staging-trunk migration | shipped #144/#150; default = `staging`, `main` push-blocked, `ci-success` both; queue unavailable on repo → `strict:false` substitute |
| I.2 | Channel-selection wave → promote staging→main + SSOT #60–#63 | maintainer click |
| I.3 | DN-4 (15 stage-0 memory-codification gaps) | incremental, low priority, any window |

### Track M — channel-audit + mutation-hardening follow-ups (queued 2026-05-23; **M.1+M.4 DONE 2026-05-24**)

Origin: §5.4 decision record. All Track M items are cheap, deterministic (no paid LLM), no June-15 dependency. Maintainer-gated for launch.

| # | Task | Dependencies | Size |
|---|---|---|---|
| **M.1** | ✅ **DONE 2026-05-24** — codified **T20 «inline-verdict-without-evidence»** in `.claude/rules/ai-laziness-traps.md §2 T20` (NB: the actual codified trap is inline-verdict, not equivalence-claim; recommendation-laziness umbrella took the T20 slot — mutation-equivalence T-bump 20→21 still pending). | shipped #212 | tiny markdown |
| **M.2** | Commit-msg grep gate (`.husky/commit-msg`): if body mentions «equivalent» in mutation/survivor context AND no «tried: …» / «structural: …» sibling line → fail. Class B/C deterministic. | **M.1** (must cite T20) | small bash + 1 test |
| **M.3** | Channel-audit §10b follow-up patch: append DN-1..DN-4 closure inline to the merged research-patch (`docs/meta-factory/research-patches/2026-05-22-channel-earliness-audit.md`) | none | tiny markdown append |
| **M.4** | ✅ **DONE 2026-05-24** — **6 paired-negative bash-hook tests shipped** (`deps-hash-check` #195 / `end-of-turn-reminder` #196 / `ask-question-reminder` #197 / `check-doc-authority` #198 / `inject-session-bootstrap` #199 / `validate-prompt` #200). Stratified parallel ~45min wall-clock. | shipped | medium per hook; large umbrella |
| **M.5a** | Top-3 edit-time hooks (DN-2 batch 1): (a) manifest render-drift PostToolUse; (b) research-patch §1.7-substance + scope-annotation PostToolUse; (c) actionlint per-yml PostToolUse. **3 atomic PRs**, each requires `settings.json` wiring (agent-self-protected ⇒ maintainer-click) | **M.4** (test-first for the new hooks themselves) | medium per hook |
| **M.5b** | 17 pre-commit hooks (DN-2 remainder, batched). Extends `.husky/pre-commit` with path-filtered checks; fires per-commit not per-edit (~10× cheaper than edit-time per [§5.4 cost data](#§5.4)) | **M.5a** (validate the dual-channel pattern works on top-3 first before scaling to 17) | single batched PR |
| **M.5c** | Per-file zizmor PostToolUse on `.github/workflows/*.yml` + KEEP full-dir pre-push backstop (DN-4). Path-filter overlaps M.5a candidate (c) — consider folding | **M.4** | small; or fold into M.5a (c) |
| **M.6** | **P2 channel-audit** (DN-1 deferred): consumer-side eslint configs + `RULES.md` + dep-cruiser under `packages/core/templates/shared/` + `packages/preset-next-15-canonical/`. Headline candidate: `dependency-cruiser → eslint-plugin-boundaries` (BFR check ≥3 alternatives required) | **DEFERRED** — gated on consumer-side stabilization (no fixed date) | new audit umbrella |

**Sequencing edges (Track M):**

```text
M.1 (T20 trap) ──→ M.2 (commit-msg grep gate)
M.3 (DN closure patch) ──── independent ──── start anytime
M.4 (6 bash hook tests) ──→ M.5a (top-3 edit-time) ──→ M.5b (17 pre-commit)
                                              └────→ M.5c (zizmor) — or fold into M.5a (c)
M.6 (P2 audit) ──── DEFERRED ────
```

**Parallel-SAFE (different files, separate worktrees):** M.1 ∥ M.3 ∥ M.4 (different surfaces: `.claude/rules/` ∥ `docs/meta-factory/research-patches/` ∥ `packages/core/hooks/*.test.ts`). Inside M.4 itself, 6 sub-PRs are parallel-safe (different test files per hook) when run in separate worktrees.

**NOT parallel:**
- M.2 needs M.1 first (must cite the codified T20).
- M.5a needs M.4 first (test-first discipline — write the hook's test BEFORE adding the hook).
- M.5b needs M.5a (validate the pattern works at top-3 before scaling to 17).
- M.5a/b/c all serialize on `settings.json` wiring (one maintainer-click per new hook).

**Recommended launch order:** M.1 → M.3 → M.4 (parallel sub-PRs in worktrees) → M.5a → M.5b ‖ M.5c (or fold M.5c into M.5a (c)). M.6 when consumer side stabilizes.

**Rationale for the order:** M.1 + M.3 are zero-cost docs wins (clear the table). M.4 is the highest-yield gap discovered this session (6 load-bearing hooks without tests — exact git.ts pattern from Wave 3). M.5* depends on M.4 because the test-first discipline (project's principle 02 paired-negative-test) requires the hook's test to exist before the hook ships.

## §3 — Dependency edges (why this order)

- **N4a → N4b:** detector fixed (#98) → gate design unblocked.
- **N3 (done) + N6a (done) → N6b:** portable core + coexistence both landed → one-button is last build.
- **N7 gated on DECISION C; N5 follows N7** (know what's unique before giving back).
- **N8 R-phase feeds N0** (the cost/autonomy answer N0 lacked); **N8 A3 overlaps N7** (process-layer dispatch) and **N0 options a/e**.
- **Cost-first invariant:** all R-phases use free channels (DeepWiki/WebSearch/local) per [no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md); paid build only after a free verdict.

## §4 — Recommended launch order (proposal)

1. **Track 0** (commit + 2 decisions) — clears dependencies, ~$0.
2. **1.1 N8 R-phase** ∥ **2.1 N1** — free research, feeds the only deadline.
3. **1.2 N0 decision** by June 15, then **1.3 N8 A-phase** high-ROI items.
4. **3.1 N7** (once DECISION=C) → **3.2 N5** → **3.3 N6b**.
5. **Track I** infra slotted whenever the maintainer chooses; non-blocking.

**Rationale:** N8 R-phase is free, feeds the single hard date (N0), and answers the maintainer's central concern (autonomous + minimal spend) → max value / min risk as the first launch. **Falsified if** the maintainer prioritises the N4b frontier or the staging-trunk infra migration over storm-economy — then Track 1 yields first place.

## §5 — Open maintainer decisions embedded above

1. ~~companion = A / B / C (gates N7) — 0.2~~ → **CLOSED 2026-05-22: C** (see §5.1)
2. ~~promote N0–N8 into `EXECUTION-PLAN.md` — 0.3~~ → **CLOSED 2026-05-22: pointer-promote** (see §5.2)
3. ~~staging-trunk migration: execute or hold — I.1~~ → **DONE 2026-05-22** (#144/#150)
4. first launch: ✅ **N8 R-phase launched + DONE** (#158, autonomous Queue-mode 2026-05-22) — §4 recommendation actioned
5. ~~N0 response: which cost lever + R4 bench go/no-go + offload priority — 1.2~~ → **CLOSED 2026-05-22: defer-build + arm utilisation trigger; R4 NO-GO** (see §5.3)

### §5.1 — Decision record: companion = **C** (closed 2026-05-22)

Maintainer-delegated («Твоё решение», /orchestrator session 2026-05-22). **C = both, on separate layers:** the enforcement substrate stays dependency-free / never coupled (=A posture — AI-agnosticism is the verified moat per N1+N0), while the dev/process layer dogfoods companions (=B posture). This is `build-first-reuse-default` applied per-layer.

- **B rejected for substrate:** coupling the substrate to a companion forfeits AI-agnosticism — the property N0 (June-15 metered storm) proved load-bearing.
- **Pure A rejected as sole posture:** maintaining homegrown orchestrator/reviewer/worktree skills when Superpowers `subagent-driven-development` + `using-git-worktrees` exist is `#parallel-evolution-creep` / `#adoption-shame` ([build-first-reuse-default.md §4](../../.claude/rules/build-first-reuse-default.md)).
- **C is what every artifact already presumes** (N7 shape; task 3.1 `DECISION=C`); it also folds N0 in — process-layer dogfooding ⊇ the storm-migration target.
- **Falsified if** the layers prove inseparable, or AI-agnosticism turns out not to be the moat — neither holds (substrate = `packages/core/principles/*` + `.husky/` + deterministic bash; process = swappable markdown skills; moat verified N1 PR #102 / N0).

**Unblocks:** N7 (task 3.1) and N2's already-completed vocab alignment. The prior memory claim of «decided #103 2026-05-21» was premature — surfaced-not-closed in [research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md §line 95](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md); this §5.1 is the formal closure.

### §5.2 — Decision record: 0.3 promote = **pointer, not duplication** (closed 2026-05-22)

Maintainer-delegated («Твоё решение», /orchestrator 2026-05-22). N0–N8 are promoted into [EXECUTION-PLAN.md](EXECUTION-PLAN.md) **by cross-reference** — a "Post-1.0 growth waves N0–N8" pointer under Phase 9+ naming this `wave-sequencing-plan.md` as ordering-SSOT (incl. §0 status snapshot) and the two research-patches as content-SSOT.

- **Why pointer, not full inline:** inlining N0–N8 as phases would create a *second* sequencing authority inside EXECUTION-PLAN, duplicating this doc → guaranteed drift (`#contradicting-authority-claims` / `#two-prompts-drift`). Doc-authority hierarchy + build-first-reuse (DRY) favour single-source. The pointer makes the waves *active/discoverable from the canonical plan* without copying content.
- **Effect:** EXECUTION-PLAN now references the active growth waves; this doc + patches remain the live trackers (each keeps its `Authoritative-for` header).
- **Falsified if** the maintainer wants N0–N8 *inlined* as full phases and this doc retired into one tracker — a larger restructure not implied by 0.3; redirect and I'll inline instead.

### §5.3 — Decision record: N0 response = **defer-build + arm utilisation trigger** (closed 2026-05-22)

Maintainer-delegated (/orchestrator «N0 decision, го итеративно и автономно», 2026-05-22). The June-15 change is a **meter on the headless/programmatic dispatch layer, not a removal** — `claude -p` stays supported (verified, [niche-roadmap, Wave N0 section](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md)). N0 resolves the three [findings §7](research-patches/2026-05-22-n8-rphase-findings.md) decisions D1/D2/D3.

**D1 — cost lever → defer ALL options + arm a trigger (no optimisation build now; Option A was *not* selected — the verdict is status-quo until the trigger fires, then jump to Option B).**
- The enforcement substrate never touched `claude -p` and is weatherproof by [no-paid-llm-in-ci](../../.claude/rules/no-paid-llm-in-ci.md) — load-bearing fact, not at risk.
- At the current ~10 sessions/month load the metered spend is negligible *even fully unoptimised* (findings §3: ≈$13.50/mo → ~6.8% of a $200 credit; the 50-session scaling ceiling is ≈$67.50/mo → ~34% unoptimised, dropping to ≈$33–40 → ~17–20% only *after* the Option-B levers are applied). Building Option B's routing classifier or Option C's local dispatcher now is premature-BUILD for a cost problem that does not yet bind (`#own-stack-blind-spot` / [build-first-reuse-default §4](../../.claude/rules/build-first-reuse-default.md)). Note the findings' own irony flag: the routing classifier itself burns tokens.
- The one cheap ADOPT — prompt caching via SDK `cache_control` (the prompt-caching row proposed in findings §7; renumbers to **#66+** per the §0 SSOT-ID collision note, not yet landed) — is **folded into any future programmatic-dispatcher work, not built standalone**: interactive Claude Code already caches automatically, so there is nothing to "adopt" until a headless/SDK path exists.
- **Armed trigger (revisit → execute Option B = caching + batch + Haiku routing):** Agent-SDK credit utilisation > ~50% of plan in any month, **OR** the maintainer commits to unattended headless loops (`claude -p` cron / GitHub Actions). Until then: pay-the-meter-as-billed, monitor utilisation.

**D2 — R4 local-model bench → NO-GO now (REFERENCE-only).**
- Local-model dispatch stays the findings §7 local-model row (REFERENCE → conditional-BUILD; renumbers to #66+ per the §0 collision note). Capability floor is INCONCLUSIVE — arXiv 2604.02367 front-door routing (0.793 acc) is an *adjacent* problem class, not our session-loop dispatch (`#pattern-matching-on-name`, [ai-laziness-traps §2 T16](../../.claude/rules/ai-laziness-traps.md)). A 2–3-week bench for a problem that does not bind at current scale is not justified.
- Gate the bench on the **same trigger** as D1's escalation to Option C.

**D3 — R1 offload migration priority → decoupled from N0 (→ N8 A-phase).**
- This is N8 A-phase sequencing, already maintainer-gated in §0; not an N0 blocker. The N0 cost-urgency answer is "defer", but the *correctness* value of deterministic offload is independent of billing. Recommended A-phase order by correctness ROI (not cost): **C1** (SSOT existence check — strengthens the substrate regardless of the meter) first, then C2, C4, C3, C5 per findings §7 D3.

**Open factual question (does not change the verdict):** whether inline `Agent`/Task-tool subagents spawned *inside* an interactive `claude` session bill against the interactive pool or the metered credit is **officially undefined**. Checked this closing /orchestrator session (2026-05-22) via `claude-code-guide` against the Anthropic help-center article ([support.claude.com/.../15036540](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)): the article draws the billing line at the *entry point* (interactive terminal/IDE explicitly stays on the subscription; SDK / `-p` / Actions metered) and is **silent on the interactive→subagent hybrid** — a documented gap, not a confirmed rule; the only public read (third-party) leans "likely SDK-billed, unconfirmed". This is the broader billing-change verification (niche-roadmap §N0 Task 0, 2-channel) extended to the hybrid sub-case, which that prior check did not cover. If it resolves to "interactive subagents ARE metered" the urgency rises — but the armed utilisation trigger already catches that, so the verdict is robust either way.

**Falsified if:** the maintainer wants an unattended `claude -p` / Actions autonomous loop *now* (→ jump straight to Option B, don't wait for the trigger); or session rate jumps to 50+/month before June 15 (trigger fires immediately). Neither holds at 2026-05-22.

**§1.7 forward-check:** complies with [no-paid-llm-in-ci](../../.claude/rules/no-paid-llm-in-ci.md) (zero CI-side paid calls; substrate untouched), [build-first-reuse-default](../../.claude/rules/build-first-reuse-default.md) (defers BUILD of dispatcher/router/local-model until evidence justifies; ADOPT caching folded into future work), [reviewer-discipline §2](../../.claude/rules/reviewer-discipline.md) (maintainer-delegated; records the delegated call, does not self-initiate strategy). No new rule introduced → no backward sweep required.

### §5.4 — Decision record: channel-audit §10 DN's + mutation-hardening follow-up queue (closed 2026-05-23)

Maintainer-confirmed (/orchestrator 2026-05-23, after PR #181 + #183 merged). Two umbrella'и shipped in the same session — **channel-earliness audit** (PR #181, squash `f50fc3b`, the retroactive sweep `rule-enforcement-channel-selection.md §6` deferred) + **Stryker mutation hardening** (PR #183, squash `2cfec37`, 4 SDD-волны across eslint-rules / hooks/checks / hooks/utils / audit-self) — and the open items reduced to the ordered Track M queue (see §2).

**Channel-audit §10 DN decisions:**

- **DN-1 — scope:** P1 only (this audit covered the framework's OWN 55 checks). P2 (shipped consumer-side config — eslint / `RULES.md` / dep-cruiser under `templates/` + `preset-next-15-canonical/`) — separate audit umbrella, **planned but deferred** to Track M.6; gated on consumer-side stabilization (no fixed date).
- **DN-2 — 20 ADD-DUAL-CHANNEL candidates split by per-edit cost:** **top-3** at edit-time (manifest render-drift, research-patch §1.7-substance, actionlint per-yml — high match frequency, ~84–244ms cost justified) + **17 at pre-commit** (not deferred — fires per-commit not per-edit, ~10× cheaper while still earlier than CI). Maintainer override of original «defer 17» on grounds that **measured** per-edit cost (15–244ms per hook × 20 = 400ms-1s/edit if all edit-time — Claude Code runs PostToolUse hooks sequentially, not parallel) makes top-3 vs all-20 a real trade-off that the pre-commit middle ground resolves. → Track M.5a + M.5b.
- **DN-3 — recurring sweep:** iterative **delta-sweep** on new checks (re-run when ≥5 new checks added OR a channel-mismatch incident fires; not on a schedule). Maintainer override of original «one-shot» lean on grounds that the 20 ADD candidates *are* yield (iteration has measurable value), not noise — but only on the *delta*, not full re-run.
- **DN-4 — per-file zizmor edit-time companion:** **ADD** + KEEP full-dir pre-push backstop. Maintainer invoked [feedback_no_human_verification_ai_self_verifies] — earlier-is-always-better principle; partial-check theatre risk muted by keeping the late gate (this is the standard ADD-DUAL-CHANNEL pattern from the audit itself). → Track M.5c (potentially fold into M.5a candidate (c) — path-filter overlap).

**Mutation-hardening pattern codification (triggers Track M.1 + M.2):**

Cold Reviewer caught Worker over-eager «equivalent» dismissals in 3 of 4 waves (Wave 1 L47 DFS guard / Wave 2 L148 regex anchor / Wave 4 L306 mtime comparison + L161 execSync). Each had a real killing input (sparse-array `[, 1]`; trailer no-leading-space + internal-space at boundary; `fs.utimesSync(p, t, t)` for exactly-equal mtimes; tightened message assertion). Meets [ai-laziness-traps.md §5](../../.claude/rules/ai-laziness-traps.md) promotion threshold («2+ wave-specific T-additions describe same failure mode → abstract into §2»). Wave 3 (where the Worker had absorbed the lesson) was the only first-try-GO — the lesson is real, generalizes, codifies cleanly.

**Empirically grounded bash-hook coverage gap (triggers Track M.4):**

Post-PR-#183 audit on `origin/staging` (2026-05-23): **9 bash hooks** total under `.claude/hooks/`, **3 with dedicated test files** (`check-hook-marker`, `check-kickoff-traps`, `inject-matching-rule`), **6 without** (`ask-question-reminder`, `check-doc-authority`, `deps-hash-check`, `end-of-turn-reminder`, `inject-session-bootstrap`, `validate-prompt`). Same latent-theatre pattern as Wave 3 `git.ts` (load-bearing utility under all pre-push checks, had 0 tests until Wave 3 created `git.test.ts`). The 6 untested hooks include `check-doc-authority` (the project's flagship edit-time gate per the README invariant) — testing it is high-priority.

**Falsified if:** measured per-edit cost numbers prove off when 20+ hooks land (re-measure, bump match-frequency bar before promoting more to edit-time); OR DN-4 per-file zizmor adds noticeable noise to AI sessions (demote to pre-commit); OR the bash-hook test gap turns out to be covered by indirect integration tests already in place (verify before duplicating work).

**§1.7 forward-check:** Track M complies with [no-paid-llm-in-ci](../../.claude/rules/no-paid-llm-in-ci.md) (queue is fully deterministic — bash hooks, markdown trap entries, grep gates), [build-first-reuse-default](../../.claude/rules/build-first-reuse-default.md) (M.5* reuses existing PostToolUse hook pattern + `render-rules.ts` engine — no new dependency; T20 codification reuses ai-laziness-traps catalogue, no new mechanism), [reviewer-discipline §2](../../.claude/rules/reviewer-discipline.md) (maintainer-delegated decisions recorded, not self-initiated strategy). No new rule introduced by this decision record itself → no backward sweep required; M.1 introduces T20 (covered by ai-laziness-traps §5 promotion process).

## §6 — Parallelism + dependency matrix (orchestrator-facing)

### Dependency edges (`X → Y` = Y cannot start until X done)
```text
N4a (done, #98) ──────────────→ N4b (recommendation gate)
N3 (done) + N6a (done) ───────→ N6b (one-button install)
DECISION=C (0.2) ─────────────→ N7 (dogfood) ──→ N5 (give-back)
N8 R-phase (1.1) ─────────────→ N0 decision (1.2)
                └─→ D1·D2·D3 (findings §7) ──→ N8 A-phase (1.3)
N8 A3 (hybrid dispatch) ⇄ N7   (overlap — coordinate, don't double-build)
```

### Parallel-SAFE (run concurrently — independent surfaces, separate output files)
| Group | Items | Condition |
|---|---|---|
| **G1 — research** | 1.1 N8 R-phase ∥ 2.1 N1 ∥ 2.2 N4b design | each writes its **own** research-patch file; all free (DeepWiki/WebSearch/local) |
| **G2 — maintainer decisions** | ~~0.2 companion A/B/C~~ (CLOSED=C), 0.3 promote→EXECUTION-PLAN, I.1 staging-trunk go/hold | not orchestrator work; happen async, parallel to anything |

**Hard precondition for ANY parallel AI sessions:** each runs in its **own `git worktree`** (per [parallel-subwave-isolation.md](../../.claude/rules/parallel-subwave-isolation.md) — shared dir caused branch contamination in Wave 8.1) + `node_modules` symlink in the worktree (tsx hooks fail otherwise). If worktree-add fails → **sequential fallback**, never concurrent shared-dir.

### NOT parallel — serialize or partition file scopes
| Conflict | Items | Why | Mitigation |
|---|---|---|---|
| **Shared SSOT** | N1 + N8 both may append `prior-art-evaluations.md` | append-only register; concurrent appends collide | serialize the SSOT-append step, or one session owns it |
| **Shared tracker** | 0.3 promote + any wave editing `EXECUTION-PLAN.md` | same file | do 0.3 first, alone |
| **A-phase code** | 1.3 N8 A + 3.1 N7 both touch `.claude/hooks/` + `packages/core/` | same surfaces | partition file scopes up front, or serial |
| **Infra (solo)** | I.1 staging-trunk migration | rewrites branch-protection / workflows / `git-safety.sh` | **must run solo** — never concurrent with auto-merge waves |

### Plain-language rule of thumb
- **Research/design = parallel-safe** (different docs) → fan-out in worktrees.
- **Anything writing the SAME canonical file** (SSOT, EXECUTION-PLAN, hooks) = serial or partitioned.
- **Infra that changes git/CI config = solo.**
- **Decisions block their dependents** — 0.2 (companion) CLOSED=C → N7 unblocked; finish 1.1 (N8 R) before 1.2/1.3.

## §7 — Orchestrator entry point (does it know the next action?)

**Knows the ORDER + DEPENDENCIES:** yes — §2/§4/§6 of this doc. An orchestrator session reading `wave-sequencing-plan.md` has the full map.

**Has a turnkey NEXT-ACTION queued:** **no — not yet.** None of N0–N8 has a written kickoff. Kickoffs live in `.claude/orchestrator-prompts/<wave>/kickoff.md` (gitignored, ephemeral — authored at launch, not stored durably).

**So the orchestrator's literal next step at launch:**
1. Maintainer picks the first wave (recommended: N8 R-phase, §4).
2. Orchestrator authors that wave's kickoff **from this plan + the wave's research-patch** (cite [ai-laziness-traps.md §2](../../.claude/rules/ai-laziness-traps.md) T-enumeration per kickoff obligation).
3. If fanning out G1 in parallel → worktree-per-session + file-scope partition (§6).
4. Dispatch; workers self-verify; orchestrator accepts on evidence.

**Bottleneck to flag:** the durable plan is this doc; the kickoff is written fresh at launch. Until a kickoff exists, the orchestrator cannot dispatch — it can only plan. That kickoff is the one missing turnkey artifact between «plan recorded» and «work running».

## §8 — See also

- [wave-orchestrator-kickoff.md](wave-orchestrator-kickoff.md) — orchestrator's operating instructions to execute this plan (per-wave loop, rails, decisions it must not make).
- [research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md) — N0–N7 content + §5 sequencing (this doc extends it with N8 + dates + infra).
- [research-patches/2026-05-22-deterministic-offload-autonomy-economy.md](research-patches/2026-05-22-deterministic-offload-autonomy-economy.md) — N8 content.
- [automerge-staging-plan.md](automerge-staging-plan.md) — infra track I.1 detail.
- [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — cost-first invariant on every R-phase.
- [.claude/rules/reviewer-discipline.md](../../.claude/rules/reviewer-discipline.md) — admission/order = maintainer call; this doc proposes, does not decide.
