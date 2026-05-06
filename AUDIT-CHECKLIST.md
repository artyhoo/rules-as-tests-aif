# Audit checklist for rules-as-tests-aif

> Self-audit of this package, applying the framework's own principle: rules must be executable. Every claim in this checklist is a probe — pass/fail.
>
> Use AUDIT-PROMPT.md to give a fresh AI agent the full audit task in one prompt.
> Use this checklist for manual verification or as the AI's reference.

This checklist is **rule-as-test recursion**: the package about "executable rules" gets audited by its own executable rules.

---

## Section 1 — Structural integrity (auto-checkable, ~2 min)

### 1.1 File count and structure
```bash
find . -type f | wc -l
# EXPECTED: ~37-40 files
```

### 1.2 Bash scripts have valid syntax
```bash
for f in $(find . -name "*.sh"); do
  bash -n "$f" || echo "SYNTAX ERROR: $f"
done
# EXPECTED: no errors
```

### 1.3 JSON files are valid
```bash
for f in $(find . -name "*.json"); do
  python3 -c "import json; json.load(open('$f'))" 2>&1 | grep -v "^$" || echo "OK: $f"
done
# EXPECTED: no errors
```

### 1.4 No file > 500 lines (except templates)
```bash
find . -name "*.md" -not -path "./factory/*template*" | while read f; do
  lines=$(wc -l < "$f")
  [ "$lines" -gt 500 ] && echo "OVERWEIGHT: $f ($lines lines)"
done
# EXPECTED: nothing
```

### 1.5 Setup/install scripts are executable
```bash
[ -x setup.sh ] && [ -x install.sh ] && [ -x scripts/audit-ai-docs.sh ] || echo "FAIL: missing +x"
# EXPECTED: silent (no output = pass)
```

---

## Section 2 — Cross-references and consistency (~5 min)

### 2.1 Every R-rule in RULES.md has either an audit probe OR an explicit "manual review" note

```bash
# Extract rule numbers from RULES.md
RULES=$(grep -oP "^## R\d+" factory/RULES.md | grep -oP "R\d+")

# For each R-rule, check that it's either:
# - referenced as `R<N>` in audit-ai-docs.sh, OR
# - mentioned as "manual review" in best-practices-sidecar.md
for r in $RULES; do
  in_audit=$(grep -c "skip_unless $r" scripts/audit-ai-docs.sh 2>/dev/null || echo 0)
  in_manual=$(grep -c "$r.*manual\|manual.*$r" agents/best-practices-sidecar.md 2>/dev/null || echo 0)
  in_eslint=$(grep -c "$r.*ESLint\|delegated.*$r\|$r.*delegated" agents/best-practices-sidecar.md 2>/dev/null || echo 0)
  if [ "$in_audit" -eq 0 ] && [ "$in_manual" -eq 0 ] && [ "$in_eslint" -eq 0 ]; then
    echo "ORPHAN RULE: $r — no probe, no manual review, no ESLint delegation"
  fi
done
# EXPECTED: nothing (every rule has enforcement strategy)
```

### 2.2 Every probe in audit-ai-docs.sh has a comment mapping to an R-rule

```bash
grep -E "^# R[0-9]+ —|^# D[0-9]+ —" scripts/audit-ai-docs.sh | wc -l
# EXPECTED: ≥9 (R1-R9 mapped, plus D1-D2 for drift)
```

### 2.3 Markdown links to .md files resolve

