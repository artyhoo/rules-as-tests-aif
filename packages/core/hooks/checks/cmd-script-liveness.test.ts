/**
 * cmd-script-liveness.test.ts — coverage for the v1.5 cmd/script liveness runner.
 *
 * Paired-negative contract per mode (principle 02 Stage 3C requires content-level
 * assertions — exit code / status — for files under hooks/): each mode has a ❌
 * "guard does not catch its violation" case and a ✅ "guard catches it" case.
 * The subprocess boundary is mocked (Aider precedent); fs-dependent modes use a
 * real temp repoRoot.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CheckResult } from '../utils/run-check.ts';
import {
  resolveMode,
  isExempt,
  extractRunnable,
  splitCompound,
  parseWorkflowRefs,
  runRuleLiveness,
  runCmdScriptLivenessCheck,
  getChangedCmdScriptRuleIds,
  EXEMPT_RULES,
  type CmdScriptRule,
} from './cmd-script-liveness.ts';

const ok: CheckResult = { exitCode: 0, stdout: '', stderr: '', timedOut: false, notFound: false };
const nonzero: CheckResult = { exitCode: 1, stdout: '', stderr: 'violation', timedOut: false, notFound: false };
const missing: CheckResult = { exitCode: 127, stdout: '', stderr: 'ENOENT', timedOut: false, notFound: true };

type PhaseRoute = { clean: CheckResult; violating: CheckResult };

/**
 * Build a runCheck mock that routes on the command binary AND the clean-vs-violating
 * phase (the runner runs the CLEAN pre-fixture state in a `*-clean-*` temp dir, then
 * the violating state in a `*-violating-*` temp dir — operator rework 2026-06-13).
 * A route may be a single CheckResult (same result in both phases — used for `sh`
 * setup/cleanup and for not-found binaries) or a { clean, violating } pair.
 */
function pairedRun(
  routes: Record<string, CheckResult | PhaseRoute>,
): (cmd: string, args?: readonly string[], opts?: { cwd?: string }) => CheckResult {
  return (cmd: string, _args?: readonly string[], opts?: { cwd?: string }) => {
    const route = routes[cmd];
    if (route === undefined) return ok;
    if ('clean' in route && 'violating' in route) {
      const phase = (opts?.cwd ?? '').includes('-clean-') ? 'clean' : 'violating';
      return route[phase];
    }
    return route as CheckResult;
  };
}

describe('resolveMode (Option D — derive + override)', () => {
  it('derives run-and-assert from check.type=command', () => {
    expect(resolveMode({ check: { type: 'command', command: 'x' } })).toBe('run-and-assert');
  });
  it('derives resolve-and-run from check.type=script', () => {
    expect(resolveMode({ check: { type: 'script', script: 'x' } })).toBe('resolve-and-run');
  });
  it('override liveness-mode wins over the derived default', () => {
    expect(resolveMode({ check: { type: 'command', command: 'x' }, 'liveness-mode': 'workflow-exists' })).toBe('workflow-exists');
    expect(resolveMode({ check: { type: 'command', command: 'x' }, 'liveness-mode': 'config-presence' })).toBe('config-presence');
    expect(resolveMode({ check: { type: 'command', command: 'x' }, 'liveness-mode': 'exempt' })).toBe('exempt');
    expect(resolveMode({ check: { type: 'script', script: 'x' }, 'liveness-mode': 'run' })).toBe('run-and-assert');
  });
  it('returns null for non-cmd/script rules', () => {
    expect(resolveMode({ check: { type: 'eslint' } })).toBeNull();
  });
});

describe('isExempt', () => {
  it('is true only for liveness-mode=exempt', () => {
    expect(isExempt({ check: { type: 'command' }, 'liveness-mode': 'exempt' })).toBe(true);
    expect(isExempt({ check: { type: 'command' } })).toBe(false);
  });
  it('EXEMPT_RULES carries IR3 + IR4 with per-rule rationale', () => {
    expect(Object.keys(EXEMPT_RULES).sort()).toEqual(['IR3', 'IR4']);
    expect(EXEMPT_RULES.IR3.length).toBeGreaterThan(20);
    expect(EXEMPT_RULES.IR4.length).toBeGreaterThan(20);
  });
});

