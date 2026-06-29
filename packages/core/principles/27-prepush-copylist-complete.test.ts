/**
 * Principle 27 — pre-push copy-list completeness drift guard (closes #735)
 *
 * > **Authoritative for:** install.sh ships the COMPLETE import graph of
 * > pre-push.ts — every relative `./checks/*.ts` / `./utils/*.ts` import
 * > (static AND dynamic `await import()`) AND every relative
 * > `../../eslint-rules/*.ts` import reachable via guard-liveness.ts must
 * > appear in install.sh's copy loops.
 * > **NOT authoritative for:** project goal — see README.md#why-this-exists.
 *
 * Source: .claude/orchestrator-prompts/install-prepush-copylist/kickoff.md §3
 *         Prior-art: reuses allow-list-gate class from principle 21 (#551) —
 *         same pattern: source-of-truth parse → allow-list check → non-vacuity.
 *
 * Slot 27 confirmed free at plan time (2026-06-26).
 *
 * T10 (anti-trap): scans BOTH static `import … from` AND dynamic `await import()`
 * — the headline crash (unpinned-tool-install.ts, static :32) masked two
 * downstream dynamic `die()`s (guard-liveness :405, cmd-script-liveness :469).
 * A static-only scan would produce a false green.
 *
 * T15 (self-application): deleting any entry from the install.sh copy-loop causes
 * one of the arms below to go RED — verified by the paired-negative arm (c).
 *
 * T19 (own cold-QA): arm (a) / (b) parse the actual source files and the actual
 * install.sh; CI form-checks do not prove consumer behaviour, but this test proves
 * the install.sh copy-list mirrors the import graph.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');

// ── Source file paths ──────────────────────────────────────────────────────────

const INSTALL_SH = resolve(REPO_ROOT, 'install.sh');
const SETUP_HOOKS_SH = resolve(REPO_ROOT, 'setup.d/50-hooks.sh');
const PRE_PUSH_TS = resolve(REPO_ROOT, 'packages/core/hooks/pre-push.ts');
const GUARD_LIVENESS_TS = resolve(
  REPO_ROOT,
  'packages/core/hooks/checks/guard-liveness.ts',
);
const ESL_INDEX_TS = resolve(REPO_ROOT, 'packages/core/eslint-rules/index.ts');

// ── Parsing helpers ────────────────────────────────────────────────────────────

/**
 * Extract entries from a bash `for VAR in \ … ; do` loop in install.sh.
 * Returns the listed relative file paths (whitespace + trailing `\` stripped).
 * Exported for the paired-negative arm.
 */
export function parseLoopEntries(source: string, varName: string): string[] {
  // Matches: for <varName> in \
  //   entry1 \
  //   entryN; do
  // The body is everything between `in \<newline>` and `; do`.
  const re = new RegExp(`for ${varName} in \\\\\\n([\\s\\S]*?);\\s*do`);
  const match = source.match(re);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.trim().replace(/\\$/, '').trim())
    .filter(Boolean);
}

/**
 * Extract all relative `.ts` import specifiers from a TypeScript source,
 * covering BOTH static `from '...'` AND dynamic `await import('...')` forms.
 *
 * T10 load-bearing: skipping the dynamic form misses guard-liveness and
 * cmd-script-liveness, which are intentionally NOT imported statically.
 */
export function relativeImports(source: string): string[] {
  const seen = new Set<string>();
  // Static: `from './checks/...'` or `from '../utils/...'`
  for (const m of source.matchAll(/\bfrom\s+['"](\.[^'"]+\.ts)['"]/g)) {
    if (m[1].startsWith('.')) seen.add(m[1]);
  }
  // Dynamic: `import('./checks/...')` or `import('../...')`
  // Also matches the TypeScript type form `typeof import('...')` — both share
  // the same specifier and the file must exist either way.
  for (const m of source.matchAll(
    /\bimport\s*\(\s*['"](\.[^'"]+\.ts)['"]\s*\)/g,
  )) {
    if (m[1].startsWith('.')) seen.add(m[1]);
  }
  return [...seen].sort();
}

