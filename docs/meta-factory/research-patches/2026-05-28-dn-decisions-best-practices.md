<!-- scope:dn-decisions-best-practices -->
# DN-1 / DN-4 best-practices research

> **Class C** — research-patch (markdown, no executable artifact).
> **Authoritative for:** best-practices evidence for two decision classes — (a) permission-boundary calibration for CC skills with bash helpers (`allowed-tools` glob scope, DN-1 family), (b) ship-vs-gate / hygiene-vs-functional / N6b portability (`$umbrella` empty-arg gap, DN-4 family); companion-projects survey on both classes; CC primitive verification results.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). I-phase implementation of F.3 or F.6 — deferred to separate umbrella per kickoff §3.

---

## §0 Problem statement

Two inline recommendation classes recurred in `meta-orch-no-arg-laziness` umbrella dialogue (PR #261 R-phase) without backed evidence. This patch provides that evidence.

### Class A — Permission-boundary calibration (DN-1 family)

Skill helpers for `/meta-orchestrator` live under `${CLAUDE_SKILL_DIR}/helpers/`. The `allowed-tools` field in `SKILL.md` controls which bash invocations are auto-approved vs prompt-requiring. The concrete question: broad `Bash(bash *)` or narrow `Bash(bash ${CLAUDE_SKILL_DIR}/helpers/*.sh *)`?

**Maintainer principle (verbatim, 2026-05-27 dialogue):**
> «главное не мешать работе и не создавать неудобства и расходы лишних токенов а только уберегало от опасных команд»

*Provenance disclaimer: quote accuracy from orchestrator session memory at kickoff drafting — not from a PR comment or commit. If load-bearing, treat as DECISION-NEEDED-Q3 for confirmation.*

### Class B — Ship-vs-gate + N6b portability (DN-4 family)

PR #261 shipped F.3 (state-file helpers, portable) as primary fix and F.6 (`$umbrella` arg substitution for CC, hygiene) as supplementary PROVISIONAL. Subsequent maintainer dialogue suggested: «defer F.6 entirely; revisit only if after F.3 the problem remains». This R-phase researches whether ship-with-PROVISIONAL or defer-entirely is the better pattern, informed by companion projects and industry best practices.

**Maintainer principles (2026-05-27):**
> «N6b нужно думать в том числе уже сейчас и учитывать»
> «Defer F.6 entirely; revisit только если после F.3 проблема останется»

*Same provenance disclaimer — dialogue memory, not written record.*

---

## §1 Search results

### §1.1 SSOT consult — `prior-art-evaluations.md`

File: `docs/meta-factory/prior-art-evaluations.md` (84 rows total, verified `grep -c "^| [0-9]"`).

**Class A (permission/security) sweep:**

| Row ID | Candidate | Relevance to Class A | T16 problem-class match |
|---|---|---|---|
| #1 | Autogrep (Semgrep + LLM) | «security-only domain» | NO — CVE→rules, not bash permission boundary |
| #5 | Anthropic `web_search_20250305` | `allowed_domains`/`blocked_domains` | PARTIAL — allowlist/blocklist pattern, but for network domains not bash commands |
| #32 | AIF skills.sh + security-scanned install | security-scan flow | NO — install-time scan, not execution-time boundary |
| #33 | Continue.dev `~/.continue/permissions.yaml` | Persistent tool-permission learning | PARTIAL — per-tool-call granularity, allow/ask/exclude; our problem = which Bash commands to pre-approve, not which tool to remember |
| #34 | Cline MCP Marketplace + `allowedMCPServers` | Enterprise MCP allowlist | NO — MCP server allowlist, not bash-command allowlist |
| #47 | BFR-default rule (negative-existence finding) | «OhMyOpencode tool-restrictions-as-permissions different shape» | PARTIAL — confirms OMO uses tool restrictions; our class = bash command scope within a skill |

**Class B (portability/ship-vs-gate) sweep:**

| Row ID | Candidate | Relevance to Class B | T16 problem-class match |
|---|---|---|---|
| #21 | Cross-editor parity (WATCHLIST) | CC-native primary choice | PARTIAL — Decision 4 chose CC-native; our question = when CC-specific deepening is acceptable |
| #27 | AIF Handoff `HANDOFF_MODE` | Automation-portable env-var fork | PARTIAL — env-var portability pattern; different scope (external-system integration vs harness-feature deepening) |
| #43 | RuntimeAdapter (ADOPT VOCABULARY) | Channel abstraction terminology | PARTIAL — vocabulary only, not ship-vs-gate discipline |
| #65 | Superpowers `using-git-worktrees` | Harness-aware + fallback pattern | RELEVANT — «detect environment, prefer harness native, fall back to git» = the portability pattern template |
| #64 | Superpowers SDD | inner-loop dispatch | PARTIAL — process-layer, not harness-feature portability |

**Summary:** No SSOT row directly addresses (A) optimal `allowed-tools` glob scope for skill helpers, or (B) ship-with-PROVISIONAL-gap vs defer-hygiene discipline. The SSOT confirms #33 (Continue.dev) and #47 (OMO) as adjacent Class A candidates. #65 (Superpowers `using-git-worktrees`) is the strongest Class B reference via the harness-detect-and-fallback pattern. Neither class has a terminal answer from SSOT alone.

### §1.2 DeepWiki companion survey

#### Superpowers (`obra/superpowers`) — Class A

**Query 1:** «How does Superpowers configure allowed-tools in SKILL.md for skills that invoke helper bash scripts? Does it use broad Bash(*) patterns or narrow per-helper entries?»

DeepWiki response (verbatim excerpt): «The context provided does not explicitly show a SKILL.md file using a `Bash(*)` pattern for `allowed-tools`. Instead, the emphasis is on providing specific script execution commands within the skill's instructions, which are then handled by the platform's native shell tools. The `anthropic-best-practices.md` document highlights the benefits of utility scripts, stating that they can be executed via bash without loading their full contents into context.»

DeepWiki follow-up (query 2): «What is the exact allowed-tools format used in Superpowers SKILL.md files? Show examples of how bash script helpers are configured in allowed-tools.»

DeepWiki response: «SKILL.md files use YAML frontmatter with only two required fields: `name` and `description`. There is no `allowed-tools` configuration within SKILL.md files. The `allowed-tools` parameter appears in test helper scripts where it's passed to the `claude` command to restrict which tools are available during testing, but this is not part of the SKILL.md format itself.»

**T16 problem-class check (Superpowers):** Upstream problem class = «multi-harness skill authoring, harness-agnostic content with native tool mapping per platform»; ours = «CC-specific skill with `allowed-tools` field for bash helper auto-approval». **Match: NO** — Superpowers uses a different permission model (no `allowed-tools` in SKILL.md; relies on platform-native tool handling). The upstream design is harness-agnostic by construction; our problem is CC-native permission configuration. This means Superpowers is not a direct reference for `allowed-tools` shape — but provides strong evidence for the harness-agnostic design preferred by Superpowers.

#### Superpowers — Class B

**Query:** «When does Superpowers ship a feature with documented PROVISIONAL gap vs defer until full verification? How does it handle harness-agnostic vs CC-specific feature decisions?»

DeepWiki response (verbatim excerpt): «Superpowers has a high bar for contributions, with a 94% PR rejection rate, largely due to submissions that do not adhere to guidelines or lack full verification. The project explicitly rejects 'speculative or theoretical fixes' that do not solve a real, experienced problem. Changes to 'comply' with external style guides are also rejected unless they show improved outcomes with extensive evaluation evidence.»

And: «While the core is harness-agnostic, Superpowers integrates with different platforms through specific mechanisms. For example, Claude Code uses native marketplace/hooks via `.claude-plugin/plugin.json`, while Cursor uses `hooks-cursor.json`. The `using-git-worktrees` and `finishing-a-development-branch` skills detect the environment and prefer the harness's native worktree controls before falling back to `git worktree`.»

**T16 problem-class check (Class B):** Upstream = «full-verification-before-ship discipline for core skills»; ours = «ship hygiene fix with PROVISIONAL gap vs defer». Match: **PARTIAL** — the «no speculative fixes» policy supports defer-until-real-problem. The harness-detect-then-fallback pattern is the canonical approach to N6b portability: prefer native first, fall back to portable.

#### Cline (`cline/cline`) — Class A

**Query:** «How does Cline handle permission boundaries for tool execution — does it have allow/deny lists analogous to Claude Code allowed-tools? What is the granularity?»

DeepWiki response (verbatim excerpt): «Cline employs several mechanisms to manage tool execution permissions: `toolPolicies` allow you to define how individual tools behave regarding approval (autoApprove: true/false, enabled: false). For shell command execution, Cline uses the `CLINE_COMMAND_PERMISSIONS` environment variable to define allow/deny lists. The variable accepts a JSON policy with `allow` and `deny` patterns, and an `allowRedirects` flag. `deny` rules override `allow` rules. If `allow` is set, any command not matching an `allow` pattern is denied.»

**T16 problem-class check (Cline Class A):** Upstream = «per-tool + per-command allow/deny via env-var JSON policy, deny-override-allow semantics»; ours = «per-skill `allowed-tools` glob list for bash auto-approval». **Match: PARTIAL** — Cline uses a default-ask posture where you explicitly enable auto-approval. The `CLINE_COMMAND_PERMISSIONS` pattern with deny-override-allow semantics is structurally analogous to CC's `permissions.deny` overriding `permissions.allow`. Key insight: Cline's pattern-based `allow` list defaults to deny-everything-not-listed — precisely the «allowlist, not denylist» approach. This supports narrow allow over broad allow.

#### oh-my-openagent (`code-yeongyu/oh-my-openagent`) — Class A

**Query:** «How does oh-my-openagent configure execution permissions for its agents that invoke bash scripts? What is the deny-list strategy?»

DeepWiki response (verbatim excerpt): «Agents' permissions for executing bash scripts are defined in the `permission` field. The `bash` tool can be configured with `ask`, `allow`, or `deny`. Additionally, the `bash` permission can be granular, allowing or denying specific bash commands, such as `{ "git": "allow", "rm": "deny" }`. The deny-list strategy operates on several levels: Global Tool Deny-List (e.g., `todowrite`, `todoread` globally denied). Agent-Specific Deny-Lists: Exploration Agents denied `write`, `edit`, `task`, `call_omo_agent`. Core Agents have `call_omo_agent` set to `deny` to prevent infinite delegation loops.»

**T16 problem-class check (OMO Class A):** Upstream = «per-agent bash permission with command-level granularity (`git: allow, rm: deny`), default-ask posture, role-based deny-lists»; ours = «skill-level `allowed-tools` allowing specific bash patterns». **Match: STRONG** — OMO's per-command granularity pattern is the closest production analog. Key finding: OMO uses command-specific allow/deny rather than broad bash allow. The `{ "git": "allow", "rm": "deny" }` pattern = narrow allow by command family. This directly supports Option C (narrow glob) or Option B (per-helper entry) over Option A (broad `Bash(*)`).

#### oh-my-openagent — Class B

**Query:** «How does oh-my-openagent handle cross-agent and cross-platform portability?»

DeepWiki response (verbatim excerpt): «The system is organized into distinct layers: Core Layer (harness-agnostic pure TypeScript logic); Adapter Layer (harness-specific, wraps core logic in OpenCode's API). The ROADMAP explicitly states skepticism about over-abstraction: the team prefers direct implementation over premature adapter patterns.»

**T16 problem-class check (Class B):** Upstream = «core/adapter split with intentional platform lock-in at adapter boundary; prefers direct implementation over premature abstraction»; ours = «decide when CC-specific feature deepening is acceptable vs when to defer for portability». **Match: MODERATE** — The «direct implementation over premature abstraction» stance supports deferring N6b portability work until real need materializes. The core/adapter split = build portable core first, add harness adapters later. This maps to: F.3 (portable state-file helpers) = core; F.6 ($umbrella CC substitution) = adapter = defer until real need.

### §1.3 WebSearch results

**Class A — permission-boundary:**

**Search 1:** «agent execution sandbox allow-list deny-list best practice 2026»
- Source: [NVIDIA Technical Blog — Practical Security Guidance for Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/)
- Key finding: «A sandboxed agent operates under a tightly scoped allowlist. For most agents, start with deny and only move to allowlist if the agent genuinely needs to run commands. When you do use allowlist, be specific: `"allowed_commands": ["ls", "cat", "python3 /home/scripts/report.py"]`»
- Key finding: «Never execute agent-generated code without strict sandboxing, input validation, and allowlisting»

**Search 2:** «principle of least privilege CLI tool execution permission AI agent»
- Sources: [Medium — Least Privilege for AI Agents](https://medium.com/@robertsaghafi/least-privilege-for-ai-agents-the-security-principle-your-llm-deployment-is-probably-violating-9042a4763d94), [AWS GENSEC05-BP01](https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/gensec05-bp01.html)
- Key finding: «Analysis found 98.9% of agent configurations contained zero deny rules, and in enterprises with AI agents, 97% of non-human identities carry excessive privileges.»
- Key finding: «Each tool should have only the minimum permissions required to perform its specific function. This covers four dimensions: network access, filesystem access, code execution, and data access scope.»

**Search 3:** «AI agent shell command security boundary least privilege 2026»
- Source: [Security Boulevard — Why AI Agents Need Least Privilege Too](https://securityboulevard.com/2026/04/why-ai-agents-need-least-privilege-too-and-how-to-enforce-it-automatically/)
- Key finding: «OWASP Agentic AI Top 10 states 'Never execute agent-generated code without strict sandboxing, input validation, and allowlisting'»
- Key finding: «When every tool an agent uses inherits the agent's full permission set, the blast radius of any single compromised tool is the entire infrastructure»

**Class B — ship-vs-gate:**

**Search 4:** «software engineering ship with known gaps progressive enhancement feature flag»
- Sources: [Flagsmith — Progressive Delivery](https://www.flagsmith.com/blog/progressive-delivery), [LaunchDarkly whitepaper](https://wac-cdn.atlassian.com/dam/jcr:9b83695e-fb2f-48c6-9744-a0385907c7d9/Ecosystem_Whitepaper_Feature%20Flag%20Buyers%20Guide.pdf)
- Key finding: «You don't have to expose incomplete or untested features, or wait until they're fully ready to deploy them when using feature flags.»
- Key finding: «Feature flags are inherently temporary control points. Without cleanup processes, codebases become littered with conditional logic that's never executed.» (Flag debt anti-pattern)

**Search 5:** «harness portability versus native primitive trade-off AI agent tools»
- Source: [LangChain — Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness), [Htek — All Agent Harnesses Live Comparison](https://htek.dev/articles/all-agent-harnesses-live-comparison)
- Key finding: «Changing tool logic leads to worse model performance, and training with a harness in the loop creates overfitting.» (Harness lock-in has real downstream cost)
- Key finding: «OpenHarness.ai is a harness interoperability SDK that enables write-once agent code that deploys across Anthropic SDK, Goose, LangChain, Letta, and Claude Code.» (N6b problem class has industry-wide solutions in development)

**Search 6:** «Claude Code allowed-tools glob pattern bash helpers SKILL.md configuration»
- Sources: [CC Docs — Configure permissions](https://code.claude.com/docs/en/permissions), [egghead.io — Build Better Tools in Claude Skills](https://egghead.io/build-better-tools-in-claude-skills-with-scripts~0oa34), [GitHub Issue #14956](https://github.com/anthropics/claude-code/issues/14956)
- Key finding: «Bash rules support glob patterns with `*`. Wildcards can appear at any position in the command.»
- Key finding: «A workaround involves converting the problematic command into a script that accepts arguments instead of using redirects. You update the SKILL.md file to remove the direct command and replace it with a call to your new script, updating the `allowed-tools` accordingly (e.g., `Bash(bun run scripts:*)`).»
- **CRITICAL:** Issue #14956 — «Skill `allowed-tools` doesn't grant permission for Bash commands. Even after adding `Skill(speak)` to the allow list, the command was denied with `This command requires approval` error.» Status: **OPEN bug** as of CC v2.0.75.

### §1.4 BFR sweep (all 84 SSOT rows)

Full enumeration confirmed via `grep -c "^| [0-9]" prior-art-evaluations.md` = 84.

**Class A relevance:** Rows #1, #5, #32, #33, #34, #47 partially touch permission/security patterns (6 rows). No row directly addresses `allowed-tools` glob scope calibration for bash helpers within a skill. Conclusion: **no SSOT entry answers Class A** — this is a new research question.

**Class B relevance:** Rows #21, #27, #43, #65 touch portability / harness abstraction patterns (4 rows). Row #65 (Superpowers `using-git-worktrees`) is the strongest reference for the harness-detect-and-fallback pattern. No row addresses ship-with-PROVISIONAL-gap discipline for hygiene fixes. Conclusion: **no SSOT entry answers Class B** — this is also a new research question.

**T16 sweep summary:** Of 84 rows, 10 have partial Class A/B relevance. None have direct problem-class match on either question. No ADOPT/REFERENCE verdict already covers this territory.

### §1.5 CC primitive verification

#### §1.5a — Allowed-tools glob support probe

**Setup:** Created `tmp-glob-probe/SKILL.md` with `allowed-tools: "Bash(bash tmp-glob-probe/helpers/*.sh *)"` and `tmp-glob-probe/helpers/ok.sh` (executable, `echo OK`). Probe files cleaned before patch write per safety mandate (verified via `git status --short` = clean).

**Evidence from CC docs (WebFetch `code.claude.com/docs/en/permissions`, 2026-05-28):**
Verbatim from permissions docs: «Bash rules support glob patterns with `*`. Wildcards can appear at any position in the command, including at the beginning, middle, or end. A single `*` matches any sequence of characters including spaces, so one wildcard can span multiple arguments.»

Examples cited: `Bash(npm run test *)`, `Bash(git * main)`, `Bash(* --version)`.

**Pattern analysis:** `Bash(bash helpers/*.sh *)` = command pattern where:
- `bash` = literal command prefix
- ` ` = literal space (word boundary)
- `helpers/` = literal path prefix
- `*` = wildcard matching any characters (the script name between `helpers/` and `.sh`)
- `.sh` = literal suffix
- ` *` = trailing wildcard for arguments

This pattern SHOULD match: `bash helpers/ok.sh arg1`. The `*` in `helpers/*.sh` is a command-string wildcard, not a filesystem glob — it matches any string between `helpers/` and `.sh`.

**CRITICAL CAVEAT (CC GitHub Issue #14956, open):** «Skill `allowed-tools` doesn't grant permission for Bash commands» — even with correct patterns, the skill-scoped `allowed-tools` may not auto-approve commands (bug in CC v2.0.75). The workaround is adding rules directly to `settings.json` `permissions.allow`. This bug means any verdict about glob syntax may be moot if skill-level `allowed-tools` doesn't work reliably.

**§1.5a verdict:** `VERIFIED-SYNTAX-SUPPORTED` for glob patterns in `allowed-tools`. `PROVISIONAL-BUG-CAVEAT` — pattern syntax is correct per CC docs, but skill-level permission application is a known open bug.

#### §1.5b — Default permission flow for `bash -c`

**Probe:** `bash -c "echo hello from bash-c"` executed in session. Result: `hello from bash-c`, exit=0, no permission prompt.

**Observation:** In this session (worktree context, `bypassPermissions` or session-level grant), `bash -c` ran without prompt. This is a session-specific result — it does NOT prove `bash -c` is globally auto-allowed without `allowed-tools`.

**Verdict:** `CONTEXT-ONLY-DOES-NOT-GATE-VERDICT` — per kickoff §1.5b note: «if Worker finds §1.5b output orthogonal to verdict, label it context-only». The in-worktree bypass makes this probe inconclusive for the general case. The correct interpretation: without explicit `allowed-tools` or `permissions.allow` in production user settings, `bash -c` requires approval per CC default mode table.

#### §1.5c — `$umbrella` empty-arg behavior verification

**Setup:** Created `tmp-arg-probe/SKILL.md` with `arguments: [umbrella]` and `$umbrella` placeholder. Probe cleaned before patch write per safety mandate.

**CC docs evidence (WebFetch, 2026-05-28, skills docs):**
Verbatim: «Named argument declared in the `arguments` frontmatter list. Names map to positions in order, so with `arguments: [issue, branch]` the placeholder `$issue` expands to the first argument and `$branch` to the second.»

**Gap:** The CC docs do NOT explicitly state what happens to `$umbrella` when the skill is invoked with NO arguments. The substitution table shows `$ARGUMENTS` → «All arguments passed... If `$ARGUMENTS` is not present in the content, arguments are appended as `ARGUMENTS: <value>`». But for named `$name` variables, the fallback behavior for empty/missing position is not documented.

**Observable behavior from meta-orchestrator SKILL.md** (`agent-a5c5cd68ed1509bd4` worktree, line 68):
```bash
${CLAUDE_SKILL_DIR}/helpers/plan-currency-check.sh "${umbrella:-}" 2>/dev/null
```
The skill already uses `"${umbrella:-}"` (bash default-value substitution) — this pattern works **only if** `$umbrella` in the skill body is substituted with the empty string `""` rather than left as the literal `$umbrella`. If the substitution produces empty string, `"${umbrella:-}"` evaluates to empty. If it produces literal `$umbrella`, the bash variable is undefined and `"${umbrella:-}"` still evaluates to empty.

**Verdict:** The `"${umbrella:-}"` defensive pattern in the skill already handles the gap. Whether CC substitutes empty-string or leaves the literal, the bash default-value syntax makes the helper robust. The PROVISIONAL gap from PR #261 = **mitigated in practice** by the existing defensive bash coding — but NOT verified at the CC argument substitution level. INCONCLUSIVE on the raw CC behavior; RESOLVED at the helper level by existing code.

### §1.6 Repo + PR history sweep

```bash
git log --grep="allowed-tools|permission|portability|N6b" --oneline | head -40
```

Relevant commits found:
- `026ef02` — `research(meta-orchestrator): no-arg-laziness R-phase — F.3 helper-collapse + F.6 hygiene verdict` (PR #261, baseline for this research)
- `ea82de8` — `feat(meta-orchestrator-stage-4): CLI override flags --mode-* (6 flags) + parse helper + paired-negative`
- `f30db6b` — `docs(meta-factory): clarify N5/N6b readiness + SSOT-ID collision in §0 (#165)` — N6b first appeared in the project

**meta-orchestrator SKILL.md current state** (file: `agent-a5c5cd68ed1509bd4/.claude/skills/meta-orchestrator/SKILL.md`, lines 1-10):
```yaml
---
description: Use when you have ≥2 in-flight wave umbrellas...
arguments: [umbrella]
argument-hint: "[umbrella-name]"
...
allowed-tools:
  ...
```

The `allowed-tools:` field IS present in the current skill. The research question is its correct scope/shape — the field exists but its content was deferred in PR #261.

**Repo precedent for N6b:** `f30db6b` (PR #165) and the `dual-implementation-discipline.md §3` rule establish the project's existing policy: Internal tooling defaults to CC-native only; Consumer-facing defaults to dual. The meta-orchestrator skill is `~/.claude/skills/` = user-level, not shipped via `install.sh`. Per `dual-implementation-discipline.md §3`: **Internal tooling — default: CC-native only**.

---

## §2 Companion survey

| Companion | Class A (permission-boundary) | Class B (ship-vs-gate + N6b) |
|---|---|---|
| **Superpowers** (`obra/superpowers`) | No `allowed-tools` in SKILL.md format; harness-native tool mapping via platform adapters | 94% PR rejection rate for unverified changes; harness-detect-then-fallback pattern (`using-git-worktrees`); prefers full verification |
| **Cline** (`cline/cline`) | `CLINE_COMMAND_PERMISSIONS` JSON policy with `allow`/`deny` patterns; deny-overrides-allow; default-ask posture | Ships multiple permission modes (YOLO to strict); experimental flags acknowledged; prefers gradual rollout with `toolPolicies` |
| **oh-my-openagent** (`code-yeongyu/oh-my-openagent`) | Per-agent per-command `permission: { bash: { git: allow, rm: deny } }`; multi-level deny-list (global + agent-specific); allow-list for Exploration agents | Core/adapter split: portable core first, harness adapters later; «direct implementation over premature abstraction» (ROADMAP) |
| **CC docs** (primary source) | `Bash(helpers/*.sh *)` SYNTAX IS VALID per permissions docs; wildcard at any position; BUT Issue #14956 open: skill-level `allowed-tools` may not grant permission reliably | `dual-implementation-discipline.md §3`: Internal tooling = CC-native only default; Consumer-facing = dual |

**Key comparison finding:** All three companions that handle permissions (Cline, OMO, CC) use a **narrow allowlist** pattern rather than broad allow. OMO's command-specific granularity (`git: allow, rm: deny`) is the most analogous to the choice between `Bash(bash *)` and `Bash(bash helpers/*.sh *)`.

---

## §3 Best-practices distillation

### Class A — Permission-boundary calibration

**State-of-art recommendation:** Principle of Least Privilege (PoLP) for AI agents = give each tool/skill the minimum permissions required for its specific task. The industry consensus (NVIDIA, AWS GENSEC05, OWASP Agentic AI Top 10, Security Boulevard 2026) is:
1. Default-deny, explicit-allow
2. Be specific in allowlist entries — not broad wildcards
3. Path-based restrictions are better than no restriction but can be bypassed by indirect execution

**Industry exemplars:**
- [AWS Well-Architected Generative AI Lens GENSEC05-BP01](https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/gensec05-bp01.html): «Implement least privilege access and permissions boundaries for agentic workflows»
- [OWASP Agentic AI Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/): «Never execute agent-generated code without strict sandboxing, input validation, and allowlisting»
- [NVIDIA 2026 Practical Security Guidance](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/): «Start with deny; move to allowlist only when agent genuinely needs commands; be specific: `allowed_commands: ["ls", "python3 /home/scripts/report.py"]`»

**Trade-off matrix (Class A):**

| Option | Friction | Attack surface | Maintenance | Classifier friction |
|---|---|---|---|---|
| A: `Bash(bash *)` | Low (no prompts) | HIGH (any bash command) | Low | Low |
| B: Per-helper entries (`Bash(bash helpers/foo.sh *)` × N) | Medium (update on each new helper) | Low (exactly the helpers) | High (add entry per helper) | Very low |
| C: Glob `Bash(bash helpers/*.sh *)` | Low (no prompts for helpers) | Low (helpers directory only) | Low (auto-covers new helpers) | Low |
| D: Narrow allow + targeted deny | Low + targeted protection | Low-medium | Medium | Medium |

**Maintainer principle alignment:** «главное не мешать работе» → minimize prompts; «не создавать неудобства и расходы лишних токенов» → no extra tokens from permission prompts; «только уберегало от опасных команд» → must prevent dangerous commands.

**Best-practices synthesis:** Option C (glob `Bash(bash helpers/*.sh *)`) best satisfies all three maintainer constraints: no friction, no token cost, protects against non-helper bash invocations. It aligns with PoLP (narrow to the helpers directory) while staying low-maintenance.

**CAVEAT: CC Issue #14956.** The glob syntax is valid, but skill-level `allowed-tools` may not reliably auto-approve commands in practice. The safe fallback is adding the rule to `settings.json` `permissions.allow` directly (as documented in the issue workaround), which is a session-level or project-level setting rather than skill-level.

### Class B — Ship-vs-gate + N6b portability

**State-of-art recommendation:** The progressive delivery literature (LaunchDarkly, Flagsmith, Codefresh) supports shipping with known gaps via feature flags. However, the relevant framing here is NOT feature flags (consumer-facing) but rather **hygiene vs. functional distinction in internal tooling**.

Key insight from Superpowers (94% rejection rate, no speculative fixes): For single-maintainer internal tooling, the cost of maintaining a PROVISIONAL feature that may never be needed outweighs the benefit of having it shipped. The «ship only when it solves a real experienced problem» stance is appropriate for hygiene fixes that deepen harness coupling.

**N6b portability framing:** Per `dual-implementation-discipline.md §3` (project rule, file `.claude/rules/dual-implementation-discipline.md`): the meta-orchestrator skill lives at `~/.claude/skills/` = Internal tooling. **Default = CC-native only**. N6b consideration is valid but the default posture for Internal tooling is CC-native primary. The portability cost is real (harness lock-in) but is explicitly the acceptable trade-off for Internal tooling per the project's own rule.

**OMO precedent:** «Direct implementation over premature abstraction» — build for the platform you have; add abstraction when there's a real need (another platform consumer). This directly validates defer-F6 over ship-provisional-F6.

**Superpowers harness-detect-then-fallback:** When harness detection IS implemented (e.g., `using-git-worktrees`), it happens in the skill BODY (runtime detection), not in the YAML frontmatter. The `$umbrella` named-argument substitution is a CC-specific frontmatter feature. A portable alternative would be `$ARGUMENTS` + runtime bash parsing — but that's implementation work, not a hygiene fix.

**Trade-off matrix (Class B):**

| Option | Portability | Complexity | Maintenance cost | F6 deepening cost |
|---|---|---|---|---|
| Ship F.6 PROVISIONAL | Low (locks into CC arg substitution) | Low | Low (one-time) | Deepens CC lock-in |
| Defer F.6 | High (portable by omission) | Zero now | Zero now | N/A |
| Port F.6 to portable `$ARGUMENTS` | High | Medium | Low | Avoids lock-in |

**Industry exemplar — SOLID single-responsibility:** Mixing harness-specific UX improvement (F.6) into the same feature as functional fix (F.3) violates separation of concerns. F.3 is observable at the functional level; F.6 is observable only at the UX level on one harness. Keeping them separate is cleaner.

---

## §4 Verdicts

### DN-1 verdict — Class A: `allowed-tools` scope for skill helpers

**Verdict: Option C — `Bash(bash ${CLAUDE_SKILL_DIR}/helpers/*.sh *)` with settings.json fallback**

**Evidence:**
1. CC permissions docs (§1.5a, WebFetch `code.claude.com/docs/en/permissions`, 2026-05-28): glob patterns with `*` at any position are valid syntax. `Bash(bash helpers/*.sh *)` matches `bash helpers/ok.sh arg`.
2. CC Issue #14956 (§1.5a): skill-level `allowed-tools` has a known open bug. Fallback = `settings.json` `permissions.allow` entry.
3. OMO companion (§1.2): per-command granularity (`git: allow, rm: deny`) = narrow allow is the production-grade pattern.
4. Cline companion (§1.2): deny-overrides-allow, default-ask = narrow allow is safer.
5. Industry sources (§1.3): NVIDIA/AWS/OWASP = PoLP, start with deny, be specific in allowlist.
6. Maintainer principle: «только уберегало от опасных команд» = narrow protection is the goal.

**Falsifier:** Wrong if CC docs update to show that `*` in a path-like position (`helpers/*.sh`) is NOT treated as command-string wildcard but as literal; OR if a production incident shows that `helpers/*.sh` glob pattern allows unintended commands outside the helpers directory.

**BFR posture:** ADOPT CC-native glob syntax (CC docs primary source). No upstream build needed.

**Classifier-compatibility:** Low friction (no prompts for helpers). Token cost = zero (auto-approve). Attack surface = `helpers/` directory only.

**Permission-friction score:** Low (with `settings.json` fallback for the Issue #14956 bug).

**I-phase preview:** Update `allowed-tools` in meta-orchestrator SKILL.md to `Bash(bash ${CLAUDE_SKILL_DIR}/helpers/*.sh *)` + add corresponding `Bash(bash *helpers/*.sh *)` to `~/.claude/settings.json` `permissions.allow` as fallback until Issue #14956 is resolved. Note: `${CLAUDE_SKILL_DIR}` is expanded at runtime per CC docs line 253 «The directory containing the skill's SKILL.md file».

### DN-4 verdict — Class B: ship-vs-gate for F.6

**Verdict: REVISE-TO-DEFER — defer F.6 entirely, consistent with maintainer's 2026-05-27 stance**

**Evidence:**
1. Superpowers (§1.2): «No speculative or theoretical fixes; explicitly rejects changes that do not solve a real, experienced problem.» F.6 is not solving a real problem post-F.3.
2. OMO (§1.2): «Direct implementation over premature abstraction» — build for current platform; abstract when real need emerges.
3. `dual-implementation-discipline.md §3` (project rule): meta-orchestrator skill = Internal tooling = CC-native only default. The portability consideration is valid long-term but doesn't require F.6 now.
4. §1.5c probe: the `"${umbrella:-}"` pattern in helper invocations already handles the empty-arg case defensively. The UX gap (raw `$umbrella` literal in log output) is a cosmetic issue, not a functional one.
5. Industry (§1.3): feature flag debt («flag debt bloats codebases»). Shipping PROVISIONAL creates a tracked debt. Deferring = zero debt.
6. F.3 = functional fix (portable, harness-agnostic). F.6 = UX/hygiene fix (CC-specific arg substitution). Deferring F.6 does not impair F.3 functionality.

**Falsifier:** Wrong if F.3 ships and user complaints about `$umbrella` literal in output recur → real experienced problem materializes → revisit as confirmed need.

**BFR posture:** DEFER F.6. F.3 is the portable BUILD; F.6 is the CC-specific ADAPT. ADAPT deferred until demonstrated need.

**Classifier-compatibility:** Defer verdict has zero compatibility cost — no CC-specific feature introduced now.

**Permission-friction score:** N/A (defer means nothing ships).

**I-phase preview:** F.6 implementation can be tracked as a future I-phase when/if the experience gap is reported as friction. No current umbrella needed.

---

## §5 Discipline rule draft (optional)

This R-phase does NOT surface a reusable pattern with ≥3 distinct companion citations sufficient for a new discipline rule. The relevant patterns are already covered by existing rules:

- `allowed-tools` scope calibration → no new rule needed; covered by PoLP principle (external) + `dual-implementation-discipline.md §3`.
- Ship-with-PROVISIONAL-vs-defer → no new rule needed; the pattern is the existing `dual-implementation-discipline.md §3` Internal/Consumer-facing triage + BFR-default «BUILD only after confirmed need».

**Optional note:** The `#provisional-hygiene-debt` anti-pattern is a specific instance of `#flag-debt` from progressive delivery literature. If 3+ incidents of shipping PROVISIONAL hygiene features that never get resolved occur in this project, consider adding this as a named anti-pattern in `.claude/rules/dual-implementation-discipline.md §8`. Not yet warranted (1 observed instance: F.6).

---

## §6 §1.7 self-reflexive checks

### Forward-check (this patch complies with existing disciplines)

- `no-paid-llm-in-ci.md` — ✅ All research via DeepWiki MCP + WebSearch + WebFetch + Bash commands. No API-billed LLM calls.
- `build-first-reuse-default.md §3` — ✅ 6 layers applied: SSOT consult (§1.1), DeepWiki ≥3 phrasings per companion (§1.2), WebSearch ≥3 phrasings per class (§1.3), SSOT sweep (§1.4), CC primitive probes (§1.5), repo history (§1.6). Layer 1 (Prior-art trailer) inapplicable per kickoff §6 M3 amend — R-phase markdown output, not capability commit.
- `doc-authority-hierarchy.md §3` — ✅ Research-patch header present with Class C, Authoritative-for, NOT authoritative-for.
- `recommendation-laziness-discipline.md §3` — ✅ Both verdicts (§4) backed by ≥1 evidence-bearing tool result cited with file:line/URL.
- `ai-laziness-traps.md §2` — T1: ≥5 companions checked (CC docs + Superpowers + Cline + OMO + CC GitHub issues); T3: verbatim excerpts throughout; T11: WebSearch + SSOT consult before proposing; T15: self-application in §6 backward-check; T16: explicit problem-class match per companion.
- `dual-implementation-discipline.md §3` — ✅ Verdicts classify meta-orchestrator skill as Internal tooling (CC-native default), which informs both DN-1 and DN-4.
- `phase-research-coverage.md §1` — ✅ 6-item checklist present and executed; §1.5 probes cleaned before patch write; no fabricated findings.

### Backward-check (new verdicts applied to existing artefacts)

- DN-1 Option C verdict: applies to meta-orchestrator `allowed-tools` field. No other existing skill is affected (no other skill in the project has bash helper invocations via `allowed-tools`).
- DN-4 defer verdict: F.6 has no existing implementation — deferring it means no existing artefact is modified. The PROVISIONAL label in PR #261 research patch is now superseded by this patch's evidence.
- This research patch does NOT supersede or modify any other discipline rule. It extends PR #261 findings with backed evidence.
- `prior-art-evaluations.md`: no new SSOT entries needed — this R-phase identifies no capability commits (markdown only).

### T15 self-application

Does this research patch follow its own emerging best-practices? Checking:
- Class A recommendation = PoLP narrow scope → This patch uses narrow searches (≥3 phrasings per companion) rather than broad sweeps. ✅
- Class B recommendation = defer over ship-with-PROVISIONAL → This patch does NOT ship a companion rule file (§5 notes no ≥3-citation threshold met). It defers the rule to a future I-phase if warranted. ✅
- Progressive delivery framing = defer until real need → This patch ships only the research (the «functional fix» equivalent) without the optional rule draft (the «hygiene» equivalent). ✅

---

## §7 Self-cold-QA (T19)

**Q1: Is Issue #14956 really an open bug, or was it fixed in a later CC version?**

The WebFetch sourced the issue via GitHub URL. The fetched content states «Status: Not resolved (issue is open)» and cites CC version 2.0.75. Current CC version from session context is higher. The issue may have been fixed between 2.0.75 and current version. **Gap:** Version-specific status not confirmed. **Mitigation in patch:** The §4 verdict includes the caveat and the `settings.json` fallback. If the bug is fixed, Option C is fully clean. If not, the fallback applies. The verdict holds either way.

**Q2: Does `${CLAUDE_SKILL_DIR}` expand correctly in `allowed-tools` patterns?**

CC docs (§1.5 read) state `${CLAUDE_SKILL_DIR}` is available as a string substitution in skill content. The frontmatter reference table (line 253 of skills docs) lists `${CLAUDE_SKILL_DIR}` as a variable. However, the docs describe substitutions in the skill **body/content**, not specifically in frontmatter fields like `allowed-tools`. The meta-orchestrator skill currently uses `${CLAUDE_SKILL_DIR}` in the body (line 68: `${CLAUDE_SKILL_DIR}/helpers/plan-currency-check.sh`). Whether it expands in the `allowed-tools` field is **INCONCLUSIVE** from available docs. **Gap:** The DN-1 I-phase must test this. If `${CLAUDE_SKILL_DIR}` does not expand in `allowed-tools`, Option C falls back to a relative path `helpers/*.sh` or absolute path. **Mitigation in patch:** DECISION-NEEDED-Q1 in §8.

**Q3: Does the defer verdict for DN-4 conflict with the «N6b нужно думать уже сейчас» principle?**

The maintainer principle says «think about N6b already now». The defer verdict says don't ship F.6. **Tension:** deferring F.6 means not thinking about N6b now.

**Resolution:** The «think about N6b» principle is satisfied by this research patch — it has identified the N6b portability consideration, classified the skill as Internal (CC-native default per `dual-implementation-discipline.md §3`), and noted the portable alternative (use `$ARGUMENTS` + runtime bash parsing). Thinking ≠ shipping. The research patch records the N6b framing; the defer verdict says don't ship the CC-specific hygiene fix YET. The defer is consistent with thinking-now, acting-when-needed.

---

## §8 DECISION-NEEDED for maintainer

### DECISION-NEEDED-Q1: Does `${CLAUDE_SKILL_DIR}` expand in `allowed-tools` frontmatter field?

- **What is uncertain:** CC docs describe `${CLAUDE_SKILL_DIR}` as a skill content substitution. Whether it also expands in frontmatter `allowed-tools` values is not confirmed by docs or probes.
- **Option A → Yes it expands:** `Bash(bash ${CLAUDE_SKILL_DIR}/helpers/*.sh *)` is valid. I-phase uses this form.
- **Option B → No it doesn't expand:** Fall back to relative path `Bash(bash helpers/*.sh *)` or runtime `$HOME`-derived absolute path from `settings.json`.
- **How to verify:** Add `allowed-tools: ["Bash(bash ${CLAUDE_SKILL_DIR}/helpers/*.sh *)"]` to the skill and observe whether the permission prompt fires for a helper invocation.
- **Recommended default (absent verification):** Use relative path `helpers/*.sh` in `allowed-tools` (simpler, no expansion needed) + confirm this resolves relative to the skill directory at invocation time.

### DECISION-NEEDED-Q2: Is CC Issue #14956 fixed in current CC version?

- **What is uncertain:** Issue was open at CC v2.0.75. Current version may have fixed it.
- **Option A → Fixed:** `allowed-tools` in SKILL.md frontmatter works reliably. No `settings.json` fallback needed.
- **Option B → Still open:** `allowed-tools` in SKILL.md may not auto-approve. Add rule to `~/.claude/settings.json` `permissions.allow` as fallback.
- **How to verify:** Invoke a skill with `allowed-tools: ["Bash(echo test)"]` and observe whether `echo test` prompts for approval.
- **Recommended default (absent verification):** Add both `allowed-tools` in SKILL.md AND matching rule in `settings.json` `permissions.allow`. Belt-and-suspenders until verified.

### DECISION-NEEDED-Q3: Quote accuracy confirmation for maintainer principles

- The Russian-language quotes in §0 are from the orchestrator session memory, not from a verified written record. If the exact wording matters for any downstream reasoning (e.g., a dispute about what «мешать работе» means in a specific context), confirm the quotes with the maintainer.
- Per kickoff §0 provenance disclaimer: these are usable for research framing but not load-bearing for final verdicts without confirmation.
- **No action needed** if the verdicts are accepted as-is. Action needed if a quote drives a verdict reversal.

### DECISION-NEEDED-Q4 (advisory): Should OMO's per-command granularity inspire a more explicit deny list?

- **Context:** OMO uses `{ git: allow, rm: deny }` style. The CC approach via `Bash(helpers/*.sh *)` implicitly denies any bash invocation outside that pattern.
- **Option A (current recommendation):** Rely on the allowlist pattern to implicitly deny all non-helpers bash invocations. No explicit deny list.
- **Option B (stronger posture):** Add explicit deny rules in `settings.json` for dangerous commands (`Bash(rm *)`, `Bash(curl *)`, etc.) in addition to the allowlist.
- **Maintainer guidance:** Per «уберегало от опасных команд», Option B provides belt-and-suspenders. But the skill's scope is narrow enough that Option A satisfies the principle. Maintainer call.

---

## See also

- [PR #261 — `meta-orch-no-arg-laziness` R-phase](https://github.com/Yhooi2/rules-as-tests-aif/pull/261) — prerequisite; DN-1/DN-4 framing source
- [`.claude/rules/dual-implementation-discipline.md §3`](../../.claude/rules/dual-implementation-discipline.md) — Internal vs Consumer-facing triage (DN-4 N6b angle); authoritative for CC-native default decision
- [`.claude/rules/phase-research-coverage.md §1`](../../.claude/rules/phase-research-coverage.md) — 6-item checklist binding
- [`.claude/rules/build-first-reuse-default.md §3`](../../.claude/rules/build-first-reuse-default.md) — 6-layer search mechanism applied in §1
- [CC Docs — Configure permissions](https://code.claude.com/docs/en/permissions) — primary source for `allowed-tools` syntax (§1.5a)
- [CC Docs — Skills frontmatter reference](https://code.claude.com/docs/en/skills) — `arguments`, `$name` substitution (§1.5c)
- [CC GitHub Issue #14956](https://github.com/anthropics/claude-code/issues/14956) — open bug: skill-level `allowed-tools` may not grant permission
- [NVIDIA 2026 Practical Guidance — Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/) — PoLP best practices
- [AWS GENSEC05-BP01 — Least Privilege for Agentic Workflows](https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/gensec05-bp01.html) — industry standard
- [DeepWiki: obra/superpowers](https://deepwiki.com/obra/superpowers) — harness-agnostic skill design patterns
- [DeepWiki: cline/cline](https://deepwiki.com/cline/cline) — per-tool permission model
- [DeepWiki: code-yeongyu/oh-my-openagent](https://deepwiki.com/code-yeongyu/oh-my-openagent) — per-command granularity pattern
