<!-- scope:rule-bootstrapping -->
# Rule-bootstrapping R-phase — research/design for the "tool-bootstrapping, but for RULES" bridge

> **Scope:** R-phase research/design only. Authoritative for the rule-bootstrapping *bridge design* (the connector between the install-time research channels and the deterministic rule factory). NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Inherits folder authority from [research-patches/README.md](README.md).
> **Date:** 2026-06-28 · **Status:** R-phase complete; Q1 (agent-driven vs code-driven) **PARKED** as a maintainer decision (see §3).
> **Deliverable contract:** this markdown is the ONLY artefact. No `.ts`/`.sh`/install file was edited. No bridge was implemented.

## §0 — TL;DR + verdict table

**The gap (one line):** the meta-factory provisions the research channels (context7 + deepwiki MCP) and ships a deterministic rule factory (`generate.ts`) + a reproducibility lock (`buildLock`), but **nothing connects research-of-coding-practices to rule generation** — the channels power *tool*-bootstrapping, and the factory's only live input is Anthropic `web_search` (not the provisioned MCP), opt-in, and never invoked by `./setup`. The lock is dead code. This R-phase designs the bridge.

| # | Subject | Verdict | Basis (inline §) |
|---|---|---|---|
| Q1 | Agent-driven vs code-driven research | **PARK** (maintainer decision) | §3 |
| Q2a | "Does AIF `/aif` already research→generate rules?" | **REJECT the falsifier** (it does not) | §2.2 |
| Q2b | ESLint custom-rule mechanism | **REUSE** (mature; already used) | §2.3 |
| Q2c | `generate.ts` factory + L4 validator | **REUSE** (already built, unwired) | §2.3 |
| Q2d | `buildLock` / `rules-lock.json` | **REUSE** (already built, dead — wire it) | §2.3, §7 |
| Q2e | tool-bootstrapping 6-rule pattern | **ADAPT** (problem-class shift; §9 T16) | §2.4, §9 |
| Q2f | AIF `/aif` stack-detect | **REUSE** (SSOT #31 ADOPT, already in tool-bootstrapping) | §2.4 |
| Q2g | The rule-research **bridge** itself | **BUILD** (no upstream; confirmed §2.1/§2.5) | §2.5 |
| Q3 | agent-findings → factory seam contract | designed (§4) | §4 |
| Q4 | `.ai-factory/rules-decisions.md` ledger | designed (§5) | §5 |
| Q5 | universal core + stack layer composition | designed (§6) | §6 |
| Q6 | reproducibility via the lock | designed (§7) | §7 |
| Q7 | no-paid-LLM-in-CI safety | designed (§8) | §8 |

**Proposed new SSOT entry: #183** (rule-research bridge, BUILD) — drafted in §11; appending to the SSOT register is I-phase work (R-phase outputs only this doc).

---

## §1 — Verified current state (grounding; every claim re-confirmed 2026-06-28)

Each line carries the `file:line` I re-read this session (not the kickoff's recon — confirmed independently).

**(1a) Channels ARE provisioned at install — but only on `--full`.**
- context7 → `.mcp.json`: [`setup.d/05-mcp.sh:17-48`](../../../setup.d/05-mcp.sh) writes `mcpServers.context7` (`@upstash/context7-mcp@latest`). Gated on `FULL` ([`05-mcp.sh:13-15`](../../../setup.d/05-mcp.sh): `if [ -z "${FULL:-}" ]; then return 0`).
- deepwiki MCP → [`setup.d/companions.manifest:17`](../../../setup.d/companions.manifest): `claude mcp add --scope user --transport http deepwiki https://mcp.deepwiki.com/mcp`, `kind=mcp`, `stacks=*`. Processed by `05-mcp.sh:50-66` (detect-first `claude mcp add`).
- **Caveat (re-confirmed):** this is the *source* repo — `cat .mcp.json` returned empty (no file). The channels materialise only in a `--full`-installed consumer. The design below must assume the channels exist **only in the consumer's interactive `./setup --full` session**, not in the framework repo and never in CI.

**(1b) Channels power TOOL-bootstrapping, NOT rule generation.**
- [`.claude/skills/tool-bootstrapping/SKILL.md:23`](../../../.claude/skills/tool-bootstrapping/SKILL.md): context7 is used to "research what MCPs exist" → persists to `.ai-factory/tool-decisions.md` (Rule 6, line 39). It reuses AIF `/aif` (SSOT #31, line 19/54).
- **Falsifier grep (re-run this session):** `grep -rln "context7|deepwiki|ask_question" packages/ .claude/skills/ skills/ agents/` returns only: `audit-self/audit-ai-docs.sh`, `validator/aif-gate-result-schema.{ts,snapshot.md}`, `principles/17-no-paid-llm-in-ci.test.ts`, `self-reflection/references/forward-checklist.md`, and the tool-bootstrapping/rules-as-tests skill docs. **Zero of these use context7/deepwiki to research CODING PRACTICES and emit RULES.** The bridge does not exist (T-RB-A satisfied: provisioned ≠ wired).

**(1c) The rule FACTORY exists, is unwired, and uses a DIFFERENT channel.**
- [`packages/core/synthesizer/generate.ts:20-90`](../../../packages/core/synthesizer/generate.ts): `synthesizeGenerate(plan, client)` turns a `GenerateClient` selection into `SynthesizedRule[]` with `check` (declarative/eslint/manual) + a paired `negative-test` ([`generate.ts:84-90`](../../../packages/core/synthesizer/generate.ts): "BOTH declarative and eslint require it").
- The `GenerateClient` port ([`generate-port.ts:14-51`](../../../packages/core/synthesizer/generate-port.ts)) supplies `ruleId + eslintConfig + examples + negativeTest`; "the LLM never authors TS" ([`generate-port.ts:4`](../../../packages/core/synthesizer/generate-port.ts)).
- Live research it CAN use = **Anthropic `web_search` ONLY**, on a 5-host allowlist: [`research/research-adapter-anthropic.ts:134-137`](../../../packages/core/research/research-adapter-anthropic.ts) (`web_search_20250305`, `allowed_domains` from `ALLOWED_SOURCES`); [`research/allowlist.ts:8-14`](../../../packages/core/research/allowlist.ts) = `next.official, react.official, tailwind.official, mdn, typescript.official`. **Not context7/deepwiki.**
- The whole live path is opt-in: [`synthesizer/cli.ts:46`](../../../packages/core/synthesizer/cli.ts) (`--generate`), [`cli.ts:63`](../../../packages/core/synthesizer/cli.ts) (`AIF_RESEARCH=llm`); default is the frozen JSON store. **`./setup` never invokes it** — re-confirmed: `grep -rn "rules-as-tests-synth|rules-as-tests-install|--generate|AIF_RESEARCH" setup.d/ install.sh setup` returns **nothing**.

**(1d) The reproducibility LOCK exists but is DEAD.**
- [`installer/install.ts:41-50`](../../../packages/core/installer/install.ts) `buildLock` → `rules-lock.json` (`ruleIds + emittedAt + sourceFingerprint`); [`install.ts:108-122`](../../../packages/core/installer/install.ts) detects lock collision/drift.
- **Callers (re-confirmed):** `grep -rln "installer/install" packages/` (excluding tests) → only `installer/cli.ts:61` (the `rules-as-tests-install` bin, [`package.json:13`](../../../packages/core/package.json)). No `./setup`/`install.sh` caller. So no `rules-lock.json` is ever produced/shipped today.

**(1e) Universal core (stable base) + stack layer.**
- 4 core ESLint rules: [`eslint-rules/index.ts:11-16`](../../../packages/core/eslint-rules/index.ts) = `no-unsafe-zod-parse, no-direct-time-randomness, require-otel-span, restricted-syntax-audit-exempt`. Shipped to ALL stacks: [`setup.d/40-configs.sh:113-120`](../../../setup.d/40-configs.sh) copies every `packages/core/eslint-rules/*.ts` into `eslint-rules-local/`; stack rules are gated (`if [ "$STACK" = "react-next" ]` at `40-configs.sh:121`).
- Stack rules = presets + synthesizer recipes. Research store is framework-scoped: `packages/core/research/store/next/{15.x,16.x,any}` + `store/shared/{tailwind...}` — **no `spa`/`react-native` store** (next + shared tailwind only).

⇒ **The vision = "tool-bootstrapping, but for RULES."** Channels ✓ provisioned, factory ✓ built, lock ✓ built, agent-research precedent ✓ exists (for tools). The **missing piece is the rule-research bridge** connecting research-of-practices to the factory. This R-phase designs it.

---

## §2 — Q2: BFR / reuse-first (gates the rest) + the AIF-already-does-it falsifier

> **Tool-availability disclosure (honesty, per kickoff Q2 constraint).** The BFR mechanism prescribes DeepWiki `ask_question` MCP + WebSearch ≥3 phrasings. **DeepWiki and context7 MCP were NOT connected in THIS environment** — `claude mcp list` showed only `claude.ai` Google services ("Needs authentication"); no `deepwiki`/`context7`. I therefore substituted **4 WebSearch phrasings + code inspection** (the AIF skills are present on disk at `/app/node_modules/ai-factory/skills/` and were read directly, which is *stronger* than a DeepWiki summary for the falsifier). I did **not** fabricate any DeepWiki result.

### §2.1 BFR layer results (web, 4 phrasings)

1. *"automatically generate ESLint rules from researched coding best practices and anti-patterns"* → the result synthesis states: **"the search results don't show tools that automatically generate rules from research databases"** while custom-rule *mechanisms* are mature ([eslint.org custom-rules](https://eslint.org/docs/latest/extend/custom-rules), [understandingdata](https://understandingdata.com/posts/custom-eslint-rules-determinism/)).
2. *"tool that researches framework conventions via LLM and produces custom lint rules with tests per project"* → surfaced **arxiv 2602.07783** "Still Manual? Automated Linter Configuration via DSL-Based LLM Compilation of Coding Standards" (= **already SSOT #173, REFERENCE**), `LintLLM` (Verilog defect-detection, wrong domain), `BitsAI-Fix` (lint-error *resolution*, not generation).
3. *"MCP context7 deepwiki generate project lint rules scaffolding agent install-time onboarding"* → **`ctx7 setup`** auto-configures Context7 MCP for Claude Code and installs *"always-on rules (like find-docs)"* — but those are **documentation-lookup `.mdc` rules**, NOT codebase-enforcement lint rules ([context7 Rules and Skills](https://deepwiki.com/upstash/context7/10.2-rules-and-skills)). The DeepWiki plugin generates **documentation wikis**, not rules. (Directly reinforces T-RB-A: a channel provisioning "rules" by name installs doc-cues, not enforcement.)
4. *"AI Factory aif Claude Code generate eslint rules from best practices research"* → **curated, hand-built** plugins from research: `Factory-AI/eslint-plugin`, `eslint-plugin-llm-core` ("20 rules from analyzing 333 bugs + 558 incorrect snippets"), a 29-rule "AI behavior" plugin ([dev.to](https://dev.to/pertrai1/i-analyzed-500-ai-coding-mistakes-and-built-an-eslint-plugin-to-catch-them-jme)). These prove the *research→rule* pattern is real **but realised as static curated plugins, not per-project live-research→generate pipelines**.

**BFR conclusion:** the *rule mechanism* (ESLint custom rules) and the *spec→rule compile* idea are mature → REUSE/REFERENCE them (the project already does). The *automated per-project bridge* "provisioned research channel → generated rule+test on a stable core" has **no production-grade upstream** (negative-existence claim backed by the 4-phrasing sweep above + the §2.2 code-level falsifier). ⇒ **BUILD the bridge** (verdict Q2g).

### §2.2 The falsifier: does a provisioned companion ALREADY do "research practices → generate rules"? — REJECTED

I read the AIF companion skills directly (`/app/node_modules/ai-factory/skills/`):

- **`/aif`** ([`aif/SKILL.md:2`](/app/node_modules/ai-factory/skills/aif/SKILL.md)): "Analyzes tech stack, installs relevant skills from skills.sh, generates **custom skills**, configures MCP servers." → generates *skills* (prose) + tool config, **no ESLint rules**.
- **`aif-architecture`**: "creates `.ai-factory/ARCHITECTURE.md`" → a **prose** architecture doc.
- **`aif-best-practices`**: "Code quality **guidelines**" + reads `.ai-factory/skill-context/aif-best-practices/SKILL.md` → **prose** guidance.
- **`aif-evolve`** (the strongest candidate — "Self-improve … based on project context"): its output is **"Skill-context rules (`.ai-factory/skill-context/*/SKILL.md`) … the compact, reusable output"** ([`aif-evolve/SKILL.md:28,40-42`](/app/node_modules/ai-factory/skills/aif-evolve/SKILL.md)). These are **markdown prose rules**, treated as "project-level overrides … same principle as nested CLAUDE.md files."
- **`aif-loop`**: "PREPARE — generate check scripts and test definitions **from rules**" — but from *user-supplied loop criteria* in a reflex loop, not from researched stack practices, and not ESLint rules for a codebase.

**Verdict — REJECT "AIF already does it."** The closest analog, `aif-evolve`, produces **prose** `skill-context/SKILL.md` rules — which is **precisely the "documents lie; tests don't" surface this project exists to convert into executable artifacts** ([README.md#why-this-exists](../../../README.md#why-this-exists)). AIF stops at the document; the rule-bootstrapping bridge's distinctive job is to carry that one step further into an **executable ESLint rule + paired-negative guarding test**. No AIF skill closes that step. The falsifier is refuted on direct evidence, not training-data recall.

### §2.3 What to REUSE (already built)

- **ESLint custom-rule mechanism** — REUSE (mature; the 4 core rules at [`eslint-rules/index.ts`](../../../packages/core/eslint-rules/index.ts) already are this). SSOT precedent: the project's whole L1 layer.
- **`generate.ts` factory + L4 validator** — REUSE verbatim. It already maps a `GenerateClient` selection → rule + negative-test, and "L4 + L5 are byte-identical … a new input path, not a change to the validator" ([`generate.ts:8`](../../../packages/core/synthesizer/generate.ts)). The bridge supplies a *new* `GenerateClient` implementation; the factory is untouched.
- **`buildLock`/`rules-lock.json`** — REUSE; it is built and tested but **dead** (§1d). The bridge's job for Q6 is to **wire** the existing `install()` into `./setup`, not to write a new lock.
- **AIF `/aif` stack-detect** — REUSE (SSOT #31 ADOPT, already consumed by tool-bootstrapping Rule 1 [`SKILL.md:19`](../../../.claude/skills/tool-bootstrapping/SKILL.md)). Same stack signal feeds rule-bootstrapping.

### §2.4 tool-bootstrapping pattern — ADAPT (not verbatim REUSE; see §9 T16)

The 6-rule loop (analyse-stack → propose → confirm-bulk → token-gate → incrementality → persistence + rejected-memory; [`SKILL.md:17-39`](../../../.claude/skills/tool-bootstrapping/SKILL.md)) is the **structural template**. But its problem-class is *tool selection from a finite registry*; ours is *rule synthesis of novel artefacts*. The §9 T16 analysis shows which rules transfer 1:1 (3,5,6) and which need re-derivation (2,4). Verdict: **ADAPT the loop shape, re-derive the propose/gate steps.**

### §2.5 What to BUILD — the bridge (Q2g)

The single new capability: **a `GenerateClient` (or its agent-session equivalent) whose research substrate is the provisioned context7/deepwiki MCP** rather than Anthropic `web_search`, plus the persistence ledger (§5) and the `./setup` wiring (§7). Backed by: §2.1 (no upstream), §2.2 (no companion does it), §1b (no in-repo wiring). This is a **load-bearing gap**, the BUILD precondition from [build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md).

---

## §3 — Q1 (PRIMARY FORK — PARKED): agent-driven vs code-driven research

> **DECISION-NEEDED (maintainer / `/orchestrator`): which channel runs the live rule-practice research?** Both designs are defensible; the choice changes where the live/non-deterministic step lives. I do **not** pick it (kickoff fork discipline + [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md)). I describe consequences and note where the evidence leans; the maintainer decides.

**Option A — Agent-driven** (a skill/agent in the consumer's interactive `./setup --full` session uses the provisioned context7/deepwiki MCP, mirroring tool-bootstrapping).
- → **Consequence (pro):** reuses the **already-provisioned, agent-facing** MCP channel (MCP is designed for agent sessions, not TS clients); $0-in-CI by construction (research happens in the human's subscription session, never in code/CI); precedent is exactly tool-bootstrapping ([`SKILL.md:23`](../../../.claude/skills/tool-bootstrapping/SKILL.md)); the deterministic factory (`generate.ts`/L4/lock) stays **100% untouched** — research is the *only* live part, the same isolation `cli.ts:63` already draws for `AIF_RESEARCH=llm`.
- → **Consequence (con):** agent output is free-form → **requires the §4 seam** to coerce findings into a schema-valid `GenerateClient` selection; the research step is harder to unit-test (it's a session, not a function); correctness leans on L4 validation downstream (acceptable — that is the CEGIS posture, SSOT #164).

**Option B — Code-driven** (extend the synthesizer TS adapter to call context7/deepwiki directly).
- → **Consequence (pro):** fits the deterministic-factory mental model; one artefact (a TS adapter) is easier to version + snapshot than a session transcript; mirrors the existing `research-adapter-anthropic.ts` shape.
- → **Consequence (con):** context7/deepwiki are **MCP servers (agent-facing)**; calling them from TS needs an **MCP client dependency** in the adapter (a new capability-commit) — the current adapter uses plain Anthropic HTTP `web_search` ([`research-adapter-anthropic.ts:121-142`](../../../packages/core/research/research-adapter-anthropic.ts)), **not** MCP; Option B would therefore **re-provision the channel in code** rather than reuse the one `./setup` already installed for the agent (a `#parallel-evolution-creep` risk, [build-first-reuse-default.md §4](../../../.claude/rules/build-first-reuse-default.md)); and it drags a live network call into a package whose default contract is CI-deterministic (must be fenced opt-in/install-time-only, like the current `--generate`).

**Where the evidence leans (NOT a decision):** Option A reuses the provisioned channel + the proven precedent + leaves the deterministic core untouched; Option B's main cost (an MCP-client dep duplicating an already-provisioned channel) is the exact thing BFR-default warns against. **But this is a genuine architecture fork with downstream-test-strategy and maintenance trade-offs → PARKED for the maintainer.** Everything in §4–§8 is written to be **valid under either option** (the seam in §4 is the pivot that makes that possible).

---

## §4 — Q3: the seam — agent/research findings → deterministic factory

The seam is the contract that lets the live part (Option A session **or** Option B adapter) stay swappable while the factory stays deterministic.

**Boundary (binding):** the live part MUST emit a value conforming to the **existing** `GenerateSelection` shape ([`generate-port.ts:45-51`](../../../packages/core/synthesizer/generate-port.ts)):
```text
GenerateSelection = { rules: GenerateCandidate[] }
GenerateCandidate = { entryId, ruleId, title, stack, eslintConfig?, examples{bad,good}, negativeTest?, presence?, selector?, message?, engine? }
```
Then `synthesizeGenerate(plan, client)` ([`generate.ts:20`](../../../packages/core/synthesizer/generate.ts)) is called **unchanged**; L4 validation + L5 emit/lock proceed exactly as today. Concretely:

1. **Live step (Option A or B)** researches stack practices via context7/deepwiki → free-form findings.
2. **Coercion step** (the seam): findings → `ResearchPlan` (`{framework, version, patterns[]}`, [`research/types.ts`]) for the menu, and a `GenerateClient.generate(menu)` that returns a `GenerateSelection`. For Option A this is a thin "session writes JSON to a path; a stub `GenerateClient` reads it" adapter (the same `--from-research <path>` pattern `cli.ts:43` already supports for plans). For Option B it is a TS `GenerateClient` impl.
3. **Deterministic tail** (unchanged, $0-in-CI): `synthesizeGenerate` → L4 gates (declarative roundtrip / anti-vacuity gates #169–#175) → `install()` → `rules-lock.json`. If L4 rejects all rules, the existing degrade-to-research-only path fires ([`cli.ts:80-83`](../../../packages/core/synthesizer/cli.ts)).

**Why this seam is correct:** it reuses the port the factory already defines, so the live channel is a **plug**, not a rewrite (this is what SSOT #174 "deterministic-first / LLM-fallback, LLM output validated deterministically" prescribes — ADOPT VOCABULARY). The live channel proposes; the deterministic compiler+validator disposes (SSOT #164 CEGIS: "validator = source of truth, generator disposable, rejection = counterexample").

**Seam invariant (the load-bearing line):** the live part may ONLY supply data that flows through `GenerateCandidate`. It MUST NOT author TypeScript ([`generate-port.ts:4`](../../../packages/core/synthesizer/generate-port.ts)) — `selector` is the single exception, and only because it is validated executably by the declarative compiler + L4 roundtrip ([`generate-port.ts:32-42`](../../../packages/core/synthesizer/generate-port.ts)).

---

## §5 — Q4: the rules-ledger `.ai-factory/rules-decisions.md` (mirror of `tool-decisions.md`)

Mirror the tool-bootstrapping persistence model (Rules 5–6, [`SKILL.md:33-39`](../../../.claude/skills/tool-bootstrapping/SKILL.md)) for rules:

- **Location:** `.ai-factory/rules-decisions.md` — committed prose (team-shared, git-auditable), parallel to `.ai-factory/tool-decisions.md`.
- **Per-entry schema (proposed):** `ruleId · stack · status{researched|proposed|accepted|rejected} · provenance(URL/source via §8 allowlist) · L4-verdict · re-eval-trigger · rejected-reason`.
- **Incrementality (Rule 5 analog):** the existing `deps-hash-check.sh` UserPromptSubmit hook already fingerprints `package.json` deps for tool-bootstrapping ([tool-bootstrapping `SKILL.md:35`](../../../.claude/skills/tool-bootstrapping/SKILL.md)). Add a `rules-deps-hash:` anchor field so a dep/stack change emits `⚠ deps changed — run rule-bootstrapping to re-evaluate`. **REUSE the hook**, add a field (no new hook).
- **Rejected-memory (Rule 6 analog):** never re-propose a rejected rule unless its `re-eval-trigger` fired. This is also the §8 cost guard against re-researching on every run.
- **Relationship to the lock:** `rules-decisions.md` is the **human-auditable decision log** (why a rule exists / was rejected); `rules-lock.json` (§7) is the **machine reproducibility record** (what was emitted + fingerprint). Two artefacts, two jobs — same split as tool-decisions (prose) vs `.mcp.json` (machine). Do not collapse them.

---

## §6 — Q5: universal core + stack layer composition

Make the **today-implicit** split explicit (§1e):

- **Universal core (stable, hand-authored, shipped to ALL stacks):** the 4 core ESLint rules ([`eslint-rules/index.ts`](../../../packages/core/eslint-rules/index.ts)) + the 29 principle tests. **Never** touched by rule-bootstrapping — this is the "trusted seed" (SSOT #166 self-hosting analogy: the stage-0 seed is trusted, not re-derived). Rule-bootstrapping output is **additive only**.
- **Stack layer (composed):** (a) preset rules (next: R12/R14/R20; spa: error-boundary; RN: none) + (b) synthesizer recipes (all `appliesTo:["next"]` today) + (c) **NEW: live-researched stack rules** from the bridge, emitted as `G*`-prefixed rules ([`generate.ts:50`](../../../packages/core/synthesizer/generate.ts) `const id = \`G${nextId++}\``).
- **Composition mechanism (REUSE):** `40-configs.sh` already copies core rules unconditionally and stack rules conditionally ([`40-configs.sh:113-121`](../../../setup.d/40-configs.sh)); the merge into one flat config is `mergeEslintRuleConfig` ([`generate.ts:108`](../../../packages/core/synthesizer/generate.ts)). Live-researched rules land in `eslint-rules-local/` next to core, scoped via the native flat-config `files:` primitive already designed (SSOT #182). **No new composition engine** — the core+stack layering is the existing copy+merge; rule-bootstrapping only adds entries to the stack tier.
- **Conflict rule (proposed):** a live-researched rule MUST NOT redefine a core ruleId; the ledger's `accepted` gate rejects collisions with `eslint-rules/index.ts` names (cheap grep check, $0). This keeps the core authoritative.

---

## §7 — Q6: reproducibility via the (currently dead) lock

The lock is built (§1d) but unreachable. Design:

1. **Wire `install()` into `./setup --full`** as the final rule-bootstrapping step: after the seam (§4) produces a validated `SynthesisPlan`, call `install(plan, {consumerRoot, force?})` ([`install.ts:88`](../../../packages/core/installer/install.ts)) — which already emits the 3 artefacts + `rules-lock.json` + re-validates ([`install.ts:134-159`](../../../packages/core/installer/install.ts)). This is the **single missing call**; the lock logic itself needs no change.
2. **Freeze the live source:** even though the SOURCE was live research, the OUTPUT is frozen — `rules-lock.json` records `ruleIds + sourceFingerprint` ([`install.ts:41-50`](../../../packages/core/installer/install.ts)). A re-install with the lock present and no `--force` **fails loudly on collision** ([`install.ts:108-122`](../../../packages/core/installer/install.ts)) → re-install is deterministic + auditable.
3. **Re-research is a deliberate act:** to refresh, the operator passes `--force` (or the §5 re-eval-trigger fires). Default behaviour: a second `./setup` reproduces byte-identical artefacts from the lock, never re-hitting the live channel. This is the SSOT #172 (ADAPT) anti-hand-edit posture applied to the install boundary.
4. **Ship-the-lock note:** committing `rules-lock.json` + `rules-decisions.md` makes the live-researched rule set reproducible across a team without anyone re-running research — the same reason tool-decisions is committed.

---

## §8 — Q7: no-paid-LLM-in-CI safety + install-time gating

The hard constraint ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md), enforced by principle 17): **the live research must never run in CI.**

- **Session-bound research.** Both Q1 options place research in the consumer's **interactive `./setup --full`** session (Option A = the human's MCP-enabled agent session; Option B = an opt-in `--generate`-style flag the human runs locally). Neither is reachable from `audit-self.yml`. The `FULL` gate ([`05-mcp.sh:13`](../../../setup.d/05-mcp.sh)) already fences MCP provisioning off the snapshot/CI path — rule-bootstrapping inherits that gate.
- **Deterministic tail in CI.** `synthesizeGenerate` + L4 gates + `install()`/lock are pure functions over the seam output (no network) → they CAN run in CI safely, and the principle tests already exercise them with **injected stubs** ([`generate-port.ts:7`](../../../packages/core/synthesizer/generate-port.ts) "In CI, inject stubGenerateRN / stubGenerateBad"). CI validates the *factory*, never the *research*.
- **Gating contract (binding):** (i) research = interactive `--full` only, default-off; (ii) emit/validate/lock = deterministic, lock committed; (iii) CI = lock-verify + L4 re-validate over committed artefacts only. This keeps CI $0 while the live channel stays in the human's subscription session — the identical safety model context7 already uses for tool-bootstrapping.

---

## §9 — T16: tool-bootstrapping problem-class transfer check (mandatory)

> **tool-bootstrapping problem class (X):** select the right *tools (MCP servers / skills)* from a **finite, pre-existing registry** (skills.sh, MCP list) for a detected stack. The artefact already exists; the task is *retrieval + token-economy ranking*.
> **rule-bootstrapping problem class (Y):** *synthesize novel executable artefacts* (an ESLint rule + a paired-negative guarding test) from open-ended researched practices. The artefact does **not** exist; the task is *generation + executable validation*.
> **Match? Evidence:** **PARTIAL.** The *loop shape* (detect→propose→confirm→persist→incrementality→rejected-memory) transfers; the *propose/gate internals* do not.

| tool-bootstrapping rule | Transfers to rules? | Why (evidence) |
|---|---|---|
| R1 analyse-stack | **1:1 REUSE** | same `/aif` stack signal ([`SKILL.md:19`](../../../.claude/skills/tool-bootstrapping/SKILL.md)) |
| R2 propose-set | **RE-DERIVE** | tools = pick from registry; rules = *generate + L4-validate* a novel artefact (no registry to pick from) |
| R3 confirm-bulk | **1:1 REUSE** | same Y/n consent UX |
| R4 token-economy gate | **RE-DERIVE → L4 gate** | tools weigh load-cost; rules weigh *executable validity* (anti-vacuity gates #169–#175), not token cost |
| R5 incrementality | **1:1 REUSE** | same deps-hash hook + a new anchor field (§5) |
| R6 persistence + rejected-memory | **1:1 REUSE** | `rules-decisions.md` mirrors `tool-decisions.md` (§5) |

**Conclusion:** ADAPT, do not name-match. Treating "tool-bootstrapping solved this" as "rule-bootstrapping is solved" would be the exact `#pattern-matching-on-name` trap ([ai-laziness-traps.md §2 T16](../../../.claude/rules/ai-laziness-traps.md)) — the loop looks identical, but R2/R4 (the generative+validation core) are a different problem class requiring the §4 seam + L4, which tool-bootstrapping has no analog for.

---

## §10 — T15: self-application (mandatory)

**Does the rule-bootstrapping flow generate ITS OWN enforcement, or only consumer rules?** — **Honest answer: only consumer rules.** The framework's own 4 core ESLint rules + 29 principle tests are **hand-authored**, not produced by this bridge (§1e; [`eslint-rules/index.ts`](../../../packages/core/eslint-rules/index.ts) is a static import list). The bridge is asymmetric: it researches+generates rules *for consumer stacks*, but the meta-factory's own discipline-bearing rules remain human-written and human-reviewed (the "trusted seed", SSOT #166).

This is a **recursive-self-application gap** ([phase-research-coverage.md §4 `#recursive-self-application-gap`](../../../.claude/rules/phase-research-coverage.md)) — named, not hidden. It is **defensible**, not a defect: per [CLAUDE.md](../../../CLAUDE.md), self-application is a *quality signal*, not the goal; and the core rules are the L4-equivalent trusted oracle that the generator's output is validated against — having the generator author its own oracle would be circular (the CEGIS seed must be trusted, not self-derived, SSOT #164/#166). **Surfaced as a parked sub-observation, not actioned** (would expand scope): *should a future phase dogfood the bridge by re-deriving a non-core rule via rule-bootstrapping and diffing against the hand-authored version (a "same-result test", SSOT #166)?* — maintainer's call, out of this R-phase's scope.

---

## §11 — Proposed SSOT entry #183 (BUILD) — for I-phase append

> R-phase outputs only this doc; the actual append to [prior-art-evaluations.md](../../../docs/meta-factory/prior-art-evaluations.md) (max id today = **#182**, verified `grep` this session) is I-phase work. Draft:

| 183 | Rule-bootstrapping bridge — provisioned-MCP-research → deterministic ESLint-rule+test factory, per project, on a stable core | The connector wiring context7/deepwiki research-of-coding-practices into `generate.ts`/L4/`install()`+lock, with a `rules-decisions.md` ledger | 2026-06-28 | 2026-06-28 | BUILD | **T16:** upstream analogs are (a) curated static AI-mistake plugins (`eslint-plugin-llm-core`, `Factory-AI/eslint-plugin`) — research→rule but **hand-built, not per-project automated**; (b) arxiv 2602.07783 spec→rule DSL (#173, REFERENCE — LLM front-end, not our determinism); (c) `aif-evolve` produces **prose** skill-context, not executable rules (the "documents lie" surface we convert). No production tool wires a *provisioned research channel* → *generated rule+guarding-test on a stable core* per project. WebSearch ×4 (2026-06-28) confirmed absence; DeepWiki/context7 MCP unavailable in env (noted). REUSE: `generate.ts`+L4+`buildLock` (built, unwired), ESLint mechanism, `/aif` detect (#31), tool-bootstrapping loop (ADAPT, §9 T16). BUILD = the seam (§4) + ledger (§5) + `./setup` wiring (§7). | A production tool ships per-project research-channel→lint-rule+test generation matching our class → re-evaluate ADOPT. Or: Q1 (agent vs code) resolved → split into the chosen impl. |

Related SSOT to cite in I-phase: #31 (`/aif` ADOPT), #29 (artifact annotation — ledger/lock provenance), #164 (CEGIS), #165 (Reflexion ADAPT), #166 (self-hosting seed), #172 (anti-hand-edit ADAPT), #173 (spec→rule REFERENCE), #174 (deterministic-first/LLM-fallback ADOPT VOCABULARY), #182 (flat-config `files:` scoping).

---

## §12 — AI-laziness traps honored + "which question did I under-answer?"

- **T11/T12** (don't design without the prior-art/reuse search): §2.1 ran 4 real WebSearches before any BUILD verdict; the AIF-falsifier (§2.2) was checked on direct file evidence, not recall.
- **T16** (name-trap): §9 wrote the explicit X/Y problem-class table; ADAPT, not REUSE.
- **T2/T4** (designing ≠ doing): every verdict carries an inline `file:line` or search excerpt; all of Q1–Q7 answered.
- **T15** (self-apply): §10 names the gap honestly (the bridge does NOT generate its own enforcement).
- **T20** (verdict needs same-turn evidence): each row in §0 points to a section with a tool-call excerpt.
- **T-RB-A** (provisioned ≠ wired): §1b proved the bridge's absence with grep, not with the MCP-install's presence.

**Adversarial self-check — "which question did I under-answer?"** On review, **Q3 (the seam)** was the thinnest on the *Option-A coercion* detail — how a free-form agent session reliably yields a schema-valid `GenerateSelection`. **Filling it now:** the safest Option-A coercion reuses the **existing `--from-research <path>` file contract** ([`cli.ts:43,58-62`](../../../packages/core/synthesizer/cli.ts) `validateResearchPlan(parsed)`): the agent session writes findings to a JSON file at a known path; a thin `GenerateClient` reads it; `validateResearchPlan` + L4 reject anything malformed → the non-deterministic session cannot corrupt the deterministic tail (a bad write degrades to research-only, [`cli.ts:80`](../../../packages/core/synthesizer/cli.ts), it never emits a broken rule). That makes the seam robust under Option A without trusting agent output — the validation gate is the trust boundary, exactly as CEGIS (#164) prescribes. The second-thinnest, **Q4 incrementality**, depends on whether `deps-hash-check.sh` can carry a second hash field cheaply — verified plausible (it already reads `.ai-factory/*-decisions.md` frontmatter for tool-decisions; adding a `rules-deps-hash:` sibling field is additive), but the exact hook edit is I-phase.

---

## §13 — Recommended architecture (everything EXCEPT the parked Q1)

A single new install-time flow, valid under either Q1 option:

```text
./setup --full
  └─ (existing) provision context7 + deepwiki MCP            [05-mcp.sh, FULL-gated]
  └─ (NEW) rule-bootstrapping step  ── LIVE, session-bound, $0-CI ──
       1. detect stack            → REUSE /aif (#31)
       2. research practices       → context7/deepwiki  [Q1: agent OR code — PARKED]
       3. coerce → ResearchPlan + GenerateSelection      [§4 seam; --from-research file contract]
  └─ (NEW) deterministic tail  ── pure, CI-safe ──
       4. synthesizeGenerate → L4 gates (#169–#175)      [REUSE generate.ts unchanged]
       5. install() → 3 artefacts + rules-lock.json       [REUSE install.ts — wire the dead call]
       6. record → .ai-factory/rules-decisions.md         [§5 ledger; mirror tool-decisions]
  └─ composition: G* rules land in eslint-rules-local/ beside the stable core
                   [§6; REUSE 40-configs copy + mergeEslintRuleConfig + files: scoping #182]
```

**The whole bridge is: one new research/coercion seam (§4) + one ledger (§5) + wiring three already-built-but-dead pieces (`generate.ts` path, `install()`/lock, deps-hash field).** The deterministic core, the validator, the lock, and the core+stack layering all already exist — the missing piece was never the factory; it was the **research→factory bridge**, which is what this design specifies and what SSOT #183 should record as BUILD.

**Done-state of this R-phase:** doc exists at the path; Q1–Q7 answered with inline `file:line`/search evidence; Q1 PARKED as a maintainer DECISION-NEEDED (§3); Q2 ran the real BFR + AIF-falsifier (DeepWiki MCP unavailability stated, WebSearch ×4 substituted); SSOT #183 drafted for I-phase; T15/T16/T-RB-A honored; under-answered question (Q3 coercion) surfaced and filled (§12).
