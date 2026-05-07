.PHONY: self-audit pre-commit-check pre-push-check install-hooks principles-meta-tests

self-audit: pre-commit-check pre-push-check principles-meta-tests

pre-commit-check:
	@.husky/pre-commit

pre-push-check:
	@.husky/pre-push

principles-meta-tests:
	@npm --prefix scripts run test:principles

install-hooks:
	@chmod +x .husky/pre-commit .husky/pre-push
	@git config core.hooksPath .husky
	@echo "✓ Hooks installed (git config core.hooksPath .husky)"
