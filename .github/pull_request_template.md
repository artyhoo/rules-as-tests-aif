## Summary

<one-paragraph what + why>

## Changes

<bullet list of substantive changes>

## Prior-art consult

- [ ] Capability commits in this PR carry a `Prior-art:` trailer (or `skipped — <≥20 chars rationale>` for hook-flagged commits that aren't real capability additions). See [CONTRIBUTING.md «Build-vs-reuse + `Prior-art:` trailer convention»](../CONTRIBUTING.md).
- [ ] If a new capability area surfaced during this PR: a new entry was added to [docs/meta-factory/prior-art-evaluations.md](../docs/meta-factory/prior-art-evaluations.md) in the same commit as the capability artifact, with `Verdict` / `Rationale` / `Trigger to revisit`.
- [ ] If existing entries matched: their `Last reviewed` date was updated in the same commit (`git log -p` on the SSOT confirms the touch).
- [ ] context7 queries (≥3 phrasings) for new capability areas were run and the results cited in the relevant commit body or research file.

## Test plan

- [ ] `npm test --workspace=@rules-as-tests/core --run` green
- [ ] `make self-audit` green
- [ ] `npm run --prefix packages/core test:principles` green (principle 08 enforces SSOT citations on phase research files)
- [ ] If hook code touched: `bash tests/hooks/prior-art-trailer-hook.test.sh` green
- [ ] Manual smoke per change <list specific scenarios>

## §1.7 Self-discipline check (REQUIRED if PR touches discipline-bearing files)

<!--
Gate: .github/workflows/discipline-self-check.yml fires on `pull_request` events
whose paths-filter matches:
  .claude/rules/**, packages/core/principles/**, docs/meta-factory/EXECUTION-PLAN.md,
  docs/meta-factory/prior-art-evaluations.md, CLAUDE.md, templates/**/*.md,
  packages/core/templates/**/*.md, packages/core/templates/**/*.template.md

If your PR touches any of those paths → KEEP both H3 sections below and FILL each
with ≥40 non-whitespace chars enumerating which disciplines were checked / which
artefacts were swept. Placeholders shown are under 40 chars on purpose — CI will
fail until you replace them.

If your PR does NOT touch any discipline-bearing file → DELETE both sections below
and replace with a SINGLE line:

  ### §1.7 Skipped: <one-line reason ≥60 chars after the colon, on the same line>

Reference: .claude/rules/phase-research-coverage.md §1.7
Skill:     .claude/skills/self-reflection/SKILL.md
-->

### §1.7 Forward-check applied

_TODO: enumerate disciplines checked_

### §1.7 Backward-check applied

_TODO: enumerate sweep performed_
