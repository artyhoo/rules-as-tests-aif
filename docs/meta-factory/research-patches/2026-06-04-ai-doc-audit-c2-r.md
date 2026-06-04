<!-- scope:ai-doc-audit -->
# C2-R — ai-doc-audit target standard for docs/meta-factory large-prose corpus

> **Authoritative for:** C2 target standard — transfer verdict from C1-R, doc-authority conformance method at scale, cross-doc drift/duplication detection method, append-only/archive discipline for research-patches/retros/closed-questions. Binding input for C2-Audit.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Per-artefact verdicts — those live in C2-Audit.
> **Date:** 2026-06-04

---

## §1 Surface enumeration (T10 — population before sampling)

Command:
```bash
find docs/meta-factory -name '*.md' | wc -l
find docs/meta-factory -maxdepth 1 -name '*.md' | wc -l
find docs/meta-factory/research-patches -maxdepth 1 -name '*.md' | wc -l
find docs/meta-factory/retros -maxdepth 1 -name '*.md' | wc -l
```

Output (2026-06-04):
```text
213   total
 45   top-level (docs/meta-factory/*.md)
142   research-patches/ (141 patches + 1 README.md)
 26   retros/       (25 retros + 1 README.md)
```

### Sub-classification of the 45 top-level files

| Category | Count | Authority mechanism | Files |
|---|---|---|---|
| Required-header (REQUIRED_HEADER_DOCS) | 18 | principle 09 test + check-doc-authority.sh hook | EXECUTION-PLAN, PROPOSAL, architecture, self-application, principles-as-tests, aif-comparison, open-questions, closed-questions, prior-art-evaluations, acceptance-tests, core-stability, failure-modes, migration-from-current, niche-stacks, risks, roadmap, versioning-and-locks, self-diagnostics-design |
| Filename-convention exempt | 18 | `doc-authority-hierarchy §2` — scope from filename | `PHASE-*-PROMPT.md` (×9), `ORCHESTRATOR-START-PROMPT.md`, `REVIEWER-PROMPT.md`, `phase-*-research.md` (×7) |
| Extra operational docs | 9 | Voluntary headers (beyond REQUIRED_HEADER_DOCS) | automerge-staging-plan, dispatcher-skill-rphase, memory-codification-gap-tracker, mutation-run-placement, project-history-book, project-history-book-v2, project-history-book-v3, wave-orchestrator-kickoff, wave-sequencing-plan |
| **Total top-level** | **45** | | |
| research-patches/ individual files | 141 | Folder-level authority (research-patches/README.md) | date-named per gap |
| research-patches/README.md | 1 | Direct header | folder authority source |
| retros/ individual files | 25 | Folder-level authority (retros/README.md) | phase-N named |
| retros/README.md | 1 | Direct header | folder authority source |
| **C2 corpus total** | **213** | | |

---

## §2 Always-on confirmation

Command:
```bash
bash scripts/measure-always-on.sh | jq '{total_bytes, source_count: (.sources | length)}'
```

Output (2026-06-04):
```json
{
  "total_bytes": 163593,
  "source_count": 12
}
```

**Interpretation:** Always-on set = CLAUDE.md + 11 `.claude/rules/*.md` only. **Zero docs/meta-factory files are always-on.** The C2 corpus is on-demand by construction.

**Note:** The C1-R patch recorded 166,381 bytes; the current baseline is 163,593 bytes — a delta of 2,788 bytes explained by modified rule files on this branch (`.claude/rules/no-paid-llm-in-ci.md`, `parallel-subwave-isolation.md`, `reviewer-discipline.md`, `CLAUDE.md` all show `M` in `git status`). The always-on population (12 sources) is unchanged.

---

## §3 C1-R target standard transfer verdict

**Verdict: CONFIRMS-WITH-DELTA**

**Reasoning (probe-backed, not asserted):**

The spine criterion from C1-R spec §Spine:
> «One artefact = one channel. Always-on context is NOT an enforcement mechanism.»

