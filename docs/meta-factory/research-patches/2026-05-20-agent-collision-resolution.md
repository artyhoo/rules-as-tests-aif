<!-- scope:agent-collision-resolution -->
# Research-patch — Agent-collision resolution (C-1): per-agent verdict for best-practices-sidecar / docs-auditor / review-sidecar

> **Authoritative for:** the C-1 agent-name-collision resolution recommendation — per-agent verdict (best-practices-sidecar, docs-auditor, review-sidecar), the evidence (fresh AIF v2.11.0 probe, dispatch-wiring facts, channel-redundancy analysis), blast radius, and version-bump safety check. Research only — no live artefact edited.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The verdict typology — see [.claude/rules/build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md). Implementation (editing agents/install.sh/principle 09/RULES prose) is a SEPARATE maintainer-authorised step after acceptance.
> **Status:** standalone autonomous R-phase, completed 2026-05-20. Supersedes the divergent prior verdicts (see §1).

---

## §1 — The question (recap) + prior-work divergence this resolves

AI Factory (`ai-factory init`, v2.11.0) ships three sub-agents into `.claude/agents/` whose filenames collide with three of ours: `best-practices-sidecar.md`, `docs-auditor.md`, `review-sidecar.md` (our `compliance-verifier.md` has no collision). Default `install.sh` (no `--force`) **skips** ours → AIF's thin stubs silently win; `--force` overwrites AIF's → would strip the frontmatter AIF's `implement-coordinator` and `lee-to/aif-handoff` depend on. For each of the three: decide **MERGE / RENAME-SPLIT / KEEP-AIF / TAKE-BEST**.

**The prior work was internally inconsistent** — this R-phase exists to resolve that, from re-verified evidence:
- Parent research-patch `2026-05-20-companion-integration-analysis.md` §7 row 10 + §12 #1 → **rename all 3** (ADAPT-MINIMAL de-collide).
- Detailed draft `agent-collision-detailed-comparison.md` → **2 MERGE (best-practices, review) + 1 RENAME (docs-auditor)**.

This patch independently re-derives and lands a **third answer** that overturns both, grounded in the project's own "earliest reachable channel" goal and in an AIF mechanism (skill-context override) neither prior artefact considered.

---

## §2 — Ground truth re-verified (T-ACR-D — fresh probe, not the stale 2026-05-20 dir)

| Fact | Evidence (this session) |
|---|---|
| AIF version | `ai-factory --version` → **2.11.0** |
| AIF init ships 19 agents incl. the 3 colliders | fresh `ai-factory init --agents claude` in `/tmp/acr-1779297142`; `ls .claude/agents/` shows `best-practices-sidecar.md`, `docs-auditor.md`, `review-sidecar.md` (+ `rules-sidecar.md`, `security-sidecar.md`, `implement-coordinator.md`, …) |
| `compliance-verifier` has no collision | absent from AIF init output — out of scope, confirmed |
| AIF agent line counts | 31 / 32 / 31 (best-practices / docs-auditor / review) |
| Saved snapshots still accurate | `diff` fresh-AIF vs `drafts/agent-variants/*.AIF.md` → **IDENTICAL** for all 3; no AIF drift since 2026-05-20 |
| Our live agents | `agents/best-practices-sidecar.md` 121 ln, `review-sidecar.md` 183 ln, `docs-auditor.md` 164 ln (worktree `fd64857`, origin/main) |
| Default install skips ours | `install.sh copy_safe`: `if [ -e "$dst" ] && [ "$FORCE" != "--force" ]; then SKIPPED+=… return 0` — AIF stub silently wins on default `setup.sh`/`install.sh` |

---

## §3 — Wiring facts (cited)

**W1 — Dispatch is by hardcoded agent NAME (primary evidence).** `implement-coordinator.md:4` (fresh init output):
`tools: Agent(implement-worker, best-practices-sidecar, commit-preparer, docs-auditor, review-sidecar, security-sidecar, rules-sidecar), Read, Write, …`
→ the coordinator can only dispatch agents whose **name** is in this `Agent()` allowlist. All three colliders are in it. **Renaming an agent removes it from the allowlist → it is no longer auto-dispatched** (manual/own-wiring only). Body content is irrelevant to dispatch.

