import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SCRIPT = resolve(HERE, 'render-rules.ts');

describe('render-rules', () => {
  it('renders a stable snapshot from the committed manifest', () => {
    const out = execSync(`npx tsx ${SCRIPT} --print`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(out).toMatchSnapshot();
  });

  it('--check exits 0 when RULES.md is up-to-date', () => {
    execSync(`npx tsx ${SCRIPT}`, { cwd: ROOT, encoding: 'utf8' });
    const result = execSync(`npx tsx ${SCRIPT} --check`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(result).toContain('up-to-date');
  });
});