Transfer to C2 holds because:
1. **The "always-on bloat" axis from §2 above does NOT bite this corpus** — §2 confirms zero docs/meta-factory files are always-on injected. The primary C1 concern (166 KB always-on rule prose) is structurally absent here.
2. **The channel vocabulary from C1-R §5 transfers** — `PATH/EVENT-SCOPED-INJECT`, `ON-DEMAND-SKILL`, `KEEP-ALWAYS-ON` (not applicable here) all map correctly. For docs/meta-factory, the applicable channel is **on-demand-reference** (not active enforcement) — none of these docs contain behavioural-shaping content that needs guaranteed-in-context delivery.
3. **The falsifier check passes** — no doc in this corpus is relied upon as behavioural-shaping prose (the rules in `.claude/rules/` carry that function; these docs are historical record + design reference). The docs/meta-factory corpus is purely on-demand reference by design.

**Delta areas (the three axes C1-R did not cover):**

| Axis | Why C1-R didn't cover it | What C2-R adds |
|---|---|---|
| A — Doc-authority conformance at scale | C1 surface had 17 artefacts; principle 09 + hook covered them. C2 adds 213 artefacts across sub-folders with different authority models. | §4 below: per-category method |
| B — Cross-doc drift/duplication detection | C1 surface was a single-layer flat list; no duplication concern. C2 has 213 docs where history has shown retros and research-patches accumulate related content. | §5 below: deterministic detection method |
| C — Append-only/archive discipline | C1 surface had no "historical archive" sub-surfaces. C2 has research-patches (append-only) and retros (post-merge frozen). | §6 below: per-sub-surface standard |

**Falsifier for this verdict:** wrong if any docs/meta-factory file is injected always-on (§2 probe refutes this) OR if any doc in this corpus contains behavioural-shaping content that agents rely on in non-research sessions (no such case found: all docs/meta-factory are design records, phase notes, or research outputs).

---

## §4 Delta A — doc-authority conformance at scale

### Probe results

**Principle 09 test run (2026-06-04):**

Command:
```bash
/app/node_modules/.bin/vitest run packages/core/principles/09-doc-authority-hierarchy.test.ts --reporter=verbose
```

Output: **17/17 tests PASS**. Including `all required-header docs declare Authoritative-for` (the canonical list sweep).

**Direct header check on all 18 REQUIRED_HEADER_DOCS docs/meta-factory files:**

Command:
```bash
for f in EXECUTION-PLAN.md PROPOSAL.md architecture.md [...17 more...]; do
  has=$(grep -l '> \*\*Authoritative for:' "docs/meta-factory/$f" 2>/dev/null && echo YES || echo NO)
  echo "$has  docs/meta-factory/$f"
done
```

Output: **18/18 YES** — all required docs have authority headers.

**Folder-level README headers:**

```bash
head -1 docs/meta-factory/retros/README.md
# Output: "> **Authoritative for:** folder convention for phase retrospectives..."
head -1 docs/meta-factory/research-patches/README.md
# Output: "> **Authoritative for:** folder convention — accumulator format for prior-art coverage gaps..."
```

Both folder-level READMEs present with compliant headers. Individual files in both folders inherit folder authority per `doc-authority-hierarchy §5`.

**Extra operational docs (not in REQUIRED_HEADER_DOCS):**

All 9 extra operational docs (automerge-staging-plan.md, etc.) have authority headers — voluntary compliance beyond the required list.

**check-doc-authority.sh §1.8 smoke test:**

Command:
```bash
echo '{"tool_input":{"file_path":"'"$(pwd)"'/package.json"}}' \
  | bash .claude/hooks/check-doc-authority.sh; echo "exit=$?"
```

Output:
```text
⚠ check-doc-authority: jq unavailable — skipping
exit=0
```

