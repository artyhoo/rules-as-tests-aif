# .claude/orchestrator-prompts/

> **Authoritative for:** orchestrator batch-prompt files for Wave N umbrella tasks — each sub-directory contains self-contained Sonnet file-prompts for one umbrella. Individual files are scope-bound by their umbrella name + batch letter.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).
> **Append-only:** prompts are audit trail artefacts — do not edit after the umbrella PR is open. Delete the whole sub-directory post-merge (or keep as audit trail, operator's call).
> **Validation:** `make validate-prompts` runs validate-batch-spec.ts on all *.md files in this tree.
