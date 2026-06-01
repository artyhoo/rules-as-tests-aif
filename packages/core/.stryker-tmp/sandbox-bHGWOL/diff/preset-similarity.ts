// @ts-nocheck
// Phase 8 — preset similarity metric (deterministic, no deps).
// Per phase-8-research.md §3: weighted score over rule presence (0.40),
// ESLint config keys (0.40), and applies-to glob coverage (0.20). Acceptance
// threshold for Phase 8 canonical regen is 0.95 (≤5% diff).
//
// Calibration corpus `preset-similarity.calibration.test.ts` (Phase 9 A8) serves
// as **regression guard** for the weights formula — 5 mutants × 3 dimensions
// verify the formula behaves as designed. Statistical calibration of
// `0.40/0.40/0.20` values requires real divergent-plan data per
// docs/meta-factory/retros/phase-8.md Self-reflection #9; the corpus does NOT
// validate the weight values themselves. Tweaks to W_* require updating the
// corpus's expected-score column.

import type { SynthesisPlan } from '../synthesizer/types.ts';

const W_RULES = 0.4;
const W_KEYS = 0.4;
const W_GLOBS = 0.2;
export const ACCEPTANCE_THRESHOLD = 0.95;

export interface SimilarityScore {
  similarity: number;
  components: { ruleIds: number; eslintKeys: number; globOverlap: number };
}

export const FILE_CORPUS: readonly string[] = [
  'src/app/page.tsx', 'src/app/layout.tsx', 'src/app/actions.ts',
  'src/app/(group)/post/[id]/page.tsx', 'src/app/api/health/route.ts',
  'src/components/Card.tsx', 'src/components/Header.tsx',
  'src/lib/actions/createPost.ts', 'src/lib/utils.ts', 'src/hooks/useAuth.ts',
  'pages/index.tsx', 'pages/api/legacy.ts',
  'app/dashboard/page.tsx', 'app/login/actions.ts',
  'middleware.ts', 'proxy.ts', 'next.config.ts',
  'package.json', 'tsconfig.json', 'vitest.config.ts',
];

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 1.0 : intersection / union;
}

function ruleKeys(p: SynthesisPlan): Set<string> {
  return new Set(p.rules.map((r) =>
    r.check.type === 'eslint' ? r.check.rule : `${r.check.type}:${r.research.entryId}`));
}

function eslintKeys(p: SynthesisPlan): Set<string> {
  try { return new Set(Object.keys(JSON.parse(p.eslintConfigSnippet) as object)); }
  catch { return new Set(); }
}

function globToRegex(g: string): RegExp {
  let r = '^';
  for (let i = 0; i < g.length; i += 1) {
    const c = g[i];
    // `**/` matches zero or more directory segments (incl. the trailing `/`).
    // Distinct from `**` alone: the latter is consumed by `.*` and may cross
    // path separators, but cannot stand in for the literal `/` that follows.
    if (c === '*' && g[i + 1] === '*' && g[i + 2] === '/') { r += '(?:.*/)?'; i += 2; }
    else if (c === '*' && g[i + 1] === '*') { r += '.*'; i += 1; }
    else if (c === '*') r += '[^/]*';
    else if (c === '?') r += '[^/]';
    else if (c === '{') {
      const close = g.indexOf('}', i);
      if (close === -1) { r += '\\{'; continue; }
      const opts = g.slice(i + 1, close).split(',');
      r += `(${opts.map((o) => o.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('|')})`;
      i = close;
    } else r += /[.+^${}()|[\]\\]/.test(c) ? '\\' + c : c;
  }
  return new RegExp(r + '$');
}

function expandGlobs(p: SynthesisPlan, corpus: readonly string[]): Set<string> {
  const globs = p.rules.flatMap((r) => r['applies-to'] ?? []);
  if (globs.length === 0) return new Set();
  const rxs = globs.map(globToRegex);
  return new Set(corpus.filter((f) => rxs.some((rx) => rx.test(f))));
}

export function presetSimilarity(
  a: SynthesisPlan, b: SynthesisPlan, corpus: readonly string[] = FILE_CORPUS,
): SimilarityScore {
  const ruleIds = jaccard(ruleKeys(a), ruleKeys(b));
  const eK = jaccard(eslintKeys(a), eslintKeys(b));
  const gO = jaccard(expandGlobs(a, corpus), expandGlobs(b, corpus));
  return { similarity: W_RULES * ruleIds + W_KEYS * eK + W_GLOBS * gO,
    components: { ruleIds, eslintKeys: eK, globOverlap: gO } };
}

export function meetsAcceptance(s: number, threshold = ACCEPTANCE_THRESHOLD): boolean {
  return s >= threshold;
}
