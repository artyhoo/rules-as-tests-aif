#!/usr/bin/env tsx
/**
 * scenario-generator CLI — thin shell-out target for the /aif-generate-scenarios skill.
 *
 * Subcommands:
 *   gate <candidate.json> [--policy-keywords <kw1,kw2,...>]
 *     Run static gate (W1/W3/W4/W5) on a candidate scenario JSON file.
 *     Exit 0 = PASS. Exit 1 = FAIL. Prints JSON result to stdout.
 *
 *   write <rule-id> <validated-scenario.json> [--store <path>]
 *     Persist a validated scenario to generated-scenarios.json.
 *     Fails (exit 1) if the scenario lacks validated:true.
 *
 * The LLM-bound parts (generation + Pass-1/Pass-2 dispatch) live in the
 * /aif-generate-scenarios skill — keeping everything here deterministic and
 * CI-testable with zero LLM dependency.
 */

import * as fs from 'node:fs';
import { dispatchIsolatedBaseline } from './dispatch-baseline.js';
import { extractPolicyKeywords, runStaticGate } from './static-gate.js';
import { resolveStorePath, writeScenario } from './store.js';
import type { GeneratedScenario, PressureScenario } from './types.js';

const LOG_PREFIX = '[psg/cli]';
const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'INFO';

function logDebug(msg: string): void {
  if (LOG_LEVEL === 'DEBUG') process.stderr.write(`DEBUG ${LOG_PREFIX} ${msg}\n`);
}
function logError(msg: string): void {
  process.stderr.write(`ERROR ${LOG_PREFIX} ${msg}\n`);
}

function usage(): void {
  process.stderr.write([
    'Usage:',
    '  tsx cli.ts gate <candidate.json> [--policy-keywords <kw1,kw2,...>]',
    '  tsx cli.ts write <rule-id> <validated-scenario.json> [--store <path>]',
    '  tsx cli.ts dispatch <prompt-file>',
    '',
    'Options:',
    '  --policy-keywords  Comma-separated keywords from rule policy text (for W4 check)',
    '  --store            Path to generated-scenarios.json (default: auto-discover)',
    '',
  ].join('\n'));
}

// ── arg parsing helpers ───────────────────────────────────────────────────────

function parseArgs(argv: string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a !== undefined && a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] ?? '';
      flags[key] = val;
      i += 2;
    } else {
      if (a !== undefined) positional.push(a);
      i++;
    }
  }
  return { positional, flags };
}

