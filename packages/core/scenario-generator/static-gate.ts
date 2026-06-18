/**
 * Static reject-gate for generated pressure-scenarios (§4 validation, step 2).
 *
 * Pure deterministic functions — zero LLM, CI-testable. Run BEFORE Pass-1 RED
 * dispatch to reject structurally weak scenarios early.
 *
 * Gates:
 *   W1 — pressure vector count ≥ 2 (single-vector → reject)
 *   W3 — observable-failure is a concrete grep-able string/pattern, not prose
 *   W4 — baseline-prompt contains NO keyword from the rule's policy text
 *   W5 — observable-failure covers equivalence class (not just a single literal
 *        where the policy implies a broader class)
 *
 * Returns { pass, failures } — never throws on a bad scenario (failures are data).
 */

import type { PressureScenario } from './types.js';

const LOG_PREFIX = '[psg/static-gate]';
const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'INFO';

function logDebug(msg: string): void {
  if (LOG_LEVEL === 'DEBUG') process.stderr.write(`DEBUG ${LOG_PREFIX} ${msg}\n`);
}
function logInfo(msg: string): void {
  if (LOG_LEVEL === 'DEBUG' || LOG_LEVEL === 'INFO') process.stderr.write(`INFO  ${LOG_PREFIX} ${msg}\n`);
}

// ── Gate failure shape ────────────────────────────────────────────────────────

export type WTag = 'W1' | 'W3' | 'W4' | 'W5';

export interface GateFailure {
  tag: WTag;
  reason: string;
  /** The matched/missed token or value that caused the failure. */
  evidence?: string;
  /** If true, this failure is advisory only and does not block pass. W5 is advisory. */
  advisory?: boolean;
}

export interface GateResult {
  pass: boolean;
  failures: GateFailure[];
}

// ── Prose-only markers for W3 ─────────────────────────────────────────────────

/**
 * Phrases that indicate a prose description rather than a grep-able marker.
 * A failure like "doesn't follow the naming convention" is not inspectable.
 */
const PROSE_ONLY_PHRASES = [
  "doesn't follow",
  'does not follow',
  "doesn't comply",
  'does not comply',
  "doesn't use",
  'does not use',
  'should have',
  'should not',
  'must not contain',
  'fails to',
  'missing',
];

/**
 * Patterns that strongly suggest a grep-able concrete marker is present.
 * At least one of these must appear (or the field must contain a specific
 * code pattern / file path / regex).
 */
