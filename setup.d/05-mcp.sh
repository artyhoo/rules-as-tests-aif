#!/usr/bin/env bash
# setup.d/05-mcp.sh — MCP companion install layer (stub).
#
# @stub: populated in S2 (05-mcp)
# S0 rows: NEW-layers table, O7
# Depends on: lib.sh (already in dispatcher scope)
# @cc-only-rationale: sourced by install.sh dispatcher, not standalone
#
# This layer installs MCP companion integrations. Content is deferred to S2.
# Must be safely source-able by the dispatcher: no side effects, exit 0.
:
