import { defineConfig } from 'vitest/config';

// Root-level config: applies when vitest is invoked from repo root (e.g. pre-push
// hook `npx vitest run packages/core/audit-self/audit-ai-docs.test.ts`). Vitest
// auto-discovers nearest config walking up from CWD; without this root config,
// the workspace-aware `packages/core/vitest.config.ts` is skipped and `**/...`
// CLI patterns scan into `.claude/worktrees/agent-*` (harness-auto-created
// sub-agent worktrees without node_modules) — their tests `execSync('npx ...')`
// timeout at 5s and block every push. Excludes preserve test discovery defaults
// (node_modules, dist) and add the worktrees scope.
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.claude/worktrees/**',
    ],
    // 5s default times out audit-ai-docs probeR4 tests on slow-npx machines
    // (execSync('npx tsx ...') bootstraps tsx + tries to resolve ts-morph from
    // npm registry before the WARN/FAIL branch fires). 30s still hangs on this
    // machine; 60s covers cold npm cache + slow connection while bounding
    // deadlock-class hangs. Same root cause class as the principle 11
    // testTimeout bump from PR #183 / 33278a4.
    testTimeout: 60_000,
  },
});
