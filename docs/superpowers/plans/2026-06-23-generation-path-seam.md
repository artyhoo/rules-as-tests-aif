# Generation-path seam (Option A+B / i-2) Implementation Plan

> **✅ UN-GATED — операторский GO (Art, 2026-06-23): Option A+B, под-развилка i-2.** Реализация разрешена как
> capability-commit через `staging` + Phase -1 cold-review. Решение в
> [`research-patches/2026-06-23-generation-paths-comparison.md §4`](../../meta-factory/research-patches/2026-06-23-generation-paths-comparison.md).
> **Прошёл Phase -1 cold-review (2026-06-23, 1 REVISE применён):** Task 3 теперь зеркалит ПОЛНУЮ declarative-врезку
> `synthesize.ts:83-107` (не только `compileDeclarativeMd`) — иначе L4 schema-гейт отвергал бы правило и roundtrip
> становился `skip` (инвертированный красный→зелёный). Тесты — через реальный `rn-research-plan.json` + стаб.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `synthesizeGenerate` (путь B, recipe-less, `generate.ts:15`) для forbid-выразимого кандидата эмитит **полное** declarative-правило (как курированный `synthesize.ts:83-107`), чтобы forbid-класс выхода B наследовал исполняемый L4-roundtrip + анти-пустышку + S5 — закрывая **тихий** зазор «manual проходит L4 с `ok=true` без проверки».

**Architecture:** В `synthesizeGenerate` добавить declarative-ветку, зеркало `synthesize.ts:83-107`: для forbid-кандидата собрать `check={type:'declarative', presence:'forbid', selector, message, engine}`, прикрепить `negative-test`, `mdFragments.push(compileDeclarativeMd(rule))`, и для `engine='eslint-restricted'` влить `{'no-restricted-syntax':['error',{selector,message}]}` в `eslintConfigSnippet`. **Прецедент:** `synthesizeLive` (`menu-pick.ts:58`) уже зовёт `compileDeclarativeMd`; `generate.ts` — НЕ зовёт (grep=0), эту ветку и добавляем. Ноль изменений в логике L4/L5 (инвариант `generate.ts:8`).

**Sub-decision i-2 (RESOLVED 2026-06-23):** LLM МОЖЕТ предлагать `selector` (релакс инварианта `generate-port.ts:17` «never an invented selector» — но ТОЛЬКО для forbid-под-класса), потому что предложенный селектор обязан пройти declarative-компилятор + L4 roundtrip + анти-пустышку — авторство валидируется исполняемо. Остаточный genuine-plugin `manual` (under-case ii) не компилируется — Task 5 делает его видимым.

**Целевой дефект (independent cross-check 2026-06-23):** зазор **тихий** — `validate().ok=true`, даже когда часть правил `manual` (доказано `generate.test.ts` (a): R14/R15 manual, план ПРИНЯТ). Task 1-4 переводят forbid-под-класс в `declarative` (исполняемо валидируется); Task 5 делает остаточный `manual` видимым.

**Tech Stack:** TypeScript (Node ESM, `.ts`-импорты), Vitest, ESLint `Linter.verify` + `@typescript-eslint/parser` (gate-rule-tester harness), AJV (schema-гейты).

## Global Constraints

- Ноль платного LLM в CI — генерация только через DI-порт `GenerateClient` со stub-клиентом в тестах ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)).
- L4 **логику гейтов** не менять (байт-идентичность валидации, `generate.ts:8`). Task 5 добавляет в отчёт read-only счётчик — логику `ok` не трогает (см. Task 5 scope-note).
- Каждый новый forbid-кандидат — парная good/bad фикстура + `negative-test` (принцип 02; declarative БЕЗ negative-test отвергается `gate-rule-tester` + `gate-schema`).
- Capability-commit несёт `Prior-art:` трейлер на research-patch §3.
- Base = `staging`; стадия = свой PR; Phase -1 cold-review до мёржа.

**Эталон формы (verified `origin/staging`):** курированный declarative-рецепт `recipes/test-only-forbid-declarative.json` —
`check:{type:'declarative', engine:'eslint-restricted', selector, message, presence:'forbid'}`,
`negative-test:{input:[...bad...], 'expect-violation':'no-restricted-syntax'}`. Task 1-3 повторяют ровно эту форму.

---

### Task 1: Расширить контракт selection пути B forbid-сигналом (полная форма)

