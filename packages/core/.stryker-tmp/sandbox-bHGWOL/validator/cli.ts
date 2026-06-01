#!/usr/bin/env -S npx tsx
// @ts-nocheck
// rules-as-tests-validate — npm bin entrypoint.
// Modes:
//   <projectRoot>            → detect → research → synth → validate → JSON
//   --from-synth <path>      → load SynthesisPlan JSON → validate → JSON
//   --strict                 → exit 1 if ValidationReport.ok is false
//                              (default exits 0 with the report on stdout)
//   --aif-gate-result        → emit AIF aif-gate-result JSON instead of
//                              ValidationReport (Phase 8 Task 8.4 — closes
//                              aif-comparison.md §7 Phase 11.1 partial)

import { readFileSync } from 'node:fs';
import { detectStack } from '../detector/index.ts';
import { research } from '../research/index.ts';
import { synthesize } from '../synthesizer/synthesize.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';
import { fromValidationReport } from './to-aif-gate-result.ts';
import { validate } from './validate.ts';

interface Args {
  root: string;
  fromSynth: string | null;
  strict: boolean;
  aifGateResult: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    root: process.cwd(),
    fromSynth: null,
    strict: false,
    aifGateResult: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--from-synth') args.fromSynth = argv[++i];
    else if (a === '--strict') args.strict = true;
    else if (a === '--aif-gate-result') args.aifGateResult = true;
    else if (a === '-h' || a === '--help') {
      process.stdout.write(
        'Usage: rules-as-tests-validate [<projectRoot>] [--from-synth <path>] [--strict] [--aif-gate-result]\n',
      );
      process.exit(0);
    } else if (!a.startsWith('-')) args.root = a;
  }
  return args;
}

function loadSynthPlan(args: Args): SynthesisPlan {
  if (args.fromSynth) {
    return JSON.parse(readFileSync(args.fromSynth, 'utf8')) as SynthesisPlan;
  }
  return synthesize(research(detectStack(args.root)));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const plan = loadSynthPlan(args);
  const report = validate(plan);
  const out = args.aifGateResult ? fromValidationReport(report) : report;
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  if (args.strict && !report.ok) {
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`validate: ${(err as Error).message}\n`);
  process.exit(1);
}
