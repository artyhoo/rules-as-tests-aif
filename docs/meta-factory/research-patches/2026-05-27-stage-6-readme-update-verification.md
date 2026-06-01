<!-- scope:stage-6-readme-update-verification -->
# Stage 6 README update — verification log

> **Date:** 2026-05-27.
> **Authoritative for:** verification trace for Stage 6 I-phase README edits (4 surgical sections: §«Is», §«Isn't», §«Roadmap signals», §«Installation»); T-trap walks (T-MA-A, T-Stage6-A, T15); §1.7 self-reflexive block; M-A umbrella closure status; deferred follow-up observations.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Stage 4 trim proposal — see [2026-05-27-stage-4-orchestrator-skill-trim.md](2026-05-27-stage-4-orchestrator-skill-trim.md). Stage 5 install.sh K-1 — see [2026-05-27-stage-5-install-sh-k1-verification.md](2026-05-27-stage-5-install-sh-k1-verification.md).

---

## §0 TL;DR

**What changed in README.md:**
1. **§«Is» (line 72):** replaced «companion to AI Factory + aif-handoff + Superpowers (today)» with universal-satellite framing — «universal satellite for Living Documentation enforcement — neutrally compatible with any companion stack».
2. **§«Isn't» (line 74):** replaced «(use AI Factory)…(use `aif-handoff`)» with companion-agnostic framing pointing to SSOT #56-#83.
3. **§«Roadmap signals» (line 78):** OhMyOpencode promoted from REFERENCE-only to ADOPT VOCABULARY (SSOT #83); microsoft/agent-framework stays REFERENCE-only.
4. **§«Installation» (lines 120-136 region):** added bullet 7 + new §«Optional companion install (K-1)» subsection with interactive/headless/tty-fallback descriptions, install.sh:line cites, and explicit VERIFIED-FREE note for `claude plugin install`.

**SKILL.md state at dispatch:** `wc -l ~/.claude/skills/orchestrator/SKILL.md` = **887** — Stage 4 trim NOT yet applied (maintainer-applied diff pending). §«Is» describes current shipped state: companion-aware orchestrator skill, Stage 4 ADAPT framing live on staging but trim not applied.

---

## §1 Method

**Source documents read:**

### Stage 4 final on staging
- `git show 05a1346 -- docs/meta-factory/research-patches/2026-05-27-stage-4-orchestrator-skill-trim.md` — confirms: §0 TL;DR SSOT rows #82-#83; D2 = OhMyOpencode Atlas/Prometheus row added to §2 vocabulary table (ADOPT VOCABULARY); D1 = `Skill('superpowers:foo')` imperative form; D3 = §17 headers removed. Artefact A = maintainer-applied diff (classifier self-protect). `wc -l SKILL.md = 887` confirms trim NOT applied.

### Stage 5 final on staging
- Current `install.sh` at SHA `c6e4c13` — verified key line ranges:
  - `install.sh:62-69`: COMPANIONS flag parse (`--companions=*` arg + `COMPANIONS="${COMPANIONS:-}"`)
  - `install.sh:337-338`: TTY fallback — `if [ -z "${COMPANIONS:-}" ] && [ ! -t 0 ]; then COMPANIONS="none"; fi`
  - `install.sh:371`: Superpowers `claude plugin install superpowers@claude-plugins-official --scope user`
  - `install.sh:411`: TaskMaster `claude plugin install claude-task-master@claude-plugins-official --scope user`

### Current README.md on staging (before edits)
- Sections read: lines 70-80 (§«What this project is and isn't»), lines 103-125 (§«Installation» Quick start)
- Line 72 confirmed: `companion to AI Factory + aif-handoff + Superpowers (today)`
- Line 74 confirmed: `(use AI Factory)` + `(use \`aif-handoff\`)`
- Line 78 confirmed: `OhMyOpencode + microsoft/agent-framework = REFERENCE-only`
- Lines 113-120 confirmed: 6-item setup.sh bullet list

---

## §2 Per-section change log

| Section (README:LINE) | Before (≤3 lines) | After (≤3 lines) | Cites |
|---|---|---|---|
| **§«Is» (line 72)** | «companion to AI Factory + aif-handoff + Superpowers (today) focused on Living Documentation enforcement…» | «universal satellite for Living Documentation enforcement — neutrally compatible with any companion stack (workflow frameworks, task orchestrators, methodology discipline tools).» | SSOT #83 (OhMyOpencode ADOPT VOCABULARY, Stage 4); universal-satellite vision (M-A umbrella kickoff 2026-05-27) |
| **§«Isn't» (line 74)** | «workflow framework (use AI Factory); task orchestration / swarm coordination (use `aif-handoff`)» | «workflow framework (multiple companions exist — see companion-target comparison and SSOT #56-#83); task orchestration / swarm coordination (see same SSOT)» | companion-target comparison `2026-05-16-companion-target-comparison.md`; SSOT rows #56-#83 |
| **§«Roadmap signals» (line 78)** | «OhMyOpencode + microsoft/agent-framework = REFERENCE-only (different lifecycle / problem class)» | «OhMyOpencode = ADOPT VOCABULARY (SSOT #83)…; microsoft/agent-framework = REFERENCE-only (different lifecycle / problem class)» | Stage 4 commit `05a1346`; SSOT #83 (OhMyOpencode Atlas+Prometheus) |
| **§«Installation» (lines 120+ region)** | 6-item bullet list ending with «Adds 13 npm scripts…»; no companion install mention | Added bullet 7 + §«Optional companion install (K-1)» subsection with interactive/headless/tty-fallback variants + install.sh line cites | Stage 5 commit `c6e4c13`; install.sh:62-69, 337-338, 371, 411 |

---

## §3 Stale-reference scan

```bash
$ grep -nE "Cline|Aider" README.md
38:AI agents (Claude, Cursor, Copilot, Aider) write plausible-looking code that **reliably violates undocumented conventions**.
```

**Assessment:** Line 38 is in §«Goal» problem-statement section, listing AI agents that write code. This is a different context from the deployment-surface or companion lists. PR #253 specifically removed Cline + Aider from the **deployment-surface list** (lines 8 + 74 + roadmap-signals Cline/Cursor/Codex/Aider sentence). Line 38's «AI agents (Claude, Cursor, Copilot, Aider)» is a pre-existing general reference and was not in PR #253 scope. No regression from Stage 6 edits.

```bash
$ grep -n "REFERENCE-only" README.md
78:...OhMyOpencode = ADOPT VOCABULARY (SSOT #83)…microsoft/agent-framework = REFERENCE-only…
```

Exactly **one hit** — microsoft/agent-framework only. OhMyOpencode no longer REFERENCE-only. ✅

```bash
$ grep -nE "OhMyOpencode" README.md
78:...OhMyOpencode = ADOPT VOCABULARY (SSOT #83)…
```

Present, shows ADOPT VOCABULARY. ✅

```bash
$ grep -nE "companion to AI Factory" README.md
# (no output — EMPTY)
```

EMPTY — universal-satellite framing replaces old companion-to-specific-project framing. ✅

```bash
$ grep -nE "install\.sh:[0-9]+" README.md
132:(install.sh:337-338)
136:…install.sh:62-69, tty fallback (install.sh:337-338), Superpowers install (install.sh:371), TaskMaster install (install.sh:411)
```

4 line-cite references. ✅

---

## §4 T-trap walks

### T-MA-A — «under-credit upstream / over-credit own-work»

**Walk §«Is»:** The new text reads «universal satellite for Living Documentation enforcement — neutrally compatible with any companion stack (workflow frameworks, task orchestrators, methodology discipline tools)». No specific companion named or credited. No «companion to X» framing. T-MA-A would have been triggered if the edit had retained «companion to AI Factory + aif-handoff + Superpowers» — that framing privileges named companions while excluding others with equal validity. The universal-satellite framing avoids this by describing what we do (Living Documentation enforcement) rather than who we depend on.

**Walk §«Isn't»:** Old text: «(use AI Factory); task orchestration / swarm coordination (use `aif-handoff`)». This directed users to specific companions by name in a comparative framing. T-MA-A violation: over-credits named companions as the only options. New text: «multiple companions exist — see companion-target comparison and SSOT #56-#83». Redirects to the full comparison matrix without privileging any one companion. ✅

**Walk §«Roadmap signals»:** The old text «OhMyOpencode + microsoft/agent-framework = REFERENCE-only» would have been under-crediting OhMyOpencode after Stage 4 promoted it to ADOPT VOCABULARY (SSOT #83). Keeping the stale REFERENCE-only label would have been T-MA-A in the opposite direction — under-crediting an upstream whose vocabulary we now formally adopt. The edit correctly promotes OhMyOpencode to ADOPT VOCABULARY while citing SSOT #83 as the evidence anchor. ✅

### T-Stage6-A — «doc-drift-from-implementation»

Mapping each README install-section claim to install.sh:line at staging SHA `c6e4c13`:

| README claim | install.sh anchor |
|---|---|
| «pass the `COMPANIONS` env var» | install.sh:62-69 (arg parse: `COMPANIONS="${COMPANIONS:-}"` + `--companions=*` handler) |
| «`COMPANIONS=all`, `COMPANIONS=none`, `COMPANIONS=superpowers,task-master`» | install.sh:344-401 (case statements on `${COMPANIONS:-}` for all/none/csv matching) |
| «when stdin is not a tty, `COMPANIONS` defaults to `none` automatically (install.sh:337-338)» | install.sh:337-338: `if [ -z "${COMPANIONS:-}" ] && [ ! -t 0 ]; then COMPANIONS="none"; fi` — exact match |
| «Superpowers install (install.sh:371)» | install.sh:371: `if ! claude plugin install superpowers@claude-plugins-official --scope user` |
| «TaskMaster install (install.sh:411)» | install.sh:411: `if ! claude plugin install claude-task-master@claude-plugins-official --scope user` |
| «`claude plugin install` is administrative file-management…VERIFIED-FREE per Stage 2 v3 §4.8» | Stage 2 v3 design at commit `f82a19c` (PR #255) §4.8: «`claude plugin install` = local file-copy (no API call, no billing)» |

All claims anchored. No drift risk identified. ✅

### T15 — self-application

Does this verification log apply its own framing to itself?

**§«Is» framing applied to this document:** This verification log is itself a document about Stage 6. Does it avoid privileging any companion in its prose? Scanning this document: no companion is named in the context of «use X» or «companion to X». References to «companion-target comparison» and «SSOT #56-#83» are references to matrices, not endorsements. Stage 4 and Stage 5 are referenced by their commit SHAs and artefact names. ✅

**Recursive check:** The verification log's §«Is» section (§0 TL;DR — «universal satellite for Living Documentation enforcement — neutrally compatible with any companion stack») describes what *README.md now says*, not what the log itself claims. The log's own authority scope is narrow (verification trace only). No companion-privileging in scope declaration. ✅

---

## §5 §1.7 self-reflexive block

### §1.7 Forward-check applied

| Constraint | Compliance | Evidence |
|---|---|---|
| `no-paid-llm-in-ci.md` — README install instructions must not describe API-billed LLM calls | ✅ | README K-1 section explicitly states «`claude plugin install` is administrative file-management (file copy + manifest registration into `~/.claude/`), **not** an API-billed LLM call. Verified VERIFIED-FREE per Stage 2 v3 §4.8.» Stage 5 install.sh:371+411 — no `ANTHROPIC_API_KEY`, no `claude -p` or `claude run`. `grep -nE "claude\s+(run\|code\|chat\|-p)\b" README.md` → EMPTY |
| `build-first-reuse-default.md §3` — companion references go through SSOT row, not direct praise | ✅ | §«Isn't» references «SSOT #56-#83» (the comparison matrix). §«Roadmap signals» cites «SSOT #83» for OhMyOpencode ADOPT VOCABULARY. No companion praised without SSOT backing |
| `doc-authority-hierarchy.md` — no rule files touched; scope-narrowing protects rule-header invariant | ✅ | `git diff origin/staging --stat` shows only 2 files: `README.md` + this verification log. No `.claude/rules/` edits. No `packages/core/principles/` edits |
| Universal-satellite: no companion privileged in §«Is» / §«Isn't» | ✅ | §«Is» line 72: «any companion stack (workflow frameworks, task orchestrators, methodology discipline tools)» — no company/project name. §«Isn't» references SSOT matrix, not named companions |

### §1.7 Backward-check applied

README updates derive from Stage 4 + Stage 5 final-merged content:
- Stage 4 commit `05a1346` (feat(orchestrator-skill-trim)) — provides SSOT #83 OhMyOpencode ADOPT VOCABULARY verdict. §«Roadmap signals» edit derives directly from D2 decision in this commit: «OhMyOpencode Atlas/Prometheus row added to §2 vocabulary table». Evidence: `git show 05a1346 --stat` includes `docs/meta-factory/research-patches/2026-05-27-stage-4-orchestrator-skill-trim.md` (597-line addition with §0 TL;DR table showing D2 resolved).
- Stage 5 commit `c6e4c13` (feat(install-sh-k1)) — provides K-1 install flow with `claude plugin install` commands. §«Installation» K-1 subsection derives directly from install.sh:62-69 (arg parse), install.sh:337-338 (tty fallback), install.sh:371 (Superpowers), install.sh:411 (TaskMaster). Every claim anchored to install.sh:line — verified per T-Stage6-A walk (§4).

Stage 6 README does NOT silently supersede Stage 4 or Stage 5 commits. It reads their shipped outputs as input and surfaces them to the README front-door. Falsifier: wrong if any README claim about install.sh is not anchored in install.sh:line on staging at SHA `c6e4c13` — per §4 T-Stage6-A walk, all claims are anchored. ✅

---

## §6 Out-of-scope / closeout

### Follow-up observation 1 (Artefact B deferred)
«I noticed CLAUDE.md might benefit from a Phase 4.5 conventions paragraph reflecting the Stage 4 trim — want me to do that as a separate follow-up?» Stage 4 shifts AI-tooling conventions inside `~/.claude/skills/orchestrator/SKILL.md`, but those changes are project-internal skill conventions, not project-internal CLAUDE.md conventions consumers must know. Deferred per CLAUDE.md «PR strategy» (separate systemic issue, not within Stage 6 scope).

### Follow-up observation 2 (Artefact C deferred)
«I noticed `no-paid-llm-in-ci.md` could mention `install.sh`'s `claude plugin install` calls as VERIFIED-FREE per Stage 2 v3 §4.8 — want me to do that as a separate rule-edit umbrella?» This would extend a Class A rule (principle test `17-no-paid-llm-in-ci.test.ts` exists) beyond its current deterministic grep scope — per Reviewer B's B2 finding from Phase -1 cold review, extending a Class A rule beyond test scope creates rule/test divergence and needs a separate decision (promote the principle test's grep surface first, then extend the rule). Deferred.

### Follow-up observation 3 (T-MA-A canonical promotion)
«T-MA-A («under-credit upstream / over-credit own-work») appeared in Stage 1, Stage 2, Stage 3, Stage 4, Stage 5, AND Stage 6 of the M-A umbrella — 6 consecutive stage instances. Per `ai-laziness-traps.md §5`: «when 2+ wave-specific T-additions describe structurally the same failure mode, abstract and add to §2». T-MA-A qualifies for canonical promotion. T20 is reserved for Stryker future-bump per memory note. T-MA-A would slot as T22 or later (T20 = inline-verdict-without-evidence; T21 = reserved for Stryker). Surface as separate rule-edit umbrella.»

### Stage 4 ATTN items (not resolved by Stage 6)
- ATTN-1 (Phase 4.5 trim acceptance): SKILL.md trim diff is maintainer-applied; Stage 6 README does NOT claim Phase 4.5 outcome resolved. SKILL.md line count at dispatch = 887 (trim pending).
- ATTN-2 (Skill notation): Stage 4 research-patch §7 ATTN-2 status unchanged.
- ATTN-3 (Phase 4.5a/4.5b ambiguity): Stage 4 research-patch §7 ATTN-3 status unchanged.

### M-A umbrella closure

Stage 6 is the final stage. All 6 stages shipped on staging:
- Stage 1: PR #254 (orchestrator skill audit R-phase)
- Stage 2: PR #255 (v3 design — universal satellite integration matrix)
- Stage 3: PR #256 (living-doc neutral injection)
- Stage 4: PR #257 (orchestrator skill trim + SSOT #82-#83)
- Stage 5: PR #258 (install.sh K-1 companion-install prompts)
- Stage 6: this PR (README universal-satellite positioning + K-1 install flow)

All stages on staging; maintainer merges staging→main.

---

## §7 See also

- [Stage 4 PR #257 research-patch](2026-05-27-stage-4-orchestrator-skill-trim.md) — SSOT #83 OhMyOpencode ADOPT VOCABULARY source
- [Stage 5 PR #258 verification](2026-05-27-stage-5-install-sh-k1-verification.md) — K-1 install.sh implementation
- [Stage 2 v3 PR #255](2026-05-27-universal-satellite-integration-matrix.md) — universal-satellite framing design
- [Stage 1 PR #254](2026-05-27-orchestrator-skill-audit.md) — orchestrator skill audit origin
- [companion-target comparison](2026-05-16-companion-target-comparison.md) — SSOT #56-#83 matrix