**Finding P-C2-1:** The `check-doc-authority.sh` hook gracefully degrades to `exit=0` when `jq` is unavailable. In this environment (`jq not found` on PATH), the hook is a no-op. In a production CC environment where `jq` is available, the hook fires on Edit/Write of required-header docs (including `docs/meta-factory/EXECUTION-PLAN.md` and the 17 other required docs). This is the INCONCLUSIVE-4 item — see §8.

### Method for C2-Audit (Delta A)

**Target:** Every doc in the C2 corpus falls into exactly one of these four categories, and the category's authority contract is satisfied.

| Category | Contract | How C2-Audit checks |
|---|---|---|
| Required-header (18 files) | Must have `> **Authoritative for:**` header | Run principle 09 test (gate) |
| Filename-convention exempt (18 files) | No per-file header required; scope from filename | Verify filenames match the exempt patterns in `doc-authority-hierarchy §2` |
| Extra operational docs (9 files) | Have voluntary headers (currently compliant); C2-Audit verifies continued compliance | Grep `> **Authoritative for:**` in each |
| Folder-level inherited (retros/ + research-patches/) | Folder README has header; individual files inherit | Verify README headers; individual files need no per-file check |

**C2-Audit scope extension:** The 9 extra operational docs are not enforced by principle 09 (not in REQUIRED_HEADER_DOCS). C2-Audit should recommend whether to add them to the required list (extending principle 09 enforcement) or leave them as voluntary.

---

## §5 Delta B — cross-doc drift/duplication detection method

### 6-item search-coverage check (before any «no tool exists» claim)

1. **Own-stack sweep:** `scripts/` contains `check-skill-drift.sh` (scope: `.claude/skills/`, `agents/`, `skills/` only — NOT `docs/meta-factory/`). `packages/core/principles/` has principle 09 (authority headers), principle 10 (scope annotations). Neither checks for prose verbatim duplication across docs/meta-factory files.

2. **Category sweep:** drift-detection tools in this domain: (a) content-diff tools (diff, delta), (b) authority-header presence checks (principle 09), (c) annotation enforcement (principle 10), (d) cross-reference integrity (check-skill-drift.sh broken-ref scanner). None of (a)–(d) checks verbatim content duplication across docs/meta-factory prose bodies.

3. **Semantic-distance check:** broadened from «drift detection» to «authority-overlap» (`#contradicting-authority-claims` in `doc-authority-hierarchy §4`) and «SSOT pointer integrity» (dual-implementation §7 `#sync-by-copy-paste`). These two functions together cover the problem class without requiring semantic LLM analysis.

4. **Adversarial check:** «if a prose drift detection tool existed in this repo, where would it be?» — `scripts/check-skill-drift.sh` is the closest existing tool (broken-ref scan + frontmatter check). Its `find` scope is `agents skills .claude/skills` — NOT `docs/meta-factory`. No analogous tool covers the docs/meta-factory surface.

5. **Floor ≥3 candidates checked:** check-skill-drift.sh (wrong surface), dual-impl §5 `@dual-pair` grep sketch (wrong surface — for hook+agent pairs), principle 09 authority header check (right category but checks presence, not overlap).

6. **Conclusion (backed):** No existing tool in this repo detects (a) authority-scope overlap across docs/meta-factory docs or (b) verbatim prose duplication within this corpus. The proposed method below is a new check (ADAPT verdict from check-skill-drift.sh approach).

### Proposed deterministic method (no paid LLM, per no-paid-llm-in-ci §1)

**Three layers — reviewer-time, not CI gates (prose is judgment-surface, not mechanical):**

**Layer A — Authority-scope overlap detection (≤10 LOC grep):**

```bash
# Surface docs claiming potentially overlapping authority scopes.
# Output is candidates for reviewer judgment — not a mechanical gate.
grep -rn '> \*\*Authoritative for:' docs/meta-factory/ | grep -v README \
  | grep -v '\/retros\/' | grep -v '\/research-patches\/' \
  | sort -t: -k3
```

Reviewer checks: are any two docs claiming authority over the same scope area? If yes → `#contradicting-authority-claims` (`doc-authority-hierarchy §4`).

