import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { requireOtelSpan } from './require-otel-span.ts';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

ruleTester.run('require-otel-span', requireOtelSpan, {
  valid: [
    // tracer.startActiveSpan
    `export async function placeOrder() {
       return tracer.startActiveSpan('placeOrder', async (span) => {
         span.end();
         return { ok: true };
       });
     }`,
    // withSpan
    `export async function getUser() {
       return withSpan('getUser', async () => ({ id: 1 }));
     }`,
    // arrow
    `export const handle = async () => {
       return tracer.startActiveSpan('handle', async () => null);
     };`,
    // sync function — rule doesn't apply
    `export function notAsync() { return 1; }`,
    // non-exported async — rule doesn't apply
    `async function inner() { return 1; }`,
  ],
  invalid: [
    {
      code: `export async function placeOrder() { return { ok: true }; }`,
      errors: [
        { messageId: 'missingSpan', data: { name: 'placeOrder' } },
      ],
    },
    {
      code: `export const placeOrder = async () => { return { ok: true }; };`,
      errors: [
        { messageId: 'missingSpan', data: { name: 'placeOrder' } },
      ],
    },
    {
      code: `export async function process() { await save(); }`,
      errors: [{ messageId: 'missingSpan' }],
    },
  ],
});
