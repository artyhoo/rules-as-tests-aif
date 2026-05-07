# Audit reports archive

This directory holds historical audit reports. Each is a snapshot in time, named `YYYY-MM-DD.md`.

## Convention

Every audit report starts with a **Status block** (table form) listing each finding's current state: RESOLVED / OPEN / WONTFIX / INVALID. The block is editable; the rest of the report is **frozen** as written by the auditor.

## Why archive instead of delete?

- Historical context for "why did we make decision X" investigations.
- Pattern recognition: repeated finding categories signal systemic issues, not isolated bugs.
- Self-application of rule R10 (one canonical name) — auditor reports live in one place.

## When to add a new report

- After a fresh-session audit using `AUDIT-PROMPT.md`.
- After an external review.
- After a post-mortem / incident retrospective on the framework itself (not on consumer projects).

## Adding a new report

1. Run the audit (e.g., spawn a fresh Claude Code session against `AUDIT-PROMPT.md`).
2. Save to `docs/audits/YYYY-MM-DD.md`.
3. Prepend a Status block listing each finding with status `OPEN`.
4. As findings get closed, update statuses and add a `Closed by` reference (commit SHA, PR URL, or other audit report).
5. Do not edit the body of an existing report — write a new dated report instead.
