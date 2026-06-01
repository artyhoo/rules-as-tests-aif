---
name: probe-cc-perm
description: One-shot probe — records the literal pattern CC emits to its permission check for a !-fenced helper invocation. Used by 2026-05-28 meta-orch-no-arg-overview umbrella Stage 0 §1.5d. Delete after use.
---

## Probe 1 — direct shell builtin (control, never matches a Bash(*) allow-rule pattern related to helpers)

```!
echo probe-ok-direct
```

## Probe 2 — compound `||` (matches P4-b compound-matcher concern)

```!
true || true
```

## Probe 3 — direct-path helper invocation (matches the EXACT failing pattern in P4 §0)

```!
${CLAUDE_SKILL_DIR}/helpers/probe.sh probe-arg
```

## Without this skill

Diagnosis of P4 (`!`-fence helper invocation failure in `meta-orchestrator` SKILL.md) stalls on inference: we cannot tell whether CC's permission check sees the raw `` ```! `` fence as text or extracts the inner command, so Stage 4 cannot ship an evidence-grounded fix and risks targeting the wrong root cause (harness bug vs allow-list shape mismatch).

## With this skill

Maintainer invokes `/probe-cc-perm` once, captures the three literal patterns CC emits to its permission check (control + compound `||` + direct-path helper), and the conditional verdict matrix in research-patch `2026-05-28-meta-orch-no-arg-overview-s0-thin-probe.md` §5b resolves to either harness-clean or harness-bug; Stage 4 dispatch then writes a settings.json allow-rule of the exact shape the empirical evidence dictates.
