/**
 * Functional tests for the Stop hook .claude/hooks/end-of-turn-reminder.sh —
 * Track M.4.5 (paired-negative gap closure post-PR #183, per kickoff at
 * .claude/orchestrator-prompts/m4-bash-hook-tests/kickoff.md §1 row 5).
 *
 * Channel: Stop hook. JSON output contract (verified against hook source
 * .claude/hooks/end-of-turn-reminder.sh:249-259 + memory
 * project_eot_hook_redesign_approved 2026-05-22): on a trigger turn the hook
 * emits `{decision: "block", reason: <MODEL-bound recap>, systemMessage:
 * <USER-bound glance-line>}` and exits 0. Per T-M4-B the test must assert
 * PAYLOAD SHAPE, not just exit code — exit-code-only would have missed both
 * #81's broken `systemMessage`-delivery and the round-1 AskUserQuestion
 * false-suppress regression that prior cold-review caught.
 *
 * Pattern: spawnSync(bash, [HOOK], {input: JSON}) + on-disk JSONL transcript,
 * REFERENCEing the check-hook-marker.test.ts:50-64 fixture-spawn shape (no new
 * test framework, no bats dep — T-M4-A counter). Skips gracefully when `jq`
 * is unavailable on the runner.
 *
 * Paired-negative contract (kickoff §1 row 5):
 *   ❌ skip-condition NOT met but reminder skipped → fail
 *      (i.e. on a real trigger turn the hook MUST emit JSON, not exit silent)
 *   ✅ skip-condition met → exit 0 silent
 *   boundary: AskUserQuestion-only turn after prior "## 🟢" recap — must FIRE
 *      (B2 idle-suppress fix at hook:129-131; this is the regression-guard).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HOOK = resolve(REPO_ROOT, '.claude/hooks/end-of-turn-reminder.sh');

function hasJq(): boolean {
  try {
    execSync('command -v jq', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const JQ = hasJq();

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/**
 * Build a JSONL transcript file matching the format hook:21-44 parses
 * (`grep '"type":"ai-title"|"user"|"assistant"'` + jq over `.message.content`).
 * Returns the transcript_path the hook expects in its stdin.
 */
function writeTranscript(lines: Record<string, unknown>[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'm4-5-eot-'));
  tmpDirs.push(dir);
  const transcript = join(dir, 'transcript.jsonl');
  writeFileSync(transcript, lines.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf8');
  return transcript;
}

function aiTitle(title: string) {
  return { type: 'ai-title', aiTitle: title };
}

function userTurn(text: string) {
  return { type: 'user', message: { content: text } };
}

function assistantText(text: string) {
  return {
    type: 'assistant',
    message: { content: [{ type: 'text', text }] },
  };
}

function assistantTextAndToolUse(text: string, toolName: string) {
  return {
    type: 'assistant',
    message: {
      content: [
        { type: 'text', text },
        { type: 'tool_use', name: toolName, input: {} },
      ],
    },
  };
}

function assistantToolUseOnly(toolName: string) {
  return {
    type: 'assistant',
    message: { content: [{ type: 'tool_use', name: toolName, input: {} }] },
  };
}

function runHook(
  stdin: Record<string, unknown>,
  env?: Record<string, string>,
): { status: number; stdout: string; stderr: string } {
  const r = spawnSync('bash', [HOOK], {
    input: JSON.stringify(stdin),
    encoding: 'utf8',
    env: env ? { ...process.env, ...env } : process.env,
  });
  return { status: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

/** Write a fresh orchestration-mode marker file; returns its path. */
function writeMarker(): string {
  const dir = mkdtempSync(join(tmpdir(), 'm4-5-marker-'));
  tmpDirs.push(dir);
  const p = join(dir, 'orchestration-mode');
  writeFileSync(p, '');
  return p;
}

/** Build a long markdown-shaped text (>500 chars) that triggers long_text=true. */
function longMarkdownText(): string {
  // hook:93-97 requires text_length > 500 AND match of ^#|^- |^\* |\*\*|```|[..](..)
  const block = [
    '## Раздел один',
    '- пункт первый, чуть длиннее обычного',
    '- пункт второй, опять текстовый',
    '- пункт третий — добавим **акцент**',
    '',
    '## Раздел два',
    '- вложенный пункт А',
    '- вложенный пункт Б',
    '- ссылка [пример](https://example.com)',
    '',
    'обычный абзац без маркеров чтобы добить длину выше пятисот символов',
    'и ещё одна строка для верности',
  ].join('\n');
  // Pad to comfortably exceed 500.
  return block + '\n\n' + 'хвост'.repeat(40);
}

describe.skipIf(!JQ)('end-of-turn-reminder.sh — Stop hook JSON contract & paired-negative shape', () => {
  // ---------------------------------------------------------------------------
  // ❌ NEGATIVE — trigger turns: reminder MUST fire (JSON output with the full
  // {decision, reason, systemMessage} payload shape per T-M4-B).
  // ---------------------------------------------------------------------------

  it('Branch A (long markdown, no question) → emits decision:block + reason + 🎯 systemMessage', () => {
    const tr = writeTranscript([
      aiTitle('Тестовая цель сессии'),
      userTurn('первое задание'),
      assistantText(longMarkdownText() + '\n\nИтог: всё описано.'),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout, 'reminder must fire on long markdown turn (skip-condition NOT met)').not.toBe('');
    const payload = JSON.parse(r.stdout);
    expect(payload.decision).toBe('block');
    expect(typeof payload.reason).toBe('string');
    expect(payload.reason.length).toBeGreaterThan(100);
    expect(payload.systemMessage).toMatch(/^🎯 /);
    expect(payload.systemMessage).toContain('Тестовая цель сессии');
    // Branch A recommendation-laziness nudge (added 2026-05-25, follow-up to
    // defer-reflex Stage 2 REJECT) — Branch A must mirror Branch B/C fork-check
    // since defer-reflex incidents happen in long recap turns without questions.
    expect(payload.reason).toMatch(/рекомендовал|жду твоего решения|перекладывай/i);
  });

  // ── orchestration-mode (marker-gated; normal mode byte-for-byte) ──────────────
  describe('orchestration-mode — Bug A: decision-mention no longer false-fires in-mode', () => {
    it('IN-MODE — short "я выбрал Option A." (decision mention, no ?) → silent', () => {
      const tr = writeTranscript([
        aiTitle('Цель'),
        userTurn('задание'),
        assistantText('Ок, я выбрал Option A и поехал дальше.'),
      ]);
      const r = runHook(
        { transcript_path: tr, stop_hook_active: false },
        { ORCHESTRATION_MODE_MARKER: writeMarker() },
      );
      expect(r.status, `stderr: ${r.stderr}`).toBe(0);
      expect(r.stdout, 'decision-mention in-mode must NOT fire').toBe('');
    });

    it('IN-MODE — short text ending in "… A или B?" → still fires (trailing ? kept)', () => {
      const tr = writeTranscript([aiTitle('Цель'), userTurn('задание'), assistantText('Что берём — A или B?')]);
      const r = runHook(
        { transcript_path: tr, stop_hook_active: false },
        { ORCHESTRATION_MODE_MARKER: writeMarker() },
      );
      expect(r.stdout, 'real question in-mode must fire').not.toBe('');
      expect(JSON.parse(r.stdout).decision).toBe('block');
    });

    it('NORMAL-MODE — same "я выбрал Option A." STILL fires (byte-for-byte regression guard)', () => {
      const tr = writeTranscript([
        aiTitle('Цель'),
        userTurn('задание'),
        assistantText('Ок, я выбрал Option A и поехал дальше.'),
      ]);
      const r = runHook({ transcript_path: tr, stop_hook_active: false }); // no marker
      expect(r.stdout, 'normal mode must be unchanged — regex still active').not.toBe('');
    });
  });

  describe('orchestration-mode — recap (b): fires on short structured status in-mode', () => {
    // Realistic dense orchestration status: >200 (in-mode recap_min) but <500
    // (normal-mode threshold) — so it fires in-mode and stays silent normally.
    const shortStructured =
      '## Статус aif-задачи\n' +
      '- запарковал task d7585d71 на форке isParked vs retarget\n' +
      '- жду ответа оператора, нужно решение по плану egress\n' +
      '- следующий шаг — harvest после ответа, потом PR в staging\n' +
      '- риск: rework-путь не коммитит, чиним на нашей стороне';

    it('IN-MODE — short STRUCTURED status (<500, markdown) → recap fires', () => {
      const tr = writeTranscript([aiTitle('Цель'), userTurn('задание'), assistantText(shortStructured)]);
      const r = runHook(
        { transcript_path: tr, stop_hook_active: false },
        { ORCHESTRATION_MODE_MARKER: writeMarker() },
      );
      expect(r.stdout, 'short structured status in-mode must fire recap').not.toBe('');
      expect(JSON.parse(r.stdout).decision).toBe('block');
    });

    it('IN-MODE — short UNSTRUCTURED chatter "ок, удалил" → silent (markdown gate holds)', () => {
      const tr = writeTranscript([aiTitle('Цель'), userTurn('задание'), assistantText('ок, удалил')]);
      const r = runHook(
        { transcript_path: tr, stop_hook_active: false },
        { ORCHESTRATION_MODE_MARKER: writeMarker() },
      );
      expect(r.stdout, 'unstructured chatter must stay silent').toBe('');
    });

    it('NORMAL-MODE — short structured status → silent (threshold unchanged)', () => {
      const tr = writeTranscript([aiTitle('Цель'), userTurn('задание'), assistantText(shortStructured)]);
      const r = runHook({ transcript_path: tr, stop_hook_active: false }); // no marker
      expect(r.stdout, 'normal mode keeps 500-char threshold').toBe('');
    });

    it('STALE marker (mtime past TTL) → behaves as normal mode', () => {
      const tr = writeTranscript([aiTitle('Цель'), userTurn('задание'), assistantText(shortStructured)]);
      const m = writeMarker();
      execSync(
        `touch -t $(date -v-7H +%Y%m%d%H%M 2>/dev/null || date -d '7 hours ago' +%Y%m%d%H%M) "${m}"`,
      );
      const r = runHook({ transcript_path: tr, stop_hook_active: false }, { ORCHESTRATION_MODE_MARKER: m });
      expect(r.stdout, 'stale marker must not enable in-mode').toBe('');
    });
  });

  it('Branch B (short text ending in ?, no claim) → emits JSON; reason mentions fork-challenge', () => {
    const tr = writeTranscript([
      aiTitle('Цель сессии B'),
      userTurn('первое задание'),
      assistantText('Какой вариант предпочитаешь — A или B?'),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout, 'reminder must fire on bare question turn').not.toBe('');
    const payload = JSON.parse(r.stdout);
    expect(payload.decision).toBe('block');
    // Branch B reminder body must reference the fork-vs-pseudo-fork discipline,
    // not just be a generic "answer the question" nudge.
    expect(payload.reason).toMatch(/настоящая развилка|рекомендация/i);
    expect(payload.systemMessage).toMatch(/^🎯 /);
  });

  it('Branch C (long markdown AND trailing question) → emits JSON; reason includes both work-recap and question-check', () => {
    const tr = writeTranscript([
      aiTitle('Цель сессии C'),
      userTurn('первое задание'),
      assistantText(longMarkdownText() + '\n\nКакой подход предпочитаешь — X или Y?'),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout).not.toBe('');
    const payload = JSON.parse(r.stdout);
    expect(payload.decision).toBe('block');
    // Branch C marker: explicitly mentions BOTH the long-answer recap and the
    // question; hook:177-178 wording.
    expect(payload.reason).toContain('длинный ответ');
    expect(payload.reason).toContain('вопрос');
    expect(payload.systemMessage).toMatch(/^🎯 /);
  });

  // NOTE: the former "Branch D" (short turn with a factual claim → claim-only
  // re-verify) was REMOVED 2026-06-01 with the claim-scan detector itself
  // (recall ≈0.43 / precision ≈0.20-0.25, cry-wolf). A short factual-report turn
  // with no question now stays silent — see the "short turn … → exit 0 silent"
  // case below. Rationale: research-patches/2026-06-01-remove-claim-detector.md.
  it('short turn with a file:line citation but no question → exit 0 silent (claim-scan removed)', () => {
    const tr = writeTranscript([
      aiTitle('Цель сессии D'),
      userTurn('первое задание'),
      assistantText('Готово. Поправил packages/core/hooks/foo.ts:42 как просил.'),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout, 'short claim-bearing turn with no question must now stay silent').toBe('');
  });

  it('Branch B via AskUserQuestion tool_use (no text) → emits JSON; has_askuserquestion path', () => {
    // hook:35-39 detects AskUserQuestion in tool_use; hook:42 keeps the turn
    // even with empty text when has_askuserquestion=true (boundary case).
    const tr = writeTranscript([
      aiTitle('Цель сессии AUQ'),
      userTurn('первое задание'),
      assistantToolUseOnly('AskUserQuestion'),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout, 'AskUserQuestion-only turn must fire (has_askuserquestion → asked=true)').not.toBe('');
    const payload = JSON.parse(r.stdout);
    expect(payload.decision).toBe('block');
    expect(payload.systemMessage).toMatch(/^🎯 /);
  });

  // ---------------------------------------------------------------------------
  // ✅ POSITIVE — skip conditions met: hook exits 0 silent (no stdout JSON).
  // ---------------------------------------------------------------------------

  it('stop_hook_active=true → exit 0 silent (loop guard at hook:7-10)', () => {
    const tr = writeTranscript([
      aiTitle('any'),
      userTurn('x'),
      assistantText(longMarkdownText()),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: true });
    expect(r.status).toBe(0);
    expect(r.stdout, 'stop_hook_active loop guard must short-circuit before any output').toBe('');
  });

  it('missing transcript_path → exit 0 silent (hook:12-15)', () => {
    const r = runHook({ stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  it('transcript file does not exist → exit 0 silent (hook:13 "! -f" branch)', () => {
    const r = runHook({ transcript_path: '/tmp/m4-5-nonexistent-transcript.jsonl', stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  it('transcript has no assistant turn → exit 0 silent (hook:30-33)', () => {
    const tr = writeTranscript([aiTitle('cel'), userTurn('первое задание')]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  it('short turn with no question, no claim, no long markdown → exit 0 silent (hook:171-173)', () => {
    const tr = writeTranscript([
      aiTitle('cel'),
      userTurn('первое задание'),
      assistantText('готово, поправил заголовок.'),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout, 'short factual report with no fork should not fire a recap').toBe('');
  });

  // ---------------------------------------------------------------------------
  // BOUNDARY / REGRESSION GUARD — B2 idle-suppress fix (hook:128-131).
  // Round-1 cold-review of the EOT redesign caught an AskUserQuestion
  // false-suppress where the recap-after-recap idle path would eat a genuine
  // new question. Memory project_eot_hook_redesign_approved 2026-05-22 records
  // this as a fixed BLOCKER. This test pins the fix in place.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
//  BOUNDARY — already-recapped guard (hook:48-54). The current assistant turn
//  itself contains "## 🟢 Простыми словами" → re-firing would inject the recap
//  instruction over an existing recap. Complements stop_hook_active guard for
//  natural-turn proactive recaps (stop_hook_active=false). Paired-negative
//  per ~/.claude/rules/testing.md: must skip on exact marker, must NOT
//  over-suppress on look-alike marker that misses "Простыми словами".
//  ---------------------------------------------------------------------------

  it('already-recapped guard: current turn contains "## 🟢 Простыми словами" → exit 0 silent', () => {
    const tr = writeTranscript([
      aiTitle('Цель сессии'),
      userTurn('первое задание'),
      assistantText(
        '## 🟢 Простыми словами\n\nЗакрыл шаг X. Дальше — Y.\n\n' + longMarkdownText(),
      ),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(
      r.stdout,
      'already-recapped guard: long markdown turn that ALREADY contains the canonical recap marker must not re-inject reminder',
    ).toBe('');
  });

  it('already-recapped guard does NOT over-fire: "## 🟢" without "Простыми словами" → reminder still fires', () => {
    // Negative companion to the previous test. Confirms the guard matches the
    // FULL canonical marker, not just the 🟢 emoji — so a long markdown turn
    // that mentions "## 🟢 Что-то ещё" must still trigger Branch A.
    const tr = writeTranscript([
      aiTitle('Цель сессии'),
      userTurn('первое задание'),
      assistantText('## 🟢 Прогресс\n\n' + longMarkdownText()),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(
      r.stdout,
      'partial marker (🟢 without "Простыми словами") must NOT trigger the guard — Branch A must still fire',
    ).not.toBe('');
    const payload = JSON.parse(r.stdout);
    expect(payload.decision).toBe('block');
  });

  it('B2 fix: AskUserQuestion-only turn after prior "## 🟢" recap → must FIRE (not suppressed)', () => {
    // Scenario: previous assistant turn produced a recap (contains "## 🟢"),
    // current turn is AskUserQuestion-only with empty text. Without the B2
    // short-circuit at hook:128-131 the `grep -qF ""` against empty
    // current_short would match anything → idle_suppress=true → hook eats
    // the genuine new question.
    const tr = writeTranscript([
      aiTitle('Цель сессии B2'),
      userTurn('первое задание'),
      assistantText('## 🟢 Простыми словами\n\nЗакрыл предыдущий шаг. Дальше? Option A или Option B?'),
      assistantToolUseOnly('AskUserQuestion'),
    ]);
    const r = runHook({ transcript_path: tr, stop_hook_active: false });
    expect(r.status).toBe(0);
    expect(r.stdout, 'B2 regression guard: AUQ-only turn after recap must still fire').not.toBe('');
    const payload = JSON.parse(r.stdout);
    expect(payload.decision).toBe('block');
  });
});
