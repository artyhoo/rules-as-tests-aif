<!-- scope:cross-session-kickoff-portability -->
# Cross-session kickoff portability for `/pipeline`

> **Authoritative for:** R-phase research on why a `/pipeline` kickoff authored in one
> session/container is invisible to `/pipeline` run on another machine/container, the
> build-vs-reuse survey, and the recommended verdict (ADAPT → option 1).
> Folder-level authority inherited from [research-patches/](./) per
> [doc-authority-hierarchy.md §5](../../../.claude/rules/doc-authority-hierarchy.md).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
> I-phase implementation — separate commit, gated on the **maintainer-owned** authorization in §8.
> **Not implementation.** Research + per-candidate verdict + recommendation + I-phase sketch only.

**Date:** 2026-06-14
**Origin:** `universalization-fix` umbrella — its kickoff, authored outside the orchestrating
checkout, surfaced that a kickoff "doesn't exist" for anyone but its author. Successor question
to J5 ([2026-05-31-j5-orchestrator-prompts-hydration.md §3.1](2026-05-31-j5-orchestrator-prompts-hydration.md)),
which deferred git-tracking of kickoffs as **maintainer-owned** with a re-evaluation trigger.
**Method note:** every claim below about what the tooling does was produced by *running the helper*,
not grepping it (domain trap T-PORT-A; the authoring brief itself shipped two grep-theorised errors).

---

## §1 Problem — verified by running, not reading

`/pipeline` discovery is **kickoff-first**: [`priority-score.sh:139-147`](../../../.claude/skills/pipeline/helpers/priority-score.sh)
iterates `for dir in .claude/orchestrator-prompts/*/`, and for each dir emits `kickoff=exists`
only if `[[ -f "${dir}kickoff.md" ]]` resolves. A dir with no resolvable `kickoff.md` → `kickoff=missing`
→ never becomes a candidate.

Kickoffs are gitignored by deliberate convention — [`.gitignore:7-14`](../../../.gitignore):

```gitignore
.claude/orchestrator-prompts/*
!.claude/orchestrator-prompts/README.md
!.claude/orchestrator-prompts/*/
.claude/orchestrator-prompts/*/*
!.claude/orchestrator-prompts/*/done.md
```

Effect: only the umbrella **skeleton dir** + `README.md` + `*/done.md` are tracked; `*/kickoff.md`
and all in-flight state are gitignored. Confirmed: `git ls-files .claude/orchestrator-prompts/ | grep -c kickoff.md` → **0**.

On the **authoring host**, kickoffs are symlinks into a per-machine canonical store
([`link-coordination.sh:65`](../../../scripts/link-coordination.sh) →
`CANON="${CLAUDE_COORDINATION_DIR:-$HOME/.claude-coordination/rules-as-tests-aif}"`). Live `ls`:

```text
.../ai-doc-audit/kickoff.md -> /Users/art/.claude-coordination/rules-as-tests-aif/ai-doc-audit/kickoff.md
```

### §1.1 The asymmetry — measured on both sides

