<!-- scope:universal-satellite-integration-matrix -->
# Universal-satellite integration matrix — delta-refresh (T1≥5 strengthening + cost + amux/Cursor deltas)

> **Status:** R-phase output for `universal-satellite-integration-matrix` umbrella — **delta-refresh** over the prior comprehensive matrix.
> **Date:** 2026-05-30.
> **Authoritative for:** (a) the duplication finding that a comprehensive matrix already shipped 2026-05-27; (b) the three material deltas since: T1≥5 probe-floor strengthening with two evidence corrections, the June-15-2026 Agent SDK credit-pool impact on the autonomous-dispatch cost dimension, and amux as an 8th companion + Cursor agent-hooks update + SSOT #81 citation correction; (c) updated integration-surface delta cells; (d) M-A feed + open DECISION-NEEDED (supersede vs delta-companion).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists); the bulk of the per-companion matrix (R1-R5, §2 surface, §3 conflict, §4 coexistence, §5 injection) — that lives in the **primary input** [`2026-05-27-universal-satellite-integration-matrix.md`](2026-05-27-universal-satellite-integration-matrix.md), which this patch builds on and does NOT duplicate; M-A implementation decisions; substrate edits.

---

## §0 TL;DR

**Duplication finding (load-bearing, surfaced first):** the deliverable this umbrella's kickoff asks for — a 7-companion R1-R5 capability inventory + integration-surface matrix + conflict + coexistence + Living-Doc injection + §1.7 — **already exists on `origin/staging`** as [`2026-05-27-universal-satellite-integration-matrix.md`](2026-05-27-universal-satellite-integration-matrix.md) (509 lines, comprehensive). The umbrella kickoff (`.claude/orchestrator-prompts/universal-satellite-integration-matrix/kickoff.md`) is still marked **`Status: STUB / NOT DISPATCHED`** — it was never updated after the 2026-05-27 patch landed, so this dispatch fired from a stale stub. Per anti-duplication discipline ([ai-laziness-traps.md §2 T18](../../../.claude/rules/ai-laziness-traps.md); memory `feedback_check_inflight_prs_before_building`), this patch is a **delta-refresh** — it does NOT re-derive the 80% that is already correct. The supersede-vs-companion question is surfaced as **DECISION-NEEDED-1** (§8).

**Three material deltas justify the refresh:**

1. **Delta A — T1≥5 probe-floor.** This umbrella's kickoff §4 raises the T1 floor to **≥5 probes/companion**; the 2026-05-27 patch self-admits (its §6) only **2** probes each for OhMyOpencode/TaskMaster/Cline/OpenCode (its floor was 3). §2 below records fresh 2026-05-30 DeepWiki probes bringing every core companion to a documented ≥5 tally, and surfaces **two evidence corrections** the stricter pass found.

2. **Delta B — June-15-2026 Agent SDK credit pool (cost dimension, anti-collusion-verified).** The 2026-05-27 matrix has **no cost axis**. Since then, a policy change (surfaced 2026-05-29 in [`2026-05-29-superpowers-reuse-audit-for-runtime-bridge.md §6`](2026-05-29-superpowers-reuse-audit-for-runtime-bridge.md)) materially changes the coexistence picture for **autonomous-dispatch** companions: `claude -p` (= Agent SDK headless = the transport aif-handoff/amux spawn) draws from a **separate metered monthly credit** on Pro/Max subscription plans starting **June 15, 2026** ($100/mo Max-5x, $200/mo Max-20x; non-rollover; overflow → API rates). **Verified against primary source this session** (WebFetch `code.claude.com/docs/en/headless`, 2026-05-30 — see §3), not relied on as companion-patch hearsay. The Living-Doc *enforcement floor* (git hooks + CI) is **unaffected** (it spawns no `claude -p`); only the autonomous-Worker-dispatch coexistence path carries the cost.

