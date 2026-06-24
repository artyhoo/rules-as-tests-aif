# Generated declarative-rule delivery seam — Implementation Plan

> **⚠ SUPERSEDED (2026-06-24).** This plan implements the seam in the now-superseded [spec](../specs/2026-06-24-generated-eslint-rule-delivery-seam-design.md). The delivery mechanism already existed on staging (`restricted-syntax-audit-exempt` + principle 25); the real residual gap (hand-inline selector drift) shipped as [`packages/core/principles/26-template-selector-sync.test.ts`](../../../packages/core/principles/26-template-selector-sync.test.ts) (PR #716) instead. **Do not execute this plan.**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the synthesizer's generated declarative ESLint rules (`.ai-factory/synthesizer-output/eslint-rules-snippet.json`) actually enforce in a fresh-skeleton consumer's running `eslint.config.mjs`, via a load-time helper that merges them into the template's own rule arrays — plus a guard test that every shipped-template `rules-as-tests/<id>` ref resolves to a barrel rule.

**Architecture:** A small static ESM helper (`eslint-generated-rules.mjs`, shipped to the consumer root) reads the per-consumer snippet at ESLint-config-load time and splits it into `restrictedSyntax` / `restrictedImports` / `ruleBlock`. The two shipped eslint templates spread those into their **own** `no-restricted-syntax` / `no-restricted-imports` arrays (concat, not a separate block — ESLint flat config last-wins would clobber) plus one additive block for unique-key entries. Degrades to no-op on an absent/garbage snippet. No change to `emit()`/recipes/synthesizer.

**Tech Stack:** Node ESM (`.mjs`), ESLint flat config, vitest (framework unit + principle tests), bash (install-sh integration test), tsx (loads the consumer config in the integration test).

## Global Constraints

- **No paid LLM in CI** — every test is deterministic JS/bash, zero API calls.
- **PR base `staging`**; strict atomic scope (only the files named in each task; do **not** touch `emit()`, recipes, the synthesizer, or the R8 dangling-ref revert).
- **Helper is `.mjs`, pure ESM**, depends only on `node:fs`/`node:path`/`node:url`; degrades to all-empty on absent/garbage snippet.
- **ESLint flat-config rule configs do NOT merge across config objects** — generated `no-restricted-syntax`/`no-restricted-imports` MUST concat into the template's existing arrays; only unique-key (`rules-as-tests/<id>`, other built-ins) entries are safe as a separate additive block.
- **Markdownlint:** every fenced code block needs a language tag (`js`/`ts`/`bash`/`yaml`/`text`) — the pre-commit hook (MD040) blocks otherwise.
- **Capability discipline:** the seam is a capability — the commit that lands the helper + wiring carries a `Prior-art:` trailer citing SSOT #135 + a new SSOT row. Any commit the pre-push hook flags (new file ≥80 LOC under `packages/`) carries a `Prior-art:` line (real cite or escape-hatch `Prior-art: skipped — test only, no new capability`).
- **Self-application:** the guard lands under `packages/core/principles/`; run the `self-reflection` skill (§1.7 forward/backward) before finishing.

---

## File Structure

- `packages/core/templates/shared/eslint-generated-rules.mjs` — **new**, the helper (shipped to consumer root). One responsibility: read+split the snippet.
- `packages/core/install/eslint-generated-rules.test.ts` — **new**, vitest unit test for the helper (lives under `install/` because vitest `include` only globs known dirs; `templates/**` is not included).
- `packages/core/principles/24-template-rule-refs-resolve.test.ts` — **new**, the guard principle.
- `packages/preset-next-15-canonical/templates/eslint.config.react.mjs` — **modify** (3 spread points).
- `templates/ts-server/eslint.config.mjs` — **modify** (3 spread points).
- `install.sh` — **modify** (one `copy_safe` line in §5b to ship the helper).
- `tests/install-sh/f18-generated-rule-delivery.test.sh` — **new**, the paired-negative integration test.
- `.github/workflows/audit-self.yml` — **modify** (one step to run f18 in CI).
- `docs/meta-factory/prior-art-evaluations.md` — **modify** (one new SSOT row).

---

## Task 1: The generated-rules helper + unit test

**Files:**
- Create: `packages/core/templates/shared/eslint-generated-rules.mjs`
- Test: `packages/core/install/eslint-generated-rules.test.ts`

**Interfaces:**
- Produces: `load(snippetPath?: string) => { restrictedSyntax: object[]; restrictedImports: { paths?: object[]; patterns?: object[] }; ruleBlock: Record<string, unknown> }` and `generated` (the `load()` result for the default path). Consumed by the templates (Task 3) and the unit test.

- [ ] **Step 1: Write the failing unit test**

Create `packages/core/install/eslint-generated-rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load } from '../templates/shared/eslint-generated-rules.mjs';

function snippetFile(contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'aif-snip-'));
  const p = join(dir, 'eslint-rules-snippet.json');
  writeFileSync(p, contents);
  return p;
}

describe('eslint-generated-rules helper', () => {
  it('splits no-restricted-syntax / no-restricted-imports / unique-key into three buckets', () => {
    const p = snippetFile(
      JSON.stringify({
        'no-restricted-syntax': ['error', { selector: "CallExpression[callee.name='bannedFn']", message: 'no bannedFn' }],
        'no-restricted-imports': ['error', { paths: [{ name: 'next/router', message: 'use next/navigation' }] }],
        'rules-as-tests/g1-some-rule': 'error',
      }),
    );
    const r = load(p);
    expect(r.restrictedSyntax).toEqual([{ selector: "CallExpression[callee.name='bannedFn']", message: 'no bannedFn' }]);
    expect(r.restrictedImports).toEqual({ paths: [{ name: 'next/router', message: 'use next/navigation' }] });
    expect(r.ruleBlock).toEqual({ 'rules-as-tests/g1-some-rule': 'error' });
  });

  it('degrades to all-empty on an absent snippet (fresh skeleton, no synth)', () => {
    expect(load('/no/such/path/eslint-rules-snippet.json')).toEqual({ restrictedSyntax: [], restrictedImports: {}, ruleBlock: {} });
  });

  it('degrades to all-empty on malformed JSON (never breaks consumer lint)', () => {
    expect(load(snippetFile('{ this is not json'))).toEqual({ restrictedSyntax: [], restrictedImports: {}, ruleBlock: {} });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix packages/core exec vitest run install/eslint-generated-rules.test.ts`
Expected: FAIL — `Failed to resolve import "../templates/shared/eslint-generated-rules.mjs"` (the helper does not exist yet).

- [ ] **Step 3: Write the helper**

Create `packages/core/templates/shared/eslint-generated-rules.mjs`:

```js
// eslint-generated-rules.mjs — shipped to the consumer root by install.sh (§5b).
// Reads the per-consumer synthesizer snippet (.ai-factory/synthesizer-output/eslint-rules-snippet.json,
// a flat ESLint `rules: {}` map produced by `npm run synth`) and splits it into the pieces the shipped
// eslint.config.mjs spreads into its OWN rule arrays / an additive block.
//
// WHY split (not spread as one block): ESLint flat config does NOT merge a rule's config across config
// objects — the last matching object wins. Generated `no-restricted-syntax` / `no-restricted-imports`
// MUST concat into the template's existing arrays; only unique-key entries (rules-as-tests/<id>, other
// built-ins) are safe as a separate additive block.
//
// Degrades to all-empty on absent/garbage snippet (a fresh skeleton that never ran `synth`), so a
// consumer without generated rules is byte-for-byte unaffected. Data plumbing only — it never decides
// which rules exist; the synthesizer owns that.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SNIPPET = resolve(HERE, '.ai-factory/synthesizer-output/eslint-rules-snippet.json');

export function load(snippetPath = DEFAULT_SNIPPET) {
  let map;
  try {
    map = JSON.parse(readFileSync(snippetPath, 'utf8'));
  } catch {
    return { restrictedSyntax: [], restrictedImports: {}, ruleBlock: {} };
  }

  const restrictedSyntax = [];
  const restrictedImports = {};
  const ruleBlock = {};

  for (const [name, cfg] of Object.entries(map)) {
    if (name === 'no-restricted-syntax') {
      // cfg = ['error', sel1, sel2, ...] → drop severity, keep selector objects
      const entries = Array.isArray(cfg) ? cfg.slice(1) : [];
      restrictedSyntax.push(...entries);
    } else if (name === 'no-restricted-imports') {
      // cfg = ['error', { paths?, patterns? }]
      const opts = Array.isArray(cfg) && cfg.length > 1 ? cfg[1] : {};
      if (Array.isArray(opts.paths)) restrictedImports.paths = [...(restrictedImports.paths ?? []), ...opts.paths];
      if (Array.isArray(opts.patterns)) restrictedImports.patterns = [...(restrictedImports.patterns ?? []), ...opts.patterns];
    } else {
      ruleBlock[name] = cfg; // unique-key: plugin rules + other built-ins → additive block (no collision)
    }
  }

  return { restrictedSyntax, restrictedImports, ruleBlock };
}

export const generated = load();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix packages/core exec vitest run install/eslint-generated-rules.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/core/templates/shared/eslint-generated-rules.mjs packages/core/install/eslint-generated-rules.test.ts
git commit -m "feat(install): generated-rule snippet split-helper (load-time delivery seam)

Prior-art: prior-art-evaluations.md#135 (R2-wirer BUILD — wire rules into a consumer eslint config; this helper is the load-time, no-write-back sibling for the framework's own shipped template). New SSOT row added in the wiring commit (Task 3)."
```

(If the pre-push later flags this commit, the trailer above already satisfies it; the `.mjs` is < 80 LOC so it likely will not.)

---

## Task 2: Guard principle — template rule-refs resolve to barrel rules

**Files:**
- Create: `packages/core/principles/24-template-rule-refs-resolve.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (reads the real templates + rule dirs on disk).
- Produces: CI enforcement only.

- [ ] **Step 1: Write the failing test**

Create `packages/core/principles/24-template-rule-refs-resolve.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');

// Every ESLint flat-config template install.sh ships to a consumer root.
const SHIPPED_TEMPLATES = [
  'packages/preset-next-15-canonical/templates/eslint.config.react.mjs',
  'templates/ts-server/eslint.config.mjs',
];
// Rule dirs install.sh copies into eslint-rules-local/ + barrels (file `<id>.ts` → key `<id>`).
const BARREL_RULE_DIRS = ['packages/core/eslint-rules', 'packages/preset-next-15-canonical/eslint-rules'];

function ruleRefsIn(relPath: string): string[] {
  const src = readFileSync(resolve(REPO_ROOT, relPath), 'utf8');
  const ids = new Set<string>();
  for (const m of src.matchAll(/rules-as-tests\/([a-z0-9-]+)/g)) ids.add(m[1]);
  return [...ids];
}

function resolvesToBarrelRule(id: string): boolean {
  return BARREL_RULE_DIRS.some((d) => existsSync(resolve(REPO_ROOT, d, `${id}.ts`)));
}

describe('principle 24: shipped-template rules-as-tests/<id> refs resolve to a barrel rule', () => {
  // self-test (paired negative): the resolver must DISCRIMINATE, else the guard is vacuous.
  it('resolver accepts a real rule and rejects a fabricated one', () => {
    expect(resolvesToBarrelRule('no-unsafe-zod-parse')).toBe(true);
    expect(resolvesToBarrelRule('definitely-not-a-rule-xyz')).toBe(false);
  });

  for (const tpl of SHIPPED_TEMPLATES) {
    const refs = ruleRefsIn(tpl);
    it(`${tpl} wires at least one rules-as-tests/<id> (guard non-vacuous)`, () => {
      expect(refs.length).toBeGreaterThan(0);
    });
    for (const id of refs) {
      it(`${tpl}: rules-as-tests/${id} resolves to <barrel>/${id}.ts (no dangling ref — R8-class)`, () => {
        expect(
          resolvesToBarrelRule(id),
          `${tpl} references rules-as-tests/${id} but no ${id}.ts exists in [${BARREL_RULE_DIRS.join(', ')}] — a dangling ref crashes consumer ESLint (the R8 failure mode this guard exists to catch)`,
        ).toBe(true);
      });
    }
  }
});
```

- [ ] **Step 2: Run the test to verify it fails first, then passes on real templates**

Run: `npm --prefix packages/core exec vitest run principles/24-template-rule-refs-resolve.test.ts`
Expected: the **self-test** case proves the resolver discriminates (a fabricated id resolves to `false`); all real-template cases PASS (no dangling ref on this branch). To confirm the guard would CATCH a regression, temporarily append `rules: { 'rules-as-tests/ghost-rule': 'error' }`-style ref `rules-as-tests/ghost-rule` to a scratch copy and re-run mentally — the matching `it(...)` would FAIL with the dangling-ref message. Do NOT modify the real template; the self-test already proves discrimination.

- [ ] **Step 3: Run the principle suite to confirm no numbering/loader clash**

Run: `npm --prefix packages/core run test:principles`
Expected: PASS, including the new `principle 24` block.

- [ ] **Step 4: Commit**

```bash
git add packages/core/principles/24-template-rule-refs-resolve.test.ts
git commit -m "test(principles): 24 — shipped-template rules-as-tests/<id> refs resolve to a barrel rule

The missing edit-time/CI channel that would have caught the R8 dangling-ref regression.

Prior-art: skipped — principle test enforcing an existing template-wiring invariant, no new capability or dependency."
```

---

## Task 3: Ship the helper + wire both templates + integration test + CI + SSOT

**Files:**
- Modify: `install.sh` (§5b, ~line 957)
- Modify: `packages/preset-next-15-canonical/templates/eslint.config.react.mjs` (lines 16, 96–122, 124–130, after 264)
- Modify: `templates/ts-server/eslint.config.mjs` (lines 12, 111–137, 140–147, after 179)
- Create: `tests/install-sh/f18-generated-rule-delivery.test.sh`
- Modify: `.github/workflows/audit-self.yml` (new step near line 239)
- Modify: `docs/meta-factory/prior-art-evaluations.md` (one new row)

**Interfaces:**
- Consumes: `generated` from `./eslint-generated-rules.mjs` (Task 1) — `generated.restrictedSyntax`, `generated.restrictedImports.{paths,patterns}`, `generated.ruleBlock`.

- [ ] **Step 1: Write the failing integration test**

Create `tests/install-sh/f18-generated-rule-delivery.test.sh`:

```bash
#!/usr/bin/env bash
# f18 — generated declarative-rule delivery seam. A synthetic generated rule, dropped into a fresh
# consumer's .ai-factory/synthesizer-output/eslint-rules-snippet.json, is surfaced into the consumer's
# running eslint.config.mjs by the shipped helper + template spread — WITHOUT clobbering the template's
# own static rules. PAIRED NEGATIVE: an EMPTY snippet → the generated selector is ABSENT (proving it is
# the seam's delivery, not something already in the template).
#
# Proof: import the consumer's eslint.config.mjs via tsx (it evaluates `generated = load()` against the
# snippet) and inspect the resolved no-restricted-syntax selector array. A plain module import just
# builds the config array — it avoids the eslint-CLI ESM/CJS config-load cycle f17 documents.
# SKIP (logged, never silent pass) if tsx/node_modules unavailable.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ✗ $1"; }
skip() { echo "  ⊘ SKIP: $1"; }

T=$(mktemp -d)
printf '{ "name": "f18t", "version": "0.0.0" }\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1

# 0. form-check: shipped helper landed at consumer root
if [ -f "$T/eslint-generated-rules.mjs" ]; then ok "helper shipped → eslint-generated-rules.mjs"; else bad "helper MISSING — install.sh did not copy eslint-generated-rules.mjs"; fi

# locate tsx + a node_modules tree with eslint (for the .ts barrel import the config performs)
TSX_BIN=""
for _t in "$REPO_ROOT/node_modules/.bin/tsx" "$REPO_ROOT/packages/core/node_modules/.bin/tsx" "/app/node_modules/.bin/tsx"; do
  [ -x "$_t" ] && TSX_BIN="$_t" && break
done
NM_SRC=""
for _n in "$REPO_ROOT/packages/core/node_modules" "$REPO_ROOT/node_modules" "/app/node_modules"; do
  [ -d "$_n/eslint" ] && NM_SRC="$_n" && break
done
if [ -z "$TSX_BIN" ] || [ -z "$NM_SRC" ]; then
  skip "tsx ($([ -n "$TSX_BIN" ] && echo found || echo missing)) or node_modules ($([ -n "$NM_SRC" ] && echo found || echo missing)) unavailable — needs npm install. Form-check above still ran."
  echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]; exit $?
