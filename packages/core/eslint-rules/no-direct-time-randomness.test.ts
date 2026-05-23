import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noDirectTimeRandomness } from './no-direct-time-randomness.ts';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

ruleTester.run('no-direct-time-randomness', noDirectTimeRandomness, {
  valid: [
    // injected via context — selector won't match
    `const ts = clock.now();`,
    `const r = random.next();`,
    // Exempt lines
    `const ts = Date.now(); // audit:exempt`,
    `const d = new Date(); // audit:exempt`,
    `const r = Math.random(); // audit:exempt`,
    `import { readFileSync } from 'fs'; // audit:exempt`,
    // Allowed: import from non-banned modules
    `import { z } from 'zod';`,
    // Allowed: Date used as type
    `const d: Date | null = null;`,
  ],
  invalid: [
    {
      code: `const ts = Date.now();`,
      errors: [{ messageId: 'noDateNow' }],
    },
    {
      code: `const d = new Date();`,
      errors: [{ messageId: 'noNewDate' }],
    },
    {
      code: `const r = Math.random();`,
      errors: [{ messageId: 'noMathRandom' }],
    },
    {
      code: `import { readFileSync } from 'fs';`,
      errors: [
        { messageId: 'noDirectIO', data: { module: 'fs' } },
      ],
    },
    {
      code: `import http from 'node:http';`,
      errors: [{ messageId: 'noDirectIO' }],
    },
    {
      code: `import https from 'https';`,
      errors: [{ messageId: 'noDirectIO' }],
    },
    // Paired-negative: ensure each FORBIDDEN_MODULES entry is individually covered
    // (kills string-literal mutants that blank individual set members)
    {
      code: `import http from 'http';`,
      errors: [{ messageId: 'noDirectIO', data: { module: 'http' } }],
    },
    {
      code: `import { readdir } from 'node:fs';`,
      errors: [{ messageId: 'noDirectIO', data: { module: 'node:fs' } }],
    },
    {
      code: `import { request } from 'node:https';`,
      errors: [{ messageId: 'noDirectIO', data: { module: 'node:https' } }],
    },
  ],
});
