<!-- scope:enforcement-liveness-fix-S1-cause -->
# enforcement-liveness-fix S1 — reproduce + isolate the exact cause

**Date:** 2026-06-26 · **Author:** enforcement-liveness-fix S1 (aif handoff, research-only) · **Umbrella:** [`.claude/orchestrator-prompts/enforcement-liveness-fix/kickoff.md`](../../../.claude/orchestrator-prompts/enforcement-liveness-fix/kickoff.md) (U2, S1 stage)

> **Type:** research/diagnosis. **Fixed nothing.** No edits to `setup.d/`, `packages/core/`, templates, or CI.
> **Headline:** The umbrella's `.ts`-loader failure mechanism (§2.1 / §4.2 case **(a)** «Unknown file extension ".ts"») is **real and reproduced** — but it is **gated on Node's minor version**, and on the *current* Node 22 LTS (**22.22.3**, ≥22.18 with native type-stripping on by default) the shipped raw `npx eslint` path **loads the barrel and blocks the violation**. The bug reproduces on Node **without** default type-stripping (Node 20.x; Node 22.0–22.17). This **inverts** the umbrella's «red on Node 22 / HARD-BLOCKER on current Node» premise and is surfaced below as a **park trigger** (§ Implication).

---

## Reproduction

**Environment.** `node -v` → **`v22.22.3`** (the task's required Node 22). ESLint **9.39.4**; `typescript-eslint` **8.59.0**; `@typescript-eslint/utils` **8.59.0**; `eslint-config-prettier` + `@vitest/eslint-plugin` present.

**Consumer setup.** A clean consumer was provisioned with the framework's own installer (the core that `./setup ts-server` wraps):

```bash
mkdir /tmp/s1 && cd /tmp/s1
printf '{"name":"s1c","version":"0.0.0","private":true,"type":"module"}\n' > package.json
bash <repo>/install.sh ts-server          # copies eslint.config.mjs + generates eslint-rules-local/ barrel
```

The shipped `eslint.config.mjs:12` imports the barrel **as TypeScript**:

```js
import customRules from './eslint-rules-local/index.ts';
```

and the generated `eslint-rules-local/index.ts` re-exports siblings with **explicit `.ts` extensions** (`import { noUnsafeZodParse } from './no-unsafe-zod-parse.ts';` …), each of which `import { ESLintUtils } from '@typescript-eslint/utils'`.

**Env caveat (honest, T3).** The container's `npm` could not complete the multi-package `--save-dev` dev-deps install (it resolved from the registry — 30 s — then reified **nothing**, reporting `up to date` with an empty `node_modules`; single-package installs worked). This is an **environment** defect, **not** the framework bug under study. To obtain a *faithful* eslint toolchain at the exact shipped versions, `node_modules` was assembled by symlink from the repo's already-installed tree at `/app/node_modules` (eslint/tsx/typescript-eslint/@typescript-eslint/utils/@eslint/js/globals) plus a clean single-target install of the two packages `/app` lacked (`eslint-config-prettier`, `@vitest/eslint-plugin`). All seven top-level config imports resolve; versions match the shipped `package.json` ranges. The ESLint behaviour observed is therefore the real consumer behaviour.

**Commands run (each = command + verbatim output below):**

```bash
# (A) Does Node 22 load the shipped .ts barrel natively — the exact thing eslint.config.mjs line 12 does?
node --input-type=module -e "const m = await import('./eslint-rules-local/index.ts'); console.log('LOADED', Object.keys(m.default.rules));"

# (RUN 2) EXACT consumer command, shipped config, tsconfig present, NO tsx loader
node_modules/.bin/eslint src/violation.ts            # src/violation.ts = `const x = y as any;`

# (RUN 3) SAME command, type-stripping DISABLED (simulates Node 20.x / Node 22.0–22.17)
NODE_OPTIONS="--no-experimental-strip-types" node_modules/.bin/eslint src/violation.ts

# (RUN 4) recover under strip-types-off, with the framework's lint-script loader
NODE_OPTIONS="--no-experimental-strip-types --import tsx" node_modules/.bin/eslint src/violation.ts

# (f17) the umbrella's named test, on this Node (uses tsx + ESLint Linter API)
bash tests/install-sh/f17-lint-rules-planted-violation.test.sh
```

---

## Observed output (verbatim)

**(A) native `.ts` barrel import on Node 22.22.3 — no loader:**

```text
BARREL LOADED. rules: [
  'no-direct-time-randomness', 'no-unsafe-zod-parse',
  'require-otel-span', 'restricted-syntax-audit-exempt'
]
[exit 0]
```

**(RUN 2) exact consumer command, shipped config, NO tsx, Node 22.22.3:**

```text
/tmp/repro/src/violation.ts
  1:7   error  Unsafe assignment of an `any` value       @typescript-eslint/no-unsafe-assignment
  1:7   error  'x' is assigned a value but never used    @typescript-eslint/no-unused-vars
  1:16  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
✖ 3 problems (3 errors, 0 warnings)
[exit 1]
```

→ **The barrel loaded and the planted violation was BLOCKED.** Enforcement is **live** on Node 22.22.3 via the raw path. (Before a `tsconfig.json` was added the only error was `Parsing error: … was not found by the project service` — a type-aware-config detail, *not* a barrel-load failure; the barrel had already loaded.)

**(RUN 3) same command, `--no-experimental-strip-types` (Node 20.x / Node 22.0–22.17 behaviour):**

```text
Oops! Something went wrong! :(
ESLint: 9.39.4
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for /tmp/repro/eslint-rules-local/index.ts
    at Object.getFileProtocolModuleFormat [as file:] (node:internal/modules/esm/get_format:219:9)
    ...
[exit 2]
```

→ **This is the umbrella's case (a) verbatim**: the `.ts` barrel cannot be loaded without a TS loader; eslint crashes at config-load time.

**(RUN 4) `--no-experimental-strip-types --import tsx`:**

```text
/tmp/repro/src/violation.ts
  1:7   error  Unsafe assignment of an `any` value       @typescript-eslint/no-unsafe-assignment
  ...
✖ 3 problems (3 errors, 0 warnings)
[exit 1]
```

→ tsx restores the loader; violation blocked again. Confirms tsx is the load mechanism the framework relies on off the native path.

**(f17 test) on Node 22.22.3:**

```text
✓ Check3 Arm(i): … no-unsafe-zod-parse.ts present     ✓ Check3 Arm(i): … index.ts present
· using tsx: /app/node_modules/.bin/tsx
✓ Check3 Arm(ii): planted .parse() violation FLAGGED by shipped rule (live signal)
✓ Check3 Arm(ii) neg: audit:exempt → rule skips line
PASS=4 FAIL=0  [exit 0]
```

→ **f17 is GREEN on Node 22.22.3** (it loads the barrel through tsx and never touches the raw eslint CLI — see its own header comment, lines 32–36).

---

## Exact cause

The failure class is the umbrella's **case (a)**: `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for …/eslint-rules-local/index.ts`. The shipped `eslint.config.mjs` is loaded by Node's **native ESM loader**; its static `import … './eslint-rules-local/index.ts'` therefore needs Node to be able to load a `.ts` file. **Whether it can is decided by one variable: native TypeScript type-stripping.**

- Node **type-stripping** is gated `--experimental-strip-types` since v22.6.0 and is **on by default (unflagged) since v22.18.0** (and v23.6.0). Empirically anchored here: bare `node import('./x.ts')` succeeds on **22.22.3** (probe A, RUN 2); `--no-experimental-strip-types` reproduces the exact `ERR_UNKNOWN_FILE_EXTENSION` crash (RUN 3).
- So the **raw** eslint path (`eslint <file>` with no `--import tsx`):
  - **Node ≤ 22.17 / Node 20.x** → barrel **fails to load** → `Unknown file extension ".ts"` (case a).
  - **Node ≥ 22.18 (incl. 22.22.3)** → barrel **loads natively** → rule fires → violation blocked.
- The **tsx-wrapped** path always loads the barrel (the loader is explicit), on every Node.

**Channel matrix (which enforcement channel carries a loader):**

| Channel | Actual command | TS loader? | Node 20.19 (consumer `.nvmrc`) | Node 22.18+ |
|---|---|---|---|---|
| `npm run lint` / CI (`ci.yml` → `npm run lint`) | `NODE_OPTIONS="--import tsx" eslint .` | tsx | ✅ loads | ✅ loads |
| **pre-commit → lint-staged** (`.lintstagedrc.json`) | `eslint --fix --max-warnings=0` (**raw**) | **none** | ❌ `Unknown file extension ".ts"` | ✅ loads (strip-types) |
| manual `npx eslint <file>` | `eslint <file>` (**raw**) | **none** | ❌ `Unknown file extension ".ts"` | ✅ loads (strip-types) |

The earliest gate the project goal most cares about — **pre-commit / lint-staged** — uses the **raw** path (no `NODE_OPTIONS`). `npm run lint` and CI use the **tsx** path. The consumer `.nvmrc` pins **20.19.0**.

**One-sentence root cause:** the shipped consumer config imports the rule barrel as `./eslint-rules-local/index.ts`, so barrel load depends on a TS loader being present at eslint-run time; the raw eslint channels (pre-commit/lint-staged and manual `npx eslint`) carry **no** loader and therefore fail with `ERR_UNKNOWN_FILE_EXTENSION ".ts"` on any Node **without default type-stripping** (Node 20.x, Node 22.0–22.17) — while passing on Node ≥ 22.18 where type-stripping is on by default.

---

## Implication for the fix

**Variant A (umbrella §2.2 — compile rules TS→JS+`.d.ts` at install; template imports `index.js`) cleanly addresses the observed failure mechanism.** Removing the `.ts` import entirely removes the loader dependency, so the raw pre-commit/lint-staged channel loads the barrel on **all** Node versions (20.x, 22.0–22.17, 22.18+) — exactly the `ERR_UNKNOWN_FILE_EXTENSION` crash from RUN 3 disappears. On the fix-adequacy axis this is **not** a park trigger: the cause **is** the `.ts`-loader class the umbrella assumes, and variant A is a correct, version-independent fix. The §7 S2-gate (`node --input-type=module -e "await import('./eslint-rules-local/index.js')"` + raw `npx eslint` fails by rule) is the right shape — it exercises the real consumer path.

**PARK TRIGGER — the umbrella's environment/severity premise is empirically inverted (do not silently redefine §2.1; surface to maintainer/orchestrator).** Two findings contradict the kickoff's framing and change the conclusion about *what is currently broken*:

1. On the task's specified env (**current Node 22 = 22.22.3**) every channel I could observe is **GREEN**: CI/`npm run lint` (tsx), the f17 test (tsx, PASS 4/4), **and even the raw `npx eslint`** (native strip-types, RUN 2 blocks the violation). The kickoff's «`f17` краснеет на Node 22, зелёный на Node 20» and «цель проекта буквально ложна … на актуальной Node (включая 22)» did **not** reproduce here.
2. The raw-path `.ts`-loader crash (RUN 3) reproduces on Node **without** default strip-types — i.e. Node **20.x** (the consumer's own `.nvmrc`!) and Node 22.0–22.17 — which is the **opposite** Node-version polarity to the umbrella's premise. (Node 20 could not be installed in this container; RUN 3 faithfully simulates the no-strip-types environment via `--no-experimental-strip-types`.)

**Fork for the maintainer/orchestrator (reviewer-discipline §2 — both options, no pick):**

- **Option A — proceed to S2 as planned.** Variant A is the right fix and removes the version-dependency for good. *Consequence:* S5's gate as written («`f17` green on Node 20 AND 22») is mis-targeted — f17 is *already* green on both (it uses tsx, never the raw path). The test that actually distinguishes the bug is the **raw** eslint channel (pre-commit/lint-staged / `npx eslint`) on a **no-strip-types** Node. S5 should assert *that* path, ideally with a real Node-20 (or `--no-experimental-strip-types`) leg, or it will pass while the real exposure is untested.
- **Option B — re-examine the HARD-BLOCKER severity/premise before S2.** On a current Node 22 consumer the rule already loads and blocks via strip-types, so «goal literally false on current Node 22» overstates the live exposure; the true exposure is narrower — the **raw pre-commit channel on Node ≤ 22.17 / Node 20**. *Consequence:* the umbrella may want to (a) re-scope the blocker to «raw-channel barrel load on Node without default type-stripping», and (b) decide whether the deeper issue is that the *earliest* gate (lint-staged) runs eslint **without** the loader the `lint` script supplies — a fix that variant A also resolves, but whose framing affects S3/S4/S5 gate design.

Either way, the **fix direction (variant A) stands**; what needs a maintainer call is the **blocker framing + the S5 gate's target channel**, because the observed Node-version polarity and the already-green current-Node-22 channels contradict the umbrella's stated premise. Per the S1 brief, this is parked rather than decided.

---

## §1.7 self-review (research-only form)

**Forward-check applied.** This finding complies with the disciplines in scope:

- `no-paid-llm-in-ci.md` — reproduction used only local commands (`node`, `eslint`, `bash`); zero API-billed calls.
- `ai-laziness-traps.md` — T3 (every claim carries command + verbatim output: probe A / RUN 2 / RUN 3 / RUN 4 / f17), T5 (research only, no source edits), T16 (loader presence verified by running the raw path, not assumed by name).
- `reviewer-discipline.md §2` — the premise/severity contradiction is surfaced as a parked fork with both options, not decided here.

**Backward-check applied.** Sweep of existing artefacts under this finding's scope:

- `enforcement-liveness-fix/kickoff.md §2.1/§8` — this finding contradicts its Node-version polarity premise; flagged as a park trigger, **NOT** rewritten (Artifact Ownership: the kickoff's fixed-decisions block is maintainer-owned).
- `#636 / #642 / #644` — same `.ts`-loader failure class; this finding isolates the precise version-gating mechanism (native type-stripping) behind them.
- **T15 self-application** — the fix this finding points to (variant A) must itself pass on this repo's own shipped templates; noted as input to S5's gate design.

---

## Tags

`#enforcement-liveness` `#ts-loader` `#node-type-stripping` `#raw-vs-tsx-channel` `#park-premise-inversion`
