// Research Layer — re-export from @rules-as-tests/core/research (Phase 5).
// Keeps meta-factory the umbrella package; core owns the implementation.

export {
  research,
  validateResearchPlan,
  ResearchPlanError,
  type Provenance,
  type ResearchEntry,
  type ResearchPlan,
  type DriftKind,
  type DriftMismatch,
  type DriftReport,
} from '@rules-as-tests/core/research';
