// Stage 2 — real Anthropic-backed MenuPickClient (install-time only).
// Uses Node 18+ native fetch; zero new npm dependencies.
// NEVER imported by tests — inject stubs from menu-pick-stubs.ts for CI.
// Set ANTHROPIC_API_KEY + ANTHROPIC_MODEL env vars before instantiating.
//
// Security note: never log the API key. Log only candidate IDs (no prompts).

import type { Menu, MenuPickClient, MenuSelection } from './menu-pick-port.ts';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

function buildUserPrompt(menu: Menu): string {
  const stackLine = `${menu.framework ?? 'software'} ${menu.version ?? ''}`.trim();
  const candidateList = menu.candidates
    .map((c) => `- id: "${c.id}"\n  summary: ${c.summary}`)
    .join('\n');
  return (
    `You are an expert ${stackLine} engineer.\n` +
    `Select which best-practice rules to apply for this project.\n\n` +
    `Available rule candidates:\n${candidateList}\n\n` +
    `Respond ONLY with a JSON object — no explanation, no markdown — of the form:\n` +
    `{"selected": [{"id": "<rule-id>"}, ...]}\n` +
    `Include only rule IDs from the list above.`
  );
}

interface AnthropicContent {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContent[];
}

export function createAnthropicMenuPickClient(
  apiKey: string = process.env['ANTHROPIC_API_KEY'] ?? '',
  model: string = process.env['ANTHROPIC_MODEL'] ?? DEFAULT_MODEL,
): MenuPickClient {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required for the Anthropic menu-pick adapter');

  return {
    async pick(menu: Menu): Promise<MenuSelection> {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: buildUserPrompt(menu) }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as AnthropicResponse;
      const text = data.content.find((c) => c.type === 'text')?.text ?? '{}';

      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch?.[1] ?? text;

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        return { selected: [] };
      }

      const selection = parsed as Record<string, unknown>;
      if (!Array.isArray(selection?.['selected'])) {
        return { selected: [] };
      }

      return { selected: (selection['selected'] as MenuSelection['selected']) };
    },
  };
}
