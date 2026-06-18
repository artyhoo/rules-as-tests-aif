/**
 * Scenario store — read/merge/write .ai-factory/generated-scenarios.json
 *
 * §6.3 NON-NEGOTIABLE reject-gate at the storage boundary:
 * writeScenario() REFUSES to persist any scenario lacking validated:true.
 * This is defence-in-depth — even if a caller bypasses the validation loop,
 * the store will never silently accept an unvalidated scenario.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GeneratedScenario, GeneratedScenariosFile } from './types.js';

const LOG_PREFIX = '[psg/store]';
const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'INFO';

function logDebug(msg: string): void {
  if (LOG_LEVEL === 'DEBUG') process.stderr.write(`DEBUG ${LOG_PREFIX} ${msg}\n`);
}
function logInfo(msg: string): void {
  if (LOG_LEVEL === 'DEBUG' || LOG_LEVEL === 'INFO') process.stderr.write(`INFO  ${LOG_PREFIX} ${msg}\n`);
}
function logWarn(msg: string): void {
  process.stderr.write(`WARN  ${LOG_PREFIX} ${msg}\n`);
}
function logError(msg: string): void {
  process.stderr.write(`ERROR ${LOG_PREFIX} ${msg}\n`);
}

// ── File path resolution ──────────────────────────────────────────────────────

const DEFAULT_RELATIVE_PATH = '.ai-factory/generated-scenarios.json';

/**
 * Resolve the path to generated-scenarios.json.
 * Searches upward from CWD for the .ai-factory/ directory (same pattern as
 * how Claude Code discovers CLAUDE.md).
 */
export function resolveStorePath(overridePath?: string): string {
  if (overridePath) {
    logDebug(`using override path: ${overridePath}`);
    return overridePath;
  }

  // Walk up from cwd looking for .ai-factory/
  let dir = process.cwd();
  const root = path.parse(dir).root;
  while (dir !== root) {
    const candidate = path.join(dir, DEFAULT_RELATIVE_PATH);
    if (fs.existsSync(path.join(dir, '.ai-factory'))) {
      logDebug(`resolved store path: ${candidate}`);
      return candidate;
    }
    dir = path.dirname(dir);
  }

  // Fallback: create at cwd/.ai-factory/
  const fallback = path.join(process.cwd(), DEFAULT_RELATIVE_PATH);
  logDebug(`fallback store path: ${fallback}`);
  return fallback;
}

// ── Empty file shape ──────────────────────────────────────────────────────────

function emptyFile(): GeneratedScenariosFile {
  return { version: 1, scenarios: {} };
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Read generated-scenarios.json from disk.
 * Returns an empty file structure if the file doesn't exist.
 * Throws if the file exists but is malformed (corrupt JSON or wrong version).
 */
export function readStore(storePath: string): GeneratedScenariosFile {
  if (!fs.existsSync(storePath)) {
    logInfo(`store not found at ${storePath} — starting empty`);
    return emptyFile();
  }

  logDebug(`reading store from ${storePath}`);
  const raw = fs.readFileSync(storePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${LOG_PREFIX} Corrupt JSON at ${storePath}: ${String(e)}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`${LOG_PREFIX} Store at ${storePath} is not an object`);
  }
  const file = parsed as Record<string, unknown>;

  if (file['version'] !== 1) {
    throw new Error(`${LOG_PREFIX} Unknown store version ${String(file['version'])} at ${storePath}`);
  }
  if (typeof file['scenarios'] !== 'object' || file['scenarios'] === null) {
    throw new Error(`${LOG_PREFIX} Store at ${storePath} has invalid scenarios field`);
  }

  const scenarios = file['scenarios'] as Record<string, unknown>;
  const count = Object.keys(scenarios).length;
  logInfo(`read store: ${count} scenario(s) from ${storePath}`);
  return { version: 1, scenarios: scenarios as Record<string, GeneratedScenario> };
}

// ── Write (single scenario) ───────────────────────────────────────────────────

/**
 * Persist a single validated scenario for the given rule-id.
 *
 * REJECTS (throws) if scenario.validated is not strictly true.
 * Merges by rule-id: re-generation overwrites that key, others are preserved.
 * WARNS on overwrite of an existing rule-id (expected on re-generation).
 */
export function writeScenario(
  storePath: string,
  ruleId: string,
  scenario: GeneratedScenario,
): void {
  // §6.3 NON-NEGOTIABLE storage-boundary gate
  if (scenario.validated !== true) {
    const msg = `Attempted to write unvalidated scenario for rule ${ruleId} — missing validated:true. ` +
      `The static gate or Pass-1 RED must have passed before persisting. Aborting.`;
    logError(msg);
    throw new Error(`${LOG_PREFIX} ${msg}`);
  }

  if (scenario.verdict !== 'LIVE') {
    const msg = `Attempted to write scenario for rule ${ruleId} with verdict="${scenario.verdict}" (only LIVE scenarios are persisted).`;
    logError(msg);
    throw new Error(`${LOG_PREFIX} ${msg}`);
  }

  // Ensure parent directory exists
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    logDebug(`creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }

  // Read current state and merge
  const current = readStore(storePath);
  const existingKeys = Object.keys(current.scenarios).length;

  if (current.scenarios[ruleId] !== undefined) {
    logWarn(`overwriting existing scenario for rule ${ruleId}`);
  }

  current.scenarios[ruleId] = scenario;

  const newKeys = Object.keys(current.scenarios).length;
  logDebug(`merging: ${existingKeys} existing + 1 new = ${newKeys} total`);

  // Write atomically (write to temp, rename)
  const tmpPath = `${storePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(current, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpPath, storePath);

  logInfo(`wrote scenario for rule ${ruleId} to ${storePath} (total: ${newKeys})`);
}

// ── Read single scenario ──────────────────────────────────────────────────────

/**
 * Read a single scenario by rule-id. Returns undefined if not found.
 */
export function readScenario(
  storePath: string,
  ruleId: string,
): GeneratedScenario | undefined {
  const store = readStore(storePath);
  const scenario = store.scenarios[ruleId];
  if (scenario === undefined) {
    logDebug(`no scenario found for rule ${ruleId} in ${storePath}`);
  } else {
    logDebug(`found scenario for rule ${ruleId}`);
  }
  return scenario;
}

// ── List rule-ids ─────────────────────────────────────────────────────────────

/**
 * List all rule-ids that have generated scenarios in the store.
 */
export function listRuleIds(storePath: string): string[] {
  const store = readStore(storePath);
  return Object.keys(store.scenarios);
}
