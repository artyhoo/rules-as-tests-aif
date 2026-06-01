<!-- scope:doc-audit-ship-boundary-findings -->
# Doc-audit-ship-boundary findings — 2026-05-31

> **Authoritative for:** audit findings from the doc-audit-ship-boundary run (Stage 2.0 mutation + Stage 2.1 reconciliation). One-time research-patch, append-only.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). Decisions on proposed fixes — those belong to the maintainer.
>
> **Run date:** 2026-05-31 (executed 2026-06-01)  
> **Worker branch:** `feature/doc-audit-ship-boundary-meta-launch-bcb2c6`  
> **Plan:** `.ai-factory/plans/doc-audit-ship-boundary-meta-launch.md`  
> **Anti-over-autonomy class (§A):** all goal/doctrine/strategy items are PARKED in §DECISION-NEEDED below.

---

## §Population — full load-bearing doc list (T10 compliance — enumerated before auditing)

**Audit method:** two-axis (reality vs code/git; framing vs README goal), two-layer (L1 deterministic grep/count; L2 AI session-bound semantic).

### Human-audience docs (8 root-level + runtime-bridge-setup)

| # | File | Exists | Auth-header |
|---|---|---|---|
| H1 | `README.md` | ✓ | ✓ |
| H2 | `INSTALL.md` | ✓ | ✓ |
| H3 | `INSTALL-FOR-AI.md` | ✓ | ✓ |
| H4 | `CONTRIBUTING.md` | ✓ | ✓ |
| H5 | `CLAUDE.md` | ✓ | ✓ |
| H6 | `docs/runtime-bridge-setup.md` | ✓ | not checked (operational, not in §2 mandatory list) |
| H7 | `AUDIT-CHECKLIST.md` | ✓ | not checked (not in mandatory list; filename-convention authority applies) |
| H8 | `AUDIT-PROMPT.md` | ✓ | not checked (same) |

### AI-audience docs

| # | File | Exists | Auth-header |
|---|---|---|---|
| A1 | `CLAUDE.md` | ✓ | ✓ |
| A2 | `.claude/session-bootstrap.md` | ✓ | ✓ |
| A3 | `.claude/rules/ai-laziness-traps.md` | ✓ | ✓ (Class A) |
| A4 | `.claude/rules/build-first-reuse-default.md` | ✓ | ✓ (Class A) |
| A5 | `.claude/rules/doc-authority-hierarchy.md` | ✓ | ✓ (Class A) |
| A6 | `.claude/rules/dual-implementation-discipline.md` | ✓ | ✓ (Class C) |
| A7 | `.claude/rules/memory-codification.md` | ✓ | ✓ (Class B) |
| A8 | `.claude/rules/no-paid-llm-in-ci.md` | ✓ | ✓ (Class A) |
| A9 | `.claude/rules/parallel-subwave-isolation.md` | ✓ | ✓ (Class C) |
| A10 | `.claude/rules/phase-research-coverage.md` | ✓ | ✓ (Class A) |
| A11 | `.claude/rules/recommendation-laziness-discipline.md` | ✓ | ✓ (Class C) |
| A12 | `.claude/rules/reviewer-discipline.md` | ✓ | ✓ (Class C) |
| A13 | `.claude/rules/rule-enforcement-channel-selection.md` | ✓ | ✓ (Class B) |
| A14 | `agents/compliance-verifier.md` | ✓ | ✓ |
| A15 | `agents/living-docs-auditor.md` | ✓ | ✓ |
| A16 | `agents/memory-codification-auditor.md` | ✓ | ✓ |
| A17 | `agents/review-sidecar.md` | ✓ | ✓ |
| A18–A47 | `.claude/skills/*/SKILL.md` (30 files) | ✓ (all 30 present) | checked via principle 15 (see §Reconciliation) |

### Load-bearing `docs/meta-factory/*` (Authoritative-for required)

