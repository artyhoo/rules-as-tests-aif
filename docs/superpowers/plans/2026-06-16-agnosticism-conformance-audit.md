# AI-agnosticism conformance audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-Claude-Code conformance harness that *runs* every shipped gate and orchestration capability with no CC present, records pass/fail as executable proof, then emits the Umbrella-2 remediation kickoff.

**Architecture:** Extend the existing `tests/install-sh/*.test.sh` scratch-consumer pattern (provision temp project → `install.sh <target> --force` → assert) with a **CC-absent mode**: scrub all `CLAUDE_*` env + assert no CC influence, then drive gates via raw git/shell and emit machine-readable conformance records. Deterministic surfaces use bash probes; semantic surfaces (agent-prompt portability, orchestration workflow path, doc claim-truth) use a `/workflows` fan-out of AI-agnostic auditor agents. A synthesis step ranks records into the remediation kickoff.

**Tech Stack:** Bash (POSIX-ish, `set -uo pipefail`), Node (for JSON asserts, already used by the harness), the `Workflow` tool for semantic fan-out, Vitest/ESLint/Stryker/dependency-cruiser as the gates under test.

**Spec:** [docs/superpowers/specs/2026-06-16-agnosticism-conformance-audit-design.md](../specs/2026-06-16-agnosticism-conformance-audit-design.md)

---

## File structure

| Path | Responsibility | New/Modify |
|---|---|---|
| `tests/agnosticism/_cc-absent-lib.sh` | Sourced lib: `cc_scrub` (run cmd with `CLAUDE_*` unset + `claude` masked), `assert_cc_absent`, `record` (append a conformance TSV line) | Create |
| `tests/agnosticism/harness-self.test.sh` | Self-test: scrub really removes CC env; harness FAILS on a seeded CC-coupled break (anti-theatre gate) | Create |
| `tests/agnosticism/probes/substrate.sh` | Surface 1 probe — run eslint/vitest/pre-push-fallback under zero-CC in a scratch consumer; emit records | Create |
| `tests/agnosticism/probes/hooks.sh` | Surface 4 — shipped git hooks fire via git not CC; fallback selects on no-Node-20 | Create |
| `tests/agnosticism/probes/paid.sh` | Surface 6 — no metered route without opt-in; transport default surfaced | Create |
| `tests/agnosticism/probes/rules-autoload.sh` | Surface 7 — measure off-CC rule auto-load degradation | Create |
| `tests/agnosticism/run-audit.sh` | Run every probe, aggregate into `conformance-record.tsv`, print summary | Create |
| `tests/agnosticism/conformance-record.tsv` | Generated machine-readable record (`surface⇥probe⇥cmd⇥exit⇥verdict`) | Generated (gitignored) |
| `.claude/orchestrator-prompts/agnosticism-audit/workflow.mjs` | The `/workflows` script for semantic surfaces 2/3/5 (saved for reuse/resume) | Create |
| `.github/workflows/audit-self.yml` | Wire `harness-self.test.sh` into CI (one line) | Modify |
| `.claude/orchestrator-prompts/agnosticism-remediation/kickoff.md` | **The deliverable** — Umbrella-2 remediation kickoff | Create (synthesis) |
| `.gitignore` | Ignore `tests/agnosticism/conformance-record.tsv` | Modify |

---

## Phase 1 — Harness foundation (the load-bearing BUILD)

### Task 1: CC-scrub library

**Files:**
- Create: `tests/agnosticism/_cc-absent-lib.sh`
- Test: `tests/agnosticism/harness-self.test.sh` (Step 1 below)

- [ ] **Step 1: Write the failing self-test for `cc_scrub`**

Create `tests/agnosticism/harness-self.test.sh`:

```bash
#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }
source "$REPO_ROOT/tests/agnosticism/_cc-absent-lib.sh"

# cc_scrub must remove CLAUDE_* from the child env
out=$(CLAUDE_PROJECT_DIR=/x CLAUDE_SKILL_DIR=/y cc_scrub 'env')
echo "$out" | grep -q '^CLAUDE_' && bad "scrub leaked CLAUDE_* into child" || ok "scrub removes CLAUDE_* env"

# assert_cc_absent must SUCCEED inside cc_scrub and FAIL when CLAUDE_PROJECT_DIR is set
cc_scrub 'bash -c "source '"$REPO_ROOT"'/tests/agnosticism/_cc-absent-lib.sh; assert_cc_absent"' \
  && ok "assert_cc_absent passes under scrub" || bad "assert_cc_absent wrongly failed under scrub"
CLAUDE_PROJECT_DIR=/x bash -c "source $REPO_ROOT/tests/agnosticism/_cc-absent-lib.sh; assert_cc_absent" 2>/dev/null \
  && bad "assert_cc_absent passed WITH CC env (false-green risk)" || ok "assert_cc_absent fails when CC present"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: Run it, verify it fails (lib missing)**

Run: `bash tests/agnosticism/harness-self.test.sh`
Expected: FAIL — `_cc-absent-lib.sh: No such file or directory`.

- [ ] **Step 3: Implement `_cc-absent-lib.sh`**

```bash
#!/usr/bin/env bash
# CC-absent conformance harness library. Sourced by probes + self-test.
# @cc-only-rationale: N/A — this lib EXISTS to prove portability; it is the test, not a hook.

# Run a command with every CLAUDE_* var unset and `claude` masked off PATH.
# Usage: cc_scrub '<command string>'
cc_scrub() {
  local claude_vars
  claude_vars=$(env | grep -oE '^CLAUDE_[A-Z_]+' || true)
  local unset_args=()
  for v in $claude_vars; do unset_args+=("-u" "$v"); done
  # PATH shim dir whose `claude` is a no-op error, so any accidental shell-out is caught.
  local shim; shim=$(mktemp -d)
  printf '#!/bin/sh\necho "CC INVOKED UNDER SCRUB" >&2; exit 127\n' > "$shim/claude"
  chmod +x "$shim/claude"
  env "${unset_args[@]}" PATH="$shim:$PATH" CC_ABSENT=1 bash -c "$1"
  local rc=$?
  rm -rf "$shim"
  return $rc
}

# Fail (exit 1) if any CC presence signal is detected. Run INSIDE cc_scrub.
assert_cc_absent() {
  [ -n "${CLAUDE_PROJECT_DIR:-}" ] && { echo "CC present: CLAUDE_PROJECT_DIR set" >&2; return 1; }
  [ -n "${CLAUDE_SKILL_DIR:-}" ]   && { echo "CC present: CLAUDE_SKILL_DIR set" >&2; return 1; }
  [ "${CC_ABSENT:-0}" = "1" ] || { echo "CC_ABSENT marker missing — not under scrub" >&2; return 1; }
  return 0
}

# Append a conformance record. Usage: record <surface> <probe> <cmd> <exit> <verdict>
RECORD_FILE="${RECORD_FILE:-/dev/stdout}"
record() { printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "$5" >> "$RECORD_FILE"; }
```

- [ ] **Step 4: Run the self-test, verify PASS**

Run: `bash tests/agnosticism/harness-self.test.sh`
Expected: PASS — all 4 checks ✓, `FAIL=0`.

- [ ] **Step 5: Commit**

```bash
git add tests/agnosticism/_cc-absent-lib.sh tests/agnosticism/harness-self.test.sh
git commit -m "test(agnosticism): CC-scrub harness library + self-test"
```

### Task 2: Anti-theatre gate — harness must catch a seeded CC-break

This is the §6 pilot gate: a harness that can't *fail* on a real CC-coupling is theatre (T2). We seed a fake CC-coupled "gate" and prove the harness flags it.

**Files:**
- Modify: `tests/agnosticism/harness-self.test.sh` (append a block)

- [ ] **Step 1: Append the seeded-break check (write the failing assertion first)**

Append before the final `echo`/summary in `harness-self.test.sh`:

```bash
# ── ANTI-THEATRE: a gate that hard-requires CC must be FLAGGED by the harness ──
# Seed a fake "gate" script that only succeeds when CLAUDE_PROJECT_DIR is set.
SEED=$(mktemp -d)
cat > "$SEED/cc-coupled-gate.sh" <<'EOF'
#!/usr/bin/env bash
[ -n "${CLAUDE_PROJECT_DIR:-}" ] || { echo "needs Claude Code" >&2; exit 3; }
echo "ran"; exit 0
EOF
chmod +x "$SEED/cc-coupled-gate.sh"
# Under scrub the seeded gate MUST fail (exit 3). If it passes, the harness is blind.
cc_scrub "bash $SEED/cc-coupled-gate.sh" >/dev/null 2>&1 \
  && bad "anti-theatre: CC-coupled gate PASSED under scrub — harness is blind" \
  || ok "anti-theatre: harness flags a CC-coupled gate (exit non-zero under scrub)"
