// S4: deterministic RULES.md fragment generated from a declarative forbid spec.
// Replaces the per-recipe handwritten rulesMdTemplate for check.type==='declarative'
// (T-MVP-A: a new forbid is added as data, not a handwritten template).
import type { SynthesizedRule } from './types.ts';

export function compileDeclarativeMd(rule: SynthesizedRule): string {
  if (rule.check.type !== 'declarative') {
    throw new Error(
      `compileDeclarativeMd called on non-declarative rule ${rule.id} (check.type=${rule.check.type})`,
    );
  }
  const { selector, message, engine } = rule.check;
  const engineName = engine ?? 'eslint-restricted';
  const runner =
    engineName === 'eslint-restricted' ? 'no-restricted-syntax' : engineName;
  const why = message ?? 'forbidden construct';
  return [
    `## ${rule.id} — ${rule.title}`,
    '',
    `**Stack:** ${rule.stack.join(', ')}  `,
    `**Check:** declarative \`${runner}\` forbid (${engineName} engine)  `,
    `**Selector:** \`${selector}\`  `,
    `**Why:** ${why}`,
    '',
  ].join('\n');
}
