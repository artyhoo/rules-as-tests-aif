<!-- scope:dn4-round3-tail-codification -->
# DN-4 round 3 (tail) — worktree-setup + research-priority codification + final disposition

> **Scope:** §1.7 self-review for the change codifying DN-4 gaps #29 (`worktree_node_modules_symlink` → CONTRIBUTING.md) and #30 (`ai_doc_research_priority_pool` → [`phase-research-coverage.md` §1.13](../../../.claude/rules/phase-research-coverage.md)), plus the honest disposition of the 4 non-codifiable tail gaps (#18/#19 reference-facts, #21 thesis-level, #24 out-of-repo) in the [tracker](../meta-factory/memory-codification-gap-tracker.md). Inherits folder authority from [research-patches/README.md](README.md); NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
>
> **Origin:** DN-4 autonomous sweep round 3, 2026-05-22 (`/orchestrator`; after [round 1](2026-05-22-dn4-verify-before-claim-codification.md) §1.11 and [round 2](2026-05-22-dn4-round2-codification.md) §1.12 + T17-T19). Completes the sweep — every one of the 15 stage-0 gaps is now codified or has a noted disposition.

## §1 What changed

- **CONTRIBUTING.md «Working in a git worktree»** (#29) — symlink the main checkout's `node_modules` (root + `packages/core`) into a fresh worktree so `tsx` pre-push hooks resolve; no `--no-verify` bypass.
- **`phase-research-coverage.md` §1.13** (#30) — AI-doc research source priority: start the candidate sweep with Tier-1 cutting-edge sources (Claude Code, AIF, OhMyOpencode) before evergreen best-practices pages; refines (does not relax) §1.1-§1.5.
- **Tracker** — #29/#30 → CODIFIED; #18/#19 → DEFERRED (reference-facts); #21 → DEFERRED (thesis-level, needs dedicated research-patch); #24 → OUT-OF-REPO (global orchestrator skill). Progress line added.

## §2 Channel-selection rationale

- #29 is a **dev-env setup fact** relevant *when creating a worktree* — narrowest reliable channel = CONTRIBUTING.md «Local setup» (read at setup time), NOT always-on. Correct per [channel-selection §3](../../../.claude/rules/rule-enforcement-channel-selection.md).
- #30 is **research discipline** → folds into the already-always-on `phase-research-coverage.md` §1 (no new file, no `#always-on-bloat`).
- #18/#19/#21/#24 are *not folded*: #18/#19 are reference-facts not behavioural rules (codify-everything would bloat); #21 is thesis-level (needs its own research-patch + §13.34 widening); #24's home is out-of-repo. Honest disposition > theatrical codification (avoids `#codify-everything`).

## §3 §1.7 self-review (T7 walk)

### §1.7 Forward-check applied

- **no-paid-LLM-in-CI**: zero LLM calls. ✔
- **doc-authority**: §1.13 added to a headered rule; CONTRIBUTING.md is authoritative for «contributor workflow — local setup» (the worktree note fits that scope, [CONTRIBUTING.md:3](../../../CONTRIBUTING.md)); patch inherits folder authority. ✔
- **channel-selection / build-first-reuse**: §2 records the per-gap channel verdict. ✔
- **memory-codification §3**: the codify step for #29/#30; #18/#19/#21/#24 dispositioned (not silently left bare-PENDING). ✔
- **capability-commit gate**: no dependency, no ≥80-LOC file → escape-hatch trailer. ✔

### §1.7 Backward-check applied

- §1.13 refines §1.1-§1.5 without relaxing the ≥3-phrasing / 6-item checklist (explicitly stated). The CONTRIBUTING worktree note does not contradict the existing «Local setup» / «What if you must bypass» sections — it reinforces «no `--no-verify`». Evidence: `phase-research-coverage.md` §1.13, `CONTRIBUTING.md` «Working in a git worktree».
- Tracker now has zero bare-PENDING rows; the progress line reconciles 11 CODIFIED / 3 DEFERRED / 1 OUT-OF-REPO against the 15-gap population.

### Would it have caught the motivating gap?

#29 fires on the exact incident hit 3× this very session (worktree pushes failing on missing `node_modules` until symlinked). #30 fires on AI-doc research that would otherwise start from evergreen Anthropic pages and miss the frontier. ✔

## §4 Residuals / DN-4 sweep closure

DN-4 is **swept**: 11/15 codified into repo channels, 4 dispositioned with reasons. Re-codification of #18/#19/#21/#24 is opportunistic on-touch per the tracker's design — #21 in particular warrants a dedicated future research-patch (it is the recursive-thesis convention, one layer up from this very project).
