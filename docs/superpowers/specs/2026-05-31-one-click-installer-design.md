<!-- scope:one-click-installer -->
# One-click installer (`./setup`) — design spec

> **Status:** brainstorm output, awaiting maintainer spec-review → writing-plans.
> **Date:** 2026-05-31.
> **Authoritative for:** the design of a single top-level `./setup` entry point that orchestrates the existing `install.sh` + `setup-runtime-bridge.sh` into one consented y/n flow; the companion/external-service install principle; the TaskMaster removal from the installer.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The framework deploy mechanics — those stay in [`install.sh`](../../../install.sh). The bridge mechanics — those stay in [`packages/runtime-bridge/scripts/setup-runtime-bridge.sh`](../../../packages/runtime-bridge/scripts/setup-runtime-bridge.sh) + [`docs/runtime-bridge-setup.md`](../../runtime-bridge-setup.md). Whether to adopt TaskMaster/Superpowers *into meta-orchestrator planning* — out of scope (§9).

---

## §1 Problem

Installing "everything" today is two manual entry points plus several hand steps:

1. `install.sh <stack>` — deploys the framework (skills/agents/templates/audit) and already offers companion y/N prompts (`install.sh:356/396/436`) + preset `[1/2]` (`install.sh:148`).
2. `bash packages/runtime-bridge/scripts/setup-runtime-bridge.sh` — separate interactive bridge setup, with residual manual friction: bring up aif-handoff `docker compose` yourself, flip `transport:"cli"` (a paid-API cost-footgun — default is metered SDK, `docs/runtime-bridge-setup.md`), supply a project UUID, and the bridge silently degrades to ManualBackend when the UUID is missing.

There is no single command, and the bridge's external-service steps are error-prone. Goal: **one command, y/n choice per component, convenient yet honest about what we don't own.**

## §2 Scope (decided)

- **A + B wrapper** (chosen over full merge): a thin top-level `./setup` orchestrator that calls the existing scripts; it does **not** reimplement their logic. Full merge (one monolith) rejected — `install.sh` is harness-agnostic file deploy; the bridge is env+docker+external-config — different natures; merging fights [`dual-implementation-discipline.md`](../../../.claude/rules/dual-implementation-discipline.md).
- **Companions install from THEIR official installers**, never our reimplementation. Our installer is only for our own framework.
- **OhMyOpencode — removed** from the offered companions (maintainer decision 2026-05-31).
- **TaskMaster — removed** from the installer (maintainer decision 2026-05-31): we do not use it (only borrowed its tier *vocabulary*, already deterministic bash in `classify-work.sh`), its planning value is covered by Superpowers (which the orchestrator already invokes — `~/.claude/skills/orchestrator/SKILL.md:487/525`), and its `install.sh` command is currently broken (`claude-task-master@claude-plugins-official` → "not found in marketplace", verified 2026-05-31).
- **Remaining offered components:** our framework (always) + **Superpowers** (free CC plugin) + **runtime-bridge** (opt-in, guided).

## §3 Architecture — `./setup`

New executable at repo root, ≈ thin orchestrator (target < 80 LOC → not a capability commit; confirm against CLAUDE.md threshold at implementation):

```text
./setup [--yes] [--all] [--dry-run] [STACK]
  │
  ├─ 0. Preflight        — probe bash / git / python3 / curl / docker / claude CLI; print a found/missing table.
  ├─ 1. Framework        — install.sh <STACK>  (framework files ONLY; prompts for STACK if not given). --dry-run passes through.
  ├─ 2. Companions        — manifest engine (§4) loops the table: Superpowers row → detect/offer/install. install.sh's companion prompts are REMOVED and migrated here (one source of truth).
  └─ 3. Runtime-bridge   — manifest external-service row → y/N → setup-runtime-bridge.sh + the §5 guided-detect layer.
  └─ summary             — single coloured end report: what was installed, what was skipped, what needs a manual follow-up.
```

**Flags:**
- `--yes` / `--all` — non-interactive "one button": `--yes` accepts safe defaults (framework only); `--all` = framework + all detectable companions + bridge with autodetect. Both bypass prompts.
- `--dry-run` — pass-through to `install.sh`; for the bridge step, print the plan without writing.

**Entry-point status:** `./setup` becomes the main documented entry (README points to it). `install.sh` stays as the direct/advanced path (file deploy only, no wizard).

## §4 Companion / external-service install principle (codify as a rule)

The load-bearing principle the maintainer set (2026-05-31):

