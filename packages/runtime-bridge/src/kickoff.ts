/**
 * KickoffSpec builder — constructs a KickoffSpec from a file path.
 *
 * Reads kickoff.md from disk, computes SHA-256 hash of content,
 * and derives umbrellaName from the parent directory name.
 *
 * Per-task opt-out: if first line of kickoff is `<!-- bridge: skip -->`,
 * returns null (caller should use ManualBackend directly).
 *
 * @cc-only-rationale: Used from both hook (CC) and CLI entrypoint (portable).
 */
import { readFileSync } from 'node:fs';
import { dirname, basename } from 'node:path';
import { hashContent } from './idempotency.js';
import type { KickoffSpec } from './types.js';

/**
 * Build a KickoffSpec from a kickoff file path.
 * Returns null if the kickoff has a `<!-- bridge: skip -->` first-line marker.
 */
export function buildKickoffSpec(filePath: string): KickoffSpec | null {
  const content = readFileSync(filePath, 'utf8');

  // Per-task opt-out: `<!-- bridge: skip -->` as first line.
  const firstLine = content.split('\n')[0]?.trim() ?? '';
  if (firstLine === '<!-- bridge: skip -->') {
    return null;
  }

  // Umbrella name: parent directory of kickoff.md
  // e.g. .claude/orchestrator-prompts/my-feature-meta-launch/kickoff.md
  //       → umbrellaName = "my-feature-meta-launch"
  const umbrellaName = basename(dirname(filePath));

  return {
    filePath,
    content,
    umbrellaName,
    contentHash: hashContent(content),
  };
}
