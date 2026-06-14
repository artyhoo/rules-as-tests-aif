/**
 * Dependency-cruiser configuration.
 * Enforces architectural rules at the module-graph level.
 *
 * Run: `npx depcruise --config .dependency-cruiser.cjs <source-root(s)>`
 *   flat / layered -> `src`; pnpm monorepo -> `apps packages` (the installed `arch:check`
 *   script auto-targets the roots that exist; a hardcoded `src` hard-fails on a monorepo).
 *
 * Layer-path prefixes use `(?:^|/)src/<layer>` (a slash-or-start anchor, not a bare
 * start-anchor) so the hexagonal / feature-slice rules match BOTH a root `src` dir AND
 * nested package source dirs (apps and packages workspaces), not only the root-src layout.
 *
 * Test naming: .unit.ts, .integration.ts, .audit.ts (co-located with source).
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make code untestable and ship-blocking.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan modules (no consumers) are dead code candidates.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)(babel|webpack|vite|stryker|vitest|next|playwright|tailwind)\\.config\\.(js|cjs|mjs|ts)$',
          '(^|/)src/(index|main)\\.ts$',
          '(^|/)app/(layout|page|loading|error|not-found|template|default)\\.tsx$',
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      severity: 'error',
      comment: 'Deprecated Node core modules.',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: ['^(punycode|domain|constants|sys|querystring|_linklist|_stream_wrap)$'],
      },
    },
    {
      name: 'not-to-deprecated',
      severity: 'error',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment: 'Importing a package not listed in package.json.',
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },
    {
      name: 'not-to-test-from-production',
      severity: 'error',
      comment: 'Production code must not import test files.',
      from: {
        path: '(?:^|/)src',
        pathNot: '\\.(unit|integration|audit|e2e|spec|test)\\.[tj]sx?$',
      },
      to: { path: '\\.(unit|integration|audit|e2e|spec|test)\\.[tj]sx?$' },
    },
    {
      name: 'not-to-spec',
      severity: 'error',
      comment: 'Test files must not import other test files (except shared fixtures).',
      from: { path: '\\.(unit|integration|audit)\\.[tj]sx?$' },
      to: {
        path: '\\.(unit|integration|audit)\\.[tj]sx?$',
        pathNot: '/fixtures/|/shared/test-utils/',
      },
    },
    {
      name: 'no-dev-deps-in-prod',
      severity: 'error',
      comment: 'Production code must not import devDependencies.',
      from: {
        path: '(?:^|/)src',
        pathNot: '\\.(unit|integration|audit|e2e|spec|test|stories)\\.[tj]sx?$|(?:^|/)src/__fixtures__/',
      },
      to: { dependencyTypes: ['npm-dev'] },
    },

    // ─── Layered architecture (hexagonal / clean) ────────
    {
      name: 'domain-no-infra',
      severity: 'error',
      comment: 'Domain must remain framework-agnostic.',
      from: { path: '(?:^|/)src/domain' },
      to: { path: '(?:^|/)src/(infrastructure|web|application)' },
    },
    {
      name: 'domain-no-application',
      severity: 'error',
      from: { path: '(?:^|/)src/domain' },
      to: { path: '(?:^|/)src/application' },
    },
    {
      name: 'application-no-direct-infra',
      severity: 'error',
      comment: 'Application talks to infrastructure only through ports.',
      from: { path: '(?:^|/)src/application' },
      to: {
        path: '(?:^|/)src/infrastructure',
        pathNot: '(?:^|/)src/infrastructure/ports',
      },
    },
    {
      name: 'application-no-web',
      severity: 'error',
      from: { path: '(?:^|/)src/application' },
      to: { path: '(?:^|/)src/web' },
    },

    // ─── Feature-Sliced Design boundaries ────────────────
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      comment: 'Features communicate only through their public index.ts.',
      from: { path: '(?:^|/)src/features/([^/]+)/(?!index\\.ts)' },
      to: {
        path: '(?:^|/)src/features/([^/]+)/(?!index\\.ts)',
        pathNot: '(?:^|/)src/features/$1/',
      },
    },

    // ─── Forbidden top-level libs ────────────────────────
    {
      name: 'no-lodash-moment-axios',
      severity: 'error',
      comment: 'Use native fetch / date-fns / Zod instead.',
      from: { path: '(?:^|/)src' },
      to: { path: '^(lodash|moment|axios|request|node-fetch)($|/)' },
    },

    // ─── No CSS-in-JS (RSC incompatible) ─────────────────
    {
      name: 'no-css-in-js',
      severity: 'error',
      comment: 'CSS-in-JS breaks React Server Components. Use Tailwind/CSS Modules.',
      from: { path: '(?:^|/)src' },
      to: { path: '^(styled-components|@emotion)($|/)' },
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: { theme: { graph: { rankdir: 'TD' } } },
    },
  },
};
