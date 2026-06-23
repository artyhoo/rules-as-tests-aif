// Layer 2 Research — injectable client port for the live-research path.
// Mirrors menu-pick-port.ts: ResearchClient is the seam between
// frozen-store production and live web_search production.
//
// In CI, inject stubFrozenResearch (wraps the deterministic research() function).
// At install-time, inject createAnthropicResearchClient from research-adapter-anthropic.ts.
// No live API calls in this file — stubs only.

import type { DetectionResult } from '../detector/types.ts';
import type { ResearchPlan } from './types.ts';
import { research } from './index.ts';

export interface ResearchClient {
  research(detection: DetectionResult): Promise<ResearchPlan>;
}

/** Frozen-store stub: wraps the deterministic research() function — no behaviour change. */
export const stubFrozenResearch: ResearchClient = {
  async research(detection: DetectionResult): Promise<ResearchPlan> {
    return research(detection);
  },
};
