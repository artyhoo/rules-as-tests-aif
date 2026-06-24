# Generated declarative-rule delivery seam — design

> **Authoritative for:** the design of the delivery seam that makes the synthesizer's generated declarative rules (`SynthesisPlan.eslintConfigSnippet` → `.ai-factory/synthesizer-output/eslint-rules-snippet.json`) actually reach and enforce in a consumer's running ESLint flat-config, plus the guard test asserting every shipped-template `rules-as-tests/<id>` reference resolves to a barrel rule. Scope-bound to the fresh-skeleton (framework-shipped template) consumer path + the guard test below.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The synthesizer's emit/merge contract — see [`packages/core/synthesizer/`](../../../packages/core/synthesizer/). Wiring rules into a consumer's *own* (non-shipped) ESLint config — that is the R2-wirer's domain ([`wire-eslint-r2.ts`](../../../packages/core/install/wire-eslint-r2.ts), SSOT #135), an out-of-scope follow-up. Implementation steps — see the `writing-plans` output that follows this spec.

**Date:** 2026-06-24 · **Status:** design (pre-implementation) · **Branch:** `claude/adoring-darwin-2eaa45` (off `staging`); PR → `staging`

---

## 1. Problem & goal

The Layer-3 synthesizer emits generated declarative rules as a flat ESLint `rules: {}` map into `SynthesisPlan.eslintConfigSnippet` ([`synthesize.ts:96`](../../../packages/core/synthesizer/synthesize.ts)), which the Layer-5 installer writes to `<consumer>/.ai-factory/synthesizer-output/eslint-rules-snippet.json` ([`emit.ts:39`](../../../packages/core/synthesizer/emit.ts), [`install.ts:19`](../../../packages/core/installer/install.ts)).

**That file is an orphan.** Nothing merges it into the consumer's running `eslint.config.mjs`. The shipped templates ([`packages/preset-next-15-canonical/templates/eslint.config.react.mjs`](../../../packages/preset-next-15-canonical/templates/eslint.config.react.mjs), [`templates/ts-server/eslint.config.mjs`](../../../templates/ts-server/eslint.config.mjs)) statically wire handwritten AST rules (`import customRules from './eslint-rules-local/index.ts'` + named `rules-as-tests/<id>` entries) and a few static declarative rules — but the generated snippet has **no path** into the running config. `git grep eslint-rules-snippet install.sh` returns nothing in a wiring context.

