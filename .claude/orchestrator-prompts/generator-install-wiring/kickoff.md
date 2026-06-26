# generator-install-wiring — synthesizer-as-source / preset-as-oracle

> **Class:** operational artifact (implementation kickoff). **Status:** DRAFT — authored, not yet on `staging`, NOT dispatched.
> **Authoritative for:** the scope, stages, and acceptance of promoting the deterministic synthesizer to the install-time source of the *rules-as-tests* ESLint config slice; the corrected OQ3 merge-target; the active AI-laziness traps for this work.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md). The grounded current-state evidence — see GitHub issue **#728** (the single source of truth this kickoff implements; re-verify its file:line claims before trusting them).

> **Source of truth:** GitHub issue **#728** — *"Install drives the synthesizer as source for the rules-as-tests config layer (preset = oracle)"*. This kickoff is the dispatchable form of that issue. It **supersedes** the older "synthesizer emits side-files nobody reads → wire them in" framing.
> **Verified base:** `origin/staging` @ `be999a8b3` (the S4 one-shot commit, #725). *(Issue #728 cites `be899a8b3` — a transcription typo; the real commit is `be999a8b3`.)*

---

## §1 Intent (the why)

The hand-written presets were authored **first, deliberately, as the gold reference**. The plan was always: build the generator, prove it reproduces the gold, then have the generator *drive* the install while the preset stays as the comparison oracle. "The preset already contains these rules" is **not** a reason to skip the generator — it is exactly the oracle that makes generator-driven install safe to land.

Promote the deterministic synthesizer from *"emits side-files"* + *"mirrored by a hand-maintained template"* to **the install-time source** of the *rules-as-tests* config slice. For currently-supported stacks the generated slice is byte-identical to the hand-inlined preset (principle 26 guarantees it) → **no observable enforcement change**. The value is architectural: one source (recipes → synthesizer → install), the hand-copy removed, the gold preset retained purely as the comparison oracle. New rules then flow recipe → consumer automatically instead of via a hand-edit.

## §2 Grounded current state (re-verify before trusting — T3)

All claims below were file:line-verified against `origin/staging` (2026-06-26). The executor MUST re-verify, not trust this prose (T3, T16).

1. **Generator engine exists + works.** [`packages/core/synthesizer/synthesize.ts`](../../../packages/core/synthesizer/synthesize.ts) (~L98-111) compiles each declarative recipe `{selector, message}` into the `rules-as-tests/restricted-syntax-audit-exempt` wrapper config via `declarativeRestrictedConfigEntry`.
2. **Generator owns ONLY the AIF *rules-as-tests* slice** — not the whole config. The preset additionally ships typescript-eslint / react / jsx-a11y / `no-restricted-syntax` (built-in) blocks the generator neither produces nor should.
3. **Generated slice is hand-inlined into the preset** — [`packages/preset-next-15-canonical/templates/eslint.config.react.mjs`](../../../packages/preset-next-15-canonical/templates/eslint.config.react.mjs) lines **223** (`no-unsafe-zod-parse`), **232** (`no-server-imports-in-client`), **247** (`restricted-syntax-audit-exempt` wrapper, R14/R20 selectors).
4. **A drift guard already compares generator output vs the preset** — [`packages/core/principles/26-template-selector-sync.test.ts`](../../../packages/core/principles/26-template-selector-sync.test.ts) asserts every wrapper selector the synthesizer generates appears verbatim in the preset template.
5. **Install does NOT call the synthesizer.** `git grep -i synthes -- setup.d/ install.sh` → empty. [`setup.d/40-configs.sh`](../../../setup.d/40-configs.sh) copies hand-written rule files + regenerates the barrel; [`setup.d/99-finalize.sh`](../../../setup.d/99-finalize.sh) runs only the **R2-specific** AST wirer (path assigned L32, invoked ~L51) [`packages/core/install/wire-eslint-r2.ts`](../../../packages/core/install/wire-eslint-r2.ts) (single-rule: `R2_RULE_ID = 'rules-as-tests/no-unsafe-zod-parse'`).
6. **§7 liveness green** — [`tests/install-sh/f17-lint-rules-planted-violation.test.sh`](../../../tests/install-sh/f17-lint-rules-planted-violation.test.sh) exists (planted `.parse()` flagged, `audit:exempt` paired-negative skips). *Re-run it on the executor's Node version — existence ≠ green (T3, T-GIW-A).*

## §3 The task (ordered)

1. **Generalize the wirer.** Promote single-rule `wire-eslint-r2.ts` into an **N-rule wirer** that merges the synthesizer's emitted `rules` object into the consumer's resolved ESLint config — idempotent, non-destructive, format-preserving, graceful-degrade (same discipline as the R2 wirer + `--wire-ci`). R2 becomes a special case of the general path; reuse the installed ESLint engine + ts-morph AST machinery.
2. **Call the deterministic synthesizer from the appropriate `setup.d/*` layer** for the detected stack — `synthesize.ts` / `compile-declarative-md.ts` ONLY. **Never** `generate.ts` (the live/non-deterministic LLM path — `GenerateClient` supplies rule body; forbidden in install by [principle 17 — no-paid-llm-in-ci](../../../packages/core/principles/17-no-paid-llm-in-ci.test.ts)).
3. **Flow the generated slice into the barrel** `eslint-rules-local/index.ts` the same regenerated way copied rules do.
4. **Reframe principle 26** from *"template hand-inlines selectors"* to *"generated install output == hand-written gold reference"* (OQ1). Keep a drift guard in both directions; the wording/mechanism changes, the guarantee does not.
5. **TDD against the preset as gold.** A test asserts generated install output == the hand-written gold preset for each supported stack.

## §4 Corrected OQ3 — the override merge-target (DO NOT trust the issue's example — T16)

> **Issue #728 OQ3 contains a factual error the executor must not propagate.** It says *"The preset base block already configures `restricted-syntax-audit-exempt` (e.g. a `TSEnumDeclaration` selector)"*. **Wrong.** Verified on staging:
> - `TSEnumDeclaration` (eslint.config.react.mjs **L127**) sits under the **built-in** `no-restricted-syntax` rule (L124) — a *different* rule the synthesizer never touches.
> - `rules-as-tests/restricted-syntax-audit-exempt` appears **exactly once** (L247), carrying the **R14/R20** selectors.

**The real flat-config last-wins risk** is: the synthesizer emits the wrapper for `RULE_GLOBS.boundary`; the preset *already* configures that same wrapper key on `RULE_GLOBS.boundary` (L237/247). A naively-appended second config object for the same rule on overlapping globs **overrides** (last-wins per file) rather than appends — silently dropping the preset's existing R14/R20 selector array. The N-rule wirer MUST merge into the existing entry's selector array, not clobber it. The `TSEnumDeclaration`/built-in `no-restricted-syntax` block is **out of scope** — do not merge into it.

## §5 Scope

**In:** generalize the wirer; call the deterministic synthesizer from `setup.d/*`; merge generated slice into config + barrel; reframe principle 26 as generated-vs-gold; TDD against the preset as gold; honor `--dry-run` + `FULL`/byte-identical gate semantics (`LAYERS.md`).

**Out:** the live-LLM `generate.ts` path in install (forbidden, principle 17); require/type-aware codegen (deferred); authoring **new** recipes; producing the non-AIF ESLint blocks (typescript-eslint / react / jsx-a11y / built-in `no-restricted-syntax` stay template-shipped).

## §6 Open questions / risks

1. **Principle 26 reframe (OQ1).** Decide: (a) generated-config == gold-preset equality test, or (b) keep the template as gold and assert install reproduces it. Either keeps a drift guard; surface the chosen mechanism explicitly.
2. **ts-server has zero recipes.** Verified: all 10 recipes are `appliesTo: ["next"]`. `synthesize` emits `{}` for ts-server → install wires nothing (graceful no-op). The end-to-end planted-violation demo MUST run on **react-next** (where recipes exist); `bash setup ts-server` is verified as an idempotent no-op, NOT as "contains synthesized rules" (that is unsatisfiable by construction).
3. **Flat-config override semantics** — see §4 (corrected). Merge into the existing wrapper entry, do not clobber.
4. **Deterministic == gold only because the gold was built from the recipes.** If a future recipe selector is refined, the gold must be regenerated; the oracle test catches drift in both directions.

## §7 Build-vs-reuse (mandatory before any "I propose…" — T11)

Generalize `wire-eslint-r2.ts`; reuse the installed ESLint engine + ts-morph AST machinery. A from-scratch wirer is `#parallel-evolution-creep`. Prior-art SSOT rows to consult/cite (all verified present in [`docs/meta-factory/prior-art-evaluations.md`](../../../docs/meta-factory/prior-art-evaluations.md)):
- **#120** — install auto-wires R2 by reading the repo (the wirer this task generalizes).
- **#118** — `check:enforced` resolved-config gate (`eslint --print-config`) — reuse for the non-vacuity proof.
- **#114** — guard-liveness negative-test roundtrip.

Capability commits carry a `Prior-art:` trailer (per [CLAUDE.md «Build-vs-reuse invariant»](../../../CLAUDE.md)).

## §8 AI-laziness traps

Per [`.claude/rules/ai-laziness-traps.md §2`](../../../.claude/rules/ai-laziness-traps.md) — read the catalogue, instantiate the countermeasures, do not blanket-reference.

**Active canonical traps for this work:**
- **T3** (plausible finding without verification) — §2's file:line claims are pre-verified prose; re-open each file before relying on it. No prose-only findings.
- **T5** (no implementation bundled into research) — if a stage is scoped research-only, output is markdown, not source edits.
- **T11** (prior-art before "I propose") — §7 SSOT consult is mandatory before introducing any new mechanism over generalizing the existing wirer.
- **T15** (self-application) — the generated config must itself pass the project's own gates (`make self-audit`, principles 17/21/25/26); audit the audit.
- **T16** (pattern-matching-on-name) — the headline case here: the issue's OQ3 conflates `restricted-syntax-audit-exempt` with the built-in `no-restricted-syntax` (TSEnumDeclaration). Verify the actual merge target (§4), do not match on rule-name similarity.

**Domain-specific traps:**
- **T-GIW-A — non-vacuity of the liveness proof.** Tempted output: "f17 exists / oracle test green → done". Counter: the planted-violation acceptance MUST show, on the executor's Node version, BOTH (i) `eslint --print-config` lists the generated rule as present AND (ii) a RED run on a planted violation. A green test on a stack with zero recipes (ts-server) proves nothing — run on react-next.
- **T-GIW-B — equality-by-construction masquerading as a test.** Tempted output: an oracle test that compares the generated slice to the gold by re-deriving the gold from the same synthesizer call (tautology). Counter: the gold side MUST read the **shipped preset template file** as a static string, never re-run the synthesizer to produce both sides (principle-02 paired-negative discipline; same trap principle 26 already guards against).

## §9 Acceptance

- `bash setup react-next` on a clean consumer produces an ESLint config + barrel whose *rules-as-tests* slice is **generated by the synthesizer** (shown by diff) and is **equal to the hand-written gold preset** (oracle test green).
- A planted violation for a generated rule **fails at the earliest reachable channel** (edit-time / pre-push), proven on the executor's Node version (T-GIW-A: `eslint --print-config` shows the rule present + a RED planted-violation run).
- `bash setup ts-server` → empty synth → graceful idempotent no-op.
- Re-running install is a no-op; `--dry-run` writes nothing.
- Principles 17, 21, 25, (reframed) 26 stay green; `make self-audit` green.

## §10 Dispatch sequencing (binding — kickoff-staging-placement)

Per [`.claude/rules/kickoff-staging-placement.md §1`](../../../.claude/rules/kickoff-staging-placement.md): this kickoff is a tracked dispatch input read from `staging`. **Author → merge this kickoff to `staging` (PR, squash) → only then `/pipeline generator-install-wiring` or aif dispatch.** Dispatching while it lives only on a feature branch = `#dispatch-before-staging` (the dispatch session, running on `staging`, silently can't find it).

## §11 See also

- GitHub issue **#728** — grounded current state + intent (source of truth).
- [`.claude/rules/ai-laziness-traps.md`](../../../.claude/rules/ai-laziness-traps.md) — §2 trap catalogue, §3 author obligations.
- [`.claude/rules/build-first-reuse-default.md`](../../../.claude/rules/build-first-reuse-default.md) — generalize-don't-rebuild discipline.
- [`docs/meta-factory/prior-art-evaluations.md`](../../../docs/meta-factory/prior-art-evaluations.md) — SSOT #120 / #118 / #114.
