<!-- scope:narrow-b-benchmark -->
# Narrow-B production-corpus benchmark — FP measurement for Option B

> **Class:** C — исследовательский патч (R-phase output); механизм — I-phase (данный патч закрывает blocker, не шипает механизм).
> **Authoritative for:** empirical FP-rate measurement of the narrow-B variant (short turn + zero tool_use + verdict-word regex) on production session transcripts; §1.5 verdict on Option D composition.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../../README.md#why-this-exists). Option A or Option C evaluation — those are out-of-scope per kickoff §1.6 backward-check. I-phase mechanism design — следует после этого патча.

> **Origin:** 2026-05-25. Закрывает blocker из [2026-05-24-recommendation-laziness-discipline.md §1.5 item 4](2026-05-24-recommendation-laziness-discipline.md): «Если narrow-B FP-rate >20% на реальном corpus → исключить narrow-B из Option D». Kickoff: `.claude/orchestrator-prompts/narrow-b-benchmark/kickoff.md`.

---

## §-1 Re-verify: результат cold pass

Все три проверки GO:

```bash
grep -n "Narrow-B production-corpus benchmark" docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md
# → строка 320: §1.5 item 4 найдена; 20% threshold подтверждён; falsifier «исключить narrow-B если >20%» подтверждён

grep -n 'рекомендую\|recommend\|use ' docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md | head -5
# → строка 187 содержит verbatim regex (см. §1.2 ниже)

ls ~/.claude/projects/-Users-art-code-rules-as-tests-aif/*.jsonl | wc -l
# → 435 файлов (≥100 требуемых для ≥100 assistant turns; фактически 22737 turns)
```

Schema sanity (подтверждено на 3 разных `.jsonl`): msg_id может span несколько JSONL-строк (thinking/text/tool_use); все три типа контента встречаются в одном msg_id:

```text
File: ff9f2069-...jsonl
  msg_id: msg_01VSY4rJsNj35zXo → content types: ['thinking', 'text', 'tool_use']
```

**GO → переход к §1.1.**

---

## §1.1 Corpus selection + stratification

### Population enumeration (T10 — первым)

```bash
ls ~/.claude/projects/-Users-art-code-rules-as-tests-aif/*.jsonl | wc -l
# 435

du -sh ~/.claude/projects/-Users-art-code-rules-as-tests-aif/
# 460M
```

**N_files = 435**, **total_bytes ≈ 460 MB**.

Дата-диапазон корпуса: 2026-05-06 — 2026-05-25 (18.3 дней). Все файлы попадают в 30-дневное окно — «старше 30 дней» не существует. Адаптированные страты:

| Страта | Граница | N_files |
|---|---|---|
| Recent | < 7 дней | 142 |
| Mid | 7–15 дней | 207 |
| Old | > 15 дней | 86 |

По размеру файла:

| Страта | Граница | N_files |
|---|---|---|
| Small | < 100 KB | 49 |
| Medium | 100 KB – 1 MB | 250 |
| Large | > 1 MB | 136 |

**Дополнительный корпус `/tmp/claude-501/-Users-art-code-rules-as-tests-aif/`**: 164 директории найдены, но `tasks/*.output` отсутствуют. Источник задокументирован как «существует, output-файлы недоступны» — продолжаем с основным корпусом `~/.claude/projects/.../*.jsonl`.

**Session-type axis:** выборка 50 файлов: execution=60%, chat=36%, r-phase=4%. Подтверждает предупреждение kickoff §1.1: ≥80% попадают в execution/r-phase. Ось session-type пропускается — не изолирует FP-вариацию в этом meta-tooling корпусе.

### Turn enumeration

**Definition:** assistant turn = все JSONL-строки с `type=="assistant"`, группированные по `message.id` (msg_id). Для каждого msg_id конкатенируем все `.message.content[].text` → `turn_text`; подсчитываем все `.message.content[]` с `.type ∈ {tool_use, server_tool_use, code_execution_tool}` → `tool_count`.

Обоснование: kickoff §1.7 требует агрегировать ВСЕ строки msg_id, а не только последнюю (production hook `end-of-turn-reminder.sh:30-41` читает `tail -1` для быстродействия, что является допустимым расхождением для мониторинга, но некорректно для benchmark).

