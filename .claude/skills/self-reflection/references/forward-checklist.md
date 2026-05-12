# Forward-check — full enumeration

> **Scope:** complete forward-check enumeration for §1.7 «Recommendation self-discipline check». Scoped by inheriting from [SKILL.md](../SKILL.md).

Apply each layer in order. Failure on any single layer → recommendation is **provisional**, not load-bearing.

## Layer 1 — Code-level (R1-R20 lint)

If the proposal includes TS / JS code (tests, principles, installer logic, sub-agents):

- TypeScript strict + `noUncheckedIndexedAccess` — proposed code typechecks?
- ESLint 10 flat config (`eslint.config.mjs`) — passes?
- `dependency-cruiser` — no cycles, no banned imports, layer respect?
- For UI: R12-R20 (server/client boundary, R17 Storybook stories, etc).

If proposal is pure docs/process — N/A.

## Layer 2 — Principle-level (`packages/core/principles/*.test.ts`)

- principle 01-08 — any new TS code passes? (run `npx vitest run packages/core/principles/`)
- principle 09 — every new authority-bearing doc carries compliant `> **Authoritative for:**` header?
- New principle introduced? Then it has companion rule in `.claude/rules/` + bootstrap research-patch (per §1.7 self-reflexive trigger).

## Layer 3 — Commit-level (capability-commit gate)

For each commit in proposal — classify per [CLAUDE.md `What is a capability commit`](../../../../CLAUDE.md):

- Adds new explicit dep in `package.json` (transitive doesn't count) — capability.
- Adds new file ≥50 LOC under new subdirectory `packages/core/<new-dir>/` — capability.
- Adds new file ≥80 LOC anywhere under `packages/` — capability.

For each capability commit: `Prior-art:` trailer drafted with reference to `prior-art-evaluations.md#<ID>` or escape-hatch rationale ≥20 chars.

For each non-capability commit: escape-hatch trailer with ≥20-char rationale (e.g. «refactor only, no new capability»). `.husky/pre-push` enforces this on push.

## Layer 4 — Build-vs-reuse SSOT

Recommendation references load-bearing external patterns? For each:

- Is it already in [`prior-art-evaluations.md` §4 entry table](../../../../docs/meta-factory/prior-art-evaluations.md)? (entries #1-#10 as of 2026-05-09: rules-as-tests itself, ArchUnit, Stryker, ESLint flat config, dep-cruiser, Arc42, AGENTS.md spec, AIF Step 0, Cline Memory Bank, matklad ARCHITECTURE.md).
- If not, new entry drafted in same commit with `Verdict`, `Rationale`, `Trigger to revisit` (per `prior-art-evaluations.md §3`)?
- context7 query (≥3 phrasings) on the capability area run? candidates surfaced cited?

## Layer 5 — Trigger sweep (§1.6)

Before closing — `grep -nE "^### 13\." docs/meta-factory/open-questions.md`. For each non-cascade §13.x:

- Decompose trigger condition into observable signals (file existence / config bumps / consumer evidence / version events).
- Run verification probe; classify FIRED / STILL ARMED / CASCADE-DEPENDENT.
- Surface FIRED entries as `research-patches/2026-MM-DD-trigger-fire-§<N>.md` patches.
- Record STILL ARMED in retro Trigger-health table.

## Layer 6 — Doc-authority on artefacts produced

For every new `.md` file the proposal claims to create:

- File path under `.claude/rules/`, `docs/meta-factory/*.md` (excluding filename-convention transients), `skills/*/SKILL.md`, `skills/*/references/*.md`, project-root canonical, hot operational? → `> **Authoritative for:**` header required.
- Folder-level authority (`docs/meta-factory/retros/`, `docs/meta-factory/research-patches/`) → file inherits, no own header required.
- Filename-convention transient (`docs/meta-factory/PHASE-*-PROMPT.md`, `phase-*-research.md`) → header optional.
- File **exists** in repo, not just claimed in `README.md` shipping table?
- Every cross-doc link in proposal resolves to a real file (not to a future or imagined file)?
- **H8 sub-case (b) — meta-commentary anti-tautology**: In meta-sections that describe primary-content artefacts (counts of rules, lists of commits, enumeration of entries), use declarative forward-pointers («see §X for current list») rather than hard-coded literal counts/enumerations. Literal counts self-deprecate when primary content changes; a pointer to the authoritative section is stable. (`#discipline-application-scope-blindness` sub-case (b) — see [`.claude/rules/phase-research-coverage.md §4`](../../../../.claude/rules/phase-research-coverage.md).)
- **H8 sub-case (c) — verify before accepting collaborator claims**: For every file:line citation or factual assertion received from a collaborator, agent report, or reviewer finding: open the file and confirm the cited line's content before applying the claim as a fix or incorporating it into the commit. Do not propagate unverified claims. (`#discipline-application-scope-blindness` sub-case (c), T3 analogue for collaborator-sourced claims per [`.claude/rules/ai-laziness-traps.md §2 T3`](../../../../.claude/rules/ai-laziness-traps.md).)

## Layer 7 — User-value goal lens

[README.md#why-this-exists](../../../../README.md): «AI agents (Claude, Cursor, Copilot, Aider) write plausible-looking code that reliably violates undocumented conventions. This package operationalizes the principle: every rule that governs your codebase is an executable test that fails the build when violated.»

For each new rule the proposal introduces, ask:

- Does it have an executable test, or is it a prose convention only?
- If prose-only — is the prose-only state intentional and documented (e.g. «process rule, ladder of enforcement at level 4»), or is it an undocumented-rule failure mode in disguise?
- Are claimed enforcement points actually enforced (real test, real CI gate, real pre-push), or are they aspirational?

This layer catches the «I introduced a rule, but didn't make it fail CI» drift — same shape as «documents lie; tests don't» applied to the act of introducing rules.
