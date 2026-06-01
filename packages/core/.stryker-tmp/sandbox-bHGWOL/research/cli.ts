#!/usr/bin/env -S npx tsx
// @ts-nocheck
// rules-as-tests-research — npm bin entrypoint.
// Modes:
//   <projectRoot>            → ResearchPlan to stdout (drift: null)
//   --self                   → ResearchPlan with drift populated for own repo
//   --diff <pathA> <pathB>   → ResearchDelta JSON to stdout
//   --pattern <id>           → filter ResearchPlan.patterns to one entry
// argv parsing kept minimal (no yargs/commander) per phase-5-research §3.6.

import { readFileSync } from 'node:fs';
import { detectStack } from '../detector/index.ts';
import { research } from './index.ts';
import { detectDrift } from './drift.ts';
import { diffPlans } from './diff.ts';
import type { ResearchPlan } from './types.ts';

interface Args {
  root: string;
  self: boolean;
  diff: [string, string] | null;
  pattern: string | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { root: process.cwd(), self: false, diff: null, pattern: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--self') args.self = true;
    else if (a === '--diff') {
      args.diff = [argv[++i], argv[++i]];
    } else if (a === '--pattern') args.pattern = argv[++i];
    else if (a === '-h' || a === '--help') {
      process.stdout.write(
        'Usage: rules-as-tests-research [<projectRoot>] [--self] [--diff <a> <b>] [--pattern <id>]\n',
      );
      process.exit(0);
    } else if (!a.startsWith('-')) args.root = a;
  }
  return args;
}

function emit(plan: ResearchPlan, pattern: string | null): void {
  const out = pattern
    ? { ...plan, patterns: plan.patterns.filter((p) => p.id === pattern) }
    : plan;
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.diff) {
    const a = JSON.parse(readFileSync(args.diff[0], 'utf8')) as ResearchPlan;
    const b = JSON.parse(readFileSync(args.diff[1], 'utf8')) as ResearchPlan;
    process.stdout.write(JSON.stringify(diffPlans(a, b), null, 2) + '\n');
    return;
  }
  const detection = detectStack(args.root);
  const plan = research(detection);
  if (args.self) plan.drift = detectDrift(args.root);
  emit(plan, args.pattern);
}

main().catch((err: unknown) => {
  process.stderr.write(`research: ${(err as Error).message}\n`);
  process.exit(1);
});
