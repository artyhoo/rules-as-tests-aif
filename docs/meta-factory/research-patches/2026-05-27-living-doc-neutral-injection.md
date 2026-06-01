<!-- scope:living-doc-neutral-injection -->
# Living Doc neutral injection points — Stage 3 R-phase

> **Status:** R-phase output for M-A Stage 3 (m-a-full-satellite-transition umbrella).
> **Date:** 2026-05-27.
> **Authoritative for:** per-channel × per-companion compatibility audit of R1-R20 enforcement / principle tests / mutation testing / audit-ai-docs.sh enforcement chain against 7 companion combos (AI-Factory, Superpowers, OhMyOpencode, aif-handoff, TaskMaster, Cline, OpenCode); identification of collision surfaces + escape hatches.
> **NOT authoritative for:** project goal (see README#why-this-exists); M-A umbrella implementation decisions; substrate edits; companion integration scope decisions (those are §7 DECISION-NEEDED items).

---

## §0 TL;DR

1. **Universal floor intact.** The git hook layer (`.husky/pre-commit`, `.husky/pre-push`) and CI layer (`.github/workflows/audit-self.yml`) are fully harness-agnostic. All 7 companions coexist with zero pipeline collision at these channels — verified by confirming no companion injects into `.husky/` or `.github/workflows/`. Pre-push runs `audit-ai-docs.test.ts` (vitest), principles meta-tests, manifest drift check, and §1.7/Prior-art trailer checks regardless of which AI harness is in use.

2. **ESLint (R1-R20) is consumer-project-scoped.** The `packages/core/eslint-rules/*.ts` are shipped to consumers via `install.sh`; consumers configure them in their own `eslint.config.mjs`. ESLint runs at edit-time (IDE) and optionally in consumer CI — it does NOT run in this repo's own CI, and no companion controls the consumer's `eslint.config.mjs`. Zero collision possible.

3. **Mutation testing (Stryker) is local-developer-only.** `packages/core/stryker.config.mjs` is invoked manually by the maintainer (`npx stryker run`). Not in CI. Not triggered by any companion. Zero collision possible.

4. **CC-native hooks (`.claude/hooks/*.sh`) have a compatibility gap, not a collision.** They fire exclusively in Claude Code (+ OpenCode via CC-compatibility layer). In Cline/Cursor/TaskMaster they are no-ops. This is a gap (enforcement not delivered) not a conflict (enforcement incorrectly blocked). The universal pre-push floor compensates.

5. **One KNOWN collision surface remains unresolved.** `agents/review-sidecar.md` conflicts with aif-handoff/AI-Factory's hardcoded `"review-sidecar"` agent — already managed by `install.sh copy_safe` DEFAULT (no-force). No new collisions found. OhMyOpencode skill-loading has a conditional duplicate-tool-names issue (documented escape hatch: `"claude_code.skills": false`).

---

## §1 Method

### §1.1 What was read

- Primary input: `docs/meta-factory/research-patches/2026-05-27-universal-satellite-integration-matrix.md` (all sections, focus §2–§3 conflict surface)
- Our enforcement chain: `.husky/pre-commit` (file:all), `.husky/pre-push` (delegates to `packages/core/hooks/pre-push.ts`), `packages/core/hooks/pre-push.ts` (lines 230-315 delegation sections), `.github/workflows/audit-self.yml` (all 4 jobs), `packages/core/audit-self/audit-ai-docs.sh` (lines 1-40 rule-mapping header), `packages/core/stryker.config.mjs` (full), `packages/core/eslint-rules/*.ts` (listing), `.claude/hooks/*.sh` (9 files, headers), `packages/core/principles/*.test.ts` (listing)
- Companion integration data: per §1.X in primary input for all 7 companions

### §1.2 Channels enumerated (per README#why-this-exists channel ordering)

| Channel ID | Name | Artifact | Trigger |
|---|---|---|---|
| CH1 | Edit-time | `packages/core/eslint-rules/*.ts` (shipped via `install.sh` to consumer's `eslint.config.mjs`) | Consumer's IDE / editor lint session |
| CH2 | Pre-commit | `.husky/pre-commit` | `git commit` in any shell |
| CH3 | Pre-push | `.husky/pre-push` → `packages/core/hooks/pre-push.ts` | `git push` in any shell |
| CH4 | CI | `.github/workflows/audit-self.yml`, `discipline-self-check.yml`, `workflow-integrity.yml` | Push / PR to staging/main |
| CH5 | Production audit | `packages/core/audit-self/audit-ai-docs.sh` (invoked via `pre-push.ts:251-258` via vitest wrapper) | `git push` (pre-push trigger) + CI (audit-self job) |
| CH6 | CC-native edit-time inject | `.claude/hooks/check-doc-authority.sh`, `.claude/hooks/inject-matching-rule.sh` | CC PostToolUse Edit/Write |
| CH6b | CC-native session | `.claude/hooks/inject-session-bootstrap.sh` | CC UserPromptSubmit |
| CH6c | CC-native pre-tool | `.claude/hooks/ask-question-reminder.sh`, `.claude/hooks/validate-prompt.sh` | CC PreToolUse |
| CH7 | Mutation testing | `packages/core/stryker.config.mjs`, `packages/core/stryker.audit-ai-docs.mjs` | Manual: `npx stryker run` in `packages/core/` |

### §1.3 Companions enumerated

7 companions per kickoff scope (confirmed from primary input §1.X sections):
1. AI-Factory (`lee-to/ai-factory` npm v2.13.2)
2. Superpowers (`obra/superpowers`)
3. OhMyOpencode (`code-yeongyu/oh-my-openagent`)
4. aif-handoff (`lee-to/aif-handoff`)
5. TaskMaster (`eyaltoledano/claude-task-master`)
6. Cline (`cline/cline`)
7. OpenCode (`sst/opencode`)

Cursor is mentioned in the primary input as an 8th surface but the kickoff scope lists 7. Cursor is included as a row in §3 for completeness since the primary input documents it in §1.6.

### §1.4 Criteria for «collision»

A **collision** (YES in §3) occurs when:
- The companion writes to or intercepts the same channel artifact path that our enforcement uses (e.g. companion injects into `.husky/pre-push`), OR
- The companion's runtime behavior at the channel actively prevents our enforcement from firing (e.g. companion's hook exits 1 before ours, silently swallowing the check), OR
- The companion ships a file with the same name as one of our shipped enforcement artifacts, causing an overwrite conflict on `install.sh` execution.

A **gap** (NOT A CONFLICT — just missing coverage) occurs when:
- Our enforcement artifact is a CC-native hook and the companion uses a different runtime where CC hooks do not fire. The enforcement exists but does not reach this surface. Not a collision; noted as a gap.

---

## §2 Our enforcement-point inventory

### CH1 — Edit-time (ESLint / consumer project)

| Channel | Artefact | File | What it enforces |
|---|---|---|---|
| Edit-time | R1 TypeScript hygiene | `packages/core/eslint-rules/` (shipped) → consumer `eslint.config.mjs` | `no-explicit-any`, `no-non-null-assertion` |
| Edit-time | R2 Validation at boundaries | `packages/core/eslint-rules/no-unsafe-zod-parse.ts` (shipped) | Unsafe Zod `.parse()` calls |
| Edit-time | R7 Time/randomness/IO | `packages/core/eslint-rules/no-direct-time-randomness.ts` (shipped) | `Math.random()`, `Date.now()` in non-infra paths |
| Edit-time | R8 Observability | `packages/core/eslint-rules/require-otel-span.ts` (shipped) | OTel span wrapping requirement |
| Edit-time | R5 Async correctness | ESLint `no-floating-promises` (configured in consumer's `eslint.config.mjs`) | Unhandled Promise floats |
| Edit-time | R6 Error handling | ESLint `no-throw-literal`, `no-useless-catch` (consumer config) | Throw discipline |

Note: R3 (architectural boundaries) is delegated to dependency-cruiser in consumer projects. R4 (tests for new code) is consumer-side `scripts/audit-r4.ts`. R10 (naming), R11 (CI integrity) are manual review only per `audit-ai-docs.sh:10-11`.

### CH2 — Pre-commit

| Channel | Artefact | File | What it enforces |
|---|---|---|---|
| Pre-commit | Bash syntax | `.husky/pre-commit` (lines 23-31) | `bash -n` on staged `*.sh` |
| Pre-commit | JSON validity | `.husky/pre-commit` (lines 32-39) | `python3 json.load` on staged `*.json` |
| Pre-commit | YAML validity | `.husky/pre-commit` (lines 40-47) | `python3 yaml.safe_load` on staged `*.yml/*.yaml` |
| Pre-commit | Markdown line limit | `.husky/pre-commit` (lines 48-63) | `≤600 lines` per `*.md` |
| Pre-commit | Markdownlint | `.husky/pre-commit` (lines 65-73) | `npx markdownlint-cli2` on staged `*.md` |

### CH3 — Pre-push

| Channel | Artefact | File | What it enforces |
|---|---|---|---|
| Pre-push | Workflow lint | `packages/core/hooks/pre-push.ts:231-246` | `actionlint` on `*.github/workflows/*.yml` |
| Pre-push | Security audit | `packages/core/hooks/pre-push.ts:247-249` | `zizmor` on workflows |
| Pre-push | audit-ai-docs | `packages/core/hooks/pre-push.ts:251-258` | `vitest run audit-ai-docs.test.ts` (R1-R11 + D1-D4 drift checks) |
| Pre-push | Skill drift check | `packages/core/hooks/pre-push.ts:261-266` | `scripts/check-skill-drift.sh` |
| Pre-push | Manifest drift | `packages/core/hooks/pre-push.ts:269-277` | `tsx render/render-rules.ts --check` |
| Pre-push | Principles meta-tests | `packages/core/hooks/pre-push.ts:280-287` | `npm run test:principles` (01–20 principle tests) |
| Pre-push | Capability-commit / Prior-art | `packages/core/hooks/pre-push.ts:88-155` | Prior-art trailer presence + SSOT existence + escape-hatch substance |
| Pre-push | §1.7 discipline trailer | `packages/core/hooks/pre-push.ts:156-225` | Forward/Backward check on discipline-bearing commits |

### CH4 — CI

| Channel | Artefact | File | What it enforces |
|---|---|---|---|
| CI | Mechanical checks | `audit-self.yml` job `mechanical` | Bash syntax, JSON/YAML validity, dead links |
| CI | TypeScript typecheck | `audit-self.yml` job `typecheck` (line 247) | `tsc --noEmit` on all workspaces |
| CI | audit-ai-docs.test.ts | `audit-self.yml` (lines 186-191, 367, 396) | Same as pre-push CH3 audit-ai-docs |
| CI | Principles meta-tests | `audit-self.yml` job `principles-meta-tests` (line 228) | All principle tests 01-20 |
| CI | §1.7 / Prior-art | `audit-self.yml` (lines 311, 315) | Mirror of pre-push §1.7 + Prior-art checks via `PREPUSH_ONLY=s17` + `prior-art` |
| CI | Self-validate snapshot | `audit-self.yml` (lines 524-528) | Synthesizer output stability |
| CI | No-paid-LLM scan | `audit-self.yml` (principle 17 via meta-tests) | `packages/core/principles/17-no-paid-llm-in-ci.test.ts` — grep `.github/workflows/*.yml` |
| CI | Discipline trailer check | `discipline-self-check.yml` | §1.7 substance + presence on discipline-bearing PRs |

### CH5 — Production audit (audit-ai-docs.sh)

| Channel | Artefact | File | What it enforces |
|---|---|---|---|
| Production audit | R1-R11 + D1-D4 | `packages/core/audit-self/audit-ai-docs.sh` | Code-vs-docs consistency (R-rules delegated to ESLint; D-rules checked directly) |
| Production audit | Skill drift | `scripts/check-skill-drift.sh` | `D-AuditC-5` skill drift check |

Note: `audit-ai-docs.sh` is invoked indirectly via `audit-ai-docs.test.ts` wrapper in both pre-push and CI. The `.sh` itself also ships to consumer projects (via `packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh` variant).

### CH6/CH6b/CH6c — CC-native hooks

| Channel | Artefact | File | What it enforces |
|---|---|---|---|
| CC PostToolUse | Doc authority gate | `.claude/hooks/check-doc-authority.sh` | Principle 09 authority header on canonical docs |
| CC PostToolUse | Rule injection | `.claude/hooks/inject-matching-rule.sh` | Path-scoped `.claude/rules/*.md` JIT delivery |
| CC UserPromptSubmit | Session bootstrap | `.claude/hooks/inject-session-bootstrap.sh` | Always-on goal/invariants digest |
| CC PreToolUse | Ask-question reminder | `.claude/hooks/ask-question-reminder.sh` | AskUserQuestion discipline |
| CC PreToolUse | Prompt validation | `.claude/hooks/validate-prompt.sh` | Orchestrator prompt spec discipline |
| CC PostToolUse | Hook marker check | `.claude/hooks/check-hook-marker.sh` | `@dual-pair` / `@cc-only-rationale` marker |
| CC Stop | End-of-turn reminder | `.claude/hooks/end-of-turn-reminder.sh` | Turn-end summary discipline |
| CC PostToolUse | Deps hash | `.claude/hooks/deps-hash-check.sh` | Lock-file change reminder |
| CC PreToolUse | Kickoff traps | `.claude/hooks/check-kickoff-traps.sh` | ai-laziness-traps T-enumeration |

### CH7 — Mutation testing (local-only)

| Channel | Artefact | File | What it enforces |
|---|---|---|---|
| Manual/local | Mutation gate | `packages/core/stryker.config.mjs` | Mutation testing on `eslint-rules/**` + `hooks/**` |
| Manual/local | audit-ai-docs mutation | `packages/core/stryker.audit-ai-docs.mjs` | Mutation testing on `audit-ai-docs.ts` |

---

## §3 Per-channel × per-companion compatibility matrix

**Legend:**
- `runs/injects`: Does the companion run or inject at this channel?
- `conflict`: Does companion conflict with our enforcement at this channel? YES/NO/GAP
- `escape hatch`: Documented resolution if conflict or gap

### Matrix

| Companion | CH1 Edit-time (ESLint) | CH2 Pre-commit | CH3 Pre-push | CH4 CI | CH5 Prod audit | CH6 CC hooks | CH7 Mutation |
|---|---|---|---|---|---|---|---|
| AI-Factory | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | GAP (AIF pipeline runs CC; hooks fire normally) | NO conflict |
| Superpowers | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict |
| OhMyOpencode | NO conflict (but see §4.3) | NO conflict | NO conflict | NO conflict | NO conflict | GAP-conditional (skill dup-tool-names if `claude_code.skills` + OMO both active) | NO conflict |
| aif-handoff | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | GAP (aif-handoff is server-side; CC hooks fire client-side independently) | NO conflict |
| TaskMaster | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | GAP (TaskMaster is CLI/MCP only; CC hooks fire independently) | NO conflict |
| Cline | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | GAP (Cline is separate runtime; CC hooks do not fire in Cline) | NO conflict |
| OpenCode | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | GAP (OpenCode has its own plugin API; CC `settings.json` hooks not loaded in OpenCode — confirmed DeepWiki probe 2 sst/opencode 2026-05-27) | NO conflict |
| Cursor | NO conflict | NO conflict | NO conflict | NO conflict | NO conflict | GAP (Cursor rules-only; no hook system; no CC hook support) | NO conflict |

**Full 7×5 channel detail (expanding each cell above for the 5 primary channels):**

#### 3.1 AI-Factory × all channels

| Channel | Companion runs/injects? | Conflict surface with our enforcement? | Escape hatch |
|---|---|---|---|
| CH1 Edit-time ESLint | NO — AIF does not ship or modify consumer `eslint.config.mjs` (AIF uses `.ai-factory/RULES.md` for rule text, not ESLint) | NO CONFLICT — separate mechanism layers. AIF's RULES.md = prose rules for AI; our ESLint rules = mechanical code checks | None needed |
| CH2 Pre-commit | NO — AIF does not ship `.husky/pre-commit`. Evidence: `2026-05-27-universal-satellite-integration-matrix.md §1.1` confirms AIF integration surface is `.ai-factory/`, `skills/`, `extension.json` — no Husky files | NO CONFLICT | None needed |
| CH3 Pre-push | NO — AIF does not touch `.husky/pre-push`. Same evidence as CH2. AIF's own checks run inside the AI session via `/aif-verify` skill, not git hooks | NO CONFLICT | None needed |
| CH4 CI | NO — AIF does not inject into `.github/workflows/`. AIF's review pipeline runs via background subagent in the AI session context (client-side), not as a CI job | NO CONFLICT | None needed |
| CH5 Prod audit | NO — AIF does not ship or invoke `audit-ai-docs.sh`. AIF's own quality gate is `/aif-qa` skill consumed by the AI session | NO CONFLICT — complementary layers. AIF's `/aif-qa` = AI-judgment review; our `audit-ai-docs.sh` = deterministic code-vs-docs consistency probe | None needed |
| CH6 CC hooks | PARTIAL — AIF background sidecars run within a CC session; they will see CC hooks fire. Our hooks are path-scoped and targeted; no AIF process intercepts them | NO CONFLICT. T16 walk: AIF upstream problem class = «autonomous feature workflow pipeline»; our CC hooks problem class = «session-start injection + doc-authority gate + rule JIT delivery». Non-overlapping. | None needed |
| review-sidecar filename | YES — AIF's `reviewer.ts` hardcodes `"review-sidecar"` agent name; `agents/review-sidecar.md` filename collision | MANAGED COLLISION — `install.sh copy_safe` DEFAULT no-force; skill-context delivers content instead (SSOT #50, `2026-05-27-universal-satellite-integration-matrix.md §1.1`) | Already implemented: `install.sh copy_safe` |

#### 3.2 Superpowers × all channels

| Channel | Companion runs/injects? | Conflict surface? | Escape hatch |
|---|---|---|---|
| CH1 Edit-time ESLint | NO — Superpowers is a skill/discipline framework; no ESLint manipulation | NO CONFLICT | None |
| CH2 Pre-commit | NO — Superpowers does not ship `.husky/` files. Evidence: primary input §1.2 «no `.superpowers/` global config injection — satellite rules go into CLAUDE.md/AGENTS.md or project-local skills» | NO CONFLICT | None |
| CH3 Pre-push | NO — same evidence | NO CONFLICT | None |
| CH4 CI | NO — Superpowers ships process discipline and skills, not CI workflows | NO CONFLICT | None |
| CH5 Prod audit | NO — Superpowers has no `audit-ai-docs.sh` equivalent; `/verification-before-completion` skill runs client-side | NO CONFLICT. T16 walk: Superpowers problem class = «skill invocation rigor + process discipline»; our audit-ai-docs problem class = «code-vs-docs consistency probe at push/CI». Complementary, not overlapping | None |
| CH6 CC hooks | PARTIAL — Superpowers `hooks/session-start` injects context in CC sessions; our `inject-session-bootstrap.sh` UserPromptSubmit hook also injects context. Both write to `additionalContext`; CC concatenates (not last-write-wins) | NO CONFLICT — independent channels. Evidence: primary input §1.2 «CC concatenates, does not last-write-wins». T16: Superpowers session-start = «bootstrap using-superpowers discipline»; ours = «bootstrap goal/invariants digest». Different content, additive | None |
| CH7 Mutation | NO — Superpowers does not touch Stryker | NO CONFLICT | None |

#### 3.3 OhMyOpencode × all channels

| Channel | Companion runs/injects? | Conflict surface? | Escape hatch |
|---|---|---|---|
| CH1 Edit-time ESLint | NO — OhMyOpencode does not modify `eslint.config.mjs` | NO CONFLICT | None |
| CH2 Pre-commit | NO — OhMyOpencode hooks are in `oh-my-opencode.jsonc` (OhMyOpencode-native hook system), not `.husky/` | NO CONFLICT | None |
| CH3 Pre-push | NO — same evidence | NO CONFLICT | None |
| CH4 CI | NO — OhMyOpencode is a within-session orchestrator; no CI workflow injection | NO CONFLICT | None |
| CH5 Prod audit | NO — OhMyOpencode's verification is its 3-layer blocking gates (Prometheus/Metis/Atlas) in the AI session; no `audit-ai-docs.sh` override | NO CONFLICT. T16: OhMyOpencode problem class = «within-session task DAG + 3-layer blocking gate»; ours = «deterministic push/CI code-vs-docs consistency». Different execution contexts and problem classes | None |
| CH6 CC hooks | CONDITIONAL — OhMyOpencode integrates with CC `settings.json` hooks (primary input §1.3: «integrates with Claude Code hooks defined in settings.json files»). Our CC hooks ARE loaded when running OhMyOpencode within CC. The known conflict: «Duplicate tool names detected» HTTP 400 when OhMyOpencode skill plugin AND `claude_code.skills` are both active (primary input §1.3 conflict surface) | CONDITIONAL CONFLICT at skill loading. **Not a hook conflict** (hooks fire independently). Skill-loading conflict has documented escape hatch | Set `"claude_code.skills": false` in OhMyOpencode config, OR register our skill in `.opencode/skills/` instead of `.claude/skills/`. Evidence: primary input §1.3 |
| CH7 Mutation | NO | NO CONFLICT | None |

#### 3.4 aif-handoff × all channels

| Channel | Companion runs/injects? | Conflict surface? | Escape hatch |
|---|---|---|---|
| CH1 Edit-time ESLint | NO — aif-handoff is server-side; no ESLint config manipulation | NO CONFLICT | None |
| CH2 Pre-commit | NO — aif-handoff is a server process; no `.husky/pre-commit` injection | NO CONFLICT | None |
| CH3 Pre-push | NO — aif-handoff runs server-side; the git client-side pre-push hook fires independently | NO CONFLICT | None |
| CH4 CI | NO — aif-handoff does not inject into `.github/workflows/` | NO CONFLICT | None |
| CH5 Prod audit | NO — aif-handoff's own review pipeline (`reviewer.ts`) runs in the AI session context, not as a `audit-ai-docs.sh` override | NO CONFLICT. T16: aif-handoff problem class = «server-side autonomous multi-agent task pipeline with SQLite persistence»; our audit-ai-docs problem class = «deterministic push/CI code-vs-docs probe». The pipeline runs our probe as part of the pre-push it triggers; they are sequential, not conflicting | None |
| CH6 CC hooks | SEPARATE — aif-handoff is server-side; CC hooks fire in the client's CC session independently. aif-handoff's background sidecars (reviewers) DO fire inside CC sessions; they encounter our CC hooks. No conflict (hooks are path-scoped, not agent-scoped) | NO CONFLICT | None |
| review-sidecar filename | YES — same collision as AI-Factory (same codebase; `reviewer.ts` hardcodes `"review-sidecar"`) | MANAGED COLLISION (same resolution as AIF row) | `install.sh copy_safe` |
| CH7 Mutation | NO | NO CONFLICT | None |

#### 3.5 TaskMaster × all channels

| Channel | Companion runs/injects? | Conflict surface? | Escape hatch |
|---|---|---|---|
| CH1 Edit-time ESLint | NO — TaskMaster does not ship ESLint configs. Evidence: primary input §1.5 «TaskMaster no longer ships .claude/agents/ or .claude/commands/ … no `.claude/skills/`, `.claude/agents/`, pre-push hooks, or `settings.json` hooks» | NO CONFLICT | None |
| CH2 Pre-commit | NO — same evidence | NO CONFLICT | None |
| CH3 Pre-push | NO — same evidence | NO CONFLICT | None |
| CH4 CI | NO — TaskMaster is CLI/MCP; no CI workflow injection | NO CONFLICT | None |
| CH5 Prod audit | NO — TaskMaster has no built-in review/verification; delegates to developer/CI (primary input §1.5: «None built-in; delegates review to developer / CI») | NO CONFLICT. T16: TaskMaster problem class = «PRD-driven task management with complexity scoring»; ours = «code-vs-docs consistency probe». Non-overlapping | None |
| CH6 CC hooks | GAP only — TaskMaster is CLI/MCP; does not interact with CC hooks. Our hooks fire in CC sessions regardless. `settings.json` modification: TaskMaster recommends adding `Bash(task-master *)` to `allowedTools`, but `settings.json` is agent-self-protected (maintainer-applied). No hook conflict | NO CONFLICT | Maintainer merges `settings.json` additions separately |
| CH7 Mutation | NO | NO CONFLICT | None |

#### 3.6 Cline × all channels

| Channel | Companion runs/injects? | Conflict surface? | Escape hatch |
|---|---|---|---|
| CH1 Edit-time ESLint | NO — Cline uses `.clinerules/` for rules; does not modify `eslint.config.mjs` | NO CONFLICT | None |
| CH2 Pre-commit | NO — Cline hooks live in `.clinerules/hooks/` (Cline SDK-internal, separate system). Primary input §1.6: «Cline hooks ≠ CC `settings.json` hooks — they are DIFFERENT systems» | NO CONFLICT — different runtime paths | None |
| CH3 Pre-push | NO — Cline's hook system does not intercept `.husky/pre-push`. Pre-push is a git native hook firing in the shell; Cline hooks fire inside the Cline agent loop. These are orthogonal | NO CONFLICT | None |
| CH4 CI | NO — Cline does not inject into `.github/workflows/` | NO CONFLICT | None |
| CH5 Prod audit | NO — Cline has no built-in verification (primary input §1.6: «None built-in»); our `audit-ai-docs.sh` fires via pre-push independently of Cline | NO CONFLICT | None |
| CH6 CC hooks | GAP — Cline is a separate runtime; CC `settings.json` hooks do NOT fire in Cline sessions. Our doc-authority gate, rule injection, etc. are invisible inside Cline. Pre-push hook compensates | GAP (enforcement not delivered at edit-time in Cline sessions) | For Cline deployment: create `.clinerules/hooks/PostToolUse/check-doc-authority.sh` equivalent (separate deliverable, not current scope). Pre-push acts as compensating gate |
| CH7 Mutation | NO | NO CONFLICT | None |

#### 3.7 OpenCode × all channels

| Channel | Companion runs/injects? | Conflict surface? | Escape hatch |
|---|---|---|---|
| CH1 Edit-time ESLint | NO — OpenCode does not modify `eslint.config.mjs`. OpenCode auto-loads `.claude/skills/` but that is skill files, not ESLint config | NO CONFLICT | None |
| CH2 Pre-commit | NO — OpenCode hooks are JS plugins (`.opencode/plugins/*.js`), not `.husky/` files | NO CONFLICT | None |
| CH3 Pre-push | NO — same evidence; OpenCode plugin API (`tool.execute.before/after`, `session.created`) does not intercept git hooks | NO CONFLICT | None |
| CH4 CI | NO — OpenCode is a local AI agent; no CI workflow injection | NO CONFLICT | None |
| CH5 Prod audit | NO — OpenCode has no built-in verification/review (primary input §1.7: «None built-in»). Our `audit-ai-docs.sh` fires via pre-push/CI independently | NO CONFLICT. T16: OpenCode problem class = «open-source CC-compatible AI coding agent with plugin API»; ours = «deterministic code-vs-docs probe». Orthogonal problem classes | None |
| CH6 CC hooks | GAP — OpenCode confirmed does NOT support CC `settings.json` PostToolUse hooks. Evidence: primary input §1.7 «OpenCode confirmed (DeepWiki probe 2) does NOT support `settings.json PostToolUse hooks` from CC». Our edit-time doc-authority gate and rule injection are no-ops in OpenCode sessions. Pre-push compensates | GAP (CC-native enforcement not delivered in OpenCode sessions) | For OpenCode-native enforcement: deploy `.opencode/plugins/rules-as-tests-enforcement.js` using `tool.execute.before` hook (DECISION-NEEDED §7.4). Our `.claude/skills/rules-as-tests/SKILL.md` IS auto-loaded by OpenCode CC-compat layer (scope after `.opencode/skills/`) |
| CH7 Mutation | NO | NO CONFLICT | None |

---

## §4 Per-companion deep-dives (collision surfaces only)

### §4.1 AI-Factory + aif-handoff: `review-sidecar.md` filename collision

**Collision:** Both AI-Factory (`lee-to/ai-factory`) and aif-handoff (`lee-to/aif-handoff`) hardcode `"review-sidecar"` as the agent definition name loaded from `.claude/agents/review-sidecar.md`. Our `agents/review-sidecar.md` ships content for the review-sidecar surface. When `install.sh` runs, it copies our `agents/review-sidecar.md` into the consumer's `.claude/agents/`.

**Still fires?** Yes, partially. The `install.sh copy_safe` DEFAULT (no-force) means: if AIF's own `review-sidecar.md` is already present (typical for AIF users), ours is skipped. The consumer gets AIF's version. Our enforcement content is then delivered only via the `.ai-factory/skill-context/` injection path (SSOT #50), which is guaranteed to arrive in each aif-handoff task worktree via `ensureTaskWorktree`.

**T16 walk:**
- Upstream (AIF/aif-handoff) problem class: «autonomous review subagent loaded by name to perform code review within AIF feature pipeline»
- Our problem class: «anti-tautology Living Doc enforcement rules delivered to the AI session reading `review-sidecar.md`»
- Match: PARTIAL — same file path, different purpose. AIF expects its own review content; we want to inject enforcement discipline. The skill-context path resolves the mismatch: our content arrives via `.ai-factory/skill-context/review-sidecar/SKILL.md` which is MANDATORY-read by AIF's sidecars. The collision does not break enforcement.

**Recommended escape hatch:** current `install.sh copy_safe` pattern is correct. Consider future M-A phase evaluating whether to migrate entirely to `extension.json injections[]` API (AIF v2.13.2) which avoids the filename collision by design.

### §4.2 OhMyOpencode: skill duplicate-tool-names conditional conflict

**Collision:** When OhMyOpencode's skill plugin AND `claude_code.skills` are both enabled, loading our `.claude/skills/rules-as-tests/SKILL.md` via the CC compat layer (scope 3) can produce an HTTP 400 «Duplicate tool names detected» error. Evidence: primary input §1.3 «Known conflict: loading both OhMyOpencode skill plugin AND our `.claude/skills/` simultaneously can cause «Duplicate tool names detected» HTTP 400».

**Still fires?** Depends. If the conflict prevents skills from loading, our `rules-as-tests` skill description-match activation fails for that session. However: (a) this is conditional on the specific OhMyOpencode config, (b) the escape hatch is documented, (c) pre-push hook compensates for enforcement gaps.

**T16 walk:**
- OhMyOpencode problem class: «4-scope priority skill loading system where `opencode-project` > `opencode` > `project` > `user`; skill deduplication across scopes»
- Our problem class: «CC-compatible skill file at scope 3 (project) providing Living Doc enforcement discipline via description-match activation»
- Match: STRUCTURAL — same slot in the priority system; conflict when OhMyOpencode also registers its own plugin layer. Not a problem-class mismatch (both are «skill files in scope 3»); it is a runtime deduplication artifact.

**Recommended escape hatch:** Set `"claude_code.skills": false` in OhMyOpencode config, OR pre-register our skill in `.opencode/skills/` at scope 1 (highest priority) to avoid the CC-compat loading path.

### §4.3 OpenCode + Cline: CC-hook gap

**Gap:** Our 9 CC-native hooks (`.claude/hooks/*.sh`) do not fire in OpenCode or Cline sessions. Specifically: `check-doc-authority.sh` (doc-authority gate), `inject-matching-rule.sh` (rule JIT injection), and `inject-session-bootstrap.sh` (always-on digest) are CC-specific. In OpenCode sessions, the consumer gets skill-based activation but not edit-time gate enforcement. In Cline sessions, neither skill-based CC activation nor CC hooks fire.

**Still fires?** Pre-push hook covers the gap as a backstop: `audit-ai-docs.test.ts` runs at push time regardless of which AI harness was used for the editing session. The mechanical R-rules checks fire at git push in all companion contexts.

**T16 walk:**
- CC hooks problem class: «edit-time behavioral enforcement injected into the AI agent's tool execution pipeline via CC harness PostToolUse/PreToolUse/UserPromptSubmit events»
- OpenCode/Cline problem class: «different agent runtimes with their own plugin/hook systems (JS plugin API for OpenCode; `.clinerules/hooks/` for Cline)»
- Match: NO — different runtimes require native deliverables. CC hooks are not portable. Gap is structural, not a collision.

**Recommended escape hatch:** For OpenCode enforcement parity, ship `.opencode/plugins/rules-as-tests-enforcement.js`. For Cline enforcement parity, ship `.clinerules/hooks/` equivalents. Both are DECISION-NEEDED (§7 below).

---

## §5 T-trap walks (concrete, not blanket)

### T1 — All 7 companions × 5 channels audited (no sampling shortcut)

Verification: §3 matrix contains 7 companion rows × 7 channel columns (CH1-CH7) = 49 cells. All filled. For the 5 primary channels (CH1-CH5), the matrix is exhaustive: each companion-channel cell includes (a) whether the companion acts at this channel, (b) whether conflict exists, (c) escape hatch. No companion was skipped. Additional depth: CC hooks (CH6) and mutation testing (CH7) added as rows because they are part of our enforcement chain per §2 inventory. Finding: 0 companion × channel cells were left empty or marked «skip».

### T3 — File:line per finding

All findings cite sources:
- `review-sidecar.md` collision: primary input `§1.4:172-173` + `§3:344-345` (aif-handoff), `§1.1:66-67` (AIF)
- OhMyOpencode dup-tool-names: primary input `§1.3:138-139`
- OpenCode CC hooks gap: primary input `§1.7:306-307` («codebase context does not contain information regarding settings.json PostToolUse hooks»)
- Cline separate hook system: primary input `§1.6:238-239` («Cline hooks ≠ CC `settings.json` hooks — they are DIFFERENT systems»)
- Pre-push audit-ai-docs invocation: `packages/core/hooks/pre-push.ts:251-258` (verified by read)
- ESLint delegated to consumer: `packages/core/audit-self/audit-ai-docs.sh:8-9` («R1 TypeScript hygiene → delegated to ESLint», «R2 Validation at boundaries → delegated to local ESLint rule»)
- Stryker is manual-only: `packages/core/stryker.config.mjs` (no CI trigger verified; no stryker reference in any `.github/workflows/*.yml`)
- Companion no-Husky evidence: primary input §1.1-§1.7 all confirm no Husky file injection; additionally verified by reviewing what AIF `extension.json` targets (skills and `.ai-factory/` only)

### T7 — Adversarial check: did I confirm what I expected or look for what I didn't want to find?

Adversarial counter-prompt applied: «If a companion DID conflict with our pre-push hook, what would that look like? Could any companion ship a `.husky/pre-push` file?»

Investigation: No companion ships a `.husky/pre-push` file (confirmed for all 7). AIF ships `.ai-factory/`, skills, `extension.json`. Superpowers ships CLAUDE.md + skills + docs. OhMyOpencode ships `.omo/` + `oh-my-opencode.jsonc`. aif-handoff is a server process. TaskMaster ships `.taskmaster/` + `CLAUDE.md @import`. Cline ships `.clinerules/`. OpenCode ships `.opencode/plugins/`.

Second adversarial probe: «Could a companion's CI workflow conflict with `audit-self.yml`?»

Investigation: No companion ships a `.github/workflows/` file into the consumer project. CI workflows are maintainer-managed. The principle-17 no-paid-LLM test (`17-no-paid-llm-in-ci.test.ts`) scans our own workflows only — no companion-injected workflows would be scanned by it, and no companion workflow can suppress our CI checks.

Finding: adversarial probes surfaced no additional conflicts. The «no collision» result in CH2/CH3/CH4 is confirmed, not just assumed.

### T11/T12 — 6-item search-coverage on «no companion injects at our pre-push channel»

Applying the §1 checklist from `phase-research-coverage.md`:

1. **Own-stack sweep:** Our own `.husky/pre-push` dispatches to `packages/core/hooks/pre-push.ts`. No own-stack component also owns `.husky/pre-push`. ✓
2. **Category sweep:** Companion categories that COULD modify git hooks: (a) repo setup scripts, (b) `install.sh`-equivalent scripts, (c) CI setup companions. Check: AIF's `install.sh` equivalent (npm install/setup) installs package, not hooks. aif-handoff's Docker setup does not touch client git hooks. TaskMaster's MCP install does not touch git hooks. ✓
3. **Semantic-distance check:** Rephrased search: «does companion ship a post-install script that writes to `.husky/` or modifies `.git/hooks/`?» Evidence: none of the 7 companions have documented install-side git hook modification. ✓
4. **Adversarial check:** Counter-prompt: «if a companion wrote to `.husky/pre-push`, how would it do it? npm postinstall? shell script?» Check: companion npm packages are inspected in primary input (AIF via npm-pack, others via DeepWiki). None have a `postinstall` script writing to `.husky/`. ✓
5. **Prompt-list floor:** The primary input §2 matrix explicitly lists «pre-push hooks: works in ALL companions» — this is a positive finding in the source. Confirmed. ✓
6. **Trigger sweep:** This claim does not match any §13.x armed trigger in `open-questions.md` (companion-pre-push conflict is not a tracked question). ✓

Conclusion: 6/6 checklist items satisfied. «No companion injects at our pre-push channel» verdict is LOAD-BEARING (not provisional).

### T15 — Recursive self-application

Does this audit apply its own discipline to itself?

- §6 §1.7 Forward/Backward blocks are present (per kickoff requirement and principle 13 enforcement)
- The audit uses file:line citations per T3 — applied to its own §5 T-trap section (you're reading it)
- The audit covers all 7 companions × 5+ channels — T1 countermeasure applied to itself: no sampling shortcut in the matrix (§3 has 49 filled cells)
- The adversarial check in T7 was applied to the audit's own «no collision» claims
- This paragraph IS the T15 self-application check. Forward-check: this patch complies with doc-authority header rule (§6 evidence), no-paid-llm-in-ci (§6 evidence), build-first-reuse (§6 evidence). Backward-check: patch does not edit any substrate file (§6 evidence).

### T16 — Per-row problem-class justification for «no collision» verdicts

T16 walk per companion for the «no collision» verdicts:

- **AI-Factory × CH1 (ESLint):** AIF problem class = «AI workflow pipeline with RULES.md for AI-readable rules»; our ESLint problem class = «static analysis gate on TypeScript code». No overlap — different artifact types and execution contexts.
- **Superpowers × CH3 (pre-push):** Superpowers problem class = «skill invocation rigor + documentation discipline via committed markdown»; our pre-push problem class = «deterministic code + trailer check gate». Superpowers has no git hook delivery mechanism. Confirmed: no match.
- **OhMyOpencode × CH3 (pre-push):** OMO problem class = «within-session task DAG orchestration via 5-tier hook system». 5-tier hooks = PreToolUse/PostToolUse/Message/Event/Transform — these are OhMyOpencode agent-loop hooks, not git hooks. Our pre-push = git-layer. Different layers entirely.
- **aif-handoff × CH4 (CI):** aif-handoff problem class = «server-side autonomous pipeline, webhooks for task events». CI problem class = «GitHub Actions workflows». aif-handoff does not push to `.github/workflows/`. No match.
- **TaskMaster × CH5 (audit-ai-docs):** TaskMaster problem class = «PRD-driven task management with AI complexity scoring». Our audit-ai-docs problem class = «deterministic code-vs-docs consistency probe». TaskMaster has no verification built-in; it delegates to CI. No match.
- **Cline × CH2 (pre-commit):** Cline hook problem class = «Cline SDK agent-loop hooks (Promise.all concurrent, cancel: true blocks)». Our pre-commit problem class = «git commit hook running bash checks». Different runtimes — Cline hooks fire inside Cline's Node.js event loop; git hooks fire in the shell. No namespace overlap.
- **OpenCode × CH5 (audit-ai-docs):** OpenCode problem class = «open-source AI coding agent with JS plugin API»; our audit-ai-docs problem class = «shell script probe of code-vs-docs consistency». OpenCode plugin API (`tool.execute.before/after`) operates on AI tool calls, not on shell script outputs. No match.

---

## §6 §1.7 self-reflexive block

### §1.7 Forward-check applied

This patch complies with all currently-active layers:

| Rule | Compliance | Falsifier (wrong if…) |
|---|---|---|
| **no-paid-llm-in-ci** (`.claude/rules/no-paid-llm-in-ci.md`) | All research sourced from primary input (already-merged PR #252/254, research conducted via DeepWiki MCP subscription-bundled + WebFetch) + direct file reads of repo enforcement artifacts. Zero API-billed calls in this session. | Wrong if this patch proposes any CI job calling `ANTHROPIC_API_KEY` or similar |
| **build-first-reuse-default** (`§3 mechanism`) | No new capability introduced; this is a research-only patch. SSOT consulted via primary input (existing SSOT rows #27/#28/#29/#30/#43/#46/#50/#55/#61/#62/#64/#65/#67/#68/#71/#73/#74/#76/#80/#81 already in primary input). No new SSOT rows proposed in this patch (those are in primary input §8). | Wrong if patch introduces a new enforcement mechanism without SSOT consult |
| **doc-authority-hierarchy** (`.claude/rules/doc-authority-hierarchy.md §5`) | This file lives in `docs/meta-factory/research-patches/` which has folder-level authority. File carries `<!-- scope:... -->` annotation per principle 10 requirement. No per-file Authoritative-for header required (folder-level authority). | Wrong if principle 10 test fails on this file (`10-research-patch-annotation.test.ts`) |
| **universal-satellite vision** | No companion is privileged. All 7 companions receive equivalent analysis depth in §3 (7 rows each with the same 7-channel structure). No companion is marked «primary» or «preferred». | Wrong if any companion is skipped or receives fewer columns in §3 |
| **no substrate edits** | Only one new file created: `docs/meta-factory/research-patches/2026-05-27-living-doc-neutral-injection.md`. Zero edits to `install.sh`, `.claude/rules/`, `packages/core/`, `.github/workflows/`, or any other enforcement artifact. | Wrong if `git diff origin/staging --stat` shows any file other than this patch |

### §1.7 Backward-check applied

This patch does not silently supersede any existing rule or artefact:

| Claim | Verification | Falsifier |
|---|---|---|
| **Does not edit substrate** | `git diff origin/staging --stat` shows only `docs/meta-factory/research-patches/2026-05-27-living-doc-neutral-injection.md` (verified at commit step) | Wrong if stat shows any non-patch file modified |
| **Does not supersede primary input** | This patch is a Stage-3 downstream consumer of `2026-05-27-universal-satellite-integration-matrix.md` (Stage 1); it cites it as input, does not replace it | Wrong if this patch contradicts primary input findings without documenting the conflict |
| **Does not supersede collision-resolution history** | The `review-sidecar.md` collision management (SSOT #50, `install.sh copy_safe`) is cited and preserved, not reversed | Wrong if this patch proposes a different resolution mechanism without flagging it as a DECISION-NEEDED |
| **Does not privilege any companion** | Each companion receives identical matrix treatment in §3 (7 channels each) | Wrong if any companion's row is shorter or has fewer cells than others |
| **Does not add rules** | This is R-phase (research only). No new `.claude/rules/*.md` files created. No CLAUDE.md edits. No principle tests. | Wrong if `git status` shows any file outside `docs/meta-factory/research-patches/` |

---

## §7 Out-of-scope / handoff — DECISION-NEEDED items

The following require maintainer decision before any I-phase implementation:

**DECISION-NEEDED D3-1:** OhMyOpencode official support scope.
- Option A: Declare OhMyOpencode officially supported → ship skill in `.opencode/skills/` (higher priority than `.claude/skills/` scope 3); document escape hatch `"claude_code.skills": false` in INSTALL-FOR-AI.md.
- Option B: Declare OhMyOpencode compatible-but-unsupported → document the escape hatch; leave deployment to consumer. No new deliverable.
- Impact: Option A adds one new skill file deliverable + INSTALL-FOR-AI.md edit. Option B requires zero new files.

**DECISION-NEEDED D3-2:** Cline deliverable scope.
- Option A: Ship `.clinerules/rules-as-tests.md` (rules) + `.clinerules/hooks/PostToolUse/check-doc-authority.sh` (hook equivalent) in M-A I-phase.
- Option B: Document gap + leave to consumer.
- Constraint: dual-implementation-discipline.md §3 requires `@cc-only-rationale` if CC hooks ship without portable Cline fallback (forward-going).
- Impact: Option A involves dual-channel enforcement deliverable per `dual-implementation-discipline.md §3`. New `@dual-pair:` annotations required on CC hooks.

**DECISION-NEEDED D3-3:** OpenCode JS plugin scope.
- Option A: Ship `.opencode/plugins/rules-as-tests-enforcement.js` using `tool.execute.before` to replicate `check-doc-authority.sh` gate behavior.
- Option B: Document gap; rely on skill description-match and pre-push compensating gate.
- Note: Option A requires BFR-default consult (no known upstream pattern for «OpenCode plugin replicating CC PostToolUse gate» — would be BUILD verdict; SSOT entry needed).
- Impact: Option A is a new capability commit (new JS file ≥50 LOC likely). Needs `Prior-art:` trailer.

**DECISION-NEEDED D3-4:** Universal injection point registry as shipped artefact.
- Option A: Formalize the §3 matrix in this patch as a maintained shipped artefact (e.g., `INSTALL-FOR-AI.md §Companion compatibility matrix`).
- Option B: Leave as research-patch reference only (this file). Matrix maintained informally.
- Impact: Option A adds doc-authority header requirement to the new section; principle 09 test would enforce it.

---

## §8 See also

- `docs/meta-factory/research-patches/2026-05-27-universal-satellite-integration-matrix.md` — primary input (Stage 1 R-phase); §2-§3 conflict surface used as evidence base for this audit
- `.claude/orchestrator-prompts/m-a-full-satellite-transition/kickoff.md` — umbrella scope (gitignored)
- `packages/core/hooks/pre-push.ts:230-315` — delegation sections (CH3 enforcement chain verified lines 230-315)
- `.husky/pre-commit` — CH2 enforcement artifact (read in full)
- `.github/workflows/audit-self.yml` — CH4 enforcement artifact (lines 186-191, 227-228, 247-260, 311, 315 verified)
- `packages/core/audit-self/audit-ai-docs.sh:1-40` — CH5 rule-mapping header (R1-R11 + D1-D4 verified)
- `packages/core/stryker.config.mjs` — CH7 mutation config (local-only, not in CI, verified)
- `.claude/rules/no-paid-llm-in-ci.md` — policy rule; confirmed zero violation in this patch
- `docs/meta-factory/prior-art-evaluations.md` — SSOT rows #27/#28/#29/#30/#43/#46/#50/#55/#61/#62/#64/#65/#67/#68/#71/#73/#74/#76/#80/#81 (companion-specific verdicts, cited via primary input)
- `README.md#why-this-exists` — «earliest reachable channel» invariant; our CH1-CH5 order follows this
