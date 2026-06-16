/**
 * s17-pr-body.ts — §1.7 CI PR-body citation-existence check (combo L2 block + L3 warn).
 *
 * Companion to checks/s17.ts (pre-push commit-trailer surface). This validates the
 * `### §1.7 Forward/Backward-check applied` sections in a PULL-REQUEST body, enforced
 * by .github/workflows/discipline-self-check.yml. Pure logic separated from fs I/O via
 * the injected RepoFileReader, so it is unit-testable + Stryker-mutatable.
 *
 * Spec: docs/superpowers/specs/2026-06-16-s17-pr-body-citation-existence-gate-design.md
 */

/** Reads repo files at the checked-out head; null = path absent. Injected for tests. */
export interface RepoFileReader {
  readLines(path: string): string[] | null;
}

export interface Citation {
  raw: string;
  path: string;
  line: number;
}

export interface CitationResult {
  blockers: string[];
  warnings: string[];
}

// Same shape the CI gate's awk/grep uses: non-space, dot, lowercase ext, colon, digits.
const CITATION_RE = /[^\s]+\.[a-z]+:[0-9]+/g;

const SECTIONS = [
  '### §1.7 Forward-check applied',
  '### §1.7 Backward-check applied',
] as const;

/** Capture a section body: from the heading line to the next "###" (exclusive). */
export function extractSection(prBody: string, heading: string): string {
  const out: string[] = [];
  let capture = false;
  for (const line of prBody.split('\n')) {
    if (line.startsWith(heading)) {
      capture = true;
      continue;
    }
    if (line.startsWith('###')) capture = false;
    if (capture) out.push(line);
  }
  return out.join('\n');
}

/** All path:line citations in a section. */
export function findCitations(section: string): Citation[] {
  const out: Citation[] = [];
  for (const m of section.matchAll(CITATION_RE)) {
    // Greedy `[^\s]+` swallows a leading markdown wrapper (`` ` ``, `(`, `[`) — PR
    // authors routinely write citations as inline code `path:line`. Strip leading
    // chars that cannot begin a repo path so the path resolves against the repo.
    const raw = m[0].replace(/^[^A-Za-z0-9._/~]+/, '');
    const idx = raw.lastIndexOf(':');
    out.push({ raw, path: raw.slice(0, idx), line: Number(raw.slice(idx + 1)) });
  }
  return out;
}

/**
 * Confidently a repo path (vs prose like "Node.js:18" or "v1.2:3")? Requires a
 * slash — prose almost never has `word/word.ext:line`, whereas real §1.7 citations
 * are repo-relative (`packages/...`, `docs/...`). Bare filenames (README.md) are
 * ambiguous → not warned by L3; they still count toward the L2 "≥1 resolves" check.
 */
export function looksLikeRepoPath(path: string): boolean {
  return path.includes('/');
}

/** Non-blank and not punctuation/brace-only (has ≥1 alphanumeric/underscore char). */
export function isSubstantiveLine(text: string): boolean {
  return /[A-Za-z0-9_]/.test(text);
}

/** Resolve one citation: file exists at HEAD AND line number in range. */
function resolvesCitation(c: Citation, reader: RepoFileReader): boolean {
  const lines = reader.readLines(c.path);
  return lines !== null && c.line >= 1 && c.line <= lines.length;
}

/**
 * L2 (block): for each section with ≥1 citation, at least one must resolve at HEAD.
 * L3 (warn): genuine-looking citations that don't resolve, or point to a filler line.
 */
export function checkPrBodyCitations(
  prBody: string,
  reader: RepoFileReader,
): CitationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const heading of SECTIONS) {
    const citations = findCitations(extractSection(prBody, heading));

    if (
      citations.length > 0 &&
      !citations.some((c) => resolvesCitation(c, reader))
    ) {
      blockers.push(
        `${heading}: no citation resolves to an existing file:line at HEAD ` +
          `(checked ${citations.length}: ${citations.map((c) => c.raw).join(', ')}). ` +
          `Cite at least one real path.ext:line.`,
      );
    }

    for (const c of citations) {
      if (!looksLikeRepoPath(c.path)) continue;
      const lines = reader.readLines(c.path);
      if (lines === null || c.line < 1 || c.line > lines.length) {
        warnings.push(
          `${heading}: citation ${c.raw} does not resolve (file absent or line out of range).`,
        );
        continue;
      }
      if (!isSubstantiveLine(lines[c.line - 1])) {
        warnings.push(
          `${heading}: citation ${c.raw} points to a non-substantive line (blank/punctuation-only).`,
        );
      }
    }
  }
  return { blockers, warnings };
}
