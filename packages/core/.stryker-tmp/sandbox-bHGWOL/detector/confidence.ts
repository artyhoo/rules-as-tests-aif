// @ts-nocheck
// Confidence schema — AIF-compatible severity/weight per phase-4-research §3.3 + §4.3.
// Single emit, dual contract: AIF rule-schema ({severity, weight}) + human label (confidence).

export type Severity = 'pass' | 'warn' | 'info';
export type Confidence = 'high' | 'medium' | 'low';
export type Priority = 1 | 2 | 3 | 4 | 5;

export interface ConfidenceTuple {
  severity: Severity;
  weight: 0 | 1 | 2;
  confidence: Confidence;
}

export function toConfidence(priority: Priority): ConfidenceTuple {
  if (priority <= 3) return { severity: 'pass', weight: 2, confidence: 'high' };
  if (priority === 4) return { severity: 'warn', weight: 1, confidence: 'medium' };
  return { severity: 'info', weight: 0, confidence: 'low' };
}
