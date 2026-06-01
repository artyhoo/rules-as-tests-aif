# AIF GATE-RESULT-CONTRACT.md — schema snapshot

> Snapshotted from `/lee-to/ai-factory` @ 2026-05-09 via context7. Re-fetch on Phase 11+ entry research per `prior-art-evaluations.md` §5 staleness policy.
> Pinned for hand-rolled validator at [`aif-gate-result-schema.ts`](aif-gate-result-schema.ts) per Phase 9 A9 closure.

## Schema fields

| Field | Type / values | Required | Notes |
|---|---|---|---|
| `schema_version` | `1` (literal) | yes | Version pinned at 1 since Phase 8.8 SSOT bootstrap |
| `gate` | `"verify" \| "review" \| "security" \| "rules"` | yes | Discriminated by AIF sub-agent |
| `status` | `"pass" \| "warn" \| "fail"` | yes | Outcome status |
| `blocking` | `boolean` | yes | `true` only when `status === "fail"` with non-empty blockers |
| `blockers` | `Blocker[]` | yes | See Blocker shape below |
| `affected_files` | `string[]` | yes | Repo-relative paths |
| `suggested_next` | `SuggestedNext` | yes | Recommendation hint |

## Blocker shape

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Stable finding id, e.g. `<gate>-<ruleId>` |
| `severity` | `"error" \| "warning"` | yes | |
| `file` | `string \| null` | yes | Repo-relative path or `null` if non-file-bound |
| `summary` | `string` | yes | Short human-readable reason |

## SuggestedNext shape

| Field | Type | Required | Notes |
|---|---|---|---|
| `command` | `string \| null` | yes | From allowlist: `/aif-fix`, `/aif-rules`, `/aif-architecture`, `/aif-roadmap`, `/aif-commit`, or `null` |
| `reason` | `string \| null` | yes | One-line rationale or `null` |

## Re-fetch trigger

When Phase 11+ entry research opens, re-run the same context7 query and diff against this snapshot. Any deltas → schema-version bump candidate; current pinned version is `1`.

## Source verification

Library: `/lee-to/ai-factory`
Query date: 2026-05-09
Query text: `GATE-RESULT-CONTRACT.md schema schema_version blockers affected_files suggested_next 2026 latest schema fields`
Sources consulted: `skills/aif-verify/references/GATE-RESULT-CONTRACT.md`, `docs/quality-gates.md`, `llms.txt` (branch `2.x`)
Verified fields: 7 top-level + 4 Blocker fields + 2 SuggestedNext fields = 13 total fields, all present in fetch response.

### Delta vs phase-9-entry-research §4.A4+§4.A9 expected list

| Finding | Detail |
|---|---|
| `suggested_next.command` allowlist extended | fetch confirms `/aif-architecture` and `/aif-roadmap` in addition to `/aif-fix` and `/aif-commit`; also `null` is valid |
| `suggested_next.reason` nullability | fetch confirms `null` is valid (not only `string`) |
| `blocking` semantics | fetch confirms: `true` only when `status === "fail"` with non-empty blockers |
| All 7 top-level fields | confirmed present, no fields removed |
