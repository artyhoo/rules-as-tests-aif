/**
 * registry.ts — declarative check-registry for the pre-push hook (Wave 10.5).
 *
 * ADAPT from Aider's `parse_lint_cmds` / `self.languages` pattern
 * (research patch §4.8.X.2, SSOT #59): decouple check-set *selection* from
 * check *execution*. The registry is a pure data table — no control flow here.
 *
 * Consumers of this table:
 *   - `pre-push.fallback.sh` (Wave 10.5) — bash iterates `criticalForFallback: true`
 *     entries to know which checks to run without Node.
 *   - `registry.test.ts` — asserts «every criticalForFallback check is bash-expressible»
 *     per the §4.8.X.2 unit-test mandate.
 *   - Future: `pre-push.ts` dispatch may consume this table (deferred to post-10.5;
 *     pre-push.ts currently uses direct function calls — see kickoff §DO NOT touch).
 *
 * T16 problem-class note: Aider's axis is «file-language → linter command»;
 * our axis is «consumer-stack capability → check-set». The *structure* (declarative
 * selection table + generic runner) transfers; the semantic axis differs.
 * This is ADAPT, not ADOPT verbatim.
 */
// @ts-nocheck


export interface CheckEntry {
  /** Unique slug — stable identifier used by tests and the fallback script. */
  id: string;
  /**
   * true = included in the bash critical-only fallback (must be expressible in
   * ≤20 lines of bash with no Node dependency).
   */
  criticalForFallback: boolean;
  /**
   * 'bash' = expressible in bash (no Node required).
   * 'ts'   = requires the Node/TS runtime.
   */
  runner: 'ts' | 'bash';
  /** Human-readable description (for tooling / error messages). */
  description: string;
}

/**
 * The authoritative check registry.
 *
 * Critical checks (criticalForFallback: true) — per D2 + research patch §7.2:
 *   - prior-art-presence: §7 Prior-art trailer PRESENCE (grep only, no substance arm).
 *   - s17-presence:       §1.7 trailer PRESENCE (grep only, no file:line arm).
 *
 * Both are bash-expressible (simple grep); neither requires the TS substance arms.
 * Everything else requires Node/TS.
 */
export const CHECK_REGISTRY: readonly CheckEntry[] = [
  {
    id: 'prior-art-presence',
    criticalForFallback: true,
    runner: 'bash',
    description:
      '§7 Prior-art trailer PRESENCE check — grep for "Prior-art:" in commit body (no substance arm).',
  },
  {
    id: 's17-presence',
    criticalForFallback: true,
    runner: 'bash',
    description:
      '§1.7 discipline trailer PRESENCE check — grep for "§1.7:" (or "§1.7 Bootstrap:") in commit body (no file:line arm).',
  },
  {
    id: 'prior-art-substance',
    criticalForFallback: false,
    runner: 'ts',
    description:
      '§7 Prior-art trailer SUBSTANCE — SSOT citation validation, escape-hatch rationale, placeholder rejection.',
  },
  {
    id: 's17-substance',
    criticalForFallback: false,
    runner: 'ts',
    description:
      '§1.7 discipline trailer SUBSTANCE — file:line citation, body-prose detection, bootstrap exemption, historical cutoff.',
  },
  {
    id: 'actionlint',
    criticalForFallback: false,
    runner: 'ts',
    description: '§1 GitHub Actions workflow lint (actionlint).',
  },
  {
    id: 'zizmor',
    criticalForFallback: false,
    runner: 'ts',
    description: '§2 GitHub Actions security scan (zizmor).',
  },
  {
    id: 'principles',
    criticalForFallback: false,
    runner: 'ts',
    description: '§5 Principle tests (npm run test:principles).',
  },
  {
    id: 'manifest-render',
    criticalForFallback: false,
    runner: 'ts',
    description: '§4 Manifest render drift (npx tsx render/render-rules.ts --check).',
  },
  {
    id: 'lychee',
    criticalForFallback: false,
    runner: 'ts',
    description: '§8 Dead-link check on changed Markdown files (lychee).',
  },
  {
    id: 'skill-drift',
    criticalForFallback: false,
    runner: 'ts',
    description: '§6 Skill-drift detection (changed SKILL.md files vs installed consumers).',
  },
] as const;