function readJsonFile<T>(filePath: string, label: string): T {
  if (!fs.existsSync(filePath)) {
    logError(`${label} not found: ${filePath}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch (e) {
    logError(`${label} is not valid JSON: ${String(e)}`);
    process.exit(1);
  }
}

// ── subcommand: gate ──────────────────────────────────────────────────────────

function cmdGate(positional: string[], flags: Record<string, string>): void {
  const candidatePath = positional[0];
  if (!candidatePath) {
    logError('gate requires <candidate.json> argument');
    usage();
    process.exit(1);
  }

  logDebug(`gate: reading candidate from ${candidatePath}`);
  const candidate = readJsonFile<PressureScenario>(candidatePath, 'candidate.json');

  const keywordsRaw = flags['policy-keywords'] ?? '';
  const policyKeywords = keywordsRaw
    ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean)
    : [];

  logDebug(`gate: ${policyKeywords.length} policy keywords provided`);

  const result = runStaticGate(candidate, policyKeywords);

  // Print result as JSON to stdout
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');

  if (!result.pass) {
    logDebug(`gate FAIL: ${result.failures.map(f => f.tag).join(', ')}`);
    process.exit(1);
  }

  logDebug('gate PASS');
  process.exit(0);
}

// ── subcommand: gate-text ─────────────────────────────────────────────────────
// Accepts policy text as a flag and extracts keywords automatically

function cmdGateText(positional: string[], flags: Record<string, string>): void {
  const candidatePath = positional[0];
  if (!candidatePath) {
    logError('gate-text requires <candidate.json> argument');
    usage();
    process.exit(1);
  }

  logDebug(`gate-text: reading candidate from ${candidatePath}`);
  const candidate = readJsonFile<PressureScenario>(candidatePath, 'candidate.json');

  const policyText = flags['policy-text'] ?? '';
  const policyKeywords = policyText ? extractPolicyKeywords(policyText) : [];

  logDebug(`gate-text: extracted ${policyKeywords.length} keywords from policy text`);

  const result = runStaticGate(candidate, policyKeywords);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');

  process.exit(result.pass ? 0 : 1);
}

// ── subcommand: write ─────────────────────────────────────────────────────────

function cmdWrite(positional: string[], flags: Record<string, string>): void {
  const ruleId = positional[0];
  const scenarioPath = positional[1];

  if (!ruleId || !scenarioPath) {
    logError('write requires <rule-id> <validated-scenario.json> arguments');
    usage();
    process.exit(1);
  }

  logDebug(`write: rule=${ruleId} scenarioPath=${scenarioPath}`);
  const scenario = readJsonFile<GeneratedScenario>(scenarioPath, 'validated-scenario.json');

  const storePath = flags['store'] ?? resolveStorePath();
  logDebug(`write: storePath=${storePath}`);

  try {
    writeScenario(storePath, ruleId, scenario);
    process.stdout.write(JSON.stringify({ ok: true, ruleId, storePath }) + '\n');
    process.exit(0);
  } catch (e) {
    logError(String(e));
    process.stdout.write(JSON.stringify({ ok: false, error: String(e) }) + '\n');
    process.exit(1);
  }
}

// ── subcommand: dispatch ──────────────────────────────────────────────────────
// Safe isolated baseline dispatch — reads prompt from a file so that backticks,
// $(), $VAR, and literal " in the prompt content cannot cause shell injection.
// Routes through dispatchIsolatedBaseline which uses spawnSync with an argv array.

async function cmdDispatch(positional: string[], _flags: Record<string, string>): Promise<void> {
  const promptFile = positional[0];
  if (!promptFile) {
    logError('dispatch requires <prompt-file> argument');
    usage();
    process.exit(1);
  }
  if (!fs.existsSync(promptFile)) {
    logError(`prompt file not found: ${promptFile}`);
    process.exit(1);
  }
  const prompt = fs.readFileSync(promptFile, 'utf8');
  logDebug(`dispatch: promptFile=${promptFile} promptLength=${prompt.length}`);
  try {
    const result = await dispatchIsolatedBaseline(prompt);
    process.stdout.write(result.output);
    process.exit(result.exitCode);
  } catch (e) {
    logError(String(e));
    process.exit(1);
  }
}

// ── subcommand: extract-keywords ─────────────────────────────────────────────

function cmdExtractKeywords(positional: string[], _flags: Record<string, string>): void {
  const policyText = positional[0] ?? '';
  if (!policyText) {
    logError('extract-keywords requires <policy-text> argument');
    process.exit(1);
  }
  const keywords = extractPolicyKeywords(policyText);
  process.stdout.write(JSON.stringify(keywords) + '\n');
  process.exit(0);
}

// ── main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const { positional, flags } = parseArgs(args);
const subcommand = positional[0];
const rest = positional.slice(1);

logDebug(`subcommand=${subcommand ?? '(none)'} args=${JSON.stringify(args)}`);

switch (subcommand) {
  case 'gate':
    cmdGate(rest, flags);
    break;
  case 'gate-text':
    cmdGateText(rest, flags);
    break;
  case 'write':
    cmdWrite(rest, flags);
    break;
  case 'dispatch':
    void cmdDispatch(rest, flags);
    break;
  case 'extract-keywords':
    cmdExtractKeywords(rest, flags);
    break;
  default:
    logError(`unknown subcommand: ${subcommand ?? '(none)'}`);
    usage();
    process.exit(1);
}
