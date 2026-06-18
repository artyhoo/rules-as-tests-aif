# `/pipeline` i18n fix — output language follows `AIF_HOOK_LANG` — Implementation Plan (PR2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `/pipeline` so its model output (all prose, not just labels) renders in the operator's language, by adding an output-language directive token — hook-style.

**Architecture:** `/pipeline` currently localizes only short UI tokens while `SKILL.md` is English, so the generated prose drifts to English. Add `AIF_PIPELINE_OUTPUT_DIRECTIVE` to the lang packs + the emit helper; `SKILL.md` surfaces it at the top of report generation so the whole report follows `AIF_HOOK_LANG`. Independent of PR1.

**Tech Stack:** Bash (skill helper), Markdown (SKILL.md), Vitest (test), `jq`. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-06-16-session-story-recap-design.md §Component 4](../specs/2026-06-16-session-story-recap-design.md). **Companion plan:** [2026-06-16-session-story-recap.md](2026-06-16-session-story-recap.md) (PR1, independent).

**Why (evidence):** `.claude/skills/pipeline/lang/ru.sh` defines only label tokens (column headers, status words); there is no output-language directive, so the model writes its analysis prose from the English `SKILL.md` and only swaps labels. The hook avoids this by injecting a wholly-localized directive. This fix applies the hook approach to `/pipeline`.

---

## File Structure (PR2)

| File | Responsibility |
|---|---|
| `.claude/skills/pipeline/lang/en.sh` / `ru.sh` | + `AIF_PIPELINE_OUTPUT_DIRECTIVE` |
| `.claude/skills/pipeline/helpers/emit-output-strings.sh` | emit the new directive key |
| `.claude/skills/pipeline/SKILL.md` | surface the directive at top of report generation |
| `packages/core/skills/emit-output-strings.test.ts` | + directive cases |
| `docs/superpowers/specs/2026-06-03-pipeline-skill-i18n-design.md` | + pointer note (output-language superseded) |

---

## Task 1: Pipeline output-language directive (TDD)

**Files:**
- Test: `packages/core/skills/emit-output-strings.test.ts` (add cases)
- Modify: `.claude/skills/pipeline/lang/en.sh` + `lang/ru.sh`
- Modify: `.claude/skills/pipeline/helpers/emit-output-strings.sh` (the `for k in` list)

- [ ] **Step 1: Add failing test cases**

In `packages/core/skills/emit-output-strings.test.ts`, add inside `describe('emit-output-strings.sh', ...)`:
```typescript
  it('default emits the English output-language directive', () => {
    const out = run(undefined);
    expect(out).toMatch(/AIF_PIPELINE_OUTPUT_DIRECTIVE=Write the entire report in English\./);
  });

  it('AIF_HOOK_LANG=ru emits the Russian output-language directive', () => {
    const out = run('ru');
    expect(out).toMatch(/AIF_PIPELINE_OUTPUT_DIRECTIVE=Сформируй весь отчёт на русском языке\./);
  });
```

- [ ] **Step 2: Run → fail**

Run: `npx vitest run packages/core/skills/emit-output-strings.test.ts -t directive`
Expected: FAIL (key not emitted).

- [ ] **Step 3: Implement**

Add to `.claude/skills/pipeline/lang/en.sh`:
```bash
AIF_PIPELINE_OUTPUT_DIRECTIVE='Write the entire report in English.'
```
Add to `.claude/skills/pipeline/lang/ru.sh`:
```bash
AIF_PIPELINE_OUTPUT_DIRECTIVE='Сформируй весь отчёт на русском языке.'
```
In `.claude/skills/pipeline/helpers/emit-output-strings.sh`, add `AIF_PIPELINE_OUTPUT_DIRECTIVE` to the `for k in ...` list (first key, before `AIF_PIPELINE_COL_PASTE`):
```bash
for k in AIF_PIPELINE_OUTPUT_DIRECTIVE AIF_PIPELINE_COL_PASTE AIF_PIPELINE_COL_WHEN AIF_PIPELINE_COL_WAITING \
```

- [ ] **Step 4: Run → pass + parity**

Run:
```bash
npx vitest run packages/core/skills/emit-output-strings.test.ts
bash .claude/skills/pipeline/lang/check-parity.sh
```
Expected: PASS; parity `OK` (the new `AIF_PIPELINE_*` key is auto-checked by the existing grep — no parity-script change needed).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/pipeline/lang/en.sh .claude/skills/pipeline/lang/ru.sh .claude/skills/pipeline/helpers/emit-output-strings.sh packages/core/skills/emit-output-strings.test.ts
git commit -m "fix(pipeline): emit AIF_PIPELINE_OUTPUT_DIRECTIVE so report output follows AIF_HOOK_LANG

