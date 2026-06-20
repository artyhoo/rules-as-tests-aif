<!-- scope:multi-stack-react-native-rphase -->
# React-Native preset — rule prior-art R-phase (epic #646 Stage 1)

> **Date:** 2026-06-20
> **Slug:** react-native-rules-rphase
> **Type:** R-phase (prior-art research for capability commits; **no source mutation** — records verdicts + SSOT drafts, builds nothing).
> **Umbrella:** multi-stack support (epic [#646](https://github.com/Yhooi2/rules-as-tests-aif/issues/646)) Stage 1; design [docs/superpowers/specs/2026-06-19-multi-stack-hybrid-design.md](../../superpowers/specs/2026-06-19-multi-stack-hybrid-design.md) §3/§5. Sibling of [2026-06-20-react-spa-rules-rphase.md](2026-06-20-react-spa-rules-rphase.md).

---

## §0 Method + environment caveat (read first)

Per spec §5, each react-native rule is a capability commit requiring a prior-art consult (`build-first-reuse-default.md` §3 + the 6-item search-coverage checklist). This patch records the verdicts that gate I-phase.

**DeepWiki MCP was UP in this environment** — unlike the react-spa sibling (which recorded DeepWiki-down + WebSearch substitution per SSOT #121/#123). Every verdict below is **DeepWiki-verified on the candidate's own repo AND WebSearch-grounded (≥3 phrasings)** — a higher evidence bar than the sibling patch. The single source-divergence (candidate RN-7, below) was resolved per `phase-research-coverage.md` §1.10 (source/type-system over prose).

**Primary fork resolved (§2): preset scope = Expo-managed-first, NOT bare, NOT both.** The design doc §3 wrote `preset-react-native/ — Expo / React Native` (ambiguous slash); this R-phase resolves the slash. Consequence: the **base config** the preset extends is `eslint-config-expo` (#142), not `@react-native/eslint-config` (#145).

**Own-stack finding (load-bearing):** four react-spa SSOT rows transfer cross-preset unchanged and are **reused, not re-added** (same `Last reviewed` date 2026-06-20 → no row mutation needed): #136 `eslint-plugin-react`, #137 `eslint-plugin-react-hooks` v6, #139 `eslint-plugin-boundaries`+dependency-cruiser, #140 `require-error-boundary` (presence-BUILD family). They are bundled by / compatible with `eslint-config-expo` and are render-target-agnostic. **The one that does NOT transfer is #138 `eslint-plugin-jsx-a11y`** — see RN-4 (the live T16 case of this patch).

## §1 Per-candidate verdicts

| # | Candidate | Verdict | Core rationale (T16 problem-class) | Falsifier |
|---|---|---|---|---|
| RN-1 | `eslint-config-expo` (base config) → **SSOT #142** | **ADOPT** | Official Expo base; flat-config (SDK 53+); bundles `eslint-plugin-react` + `-react-hooks` + `-import` + `@typescript-eslint` recommended **+** `eslint-plugin-expo` rules (`use-dom-exports`, `no-dynamic-env-var`, `prefer-box-shadow`) + React Compiler rules (SDK 55+) + web globals & platform `.ios/.web` extensions. Expo = RN's recommended default (RN-core deprecated `init`). TS-first/flat → matches this framework's next-15 stack. T16: upstream class = Expo-app base lint; ours = same → match. | Scope fork flips to bare (→ #145 base); OR Expo drops flat-config export past an SDK major. |
| RN-2 | `eslint-plugin-react` (**REUSE SSOT #136**) | **ADOPT (reuse)** | JSX static-AST correctness; **bundled inside `eslint-config-expo`** → transitively adopted, no separate dep. Cross-preset reuse of the react-spa row; no new SSOT row. | same as #136. |
| RN-3 | `eslint-plugin-react-hooks` v6 (**REUSE SSOT #137**) | **ADOPT (reuse)** | Rules-of-Hooks + Compiler rules; **bundled in `eslint-config-expo` SDK 55+**. Runs in RN (Compiler is renderer-agnostic). No new row. | same as #137. |
| RN-4 | `eslint-plugin-jsx-a11y` (SSOT #138) — **DOES NOT TRANSFER** | **REJECT for RN** → replace w/ RN-5 | **The live T16 case (`#pattern-matching-on-name`).** #138 targets **DOM ARIA** (`role`, `aria-*`, semantic HTML); React Native has no DOM — a11y is `accessibilityRole` / `accessibilityLabel` / `accessibilityState`. WebSearch ×3 explicit: «jsx-a11y is for React (not RN)». Blindly inheriting the react-spa ADOPT would ship dead rules. | Preset targets an Expo-**web-only** surface where DOM ARIA applies (contra native-first scope — unlikely). |
| RN-5 | `eslint-plugin-react-native-a11y` (`FormidableLabs`) → **SSOT #143** | **ADOPT** | The T16-correct a11y replacement for #138. DeepWiki (repo-read): **actively maintained, ESLint-v9 flat config ✓**, RN-native rules (`has-valid-accessibility-role/-state/-actions`, `has-accessibility-hint`, `no-nested-touchables`…), 4 presets (basic/ios/android/all), **Expo + bare**. Built on jsx-a11y internals but RN-tailored. | Abandons flat-config; OR RN accessibility API revision re-baselines rules. |
| RN-6 | `eslint-plugin-boundaries` + `dependency-cruiser` (**REUSE SSOT #139**) | **ADOPT (reuse)** | Import-boundary enforcement is render-target-agnostic → transfers to RN unchanged (presentation ↛ domain). Framework already ships dependency-cruiser. No new row. | same as #139. |
| RN-7 | `eslint-plugin-react-native` (`Intellicode`) → **SSOT #144** | **ADOPT-CONDITIONAL** (via `@eslint/compat`; frozen-maintenance → WATCHLIST-grade risk) | Closes the RN-specific gap `eslint-config-expo` does **NOT** cover (DeepWiki confirmed: no StyleSheet/raw-text rules in expo config): `no-raw-text`, `no-unused-styles`, `no-inline-styles`, `no-color-literals`, `split-platform-components`. **Source divergence resolved (§1.10):** DeepWiki «peerDep `eslint:^9`» vs WebSearch «no native flat-config (issue #333), author declares NOT maintained». Truth = both: ESLint-9-compatible **only via `@eslint/compat` `fixupPluginRules`**, and frozen-maintenance. Hence ADOPT-but-watch, not clean ADOPT. | Plugin breaks on a future ESLint → migrate to narrow flat-native alts (`eslint-plugin-react-native-unused-styles`, ~monthly releases) or BUILD the 1-2 load-bearing rules; OR Expo absorbs StyleSheet linting upstream. |
| RN-8 | `require-error-boundary` (**REUSE SSOT #140**, presence-BUILD family) | **ADOPT (reuse)** | RN has ErrorBoundary (`componentDidCatch`); react-spa's own-built **presence** rule transfers to the RN app-root/route surface. Same own-built family; no new row (the #140 BUILD design is shared, retargeted in I-phase). | same as #140; OR Expo Router ships a guaranteed-boundary convention → redundant. |
| RN-9 | `no-web-only-globals` (custom BUILD candidate) → **SSOT #147** | **DEFER (do NOT build)** | The web-globals question, resolved on evidence: Expo is **universal** (native + web via `react-native-web`); DeepWiki: in Expo-web `window`/`document` **are valid**, and `eslint-config-expo` **defines** web globals + `.web.tsx` extensions. So a blanket "ban web globals in RN" rule is **wrong** for an Expo-first preset (false-positives on legitimate `.web.tsx`). A platform-scoped variant (ban only in `.native/.ios/.android.tsx`) is coherent but YAGNI until a corpus shows leakage. | Preset later drops the Expo-web target (native-only) → platform-scoped ban becomes coherent; OR a corpus shows web-only globals leaking into native bundles. |

## §2 Scope fork — RESOLVED (orchestrator, 2026-06-20)

Design doc §3 wrote `packages/preset-react-native/ — Expo / React Native`. The slash is the fork: **Expo-only-managed-first / bare-RN / both?**

**Resolution: Expo-managed-first. Bare = DEFER. NOT both.** This is a clear call on the project's merits, not a genuine taste fork (per `recommendation-laziness-discipline.md` §3 — a determinate best exists, so it is decided + reported, not routed to a question):

- **Expo is the ecosystem default.** RN-core itself deprecated `react-native init`; create-flow routes through a framework; Expo is the recommended one (WebSearch ×3 + DeepWiki `expo/expo` + `facebook/react-native`). Building bare-first optimises for the receding path.
- **"Both" is two paradigms, not one config with a flag.** `eslint-config-expo` = TS-first, flat-config, `@typescript-eslint`, web-aware globals. `@react-native/eslint-config` (#145) = **Flow** (`ft-flow`), `hermes-eslint` parser, jest, legacy-leaning. Shipping both = two parser/type worlds = `#parallel-evolution-creep` ([build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) §4) + against `dual-implementation-discipline.md` cross-preset consistency.
- **No consumers yet** ([EXECUTION-PLAN no-consumers caveat]) → deferral discipline: do not build the bare variant speculatively. Trigger mirrors the multi-stack-monorepo pattern ([open-questions.md §13.5]).
- **Expo base is idiomatically closer** to this framework (TS strict, flat ESLint, next-15 mirror) than the Flow/hermes bare-core.

`@react-native/eslint-config` → **DEFER (SSOT #145)** — not the base for this Expo-first preset (Flow/hermes paradigm), held open for a future bare variant; revisit-trigger: first real **bare-RN (non-Expo) consumer** surfaces. (DEFER not REJECT: the config is fully applicable to bare RN — our domain — just unused absent a bare consumer; the option stays open per SSOT §2 semantics.) The naming `preset-react-native` slightly over-claims the Expo-first scope — flagged as an observation; design §3 already fixed the directory name (not re-litigated here).

## §3 SSOT entries added

Rows **#142–#148** appended to [prior-art-evaluations.md](../prior-art-evaluations.md) §4 (was max #141):

- **#142** `eslint-config-expo` — **ADOPT** (Expo-first base config).
- **#143** `eslint-plugin-react-native-a11y` (FormidableLabs) — **ADOPT** (RN a11y; T16-correct replacement for #138, which does NOT transfer to RN).
- **#144** `eslint-plugin-react-native` (Intellicode) — **ADOPT-CONDITIONAL** (RN StyleSheet/text rules; condition = `@eslint/compat` wrapper + frozen-maintenance watch).
- **#145** `@react-native/eslint-config` (bare RN core) — **DEFER** (Flow/hermes; not the base for the Expo-first preset; held for a future bare variant, trigger = first bare consumer).
- **#146** `eslint-plugin-rn-a11y` (grgr-dkrk) — **WATCHLIST** (ported/extended alternative to #143; the rejected a11y alternative, mirrors #141's role).
- **#147** `no-web-only-globals` (custom) — **DEFER** (Expo-universal makes web globals valid; platform-scoped variant YAGNI).
- **#148** `expo-router` (Expo Router) — **ADOPT** (ARCHITECTURE template routing default; file-based, default in `create-expo-app` SDK 56; built on React Navigation).

Cross-preset **reuses (no new row):** #136 / #137 / #139 / #140 — transfer unchanged (same `Last reviewed` 2026-06-20).

## §4 Confidence + coverage

| Candidate | Confidence | Basis |
|---|---|---|
| #142 eslint-config-expo | **High** | DeepWiki `expo/expo` ×2 + WebSearch + Expo docs converge. |
| #143 react-native-a11y | **High** | DeepWiki repo-read (maintenance + flat + rule list direct). |
| #144 eslint-plugin-react-native | **High (facts), nuanced (verdict)** | DeepWiki repo-read + WebSearch issue #333 converge: rules present, maintenance frozen, flat-via-compat. §1.10 divergence resolved. |
| #145 @react-native/eslint-config | **High** | DeepWiki `facebook/react-native` repo-read (Flow/hermes composition). |
| #146 rn-a11y | **Medium** | WebSearch only (not DeepWiki-verified) — WATCHLIST tolerates lower bar. |
| #147 no-web-only-globals | **High (the nuance)** | DeepWiki: Expo-web globals valid + config defines them. |
| #148 expo-router | **High** | DeepWiki + WebSearch + Expo docs (default template SDK 56). |

**No new BUILD verdict in this R-phase** → no load-bearing negative-existence claim to defend (the only candidate gap, RN-7 StyleSheet/text, is closed by an existing plugin, not a build). DeepWiki-UP throughout → **none of these verdicts are provisional** (contrast the react-spa sibling's uniform DeepWiki-down caveat). The 6-item search-coverage checklist for the **scope fork** (the one decision with negative-shaped reasoning — "no single config serves both Expo+bare") was run in-session: own-stack ✓, category ✓ (official-config / RN-community-lint / RN-a11y / routing), semantic-distance ✓ (jsx-a11y→RN-a11y), adversarial ✓ (sought a unified Expo+bare config → only legacy `eslint-config-universe/native`, not bare-core), floor>3 ✓, trigger-sweep ✓ (§13.5 deferred; design §3 closed RN-scope).

## §5 Open items for I-phase (do NOT skip)

1. **RN-7 (#144) compat wiring + liveness.** Wire `eslint-plugin-react-native` via `@eslint/compat` `fixupPluginRules`; add a rule-liveness check that the rules actually fire (mirror #115 manual-rule-liveness precedent — a frozen plugin behind a compat shim is exactly where silent no-op risk lives). Document the fallback (narrow flat-native alts / BUILD) inline.
2. **RN-5 (#143) preset selection.** Pick `basic` (cross-platform) as the shipped default; `ios`/`android` rule groups opt-in. Do not ship `all` by default (noise).
3. **RN-9 (#147) — do NOT build.** If a native-only variant is ever justified, platform-scope it to `.native/.ios/.android.tsx`; never a blanket ban (breaks `.web.tsx`).
4. **Own-built RN rules.** #140 `require-error-boundary` transfers (retarget app-root/route). Survey whether RN needs an analog of next-15's R12/R14/R20 — initial read: the StyleSheet/text gap is covered by #144 (ADOPT, not BUILD), so v1 may ship **zero** new own-built rules beyond the #140 transfer. Confirm in I-phase before assuming a BUILD.
5. **bare-RN DEFER (#145).** Hold until first non-Expo consumer; do not scaffold the `@react-native/eslint-config` base speculatively.
6. **ARCHITECTURE template (#148).** `templates/ARCHITECTURE.react-native.md` = Expo Router (file-based `app/` dir), peer dep `expo` + `eslint-config-expo`.

## §6 §1.7 self-reflexive note

- **Forward-check:** this R-phase patch complies with `build-first-reuse-default.md` §3 (it IS the prior-art-consult mechanism — DeepWiki-UP + WebSearch ≥3 phrasings, a stronger run than the #121/#123-precedent substitution the sibling needed), `no-paid-llm-in-ci.md` (research ran in an interactive session — zero API-billed CI calls), and `doc-authority-hierarchy.md` (scope comment + folder-level authority via research-patches/README — no per-file header needed). The verdict spread is ADOPT-default with a single DEFER and zero new BUILD → maximally build-first ([build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) §1 default = ADOPT/REFERENCE).
- **Backward-check:** records the react-native R-phase verdicts; supersedes nothing. Reuses react-spa rows #136/#137/#139/#140 cross-preset (no mutation — same date). **Recursive self-application (T15):** the framework applies its own build-first-reuse discipline to its own second preset. **T16 explicitly exercised (not just cited):** the jsx-a11y (#138) → react-native-a11y (#143) replacement is the live `#pattern-matching-on-name` catch — the sibling patch's ADOPT was NOT blindly inherited; the problem-class mismatch (DOM ARIA vs RN accessibility API) was surfaced and corrected. The DeepWiki-UP advantage over the sibling is stated honestly rather than left implicit (T6 inverse — claiming the stronger bar only where earned).

## See also

- [docs/superpowers/specs/2026-06-19-multi-stack-hybrid-design.md](../../superpowers/specs/2026-06-19-multi-stack-hybrid-design.md) §3/§5 — the discipline this patch executes; the `Expo / React Native` slash this patch resolves.
- [2026-06-20-react-spa-rules-rphase.md](2026-06-20-react-spa-rules-rphase.md) — sibling R-phase; rows #136–#141; the ADOPT precedents (#136/#137/#139/#140) reused here and the #138 that does NOT transfer.
- [prior-art-evaluations.md](../prior-art-evaluations.md) §4 — SSOT rows #142–#148 land here.
- `packages/preset-next-15-canonical/templates/eslint.config.react.mjs` — the flat-config mirror target; `eslint-rules/require-use-server-directive.ts` — custom-AST-rule pattern for the #140 presence-BUILD transfer.