fi
[ -e "$T/node_modules" ] || ln -s "$NM_SRC" "$T/node_modules"

# probe: import the consumer config, print the resolved no-restricted-syntax array (the one in ARRAY
# form is the base TS block — the tests block sets it to the string 'off', which we skip).
cat > "$T/f18-probe.mts" << 'SCRIPT'
import cfg from './eslint.config.mjs';
const arr = (Array.isArray(cfg) ? cfg : []).flat(Infinity);
const block = arr.find((c) => c && c.rules && Array.isArray(c.rules['no-restricted-syntax']));
process.stdout.write(JSON.stringify(block ? block.rules['no-restricted-syntax'] : null));
SCRIPT

mkdir -p "$T/.ai-factory/synthesizer-output"

# ── POSITIVE arm: synthetic generated rule present ──────────────────────────────────────────────
cat > "$T/.ai-factory/synthesizer-output/eslint-rules-snippet.json" << 'SNIP'
{ "no-restricted-syntax": ["error", { "selector": "CallExpression[callee.name='bannedFn']", "message": "AIF-SEAM-TEST banned" }] }
SNIP
pos=$(cd "$T" && "$TSX_BIN" f18-probe.mts 2>/dev/null)
case "$pos" in *bannedFn*) ok "delivery: generated selector reached resolved no-restricted-syntax" ;; *) bad "delivery FAILED: generated selector absent — got: $pos" ;; esac
case "$pos" in *TSEnumDeclaration*) ok "no-clobber: template's own enum ban survived the merge" ;; *) bad "CLOBBER: template enum ban lost when generated rule merged — got: $pos" ;; esac

