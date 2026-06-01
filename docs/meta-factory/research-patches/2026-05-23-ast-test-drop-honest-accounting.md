<!-- scope:ast-test-drop-honest-accounting -->
# Research patch — AST-test drop in `parallel-subwave-isolation.md §4`: honest accounting

> **Class:** discipline-correction patch (no code, no rule rewrite — surfaces a gap in N7 reasoning + proposes scope of remediation).
> **Authoritative for:** explicit acknowledgment that the N7 AST-test drop was **BFR-justified but did not address the post-hoc catch-net axis**; expansion of the re-promotion trigger; recursive-self-application warning for `/meta-orchestrator` §7.7 (analogous shape).
> **NOT authoritative for:** project goal (see [README.md#why-this-exists](../../README.md)); the BFR rule itself (see [build-first-reuse-default.md](../../.claude/rules/build-first-reuse-default.md)); the existing Class C designation (see [parallel-subwave-isolation.md §5](../../.claude/rules/parallel-subwave-isolation.md) — this patch *extends* it, doesn't override).
> **Origin:** 2026-05-23 maintainer follow-up dialogue during `/meta-orchestrator` R-phase wave. Maintainer asked: «документы врут, тесты нет — но дропнутый AST-test оставляет правило в Class C. Не противоречит ли это central thesis?» Re-reading [N7 patch §4 step 2](2026-05-22-n7-dogfood-companions.md) confirmed the BFR rationale **does not engage** the post-hoc catch-net argument. This patch fills the gap honestly.
> **Tags:** `#discipline-application-scope-blindness` · `#recursive-self-application-gap` · `#class-c-compromise-explicit`

---

## §1 The gap in N7 reasoning

[N7 patch §4 step 2](2026-05-22-n7-dogfood-companions.md) (line 54) reads verbatim:

> «Demote `parallel-subwave-isolation.md §4` promotion ambition → REFERENCE `using-git-worktrees` as mature upstream (alongside aif-handoff Git-Isolation, SSOT #27); drop the AST-detection build-target.»

The single justification cited: **BFR §1 (REFERENCE-over-BUILD)** — mature upstream exists, don't rebuild.

**What the justification does not engage:**

The README invariant ([README.md#why-this-exists](../../README.md)) states:

> «Every codified rule is an executable artifact … that fails at the **earliest reachable channel** — edit-time → pre-commit → pre-push → CI → production audit. **CI is the last-resort gate, not the primary one.**»

«Earliest reachable» is **multi-channel**, not «pick the earliest and dismiss the rest». Last-resort ≠ never. The README explicitly preserves CI as a layer.

**`using-git-worktrees` skill** is a **preventive** mechanism on the **edit-time** channel — it instructs AI to use worktrees correctly. It does not, and cannot, **detect** the failure mode it tries to prevent. An AI that ignores the skill produces no signal there.

**The dropped AST-test** would have been on a **different channel** (CI / production audit) — a post-hoc detector for «two commits on different branches with overlapping working-tree state». It catches the residual where the preventive skill was bypassed.

The two are not alternatives — they are **complementary layers**. N7 read them as alternatives. That is the gap.

## §2 What the dropped AST-test would have caught

The incident 2026-05-12 (Wave 8.1/8.1b — origin of the rule, [parallel-subwave-isolation.md §Origin](../../.claude/rules/parallel-subwave-isolation.md)) was exactly this shape: parallel Sonnet sessions in shared workdir, `git checkout -b` race on shared `.git/index`, Wave 8.1's commit landed on `wave-8.1b/...` branch. The preventive (worktree) was **absent** at the time. After the fact, the only signal that the contamination happened was **manual inspection by the orchestrator** (cherry-pick surgery).

If the preventive were present today (it is — `using-git-worktrees` is dogfooded post-N7), an AI session **that ignored the skill** would reproduce the same incident. Without an AST-test on CI / post-hoc audit, **the second occurrence would also surface only via manual inspection**. The catch-net is not redundant — it is the only safety layer for the failure mode «AI didn't follow the skill».

## §3 The compromise — explicit acknowledgment

This patch does **not** propose re-instating the AST-test build target now. It proposes **renaming** the current state from «solved via REFERENCE upstream» (misleading) to **«acknowledged Class C compromise pending re-promotion trigger»** (accurate).

**The compromise factors:**

| Factor | Value |
|---|---|
| Incident frequency (preventive in place) | 0 since 2026-05-22 (4 weeks; small sample) |
| Build cost of AST-detector | Non-trivial — requires AST-level analysis of git history × orchestrator-prompts context; not a regex-grep job |
| Existing catch-net intensity | Manual reviewer inspection (Phase -1 cold-review) + `Stop` hook for `Agent` tool's `isolation:"worktree"` parameter — **partial coverage**, not a principle test |
| README invariant tax | One rule lives at Class C against the absolutism («every rule = executable artifact»). [Already-recognized tension](2026-05-16-readme-absolutism-vs-class-c-practice.md). |

**Verdict:** Class C status is a **legitimate cost-benefit compromise** for the moment, **NOT** a claim that REFERENCE-upstream alone closes the discipline. Re-name the framing in [`parallel-subwave-isolation.md §4`](../../.claude/rules/parallel-subwave-isolation.md) to reflect this honestly.

## §4 Expanded re-promotion trigger

Current rule §4 says (paraphrased): «if no shared-dir-parallel incident occurs for 12 consecutive months, archive to prose; otherwise promote on incident-evidence».

**Proposed expansion** — add an **explicit re-promotion path** beyond pure incident accumulation:

1. **Incident-based (existing):** ≥2 shared-dir-parallel incidents within 6 months → re-evaluate AST build target.
2. **Cost-based (NEW):** if AST analysis tooling becomes cheap (≤1 day to ship a deterministic detector — e.g. a hook on `git commit` that compares branch ancestry vs worktree manifest) → re-evaluate independent of incident count. The original drop was build-cost-driven; falling build cost re-opens the decision.
3. **Coverage-evidence-based (NEW):** if 3+ retrospectives flag «manual inspection caught the contamination» as the only signal → coverage evidence has accumulated for «catch-net needed», re-evaluate regardless of incident count (manual catches **are** caught incidents — they cost orchestrator surgery time).

All three triggers are independent — any one firing opens re-evaluation. None is mandatory pre-emptive build.

## §5 Recursive-self-application risk — same pattern in `/meta-orchestrator` R-phase patch

The 2026-05-23 R-phase patch for `/meta-orchestrator` ([`2026-05-23-meta-orchestrator-prior-art.md`](2026-05-23-meta-orchestrator-prior-art.md)) §4.3 integration sketch proposes §7.7 stage-gate semantics via **inline `!shell` injection inside the SKILL.md** — a **document-trust** pattern identical in shape to the `parallel-subwave-isolation` Class C state:

| Shape | `parallel-subwave-isolation §4` | `/meta-orchestrator §7.7` |
|---|---|---|
| Preventive on edit-time | `using-git-worktrees` skill (markdown) | `!gh pr list --search 'is:merged head:<branch>'` (skill body) |
| Post-hoc catch-net on CI | **DROPPED (AST-test)** | **NOT PROPOSED (principle test on commit-ordering vs PR-merge state)** |
| Trust target | Document (the skill) | Document (the SKILL.md body) |
| AI can ignore? | Yes | Yes |

**This is the recursive-self-application anti-pattern** in action (per [phase-research-coverage.md §4 `#recursive-self-application-gap`](../../.claude/rules/phase-research-coverage.md)). The very discipline the meta-orchestrator R-phase was trying to instate (executable rules at earliest reachable channel) wasn't applied to the meta-orchestrator's own design moment.

Cold-reviewer #2 [kickoff §5b](../../.claude/orchestrator-prompts/meta-orchestrator-cold-review-2/kickoff.md) now explicitly checks this for every `/meta-orchestrator` §7 sub-section. If reviewer #2 flags additional sub-sections inheriting the same shape, the I-phase BUILD wave must either (a) add CI-channel principle tests for those §7 sub-sections, or (b) explicitly classify each as «acknowledged Class C compromise» with the same honest accounting as this patch proposes for `parallel-subwave-isolation §4`.

## §6 What this patch *changes* and what it leaves to maintainer

**This patch changes:** [`parallel-subwave-isolation.md §4`](../../.claude/rules/parallel-subwave-isolation.md) gets a new paragraph (§4 «Honest accounting of the AST-test drop») linking to this patch and reframing the current state from «solved via REFERENCE» to «Class C compromise with expanded re-promotion triggers». Edit landed in the same commit as this patch (authorization: maintainer follow-up dialogue 2026-05-23 «сделай так чтобы не было заблуждения»).

**This patch does NOT change:**
- AST-test status (still dropped per N7).
- BFR §1 verdict on `using-git-worktrees` (still REFERENCE — adoption stands).
- Class C designation (stands until a re-promotion trigger fires).

**This patch leaves to maintainer review:**
- Whether §4 expanded triggers (cost-based, coverage-evidence-based) deserve to be promoted into a general re-promotion-trigger pattern across all Class C rules (cross-rule scope — bigger change than this patch's scope).
- Whether `/meta-orchestrator` §7.7 should grow a companion CI principle test in the I-phase BUILD wave (cold-reviewer #2 surfaces this; maintainer decides at admission).

## §7 §1.7 self-reflexive note

**Forward-check:** this patch complies with
- [build-first-reuse-default.md §3](../../.claude/rules/build-first-reuse-default.md) (no new BUILD claim — surfaces a discipline-correction, no new capability adopted/built; SSOT consult unchanged).
- [no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) (no proposed mechanism requires API-billed LLM).
- [phase-research-coverage.md §1.7](../../.claude/rules/phase-research-coverage.md) (this *is* a §1.7 forward+backward exercise on N7).
- [doc-authority-hierarchy.md §2](../../.claude/rules/doc-authority-hierarchy.md) (this file inherits folder authority `docs/meta-factory/research-patches/`).
- [reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md) — this patch **does not** decide whether AST-test should be re-instated (maintainer strategy fork); it surfaces the gap + expanded triggers.

**Backward-check:** the rule edit (§4 honest-accounting paragraph in `parallel-subwave-isolation.md`) is **additive**, not retroactive — does not invalidate any existing artifact that referenced the old «REFERENCE-solves-it» framing; that framing remains technically accurate (REFERENCE-upstream is correct verdict for the preventive layer), the new paragraph adds the post-hoc-catch-net axis that was missing. Surfaced this for [`2026-05-16-readme-absolutism-vs-class-c-practice.md`](2026-05-16-readme-absolutism-vs-class-c-practice.md) — that patch is the systemic record; this one is the specific case.

**Anti-patterns named:**
- `#discipline-application-scope-blindness` — N7 reasoning loaded BFR but did not load README multi-channel invariant for the same decision.
- `#recursive-self-application-gap` — same shape risks repeating in `/meta-orchestrator §7.7` (called out in §5).

## §8 See also

- [`.claude/rules/parallel-subwave-isolation.md`](../../.claude/rules/parallel-subwave-isolation.md) — the rule edited by this patch (§4 honest-accounting paragraph added).
- [`2026-05-22-n7-dogfood-companions.md`](2026-05-22-n7-dogfood-companions.md) — N7 patch this critiques (no retroactive edit; this patch is a forward-going correction).
- [`2026-05-16-readme-absolutism-vs-class-c-practice.md`](2026-05-16-readme-absolutism-vs-class-c-practice.md) — systemic record of README-vs-Class-C tension; this patch is one specific case within that tension.
- [`2026-05-23-meta-orchestrator-prior-art.md`](2026-05-23-meta-orchestrator-prior-art.md) — R-phase patch this references in §5 for the recursive shape.
- [`.claude/orchestrator-prompts/meta-orchestrator-cold-review-2/kickoff.md`](../../.claude/orchestrator-prompts/meta-orchestrator-cold-review-2/kickoff.md) §5b — extends recursive check to all §7 sub-sections in I-phase.
- [README.md#why-this-exists](../../README.md) — the invariant this patch operationalises («every rule fails at earliest reachable channel» = multi-channel, not single).
