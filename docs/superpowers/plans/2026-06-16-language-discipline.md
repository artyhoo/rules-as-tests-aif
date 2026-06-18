# Language Discipline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all internal machinery (hooks, skills, scripts) English-only, and make human-facing output reliably switch to Russian when `AIF_HOOK_LANG=ru` (else English) — closing the live bug where `/pipeline` localizes table headers but writes English prose.

**Architecture:** Three coupled stages. (A) Cleanup: translate category-1 Russian (comments, instruction prose) to English; move category-3 match-data (question-detection patterns) into the existing `lang/*.sh` packs. (B) Language gate: a precisely-scoped always-on line injected by `inject-session-bootstrap.sh` (every turn, all skills) + a pipeline render-time `AIF_OUTPUT_LANG` signal with a strengthened prose directive. (C) Guard-test (principle 22, low-FP) + companion rule `.claude/rules/language-discipline.md`.

**Tech Stack:** Bash hooks, Vitest (TypeScript principle tests), `git ls-files` for file enumeration, the existing `AIF_HOOK_LANG` + `lang/{en,ru}.sh` pack mechanism.

**Spec:** [docs/superpowers/specs/2026-06-16-language-discipline-design.md](../specs/2026-06-16-language-discipline-design.md)

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `packages/core/principles/22-internal-english.test.ts` | Guard-test: no Cyrillic in machinery shell + skill bodies (allowlisted exceptions) | Create |
| `.claude/rules/language-discipline.md` | Companion rule: 3-category model + gate, Class A | Create |
| `.claude/hooks/lang/en.sh` | add `AIF_EOT_QUESTION_PATTERN` (English question phrases) | Modify |
| `.claude/hooks/lang/ru.sh` | add `AIF_EOT_QUESTION_PATTERN` (Russian question phrases) | Modify |
| `.claude/hooks/lang/check-parity.sh` | extend key-grep to cover `AIF_EOT_*` | Modify |
| `.claude/hooks/end-of-turn-reminder.sh` | English comments; use `$AIF_EOT_QUESTION_PATTERN` | Modify |
| `.claude/hooks/inject-session-bootstrap.sh` | B1: read `AIF_HOOK_LANG`, append scoped output-language line | Modify |
| `.claude/skills/dispatcher/helpers/harvest-via-api.sh` | English comment | Modify |
| `.claude/skills/self-reflection/SKILL.md` | English body labels (keep frontmatter triggers) | Modify |
| `.claude/skills/pipeline/helpers/emit-output-strings.sh` | B2: emit `AIF_OUTPUT_LANG` | Modify |
| `.claude/skills/pipeline/SKILL.md` | B2: strengthen §10 i18n prose directive | Modify |

**Stage order:** C1 (write guard-test → RED) → A (cleanup → GREEN) → B (gate, independent) → C2 (rule). TDD: the guard-test drives the cleanup worklist.

---

## Stage C1 — Write the guard-test (TDD: red first)

### Task 1: Principle 22 guard-test

**Files:**
- Create: `packages/core/principles/22-internal-english.test.ts`

- [ ] **Step 1: Write the test**

```typescript
/**
 * Principle 22 — Internal machinery is English-only.
 *
 * Source: .claude/rules/language-discipline.md + spec
 *   docs/superpowers/specs/2026-06-16-language-discipline-design.md (2026-06-16).
 *
 * Invariant (3-category model §2 of the rule):
 *  - Category 1 (internal machinery): English ALWAYS. Hard-fail any Cyrillic in
 *    machinery shell scripts (hooks/skills/scripts) outside `lang/` packs, and in
 *    SKILL.md BODIES (after frontmatter) outside the match-data allowlist.
 *  - Category 2 (human-facing) lives in lang/ packs or model prose — not checked here.
 *  - Category 3 (match-data: trigger-words, question/decision phrases) — allowed in
 *    frontmatter descriptions and in lang/ packs and in the allowlist below.
 *
 * Low-FP by construction: machinery `.sh` after cleanup is RU-free; SKILL.md bodies
 * are RU-free except pipeline (match-data). FP-prone surfaces (rule files with
 * verbatim maintainer quotes; references match-data) are intentionally NOT scanned —
 * covered by the companion rule's prose.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const CYRILLIC = /[Ѐ-ӿ]/;

// SKILL.md bodies that legitimately carry Cyrillic match-data (category 3).
export const SKILL_BODY_RU_ALLOWLIST = [
  '.claude/skills/pipeline/SKILL.md', // decision-deferral phrases «выбирай сам / оба норм / я устал»
];

function tracked(...globs: string[]): string[] {
  const out = execFileSync('git', ['ls-files', ...globs], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

function cyrillicLines(relPath: string): { n: number; line: string }[] {
  const text = readFileSync(resolve(REPO_ROOT, relPath), 'utf8');
  const hits: { n: number; line: string }[] = [];
  text.split('\n').forEach((line, i) => {
    if (CYRILLIC.test(line)) hits.push({ n: i + 1, line: line.trim().slice(0, 100) });
  });
  return hits;
}

// Strip YAML frontmatter (leading --- ... ---) so trigger-words in `description:` are exempt.
function bodyOf(relPath: string): string {
  const text = readFileSync(resolve(REPO_ROOT, relPath), 'utf8');
  const m = text.match(/^---\n[\s\S]*?\n---\n/);
  return m ? text.slice(m[0].length) : text;
}

describe('Principle 22 — internal machinery is English-only', () => {
  it('Surface 1: no Cyrillic in machinery shell scripts (outside lang/ packs)', () => {
    const files = tracked(
      '.claude/hooks/**/*.sh',
      '.claude/skills/**/*.sh',
      'scripts/**/*.sh',
    ).filter((f) => !/\/lang\/[^/]+\.sh$/.test(f));
    const violations = files
      .map((f) => ({ f, hits: cyrillicLines(f) }))
      .filter((x) => x.hits.length > 0);
    expect(
      violations,
      `Cyrillic in machinery shell:\n${violations
        .map((v) => `${v.f}:\n  ${v.hits.map((h) => `${h.n}: ${h.line}`).join('\n  ')}`)
        .join('\n')}`,
    ).toHaveLength(0);
  });

  it('Surface 2: no Cyrillic in SKILL.md bodies (outside frontmatter + allowlist)', () => {
    const files = tracked('.claude/skills/**/SKILL.md').filter(
      (f) => !SKILL_BODY_RU_ALLOWLIST.includes(f),
    );
    const violations = files.filter((f) => CYRILLIC.test(bodyOf(f)));
    expect(
      violations,
      `Cyrillic in SKILL.md body (translate to English or allowlist if match-data):\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });

  it('mutation: the Cyrillic detector is not vacuous (anti-tautology)', () => {
    expect(CYRILLIC.test('plain english only')).toBe(false);
    expect(CYRILLIC.test('contains затирание russian')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it FAILS (red)**

Run: `cd packages/core && npx vitest run principles/22-internal-english.test.ts`
Expected: FAIL — Surface 1 reports `end-of-turn-reminder.sh` + `harvest-via-api.sh`; Surface 2 reports `self-reflection/SKILL.md`. The mutation test passes. This proves the guard is wired and non-vacuous.

- [ ] **Step 3: Commit (red test)**

```bash
git add packages/core/principles/22-internal-english.test.ts
git commit -m "test(principle-22): guard internal machinery is English-only (red)

Prior-art: skipped — enforcement test for the existing language-discipline convention (spec 2026-06-16), no new external-facing capability."
```

(The `Prior-art:` trailer satisfies the capability-commit gate — a new ≥80-LOC file under `packages/` is flagged; this is enforcement for an existing convention, escape-hatch rationale ≥20 chars.)

---

## Stage A — Cleanup machinery to English (drive the test green)

### Task 2: harvest-via-api.sh comment → English

**Files:**
- Modify: `.claude/skills/dispatcher/helpers/harvest-via-api.sh:5`

- [ ] **Step 1: Edit the comment**

Replace `files that advanced on the base since the container forked are preserved (no затирание).`
with `files that advanced on the base since the container forked are preserved (no clobbering).`

- [ ] **Step 2: Verify no Cyrillic remains**

Run: `grep -n '[А-Яа-яЁё]' .claude/skills/dispatcher/helpers/harvest-via-api.sh || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/dispatcher/helpers/harvest-via-api.sh
git commit -m "refactor(harvest): English comment (language-discipline cleanup)"
```

### Task 3: end-of-turn-reminder.sh comments → English

**Files:**
- Modify: `.claude/hooks/end-of-turn-reminder.sh:76-87`

- [ ] **Step 1: Replace the line-77 comment** (remove the hardcoded RU literal; reference the variable)

Replace lines 76-80:
```bash
# Already-recapped guard: if the current assistant turn already contains the
# canonical "## 🟢 Простыми словами" marker, the recap is done — re-firing would
# re-inject the recap instruction over an existing recap. Complements the
# built-in stop_hook_active guard (hook:7-10) for the case where the model
# proactively recaps in a fresh natural turn (stop_hook_active=false).
```
with:
```bash
# Already-recapped guard: if the current assistant turn already contains the
# active-language recap marker ($AIF_RECAP_MARKER, sourced from lang/), the recap
# is done — re-firing would re-inject the recap instruction over an existing recap.
# Complements the built-in stop_hook_active guard (hook:7-10) for the case where the
# model proactively recaps in a fresh natural turn (stop_hook_active=false).
```

- [ ] **Step 2: Replace the line-85-87 comment**

Replace:
```bash
# Trigger ONLY on (a) a substantial structured answer ("много текста") or
# (b) a question. Tool calls alone do NOT trigger — a short "готово, поправил X"
# turn with no question needs no recap.
```
with:
```bash
# Trigger ONLY on (a) a substantial structured answer (a long body) or
# (b) a question. Tool calls alone do NOT trigger — a short "done, fixed X"
# turn with no question needs no recap.
```

- [ ] **Step 3: Commit** (line 117 patterns handled in Task 4)

```bash
git add .claude/hooks/end-of-turn-reminder.sh
git commit -m "refactor(eot-hook): English comments (language-discipline cleanup)"
```

### Task 4: Move question-detection patterns into lang packs

**Files:**
- Modify: `.claude/hooks/lang/en.sh`, `.claude/hooks/lang/ru.sh`
- Modify: `.claude/hooks/end-of-turn-reminder.sh:117`
- Modify: `.claude/hooks/lang/check-parity.sh`

- [ ] **Step 1: Add `AIF_EOT_QUESTION_PATTERN` to en.sh** (after `AIF_RECAP_MARKER`)

```bash
# Extended-regex of trailing-fork phrases that count as "the turn ended on a choice"
# (used by end-of-turn-reminder.sh Branch B). English phrasings; ru.sh has the Russian.
AIF_EOT_QUESTION_PATTERN='Option [AB]|decide|which (option|approach)|you (decide|choose)|pick (one|between)'
```

- [ ] **Step 2: Add `AIF_EOT_QUESTION_PATTERN` to ru.sh** (after its `AIF_RECAP_MARKER`)

```bash
# Russian phrasings of the trailing-fork detector (sibling of en.sh; same key).
AIF_EOT_QUESTION_PATTERN='выбирай|реши сам|какой (вариант|подход)|выбери|хочешь чтобы'
```

- [ ] **Step 3: Use the variable in the hook** — replace line 117

Replace:
```bash
  elif [ "$orch_mode" = "false" ] && echo "$tail_chunk" | grep -qiE 'Option [AB]|выбирай|decide|хочешь чтобы|which (option|approach)'; then
```
with:
```bash
  elif [ "$orch_mode" = "false" ] && echo "$tail_chunk" | grep -qiE "$AIF_EOT_QUESTION_PATTERN"; then
```

- [ ] **Step 4: Extend check-parity.sh** to include `AIF_EOT_*` keys — replace its `keys()` body's marker line

Replace:
```bash
    grep -qE '^AIF_RECAP_MARKER=' "$1" && echo 'AIF_RECAP_MARKER'
```
with:
```bash
    grep -qE '^AIF_RECAP_MARKER=' "$1" && echo 'AIF_RECAP_MARKER'
    grep -oE '^AIF_EOT_[A-Z_]+=' "$1" | sed 's/=$//'
```

- [ ] **Step 5: Run parity + a behaviour smoke**

Run:
```bash
bash .claude/hooks/lang/check-parity.sh
echo '---'
( . .claude/hooks/lang/ru.sh; echo "выбирай сам" | grep -qiE "$AIF_EOT_QUESTION_PATTERN" && echo "RU match OK" )
( . .claude/hooks/lang/en.sh; echo "you decide" | grep -qiE "$AIF_EOT_QUESTION_PATTERN" && echo "EN match OK" )
```
Expected: `OK: en.sh and ru.sh expose identical keys (... entries).` then `RU match OK` then `EN match OK`.

- [ ] **Step 6: Verify hook body is Cyrillic-free**

Run: `grep -n '[А-Яа-яЁё]' .claude/hooks/end-of-turn-reminder.sh || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 7: Commit**

```bash
git add .claude/hooks/lang/en.sh .claude/hooks/lang/ru.sh .claude/hooks/end-of-turn-reminder.sh .claude/hooks/lang/check-parity.sh
git commit -m "refactor(eot-hook): move question-detection phrases into lang packs (category-3 match-data)"
```

### Task 5: self-reflection/SKILL.md body → English

**Files:**
- Modify: `.claude/skills/self-reflection/SKILL.md:84-87`

- [ ] **Step 1: Translate the four body labels** (these are internal instruction labels, not match-data)

Replace:
```markdown
1. **Когда ошибся — почему?** — moment + cognitive shortcut.
2. **Мог ли пропускать раньше?** — calibration: one-off vs systemic.
3. **Как не пропускать?** — map to §1.1-§1.7 or propose new item.
4. **Какой урок?** — operationalisable form, not «be more careful».
```
with:
```markdown
1. **When you erred — why?** — moment + cognitive shortcut.
2. **Could you have skipped this before?** — calibration: one-off vs systemic.
3. **How to not skip it?** — map to §1.1-§1.7 or propose new item.
4. **What is the lesson?** — operationalisable form, not "be more careful".
```

(Line 3 frontmatter trigger-words and line 108's keyword reference `правило` stay — they are category-3 match metadata, exempt by the test's frontmatter strip + they are inside backtick/keyword context. Verify in Step 2 that no Cyrillic remains OUTSIDE frontmatter and outside the line-108 keyword list.)

- [ ] **Step 2: Check what Cyrillic remains in the body**

Run: `grep -n '[А-Яа-яЁё]' .claude/skills/self-reflection/SKILL.md`
Expected: only line 3 (frontmatter description triggers) and line 108 (keyword reference `правило`). If line 108's `правило` is the only body hit, decide: it is a literal trigger keyword being documented → wrap it so it reads as a token. Edit line 108 to reference the keyword as English-described: change `on keywords \`правило\`, \`principle\`, \`discipline\`, etc.` to `on keywords like \`principle\`, \`discipline\`, and their Russian equivalents, etc.` — removing the inline Cyrillic from the body while preserving meaning. (The actual RU trigger lives in the frontmatter, which is exempt.)

- [ ] **Step 3: Verify Surface 2 will pass**

Run: `cd packages/core && npx vitest run principles/22-internal-english.test.ts -t "Surface 2"`
Expected: PASS (self-reflection body now Cyrillic-free; pipeline allowlisted).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/self-reflection/SKILL.md
git commit -m "refactor(self-reflection): English body labels (keep RU frontmatter triggers)"
```

### Task 6: Full guard-test green

- [ ] **Step 1: Run the whole principle 22 test**

Run: `cd packages/core && npx vitest run principles/22-internal-english.test.ts`
Expected: PASS (all 3 tests green).

- [ ] **Step 2: Run the full principle suite (no regressions)**

Run: `cd packages/core && npx vitest run principles/`
Expected: PASS (no other principle broke; principle 09 doc-authority still green — language-discipline.md rule added in Task 9).

---

## Stage B — Reliable human-facing language gate

### Task 7: B1 — always-on output-language signal

**Files:**
- Modify: `.claude/hooks/inject-session-bootstrap.sh`

- [ ] **Step 1: Make the hook read `AIF_HOOK_LANG` and append a scoped line**

The current hook is a single static `cat <<'DIGEST' ... DIGEST`. After the closing `DIGEST` line, append:

```bash

# B1 (language-discipline): when the operator pins a non-English human-facing language,
# tell the model — every turn, all skills. Precisely scoped so repo artifacts stay English.
case "${AIF_HOOK_LANG:-en}" in
  en|'') : ;;  # English default — nothing to inject
  ru)
    cat <<'LANGRU'
[output-language] Address the operator in Russian — chat explanations, recaps, narration, questions. Keep ALL repo artifacts and machinery in English: code, comments, commit/PR/issue bodies, kickoffs, specs, tool arguments, file contents. (AIF_HOOK_LANG=ru)
LANGRU
    ;;
  *)
    printf '[output-language] Address the operator in language "%s"; keep repo artifacts and machinery in English. (AIF_HOOK_LANG=%s)\n' "$AIF_HOOK_LANG" "$AIF_HOOK_LANG"
    ;;
