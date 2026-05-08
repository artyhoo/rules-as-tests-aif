import { describe, expect, it } from 'vitest';
import type { InstallReport } from '../installer/types.ts';
import { fromInstallReport, fromValidationReport } from './to-aif-gate-result.ts';
import type { ValidationReport } from './types.ts';

const PASS_REPORT: ValidationReport = {
  ok: true,
  gates: {
    schema: { status: 'pass', failures: [] },
    ruleTester: { status: 'pass', failures: [] },
    tautology: { status: 'pass', failures: [] },
    conflict: { status: 'pass', failures: [] },
  },
};

const FAIL_REPORT: ValidationReport = {
  ok: false,
  gates: {
    schema: { status: 'pass', failures: [] },
    ruleTester: {
      status: 'fail',
      failures: [{ ruleId: 'G2', reason: 'negative-test did not produce expected violation' }],
    },
    tautology: { status: 'pass', failures: [] },
    conflict: {
      status: 'fail',
      failures: [{ reason: 'orphan plugin reference' }],
    },
  },
};

describe('fromValidationReport', () => {
  it('passing report → status pass, blocking false, no blockers, /aif-commit suggested', () => {
    const r = fromValidationReport(PASS_REPORT);
    expect(r.schema_version).toBe(1);
    expect(r.gate).toBe('rules');
    expect(r.status).toBe('pass');
    expect(r.blocking).toBe(false);
    expect(r.blockers).toEqual([]);
    expect(r.affected_files).toEqual([]);
    expect(r.suggested_next.command).toBe('/aif-commit');
  });

  it('failing report → status fail, blocking true, blockers flatten gate failures, /aif-fix', () => {
    const r = fromValidationReport(FAIL_REPORT);
    expect(r.status).toBe('fail');
    expect(r.blocking).toBe(true);
    expect(r.blockers).toHaveLength(2);
    expect(r.blockers[0]).toMatchObject({
      id: 'ruleTester.G2',
      severity: 'error',
      file: null,
    });
    expect(r.blockers[1].id).toBe('conflict.gate-failure'); // no ruleId → fallback id
    expect(r.suggested_next.command).toBe('/aif-fix');
    expect(r.suggested_next.reason).toContain('2 blocker');
  });

  it('opts.affectedFiles propagates into affected_files', () => {
    const r = fromValidationReport(PASS_REPORT, {
      affectedFiles: ['.ai-factory/synthesizer-output/RULES.md'],
    });
    expect(r.affected_files).toEqual(['.ai-factory/synthesizer-output/RULES.md']);
  });
});

describe('fromInstallReport', () => {
  it('install with green postValidation → status pass, artifacts as affected_files', () => {
    const installReport: InstallReport = {
      ok: true,
      installed: true,
      artifacts: ['/tmp/x/.ai-factory/synthesizer-output/rules-lock.json',
                  '/tmp/x/.ai-factory/synthesizer-output/RULES.md'],
      preValidation: PASS_REPORT,
      postValidation: PASS_REPORT,
      failures: [],
    };
    const r = fromInstallReport(installReport);
    expect(r.status).toBe('pass');
    expect(r.affected_files).toHaveLength(2);
    expect(r.suggested_next.command).toBe('/aif-commit');
  });

  it('install with no postValidation falls back to preValidation', () => {
    const installReport: InstallReport = {
      ok: false,
      installed: false,
      artifacts: [],
      preValidation: FAIL_REPORT,
      failures: [{ stage: 'pre-validate', reason: 'gate failure' }],
    };
    const r = fromInstallReport(installReport);
    expect(r.status).toBe('fail');
    expect(r.blockers).toHaveLength(2);
    expect(r.suggested_next.command).toBe('/aif-fix');
  });
});
