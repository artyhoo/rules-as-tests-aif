<!-- scope:n7-dogfood-companions -->
# Research-patch — N7 dogfood-companions process-layer adoption plan (DECISION=C, axis B)

> **Inherits authority from** [research-patches/README.md](README.md) folder-level Authoritative-for header. Scope-bound to: Wave **N7** of [2026-05-21-niche-strategy-and-growth-roadmap.md §4](2026-05-21-niche-strategy-and-growth-roadmap.md) — per-artefact adopt/reference verdicts for dogfooding companion process-layer tooling in *our own development*, under the maintainer's **DECISION=C**. **NOT authoritative for** project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)); not authoritative for the rule-file edits or SSOT rows it *proposes* — those are maintainer-owned (`.claude/rules/*` + append-only `prior-art-evaluations.md` per [CLAUDE.md Artifact Ownership Contract](../../../CLAUDE.md)) and surfaced for application, not applied here.
> **Date:** 2026-05-22 · **Author session:** Opus 4.7, N7 research (read-only). No rule edited, no SSOT row written, no dependency added. Research deliverable only.

---

## §1 — Goal + decision context

N7 (roadmap §4): «arm up with allies» — dogfood companion process-layer tooling in our own dev instead of maintaining homegrown equivalents, **without** coupling the enforcement substrate to any vendor.

**DECISION=C is set** (maintainer, 2026-05-21; verified [2026-05-21-n2-adopt-from-superpowers.md:13](2026-05-21-n2-adopt-from-superpowers.md)): «companion» = both on separate layers — enforcement substrate stays **dependency-free / never coupled** (axis A); process / dev-workflow layer **dogfoods** companions (axis B). N7 = the **axis-B** work only. N2 (sibling patch) covered axis-A vocabulary/idea alignment; N7 is the *use-them-in-our-dev* half.

The stale `DECISION-NEEDED` banner in roadmap §4.4 / §4 (lines ~95) predates the decision and should be reconciled to «DECISION=C set» — surfaced as a follow-up, not edited here (roadmap is operational/maintainer-owned).

## §2 — Inventory: companion process-layer artefacts dogfoodable in our dev

Companion = **Superpowers** (`obra/superpowers`), the named today-companion ([README.md:8/72/78](../../../README.md)). Research method (BFR-default §3): DeepWiki `obra/superpowers` ×3 phrasings + WebSearch ×3 phrasings (2026-05-22). context7 deliberately excluded (library-API surface, not «does framework X have pattern Y» — [build-first-reuse-default.md §3 caveat](../../../.claude/rules/build-first-reuse-default.md)).

| # | Superpowers artefact | Our homegrown equivalent | T16 problem-class match? | N7 verdict |
|---|---|---|---|---|
| 1 | `subagent-driven-development` (SDD) skill — coordinator dispatches fresh per-task subagents; two-stage review (spec → code-quality); no npm deps; cross-harness | `~/.claude/skills/orchestrator/SKILL.md` Mode A/B + Phase -1 reviewer + queue mode | **YES** — same coordinator/worker/reviewer lifecycle, same fresh-context-per-task rationale | **ADOPT (process layer)** — install globally; keep unique orchestrator content |
| 2 | `using-git-worktrees` skill — env detection (`GIT_DIR` vs `GIT_COMMON`), native-harness-first creation, `.worktrees/` gitignore safety, baseline-test verify; **`isolation:"worktree"`-aware** (skips creation if already isolated) | [`.claude/rules/parallel-subwave-isolation.md`](../../../.claude/rules/parallel-subwave-isolation.md) (Class C) + orchestrator worktree sections | **YES** — identical `.git/index`-race-avoidance problem (incident 2026-05-12) | **ADOPT (process layer)** + REFERENCE in the rule |
| 3 | SDD prompt templates (`implementer`/`spec-reviewer`/`code-quality-reviewer`) | orchestrator Phase 3 prompt template + Phase -1 checklist | YES (shape); ours carry project-specific VERIFY/commit conventions | **REFERENCE + KEEP-NARROW** |
| 4 | «1% Rule» (invoke skill on slight applicability) | skill frontmatter `when_to_use` | PARTIAL (their problem = under-invocation; ours = trigger precision) | ADAPT-candidate — **N2 surface, not N7** (§13.35) |
| 5 | brainstorming / writing-plans skills (heavy design-gate then task breakdown) | orchestrator Phase 1/2 (lightweight batch table) | PARTIAL (heavier-weight) | **REFERENCE** — precedent for large umbrellas |

