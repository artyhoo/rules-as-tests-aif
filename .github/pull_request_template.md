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
