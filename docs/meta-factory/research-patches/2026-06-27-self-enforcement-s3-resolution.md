<!-- scope:self-enforcement-fixes -->
# Self-enforcement-fixes S3 — DECISION-NEEDED resolution (2026-06-27)

> Scope: the two maintainer-reserved forks in `self-enforcement-fixes` kickoff §5 (S3). Closes the `AUDIT-РЕЗУЛЬТАТ-2026-06-27` Track B PARTIAL items the kickoff parked for the maintainer. The maintainer delegated the decision on 2026-06-27 («сделай как лучше»); both forks resolve to **ACCEPT** (Option B) with a recorded promotion trigger, per [build-first-reuse-default.md §2](../../../.claude/rules/build-first-reuse-default.md) (do not BUILD a capability without a confirmed friction instance).

## Fork 1 — living-docs-auditor source self-application → ACCEPT (Option B)

**Decision:** document explicit acceptance; do **not** build a source-variant `audit-ai-docs.sh` so the framework audits its own `AGENTS.md` / code-vs-docs.

**Rationale:**

- The audit logic is already unit-tested at [`packages/core/audit-self/audit-ai-docs.test.ts`](../../../packages/core/audit-self/audit-ai-docs.test.ts) (200 tests); only the source-side *invocation* is absent (by design — the installer ships the script to consumers).
- A source-variant audit is a capability commit; per BFR-default it needs a confirmed recurring friction, which does not yet exist.
- The one own-doc drift observed this session (the R4b rule was initially omitted from the `AGENTS.md` rule index) was caught by **principle 21** (`rules-autoload` conformance probe), a *different* self-application mechanism — so the gap already has a guard, just not this one.

**Promotion trigger (revisit → Option A):** if framework-own-doc drift (`AGENTS.md` / code-vs-docs) recurs and is **not** caught by an existing principle test within a 6-month window, build the source-variant audit.

## Fork 2 — standing trigger for judgment-agents (compliance-verifier) → ACCEPT (Option B)

**Decision:** accept as inherent; do **not** add a dedicated edit-time inject-nudge.

**Rationale (revised after investigation — the original lean was Option A):**

- The obligation is **already delivered through two channels**: [`CLAUDE.md:151`](../../../CLAUDE.md) carries it always-on («read `agents/compliance-verifier.md` … before merging a discipline-bearing PR», loaded every session + echoed in the session-bootstrap digest), and [`.github/workflows/discipline-self-check.yml`](../../../.github/workflows/discipline-self-check.yml) gates the §1.7 substance arm at PR time (the same gate this umbrella's harvest PR #773/#774 had to satisfy).
- Implementing Option A is **not the «cheap nudge» the kickoff assumed**: compliance-verifier is scoped to §1.7 substance review ([reviewer-discipline.md §5](../../../.claude/rules/reviewer-discipline.md) — «compliance-verifier is empirically scoped to PR description §1.7 … not reviewer role-swap»; T16 pattern-matching-on-name), and its natural rule home, `phase-research-coverage.md`, was just made deliberately **native-only / no `<!-- globs: -->`** by this same umbrella's S2 (#773). Adding a globs marker there would contradict that decision. A dedicated nudge therefore needs a **new rule** (doc-authority header + `AGENTS.md` index row + principle 09 registration + §1.7) — a capability addition, disproportionate to a marginal third reinforcement of an already-two-channel obligation.

**Promotion trigger (revisit → Option A):** if a discipline-bearing PR merges **without** compliance-verifier / §1.7 substance review despite the CLAUDE.md + CI channels (a recorded incident) → build the dedicated edit-time nudge rule.

## S4 (not a fork) — settings.json MultiEdit matcher → maintainer-manual

`.claude/settings.json` `inject-matching-rule` matcher is `"Edit|Write"`; the hook internally already accepts `MultiEdit`, so a rule-relevant edit made via `MultiEdit` is not delivered. Fix = widen the matcher to `"Edit|Write|MultiEdit"`. `settings.json` is deny-listed for agents (self-protecting hook), so this is surfaced as a one-line maintainer-manual step, not landed here.

## §1.7 self-reflexive note

- **Forward-check:** complies with [build-first-reuse-default.md §2](../../../.claude/rules/build-first-reuse-default.md) (both forks DEFER with recorded triggers rather than BUILD speculatively), [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (zero API-billed calls — this is a markdown decision record), and [doc-authority-hierarchy.md §5](../../../.claude/rules/doc-authority-hierarchy.md) (folder-level authority via the `research-patches/` README; per-file scope annotation on line 1).
- **Backward-check:** closes the audit's open S3; supersedes nothing. The #773 S2 native-only decision for `phase-research-coverage.md` is explicitly **respected** (Fork 2 does not add a globs marker there). No maintainer-owned artefact was silently rewritten.