**Critical compatibility finding (T13 — don't treat ADOPTED as zero-work):** `using-git-worktrees` Step 0 detects `GIT_DIR != GIT_COMMON` — i.e. when Claude Code `isolation:"worktree"` is already active — and **skips** worktree creation rather than nesting. This means it is compatible with our existing orchestrator Mode-A inline-Agent dispatch; verified via DeepWiki, not assumed from name (T16 countermeasure).

## §3 — Substrate-purity boundary (the load-bearing line)

**Axis A — NEVER couple** (the enforcement substrate that installs into / runs in consumer codebases):

- `packages/**` (ESLint rules, principle tests, audit scripts, hook TS, registry, pre-push logic)
- `.github/workflows/**` (CI gates)
- `agents/*.md` (AI-agnostic sub-agent prompts shipped to consumers)
- `.claude/hooks/*.sh`, `install.sh`, `setup.sh`

**Why load-bearing:** SDD's own *testing* requires headless `claude` (DeepWiki-verified) — a direct N0-storm trigger (after 2026-06-15 headless `claude` bills the Agent-SDK credit pool). Coupling it into CI/hooks would violate [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) **and** forfeit the AI-agnosticism the N0 storm proved load-bearing ([build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md), [README.md §What must not break](../../../README.md)).

**Coupling-prohibition guard (deterministic, no LLM):**

```bash
grep -E '"obra/superpowers"|"superpowers"' package.json                        # must return nothing
grep -rn 'obra/superpowers\|superpowers:using-git' install.sh setup.sh .github/workflows/  # must return nothing
```

**Axis B — safe to dogfood:** install Superpowers skills into the **maintainer's own `~/.claude/skills/`** (global, not project-local, not shipped via `install.sh`); use SDD + `using-git-worktrees` when developing *this* project; reference them from gitignored `.claude/orchestrator-prompts/**`.

## §4 — Adoption steps (ordered, cheap-first; maintainer-owned actions surfaced)

1. **Install Superpowers globally** (~5 min, zero repo change, C-guard stays satisfied): `claude plugin add obra/superpowers` (Anthropic marketplace, WebSearch-confirmed) — or `npx skills add https://github.com/obra/superpowers --skill subagent-driven-development` + `--skill using-git-worktrees`. Verify: `ls ~/.claude/skills/`.
2. **Demote [`parallel-subwave-isolation.md §4`](../../../.claude/rules/parallel-subwave-isolation.md) promotion ambition** → REFERENCE `using-git-worktrees` as mature upstream (alongside aif-handoff Git-Isolation, SSOT #27); drop the AST-detection build-target. Maintainer-owned `.claude/rules/*` edit; carries its own §1.7 when authored.
3. **Annotate orchestrator skill worktree section** with the SDD/`using-git-worktrees` trigger note (global skill, maintainer-owned). Vocabulary table already aligned (N2).
4. **Append SSOT #60/#61** (proposed in §6; maintainer-owned append after step 5).
5. **Empirical trial (T13 — mandatory before declaring N7 done):** dogfood SDD + `using-git-worktrees` on one real umbrella in this repo. Record: does Step 0 detect active `isolation:"worktree"`? does the two-stage review match Phase -1 quality? does orchestrator-unique content (quota monitoring, Mode B, commit format) integrate or conflict? Output: one empirical paragraph confirming or flagging.
6. **Orchestrator-skill retention decision** (after trial): **(A) coexist** — keep orchestrator for its unique meta-orchestration (quota zones, Mode B file-prompts, Phase -1 double-Opus, commit/PR format) + use SDD for task dispatch [recommended — different problem class: SDD = task execution, orchestrator = umbrella+quota+mode-selection]; **(B) slim** orchestrator to meta-only, SDD owns worker/reviewer dispatch; **(C) replace** [not recommended — orchestrator has 800+ lines of project-specific protocol with no SDD equivalent]. Maintainer strategy call per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) — surfaced, not decided here.

## §5 — N0 overlap (process-layer dogfooding ⊇ storm-migration)

The 2026-06-15 billing change moves `claude -p` / Agent-SDK / CC-Actions to a separate credit pool (API rates). N7 **reduces** N0 exposure: SDD dispatches via Claude Code's **native Agent tool + `isolation:"worktree"`** (interactive subscription pool), not via `claude -p` headless calls. `using-git-worktrees` is pure git, no `claude -p`. Moving dev dispatch from homegrown Mode-B-file-prompt-+-manual-`claude -p` toward SDD inline dispatch shifts load off the Agent-SDK billing pool. **Residual N0 risk:** any remaining Mode-B-via-separate-window dispatch still bills the credit pool after June 15 — communicate cost model (≈1 API call per `claude -p` invocation) and plan dispatch volume. Reinforces the existing orchestrator default (Mode A primary, Mode B explicit-justification-only).

## §6 — Proposed SSOT rows (surfaced for maintainer application after §4 step 5; NOT written here)

> Per the N2-sibling precedent, rows are proposed in-text, not appended to the append-only register (avoids premature ID claim + parallel-session conflict). Apply after the empirical trial confirms ADOPT.

- **#60 (proposed) — Superpowers `subagent-driven-development` skill** · matched: process-layer subagent orchestration in our own dev (mirrors Mode A + Phase -1 reviewer) · **ADOPT** (process layer only) · T16 match: YES (coordinator dispatches fresh isolated subagents per task with review). Scope boundary: `~/.claude/skills/` global; the C-guard (§3) must stay green. Distinct from SSOT #55 (TDD-for-Skills = ADAPT into our *principle tests* = substrate). Trigger to revisit: SDD ships a breaking dispatcher-contract change, OR §4-step-5 trial surfaces Phase -1 incompatibility.
- **#61 (proposed) — Superpowers `using-git-worktrees` skill** · matched: process-layer worktree isolation in our own dev; CC-`isolation:"worktree"`-aware · **ADOPT** (process layer) + REFERENCE in `parallel-subwave-isolation.md §4` · T16 match: YES (`.git/index`-race avoidance). Stacks as second precedent alongside aif-handoff Git-Isolation (SSOT #27). Trigger to revisit: worktree-detection becomes CC-incompatible, OR the rule's promotion criterion (3 incidents/6mo) fires.
- **#27 (update)** — note `using-git-worktrees` (#61) now stacks as a second worktree-isolation precedent.

## §7 — §1.7 self-reflexive note

- **Forward-check:** complies with [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) (DeepWiki ×3 + WebSearch ×3 run before verdicts; evidence cited), [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (substrate purity boundary §3; SDD's headless dep kept out of CI), [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) (inherits folder header; subordinates to README), [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) (step-6 retention = surfaced options, not picked).
- **Backward-check:** N7 adoptions touch three existing artefacts — `parallel-subwave-isolation.md §4` (scope-reducing demotion, no new obligation on other files), orchestrator skill (additive note), `package.json` (the C-guard means **no** dep added → no backward sweep owed). No artefact silently superseded.
- **T-traps applied:** T11 (prior-art ×3+×3 before verdict), T13 (Step-5 empirical trial mandated; SDD headless-dep flagged; `isolation` compat verified not assumed), T16 (problem-class match column explicit per artefact), T3 (file:line / DeepWiki / WebSearch URL per claim), T15 (this patch is read-only; mutations surfaced as maintainer-owned).
- **INCONCLUSIVE (honest residuals):** (a) whether `using-git-worktrees` Step 4 baseline-test conflicts with this repo's Stryker runs — Step-5 trial catches; (b) whether SDD v5.0.1–5.0.7 made the two-stage review inline vs separate-subagent — needs reading the shipped v5.x SKILL.md; (c) exact global install dir (`claude plugin add` vs `npx skills add`) may vary by CC version.

## §8 — See also

- [2026-05-21-niche-strategy-and-growth-roadmap.md §4 Wave N7](2026-05-21-niche-strategy-and-growth-roadmap.md) — parent roadmap.
- [2026-05-21-n2-adopt-from-superpowers.md](2026-05-21-n2-adopt-from-superpowers.md) — axis-A sibling (vocabulary/idea alignment under DECISION=C).
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — the rule this patch operationalises at process scale.
- [.claude/rules/parallel-subwave-isolation.md](../../../.claude/rules/parallel-subwave-isolation.md) — the homegrown rule `using-git-worktrees` references/complements.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT register (#60/#61 proposed in §6).
