# Multi-stack support — Hybrid design (Stage 1 curated + Stage 2 committed)

> **Authoritative for:** the strategic decision and Stage-1/Stage-2 boundaries for epic #646 (multi-stack support); the sequencing-commitment mechanism; the build-vs-reuse discipline that gates new preset rules.
> **NOT authoritative for:** project goal/methodology — see [README.md#why-this-exists](../../../README.md#why-this-exists). Detailed Stage-1 PR decomposition — that is the implementation plan produced by `writing-plans` (separate artifact). Issue #646 itself remains the operational tracker.

> **Origin:** 2026-06-19. Resolves the strategic fork surfaced by the reviewer pass on issue #646 (epic «multi-stack support»). Operator chose the **hybrid** path in a `brainstorming` session: Stage 1 curated presets now, Stage 2 generate-path as a committed next umbrella. This spec records the decision, its rationale, and the discipline that keeps the bridge from becoming permanent technical debt.

## 1. Problem & context

The framework's README §Methodology states: «Generate enforcement rules from principles, not from copy-pasted presets. Presets become stale.» ([README.md:56](../../../README.md)). Yet the framework ships exactly **one** hand-authored preset (`packages/preset-next-15-canonical`) and `install.sh` accepts only `ts-server | react-next` (verified: `install.sh` arg parser `ts-server|react-next) STACK="$arg"`; guard rejects all else with `❌ Unknown stack`).

Issue #646 proposes multi-stack support in two stages. The reviewer pass confirmed the issue's code-claims against `staging` and surfaced a strategic fork: **Stage 1 adds two hand-authored presets — which temporarily reinforces the very preset-model README §Methodology names as the anti-goal.**

## 2. Decision — Hybrid (operator, 2026-06-19)

| Path | Verdict |
|---|---|
| **A** — curated react/react-native presets by hand, now | **chosen for Stage 1** |
| **B** — generate-path (L2 LLM research → L3 synthesize → L4 validate) | **chosen for Stage 2, committed** |

**Hybrid = A now + B as the mandatory immediately-following umbrella, with the commitment recorded so the bridge cannot silently strand 3 hand-maintained presets.**

### Rationale (why A is Stage 1, not an alternative to B)

1. **A is a structural prerequisite of B, not a competitor.** The generate-path has nothing to validate against without reference curated presets. Issue #646 itself: «These two presets also serve as **the proving cases for Stage 2's generate path**.»
2. **B-first would build an unbuilt stack ahead of value.** The L4 install-gate does not exist — `retros/phase-5.md`: «**L4 Validator pushed to Phase 7+**.» L2-live is scaffolding only (`packages/core/research/` ships deterministic v1, no live LLM/HTTP). B requires standing all of this up before the first react stack.
3. **The project is already a preset-model in practice** (1 shipped preset). A extends existing practice to 2 stacks; it does not introduce a new anti-pattern. README is itself dual: §«What this project is» calls the product «one-button install of **pre-configured opinionated discipline**».
4. **Phase-5 precedent:** «deterministic bridge first, LLM superset later» is a proven in-project playbook (`phase-5.md` «Architectural pivot — deterministic v1»).
5. **REUSE-first** (per `build-first-reuse-default.md`): most react-spa rules are ADOPT (`eslint-plugin-react/hooks/jsx-a11y`, already in dev-deps at `install.sh:1362`); BUILD only genuine gaps.

### Residual operator-owned component (not decided by this spec)

The one thing the merits do **not** settle: prioritising *methodology-purity now* over *immediate value*. Operator chose hybrid, accepting Stage 1's bridge with an explicit Stage-2 commitment rather than B-first purity. This is a goal-priority call (README owns methodology) — recorded here, owned by the operator.

## 3. Stage 1 / Stage 2 boundaries

**Stage 1 (this umbrella, deterministic, no LLM):**
- `packages/preset-react-spa/` — React 19 SPA on Vite (no SSR / server actions).
- `packages/preset-react-native/` — Expo / React Native.
- Mirror `preset-next-15-canonical` layout: `eslint-rules/`, `templates/` (eslint config, test-runner config, `ARCHITECTURE.*.md`, CI workflow), `RULES.*.md`, `audit-self/`.
- `install.sh` wiring: arg parser + interactive menu + auto-detect + `SHIPPED_DOCS` membership for new docs.
- Next.js path stays byte-identical.

**Stage 2 (committed next umbrella — fires the deferred Phase-5 v2 trigger):**
- Live L2 Planner (read-only; LLM `web_search` constrained to `allowed_domains`).
- L3 synthesizer generalized beyond curated recipes (structured, validated `SynthesisPlan`, never free-form LLM code).
- **Build the L4 self-validation gate** (does not exist today — explicit Stage-2 deliverable, not a pre-existing mechanism).
- Opt-in `--generate` / `AIF_RESEARCH=llm`, run install-time on the consumer's own subscription — **never in CI** (`no-paid-llm-in-ci.md` intact).

## 4. Sequencing commitment — the bridge cannot strand

Issue #646 already names the hook: «Document Stage 2 as **the firing of the deferred Phase-5 v2 trigger** in a research-patch.» This design promotes that from a wish to a **binding sequence**:

- **On Stage 1 close** (both presets merged) → the merging session writes `docs/meta-factory/research-patches/<date>-phase-5-v2-trigger-fired.md` recording that the curated-bridge is in place and the generate-path is now the active next umbrella, AND opens the Stage-2 tracking umbrella.
- This is durable (research-patch = standard project mechanism, reachable by `make self-audit`), in-repo, and not dependent on session memory.
- **Rejected alternative:** create an empty Stage-2 issue now. YAGNI — a placeholder tracker before Stage 1 starts adds noise without signal.

**Debt marker:** until the v2-trigger patch lands, every additional hand-authored preset beyond Next is tracked debt against README §Methodology, not silent drift.

## 5. Build-vs-reuse discipline — R-phase precedes I-phase per preset

The rule candidates in issue #646 (`no-web-only-globals`, `require-stylesheet-create`, `prefer-flashlist-over-flatlist`, `no-business-logic-in-component`, `require-error-boundary`) are **BUILD hypotheses, not approved builds**. Each new rule is a capability commit → CLAUDE.md capability gate + `build-first-reuse-default.md`.

Therefore **each preset begins with an R-phase**:
- For each candidate rule: DeepWiki/WebSearch ≥3 phrasings + prior-art SSOT consult → verdict ADOPT (upstream analog exists) / BUILD (gap confirmed) + new SSOT entries in `prior-art-evaluations.md`.
- Only after the R-phase verdict → I-phase with code.
- This closes the reviewer MINOR: the prior-art SSOT is currently empty for react eslint plugins (`grep` over `prior-art-evaluations.md` → no `eslint-plugin-react`/`react-native` entries). Stage 1 must add them.

Each BUILT rule ships a paired valid/invalid test (principle 02), AST-over-grep where applicable (principle 03).

## 6. Issue #646 amendments (reviewer MAJOR/MINOR, applied)

- **MAJOR-1:** L4-gate stated as an explicit Stage-2 **build** deliverable (was «stays mandatory», implying it exists).
- **MAJOR-2:** no-paid-llm wording tightened — generation is install-time on the consumer's own subscription, never CI; the framework does not bill.
- **MAJOR-3:** Stage-1 «cheap» softened — includes de-Next-ifying shared templates (`eslint.config.react.mjs:3` pulls `@next/eslint-plugin-next`).
- **+ Sequencing-commitment section** per §4.
- **MINOR:** prior-art SSOT entries listed as an explicit Stage-1 deliverable.

## 7. Out of scope (deliberately deferred)

- **Detailed Stage-1 PR decomposition** (gradient of batches, react-spa→react-native ordering, install.sh file-lock handling) → `writing-plans` produces this as the implementation plan.
- **Stage-2 implementation detail** → its own brainstorm/spec/plan cycle when the v2-trigger fires.

## 8. Risks

- **Stage 2 slips → 3 hand-maintained presets** = the «stale presets» failure README warns of. Mitigated by §4 binding sequence + debt marker, not eliminated. If Stage 2 slips past a defined window, that is an operator-visible debt, not a silent one.
- **De-Next-ification of shared templates** could regress the Next path. Mitigated by the byte-identical-Next acceptance criterion + `make self-audit`.
- **R-phase finds most candidates are ADOPT, not BUILD** → fewer custom rules than issue sketches. This is a *success* of build-first-reuse, not a shortfall; acceptance («≥1 custom rule per stack catches its target antipattern») must tolerate a small BUILD set.

## 9. Acceptance of this design (process, not code)

- Issue #646 carries the 4 amendments + sequencing-commitment section.
- This spec is committed under `docs/superpowers/specs/`.
- `writing-plans` produces a Stage-1 implementation plan starting with the per-preset R-phase.

## See also

- [issue #646](https://github.com/Yhooi2/rules-as-tests-aif/issues/646) — operational epic tracker.
- [README.md#why-this-exists](../../../README.md) — project goal + methodology (owns the §Methodology tension this spec navigates).
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — discipline gating §5 rule verdicts.
- [docs/meta-factory/retros/phase-5.md](../../meta-factory/retros/phase-5.md) — deterministic-v1 pivot + L4-deferred + v2-trigger precedent.
- [docs/meta-factory/prior-art-evaluations.md](../../meta-factory/prior-art-evaluations.md) — SSOT register Stage 1 must extend.
