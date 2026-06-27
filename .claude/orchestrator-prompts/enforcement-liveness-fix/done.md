# enforcement-liveness-fix — DONE

- Final PR: #745 (initial Variant A) + the #752 follow-up (this change — ship pre-compiled; consumer needs no `tsc`)
- Closed: 2026-06-27
- Summary: Variant A done correctly. ESLint rules are **pre-compiled** to `.mjs` + `.d.ts` at framework build (`scripts/build-shipped-eslint-rules.sh`, committed next to the `.ts` sources); `setup.d/40-configs.sh` **copies** them and generates the `index.mjs` barrel. The shipped `eslint.config.mjs` imports `./eslint-rules-local/index.mjs` (unambiguous ESM by extension) — so the rule loads on every Node, through every channel, **with no TS loader and no `tsc` at the consumer**. A drift gate (`build-shipped-eslint-rules.sh --check`, wired into CI) keeps the committed `.mjs`/`.d.ts` in sync with the `.ts` authoring source.

## Why this supersedes #745's closure (#752)

#745 implemented Variant A as **compile-at-install** via `tsc`. But the consumer lacks `tsc`: `40-configs.sh` searched only framework/container paths (never the consumer's own `node_modules`), and `typescript` is not in the consumer dev-deps. So a real consumer install generated `index.mjs` importing sibling `.mjs` that were never produced → `ERR_MODULE_NOT_FOUND` → enforcement silently off, while CI stayed green (our repo has `tsc`). That is the **"green lies"** failure this umbrella exists to prevent — tracked as #752. Shipping pre-compiled removes the consumer-side `tsc` dependency entirely.

## Evidence: raw-channel load on Node 20 AND 22 (the honest gate)

The proof is `f17` **Arm (iii)** — a RAW `node` import of the shipped barrel (NO tsx, NO `NODE_OPTIONS`), the exact path that crashed with the old `.ts` barrel (`ERR_UNKNOWN_FILE_EXTENSION ".ts"`) on a Node without native type-stripping (Node 20.x = the consumer's `.nvmrc` 20.19.0; Node 22.0–22.17). Run under the `audit-self.yml` `f17-node-compat` matrix (Node 20 + 22). This is distinct from Arm (ii)'s tsx Linter-API path, which always worked and therefore never proved the fix (S1 finding #744).

Local cross-checks (Node 24, deps-minimal harness): `format:check` clean, drift gate `12 artifacts in sync`, `byte-identical.test.sh` `8 pass / 0 fail` (baselines regenerated — shipped `.mjs` are now deterministic by copy, not env-dependent compile), principle suite `237 passed`, `actionlint` clean.

## Invariant guard (§8)

- Principle suite (incl. 09, 12, 21, 22, 25): 237 passed.
- Principle 17 (no-paid-LLM in CI): the drift gate + `f17-node-compat` use only bash + npm + tsc (no API calls). ✓
- Principle 21 (agnosticism): shipped barrel + rules are pre-compiled JavaScript ESM — no TS loader required, all-Node. ✓

## Parked decision (dev-deps strategy) — now MOOT for the core fix

Per kickoff §4c the dev-deps strategy (auto-install vs opt-in) was operator-gated. With pre-compiled shipping, the rule barrel **no longer needs `tsc` (or any dev-dep) to load** — so the HARD-BLOCKER enforcement holds regardless of the dev-deps choice. The dev-deps fork remains relevant only to the *other* shipped tools (eslint/prettier/etc.), not to whether the custom rules fire.

## Remaining (not blocking closure)

- **S3 layout-honesty** (non-`src/` raw-channel WARN/SKIP vs PASS-on-zero, probeR4/R17) was not implemented by either dispatch; tracked for a separate pass. The HARD-BLOCKER (rule actually loads + fires on the consumer's Node) is resolved by this change.