3. **Delta C — amux 8th companion + Cursor agent-hooks update + SSOT #81 fix.** `mixpeek/amux` (2026-05-29) is a new autonomous-dispatch companion not in the 2026-05-27 matrix; §4 adds its capability/integration/conflict rows. Cursor now ships **agent hooks** (cursor.com/docs/agent/hooks, 2026) — contradicting the 2026-05-27 patch's "Cursor = rules-only, no lifecycle hooks" claim; §4 records the correction. SSOT #81's citation correction (`Doriandarko/` → `code-yeongyu/oh-my-openagent`) is re-confirmed.

**No single-companion recommendation is made** (hard constraint). Every companion keeps the same neutral-satellite treatment. The Living-Doc enforcement floor remains harness-agnostic and free across all 8.

---

## §1 What this patch is (and is not)

- **IS:** an additive delta over the 2026-05-27 primary input. It (a) strengthens probe coverage to the umbrella's ≥5 floor, (b) adds a cost axis the original lacked, (c) adds amux + a Cursor correction. It cites the primary input for everything unchanged (the [`2026-05-27-living-doc-neutral-injection.md`](2026-05-27-living-doc-neutral-injection.md) Stage-3 patch is precedent for this "downstream consumer of the 2026-05-27 matrix, not a replacement" shape).
- **IS NOT:** a re-derivation of the full per-companion R1-R5 tables (those are correct in the primary input and unchanged except where §2 flags a correction); a substrate edit; a single-companion pick; an SSOT-row landing (proposals only — append-only register is owned by the SSOT author per [CLAUDE.md Artifact Ownership Contract](../../../CLAUDE.md)).

**Method:** read the four most-relevant existing patches in full (2026-05-27 matrix, 2026-05-27 living-doc-injection, 2026-05-26 mode-triage, 2026-05-29 superpowers-reuse) + the SSOT rows #27-#85; then ran fresh 2026-05-30 DeepWiki probes only where the prior tally was short of ≥5, plus one primary-source WebFetch for anti-collusion on the load-bearing cost claim. No paid LLM (DeepWiki/WebFetch/WebSearch are subscription-bundled or free per [no-paid-llm-in-ci.md §2](../../../.claude/rules/no-paid-llm-in-ci.md)).

---

## §2 Delta A — T1≥5 probe-floor strengthening + evidence corrections

### §2.1 Per-companion probe tally (prior cited + fresh 2026-05-30)

| Companion | Prior probes (cited) | Fresh 2026-05-30 | Total | ≥5? |
|---|---|---|---|---|
| AI-Factory | 2026-05-27 ×3 + npm-pack inspection | 1 (injections[] + skill-context) | ≥5 | ✓ |
| Superpowers | 2026-05-29 ×9 SKILL.md fetches + DeepWiki cross-session; 2026-05-26 ×5; 2026-05-27 ×3 | 0 (already saturated) | ≥17 | ✓ |
| OhMyOpencode | 2026-05-27 ×2 + SSOT #61/#68/#83 research + 2026-05-26 ×1 | 1 (config + hook types + claude_code disable) | ≥5 | ✓ |
| aif-handoff | 2026-05-29 ×9 + 2026-05-27 ×3 + SSOT #27/#28/#29/#30/#43/#44/#45/#46/#67 | 0 (saturated) | ≥12 | ✓ |
| TaskMaster | 2026-05-27 ×2 + 2026-05-26 ×2 + SSOT #73 | 1 (no-husky/no-workflows confirm) | 5 | ✓ |
| Cline | 2026-05-27 ×2 + 2026-05-26 ×1 | 2 (hooks/skills; plan/DAG/review) | 5 | ✓ |
| OpenCode | 2026-05-27 ×2 + WebFetch plugins | 2 (plugin hooks; plan/DAG) | ≥5 | ✓ |
| amux | 2026-05-29 ×4 | 1 (hooks/config/conflict) | 5 | ✓ |
| Cursor (supplementary) | 2026-05-27 ×1 WebFetch + SSOT #13/#62 | 2 WebSearch (rule types; agent hooks) | 4 | below floor — documented §4.2 |

Cursor is the kickoff's "if surfaced" companion and is a rules-/hooks-only surface (no task management); 4 probes is below the ≥5 floor and is **flagged honestly** rather than padded (T14 — "clean audit AND low coverage = coverage-insufficient, not clean"). Its surfaces are simple enough that 4 probes reach saturation, but the floor-miss is recorded, not hidden.

