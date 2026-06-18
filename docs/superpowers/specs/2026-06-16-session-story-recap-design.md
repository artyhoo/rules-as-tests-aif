# Session-story recap (`/story`) + `/pipeline` i18n fix

> **Scope:** (1) a new "engaging story-in-acts" recap delivered when work is done, via a
> `/story` skill (manual) + a new branch in the Stop hook
> (`.claude/hooks/end-of-turn-reminder.sh`, auto on PR-create); (2) **fix** the
> `/pipeline` skill's i18n so its output reliably renders in the operator's language.
> Both share one principle (below). Anchor: `@dual-pair: session-story-recap`.
> **NOT in scope:** the existing per-turn self-diagnostic recap (`## 🟢 Простыми
> словами`, Branch A/C — untouched); SessionEnd channel (the agent no longer speaks
> there); consumer shipping of `/story` (internal tooling).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## The shared principle (the crux of this work)

**To keep model OUTPUT in the operator's language, inject a fully-localized directive
(hook-style). Localizing only UI labels (the current `/pipeline` token approach) is
insufficient — the model's generated prose drifts back to English.**

Evidence:

- **Hook works.** `end-of-turn-reminder.sh` injects the *entire* recap instruction in
  the active language via `reason` (`lang/ru.sh` `aif_msg_eot_branch_a` is wholly
  Russian + directive: "ОБЯЗАТЕЛЬНО начни блок…"). The operator's `## 🟢 Простыми
  словами` recap is **always Russian** — confirmed working by the maintainer.
- **Pipeline drifts.** `/pipeline` localizes only short tokens
  (`lang/ru.sh:9-20` — column headers, labels, status words) while `SKILL.md` is
  English; there is **no output-language directive**, so the model writes its analysis
  prose in English and only swaps the labels. Maintainer (2026-06-16): "в pipeline чаще
  на английском пишет чем на русском… его тоже надо исправить."

So: `/story` is built hook-style from the start; `/pipeline` is fixed to add an
output-language directive. From `/pipeline` we reuse only the `!shell`-helper *plumbing*
(a markdown skill can't `source` a bash pack at read time) — **not** its token-only
content approach.

## Problem (the feature)

The maintainer wants, **when the work is done and a PR is pushed**, an *engaging,
plain-language* narration of what the whole session accomplished — told as a story,
with jargon explained on the fly, honest about what's shaky, ending on the one decision
left to the human. Reference exemplar (maintainer-supplied, 2026-06-16): a "story in
acts" recap given right after a PR push.

Different optimisation from the existing recap, on two axes:

| | Existing per-turn recap | This feature |
|---|---|---|
| **When** | every substantial turn (Branch A) | only when work is done (PR pushed) |
| **For whom / how** | "в первую очередь для себя" — dense self-diagnostic checklist | for the human — living, accessible, interesting story |

Both jobs are legitimate and non-conflicting (parallel to the existing Branch A vs C
split).

## Build-vs-reuse (own-stack-first)

Prior-art survey 2026-06-16 (installed companions + SSOT + WebSearch ×2):

- **Installed companions: no match.** Only candidate `session-report` is **usage
  analytics** (tokens, cache, HTML dashboard) — different problem class → **REJECT**
  (T16 `#pattern-matching-on-name`). Superset not installed; SSOT (121 entries) has no
  narrative-recap entry.
- **Wider ecosystem: exists, different problem class.** `annikalewis/claude-recap` et al.
  target **cross-session memory / "where did we leave off"**, not engaging completion
  story → **REFERENCE** the transcript-read mechanism, which we already have
  (`end-of-turn-reminder.sh:23`).
- **Cost:** lang-function + skill markdown + helper + hook branch + pipeline-directive +
  tests = no new dependency, no module ≥80 LOC under `packages/` → not a heavy
  capability-commit. The story-in-acts *style* is maintainer taste — ours to write.

SSOT residue to land: one row (`session-report` REJECT, `claude-recap` REFERENCE).

## Design

Maps onto [dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md)
"one logic, two channels".

### Component 1 — the story-spec (single source of truth, hook-style)

