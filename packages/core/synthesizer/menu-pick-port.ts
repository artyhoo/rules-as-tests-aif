// Stage 2 — injectable LLM port for the live menu-pick path (Path A).
// The LLM's role: given a Menu of candidate rule IDs, select which ones
// to include and (optionally) provide per-rule ESLint config overrides.
// Our code composes the SynthesisPlan from the selection — the LLM never
// authors TypeScript or invents rules outside the menu.
//
// In CI, inject stubPickAll / stubPickBad from menu-pick-stubs.ts.
// At install-time, inject the Anthropic adapter from menu-pick-adapter-anthropic.ts.

export interface MenuCandidate {
  id: string;
  summary: string;
  bestPractices: string[];
  antiPatterns: string[];
}

export interface Menu {
  framework: string | null;
  version: string | null;
  candidates: MenuCandidate[];
}

export interface SelectedCandidate {
  id: string;
  eslintConfigOverride?: Record<string, unknown>;
}

export interface MenuSelection {
  selected: SelectedCandidate[];
}

export interface MenuPickClient {
  pick(menu: Menu): Promise<MenuSelection>;
}
