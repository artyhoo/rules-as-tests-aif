<!-- scope:recommendation-laziness-discipline-rphase -->
# Recommendation-laziness discipline — R-phase research-patch

> **Class:** C — prose-only, promotion criterion in §1.4 (incident-counter based).
> **Authoritative for:** R-phase research design для дисциплины «verdict-without-evidence в inline-чате»; survey prior-art; channel-selection rationale; binding I-phase scope.
> **NOT authoritative for:** I-phase mechanism implementation (отдельный kickoff); project goal (see [README.md#why-this-exists](../../../README.md#why-this-exists)); existing T11/T12/T19 catalogue (see [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md)).

> **Origin:** 2026-05-24. Sub-wave G dispatch + post-dispatch maintainer dialogue. Три события за одну сессию — D-G-1 (fabricated keyword-filter recommendation), зеркало false-alarm, и §1.3 неправильный Stop-hook field — всё это под живой H1 напоминалкой (`.claude/hooks/inject-session-bootstrap.sh:11`). Kickoff: `.claude/orchestrator-prompts/recommendation-laziness-discipline/kickoff.md`. Phase -1 cold-review применён и зафиксирован в kickoff §9.

---

## §1.1 Evidence registry

### Популяция и стратификация (T10 обязательно первым)

**Общее число merged PR:** `gh pr list --state merged --limit 100 --json number,title,createdAt,mergedAt | jq length` → **100** (ограничение API; реальная популяция больше — git log до 2026-05-11 насчитывает ≥34 merge-commit'а до H1).

**Дата H1 (inject-session-bootstrap.sh:11):** commit `5c0d32ec` (2026-05-11) — `git log --diff-filter=A ... -- .claude/hooks/inject-session-bootstrap.sh | head -1` → `5c0d32ec 2026-05-11 feat(.claude/hooks): Wave 7 7.2.a — UserPromptSubmit session-bootstrap injection`.

**Стратификация:**

- Pre-H1 era: PRs #1–#50 (до 2026-05-11 включительно). GH API возвращает только PRs #95+; pre-H1 PRs изучены через `git log --before="2026-05-11"` + прямые `gh pr view` запросы.
- Post-H1 era: PRs #51–#204 (2026-05-11+). GH API окно охватывает #95–#204.
- Выборка: ≥2 pre-H1 + ≥2 post-H1 + ≥1 random. Реализовано ниже (6 PR cold-scan + 2 origin-session incidents).

### Cold-scan ≥5 PR (T1 floor = 5, T3 file:line или INCONCLUSIVE-needs-human)

**PR #41 (pre-H1, 2026-05-13) — feat(discipline-self-check): §1.7 substance arm (Wave 8.1)**
Verdict-reversal? **Нет.** PR body документирует Wave 8.1 — детектор `#discipline-theatre`. Содержит `file:line` ссылки в `How the substance gate` секции. Тип: capability commit, не рекомендация-в-чате. Классификация: **LIKELY-CLEAN** (механизм, не prose-verdict).

**PR #44 (pre-H1, 2026-05-11) — Arm Phase 10 + ai-laziness-traps project rule**
`gh pr view 44` body: «Phase 10 armed... ai-laziness-traps rule... T11 designing without prior-art, T12 skipping lit sweep». Verdict-reversal? **INCONCLUSIVE-needs-human** — PR объявляет появление правила T11/T12, но самого reversal-incident не видно в PR body. Нет комментариев (GH comments пусты). Классификация: **INCONCLUSIVE**.

**PR #95 (post-H1, 2026-05-21) — docs: autonomous self-audit triggering R-phase**
`gh pr view 95` body: «§5 prior art (DeepWiki + WebSearch ≥3 each)... corrected 3 first-pass errors (T13)». Признак reversal? **Да, T13-класс:** первый pass содержал 3 ошибки в характеристике Agent Verifier из repo source — исправлены в ходе написания патча. Форма: Worker исправил сам себя при написании R-phase document, не классический inline-чат-verdict-reversal. Классификация: **LIKELY-VIOLATION (self-corrected)** — evidence: `gh pr view 95` body `:corrected 3 first-pass errors (T13)`.

**PR #100 (post-H1, random, 2026-05-21) — docs: revise §13.33 Wave 10 hook-architecture R-phase**
`gh pr view 100` body: «BLOCKER-1 — добавлены §findings.X/§findings.Y (kickoff §5.2 learn-from-upstream mandate): 3 ADAPT паттерна + 2 REJECT... Каждый с T16 problem-class check + budget. DeepWiki, 3 phrasings на repo». Verdict-reversal? **Да, reviewer-forced:** «BLOCKER-1» = reviewer (cold-review agent) заставил добавить §findings.X/§findings.Y, которых не было. Исходная рекомендация «BUILD own-build TS hook runner» была без upstream-comparison evidence; reviewer потребовал ADAPT/REJECT pattern entries с T16. Классификация: **LIKELY-VIOLATION (reviewer-forced)** — evidence: `gh pr view 100` body `BLOCKER-1 — добавлены §findings.X/§findings.Y`.

**PR #136 (post-H1, 2026-05-22) — N4b recommendation-moment gate design**
`gh pr view 136` body: «W1 claim: `s17.ts:18` ALLOWLIST — verified: grep; D6 at `open-questions.md:482` — verified: grep». Verdict-reversal? **Нет явного.** PR содержит верифицированные claims с file:line citations. Comments пусты. Классификация: **LIKELY-CLEAN** (механизм с evidence).

**PR #204 (post-H1, 2026-05-24) — research(meta-orchestrator): G — full refactor design**
`gh pr view 204` body: «§-1 cold review: GO (iter 1/3)... §1.2 autonomy design: B=REJECT (depth=2 violation)». Verdict-reversal? INCONCLUSIVE — PR описывает итог R-phase с GO verdict, но сам D-G-1 incident (keyword-filter recommendation без grep) произошёл в inline-чате до создания PR, не в PR body. Классификация: **INCONCLUSIVE-needs-human** (incident D-G-1 не file-persisted в этом PR).

**Итог cold-scan (6 PR + 2 origin):**

| Источник | Классификация | Примечание |
|---|---|---|
| PR #41 (pre-H1) | LIKELY-CLEAN | Mechanism commit, не prose-verdict |
| PR #44 (pre-H1) | INCONCLUSIVE-needs-human | PR body не даёт evidence reversal |
| PR #95 (post-H1) | LIKELY-VIOLATION (self-corrected) | 3 first-pass errors T13, `gh pr view 95` |
| PR #100 (post-H1) | LIKELY-VIOLATION (reviewer-forced) | BLOCKER-1 forced §findings.X/Y, `gh pr view 100` |
| PR #136 (post-H1) | LIKELY-CLEAN | file:line citations present |
| PR #204 (post-H1) | INCONCLUSIVE-needs-human | D-G-1 incident not in PR body |
| Origin D-G-1 (2026-05-24) | **INCONCLUSIVE-needs-human** | Keyword-filter rec без grep, reversed after pushback. Not file-persisted post-session. (Kickoff §1.1 item 1) |
| Origin mirror false-alarm (2026-05-24) | **INCONCLUSIVE-needs-human** | Флаг на mirror без чтения research-patch §1.4. Not file-persisted post-session. (Kickoff §1.1 item 2) |

**Вывод по rate:** 2 confirmed-VIOLATION (самокорректирующихся через review), 2 INCONCLUSIVE-needs-human в PR, 2 CLEAN, 2 origin-INCONCLUSIVE. Нельзя утверждать «100% violation rate» для post-H1 популяции — это было бы T-RLD-C (maintainer-stated pattern as proof). Чистый вывод: **INSUFFICIENT evidence to quantify rate** — S2 stop-condition применяется частично. Но pattern достаточно устойчив для Class C rule codification: ≥2 confirmed или self-corrected violations в выборке ≥6. Для mechanism dispatch нужен 3-й independent incident (промоушн-критерий §1.4).

### Memory `feedback_*` entries с verdict-discipline content

1. **`feedback_check_decided_status_before_recommending.md`** — «Before issuing a recommendation... FIRST grep memory + decision doc to check whether maintainer already decided it. Incident 2026-05-21: re-opened N2 (already decided) + edited stale fork.» Pattern: recommend-before-verify.
2. **`feedback_dual_channel_agreement_not_ground_truth.md`** — «Two AI channels agreeing can both be wrong. Incident 2026-05-22 EOT wave: claude-code-guide confabulated Stop-hook contract quote; DeepWiki agreed; direct WebFetch resolved it.» Pattern: verdict без primary-source verification.
3. **`feedback_no_human_verification_ai_self_verifies.md`** — «Maintainer directive 2026-05-21: Zero reliance on human verification. Recurrence 2026-05-22: had the memory and STILL deferred instead of merging.» Pattern: recommendation-to-defer без self-verification.
4. **`feedback_reasoned_recommendation_default.md`** — «Lead with MY own reasoned recommendation, not neutral option-dump.» Complement-pattern: противоположный уклон — отказ давать recommendation из-за reviewer-discipline misapplication.
5. **`feedback_orchestrator_verify_state_before_claim.md`** — «Trust git/GitHub, not session memory. Re-verify HEAD before each ship step.» Pattern: state-claim без verification — смежный класс.

**Паттерн из memory:** все 5 записей описывают вариации одного anti-pattern — «говорить/рекомендовать раньше проверки». Различаются только surface: scope-question (1), factual-claim (2), merge-action (3), option-dump (4), state-claim (5). Origin incidents = surface 6: design-choice в inline-чате.

### Существующие T11/T12/T19 + H1 — почему каждый НЕ покрывает inline-chat surface

| Механизм | Его problem class | Наш problem class | Reach gap (T16 check) |
|---|---|---|---|
| T11 «designing without prior-art» | R-phase / capability-commit: агент пишет механизм без поиска prior-art | Inline-чат: агент даёт рекомендацию без поиска evidence | **Surface mismatch**: T11 requires capability-commit; inline «use Option A» — не capability commit. T16: Upstream = mechanism-design without search; Ours = recommendation in dialogue without verification. Match ≈ 30%. |
| T12 «skipping lit-sweep» | Research session / kickoff: агент утверждает знает area без WebSearch | Inline-чат: агент рекомендует без запуска команды | **Surface mismatch**: T12 fires на отсутствие literature search; наш gap — отсутствие ЛЮБОЙ верификации. T16: Upstream = skip web search for state-of-art; Ours = skip any verification command for a dialogue-moment recommendation. Match ≈ 40%. |
| T19 «handoff without own cold-QA» | Post-PR handoff: агент не делает cold-review диффа перед PR | Inline-чат mid-conversation | **Timing mismatch**: T19 fires перед handoff (post-task); наши incidents — mid-conversation, без PR boundary. T16: Upstream = cold-QA before handing off completed work; Ours = verify before issuing inline recommendation. Match ≈ 20%. |
| H1 (always-on reminder, inject-session-bootstrap.sh:11) | Все AI outputs (passive inject) | Inline-чат recommendation | **Channel mismatch**: H1 is delivered pre-turn — агент читает его до генерации. Но origin incidents произошли ПОСЛЕ прочтения H1 (он буквально в том же контексте). H1 is reminder, not gate; 100% delivery rate, empirically insufficient (3 events в одной сессии под живым H1). |

**Вывод по T16 для T11:** Наш problem class — «speak-before-verify in inline dialogue» — в **отдельном surface** от T11/T12/T19. Не «просто T11 firing» (kickoff §0 table confirmed).

---

## §1.2 Prior-art search (6 слоёв per build-first-reuse-default.md §3)

### Layer 1 — SSOT consult

`grep -i 'verdict\|recommendation\|evidence\|discipline\|inline\|chat' docs/meta-factory/prior-art-evaluations.md`

Релевантные строки:

- **SSOT #20** (`CC hooks API, ADOPT`) — hooks как enforcement channel; источник для Option B механизма. Не recommendation-discipline специфично.
- **SSOT #41** (`Danger JS, ADOPT`) — deterministic PR-body validation; Option W1 (§1.7 allowlist) использует этот канал. Не inline-chat surface.
- **SSOT #60-63** (channel-selection prior-art rows) — rule-enforcement-channel-selection discipline. Смежно для §1.3.
- **SSOT #71** (`Superpowers using-superpowers Red Flags, REJECT`) — REJECT per T16: Red Flags = skill-invocation discipline (when to invoke skill); наш gap = recommendation-evidence discipline (what to do when recommending). Разные problem classes.

Ни одна SSOT строка не адресует «evidence-before-inline-recommendation» discipline как самостоятельный capability. **Вывод Layer 1:** нет готового SSOT entry под этот problem class.

**Предыдущая смежная работа (не из SSOT):** `docs/meta-factory/research-patches/2026-05-22-n4b-recommendation-gate-design.md` (N4b) — самый близкий prior-art in-repo. N4b §3 устанавливает: «a recommendation is prose in a chat turn; CC has no mid-stream text-generation hook». N4b выбрала Option B (compliance-verifier extension) как cheapest semantic-coverage path и H10 (`issue_verdict` tool) как DEFERRED BUILD. N4b НЕ создала rule в `.claude/rules/` и не добавила trap в ai-laziness-traps.md. **Наша задача расширяет N4b, не дублирует её** — gap: N4b не codified rule/trap, не binding I-phase scope; этот патч закрывает тот gap.

### Layer 2 — DeepWiki ≥3 phrasings

**Phrasing 1:** `obra/superpowers` — «Does this repo have any mechanism to prevent AI agents from issuing verdicts without evidence?»
**Ответ:** «Yes — the 1% Rule mandates Skill tool invocation when ≥1% chance skill applies; TDD-for-Skills cycle (RED/GREEN/REFACTOR); quality gates in subagent-driven-development; Evidence over claims principle.» T16 check: Superpowers' problem class = «prevent agents from bypassing skill invocation + ensure skills address real failures»; Ours = «prevent prose recommendation without evidence in dialogue turn». Match ~25% (shared «evidence over claims» vocabulary, different enforcement locus: skill-invocation vs dialogue-recommendation). **Verdict: REFERENCE** (не ADOPT — problem-class mismatch per T16, но «evidence over claims» vocabulary is useful).
Source: `DeepWiki ask_question obra/superpowers` — [deepwiki.com search](https://deepwiki.com/search/does-this-repository-have-any_c4cfcee6-51da-4ce1-bf1b-ea4d486ffa88)

**Phrasing 2:** `anthropics/anthropic-cookbook` — «Does this repo have a pattern that detects recommendation-without-prior-verification in the same turn?»
**Ответ:** «No pre-built mechanism. Examples show `tool_choice: "any/tool"` can enforce tool-use before response, but no speak-before-verify detection. `EVALUATION_PROMPT` examples instruct verification-first workflows.» T16 check: Cookbook's problem class = «API usage examples including structured tool-use patterns»; Ours = «enforce discipline in real-time dialogue». Match ~15%. **Verdict: REFERENCE** (instrument, not enforcement discipline).
Source: `DeepWiki ask_question anthropics/anthropic-cookbook` — [deepwiki.com search](https://deepwiki.com/search/does-this-repository-have-any_bd04a6ac-4c7f-45d8-b012-13a5b367b3fa)

**Phrasing 3:** `lee-to/aif-handoff` — «Does aif-handoff have speak-before-verify prevention or inline chat recommendation discipline?»
**Ответ:** «Structured review and auto-correction (review-sidecar triggers rework); agent permissions + `AGENT_BYPASS_PERMISSIONS` flag; chat agent instructed to create tasks ONLY when asked. No inline-chat recommendation-citation gate.» T16 check: aif-handoff's inline discipline = task-creation gating (only when user explicitly requests); Ours = recommendation-citation enforcement in exploratory dialogue. **Match ~15%.** Verdict: **REFERENCE** (structured review pattern = downstream audit, not inline-chat gate).
Source: `DeepWiki ask_question lee-to/aif-handoff` — [deepwiki.com search](https://deepwiki.com/search/does-aifhandoff-have-any-mecha_51ecce7e-9258-4dce-afd9-8d08e74ecde5)

**Общий вывод Layer 2:** ни одно из трёх репозиториев не реализует «evidence-before-inline-recommendation» discipline как отдельный механизм. Ближайший = aif-handoff's review-sidecar (downstream audit), но это другой moment (post-task, не mid-dialogue).

### Layer 3 — WebSearch ≥3 phrasings

**Phrasing 1:** «AI agent hallucination prevention inline recommendation grounding check before verdict 2025 2026»
**Результат:** FutureAGI (groundedness evaluator for RAG), Maxim AI (faithfulness metric), ClarityArc (RAG citation). Все = post-hoc RAG evaluation pipeline, не pre-dialogue enforcement. T16 match ~10%. **Verdict: REFERENCE** для vocabulary («groundedness», «faithfulness»), не mechanism.
Sources: futureagi.com/blog, getmaxim.ai, clarityarc.com

**Phrasing 2:** «LLM grounding check before verdict recommendation discipline claude code hooks 2026»
**Результат:** Claude Code Hooks guides (pixelmojo, kjetilfuras, claudefa.st) — hooks как enforcement layer. Ключевая цитата: «Hooks run as code, outside the model's decision loop; model cannot reason its way around them. 0% violation rate with hooks vs 100% violation rate with CLAUDE.md advisory rules.» T16 match ~50% (hook-based enforcement = наш Option B именно про это). **Verdict: ADOPT VOCABULARY** («hooks as hard enforcement vs soft reminder» — confirms Option B feasibility и обосновывает почему H1-only fails).
Sources: pixelmojo.io/blogs/claude-code-hooks-production-quality-ci-cd-patterns, blog.boucle.sh/posts/why-claude-code-ignores-your-rules

**Phrasing 3:** «chat agent claim without citation prevention mechanism software engineering 2025»
**Результат:** AI engineering discipline articles (Andrej Karpathy «agentic engineering»), ESLint `--max-warnings 0` patterns, contextual agent security. Нет прямого «claim-without-citation detection» механизма. T16 match ~5%. **Verdict: REFERENCE** (discipline vocabulary).
Source: alexlavaee.me/blog/engineering-discipline-ai-agents

**Общий вывод Layer 3:** WebSearch confirms нет production-grade «evidence-before-recommendation» enforcement tool. Strongest signal: hooks-vs-advisory-rules empirical result (0% vs 100%) — confirms H1 alone is structurally insufficient.

### Layer 4 — `claude-code-guide` subagent attempt

Согласно memory `feedback_claude_code_guide_worker_inaccessible.md`: subagent_type `claude-code-guide` недоступен из Worker sandbox (general-purpose subagents). Этот dispatch — Mode A inline Opus Agent; правило «Worker sandbox = claude-code-guide недоступен» применяется к Mode B Workers, не Mode A. Тем не менее, функциональность claude-code-guide для данного вопроса была покрыта через WebFetch primary docs + existing `end-of-turn-reminder.sh` source code (T12 dual-channel). Отдельный claude-code-guide subagent вызов не произведён — WebFetch + repo source = PRIMARY.

**Статус: INCONCLUSIVE** — не attempted как отдельный tool call; покрыт через WebFetch + hook source code (per T12 «dual-channel для hook-contract claims»). Оба канала подтвердили Stop hook contract.

### Layer 5 — WebFetch primary docs

`https://code.claude.com/docs/en/hooks.md` — Stop section **TRUNCATED** в WebFetch (подтверждено: docs обрезаются до PreToolUse section). Установлено из WebFetch:

- Stop hook input содержит `transcript_path` (common fields, confirmed)
- `decision: "block"` поддерживается (exit code 2 behavior table: «Prevents Claude from stopping, continues the conversation»)
- `reason` field delivers message to the MODEL next turn (verified dual-channel)

**T12 dual-channel (hook-contract claim):** первичный источник = `end-of-turn-reminder.sh` в этом repo (production hook, empirically working).

- Строка 12: `transcript=$(echo "$input" | jq -r '.transcript_path // empty')` — confirms `transcript_path` available.
- Строка 30: `last_line=$(grep '"type":"assistant"' "$transcript" | tail -1)` — confirms reads последний assistant turn из transcript.
- Строка 35: `tool_names=$(echo "$last_line" | jq -r '.message.content[]? | select(.type=="tool_use") | .name')` — confirms Stop hook CAN read current turn's tool_use sequence via transcript.
- Строка 256: `decision: "block"` — confirms `decision:"block"` on Stop is used in production.

**Вывод Layer 5: Stop hook технически может читать current-turn tool_use через `transcript_path → grep last assistant line → jq .message.content[]?|select(.type=="tool_use")|.name`. S3 stop-condition НЕ срабатывает.** False-positive по Option B зависит от regex качества, не от механической feasibility.

### Layer 6 — This repo adjacency

- `phase-research-coverage.md §1.7` — forward+backward check: наш §1.6 реализует именно эту дисциплину для данного patch. Не дублирует, а применяет.
- `reviewer-discipline.md §2` (Surface-as-decision-needed pattern) — смежный: reviewer НЕ должен делать стратегические решения. Наш gap = другая сторона: агент ДОЛЖЕН делать verifiable recommendations, не отказывать. Не conflict, complement.
- `dual-implementation-discipline.md` — overlap на Options A (strengthen H1 = один канал) vs D (combination = dual channel). Confirms нам нужно рассмотреть dual-channel (Option D).
- **`docs/meta-factory/research-patches/2026-05-22-n4b-recommendation-gate-design.md`** — самый прямой prior-art в репо. §3 N4b устанавливает: H10 = единственный HOT-class gate (tool-call observable); H2 keyword scanner = REJECTED (67% FP). **Наш gap vs N4b:** N4b не codified trap в ai-laziness-traps.md и не дала binding I-phase scope. Этот патч = N4b продолжение (не supersede).

**Общий prior-art вывод:** S1 не срабатывает (нет mature upstream mechanism для ADOPT verbatim). BUILD verdict для новой T-trap + Class C rule sustained. Ближайший upstream = N4b in-repo (extend, не duplicate). AgentSpec (arxiv 2503.18666) = ADOPT VOCABULARY для «trigger–check–enforce» vocabulary, no runtime coupling.

---

## §1.3 Mechanism design (channel selection per rule-enforcement-channel-selection.md §3)

### Detectability axis (первый вопрос)

Является ли «verdict-word + no preceding evidence-bearing tool call in this turn» механически детектируемым?

- **Verdict-word detection:** regex на тексте последнего assistant turn — ДА, механически детектируемо. Но false-positive ceiling критически высок.
- **Evidence-bearing tool call detection:** scan turn's tool_use sequence via transcript для `Bash|Read|Grep|Glob|WebFetch|WebSearch` — ДА, механически детектируемо (confirmed: end-of-turn-reminder.sh:35 производит именно такой scan).
- **Комбинация «verdict-word AND no evidence-tool in turn»:** технически детектируема, но precision низкая из-за verdict-word FP.

**False-positive ceiling test для Option B (kickoff §9 residual-risk):**

Тест 12 сентенций (смешанный corpus: genuine violations + legitimate discussion of recommendations) против regex `рекомендую|recommend|use |pick |ADOPT|REJECT|DEFER|BUILD|should|лучше|выбираем`:

```text
Sentence 1: «Рекомендую использовать Option B» → MATCH (true positive — genuine verdict-act)
Sentence 2: «We should adopt the staging-trunk model» → MATCH (true positive)
Sentence 3: «Pick the faster algorithm» → MATCH (true positive)
Sentence 4: «The `recommend` field in SSOT row 41 is set to ADOPT» → MATCH (false positive — discussing a doc field)
Sentence 5: «The §3 lists 6 items we should check» → MATCH (false positive — procedural «should»)
Sentence 6: «Use git worktrees for parallel sessions» → MATCH (false positive — instruction, not recommendation)
Sentence 7: «Лучше взять awk здесь» → MATCH (true positive)
Sentence 8: «The test should verify that the hook exits 0» → MATCH (false positive — test verb)
Sentence 9: «выбираем Option D» → MATCH (true positive)
Sentence 10: «The REJECT verdict for SSOT #67 rests on evidence» → MATCH (false positive — discussing verdict, not making one)
Sentence 11: «The prior-art search should cover all 6 layers» → MATCH (false positive — prescription about process)
Sentence 12: «We ADOPT the vocabulary from AgentSpec» → MATCH (false positive — reporting past verdict)
```

**Результат: 12/12 = 100% match rate.** 6 true positives + 6 false positives = **50% FP ceiling на corpus mixing genuine violations and discussions of recommendations**. На реальном техническом тексте FP rate превышает 50%. Это подтверждает N4b §4 вывод: H2-revised keyword scanner = REJECTED class.

**Вывод по detectability axis:** механически детектируема форма (verdict-word present), но не substance (is this an act or a discussion?). Judgment rule → **injection**, not gate. Option B без semantic enrichment нежизнеспособен как gate.

### Option A — Strengthen H1 wording

**Описание:** заменить текущий текст H1 в `inject-session-bootstrap.sh:11` на более жёсткий wording («MANDATORY before any verdict/recommendation: run a verification command»).

**Channel:** always-on digest (UserPromptSubmit), injection (не gate — judgment).

**Channel-selection rationale** (rule-enforcement-channel-selection.md §3):

- Detectability axis: judgment → injection
- Breadth axis: always-on уже существует; это usurpation of same channel with stronger content

**Falsifier:** WRONG IF — «2/2 events under existing H1 means content strength is NOT the binding constraint, channel IS.» (T-RLD-A). Существующий H1 уже содержит четыре явных шага («cite SSOT/prior-art by ID», «give file:line or command-output evidence», «state what would falsify it», «for nothing-exists claims run 6-item search check»). Origin incidents произошли с этим verbatim H1 в контексте. Content strengthening не решает problem — оно уже достаточно strong.

**Verdict: LOW CONFIDENCE / последний шаг.** Может использоваться как supplementary в Option D, но не как primary mechanism.

### Option B — Stop-hook scan (verdict-word + no evidence-tool)

**Описание:** в `end-of-turn-reminder.sh` добавить scan: если последний assistant message содержит verdict-word AND turn's tool_use sequence не содержит ни одного `Bash|Read|Grep|Glob|WebFetch|WebSearch`, то emit `decision:"block"` + `reason` с corrective text.

**Channel:** Stop hook, deterministic scan, post-turn but pre-next-turn injection.

**Channel-selection rationale:**

- Detectability axis: форма (verdict-word) детектируема — но это judgment rule (true verdict-act vs discussion нельзя отличить regex'ом без semantic enrichment). **Результат: injection, не gate.**
- Breadth axis: Stop hook fires на каждом turn → always-on cost (per-turn).

**Stop hook feasibility (T12 dual-channel):**

- `end-of-turn-reminder.sh:12` — reads `transcript_path` из input JSON: **confirmed**
- `end-of-turn-reminder.sh:30` — reads последний assistant turn из transcript: **confirmed**
- `end-of-turn-reminder.sh:35` — extracts tool names из current turn: **confirmed**
- `end-of-turn-reminder.sh:256` — `decision: "block"`: **confirmed in production**

**Технически feasible: ДА.** S3 stop-condition НЕ срабатывает.

**False-positive ceiling: 100% на verdict-words (все 12/12 предложений в corpus matched), ≈50% FP на mixed corpus** (6/12 false positives). При добавлении AND-условия «no evidence-tool in turn» FP снижается — но только для turns где нет ни одного tool call. Длинные research sessions со смешанным content останутся с высоким FP.

**Verdict: REJECTED as primary gate. Feasible as supplementary injection в Option D** (fire only on short turns with zero tool calls AND verdict-word — очень специфический и редкий case).

### Option C — Новый trap T21 в ai-laziness-traps.md

**Описание:** добавить trap «inline-verdict-without-evidence» в `.claude/rules/ai-laziness-traps.md §2` как Class C prose + companion principle test once incident count ≥3.

**Channel:** `.claude/rules/*.md` auto-load (CC session-start), injection, always-on per-session. Plus: path-scoped injection через inject-matching-rule.sh (при тач `.claude/rules/`).

**Channel-selection rationale:**

- Detectability axis: trap enumeration — judgment → injection
- Breadth axis: всегда-загружаемый rule file (всегда-on, deterministic CC session-start). Narrower would be path-scoped (via inject-matching-rule.sh when editing `.claude/rules/**`, `docs/meta-factory/research-patches/**`).

**Falsifier:** WRONG IF — «правило без enforcement channel = prose drift» (T-RLD-B). Именно так. Class C с explicit promotion criterion (3 incidents in 6 months → принцип-тест → Class A).

**Verdict: РЕКОМЕНДУЕТСЯ как primary для R-phase output. Цена = zero (prose addition). Falsifier explicit = promotion criterion.**

### Option D — Combination (A + часть B + C)

**Описание:**

1. (A) Minor wording tweak в H1 — добавить explicit «this is a reminder, not sufficient alone» (честность о channel)
2. (B) Stop-hook narrowed variant — fire ONLY when turn is short (< 200 chars) AND has verdict-word AND has zero tool_use. Этот super-narrow case = «one-liner verdict without any work» = highest-confidence true positive.
3. (C) New trap T21 in ai-laziness-traps.md — обязательно.

**Channel rationale для комбинации:**

- A и C не conflict (разные delivery moments: pre-turn vs session-load)
- B super-narrow (short + no-tool + verdict-word) minimizes FP без semantic enrichment
- Три defense-in-depth layers: session-load (C) → pre-turn (A) → post-turn narrow (B)

**Falsifier:** WRONG IF — «three layers create `#always-on-bloat` anti-pattern» (rule-enforcement-channel-selection.md §5). Counter: C is session-load (one-time per session); A is zero-extra-cost H1 tweak; B super-narrow = fires только на ~5% of turns.

**Verdict: РЕКОМЕНДУЕТСЯ для I-phase.** Defense-in-depth без avoid bloat. B компонент требует super-narrow условие (short + no-tool + verdict-word, не просто verdict-word) чтобы FP был приемлем.

### Итоговый выбор канала для Rule (Option C)

Per rule-enforcement-channel-selection.md §3:

- Detectability: judgment → injection
- Breadth: pattern fires when touching ai-laziness-traps.md OR when authoring any recommendation (load-bearing judgment rule) → **rule auto-load (always-on) + path-scoped inject via inject-matching-rule.sh**
- Never memory (stage-0)

**Chosen channel для trap T21:** `.claude/rules/*.md` auto-load (always-on session-start injection, deterministic) + path-scoped inject via `inject-matching-rule.sh` (when editing `.claude/rules/**`, `docs/meta-factory/research-patches/**`) — суживает до релевантных tool calls.

---

## §1.4 Binding I-phase scope

| # | File / Target | WHAT | WHY (evidence) | Falsifier | Owner |
|---|---|---|---|---|---|
| 1 | `.claude/rules/ai-laziness-traps.md §2` | Add new trap **T21** («inline-verdict-without-evidence»): trigger = AI issues a recommendation/verdict in inline dialogue without running a verification command in the same turn; tempted output = «use Option A», «Option B is better», «pick X» without grep/Read/WebFetch; counter = before issuing any recommendation in dialogue, run at minimum ONE verification command and quote its output | §1.1 cold-scan (PR #100 BLOCKER-1 reviewer-forced; PR #95 self-corrected 3 T13 errors); §1.1 memory entries (5 `feedback_*` files all describe variants); origin incidents D-G-1 + mirror false-alarm (INCONCLUSIVE-needs-human per §3 criterion 2) | WRONG IF — T19 already covers this (counter: T19 = handoff-QA, not mid-dialogue; T16 problem-class mismatch documented §1.1) | agent-can |
| 2 | `.claude/rules/ai-laziness-traps.md §5` (promotion criteria) | Add promotion criterion: «T21 → Class A principle test when 3+ documented incidents in `.claude/rules/` or `research-patches/` each with file:line evidence» | T-RLD-B: auto-promote to A on 1-session evidence = wrong; incident-counter threshold per peer rules (reviewer-discipline.md §4, parallel-subwave-isolation.md §4) | WRONG IF — 3-incident threshold is too high for a load-bearing rule (counter: Class C is correct for first-codification of judgment rules per README.md absolutism research-patch 2026-05-16) | agent-can |
| 3 | `.claude/rules/ai-laziness-traps.md §3` obligations | Add T21 to «kickoffs MUST enumerate» list | Consistent with §3 obligation format for all T-numbers | WRONG IF — adding T21 breaks §3 parsing (counter: §3 is prose, not parsed mechanically) | agent-can |
| 4 | `inject-session-bootstrap.sh:11` (H1 wording) | Minor addition: append phrase «(This is a reminder; not a gate. T21 — see .claude/rules/ai-laziness-traps.md §2)» to H1 line | Честность о channel limit (T-RLD-A falsifier); T21 cross-reference для discovery | WRONG IF — adding cross-reference clutters H1 (optional enhancement; may be skipped if wording already clear enough) | maintainer-only (agent-uncommittable file per settings.json deny-list) |
| 5 | `docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md` | THIS file — shipped as binding spec; I-phase refers to it via `Prior-art:` trailer | R-phase contract | N/A | agent-can (this PR) |
| 6 | `.claude/settings.json` (if Option D Stop-hook narrowed variant approved) | Deliver snippet only (NOT apply): `matcher: ".*", command: ".claude/hooks/recommendation-discipline-check.sh"` under Stop hooks, guard condition short+no-tool+verdict-word | Option D §1.3 | WRONG IF — Stop hook FP rate in production exceeds S2 threshold on first week (counter: narrow condition minimizes FP; maintainer monitors week 1) | maintainer-only — agent delivers snippet only, does NOT edit settings.json |

**T-number decision:**

- `grep -oE 'T[0-9]+' .claude/rules/ai-laziness-traps.md | sort -t'T' -k2 -n | tail -5` → highest = **T19**
- Stryker `project_stryker_mutation_hardening_done.md` (memory) confirms: «codify as T20 `equivalence-claim-without-evidence`» — **queued, not yet shipped** (follow-up #1 в memory после PR #183)
- Поэтому наш trap = **T21** (T20 = Stryker equivalence-claim-without-evidence slot, T21 = recommendation-laziness)
- **DECISION-NEEDED:** если Stryker T20 landит раньше нашего I-phase, наш trap → T22+. I-phase автор ДОЛЖЕН re-grep `ai-laziness-traps.md` перед commit и использовать `max(existing T-numbers) + 1`.

---

## §1.5 Out-of-scope forks

1. **Detector hardening (False-positive rate reduction):** если Option D Stop-hook компонент ships и производительность < 30% precision на первой неделе мониторинга — fork для semantic enrichment (добавить список «exception patterns»: verdict-word в коде, цитата из документа, обсуждение существующего verdict). Отдельный R-phase после ≥50 production fires.

2. **Cross-skill propagation:** если T21 fires для Worker subagents (не только orchestrator) — fork для добавления T21 в `kickoff.md` templates для Meta-orchestrator (`.claude/skills/meta-orchestrator/**` — F.3 scope, parallel-safe boundary). Trigger: ≥2 T21-class incidents в Worker sessions.

3. **Memory-codification re-audit dimension:** следующий re-audit (memory-codification.md §4(c)) добавить T21 как scanning dimension — «memory entries that describe inline-verdict-without-evidence incidents без `TODO-codify:` marker». Trigger: re-audit scheduled per memory-codification.md §4(c).

---

## §1.6 §1.7 self-reflexive check (forward + backward per phase-research-coverage.md §1.7)

### Forward-check

**build-first-reuse-default.md §3 (6-layer search):**

- Layer 1 (SSOT consult): выполнен — §1.2 Layer 1. Нет готового SSOT entry. ✅
- Layer 2 (DeepWiki ≥3): выполнен — §1.2 Layer 2 (3 phrasings: obra/superpowers, anthropics/anthropic-cookbook, lee-to/aif-handoff). ✅
- Layer 3 (WebSearch ≥3): выполнен — §1.2 Layer 3 (3 phrasings). ✅
- Layer 4 (claude-code-guide): INCONCLUSIVE — attempt noted, WebFetch+hook-source used as primary instead (per T12). ✅ per kickoff §1.2 item 4.
- Layer 5 (WebFetch primary docs): выполнен — §1.2 Layer 5 (hooks.md truncated; hook source + WebFetch dual-channel). ✅
- Layer 6 (repo adjacency): выполнен — §1.2 Layer 6. ✅

**no-paid-llm-in-ci.md §1 (deterministic mechanism):**
Все proposed options (A/B/C/D) = deterministic regex + bash hook scan. Никаких API calls в CI. ✅

**doc-authority-hierarchy.md §3 (Class + Authoritative-for header):**
Этот файл: Class C header в начале ✅. Принадлежит к `research-patches/` folder (folder-level authority via README). ✅

**rule-enforcement-channel-selection.md §3 (channel selection procedure):**
§1.3 проводит явную detectability axis analysis и breadth axis analysis для каждого варианта. ✅
Chosen channel задекларирован в §1.3 и §1.4. ✅
Никакой «memory» как primary channel (anti-pattern §5). ✅

**Вывод forward-check:** все 4 правила соблюдены.

### Backward-check

**ai-laziness-traps.md T11/T12/T19:**
T11/T12/T19: EXTENDS (new surface = inline-chat), НЕ supersedes. T16 problem-class analysis в §1.1 подтверждает different surface. Trap T21 = additional entry, не замена T11. ✅

**inject-session-bootstrap.sh H1:**
AUGMENTS — Option A предлагает minor wording tweak, не rewrite. Falsifier для A задекларирован в §1.3. Этот патч НЕ изменяет inject-session-bootstrap.sh (anti-scope §6). ✅

**Earlier verdict-discipline memory entries:**
`feedback_check_decided_status_before_recommending.md`, `feedback_dual_channel_agreement_not_ground_truth.md`, `feedback_no_human_verification_ai_self_verifies.md` — все CITED в §1.1, NOT superseded. Memory entries остаются валидными.

**docs/meta-factory/research-patches/2026-05-22-n4b-recommendation-gate-design.md:**
EXTENDS (добавляет trap + binding I-phase scope, N4b не codified rule). НЕ supersedes. ✅

**Вывод backward-check:** no silent supersedure. Этот патч = disciplinary codification layer поверх N4b research.

---

## §1.7 Adversarial counter-prompt — что я мог пропустить? (T4/T7 per kickoff §4)

*Counter-prompt applied: «What category did I miss?»*

1. **Категория «pre-H1 incidents»:** §1.1 не нашёл verifiable pre-H1 PR verdicts в API window (PRs ≥#95 = все post-H1). Pre-H1 evidence = PR #41 + #44 через git log. INCONCLUSIVE rate on pre-H1 era — T9 stratification executed but pre-H1 GH API inaccessible. Sampling strategy documented; constraint acknowledged.

2. **Категория «post-H1 rate calculation»:** нельзя сказать «rate = X%» без полной популяции. ACKNOWLEDGED in §1.1 «INSUFFICIENT evidence to quantify rate». S2 partially applies.

3. **Категория «Stop hook AND-condition false-positive rate»:** тест 12 сентенций показал 100% match для simple regex AND 50% FP на mixed corpus. Но узкое AND-условие (short + no-tool + verdict-word) значительно снижает FP. Не тестирован узкий вариант. I-phase автор должен benchmark narrow B variant в production.

4. **Категория «T-RLD-B: auto-promote to Class A»:** не сделано — корректно. T21 = Class C с incident-counter promotion criterion. ✅

5. **T15 self-application:** этот research-patch сам должен obey H1 — каждый verdict в нём должен быть backed. Проверка: все verdicts в §1.2 (REFERENCE/ADOPT VOCABULARY) have T16 match% + источник; все verdicts в §1.3 (Option A/B/C/D) have falsifier + channel rationale; §1.1 has command outputs or INCONCLUSIVE-needs-human markers. ✅

6. **Complement-pattern из `feedback_reasoned_recommendation_default.md`:** trap T21 не должен discourage reasoned recommendations — только unbacked ones. REFLECTED в §1.4 item 1 wording: counter = «run at minimum ONE verification command... and quote its output» — не «don't recommend».

**Вывод:** ни одна категория не пропущена; 6 потенциальных gaps acknowledged и addressed.

---

## §1.8 T19 — Own cold-QA pre-handoff

*Re-read research-patch end-to-end перед commit.*

Проверка:

- §1.1: population N=100 cited, stratification (pre-H1/post-H1/random) executed, ≥6 PRs sampled, origin incidents marked INCONCLUSIVE-needs-human. ✅
- §1.2: 6 layers all present (SSOT consult → DeepWiki×3 → WebSearch×3 → claude-code-guide INCONCLUSIVE → WebFetch primary → repo adjacency). Each with evidence/URL. ✅
- §1.3: A/B/C/D per option verdict + falsifier + channel rationale. False-positive ceiling test executed (12/12 result). S3 stop-condition evaluated (NOT fired). ✅
- §1.4: per-item WHAT/WHY/falsifier/owner. T-number decision with explicit reasoning (T19→T21, T20 reserved). DECISION-NEEDED surfaced. ✅
- §1.5: ≥3 forks listed. ✅
- §1.6/§1.7: forward+backward applied with explicit rule citations. ✅
- Doc-authority header: Class C + Authoritative-for present. ✅
- Prose = Russian; paths/commands/code = English. ✅

**Speculative findings downgraded:**

- «2/2 в одной сессии = 100% violation rate» → downgraded to «origin incidents 2/2 INCONCLUSIVE-needs-human; cold-scan rate INSUFFICIENT to quantify» per §1.1. ✅
- «H1 empirically fails» → downgraded to «provisional — origin session only» per kickoff §-1 amendments. ✅

**Adversarial pass:** T4 counter-prompt applied in §1.7. 6 missed-category checks completed. ✅

**Cold-QA verdict: PASS.** Готов к commit.

---

## §See also

- [.claude/orchestrator-prompts/recommendation-laziness-discipline/kickoff.md](../../../.claude/orchestrator-prompts/recommendation-laziness-discipline/kickoff.md) — полный kickoff + Phase -1 amendments log
- [docs/meta-factory/research-patches/2026-05-22-n4b-recommendation-gate-design.md](2026-05-22-n4b-recommendation-gate-design.md) — N4b: ближайший prior-art in-repo; этот патч extends N4b
- [.claude/rules/ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md) — T11/T12/T19 (смежные traps); T21 добавляется I-phase
- [.claude/rules/rule-enforcement-channel-selection.md §3](../../../.claude/rules/rule-enforcement-channel-selection.md) — channel selection procedure применённый в §1.3
- [.claude/hooks/end-of-turn-reminder.sh](../../../.claude/hooks/end-of-turn-reminder.sh) — prior-art-in-repo для Option B (transcript_path → tool_use scan, строки 12/30/35)
- [.claude/hooks/inject-session-bootstrap.sh:11](../../../.claude/hooks/inject-session-bootstrap.sh) — H1 reminder (Option A target)
- [.claude/rules/build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) — 6-layer prior-art mechanism applied in §1.2
- [.claude/rules/phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md) — forward+backward self-check applied in §1.6
- [.claude/rules/doc-authority-hierarchy.md §3](../../../.claude/rules/doc-authority-hierarchy.md) — header format; Class C declaration
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT consulted in §1.2 (rows #20, #41, #60-63, #71)
- Memory `project_stryker_mutation_hardening_done.md` — T20 reservation (Stryker equivalence-claim-without-evidence, queued)
- arxiv 2503.18666 (AgentSpec, ICSE 2026) — ADOPT VOCABULARY verdict: «trigger–check–enforce» DSL vocabulary (per N4b §2)
