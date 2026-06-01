/**
 * Principle 17 — No paid LLM in CI (.claude/rules/no-paid-llm-in-ci.md)
 *
 * Source: .claude/rules/no-paid-llm-in-ci.md (§1 policy, §2 scope, §6 #paid-llm-creep
 *         counter: "pre-merge grep on workflow diffs for API call patterns")
 *         docs/meta-factory/research-patches/2026-05-22-memory-coverage-audit.md
 *           §5 row 8 + §10 DN-6 (the one clean stage-1→2 promotion: the rule was
 *           Class A "grep mechanism ready, test pending" — this ships the test).
 *
 * Invariant: no `.github/workflows/*.yml` contains an API-billed-LLM *usage* —
 * an ANTHROPIC/OPENAI API-key env assignment or secret reference, a paid API
 * hostname, or a paid SDK import. CI runs on the operator's Claude Code Max
 * subscription only; a paid-API call in CI bills the project per-invocation
 * (rule §3). This is the earliest-reachable deterministic channel for the
 * policy — before it could only be caught by review.
 *
 * Usage-precise, NOT mention-counting: the rule's own workflows legitimately
 * *mention* the token in negation comments (e.g. framework-self-template-render.yml:
 * "# Decision 3: NO LLM, NO API key, NO ANTHROPIC_API_KEY reference"). Matching
 * bare mentions would false-positive on the project's own clean CI. So full-line
 * comments are stripped first, and only assignment / secret-ref / hostname / SDK
 * forms are flagged (none of which appear in a prose negation).
 *
 * Out of scope (rule §2): session-bound LLM use (operator `claude` CLI; consumer
 * `/aif-verify`), context7 MCP — none touch `.github/workflows/`.
 *
 * T15 self-application: the no-paid-LLM policy is itself enforced by a free,
 * deterministic, in-CI test — the policy holds over its own enforcement channel.
 *
 * Prior-art note: secret-scanners (gitleaks, trufflehog) detect *leaked
 * credentials*; this is the inverse policy surface — "no paid-LLM dependency in
 * CI at all", a project-specific rule promotion, not credential-leak detection.
 * No upstream tool targets this problem class — see prior-art-evaluations.md
 * (no entry matches "ban paid-LLM API surface in own CI").
 */
// @ts-nocheck

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');
const WORKFLOWS_DIR = resolve(REPO_ROOT, '.github/workflows');

/** Paid-LLM *usage* patterns (assignment / secret-ref / hostname / SDK), not bare mentions. */
const PAID_LLM_PATTERNS: readonly { name: string; re: RegExp }[] = [
  { name: 'anthropic/openai api-key assignment', re: /\b(?:ANTHROPIC|OPENAI)_API_KEY\s*[:=]/ },
  { name: 'anthropic/openai api-key secret ref', re: /secrets\.\s*(?:ANTHROPIC|OPENAI)_API_KEY/ },
  { name: 'paid api hostname', re: /api\.(?:anthropic|openai)\.com/ },
  { name: 'paid LLM SDK import', re: /@anthropic-ai\/sdk|(?:require|import)[^\n]*['"]openai['"]/ },
];

/** Strip full-line YAML comments (`^\s*#…`) so negation-mentions don't false-positive. */
function stripCommentLines(content: string): string {
  return content
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

/** Scan one workflow's content; return the names of any paid-LLM usage patterns found. */
export function scanForPaidLlm(content: string): string[] {
  const scannable = stripCommentLines(content);
  return PAID_LLM_PATTERNS.filter((p) => p.re.test(scannable)).map((p) => p.name);
}

function workflowFiles(): string[] {
  if (!existsSync(WORKFLOWS_DIR)) return [];
  return readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => resolve(WORKFLOWS_DIR, f));
}

describe('Principle 17 — no paid LLM in CI', () => {
  it('finds at least one workflow to scan (guards against an empty/false pass)', () => {
    expect(workflowFiles().length).toBeGreaterThan(0);
  });

  it('no .github/workflows/*.yml contains a paid-LLM API usage', () => {
    const violations: string[] = [];
    for (const file of workflowFiles()) {
      const hits = scanForPaidLlm(readFileSync(file, 'utf8'));
      if (hits.length > 0) {
        violations.push(`${file.replace(REPO_ROOT + '/', '')}: ${hits.join(', ')}`);
      }
    }
    expect(violations, `paid-LLM usage in CI (no-paid-llm-in-ci.md §1):\n${violations.join('\n')}`).toEqual([]);
  });

  // ── Paired-negative: prove the scanner CATCHES real usage (load-bearing) ──
  it('paired-negative: flags an api-key env assignment', () => {
    const bad = ['jobs:', '  x:', '    env:', '      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}'].join('\n');
    expect(scanForPaidLlm(bad).length).toBeGreaterThan(0);
  });

  it('paired-negative: flags a paid API hostname in a run step', () => {
    const bad = ['    - run: curl https://api.openai.com/v1/chat/completions'].join('\n');
    expect(scanForPaidLlm(bad)).toContain('paid api hostname');
  });

  it('paired-negative: flags a paid SDK import', () => {
    expect(scanForPaidLlm(`    - run: node -e "const x = require('openai')"`).length).toBeGreaterThan(0);
    expect(scanForPaidLlm(`    - run: npm i @anthropic-ai/sdk`).length).toBeGreaterThan(0);
  });

  // ── Negative-control: must NOT false-positive on legitimate negation mentions ──
  it('does NOT flag a negation mention in a comment (no false-positive)', () => {
    const ok = '# Decision 3: NO LLM, NO API key, NO ANTHROPIC_API_KEY reference.';
    expect(scanForPaidLlm(ok)).toEqual([]);
  });

  it('does NOT flag out-of-scope session/MCP tooling', () => {
    const ok = ['    - run: claude --version   # CLI, subscription-bundled', '    - run: echo "context7 MCP query"'].join('\n');
    expect(scanForPaidLlm(ok)).toEqual([]);
  });
});