**Files:**
- Read: `packages/core/synthesizer/generate-port.ts` (`GenerateCandidate` `:14-32`) · `types.ts` (`ManifestCheck` declarative `:13-20` — `presence:'forbid'` **обязателен**, `types.ts:19`) · `synthesize.ts:83-107` (эталон врезки) · `recipes/test-only-forbid-declarative.json` (эталон формы).
- Modify: `packages/core/synthesizer/generate-port.ts` — в `GenerateCandidate` добавить forbid-поля.

**Interfaces:**
- Produces: `GenerateCandidate` несёт опц. `presence?: 'forbid'`, `selector?: string`, `message?: string`, `engine?: 'eslint-restricted' | 'ast-grep'`. `negativeTest` УЖЕ есть в контракте (`generate-port.ts:27-31` — JSDoc + field) — для forbid-кандидата он **обязателен** (declarative без него отвергается). Имена `selector`/`message`/`engine`/`presence` — из `types.ts:13-20`, не синонимы.

- [ ] **Step 1: Прочитать файлы выше; подтвердить, что `presence:'forbid'` в declarative-варианте — mandatory** (`types.ts:19`). Это причина, почему Task 3 ставит `presence` явно.
- [ ] **Step 2:** Добавить 4 опц. поля в `GenerateCandidate` (back-compat: существующие eslint/manual кандидаты без них валидны).
- [ ] **Step 3: Commit**

```bash
git add packages/core/synthesizer/generate-port.ts
git commit -m "feat(synthesizer): forbid-signal fields on GenerateCandidate (seam i-2 Task 1)

Prior-art: 2026-06-23-generation-paths-comparison.md §4 (Option A+B, i-2)."
```

---

### Task 2: Failing-тест — forbid-кандидат пути B даёт declarative-правило, L4 принимает

**Files:**
- Modify: `packages/core/synthesizer/generate-stubs.ts` — добавить `stubGenerateForbid` (зеркало `stubGenerateRN`, но один кандидат с forbid-сигналом).
- Test: `packages/core/synthesizer/generate.test.ts` (добавить case; использовать существующие `rnPlan` fixture-loader `:21-23` + `Linter` harness — НЕ выдуманный `makeResearchPlan`).

**Interfaces:**
- Consumes: `synthesizeGenerate(plan, client)` (`generate.ts:15`); `validate` (`../validator/validate.ts`).
- Produces: `stubGenerateForbid` возвращает `{rules:[{ entryId:'rn-web-globals', ruleId:'no-foo', title, stack, presence:'forbid', selector:"CallExpression[callee.name='foo']", message:'foo banned', examples:{bad:'foo()', good:'bar()'}, negativeTest:{ input:['foo()'], 'expect-violation':'no-restricted-syntax' } }]}`.
  - **`entryId` MUST be one of the four ids in `fixtures/rn-research-plan.json` — `rn-web-globals` / `rn-styles` / `rn-a11y` / `rn-list-perf`** (here: `rn-web-globals`). `synthesizeGenerate` skips any candidate whose `entryId` is absent from `plan.patterns` (`generate.ts:42-43` `if (!entry) continue`) → `plan.rules` empty → `plan.rules[0]` `undefined` → the test throws on `rule.check` (wrong-reason red, not the intended manual→declarative red). The forbid rule's semantics need not match the entry — the stub only exercises the declarative seam.

- [ ] **Step 1: Добавить `stubGenerateForbid` в `generate-stubs.ts`** (форма выше; тип `GenerateClient`).
- [ ] **Step 2: Написать падающий тест в `generate.test.ts`**

```ts
it('(d) stubGenerateForbid: forbid candidate → declarative rule, L4 accepts + roundtrips', async () => {
  const plan = await synthesizeGenerate(rnPlan, stubGenerateForbid);
  const rule = plan.rules[0];
  expect(rule.check.type).toBe('declarative');
  expect(rule.check).toMatchObject({ presence: 'forbid', selector: "CallExpression[callee.name='foo']" });
  const report = validate(plan);
  expect(report.ok).toBe(true);                       // полное declarative-правило проходит L4
  expect(report.gates.ruleTester.status).toBe('pass');         // declarative roundtrip RAN and PASSED — see note
  expect(report.gates.singleTokenDiff.status).toBe('pass');    // declarative anti-vacuity cluster activated (n/a→pass)
  expect(report.gates.messageIdCoverage.status).toBe('pass');  // declared message reachable
});
```

