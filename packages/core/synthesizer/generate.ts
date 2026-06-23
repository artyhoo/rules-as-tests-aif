// Stage 4 — recipe-less generate-path: client builds rule bodies without any recipe lookup.
// Unlike synthesizeLive (Stage 2), this path does NOT filter plan.patterns by loadRecipe —
// that filter is the limitation being worked around (RN has no recipes/*.json).
// GenerateClient supplies rule body (ruleId + eslintConfig + examples + negativeTest);
// synthesizeGenerate assembles SynthesisPlan using the same L4-compatible primitives.
//
// Proves the rules-factory generalises to stacks with no pre-written answer key.
// L4 + L5 are byte-identical — this is a new input path, not a change to the validator.

import type { ResearchPlan } from '../research/types.ts';
import { mergeEslintRuleConfig } from './merge-eslint-config.ts';
import type { ManifestCheck, SynthesisPlan, SynthesizedRule } from './types.ts';
import type { GenerateClient, Menu, MenuCandidate } from './generate-port.ts';

export async function synthesizeGenerate(
  plan: ResearchPlan,
  client: GenerateClient,
): Promise<SynthesisPlan> {
  // Build menu from ALL patterns — no loadRecipe filter (the whole point, T16)
  const candidates: MenuCandidate[] = plan.patterns.map((entry) => ({
    id: entry.id,
    summary: entry.summary,
    bestPractices: entry.bestPractices,
    antiPatterns: entry.antiPatterns,
  }));

  const menu: Menu = {
    framework: plan.framework,
    version: plan.version,
    candidates,
  };

  const selection = await client.generate(menu);

  const rules: SynthesizedRule[] = [];
  const mdFragments: string[] = [];
  const mergedEslintConfig: Record<string, unknown> = {};
  const ruleSources = new Map<string, string[]>();
  let nextId = 1;

  for (const candidate of selection.rules) {
    const entry = plan.patterns.find((p) => p.id === candidate.entryId);
    if (!entry) continue;

    const id = `G${nextId++}`;
    const hasEslintConfig =
      candidate.eslintConfig !== undefined &&
      Object.keys(candidate.eslintConfig).length > 0;

    // eslintConfig present → eslint check type; absent/empty → manual (plugin outside L4 registry)
    const check: ManifestCheck = hasEslintConfig
      ? { type: 'eslint', rule: candidate.ruleId }
      : {
          type: 'manual',
          rationale: `Plugin rule '${candidate.ruleId}' — L4 harness KNOWN_PLUGINS only registers rules-as-tests; roundtrip not supported for this rule`,
        };

    const rule: SynthesizedRule = {
      id,
      title: candidate.title,
      stack: candidate.stack,
      check,
      examples: candidate.examples,
      research: { entryId: entry.id, provenance: entry.provenance },
    };

    if (hasEslintConfig && candidate.negativeTest) {
      rule['negative-test'] = candidate.negativeTest;
    }

    rules.push(rule);
    mdFragments.push(
      `## ${id} — ${candidate.title}\n\n**Check:** ${hasEslintConfig ? `\`${candidate.ruleId}\`` : 'Manual review'}\n`,
    );

    if (hasEslintConfig && candidate.eslintConfig) {
      mergeEslintRuleConfig(
        mergedEslintConfig,
        candidate.eslintConfig,
        candidate.ruleId,
        ruleSources,
      );
    }
  }

  return {
    framework: plan.framework,
    version: plan.version,
    rules,
    rulesMd: mdFragments.join('\n'),
    eslintConfigSnippet: JSON.stringify(mergedEslintConfig, null, 2),
  };
}
