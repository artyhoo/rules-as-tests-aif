/**
 * Principle 9 — Doc authority hierarchy: shared module exposing the canonical
 * doc list and the check function used by both the vitest suite and CLI tooling.
 *
 * Exported API is consumed by:
 *   - 09-doc-authority-hierarchy.test.ts  (full-set vitest run)
 *   - 09-doc-authority-hierarchy.bin.ts   (CLI shim for pre-push / harness-hooks)
 *   - sub-waves 7.2.c and 7.4             (PostToolUse + make validate-prompts)
 *
 * Keep the function signature stable — downstream consumers depend on it.
 */
import { readFileSync, existsSync } from 'node:fs';

const AUTHORITY_HEADER_RE = /^> \*\*Authoritative for:\*\*/m;

/**
 * Canonical list of authority-bearing docs per `.claude/rules/doc-authority-
 * hierarchy.md` §2 "Required for" + "Folder-level authority" categories.
 *
 * Filename-convention category (PHASE-*-PROMPT.md, phase-*-research.md) is
 * intentionally NOT enumerated — those derive scope from filename pattern.
 *
 * When updating this list, also update the rule's §2 to match (drift sentinel
 * test below catches list-shape changes; semantic alignment with the rule is
 * the maintainer's responsibility).
 */
export const REQUIRED_HEADER_DOCS: readonly string[] = [
  // Project-root docs
  'README.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'INSTALL.md',
  'INSTALL-FOR-AI.md',

  // Hot operational
  '.claude/session-bootstrap.md',
  '.claude/rules/phase-research-coverage.md',
  '.claude/rules/doc-authority-hierarchy.md',

  // docs/meta-factory/ reference docs (excluding sub-folders + filename-convention transients)
  'docs/meta-factory/EXECUTION-PLAN.md',
  'docs/meta-factory/PROPOSAL.md',
  'docs/meta-factory/architecture.md',
  'docs/meta-factory/self-application.md',
  'docs/meta-factory/principles-as-tests.md',
  'docs/meta-factory/aif-comparison.md',
  'docs/meta-factory/open-questions.md',
  'docs/meta-factory/prior-art-evaluations.md',
  'docs/meta-factory/acceptance-tests.md',
  'docs/meta-factory/core-stability.md',
  'docs/meta-factory/failure-modes.md',
  'docs/meta-factory/migration-from-current.md',
  'docs/meta-factory/niche-stacks.md',
  'docs/meta-factory/risks.md',
  'docs/meta-factory/roadmap.md',
  'docs/meta-factory/versioning-and-locks.md',
  'docs/meta-factory/self-diagnostics-design.md',

  // Folder-level READMEs (sub-folder authority covers individual files)
  'docs/meta-factory/retros/README.md',
  'docs/meta-factory/research-patches/README.md',

  // skills/ — primary doc + cold references
  'skills/rules-as-tests/SKILL.md',
  'skills/rules-as-tests/references/ai-traps.md',
  'skills/rules-as-tests/references/checks-map.md',
  'skills/rules-as-tests/references/doc-organization.md',
  'skills/rules-as-tests/references/overview.md',
  'skills/rules-as-tests/references/self-testing-docs.md',
  'skills/tool-bootstrapping/SKILL.md',
  'skills/tool-bootstrapping/references/decision-format.md',

  // .claude/skills/ — project-internal skill primary + cold references (Wave 5.1)
  '.claude/skills/tool-bootstrapping/SKILL.md',
  '.claude/skills/tool-bootstrapping/references/decision-format.md',

  // Framework-shipped templates copied to consumer .ai-factory/ and project root
  'packages/core/templates/shared/AGENTS.md.template',
  'packages/core/templates/shared/CLAUDE.md.template',
  'packages/core/templates/shared/DESCRIPTION.template.md',
  'packages/core/templates/shared/ARCHITECTURE.ts-server.md',
  'packages/core/templates/shared/integration-rules.md',
  'packages/preset-next-15-canonical/RULES.md',
  'packages/preset-next-15-canonical/RULES.react-next.md',
  'packages/preset-next-15-canonical/templates/ARCHITECTURE.react-next.md',

  // Sub-agents copied to consumer .claude/agents/ via install.sh:138-141
  'agents/best-practices-sidecar.md',
  'agents/review-sidecar.md',
  'agents/docs-auditor.md',
];

/**
 * Exemption globs for fixtures intentionally lacking Authoritative-for header.
 * Pattern: pure regex, no glob lib (zero new dep).
 */
export const EXEMPT_PATTERNS: readonly RegExp[] = [
  /^packages\/[^/]+\/research\/fixtures\//,
  /^packages\/.+\/fixtures\//,
];

export function isExempt(relPath: string): boolean {
  return EXEMPT_PATTERNS.some((re) => re.test(relPath));
}

/**
 * Filter argv-style path list to entries that the rule cares about:
 * - paths enumerated in REQUIRED_HEADER_DOCS (authority-bearing docs), OR
 * - paths matching an EXEMPT_PATTERNS glob (fixtures intentionally headerless).
 *
 * Used by the CLI shim (sub-wave 7.1.c, M1 fix 2026-05-11) so PostToolUse hooks
 * fired on non-doc edits (.ts/.json/package.json) no longer surface FAIL noise.
 * Empty result → caller should exit 0 silently.
 */
export function selectRequiredPaths(paths: string[]): string[] {
  const requiredSet = new Set<string>(REQUIRED_HEADER_DOCS);
  return paths.filter((p) => requiredSet.has(p) || isExempt(p));
}

function readFile(p: string): string {
  return readFileSync(p, 'utf8');
}

function stripFencedCodeBlocks(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '');
}

export function hasAuthorityHeader(content: string): boolean {
  return AUTHORITY_HEADER_RE.test(stripFencedCodeBlocks(content));
}

export interface AuthorityViolation {
  path: string;
  reason: string;
}

export interface CheckResult {
  ok: boolean;
  violations: AuthorityViolation[];
}

/**
 * Check that each path in `paths` declares an Authoritative-for header.
 * Paths are relative to the repo root; repoRoot defaults to process.cwd().
 *
 * Used by pre-push changed-files mode (sub-wave 7.1.c) and harness-hook
 * PostToolUse matcher (sub-wave 7.2.c).
 */
export function checkDocsHaveAuthorityHeader(
  paths: string[],
  repoRoot: string = process.cwd(),
): CheckResult {
  const violations: AuthorityViolation[] = [];

  for (const relPath of paths) {
    if (isExempt(relPath)) continue;

    const fullPath = `${repoRoot}/${relPath}`;
    if (!existsSync(fullPath)) {
      violations.push({ path: relPath, reason: 'file does not exist' });
      continue;
    }

    const content = readFile(fullPath);
    if (!hasAuthorityHeader(content)) {
      violations.push({
        path: relPath,
        reason:
          'missing "> **Authoritative for:**" header — see .claude/rules/doc-authority-hierarchy.md §3',
      });
    }
  }

  return { ok: violations.length === 0, violations };
}
