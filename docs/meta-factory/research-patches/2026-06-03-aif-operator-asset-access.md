<!-- scope:aif-operator-asset-access -->
# aif-operator-asset-access — R-phase research patch

> **Authoritative for:** R-phase gap verification + candidate scoring A-E + DN-1/2/3 decision points for bridging operator `~/.claude/` assets into the aif-handoff container; recommended composition.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).
> **Date:** 2026-06-03

---

## §0 Context

When work is dispatched to aif-handoff, the aif agent runs Claude Code CLI **inside a container** with only the repo clone bind-mounted at `/home/www/<repo>`. The container has its own `$HOME` — none of the operator's `~/.claude/` assets are present. This was discovered while authoring the `meta-orchestrator-refactor` kickoff (§4c Runtime availability table), which hit the wall because it required the global orchestrator skill inside the container. This umbrella researches how to bridge that gap without violating the shipped-axis agnostic invariant.

**Kickoff:** `.claude/orchestrator-prompts/aif-operator-asset-access/kickoff.md` (authored 2026-06-03)

---

## §1 Gap verification (T3 — fresh evidence)

All rows re-confirmed with independent evidence below.

| Asset | In aif container? | Evidence |
|---|---|---|
| Project `.claude/skills/`, `.claude/rules/`, `.claude/hooks/`, `agents/*.md` | ✅ yes | `docs/runtime-bridge-setup.md:40` — clone at `<PROJECTS_HOST_ROOT>/<repo>/` bind-mounted to `/home/www`; CC-CLI auto-loads `.claude/rules/*.md` and `.claude/skills/` at startup; all these paths are committed and present in the clone |
| Global `~/.claude/skills/orchestrator/` (887 LOC) | ❌ no | `~/.claude/plugins/installed_plugins.json` confirms Superpowers v5.1.0 at `~/.claude/plugins/cache/superpowers-dev/superpowers/5.1.0`; `~/.claude/skills/orchestrator/SKILL.md` is operator-home only; container has its own `$HOME` (not bind-mounted per `docs/runtime-bridge-setup.md` workspace-currency §) |
| Global `~/.claude/skills/` reviewer sub-dir | ❌ no | `ls ~/.claude/skills/` output: `ai-docs`, `native-css-responsive`, `orchestrator`, `pr-template-multi-phase`, `projects` — no `reviewer/` dir. Reviewer capability comes from Superpowers plugin, also absent in container |
| Superpowers plugin `~/.claude/plugins/` | ❌ no | `~/.claude/plugins/installed_plugins.json:3` — plugin at operator-home path only; container's `$HOME` is isolated |
| Gitignored `.claude/orchestrator-prompts/*` (kickoffs, audit-plans) | ❌ no | `.gitignore:7-14`: `.claude/orchestrator-prompts/*` is gitignored; only `*/done.md` and sub-directory stubs (`!.claude/orchestrator-prompts/*/`) pass through — the kickoff content itself (`/*/*`) is excluded. CANON symlink target (`~/.claude-coordination/`) is operator-home |
| CANON `~/.claude-coordination/<repo>/` | ❌ no | operator-home path; not mounted; container has own `$HOME` |
| Dispatched kickoff CONTENT | ✅ transmitted | `packages/runtime-bridge/src/kickoff.ts:21-40` — `buildKickoffSpec` reads `readFileSync(filePath, 'utf8')` and returns `{ content, umbrellaName, contentHash, filePath }`. No sibling resolution — no glob, no `readDir`, no `references` walk. Kickoff body travels; every file the kickoff *cites* does not |
| `.ai-factory/skill-context/aif-review/SKILL.md` + `aif-rules-check/SKILL.md` | ✅ yes (after install) | `install.sh:322-325` — `copy_safe` into `$PROJECT_ROOT/.ai-factory/skill-context/`; this path IS in the repo after `install.sh` runs on the consumer project; the aif container clone includes these files. BUT: content covers test-review and R10/R4/R17 naming — NOT orchestrator discipline (verified §2) |

**Gap summary:** Row 2 (global orchestrator skill), Row 3 (global reviewer), Row 4 (Superpowers), Row 5 (kickoffs), Row 6 (CANON) are all absent from the container. The critical missing capability is orchestrator/reviewer **discipline** (launch-table, stage-gate, Mode A/B, REPORT-schema, parallel-isolation) — none of it reaches the aif agent today.