const GREPPABLE_SIGNALS = [
  /`[^`]+`/,          // backtick-quoted code snippet
  /\w+\.\w+\(/,       // function call pattern like console.log(
  /import\s+/,        // import statement
  /\*Service/,        // common naming pattern
  /\*Repository/,
  /from\s+['"][^'"]+['"]/,  // import from path
  /[a-z_]+\.[a-z_]+/i,     // property or method reference
  /\/[a-z]/i,              // file path
  /[A-Z][a-zA-Z]+Error/,   // error class name
  /ANTHROPIC_API_KEY/,
  /console\.(log|error|debug|warn)/,
  /process\.env/,
];

// ── W5 class-expansion hints ──────────────────────────────────────────────────

/**
 * Known patterns where a single literal implies a broader equivalence class.
 * If the policy text implies a class but observable-failure is a single literal,
 * flag it so the generator can strengthen to the class.
 */
const CLASS_EXPANSION_HINTS: Array<{ literal: RegExp; classHint: string }> = [
  { literal: /console\.log\(/, classHint: 'console.* (log|error|debug|warn) all prohibited' },
  { literal: /\*Service$/, classHint: '*Service/*Repository class naming class' },
  { literal: /fetch\(/, classHint: 'any bare fetch/axios without wrapper' },
  { literal: /ANTHROPIC_API_KEY/, classHint: 'any LLM API key in CI env' },
];

// ── Gate functions ─────────────────────────────────────────────────────────────

/**
 * W1: Pressure vector count must be ≥ 2.
 * Single-vector pressure reliably fails to elicit the violation (R-phase §3 W1).
 */
function checkW1(scenario: PressureScenario): GateFailure | null {
  const count = scenario.pressure.length;
  logDebug(`W1 pressure count=${count}`);
  if (count < 2) {
    return {
      tag: 'W1',
      reason: `Pressure vector count is ${count} (minimum 2 required). Single-vector pressure is insufficient — a modern LLM under time-only pressure still reaches for the correct pattern. Add ≥1 social vector (authority, sunk-cost).`,
      evidence: scenario.pressure.join(', '),
    };
  }
  logDebug('W1 PASS');
  return null;
}

/**
 * W3: observable-failure must be a concrete grep-able string/pattern, not prose.
 * "doesn't follow the naming convention" is not inspectable — reject.
 */
function checkW3(scenario: PressureScenario): GateFailure | null {
  const of = scenario['observable-failure'];
  const lc = of.toLowerCase();

  // Check for prose-only phrases
  for (const phrase of PROSE_ONLY_PHRASES) {
    if (lc.includes(phrase)) {
      logDebug(`W3 FAIL: prose phrase "${phrase}"`);
      return {
        tag: 'W3',
        reason: `observable-failure contains prose-only language ("${phrase}") that is not mechanically inspectable. Replace with a concrete grep-able marker (e.g. a code snippet, function call, import statement).`,
        evidence: phrase,
      };
    }
  }

  // Must have at least one greppable signal
  const hasSignal = GREPPABLE_SIGNALS.some(re => re.test(of));
  if (!hasSignal) {
    logDebug('W3 FAIL: no grep-able signal found');
    return {
      tag: 'W3',
      reason: `observable-failure has no concrete grep-able marker (no code snippet, function call, import, or file path pattern). Add a specific syntactic marker that can be found in agent output.`,
      evidence: of.slice(0, 100),
    };
  }

  logDebug('W3 PASS');
  return null;
}

/**
 * W4: baseline-prompt must NOT contain any keyword from the rule's policy text.
 * If it does, the agent may infer the rule from the prompt itself — bypassing isolation.
 */
function checkW4(scenario: PressureScenario, policyKeywords: string[]): GateFailure | null {
  const baselineLc = scenario['baseline-prompt'].toLowerCase();
  for (const kw of policyKeywords) {
    if (!kw.trim()) continue;
    const kwLc = kw.toLowerCase().trim();
    if (kwLc.length < 4) continue; // ignore tokens shorter than 4 chars
    if (baselineLc.includes(kwLc)) {
      logDebug(`W4 FAIL: keyword "${kw}" found in baseline-prompt`);
      return {
        tag: 'W4',
        reason: `baseline-prompt contains policy keyword "${kw}", which may hint the agent toward the rule even without it loaded. Remove all policy-derived keywords from the baseline prompt.`,
        evidence: kw,
      };
    }
  }
  logDebug(`W4 PASS (checked ${policyKeywords.length} keywords)`);
  return null;
}

/**
 * W5: observable-failure should cover the equivalence class the rule prohibits,
 * not just a single literal when the policy implies a broader class.
 * This is advisory (warns rather than hard-rejects) for cases where a class hint exists.
 */
function checkW5(scenario: PressureScenario): GateFailure | null {
  const of = scenario['observable-failure'];
  for (const hint of CLASS_EXPANSION_HINTS) {
    if (hint.literal.test(of)) {
      // Single literal found — check if the observable already covers the class
      // (e.g. mentions the broader pattern or uses a wildcard)
      const hasClassCoverage = of.includes('.*') || of.includes('|') || of.includes('any ') || of.includes('all ');
      if (!hasClassCoverage) {
        logDebug(`W5 WARN: single literal detected, class may be broader: ${hint.classHint}`);
        return {
          tag: 'W5',
          advisory: true, // W5 is advisory — doesn't block pass; expand when possible
          reason: `observable-failure uses a single literal pattern that may under-represent the class the rule prohibits (${hint.classHint}). Consider expanding to cover the full equivalence class so variant violations are caught.`,
          evidence: hint.classHint,
        };
      }
    }
  }
  logDebug('W5 PASS');
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run all static gate checks (W1, W3, W4, W5) on a candidate scenario.
 *
 * @param scenario - The candidate pressure-scenario to validate.
 * @param policyKeywords - Keywords extracted from the rule's policy text (used for W4).
 * @returns { pass: boolean; failures: GateFailure[] }
 */
export function runStaticGate(
  scenario: PressureScenario,
  policyKeywords: string[],
): GateResult {
  const failures: GateFailure[] = [];

  const w1 = checkW1(scenario);
  if (w1) { failures.push(w1); logDebug(`W1 failure recorded`); }

  const w3 = checkW3(scenario);
  if (w3) { failures.push(w3); logDebug(`W3 failure recorded`); }

  const w4 = checkW4(scenario, policyKeywords);
  if (w4) { failures.push(w4); logDebug(`W4 failure recorded`); }

  const w5 = checkW5(scenario);
  if (w5) { failures.push(w5); logDebug(`W5 failure recorded`); }

  // W5 is advisory — it appears in failures but doesn't block pass
  const blockingFailures = failures.filter(f => !f.advisory);
  const pass = blockingFailures.length === 0;
  const failTags = blockingFailures.map(f => f.tag);
  const advisoryTags = failures.filter(f => f.advisory).map(f => f.tag);
  logInfo(
    `gate result: ${pass ? 'PASS' : `FAIL (${failTags.join(', ')})`}` +
      (advisoryTags.length > 0 ? ` [advisory: ${advisoryTags.join(', ')}]` : ''),
  );

  return { pass, failures };
}

/**
 * Extract policy keywords from a policy text string.
 * Strips markdown, common stop-words, and short tokens.
 * Used by W4 to check baseline-prompt for policy-derived hints.
 */
export function extractPolicyKeywords(policyText: string): string[] {
  const STOP_WORDS = new Set([
    'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'a', 'an',
    'is', 'are', 'was', 'be', 'will', 'must', 'should', 'may', 'can',
    'not', 'no', 'any', 'all', 'this', 'that', 'with', 'from', 'by',
    'as', 'if', 'when', 'than', 'but', 'via', 'per',
  ]);

  return policyText
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/`[^`]+`/g, m => m.replace(/`/g, '').trim()) // keep backtick content
    .replace(/[#*>\[\]()_]/g, ' ') // strip markdown punctuation
    .split(/[\s,;:.!?()[\]{}'"]+/)
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length >= 4 && !STOP_WORDS.has(t));
}