**Consequence:** every generated declarative rule is framework-tested but **not consumer-enforced** — a goal violation at the consumer layer ([README.md#why-this-exists](../../../README.md#why-this-exists): every rule must be an executable artifact failing at the earliest reachable channel). The gap was *exposed* (not caused) by the R8 `require-otel-span` migration, which additionally left dangling `rules-as-tests/require-otel-span` template refs (reverted separately); this spec is the **systemic** fix.

**Goal:** a deterministic, no-paid-LLM delivery seam so generated declarative rules enforce in a fresh-skeleton consumer, proven by a paired-negative test that a synthetic generated rule actually fires (and that delivery does not clobber the template's own rules). Plus a guard test that would have caught the R8 dangling ref.

## 2. The load-bearing constraint (ESLint flat-config no-merge semantics)

The snippet is a flat `rules: {}` map. Fixture [`expected-fixture-synth.json:110`](../../../packages/core/synthesizer/expected-fixture-synth.json) shows it can contain `no-restricted-imports` (a `next/router` ban). The templates **already** carry their own `no-restricted-imports` (lodash/axios ban, [`eslint.config.react.mjs:96`](../../../packages/preset-next-15-canonical/templates/eslint.config.react.mjs)) and `no-restricted-syntax` (enum ban, [`:124`](../../../packages/preset-next-15-canonical/templates/eslint.config.react.mjs)).

**ESLint flat config does NOT merge a rule's config across config objects — the last matching config object wins and replaces.** So delivering the snippet as a *separate config block* would **clobber** the template's own `no-restricted-syntax` / `no-restricted-imports` for overlapping files. The seam therefore MUST **merge** generated entries into the template's *existing* rule arrays (selector/path concat), not layer them. This constraint is what rules out the naive "spread the snippet as a new block" approach and shapes the design.

## 3. Approach decision — load-time helper-merge (Approach 1)

**Decided:** the shipped template imports a small, static, framework-shipped helper that reads the per-consumer snippet at config-load time and exposes its pieces; the template spreads each piece into its own corresponding rule array / an additive block.

**Why (against project goals + the §2 constraint):**
- **Correct under §2** — generated `no-restricted-syntax` selectors and `no-restricted-imports` paths/patterns are concatenated into the template's *existing* arrays (one merged rule, no clobber); unique-key entries (plugin rules `rules-as-tests/*`, other built-ins) go into one additive block where collision is impossible.
- **Inherent idempotency** — the helper re-reads the snippet on every ESLint run; the running config always reflects the current snippet. No persisted edit to dedup or drift (the failure mode of any write-back approach).
- **Zero `emit()` change** — the existing JSON snippet contract is untouched → no synthesizer-snapshot churn → no collision with the in-flight `generator-require-composite-tier` umbrella work (#702–#705 edit emit/recipes).
- **No AST text-surgery** on a live config — sidesteps the entire class that produced the R8 dangling-ref crash.
- **Graceful degrade** — absent/unparseable snippet (fresh skeleton without a `synth` run) → empty pieces → templates behave exactly as today. Zero regression for the common case.

**Why not the alternatives (considered, rejected):**
- **Synth-time AST-merge (generalize the R2-wirer, SSOT #135):** `install.sh` ships the template *before* the consumer ever runs `synth`, so the merge cannot fire at install time — it needs a new post-`synth` invocation plus re-synth dedup; and it is AST text-surgery on a live config (the fragile class load-time avoids by construction). Its sole edge — wiring a consumer's *own* config — is out of v1 scope. Kept as the documented follow-up for the existing-config path.
- **Generated plugin modules (`rules-as-tests/<gid>` per rule):** generating rule *modules* (code) is exactly the G3b codegen the umbrella explicitly defers ([`s4-dispatch.md:52`](../../../.claude/orchestrator-prompts/generator-require-composite-tier/s4-dispatch.md) §OUT; [`DISPATCH-PROMPT-overnight.md:11`](../../../.claude/orchestrator-prompts/generator-require-composite-tier/DISPATCH-PROMPT-overnight.md)). Also changes the `emit()` contract with a broad snapshot blast radius.

## 4. Components

### 4.1 The generated-rules helper (new, static, shipped)

`packages/core/templates/shared/eslint-generated-rules.mjs` — a pure ESM module shipped verbatim to the consumer root. Reads the per-consumer snippet relative to its **own** location (so it is cwd-independent) and splits it:

```js
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SNIPPET = resolve(HERE, '.ai-factory/synthesizer-output/eslint-rules-snippet.json');

function load() {
  let map;
  try { map = JSON.parse(readFileSync(SNIPPET, 'utf8')); }
  catch { return { restrictedSyntax: [], restrictedImports: {}, ruleBlock: {} }; } // ENOENT / parse-error → no-op

  const restrictedSyntax = [];
  const restrictedImports = {};
  const ruleBlock = {};
  for (const [name, cfg] of Object.entries(map)) {
    if (name === 'no-restricted-syntax') {
      const [, ...entries] = Array.isArray(cfg) ? cfg : ['error']; // drop severity, keep selector objs
      restrictedSyntax.push(...entries);
    } else if (name === 'no-restricted-imports') {
      const opts = Array.isArray(cfg) ? (cfg[1] ?? {}) : {};
      if (opts.paths)    restrictedImports.paths    = [...(restrictedImports.paths    ?? []), ...opts.paths];
      if (opts.patterns) restrictedImports.patterns = [...(restrictedImports.patterns ?? []), ...opts.patterns];
    } else {
      ruleBlock[name] = cfg; // unique-key: plugin rules + other built-ins → additive block (no collision)
    }
  }
  return { restrictedSyntax, restrictedImports, ruleBlock };
}

export const generated = load();
```

Degrade is total: any read/parse failure → all-empty, so a consumer who never ran `synth` is byte-for-byte unaffected. The helper is **data plumbing only** — it never decides *which* rules exist; the synthesizer owns that.

### 4.2 Template edits (both shipped eslint configs)

Three minimal spread points in **each** template ([`eslint.config.react.mjs`](../../../packages/preset-next-15-canonical/templates/eslint.config.react.mjs) + [`templates/ts-server/eslint.config.mjs`](../../../templates/ts-server/eslint.config.mjs)):

1. **Import:** `import { generated } from './eslint-generated-rules.mjs';`
2. **`no-restricted-syntax`** (react `:124`, ts-server `:140`) — append generated selectors:
   ```js
   'no-restricted-syntax': ['error', { selector: 'TSEnumDeclaration', message: '…' }, ...generated.restrictedSyntax],
   ```
3. **`no-restricted-imports`** (react `:96`, ts-server `:111`) — merge generated paths/patterns into the options object:
   ```js
   'no-restricted-imports': ['error', {
     patterns: [ /* existing */ , ...(generated.restrictedImports.patterns ?? []) ],
     ...(generated.restrictedImports.paths ? { paths: generated.restrictedImports.paths } : {}),
   }],
   ```
4. **Additive block** for unique-key generated rules — placed after the existing custom-rule blocks, **before `prettierConfig`**, using the same conditional-spread pattern the template already uses for R7/R8 ([`eslint.config.react.mjs:245`](../../../packages/preset-next-15-canonical/templates/eslint.config.react.mjs)):
   ```js
   ...(Object.keys(generated.ruleBlock).length
     ? [{ plugins: { 'rules-as-tests': customRules }, rules: generated.ruleBlock }]
     : []),
   ```

The `plugins: { 'rules-as-tests': customRules }` registration makes any generated `rules-as-tests/*` entry resolvable; built-in entries ignore the `plugins` key. `customRules` is already imported in both templates.

### 4.3 `install.sh` ship step

Copy the static helper to the consumer root for **both** stacks (it is stack-agnostic), in the existing custom-rules section (`§5b`, runs for both stacks, around [`install.sh:938`](../../../install.sh)):

```sh
copy_safe "$PKG_ROOT/packages/core/templates/shared/eslint-generated-rules.mjs" "$PROJECT_ROOT/eslint-generated-rules.mjs"
```

No stub snippet is required — the helper degrades on absence. (`.ai-factory/` is already created by install.sh; the `synthesizer-output/` subdir is created by the Layer-5 installer when `synth` runs.)

### 4.4 Guard test — template rule-refs resolve to barrel rules (new principle 24)

`packages/core/principles/24-template-rule-refs-resolve.test.ts` — deterministic, no-LLM. Scans both shipped templates for `rules-as-tests/<id>` literals; asserts each `<id>` resolves to a barrel-able rule file (`packages/core/eslint-rules/<id>.ts` OR `packages/preset-next-15-canonical/eslint-rules/<id>.ts`, per the install.sh barrel convention `file <id>.ts → key <id>`). This is the missing edit-time/CI channel that would have caught the R8 dangling ref (template references a `rules-as-tests/<id>` no longer shipped). Slot 24 = next free integer (23 is highest occupied).

## 5. Data flow

```text
recipes ─▶ synthesize() ─▶ SynthesisPlan.eslintConfigSnippet (rules-map, JSON string)
                               │  (Layer-5 install.ts / `npm run synth`)
                               ▼
        <consumer>/.ai-factory/synthesizer-output/eslint-rules-snippet.json   (gitignored, per-consumer)
                               │  (read at config-load by §4.1 helper, shipped by §4.3)
                               ▼
   eslint-generated-rules.mjs  ──split──▶ { restrictedSyntax[], restrictedImports{}, ruleBlock{} }
                               │  (spread by §4.2 template edits)
                               ▼
        consumer eslint.config.mjs  ──▶  ESLint enforces generated rules (merged, no clobber)
```

## 6. Error handling / degrade

- **No snippet (fresh skeleton, no `synth`):** helper returns all-empty → templates identical to today. No stub file needed.
- **Malformed snippet JSON:** caught → all-empty (fail-open: a broken generated artifact must never break the consumer's lint). The synthesizer's own gates ([`gate-conflict.ts`](../../../packages/core/validator/gate-conflict.ts)) guard snippet validity upstream.
- **Generated `rules-as-tests/<gid>` with no shipped impl:** would crash ESLint (the R8 failure mode). In-scope mitigation = the additive block registers the plugin; the generated-side completeness is owned by the synthesizer validator, and the §7 paired-negative test exercises a generated rule end-to-end. The §4.4 guard covers the *template* side (the actual R8 trigger).

## 7. Testing strategy (TDD — failing test first)

1. **Unit (vitest) — the helper split logic** (load-bearing; write first, RED before the helper exists): given a snippet map with `no-restricted-syntax`, `no-restricted-imports`, and a `rules-as-tests/*` entry, assert `generated` splits into the three buckets correctly; given absent/garbage input, assert all-empty.
2. **Guard test (principle 24)** — write RED against a fixture template carrying an unresolvable `rules-as-tests/<id>`, then GREEN against the real templates.
3. **Paired-negative install test** (`tests/install-sh/`, modeled on [`f17-lint-rules-planted-violation.test.sh`](../../../tests/install-sh/f17-lint-rules-planted-violation.test.sh)) — install a fresh ts-server consumer; write a **synthetic** `eslint-rules-snippet.json` with a known generated `no-restricted-syntax` selector (ban `bannedFn()`). Primary assertion = `eslint --print-config <target>` (deterministic; the same tsx-loader probe the R2-wirer uses, [`wire-eslint-r2.ts:219`](../../../packages/core/install/wire-eslint-r2.ts)); a real `eslint` run on a planted file is an optional stronger arm when the harness has deps. Assert:
   - **(+) delivery:** the generated selector is present in the resolved `no-restricted-syntax` for the target file;
   - **(no-clobber):** the template's own enum-ban selector is *still* present in that same resolved `no-restricted-syntax` (proves merge, not replace);
   - **(−) negative arm:** with an empty `{}` snippet, the generated selector is absent — proving it is the generated rule's delivery, nothing else.

## 8. Scope fence

**IN:** the §4.1 helper, the §4.2 edits to the two shipped eslint templates, the §4.3 `install.sh` copy line, the §4.4 guard principle, the §7 tests, and the SSOT + `Prior-art:` trailer (§9). The R8 dangling-ref revert is **separate** (already owned elsewhere) — this spec does not touch it.

**OUT:** wiring into a consumer's own (non-shipped) ESLint config (R2-wirer domain, SSOT #135 — follow-up); any `emit()` / recipe / synthesizer change; G3b codegen; R7/R10; the `generator-require-composite-tier` S0–S4 rule content (R8/R13/R18 recipes — proven here only via a synthetic rule, not coupled).

## 9. Discipline

- **Capability commit → `Prior-art:` trailer.** SSOT consulted: #135 (R2-wirer BUILD — "wire rules into a consumer config") + #131 (ts-morph). This seam is the **load-time, no-write-back** sibling of #135 for the framework's *own* shipped template — a distinct mechanism. Add a new SSOT entry (BUILD: "no upstream merges a generated ESLint rules-map into a flat-config at load time with concat-not-clobber semantics"; revisit trigger = an upstream config-merge lib that preserves flat-config array semantics) in the capability commit, and cite it in the trailer.
- **No paid LLM in CI** — helper + guard + install test are pure JS/bash, deterministic.
- **§1.7 self-reflection** — the guard (principle 24) is a new discipline-bearing artifact; run forward/backward checks at implementation time (`self-reflection` skill): forward — complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md), [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) (this spec carries the header), [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (REUSE the existing JSON snippet contract; BUILD only the thin split-helper after the #135 consult); backward — supersedes nothing; closes the consumer-enforcement gap the README goal requires.
- **PR base `staging`; strict atomic scope** per [CLAUDE.md «PR strategy»](../../../CLAUDE.md).

## 10. Acceptance

- A synthetic generated `no-restricted-syntax` rule, dropped into a fresh consumer's `.ai-factory/synthesizer-output/eslint-rules-snippet.json`, **fires** in that consumer's ESLint run — proven by the §7 paired-negative test.
- The template's own static rules are **not clobbered** by delivery (the no-clobber assertion is green).
- Empty/absent snippet → consumer lint is byte-for-byte unchanged from today.
- The §4.4 guard reds on a fabricated dangling `rules-as-tests/<id>` template ref and greens on the real templates.
- Full `npm --prefix packages/core run test:principles` + the install-sh suite green; `Prior-art:` trailer + SSOT entry present.
