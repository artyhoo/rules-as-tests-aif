// Layer 3 Synthesizer (Path A) — public API.
// Module surface enforces Planner-Executor isolation: only `synthesize` (pure)
// and types are exposed. emit.ts is direct-path-imported by cli.ts; L4
// Validator (Phase 7+) consumes SynthesisPlan via this pure boundary.
// Stage 2 adds synthesizeLive (live menu-pick path) + MenuPickClient port.

export { synthesize } from './synthesize.ts';
export { synthesizeLive } from './menu-pick.ts';
export type {
  ManifestCheck,
  SynthesisPlan,
  SynthesizedRule,
} from './types.ts';
export type {
  Menu,
  MenuCandidate,
  MenuSelection,
  SelectedCandidate,
  MenuPickClient,
} from './menu-pick-port.ts';
