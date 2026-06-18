# `/story` session-recap (skill + Stop-hook branch) — Implementation Plan (PR1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/story` skill + a Stop-hook auto-branch that narrate the session as an engaging, plain-language story when work is done (a PR was pushed).

**Architecture:** One localized story-instruction (`aif_msg_eot_branch_story` in the hook lang packs) is the single source of truth, consumed by two channels — the Stop hook (auto, on PR-create) and the `/story` skill (manual, via a `!bash` helper that sources the shared pack). Language follows `AIF_HOOK_LANG` (EN canonical / RU operator) — hook-style full-directive injection, NOT pipeline-style token substitution.

**Tech Stack:** Bash (CC hook + skill helper), Markdown (SKILL.md), Vitest + spawnSync (tests), `jq`. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-06-16-session-story-recap-design.md](../specs/2026-06-16-session-story-recap-design.md). **Companion plan:** [2026-06-16-pipeline-i18n-fix.md](2026-06-16-pipeline-i18n-fix.md) (PR2, independent).

---

## File Structure (PR1)

| File | Responsibility |
|---|---|
| `.claude/hooks/lang/en.sh` / `ru.sh` | + `AIF_STORY_MARKER` + `aif_msg_eot_branch_story()` — the single SSOT story prose (EN canonical / RU operator) |
| `.claude/hooks/lang/check-parity.sh` | extend `keys()` to also check `AIF_STORY_MARKER` |
| `.claude/hooks/end-of-turn-reminder.sh` | + PR-create detection, debounce, already-told guard, story-branch selection |
| `packages/core/hooks/end-of-turn-reminder.test.ts` | + story-branch cases (positive / negative / debounce) |
| `.claude/skills/story/SKILL.md` | `/story` skill (EN canonical): run helper, narrate by acts |
| `.claude/skills/story/helpers/emit-story-prompt.sh` | source shared hook pack, echo active-language story prose |
| `packages/core/skills/emit-story-prompt.test.ts` | helper i18n test |
| `docs/meta-factory/prior-art-evaluations.md` | + 1 SSOT row |

---

## Task 1: SSOT row (prior-art residue)

**Files:**
- Modify: `docs/meta-factory/prior-art-evaluations.md` (append one row at the end of the register table)

- [ ] **Step 1: Find the next free SSOT ID**

Run:
```bash
cd "$(git rev-parse --show-toplevel)"
grep -oE '^\| [0-9]+ ' docs/meta-factory/prior-art-evaluations.md | tr -d '| ' | sort -n | tail -1
```
Add 1 → call it `N`. Sanity per memory `project_aif_qloop_park_primitive_brainstorm_done` (SSOT-ID collisions under parallel work): `gh pr list --state open --search "prior-art" 2>/dev/null` — if another open PR claims `N`, use `N+1`.

- [ ] **Step 2: Append the row** (replace `N` with the computed id)

