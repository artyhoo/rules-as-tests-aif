<!-- scope:bash-mutator-prior-art-b1 -->
# Bash-mutator prior-art survey — Stage 2 B.1 (mutation-discipline-umbrella)

> **Class:** C — R-phase prior-art survey output; closes Stage 2 **B.1** of the [mutation-discipline-umbrella](../../../.claude/orchestrator-prompts/mutation-discipline-umbrella/kickoff.md) kickoff. No mechanism shipped — this patch produces the BUILD-vs-REUSE verdict that gates B.2 (the actual bash-mutator build).
> **Authoritative for:** the B.1 prior-art verdict (is there a mature upstream bash/shell mutation tool worth adopting?); the candidate landscape surveyed (DeepWiki + WebSearch ≥3 phrasings each); the §1 6-item search-coverage check on the negative-existence sub-claim; SSOT row #91.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The Stage-1 audit verdict (B/C/D admissibility) — see [2026-05-25-mutation-discipline-audit.md §A.4](2026-05-25-mutation-discipline-audit.md). The B.2 build design (mutation operators, CI vs session-bound delivery) — that is Stage 2's own I-step, gated on the maintainer toolchain decision surfaced in §B.1.6.

> **Origin:** 2026-05-31. Stage 1 audit ([2026-05-25-mutation-discipline-audit.md §A.4](2026-05-25-mutation-discipline-audit.md)) returned **B = GO** (53 branches across 9 `.claude/hooks/*.sh`; `end-of-turn-reminder.sh` = 29 branches × 159 LOC the dominant single target) and explicitly mandated: «**B.1 prior-art search (DeepWiki + WebSearch for «bash mutation testing») is mandatory before any line of `bash-mutator.ts`** … Default verdict if B.1 surfaces a mature upstream tool: ADOPT/ADAPT, not BUILD.» This patch executes that B.1 search. Per [build-first-reuse-default.md §1/§3](../../../.claude/rules/build-first-reuse-default.md) the default is ADOPT/REFERENCE; BUILD only after the §3 mechanism confirms no upstream fits.

---

## §B.1.0 Dup-work guard (verify-against-source-of-truth, §1.11)

```bash
$ git fetch origin staging && git log --oneline -30 origin/staging | grep -i mutat
(no mutation-related commits in last 30 on origin/staging)
```

No bash-mutator merged by any parallel session as of 2026-05-31. Safe to proceed.

---

## §B.1.1 Methodology — candidate sweep (≥3 phrasings each channel)

**WebSearch (3 phrasings):**

