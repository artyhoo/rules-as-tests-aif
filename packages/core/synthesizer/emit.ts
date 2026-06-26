// Side-effect emitter: writes a SynthesisPlan to disk as 3 files.
// Deliberately segregated from index.ts (Planner-Executor): L4 Validator
// (Phase 7+) consumes the pure SynthesisPlan via index.ts, not file output.

import { existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalRuleHash } from './canonical-rule-hash.ts';
import type { SynthesisPlan } from './types.ts';

export class EmitError extends Error {
  constructor(public readonly path: string, reason: string) {
    super(`Cannot emit synthesis plan to ${path}: ${reason}`);
    this.name = 'EmitError';
  }
}

export function emit(plan: SynthesisPlan, outputDir: string): void {
  const dir = resolve(outputDir);
  if (!existsSync(dir)) {
    throw new EmitError(dir, 'output directory does not exist');
  }
  if (!statSync(dir).isDirectory()) {
    throw new EmitError(dir, 'output path is not a directory');
  }

  const manifestAdditions: Record<string, unknown> = {};
  for (const rule of plan.rules) {
    const { id, research, ...manifestShape } = rule;
    manifestAdditions[id] = { ...manifestShape, research };
  }

  writeFileSync(
    resolve(dir, 'rules-manifest-additions.json'),
    JSON.stringify(manifestAdditions, null, 2) + '\n',
  );
  writeFileSync(
    resolve(dir, 'RULES-additions.md'),
    plan.rulesMd ? `# Synthesized rules\n\n${plan.rulesMd}` : '# Synthesized rules\n\n(no rules)\n',
  );
  writeFileSync(
    resolve(dir, 'eslint-rules-snippet.json'),
    plan.eslintConfigSnippet + '\n',
  );

  // S4: provenance header — generated-marker + per-rule source + content-hash.
  // The generator is the sole writer; S5's anti-hand-edit gate recomputes
  // canonicalRuleHash and rejects a manual edit of an emitted rule file.
  const provenanceRules: Record<string, unknown> = {};
  for (const rule of plan.rules) {
    provenanceRules[rule.id] = {
      source: {
        entryId: rule.research.entryId,
        provenance: rule.research.provenance,
      },
      contentHash: canonicalRuleHash(rule),
    };
  }
  writeFileSync(
    resolve(dir, 'provenance.json'),
    JSON.stringify(
      {
        generatedBy: 'rules-as-tests-synth',
        note: 'GENERATED — do not edit emitted rule files by hand; regenerate via the synthesizer. S5 enforces this mechanically.',
        rules: provenanceRules,
      },
      null,
      2,
    ) + '\n',
  );
}
