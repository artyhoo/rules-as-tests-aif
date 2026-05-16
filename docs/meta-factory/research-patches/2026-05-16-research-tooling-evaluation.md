<!-- scope:research-tooling-evaluation -->
# Research-tooling evaluation — research patch

> **Authoritative for:** research-tooling evaluation results (2026-05-16) — DeepWiki MCP vs Context7 experimental comparison, decision matrix for tool selection, proposed SSOT entry #42, coverage gap findings for SSOT #27-#30 (AIF Handoff family), proposed SSOT entries #43-#46.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). SSOT itself — see [prior-art-evaluations.md](../prior-art-evaluations.md) (this patch proposes entries; adoption is maintainer decision per §6 below).
> **Origin:** kickoff at [.claude/orchestrator-prompts/research-tooling-evaluation/kickoff.md](../../../.claude/orchestrator-prompts/research-tooling-evaluation/kickoff.md)
> **Date:** 2026-05-16
> **Status:** DRAFT — awaiting maintainer review on D1-D5 open decisions

---

## §1 Problem

The project's build-vs-reuse SSOT (`prior-art-evaluations.md`) has been built primarily via **Context7 MCP + WebSearch + manual reasoning**. Context7 is designed for «how do I call this API?» queries — it returns documentation snippets for specific library tasks, keyed to what a developer needs while coding against an API surface.

Build-vs-reuse evaluation — this project's load-bearing discipline — asks structurally different questions:

- «How is library X internally architected? What are its structural constraints?»
- «How does library X differ from library Y at the design level?»
- «What tradeoffs did library X's authors make, and why?»
- «Does library X's problem class match our problem class?» (T16 check)

Context7 is not designed for these. **DeepWiki MCP** — which grounds `ask_question` in actual repo code + generated architecture topics — is better positioned for them, but this claim is a hypothesis. The session's central task is to verify it with real data (3 experimental questions), check whether past SSOT entries would have been different if DeepWiki had been used, and produce a defensible decision matrix.

**Framing check vs kickoff:** the kickoff's §1 is consistent with the above restatement. No material drift detected. The only nuance is that the kickoff frames this as «open question» while evidence already pre-collected in §10.1-§10.3 leans toward confirming the hypothesis. This patch treats the pre-collected evidence as inputs to §3 experimental comparison, not as conclusions — per kickoff instruction.

---

## §2 Prior art sweep

Per [phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md) checklist items 1-6 applied.

### External sources found

**Source 1 — Context7 vs DeepWiki comparison (mcp.directory)**
- URL: <https://mcp.directory/compare/context7-vs-deepwiki>
- Key finding: Both are TypeScript MCP servers with streamable-http transport. Context7 has 15,522 stars vs DeepWiki 3,433. **Both offer distinct tool surfaces** — Context7 specializes in library documentation lookup (`resolve-library-id`, `query-docs`); DeepWiki specializes in repo-level understanding (`read_wiki_structure`, `read_wiki_contents`, `ask_question`). The tools do not overlap: Context7 resolves library IDs and queries curated docs; DeepWiki generates and queries AI-generated per-repo wikis. These are complementary, not competing tool sets.
- Relevance: direct comparison; confirms tools have non-overlapping tool surfaces.

**Source 2 — Top 7 MCP Alternatives for Context7 in 2026 (dev.to/neuledge)**
- URL: <https://dev.to/moshe_io/top-7-mcp-alternatives-for-context7-in-2026-2555>
- Key finding: When Context7 lacks coverage, it falls back to DeepWiki community documentation. Also cites GitMCP, Docfork as alternative doc-lookup tools. This confirms the market-framing: DeepWiki and Context7 are frequently mentioned in the same breath as complementary, not rival tools.
- Relevance: confirms ecosystem framing; no production project documents a «use DeepWiki for build-vs-reuse, Context7 for API lookup» split as formal policy — which means this SSOT entry would be the first such formalization.

**Source 3 — DeepWiki: The New Way to Understand and Reuse Code (Medium / Fabiani)**
- URL: <https://medium.com/@dario.fabiani/deepwiki-and-the-new-way-to-understand-and-reuse-code-f0fae8163f2b>
- Key finding: DeepWiki positions itself around «code is the source of truth» — not documentation summaries. It enables agents to comprehend *implementation details* and evaluate whether code could be extracted and made self-contained. This is the «architectural understanding» axis, which is precisely what build-vs-reuse SSOT evaluation requires.
- Relevance: independent confirmation of DeepWiki's design center being architectural understanding, not API-signature lookup.

**Source 4 — Cognition/Devin DeepWiki MCP Server announcement**
- URL: <https://cognition.ai/blog/deepwiki-mcp-server>
- Key finding: Tools confirmed (`ask_question`, `read_wiki_contents`, `read_wiki_structure`). Free, no auth for public repos. Directed to docs.devin.ai for endpoints. No rate limit disclosure.
- Relevance: primary source (vendor) confirming verified-2026-05-13 facts in kickoff §10; no new surprises.