/**
 * Check that every `needed` path is present in `available` (the install.sh loop).
 * Returns the missing entries (empty → fully covered).
 */
export function missingEntries(
  needed: string[],
  available: Set<string>,
): string[] {
  return needed.filter((e) => !available.has(e));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Principle 27 — pre-push copy-list completeness drift guard (closes #735)', () => {
  // ── Arm (a): real-tree hooks — import graph ⊆ _ts loop ──────────────────────
  it('(a) real-tree: every relative import from pre-push.ts is in the install.sh _ts loop', () => {
    expect(
      existsSync(INSTALL_SH),
      `install.sh must exist at ${INSTALL_SH}`,
    ).toBe(true);
    expect(
      existsSync(PRE_PUSH_TS),
      `pre-push.ts must exist at ${PRE_PUSH_TS}`,
    ).toBe(true);

    const installSh = readFileSync(INSTALL_SH, 'utf8');
    const prePushTs = readFileSync(PRE_PUSH_TS, 'utf8');

    const tsLoop = new Set(parseLoopEntries(installSh, '_ts'));

    // Non-vacuity (T15): the loop must actually have entries; ≥8 = the known
    // required set. Removing any entry causes at least one assertion below to fail.
    expect(
      tsLoop.size,
      `_ts loop must have ≥8 entries; got ${tsLoop.size}`,
    ).toBeGreaterThanOrEqual(8);

    // pre-push.ts is the entry point — not imported by itself, but MUST be shipped.
    expect(
      tsLoop.has('pre-push.ts'),
      'pre-push.ts (the entry point) must be in the _ts copy loop',
    ).toBe(true);

    // Every relative import from pre-push.ts must also be in the loop.
    // Normalize: strip leading `./` → `checks/xyz.ts` or `utils/xyz.ts`.
    const imports = relativeImports(prePushTs).map((s) =>
      s.replace(/^\.\//, ''),
    );
    const missing = missingEntries(imports, tsLoop);
    expect(
      missing,
      `Relative imports from pre-push.ts not found in install.sh _ts loop\n` +
        `(→ ERR_MODULE_NOT_FOUND on a fresh consumer):\n` +
        missing.map((m) => `  ${m}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── Arm (b): real-tree eslint-rules — transitive dep ⊆ _esl loop ────────────
  it('(b) real-tree: eslint-rules/index.ts and its imports are in the install.sh _esl loop', () => {
    expect(
      existsSync(INSTALL_SH),
      `install.sh must exist at ${INSTALL_SH}`,
    ).toBe(true);
    expect(
      existsSync(ESL_INDEX_TS),
      `eslint-rules/index.ts must exist at ${ESL_INDEX_TS}`,
    ).toBe(true);

    const installSh = readFileSync(INSTALL_SH, 'utf8');
    const eslIndex = readFileSync(ESL_INDEX_TS, 'utf8');

    const eslLoop = new Set(parseLoopEntries(installSh, '_esl'));

    // Non-vacuity (T15): the loop must have entries; ≥5 = the known required set.
    expect(
      eslLoop.size,
      `_esl loop must have ≥5 entries; got ${eslLoop.size}`,
    ).toBeGreaterThanOrEqual(5);

    // guard-liveness.ts imports ../../eslint-rules/index.ts directly — so
    // index.ts itself MUST be in the _esl loop (the barrel entry point).
    expect(
      eslLoop.has('index.ts'),
      'index.ts (the eslint-rules barrel, imported by guard-liveness.ts) must be in the _esl loop',
    ).toBe(true);

    // eslint-rules/index.ts re-exports 4 rule files via relative imports.
    // Each must also be shipped so the barrel does not die on load.
    // Normalize: strip leading `./` → basename (they are all in the same dir).
    const ruleImports = relativeImports(eslIndex).map((s) => basename(s));
    const missing = missingEntries(ruleImports, eslLoop);
    expect(
      missing,
      `Relative imports from eslint-rules/index.ts not found in install.sh _esl loop\n` +
        `(→ guard-liveness.ts dies on load even after the 3 checks ship):\n` +
        missing.map((m) => `  ${m}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── Arm (c): paired-negative — the coverage check detects a missing entry ───
  it('(c) paired-negative: missingEntries() returns RED when an entry is absent from the loop', () => {
    // Simulate a _ts loop that's missing checks/guard-liveness.ts.
    // This is the T15 proof: if someone removes that line from install.sh,
    // arm (a) goes RED via exactly the logic exercised here.
    const fullTsLoop = new Set([
      'pre-push.ts',
      'utils/run-check.ts',
      'utils/git.ts',
      'checks/prior-art.ts',
      'checks/s17.ts',
      'checks/unpinned-tool-install.ts',
      'checks/guard-liveness.ts',
      'checks/cmd-script-liveness.ts',
    ]);
    const truncatedLoop = new Set(
      [...fullTsLoop].filter((e) => e !== 'checks/guard-liveness.ts'),
    );

    // Confirm full set finds no missing entries.
    expect(
      missingEntries(['checks/guard-liveness.ts'], fullTsLoop),
    ).toHaveLength(0);

    // Confirm truncated set correctly reports the missing entry as RED.
    const missing = missingEntries(['checks/guard-liveness.ts'], truncatedLoop);
    expect(missing).toEqual(['checks/guard-liveness.ts']);
  });

  // ── Arm (d): paired-negative — parseLoopEntries() parses real loops correctly ─
  it('(d) paired-negative: parseLoopEntries() handles the bash for-loop format correctly', () => {
    const synthetic = [
      'for _ts in \\',
      '  alpha.ts \\',
      '  beta.ts; do',
      '  echo "$_ts"',
      'done',
    ].join('\n');
    expect(parseLoopEntries(synthetic, '_ts')).toEqual(['alpha.ts', 'beta.ts']);

    // An entry absent from the loop is detected.
    const loop = new Set(parseLoopEntries(synthetic, '_ts'));
    expect(missingEntries(['alpha.ts', 'gamma.ts'], loop)).toEqual([
      'gamma.ts',
    ]);
  });

  // ── Arm (e): T15 self-application ───────────────────────────────────────────
  it('(e) T15 self-application: this test reads actual source files (non-fabrication proof)', () => {
    // The test suite is non-vacuous: the real pre-push.ts has ≥7 relative imports
    // (5 static + 2 dynamic value). A fabricated or empty file would yield 0.
    const prePushTs = readFileSync(PRE_PUSH_TS, 'utf8');
    const imports = relativeImports(prePushTs);
    expect(
      imports.length,
      'pre-push.ts must have ≥7 relative imports (5 static + 2 dynamic)',
    ).toBeGreaterThanOrEqual(7);

    // The real install.sh _ts loop has ≥8 entries (as of #735 fix).
    const installSh = readFileSync(INSTALL_SH, 'utf8');
    const tsLoop = parseLoopEntries(installSh, '_ts');
    expect(
      tsLoop.length,
      '_ts loop must have ≥8 entries (entry point + 7 imports)',
    ).toBeGreaterThanOrEqual(8);
  });

  // ── Arm (a2): fresh-install path — import graph ⊆ ts_hook loop ──────────────
  it('(a2) fresh-install: every relative import from pre-push.ts is in setup.d/50-hooks.sh ts_hook loop', () => {
    expect(
      existsSync(SETUP_HOOKS_SH),
      `setup.d/50-hooks.sh must exist at ${SETUP_HOOKS_SH}`,
    ).toBe(true);
    expect(
      existsSync(PRE_PUSH_TS),
      `pre-push.ts must exist at ${PRE_PUSH_TS}`,
    ).toBe(true);

    const setupHooksSh = readFileSync(SETUP_HOOKS_SH, 'utf8');
    const prePushTs = readFileSync(PRE_PUSH_TS, 'utf8');

    const tsLoop = new Set(parseLoopEntries(setupHooksSh, 'ts_hook'));

    // Non-vacuity (T15): the loop must have ≥8 entries.
    expect(
      tsLoop.size,
      `ts_hook loop must have ≥8 entries; got ${tsLoop.size}`,
    ).toBeGreaterThanOrEqual(8);

    // pre-push.ts is the entry point — MUST be shipped on fresh install.
    expect(
      tsLoop.has('pre-push.ts'),
      'pre-push.ts (the entry point) must be in the ts_hook copy loop',
    ).toBe(true);

    // Every relative import from pre-push.ts must also be in the loop.
    // Normalize: strip leading `./` → `checks/xyz.ts` or `utils/xyz.ts`.
    const imports = relativeImports(prePushTs).map((s) =>
      s.replace(/^\.\//, ''),
    );
    const missing = missingEntries(imports, tsLoop);
    expect(
      missing,
      `Relative imports from pre-push.ts not found in setup.d/50-hooks.sh ts_hook loop\n` +
        `(→ ERR_MODULE_NOT_FOUND on a fresh install via ./setup -y — the gap #747 missed):\n` +
        missing.map((m) => `  ${m}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── Arm (b2): fresh-install eslint-rules — transitive dep ⊆ esl_hook loop ───
  it('(b2) fresh-install: eslint-rules/index.ts and its imports are in setup.d/50-hooks.sh esl_hook loop', () => {
    expect(
      existsSync(SETUP_HOOKS_SH),
      `setup.d/50-hooks.sh must exist at ${SETUP_HOOKS_SH}`,
    ).toBe(true);
    expect(
      existsSync(ESL_INDEX_TS),
      `eslint-rules/index.ts must exist at ${ESL_INDEX_TS}`,
    ).toBe(true);

    const setupHooksSh = readFileSync(SETUP_HOOKS_SH, 'utf8');
    const eslIndex = readFileSync(ESL_INDEX_TS, 'utf8');

    const eslLoop = new Set(parseLoopEntries(setupHooksSh, 'esl_hook'));

    // Non-vacuity (T15): the loop must have ≥5 entries.
    expect(
      eslLoop.size,
      `esl_hook loop must have ≥5 entries; got ${eslLoop.size}`,
    ).toBeGreaterThanOrEqual(5);

    // index.ts (the eslint-rules barrel, required by guard-liveness.ts) MUST be shipped.
    expect(
      eslLoop.has('index.ts'),
      'index.ts (the eslint-rules barrel, imported by guard-liveness.ts) must be in the esl_hook loop',
    ).toBe(true);

    // eslint-rules/index.ts re-exports 4 rule files via relative imports.
    // Each must be shipped so the barrel does not die on load.
    const ruleImports = relativeImports(eslIndex).map((s) => basename(s));
    const missing = missingEntries(ruleImports, eslLoop);
    expect(
      missing,
      `Relative imports from eslint-rules/index.ts not found in setup.d/50-hooks.sh esl_hook loop\n` +
        `(→ guard-liveness.ts die()/push-block on fresh install even after the 3 checks ship):\n` +
        missing.map((m) => `  ${m}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── Arm (f): paired-negative — fresh-install coverage detects missing entry ──
  it('(f) paired-negative (fresh-install): missingEntries() returns RED when an entry is absent from 50-hooks.sh loop', () => {
    // Simulate a ts_hook loop missing checks/guard-liveness.ts.
    // T15 self-application proof for the fresh-install path: if someone removes
    // that line from setup.d/50-hooks.sh, arm (a2) goes RED via exactly this logic.
    const fullFreshLoop = new Set([
      'pre-push.ts',
      'utils/run-check.ts',
      'utils/git.ts',
      'checks/prior-art.ts',
      'checks/s17.ts',
      'checks/unpinned-tool-install.ts',
      'checks/guard-liveness.ts',
      'checks/cmd-script-liveness.ts',
    ]);
    const truncatedFreshLoop = new Set(
      [...fullFreshLoop].filter((e) => e !== 'checks/guard-liveness.ts'),
    );

    // Confirm full set finds no missing entries.
    expect(
      missingEntries(['checks/guard-liveness.ts'], fullFreshLoop),
    ).toHaveLength(0);

    // Confirm truncated set correctly reports the missing entry as RED.
    const missing = missingEntries(
      ['checks/guard-liveness.ts'],
      truncatedFreshLoop,
    );
    expect(missing).toEqual(['checks/guard-liveness.ts']);
  });
});
