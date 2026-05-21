/**
 * pre-push.ts — TS-core pre-push orchestrator (Wave 10.1 / 10.2).
 *
 * Invoked by the 10-line `.husky/pre-push` dispatcher via
 * `node --import tsx/esm packages/core/hooks/pre-push.ts`. Replaces the bash
 * body of the former 476-line hook. Every "pure delegation" section (§3.1
 * OWN-BUILD classification) runs through the single tested `runCheck()` helper
 * (utils/run-check.ts), which is the Aider-derived abstraction adopted in
 * research patch §4.8.X.1 — turning previously un-unit-tested `execSync`
 * shell-outs into thin, individually-tested call sites (closes C3 for the
 * delegation sections).
 *
 * Both trailer checks are now TS-native: §7 Prior-art → `checks/prior-art.ts`
 * (Wave 10.2), §1.7 discipline trailer → `checks/s17.ts` (Wave 10.3), both over
 * `utils/git.ts`. The former bash shim (`legacy-trailer-checks.sh`) is deleted;
 * no bash trailer logic remains.
 *
 * Behaviour parity with the former bash hook is byte-faithful for the delegation
 * sections; documented deviations:
 *   - actionlint is invoked with an explicit, fs-resolved `.github/workflows/*.yml`
 *     list (vs shell glob) — equivalent set, and empty-dir is skipped rather than
 *     passing a literal unmatched glob.
 *   - section output is captured and re-emitted after each check rather than
 *     streamed live (acceptable for sub-second checks).
 */
import { existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck, type CheckResult } from './utils/run-check.ts';
import { runPriorArtCheck } from './checks/prior-art.ts';
import { runS17Check } from './checks/s17.ts';
import { getCommits, upstreamExists, realGit } from './utils/git.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
// packages/core/hooks → repo root
const REPO_ROOT = resolve(HERE, '../../..');
const CORE = resolve(REPO_ROOT, 'packages/core');

const run = (cmd: string, args: readonly string[] = []): CheckResult =>
  runCheck(cmd, args, { cwd: REPO_ROOT });

/** Re-emit a captured result's output to the operator. */
function emit(r: CheckResult): void {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
}

/** Print message (+ optional captured output) and abort the push. */
function die(msg: string, r?: CheckResult): never {
  process.stderr.write(`${msg}\n`);
  if (r) emit(r);
  process.exit(1);
}

function workflowYmlFiles(): string[] {
  const dir = resolve(REPO_ROOT, '.github/workflows');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yml'))
    .map((f) => `.github/workflows/${f}`);
}

/** A required external binary check: missing → install hint + fail. */
function requireTool(
  cmd: string,
  args: readonly string[],
  installHint: string,
): void {
  const r = run(cmd, args);
  if (r.notFound) die(`❌ ${cmd} not found in PATH.\n${installHint}`);
  if (r.exitCode !== 0) die(`❌ ${cmd} reported problems:`, r);
  emit(r);
}

/** A bash self-test script that must exist and exit 0. */
function requireSelfTest(scriptRelPath: string): void {
  if (!existsSync(resolve(REPO_ROOT, scriptRelPath))) {
    die(`❌ ${scriptRelPath} missing or not executable`);
  }
  const r = run('bash', [scriptRelPath]);
  if (r.exitCode !== 0) die(`❌ ${scriptRelPath} failed:`, r);
  emit(r);
}

/**
 * §7 Prior-art trailer check. Extracted so it can run in isolation (PREPUSH_ONLY)
 * — the anti-tautology end-to-end test exercises only this section and must not
 * depend on the other sections' tools/deps.
 */
function priorArtSection(): void {
  const UPSTREAM_REF = 'origin/main';
  if (!upstreamExists(UPSTREAM_REF)) return;
  const commits = getCommits(UPSTREAM_REF);
  const substanceWarnOnly = (process.env['PA_SUBSTANCE_WARN_ONLY'] ?? 'true') !== 'false';
  const report = runPriorArtCheck(commits, realGit);

  if (report.failures.length > 0) {
    process.stdout.write('\n❌ Prior-art trailer missing or invalid on capability commit(s):\n');
    for (const f of report.failures) {
      process.stdout.write(`  ${f.sha}  reason: ${f.reason}; ${f.message}\n`);
    }
    process.stdout.write(
      '\nFix: amend the commit body to include a `Prior-art:` line per CONTRIBUTING.md.\n' +
        'Examples:\n' +
        '  Prior-art: prior-art-evaluations.md#1 (Autogrep, verdict DEFER — different domain).\n' +
        '  Prior-art: skipped — refactor only, no new capability\n\n' +
        'Rules: ≥20 chars after "Prior-art:" (or after "skipped — "); placeholder\n' +
        'rationales (TODO / later / n/a / tbd / fixme / placeholder) are rejected.\n\n',
    );
    process.exit(1);
  }

  if (report.substanceFailures.length > 0) {
    if (substanceWarnOnly) {
      process.stdout.write('\n⚠ Prior-art: escape-hatch on capability commit (substance arm, Wave 8.4):\n');
      for (const f of report.substanceFailures) {
        process.stdout.write(`  ${f.sha}  reason: ${f.reason}; ${f.message}\n`);
      }
      process.stdout.write(
        '\nCalibration window: warn-only through 2026-06-10.\n' +
          'Fix: replace `Prior-art: skipped — …` with `Prior-art: prior-art-evaluations.md#N (verdict X — rationale)`.\n\n',
      );
    } else {
      process.stdout.write('\n❌ Prior-art: escape-hatch on capability commit:\n');
      for (const f of report.substanceFailures) {
        process.stdout.write(`  ${f.sha}  reason: ${f.reason}; ${f.message}\n`);
      }
      process.stdout.write(
        '\nSet PA_SUBSTANCE_WARN_ONLY=true to downgrade locally (calibration window expired).\n\n',
      );
      process.exit(1);
    }
  }
}

