<!-- scope:doc-audit-delta-post-fqa -->

# 2026-07-02 — Doc-audit delta (post-FQA) + closure verification of June audits

> Session context: Cowork maintainer session, branch `plug-packaging`, working tree clean. Read-only audit — findings only, no fixes applied (maintainer GO required per reviewer-discipline). Method: 3 parallel read-only subagents (closure-verify / delta-sweep / goal-alignment) + orchestrator re-verification of every BLOCKER-class claim before recording (T19).

## §0 Verdict (one screen)

- **All 4 June audits verified CLOSED, zero regressions** — ai-doc-audit (#422), goal-drift-audit (#433), doc-audit-ship-boundary (#374), final-quality-audit (#470). Every fix ID re-checked with file:line evidence (§1).
- **Goal alignment: CLEAN.** README / CLAUDE.md / session-bootstrap / EXECUTION-PLAN §1 all defer goal to `README.md#why-this-exists`; `#operational-doc-redefines-goal` sweep found only guard-text and historical references. CLAUDE.md operational claims: 100% current (§3).
- **2 real findings** in the post-FQA delta, both in the same gap-class: new `.claude/skills/*/SKILL.md` land without Authoritative-for headers AND principle 09's static allowlist doesn't see them → the rule exists but its executable artifact silently doesn't cover the new surface (§2, F1/F2). This is the project's own thesis-violation shape.
- 2 of 3 subagent-reported BLOCKERs were false positives, downgraded on re-verification (§2, FP-log).

## §1 Prior-audit closure verification (no regressions)

| Fix ID (FQA S2 §2) | Status | Evidence |
|---|---|---|
| W1 eslint barrel | CLOSED | `install.sh:960-991` generates `eslint-rules-local/index.ts` |
| P1 tool-decisions seed | CLOSED | `install.sh:782-788`; paired-negative live `tests/install-sh/c1-wiring.test.sh:44-46` |
| W2 dep-cruiser copy | CLOSED | `install.sh:1003,1015` |
| W3 audit-r4.ts shipped | CLOSED | `install.sh:584,822` |
| W4/W5 npm scripts | CLOSED | `install.sh:1304-1312` (validate / arch:check / test:mutation) |
| P2 skill-context 3/3 | CLOSED | `install.sh:111-131` (aif-orchestrator-discipline at :122) |
| P3 tool-bootstrapping currency | CLOSED | `skills/tool-bootstrapping/SKILL.md:51-53` (context7 re-documented) |
| F1(D) principle-15 git-aware | CLOSED | `15-skill-paired-negative.test.ts:120-145` (`git ls-files` filter) |
| F2-FIX / F3(D) orphan deletion | CLOSED | `.claude/skills/meta-orchestrator/`, `probe-cc-perm/` absent (glob) |
| F1-F6(C) doc currency | CLOSED | README badges → staging (`README.md:4-6`); `apply-doc-fixes.test.ts:93-100` |
| ship-boundary DN-1/DN-2/G4 | CLOSED | "Activation pending" absent repo-wide; no mutation job in `.github/workflows/` |
| goal-drift #433 criteria 3&4 | CLOSED | `09-doc-authority-hierarchy.test.ts:57-66` (anti-tautology mutations) |

`tests/install-sh/c1-wiring.test.sh` present with 12+ assertions incl. P1-neg/P1-pos — the de-inertness chain is live, not prose.

## §2 Delta findings (2026-06-13 → 2026-07-02)

Population (T10): 358 md files touched since 2026-06-13 (git log --since, branch `plug-packaging` incl. staging merges). Checked: 18 PRIORITY-A (rules/root/SKILL.md/meta-factory ops) at 100%, 18/172 kickoffs sampled, 2/16 research-patches spot-checked. Not checked: §5.

### F1 — MAJOR `#missing-authority-header`: 2 of 8 project-internal skills lack Authoritative-for header

- `.claude/skills/story/SKILL.md` (landed #592, post-FQA) — YAML frontmatter only, no `> **Authoritative for:**` blockquote.
- `.claude/skills/ai-doc/SKILL.md` — same shape.
- The other 6 (`aif-doctor`, `dispatcher`, `pipeline`, `self-reflection`, `template-audit`, `tool-bootstrapping`) all carry headers (verified by grep loop over `.claude/skills/*/SKILL.md`).
- Rule basis: `doc-authority-hierarchy.md §2` requires headers for skill primary docs.

### F2 — MAJOR (systemic, the load-bearing finding): principle 09 static allowlist doesn't cover 7/8 internal skills → new skills bypass the gate silently

- `packages/core/principles/09-doc-authority-hierarchy.ts:84-86`: the `.claude/skills/` section of `REQUIRED_HEADER_DOCS` lists **only** `tool-bootstrapping` (SKILL.md + 1 reference). No dynamic enumeration exists (`:130-131` classifies a given path as listed-or-exempt; nothing sweeps the actual skills dir).
- Consequence observed in the wild: `/story` shipped 2026-06 headerless and principle 09 stayed green. Exactly the failure-class the project exists to prevent — rule present, executable artifact blind to the new surface.
- Proposal (I-phase, maintainer GO): make principle 09 enumerate `.claude/skills/*/SKILL.md` dynamically (readdir ∪ static list), mirroring the principle-15 `git ls-files` pattern (`15-skill-paired-negative.test.ts:120-145`) so installer-populated clones don't false-RED. Add headers to `story` + `ai-doc` in the same PR (paired: gate + conformance).

### F3 — MINOR (historical): `dispatcher-ux/kickoff.md` lacks the literal ai-laziness-traps.md citation

- `.claude/orchestrator-prompts/dispatcher-ux/kickoff.md:55-57` enumerates T3/T15/T16/T19/T20 + 2 domain traps (T-DUX-A/B) — the substance of `ai-laziness-traps.md §3` reqs 2-3 is present; only req 1 (explicit rule link) is absent. Umbrella closed 2026-06-03 (#407); file entered repo via back-catalog migration #523. Principle 12 green. Informational; fix optional at next touch.

### FP-log (downgraded on re-verification — recorded so future audits don't re-flag)

- **651-line kickoff ≠ violation:** `.claude/orchestrator-prompts/aif-handoff-runtime-bridge-iphase/kickoff.md:3` carries the explicit `transient artifact` 600-line-gate exemption marker (cross-session-kickoff-portability, SSOT #116); the pre-commit gate honors it (`.husky/pre-commit:55-70`).
- **dispatcher-ux "no traps cited" ≠ BLOCKER:** see F3 — subagent grepped for the literal string only; T-enumeration is present at `:55-57`.

## §3 Goal-alignment + CLAUDE.md currency (CLEAN)

- README `§Why this exists` = sole goal owner; methodology explicitly "quality signal, not the goal". CLAUDE.md (:14-16), `.claude/session-bootstrap.md` (:9-15), EXECUTION-PLAN.md §1 (pointer block) all subordinate correctly — quotes verified.
- Sweep `north star|central thesis|main goal|главная цель` over operational surfaces: hits only in CLAUDE.md:16 (preventive directive), CLAUDE.md:87 + EXECUTION-PLAN §1 (incident history), audit-fixes README:31 (methodology description). Research-patches/retros excluded as append-only history.
- CLAUDE.md operational claims spot-verified 12/12: referenced files exist; capability-commit thresholds (50/80 LOC) and package.json regex match `packages/core/hooks/checks/prior-art.ts:80,99-123`; Artifact Ownership Contract paths 10/10 exist.
- `.claude/rules/*.md`: all carry `> **Class:**` line; cross-links between rules resolve.

## §4 Self-application (T15)

This patch: research-patches folder-level authority (no per-file header needed, scope marker present); <600 lines; every finding carries file:line; clean-vs-not-checked distinguished per T14; all subagent BLOCKER claims independently re-verified before recording (T19) — 2/3 fell. Sampling caveat: kickoff back-catalog sampled at ~10% (18/172), so F3-class findings in unsampled kickoffs are *not excluded* — coverage-limited, not clean (T14).

## §5 Not checked

- 152 PRIORITY-D files (done.md markers, pipeline eval data, templates, fixtures) — out of doc-authority scope or derivative.
- Principle-test CI run (node_modules absent in audit sandbox; no `npm install` per economy).
- Global `~/.claude` skills (outside repo), consumer-side installed-header state (principle 09 M1 scope).
- 154/172 kickoffs (sampling floor met, not census).

## §6 Proposed next actions (superseded by §7 — fixes applied same-day)

1. ~~**F1+F2 paired PR**~~ → applied, see §7.
2. ~~F3 citation fix~~ → applied, see §7.
3. Re-run this delta-audit after the react-spa/react-native preset umbrellas (#655/#656) merge — they add consumer-facing doc surface (`packages/preset-*`), which is REQUIRED_HEADER_DOCS territory. **Still open.**

## §7 Applied closure (2026-07-02, same session, maintainer GO «закрой все гэпы»)

TDD sequence: dynamic gate extended FIRST → observed RED with exactly the predicted violation set → headers added → GREEN 30/30.

- **F2 (gate):** `packages/core/principles/09-doc-authority-hierarchy.ts` — added `REQUIRED_PATH_PATTERNS`, `matchesRequiredPattern`, `enumerateSkillPrimaryDocs` (git-aware via `git ls-files`, filesystem fallback, mirrors principle-15 F1(D) pattern); `selectRequiredPaths` now keeps dynamic skill docs → **edit-time channel** (PostToolUse shim) catches headerless skill docs, not just CI. Test: new describe block `dynamic skill-doc enumeration` (7 tests: full-set check, non-vacuity, static⊆dynamic consistency, pattern positive/negative arms, edit-time filter mutation, anchoring sentinel).
- **F1 (conformance) — wider than the audit's sample:** dynamic RED surfaced **6** headerless docs, not 2 (the audit's own agent checked SKILL.md only — references/*.md were also in-scope per rule §2). Headers added: `.claude/skills/story/SKILL.md`, `.claude/skills/ai-doc/SKILL.md`, `.claude/skills/pipeline/references/plain-language-tail.md`, `.claude/skills/self-reflection/references/{forward,backward}-checklist.md`, `.claude/skills/self-reflection/references/anti-patterns-with-examples.md` (the last three upgraded from the informal `> **Scope:**` marker to the §3 format the gate actually checks).
- **F3:** dispatcher-ux kickoff Traps line now cites `ai-laziness-traps.md §2` literally.
- **Rule↔test sync:** `doc-authority-hierarchy.md §2` got a dynamic-enforcement note (both skill roots, origin citation).
- **Recursive self-application, observed live:** principle 10 REJECTED this very patch's first-line scope annotation (free-text ≠ slug) — fixed to `<!-- scope:doc-audit-delta-post-fqa -->`. The framework caught its own auditor.
- **Verification:** principle 09 → 30/30 GREEN; principle 10 → 5/5; principle 11 → 8/8 (needs `--testTimeout` >15s on slow mounts — F1 scan took 10.4s in sandbox; not a code issue); principle 14 → check itself PASS (0 errors), exit-1 only from sandbox `rm` permission on mounted tmp files — environmental, re-verify on host.
- **Not committed** — working tree only, branch `plug-packaging`; recommended: lift into a single-concern PR onto staging (files are disjoint from plugin-packaging scope).

## §8 Ship-time reground (2026-07-02, lifting session)

§7 was implemented and verified against the audit snapshot (branch `plug-packaging`, base ~2026-06-22). Re-grounding against fresh `origin/staging` before lifting the PR (per the reground-at-design-time discipline) found staging had **independently closed part of F1** in the interim:

- DN-M1 (2026-06-27) added Authoritative-for headers to all project-local `.claude/skills/*/SKILL.md` — including `/story` + `/ai-doc` — and extended the principle-09 static list to all 9 internal skills (+ `rule-research`, 2026-06-29). The two SKILL.md headers from §7 therefore did **not** ship; staging's (differently-worded) versions stand.
- All 10 remaining `pipeline/references/*.md` already carry headers on staging.

What actually shipped in the lift PR: the **F2 mechanism fix** (dynamic enumeration, rebased verbatim — still absent on staging, which extended the static list only), the **4 residual reference headers** (3× self-reflection references + pipeline `plain-language-tail.md` — still `Scope:`-style on staging), the F3 kickoff citation (staging line byte-identical to the audit snapshot), the rule §2 note, and this patch. Dynamic coverage at ship time: 33 tracked skill docs; principle 09 → 30/30, principle 10 → 5/5 GREEN on staging + this changeset.

Lesson re-confirmed (`#claim-from-memory-not-source` family): audit findings from a stale base MUST be re-grounded against fresh `origin/staging` at ship time — half of F1's instance-set had already been fixed upstream, and shipping §7's file-set verbatim would have overwritten staging's newer `/story` + `/ai-doc` headers.
