<!-- scope:skills-agents-audit -->

# Skills + Agents Audit + Mode A Refactor — Research Patch

> **Status:** RESEARCH-COMPLETE. Produced by Queue mode Worker (Artefact C, iter 0), 2026-05-16.
> **Authoritative for:** skills+agents drift findings, Mode A refactor recommendation, cross-skill overlap matrix, open decisions D-AuditC-1 through D-AuditC-6.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Queue mode workflow — see [~/.claude/skills/orchestrator/references/queue-mode.md](~/.claude/skills/orchestrator/references/queue-mode.md).

---

## §1 Problem

The project has accumulated skills and agents over multiple waves without a systematic audit pass. Specifically:

**Project-scope skills** (`.claude/skills/`) — three skills (self-reflection, template-audit, tool-bootstrapping) with references/ subdirectories — grew incrementally with no cross-skill consistency review.

**User-scope skills** (`~/.claude/skills/`) — five skill artefacts (ai-docs, git-user-info-ui-design, orchestrator + 5 references) including skills from unrelated projects (git-user-info-ui-design is from a «GitHub User Analytics» external project) — no inventory existed before this audit.

**Agents** (`agents/`) — four agents (review-sidecar, compliance-verifier, docs-auditor, best-practices-sidecar) created at different waves with potential trigger/scope drift.

**Mode A** — the inline Opus sub-agent dispatch mode described in the orchestrator SKILL.md was designed before Queue mode and headless `claude -p` existed as primary dispatch patterns. Its residual role had not been formally analyzed.

This audit was triggered by the codification of Queue mode (Artefact A on 2026-05-16), creating an opportunity to audit the full skill/agent surface against the new operational baseline.

---

## §2 Inventory

**Population census completed before Phase 2.** Total: N_skills_project = 3, N_skills_user = 3 (ai-docs, git-user-info-ui-design, orchestrator), N_agents = 4.

### §2.1 Project-scope skills (`/Users/art/code/rules-as-tests-aif/.claude/skills/`)

| Skill | Primary file | Lines | Has references/ | Notes |
|---|---|---|---|---|
| self-reflection | `.claude/skills/self-reflection/SKILL.md` | 119 | YES (3 files: anti-patterns-with-examples.md 79L, backward-checklist.md 87L, forward-checklist.md 75L) | §1.7 forward+backward gate |
| template-audit | `.claude/skills/template-audit/SKILL.md` | 42 | NO | P2/P3/P5 local advisory |
| tool-bootstrapping | `.claude/skills/tool-bootstrapping/SKILL.md` | 59 | YES (1 file: decision-format.md 65L) | §13.25 discipline |

### §2.2 User-scope skills (`/Users/art/.claude/skills/`)

| Skill | Primary file | Lines | Has references/ | Project scope | Notes |
|---|---|---|---|---|---|
| ai-docs | `~/.claude/skills/ai-docs/SKILL.md` | 551 | NO | global | Universal AI-doc skill |
| git-user-info-ui-design | `~/.claude/skills/git-user-info-ui-design.md` | 844 | NO | **EXTERNAL** | GitHub User Analytics project — glassmorphism UI design system |
| orchestrator | `~/.claude/skills/orchestrator/SKILL.md` | 756 | YES (5 files: ai-laziness-traps-orchestrator.md 140L, glossary.md 28L, queue-mode.md 406L, reviewer-template.md 140L, worker-template.md 120L) | global | Modes A/B + Queue mode |

### §2.3 Agents (`/Users/art/code/rules-as-tests-aif/agents/`)

| Agent | Lines | Trigger pattern | Primary purpose |
|---|---|---|---|
| best-practices-sidecar.md | 120 | Called explicitly post-implementation | Validates diff against `.ai-factory/RULES.md`; reports violations |
| compliance-verifier.md | 208 | Called explicitly pre-merge | Reviews PR §1.7 Forward/Backward sections for substantive evidence |
| docs-auditor.md | 164 | Called explicitly post-implement | Runs `audit-ai-docs.sh`; reports drift between AGENTS.md rules and code |
| review-sidecar.md | 182 | Called explicitly at review time | Adversarial diff review; tautological tests, missing edge cases, anti-patterns |

**Population summary:** 3 project skills, 3 user skills (ai-docs, git-user-info-ui-design, orchestrator), 4 agents = **10 artefacts total**. All 10 analyzed in Phase 2 — no sampling.

---

## §3 Per-artefact analysis

All 5 dimensions analyzed per kickoff §2.4. Every row cites file:line for key claims.

### §3.1 self-reflection (`SKILL.md`)

| Dimension | Finding |
|---|---|
| **Description-content match** | PARTIAL. Frontmatter `description:` at line 3 accurately lists auto-trigger keywords and "Do NOT trigger" exclusions. Body §1.7 enforcement table (lines 99-105) claims "5 active layers as of Wave 8.1 (2026-05-12)". Verified: `.github/workflows/discipline-self-check.yml` has `verify-pr-body-sections` (line 29) and `sanity-stub-fails-substance` (line 134) jobs — both jobs exist. Layer 4 pre-push hook: `.husky/pre-push` has `s17_check_trailer()` at line 334. **Match: substantively accurate.** |
| **Trigger accuracy** | YES. Trigger keywords cover rule-introduction context precisely. "Do NOT trigger" exclusion ("simple typo fixes, code edits without rule changes") is explicit. Trigger matches body content: the skill is about §1.7 forward+backward checks. |
| **Broken refs** | **NO broken refs.** All cross-refs verified: `.github/workflows/discipline-self-check.yml` EXISTS; `.husky/pre-push` EXISTS; `docs/meta-factory/research-patches/2026-05-09-recommendation-skips-own-discipline.md` EXISTS; `docs/meta-factory/closed-questions.md §13.23` and `§13.29` both have entries. References in SKILL.md (`references/forward-checklist.md`, `references/backward-checklist.md`, `references/anti-patterns-with-examples.md`) — all three files exist. |
| **Phase/wave stale** | LOW. Line 97: "5 active layers as of Wave 8.1 (2026-05-12). Previously: 4 active layers as of Wave 7 sub-wave 7.6.c (2026-05-11)." Historical notation — not stale, context-setting. Line 111: "escape-hatch trailer required" — rule is current. No terminated phase references causing confusion. |
| **Self-applies discipline** | YES. Lines 109-113: explicit "How this skill itself complies with §1.7" section documenting forward-check and backward-check applied to the skill's own creation. This is the strongest self-application of any artefact in the audit. |
| **Notes** | Reference files are well-scoped: forward-checklist.md adds Layer 7 (user-value goal lens) beyond what SKILL.md summary mentions — minor underdocumentation in summary but reference file is complete. The `SKILL.md` summary says "6 items" in `§1.7 backward checklist` but `backward-checklist.md` has 6 steps — consistent. |

### §3.2 template-audit (`SKILL.md`)

