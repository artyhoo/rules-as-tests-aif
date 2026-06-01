// @ts-nocheck
// Priority 1-3: AIF artifact readers — DESCRIPTION.md, ARCHITECTURE.md, skill-context/*/SKILL.md.
// Per phase-4-research §3.1 + §4.1: hybrid REUSE — read AIF artifacts as primary source.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { DetectionResult, Stack, Framework } from './types.ts';
import { toConfidence, type Priority } from './confidence.ts';
import { extractMajor, extractVersion } from './version-aware.ts';

interface AifSignals {
  framework: Framework;
  stack: Stack;
}

// Schema validation: AIF markdown headings/keywords.
// Mandatory per phase-4-research §5 + §6 — bidirectional break risk.
const FRAMEWORK_PATTERNS: Array<{ name: string; re: RegExp; stack: Stack }> = [
  { name: 'next', re: /\b(next\.js|nextjs|next js)\b/i, stack: 'react-next' },
  { name: 'react', re: /\breact\b/i, stack: 'react-next' },
];

// e.g. "Next.js 16", "Next 16.0.1", "React 19", "next@16".
const VERSION_RE = /\b(?:next\.js|nextjs|next js|next|react)[\s@v]*([0-9]+(?:\.[0-9]+){0,2})\b/i;

function parseAifMarkdown(content: string): AifSignals | null {
  // Hard constraint (phase-4-research §5/§6): schema-mandatory check.
  // Recognized AIF artifacts MUST contain at least one canonical heading marker.
  const hasCanonicalHeading = /^#\s+(Description|Architecture|Stack|Project)/im.test(content)
    || /^##?\s+(Stack|Tech\s*Stack|Framework|Runtime|Technology)/im.test(content);
  if (!hasCanonicalHeading) return null;

  const versionMatch = content.match(VERSION_RE);
  const versionRaw = versionMatch ? versionMatch[1] : null;

  for (const { name, re, stack } of FRAMEWORK_PATTERNS) {
    if (re.test(content)) {
      return {
        stack,
        framework: {
          name,
          version: extractVersion(versionRaw),
          major: extractMajor(versionRaw),
        },
      };
    }
  }

  // Heading present but no recognized framework → ts-server default.
  return {
    stack: 'ts-server',
    framework: { name: null, version: null, major: null },
  };
}

function tryReadFile(absPath: string): string | null {
  if (!existsSync(absPath)) return null;
  try {
    return readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

function listSkillContextFiles(projectRoot: string): string[] {
  const dir = resolve(projectRoot, '.ai-factory/skill-context');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const skillMd = join(dir, entry, 'SKILL.md');
    if (existsSync(skillMd)) out.push(skillMd);
  }
  return out;
}

function emit(
  signals: AifSignals,
  source: string,
  priority: Priority,
): DetectionResult {
  const tuple = toConfidence(priority);
  return {
    stack: signals.stack,
    framework: signals.framework,
    runtime: { name: 'node', major: null },
    ...tuple,
    source,
    rules: { applicable: [], skipped: [] },
  };
}

export class AifSchemaError extends Error {
  constructor(filePath: string, reason: string) {
    super(`AIF schema validation failed for ${filePath}: ${reason}`);
    this.name = 'AifSchemaError';
  }
}

export function readAif(projectRoot: string): DetectionResult | null {
  // Priority 1
  const descPath = resolve(projectRoot, '.ai-factory/DESCRIPTION.md');
  const desc = tryReadFile(descPath);
  if (desc !== null) {
    const signals = parseAifMarkdown(desc);
    if (signals === null) {
      throw new AifSchemaError(
        '.ai-factory/DESCRIPTION.md',
        'no canonical heading (# Description / ## Stack / etc.) found',
      );
    }
    return emit(signals, '.ai-factory/DESCRIPTION.md', 1);
  }

  // Priority 2
  const archPath = resolve(projectRoot, '.ai-factory/ARCHITECTURE.md');
  const arch = tryReadFile(archPath);
  if (arch !== null) {
    const signals = parseAifMarkdown(arch);
    if (signals === null) {
      throw new AifSchemaError(
        '.ai-factory/ARCHITECTURE.md',
        'no canonical heading (# Architecture / ## Stack / etc.) found',
      );
    }
    return emit(signals, '.ai-factory/ARCHITECTURE.md', 2);
  }

  // Priority 3 — skill-context overrides (read first match alphabetically).
  const skillFiles = listSkillContextFiles(projectRoot).sort();
  for (const file of skillFiles) {
    const content = tryReadFile(file);
    if (content === null) continue;
    const signals = parseAifMarkdown(content);
    if (signals === null) {
      throw new AifSchemaError(file, 'no canonical heading found');
    }
    const rel = file.slice(projectRoot.length + 1);
    return emit(signals, rel, 3);
  }

  return null;
}
