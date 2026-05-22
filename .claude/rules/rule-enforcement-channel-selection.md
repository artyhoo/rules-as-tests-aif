# Rule-enforcement channel selection — discipline rule

> **Class:** C — prose-only; mechanism deferred. No compensating mechanism currently in place; enforced by author awareness at rule-authoring time. Promotion criterion in §6. (Refined from the patch §6/§7 "B" lean — there is no compensating mechanism today, so C is the honest class, matching peer meta-discipline rules [reviewer-discipline.md](reviewer-discipline.md) and [parallel-subwave-isolation.md](parallel-subwave-isolation.md).)
> **Authoritative for:** rule-enforcement-channel-selection discipline — §1 the two-axis principle, §2 triggers/non-triggers, §3 the selection procedure, §4 channel catalogue (this repo), §5 anti-patterns, §6 promotion/retirement.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Enforcement *ordering in time* (edit→pre-commit→pre-push→CI→audit) — that is the README "earliest reachable channel" invariant; this rule is its *delivery-scope* companion. No-paid-LLM constraint on any proposed mechanism — see [no-paid-llm-in-ci.md](no-paid-llm-in-ci.md).

> **Origin:** 2026-05-22. The agent repeatedly stumbled over the codified automerge→staging flow *despite it being in memory*. Maintainer's root insight: «remember reliably» ≠ «put in memory» (memory = stage-0, unreliable). Surveyed prior art before codifying — see [research-patches/2026-05-22-rule-enforcement-channel-selection.md](../../docs/meta-factory/research-patches/2026-05-22-rule-enforcement-channel-selection.md) (SSOT for the prior-art survey + the validated/refined principle). Companions OhMyOpencode (`rulesInjector`), Cursor (4 rule-activation types), Agent RuleZ all confirm scope/cost-ordered delivery; CC hooks provide the primitives natively (no engine to build).

## §1 The principle

A rule is delivered along **two orthogonal axes** — pick each independently:

1. **Detectability → enforcement *type*.** Is the violation **mechanically detectable**?
   - **Yes → gate.** A deterministic check (regex/AST/grep/test/hook) that *blocks* the action: edit-time PreToolUse, pre-commit, pre-push, CI (last resort), production audit.
   - **No (needs judgment) → injection.** Deliver the rule's *text* at the relevant moment to *inform* the decision. Injection does not block; it surfaces.
   - A gate and an injection are **not rankable** — a judgment rule *cannot* be gated, so injection is the only tool, not a "weaker gate".

