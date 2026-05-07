# Audit prompt for fresh AI session

> Copy the prompt below into a NEW Claude Code session (or any AI agent with file access). The fresh-session aspect is intentional — it's the two-AI review pattern applied to the package itself.

---

## Why a fresh session

This package was created by AI in one session. AI has blind spots about its own work. A different session, with no memory of how the package was built, audits with cleaner eyes — same logic as `review-sidecar` for code review.

---

## The audit prompt — copy and paste

```
You are auditing the rules-as-tests-aif package as an external reviewer.
You did NOT build this. You have NO memory of design decisions. Be skeptical.

Your job: find bugs, dead links, conceptual gaps, duplication, overweight files,
or claims the package can't substantiate.

You report. You do NOT fix anything in this session. (Fixes happen in a follow-up
session with full context, after I review your findings.)

═══════════════════════════════════════════════════════════════
PHASE 1 — Mechanical checks (use bash, ~5 minutes)
═══════════════════════════════════════════════════════════════

Run these commands and report each result clearly:

1. File count and structure:
   find . -type f | wc -l
   find . -type d
   du -sh .

2. Bash syntax of all .sh files:
   for f in $(find . -name "*.sh"); do
     bash -n "$f" 2>&1 && echo "✓ $f" || echo "✗ $f"
   done

3. JSON validity:
   for f in $(find . -name "*.json"); do
     python3 -c "import json; json.load(open('$f'))" 2>&1 && echo "✓ $f" || echo "✗ $f"
   done

4. File sizes (any > 500 lines is overweight):
   find . -name "*.md" | while read f; do
     L=$(wc -l < "$f"); [ "$L" -gt 500 ] && echo "$L: $f"
   done

5. Markdown links to .md files — find dead-end references:
   for src in $(find . -name "*.md"); do
     grep -oE "\`[^\`]*\.md\`" "$src" | tr -d '`' | sort -u | while read ref; do
       case "$ref" in
         *.ai-factory/*|*AGENTS.md|*CLAUDE.md|*.template.md|*\<*) continue ;;
       esac
       base=$(basename "$ref")
       find . -name "$base" 2>/dev/null | grep -q . || echo "DEAD: $src → $ref"
     done
   done | sort -u

6. Stale path references:
   grep -r "ai-factory-RULES\.md" --include="*.md" --include="*.sh" .
   grep -r "best-practices-sidecar\.react\.md" --include="*.md" .
   # Both should be empty.

═══════════════════════════════════════════════════════════════
PHASE 2 — Rule-to-probe mapping (~5 minutes)
═══════════════════════════════════════════════════════════════

The package's core principle: every rule has an executable check.
Verify the package follows its own principle.

7. Extract all R-rules from factory/RULES.md:
   grep "^## R" factory/RULES.md

8. Extract probes from scripts/audit-ai-docs.sh:
   grep -E "skip_unless R" scripts/audit-ai-docs.sh

9. Cross-check: for each R-rule, verify EITHER:
   - It has a probe in audit-ai-docs.sh (skip_unless R<N> exists), OR
   - best-practices-sidecar.md says it's "manual review only" or "delegated to ESLint"
   - Otherwise report ORPHAN RULE

10. Same check for R12-R20 (RULES.react-next.md) vs audit-ai-docs.react-next.sh.

═══════════════════════════════════════════════════════════════
PHASE 3 — Content quality (~15 minutes, requires reading)
═══════════════════════════════════════════════════════════════

11. Read skills/rules-as-tests/SKILL.md. Verify:
    - description starts with "Use when"
    - ≥5 trigger keywords
    - ≤500 lines
    - Index of references is up-to-date with files in references/

12. Read references/overview.md and references/checks-map.md.
    Question: do they duplicate the "5-layer framework" exposition? They should
    NOT — overview explains layers, checks-map maps to enforcement levels.
    If both contain a paragraph saying "five layers: architecture, meta-tests,
    spec-by-example, mutation, living docs" — flag as duplication.

13. Read agents/best-practices-sidecar.md and agents/review-sidecar.md.
    Question: are responsibilities clearly different?
    - best-practices-sidecar = validates against RULES.md
    - review-sidecar = catches tautologies in tests
    If they overlap (e.g., both check tautologies) — flag duplication.

14. Read references/ai-traps.md "Lessons learned" section.
    For each lesson, check it has:
    - Concrete observed failure (not generic "be careful")
    - Generalizable lesson
    - Executable detection rule (or explicitly noted as manual review)

15. Read factory/DESCRIPTION.template.md and ARCHITECTURE.ts-server.md.
    Verify all <PLACEHOLDER> markers are valid YAML/Markdown
    (matched brackets, comments explaining what to fill in).

═══════════════════════════════════════════════════════════════
PHASE 4 — Self-application (does the package follow its own rules?)
═══════════════════════════════════════════════════════════════

16. R10 — Naming: each file named after its content?
    Examples to check:
    - audit-ai-docs.sh — yes, audits AI docs
    - best-practices-sidecar.md — yes, sidecar agent for best practices
    - checks-map.md — yes, maps checks to layers
    Flag any file with misleading name.

17. References to outer corpus: do any .md in this package reference
    files that are NOT part of the package? (e.g., "see pravila-kak-testy.md")
    If yes — these are external context that won't be available to users.
    Flag and suggest either removing or marking as "external context".

18. Token economy claim: SKILL.md should describe the package's token usage.
    Calculate actual usage:
    - SKILL.md lines × 30 = approx tokens always loaded
    - References combined × 30 = max tokens if all references load
    Report whether the package is "lightweight" as claimed in README.

═══════════════════════════════════════════════════════════════
PHASE 5 — Setup verification (~5 min, optional, requires sandbox)
═══════════════════════════════════════════════════════════════

19. (If you have a sandbox) — run setup.sh with --skip-deps in /tmp/test
    and verify:
    - ai-factory init creates .ai-factory/
    - install.sh overlays without crashing
    - npm scripts added to package.json
    - .husky/pre-commit and pre-push installed

20. Negative test for audit-ai-docs.sh:
    - In sandbox, create src/domain/bad.ts with `const _ = Date.now()`
    - Run bash scripts/audit-ai-docs.sh
    - EXPECTED: exit code 1, R7 reports FAIL
    - If it doesn't catch — the regex is broken

═══════════════════════════════════════════════════════════════
PHASE 6 — Self-meta-test (does the package's own infra still work?)
═══════════════════════════════════════════════════════════════

These two artifacts are LOAD-BEARING for the package's "rules as tests"
thesis applied to itself. They were added in earlier audit cycles. Verify
they exist AND still work — silent regression here is severity BLOCKER.

21. CI for the package itself (.github/workflows/audit-self.yml).

    Check:
    cat .github/workflows/audit-self.yml | grep -E "^  [a-z-]+:$"

    EXPECTED: at least three jobs — `mechanical:` (bash/json/dead-links),
    `rule-to-probe:` (orphan-rule check), `probe-tests:` (runs negative tests).

    Run the rule-to-probe logic locally to verify it doesn't false-positive:

    fail=0
    for rules_file in factory/RULES.md factory/RULES.react-next.md; do
      for r in $(grep -oE "^## R[0-9]+[a-z]?" "$rules_file" | grep -oE "R[0-9]+[a-z]?"); do
        in_audit=0
        grep -qE "skip_unless ${r}[a-z]*\b" scripts/*.sh 2>/dev/null && in_audit=1
        in_manual=0
        grep -qE "$r.*manual|manual.*$r|$r.*delegated|delegated.*$r" \
          agents/best-practices-sidecar.md scripts/*.sh 2>/dev/null && in_manual=1
        [ "$in_audit" -eq 0 ] && [ "$in_manual" -eq 0 ] && { echo "ORPHAN: $r"; fail=1; }
      done
    done
    echo "exit=$fail"

    If file is missing, jobs are missing, or local check reports any ORPHAN
    or exit≠0 — REPORT as BLOCKER "Self-audit CI broken/missing".
    Past breakage: regex `R[0-9a-z]+` greedily matched `## Rule maintenance`,
    and `\b` boundary failed on R16a/R16b sub-probes. Verify both are fixed.

22. Negative tests for audit-ai-docs.sh probes.

    Check:
    bash tests/audit/audit-ai-docs.test.sh

    EXPECTED: exit code 0, summary line "16 pass / 0 fail" (or higher if probes
    were added). Each test injects a violation in a temp dir, runs the probe
    with --only=R<N>, asserts the probe catches it.

    If file is missing, exit≠0, or any test FAILs — REPORT as BLOCKER
    "Probes without working negative tests — silent breakage risk".
    The probe regex can rot at any time; this is the only thing keeping it honest.

23. Self-application: does the package itself pass its own audit?

    Check:
    bash scripts/audit-ai-docs.sh
    echo "exit=$?"

    EXPECTED: exit 0, no FAILs (WARNs from D1/D2 are acceptable if AGENTS.md
    or .mcp.json don't exist at package root — package itself doesn't ship them).

    If any FAIL appears — REPORT as BLOCKER "Package fails its own audit".
    Past breakage: leftover negative-test artifacts (src/, AGENTS.md with
    `phantom-skill`, .mcp.json with `_comment_TODO`) accumulated in the package
    root and triggered 7 FAILs. These should not be committed; ensure they're
    not present.



Produce a structured report. For each finding:

## Finding N
- **Severity**: BLOCKER | MAJOR | MINOR | INFO
- **Phase**: <which phase found it>
- **Location**: <file:line or section>
- **What I saw**: <one sentence>
- **Why it's a problem**: <one or two sentences>
- **Suggested fix**: <one sentence — don't write the actual fix, describe it>

Severity rules:
- BLOCKER — package won't work as advertised (e.g., setup.sh crashes, dead link
  in installation instructions, audit script has bug that misses violations)
- MAJOR — significant quality issue (e.g., conceptual duplication between docs,
  rule without enforcement, misleading claim)
- MINOR — cosmetic (e.g., typo, minor inconsistency in formatting)
- INFO — observation worth noting but not a defect

After all findings, output a summary:
- Total: N findings (X BLOCKER, Y MAJOR, Z MINOR, W INFO)
- Recommendation: SHIP / FIX-AND-SHIP / REWORK
  - SHIP — only INFO and ≤3 MINOR
  - FIX-AND-SHIP — ≤2 MAJOR and no BLOCKER
  - REWORK — any BLOCKER or >2 MAJOR

Do NOT make changes to any files. Report only.
```

---

## After the audit

1. Save the audit output to a file (e.g., `audit-results-<date>.md`).
2. Review findings yourself — agree/disagree with each.
3. In a NEW session, prompt the AI to fix the agreed findings:
   ```
   Read audit-results-<date>.md. For each finding I marked as "AGREE",
   apply the suggested fix. Do not touch findings I marked "DISAGREE".
   After fixes, re-run AUDIT-PROMPT.md PHASE 1-2 to verify.
   ```
4. Iterate until findings are: 0 BLOCKER, ≤2 MAJOR, ≤5 MINOR.

---

## Why two-AI

This is the same pattern as `review-sidecar` in the package itself: a fresh AI
without context catches things the original author missed. The package was
created in one session; AI in that session optimized for "produce valid output",
which is a different goal than "find what's wrong with the output".

The fresh session has no investment in the existing decisions. Its job is to
break the package on paper — and that's what makes it useful.
