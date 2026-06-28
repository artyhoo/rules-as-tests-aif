// Rule-bootstrapping SPIKE — generate-half stub + end-to-end pipeline orchestration.
//
// Wires the SKELETON end-to-end on ONE stack (react-next), behind a deterministic
// stub, with ZERO network / LLM calls (principle 17, $0-in-CI). The pipeline:
//
//   stubRuleResearch.research(detection)   → ResearchPlan  (the `plan` menu, step 1)
//   runGeneratePath(plan, generateClient)  → synthesize → L4 validate → degrade
//   install(synthPlan, {force:true})       → emit + buildLock → rules-lock.json (revives the dead lock)
//
// This is the #798 §4 seam proof: the live/stub part supplies only DATA conforming
// to GenerateCandidate, never TypeScript. A real findings→GenerateSelection transform
// is the LIVE adapter's job (OUT of this spike).
//
// T16 (problem-class match, NOT name-rhyme): stubGenerateNextImage mirrors the
// GenerateClient pattern from generate-stubs.ts (stubGenerateRN / stubGenerateForbid)
// because it solves the SAME sub-problem — author a fixed rule body (a GenerateSelection)
// from a Menu. It is a DISTINCT seam from RuleResearchClient (research→menu); see
// rule-research-port.ts. The two ports are not interchangeable.
//
// T-RBI-A: research is STUBBED here — the live MCP adapter is the NEXT slice. This
// pipeline proves the SKELETON only; it does NOT do live research.

import type { DetectionResult } from '../detector/types.ts';
import type { ResearchPlan } from '../research/types.ts';
import { install } from '../installer/install.ts';
import type { InstallReport } from '../installer/types.ts';
import { runGeneratePath } from './generate-cli.ts';
import type { GenerateClient, GenerateSelection, Menu } from './generate-port.ts';
import { stubRuleResearch, type RuleResearchClient } from './rule-research-port.ts';

/**
 * Generate-half stub for the react-next "no raw <img>; use next/image" practice.
 * ONE forbid-class candidate whose entryId MATCHES the step-1 pattern id
 * (`next-image-no-raw-img`) — else synthesizeGenerate silently drops it (generate.ts).
 *
 * presence:'forbid' + selector → routed to check.type:'declarative' (executable L4
 * roundtrip via the exempt-aware no-restricted-syntax wrapper), NOT 'manual' (which L4
 * skips, leaving no firing test — that would be T15 #discipline-theatre). The
 * examples.bad/good pair is a single-token diff (<img → <Image) to satisfy the L4
 * single-token-diff anti-vacuity gate. Mirrors stubGenerateForbid in generate-stubs.ts.
 */
export const stubGenerateNextImage: GenerateClient = {
  async generate(_menu: Menu): Promise<GenerateSelection> {
    return {
      rules: [
        {
          entryId: 'next-image-no-raw-img',
          ruleId: 'no-raw-img',
          title: 'Use next/image <Image> instead of a raw <img> element',
          stack: ['react-next'],
          presence: 'forbid',
          selector: "JSXOpeningElement[name.name='img']",
          message: 'Use next/image <Image> instead of a raw <img> element.',
          examples: {
            bad: '<img src={src} />',
            good: '<Image src={src} />',
          },
          negativeTest: {
            input: ['<img src={src} />'],
            'expect-violation': 'no-restricted-syntax',
          },
        },
      ],
    };
  },
};

// The stub ignores detection (stubRuleResearch returns hardcoded data), but the seam
// signature requires one — a minimal valid react-next DetectionResult.
const STUB_DETECTION: DetectionResult = {
  stack: 'react-next',
  framework: { name: 'next', version: null, major: null },
  runtime: { name: 'node', major: null },
  confidence: 'high',
  severity: 'pass',
  weight: 2,
  source: 'rule-bootstrap-stub',
  rules: { applicable: [], skipped: [] },
};

export type RuleBootstrapResult =
  | { mode: 'synthesis'; install: InstallReport }
  | { mode: 'research-only'; plan: ResearchPlan };

export interface RuleBootstrapOptions {
  consumerRoot: string;
  /** Overwrite an existing rules-lock.json from a prior run (default true — keeps the spike re-runnable). */
  force?: boolean;
  /** Injectable research seam — defaults to the deterministic stub. The live MCP adapter slots in here. */
  researchClient?: RuleResearchClient;
  /** Injectable generate seam — defaults to the deterministic stub. */
  generateClient?: GenerateClient;
}

/**
 * Run the rule-bootstrapping SKELETON end-to-end. On L4 synthesis, the SynthesisPlan
 * goes STRAIGHT to install() — which itself emit()s then buildLock()s, so we never
 * double-emit. On L4 reject, runGeneratePath degrades to research-only and install()
 * is never reached (no rule ships).
 */
export async function runRuleBootstrap(
  opts: RuleBootstrapOptions,
): Promise<RuleBootstrapResult> {
  const researchClient = opts.researchClient ?? stubRuleResearch;
  const generateClient = opts.generateClient ?? stubGenerateNextImage;

  const plan = await researchClient.research(STUB_DETECTION);
  const result = await runGeneratePath(plan, generateClient);

  if (result.mode === 'research-only') {
    return { mode: 'research-only', plan: result.plan };
  }

  const report = install(result.plan, {
    consumerRoot: opts.consumerRoot,
    force: opts.force ?? true,
  });
  return { mode: 'synthesis', install: report };
}