esac
```

- [ ] **Step 2: Smoke — ru injects, default does not**

Run:
```bash
AIF_HOOK_LANG=ru bash .claude/hooks/inject-session-bootstrap.sh | grep -q '\[output-language\] Address the operator in Russian' && echo "RU line present OK"
bash .claude/hooks/inject-session-bootstrap.sh | grep -q '\[output-language\]' && echo "UNEXPECTED" || echo "EN default: no line OK"
```
Expected: `RU line present OK` then `EN default: no line OK`.

- [ ] **Step 3: Always-on budget stays green**

Run: `AIF_ALWAYSON_CEILING=$(AIF_ALWAYSON_CEILING=101000 echo 101000); bash scripts/check-alwayson-budget.sh`
Expected: `OK: always-on <N>B within ceiling 101000B` (the default-language measurement adds 0 bytes; the case-branch only fires when `AIF_HOOK_LANG=ru`).

- [ ] **Step 4: Verify the hook itself is Cyrillic-free** (English machinery — the RU is only the instruction text, which is English prose telling the model to use Russian)

Run: `grep -n '[А-Яа-яЁё]' .claude/hooks/inject-session-bootstrap.sh || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/inject-session-bootstrap.sh
git commit -m "feat(bootstrap): B1 always-on output-language signal gated on AIF_HOOK_LANG"
```

### Task 8: B2 — pipeline render-time AIF_OUTPUT_LANG + prose directive

**Files:**
- Modify: `.claude/skills/pipeline/helpers/emit-output-strings.sh`
- Modify: `.claude/skills/pipeline/SKILL.md:465`

- [ ] **Step 1: Emit `AIF_OUTPUT_LANG`** — in emit-output-strings.sh, after the `for k in ... done` loop, add:

```bash
# Active human-facing language (basename of the actually-sourced pack — reflects EN
# fallback when the requested pack is missing). The SKILL reads this to write report PROSE.
printf 'AIF_OUTPUT_LANG=%s\n' "$(basename "$_lang_file" .sh)"
```

- [ ] **Step 2: Strengthen the §10 i18n instruction** — in SKILL.md line 465, replace the sentence
`Default is English; the operator's \`AIF_HOOK_LANG=ru\` yields Russian. The example tables show the English (default) tokens.`
with:
`The helper also emits \`AIF_OUTPUT_LANG\`: write the ENTIRE session-report PROSE in that language — descriptions, "Why now", the plain-words recap body, and all narration — not only the table headers. Default is English; the operator's \`AIF_HOOK_LANG=ru\` yields \`AIF_OUTPUT_LANG=ru\` → write the prose in Russian. The example tables show the English (default) tokens.`