# ── NEGATIVE arm: empty snippet → generated selector absent, enum still present ──────────────────
printf '{}\n' > "$T/.ai-factory/synthesizer-output/eslint-rules-snippet.json"
neg=$(cd "$T" && "$TSX_BIN" f18-probe.mts 2>/dev/null)
case "$neg" in *bannedFn*) bad "negative arm FAILED: generated selector present with EMPTY snippet — got: $neg" ;; *) ok "paired-negative: empty snippet → generated selector absent (it WAS the seam's delivery)" ;; esac
case "$neg" in *TSEnumDeclaration*) ok "negative arm: template enum ban still present (config intact)" ;; *) bad "negative arm: template enum ban missing even with empty snippet — got: $neg" ;; esac

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: Run the integration test to verify it fails**

Run: `bash tests/install-sh/f18-generated-rule-delivery.test.sh`
Expected: FAIL — the form-check reds (`helper MISSING`, install.sh does not ship it yet) and, if the toolchain is present, the delivery arm reds (the template does not spread `generated` yet, so `bannedFn` is absent).

- [ ] **Step 3: Ship the helper in `install.sh`**

In `install.sh`, in the §5b custom-ESLint-rules section, immediately **after** the barrel-generation block (after the line `echo "  ✓ generated eslint-rules-local/index.ts ..."` and its closing `fi`, around line 992), add:

