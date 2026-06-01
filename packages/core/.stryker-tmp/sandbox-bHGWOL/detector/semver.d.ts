// @ts-nocheck
// Local shim for `semver` (already transitive via @typescript-eslint/rule-tester
// — phase-4-research §3.2, §4.2 verified 2026-05-08). @types/semver is NOT in the
// dep tree; per PHASE-4-PROMPT Hard constraint we MUST NOT add `semver` (or its
// types) as an explicit dep. This shim declares only the surface we consume in
// detector/version-aware.ts — keep it minimal so an upgrade can drop it cleanly.

declare module 'semver' {
  export interface SemVer {
    version: string;
    major: number;
    minor: number;
    patch: number;
  }
  export function coerce(input: string | null | undefined): SemVer | null;
  export function valid(input: string | null | undefined): string | null;
  export function satisfies(version: string, range: string): boolean;
  const _default: {
    coerce: typeof coerce;
    valid: typeof valid;
    satisfies: typeof satisfies;
  };
  export default _default;
}
