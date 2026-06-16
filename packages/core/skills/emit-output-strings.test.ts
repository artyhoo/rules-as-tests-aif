import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HELPER = resolve(REPO_ROOT, '.claude/skills/pipeline/helpers/emit-output-strings.sh');

function run(lang: string | undefined): string {
  const env = { ...process.env };
  if (lang === undefined) delete env.AIF_HOOK_LANG;
  else env.AIF_HOOK_LANG = lang;
  return execFileSync('bash', [HELPER], { env, encoding: 'utf8' });
}

describe('emit-output-strings.sh', () => {
  it('default (no AIF_HOOK_LANG) emits English tokens', () => {
    const out = run(undefined);
    expect(out).toMatch(/AIF_PIPELINE_COL_WHEN=When/);
    expect(out).toMatch(/AIF_RECAP_MARKER=## 🟢 In plain words/);
  });

  it('AIF_HOOK_LANG=ru emits Russian tokens', () => {
    const out = run('ru');
    expect(out).toMatch(/AIF_PIPELINE_COL_WHEN=Когда/);
    expect(out).toMatch(/AIF_RECAP_MARKER=## 🟢 Простыми словами/);
  });

  it('unknown AIF_HOOK_LANG falls back to English (non-empty)', () => {
    const out = run('zz');
    expect(out).toMatch(/AIF_PIPELINE_COL_WHEN=When/);
    expect(out.trim().length).toBeGreaterThan(0);
  });

  it('default emits the English output-language directive', () => {
    const out = run(undefined);
    expect(out).toMatch(/AIF_PIPELINE_OUTPUT_DIRECTIVE=Write the entire report in English\./);
  });

  it('AIF_HOOK_LANG=ru emits the Russian output-language directive', () => {
    const out = run('ru');
    expect(out).toMatch(/AIF_PIPELINE_OUTPUT_DIRECTIVE=Сформируй весь отчёт на русском языке\./);
  });
});