**Source 5 — DeepWiki indexing coverage (codersera.com / cognition.ai blog)**
- URL: <https://codersera.com/blog/how-to-use-deepwiki-understand-large-codebases-faster>
- URL: <https://cognition.ai/blog/deepwiki> (blog archive)
- Key finding: **50,000+ most popular public GitHub repos indexed.** Visiting `deepwiki.com/<owner>/<repo>` triggers on-demand indexing in «minutes» for unindexed popular repos. For fast-moving repos, index may lag HEAD by hours or days. No explicit freshness schedule published. Private repos require Devin subscription.
- Relevance: resolves the «Unknown — which repos indexed» from kickoff §10. Critical: index coverage is NOT universal (see kickoff §10.1 Test 2 — `lee-to/aif-handoff` not initially indexed). On-demand trigger exists and is reasonably fast.

**Source 6 — Sourcegraph Cody MCP (sourcegraph.com/docs/api/mcp.md)**
- URL: <https://sourcegraph.com/docs/api/mcp.md>
- Key finding: Sourcegraph provides an MCP server with `keyword_search` and `nls_search` (semantic search) tools. Scope: keyword + semantic search across code repositories. **This is NOT an architectural-understanding tool** — it returns file:line results, not generated architectural narratives. Enterprise-only for private repos; public Sourcegraph.com for public repos.
- Relevance: alternative candidate. Problem class is code search (finding where X is), not architectural understanding (explaining why X is designed this way). Different tool for different question type.

**Source 7 — GitHub MCP Server official (github.com/github/github-mcp-server)**
- URL: <https://github.com/github/github-mcp-server>
- Key finding: 162+ tools in logical toolsets (repos, issues, PRs, etc.). Supports GitHub code search syntax (`content:Skill language:Java org:github`). Returns file content, search results, commit history. No AI-generated narrative layer.
- Relevance: alternative candidate for code search. Same category as Sourcegraph: returns content/search results, not architectural understanding. Complementary to DeepWiki for verification (raw code) vs understanding (generated wiki).

**«No production analog» check:**
The search did not surface any production project that documents a formal «use DeepWiki for SSOT evaluation, Context7 for API lookup» policy. This is a negative-existence result. Applying the 6-item checklist:

