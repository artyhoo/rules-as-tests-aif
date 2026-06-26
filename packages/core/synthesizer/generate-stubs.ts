// Stage 4 — deterministic stub clients for synthesizeGenerate (test use only).
// No network, no LLM calls, no randomness. Inject into synthesizeGenerate in tests.
//
// stubGenerateRN  → returns the RN rule set (R12+R18 as eslint; R14+R15 as manual).
//                  R12/R18 are BUILT-IN ESLint rules that L4 can roundtrip.
//                  R14/R15 are plugin rules (eslint-plugin-react-native / -a11y) — not
//                  installed in root node_modules and not in gate KNOWN_PLUGINS → emitted
//                  as check.type:'manual' (Option A: honest about harness limit; oracle
//                  coverage = {R12,R14,R15,R18}).
//
// stubGenerateBad → overrides the first candidate's eslintConfig with a tautological
//                  no-restricted-imports rule that forbids 'react'.
//                  negative-corpus/unrelated.tsx imports 'react' → L4 gate 4 (tautology)
//                  fires → validate().ok === false. Mirrors menu-pick-stubs.ts:stubPickBad.

import type { Menu, GenerateClient, GenerateSelection } from './generate-port.ts';

export const stubGenerateRN: GenerateClient = {
  async generate(_menu: Menu): Promise<GenerateSelection> {
    return {
      rules: [
        // R12-RN: no-restricted-globals (built-in) — web-only globals forbidden in RN
        {
          entryId: 'rn-web-globals',
          ruleId: 'no-restricted-globals',
          title: 'Forbid web-only globals in React Native',
          stack: ['react-native'],
          eslintConfig: {
            'no-restricted-globals': [
              'error',
              'window',
              'document',
              'localStorage',
              'sessionStorage',
              'navigator',
              'XMLHttpRequest',
            ],
          },
          examples: {
            bad: "const stored = localStorage.getItem('user');",
            good: "import { Dimensions } from 'react-native';\nconst width = Dimensions.get('window').width;",
          },
          negativeTest: {
            input: ["const stored = localStorage.getItem('user');"],
            'expect-violation': 'no-restricted-globals',
          },
        },
        // R14-RN: react-native/no-inline-styles + no-color-literals + no-unused-styles
        // Plugin rule → NOT in L4 KNOWN_PLUGINS → emit as manual (Option A)
        {
          entryId: 'rn-styles',
          ruleId: 'react-native/no-inline-styles',
          title: 'Enforce StyleSheet.create — no inline styles or hardcoded colors',
          stack: ['react-native'],
          // eslintConfig absent → synthesizeGenerate emits check.type:'manual'
          examples: {
            bad: "<View style={{ flex: 1, backgroundColor: '#fff' }} />",
            good: "const styles = StyleSheet.create({ container: { flex: 1 } });\n<View style={styles.container} />",
          },
        },
        // R15-RN: react-native-a11y/* rules
        // Plugin rule → NOT in L4 KNOWN_PLUGINS → emit as manual (Option A)
        {
          entryId: 'rn-a11y',
          ruleId: 'react-native-a11y/has-accessibility-hint',
          title: 'Enforce mobile accessibility — accessibilityRole on touchable elements',
          stack: ['react-native'],
          // eslintConfig absent → synthesizeGenerate emits check.type:'manual'
          examples: {
            bad: '<TouchableOpacity onPress={handlePress}><Text>Submit</Text></TouchableOpacity>',
            good: '<TouchableOpacity onPress={handlePress} accessibilityRole="button" accessibilityLabel="Submit"><Text>Submit</Text></TouchableOpacity>',
          },
        },
        // R18-RN: no-restricted-imports FlatList (built-in) — fills documented gap
        // "No upstream ESLint rule exists" (RULES.react-native.md:138-142)
        // Path A: derive config from the EXISTING rn-common.mjs commented snippet
        {
          entryId: 'rn-list-perf',
          ruleId: 'no-restricted-imports',
          title: 'Prefer FlashList over FlatList for better list performance',
          stack: ['react-native'],
          eslintConfig: {
            'no-restricted-imports': [
              'error',
              {
                paths: [
                  {
                    name: 'react-native',
                    importNames: ['FlatList'],
                    message:
                      'Prefer FlashList (@shopify/flash-list) or LegendList for better performance.',
                  },
                ],
              },
            ],
          },
          examples: {
            bad: "import { FlatList } from 'react-native';\n\nexport function BadList({ data }: { data: string[] }) {\n  return <FlatList data={data} keyExtractor={(item) => item} renderItem={({ item }) => null} />;\n}",
            good: "import { FlashList } from '@shopify/flash-list';\n\nexport function GoodList({ data }: { data: string[] }) {\n  return <FlashList data={data} keyExtractor={(item) => item} renderItem={({ item }) => null} estimatedItemSize={50} />;\n}",
          },
          negativeTest: {
            input: ["import { FlatList } from 'react-native';"],
            'expect-violation': 'no-restricted-imports',
          },
        },
      ],
    };
  },
};

// stubGenerateForbid → one forbid-class candidate (seam i-2). presence:'forbid' + selector →
//                  synthesizeGenerate routes it to check.type:'declarative' (executable L4 roundtrip),
//                  NOT manual. entryId MUST be a real id in rn-research-plan.json, else the candidate
//                  is skipped (generate.ts) and plan.rules is empty.
export const stubGenerateForbid: GenerateClient = {
  async generate(_menu: Menu): Promise<GenerateSelection> {
    return {
      rules: [
        {
          entryId: 'rn-web-globals',
          ruleId: 'no-foo',
          title: 'Forbid foo() calls (seam i-2 declarative)',
          stack: ['react-native'],
          presence: 'forbid',
          selector: "CallExpression[callee.name='foo']",
          message: 'foo banned',
          examples: { bad: 'foo()', good: 'bar()' },
          negativeTest: {
            input: ['foo()'],
            'expect-violation': 'no-restricted-syntax',
          },
        },
      ],
    };
  },
};

export const stubGenerateBad: GenerateClient = {
  async generate(menu: Menu): Promise<GenerateSelection> {
    const first = menu.candidates[0];
    if (!first) return { rules: [] };
    return {
      rules: [
        {
          entryId: first.id,
          ruleId: 'no-restricted-imports',
          title: 'test-tautology stub (bad)',
          stack: ['react-native'],
          eslintConfig: {
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
          examples: {
            bad: "import { useState } from 'react'; export const C = () => null;",
            good: 'export function identity(x: unknown) { return x; }',
          },
          negativeTest: {
            input: ["import { useState } from 'react'; export const C = () => null;"],
            'expect-violation': 'no-restricted-imports',
          },
        },
      ],
    };
  },
};