```bash
# Find all .md references in backticks
for src in $(find . -name "*.md"); do
  grep -oE "\`[^\`]*\.md\`" "$src" | tr -d '`' | sort -u | while read ref; do
    # Skip files that are CREATED at project install time (not in package)
    case "$ref" in
      *.ai-factory/*|*AGENTS.md|*CLAUDE.md|*.template.md|*\<*) continue ;;
      pravila-*|aif-rules-*|shift-left-*|rules-as-tests.md|contract-*) continue ;;  # outer corpus, not in package
    esac
    base=$(basename "$ref")
    find . -name "$base" 2>/dev/null | grep -q . || echo "DEAD LINK in $src → $ref"
  done
done | sort -u
# EXPECTED: nothing
```

### 2.4 No old paths after rename

```bash
# Check there are no stale references to old filenames
grep -r "ai-factory-RULES\.md" --include="*.md" --include="*.sh" . 2>/dev/null
# EXPECTED: empty (was renamed to factory/RULES.md)

grep -r "best-practices-sidecar\.react\.md" --include="*.md" . 2>/dev/null
# EXPECTED: empty (was inlined into best-practices-sidecar.md)
```

### 2.5 Stack-specific files match in name pattern

```bash
ls templates/ts-server/ templates/react-next/
# EXPECTED: react-next/ has eslint.config.react.mjs, vitest.config.ts, playwright.config.ts, github-actions-ci-ui.yml
# EXPECTED: ts-server/ has eslint.config.mjs, vitest.config.ts, dependency-cruiser.cjs, stryker.config.json, github-actions-ci.yml
```

---

## Section 3 — Content quality (~10 min, AI review needed)

### 3.1 Templates have clear placeholders

Read `factory/DESCRIPTION.template.md` and `factory/ARCHITECTURE.template.md`. Verify:
- All `<PLACEHOLDER>` markers are valid (matched, not hanging brackets)
- Each placeholder has a comment explaining what to replace it with
- No real project names or paths leaked (this is generic template)

### 3.2 No duplicated rule statements

For each R-rule in RULES.md:
- Statement exists in RULES.md (canonical)
- Reference (not restatement) exists in best-practices-sidecar.md
- Reference (not restatement) exists in DESCRIPTION/ARCHITECTURE templates
- audit-ai-docs.sh probe quotes the R-number, not restates the rule

If you see the same rule stated 3 different ways in 3 files — fail.

### 3.3 References are progressive disclosure, not full re-explanations

`SKILL.md` should be ≤300 lines and have an index of references.
Each `references/<file>.md` should be self-contained but link to others, not duplicate.

Specifically check:
- `overview.md` and `checks-map.md` — they cover different layers; should NOT both have the same "5-layer framework" exposition
- `ai-traps.md` and `self-testing-docs.md` — both touch AI-docs drift; should be clearly differentiated

### 3.4 Sub-agents have clear responsibility boundaries

- `best-practices-sidecar` — validates against RULES.md, reports
- `review-sidecar` — two-AI review for tautology, no awareness of how code was written
- `docs-auditor` — runs audit-ai-docs.sh, parses output

If two agents have the same job description with different wording — fail.

### 3.5 Templates compile/lint independently

Try to parse templates without project context:
```bash
# eslint.config.mjs syntax check
node --check templates/ts-server/eslint.config.mjs 2>&1 | head -5
# (will fail on imports, that's OK — just check syntax)

# tsconfig.json valid
python3 -c "import json; json.load(open('templates/shared/tsconfig.json'))"
```

---

## Section 4 — AI-specific quality (this is meta — apply AI traps to the package itself)

### 4.1 Token economy of the skill

Calculate approximate tokens loaded when skill triggers:
```bash
# SKILL.md is always loaded
SKILL_LINES=$(wc -l < skills/rules-as-tests/SKILL.md)
echo "SKILL.md: $SKILL_LINES lines (~$((SKILL_LINES * 30)) tokens)"

# References load on-demand — sum them
TOTAL_REF=$(find skills/rules-as-tests/references -name "*.md" -exec wc -l {} + | tail -1 | awk '{print $1}')
echo "All references combined: $TOTAL_REF lines (~$((TOTAL_REF * 30)) tokens)"

# Health check
[ "$SKILL_LINES" -lt 500 ] && echo "OK: SKILL.md under 500 lines" || echo "ALARM: SKILL.md > 500 lines"
[ "$TOTAL_REF" -lt 2000 ] && echo "OK: references combined < 2000 lines" || echo "ALARM: references heavy"
```

### 4.2 No tautological claims

Check the package doesn't make claims it can't substantiate:
- "Battle-tested" — false unless tested in production
- "Reduces bugs by X%" — false unless measured
- "Industry standard" — only if cited

Grep for marketing language:
```bash
grep -rEi "battle.tested|industry.standard|guarantees|prevents.*bugs|catches.*all|never.fails" \
  --include="*.md" .
# EXPECTED: empty or only inside negative examples
```

### 4.3 Lessons learned section is real, not aspirational

Each lesson in `references/ai-traps.md` "Lessons learned" should:
- Describe a concrete observed failure
- Have a generalizable lesson
- Have an executable detection rule

Read the section. If a lesson sounds like "you should be careful" without a concrete check — flag it.

### 4.4 Self-application: does the package follow its own rules?

Apply selected R-rules to this very package:
- **R10 Naming**: Files named after their content? (e.g., `audit-ai-docs.sh` does audit AI docs ✓)
- **R11 CI integrity**: Does the package describe how it's tested? (Currently NO — there's no CI for the package itself. Note for later.)

---

## Section 5 — Setup and install verification (~5 min, requires test env)

### 5.1 In a fresh project, setup.sh succeeds

```bash
mkdir /tmp/rat-test && cd /tmp/rat-test
git init && npm init -y

# Run setup
bash /path/to/rules-as-tests-aif/setup.sh --stack=ts-server --skip-deps

# Verify
ls -la .ai-factory/ .claude/agents/ scripts/ 2>/dev/null
# EXPECTED: all directories exist with content
```

### 5.2 install.sh handles existing files gracefully

```bash
# Run setup TWICE in same project — should not corrupt
bash /path/to/setup.sh --skip-deps
bash /path/to/setup.sh --skip-deps  # second run
# EXPECTED: warns about existing files, does not crash
```

### 5.3 audit-ai-docs.sh runs on empty project without crashing

```bash
cd /tmp/rat-test
bash scripts/audit-ai-docs.sh
# EXPECTED: exit code 0 (no failures because no code to violate rules)
# EXPECTED: at least D1, D2 probes report (they're drift checks)
```

### 5.4 audit-ai-docs.sh fails when expected violations present

This is the **negative test for the audit script itself**:

```bash
# Inject a violation
mkdir -p src/domain
echo 'export const x = 5; const _ = Date.now();' > src/domain/bad.ts

# Run audit — should FAIL on R7
bash scripts/audit-ai-docs.sh
EXIT=$?
[ "$EXIT" -eq 1 ] && echo "OK: audit caught R7 violation" || echo "FAIL: audit missed R7 violation"

# Cleanup
rm -rf src/
```

If this passes — the audit script actually works. If it doesn't — the script has a regex bug or path bug.

---

## Section 6 — AIF integration (manual)

### 6.1 ai-factory init creates expected structure

In a clean project after `ai-factory init --agents claude`:
- `.ai-factory/` exists with DESCRIPTION.md, ARCHITECTURE.md, RULES.md, etc.
- `.claude/agents/` has AIF base agents (plan-coordinator, etc.)
- `.claude/skills/` has aif-* skills
- `.ai-factory.json` exists

### 6.2 install.sh overlays correctly without breaking AIF base

After `install.sh`:
- `.claude/agents/best-practices-sidecar.md` — overridden by us
- `.claude/agents/review-sidecar.md` — overridden by us
- `.claude/agents/docs-auditor.md` — overridden by us (or new file)
- Other AIF base agents — UNTOUCHED (plan-coordinator, implement-worker, etc.)
- `.ai-factory/RULES.md` — replaced with our version, BUT user can adjust

### 6.3 /aif-verify exercises the chain end-to-end

In Claude Code, after `/aif-implement`:
- `/aif-verify` should invoke best-practices-sidecar → outputs verdict against RULES.md
- best-practices-sidecar should suggest running audit-ai-docs.sh
- review-sidecar should produce two-AI review report
- All three reports visible in single `/aif-verify` output

(Manual test — requires Claude Code session.)

---

## Section 7 — Documentation honesty (~5 min)

### 7.1 README accurately describes what's in the package

Read README.md. Cross-check claims:
- "37 files" → match actual count
- "covers ts-server and react-next" → check both template dirs exist
- "self-testing AI docs via probes" → check audit-ai-docs.sh exists with probes

### 7.2 INSTALL.md describes actual installation steps

Read INSTALL.md. Each step should be runnable. If any step references a file that doesn't exist or a command that doesn't work — fail.

### 7.3 No bullshit statements

Look for unsupported claims:
- "Improves AI quality" — say what aspect, by what mechanism
- "Best practice" — by whose definition? cite or remove
- "Production-ready" — production-tested? if not, remove

---

## Section 8 — Known gaps (must-verify findings)

The package authors flagged these gaps. They are not bugs — they are TODOs that
the package itself doesn't yet satisfy. **The audit must explicitly check whether
these are still gaps, and report them as findings if so.**

### 8.1 CI for the package itself

The package requires CI from user projects (R11 in RULES.md). But does the
package itself have CI?

```bash
ls .github/workflows/ 2>/dev/null
```

**If empty or missing self-audit workflow** → report MAJOR finding:
"Package violates own R11 — no CI/.github/workflows/audit-self.yml that runs
AUDIT-CHECKLIST mechanical checks on every PR to this repo."

Suggested fix when adopted:
```yaml
# .github/workflows/audit-self.yml
name: Self-audit
on: [pull_request]
jobs:
  mechanical:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Bash syntax
        run: for f in $(find . -name "*.sh"); do bash -n "$f"; done
      - name: JSON validity
        run: for f in $(find . -name "*.json"); do python3 -c "import json; json.load(open('$f'))"; done
      - name: Stale path references
        run: |
          ! grep -r "ai-factory-RULES\.md" --include="*.md" --include="*.sh" .
          ! grep -r "best-practices-sidecar\.react\.md" --include="*.md" .
      - name: Rule-to-probe mapping
        run: bash AUDIT-section-1-2.sh   # extract checks from AUDIT-CHECKLIST.md
```

### 8.2 Negative tests for audit-ai-docs.sh probes

`references/self-testing-docs.md` states: "every probe should have a matching
negative test — inject artificial violation, run probe, expect FAIL, revert."

Check whether such tests exist:
```bash
ls tests/audit/ 2>/dev/null
find . -name "*audit*test*.sh" -o -name "*audit*spec*.sh"
```

**If empty** → report MAJOR finding:
"Probes lack negative tests. Silent regex breakage will be undetected. Affects
R1, R2, R4, R6, R7, R8, R9, D1, D2 in audit-ai-docs.sh and R12, R14, R15, R16a,
R16b, R17, R20 in audit-ai-docs.react-next.sh."

Suggested fix when adopted:

```bash
# tests/audit/audit-ai-docs.test.sh
#!/usr/bin/env bash
set -euo pipefail

# Test for probe R7 — injects artificial Date.now() violation, expects FAIL
test_R7_catches_date_now() {
  mkdir -p src/domain
  echo 'export const x = Date.now();' > src/domain/_test_probe_violation.ts

  if bash scripts/audit-ai-docs.sh --only=R7 2>/dev/null; then
    echo "FAIL: probe R7 missed Date.now() violation"
    rm src/domain/_test_probe_violation.ts
    return 1
  fi

  rm src/domain/_test_probe_violation.ts
  echo "PASS: R7 correctly catches Date.now()"
}

# Test for probe R6 — string throw
test_R6_catches_string_throw() {
  mkdir -p src/domain
  echo 'export const f = () => { throw "bad"; };' > src/domain/_test_probe_violation.ts

  if bash scripts/audit-ai-docs.sh --only=R6 2>/dev/null; then
    echo "FAIL: probe R6 missed string throw"
    rm src/domain/_test_probe_violation.ts
    return 1
  fi

  rm src/domain/_test_probe_violation.ts
  echo "PASS: R6 correctly catches string throw"
}

# ... one test per probe ...

test_R7_catches_date_now
test_R6_catches_string_throw
# etc
```

These tests should be in `.github/workflows/audit-self.yml` (Section 8.1)
so they run automatically.

---



### Manual run (you with terminal)
1. Open this checklist
2. For each Section 1-7, run the bash commands
3. For text-based checks (Section 3, 4.3), read and judge
4. Note all failures in a separate file
5. Fix or document each failure

### AI run (give the prompt to a fresh Claude session)
Use AUDIT-PROMPT.md — it embeds this checklist into a single instruction.

### Time budget
- Sections 1, 2: ~5 min (auto-checkable)
- Section 3: ~10 min (AI review)
- Section 4: ~10 min (semantic checks)
- Section 5: ~5 min (test in /tmp project)
- Section 6: ~10 min (manual AIF integration)
- Section 7: ~5 min (documentation review)
- Section 8: ~3 min (must-verify gap findings)

**Total: ~48 minutes for full audit.**

For quick triage — Sections 1, 2, 5, 8.
