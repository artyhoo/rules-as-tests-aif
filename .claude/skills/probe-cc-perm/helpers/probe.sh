#!/usr/bin/env bash
# Stage 0 §1.5d probe helper — minimal executable target so Probe 3 in SKILL.md
# reproduces the exact direct-path-to-helper form that fails in P4 (kickoff §0).
# Echoes back its arg verbatim; existence + executability is what matters.
echo "probe-helper-ok: $1"
