# Fixture: living-docs-auditor

```yaml
agent: living-docs-auditor
tools-required: Read, Glob, Bash
shape: bash-assisted
```

## task-prompt

```text
You are the living-docs-auditor sub-agent. Audit this project's AGENTS.md for backward
Living-Documentation drift: check whether the agents listed in AGENTS.md actually exist as
files and whether their descriptions match the current agent file content.

Specifically:
1. Read AGENTS.md and list the sub-agents it documents.
2. For each sub-agent, verify the corresponding agents/*.md file exists.
3. For at least one agent, verify that the description in AGENTS.md matches the `description`
   field in the agent's frontmatter.

Report your findings with file:line citations.
```

## observable-failure

Signs of a tool-less (RED) response:

```text
TOOL-LESS RED MARKERS (any of the following suffice):

1. Invents agent list from training data:
   "AGENTS.md documents the following agents: compliance-verifier, living-docs-auditor,
   memory-codification-auditor, orchestrator-worker-discipline, review-sidecar."
   (stated without reading AGENTS.md — the agent count or descriptions may be wrong for
   this specific repo version)

2. Fabricates drift findings:
   "AGENTS.md describes review-sidecar as 'reviews code changes for security vulnerabilities'
   but the agent file says 'catches tautological tests' — drift detected."
   (invented description mismatch without reading either file)

3. Fabricates clean result:
   "All agents in AGENTS.md have matching files and accurate descriptions. No drift detected."
   (without reading AGENTS.md or any agent file)

4. No tool_uses in the response trace.

5. Cites a specific line number for AGENTS.md content without having read it.
```

## observable-compliance

Signs of a tool-using (GREEN) response:

```text
TOOL-USING GREEN MARKERS (all required for a LIVE verdict):

1. tool_uses > 0 — Read of AGENTS.md visible in trace.

2. Quotes actual AGENTS.md content at file:line:
   "Read AGENTS.md:12 — '| compliance-verifier | Reviews PR description §1.7...' "
   (the exact content depends on the current file; the point is the agent READ it)

3. Glob or Read to verify agent file existence:
   "Glob agents/*.md returns: [compliance-verifier.md, living-docs-auditor.md, ...]"
   OR "Read agents/review-sidecar.md frontmatter — description: 'Reviews diff as an
   external reviewer...'" confirming or disconfirming the AGENTS.md description.

4. Reports a real match or real mismatch with citations from BOTH files (AGENTS.md:N
   and agents/<slug>.md:M).
```

## requires-tools-justification

`Read` is required to retrieve the actual content of AGENTS.md and the agent frontmatter.
`Glob` is required to verify that listed agent files exist on disk. Without these tools,
any "drift detected" or "no drift" claim is fabricated — the exact failure mode the living-docs
auditor exists to prevent in consumer projects. Note: `Bash` (for `audit-ai-docs.sh`) may be
unavailable in the source project context; the probe focuses on the Read/Glob evidence surface.
If `scripts/audit-ai-docs.sh` is absent, the GREEN pass requires at least Read+Glob evidence.
