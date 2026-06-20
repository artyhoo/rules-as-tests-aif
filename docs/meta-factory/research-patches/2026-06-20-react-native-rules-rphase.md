<!-- scope:multi-stack-react-native-rphase -->
# React-Native preset — rule prior-art R-phase (epic #646 Stage 1)

> **Date:** 2026-06-20
> **Slug:** react-native-rules-rphase
> **Type:** R-phase (prior-art research for capability commits; **no source mutation** — records verdicts + SSOT drafts, builds nothing).
> **Umbrella:** multi-stack support (epic [#646](https://github.com/Yhooi2/rules-as-tests-aif/issues/646)) Stage 1; design [docs/superpowers/specs/2026-06-19-multi-stack-hybrid-design.md](../../superpowers/specs/2026-06-19-multi-stack-hybrid-design.md) §5. Sibling of the react-spa R-phase ([2026-06-20-react-spa-rules-rphase.md](2026-06-20-react-spa-rules-rphase.md), SSOT #136–#141).

---

## §0 Method + environment (read first)

Per spec §5, each react-native rule is a capability commit requiring a prior-art consult (`build-first-reuse-default.md` §3 + the 6-item search-coverage checklist). This patch records the verdicts that gate the react-native I-phase. It does **not** mutate `packages/` — research only.

**DeepWiki MCP was UP in this environment** (positive delta vs the react-spa sibling, where every probe returned `not connected`). Negative-existence claims here are therefore **DeepWiki-verified at the source repo** (the strongest possible evidence: the tool that owns the artefact reports it ships no such rule), cross-checked with WebSearch ≥3 phrasings. This patch also **discharges react-spa §5 open-item-1 in part** — DeepWiki was re-probed for the RN-adjacent repos below.

> **Correction (2026-06-20, post-merge file-verify).** DeepWiki-UP is reliable for *what a repo's source contains* but **not** for *what ESLint semantics that source implies*: probed twice on the same question it returned **opposite** answers («defines/readable, not forbidding» vs «undefined → forbidden»). Its prose claim that `eslint-config-expo` "forbids `globals.browser`" was **falsified** by reading the real `flat/default.js` (`...globals.browser` spread + `window: false`≡`"readonly"`, no `no-restricted-globals`) against ESLint's own globals docs (`false`≡readonly≡*defined/readable*; only `"off"` disables). The expo-globals claim in §1 A1 / candidate B / SSOT #142/#146 is corrected accordingly and §5 open-item-4 is **discharged**. Lesson (§1.10 type-system/spec over prose): for SDK/spec-shaped semantics, the tool's own spec wins over any LLM-over-repo prose — the same `whitelists ≠ forbids` error this patch already caught for #144 (`eslint-plugin-react-native` env) was latent in the expo claim because it was DeepWiki-prose, not file-verified.

**Dependency on the in-flight react-spa PR ([#648](https://github.com/Yhooi2/rules-as-tests-aif/pull/648), branch `claude/hopeful-clarke-6517e0`, OPEN — not yet on `staging`):** this patch cites the design spec (lands via #648) and **continues SSOT numbering from #142** (rows #136–#141 are reserved by #648; trailer IDs are immutable post-push, so they are not reused). **Merge order: #648 first, then this PR.** The `prior-art-evaluations.md` tail append in this PR is positioned after the current `staging` tail (#135); if #648 merges first, the tail reorders to #135 → #136–#141 (#648) → #142–#148 (this PR) — a trivial, expected parallel-register reconcile.

## §1 Per-candidate verdicts

The issue/spec name three react-native rule candidates as **BUILD hypotheses** (`no-web-only-globals`, `require-stylesheet-create`, `prefer-flashlist-over-flatlist`). **All three resolve to REUSE/ADOPT/REJECT — zero clean BUILDs survive the prior-art consult.** This is the BFR-default-predicted outcome and mirrors react-spa (where the issue's BUILD premises for `no-business-logic-in-component` and `require-error-boundary` were likewise corrected).

| # | Candidate | Verdict | Core rationale (T16 problem-class) | Falsifier |
|---|---|---|---|---|
| A1 | `eslint-config-expo` (`/flat`, Expo SDK 53+) | **ADOPT** — Expo-path baseline | Official Expo config; bundles `eslint-plugin-react` + `react-hooks` + `eslint-plugin-expo`; flat-config native; its globals block **spreads `...globals.browser` and sets `window: false` (≡ `"readonly"`) — i.e. *whitelists* web-only globals as defined/readable, NOT forbidding them** (file-verified 2026-06-20: gh `expo/expo:packages/eslint-config-expo/flat/default.js:23,38`; ESLint docs — `false`≡readonly≡defined, only `"off"` disables). **So A1 does NOT close candidate B "for free"** (see B). Own-stack-official baseline; the dominant modern RN path. | Preset targets **bare** RN (no Expo) → A2 baseline instead; or Expo drops the flat export. |
| A2 | `@react-native/eslint-config` (`/flat`) · `@callstack/eslint-config` (`react-native.flat.js`) | **ADOPT** — bare-RN-path baseline | Official RN-core config and Callstack's maintained bundle, both flat-config (WebSearch 2026-06-20). For the non-Expo path; `@callstack` is the more actively-maintained of the two. | Preset is Expo-only → A1 alone suffices; bare-RN path deferred. |
| A3 | `eslint-plugin-react-native` (Intellicode, v5.0.0) | **ADOPT** — RN style/text rules · **WATCHLIST (low-maint)** | 7 RN-specific rules: `no-inline-styles`, `no-color-literals`, `no-unused-styles`, `split-platform-components`, `no-raw-text`, `sort-styles`, `no-single-element-style-arrays` (DeepWiki `Intellicode/eslint-plugin-react-native`). Peer-dep `eslint … || ^9`; repo pushed 2024-12-30. **NOT bundled by eslint-config-expo** → explicit add. Maintainer self-reports compat-only (disengaged from RN) → WATCHLIST. | Plugin breaks under a future ESLint with no fork → migrate to `@callstack` bundle, or own-build only the 1–2 load-bearing style rules. |
| A4 | `eslint-plugin-react-native-a11y` (FormidableLabs/Nearform) | **ADOPT** — RN a11y (NOT jsx-a11y) | **T16 catch: do not inherit react-spa's `jsx-a11y` (#138) for RN.** jsx-a11y targets web ARIA/DOM; RN a11y is a *different problem-class* — `accessibilityRole`/`accessibilityLabel`/`accessibilityState`. This plugin validates the RN props; **actively maintained (Nearform, 2026-06-20), v9 fixes landed** (DeepWiki). | Preset ships no a11y rules in v1 (defer a11y entirely); or full flat-config support proves incomplete → pin/patch. |
| B | `no-web-only-globals` (issue: BUILD) | **ADAPT** — REUSE-config-first, not a custom BUILD | **Issue BUILD premise corrected.** The generic forbid mechanism is core **`no-restricted-globals`** denylist (ESLint docs; WebSearch ×3) — the single config-level forbid. **Correction (file-verified 2026-06-20, gh `expo/expo:.../flat/default.js:23,38`):** `eslint-config-expo` does **NOT** forbid `window`/`document`/`localStorage` — its globals block *whitelists* them (`...globals.browser` + `window: false` ≡ `"readonly"` per ESLint docs, A1); the Expo baseline therefore does **not** close this candidate, and `no-restricted-globals` must be added explicitly (primary, not a fallback). This is the **same `whitelists ≠ forbids` error** also present in DeepWiki's claim that `eslint-plugin-react-native`'s `react-native/react-native` env "detects" web globals — README:55 confirms that env merely *whitelists* browser-like globals (defines them so `no-undef` stays quiet), the **opposite** of forbidding. Genuine BUILD residue (member-expression `window.document`, a curated RN-unavailable-API denylist with tailored messages) is **YAGNI until a corpus demonstrates it**. | A corpus shows member-access patterns config-REUSE misses **and** they matter at runtime → thin ADAPT residue (mirrors react-spa candidate B inline-residue pattern). |
| C | `require-stylesheet-create` (issue: BUILD) | **ADOPT** `react-native/no-inline-styles` (+ style family); BUILD residue YAGNI | **Issue BUILD premise corrected.** `no-inline-styles` flags inline literal-value style objects → drives `StyleSheet.create` adoption (DeepWiki + README:80/93). Problem-class match is strong; the style family (`no-color-literals`, `no-unused-styles`) reinforces it. | Intent is the strictly-stronger "every style must originate from `StyleSheet.create`" (beyond no-inline-styles) **and** a corpus proves the gap matters → thin BUILD residue. |
| D | `prefer-flashlist-over-flatlist` (issue: BUILD) | **REJECT** the BUILD → REUSE `no-restricted-imports` (opt-in, default-off) | **No upstream rule exists** — DeepWiki `Shopify/flash-list` confirms FlashList ships *no* ESLint plugin/rule to enforce itself over FlatList; WebSearch ×2 confirm no third-party rule. But BUILD is rejected on **merits**, not just absence: (a) it is a **perf-opinion, not a correctness invariant** — the project thesis is "documents lie; tests don't" (correctness rules), and a perf-preference fails the "provably fails when violated" bar; (b) the 2026 landscape is **three-way** (FlatList / FlashList / **LegendList**, WebSearch 2026-06-20) → a shipped "prefer FlashList" default is contestable. Capability is available as a `no-restricted-imports` config one-liner if a consumer opts in. | Project decides perf-preferences are in-scope for shipped defaults **and** FlashList is the unambiguous winner (it is not — LegendList contends on New Architecture) → ship opt-in config, still not a custom rule. |
| — | RN ecosystem skills (`react-native-best-practices`, `building-native-ui`, `vercel-react-native-skills`, `treemap-rn`) | **REFERENCE** | Cite the existing ecosystem skills for RN best-practices rather than re-deriving them in preset prose (per issue + `build-first-reuse-default.md` REFERENCE verdict). | A skill is removed/unavailable in the consumer harness → inline the load-bearing guidance. |

## §2 Open fork for I-phase — preset scope (Expo-only vs bare-RN vs both)

The research surfaced one scope question it does **not** resolve (per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) — a researcher surfaces strategy forks, does not pick them):

**DECISION-NEEDED (I-phase / maintainer): does `packages/preset-react-native/` target Expo-only, bare-RN-only, or both?** This selects the A1 vs A2 baseline.

- **Option Expo-first (researcher lean, on the merits):** baseline = `eslint-config-expo/flat` (A1); document the bare-RN swap to `@react-native/eslint-config` (A2) as a degradation. Rationale: Expo is the dominant modern RN path and the issue title is "Expo / React Native". (The earlier "A1 closes candidate B for free" sub-argument is **removed** — file-verified 2026-06-20: expo *whitelists* web globals, so candidate B needs an explicit `no-restricted-globals` denylist on **either** baseline; see §1 B / §5 open-item-4.)
- **Option both:** ship A1 default + A2 documented alternative — more surface, more maintenance.

The lean is **not** load-bearing — it is a preset-scope/strategy call the maintainer owns. The A3/A4/B/C/D verdicts hold **regardless** of which baseline is chosen.

## §3 SSOT entries added (rows #142–#148)

Rows **#142–#148** append to [prior-art-evaluations.md](../prior-art-evaluations.md) §4, continuing after react-spa's #136–#141 (see §0 dependency note for merge order):

- **#142** `eslint-config-expo` — ADOPT (Expo baseline)
- **#143** `@react-native/eslint-config` + `@callstack/eslint-config` — ADOPT (bare-RN baseline)
- **#144** `eslint-plugin-react-native` (Intellicode) — ADOPT + WATCHLIST (low-maint)
- **#145** `eslint-plugin-react-native-a11y` (Nearform) — ADOPT (RN a11y; supersedes jsx-a11y #138 for RN)
- **#146** `no-web-only-globals` — ADAPT (REUSE core `no-restricted-globals` denylist as **primary**; expo globals do NOT forbid — *whitelist*, file-verified; BUILD-residue YAGNI)
- **#147** `require-stylesheet-create` — ADOPT (`react-native/no-inline-styles`); BUILD-residue YAGNI
- **#148** `prefer-flashlist-over-flatlist` — REJECT the BUILD (REUSE `no-restricted-imports` opt-in if wanted)

## §4 Confidence + coverage

- **A1 (eslint-config-expo)** High — DeepWiki `expo/expo` (bundle + `window:false`) + npm/Expo-docs (SDK 53 flat).
- **A2 (bare-RN configs)** High — npm + WebSearch (`@react-native/eslint-config/flat`, `@callstack/eslint-config`).
- **A3 (eslint-plugin-react-native)** High on rules/maintenance (DeepWiki + `gh` repo metadata: v5.0.0, pushed 2024-12, 84 open issues, maintainer compat-only). Flat-config *works* (peer-dep ^9 + standard plugin shape) but a v5 flat example was not surfaced → **I-phase smoke-verify** (§5).
- **A4 (RN-a11y)** Medium-High — DeepWiki confirms RN-prop targeting + active maintenance; "full flat-config support across all rules" not definitively stated → I-phase verify.
- **B** High that config-REUSE (`no-restricted-globals`) covers the common case (ESLint docs). **Two** DeepWiki over-claims falsified and corrected: (i) the `eslint-plugin-react-native` "env detects web globals" claim (against README:55); (ii) the `eslint-config-expo` "forbids `globals.browser`" claim — file-verified 2026-06-20 (gh `expo/expo:.../flat/default.js:23,38` + ESLint globals docs: `window:false`≡readonly≡*whitelisted*, the config does the **opposite** of forbidding). The Expo baseline does NOT close candidate B; `no-restricted-globals` is required, not optional.
- **C** High — DeepWiki + README evidence for `no-inline-styles`.
- **D** High on negative-existence (DeepWiki at the source repo + WebSearch ×2); the REJECT-BUILD is a **judgment call** (perf-opinion vs correctness) stated as such.

No load-bearing training-data-only claims; every verdict carries a tool-grounded citation. **DeepWiki-verified throughout** (the react-spa sibling's uniform "zero DeepWiki" caveat does NOT apply here).

## §5 Open items for I-phase (do NOT skip)

1. **Smoke-verify `eslint-plugin-react-native` v5 under flat config** — wire `react-native/no-inline-styles` into a real flat `eslint.config.mjs` and confirm it loads + fires (peer-dep ^9 is necessary, not sufficient — no published v5 flat example surfaced).
2. **Verify `eslint-plugin-react-native-a11y` flat-config completeness** — DeepWiki flagged v9 fixes but no blanket flat-config statement; confirm the rules load under flat config before ADOPT lands.
3. **Resolve §2 preset-scope DECISION-NEEDED** (Expo-only / bare-RN / both) before choosing the A1-vs-A2 baseline.
4. **B residue is YAGNI — but `no-restricted-globals` is REQUIRED, not optional.** ✅ **open-item discharged 2026-06-20:** the `eslint-config-expo` `window:false` / `globals.browser` claim was file-verified (gh `expo/expo:packages/eslint-config-expo/flat/default.js:23,38` + ESLint globals docs) and **falsified** — the config *whitelists* web globals (`...globals.browser` spread + `window:false`≡`"readonly"`), it does **not** forbid them and ships no `no-restricted-globals`. **Consequence for I-phase:** the Expo baseline does NOT close candidate B; ship the core `no-restricted-globals` denylist as the **primary** forbid mechanism (not a fallback). Still do **not** BUILD a custom `no-web-only-globals` AST rule without a corpus proving member-access cases matter.
5. **C residue is YAGNI** — ADOPT `no-inline-styles`; do not BUILD a stricter `require-stylesheet-create` rule without demonstrated need.
6. **D ships no custom rule** — if perf-opinion enforcement is wanted, ship a commented, **default-off** `no-restricted-imports` config snippet, not an `eslint-rules/` artefact.
7. **A3 maintenance trip-wire** — record the `Intellicode/eslint-plugin-react-native` WATCHLIST trigger (breaks under future ESLint, no fork) in the SSOT row's revisit column.

## §6 §1.7 self-reflexive note

- **Forward-check:** this R-phase patch complies with `build-first-reuse-default.md §3` (it IS the prior-art-consult mechanism — DeepWiki ≥1 + WebSearch ≥3 phrasings on the B/D negative-existence claims), `no-paid-llm-in-ci.md` (research ran in an interactive session — zero API-billed CI calls), and `doc-authority-hierarchy.md` (scope comment + folder-level authority via research-patches/README). No new rule is introduced — research only.
- **Backward-check:** records the react-native R-phase verdicts; supersedes nothing. It **discharges react-spa §5 open-item-1 in part** (DeepWiki was available and re-probed) and **does not** inherit react-spa's jsx-a11y ADOPT for RN (T16 — different a11y problem-class, A4). **Recursive self-application (T15):** the framework applies its own build-first-reuse discipline to its own multi-stack expansion — it researches before building its own presets, exactly as it requires of consumers, and corrects three of its own issue's BUILD premises to REUSE/ADOPT/REJECT rather than rubber-stamping them (T2/T7 — reasoning against the prompt, not pattern-matching it).

## See also

- [docs/superpowers/specs/2026-06-19-multi-stack-hybrid-design.md](../../superpowers/specs/2026-06-19-multi-stack-hybrid-design.md) §5 — the discipline this patch executes (lands via #648).
- [2026-06-20-react-spa-rules-rphase.md](2026-06-20-react-spa-rules-rphase.md) — sibling R-phase (SSOT #136–#141); shared format + the jsx-a11y row (#138) this patch overrides for RN.
- [prior-art-evaluations.md](../prior-art-evaluations.md) §4 — SSOT rows #142–#148 land here (after #648's #136–#141).
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — the seven-verdict discipline (ADOPT / REJECT / KEEP-NARROW used here).
- [.claude/rules/ai-laziness-traps.md §2 T16](../../../.claude/rules/ai-laziness-traps.md) — pattern-matching-on-name; the A4 (RN-a11y ≠ jsx-a11y) and B (env-whitelists ≠ forbids) catches are T16 in operation.
