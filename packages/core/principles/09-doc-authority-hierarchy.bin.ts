#!/usr/bin/env tsx
/**
 * CLI shim for principle 09 changed-files mode.
 *
 * Usage (from repo root):
 *   npx tsx packages/core/principles/09-doc-authority-hierarchy.bin.ts \
 *     path/to/doc.md another/doc.md
 *
 * Reads paths from argv (relative to repo root = process.cwd()).
 * Filters to REQUIRED_HEADER_DOCS ∪ EXEMPT_PATTERNS — non-doc paths exit 0
 * silently so PostToolUse hooks do not surface FAIL noise on .ts/.json edits.
 * Prints violations to stderr; exits non-zero if any required-doc violation found.
 *
 * Wired into pre-push / harness-hook PostToolUse by sub-waves 7.2.c / 7.4.
 */
import {
  checkDocsHaveAuthorityHeader,
  isExempt,
  selectRequiredPaths,
} from './09-doc-authority-hierarchy.ts';

const paths = process.argv.slice(2);

if (paths.length === 0) {
  process.stderr.write('09-doc-authority-hierarchy: no paths provided — pass file paths as arguments\n');
  process.exit(0);
}

const filtered = selectRequiredPaths(paths);

if (filtered.length === 0) {
  process.exit(0);
}

const result = checkDocsHaveAuthorityHeader(filtered);

if (!result.ok) {
  for (const v of result.violations) {
    process.stderr.write(`FAIL  ${v.path}: ${v.reason}\n`);
  }
  process.exit(1);
}

const requiredCount = filtered.filter((p) => !isExempt(p)).length;
process.stdout.write(`OK  ${requiredCount} required path(s) checked — all have Authoritative-for header\n`);
process.exit(0);
