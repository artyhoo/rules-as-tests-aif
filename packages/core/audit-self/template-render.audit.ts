/**
 * Functional template render audit — §13.27 closure.
 *
 * Invokes install.sh against fixture skeletons in os.tmpdir(),
 * then probes rendered artefacts (deterministic-only per Decision 3):
 *   P1 — goal-phrase presence in rendered AGENTS.md
 *   P4 — Authoritative-for headers on authority-bearing rendered docs
 *   P6 — taxonomy fidelity (installed skills match framework skills/ directory)
 *
 * LLM-judge probes (P2/P3/P5) are NOT in CI per Decision 3 + «no-paid» /
 * «LLM-then-cache» invariant. They live in .claude/skills/template-audit/SKILL.md.
 *
 * Each probe has a matching negative (anti-tautology) test to prove the
 * detection actually fires. Pattern mirrors audit-ai-docs.sh negative-test discipline
 * (see packages/core/audit-self/audit-ai-docs.test.sh).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const INSTALL_SH = join(REPO_ROOT, 'install.sh');
const FIXTURES_DIR = join(HERE, 'fixtures');

type Stack = 'ts-server' | 'react-next';

const STACKS: Stack[] = ['ts-server', 'react-next'];

const consumerDirs: Record<Stack, string> = { 'ts-server': '', 'react-next': '' };

async function buildConsumer(stack: Stack, tmpBase: string): Promise<void> {
  const pkgContent = await readFile(join(FIXTURES_DIR, stack, 'package.json'), 'utf8');
  await writeFile(join(tmpBase, 'package.json'), pkgContent);
  if (stack === 'react-next') {
    // Presence of next.config.js triggers react-next auto-detection in setup.sh
    await writeFile(join(tmpBase, 'next.config.js'), 'module.exports = {};\n');
  }
  const result = spawnSync('bash', [INSTALL_SH, stack], {
    cwd: tmpBase,
    encoding: 'utf8',
    // 60s hard timeout — install.sh is a file-copy script; any slowness is a signal
    timeout: 60_000,
  });
  if (result.status !== 0) {
    throw new Error(
      `install.sh failed for ${stack} in ${tmpBase}:\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
    );
  }
}

beforeAll(async () => {
  for (const stack of STACKS) {
    const tmpBase = await mkdtemp(join(tmpdir(), `aif-render-${stack}-`));
    consumerDirs[stack] = tmpBase;
    await buildConsumer(stack, tmpBase);
  }
}, 90_000);

afterAll(async () => {
  for (const dir of Object.values(consumerDirs)) {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

// ── P1 — goal-phrase rendered ──────────────────────────────────────────────
// Wired in commit 2 with P1 synonym list + actual assertions.
// ──────────────────────────────────────────────────────────────────────────

describe('P1 — goal-phrase rendered in AGENTS.md', () => {
  it.todo('ts-server: rendered AGENTS.md carries framework goal-phrase synonym');
  it.todo('react-next: rendered AGENTS.md carries framework goal-phrase synonym');
  it.todo('mutation: content without any synonym fails the P1 check (anti-tautology)');
});

// ── P4 — Authoritative-for header rendered ────────────────────────────────
// Wired in commit 2 with AUTHORITY_HEADER_RE check on key rendered docs.
// ──────────────────────────────────────────────────────────────────────────

describe('P4 — Authoritative-for header on rendered docs', () => {
  it.todo('ts-server: rendered AGENTS.md carries Authoritative-for header');
  it.todo('react-next: rendered AGENTS.md carries Authoritative-for header');
  it.todo('mutation: content without authority header fails the P4 check (anti-tautology)');
});

// ── P6 — taxonomy fidelity ────────────────────────────────────────────────
// Wired in commit 2: framework skills/ entries exist in consumer .claude/skills/.
// ──────────────────────────────────────────────────────────────────────────

describe('P6 — skill taxonomy fidelity', () => {
  it.todo('ts-server: framework skills/ entries installed to consumer .claude/skills/');
  it.todo('react-next: framework skills/ entries installed to consumer .claude/skills/');
  it.todo('mutation: fabricated skill name not present in consumer (anti-tautology)');
});
