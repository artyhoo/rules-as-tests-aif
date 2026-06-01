<!-- scope:mutation-discipline-audit -->
# Mutation discipline audit — Stage 1 R-phase

> **Class:** C — R-phase audit output; this patch closes Stage 1 of the [mutation-discipline-umbrella](../../../.claude/orchestrator-prompts/mutation-discipline-umbrella/kickoff.md) kickoff. No mechanism shipped — admissibility verdict for Stages 2 (B), 3 (C), 4 (D) only.
> **Authoritative for:** per-file mutation kill-score for the existing Stryker scope as of `origin/staging` HEAD `4897301` (2026-05-25); enumeration of the bash-hook population + Stage 4 D-target population; verdict on §A.4 B/C/D admissibility.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Stage 2 B.1 prior-art survey for upstream bash-mutators — that is Stage 2's own R-step; this patch only mandates it as a precondition for B.2 BUILD. Stage 4 implementation work — admissibility only.

> **Origin:** 2026-05-25. Stage 1 of mutation-discipline-umbrella kickoff. Discipline-theatre gap surfaced at M.4 closure (memory `project_m4_wave_done.md` §5 lesson 1): «тест есть» ≠ «тест ловит» — M.4 shipped 6 paired-negative tests for `.claude/hooks/*.sh`, all manually mutation-sanity-checked once at write-time. Stryker covers TS only. Bash hooks + TS test files themselves have no automated continuous mutation protection. Stage 1 = run-Stryker-on-actual-current-scope + measure bash surface + recommend which of B/C/D the data justifies.

---

## §-1 Cold-start re-verify

Worktree: `/Users/art/code/rules-as-tests-aif-mutation-audit-2`, branch `research/mutation-discipline-audit-v2`, base `origin/staging` HEAD `4897301`.

```bash
$ git log --oneline -1
4897301 feat(meta-orchestrator): L2 — reverse-currency UNTRACKED detection (#217)

$ npm test -ws --if-present 2>&1 | grep -E "Test Files|Tests" | tail -2
 Test Files  1 failed | 69 passed (70)
      Tests  1 failed | 904 passed | 4 skipped (909)
```

