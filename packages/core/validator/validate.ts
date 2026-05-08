// L4 Validator — pure aggregator over 6 gates.
// Phase 7 v1 ships gates 1, 2, 4, 6 as REQUIRED; gate 3 SKIP, gate 5 DEFER.
// Side-effect-free: input SynthesisPlan, output ValidationReport.
// Installer (L5) consumes ValidationReport.ok before writing to disk.

import type { SynthesisPlan } from '../synthesizer/types.ts';
import { runConflictGate } from './gate-conflict.ts';
import { runRuleTesterGate } from './gate-rule-tester.ts';
import { runSchemaGate } from './gate-schema.ts';
import { runTautologyGate } from './gate-tautology.ts';
import type { GateOutcome, ValidationReport } from './types.ts';

const SKIPPED: GateOutcome = {
  status: 'skip',
  failures: [],
};

export function validate(plan: SynthesisPlan): ValidationReport {
  const schema = runSchemaGate(plan);
  const downstreamSkipped = schema.status === 'fail';
  const ruleTester = downstreamSkipped ? SKIPPED : runRuleTesterGate(plan);
  const tautology = downstreamSkipped ? SKIPPED : runTautologyGate(plan);
  const conflict = downstreamSkipped ? SKIPPED : runConflictGate(plan);

  const ok =
    schema.status !== 'fail' &&
    ruleTester.status !== 'fail' &&
    tautology.status !== 'fail' &&
    conflict.status !== 'fail';

  return { ok, gates: { schema, ruleTester, tautology, conflict } };
}