> **Why `.toBe('pass')` not `.not.toBe('skip')` (cold-review round 1 anti-vacuity fix):** `runRuleTesterGate` only ever returns `'n/a'` / `'pass'` / `'fail'` (`gate-rule-tester.ts:131-149`); `'skip'` is emitted ONLY by the `validate()` orchestrator when the schema gate fails (`validate.ts:16,24`). So `.not.toBe('skip')` passes in every non-schema-fail case — including the un-fixed-bug case where the candidate stays `manual` → zero eslint/declarative rules → `ruleTester==='n/a'` (still `!== 'skip'`). It does **not** prove the declarative rule was roundtripped. `.toBe('pass')` does: it can only hold when a declarative/eslint rule is present AND its `negative-test` fired AND `examples.good` was clean. The `singleTokenDiff`/`messageIdCoverage` `=== 'pass'` lines prove the declarative-only anti-vacuity gates flipped `n/a`→`pass` (they are `n/a` when no declarative rule exists), i.e. the rule really took the declarative branch.

- [ ] **Step 3: Прогнать — убедиться, что падает**

Run: `cd packages/core && npx vitest run synthesizer/generate.test.ts -t 'stubGenerateForbid'`
Expected: FAIL — текущий `generate.ts` эмитит `manual` (нет presence-ветки) → первый ассерт `check.type==='declarative'` ложен (vitest стопает на нём; красный именно тут).

---

### Task 3: Реализация declarative-ветки в `synthesizeGenerate` (полное зеркало `synthesize.ts:83-107`)

**Files:**
- Modify: `packages/core/synthesizer/generate.ts` (`check`-тернар `:51-56` → 3-way if/else; negative-test+md+merge region `:67-83`); добавить `import { compileDeclarativeMd } from './compile-declarative-md.ts';`

**Interfaces:**
- Consumes: forbid-поля (Task 1); `compileDeclarativeMd`; `mergeEslintRuleConfig` (уже импортирован `generate.ts:11`).
- Produces: для `candidate.presence==='forbid' && candidate.selector` — полное declarative-правило.

- [ ] **Step 1: Ветка построения `check`** (перед текущей eslint/manual):

```ts
let check: ManifestCheck;
if (candidate.presence === 'forbid' && candidate.selector) {
  check = {
    type: 'declarative', presence: 'forbid',
    selector: candidate.selector,
    message: candidate.message ?? 'forbidden construct',
    engine: candidate.engine ?? 'eslint-restricted',
  };
} else if (hasEslintConfig) {
  check = { type: 'eslint', rule: candidate.ruleId };
} else {
  // VERBATIM the existing manual rationale (generate.ts:54-55) — do NOT shorten it
  // (a reworded string is a silent behaviour drift even though no test asserts it today).
  check = {
    type: 'manual',
    rationale: `Plugin rule '${candidate.ruleId}' — L4 harness KNOWN_PLUGINS only registers rules-as-tests; roundtrip not supported for this rule`,
  };
}
```

> The condition order matters: the forbid branch must come FIRST so a forbid-expressible candidate is routed to `declarative` even if it also happened to carry an `eslintConfig`. The `eslint`/`manual` branches keep their current behaviour byte-for-byte.

- [ ] **Step 2: После сборки `rule` — negative-test + md + merge, тремя ветками** (зеркало `synthesize.ts:83-107`).

**Binding (cold-review round 1 MAJOR — no dropped behaviour):** the existing `generate.ts` does the md-push **unconditionally** for every rule (`:72-74`, incl. `manual` → `**Check:** Manual review`) and attaches the eslint `negative-test` at `:67-69`. The restructure MUST preserve BOTH: the `manual` branch keeps its one-line md fragment, and the `eslint` branch keeps its `negative-test` attachment. Only the `declarative` branch is new.

```ts
// negative-test: BOTH declarative and eslint require it (gate-schema.ts:22-32). Mirrors :67-69, widened.
if (candidate.negativeTest && (check.type === 'declarative' || check.type === 'eslint')) {
  rule['negative-test'] = candidate.negativeTest;
}

rules.push(rule);

// md fragment: declarative → compiled; eslint/manual → existing one-liner (UNCHANGED from :72-74)
if (check.type === 'declarative') {
  mdFragments.push(compileDeclarativeMd(rule));
} else {
  mdFragments.push(
    `## ${id} — ${candidate.title}\n\n**Check:** ${hasEslintConfig ? `\`${candidate.ruleId}\`` : 'Manual review'}\n`,
  );
}