```markdown
| N | `session-report` CC plugin (`claude-plugins-official/plugins/session-report`) = usage analytics (tokens/cache/expensive-prompt HTML dashboard); ecosystem session-recap skills (`annikalewis/claude-recap`, Ben Poole session-recap) = cross-session memory ("where did we leave off") | Engaging plain-language "story-in-acts" completion recap for the human (the `/story` skill + Stop-hook branch) | 2026-06-16 | 2026-06-16 | REJECT (session-report) · REFERENCE (claude-recap) | **T16 problem-class check:** session-report's class = usage/cost analytics → REJECT (different problem). claude-recap et al. class = memory/continuity archaeology for the *next* session → REFERENCE only: the reusable bit is "read `~/.claude/projects/*.jsonl` transcript directly", which we already have (`end-of-turn-reminder.sh:23` reads `transcript_path`). The story-in-acts *style* is maintainer taste — BUILD (cheap: lang-function + skill md + helper + hook branch, no new dep). Survey 2026-06-16: installed companions + SSOT + WebSearch ×2. | If a companion ships a human-facing engaging-completion-recap (not analytics, not memory) — re-evaluate ADOPT. |
```

- [ ] **Step 3: Commit**

```bash
git add docs/meta-factory/prior-art-evaluations.md
git commit -m "docs(ssot): session-report REJECT + claude-recap REFERENCE for /story recap

Prior-art: skipped — SSOT register append documenting the build-vs-reuse verdict for the /story feature itself; no new capability in this commit."
```

---

## Task 2: Story lang function + marker (both packs) + parity

**Files:**
- Modify: `.claude/hooks/lang/en.sh` (append before EOF)
- Modify: `.claude/hooks/lang/ru.sh` (append before EOF)
- Modify: `.claude/hooks/lang/check-parity.sh` (the `keys()` function)

- [ ] **Step 1: Add the EN marker + function to `en.sh`**

Append to `.claude/hooks/lang/en.sh`:
```bash
# Story-recap heading (Stop-hook story branch + /story skill greps/embeds this).
AIF_STORY_MARKER='## 🎬 The story'

# Stop hook — story branch / /story skill: engaging plain-language session recap
# delivered when work is done (a PR was pushed). Hook-style: the whole instruction
# is localized so output language follows the active pack. ${anchor:-} is safe when
# unset (the /story skill has no transcript anchor and names the goal from context).
aif_msg_eot_branch_story() {
  cat <<EOF
The work is done (a PR was just pushed) — now tell the human the story of this whole session, primarily for them.
You MUST begin the block with exactly the line "${AIF_STORY_MARKER}" — so the human spots it at a glance.

Session goal (from the title / first instruction): "${anchor:-(name it yourself from context)}".

Tell it as a story, in plain, engaging language — NOT a dry checklist:
• Open in one sentence — what we set out to do and why, in human terms.
• By acts — the narrative arc of the key moves, named (file / PR / decision): what we did, what went wrong, how we fixed it.
• Explain jargon on the spot — hit a term (egress, caffeinate, Docker) → give a one-line analogy right there.
• Be honest — where it is thinly verified (one run, one case), what you are least sure of, what is still left.
• End on the human — the one thing left for them to decide or do ("one step — your go").
Tone: interesting, like a story; no filler, no self-congratulation; truth over smoothness. If a part does not come out concrete, say so plainly.
EOF
}
```

- [ ] **Step 2: Add the RU marker + function to `ru.sh`**

Append to `.claude/hooks/lang/ru.sh`:
```bash
# Заголовок story-пересказа (story-ветка Stop-хука + скил /story).
AIF_STORY_MARKER='## 🎬 Как это было'

# Stop hook — story-ветка / скил /story: живой пересказ сессии простыми словами,
# когда работа сдана (запушен PR). Hook-style: вся инструкция локализована, поэтому
# язык вывода следует активному паку. ${anchor:-} безопасен при unset (у скила /story
# нет transcript-anchor — цель он называет сам из контекста).
aif_msg_eot_branch_story() {
  cat <<EOF
Работа сдана (только что запушен PR) — расскажи человеку историю всей сессии, в первую очередь для него.
ОБЯЗАТЕЛЬНО начни блок ровно со строки "${AIF_STORY_MARKER}" — чтобы человек опознал его с ходу.

Цель сессии (из названия / первого задания): "${anchor:-(назови сам из контекста)}".

Рассказывай как историю, простым и живым языком — НЕ сухим чеклистом:
• Открой одной фразой — что вообще затевали и зачем, по-человечески.
• По актам — сюжетная арка ключевых ходов, с именами (файл / PR / решение): что делали, что пошло не так, как починили.
• Жаргон объясняй на месте — встретил термин (egress, caffeinate, Docker) → тут же аналогия одной строкой.
• Будь честен — где проверено слабо (1 прогон, 1 случай), в чём меньше всего уверен, что осталось.
• Кончи на человеке — одна вещь, которую решить/сделать ему («один шаг — твоё „го"»).
Тон: интересно, как история; без воды и само-поздравления; правда важнее гладкости. Если пункт не выходит конкретным — скажи прямо.
EOF
}
```

- [ ] **Step 3: Extend `check-parity.sh` to also check `AIF_STORY_MARKER`**

In `.claude/hooks/lang/check-parity.sh`, the `keys()` function has the line:
```bash
    grep -qE '^AIF_RECAP_MARKER=' "$1" && echo 'AIF_RECAP_MARKER'
```
Add immediately after it (inside the `{ ... }` block):
```bash
    grep -qE '^AIF_STORY_MARKER=' "$1" && echo 'AIF_STORY_MARKER'
```
(`aif_msg_eot_branch_story` is matched automatically by the existing `^aif_msg_[a-z_]+\(\)` grep.)

- [ ] **Step 4: Run parity → OK**

Run: `bash .claude/hooks/lang/check-parity.sh`
Expected: `OK: en.sh and ru.sh expose identical keys (N entries).` exit 0.

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/lang/en.sh .claude/hooks/lang/ru.sh .claude/hooks/lang/check-parity.sh
git commit -m "feat(hooks): add aif_msg_eot_branch_story + AIF_STORY_MARKER (shared /story SSOT prose)

Prior-art: prior-art-evaluations.md#N (claude-recap REFERENCE / session-report REJECT — narrative recap, problem-class mismatch with analytics/memory)."
```

---

## Task 3: Stop-hook story branch (TDD)

**Files:**
- Test: `packages/core/hooks/end-of-turn-reminder.test.ts` (add a helper + a `describe` block)
- Modify: `.claude/hooks/end-of-turn-reminder.sh`

- [ ] **Step 1: Add the test helper + failing cases**

In `packages/core/hooks/end-of-turn-reminder.test.ts`, add this helper next to `assistantTextAndToolUse` (~line 91):
```typescript
function assistantBashToolUse(text: string, command: string) {
  return {
    type: 'assistant',
    message: {
      content: [
        { type: 'text', text },
        { type: 'tool_use', name: 'Bash', input: { command } },
      ],
    },
  };
}
```
Add this `describe` block inside the top-level `describe.skipIf(!JQ)(...)` (before its final closing `});`):
```typescript
  describe('story branch — PR-create → engaging completion recap (hook-style, RU default)', () => {
    it('turn with `gh pr create` tool_use → emits 🎬 story instruction (not the dry recap)', () => {
      const tr = writeTranscript([
        aiTitle('Цель сессии'),
        userTurn('первое задание'),
        assistantBashToolUse('Открываю PR.', 'gh pr create --base staging --title x --body y'),
      ]);
      const r = runHook({ transcript_path: tr, stop_hook_active: false, session_id: 'story-ghpr' });
      expect(r.status, `stderr: ${r.stderr}`).toBe(0);
      expect(r.stdout, 'gh pr create turn must fire the story branch').not.toBe('');
      const payload = JSON.parse(r.stdout);
      expect(payload.decision).toBe('block');
      expect(payload.reason).toContain('## 🎬 Как это было');
      expect(payload.reason).toMatch(/по актам/);
    });

    it('NO PR signal: long markdown turn → dry recap (## 🟢), NOT the 🎬 story (paired-negative)', () => {
      const tr = writeTranscript([
        aiTitle('Цель сессии'),
        userTurn('первое задание'),
        assistantText(longMarkdownText()),
      ]);
      const r = runHook({ transcript_path: tr, stop_hook_active: false, session_id: 'story-none' });
      expect(r.status).toBe(0);
      const payload = JSON.parse(r.stdout);
      expect(payload.reason).toContain('## 🟢 Простыми словами');
      expect(payload.reason, 'no PR → must not emit the story branch').not.toContain('## 🎬');
    });

    it('debounce: same PR storied twice in one session → second turn silent', () => {
      const tdir = mkdtempSync(join(tmpdir(), 'm4-5-story-'));
      tmpDirs.push(tdir);
      const mkTr = () =>
        writeTranscript([
          aiTitle('Цель сессии'),
          userTurn('первое задание'),
          assistantText('PR открыт: https://github.com/o/r/pull/777'),
        ]);
      const first = runHook(
        { transcript_path: mkTr(), stop_hook_active: false, session_id: 'story-dbnc' },
        { TMPDIR: tdir },
      );
      expect(first.stdout, 'first PR turn must fire story').not.toBe('');
      expect(JSON.parse(first.stdout).reason).toContain('## 🎬');
      const second = runHook(
        { transcript_path: mkTr(), stop_hook_active: false, session_id: 'story-dbnc' },
        { TMPDIR: tdir },
      );
      expect(second.stdout, 'same PR must not re-fire the story (debounce)').toBe('');
    });
  });
```

- [ ] **Step 2: Run → fail**

Run: `npx vitest run packages/core/hooks/end-of-turn-reminder.test.ts -t story`
Expected: FAIL (story branch not implemented).

- [ ] **Step 3: Implement the story branch in the hook**

In `.claude/hooks/end-of-turn-reminder.sh`:

(a) **Detection** — insert immediately AFTER `text=$(...)` is assigned (after line 52), BEFORE the `if [ -z "$text" ]` exit (line 53):
```bash
# -- story branch detection: a PR was just created this turn → engaging recap ----
# Trigger A: a `gh pr create` Bash tool_use this turn, OR a fresh PR URL in the text.
session_id=$(echo "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo "nosession")
story_signal=""
_gh=$(echo "$last_line" | jq -r '.message.content[]? | select(.type=="tool_use" and .name=="Bash") | .input.command // empty' 2>/dev/null | grep -c 'gh pr create' || true)
_url=$(printf '%s' "$text" | grep -oE 'github\.com/[^ )]+/pull/[0-9]+' | head -1 || true)
if [ "${_gh:-0}" -gt 0 ] || [ -n "$_url" ]; then
  story_signal="${_url:-pr-created}"
fi
```

(b) **Keep the empty-text exit from killing a tool-only PR turn** — change the line 53 guard from:
```bash
if [ -z "$text" ] && [ "$has_askuserquestion" != "true" ]; then
```
to:
```bash
if [ -z "$text" ] && [ "$has_askuserquestion" != "true" ] && [ -z "$story_signal" ]; then
```

(c) **Already-told guard + debounce** — insert immediately AFTER the existing already-recapped guard block (after the `fi` closing the `AIF_RECAP_MARKER` grep, ~line 83):
```bash
# Story already told this turn → do not re-inject.
if [ -n "$story_signal" ] && [ -n "$text" ] && printf '%s' "$text" | grep -qF "$AIF_STORY_MARKER"; then
  exit 0
fi
# Debounce by PR: same PR already storied in this session → fall through to normal branches.
if [ -n "$story_signal" ]; then
  story_flag="${TMPDIR:-/tmp}/aif-story-${session_id}"
  if [ -f "$story_flag" ] && [ "$(cat "$story_flag" 2>/dev/null || true)" = "$story_signal" ]; then
    story_signal=""
  fi
fi
```

(d) **Don't let the short-turn early-exit swallow a story turn** — change the line ~173 guard from:
```bash
if [ "$long_text" = "false" ] && [ "$asked" = "false" ]; then
  exit 0
fi
```
to:
```bash
if [ "$long_text" = "false" ] && [ "$asked" = "false" ] && [ -z "$story_signal" ]; then
  exit 0
fi
```

(e) **Branch selection** — make story the FIRST option. Change the selection (lines ~177-186) to begin:
```bash
if [ -n "$story_signal" ]; then
  # Story branch: work done (PR pushed) → engaging completion recap, persist debounce.
  reminder=$(aif_msg_eot_branch_story)
  printf '%s' "$story_signal" > "${TMPDIR:-/tmp}/aif-story-${session_id}" 2>/dev/null || true
elif [ "$long_text" = "true" ] && [ "$asked" = "true" ]; then
  reminder=$(aif_msg_eot_branch_c)
elif [ "$long_text" = "true" ]; then
  reminder=$(aif_msg_eot_branch_a)
elif [ "$asked" = "true" ]; then
  reminder=$(aif_msg_eot_branch_b)
fi
```

- [ ] **Step 4: Run → pass (story cases + full hook suite for regressions)**

Run: `npx vitest run packages/core/hooks/end-of-turn-reminder.test.ts`
Expected: PASS (all pre-existing cases still green + the 3 new story cases).

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/end-of-turn-reminder.sh packages/core/hooks/end-of-turn-reminder.test.ts
git commit -m "feat(hooks): Stop-hook story branch on PR-create (trigger A + debounce)

Prior-art: prior-art-evaluations.md#N (claude-recap REFERENCE — transcript-read reused; story style BUILT)."
```

---

## Task 4: `/story` skill helper (TDD)

**Files:**
- Test: `packages/core/skills/emit-story-prompt.test.ts` (new)
- Create: `.claude/skills/story/helpers/emit-story-prompt.sh`

- [ ] **Step 1: Write the failing test**

Create `packages/core/skills/emit-story-prompt.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HELPER = resolve(REPO_ROOT, '.claude/skills/story/helpers/emit-story-prompt.sh');

function run(lang?: string): string {
  const env = { ...process.env };
  if (lang === undefined) delete env.AIF_HOOK_LANG;
  else env.AIF_HOOK_LANG = lang;
  return execFileSync('bash', [HELPER], { env, encoding: 'utf8' });
}

describe('emit-story-prompt.sh', () => {
  it('default (no AIF_HOOK_LANG) → English story instruction with the 🎬 marker', () => {
    const out = run(undefined);
    expect(out).toContain('## 🎬 The story');
    expect(out).toMatch(/by acts/i);
  });

  it('AIF_HOOK_LANG=ru → Russian story instruction', () => {
    const out = run('ru');
    expect(out).toContain('## 🎬 Как это было');
    expect(out).toMatch(/по актам/);
  });

  it('unknown AIF_HOOK_LANG → English fallback (non-empty)', () => {
    const out = run('zz');
    expect(out).toContain('## 🎬 The story');
    expect(out.trim().length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run → fail**

Run: `npx vitest run packages/core/skills/emit-story-prompt.test.ts`
Expected: FAIL (helper file does not exist).

- [ ] **Step 3: Create the helper**

Create `.claude/skills/story/helpers/emit-story-prompt.sh`:
```bash
#!/usr/bin/env bash
# @cc-only-rationale: internal /story skill helper — bridges the markdown skill to the shared hook lang pack; not shipped to consumer projects via install.sh
# @dual-pair: session-story-recap
#
# Sources the active-language hook lang pack (AIF_HOOK_LANG, default en, EN
# fallback) and echoes the full story-instruction prose (aif_msg_eot_branch_story).
# The /story SKILL.md invokes this via `!bash` (markdown cannot `source`), then
# narrates by acts following the emitted instruction. Single SSOT: the prose lives
# only in .claude/hooks/lang/{en,ru}.sh.
set -euo pipefail

_repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
_lang_file="${_repo}/.claude/hooks/lang/${AIF_HOOK_LANG:-en}.sh"
[ -f "$_lang_file" ] || _lang_file="${_repo}/.claude/hooks/lang/en.sh"
# shellcheck source=/dev/null
. "$_lang_file"

anchor="${anchor:-}"   # /story has no transcript anchor; the skill names the goal from context
aif_msg_eot_branch_story
```

Then: `chmod +x .claude/skills/story/helpers/emit-story-prompt.sh`

- [ ] **Step 4: Run → pass**

Run: `npx vitest run packages/core/skills/emit-story-prompt.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/story/helpers/emit-story-prompt.sh packages/core/skills/emit-story-prompt.test.ts
git commit -m "feat(skills): /story emit-story-prompt helper (sources shared hook pack, i18n)

Prior-art: skipped — thin SSOT-bridge helper, no new capability/dependency (reuses Task 2 prose)."
```

---

## Task 5: `/story` SKILL.md + principle-test probe

**Files:**
- Create: `.claude/skills/story/SKILL.md`

- [ ] **Step 1: Create the skill**

Create `.claude/skills/story/SKILL.md`:
```markdown
---
name: story
description: Tell the story of this session in plain, engaging language — by acts, with jargon explained, honest about what's left. Use when work is done / a PR was pushed, or when the user asks to recap what was done ("расскажи что сделали", "расскажи историю", "story", "recap", "по актам", "простыми словами что сделал"). Output language follows AIF_HOOK_LANG (RU operator / EN default).
---

# /story — session recap as a story

Narrate the whole session as an engaging, plain-language story for the human — the
reader-facing companion to the dry per-turn self-diagnostic recap (`## 🟢`). Different
jobs: a story for the reader vs. a checklist for your own sake.

## Steps

1. **Get the localized story instruction.** Run:
   `!bash ${CLAUDE_SKILL_DIR}/helpers/emit-story-prompt.sh`
   It prints the full story-spec in the operator's language (English by default;
   Russian when `AIF_HOOK_LANG=ru`). This is the single source of truth for the recap
   shape — shared with the Stop-hook `aif_msg_eot_branch_story` branch.

2. **Tell the story**, following that instruction exactly: open in one sentence, then
   by acts (named files / PRs / decisions), explain jargon on the spot, be honest about
   what's thin / uncertain / left, end on the one thing left for the human. Begin the
   block with the marker line the instruction gives you (`## 🎬 …`).

3. Write in the language the emitted instruction uses — do not translate it.

## Paired-negative (what this skill must NOT do)

- ❌ Do NOT emit a dry self-diagnostic checklist (that is the `## 🟢` per-turn recap's
  job) — if the output reads like a status report rather than a story, it is wrong.
- ❌ Do NOT translate the emitted instruction — render in the pack's language as-is.
- ✅ A correct invocation begins with `## 🎬`, reads as a narrative by acts, and ends on
  the human's next decision.

## Notes

- All skill files are English-canonical (public repo); Russian reaches the operator only
  via the lang pack selected by `AIF_HOOK_LANG`.
```

- [ ] **Step 2: Principle-test allowlist probe (per CLAUDE.md Phase -1 §(l))**

A new `SKILL.md` is on a principle-test-watched path. Probe before assuming green:
```bash
grep -rn 'EXEMPT_\|allowlist\|skip' packages/core/principles/ | grep -E '\.(test\.)?ts:' | head -20
npx vitest run packages/core/principles
```
Expected: PASS. If principle 15 (paired-negative) or principle 10 (scope annotation) fires on `.claude/skills/story/SKILL.md`, satisfy it: principle 15 is covered by the `## Paired-negative` block above; for principle 10, add the required scope annotation per the failing test's message (or add the path to the test's `EXEMPT_*` allowlist only if the skill genuinely qualifies). Re-run until green.

- [ ] **Step 3: Verify the skill wiring end-to-end**

Run: `AIF_HOOK_LANG=ru bash .claude/skills/story/helpers/emit-story-prompt.sh | head -3`
Expected: the Russian story instruction, referencing the `## 🎬 Как это было` marker.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/story/SKILL.md
git commit -m "feat(skills): add /story skill (engaging session recap, hook-style i18n)

Prior-art: prior-art-evaluations.md#N (claude-recap REFERENCE / session-report REJECT)."
```

---

## Task 6: PR1 full verification + open PR

- [ ] **Step 1: Run all touched suites + parity**

Run:
```bash
bash .claude/hooks/lang/check-parity.sh
npx vitest run packages/core/hooks/end-of-turn-reminder.test.ts packages/core/skills/emit-story-prompt.test.ts
npx vitest run packages/core/principles
```
Expected: all PASS / parity OK.

- [ ] **Step 2: Own cold-QA before handoff (T19)**

Re-read the diff (`git diff origin/staging...HEAD`) as a fresh reviewer: confirm (a) story branch fires ONLY on PR signal, (b) all pre-existing hook cases still green, (c) no Russian leaks into `en.sh` / English-canonical skill files, (d) `${anchor:-}` safe under `set -u`.

- [ ] **Step 3: Push branch + open PR1 (base `staging`)**

```bash
git push -u origin HEAD
gh pr create --base staging --title "feat: /story session-recap skill + Stop-hook story branch" --body "<fill §1.7 Forward/Backward + checklist>"
```
Note (memory): the `discipline-self-check.yml` §1.7 gate needs a `### §1.7 Forward-check applied` and `### §1.7 Backward-check applied` heading EACH with a `file:line` citation.

---

## Self-Review (PR1, against spec)

- **Spec coverage:** Component 1 → Task 2; Component 2 (`/story` skill) → Tasks 4–5; Component 3 (hook branch, trigger A, debounce, guard) → Task 3; Component 5 parity → Task 2; Component 6 tests → Tasks 3, 4; SSOT residue → Task 1. (Component 4 = `/pipeline` fix is PR2.)
- **Type/name consistency:** `aif_msg_eot_branch_story`, `AIF_STORY_MARKER`, `story_signal`, `emit-story-prompt.sh` identical across tasks. Markers: RU `## 🎬 Как это было`, EN `## 🎬 The story` (Task 2 = tests Task 3 = skill Task 5).
- **Placeholder scan:** every code/test step is complete; `N` is the SSOT id computed in Task 1 Step 1 and reused verbatim in trailers.

## Known gotchas (from memory)

- `set -euo pipefail` + `grep -c`/`head` can abort the hook — all added pipes carry `|| true`; counts use `${_gh:-0}`.
- Story tests pass a unique `session_id` and (debounce) a fresh `TMPDIR` so the `/tmp` flag never leaks across runs.
- Capability gate: no new dep, no ≥80-LOC new file under `packages/` (test files ~30–60 LOC) → not heavy capability commits; trailers are real `#N` refs (feature files) or the ≥20-char escape hatch (doc).
