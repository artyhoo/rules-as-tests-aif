# Session-story recap — финальная история по актам

> **Scope:** a new "engaging story-in-acts" recap delivered when work is done, via two
> channels — a `/recap` skill (manual) + a new branch in the Stop hook
> (`.claude/hooks/end-of-turn-reminder.sh`, auto on PR-create). Shared single
> source-of-truth prompt (`@dual-pair: session-story-recap`).
> **NOT in scope:** the existing per-turn self-diagnostic recap (`## 🟢 Простыми
> словами`, Branch A/C — untouched); SessionEnd channel (the agent no longer speaks
> there); consumer shipping (these hooks are `@cc-only-rationale` internal tooling, not
> in `install.sh`).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## Problem

The maintainer wants, **when the work is done and a PR is pushed**, an *engaging,
plain-language* narration of what the whole session accomplished — told as a story,
with jargon explained on the fly, honest about what's shaky, ending on the one decision
left to the human. The reference exemplar (maintainer-supplied, 2026-06-16) is a
"story in acts" recap given right after a PR push.

This is **a different optimisation** from what already exists, on two axes:

| | Existing per-turn recap | This feature |
|---|---|---|
| **When** | every substantial turn (Branch A) | only when work is done (PR pushed) |
| **For whom / how** | "в первую очередь для себя" — dense self-diagnostic checklist | for the human — living, accessible, interesting story |

The existing recap (`aif_msg_eot_branch_a` / `_branch_c` in `lang/ru.sh`) is an
anti-laziness self-check; it is **not** optimised to be read with pleasure. Both jobs
are legitimate and non-conflicting (parallel to the existing Branch A vs C split).

## Build-vs-reuse (own-stack-first)

Prior-art survey run 2026-06-16 (installed companions + SSOT + WebSearch ×2):

- **Installed companions: no match.** Only candidate `session-report`
  (`claude-plugins-official/plugins/session-report`) is **usage analytics** (tokens,
  cache, expensive prompts, HTML dashboard) — different problem class → **REJECT** for
  this purpose (T16 `#pattern-matching-on-name`). Superset not installed; SSOT (121
  entries) has no narrative-recap entry.
- **Wider ecosystem: exists, but different problem class.** `annikalewis/claude-recap`,
  Ben Poole's session-recap, et al. target **cross-session memory / "where did we leave
  off"** (archaeology for the *next* session), not "engaging completion story for the
  human." → **REFERENCE** the mechanism (read `~/.claude/projects/*.jsonl` transcript
  directly, not regex excerpts) — which we **already have** in the Stop hook
  (`end-of-turn-reminder.sh:23` reads `transcript_path`).
- **Cost:** lang-function + skill markdown + hook branch + test = no new dependency, no
  code-module ≥80 LOC under `packages/` → **not a heavy capability-commit** per
  [CLAUDE.md](../../../CLAUDE.md). The story-in-acts *style* is maintainer taste — ours
  to write regardless; no companion saves it.

SSOT residue to land with the implementation: one row recording `session-report` REJECT
+ `claude-recap` REFERENCE.

## Design — one prompt, two channels

Maps onto the existing [dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md)
"one logic, two channels" pattern. Anchor: `@dual-pair: session-story-recap`.

### Component 1 — the story-spec (single source of truth)

The canonical prose lives in the skill's `SKILL.md` (human-readable SSOT per §7); the
hook lang-function is the mechanical embed that references the same anchor. Story-spec
distilled from the exemplar:

1. **Open in one sentence** — what we set out to do and why, in human terms.
2. **By acts** — narrative arc of the key moves, named (file / PR / decision): what we
   did, what went wrong, how it was fixed.
3. **Jargon on the spot** — hit a term (egress, caffeinate, Docker) → explain it with an
   analogy immediately.
4. **Honest** — where it's thinly verified (1 run, 1 case), what's uncertain, what's
   left.
5. **End on the human** — what's left for *you* to decide or do ("one step — your go").
6. **Tone** — interesting, like a story; no filler, no self-congratulation; truth over
   smoothness.

### Component 2 — `/recap` skill (manual channel)