```sh
# Ship the static generated-rule split-helper the eslint.config.mjs imports. Reads the per-consumer
# synthesizer snippet at config-load time; degrades to no-op when absent (fresh skeleton, no synth).
copy_safe "$PKG_ROOT/packages/core/templates/shared/eslint-generated-rules.mjs" "$PROJECT_ROOT/eslint-generated-rules.mjs"
```

- [ ] **Step 4: Wire the React template**

In `packages/preset-next-15-canonical/templates/eslint.config.react.mjs`:

(a) After line 16 (`import customRules from './eslint-rules-local/index.ts';`) add:

```js
import { generated } from './eslint-generated-rules.mjs';
```

(b) In the `no-restricted-imports` rule (currently lines 96–122), inside `patterns: [ ... ]`, add the generated spread as the last array element, and add generated `paths` after the patterns array. The closing of the options object changes from:

```js
            {
              group: ['node-fetch', 'node-fetch/*'],
              message: 'Use native fetch (Node 18+).',
            },
          ],
        },
      ],
```

to:

```js
            {
              group: ['node-fetch', 'node-fetch/*'],
              message: 'Use native fetch (Node 18+).',
            },
            ...(generated.restrictedImports.patterns ?? []),
          ],
          ...(generated.restrictedImports.paths ? { paths: generated.restrictedImports.paths } : {}),
        },
      ],
```

