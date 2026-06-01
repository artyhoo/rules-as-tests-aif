// @ts-nocheck
// B1 fix — semantic merge for SynthesisPlan.eslintConfigSnippet.
// Phase 6 used Object.assign which silently last-write-wins; recipe
// expansion (Phase 8 R12/R14/R20 candidates) is likely to produce
// two recipes both configuring 'no-restricted-imports' for different
// modules, which would silently shadow under Object.assign.
//
// Strategy:
// - 'no-restricted-imports' has a known shape ['severity', { paths: [...] }]
//   → merge paths[] arrays, dedupe by `name`; severity = 'error' if either side is 'error'.
// - Every other rule: collision is treated as authoring error and throws.
//   Future merge strategies for additional rules can be added here per case.

export class RuleCollisionError extends Error {
  constructor(
    public readonly ruleName: string,
    public readonly sources: string[],
    detail: string,
  ) {
    super(
      `eslintRuleConfig collision on '${ruleName}' across recipes [${sources.join(', ')}]: ${detail}`,
    );
    this.name = 'RuleCollisionError';
  }
}

interface RestrictedImportsPath {
  name: string;
  message?: string;
  importNames?: string[];
}

interface RestrictedImportsOptions {
  paths?: RestrictedImportsPath[];
  patterns?: unknown[];
}

type RestrictedImportsConfig = [
  'error' | 'warn' | 'off' | number,
  RestrictedImportsOptions?,
];

function isRestrictedImportsTuple(value: unknown): value is RestrictedImportsConfig {
  return Array.isArray(value) && value.length >= 1;
}

function mergeNoRestrictedImports(
  a: unknown,
  b: unknown,
  sources: string[],
  newSource: string,
): RestrictedImportsConfig {
  if (!isRestrictedImportsTuple(a) || !isRestrictedImportsTuple(b)) {
    throw new RuleCollisionError(
      'no-restricted-imports',
      [...sources, newSource],
      'one or both recipes use a non-tuple shape; semantic merge requires the standard ["error", { paths: [...] }] form',
    );
  }
  const [sevA, optsA] = a;
  const [sevB, optsB] = b;
  const dedup = new Map<string, RestrictedImportsPath>();
  for (const p of optsA?.paths ?? []) dedup.set(p.name, p);
  for (const p of optsB?.paths ?? []) {
    if (!dedup.has(p.name)) dedup.set(p.name, p);
  }
  const severity =
    sevA === 'error' || sevB === 'error' ? 'error' : sevA;
  return [severity, { paths: Array.from(dedup.values()) }];
}

export function mergeEslintRuleConfig(
  acc: Record<string, unknown>,
  next: Record<string, unknown>,
  newSource: string,
  ruleSources: Map<string, string[]>,
): void {
  for (const [ruleName, ruleConfig] of Object.entries(next)) {
    const existingSources = ruleSources.get(ruleName) ?? [];
    if (!(ruleName in acc)) {
      acc[ruleName] = ruleConfig;
      ruleSources.set(ruleName, [...existingSources, newSource]);
      continue;
    }
    if (ruleName === 'no-restricted-imports') {
      acc[ruleName] = mergeNoRestrictedImports(
        acc[ruleName],
        ruleConfig,
        existingSources,
        newSource,
      );
      ruleSources.set(ruleName, [...existingSources, newSource]);
      continue;
    }
    throw new RuleCollisionError(
      ruleName,
      [...existingSources, newSource],
      'rule has no defined merge strategy — disambiguate recipes or add a strategy in merge-eslint-config.ts',
    );
  }
}
