// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectStack } from './index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, 'fixtures');

const CASES = [
  'with-aif',
  'no-aif',
  'next-15',
  'next-16',
  'react-only',
  'ts-server',
  'aif-skill-context',
] as const;

describe('detector snapshot — frozen fixture trees', () => {
  for (const fixture of CASES) {
    it(`detectStack(${fixture}) matches snapshot`, () => {
      const result = detectStack(resolve(FIXTURES, fixture));
      expect(result).toMatchSnapshot();
    });
  }
});
