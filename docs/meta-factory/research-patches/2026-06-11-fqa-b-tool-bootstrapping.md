<!-- scope:final-quality-audit-s1-b -->
# FQA S1-B — tool-bootstrapping automation deep audit (read-only R-phase)

> **Scope:** final-quality-audit, Stage 1, sub-wave B. READ-ONLY research patch — the only file created. No fixes applied (T-FQA-C honoured).
> **Audited surface:** `skills/tool-bootstrapping/**` · `.claude/hooks/deps-hash-check.sh` + `packages/core/hooks/deps-hash-check.sh` (`@dual-pair: deps-hash-check-dogfood`) · install-time bootstrap path (`./setup` → `install.sh` + `setup.d/*`) · `.ai-factory/tool-decisions.md` lifecycle.
> **Verdict in one line:** **P1 CONFIRMED (BLOCKER)** — the deps-change re-evaluation automation is **dead on the main install path**; the detector (hook) is wired but the state file it reads is never seeded. **P3 CONFIRMED (MAJOR)** — `SKILL.md` (2026-05-11) carries a broken `context7`-via-`setup.sh` recursive-bootstrap contract plus stale companion refs.

---

## §population

Enumerated BEFORE sampling (T10). The audited chain has **7** artefacts + **2** install entry points + **2** guarding test instruments:

| # | Artefact | Role in chain | LOC / state |
|---|---|---|---|
| 1 | `skills/tool-bootstrapping/SKILL.md` | discipline doc (6 rules) | 63 lines, last substantive commit `b1e9c5e` **2026-05-11** |
| 2 | `skills/tool-bootstrapping/references/decision-format.md` | cold ref — state-file schema | 66 lines |
| 3 | `skills/tool-bootstrapping/templates/tool-decisions.md.template` | the state-file starter | 28 lines |
| 4 | `.claude/hooks/deps-hash-check.sh` | detector (dogfood copy) | 49 lines |
| 5 | `packages/core/hooks/deps-hash-check.sh` | detector (SHIPPED source, `install.sh:259`) | 49 lines — **byte-identical** to #4 |
| 6 | `.ai-factory/tool-decisions.md` | **the state file** (per-consumer) | **never created on the live path** |
| 7 | `packages/core/audit-self/audit-ai-docs.sh` (+`.ts`) | self-audit that flags #6 missing | warn-only |
| E1 | `setup` → `install.sh` + `setup.d/*` | **live** install path | seeds #6: **NO** |
| E2 | `setup.sh` | **legacy** (README.md:127 "superseded by `./setup`") | seeds #6: yes (dead path) |
| G1 | `packages/core/principles/09-doc-authority-hierarchy.test.ts:139` | SHIPPED_DOCS drift gate | green |
| G2 | `packages/core/hooks/deps-hash-check.test.ts` | hook unit test | green |

The chain is: **deps change → hook recomputes hash → mismatch vs state-file `deps-hash:` → WARN on stdout → user runs `/tool-bootstrapping` → skill reads state file → re-proposes.** Link #6 (the state file) is the single point of failure: absent it, the hook short-circuits at line 20.

---

## §probes

Each probe: command + **verbatim** output (T2 — designing a probe ≠ running it; T3 — no prose-only findings).

### Probe P1 — post-install state is dead-on-arrival

Simulated the exact state `install.sh` produces: hook copied + `package.json` present + `.ai-factory/` created, but **no `tool-decisions.md` seeded**.

```text
$ # throwaway dir: hook + package.json + empty .ai-factory/ (== install.sh output)
$ ls -la .ai-factory/
total 8
drwxr-xr-x 2 node node 4096 .
drwx------ 4 node node 4096 ..
$ bash .claude/hooks/deps-hash-check.sh </dev/null ; echo "exit=$?"
exit=0          # stdout EMPTY
```

`deps-hash-check.sh:20` → `[ -f "$DECISIONS" ] || exit 0`. No state file ⇒ silent exit ⇒ the WARN can never fire ⇒ **the whole re-evaluation loop is unreachable on a fresh install.**

### Probe 1 — chain liveness (the chain works ONCE the state file exists)

Same throwaway dir, but this time seed `tool-decisions.md` from the **shipped template** and stamp the deps-hash exactly as the hook / legacy `setup.sh:273-276` compute it.

