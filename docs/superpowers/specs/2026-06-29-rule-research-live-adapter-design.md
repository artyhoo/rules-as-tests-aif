# Rule-research LIVE adapter — design (Q1 = A, agent-driven)

> **Authoritative for:** the design of the LIVE, agent-driven rule-research adapter that replaces `stubRuleResearch` (research half) **and** `stubGenerateNextImage` (generate half) on the `./setup --full` path — i.e. how a consumer's interactive, MCP-enabled agent session researches a stack's real practices into a schema-valid `ResearchPlan` + an L4-valid `GenerateSelection`, both consumed by the EXISTING deterministic factory/lock tail (untouched). Scope-bound to the react-next demo/validation surface of this slice.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The deterministic tail (`generate.ts`/L4/`install.ts`/`buildLock`) — see [`packages/core/synthesizer/`](../../../packages/core/synthesizer/) + [`packages/core/validator/`](../../../packages/core/validator/). The R-phase design basis — see [research-patches/2026-06-28-rule-bootstrapping.md](../../../docs/meta-factory/research-patches/2026-06-28-rule-bootstrapping.md) (#798). The decision ledger (`.ai-factory/rules-decisions.md`, #798 §5) — DEFERRED to the next slice (§Decisions C). Implementation steps — see the `writing-plans` output that follows this spec.

**Date:** 2026-06-29 · **Status:** design (pre-implementation; Phase-0 prototype gate PASSED) · **Branch:** `feat/rule-research-live-adapter` (off `staging` @ #794); PR → `staging`

---

## 1. Goal (one line)

`./setup --full` on a react-next consumer runs LIVE context7/deepwiki research in the human's interactive agent session → a real (not stubbed) `ResearchPlan` (allowlist-valid provenance) **and** a real `GenerateSelection` (the rule body) → the existing deterministic factory → a real `rules-lock.json` carrying a genuinely-researched, **executable** ESLint rule + its firing guard test. `$0`-in-CI preserved.

This is "tool-bootstrapping, but for RULES" (#798 §0): the provisioned MCP channels already power *tool* selection; this slice wires *research-of-coding-practices → an executable rule+test*.

## 2. What already exists — REUSED UNCHANGED (re-confirmed on `origin/staging`)

- **Seam (research half):** [`synthesizer/rule-research-port.ts`](../../../packages/core/synthesizer/rule-research-port.ts) — `RuleResearchClient.research(detection) → ResearchPlan`; `stubRuleResearch` returns `_NEXT_IMAGE_PLAN`. **Replaced by a live file-reading client.**
- **Seam (generate half):** [`synthesizer/generate-port.ts:45-51`](../../../packages/core/synthesizer/generate-port.ts) — `GenerateClient.generate(menu) → GenerateSelection`; `stubGenerateNextImage` ([`rule-bootstrap.ts`](../../../packages/core/synthesizer/rule-bootstrap.ts)) hardcodes `no-raw-img`. **Replaced by a live file-reading client.**
- **The tail — DO NOT TOUCH:** `runRuleBootstrap` ([`rule-bootstrap.ts`](../../../packages/core/synthesizer/rule-bootstrap.ts)) already takes BOTH `researchClient` + `generateClient` as injectable opts; `synthesizeGenerate` ([`generate.ts:20`](../../../packages/core/synthesizer/generate.ts)) → L4 `validate` → `install()` → `rules-lock.json`.
- **Trust boundary:** `validateResearchPlan` ([`research/validate-plan.ts`](../../../packages/core/research/validate-plan.ts)) = schema + provenance host-gate; L4 `validate()` ([`validator/validate.ts`](../../../packages/core/validator/validate.ts)) = executable rule roundtrip + anti-vacuity.
- **Allowlist:** [`research/allowlist.ts:8-14`](../../../packages/core/research/allowlist.ts) — `next.official`(nextjs.org/vercel.com), `react.official`(react.dev), `tailwind.official`, `typescript.official`, `mdn`.
- **Install gate:** [`setup.d/80-rule-bootstrap.sh`](../../../setup.d/80-rule-bootstrap.sh) (FULL-gated, degrade-on-absence, rc=0) → [`install/rule-bootstrap-cli.ts`](../../../packages/core/install/rule-bootstrap-cli.ts).
- **Precedent to ADAPT (not copy):** [`.claude/skills/tool-bootstrapping/SKILL.md`](../../../.claude/skills/tool-bootstrapping/SKILL.md) — the 6-rule loop; it is itself **dual** (internal `.claude/skills/` + shipped `skills/` twin) — the agnosticism precedent (§Decisions Q3).

## 3. Architecture

```text
HUMAN — interactive agent session (MCP connected: context7 + deepwiki):
  run the rule-research protocol (portable agents/rule-researcher.md; CC skill = thin trigger):
    1. detect stack                         → REUSE /aif (or read package.json) → react-next
    2. research practices                   → deepwiki (semantic) + context7 (canonical doc URLs)
    3. for each practice, the agent authors:
         ResearchEntry {id, summary, best/antiPatterns, provenance(FETCHED + quoted)}
         GenerateCandidate {entryId=id, presence:'forbid', selector, message,
                            examples(single-token diff), negativeTest}
       L4-EXPRESSIBILITY FILTER (§MAJOR-1): practice NOT expressible as a single-file
       forbid-selector → record as research-only finding, NEVER emit a GenerateCandidate.
    4. confirm-bulk (Y/n)                    → ADAPT tool-bootstrapping R3
    5. write two committed files:
         .ai-factory/rules-research/<stack>.research.json   (ResearchPlan)
         .ai-factory/rules-research/<stack>.selection.json  (GenerateSelection)

./setup --full → setup.d/80-rule-bootstrap.sh → rule-bootstrap-cli.ts:
    NEW flags: --from-research <plan.json> --from-selection <sel.json>
      → FileResearchClient (read + validateResearchPlan)   ─┐
      → FileGenerateClient (read selection)                ─┤  injected into
    runRuleBootstrap({researchClient, generateClient})    ←┘  THE UNCHANGED TAIL
      → synthesizeGenerate → L4 gates → install() → rules-lock.json
    files absent → degrade + guidance ("run the rule-research protocol, then re-run") rc=0
    CI / tests   → default stubs (no network, $0)
```

## 4. Decisions (maintainer-confirmed 2026-06-29)

**A — both seams live (research + generate).** Not research-only. **Proven necessary:** the Phase-0 e2e fed a live 2-pattern plan through the real `runRuleBootstrap` with the default generate stub → only the stub-matching rule shipped; the genuinely-new pattern was silently dropped at [`generate.ts:47-48`](../../../packages/core/synthesizer/generate.ts) (`find(entryId) … if (!entry) continue`). Research-only-live would ship the hardcoded rule under a "live" banner = the T-RBI-A masquerade. #798 §13 already specifies "coerce → ResearchPlan **+ GenerateSelection**". The seam invariant ([`generate-port.ts`](../../../packages/core/synthesizer/generate-port.ts)) permits the agent to author `selector` as *data* (L4 validates it executably).

**B — degrade + guidance (not stub-fallback).** Files absent at `./setup --full` → print guidance, ship no rule (mirrors `setup.d/80` degrade-on-absence). Stub stays ONLY as the CI/test injection, never a consumer fallback (stub-fallback would re-introduce the masquerade).

**C — ledger `.ai-factory/rules-decisions.md` (#798 §5) DEFERRED to next slice.** This slice closes the load-bearing unknown (live research → honest executable rule). The ledger is additive persistence (mirror of `tool-decisions.md`) that touches the `deps-hash-check.sh` hook + a new committed doc — a clean, separate concern (atomic-umbrella discipline, [CLAUDE.md PR strategy](../../../CLAUDE.md)).

**Decided on the merits (reported, not asked):** SSOT — cite **#183** (already in the `rule-bootstrap-cli.ts` trailer); research runs ONLY in the human's interactive session (spawning from bash is rejected — MCP is not available in a subprocess + would break `$0`/free-on-subscription billing); allowlist stays tight (agent curates canonical URLs).

## 5. MAJOR-1 — L4-expressibility filter (first-class, not a caveat)

**Confirmed in code:** [`generate.ts:58-73`](../../../packages/core/synthesizer/generate.ts) routes only `presence:'forbid' && selector` → `declarative` (executable L4 roundtrip); anything else without a registry-eslintConfig → `manual`. [`generate.ts:84-90`](../../../packages/core/synthesizer/generate.ts) omits the negative-test for `manual`. [`validate.ts:43-45`](../../../packages/core/validator/validate.ts) passes `manual` rules "WITHOUT affecting `ok`". **Phase-0 prototype empirically reproduced this:** a `server-only` practice (cross-file import boundary — NOT a single-file AST pattern) routed to `manual`, shipped with no firing test, L4 `ok` stayed `true` → an inert rule = the exact discipline-theatre the project exists to eliminate.

**Rule (two layers — defence in depth):**
1. **Skill/agent discipline (propose-step):** the agent emits a `GenerateCandidate` ONLY for practices expressible as a single-file `presence:'forbid' + selector` with a single-token-diff bad/good pair. A non-expressible practice (e.g. `server-only`, cross-file) is recorded in the `ResearchPlan` as a **research-only finding** (knowledge surfaced) and **never** emitted as a candidate.
2. **Mechanical backstop (live consume path):** when consuming the live selection, a rule that routes to `check.type:'manual'` is **dropped from the shipped set and logged loudly** ("practice X researched but not L4-expressible — recorded as research-only, NOT shipped as a rule"), never shipped as an inert rule. (The stub/CI path is unaffected.)

**Honest limit (stated, not hidden):** the L4-expressible subset is essentially "forbid this AST node," which off-the-shelf plugins often already cover. Richer checks (cross-file, ast-grep) are out of scope — a future engine extension, not this slice.

## 6. The two live file-clients + file contract

- **`FileResearchClient`** — reads `<stack>.research.json`, runs `validateResearchPlan` (throws → degrade), returns the `ResearchPlan`. Trust boundary #1.
- **`FileGenerateClient`** — reads `<stack>.selection.json`, returns the `GenerateSelection` (ignores `menu`, like the stub ignores `detection`). Trust boundary #2 = L4 downstream (+ the §MAJOR-1 manual-drop).
- **Two files, not one:** maps 1:1 onto the two injectable ports; each validated by its own gate. Drift (entryId mismatch between files) degrades safely (candidate dropped → research-only), never ships a broken rule.
- **MINOR-1 resolved — runtime path vs test-fixture path (the framework gitignores its own `.ai-factory/`):**
  - **Runtime (consumer):** `.ai-factory/rules-research/*.json` are committed *in the consumer repo* (team-shared reproducibility + audit, same rationale as `tool-decisions.md`). The human-auditable input record; `rules-lock.json` is the machine output record. The framework repo gitignores its OWN `/.ai-factory/` ([`.gitignore:42`](../../../.gitignore)) — that path is per-consumer scaffolding, not framework source, so nothing the slice writes there is committed in THIS repo.
  - **Test fixture (framework):** the deterministic test's sample plan+selection are committed framework fixtures under [`packages/core/synthesizer/fixtures/`](../../../packages/core/synthesizer/fixtures/) (precedent: `rn-research-plan.json`), **NOT** under `.ai-factory/` (gitignored → would never commit). The test reads the fixture from `fixtures/` and writes output to a `mkdtemp` consumer root (mirror [`rule-bootstrap.test.ts`](../../../packages/core/synthesizer/rule-bootstrap.test.ts)).

## 7. Provenance discipline (MINOR-2 / Q2 — verified-at-author-time, not "on conscience")

`validateProvenance` ([`allowlist.ts:23-47`](../../../packages/core/research/allowlist.ts)) is a pure, offline host+https gate — it CANNOT verify existence (network) or "supports the claim" (semantic/LLM); both are forbidden in the `$0`-in-CI deterministic tail. **Phase-0 negative control proved the gate rejects the raw URLs the MCPs actually emit** (`deepwiki.com` search footer, `github.com` context7 source) → provenance MUST be agent-curated to a canonical official-doc host.

**Therefore the skill/agent protocol REQUIRES, at author time (in-session, $0 on the human's subscription):** (a) a real fetch of the canonical URL, and (b) a stored quoted excerpt that supports the practice (in `extras` or the finding body). The host-gate in the tail is the mechanical backstop; the in-session fetch+quote is the substantive check. This converts "on the skill's conscience" into "verified-at-author-time."

## 8. Agnosticism (Q3 — portable-first)

The deterministic core is already AI-agnostic (a JSON file contract + a pure tail — any harness, or a human, can produce the input). The research *protocol* is the only agent-facing piece, and MCP research is not CC-exclusive → CC-only would be `#cc-only-without-rationale` ([dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md)).

- **Canonical (portable):** `agents/rule-researcher.md` — AI-agnostic sub-agent prompt; the full protocol (detect → research → author both artefacts with the §MAJOR-1 filter + §7 provenance discipline → write two files). Readable by any harness (Cursor/Aider/Codex) or a human.
- **CC wrapper (thin trigger):** `.claude/skills/rule-research/SKILL.md` — `@dual-pair: rule-research-protocol`, `# spec: agents/rule-researcher.md`. Ergonomic CC entry; no logic duplication (§7 dual-implementation single-source-of-truth).
- Mirrors the tool-bootstrapping dual (internal skill + shipped twin) the kickoff cites as the ADAPT precedent.

## 9. Phase 1 build list

1. `FileResearchClient` + `FileGenerateClient` (thin readers; §6). Carry `Prior-art:#183`.
2. Wire `rule-bootstrap-cli.ts` (`--from-research` + `--from-selection`, inject file-clients; default = stubs) + the §MAJOR-1 manual-drop backstop.
3. Wire `setup.d/80-rule-bootstrap.sh` — pass the two files when present; degrade + guidance when absent (Decision B).
4. `agents/rule-researcher.md` (portable canon) + `.claude/skills/rule-research/SKILL.md` (thin CC trigger). Not capability commits.
5. Deterministic test (mirror [`rule-bootstrap.test.ts`](../../../packages/core/synthesizer/rule-bootstrap.test.ts)): committed sample plan+selection fixtures under `packages/core/synthesizer/fixtures/` (the **`no-head-element`** demo; NOT `.ai-factory/` — gitignored) flow `--from-research`/`--from-selection` → factory → real `rules-lock.json` in a `mkdtemp` root; a non-expressible (manual) candidate is dropped, not shipped. `$0`-in-CI.

## 10. Demo rule (MAJOR-3) + Phase-0 prototype gate (PASSED)

**Demo rule = `no-head-element`** (raw `<head>` → Metadata API / `next/head <Head>`), distinct from the stub's `no-raw-img`. Genuinely researched (live deepwiki, canonical `https://nextjs.org/docs/messages/no-head-element`), declarative-forbid-expressible (`JSXOpeningElement[name.name='head']`), single-token diff (`<head />`→`<Head />`).

**Phase-0 generate-half gate (MAJOR-2) — PROVEN, not assumed.** A fresh agent-authored `GenerateSelection` for `no-head-element` through the real `synthesizeGenerate` + L4: `check.type=declarative`, L4 `ok:true`, **fires** on `<head />`, **clean** on `<Head />`, negative-test present. The same run reproduced MAJOR-1 (server-only → manual → inert). (Prototype was scratch-only; deleted.)

> *Demo nuance (honest):* `no-head-element` is itself an off-the-shelf `@next/next` rule re-expressed declaratively. The slice's value is the live-research→executable-rule **pipeline**, not rule novelty; novel (cross-file) rules need a richer engine (§5 limit).

## 11. Honesty / out-of-scope (T-RBI-A)

- **Live:** which practices, their provenance (fetched+quoted), AND the rule body (selector/examples) — all agent-authored, all L4-validated.
- **Not live / not this slice:** the ledger (Decision C); multi-stack (skill is stack-general, but only react-next is validated end-to-end here — multi-stack = extend `allowlist.ts` data + per-stack demo, follow-up, §Q1); generation of the framework's OWN rules (#798 §10 — deliberate recursive-self-application gap, the trusted seed).
- **Untouched:** the deterministic tail; opted-out (non-`--full`) install byte-identical.

## 12. Testing / $0-in-CI (principle 17)

Live MCP research is session-bound, NEVER in CI. The deterministic tail is CI-tested with injected stubs (`stubRuleResearch`/`stubGenerateNextImage`). New test feeds committed sample fixtures (`packages/core/synthesizer/fixtures/`, not `.ai-factory/`) through the file-clients (no network). Re-confirm `tests/agnosticism/probes/paid.sh` stays green.

## 13. SSOT / capability commit

Cite **#183** (rule-research bridge BUILD, #798 §11) on any ≥80-LOC TS commit (re-grep max id at commit time). The `agents/*.md` + `.claude/skills/*` markdown are not capability commits.
