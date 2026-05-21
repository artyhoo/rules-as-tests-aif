# Principle 15 — Skill paired-negative (design sketch)

> **Class:** A — design sketch (this file); companion executable test `15-skill-paired-negative.test.ts` pending (Commit B). Mirrors the design-then-test split of [`11-build-first-reuse-default.design.md`](11-build-first-reuse-default.design.md).
> **Authoritative for:** the design of principle 15 — what it checks, the paired-negative marker convention for `SKILL.md`, scope, grandfather policy, self-test shape.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The paired-negative *idea* for rules — see [`02-paired-negative-test.test.ts`](02-paired-negative-test.test.ts).

> **Origin:** Wave **N2 #5** of the growth roadmap ([research-patches/2026-05-21-n2-adopt-from-superpowers.md](../../../docs/meta-factory/research-patches/2026-05-21-n2-adopt-from-superpowers.md)), maintainer go 2026-05-21. ADAPT (idea, no dependency) of Superpowers' «NO SKILL WITHOUT A FAILING TEST FIRST» — RED-GREEN-REFACTOR for skill authoring. We take the idea and turn it into our own executable check; we do not depend on Superpowers (substrate stays dep-free per DECISION=C).

## §1 — Why this is a NEW principle, not an extension of principle 02

[`02-paired-negative-test.test.ts`](02-paired-negative-test.test.ts) checks `rules-manifest.json` entries — each *code rule* must carry `examples.bad` + `examples.good` that differ. A **skill** (`SKILL.md`) is a different artifact: a markdown prompt with frontmatter (`name`, `description`, `when_to_use`), no `examples.bad/good` fields. There is nothing in principle 02 to extend; the paired-negative *idea* must be re-expressed against the skill artifact. Hence a new slot (15), not an edit to 02. (This is the honest scope correction made when reading principle 02 — the roadmap's «extend principle 02» framing was imprecise.)

## §2 — The idea, applied to skills

Superpowers' discipline: *«If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.»* The paired-negative for a skill is therefore a **documented failure-without-skill demonstration**: what the agent does *wrong* when the skill does NOT fire, paired with what it does *right* when it does. This is the skill-level analogue of `examples.bad` / `examples.good`.

## §3 — What principle 15 checks (structural-presence, like principle 09)

For each in-scope `SKILL.md`, the test asserts presence of a **paired-negative block**: a recognizable section documenting the without-skill failure + the with-skill correction. Proposed marker convention (one of, checked by the test):

- a body section headed `## Without this skill` (the negative) followed by `## With this skill` (the positive); **or**
- a frontmatter field `paired_negative:` with non-trivial `without:` / `with:` sub-keys.

Both forms are mechanically greppable; the test checks non-trivial content (≥ N chars) and that the two halves differ (anti-tautology, mirroring principle 02 §`bad !== good`).

> **Open design point (flagged, not decided):** which marker form is canonical. Recommendation: the body-section form (no frontmatter-schema change, readable, matches how skills already document themselves). Final marker choice belongs with the maintainer at Commit B.

## §4 — Scope

In-repo skills only (what CI can see): `.claude/skills/*/SKILL.md` (currently: `self-reflection`, `template-audit`, `tool-bootstrapping`) + `skills/*/SKILL.md` (currently: `rules-as-tests`, `tool-bootstrapping`). Global `~/.claude/skills/*` are out of scope — not in the repo, not visible to CI. Shipped consumer-facing skills under `skills/` ARE in scope (they are the product surface).

## §5 — Grandfather policy (DECIDED, not punted)

The 5 existing in-repo skills predate this principle. **Grandfather them with a date cutoff (`2026-05-21`)** — identical to the [`09-doc-authority-hierarchy`](09-doc-authority-hierarchy.test.ts) / doc-authority cutoff pattern. New or substantively-edited skills after the cutoff must carry the paired-negative block; pre-cutoff skills are exempt until next substantive touch.

**Why grandfather, not sweep-now:** a same-PR sweep of 5 skills would (a) impose authored failure-scenarios on skills whose owners aren't in this session, and (b) risk CI red on landing. The cutoff keeps CI green and makes the requirement forward-going — matching every other discipline rule's «forward-going, not retroactive» posture ([dual-implementation-discipline.md §9](../../../.claude/rules/dual-implementation-discipline.md) current-state precedent). Maintainer may opt to sweep instead; that is an explicit choice, not the default.

## §6 — Self-test (recursive self-application — invariant #2)

The principle must itself ship paired-negative *mutation* tests (it cannot demand of skills what it does not demonstrate):

- **positive:** a fixture skill WITH a valid paired-negative block passes.
- **mutation 1:** remove the `## Without this skill` half → assertion throws (block absent).
- **mutation 2:** make without === with → assertion throws (tautology).
- **mutation 3:** grandfather exemption — a pre-cutoff skill with no block passes; the SAME skill dated post-cutoff fails (proves the cutoff is load-bearing, not decorative).

## §7 — Backward-sweep cost (per §1.7)

Backward-check obligation: the new rule's scope = in-repo skills. With grandfather, the *complete* sweep is satisfied trivially (all 5 exempt by date); the exemption itself carries mutation 3 above (proves the exemption preserves intent and breaks when removed). No skill is forced to change in Commit B.

## §8 — Promotion timeline

- **Commit A (this file):** design sketch. No behaviour change, CI untouched.
- **Commit B (≤2 weeks, separate atomic commit):** `15-skill-paired-negative.test.ts` implementing §3 + §5 + §6. 2-3 hour budget. Maintainer confirms the §3 marker form before B lands (it introduces a SKILL.md authoring convention).

## §9 — §1.7 self-reflexive

- **Forward-check:** complies with `build-first-reuse-default` (ADAPT verdict — idea adopted, no Superpowers dep; substrate-pure per DECISION=C); `no-paid-llm-in-ci` (pure structural grep/AST, no LLM); `doc-authority-hierarchy` (this design carries a header); `reviewer-discipline` (the one convention choice — §3 marker form — surfaced for maintainer, not decided).
- **Backward-check:** §7 — grandfather makes the complete-sweep obligation explicit and cheap; exemption has its own mutation test (§6 mutation 3).
- **Self-application:** §6 — the principle demonstrates the very paired-negative discipline it demands of skills (invariant #2: recursive self-application green).

## §10 — See also

- [`02-paired-negative-test.test.ts`](02-paired-negative-test.test.ts) — paired-negative for code rules (the idea this re-expresses for skills).
- [`09-doc-authority-hierarchy.test.ts`](09-doc-authority-hierarchy.test.ts) — structural-presence + date-cutoff grandfather precedent.
- [`14-skill-drift-detection.test.ts`](14-skill-drift-detection.test.ts) — adjacent skill-targeting principle.
- [`11-build-first-reuse-default.design.md`](11-build-first-reuse-default.design.md) — design-then-test split precedent.
- [research-patches/2026-05-21-n2-adopt-from-superpowers.md](../../../docs/meta-factory/research-patches/2026-05-21-n2-adopt-from-superpowers.md) — N2 #5 origin.
