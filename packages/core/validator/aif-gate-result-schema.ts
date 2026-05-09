// Hand-rolled JSON-shape validator for AIF aif-gate-result schema (Phase 9 A9 closure).
// No Ajv per EXECUTION-PLAN.md §6.0 #2 stop-rule. Pure type-narrowing.
// Accepts every shape the pinned snapshot allows; rejects malformed inputs.
// Source: packages/core/validator/aif-gate-result-schema.snapshot.md (context7 fetch 2026-05-09).

export interface ValidateResult {
  ok: boolean;
  errors: string[];
}

const GATES = ['verify', 'review', 'security', 'rules'] as const;
const STATUSES = ['pass', 'warn', 'fail'] as const;
const SEVERITIES = ['error', 'warning'] as const;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function validateBlocker(b: unknown, errs: string[], idx: number): void {
  if (typeof b !== 'object' || b === null) {
    errs.push(`blockers[${idx}]: not an object`);
    return;
  }
  const x = b as Record<string, unknown>;
  if (typeof x.id !== 'string') errs.push(`blockers[${idx}].id: not string`);
  if (!SEVERITIES.includes(x.severity as (typeof SEVERITIES)[number])) {
    errs.push(`blockers[${idx}].severity: not in ${SEVERITIES.join('|')}`);
  }
  if (x.file !== null && typeof x.file !== 'string') {
    errs.push(`blockers[${idx}].file: not string|null`);
  }
  if (typeof x.summary !== 'string') errs.push(`blockers[${idx}].summary: not string`);
}

function validateSuggestedNext(s: unknown, errs: string[]): void {
  if (typeof s !== 'object' || s === null) {
    errs.push('suggested_next: not an object');
    return;
  }
  const x = s as Record<string, unknown>;
  if (x.command !== null && typeof x.command !== 'string') {
    errs.push('suggested_next.command: not string|null');
  }
  if (x.reason !== null && typeof x.reason !== 'string') {
    errs.push('suggested_next.reason: not string|null');
  }
}

export function validateAifGateResult(obj: unknown): ValidateResult {
  const errors: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    return { ok: false, errors: ['root: not an object'] };
  }
  const o = obj as Record<string, unknown>;
  if (o.schema_version !== 1) errors.push('schema_version: must be literal 1');
  if (!GATES.includes(o.gate as (typeof GATES)[number])) {
    errors.push(`gate: not in ${GATES.join('|')}`);
  }
  if (!STATUSES.includes(o.status as (typeof STATUSES)[number])) {
    errors.push(`status: not in ${STATUSES.join('|')}`);
  }
  if (typeof o.blocking !== 'boolean') errors.push('blocking: not boolean');
  if (!Array.isArray(o.blockers)) {
    errors.push('blockers: not array');
  } else {
    o.blockers.forEach((b, i) => validateBlocker(b, errors, i));
  }
  if (!isStringArray(o.affected_files)) errors.push('affected_files: not string[]');
  validateSuggestedNext(o.suggested_next, errors);
  // Cross-field invariant: blocking=true requires non-empty blockers when status="fail"
  if (typeof o.blocking === 'boolean' && o.status === 'fail') {
    if (o.blocking && Array.isArray(o.blockers) && o.blockers.length === 0) {
      errors.push('blocking=true requires non-empty blockers when status=fail');
    }
  }
  return { ok: errors.length === 0, errors };
}
