<!-- scope:superset-adopt-survey -->
# Research patch — `superset-sh/superset` build-vs-reuse survey

> **Class:** R-phase deliverable (research-patch). No code changes; no hook/skill files written; verdict only (T5).
> **Authoritative for:** the build-vs-reuse verdict on adopting `superset-sh/superset` (Superset) as this project's worktree-dispatch / env-setup substrate, the T16 problem-class analysis, the per-aspect comparison vs 2 alt-targets + the PR #279 baseline, and the I-phase / re-evaluation sketch.
> **NOT authoritative for:** project goal (see [README.md#why-this-exists](../../README.md#why-this-exists)); whether the **maintainer personally** uses Superset as a terminal/GUI (a personal-workflow choice, not a project capability commit); the eventual disposition of Bug 1 (worktree-create-dual-channel) — this patch only establishes whether Superset ADOPT moots it.
> **Origin:** 2026-05-30. Trigger fired: `dispatch-worktree-automation` umbrella merged ([PR #279](https://github.com/Yhooi2/rules-as-tests-aif/pull/279) + [#282](https://github.com/Yhooi2/rules-as-tests-aif/pull/282) + [#284](https://github.com/Yhooi2/rules-as-tests-aif/pull/284) + retro #285), satisfying the gate condition recorded in memory `superset-adopt-survey-deferred`. Maintainer 2026-05-30 framing on queued Bug 1: «А это вообще нужно если я буду работать из superset-sh/superset?». Predecessor coverage-gap: [PR #271](https://github.com/Yhooi2/rules-as-tests-aif/pull/271) R-phase did not include Superset (legitimate reopen per [phase-research-coverage.md §1.6](../../.claude/rules/phase-research-coverage.md)).
> **Tags:** `#superset` · `#swarm-orchestration` · `#build-vs-reuse` · `#worktree-substrate`

---

## §1 Origin / pre-context

Memory `superset-adopt-survey-deferred` (2026-05-29) recorded Superset as a **provisional ADOPT-track candidate** for swarm-orchestration substrate, with the survey explicitly deferred to a post-merge umbrella (maintainer Path 2: «лучше сделать чтобы было что переоценивать потом» — keep [PR #279](https://github.com/Yhooi2/rules-as-tests-aif/pull/279) hook+test as a concrete comparison baseline).

The 2026-05-30 sequencing decision: maintainer flagged that if the project (or the maintainer's daily workflow) moves to Superset, the queued **Bug 1** (`worktree-create-dual-channel` — fix the `WorktreeCreate` hook's stale-base-ref behaviour) might be **moot** because Superset's `.superset/config.json:setup` would own the worktree-env-setup mechanism. Bug 1 was **paused pending this verdict**. This R-phase resolves: *does Superset ADOPT moot Bug 1, or merely sidestep it?*

**T20 note:** memory's «provisional pre-survey lean = ADOPT-track candidate» is **NOT load-bearing backing**. This patch re-gathered fresh evidence (DeepWiki ×4 phrasings, WebSearch ×4, 6 PR bodies, SSOT grep) per T12 and does **not** inherit the memory lean.

---

## §2 Survey results — BFR §3 6-layer

Each claim carries a DeepWiki excerpt, a WebSearch URL, or a file:line (T3).

### Layer 1 — SSOT consult ([prior-art-evaluations.md](../prior-art-evaluations.md))

- `grep -nic "superset" docs/meta-factory/prior-art-evaluations.md` → **0** (command output, 2026-05-30). The prior "0/84 hits" memory evidence **CONFIRMED** — Superset is not in the SSOT. The two grep hits in the broader `superset|swarm|multi-agent worktree` pattern (lines 110, 112) matched **"swarm"** (Phase 10 swarming, aif-handoff `@aif/mcp` row #44), not "superset".
- → New SSOT row proposed in §10 (row **#86**; current max id on `origin/staging` = **#85**, verified `grep -oE "^\| [0-9]+ \|" … | sort -n | tail`).

### Layer 2 — DeepWiki on `superset-sh/superset` (4 phrasings)

| # | Phrasing | Key finding (excerpt) |
|---|---|---|
| P1 | `.superset/config.json` schema + lifecycle | Schema `{ "setup": ["…"], "teardown": ["…"] }`, arrays of shell commands. `setup` runs on workspace **create** (`loadSetupConfig` → `initialCommands`); `teardown` on **delete** (`runTeardown`). Resolution order: user-override `~/.superset/projects/<id>/config.json` → worktree `<wt>/.superset/config.json` → project `<repo>/.superset/config.json` (first-found wins, no merge). `config.local.json` (gitignored) can `before`/`after`-merge. Env vars: `SUPERSET_ROOT_PATH`, `SUPERSET_WORKSPACE_NAME`. **`config.json` is committed to the repo**; `config.local.json` is not. [DeepWiki](https://deepwiki.com/search/show-the-supersetconfigjson-or_dc63d7d2-c8fc-400f-b3c4-e1af3e4c903f) |
| P2 | CLI surface / headless / license / where `claude` runs | **License = Elastic License 2.0 (ELv2)** (source-available, *not* OSI-open). Headless-capable via MCP server (`start_agent_session`, create-worktree). `claude` is invoked via a **workspace-specific `bin/` wrapper** prepended to `PATH` (`~/.superset-{workspace}/bin/`) that injects notification hooks — **wraps the operator's local binary, not an internal API/proxy**. [DeepWiki](https://deepwiki.com/search/what-is-the-superset-cli-comma_484b5e94-7e0e-4d11-abf1-6fe15a50d1f0) |
| P3 | Maturity / version / runtime / OS | Desktop app **v1.2.0** (≥1.0). Bun **v1.0+** runtime+pkg-manager. Stable on `desktop-v*` tags; **canary every 12 h** (cron). OS: macOS fully tested; **Linux builds tested** (AppImage + auto-update yml) — *refines* the 2026-05-29 "Linux untested" memory; Windows still README-listed "untested" but `electron-builder.ts` has a Windows path. [DeepWiki](https://deepwiki.com/search/how-mature-is-the-project-rele_f4fae049-ed8f-4094-9c39-e711cf51456b) |
| P4 | Interactive vs headless agent spawn + billing | Agents launch **interactively in a terminal pane** (`buildAgentPromptCommand` → terminal kind), **not** `claude -p`/SDK headless. Superset «does not proxy any API calls or provide its own API keys … you provide your own keys and manage billing directly with the providers». [DeepWiki](https://deepwiki.com/search/when-superset-starts-a-coding_3c67f472-ce67-4d9c-b014-c730c71b14d0) |

### Layer 3 — WebSearch (4 phrasings) — alt-targets surfaced

- `multi-agent CLI orchestration git worktrees parallel claude code` → **ccswarm** (nwiizo), **ComposioHQ/agent-orchestrator**, **Claude Squad**, CC **Agent Teams** (native). [results](https://github.com/nwiizo/ccswarm)
- `parallel claude code sessions worktree manager tool 2026` → **CC native** `--worktree` flag first-class since **v2.1.50** (worktrees in `.claude/worktrees/`, dedicated branch); Apr 14 2026 desktop redesign added multi-session sidebar + Git-worktree isolation. [Claude Code Docs — worktrees](https://code.claude.com/docs/en/worktrees)
- `orchestrate codex cursor claude agents simultaneously worktree GUI` → **Superset** ("works with any CLI agent … Git worktrees for isolation"), **Conductor** (macOS, Claude-only), **T3 Code** (Theo Browne, OSS), **dux** (TUI), **async-code**. [The New Stack](https://thenewstack.io/ai-coding-tool-stack/), [aitoolly: Superset 2.0](https://aitoolly.com/product/superset-2-0)
- `oh-my-openagent github …` → **`code-yeongyu/oh-my-openagent`** (omo, formerly oh-my-opencode), OpenCode multi-agent **harness** (Prometheus/Atlas/Sisyphus), 48k★, v3.11.0. [GitHub](https://github.com/code-yeongyu/oh-my-openagent)
- ≥3 candidates considered per BFR §3 `#vendor-lock-by-convenience`: Superset, ccswarm, Conductor, Claude Squad, T3 Code, dux, **CC-native Agent Teams + `claude -w`** (the decisive one — see §3/§4).

### Layer 4 — adjacent SSOT precedents

- **#20** CC hooks API (ADOPT, `prior-art-evaluations.md:88`) — the `WorktreeCreate` hook (PR #279) is delivered through this already-adopted channel. Superset's setup-script is a *parallel* delivery mechanism that only exists if Superset is installed → strictly narrower reliability class (see Layer 6).
- **#65** Superpowers `using-git-worktrees` (REFERENCE, `prior-art-evaluations.md:133`) — the project already REFERENCEs a mature pure-git worktree-isolation precedent. Superset would be a *second*, heavier (Electron+Bun+GUI) precedent for the same pattern → no new capability.
- **#43** aif-handoff `@aif/runtime` RuntimeAdapter (ADOPT-VOCABULARY, `prior-art-evaluations.md:111`) — provider-neutral runtime abstraction; orthogonal layer (runtime adapter, not worktree/GUI). Superset neither extends nor replaces it.
- **Conclusion:** Superset **overlaps** #65 (worktree isolation — already covered) and **partially overlaps** #20 (env-setup delivery — already covered, better). It **replaces nothing** load-bearing.

### Layer 5 — channel-delivery analysis ([rule-enforcement-channel-selection.md §4](../../.claude/rules/rule-enforcement-channel-selection.md))

The worktree-env-setup capability's **delivery reliability** under each option:

| Delivery | Fires when | Standing dependency | Reliability class |
|---|---|---|---|
| **`WorktreeCreate` hook** (`.claude/hooks/worktree-setup.sh`, PR #279) | `claude -w <name>` in any CC session | CC harness only (already present) | deterministic, harness-native + pre-push/CI backstoppable |
| **Superset `.superset/config.json:setup`** | only if **Superset is installed** (Electron app, Bun, macOS-primary) on the operator's machine | Superset install + Bun runtime | deterministic **but tool-installed-gated** — strictly narrower |

Adopting Superset's setup-script as the canonical mechanism would **downgrade** the capability from "fires in any CC session" to "fires only on a Superset-equipped macOS+Bun machine". For an AI-agnostic substrate shipped to consumers via `install.sh`, that is a regression in reachability.

### Layer 6 — no-paid-LLM-in-CI ([no-paid-llm-in-ci.md §1-§2](../../.claude/rules/no-paid-llm-in-ci.md)) — **T-SS-B**

**PASS.** Superset launches agents **interactively in a terminal pane** using the operator's own subscription `claude` (DeepWiki P4) and **does not proxy API calls or supply keys** (P2/P4). This is the §2 "out of scope: session-bound LLM use (operator running `claude` CLI)" case — subscription-bundled, not paid-API. **Nuance:** because Superset uses interactive terminal launch (not `claude -p`/SDK headless), the **June 15 2026 metered-credit-pool** change for headless usage surfaced in [PR #286](https://github.com/Yhooi2/rules-as-tests-aif/pull/286) §1 does **not** attach to Superset's normal agent-launch path. (Were Superset to spawn via `claude -p` it would inherit that metering — it does not.)

---

## §3 Per-aspect comparison

| Aspect | **Superset** | **(a) oh-my-openagent (omo)** | **(b) aif-handoff substrate-v2** | **PR #279 baseline** (`WorktreeCreate` hook + `claude -w`) |
|---|---|---|---|---|
| Problem-class fit (§4 T16) | Parallel CLI agents in worktrees + env-setup via desktop GUI/CLI/MCP — **partial** (worktree+setup overlaps; GUI/swarm-scale does not) | OpenCode in-agent **harness** (planning/exec/verify roles) — **mismatch** (reasoning layer, not worktree mgmt) | Provider-neutral **runtime/task-handoff** (Planner/Implementer/Reviewer Kanban) — **mismatch** (autonomous task pipeline, not worktree env-setup) | **exact** — created worktree + node_modules symlinks + branch on `claude -w` |
| License | **ELv2** (source-available, managed-service restriction) | Open-source (MIT-family per repo) | MIT ([SSOT #44](../prior-art-evaluations.md)) | project's own (no new license) |
| Maturity | v1.2.0; canary/12 h; macOS tested, Linux AppImage tested, Windows untested | v3.11.0; 48k★; very active | in-flight in *this* repo (Phase 1 ~75%, PRs #286/#289/#290) | shipped + green CI; 10 paired-negative tests (PR #279) |
| Runtime cost / lock-in | **Bun ≥1.0 + Electron + macOS-primary** | OpenCode plugin (not CC) | MCP server (`@aif/mcp`); Docker/DB for full handoff | **zero** — CC-native, harness-agnostic, OS-agnostic |
| Integration cost | install Electron app + Bun + commit `.superset/config.json` | adopt OpenCode substrate (wrong harness) | stand up aif-handoff infra + runtime-bridge (already being built) | **already integrated** |
| Migration cost (if ADOPT) | `worktree-setup.sh` (PR #279) → dead; `claude -w` migration (PR #282) → partial; consumers gated behind ELv2+Bun+macOS | n/a (harness swap — non-starter) | n/a (different layer; bridge in progress) | n/a (the thing kept) |
| Falsifier | wrong-to-REJECT if project drops AI-agnostic-substrate goal and mandates a GUI dev-environment for all consumers | wrong-to-dismiss if project migrates to OpenCode | wrong-to-dismiss if Phase-10 swarm needs shared task state (per SSOT #44 trigger) | wrong-to-keep if CC removes `--worktree` / `WorktreeCreate` |

**Field context** (`#vendor-lock-by-convenience`): the broader field (Conductor, ccswarm, Claude Squad, T3 Code, dux) is the *same* problem-class as Superset — a GUI/TUI worktree-swarm manager layered over CLI agents. None of them is a *closer* match to our enforcement-substrate scope than CC-native already is.

---

## §4 T16 problem-class match analysis

Per [ai-laziness-traps.md §2 T16](../../.claude/rules/ai-laziness-traps.md) — verify *function*, not the "orchestrator" name.

- **Upstream problem class (Superset):** give a developer a **desktop GUI + CLI + MCP** to run *many* (the marketing says "100+") CLI coding agents **in parallel**, each in an isolated worktree, with per-project env-setup scripts and visual diff/session management. Target user: a developer scaling parallel agent throughput, managed visually.
- **Our problem class:** a single-maintainer **meta-discipline framework** whose deliverable is **executable enforcement of conventions** (lint rules, principle tests, hooks, pre-push gates) that **ships to consumers** as harness-agnostic files. Worktree+env-setup is a *minor supporting capability* for dispatching Worker/Reviewer sub-agents — not the product.
- **Match? PARTIAL, and only on the non-load-bearing slice.** Evidence:
  1. The overlapping slice (worktree create + env-setup-on-create) is **already covered natively** — `claude -w` (CC v2.1.50+, ADOPTED PR #282) + the `WorktreeCreate` hook (`worktree-setup.sh`, PR #279), verified to bring step-count 7→2→1 ([PR #284](https://github.com/Yhooi2/rules-as-tests-aif/pull/284) acceptance table). Superset adds *nothing* here except a GUI and a worse delivery channel (Layer 5).
  2. The non-overlapping majority of Superset (Electron GUI, multi-agent visual dashboard, 100+-agent scale, `.superset/config.json` install) is **orthogonal to the project goal** (enforcement). It is parallel-evolution at a *different abstraction* (developer-facing dev-environment UX vs machine-enforced discipline substrate).
- **`#pattern-matching-on-name` averted:** "orchestrator/swarm" naming overlaps the project's `/orchestrator` skill vocabulary, but the *functions* differ — Superset orchestrates **terminal panes of agents for a human**; our orchestrator skill dispatches **Worker/Reviewer sub-agents under enforcement rules**. Name match ≠ problem-class match.

---

## §5 License + maturity report (specific facts)

- **License: Elastic License 2.0 (ELv2)** — *source-available*, NOT OSI-approved open-source (DeepWiki P2, grounded in repo README + comparison docs). **T13 note:** marketing/3rd-party pages loosely call Superset "open-source" ([aitoolly](https://aitoolly.com/product/superset-2-0), [The New Stack](https://thenewstack.io/ai-coding-tool-stack/)) — the **repo-grounded ELv2** is authoritative; do not trust the author/marketing "open-source" claim. ELv2's headline restriction (no providing the software as a managed service to third parties) is **not** triggered by this project's distribution model — `install.sh` would help a consumer *self-install* Superset, which is not "offering Superset as a managed service." The accurate, narrower concern: ELv2 is **non-OSI-approved**, so a substrate that depended on Superset would carry a **non-OSI dependency** and impose a **license-vetting obligation** on any consumer operating in an open-source-only or regulated context. Real, but narrower than a managed-service prohibition.
- **Version:** desktop **v1.2.0** (≥1.0 — past initial major) (P3).
- **Release cadence:** stable on `desktop-v*.*.*` tags via `create-release.sh`; **canary every 12 hours** via cron (P3) → fast-moving.
- **Runtime:** **Bun v1.0+** (package manager + runtime); Electron desktop app (P3).
- **OS support:** macOS fully tested (native installers, auto-update); **Linux tested** (`*.AppImage` + `*-linux.yml`); Windows in `electron-builder.ts` but README-listed "untested" (P3).
- **Agent billing:** operator's own keys/subscription; Superset proxies nothing (P4).

---

## §6 Verdict

**REJECT** — as a *project-substrate adoption target* — with a **KEEP-NARROW** positioning and a **REFERENCE** to one schema idea. (Per [build-first-reuse-default.md §1](../../.claude/rules/build-first-reuse-default.md) seven-verdict taxonomy.)

**Why REJECT (not ADOPT):** Adopting Superset as the project's worktree/dispatch substrate would add a **non-OSI (ELv2)** dependency + **Bun + Electron + macOS-primary** runtime coupling to a substrate whose *defining property* is being **harness-, OS-, and license-agnostic files+hooks shipped to consumers** (a non-OSI dependency imposes a license-vetting obligation on open-source-only/regulated consumers — §5). It would solve only the **least load-bearing** slice (worktree env-setup) — a slice **already covered natively** by `claude -w` + the `WorktreeCreate` hook (PR #279/#282/#284) with **strictly better delivery reliability** (Layer 5) and **zero dependency**. That is the BFR REJECT shape: an upstream candidate that would *actively harm* the setup's core property while duplicating an existing-and-better capability.

**KEEP-NARROW component:** our enforcement-substrate scope is **narrower and orthogonal** to Superset's general dev-orchestration GUI. Superset is noted as **parallel-evolution at a different abstraction** — a fine tool, just not our layer.

**REFERENCE component:** Superset's `.superset/config.json` `setup`/`teardown` + `config.local.json` `before`/`after` **layered-override schema** is a mature precedent worth REFERENCEing **if** the project later wants to enrich the `WorktreeCreate` hook with a committed-config + local-override layer (alongside SSOT #65). No adoption — just a documented design precedent.

**Maintainer's actual question — "нужно ли это, если я работаю из Superset?"** Two separable questions:
1. **Project ADOPT?** — No (above).
2. **Maintainer personal tooling?** — The maintainer **may** use Superset as a personal terminal/GUI (it wraps the local subscription `claude`, no-paid-LLM clean — Layer 6). That is a **personal-workflow choice, not a capability commit**, and it **does NOT moot Bug 1**, because:
   - The `WorktreeCreate` hook is **shipped substrate for consumers**, who may not run Superset (gated by ELv2 + Bun + macOS).
   - The hook fires in **plain CC `claude -w`** regardless of any GUI the maintainer personally runs.
   - Therefore the consumer-facing + plain-CC path still needs a correct hook. → **Bug 1 should resume** (the stale-base-ref fix is real and independent of Superset).

**T-SS-A (baseline-contamination) resolved:** the PR #279 baseline carries Bug 1 (the `WorktreeCreate` hook prefers `origin/HEAD` — `worktree-setup.sh:73-75`, `for cand in "origin/HEAD" "origin/main" "main" "HEAD"`). **Superset ADOPT does not *fix* this bug — it *sidesteps* it** by replacing the hook with `.superset/config.json` (which derives the base from a chosen branch). Since we REJECT ADOPT, Bug 1 must be fixed **in the hook**, not avoided. **Live evidence (verified 2026-05-30):** `git symbolic-ref refs/remotes/origin/HEAD` → `refs/remotes/origin/main`, and `origin/main` (`bb3ecec`) is **150 commits behind `origin/staging`** (`git rev-list --count bb3ecec..origin/staging` = 150) — the trunk per the staging-trunk migration. So the hook's `origin/HEAD`-first base-ref loop would birth any fresh `claude -w` worktree 150 commits behind trunk *right now*. The bug is present and observable, not hypothetical.

**T14:** coverage is high (DeepWiki ×4 grounded excerpts + WebSearch ×4 + 6 PR bodies + SSOT grep + hook source). "No concerns" is **not** the basis — the REJECT rests on positive evidence (license, runtime coupling, native-coverage, delivery-reliability downgrade), not absence of findings.

**T-SS-C (macOS-only-acceptance bias) acknowledged, not elided:** even though a single-maintainer-on-macOS context makes Superset's OS profile look acceptable, the project goal is an **AI-agnostic substrate for ANY consumer**. Mandating a macOS-primary + Bun + Electron tool as substrate would limit consumers to a subset — this constraint is a **first-class reason in the REJECT**, not a footnote. (Linux AppImage support, newly confirmed in P3, narrows but does not eliminate the constraint; Windows remains untested, and Bun+Electron coupling persists regardless of OS.)

---

## §7 Re-evaluation triggers (no I-phase — REJECT)

No I-phase sketch (verdict is REJECT/KEEP-NARROW, nothing to build/adopt). Re-open this survey if **any** fires:
- Project goal changes from "AI-agnostic files+hooks substrate shipped to consumers" to "ship/endorse a dev-environment GUI".
- Superset relicenses from **ELv2 to an OSI-open license** AND drops the Bun/Electron hard-dependency for a headless-portable core.
- A **Linux/Windows consumer** arrives needing parallel-worktree env-setup that the CC-native `claude -w` + hook path cannot serve.
- CC **removes/renames** the `--worktree` primitive or the `WorktreeCreate` hook event (the native capability we rely on instead of Superset) — verify against `code.claude.com/docs/en/worktrees` + `hooks.md` at that time.
- The project decides to **enrich the `WorktreeCreate` hook** with a committed-config + local-override layer → REFERENCE Superset's `.superset/config.json` schema (§6 REFERENCE component) at that moment.

**Bug 1 disposition (out of this patch's authority, but the trigger answer):** RESUME — Superset does not moot it.

---

## §8 §1.7 self-reflexive check ([phase-research-coverage.md §1.7](../../.claude/rules/phase-research-coverage.md))

**Forward-check (this patch complies with active disciplines):**
1. [build-first-reuse-default.md §3](../../.claude/rules/build-first-reuse-default.md) — full 6-layer BFR executed (§2 above: SSOT + DeepWiki ×4 + WebSearch ×4 + adjacent-SSOT + channel-delivery + no-paid-LLM), ≥2 alt-targets compared (§3). ✅
2. [no-paid-llm-in-ci.md §1-§2](../../.claude/rules/no-paid-llm-in-ci.md) — survey used DeepWiki (free tier) + WebSearch, session-bound, no CI LLM; the *subject* (Superset) also verified no-paid-LLM-clean (Layer 6). ✅
3. [doc-authority-hierarchy.md §2-§3](../../.claude/rules/doc-authority-hierarchy.md) — Authoritative-for / NOT-authoritative-for header present (top of file). ✅
4. [reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md) — the Bug 1 disposition is surfaced as a *reasoned recommendation* (RESUME, with evidence), and is explicitly flagged as "out of this patch's authority" — the maintainer/orchestrator owns the actual scheduling. ✅
5. Principle 10 — first line is `<!-- scope:superset-adopt-survey -->` (machine-parseable annotation). ✅
6. [phase-research-coverage.md §1.7/§1.12](../../.claude/rules/phase-research-coverage.md) — leads with a reasoned verdict (§6), backs it with file:line/DeepWiki/URL evidence (§2), states a falsifier (§9). ✅

**Backward-check (scope sweep):**
1. Memory `superset-adopt-survey-deferred` — this patch is its codified resolution; per [memory-codification.md §3](../../.claude/rules/memory-codification.md), that memory entry should be reduced to a pointer to this patch (orchestrator follow-up).
2. No SSOT row superseded — §10 *adds* row #86 (Superset was absent). The 2026-05-29 "Linux untested" claim in memory is **refined** here (P3: Linux AppImage tested), not silently overwritten — noted explicitly.
3. No other research-patch covers Superset (grep `superset` → only this file). No prior verdict re-litigated; SSOT #20/#43/#65 cited as context, not re-decided.

---

## §9 Falsifier

This verdict (**REJECT-as-substrate / KEEP-NARROW / REFERENCE-schema / Bug-1-RESUME**) is **wrong if**:
- (a) The project's goal is reframed to *ship or endorse a developer GUI environment* — then Superset becomes an ADOPT-track product fit, not a substrate misfit.
- (b) Superset relicenses to OSI-open **and** ships a headless, Bun/Electron-free portable core (removing the runtime + license coupling that drives the REJECT).
- (c) The CC-native `--worktree` + `WorktreeCreate` capability is **removed**, eliminating the "already covered natively, better" pillar of the REJECT — then the build-vs-reuse calculus re-opens with Superset as a live candidate.
- (d) Evidence emerges that Superset's agent-launch path **does** route through metered/proxied API billing (contradicting DeepWiki P2/P4) — that would independently FAIL no-paid-LLM and harden REJECT (so this falsifier strengthens, not weakens, the verdict; flagged for honesty per T14).

---

## §10 SSOT entry proposal

Append to [prior-art-evaluations.md](../prior-art-evaluations.md) as row **#86** (current max = #85):

| # | Tool/Pattern | Capability area | First seen | Evaluated | Verdict | Rationale | Trigger to revisit |
|---|---|---|---|---|---|---|---|
| 86 | `superset-sh/superset` (Superset) — desktop GUI + CLI + MCP for orchestrating swarms of CLI coding agents across isolated git worktrees, with `.superset/config.json` setup/teardown scripts | Worktree-dispatch + per-project env-setup substrate for parallel CLI agents | 2026-05-29 | 2026-05-30 | **REJECT** (as project substrate); **KEEP-NARROW** (our enforcement-substrate scope is narrower/orthogonal); **REFERENCE** the `.superset/config.json` layered-override schema | T16 PARTIAL — overlaps only the non-load-bearing worktree-env-setup slice, **already covered natively** by CC `claude -w` (v2.1.50+, SSOT-adjacent #20) + `WorktreeCreate` hook (PR #279/#282/#284) with better delivery reliability ([rule-enforcement-channel-selection §4](../../.claude/rules/rule-enforcement-channel-selection.md)). Adopting adds a **non-OSI (ELv2, source-available)** dependency — imposing a license-vetting obligation on open-source-only/regulated consumers (not the managed-service clause, which self-install does not trigger) — plus **Bun + Electron + macOS-primary** coupling to an AI-/OS-/license-agnostic files+hooks substrate that ships to consumers. No-paid-LLM **clean** (interactive terminal launch, operator's own keys — DeepWiki P2/P4). v1.2.0, canary/12 h, Linux AppImage tested / Windows untested. Maintainer **may** use Superset as a personal terminal (does not moot Bug 1). | §7 triggers: goal→ship-a-GUI; Superset→OSI-open + headless-portable core; Linux/Windows consumer needs env-setup CC-native can't serve; CC removes `--worktree`/`WorktreeCreate`; project enriches the hook with committed-config layer (→ REFERENCE the schema) |

---

> **R-phase complete.** Verdict: **REJECT** (substrate) / **KEEP-NARROW** / **REFERENCE** (schema). Bug 1 → **RESUME** (not mooted). Coverage: DeepWiki ×4 + WebSearch ×4 + 6 PR bodies + SSOT grep + hook source — high. No code changed (T5).