```text
$ # 1a — state file seeded, hash MATCHES current deps
$ grep '^deps-hash:' .ai-factory/tool-decisions.md
deps-hash: sha256-31769fa0e125beba0df03684d2b164431f40851ccb6f1a4ba67ca2bfeb9d3a15
$ bash .claude/hooks/deps-hash-check.sh </dev/null ; echo "exit=$?"
exit=0          # stdout EMPTY → correct: hash matches, silent

$ # 1b — add a dependency (zod) → hash MISMATCH
$ bash .claude/hooks/deps-hash-check.sh </dev/null ; echo "exit=$?"
⚠ package.json deps changed since last tool-bootstrap — run /tool-bootstrapping to re-evaluate
exit=0          # WARN fires on stdout
```

**Conclusion:** the detector logic is fully correct. The chain goes live the instant the state file exists. The defect is purely the **missing seed step** — nothing in the detector, template, or schema is broken.

### Probe 2 — install-time bootstrap (P1 root cause, mechanical)

```text
$ grep -niE 'tool-decision|tool-bootstrap|context7|ai-factory init' setup ; echo "rc=$?"
rc=1            # (none)
$ grep -rniE 'tool-decision|tool-bootstrap|context7|ai-factory init' setup.d/ ; echo "rc=$?"
rc=1            # (none)
$ grep -niE 'tool-decision|tool-bootstrap|context7' install.sh
105:  "skills/tool-bootstrapping/SKILL.md"          # SHIPPED_DOCS entry (delivery, not seed)
106:  "skills/tool-bootstrapping/references/decision-format.md"
220-232: copies skills/tool-bootstrapping/ → .claude/skills/  (delivery, not seed)
# → ZERO seed of .ai-factory/tool-decisions.md; ZERO context7 install
```

Sole creator of the state file in the entire repo (adversarial grep, §adversarial below) is **legacy `setup.sh:260-287`** — the prior art:

```text
setup.sh:255  # ───── Tool-bootstrapping baseline ─────
setup.sh:256  header "Step 2d/5 — Tool-bootstrapping baseline"
setup.sh:261  TOOL_DECISIONS="$PROJECT_DIR/.ai-factory/tool-decisions.md"
setup.sh:268    TEMPLATE="$PKG_DIR/skills/tool-bootstrapping/templates/tool-decisions.md.template"
setup.sh:270    mkdir -p "$PROJECT_DIR/.ai-factory"
setup.sh:271    cp "$TEMPLATE" "$TOOL_DECISIONS"
setup.sh:273-276  # stamp current deps-hash into frontmatter (sha256sum/shasum branch)
setup.sh:289-307  # add context7 to .mcp.json (jq merge) — "recursive bootstrap stage 1"
```

`install.sh` already owns `.ai-factory/` **template file-deploy** at lines 308-328 (DESCRIPTION, ARCHITECTURE, RULES, skill-context). The tool-decisions seed is the *same kind of operation* and was simply not carried over when `setup.sh` was demoted to legacy. Fix-design in §fix-design.

### Probe 3 — SKILL.md currency, line-by-line

Tested every command / path / trigger / hook-claim against today's reality.

```text
$ git show -s --format='%ci %h' b1e9c5e
2026-05-11 18:33:20 +0300 b1e9c5e        # SKILL.md is the oldest shipped artefact in scope
$ ls skills.sh ; echo "rc=$?"
ls: cannot access 'skills.sh': No such file or directory
rc=2
$ grep -rniE 'setup\.sh' skills/tool-bootstrapping/
SKILL.md:53:  "...`setup.sh` installs `context7` unconditionally before rule 2 can run..."
references/decision-format.md:26:  "...`auto` for `setup.sh`-installed tools (e.g. context7)."
references/decision-format.md:49:  "| context7 | MCP | auto | setup.sh baseline — recursive bootstrap stage 1 |"
templates/tool-decisions.md.template:15:  "| context7 | MCP | auto | setup.sh baseline — ...recursive bootstrap stage 1 |"
$ grep -rniE 'context7' setup setup.d/ install.sh ; echo "rc=$?"
rc=1            # context7 installed NOWHERE on the live path
```

Per-line currency verdict in §fix-design (P3 stale list).

### Probe 4 — decision-memory semantics survive the harness, but the loop is P1-gated

```text
$ ls -d .claude/skills/tool-bootstrapping/ skills/tool-bootstrapping/   # /tool-bootstrapping resolves
.claude/skills/tool-bootstrapping/   skills/tool-bootstrapping/
$ ls -d .claude/skills/aif/ .claude/skills/pipeline/                    # /aif + /pipeline resolve
.claude/skills/aif/   .claude/skills/pipeline/
$ grep -n 'tool-decisions.md missing' packages/core/audit-self/audit-ai-docs.sh
217:  warn "$RULE — .ai-factory/tool-decisions.md missing; run setup.sh or /tool-bootstrapping to seed"
```

