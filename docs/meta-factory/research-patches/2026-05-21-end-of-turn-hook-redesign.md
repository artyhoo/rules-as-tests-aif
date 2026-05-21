<!-- scope:end-of-turn-hook-redesign -->
# Research-patch — end-of-turn hook REDESIGN (session-level anti-drift recap, dual audience)

> **Authoritative for:** the design (not implementation) of a content/purpose/audience redesign of `.claude/hooks/end-of-turn-reminder.sh` — Round 1 requirements (R1–R8), Round 2 prior-art verdicts, Round 3 design-spec + real-transcript evidence, Round 4 self-application, Round 5 decision-needed surface.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Hook **reliability** (already fixed, `d695ac5`) — see [end-of-turn-hook-reliability/kickoff.md](../../../.claude/orchestrator-prompts/end-of-turn-hook-reliability/kickoff.md). Think-time recommendation **mechanism** — see [recommendation-gate-iterative/kickoff.md](../../../.claude/orchestrator-prompts/recommendation-gate-iterative/kickoff.md). Self-trigger gap — see [autonomous-self-audit-research/research-prompt.md](../../../.claude/orchestrator-prompts/autonomous-self-audit-research/research-prompt.md).
> **Status:** design + implementation. Maintainer approved the design forks (§7); the hook was implemented on the `d695ac5` base (the live working-branch version, not the older `origin/main` `cfa28a3` which still uses `systemMessage` delivery — divergence noted in §5.5). End-to-end tested incl. the turn-1 fallback (§5.4). Drafted + implemented 2026-05-21.

---

## §1 — What & why, in plain words (this section doubles as the Round-4 self-application probe)

**What:** make the end-of-turn recap check the **whole session's goal**, in **plain language**, for **both me (the AI) and the maintainer** — instead of only paraphrasing the last message for myself.

**Why:** a recap of just the last turn cannot catch *slow drift* — the turn-by-turn slide away from what the session was actually for. And a recap only the AI can parse doesn't let the maintainer catch that drift live, while it's cheap to fix. The recap should be the runtime version of Step 0 / session-bootstrap goal-anchoring ([session-bootstrap.md](../../../.claude/session-bootstrap.md)): Step 0 anchors at session **start**; nothing re-anchors **mid-session** except this hook.

