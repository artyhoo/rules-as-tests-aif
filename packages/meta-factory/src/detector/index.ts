// Stack Detector — re-export from @rules-as-tests/core/detector (Phase 4).
// Keeps meta-factory the umbrella package; core owns the implementation.

export {
  detectStack,
  AifSchemaError,
  type DetectionResult,
  type DetectorOptions,
  type Stack,
  type Framework,
  type Runtime,
  type Confidence,
  type Severity,
  type ConfidenceTuple,
  type Priority,
} from '@rules-as-tests/core/detector';
