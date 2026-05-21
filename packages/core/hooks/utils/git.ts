/**
 * git.ts — thin git helpers for the pre-push hook (Wave 10.2).
 *
 * All git I/O for the trailer checks funnels through here so the check logic
 * (checks/prior-art.ts) stays pure + unit-testable against a fake GitProvider —
 * mirroring how the bash test mocked `git show` to return a fixed body.
 *
 * Changed-file scoping (`getChangedFiles`) is the lint-staged technique adapted
 * from aif-handoff (research patch §4.8.X.3): scope expensive checks to the
 * push range `origin/main..HEAD` rather than the whole tree.
 */
import { runCheck } from './run-check.ts';

/** Run git, return stdout (empty string on failure — callers tolerate it). */
function gitOut(args: readonly string[]): string {
  return runCheck('git', args).stdout;
}

/** A capability-detection / trailer view over git, injectable for tests. */
export interface GitProvider {
  /** `git show <sha> -- package.json` (the unified diff, or '' if none). */
  packageJsonDiff(sha: string): string;
  /** `git diff-tree --no-commit-id --name-status -r <sha>` parsed to {status,path}. */
  changedFiles(sha: string): { status: string; path: string }[];
  /** `git show <sha>:<path>` contents, or null if the path is absent at that sha. */
  fileContent(sha: string, path: string): string | null;
  /** Did `packages/core/<subdir>/` exist at <sha>'s parent? (false if no parent). */
  subdirExistedAtParent(sha: string, subdir: string): boolean;
  /** `git show -s --format=%B <sha>` — full commit message body. */
  commitBody(sha: string): string;
  /** Date part (YYYY-MM-DD) of `git show -s --format=%ai <sha>`. */
  authorDate(sha: string): string;
}

export function upstreamExists(ref: string): boolean {
  return runCheck('git', ['rev-parse', '--verify', ref]).exitCode === 0;
}

/** Commit SHAs in `<upstreamRef>..HEAD`, newest first (git rev-list order). */
export function getCommits(upstreamRef: string): string[] {
  return gitOut(['rev-list', `${upstreamRef}..HEAD`])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Changed files in the push range (aif-handoff scoping, §4.8.X.3). */
export function getChangedFiles(upstreamRef: string, diffFilter = 'ACMR'): string[] {
  return gitOut(['diff', '--name-only', `${upstreamRef}..HEAD`, `--diff-filter=${diffFilter}`])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNameStatus(out: string): { status: string; path: string }[] {
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf('\t');
      if (tab === -1) return { status: line, path: '' };
      return { status: line.slice(0, tab), path: line.slice(tab + 1) };
    })
    .filter((e) => e.path !== '');
}

/** The real git-backed provider used by the running hook. */
export const realGit: GitProvider = {
  packageJsonDiff: (sha) => gitOut(['show', sha, '--', 'package.json']),
  changedFiles: (sha) =>
    parseNameStatus(gitOut(['diff-tree', '--no-commit-id', '--name-status', '-r', sha])),
  fileContent: (sha, path) => {
    const r = runCheck('git', ['show', `${sha}:${path}`]);
    return r.exitCode === 0 ? r.stdout : null;
  },
  subdirExistedAtParent: (sha, subdir) => {
    const parent = `${sha}^`;
    if (!upstreamExists(parent)) return false;
    const out = gitOut(['ls-tree', '-r', '--name-only', parent, '--', `packages/core/${subdir}/`]);
    return out.trim().length > 0;
  },
  commitBody: (sha) => gitOut(['show', '-s', '--format=%B', sha]),
  authorDate: (sha) => gitOut(['show', '-s', '--format=%ai', sha]).trim().split(' ')[0] ?? '',
};