// eslint config merge: declarative → no-restricted-syntax(selector,message); eslint → candidate.eslintConfig (UNCHANGED from :76-83)
if (check.type === 'declarative' && (!check.engine || check.engine === 'eslint-restricted')) {
  const selectorEntry: Record<string, string> = { selector: check.selector };
  if (check.message) selectorEntry.message = check.message;
  mergeEslintRuleConfig(
    mergedEslintConfig,
    { 'no-restricted-syntax': ['error', selectorEntry] } as Record<string, unknown>,
    candidate.ruleId, ruleSources,
  );
} else if (hasEslintConfig && candidate.eslintConfig) {
  mergeEslintRuleConfig(mergedEslintConfig, candidate.eslintConfig, candidate.ruleId, ruleSources);
}
```

> Narrow on the local `check` (a `let`, assigned once in Step 1, never reassigned) — TS control-flow narrowing then gives `check.selector` (mandatory) / `check.message` / `check.engine` inside the `declarative` block. `compileDeclarativeMd(rule)` takes the full `SynthesizedRule` and itself throws if `check.type !== 'declarative'` (`compile-declarative-md.ts:7-11`), so the guard order is required. This replaces the **whole** existing region `:67-83` (the `:67-69` negative-test block, the `:72-74` md push, and the `:76-83` merge) — do not leave the old unconditional statements in place, or md/negative-test would double-emit.

- [ ] **Step 3: Прогнать Task 2 — теперь зелёный**

Run: `cd packages/core && npx vitest run synthesizer/generate.test.ts -t 'stubGenerateForbid'`
Expected: PASS (`check.type==='declarative'`, `report.ok===true`, `ruleTester !== 'skip'`).

- [ ] **Step 4: Commit**

```bash
git add packages/core/synthesizer/generate.ts packages/core/synthesizer/generate-stubs.ts packages/core/synthesizer/generate.test.ts
git commit -m "feat(synthesizer): route B forbid-class output through full declarative compile (L4 roundtrip)

