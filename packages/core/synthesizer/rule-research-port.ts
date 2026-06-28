// Rule-bootstrapping SPIKE — research-half port + deterministic stub.
//
// SEAM: this is the plug-in point where the LIVE MCP-research adapter (context7 /
// deepwiki + tool-bootstrapping-discovered MCPs) slots in NEXT. It is OUT of this
// spike — live research is agent/session work and MCP availability inside an
// autonomous container is uncertain (R-phase #798 §4). The spike commits to NEITHER
// side of the parked agent-vs-code Q1 (#798 §3): the stub finding is fixed data,
// agnostic to who produces the live version.
//
// T16 (problem-class match, NOT name-rhyme): RuleResearchClient mirrors
// research/research-port.ts's ResearchClient INTERFACE SHAPE because it solves the
// SAME sub-problem — an injectable live/stub seam producing a ResearchPlan menu
// from a DetectionResult. It is a DISTINCT port from GenerateClient (which solves
// the menu→rule-body sub-problem); the two are not interchangeable.
//
// Divergence from stubFrozenResearch: that stub DELEGATES to the real research()
// function. stubRuleResearch does NOT — it IGNORES its detection arg and returns
// hardcoded react-next data (underscore-prefix convention, like stubGenerateRN in
// generate-stubs.ts). No network, no LLM, no recipe lookup.

import type { DetectionResult } from '../detector/types.ts';
import type { ResearchPlan } from '../research/types.ts';

export interface RuleResearchClient {
  research(detection: DetectionResult): Promise<ResearchPlan>;
}

// Fixed react-next ResearchPlan with ONE real, well-known practice/anti-pattern:
// "no raw <img>; use next/image". Shape modelled on
// synthesizer/fixtures/rn-research-plan.json (ResearchEntry =
// id/summary/bestPractices[]/antiPatterns[]/provenance[]; plan-level missing[] + drift).
const _NEXT_IMAGE_PLAN: ResearchPlan = {
  framework: 'react-next',
  version: null,
  patterns: [
    {
      id: 'next-image-no-raw-img',
      summary:
        'Next.js components must render images via the next/image <Image> component instead of a raw <img> element. next/image provides automatic optimisation (lazy-loading, responsive srcset, CLS-safe sizing) that a raw <img> lacks.',
      bestPractices: [
        "Import Image from 'next/image' and render <Image> with explicit width/height (or fill)",
        'Configure remote hosts via images.remotePatterns in next.config instead of bypassing the optimiser',
        'Always provide an alt attribute for accessibility',
      ],
      antiPatterns: [
        'Rendering a raw <img> element in a Next.js component',
        'Omitting width/height on images, causing cumulative layout shift (CLS)',
      ],
      provenance: [
        {
          url: 'https://nextjs.org/docs/app/api-reference/components/image',
          allowlistKey: 'nextjs.org',
          fetchedAt: '2026-06-28T00:00:00.000Z',
        },
      ],
    },
  ],
  missing: [],
  drift: null,
};

/**
 * Deterministic stub for the rule-bootstrapping research half. IGNORES `detection`
 * and returns the fixed react-next plan above — the live MCP adapter will replace
 * THIS object while keeping the RuleResearchClient interface unchanged (the seam).
 */
export const stubRuleResearch: RuleResearchClient = {
  async research(_detection: DetectionResult): Promise<ResearchPlan> {
    return _NEXT_IMAGE_PLAN;
  },
};
