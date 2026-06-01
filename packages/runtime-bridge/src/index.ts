/**
 * @rules-as-tests-aif/runtime-bridge — public API
 *
 * Runtime-bridge adapter for /meta-orchestrator cross-session dispatch.
 * Phase 1: aif-handoff backend + ManualBackend fallback.
 *
 * DECISION=C invariant: this package is opt-in for consumers.
 * packages/core substrate has ZERO imports from here.
 *
 * @dual-pair: runtime-bridge-types
 */
export type { KickoffSpec, TaskHandle, TaskStatus, TaskResult } from './types.js';
export type { RuntimeBackend } from './backend.js';
export { BackendError } from './backend.js';
export { ManualBackend } from './ManualBackend.js';
export { AifHandoffBackend } from './AifHandoffBackend.js';
export type { AifHandoffConfig } from './AifHandoffBackend.js';
export { resolveBackend } from './resolver.js';
export type { BridgeMode, ResolverOptions } from './resolver.js';
export { buildKickoffSpec } from './kickoff.js';
export { checkDedup, recordDispatch, hashContent } from './idempotency.js';
