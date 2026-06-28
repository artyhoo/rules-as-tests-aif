# plan-currency-reconcile — DONE
- Final PR: #792
- Closed: 2026-06-28
- Summary: Plan-docs reconciled to git-truth — trackers/ACTION-PLAN/README no longer lie about status; every flip git-backed + works-verified (not just file-existence).

## Stage outcomes
- **S1** (host, no PR) — reconcile table `S1-RECONCILE-2026-06-28.md` (operator notes); 12 rows, gate §7 PASS. Deeper L2 works-verify (operator-requested): all flips functional, not just present.
- **S2** (host, no PR) — applied to 4 operator-notes trackers (СЛЕДУЮЩИЕ-РАБОТЫ / plans-check / roadmap-state / ACTION-PLAN); §7 license gate PASS (0 Apache-on-place / CLA-under-Apache).
- **S3** (#792) — README documents 4 installer stacks (was 2); Proprietary=0, FSL badge, mutation-overclaim already clean on staging.
- **S4** (#789) — skepticism audit of migration-ast / plugin #673 / generator.

## Headline corrections (tracker said «not done» → git said «done & works»)
- Generator forbid-MVP **on `main`** (post-FSL promote) + synth **wired to install** (`setup.d/99-finalize.sh`) — plans-check §4 stale.
- T1 FSL **done** (LICENSE.md 105-line full text + badge, main/staging).
- install.sh modularization **I0-I3 done** (#719; 404 LOC + setup.d/ 10 layers) — was «monolith 1585 lines, not started».
- principle count `25/23` → `30/28` (main).
- react-spa shipped (RuleTester) / react-native skeleton (U16 precondition confirmed real).

## Spun off (T5 — not fixed here)
- **plugin-loadability** umbrella (#791) — plugin #673 payload is on main (18 files) but does NOT load: manifest misplaced + broken agent YAML; principle-24 self-test misses both (T14 presence-theatre). Separate fix umbrella (P1 manifest + P2 frontmatter + P3 strengthen principle-24). Dispatchable via `/pipeline plugin-loadability`.

## Carve-outs (not this umbrella)
- Stale `plug-packaging` branch (113 behind staging, still «Proprietary») — resolved by rebase, not a public-README issue.
- `plan-currency-check` test de-bitrot (`fix/plan-currency-check-tests`) — separate concern (§9).
- install e2e-enforcement known-partial (REDUCED mode without deps; `f17` RED on Node 22) — accurately tracked, not a stale claim.