Prior-art: 2026-06-23-generation-paths-comparison.md §3 (deterministic-first + LLM-fallback, ADOPT VOCABULARY)."
```

---

### Task 4: Регресс — curated пути не сломаны, снапшоты не дрейфят

**Files:**
- Run-only (никаких новых файлов).

- [ ] **Step 1: Полный прогон synthesizer + validator**

Run: `cd packages/core && npx vitest run synthesizer/ validator/`
Expected: PASS — существующие `generate.test.ts` (a/b/c), `synthesize.test.ts`, snapshot-тесты зелёные (forbid-ветка — новый вход, curated не трогает).

- [ ] **Step 2: self-audit (curated стеки байт-идентичны)**

Run: `make self-audit` (или эквивалент из репо)
Expected: Next/react-spa/react-native curated paths байт-идентичны — регрессии нет.

---

### Task 5: Сделать остаточный `manual` видимым в отчёте L4 (under-case ii, тихий-пропуск)

**Files:**
- Modify: `packages/core/validator/validate.ts` (`:40-51` — the returned report object; `ok` computed `:31-38` stays untouched) · `packages/core/validator/types.ts` (`ValidationReport` `:18-29` — add **required** `manualCount: number` + `manualRuleIds: string[]`).
- Test: `packages/core/validator/validate.test.ts` — add imports `synthesizeGenerate` (`../synthesizer/generate.ts`) + `stubGenerateRN` (`../synthesizer/generate-stubs.ts`) + load the `rn-research-plan.json` fixture (mirror `generate.test.ts:18-24`; from `validator/` the fixtures path is `../synthesizer/fixtures`). `ResearchPlan` is already imported (`validate.test.ts:4`).
- **Test (TS-break, cold-review round 1 `tsc --noEmit` finding):** `packages/core/validator/to-aif-gate-result.test.ts` hand-builds two `ValidationReport` literals — `PASS_REPORT` (`:7`) and `FAIL_REPORT` (`:20`). Making the two new fields **required** breaks both with `TS2739: missing the following properties … manualCount, manualRuleIds`. Add `manualCount: 0, manualRuleIds: []` to BOTH literals. (Verified: a draft `tsc --noEmit` reds exactly these 2 sites and goes green once both are patched.)
- Regenerate: **9** snapshots — **8** under `packages/core/validator/expected-*-validate.json` + **1** under `packages/core/installer/expected-self-install.json` (installer snapshot embeds the full `ValidationReport` — см. scope-note).

**Interfaces:**
- Produces: `report.manualCount: number` + `report.manualRuleIds: string[]` — **required** (consistent with the required `gates` field; `validate()` always sets them). Аддитивно; `ok` НЕ меняется.

> **Required vs optional (decided):** the fields are **required** — `validate()` is the only producer and always emits them, so a required contract is the honest one and matches `gates`. The cost is the two `to-aif-gate-result.test.ts` literals above. (Making them `?optional` would avoid that 2-line edit but invites `report.manualCount ?? 0` defensive reads at every future site; rejected.)

**Scope-note (binding):** three test files do `expect(report).toEqual(expected)` / embed the full report — adding report keys breaks **9 snapshot tests across 3 files** (cold-review round 2 finding; the round-1 draft missed the installer one because it ran only `synthesizer/ validator/`):
- `validator/snapshot.test.ts:53,60` → `expected-self-validate.json`, `expected-fixture-validate.json` (2).
- `validator/snapshot.adversarial.test.ts` → `expected-adv-{autofix-clean,message-id-coverage,never-firing,single-token-diff,snippet-drop,tautology}-validate.json` (6).
- `installer/snapshot.test.ts:61-62,82` → `deterministicShape` copies the **whole** `report.preValidation`/`postValidation` into the compared object → `expected-self-install.json` (1).

All **9** must be **осознанно перегенерены** in this PR: `npx vitest run validator/snapshot installer/snapshot -u`, then eyeball the diff is purely the two additive keys (`manualCount`/`manualRuleIds`) nested in `preValidation`/`postValidation` for the installer one. **Verified by a full draft run:** isolating those 3 files gives exactly `9 failed | 1 passed` (the 1 pass = the `.toBe()` test at `snapshot.test.ts:69`). The full-suite draft also flagged 4 unrelated `hooks/`-`principles/` shell-exec tests (`priority-score-synthetic`, `done-md-completion-filter`, `20-bundle-classification`) — those **pass in isolation** (41/41) and are known to flake under parallel load (`project_generator_forbid_mvp_state.md` lesson); they are NOT this change's regressions — do not chase them. Если оператор хочет «L4 вообще не трогать» — Task 5 выносится в отдельный PR; **Task 1-4 самодостаточны без него** (forbid-под-класс уже закрыт).

- [ ] **Step 1: Failing-тест** — на РЕАЛЬНОМ проверенном плане, НЕ на ручном `planWith`

> **Why not a hand-built plan (cold-review round 1 BLOCKER):** the originally-sketched `planWith([{id:'R1',…},{id:'R2',…}])` is triple-broken against `origin/staging`: (1) `planWith` helper does not exist in `validate.test.ts` (only a `plan()` builder that returns a `ResearchPlan`); (2) rule ids `R1`/`R2` violate `synthesis-plan.schema.json:77` `"pattern":"^G[0-9]+$"`; (3) the rule objects omit `title`/`stack`/`examples`/`research` (all `required` per schema `:75`) and the eslint rule has no `negative-test` (mandatory for `eslint`/`declarative` per `gate-schema.ts:22-32`). Any of these makes the schema gate `fail` → `validate()` sets `ok=false` → `expect(report.ok).toBe(true)` inverts (wrong-reason red). Fix: reuse the proven `synthesizeGenerate(rnPlan, stubGenerateRN)` plan, which is schema-valid (`G#` ids, eslint rules carry `negative-test`) and whose `validate().ok===true` is already proven by `generate.test.ts` test (a). `stubGenerateRN` emits G1/G4 as `eslint` and **G2 (rn-styles) + G3 (rn-a11y) as `manual`** (`generate-stubs.ts:50-73`).

```ts
it('reports manual rule count without failing ok', async () => {
  const plan = await synthesizeGenerate(rnPlan, stubGenerateRN);
  const report = validate(plan);
  expect(report.ok).toBe(true);                  // manual rules do NOT flip ok (the silent-pass fact)
  expect(report.manualCount).toBe(2);            // G2 (rn-styles) + G3 (rn-a11y)
  expect(report.manualRuleIds).toEqual(['G2', 'G3']);   // rule ids, in plan order
});
```