| # | File | Exists | Auth-header |
|---|---|---|---|
| M1 | `docs/meta-factory/EXECUTION-PLAN.md` | ✓ | ✓ |
| M2 | `docs/meta-factory/PROPOSAL.md` | ✓ | ✓ |
| M3 | `docs/meta-factory/prior-art-evaluations.md` | ✓ | ✓ |
| M4 | `docs/meta-factory/roadmap.md` | ✓ | not checked (not in mandatory list) |
| M5–M7 | `docs/meta-factory/project-history-book*.md` | ✓ | not checked |
| M8+ | `docs/meta-factory/research-patches/` | ✓ (135 files) | folder-level authority (README.md in folder) |
| M9+ | `docs/meta-factory/retros/` | ✓ (25 files) | folder-level authority |

### Shipped artefacts (SHIPPED_DOCS per install.sh lines 92-107)

| # | File | Exists | Auth-header |
|---|---|---|---|
| S1 | `packages/core/templates/shared/AGENTS.md.template` | ✓ | ✓ |
| S2 | `packages/core/templates/shared/CLAUDE.md.template` | ✓ | ✓ |
| S3 | `packages/core/templates/shared/DESCRIPTION.template.md` | ✓ | ✓ |
| S4 | `packages/core/templates/shared/ARCHITECTURE.ts-server.md` | ✓ | ✓ |
| S5 | `packages/core/templates/shared/integration-rules.md` | ✓ | ✓ |
| S6 | `packages/preset-next-15-canonical/RULES.md` | ✓ | ✓ |
| S7 | `packages/preset-next-15-canonical/RULES.react-next.md` | ✓ | ✓ |
| S8 | `packages/preset-next-15-canonical/templates/ARCHITECTURE.react-next.md` | ✓ | ✓ |
| S9 | `packages/core/templates/shared/skill-context/aif-review/SKILL.md` | ✓ | ✓ |
| S10 | `packages/core/templates/shared/skill-context/aif-rules-check/SKILL.md` | ✓ | ✓ |
| S11 | `agents/review-sidecar.md` | ✓ | ✓ |
| S12 | `agents/living-docs-auditor.md` | ✓ | ✓ |
| S13 | `agents/compliance-verifier.md` | ✓ | ✓ |
| S14 | `agents/memory-codification-auditor.md` | ✓ | ✓ |
| S15 | `skills/tool-bootstrapping/SKILL.md` | ✓ | ✓ |
| S16 | `skills/tool-bootstrapping/references/decision-format.md` | ✓ | ✓ |

**Command evidence (install.sh SHIPPED_DOCS check):**
```bash
$ for rel in "${shipped_docs[@]}"; do
    grep -q "Authoritative for:" "$root/$rel" && echo "OK: $rel" || echo "HEADER_MISSING: $rel"
  done
# Result: all 16 files → OK
```

### This umbrella's own outputs (T15: self-application)

- `.ai-factory/plans/doc-audit-ship-boundary-meta-launch.md` — the kickoff plan (present, read-only audit artifact)
- **this findings doc** — audited on both axes in §Self-classification below

**Total population:** ~200+ docs enumerated, 62 mandatory-header docs checked, 16 SHIPPED_DOCS verified programmatically.

---

## §Mutation run — Stage 2.0

**Status: TOOLING FALLBACK — full Stryker run could not execute; manual spot-check performed.**

### Stryker attempt

```bash
$ cd packages/core
$ timeout 90 npx stryker run stryker.audit-ai-docs.mjs 2>&1 | tee /tmp/doc-audit-stryker-audit.log
```

**Result:** Stryker crashed immediately after dry-run with:
```
Error: spawn ps ENOENT
```
Container has no `ps` binary. Stryker's concurrency-token lifecycle requires `ps` to manage worker PIDs — not available in this Docker environment.

**universalmutator fallback:** `pip` not installed in container — cannot run universalmutator.

**Base test suite state (vitest run, 2026-06-01 21:36):**
```
Test Files: 13 failed | 73 passed | 10 skipped (96)
Tests:      32 failed | 1029 passed | 101 skipped (1162)
```

**jq availability:** `command -v jq` returns nothing — `jq` absent. As a result all `end-of-turn-reminder.test.ts` tests (21), `check-doc-authority.test.ts` (8), `check-hook-marker.test.ts` (7), `check-kickoff-traps.test.ts` (10) are skipped at runtime.