The documented flows — rejected-tools memory, `Re-eval trigger` discipline (`decision-format.md §Rejected`), bulk-confirm, `decision-format.md` cross-link from `SKILL.md:45/61` — are **internally consistent and harness-compatible**: `/tool-bootstrapping` and `/aif` both resolve as skills, the WARN names a real command, and the schema reference exists. **But the entire re-evaluation loop is dead-gated behind P1:** Rule 5's WARN is the one mechanical trigger, and it never fires because the state file is never seeded. The self-audit (`audit-ai-docs.sh:217`) *does* detect the missing file — but its remediation text points at legacy `setup.sh` (stale).

---

## §findings

| ID | Severity | File:line | Finding |
|---|---|---|---|
| **P1** | **BLOCKER** | `setup` (all), `setup.d/*` (all), `install.sh` (no seed) vs `setup.sh:260-287` | Tool-bootstrapping re-evaluation automation is **dead on the live install path**. `install.sh` wires the detector hook (`install.sh:259-285`) but never seeds `.ai-factory/tool-decisions.md`; `deps-hash-check.sh:20` then short-circuits to silent `exit 0` forever. Proven by Probe P1 (silent) vs Probe 1 (live once seeded). The seed existed only in legacy `setup.sh`, which `./setup` does **not** call. |
| **P3** | **MAJOR** | `SKILL.md:53` (+ `decision-format.md:26,49`, `template:15`) | `SKILL.md §3` asserts `setup.sh` installs `context7` "unconditionally … assumed present" as Rule 2's recursive-bootstrap stage 1. `setup.sh` is legacy (README.md:127) and the live path installs `context7` **nowhere** (Probe 3). Rule 2 therefore assumes a precondition the installer no longer establishes. Schema ref + template repeat the stale `setup.sh baseline` provenance for the `context7 | auto` row. |
| **F-A** | **MAJOR** | `audit-ai-docs.sh:217`, `audit-ai-docs.ts:311` | The self-audit is the **only** instrument that detects P1's symptom (warns "tool-decisions.md missing") — but its remediation text "run setup.sh or /tool-bootstrapping to seed" points at the legacy/dead path. Right detection, wrong (stale) fix advice; warn-only, never blocks. |
| **F-B** | **MAJOR (meta)** | `09-doc-authority-hierarchy.test.ts:139`; `deps-hash-check.test.ts:75,148` | **Which instrument missed P1 and why** (T13/T16). (1) The SHIPPED_DOCS gate (G1) asserts the skill *docs are copied* — it pattern-matches on **delivery**, not **liveness**; a delivered SKILL.md with a dead chain passes. (2) The hook unit test (G2) **fabricates** the state file it needs (`writeFileSync(... 'tool-decisions.md' ...)` at line 75) and even enshrines the broken state as a PASS: `it('SKIP: no .ai-factory/tool-decisions.md → silent exit 0')` (line 148). The hook was ADOPTED-as-correct in isolation; no instrument tests the **install→seed→detect** integration, so unit-green coexisted with chain-dead. This is the exact T-FQA-B trap: "hook wired ⇒ automation works" is false. |
| **F-C** | **MINOR** | `SKILL.md:25,29,33,37` | Rules 1-4 delegate to "AIF `/aif`" + "`skills.sh` vocabulary (`npx skills search`)". `/aif` still resolves, but the monolithic `/aif` has since fanned out into `aif-plan/aif-review/...` sub-skills, and `skills.sh` is an external AIF CLI not verifiable in-repo. **INCONCLUSIVE-needs-human:** confirm the `npx skills` vocabulary against the current AIF release before relying on it (not asserted broken). |
| **F-D** | **MINOR** | `SKILL.md:13`, `template:8` | "after running `install.sh`, this skill auto-triggers" / "Run AIF `/aif` to populate the first bootstrap" — entry point is now `./setup` (install.sh is the advanced/direct path), and "first bootstrap" implies a seed the live path doesn't perform. Wording predates `./setup`, skill-context delivery (C-1, 2026-05-20), the `/pipeline` rename (2026-06-03). |

**Not-broken (currency confirmed):** `SKILL.md:41` Rule 5 ("UserPromptSubmit hook configured in `.claude/settings.json` after Wave 5.3 install") — accurate, `install.sh:266-285` wires it. WARN target `/tool-bootstrapping` — resolves. The two hook copies are byte-identical (no `#two-prompts-drift`).

