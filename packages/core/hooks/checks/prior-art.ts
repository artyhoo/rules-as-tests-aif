/**
 * prior-art.ts — §7 Prior-art trailer check (Phase 8.8 T8), ported from bash in
 * Wave 10.2. Faithful TS port of `pa_*` from the former legacy-trailer-checks.sh:
 * capability-commit detection + `Prior-art:` trailer validation (length,
 * placeholder rejection, escape-hatch substance arm).
 *
 * Pure logic (diff/body/LOC parsing) is separated from git I/O via the injected
 * GitProvider (utils/git.ts), so this module is unit-testable + Stryker-mutatable
 * without shelling out — the bash predecessor had zero mutation coverage.
 */
import type { GitProvider } from '../utils/git.ts';

/** Wave 8.5 cutoff — commits authored before this bypass the check (rebase replay). */
export const PA_HISTORICAL_CUTOFF = '2026-05-12';

const PLACEHOLDERS = new Set(['todo', 'later', 'na', 'tbd', 'fixme', 'placeholder', '']);

/** `wc -l` semantics: number of newline characters in the content. */
export function loc(content: string): number {
  return content.split('\n').length - 1;
}

/** Lowercase + strip ASCII punctuation only (matches bash `tr -d '[:punct:]'` on bytes). */
function stripPunctLower(word: string): string {
  return word
    .toLowerCase()
    .replace(/[!-/:-@[-`{-~]/g, '');
}

/**
 * A package.json diff adds a NEW dependency (not a version bump) when a dep key
 * appears on a `+` line but no matching `-` line. Semver-prefix coverage mirrors
 * the bash: caret / tilde / range / digit / wildcard (dist-tags + URL specs slip).
 */
export function isNewDepAdded(packageJsonDiff: string): boolean {
  if (!packageJsonDiff) return false;
  const added = new Set<string>();
  const removed = new Set<string>();
  const re = /^([+-])\s+"([^"]+)":\s*"(\^|~|>=?|<=?|=|[0-9*])/;
  for (const line of packageJsonDiff.split('\n')) {
    const m = re.exec(line);
    if (!m) continue;
    (m[1] === '+' ? added : removed).add(m[2]);
  }
  for (const key of added) {
    if (!removed.has(key)) return true;
  }
  return false;
}

function isNewCoreSubdir50Loc(sha: string, g: GitProvider): boolean {
  for (const { status, path } of g.changedFiles(sha)) {
    if (status !== 'A') continue;
    if (!path.startsWith('packages/core/')) continue;
    const subdir = path.slice('packages/core/'.length).split('/')[0];
    if (g.subdirExistedAtParent(sha, subdir)) continue; // not a NEW subdir
    const content = g.fileContent(sha, path);
    if (content !== null && loc(content) >= 50) return true;
  }
  return false;
}

function isNewPackages80Loc(sha: string, g: GitProvider): boolean {
  for (const { status, path } of g.changedFiles(sha)) {
    if (status !== 'A') continue;
    if (!path.startsWith('packages/')) continue;
    const content = g.fileContent(sha, path);
    if (content !== null && loc(content) >= 80) return true;
  }
  return false;
}

/** Why this commit is a capability commit, or null if it is not one. */
export function detectCapabilityReason(sha: string, g: GitProvider): string | null {
  if (isNewDepAdded(g.packageJsonDiff(sha))) return 'new explicit dep in package.json';
  if (isNewCoreSubdir50Loc(sha, g)) return 'new file ≥50 LOC under new packages/core/<dir>/';
  if (isNewPackages80Loc(sha, g)) return 'new file ≥80 LOC under packages/';
  return null;
}

export interface TrailerResult {
  /** 0 = valid, 1 = missing/invalid trailer, 2 = escape-hatch substance failure. */
  code: 0 | 1 | 2;
  message: string;
}

/**
 * Validate the `Prior-art:` trailer of a commit body. Pure — takes the body +
 * author date so it is testable with fixtures (the bash mocked `git show`).
 */
export function checkTrailerBody(
  body: string,
  authorDate: string,
  cutoff: string = PA_HISTORICAL_CUTOFF,
): TrailerResult {
  // Historical-cutoff bypass (string compare on ISO dates, as in bash).
  if (authorDate && authorDate < cutoff) return { code: 0, message: '' };

  let foundAny = false;
  for (const line of body.split('\n')) {
    if (!line.startsWith('Prior-art:')) continue;
    foundAny = true;
    let payload = line.slice('Prior-art:'.length).replace(/^ /, ''); // strip one leading space
    if (payload.length < 20) continue; // too short — a later valid line may still pass
    if (payload.startsWith('skipped')) {
      let rationale = payload.slice('skipped'.length).replace(/^ +/, '');
      rationale = rationale.replace(/^[—–\-:]/, '').replace(/^ +/, '');
      if (rationale.length < 20) continue;
      const words = rationale.split(/\s+/).filter(Boolean);
      const allPlaceholder = words.every((w) => PLACEHOLDERS.has(stripPunctLower(w)));
      if (allPlaceholder) continue;
      // Escape-hatch on a capability commit is contradictory by construction.
      return {
        code: 2,
        message:
          'substance: Prior-art: skipped on capability commit — cite an SSOT entry (prior-art-evaluations.md#N) instead',
      };
    }
    return { code: 0, message: '' };
  }
  return {
    code: 1,
    message: foundAny
      ? 'Prior-art: line found but invalid (length <20 or placeholder rationale)'
      : 'no Prior-art: trailer',
  };
}

export interface PriorArtFinding {
  sha: string;
  reason: string;
  message: string;
}
export interface PriorArtReport {
  failures: PriorArtFinding[]; // exit-1 class: missing/invalid trailer
  substanceFailures: PriorArtFinding[]; // exit-2 class: escape-hatch on capability
}

/**
 * Run the §7 check over the given commits. Returns findings; the caller decides
 * how to print and whether the substance arm is warn-only.
 */
export function runPriorArtCheck(
  commits: readonly string[],
  g: GitProvider,
  cutoff: string = PA_HISTORICAL_CUTOFF,
): PriorArtReport {
  const failures: PriorArtFinding[] = [];
  const substanceFailures: PriorArtFinding[] = [];
  for (const sha of commits) {
    const reason = detectCapabilityReason(sha, g);
    if (reason === null) continue; // not a capability commit
    const { code, message } = checkTrailerBody(g.commitBody(sha), g.authorDate(sha), cutoff);
    if (code === 1) failures.push({ sha: sha.slice(0, 10), reason, message });
    else if (code === 2) substanceFailures.push({ sha: sha.slice(0, 10), reason, message });
  }
  return { failures, substanceFailures };
}
