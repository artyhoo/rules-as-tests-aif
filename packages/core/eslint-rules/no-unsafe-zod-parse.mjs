import { ESLintUtils } from '@typescript-eslint/utils';
const createRule = ESLintUtils.RuleCreator((_name) => `https://github.com/Yhooi2/rules-as-tests-aif/blob/main/packages/preset-next-15-canonical/RULES.md#r2--validation-at-boundaries`);
export const noUnsafeZodParse = createRule({
    name: 'no-unsafe-zod-parse',
    meta: {
        type: 'problem',
        docs: {
            description: 'Forbid Zod `.parse()` in HTTP boundary files; require `.safeParse()`.',
        },
        messages: {
            useSafeParse: 'Use `.safeParse()` instead of `.parse()` in HTTP boundaries — `.parse()` throws and bypasses structured error handling (R2).',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        const sourceCode = context.sourceCode;
        return {
            "CallExpression[callee.type='MemberExpression'][callee.property.name='parse']"(node) {
                const line = node.loc.start.line;
                const lines = sourceCode.lines;
                const currentLine = lines[line - 1] ?? '';
                if (currentLine.includes('// audit:exempt'))
                    return;
                context.report({ node, messageId: 'useSafeParse' });
            },
        };
    },
});