### §2.2 Correction 1 — OpenCode `.claude/skills/` auto-load is NOT code-confirmable

The 2026-05-27 patch §1.7 states OpenCode "auto-loads `.claude/skills/` (priority after `.opencode/skills/`)". Fresh DeepWiki probe (`sst/opencode`, 2026-05-30): **AGENTS.md loading is confirmed in code** (`packages/plugin` reads instruction files from multiple locations); **`.claude/skills/` auto-load could NOT be confirmed from the available code context** — "I cannot confirm the `.claude/skills/` loading behavior from the available context." This does not falsify the 2026-05-27 claim (it may be true via a path not in the indexed snippets) but **downgrades its confidence**: the load-bearing OpenCode injection point is **AGENTS.md** (code-confirmed) + the **`tool.execute.before/after` plugin hooks** (code-confirmed, `packages/plugin/src/index.ts:73-78`), not `.claude/skills/` auto-load (unconfirmed). M-A should not assume `.claude/skills/` reaches OpenCode without an empirical check.

### §2.3 Correction 2 — OhMyOpencode hook types report as CC-convention-aligned

The 2026-05-27 patch describes OhMyOpencode's "5-tier hook system: PreToolUse/PostToolUse/Message/Event/Transform/Params". Fresh DeepWiki probe (`code-yeongyu/oh-my-openagent`, 2026-05-30) reports the hook types as **PreToolUse / PostToolUse / UserPromptSubmit / Stop / SubagentStop / Notification** — "The hook types align with Claude Code's hook conventions" (the implementation maps these onto OpenCode's plugin event system). Net: OhMyOpencode's hook surface is **CC-hook-convention-shaped**, which is *more* favourable for our CC-native hooks than the "Message/Transform/Params" framing implied — but the exact tier names in the 2026-05-27 patch are stale. Config file `oh-my-opencode.jsonc` and the `claude_code` config section (disables `.claude/skills/`+`.claude/agents/`+hooks loading) are both re-confirmed.

### §2.4 Capability cells re-confirmed unchanged (no correction)

Fresh probes re-confirmed, with no change to the 2026-05-27 verdicts: AI-Factory `extension.json injections[]` (target/position/file) + `.ai-factory/skill-context/<skill>/SKILL.md` both current; TaskMaster ships no `.husky/`, no `.github/workflows/` injection (MCP + slash-commands + plugin + `.taskmaster/` + CLAUDE.md `@import` only); Cline hooks (`.clinerules/hooks/`: PreToolUse/PostToolUse/TaskStart/TaskResume/TaskComplete/UserPromptSubmit) are a **separate system** from CC `settings.json` hooks; Cline stores tasks as **JSON/markdown** (not SQLite — a minor correction to the 2026-05-27 "SQLite via ClineCore" cell), uses a **linear focus-chain** (no `blockedBy` DAG), no built-in review; OpenCode has **no** persistent cross-session plan, **no** task DAG, **no** decomposition, **no** skill-recommendation system (session todos are in-memory; sessions persisted as JSON under `Global.Path.data`).

---

## §3 Delta B — June-15-2026 Agent SDK credit pool (cost axis)

### §3.1 Anti-collusion verification (primary source, this session)

The 2026-05-29 superpowers-reuse patch surfaced the finding from companion-side reading. Per the kickoff's anti-collusion requirement, this session **re-verified the load-bearing claim against the primary source**:

> **WebFetch `code.claude.com/docs/en/headless` (2026-05-30), verbatim:** "Starting June 15, 2026, Agent SDK and `claude -p` usage on subscription plans (Pro, Max) will draw from a separate monthly credit pool, distinct from your Claude.ai usage. Once the credit is exhausted, usage is paused until the next cycle unless you have pay-as-you-go billing enabled." + "Usage of the Claude Agent SDK (including `claude -p` headless invocations) on Pro and Max plans is metered separately from interactive Claude Code and Claude.ai usage."