rm -rf "$SEED"
```

- [ ] **Step 2: Run, verify PASS**

Run: `bash tests/agnosticism/harness-self.test.sh`
Expected: PASS — new check ✓ ("harness flags a CC-coupled gate"), `FAIL=0`.

- [ ] **Step 3: Commit**

```bash
git add tests/agnosticism/harness-self.test.sh
git commit -m "test(agnosticism): anti-theatre gate — harness must flag a seeded CC-break"
```

### Task 3: Wire the self-test into CI

**Files:**
- Modify: `.github/workflows/audit-self.yml` (add one step next to the other `tests/install-sh/*` steps)

- [ ] **Step 1: Add the CI step**

Find the block of `- name: Run install-sh ...` steps (grep `tests/install-sh/`), and add after the last one:

```yaml
      - name: Run agnosticism harness self-test (Umbrella-1 anti-theatre gate)
        run: bash tests/agnosticism/harness-self.test.sh
```

- [ ] **Step 2: Verify YAML parses + step is present**

Run: `node -e "const y=require('js-yaml'); y.load(require('fs').readFileSync('.github/workflows/audit-self.yml','utf8')); console.log('yaml ok')"` (js-yaml is already a dev dep; if absent, fall back to `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/audit-self.yml')); print('yaml ok')"`).
Expected: `yaml ok`. Then `grep -c agnosticism .github/workflows/audit-self.yml` → ≥1.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/audit-self.yml
git commit -m "ci(agnosticism): wire harness self-test into audit-self"
```

---

## Phase 2 — Run the audit (apply the methodology, don't just design it — T2)

> Each probe is a real run producing a conformance record (`surface⇥probe⇥cmd⇥exit⇥verdict`). `verdict` ∈ `PORTABLE` / `DEGRADED` / `CC-ONLY` / `PAID-RISK`. The probe asserts nothing about pass/fail of the audit — it *records reality*. Findings are derived in Phase 3.

### Task 4: Deterministic substrate probe (Surface 1)

**Files:**
- Create: `tests/agnosticism/probes/substrate.sh`

- [ ] **Step 1: Write the probe**

```bash
#!/usr/bin/env bash
# Surface 1 — substrate gates must run with zero CC. Provisions a scratch consumer,
# scrubs CC, runs each gate, records exit code. Does NOT assert green — records reality.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
source "$REPO_ROOT/tests/agnosticism/_cc-absent-lib.sh"

T=$(mktemp -d)
printf '{ "name":"scratch","version":"0.0.0" }\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1

# Each gate: run under scrub, record exit. Add gates as the consumer ships them.
for gate in \
  "pre-push-fallback:bash packages/core/hooks/pre-push.fallback.sh" \
  "eslint:npx --no-install eslint . || true" \
  ; do
  name=${gate%%:*}; cmd=${gate#*:}
  cc_scrub "cd '$T' && $cmd" >/dev/null 2>&1; rc=$?
  verdict=PORTABLE; [ "$rc" -ne 0 ] && verdict=DEGRADED
  record "substrate" "$name" "$cmd" "$rc" "$verdict"
done
rm -rf "$T"
```

- [ ] **Step 2: Run it, observe records**

Run: `RECORD_FILE=/dev/stdout bash tests/agnosticism/probes/substrate.sh`
Expected: 2+ TSV lines like `substrate⇥pre-push-fallback⇥…⇥0⇥PORTABLE`. (A non-zero exit here is a *finding*, not a test failure — that is the point.)

- [ ] **Step 3: Commit**

```bash
git add tests/agnosticism/probes/substrate.sh
git commit -m "test(agnosticism): substrate-surface probe (zero-CC gate run)"
```

### Task 5: Deterministic probes — hooks, paid, rules-autoload (Surfaces 4, 6, 7)

**Files:**
- Create: `tests/agnosticism/probes/hooks.sh`, `tests/agnosticism/probes/paid.sh`, `tests/agnosticism/probes/rules-autoload.sh`

- [ ] **Step 1: Write `hooks.sh` (Surface 4)** — same scaffold as `substrate.sh`; the probe body:

```bash
# Shipped git hooks must fire via git, not CC. Record whether core.hooksPath is set
# and whether pre-push runs headless under scrub.
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
hp=$(git -C "$T" config core.hooksPath || echo UNSET)
record "hooks" "core-hooksPath" "git config core.hooksPath" "0" \
  "$([ "$hp" = .husky ] && echo PORTABLE || echo DEGRADED)"
cc_scrub "cd '$T' && git -C '$T' hook run pre-push </dev/null"; rc=$?
record "hooks" "pre-push-headless" "git hook run pre-push" "$rc" \
  "$([ "$rc" -eq 0 ] && echo PORTABLE || echo DEGRADED)"
```

- [ ] **Step 2: Write `paid.sh` (Surface 6)** — assert no silent metered route; cross-check `no-paid-llm-in-ci.md`:

```bash
# PAID-RISK if a metered transport is the DEFAULT without an opt-in marker being surfaced.
grep -Rqs 'transport.*"cli"' "$REPO_ROOT/packages/runtime-bridge/scripts/setup-runtime-bridge.sh" \
  && record "paid" "transport-optin-surfaced" "grep transport cli setup-runtime-bridge.sh" "0" "PORTABLE" \
  || record "paid" "transport-optin-surfaced" "grep transport cli" "1" "PAID-RISK"
# Any ANTHROPIC_API_KEY in shipped CI workflows = violation.
if grep -RqsE 'ANTHROPIC_API_KEY|api\.anthropic' "$REPO_ROOT/.github/workflows/"; then
  record "paid" "no-api-key-in-ci" "grep ANTHROPIC_API_KEY workflows" "1" "PAID-RISK"
else
  record "paid" "no-api-key-in-ci" "grep ANTHROPIC_API_KEY workflows" "0" "PORTABLE"
fi
```

- [ ] **Step 3: Write `rules-autoload.sh` (Surface 7)** — measure the off-CC degradation, don't fix it:

```bash
# Off-CC there is no .claude/rules auto-load. Record the count a portable consumer must
# read manually = the degradation magnitude (a DEGRADED finding, with the number as evidence).
n=$(find "$REPO_ROOT/.claude/rules" -name '*.md' | wc -l | tr -d ' ')
record "rules-autoload" "manual-read-burden" "count .claude/rules/*.md" "0" "DEGRADED:$n-rules"
```

- [ ] **Step 4: Run all three, observe records**

Run: `for p in hooks paid rules-autoload; do RECORD_FILE=/dev/stdout bash tests/agnosticism/probes/$p.sh; done`
Expected: TSV lines per surface. Non-PORTABLE verdicts are expected findings.

- [ ] **Step 5: Commit**

```bash
git add tests/agnosticism/probes/hooks.sh tests/agnosticism/probes/paid.sh tests/agnosticism/probes/rules-autoload.sh
git commit -m "test(agnosticism): deterministic probes — hooks, paid, rules-autoload"
```

### Task 6: Aggregator — `run-audit.sh`

**Files:**
- Create: `tests/agnosticism/run-audit.sh`
- Modify: `.gitignore`

- [ ] **Step 1: Write the aggregator**

```bash
#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
export RECORD_FILE="$REPO_ROOT/tests/agnosticism/conformance-record.tsv"
: > "$RECORD_FILE"
printf 'surface\tprobe\tcmd\texit\tverdict\n' >> "$RECORD_FILE"
for p in "$REPO_ROOT"/tests/agnosticism/probes/*.sh; do bash "$p"; done
echo "── conformance record ──"; column -t -s$'\t' "$RECORD_FILE"
echo "── non-PORTABLE findings ──"; grep -vE '\tPORTABLE$' "$RECORD_FILE" | grep -v '^surface' || echo "(none)"
```

- [ ] **Step 2: Ignore the generated record**

Append to `.gitignore`: `tests/agnosticism/conformance-record.tsv`

- [ ] **Step 3: Run the full deterministic audit**

Run: `bash tests/agnosticism/run-audit.sh`
Expected: a printed table + a "non-PORTABLE findings" list. This list is the deterministic half of the Umbrella-2 input.

- [ ] **Step 4: Commit**

```bash
git add tests/agnosticism/run-audit.sh .gitignore
git commit -m "test(agnosticism): conformance-record aggregator"
```

### Task 7: Semantic surfaces via `/workflows` (Surfaces 2, 3, 5)

Surfaces needing judgment — agent-prompt portability (2), orchestration workflow-path existence (3), doc claim-truth (5) — fan out as AI-agnostic auditor agents. Each is **required** to return a runnable probe + recorded output, then is adversarially verified (refute-by-default) so plausible-but-wrong findings die before the kickoff.

**Files:**
- Create: `.claude/orchestrator-prompts/agnosticism-audit/workflow.mjs`

- [ ] **Step 1: Author the Workflow script**

Create `.claude/orchestrator-prompts/agnosticism-audit/workflow.mjs` with this body (invoke via the `Workflow` tool, `scriptPath` pointing here):

```javascript
export const meta = {
  name: 'agnosticism-semantic-audit',
  description: 'Audit semantic agnosticism surfaces (agents, orchestration, doc claim-truth), adversarially verified',
  phases: [{ title: 'Probe' }, { title: 'Verify' }],
}
const SURFACES = [
  { key: 'agents', prompt: 'For every agents/*.md shipped via install.sh, determine if the prompt assumes a Claude-Code-only primitive (slash-command, CLAUDE_* env, a CC hook event). For each, output {file, cc_assumption:bool, evidence:"<quoted line>", verdict:"PORTABLE|CC-ONLY"}. Quote the actual line; no prose-only claims.' },
  { key: 'orchestration', prompt: 'For pipeline, dispatcher, aif-doctor, template-audit skills: is there ANY documented portable path to drive the WORKFLOW off Claude Code (not the slash-command sugar)? Read each SKILL.md §0/invocation section. Output {skill, portable_path:bool, evidence:"<file:line>", verdict}. disable-model-invocation:true means slash-command-only on CC.' },
  { key: 'claim-truth', prompt: 'Read packages/core/templates/shared/AGENTS.md.template. Find every claim that a capability "auto-activates"/"auto-triggers" — these are CC-only and FALSE off-CC. Output {line, claim, true_off_cc:bool, verdict}. Cite line numbers.' },
]
const FINDINGS = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object',
  properties:{ item:{type:'string'}, evidence:{type:'string'}, verdict:{type:'string'} },
  required:['item','evidence','verdict'] } } }, required:['findings'] }
const VERDICT = { type:'object', properties:{ confirmed:{type:'boolean'}, why:{type:'string'} }, required:['confirmed','why'] }

const results = await pipeline(
  SURFACES,
  s => agent(s.prompt, { label:`probe:${s.key}`, phase:'Probe', schema:FINDINGS }),
  (res, s) => parallel((res?.findings||[]).map(f => () =>
    agent(`Adversarially verify this agnosticism finding for surface '${s.key}'. Try to REFUTE it — open the cited file and check. Default confirmed=false if the evidence does not hold. Finding: ${JSON.stringify(f)}`,
      { label:`verify:${s.key}`, phase:'Verify', schema:VERDICT })
      .then(v => ({ surface:s.key, ...f, verdict_check:v }))))
)
return { confirmed: results.flat().filter(Boolean).filter(f => f.verdict_check?.confirmed) }
```

- [ ] **Step 2: Run the workflow**

Invoke the `Workflow` tool with `{ scriptPath: ".claude/orchestrator-prompts/agnosticism-audit/workflow.mjs" }`. When it completes, save the returned `confirmed` array to `.claude/orchestrator-prompts/agnosticism-audit/semantic-findings.json`.
Expected: a JSON array of confirmed semantic findings, each with `surface`, `evidence` (file:line), `verdict`.

- [ ] **Step 3: Commit the script (not the generated findings)**

```bash
git add .claude/orchestrator-prompts/agnosticism-audit/workflow.mjs
git commit -m "test(agnosticism): semantic-surface audit workflow (adversarially verified)"
```

> Note: `.claude/orchestrator-prompts/` is gitignored; if `workflow.mjs` is needed in-repo for reuse, the executor force-adds it (`git add -f`) — confirm against the umbrella's tracking convention before forcing.

---

## Phase 3 — Synthesize the remediation kickoff (the deliverable)

### Task 8: Author `agnosticism-remediation/kickoff.md`

**Files:**
- Create: `.claude/orchestrator-prompts/agnosticism-remediation/kickoff.md`

- [ ] **Step 1: Merge records into a ranked finding table**

Inputs: `tests/agnosticism/conformance-record.tsv` (deterministic) + `semantic-findings.json` (semantic). Severity rule: `CC-ONLY` on a consumer-shipped capability = **HIGH**; `DEGRADED` = **MEDIUM**; `PAID-RISK` = **HIGH**; deterministic `PORTABLE` = no finding (recorded as proof).

- [ ] **Step 2: Write the kickoff using this exact skeleton**

```markdown
# Agnosticism remediation — Umbrella-2 kickoff

> **Authoritative for:** the remediation scope to reach functional-parity agnosticism (spec §2). Append-only finding register below.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## §0 Source
Generated by Umbrella-1 conformance audit ([spec](../../../docs/superpowers/specs/2026-06-16-agnosticism-conformance-audit-design.md)).
Evidence: `tests/agnosticism/conformance-record.tsv` + semantic-findings.json. Bar = functional parity.

## §1 First wave — posture rewrite (spec §2 flag)
- [ ] Rewrite [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) + the wave-sequencing A/B decision so "orchestration CC-only" is a non-compliant state, not accepted-by-design. (Maintainer-owned; goal-adjacent.)

## §2 Findings → remediation waves
| ID | Surface | Severity | Command-proof | Fix-direction |
|----|---------|----------|---------------|---------------|
| <one row per confirmed finding — paste the exact cmd + exit + evidence file:line> |

## §3 AI-laziness-trap discipline (mandatory per ai-laziness-traps.md §3)
Active traps for this remediation R-phase: T1, T2, T3, T4, T10, T15, T16.
Domain-specific: **T-Agn-A** — "`@dual-pair`/`@cc-only-rationale` marker present ≠ portability proven; the harness run is the verdict, the marker is only the hypothesis."

## §4 Acceptance
- [ ] Every HIGH finding has a portable path that the harness re-run records as PORTABLE/DEGRADED-acceptable.
- [ ] The harness graduates into a CI principle test `packages/core/principles/<N>-agnosticism-conformance.test.ts` (spec §8) — agnosticism becomes an executable artifact (invariant 4).
```

- [ ] **Step 3: Fill every `<…>` from the real records** — no placeholders survive. One table row per *confirmed* finding, each carrying the literal command + exit code + evidence file:line.

- [ ] **Step 4: Verify no placeholders remain**

Run: `grep -nE '<one row|<…>|<N>|TBD|TODO' .claude/orchestrator-prompts/agnosticism-remediation/kickoff.md`
Expected: no matches (except the intentional `<N>` principle-slot in §4, which is assigned in Umbrella-2). If `<one row…>` remains, the table was not filled — fix.

- [ ] **Step 5: Commit (force-add if gitignored, per umbrella convention)**

```bash
git add -f .claude/orchestrator-prompts/agnosticism-remediation/kickoff.md
git commit -m "docs(agnosticism): Umbrella-2 remediation kickoff (audit deliverable)"
```

---

## Self-review (run after writing, before handoff)

- **Spec coverage:** §2 bar → Task 8 §1 posture-rewrite + severity rule. §4 harness → Tasks 1–2. §5 surfaces 1/4/6/7 → Tasks 4–5; surfaces 2/3/5 → Task 7. §6 phases → Phase 1/2/3. §7 discipline → Task 8 §3. §8 deliverable → Task 8. §9 self-reflexive → harness is bash (T15 satisfied: it runs without CC). All covered.
- **Placeholder scan:** the only intentional placeholders are the `<…>` fill-ins in Task 8's *generated* kickoff, gated by Step 4's grep. No placeholder code in Tasks 1–7.
- **Type/name consistency:** `cc_scrub`, `assert_cc_absent`, `record`, `RECORD_FILE` used identically across lib + every probe; `verdict` vocabulary (`PORTABLE`/`DEGRADED`/`CC-ONLY`/`PAID-RISK`) consistent lib→probes→aggregator→kickoff severity rule.

## Notes for the executor
- **Build-vs-reuse:** Tasks reuse the `tests/install-sh/*` provisioning pattern verbatim. No new dependency is added → none of these are *capability commits*, so no `Prior-art:` trailer is required (the pre-push gate only fires on capability commits per [CLAUDE.md](../../../CLAUDE.md)). If you add a dep, that commit needs the trailer.
- **Paired-negative:** principle 15 scans SKILL.md only, not `tests/**` — these bash tests are out of its scope. The anti-theatre seeded-break (Task 2) is the de-facto negative arm; keep it.
- **Run-now vs plan-only (spec §10):** Phases 1+3 + deterministic Phase 2 are cheap and run inline. Task 7's `/workflows` fan-out is the token-heavy step — that is the one to gate on an explicit operator go.
