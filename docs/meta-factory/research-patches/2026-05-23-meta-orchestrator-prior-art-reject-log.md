<!-- scope:meta-orchestrator-prior-art-reject-log -->
# REJECT log — meta-orchestrator R-phase Surface 6 sweep

> **Provenance:** reconstructed from R-phase patch §1 row 6 + §9 footer (NOT verbatim from `/tmp/meta-orch-survey-6-state-of-art.md` — that scratchpad was ephemeral across sessions and lost at I-phase boundary). Original audit trail evidence is internal to the R-phase patch.
> **Authoritative for:** Surface 6 REJECT audit trail. **NOT authoritative for:** Surface 1–5 REJECTs (in R-phase patch at `docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md`); project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).

Surface 6 of the BFR §3 six-surface sweep covered «state-of-art multi-agent orchestration tools» via DeepWiki + WebSearch (2026-05-23). The following candidates were surfaced and REJECTed (no SSOT row — REJECT candidates omitted per build-first-reuse-default.md §3 «rows for BUILD/ADOPT/ADAPT/REFERENCE/REJECT with verdict»; REJECTs without rows are audit-trail only).

---

## REJECT-1: APM (`sdi2200262/agentic-project-management`)

**Surfaced via:** WebSearch on «agentic project management multi-agent orchestration».

**What it is:** A project management overlay for AI agents — tracks tasks, manages context window, provides structured PM workflows for single-agent projects.

**REJECT rationale:** Problem-class mismatch. APM = context-window management + task-tracking for a **single AI agent** on a single project. Our problem class = **multi-umbrella** orchestration with real git-PR state gates + cross-umbrella priority resolution across multiple parallel work streams. Overlap ~5% (both have «task list»). No architecture for cross-session, multi-umbrella, slash-command invocation. Not a meta-orchestrator.

**T16 check:** «agentic project management» name pattern-matches to «orchestration»; verified problem class → single-agent PM overlay, not multi-agent cross-umbrella orchestrator. T16 trap avoided.

---

## REJECT-2: GitHub Agentic Workflows (GitHub-native)

**Surfaced via:** WebSearch on «GitHub agentic workflows multi-agent».

**What it is:** GitHub's native CI-side automation (Actions workflows, Copilot-integrated) that can chain AI agent invocations within GitHub Actions pipelines.

**REJECT rationale:** Hard constraint violation. Any CI-side orchestration that invokes paid AI APIs violates `no-paid-llm-in-ci.md §1`. GitHub Agentic Workflows run in GitHub Actions = CI-side. The entire capability class is excluded by project policy regardless of technical merit. Counter-check: even if free-tier paths exist, the coupling to GitHub's infrastructure would violate §7.10 zero-infra requirement and `no-paid-llm-in-ci.md §2` scope.

**T16 check:** «GitHub Agentic» sounds close to «meta-orchestrator»; verified = CI-side paid pipeline → hard constraint violation. Not a viable candidate.

---

## REJECT-3: LangGraph / CrewAI / AutoGen

**Surfaced via:** WebSearch on «multi-agent orchestration framework Python».

**What they are:** Python-based multi-agent orchestration frameworks. LangGraph = graph-based agent routing. CrewAI = crew-of-specialized-agents workflow. AutoGen = Microsoft multi-agent conversation protocol.

**REJECT rationale (shared):** Cross-domain mismatch. All three are:
- **Python runtime frameworks** — require installing Python dependencies, incompatible with zero-npm-dep substrate.
- **Infrastructure-bearing** — require an orchestration server / event loop / runtime.
- **Single-project scoped** — no concept of «cross-umbrella priority scoring» or «wave-sequencing-plan currency verification».
- **No CC slash-command primitive** — these are API libraries, not CC-native skills.

Zero overlap with §7.14 named gaps. Not installable via `install.sh` skill payload. Hard constraint: no npm/pip deps.

**T16 check:** these are legitimately production-grade orchestration frameworks; name-match to «orchestration» is real. Verified problem class: Python API framework for LLM agent chaining. Our problem class: CC slash-command skill with bash helpers and real `gh pr list` stage gates. Structural mismatch confirmed.

---

## REJECT-4: General PM tools / CI orchestrators / build meta-launchers

**Surfaced via:** WebSearch on «project orchestration CI meta-launcher» and similar.

**Examples surfaced:** Temporal workflows, Apache Airflow DAGs, GitHub Actions matrix strategies, Make/Rake meta-launchers.

**REJECT rationale (shared):** These are general-purpose workflow engines. They share «orchestration» vocabulary but operate at infrastructure level (DAG runtime, workflow server, CI scheduler). None are CC slash-command skills. None can verify `wave-sequencing-plan.md` currency vs live `gh pr list` output. None produce meta-kickoff files with §5 AI-traps sections. The problem class (session-bound, human-in-the-loop, CC-native, install.sh-templatable) is entirely absent.

**SSOT note:** Bernstein (#69) was the closest structural match from Surface 6 (YAML DAG + janitor gate pattern) and received a SSOT row as REFERENCE. ComposioHQ (#70) received a SSOT row for PR-readiness signal vocabulary. Everything else in this family is a REJECT.

---

## §1.7 Self-application (T15 recursive check)

**Forward-check:** this reject-log is a research-patch promoted from the R-phase ephemeral scratchpad. It complies with [doc-authority-hierarchy.md §2](../../.claude/rules/doc-authority-hierarchy.md) (Authoritative-for header present, line 1-5 above) and [research-patches/README.md §folder-level-authority](../research-patches) folder-level authority convention (one patch per gap, append-only). It does NOT claim Surface 1–5 authority (those live in the primary R-phase patch). The BFR §3 sweep procedure was applied: Surface 6 enumerated, each candidate evaluated, verdict justified per T16 problem-class check.

**Backward-check:** this file is new (no prior version to supersede). No existing doc is silently overridden. SSOT rows #66–#70 in `prior-art-evaluations.md` are the canonical BUILD-time record; this reject-log is the audit-trail for the non-SSOT Surface 6 REJECTs. Both are complementary, not contradictory.

**Self-application:** this reject-log was itself checked for completeness: 4 REJECTs documented, each with problem-class rationale per T16 countermeasure. The T16 check applies to the REJECTs themselves — names like «GitHub Agentic Workflows» or «LangGraph / CrewAI / AutoGen» are plausible matches for «orchestration»; each was verified by problem-class analysis, not just name matching.

## See also

- [R-phase patch §1 row 6 + §9 footer](2026-05-23-meta-orchestrator-prior-art.md) — primary Surface 6 evidence.
- [prior-art-evaluations.md #66–#70](../prior-art-evaluations.md) — SSOT rows from this R-phase (rows with SSOT rows: AIF #66 REFERENCE, aif-handoff #67 REJECT-with-row, OhMyOpencode #68 REFERENCE+ADOPT-VOCABULARY, Bernstein #69 REFERENCE, ComposioHQ #70 REFERENCE).
- [build-first-reuse-default.md §3](../../.claude/rules/build-first-reuse-default.md) — BFR mechanism this sweep executes.
