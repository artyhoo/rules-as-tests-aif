#!/usr/bin/env bash
# setup.d/15-companions-stack.sh — Stack-specific companion install layer (stub).
#
# @stub: populated in S3 (15-companions-stack)
# S0 rows: NEW-layers table, O7
# Depends on: lib.sh (already in dispatcher scope)
# @cc-only-rationale: sourced by install.sh dispatcher, not standalone
#
# This layer installs stack-specific companion integrations. Content is deferred to S3.
# Must be safely source-able by the dispatcher: no side effects, exit 0.
:
