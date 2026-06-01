#!/usr/bin/env tsx
// @ts-nocheck
/**
 * validate-batch-spec.ts
 * Phase 1.C — Spec discipline: verify action SHAs in orchestrator-prompts.
 *
 * Exit codes:
 *   0 — all valid OR --soft mode
 *   1 — findings detected (hard fail)
 *   2 — tooling unavailable (no gh CLI, rate limit) — not treated as fail in pre-push
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

// ── CLI parsing ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const SOFT = args.includes('--soft');
const PATHS_ONLY = args.includes('--paths-only');
const pathArgs = args.filter((a) => !a.startsWith('--'));

// ── Constants ──────────────────────────────────────────────────────────────────

const CACHE_DIR = '/tmp/validate-batch-spec-cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Regex: captures owner/repo@40-char-sha with optional # version comment.
// Works on lines like:  uses: actions/checkout@<sha>  # v4.2.2
// or in markdown:       `uses: actions/checkout@<sha>`
const ACTION_REF_RE = /(?:uses:\s*)([\w.-]+\/[\w.-]+)@([a-f0-9]{40})(?:\s*#\s*(\S+))?/g;

// Code fence detection — skip refs inside git/text fences (documentation examples)
const FENCE_OPEN_RE = /^```(?:git|text|bash|sh|yaml|yml)/;
const FENCE_CLOSE_RE = /^```\s*$/;

// ── Types ──────────────────────────────────────────────────────────────────────

interface Finding {
  file: string;
  line: number;
  ref: string;
  reason: string;
}

interface CacheEntry {
  ts: number;
  result: 'ok' | 'not-found' | 'sha-mismatch';
  reason?: string;
}

// ── File collection ────────────────────────────────────────────────────────────

function collectFiles(): string[] {
  if (pathArgs.length > 0) {
    return pathArgs;
  }
  const promptsDir = resolve(REPO_ROOT, '.claude/orchestrator-prompts');
  if (!existsSync(promptsDir)) {
    return [];
  }
  return findMdFiles(promptsDir);
}

function findMdFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...findMdFiles(full));
    } else if (entry.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

// ── Extraction ─────────────────────────────────────────────────────────────────

interface ActionRef {
  line: number;
  ownerRepo: string;
  sha: string;
  versionComment?: string;
}

function extractRefs(content: string): ActionRef[] {
  const refs: ActionRef[] = [];
  const lines = content.split('\n');
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trimStart();

    // Track code fences to skip false positives (documentation examples)
    if (!inFence && FENCE_OPEN_RE.test(trimmed)) {
      inFence = true;
      continue;
    }
    if (inFence && FENCE_CLOSE_RE.test(trimmed)) {
      inFence = false;
      continue;
    }
    if (inFence) continue;

    ACTION_REF_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ACTION_REF_RE.exec(raw)) !== null) {
      refs.push({
        line: i + 1,
        ownerRepo: match[1],
        sha: match[2],
        versionComment: match[3],
      });
    }
  }
  return refs;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

function cacheKey(ownerRepo: string, sha: string, versionComment?: string): string {
  const tag = versionComment ? `_tag_${versionComment}` : '';
  return `${ownerRepo.replace('/', '__')}__${sha}${tag}`;
}

function readCache(key: string): CacheEntry | null {
  const path = `${CACHE_DIR}/${key}.json`;
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(key: string, entry: CacheEntry): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(`${CACHE_DIR}/${key}.json`, JSON.stringify(entry));
  } catch {
    // Non-fatal — cache write failure doesn't block validation
  }
}

// ── gh CLI ────────────────────────────────────────────────────────────────────

function ghAvailable(): boolean {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    // gh not authenticated — try anonymous anyway
    try {
      execSync('gh --version', { stdio: 'pipe' });
      return true; // gh exists, just not authed — still usable for public repos
    } catch {
      return false;
    }
  }
}

function ghApi(path: string): { status: number; body: string } {
  try {
    const body = execFileSync('gh', ['api', path], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { status: 200, body };
  } catch (err: unknown) {
    const e = err as { status?: number; stderr?: Buffer };
    const stderr = e.stderr ? e.stderr.toString() : '';
    if (stderr.includes('rate limit') || stderr.includes('403')) {
      return { status: 403, body: stderr };
    }
    // 404 or other — action/ref not found
    return { status: 404, body: stderr };
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

type ToolingStatus = 'ok' | 'rate-limited' | 'unavailable';

let toolingStatus: ToolingStatus = 'ok';

function validateRef(ref: ActionRef): string | null {
  if (PATHS_ONLY) {
    // Offline mode: just verify the format (already guaranteed by regex)
    return null;
  }

  if (toolingStatus === 'unavailable') {
    return null; // already reported
  }
  if (toolingStatus === 'rate-limited') {
    return null;
  }

  const key = cacheKey(ref.ownerRepo, ref.sha, ref.versionComment);
  const cached = readCache(key);
  if (cached) {
    if (cached.result === 'ok') return null;
    return cached.reason ?? `${cached.result}`;
  }

  // Check action existence at this SHA
  const actionPath = `repos/${ref.ownerRepo}/contents/action.yml?ref=${ref.sha}`;
  const res = ghApi(actionPath);

  if (res.status === 403) {
    toolingStatus = 'rate-limited';
    return null; // soft skip
  }

  if (res.status !== 200) {
    // action.yml not found — try action.yaml as fallback
    const actionPathYaml = `repos/${ref.ownerRepo}/contents/action.yaml?ref=${ref.sha}`;
    const res2 = ghApi(actionPathYaml);
    if (res2.status === 403) {
      toolingStatus = 'rate-limited';
      return null;
    }
    if (res2.status !== 200) {
      const reason = `action.yml not found at SHA ${ref.sha} in ${ref.ownerRepo}`;
      writeCache(key, { ts: Date.now(), result: 'not-found', reason });
      return reason;
    }
  }

  // Optional: verify tag↔SHA consistency
  if (ref.versionComment) {
    const tagRef = `repos/${ref.ownerRepo}/git/refs/tags/${ref.versionComment}`;
    const tagRes = ghApi(tagRef);
    if (tagRes.status === 200) {
      try {
        const tagData = JSON.parse(tagRes.body) as {
          object?: { sha?: string; type?: string; url?: string };
        };
        let resolvedSha = tagData.object?.sha ?? '';

        // If tag object is an annotated tag, resolve to the commit SHA
        if (tagData.object?.type === 'tag') {
          const tagObjUrl = tagData.object.url;
          if (tagObjUrl) {
            // Extract path from URL like https://api.github.com/repos/owner/repo/git/tags/<sha>
            const urlPath = tagObjUrl.replace('https://api.github.com/', '');
            const tagObjRes = ghApi(urlPath);
            if (tagObjRes.status === 200) {
              const tagObj = JSON.parse(tagObjRes.body) as { object?: { sha?: string } };
              resolvedSha = tagObj.object?.sha ?? resolvedSha;
            }
          }
        }

        if (resolvedSha && resolvedSha !== ref.sha) {
          const reason = `tag ${ref.versionComment} resolves to ${resolvedSha.slice(0, 12)}, not pinned SHA ${ref.sha.slice(0, 12)}`;
          writeCache(key, { ts: Date.now(), result: 'sha-mismatch', reason });
          return reason;
        }
      } catch {
        // JSON parse failure — skip tag check
      }
    }
    // If tag not found (404) — we can't verify, but we already verified the SHA exists → pass
  }

  writeCache(key, { ts: Date.now(), result: 'ok' });
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const files = collectFiles();

  if (files.length === 0) {
    console.log('No orchestrator-prompt files to validate.');
    process.exit(0);
  }

  if (!PATHS_ONLY && !ghAvailable()) {
    const msg = 'gh CLI not available — cannot verify action SHAs (exit 2, soft-skip)';
    if (SOFT) {
      process.stderr.write(`⚠ ${msg}\n`);
    } else {
      console.warn(`⚠ ${msg}`);
    }
    process.exit(2);
  }

  const findings: Finding[] = [];

  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const refs = extractRefs(content);
    let fileFindings = 0;

    for (const ref of refs) {
      const reason = validateRef(ref);
      if (reason !== null) {
        findings.push({ file, line: ref.line, ref: `${ref.ownerRepo}@${ref.sha.slice(0, 12)}`, reason });
        fileFindings++;
      }
    }

    if (fileFindings === 0) {
      const count = refs.length;
      if (count > 0) {
        console.log(`✓ ${file}: ${count} ref${count !== 1 ? 's' : ''} verified`);
      }
    }
  }

  if (toolingStatus === 'rate-limited') {
    const msg = 'gh API rate limit exceeded — soft-skip remaining checks (exit 2)';
    if (SOFT) {
      process.stderr.write(`⚠ ${msg}\n`);
    } else {
      console.warn(`⚠ ${msg}`);
    }
    process.exit(2);
  }

  if (findings.length === 0) {
    process.exit(0);
  }

  // Report findings
  for (const f of findings) {
    const msg = `✗ ${f.file}: line ${f.line}: ${f.ref} — ${f.reason}`;
    if (SOFT) {
      process.stderr.write(`${msg}\n`);
    } else {
      console.error(msg);
    }
  }

  if (SOFT) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('validate-batch-spec: unexpected error:', err);
  process.exit(1);
});