Prior-art: skipped — i18n fix to existing shipped skill, no new capability/dependency."
```

---

## Task 2: Surface the directive in `/pipeline` SKILL.md

**Files:**
- Modify: `.claude/skills/pipeline/SKILL.md` (the `**Output language (i18n):**` paragraph, ~line 465)

- [ ] **Step 1: Add the output-directive instruction**

In the `**Output language (i18n):**` paragraph, after the sentence listing the emitted `AIF_PIPELINE_*` values, add:
```markdown
**Crucially, obey `AIF_PIPELINE_OUTPUT_DIRECTIVE` (also emitted): write the ENTIRE report — all prose, not only the column headers/labels — in the language it names.** Localizing only the labels (the prior behaviour) let the generated prose drift to English; the directive is what keeps the whole output in the operator's language (hook-style). Default is English; `AIF_HOOK_LANG=ru` yields a fully Russian report.
```

- [ ] **Step 2: Sanity-check the skill still reads coherently**

Run: `sed -n '460,472p' .claude/skills/pipeline/SKILL.md`
Expected: the new directive instruction reads cleanly inside the i18n paragraph.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/pipeline/SKILL.md
git commit -m "fix(pipeline): SKILL.md surfaces AIF_PIPELINE_OUTPUT_DIRECTIVE (write whole report in active lang)

Prior-art: skipped — doc/instruction edit to existing skill, no new capability."
```

---

## Task 3: Pointer note in the 2026-06-03 pipeline i18n spec

**Files:**
- Modify: `docs/superpowers/specs/2026-06-03-pipeline-skill-i18n-design.md` (add a note after the Origin block)

- [ ] **Step 1: Add the supersede note**

Insert after the `> **Origin:** ...` blockquote:
```markdown
> **Update (2026-06-16):** the token-only approach localized labels but NOT the
> model's generated prose, so RU-operator output drifted to English. Superseded for
> output language by an explicit `AIF_PIPELINE_OUTPUT_DIRECTIVE` (hook-style full
> directive) — see [2026-06-16-session-story-recap-design.md §Component 4](2026-06-16-session-story-recap-design.md).
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-06-03-pipeline-skill-i18n-design.md
git commit -m "docs(spec): note pipeline output-language superseded by hook-style directive

Prior-art: skipped — doc pointer note, no capability."
```

---

## Task 4: PR2 full verification + open PR

- [ ] **Step 1: Run pipeline suites + parity**

Run:
```bash
npx vitest run packages/core/skills/emit-output-strings.test.ts
bash .claude/skills/pipeline/lang/check-parity.sh
```
Expected: PASS / OK.

- [ ] **Step 2: Live smoke**

Run: `AIF_HOOK_LANG=ru bash .claude/skills/pipeline/helpers/emit-output-strings.sh | grep OUTPUT_DIRECTIVE`
Expected: `AIF_PIPELINE_OUTPUT_DIRECTIVE=Сформируй весь отчёт на русском языке.`

- [ ] **Step 3: Push + open PR2 (base `staging`)**

```bash
git push -u origin HEAD
gh pr create --base staging --title "fix(pipeline): output language follows AIF_HOOK_LANG (hook-style directive)" --body "<fill §1.7 Forward/Backward + checklist>"
```
Note (memory): the `discipline-self-check.yml` §1.7 gate needs `### §1.7 Forward-check applied` + `### §1.7 Backward-check applied` headings, each with a `file:line` citation.

---

## Self-Review (PR2, against spec)

- **Spec coverage:** Component 4 (`/pipeline` i18n fix) → Tasks 1–2; spec supersede note → Task 3.
- **Type/name consistency:** `AIF_PIPELINE_OUTPUT_DIRECTIVE` identical across lang packs, emit helper, test, and SKILL.md.
- **Placeholder scan:** every step contains full content; directive strings match verbatim between Task 1 (impl) and the test assertions.

## Known gotchas

- `AIF_PIPELINE_OUTPUT_DIRECTIVE` matches the existing `AIF_PIPELINE_[A-Z_]+` grep in `.claude/skills/pipeline/lang/check-parity.sh` → auto-checked; do NOT need to edit the parity script.
- `/pipeline` is shipped to consumers; default `AIF_HOOK_LANG=en` → English directive → no behaviour change for default consumers; only `AIF_HOOK_LANG=ru` operators get fully-Russian output.
- Not a capability commit (i18n fix to existing skill, no new dep / no ≥80-LOC new packages file).
