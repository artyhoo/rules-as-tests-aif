#!/usr/bin/env -S npx tsx
// @ts-nocheck
// rules-as-tests-synth — npm bin entrypoint.
// Modes:
//   <projectRoot>             → detect → research → synth → JSON
//   --from-research <path>    → load ResearchPlan JSON → synth → JSON
//   --output <dir>             → also call emit() to write 3 artifact files
//   --pattern <id>             → filter rules to entries with research.entryId === id

import { readFileSync } from 'node:fs';
import { detectStack } from '../detector/index.ts';
import { research, validateResearchPlan } from '../research/index.ts';
import type { ResearchPlan } from '../research/types.ts';
import { synthesize } from './synthesize.ts';
import { emit } from './emit.ts';
import type { SynthesisPlan } from './types.ts';

interface Args {
  root: string;
  fromResearch: string | null;
  output: string | null;
  pattern: string | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { root: process.cwd(), fromResearch: null, output: null, pattern: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--from-research') args.fromResearch = argv[++i];
    else if (a === '--output') args.output = argv[++i];
    else if (a === '--pattern') args.pattern = argv[++i];
    else if (a === '-h' || a === '--help') {
      process.stdout.write(
        'Usage: rules-as-tests-synth [<projectRoot>] [--from-research <path>] [--output <dir>] [--pattern <id>]\n',
      );
      process.exit(0);
    } else if (!a.startsWith('-')) args.root = a;
  }
  return args;
}

function loadPlan(args: Args): ResearchPlan {
  if (args.fromResearch) {
    const parsed: unknown = JSON.parse(readFileSync(args.fromResearch, 'utf8'));
    validateResearchPlan(parsed);
    return parsed;
  }
  return research(detectStack(args.root));
}

function filterPattern(plan: SynthesisPlan, pattern: string | null): SynthesisPlan {
  if (!pattern) return plan;
  return { ...plan, rules: plan.rules.filter((r) => r.research.entryId === pattern) };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const synthPlan = filterPattern(synthesize(loadPlan(args)), args.pattern);
  process.stdout.write(JSON.stringify(synthPlan, null, 2) + '\n');
  if (args.output) emit(synthPlan, args.output);
}

try {
  main();
} catch (err) {
  process.stderr.write(`synth: ${(err as Error).message}\n`);
  process.exit(1);
}