This is the official Anthropic doc (not a companion README's self-description), confirming the claim independently. The dual-channel agreement (2026-05-29 patch + primary doc) is therefore grounded, satisfying the anti-collusion check ([memory `feedback_dual_channel_agreement_not_ground_truth`](../../../README.md) — fetch primary even when channels agree).

### §3.2 Impact on the integration/coexistence matrix (cost cell, per companion)

The cost axis splits the 8 companions cleanly by **whether the satellite's coexistence path spawns `claude -p`**:

| Companion | Spawns `claude -p` for autonomous dispatch? | Post-June-15 cost class | Affects Living-Doc *enforcement* floor? |
|---|---|---|---|
| aif-handoff | YES (CLI transport via `packages/runtime/.../cli.ts`) | subscription-bundled up to monthly Agent-SDK credit, then metered | NO — git hooks/CI fire regardless of harness |
| amux | YES (`subprocess.run("claude")`, OAuth-first) | same credit-pool caveat as aif-handoff | NO |
| AI-Factory / aif-handoff pipeline | runs inside the consumer's own CC/headless session | inherits whichever transport the consumer's session uses | NO |
| Superpowers, OhMyOpencode, Cline, OpenCode, Cursor, TaskMaster | NO — in-session (the human's own interactive subscription) or CLI/MCP only | unaffected (interactive subscription) | NO |

**Load-bearing conclusion:** the credit-pool change touches **only the autonomous cross-session dispatch** coexistence path (the aif-handoff/amux "runtime bridge" use case — itself currently DEFER-all per [`2026-05-29-aif-handoff-bridge-synthesis.md §0`](2026-05-29-aif-handoff-bridge-synthesis.md)). The **universal Living-Doc enforcement floor** — ESLint edit-time, `.husky/pre-commit`, `.husky/pre-push` → `audit-ai-docs`, CI, mutation testing — spawns **no** `claude -p` and is therefore **cost-free under every companion** (re-confirms the 2026-05-27 §5 "git hook + CI layer = reliable free floor" finding, now with the cost axis made explicit). This is the satellite's strongest neutrality property: the enforcement substrate carries zero per-invocation cost in any harness, and only the optional autonomous-dispatch add-on inherits the metered credit.

---

## §4 Delta C — amux 8th companion + Cursor agent-hooks + SSOT #81

### §4.1 amux (`mixpeek/amux`) — capability + integration + conflict

T16 problem-class: upstream = "tmux-based multiplexer that spawns/monitors parallel Claude Code sessions, REST+SSE dashboard, agent-to-agent coordination via shared kanban + memory"; our class = "Living-Doc enforcement layer + (optional) cross-session Worker dispatch". Match on the dispatch surface (~55% per 2026-05-29 §4.3); **zero** match on the enforcement surface (amux ships no rule/lint/gate layer).

| Capability | amux | Evidence |
|---|---|---|
| R1 Persistent plan | PARTIAL — session/worktree state; shared kanban board (`amux board add`); no structured PLAN.md | DeepWiki 2026-05-29 (`amux-server.py`); 2026-05-30 probe |
| R2 Auto-discovery | NO — free-form Claude Code sessions, no decomposition | 2026-05-29 §4.3 |
| R3 Cross-umbrella | PARTIAL — multi-session board; no umbrella aggregator | 2026-05-29 §4.3 |
| R4 DAG dispatch | NO explicit DAG; parallel sessions, no `blockedBy` | 2026-05-29 §4.3 |
| R5 Skill recommendation | NO | 2026-05-30 probe |
| Storage / Exec / Review / Verify | tmux sessions + git worktrees / parallel `claude` subprocess / none / none | 2026-05-30 probe |

**Integration surface:** amux exposes **no injectable lifecycle hooks** and does **not** itself load `.claude/skills/`/`AGENTS.md`/`CLAUDE.md` — it delegates that entirely to the spawned `claude` CLI subprocess (DeepWiki 2026-05-30). External orchestrators integrate via **REST** (`GET /api/sessions`, `GET /api/events` SSE), not MCP. **Conflict surface: NONE with the enforcement floor** — amux "manages git worktrees for isolation … does not directly modify or conflict with `.husky/` pre-push hooks or `.github/workflows/`. The git hooks would still execute normally when the spawned Claude sessions perform git operations" (DeepWiki 2026-05-30). So our pre-push/CI floor fires unchanged inside amux-spawned sessions. Living-Doc rule-text injection rides in via the spawned `claude` session's own `.claude/`/AGENTS.md loading (same as any CC session), not via amux. **Cost:** §3 credit-pool caveat applies (OAuth-first; spawns `claude`).

### §4.2 Cursor — agent hooks now exist (correction to 2026-05-27)

The 2026-05-27 patch §1.6 states "Cursor = rules-injection-only surface … No lifecycle hooks". **This is now stale.** Cursor ships an **agent hooks** system (WebSearch 2026-05-30 → `cursor.com/docs/agent/hooks`; Cursor blog "Observe and control Cursor Agent with hooks"). Rule types are unchanged (Always / Auto-Attach via globs / Agent via description / Manual via `@ref`, `.cursor/rules/*.mdc`). Net for the satellite: Cursor gains a lifecycle-hook injection point beyond rules-only — an M-A OpenCode-style enforcement deliverable could have a Cursor-hooks analog (previously thought impossible). Flagged for M-A; not adopted here. (Probe count 4 < 5 floor — see §2.1; honest under-coverage on a rules-/hooks-only surface.)

### §4.3 SSOT #81 citation correction (re-confirmed)

SSOT #81 candidate field reads `oh-my-openagent (code-yeongyu/oh-my-openagent)` in the current register (verified by Read of `prior-art-evaluations.md:151`) — the broken `Doriandarko/` attribution noted in the kickoff §5 stub is **already corrected** in the landed SSOT. No further action needed; the kickoff stub's note is stale.

---

## §5 Updated integration-surface delta cells (only changed vs 2026-05-27 §2)

| Companion | Cell | 2026-05-27 said | 2026-05-30 correction |
|---|---|---|---|
| OpenCode | Living-Doc injection point | "`.claude/skills/` auto-loaded + AGENTS.md + `.opencode/plugins/`" | **AGENTS.md (code-confirmed) + `tool.execute.before/after` plugin (code-confirmed); `.claude/skills/` auto-load UNCONFIRMED from code — verify empirically** |
| OhMyOpencode | Lifecycle hooks | "5-tier: PreToolUse/PostToolUse/Message/Event/Transform/Params" | **PreToolUse/PostToolUse/UserPromptSubmit/Stop/SubagentStop/Notification (CC-convention-aligned) via `oh-my-opencode.jsonc`** |
| Cline | Storage | "SQLite via ClineCore" | **JSON/markdown task files (timestamp IDs); linear focus-chain, no `blockedBy` DAG** |
| Cursor | Lifecycle hooks | "No lifecycle hooks" | **Agent hooks now exist (`cursor.com/docs/agent/hooks`, 2026)** |
| amux (NEW) | All | (absent) | REST/SSE only; no injectable hooks; no `.husky/`/`.github/workflows/` conflict; rule-text rides spawned `claude` session |
| ALL | Cost axis (NEW) | (absent) | Enforcement floor = free everywhere; autonomous-dispatch (aif-handoff/amux) = Agent-SDK credit pool post-June-15 (§3) |

All other §2/§3/§4/§5 cells of the 2026-05-27 matrix stand unchanged.

---

## §6 §1.7 self-reflexive check

### Forward — complies with active disciplines

- **[no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md):** all research = DeepWiki MCP + WebFetch + WebSearch (subscription-bundled/free); zero API-billed calls; markdown-only patch, no CI mechanism added. ✓ *Wrong if any CI job calling an API key is proposed — none is.*
- **[build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md):** REUSE applied to the research itself — the 2026-05-27 matrix is treated as primary input, not re-derived (the §0 duplication finding is the BFR `#parallel-evolution-creep` counter applied to our *own* output). No BUILD verdict issued. ✓
- **[doc-authority-hierarchy.md §3](../../../.claude/rules/doc-authority-hierarchy.md):** first line `<!-- scope:universal-satellite-integration-matrix -->` (principle 10); Authoritative-for / NOT-authoritative header present; folder-level authority inherited. ✓
- **[reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md):** the supersede-vs-companion question is surfaced as DECISION-NEEDED-1 (§8) with both options' consequences, not picked. ✓
- **[recommendation-laziness-discipline.md §3](../../../.claude/rules/recommendation-laziness-discipline.md) / T20:** every claim in §2-§5 carries a same-turn tool-call citation (DeepWiki probe, WebFetch quote, or file:line Read). ✓
- **universal-satellite neutrality (kickoff §2):** no single companion picked; all 8 keep equal treatment; the only "winner" named is the harness-agnostic enforcement floor (a property, not a companion). ✓
- **no substrate edits:** only one new file created under `docs/meta-factory/research-patches/`. ✓ *Wrong if `git diff --stat` shows any other path.*

### Backward — what is affected

- **2026-05-27 matrix:** NOT superseded; cited as primary input. This patch corrects 4 cells (§5) and adds a cost axis + amux + Cursor-hooks; it does not reverse any 2026-05-27 verdict. DECISION-NEEDED-1 asks the maintainer whether to fold these deltas back into the 2026-05-27 file (supersede) or keep this as a dated companion.
- **SSOT rows:** no landings. Proposed: amux row #85 (already proposed 2026-05-29 §7) gets a Living-Doc-floor-coexistence note ("no `.husky/`/`.github/workflows/` conflict; enforcement floor free in amux-spawned sessions"); no other row changes. Append-only register owned by SSOT author.
- **Other patches:** the 2026-05-29 superpowers-reuse and aif-handoff-bridge-synthesis patches are cited, not changed. The aif-handoff-bridge DEFER-all verdict is unaffected (this patch only imports its cost finding into the satellite matrix's cost axis).
- **kickoff stub:** its "#81 broken citation" note is stale (§4.3); its T1 floor=≥5 is now satisfied (§2). The orchestrator should update the stub's status post-merge.

---

## §7 T-trap instantiation (per kickoff §4)

| T | Applied |
|---|---|
| **T1** (≥5 probes/companion) | §2.1 tally: ≥5 documented for all 8 core companions (Cursor 4, flagged below floor honestly, not padded). |
| **T3** (file:line / tool-output) | Every claim cites a DeepWiki probe date+repo, a WebFetch verbatim quote, or a file:line Read (`prior-art-evaluations.md:151`; `packages/plugin/src/index.ts:73-78`). |
| **T7+T16** (problem-class walk per companion) | amux T16 in §4.1; the §3 cost split is itself a T16 separation ("autonomous-dispatch class" vs "enforcement-floor class"). |
| **T11** (BFR §3 before any build claim) | No BUILD claim; REUSE of 2026-05-27 matrix is the BFR application. |
| **T12** (DeepWiki in-moment) | All strengthening probes run 2026-05-30; cost claim WebFetched 2026-05-30 (training cutoff predates June-15 policy). |
| **T15** (self-application) | The duplication finding (§0) is this patch applying anti-duplication discipline to its own dispatch — the strongest self-application instance. |
| **T18** (don't duplicate a redundant artifact; preserve unique residue) | This patch is a delta-companion, not a duplicate of the 2026-05-27 matrix; unique residue (T1≥5, cost axis, amux, Cursor-hooks, 4 cell corrections) is the only new content. |
| **T19** (own cold-QA before handoff) | §7.1 cold-QA below. |
| **T20** (no inline verdict without evidence) | No verdict issued without a same-turn tool call. |
| **T-CR-A** (within-project multi-initiative disambiguation) | The duplication finding distinguishes *this* umbrella's deliverable from the adjacent `m-a-full-satellite-transition` (Stage-3 living-doc-injection) and `aif-handoff-runtime-bridge` umbrellas, which share companion vocabulary but different scope. |

### §7.1 Cold-QA self-pass (T19)

- First line = valid `<!-- scope:... -->` → principle 10 PASS.
- Every §2-§5 cell carries an evidence citation → T3 PASS.
- Anti-collusion: load-bearing cost claim re-verified vs primary doc (§3.1), not companion-hearsay → PASS.
- No single companion recommended; enforcement-floor neutrality preserved → kickoff §2 PASS.
- Duplication surfaced (not silently re-derived) → T18/T15 PASS.
- Cursor under-coverage (4<5) disclosed, not hidden → T14 PASS.
- Line count < 600 (pre-commit markdown limit) → PASS.
- **No MAJOR findings.** One MINOR: Cursor probe floor-miss (disclosed, acceptable for a rules/hooks-only surface).

---

## §8 M-A feed + DECISION-NEEDED

### §8.1 M-A scope deltas (additive to 2026-05-27 §8)

1. **OpenCode injection point** must be empirically confirmed — target **AGENTS.md + `tool.execute.before/after` plugin**, NOT assumed `.claude/skills/` auto-load (§2.2).
2. **Cursor** is no longer rules-only — an M-A enforcement deliverable can have a **Cursor agent-hooks** analog (§4.2), widening reach.
3. **Cost note for the setup guide:** any autonomous-dispatch path (aif-handoff/amux) must document the post-June-15 Agent-SDK credit cap; the enforcement floor itself stays free (§3).
4. **amux** joins the companion set as an autonomous-dispatch peer with the cleanest enforcement-floor coexistence (REST-only, no hook conflict) (§4.1).

### §8.2 DECISION-NEEDED-1 (supersede vs companion)

> The deliverable already shipped 2026-05-27. This patch is a delta-refresh. **Option A — keep as dated companion:** this 2026-05-30 patch stands alongside the 2026-05-27 matrix; readers consult both (2026-05-27 = full matrix, 2026-05-30 = strengthening + cost + amux/Cursor). Lower churn; the cross-reference is the §0/§1 header. **Option B — fold back (supersede):** a maintainer/M-A edit merges these 4 cell corrections + cost axis + amux row + Cursor update into the 2026-05-27 file and marks this one superseded. Single source of truth; higher edit cost + touches an already-merged artifact. **Reviewer cannot pick** (reviewer-discipline §2) — maintainer or M-A decides. Recommendation surface only: Option A is lower-risk for an append-only research-patch register; Option B is cleaner if M-A is about to consume the matrix as a shipped registry (2026-05-27 §8 DECISION-NEEDED D3-4).

### §8.3 DECISION-NEEDED-2 (umbrella status)

> The umbrella kickoff is still `STUB / NOT DISPATCHED` despite two patches now existing (2026-05-27 + this). The orchestrator should either mark the umbrella DONE (write `done.md` per [CLAUDE.md Umbrella closure convention](../../../CLAUDE.md)) or re-scope it. Surfaced, not actioned (gitignored kickoff is out of this R-phase's write scope).

---

## §9 See also

- [`2026-05-27-universal-satellite-integration-matrix.md`](2026-05-27-universal-satellite-integration-matrix.md) — **primary input**; full 7-companion matrix this patch builds on.
- [`2026-05-27-living-doc-neutral-injection.md`](2026-05-27-living-doc-neutral-injection.md) — Stage-3 channel×companion compatibility audit; precedent for the "downstream consumer of the matrix" shape + enforcement-floor neutrality.
- [`2026-05-29-superpowers-reuse-audit-for-runtime-bridge.md §6`](2026-05-29-superpowers-reuse-audit-for-runtime-bridge.md) — origin of the June-15 Agent-SDK credit-pool finding + amux evaluation.
- [`2026-05-29-aif-handoff-bridge-synthesis.md`](2026-05-29-aif-handoff-bridge-synthesis.md) — DEFER-all verdict on the autonomous-dispatch bridge (the only coexistence path the cost axis touches).
- [`2026-05-26-meta-orchestrator-mode-triage-prior-art.md`](2026-05-26-meta-orchestrator-mode-triage-prior-art.md) — companion capability probes (tickgit/Backlog.md/TaskMaster/Cline) reused in §2.1 tally.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT rows #13/#27-#46/#50/#55/#61/#62/#64/#65/#67/#68/#73/#76/#77/#80/#81/#83/#85.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md), [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md), [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md) — disciplines applied.
