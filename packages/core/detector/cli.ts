#!/usr/bin/env -S npx tsx
// rules-as-tests-detect — npm bin entrypoint.
// argv parsing kept minimal (no yargs/commander) per phase-4-research §3.4 + Hard constraint.

import { detectStack } from './index.ts';

function parseArgs(argv: string[]): { root: string; emitSkillContext: string | null } {
  let root = process.cwd();
  let emitSkillContext: string | null = null;
  for (const arg of argv) {
    if (arg.startsWith('--emit-skill-context=')) {
      emitSkillContext = arg.slice('--emit-skill-context='.length);
    } else if (arg === '-h' || arg === '--help') {
      process.stdout.write(
        'Usage: rules-as-tests-detect [<projectRoot>] [--emit-skill-context=<dir>]\n',
      );
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      root = arg;
    }
  }
  return { root, emitSkillContext };
}

async function main(): Promise<void> {
  const { root, emitSkillContext } = parseArgs(process.argv.slice(2));
  const result = detectStack(root);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');

  if (emitSkillContext !== null) {
    const { writeSkillContext } = await import('./write-skill-context.ts');
    writeSkillContext(emitSkillContext, result);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`detect: ${(err as Error).message}\n`);
  process.exit(1);
});
