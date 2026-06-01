/**
 * CLI harvest entrypoint — the deterministic egress leg of the bridge.
 *
 * Usage:
 *   tsx packages/runtime-bridge/src/cli/harvest.ts <taskId> \
 *     [--base <branch>] [--body-file <path>] [--no-auto-merge] [--container <name>]
 *
 * aif-handoff ends a task at "committed on a local feature branch" — it has no
 * push and no PR-creation in its autonomous path (verified 2026-06-01). This
 * command closes that gap: read the task's persisted `branchName` from aif's REST
 * API, push that already-made commit out of aif's container to origin, open a PR
 * against the trunk, and arm GitHub native auto-merge (which merges it on green CI).
 *
 * ZERO LLM by construction — plain git + gh. (aif's own commit flow spends a paid
 * `claude -p` query to run git; harvest does not.) Complies with no-paid-llm-in-ci.md.
 *
 * Egress mechanism: aif's commit lives only inside its container's checkout, which
 * already carries working push creds (GH_TOKEN credential helper). Harvest pushes
 * via `docker exec <container> git -C <repo> push` (container name from
 * --container / RUNTIME_BRIDGE_AIF_CONTAINER, default 'aif-handoff-agent-1'); the
 * PR is opened from the host where `gh` is authenticated. If docker / the container
 * is unavailable, harvest prints the exact manual git+gh commands and exits non-zero
 * rather than guessing — graceful degradation, no silent half-egress.
 *
 * Exit codes: 0 = branch pushed + PR opened; 1 = guard failed / push or PR error
 * (the operator runs the printed fallback commands). A foreground operator command,
 * so a real exit code is useful in scripts (distinct from dispatch.ts always-0).
 *
 * @cc-only-rationale: pure TS over git/gh/docker CLIs — no CC-only primitive, no
 *   paid LLM. Operator-side internal tooling (talks to the operator's own aif), so
 *   the docker coupling is acceptable per dual-implementation-discipline.md §3
 *   (internal tooling → CC/env-specific OK); it degrades to printed manual commands.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { getTask } from './aifHttp.js';
import { harvestTask } from '../harvest.js';
import type { HarvestDeps } from '../harvest.js';

const AIF_REPO_PATH = '/home/www/rules-as-tests-aif';

interface ParsedArgs {
  taskId?: string;
  base: string;
  bodyFile?: string;
  autoMerge: boolean;
  container: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional = argv.find((a) => !a.startsWith('--'));
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  return {
    taskId: positional,
    base: flag('--base') ?? 'staging',
    bodyFile: flag('--body-file'),
    autoMerge: !argv.includes('--no-auto-merge'),
    container: flag('--container') ?? process.env['RUNTIME_BRIDGE_AIF_CONTAINER'] ?? 'aif-handoff-agent-1',
  };
}

/** Wire the real git/gh/docker side-effects. Each throws on non-zero exit. */
function realDeps(container: string): HarvestDeps {
  return {
    pushBranch: async (branch) => {
      // Push from INSIDE the container (it holds the commit + working push creds).
      execFileSync('docker', ['exec', container, 'git', '-C', AIF_REPO_PATH, 'push', 'origin', branch], {
        stdio: 'pipe',
      });
    },
    createPr: async ({ branch, base, title, body }) => {
      const out = execFileSync(
        'gh',
        ['pr', 'create', '--base', base, '--head', branch, '--title', title, '--body', body],
        { encoding: 'utf8' },
      );
      // `gh pr create` prints the PR URL on the last non-empty line.
      const url = out.trim().split('\n').filter(Boolean).pop() ?? '';
      if (!/\/pull\/\d+/.test(url)) throw new Error(`harvest: could not parse PR URL from gh output: ${out}`);
      return url;
    },
    enableAutoMerge: async (prUrl) => {
      execFileSync('gh', ['pr', 'merge', prUrl, '--auto', '--squash'], { stdio: 'pipe' });
    },
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.taskId) {
    process.stderr.write('[harvest] usage: harvest.ts <taskId> [--base staging] [--body-file P] [--no-auto-merge]\n');
    process.exit(1);
  }

  const baseUrl = process.env['RUNTIME_BRIDGE_AIF_URL'] ?? 'http://localhost:3009';
  const task = await getTask(baseUrl, args.taskId);

  // Body: prefer an explicit --body-file (the §1.7-compliant text the orchestrator
  // prepared); else a minimal pointer body. Harvest does not invent §1.7 substance.
  const body = args.bodyFile
    ? readFileSync(args.bodyFile, 'utf8')
    : `Harvested by runtime-bridge from aif task \`${args.taskId}\` (branch \`${task.branchName ?? '?'}\`).\n\n` +
      `> ⚠ No --body-file supplied — if this PR touches a §4b-gated path, edit the body to add the §1.7 sections before CI.`;

  try {
    const res = await harvestTask(
      task,
      { baseBranch: args.base, body, autoMerge: args.autoMerge },
      realDeps(args.container),
    );
    process.stdout.write(
      JSON.stringify({ ok: true, prUrl: res.prUrl, branch: res.branch, autoMerge: res.autoMerge }) + '\n',
    );
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[harvest] FAILED: ${msg}\n`);
    // Graceful degradation: print the exact manual egress so the operator is never stuck.
    if (task.branchName) {
      process.stderr.write(
        `[harvest] manual fallback:\n` +
          `  docker exec ${args.container} git -C ${AIF_REPO_PATH} push origin ${task.branchName}\n` +
          `  gh pr create --base ${args.base} --head ${task.branchName} --title "${task.title}" --body "..."\n` +
          (args.autoMerge ? `  gh pr merge <pr-url> --auto --squash\n` : ''),
      );
    }
    process.exit(1);
  }
}

void main();
