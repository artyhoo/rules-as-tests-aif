# Reviewer discipline — discipline rule

> **Class:** C — prose-only, no current compensating mechanism (reclassed from B per Track 3 §3.3, commit 4d52a72). Promotion criterion in §4.
> **Authoritative for:** reviewer-discipline rule — §1 reviewer/orchestrator role separation, §2 surface-as-decision-needed pattern, §3 anti-patterns (`#role-swap-mid-session`, `#strategy-decided-by-reviewer`), §4 promotion / retirement triggers.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Companion to orchestrator skill — global skill at `~/.claude/skills/reviewer/SKILL.md` may reference this rule but is not required for the rule to apply (project rule is self-contained).

> **Origin:** Incident 2026-05-07. Reviewer session (post-`/review`) made a project-strategy decision («is architecture.md §2.3 a v2 future spec or v1 active requirement?») mid-session instead of surfacing it as decision-needed. The strategic call should have come from the orchestrator track. Codified in repo following the post-Wave-9 memory-to-docs codification audit ([docs/meta-factory/research-patches/2026-05-13-memory-to-docs-codification-audit.md](../../docs/meta-factory/research-patches/2026-05-13-memory-to-docs-codification-audit.md)).

## §1 The discipline

When acting as reviewer (after `/review` or «проверь / verdict / second opinion»), do NOT cross into orchestrator-role decisions mid-session.

If a review finding requires choosing project strategy, surface it as **DECISION-NEEDED** with both legitimate options described. Let the maintainer confirm or start a separate `/orchestrator` session. The reviewer describes consequences; **the reviewer cannot pick between options.**

Anti-patterns: `#role-swap-mid-session`, `#strategy-decided-by-reviewer`, `#reviewer-as-secondary-orchestrator`

Promotion to principle test: at 3 role-swap incidents within 6 months. Full rule (§2-§5): `.claude/rules/reviewer-discipline.md` (read on demand).

## See also

- [.claude/rules/phase-research-coverage.md §4 anti-patterns](phase-research-coverage.md) — sibling family of focus-tunnel anti-patterns (`#discipline-application-scope-blindness`, `#recursive-self-application-gap`).
- [.claude/rules/ai-laziness-traps.md](ai-laziness-traps.md) — companion discipline on AI laziness during open-ended audits; T16 («pattern-matching-on-name») is the trap that caught the 1A compliance-verifier misalignment.
- [agents/review-sidecar.md](../../agents/review-sidecar.md) — AI-agnostic sub-agent precedent for review work (NOT a compensating mechanism for this rule).
- [agents/compliance-verifier.md](../../agents/compliance-verifier.md) — §1.7 PR-body review agent (scoped narrowly to `phase-research-coverage §1.7`; NOT a reviewer-discipline mechanism per Track 3 §3.3).
- [CLAUDE.md `Artifact Ownership Contract`](../../CLAUDE.md) — reviewer agents are read-only for artifacts they don't own (this rule is the behavioral side of that contract).
- [docs/meta-factory/research-patches/2026-05-16-prose-rules-audit-research.md §3.3](../../docs/meta-factory/research-patches/2026-05-16-prose-rules-audit-research.md) — Track 3 evidence: Class B → C transition rationale.
