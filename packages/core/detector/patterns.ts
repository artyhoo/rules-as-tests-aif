/**
 * Detected stack patterns (Next-only initial; ts-server patterns Phase 5+).
 * Each pattern is a pure observable check — no interpretation.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractMajor } from './version-aware.ts';

export const KNOWN_PATTERNS = [
  'nextjs-app-router',      // app/ dir present
  'nextjs-pages-router',    // pages/ dir present (next.js < 13 or hybrid)
  'react-server-components', // 'use server' or 'use client' directives in src/**
  'tailwind-v3-config',     // tailwind.config.{js,ts} present + version <4
  'tailwind-v4-css-tokens', // @theme token blocks in CSS
] as const;

export type KnownPattern = (typeof KNOWN_PATTERNS)[number];

function hasServerDirectives(projectRoot: string): boolean {
  const srcDir = join(projectRoot, 'src');
  if (!existsSync(srcDir)) return false;
  try {
    const entries = readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const content = readFileSync(join(srcDir, entry.name), 'utf8');
      if (
        content.includes("'use server'") ||
        content.includes('"use server"') ||
        content.includes("'use client'") ||
        content.includes('"use client"')
      ) {
        return true;
      }
    }
  } catch {
    // best-effort
  }
  return false;
}

function isTailwindV3Config(projectRoot: string): boolean {
  const configFiles = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'];
  if (!configFiles.some((f) => existsSync(join(projectRoot, f)))) return false;
  const pkgPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    const range = allDeps['tailwindcss'];
    if (!range) return false;
    const major = extractMajor(range);
    return major !== null && major < 4;
  } catch {
    return false;
  }
}

function hasTailwindV4Tokens(projectRoot: string): boolean {
  const srcDir = join(projectRoot, 'src');
  if (!existsSync(srcDir)) return false;
  try {
    const entries = readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.css')) continue;
      const content = readFileSync(join(srcDir, entry.name), 'utf8');
      if (content.includes('@theme')) return true;
    }
  } catch {
    // best-effort
  }
  return false;
}

export function detectPatterns(projectRoot: string): string[] {
  const detected: string[] = [];

  if (existsSync(join(projectRoot, 'app')) || existsSync(join(projectRoot, 'src', 'app'))) {
    detected.push('nextjs-app-router');
  }

  if (existsSync(join(projectRoot, 'pages')) || existsSync(join(projectRoot, 'src', 'pages'))) {
    detected.push('nextjs-pages-router');
  }

  if (hasServerDirectives(projectRoot)) {
    detected.push('react-server-components');
  }

  if (isTailwindV3Config(projectRoot)) {
    detected.push('tailwind-v3-config');
  }

  if (hasTailwindV4Tokens(projectRoot)) {
    detected.push('tailwind-v4-css-tokens');
  }

  return detected;
}
