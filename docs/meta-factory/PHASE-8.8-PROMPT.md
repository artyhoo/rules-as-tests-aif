# Phase 8.8 Implementation Prompt — Prior-art evaluation mechanism

> **Назначение:** self-contained prompt для orchestrator session. Реализовать Phase 8.8 (prior-art evaluation mechanism) post-Phase-8-close. Implementation phase, NOT docs-only.
> **Версия:** 1.0.0 — 2026-05-08 (post-PR-#9 C-park; incorporates ultraview verdict 2026-05-08).
> **Triggered by:** Phase 8 close (acceptance GO verdict).
> **Phase 9 entry status:** STRONGLY RECOMMENDED, NOT HARD BLOCKER. Phase 8 retro decides escalation: если Phase 8 reinvented capability — blocker rationale становится empirical; если Phase 8 informally consult'ил prior-art — Phase 8.8 = retroactive formalization (timing soft).
> **Honest time estimate:** 3-5 дней wall-clock (8 atomic commits + retro). NOT mirror Phase 7.5 (Phase 7.5 = docs-only ≈30 min; Phase 8.8 = full implementation: validation script + husky hook + tests + docs).

---

## 1. Identity & Context

**Repo:** `/Users/art/code/rules-as-tests-aif`
**Base branch:** create new `docs/phase-8.8-mechanism` from `main` post-Phase-8-merge.
**You are:** Opus orchestrator, implementer. 8 atomic commits + retro. Production-grade — Art = first real consumer, использует framework для собственных проектов.

## 2. Обязательное чтение (в порядке)

1. [retros/phase-7.5.md](retros/phase-7.5.md) — structural pattern reference (NOT content mirror — Phase 7.5 docs-only, this is impl phase)
2. [EXECUTION-PLAN.md §6.0](EXECUTION-PLAN.md) — deterministic-v1 stop-rules (4 hard rules, must hold)
3. [EXECUTION-PLAN.md §1 «No-consumers caveat — UPDATED 2026-05-08 (CLOSED)»](EXECUTION-PLAN.md) — Art = real consumer
4. [EXECUTION-PLAN.md §3.3 Prior art table](EXECUTION-PLAN.md) — existing analog references
5. [aif-comparison.md §9 reuse matrix](aif-comparison.md) — aif-evolve overlap context (this Phase needs explicit cross-ref)
6. [aif-comparison.md §10 differentiator #4](aif-comparison.md) — recursive self-validation thesis (3 forms; do NOT spuriously add 4-th)
7. [self-application.md §2](self-application.md) — invariant table by layer
8. [packages/core/principles/01-07*.test.ts](../../packages/core/principles/) — Phase 2 principle test pattern (08 mirrors this)
9. [packages/core/manifest/rules-manifest.schema.json](../../packages/core/manifest/rules-manifest.schema.json) — verify why manifest is wrong place for framework-internal rules

## 3. Architectural decisions (locked, do NOT revisit)

These were settled через PR #9 ultraview verdict (2026-05-08). Re-debating wastes time.

| # | Decision | Rationale (verified) |
|---|---|---|
| A1 | NO IR-namespace в `factory/rules-manifest.json` для framework-internal rule | IR1-IR6 = Integration Rules (API contracts, Pact, S2S auth, OTel propagation, resilience). Stack values: `ts-server\|react-next\|microservices` — все consumer техстеки. Manifest validates consumer code, NOT framework artifacts. |
| A2 | Use Phase 2 principle pattern: `packages/core/principles/08-*.test.ts` | Mirror existing 01-07. Validates framework's own state via Vitest. Runs through existing `principles-meta-tests` CI job (no new gate needed). |
| A3 | Tighter principle framing: «every framework artifact claiming new capability cites prior-art evaluation» | Broader, universal. NOT «every research file cites» (single-concern, borderline). Applies to research files, design docs, retros, capability commits. |
| A4 | Process discipline (`Prior-art:` commit trailer) lives в CLAUDE.md / CONTRIBUTING.md / `.husky/pre-push`, NOT in manifest | Different surface (commit metadata, developer behavior); different enforcement model (developer-time hook + PR review, not L4 validator). |
| A5 | Hard fail с structured escape hatch (`Prior-art: skipped — <≥20 chars rationale>`) | Soft warn = self-defeating. Hard fail с opt-out trailer = invariant enforced + audit trail при principled skip + no quiet bypass. Friction fires только на capability commits (≈1 per 5-10), не каждый. |
| A6 | aif-evolve overlap explicit cross-ref в `aif-comparison.md §9` | aif-evolve auto-generates rules из patches. Phase 8.8 manual prior-art consult — complementary, не replacement. Decision rationale: keep manual для prior-art (curated, low-volume), aif-evolve for incident-derived rules (high-volume, post-fix). |

## 4. Hard constraints

1. **NO LLM at runtime** (per §6.0 stop-rule #1) — zero Anthropic SDK / OpenAI / context7 calls в hot paths
2. **NO new explicit deps** в `package.json` (transitive only)
3. **NO yargs/commander** (process.argv parsing if CLI needed, ≤60 LOC each)
4. **NO Path B AST gen** (Phase 9+ trigger)
5. **Memory rule:** context7 over git clone for external library research (≥3 phrasings minimum)
6. **NO destructive git ops** without explicit user confirm
7. **Atomic commits**, conventional-commits, English subjects, no emoji
8. **≤500 lines per shipped reference doc** (this prompt = transient artifact, exempt)
9. **Apply principle to itself:** context7 query (≥3 phrasings) BEFORE building any new abstraction в этой session; document evidence через `Prior-art:` trailer (which IS being established this phase — first commits demonstrate convention before formal codification)
10. **TESTED bash** — write standalone test invocations BEFORE committing hook code. PR #9 m4 finding: subshell `return` patterns broken; не повторяй

## 5. Task list (8 atomic commits + retro)

### T1 — SSOT skeleton + format spec

**File:** `docs/meta-factory/prior-art-evaluations.md` (new shipped reference, ≤500 lines).

**Structure:**
- Header: purpose, format spec, template для добавления entries.
- Entry schema (per row):
  ```
  ID | Candidate | Capability matched | First seen | Last reviewed | Verdict | Rationale | Trigger to revisit
  ```
- Verdicts: `ADOPT` / `DEFER` / `WATCHLIST` / `REJECT`. Each with semantic definition.
- Empty entry table (header + separator only).

**Verification:**
```bash
test -f docs/meta-factory/prior-art-evaluations.md
[ "$(wc -l < docs/meta-factory/prior-art-evaluations.md)" -le 500 ]
grep -E "ID \| Candidate" docs/meta-factory/prior-art-evaluations.md
```

**Commit:** `docs(prior-art): create prior-art-evaluations.md SSOT with format spec`

### T2 — First entry (Autogrep) demonstrates trailer convention

Add Autogrep entry в SSOT. Verify current state via context7 query (`Semgrep Autogrep LLM rule generation`); claim from 2026-05-08 research may be stale.

**Entry fields:**
- ID: 1
- Candidate: Autogrep (Semgrep + LLM)
- Capability matched: L3 LLM-driven rule generation
- First seen: 2026-05-08
- Last reviewed: <today's date>
- Verdict: DEFER
- Rationale: «Closest single analog (per ultraview verdict 2026-05-08). Security-only domain (CVE patches as source, not best-practice docs). No stack-aware `stack:[]` field, no self-application invariant. Re-evaluate when LLM v2 trigger fires per [open-questions.md §13.10 entry #1](open-questions.md).»
- Trigger to revisit: LLM v2 trigger fires; OR Phase 9+ entry research surfaces new Autogrep release

**Commit body** must include trailer (first instance — convention starts here, formal codification in T7):
```
Prior-art: 2026-05-08 analog research session (PR #9 C-park) → Autogrep closest analog identified; PR #9 ultraview confirmed.
```

**Verification:**
```bash
grep -A2 "^| 1 " docs/meta-factory/prior-art-evaluations.md
git log -1 --format=%B | grep -E "^Prior-art:"
```

**Commit:** `docs(prior-art): add Autogrep entry (first SSOT instance with Prior-art trailer)`

### T3 — Phase 2 principle 08-prior-art-cited

**File:** `packages/core/principles/08-prior-art-cited.test.ts` (Vitest, mirrors 01-07 pattern).

**Validates:** «Every framework artifact claiming new capability cites prior-art-evaluations.md entry by ID.»

**Initial scope artifacts:**
- `docs/meta-factory/phase-*-research.md`
- `docs/meta-factory/phase-*-entry-research.md`

Future scope expansion (design docs, retros, commit messages) — deferred decision in Phase 8.8 retro per actual false-positive data.

**Test structure (mirror 04-no-tautology.test.ts):**
```typescript
describe('P8 — every framework artifact claiming new capability cites prior-art evaluation', () => {
  // Discover all phase-*-research.md files
  // For each: assert that capability claims (heuristic: sections with "build", "reuse", "new", "decision") cite prior-art-evaluations.md entry by ID format [prior-art-evaluations.md#N]
  // Negative corpus (fixtures): research file без citations / с broken refs (cite #999 non-existent)
  // Positive corpus: existing research files (если они не cite — add to baseline exception list with documented rationale, pre-T3 artifacts)
});
```

**Baseline exception list** (pre-T3 artifacts that don't cite — documented via inline `// pre-08 baseline` constant):
- `docs/meta-factory/phase-3-research.md`
- `docs/meta-factory/phase-4-research.md`
- `docs/meta-factory/phase-5-research.md`
- `docs/meta-factory/phase-6-research.md`
- `docs/meta-factory/phase-7-research.md`
- `docs/meta-factory/phase-8-research.md`
- `docs/meta-factory/phase-8-entry-research.md`

**Mutation pattern (Phase 9+ Path B — gate 3 activation):** invert citation regex → negative corpus must still fail OR positive must still pass; mutation must change one outcome.

**Verification:**
```bash
cd packages/core && npm test principles/08-prior-art-cited
# All tests pass; CI job principles-meta-tests includes new test (no manual addition needed — глобальный glob)
```

**Commit body:**
```
Prior-art: prior-art-evaluations.md#1 (Autogrep, verdict DEFER — different domain, no overlap with framework-internal artifact validation).
```

**Commit:** `feat(principles): 08-prior-art-cited (build-vs-reuse via SSOT citation)`

### T4-T5 — 2 more SSOT entries (Netlify framework-info + fitness functions)

**T4 — Netlify framework-info:**
- ID: 2
- Capability: L1 multi-framework version-aware detection
- Verdict: WATCHLIST
- Rationale: «Production-ready multi-framework detection (Next 13.5+ App Router heuristic, Fastify). Deterministic-v1 stop-rule blocks dep-add сейчас. Re-evaluate at Phase 9+ detector v2 entry research, OR when new framework requires version-aware detection.»
- Commit trailer: `Prior-art: prior-art-evaluations.md#1 (independent capability — L1 detection, не L3 generation).`

**T5 — Fitness functions (Evolutionary Architecture, Ford et al. 2017+):**
- ID: 3
- Capability: framework-level meta-test pattern vocabulary
- Verdict: ADOPT VOCABULARY
- Rationale: «Existing established term для exactly наш principles-as-tests pattern (Phase 2). Useful framing для onboarding, README, academic citation. ADOPT means rename principles framing in [overview.md L2](../skills/rules-as-tests/references/overview.md) to use «fitness functions» term where applicable. No code change, doc terminology only.»
- Commit trailer includes vocabulary adoption: `Prior-art: prior-art-evaluations.md#3 (fitness functions = established vocabulary for framework-level meta-test invariants per Ford 2017+).`

**Verification:**
```bash
grep -E "^\| [23] " docs/meta-factory/prior-art-evaluations.md
git log -2 --format=%B | grep -cE "^Prior-art:"  # ≥ 2 matches
```

**Commit:** `docs(prior-art): add framework-info + fitness-functions entries`

### T6 — §5.5 Step 1.5 mandatory consult gate

**Edit:** `docs/meta-factory/EXECUTION-PLAN.md §5.5`. Insert Step 1.5 between «List capability areas» (Step 1) and «Resolve candidates» (Step 2).

**Step 1.5 content:**
> **Step 1.5 — Consult prior-art-evaluations.md** (mandatory, gating).
> Для каждой capability area из Step 1 — проверить SSOT на совпадения с «Capability matched». Если найдено: (a) обновить «Last reviewed» date в entry в том же commit'е; (b) включить candidate в Step 4 matrix с current verdict + rationale; (c) если verdict = `DEFER`/`WATCHLIST` — explicit re-evaluation note: «still applies» / «trigger condition fires now» / «new evidence».
> **Acceptance:** phase-N-research.md cites all matched prior-art entries by ID format `[prior-art-evaluations.md#N]`; «Last reviewed» dates updated в том же commit'е (verified via `git log -p` в phase retro).

**Verification:**
```bash
grep -n "Step 1.5" docs/meta-factory/EXECUTION-PLAN.md
```

**Commit body:** `Prior-art: prior-art-evaluations.md#1 (process gate complementary to SSOT — different layer, no overlap).`

**Commit:** `docs(execution-plan): §5.5 Step 1.5 mandatory prior-art consult gate`

### T7 — Process discipline в CLAUDE.md + CONTRIBUTING.md + PR template

**Files:**
- `CLAUDE.md` (extend existing or create section)
- `CONTRIBUTING.md` (extend existing — file exists per audit 2026-05-08)
- `.github/pull_request_template.md` (create new — verified non-existent per ultraview m6)

**Content (shared across files, may differ in detail):**
1. Build-vs-reuse invariant: «Before introducing new explicit dependency, new module ≥50 LOC under `packages/core/<new-dir>/`, or new abstraction ≥80 LOC anywhere в `packages/`, MUST: (a) consult [prior-art-evaluations.md](docs/meta-factory/prior-art-evaluations.md), (b) run context7 query (≥3 phrasings) for capability area, (c) document evidence via `Prior-art:` commit trailer.»
2. `Prior-art:` trailer syntax + examples (positive, escape hatch, broken).
3. Capability commit definition (formal, derived from T8 hook code).
4. Escape hatch syntax: `Prior-art: skipped — <≥20 chars rationale>` permitted; rationale must specify *why* (e.g. «refactor only, no new capability», NOT «TODO» / «later»).
5. Recursive self-application note: principle applies to its own implementation (Phase 8.8 commits include trailers per T2-T11; principle 08 validates artifacts citing SSOT).

**PR template:**
```markdown
## Summary
<one-paragraph what + why>

## Changes
<bullet list>

## Prior-art consult
- [ ] Capability commits in this PR have `Prior-art:` trailers (or `skipped` with ≥20 chars rationale)
- [ ] If new capability area surfaced: prior-art-evaluations.md entry added/updated
- [ ] Existing entries «Last reviewed» dates touched if matched

## Test plan
<checklist>
```

**Verification:**
```bash
test -f .github/pull_request_template.md
grep -q "Prior-art" CONTRIBUTING.md CLAUDE.md
[ "$(wc -l < CONTRIBUTING.md)" -le 500 ]
```

**Commit body:** `Prior-art: prior-art-evaluations.md#1 (process discipline different surface from artifact — already noted in entry rationale).`

**Commit:** `docs(contributing): build-vs-reuse invariant + Prior-art trailer convention + PR template`

### T8 — Pre-push hook implementation (TESTED bash)

**File:** `.husky/pre-push` (extend existing).

**Critical:** Write standalone test script BEFORE committing the hook. PR #9 m4 finding: subshell `return` patterns (`pipe | while ... && return 0`) broken — subshell can't return from outer function. Use plain `for c in $commits` loops collecting reasons into a variable, NOT `git ... | while read` pipelines.

**Hook structure (high-level — implement + test before commit):**
- `detect_capability_commits()` — iterates `git rev-list "${upstream}..HEAD"`; for each commit detects via 3 ordered checks (new dep в package.json grepping `^\+\s*"[^"]+":\s*"\^?[0-9]`, new file ≥50 LOC under `packages/core/<new-subdir>/`, new file ≥80 LOC anywhere в packages/). Outputs `<sha>:<reason>` lines. Use `for c in $(git rev-list ...)` and accumulator variable, not pipelines.
- `check_prior_art_trailer(commit)` — extracts `Prior-art:` line via `git show -s --format=%B`. Two paths: regular trailer (≥20 chars after `Prior-art:`) OR escape hatch (`Prior-art: skipped — <≥20 chars rationale>`). Both validate length via `${#var}` arithmetic.
- Main: collect failures into accumulator string, print all at end with fix instructions, `exit 1` if any. NO pipeline-with-return.

**Verification (hook itself + smoke test):**
```bash
bash -n .husky/pre-push  # syntax check
# Smoke test: stage fake capability commit на test branch, push attempt, expect exit 1
# Smoke test: stage fake commit с valid trailer, push attempt, expect exit 0
```

**Commit body:** `Prior-art: prior-art-evaluations.md#1 (no analog matches «capability-commit detection in pre-push» — context7 search returned husky / lefthook / pre-commit but none implement build-vs-reuse trailer detection).`

**Commit:** `feat(husky): pre-push capability commit detection + Prior-art trailer hard fail`

### T9 — Independent meta-test для hook (anti-tautology guard)

**File:** `tests/hooks/prior-art-trailer-hook.test.sh` (path corrected per ultraview N3 — `tests/hooks/` exists, `tests/principles/` does not).

**Setup:** temp git repo + minimal `package.json` + `.husky/pre-push` copied from framework root.

**Sub-tests (6):**
1. **Positive:** capability change (new dep) + valid trailer (≥20 chars rationale) → hook exit 0
2. **Negative-no-trailer:** same change без trailer → hook exit ≠ 0
3. **Positive-escape-hatch:** capability change + `Prior-art: skipped — refactor only, no new capability` → hook exit 0
4. **Negative-short-escape:** `Prior-art: skipped — TODO` (<20 chars) → hook exit ≠ 0 (gaming guard)
5. **Mutation-1 (anti-tautology):** invert trailer regex в hook → Test 1 must fail (proves test 1 actually validates trailer presence)
6. **Mutation-2 (anti-tautology):** drop capability detection в hook → Test 2 must fail (proves test 2 actually catches false-negative)

**Independence:** tests instrument hook через subprocess в isolated tmpdir, не self-call. `bash tests/hooks/prior-art-trailer-hook.test.sh` runnable standalone.

**CI integration:** add to existing `principles-meta-tests` job in `audit-self.yml` (similar pattern to existing `tests/audit/audit-ai-docs.test.sh` invocation). NO new sibling job (per ultraview m1 — redundant gate).

**Verification:**
```bash
bash tests/hooks/prior-art-trailer-hook.test.sh
# Exit 0; 6 sub-tests pass; mutation tests verified by reverting then re-running
```

**Commit body:** `Prior-art: prior-art-evaluations.md#1 (anti-tautology mutation pattern from Phase 2 P4, applied to bash/process surface).`

**Commit:** `test(hooks): anti-tautology guard for Prior-art trailer hook`

### T10 — Cross-refs + staleness policy + aif-evolve overlap

**Edit 1:** `docs/meta-factory/prior-art-evaluations.md` — add «Staleness policy» section.
> Entries with «Last reviewed» >180 days surface as Phase entry research candidates (manual review during §5.5 Step 1.5). Automated CI staleness gate deferred to Phase 8.X+ self-diagnostics tooling per [self-diagnostics-design.md §6](self-diagnostics-design.md). Trigger date format: ISO 8601 (`YYYY-MM-DD`).

**Edit 2:** `docs/meta-factory/aif-comparison.md §9 reuse matrix` — add aif-evolve overlap row (per A6 + ultraview N5).
> | Capability | Готовое решение | Reuse rationale |
> |---|---|---|
> | Pattern → rule generation | aif-evolve auto-mining | **Complementary, не replacement.** aif-evolve auto-generates project rules из patches (incident-derived, high-volume, post-fix). Phase 8.8 mechanism = manual prior-art consult (curated, low-volume, pre-build). Different lifecycle stages, different signal sources. Re-evaluate integration when LLM v2 trigger fires per [open-questions.md §13.10 entry #1](open-questions.md). |

**Edit 3:** `docs/meta-factory/aif-comparison.md §10 differentiator #4` — add note clarifying recursion thesis preserved at 3 forms (do NOT spuriously add 4-th form per ultraview N4).
> Recursive self-application thesis applies к prior-art mechanism (08-prior-art-cited principle) via existing forms #1 (principles testing manifest) and Phase 9+ form #3 (mutation tests of meta-tests via gate 3 activation). Не added 4-th form — split design (artifact + process) operates within existing axes.

**Edit 4:** `skills/rules-as-tests/references/overview.md` (per A2 + T5 ADOPT VOCABULARY) — frame Phase 2 principles using «fitness functions» term where applicable. Keep existing structure; add 1-2 sentence note at L2 description.

**Verification:**
```bash
grep -n "Staleness policy" docs/meta-factory/prior-art-evaluations.md
grep -n "aif-evolve" docs/meta-factory/aif-comparison.md
grep -n "fitness functions" skills/rules-as-tests/references/overview.md
```

**Commit body:** `Prior-art: prior-art-evaluations.md#3 (fitness functions vocabulary adopted; #2 framework-info — staleness policy applies); aif-evolve cross-ref added to §9 reuse matrix.`

**Commit:** `docs(prior-art): staleness policy + aif-evolve §9 cross-ref + fitness functions vocabulary`

### T11 — Phase 8 retroactive audit + Phase 8.8 retro

**File:** `docs/meta-factory/retros/phase-8.8.md` (new retro, ≤200 lines, mirror retros/phase-7.5.md structure).

**Sections:**
1. **Header:** date, branch, phase, verdict
2. **Scope:** what Phase 8.8 delivered
3. **Verification block:** acceptance criteria checked one-by-one
4. **Phase 8 retroactive audit (CRITICAL section):** for each Phase 8 build-vs-reuse decision — post-hoc consult evidence:
   - Decision: <what was built/decided>
   - Capability area: <name>
   - Prior-art that exists: <context7 query results если не yet>
   - Verdict: was reuse considered? Skipped — rationale; applied — citation
   - Phase 8 decisions to audit (initial list, expand based on Phase 8 actual scope):
     - Next 16 detection approach
     - Regen diff metric (preset-similarity weighted score)
     - Recipe expansion strategy R12/R14/R20
     - Gate 5 invocation mode (per-plan + Opus + advisory + cached)
     - aif-gate-result emission shape (Phase 11.1 partial)
     - /aif-verify integration spike status
5. **Self-application at-creation evidence:** 2026-05-08 analog research session + ultraview 2026-05-08 verdict (PR #9 C-park decision) — both predate principle 08, retroactively legitimate per Phase 8.8 retro acknowledgment
6. **Stop-rule audit:** §6.0 4 rules — held / violated
7. **Time-vs-plan ratio:** 3-5 дней target; actual; >2x triggers RCA
8. **New findings:** what surfaced during implementation
9. **Verdict:** GO / REVISE / STOP к Phase 9 entry. Если retro shows Phase 8 reinvented capability — escalate Phase 9 blocker (per m9 / reviewer note)

**Verification:**
```bash
test -f docs/meta-factory/retros/phase-8.8.md
[ "$(wc -l < docs/meta-factory/retros/phase-8.8.md)" -le 200 ]
grep -E "Verdict:.*(GO|REVISE|STOP)" docs/meta-factory/retros/phase-8.8.md
```

**Commit body:** `Prior-art: prior-art-evaluations.md#1 (retro pattern follows phase-7.5.md established structure).`

**Commit:** `docs(phase-8.8): retro + Phase 8 retroactive audit + verdict for Phase 9 entry`

## 6. Acceptance criteria (overall)

```bash
# Docs-only branch state OR docs + minimal impl (hook + test)
git diff main --name-only | grep -vE "^(docs/|packages/core/principles/08|tests/hooks/prior-art|\.husky/|\.github/|CLAUDE\.md|CONTRIBUTING\.md|skills/rules-as-tests/references/overview\.md)" | grep -v "^$" && echo "FAIL: unexpected files" || echo "OK"

# 8 atomic commits + retro = 9 total
git log main..HEAD --oneline | wc -l   # = 9

# Conventional commits
git log main..HEAD --pretty=format:'%s' | grep -cE '^(docs|chore|test|feat|fix)(\(.+\))?: '   # = 9

# Prior-art trailers on T2+ commits (T1 = before convention codified)
git log main..HEAD --pretty=format:'%H %s%n%b%n---' | grep -cE '^Prior-art:'   # ≥ 8 (T2-T11 commits)

# Per-task verification commands (see each task above)

# Existing tests + audit still green
npm test --workspace=@rules-as-tests/core --run 2>&1 | tail -3
make self-audit 2>&1 | tail -5

# New principle test passes
cd packages/core && npm test principles/08-prior-art-cited 2>&1 | tail -3

# Hook anti-tautology guard passes
bash tests/hooks/prior-art-trailer-hook.test.sh

# Pre-push hook smoke test (manual, ≤2 min)

# Each shipped reference doc ≤500 lines
for f in docs/meta-factory/prior-art-evaluations.md CONTRIBUTING.md; do
  lines=$(wc -l < "$f")
  echo "$f: $lines"
  [ "$lines" -le 500 ] || echo "FAIL: $f exceeds 500 lines"
done
```

## 7. What NOT to do (lessons from PR #9 C-park, hard-won)

1. **DO NOT promote framework-internal rule to `factory/rules-manifest.json`.** Manifest = consumer code rules. Use `packages/core/principles/` для framework-internal artifact validation.
2. **DO NOT use IR-namespace for framework-internal rules.** IR = Integration Rules для distributed systems (per IR1-IR6 actual semantics).
3. **DO NOT claim «mirror Phase 7.5».** Phase 7.5 was docs-only ≈30 min; this is implementation 3-5 days. Honest framing.
4. **DO NOT write bash code untested.** PR #9 m4: subshell `return` patterns broken. Write standalone test invocations BEFORE committing hook code.
5. **DO NOT path tests under `tests/principles/` (doesn't exist).** Use `packages/core/principles/` для Vitest, `tests/hooks/` для bash.
6. **DO NOT add Уровень sub-numbering без defining it.** PR #9 had 4a/4b/4c references but no scheme. If sub-numbering needed — define explicitly.
7. **DO NOT have CI job count inconsistency.** Verify body and acceptance section match.
8. **DO NOT add 4-th form to recursive self-validation thesis (aif-comparison §10 differentiator #4).** Existing 3 forms cover Phase 8.8.
9. **DO NOT skip aif-evolve cross-ref.** Phase 8.8 == manual analog of aif-evolve capability — must explicit cross-ref в `aif-comparison.md §9` reuse matrix.
10. **DO NOT make Phase 8.8 HARD BLOCKER for Phase 9 preemptively.** STRONGLY RECOMMENDED + Phase 8 retro escalation trigger if reinvention found.

## 8. Risk register

| Risk | Mitigation |
|---|---|
| Existing phase-*-research.md files don't cite SSOT (pre-T3 baseline) | Document inline в test as `pre-08 baseline` exception list. New research files post-T3 must cite. |
| Capability commit definition false-positive rate >30% | Phase 8.8 retro tunes thresholds (50/80 LOC) based on actual ≥10 commits data. |
| Pre-push hook breaks legitimate commits during T2-T6 (before T8 hook installed) | T8 lives BEFORE T2-T6 don't fire hook (it doesn't exist yet). Order is T1→T11 sequential per file. |
| `Prior-art:` trailer on T1 (SSOT skeleton commit, before convention codified) | T1 commit doesn't need trailer — establishes base file. T2 first to demonstrate. Document this в T7 CONTRIBUTING. |
| aif-evolve может покрывать part of scope after deeper investigation | T10 cross-ref includes integration re-evaluation trigger condition. Decision не gates Phase 8.8 close. |
| context7 down/rate-limited during research | Phase 8.8 not LLM-dependent at runtime. Manual SSOT entries OK if context7 fails — document fallback в commit body. |

## 9. PR plan

After Phase 8.8 close on `docs/phase-8.8-mechanism` branch:

```
gh pr create --base main --head docs/phase-8.8-mechanism \
  --title "feat: Phase 8.8 — prior-art evaluation mechanism (08-prior-art-cited principle + Prior-art trailer convention)" \
  --body "$(cat docs/meta-factory/retros/phase-8.8.md | head -60)"
```

PR description = retro head section. Reviewer (you / future Claude session) verifies acceptance criteria from §6 above.

## 10. Post-merge

1. Update [EXECUTION-PLAN.md §6](EXECUTION-PLAN.md) — mark Phase 8.8 closed, link retro
2. Phase 9 entry session unblocked (per Phase 8.8 retro verdict)
3. First Phase 9 entry research session uses §5.5 Step 1.5 + 08-prior-art-cited validation — actual mechanism dogfooding

---

**Reference materials packed для self-contained execution. Branch from main post-Phase-8-merge. Atomic commits. TESTED bash. Production-grade — Art = first real consumer.**
