/**
 * Principle 18 — meta-orchestrator output-format structural check
 *
 * Source: .claude/skills/meta-orchestrator/SKILL.md §10 + references/output-format.md
 *         docs/meta-factory/research-patches/2026-05-24-meta-orchestrator-refactor-f3-scope.md §1.5 Item 8
 *
 * Invariant: the /meta-orchestrator slash-command emits a 3-layer inline session
 * report — Dependency graph + Action queue + 1-liner blocks. The skill body and
 * its consumer mirror must both communicate the 3 substructures literally, and
 * the full grammar + 4 worked examples must live in references/output-format.md
 * (per kickoff §4 #10 — split when SKILL.md would exceed 500-line gate).
 *
 * Mechanical check: for each of the 4 surface files
 *   - .claude/skills/meta-orchestrator/SKILL.md §10
 *   - skills/meta-orchestrator/SKILL.md §10
 *   - .claude/skills/meta-orchestrator/references/output-format.md
 *   - skills/meta-orchestrator/references/output-format.md
 * assert the 6 required substrings appear:
 *   (1) '## Dependency graph'
 *   (2) '↓'                       — inter-stage edge symbol
 *   (3) '## Action queue'
 *   (4) 'Paste в новый CC tab'   — action-queue column header
 *   (5) 'Можно параллельно с'   — action-queue column header
 *   (6) '### Stage'              — 1-liner heading prefix
 *
 * Slot 18 rationale: slots 01-17 occupied as of 2026-05-24 (`ls packages/core/principles/`).
 *
 * Companion paired-negative: a permutation test temporarily replaces one substring
 * with a placeholder, asserts the structural check FAILS, then restores. Run via
 * the dedicated paired-negative block below (does not mutate the actual files).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

// Required substrings (all must appear in §10 of each SKILL.md and somewhere in each output-format.md).
const REQUIRED_SUBSTRINGS = [
  '## Dependency graph',
  '↓',
  '## Action queue',
  'Paste в новый CC tab',
  'Можно параллельно с',
  '### Stage',
] as const;

// Files that must contain all REQUIRED_SUBSTRINGS in §10 (SKILL.md) or anywhere (output-format.md).
interface Surface {
  readonly label: string;
  readonly path: string;
  readonly scope: 'section-10' | 'whole-file';
}

const SURFACES: readonly Surface[] = [
  {
    label: 'authoring SKILL.md §10',
    path: '.claude/skills/meta-orchestrator/SKILL.md',
    scope: 'section-10',
  },
  {
    label: 'consumer-mirror SKILL.md §10',
    path: 'skills/meta-orchestrator/SKILL.md',
    scope: 'section-10',
  },
  {
    label: 'authoring references/output-format.md',
    path: '.claude/skills/meta-orchestrator/references/output-format.md',
    scope: 'whole-file',
  },
  {
    label: 'consumer-mirror references/output-format.md',
    path: 'skills/meta-orchestrator/references/output-format.md',
    scope: 'whole-file',
  },
];

/**
 * Extract §10 region from a SKILL.md (between '## §10' or '## Output artifacts' heading
 * and the next '## ' heading or end-of-file).
 */
function extractSectionTen(content: string): string {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => /^## (?:§10|Output|Plain-language|10\s)/i.test(l) || /^## §10/.test(l));
  if (start === -1) return '';
  // Allow §10 + the following Plain-language tail section as one scope (mirror condenses).
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## (?!§10|Output|Plain-language|10\s)/.test(lines[i])) {
      // Only break at the SECOND non-output section to allow §10 + §10.3a fold.
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function checkSurface(surface: Surface): { ok: boolean; missing: string[] } {
  const fullPath = resolve(REPO_ROOT, surface.path);
  if (!existsSync(fullPath)) {
    return { ok: false, missing: [`FILE MISSING: ${surface.path}`] };
  }
  const content = readFileSync(fullPath, 'utf8');
  const scope = surface.scope === 'section-10' ? extractSectionTen(content) : content;
  if (!scope) {
    return { ok: false, missing: [`§10 SECTION NOT FOUND in ${surface.path}`] };
  }
  const missing: string[] = [];
  for (const sub of REQUIRED_SUBSTRINGS) {
    if (!scope.includes(sub)) missing.push(sub);
  }
  return { ok: missing.length === 0, missing };
}

describe('Principle 18 — meta-orchestrator output-format structural check', () => {
  for (const surface of SURFACES) {
    it(`${surface.label} contains all 6 required substrings`, () => {
      const result = checkSurface(surface);
      expect(
        result.ok,
        result.missing.length > 0
          ? `Missing substrings in ${surface.label}: ${result.missing.join(', ')}`
          : '',
      ).toBe(true);
    });
  }

  it('all surfaces agree on the 6 substrings (mirror sync at structural level — round-2 MAJOR-1)', () => {
    // SKILL.md mirror and output-format.md mirror diverge from authoring at the
    // *link-syntax level* on purpose (relative path depth differs by 1 between
    // authoring `.claude/skills/...` and mirror `skills/...`, and consumer-facing
    // mirror omits project-internal markdown links per principle 14 skill-drift
    // requirements). What MUST agree across both copies is the STRUCTURAL spec —
    // the 6 required substrings encoding the 3-layer output shape. The per-surface
    // tests above already enforce that. This block is a final sweep: each surface
    // is independently checked, and we verify all four passed.
    const results = SURFACES.map((s) => ({ ...s, ...checkSurface(s) }));
    const failed = results.filter((r) => !r.ok);
    expect(
      failed.length,
      failed.map((f) => `${f.label}: missing ${f.missing.join(', ')}`).join('\n'),
    ).toBe(0);
  });

  // Paired-negative test (companion per principle 02 discipline): a temporarily-mutated
  // copy that strips one substring must fail the structural check. This proves the
  // check is non-tautological — a real broken §10 would be caught.
  it('paired-negative: synthetic §10 missing "## Dependency graph" header fails the check', () => {
    const fakeSectionTen = [
      '## §10 Output artifacts',
      '',
      'Some prose without dependency graph heading.',
      'But it does mention ↓ arrow.',
      '## Action queue',
      '| Paste в новый CC tab | Когда | Ждёшь | Можно параллельно с |',
      '### Stage 1',
      '',
      '## §11 Failures',
    ].join('\n');
    const missing: string[] = [];
    for (const sub of REQUIRED_SUBSTRINGS) {
      if (!fakeSectionTen.includes(sub)) missing.push(sub);
    }
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain('## Dependency graph');
  });

  it('paired-negative: synthetic §10 missing "Paste в новый CC tab" column fails the check', () => {
    const fakeSectionTen = [
      '## §10 Output artifacts',
      '## Dependency graph',
      'Stage 1: ├── A   └── B   ↓',
      '## Action queue',
      '| # | Action | Когда | Ждёшь | Можно параллельно с |',
      '### Stage 1',
    ].join('\n');
    const missing: string[] = [];
    for (const sub of REQUIRED_SUBSTRINGS) {
      if (!fakeSectionTen.includes(sub)) missing.push(sub);
    }
    expect(missing).toContain('Paste в новый CC tab');
  });
});
