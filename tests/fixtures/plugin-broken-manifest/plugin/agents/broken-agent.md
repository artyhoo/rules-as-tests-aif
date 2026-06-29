---
name: broken-agent
description: Deliberately broken frontmatter for principle 24 — this unquoted scalar contains a mid-value colon: which makes YAML reject it (mapping values are not allowed here). Trips V4.
tools: Read
---

# broken-agent

Paired-negative fixture: the `description:` above is an unquoted scalar with a mid-value `: `,
so a REAL YAML parse fails — proving principle 24's V4 (real-parse) arm has teeth. Not a real agent.