---

## §2 Existing mechanisms — problem-class audit (T10: population enumerated first)

**Population of existing in-repo AI-agnostic/shipped mechanisms:**

1. `agents/compliance-verifier.md` — PR description §1.7 substance review
2. `agents/review-sidecar.md` — anti-tautology two-AI diff review
3. `agents/living-docs-auditor.md` — AGENTS.md/RULES.md backward-drift audit
4. `agents/memory-codification-auditor.md` — memory-to-repo codification audit
5. `packages/core/templates/shared/skill-context/aif-review/SKILL.md` — test-quality conventions for AIF review pipeline
6. `packages/core/templates/shared/skill-context/aif-rules-check/SKILL.md` — R10/R4/R17 naming/test-existence residue
7. `.claude/skills/meta-orchestrator/` (project-local) — `/meta-orchestrator` command implementation

**Problem-class audit (T16: upstream problem class X vs our class Y):**

| Mechanism | Upstream problem class | Our problem class (orchestrator/reviewer discipline) | Match? |
|---|---|---|---|
| `agents/compliance-verifier.md` | PR description §1.7 Forward/Backward citation substance review (`compliance-verifier.md:3-10`) | Multi-session orchestrator stage-gates, launch-table, Mode A/B | ❌ No — scoped to PR description review only |
| `agents/review-sidecar.md` | Adversarial diff review: tautological tests, mock-only assertions, React anti-patterns (`review-sidecar.md:27-37`) | Orchestrator planning, worker dispatch, reviewer-discipline §2 | ❌ No — code/test quality only, not orchestration discipline |
| `agents/living-docs-auditor.md` | Code-vs-AGENTS.md/RULES.md drift (`living-docs-auditor.md:3`) | Orchestrator workflow | ❌ No |
| `agents/memory-codification-auditor.md` | Memory-to-repo codification gaps | Orchestrator workflow | ❌ No |
| `skill-context/aif-review/SKILL.md` | Anti-tautology two-AI test-review conventions (project-specific AIF pipeline augmentation) (`aif-review/SKILL.md:6-7`) | Orchestrator discipline | ❌ No — identical problem-class to review-sidecar (via `@dual-pair: review-sidecar`), not orchestration |
| `skill-context/aif-rules-check/SKILL.md` | R10 naming + R4/R17 test-existence residue (`aif-rules-check/SKILL.md:6-8`) | Orchestrator discipline | ❌ No — naming/test-existence only |
| `.claude/skills/meta-orchestrator/` | `/meta-orchestrator` skill — orchestrates the meta-launch workflow; covers launch-table planning | Orchestrator discipline for generic aif workers | ⚠️ Partial — covers meta-launch specific orchestration but NOT the general orchestrator/reviewer discipline a dispatched aif worker would need to operate autonomously |