(c) In the `no-restricted-syntax` rule (lines 124–130), add the generated spread before the closing `],`:

```js
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use union types or `as const` objects instead of enum.',
        },
        ...generated.restrictedSyntax,
      ],
```

(d) Immediately after the R7/R8 conditional block (the `: []),` that closes it, line 264) and **before** the `// Tests` block (line 266), add the additive block:

```js
  // Generated declarative rules — unique-key entries (plugin rules + other built-ins) from the
  // per-consumer synthesizer snippet, delivered as an additive block. Empty → omitted. (Generated
  // no-restricted-syntax / no-restricted-imports entries are merged into the base-block arrays above,
  // not here — ESLint flat-config last-wins would otherwise clobber the template's own bans.) Entries
  // already wired statically above are harmlessly re-declared at the same severity.
  ...(Object.keys(generated.ruleBlock).length
    ? [{ plugins: { 'rules-as-tests': customRules }, rules: generated.ruleBlock }]
    : []),
```

- [ ] **Step 5: Wire the ts-server template (identical pattern, different line numbers)**

In `templates/ts-server/eslint.config.mjs`:

(a) After line 12 (`import customRules from './eslint-rules-local/index.ts';`) add:

```js
import { generated } from './eslint-generated-rules.mjs';
```

(b) In `no-restricted-imports` (lines 111–137), apply the **same** `patterns`/`paths` edit as React Step 4(b) — add `...(generated.restrictedImports.patterns ?? []),` as the last `patterns` element and `...(generated.restrictedImports.paths ? { paths: generated.restrictedImports.paths } : {}),` after the patterns array.

