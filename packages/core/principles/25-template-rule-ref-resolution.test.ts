/*
 * Principle 25 — shipped eslint.config templates may not reference a dangling rule.
 *
 * Every `rules-as-tests/<id>` referenced in a shipped consumer eslint.config template MUST
 * resolve to a rule exported by the barrel(s) that consumer receives: the universal core
 * barrel (packages/core/eslint-rules) PLUS, for a preset-scoped template, that preset's own
 * eslint-rules barrel. A reference with no backing export crashes the consumer's ESLint with
 * "Definition for rule 'rules-as-tests/<id>' was not found".
 *
 * The missing channel: this exact regression shipped once. S3 of generator-require-composite-tier
 * migrated R8 (require-otel-span) from a handwritten core rule to a declarative recipe and
 * DELETED the handwritten rule + its core-barrel export — but left three templates referencing
 * `rules-as-tests/require-otel-span` inside opt-in (`AIF_STRICT_RUNTIME=1`) blocks. CI never
 * loaded those opt-in blocks, so no gate caught it. This principle is that gate.
 *
 * unresolvedRefs() is PURE (template source + the set of available rule ids) so it runs on the
 * real tree (must be GREEN) AND on inline paired-negative inputs (a deliberately-dangling ref
 * must be RED) — the principle-02 paired-negative discipline that makes the gate non-tautological.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');

/** Rule ids referenced in a template that are NOT in the available export set. */
export function unresolvedRefs(templateSource: string, available: Set<string>): string[] {
  const ids = new Set(
    [...templateSource.matchAll(/rules-as-tests\/([a-z0-9-]+)/g)].map((m) => m[1]),
  );
  return [...ids].filter((id) => !available.has(id));
}

/**
 * Rule ids exported by an eslint-rules barrel index.ts. The barrel's `rules` map entries are
 * `'<id>': <identifier>,` — quoted key, identifier value. meta keys (`name:`/`version:`) are
 * unquoted, so the quoted-key→identifier-value shape excludes them.
 */
function barrelKeys(indexPath: string): Set<string> {
  if (!existsSync(indexPath)) return new Set();
  const src = readFileSync(indexPath, 'utf8');
  return new Set([...src.matchAll(/^\s*'([a-z0-9-]+)':\s*[A-Za-z]/gm)].map((m) => m[1]));
}

const CORE_BARREL = resolve(REPO_ROOT, 'packages/core/eslint-rules/index.ts');

/**
 * Discover shipped eslint.config templates and the barrel scope each one resolves against.
 *  - `templates/<x>/eslint.config*.mjs`            → core barrel only
 *  - `packages/<pkg>/templates/eslint.config*.mjs` → core barrel ∪ packages/<pkg>/eslint-rules
 */
function shippedTemplates(): { path: string; scope: string[] }[] {
  const out: { path: string; scope: string[] }[] = [];
  const isCfg = (f: string) => /^eslint\.config.*\.mjs$/.test(f);

  // Top-level templates/<x>/ — core scope.
  const topRoot = resolve(REPO_ROOT, 'templates');
  if (existsSync(topRoot)) {
    for (const d of readdirSync(topRoot, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const dir = resolve(topRoot, d.name);
      for (const f of readdirSync(dir).filter(isCfg)) {
        out.push({ path: resolve(dir, f), scope: [CORE_BARREL] });
      }
    }
  }

  // Preset packages/<pkg>/templates/ — core ∪ that preset's own eslint-rules barrel.
  const pkgRoot = resolve(REPO_ROOT, 'packages');
  for (const d of readdirSync(pkgRoot, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const tmplDir = resolve(pkgRoot, d.name, 'templates');
    if (!existsSync(tmplDir)) continue;
    const presetBarrel = resolve(pkgRoot, d.name, 'eslint-rules/index.ts');
    const scope = existsSync(presetBarrel) ? [CORE_BARREL, presetBarrel] : [CORE_BARREL];
    for (const f of readdirSync(tmplDir).filter(isCfg)) {
      out.push({ path: resolve(tmplDir, f), scope });
    }
  }
  return out;
}

describe('Principle 25 — no dangling rule refs in shipped eslint.config templates', () => {
  // ── (a) real-tree — every template ref resolves to a backing barrel export ───
  it('(a) real-tree: every rules-as-tests/<id> in a shipped template resolves', () => {
    const templates = shippedTemplates();
    expect(templates.length, 'expected to discover shipped eslint.config templates').toBeGreaterThan(0);

    const dangling: string[] = [];
    for (const { path, scope } of templates) {
      const available = new Set<string>();
      for (const barrel of scope) for (const k of barrelKeys(barrel)) available.add(k);
      const src = readFileSync(path, 'utf8');
      for (const id of unresolvedRefs(src, available)) {
        dangling.push(`${path.replace(REPO_ROOT + '/', '')} → rules-as-tests/${id}`);
      }
    }
    expect(
      dangling,
      `Dangling template rule refs (no backing barrel export):\n` + dangling.map((d) => `  ${d}`).join('\n'),
    ).toHaveLength(0);
  });

  // ── (b) PAIRED-NEGATIVE (principle-02) — a dangling ref MUST be caught ────────
  it('(b) paired-negative: a deliberately-dangling ref is flagged; a backed ref passes', () => {
    const available = new Set(['present-rule']);
    expect(
      unresolvedRefs("'rules-as-tests/zzz-missing-rule': 'error'", available),
    ).toEqual(['zzz-missing-rule']);
    expect(unresolvedRefs("'rules-as-tests/present-rule': 'error'", available)).toEqual([]);
  });

  // ── (c) coverage assertion — the historically-regressed rule is checked ──────
  it('(c) coverage: require-otel-span is referenced by ≥1 template and must resolve', () => {
    const templates = shippedTemplates();
    const refsOtel = templates.filter((t) => /rules-as-tests\/require-otel-span/.test(readFileSync(t.path, 'utf8')));
    expect(refsOtel.length, 'require-otel-span must still be referenced by a shipped template').toBeGreaterThan(0);
    const coreKeys = barrelKeys(CORE_BARREL);
    expect(
      coreKeys.has('require-otel-span'),
      'require-otel-span must be exported by the core barrel (it is a universal rule referenced by ts-server/next/spa templates)',
    ).toBe(true);
  });
});
