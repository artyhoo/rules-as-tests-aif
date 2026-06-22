<!-- scope:multi-stack-react-spa-rphase -->
# React-SPA preset — rule prior-art R-phase (epic #646 Stage 1)

> **Date:** 2026-06-20
> **Slug:** react-spa-rules-rphase
> **Type:** R-phase (prior-art research for capability commits; **no source mutation** — records verdicts + SSOT drafts, builds nothing).
> **Umbrella:** multi-stack support (epic [#646](https://github.com/Yhooi2/rules-as-tests-aif/issues/646)) Stage 1; design [docs/superpowers/specs/2026-06-19-multi-stack-hybrid-design.md](../../superpowers/specs/2026-06-19-multi-stack-hybrid-design.md) §5.

---

## §0 Method + environment caveat (read first)

Per spec §5, each react-spa rule is a capability commit requiring a prior-art consult (`build-first-reuse-default.md` §3 + the 6-item search-coverage checklist). This patch records the verdicts that gate I-phase.

**DeepWiki MCP was DOWN in this environment** — every `mcp__deepwiki__ask_question` returned `not connected`. This matches the established in-repo precedent (SSOT #121/#123 both recorded DeepWiki-unavailable and substituted WebSearch). Per that precedent, **WebSearch ≥3 phrasings per negative-existence claim** was the substitute. **All verdicts below are WebSearch-grounded + own-stack-grounded, NOT DeepWiki-verified.** Load-bearing consequence: the two negative-existence claims (candidates B, C) are **provisional-strong** — DeepWiki re-probe of `javierbrea/eslint-plugin-boundaries` and `Rel1cx/eslint-react` is required **before** the C-presence BUILD commit lands (§5 open items).

**Own-stack finding (load-bearing):** `eslint-plugin-react` + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y` are **already adopted** in `packages/preset-next-15-canonical/templates/eslint.config.react.mjs` (imports `:10-12`, wiring `:136-176`, `react-hooks/exhaustive-deps:'error'` `:168`). Candidates A1-A3 are an **established ADOPT precedent inherited by a second preset**, not new capabilities — yet the SSOT had **no rows** for them (a latent `#own-stack-blind-spot`). This patch backfills them.

## §1 Per-candidate verdicts

| # | Candidate | Verdict | Core rationale (T16 problem-class) | Falsifier |
|---|---|---|---|---|
| A1 | `eslint-plugin-react` | **ADOPT** | JSX/React static-AST correctness. Already flat-config-wired in next-15 → in-repo proof of ESLint-v9 + React-19-jsx-runtime fit. SPA-clean (no SSR coupling). Class match: identical surface. | Preset adopts `@eslint-react` as primary (→ REFERENCE); or drops ESLint-v9 flat support. |
| A2 | `eslint-plugin-react-hooks` **v6** | **ADOPT v6** | Rules-of-Hooks + exhaustive-deps **+ bundled React Compiler rules** (v6 merged the deprecated `eslint-plugin-react-compiler` under `react-hooks/` ns). Compiler runs in pure Vite SPA (react.dev: «works independently of Server Components»). | Consumer pinned React <19; or v6 Compiler rules too noisy (mitigated: opt-in tiers, degrade to «skipped optimization»). |
| A3 | `eslint-plugin-jsx-a11y` | **ADOPT** | Static a11y AST lint; render-target-agnostic → zero SSR/React-19 coupling; cleanest fit. Flat-config ready (v6.10). | jsx-a11y drops flat-config / ESLint-v9. |
| — | **React Compiler lint** (NEW, issue under-listed) | **ADOPT (folds into A2)** | `eslint-plugin-react-compiler` is **deprecated/merged into react-hooks v6**. Adopting A2-v6 *is* adopting it — no separate dep. The React-19 value-add. | Consumer cannot run Compiler / React <19. |
| B | `no-business-logic-in-component` | **ADAPT** (not clean BUILD) | T16 partial: `eslint-plugin-boundaries` / `dependency-cruiser` (already in stack, SSOT #119) cover the **import-boundary** half (presentation ↛ domain). REUSE that. Genuine BUILD only for the **inline-logic residue** (raw fetch/money-math in a component body with no import to cross) — and only on demonstrated need (else YAGNI). Issue's «BUILD via dependency-cruiser» premise corrected: it's REUSE of an existing engine. | Intent is *purely* import-boundary → clean ADOPT, zero BUILD; OR a corpus proves inline cases that matter → ADAPT residue justified. |
| C | `require-error-boundary` | **T16 SPLIT: BUILD (presence) + ADOPT/REFERENCE (usage)** | Upstream `eslint-react/error-boundaries` exists but validates **usage** (try/catch → boundary), NOT **presence** of a boundary above a tree. WebSearch ×3: no production rule enforces boundary *presence* at route/app-root. Vite SPA has no Next `error.tsx`/RR `errorElement` convention → genuine gap. BUILD the presence rule (own-built family, mirrors `eslint-rules/require-use-server-directive.ts`); ADOPT/REFERENCE the usage rule. | A plugin ships a *presence-requiring* rule (DeepWiki re-probe); OR router convention guarantees presence → redundant; OR static-AST false-positive rate untenable → demote to principle-test channel. |

## §2 Primary-React-plugin fork — RESOLVED (orchestrator, 2026-06-20)

The research surfaced a fork it did not resolve (correctly — `reviewer-discipline`-class): primary plugin = `eslint-plugin-react` (next-15's choice) **vs** `@eslint-react/eslint-plugin` (`Rel1cx/eslint-react`, newer, React-19-first, composable, absorbs A1 + B-partial + C-usage).

**Resolution: `eslint-plugin-react`.** This is a clear call on the project's merits, not a genuine taste fork (initial framing as «equivalent» was an over-deferral):
- `dual-implementation-discipline.md` — against a second plugin-paradigm across presets; cross-preset consistency lowers maintenance.
- `build-first-reuse-default.md` `#parallel-evolution-creep` — against parallel evolution for marginal gain.
- The pro-`@eslint-react` argument («absorbs candidates») **fails for the main BUILD**: C-presence is *not* absorbed (upstream `error-boundaries` = usage, not presence). So the absorption gain is marginal; consistency wins.

`@eslint-react` → **WATCHLIST** (SSOT #141), revisit-trigger: C-presence BUILD proves expensive, OR a cross-preset migration to `@eslint-react` is undertaken deliberately.

## §3 SSOT entries added

Rows **#136–#141** appended to [prior-art-evaluations.md](../prior-art-evaluations.md) §4 (was max #135): #136 `eslint-plugin-react` ADOPT · #137 `eslint-plugin-react-hooks` v6 ADOPT · #138 `eslint-plugin-jsx-a11y` ADOPT · #139 `eslint-plugin-boundaries`+dependency-cruiser ADOPT/ADAPT · #140 `require-error-boundary` BUILD/ADOPT split · #141 `@eslint-react/eslint-plugin` WATCHLIST.

## §4 Confidence + coverage

A1/A3 **High** (direct in-repo file evidence + WebSearch). A2 + React-Compiler-merge **High** (WebSearch ×4 converging: reactjs/X, react.dev, npm, Compiler v1.0 blog). B **Medium-High** (3 distinct paradigms returned analogs; inline-residue *need* unproven). C **Medium-High** (3 phrasings confirm no presence-rule; the negative claim is the weakest single point). **Uniform caveat: zero DeepWiki verification (server down — documented precedent, not a lapse).** No load-bearing training-data-only claims.

## §5 Open items for I-phase (do NOT skip)

1. **DeepWiki re-probe before C-presence BUILD + B-residue ADAPT** — re-run `javierbrea/eslint-plugin-boundaries` + `Rel1cx/eslint-react` + `facebook/react` when DeepWiki returns; upgrade the two provisional-strong negative claims before the capability commits.
2. **C v1 scope must be narrow** — static-AST presence check is brittle cross-file (per SSOT #115 manual-rule-liveness precedent). v1 = «app-root `createRoot().render()` or top-level route element has an ErrorBoundary/Suspense ancestor *in-file*», or route to a principle-test channel. Broad scope reproduces #115 brittleness.
3. **B inline-residue is YAGNI until demonstrated** — ship the boundary REUSE (`eslint-plugin-boundaries`/dependency-cruiser layer rule); do NOT BUILD the inline-logic AST rule without a corpus showing it matters.
4. **`eslint-plugin-react-compiler` deprecation** — grep preset templates during I-phase; if any doc tells consumers to install it standalone, redirect to `eslint-plugin-react-hooks@^6`.

## §6 §1.7 self-reflexive note

- **Forward-check:** this R-phase patch complies with `build-first-reuse-default.md §3` (it IS the prior-art-consult mechanism — DeepWiki-substituted-by-WebSearch per the #121/#123 precedent, ≥3 phrasings on the B/C negative-existence claims), `no-paid-llm-in-ci.md` (research ran in an interactive session — zero API-billed CI calls), and `doc-authority-hierarchy.md` (scope comment + folder-level authority via research-patches/README). No new rule is introduced — research only.
- **Backward-check:** records the react-spa R-phase verdicts; supersedes nothing. **Recursive self-application (T15):** the framework applies its own build-first-reuse discipline to its own multi-stack expansion — it researches before building its own presets, exactly as it requires of consumers. The DeepWiki-down caveat is surfaced honestly (T6) rather than papered over as full coverage.

## See also

- [docs/superpowers/specs/2026-06-19-multi-stack-hybrid-design.md](../../superpowers/specs/2026-06-19-multi-stack-hybrid-design.md) §5 — the discipline this patch executes.
- [prior-art-evaluations.md](../prior-art-evaluations.md) §4 — SSOT rows #136–#141 land here.
- `packages/preset-next-15-canonical/templates/eslint.config.react.mjs` — the ADOPT precedent (A1-A3) to mirror.
- `packages/preset-next-15-canonical/eslint-rules/require-use-server-directive.ts` — custom-AST-rule pattern for C-presence BUILD.
