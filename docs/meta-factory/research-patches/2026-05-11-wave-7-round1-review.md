# Wave 7 Round 1 — Implementation review

> **Authoritative for:** Wave 7 Round 1 (sub-waves 7.1/7.2/7.3/7.6.a) implementation audit — domain scores and GO/REVISE per domain. **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

Review session: claude-sonnet-4-6 (independent reviewer — NOT any prior Wave 7 session)
Date: 2026-05-11

---

## §1 — Domain scores

| # | Domain | Verdict | Key finding |
|---|--------|---------|-------------|
| 1 | Commit hygiene + scope | **WARN** | 2b0a505 co-stages 7.2.d content (acknowledged in 27bd148 body); SSOT #16 pre-landed vs kickoff 7.5.b constraint; all Prior-art trailers present; 7.6.b bonus already on branch |
| 2 | Hard constraints + STOP | **PASS** | ANTHROPIC_API_KEY only in CI workflow comment (negative assertion); Cursor ref in AGENTS.md.template pre-existing, not added by Wave 7; Wave 5/6 untouched |
| 3 | 7.1 hot-check primitives | **PASS** | .markdownlint.json 9 lines structural; pre-commit bash-driven ACMR; lychee --offline graceful absent; principle 09 exports + CLI shim present; 14/14 tests; D-3 PASS; SSOT #16 documented; lint-config README has authority header |
| 4 | 7.2 harness-hook layer | **WARN** | settings.json UserPromptSubmit uses non-standard extra nesting `[{hooks:[...]}]`; hook scripts all correct; INSTALL-FOR-AI.md and self-application.md correct |
| 5 | 7.3 template test + skill | **WARN** | All 9 probes pass; P1 synonyms are methodology phrases (not verbatim README goal phrase) — acceptable drift indicators but won't catch representation drift to other wording; no LLM in CI; 1.3s runtime documented; skill 42 LOC ≤50 |
| 6 | 7.6.a research patch | **PASS** | One file only; authority header + session marker present; §1.7 section cites self-reflection; SSOT #23–#26 in doc only (not in SSOT file) |
| 7 | Cross-batch consistency | **PASS** | 7.2.c → 7.1.c CLI path correct; TODO consolidation notes present; typecheck clean (0 errors across all workspaces); all 4 authority-bearing files have headers |
| 8 | Capability commit compliance | **PASS** | 80ef1d9 Prior-art → #17 ✓; f528586 Prior-art → #22 ✓; 91f5f1d borderline (155 LOC new file under packages/; escape hatch used — see §3) |

---

## §2 — Known issues adjudication

| Issue | Confirmed? | Severity | Recommendation |
|-------|-----------|----------|----------------|
| 2b0a505 scope mismatch | **YES** | **WARN** | Content correct; history attribution messy. 27bd148 body acknowledges it. No mandatory rebase — PR open can proceed with note in PR description. Optional: `git rebase -i` to split for clean history. |
| P1 synonym quality | **YES** | **WARN** | `'enforced by lint, tests, CI'` and `'without a measurable check'` detect drift within current template wording but won't fire if templates are rewritten with equivalent goal language. Recommend adding verbatim README phrase `"AI agents can't silently bypass undocumented conventions"` as third synonym. Lands in 7.5.d self-review patch. |
| SSOT #16 pre-landing | **YES** | **ACCEPTABLE with NOTE** | Kickoff says entries 16–22 land at 7.5.b; CLAUDE.md build-vs-reuse rule says add new SSOT entry in same commit as BUILD discovery. #16 is a NEW BUILD (not a verdict transition), so CLAUDE.md rule takes precedence. Entries #17–#22 still land at 7.5.b as planned. Note the rule tension in 7.5.b commit message. |

---

## §3 — NEW issues found

### Issue 4 — settings.json UserPromptSubmit nesting

**Evidence** (`.claude/settings.json:5-12`):
```json
"UserPromptSubmit": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "bash .claude/hooks/inject-session-bootstrap.sh"
      }
    ]
  }
]
```
The `PostToolUse` entries correctly use `[{ "matcher": "...", "hooks": [...] }]`. The `UserPromptSubmit` entry wraps the hook in a redundant outer object with a `hooks` key. Whether this works depends on the Claude Code harness schema — it may be silently ignored or may prevent the hook from firing.

**Severity: WARN.** If the hook is not firing, the session-bootstrap injection is silently broken. Must verify before PR open (run a session and confirm the `[session-bootstrap digest]` header appears in the prompt context, OR check Claude Code settings schema documentation).

### Issue 5 — 91f5f1d borderline capability commit classification

