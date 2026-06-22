// Stage 2 — live generate-path: LLM picks rules from the curated menu.
// Reuses loadRecipe + mergeEslintRuleConfig from the curated path additively.
// The curated synthesize() is not touched; both paths compose via the same primitives.
//
// Dependency injection: the MenuPickClient is injected by the caller so tests
// use a deterministic stub and install-time wires the real LLM adapter.
// No live LLM calls here — all I/O is behind the client port.

import type { ResearchPlan } from '../research/types.ts';
import { loadRecipe } from './synthesize.ts';
import { mergeEslintRuleConfig } from './merge-eslint-config.ts';
import type { SynthesisPlan, SynthesizedRule } from './types.ts';
import type { Menu, MenuCandidate, MenuPickClient } from './menu-pick-port.ts';

export async function synthesizeLive(
  plan: ResearchPlan,
  client: MenuPickClient,
): Promise<SynthesisPlan> {
  const candidates: MenuCandidate[] = plan.patterns
    .filter((entry) => loadRecipe(entry.id) !== null)
    .map((entry) => ({
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

  console.debug(
    '[synthesizeLive] picking from menu',
    JSON.stringify({ framework: menu.framework, candidateIds: candidates.map((c) => c.id) }),
  );

  const selection = await client.pick(menu);

  console.debug(
    '[synthesizeLive] selection received',
    JSON.stringify({ selectedIds: selection.selected.map((s) => s.id) }),
  );

  const rules: SynthesizedRule[] = [];
  const mdFragments: string[] = [];
  const mergedEslintConfig: Record<string, unknown> = {};
  const ruleSources = new Map<string, string[]>();
  let nextId = 1;

  for (const selected of selection.selected) {
    const entry = plan.patterns.find((p) => p.id === selected.id);
    if (!entry) {
      console.debug(`[synthesizeLive] skipping unknown id "${selected.id}" (not in patterns)`);
      continue;
    }
    const recipe = loadRecipe(entry.id);
    if (!recipe) {
      console.debug(`[synthesizeLive] skipping "${entry.id}" (no recipe)`);
      continue;
    }
    if (plan.framework !== null && !recipe.appliesTo.includes(plan.framework)) {
      console.debug(`[synthesizeLive] skipping "${entry.id}" (appliesTo mismatch)`);
      continue;
    }

    const id = `G${nextId++}`;
    const rule: SynthesizedRule = {
      ...recipe.rule,
      id,
      research: { entryId: entry.id, provenance: entry.provenance },
    };
    rules.push(rule);
    mdFragments.push(recipe.rulesMdTemplate.replace(/\{\{id\}\}/g, id));

    const eslintConfig = selected.eslintConfigOverride ?? recipe.eslintRuleConfig;
    mergeEslintRuleConfig(mergedEslintConfig, eslintConfig, recipe.patternId, ruleSources);

    console.debug(`[synthesizeLive] composed rule ${id} from "${entry.id}"`);
  }

  return {
    framework: plan.framework,
    version: plan.version,
    rules,
    rulesMd: mdFragments.join('\n'),
    eslintConfigSnippet: JSON.stringify(mergedEslintConfig, null, 2),
  };
}
