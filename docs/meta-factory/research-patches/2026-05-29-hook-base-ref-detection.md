<!-- scope:hook-base-ref-detection -->
# Pre-push hook base-ref detection — R-phase findings

> Scope: R-phase. Inherits folder authority ([research-patches/README.md](README.md)). Output = research-patch + recommended design; **no code changes** (ai-laziness-traps T5). The stranded `origin/main` is recorded as an I-phase finding, not fixed here.

## Problem

The pre-push hook decides *which base ref* to diff `HEAD` against to scope its §7 Prior-art and §1.7 trailer checks. Today it **guesses** a static branch:

- `packages/core/hooks/pre-push.ts:50-52` — `upstreamRef()` returns `process.env['PREPUSH_UPSTREAM_REF'] ?? 'origin/staging'`.
- `packages/core/hooks/pre-push.fallback.sh:11` — `UPSTREAM_REF="${PREPUSH_UPSTREAM_REF:-origin/staging}"`.
- `packages/core/hooks/pre-push.ts:297` — **stranded**: the §6 spec-discipline guard bypasses `upstreamRef()` and hard-codes `'origin/main...HEAD'` (and uses 3-dot, while `git.ts:45,53` use 2-dot — a second, latent inconsistency).

Two load-bearing failures follow:

1. **Consumer no-op (the big one).** `install.sh:483` ships only `pre-push.fallback.sh` to consumers — **not** `pre-push.ts`. The dispatcher then routes consumers to the bash fallback, which defaults to `origin/staging`. A consumer repo almost never has a `staging` branch → `git rev-parse --verify origin/staging` fails → `exit 0`. **The shipped hook silently does nothing on any consumer repo whose trunk is `main`/`master`/`develop`.** The enforcement substrate the project sells is, by default, inert at the consumer.
2. **Wrong base on prod-promotion.** A branch targeting `main` (prod promotion under the staging-trunk model, PR #150) is still diffed against `staging` dev-side → wrong commit range, checks silently mis-scoped, no error.

CI does **not** have either bug: `audit-self.yml:291-313` knows the real PR base (`github.base_ref`), fetches it, sets `PREPUSH_UPSTREAM_REF=origin/${base_ref}`, and **fails loudly** if unresolvable (the comment at `:296-297` explicitly names the `upstreamExists()` silent-skip as a false-pass). The asymmetry is the finding: CI is privileged and correct; the dev/consumer side guesses and silently skips.

## Root cause

`#own-stack-blind-spot` (phase-research-coverage §4) at the git layer: the hook never asked *"does git itself hand the pre-push hook its base?"* — it does. A pre-push hook receives, on **stdin**, one line per ref: `<local_ref> <local_sha> <remote_ref> <remote_sha>`. `remote_sha` (all-zeros `Z40` for a new branch) is the exact ref being pushed against — the canonical answer. The hook reads stdin **nowhere** (`pre-push.ts` imports only `getCommits, upstreamExists, realGit`; no `process.stdin`/`/dev/stdin` read in either file). It guessed a value git was already providing.

## Push-time signal analysis (empirical, this repo, 2026-05-29)

| Signal | This-repo result | Verdict for base-detection |
|---|---|---|
| git pre-push **stdin** (`remote_sha`) | (canonical; not read) | **Authoritative** — exactly what's pushed against; what pre-commit uses |
| `@{upstream}` | `origin/main` | Unreliable — tracks the *fork point*; becomes `origin/<self>` after `git push -u` |
| `branch.<name>.merge` | `refs/heads/main` | Same as `@{upstream}`; config-dependent |
| `origin/HEAD` (`symbolic-ref`) | `origin/main` **— stale** (trunk is `staging` since PR #150) | Unreliable — set at clone, not auto-refreshed; "easily unset" (WebSearch) |
| `merge-base` ahead-count | degenerate (HEAD == origin/main) | Heuristic-only; needs a candidate-trunk list to compare against |

Signals already **disagree in this very repo** (origin/HEAD says `main`; project trunk is `staging`), which is itself the proof that any single guessed signal is fragile.

## Prior art (BFR §3: WebSearch ×3 + DeepWiki + SSOT)

- **pre-commit/pre-commit** (DeepWiki, 2026-05-29) — the mature reference. Does **not** use merge-base, `@{upstream}`, or a hardcoded default. Parses pre-push **stdin**: uses `remote_sha` as base (`remote_sha..local_sha`); for `Z40` new-branch it computes ancestors-not-on-remote via `rev-list --remotes`, falling back to all-files for a root push; exposes `PRE_COMMIT_FROM_REF`/`PRE_COMMIT_TO_REF`. **Match analysis (T16):** upstream problem-class = *incremental push scope* (don't re-lint already-pushed files); our problem-class = *full-PR-base scope* (every PR commit carries a trailer). **Partial match** — the stdin-parsing *primitive* transfers; the *scope semantics* do not (see falsifier).
- **lefthook** (WebSearch) — uses `git diff HEAD @{push}` (`@{push}`, the push-destination, distinct from `@{upstream}`). Confirms mature tools read git's push-target signal rather than hardcoding.
- **`origin/HEAD` detection** (WebSearch) — consensus: unreliable, "refuse to guess … fail with instructions" if unset. Validates *loud failure over silent skip*.
- **SSOT consult** — #20 (CC hooks API, ADOPT), #59 (Aider check-registry scoping, ADAPT — the existing `getChangedFiles` push-range technique's lineage). No SSOT entry covers *base-ref detection*; this patch proposes one (see §I-phase).

## Recommended design (provisional — falsifiable)

**Verdict: ADAPT pre-commit's stdin-parsing primitive** (not verbatim ADOPT — scope semantics differ). Concretely:

1. **Dev/consumer side reads git stdin.** `pre-push.ts` (and the fallback) parse the `<local_ref> <local_sha> <remote_ref> <remote_sha>` lines git already passes. Use `remote_sha` as the base when present; for `Z40` use `rev-list <local_sha> --not --remotes=<remote>`. This **eliminates guessing and the consumer-`staging` breakage entirely** — it works in *any* repo regardless of trunk name, because git provides the actual target. No `origin/staging` literal ships to consumers.
2. **Keep `PREPUSH_UPSTREAM_REF` as the CI override.** CI legitimately wants full-PR-base scope via `github.base_ref` and has no meaningful stdin — its existing override path is correct and stays. So: **stdin-derived base for dev; env-override for CI.** This is an additive change to `upstreamRef()`, not a rewrite.
3. **Loud failure, never silent skip.** When neither stdin nor env yields a resolvable base, **warn visibly** (the fallback already prints; the TS side currently returns silently — align it). Mirrors CI's fail-loud and the WebSearch "refuse to guess" consensus.
4. **Fold the stranded `origin/main:297` into the same resolver** and reconcile 3-dot vs 2-dot (I-phase).

**Falsifier (what would make this wrong):** if the project wants the dev side to enforce *full-PR-base* scope (every commit since the merge-base with the trunk), stdin's `remote_sha` **under-checks** — it only sees commits not yet on the *same-named* remote branch, not all commits since the PR base. In that case the right primitive is `merge-base` against a *detected* trunk (candidate chain: `@{push}` → `origin/HEAD` refreshed via `git remote set-head -a` → first existing of `{main,master,develop}`), with loud failure if none resolves. The maintainer must decide **incremental-push scope vs full-PR scope on the dev side** — this is the one genuine fork the I-phase inherits. (Note: the per-commit trailer invariant means incremental scope still eventually checks every commit *as long as the dev side stops silently skipping* — which is the actual bug. So stdin alone is a strict improvement even if full-PR scope is later preferred.)

## I-phase findings (do NOT fix in this R-phase — T5)

- **F1.** `pre-push.ts:297` §6 guard hardcodes `origin/main...HEAD` — route through the resolver; reconcile 3-dot vs `git.ts` 2-dot.
- **F2.** TS side silently skips on unresolvable base (`upstreamExists` false → `return`); align to fallback's visible warning.
- **F3.** Verify `core.hooksPath`/git invokes `.husky/pre-push` directly (no husky npm dep present → git forwards pre-push stdin natively; low risk, confirm in I-phase before relying on stdin).
- **F4.** Add an SSOT entry for "pre-push base-ref via git stdin (pre-commit precedent), ADAPT".

## Active ai-laziness-traps (per kickoff obligation)

T2 (designed ≠ verified — empirically probed git in-repo, not from memory), T3 (every claim carries file:line/command output), T5 (R-phase ships findings, not edits), **T16** (pre-commit stdin = related-but-different problem class; match analysis above, not assumed), T11/T12 (prior-art via live DeepWiki+WebSearch, not training recall). Domain-specific: **T-base-ref — "guess a value an upstream API already provides"**: the temptation to pick a smarter default branch name instead of reading the base git hands you on stdin.

## §1.7 self-check

- **Forward-check:** recommendation complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (pure git, zero API), [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (ADAPT a mature precedent rather than invent a default-branch heuristic), [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) (consumer-facing → the design *improves* portability; both channels derive base the same way), [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) (patch inherits folder authority + scope marker).
- **Backward-check:** complete sweep of every base-resolving surface — `pre-push.ts:51` (resolver), `pre-push.fallback.sh:11` (fallback), `pre-push.ts:297` (stranded §6), `audit-self.yml:291-313` (CI, already correct). All four enumerated; none silently superseded.

## Tags

`#own-stack-blind-spot` `#pattern-matching-on-name` `#negative-existence-claim` `#consumer-facing-default-not-portable`
