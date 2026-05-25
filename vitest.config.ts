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
    // npm registry before the WARN/FAIL branch fires). Local best-case ~24s
    // but real network variance under TLS jitter goes higher; 36s tested
    // insufficient under real push load. 60s covers worst-case while bounding
    // deadlock-class hangs. Longer-term fix: skip-if-no-ts-morph or move
    // probeR4 sandbox tests to a slow suite — see
    // .claude/orchestrator-prompts/slow-test-triage/. Same root cause class as
    // the principle 11 testTimeout bump from PR #183.
    testTimeout: 60_000,
  },
});
