#!/usr/bin/env sh
# Pre-commit hook: fast checks only (target: <5 seconds).
# Heavy checks live in pre-push and CI.
#
# Install: place at .husky/pre-commit and run `chmod +x .husky/pre-commit`

npx lint-staged