> Our installer installs only our own artefacts. Companions and external services are installed via **their own official top-level installer**, after a **detect-first** check, **without pinning a version**, and **configured to the free-on-subscription path by default** (never silently a paid API). We never reimplement a companion's install steps.

Why this satisfies "don't update our installer when a satellite updates":

| Satellite event | Our installer touched? |
|---|---|
| Satellite ships a new **version** | **Never** — we call `claude plugin install <x>@<marketplace>` with no version pin; the registry serves latest. Updates flow through their installer. |
| Satellite changes its **install command** | Yes, but a **one-line data edit** (rare). |

This is [`build-first-reuse-default.md §2`](../../../.claude/rules/build-first-reuse-default.md) ("maintenance distributes to upstream") + extends the spirit of [`no-paid-llm-in-ci.md`](../../../.claude/rules/no-paid-llm-in-ci.md) to the consumer-default (free-on-subscription, not paid-API-by-default).

**Companion manifest — BUILT (minimal, from the start).** Rationale: the maintainer's load-bearing goal is "don't touch the installer when a satellite changes", and a declarative manifest is the direct structural embodiment of that goal — adding/changing a satellite becomes a one-line data edit, not logic. The satellite count will grow (amux Phase 2; 8 satellites in the integration matrix). So `./setup` ships a small declarative table now, even at 1-2 entries:

```text
# companions.manifest  — name | detect_cmd | install_cmd | kind
superpowers | claude plugin list | grep -q superpowers | claude plugin install superpowers@claude-plugins-official --scope user | cc-plugin
# (future: amux, others — add a row, touch no logic)
```

A **generic engine** loops the manifest: for each row → run `detect_cmd`; if present → "skip"; else → offer `[Y/n]` → run `install_cmd` (no version pin). Scope discipline: the engine is ≈20-30 LOC and the data is separate — this is the *minimal* version, **not** a plugin framework. `kind=external-service` rows (e.g. aif-handoff) route to §5 guided-detect instead of a plain install_cmd. The existing `install.sh` Superpowers block is migrated into the manifest (one source of truth — `dual-implementation-discipline.md §7`), not duplicated.

## §5 Runtime-bridge guided-detect (the convenient-yet-honest layer)

Applied to the external aif-handoff side (verdict: **guided + verify**, not blind auto-install — we do not own aif-handoff and do not know how/where it runs).

**Detection is runtime-agnostic — key on the service, not on docker** (capability-check, not brand/mechanism-check, per [`dual-implementation-discipline.md §4`](../../../.claude/rules/dual-implementation-discipline.md)). aif-handoff may run in **docker OR natively** (npm/node process, already-running daemon) — the installer must not assume docker.

1. **aif-handoff reachability (primary signal, transport-agnostic):** poll `RUNTIME_BRIDGE_AIF_URL/health`. Reachable → it's up (docker or native, irrelevant) → go to step 3. This is the only signal that works for both run modes.
2. **If unreachable → diagnose the run mode, then offer the matching bring-up** (do NOT hardcode docker):
   - if a docker context is detected (`docker info` ok + an aif-handoff compose/container findable or a path supplied) → offer `[Y/n]` `docker compose up -d` (ask once / accept env for the checkout path); if the docker **daemon** is down, offer to start it first (`open -a Docker` darwin / `systemctl start docker` linux);
   - else if aif-handoff is installed natively (CLI on PATH / npm) → offer its native start command;
   - else → print install pointer (their official install), do not fabricate a command.
   - After any bring-up → **re-poll `/health`** and report reachable/not **explicitly** (never silent).
3. **transport cost-footgun:** if reachable and `aif-handoff config show` is available, read the profile; if it is the metered SDK default, **offer their command** to switch to `transport:"cli"` `[Y/n]`. Never edit their config silently.
4. **project UUID:** prompt; if empty → **explicit signal** ("the bridge cannot dispatch without a UUID; it will stay on ManualBackend — continue? [y/N]"), never silent degrade.
5. **Our side:** write `RUNTIME_BRIDGE_*` env to shell rc, copy the hook, and auto-write `.claude/settings.json` exactly as PR #311 already does (consent + backup + JSON-validate + idempotent + preserve existing hooks).

Honesty boundary: true one-button for an external service in an unknown location/run-mode is impossible; the design keys on `/health`, diagnoses the run mode, offers the matching concrete command, and re-verifies.

> **Implementation note (verify):** confirm aif-handoff's supported run modes (docker vs native) at implementation — the design holds either way because step 1 is `/health`-based, but step 2's branch list should match the real modes.

## §6 Companion blocks leave `install.sh` (all three)

