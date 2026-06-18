# Language discipline — internal English, human-facing AIF_HOOK_LANG-gated

> **Date:** 2026-06-16
> **Authoritative for:** the language-discipline design — the 3-category model (§2), the cleanup surface (§3), the reliable human-facing language gate (§4), and the guard-test + companion rule (§5).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The existing hook/pipeline i18n mechanism — see [2026-06-01-hook-lang-i18n-design.md](2026-06-01-hook-lang-i18n-design.md) + [2026-06-03-pipeline-skill-i18n-design.md](2026-06-03-pipeline-skill-i18n-design.md) (this spec extends, does not replace).

## §0 Origin

Maintainer (2026-06-16): «часть скилов, хуков и скриптов на русском, а часть на английском — а всё должно быть на английском; + всегда русским когда `AIF_HOOK_LANG=ru` именно при обращении к человеку. Внутренняя кухня — English; обращения и объяснения к человеку — русский когда есть токен `AIF_HOOK_LANG=ru`, иначе English.»

Live pain surfaced during dialogue: **the `/pipeline` skill does not reliably end up writing in Russian** even when `AIF_HOOK_LANG=ru` is set. Root cause established by reading the code (§1).

## §1 Root cause (evidence)

The i18n machinery already exists: `AIF_HOOK_LANG` env var + `lang/en.sh`/`lang/ru.sh` packs for hooks ([`.claude/hooks/lang/`](../../../.claude/hooks/lang/)) and for the pipeline skill ([`.claude/skills/pipeline/lang/`](../../../.claude/skills/pipeline/lang/)). It localizes a **fixed set of tokens** only:

- [`emit-output-strings.sh`](../../../.claude/skills/pipeline/helpers/emit-output-strings.sh) emits column headers, block labels, the `NOW`/`current` markers, and `AIF_RECAP_MARKER` per active language.
- [`pipeline/SKILL.md:465`](../../../.claude/skills/pipeline/SKILL.md) instructs the model to use those token values.

But the **prose** the model writes — the text under «What it does»/«Why now», explanations, the plain-words recap body, narration, questions — is generated freely. **No instruction anywhere says «write all operator-facing prose in the active language».** And the model never reliably learns that `AIF_HOOK_LANG=ru` is set: the always-on injection ([`inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh)) is a static heredoc that does not read the env var, so the only language signal the model gets is the *value* of the returned tokens — a weak, implicit cue. Result: **headers Russian, prose English/mixed.** Exactly the reported symptom.

## §2 The 3-category model (conceptual core)

The maintainer's binary («internal = English / human-facing = Russian-when-`ru`») needs a third bucket that the code forces:

| # | Category | Language rule | Examples (evidence) |
|---|---|---|---|
| 1 | **Internal machinery** — comments, logic, AI-facing SKILL instructions, tool args, code, repo artifacts (kickoffs, specs, commit/PR bodies) | **English, always** | `harvest-via-api.sh:5` «no затирание»; `end-of-turn-reminder.sh:77,85-86` RU comments; `self-reflection/SKILL.md:86-87` RU instruction labels |
| 2 | **Human-facing output** — what the AI/hook *addresses to the operator* in chat (explanations, recap, narration, questions) | **`AIF_HOOK_LANG`-gated**: `ru` → Russian, unset/other → English. Two sub-channels below. | pipeline session-report prose; chat answers |
| 2a | — shell-emitted (hook/helper `echo`, no LLM in loop) | via `lang/*.sh` packs | `AIF_RECAP_MARKER`, pipeline table headers |
| 2b | — LLM-authored (model writes prose per SKILL instruction) | model must KNOW active language + have an explicit «write prose in it» directive | pipeline report prose (the broken part) |
| 3 | **Activation / match metadata** — strings whose purpose is to *match* possibly-Russian operator input/output | **bilingual / language-specific kept** | skill `description` trigger-words (`aif-doctor`: «задача висит»); `end-of-turn-reminder.sh:117` question patterns; `anti-rationalization.md:10-12` / `red-flags.md:14` deferred-decision phrase lists |

Category 3 is the one a naive reading collapses into category 1 and gets wrong: removing those Russian tokens silently breaks recognition of Russian operator input/output, with no upside.

**Also legitimate Russian (keep, not category 3):** verbatim operator quotes in docs (`output-format.md:114`), RU eval fixtures (`pipeline/evals/files/*`, `evals.json` RU expectations), the RU narrative `docs/meta-factory/project-history-book.md`, the `lang/ru.sh` packs themselves.

## §3 Workstream A — cleanup (sweep)

Translate **category-1** Russian to English; leave categories 2a/3 + legitimate-RU untouched.

**Translate to English:**
- `.claude/skills/dispatcher/helpers/harvest-via-api.sh:5` — comment.
- `.claude/hooks/end-of-turn-reminder.sh:77` (comment; reference `$AIF_RECAP_MARKER`, not a hardcoded RU literal), `:85-86` (comments).
- `.claude/skills/self-reflection/SKILL.md` body lines (86-87, 108) — instruction prose/labels. Keep the frontmatter `Triggers:` keywords.
- Any non-match-data, non-quote RU prose in `pipeline/SKILL.md` and `pipeline/references/*.md` (per-file judgment; most references RU is category 3 / quotes and stays).

**Move into lang packs (category-3 inside logic):**
- `end-of-turn-reminder.sh:117` question-detection patterns → add `AIF_EOT_QUESTION_PATTERN` to `.claude/hooks/lang/{en,ru}.sh` (EN phrases in `en.sh`, RU phrases in `ru.sh`); hook body becomes English `grep -qiE "$AIF_EOT_QUESTION_PATTERN"`. Strengthens the existing pack architecture and removes the hardcoded RU from the hook body.

**Keep (no change):** `lang/ru.sh` packs; `pipeline/evals/**` RU fixtures; `references/*.md` match-data lists + verbatim quotes; `project-history-book.md`; all skill `description` trigger-words (bilingual — see §6 Decision 1).

## §4 Workstream B — reliable human-facing language gate (the pain fix)

**B1 — global always-on signal (robust, all skills + free chat).**
[`inject-session-bootstrap.sh`](../../../.claude/hooks/inject-session-bootstrap.sh) reads `AIF_HOOK_LANG`; when set to a non-`en` value it appends ONE precisely-scoped line to the digest, e.g.:

```text
Output language: address the operator in Russian (chat explanations, recaps, narration, questions). Keep ALL repo artifacts and machinery in English — code, comments, commit/PR/issue bodies, kickoffs, specs, tool arguments, file contents. (AIF_HOOK_LANG=ru)
```

When `AIF_HOOK_LANG` is unset or `en` → emit nothing (English is the default; zero added bytes). The line is the same always-on channel as the H1 reminder — strongest deterministic salience layer, fires every turn, survives compaction. The **precise scoping** (chat-to-operator gated; repo artifacts + machinery always English) is load-bearing: without it the model would write Russian into commits/SKILLs and trip the §5 guard.

**B2 — pipeline render-time reinforcement.**
[`emit-output-strings.sh`](../../../.claude/skills/pipeline/helpers/emit-output-strings.sh) additionally emits `AIF_OUTPUT_LANG=<ru|en>`. [`pipeline/SKILL.md:465`](../../../.claude/skills/pipeline/SKILL.md) i18n instruction is strengthened: «write the ENTIRE session-report prose (descriptions, Why-now, plain-words recap body, narration) in `AIF_OUTPUT_LANG`, not only the table headers». B1 (salience) + B2 (precise in-band signal at render time) reinforce, not duplicate — mirrors the repo's always-on + path-scoped two-channel pattern.

**Precedence:** when `AIF_HOOK_LANG` is set it overrides the global CLAUDE.md «respond in the user's language» default. Unset → English. This is the deterministic-token gate the maintainer asked for. (The maintainer's private `~/.claude/CLAUDE.md` is not edited — §7.)

## §5 Workstream C — guard-test (enforcement) + companion rule

Maintainer-confirmed: **cleanup + guard-test** (Class A). The repo is rules-as-tests; without a test the cleanup regresses.

**Test (`packages/core/principles/22-internal-english.test.ts` — slot 22, next free).** Low-FP by construction (the repo drops high-FP gates: narrow-B at FP 84%, claim-detector at precision 0.20):

- **Hard-fail surfaces (zero Cyrillic tolerated):** comment lines in `.claude/hooks/**/*.sh` (excluding `lang/`), `scripts/**/*.sh`, `.claude/skills/**/helpers/*.sh` (excluding `lang/`), and source under `packages/**` (excluding fixtures). RU in these is always a category-1 violation.
- **Frontmatter scope (skills):** in each `SKILL.md` `description`, Cyrillic is allowed only within an explicit `Triggers:` segment (category 3); RU in the English prose portion fails.
- **Explicit file allowlist (interspersed legitimate RU):** `**/lang/ru.sh`, `pipeline/evals/**`, `pipeline/references/{anti-rationalization,red-flags,output-format}.md` (match-data + quotes), `docs/meta-factory/project-history-book.md`, and other RU narrative/research-patch docs. Allowlist entries carry an inline comment naming the category.

Strategy is deterministic, no paid LLM ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)). If implementation finds the markdown-body surface too FP-prone, fall back to hard-checking only shell/TS comments + frontmatter (still catches the real violations) and demote markdown-body coverage to the companion rule's prose — decided at plan time, recorded.

**Companion rule (`.claude/rules/language-discipline.md`, Class A).** Documents the §2 3-category model, the §4 gate, the keep-list. Discipline-bearing → carries doc-authority header + Class field, cites [ai-laziness-traps.md](../../../.claude/rules/ai-laziness-traps.md), runs through [self-reflection §1.7](../../../.claude/rules/phase-research-coverage.md). Reuses [rule-enforcement-channel-selection.md](../../../.claude/rules/rule-enforcement-channel-selection.md) for the always-on-vs-test channel split.

## §6 Decisions locked

1. **Trigger-words → bilingual, kept.** Clear call (not 50/50): CC activates skills by keyword-match in `description`; removing RU keywords silently breaks activation on Russian prompts, no upside. Asymmetric risk (keep = reversible edit; remove = silent functional regression). Normalize into an explicit `Triggers:` line so the English prose stays clean.
2. **B1 width → global, not pipeline-only**, + B2 reinforcement. The root cause is general (model doesn't know the active language); the maintainer's rule is general («все обращения к человеку»). Always-on is the strongest channel; a single buried SKILL instruction drifts.
3. **`AIF_HOOK_LANG` overrides prompt-language** when set; unset → English.

## §7 Out of scope (surface, don't do)

- Translating RU narrative (`project-history-book.md`) / RU research-patches — historical, legitimate RU.
- Editing the maintainer's private `~/.claude/CLAUDE.md` «respond in user's language» line — user-owned; precedence is documented in §4, not enforced by editing that file.
- New languages beyond en/ru — the mechanism is pack-extensible; not built ahead of need (YAGNI).

## §8 Files touched (estimate)

- **A:** `harvest-via-api.sh`, `end-of-turn-reminder.sh`, `.claude/hooks/lang/{en,ru}.sh` (new `AIF_EOT_QUESTION_PATTERN`), `self-reflection/SKILL.md`, possibly `pipeline/SKILL.md`/references prose.
- **B:** `inject-session-bootstrap.sh` (B1), `emit-output-strings.sh` + `pipeline/SKILL.md` §10 (B2).
- **C:** `packages/core/principles/22-internal-english.test.ts` (new), `.claude/rules/language-discipline.md` (new).

## §9 Testing

- New principle test (§5) is itself the regression guard.
- Hook unit behaviour: `AIF_HOOK_LANG=ru` vs unset smoke for `inject-session-bootstrap.sh` (B1 line present/absent) and `emit-output-strings.sh` (`AIF_OUTPUT_LANG` emitted, EN fallback on unknown pack) — mirrors the existing hook-i18n test approach.
- `lang/check-parity.sh` extended to assert the new `AIF_EOT_QUESTION_PATTERN` key exists in both packs.
- Always-on budget: `scripts/check-alwayson-budget.sh` stays green (B1 adds ≤1 short line, only when `AIF_HOOK_LANG` set).

## §10 Recursive self-application

The companion rule and this spec are themselves category-1 artifacts → authored in English (this spec is English; the rule will be). The guard-test asserts the discipline on the project's own machinery — recursive self-application green (invariant 2). The rule cites its own enforcement channel and runs the §1.7 forward/backward check.

## §11 Risks

- **B1 over-application** → Russian leaking into repo artifacts. Mitigated by precise scoping (§4) + the §5 guard catching any leak.
- **Guard-test false positives** on interspersed legit RU → mitigated by narrow hard-fail surfaces + explicit allowlist; documented FP-fallback in §5.
- **Umbrella scope** — one coherent concern (language discipline), 3 coupled stages (A/B/C), not independent subsystems. Staged within one umbrella per repo PR-strategy discipline.