/**
 * §1.7 discipline-trailer check. TS-native since Wave 10.3 (ported from the
 * deleted legacy-trailer-checks.sh s17_* functions). Both arms default to
 * warn-only (S17_WARN_ONLY / S17_SUBSTANCE_WARN_ONLY) through the 2026-06-10
 * calibration window; set the env flag to 'false' to harden locally.
 */
function s17Section(): void {
  const UPSTREAM_REF = 'origin/main';
  if (!upstreamExists(UPSTREAM_REF)) return;
  const commits = getCommits(UPSTREAM_REF);
  const warnOnly = (process.env['S17_WARN_ONLY'] ?? 'true') !== 'false';
  const substanceWarnOnly = (process.env['S17_SUBSTANCE_WARN_ONLY'] ?? 'true') !== 'false';
  const report = runS17Check(commits, realGit);

  if (report.failures.length > 0) {
    if (warnOnly) {
      process.stdout.write('\n⚠ §1.7 trailer missing or invalid on rule-introducing commit(s):\n');
      for (const f of report.failures) process.stdout.write(`  ${f.sha}  ${f.message}\n`);
      process.stdout.write(
        '\nCalibration window: warn-only through 2026-06-10 (30 days from ship). Set S17_WARN_ONLY=false to enforce locally.\n' +
          'Fix: add `§1.7: forward-check applied — …; backward-check sweep — …` to commit body.\n\n',
      );
    } else {
      process.stdout.write('\n❌ §1.7 trailer missing or invalid on rule-introducing commit(s):\n');
      for (const f of report.failures) process.stdout.write(`  ${f.sha}  ${f.message}\n`);
      process.stdout.write(
        '\nFix: add `§1.7: forward-check applied — …; backward-check sweep — …` to commit body.\n' +
          'Bootstrap exemption: `§1.7 Bootstrap: <reason>` (≥20 chars rationale).\n\n',
      );
      process.exit(1);
    }
  }

  if (report.substanceFailures.length > 0) {
    if (substanceWarnOnly) {
      process.stdout.write('\n⚠ §1.7 trailer lacks file:line citation on rule-introducing commit(s) (substance arm — Wave 8.3):\n');
      for (const f of report.substanceFailures) process.stdout.write(`  ${f.sha}  ${f.message}\n`);
      process.stdout.write(
        '\nCalibration window: warn-only through 2026-06-10. Set S17_SUBSTANCE_WARN_ONLY=false to enforce locally.\n' +
          'Fix: include ≥1 file:line citation, e.g. `packages/core/principles/02.test.ts:82`.\n\n',
      );
    } else {
      process.stdout.write('\n❌ §1.7 trailer lacks file:line citation on rule-introducing commit(s) (substance arm — Wave 8.3):\n');
      for (const f of report.substanceFailures) process.stdout.write(`  ${f.sha}  ${f.message}\n`);
      process.stdout.write(
        '\nFix: include ≥1 file:line citation, e.g. `packages/core/principles/02.test.ts:82`.\n' +
          'Bootstrap exemption: `§1.7 Bootstrap: <reason>` (≥20 chars rationale).\n\n',
      );
      process.exit(1);
    }
  }
}