```python
# scan result (full corpus, 435 files):
N_turns_total = 22737
zero-text turns (char_count=0): 9639   # thinking-only + tool-use-only turns
non-zero text, tool_count=0: 3495
non-zero text, tool_count>0: 9603
```

**Распределение char_count (все 22737 turns):**

| Percentile | chars |
|---|---|
| 10th | 0 |
| 25th | 0 |
| 50th | 60 |
| 75th | 231 |
| 90th | 1694 |
| 95th | 2974 |
| Max | 35874 |

Медианный turn — 60 chars: корпус тяжело перекошен в сторону коротких «thinking» turns без текста.

**Verdict-word matched turns (no char/tool filter):** 1880 из 22737 (8.3%).

---

## §1.2 Filter implementation

Regex из source-of-truth `2026-05-24-recommendation-laziness-discipline.md:187` — verbatim, case-sensitive:

```text
рекомендую|recommend|use |pick |ADOPT|REJECT|DEFER|BUILD|should|лучше|выбираем
```

**Narrow-B filter (Python/bash + jq):**

```python
import json, os, glob, re

VERDICT_REGEX = r'рекомендую|recommend|use |pick |ADOPT|REJECT|DEFER|BUILD|should|лучше|выбираем'
JSONL_DIR = os.path.expanduser("~/.claude/projects/-Users-art-code-rules-as-tests-aif")
N = 750  # char threshold (see §1.4)

def scan_corpus(jsonl_dir, N):
    files = glob.glob(os.path.join(jsonl_dir, "*.jsonl"))
    matches = []
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        msg_groups = {}
        for line in lines:
            obj = json.loads(line.strip())
            if obj.get('type') == 'assistant':
                mid = obj['message']['id']
                if mid not in msg_groups:
                    msg_groups[mid] = {'text': [], 'tool_names': []}
                for c in obj['message'].get('content', []):
                    if c.get('type') == 'text':
                        msg_groups[mid]['text'].append(c.get('text', ''))
                    elif c.get('type') in ('tool_use', 'server_tool_use', 'code_execution_tool'):
                        msg_groups[mid]['tool_names'].append(c.get('name', c['type']))
        for mid, data in msg_groups.items():
            turn_text = '\n'.join(data['text'])
            char_count = len(turn_text)
            tool_count = len(data['tool_names'])
            has_verdict = bool(re.search(VERDICT_REGEX, turn_text))
            is_match = char_count < N and tool_count == 0 and has_verdict
            if is_match:
                matches.append({'msg_id': mid, 'char_count': char_count,
                                'tool_count': tool_count, 'text': turn_text})
    return matches
```

**Примечание по `tool_use`:** учитываются типы `tool_use`, `server_tool_use`, `code_execution_tool`. Тип `thinking` не считается tool (только контент). Это соответствует семантике narrow-B: turns, где агент только думает и текстово отвечает, без вызова инструментов.

---

## §1.4 Char-count threshold N

**Распределение char_count для verdict-matched turns (n=1880, no char/tool filter):**

| Percentile | chars |
|---|---|
| 10th | 269 |
| 25th | 1033 |
| 50th | 2349 |
| 75th | 4164 |
| 90th | 6336 |
| Max | 35874 |

10th percentile verdict turns = 269 chars. Гипотеза: очень короткие verdict turns (<500 chars) = conversational; длинные (>2000) = research-patch / spec text.

**Выбранный N = 750 chars** (≈ 188 tokens по rule-of-thumb chars/4).

Обоснование: при N=500 (kickoff default) получаем 9 matches — ниже пола ≥10. N=750 (+50%) дает 19 matches — достаточно для классификации. N=750 соответствует примерно 2–3 параграфам conversational text: достаточно для «I recommend X because Y» (пример Match 3: 556 chars = 3 предложения). Более длинные turns (>750 chars) уже содержат структурированные отчёты или technical logs.

**Чувствительность к ±50% вариации N:**

```text
N=500  (default):  9 matches  (INCONCLUSIVE-insufficient-sample)
N=750  (chosen):  19 matches  ← выбран
N=1000 (+33%):   41 matches
N=1500 (+100%):  173 matches
```