**W2 — CC subagent identity = `name:` only.** Claude Code docs ([code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)): identity comes only from the `name:` frontmatter; `.claude/agents/` is scanned recursively (subdirs load); same-name → higher-priority location wins. Two **project-level** agents with the same `name:` = undefined winner → a subdir copy keeping the same `name:` does **not** cleanly de-collide. CC has **no partial-override** of a built-in/vendored agent — open issue [anthropics/claude-code#25546](https://github.com/anthropics/claude-code/issues/25546) requests exactly that. It is whole-file-wins-by-name.

**W3 — aif-handoff binds by name; body-swap is safe, rename breaks.** DeepWiki `lee-to/aif-handoff` (file-cited): consumes `.claude/agents/*.md` via `agentDefinitionName` = the agent name; `reviewer.ts` references `review-sidecar`/`security-sidecar`. **Renaming breaks** the pipeline (name no longer resolves). **Replacing the prompt body while keeping name + frontmatter does NOT break** it — "Agent definitions are config, not code". Frontmatter fields (`skills`/`background`/`maxTurns`) are **not stated as required**. → **Correction of the prior draft:** `--force` only breaks aif-handoff if it *strips frontmatter*; a MERGE that preserves AIF frontmatter is wiring-safe.

**W4 — `skills:[aif-*]` is context-loading, not dispatch.** Dispatch = W1 (Agent allowlist). The sidecar's `skills:` field makes that skill available to the agent; it is not the dispatch key (T-ACR-C: not load-bearing for dispatch).

**W5 — AIF's `rules-sidecar` already reads our `RULES.md` (T16 catch).** AIF ships a **separate** `rules-sidecar` (skill `aif-rules-check`) whose job is *project-rules compliance*; `aif-rules-check/SKILL.md` defaults `paths.rules_file` to `.ai-factory/RULES.md` — the exact file `install.sh:242` seeds with our R1–R20. AIF's `best-practices-sidecar` does *generic maintainability* (duplication/naming/structure), no rule corpus. → **Our `best-practices-sidecar` shares a NAME with AIF's generic slot but shares a FUNCTION with AIF's `rules-sidecar` slot.** Name-match ≠ function-match.

**W6 — skill-context is AIF's first-class "extend a vendored agent" mechanism (the T11 prior-art).** Every AIF quality skill (`aif-best-practices`, `aif-review`, `aif-docs`, `aif-rules-check`) contains: *"Read `.ai-factory/skill-context/<skill>/SKILL.md` — MANDATORY if the file exists … skill-context rule wins over the general rule."* `aif-evolve/SKILL.md` lines 27-42: *"Skill-context rules (`.ai-factory/skill-context/*`) are the compact, reusable output … ALWAYS write project-specific rules to skill-context: `.ai-factory/skill-context/<skill-name>/SKILL.md` … remains a fixed internal AI Factory path."* → injecting our content here rides AIF's wiring **without occupying or overwriting any agent slot**, survives AIF version bumps, and is the AIF-supported override path. *(DeepWiki's ai-factory wiki index is stale and denied skill-context exists — primary shipped artifact wins per [phase-research-coverage §1.10](../../../.claude/rules/phase-research-coverage.md).)*

---

## §4 — Per-agent evaluation

**The decisive lens (README goal): "fail at the EARLIEST reachable channel; CI/verify = last resort."** An LLM agent firing at `/aif-verify` is a LATE channel. A verify-time agent that re-checks something already enforced at edit-time (ESLint) or pre-push (audit-ai-docs.sh, depcruise, vitest) is, *by the project's own goal*, the weaker, redundant copy.

### 4.1 best-practices-sidecar → **KEEP-AIF** (BFR: ADOPT)

| Criterion | Finding |
|---|---|
| Problem-class (T16) | AIF problem class: generic maintainability (duplication, naming, structure). Our problem class: deterministic R1–R20 compliance. **Match? NO** to AIF's `best-practices` slot; our function matches AIF's **`rules-sidecar`** (W5), which already reads our RULES.md. |
| Content delta | Ours maps each R-rule to a concrete tool + emits per-rule verdict. AIF's is a 4-line generic stub. Ours is "richer" — but see redundancy. |
| Channel redundancy | **Every check it runs is already shipped at an earlier channel:** custom ESLint rules (`rules-as-tests/no-unsafe-zod-parse`, `no-direct-time-randomness`, `require-otel-span`, `require-form-safe-parse`, `require-use-server-directive`, `no-server-imports-in-client` — confirmed in `packages/core/research/store/**` + audit) fire at **edit-time**; tsc/depcruise/vitest at **pre-push**; the R1–R20 corpus already feeds AIF's `rules-sidecar` via RULES.md (W5). Its `audit:docs` step is owned by docs-auditor/pre-push. |
| Wiring necessity | None. aif-handoff `reviewer.ts` wires review+security, **not** best-practices (W3). implement-coordinator's slot is filled by AIF's own stub if we don't ship ours (W1) — no breakage. |
| Maintenance cost (BFR §2) | A colliding, version-fragile file duplicating earlier-channel gates = perpetual cost for a single maintainer, with the content's value already delivered elsewhere. |
| Reversibility | Trivial — re-add the file later if a real gap appears. |

**Verdict: KEEP-AIF — do not occupy or rename the slot.** AIF's `rules-sidecar` (reads our RULES.md) + our edit-time ESLint + pre-push are the real, earlier, deterministic enforcers. Overturns the prior draft's MERGE. *(Optional enrichment if the maintainer wants the R-number verdict inside the AIF gate: inject the R-rule→tool mapping into `.ai-factory/skill-context/aif-rules-check/SKILL.md` — same mechanism as review below.)* **Implementation note:** update shipped `RULES.md` / `RULES.react-next.md` prose that currently credits "best-practices-sidecar" to credit `rules-sidecar` + ESLint + audit.

### 4.2 review-sidecar → **PRESERVE via skill-context** (BFR: ADAPT)

| Criterion | Finding |
|---|---|
| Problem-class (T16) | AIF problem class: generic background bug-risk review. Our problem class: **anti-tautology test review** (tautological assertions, mock-only tests, missing edge cases, test-name≠behavior, React/Next testing anti-patterns; the "if I removed this assertion, what bug ships?" heuristic). **Match? PARTIAL** — ours is a superset through the test-quality lens; the anti-tautology core is the project's differentiator thesis. |
| Content delta | Ours adds ~30 concrete flagged patterns + the removal heuristic + severity contract that exist nowhere else as an LLM check. |
| Channel redundancy | **None at an earlier channel.** The only deterministic cousin is Stryker mutation, which runs in **CI = last resort**. The verify-time LLM review is genuinely the **EARLIER** channel for catching tautological tests → the one agent worth wiring. |
| Wiring necessity | High — aif-handoff `reviewer.ts` binds `review-sidecar` by name (W3); rename would orphan the handoff reviewer step. |
| Maintenance cost | Justified — unique, load-bearing content. |
| Reversibility | skill-context file is additive and removable; version-bump-proof (fixed AIF path, W6). |

**Verdict: PRESERVE the content, delivered into AIF's pipeline via the native skill-context override** — ship `.ai-factory/skill-context/aif-review/SKILL.md` derived from our anti-tautology spec, and **keep `agents/review-sidecar.md` as the portable SSOT** (valuable for non-AIF / non-CC consumers reading it directly, and as the spec source per [dual-implementation-discipline §7](../../../.claude/rules/dual-implementation-discipline.md)). This refines the prior draft (which proposed file-overwrite MERGE): skill-context is version-bump-proof, additive on AIF's generic review, and occupies no slot. **Caveat (→ DECISION-NEEDED #2):** whether a *background, `maxTurns:6`* sidecar reliably reads skill-context needs one live CC-session dispatch probe; if it does not, fall back to **MERGE** (`--force` install of our body **with AIF frontmatter preserved** — wiring-safe per W3).

### 4.3 docs-auditor → **RENAME** ours → `living-docs-auditor` (BFR: KEEP-NARROW)

| Criterion | Finding |
|---|---|
| Problem-class (T16) | AIF problem class: **forward** doc-generation gating — "did this change create drift that needs `/aif-docs` to write docs?" — outputs JSON `{status,reasons,suggested_targets}` that **gates the /aif-docs pipeline**. Our problem class: **backward** Living-Docs drift — "do existing AGENTS.md/RULES.md rules still hold in code?" via `audit-ai-docs.sh`. **Match? NO — genuinely different jobs, opposite direction.** |
| Content delta | Merging the two output contracts (machine JSON for /aif-docs vs prose drift verdict) would break AIF's /aif-docs gate AND muddy ours → MERGE/overwrite is wrong here. |
| Channel redundancy | Our drift *enforcement* (`audit-ai-docs.sh`) already runs at **pre-push** (README:26). The agent is a verify-time LLM interpreter of it — partly redundant, but it's a *distinct job* AIF does not provide. |
| Wiring necessity | Low — aif-handoff wires review+security, not docs-auditor (W3). implement-coordinator lists it, but if renamed AIF's own docs-auditor fills the slot and keeps its JSON gate intact. |
| Maintenance cost | Modest; preserves the Living-Docs differentiator as a clearly-named distinct-job agent. |
| Reversibility | Clean rename; no AIF wiring to break. |

**Verdict: RENAME ours to `living-docs-auditor` so AIF's `docs-auditor` keeps its JSON generate-gate and ours coexists as the drift interpreter.** Confirms the prior draft's RENAME with a sharper rationale. **→ DECISION-NEEDED #3:** RENAME (recommended — keeps the differentiator visible, cheap) vs **de-ship** (rely solely on the pre-push `audit-ai-docs.sh`, since enforcement is already there). Renaming orphans it from AIF auto-dispatch (W1), which is acceptable because its enforcement home is pre-push, not /aif-verify.

---

## §5 — Holistic recommendation + blast radius + version-bump safety

### 5.1 Combined story (all 4 agents)
- `compliance-verifier.md` — no collision, ships as-is (out of scope).
- `best-practices-sidecar` — **KEEP-AIF**: don't install ours into the colliding slot; AIF's rules-sidecar (reads our RULES.md) + ESLint + pre-push are the real enforcers.
- `review-sidecar` — **skill-context** delivery into `aif-review`; keep `agents/review-sidecar.md` as portable SSOT.
- `docs-auditor` — **RENAME** ours → `living-docs-auditor`; AIF's keeps the /aif-docs JSON gate.

**Net effect: our install occupies ZERO of AIF's agent slots** (no `--force` overwrite of any AIF agent). Collision surface after implementation = **empty**. This is the most version-bump-robust and most BFR-aligned of all options: it adopts AIF where AIF already covers the job (best-practices), rides AIF's supported override where our content is unique (review), and coexists cleanly where the job genuinely differs (docs).

### 5.2 Blast radius (live artefacts to edit at implementation — NOT in this R-phase)
- **best-practices KEEP-AIF:** stop installing our colliding agent (drop `agents/best-practices-sidecar.md` from `install.sh:64` array **and** exclude it from the `agents/*.md` glob loop at `install.sh:233`, or remove the file from `agents/`); remove from `packages/core/principles/09-doc-authority-hierarchy.ts:93` + `.test.ts` `REQUIRED_HEADER_DOCS`; `extension.json:28`; `CLAUDE.md:82` ownership row; update prose in `packages/preset-next-15-canonical/RULES.md:3,6,247,289,299` + `RULES.react-next.md:5,258` to credit rules-sidecar/ESLint/audit.
- **review skill-context:** add `packages/.../skill-context/aif-review/SKILL.md` to the install template payload; add a `<!-- @dual-pair: review-sidecar -->` + `<!-- spec-of: agents/review-sidecar.md -->` marker pair (per [dual-implementation-discipline §5/§7](../../../.claude/rules/dual-implementation-discipline.md)); `agents/review-sidecar.md` unchanged otherwise.
- **docs-auditor RENAME:** rename `agents/docs-auditor.md` → `living-docs-auditor.md` + `name:` field; update `install.sh:66`, `principle 09 .ts:95` + `.test.ts`, `extension.json:30`, `CLAUDE.md:82`, `RULES.react-next.md:259`.
- **MUST NOT touch** (frozen/historical per [doc-authority-hierarchy §4](../../../.claude/rules/doc-authority-hierarchy.md)): `PROPOSAL.md`, `retros/*`, `research-patches/*` (incl. this patch's parent), `docs/audits/*`, `phase-*-research.md`, `closed-questions.md`.

### 5.3 Version-bump safety check (deterministic, no LLM — per [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md))
Because the recommendation leaves us occupying no AIF slot, the check is simply *"stay disjoint"*:
```bash
# On AIF version bump: re-run init probe in /tmp, assert our installed agent names are
# disjoint from AIF's, else surface a new collision. ≤20 LOC, manual (no scheduled paid jobs).
comm -12 <(ls "$AIF_PROBE/.claude/agents" | sort) <(ls agents | sort)   # expect: empty
# Plus dual-pair drift (review): the skill-context file and agents/review-sidecar.md
# must share the @dual-pair anchor (per dual-implementation-discipline §5):
grep -rl '@dual-pair: review-sidecar' .ai-factory/skill-context agents/ | wc -l   # expect: 2
```

---

## §6 — §1.7 forward + backward self-review (+ T15)

**Forward-check (does this recommendation comply with existing disciplines?):**
- **BFR-default §1 typology** applied to each agent (ADOPT / ADAPT / KEEP-NARROW) with explicit problem-class match. ✅
- **T16 problem-class match** written for all three (§4 + W5). ✅
- **dual-implementation-discipline:** review-sidecar treated as exactly the delivery-channel question it is — portable SSOT (`agents/review-sidecar.md`) + AIF-native channel (skill-context), bound by `@dual-pair`/`spec-of` markers. ✅
- **no-paid-LLM:** all evidence from real bash probe + DeepWiki + WebSearch + CC docs (subscription/local); §5.3 check is deterministic grep/`comm`. ✅
- **doc-authority + principle 10:** this patch carries `<!-- scope: -->` first line + Authoritative-for header. ✅
- **reviewer-discipline §2:** genuine strategy forks (de-ship vs keep; skill-context vs MERGE) are surfaced as DECISION-NEEDED with both options + a recommendation, not unilaterally decided. ✅
- **Artifact Ownership:** research-only; no edit to README/CLAUDE/principle 09/install.sh/RULES/agents. ✅

**Backward-check (re-verify, don't inherit — did I re-derive every prior verdict?):**
- Re-ran the AIF init probe fresh (not the stale 2026-05-20 `/tmp/cit-*`); diffed against snapshots (identical). ✅
- Did NOT echo the prior 2-MERGE+1-RENAME (T7): independently re-derived from the channel-redundancy lens + skill-context prior-art → landed a different answer (KEEP-AIF for best-practices; skill-context not file-MERGE for review). ✅
- Overturned the parent patch's "rename-all" with primary wiring evidence (W1: rename orphans dispatch). ✅

**T15 self-application (did this research apply its own skepticism to its own conclusions?):**
- Counter-prompted each verdict (Iteration 6): best-practices KEEP-AIF's strongest objection (loses verify-time R-number verdict) → rebutted (mapping preserved in RULES.md+ESLint; handoff doesn't wire it; earlier channel is better per goal). review skill-context's objection (background-sidecar load reliability) → carried as DECISION-NEEDED + needs-probe, with a wiring-safe MERGE fallback. docs RENAME vs de-ship → surfaced. No verdict survived without an explicit falsifier.
- **What would flip each verdict** (§7) is stated, not hidden.

**One residual self-critique:** the review-sidecar skill-context recommendation rests on W6 (skill-context is consumed) which is documented-but-not-behaviorally-probed for *background* sidecars specifically — hence DECISION-NEEDED #2 + the MERGE fallback. This is the one load-bearing claim I could not close mechanically in a research-only session (it needs a live CC dispatch).

---

## §7 — DECISION-NEEDED (maintainer / `/orchestrator`, not reviewer)

1. **Accept the non-uniform resolution** (KEEP-AIF / skill-context / RENAME) over the two prior verdicts (rename-all; 2-MERGE+1-RENAME)? *Recommendation: yes — it is the only option occupying zero AIF slots while preserving the one unique differentiator.*
2. **review-sidecar delivery mechanism:** skill-context (recommended, version-proof) vs MERGE (`--force`, AIF-frontmatter-preserved, wiring-safe). Resolving this needs a **one-off live CC-session probe**: does a `background:true, maxTurns:6` sidecar actually read `.ai-factory/skill-context/aif-review/SKILL.md`? If yes → skill-context; if no → MERGE. *Recommendation: run the probe; default to skill-context.*
3. **docs-auditor:** RENAME to `living-docs-auditor` (recommended) vs **de-ship** (pre-push `audit-ai-docs.sh` already enforces drift). *Recommendation: RENAME — cheap, keeps the Living-Docs differentiator as a distinct-job agent.*
4. **best-practices skill-context enrichment:** also inject the R-rule→tool mapping into `.ai-factory/skill-context/aif-rules-check/SKILL.md` so AIF's rules-sidecar emits per-R-number verdicts? *Recommendation: optional / defer — RULES.md + ESLint already carry it; add only if the verify-time R-number UX is missed.*
5. **New SSOT entry?** "skill-context override as the AIF-native 'extend a vendored sub-agent' pattern" has no entry in `prior-art-evaluations.md` (closest: #11 ESLint three-layer, #15 AGENTS.override.md). *Recommendation: register it (verdict ADOPT) in the implementation commit, since the review-sidecar delivery depends on it.*

---

## §8 — PASTE-BACK DECISION (copy verbatim into the main session as the accepted decision)

> **C-1 agent-collision resolution — accepted (per `research-patches/2026-05-20-agent-collision-resolution.md`).** The three colliding agents get **non-uniform** treatment, occupying **zero** of AIF's agent slots: **(1) `best-practices-sidecar` → KEEP-AIF (ADOPT):** do not install or rename ours; AIF's `rules-sidecar` already reads our `.ai-factory/RULES.md` and our edit-time ESLint + pre-push are the real, earlier-channel enforcers — update shipped `RULES.md`/`RULES.react-next.md` prose to credit `rules-sidecar`/ESLint/audit instead of `best-practices-sidecar`. **(2) `review-sidecar` → PRESERVE via skill-context (ADAPT):** keep `agents/review-sidecar.md` as the portable SSOT and deliver its anti-tautology content into AIF's pipeline through the native `.ai-factory/skill-context/aif-review/SKILL.md` override (bound by `@dual-pair`/`spec-of` markers); this is the one agent whose content has no earlier-channel deterministic equivalent (its cousin Stryker is CI-only). Fallback if a live probe shows background sidecars don't read skill-context → MERGE (`--force` with AIF frontmatter preserved, which is wiring-safe). **(3) `docs-auditor` → RENAME ours to `living-docs-auditor` (KEEP-NARROW):** genuinely different job (AIF's gates `/aif-docs` generation via JSON; ours is backward Living-Docs drift via `audit-ai-docs.sh`) — AIF keeps its slot, ours coexists. `compliance-verifier` is unaffected. Net: no `--force` overwrite of any AIF agent, so the version-bump safety check is just `comm -12` "agent-name sets stay disjoint" (≤20 LOC, manual, no paid CI). Implementation is a separate PR touching `install.sh`, `extension.json`, `principle 09 REQUIRED_HEADER_DOCS`, `CLAUDE.md:82`, and the shipped `RULES*.md` prose; register a new SSOT entry for "skill-context = AIF-native vendored-agent override" (verdict ADOPT) in that PR.

---

## §9 — See also
- [docs/meta-factory/research-patches/2026-05-20-companion-integration-analysis.md](2026-05-20-companion-integration-analysis.md) — parent R-phase (C-1 origin); §6/§7/§12 (note: lives on branch `research/companion-integration-analysis`, commit `103ebf1`).
- `.claude/orchestrator-prompts/companion-integration-analysis/drafts/agent-collision-detailed-comparison.md` — prior 2-MERGE+1-RENAME draft (hypothesis tested + partially overturned here).
- `.claude/orchestrator-prompts/companion-integration-analysis/drafts/agent-variants/` — verbatim AIF/OURS variants (re-verified identical to fresh probe).
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — verdict typology.
- [.claude/rules/dual-implementation-discipline.md](../../../.claude/rules/dual-implementation-discipline.md) — portable-vs-CC-native delivery framing (§5 `@dual-pair`, §7 SSOT-one-spec).
- [.claude/rules/ai-laziness-traps.md](../../../.claude/rules/ai-laziness-traps.md) — trap catalogue (T2/T3/T7/T11/T13/T16 + T-ACR-A..D instantiated).
- [.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — constrains §5.3 check to deterministic grep.
- Working history: `.claude/orchestrator-prompts/agent-collision-resolution/hypotheses-log.md` (gitignored).
