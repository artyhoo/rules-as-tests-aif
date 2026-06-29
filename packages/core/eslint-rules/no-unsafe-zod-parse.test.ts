import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noUnsafeZodParse } from './no-unsafe-zod-parse.ts';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

ruleTester.run('no-unsafe-zod-parse', noUnsafeZodParse, {
  valid: [
    // safeParse is allowed
    `const r = OrderSchema.safeParse(req.body);`,
    // audit:exempt escape hatch
    `const r = OrderSchema.parse(req.body); // audit:exempt`,
    // standalone parse function (not member access — selector won't match)
    `const r = parse(req.body);`,
    // Stdlib .parse() MUST NOT be flagged.
    // Revert-killer: restoring the bare selector
    // `CallExpression[callee.property.name='parse']` causes these three to fail,
    // proving the test detects the over-broad selector (the gap the shipped test had).
    `const r = JSON.parse(text);`,
    `const d = Date.parse(str);`,
    `const p = path.parse(str);`,
  ],
  invalid: [
    // *Schema naming convention: identifiers suffixed with Schema are treated as Zod schemas
    {
      code: `const r = OrderSchema.parse(req.body);`,
      errors: [{ messageId: 'useSafeParse' }],
    },
    // Direct z.* chain: z.string().parse(input)
    {
      code: `const r = z.string().parse(input);`,
      errors: [{ messageId: 'useSafeParse' }],
    },
    // Direct z.* chain: z.object({...}).parse(input)
    {
      code: `const r = z.object({ id: z.string() }).parse(input);`,
      errors: [{ messageId: 'useSafeParse' }],
    },
    // Scope-resolved z.* init: const S = z.object({...}); S.parse(input)
    {
      code: `const S = z.object({ id: z.string() }); const r = S.parse(input);`,
      errors: [{ messageId: 'useSafeParse' }],
    },
  ],
});
