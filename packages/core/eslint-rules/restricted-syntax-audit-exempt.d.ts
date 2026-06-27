import { ESLintUtils } from '@typescript-eslint/utils';
interface RestrictedEntry {
    selector: string;
    message?: string;
}
type Options = RestrictedEntry[];
export declare const restrictedSyntaxAuditExempt: ESLintUtils.RuleModule<"restrictedSyntax", Options, unknown, ESLintUtils.RuleListener> & {
    name: string;
};
export {};
