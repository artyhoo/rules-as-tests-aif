<!-- scope:deterministic-offload-autonomy-economy -->
# Research-patch — Deterministic-offload as the autonomy-economy lever (Wave N8 plan)

> **Scope:** plan-of-record for proposed **Wave N8** — using the deterministic enforcement substrate (bash hooks, lint, CI, principle-tests) as a cost + autonomy lever to minimise metered `claude -p` / Agent-SDK spend after the 2026-06-15 billing change.
> **Authoritative for:** Wave N8's question, hypotheses, search plan, apply-phase, constraints.
> **NOT authoritative for:** project goal — see [../../../README.md#why-this-exists](../../../README.md#why-this-exists); the storm/billing facts — see N0 in [2026-05-21-niche-strategy-and-growth-roadmap.md](2026-05-21-niche-strategy-and-growth-roadmap.md); the no-paid-LLM policy — see [.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md).
>
> **Origin:** maintainer insight, 2026-05-22 — *«bash-сторожа позволяют работать автономно дольше и тратить меньше вызовов `claude -p`; возможно в этом выход»*. This patch captures the insight so it is not lost (per the same-session «планы не должны пропадать» concern) and proposes the research+apply wave the maintainer asked to schedule «как все остальные задачи и цели».

---

## §1 — The insight (sharpened)

The N0 storm (2026-06-15) meters model dispatch — `claude -p`, Agent SDK, Claude Code GitHub Actions — onto a separate monthly credit. N0 listed *how to pay the meter* (options a–e) but none delivered the maintainer's real target: **no human in the loop AND no extra spend.** Earlier this session we hit the structural floor: model inference without a human present = headless = metered; the only $0-forever compute is whatever **never calls a model**.

The maintainer's reframe turns that floor into a lever:

- **Every check the deterministic substrate performs is a model call NOT made.** Lint, hooks, principle-tests, drift-probes, CI verify things the model would otherwise be *prompted* to verify. The more the substrate absorbs, the fewer metered turns the autonomous loop needs.
- **Hooks that cut human round-trips extend autonomy per unit of metered time:**
  - `ask-question-reminder.sh` — pushes the agent to *decide* instead of *ask* → one fewer human round-trip per fork.
  - `inject-session-bootstrap.sh` — re-anchors the goal without a human re-stating it.
  - `end-of-turn-reminder.sh` — forces a self-check instead of a human catching the miss later.
- **Verified evidence (2026-05-22):** both `end-of-turn-reminder.sh` (200 LOC) and `ask-question-reminder.sh` (65 LOC) make **zero API calls** — pure bash + jq (`grep` for API/network patterns → only a false-positive comment match; real-call grep `curl|wget|claude -p|fetch` → exit=1). They cost **$0 forever**, before and after June 15, and each reduces model-or-human dependence.

**Conclusion:** the substrate is not only the «conscience / moat» (book Часть XIII) — it is also the **autonomy-economy engine**. This is the same thesis as Часть XIII (*«броню субстрата куй свою»*) read on the cost axis: the AI-agnostic, model-free layer is what lets the loop run long and cheap.

## §2 — Why this is a research wave, not a finished answer

The structural floor still holds and must not be over-claimed: deterministic offload reduces *how often* the model is invoked; it **cannot make model thinking free**. The open, unsearched question is **how far** deterministic-offload + cheap-model + caching + (possibly) a local model can push an autonomous loop before the meter moves materially.

Per [phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md), a positive- or negative-existence claim («there is / isn't a way to run autonomously for ~$0 above subscription») is **provisional until the 6-item search runs**. So this is scheduled as research, not asserted now.

## §3 — Wave N8 decomposition (proposal; admission = maintainer call per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md))

**Phase R — research ($0: DeepWiki + WebSearch + local inspection only; no API-billed call, per `no-paid-llm-in-ci`):**

- **R1 — Own-stack offload sweep.** Inventory verification work the model currently does *in-session* that a deterministic hook/test could absorb instead (claim self-checks, citation checks, count re-greps — several §1.7 checks are already deterministic; what else qualifies?). Each migrated check = one fewer prompted model turn.
- **R2 — Category sweep** (≥3 candidates/category, ≥3 phrasings): autonomous agent-loop frameworks; budget-capped schedulers / cron with spend caps; local / open-weight runners (Ollama, llama.cpp, LM Studio); Batch API (async, ~−50%); prompt caching (~−90% on cached tokens); hybrid deterministic+model loops.
- **R3 — Cost model per candidate:** estimate `$ above subscription`, `human round-trips removed`, and `position vs the metered claude -p line` for each.
- **R4 — Local-model viability (the load-bearing one).** Can a local / open-weight model drive the orchestration/dispatch layer (the part that burns `claude -p`), reserving Claude only for irreducible high-judgment steps? This is the **only true $0-above-subscription path** for «model thinks without a human».
- BFR verdict per finding (ADOPT / ADAPT / REFERENCE / BUILD / REJECT) per [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md).

**Phase A — apply:**

- **A1 — Offload migration.** Move every deterministic-able in-session check into hooks / principle-tests (each one saves a metered turn).
- **A2 — Autonomy hooks.** Extend the `ask` / `bootstrap` / `end-of-turn` family per R findings to cut more round-trips — keeping each one deterministic ($0).
- **A3 — Hybrid dispatch.** If R4 is positive, prototype local-model orchestration with Claude reserved for judgment steps. **Substrate stays vendor-independent** (N7 invariant) — the local model drives *process*, never couples the enforcement layer.

## §4 — Hard constraints

- **`no-paid-llm-in-ci` stays absolute** — research uses DeepWiki/WebSearch/local only; no API-billed call lands in CI ([.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)).
- **Substrate stays harness/vendor-independent** ([2026-05-21-niche-strategy-and-growth-roadmap.md](2026-05-21-niche-strategy-and-growth-roadmap.md) N7 §90/§92) — a local-model dispatcher must not couple the substrate to any vendor; that would forfeit the weatherproofing N0 just proved load-bearing.
- **The substrate's $0-forever property** (verified for the 2 hooks) is the thing to **extend, not erode** — every new hook must remain deterministic.

## §5 — Sequencing + dependencies

- **Couples to N0 (storm) and N7 (dogfood):** N8 is the cost/autonomy answer N0 lacked. A3 (hybrid dispatch) overlaps N0 option (a) cost-aware dispatch + (e) companion runtime, and N7 process-layer migration.
- **No external deadline of its own**, but N0's firm 2026-06-15 makes R1–R4 valuable *before* then — they directly inform «how to pay the meter».
- **DECISION-NEEDED it touches:** companion = A/B/C (niche roadmap §4 N7). A3's local-model path is independent of that decision (local ≠ companion vendor), which is a point in its favour.

## §6 — §1.7 self-reflexive note (per [phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md))

- **Forward-check:** complies with `no-paid-llm-in-ci` (research channels are free), `build-first-reuse-default` (every R finding carries a BFR verdict; default ADOPT/REFERENCE before BUILD), `doc-authority-hierarchy` (this patch declares scope + subordinates to README and N0), `reviewer-discipline` (wave is *proposed*; admission is the maintainer's strategy call, not decided here).
- **Backward-check:** no new rule introduced → no existing-artefact sweep owed. If Phase A adds hooks, each carries `dual-implementation-discipline` §3 triage + `@cc-only-rationale`/`@dual-pair` marker and is subject to `hook-stub-completeness` (principle 16). Those §1.7 obligations attach when the hooks are authored, not here.

## §7 — Tags

`#autonomy-economy` `#deterministic-offload` `#substrate-as-lever` `#no-paid-llm` `#storm-prep-N0` `#local-model-dispatch`

## §8 — See also

- [2026-05-21-niche-strategy-and-growth-roadmap.md](2026-05-21-niche-strategy-and-growth-roadmap.md) — N0 (storm/billing), N7 (dogfood, substrate-purity invariant).
- [.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — hard constraint this wave operates under.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — verdict discipline for R findings.
- Book Часть XIII «Доспехи и оружие» — substrate-as-armor thesis, read here on the cost axis.
- Verified $0 hooks: `.claude/hooks/end-of-turn-reminder.sh`, `.claude/hooks/ask-question-reminder.sh`.
