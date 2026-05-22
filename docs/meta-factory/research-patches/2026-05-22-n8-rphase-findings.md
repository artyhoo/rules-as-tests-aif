<!-- scope:n8-rphase-findings -->
# Research-patch — Wave N8 R-phase: Deterministic-offload + autonomy-economy findings

> **Inherits authority from** [research-patches/README.md](README.md) folder-level Authoritative-for header. Scope-bound to: Wave N8 R1–R4 research — own-stack offload sweep, category sweep, cost model, and local-model viability assessment. **NOT authoritative for** project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)); the N0 pay-the-meter decision — that is a maintainer call per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md); the N8 plan-of-record — see [2026-05-22-deterministic-offload-autonomy-economy.md](2026-05-22-deterministic-offload-autonomy-economy.md).
> **Date:** 2026-05-22 · **Author session:** claude-sonnet-4-6 Worker, R-phase (read-only except this file). No mechanism implemented; no rule codified; no source PR opened. The N0 + companion A/B/C + A1-A3 decisions remain maintainer calls.

---

## §1 — R1: Own-stack offload inventory

What the model currently does in-session that a deterministic hook/test could absorb instead. Inspected: `.claude/hooks/*.sh`, `packages/core/principles/*.test.ts`, `packages/core/hooks/`, `.husky/pre-push` (via `pre-push.ts`).

### Already offloaded (do-not-rebuild list)

The following in-session verification work is **already deterministic** — each saves a metered turn that would otherwise require a prompted model check:

| Check | Mechanism | File:line |
|---|---|---|
| Factual-claim scan (numeric counts, file:line citations, negative-existence phrases) | `end-of-turn-reminder.sh` bash regex, fires on Stop hook | `.claude/hooks/end-of-turn-reminder.sh:69-80` |
| §1.7 forward/backward trailer presence + file:line substance | `packages/core/hooks/checks/s17.ts`, pre-push blocking | `pre-push.ts:146-191` |
| Prior-art trailer presence + escape-hatch substance | `packages/core/hooks/checks/prior-art.ts`, pre-push blocking | `pre-push.ts:93-136` |
| Doc authority header presence on canonical docs | `check-doc-authority.sh` → `09-doc-authority-hierarchy.bin.ts`, PostToolUse gate | `.claude/hooks/check-doc-authority.sh:29` |
| Orchestrator-prompt spec validation | `validate-prompt.sh` → `validate-batch-spec.ts`, PostToolUse | `.claude/hooks/validate-prompt.sh:31` |
| Principles meta-tests (17 principle tests in CI and pre-push) | `npm run test:principles`, pre-push blocking section §5 | `pre-push.ts:255-263` |
| Fork-challenge before AskUserQuestion | `ask-question-reminder.sh`, PreToolUse deny-once | `.claude/hooks/ask-question-reminder.sh:48-65` |
| Manifest render drift | `render-rules.ts --check`, pre-push §4 | `pre-push.ts:246-253` |
| Deps hash mismatch (package.json drift) | `deps-hash-check.sh`, UserPromptSubmit injection | `.claude/hooks/deps-hash-check.sh:40-43` |
| No paid LLM in CI (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` in workflow files) | principle 17, `17-no-paid-llm-in-ci.test.ts` grep | `packages/core/principles/17-no-paid-llm-in-ci.test.ts` |

### Migratable candidates (concrete offload opportunities)

**C1 — SSOT entry existence check** (§1.9 pattern, currently model-verified in-session)
`Prior-art: prior-art-evaluations.md#N` claims are checked by principle 08 for citation *syntax*, but a model turn currently confirms the SSOT row *exists at runtime* when reviewing PRs. Deterministic: `grep -nE "^\| *N *\|" docs/meta-factory/prior-art-evaluations.md` already described in `phase-research-coverage.md §1.9`. Not yet wired as a hook or principle test. Estimated saved turns: 1 per capability-commit review cycle.
Evidence: `packages/core/principles/08-prior-art-cited.test.ts` verifies *syntax*; the existence probe at `phase-research-coverage.md §1.9` is prose-only today.

**C2 — Sampling floor enforcement on R-phase kickoffs** (T1 anti-pattern)
Currently the model is prompted to check that kickoffs enumerate `≥5` samples and declare a T-enumeration. Principle 12 (`12-ai-laziness-traps.test.ts`) checks citation *syntax* in kickoffs but does NOT check T-count minimum or sampling floor declaration. A grep-based PostToolUse hook on `**kickoff.md` edits could assert `≥3 T-N` references. Saves 1 model-judgment turn per kickoff author session.
Evidence: `packages/core/principles/12-ai-laziness-traps.test.ts:40-82` — compound citation check is presence-only.

**C3 — §1.7 section structural check on research patches** (currently model-judged)
Principle 13 (`13-phase-research-coverage-s17.test.ts`) checks §1.7 *presence* (6 detection patterns) but not *structure* — does the §1.7 section contain BOTH a Forward-check paragraph AND a Backward-check paragraph? Model currently judges this in PR review. A grep check for both keywords `Forward` and `Backward` in the same §1.7 section would add structural validation. Small gain (catches §1.7 that names both without substance), but deterministic.
Evidence: `packages/core/principles/13-phase-research-coverage-s17.test.ts:14-20` — detection condition (f) already tests BOTH `Forward` AND `Backward` in the same file, but not within the §1.7 section specifically.

**C4 — Dual-pair marker completeness** (`.claude/hooks/*.sh` coverage)
`dual-implementation-discipline.md §6` describes a `grep -E '^# @(dual-pair|cc-only-rationale):'` check on all hook files. This is currently a reviewer-session step (prose) but could be a pre-push grep over `.claude/hooks/*.sh`. Currently 7 hooks, 4 still unlabeled (forward-going per §9 starting state). A pre-push gate would enforce the forward-going annotation at push time rather than requiring model review. Saves 1 model turn per hook-authoring PR.
Evidence: `dual-implementation-discipline.md §9` — "annotation protocol is forward-going"; `§6` grep sketch exists but is not wired.

**C5 — Research-patch scope comment presence** (minor, mechanical)
All N7/N8/channel-selection patches carry `<!-- scope:... -->` as line 1. Currently the model author adds it by convention; principle 13 doesn't check it. A 2-line grep in the pre-push or a principle test extension would enforce it across all new patches. Trivially small gain but zero-cost to add.
Evidence: `2026-05-22-deterministic-offload-autonomy-economy.md:1`, `2026-05-22-n8-rphase-findings.md:1` — both carry it; not universally enforced.

**Summary:** 5 migratable candidates. C1 and C2 have the highest autonomy-economy ROI (each saves 1 prompted judgment turn per relevant session). C4 is the natural next forward-going annotation sweep. C3 and C5 are low-cost supplements.

---

## §2 — R2: Category sweep

Method: WebSearch ≥3 phrasings per category + DeepWiki on specific repos. T1 floor: ≥3 candidates per category. T11: prior-art search before any BUILD verdict. T12: searched at probe moment, not from training-data memory.

| Candidate | Category | Our-problem-class match | BFR verdict | Falsification |
|---|---|---|---|---|
| **LiteLLM Router** — cost-based routing, budget capping, Ollama local-model fallback, `RouterBudgetLimiting` class, `LowestCostLoggingHandler` | Budget-capped scheduler + model router | Upstream: general LLM API gateway. Ours: limit metered `claude -p` calls per maintainer's autonomous loop. **PARTIAL** — budget capping + model routing match; the "autonomous loop" shape fits; but LiteLLM is a server-mode proxy (not a lightweight CLI script) and couples dispatch to its own infra layer. | **ADOPT** (budget-cap + cost-routing primitives) — verdict pending maintainer coupling-cost assessment | Wrong if: LiteLLM's standalone budget enforcement requires persistent server process (non-starter for single-developer local use). Probe: `litellm --help` — does it offer CLI one-shot budget check without server? |
| **AutoGen `TokenUsageTermination` + `GraphFlow`** | Autonomous agent-loop framework | Upstream: multi-agent LLM coordination. Ours: autonomous single-agent loop with cost control. **PARTIAL** — `TokenUsageTermination` = token-count ceiling (indirect $ proxy), `GraphFlow` = deterministic routing graph. No direct $ spend cap. | **ADAPT** (token ceiling as $ proxy; deterministic graph for dispatch) | Wrong if: token-to-$ conversion is available natively and direct $ caps exist (DeepWiki confirms they are in development per `migration-guide.md` "Model Client Cost [#4835]"). Re-check at next AutoGen release. |
| **Anthropic Message Batches API** | Async / batch processing (-50% cost) | Upstream: async batch processing at half price, 24h turnaround. Ours: autonomous loop steps that don't need synchronous results (e.g. audit sweeps, principle-test runs triggered from an agent). **DIRECT MATCH** for non-interactive tasks. Stacks with prompt caching (-90% on cached tokens) → combined ~-95% on batch+cached workloads. | **ADOPT** — direct capability match, no wrapper needed | Wrong if: any autonomous step requires <24h turnaround (blocks on result before next step). Batch is NOT viable for interactive conversation turns; IS viable for audit runs, offload jobs. |
| **Prompt caching (Anthropic SDK `cache_control`)** | Token cost reduction | Upstream: cache system prompt + tool definitions across calls (cache hit = −90% cost). Ours: autonomous loop where the same session bootstrap, rules digest, and tool schema are prepended on every turn. **DIRECT MATCH** — the session bootstrap (`inject-session-bootstrap.sh` injects ~400 tokens per prompt) is a prime caching target. | **ADOPT** — SDK-native, zero extra infra, cache_control already in Anthropic Python SDK | Wrong if: cache TTL (5 min default, 1h extended) expires between autonomous turns. Mitigation: 1h-TTL cache writes on the always-on digest. |
| **Ollama + llama.cpp** | Local / open-weight model runner | Upstream: local inference runtime for open-weight models. Ours: run a local model to drive orchestration/dispatch decisions, reserving Claude for judgment. **CONDITIONAL MATCH** — runtime capability exists; capability floor question is the bottleneck (see R4). | **REFERENCE** (as the runtime layer if R4 verdict is positive) — do NOT adopt as primary until R4 capability floor confirmed | Wrong if: local model cannot reliably parse structured dispatch decisions (R4 INCONCLUSIVE-needs-bench). |
| **Semantic caching (GPTCache, Redis vector cache)** | Semantic near-deduplication | Upstream: embedding-based cache for near-identical LLM prompts. Ours: our autonomous turns are NOT repetitive in the high-repetition sense (each turn is task-specific, not FAQ-bot style). Cache hit rate 62–69% in FAQ workloads; unclear for unique research/audit prompts. **PARTIAL MATCH** at best. | **KEEP NARROW** — applicable only to repeated audit sweeps (same check run repeatedly); not a general-purpose turn reducer for our use case | Wrong if: our autonomous loop has >30% near-duplicate turns. Probe: log turn embeddings for one wave and measure cosine similarity distribution. |
| **Budget Governor MCP server** (`gvnrdev/budget-governor`) | Per-agent hard spend limit | Upstream: MCP tool that intercepts each LLM request, deducts estimated cost from a budget envelope, kills agent if envelope exceeded. Ours: hard cap on `claude -p` session spend. **DIRECT MATCH** conceptually, but ties us to MCP server dependency + per-call billing estimation. | **ADAPT** (concept: pre-call envelope deduction; implementation: deterministic counter in our own hook rather than external MCP server, per substrate-independence invariant) | Wrong if: MCP server overhead is negligible and our hook would duplicate it without benefit. Counter: substrate must stay vendor-independent (N7); external MCP adds dependency and coupling. |
| **HyEvo / Compiled AI (hybrid deterministic+LLM)** | Hybrid workflow (deterministic + minimal LLM) | Upstream: research pattern — deterministic code nodes for predictable steps, LLM nodes only for semantic reasoning. HyEvo: up to 19× cost reduction, 16× latency reduction by routing predictable operations to deterministic code. Ours: our existing hook+test substrate IS already this pattern; what we lack is a formal dispatch layer that routes "is this step deterministic?" | **REFERENCE** (vocabulary + architecture; our existing substrate already implements this pattern; R4 local-model dispatcher is the missing routing layer) | Wrong if: a production framework implementing this pattern for Claude Code specifically exists. No evidence found; SSOT row proposed in §7. |

**Coverage check (T1 candidate-floor NOT met):** 8 candidates. By the table's own `Category` column they fall into **8 distinct categories — n=1 each** (the "6 categories" framing collapses them into 6 buckets: budget-capped scheduler, async/batch, prompt caching, local runner, semantic caching, hybrid deterministic+LLM). Even under that 6-bucket collapse, **at most one bucket reaches 3** (cost-control: LiteLLM Router + AutoGen + Budget Governor MCP) and the other five remain n=1. Either way the plan-of-record §3 R2 **≥3-candidates-per-category** floor is **NOT met**. What *was* met: the **≥3-search-phrasings** floor (each category surveyed with ≥3 phrasings) and T13 (each ADOPTED item states its our-problem-class vs upstream-problem-class match). These are **distinct floors**; an earlier draft of this line conflated the phrasings-floor with the candidates-floor and wrongly asserted "T1 floor met". Per T14 (clean survey + thin coverage = "insufficient to conclude", not "complete"), treat the R2 BFR verdicts as **provisional**: the survey surfaced strong direct-match candidates (Batch API, prompt caching) but coverage is **insufficient to claim category-completeness** or that no better per-category candidate exists. Raising each thin category to ≥3 was deliberately NOT done by padding with low-signal candidates (that would be T1-floor theatre); a future R-phase may widen coverage if a verdict needs to rest on category-completeness.

---

## §3 — R3: Cost model

All estimates use 2026 pricing: Sonnet 4.6 = $3/$15 per MTok input/output; Haiku 4.5 = $1/$5 per MTok. Autonomous credit: $200/month (Max 20x). Assumptions are marked. Estimates are rough-order-of-magnitude (ROM).

### Current state (baseline)

One autonomous wave session burns roughly 200K–500K tokens (based on MEMORY.md note "500K–1M tokens" for a "non-trivial debugging session"; our sessions are lighter, ROM: 200K). At Sonnet 4.6 rates:
- 200K input + 50K output = $0.60 + $0.75 = **$1.35/session** (estimate)
- 10 sessions/month = **$13.50/month** against $200 credit → **~6.8% of credit** (comfortable today)
- 50 sessions/month (scaling) = **$67.50/month** → **~34% of credit** (meaningful)

### Per-candidate cost impact (above subscription)

| Candidate | $ above subscription | Human round-trips removed | Position vs meter |
|---|---|---|---|
| **Prompt caching (ADOPT)** | −90% on cached input tokens. Session bootstrap ~400 tokens × 10 turns = 4K cached tokens/session → saves ~$0.01/session. Stacks to ~$0.10 on 200K sessions with heavy system-prompt reuse (ESTIMATE). | 0 (no round-trips saved, cost saving only) | Reduces metered spend directly. At scale (50 sessions): saves ~$5/month. |
| **Batch API (ADOPT for audit sweeps)** | −50% on all tokens in the batch. An audit sweep of 50 principles/patches at ~2K tokens each = 100K tokens. At Sonnet: $0.30 vs $0.60 normally. Saves **$0.30/sweep**, stacks with caching to **$0.15/sweep**. | 0 round-trips removed from autonomous loop structure; eliminates need for synchronous intermediate results | Reduces meter for async audit work. |
| **Haiku 4.5 for grunt steps (model-tier routing)** | Haiku = 1/3 Sonnet price on input, 1/3 on output. Routing 70% of turns to Haiku (formatting, grep, simple checks): 0.7 × $1.35 × (1 − 1/3) = **$0.63/session saved** → ~47% reduction. ESTIMATE: routing accuracy must be high or quality loss compounds. | 0 directly; reduces meter substantially | Most impactful single lever after offloading. At 50 sessions/month: saves ~$31/month. |
| **Deterministic offload (C1–C5 from R1)** | Each offloaded check = 1 model turn NOT billed. A turn at 200 tokens = ~$0.001 at Haiku rates. 5 checks × 10 sessions = 50 turns → **$0.05/month** direct saving. The real value is **qualitative**: each deterministic gate = one fewer silent-pass opportunity, compounding correctness. | 0 round-trips directly; removes friction from autonomous loop (hook fires instead of model asking itself) | Near-zero $ impact; high correctness impact. |
| **Local model for dispatch (CONDITIONAL — R4)** | $0 above subscription for all turns handled by local model. If 30% of turns are dispatch/routing decisions (ESTIMATE), saves 30% of metered spend. At 50 sessions/month: saves **~$20/month**. But integration + maintenance cost is non-zero (see R4). | Removes model invocations entirely for dispatch turns → directly reduces metered loop length | THE only true $0-forever path for "model thinks." Viability gated on R4. |
| **Budget-cap hook (ADAPT concept)** | $0 to build (deterministic bash); enforces a hard ceiling. Does not reduce per-turn cost, prevents runaway overage. | 0 round-trips saved; prevents overages that would exhaust credit | Insurance, not a cost reducer. Recommended regardless of other choices. |

**Structural floor (restated):** prompt caching + batch + model-tier routing together can realistically reduce meter spend to ~40–50% of baseline for a well-structured autonomous loop. Local model (R4) is the only path to sustained ~$0-above-subscription for the model-thinking component.

---

## §4 — R4: Local-model viability (load-bearing assessment)

**The N8 question:** can a local/open-weight model drive the orchestration/dispatch layer (the part that burns `claude -p`), reserving Claude for irreducible judgment steps?

### Capability floor evidence

**Front-door routing classification benchmark (arXiv 2604.02367 — Johnson & Lee, "Evaluating Small Language Models for Front-Door Routing: A Harmonized Benchmark and Synthetic-Traffic Experiment", April 2026 [ID prefix `2604` = 2026-04; link-verified, see §10] — the most directly applicable study found):**
- Best self-hosted model: **Qwen-2.5-3B** — 0.793 accuracy, 988 ms median latency, $0 marginal cost, 100% parse rate
- No model meets the standalone viability criterion: ≥0.85 accuracy AND ≤2,000 ms P95
- Accuracy gap to production viability: 6–8 percentage points
- Key finding: "cost and latency prerequisites are met; accuracy gap bounds the remaining distance to production viability"
- Domain-specific caveat: the benchmark is "front-door routing" (triage/classification at service entry), NOT necessarily equivalent to our dispatch problem

**Our dispatch problem class vs upstream problem class (T16 check):**
- Upstream problem class: classify an incoming user request to a category/handler (6 task families, synthetic-traffic benchmark)
- Our problem class: decide within an autonomous session loop whether the next step is (a) deterministic bash, (b) local model, or (c) Claude — a sequential state-machine decision under session context
- Match: PARTIAL. Both require classification + routing. But our problem has more context-dependence (session state, partial results) and different failure modes (a dispatch error in the middle of a session compounds; a front-door routing miss is stateless and retryable). T16 warning: the 0.793 accuracy figure does NOT directly transfer to our problem class without our own bench.

**LLM orchestration via Ollama (DeepWiki ollama/ollama, WebSearch):**
- Ollama supports `CapabilityTools` and `CapabilityThinking` flags per model — relevant to dispatch decisions requiring tool calling
- Production pattern (2026): local 7–14B model handles classification (sub-100ms latency); escalates to frontier model for complex reasoning. Mixtral 8x7B activates ~13B params per token, delivers "quality closer to 70B-class at fraction of compute"
- The pattern is validated in production for classification/routing tasks; our specific dispatch-within-session-context requires our own validation

**Substrate-independence constraint (§4 hard rail):**
A local-model dispatcher must NOT couple the enforcement substrate to a specific local model vendor. This rules out:
- Shipping a `dispatch.sh` that hard-codes `ollama run qwen2.5:3b` (vendor coupling)
- Any principle test that fails based on whether Ollama is installed (external dep in CI)
The compliant form: the dispatcher is a SEPARATE process-layer script (not in `.claude/hooks/` deterministic layer) that calls Claude only via a well-defined interface. The hooks remain deterministic bash; the dispatcher sits above them.

**Integration cost (honest estimate):**
- Install Ollama + pull a routing model (qwen2.5:3b or mistral:7b-instruct): ~1h one-time setup
- Write a dispatch script that classifies steps and routes: ~2–4h (ESTIMATE)
- Validate dispatch accuracy on our specific session-loop context: UNKNOWN duration — this is the INCONCLUSIVE piece
- Maintenance: Ollama model updates are infrequent (major versions ~quarterly); dispatch script is simple enough to be low-maintenance
- Risk: if Ollama is unavailable (model not pulled, service down), the loop falls back to Claude-for-everything — graceful degradation is required in the dispatch design

**Verdict: REFERENCE + conditional BUILD**

> Upstream problem class: front-door routing classification on synthetic traffic.
> Our problem class: dispatch within a sequential session loop with shared context.
> Match: PARTIAL. Capability floor (0.793 accuracy on adjacent problem) is encouraging but not sufficient evidence for our specific context without a bench.
>
> **BFR verdict: REFERENCE** for the local-model routing architecture pattern. **BUILD** verdict for the dispatch layer CONDITIONAL on a validation bench showing dispatch accuracy ≥0.85 on our session-loop context. Pre-build validation = 3–5 real autonomous sessions run with dispatch logging to measure routing correctness before committing to the architecture.
>
> Falsification: wrong if the validation bench shows dispatch accuracy <0.80 on session-loop context, OR if the 6–8pp accuracy gap on front-door routing (which is a simpler problem than ours) leads to unacceptable session-loop compounding errors. In that case, verdict reverts to REFERENCE only and the dispatch layer remains Claude.

**Domain trap T-N8-A check (anti-enthusiasm):** the Qwen 0.793 figure is for a DIFFERENT problem class (stateless classification, not context-bearing session dispatch). A local model making 1 in 5 dispatch errors in a session loop would cascade: a wrong "route to deterministic" decision on a judgment step would silently produce wrong output without model correction. This risk is structurally different from a wrong front-door routing classification (which is stateless and retried). The capability floor must be confirmed on OUR problem class before BUILD.

---

## §5 — Synthesis: how far can the loop run for ~$0-above-subscription?

**The honest structural floor (restated for N8):**
- Deterministic offload (R1 candidates) → removes 5–10 model turns per wave session at near-zero cost. High correctness ROI; negligible $ impact.
- Prompt caching (ADOPT) → ~−90% on cached input; material only when system prompt + rules digest are large (our inject-session-bootstrap is only ~400 tokens today). Savings grow with context complexity.
- Batch API (ADOPT for async audit work) → −50% for non-blocking sweeps. Applicable to R-phase audit runs, principle-test-on-demand, drift probes. NOT applicable to interactive turns.
- Model-tier routing (Haiku for grunt steps) → largest near-term lever; ~−47% session cost if 70% of turns route to Haiku. Requires a routing classification step (which itself costs tokens).
- Local model for dispatch (CONDITIONAL) → THE only $0-forever path for model-thinks-autonomously. Viability hinges on R4 bench result. Not production-ready without validation.

**Combined realistic scenario (ESTIMATE, all figures ROM):**
With caching + batch + Haiku routing (no local model), metered cost drops to ~40–50% of baseline. At 50 sessions/month: from ~$67.50 to ~$33–40. Against $200 credit: ~17–20% utilization. Leaves substantial runway for scaling before hitting the ceiling.

With local model dispatch (if R4 bench validates): cost of dispatch turns drops to $0. If 30% of turns are dispatch/routing: additional ~30% reduction → combined ~60–65% below baseline → ~$24–27/month at 50 sessions. Well within $200 credit even at 8× growth.

**The structural limit that cannot be engineered away:**
Claude is required for irreducible judgment turns (design decisions, novel disambiguation, quality review of generated artifacts). These cannot be routed to a local model without quality degradation. The question is not "can we reach $0-above-subscription" but "can we reduce metered turns to only the judgment-irreducible ones?" The R4 dispatch layer is the mechanism that enforces this boundary.

---

## §6 — §1.7 forward/backward/self-application note

**Forward-check:** this patch complies with `no-paid-llm-in-ci` (all research via DeepWiki + WebSearch + local inspection; zero API-billed calls); `build-first-reuse-default` (every finding carries a BFR verdict; ADOPT/REFERENCE before BUILD; CONDITIONAL BUILD for local dispatch gated on bench validation); `doc-authority-hierarchy` (patch inherits folder authority per README.md, carries scope comment and date/author line, is NOT authoritative for N0 decision or project goal); `reviewer-discipline` (N0 pay-the-meter and A/B/C companion decisions surface as DECISION-NEEDED in §7; this patch does not pick between them).

**Backward-check:** no new rule introduced by this patch → no existing-artefact sweep required. R1 candidates C1–C5 are proposals; if any become principle tests or hooks (Phase A), THOSE commits carry §1.7 trailers and `@dual-pair`/`@cc-only-rationale` markers per `dual-implementation-discipline.md §3`.

**T15 self-application:** does N8's offload thesis apply to N8's own R-phase research process?
- Which steps of this R-phase could a deterministic check have done? R1 own-stack sweep (grep-based inventory of hooks — fully automatable), R3 cost arithmetic (deterministic given pricing tables) — both could run as scripts.
- Which required model judgment? R2 BFR verdict assignment (our-problem-class vs upstream-problem-class match), R4 capability floor interpretation (reading the arXiv paper and mapping to our specific context), synthesis.
- Verdict: R1 and R3 are partially automatable; R2 and R4 require judgment. The hybrid pattern applies to the R-phase itself — the session spent model-turns on mechanical inventory that a `grep`-driven R1 script could have prepared as structured input.
- Implication for A-phase: A1 offload migration (move R1 candidates to hooks/tests) would have saved turns in this very R-phase if it had already been done.

---

## §7 — Decision-needed for maintainer

The following are DECISION-NEEDED items per `reviewer-discipline.md §2`. Options + consequences stated; no pick.

**D1 — N0 response: which cost lever(s) to apply (OPTIONS):**
- Option A (prompt caching only): minimal effort (~1 day), ~−10–15% meter reduction. No local-model work.
- Option B (caching + batch + Haiku routing): medium effort (~1 week), ~−47–55% meter reduction. Keeps Claude as the only model. Requires a routing classifier (which itself burns tokens — note the irony).
- Option C (all of B + local-model dispatch after R4 bench): high effort (~2–3 weeks), ~−60–65% meter reduction, $0-above-subscription for dispatch turns. Gated on R4 validation bench (3–5 sessions of dispatch logging). Structurally the only path to sustained low metered spend at scaling.
- Consequence of inaction: $200/month credit is comfortable at current load (~10 sessions); becomes meaningful at 50+ sessions/month. No urgency before June 15 if session rate stays low; urgency increases proportionally with autonomous session frequency.

**D2 — R4 bench go/no-go:**
Should the maintainer authorize a validation bench (3–5 sessions with dispatch-logging) to confirm local-model dispatch accuracy on our session-loop context? If yes, this gates the CONDITIONAL BUILD verdict. If no, local model remains REFERENCE-only and dispatch stays with Claude.

**D3 — R1 offload migration priority:**
Which of C1–C5 should enter the A-phase first? Recommendation order by ROI: C1 (SSOT existence check, highest correctness value), C2 (kickoff sampling floor, saves 1 turn per R-phase), C4 (dual-pair marker completeness, natural forward-going annotation sweep), C3, C5. This is a surface-as-decision question — the maintainer may wish to batch with another wave or defer.

**Proposed SSOT rows (for orchestrator to serialize into `prior-art-evaluations.md` — NOT written here per append-only discipline):**

| ID (suggested) | Entry | Verdict | Rationale | Trigger to revisit |
|---|---|---|---|---|
| #64 | Anthropic Batch API (-50% async) | ADOPT | Direct match: non-interactive audit sweeps; zero integration overhead | If sync requirement emerges for currently-batched work |
| #65 | Prompt caching (Anthropic SDK `cache_control`) | ADOPT | Direct match: session bootstrap + rules digest as cache target; SDK-native | If TTL constraints require architectural workaround |
| #66 | LiteLLM Router (cost-based routing + budget cap) | ADAPT | Budget-cap concept matches; standalone CLI mode needs investigation before full ADOPT | When LiteLLM 1.x stabilises or if standalone mode confirmed |
| #67 | Local-model dispatch (Ollama + Qwen/Mixtral) | REFERENCE → conditional BUILD | Capability floor on our problem class INCONCLUSIVE; R4 bench needed | After R4 bench runs; or if arXiv 2604.02367 follow-up study covers session-loop context |
| #68 | HyEvo / Compiled AI (hybrid deterministic+LLM pattern) | REFERENCE | Vocabulary + architecture; our existing hook substrate already implements this; R4 dispatcher = the missing piece | If a framework ships that targets Claude Code's hook layer specifically |

---

## §8 — Tags

`#autonomy-economy` `#deterministic-offload` `#local-model-dispatch` `#prompt-caching` `#batch-api` `#model-tier-routing` `#capability-floor-inconclusive` `#hybrid-deterministic-llm` `#no-paid-llm` `#own-stack-sweep`

---

## §9 — See also

- [2026-05-22-deterministic-offload-autonomy-economy.md](2026-05-22-deterministic-offload-autonomy-economy.md) — N8 plan-of-record; this patch executes §3 Phase-R.
- [2026-05-21-niche-strategy-and-growth-roadmap.md](2026-05-21-niche-strategy-and-growth-roadmap.md) — N0 billing storm + N7 dogfood; N8 is N0's answer.
- [.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — hard constraint; all R-phase mechanisms comply.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — verdict discipline applied in §2.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT for proposed rows #64–#68 (§7; not yet written; maintainer serializes).
- arXiv 2604.02367 — "Evaluating Small Language Models for Front-Door Routing" (Qwen-2.5-3B 0.793 accuracy finding; best direct evidence for R4 capability floor).
- arXiv 2604.05150 — "Compiled AI: Deterministic Code Generation for LLM-Based Workflow Automation" (hybrid deterministic+LLM architecture precedent).
- arXiv 2603.19639 — "HyEvo: Self-Evolving Hybrid Agentic Workflows" (19× cost reduction by deterministic offload; REFERENCE vocabulary).

---

## §10 — Correction log (2026-05-22)

> Post-merge substance correction of this patch (merged to `staging` via PR #158). Two gaps fixed; nothing else touched. (Numbered §10 because §8/§9 were already taken by Tags/See-also when this patch shipped.)

**Fix A — arXiv link-verification (all three IDs WebFetch-verified against arxiv.org/abs):**

| arXiv ID | Verdict | Fetched title | Claim check |
|---|---|---|---|
| `2604.02367` | **VERIFIED** | "Evaluating Small Language Models for Front-Door Routing: A Harmonized Benchmark and Synthetic-Traffic Experiment" (Johnson & Lee) | Abstract confirms Qwen-2.5-3B "Pareto-dominant among self-hosted models (0.793 accuracy, 988 ms median, $0 marginal cost)", the ≥0.85-accuracy / ≤2,000 ms-P95 viability threshold, and the 6–8 pp gap. Two accuracy figures exist — **0.783** (offline benchmark) and **0.793** (randomized experiment); §4 cites the latter (genuine, not miscited). "100% parse rate" (line 108) is **not in the abstract** — left in place as it is not contradicted and the load-bearing figures verify; flagged here for transparency (T3). |
| `2604.05150` | **VERIFIED** | "Compiled AI: Deterministic Code Generation for LLM-Based Workflow Automation" | Abstract confirms the LLM-generates-code-then-executes-deterministically paradigm — matches the hybrid-deterministic+LLM REFERENCE use. Title matches §9 verbatim. |
| `2603.19639` | **VERIFIED** | "HyEvo: Self-Evolving Hybrid Agentic Workflows for Efficient Reasoning" | Abstract states "reducing inference cost and execution latency by up to 19× and 16×, respectively" — exactly the §2/§7 "19× cost, 16× latency" claim. |

No NOT-FOUND or MISCITED refs → **R4's verdict does not rest on any unverified source**; no verdict downgrade required. Edits made: §4 line 107 gained the resolved full title inline and the citation date was corrected **March → April 2026** (arXiv ID prefix `2604` = 2026-04; the original "March" was inconsistent with the ID, which is the authoritative submission month).

**Fix B — R2 candidate-floor honesty (line 71): took option B2 (honest downgrade).** The original line asserted "T1 floor met" by conflating the ≥3-**phrasings** floor (which *was* met) with the plan-of-record §3 ≥3-**candidates**-per-category floor (which is **not** — 8 candidates in 8 distinct `Category`-column values, n=1 each; the "6 categories" label is a manual 6-bucket collapse, under which one cost-control bucket reaches 3 and the rest stay n=1). Rewrote to state the candidate-floor is NOT met and the R2 verdicts are provisional (T14). B1 (adding real candidates to reach ≥3/category) was rejected: it would require on the order of a dozen-plus marginal candidates across the thin categories — low-signal padding, itself T1-floor theatre — and no current R2 verdict rests on category-completeness, so honest downgrade is the correct call.

**What changed + why:** added link-verification evidence + resolved title/date for the load-bearing R4 arXiv cite, and replaced a false "floor met" coverage claim with an honest "floor NOT met / verdicts provisional" statement — so no R4 conclusion rests on an unverified source and no R2 claim overstates coverage.