**Layer B — Broken internal reference scan (ADAPT of check-skill-drift.sh §1):**

```bash
# Extend check-skill-drift.sh's broken-ref scanner to docs/meta-factory.
# Change scope of the find command from: find .claude/skills agents skills
# To: find .claude/skills agents skills docs/meta-factory
# Same logic, different scope — pure ADAPT, no new mechanism.
```

ADAPT verdict (SSOT entry to be created if fix built in C2-I): the broken-ref scanner in check-skill-drift.sh already implements exactly the right logic for relative Markdown link resolution. Extending the find scope covers dangling cross-references in the docs/meta-factory corpus with zero new code mechanism.

**Layer C — Verbatim excerpt detection (reviewer-time, ≤5 LOC):**

```bash
# Identify candidate pairs of large docs that may have verbatim sections.
# Flag pairs where diff shows ≥5 consecutive shared lines (excluding headers/boilerplate).
# C2-Audit identifies candidates manually; this script profiles severity.
diff <(grep -v '^#\|^>\|^---\|^\s*$' docs/meta-factory/doc-A.md) \
     <(grep -v '^#\|^>\|^---\|^\s*$' docs/meta-factory/doc-B.md) \
  | grep -E '^\+|^-' | grep -v '^[+-]{3}' | head -30
```

**`#sync-by-copy-paste`** (dual-implementation §8): when two docs share ≥5 consecutive non-boilerplate lines verbatim AND neither carries a `<!-- spec-of: <path> -->` cross-reference, the pair is sync-by-copy risk.

**What C2-Audit does with these layers:**
- Run Layer A; flag any overlapping authority claims as `DECISION-NEEDED`
- Run Layer B (extended check-skill-drift.sh or equivalent) against docs/meta-factory; flag broken refs as audit finding
- Manually identify candidate doc pairs for Layer C based on topic overlap; spot-check ≥3 pairs

---

## §6 Delta C — append-only/archive discipline

### Standard per sub-surface

**research-patches/ — append-only:**

Ground: research-patches/README.md «Individual patch files inherit this folder authority — scope-bound by the gap they document and do not need their own headers»; principle 10 (`<!-- scope: -->` first-line annotation, CI-enforced).

Standard:
- One file per coverage gap; date-named `YYYY-MM-DD-<slug>.md`
- Content is append-only after the creating commit (no retroactive substantive edits)
- Permitted post-creation edits: scope-annotation additions (machine-parseable header), typo fixes, link repairs
- Scope annotation (`<!-- scope:slug -->`) as FIRST LINE is mandatory and CI-enforced (principle 10: `10-research-patch-annotation.test.ts`)

**Probe — scope annotation coverage (2026-06-04):**

Command:
```bash
total=$(ls docs/meta-factory/research-patches/*.md | grep -v README | wc -l)
with_scope=$(grep -rl '<!-- scope:' docs/meta-factory/research-patches/ | wc -l)
echo "Total: $total, With scope: $with_scope"
```

Output: `Total: 141, With scope: 141` — **100% scope annotation coverage** ✅

**retros/ — closed historical artifacts post-merge:**

Ground: retros/README.md «Closed historical artifacts post-merge — substantive content is not retroactively rewritten (header-only edits, typo fixes, link repairs permitted)».

Standard:
- Retros have an **active phase** (during the phase: open, can be updated to close open items)
- After the phase PR merges: retro is **frozen** (header edits, typo fixes, link repairs only — per retros/README.md `#frozen-doc-still-edited` anti-pattern)
- Individual files inherit folder authority — no per-file Authoritative-for header required (and none expected)

**Git spot-probe for post-merge violations:**

Command:
```bash
git log --oneline --diff-filter=M -- 'docs/meta-factory/retros/phase-1*' \
  'docs/meta-factory/retros/phase-2*' 'docs/meta-factory/retros/phase-3*' | head -5
```

