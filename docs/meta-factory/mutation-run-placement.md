<!-- scope:doc-audit-ship-boundary-findings -->
# Mutation-test placement — local/session-bound, NOT CI

> **Authoritative for:** where mutation tests (Stryker, universalmutator) run in this project + the local environment they require. The DN-4 placement decision from the doc-audit-ship-boundary Stage 2 findings (maintainer-confirmed 2026-06-02).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The mutation *engine* verdict (ADAPT universalmutator) — see [research-patches/2026-05-31-bash-mutator-prior-art-b1.md](research-patches/2026-05-31-bash-mutator-prior-art-b1.md) (SSOT #91).

## §1 The placement decision (DN-4)

**Mutation tests run locally / session-bound — they are NOT a CI gate.**

- No `.github/workflows/*.yml` runs Stryker or universalmutator. Verified 2026-06-02: `grep -rni 'stryker\|mutation' .github/workflows/` returns only an example `echo` string in `discipline-self-check.yml:109`, never an invocation.
- `packages/core/package.json` carries `@stryker-mutator/*` as devDependencies but **no** `mutation`/`stryker` npm script — mutation runs are invoked manually via `npx stryker run <config>`.
- This matches the project's intent: mutation is a periodic *quality probe* (run on demand to find theatre tests), not one of the earliest-reachable enforcement channels (edit-time → pre-commit → pre-push → CI → production). It does **not** belong in that chain.

**Doc-lie corrected in tandem:** `README.md` previously listed «CI (Stryker + discipline-self-check)» in the multi-channel enforcement line — a false claim (Stryker is not in CI). Corrected by `scripts/apply-doc-fixes.sh` (DN-4 fix) to «CI (discipline-self-check)».

## §2 How to run mutation tests (local)

```bash
# TS surface (Stryker — already configured):
cd packages/core
npx stryker run stryker.config.mjs          # core
npx stryker run stryker.audit-ai-docs.mjs    # audit-ai-docs
# per-file kill scores: packages/core/reports/mutation/report.json

# Bash hooks (universalmutator, ADAPT verdict SSOT #91 — deterministic, no LLM):
pip install universalmutator
mutate <hook>.sh --noCheck --cmd "bash -n MUTANT" --rules bash.rules
analyze_mutants <hook>.sh "<vitest that invokes the hook by path>"
```

## §3 Local environment requirements (the Stage 2.0 caveat)

The doc-audit-ship-boundary Stage 2.0 mutation run could **not** stand up inside the aif-handoff container — surfacing the undocumented assumptions below. Running mutation tests locally requires:

| Tool | Why | Symptom if absent |
|---|---|---|
| `ps` | Stryker's runner enumerates child processes | Stryker fails to start (the Stage 2.0 blocker) |
| `jq` | several `.claude/hooks/*` tests parse JSON via `jq`; their mutation analysis needs the hook to actually run | `hooks/*.test.ts` skip → kill-rate unmeasured |
| `pip` + `universalmutator` | bash-hook mutation engine | bash hooks fall back to manual break-test-restore spot-check |

When any is absent, fall back to the manual mutation-sanity spot-check (break the hook → test must fail → restore) on the highest-branch-count hooks and **record a coverage caveat** — never claim a kill-rate that was not measured (per [ai-laziness-traps.md §2 T6/T14](../../.claude/rules/ai-laziness-traps.md)).

## §4 Downstream

This placement (local/session-bound) is the input the [mutation-discipline-umbrella](../../.claude/orchestrator-prompts/mutation-discipline-umbrella/kickoff.md) Stage B.2/B.3 needs: the bash-mutator build (B.2) wires into the same local/on-demand channel, not CI — consistent with [no-paid-llm-in-ci.md §1](../../.claude/rules/no-paid-llm-in-ci.md) (mutation is deterministic, but the placement decision keeps it off the metered/consumer-CI surface).

## §5 See also

- [research-patches/2026-05-31-doc-audit-ship-boundary-findings.md §DECISION-NEEDED DN-4](research-patches/2026-05-31-doc-audit-ship-boundary-findings.md) — the finding this note resolves.
- [research-patches/2026-05-31-bash-mutator-prior-art-b1.md](research-patches/2026-05-31-bash-mutator-prior-art-b1.md) — engine verdict (SSOT #91).
- [research-patches/2026-05-25-mutation-discipline-audit.md](research-patches/2026-05-25-mutation-discipline-audit.md) — Stage 1 mutation audit (per-file kill baseline).
