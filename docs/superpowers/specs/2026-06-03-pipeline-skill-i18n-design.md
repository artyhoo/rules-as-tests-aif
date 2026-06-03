# /pipeline skill payload i18n — RU operator / EN canonical

> **Scope:** the `/pipeline` skill (`.claude/skills/pipeline/`) Russian payload —
> the emitted session-report tokens (`output-format.md` table headers, status
> words, block labels) and the bilingual decision-detection phrases.
> **NOT in scope:** the Stage 5 rename (PR #397, separate); the hook lang packs
> (`.claude/hooks/lang/`, already done — we reuse `AIF_HOOK_LANG` +
> `AIF_RECAP_MARKER` from them); Russian *code comments* inside helpers.

> **Origin:** 2026-06-03. Maintainer: "посмотри как реализована русификация
> хуков — нужно сделать так же" + "[detection phrases] добавь ещё и английские".
> Generalises the hook-lang-i18n pattern
> ([2026-06-01 spec](2026-06-01-hook-lang-i18n-design.md)) to a markdown skill.

## Problem

The maintainer runs Claude in English (better reasoning, fewer tokens) but the
`/pipeline` skill emits Russian payload — the operator reads the session report
(`Action queue`, the 5-column launch table, the `## 🟢 Простыми словами` recap)
in Russian. The repo is public; per `layered-language-policy` shipped / public
artefacts should read English. The hooks already solved this exact problem for
their nudge prose via language packs; this generalises the pattern to the skill.

**Key difference from the hooks (the design crux):** a hook is bash and
`source`s its pack at runtime (`. "${AIF_HOOK_LANG:-en}.sh"`). A `SKILL.md` is
**markdown read by the AI** — there is no runtime `source`. So the skill's
emitted tokens must be produced by a **helper** (bash, which *can* source a pack)
and injected into the report via the skill's existing `!shell` mechanism.

Unlike the hooks (which carry `@cc-only-rationale: not shipped`), the `/pipeline`
skill **is shipped** to consumers via `install.sh:237-256`. Therefore its lang
pack lives **under the skill** (`.claude/skills/pipeline/lang/`), not under
`.claude/hooks/lang/` — coupling a shipped skill to non-shipped hook files would
break the consumer install. The two pack families stay siblings, not shared.

## Design — split logic from payload, emit payload via a helper

Three string classes, three treatments:

### Class 1 — emitted payload tokens → skill lang pack

The literal tokens the operator *sees* in the session report:

- Launch-table column headers: `Когда` / `Ждёшь` / `Можно параллельно с`
  (and the EN canonical `When` / `Waiting on` / `Can parallel with`).
- The `Paste в новый CC tab` header (EN: `Paste into a new CC tab`).
- Section labels: `## Action queue — что ты делаешь`, the 1-liner block labels
  `Что делает` / `Почему сейчас` (EN: `What it does` / `Why now`).
- Inline status words: `актуален` (plan-currency), `СЕЙЧАС` (wave-now),
  `После Wave N` / `после мержа`.
- Recap marker: the skill pack defines its **own** `AIF_RECAP_MARKER`
  (`## 🟢 In plain words` / `## 🟢 Простыми словами`) with the **same values** as
  the hook pack — convention-aligned, not file-sourced. A shipped skill cannot
  `source` the not-shipped hook pack; in the operator's environment both packs
  read the same `AIF_HOOK_LANG`, so both yield the same marker and the
  end-of-turn hook's already-recapped guard still matches. In a consumer with no
  hooks, the skill pack is self-contained. The duplicated value is the price of
  the shipped/not-shipped separation; a one-line cross-check (operator-local,
  non-blocking) can assert the two AIF_RECAP_MARKER values agree.

These move to `.claude/skills/pipeline/lang/{en,ru}.sh` as `aif_pipeline_*`
shell variables / functions. A thin helper `helpers/emit-output-strings.sh`
sources `${AIF_HOOK_LANG:-en}.sh` (hard EN fallback if the pack is missing) and
echoes the active-language tokens. The skill body (`SKILL.md §10`) injects them
via `!shell` — exactly where it already injects helper output today.

- Selection: `AIF_HOOK_LANG` env var (the **same** var the hooks already use —
  operator sets it once, globally, in `~/.claude/settings.json` `env`; default
  `en`). No new config for the operator.
- Consumer / public repo: no env var → English out of the box, zero config.

### Class 2 — spec prose → EN-canonical (one copy)

`output-format.md` and `SKILL.md §10` carry ~105 lines of Russian-in-English
explanatory prose (e.g. `## Action queue — что ты делаешь дальше`, `Wave 1 —
СЕЙЧАС:` example captions, `Всего открытых umbrellas`). This is **documentation
of the format**, not operator-facing emitted output. It is translated to English
in place — one canonical copy, no pack, no variant files. Example tables in the
prose show the **English** headers (illustrative); the operator's *actual*
output uses the lang-selected headers from Class 1.

### Class 3 — decision-detection phrases → bilingual (RU + EN), always present

`references/anti-rationalization.md` and `references/red-flags.md` list the
phrases that signal a *non-answer* deferral (`выбирай сам`, `оба норм`,
`я устал`). These match the **operator's input**, not emitted output — the hook
i18n spec's principle "transcript inputs stay Russian regardless" applies. Per
maintainer (2026-06-03), keep the Russian **and add the English equivalents**
(`you decide`, `both fine`, `it's technical not strategy`, `I'm tired`) so the
skill catches the deferral in either language. These stay inline in the
reference files (bilingual lists) — **not** in the lang pack (they are internal
detection data, never emitted to the user, so they do not violate "public reads
EN").

### principle 18 lockstep

`packages/core/principles/18-meta-orchestrator-output-format.test.ts` currently
asserts the **Russian** emitted substrings (`'Paste в новый CC tab'`,
`'| Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |'`). Since the
EN pack is now the canonical default, principle 18 is updated **in the same
change** to assert the **English** canonical substrings (the EN pack's tokens).
The RU pack's tokens become the operator-pack contract, exercised by a separate
`AIF_HOOK_LANG=ru` test case (mirrors the hook i18n testing approach).

## Components

| File | Role |
|---|---|
| `.claude/skills/pipeline/lang/en.sh` | English emitted-token pack (canonical default) |
| `.claude/skills/pipeline/lang/ru.sh` | Russian emitted-token pack (operator) |
| `.claude/skills/pipeline/lang/check-parity.sh` | key-parity check between the two skill packs |
| `.claude/skills/pipeline/helpers/emit-output-strings.sh` | sources `${AIF_HOOK_LANG:-en}` pack, echoes active tokens |
| `.claude/skills/pipeline/references/output-format.md` | EN-canonical prose; example tables show EN headers |
| `.claude/skills/pipeline/SKILL.md` | §10 injects emit-output-strings via `!shell`; prose → EN |
| `.claude/skills/pipeline/references/anti-rationalization.md` | bilingual RU+EN detection phrases |
| `.claude/skills/pipeline/references/red-flags.md` | bilingual RU+EN detection phrases |
| `packages/core/principles/18-*.test.ts` | asserts EN canonical tokens; RU pack via `AIF_HOOK_LANG=ru` case |

## Testing

- `packages/core/principles/18-*.test.ts`: assert EN canonical substrings by
  default; add an `AIF_HOOK_LANG=ru` case asserting the RU pack tokens (the RU
  contract).
- `emit-output-strings.sh`: smoke per language — `AIF_HOOK_LANG=en`/unset → EN
  tokens; `=ru` → RU tokens; missing pack → EN fallback.
- `lang/check-parity.sh` self-runs green (en.sh and ru.sh expose identical keys).
- A `skills/` companion test for `emit-output-strings.sh` (paired-negative:
  unknown `AIF_HOOK_LANG` falls back to EN, non-empty output).

## Out of scope (surfaced, not done)

- The Stage 5 rename (PR #397) — already in flight, separate.
- Russian *code comments* inside helpers (cosmetic; follow-up).
- Promoting `check-parity.sh` to a blocking pre-push gate — local/reviewer step
  for now (matches the hook i18n cost discipline; the skill *is* shipped, so a
  gate is more defensible here than for the hooks — promotable if drift recurs).

## Relationship to the hook i18n pattern

| Aspect | Hooks (2026-06-01) | This skill (2026-06-03) |
|---|---|---|
| Selection | `AIF_HOOK_LANG` env, EN default | **same** var, **same** default |
| Recap marker | `AIF_RECAP_MARKER` in hook packs | own `AIF_RECAP_MARKER`, same values (convention-aligned, not file-sourced) |
| Pack location | `.claude/hooks/lang/` (not shipped) | `.claude/skills/pipeline/lang/` (shipped) |
| Payload delivery | hook `source`s pack at runtime | helper sources pack, skill injects via `!shell` |
| Parity guard | `check-parity.sh` | `check-parity.sh` (per-skill copy) |
| Detection phrases | inputs stay RU | bilingual RU+EN (maintainer 2026-06-03) |