(c) In `no-restricted-syntax` (lines 140–147), add `...generated.restrictedSyntax,` before the closing `],`:

```js
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message:
            'Use union types or `as const` objects instead of enum (verbatimModuleSyntax-incompatible).',
        },
        ...generated.restrictedSyntax,
      ],
```

(d) Immediately after the R7/R8 conditional block (`: []),`, line 179) and **before** the `// 5. Test files` block (line 181), add the same additive block as React Step 4(d).

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `bash tests/install-sh/f18-generated-rule-delivery.test.sh`
Expected: PASS — `helper shipped`, `delivery`, `no-clobber`, `paired-negative`, `config intact` all ✓ (or a logged SKIP if the toolchain is absent, with the form-check still ✓).

- [ ] **Step 7: Confirm the templates still parse + nothing else regressed**

Run: `node --check templates/ts-server/eslint.config.mjs && echo "ts-server config parses"`
Run: `node --check packages/preset-next-15-canonical/templates/eslint.config.react.mjs && echo "react config parses"`
Expected: both print the parse-OK line (syntactic validity of the edits; `--check` does not resolve imports).

Run: `bash tests/install-sh/c1-wiring.test.sh`
Expected: PASS (barrel wiring unaffected).

- [ ] **Step 8: Wire f18 into CI**

In `.github/workflows/audit-self.yml`, after the existing install-sh test steps (near line 239, after the `setup-orchestrator` step), add:

```yaml
      - name: Run install-sh generated-rule delivery seam test (generator-require-composite-tier)
        run: bash tests/install-sh/f18-generated-rule-delivery.test.sh
```

- [ ] **Step 9: Add the SSOT row**

Find the current max SSOT id: `grep -nE '^\| [0-9]+ \|' docs/meta-factory/prior-art-evaluations.md | tail -1`. Use `<max+1>` as the new id `<N>`. Append one row to the register table (match the existing column shape: `id | candidate | our-need | first-seen | last-checked | verdict | rationale | revisit-trigger`):

```text
| <N> | Load-time generated-eslint-rule delivery (this seam: `packages/core/templates/shared/eslint-generated-rules.mjs` + template spread) — read a generated `rules:{}` snippet and merge it into a shipped flat-config at config-load time. | Deliver synthesizer-generated declarative rules into a consumer's running eslint.config without AST write-back. | 2026-06-24 | 2026-06-24 | BUILD | **BUILD after SSOT consult.** Sibling of #135 (R2-wirer AST write-back into an arbitrary consumer config) but a distinct mechanism: load-time spread into the framework's OWN shipped template — no ts-morph, no persisted edit, inherent idempotency (re-read each run), concat-not-clobber per ESLint flat-config last-wins semantics. No upstream merges a generated ESLint rules-map into a flat-config at load time with these semantics (DeepWiki/WebSearch surface AST config-editors like magicast #134 and toml_edit #132, all write-back). | An upstream ships a load-time flat-config rules-merge helper preserving array-concat semantics → re-evaluate ADOPT. |
```

- [ ] **Step 10: Run the full framework suite + commit (capability)**

Run: `npm --prefix packages/core test`
Expected: PASS (helper unit + principle 24 + all existing).

