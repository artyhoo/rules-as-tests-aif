# @rules-as-tests/lint-config

> **Authoritative for:** shared markdownlint structural config used by the root `.husky/pre-commit` hook. Defines the canonical Markdown rule set for all docs in this repository and shipped consumer docs.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).

Shared Markdownlint configuration package for the `rules-as-tests-aif` workspace.
The root `.husky/pre-commit` hook applies this rule set to every staged `*.md` file.

---

## Rule set

Rules are hand-rolled for this project — no Microsoft, Google, or markdownlint-standard preset.
Only structural rules are enabled (`"default": false`); prose-style rules that generate
false positives on legitimate technical writing are intentionally omitted.

| Rule | Name | Rationale |
|---|---|---|
| MD001 | heading-increment | Heading levels must increment by one; skipping levels (h1 → h3) hides hierarchy drift. |
| MD003 | heading-style | ATX style (`#` prefix) only; setext underline style is inconsistent with project docs. |
| MD007 | ul-indent | Unordered lists indent 2 spaces; 4-space indent creates rendering differences in some parsers. |
| MD009 | no-trailing-spaces | Trailing spaces are invisible noise; intentional `<br>` line-breaks are not used in project prose. |
| MD034 | no-bare-urls | Bare URLs skip link text; `[text](url)` is required for context. |
| MD040 | fenced-code-language | Every fenced code block must specify a language tag for syntax highlighting and semantic clarity. |

**Intentionally disabled:**

- `MD013` (line-length) — disabled via `"default": false`; long lines are legitimate in prose-heavy docs
  and tables. The 500-line file-size limit (enforced in pre-commit) is the only length gate.
- `MD033` (no-inline-html) — disabled; project docs use Markdown tables and blockquotes, not raw HTML.
- All other rules — disabled via `"default": false` to prevent unexpected failures on existing docs.

---

## Files

| File | Purpose |
|---|---|
| `markdownlint.json` | Canonical rule config (plain JSON, no comments; used by `extends:` or direct reference). |
| `package.json` | Workspace member declaration (`@rules-as-tests/lint-config`). |
| `README.md` | This file — authority header + rule set documentation. |

The root `.markdownlint.json` mirrors the content of `markdownlint.json` exactly.
Both files must be kept in sync; the root file is auto-discovered by markdownlint-cli2
when run from the repo root.

---

## Usage

### Automatic (pre-commit hook)

The hook fires on every `git commit` for staged `*.md` files:

```bash
git diff --cached --name-only --diff-filter=ACMR | grep -E '\.md$'
# → passed to npx markdownlint-cli2
```

No manual invocation needed during normal development.

### Manual sweep

Run against all Markdown files from the repo root:

```bash
npx markdownlint-cli2 "**/*.md" --ignore node_modules
```

Run against a specific file:

```bash
npx markdownlint-cli2 docs/meta-factory/EXECUTION-PLAN.md
```

### Extending from consumer projects

Consumer projects that install this framework via `install.sh` inherit the pre-commit
hook but do **not** receive this config package. They should copy or reference the rule
set directly if they want the same structural rules.

---

## Adding or changing rules

1. Edit both `markdownlint.json` (this package) and root `.markdownlint.json` in the same commit.
2. If adding a rule that would fail on existing docs: fix violations in the same commit or
   add an `.markdownlintignore` file with a rationale comment.
3. Update this README's rule table.
4. Bump `Last reviewed` in `docs/meta-factory/prior-art-evaluations.md` entry #17
   (markdownlint-cli2) if the rule set change reflects new markdownlint-cli2 capabilities.

---

## See also

- [.husky/pre-commit](../../.husky/pre-commit) — hook that invokes markdownlint-cli2 on staged files.
- [docs/meta-factory/prior-art-evaluations.md](../../docs/meta-factory/prior-art-evaluations.md) entry #17 — SSOT record for markdownlint-cli2 adoption.
- [.claude/rules/doc-authority-hierarchy.md](../../.claude/rules/doc-authority-hierarchy.md) — doc-authority discipline that motivates structural linting of authority-bearing docs.
