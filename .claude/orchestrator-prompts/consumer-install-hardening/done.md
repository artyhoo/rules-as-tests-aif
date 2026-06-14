# consumer-install-hardening — DONE
- Final PR: #499
- Closed: 2026-06-13
- Summary: S4 verified S1/S2/S3 shields LIVE on real flat-Hono + pnpm-monorepo consumers (real eslint/stryker/lint-staged/hooks), then surfaced 4 regressions invisible from the source repo (T-CIH-A); S5 fixed them across all install surfaces — R-S4-1 phantom `@typescript-eslint/no-useless-catch` (ts-server #498 + react/imports #499), R-S4-2 dep list (eslint@^9, +tsx/typescript-checker/@typescript-eslint/utils, @vitest/eslint-plugin) in install.sh+setup.sh+INSTALL.md, R-S4-3 stryker PM detect-order, R-S4-4 tsconfig layout-agnostic — re-verified live; evidence in research-patches/2026-06-13-cih-s4-consumer-verify.md.