- [ ] **Step 3: Smoke — AIF_OUTPUT_LANG emitted per language, EN fallback**

Run:
```bash
bash .claude/skills/pipeline/helpers/emit-output-strings.sh | grep '^AIF_OUTPUT_LANG='        # AIF_OUTPUT_LANG=en
AIF_HOOK_LANG=ru bash .claude/skills/pipeline/helpers/emit-output-strings.sh | grep '^AIF_OUTPUT_LANG='   # AIF_OUTPUT_LANG=ru
AIF_HOOK_LANG=zz bash .claude/skills/pipeline/helpers/emit-output-strings.sh | grep '^AIF_OUTPUT_LANG='   # AIF_OUTPUT_LANG=en (fallback)
```
Expected: `AIF_OUTPUT_LANG=en`, `AIF_OUTPUT_LANG=ru`, `AIF_OUTPUT_LANG=en`.

- [ ] **Step 4: Pipeline principle test still green** (it asserts EN canonical + RU pack tokens)

Run: `cd packages/core && npx vitest run principles/18-meta-orchestrator-output-format.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/pipeline/helpers/emit-output-strings.sh .claude/skills/pipeline/SKILL.md
git commit -m "feat(pipeline-i18n): emit AIF_OUTPUT_LANG + directive to write ALL report prose in it"
```

