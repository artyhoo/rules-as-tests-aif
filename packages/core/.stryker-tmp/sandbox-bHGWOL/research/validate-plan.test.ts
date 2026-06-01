// @ts-nocheck
import { describe, expect, it } from 'vitest';
import {
  ResearchPlanError,
  validateResearchPlan,
} from './validate-plan.ts';

const validProvenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

const validEntry = {
  id: 'nextjs-app-router',
  summary: 'App Router patterns',
  bestPractices: [],
  antiPatterns: [],
  provenance: [validProvenance],
};

const validPlan = {
  framework: 'next',
  version: '16.0.0',
  patterns: [validEntry],
  missing: [],
  drift: null,
};

describe('validateResearchPlan — B2 closure for synthesizer --from-research', () => {
  it('accepts a well-formed plan with a single valid entry', () => {
    expect(() => validateResearchPlan(validPlan)).not.toThrow();
  });

  it('accepts a plan with framework=null (own-repo / ts-server case)', () => {
    expect(() =>
      validateResearchPlan({
        ...validPlan,
        framework: null,
        version: null,
        patterns: [],
      }),
    ).not.toThrow();
  });

  it('rejects a plan missing the required `patterns` field', () => {
    const bad = { framework: 'next', version: '16.0.0', missing: [], drift: null };
    expect(() => validateResearchPlan(bad)).toThrow(ResearchPlanError);
  });

  it('rejects a plan whose entry has malformed provenance shape', () => {
    const bad = {
      ...validPlan,
      patterns: [
        {
          ...validEntry,
          provenance: [{ url: 'https://nextjs.org', allowlistKey: 'next.official' }],
        },
      ],
    };
    expect(() => validateResearchPlan(bad)).toThrow(ResearchPlanError);
  });

  it('rejects a plan whose provenance.url is outside the allowlist (B2 spoof scenario)', () => {
    const bad = {
      ...validPlan,
      patterns: [
        {
          ...validEntry,
          provenance: [
            {
              url: 'https://example.evil/fake-docs',
              allowlistKey: 'next.official',
              fetchedAt: '2026-05-08',
            },
          ],
        },
      ],
    };
    expect(() => validateResearchPlan(bad)).toThrow(ResearchPlanError);
    expect(() => validateResearchPlan(bad)).toThrow(/provenance violation/);
  });

  it('rejects a top-level non-object', () => {
    expect(() => validateResearchPlan(null)).toThrow(ResearchPlanError);
    expect(() => validateResearchPlan('not a plan')).toThrow(ResearchPlanError);
    expect(() => validateResearchPlan(42)).toThrow(ResearchPlanError);
  });

  it('rejects a plan with extra top-level properties (additionalProperties: false)', () => {
    const bad = { ...validPlan, surprise: 'not allowed' };
    expect(() => validateResearchPlan(bad)).toThrow(ResearchPlanError);
  });
});