N=500 дает INCONCLUSIVE-insufficient-sample по §1.5 (< 10 matches). N=750 — минимальное значение, достаточное для measurement. При N=1000 → 41 matches; при N=1500 → 173 matches. **FP_rate при N>750 не измерялась** — только количество matches зафиксировано. Одни лишь counts не доказывают тренд FP_rate; они лишь показывают, что фильтр срабатывает шире при росте N. Чтобы экстраполировать FP_rate на N=1000 или N=1500, потребовалась бы отдельная ручная классификация на этих значениях N. Verdict при N=750 (16/19 FP) не затронут этим пробелом — §1.5 механически применяет измеренную FP_rate при выбранном N, а нижняя граница Wilson CI (62%) в 3× превышает порог 20%; никакая реалистичная переклассификация при большем N не изменит verdict. Выбор N=750 консервативен (узкий фильтр; если FP_rate < 20% при N=750, он останется < 20% при N=500).

---

## §1.3 Measurement results

### Агрегат

```text
N_turns_total = 22737
N_matches (N=750) = 19
N_no_matches = 22718
```

### Manual classification — matches (n=19)

Rubric применяется из kickoff §1.3, 7 FP shapes.

| # | chars | Triggering word(s) | Classification | FP shape | Notes |
|---|---|---|---|---|---|
| 1 | 730 | ADOPT/REJECT/DEFER | FP | 6 — procedural meta | Шаблон формата REPORT: «Primitive A verdict: ADOPT/DEFER/REJECT — <rationale>» — placeholders, не verdicts |
| 2 | 439 | ADOPT, DEFER | FP | 7 — doc narration | Changelog: «SSOT #28 — partial ADAPT задокументирован, SSOT #30 — implement-coordinator DEFER» — narrating completed edits |
| 3 | 556 | рекомендую | **TP** | — | «рекомендую переименовать status в файле ARMED → CLOSED» — fresh agent recommendation to maintainer |
| 4 | 193 | рекомендую | **TP** | — | «взять самое срочное (рекомендую) — или разблокировать симлинк» — genuine inline project-path verdict |
| 5 | 311 | should | FP | 2 — test/spec | «CI should now pass» — prediction of CI system behavior, not project verdict |
| 6 | 367 | should | FP | 2 — test/spec | «CI should now pass» — same pattern as Match 5 |
| 7 | 299 | recommend | FP | 3 — quoting past | «per reviewer recommendations» — referencing existing recommendations, not authoring new one |
| 8 | 523 | pick | FP | 6 — procedural | «cherry-pick только Stage 1» — git cherry-pick command, not project-scope verdict |
| 9 | 603 | use | FP | 6 — procedural | «Quota use в этой umbrella ~minimal» — "use" in "quota use" compound noun, not verb verdict |
| 10 | 744 | use | FP | 6 — procedural | «build-vs-reuse gate» — "use" embedded in compound noun phrase, not a verdict act |
| 11 | 502 | use | FP | 5 — quoting user text | «do NOT use this tool» — quoting tool description text, not agent verdict |
| 12 | 233 | лучше/рекомендация | **TP** | — | «рекомендация: оставить #82 как есть» — fresh agent recommendation to leave PR as-is |
| 13 | 257 | recommend | FP | 3 — quoting past | «I've already given my recommendation» — referencing a past recommendation, not making new one |
| 14 | 731 | лучше | FP | 3 — quoting past conclusion | «reviewer и твой разбор пришли к одному выводу» — narrating shared conclusion; "лучше" in «оригинальный работал лучше» (past finding) |
| 15 | 518 | use, pick | FP | 7 — doc narration | «research-patches use ../.. for refs» + «cherry-pick path» — documenting conventions + git op |
| 16 | 320 | BUILD | FP | 7 — doc narration | «4 BUILD areas закрыты» — reporting BUILD areas completed, not making BUILD verdict |
| 17 | 662 | recommend×2 | FP | 3 — meta-discussion | «recommendation не проходит проверку» — discussing the concept of recommendation in meta-context |
| 18 | 418 | pick | FP | 6 — procedural | «revert+cherry-pick — не делаю» — refusing a git operation, "pick" in cherry-pick |
| 19 | 590 | pick, use | FP | 6 — procedural | «cherry-pick только Stage 1» + «research-patches use» — git op + convention narration |

