// Stage 2 — L4-verdict + provenance-gate tests for live-shaped ResearchPlans.
// Testable surface = L4 verdict + provenance validity + determinism (NOT live web_search bytes).
// Stubs inject deterministic plans; no live API calls (no-paid-llm-in-ci.md).
// Principle 02 (paired-negative): valid cases (a,b,c) + invalid negative (d, d2).

import { describe, expect, it } from 'vitest';
import { synthesizeLive } from '../synthesizer/menu-pick.ts';
import { stubPickAll, stubPickBad } from '../synthesizer/menu-pick-stubs.ts';
import { validate } from '../validator/validate.ts';
import { validateProvenance } from './allowlist.ts';
import type { ResearchPlan } from './types.ts';

// Representative live-shaped Next 15 ResearchPlan — allowlist-valid, drift: null.
// Mirrors what createAnthropicResearchClient would produce for patterns: ['nextjs-app-router'].
const stubLiveResearch: ResearchPlan = {
  framework: 'next',
  version: '15.0.0',
  patterns: [
    {
      id: 'nextjs-app-router',
      summary:
        'App Router is the recommended default in Next.js 15. Use Server Components by default; opt in to client only when needed.',
      bestPractices: [
        'Default async function Page to a Server Component; opt in to client only when needed.',
        'Co-locate route handlers in route.ts files within app/ segments.',
        'Use revalidatePath and revalidateTag from Server Actions to invalidate cached fetches.',
      ],
      antiPatterns: [
        "Importing next/router from anywhere under app/ — use next/navigation instead.",
        "Reading process.env or filesystem APIs from a 'use client' module.",
      ],
      provenance: [
        {
          url: 'https://nextjs.org/docs/app/building-your-application/routing',
          allowlistKey: 'next.official',
          fetchedAt: '2026-06-23',
        },
      ],
    },
  ],
  missing: [],
  drift: null,
};

// Paired-negative fixture: same shape but out-of-allowlist provenance URL.
// Tests that validateProvenance correctly rejects this entry.
const stubLiveResearchBad: ResearchPlan = {
  framework: 'next',
  version: '15.0.0',
  patterns: [
    {
      id: 'nextjs-app-router',
      summary:
        'App Router is the recommended default in Next.js 15. Use Server Components by default; opt in to client only when needed.',
      bestPractices: [
        'Default async function Page to a Server Component; opt in to client only when needed.',
      ],
      antiPatterns: [
        "Importing next/router from anywhere under app/ — use next/navigation instead.",
      ],
      provenance: [
        {
          url: 'https://evil.example.com/next-tricks',
          allowlistKey: 'next.official',
          fetchedAt: '2026-06-23',
        },
      ],
    },
  ],
  missing: [],
  drift: null,
};

describe('research-live — live-shaped ResearchPlan gate suite (Next 15)', () => {
  // (a) L4 accepts: validate(synthesizeLive(stubLiveResearch, stubPickAll)).ok === true
  it('(a) L4 accepts the live-shaped plan under stubPickAll', async () => {
    const synthesis = await synthesizeLive(stubLiveResearch, stubPickAll);
    const report = validate(synthesis);
    expect(report.ok).toBe(true);
  });

  // (b) Provenance valid: every entry in stubLiveResearch passes validateProvenance
  it('(b) all provenance entries in stubLiveResearch are allowlist-valid', () => {
    for (const entry of stubLiveResearch.patterns) {
      for (const prov of entry.provenance) {
        const v = validateProvenance(prov);
        expect(v.ok, `provenance ${prov.url} should be valid: ${v.reason ?? ''}`).toBe(true);
      }
    }
  });

  // (c) Determinism: synthesizeLive(stubLiveResearch, stubPickAll) is stable across runs
  it('(c) synthesizeLive is deterministic across two calls', async () => {
    const first = await synthesizeLive(stubLiveResearch, stubPickAll);
    const second = await synthesizeLive(stubLiveResearch, stubPickAll);
    expect(first).toEqual(second);
  });

  // (d) Paired negative (principle 02): stubLiveResearchBad carries out-of-allowlist provenance
  //     → provenance gate fires (validateProvenance returns ok: false)
  it('(d) stubLiveResearchBad: provenance gate fires on out-of-allowlist URL', () => {
    for (const entry of stubLiveResearchBad.patterns) {
      const results = entry.provenance.map((p) => validateProvenance(p));
      const anyFail = results.some((r) => !r.ok);
      expect(
        anyFail,
        `entry ${entry.id} should have at least one invalid provenance`,
      ).toBe(true);
    }
  });

  // (d2) Paired negative: L4 rejects when stubPickBad drives a tautological synthesis
  it('(d2) L4 rejects the live plan under stubPickBad (tautological ESLint config)', async () => {
    const synthesis = await synthesizeLive(stubLiveResearch, stubPickBad);
    const report = validate(synthesis);
    expect(report.ok).toBe(false);
  });
});
