#!/usr/bin/env -S node --experimental-strip-types
/**
 * wire-eslint-r2.ts — GH #547 Layer 2 (migration-ast Stage 4)
 * AST-wires R2 (rules-as-tests/no-unsafe-zod-parse) into a consumer's ESLint
 * flat-config (.mjs). Uses ts-morph for targeted minimal-edit with format
 * preservation (Fixture E invariant: unchanged lines are byte-identical).
 *
 * Ensure-then-use: install.sh's bash probe checks node AND the consumer's
 * node_modules/ts-morph BEFORE calling this script. Both that probe and this
 * module's :86 import resolve ts-morph from the consumer's cwd, NOT the framework
 * checkout this file lives in (GH #642). The import still degrades gracefully on
 * failure as a belt-and-suspenders (genuine consumer-absence path).
 *
 * @cc-only-rationale: runs in consumer context after --full dep-install; the
 *   bash probe is the primary gatekeeper; this degrade is secondary belt.
 *
 * Prior-art: prior-art-evaluations.md#131 (ts-morph REUSE),
 *            prior-art-evaluations.md#132 (cargo format-preservation REFERENCE),
 *            prior-art-evaluations.md#133 (astro/shadcn UX ADOPT VOCABULARY),
 *            prior-art-evaluations.md#134 (magicast REJECT as engine),
 *            prior-art-evaluations.md#135 (this wirer BUILD),
 *            prior-art-evaluations.md#117 (--wire-ci posture ADOPT),
 *            prior-art-evaluations.md#118 (check:enforced oracle ADOPT)
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const R2_RULE_ID = 'rules-as-tests/no-unsafe-zod-parse';

export type TransformVariant = 'bare' | 'self-contained';
export interface TransformOpts {
  variant?: TransformVariant;
  customRulesImportPath?: string; // required when variant === 'self-contained'
}

function r2Element(variant: TransformVariant): string {
  return variant === 'self-contained'
    ? `{ plugins: { 'rules-as-tests': customRules }, rules: { '${R2_RULE_ID}': 'error' } }`
    : `{ rules: { '${R2_RULE_ID}': 'error' } }`;
}

/**
 * Relative import specifier from a per-package config to the consumer-root
 * eslint-rules-local barrel (install.sh ships it at <root>/eslint-rules-local/index.ts).
 * Computed per config depth — never hardcoded.
 */
export function customRulesImportSpecifier(configPath: string, cwd: string): string {
  const target = resolve(cwd, 'eslint-rules-local/index.ts');
  let rel = relative(dirname(resolve(configPath)), target);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

export interface WireOpts {
  assumeYes?: boolean;
  dryRun?: boolean;
  diffOnly?: boolean;
}

export interface WireResult {
  status: 'wired' | 'already-wired' | 'degrade' | 'unrecognised';
  original: string;
  modified: string;
  degradeReason?: string;
  variant?: TransformVariant;
}

export function generateDegradedSnippet(configPath: string): string {
  return [
    `· R2 not auto-wired: AST editor unavailable (Node or ts-morph not present).`,
    `  Add to ${configPath}:`,
    `    export default [...base, { rules: { '${R2_RULE_ID}': 'error' } }];`,
    `  (or run ./install.sh ts-server --full to install dev-deps and auto-wire)`,
  ].join('\n');
}

function buildLineDiff(original: string, modified: string): string {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const out: string[] = [];
  const max = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < max; i++) {
    if (i >= origLines.length) {
      out.push(`+ ${modLines[i]}`);
    } else if (i >= modLines.length) {
      out.push(`- ${origLines[i]}`);
    } else if (origLines[i] !== modLines[i]) {
      out.push(`- ${origLines[i]}`);
      out.push(`+ ${modLines[i]}`);
    }
  }
  return out.join('\n');
}

/**
 * Core wiring logic. Pure function over file source text — no I/O.
 * Uses dynamic ts-morph import so the module loads without crashing when
 * ts-morph is absent (degrade path).
 */
