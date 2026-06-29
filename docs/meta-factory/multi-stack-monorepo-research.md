# Multi-stack monorepo (§13.5) — R-phase research

> Scope: R-phase research for the `multi-stack-monorepo` umbrella (opens open-question §13.5). Filename-convention authority (`*-research.md`, [doc-authority-hierarchy.md §2](../../.claude/rules/doc-authority-hierarchy.md)) — scope-bound by filename; no per-file Authoritative-for header required. NOT authoritative for project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).

All file:line citations below were re-verified against the worktree at `origin/staging @ 0417e6087` (T3). Where the dispatch brief's approximate line drifted, the corrected line is given.

---

## §0 Origin

### #780 — accurate framing

Issue **#780 (OPEN)**: *"Fresh `./setup -y` should auto-detect the stack from the consumer repo, not fail loud requiring an explicit stack."* Its **core is single-stack**:

- On the yes-path, `setup` **requires** an explicit stack. Verified: `setup:13` comment — *"On the yes-path (-y/--yes/--all/--full) an explicit stack is required; the dispatcher …"*; `setup:35` passes a single `${STACK:+$STACK}` through to `install.sh`.
- `install.sh` then fails loud with no stack: `install.sh:197-198` — `echo "❌ Unknown stack: $STACK (use ts-server, react-next, react-spa, or react-native)"` + `exit 1`.
- The machinery to fix this **already exists but is unwired**: `_detect_stack_from_pkg` (`setup.d/15-companions-stack.sh:24-59`) reads `package.json` signals and returns `react-native | react-next | react-spa | ts-server | unknown` — but it is consumed only for **companion selection** (`15-companions-stack.sh:83-98`), never to pick the install stack.

#780 then raises, as an explicit **secondary "decision worth raising,"** a **multi-stack monorepo nuance**: the consumer polygon **timeliner** = Hono (`apps/api` → ts-server) + Expo (`apps/mobile` → react-native) + Drizzle in one pnpm monorepo, which the single positional `STACK` model cannot express (today it installs as one stack, silently ignoring the second app).

### §13.5 — the open question this umbrella opens

[open-questions.md §13.5](open-questions.md) (status `open, armed`), text verified verbatim:

> Что если в одном репо `apps/web` (Next 16) и `apps/api` (Fastify 5) и `packages/shared` (TS-only)? Три фабрики? Одна с разными scoped правилами?
> Гипотеза: одна meta-factory invocation, на выходе — слой scoping в ESLint flat config, разные правила scoped к разным каталогам. Lock-файл общий, в нём отметки «правило R12 applies-to apps/web/**».
> Это требует более продвинутого Layer 1 ([architecture.md](architecture.md) §2.3), который понимает workspace structure.

§13.5's **trigger has fired**: *"first consumer is multi-stack monorepo … OR Phase 11 AIF integration entry research kicks off"* — timeliner is that consumer.

### Sequencing override — deliberate, recorded as context (NOT a regression)

The maintainer's **A-decision (2026-06-27)** opens §13.5 **now**, overriding the original Phase-9+ deferral. Sequencing pointers (re-verified):

- `EXECUTION-PLAN.md:785` — *"Multi-stack monorepos (§13.5). Решается на Phase 9+ после single-stack успеха."* (the deferral being overridden).
- `EXECUTION-PLAN.md:677-679` — *"Phase 9+ — Path B, нишевые стеки, multi-stack monorepos, AIF integration"* (ties §13.5 to Phase-9+ Path-B / AST-gen territory — Layer-2 enforcement is conceptually there).
- `EXECUTION-PLAN.md:564` — *"Какие признаки package.json не дали однозначной классификации? → edge cases для §13.5 multi-stack"* — the **detection-ambiguity fork is already logged** as §13.5-relevant; used as evidence below, not re-derived.

This override is deliberate maintainer context: the trigger fired earlier than the planned sequence anticipated, so the question opens on its own merits, not as a plan violation.

### Naming collision — do NOT conflate (#646 vs §13.5)

An umbrella **`multi-stack-install-wiring`** (#646; react-spa #713 + react-native #714, **DONE**) already shipped: it made `install.sh` support the 4 stacks as **separate single-stack targets** (multi-**preset** support). Verified live on `claude/react-native-install-wiring` tip (`5e0aedc84`, "close multi-stack-install-wiring-iphase umbrella"). **THIS umbrella** (`multi-stack-monorepo`, §13.5) is about **one repo that IS several stacks at once** — a different problem-class. We build **ON** the #646 `install.sh` state; we do not duplicate it.

---

## §1 Prior-art / build-vs-reuse consult

Search coverage actually executed this R-phase (not from training data, T11/T12):

| Target | Tool | Phrasings |
|---|---|---|
| Nx per-project stack detection + lint scoping | DeepWiki `nrwl/nx` | 1 (deep) |
| Turborepo workspace discovery + per-package config | DeepWiki `vercel/turborepo` | 1 (deep) |
| ESLint flat-config native `files:` per-directory scoping | DeepWiki `eslint/eslint` | 1 (deep) |
| pnpm workspace discovery + programmatic listing | DeepWiki `pnpm/pnpm` | 1 (deep) |
| Superpowers monorepo / per-workspace scoping | DeepWiki `obra/superpowers` | 1 (deep) |
| monorepo per-package stack auto-detection (general) | WebSearch | 1 |
| ESLint flat-config monorepo per-directory rules (general) | WebSearch | 1 |
| detect all workspaces in pnpm monorepo via bash (general) | WebSearch | 1 |

**SSOT consulted** (`docs/meta-factory/prior-art-evaluations.md`): relevant existing entries — `#11` (ESLint shareable-config `extends:`, ADOPT VOCABULARY), `#17` (markdownlint-cli2 with config-resolver + workspace globs, ADOPT), `#28/#43/#44/#46/#66/#67` (AIF/aif-handoff Phase-11 touchpoints, mostly DEFER/REFERENCE/REJECT). None covers **per-workspace stack detection** or **per-`applies-to` enforcement scoping** — those are new.

### Verdicts per capability slice (with T16 "upstream class X vs our class Y" lines)

**Slice A — ESLint flat-config per-directory rule scoping (Layer 2 enforcement scoping mechanism).**
**Verdict: REFERENCE (the mechanism is native; we emit into it).**
DeepWiki `eslint/eslint`: *"the `files` field is a core mechanism for scoping rules to specific directories or file globs, such as `"apps/web/**"` … this is a native, first-class behavior … When multiple configuration objects match a given file, they are merged, with later objects overriding earlier ones."* WebSearch corroboration (ESLint docs): *"the recommended approach is to have a single config file at the root … then use `files` to target specific configurations at specific directories, instead of … override files."*
**T16:** upstream class = "scope lint rules to globs within one flat-config array, natively merged"; our class = "emit per-workspace `files:` blocks into the consumer's flat config from a meta-factory plan". **Match: exact on the mechanism** — the §13.5 hypothesis ("слой scoping в ESLint flat config, разные правила scoped к разным каталогам") is *literally* ESLint native `files:`. We do not build a scoping engine; we make the synth/render/lock pipeline **emit** per-workspace `applies-to`/`files:`. The lock-file annotation "правило R12 applies-to apps/web/**" maps 1:1 onto the existing `applies-to: string[]` field (see §2 REUSE-map).

**Slice B — per-workspace tech-stack detection (Layer 1 detector, monorepo case).**
**Verdict: BUILD the per-workspace walk (thin), REFERENCE Nx for the detection vocabulary.**
DeepWiki `nrwl/nx`: Nx detects each project's stack via plugin inference from `package.json` — *"`@nx/next`: detected by next.js in dependencies … `@nx/react-native`: detected by react-native in dependencies"* — and identifies projects by `package.json`/`project.json` presence. This is **exactly our `_detect_stack_from_pkg` signal logic** (`15-companions-stack.sh:30-57`: react-native → next → react → typescript), but applied **per project** rather than at root.
**T16:** upstream class = "Nx infers per-project tasks/stack as a full monorepo build-runtime (Project Graph, plugins, `nx.json`)"; our class = "walk workspace dirs, run the existing `_detect_stack_from_pkg` per dir, return a `{dir → stack}` map for the installer". **Match: ~70% on detection logic, 0% on runtime.** Adopting Nx wholesale drags a build-system dependency (Project Graph, plugin host) into a meta-discipline project — a fundamental misfit against the single-maintainer maintenance budget ([build-first-reuse-default.md §2](../../.claude/rules/build-first-reuse-default.md)). The **BUILD slice is small**: a workspace-dir walk + N calls to the already-built detector. Nx is REFERENCE ("here is how per-project framework inference is done at scale").

**Slice C — workspace discovery (find the workspace package dirs).**
**Verdict: REFERENCE pnpm/Turborepo conventions; read the manifest, do not depend on a tool.**
DeepWiki `pnpm/pnpm`: workspaces are defined by `pnpm-workspace.yaml` `packages:` globs; programmatic listing via `findWorkspaceProjects` or `pnpm list -r --json`; *"pnpm does not classify the tech stack of each workspace package."* DeepWiki `vercel/turborepo`: discovers workspaces by detecting the package manager then reading `pnpm-workspace.yaml` (pnpm) or the root `package.json` `workspaces` field (npm/yarn/bun); *"Turborepo does not detect or classify the tech stack of individual workspace packages."*
**T16:** upstream class = "package-manager-native workspace globbing for dependency linking / task running"; our class = "enumerate workspace dirs so we can detect+scope per dir". **Match: exact on discovery, but both upstreams stop short of stack classification** (the gap Slice B fills). We **read** the same signals (`pnpm-workspace.yaml packages:` globs, or root `package.json` `workspaces`) with a thin bash/node reader — no dependency on pnpm/turbo at install time (install runs **before** the consumer's `npm/pnpm install`, see §2). REFERENCE, not ADOPT.

**Slice D — monorepo orchestration runtime (Nx / Turborepo / Rush / Lerna as a whole).**
**Verdict: REJECT as a dependency for our problem-class.**
We are a **meta-discipline / enforcement-layer generator**, not a monorepo task-runner. Nx/Turborepo/Rush/Lerna solve "run/cache/order tasks across packages" — a problem we do not have. Adopting any as a runtime dependency would be `#parallel-evolution-creep`'s inverse (importing a giant to do a thin job) and violates own-stack-first.
**T16:** upstream class = "monorepo build/task orchestration runtime"; our class = "generate per-workspace enforcement config". **Match: 0% on the orchestration axis.** Their **detection patterns** are REFERENCE (Slices B/C); their **runtimes** are REJECT.

**Slice E — multi-stack expression on the CLI (Layer 1 install surface).**
**Verdict: BUILD (thin), no upstream analog.**
This is "how does *our* `./setup`/`install.sh` accept/derive multiple stacks" — a property of our own CLI contract, not a capability any upstream ships. The 6-item search surfaced no tool that "takes a stack list / auto-detects per-workspace stacks for an enforcement-config installer". BUILD, but the build is a small argument-parsing + detection-glue change (see §3).

### Draft SSOT entries (for the maintainer to append — NOT written to `prior-art-evaluations.md` here)

The append-only SSOT's highest current ID is **#110**. Proposed new entries (maintainer appends if/when the capability commits land):

```text
| 111 | ESLint flat-config native `files:` per-directory scoping (eslint/eslint, flat config v9+, DeepWiki 2026-06-27: "files is a core, native, first-class mechanism … scope rules to globs like apps/web/** … later objects override earlier ones; recommended single-root-config + files: targeting over override files") | Layer-2 enforcement scoping for multi-stack monorepos (§13.5) — emit per-workspace `applies-to`/`files:` into the consumer's flat config | 2026-06-27 | 2026-06-27 | REFERENCE | T16: upstream = native rule-scoping inside one flat-config array; ours = pipeline EMITS per-workspace files: from a meta-factory plan. Match: exact on mechanism — the §13.5 hypothesis IS ESLint native files:. We build no scoping engine; the BUILD is making synth/render/lock emit per-workspace applies-to (today the R2 wirer emits a GLOBAL element with no files:, wire-eslint-r2.ts:421-423). Velocity: STABLE (flat config 9.x). | ESLint changes flat-config files: semantics; OR a JS-native per-workspace rule-scoping layer emerges as canonical above ESLint |
| 112 | Nx per-project stack inference (nrwl/nx, DeepWiki 2026-06-27: plugin inference from package.json — @nx/next ← next, @nx/react-native ← react-native, @nx/react, @nx/jest, @nx/eslint; projects identified by package.json/project.json) | Per-workspace stack detection for §13.5 — design reference for "infer framework per project dir" | 2026-06-27 | 2026-06-27 | REFERENCE | T16: upstream = full monorepo build-runtime (Project Graph + plugin host + nx.json); ours = thin per-dir walk reusing our existing `_detect_stack_from_pkg` signal logic (react-native→next→react→typescript). Match ~70% on detection logic, 0% on runtime. ADOPT rejected — drags a build system into a meta-discipline project (BFR §2 maintenance-budget misfit). BUILD the walk; REFERENCE Nx for "how per-project inference is done at scale". Velocity: FAST (Nx active). | Nx ships a standalone per-project detector usable without the Project Graph runtime; OR project adopts Nx as a direct dependency (goal change) |
| 113 | pnpm + Turborepo workspace discovery (pnpm/pnpm + vercel/turborepo, DeepWiki 2026-06-27: pnpm-workspace.yaml `packages:` globs / root package.json `workspaces`; pnpm `findWorkspaceProjects` / `pnpm list -r --json`; BOTH explicitly do NOT classify tech stack) | Workspace-dir enumeration for §13.5 Layer-1 monorepo detection | 2026-06-27 | 2026-06-27 | REFERENCE | T16: upstream = package-manager-native workspace globbing for dependency/task management; ours = enumerate workspace dirs to detect+scope per dir. Match: exact on discovery, but upstreams stop at discovery (no stack classification — the gap Nx-REFERENCE + our detector fills). We READ the same manifests with a thin reader; no install-time dependency on pnpm/turbo (install runs before consumer `pnpm install`, node-optional). Velocity: STABLE/FAST. | A package manager ships per-workspace stack classification natively; OR we adopt pnpm/turbo APIs as an install-time dependency |
```

---

## §2 REUSE-map — existing repo primitives + in-flight branches

### Repo primitives (each re-verified by reading the file)

| Primitive | Verified location | State (T-MS-A — presence ≠ pipeline-uses-it) |
|---|---|---|
| `applies-to: string[]` per-rule glob field (synthesizer type) | `packages/core/synthesizer/types.ts:58` (`'applies-to'?: string[];` on `SynthesizedRule`) | **Present in the type.** Brief's ~:58 exact. |
| `applies-to` in render schema | `packages/core/render/render-rules.ts:20` (`'applies-to'?: string[];` on `RuleEntry`) | **Present in render-input schema.** Brief's ~:20 exact. |
| `applies-to` glob scoring | `packages/core/diff/preset-similarity.ts:77-82` (`expandGlobs` flat-maps `r['applies-to']`, glob→regex, scores coverage) | **READ by similarity scoring.** Brief's ~:78 exact. |
| `applies-to` actually EMITTED into eslint config? | `packages/core/install/wire-eslint-r2.ts:421-423` — `synthProbeTarget`: *"The bare element is **global (no `files`)**, so the verdict depends only on whether the plugin is registered anywhere, not on which file we probe."* | **GAP (the real T-MS-A finding):** the live R2 install-wiring emits a **global** eslint element with **no `files:` scoping**. The `applies-to` field exists in the *type* and is read by *scoring*, but the **install-wiring pipeline does not emit per-workspace `files:` today.** Layer-2 §13.5 work = wire emission, not invent the field. |
| Native ESLint flat-config `files:` already used in repo's own validators | `packages/core/validator/gate-tautology.ts` (+ `gate-conflict.ts`, `gate-rule-tester.ts`, `gate-autofix-clean.ts`, `gate-message-id-coverage.ts` all import `eslint.config`) | **Present** — confirms the team already wields native `files:`; reusing it for consumer output is consistent. (Brief cited `gate-tautology.ts ~:36`; the file uses flat config — exact in-file line varies, the primitive is confirmed present.) |
| `_detect_stack_from_pkg` (package.json-signal stack detection) | `setup.d/15-companions-stack.sh:24-59` (react-native → next → react → typescript → unknown) | **EXISTS, used only for companion selection (`:83-98`), NOT wired to the install stack pick.** This is the **I-1 reuse target**. Brief's ~:24-60 exact. |
| `companions.manifest` `stacks` column (comma-separated set) | `companions.manifest:1` (header documents `name<TAB>…<TAB>stacks`), `:12-13` (*"comma-separated list for stack-specific (e.g. react-next,ts-server)"*), parser `_stack_matches` `15-companions-stack.sh:63-76` | **Format exists + parser handles comma-split, but all live rows (`:15-17`) are `*` (all-stacks).** The comma-separated multi-value set is **documented, never exercised live** — precisely stated. |
| `install.sh` `--refresh` auto-detect branch | `install.sh:157-179` (reads `.ai-factory/RULES.react-next.md` / `.react-native.md` / `.react-spa.md`) | **Useless on a fresh install** — it keys off already-installed artefacts. Brief's ~:159-172 ≈ exact (`:157-179`). |
| Single positional `STACK` | `install.sh:67` (`ts-server\|react-next\|react-spa\|react-native) STACK="$arg"`), validation `install.sh:197-198`, stack-specific RULES paths `install.sh:103-110`; `setup:25` | **Confirmed last-positional-wins, no array** — the `for arg in "$@"` loop overwrites `STACK` each match. Brief's ~:67/~:196/~:295-311 ≈ exact (validation at `:197`, RULES paths at `:103-110`). |
| `architecture.md` Layer-1 detector schema + v2 backlog | `docs/meta-factory/architecture.md:48-67` — `structure.kind` field present in schema (`:58-62`); **v1.1 note (`:67`)** marks `language/structure/router` as **v2 backlog**; authoritative contract = `packages/core/detector/types.ts` | **Workspace-awareness is designed-but-unimplemented** (`structure.kind: "monolith-app"` enumerated; v2-backlogged). Don't "invent" what is backlog'd; the §13.5 redesign **extends** this `structure` field toward a workspace-aware kind. (Note: `architecture.md` lives at `docs/meta-factory/architecture.md`, not under a preset — brief's preset path was imprecise.) |

### In-flight branches — relationship of I-1/I-2 to each (read tip / diff / kickoff)

| Branch (ahead of staging) | What it actually is (verified) | Relationship to I-1 / I-2 |
|---|---|---|
| `claude/react-native-install-wiring` (2) | `multi-stack-install-wiring` umbrella (#646) — wired react-spa/react-native presets into `install.sh` as **separate single-stack targets** (multi-*preset*). Tip `5e0aedc84` closes its umbrella. | **Baseline we build ON (orthogonal problem-class).** Different from the monorepo case; I-1/I-2 must not duplicate the multi-preset target wiring. |
| `feat/547-install-auto-wire-r2` (7) | "Auto-wire R2 by reading the repo at install" (#547 Point 2). Adds `install.sh` section *"6b-bis. GH #547 Point 2: auto-wire R2 by reading the repo"* + `detect-r2-boundary.sh` + tests. This reads the repo to **inject one specific rule (R2 `no-unsafe-zod-parse`)** into an existing eslint config — NOT to pick the stack. | **Orthogonal surface, REUSE the pattern.** I-1's stack auto-detect is a *different* repo-read ("which stack?" vs "is R2 enforced?"), but it should REUSE 547's "thin bash probe → repo-read at install" shape + the shared install-time runtime model (install runs **before** consumer deps, node-optional, `--full` guarantees deps — verified via the 547/ast-wiring kickoffs citing `install.sh:411,428,430` / `:9,27`). Do NOT parallel-build a second repo-reading harness. |
| `chore/install-ast-wiring-kickoff` (1) | Brainstorm brief for **install-ast-wiring** (#547 Point 2 **Layer 2**): AST-based **per-package** eslint config wiring; fixture **monorepo**; injects R2 into a consumer-authored per-package `eslint.config.mjs`; degrades when node/ts-morph absent. | **HIGH OVERLAP with I-2 Layer 2 — coordinate, do NOT parallel-build (`#parallel-evolution-creep`).** This branch already targets *per-package eslint config editing in a monorepo*. I-2's enforcement scoping (emit per-workspace `applies-to`/`files:`) and install-ast-wiring (edit the consumer's per-package config) are adjacent slices of the same Layer-2 surface. **Open decision for the maintainer (§6):** whether I-2 enforcement scoping folds into / sequences after / is REUSE-of install-ast-wiring. |
| `feat/generator-install-wiring` (1) | "generator-as-source / preset-as-oracle" (#728) kickoff reframe. | **Orthogonal** (generator sourcing model, not detection/scoping). No I-1/I-2 dependency; note only to avoid colliding on `install.sh` edit regions. |

---

## §3 Design-space + fork resolution

Each fork from the dispatch brief — option surface, recommendation with evidence, and whether it is a *genuine* taste fork (→ §6) or has a determinate best-on-merits answer.

### Fork 1 — Multi-stack expression on the CLI

Options: (a) positional list `./setup -y ts-server react-native`; (b) `--stack a,b`; (c) per-workspace auto-detect; (d) config file.

**Recommendation: (c) per-workspace auto-detect as the primary, with (b) `--stack a,b` as the explicit override.** Evidence: the §13.5 hypothesis is "**одна** meta-factory invocation" — auto-detection (walk workspaces, run `_detect_stack_from_pkg` per dir) realises "one invocation, multiple stacks" without forcing the consumer to hand-enumerate. (a) positional-list collides with the existing single-positional contract (`install.sh:67` last-wins) and is ambiguous (which positional is a stack vs a flag); (d) a config file is heavier onboarding (the #780 complaint is *already* "too much manual"). `--stack a,b` survives as the deterministic escape hatch when detection is ambiguous (Fork 4). **Determinate on merits** given the "one invocation" hypothesis — recommended, not surfaced.

### Fork 2 — Detection for a monorepo

Options: (a) per-workspace-dir `_detect_stack_from_pkg` walk; (b) single-root detect + ambiguity prompt; (c) explicit-only.

**Recommendation: (a) per-workspace walk**, REUSING `_detect_stack_from_pkg` per workspace dir (dirs enumerated from `pnpm-workspace.yaml packages:` / root `package.json workspaces`, per Slice C). Evidence: `EXECUTION-PLAN.md:564` already logs "package.json-ambiguous-classification" as the §13.5 edge — a per-workspace walk is what *resolves* that ambiguity (each workspace's `package.json` is individually unambiguous in the timeliner case: `apps/api` → ts-server, `apps/mobile` → react-native). (b) single-root detect cannot express timeliner (the root `package.json` of a pnpm monorepo often has neither `react-native` nor `next` as direct deps). (c) explicit-only is the status quo #780 complains about. **Determinate on merits** — recommended.

### Fork 3 — Enforcement (Layer 2)

Options: (a) one merged ruleset with per-`applies-to` scoping; (b) N independent stack rule-sets; (c) dominant-stack-only.

**Recommendation: (a) one merged ruleset with per-`applies-to` scoping.** Evidence: this is *exactly* the §13.5 hypothesis ("слой scoping в ESLint flat config … Lock-файл общий, … правило R12 applies-to apps/web/**") AND exactly what ESLint flat config does natively (Slice A: *"single config file at the root … use `files` to target specific configurations"*, merged with later-wins). The primitive (`applies-to: string[]`) already exists in our schema (`types.ts:58`, `render-rules.ts:20`) and is read by scoring (`preset-similarity.ts:77-82`) — option (a) **reuses the field**; the only BUILD is making the pipeline **emit** it per-workspace (the T-MS-A gap: `wire-eslint-r2.ts:421-423` emits global today). (b) N independent rule-sets fragments the lock-file and loses the "common lock with `applies-to` markers" the hypothesis wants. (c) dominant-stack-only silently drops the secondary stack — the exact #780 complaint at the enforcement layer. **Determinate on merits** — recommended; **but the coordination with `install-ast-wiring` is a genuine fork → §6.**

### Fork 4 — Genuine ambiguity in non-interactive `-y`

Options: (a) fail-loud (current); (b) detect-all; (c) dominant + warn.

**Recommendation: (b) detect-all for the monorepo case, falling back to a precise error only when detection yields `unknown` for *every* workspace.** Evidence: #780's core grievance is fail-loud-on-`-y`; "detect-all" is the direct fix and is non-destructive (it installs *more* correct scoping, not less). However, **what to do when a single workspace is genuinely `unknown` (the `_detect_stack_from_pkg` `unknown` return, `15-companions-stack.sh:58`) under non-interactive `-y`** is a real values fork (strictness vs convenience) → **§6**. The safe default I recommend: detect-all, scope what is detected, and emit a re-checkable `unknown`-workspace marker (mirroring 547's `R2 N/A` re-checkable marker pattern) rather than `exit 1`.

---

## §4 Recommended phasing

### Does I-1 alone close #780?

**Partially — I-1 closes the #780 *core* (the titled bug); it does NOT close the #780 *secondary nuance* (multi-stack), which is I-2.**

- #780's **title + core** ("fresh `-y` should auto-detect the stack, not fail loud") is closed by **I-1**: wire `_detect_stack_from_pkg` (`15-companions-stack.sh:24-59`) into the `install.sh`/`setup` stack pick so a missing positional triggers single-root detection instead of `exit 1` (`install.sh:197-198`).
- #780's **explicit secondary "decision worth raising"** (the timeliner multi-stack monorepo) is **NOT** closed by I-1 (single-root detect returns one stack). It needs **I-2**.

So: **I-1 closes the issue as titled; the umbrella's A-mandate (open §13.5 now) is what makes I-2 in-scope.** Recommend #780 be closed by I-1 with an explicit note that the multi-stack nuance tracks under §13.5/I-2 (so the issue is not held open on the harder half).

### Ordered plan

**I-1 — install-surface single-stack auto-detect (the direct #780 fix). Cheap.**
- Wire `_detect_stack_from_pkg` into the stack pick: when no positional `STACK` is supplied, run single-root detection; only `exit 1` if it returns `unknown`.
- REUSE: the existing detector (`15-companions-stack.sh:24-59`); align with `feat/547-install-auto-wire-r2`'s "thin probe → repo-read at install" pattern + shared install-time runtime model. Orthogonal surface, do not parallel-build a second harness.
- **Likely NOT a capability commit** (wiring an existing function + small bash branch; no new ≥50/80-LOC module, no new dep) — but the author confirms against the CLAUDE.md capability-commit definition at commit time and adds a `Prior-art:` trailer either way.

**I-2 — multi-stack monorepo (per-workspace detection + enforcement scoping). The §13.5 extension.**
- **Layer 1 (detection):** workspace-dir walk (enumerate from `pnpm-workspace.yaml`/`workspaces`) × per-dir `_detect_stack_from_pkg` → `{dir → stack}` map. Extends `architecture.md` Layer-1 `structure` field (currently v2-backlog, `:67`) toward a workspace-aware kind. **BUILD (thin), REFERENCE Nx/pnpm/turbo** (Slices B/C).
- **Layer 2 (enforcement scoping):** make synth/render/lock **emit per-workspace `applies-to`/`files:`** (the T-MS-A gap — `applies-to` exists in the type + scoring but the wirer emits global today, `wire-eslint-r2.ts:421-423`). **REUSE the `applies-to` primitive + native ESLint `files:` (Slice A); BUILD only the per-workspace emission.** Lock-file carries `applies-to apps/web/**` markers (the field already supports it).
- **Coordination gate:** before building Layer-2 emission, reconcile with `chore/install-ast-wiring-kickoff` (per-package config editing) — see §6 fork. **This is the principal `#parallel-evolution-creep` risk in the umbrella.**

**Does I-2 reuse the `applies-to` primitive vs need new pipeline work?** **Both:** it **reuses** the `applies-to` field (schema + scoring already there) and native ESLint `files:` (no scoping engine to build), but it **needs new pipeline work** to *emit* per-workspace `applies-to`/`files:` (today's emission is global) and a new (thin) per-workspace detection walk.

---

## §5 Self-application (T15) + active-traps note

**Did this research apply build-vs-reuse to its OWN proposals?** Yes:

- Every Layer/slice carries an explicit verdict + T16 "upstream class X vs our class Y, match? evidence" line (§1 Slices A–E). The two genuine BUILD slices (per-workspace detector walk; per-workspace emission) are justified by a **confirmed gap** after the 6-item search (DeepWiki ×5 repos + WebSearch ×3), not asserted from training data (T11/T12 honoured — searches were actually run, outputs quoted in §1).
- **T-MS-A specifically discharged:** I did *not* declare "ESLint native `files:` solves Layer 2" — I verified the pipeline's *actual* emission (`wire-eslint-r2.ts:421-423` global-only) and located the real gap (emission, not the field). Primitive-present ≠ pipeline-uses-it.
- **T3:** every primitive in §2 was re-verified by reading the file; drifted lines corrected (validation `:197` not `:196`; `--refresh` `:157-179`; architecture.md at `docs/meta-factory/`).
- **T7 (adversarial "what did I miss?"):** ran it — surfaced **Rush/Lerna** (covered as REJECT under Slice D — same orchestration-runtime class as Nx/Turbo, no detection novelty) and the **`generator-install-wiring`** branch (added to §2 as orthogonal). Also surfaced that **#780 may be closable by I-1 alone for the titled bug** — captured in §4 rather than left implicit.
- **T16 across all prior-art targets:** done per slice.

**Active traps for the I-phase** (carried into the kickoff §3): T1, T3, T7, T11, T12, T15, T16, T-MS-A, T-MS-B (kickoff-authoring), plus T18 (if I-2 chooses to coordinate-not-duplicate install-ast-wiring, that is the "preserve unique residue, don't just rebuild" discipline).

---

## §6 Open decisions for the maintainer

Genuine forks with no determinate best-on-merits answer (NOT silently decided):

1. **[BIGGEST] I-2 Layer-2 vs `chore/install-ast-wiring-kickoff` — fold, sequence, or REUSE?**
   The `install-ast-wiring` brainstorm already targets **per-package eslint config editing in a monorepo** (its acceptance fixture is literally a monorepo with a per-package `eslint.config.mjs`). I-2's enforcement scoping (emit per-workspace `applies-to`/`files:`) is an adjacent slice of the same Layer-2 surface. This is the principal `#parallel-evolution-creep` risk.
   - **Option A** — I-2 Layer 2 **folds into** install-ast-wiring (one umbrella owns all per-package config emission/editing). Consequence: fewer surfaces, but couples §13.5 to #547 Layer-2 sequencing.
   - **Option B** — I-2 Layer 2 **sequences after** install-ast-wiring and **REUSEs** its AST config-editing primitive. Consequence: clean dependency, but I-2 blocks on a brainstorm that is not yet a plan.
   - **Option C** — I-2 Layer 2 stays **independent** (emit per-workspace `applies-to` in *our generated* config) while install-ast-wiring edits the *consumer-authored* config. Consequence: two coexisting Layer-2 paths (generated-config scoping vs consumer-config editing) — defensible if they target different files, but needs an explicit boundary to avoid drift.
   *No determinate best on the merits* — depends on how the maintainer scopes the #547-Layer-2 vs §13.5 umbrella boundary. **Surfaced, not picked.**

2. **Non-interactive `-y` with a genuinely-`unknown` workspace — strictness vs convenience (Fork 4 residue).**
   When a workspace's `package.json` matches none of the four stacks (`_detect_stack_from_pkg` → `unknown`, `15-companions-stack.sh:58`) under `-y`:
   - **Option A (strict)** — `exit 1` for that workspace (current behaviour, preserves "never silently wrong").
   - **Option B (convenience)** — scope what *is* detected, emit a re-checkable `unknown`-workspace marker (mirrors 547's `R2 N/A` re-checkable-marker pattern), never block.
   I recommend B as the default in §3, but the strict-vs-convenience trade-off is a values call (it changes whether a partially-undetectable monorepo installs at all). **Surfaced for confirmation.**

3. **Is `--stack a,b` worth shipping at all, given per-workspace auto-detect?**
   If auto-detect (Fork 1c) is robust, an explicit `--stack a,b` override may be redundant surface (every wired flag is maintenance, `#adoption-shame` inverse). Keep it as an escape hatch, or drop it and rely on detection + the existing single-positional for the single-stack case? Minor, but a real surface-minimisation call. **Surfaced.**