Canonical story-instruction prose = **one localized artifact**:
`aif_msg_eot_branch_story()` in `.claude/hooks/lang/en.sh` (EN canonical) + `lang/ru.sh`
(RU operator), selected by `AIF_HOOK_LANG`. The **whole instruction** is localized
(hook-style) — when `AIF_HOOK_LANG=ru` it is fully Russian, so the model narrates in
Russian. Story-spec distilled from the exemplar:

1. **Open in one sentence** — what we set out to do and why, in human terms.
2. **By acts** — narrative arc of key moves, named (file / PR / decision): what we did,
   what went wrong, how it was fixed.
3. **Jargon on the spot** — hit a term (egress, caffeinate, Docker) → analogy immediately.
4. **Honest** — where it's thinly verified (1 run, 1 case), what's uncertain, what's left.
5. **End on the human** — what's left for *you* to decide/do ("one step — your go").
6. **Tone** — interesting, like a story; no filler, no self-congratulation; truth over
   smoothness.

### Component 2 — `/story` skill (manual channel)

- New dir `.claude/skills/story/` (directory name = slash command `/story`; rename later
  = `git mv`).
- **All skill files English-canonical** (`SKILL.md`, helper comments) — public repo.
- **Hook-style content via `!shell` plumbing:** `SKILL.md` runs
  `!bash ${CLAUDE_SKILL_DIR}/helpers/emit-story-prompt.sh`, which sources the
  active-language hook pack and echoes the **full** `aif_msg_eot_branch_story()` prose;
  the skill then narrates following it. The model receives the whole localized directive
  → output language follows `AIF_HOOK_LANG` (this is the hook mechanism, delivered into
  a markdown skill — NOT the pipeline token approach).