**Итог:**

```text
TP = 3  (matches 3, 4, 12)
FP = 16 (все остальные)
N_classified_matches = 19
```

### Manual classification — no-matches (n=10, seed=42)

| # | chars | tools | has_verdict | Classification | Notes |
|---|---|---|---|---|---|
| 1 | 6475 | 0 | False | TN | Корректно исключён: нет verdict-слова |
| 2 | 113 | 1 | False | TN | Корректно исключён: tool_count > 0 |
| 3 | 103 | 4 | False | TN | Корректно исключён: tool_count > 0 |
| 4 | 2244 | 0 | True | TN | Корректно исключён: char_count > 750 (длинный PR summary) |
| 5 | 2986 | 0 | False | TN | Корректно исключён: нет verdict-слова |
| 6 | 2044 | 1 | False | TN | Корректно исключён: tool_count > 0 |
| 7 | 60 | 1 | False | TN | Корректно исключён: tool_count > 0 |
| 8 | 540 | 1 | False | TN | Корректно исключён: tool_count > 0 |
| 9 | 10939 | 0 | True | TN | Корректно исключён: char_count >> 750 (длинный evaluation doc) |
| 10 | 365 | 1 | False | TN | Корректно исключён: tool_count > 0 |

```text
TN = 10, FN = 0
N_classified_no_matches = 10
```

**FN = 0** на выборке n=10. Оговорка: recall завышен (small sample). Настоящий recall ниже — многие genuine verdict acts будут в длинных turns (> 750 chars) или в turns с tool_use.

### Метрики

```text
precision = TP / (TP + FP) = 3/19 = 0.158
FP_rate   = FP / (TP + FP) = 16/19 = 0.842 (84.2%)
recall    = TP / (TP + FN) = 3/3 = 1.0 (grубо; n=10 no-match sample only)

Wilson 95% CI для FP_rate (n=19, p=0.842):
  CI = [62.4%, 94.5%]
```

**FP_rate = 84%, point estimate; Wilson 95% CI: [62%, 95%], n=19.**

Доминирующий FP pattern: слово `use` / `pick` / `should` / `BUILD` / `recommend` как часть технического текста (git-команды, compound nouns, meta-discussion о дисциплине, changelog narration). Слова `лучше` / `рекомендую` дают больше TP (2 из 3 TP), но также FP (matches 12→TP, 14→FP).

---

## §1.5 Verdict

**FP_rate = 84.2% (Wilson 95% CI: [62%, 95%], n=19) >> 20% порог.**

**VERDICT: FP_rate > 20% → Option D downgrades to A+C. Drop narrow-B from I-phase.**

Per `2026-05-24-recommendation-laziness-discipline.md §1.5 item 4`:

> «Если narrow-B FP-rate >20% на реальном corpus → исключить narrow-B из Option D, поставить Option D только как A+C (без B компонента вообще).»

Результат механический: нижняя граница Wilson CI (62%) всё равно >> 20%. Verdict не пересечет 20% threshold даже при максимально благоприятной неопределённости.

**Дополнительный finding:** при N=500 (kickoff default) — 9 matches, что ниже пола ≥10 → INCONCLUSIVE-insufficient-sample на N=500. Даже этот «более строгий» filter не достигает нужного precision.

**Comparison с ad-hoc тестом из source-of-truth:** §1.3 в `2026-05-24-recommendation-laziness-discipline.md` reported «50% FP ceiling» на constructed corpus (6 TP + 6 FP by design). Production benchmark показывает 84% — значительно хуже, что подтверждает тезис §0: ad-hoc constructed sample был FLOOR-оценкой (оптимистичной), а не ceiling.

---

## §1.6 Forward + Backward checks

### Forward-check

**[build-first-reuse-default.md §3](../../../../.claude/rules/build-first-reuse-default.md):** бенчмарк — это измерение, не введение capability. Полный 6-layer search не требуется (§1.6 kickoff). Upstream survey (обязательная 1× проверка):

