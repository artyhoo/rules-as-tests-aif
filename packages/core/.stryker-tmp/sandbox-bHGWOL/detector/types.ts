// @ts-nocheck
// Detector public types — shared across read-aif, read-manifest, read-config, index.

import type { Confidence, Severity } from './confidence.ts';

export type Stack = 'react-next' | 'ts-server' | 'unknown';

export interface Framework {
  name: string | null;
  version: string | null;
  major: number | null;
}

export interface Runtime {
  name: string;
  major: number | null;
}

export interface DetectionResult {
  stack: Stack;
  framework: Framework;
  runtime: Runtime;
  confidence: Confidence;
  severity: Severity;
  weight: 0 | 1 | 2;
  source: string;
  rules: { applicable: string[]; skipped: string[] };
  /** Standard packages absent from project; fed to Layer 2 (Research Agent). */
  missing?: string[];
  /** Detected stack patterns (e.g. 'nextjs-app-router', 'tailwind-v4-css-tokens'); fed to Layer 2/3. */
  patterns?: string[];
}

export interface DetectorOptions {
  /** Skip AIF artifact reads (priority 1-3); use only manifest/config. */
  skipAif?: boolean;
}