- **Single SSOT, not a sibling copy.** Because `/story` is **internal** (not shipped,
  unlike `/pipeline`), its helper sources the **shared** hook pack directly — the story
  prose lives in one place, read by both channels. (Pipeline kept *sibling* packs only
  because a shipped skill must not depend on non-shipped hook files; that constraint
  doesn't apply here.)
- Invoked on demand — the exemplar's path (maintainer asked "расскажи интересно" by hand).

### Component 3 — Stop-hook auto branch (auto channel, trigger A)

In `end-of-turn-reminder.sh`, before the existing Branch A/B/C selection:

- Uses the same `aif_msg_eot_branch_story()` (sourced directly at hook line 11).
- **New marker** `AIF_STORY_MARKER` — `## 🎬 Как это было` (ru) / `## 🎬 The story` (en)
  — distinct from `AIF_RECAP_MARKER` so the already-recapped guard distinguishes them.
- **Trigger A — PR-create this turn.** Either the last assistant turn has a `Bash`
  `tool_use` whose `command` contains `gh pr create`, OR its `text` contains a fresh PR
  URL `github\.com/[^ )]+/pull/[0-9]+`.
- **Precedence:** PR signal present → story branch fires **instead of** the dry Branch
  A/C recap for that turn. Other turns unchanged.
- **Debounce by PR number** — session-scoped flag
  (`${TMPDIR:-/tmp}/aif-story-<session_id>`, mirroring `ask-question-reminder.sh:42`).
  Same PR → silent; new PR → its own story.
- **Already-told guard** — current turn text already contains `AIF_STORY_MARKER` → exit
  0 (mirrors `end-of-turn-reminder.sh:81`).
- Delivery via the existing `decision: block` + `reason` mechanism (hook line 194).

### Component 4 — `/pipeline` i18n fix (the second work item)

Make `/pipeline` output render in the operator's language, hook-style:

- **Add an output-language directive token** to both packs —
  `.claude/skills/pipeline/lang/ru.sh` (e.g. `AIF_PIPELINE_OUTPUT_DIRECTIVE='Сформируй
  весь отчёт на русском языке.'`) + `lang/en.sh` (English equivalent / no-op for EN).
- `SKILL.md` surfaces this directive **prominently at the top of report generation** (via
  the existing `emit-output-strings.sh` / `!shell` mechanism), so the model writes the
  whole report — not just labels — in the active language.
- **Consumer-safe:** default `AIF_HOOK_LANG=en` → English directive → no behaviour change
  for default consumers; only `AIF_HOOK_LANG=ru` operators get fully-Russian output.
- This **supersedes the output-language behaviour** of the
  [2026-06-03 pipeline i18n spec](2026-06-03-pipeline-skill-i18n-design.md) (token-only),
  which is now known insufficient for output language. A pointer note lands in that spec.

### Component 5 — language rule + parity

- Hook code/comments/`en.sh`, `/story` skill files, `/pipeline` skill files —
  English-canonical (public repo).
- Russian reaches the operator **only** via `ru.sh` packs, selected by `AIF_HOOK_LANG=ru`;
  EN fallback if a pack is missing.
- Parity guards stay green: `.claude/hooks/lang/check-parity.sh` (new
  `aif_msg_eot_branch_story` + `AIF_STORY_MARKER`) and
  `.claude/skills/pipeline/lang/check-parity.sh` (new `AIF_PIPELINE_OUTPUT_DIRECTIVE`).

### Component 6 — tests (rule = test)

- **Story hook branch:** positive (synthetic transcript with `gh pr create` → story
  marker fires); negative (long turn, no PR → dry recap fires, not story); debounce (same
  PR twice → second silent); parity green.
- **Story skill helper:** `emit-story-prompt.sh` under `AIF_HOOK_LANG=ru` emits RU prose;
  missing pack → EN fallback.
- **Pipeline fix:** `emit-output-strings.sh` under `AIF_HOOK_LANG=ru` now emits
  `AIF_PIPELINE_OUTPUT_DIRECTIVE` (Russian); parity green.

## Boundaries / YAGNI

- **Untouched:** the dry per-turn recap (Branch A/C) — working discipline mechanism.
- **No SessionEnd channel** — agent no longer speaks there; Stop is the only re-speak event.
- **No `/story` consumer shipping** — internal tooling, no `install.sh` change. If ever
  shipped, switch to a *sibling* lang pack under `.claude/skills/story/lang/` (must not
  depend on non-shipped hook files), per the pipeline precedent.
- The pipeline fix is the **minimal** output-directive change — NOT a full
  report-template translation; the model does the prose, the directive sets the language.

## Files touched

| File | Change |
|---|---|
| `.claude/skills/story/SKILL.md` | NEW — `/story` skill (EN canonical), `!bash` emit + narrate-by-acts |
| `.claude/skills/story/helpers/emit-story-prompt.sh` | NEW — sources shared hook pack, echoes full active-language story prose |
| `.claude/hooks/lang/en.sh` | + `aif_msg_eot_branch_story()` + `AIF_STORY_MARKER` (EN) |
| `.claude/hooks/lang/ru.sh` | + `aif_msg_eot_branch_story()` + `AIF_STORY_MARKER` (RU) |
| `.claude/hooks/end-of-turn-reminder.sh` | + PR-detect + debounce + story-branch selection (before existing branches) |
| `.claude/skills/pipeline/lang/en.sh` + `lang/ru.sh` | + `AIF_PIPELINE_OUTPUT_DIRECTIVE` |
| `.claude/skills/pipeline/SKILL.md` | surface the output-directive at top of report generation |
| `2026-06-03-pipeline-skill-i18n-design.md` | + pointer note: output-language superseded by hook-style directive |
| hook + skill companion tests | + cases above |
| `docs/meta-factory/prior-art-evaluations.md` | + 1 row (session-report REJECT, claude-recap REFERENCE) |

## Decided

- Command name **`/story`**; auto-trigger **A** (PR-create), debounced per PR number;
  approach **C** (skill + hook), single shared SSOT prose.
- i18n = **hook-style** (full localized directive drives output language); `/pipeline`
  fixed the same way. EN canonical + RU via `AIF_HOOK_LANG`.
- One umbrella, two atomic pieces: (1) `/story`, (2) `/pipeline` i18n fix.

## Open (minor, decide at implementation)

- Exact marker emoji/wording (`## 🎬 Как это было` / `## 🎬 The story`).
- Exact phrasing of `AIF_PIPELINE_OUTPUT_DIRECTIVE`.
- Whether the shared "localize the directive, not just labels" principle warrants a short
  note in the i18n spec or a `.claude/rules/` entry (possible follow-up, not this work).
