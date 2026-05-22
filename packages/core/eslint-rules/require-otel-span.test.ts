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
    // Kills L27 ConditionalExpression: property.name === 'startActiveSpan' → true.
    // A function calling tracer.otherMethod() has NO valid span; the mutant falsely
    // treats any member-expression call as a span and suppresses the error.
    {
      code: `export async function logMetric() { tracer.otherMethod('metric'); }`,
      errors: [{ messageId: 'missingSpan' }],
    },
    // Kills L14 ConditionalExpression: if (!body) return false → if (false) return false.
    // An expression-body async arrow has no BlockStatement, so body=undefined is passed
    // to functionHasSpan. The real rule returns false safely; the mutant crashes on
    // undefined, causing an unexpected error that fails the RuleTester assertion.
    {
      code: `export const fn = async () => doSomething();`,
      errors: [{ messageId: 'missingSpan' }],
    },
    // Kills L115 NoCoverage mutants: exercises the FunctionExpression arm of
    // `node.init.type === ArrowFunctionExpression || FunctionExpression`.
    // Without this test, the FunctionExpression branch is never exercised;
    // blanking it (→ false) or inverting (→ !==) goes undetected.
    {
      code: `export const handler = async function() { return { ok: true }; };`,
      errors: [{ messageId: 'missingSpan' }],
    },
  ],
});
