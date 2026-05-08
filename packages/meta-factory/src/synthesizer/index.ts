// Synthesizer Layer — re-export from @rules-as-tests/core/synthesizer (Phase 6).
// Keeps meta-factory the umbrella package; core owns the implementation.

export {
  synthesize,
  type ManifestCheck,
  type SynthesisPlan,
  type SynthesizedRule,
} from '@rules-as-tests/core/synthesizer';
