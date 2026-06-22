<!-- scope:plugin-packaging -->
# CC plugin packaging (superpowers-style, hybrid) — design spec

> **Status:** brainstorm output, awaiting maintainer spec-review → writing-plans.
> **Date:** 2026-06-22.
> **Authoritative for:** the design of packaging rules-as-tests-aif as a Claude-Code-first plugin distributed through an in-repo marketplace, superpowers-style; the soft-layer/hard-layer split (plugin payload vs `install.sh` enforcement); the hook path-translation refactor (`$CLAUDE_PROJECT_DIR` vs `${CLAUDE_PLUGIN_ROOT}`); the consumer-facing shippable-set triage; the multi-harness adapter layout (CC-first + graceful degradation to non-CC); the recursive self-test that enforces plugin-manifest integrity.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The framework deploy mechanics — those stay in [`install.sh`](../../../install.sh). The `./setup` orchestration — that stays in [one-click-installer design](2026-05-31-one-click-installer-design.md). Build-vs-reuse macro discipline — see [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md). Companion/external-service install — see [companion-install-principle.md](../../../.claude/rules/companion-install-principle.md).

---

## §1 Problem

Today rules-as-tests-aif ships through one entry point — `install.sh` (89 KB) — which copies skills/agents/templates into a consumer repo **and** wires the hard 5-channel enforcement (git hooks via `.husky`, `package.json` devDeps, ESLint configs, CI workflows). That is the project's most hardened surface and it must not regress.

But there is **no plugin-native distribution**. A user on Claude Code cannot do what they can with superpowers:

```text
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

…and instantly get the skills/agents/session-hooks, with skills that **auto-trigger** (no manual `Skill` invocation) because a `SessionStart` hook injects a bootstrap. The closest we have is `extension.json` (an AIF/Gemini best-effort manifest, schema still in draft) and the raw `install.sh`.

**Goal:** ship a Claude-Code plugin (CC-first, all CC features) installable from an **in-repo** marketplace, that delivers the *soft layer* the plugin format supports, and reaches the *hard layer* through a bundled-`install.sh` seam — **superpowers-style**, with graceful degradation to non-CC harnesses (OpenCode et al.). No regression to the existing `install.sh` path.

## §2 The load-bearing distinction — two layers, two channels

The project ships two structurally different kinds of artifact. The plugin format covers exactly one of them.

| Layer | Artifacts | Runs… | Plugin format covers it? |
|---|---|---|---|
| **Soft (session-scoped)** | skills, sub-agents, session hooks (advisory/inject), `commands/`, optional MCP | inside the agent session | **Yes** — `skills/`, `agents/`, `hooks/hooks.json`, `commands/`, `.mcp.json` |
| **Hard (repo-scoped enforcement)** | `.husky` pre-commit/pre-push git hooks, `package.json` devDeps, ESLint/vitest/stryker configs, CI workflows | in the consumer's git/CI infra | **No** — a plugin never mutates the consumer repo's git/CI |

This is the same insight already encoded in [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) (internal-vs-consumer triage) and [companion-install-principle.md §1](../../../.claude/rules/companion-install-principle.md) («our installer installs only our own artefacts»). The plugin **is** the clean delivery for the soft layer; `install.sh` stays the only thing that touches git/CI. The hybrid is the bridge between them (§6).

**Anti-trap (T16):** «plugin» sounds like it replaces `install.sh`. It does not. A plugin that promised the 5-channel enforcement would be lying — exactly the failure the project's own thesis exists to prevent. The plugin honestly delivers soft + a *command* to invoke the hard installer; the README must state this boundary explicitly (the same honesty fix the 2026-06-19 project evaluation recommended for the edit-time channel).

## §3 superpowers patterns to adopt (verbatim where the verdict allows)

Per [build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md), every borrowed capability gets an explicit verdict. Evidence base: the live superpowers + superpowers-marketplace repos, read 2026-06-22.

| # | Pattern (superpowers) | Verdict | Note |
|---|---|---|---|
| 1 | `.claude-plugin/plugin.json` manifest (name/desc/version/author/keywords) | **ADOPT** | Official CC schema; verbatim shape. |
| 2 | `hooks/hooks.json` — `SessionStart` matched on `startup\|clear\|compact`, command via `${CLAUDE_PLUGIN_ROOT}` | **ADOPT** | The auto-context-injection seam. |
| 3 | `hooks/run-hook.cmd` — polyglot Windows/Unix wrapper + **extensionless** hook script names (dodges CC's Windows «prepend bash to anything `.sh`» auto-detect) | **ADOPT** (audited, not blind-copied — T13) | 36 lines; copy + add our own tests. |
| 4 | `using-superpowers` meta-skill — injected at session start, makes skills mandatory/auto-triggering | **ADAPT** → `using-rules-as-tests` | Our content; their mechanism. The single most important UX lever. |
| 5 | `marketplace.json` (`name`/`owner`/`metadata`/`plugins[]` with `source`) | **ADOPT** | In-repo (per maintainer decision), not a separate repo. |
| 6 | Per-harness adapter dirs (`.codex-plugin/`, `.cursor-plugin/`, `.opencode/`, `gemini-extension.json`) all pointing at one shared `skills/` body | **ADAPT** | CC-first now; OpenCode + others as thin later adapters. Our `AGENTS.md` + `extension.json` are the predecessors. |
| 7 | Skill-delivers-action pattern (e.g. `using-git-worktrees` runs setup) | **ADOPT** | This is how the hard-layer install is delivered (§6) — «like superpowers». |

`extension.json` (our existing AIF manifest) is **REFERENCE / predecessor** — it already declares the shippable skill/agent/template set; §5 reuses it as the source of truth rather than re-deriving the list.

## §4 Layout — separate the plugin payload from repo-internal tooling

The repo's own `.claude/` is the **maintainer's dev harness** (15 hooks, `orchestrator-prompts/`, internal skills like `dispatcher`/`pipeline`). Installing the plugin must **not** drag that into a consumer. So the plugin payload is a dedicated subtree; the in-repo marketplace points its plugin `source` at that subtree.

```text
rules-as-tests-aif/                         (existing repo — internals untouched)
├── .claude-plugin/
│   ├── plugin.json                         ← NEW: manifest
│   └── marketplace.json                    ← NEW: in-repo marketplace (1 plugin, source → ./plugin)
├── plugin/                                 ← NEW: the plugin payload root (what consumers get)
│   ├── hooks/
│   │   ├── hooks.json                      ← session hooks, ${CLAUDE_PLUGIN_ROOT}
│   │   ├── run-hook.cmd                    ← ADOPT (§3 #3)
│   │   └── <relocated shippable hooks>     ← extensionless, self-resolving dir (§5)
│   ├── skills/
│   │   ├── using-rules-as-tests/SKILL.md   ← NEW meta-bootstrap (§3 #4)
│   │   ├── rules-as-tests/                 ← from skills/rules-as-tests (already consumer-facing)
│   │   └── installing-enforcement/SKILL.md ← NEW: the hard-layer seam (§6)
│   ├── agents/                             ← consumer-facing subset only (§5)
│   ├── commands/
│   │   └── install-enforcement.md          ← NEW: /rules-as-tests:install-enforcement
│   └── install/                            ← bundled install.sh + templates (hard layer payload)
├── .opencode/INSTALL.md                    ← LATER: graceful-degradation adapter
├── extension.json  AGENTS.md  install.sh   ← unchanged
└── …
```

> **Open detail to verify in the plan:** marketplace `source` for a plugin co-located in the same repo. The CC marketplace schema supports a relative/`directory` source; confirm the exact key (`"source": "./plugin"` vs `{"source":"directory","path":"plugin"}`) against [plugins-reference](https://docs.claude.com/en/docs/claude-code/plugins-reference) before S1 ships — do not guess (T3).

**Install UX (target):**
```text
/plugin marketplace add <user>/rules-as-tests-aif      # in-repo marketplace
/plugin install rules-as-tests@rules-as-tests-aif      # soft layer, instantly
/rules-as-tests:install-enforcement                    # opt-in: wires git-hooks + CI into THIS repo
```

## §5 The path-translation refactor (the engineering core)

Current shipped hooks assume they live **in the consumer project** because `install.sh` copies them there — they reference `$CLAUDE_PROJECT_DIR/.claude/hooks/…`. A plugin hook instead lives in the **plugin install dir**, addressed by `${CLAUDE_PLUGIN_ROOT}`. Both env vars are available to CC plugin hooks; the refactor is to classify every shippable hook's paths:

- **plugin-data paths** (logic, templates, the hook's own siblings) → `${CLAUDE_PLUGIN_ROOT}/…`
- **project-data paths** (the consumer's `.claude/rules/*.md`, files being edited, the repo being audited) → `$CLAUDE_PROJECT_DIR/…`

This is a **per-hook audit**, not a blanket find/replace — many hooks legitimately need the consumer dir (e.g. `inject-matching-rule.sh` reads the consumer's rules; `check-doc-authority.sh` audits consumer files). Blind-swapping one env var for the other breaks them (see trap T-PLUG-A in the kickoff).

**Shippable-set triage** (reuse `extension.json` as SSOT, reconcile with the Artifact Ownership Contract in [CLAUDE.md](../../../CLAUDE.md) + dual-implementation §3):

| Class | Examples | Ships in `plugin/`? |
|---|---|---|
| Consumer-facing skills | `rules-as-tests`, `tool-bootstrapping` | yes |
| Consumer-facing agents | `review-sidecar`, `living-docs-auditor`, `compliance-verifier` | yes (per extension.json + contract) |
| Consumer-relevant session hooks | the advisory/inject subset that operates on consumer files | yes (relocated per above) |
| **Maintainer-internal** | `adopt-orchestrator-prompts.sh`, `runtime-bridge-dispatch.sh`, `dispatcher`/`pipeline` skills, `orchestrator-prompts/` | **no** — internal dev harness |

The triage output is itself a reviewable artifact; shipping the whole `.claude/` is trap T-PLUG-B.

## §6 The hybrid seam — «like superpowers»

superpowers delivers actions through skills (a skill *does* the thing). We mirror that for the hard layer:

1. The plugin **bundles** `install.sh` + all templates under `plugin/install/`.
2. A skill `installing-enforcement/SKILL.md` (gerund naming, superpowers house style) documents and gates the operation.
3. A slash command `commands/install-enforcement.md` → `/rules-as-tests:install-enforcement` runs the bundled installer against `$CLAUDE_PROJECT_DIR` (the consumer's repo), **dry-run first**, consent-gated `[y/N]` (the installer already is idempotent + `--dry-run`-honest).

Result: one `/plugin install` makes the soft layer live immediately; one command opt-in-wires the hard 5-channel enforcement into the current repo. Single distribution, both layers reachable, honest boundary. This satisfies [companion-install-principle.md](../../../.claude/rules/companion-install-principle.md) (own installer installs own artefacts; free-on-subscription, no paid default).

## §7 Recursive self-application — the plugin must enforce its own integrity

The project's signature is «documents lie; tests don't», applied to itself. The plugin packaging gets a companion **principle test** (next free slot, e.g. `packages/core/principles/<N>-plugin-manifest-integrity.test.ts`) asserting mechanically:

- every skill/agent/command referenced by `plugin.json`/`marketplace.json` **exists** on disk;
- `marketplace.json` plugin version **== ** `plugin.json` version (no drift);
- every hook in `plugin/hooks/` addressing plugin-data uses `${CLAUDE_PLUGIN_ROOT}` (grep: no hardcoded plugin-relative `$CLAUDE_PROJECT_DIR/.claude/hooks/…`);
- every shipped hook carries the dual-implementation marker (`@dual-pair`/`@cc-only-rationale`) per [dual-implementation-discipline.md §6](../../../.claude/rules/dual-implementation-discipline.md);
- shipped agents pass the existing **principle 21** (shipped-agent-tools — the one that would have caught bug #551: unresolvable tool names).

Plus **paired-negative sanity** (per `discipline-self-check.yml` precedent): a fixture with a deliberately broken manifest must fail the test. This is what makes the packaging itself non-theatre.

## §8 Multi-harness — CC-first, degrade gracefully (maintainer decision)

CC gets the full feature set (all hooks, commands, MCP). Non-CC harnesses (OpenCode and the rest) get the **portable substrate** the project already proved portable (principle 21 agnosticism-conformance; skills self-resolve via `$(dirname "${BASH_SOURCE[0]}")`). Concretely:

- **Now (S1–S6):** `.claude-plugin/` perfect; `AGENTS.md` already carries the cross-harness instruction layer.
- **Later (S7):** thin `.opencode/INSTALL.md` adapter (superpowers' OpenCode pattern: «fetch + follow INSTALL.md»), pointing at the same `plugin/skills/` body. The one accepted off-CC degradation: session-hook auto-injection may not fire — the meta-skill is then read on demand, exactly the posture in [dual-implementation-discipline §3 posture-reconciliation](../../../.claude/rules/dual-implementation-discipline.md). Not a portability gap — a documented degradation.

## §9 Stage map (bite-sized; the kickoff orchestrates this)

| Stage | Deliverable | Acceptance (verifiable) | Parallel? |
|---|---|---|---|
| **S0** | This spec + prior-art SSOT entry (superpowers, extension.json, CC-plugin-docs) | SSOT entry with Verdict/Rationale/Trigger; principle 08 green | — |
| **S1** | `.claude-plugin/plugin.json` + `marketplace.json` + `plugin/` skeleton + `run-hook.cmd` (ADOPT) | `/plugin marketplace add .` loads; manifest schema-valid; marketplace `source` key verified against docs | no (foundational) |
| **S2** | Hook relocation: triage 15 hooks; convert shippable ones to extensionless + self-resolving + correct env vars + `hooks.json` | shipped hooks fire from plugin root in a throwaway consumer repo; no mis-rooted paths; markers present | no |
| **S3** | `using-rules-as-tests` meta-bootstrap skill + `SessionStart` wiring; assemble shippable `skills/` | fresh session in throwaway repo surfaces bootstrap; skills discoverable via Skill tool | yes w/ S4 (disjoint) |
| **S4** | Ship consumer-facing agent subset; pass principle 21 | agents resolve; principle 21 green | yes w/ S3 |
| **S5** | Hybrid seam: bundle `install.sh`+templates; `installing-enforcement` skill + `/install-enforcement` command | command dry-run-wires git-hooks/CI into a throwaway repo; consent-gated | no (needs S1) |
| **S6** | Recursive self-test: `<N>-plugin-manifest-integrity.test.ts` + paired-negative fixture + doc-authority headers on new shipped docs | principle test green; negative fixture fails; principle 09 green | no (needs S1–S5) |
| **S7** | OpenCode adapter + reconcile `extension.json`/`AGENTS.md` | OpenCode INSTALL path documented; skills load off-CC | yes |
| **S8** | README install section (superpowers-style per-harness) + version bump + integration PR + `done.md` | e2e: marketplace add → install → skills active → `/install-enforcement` wires hard layer | no (last) |

Stage-gate (Phase -1 cold-review + merge check) between every stage.

## §10 Prior-art / capability-commit obligations

Some stages cross the capability-commit LOC threshold (`run-hook.cmd`, the principle test, the install command). Each such commit carries a `Prior-art:` trailer per [CLAUDE.md «Build-vs-reuse invariant»](../../../CLAUDE.md). New SSOT entries (S0): **superpowers plugin/marketplace pattern** (ADOPT — official CC schema, verbatim shape), **superpowers `run-hook.cmd`** (ADOPT, audited), **`using-superpowers` bootstrap** (ADAPT — our content), **CC plugins-reference** (REFERENCE). No paid-LLM-in-CI implication — bash + JSON + TS test only.

## §11 «🟢 Простыми словами»

Сейчас твой проект ставится одним большим `install.sh`. Мы делаем из него ещё и **плагин Claude Code** — как superpowers: пользователь добавляет маркетплейс одной командой и сразу получает скиллы, агентов и session-хуки, причём скиллы срабатывают сами (благодаря мини-скиллу-бутстрапу, который CC подсовывает в начале сессии). Жёсткую часть (git-хуки, CI) плагин честно **не** делает — её включает отдельная команда `/install-enforcement`, которая запускает тот же `install.sh` уже внутри твоего репозитория. Claude Code — со всеми плюшками; на других харнессах (OpenCode и т.д.) — то же ядро, но без авто-инъекции (читается по запросу). И всё это сам проект проверяет своим же тестом-принципом, чтобы манифест не врал.

## See also

- [2026-05-31-one-click-installer-design.md](2026-05-31-one-click-installer-design.md) — the `./setup` orchestration this packaging sits beside.
- [.claude/rules/dual-implementation-discipline.md](../../../.claude/rules/dual-implementation-discipline.md) — internal-vs-consumer + CC-native/portable triage.
- [.claude/rules/companion-install-principle.md](../../../.claude/rules/companion-install-principle.md) — own-installer / free-on-subscription discipline.
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — the seven-verdict adoption discipline applied in §3.
- [extension.json](../../../extension.json) — predecessor manifest; SSOT for the shippable set.
