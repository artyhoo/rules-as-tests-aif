// @ts-nocheck
// Layer 4 Validator (Phase 7) — public API.
// Pure: validate(plan: SynthesisPlan) → ValidationReport. No I/O.
// L5 Installer consumes ValidationReport.ok === true before disk write,
// then re-runs validate() against the installed plan as final meta-check
// (architecture.md §2.7 item 5).

export { validate } from './validate.ts';
export type {
  GateFailure,
  GateOutcome,
  GateStatus,
  ValidationReport,
} from './types.ts';