1. `bash shell script mutation testing tool` → surfaced bash **test** frameworks (BATS, ShellSpec, bunit, bash_test_tools) + ShellCheck (static analysis). **Zero** bash *mutation* tools. The result text itself noted: «mutation testing appears to be less commonly implemented for shell scripts compared to traditional programming languages.»
2. `mutation testing framework for shell scripts mutate operators sed AST` → mutation frameworks for Python/JS/Java/Smart-contracts (mutmut, StrykerJS, PIT, Major, Mull) + an AST-mutation PoC ([MarkRedeman/ast-based-mutations](https://github.com/MarkRedeman/ast-based-mutations)). **Zero** shell-specific tools.
3. `language agnostic mutation testing universalmutator bash support` → [agroce/universalmutator](https://github.com/agroce/universalmutator) (regexp-rewrite, language-agnostic), [codeintegrity-ai/mutahunter](https://github.com/codeintegrity-ai/mutahunter) (LLM-based), `mewt` (language-agnostic core).

**Adversarial direct-name search (item-4 counter-prompt — «if a bash mutator existed, where would it live?»):**

4. `shmutate OR "mut-bash" OR "bash-mutate" mutation testing shell GitHub` → none of the three named tools exist. Returned generic mutation tools (mutmut, muter, dumbmutate, Stryker) + the [theofidry/awesome-mutation-testing](https://github.com/theofidry/awesome-mutation-testing) curated list. No dedicated bash mutator.

**DeepWiki (2 grounded queries on the only viable candidate):**

5. `agroce/universalmutator` — «does it support bash/.sh? how are operators defined per language?» → **No bash support shipped**; operators live in `.rules` files (`LHS ==> RHS`, regexp or Comby engine); supported langs = C/C++, Java, JS, Python, Swift, R, Rust, Go, Lisp, Fortran, Solidity/Vyper/Fe, Tact/FunC/Tolk. **But explicitly extensible**: «the tool can mutate "other things" if you tell it they are "c" or something» + custom `.rules` files supported.
6. `agroce/universalmutator` — «how does it run tests / compute kill rate for a custom language? arbitrary shell command?» → **Yes** (decisive — see §B.1.3).

**WebFetch:** Trail of Bits, [«Mutation testing for the agentic era»](https://blog.trailofbits.com/2026/04/01/mutation-testing-for-the-agentic-era/) (2026-04) → confirms universalmutator is mature/credible («the leading mutation testing tool for blockchain» in its era), names its regexp limitation (no multi-line statements, no mutant prioritization), and **mentions no bash/shell tool**.

---

## §B.1.2 Candidate evaluation (BFR §1 verdict ladder)

| Candidate | What it is | Bash fit | no-paid-LLM? | Verdict |
|---|---|---|---|---|
| **agroce/universalmutator** | regexp/Comby line-rewrite mutation engine + `analyze_mutants` harness; language-agnostic, extensible via custom `.rules` | **Yes via custom `bash.rules`** — its intended extension path for unsupported langs | ✅ deterministic regexp, no LLM | **ADAPT** (engine ADOPTed verbatim + author bash operators) |
| codeintegrity-ai/mutahunter | LLM-based language-agnostic mutation | langs-agnostic | ❌ **LLM call per mutant** | **REJECT** — violates [no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md) |
| Stryker (already in stack) | JS/TS/C#/Scala AST mutation | ❌ no bash plugin (confirmed audit §0) | ✅ | KEEP-NARROW — stays TS-only; can't reach bash |
| mewt | language-agnostic core (Solidity/Rust/Go) | no bash rules shipped; younger/narrower than universalmutator | ✅ | REFERENCE — universalmutator is the more mature regexp-engine peer |
| BATS / ShellSpec / bunit | bash **test** runners (not mutators) | n/a — these are the *test* layer the mutator drives | ✅ | orthogonal — our paired-negative tests already play this role |
| `shmutate` / `mut-bash` / `bash-mutate` | (named candidates) | **do not exist** | — | negative-existence confirmed (§B.1.4) |

---

## §B.1.3 universalmutator harness — confirms it already does what B.2 planned to build

DeepWiki round 2 (query 6) walked the workflow for a **custom/unsupported language**:

- **`mutate <file> --cmd "<validate-cmd>"`** generates mutants from a `.rules` file; `cmdHandler` runs `<validate-cmd>` per mutant (the `MUTANT` placeholder → mutant path), marking VALID on exit 0. `--noCheck`/`nullHandler` skips this entirely (bash has no compile step — or use `bash -n MUTANT` as a syntax-validity check).
- **`analyze_mutants <file> "<testscript>"`** backs up the source, swaps in each mutant, runs `<testscript>`, classifies **KILLED on non-zero exit / survives on zero exit**, restores the source, writes `killed.txt` + `notkilled.txt`, and **computes + prints the mutation score**.

This is *exactly* the loop kickoff §3 B.2 proposed building from scratch in `packages/core/audit-self/bash-mutator.ts` («negate `if`; swap `&&`/`||`; change exit codes; run against M.4 test set; compute kill rate»). universalmutator supplies the generate→swap→run→tally→score harness; **the only thing we author is the `bash.rules` operator file** — data, not engine code. The kickoff's named operators map cleanly to one-line `LHS ==> RHS` rules:

| Kickoff operator | `bash.rules` shape (regexp line-rewrite) |
|---|---|
| negate `if` condition | `if \[\[ (.*) \]\]  ==>  if [[ ! ( \1 ) ]]` |
| swap `&&` / `\|\|` | `&&  ==>  \|\|` and reverse |
| exit code 0↔1 | `exit 0  ==>  exit 1` ; `exit 1  ==>  exit 0` |
| flip string comparators | `=  ==>  !=` (scoped to `[[ ]]` test context) |
| remove `set -e` | `set -e  ==>  set +e` |

**Trail of Bits limitation (regexp can't do multi-line) is a near-non-issue for bash hooks specifically** — the 9 target hooks are line-oriented; every operator above is a single-line transform. Multi-line `if`/`case` blocks exist but the *condition* and the *exit* lines (the load-bearing mutation points) are individually single-line.

---

## §B.1.4 Negative-existence sub-claim + §1 6-item search-coverage check

**Sub-claim:** «No dedicated, mature, deterministic (non-LLM) mutation tool targets bash/shell natively.»

| §1 item | Applied | Result |
|---|---|---|
| 1 — own-stack sweep | Stryker (in stack) | does not + cannot mutate bash (audit §0; no bash plugin) |
| 2 — category sweep | mutation frameworks (Stryker, mutmut, PIT, Mull, Major, mewt, muter, dumbmutate, slither-mutate, MuTON, universalmutator, mutahunter) + bash-test frameworks (BATS, ShellSpec, bunit, bash_test_tools) + curated [awesome-mutation-testing](https://github.com/theofidry/awesome-mutation-testing) | zero native bash mutators across both categories |
| 3 — semantic-distance | searched function-level: «mutate AST», «sed/regexp rewrite», «language-agnostic core» | only universalmutator/mewt at one paradigm-step removed; both regexp/rule-driven, neither ships bash |
| 4 — adversarial counter-prompt | direct-name search `shmutate`/`mut-bash`/`bash-mutate` | none exist |
| 5 — prompt-list ≠ ceiling | 4 WebSearch phrasings + 2 DeepWiki + 1 WebFetch (> the ≥3 floor) | continued past floor; landed the ADAPT candidate |
| 6 — trigger sweep | n/a (no `open-questions.md §13.x` trigger governs bash-mutation) | — |

**Verdict on the sub-claim: HOLDS.** No native bash mutator exists — *but* a language-agnostic engine (universalmutator) extensible to bash via a custom rules file DOES. So the BFR verdict is **not** BUILD (the negative-existence claim is true only for *dedicated bash tools*, false for *adaptable engines*).

---

## §B.1.5 Verdict — ADAPT universalmutator

**ADAPT** ([build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md) verdict ladder): ADOPT the universalmutator engine + `analyze_mutants` harness verbatim (Python tool, pip-installable, deterministic, no LLM); author a custom `bash.rules` operator file (the only project-authored artefact) + a thin wiring script invoking `mutate … --noCheck` then `analyze_mutants … "<paired-negative-test-cmd>"`.

**T16 problem-class check (per ai-laziness-traps §2 T16 — verify, don't pattern-match the name):**
- Upstream problem class: «regexp line-rewrite mutation of arbitrary source + run a user-supplied test command per mutant + tally kill rate». Used in production for Solidity/Rust/Go/etc.
- Our problem class: «mutate bash hook source + run its paired-negative `.test.ts` per mutant + tally kill rate against the audit §A.4 ≥60% threshold».
- **Match: ~85%.** The engine + harness are problem-class-identical; the only gap is «no bash rules ship» — closed by the custom `.rules` file, which is universalmutator's *designed* extension mechanism (not a fork). This is why the verdict is ADAPT, not REFERENCE-then-BUILD.

**Falsifier (what would make this wrong):** ADAPT is wrong only if the maintainer's project-toolchain policy forbids a Python dev-tool **entirely** (even local/session-bound) — see §B.1.6. In that single case, fall back to a **minimal homegrown BUILD** (the kickoff's original `bash-mutator.ts`), with universalmutator's operator set + exit-code-tally loop as the **REFERENCE** design (so even the fallback is not a clean-room reinvention). A secondary falsifier: if a B.2 smoke-test shows universalmutator's regexp engine cannot usefully mutate our hooks (low risk — pure line-regexp, language-agnostic by construction) — re-open toward minimal BUILD.

---

## §B.1.6 DECISION-NEEDED — Python-in-CI vs session-bound vs minimal-BUILD (maintainer)

The ADAPT-vs-BUILD verdict is settled (ADAPT). What is **not** settled — and is the maintainer's call, not the reviewer's — is the *delivery* of the adopted tool, because universalmutator is a **Python/pip package** entering a node+bash repo whose CI is node-only:

- **Option A — universalmutator in CI** (kickoff §3 B.3 «wire into `audit-self.yml` as a separate job»). Adds a `pip install universalmutator` + Python setup step to CI. Pro: continuous automated bash-mutation protection (the umbrella's stated goal). Con: new Python toolchain in a node CI; comparable in weight to the existing Stryker npm toolchain. **no-paid-llm-in-ci CLEAN** (deterministic regexp).
- **Option B — universalmutator session-bound** (run on demand by a dev / the maintainer locally, like the Stage-1 audit itself ran; results recorded in a patch). Pro: zero CI toolchain change; matches the AI-agnostic-auditor delivery pattern. Con: not continuous — re-introduces the «manual at write-time» gap the umbrella exists to close (T-MUT-A), unless paired with a pre-push hook.
- **Option C — minimal homegrown BUILD** (no universalmutator dependency at all; ~80-LOC TS/bash mutator using universalmutator's design as REFERENCE). Pro: no new toolchain, fits existing node + Stryker CI. Con: homegrown maintenance + `#parallel-evolution-creep` ([build-first-reuse-default.md §4](../../../.claude/rules/build-first-reuse-default.md)) — exactly what BFR §1 default argues against.

**Reasoned recommendation (per [phase-research-coverage.md §1.12](../../../.claude/rules/phase-research-coverage.md) — lead, don't option-dump):** **Option A** (universalmutator in CI). BFR §1 default = ADOPT/ADAPT over BUILD; the audit pre-committed to it; the Python step is bounded and one-time; continuous protection is the umbrella's actual deliverable. If the maintainer holds a hard «node-only repo» line, **Option C** is the principled fallback (with universalmutator as REFERENCE). Option B only if the maintainer wants the lowest-friction interim and accepts pairing with a pre-push trigger to avoid the T-MUT-A regression. **B.2 build does not start until this is answered** (maintainer instruction 2026-05-31).

**Also a B.2-adopt-time precondition (not blocking B.1):** verify universalmutator's license is compatible for a dev-time CI tool (it runs in *our* CI; it is **not** shipped to consumers, so the consumer-license-vetting concern that drove the Superset REJECT — SSOT #86 — does not apply here).

---

## §1.7 Forward + Backward check (R-phase output, per kickoff §6)

### Forward — this survey complies with

- **[build-first-reuse-default.md §1/§3](../../../.claude/rules/build-first-reuse-default.md)** — the whole patch *is* the §3 mechanism (DeepWiki + WebSearch ≥3 + SSOT consult); verdict lands on the ADOPT/ADAPT side of the ladder, BUILD only as a policy-gated fallback. SSOT row #91 added in this commit per [CLAUDE.md «Build-vs-reuse invariant»](../../../CLAUDE.md).
- **[no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md)** — universalmutator is deterministic regexp (no LLM); mutahunter REJECTed precisely on this rule. Any B.2 delivery (A/B/C) stays LLM-free.
- **[phase-research-coverage.md §1.7/§1.11/§1.12](../../../.claude/rules/phase-research-coverage.md)** — §1.11 dup-work guard ran (§B.1.0); §1.12 leads with a reasoned recommendation in §B.1.6 rather than a neutral option-dump; the negative-existence sub-claim ran the §1 6-item check (§B.1.4).
- **[reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md)** — the one genuine project-toolchain fork (Python-in-CI) is surfaced as DECISION-NEEDED with each option's consequence, *with* a reasoned recommendation; not unilaterally decided.
- **[ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md)** — T11 (prior-art before proposing) is the entire patch; T16 (pattern-matching-on-name) ran explicitly in §B.1.5 (universalmutator problem-class verified ~85% match, not assumed from the «universal» name); T-MUT-A («manual ≡ automated») informs the Option-B caveat.
- **[parallel-subwave-isolation.md §1](../../../.claude/rules/parallel-subwave-isolation.md)** — ran in worktree `.claude/worktrees/mutation-stage-b`, branch `worktree-mutation-stage-b`, base `origin/staging`.
- **[doc-authority-hierarchy.md §3](../../../.claude/rules/doc-authority-hierarchy.md)** — Class + Authoritative-for header present.

### Backward — what this survey does NOT silently supersede

- **Stage-1 audit ([2026-05-25-mutation-discipline-audit.md](2026-05-25-mutation-discipline-audit.md))** — this patch *consumes* its §A.4 «B = GO + B.1-mandatory» verdict; it does not re-open the audit. F1 stop-condition stays not-triggered.
- **Kickoff §3 B.2 plan** (`bash-mutator.ts` from scratch) — this patch *redirects* it from BUILD-from-scratch to ADAPT-universalmutator per the audit's own pre-committed «ADOPT/ADAPT not BUILD if B.1 surfaces a mature tool». The from-scratch plan survives only as the Option-C policy-gated fallback. No artefact deleted.
- **SSOT #86 (Superset REJECT)** — not contradicted: #86 rejected a *consumer-shipped* GUI on license + OS-coupling grounds; universalmutator is a *dev-time, non-shipped* CI tool, so the consumer-license concern does not transfer (noted in §B.1.6).

---

## §B.1.7 Recursive self-application (T15)

- Every candidate claim is sourced from a named WebSearch query, a DeepWiki grounded answer, or the WebFetched Trail-of-Bits article — not from training-data recall (T12 counter). The «no dedicated bash mutator» claim survived an adversarial direct-name search (§B.1.1 query 4), not merely an absence of keyword hits.
- This patch ships **no mechanism** — it is the verdict gate, exactly as Stage-1 was. B.2 is a separate I-step, explicitly not started.
- The verdict is itself subject to the discipline the umbrella establishes: if B.2 adopts universalmutator (Option A/B), its `bash.rules` + wiring must carry their own paired-negative test (kickoff §5 recursive bootstrap), and that test must be exercisable by universalmutator's own `analyze_mutants` loop (the dogfood gate).

---

## See also

- [2026-05-25-mutation-discipline-audit.md](2026-05-25-mutation-discipline-audit.md) — Stage 1 audit; §A.4 B=GO verdict + B.1 mandate (this patch's input).
- [.claude/orchestrator-prompts/mutation-discipline-umbrella/kickoff.md](../../../.claude/orchestrator-prompts/mutation-discipline-umbrella/kickoff.md) — umbrella kickoff (Stage 2 B target).
- [agroce/universalmutator](https://github.com/agroce/universalmutator) — the ADAPT candidate (regexp mutation engine + `analyze_mutants` harness).
- [Trail of Bits — Mutation testing for the agentic era](https://blog.trailofbits.com/2026/04/01/mutation-testing-for-the-agentic-era/) — maturity + regexp-limitation evidence.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) #91 — SSOT row landed by this patch.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — verdict-ladder authority.
