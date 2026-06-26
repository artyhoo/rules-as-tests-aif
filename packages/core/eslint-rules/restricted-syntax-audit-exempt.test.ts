import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { restrictedSyntaxAuditExempt } from './restricted-syntax-audit-exempt.ts';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester();

// The generic wrapper mirrors `no-restricted-syntax` (variadic {selector, message}
// entries) PLUS the handwritten rules' per-line `audit:exempt` suppression
// (see require-form-safe-parse.ts isExempt / require-use-server-directive.ts isExempt).
ruleTester.run('restricted-syntax-audit-exempt', restrictedSyntaxAuditExempt, {
  valid: [
    // Selector does not match — no violation.
    {
      code: `const x = 1;`,
      options: [{ selector: 'TSEnumDeclaration', message: 'No enums.' }],
    },
    // Selector matches but the violation line carries `audit:exempt` — suppressed.
    {
      code: `enum E { A } // audit:exempt`,
      options: [{ selector: 'TSEnumDeclaration', message: 'No enums.' }],
    },
    // Block-comment form of the exemption is also honoured.
    {
      code: `enum E { A } /* audit:exempt */`,
      options: [{ selector: 'TSEnumDeclaration', message: 'No enums.' }],
    },
  ],
  invalid: [
    // Selector matches, no exemption — fires with the provided message.
    {
      code: `enum E { A }`,
      options: [{ selector: 'TSEnumDeclaration', message: 'No enums.' }],
      errors: [{ messageId: 'restrictedSyntax' }],
    },
    // Variadic: two selector entries, both fire on their respective nodes.
    {
      code: `enum E { A }\ndebugger;`,
      options: [
        { selector: 'TSEnumDeclaration', message: 'No enums.' },
        { selector: 'DebuggerStatement', message: 'No debugger.' },
      ],
      errors: [{ messageId: 'restrictedSyntax' }, { messageId: 'restrictedSyntax' }],
    },
    // A second entry whose line is exempt is suppressed while the first still fires.
    {
      code: `enum E { A }\ndebugger; // audit:exempt`,
      options: [
        { selector: 'TSEnumDeclaration', message: 'No enums.' },
        { selector: 'DebuggerStatement', message: 'No debugger.' },
      ],
      errors: [{ messageId: 'restrictedSyntax' }],
    },
  ],
});
