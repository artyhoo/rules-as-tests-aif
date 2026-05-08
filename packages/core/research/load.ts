// Curated research store loader: deterministic, semver-aware.
// Layout: store/<framework>/<major>.x/<patternId>.json + store/shared/<patternId>.json
// Resolution priority:
//   1. store/<framework>/<major>.x/<patternId>.json   — exact major
//   2. store/<framework>/<major-1>.x/<patternId>.json — single-major fallback
//   3. store/shared/<patternId>.json                  — version-agnostic
// Each loaded entry is validated against research-plan.schema.json#/definitions/ResearchEntry.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';
import semver from 'semver';
import { validateProvenance } from './allowlist.ts';
import type { ResearchEntry } from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const STORE_ROOT = resolve(HERE, 'store');
const SCHEMA_PATH = resolve(HERE, 'research-plan.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
const schemaDoc = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
ajv.addSchema(schemaDoc, 'research-plan');
const validateEntry = ajv.compile({
  $ref: 'research-plan#/definitions/ResearchEntry',
});

export class ResearchEntryError extends Error {
  constructor(
    public readonly path: string,
    public readonly errors: string,
  ) {
    super(`Invalid research entry at ${path}: ${errors}`);
    this.name = 'ResearchEntryError';
  }
}

function tryLoad(filePath: string): ResearchEntry | null {
  if (!existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!validateEntry(raw)) {
    throw new ResearchEntryError(
      filePath,
      ajv.errorsText(validateEntry.errors),
    );
  }
  const entry = raw as ResearchEntry;
  for (const p of entry.provenance) {
    const v = validateProvenance(p);
    if (!v.ok) {
      throw new ResearchEntryError(filePath, `provenance violation — ${v.reason}`);
    }
  }
  return entry;
}

function candidatePaths(
  framework: string | null,
  version: string | null,
  patternId: string,
): string[] {
  const paths: string[] = [];
  if (framework) {
    const coerced = version ? semver.coerce(version) : null;
    const major = coerced?.major ?? null;
    if (major !== null) {
      paths.push(resolve(STORE_ROOT, framework, `${major}.x`, `${patternId}.json`));
      if (major > 0) {
        paths.push(
          resolve(STORE_ROOT, framework, `${major - 1}.x`, `${patternId}.json`),
        );
      }
    }
  }
  paths.push(resolve(STORE_ROOT, 'shared', `${patternId}.json`));
  return paths;
}

export function loadEntries(
  framework: string | null,
  version: string | null,
  patterns: string[],
): ResearchEntry[] {
  const out: ResearchEntry[] = [];
  for (const id of patterns) {
    for (const path of candidatePaths(framework, version, id)) {
      const entry = tryLoad(path);
      if (entry) {
        out.push(entry);
        break;
      }
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