- New directory `.claude/skills/recap/` (the **directory name is the slash command** —
  `/recap`; renaming the command later = `git mv` the dir).
- `SKILL.md` carries the canonical story-spec (Component 1) + instruction to read the
  session transcript and narrate by acts.
- Invoked on demand — exactly the exemplar's path (the maintainer asked "расскажи
  интересно" by hand).
- Naming: `/recap` chosen to be distinct from the dry per-turn recap; open to `/story`
  if collision feels confusing.

### Component 3 — Stop-hook auto branch (auto channel, trigger A)

In `end-of-turn-reminder.sh`, before the existing Branch A/B/C selection:

- **New lang function** `aif_msg_eot_branch_story()` in both `lang/en.sh` + `lang/ru.sh`
  (i18n parity, enforced by `lang/check-parity.sh`). Embeds the story-spec, localised.
- **New marker** `AIF_STORY_MARKER` — `## 🎬 Как это было` (ru) / `## 🎬 The story`
  (en) — distinct from `AIF_RECAP_MARKER` so the already-recapped guard can tell the two
  apart.
- **Trigger A — PR-create detected this turn.** Either:
  - the last assistant turn has a `Bash` `tool_use` whose `command` contains
    `gh pr create` (jq over `last_line` content), OR
  - the assistant `text` contains a fresh PR URL matching
    `github\.com/[^ )]+/pull/[0-9]+`.
- **Precedence:** when the PR signal is present, the story branch fires **instead of**
  the dry Branch A/C recap for that turn (work is done — self-diagnosis is moot). Other
  turns: unchanged.
- **Debounce by PR number** — store the last "storied" PR (number or URL) in a
  session-scoped flag (`${TMPDIR:-/tmp}/aif-story-<session_id>`, mirroring
  `ask-question-reminder.sh:42`). Same PR → silent; a genuinely new PR → its own story.
- **Already-told guard** — if the current turn text already contains `AIF_STORY_MARKER`,
  exit 0 (mirrors the existing `AIF_RECAP_MARKER` guard at `end-of-turn-reminder.sh:81`).
- Delivery uses the existing `decision: block` + `reason` JSON mechanism
  (`end-of-turn-reminder.sh:194`).

### Component 4 — test (rule = test)

Companion test for the new branch (extends the existing hook companion test):

- **Positive:** synthetic transcript whose last assistant turn contains a `gh pr create`
  Bash `tool_use` → assert output contains the story-marker instruction.
- **Negative (no signal):** ordinary long turn, no PR → assert the dry recap fires, NOT
  the story.
- **Debounce:** same PR number twice in the debounce window → second fire is silent.
- **Parity:** `lang/check-parity.sh` stays green (new function present in both packs).

## Boundaries / YAGNI

- **Untouched:** the dry per-turn recap (Branch A/C) — it is a working discipline
  mechanism, kept.
- **No SessionEnd channel** — at SessionEnd the agent no longer produces a turn, so it
  cannot narrate; Stop is the only event that can make the agent speak once more.
- **No consumer shipping** — both hooks are `@cc-only-rationale` internal tooling; no
  `install.sh` change, zero consumer impact.

## Files touched

| File | Change |
|---|---|
| `.claude/skills/recap/SKILL.md` | NEW — `/recap` skill, canonical story-spec |
| `.claude/hooks/lang/en.sh` | + `aif_msg_eot_branch_story()` + `AIF_STORY_MARKER` |
| `.claude/hooks/lang/ru.sh` | + `aif_msg_eot_branch_story()` + `AIF_STORY_MARKER` |
| `.claude/hooks/end-of-turn-reminder.sh` | + PR-detect + debounce + story-branch selection (before existing branches) |
| hook companion test | + positive / negative / debounce cases |
| `docs/meta-factory/prior-art-evaluations.md` | + 1 row (session-report REJECT, claude-recap REFERENCE) |

## Open (minor, decide at implementation)

- Command name `/recap` vs `/story`.
- Exact marker emoji/wording.
- Debounce window length vs strict per-PR-number keying (lean: per-PR-number, no time
  window — a new PR always earns a story).