describe('parsing helpers', () => {
  it('extractRunnable strips a trailing parenthetical', () => {
    expect(extractRunnable('depcruise --validate (blocks @emotion)')).toBe('depcruise --validate');
    expect(extractRunnable('npm run arch:check')).toBe('npm run arch:check');
  });
  it('splitCompound splits on &&', () => {
    expect(splitCompound('tsc --noEmit && eslint <files>')).toEqual(['tsc --noEmit', 'eslint <files>']);
  });
  it('parseWorkflowRefs extracts filenames + job tokens', () => {
    const refs = parseWorkflowRefs('audit-self.yml (actionlint + zizmor → ci-success aggregate) + workflow-integrity.yml (branch-protection-assertion)');
    expect(refs.map((r) => r.file)).toEqual(['audit-self.yml', 'workflow-integrity.yml']);
    expect(refs[0].tokens).toContain('actionlint');
    expect(refs[1].tokens).toContain('protection');
  });
  it('parseWorkflowRefs returns [] when no workflow filename is present (IR1/IR2 prose)', () => {
    expect(parseWorkflowRefs('CI job: zod-to-openapi diff against published OpenAPI')).toEqual([]);
  });
});

describe('run-and-assert mode (clean-pass + violating-fail pair)', () => {
  const rule: CmdScriptRule = {
    check: { type: 'command', command: 'depcruise --validate (blocks styled-components)' },
    fixture: { 'setup-script': "printf 'import styled' > x.tsx" },
  };
  it('✅ passes when the check is clean on the pre-fixture state and trips on the violating fixture', () => {
    const r = runRuleLiveness('R19', rule, {
      runCheckFn: pairedRun({ depcruise: { clean: ok, violating: nonzero } }),
    });
    expect(r.status).toBe('pass');
    expect(r.mode).toBe('run-and-assert');
  });
  it('❌ fails when the check passes even on the violating fixture (guard does NOT catch its violation)', () => {
    const r = runRuleLiveness('R19', rule, {
      runCheckFn: pairedRun({ depcruise: { clean: ok, violating: ok } }),
    });
    expect(r.status).toBe('fail');
    expect(r.failures?.[0]).toMatch(/did NOT exit non-zero on the violating fixture/);
  });
  it('SKIPs (crash-masquerade guard) when the check is non-functional on the clean state — exits non-zero regardless', () => {
    const r = runRuleLiveness('R19', rule, {
      runCheckFn: pairedRun({ depcruise: { clean: nonzero, violating: nonzero } }),
    });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/check non-functional in env \(clean state did not pass\)/);
  });
  it('SKIPs (not fails) when the check binary is unavailable', () => {
    const r = runRuleLiveness('R19', rule, { runCheckFn: pairedRun({ depcruise: missing }) });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/no check binary available/);
  });
  it('fails when the fixture setup itself errors (after a clean-passing check)', () => {
    const r = runRuleLiveness('R19', rule, {
      runCheckFn: pairedRun({ depcruise: { clean: ok, violating: ok }, sh: nonzero }),
    });
    expect(r.status).toBe('fail');
    expect(r.failures?.[0]).toMatch(/setup-script exited/);
  });
  it('split-compound: excludes a sub-command non-functional on clean, passes when a functional sub catches the violation (R1)', () => {
    const r1: CmdScriptRule = {
      check: { type: 'command', command: 'tsc --noEmit && eslint <files>' },
      fixture: { 'setup-script': "printf 'as any' > x.ts" },
    };
    // tsc is clean-functional but does not catch (`as any` is valid TS); eslint catches.
    const r = runRuleLiveness('R1', r1, {
      runCheckFn: pairedRun({
        tsc: { clean: ok, violating: ok },
        eslint: { clean: ok, violating: nonzero },
      }),
    });
    expect(r.status).toBe('pass');
  });
  it('split-compound: SKIPs when every sub-command is non-functional on the clean state (R1, bare temp dir)', () => {
    const r1: CmdScriptRule = {
      check: { type: 'command', command: 'tsc --noEmit && eslint <files>' },
      fixture: { 'setup-script': "printf 'as any' > x.ts" },
    };
    // Neither tool is configured in a bare temp dir → both exit non-zero on clean → SKIP, never a false-pass.
    const r = runRuleLiveness('R1', r1, {
      runCheckFn: pairedRun({
        tsc: { clean: nonzero, violating: nonzero },
        eslint: { clean: nonzero, violating: nonzero },
      }),
    });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/check non-functional in env \(clean state did not pass\)/);
  });
});