function main(): void {
  // Test seam: run a single section in isolation. The §7 anti-tautology
  // end-to-end test (tests/hooks/prior-art-trailer-hook.test.sh) sets this so it
  // exercises only the prior-art logic, independent of sections 1–6 deps/env.
  if (process.env['PREPUSH_ONLY'] === 'prior-art') {
    priorArtSection();
    process.exit(0);
  }
  if (process.env['PREPUSH_ONLY'] === 's17') {
    s17Section();
    process.exit(0);
  }

  // ── 1. actionlint ──────────────────────────────────────────────────────────
  const workflows = workflowYmlFiles();
  if (workflows.length > 0) {
    requireTool(
      'actionlint',
      workflows,
      '   Install: brew install actionlint   (macOS)\n' +
        '         or: go install github.com/rhysd/actionlint/cmd/actionlint@latest',
    );
  }

  // ── 2. zizmor ────────────────────────────────────────────────────────────────
  requireTool(
    'zizmor',
    ['--format', 'plain', '.github/workflows/'],
    '   Install: pip install zizmor',
  );

  // ── 3. Self-test pipeline ─────────────────────────────────────────────────────
  // audit-ai-docs.test.ts (Wave 10.4): run via vitest (replaces audit-ai-docs.test.sh)
  {
    const r = run('npx', [
      'vitest', 'run', '--reporter=default',
      'packages/core/audit-self/audit-ai-docs.test.ts',
    ]);
    if (r.notFound) die('❌ npx not found — install Node.js to run audit-ai-docs tests');
    if (r.exitCode !== 0) die('❌ audit-ai-docs.test.ts failed:', r);
    emit(r);
  }

  // ── 3a. Hook stub completeness ────────────────────────────────────────────────
  requireSelfTest('packages/core/audit-self/hook-stub-completeness.test.sh');

  // ── 3b. Skill drift check (D-AuditC-5 channel 2) ──────────────────────────────
  if (existsSync(resolve(REPO_ROOT, 'scripts/check-skill-drift.sh'))) {
    const r = run('bash', ['scripts/check-skill-drift.sh']);
    if (r.exitCode !== 0) die('❌ skill drift check failed', r);
    emit(r);
  }

  // ── 4. Manifest render drift ──────────────────────────────────────────────────
  {
    const r = run('npx', ['tsx', 'packages/core/render/render-rules.ts', '--check']);
    if (r.notFound) {
      die('❌ npx not found. Install Node.js to enable manifest render drift check.');
    }
    if (r.exitCode !== 0) die('❌ manifest render drift detected:', r);
    emit(r);
  }

  // ── 5. Principles meta-tests (Phase 2) ───────────────────────────────────────
  {
    const r = run('npm', ['--prefix', CORE, 'run', 'test:principles']);
    if (r.notFound) {
      die('❌ npm/npx not found. Install Node.js to enable principles meta-tests.');
    }
    if (r.exitCode !== 0) die('❌ principles meta-tests failed — fix before push', r);
    emit(r);
  }

  // ── 6. Spec discipline (Phase 1.C) — dormant defensive guard ─────────────────
  // .claude/orchestrator-prompts/ is gitignored; this fires only if such a file
  // is force-added past gitignore. Faithful port of the former bash guard.
  {
    const diff = run('git', [
      'diff',
      'origin/main...HEAD',
      '--name-only',
      '--diff-filter=ACM',
    ]);
    const specFiles = diff.stdout
      .split('\n')
      .filter((f) => /^\.claude\/orchestrator-prompts\/.*\.md$/.test(f));
    if (specFiles.length > 0) {
      process.stdout.write('Validating force-added orchestrator-prompts in this push...\n');
      const r = run('npx', [
        'tsx',
        'packages/core/spec-validation/validate-batch-spec.ts',
        ...specFiles,
      ]);
      if (r.exitCode !== 0) die('❌ spec-validate findings — fix before push', r);
      emit(r);
    }
  }

  // ── 7. Prior-art trailer (§7) — TS-native since Wave 10.2 ────────────────────
  // Capability-commit detection + `Prior-art:` trailer validation. Ported from
  // pa_* functions in the former legacy-trailer-checks.sh (now §1.7-only).
  priorArtSection();

  // ── §1.7. Discipline trailer — TS-native since Wave 10.3 ─────────────────────
  // Ported from s17_* in the (now deleted) legacy-trailer-checks.sh. Both arms
  // default to warn-only through the 2026-06-10 calibration window.
  s17Section();

  // ── 8. lychee offline link check on changed *.md ─────────────────────────────
  {
    const diff = run('git', [
      'diff',
      '--name-only',
      'origin/main..HEAD',
      '--diff-filter=ACMR',
    ]);
    const changedMd = diff.stdout.split('\n').filter((f) => f.endsWith('.md'));
    if (changedMd.length > 0) {
      const r = run('lychee', ['--offline', '--no-progress', ...changedMd]);
      if (r.notFound) {
        process.stdout.write('⚠ lychee not found in PATH — offline link check skipped.\n');
        process.stdout.write('  Install: cargo install lychee   OR   brew install lychee\n');
      } else {
        emit(r);
        if (r.exitCode !== 0) {
          die('❌ lychee found broken links in changed Markdown files — fix before push', r);
        }
      }
    }
  }

  process.exit(0);
}

try {
  main();
} catch (err) {
  process.stderr.write(`❌ pre-push hook crashed: ${(err as Error).message}\n`);
  process.exit(1);
}