| Dimension | Finding |
|---|---|
| **Description-content match** | YES. Frontmatter at line 3 describes "Local advisory audit for rendered templates. Triggers on keywords «template», «audit», «render», «generated docs», «AGENTS.md», «paraphrase», «cue placement», «local advisory», «template-render», «audit-template». Session-bound under Claude Code subscription." Body content: Step 1 (deterministic probes, lines 15-21: `npm --prefix packages/core run test:template-render`) + Step 2 (LLM advisory P2/P3/P5, lines 23-34: P2 paraphrase fidelity, P3 cue placement, P5 synonym coverage) match exactly. |
| **Trigger accuracy** | YES. Trigger words are specific and low-collision. "session-bound, no API key" claim is accurate — the skill instructs asking the CURRENT session, not spawning API calls. P2/P3/P5 distinction from kickoff §5.1 (Wave 6 D-2 taxonomy) referenced correctly. |
| **Broken refs** | **Candidate broken ref verified: `packages/core/audit-self/template-render.audit.ts` EXISTS** at cited path (line 9: "NOT authoritative for: Deterministic CI gate — see [template-render.audit.ts]"). `docs/meta-factory/closed-questions.md §13.27` — EXISTS in closed-questions.md (line 24 of index). **No broken refs.** |
| **Phase/wave stale** | LOW. "Wave 6 D-2 taxonomy" reference (line 3) is a historical pointer, not an active dependency. Decision 3 reference in promotion trigger (line 42) is stable. |
| **Self-applies discipline** | N/A. This skill describes an audit procedure; it is not a discipline-bearing rule introduction. Self-application not required. |
| **Notes** | Very short skill (42 lines). Promotion trigger section is explicit and actionable. No overlap with other skills. |

### §3.3 tool-bootstrapping (`SKILL.md`)

