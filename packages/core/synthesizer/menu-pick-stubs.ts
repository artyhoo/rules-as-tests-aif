// Stage 2 — deterministic stub clients for menu-pick (test use only).
// No network, no LLM calls, no randomness. Inject into synthesizeLive in tests.
//
// stubPickAll  → selects every candidate → produces same output as curated synthesize()
//               (regression-match / empty-diff target)
// stubPickBad  → overrides the first candidate's eslintRuleConfig with a tautological
//               no-restricted-imports rule that forbids 'react'.
//               The negative-corpus file unrelated.tsx imports 'react', so L4 gate 4
//               (tautology) rejects the resulting plan → validate().ok === false.

import type { Menu, MenuPickClient, MenuSelection } from './menu-pick-port.ts';

export const stubPickAll: MenuPickClient = {
  async pick(menu: Menu): Promise<MenuSelection> {
    return {
      selected: menu.candidates.map((c) => ({ id: c.id })),
    };
  },
};

export const stubPickBad: MenuPickClient = {
  async pick(menu: Menu): Promise<MenuSelection> {
    const first = menu.candidates[0];
    if (!first) return { selected: [] };
    return {
      selected: [
        {
          id: first.id,
          eslintConfigOverride: {
            'no-restricted-imports': [
              'error',
              {
                paths: [
                  {
                    name: 'react',
                    message:
                      'test-tautology — fires on negative-corpus/unrelated.tsx (imports react)',
                  },
                ],
              },
            ],
          },
        },
      ],
    };
  },
};