---

## §fix-design

> S1 is read-only. This section DESIGNS the fix; it is NOT applied (T-FQA-C). I-phase owns implementation.

### P1 — recommended fix shape (clear winner) + falsifier

**Recommendation:** seed `.ai-factory/tool-decisions.md` from the shipped template **inside `install.sh`**, co-located with the existing `.ai-factory/` template-deploy block (`install.sh:308-328`), mirroring legacy `setup.sh:260-287`.

**Why this placement wins on the merits (not a fork):**
- The one-click spec mandates `install.sh` = "framework-**file-deploy** only" (`2026-05-31-one-click-installer-design.md §6`). Copying a static template into `.ai-factory/` **is** file deploy — identical in kind to the DESCRIPTION/ARCHITECTURE/RULES seeds already at lines 308-328.
- `setup.d/` is the **companions** layer (external tools via their own installer, per `companion-install-principle.md`) — wrong layer for an own-artefact file seed.
- **First-run-skill-seeds was considered and rejected** as the primary mechanism: it is circular — Rule 5's WARN (the only mechanical trigger) is itself gated on the state file existing, and nothing tells a fresh consumer the skill exists. An install-time seed is the only non-circular fix. (The skill MAY still re-seed/populate on invocation — complementary, not a substitute.)
- Prior art: the seed lived in `setup.sh` (the install script), i.e. the install.sh-equivalent — same home.

**Falsifier:** *This fix is wrong if,* after a real `bash install.sh ts-server` into a clean dir, **either** `.ai-factory/tool-decisions.md` does not exist, **or** re-running Probe 1 (seed present → add a dep → run hook) does **not** emit the WARN. Re-run Probes P1+1 against the actual `install.sh` output to verify.

**Companion stale-advice fix (F-A):** in the same I-phase, update `audit-ai-docs.sh:217` / `.ts:311` remediation text from "run setup.sh" → the live path (`./setup` / `install.sh`, or `/tool-bootstrapping`).

### P1 — sub-decisions that are GENUINE FORKS → parked as DECISION-NEEDED

Per dispatch fork discipline + `recommendation-laziness-discipline.md §3` (fork-surfacing): these have no determinate winner on the project's merits and must be decided by the maintainer / I-phase orchestrator, not guessed here.

- **DECISION-NEEDED #1 — hash-stamping policy at seed time.**
  - *Option A* (stamp the real deps-hash at install, as `setup.sh:273-280` did) → silent until deps change. **But** `install.sh` is deploy-only and runs *before* `npm install -D` (README.md:125), so `package.json` deps are often incomplete/absent at seed time → the stamped hash is stale-from-birth and the WARN fires on the first real dep-add regardless.
  - *Option B* (copy the template verbatim with the literal `deps-hash: <pending>` sentinel) → the hook WARNs **every session** until the consumer runs `/tool-bootstrapping` (which stamps the real hash) → louder, self-correcting onboarding nudge; no node/package.json dependency at install.
  - Consequence split: A = quiet-by-default but assumes deps settled at install (often false on the new deploy-before-deps flow); B = nudge-by-default but noisy until first bootstrap. Taste/strategy call — maintainer decides.

- **DECISION-NEEDED #2 — restore the `context7` "recursive bootstrap stage 1" guarantee, or drop it?** (resolves P3's root cause)
  - *Option A* — add an `mcp` kind to `setup.d/companions.manifest` + engine and route `context7` there (honours `companion-install-principle.md`: official installer, detect-first, no pin). Cost: manifest schema + engine change; `context7` (an MCP added to `.mcp.json`) does not cleanly fit the current `cc-plugin` / `external-service` kinds.
  - *Option B* — restore the legacy `.mcp.json` jq-merge (`setup.sh:289-307`) into `install.sh`. Cost: mutating `.mcp.json` stretches "file-deploy only".
  - *Option C* — drop the unconditional guarantee; rewrite `SKILL.md §3` so `context7` is a **proposed** (not assumed-present) tool. Cost: changes the skill's recursive-bootstrap contract.
  - Touches the manifest schema AND the skill's design contract → maintainer decision. **Until resolved, P3's `SKILL.md:53` cannot be safely rewritten** (the correct wording depends on which option lands).

### P3 — per-line stale list (for the I-phase doc-fix, once DN-#2 resolves)