**Key finding:** No existing in-repo mechanism covers the orchestrator/reviewer discipline that an aif-dispatched agent needs. The `skill-context` pattern (SSOT #50, ADOPT) is the right delivery vehicle shape — but it currently carries zero orchestrator/reviewer content.

---

## §3 Candidate scoring (A–E)

### A — Mount operator assets into the container

Bind-mount selected `~/.claude/skills/orchestrator/`, `~/.claude/plugins/cache/superpowers-dev/`, and/or `~/.claude-coordination/<repo>/` into the aif agent service via `docker-compose.yml` volume mounts.

**BFR verdict:** ADOPT (operator-axis only)
**Two-axis:** operator ✅ / shipped ❌ (violates agnostic invariant if required for consumers)
**Prior art:** SSOT #86 (Superset REJECT on shipped axis, operator-axis available). No existing SSOT row for container volume mounts of operator assets — but the two-axis doctrine (BFR §1.1, `build-first-reuse-default.md:34-48`) explicitly permits operator-axis ADOPT without shipped constraint.
**Rationale:**
- `docs/runtime-bridge-setup.md` confirms the aif deployment is operator-owned (`docker-compose.yml` is in the aif-handoff repo, not this repo). The operator is free to mount any local paths.
- For orchestrator skill specifically: `~/.claude/skills/orchestrator/SKILL.md` is 887 LOC, well-tested in production, already installed. Mounting it into the container is zero code change and immediate.
- For Superpowers plugin: mounting `~/.claude/plugins/cache/superpowers-dev/superpowers/5.1.0` into the container makes Superpowers skills (reviewer, brainstorming, etc.) available to the aif agent.
- Machine-specific: paths are operator-machine-absolute. A consumer on a different machine has different paths. Not portable — purely operator convenience.
**Con:** (a) requires editing aif-handoff `docker-compose.yml` — operator-side, out of this repo's control; (b) does not help consumers who install this framework without the operator's exact skill set; (c) `~/.claude/skills/orchestrator/` is agent-uncommittable per CLAUDE.md Artifact Ownership Contract — a volume mount avoids this constraint but only for the operator.
**Evidence:** `docs/runtime-bridge-setup.md:38-52` (operator owns the deployment config); `~/.claude/plugins/installed_plugins.json:4` (Superpowers install path exists and is operator-machine-specific).

---

### B — In-repo AI-agnostic equivalents

Ship the orchestrator/reviewer discipline needed by aif workers as `agents/*.md` files (AI-agnostic sub-agent prompts) in this repo, so they ride the clone and are available to any aif dispatch.

**BFR verdict:** BUILD
**Two-axis:** both ✅ (operator via clone + shipped via clone)
**Prior art:** SSOT #67 (REJECT for full aif-handoff kanban — different problem class). The `agents/*.md` pattern itself is the project's established AI-agnostic shipped-axis mechanism (SSOT #43 ADOPT VOCABULARY for the RuntimeAdapter concept; the `agents/*.md` sub-agent markdown pattern is the project's own BUILD from the `agents/review-sidecar.md` precedent). No SSOT entry for «in-repo orchestrator discipline sub-agent» — this is a new capability area requiring a new SSOT row.

**T11/T12 evidence:** searched existing SSOT for orchestrator-discipline-as-sub-agent:
- SSOT #50 (skill-context ADOPT): covers the *delivery channel* for AIF pipeline augmentation; does NOT cover in-repo sub-agent for generic orchestrator discipline
- SSOT #30 (aif P/I/R pipeline): covers aif's internal subagent architecture; different problem class (T16: upstream = autonomous task pipeline; ours = sub-agent prompt carrying orchestrator discipline into dispatched workers)
- No upstream with «project-orchestration discipline as portable markdown sub-agent» problem class

**Rationale:**
- The `agents/*.md` pattern is proven: `agents/review-sidecar.md` (test-review discipline rides clone; AIF reads it via skill-context dual-pair; `aif-review/SKILL.md:10-15`). Same mechanism, new content.
- An `agents/orchestrator-worker-discipline.md` would carry: REPORT schema requirements, stage-gate discipline, the relevant subset of orchestrator discipline a *worker* or *auto-reviewer* needs.
- IMPORTANT constraint: this is NOT a copy of `~/.claude/skills/orchestrator/SKILL.md` (that is agent-uncommittable per CLAUDE.md Artifact Ownership Contract table). It is an in-repo *equivalent* — the discipline relevant to aif tasks, authored fresh (not copied).
- The orchestrator SKILL.md (887 LOC) is the *senior orchestrator's* full toolkit. A dispatched aif worker needs a narrower slice: how to structure its output (REPORT schema), stage-gate awareness, when to park vs proceed. This narrowing is a feature, not a limitation.
**Con:** (a) BUILD effort required — writing a new `agents/orchestrator-worker-discipline.md` is a capability commit (≥80 LOC under `agents/`); requires Prior-art trailer + new SSOT row; (b) content overlap risk with `~/.claude/skills/orchestrator/` if not scoped carefully; (c) solves discipline-in-dispatch but NOT the «aif worker can invoke the full interactive orchestrator skill» use case.
**Evidence:** `agents/review-sidecar.md:10-15` (`@dual-pair: review-sidecar` pattern proves in-repo agents ride the clone and reach aif); `packages/core/templates/shared/skill-context/aif-review/SKILL.md:10-15` (dual-channel delivery confirmed live per SSOT #50).

---

### C — Extend dispatch payload

Modify `packages/runtime-bridge/src/kickoff.ts:buildKickoffSpec` to resolve and inline a kickoff's referenced sibling files (e.g. audit-plan.md, cited `.claude/rules/*.md` excerpts) into the transmitted content before dispatch.

**BFR verdict:** BUILD (targeted, scoped)
**Two-axis:** both ✅ (improves dispatched content richness for operator and consumers)
**Prior art:** No SSOT entry. `buildKickoffSpec` currently does one thing: `readFileSync(filePath, 'utf8')` (`kickoff.ts:22`). No sibling resolution logic exists.

**T11 search:** grep for any existing kickoff enrichment or content injection in runtime-bridge — none found. The dispatch payload is a `KickoffSpec` type (`content + umbrellaName + contentHash + filePath`); there is no `siblings` or `context` field. Clear BUILD gap with no upstream analog.

**Rationale:**
- Solves the «audit-plan doesn't travel» half of the problem. If a kickoff references `./audit-plan.md` or rules files, those are on the operator's machine but not transmitted.
- A simple resolution strategy: parse kickoff content for `<!-- include: ./relative-path -->` directives (explicit opt-in, no implicit glob), read and inline matching local files as appendices.
- This is a **capability commit** per CLAUDE.md definition: modifies a file ≥80 LOC under `packages/runtime-bridge/src/` with new behavior. Requires Prior-art trailer + SSOT row.
- Does NOT solve the global-skills gap (A or B addresses that). This is purely about enriching per-dispatch inputs.
**Con:** (a) payload bloat risk — needs a size cap (e.g. 32KB total payload); (b) adds complexity to `buildKickoffSpec` which is currently a clean, simple function (`kickoff.ts:21-40`); (c) the dispatched agent still lacks orchestrator *discipline* (skill, not content) — C adds content richness, not workflow discipline.
**Evidence:** `packages/runtime-bridge/src/kickoff.ts:21-40` — confirmed no sibling resolution. `KickoffSpec` type carries only `{ filePath, content, umbrellaName, contentHash }`.

---

### D — Extend skill-context shipping

Add a new skill-context override (e.g. `packages/core/templates/shared/skill-context/aif-orchestrator-discipline/SKILL.md`) that carries orchestrator/reviewer discipline into the AIF pipeline, parallel to the existing `aif-review` and `aif-rules-check` overrides.

**BFR verdict:** BUILD + ADOPT channel (reuse the skill-context mechanism, SSOT #50)
**Two-axis:** both ✅ (skill-context path `.ai-factory/skill-context/` is in the repo post-install; rides the clone; AIF reads it during task execution)
**Prior art:** SSOT #50 (skill-context mechanism, ADOPT). The delivery channel is proven (`install.sh:317-325`). What is missing is the content — there is no orchestrator-discipline skill-context today (verified: `ls packages/core/templates/shared/skill-context/` → only `aif-review/` and `aif-rules-check/`).

**T16 problem-class check:**
- `aif-review/SKILL.md` upstream problem class: «project-specific test-quality review conventions injected into AIF's aif-review pipeline»
- `aif-orchestrator-discipline/SKILL.md` proposed problem class: «project-specific orchestration discipline (REPORT schema, stage-gate, anti-collusion, reviewer separation) injected into AIF's aif-implement/aif-plan pipeline»
- Match on delivery mechanism (both skill-context injections via SSOT #50 channel). Different content domain. SSOT #50 is the channel ADOPT; the content BUILD is new.

**Rationale:**
- The skill-context mechanism was designed exactly for this: injecting project-specific discipline into AIF's built-in skills without collision (SSOT #50: «occupy zero colliding agent slots, version-bump-robust»).
- For a dispatched aif task, the relevant discipline injects into the `aif-implement` skill (how to structure output, when to park, REPORT schema) and potentially `aif-plan`.
- Pairs well with B: B delivers a general `agents/` sub-agent (invocable by any AI session including non-aif); D delivers the same (or related) content via the AIF-native pipeline channel. B+D = dual-channel per `dual-implementation-discipline.md §7`.
**Con:** (a) BUILD effort: new template + `install.sh` wiring — capability commit; (b) skill-context is only read by AIF's own skills when they run — if the dispatched agent bypasses aif's skill pipeline, the skill-context is ignored; (c) content overlap risk with B if not coordinated via `@dual-pair` anchor.
**Evidence:** `install.sh:317-325` (skill-context copy pattern); `packages/core/templates/shared/skill-context/aif-review/SKILL.md:10-14` (`@dual-pair: review-sidecar` anchor confirming B+D is the correct dual-channel pattern).

---

### E — Pre-dispatch hydration step

A script (operator-side) that stages needed operator assets into the clone before dispatch — e.g. copies a subset of `~/.claude/skills/orchestrator/` into `.claude/skills/orchestrator-discipline/` in the working tree (gitignored), available to the aif agent session.

**BFR verdict:** REJECT
**Two-axis:** operator only ❌ (copies operator-specific assets; consumers lack the source files)
**Prior art:** `scripts/link-coordination.sh` (SSOT #110, ADAPT) — operator-side symlink sync; analogous pattern for CANON. That mechanism already does the pre-dispatch hydration for kickoffs; extending it for skills is technically straightforward.

**Rationale:**
- Superseded by A on the operator axis (A is simpler: one volume mount line vs a hydration script) and by B+D on the shipped axis (B+D solve the same problem portably without operator-specific source files).
- The one unique use-case (private orchestration templates not appropriate for in-repo shipping) is not the core problem here — the discipline problem is solvable via B+D.
- T-AOA-A risk: a hydration step copying `~/.claude/skills/orchestrator/SKILL.md` verbatim into the clone crosses the agent-uncommittable line if the copy is treated as an in-repo artifact.
**Con:** operator-specific, brittle (operator's skill evolves independently), T-AOA-A risk.
**Evidence:** `scripts/link-coordination.sh` exists and proves the pattern works for CANON; SSOT #110 (ADAPT verdict); but two-axis analysis shows A + B+D renders E redundant.

---

## §4 Recommended composition

**Recommended:** B + D (primary, shipped-axis); A operator-runbook (immediate unblock); C (follow-on enrichment).

**Rationale for B+D primary:**

1. **B (in-repo `agents/orchestrator-worker-discipline.md`):** Solves the shipped-axis problem portably. An aif-dispatched worker gets the REPORT schema, stage-gate section requirements, park-vs-proceed convention, and reviewer-separation discipline by reading this file — available to any consumer's aif. Same delivery pattern as `review-sidecar.md` (proven, SSOT #50 dual-channel). Capability commit.

2. **D (new skill-context template `aif-orchestrator-discipline/SKILL.md`):** Adds the AIF-pipeline-native delivery channel for the same content. Dual-pair with B via `@dual-pair` anchor. Extends `install.sh:317-325`. Capability commit.

3. **A (operator-runbook entry in `docs/runtime-bridge-setup.md`):** Documents the `docker-compose.yml` volume mount pattern for `~/.claude/skills/orchestrator/` and Superpowers. Zero code change. Immediately unblocks the operator while B+D are being built. Note that consumer projects use B+D instead.

4. **C (dispatch payload enrichment — follow-on):** Extend `buildKickoffSpec` for `<!-- include: ./path -->` directive inlining. Adds per-dispatch context richness for kickoffs with sibling audit plans. Lower priority than B+D; implement after B+D are verified working.

**E is not recommended** (superseded by A on operator axis, by B+D on shipped axis).

**Wrong if:** aif-handoff changes the skill-context read path from `.ai-factory/skill-context/` (invalidates D; SSOT #50 trigger condition covers this). Or if the dispatched aif agents already receive sufficient discipline via the kickoff content itself and no further guidance is needed (empirically falsified by the meta-orchestrator-refactor §4c incident that originated this umbrella).

---

## §5 Decision points (DN — surface only, do NOT decide)

### DN-1: operator-axis vs shipped-axis split

**The fork:** Candidate A (docker-compose volume mount) serves the **operator axis** — legitimate, costs nothing in this repo, immediately gives the operator's aif container the full orchestrator skill and Superpowers plugin. Candidates B+D serve the **shipped axis** — in-repo artifacts available to any consumer's aif.

The binding tension: what exactly goes in the B/D artifacts? If the in-repo agent carries orchestrator discipline derived from `~/.claude/skills/orchestrator/SKILL.md` content, there is a content-authorship question — is the in-repo agent an independent artifact (fine) or a disguised copy of the uncommittable skill (T-AOA-A)?

**Option A-only:** Operator solves via docker-compose; no shipped artifacts. Con: consumers get nothing; the aif agent's discipline depends on operator-machine state.
**Option B+D-only:** In-repo artifacts carry orchestrator-worker discipline independently authored. Operator also gets the content via the clone. Con: operator's full interactive orchestrator skill (887 LOC) remains unavailable in the container unless A is also applied.
**Option A + B+D combo:** Both layers — immediate operator unblock (A) + portable shipped artifact (B+D) as the durable fix. The recommended composition above. Con: two parallel solutions with partial overlap — maintaining both requires discipline.

The choice of which content belongs in B/D vs what stays operator-only (A) requires resolving DN-2 first.

### DN-2: which assets are worth bridging?

For each asset class, should in-repo delivery (B/D) be attempted?

- **Orchestrator worker discipline** (REPORT schema, section requirements, Forward/Backward check format, stage-gate): YES candidate. This is project-specific discipline documented in `.claude/rules/` — not operator-private. An aif worker dispatched on this project should know it. Delivering via `agents/orchestrator-worker-discipline.md` is consistent with `agents/compliance-verifier.md`.
- **Reviewer-discipline** (surface DECISION-NEEDED, don't make strategy calls, two-AI review pattern): YES candidate. `.claude/rules/reviewer-discipline.md` is committed and project-scoped. Distilling the relevant conventions for an aif reviewer into an `agents/` sub-agent is appropriate.
- **Full Superpowers plugin** (brainstorming, dispatching-parallel-agents, etc.): NO for B+D. These are interactive skills requiring the CC plugin harness; not expressible as markdown sub-agents. Operator-axis A is the only path if these are needed in aif.
- **CANON kickoffs** (the orchestrator-prompts content): handled by C (dispatch payload extension) or by making kickoffs self-contained. Not a B/D concern.
- **Global orchestrator skill's Mode A/B dispatch mechanics**: borderline. The full orchestration workflow (887 LOC) is operator-private by design. A 3-5 convention subset covering «what an aif worker needs to know about being dispatched» is appropriate for B. The full interactive skill is not — T-AOA-A.

The maintainer must decide: (a) what specific discipline slice goes in B/D, and (b) whether the operator-runbook for A is sufficient for the full-skill gap or if A must be actively maintained alongside B+D.

### DN-3: docker-compose mount (A) in scope for this repo?

**The fork:**

**In-scope (runbook entry in this repo):** Add a `## Operator skill mounts (optional)` section to `docs/runtime-bridge-setup.md` showing the `docker-compose.yml` volume mount pattern for `~/.claude/skills/orchestrator/`. This repo already documents operator-side aif-handoff configuration (HTTPS remote, GH_TOKEN, Telegram, `strict_base_update` — all at `docs/runtime-bridge-setup.md:38-88`). Adding a «mount your skills» section is consistent with that pattern. Consumers who lack `~/.claude/skills/orchestrator/` see an optional section that doesn't apply — same as the Telegram section doesn't apply to operators without a Telegram account.

**Out-of-scope (operator's problem):** The operator maintains their own aif-handoff `docker-compose.yml`. Volume mounts are trivial to add. This repo should not document operator-private machine-absolute paths. Consumers who don't have `~/.claude/skills/orchestrator/` follow documentation that doesn't apply to them.

Neither option requires code changes. The decision affects documentation scope only.

---

## §6 Self-application (T15)

**Question:** when this umbrella's kickoff is later dispatched via aif, does the fix work?

**Current state (before fix):** The `aif-operator-asset-access` kickoff lives at `.claude/orchestrator-prompts/aif-operator-asset-access/kickoff.md`. It is gitignored (`.gitignore:13` — `orchestrator-prompts/*/*` excluded). When dispatched, `buildKickoffSpec` (`kickoff.ts:21-40`) reads and transmits only the kickoff body. The kickoff references `.claude/rules/build-first-reuse-default.md §1.1` and `dual-implementation-discipline.md` — these are committed files, present in the clone. The aif agent CAN read them. However, the agent has no orchestrator/reviewer discipline injected — it operates without the conventions that would govern how it structures its REPORT.

**After B+D fix:** An `agents/orchestrator-worker-discipline.md` is in the clone. The aif agent running this umbrella's kickoff can read it via CC auto-load or explicit read. The skill-context override (D) injects the discipline during AIF pipeline execution. The fix is recursive — it applies to its own dispatch.

**After C fix:** If `buildKickoffSpec` handles `<!-- include: ./sibling.md -->` directives, a kickoff can explicitly include its own sibling audit content. This umbrella's kickoff is currently self-contained (no separate audit-plan.md), so C has no immediate self-application benefit. Future kickoffs with sibling audit-plans do benefit.

**After A fix:** If the operator adds volume mounts for `~/.claude/skills/orchestrator/` and Superpowers, the aif agent dispatched to implement this umbrella has the full orchestrator skill and `reviewer` available. Strongest self-application scenario, but operator-axis only.

**Finding:** B+D is the minimally-sufficient and most portable self-application fix. Available without operator-side changes. C adds future richness for kickoffs with sibling content. A provides the full interactive skills but requires operator action and is not portable to consumers.

---

## §7 Next steps (I-phase)

After DN-1/2/3 are resolved by the maintainer:

**I1 (immediate, zero-code):** Add `## Operator skill mounts (optional)` section to `docs/runtime-bridge-setup.md` showing `docker-compose.yml` volume mount pattern for `~/.claude/skills/orchestrator/` and Superpowers plugin path. Note: consumer projects use B+D instead. Not a capability commit.

**I2 (B — new `agents/` sub-agent):** Write `agents/orchestrator-worker-discipline.md` carrying the subset of orchestrator/reviewer discipline needed by dispatched aif workers. Scope: REPORT schema, stage-gate section requirements, park-vs-proceed convention, reviewer-discipline §2 surface. Add `@cc-only-rationale` or `@dual-pair` marker. New SSOT row required (next ID after #110 per `docs/meta-factory/prior-art-evaluations.md:178`). Class + Authoritative-for header per `doc-authority-hierarchy.md §3`. Capability commit (new file ≥80 LOC).

**I3 (D — new skill-context template):** Write `packages/core/templates/shared/skill-context/aif-orchestrator-discipline/SKILL.md`. Wire in `install.sh` alongside `aif-review` and `aif-rules-check` (pattern: `install.sh:322-325`). Add `@dual-pair: orchestrator-worker-discipline` anchor + `<!-- spec-of: agents/orchestrator-worker-discipline.md -->` per `dual-implementation-discipline.md §7`. Capability commit.

**I4 (C — dispatch payload enrichment, follow-on):** Extend `packages/runtime-bridge/src/kickoff.ts:buildKickoffSpec` to resolve `<!-- include: ./relative-path -->` directives, reading and inlining referenced files with a size cap (suggested: 32KB total payload). Add tests. Capability commit.

**I5 (liveness verification):** After I2+I3, dispatch a real task and confirm the aif agent's output reflects the orchestrator-worker discipline (REPORT schema present, stage-gate sections present). Integration verification, not just unit tests — per kickoff §4 «verify a real aif dispatch then actually sees the bridged asset».

---

## §8 SSOT gap note

No existing SSOT row covers «in-repo orchestrator discipline as AI-agnostic sub-agent / skill-context for aif workers». I2+I3 above constitute a new capability area. The I-phase commit(s) must add a new SSOT row (next ID after #110) with:
- **Candidate:** in-repo orchestrator-worker discipline delivery (`agents/orchestrator-worker-discipline.md` + `skill-context/aif-orchestrator-discipline/SKILL.md`)
- **Capability:** delivering orchestrator/reviewer workflow discipline into aif-dispatched workers without requiring operator global skills in the container
- **Verdict:** BUILD (no upstream analog — SSOT sweep found no «project-scoped orchestration discipline as portable markdown sub-agent»; verified against #50 / #67 / #30 / #43)
- **Trigger to revisit:** upstream aif-handoff ships a project-context injection mechanism for operator-scoped discipline analogous to SSOT #50 skill-context; OR Claude Code ships first-class shared-discipline injection across sessions (SSOT #100 cluster follow-up)