export async function wireConfigSource(source: string, opts: TransformOpts = {}): Promise<WireResult> {
  // Idempotency: if R2 already referenced, bail early (byte-identical)
  if (source.includes(R2_RULE_ID)) {
    return { status: 'already-wired', original: source, modified: source };
  }

  // Dynamic import resolved from process.cwd(), NOT this file's directory.
  // install.sh runs the wirer from the framework checkout (PKG_ROOT/packages/core/
  // install/wire-eslint-r2.ts) with cwd=consumer-root. A bare `import('ts-morph')`
  // resolves relative to the importing FILE (the framework tree) — so it would miss
  // the consumer's freshly-installed ts-morph and falsely degrade (GH #642). Anchor
  // resolution to the consumer's cwd so the engine installed by `--full` is found.
  let Project: any;
  let SyntaxKind: any;
  try {
    const requireFromCwd = createRequire(resolve(process.cwd(), 'package.json'));
    const tsMorphPath = requireFromCwd.resolve('ts-morph'); // resolves from <cwd>/node_modules
    const mod = await import(pathToFileURL(tsMorphPath).href); // file URL — raw abs path → ERR_UNSUPPORTED_ESM_URL_SCHEME
    Project = mod.Project;
    SyntaxKind = mod.SyntaxKind;
  } catch {
    return {
      status: 'degrade',
      original: source,
      modified: source,
      degradeReason: 'ts-morph import failed',
    };
  }

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      allowJs: true,
      target: 99 /* ESNext */,
      module: 99 /* ESNext */,
    },
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
  });

  const sf = project.createSourceFile('eslint.config.mjs', source, { overwrite: true });

  // Find: export default <expr>
  const exportAssignment = sf.getExportAssignment((ea: any) => !ea.isExportEquals());
  if (!exportAssignment) {
    return { status: 'unrecognised', original: source, modified: source };
  }

  const expr = exportAssignment.getExpression();

  const variant = opts.variant ?? 'bare';
  const element = r2Element(variant);

  if (expr.isKind(SyntaxKind.ArrayLiteralExpression)) {
    // export default [...] or export default [...base, {...}]
    // addElement appends while preserving existing element formatting
    (expr as any).addElement(element);
  } else if (expr.isKind(SyntaxKind.Identifier)) {
    // export default base → export default [...base, R2]
    exportAssignment.setExpression(`[...${expr.getText()}, ${element}]`);
  } else if (expr.isKind(SyntaxKind.CallExpression)) {
    // export default defineConfig([...]) or similar
    const callExpr = expr as any;
    const args = callExpr.getArguments();
    if (args.length > 0 && args[0].isKind(SyntaxKind.ArrayLiteralExpression)) {
      args[0].addElement(element);
    } else {
      return { status: 'unrecognised', original: source, modified: source };
    }
  } else {
    // Unrecognised — bail safely, never partial-edit
    return { status: 'unrecognised', original: source, modified: source };
  }

  // self-contained variant must also register the plugin → inject the customRules import
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

  const modified = sf.getFullText();
  return { status: 'wired', original: source, modified, variant };
}

// ─── Probe-driven resolution (try-bare → escalate → degrade) ────────────────────

export type ProbeVerdict = 'ok' | 'could-not-find-plugin' | 'unavailable' | 'other-error';

export interface ResolveWireArgs {
  configPath: string;
  cwd: string;
  runProbe: (configPath: string, cwd: string) => Promise<ProbeVerdict>;
}