---

## Stage C2 — Companion rule

### Task 9: `.claude/rules/language-discipline.md`

**Files:**
- Create: `.claude/rules/language-discipline.md`
- Possibly modify: `packages/core/principles/09-doc-authority-hierarchy.ts` (register the new rule if principle 09 uses an explicit list, not a glob)

- [ ] **Step 1: Write the rule** (doc-authority header + Class A + 3-category model)

```markdown
# Language discipline — internal English, human-facing AIF_HOOK_LANG-gated

> **Class:** A — companion principle test shipped at [packages/core/principles/22-internal-english.test.ts](../../packages/core/principles/22-internal-english.test.ts) (2026-06-16).
> **Authoritative for:** the language-discipline rule — §1 the 3-category model, §2 the human-facing language gate, §3 the keep-list, §4 enforcement channels, §5 anti-patterns, §6 promotion / retirement.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The i18n pack mechanism — see [docs/superpowers/specs/2026-06-01-hook-lang-i18n-design.md](../../docs/superpowers/specs/2026-06-01-hook-lang-i18n-design.md). Doc-authority header spec — see [doc-authority-hierarchy.md](doc-authority-hierarchy.md).

> **Origin:** 2026-06-16 maintainer dialogue — internal machinery was mixed RU/EN; `/pipeline` localized table headers but wrote English prose even under `AIF_HOOK_LANG=ru`. Spec: [docs/superpowers/specs/2026-06-16-language-discipline-design.md](../../docs/superpowers/specs/2026-06-16-language-discipline-design.md).

## §1 The 3-category model

| # | Category | Rule | Examples |
|---|---|---|---|
| 1 | Internal machinery — comments, logic, AI-facing SKILL instructions, tool args, code, repo artifacts (kickoffs, specs, commit/PR bodies) | **English, always** | hook comments; instruction prose |
| 2 | Human-facing output — what the AI/hook addresses to the operator | **AIF_HOOK_LANG-gated**: `ru` → Russian, else English | pipeline report prose; chat answers |
| 3 | Activation / match metadata — strings whose purpose is to match possibly-Russian operator input/output | **bilingual / language-specific kept** | skill `description` triggers; `AIF_EOT_QUESTION_PATTERN`; decision-deferral phrase lists |

Category 3 is the trap: removing those Russian tokens silently breaks recognition of Russian operator input/output, with no upside.

## §2 The human-facing language gate

Two sub-channels:
- **2a shell-emitted** (hooks/helpers `echo`, no LLM): via `lang/{en,ru}.sh` packs.
- **2b LLM-authored** (model writes prose): the model learns the active language from (i) the always-on line injected by [`inject-session-bootstrap.sh`](../hooks/inject-session-bootstrap.sh) (every turn, all skills) and (ii) the pipeline `AIF_OUTPUT_LANG` render-time signal, and MUST write ALL operator-facing prose in it.

Precedence: `AIF_HOOK_LANG` overrides the prompt-language default when set; unset → English.

## §3 Keep-list (legitimate Russian — do NOT translate)

`lang/ru.sh` packs; skill `description` trigger-words; `AIF_EOT_QUESTION_PATTERN` and decision-deferral phrase lists (category 3); verbatim maintainer quotes in rule files; RU eval fixtures; the RU narrative `docs/meta-factory/project-history-book.md`.

## §4 Enforcement channels

- **Edit/CI:** [principle 22](../../packages/core/principles/22-internal-english.test.ts) — Surface 1 (machinery shell, zero-tolerance) + Surface 2 (SKILL.md bodies, allowlisted). Low-FP by construction; rule files + references match-data are NOT scanned (covered by this prose).
- **Always-on:** the B1 output-language line (`inject-session-bootstrap.sh`).
- **Parity:** `lang/check-parity.sh` (en/ru key parity, incl. `AIF_EOT_*`).

## §5 Anti-patterns

- **`#russian-in-machinery`** — Cyrillic comment/prose in a hook/script/skill body. Counter: translate; principle 22 Surface 1/2 catches it.
- **`#headers-localized-prose-not`** — localizing shell tokens but writing prose in the wrong language. Counter: §2b — model writes ALL prose in `AIF_OUTPUT_LANG` / the injected output-language.
- **`#match-data-translated-away`** — "making it English" by deleting category-3 Russian tokens, breaking Russian-input recognition. Counter: §1 category 3 — keep; move into `lang/` packs.

