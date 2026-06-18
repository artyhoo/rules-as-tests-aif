import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HELPER = resolve(REPO_ROOT, '.claude/skills/story/helpers/emit-story-prompt.sh');

function run(lang?: string): string {
  const env = { ...process.env };
  if (lang === undefined) delete env.AIF_HOOK_LANG;
  else env.AIF_HOOK_LANG = lang;
  return execFileSync('bash', [HELPER], { env, encoding: 'utf8' });
}

describe('emit-story-prompt.sh', () => {
  it('default → English story instruction with the 🎬 marker', () => {
    const out = run(undefined);
    expect(out).toContain('## 🎬 The story');
    expect(out).toMatch(/by acts/i);
  });
  it('AIF_HOOK_LANG=ru → Russian story instruction', () => {
    const out = run('ru');
    expect(out).toContain('## 🎬 Как это было');
    expect(out).toMatch(/по актам/i);
  });
  it('unknown lang → English fallback (non-empty)', () => {
    const out = run('zz');
    expect(out).toContain('## 🎬 The story');
    expect(out.trim().length).toBeGreaterThan(0);
  });
});
