/**
 * checks/unpinned-tool-install.ts — bare-run unpinned CI tool install gate
 * (.claude/rules/ci-tool-pinning.md §1 Rule A, issue #654).
 *
 * Pure logic separated from filesystem I/O (parallel to checks/s17.ts):
 * checkUnpinnedToolInstalls() takes file content as a string so it is
 * unit-testable without shelling out (see unpinned-tool-install.test.ts).
 *
 * Problem class: bare `run:` shell commands in .github/workflows/*.yml that
 * install a tool WITHOUT an explicit version pin. This slice is NOT covered by
 * zizmor's `adhoc-packages` audit, which targets npm/gem/pip via `setup-python`
 * action inputs only (T16 verified against docs.zizmor.sh + live 1.26.1 run;
 * SSOT #153b, 2026-06-22).
 */

/** A single line-level finding: file, 1-based line, the line text, and a hint. */
export interface UnpinnedFinding {
  file: string;
  line: number;
  text: string;
  hint: string;
}

// NOTE: detection is a per-line heuristic, not a shell parser. Known boundaries
// (acceptable — no repo site hits them, and the rule's escape hatch covers
// intentional exceptions): a line installing multiple packages where only some
// are pinned may slip the unpinned one through; an install command embedded in a
// quoted string (echo "pip install x") may be flagged. Carve-outs below handle
// the real-world workflow forms.

/** Escape hatch token — exact match required on the same line. */
const ESCAPE_HATCH_RE = /\bci-tool-pin:\s+allow\b/;

/** Comment-only line (starts with optional whitespace then #). */
const COMMENT_LINE_RE = /^\s*#/;

/**
 * Per-line pip-install check. Returns the hint string if the line is a
 * flaggable bare pip install, or null if it is clean / exempt.
 *
 * Exported for unit-testability.
 */
export function checkPipLine(rawLine: string): string | null {
  // Comment lines are not shell commands — skip.
  if (COMMENT_LINE_RE.test(rawLine)) return null;

  // Escape hatch: exact token on the same line → skip.
  if (ESCAPE_HATCH_RE.test(rawLine)) return null;

  // Does the line contain a pip install?
  if (!/\bpip\s+install\b/.test(rawLine)) return null;

  // Carve-outs.
  if (/\bpip\s+install\s+-r\b/.test(rawLine)) return null; // requirements file
  // `pip install .` and `pip install -e .` — local package installs
  if (/\bpip\s+install\s+\./.test(rawLine)) return null;
  if (/\bpip\s+install\s+-e\s+\./.test(rawLine)) return null;

  // Already pinned: contains == (e.g. pyyaml==6.0.2).
  if (/==/.test(rawLine)) return null;

  return 'fix: add a version pin, e.g. `pip install <pkg>==<ver>`';
}

/**
 * Per-line npm-global-install check. Returns the hint string if the line is a
 * flaggable bare npm global install, or null if it is clean / exempt.
 *
 * Exported for unit-testability.
 */
export function checkNpmGlobalLine(rawLine: string): string | null {
  if (COMMENT_LINE_RE.test(rawLine)) return null;
  if (ESCAPE_HATCH_RE.test(rawLine)) return null;

  if (!/\bnpm\s+(?:install|i)\s+-g\b/.test(rawLine)) return null;

  // Already pinned: a version `@<ver>` after the package name. Strip leading
  // scope(s) (`@scope/pkg`) first — a scoped name's own `@` is not a version
  // separator (`@angular/cli` is unpinned; `@angular/cli@15` is pinned).
  if (/@/.test(rawLine.replace(/@[\w.-]+\//g, ''))) return null;

  return 'fix: add a version pin, e.g. `npm install -g <pkg>@<ver>`';
}

/**
 * Scan workflow YAML content for unpinned bare-run tool installs.
 * Returns one UnpinnedFinding per flagged line.
 *
 * @param content  - full text of the workflow YAML file
 * @param filename - repo-relative path, used in finding output (file:line)
 */
export function checkUnpinnedToolInstalls(
  content: string,
  filename: string,
): UnpinnedFinding[] {
  const findings: UnpinnedFinding[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNo = i + 1; // 1-based

    const pipHint = checkPipLine(rawLine);
    if (pipHint !== null) {
      findings.push({ file: filename, line: lineNo, text: rawLine.trim(), hint: pipHint });
      continue; // only one finding per line
    }

    const npmHint = checkNpmGlobalLine(rawLine);
    if (npmHint !== null) {
      findings.push({ file: filename, line: lineNo, text: rawLine.trim(), hint: npmHint });
    }
  }

  return findings;
}
