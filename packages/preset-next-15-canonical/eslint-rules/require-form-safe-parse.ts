import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  () =>
    `https://github.com/Yhooi2/rules-as-tests-aif/blob/main/packages/preset-next-15-canonical/RULES.react-next.md#r14--forms`,
);

type FunctionLike =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

function isExempt(line: string): boolean {
  return line.includes('audit:exempt');
}

function isFormDataParam(param: TSESTree.Parameter): boolean {
  let target: TSESTree.Node = param;
  if (target.type === AST_NODE_TYPES.AssignmentPattern) target = target.left;
  if (target.type === AST_NODE_TYPES.RestElement) target = target.argument;
  if (target.type !== AST_NODE_TYPES.Identifier) return false;
  const ann = target.typeAnnotation?.typeAnnotation;
  if (!ann || ann.type !== AST_NODE_TYPES.TSTypeReference) return false;
  const tn = ann.typeName;
  if (tn.type === AST_NODE_TYPES.Identifier && tn.name === 'FormData') {
    return true;
  }
  if (
    tn.type === AST_NODE_TYPES.TSQualifiedName &&
    tn.right.type === AST_NODE_TYPES.Identifier &&
    tn.right.name === 'FormData'
  ) {
    return true;
  }
  return false;
}

function bodyHasSafeParseCall(body: TSESTree.Node): boolean {
  let found = false;
  const stack: TSESTree.Node[] = [body];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (
      node.type === AST_NODE_TYPES.CallExpression &&
      node.callee.type === AST_NODE_TYPES.MemberExpression &&
      node.callee.property.type === AST_NODE_TYPES.Identifier &&
      node.callee.property.name === 'safeParse'
    ) {
      found = true;
      break;
    }
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const value = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && 'type' in item) {
            stack.push(item as TSESTree.Node);
          }
        }
      } else if (value && typeof value === 'object' && 'type' in value) {
        stack.push(value as TSESTree.Node);
      }
    }
  }
  return found;
}

export const requireFormSafeParse = createRule({
  name: 'require-form-safe-parse',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Functions accepting a FormData parameter must validate input via .safeParse(...) (R14).',
    },
    messages: {
      missingFormSafeParse:
        'Function accepts FormData but does not call .safeParse(...). Validate the form input with a Zod schema (R14).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const lines = sourceCode.lines;
    const lineExempt = (n: number) => isExempt(lines[n - 1] ?? '');

    function check(fn: FunctionLike): void {
      const formDataParam = fn.params.find(isFormDataParam);
      if (!formDataParam) return;
      if (lineExempt(formDataParam.loc.start.line)) return;
      if (!fn.body) return;
      if (bodyHasSafeParseCall(fn.body)) return;
      context.report({
        node: formDataParam,
        messageId: 'missingFormSafeParse',
      });
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
