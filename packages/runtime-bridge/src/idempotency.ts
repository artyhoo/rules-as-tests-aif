/**
 * Content-hash idempotency for dispatch deduplication.
 *
 * State path: /tmp/runtime-bridge-dedup.jsonl
 * Each line: { hash, taskHandle, timestamp }
 * TTL: 24 hours (lines older than 24h are ignored on lookup).
 *
 * Design: append-only JSONL (never rewritten). Dedup lookup is O(n)
 * over the last 24h window — MVP acceptable for expected event frequency
 * of ≤100 dispatches/day.
 *
 * @cc-only-rationale: Used from both hook (CC) and CLI entrypoint (portable).
 */
import { createHash } from 'node:crypto';
import { existsSync, appendFileSync, readFileSync } from 'node:fs';
import type { TaskHandle } from './types.js';

const DEDUP_PATH = '/tmp/runtime-bridge-dedup.jsonl';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DedupEntry {
  hash: string;
  taskHandle: TaskHandle;
  timestamp: string; // ISO
}

/**
 * Compute SHA-256 hex hash of kickoff content.
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Check if a dispatch with this content hash was already made within the TTL.
 * Returns the prior TaskHandle if found, null otherwise.
 */
export function checkDedup(contentHash: string): TaskHandle | null {
  if (!existsSync(DEDUP_PATH)) return null;

  const now = Date.now();
  const lines = readFileSync(DEDUP_PATH, 'utf8').trim().split('\n').filter(Boolean);

  for (const line of lines) {
    let entry: DedupEntry;
    try {
      entry = JSON.parse(line) as DedupEntry;
    } catch {
      continue;
    }
    if (entry.hash !== contentHash) continue;
    const age = now - new Date(entry.timestamp).getTime();
    if (age > TTL_MS) continue;
    return entry.taskHandle;
  }
  return null;
}

/**
 * Record a successful dispatch to the dedup log.
 */
export function recordDispatch(contentHash: string, taskHandle: TaskHandle): void {
  const entry: DedupEntry = {
    hash: contentHash,
    taskHandle,
    timestamp: new Date().toISOString(),
  };
  appendFileSync(DEDUP_PATH, JSON.stringify(entry) + '\n', 'utf8');
}