describe('resolve-and-run mode (clean-pass + violating-fail pair)', () => {
  let repoRoot: string;
  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'csl-repo-'));
  });
  afterEach(() => rmSync(repoRoot, { recursive: true, force: true }));

  const rule: CmdScriptRule = {
    check: { type: 'script', script: 'scripts/audit-r4.ts' },
    fixture: { 'setup-script': "printf 'export const x=1' > x.ts" },
  };
  function plantScript() {
    mkdirSync(join(repoRoot, 'packages', 'core', 'probes'), { recursive: true });
    writeFileSync(join(repoRoot, 'packages', 'core', 'probes', 'audit-r4.ts'), '// probe');
  }

  it('✅ resolves the dangling script, passes clean on the pre-fixture state and trips on the violating fixture', () => {
    plantScript();
    const r = runRuleLiveness('R4', rule, {
      repoRoot,
      runCheckFn: pairedRun({ node: { clean: ok, violating: nonzero } }),
    });
    expect(r.status).toBe('pass');
    expect(r.mode).toBe('resolve-and-run');
  });
  it('❌ fails when the resolved script exits 0 on the violating fixture', () => {
    plantScript();
    const r = runRuleLiveness('R4', rule, {
      repoRoot,
      runCheckFn: pairedRun({ node: { clean: ok, violating: ok } }),
    });
    expect(r.status).toBe('fail');
  });
  it('SKIPs (crash-masquerade guard) when the resolved script crashes on the clean state — e.g. MODULE_NOT_FOUND (ts-morph absent)', () => {
    plantScript();
    const r = runRuleLiveness('R4', rule, {
      repoRoot,
      runCheckFn: pairedRun({ node: { clean: nonzero, violating: nonzero } }),
    });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/check non-functional in env \(clean state did not pass\)/);
  });
  it('SKIPs when the interpreter is unavailable', () => {
    plantScript();
    const r = runRuleLiveness('R4', rule, { repoRoot, runCheckFn: pairedRun({ node: missing }) });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/interpreter 'node' not available/);
  });
  it('SKIPs when the script is not found under packages/ (dangling/consumer-relative)', () => {
    mkdirSync(join(repoRoot, 'packages'), { recursive: true });
    const r = runRuleLiveness('R4', rule, { repoRoot, runCheckFn: pairedRun({}) });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/not found under packages/);
  });
  it('SKIPs (auto-skip-if-missing) a consumer rule whose required package is absent (R17)', () => {
    const r17: CmdScriptRule = {
      check: { type: 'script', script: 'scripts/audit-ai-docs.react-next.sh' },
      fixture: { 'setup-script': "printf x > Button.tsx" },
      'requires-package': 'storybook',
      'auto-skip-if-missing': true,
    };
    const r = runRuleLiveness('R17', r17, { repoRoot, runCheckFn: pairedRun({}) });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/auto-skip-if-missing/);
  });
});

describe('workflow-exists mode', () => {
  let repoRoot: string;
  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'csl-repo-'));
  });
  afterEach(() => rmSync(repoRoot, { recursive: true, force: true }));

  const r11: CmdScriptRule = {
    check: { type: 'command', command: 'audit-self.yml (ci-success aggregate)' },
    fixture: { 'setup-script': 'printf "name: ci" > .github/workflows/ci.yml' },
    'liveness-mode': 'workflow-exists',
  };

  it('✅ passes when the named workflow exists and references its jobs', () => {
    mkdirSync(join(repoRoot, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(repoRoot, '.github', 'workflows', 'audit-self.yml'), 'jobs:\n  ci-success:\n    runs-on: x\n');
    const r = runRuleLiveness('R11', r11, { repoRoot });
    expect(r.status).toBe('pass');
    expect(r.mode).toBe('workflow-exists');
  });
  it('❌ fails when the named workflow is missing', () => {
    mkdirSync(join(repoRoot, '.github', 'workflows'), { recursive: true });
    const r = runRuleLiveness('R11', r11, { repoRoot });
    expect(r.status).toBe('fail');
    expect(r.failures?.[0]).toMatch(/missing/);
  });
  it('❌ fails when the workflow exists but references none of the required jobs', () => {
    mkdirSync(join(repoRoot, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(repoRoot, '.github', 'workflows', 'audit-self.yml'), 'jobs:\n  unrelated:\n    runs-on: x\n');
    const r = runRuleLiveness('R11', r11, { repoRoot });
    expect(r.status).toBe('fail');
    expect(r.failures?.[0]).toMatch(/required jobs/);
  });
  it('SKIPs a consumer-side CI rule with no concrete workflow filename (IR1/IR2)', () => {
    const ir1: CmdScriptRule = {
      check: { type: 'command', command: 'CI job: zod-to-openapi diff against published OpenAPI' },
      fixture: { 'setup-script': 'printf x > src/web/h.ts' },
      'liveness-mode': 'workflow-exists',
    };
    const r = runRuleLiveness('IR1', ir1, { repoRoot });
    expect(r.status).toBe('skipped');
    expect(r.reason).toMatch(/consumer-side CI rule/);
  });
});

