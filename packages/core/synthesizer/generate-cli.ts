// Stage 5 — generate-path orchestration + L4-degrade decision (the testable seam).
// Pure function over an injected GenerateClient: synthesize → L4 validate → degrade.
// L4 + L5 are byte-identical — this reads validate().ok, it never changes the validator.
// In CI, inject stubGenerateRN / stubGenerateBad; at install-time, the live adapter.

import type { ResearchPlan } from '../research/types.ts';
import type { SynthesisPlan } from './types.ts';
import type { GenerateClient } from './generate-port.ts';
import { synthesizeGenerate } from './generate.ts';
import { validate } from '../validator/validate.ts';

export type GeneratePathResult =
  | { mode: 'synthesis'; plan: SynthesisPlan }
  | { mode: 'research-only'; plan: ResearchPlan };

/**
 * Generate-path orchestration with L4-degrade:
 *  - synthesizeGenerate(plan, client) → run L4 validate()
 *  - L4 accepts → { mode:'synthesis', plan: synthPlan }
 *  - L4 rejects everything → degrade to { mode:'research-only', plan } (the input ResearchPlan as findings)
 */
export async function runGeneratePath(
  plan: ResearchPlan,
  client: GenerateClient,
): Promise<GeneratePathResult> {
  const synthPlan = await synthesizeGenerate(plan, client);
  const report = validate(synthPlan);
  if (report.ok) return { mode: 'synthesis', plan: synthPlan };
  return { mode: 'research-only', plan };
}
