// packages/runtime-bridge/src/harvest.ts
/**
 * Harvest — the deterministic egress leg of the bridge.
 *
 * aif-handoff, by design, ends a task at "committed on a local feature branch +
 * auto-reviewed". It has NO push and NO PR-creation in its autonomous (HANDOFF)
 * path (verified 2026-06-01 against the running containers: `git push` lives only
 * in the LLM-driven `/aif-commit` flow, no `gh pr create` anywhere). So the
 * committed work strands inside aif's checkout, never reaching a reviewable PR on
 * the trunk.
 *
 * This is the missing return leg: take whatever aif committed (by its persisted
 * `task.branchName`), push that branch to origin, open a PR against the trunk, and
 * arm GitHub native auto-merge. It depends on NOTHING inside aif's commit state
 * machine — it ships the existing commit as-is.
 *
 * Deliberately ZERO LLM: aif's own commit flow spends a paid `claude -p` query just
 * to run `git add/commit/push` (a deterministic op). Harvest is plain git + gh, so
 * it costs nothing and complies with no-paid-llm-in-ci.md by construction.
 *
 * This module is the PURE core (dependency-injected) so it is unit-testable without
 * shelling out. The CLI wrapper (cli/harvest.ts) wires the real git/gh/docker
 * implementations.
 *
 * @cc-only-rationale: pure TS over injected deps — no CC-only primitive, no paid LLM.
 */

/** Terminal aif statuses whose work is committed and safe to harvest. */
const TERMINAL_STATUSES = new Set(['done', 'verified']);

/** The injected side-effects harvest performs, in order. */
export interface HarvestDeps {
  /** Push the (already-committed) feature branch from aif's checkout to origin. */
  pushBranch: (branchName: string) => Promise<void>;
  /** Open a PR for the pushed branch against `base`; returns the PR URL. */
  createPr: (opts: { branch: string; base: string; title: string; body: string }) => Promise<string>;
  /** Arm GitHub native auto-merge on the PR (merges itself on green CI). */
  enableAutoMerge: (prUrl: string) => Promise<void>;
}

export interface HarvestOpts {
  /** Trunk the PR targets (e.g. "staging"). */
  baseBranch: string;
  /** PR body (the §1.7-compliant text the orchestrator/aif prepared). */
  body: string;
  /** Arm GitHub auto-merge after opening the PR. */
  autoMerge: boolean;
}

export interface HarvestResult {
  prUrl: string;
  branch: string;
  pushed: boolean;
  autoMerge: boolean;
}

/** The subset of an aif task harvest reads. */
export interface HarvestableTask {
  id: string;
  title: string;
  status: string;
  branchName?: string | null;
}

/**
 * Harvest a completed aif task into a reviewable PR on the trunk.
 *
 * Order is load-bearing and fail-fast:
 *  1. guard status is terminal (work is committed) — else throw BEFORE any push.
 *  2. guard branchName present — else throw BEFORE opening a PR.
 *  3. push → createPr → (optional) enableAutoMerge. If createPr throws, auto-merge
 *     is never armed (no half-merged state).
 */
export async function harvestTask(
  task: HarvestableTask,
  opts: HarvestOpts,
  deps: HarvestDeps,
): Promise<HarvestResult> {
  if (!TERMINAL_STATUSES.has(task.status)) {
    throw new Error(
      `harvest: task ${task.id} status=${task.status} is not terminal (done/verified) — nothing to harvest yet`,
    );
  }
  const branch = task.branchName;
  if (!branch) {
    throw new Error(`harvest: task ${task.id} has no branchName — aif did not create/persist a feature branch`);
  }

  await deps.pushBranch(branch);
  const prUrl = await deps.createPr({ branch, base: opts.baseBranch, title: task.title, body: opts.body });

  let autoMerge = false;
  if (opts.autoMerge) {
    await deps.enableAutoMerge(prUrl);
    autoMerge = true;
  }

  return { prUrl, branch, pushed: true, autoMerge };
}
