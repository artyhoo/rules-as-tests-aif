#!/usr/bin/env -S npx tsx
// rules-as-tests-install — npm bin entrypoint.
// Modes:
//   <consumerRoot>           → detect → research → synth → validate → install
//   --from-synth <path>      → load SynthesisPlan JSON → validate → install
//   --dry-run                → compute artifacts, run pre-validation, no disk writes
//   --force                  → overwrite existing rules-lock.json
//   --strict                 → exit 1 if InstallReport.ok is false
//
// Output: InstallReport JSON on stdout.

import { readFileSync } from 'node:fs';
import { detectStack } from '../detector/index.ts';
import { research } from '../research/index.ts';
import { synthesize } from '../synthesizer/synthesize.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';
import { install } from './install.ts';

interface Args {
  consumerRoot: string;
  fromSynth: string | null;
  force: boolean;
  dryRun: boolean;
  strict: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    consumerRoot: process.cwd(),
    fromSynth: null,
    force: false,
    dryRun: false,
    strict: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--from-synth') args.fromSynth = argv[++i];
    else if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--strict') args.strict = true;
    else if (a === '-h' || a === '--help') {
      process.stdout.write(
        'Usage: rules-as-tests-install [<consumerRoot>] [--from-synth <path>] [--dry-run] [--force] [--strict]\n',
      );
      process.exit(0);
    } else if (!a.startsWith('-')) args.consumerRoot = a;
  }
  return args;
}

function loadSynthPlan(args: Args): SynthesisPlan {
  if (args.fromSynth) {
    return JSON.parse(readFileSync(args.fromSynth, 'utf8')) as SynthesisPlan;
  }
  return synthesize(research(detectStack(args.consumerRoot)));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const plan = loadSynthPlan(args);
  const report = install(plan, {
    consumerRoot: args.consumerRoot,
    force: args.force,
    dryRun: args.dryRun,
  });
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (args.strict && !report.ok) process.exit(1);
}

try {
  main();
} catch (err) {
  process.stderr.write(`install: ${(err as Error).message}\n`);
  process.exit(1);
}