1. **Own-stack sweep:** Current stack has Context7 MCP (already used), DeepWiki MCP (installed per kickoff §10 verified 2026-05-13). Both are own-stack tools.
2. **Category sweep:** Tools in the «code research for AI agents» category: Context7, DeepWiki, Sourcegraph Cody MCP, GitHub MCP Server, GitMCP, Docfork. All checked above. No production analog to a «tool-selection decision matrix for prior-art evaluation» exists.
3. **Semantic-distance check:** «tool selection criteria for AI research» → «research workflow documentation» → «documentation-as-code tooling decisions.» No hits on formal policy for context7-vs-deepwiki split.
4. **Adversarial check:** «If a formal workflow policy for context7 vs deepwiki existed, where would it live?» → It would live in AGENTS.md-style project documentation or a blog post on developer workflows. Searched both categories; no hit. Negative finding is plausible (this split is new in 2026; ecosystem hasn't formalized it yet).
5. **Prompt-list floor:** kickoff §4.0 specified 5 context7 + 3 WebSearch queries; all executed; ≥5 external sources found. Floor met.
6. **Trigger sweep:** N/A (this is a research-only session, not phase entry research).

**Conclusion:** «No production workflow policy documenting context7 vs DeepWiki tool-selection criteria» is a **provisionally load-bearing** negative claim. Coverage is adequate for 7 sources across multiple categories; recommend citing this section if the decision matrix is promoted to a `.claude/rules/` file.

---

## §3 Experimental comparison

Per kickoff §4.1 — three questions run through both Context7 and DeepWiki. Tool availability confirmed: DeepWiki MCP tools (`read_wiki_structure`, `ask_question`) operational in this session.

### Q1 — From SSOT #41 ADOPT (Danger JS): «How does `danger.git.commits` API expose commit message bodies for trailer parsing? What are the limitations?»

**Context7 result** (`/danger/danger-js`, `query-docs`):

> `danger.git.commits` — array of `GitCommit` objects, each with `sha`, `message` (string), `author`, `committer`, `url`, `parents`. No dedicated body-vs-subject split. The `message` field is a plain string containing the full commit message. No built-in trailer parsing. Example from docs: filtering commits by regex on `commit.message`. Source: <https://context7.com/danger/danger-js/llms.txt>

**DeepWiki result** (`danger/danger-js`, `ask_question`):

> Confirmed `message` field is plain string (no body/subject split). Test fixtures show messages like `"Merged in develop...\n\nDevelop to SIT\n\nApproved-by: Hello Core <foo@bar.com>\n"` — demonstrating trailer-like content is present but unparsed. **Additional finding:** DeepWiki explicitly confirmed no built-in trailer parsing exists anywhere in the codebase. Recommends consulting `source/dsl/Commit.ts` directly. Source: <https://deepwiki.com/search/how-does-dangergitcommits-api_be94f2b9-dc23-415c-9572-ff386981d089>

**Delta:** Both tools agree: plain string, no built-in trailer parsing. DeepWiki adds the test fixture example (concrete evidence from actual test files), which is more grounded than Context7's API-documentation description alone. Delta is **substantive but small** — DeepWiki provides code-grounded confirmation; Context7 provides API reference description.

**Verdict-change relevant?** NO — both tools lead to the same ADOPT verdict for Danger JS. The additional fixture evidence from DeepWiki is confirmatory, not contradictory.

---

### Q2 — From SSOT #38 DEFER (CodeRabbit): «Does CodeRabbit's review pipeline allow deterministic non-LLM rules?»

**Context7 result** (`/websites/coderabbit_ai`, `query-docs`):

> `pre_merge_checks` YAML schema: `custom_checks` field with `name`, `mode` (off/warning/error), `instructions`. Also `docstrings`, `title`, `description`, `issue_assessment` built-in checks. Source: <https://docs.coderabbit.ai/pr-reviews/pre-merge-checks>

> **Context7 framing:** the `instructions` field uses «natural language» — implying LLM evaluation of the instructions. No explicit mention of AST-grep or static analysis in the `pre_merge_checks` context.

**DeepWiki result** (`coderabbitai/coderabbit-docs`, `ask_question`):

> **YES — static analysis tools are deterministic.** DeepWiki surfaced: (1) 15+ linters/security tools (Ruff, ESLint, Biome, Gitleaks, Semgrep, etc.) run deterministically before LLM evaluation; (2) **AST-grep rules** (Pro Plan) — purely deterministic pattern matching without LLM. Config:
> ```yaml
> reviews:
>   tools:
>     ast-grep:
>       essential_rules: true
>       rule_dirs: ["custom-name"]
> ```
> Source: <https://deepwiki.com/search/does-coderabbits-review-pipeli_4cb64000-e440-42ad-ac2f-cb03c9d1c71c>

**Delta:** **Significant.** Context7 surfaced only the LLM-evaluated `custom_checks` field. DeepWiki surfaced the deterministic linter integration + AST-grep Pro feature that allows purely deterministic non-LLM rules. This is exactly the question that determined SSOT #38's DEFER verdict: «no deterministic non-LLM rules path.» DeepWiki's answer is «there IS a deterministic path — via static analysis tools + AST-grep.»

**Verdict-change relevant?** **POTENTIALLY YES** — the SSOT #38 DEFER rationale says «(a) SaaS-only, no self-hosting path; (b) no deterministic paired-negative arm.» DeepWiki reveals item (b) may be incorrect: static analysis tools run deterministically before LLM, and AST-grep provides a Pro-plan deterministic path. However, items (a) SaaS-only + (c) FP rate undocumented + (d) Project adopted Danger JS as deterministic alternative remain valid. **Verdict would NOT flip from DEFER to ADOPT** on this evidence alone (SaaS dependency is the blocking constraint), but the rationale for item (b) needs updating.

**Flag:** Retroactive coverage gap for SSOT #38 — item (b) rationale partially incorrect. Propose §13.x entry per §4.2 below.

---

### Q3 — From SSOT #33 DEFER (Continue.dev): «How is Continue.dev's per-tool permissions YAML schema structured? What's its scope?»

**Context7 result** (`/websites/continue_dev`, `query-docs`):

> `~/.continue/permissions.yaml` with three levels: `allow`, `ask`, `exclude`. Supports tool name patterns (`Write(**/*.ts)`, `Bash(npm install*)`). CLI flags (`--allow`, `--ask`, `--exclude`) override the file. Affects: `Read`, `Write`, `Edit`, `Bash`, MCP tools, and wildcard `*`. Source: <https://docs.continue.dev/cli/tool-permissions>

**DeepWiki result** (`continuedev/continue`, `ask_question`):

> Confirms the same three-level schema. **Additional architectural depth:** (1) explicit precedence order (mode policies > CLI flags > permissions.yaml > defaults); (2) `argumentMatches` for fine-grained control; (3) default policies per tool category (Write tools default: `ask`; Read tools default: `allow`; Bash headless: `allow`); (4) dynamic policy evaluation for dangerous Bash patterns (`sudo`, `eval`, `rm -rf`) even when Bash is set to `allow`. Source: <https://deepwiki.com/search/how-is-continuedevs-pertool-pe_c4faf867-f56f-4063-a20f-5baed512b13b>

**Delta:** DeepWiki provides significant architectural depth: precedence order, per-category defaults, argument-based matching, dynamic danger-command evaluation. Context7 provides the schema syntax and examples. For the SSOT entry question («does Continue.dev's permission schema match our use case?»), DeepWiki's precedence + argument-matching depth is architecturally relevant — it shows Continue.dev's model is more sophisticated than simple allow/ask/exclude.

**Verdict-change relevant?** **NO** for SSOT #33's DEFER verdict — the key difference was «per-tool-call granularity finer than our per-MCP-install granularity,» which remains true. The additional architecture detail doesn't change the fit assessment. But it DOES inform the «Trigger to revisit» — the `argumentMatches` feature makes Continue.dev more adaptable to our use case than the initial entry suggested.

---

### Summary table

| Question | Context7 result (key fact) | DeepWiki result (key additional fact) | Delta | Verdict-change? |
|---|---|---|---|---|
| Q1 Danger JS `danger.git.commits` trailers | Plain string, no trailer parsing | Code-grounded confirmation via test fixtures | Substantive but small | NO |
| Q2 CodeRabbit deterministic non-LLM rules | LLM-evaluated `custom_checks` only | Static analysis + AST-grep Pro = deterministic path | Significant — surfaces missed feature | Partial: rationale (b) needs update |
| Q3 Continue.dev permissions schema | allow/ask/exclude + glob patterns | Precedence order + argument-based matching + danger-pattern override | Significant architectural depth | NO verdict flip; trigger update needed |

---

## §4 Coverage gap check

### Q1 (Danger JS) — NO coverage gap

DeepWiki's fixture-based confirmation adds evidentiary strength but not new facts. Context7 was adequate for the ADOPT verdict. No research-patch sub-entry opened.

**T14 note:** audit is positive for Q1 but coverage remains 1/3 samples. Cannot conclude Context7 is generally adequate from this single data point.

### Q2 (CodeRabbit) — YES: retroactive coverage gap (partial)

**Gap:** SSOT #38 rationale item (b) «no deterministic paired-negative arm for judge itself» is partially incorrect. CodeRabbit DOES support deterministic static analysis tools (15+ linters) and AST-grep Pro for purely deterministic rules. Context7's `pre_merge_checks` documentation did not surface this because the context7 query was narrowly scoped to `pre_merge_checks.custom_checks` — the LLM-evaluated path.

**Impact on verdict:** DEFER verdict itself is NOT overturned — SaaS-only constraint (item a) + FP rate undocumented (item c) remain valid blocking constraints. Danger JS (#41) is now the adopted alternative. But the rationale for item (b) is factually incomplete.

**Action:** Open §13.x entry for SSOT #38 rationale correction. Per kickoff §4.2 and §7 D3 — this is a research patch flag, NOT a within-session SSOT edit. Atomic commit for SSOT correction is separate work.

**Finding registered as:** `#context7-only-missed-deterministic-path` — context7 scoped to `pre_merge_checks` docs returned LLM-path only; DeepWiki queried the full coderabbitai/coderabbit-docs repo and surfaced the tool-integration + AST-grep deterministic paths. Root cause: context7 query keyed to the SSOT question's framing («custom checks»), not to the broader architectural question («what deterministic paths exist in the pipeline»).

### Q3 (Continue.dev) — NO verdict-change gap; trigger update warranted

DeepWiki reveals `argumentMatches` for argument-based matching — a more sophisticated permission model than the SSOT entry described. No verdict flip but the entry's «Trigger to revisit» line could be sharpened. Not opening a formal research-patch sub-entry (no verdict change, information is confirmatory not contradictory).

**T14 application:** 1/3 questions surfaced verdict-affecting evidence (Q2). Per kickoff §4.1 framing: «1-2/3 → ADOPT-CONDITIONAL with documented use-case.» This is the interpretation this session adopts for the DeepWiki verdict recommendation in §6.

---

## §5 Decision matrix

Per kickoff §4.3: 4+ rows, concrete examples per row.

| # | Question shape | Recommended tool | Rationale | Example query |
|---|---|---|---|---|
| 1 | **API signature / current usage** — «What parameters does function X accept? What's the return type?» | **Context7 primary** | Context7 indexes curated library documentation with API reference snippets. Returns structured API docs, type definitions, examples. DeepWiki returns AI-generated narrative that may miss recent API surface changes. | «How does `danger.git.commits` expose the message field?» → Context7 returns API schema + usage example directly. |
| 2 | **Architectural understanding / tradeoffs** — «How is feature X internally designed? What tradeoffs were made?» | **DeepWiki primary** | DeepWiki generates per-repo wikis from actual code analysis; `ask_question` grounds answers in repo structure. Context7 returns documentation snippets that may not cover internal design decisions. | «What is CodeRabbit's review pipeline structure and where do deterministic tools fit?» → DeepWiki surfaced the static-analysis → LLM evaluation architecture; Context7 returned only `pre_merge_checks` API docs. |
| 3 | **Cross-tool comparison** — «How does library X differ from library Y architecturally?» | **WebSearch + DeepWiki + Context7 (multi)** | No single tool covers cross-repo comparison authoritatively. WebSearch surfaces comparison articles and community analysis. DeepWiki provides architectural depth on individual repos. Context7 provides API-signature precision for specific claims. | «How does Continue.dev's permissions model compare to CodeRabbit's review pipeline controls?» → WebSearch for comparison articles, DeepWiki for each repo's architecture, Context7 for specific API schemas. |
| 4 | **Build-vs-reuse SSOT evaluation** — «Does library X's problem class match our problem class?» | **DeepWiki primary + Context7 + WebSearch as cross-check** | T16 check requires understanding upstream problem class. DeepWiki's `read_wiki_structure` reveals what domains the repo addresses; `ask_question` probes problem-class fit directly. Context7's API docs reveal what the public surface looks like but not the internal design boundaries. | «Does `@aif/runtime` RuntimeAdapter's problem class match our AI-agnostic sub-agent boundary?» → DeepWiki: confirmed adapter interface + registry pattern + multi-runtime dispatch. Context7: shows API usage examples but not architectural scope. |
| 5 | **Repo coverage check** — «Is repo X indexed by DeepWiki?» | **DeepWiki `read_wiki_structure` first** | DeepWiki returns «Repository not found» for unindexed repos. This is a prerequisite gate before any `ask_question` call. If not indexed: trigger via deepwiki.com URL and wait 10-30 min (per §10.1 / §10.3 observations), or fall back to Context7 + WebSearch only. | «Is `lee-to/aif-handoff` indexed?» → `read_wiki_structure` returned 10 sections after manual trigger (kickoff §10.3). First check: always run `read_wiki_structure` before `ask_question` to avoid silently getting no-data response. |
| 6 | **Freshness-sensitive query** — «What is the current API for X in library version N?» | **Context7 primary; DeepWiki as corroboration only** | DeepWiki's index may lag HEAD by hours-to-days (confirmed per §2 Source 5 above). For version-specific or recently-changed APIs, Context7's curated docs are more reliable. DeepWiki appropriate for stable architectural patterns not likely to change with minor versions. | «What is the current skill naming convention in AIF 2.x?» → Kickoff §10.1 Test 4 found Context7 (2.x branch) returned `aif-*` prefix correctly while DeepWiki (HEAD/main) returned v3 `ai-factory.*` namespace — different temporal snapshots. |

**Additional row emerging from Q2 finding:**

| 7 | **Negative-existence check** — «Does library X implement feature Y?» | **DeepWiki primary** | Context7 returns what is documented; DeepWiki searches the actual codebase. Absence from Context7 docs is NOT proof of absence from code. Q2 showed this concretely: CodeRabbit's AST-grep + static-analysis features exist but were not surfaced by Context7's `pre_merge_checks`-keyed query. | «Does CodeRabbit's pipeline have deterministic paths beyond LLM?» → Context7 missed it; DeepWiki found it (Q2 above). |

---

## §6 SSOT entries proposed

### Entry #42 — DeepWiki MCP (proposed)

**Verdict: ADOPT-CONDITIONAL**

| Field | Value |
|---|---|
| ID | 42 |
| Candidate | Devin/Cognition DeepWiki MCP (`mcp.deepwiki.com/mcp`, Streamable HTTP, 2025-2026) |
| Capability matched | Architectural understanding and build-vs-reuse SSOT evaluation for public GitHub repos — `ask_question` grounded in repo code; `read_wiki_structure` provides topic map; `read_wiki_contents` for full wiki pages |
| First seen | 2026-05-13 |
| Last reviewed | 2026-05-16 |
| Verdict | `ADOPT-CONDITIONAL` |
| Rationale | Verified 2026-05-16 via experimental comparison (§3 Q1-Q3 in research patch 2026-05-16-research-tooling-evaluation.md): DeepWiki surfaces architectural depth that Context7 misses — specifically Q2 (CodeRabbit deterministic paths, verdict-relevant) and Q3 (Continue.dev precedence/argument-matching). Conditions: (1) **Public repos only** — free, no auth; private repos require Devin subscription (blocked by no-paid-LLM-in-CI policy); (2) **Coverage check mandatory** — run `read_wiki_structure` before `ask_question`; unindexed repos return «Repository not found» (kickoff §10.1 Test 2). On-demand indexing trigger available via deepwiki.com URL, 10-30 min latency. (3) **Freshness caveat** — index may lag HEAD by hours-to-days; for version-specific queries, Context7 preferred (confirmed by v2 vs HEAD naming discrepancy in kickoff §10.1 Tests 3+4). T16 problem-class match: DeepWiki upstream = «understand open-source repo architecture»; our use = «build-vs-reuse SSOT evaluation for adoption candidates.» Match is STRONG — both require architectural understanding of the tool's design decisions, not just its API surface. 50,000+ repos indexed; popular tools we evaluate (Danger JS, CodeRabbit, Continue.dev, AIF) all accessible. **Velocity: FAST** (Cognition/Devin active development; indexing scope and tool API evolving). |
| Trigger to revisit | 90-day check on Devin docs (docs.devin.ai/work-with-devin/deepwiki); OR DeepWiki adds private-repo support at no extra cost (re-evaluate for Phase 10 swarming use); OR Context7 adds repo-structural-understanding mode covering architectural narratives; OR DeepWiki index coverage drops significantly (current: 50k+ repos) |

**Rationale for ADOPT-CONDITIONAL over ADOPT:** Three conditions (public-only, coverage-check, freshness-caveat) require per-use verification steps. A bare ADOPT verdict would imply unconditional substitution for Context7, which is not warranted — the tools are complementary, not substitutes. Decision matrix row assignment (§5) is the adoption mechanism.

---

### On entries #43-#46 (aif-handoff packages) and #27-#30 corrections

**Decision: DEFER both to the `aif-ssot-corrections` kickoff — atomic commit discipline.**

Per kickoff §6 and §3 hard constraints:

**For #43-#46 (`@aif/runtime`, `@aif/mcp`, `@aif/agent` Watchdogs, Subagents-vs-Skills):**

These are structurally separate SSOT additions requiring:
- `@aif/runtime` RuntimeAdapter: problem-class match analysis (our AI-agnostic sub-agent boundary vs their multi-runtime dispatch — different abstraction layers)
- `@aif/mcp` MCP Integration: Phase 10 dependency decision (adopt for swarm coordination?)
- `@aif/agent` Watchdogs: self-healing pattern evaluation (absent from our orchestrator skill)
- Subagents vs Skills: DeepWiki Q on `lee-to/ai-factory` returned «no Subagents mode found» — per kickoff §10.3, the Subagents/Skills dichotomy is in `lee-to/aif-handoff`, not in `lee-to/ai-factory`. Attribution confusion replicates the same root cause as #27-#30.

Each requires a separate context7 + DeepWiki sweep per the SSOT entry schema (Rationale field requires ≥1 external link + context7 citation). Bundling into this research patch would add 4 incomplete entries (no proper prior-art sweep per entry) violating the SSOT entry schema.

**For #27-#30 corrections:**

Kickoff §10.2 documents critical attribution errors (SSOT #30 cites `lee-to/ai-factory v2.x, subagents/implement-coordinator.md` — a path that DeepWiki confirms does NOT exist in that repo). These corrections require:
- Atomic SSOT edit (per CLAUDE.md: «edits to existing rows tracked via git history — no in-file changelog»)
- Each correction needs fresh context7 + DeepWiki sweep to propose corrected citations
- At least #30 is CRITICAL (cited file path doesn't exist in cited repo)

**This session's scope:** research patch only. The `aif-ssot-corrections` kickoff (queue item #5) handles these atomically. This decision is recorded here to satisfy the kickoff §6 obligation to «decide explicitly.»

**Implication for orchestrator state.md:** queue item #5 (`aif-ssot-corrections`) should NOT be skipped (condition «skip if #1 absorbed #42/#43/#44 entries atomically» does NOT apply — this session deliberately deferred #43-#46 and all #27-#30 corrections).

---

## §7 Adversarial counter-prompt

**Counter-prompt:** «What tool category did I miss in the §2 prior-art sweep?»

Running the adversarial counter-prompt explicitly (per T7 discipline — write and run, don't declare «applied»):

> «If a better tool than Context7 + DeepWiki for build-vs-reuse SSOT evaluation existed, where would it live and what would its docs look like?»

Candidates NOT evaluated in §2:

1. **GitMCP** — an MCP server that lets you query any GitHub repo's docs via the Model Context Protocol (referenced in Source 2 above). Design center: fetch `llms.txt` or README from any repo without LLM-generated narrative. Scope: documentation fetch, not architectural analysis. Less powerful than DeepWiki for architectural questions; similar to Context7 for docs access. **Verdict: narrower scope than both; not a superior alternative for architectural understanding.** Source: <https://dev.to/moshe_io/top-7-mcp-alternatives-for-context7-in-2026-2555>

2. **Docfork** — referenced as Context7 alternative in same article. Fetches live docs similarly to Context7. No architectural analysis. Not a superior alternative.

3. **Sourcegraph Cody MCP** (`keyword_search`, `nls_search`) — checked in §2 Source 6. Returns file:line results, not architectural narratives. Requires Sourcegraph instance for private repos; public.sourcegraph.com for public repos. Better for «find where X is used» than «explain how X is architecturally designed.» **Not a superior alternative for SSOT architectural understanding but IS a potential complement for code-search tasks.**

4. **`asyncfuncai/deepwiki-open`** — an open-source self-hosted DeepWiki clone. Automatically creates interactive wikis from GitHub/GitLab/BitBucket repos. Source: context7 `/asyncfuncai/deepwiki-open`. This could be used for **private repos** without Devin subscription — directly addressing the public-only condition of entry #42. **Flag for maintainer:** if private-repo coverage is needed (e.g., for evaluating internal tools), `deepwiki-open` self-hosted is the escape hatch. Does NOT change entry #42 verdict but is a relevant addition to Trigger-to-revisit.

5. **LLM-based codebase Q&A (e.g., Cursor `@codebase`, Claude Code direct repo read)** — any AI tool that can read a full repo and answer questions qualifies as a «DeepWiki alternative.» These are subscription-bundled (no extra cost); the tradeoff is no pre-built wiki structure, slower for large repos, and subject to context window limits. For repos DeepWiki hasn't indexed, this is the current fallback. Not a production analog to DeepWiki's structured wiki approach.

**Conclusion:** No tool category was materially missed. The landscape is: documentation-lookup (Context7, GitMCP, Docfork), architectural-understanding (DeepWiki), code-search (Sourcegraph Cody MCP, GitHub MCP Server), general code Q&A (LLM + repo read). Decision matrix §5 covers the first two and third category; the fourth is the implicit fallback always available in Claude Code sessions.

**Additional flag:** `asyncfuncai/deepwiki-open` should be added to entry #42's Trigger-to-revisit as the private-repo escape hatch. Proposed addition to the entry: «OR `asyncfuncai/deepwiki-open` self-hosted proves viable for private repos (evaluate for Phase 10 private-tool SSOT evaluation).»

---

## §8 Open decisions (Dn)

**D1 — Verdict on DeepWiki MCP.**

R-phase recommendation: **ADOPT-CONDITIONAL** (§6 entry #42). Conditions: public-only, coverage-check mandatory, freshness caveat for version-specific queries. Rationale: 1/3 experimental questions surfaced verdict-relevant evidence not available via Context7 alone (Q2 CodeRabbit); tool is free, no auth, session-bound (fits no-paid-LLM policy). Maintainer confirms or revises verdict.

**D2 — Decision matrix promotion path.**

Options:
- A. Keep in research patch only (low friction, not enforced)
- B. Promote to `.claude/rules/research-tool-selection.md` (formal rule; trigger enforcement via §1.7 forward+backward check; promotion threshold per phase-research-coverage.md §5: «3 consecutive phase-entry sessions use it without amendment»)
- C. Add as an appendix to `phase-research-coverage.md §1` (integrated into existing rule)

R-phase recommendation: **Option B** after threshold (3 uses). Start as research-patch-only; if aif-ssot-corrections kickoff and Wave 10 both use the matrix naturally, promote. Decision timeline: at Wave 10 kickoff (queue item #3).

**D3 — Backfill scope for SSOT #38.**

Q2 finding: SSOT #38 item (b) rationale partially incorrect. Options:
- A. Open §13.x entry to track the correction and schedule it for aif-ssot-corrections kickoff (recommended default per kickoff §7)
- B. Correct #38 within aif-ssot-corrections kickoff atomically with #27-#30 corrections

R-phase recommendation: **Option B** — bundle with aif-ssot-corrections rather than opening a third §13.x entry. The correction is bounded (update item (b) rationale to note static-analysis + AST-grep pro path exists, while maintaining DEFER because SaaS+FP constraints remain). Not a verdict flip. Aif-ssot-corrections kickoff scope can absorb this.

**D4 — v2.1.100 token bug response.**

Per kickoff §7 and T-RT-B scope constraint: observe only. The token inflation bug is real (Anthropic-acknowledged, GitHub issue #46917), this session runs on v2.1.98 (downgraded per memory), and any Phase 10 / swarm plan that scales Claude Code sessions is materially affected. R-phase recommendation: **open §13.x entry** for tracking the version policy decision. Proposed entry text: «v2.1.100+ token inflation (GitHub #46917): track when Anthropic releases server-side fix; evaluate whether downgrade policy should be documented in CLAUDE.md or CONTRIBUTING.md.» This is a one-line ARMED entry, not a research session.

**D5 — Agent Teams readiness.**

Per kickoff §7: out of scope for this session. R-phase answer: **YES, warrant a separate follow-up research session** once D1-D3 are resolved and queue items #3 (Wave 10 hook architecture) and #4 (think-time §1.7 gate) are complete. The `@aif/agent` and `@aif/mcp` packages surfaced in kickoff §10.3 provide ~60-70% coverage of swarm infrastructure gaps. A structured swarm-readiness session should evaluate these packages against our specific gap list. Estimated: 2-4 hours, same session format as this one. Kickoff sketch exists (mentioned in queue item #2 in state.md as `swarm-tools-research 1B`).

---

## §9 Recursive self-application

Per kickoff §4.4 and T15 (mandatory).

**Question:** applying the decision matrix from §5 retroactively to this session's own methodology — which questions in §4.0 prior-art sweep should have used DeepWiki vs Context7 per the matrix I produced?

### Session methodology audit

**§2 prior-art sweep used:**

| Query | Tool used | Matrix recommendation | Match? |
|---|---|---|---|
| DeepWiki MCP tools + capabilities | Context7 `/websites/deepwiki` | Matrix row 1 (API signature) → Context7 PRIMARY ✓; also row 2 (architectural) → DeepWiki | Partial match — should have also run DeepWiki `read_wiki_structure` on `upstash/context7` and `CognitionAI/deepwiki` for structural comparison |
| Sourcegraph Cody MCP architecture | Context7 `/websites/sourcegraph` | Matrix row 4 (build-vs-reuse / architectural) → DeepWiki primary | **Miss** — should have run `mcp__deepwiki__ask_question` on `sourcegraph/cody` for architectural understanding, not just Context7 |
| GitHub MCP capabilities | WebSearch | Matrix row 3 (cross-tool comparison) → WebSearch + DeepWiki + Context7 | Partial — WebSearch only; should have added DeepWiki `ask_question` on `github/github-mcp-server` for architectural depth |
| Context7 vs DeepWiki comparison | WebSearch + WebFetch | Matrix row 3 (cross-tool comparison) → Multi | Adequate — WebSearch is the right first tool for cross-tool comparison articles |
| DeepWiki indexing coverage | WebSearch | Matrix row 1 (API signature / current docs) → Context7 or WebSearch | Adequate — indexing coverage is factual documentation, WebSearch appropriate |

**Self-application findings:**

1. **Miss identified:** For the Sourcegraph Cody MCP architectural evaluation (§2 Source 6), this session used Context7 only and concluded «Sourcegraph Cody is NOT an architectural-understanding tool.» Per matrix row 4 (build-vs-reuse evaluation), the correct approach would have been to also run DeepWiki `ask_question` on `sourcegraph/cody` to verify this conclusion from architectural evidence. The Context7 result returned search API docs; DeepWiki would have confirmed or contradicted the «search-not-understand» characterization.

2. **Assessment:** The Sourcegraph characterization is almost certainly correct (search-first vs narrative-first is a fundamental design difference documented in external comparison articles), but it was not DeepWiki-verified per the session's own matrix. This is a T15 finding — the audit applied its own tool-selection matrix to prior art candidates but not to its own §2 tool choices.

3. **Remediation:** Low priority — the Sourcegraph conclusion is robust from WebSearch + Context7 evidence. However, the §5 matrix row 4 should note «also run `read_wiki_structure` on your prior-art candidates before relying on Context7-only architectural assessment.» This is already implicit in row 5 (coverage check), but making it explicit in row 4 would prevent the miss in future sessions.

4. **Impact on verdict:** None. The DeepWiki ADOPT-CONDITIONAL verdict in §6 is based on Q1-Q3 experimental evidence (§3), not on the §2 source characterizations.

**T7 compliance check:** This §9 ran the counter-prompt («apply the matrix to own methodology»), not just stated «applied.» Finding: 1 partial miss in §2 (Sourcegraph query). Adversarial rephrasing: «where else in this session did I use Context7 for an architectural question?» Answer: Q1 query on Danger JS was API-signature + architectural — Context7 was appropriate there (row 1); DeepWiki was also run (per §3 methodology). No additional misses found.

---

## §10 §1.7 forward + backward check

Per kickoff §5.1 and phase-research-coverage.md §1.7.

**Scope of this session:** research patch only. No code changes. Touches: `docs/meta-factory/research-patches/2026-05-16-research-tooling-evaluation.md` (this file). Does NOT touch: `docs/meta-factory/prior-art-evaluations.md` (SSOT proposals only; actual edit is separate commit). Does NOT touch: `.claude/rules/*.md`, `packages/core/principles/*.test.ts`, `README.md`, `CLAUDE.md`.

### Forward check (recommendation complies with existing disciplines)

1. **R1-R20 lint rules:** no code changes; not applicable.
2. **Principle tests (`packages/core/principles/*.test.ts`):** no code changes; not applicable.
3. **Capability-commit gate + `Prior-art:` trailer:** this session produces a research patch (Markdown file), not a capability commit (no new dep in package.json, no new file ≥80 LOC under `packages/`). The research patch itself IS a documentation artifact, not a capability commit. `Prior-art:` trailer: N/A for non-capability commits per CLAUDE.md escape hatch («refactor only, no new capability»). The commit for this patch should use: `Prior-art: skipped — research-only patch, no new capability; SSOT entry #42 proposed in patch, not landed yet`.
4. **Build-vs-reuse SSOT:** this session IS the SSOT evaluation for DeepWiki (#42). Entry proposed in §6; NOT landed in `prior-art-evaluations.md` in this session (per kickoff §3 — research patch only, SSOT entry in same commit as capability artifact). Forward check: the capability commit (if DeepWiki is adopted) requires a `Prior-art: prior-art-evaluations.md#42` trailer — that commit is separate and future.
5. **Trigger sweep:** not a phase-entry research session; trigger sweep §1.6 not invoked.
6. **Doc-authority:** this patch carries an `Authoritative-for` header at the top. ✓

### Backward check (new rule applied to existing artefacts)

This session does NOT introduce a new rule. The proposed decision matrix (§5) is a research-patch finding, not yet a `.claude/rules/*.md` entry. Backward check applies only if D2 is resolved as «promote to rule.» At that time, the backward check would require sweeping all existing research patches + phase-entry research files to confirm they comply with the matrix (i.e., no existing SSOT entry produced via architectural-question → Context7-only without a DeepWiki complement check).

**Provisional backward check for the matrix (if promoted):**

- SSOT entries #1-#41: all produced via Context7 + WebSearch. The matrix recommends DeepWiki for rows 2, 4, 7 (architectural + build-vs-reuse + negative-existence). **Exemption mechanism:** entries produced before 2026-05-16 (before DeepWiki MCP was verified available in this project's sessions) are grandfathered. The matrix is not retroactive. Q2 (SSOT #38 item b) is the only identified gap requiring correction.
- New entries from 2026-05-16 forward: covered by the matrix when promoted. No grandfathering needed.

### §1.7 self-reflexive trigger (discipline-bearing artefact check)

This patch is NOT a discipline-bearing artefact (it's a research findings document, not a rule). The research patch format is itself governed by `phase-research-coverage.md §3` — Problem/Root Cause/Solution/Prevention/Tags structure. This patch uses a different format (§1-§10 from kickoff template). Mapping to required fields:

- **Problem:** §1 ✓
- **Root Cause:** §4 coverage gap check + §9 self-application ✓
- **Solution:** §6 SSOT entries proposed ✓
- **Prevention:** §5 decision matrix (operationalises prevention) ✓
- **Tags:** see below ✓

**Tags for this patch:**
- `#context7-only-missed-deterministic-path` — Q2 CodeRabbit finding: context7 missed AST-grep + static analysis deterministic paths
- `#temporal-snapshot-mismatch` — DeepWiki HEAD vs context7 2.x branch produce different views of same repo (kickoff §10.1 Tests 3+4)
- `#coverage-not-universal` — DeepWiki does not index all repos automatically (kickoff §10.1 Test 2; 50k+ repos covers popular tools, not niche ones)
- `#tool-selection-no-formal-policy` — no production project documented a context7-vs-deepwiki workflow policy before this patch

---

*End of research patch. File written 2026-05-16 by research subagent (claude-sonnet-4-6, burn-mode). State updated in state.md per incremental-write discipline.*
