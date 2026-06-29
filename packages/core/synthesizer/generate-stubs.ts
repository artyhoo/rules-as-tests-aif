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

// stubGenerateReactSPA → returns the SPA rule set (all 3 as manual).
//   spa-error-boundary → eslintConfig absent → check.type:'manual'.
//     WHY manual: require-error-boundary is a glob-scoped rule (app-root files only). The L4
//     tautology gate runs all eslint rules against a generic JSX negative-corpus file
//     (unrelated.tsx) which has JSX but no ErrorBoundary — the rule fires tautologically.
//     This is architecturally correct: the rule is not general-purpose; it is only valid
//     when glob-scoped. So EB is 'manual' (same reasoning as RN R14/R15 being plugin rules).
//     The paired fixture test (b) proves the rule itself works correctly via direct Linter call.
//   spa-a11y  → eslintConfig absent → check.type:'manual' (plugin rule, honest about harness limit).
//   spa-hooks → eslintConfig absent → check.type:'manual' (plugin rule, honest about harness limit).
// Oracle coverage = {R-SPA-EB, R-SPA-A11Y, R-SPA-HOOKS} per RULES.react-spa.md.
export const stubGenerateReactSPA: GenerateClient = {
  async generate(_menu: Menu): Promise<GenerateSelection> {
    return {
      rules: [
        // R-SPA-EB: require-error-boundary — glob-scoped rule → tautological on generic JSX → manual
        {
          entryId: 'spa-error-boundary',
          ruleId: 'rules-as-tests/require-error-boundary',
          title: 'App-root must render content inside an ErrorBoundary JSX element',
          stack: ['react-spa'],
          // eslintConfig absent → synthesizeGenerate emits check.type:'manual'
          // (tautology gate would reject this rule on unrelated.tsx)
          examples: {
            bad: "function App() {\n  return <main><div>Hello</div></main>;\n}",
            good: "import { ErrorBoundary } from 'react-error-boundary';\nfunction App() {\n  return (\n    <ErrorBoundary fallback={<div>Error</div>}>\n      <main><div>Hello</div></main>\n    </ErrorBoundary>\n  );\n}",
          },
        },
        // R-SPA-A11Y: eslint-plugin-jsx-a11y — plugin rule → NOT in L4 KNOWN_PLUGINS → manual
        {
          entryId: 'spa-a11y',
          ruleId: 'jsx-a11y/alt-text',
          title: 'Web accessibility — jsx-a11y rules for React SPA',
          stack: ['react-spa'],
          // eslintConfig absent → synthesizeGenerate emits check.type:'manual'
          examples: {
            bad: "<img src=\"logo.png\" />",
            good: "<img src=\"logo.png\" alt=\"Company logo\" />",
          },
        },
        // R-SPA-HOOKS: eslint-plugin-react-hooks — plugin rule → NOT in L4 KNOWN_PLUGINS → manual
        {
          entryId: 'spa-hooks',
          ruleId: 'react-hooks/rules-of-hooks',
          title: 'Rules of Hooks — react-hooks plugin for React SPA',
          stack: ['react-spa'],
          // eslintConfig absent → synthesizeGenerate emits check.type:'manual'
          examples: {
            bad: "function Component({ condition }: { condition: boolean }) {\n  if (condition) {\n    const [x] = useState(0);\n    return <div>{x}</div>;\n  }\n  return null;\n}",
            good: "function Component() {\n  const [x, setX] = useState(0);\n  return <div onClick={() => setX(1)}>{x}</div>;\n}",
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