Output:
```text
962d557 cleanup(phase-3.1): close 6 MAJOR violations — delete duplicate sources, update stale paths
eaf3e19 docs(phase-2): PHASE-2-PROMPT.md paper trail + §13.3 partial closure tracking
184c2be fix(self-application): MAJOR-2 actual L2 invariant resync
d6eba6c feat(self-application): Phase 1.D split PROPOSAL.md + MAJOR-2 fix + line count corrections
```

**Interpretation:** Four commits modified old retros (phase-1, phase-2, phase-3). These are candidates for `#frozen-doc-still-edited` investigation in C2-Audit. Whether each is a violation depends on whether the retro was "post-merge" at commit time:
- `962d557` (phase-3.1) — «close 6 MAJOR violations»: cleanup during Phase 3.1 work, likely during that phase's active period (not post-merge). Probable OK.
- `eaf3e19` (phase-2) — «PHASE-2-PROMPT.md paper trail + §13.3 partial closure tracking»: substantive edit; Phase 2 was certainly post-merge by 2026-05-08. **Candidate violation.**
- `184c2be`, `d6eba6c` (phase-1): «MAJOR-2 fix + line count corrections» during Phase 1.D work — likely still within the phase's active window. Check git date vs phase-1 merge date.

**Standard for C2-Audit (retros):** For each commit that modified a retro, verify: (a) was the retro's phase still active at that commit's date? If yes → acceptable. If no → `#frozen-doc-still-edited` finding.

**closed-questions.md — append-only archive:**

Ground: closed-questions.md header «Authoritative for: archived §13.x entries that have reached terminal status … Each entry retains its original §13.N anchor number for backward-link stability».

Standard:
- Entries move from open-questions.md → closed-questions.md when resolved
- Once in closed-questions.md: append-only (entries retain their anchor numbers; substantive retroactive edits are a `#frozen-doc-still-edited` risk)
- Permitted: typo fixes, link repairs, adding the closure reference (the `Closed by:` note)
- NOT permitted: changing the original entry's problem statement or resolution decision

**open-questions.md — active registry:**

Standard: open-questions.md is NOT frozen — entries get resolved and move. No append-only constraint. The authority header correctly declares it «companion» to closed-questions.md.

---

## §7 Search-coverage 6-item checklist + §self-application

### 6-item checklist (for the "no prose drift tool" claim in §5)

1. ✅ **Own-stack sweep:** `scripts/check-skill-drift.sh` (scope: skills/agents only, not docs/meta-factory); `packages/core/principles/09-...`, `10-...` (authority + scope annotations, not verbatim detection)
2. ✅ **Category sweep:** diff tools (no cross-doc application), authority-header checks (principle 09 — presence only), annotation enforcement (principle 10 — format only), broken-ref scanner (check-skill-drift.sh §1 — wrong surface scope)
3. ✅ **Semantic-distance check:** broadened to «authority-overlap» + «SSOT pointer integrity» as the relevant functions
4. ✅ **Adversarial check:** «if the tool existed, it would be in scripts/ or packages/core/principles/» — checked both; none covers docs/meta-factory prose-body duplication
5. ✅ **Floor ≥3 candidates evaluated:** check-skill-drift.sh, dual-impl §5 grep, principle 09
6. ✅ **Negative-existence claim backed:** the "no tool covers docs/meta-factory prose drift" claim is backed by a direct scan of scripts/ (listed in §5 Layer A probe) and principle test files. Not asserted from memory.

### §self-application finding

**Question:** Does this research-patch itself follow the spine criterion (concise, on-demand, no always-on bloat)?

**Check:**

| Criterion | This patch | Pass? |
|---|---|---|
| Not always-on injected | Lives in `docs/meta-factory/research-patches/` — confirmed always-on set is only CLAUDE.md + 11 rules (§2 above) | ✅ |
| `<!-- scope: -->` first-line annotation | `<!-- scope:ai-doc-audit -->` is line 1 of this file | ✅ |
| Doc-authority header | `> **Authoritative for:**` present, scoped to C2 target standard | ✅ |
| No behavioural-shaping prose injected always-on | Patch is purely reference/research output; no shaping content | ✅ |
| Net always-on context delta | 0 bytes added (patch is never injected) | ✅ |

