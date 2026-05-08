# T7 self-review — recursive application of the rule to its triggering gap

> Verification artifact for Phase 8.8.1 hard constraint #5 (apply principle to itself). Walks the original [Phase 9 entry research §4.A1](../phase-9-entry-research.md) lookup through the [`.claude/rules/phase-research-coverage.md` §1](../../../.claude/rules/phase-research-coverage.md) checklist; verifies whether the rule, had it been active before Phase 9 entry T3.2, would have caught the AIF `/aif-evolve` + Oh My ClaudeCode coverage gap recorded in commit `f92f60b`.
>
> **Verdict:** **PASS** — 5/6 §1 items independently catch the gap. §1.6 (trigger sweep) is N/A to this gap shape (it covers armed-not-fired triggers, not missed candidates within a fired trigger). Methodology validated; rule ships GO, not REVISE.

## Audit method

For each §1 checklist item, mentally re-run the §4.A1 lookup with the item active. Question per item: *would applying this item have surfaced AIF `/aif-evolve` (or Oh My ClaudeCode) before the verdict closed?*

The original lookup state at T3.2 close (per [phase-9-entry-research.md §4.A1](../phase-9-entry-research.md)):

> «context7 candidates checked (5): Cursor, Continue.dev, Factory ESLint Plugin, Cody/Sourcegraph, Aider. **No production tool implements LLM-driven «picks from menu» of existing ESLint rules given a codebase.**»

## Per-item recursive audit

| § | Checklist item | Applied to §4.A1 — what would surface? | Catches gap? |
|---|---|---|---|
| 1.1 | Own-stack sweep | Enumerate AIF surfaces from [aif-comparison.md](../aif-comparison.md): `/aif-fix`, `/aif-review`, **`/aif-evolve`**, `/aif-implement`, `/aif-plan`, `/aif-loop`. Question for each: «does this surface ship in «LLM-pick rules from menu» area?» — `/aif-evolve` synthesises rules from tagged patches → **YES**. Surfaces immediately. | **✓** |
| 1.2 | Category sweep (capability) | Enumerate categories: agent harnesses (AIF, Oh My ClaudeCode, Continue.dev — partial), AI orchestration platforms (LangGraph mentioned Phase 5 carry-forward), IDE-integrated assistants (Cursor, Cody — covered), CLI assistants (Aider — covered), codemod toolkits (n/a Path A). Original lookup hit IDE + CLI categories; **missed agent-harness category** (where AIF + Oh-My live). **YES** — surfaces both. | **✓** |
| 1.3 | Semantic-distance check | All 5 original candidates were «AI coding assistants». Probe function: «pick from menu given codebase context» → re-search at one paradigm step removed: «skill self-improvement», «patch distillation», «accumulated lessons learned» → **AIF `/aif-evolve` matches verbatim**. **YES**. | **✓** |
| 1.4 | Adversarial check on negative-existence claim | Counter-prompt against «no production tool implements LLM-pick of ESLint rules»: «if such a tool existed, where would it live? what would its docs page say?» — answer maps to «agent harness with skill-context that synthesises rules from patches» → **AIF `/aif-evolve`**. Also: «multi-agent orchestration that runs autonomously in our exact runtime» → **Oh My ClaudeCode family**. **YES** — both surface. | **✓** |
| 1.5 | Prompt-list ≠ complete | T3.2 closed at the 5-candidate floor. §1.5 mandates that closing is permitted only if §1.1-§1.4 also hold. They don't (above) → §1.5 forces continuation past the floor → §1.1 / §1.2 / §1.3 / §1.4 then surface AIF. **YES** (transitively). | **✓** |
| 1.6 | Trigger sweep at phase entry research | Phase 9 entry was triggered by §13.10 entry #2 firing at Phase 8 close — the sweep would correctly classify §13.10 #2 = FIRED. But the gap was on the *content* of the candidate base for that fired trigger, not on the *fire state*. §1.6 catches a different gap shape (armed-not-fired) and does not apply here. | **N/A** |

**Summary:** 5/6 items independently catch the gap; §1.6 doesn't apply to this shape. The methodology is robustly redundant — any single one of §1.1-§1.5 would have flipped the «no production analog» verdict from load-bearing to provisional, triggering further candidate search before close.

## §2 self-reflection prompt audit (would the prompts have caught it at retro time?)

| § | Prompt | Applied to Phase 9 entry retro |
|---|---|---|
| 2.1 | Когда ошибся — почему? | Catches the moment (§4.A1 close at T3.2) and the shortcut (treating AIF as dep, ESLint-vocabulary anchor) — explicit format. **✓** |
| 2.2 | Мог ли пропускать раньше? | Phase 5 / 6 actively engaged AIF `/aif-evolve` (Phase 5 §3.2: «mining-mode (post-hoc)»; Phase 6 §3.2: «AIF aif-evolve auto-generated rules — LLM-driven; post-hoc patch mining»). Phase 9 entry had **prior-knowledge available** but did not consult it. The prompt would have surfaced this prior-research-not-reused regression. **✓** |
| 2.3 | Как не пропускать? | Maps to §1.1 / §1.2 / §1.3 / §1.4 / §1.5 — all explicit. **✓** |
| 2.4 | Какой урок? | Operationalisable form: «before closing «no LLM-pick analog» claim, sweep AIF surfaces + agent-harness category». **✓** |
| 2.5 | Did the principle apply to own design? | Phase 9 entry was a downstream consumer of Phase 8.8 (recording layer); it did not introduce a new principle, so §2.5 doesn't directly apply to Phase 9 entry itself. **But** applying §2.5 to Phase 8.8 surfaces the meta-meta gap: Phase 8.8 formalised recording but did not formalise searching, leaving the gap that Phase 9 then walked into. **✓** (catches root cause one level up.) |

## §13.16 self-trigger state (post-T7)

[`open-questions.md` §13.16](../open-questions.md) self-trigger condition: «verification gate: the rule applies recursively to itself per Phase 8.8.1 retro §7 — the rule's §1 checklist must, in retrospect, catch the AIF + Oh-My gap that triggered its creation. If self-review fails, the rule is REVISE not GO.»

T7 result: **PASS** (5/6 §1 items catch the gap; §1.6 N/A by gap shape). §13.16 self-trigger transitions from PENDING T7 → STILL ARMED (no promote-to-mandatory; observed-zero-FP-on-self-application is the foundational datapoint, not yet 3 sessions for retire path).

## Tags

`#self-review` `#recursive-self-application-pass` `#methodology-validated`