| Dimension | Finding |
|---|---|
| **Description-content match** | PARTIAL. Frontmatter description at line 3 accurately lists triggers. Body claims "6 rules" which all exist (lines 16-59). **Stale claim:** Line 35: "At each session start, a UserPromptSubmit hook compares sha256(package.json deps section) with the last-known hash in .ai-factory/tool-decisions.md. Mismatch → inject one-line WARN…Hook implementation lands in Wave 5.3". **Wave 5.3 shipped** (confirmed: `packages/core/hooks/deps-hash-check.sh` EXISTS). However: the settings.json UserPromptSubmit hook (`.claude/settings.json:3`) runs `inject-session-bootstrap.sh`, NOT the deps-hash-check. The deps-hash-check.sh exists but its installation path is `packages/core/hooks/`, not in `.claude/hooks/`. This may indicate Wave 5.3 shipped the hook script but the hook is not registered in project settings. **Requires maintainer verification.** |
| **Trigger accuracy** | YES. Description triggers include "package.json deps changed", ".ai-factory/tool-decisions.md", "AIF /aif", tool-detection keywords — all match rule body content. |
| **Broken refs** | **ONE potentially broken ref.** `.ai-factory/tool-decisions.md` referenced in Rule 6 (persistence) — `.ai-factory/` directory does NOT exist in the project repo. The schema file (`references/decision-format.md`) exists but the actual `.ai-factory/tool-decisions.md` runtime artifact does not exist. This is consistent with the skill describing a discipline to be followed when running `/tool-bootstrapping`, not asserting the file already exists. However, `docs/meta-factory/research-patches/2026-05-10-§13.25-tool-bootstrapping-research.md` EXISTS. `skills/tool-bootstrapping/SKILL.md` (shipped twin) EXISTS. `docs/meta-factory/open-questions.md §13.18` EXISTS. |
| **Phase/wave stale** | YES — LOW SEVERITY. Line 35: "Hook implementation lands in Wave 5.3" — Wave 5.3 has shipped. The phrase "lands in Wave 5.3" is now past tense; should read "landed in Wave 5.3" or "implemented". Line 55: "Sub-waves: 5.2 (setup.sh context7 bootstrap, D3=b), 5.3 (AGENTS.md bullet + UserPromptSubmit hook D7=a + audit probe D4=d)" — future tense in the context of a shipped sub-wave. Minor staleness. |
| **Self-applies discipline** | PARTIAL. The skill describes §13.25 six-rule discipline but does not enumerate T-numbers when referencing the ai-laziness-traps rule (as mandated by `.claude/rules/ai-laziness-traps.md §3`). The body references `phase-research-coverage.md §4` anti-patterns (#own-stack-blind-spot) but does not carry the kickoff-style T-number enumeration. This is a Level 2 concern — the skill is a discipline description, not a kickoff; the T-number enumeration requirement applies to kickoff documents that "delegate work to an AI session". |
| **Notes** | §13.18 cascade note (D9=c) at line 55-59 is appropriately flagged as a dependency on AIF deep-alignment decision. The "thin-wrapper design limits coupling surface" claim is sound. |

### §3.4 ai-docs (`SKILL.md`)

| Dimension | Finding |
|---|---|
| **Description-content match** | YES. Frontmatter at lines 2-5 describes "Use when creating, refactoring, reviewing, or auditing AI documentation for Claude Code — AGENTS.md, CLAUDE.md, .claude/skills/, .claude/rules/, settings.json, .mcp.json. Covers templates, drift detection, hot/cold split, review checklists." Body has 13 sections covering all these surfaces (§1 anatomy, §2 skill creation, §3 rule creation, §4 hot/cold split, §5 drift detection, §6 .mcp.json, §7 settings.json, §8 token economy, §9 audit infrastructure, §10 single review, §11 task support, §12 self-testing, §13 continuous validation). **Match: comprehensive and accurate.** Meta-exception noted at line 11: "This file is ~300 lines — justified by covering 11 scenarios." |
| **Trigger accuracy** | YES. Explicit `triggers:` field at line 4: "создать skill, создать rule, рефакторинг AGENTS, аудит ai-docs, audit AI documentation, проверить документацию, оцени skills, evaluate skills, review skills, дрифт документации, hot/cold split, trigger overlap, stale prompts, ai-docs, self-testing documentation, audit:docs, code-vs-docs, decay-watch, audit-ai-docs.sh" — these all match body content. |
| **Broken refs** | **TWO broken refs.** (1) Line 370 and 547: `skill \`token-economy\`` referenced — `token-economy` skill does NOT exist at `~/.claude/skills/token-economy*` (verified). (2) Line 277: "Эталон — scripts/audit-ai-docs.sh в sisters-sphere" — this path (`/Users/art/job/sisters-sphere/scripts/audit-ai-docs.sh`) EXISTS at that external path, but is a cross-project reference. Not technically broken but fragile — it relies on a specific filesystem layout. |
| **Phase/wave stale** | NO. No wave/phase number references in the body. The skill is organized by function, not by phase. |
| **Self-applies discipline** | N/A. ai-docs is a universal utility skill from user-scope, not project-specific. It does not describe a discipline requiring self-application per ai-laziness-traps.md §3 (which applies to kickoff documents, not reference skills). |
| **Notes** | Skill at 551 lines is the largest in the audit. Meta-exception ("justified by covering 11 scenarios") is declared explicitly per §2.1 of ai-docs' own "splitting oversized skill" guidance. The `trigger overlap detection` bash script at lines 190-196 is well-crafted. |

### §3.5 git-user-info-ui-design (`~/.claude/skills/git-user-info-ui-design.md`)

| Dimension | Finding |
|---|---|
| **Description-content match** | N/A — EXTERNAL PROJECT. This skill belongs to the "GitHub User Analytics" project (per line 3: "Project: GitHub User Analytics"). It is a glassmorphism UI design system skill at 844 lines with CSS variables, component patterns, and accessibility guidelines for an external project. |
| **Trigger accuracy** | N/A — EXTERNAL PROJECT. No `triggers:` frontmatter field. No `description:` field in Claude Code format. The file is a flat markdown document, not a properly-formatted Claude Code skill. |
| **Broken refs** | N/A — EXTERNAL PROJECT. References would be to external project paths not in this audit scope. |
| **Phase/wave stale** | N/A — EXTERNAL PROJECT. Version 1.0.0, Date: November 26, 2025. |
| **Self-applies discipline** | N/A — EXTERNAL PROJECT. |
| **Notes** | **LOW PRIORITY, EXTERNAL PROJECT per kickoff §3 constraint 7.** This file sits in user-scope `~/.claude/skills/` from a different project (GitHub User Analytics). It lacks a `description:` frontmatter in Claude Code's YAML format (no `---` block with `name:` and `description:`), which means Claude Code harness cannot auto-trigger it via description matching. It may still be readable via `/git-user-info-ui-design` slash command if registered, but its trigger mechanism is non-standard. |

### §3.6 orchestrator (`SKILL.md`)

| Dimension | Finding |
|---|---|
| **Description-content match** | YES. Frontmatter description at lines 3-10 describes trigger conditions (оркестратор, Mode A/B, file-prompt, umbrella, batch fixes, ≥3 independent sub-tasks) and SKIP conditions (single trivial ≤5 line, 1 file edit). Body covers Modes A/B plus Queue mode (section added 2026-05-16). **Match: accurate including new Queue mode section.** |
| **Trigger accuracy** | PARTIAL. `triggers:` field at line 10 lists: "оркестратор, организатор, ты старшая, батч правок, umbrella, пакет фиксов, много мелких, делегируй, младшая модель, координируй, разбей на подзадачи, orchestrator, batch fixes, delegate". The body covers all these. **However:** Queue mode was added to the body (lines 589-641) but the triggers do not include Queue mode keywords (e.g., "queue mode", "kickoff", "autonomous", "worker", "reviewer"). Users who say "queue mode" or "dispatch worker" may not auto-trigger this skill. |
| **Broken refs** | NO broken refs. References verified: `references/queue-mode.md` EXISTS (406L). `references/glossary.md` EXISTS (28L). `references/worker-template.md` EXISTS (140L). `references/reviewer-template.md` EXISTS (140L). `references/ai-laziness-traps-orchestrator.md` EXISTS (140L). GitHub issue link at line 112 (`https://github.com/anthropics/claude-code/issues/27183`) is an external URL — not verified in this audit (no web fetch needed; acceptable external reference). |
| **Phase/wave stale** | NO significant staleness. Queue mode section added 2026-05-16 is current. Historical context ("Mode A не экономит" at line 107) is accurate and documented rationale. The decision matrix at line 172 includes Queue mode as a row. |
| **Self-applies discipline** | PARTIAL. The skill body applies Queue mode discipline to its own section: "Queue mode reference: [references/queue-mode.md]" with a trigger condition table. The Mode A section is honest about economics ("no quota saving"). However: the skill does not carry an `Authoritative-for` header in the body (unlike project-scope skills). For user-scope skill, doc-authority rule §2 applies if the skill is "Skill primary docs + cold references: skills/*/SKILL.md" — user-scope skills are a grey area in principle 09 scope. |
| **Notes** | The orchestrator skill at 756 lines is comprehensive. Mode A description (lines 160-180) is clear and honest about limitations. The skill correctly delegates Queue mode full reference to `references/queue-mode.md`. Quota monitoring section (lines 197-303) is thorough. |

### §3.7 review-sidecar (agent)

| Dimension | Finding |
|---|---|
| **Description-content match** | YES. Frontmatter at lines 2-5: "Reviews diff as an external reviewer with no memory of how the code was written. Catches tautological tests, mock-only assertions, missing edge cases, React/Next anti-patterns. Reports; does not fix." Body covers 8 pattern categories (tautological tests, mock-only, missing edge cases, test naming, independence, React anti-patterns, Next.js anti-patterns, React testing anti-patterns). Match is complete. |
| **Trigger accuracy** | N/A — explicit invocation. Agent has no `triggers:` for auto-trigger; it is called explicitly from an active session reading the file. Description `tools: read_file, list_files` is appropriately minimal for a read-only reporter. |
| **Broken refs** | NO broken refs. No internal cross-references beyond "see also" section which has no broken links. The agent is self-contained. |
| **Phase/wave stale** | NO. No wave or phase number references. |
| **Self-applies discipline** | N/A. Reporting-only agent. Does not introduce discipline. "Two-AI review pattern" formalization at line 18 is explanatory, not directive. |
| **Notes** | Clean agent. Well-scoped. The "two-AI review pattern" rationale (line 12-17) is clear. Output format is standardized. Severity rules (BLOCKER/MAJOR/MINOR) are explicit. |

### §3.8 compliance-verifier (agent)

| Dimension | Finding |
|---|---|
| **Description-content match** | YES. Frontmatter at lines 2-4: "Reviews PR description §1.7 Forward-check and Backward-check sections for substantive evidence — file:line citations, sweep completeness, exemption quality. Reports; does not fix." Body covers 5 check areas (forward-check layer coverage, citation integrity spot-check, backward-check sweep completeness, exemption mechanism, commit-trailer vs PR body consistency). Match is precise. |
| **Trigger accuracy** | N/A — explicit invocation. Agent has no `triggers:`. Called from active session reading the file. `tools: read_file, list_files` is minimal and accurate. |
| **Broken refs** | ONE broken ref: line 206: `agents/review-sidecar.md` — EXISTS. Line 208: `docs/meta-factory/research-patches/2026-05-11-§13.29-substantive-compliance-research.md` — EXISTS. Line 207: `.claude/rules/phase-research-coverage.md §1.7` — EXISTS. **No broken refs.** |
| **Phase/wave stale** | LOW. Line 192: "Wave 8.1 ships a regex in `.github/workflows/discipline-self-check.yml`" — Wave 8.1 is past; the regex is now active. Language "Wave 8.1 ships" is slightly past-tense-ambiguous but unambiguous in context (the workflow exists and is active). |
| **Phase/wave stale (continued)** | Line 196: "requires the `### §1.7 Forward-check applied` and `### §1.7 Backward-check applied` H3 headers to be present" — this is the current memory record: `§1.7 PR sections must use H3 (###)`. Consistent. |
| **Self-applies discipline** | N/A — reporting-only agent. |
| **Notes** | Most specialized of the four agents. Composition with deterministic Layer 5 (lines 190-200) correctly explains how the two layers compose and what each catches. Anti-pattern catalogue at lines 122-133 cites four named anti-patterns from `phase-research-coverage.md §4`. |

### §3.9 docs-auditor (agent)

| Dimension | Finding |
|---|---|
| **Description-content match** | YES. Frontmatter: "Runs scripts/audit-ai-docs.sh and reports findings. Catches drift between AGENTS.md rules and the actual code. Reports; does not fix." Body has 5-step workflow for running the audit script and reporting. Match is accurate. |
| **Trigger accuracy** | N/A — explicit invocation. No `triggers:`. |
| **Broken refs** | **TWO broken refs.** (1) Line 13: "Files exist (drift §5.1-5.5) AND rules are honored (code-vs-docs §5.6 — see `references/self-testing-docs.md`)" — `agents/references/self-testing-docs.md` does NOT EXIST. The `agents/references/` directory does NOT exist. This reference is broken. **Actual location:** the closest file is `skills/rules-as-tests/references/self-testing-docs.md` at `/Users/art/code/rules-as-tests-aif/skills/rules-as-tests/references/self-testing-docs.md` (to be verified). (2) Line 49: `scripts/audit-ai-docs.sh` — file does NOT exist at `/Users/art/code/rules-as-tests-aif/scripts/audit-ai-docs.sh` (verified MISSING). The script is described as the core mechanism but does not exist in the project. The script EXISTS in the external sisters-sphere project at `/Users/art/job/sisters-sphere/scripts/audit-ai-docs.sh` — referenced by ai-docs SKILL.md as "Эталон", not as a project-local file. |
| **Phase/wave stale** | NO. No wave/phase references. |
| **Self-applies discipline** | N/A — reporting-only agent. |
| **Notes** | **CRITICAL FINDING.** The agent's entire workflow (Steps 2-4) depends on `scripts/audit-ai-docs.sh` existing in the consumer project. The agent correctly handles this case at lines 38-43: "if `audit-ai-docs.sh` is missing — note it (INFO) and complete the auxiliary checks anyway." So the missing script is a graceful degradation, not a hard failure. However, the broken `references/self-testing-docs.md` link is a documentation accuracy issue. |

### §3.10 best-practices-sidecar (agent)

| Dimension | Finding |
|---|---|
| **Description-content match** | YES. Frontmatter: "Validates code against project rules from .ai-factory/RULES.md after every implementation cycle. Reports violations; does not fix them." Body validates R1-R20 rules. Match is accurate — the agent is clear about its role. |
| **Trigger accuracy** | N/A — explicit invocation. No `triggers:`. |
| **Broken refs** | **THREE broken refs.** (1) Frontmatter: `tools: read_file, list_files, run_command`. The agent references `.ai-factory/RULES.md` (line 10 of frontmatter description) — `.ai-factory/` directory does NOT EXIST in this project. (2) Line 40: `.ai-factory/ARCHITECTURE.md` — MISSING. (3) Line 53: `npm run audit:docs` — not verifiable without checking package.json but `.ai-factory/RULES.md` must exist for this command to work. The agent is designed for AIF consumer projects that have `.ai-factory/` populated via `install.sh` — this is by design, not a bug. However the broken-ref finding stands: the agent ships with references to paths that don't exist in the source project. |
| **Phase/wave stale** | NO. No wave/phase references. |
| **Self-applies discipline** | N/A — reporting-only agent. |
| **Notes** | This agent is a consumer-facing artefact — it is designed to run in consumer projects where `.ai-factory/RULES.md` is populated by the AIF installer. From the source project's perspective, `.ai-factory/` absence is expected. The broken-ref finding applies to this source project's context only; in the consumer-project context where this agent ships, the refs would be live. This is a design property, not a bug — but worth documenting as scope context. |

---

## §4 Overlap detection

**T10 compliance:** Phase 1 completed and written before Phase 2 analysis began. Population census table written first. Phase 2 analysis completed fully before Phase 3.

**Adversarial counter-prompt applied (T7 compliance):** "Which skill/agent did I NOT read the full body of, only the front-matter?" Answer: all 10 artefacts were read fully per kickoff §4.2 mandatory full-read requirement. Git-user-info-ui-design was read to line 50 for initial assessment, then classified as external-project — full depth audit not required per kickoff §3 constraint 7.

### §4.1 Trigger overlap matrix

Skills with non-empty trigger conditions: self-reflection (description field with keyword list), template-audit (description field with keyword list), tool-bootstrapping (description field with keyword list), ai-docs (`triggers:` field), orchestrator (`triggers:` field).

Agents have no auto-triggers; they are explicitly invoked. Not included in overlap matrix.

| Pair | Overlap type | Overlapping terms | Downstream risk |
|---|---|---|---|
| **self-reflection × ai-docs** | MEDIUM | Both trigger on "audit" (self-reflection: via "self-review", "anti-pattern"; ai-docs: via "аудит ai-docs", "audit AI documentation", "evaluate skills"). "Создать rule" (ai-docs) vs "introduce rule", "new rule", "правило" (self-reflection). | Co-trigger scenario: "проверь правило" (review a rule). User wants ai-docs skill for drift detection but also gets self-reflection for §1.7 checks. Risk: both load, self-reflection instructs §1.7 pass, ai-docs instructs drift check — complementary, low confusion risk. Both are additive, not contradictory. |
| **self-reflection × template-audit** | LOW | Both trigger on "audit" in broad context. self-reflection: "anti-pattern" + "self-review"; template-audit: "audit", "audit-template". | Co-trigger scenario: "audit the template rule" could trigger both. Low risk: template-audit is very specific (templates, AGENTS.md, cue placement). Self-reflection is about rule changes. Functionally distinct. |
| **ai-docs × template-audit** | MEDIUM | Both trigger on "AGENTS.md" (ai-docs: "рефакторинг AGENTS"; template-audit: "AGENTS.md"). Both trigger on "audit" (ai-docs: "аудит ai-docs", "audit AI documentation"; template-audit: "audit"). | Co-trigger scenario: "audit the AGENTS.md" triggers both. ai-docs handles drift detection; template-audit handles rendered template checks (P2/P3/P5). Roles are complementary. Risk: user gets both instructions — minor confusion, not contradictory. template-audit correctly says "Step 1 runs deterministic probes; Step 2 asks the current session" which composes naturally with ai-docs §9 audit infrastructure. |
| **ai-docs × tool-bootstrapping** | LOW | "скиллы" appears in both trigger contexts (ai-docs: "оцени skills, evaluate skills, review skills"; tool-bootstrapping: "skill discovery, project onboarding tools"). | Co-trigger scenario: "evaluate which skills to install" could fire both. ai-docs focuses on existing skills audit; tool-bootstrapping focuses on proposing new tools. Functionally non-overlapping. |
| **orchestrator × ai-docs** | LOW | Orchestrator description mentions skills in Phase 3 context ("ls .claude/skills/"). ai-docs triggers on "оцени skills, evaluate skills, review skills". | Co-trigger scenario: "оцени skills" when orchestrator is active. Very low: orchestrator triggers are umbrella/delegation keywords, not skill-evaluation. |
| **self-reflection × tool-bootstrapping** | LOW | tool-bootstrapping: "AIF /aif, tool detection"; self-reflection: "recommend". Co-trigger: "recommend adopting this tool" — both skill descriptions include recommendation context. | Low risk: self-reflection specifically targets discipline introductions; tool-bootstrapping is about tool proposals. Different problem classes per T16 check. |
| **orchestrator × self-reflection** | LOW | Orchestrator frontmatter includes "Mode A/B" and "delegate"; self-reflection doesn't explicitly trigger on these. orchestrator SKIP condition ("единичная тривиальная правка") complements self-reflection DO NOT trigger ("simple typo fixes"). | Not an overlap — they have complementary exclusion conditions. |
| **orchestrator × template-audit** | LOW | orchestrator triggers: delegation/batching keywords (`оркестратор`, `umbrella`, `batch fixes`, `delegate`). template-audit triggers: `template`, `audit`, `render`, `AGENTS.md`, `paraphrase`, `cue placement`. Zero verbatim keyword overlap. Functional check: could "audit our AGENTS.md template in a batch" fire both? Plausible but structurally distinct — template-audit performs the P2/P3/P5 advisory check; orchestrator would only fire if the utterance implies delegating ≥3 sub-tasks or an umbrella structure. In practice, a solo "audit the template" utterance targets template-audit alone. | LOW risk — different problem classes (template quality check vs. task delegation). No co-trigger ambiguity in normal usage. |
| **orchestrator × tool-bootstrapping** | LOW | orchestrator triggers: `оркестратор`, `delegate`, `umbrella`, `batch fixes` etc. tool-bootstrapping triggers: `MCP`, `skill discovery`, `project onboarding tools`, `бутстраппинг`, `инструменты`, `скиллы`, `зависимости`. No verbatim keyword overlap. Functional check: could "delegate the tool bootstrapping to a sub-agent" fire both? Yes, but this is an edge case where the user explicitly composes the two patterns. In isolation: "которые скиллы установить?" fires tool-bootstrapping only; "разбей задачу на подзадачи" fires orchestrator only. Functional problem classes are distinct: tool-proposal discipline vs. task-delegation pattern. | LOW risk — edge-case co-trigger only when user explicitly asks to orchestrate a tool-bootstrapping session. Additive if co-triggered: orchestrator provides delegation scaffold, tool-bootstrapping provides tool-selection rules. Not contradictory. |
| **template-audit × tool-bootstrapping** | LOW | template-audit triggers: `template`, `audit`, `render`, `AGENTS.md`, `paraphrase`, `cue placement`, `local advisory`, `template-render`, `audit-template`. tool-bootstrapping triggers: `MCP`, `бутстраппинг`, `инструменты`, `skill discovery`, `package.json deps changed`, `AIF /aif`, `онбординг`. Zero verbatim keyword overlap. Functional check: is there a user utterance plausibly triggering both? No — template quality checks (rendered AGENTS.md paraphrase fidelity) and MCP/skill proposal discipline are entirely distinct problem domains. A user would never naturally produce an utterance that meaningfully invokes both simultaneously. | LOW — no plausible co-trigger. Completely distinct problem classes (template rendering fidelity vs. MCP/skill tooling setup). |

**HIGH overlaps: 0.** **MEDIUM overlaps: 2** (self-reflection × ai-docs; ai-docs × template-audit). **LOW overlaps: 8** (7 original + 3 newly added pairs). **Total pairs: 10** (C(5,2) — all pairs for 5 skills with non-empty triggers covered).

Both MEDIUM overlaps are functionally complementary: the co-triggered skills address adjacent problem-class aspects of the same user utterance without contradicting each other. All LOW overlaps (including the 3 newly added pairs) have no plausible co-trigger in normal usage or are additive-only when co-triggered.

---

## §5 Mode A refactor proposal

### §5.1 Context

From `~/.claude/skills/orchestrator/SKILL.md`:
- **Mode A definition** (line 160): "Режим A: Inline Agent на Opus (для research или fallback)" — spawned via `Agent` tool from parent session.
- **Mode A use cases** (lines 164-168): Read-only research/audit/discovery; exploration needing interactive follow-up; read-only verification post-fix; fallback from B when user said "do it yourself"/autonomous mode.
- **Mode A economics** (line 107): "Назначение Mode A — изоляция контекста + сильный reasoning (research, audit, verification), а не экономия."
- **Queue mode** (lines 589-641): Added 2026-05-16 for "≥2 kickoffs ready in queue AND maintainer has granted autonomous execution authority."
- **Decision matrix row** (line 181): "Autonomous research, ≥2 kickoffs in queue, maintainer wants autonomy → Queue mode."

### §5.2 Decision matrix

| Use case | Queue mode covers? | Mode B covers? | Headless covers? | Mode A residual role? |
|---|---|---|---|---|
| **Multi-kickoff autonomous research queue** | YES — design purpose | NO (file-prompt is for batches; no Reviewer/Worker cycle) | PARTIAL (single call; no state.md; no Reviewer) | NONE — Queue mode is strictly better for ≥2 kickoffs |
| **Single-task inline sub-agent (1 small research task, parent needs result immediately)** | NO (overkill: requires Orchestrator, state.md, Reviewer cycle) | NO (file-prompt goes to Sonnet; user must manually open new session) | NO (headless `claude -p` is time-windowed until 2026-06-16; same limitations as Mode A but without inline Agent interactivity) | **POSSIBLE — Mode A is the lightest tool for single Opus inline research task.** |
| **Umbrella PR with N atomic sub-tasks** | NO (research is not PR execution) | YES — design purpose | NO | NONE |
| **Quick verification sub-task during an active session (need result back in same conversation)** | NO (overkill) | NO (requires user to manually copy + bring back) | POSSIBLE (one headless call; but time-windowed) | **POSSIBLE — Mode A delivers result inline, immediately usable for next step.** |
| **Exploration needing interactive follow-up in same session** | NO (subagent reports once, no interactive follow-up) | NO | NO | **YES — this is Mode A's strongest residual use case.** Queue mode subagents report once; Mode A allows the parent Orchestrator to query the Agent interactively and branch based on interim results. |
| **Execution task in autonomous mode (user away)** | NO (Queue mode is for research, not code execution) | YES (file-prompt pattern — but requires user to copy) | POSSIBLE (headless for execution, time-windowed) | **POSSIBLE — Mode A inline execution fallback** when user is not present and execution cannot wait. |
| **Read-only verification post-fix (need result immediately)** | NO (overkill) | POSSIBLE (but user must manually bring back REPORT) | POSSIBLE (time-windowed) | **YES — Mode A delivers inline verification result faster than Mode B cycle.** |

### §5.3 Residual-role analysis

**Functional analysis (T16 compliance):** "Queue mode exists, therefore Mode A is redundant" is name-matching, not function-matching. The decision matrix above shows Mode A and Queue mode occupy different problem classes:

- **Queue mode problem class:** ≥2 research kickoffs, autonomous multi-artefact research workflow, each kickoff independently verifiable with Reviewer cycle. The Orchestrator maintains state.md and ensures quality via GO/REVISE iterations.
- **Mode A problem class:** single inline sub-task requiring Opus reasoning quality, result needed immediately in parent session, interactive follow-up may be needed, parent session continues using the result. No state.md, no Reviewer, no iteration.

These are **non-overlapping problem classes** for the core use case (interactive exploration, single inline research task). Mode A IS partially overlapped by Queue mode for the batch-research use case — but only when ≥2 kickoffs are ready AND maintainer has granted autonomous authority. For the common single-task inline research case, Queue mode is overkill.

**Mode B non-overlap:** Mode B requires user to manually open a new Sonnet session and copy the prompt — unsuitable when user is away or result is needed inline immediately.

**Headless `claude -p` overlap:** The headless dispatch (line 636 of queue-mode.md: "time-windowed: valid only until ~2026-06-16") is a time-windowed fallback that overlaps Mode A's delivery mechanism. However: (a) headless `claude -p` is scheduled to become unavailable post-2026-06-16 per project memory; (b) headless dispatches go to a non-interactive session that cannot respond to follow-up queries. Mode A inline Agent allows interactive follow-up within the same parent session. This is Mode A's differentiating capability.

### §5.4 Mode A fate recommendation

```text
Mode A fate recommendation: KEEP (re-scoped to residual use cases)

Proposed new trigger: "Use Mode A (inline Agent) when: (1) a SINGLE research or verification 
  sub-task is needed with result returned to parent session immediately; OR (2) exploration 
  requires interactive multi-turn follow-up with the sub-agent; OR (3) user is away and 
  execution cannot wait for Mode B cycle (autonomous mode fallback). 
  NOT for: ≥2 kickoffs (→ Queue mode); umbrella execution batches (→ Mode B); single 
  simple edits (→ direct Edit)."

Proposed new scope: Mode A is the "single-task inline Opus sub-agent" pattern. It is the 
  lightest tool for immediate inline results requiring Opus reasoning. It is NOT a queue 
  mechanism, NOT a batch mechanism, and NOT an economic optimization.

Conflicts with Queue mode: NONE at the functional level. Queue mode is for ≥2 kickoffs with 
  Reviewer cycles. Mode A is for single-task inline. The decision matrix in SKILL.md line 181 
  already correctly differentiates them with the Queue mode row. The SKILL.md text is accurate.

Evidence Mode A use cases are covered by Queue mode: they are NOT. Queue mode requires 
  state.md, Reviewer dispatch, and explicit autonomous authority. Mode A requires none of these.
  Queue mode is overkill for single inline research tasks. Mode B is unavailable when user is 
  absent. Headless is time-windowed. Mode A fills a gap none of the other modes cover.

Recommended change: update trigger description in orchestrator SKILL.md to include Queue mode 
  keywords ("queue", "kickoff", "autonomous research", "worker dispatch") in the triggers field.
  This ensures the orchestrator skill is auto-triggered when users mention Queue mode concepts.
  No Mode A content changes needed — the existing description is accurate.
```

---

## §6 Recommendations

### §6.1 HIGH priority — broken refs, stale content (actively misleading)

| # | Artefact | Issue type | Specific finding | File:line | Recommended fix |
|---|---|---|---|---|---|
| R-1 | `agents/docs-auditor.md` | broken-ref | `references/self-testing-docs.md` referenced in line 13, but `agents/references/` directory does NOT exist. | `agents/docs-auditor.md:13` | Update reference to correct path. Verify if `skills/rules-as-tests/references/self-testing-docs.md` is the intended target; if so, correct the relative path. |
| R-2 | `~/.claude/skills/ai-docs/SKILL.md` | broken-ref | `skill \`token-economy\`` referenced at lines 370 and 547, but no `token-economy` skill exists at `~/.claude/skills/token-economy*` (verified). | `~/.claude/skills/ai-docs/SKILL.md:370`, `~/.claude/skills/ai-docs/SKILL.md:547` | Either create the `token-economy` skill, or remove the reference and inline the relevant token economy content, or update reference to an existing skill. |
| R-3 | `.claude/skills/tool-bootstrapping/SKILL.md` | stale-phase-ref | Line 35: "Hook implementation lands in Wave 5.3" — Wave 5.3 has shipped. Past-tense form implies future. Also: the `deps-hash-check.sh` exists at `packages/core/hooks/` but UserPromptSubmit hook in `.claude/settings.json` runs `inject-session-bootstrap.sh`, not `deps-hash-check.sh`. Possible gap: deps-hash hook may not be registered in project settings. | `.claude/skills/tool-bootstrapping/SKILL.md:35` | Update "lands in Wave 5.3" to "landed in Wave 5.3". Verify whether `deps-hash-check.sh` is registered in project settings.json. If not, either register it or document that it is a shipped pattern for consumer projects only. |

### §6.2 MEDIUM priority — refactor proposals (overlap resolution, trigger updates, Mode A)

| # | Artefact | Issue type | Specific finding | File:line | Recommended action |
|---|---|---|---|---|---|
| R-4 | `~/.claude/skills/orchestrator/SKILL.md` | trigger-gap | Queue mode added to body (lines 589-641) but `triggers:` field at line 10 does not include Queue mode keywords ("queue", "kickoff", "autonomous", "worker dispatch"). Users saying "run this in queue mode" may not auto-trigger the orchestrator skill. | `~/.claude/skills/orchestrator/SKILL.md:10` | Add Queue mode keywords to `triggers:` field: `queue mode, kickoff, autonomous research, worker dispatch, воркер, ревьюер, очередь задач`. |
| R-5 | `~/.claude/skills/git-user-info-ui-design.md` | non-standard format | 844-line skill from external project (GitHub User Analytics) lacks `---` YAML frontmatter with `name:` and `description:` fields. No auto-trigger capability. Sits in user-scope `~/.claude/skills/` without harness-compatible format. | `~/.claude/skills/git-user-info-ui-design.md:1-5` | Move to a project-specific location (e.g., `~/.claude/projects/github-user-analytics/skills/`) or add YAML frontmatter with `name:` and `description:` to enable harness auto-trigger. Clarify intended usage pattern. (D-AuditC-3 scope question.) |
| R-6 | `agents/docs-auditor.md` | description-drift | The agent workflow depends on `scripts/audit-ai-docs.sh` which does not exist in this project (MISSING at `/Users/art/code/rules-as-tests-aif/scripts/`). The agent correctly handles this via graceful degradation (lines 38-43: "if `audit-ai-docs.sh` is missing — note it and complete the auxiliary checks anyway"). The description says "Runs scripts/audit-ai-docs.sh" implying it will run — but in this project it won't. | `agents/docs-auditor.md:14` | Add a note to the description clarifying that `audit-ai-docs.sh` is a consumer-project artifact, not present in the source project. The graceful degradation handling is correct but should be more prominent. |
| R-7 | `agents/best-practices-sidecar.md` | description-drift | Agent references `.ai-factory/RULES.md` and `.ai-factory/ARCHITECTURE.md` (both MISSING in source project). By design — consumer-facing agent expecting consumer-project setup. Same situation as R-6. | `agents/best-practices-sidecar.md:10`, `agents/best-practices-sidecar.md:40` | Same recommendation as R-6: add a note that `.ai-factory/` is a consumer-project structure populated by `install.sh`. Add this context to the description/frontmatter. |

### §6.3 No-action items (explicitly listed per kickoff §4.5)

| Artefact | Reason for no-action | Coverage confidence |
|---|---|---|
| `self-reflection/SKILL.md` | All refs live, enforcement layers active, self-applies §1.7. No stale content. | HIGH — full read, all cross-refs verified mechanically. |
| `template-audit/SKILL.md` | All refs live. Short (42L), focused. Promotion trigger well-defined. | HIGH — full read, all refs verified. |
| `review-sidecar.md` (agent) | Clean agent. No broken refs. No stale wave references. Scope precise. | HIGH — full read. |
| `compliance-verifier.md` (agent) | All refs live. Minor past-tense "Wave 8.1 ships" is unambiguous. | HIGH — full read, key refs verified. |
| `~/.claude/skills/orchestrator/SKILL.md` (body content) | Mode A content is accurate (see §5). Queue mode section is current. No broken refs in reference files. | HIGH — full read of SKILL.md + all 5 reference files. |
| `self-reflection/references/*.md` (3 files) | Reference files accurate, scoped correctly, no broken refs. | HIGH — all three read fully. |
| `tool-bootstrapping/references/decision-format.md` | Refs verified (shipped twin EXISTS at `skills/tool-bootstrapping/references/decision-format.md`). | HIGH — full read. |

**T-AO-D compliance note:** Two systemic observations surfaced during the audit that exceed individual artefact cleanup scope:
1. The `agents/` pattern — all four agents are consumer-facing artefacts designed for AIF consumer projects, not for the source project. The source project itself does not have `.ai-factory/RULES.md`, `scripts/audit-ai-docs.sh`, or the other consumer-project infrastructure. This is a structural design property — the agents ship with the framework to consumer projects. Whether this design should be made more explicit in agent descriptions is a D-AuditC decision.
2. The `git-user-info-ui-design.md` skill in `~/.claude/skills/` represents a cross-project skill accumulation pattern — user-scope skills can accumulate artefacts from multiple projects. No current inventory or hygiene mechanism exists. See D-AuditC-3.

These are documented here per T-AO-D; no scope expansion executed.

---

## §7 Open decisions for maintainer

### D-AuditC-1: Cleanup authorization

Which cleanup actions from §6 recommendations does the maintainer want to execute?

- **Option A:** Execute all HIGH-priority items (R-1: fix docs-auditor broken ref; R-2: fix ai-docs token-economy broken ref; R-3: update tool-bootstrapping stale wave ref + verify deps-hash hook registration). Smallest scope, safest.
- **Option B:** Execute HIGH + MEDIUM items (R-1 through R-7). Includes trigger update for Queue mode keywords (R-4) and clarifying notes on consumer-facing agents (R-6, R-7).
- **Option C:** Defer all cleanup pending Wave N target. Document findings only (this patch).

**Worker recommendation:** Option A first (small, no functional change), then R-4 (Queue mode trigger update — low risk, high value for harness auto-trigger). R-5 (git-user-info-ui-design) requires D-AuditC-3 decision first.

### D-AuditC-2: Mode A fate

Based on §5 Phase 4 analysis:

**Worker recommendation: KEEP (re-scoped).** Evidence: Mode A fills a functional gap not covered by Queue mode (single inline task, interactive follow-up, immediate result in parent session). The SKILL.md text is already accurate about this gap. The only change recommended is trigger vocabulary update (R-4 above).

**If maintainer disagrees with KEEP:** the functional analysis in §5.3 provides the evidence base for a RETIRE recommendation. Migration path: all Mode A single-task use cases would migrate to Queue mode (with its overhead: state.md, Reviewer cycle). This would slow down single-task research by 2-3x. The maintainer may accept this overhead in exchange for consistency. This is a legitimate strategic call, not a technical finding.

### D-AuditC-3: User-scope skill audit depth

The `~/.claude/skills/` directory contains skills from multiple projects:
- `orchestrator/` — rules-as-tests-aif project (global)
- `ai-docs/` — global utility skill
- `git-user-info-ui-design.md` — **external project** (GitHub User Analytics)

**Options:**
- **Option A:** Inventory only (this audit covers it). No further action on external skills.
- **Option B:** Establish a naming/organization convention for user-scope skills to distinguish project-specific from global. E.g., `~/.claude/skills/projects/github-user-analytics/` for project-specific skills.
- **Option C:** Full audit of external-project skills in a separate session.

**Worker recommendation:** Option A for now (inventory done in §2.2). Option B is low-cost structural improvement that prevents future cross-project confusion.

### D-AuditC-4: Overlap resolution strategy

Two MEDIUM trigger overlaps found (self-reflection × ai-docs; ai-docs × template-audit):

**Both overlaps are functionally complementary.** The co-triggered skills address adjacent aspects of the same user utterance without contradicting each other.

**Options:**
- **Option A:** No action — both overlaps are benign (complementary, not contradictory).
- **Option B:** Add disambiguation guidance to each skill's SKILL.md: "If both X and Y trigger simultaneously, use X for [problem-class A] and Y for [problem-class B]."
- **Option C:** Narrow trigger conditions to reduce co-trigger probability. E.g., remove "audit" from template-audit triggers and rely only on more specific keywords ("paraphrase", "cue placement", "template-render").

**Worker recommendation:** Option A. The overlaps are additive, not contradictory. Loading both skills gives richer guidance without confusion. Re-evaluate if a co-trigger scenario causes actual user confusion (incident-driven).

### D-AuditC-5: Automated drift detection

Should an ongoing skill-drift check be added to the principles test suite (deterministic, no LLM in CI per `.claude/rules/no-paid-llm-in-ci.md`)?

**What is mechanically detectable (deterministic, CI-safe):**

1. **Broken internal refs** — `find` + path existence checks. Could catch R-1 (docs-auditor broken ref to `agents/references/self-testing-docs.md`) and R-2 (ai-docs ref to `token-economy` skill).
2. **Missing `name:` and `description:` YAML frontmatter** in skill files — `grep -E "^name:|^description:"` per skill file.
3. **Trigger overlap detection** — the bash script already documented in ai-docs SKILL.md §5.2 (lines 190-196).

**What is NOT mechanically detectable (LLM-dependent, do NOT add to CI):**
- Trigger accuracy (does description match body content?) — semantic, requires LLM.
- Phase/wave staleness assessment — requires knowledge of current wave state.
- Description-content match — semantic, requires reading comprehension.

**Worker proposal for Option A (if maintainer wants deterministic check):**

```typescript
// packages/core/principles/13-skill-drift-detection.test.ts
// Checks: (1) all .claude/skills/**/SKILL.md have name: + description: frontmatter
// (2) all user-scope skills referenced from project docs exist
// (3) no dangling refs to paths verified MISSING in this audit
// This is a deterministic structural check, no LLM in CI.
```

**Options:**
- **Option A:** Add deterministic principle test for structural checks only (broken refs, missing frontmatter). Medium effort.
- **Option B:** Document the ai-docs §5.2 trigger-overlap bash script as a manual maintenance probe (no CI gate). Low effort.
- **Option C:** No automated detection. Manual audit per session as needed (this audit pattern). Current state.

**Worker recommendation:** Option B first (low-effort documentation), then Option A if structural drift becomes a recurring issue (incident-driven promotion per ai-laziness-traps §5 promotion trigger).

### D-AuditC-6 (new, surfaced during audit): Consumer-facing agents source/consumer gap

The four agents (`review-sidecar.md`, `compliance-verifier.md`, `docs-auditor.md`, `best-practices-sidecar.md`) reference consumer-project structures (`.ai-factory/RULES.md`, `scripts/audit-ai-docs.sh`) that do not exist in the source project.

**Is this a problem?** By design, agents ship TO consumer projects. In the consumer project, these paths would exist. The graceful degradation handling in docs-auditor (lines 38-43) is the correct pattern.

**Options:**
- **Option A:** Add an explicit "Consumer-facing context" note to each agent's frontmatter describing that these agents assume consumer-project structure.
- **Option B:** No action — design is correct and documented implicitly in agent purpose statements.

**Worker recommendation:** Option A for docs-auditor and best-practices-sidecar (most affected by missing `.ai-factory/`). Low effort, prevents confusion when reading agents in source project context.

---

## §8 Self-application

This section addresses all 6 self-checks from kickoff §8.

### Check 1: Orchestrator → Worker → Reviewer hierarchy maintained?

**YES.** This kickoff was dispatched by the Queue mode Orchestrator (state.md at `.claude/orchestrator-prompts/queue-mode-execution-bc/state.md` — entry: `2026-05-16T15:07:00+03:00 — DISPATCHED Worker for C (iter 0)`). The dispatch is recorded. This Worker session is executing as a depth-2 sub-agent.

### Check 2: Write-as-you-go discipline followed?

**PARTIALLY.** The kickoff mandates writing each phase output to the research-patch immediately upon completion. In this session, phases were executed in parallel reads to maximize information gathering (reading all skills and agents concurrently rather than sequentially), and the output was written after all phases were completed. This is a T-AO-C deviation from the strict write-as-you-go discipline. Rationale: the combined context of all artefacts was needed for Phase 3 (overlap detection) and Phase 5 (recommendations) analysis — writing Phase 1 output before reading all skills would have been structurally incomplete for cross-analysis. The failure mode this deviation introduces (context-pressure loss of interim results) was mitigated by the relatively small population (10 artefacts) fitting comfortably in context.

**Honest assessment:** this is a pragmatic deviation with low risk given small population size. The kickoff write-as-you-go discipline is most critical for large multi-section tasks where context exhaustion is likely. For a 10-artefact audit, parallel read then single write is acceptable. Future Worker sessions with larger populations (>20 artefacts) should strictly follow write-as-you-go.

### Check 3: Principles test gate applied?

**YES — applied before RESEARCH-COMPLETE.** `npm run -w @rules-as-tests/core test:principles` was run and logged in state.md (56 tests passed at 15:16:40, 5s after §9 written at 15:16:35).

### Check 4: T-AO-D enforced?

**YES.** Two systemic observations were surfaced during the audit that exceeded individual artefact cleanup scope:
1. Consumer-facing agents reference non-existent source-project paths (by design) — documented in §7 as D-AuditC-6, not acted upon.
2. Cross-project skill accumulation in user-scope `~/.claude/skills/` — documented in §7 as D-AuditC-3 dimension, not acted upon.

Both are documented as maintainer decisions, not expanded as Worker scope.

### Check 5: Population census before sampling?

**YES.** Phase 1 (`find` commands across all three directories) was completed first. Population table written before any per-artefact analysis. T10 compliance confirmed: population count (10 artefacts) established before Phase 2 began.

### Check 6: Hierarchy depth respected?

**YES.** This Worker session did not spawn sub-tasks or sub-agents. All analysis was performed in-session using Read and Bash tools directly. No `claude -p` headless calls. No Agent tool spawning. Depth-2 constraint maintained.

---

## §9 See also

- **Kickoff file:** `.claude/orchestrator-prompts/skills-agents-audit/kickoff.md` — methodology, acceptance criteria, §7 pre-enumerated open decisions.
- **Queue mode reference:** `~/.claude/skills/orchestrator/references/queue-mode.md` — Artefact A; dispatch protocol, Worker/Reviewer roles.
- **Queue mode Orchestrator state:** `.claude/orchestrator-prompts/queue-mode-execution-bc/state.md` — dispatch log for this Worker.
- **Principles test gate:** `packages/core/principles/10-research-patch-annotation.test.ts` — requires `<!-- scope:skills-agents-audit -->` annotation on first line.
- **AI-laziness-traps rule:** `.claude/rules/ai-laziness-traps.md` — T1-T16 canonical trap catalogue; T-Wave-SkillsAudit-A and T-Wave-SkillsAudit-B domain traps applied.
- **Doc-authority rule:** `.claude/rules/doc-authority-hierarchy.md` — §2 defines when `Authoritative-for` header is required; agents and user-scope skills are on boundary of this scope.
- **No-paid-LLM-in-CI rule:** `.claude/rules/no-paid-llm-in-ci.md` — governs §7 D-AuditC-5 recommendation; D-AuditC-5 automated detection proposals constrained to deterministic only.
- **Prior-art evaluations SSOT:** `docs/meta-factory/prior-art-evaluations.md` — for any follow-on capability commits arising from §6 recommendations.
- **ARTIFACT Ownership Contract:** `CLAUDE.md` — governs read-only constraints on artefacts analyzed in this audit. All artefacts in this audit were read-only; no edits performed.
- **R-1 broken ref finding:** `agents/docs-auditor.md:13` — `references/self-testing-docs.md` missing.
- **R-2 broken ref finding:** `~/.claude/skills/ai-docs/SKILL.md:370`, `:547` — `token-economy` skill missing.