describe('config-presence mode', () => {
  let repoRoot: string;
  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'csl-repo-'));
  });
  afterEach(() => rmSync(repoRoot, { recursive: true, force: true }));

  const r3: CmdScriptRule = {
    check: { type: 'command', command: 'npm run arch:check' },
    fixture: { 'setup-script': "printf 'import infra' > src/domain/x.ts" },
    'liveness-mode': 'config-presence',
  };

  it('✅ passes when an architectural dependency-cruiser config exists', () => {
    mkdirSync(join(repoRoot, 'templates'), { recursive: true });
    writeFileSync(join(repoRoot, 'templates', 'dependency-cruiser.cjs'), 'module.exports = {};');
    const r = runRuleLiveness('R3', r3, { repoRoot });
    expect(r.status).toBe('pass');
    expect(r.mode).toBe('config-presence');
  });
  it('❌ fails when no architectural config is present', () => {
    mkdirSync(repoRoot, { recursive: true });
    const r = runRuleLiveness('R3', r3, { repoRoot });
    expect(r.status).toBe('fail');
    expect(r.failures?.[0]).toMatch(/no dependency-cruiser/);
  });
});

describe('exempt mode', () => {
  it('returns status=exempt with the per-rule rationale', () => {
    const r = runRuleLiveness('IR3', { check: { type: 'script', script: 'prose' }, 'liveness-mode': 'exempt' });
    expect(r.status).toBe('exempt');
    expect(r.reason).toBe(EXEMPT_RULES.IR3);
  });
});

describe('getChangedCmdScriptRuleIds', () => {
  const current = JSON.stringify({
    R1: { check: { type: 'command', command: 'a' } },
    R2: { check: { type: 'eslint', rule: 'x/y' } },
    R4: { check: { type: 'script', script: 's' } },
  });
  it('returns all cmd/script rules when no base', () => {
    expect(getChangedCmdScriptRuleIds(null, current).sort()).toEqual(['R1', 'R4']);
  });
  it('returns only the changed cmd/script rule vs the base', () => {
    const base = JSON.stringify({
      R1: { check: { type: 'command', command: 'a' } },
      R2: { check: { type: 'eslint', rule: 'x/y' } },
      R4: { check: { type: 'script', script: 'OLD' } },
    });
    expect(getChangedCmdScriptRuleIds(base, current)).toEqual(['R4']);
  });
  it('ignores ESLint rule changes', () => {
    const base = JSON.stringify({
      R1: { check: { type: 'command', command: 'a' } },
      R2: { check: { type: 'eslint', rule: 'OLD' } },
      R4: { check: { type: 'script', script: 's' } },
    });
    expect(getChangedCmdScriptRuleIds(base, current)).toEqual([]);
  });
});

describe('runCmdScriptLivenessCheck aggregation', () => {
  it('buckets pass / fail / skipped / exempt across rules', () => {
    const manifest: Record<string, CmdScriptRule> = {
      R19: { check: { type: 'command', command: 'depcruise --validate' }, fixture: { 'setup-script': 'printf x > a' } },
      IR3: { check: { type: 'script', script: 'prose' }, 'liveness-mode': 'exempt' },
    };
    const report = runCmdScriptLivenessCheck(['R19', 'IR3'], manifest, {
      runCheckFn: pairedRun({ depcruise: { clean: ok, violating: nonzero } }),
    });
    expect(report.passed).toEqual(['R19']);
    expect(report.exempt[0]).toMatch(/^IR3:/);
    expect(report.failures).toHaveLength(0);
  });
});
