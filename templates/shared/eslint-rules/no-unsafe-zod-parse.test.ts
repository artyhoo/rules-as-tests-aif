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
    // Comment exempt
    `const r = OrderSchema.parse(req.body); // audit:exempt`,
    // Method named parse but not via member access — won't match selector
    `const r = parse(req.body);`,
  ],
  invalid: [
    {
      code: `const r = OrderSchema.parse(req.body);`,
      errors: [{ messageId: 'useSafeParse' }],
    },
    {
      code: `const r = schema.parse(input);`,
      errors: [{ messageId: 'useSafeParse' }],
    },
    {
      code: `function h(req) { return Schema.parse(req.body); }`,
      errors: [{ messageId: 'useSafeParse' }],
    },
  ],
});