**Evidence:** `packages/core/principles/09-doc-authority-hierarchy.ts` is a new file at 155 LOC under `packages/`. Per CLAUDE.md: «Adds a new file ≥80 LOC anywhere under packages/» = capability commit. The commit uses the escape hatch `Prior-art: skipped — refactor of existing principle 09...` with ≥20-char rationale (valid escape hatch format per CLAUDE.md).

**Severity: NOTE.** The pre-push hook would have fired on this commit. The escape-hatch rationale is plausible (extracting existing test-internal logic into a shared module, not adding new runtime capability). The operator should confirm the hook accepted this commit without blocking. If it didn't run (hook was not yet installed), confirm retroactively.

### Issue 6 — vitest path difference (test runner invocation)

**Evidence:** `npx vitest run packages/core/audit-self/template-render.audit.ts` run from repo root exits with «No test files found» (vitest's default include pattern `**/*.{test,spec}.?...` doesn't match `.audit.ts`). CI-correct invocation: `npm --prefix packages/core run test:template-render` → all 9 pass. The `packages/core/vitest.config.ts` includes `'audit-self/**/*.audit.ts'` but that config is not loaded when invoking vitest from the repo root.

**Severity: NOTE.** Production CI is correct. Domain 5 audit spec uses the wrong root-level invocation. No action needed before PR; document in packages/core/README if not already noted.

### Issue 7 — 7.6.b already on branch (beyond Round 1 scope)

**Evidence:** commit `1f25e80` (`docs(research-patches): Wave 7 sub-wave 7.6.b — §13.23 4th-layer review verdicts`) is present on the branch. Round 1 scope was A+B+C+F.a only; 7.6.b was Round 2 scope.

**Finding:** 7.6.b verdict is **GO [F1]** — all 4 problems (scope predicate, bootstrap, trailer format, discipline-theatre) verified tractable. Path A closeout applies: sub-wave 7.6.c ships, §13.23 closes in Wave 7, enforcement ladder advances to 4 active layers.

**Severity: NOTE (positive).** 7.6.b is ahead of schedule. 7.6.c implementation is unblocked per the ATTN rule. Orchestrator must confirm before launching 7.6.c.

---

## §4 — Overall verdict

**GO WITH NOTES**

Round 1 implementation is functionally correct. All 13 sub-wave commits are present with Prior-art trailers. Tests pass (14/14 principle 09, 9/9 template-render). Typecheck clean. Hard constraints (no LLM in CI, no Cursor/Cline scripts in templates/, Wave 5/6 untouched) satisfied.

Three items must be verified or addressed before PR open (see §5). Remaining notes are carry-forward recommendations for 7.5.d or documentation.

ATTN: 7.6.b GO [F1] means sub-wave 7.6.c is unblocked and should be launched as next action.

---

## §5 — Pre-PR checklist

1. **[MUST VERIFY] settings.json UserPromptSubmit nesting** — confirm hook fires in a live Claude Code session. If `[session-bootstrap digest]` does not appear in prompt context, the nesting is wrong and must be corrected to `[{ "type": "command", "command": "..." }]` (matching Claude Code's expected schema for `UserPromptSubmit`). See Issue 4.

2. **[SHOULD / 7.5.d] Add verbatim README goal phrase as third P1 synonym** — add `"AI agents can't silently bypass undocumented conventions"` to `GOAL_PHRASE_SYNONYMS` in `packages/core/audit-self/template-render.audit.ts`. Lands naturally in 7.5.d self-review patch. See Issue 2 / Known Issue 2.

3. **[NOTE / 7.5.b] SSOT #16 pre-landing rationale** — in the 7.5.b commit message note that #16 was pre-landed at 7.1.d as a new BUILD discovery (not a verdict transition), per CLAUDE.md rule; entries #17–#22 are verdict transitions and land here per kickoff constraint. Preserves traceability.

4. **[NOTE / PR description] 2b0a505 co-staging** — include in PR description a line acknowledging that 7.2.d content (harness-hook section, subscription note, self-application.md preview row) was co-staged in 2b0a505 with the D-3 probe; 27bd148 added the verification checklist row. History is accurate in commit bodies; PR description should make it explicit.

5. **[ATTN — orchestrator action] Launch 7.6.c** — 7.6.b GO [F1] clears the STOP condition. Sub-wave 7.6.c (extend `.husky/pre-push` §1.7 trailer check + update self-reflection skill + open-questions §13.23) may proceed.

6. **[NOTE] 91f5f1d hook acceptance** — confirm pre-push hook accepted the escape-hatch rationale on that commit or was not yet installed at commit time. No remediation needed either way; just document.
