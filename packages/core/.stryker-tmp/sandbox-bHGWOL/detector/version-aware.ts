// @ts-nocheck
// Version-aware logic via npm `semver` (transitive via @typescript-eslint/rule-tester).
// Per phase-4-research §3.2 + §4.2: no explicit dep, no self-rolled regex.

import semver from 'semver';

export function extractMajor(versionRange: string | undefined | null): number | null {
  if (!versionRange) return null;
  const coerced = semver.coerce(versionRange);
  return coerced ? coerced.major : null;
}

export function extractVersion(versionRange: string | undefined | null): string | null {
  if (!versionRange) return null;
  const coerced = semver.coerce(versionRange);
  return coerced ? coerced.version : null;
}
