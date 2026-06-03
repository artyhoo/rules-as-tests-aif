import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(HERE, '../../..', '.claude/skills/pipeline/lang/check-parity.sh');

describe('pipeline lang parity', () => {
  it('en.sh and ru.sh expose identical keys', () => {
    const out = execFileSync('bash', [SCRIPT], { encoding: 'utf8' });
    expect(out).toMatch(/^OK:/);
  });
});