| File:line | Stale claim | Corrected reality |
|---|---|---|
| `SKILL.md:53` | "`setup.sh` installs `context7` unconditionally … assumed present" | Live path installs `context7` nowhere; rewrite per DN-#2 outcome |
| `SKILL.md:13` | "after running `install.sh`, this skill auto-triggers" | Entry point is `./setup`; `install.sh` is the direct/advanced path |
| `SKILL.md:25,29,33,37` (F-C) | "Delegate to AIF `/aif`" + "`skills.sh` vocabulary" | Verify `npx skills` vocab + `/aif` fan-out vs current AIF release (INCONCLUSIVE-needs-human) |
| `decision-format.md:26,49` | "`auto` for `setup.sh`-installed tools" / "setup.sh baseline" | Provenance is the install-time seed, not `setup.sh` |
| `template:15` | "context7 | MCP | auto | setup.sh baseline …" | Same — update provenance per DN-#2 |
| `template:8` (F-D) | "Run AIF `/aif` to populate the first bootstrap" | Seed is install-time; clarify what populates `deps-hash` |

---

## §adversarial-counter-prompt

Ran the category-level counter-prompt (T7): *"What did I miss — a seeder, a category, or a wrong assumption?"*

1. **"Is there another seeder I didn't grep?"** — Ran `grep -rniE 'tool-decisions\.md' --include='*.sh' --include='*.ts' --include='SKILL.md'` filtered to create/copy/seed verbs:
   ```text
   setup.sh:260,263,266,282,284   ← legacy seeder (dead path)
   audit-ai-docs.sh:217 / .ts:311 ← detector + stale remediation, NOT a seeder
   ```
   No other seeder exists. P1 holds.

2. **"Is 'no seed' actually by-design — the skill seeds on first run, so install.sh shouldn't?"** — The strongest counter-argument. Rebutted in §fix-design: the skill's only mechanical trigger (Rule 5 WARN) is itself state-file-gated (circular), and the description-match onboarding triggers don't reliably fire on a fresh consumer who doesn't know the skill exists. Even if the skill *could* seed on invocation, the install leaves the one mechanical nudge dead. So install-time seeding is still required. Recorded the first-run path as complementary, not a substitute — not silently dismissed.

3. **"Did I conflate delivery with liveness myself?"** — Checked: my P1 claim rests on Probe P1 (mechanical, state-file absent → silent) + Probe 1 (mechanical, state-file present → WARN), not on the SHIPPED_DOCS gate. I did not repeat the F-B instrument's own error.

4. **"Is the hook maybe wired somewhere else that DOES create the file?"** — `install.sh:266-285` only registers the hook command in `settings.json`; it does not create `.ai-factory/tool-decisions.md`. Confirmed in Probe 2 grep.

No missed category surfaced that changes the verdict. One refinement banked: F-A (the self-audit *does* flag the symptom) means P1 is detectable post-install by a consumer who runs the self-audit — but only warn-level, with stale remediation.

---

## §coverage

- **Probes run:** 5/5 mechanical (P1, 1, 2, 3, 4) — every finding carries command-output or file:line evidence; **zero prose-only findings** (T3 honoured).
- **Population enumerated before sampling** (T10): 7 artefacts + 2 entry points + 2 test instruments; all 7 artefacts opened and read line-by-line (not sampled — small enough for full census, beats T1 floor).
- **Dual-pair check** (T16 / `#two-prompts-drift`): the two `deps-hash-check.sh` copies confirmed byte-identical; SKILL.md ↔ hook de-facto pair checked claim-by-claim (Rule 5 accurate; §3 context7 claim stale).
- **Instruments named** (T13/F-B): both green guards identified (SHIPPED_DOCS gate pattern-matches delivery; hook unit test fabricates the state file + enshrines the dead state as a PASS) — neither tests install→seed→detect integration.
- **Forks parked, not guessed** (dispatch fork discipline): placement of the seed = clear winner (install.sh, evidenced); hash-stamping policy + context7 restoration = 2 genuine forks → DECISION-NEEDED #1/#2.
- **Confidence:** P1 = very high (two complementary mechanical probes, sole-seeder grep). P3 = high (live-path grep empty + README legacy designation). F-C = INCONCLUSIVE-needs-human (external AIF CLI not in-repo). Calibration: first run of this audit on this surface; no prior baseline.
- **Out of scope / not done:** did not run a real end-to-end `install.sh` into a clean dir (the falsifier defers that to I-phase verification); did not audit AIF's `skills.sh` external CLI (not in repo). No fixes applied (read-only).