## §6 Promotion / retirement

- Already Class A (principle 22 shipped). Strengthening trigger: if a `#russian-in-machinery` incident slips past Surface 1/2 (e.g., in a non-scanned surface), widen the test's scanned globs.
- Retirement: 12 months zero incidents AND principle 22 green across the window → archive to prose in [CLAUDE.md](../../CLAUDE.md). Matches peer-rule criteria ([reviewer-discipline.md §4](reviewer-discipline.md)).

## See also

- [packages/core/principles/22-internal-english.test.ts](../../packages/core/principles/22-internal-english.test.ts) — companion test.
- [docs/superpowers/specs/2026-06-16-language-discipline-design.md](../../docs/superpowers/specs/2026-06-16-language-discipline-design.md) — design.
- [dual-implementation-discipline.md](dual-implementation-discipline.md) — `@dual-pair` i18n packs precedent.
```

- [ ] **Step 2: Run doc-authority + markdownlint**

Run:
```bash
cd packages/core && npx vitest run principles/09-doc-authority-hierarchy.test.ts; cd ..
npx markdownlint-cli2 .claude/rules/language-discipline.md
```
Expected: principle 09 PASS. If it FAILS reporting `language-discipline.md` missing/unlisted, open `packages/core/principles/09-doc-authority-hierarchy.ts`, add `.claude/rules/language-discipline.md` to `REQUIRED_HEADER_DOCS` (or confirm it is glob-covered), re-run → PASS. markdownlint: 0 errors.

- [ ] **Step 3: Run §1.7 self-reflection** (this is a discipline-bearing rule)

Invoke `self-reflection` skill: forward-check (does this rule comply with no-paid-llm-in-ci, build-first-reuse-default, doc-authority-hierarchy?) + backward-check (does it supersede/duplicate an existing rule?). Record the two-line result in the commit body.

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/language-discipline.md packages/core/principles/09-doc-authority-hierarchy.ts
git commit -m "feat(rule): language-discipline (Class A) — 3-category model + AIF_HOOK_LANG gate

Forward-check: complies with no-paid-llm-in-ci (deterministic grep, no API),
doc-authority-hierarchy (header present), build-first-reuse (reuses lang-pack mechanism).
Backward-check: extends, does not supersede, dual-implementation-discipline i18n precedent.

Prior-art: skipped — discipline rule + companion test for existing convention, no new capability."
```

