# R2 Layer-2 wirer — plugin-registration fix (GH #644) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the R2 Layer-2 wirer emit an ESLint config that always loads — register the `rules-as-tests` plugin when (and only when) the consumer's base does not — and ship a test that fails when the wired output does not load.

**Architecture:** `wireConfigSource` stays a pure text→text transform producing a `bare` or `self-contained` element. A new orchestrator `resolveAndWire` writes the bare element, asks ESLint (`--print-config`, injected `runProbe`) whether it loads, and escalates to the self-contained element only on `could not find plugin` — so "Cannot redefine plugin" is unreachable by construction. Real ESLint is exercised only in the install-harness test; unit tests mock the probe.

**Tech Stack:** TypeScript (Node, `--experimental-strip-types` / `tsx`), `ts-morph` (AST edit), `eslint@^9` (consumer), `vitest` (unit), bash (install-harness).

**Spec:** [docs/superpowers/specs/2026-06-19-r2-wirer-plugin-registration-design.md](../specs/2026-06-19-r2-wirer-plugin-registration-design.md)

---

## File Structure

- Modify: [`packages/core/install/wire-eslint-r2.ts`](../../../packages/core/install/wire-eslint-r2.ts) — add `variant` to the transform, `customRulesImportSpecifier`, `resolveAndWire`, `probeViaEslint`, `findOrSynthProbeTarget`; rewrite the two manual snippets; `main()` calls `resolveAndWire` in apply mode. (Existing file — **not** a new ≥80-LOC file → not a capability commit; no `Prior-art:` trailer. Confirm with `git diff` before commit.)
- Modify: [`packages/core/install/wire-eslint-r2.test.ts`](../../../packages/core/install/wire-eslint-r2.test.ts) — unit tests for both variants, the import-path helper, and `resolveAndWire` (mock probe).
- Modify: [`tests/install-sh/wire-eslint-r2.test.sh`](../../../tests/install-sh/wire-eslint-r2.test.sh) — W3 loadability fixtures (real ESLint) + fix the false header comment (W1's sibling).
- No new files. No new dependencies (`eslint` already in `CORE_DEVDEPS`).

## Task 0: Dev environment (worktree has no node_modules — spec §7 R2)

**Files:** none.

- [ ] **Step 1: Ensure deps resolve.** This worktree has no `node_modules`. Either install at the workspace root or run all `npm`/`npx` from the main checkout.

Run: `cd /Users/art/code/rules-as-tests-aif && npm ls eslint ts-morph vitest tsx >/dev/null 2>&1 && echo DEPS-OK || npm install`
Expected: `DEPS-OK` (or a successful install). All subsequent `vitest`/`eslint` commands run from a tree where these resolve.

- [ ] **Step 2: Confirm the v9 parity assumption (spec §7 R1).** The consumer runs `eslint@^9`; probes in the spec ran on v10. Sanity-check the two error strings exist on v9.

Run:
```bash
T=$(mktemp -d); cd "$T"; printf 'export const x=1;\n' > a.ts
printf "export default [{ files:['**/*.ts'], rules:{ 'rules-as-tests/no-unsafe-zod-parse':'error' } }];\n" > eslint.config.mjs
npx --yes eslint@9 --print-config a.ts; echo "rc=$?"
```
Expected: `rc=2` and stderr contains `could not find plugin "rules-as-tests"`. If v9 differs, STOP and revise the spec before continuing.

## Task 1: Transform variants (`bare` vs `self-contained`)

**Files:**
- Modify: `packages/core/install/wire-eslint-r2.ts`
- Test: `packages/core/install/wire-eslint-r2.test.ts`

- [ ] **Step 1: Write the failing tests** (append to `wire-eslint-r2.test.ts`):

```ts
import { describe, it, expect } from 'vitest';
import { wireConfigSource } from './wire-eslint-r2.ts';

describe('transform variants', () => {
  const base = `import base from './base.mjs';\nexport default [...base];\n`;

  it('bare (default): appends rules-only element, no plugins key, no import', async () => {
    const r = await wireConfigSource(base);
    expect(r.status).toBe('wired');
    expect(r.modified).toContain(`'rules-as-tests/no-unsafe-zod-parse': 'error'`);
    expect(r.modified).not.toContain('plugins:');
    expect(r.modified).not.toContain('customRules');
  });
  it('self-contained: appends plugins+rules element and injects the customRules import', async () => {
    const r = await wireConfigSource(base, {
      variant: 'self-contained',
      customRulesImportPath: '../../eslint-rules-local/index.ts',
    });
    expect(r.status).toBe('wired');
    expect(r.modified).toContain(`plugins: { 'rules-as-tests': customRules }`);
    expect(r.modified).toContain(`'rules-as-tests/no-unsafe-zod-parse': 'error'`);
    expect(r.modified).toContain(`import customRules from '../../eslint-rules-local/index.ts'`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "transform variants"`
Expected: FAIL — `wireConfigSource` does not accept a second arg / self-contained assertions fail.

- [ ] **Step 3: Implement the variant transform.** In `wire-eslint-r2.ts`, replace the `R2_ELEMENT` const (`:33`) and extend `wireConfigSource`:

```ts
export type TransformVariant = 'bare' | 'self-contained';
export interface TransformOpts {
  variant?: TransformVariant;            // default 'bare'
  customRulesImportPath?: string;        // required when variant === 'self-contained'
}

function r2Element(variant: TransformVariant): string {
  return variant === 'self-contained'
    ? `{ plugins: { 'rules-as-tests': customRules }, rules: { '${R2_RULE_ID}': 'error' } }`
    : `{ rules: { '${R2_RULE_ID}': 'error' } }`;
}
```

Change the signature to `export async function wireConfigSource(source: string, opts: TransformOpts = {}): Promise<WireResult>`. Inside, compute `const variant = opts.variant ?? 'bare';` and `const element = r2Element(variant);`. Replace every `addElement(R2_ELEMENT)` / `[...${expr.getText()}, ${R2_ELEMENT}]` usage (`:133`, `:136`, `:142`) with `element`. After a successful append, when `variant === 'self-contained'`, inject the import (idempotent):

```ts
if (variant === 'self-contained') {
  const spec = opts.customRulesImportPath;
  if (!spec) throw new Error('self-contained variant requires customRulesImportPath');
  const already = sf.getImportDeclarations().some(
    (d: any) => d.getDefaultImport()?.getText() === 'customRules',
  );
  if (!already) {
    sf.addImportDeclaration({ defaultImport: 'customRules', moduleSpecifier: spec });
  }
}
```

(Place this after the `expr.isKind(...)` append branches, before `const modified = sf.getFullText();`.)

Existing call-sites stay valid — `opts` defaults to `{}` → `variant: 'bare'`: `main()` (`:191`) and the unit-test helper + Fixtures A/B/C (`wire-eslint-r2.test.ts:19/71/168`) all pass one arg and keep the bare transform.

- [ ] **Step 4: Run to verify it passes**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "transform variants"`
Expected: PASS. Then run the whole file to confirm no regression in existing transform tests: `npx vitest run packages/core/install/wire-eslint-r2.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/install/wire-eslint-r2.ts packages/core/install/wire-eslint-r2.test.ts
git commit -m "feat(install): R2 wirer supports self-contained (plugin-registering) variant (#644)"
```

## Task 2: `customRulesImportSpecifier` helper (relative import path)

**Files:**
- Modify: `packages/core/install/wire-eslint-r2.ts`
- Test: `packages/core/install/wire-eslint-r2.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { customRulesImportSpecifier } from './wire-eslint-r2.ts';

describe('customRulesImportSpecifier', () => {
  it('computes the relative path from a per-package config to <root>/eslint-rules-local', () => {
    // cwd = consumer root; config two levels down
    expect(customRulesImportSpecifier('/repo/apps/api/eslint.config.mjs', '/repo'))
      .toBe('../../eslint-rules-local/index.ts');
  });
  it('prefixes ./ when the config is at the consumer root', () => {
    expect(customRulesImportSpecifier('/repo/eslint.config.mjs', '/repo'))
      .toBe('./eslint-rules-local/index.ts');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "customRulesImportSpecifier"`
Expected: FAIL — export not found.

- [ ] **Step 3: Implement** (add to `wire-eslint-r2.ts`; `dirname`/`relative`/`resolve` are already imported or add them to the `node:path` import):

```ts
import { dirname, relative, resolve } from 'node:path';

export function customRulesImportSpecifier(configPath: string, cwd: string): string {
  const target = resolve(cwd, 'eslint-rules-local/index.ts');
  let rel = relative(dirname(resolve(configPath)), target);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "customRulesImportSpecifier"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/install/wire-eslint-r2.ts packages/core/install/wire-eslint-r2.test.ts
git commit -m "feat(install): compute relative customRules import path for self-contained wire (#644)"
```

## Task 3: `resolveAndWire` orchestrator (try-bare → escalate → degrade), mocked probe

**Files:**
- Modify: `packages/core/install/wire-eslint-r2.ts`
- Test: `packages/core/install/wire-eslint-r2.test.ts`

- [ ] **Step 1: Write the failing tests** (real temp fs, mock probe):

```ts
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveAndWire } from './wire-eslint-r2.ts';

function tmpConfig(body: string) {
  const dir = mkdtempSync(join(tmpdir(), 'r2wire-'));
  const p = join(dir, 'eslint.config.mjs');
  writeFileSync(p, body, 'utf8');
  return { dir, p };
}

describe('resolveAndWire', () => {
  const body = `import base from './base.mjs';\nexport default [...base];\n`;

  it('keeps the bare element when the probe says the config loads', async () => {
    const { p } = tmpConfig(body);
    const r = await resolveAndWire({ configPath: p, cwd: '/repo', runProbe: async () => 'ok' });
    expect(r.status).toBe('wired');
    expect(r.variant).toBe('bare');
    const out = readFileSync(p, 'utf8');
    expect(out).toContain(`'rules-as-tests/no-unsafe-zod-parse': 'error'`);
    expect(out).not.toContain('plugins:');
  });
  it('escalates to self-contained when the bare config cannot find the plugin', async () => {
    const { dir, p } = tmpConfig(body);
    let calls = 0;
    const runProbe = async () => (++calls === 1 ? 'could-not-find-plugin' : 'ok');
    const r = await resolveAndWire({ configPath: p, cwd: dir, runProbe });
    expect(r.status).toBe('wired');
    expect(r.variant).toBe('self-contained');
    const out = readFileSync(p, 'utf8');
    expect(out).toContain(`plugins: { 'rules-as-tests': customRules }`);
    expect(out).toContain('import customRules from');
  });
  it('degrades and restores the original when the probe is unavailable', async () => {
    const { p } = tmpConfig(body);
    const r = await resolveAndWire({ configPath: p, cwd: '/repo', runProbe: async () => 'unavailable' });
    expect(r.status).toBe('degrade');
    expect(readFileSync(p, 'utf8')).toBe(body); // byte-identical restore
  });
  it('is idempotent: already-wired config is left byte-identical', async () => {
    const wired = `import base from './base.mjs';\nexport default [...base, { rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }];\n`;
    const { p } = tmpConfig(wired);
    const r = await resolveAndWire({ configPath: p, cwd: '/repo', runProbe: async () => 'ok' });
    expect(r.status).toBe('already-wired');
    expect(readFileSync(p, 'utf8')).toBe(wired);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "resolveAndWire"`
Expected: FAIL — export not found.

- [ ] **Step 3: Implement** (add to `wire-eslint-r2.ts`; uses `readFileSync`/`writeFileSync` already imported):

```ts
export type ProbeVerdict = 'ok' | 'could-not-find-plugin' | 'unavailable' | 'other-error';

export interface ResolveWireArgs {
  configPath: string;
  cwd: string;
  runProbe: (configPath: string, cwd: string) => Promise<ProbeVerdict>;
}

export async function resolveAndWire(args: ResolveWireArgs): Promise<WireResult> {
  const { configPath, cwd, runProbe } = args;
  const original = readFileSync(configPath, 'utf8');
  if (original.includes(R2_RULE_ID)) {
    return { status: 'already-wired', original, modified: original };
  }

  // 1. bare
  const bare = await wireConfigSource(original, { variant: 'bare' });
  if (bare.status !== 'wired') return bare; // unrecognised / degrade — nothing written
  writeFileSync(configPath, bare.modified, 'utf8');

  // 2. probe
  const v1 = await runProbe(configPath, cwd);
  if (v1 === 'ok') return { ...bare, variant: 'bare' };

  if (v1 === 'could-not-find-plugin') {
    // 3. escalate: self-contained
    const spec = customRulesImportSpecifier(configPath, cwd);
    const sc = await wireConfigSource(original, { variant: 'self-contained', customRulesImportPath: spec });
    if (sc.status === 'wired') {
      writeFileSync(configPath, sc.modified, 'utf8');
      const v2 = await runProbe(configPath, cwd);
      if (v2 === 'ok') return { ...sc, variant: 'self-contained' };
    }
  }

  // 4. degrade: restore, no half-edit
  writeFileSync(configPath, original, 'utf8');
  return { status: 'degrade', original, modified: original, degradeReason: `probe verdict: ${v1}` };
}
```

Add `variant?: TransformVariant;` to the `WireResult` interface (`:41`).

- [ ] **Step 4: Run to verify it passes**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "resolveAndWire"`
Expected: PASS (all 4 cases).

- [ ] **Step 5: Commit**

```bash
git add packages/core/install/wire-eslint-r2.ts packages/core/install/wire-eslint-r2.test.ts
git commit -m "feat(install): resolveAndWire orchestrates bare→self-contained via injected probe (#644)"
```

## Task 4: `probeViaEslint` production probe + `findOrSynthProbeTarget`

**Files:**
- Modify: `packages/core/install/wire-eslint-r2.ts`

- [ ] **Step 1: Implement** (no unit test — Task 6's harness covers the real-ESLint path). Add `unlinkSync` to the `node:fs` import, `join` to the `node:path` import, and a new `node:child_process` import:

```ts
import { execFileSync } from 'node:child_process';

function synthProbeTarget(configDir: string): string {
  // ALWAYS synthesize (deterministic). Verdict depends only on whether the plugin is registered
  // anywhere, not on which file we probe (spec §2 fact E) — avoids a stray *.config.ts skewing it.
  const p = resolve(configDir, '__aif_r2_probe__.ts');
  writeFileSync(p, 'export const __aif_probe = 1;\n', 'utf8');
  return p;
}

export async function probeViaEslint(configPath: string, cwd: string): Promise<ProbeVerdict> {
  // eslint `exports` does NOT expose `./bin/eslint.js` (resolve throws ERR_PACKAGE_PATH_NOT_EXPORTED
  // on v9/v10, verified). Resolve the EXPORTED `./package.json`, derive bin from its dir (#535 trap).
  let eslintBin: string;
  try {
    const reqd = createRequire(resolve(cwd, 'package.json'));
    const pj = reqd.resolve('eslint/package.json');
    eslintBin = join(dirname(pj), 'bin', 'eslint.js');
    if (!existsSync(eslintBin)) return 'unavailable';
  } catch {
    return 'unavailable';
  }
  const dir = dirname(resolve(configPath));
  const target = synthProbeTarget(dir);
  try {
    execFileSync(process.execPath, [eslintBin, '--print-config', target], { cwd: dir, stdio: 'pipe' });
    return 'ok';
  } catch (e: unknown) {
    const stderr = String((e as { stderr?: Buffer }).stderr ?? '');
    if (/could not find plugin/i.test(stderr)) return 'could-not-find-plugin';
    // Surface WHY we degrade (e.g. type-aware projectService/tsconfig error) — no silent degrade.
    console.error(`  · R2 probe: unexpected eslint error → degrading:\n${stderr.slice(0, 400)}`);
    return 'other-error';
  } finally {
    try { unlinkSync(target); } catch { /* best-effort */ }
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/art/code/rules-as-tests-aif && npx tsc -p packages/core --noEmit` (or the repo's `typecheck` script)
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add packages/core/install/wire-eslint-r2.ts
git commit -m "feat(install): probeViaEslint default probe resolves eslint from consumer cwd (#644)"
```

## Task 5: `main()` uses `resolveAndWire` in apply mode

**Files:**
- Modify: `packages/core/install/wire-eslint-r2.ts` (the `case 'wired':` apply branch, `:213`-`:247`)

- [ ] **Step 1: Rewire the apply path.** Replace the entire `case 'wired': { … }` body (`wire-eslint-r2.ts:213-248`) with the block below. `--dry-run`/`--diff` keep the **bare** preview (side-effect-free, no probe); only the **apply** branch goes through `resolveAndWire` (bare → probe → escalate/degrade):

```ts
    case 'wired': {
      const diff = buildLineDiff(result.original, result.modified); // bare preview
      if (dryRun || diffOnly) {
        console.log(`Diff for ${configPath}:\n${diff}`);
        process.exit(0);
      }
      console.log(`\nProposed change to ${configPath}:\n${diff}\n`);
      let apply = assumeYes;
      if (!apply) {
        if (!process.stdin.isTTY) { console.log(generateDegradedSnippet(configPath)); process.exit(0); }
        const { createInterface } = await import('node:readline');
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((done) => rl.question('Apply this change? [y/N] ', done));
        rl.close();
        apply = /^y(es)?$/i.test(answer.trim());
      }
      if (!apply) { console.log(generateDegradedSnippet(configPath)); process.exit(0); }
      const wired = await resolveAndWire({ configPath, cwd: process.cwd(), runProbe: probeViaEslint });
      if (wired.status === 'wired') console.log(`  ✓ R2 wired into ${configPath} (${wired.variant})`);
      else if (wired.status === 'already-wired') console.log(`· R2 already enforced in ${configPath}`);
      else console.log(generateDegradedSnippet(configPath));
      process.exit(0);
    }
```

(Pre-computed `result` feeds ONLY the dry-run/diff preview; apply re-reads via `resolveAndWire` — no double-write.)

- [ ] **Step 2: Typecheck + full unit file**

Run: `cd /Users/art/code/rules-as-tests-aif && npx tsc -p packages/core --noEmit && npx vitest run packages/core/install/wire-eslint-r2.test.ts`
Expected: exit 0, all PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/install/wire-eslint-r2.ts
git commit -m "feat(install): apply-mode wiring goes through resolveAndWire probe loop (#644)"
```

## Task 6: W3 — install-harness loadability fixtures (real ESLint)

**Files:**
- Modify: `tests/install-sh/wire-eslint-r2.test.sh`

- [ ] **Step 1: Add two fixtures** before the `Summary` block. Fixture P1 = plugin-less base (timeliner shape) must end up loadable; Fixture P2 = plugin-registering base must keep bare + still load (no "Cannot redefine"). Both need a local `eslint-rules-local/index.ts` so the self-contained import resolves.

```bash
# Shared scaffold: consumer with a local eslint-rules-local barrel + eslint@9.
_mk_consumer() { # $1=dir
  ( cd "$1" && git init -q && npm init -y >/dev/null 2>&1 && npm i -D eslint@9 >/dev/null 2>&1 )
  mkdir -p "$1/eslint-rules-local" "$1/apps/api/src"
  printf "export default { rules: { 'no-unsafe-zod-parse': { create: () => ({}) } } };\n" > "$1/eslint-rules-local/index.ts"
  printf 'export const x = 1;\n' > "$1/apps/api/src/h.ts"
}

# ── Fixture P1: plugin-LESS base → wired output must LOAD (rc 0) + R2 applied ──
echo "Fixture P1: plugin-less base → loadable after wire"
if [ -z "$RUN_WIRER_TSX" ] || ! command -v node >/dev/null 2>&1; then ok "P1: skipped (tsx/node absent)"; else
  T_P1=$(mktemp -d); _mk_consumer "$T_P1"
  printf "const base = [{ files: ['**/*.ts'], rules: { 'no-console': 'error' } }];\nexport default [...base];\n" > "$T_P1/apps/api/eslint.config.mjs"
  ( cd "$T_P1" && "$RUN_WIRER_TSX" "$WIRER" --path apps/api/eslint.config.mjs --yes >/dev/null 2>&1 ) || true
  grep -q "plugins: { 'rules-as-tests'" "$T_P1/apps/api/eslint.config.mjs" \
    && ok "P1: wirer escalated to self-contained (probe resolved eslint)" \
    || bad "P1: wirer did NOT escalate — probe degraded (broken eslint resolve? the #535 trap)"
  if ( cd "$T_P1/apps/api" && "$T_P1/node_modules/.bin/eslint" --print-config src/h.ts >/tmp/p1.out 2>/tmp/p1.err ); then
    grep -q 'rules-as-tests/no-unsafe-zod-parse' /tmp/p1.out && ok "P1: LOADS (rc 0) + R2 applied" || bad "P1: loads but R2 absent"
  else bad "P1: FAILS to load: $(head -c 160 /tmp/p1.err | tr '\n' ' ')"; fi
fi

# ── Fixture P2: plugin-REGISTERING base → bare kept, loads, no redefine ──
echo "Fixture P2: plugin-registering base → no double-registration crash"
if [ -z "$RUN_WIRER_TSX" ] || ! command -v node >/dev/null 2>&1; then ok "P2: skipped (tsx/node absent)"; else
  T_P2=$(mktemp -d); _mk_consumer "$T_P2"
  printf "import customRules from '../../eslint-rules-local/index.ts';\nconst base = [{ files: ['**/*.ts'], plugins: { 'rules-as-tests': customRules }, rules: {} }];\nexport default [...base];\n" > "$T_P2/apps/api/eslint.config.mjs"
  ( cd "$T_P2" && "$RUN_WIRER_TSX" "$WIRER" --path apps/api/eslint.config.mjs --yes >/dev/null 2>&1 ) || true
  _n2=$(grep -c "plugins: { 'rules-as-tests'" "$T_P2/apps/api/eslint.config.mjs")
  [ "$_n2" = "1" ] && ok "P2: plugin registered once (base only) — kept bare, no duplicate" || bad "P2: $_n2 'rules-as-tests' registrations (want 1) — wirer double-registered"
  ( cd "$T_P2/apps/api" && "$T_P2/node_modules/.bin/eslint" --print-config src/h.ts >/dev/null 2>/tmp/p2.err ) && ok "P2: loads rc 0 (no Cannot redefine)" || bad "P2: failed: $(head -c 160 /tmp/p2.err | tr '\n' ' ')"
fi
```

- [ ] **Step 2: Red-then-green — verify the fixture catches the bug.** Stash the Task 1-5 source changes and run P1 against the **pre-fix** wirer:

Run:
```bash
cd /Users/art/code/rules-as-tests-aif
git stash push -- packages/core/install/wire-eslint-r2.ts
bash tests/install-sh/wire-eslint-r2.test.sh; echo "rc=$?"
git stash pop
```
Expected: with the pre-fix wirer, **P1 FAILS** ("config FAILS to load: …could not find plugin"). This proves the gate is real (not theatre). Then with the fix restored, re-run → P1 + P2 PASS.

- [ ] **Step 3: Run the full harness with the fix in place**

Run: `cd /Users/art/code/rules-as-tests-aif && bash tests/install-sh/wire-eslint-r2.test.sh`
Expected: `FAIL=0`, P1 + P2 green (alongside existing D/F/X).

- [ ] **Step 4: Commit**

```bash
git add tests/install-sh/wire-eslint-r2.test.sh
git commit -m "test(install): W3 loadability gate — wired config must load in ESLint (#644)"
```

## Task 7: Fix the two manual snippets (`:52`, `:208`) to the self-contained form

**Files:**
- Modify: `packages/core/install/wire-eslint-r2.ts`
- Test: `packages/core/install/wire-eslint-r2.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { generateDegradedSnippet } from './wire-eslint-r2.ts';

describe('manual snippets are self-contained', () => {
  it('degraded snippet registers the plugin (import + plugins), not a bare rule', () => {
    const s = generateDegradedSnippet('apps/api/eslint.config.mjs');
    expect(s).toContain('eslint-rules-local');
    expect(s).toContain(`plugins: { 'rules-as-tests': customRules }`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "manual snippets"`
Expected: FAIL — current snippet is the bare form.

- [ ] **Step 3: Update both snippets.** In `generateDegradedSnippet` (`:48`) and the `unrecognised` branch (`:204`-`:209`), change the shown line from the bare form to:

```ts
`    import customRules from './eslint-rules-local/index.ts';`,
`    export default [...base, { plugins: { 'rules-as-tests': customRules }, rules: { '${R2_RULE_ID}': 'error' } }];`,
```

(Keep the `./eslint-rules-local/index.ts` path as the documented default — note in the printed text: "adjust the relative path to your eslint-rules-local/".)

- [ ] **Step 4: Run to verify it passes**

Run: `cd /Users/art/code/rules-as-tests-aif && npx vitest run packages/core/install/wire-eslint-r2.test.ts -t "manual snippets"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/install/wire-eslint-r2.ts packages/core/install/wire-eslint-r2.test.ts
git commit -m "fix(install): manual R2 snippets register the plugin (self-contained) (#644)"
```

## Task 8: Fix the false header comment in the harness (the §6 MAJOR, code side)

**Files:**
- Modify: `tests/install-sh/wire-eslint-r2.test.sh:9-10`

- [ ] **Step 1: Replace the stale comment.** The header claims a print-config integration "runs in CI via consumer-pipeline" — which runs zero ESLint. Replace lines 9-12 with an accurate description pointing at the real P1/P2 fixtures added in Task 6:

```bash
# Fixtures P1/P2 (below) are the headline red→green loadability gate: they run the wirer over a
# plugin-less / plugin-registering base and assert `eslint --print-config` LOADS (rc 0) + applies R2.
# Fixture E (format-preserved) and B/C remain vitest unit tests in wire-eslint-r2.test.ts.
```

- [ ] **Step 2: Verify no other file references the removed claim**

Run: `cd /Users/art/code/rules-as-tests-aif && grep -rn "consumer-pipeline" tests/install-sh/wire-eslint-r2.test.sh`
Expected: no match (the false cross-reference is gone).

- [ ] **Step 3: Commit**

```bash
git add tests/install-sh/wire-eslint-r2.test.sh
git commit -m "test(install): correct the false 'print-config in consumer-pipeline' comment (#644)"
```

## Task 9: W1 — update issue #644

**Files:** none (GitHub issue).

- [ ] **Step 1: Post the review findings as a comment.**

Run:
```bash
gh issue comment 644 --repo Yhooi2/rules-as-tests-aif --body "$(cat <<'EOF'
## Review findings (verified against code + reproduced on eslint v10.4.1)

**MAJOR — the real reason this passed CI.** `tests/install-sh/wire-eslint-r2.test.sh:9-10` claims a print-config integration ("runs in CI via consumer-pipeline"); `consumer-pipeline.test.sh` runs **zero** ESLint (it tests `/pipeline` discovery). The promised loadability gate never existed — the only wirer check is a `grep` for the rule string (`:130`), which a crashing config still passes. Fix ships a real gate + corrects the comment.

**Reproduced (eslint v10.4.1):** rule→unregistered-plugin = rc 2 `could not find plugin` (both lint and `--print-config`); plugin registered twice with **different objects** = rc 2 `Cannot redefine plugin`. The latter means a naive "always register" fix would crash consumers whose base already registers it → the fix is conditional. Full table: spec §2.

**MINOR:** (1) fix forward, do **not** revert #642 (re-masks R2 as inert). (2) injected import path must be **computed** per config depth, not hardcoded `../../`. Design+plan in repo.
EOF
)"
```
Expected: comment URL printed.

- [ ] **Step 2: Verify**

Run: `gh issue view 644 --repo Yhooi2/rules-as-tests-aif --comments | tail -30`
Expected: the comment is present.

## Task 10: Final verification + PR

**Files:** none.

- [ ] **Step 1: Full check.**

Run: `cd /Users/art/code/rules-as-tests-aif && npm run check:all` (or the discovery `CHECK_ALL`)
Expected: green — typecheck, lint, vitest, install-sh harness all pass.

- [ ] **Step 2: Push + PR → staging.**

```bash
git push -u origin claude/dazzling-colden-b53939
gh pr create --repo Yhooi2/rules-as-tests-aif --base staging --head claude/dazzling-colden-b53939 \
  --title "fix(install): R2 Layer-2 wirer registers the plugin so the wired config loads (#644)" \
  --body "<body with pre-marked [x] for CI-verified + harness-verified items; see Phase 4.5>"
```
Expected: PR URL. Pre-mark only items proven by CI / harness output (spec §9 acceptance); leave physically-pending items `[ ]`.

---

## Self-Review

**Spec coverage:** §4 mechanism → T1–T5; §4.5 edit sites → `:33` T1, `:52`/`:208` T7; §5 W3 → T6 (P1/P2, red-then-green); §6 W1 → T9 + T8; §7 residuals → T0 (R1/R2), File-Structure note (R3), T4 `findOrSynthProbeTarget` (R4); §9 acceptance 1–6 → T6/T3/T6-Step2/T8/T9. No gaps.

**Placeholders:** only `<body…>` in T10 (filled at PR time, Phase 4.5) — not a code placeholder; all code steps complete.

**Type consistency:** `TransformOpts.variant`/`customRulesImportPath` (T1) ↔ `wireConfigSource` (T3); `ProbeVerdict` (T3) ↔ `probeViaEslint` (T4) ↔ `runProbe` (T3); `resolveAndWire` args (T3) ↔ `main()` (T5); `customRulesImportSpecifier(configPath,cwd)` (T2) ↔ T3. Consistent.
