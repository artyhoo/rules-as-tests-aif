import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SCRIPT = resolve(HERE, 'detect-applicable-rules.ts');
const FRAMEWORK = resolve(ROOT, 'factory');

const TMP = resolve(ROOT, '.tmp-detect-test');

describe('detect-applicable-rules', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
    writeFileSync(
      resolve(TMP, 'package.json'),
      JSON.stringify({
        name: 'fake',
        dependencies: { zod: '^3.0.0' },
        devDependencies: {},
      }),
    );
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('SKIPS R8 when @opentelemetry/api is absent and ENABLES R1', () => {
    execSync(`npx tsx ${SCRIPT} ${FRAMEWORK}`, {
      cwd: TMP,
      encoding: 'utf8',
    });
    const out = readFileSync(
      resolve(TMP, 'INSTALL-DECISIONS.md'),
      'utf8',
    );
    expect(out).toMatch(/\| R8 .* \| SKIPPED \| @opentelemetry\/api/);
    expect(out).toMatch(/\| R1 .* \| ENABLED \|/);
  });

  it('ENABLES R8 when @opentelemetry/api is present', () => {
    writeFileSync(
      resolve(TMP, 'package.json'),
      JSON.stringify({
        name: 'fake',
        dependencies: { '@opentelemetry/api': '^1.0.0' },
        devDependencies: {},
      }),
    );
    execSync(`npx tsx ${SCRIPT} ${FRAMEWORK}`, {
      cwd: TMP,
      encoding: 'utf8',
    });
    const out = readFileSync(
      resolve(TMP, 'INSTALL-DECISIONS.md'),
      'utf8',
    );
    expect(out).toMatch(/\| R8 .* \| ENABLED \|/);
  });
});