**How:** the hook cheaply reads the session goal from the transcript (CC's own `aiTitle` + the first instruction) and injects it; the recap then leads with a plain one-line verdict — *on goal / drifted toward X / deliberately pivoted to X* — that a human can read at a glance and that forces the AI to actually relate current work to the goal.

If this can't be said this simply, the design is muddled. It can → it passes its own «explain it simply» probe (vision §1.3). See §6 for the formal self-application.

---

## §2 — Relationship to companion sessions (non-duplication)

Three live artefacts hit the «end-of-turn / recommendation-moment» nerve. This patch stays in its lane:

| Artefact | Owns | This patch's boundary |
|---|---|---|
| [end-of-turn-hook-reliability](../../../.claude/orchestrator-prompts/end-of-turn-hook-reliability/kickoff.md) | hook **reliability** (silent false-negative). **FIXED** `d695ac5`; stateless-fire verified (no `/tmp`, no aggregation/isMeta/`//-1`). | Reliability is **out of scope and must not regress** (R7). This patch only changes *content/purpose/audience*. |
| [recommendation-gate-iterative](../../../.claude/orchestrator-prompts/recommendation-gate-iterative/kickoff.md) | deterministic **mechanism** to catch wrong recommendations at think-time (broad; HOT/WARM gate). NOT executed. | Branch B's «is this a real fork?» self-challenge (R5) is **prompt wording**, not a mechanism. It is one *input* to that session, not a substitute. See §7-D5. |
| [autonomous-self-audit-research](../../../.claude/orchestrator-prompts/autonomous-self-audit-research/research-prompt.md) | AI doesn't self-trigger self-check. This hook is its **candidate-mechanism-A** partial impl. NOT executed. | The redesign changes *what the Stop hook catches* → recorded as a feed-in for Item 5a (§7-D5). |

---

## §3 — Round 1: vision → checkable requirements

Each requirement carries an explicit **done-check** (the Round-1 gate: no requirement without a way to verify it). Source column maps back to maintainer vision §1.

| # | Requirement | Done-check | Vision |
|---|---|---|---|
| **R1** | Recap references the **session goal**, not only the last turn. | Recap names the goal in its own words AND ties current work to it. Falsifiable on a transcript where the last turn ≠ session goal. | §1.1 |
| **R2** | Recap gives an explicit **drift verdict**: one of `ON-GOAL` / `DRIFTED toward X` / `PIVOTED to X (why)`. | Recap contains a 3-way verdict, not a free-form work summary. «вроде на цели» is rejected. | §1.4 |
| **R3** | **Dual audience, single pass** — plain enough for a no-context maintainer, and serves as the AI's own comprehension check. | A maintainer skimming the first 2 lines can answer «what is it doing + on track?» without project jargon. | §1.2 |
| **R4** | **Comprehension-test framing** — forces named artefacts (file/decision) and licenses «I can't make this concrete → I don't understand it» as a *surfaced* output, not filler. | Prompt demands ≥1 named artefact per claim + one «least-sure / unverified» line. | §1.3 |
| **R5** | **Recommendation-first + fork-challenge** on question turns: lead with the AI's reasoned recommendation; first ask «is this a genuine fork or am I offloading a decision I could just make?» | Question-branch prompt contains both the recommend-first instruction and the «is this really a fork? — if one option is clearly best, do it, don't ask» self-challenge. | §1.5 |
| **R6** | **Cadence is not noise** — avoids ritualization (T7) without an invisible throttle. | Cadence rule is deterministic + visible; the anti-ritual force is a *real 3-way verdict*, which resists becoming filler better than free-form prose. | §2 Q2 |
| **R7** | **No reliability regression** — stateless-fire preserved; no `/tmp` state, no aggregation/isMeta/`//-1`. | Design adds no cross-invocation state that can silently stick. | hard-constraint §5 |
| **R8** | **No paid LLM; CC-native bash.** Recap is produced by the session; the hook only injects the prompt + the cheap deterministic anchor. | No API call in hook; `@cc-only-rationale` retained. | hard-constraint §5 |

---

## §4 — Round 2: prior-art (build-vs-reuse, problem-class matched per T16)

Method per [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md): DeepWiki + WebSearch (≥3 phrasings), SSOT consult. context7 intentionally excluded (it targets library API docs, not «does framework X solve problem-class Y»).

| Candidate | Upstream problem class | Our problem class | Match? | Verdict |
|---|---|---|---|---|
| **arxiv:2505.02709** «Evaluating Goal Drift in LM Agents» (already cited in [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md)) | *Measure/characterize* drift; survey realignment techniques. Technique #1 = «explicit repeated goal reminder / re-anchor each turn». | *Operationalize* technique #1 as a concrete CC Stop hook. | Partial — they characterize, we implement | **REFERENCE** — academic grounding for the re-anchor-each-turn approach. |
| **Cline Auto-Compact** (DeepWiki `cline/cline`) | Rescue context **before window overflow** (involuntary loss); summary is **AI-only**; trigger is **context-pressure**. | Catch **voluntary** drift while context is healthy; **dual** audience; trigger per-turn/periodic. | No on trigger+audience; **yes on summary structure** | **ADAPT** — borrow its summary-field template (intent / files / decisions / current work / next step) as the recap's skeleton; **REJECT** its trigger + AI-only audience. |
| **Cline `task_progress` checklist** (focusChainSettings) | «keep the user informed AND the AI anchored» — closest dual-audience precedent. | Same dual-audience intent, but a *goal re-anchor verdict*, not a task checklist. | Partial (audience matches, form differs) | **ADAPT VOCABULARY** — «informs human + anchors AI» framing validates R3. |
| **Amp auto-handoff** (WebSearch) | Context-overflow handoff summary to a fresh session. | While-on-goal drift catch, same session. | No (context-rescue, not drift-catch) | **REJECT** — different problem-class. |
| **`learnings.md` pattern** (WebSearch) | Cross-session accumulated lessons. | Within-session anti-drift. | No | **REJECT** — different problem-class. |
| **CC `aiTitle`** (empirical, §5.1) | UI label for the session. | Cheap deterministic session-goal anchor for the recap. | Yes (the signal is reusable) | **ADOPT** — read it; no LLM call of ours. |
| **CC Step 0 / session-bootstrap** (SSOT #8 AIF Step 0, #9 Cline Memory Bank — both ADOPT VOCABULARY) | Anchor goal at **session start**. | Re-anchor **mid-session, per turn**. | Complementary | **REFERENCE** — this hook is the per-turn runtime analog of session-start Step 0. |

**Capability verdict:** thin **BUILD** on bash (modify the existing <50-LOC hook) + **REFERENCE** (arxiv, Step 0) + **ADAPT** (Cline summary fields) + **ADOPT** (aiTitle signal). No new dependency, not under `packages/`, file stays <50 LOC of logic → **not a capability commit** per [CLAUDE.md](../../../CLAUDE.md); no `Prior-art:` trailer required at implementation time. Existing SSOT #8/#9/#20 cover the anchoring/hook family — no new SSOT entry needed (see §7-D6).

Sources: [arxiv 2505.02709](https://arxiv.org/abs/2505.02709), [AIES 2026 goal-drift](https://ojs.aaai.org/index.php/AIES/article/view/36541), [Zylos goal-persistence](https://zylos.ai/research/2026-04-03-goal-persistence-drift-long-horizon-ai-agents), [MemU context-drift](https://memu.pro/blog/ai-context-drift-enterprise-agent-memory), DeepWiki `cline/cline` Auto-Compact.

---

## §5 — Round 3: design-spec + real-transcript evidence

### §5.1 Anchor extraction (the deterministic part — RUN on real transcripts, not «would»)

The hook already receives `transcript_path`. Two candidate anchor sources, both extractable with `jq` in **~8 ms, zero LLM**:

- **`aiTitle`** — CC writes a one-line session summary into the transcript (`{"type":"ai-title","aiTitle":"…"}`).
- **first non-meta user text** — the literal first instruction.

**Empirical run** (4 most-recent transcripts in `~/.claude/projects/-Users-art-code-rules-as-tests-aif/`, 2026-05-21):

| transcript | `aiTitle` (extracted live) | first-user-msg head | last-turn len |
|---|---|---|---|
| c4008989 | `Redesign end-of-turn hook for session-level anti-drift` | `# Kickoff — end-of-turn hook REDESIGN …` | 0 (tool-only) |
| f1e4ecc4 | `Review recommendation and think-time gate features` | *(empty)* | 1808 |
| af194682 | `Review autonomous self-audit research prompt` | *(empty)* | 1435 |
| 5ad18331 | `Review kickoff document for swarm tools research` | *(empty)* | 0 |

**Load-bearing finding:** `aiTitle` is present and semantically correct in **4/4**; `first-user-msg` extraction is **fragile (empty in 3/4)** — the first user entry is often a slash-command/attachment with no top-level text block. **This flips the naive assumption: `aiTitle` is the PRIMARY anchor; first-user-msg head is the fallback.** (See §7-D3.) Extraction time measured at 0.008 s — satisfies R8.

Robust extraction (design sketch, ~5 LOC, stateless):

```bash
anchor=$(jq -rs 'map(select(.type=="ai-title")) | (.[-1].aiTitle // empty)' "$transcript" 2>/dev/null)
if [ -z "$anchor" ]; then
  anchor=$(jq -rs 'map(select(.type=="user" and (.isMeta!=true) and (.message.content|type=="array")))
           | (.[0].message.content[]? | select(.type=="text") | .text)' "$transcript" 2>/dev/null \
           | head -1 | tr '\n' ' ' | cut -c1-120)
fi
[ -z "$anchor" ] && anchor="(цель сессии не извлеклась — назови её сам)"
```

### §5.2 Branch A — session-anchored work recap (replaces current long-text block)

```text
Стоп. Прежде чем закончить — пересказ простыми словами, в первую очередь для себя.
Не можешь сказать просто, конкретно и в общем (что/зачем/почему/как) → сам не до конца понял. Это диагностика, не отчёт.

Цель сессии (из названия сессии / первого задания): «<ANCHOR>».

Первые 2 строки — так, чтобы человек без контекста понял с ходу:
• Чем я сейчас занят — одной фразой, простым языком.
• На той ли я цели — выбери ОДНО: НА ЦЕЛИ / УВЕЛО В СТОРОНУ <X> (и почему) / СОЗНАТЕЛЬНО СВЕРНУЛ на <X> (и зачем). Не «вроде на цели».

Дальше для себя, по пункту, с именами (файл/функция/решение), без воды:
• Что я только что сделал — конкретное изменение, не пересказ задачи.
• Нетривиальные решения — «выбрал X вместо Y потому что Z», или честно «решений не было».
• В чём меньше всего уверен — ОДНА вещь, которую стоит перепроверить.
• Следующий шаг и почему он следующий.
Любой пункт не выходит конкретным → скажи прямо, не заполняй водой.
```

Delta vs current: adds the **goal anchor line** + the **first-2-lines human-scannable drift verdict** (R1, R2, R3). Keeps the existing concreteness demands (R4, already strong in `d695ac5`).

### §5.3 Branch B — question turn: recommendation-first + fork-challenge (replaces current question block)

```text
Ты остановился на вопросе. Прежде чем ждать — проверь сам вопрос, для себя в первую очередь.

Цель сессии: «<ANCHOR>».

1. Это настоящая развилка — или я перекладываю решение, которое могу принять сам?
   Если один вариант явно лучше по существу (по целям сессии и дисциплине проекта) — НЕ спрашивай: сделай его и скажи, что сделал. Вопрос резервируй для развилок, где честно не выбрать на мерилах.
2. Если это правда развилка — сначала МОЯ обоснованная рекомендация: «Рекомендую <X>, потому что <причина против целей/трейдоффов>». Потом альтернативы коротко. Решает человек.
3. Простыми словами: что именно решаем и почему это блокирует — на простом примере, не повтор текста вопроса.
Суть выбора не объясняется просто → сам вопрос сформулирован неточно: скажи об этом.
```

Delta vs current: adds line 1 (**fork-challenge**) and line 2 (**recommendation-first**, per [[feedback-reasoned-recommendation-default]]) ahead of the existing «explain the choice simply» (R5).

### §5.4 Worked examples on the real transcripts above

- **f1e4ecc4** (anchor `Review recommendation and think-time gate features`, 1808-char last turn → Branch A). *Old recap:* «I summarized the think-time gate findings…» — about the turn. *New recap, line 2:* the model must pick `ON-GOAL` / `DRIFTED` against «Review … think-time gate». If the session had slid into *designing* a gate (vs *reviewing* it — a real risk for that topic), line 2 forces `DRIFTED toward design` — caught at turn end, visible to the maintainer. This is the value the old per-turn recap structurally could not produce.
- **af194682** (anchor `Review autonomous self-audit research prompt`, 1435-char → Branch A). New recap ties the turn to «review the prompt», surfacing if work crept into *executing* the research instead of reviewing it.
- **c4008989 / 5ad18331** (last turn 0 chars, tool-only) → neither branch fires (correct: bare tool calls need no recap; matches current logic, R7 preserved).

> Honesty note (T2/T3): the **anchor extraction** above is real (jq run, output pasted). The **recap prose** is model-generated at runtime, so the «new recap» lines are representative illustrations of what the prompt would elicit, not captured outputs — the design changes the *prompt*, and the prompt-text deltas (§5.2/§5.3) are the concrete, reviewable artefact.

**Implementation end-to-end test (2026-05-21, run against synthetic fixtures):** `bash -n` passes. Four cases exercised against the implemented hook:
- **F1** (aiTitle present + long markdown turn) → Branch A, anchor = `Redesign end-of-turn hook for session-level anti-drift`. ✓
- **F2** (NO aiTitle — **turn-1 case** — + long turn) → Branch A, anchor = fallback first-user-msg head `Почини баг в investment-chart waterfall…`. ✓ (closes the §6 residual)
- **F3** (aiTitle + question turn) → Branch B with recommendation-first + fork-challenge, anchor = `Review kickoff document for swarm tools`. ✓
- **F4** (bare tool_use, no text) → **SILENT** (no JSON emitted) — reliability/stateless behaviour preserved. ✓

Implementation gotcha (recorded for the Wave-10 TS rewrite): under `set -u`, an unquoted heredoc with `«$anchor»` made bash slurp the leading byte of the multibyte `»` into the variable name (`anchor�: unbound variable`). Fix: brace it — `«${anchor}»`.

### §5.5 Branch-state divergence found during implementation (load-bearing)

The hook has **diverged across refs** (the [[orchestrator-branch-state-drift]] trap, caught before building on the wrong base):
- **origin/main** `cfa28a3` (#81, 2026-05-21 00:50) — 3-branch, delivers the recap via **`systemMessage`** (which, per the `d695ac5` comment, does **not** reach the model).
- **working branch `chore/ssot-karpathy-skills-ref`** `d695ac5` (2026-05-21 02:27, ~1.5 h later, **unmerged**) — 2-branch, delivers via **`reason`** (reaches the model), with the verified-against-docs comment.

`d695ac5` is the newest and the live hook the maintainer's session runs; this redesign was built on it. **origin/main is therefore behind and still carries the `systemMessage` delivery** — surfaced as decision-needed D7 (§7).

---

## §6 — Round 4: self-application (T15)

- **Does this patch pass its own «explain it simply» probe (vision §1.3)?** Yes — see §1: what (check the whole session's goal, plainly, for AI + human) / why (last-turn recap misses slow drift; AI-only recap hides drift from the maintainer) / how (hook injects the cheap aiTitle anchor; recap leads with a 3-way goal verdict). Stated in 3 sentences without project jargon → passes.
- **Does the kickoff itself pass (T-hook-B)?** Yes — the kickoff's own thesis is «if you can't explain it simply you don't understand it»; this patch's §1 is that explanation, and it holds.
- **What would auditing this audit look like?** Re-run §5.1 extraction on ≥5 *more* transcripts to confirm `aiTitle` ≥90% present (current evidence: 4/4 but small N — T1 sampling floor not yet hit). **Resolved residual:** the turn-1 case (CC may not have written `aiTitle` yet on a brand-new session) is now verified by fixture F2 (§5.4) — with `aiTitle` absent the fallback extracts the first user instruction head, so the recap still anchors. The remaining small-N concern (is `aiTitle` ≥90% present across many sessions?) is non-blocking because the fallback always fires.
- **Does the design obey what it preaches?** R7 keeps the stateless property the reliability fix established — the redesign does not reach for hidden state, exactly the discipline it would otherwise violate.

---

## §7 — Round 5: decision-needed surface (reasoned recommendation first, then alternatives — maintainer decides)

Per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) these are surfaced, not decided. Per [[feedback-reasoned-recommendation-default]] each leads with my reasoned pick.

- **D1 — Cadence.** **Recommend: every qualifying turn carries the goal anchor (no tiering).** Reason: it's stateless (R7-safe), the strongest anti-drift, and the anti-ritual force is the *real 3-way verdict* (R6), not a throttle. Alternatives: periodic every-Nth-turn heavy/light tier (deterministic via transcript turn-count, still stateless, but more moving parts) → less drift coverage; topic-shift trigger → needs LLM/heuristic, T-hook-A risk, rejected.
- **D2 — Single vs split text.** **Recommend: single dual-purpose text** (§5.2), human-scannable first 2 lines + AI detail. Reason: a split machine/human format invites a clean «human» half and a sloppy «machine» half; the plain-language constraint *is* the comprehension test (vision §1.3), so unity is the point. Alternative: two explicit parts → cleaner for the human, but defeats R4.
- **D3 — Anchor source.** **Recommend: `aiTitle` PRIMARY, first-user-msg head FALLBACK** (§5.1 empirical: aiTitle 4/4 vs first-msg 1/4). Alternative: first-msg primary → fragile, rejected on evidence.
- **D4 — Deterministic drift signal in the hook?** **Recommend: NO — hook supplies the anchor; the model judges drift.** Reason: deterministic keyword-overlap between turn and goal is low-signal and noisy (T-hook-A). Alternative: add a crude overlap score → false alarms, maintenance cost, no clear win.
- **D5 — Overlap handling with companion sessions.** **Recommend: keep Branch B's fork-challenge here as prompt wording AND feed it as one input to recommendation-gate-iterative; do NOT merge sessions.** Also record this redesign as a «what the Stop hook now catches» input to autonomous-self-audit Item 5a. Reason: prompt wording ≠ the deterministic mechanism that session owns; merging would conflate scopes. (Surface-only; maintainer confirms.)
- **D7 — origin/main is behind (found during impl, §5.5).** **Recommend: get `d695ac5` + this redesign onto `origin/main`** so the merged hook delivers via `reason` (reaches the model), not the older `cfa28a3` `systemMessage` version. Reason: until merged, anyone branching off `origin/main` builds on a hook whose recap instruction may not reach the model. Alternative: leave divergence → recurring wrong-base risk. (Branch/PR sequencing is maintainer's call — surfaced, not decided.)
- **D6 — SSOT.** **Recommend: no new SSOT entry** — existing #8 (AIF Step 0), #9 (Cline Memory Bank), #20 (CC hooks) cover the family; this patch's §4 records the Cline-Auto-Compact-ADAPT + arxiv-REFERENCE as inline prior-art. Alternative: add a one-line WATCHLIST for Cline Auto-Compact structure → low value, register churn.

**Maintainer decisions (locked 2026-05-21):** **D1 = every qualifying turn carries the anchor** (recommended); **D2 = single dual-purpose text** (recommended); **D3 = aiTitle primary / first-user-msg fallback** (evidence-settled §5.1); **D4–D6 stand as recommended** (no deterministic drift signal in hook; keep Branch B wording + feed companions; no new SSOT entry) — override anytime.

**Implementation gate:** the design is now approved. Code edits to `.claude/hooks/end-of-turn-reminder.sh` are a **separate, explicitly-invited step** — per kickoff §5 («код хука менять только после одобрения дизайна») and the no-drive-by-PR discipline, **no hook PR is opened in this session.**

---

## §8 — Self-reflection §1.7 (this patch introduces design for a discipline-bearing artefact)

### Forward-check (what future work must honor this patch)
- Any implementation of §5.2/§5.3 must preserve the stateless-fire property (`file:line` [end-of-turn-reminder.sh:5-31](../../../.claude/hooks/end-of-turn-reminder.sh) — the no-`/tmp` read-last-assistant-line shape) — R7. The reliability kickoff's hard constraint against aggregation/isMeta/`//-1` ([end-of-turn-hook-reliability/kickoff.md §4.4](../../../.claude/orchestrator-prompts/end-of-turn-hook-reliability/kickoff.md)) carries forward unchanged.
- Branch B's recommendation-first wording (§5.3) must stay consistent with [[feedback-reasoned-recommendation-default]] and feed [recommendation-gate-iterative](../../../.claude/orchestrator-prompts/recommendation-gate-iterative/kickoff.md) §6 consolidation — not diverge from it.

### Backward-check (what existing rules/claims this patch leans on, verified)
- [no-paid-llm-in-ci.md §2](../../../.claude/rules/no-paid-llm-in-ci.md) — verified the recap is session-produced; anchor extraction is `jq`, no API. R8 holds.
- [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) — hook is internal tooling (`@cc-only-rationale` at [end-of-turn-reminder.sh:2](../../../.claude/hooks/end-of-turn-reminder.sh)); redesign does not add a portable channel, so no `@dual-pair` needed.
- [CLAUDE.md «capability commit»](../../../CLAUDE.md) — verified: modifying an existing <50-LOC bash hook, no new dep, not under `packages/` → not a capability commit; §4 verdict relies on this.
- Reliability claim re-verified this session: `git log` shows `d695ac5` is current; the hook read at [end-of-turn-reminder.sh](../../../.claude/hooks/end-of-turn-reminder.sh) is stateless (no `/tmp`, no aggregation). The redesign builds on a *fixed* base, not a broken one.

---

## §9 — Tags
`#end-of-turn-hook` `#session-level-anti-drift` `#dual-audience-recap` `#goal-anchoring-runtime` `#recommendation-first` `#design-only` `#prior-art-cline-autocompact` `#prior-art-aif-step0`