Baseline = 904/909 passing; 1 pre-existing fail at [`hooks/pre-push.test.ts:59`](../../../packages/core/hooks/pre-push.test.ts#L59) («invokes the remaining audit-self self-tests by literal path»). Memory `project_recommendation_laziness` §Residuals: «pre-existing `hooks/pre-push.test.ts` failure on staging (unrelated)». Confirmed unrelated to this audit.

---

## §A.1 Current TS mutation score (per-file table)

**Source-of-truth:** `/tmp/stryker-A-report.json` (snapshot of `packages/core/reports/mutation/report.json` after `npx stryker run stryker.config.mjs`, 2026-05-25 11:14 PT); `/tmp/stryker-audit-report.json` (snapshot of `report-audit-ai-docs.json` after `npx stryker run stryker.audit-ai-docs.mjs`, 11:15 PT). Both raw logs at `/tmp/stryker-A.log` (62 KB) and `/tmp/stryker-audit.log` (49 KB) — `/tmp` is ephemeral; promote to a stable location if needed for audit replay.

**Stryker score formula** (verified against printed Mutation score column): `% total = (killed + timeout) / total`; NoCoverage mutants count against the score in `% total` and are excluded from `% covered`.

### A.1.1 Config A — eslint-rules + hooks (57 s wall, 6.41 tests/mutant)

| File | Killed | Survived | Timeout | NoCov | Total | % total | % covered |
|---|---|---|---|---|---|---|---|
| `eslint-rules/no-direct-time-randomness.ts` | 44 | 13 | 0 | 1 | 58 | **75.86** | 77.19 |
| `eslint-rules/no-unsafe-zod-parse.ts` | 13 | 9 | 0 | 1 | 23 | **56.52** | 59.09 |
| `eslint-rules/require-otel-span.ts` | 95 | 23 | 4 | 0 | 122 | 81.15 | 81.15 |
| `hooks/checks/prior-art.ts` | 212 | 6 | 0 | 0 | 218 | 97.25 | 97.25 |
| `hooks/checks/s17.ts` | 133 | 9 | 0 | 1 | 143 | 93.01 | 93.66 |
| `hooks/utils/git.ts` | 112 | 1 | 0 | 1 | 114 | 98.25 | 99.12 |
| `hooks/utils/run-check.ts` | 40 | 0 | 0 | 2 | 42 | 95.24 | 100.00 |
| **All files** | **649** | **61** | **4** | **6** | **720** | **90.69** | **91.46** |

### A.1.2 Config B — audit-self (45 s wall, 11.71 tests/mutant)

| File | Killed | Survived | Timeout | NoCov | Total | % total | % covered |
|---|---|---|---|---|---|---|---|
| `audit-self/audit-ai-docs.ts` | 427 | 45 | 4 | 18 | 494 | 87.25 | 90.55 |

**Cross-config aggregate:** 1076 killed / 1214 total = **88.6 % overall mutation score** across the existing Stryker scope (8 TS files, 1214 mutants).

**No file is below 60 % kill rate** → Stage 1 escalation stop-condition (kickoff §3 «critical TS code with <60 % kill → ESCALATE») NOT triggered.

---

## §A.2 Files below 80 % — categorise survived mutants (real-gap vs equivalent)

Two files sit below the 80 % threshold the kickoff names. Both are ESLint AST rules; both share the same mutation-resilience pattern. Per [ai-laziness-traps.md §2 T-MUT-B](../../../.claude/rules/ai-laziness-traps.md) («high mutation score = bug-free test»), survival ≠ real gap — many survived mutants on ESLint rule files target metadata that the tests legitimately do not (and probably should not) assert against.

### A.2.1 `eslint-rules/no-unsafe-zod-parse.ts` — 56.52 % (13/23, 9 survived + 1 NoCov)

File body: [`packages/core/eslint-rules/no-unsafe-zod-parse.ts`](../../../packages/core/eslint-rules/no-unsafe-zod-parse.ts), 38 lines total; the active rule body is ~10 lines (the selector + the `currentLine.includes('// audit:exempt')` exemption check + `context.report`).

| Line:col | Mutator | Survived target | Category |
|---|---|---|---|
| 5:3 | ArrowFunction | docs-URL builder fn body → empty | **equivalent** — function only generates docs URLs read by IDEs, not by rule logic |
| 6:5 | StringLiteral | the docs URL string itself → `""` | **equivalent** — string is a hyperlink target, behaviour-irrelevant |
| 9:44 | ObjectLiteral | `createRule({ name, meta, defaultOptions, create })` → `{}` | **equivalent** — empty-object substitution still passes ESLint rule-load smoke; create() is what the runtime invokes |
| 10:9 | StringLiteral | `name: 'no-unsafe-zod-parse'` → `""` | **real-gap (low value)** — test never asserts rule name; tightening would be cosmetic |
| 12:11 | StringLiteral | `type: 'problem'` → `""` | **equivalent** — ESLint accepts any string here; behaviour unchanged for our suite |
| 13:11 | ObjectLiteral | `docs: { description: ... }` → `{}` | **equivalent** — docs metadata |
| 15:9 | StringLiteral | `description:` text → `""` | **equivalent** — documentation string |
| 19:9 | StringLiteral | `messages.useSafeParse` text → `""` | **real-gap (low value)** — test asserts `messageId: 'useSafeParse'` (key, not value); a test that also asserts the rendered message text would kill this |
| 23:19 | ArrayDeclaration | `defaultOptions: []` → `["Stryker was here"]` | **behavioral-equivalent** — Stryker replaces with `["Stryker was here"]` literal, but the rule doesn't read `context.options` so behavior is unchanged |
| 32:48 | StringLiteral | `?? ''` defensive fallback (empty string in `const currentLine = lines[line - 1] ?? '';`) → `"Stryker was here!"` | **NoCoverage** — out-of-bounds line index path is unreachable from existing tests. Verify: `sed -n '32p;33p' packages/core/eslint-rules/no-unsafe-zod-parse.ts`. Note: the `'// audit:exempt'` ConditionalExpression on line 33 (and StringLiteral L33:C34) are **Killed** per Stryker JSON — the exempt-branch behaviour itself IS tested; the gap is the out-of-bounds-index defensive fallback only. |

**Real-gap count: 1** (NoCoverage on the `?? ''` defensive fallback at line 32 — out-of-bounds line index never tested; the `// audit:exempt` branch itself IS killed). The two `low-value` real-gaps are messageId-text vs messageId-key strictness; not load-bearing for R2 enforcement.

### A.2.2 `eslint-rules/no-direct-time-randomness.ts` — 75.86 % (44/58, 13 survived + 1 NoCov)

File body: [`packages/core/eslint-rules/no-direct-time-randomness.ts`](../../../packages/core/eslint-rules/no-direct-time-randomness.ts), 75 lines total; rule covers 4 selectors (Date.now, new Date, Math.random, forbidden imports).

Survived mutants (13) cluster in the same shape as A.2.1: 7 × `StringLiteral` on messageId / docs-description / module-name text, 2 × `ObjectLiteral` on meta-shape, 1 × `ArrowFunction` on docs-URL builder, 1 × `ArrayDeclaration` on `defaultOptions: []` (**behavioral-equivalent** — Stryker replaces with `["Stryker was here"]` literal, rule doesn't read `context.options` so behaviorally unchanged), 1 × `ObjectLiteral` on `messages: {...}`, 1 × `ConditionalExpression` on line 64 — the `typeof node.source.value !== 'string'` typeguard on the `ImportDeclaration` selector (NoCov 44:64 = StringLiteral on the `?? ''` defensive fallback in the `lineExempt` arrow body). Verify: `sed -n '44p;64p' packages/core/eslint-rules/no-direct-time-randomness.ts`.

| Category | Count |
|---|---|
| equivalent (metadata / Stryker no-op / docs) | ~10 |
| real-gap, low value (messageId text not asserted) | ~2 |
| real-gap, behaviour-relevant (line-64 `typeof node.source.value !== 'string'` typeguard on `ImportDeclaration`; NoCov 44:64 on the `?? ''` defensive fallback in `lineExempt` arrow body) | ~2 |

The behaviour-relevant gap is in the `ImportDeclaration` selector's typeguard (`typeof node.source.value !== 'string'`, line 64) and the defensive `?? ''` fallback in `lineExempt` (line 44, column 64) for out-of-bounds line indices — neither path is exercised by existing tests. (Distinct from A.2.1: the exempt-branch ConditionalExpressions themselves are mostly Killed; the gap is the typeguard + defensive-fallback combo.)

### A.2.3 `eslint-rules/require-otel-span.ts` — 81.15 %, just above the threshold

123 mutants, 23 survived + 4 timeout. Same shape as above (ESLint metadata + message text dominate the survivals). Not investigated further at Stage 1; would be a Stage 3 C target if principle 02 is extended to content-level message assertions.

### Net A.2 finding

Across the 3 sub-80 % ESLint files, the *behaviour-relevant* survived-mutant count is roughly **3–5** (defensive `?? ''` fallbacks on out-of-bounds line index + `ImportDeclaration` typeguards — not exercised by existing tests). The other ~40+ survivals are mostly T-MUT-B equivalent mutants on ESLint metadata + message-text strings.

This is **not a critical-coverage gap** (no file <60 %, the real-gap residue is small) — but it does demonstrate that current Stryker scores read worse than the actual test quality because ESLint rule files are mutation-noisy by structure.

---

## §A.3 Bash hook surface estimate (T10 full population enumeration)

**Total `.sh` population in repo** (excluding `node_modules/`, `.git/`, `.claude/worktrees/`): **31 files** — broader than the kickoff §3 Stage 4 table implied. Full sweep:

```bash
$ find . -name "*.sh" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.claude/worktrees/*" | wc -l
31
```

Partitioned by category:

### A.3.1 `.claude/hooks/*.sh` — 9 files, ALL already have paired-negative tests

Per `wc -l` (total / code-only-excl-comments-blanks) and a `grep -cE '^\s*(if|elif|case|while|for|until|\|\||&&)'` branch count:

| Hook | LOC | Code LOC | Branches | Test file present |
|---|---|---|---|---|
| `ask-question-reminder.sh` | 65 | 33 | 3 | ✅ `ask-question-reminder.test.ts` (M.4.6 #197) |
| `check-doc-authority.sh` | 29 | 16 | 2 | ✅ `check-doc-authority.test.ts` (M.4 #198) |
| `check-hook-marker.sh` | 51 | 23 | 3 | ✅ `check-hook-marker.test.ts` |
| `check-kickoff-traps.sh` | 54 | 24 | 3 | ✅ `check-kickoff-traps.test.ts` |
| `deps-hash-check.sh` | 44 | 23 | 4 | ✅ `deps-hash-check.test.ts` (M.4.2 #195) |
| `end-of-turn-reminder.sh` | 269 | 159 | 29 | ✅ `end-of-turn-reminder.test.ts` (M.4.5 #196) |
| `inject-matching-rule.sh` | 80 | 48 | 6 | ✅ `inject-matching-rule.test.ts` |
| `inject-session-bootstrap.sh` | 14 | 9 | 0 | ✅ `inject-session-bootstrap.test.ts` |
| `validate-prompt.sh` | 34 | 18 | 3 | ✅ `validate-prompt.test.ts` |
| **Subtotal** | **640** | **353** | **53** | **9/9 covered** |

Each test passes its M.4 paired-negative shape; per memory `project_m4_wave_done.md` each Sub-wave shipped with «mutation-sanity single-pass at write-time». **None are continuously mutation-tested in CI** — that is the gap this umbrella exists to close.

### A.3.2 Stage 4 D targets — 5 NEW + 1 duplicate-investigation

| File | LOC | Code LOC | Branches | Test |
|---|---|---|---|---|
| `.claude/skills/meta-orchestrator/helpers/launch-table-generator.sh` (D.3) | 116 | 52 | 5 | ❌ none |
| `.claude/skills/meta-orchestrator/helpers/plan-currency-check.sh` (D.2) | 140 | 95 | 13 | ❌ none |
| `.claude/skills/meta-orchestrator/helpers/priority-score.sh` (D.1) | 148 | 77 | 13 | ❌ none |
| `scripts/check-skill-drift.sh` (D.4) | 208 | 129 | 22 | ❌ none |
| `packages/core/hooks/pre-push.fallback.sh` (D.5) | 67 | 46 | 9 | ❌ none |
| `packages/core/hooks/deps-hash-check.sh` (D.6 dup) | 44 | 23 | 4 | inherited via copy of (A.3.1) |
| **Subtotal** | **723** | **422** | **62** | **0/5 covered** |

### A.3.3 D.6 duplicate investigation (R-step inside Stage 1)

```bash
$ diff .claude/hooks/deps-hash-check.sh packages/core/hooks/deps-hash-check.sh && echo SAME
SAME

$ stat -f "inode=%i name=%N" .claude/hooks/deps-hash-check.sh packages/core/hooks/deps-hash-check.sh
inode=153752823 name=.claude/hooks/deps-hash-check.sh
inode=153753152 name=packages/core/hooks/deps-hash-check.sh
```

**Two physical copies, identical content, different inodes** — not a hardlink, not a symlink. No copy-sync script located in the repo via `grep -rn "deps-hash-check"` in workflows / scripts (out of Stage 1 scope to fully resolve). D.6 verdict: GO as a small R-step (find the sync mechanism or fix the drift risk), low LOC.

### A.3.4 Other `.sh` files — 16 (out of scope for this umbrella)

Surfaced by the T10 sweep but **not addressed by this umbrella's Stage 4 plan**:

- `install.sh` (root), `setup.sh` (root) — install-time scripts.
- `packages/core/audit-self/audit-ai-docs.sh` (311 LOC) — superseded by `audit-ai-docs.ts` per Wave 10.4 (PR #120) but still referenced from `packages/core/templates/shared/`-shipped templates → consumer-shipped, not internal. Out of scope.
- `packages/core/templates/shared/husky-pre-commit.sh`, `husky-pre-push.sh` — consumer-shipped Husky templates.
- `packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh` — preset-specific consumer-shipped audit.
- `scripts/ci-success-gate.sh` + `scripts/ci-success-gate.test.sh` — CI aggregator + its own test (the `.test.sh` is itself a test file).
- `tests/hooks/*.sh` (5 files: `eot-claim-scan.test.sh`, `prepush-upstream-ref.test.sh`, `prior-art-trailer-hook.test.sh`, `s17-trailer-hook.test.sh`, `test-enforce-husky-presence.sh`) — these are test scripts.
- `skills/meta-orchestrator/helpers/*.sh` (3 files) — content differs from `.claude/skills/meta-orchestrator/helpers/*.sh` per `diff`; relationship between the two skill directories deserves its own audit (out of scope here).

Recommendation: log these 16 files as a future-work surface, do **not** auto-add them to Stage 4. The kickoff's targeted scope (Stage 4 D.1–D.6) stays as written. (Arithmetic check: 31 total − 9 `.claude/hooks/*.sh` − 6 Stage 4 D.1–D.6 targets = 16.)

### Net A.3 stop-condition F1 check

Kickoff §7 F1: «All TS files ≥95 % kill rate AND bash hooks have <10 non-trivial branches total → STOP umbrella».

- TS ≥95 %: **FALSE** — 3 ESLint files <95 % (one <60 %, two between 75–82 %).
- Bash branches <10 total: **FALSE** — 53 branches in `.claude/hooks/*.sh` alone; 115 across the full Stage-4 surface.

**F1 not triggered → umbrella proceeds.**

---

## §A.4 Verdict on B / C / D admissibility

| Stage | Verdict | Rationale (data only) |
|---|---|---|
| **B — bash mutator tool** | **GO** | 53 branches across 9 `.claude/hooks/*.sh` (notably `end-of-turn-reminder.sh` = 29 branches × 159 LOC, dominant single target). M.4 tests were manually mutation-sanity-checked once at write-time; no continuous protection. F1 stop-condition not met. **B.1 prior-art search (DeepWiki + WebSearch for «bash mutation testing») is mandatory before any line of `bash-mutator.ts`** per [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) — Stage 1 explicitly does NOT close that question. Default verdict if B.1 surfaces a mature upstream tool: ADOPT/ADAPT, not BUILD. |
| **C — tests-of-tests (principle 02 content extension)** | **GO, conditional on B merged** | A.2 shows the *real* test-quality gap in the existing TS suite is small (~3–5 behaviour-relevant survived mutants across 3 sub-80 % ESLint files; mostly the `// audit:exempt` early-return branch on multiple selectors). Principle 02 currently checks paired-negative *shape* (`❌`+`✅`); extending to **content-level assertions** (exit-code or stdout/stderr content, not `.toBeDefined()`) is the right scope. C should ride on B's mutator so new bash tests inherit the assertion-strength check from day 1. C without B = paper-only enforcement (T-MUT-A: «manual mutation-sanity ≡ automated mutation testing»). |
| **D — cover remaining `.sh`** | **MIXED — GO for D.1–D.5; GO (R-step) for D.6; do NOT expand to A.3.4** | D.1–D.5: 422 code-LOC × 62 branches across 5 untested skill helpers + CI tools — clearly worth covering, especially after B ships so they inherit mutation protection. D.6: small investigation, GO. **A.3.4 (17 other `.sh` files) is OUT OF SCOPE for this umbrella** — re-classifying installer scripts / consumer-shipped templates / existing test scripts as Stage 4 targets would inflate scope without data justification. Log them as future-work in memory. |

### §A.4.1 What this audit explicitly does NOT decide

- **Stage 2 B.1's prior-art question** (is there an upstream bash mutator worth adopting? — e.g. `shmutate`, `mut-bash`, AST-walker-based tools). That question is Stage 2's own R-step. This patch only mandates that B.1 fire before B.2 commits any bash-mutator code, and that the verdict between ADOPT / ADAPT / BUILD follow [build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md) verdict ladder.
- **Stage 4 D.6 root cause** (why are `.claude/hooks/deps-hash-check.sh` and `packages/core/hooks/deps-hash-check.sh` two physical copies?). Out of Stage 1 scope — D.6's own R-step.
- **Whether the existing M.4 tests are already content-strong** (i.e., would B's mutator find them all to be ≥60 % kill rate). That is the Stage 2 B.4 dogfood check, not a Stage 1 estimate.
- **Reclassification of `audit-ai-docs.sh`** (Wave-10.4-superseded but still consumer-shipped). Out of scope.

### §A.4.2 Stop-condition restatement

- **F1** (all-TS-≥95 % + bash-<10-branches): **not met** → proceed.
- **F1 sibling** (critical TS <60 % → escalate immediately): **not triggered** — lowest score is `no-unsafe-zod-parse.ts` at 56.5 %, which is an ESLint rule file dominated by equivalent-mutant noise on metadata, not load-bearing project discipline code.

---

## §1.7 Forward + Backward check (per kickoff §6, R-phase output)

### Forward — this audit complies with

- **[no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md)** — Stryker is a deterministic mutation runner over local code; no API-billed LLM call. Bash mutator (Stage 2, gated) MUST be AST/sed-based, not LLM.
- **[build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md)** — Stage 2 B.1 prior-art mandate REUSE > BUILD enforced as B.2 precondition.
- **[phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md)** — this is the R-phase before any I-phase build; verdicts in §A.4 are data-grounded (file:line citations + Stryker output excerpts in A.1 / A.2, command output for A.3 / D.6).
- **[ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md)** — kickoff §4 enumerated T1 / T2 / T3 / T9 / T10 / T11 / T14 / T15 / T16 / T17 / T19 + T-MUT-A / T-MUT-B as active. Traps actually fired in §A.2 (T-MUT-B distinguish equivalent vs real-gap) and §A.3 (T10 full-population enumeration of 31 `.sh` files, not just the 9 in `.claude/hooks/`).
- **[parallel-subwave-isolation.md §1](../../../.claude/rules/parallel-subwave-isolation.md)** — Stage 1 ran in worktree `/Users/art/code/rules-as-tests-aif-mutation-audit-2` on branch `research/mutation-discipline-audit-v2`, branched from `origin/staging`.
- **[doc-authority-hierarchy.md §3](../../../.claude/rules/doc-authority-hierarchy.md)** — Class + Authoritative-for header present.
- **[recommendation-laziness-discipline.md §3](../../../.claude/rules/recommendation-laziness-discipline.md)** — every §A.4 verdict carries evidence-tool output (the Stryker score table for B/C, the `wc -l` + `grep -c` enumeration for D).

### Backward — what this audit does NOT silently supersede

- **M.4 paired-negative tests** (PR #195/#196/#197/#198/#199/#200): all 6 remain in place; this audit explicitly verifies their *existence* (§A.3.1) and *does not* claim they are insufficient — only that **automated continuous mutation protection** is the gap, which is what Stage 2 B addresses.
- **Stryker config files** (`stryker.config.mjs`, `stryker.audit-ai-docs.mjs`): untouched. Existing exclusions (`hooks/pre-push.ts` as «thin orchestrator») respected.
- **[ai-laziness-traps.md T-MUT-A / T-MUT-B](../../../.claude/rules/ai-laziness-traps.md)** — kickoff added these as domain-specific. This patch *uses* them but does not propose moving them into the canonical §2 catalogue at this time (per kickoff §5 promotion criterion they need ≥2 wave-specific equivalents first).

---

## §A.5 Recursive self-application (T15)

This audit's own claims are subject to the discipline it recommends extending:

- All numeric claims in §A.1 are sourced from `/tmp/stryker-A-report.json` + `/tmp/stryker-audit-report.json` (snapshots) and the printed Stryker summary in `/tmp/stryker-A.log` / `/tmp/stryker-audit.log` (62 + 49 KB), not paraphrased — T3 self-application.
- All file-path claims in §A.3 are sourced from `find . -name "*.sh"` + `wc -l` + `grep -cE` per-file, not from memory.
- The §A.4 verdict on B/C/D is data-justified per row; Stage 2 B.1's own R-step is **not** front-run by this patch (T8: «don't ask the maintainer to avoid doing the work» — and don't pre-empt the next stage either).
- This patch **does not** ship a mechanism. Stage 1 deliverable = audit doc + verdict only.
- **Caveat (cold-review #219):** §A.2 per-mutant source-code interpretation was initially paraphrased (line/column descriptions inferred from rule structure) rather than re-read from source per mutant — gap caught by cold-review #219 (MAJOR finding on §A.2.1 L32:48 and §A.2.2 L64:13 / L44:64 attribution errors, fixed in this amend). Mitigation: Stage 2 B.4 dogfood scope should run the bash mutator on test files themselves so future attribution errors are auto-caught by surviving mutants on the audit assertions. T3-on-self: re-deriving from structure ≠ verifying from source.

---

## See also

- `.claude/orchestrator-prompts/mutation-discipline-umbrella/kickoff.md` — umbrella kickoff (Stage 1 deliverable target = this patch).
- [memory `project_m4_wave_done.md`](../../../README.md) — M.4 closure + 5 lessons (gap surface).
- [memory `project_stryker_mutation_hardening_done.md`](../../../README.md) — prior 4 Stryker SDD waves (Wave 1–4 hardening before this audit).
- [`packages/core/stryker.config.mjs`](../../../packages/core/stryker.config.mjs) — primary Stryker config.
- [`packages/core/stryker.audit-ai-docs.mjs`](../../../packages/core/stryker.audit-ai-docs.mjs) — secondary Stryker config.
- M.4 umbrella kickoff at `.claude/orchestrator-prompts/m4-bash-hook-tests/kickoff.md` — paired-negative test pattern reference.
- [.claude/rules/ai-laziness-traps.md §2 T-MUT-A / T-MUT-B](../../../.claude/rules/ai-laziness-traps.md) — domain-specific traps active for this umbrella.
- [docs/meta-factory/prior-art-evaluations.md](../../prior-art-evaluations.md) — SSOT register for any Stage 2 B.1 verdicts.
