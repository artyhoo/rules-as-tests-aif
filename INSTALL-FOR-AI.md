# Installation guide for AI agents (Claude Code, Cursor, etc.)

> Paste the prompt below into your AI agent. It will install rules-as-tests-aif on top of AI Factory in your current project, with full transparency about what it's doing.

---

## Quick install — copy-paste prompt

```
Install rules-as-tests-aif into this project. Follow these steps exactly:

1. Verify prerequisites:
   - Node.js 20.19+ (`node --version`)
   - npm available
   - git initialized in this project
   - If `ai-factory` CLI is not installed globally → run `npm install -g ai-factory`

2. Detect the project stack by checking:
   - If `next.config.{js,ts,mjs}` exists OR package.json contains "next" → stack = "react-next"
   - Otherwise → stack = "ts-server"
   Show me the detection result and ask if I want to override.

3. Run `ai-factory init --agents claude` ONLY if .ai-factory/ doesn't already exist.
   Show output. If it fails, stop and ask me what to do.

4. From the rules-as-tests-aif package directory, run:
   `bash setup.sh --stack=<detected-stack>`

   This installs:
   - .claude/agents/{best-practices-sidecar,review-sidecar,docs-auditor}.md (overrides)
   - .claude/skills/rules-as-tests/ — skill + 5 reference files in references/
   - .ai-factory/DESCRIPTION.template.md, ARCHITECTURE.ts-server.md, RULES.md, RULES.react-next.md (if applicable)
   - scripts/audit-ai-docs.sh (or .react-next.sh)
   - Configs in project root: eslint.config.mjs, vitest.config.ts, dependency-cruiser.cjs, stryker.config.json, tsconfig.json, .nvmrc, .lintstagedrc.json
   - .husky/pre-commit, .husky/pre-push
   - package.json scripts (lint, typecheck, test, audit:docs, validate, etc.)
   - Dev dependencies via `npm install -D` (~25 packages)

5. After setup.sh completes, do these checks and report results:
   a. `npm run typecheck` — should pass on a fresh project
   b. `npm run lint` — may have warnings on existing code, that's OK
   c. `npm run audit:docs` — should run, may report findings (read them aloud to me)
   d. `ls -la .claude/agents/` — confirm best-practices-sidecar.md, review-sidecar.md, docs-auditor.md exist
   e. `ls -la .ai-factory/` — confirm DESCRIPTION.md (or .template.md), ARCHITECTURE.md, RULES.md exist

6. Read .ai-factory/DESCRIPTION.template.md and tell me which placeholders need filling.
   DO NOT fill them yourself — these are project-specific and require my input.

7. Read .ai-factory/RULES.md (R1-R11) and ask me which rules to keep, adjust, or remove for this project.

8. If stack is react-next, also read .ai-factory/RULES.react-next.md (R12-R20).

9. Stop here. Do NOT start implementing features. The setup is meant to be reviewed before use.

After all this, tell me:
- What was installed (file count, total size)
- Any warnings or errors encountered
- The 3 most important things I should manually edit
- The exact command to verify everything is wired up: `npm run validate && npm run audit:docs`
```

---

## What the AI will produce

After running the prompt, the AI should give you a structured summary like:

```
✓ Installed: 27 files
  - 3 sub-agents in .claude/agents/
  - 5 reference docs in .ai-factory/references/
  - 1 audit script in scripts/
  - 12 config files in root
  - 2 husky hooks

⚠ Warnings:
  - 2 lint errors in existing src/ — fix before running /aif-verify
  - DESCRIPTION.template.md has 4 placeholders to fill

Manual edits needed (priority order):
  1. .ai-factory/DESCRIPTION.md — replace placeholders for project name, stack, non-goals
  2. .ai-factory/RULES.md — review R1-R11, remove rules that don't fit
  3. scripts/audit-ai-docs.sh — add project-specific probes for your domain rules

To verify: npm run validate && npm run audit:docs
```

---

## If something goes wrong

If the AI reports errors during setup, copy this follow-up prompt:

