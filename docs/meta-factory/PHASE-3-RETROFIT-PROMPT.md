# Phase 3 Retrofit Delegation Prompt — AIF positioning alignment

> **Назначение:** self-contained prompt для orchestrator сессии. Закрыть 3 MAJOR findings из reviewer verdict 2026-05-08 + применить Step 0 gate из EXECUTION-PLAN §5.5 к Phase 3 in-flight артефактам.
> **Версия:** 0.1.0 — 2026-05-08
> **Triggered by:** reviewer Mode 3 verdict (2026-05-08), Path 1 «plug-in для AIF» решение пользователя

---

## Identity & Context

**Repo:** `/Users/art/code/rules-as-tests-aif`
**Branch:** `main` (после PR #2 merge + commit `0f8b8ee` strategic alignment)
**Working tree:** clean
**Last commit:** `0f8b8ee docs(meta-factory): post-AIF-comparison strategic alignment`
**You are:** Opus orchestrator, **NOT reviewer**. Делаешь edits + commits.

## Обязательное чтение перед стартом

1. [aif-comparison.md](aif-comparison.md) — особенно §9 reuse matrix + §10 confirmed differentiators
2. [open-questions.md](open-questions.md) §13.6 — verified hypothesis
3. [EXECUTION-PLAN.md](EXECUTION-PLAN.md) §5.5 — Step 0 gate (только что добавлено)
4. [PROPOSAL.md](PROPOSAL.md) §1.4 — strategic positioning
5. Memory feedback: `feedback_external_docs_via_context7.md` — context7-only constraint

---

## Task 1 — Close 3 MAJOR (~35 min, single docs commit)

### MAJOR-1: «two-AI review» terminology fix в 4 местах

Convention atop AIF infrastructure, не uniquely ours. Заменить термин с указанием AIF source.

**Edit 1.1 — `docs/meta-factory/PROPOSAL.md:48`**

Old:
```
Пакет ест свой собственный собачий корм на этапе генерации: его принципы (5 layers, AST > grep, paired negative tests, mutation testing, two-AI review) применяются к LLM-output как фильтр.
```

New:
```
Пакет ест свой собственный собачий корм на этапе генерации: его принципы (5 layers, AST > grep, paired negative tests, mutation testing, two-AI review via AIF `review-sidecar`) применяются к LLM-output как фильтр.
```

**Edit 1.2 — `docs/meta-factory/architecture.md:29`**

Old (table cell):
```
| Принципы | 5 layers framework, AST > grep, paired negative tests, mutation testing, two-AI review | Это сам тезис; если генерировать — теряется опора |
```

New:
```
| Принципы | 5 layers framework, AST > grep, paired negative tests, mutation testing, two-AI review (via AIF `review-sidecar` with `model: opus` override) | Это сам тезис; если генерировать — теряется опора |
```

**Edit 1.3 — `docs/meta-factory/risks.md:18`**

Old:
```
| Сгенерированный AST-код с багами (Path B) | Matrix tests на edge cases, mutation testing, two-AI review, human review checkpoint |
```

New:
```
| Сгенерированный AST-код с багами (Path B) | Matrix tests на edge cases, mutation testing, two-AI review via AIF `review-sidecar`, human review checkpoint |
```

**Edit 1.4 — `docs/meta-factory/EXECUTION-PLAN.md:500`**

Old:
```
- Two-AI review → ai-rulesmith pattern; дорогая верификация, только после merge, не блокирует
```

New:
```
- Two-AI review → AIF `review-sidecar` с `model: opus` override (anti-bias convention поверх AIF infrastructure); дорогая верификация, только после merge, не блокирует
```

### MAJOR-2: Add AIF coupling risks в PROPOSAL.md §11

`PROPOSAL.md` §11 — pointer на `risks.md`. Реальный risks list — в `risks.md`. Добавить новые риски в `risks.md` table (после line 22):

**Edit 2.1 — `docs/meta-factory/risks.md` (append after existing rows ~line 22)**

Add 4 new rows к таблице рисков:

```markdown
| AIF major version breaking changes (v3+) | Pin AIF version в peerDependencies + semver compat tests; migration path Phase 11 |
| AIF adoption / discontinuation | Rule corpus + manifest остаётся usable standalone; runtime layer migration cost ~2-4 weeks |
| AIF API contract changes (`aif-gate-result` schema, skill-context format) | Schema validation в CI на reuse points; subscribe AIF release notes |
| Identity dilution от «plug-in» позиционирования | Marketing positioning: «logical self-application layer» — unique value prop через mutation testing для meta-tests + manifest-as-SSOT (не workflow runtime) |
```

### MAJOR-3: Phase 4-9 pointer на §5.5 gate в EXECUTION-PLAN

Phase 4-9 descriptions всё ещё содержат «build everything» планы. Add explicit pointer без full rewrite (full rewrite — на Phase entry времени).

**Edit 3.1 — `docs/meta-factory/EXECUTION-PLAN.md` (insert после §5.5 close, перед `## 6. План фаз`)**

Insert block после `**Phase 0.5 — 2** этому gate'у не предшествовали...` строки (около line 208):

```markdown

> **Phase 4-9 caveat (2026-05-08):** descriptions ниже написаны до AIF analysis 2026-05-08. После решения «plug-in для AIF» (PROPOSAL §1.4) — significant reuse expected: ~30-40% capability через AIF skills. Конкретные reuse decisions per Phase **обязаны** проходить Step 0 gate (см. §5.5) до драфта phase prompt. См. [aif-comparison.md §9 reuse matrix](aif-comparison.md). Текущие Phase descriptions — upper-bound build estimates; реальный scope сужается на Phase entry.
```

---

## Task 2 — Apply Step 0 gate к Phase 3 in-flight артефактам

Phase 3 (monorepo split) уже merged через PR #2 — но без Step 0 research перед split decision. Retroactive validation:

**Step 0 research для Phase 3 capabilities:**

Capability areas Phase 3 split покрыл:
1. NPM workspaces structure
2. Cross-package test execution
3. Build orchestration
4. Version management for monorepo

**Required:**
1. `mcp__context7__resolve-library-id` для каждой capability
2. Найти top alternatives: `nx`, `turborepo`, `pnpm workspaces`, `lerna`, `changesets`
3. `mcp__context7__query-docs` со specific queries — **3 phrasings минимум** если результат пустой
4. Build matrix `{capability} × {existing solution} × {convergent design}`
5. **Output:** `docs/meta-factory/phase-3-research.md` (≤200 строк, transient)

**Decision after matrix:**
- Если все capabilities покрыты текущей npm workspaces structure → no retrofit needed, **document rationale**
- Если significant alternative покрывает уже сделанное → flag в retro как «could have used X», но not breaking change
- Если **fundamental gap** обнаружен (e.g., Phase 3 split missed critical capability) → orchestrator decision: revert + redo или patch in place

**Hard constraint:** Step 0 research **не должен** триггерить full rebuild Phase 3. Это **paper trail** для применения §5.5 gate ретроспективно. Real impact decisions принимаются пользователем.

---

## Task 3 — Commit strategy

**Single commit для Task 1 (3 MAJOR):**

```bash
git add docs/meta-factory/PROPOSAL.md docs/meta-factory/architecture.md docs/meta-factory/risks.md docs/meta-factory/EXECUTION-PLAN.md
git commit -m "docs(meta-factory): align with plug-in-for-AIF positioning (3 MAJOR fixes)

After reviewer verdict 2026-05-08:
- MAJOR-1: terminology fix 'two-AI review' → 'via AIF review-sidecar'
  in PROPOSAL §1.2, architecture.md L0, risks.md, EXECUTION-PLAN Phase 5
- MAJOR-2: add 4 AIF coupling risks to risks.md (version, adoption, API, identity)
- MAJOR-3: Phase 4-9 caveat pointer to §5.5 Step 0 gate before drafts

Reference: aif-comparison.md §9 reuse matrix, §10 confirmed differentiators."
```

**Separate commit для Task 2:**

```bash
git add docs/meta-factory/phase-3-research.md
git commit -m "docs(phase-3): retroactive Step 0 research per EXECUTION-PLAN §5.5

Validation matrix for Phase 3 monorepo split capabilities vs
nx/turborepo/pnpm/lerna/changesets alternatives via context7.
No fundamental gap; current npm workspaces structure adequate."
```

(сообщение зависит от outcome research — если gap обнаружен, message reflects)

---

## Verification (run после edits)

```bash
# 1. Все «two-AI review» mentions имеют AIF qualifier
grep -n "two-AI review" docs/meta-factory/*.md | grep -v "AIF\|review-sidecar"
# expect: 0 lines (все четыре mention'а должны быть с AIF qualifier)

# 2. AIF coupling risks добавлены
grep -c "AIF.*version\|AIF.*adoption\|AIF.*API\|Identity dilution" docs/meta-factory/risks.md
# expect: ≥4

# 3. Phase 4-9 caveat присутствует
grep -n "Phase 4-9 caveat\|2026-05-08" docs/meta-factory/EXECUTION-PLAN.md
# expect: ≥1 match

# 4. Step 0 research file
test -f docs/meta-factory/phase-3-research.md && echo "exists" || echo "missing"
wc -l docs/meta-factory/phase-3-research.md
# expect: ≤200 lines

# 5. No new errors
make self-audit
# expect: green
```

---

## Hard constraints

- **NO `git commit --no-verify`** — нарушает self-application principle
- **NO `git push`** — orchestrator decides push timing с пользователем
- **Context7-only** для external library research (memory rule). NO `git clone` AIF/nx/turborepo etc.
- **Real edits, не draft'ы** — этот документ содержит final text, не нужно «creative interpretation»
- **Если Task 2 Step 0 research обнаружит fundamental gap** — STOP, эскалировать пользователю, не продолжать automatic retrofit

---

## Возврат результата

После всех Tasks:
1. **Created/modified files** — список с commit hashes
2. **Verification probes** — все 5 пройдены
3. **Step 0 matrix summary** — что reuse'нули, что unique, что defer
4. **Open questions для следующей orchestrator сессии** (Phase 4 entry)
5. **Time spent** vs estimate (35 min Task 1 + variable Task 2)

---

## Версия

- **0.1.0** — 2026-05-08 — initial draft, embeds reviewer verdict + Path 1 decision