With the §4 manifest as the single source of truth for companions, `install.sh` becomes **framework-file-deploy only** — all three companion blocks (`install.sh:344-455`) are removed:

**Superpowers** — its install logic (`install.sh:344-381`) is **migrated into the manifest** (`companions.manifest` superpowers row + the §4 engine), not deleted outright — one source of truth per `dual-implementation-discipline.md §7`.

**OhMyOpencode** — remove its block (`install.sh:427-455`) entirely; it was print-only (D5 Option A), pulled `bun`, dropped per maintainer decision 2026-05-31. NOT carried into the manifest.

**TaskMaster** — remove its block (`install.sh:387-426`) entirely; NOT carried into the manifest. Update the SSOT:
- SSOT #84 (`prior-art-evaluations.md:152`) currently records `claude plugin install claude-task-master@claude-plugins-official` for "SP + TM" — annotate that the TM half is **withdrawn** (marketplace slug does not resolve as of 2026-05-31; TaskMaster is MCP/CLI-based, not a `claude-plugins-official` CC plugin) and that TaskMaster is not an offered companion.
- SSOT #73 (TaskMaster vocabulary ADOPT) is unaffected — the tier vocabulary in `classify-work.sh` stays; only the *installer offer* is removed.
- This is append-only annotation to the SSOT register (owned by the SSOT author per [CLAUDE.md Artifact Ownership Contract](../../../CLAUDE.md)).

## §7 Testing

- `tests/install-sh/setup.test.sh` (mirror existing `tests/install-sh/*.test.sh` harness): preflight detect output, `--dry-run` writes nothing, `--yes` applies safe defaults, idempotent re-run, Superpowers detect-skip, bridge step gated behind y/N.
- Reuse install.sh's `INSTALL_SH_LIB_ONLY=1` library-source pattern (`install.sh:52`) where helpers must be tested without running the pipeline.

## §8 Docs

- `README.md` → `./setup` as the primary entry; `install.sh` documented as the advanced/direct path.
- `docs/runtime-bridge-setup.md` → update Quick-start to reflect guided-detect (docker daemon, health re-poll, transport-config offer, explicit no-UUID signal). Keep the Authoritative-for header.

## §9 Out of scope (observations, not this task)

- **Adopt TaskMaster/Superpowers into meta-orchestrator *planning*** — REJECTED for TaskMaster on existing evidence (Superpowers `writing-plans`/`executing-plans`/SDD already invoked by the global orchestrator: `~/.claude/skills/orchestrator/SKILL.md:487/525/78`; plan-memory R1 already built ours: PR #236/#240). No R-phase needed unless a queryable task-dependency-DAG (`next`-unblocked) is a confirmed gap.
- **`meta-orchestrator-plan-memory` umbrella closure** — implemented (#236/#240 merged) but missing `done.md`. Suggest a one-line closure commit per CLAUDE.md Umbrella closure convention.
- **Companion manifest** — deferred to ≥4 companions / amux Phase 2 (§4).

## §10 Discipline (§1.7 forward + backward)

- **Forward:** `./setup` is harness-agnostic bash, pure shell + the existing scripts — compliant with [`no-paid-llm-in-ci.md`](../../../.claude/rules/no-paid-llm-in-ci.md) (zero API calls) and [`build-first-reuse-default.md`](../../../.claude/rules/build-first-reuse-default.md) (orchestrates existing artefacts; the only new code is the wrapper + guided-detect, justified — no upstream ships a `./setup` for *this* framework). [`dual-implementation-discipline.md`](../../../.claude/rules/dual-implementation-discipline.md): `./setup` IS the portable artefact (like `install.sh`); `@dual-pair`/`@cc-only-rationale` likely N/A — confirm at implementation.
- **Backward:** removes the broken TaskMaster install path (does not silently supersede SSOT #73 vocabulary — only withdraws the installer offer + annotates SSOT #84). The companion-install principle is codified as a new rule, not buried in the wrapper. Agent deny-list on `.claude/settings.json` untouched (the auto-write is human-run, per PR #311 / NC-3 scope).

## §11 Capability-commit check

Confirm at implementation against CLAUDE.md "capability commit" definition: `./setup` < 80 LOC → not a capability commit; the guided-detect logic may push it over — if so, carry a `Prior-art:` trailer (aif-handoff `installMcpServer` precedent, same as PR #311). The new `.claude/rules/companion-install-principle.md` carries a Class field + Authoritative-for header per [`doc-authority-hierarchy.md`](../../../.claude/rules/doc-authority-hierarchy.md).