- DeepWiki `ask_question` на `obra/superpowers`: «Does this repo have a production-corpus benchmark for verdict-word regex false-positive rate in chat transcripts?» → **INCONCLUSIVE-no-upstream** (Superpowers фокусируется на workflow automation, не на transcript measurement tooling).
- WebSearch (recall): нет production-grade tool для «verdict-word benchmark on AI chat transcripts» как отдельного namespace. Проблема слишком project-specific (T16: наш problem class = measure FP rate of a specific regex on this project's transcript corpus; нет категории tools).

Verdict: **BUILD** justified for this measurement (project-specific, no upstream analog). Не capability commit — это исследовательский патч.

**[no-paid-llm-in-ci.md](../../../../.claude/rules/no-paid-llm-in-ci.md):** вся классификация выполнена Worker'ом (reading turns manually); ноль API-billed LLM вызовов. ✅

**[doc-authority-hierarchy.md §3](../../../../.claude/rules/doc-authority-hierarchy.md):** этот файл несёт Class + Authoritative-for header. ✅

**[phase-research-coverage.md §1.11](../../../../.claude/rules/phase-research-coverage.md):** каждый claim подкреплён командой + output или file:line + content. Классификация каждого match приводит actual text + explicit shape. ✅

### Backward-check

**Не supersedes `2026-05-24-recommendation-laziness-discipline.md §1.3` ad-hoc тест:** ad-hoc тест (12 sentences, 50/50 by design) остается как верхняя оценка (FLOOR в терминах FP_rate, т.е. оптимистичная). Данный патч — production-grade нижняя оценка (РЕАЛЬНЫЙ FP_rate). Цитируем оба в research-patch (этот §1.5).

**Не касается Option A или Option C:** данный патч ограничен Option B (narrow-B variant). Scope явно задокументирован.

---

## §1.7 Adversarial counter-prompt

**«Did I sample only English text?»** — Нет. Корпус содержит смесь русского + английского. Regex включает обе языковые группы (`рекомендую|лучше|выбираем` = русские; `recommend|use |pick |...` = английские). Matches 3, 4, 12 (все TP) — на русском. Matches 5, 6, 7 (FP) — на английском. FP pattern не language-specific.

**«Did I count `tool_use` correctly?»** — Агрегировали ВСЕ строки msg_id (не только последнюю). Production hook `end-of-turn-reminder.sh:30` использует `tail -1` — это корректно для своей задачи (last-line optimization), но benchmark должен агрегировать все строки для полноты. Расхождение задокументировано. Если production hook будет использовать только последнюю строку для narrow-B check, это создаст ещё один failure mode (turn с tool_use в первой строке но не в последней был бы пропущен). **Recommendation для I-phase:** если B-компонент когда-либо пересматривается, hook должен агрегировать все строки msg_id, не только `tail -1`.

**«Did I filter on the right `type` field?»** — Учитывались `tool_use`, `server_tool_use`, `code_execution_tool`. Тип `thinking` не считается tool. Верифицировано на реальных transcript lines.

**«Did I sample non-uniformly?»** — No-match sample использовал `random.sample(seed=42)` — deterministic uniform random. Match sample: все 19 matches при N=750 классифицированы полностью (100% coverage, не выборка). ✅

**«Did I leak my own classification bias?»** — Да, и это load-bearing caveat: Worker является той же model-class что и агенты, произведшие transcript. Классификация «это genuine verdict act?» выполнена тем же видом модели что и автор turns. **Bias disclosure:** Worker с большей вероятностью ПОНИМАЕТ контекст (git cherry-pick = not verdict, «рекомендую» в closing statement = verdict) чем внешний аннотатор. Это может как снизить FP (корректное понимание intent), так и завысить TP (предвзятость в пользу «это настоящая рекомендация»). На результат: 3 TP vs 16 FP — даже при смещении в сторону TP, FP_rate = 84% далеко от 20%. Bias не меняет verdict.

**«What category did I miss?»**

1. **Tool_use aggregation gap:** проверено (all lines of msg_id). ✅
2. **Тест собственного кода benchmark'а:** скрипт верифицирован на реальных данных (count-results соответствуют manual review of all 19 matches). ✅
3. **Boundary cases:** match 12 («рекомендация: оставить...») — borderline TP. Перечитан дважды: «оставить #82 как есть» = fresh agent recommendation on project action = TP confirmed. ✅
4. **Проверка self-application (T15):** этот benchmark сканирует прошлые R-phase сессии этого проекта — включая сессии, в которых работал тот же класс модели. Worker'а, измеряющий narrow-B, сам является candidate violator под narrow-B (будущий turn с «рекомендую X» без tool call подпадал бы под фильтр). Это задокументировано как T15 per kickoff §7.

---

## §T19 Cold-QA pre-handoff

Re-читаю патч end-to-end:

- §1.1 corpus enumeration: команды + outputs. ✅
- §1.2 filter: скрипт inline + документация типов tool. ✅
- §1.3 classification table: все 19 matches, каждый с triggering word + FP shape или TP. ✅
- §1.4 N=750 выбор + sensitivity table. ✅
- §1.5 verdict: механический из данных. ✅
- §1.6 forward+backward: все 4 правила. ✅
- §1.7 adversarial: 5 counter-prompts + self-application. ✅

**Downgrade speculative findings:** recall=1.0 на n=10 no-match sample — **speculative; не следует интерпретировать как «filter не пропускает настоящих verdicts»**. Настоящий recall, скорее всего, низкий: большинство genuine verdict acts находятся в длинных turns (>750 chars) и turns с tool_use. Данный benchmark измерял только precision/FP_rate, не recall. Это by-design (kickoff §1.3 фокусируется на FP_rate).

---

## Problem

Narrow-B variant (short turn + zero tool_use + verdict-word regex) позиционировался как feasibility-unverified компонент Option D в `2026-05-24-recommendation-laziness-discipline.md §1.3`. Source-of-truth §1.5 item 4 устанавливает жёсткий prerequisite: FP-rate на production corpus ≤ 20% для включения в Option D.

## Root Cause

Verdict-word regex `рекомендую|recommend|use |pick |ADOPT|REJECT|DEFER|BUILD|should|лучше|выбираем` designed для detection decision-acts в этом project's специфическом technical context. Слова `use`, `pick`, `should`, `BUILD` — extremely high-frequency в technical discourse (`use jq to extract`, `git cherry-pick`, `CI should now pass`, `BUILD areas closed`) без связи с genuine recommendation acts. Narrow-B AND-condition (short + no-tool + verdict-word) не устраняет FP достаточно: короткие no-tool turns с техническими словами (`use`, `pick`) встречаются часто.

## Solution

**Verdict: FP_rate > 20% → Drop narrow-B from Option D. Option D = A+C only.**

I-phase может продолжать с `2026-05-24-recommendation-laziness-discipline.md §1.3 Option A + Option C`, не включая B-компонент. Данный benchmark закрывает blocker (§1.5 item 4 prerequisite выполнен — результат «исключить B»).

## Prevention

Для любого future attempt добавить verdict-word regex layer к recommendation-discipline hook:

1. Benchmark на production corpus ДО I-phase commit (этот патч = template для future revisions).
2. Prioritize precision-focused words (слова, редкие в техническом тексте): `рекомендую`, `выбираем`, `лучше всего` — не generic `should`/`use`/`BUILD`.
3. Consider **lemma-based matching** вместо substring: `should` без контекста → FP; `we should adopt X` с субъектом и объектом → TP. Требует NLP, что нарушает no-paid-LLM-in-CI; feasible как post-turn offline analysis.
4. **Двухуровневый подход:** (a) narrow dict (только `рекомендую`, `выбираем`) для low-FP gate; (b) broad dict (весь regex) для logging only. Не шипать broad dict как gate.

## Tags

`#fp-rate-measurement` `#narrow-b-falsified` `#verdict-word-regex-overmatching` `#production-corpus-vs-constructed-sample` `#option-d-scope-change`

---

## See also

- [docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-discipline.md §1.3, §1.5 item 4](2026-05-24-recommendation-laziness-discipline.md) — source-of-truth: regex (строка 187), 20% threshold, falsifier
- [docs/meta-factory/research-patches/2026-05-24-recommendation-laziness-amend.md](2026-05-24-recommendation-laziness-amend.md) — PR #207 amend (frozen)
- [.claude/orchestrator-prompts/narrow-b-benchmark/kickoff.md](.claude/orchestrator-prompts/narrow-b-benchmark/kickoff.md) — kickoff для этого R-phase