---

## Stage D — Final verification

### Task 10: Whole-suite + sweep

- [ ] **Step 1: Full principle suite**

Run: `cd packages/core && npx vitest run principles/`
Expected: PASS (incl. 09, 18, 22).

- [ ] **Step 2: Repo-wide Cyrillic sweep of machinery (manual confirmation)**

Run:
```bash
git ls-files '.claude/hooks/**/*.sh' '.claude/skills/**/*.sh' 'scripts/**/*.sh' \
  | grep -v '/lang/' | xargs grep -l '[А-Яа-яЁё]' 2>/dev/null || echo "machinery shell: CLEAN"
```
Expected: `machinery shell: CLEAN`.

- [ ] **Step 3: Behavioural confirmation of the gate (the original pain)**

Run: `AIF_HOOK_LANG=ru bash .claude/hooks/inject-session-bootstrap.sh | tail -2`
Expected: the `[output-language] Address the operator in Russian ...` line is present — proving a `ru` session now gets the explicit prose directive every turn.

- [ ] **Step 4: Report to maintainer** — summary of what changed, confirm the pipeline-prose fix is live, surface any deferred residue (e.g., new-language packs YAGNI).

---

## Self-Review

**Spec coverage:** §2 model → rule §1 + test (Task 1, 9). §3 cleanup → Tasks 2–5. §4 B1/B2 → Tasks 7–8. §5 guard+rule → Tasks 1, 9. §6 decisions (triggers bilingual / B1 global / precedence) → encoded in Task 5 (keep frontmatter), Task 7 (case-branch all skills), rule §2. §7 out-of-scope → not touched (no task edits `~/.claude/CLAUDE.md` or narrative). No gaps.

**Placeholder scan:** every code step shows full content; test commands have expected output; the only judgement step (Task 5 Step 2 line-108) is concrete with the exact edit. OK.

**Type consistency:** `AIF_EOT_QUESTION_PATTERN` (Tasks 4), `AIF_OUTPUT_LANG` (Task 8), `SKILL_BODY_RU_ALLOWLIST` (Task 1) used consistently. The test's `CYRILLIC` regex and `bodyOf`/`cyrillicLines` helpers are self-contained. OK.
