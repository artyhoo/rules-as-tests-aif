// @ts-nocheck
// External-facing ResearchPlan validator.
// Used by consumers that load a ResearchPlan from JSON without going through
// loadEntries() (e.g. synthesizer/cli.ts --from-research mode). Closes the
// B2 hole where a bare `as ResearchPlan` cast could let malformed data —
// including spoofed provenance.url not in the allowlist — bypass schema
// + provenance gates that loadEntries already enforces per-entry.

import { validateProvenance } from './allowlist.ts';
import {
  errorsText,
  validateResearchPlanShape,
} from './internal-validators.ts';
import type { ResearchPlan } from './types.ts';

export class ResearchPlanError extends Error {
  constructor(public readonly errors: string) {
    super(`Invalid ResearchPlan: ${errors}`);
    this.name = 'ResearchPlanError';
  }
}

export function validateResearchPlan(plan: unknown): asserts plan is ResearchPlan {
  if (!validateResearchPlanShape(plan)) {
    throw new ResearchPlanError(errorsText(validateResearchPlanShape.errors));
  }
  const parsed = plan as ResearchPlan;
  for (const entry of parsed.patterns) {
    for (const p of entry.provenance) {
      const v = validateProvenance(p);
      if (!v.ok) {
        throw new ResearchPlanError(
          `pattern[${entry.id}] provenance violation — ${v.reason}`,
        );
      }
    }
  }
}