/**
 * Write the bare element, ask ESLint (via runProbe) whether the config loads, and escalate to
 * the self-contained (plugin-registering) element ONLY on `could-not-find-plugin`. Bare never
 * registers a plugin → "Cannot redefine plugin" is unreachable by construction. Any non-ok
 * terminal verdict restores the original (no half-edit). GH #644.
 */
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

  // 3. escalate: self-contained (only when the base registers the plugin nowhere)
  if (v1 === 'could-not-find-plugin') {
    const spec = customRulesImportSpecifier(configPath, cwd);
    const sc = await wireConfigSource(original, { variant: 'self-contained', customRulesImportPath: spec });
    if (sc.status === 'wired') {
      writeFileSync(configPath, sc.modified, 'utf8');
      const v2 = await runProbe(configPath, cwd);
      if (v2 === 'ok') return { ...sc, variant: 'self-contained' };
    }
  }

  // 4. degrade: restore, never leave a half-edit
  writeFileSync(configPath, original, 'utf8');
  return { status: 'degrade', original, modified: original, degradeReason: `probe verdict: ${v1}` };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log([
      'wire-eslint-r2 — wire R2 (rules-as-tests/no-unsafe-zod-parse) into eslint.config.mjs',
      '',
      'Usage: npx tsx wire-eslint-r2.ts [options]',
      '  --path <file>   Config to wire (default: ./eslint.config.mjs)',
      '  --yes           Auto-apply without confirmation',
      '  --dry-run       Print what would change, no write',
      '  --diff          Print diff and exit (no write, no prompt)',
    ].join('\n'));
    process.exit(0);
  }

  const pathIdx = argv.indexOf('--path');
  const configPath = resolve(pathIdx >= 0 ? argv[pathIdx + 1] : './eslint.config.mjs');
  const assumeYes = argv.includes('--yes');
  const dryRun = argv.includes('--dry-run');
  const diffOnly = argv.includes('--diff');

  // Belt-and-suspenders degrade: bash probe should have checked this already
  if (!existsSync('node_modules/ts-morph/package.json')) {
    console.log(generateDegradedSnippet(configPath));
    process.exit(0);
  }

  if (!existsSync(configPath)) {
    console.log(`· wire-eslint-r2: ${configPath} not found — skipped`);
    process.exit(0);
  }

  const source = readFileSync(configPath, 'utf8');
  const result = await wireConfigSource(source);

  switch (result.status) {
    case 'already-wired':
      console.log(`· R2 already enforced in ${configPath} (no change)`);
      process.exit(0);
      break;

    case 'degrade':
      console.log(generateDegradedSnippet(configPath));
      process.exit(0);
      break;

    case 'unrecognised':
      console.log([
        `· R2 not auto-wired: ${configPath} uses an unrecognised export shape.`,
        `  Add manually:`,
        `    export default [...yourConfig, { rules: { '${R2_RULE_ID}': 'error' } }];`,
      ].join('\n'));
      process.exit(0);
      break;

    case 'wired': {
      const diff = buildLineDiff(result.original, result.modified);
      if (dryRun || diffOnly) {
        console.log(`Diff for ${configPath}:\n${diff}`);
        process.exit(0);
      }

      console.log(`\nProposed change to ${configPath}:\n`);
      console.log(diff);
      console.log('');

      let apply = assumeYes;
      if (!apply) {
        if (!process.stdin.isTTY) {
          // Non-interactive without --yes → degrade to manual snippet
          console.log(generateDegradedSnippet(configPath));
          process.exit(0);
        }
        const { createInterface } = await import('node:readline');
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((resolve) => {
          rl.question('Apply this change? [y/N] ', resolve);
        });
        rl.close();
        apply = /^y(es)?$/i.test(answer.trim());
      }

      if (apply) {
        writeFileSync(configPath, result.modified, 'utf8');
        console.log(`  ✓ R2 wired into ${configPath}`);
      } else {
        console.log(generateDegradedSnippet(configPath));
      }
      process.exit(0);
      break;
    }
  }
}

// Only run as CLI entry point; when imported as a module, skip main()
if (process.argv[1] && process.argv[1].endsWith('wire-eslint-r2.ts')) {
  main().catch((err) => {
    console.error('wire-eslint-r2 fatal:', err);
    process.exit(0); // rc=0 even on crash — install must not abort
  });
}
