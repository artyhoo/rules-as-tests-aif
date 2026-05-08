// Layer 3 Synthesizer (Path A) — public API.
// Module surface enforces Planner-Executor isolation: only `synthesize` (pure)
// and types are exposed. emit.ts is direct-path-imported by cli.ts; L4
// Validator (Phase 7+) consumes SynthesisPlan via this pure boundary.

export { synthesize } from './synthesize.ts';
export type {
  ManifestCheck,
  SynthesisPlan,
  SynthesizedRule,
} from './types.ts';
