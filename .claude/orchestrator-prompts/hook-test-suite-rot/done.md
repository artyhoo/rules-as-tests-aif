# hook-test-suite-rot — DONE
- Final PR: #608
- Closed: 2026-06-17
- Summary: Classified all 15 packages/core/hooks/ failures (env / stale / regression); the real bug was a Linux-only xargs regression in priority-score-synthetic.sh. Fixes F1-F4 + CI-gap option C (gate the hooks suite) shipped in #611; the gate then caught a second Linux-only bug (BSD-first stat) fixed in the same PR. Report #608.