- [ ] **Step 2: Прогнать — падает** (`manualCount` undefined → `expect(report.manualCount).toBe(2)` FAIL; `ok` уже true, так что красный именно на новом поле). Run: `cd packages/core && npx vitest run validator/validate.test.ts -t 'manual rule count'` → FAIL.
- [ ] **Step 3: Реализация** — в `validate.ts` (return-объект `:40-51`) добавить `manualCount: manualRules.length` и `manualRuleIds: manualRules.map(r => r.id)` где `const manualRules = plan.rules.filter(r => r.check.type === 'manual')`; расширить `ValidationReport` в `types.ts` (`:18-29`) двумя **required** полями. Блок вычисления `ok` (`:31-38`) НЕ трогать. Затем сразу пропатчить `to-aif-gate-result.test.ts` `PASS_REPORT`/`FAIL_REPORT` (`+manualCount: 0, manualRuleIds: []`) — иначе `tsc --noEmit` reds (TS2739). Прогнать `npx tsc --noEmit` → 0 ошибок.
- [ ] **Step 4: Перегенерить 9 снапшотов осознанно** — `npx vitest run validator/snapshot installer/snapshot -u`; убедиться `git diff` = только два аддитивных ключа (`manualCount`/`manualRuleIds`), в installer-снапшоте они вложены в `preValidation`/`postValidation`. Затем **полный** `npx vitest run` (NOT just `synthesizer/ validator/` — that scope misses `installer/snapshot.test.ts`) должен быть зелёным, кроме известно-флакающих shell-тестов (`priority-score-synthetic`/`done-md-completion-filter`/`20-bundle-classification` — если краснеют, перепрогнать их в изоляции: `npx vitest run hooks/priority-score-synthetic.test.ts hooks/done-md-completion-filter.test.ts principles/20-bundle-classification.test.ts` → должны быть зелёными).
- [ ] **Step 5: Commit**

```bash
git add packages/core/validator/ packages/core/installer/expected-self-install.json
git commit -m "feat(validator): surface manual-rule count in L4 report (close silent manual-bypass)

Prior-art: 2026-06-23-generation-paths-comparison.md §2 (safety axis — silent manual pass)."
```

---

## Self-Review

1. **Spec coverage:** i-2 = «B forbid-выразимое → ПОЛНЫЙ declarative (presence+negative-test+no-restricted-syntax), иначе eslint/manual; остаточный manual виден». Task 3 (полная врезка) + Task 4 (регресс) + Task 5 (видимость). ✓
2. **Placeholder scan:** код в шагах — реальный, зеркало `synthesize.ts:83-107`; форма стаба — из `generate-stubs.ts` + `test-only-forbid-declarative.json`. ✓
3. **Type consistency:** `check` несёт **mandatory** `presence:'forbid'` (`types.ts:19`); `negative-test.expect-violation:'no-restricted-syntax'`; имена из `types.ts`/эталон-рецепта. ✓
4. **Cold-review round 0 fixes (2026-06-23):** (a) presence добавлен (был пропущен → TS-ошибка); (b) negative-test + no-restricted-syntax-врезка добавлены (без них L4 schema-гейт → `ok=false` → roundtrip `skip` → инвертированный красный→зелёный); (c) тест на реальном `rnPlan`+стаб (не `makeResearchPlan`); (d) Task 5 перечисляет 8 снапшотов + `toEqual`; (e) цитаты `generate.ts:15`, check-тернар `:51-56`.
5. **Cold-review round 1 fixes (2026-06-23, this session):**
   - **[BLOCKER] Task 5 test** rebuilt on the proven `synthesizeGenerate(rnPlan, stubGenerateRN)` plan — the sketched `planWith([{id:'R1'…}])` was triple-broken (no `planWith` helper; ids violate schema `^G[0-9]+$` `synthesis-plan.schema.json:77`; incomplete rules + eslint-without-`negative-test` → schema-fail → `ok=false` → inverted red). New assertions: `manualCount===2`, `manualRuleIds===['G2','G3']`.
   - **[MAJOR] Task 2 stub `entryId`** pinned to a real `rn-research-plan.json` id (`rn-web-globals`) — else `generate.ts:42-43` skips it → `plan.rules[0]` undefined → wrong-reason red.
   - **[MAJOR] Task 2 assertion** `.not.toBe('skip')` → `.toBe('pass')` (+ `singleTokenDiff`/`messageIdCoverage` `=== 'pass'`); `'skip'` is never returned by `runRuleTesterGate` so the old assertion was vacuous and passed even when the rule stayed `manual` (`n/a`).
   - **[MAJOR] Task 3 Step 2** restructure made explicit: preserves the `manual` md fragment (existing unconditional `:72-74`) and the eslint `negative-test` attachment (`:67-69`) — only the `declarative` branch is new; nothing dropped/double-emitted.
   - **[MINOR] Task 3 Step 1** keeps the manual rationale string VERBATIM (`…— L4 harness KNOWN_PLUGINS only registers rules-as-tests; roundtrip not supported for this rule`), not a shortened rewrite.
   - **[MINOR] Citations** corrected against `origin/staging`: `synthesize.ts:83-107`, `GenerateCandidate :14-32`, `ManifestCheck declarative :13-20`, check-тернар `:51-56`, region `:67-83`, `validate.ts:40-51`/`:31-38`, `ValidationReport :18-29`.
