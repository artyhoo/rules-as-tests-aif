import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

// The ONLY Cyrillic permitted in the shipped skill (excluding lang/ru.sh):
// the Class-3 bilingual deferral-detection tokens (spec §Class 3).
const ALLOWED = /выбирай сам|оба норм|я устал/;

describe('pipeline skill is English-canonical', () => {
  it("grep Cyrillic over the skill (excluding lang/ru.sh) yields only allowlisted detection tokens", () => {
    let out = '';
    try {
      out = execSync(
        `LC_ALL=en_US.UTF-8 grep -rn '[А-Яа-яЁё]' .claude/skills/pipeline/ --exclude-dir=lang`,
        { cwd: REPO_ROOT, encoding: 'utf8' },
      );
    } catch (e: any) {
      if (e.status === 1) out = '';
      else throw e;
    }
    const offenders = out.split('\n').filter((l) => l.trim() && !ALLOWED.test(l));
    expect(offenders, `Unexpected Russian prose:\n${offenders.join('\n')}`).toHaveLength(0);
  });
});