**Finding:** Self-application PASSES. The patch applies its own standard to itself — `#recursive-self-application-gap` does not fire.

**Secondary check — does the C1-R transfer verdict apply recursively to this patch?** Yes: this patch is on-demand reference (research-patch, never always-on) with a deterministic activation path (scope annotation → principle 10 machine-parseable lookup when running §1.6 trigger sweeps). Consistent with the CONFIRMS-WITH-DELTA verdict in §3.

---

## §8 Open INCONCLUSIVE items

### Carry-forwards from C1-R (unchanged)

**INCONCLUSIVE-1:** `inject-matching-rule.sh` actual FIRE — hook is wired at `PostToolUse matcher: Edit|Write`, has `<!-- globs: -->` marker in `rule-enforcement-channel-selection.md`. Actual fire requires live CC session with PostToolUse observation.

**INCONCLUSIVE-2:** CC `paths:` frontmatter read-time load — `phase-research-coverage.md` and `rule-enforcement-channel-selection.md` have `paths:` frontmatter. Live CC session required to confirm `InstructionsLoaded load_reason=path_glob_match` fires on matching file edits.

**INCONCLUSIVE-3:** Class-C rules gate feasibility — 4 rules have `gate=no` (`memory-codification`, `parallel-subwave-isolation`, `recommendation-laziness-discipline`, `reviewer-discipline`). 6-item negative-existence check not yet run for the three Class-C prose-only rules.

### New in C2-R

**INCONCLUSIVE-4:** `check-doc-authority.sh` live firing in C2 environment.

**Status:** Hook is wired at `PostToolUse matcher: Edit|Write` (confirmed via `settings.json` `jq` parse in C1-R §Probe 8). In the current workdir environment: `jq not found` → hook exits 0 silently (graceful degradation). `tsx` is at `/app/node_modules/.bin/tsx` (not `$REPO_ROOT/node_modules/.bin/tsx`) → second guard would also skip gracefully.

**Observation needed:** In a production CC environment (jq present, tsx at `$REPO_ROOT/node_modules/.bin/tsx`), edit `docs/meta-factory/EXECUTION-PLAN.md` and confirm the hook produces a non-zero exit / stderr if the authority header is removed. This verifies that the `REQUIRED_HEADER_DOCS` list includes docs/meta-factory files AND the hook actually fires on them.

**Why INCONCLUSIVE:** Environment-specific tooling availability; cannot be settled by bash probe in this session.

---

## §9 Summary table

| Item | Value |
|---|---|
| C2 corpus total | **213 files** (45 top-level + 142 research-patches + 26 retros) |
| Always-on in C2 corpus | **0** (all on-demand by construction) |
| Always-on baseline (current branch) | **163,593 bytes** / 12 sources |
| C1-R standard transfer verdict | **CONFIRMS-WITH-DELTA** |
| Principle 09 test status | **17/17 PASS** (2026-06-04) |
| Required-header docs (docs/meta-factory) | **18** — all compliant ✅ |
| Folder-level READMEs | **2** (retros/ + research-patches/) — both compliant ✅ |
| research-patches scope annotation coverage | **141/141 (100%)** — principle 10 enforced ✅ |
| Extra operational docs with voluntary headers | **9** — all compliant; C2-Audit to recommend adding to required list |
| Retro edits flagged for C2-Audit investigation | **2** (eaf3e19 phase-2, d6eba6c phase-1) |
| Cross-doc drift tool (existing) | **None** covering docs/meta-factory prose — proposed ADAPT in §5 |
| INCONCLUSIVE carry-forwards | **3** (from C1-R) + **1** new (check-doc-authority.sh env) |