2. **Relevance-frequency → delivery *breadth*.** Choose the **narrowest trigger that still fires reliably**. Reliability order:

   > **deterministic matcher** (hook on tool/path/glob) ≳ **always-on digest** > **semantic/description trigger** (best-effort) > **memory** (stage-0, unreliable).

   - `≳`: a deterministic matcher equals always-on when its trigger fires every turn (a UserPromptSubmit hook is "always-on by another name"); it strictly dominates when narrower than every-turn (reliability *and* lower standing cost).
   - **Semantic triggering ranks BELOW always-on, not above.** `when_to_use` / skill-description / Cursor "Agent"-type loading is *best-effort* — the model may not load it (Superpowers' "1% rule" is a prose patch *for this exact under-firing*). Reserve always-on for the **3–4 sweeping invariants** only. **Never** rely on memory for a rule that must hold.

The fix to the origin incident: the automerge→staging flow is *judgment + path-relevant* → it belongs as **path-scoped injection** (deliver when touching PR/merge surfaces), not as a memory note.

## §2 Triggers / non-triggers

**Applies when** introducing or relocating a rule, convention, or discipline that must hold across sessions — especially a load-bearing one (the violation has real cost). This is the moment you'd otherwise reflexively "add it to memory" or "drop it in CLAUDE.md".

**Does NOT apply to:** one-off task instructions; ephemeral session preferences; facts already enforced by an existing channel; pure prose docs with no behavioural claim.

## §3 The selection procedure

For each rule, in order:

1. **Detectable?** Mechanically yes → design the **narrowest gate** on the earliest reachable channel (per README "earliest reachable channel"). No → go to injection (step 3).
2. **Gate breadth:** fire on the *action* (PreToolUse / pre-commit) before falling back to pre-push, then CI (last resort). Zero standing context cost is the win.
3. **Injection breadth:** pick the narrowest *deterministic* trigger that fires when the rule is relevant — path/tool/glob-scoped hook first; always-on digest only if relevant every turn (reserve for the 3–4 invariants); semantic `when_to_use` only for *non-load-bearing* convenience.
4. **Never** terminate at "memory" for a load-bearing rule. Memory is stage-0 — acceptable only as a pointer to a rule that already lives at a reliable channel.
5. **Record the chosen channel** in the rule's `Class` field rationale (gate → A/B with the test/mechanism; injection → note the trigger).

## §4 Channel catalogue (this repo)

| Channel | Type | Breadth | Standing cost | Reliability |
|---|---|---|---|---|
| PreToolUse hook (`.claude/settings.json` matcher) | gate | tool/action-scoped | 0 | deterministic |
| PostToolUse hook + path filter, **exit-1** (e.g. `check-doc-authority.sh` → `bin.ts process.exit(1)`) | gate | path/action-scoped | 0 | deterministic |
| pre-commit / `.husky/pre-push` | gate | commit/push-scoped | 0 | deterministic |
| CI (`audit-self.yml`, `ci-success`) | gate | PR-scoped | 0 | deterministic — **last resort** |
| principle test (`packages/core/principles/*.test.ts`) | gate | repo-wide | 0 | deterministic |
| PostToolUse hook, **stdout-only** (no exit-1 — the deferred §4 ADAPT injector) | injection | path/glob/tool-scoped | low (per-edit) | deterministic |
| UserPromptSubmit digest (`inject-session-bootstrap.sh`) | injection | always-on | per-prompt tokens | deterministic — **reserve for 3–4 invariants** |
| `.claude/rules/*.md` auto-load (CC session-start) | injection | always-on | per-session tokens | deterministic |
| skill `when_to_use` triggering | injection | semantic | metadata only | **best-effort** |
| memory (`~/.claude/.../memory`) | injection | recall-time | index line | **stage-0 — last resort** |

The gate/injection split turns on the **exit code**, not the hook event: a PostToolUse hook that `exit 1`s *blocks* (gate); one that only writes stdout *informs* (injection). `check-doc-authority.sh` is a gate because its bin exits 1 on violation.

The deferred **ADAPT** mechanism (patch §4): a PostToolUse rule-injector keyed on a `globs:` front-matter field in `.claude/rules/*.md`, delivering the matching rule only when a matching path is touched — generalising `check-doc-authority.sh`'s internal path-filter. Adapts OhMyOpencode `rulesInjector`. ~2–3h; deterministic bash, no paid LLM.

## §5 Anti-patterns

- **`#memory-as-primary-channel`** — parking a load-bearing rule in memory and expecting reliable recall. Memory is stage-0; it under-fires exactly like the origin incident. Counter: §3 step 4.
- **`#semantic-trigger-for-load-bearing`** — relying on `when_to_use` / skill-description matching for a rule that *must* hold. Best-effort ≠ reliable. Counter: deterministic matcher or always-on for load-bearing; semantic only for convenience.
- **`#always-on-bloat`** — adding every rule to the always-on digest "to be safe". Every token is paid every turn. Counter: reserve always-on for the 3–4 sweeping invariants; everything else scoped.
- **`#gate-where-judgment-needed`** — trying to mechanically gate a judgment rule (false positives) instead of injecting its text. Counter: detectability axis — judgment → injection.
- **`#inject-where-gate-possible`** — delivering prose reminders for a mechanically-detectable violation instead of a gate that blocks it. Counter: detectable → gate at the earliest reachable channel.
- **`#pattern-matching-on-name`** (companion to [ai-laziness-traps.md §2 T16](ai-laziness-traps.md)) — assuming a tool that advertises "rules/memory/context" delivers reliable JIT just because of the label (NeMo "guardrails" ≠ dev-convention delivery). Counter: verify the actual delivery mechanism, not the name.

## §6 Class C — promotion / retirement

**Class C** — prose-only; the deferred mechanism is the §4 ADAPT rule-injector hook.

- **Promotion to mechanically-enforced (Class A/B):** when EITHER (a) the §4 ADAPT hook ships (→ B: compensating mechanism), with a follow-on `packages/core/principles/<N>-channel-selection.test.ts` checking that every load-bearing rule declares a non-memory channel (→ A); OR (b) 3 channel-mismatch incidents (a load-bearing rule parked in memory/semantic that under-fired) accrue within 6 months.
- **Retirement:** if 12 consecutive months pass with zero channel-mismatch incidents AND (if promoted) the principle test reports zero violations, archive to prose in CLAUDE.md.

**Existing rules — forward-going, not retroactive:** §3 step 5 obligates *new or relocated* rules to declare their delivery channel; it does **not** trigger a retroactive sweep of the existing `.claude/rules/*.md` (none of which declare a channel today). They declare channel at next substantive touch — parallel to [dual-implementation-discipline.md §9](dual-implementation-discipline.md) "forward-going annotation". No CI gate checks channel declaration (Class C), so existing non-declaration is the expected starting state, not a debt bomb.

## §7 Recursive self-application

This rule is itself a rule — so it must be delivered at its own correct channel. It is **judgment** (no mechanical test decides "is this rule at the narrowest channel") and **relevant when authoring rules** (`.claude/rules/`, `packages/core/principles/`). **Today** it is delivered **always-on** via CC's session-start load of every `.claude/rules/*.md` (deterministic, but pays standing cost every session) and registered in principle 09's `REQUIRED_HEADER_DOCS` (this commit) — **not** memory, which is the fix to the origin incident. The deferred §4 ADAPT hook would **narrow** it to path-scoped deterministic injection (fire only when rule-authoring surfaces are touched), trading per-session standing cost for per-edit. Either way it is not memory; recording it there would be the `#memory-as-primary-channel` anti-pattern it names. The §1.7 forward+backward self-check lives in the origin patch §6.

## See also

- [docs/meta-factory/research-patches/2026-05-22-rule-enforcement-channel-selection.md](../../docs/meta-factory/research-patches/2026-05-22-rule-enforcement-channel-selection.md) — prior-art survey + principle origin (SSOT for this rule's evidence).
- [README.md#why-this-exists](../../README.md#why-this-exists) — "earliest reachable channel" (time axis); this rule is the delivery-scope (breadth axis) companion.
- [no-paid-llm-in-ci.md](no-paid-llm-in-ci.md) — hard constraint: any §4 mechanism is deterministic / AI-agnostic, never paid CI.
- [doc-authority-hierarchy.md](doc-authority-hierarchy.md) — header + Class-field format this rule follows.
- [ai-laziness-traps.md §2 T16](ai-laziness-traps.md) — `#pattern-matching-on-name` trap referenced in §5.
- [packages/core/principles/09-doc-authority-hierarchy.ts](../../packages/core/principles/09-doc-authority-hierarchy.ts) — `REQUIRED_HEADER_DOCS` (this rule is registered there).
