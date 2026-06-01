// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPatterns } from './patterns.ts';
import { computeMissing, KNOWN_PACKAGES } from './known-packages.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const TMP = resolve(HERE, '../../..', '.tmp-patterns-test');

function mkdir(...parts: string[]) {
  mkdirSync(resolve(TMP, ...parts), { recursive: true });
}

function write(relPath: string, content: string) {
  const full = resolve(TMP, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

describe('detectPatterns', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
  });
  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('empty dir → no patterns detected', () => {
    expect(detectPatterns(TMP)).toEqual([]);
  });

  it('app/ dir → nextjs-app-router', () => {
    mkdir('app');
    expect(detectPatterns(TMP)).toContain('nextjs-app-router');
  });

  it('src/app/ dir → nextjs-app-router', () => {
    mkdir('src', 'app');
    expect(detectPatterns(TMP)).toContain('nextjs-app-router');
  });

  it('no app/ dir → NOT nextjs-app-router', () => {
    expect(detectPatterns(TMP)).not.toContain('nextjs-app-router');
  });

  it('pages/ dir → nextjs-pages-router', () => {
    mkdir('pages');
    expect(detectPatterns(TMP)).toContain('nextjs-pages-router');
  });

  it('src/pages/ dir → nextjs-pages-router', () => {
    mkdir('src', 'pages');
    expect(detectPatterns(TMP)).toContain('nextjs-pages-router');
  });

  it('no pages/ dir → NOT nextjs-pages-router', () => {
    expect(detectPatterns(TMP)).not.toContain('nextjs-pages-router');
  });

  it("src/index.tsx with 'use client' → react-server-components", () => {
    write('src/index.tsx', `'use client'\nexport default function Page() {}`);
    expect(detectPatterns(TMP)).toContain('react-server-components');
  });

  it("src/action.ts with 'use server' → react-server-components", () => {
    write('src/action.ts', `'use server'\nexport async function submit() {}`);
    expect(detectPatterns(TMP)).toContain('react-server-components');
  });

  it('src/*.ts with no directives → NOT react-server-components', () => {
    write('src/utils.ts', 'export const foo = 1;');
    expect(detectPatterns(TMP)).not.toContain('react-server-components');
  });

  it('no src/ dir → NOT react-server-components', () => {
    expect(detectPatterns(TMP)).not.toContain('react-server-components');
  });

  it('tailwind.config.js + tailwindcss@^3 → tailwind-v3-config', () => {
    write('tailwind.config.js', 'module.exports = {};');
    write('package.json', JSON.stringify({ devDependencies: { tailwindcss: '^3.4.0' } }));
    expect(detectPatterns(TMP)).toContain('tailwind-v3-config');
  });

  it('tailwind.config.ts + tailwindcss@^4 → NOT tailwind-v3-config', () => {
    write('tailwind.config.ts', 'export default {};');
    write('package.json', JSON.stringify({ devDependencies: { tailwindcss: '^4.0.0' } }));
    expect(detectPatterns(TMP)).not.toContain('tailwind-v3-config');
  });

  it('no tailwind.config.* → NOT tailwind-v3-config', () => {
    write('package.json', JSON.stringify({ devDependencies: { tailwindcss: '^3.4.0' } }));
    expect(detectPatterns(TMP)).not.toContain('tailwind-v3-config');
  });

  it('src/globals.css with @theme block → tailwind-v4-css-tokens', () => {
    write('src/globals.css', '@theme { --color-bg: #fff; }');
    expect(detectPatterns(TMP)).toContain('tailwind-v4-css-tokens');
  });

  it('src/globals.css without @theme → NOT tailwind-v4-css-tokens', () => {
    write('src/globals.css', '.foo { color: red; }');
    expect(detectPatterns(TMP)).not.toContain('tailwind-v4-css-tokens');
  });

  it('no src/ dir → NOT tailwind-v4-css-tokens', () => {
    expect(detectPatterns(TMP)).not.toContain('tailwind-v4-css-tokens');
  });
});

describe('computeMissing', () => {
  it('empty deps → all known packages are missing', () => {
    const result = computeMissing(new Set());
    expect(result).toEqual([...KNOWN_PACKAGES]);
  });

  it('vitest installed → vitest NOT in missing', () => {
    const result = computeMissing(new Set(['vitest', 'zod']));
    expect(result).not.toContain('vitest');
  });

  it('all known packages installed → missing is empty', () => {
    const result = computeMissing(new Set(KNOWN_PACKAGES));
    expect(result).toEqual([]);
  });

  it('only @playwright/test installed → 4 packages missing', () => {
    const result = computeMissing(new Set(['@playwright/test']));
    expect(result).not.toContain('@playwright/test');
    expect(result).toHaveLength(KNOWN_PACKAGES.length - 1);
  });

  it('unrelated packages → all known packages still missing', () => {
    const result = computeMissing(new Set(['react', 'next', 'zod']));
    expect(result).toEqual([...KNOWN_PACKAGES]);
  });
});
