.PHONY: self-audit pre-commit-check pre-push-check install-hooks principles-meta-tests validate-prompts

self-audit: pre-commit-check pre-push-check principles-meta-tests

pre-commit-check:
	@.husky/pre-commit

pre-push-check:
	@.husky/pre-push

principles-meta-tests:
	@npm --prefix packages/core run test:principles

install-hooks:
	@chmod +x .husky/pre-commit .husky/pre-push
	@git config core.hooksPath .husky
	@echo "✓ Hooks installed (git config core.hooksPath .husky)"

validate-prompts: ## Validate all orchestrator batch-prompt files against spec
	@find .claude/orchestrator-prompts -name '*.md' -not -name 'README.md' | \
	  sort | \
	  while read -r f; do \
	    echo "Checking $$f ..."; \
	    npx tsx packages/core/spec-validation/validate-batch-spec.ts "$$f" || exit 1; \
	  done
	@echo "validate-prompts: all files passed."
