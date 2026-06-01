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
// @ts-nocheck

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck, type CheckResult } from './utils/run-check.ts';
import { runPriorArtCheck, loadSsotIds } from './checks/prior-art.ts';
import { runS17Check } from './checks/s17.ts';
import {
  getCommits,
  getChangedFiles,
  upstreamExists,
  realGit,
  parsePushRefs,
  commitsNotOnRemotes,
  Z40,
} from './utils/git.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
// packages/core/hooks → repo root
const REPO_ROOT = resolve(HERE, '../../..');
const CORE = resolve(REPO_ROOT, 'packages/core');

const run = (cmd: string, args: readonly string[] = []): CheckResult =>
  runCheck(cmd, args, { cwd: REPO_ROOT });

/**
 * The empty-tree object SHA — a tree-ish that exists in every repo. Used as the
 * diff base for a root push (a brand-new branch whose oldest new commit has no
 * parent) so `git diff <EMPTY_TREE>..HEAD` enumerates every file.
 */
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

/** Read git's pre-push stdin (the ref lines), or '' when none is piped. */
function readPushStdin(): string {
  // Only read when fd 0 is NOT a tty — git pipes the ref lines on a push and
  // closes the pipe (EOF), but an interactive `node pre-push.ts` would block on
  // a tty read. Defensive: any read error degrades to "no stdin".
  if (process.stdin.isTTY) return '';
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/**
 * The base the trailer checks diff against, resolved without guessing a trunk
 * name. Replaces the former hard-coded `origin/staging` default (which silently
 * no-op'd on any consumer repo lacking a `staging` branch — see the
 * hook-base-ref-detection research patch). Precedence:
 *
 *   1. `PREPUSH_UPSTREAM_REF` env — the CI backstop's full-PR base
 *      (`origin/${github.base_ref}`); also a manual local override.
 *   2. git pre-push **stdin** `remote_sha` — the canonical, trunk-agnostic
 *      signal (what HEAD is actually being pushed against). For a new branch
 *      (`remote_sha` == {@link Z40}) the checked set is "commits not on any
 *      remote" (ADAPT of pre-commit's stdin handling).
 *   3. legacy `origin/staging`, *only if it exists*, with a visible warning.
 *
 * Returns `{ base: null, commits: null }` when nothing resolves — callers emit a
 * VISIBLE warning and skip, never a silent pass (research-patch finding F2).
 */
interface ResolvedBase {
  /** Tree-ish for `<base>..HEAD` changed-file diffs; null when unresolvable. */
  base: string | null;
  /** Explicit commit list (new-branch Z40 case); null = derive from `base..HEAD`. */
  commits: string[] | null;
  source: 'env' | 'stdin' | 'stdin-new-branch' | 'default' | 'unresolved';
}

function resolveBase(): ResolvedBase {
  const env = process.env['PREPUSH_UPSTREAM_REF'];
  if (env) return { base: env, commits: null, source: 'env' };

  const refs = parsePushRefs(readPushStdin());
  if (refs.length > 0) {
    const r = refs[0];
    // `^{commit}` peels to a commit object — parity with the fallback's check,
    // and rejects a tag sha (which would not be a valid `..HEAD` diff base).
    if (r.remoteSha !== Z40 && upstreamExists(`${r.remoteSha}^{commit}`)) {
      return { base: r.remoteSha, commits: null, source: 'stdin' };
    }
    // New branch (Z40) or an unknown remote sha → the commits this push adds.
    const newCommits = commitsNotOnRemotes(r.localSha);
    const oldest = newCommits[newCommits.length - 1];
    const base = oldest && upstreamExists(`${oldest}^`) ? `${oldest}^` : EMPTY_TREE;
    return { base, commits: newCommits, source: 'stdin-new-branch' };
  }

  // No env, no stdin (a manual `node pre-push.ts` run): keep the legacy default
  // only when it actually exists, and announce it — never silently skip.
  if (upstreamExists('origin/staging')) {
    return { base: 'origin/staging', commits: null, source: 'default' };
  }
  return { base: null, commits: null, source: 'unresolved' };
}

/** Emit a visible (non-silent) warning that a section is being skipped. */
function warnSkip(label: string, why: string): void {
  process.stdout.write(
    `⚠ pre-push ${label}: could not determine a base ref (${why}) — skipping this check.\n` +
      '  Not a silent pass: set PREPUSH_UPSTREAM_REF, or push so git supplies the base on stdin.\n',
  );
}

/**
 * The commits a section must check, or null (already warned) when the base is
 * unresolvable / missing. New-branch pushes carry an explicit commit list; every
 * other case derives `<base>..HEAD`.
 */
function commitsToCheck(rb: ResolvedBase, label: string): string[] | null {
  if (rb.commits !== null) return rb.commits;
  if (rb.base === null) {
    warnSkip(label, 'no PREPUSH_UPSTREAM_REF, no git stdin, no origin/staging');
    return null;
  }
  if (!upstreamExists(rb.base)) {
    warnSkip(label, `base ref '${rb.base}' not found`);
    return null;
  }
  return getCommits(rb.base);
}

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


/**
 * §7 Prior-art trailer check. Extracted so it can run in isolation (PREPUSH_ONLY)
 * — the anti-tautology end-to-end test exercises only this section and must not
 * depend on the other sections' tools/deps.
 */
/**
 * The SSOT register's entry id-set, for the C1 broken-citation arm. Unreadable
 * register → undefined → existence check is a graceful no-op (never blocks a
 * push because the file moved).
 */
function ssotIds(): ReadonlySet<number> | undefined {
  try {
    return loadSsotIds(readFileSync(resolve(REPO_ROOT, 'docs/meta-factory/prior-art-evaluations.md'), 'utf8'));
  } catch {
    return undefined;
  }
}

function priorArtSection(rb: ResolvedBase): void {
  const commits = commitsToCheck(rb, '§7');
  if (commits === null) return;
  const substanceWarnOnly = (process.env['PA_SUBSTANCE_WARN_ONLY'] ?? 'true') !== 'false';
  const report = runPriorArtCheck(commits, realGit, undefined, ssotIds());

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

  if (report.brokenCitations.length > 0) {
    process.stdout.write('\n❌ Prior-art trailer cites a non-existent SSOT entry (C1 existence check):\n');
    for (const f of report.brokenCitations) {
      process.stdout.write(`  ${f.sha}  reason: ${f.reason}; ${f.message}\n`);
    }
    process.stdout.write(
      '\nFix: cite an entry that exists in docs/meta-factory/prior-art-evaluations.md,\n' +
        'or add the entry to the SSOT in the same commit (per CLAUDE.md build-vs-reuse).\n' +
        'Verify: grep -nE "^\\| *<N> *\\|" docs/meta-factory/prior-art-evaluations.md\n\n',
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
 * deleted legacy-trailer-checks.sh s17_* functions). Both arms enforce
 * (blocking) by default since 2026-05-21 (flipped early per maintainer
 * directive; was warn-only during the D1 calibration window). Set
 * S17_WARN_ONLY=true / S17_SUBSTANCE_WARN_ONLY=true for a local opt-in downgrade.
 */
function s17Section(rb: ResolvedBase): void {
  const commits = commitsToCheck(rb, '§1.7');
  if (commits === null) return;
  const warnOnly = (process.env['S17_WARN_ONLY'] ?? 'false') !== 'false';
  const substanceWarnOnly = (process.env['S17_SUBSTANCE_WARN_ONLY'] ?? 'false') !== 'false';
  const report = runS17Check(commits, realGit);

  if (report.failures.length > 0) {
    if (warnOnly) {
      process.stdout.write('\n⚠ §1.7 trailer missing or invalid on rule-introducing commit(s):\n');
      for (const f of report.failures) process.stdout.write(`  ${f.sha}  ${f.message}\n`);
      process.stdout.write(
        '\nLocal downgrade active (S17_WARN_ONLY=true); the default is enforcing.\n' +
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
        '\nLocal downgrade active (S17_SUBSTANCE_WARN_ONLY=true); the default is enforcing.\n' +
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
  // Resolve the diff base ONCE, up front — this consumes git's pre-push stdin
  // (which must be read before any other use). All base-scoped sections (6, 7,
  // §1.7, 8) thread the same ResolvedBase.
  const rb = resolveBase();

  // Test seam: run a single section in isolation. The §7 anti-tautology
  // end-to-end test (tests/hooks/prior-art-trailer-hook.test.sh) sets this so it
  // exercises only the prior-art logic, independent of sections 1–6 deps/env.
  if (process.env['PREPUSH_ONLY'] === 'prior-art') {
    priorArtSection(rb);
    process.exit(0);
  }
  if (process.env['PREPUSH_ONLY'] === 's17') {
    s17Section(rb);
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

  // ── 3a. Hook stub completeness — ported to principle 16 (Wave 10.6 TS migration) ──

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
  // is force-added past gitignore. Now routed through the resolved base (F1):
  // was a stranded hard-coded `origin/main...HEAD` (3-dot) that bypassed the
  // resolver and diverged from git.ts's 2-dot range — reconciled to 2-dot here.
  if (rb.base !== null) {
    const specFiles = getChangedFiles(rb.base, 'ACM')
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
  } else {
    warnSkip('§6', 'no resolvable base for the spec-discipline diff');
  }

  // ── 7. Prior-art trailer (§7) — TS-native since Wave 10.2 ────────────────────
  // Capability-commit detection + `Prior-art:` trailer validation. Ported from
  // pa_* functions in the former legacy-trailer-checks.sh (now §1.7-only).
  priorArtSection(rb);

  // ── §1.7. Discipline trailer — TS-native since Wave 10.3 ─────────────────────
  // Ported from s17_* in the (now deleted) legacy-trailer-checks.sh. Both arms
  // enforce (blocking) by default since 2026-05-21; S17_WARN_ONLY=true downgrades.
  s17Section(rb);

  // ── 8. lychee offline link check on changed *.md ─────────────────────────────
  if (rb.base !== null) {
    const changedMd = getChangedFiles(rb.base).filter((f) => f.endsWith('.md'));
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
  } else {
    warnSkip('§8', 'no resolvable base for the changed-Markdown link check');
  }

  process.exit(0);
}

try {
  main();
} catch (err) {
  process.stderr.write(`❌ pre-push hook crashed: ${(err as Error).message}\n`);
  process.exit(1);
}
