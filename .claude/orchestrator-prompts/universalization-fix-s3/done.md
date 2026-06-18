# universalization-fix-s3 — DONE
- Final PR: #526
- Closed: 2026-06-14
- Summary: brownfield CI leaves rule-enforcement gates un-armed (#521). BUILD half (broadened CI-orphan WARN naming all 4 gates + paste-block) shipped #522/#525; R-phase HYBRID verdict #524 (SSOT #117); Stage P #526 added the opt-in `--wire-ci` yq auto-wirer (detect-first, idempotent `unique_by(.run)`, degrades to the paste-block when yq absent) + paired-negative test.
- Correction (2026-06-16): the shipped dedup key is `unique_by(.run // .uses // .name // .)` per #528, not `unique_by(.run)` as written above — `.run` is `null` for `uses:` steps, so `unique_by(.run)` collapsed and deleted them. Summary not rewritten (closed artifact); this is the current-state pointer.