```
The setup encountered issues. Please:

1. Show me the full error output (don't summarize, paste raw output).

2. Diagnose the cause:
   - Missing dependency? Permission issue? File conflict?
   - Was ai-factory init successful?
   - Did install.sh complete?

3. Suggest a fix without making changes yet. Wait for my approval.

4. If the fix is non-trivial, suggest rolling back:
   `git restore . && git clean -fd .claude .ai-factory scripts`
   (this assumes nothing else was changed in this session)
```

---

## Manual installation (if AI agents are unavailable)

```bash
# 1. Install AI Factory globally (one-time)
npm install -g ai-factory

# 2. In your project:
cd your-project
ai-factory init --agents claude

# 3. Apply rules-as-tests overlay
unzip path/to/rules-as-tests-aif.zip
cd rules-as-tests-aif
bash setup.sh
# (auto-detects stack; or use --stack=ts-server / --stack=react-next)

# 4. Edit placeholders manually
$EDITOR ../my-project/.ai-factory/DESCRIPTION.template.md
mv ../my-project/.ai-factory/DESCRIPTION.template.md ../my-project/.ai-factory/DESCRIPTION.md

# 5. Verify
cd ../my-project
npm run validate
npm run audit:docs
```

---

## What gets installed — file by file

After successful setup, your project has:

```
project/
├── AGENTS.md                          ← copied from templates/shared/AGENTS.md.template (edit)
├── CLAUDE.md                          ← optional, points to AGENTS.md
├── .nvmrc                             ← Node version pin (CI depends on this)
├── tsconfig.json                      ← strict TypeScript settings
├── eslint.config.mjs                  ← (or eslint.config.react.mjs for UI)
├── vitest.config.ts                   ← unit/integration/audit test discovery
├── stryker.config.json                ← mutation testing
├── .dependency-cruiser.cjs            ← architectural rules
├── .lintstagedrc.json                 ← pre-commit formatter
├── playwright.config.ts               ← only for react-next
├── .husky/
│   ├── pre-commit                     ← runs lint-staged
│   └── pre-push                       ← typecheck + tests + audit-ai-docs
├── .github/workflows/ci.yml           ← full CI pipeline
├── .ai-factory/
│   ├── DESCRIPTION.md                 ← edit this (project description)
│   ├── ARCHITECTURE.md                ← edit this (layer rules)
│   ├── RULES.md                       ← R1-R11 (review and adjust)
│   ├── RULES.react-next.md            ← R12-R20 (only react-next)
│   └── rules/integration-rules.md     ← only for microservices
├── .claude/
│   ├── agents/                        ← AIF sub-agents (overridden by us)
│   │   ├── best-practices-sidecar.md  ← validates RULES.md after each /aif-implement
│   │   ├── review-sidecar.md          ← two-AI review for tautological tests
│   │   ├── docs-auditor.md            ← runs audit-ai-docs.sh
│   │   └── (other AIF agents untouched)
│   └── skills/rules-as-tests/
│       ├── SKILL.md                   ← skill, auto-activates on triggers
│       └── references/                ← 5 docs (loaded on-demand)
│           ├── checks-map.md
│           ├── overview.md
│           ├── ai-traps.md
│           ├── self-testing-docs.md
│           └── doc-organization.md
└── scripts/
    └── audit-ai-docs.sh              ← (or .react-next.sh) — code-vs-docs probes
```

---

## Verification checklist (after install)

| Check | Command | Expected |
|---|---|---|
| Skills loaded | open Claude Code, ask "what skills are available?" | Lists `rules-as-tests` (and AIF base skills) |
| Sub-agents loaded | `ls .claude/agents/best-practices-sidecar.md` | File exists, ~3KB |
| TypeScript compiles | `npm run typecheck` | Exit 0 |
| Lint runs | `npm run lint` | Exit 0 (warnings OK on existing code) |
| Tests discoverable | `npx vitest run --listFiles` | Shows .unit.ts files (or empty if no tests yet) |
| Audit script runs | `npm run audit:docs` | Exit 0 with PASS/FAIL/WARN output |
| Pre-commit hook | `git commit --allow-empty -m "test"` (in test branch) | Lint-staged runs |
| Pre-push hook | `git push --dry-run` | Typecheck + tests + audit run |
| `/aif-verify` works | in Claude Code: `/aif-verify` | best-practices-sidecar + review-sidecar + docs-auditor produce output |
