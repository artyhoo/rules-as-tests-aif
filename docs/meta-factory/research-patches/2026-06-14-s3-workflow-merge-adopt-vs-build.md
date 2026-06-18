<!-- scope:universalization-fix-s3 -->
# 2026-06-14 — universalization-fix-s3 Stage R: non-destructive workflow-YAML merge — ADOPT vs BUILD vs HYBRID

> Scope: research-patch (inherits folder authority per [research-patches/README](./) — no per-file
> Authoritative-for header required). Resolves the Stage-R fork in
> [`.claude/orchestrator-prompts/universalization-fix-s3/kickoff.md §4`](../../../.claude/orchestrator-prompts/universalization-fix-s3/kickoff.md)
> for GH **[#521](https://github.com/Yhooi2/rules-as-tests-aif/issues/521)**. Output = research + ONE verdict.
> NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## 0. The question

How should `install.sh` non-destructively add the missing rule-enforcement steps —
`bash scripts/check-rule-globs.sh`, `npm run arch:check`, `npm run audit:docs`, `npm run check:lintstaged` —
into a **brownfield** consumer's pre-existing `.github/workflows/*.yml` job, **without clobbering the rest of
their CI**? `copy_safe` keeps the consumer's `ci.yml` verbatim (`install.sh:603`/`:615`), so today those gates
never reach CI — the only non-bypassable enforcement channel.

## 1. The 6 hard constraints (from kickoff §4 — each a real disqualifier)

1. **No node_modules at install time.** A merge that `require()`s an npm YAML lib WILL fail on a fresh consumer.
2. **Single-maintainer maintenance cost** ([build-first-reuse-default.md §2](../../../.claude/rules/build-first-reuse-default.md)) — a new runtime dep adds detect-first/install burden + a capability commit.
3. **Cross-platform** — macOS BSD awk 20200816 + Linux GNU; any bash/awk BUILD must be portable.
4. **YAML whitespace-significant; idempotent append-if-absent** — re-running install must not duplicate steps.
5. **Consumer owns their CI** — never reorder/drop existing steps.
6. **Comment + structure preservation (the #1 silent-failure mode)** — a candidate that strips/reflows comments or normalises quoting while "succeeding" is DISQUALIFIED.

## 2. Mechanically-verified ground truth (T20 — evidence before verdict)

| Claim | Evidence (command + output) |
|---|---|
| ci.yml copy precedes §7 merge precedes §8 dep-install | `grep -nE 'copy_safe.*ci\.yml\|package.json scripts\|dev-dependency install' install.sh` → ci.yml `:603`/`:615`; §7 `:669`; §8 `:751`. node_modules is **absent** at any workflow-merge point. |
| node has **no** builtin YAML parser | `node -e 'require("yaml")'` → `MODULE_NOT_FOUND`; `node -e 'require("node:yaml")'` → `ERR_UNKNOWN_BUILTIN_MODULE`. **The §7 "builtin-parser, zero-dep" trick that works for `JSON.parse` is impossible for YAML** — there is no `JSON.parse` equivalent in node core. |
| §7 precedent shape | `install.sh:677-749` — `command -v node` guard → `node -e` with builtin `JSON.parse`/`JSON.stringify`, only adds absent keys, idempotent, `node`-absent → graceful skip with manual-step echo (`:747`). |
| WARN block under-reports | `install.sh:653-667` greps each workflow for `check-rule-globs\.sh|check:globs` **only** (`:657`); `arch:check`/`audit:docs`/`check:lintstaged` get no warning. |
| install env awk | `awk version 20200816` = **BSD awk** (macOS), matches issue env. |
| existing test harness + paired-negative pattern | `tests/install-sh/*.test.sh` — `f12-workflow-integrity-shipped.test.sh` already runs the REAL pipeline into a `mktemp -d` consumer + pos arm + load-bearing neg arm. Stage-P paired-negatives have a home + a template. |

## 3. SSOT consult ([prior-art-evaluations.md](../prior-art-evaluations.md))

`grep -niE 'yaml|workflow|yq|js-yaml|merge|actionlint|github.actions|github actions' docs/meta-factory/prior-art-evaluations.md`
→ 115 rows scanned; **no row evaluates a YAML-merge / workflow-step-injection tool.** Closest hits, each
confirmed NOT a match for this capability:

- **#60 Agent RuleZ** — YAML *policy engine* on CC hooks (rule scoping), REFERENCE. Not a workflow editor.
- **#101 CC native `paths:` frontmatter** — scopes a `.claude/rules/*.md` rule to globs (read-trigger). Not workflow YAML.
- **#11 ESLint `extends:`** / **#22 Cookiecutter+Copier** — config *composition* / template *render*, not in-place YAML edit-if-absent.
- **#41 Danger JS** — PR-body validation, not workflow mutation.

**Verdict on SSOT: a new row MUST be appended** (drafted in §8) so the Stage-P capability commit's
`Prior-art:` trailer has a real ID to cite (kickoff §7).

## 4. DeepWiki transcript (≥3 phrasings — quoted)

**Q1 (mikefarah/yq) — comment/formatting preservation on in-place edit:** "Does yq preserve comments, blank
lines, and formatting when editing a YAML file in place… or does it reflow/strip them or change quoting?"
> **A:** "yq **attempts** to preserve comments, blank lines, and formatting… **However, it does not handle all
> scenarios perfectly, especially concerning whitespace.** … the documentation **explicitly states that there
> are issues with whitespace preservation.**" In-place `-i` = temp-file-then-replace.
> (<https://deepwiki.com/search/does-yq-preserve-comments-blan_a0cc49cc-2994-4175-9eaf-1bbc70e3319c>)

**Q2 (mikefarah/yq) — idempotent append-if-absent to a named job's steps:** "Can yq idempotently add an item
to a sequence only if not present — append a step to a named job's `steps:`, skip if the exact run already
exists, so re-running is a no-op?"
> **A:** "Yes… combine `+=` then `|= unique`": `yq '.jobs.JOB.steps += [{run: "npm run arch:check"}] | .jobs.JOB.steps |= unique'`.
> Caveat: `unique` compares whole-object equality; field-scoped needs `unique_by(.run)`.
> (<https://deepwiki.com/search/can-yq-idempotently-add-an-ite_ecc8ee59-0c8f-4290-93e2-46e604b878a6>)

**Q3 (rhysd/actionlint) — is it a merger or read-only?:** "Is actionlint capable of editing/merging workflow
YAML (injecting a step) or is it strictly a read-only linter?"
> **A:** "actionlint is **strictly a read-only static linter and validator**… it **does not have capabilities to
> edit, merge, or modify workflow YAML files, such as adding or injecting new steps.**"
> (<https://deepwiki.com/search/is-actionlint-capable-of-editi_9f3970fa-016c-45b5-ac33-c9e36a2c3ca2>)

## 5. WebSearch transcript (≥3 phrasings — top candidates named)

**S1** "idempotently inject step into existing github actions workflow yaml cli preserve comments" → **no
dedicated tool exists.** "The search results don't reveal a CLI tool specifically designed to idempotently
inject steps into existing GitHub Actions workflow YAML files while preserving comments. This appears to be
either a specialized tool, a custom solution, or a feature that hasn't yet been widely documented." Surfaced
[`actions/runner#2079`](https://github.com/actions/runner/issues/2079) — "Allow injection of steps" is an
**open feature request**, i.e. unsolved upstream. Pointer to comment-preserving libs (ruamel.yaml/Python).

**S2** "merge yaml file preserving comments command line tool yq vs js-yaml round-trip" → top: **mikefarah/yq**
("attempts to preserve comment positions and whitespace… does not handle all scenarios"; on *merge*
specifically "**cannot guarantee comment preservation**"), **yamlpath `yaml-merge`** ("strips all comments and
empty lines unless `--preserve-lhs-comments`"), **ruamel.yaml** (Python, round-trip mode). Takeaway:
"preserving comments during **merges** is challenging… most tools will strip them by default."

**S3** "yq add step to github workflow job steps list if not present idempotent install script" → **mikefarah/yq**
(pre-installed on GH runners; no purpose-built if-absent step-inject example documented), **marketplace/setup-yq**.
No upstream "install-time idempotent step-injector" surfaced.

## 6. Per-candidate evaluation (6 constraints + T16 each)

### C-A — ADOPT `mikefarah/yq` (Go binary, detect-first)
- **T16:** Upstream problem class = *general-purpose jq-style YAML query/edit, best-effort comment retention*.
  Our problem class = *install-time, in-place, idempotent inject-if-absent into a named job's steps **with a
  hard guarantee** that the consumer's comments/anchors/quoting survive*. **Match? PARTIAL.** The query/edit
  primitive transfers (Q2 proves the idempotent expression works); the **load-bearing guarantee does not** —
  Q1 + S2 establish yq's preservation is best-effort with **documented whitespace issues** and **no merge
  guarantee**. This is exactly `#pattern-matching-on-name` (T16): "yq edits YAML" ≠ "yq safely edits OUR
  comment-heavy consumer workflow in place."
- C1 (no node_modules): **PASS** — Go binary, no npm.
- C2 (maintenance): **WEAK** — new runtime dependency → detect-first + install burden + capability commit; the §7 precedent deliberately took **zero** deps.
- C3 (cross-platform): **PASS** — static Go binary, macOS + Linux.
- C4 (idempotent): **PASS** — `+= … | unique` / `unique_by(.run)` (Q2).
- C5 (don't reorder): **PASS** — targeted path edit, leaves other steps.
- C6 (comments — **the disqualifier**): **FAIL as a hard guarantee.** Q1/S2: best-effort only, whitespace issues acknowledged upstream. A consumer's real workflow (anchors, `${{ }}`, intentional blank lines, head/foot comments) can be silently reflowed while yq exits 0 — the precise §4 constraint-6 silent-failure.
- **Outcome: DISQUALIFIED as the *default in-place merger* on C6** (and weak on C2). **Survives as an *opt-in, detect-first* engine** behind a flag where the consumer accepts the risk and the result is shown/diffable — never as the silent brownfield default.

### C-B — ADOPT a node YAML lib (`yaml` / `js-yaml`)
- **T16:** Upstream = *programmatic YAML parse/serialize in JS*; `js-yaml` does **not** round-trip comments at
  all; `eemeli/yaml` has a CST mode that *can*, but both are **npm packages**. Our constraint #1 forbids that
  at install time. **Match? NO** — disqualified by deployment context, not capability.
- C1: **HARD FAIL** — `require("yaml")` → `MODULE_NOT_FOUND` (§2). The §7 builtin-`JSON.parse` trick has **no
  YAML analog** (`node:yaml` → `ERR_UNKNOWN_BUILTIN_MODULE`). Bundling/vendoring a parser into install.sh = new
  dep + maintenance + size, violating C2.
- **Outcome: DISQUALIFIED on C1** (definitive, mechanically proven).

### C-C — REFERENCE `rhysd/actionlint`
- **T16:** Upstream = *read-only static workflow validator*. Our problem = *mutate the workflow*. **Match? NO —
  it is not a merger at all** (Q3: "strictly read-only… does not edit/merge/modify").
- **Outcome: NOT A CANDIDATE for merging.** REFERENCE-only value: an optional post-merge *validation* step
  (lint the result) — out of S3 scope, noted for a future hardening pass.

### C-D — BUILD a targeted bash/awk append-if-absent (the issue's own suggestion)
- **T16:** Problem class is *ours* by construction — no upstream. The 6-item checklist (§7) governs the
  negative-existence claim.
- C1: **PASS** — pure shell, no node, no npm.
- C2: **WEAK-to-MEDIUM** — zero new dep (good), but a hand-rolled YAML-aware text editor is **high-risk
  perpetual maintenance**: detecting "the right job's `steps:` block at the right indent" across arbitrary
  consumer formatting (tabs?, `steps :` spacing, multi-doc `---`, flow-style `steps: [ ... ]`, matrix jobs,
  reusable `uses:` jobs with no `steps:`) is a long tail of edge cases. This is the §4 "naive append targets
  the wrong indent" footgun.
- C3: **AT RISK** — BSD awk 20200816 vs GNU gawk differ (gensub, `length(array)`, `\s`, in-place `-i`); a
  portable awk that edits whitespace-significant YAML by hand is fragile across both.
- C4 (idempotent): achievable (grep-guard before append) **only** for the simplest single-line-`run:` case.
- C5: **AT RISK** — a text-level append can land inside the wrong job or after the wrong indent boundary.
- C6 (comments): **PASS for the consumer's *existing* lines** (append-only, never rewrites what's there) —
  this is BUILD's one genuine edge over yq: it touches nothing it didn't add. But it only safely handles the
  *block-style, single job, indent-discoverable* shape; anything exotic silently mis-targets.
- **Outcome: SURVIVES only in a NARROW form** — safe *append-only* for the common case, but the YAML-shape long
  tail makes a *general* in-place BUILD a maintenance trap (T11 counter: don't BUILD a fragile parser when the
  honest minimum avoids parsing entirely).

### C-E — HYBRID (broadened WARN + job-scoped paste-ready block; optional detect-first `--wire-ci` using yq)
- **T16:** Problem class = *get the missing gates into the consumer's CI **safely**, preferring the consumer's
  own informed action over a risky silent rewrite*. No upstream "installer that prints a paste-ready scoped
  block + optionally auto-wires via a detected tool" — it's a **composition** of (a) the §7-style honest
  non-destructive posture and (b) opt-in tool use. **Match? This IS our problem class.**
- C1: **PASS** — WARN + echo path needs no node, no npm, no yq. Auto-wire path runs **only if yq is detected**.
- C2: **STRONG** — default path adds **zero** dependency (pure echo, like the §7 `node`-absent fallback at
  `:747`). yq is *used-if-present, never required, never installed by us* — matches
  [companion-install-principle.md §1](../../../.claude/rules/companion-install-principle.md) (detect-first, no
  pin, degrade gracefully) and BFR §1.1 shipped-axis (integrate, never hard-depend).
- C3: **PASS** — echo is universal; the yq path inherits yq's own portability.
- C4: **PASS** — WARN/echo is naturally idempotent (re-running re-prints, mutates nothing); the optional yq path
  uses `unique`/`unique_by` (Q2).
- C5: **PASS** — default never touches the file; the consumer pastes into the right job themselves (they own
  their CI), or the detected-yq path does a targeted append.
- C6: **PASS** — default path **cannot** corrupt comments (it writes nothing). The yq auto-wire path is opt-in,
  shows the result (or runs in a confirmed `--wire-ci` flow), so the best-effort-comment risk is the consumer's
  informed choice, not a silent brownfield default.
- **Outcome: SURVIVES — best constraint profile.** It is the *honest minimum* (the issue's "at minimum broaden
  the WARN + print the complete set of steps") **plus** an opt-in auto-wire for users who have/accept yq, with
  the silent-rewrite risk (C6) confined to an explicit flag.

## 7. phase-research-coverage §1 6-item checklist (on "no upstream purpose-built merger fits")

1. **SSOT consult** — done (§3): 0/115 rows match; new row needed.
2. **DeepWiki ≥3 phrasings on candidate repos** — done (§4): yq (preservation + idempotence), actionlint (read-only).
3. **WebSearch ≥3 phrasings on the problem domain** — done (§5): no dedicated idempotent comment-preserving step-injector; `actions/runner#2079` is an *open request*.
4. **context7 intentionally excluded** — per BFR §3 tooling caveat (library-API docs, not "does tool X exist?"). Not used for the verdict.
5. **T16 problem-class check per candidate** — done (§6): each candidate's X-vs-Y match stated with evidence.
6. **Negative-existence claim is scoped, not blanket** — claim is **"no upstream tool *guarantees* idempotent,
   comment-preserving, in-place inject-if-absent into a named job's steps at install time with zero install
   dependency."** yq exists and gets 80% there (idempotence yes; preservation best-effort) but fails the
   guarantee + zero-dep halves. This is a *misfit*, not a void — recorded honestly.

## 8. SSOT row to append (drafted — orchestrator/Stage-P appends; do NOT edit prior-art-evaluations.md here)

Next free ID is **#117** (current max row on **live `staging` = #116** — verified via
`gh api .../contents/...prior-art-evaluations.md?ref=staging | base64 -d | grep -oE '^\| [0-9]+ '`. NB the
local checkout was stale (max #115); #116 landed via PR #520 on live staging. The Worker's earlier "#111/#112"
was a separate mis-sorted-grep artifact. **Re-verify against live `staging` at append time** — Stage P must not
trust this number from a possibly-stale checkout). Draft row text:

```text
| 117 | `mikefarah/yq` (Go YAML processor) — idempotent sequence append via `.jobs.JOB.steps += [{run:…}] | … |= unique` (DeepWiki-verified 2026-06-14) — and the absence of any purpose-built idempotent, comment-preserving GH-Actions step-injector (WebSearch ×3 + `actions/runner#2079` open feature request) | Brownfield CI-wiring (#521): non-destructively add missing rule-enforcement steps (`check-rule-globs.sh`/`arch:check`/`audit:docs`/`check:lintstaged`) into a consumer's pre-existing `.github/workflows/*.yml` without clobbering it | 2026-06-14 | 2026-06-14 | HYBRID (REFERENCE yq + BUILD warn/echo) | Six-layer BFR §3 (2026-06-14-s3-workflow-merge-adopt-vs-build.md). **T16:** yq edits YAML generally; OUR problem needs a *guarantee* of comment/anchor/quoting preservation on in-place inject — DeepWiki + WebSearch confirm yq's preservation is **best-effort with documented whitespace issues; cannot guarantee comments on merge** → DISQUALIFIED as the silent brownfield default. node YAML libs DISQUALIFIED on constraint #1 (no node_modules at install; `node:yaml` builtin absent — the §7 builtin-`JSON.parse` trick has no YAML analog). actionlint is **read-only** (not a merger). Verdict = **HYBRID**: BUILD the broadened, zero-dependency CI-orphan WARN + a job-scoped paste-ready YAML block (honest minimum, cannot corrupt comments — writes nothing); REFERENCE yq as an **opt-in, detect-first** `--wire-ci` auto-wirer (used-if-present, never installed/pinned by us per companion-install-principle.md §1, degrades to the paste-block when absent). **Velocity: yq STABLE (v4.x).** | A purpose-built idempotent comment-preserving GH-Actions step-injector ships upstream; OR `actions/runner#2079` lands native step-injection; OR a consumer demands silent auto-merge as default (re-weigh yq best-effort risk vs the paste-block) |
```

## VERDICT

**HYBRID** — BUILD a zero-dependency *broadened WARN + job-scoped paste-ready YAML block* as the default
brownfield path; REFERENCE `mikefarah/yq` as an **opt-in, detect-first `--wire-ci`** auto-wirer that degrades
gracefully to the paste-block when yq is absent. **No silent in-place YAML rewrite as the brownfield default.**

**Rationale.** The one disqualifier that decides this is constraint #6 (comment/structure preservation). The
strongest ADOPT candidate (yq) *attempts* preservation but, per its own docs (DeepWiki Q1) and the merge
literature (WebSearch S2), has **documented whitespace issues and no merge-time comment guarantee** — so making
it the *silent brownfield default* risks corrupting the consumer's most important file while exiting 0 (T16
`#pattern-matching-on-name`). The node-YAML-lib path is **mechanically impossible** at install time (no
node_modules, no builtin YAML; the §7 `JSON.parse` trick does not transfer). actionlint is read-only. A *general*
bash/awk in-place editor is a BSD/GNU-portability + YAML-shape-long-tail maintenance trap (T11). What is left,
and what the issue itself asks for "at minimum", is the honest non-destructive posture the §7 precedent already
embodies: **only add what's safe, never silently rewrite.** The paste-ready block delivers the gates' content
with zero corruption risk and zero new dependency; the opt-in yq path serves users who have/accept yq, with the
preservation risk confined to an explicit, visible flag.

**FALSIFIER.** This verdict is wrong if (a) yq's in-place edit is shown to preserve comments/anchors/quoting
**byte-for-byte** on a representative consumer workflow corpus (≥5 real comment-heavy workflows, diff = only the
added steps) — then yq becomes a safe *default* merger and the verdict shifts to ADOPT-yq-default; OR (b) a
purpose-built idempotent comment-preserving GH-Actions step-injector ships upstream (kills BUILD); OR (c) the
maintainer decides the brownfield UX *requires* silent auto-merge (no paste step) and accepts yq's best-effort
preservation as good-enough — then HYBRID collapses to "yq-if-present, warn-if-absent."

**Integration-cost estimate** (counter to BFR §4 `#integration-overhead-overestimate` — measured, not assumed):
- *BUILD half (default):* broaden the `:653-667` grep from one pattern to four (`check:globs|arch:check|audit:docs|check:lintstaged`), per-gate "missing" detection, and a heredoc paste-block that names the consumer's detected job. **~40-60 LOC of shell, no new dep, no new tool.** Lower than a yq-default merger because there is no YAML parsing to get right.
- *REFERENCE half (opt-in `--wire-ci`):* `command -v yq` guard → the `+= … | unique_by(.run)` expression per missing step, scoped to the detected job; absent-yq → fall through to the paste-block. **~25-40 LOC.** Zero install/pin burden (we never install yq — companion-install-principle.md §1).
- *vs a yq-default merger:* would need job-name auto-detection **plus** a comment-corruption guard (diff-and-revert-on-reflow) to be safe — *more* code than HYBRID, with worse failure semantics. HYBRID is the cheaper *and* safer point.

**Stage-P implementation sketch (WARN × merge interaction).**
1. **Detect the gap once** (shared by both halves): for each of the 4 gates, grep all `.github/workflows/*.{yml,yaml}` for its invocation; build the missing-set.
2. **Default path (always, zero-dep):** if missing-set non-empty → broadened WARN naming **each** absent gate (fixing the §1 under-report) + a paste-ready `- run:` block scoped to the consumer's detected lint/test job name. Mutates nothing; idempotent; cannot corrupt comments.
3. **Opt-in path (`--wire-ci`, or interactive `[y/N]` mirroring the §8 dep-install prompt):** if yq is detected, run the idempotent `unique_by(.run)` append per missing step into the detected job, then re-run step 1 — **if the gap closed, suppress the WARN** (merge-then-no-warn); **if yq absent or `--wire-ci` declined, keep the broadened WARN + paste-block** (warn-when-merge-declined). So WARN and merge are mutually exclusive on success, complementary on decline.
4. **Paired-negatives (per `f12-workflow-integrity-shipped.test.sh` pattern):** (pos) brownfield consumer with a kept workflow missing `arch:check` → broadened WARN names `arch:check` (not just globs); (neg, load-bearing) a consumer whose workflow already wires all 4 gates → **no WARN, no paste-block** (proves the broadened detection is not vacuous); (`--wire-ci` arm) yq present + `--wire-ci` → step appended once, re-run = no duplicate (idempotence), and the consumer's planted comment line survives verbatim.

**Capability commit?** **YES for Stage P** — adding a `--wire-ci` flag that shells to yq is a new capability, and
the broadened WARN + paste-block + tests likely cross the ≥80-LOC threshold. Stage P's `Prior-art:` trailer must
cite the **new SSOT #117** drafted in §8 (not the escape hatch), per kickoff §7. (Note: it adds **no** entry to
`package.json` dependencies and installs **no** binary — yq is detect-first/used-if-present — so it is a
capability commit by the LOC/new-file rule, not by the dependency rule.)

## §1.7 self-review (forward-check — research-only patch, no rule introduced)

**Forward-check** (this patch complies with active disciplines): the verdict is produced by the full
[build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) six-layer mechanism
(SSOT consult §3 + DeepWiki ×3 §4 + WebSearch ×3 §5 + 6-item checklist §7 + T16-per-candidate §6 + the macro
rule), with context7 correctly excluded per the §3 tooling-caveat; it honours
[no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (zero API-billed calls — DeepWiki/WebSearch
are session tools); the recommended HYBRID respects [companion-install-principle.md §1](../../../.claude/rules/companion-install-principle.md)
(detect-first, no version pin, degrade gracefully) and BFR §1.1 shipped-axis (integrate, never hard-depend).
**No backward-check** is owed: this is a research-only ADOPT-vs-BUILD evaluation — it introduces no rule or
discipline whose scope would need a complete-artefact sweep (the eventual SSOT #117 row + Stage-P trailer are the
recording-layer follow-through, landed with the capability commit per [CLAUDE.md Build-vs-reuse invariant](../../../CLAUDE.md)).
**T15 self-application:** the resolver applies the very discipline it invokes (BFR) to its own verdict.

## See also
- [`.claude/orchestrator-prompts/universalization-fix-s3/kickoff.md`](../../../.claude/orchestrator-prompts/universalization-fix-s3/kickoff.md) — Stage map; §4 binding scope.
- [GH #521](https://github.com/Yhooi2/rules-as-tests-aif/issues/521) — consumer report + "Proposed direction".
- [`install.sh:677-749`](../../../install.sh) — §7 package.json non-destructive merge precedent (the bar this matched on posture, diverged on parser availability).
- [`.claude/rules/build-first-reuse-default.md §1.1 / §3`](../../../.claude/rules/build-first-reuse-default.md) · [`companion-install-principle.md §1`](../../../.claude/rules/companion-install-principle.md) · [`dual-implementation-discipline.md §3`](../../../.claude/rules/dual-implementation-discipline.md) — governing discipline.
- [`tests/install-sh/f12-workflow-integrity-shipped.test.sh`](../../../tests/install-sh/f12-workflow-integrity-shipped.test.sh) — paired-negative test template for Stage P.
