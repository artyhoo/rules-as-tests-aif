// Layer 4 Validator (Phase 7) — public types.
// 6 gates per architecture.md §2.6; Phase 7 v1 ships gates 1, 2, 4, 6
// as REQUIRED. Gate 3 (mutation) = SKIP (Path B only). Gate 5 (two-AI
// review) = DEFER (advisory; maps to AIF review-sidecar; cost-scope Phase 8).

export type GateStatus = 'pass' | 'fail' | 'skip' | 'n/a';

export interface GateFailure {
  ruleId?: string;
  reason: string;
}

export interface GateOutcome {
  status: GateStatus;
  failures: GateFailure[];
}

export interface ValidationReport {
  ok: boolean;
  gates: {
    schema: GateOutcome;
    ruleTester: GateOutcome;
    tautology: GateOutcome;
    conflict: GateOutcome;
    singleTokenDiff: GateOutcome;
    messageIdCoverage: GateOutcome;
    autofixClean: GateOutcome;
  };
}
