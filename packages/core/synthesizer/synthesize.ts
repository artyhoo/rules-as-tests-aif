// Pure synthesizer: ResearchPlan → SynthesisPlan via curated recipe lookup.
// Recipes live in synthesizer/recipes/<patternId>.json; framework-keyed
// `appliesTo` filters which recipes apply. IDs assigned G1, G2, ...
// sequentially in input order for deterministic output.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';
import type { ResearchPlan } from '../research/types.ts';
import { compileDeclarativeMd } from './compile-declarative-md.ts';
import { mergeEslintRuleConfig } from './merge-eslint-config.ts';
import type { SynthesisPlan, SynthesizedRule } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const RECIPES_ROOT = resolve(HERE, 'recipes');
const SCHEMA_PATH = resolve(HERE, 'synthesis-plan.schema.json');
const RECIPE_SCHEMA_PATH = resolve(HERE, 'recipe.schema.json');

export interface Recipe {
  patternId: string;
  appliesTo: string[];
  rule: Omit<SynthesizedRule, 'id' | 'research'>;
  rulesMdTemplate?: string;
  eslintRuleConfig: Record<string, unknown>;
}

const ajv = new Ajv({ allErrors: true, strict: false });
const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
ajv.addSchema(schema, 'synthesis-plan');
const validatePlan = ajv.compile({ $ref: 'synthesis-plan' });

const recipeSchema = JSON.parse(readFileSync(RECIPE_SCHEMA_PATH, 'utf8'));
const validateRecipe = ajv.compile(recipeSchema);

export class SynthesisPlanError extends Error {
  constructor(public readonly errors: string) {
    super(`Invalid SynthesisPlan: ${errors}`);
    this.name = 'SynthesisPlanError';
  }
}

export class RecipeError extends Error {
  constructor(
    public readonly path: string,
    public readonly errors: string,
  ) {
    super(`Invalid recipe at ${path}: ${errors}`);
    this.name = 'RecipeError';
  }
}

export function loadRecipe(patternId: string): Recipe | null {
  const path = resolve(RECIPES_ROOT, `${patternId}.json`);
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  if (!validateRecipe(raw)) {
    throw new RecipeError(path, ajv.errorsText(validateRecipe.errors));
  }
  return raw as Recipe;
}

export function synthesize(plan: ResearchPlan): SynthesisPlan {
  const rules: SynthesizedRule[] = [];
  const mdFragments: string[] = [];
  const mergedEslintConfig: Record<string, unknown> = {};
  const ruleSources = new Map<string, string[]>();
  let nextId = 1;

  for (const entry of plan.patterns) {
    const recipe = loadRecipe(entry.id);
    if (!recipe) continue;
    if (plan.framework === null || !recipe.appliesTo.includes(plan.framework)) {
      continue;
    }
    const id = `G${nextId++}`;
    const rule: SynthesizedRule = {
      ...recipe.rule,
      id,
      research: { entryId: entry.id, provenance: entry.provenance },
    };
    rules.push(rule);
    if (rule.check.type === 'declarative') {
      mdFragments.push(compileDeclarativeMd(rule));
    } else {
      mdFragments.push((recipe.rulesMdTemplate ?? '').replace(/\{\{id\}\}/g, id));
    }
    mergeEslintRuleConfig(
      mergedEslintConfig,
      recipe.eslintRuleConfig,
      recipe.patternId,
      ruleSources,
    );
    // For declarative+eslint-restricted: compile selector+message into no-restricted-syntax entry
    if (
      rule.check.type === 'declarative' &&
      (!rule.check.engine || rule.check.engine === 'eslint-restricted')
    ) {
      const selectorEntry: Record<string, string> = { selector: rule.check.selector };
      if (rule.check.message) selectorEntry.message = rule.check.message;
      mergeEslintRuleConfig(
        mergedEslintConfig,
        { 'no-restricted-syntax': ['error', selectorEntry] } as Record<string, unknown>,
        recipe.patternId,
        ruleSources,
      );
    }
  }

  const result: SynthesisPlan = {
    framework: plan.framework,
    version: plan.version,
    rules,
    rulesMd: mdFragments.join('\n'),
    eslintConfigSnippet: JSON.stringify(mergedEslintConfig, null, 2),
  };

  if (!validatePlan(result)) {
    throw new SynthesisPlanError(ajv.errorsText(validatePlan.errors));
  }
  return result;
}