| Context | `kickoff=exists` | `kickoff=missing` | `kickoff=synthetic` |
|---|---|---|---|
| Authoring host (`/Users/art`, CANON hydrated) | **140** | 26 | (synthetic stream) |
| Fresh `git archive HEAD` checkout + empty CANON (= a teammate's `git clone` on machine B) | **0** | **68** | 31 |

Commands that produced the table (run this turn):
- Host: `bash priority-score.sh | grep -oE 'kickoff=(exists\|missing)' | sort | uniq -c` → `140 exists / 26 missing`.
- Machine B: `git archive HEAD | tar -x -C /tmp/B`; `CLAUDE_COORDINATION_DIR=/tmp/empty REPO_ROOT=/tmp/B bash priority-score.sh` → `0 exists / 68 missing / 31 synthetic`.

The **68** dirs that exist on machine B are *exactly* the umbrellas with a committed `done.md` (every
materialized dir contained only `done.md` — verified). i.e. machine B can see **only already-closed
umbrellas**, and even those carry **no kickoff body**. An in-flight umbrella authored on A (CANON
file, no `done.md` yet) gets **no directory at all** on B → 100 % invisible.

> The authoring brief's §1.1 predicted "almost all `kickoff=missing`". That holds **on a fresh container**,
> not on the persistent host (140 exist). The prediction was machine-dependent; the asymmetry *is* the bug.

### §1.2 Root cause — a lifecycle misclassification, not a discovery bug

Kickoff authoring assumes **co-location**: the session that writes the kickoff is the same persistent
machine that later runs `/pipeline`. The kickoff travels by neither channel that crosses a machine
boundary — it is **gitignored** (so git skips it) and the coordination store is **per-machine**
(`$HOME/.claude-coordination/` on the host, `/root/.claude-coordination/` in a container). On machine B,
`find` returns nothing → `kickoff=missing` → not a candidate.

**History — it never worked via git; it worked because there was one persistent workspace.**
Verified across all branches: `git log --all --oneline -- '.claude/orchestrator-prompts/*/kickoff.md'`
→ **0 commits — `kickoff.md` was never tracked.** The very first `.gitignore`
(`5e78003 chore: add .gitignore (node_modules, orchestrator-prompts, logs)`) already ignored
`orchestrator-prompts` — grouped **with `node_modules` and `logs`**. So the kickoff was classified as
*regenerable scratch* from day one. "It worked before" because a single persistent root checkout meant
`find` always saw the on-disk files. It broke when the workflow moved to **ephemeral workspaces** —
parallel worktrees ([parallel-subwave-isolation.md](../../../.claude/rules/parallel-subwave-isolation.md))
and deletable aif containers — while a *non-regenerable, authored* artifact was still stored only there.

**The precise bug: lifecycle misclassification.** A kickoff is an authored design doc (a *source*), not a
derived artifact. The "can it be regenerated from a durable source?" test (the standard worktree/container
rule — node_modules ⇒ yes ⇒ per-workspace; an authored doc ⇒ no ⇒ durable home) puts the kickoff on the
durable side, yet `.gitignore` files it with `node_modules`/`logs`. The coordination-store + symlinks
(#110) made a *per-machine* durable home — still ephemeral relative to a container or a teammate. The fix
is to reclassify the kickoff as durable and give it a home that survives workspace deletion **and** crosses
machines: git. (Best-practice grounding: [GitWorktree best practices](https://www.gitworktree.org/guides/best-practices),
K8s ephemeral-vs-PersistentVolume — durable state lives outside the disposable unit, which hydrates *from* it.)

### §1.3 What already exists (do **not** rebuild)

- **Inverse file→plan detector**: [`plan-currency-check.sh:155-165`](../../../.claude/skills/pipeline/helpers/plan-currency-check.sh)
  does `find … -name kickoff.md` → `UNTRACKED-KICKOFF: <name> has kickoff.md but not in §0`. It shares the
  same locality limit (`find` only sees this machine), so it is *not* part of the fix — it is a currency
  signal, not a portability mechanism.
- **Plan-stub from `ls`**: [`SKILL.md:100`](../../../.claude/skills/pipeline/SKILL.md) writes a `wave-sequencing-plan.md`
  stub from `ls .claude/orchestrator-prompts/`. Auto-*writing the plan* was REJECTED (Direction A, R-phase β-2,
  [`SKILL.md:216`](../../../.claude/skills/pipeline/SKILL.md)) — the fix must not resurrect that.

---

## §2 Prior-art consulted (build-vs-reuse — [BFR §3 six-layer](../../../.claude/rules/build-first-reuse-default.md))

### §2.1 In-repo

- **#346 / SSOT #110 — coordination-persistence-fix** ([done.md](../../../.claude/orchestrator-prompts/coordination-persistence-fix/done.md),
  [SSOT #110](../prior-art-evaluations.md)). **T16 problem-class check (ran it):** #110 is "live sync of a
  gitignored coordination dir across **N local worktrees of one repository**" — its own R-phase
  ([2026-05-17 §1](2026-05-17-cross-worktree-coord-doc-sync.md)) states this explicitly and distinguishes it
  from creation-time bootstrap. CANON is `$HOME/.claude-coordination/` — **per-machine**. **Match? No** — it
  closes the cross-*worktree* gap on one machine; it does **not** cross machines/containers. The symlink
  mechanism is therefore necessary infra for *local* sharing but structurally cannot make a kickoff portable.
- **J5 — orchestrator-prompts hydration** ([2026-05-31 §3.1](2026-05-31-j5-orchestrator-prompts-hydration.md)).
  Already named the fix and **deferred it**: *"Deferred alternative: git-tracking of kickoffs (maintainer-owned)…
  NOT built now… Re-evaluation trigger fires if the maintainer starts authoring umbrellas inside [non-primary
  contexts] and needs kickoff content shared… YAGNI until that flow changes."* **The trigger has fired** — broader
  than scoped (cross-container/teammate, not just cross-worktree). This patch is that re-evaluation.
- **`done.md` as proof-of-concept**: `done.md` is *already* committed-in-place (gitignore negates `*/done.md`),
  is a **real per-worktree file never symlinked** (`link-coordination.sh:116,185` skip it), and travelled to
  machine B **68/68**. It is option 1, in the same directory, in production, working.

### §2.2 External (DeepWiki + WebSearch ≥3 phrasings — context7 excluded per BFR §3 caveat)

| Source | Finding | Relevance |
|---|---|---|
| **Cline Memory Bank** (`cline/cline`, DeepWiki) — already SSOT #77 | `memory-bank/` markdown is **"designed to be committed to git… travels with the repository"** across machines/team; global config goes to `~/.cline/`. | Direct analog: durable AI coordination markdown is **committed**, ephemeral runtime is local. |
| **claude-task-master** (`eyaltoledano/claude-task-master`, DeepWiki) | `.taskmaster/tasks/` **git-tracked by default** (`--git-tasks`, opt-out `--no-git-tasks`); runtime artifacts/logs live in global `~/.taskmaster/` (gitignored). Cross-machine sharing = the git repo (Solo) or cloud (Team). | The exact **committed-source + local-runtime split** — validates that the *task definition* is the committed half. |
| WebSearch ("AI agent task state across machines committed vs gitignored"; "task master tasks committed portable"; "multi-agent plan files git-tracked discoverable") | Ecosystem converges on **git as the portability channel**: tick-md (git-tracked markdown, every change a commit), Beads (git-backed version-controlled issue DB), Sortie (SQLite + tracker tickets for cross-session resume). | No tool keeps cross-machine task state in a *per-machine gitignored* store; the production pattern is commit-to-repo (or a backend service). |

**Negative-existence check (6-item):** no surveyed tool ships "make a per-machine gitignored orchestrator
kickoff discoverable on another machine *without* committing it or standing up a backend." The portability is
always either git-tracking or a service. → no BUILD of a novel sync mechanism is warranted; the answer is to
**use git**, which we already own.

---

## §3 Options evaluated

| # | Direction | Pro | Con | Effort |
|---|---|---|---|---|
| **1** | **Commit `kickoff.md` in place** (negate `*/kickoff.md` in `.gitignore`, kickoff becomes a real committed design doc, `link-coordination.sh` skips it like `done.md`, add 600-line-gate exemption) | Single committed SSOT → **zero drift**; fixes cross-worktree **and** cross-machine in one; **`done.md` already proves this exact pattern works** (68/68); externally validated (Cline, Task Master). | Overturns a deliberate convention (maintainer-owned, §8); one-time migration of 140 host symlinks → real files; 3/140 trip the 600-line gate; kickoff bodies enter git history. | **S–M** (1 gitignore line + helper skip + gate exemption + migration script) |
| **2** | **Committed source + rehydrate** (commit a tracked sibling, keep runtime symlink, rehydrate `kickoff.md` on checkout — the Task Master split) | Leaves the symlink runtime untouched; durable source committed. | **Two copies → drift**; needs `@dual-pair` binding + a rehydrate hook + discovery taught to recognize the sibling. More machinery for the same outcome; the split only pays off when runtime ≠ source (it isn't, for a kickoff). | **M** |
| **3** | **Git-backed coordination store** (make `$CANON` a synced/committed channel) | Portable by construction for *all* coordination files. | Heavy cross-machine sync infra (orphan branch / synced dir); solves far more than the stated problem; `#integration-overhead`. | **L** |
| **4** | **Reconstruct-on-absence** (when `kickoff=missing` but a committed plan row + `done.md` exist, reconstruct a minimal stub) | Cheap; uses only committed data. | **Lossy** (plan row ≠ kickoff body); cannot surface an umbrella with **no plan row yet** — which is the actual `universalization-fix` case. Resurrects the rejected "synthesize plan" smell (§1.3). | **S** |
| **5** | **Document the constraint** (author must co-locate / explicitly commit) | Zero code. | Leaves the recurring drift that **already bit twice**; relies on memory, the exact thing the goal forbids ([README absolutism](../../../README.md#why-this-exists)). | **XS** |

---

## §4 VERDICT — **ADAPT → option 1** (commit `kickoff.md` in place)

**ADAPT, not BUILD:** the mechanism is reused wholesale — the `done.md` tracked-exception pattern
(`.gitignore` negation + `link-coordination.sh` skip-list) extended to one more filename, plus the
`transient artifact` gate-exemption pattern EXECUTION-PLAN.md already uses. **Net-new code ≈ one gitignore
line, two `link-coordination.sh` skip guards, one pre-commit exemption case, and a one-time migration script.**
No new dependency, no standing infra, no backend → not even a capability commit by the
[CLAUDE.md gate](../../../CLAUDE.md).

**Why option 1 over option 2 (the only serious rival):** `done.md` *is* option 1 in the same directory and
provably travels (68/68); a kickoff has no runtime artifact distinct from the document you read, so the Task
Master "committed source + local runtime" split would create a second copy whose only product is drift. Option
1 also *removes* kickoff from `link-coordination.sh`'s responsibility (git propagates it to every worktree),
shrinking the surface #110 maintains.

**Build-vs-reuse rationale:** default is ADOPT/REFERENCE ([BFR §1](../../../.claude/rules/build-first-reuse-default.md));
the portability channel (git) is owned, and the durable-state-is-committed pattern is externally validated
(Cline SSOT #77, Task Master). The deferred-since-J5 reason ("YAGNI until the flow changes") no longer holds:
the flow changed (cross-container + teammate authoring).

**Bounding history churn (addresses option 1's main con):** commit `kickoff.md` at **authoring** (and at
deliberate revisions), and keep **in-flight state churn in `state.md`** (stays gitignored/symlinked). Kickoffs
are stable design docs post-authoring — peers of research-patches, which are already committed. The
discoverability property the goal wants is *existence + body on machine B*, which a single authoring-time
commit delivers.

**Falsification (what would make this wrong):**
- If committing kickoffs measurably bloats clone/CI time → revisit (a `done.md`-style one-liner per kickoff
  instead of the body would still beat invisibility). *Check:* it does not today — 140 markdown design docs ≈
  the research-patch corpus already carried.
- If the maintainer's true flow is single-machine only and "teammate B / container B" never recurs → option 5
  suffices. *Check:* `universalization-fix` is the second incident; the flow is real.
- If a future backend (aif-handoff task store) becomes the SSOT for umbrellas → this is superseded by ADOPT-backend.

**Complementary, not either-or:** option 4 (reconstruct-on-absence) is worth keeping as a **degraded fallback**
for *legacy* umbrellas whose kickoffs predate the convention and were never committed — but it is a safety net,
not the fix.

### §4.1 Two maintainer concerns — resolved by evidence (2026-06-14 dialogue)

1. **"Does committing leak our internal kickoffs to consumers via `install.sh`?"** — **No.**
   `grep -n 'orchestrator-prompts' install.sh` → **no match**: the installer copies only skills, hooks,
   agents, and templates ([install.sh:407-415](../../../install.sh)) — never `orchestrator-prompts`. It also
   ships **no `.gitignore` fragment** (grep empty), so a consumer's gitignore is untouched. We commit *our*
   kickoffs to *our* repo; a consumer using `/pipeline` would commit *their* kickoffs to *their* repo — their
   call. **Consumers are out of scope** for this change.
2. **"The repo is public — does this expose internal AI work?"** — Already exposed; kickoffs add nothing new
   in kind. `gh repo view` → `visibility: PUBLIC`, and the tracked tree already carries **153 research-patches
   + 26 retros + 68 done.md + wave-plan/open-questions/EXECUTION-PLAN** — the same category of internal
   orchestration work, and a research-patch is *more* revealing than a task brief. Public self-documentation
   is the project's thesis (recursive self-application).
   **Guard (one-time, irreversible):** scan the 140-kickoff back-catalog for secrets / private data **before**
   the first `git add` — low risk (briefs, not credential stores) but mandatory on a public repo (§7 D2.5).

### §4.2 Verdict status — **maintainer-authorized 2026-06-14**

The J5 §3.1 maintainer-owned gate (§8) is **resolved: maintainer approved option 1 (repo)** in the
2026-06-14 dialogue, conditional on (a) it actually solving the problem (verified — §1.1 + the D1 acceptance)
and (b) the two §4.1 concerns (resolved). Direction confirmed; I-phase (§7) may proceed when dispatched.

---

## §5 Proposed SSOT entry (to be appended at I-phase, in the capability/enabling commit)

> Drafted here; **not** written to `prior-art-evaluations.md` in this R-phase (append-only register is owned by
> the capability-commit author per [§3](../prior-art-evaluations.md)). Distinct from #110 (cross-*worktree*).

```text
| 116 | Cross-MACHINE kickoff portability via git-tracking the kickoff design doc — upstream evidence:
Cline Memory Bank (committed memory-bank/ markdown "travels with the repository", SSOT #77) +
claude-task-master (.taskmaster/tasks/ git-tracked by default --git-tasks; runtime in global ~/.taskmaster/).
| Make /pipeline kickoffs discoverable on any machine/container by committing kickoff.md at its existing path
(negate *.gitignore like done.md); link-coordination.sh skips it; state churn stays in gitignored state.md.
| 2026-06-14 | 2026-06-14 | ADAPT | ADAPT not BUILD: reuses the done.md tracked-exception + transient-gate-
exemption patterns; git is the owned portability channel. T16 vs #110: #110 = cross-worktree-on-one-machine
(per-machine $CANON); this = cross-machine (git). Different problem-class, no overlap. Externally validated:
durable AI coordination state is committed (Cline, Task Master); per-machine gitignored stores never cross
machines. | Upstream aif-handoff task store becomes umbrella SSOT → flip to ADOPT-backend; OR clone/CI cost
of committed kickoff bodies measurably regresses → narrow to committed done.md-style stubs. |
```

---

## §6 §1.7 self-reflection

### Forward-check applied
- **Build-vs-reuse SSOT** — load-bearing patterns are registered: Cline (#77), #110 (distinguished, not duplicated);
  new entry #116 drafted (§5) for the I-phase commit. ✓
- **No-paid-LLM-in-CI** ([rule](../../../.claude/rules/no-paid-llm-in-ci.md)) — option 1 is pure git + bash,
  deterministic; no metered gate. ✓
- **Search-coverage 6-item** ([phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md)) —
  DeepWiki ×2 repos + WebSearch ×3 phrasings + SSOT consult + in-repo prior-art (#110, J5, done.md) on the
  "no portable mechanism exists without committing" negative claim. ✓
- **`done.md` load-bearing semantics** (priority-score Layer C3) — option 1 **adds** a tracked exception, does
  not touch `done.md`; C3 detection unaffected. ✓
- **Doc-authority** — this file carries a scope marker + folder-inherited header (§5 of doc-authority rule). ✓
- **Recommendation discipline / T20** — every verdict-bearing claim is backed by a tool call in-session
  (priority-score run, `git archive` machine-B demo, DeepWiki, WebSearch, file:line reads). ✓

### Backward-check applied
- **Complete sweep of the new rule's scope** (`.claude/orchestrator-prompts/*/kickoff.md`): 140 present on host;
  **3** exceed the 600-line gate (`queue-mode-bootstrap` 726, `strategic-clarity-dialogue` 660,
  `aif-handoff-runtime-bridge-iphase` 649) — these need the exemption marker at I-phase. 0 dangling symlinks.
- **Exemption mechanism** — explicit: the `transient artifact` first-20-lines marker, mirroring
  `pre-commit:50-62` for EXECUTION-PLAN.md; applied to oversized kickoffs (or split them).
- **Exemption meta-test** — the I-phase acceptance T4 (§7) is the positive+negative pair: an oversized kickoff
  *with* the marker commits; *without* it the gate fails.

### Self-application (T15)
The fix makes discoverability a property of the **committed tree**, not of any session's memory — exactly the
goal's "fail at the earliest reachable channel, not rely on memory." The research itself was forced through
T-PORT-A: every tooling claim was *run* (the brief's two grep-theorised errors are why).

---

## §7 I-phase kickoff sketch — each deliverable = an executable acceptance

> §8 **authorized 2026-06-14** — ready to dispatch. Single-stage I-phase, ~S–M.

- **D1 — gitignore + helper skip.** Negate `!.claude/orchestrator-prompts/*/kickoff.md`; add `kickoff.md` to the
  `link-coordination.sh` skip-list (next to `done.md`, lines 116/185).
  **Acceptance (executable):** in a fresh `git archive HEAD` checkout B with an **empty** `CLAUDE_COORDINATION_DIR`,
  `priority-score.sh` reports `kickoff=exists` for an umbrella authored & committed in checkout A.
  *Today this is 0; the test asserts ≥1.* (Reuse the §1.1 `git archive` harness as the test body.)
- **D2 — migration script.** Dereference the 140 host symlinks to real files (idempotent; `cat $target > tmp && mv`),
  so `git add` stages content, never an absolute-path symlink.
  **Acceptance:** post-migration, `git ls-files .claude/orchestrator-prompts/ | grep -c kickoff.md` > 0 and no
  staged path is a symlink (`git ls-files -s | awk '$1==120000'` empty for kickoffs).
- **D2.5 — back-catalog secret scan (mandatory, public repo, §4.1).** Before the first `git add` of the
  140-kickoff back-catalog, scan for secrets / private data (e.g. `gitleaks detect --no-git` over the staged
  set, or a token/key/PII grep). **Acceptance:** scan over the staged kickoffs reports zero findings (or each
  is triaged + redacted) — the commit is blocked otherwise. Forward-going kickoffs ride the normal pre-commit.
- **D3 — 600-line-gate exemption.** Extend `pre-commit:49-68` to accept a `transient artifact` marker for
  `*/kickoff.md` (or split the 3 oversized ones).
  **Acceptance (paired):** a >600-line kickoff **with** the marker commits; an identical one **without** fails
  the gate (positive+negative roundtrip).
- **D4 — state/kickoff split doc.** One line in `pipeline/SKILL.md` + `link-coordination.sh` header: kickoff =
  committed durable doc; `state.md` + `_plan-cache` = gitignored runtime.
  **Acceptance:** `state.md` remains gitignored (`git check-ignore` returns it); `kickoff.md` does not.
- **D5 — fail-loud enforcement (goal-aligned; the part bare-commit misses).** A kickoff committed only when
  the author *remembers* is still a memory-dependent convention. Add a deterministic check at the earliest
  reachable channel that an **in-flight** umbrella's `kickoff.md` is tracked — e.g. a `.husky/pre-push` step:
  for each `.claude/orchestrator-prompts/*/` whose `kickoff.md` exists on disk but `git ls-files` does not
  list it (and there is no `done.md`), **warn-then-fail** ("kickoff not portable — `git add` it"). Channel per
  [rule-enforcement-channel-selection.md](../../../.claude/rules/rule-enforcement-channel-selection.md);
  warn-only calibration window first (peer to the §1.7 trailer rollout). **Acceptance (paired):** an in-flight
  umbrella with an untracked `kickoff.md` trips the check; the same umbrella once committed passes; a closed
  (`done.md`-only) umbrella never trips. *This is what makes portability a checked property, not a habit
  (README absolutism).*
- **D6 — legacy fallback (optional, option 4 as safety net).** For an umbrella with `kickoff=missing` but a
  committed plan row, `/pipeline` emits a `RECONSTRUCT-STUB:` notice (does **not** auto-write the plan — §1.3).
  **Acceptance:** a missing-kickoff umbrella with a plan row yields the notice; one without stays silent.

---

## §8 DECISION — **RESOLVED 2026-06-14: maintainer authorized option 1 (repo)**

Git-tracking kickoffs was reserved to the maintainer and overturns a deliberate convention (J5 §3.1). In the
2026-06-14 dialogue the maintainer **approved Option A (option 1 — commit to the repo)**, after the two §4.1
concerns were resolved by evidence (install.sh does not ship `orchestrator-prompts`; the public repo already
carries 153 research-patches + 26 retros + 68 done.md of the same category) and the problem-solving claim was
verified (§1.1 + D1 acceptance). Recorded options for the audit trail:

- **Option A → option 1 (CHOSEN):** commit kickoffs in place; kickoffs join `done.md` as tracked design docs;
  portability solved by git everywhere; one-time migration + secret-scan + 3 gate-exemptions + fail-loud check.
- **Option B → option 2:** committed source + rehydrate — standing two-copy drift. *Not chosen.*
- **Option C → option 4 only:** reconstruct-on-absence — partial, lossy. *Kept only as D6 fallback.*
- **Option D → option 5:** document the constraint — drift recurs. *Not chosen.*

Per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) the research session surfaced the
fork with a recommendation (A); the maintainer made the call. **Next:** the §7 I-phase may be dispatched.

## See also
- [2026-05-31-j5-orchestrator-prompts-hydration.md](2026-05-31-j5-orchestrator-prompts-hydration.md) — predecessor; deferred this as maintainer-owned.
- [2026-05-17-cross-worktree-coord-doc-sync.md](2026-05-17-cross-worktree-coord-doc-sync.md) — SSOT #110 origin; cross-worktree (not cross-machine).
- [prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT register; #110 (cross-worktree), #77 (Cline), proposed #116.
- [.claude/skills/pipeline/SKILL.md](../../../.claude/skills/pipeline/SKILL.md) — `/pipeline` discovery surface.