```bash
git add install.sh packages/preset-next-15-canonical/templates/eslint.config.react.mjs templates/ts-server/eslint.config.mjs tests/install-sh/f18-generated-rule-delivery.test.sh .github/workflows/audit-self.yml docs/meta-factory/prior-art-evaluations.md
git commit -m "feat(install): wire generated-rule snippet into shipped eslint templates (delivery seam)

Templates spread the generated snippet into their own no-restricted-syntax / no-restricted-imports
arrays (concat, not a clobbering separate block) + an additive block for unique-key rules. install.sh
ships the helper; f18 proves a synthetic generated rule fires in a fresh consumer + no-clobber + the
paired negative. Closes the consumer-enforcement gap for generated declarative rules.

Prior-art: prior-art-evaluations.md#135 (R2-wirer BUILD — wire rules into a consumer eslint config; this seam is the load-time, no-write-back sibling for the framework's own shipped template).
Prior-art: prior-art-evaluations.md#<N> (this delivery seam — BUILD: no upstream merges a generated ESLint rules-map into a flat-config at load time with concat-not-clobber semantics)."
```

(Replace `#<N>` with the id assigned in Step 9.)

---

## Task 4: Self-reflection + finish the branch

**Files:** none (verification + discipline closeout).

- [ ] **Step 1: Run the full suite once more (no drift)**

Run: `npm --prefix packages/core test && npm --prefix packages/core run test:principles`
Expected: PASS.

- [ ] **Step 2: Run the install-sh integration test once more**

Run: `bash tests/install-sh/f18-generated-rule-delivery.test.sh`
Expected: PASS (or logged SKIP if no toolchain).

- [ ] **Step 3: §1.7 self-reflection on the new principle**

Invoke the `self-reflection` skill and record the forward/backward check for `principle 24` (it is a new enforcement artifact under `packages/core/principles/`). Forward: it complies with `no-paid-llm-in-ci.md` (pure fs read), `doc-authority-hierarchy.md` (the spec carries the header; the test is code, no header needed), `build-first-reuse-default.md` (REUSE the existing snippet contract; BUILD only the thin helper after the #135 consult). Backward: supersedes nothing; closes the README-goal consumer-enforcement gap. Put the result in the PR body.

- [ ] **Step 4: Finish the branch**

Invoke `superpowers:finishing-a-development-branch`. Open the PR to `staging`. PR body: link the spec (`docs/superpowers/specs/2026-06-24-generated-eslint-rule-delivery-seam-design.md`), summarize the seam + the §3.1 G3b on-ramp, list the four deliverables (helper, principle 24, template wiring, f18), and note OUT-of-scope (existing-consumer-config → R2-wirer follow-up; the R8 dangling-ref revert is separate).

---

## Self-Review

**1. Spec coverage:**
- §3 Approach 1 (load-time helper-merge) → Task 1 (helper) + Task 3 (template spread). ✓
- §2 collision constraint (concat, not clobber) → Task 3 Steps 4–5 (spread into existing arrays) + f18 no-clobber assertion. ✓
- §4.1 helper → Task 1. ✓ §4.2 template edits → Task 3 Steps 4–5. ✓ §4.3 install.sh ship → Task 3 Step 3. ✓ §4.4 guard principle 24 → Task 2. ✓
- §6 degrade → Task 1 Steps (absent/garbage) + f18 negative arm. ✓
- §7 testing (unit + guard + paired-negative install) → Tasks 1/2/3. ✓
- §9 discipline (Prior-art trailer, SSOT, no-paid-LLM, §1.7) → Task 3 Steps 9–10 + Task 4 Step 3. ✓
- §3.1 G3b on-ramp (additive ruleBlock) → Task 3 Steps 4(d)/5(d). ✓

**2. Placeholder scan:** the only deferred value is the SSOT id `<N>`, which is an append-only-register lookup performed in Task 3 Step 9 (`grep ... | tail -1` → max+1) and substituted in Steps 9–10 — not a design unknown. No `TBD`/`TODO`/"handle edge cases".

**3. Type consistency:** `load()` returns `{ restrictedSyntax, restrictedImports: { paths?, patterns? }, ruleBlock }` in Task 1; the templates consume exactly `generated.restrictedSyntax` (array spread), `generated.restrictedImports.patterns`/`.paths`, and `generated.ruleBlock` in Task 3 — names and shapes match. The unit test (Task 1) and f18 (Task 3) both key on the same `no-restricted-syntax` selector `CallExpression[callee.name='bannedFn']`.