6. **Draft `tsc --noEmit` + vitest validation (2026-06-23, this session — rolled back):** the full scaffold (Tasks 1/2/3/5 type-bearing code + both new tests) was applied to a throwaway draft and compiled:
   - `tsc --noEmit` initially reded `to-aif-gate-result.test.ts:7,20` (TS2739 — two `ValidationReport` literals missing the new required fields). **This is a plan gap rounds 0–1 missed**; Task 5 now lists that file. After patching the two literals, `tsc --noEmit` → **exit 0, 0 errors**.
   - `vitest run synthesizer/generate.test.ts -t 'stubGenerateForbid'` → **1 passed** (forbid → declarative, `ok===true`, ruleTester/singleTokenDiff/messageIdCoverage all `'pass'` — confirms `foo()`/`bar()` clears every L4 gate).
   - `vitest run validator/validate.test.ts -t 'manual rule count'` → **1 passed** (`manualCount===2`, `manualRuleIds===['G2','G3']`).
   - `vitest run synthesizer/ validator/` (pre-snapshot-regen) → 8 validator snapshot `toEqual` breaks. **This scoped run was itself a mistake** — it missed `installer/`. The corrected **full** `npx vitest run` (round-2, validator-change-only micro-draft) reds **9 snapshot tests across 3 files** (validator/snapshot 2 + validator/snapshot.adversarial 6 + installer/snapshot 1), confirmed by isolating those 3 files → `9 failed | 1 passed`. The 4 extra full-suite reds (`priority-score-synthetic`/`done-md-completion-filter`/`20-bundle-classification`) **pass 41/41 in isolation** = known parallel-load shell flake, not regressions. Draft reverted; Phase 2 re-implements under TDD per task.
7. **Cold-review round 2 fix (2026-06-23, this session):** **[MAJOR]** snapshot blast radius corrected `8 → 9` — added `installer/expected-self-install.json` (`installer/snapshot.test.ts` embeds the full `ValidationReport` via `preValidation`/`postValidation`), widened Task 5's regen / green-run / `git add` to include `installer/`, and recorded the known-flaky shell tests so the implementer doesn't chase phantom reds. **[MINOR]** `generate-port.ts` `negativeTest` citation `:25-31 → :27-31`.
8. **Phase 1 hardening: 4 cold-review rounds total (round 0 prior; rounds 1–3 this session, fresh reviewer each) + 1 draft `tsc --noEmit` (exit 0) + 2 draft vitest runs (true blast radius = 9 snapshots / 3 files, isolated-confirmed `9 failed | 1 passed`); last cold-review (round 3) returned GO, zero BLOCKER/MAJOR, on 2026-06-23 against `origin/staging` @ `9f1bf5168`.**

## Execution Handoff

**Только на хосте** (в Cowork-песочнице vitest не идёт: Linux vs macOS-нативные `node_modules`/`rolldown`). Тогда: изоляция `superpowers:using-git-worktrees` → исполнение `superpowers:subagent-driven-development` (fresh subagent на задачу + ревью между) или `superpowers:executing-plans` (inline с чекпойнтами). Перед мёржем — Phase -1 cold-review диффа (T19: CI ≠ design-review).