### Manual spot-check (plan §2.0 fallback: top 3 hooks)

Three operator-mutation checks on TypeScript hook source files whose tests DO run:

| # | File | Mutation | Test cmd | Result |
|---|---|---|---|---|
| M1 | `packages/core/hooks/utils/run-check.ts:63` | `\|\|` → `&&` in `timedOut` expression | `npx vitest run packages/core/hooks/utils/run-check.test.ts` | **2 tests FAIL** — catch confirmed |
| M2 | `packages/core/hooks/checks/s17.ts:19` | `ALLOWLIST_RE` constant corrupted | `npx vitest run packages/core/hooks/checks/s17.test.ts` | **1 test FAIL** — catch confirmed |
| M3 | `packages/core/hooks/checks/prior-art.ts:81` | `!removed.has(key)` → `removed.has(key)` | `npx vitest run packages/core/hooks/checks/prior-art.test.ts` | **20 tests FAIL** — catch confirmed |

All three mutations were reverted after spot-check.

**Coverage caveat (T6/T14):** 3/N surfaces verified (N = total hook LOC). Full mutation score unknown — Stryker could not run. Spot-check covers ONLY the TypeScript modules under `hooks/checks/` and `hooks/utils/` whose tests run without jq. Shell-based hooks (.claude/hooks/*.sh) have NO running tests in this environment (jq absent → all skip). The 21-skip `end-of-turn-reminder.test.ts` is particularly significant given the plan's mention of 29 branches. Conclusion: **insufficient coverage to declare hook suite mutation-resistant**; theatre-suspect list is inconclusive.

---

## §Reconciliation — Layer 1 and Layer 2 findings

### L1-F1: STALE — `rule-enforcement-channel-selection.md` Class header says "Activation pending"

**Axis:** reality vs code (`.claude/settings.json`).  
**Claim:** `.claude/rules/rule-enforcement-channel-selection.md:10` — `> **Class:** B … **Activation pending** one settings.json PostToolUse Edit|Write entry (maintainer-landed — settings.json is agent-self-protected)`

**Evidence:**
```bash
$ grep "inject-matching-rule" .claude/settings.json
# line 114: "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/inject-matching-rule.sh\""
$ sed -n '109,118p' .claude/settings.json
# PostToolUse / Edit|Write matcher present → hook IS wired
```

**Verdict:** STALE. The "Activation pending" text is outdated — the hook was already wired. The Class B header needs a one-line update removing "Activation pending" and confirming activation.

**Proposed diff (in DECISION-NEEDED — maintainer-owned doc):** see DN-1 below.

---

### L1-F2: STALE — README.md CI badges reference `branch=main` but remote HEAD is `staging`

**Axis:** reality vs code (git remote).  
**Claim:** `README.md:4-6` — CI badges use `?branch=main` query parameter.

**Evidence:**
```bash
$ head -6 README.md | grep badge
# badges: discipline-self-check.yml?branch=main, audit-self.yml?branch=main, workflow-integrity.yml?branch=main
$ git remote show origin | grep "HEAD branch"
# HEAD branch: staging
```

**Verdict:** STALE. GitHub CI badges pointing to `branch=main` will show the wrong status when the default branch is `staging`. Green main badges may be out-of-date if most CI runs on staging PRs. This is a cosmetic/trust issue rather than a policy lie.

**Proposed diff:** see DN-2 below.

---

### L1-F3: HOLDS — All Class A companion principle tests exist on disk

**Axis:** reality vs code.  
**Evidence:**
```bash
$ for f in .claude/rules/*.md; do
    pts=$(grep -oP '(?<=\[packages/core/principles/)[^]]+(?=\.test\.ts\])' "$f" 2>/dev/null)
    for pt in $pts; do
      ls packages/core/principles/${pt}.test.ts && echo "OK: $pt" || echo "MISSING: $pt"
    done
  done
# Results: ai-laziness-traps → 12 OK; build-first-reuse-default → 11 OK;
#          doc-authority-hierarchy → 09 OK; no-paid-llm-in-ci → 17 OK;
#          phase-research-coverage → 13 OK
```

**Verdict:** HOLDS. All 5 cited companion principle tests exist.

---

### L1-F4: HOLDS — All 16 SHIPPED_DOCS exist and carry Authoritative-for headers

**Axis:** reality vs install.sh SHIPPED_DOCS array.  
**Evidence:** loop above — all 16 files: OK.  
**Verdict:** HOLDS.

---

### L1-F5: HOLDS — No paid LLM in CI workflows

**Axis:** reality vs code (`.github/workflows/`).  
**Evidence:**
```bash
$ grep -rn "ANTHROPIC_API_KEY\|OPENAI_API_KEY\|anthropic\|openai\|npx claude" .github/workflows/*.yml
# Only hit: framework-self-template-render.yml:4 "# Decision 3: NO LLM, NO API key..."
# (a comment, not an actual call)
$ npx vitest run packages/core/principles/17-no-paid-llm-in-ci.test.ts
# Test Files: 1 passed | Tests: 7 passed
```

**Verdict:** HOLDS. Principle 17 CI gate passing; no paid API calls in workflows.

---

### L1-F6: HOLDS — Enforcement channel chain has real artifacts at each layer

**Axis:** reality vs code.  
**Evidence (edit-time):** `packages/core/eslint-rules/` has 3 custom rules (no-direct-time-randomness, no-unsafe-zod-parse, require-otel-span) + index.ts.  
**Evidence (pre-commit):** `.husky/pre-commit` runs bash-n, json.load, yaml.safe_load, markdownlint. CONTRIBUTING.md table matches.  
**Evidence (pre-push):** `.husky/pre-push` dispatches to `packages/core/hooks/pre-push.ts` (TS-core) with Node ≥20 check. Prior-art + §1.7 checks present in TS hook.  
**Evidence (CI):** `.github/workflows/` has audit-self.yml, discipline-self-check.yml, workflow-integrity.yml.  
**Evidence (production audit):** `packages/core/audit-self/audit-ai-docs.sh` exists.  
**Verdict:** HOLDS. Each stated channel has at least one real artifact.

---

### L1-F7: HOLDS — `make install-hooks` target exists

**Axis:** reality vs CONTRIBUTING.md:11 claim.  
**Evidence:**
```bash
$ grep "install-hooks" Makefile
# line 14: install-hooks: (target present)
```

**Verdict:** HOLDS.

---

### L1-F8: HOLDS — Authoritative-for headers in required docs

**Axis:** doc-authority-hierarchy.md §2 requirements.  
**Evidence:**
```bash
$ for f in README.md CLAUDE.md CONTRIBUTING.md INSTALL.md INSTALL-FOR-AI.md .claude/session-bootstrap.md docs/meta-factory/EXECUTION-PLAN.md docs/meta-factory/PROPOSAL.md docs/meta-factory/prior-art-evaluations.md; do
    grep -q "Authoritative for:" "$f" && echo "OK: $f" || echo "MISSING: $f"
  done
# All: OK
```

**Verdict:** HOLDS.

---

### L1-F9: HOLDS — detector-v0 is deprecated (maintenance-only)

**Axis:** reality vs claim in detect-applicable-rules.ts.  
**Evidence:**
```bash
$ head -7 packages/core/detector-v0/detect-applicable-rules.ts
# @deprecated Phase 5 entry: detector-v0 is in maintenance-only mode. Consumers should migrate to v1...
```

**Verdict:** HOLDS. The deprecation declaration matches the known project state. detector-v1 at `packages/core/detector/` is the current version.

---

### L2-F1: HOLDS — session-bootstrap.md goal restatement matches README goal

**Axis:** framing vs README goal.  
**Evidence:** `session-bootstrap.md:16` — "AI agents can't silently bypass undocumented conventions. Every rule is an executable artifact that fails at the earliest reachable channel — edit-time → pre-commit → pre-push → CI → production audit. **CI = last-resort gate.**"  
**README.md:49-50** (paraphrase): same claim.  
**Verdict:** HOLDS. No goal drift in session-bootstrap.md.

---

### L2-F2: HOLDS — CLAUDE.md does not redefine goal; correctly subordinates to README

**Axis:** framing vs README goal, anti-pattern `#operational-doc-redefines-goal`.  
**Evidence:** CLAUDE.md contains `> **NOT authoritative for:** project goal — see [README.md#why-this-exists](README.md#why-this-exists).` Goal pointer is explicit. No «north star», «main goal», or «central thesis» language in CLAUDE.md.  
**Verdict:** HOLDS.

---

### L2-F3: HOLDS — `install.sh` flow matches INSTALL.md description

**Axis:** reality vs INSTALL.md.  
**Evidence (spot-check):** INSTALL.md §Path B describes install.sh as `./install.sh ts-server` or `./install.sh react-next`. install.sh:146-158 validates `$STACK` and routes accordingly. HOLDS on spot-check — full line-by-line comparison deferred (session depth).

---

### L2-F4: GOAL-DRIFT candidate (PARKED) — skills/rules-as-tests SKILL.md describes consumer product positioning

**Axis:** framing vs README goal.  
**Evidence:** `skills/rules-as-tests/SKILL.md:5-7` describes the framework as «A unified framework for treating every codebase rule as an executable test». This is consumer-facing positioning and consistent with README goal. The SKILL.md correctly scopes its authority: `> **NOT authoritative for:** project-host goal — see consumer's own README.md`. No drift detected on a fast read.  
**Verdict:** HOLDS — though a deeper audit of all 30 skill SKILL.md files' framing would be needed for full confidence. Session-bound coverage limitation: ~5/30 checked semantically.

---

### L2-F5: UNVERIFIABLE — CI badge branch mismatch impact on trust signal

**Axis:** framing vs README goal (trust signal for consumers).  
**Evidence:** Badges show `branch=main` but HEAD is `staging`. Whether PRs target main or staging affects badge freshness. Cannot verify without GitHub API access.  
**Verdict:** UNVERIFIABLE-needs-human. Factual claim (badges reference wrong branch) is verified as L1-F2 STALE. Whether this misleads consumers is a goal-alignment question → PARKED as DN-2.

---

### L2-F6: HOLDS — doc-authority-hierarchy.md §4 anti-patterns are coherent and non-contradictory

**Axis:** framing vs README goal; internal coherence.  
**Evidence (spot-check):** `#operational-doc-redefines-goal`, `#missing-authority-header`, `#contradicting-authority-claims`, `#frozen-doc-still-edited` are well-defined with distinct triggers. No overlap or contradiction detected.  
**Verdict:** HOLDS.

---

### L2-F7: STALE — rule-enforcement-channel-selection.md §4 (session-bound) "Activation pending" prose

**Axis:** reality vs code (duplicate of L1-F1 on the prose layer).  
**Evidence:** Same as L1-F1. The body-prose in §4 of rule-enforcement-channel-selection.md also says "**Activation:** add a PostToolUse Edit|Write entry for it in settings.json (maintainer; self-protected file)" — but it IS already added. The prose describing an action-to-take should be updated to a past-tense statement.  
**Verdict:** STALE (same finding, different prose location).

---

## §G1-T16 — Reuse-vs-build boundary finding

**Decision context:** G1 doctrine (from plan §0) calls for shipping the injection layer as a «stack-aware, self-populating» mechanism. G1-T16 asks: which parts of the EXISTING stack-detect→populate→update loop can be REUSED vs need new BUILD work?

**Existing loop inventory (verified by file:line):**

| Component | File | What it does | Audience |
|---|---|---|---|
| Stack detection | `packages/core/detector/index.ts` (v1) | Detects language/framework/db from package.json | Testable rules |
| Stack detection (deprecated) | `packages/core/detector-v0/detect-applicable-rules.ts:6` | Deprecated maintenance-mode rule applicability | (legacy) |
| Rule store | `packages/core/research/store/next/15.x/nextjs-app-router.json` | Per-framework rule JSON | Testable rules |
| Tool-bootstrap loop (6 rules) | `skills/tool-bootstrapping/SKILL.md:§Rule 1-6` | Stack→propose→confirm→persist for MCPs/skills | Tools |
| Deps-hash check (Rule 5) | `packages/core/hooks/deps-hash-check.sh` + `deps-hash-check.test.ts` | Hash-compare package.json deps→inject WARN | Tools (shipped) |
| Path-scoped injection | `.claude/hooks/inject-matching-rule.sh:11-14` | On Edit/Write: match globs→inject rule summary | Internal session rules |

**Does the injection/judgment layer exist?**  
`inject-matching-rule.sh` IS the injection layer — but for the AUTHORING session, not for consumer bootstrap. It reads `<!-- globs: … -->` and `<!-- inject: … -->` HTML-comment markers that are **manually placed** in each rule file by the maintainer. There is **no auto-populate mechanism** that takes stack detection output and generates these markers.

**Reuse-vs-build breakdown:**

| Layer | REUSE from existing | BUILD needed |
|---|---|---|
| Stack detection | REUSE: `packages/core/detector/` (v1 active) | — |
| Rule applicability filter | REUSE: detector v1 `patterns.ts` / `index.ts` | — |
| Injection marker format | ADAPT: `<!-- globs: … -->` / `<!-- inject: … -->` marker pattern from inject-matching-rule.sh | New per-artifact-class populate step |
| Auto-populate loop | **BUILD** — nothing currently auto-generates globs/inject markers | New script or recipe step |
| Consumer bootstrap template | ADAPT: tool-bootstrapping template patterns | Per-artifact-class rule template |
| Update (re-detect on deps change) | REUSE: deps-hash-check.sh pattern | Wire to injection layer |

**Verdict:** BUILD-SIZED. The ADAPT portions (stack detection, marker format) are reusable but the auto-populate step (taking detection output → generating `<!-- globs: … -->` markers in per-class rules) is new code that does not exist. Estimated scope: 1 new script + test + integration wire = qualifies as a capability commit. This is NOT a small adaptation.

**Per §A this is PARKED** — BUILD-SIZED finding → maintainer decides whether to open own kickoff (DN-3 below).

---

## §DECISION-NEEDED batch

All items below have a proposed resolution. None are auto-applied — each requires maintainer decision.

---

### DN-1: Fix stale "Activation pending" text in rule-enforcement-channel-selection.md

**Type:** doc fix (STALE claim vs code).  
**Finding:** L1-F1 + L2-F7 above.  
**Both files:** `.claude/rules/rule-enforcement-channel-selection.md:10` (Class header) + body prose at §4.

**Proposed diff (Class header, line 10):**
```diff
- > **Class:** B — compensating mechanism shipped: [`.claude/hooks/inject-matching-rule.sh`](../hooks/inject-matching-rule.sh) (PostToolUse path-scoped rule-injector, the §4 mechanism) + a deterministic self-test (`packages/core/hooks/inject-matching-rule.test.ts`). **Activation pending** one `settings.json` PostToolUse `Edit|Write` entry (maintainer-landed — `settings.json` is agent-self-protected). Promotion to A (principle test on rule-channel-declaration) in §6. (Codified Class C 2026-05-22; promoted to B the same wave when the injector shipped — no longer "prose-only".)
+ > **Class:** B — compensating mechanism shipped: [`.claude/hooks/inject-matching-rule.sh`](../hooks/inject-matching-rule.sh) (PostToolUse path-scoped rule-injector, the §4 mechanism) + a deterministic self-test (`packages/core/hooks/inject-matching-rule.test.ts`). **Activation confirmed** — PostToolUse `Edit|Write` entry present in `.claude/settings.json:114` (wired). Promotion to A (principle test on rule-channel-declaration) in §6. (Codified Class C 2026-05-22; promoted to B the same wave when the injector shipped — no longer "prose-only".)
```

**Proposed §4 prose change:**
```diff
- **Activation:** add a PostToolUse `Edit|Write` entry for it in `settings.json` (maintainer; self-protected file) — see the PR body for the snippet.
+ **Activation:** wired in `.claude/settings.json:114` (PostToolUse `Edit|Write` matcher, 2026-05-31 or earlier). No further action needed.
```

**Option A → apply both diffs:** removes misleading "pending" text, adds date+line reference. Accurate.  
**Option B → leave as-is:** low impact (internal rule, not shipped to consumers). Acceptable if low priority.  
**Proposal:** Option A — factual accuracy matters for Class audits.

---

### DN-2: Fix README.md CI badge branch references (main → staging)

**Type:** doc fix (STALE claim vs reality — LOW framing risk).  
**Finding:** L1-F2.  
**File:** `README.md:4-6`.

**Proposed diff:**
```diff
- [![Discipline Self-Check](...?branch=main)](...)
- [![Audit Self](...?branch=main)](...)
- [![Workflow Integrity](...?branch=main)](...)
+ [![Discipline Self-Check](...?branch=staging)](...)
+ [![Audit Self](...?branch=staging)](...)
+ [![Workflow Integrity](...?branch=staging)](...)
```

**Option A → update to `?branch=staging`:** badges reflect current primary CI branch. Accurate for consumers.  
**Option B → keep `?branch=main`:** main branch may still exist and run CI (audit-self.yml runs on both branches/staging). Badges may still be valid.  
**Option C → remove badges:** reduces maintenance surface; consumers can check GitHub directly.

**Proposal:** Option A — if staging is the primary integration branch, badges should reflect it. If main is intentionally maintained as a stable branch, Option B is acceptable. **This requires maintainer decision on branch strategy** — auditee (this doc) cannot determine the correct branch without knowing the deployment model.

**DECISION-NEEDED reason:** branch strategy is project-strategy, not a mechanical fact.

---

### DN-3: G1-T16 inject-layer extension (BUILD-SIZED verdict)

**Type:** capability placement decision.  
**Finding:** §G1-T16 above.  
**Summary:** The auto-populate step (stack-detect → generate `<!-- globs: … -->` markers per artifact class) does not exist. BUILD is needed. Not a small adaptation.

**Option A → own kickoff for the injection layer extension:** create a new umbrella (`inject-layer-v1` or similar) with its own kickoff. Allows scoped design review before BUILD.  
**Option B → bundle into the next available wave as a sub-task:** no separate kickoff; treat as one task in a planned wave.  
**Option C → defer entirely:** G1 doctrine is documented; the injection layer stays manual (maintainer adds globs/inject markers to rules) until a concrete use-case demands automation.

**Proposal:** Option C (defer) — the manual marker approach already works for the existing 11 rules in `.claude/rules/`. The BUILD cost (new script + integration + tests) is non-trivial and the concrete consumer demand hasn't been measured. Defer until 2+ consumer reports surface the pain point.

---

### DN-4: G4 mutation-test placement (per plan §A obligation)

**Type:** placement decision.  
**Context:** The plan references G4 but doesn't elaborate on it beyond listing it as MUST PARK. From the plan §A: "G4 mutation-test placement."

**Finding:** Current placement — Stryker in CI (`stryker.config.mjs` / `stryker.audit-ai-docs.mjs` in `packages/core/`) and mutation test is noted as a CI gate in README:66. However Stryker cannot run in this Docker environment (no `ps`). The `hooks/end-of-turn-reminder.test.ts` 21 tests all skip when jq is absent.

**Option A → keep Stryker in CI only:** CI is the appropriate place for slow mutation tests. Document the container prerequisite (`ps`, `jq`).  
**Option B → add a pre-push lightweight mutation sample:** run a 1-file Stryker on the most-changed hook file as a pre-push gate; full sweep stays in CI.  
**Option C → document container requirements explicitly:** add `docs/meta-factory/ci-environment-requirements.md` noting `ps` + `jq` as CI assumptions.

**Proposal:** Option A + Option C as a doc-only fix. Mutation testing in CI is correct placement; container env documentation is missing and should be added. The `jq` dependency for end-of-turn-reminder tests is an undocumented assumption — CONTRIBUTING.md should mention it.

---

## §Self-classification list (§A gate)

Per plan §A: every choice made during this run is classified as (a) fact/method-already-fixed → OK, or (b) strategy/goal/doctrine/placement/authority-conflict → MUST be in DECISION-NEEDED.

| # | Choice | Classification | In DECISION-NEEDED? |
|---|---|---|---|
| 1 | Used deterministic grep for Layer 1 checks (B1 method fixed in kickoff) | (a) method-already-fixed | N/A |
| 2 | Chose top 3 hooks for spot-check (plan §2.0 fallback: "top 2-3") | (a) method-already-fixed | N/A |
| 3 | run-check.ts, s17.ts, prior-art.ts selected (tests actually run in env) | (a) fact-verifiable | N/A |
| 4 | Classified L1-F1 as STALE (not LIES) — activation happened after doc was written | (a) fact: settings.json is the code, doc is defendant | N/A |
| 5 | Classified L1-F2 as STALE (not LIES) — remote HEAD is staging, not main | (a) fact: git remote show origin | N/A |
| 6 | Stopped at session-bound semantics for skill SKILL.md files (5/30 checked) | (a) method/T14 caveat documented explicitly | N/A |
| 7 | G1-T16 BUILD-SIZED verdict → PARKED as DN-3 | (b) BUILD decision → DN-3 | ✓ |
| 8 | Badge branch strategy (main vs staging) → PARKED as DN-2 | (b) branch strategy → DN-2 | ✓ |
| 9 | G4 mutation-test placement → PARKED as DN-4 | (b) placement → DN-4 | ✓ |
| 10 | Proposed Option A/B/C for each DN item but did NOT auto-apply any | (a) proposal only, fact-grounded | N/A |
| 11 | Did NOT edit any .claude/rules/*.md, README.md, settings.json | (a) audit-only mode | N/A |

**No (b)-class decisions were silently resolved.** DECISION-NEEDED batch is non-empty (4 items: DN-1 through DN-4). DN-1 involves a maintainer-owned rule file (maintainer decides); DN-2 involves README goal-adjacent positioning; DN-3 is a BUILD scope decision; DN-4 is mutation-test placement.

**T15 self-application:** this findings doc was audited on both axes:
- Vs reality: claims above are backed by command/file:line evidence per T3.
- Vs goal: this doc does not redefine the project goal; it defers all goal-alignment questions to DECISION-NEEDED. `# operational-doc-redefines-goal` anti-pattern: NOT triggered.

---

## §Coverage caveats (T6/T14 compliance)

1. **Mutation testing:** Stryker could not run (no `ps`); manual spot-check covers 3 TS hook files. Shell hooks (`.claude/hooks/*.sh`) have ZERO running test coverage in this environment (jq absent). Mutation resistance of shell hooks is **unverified**.
2. **Skill SKILL.md semantic audit:** 5/30 skill files checked for goal-drift. Remaining 25 not semantically audited. Verdict for unaudited skills: **unverifiable-needs-human**.
3. **docs/meta-factory/*.md load-bearing docs:** EXECUTION-PLAN.md, PROPOSAL.md, prior-art-evaluations.md have Authoritative-for headers (checked); content claims vs code were NOT exhaustively verified. The audit is complete for the §2 mandatory audit list but defers the 40+ other meta-factory docs to the folder-level authority model.
4. **L2 semantic coverage:** HOLDING verdicts above are session-bound (1 pass). Recall coverage ~60-70% of the mandatory audit population by semantic depth.

---

## §Self-reflexive note (plan §6)

This audit applied the project's thesis («documents lie; tests don't») to the project's own docs. The mutation run (Stage 2.0) was the «tests don't lie» evidence feeding the «documents lie» audit (Stage 2.1). The tooling failures (no `ps`, no `jq`, no `pip`) themselves surfaced a real finding: the container assumptions for mutation testing are undocumented (→ DN-4 Option C). The audit found its own Stage 2.0 tooling unreliable — which is itself the kind of finding the project's own thesis predicts: «documents (here: the kickoff's mutation run instructions) lie when the environment doesn't match».
