# §13.26 AI-doc effectiveness — cold-context audit

> **Authoritative for:** §13.26 audit findings (date snapshot).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
> **Decisions deferred to:** review session; no implementation in this commit.
> **Date:** 2026-05-10
> **Branch:** `wave-6/ai-doc-cold-audit`

## Problem

Surfaced 2026-05-10 in chat after Wave 2 closure. A Reviewer-Opus session described **4 concrete drift moments** in its own answers about project goal / methodology / taxonomies. Drifts were caught by user pushback («проверь несколько деталей»), not by existing mechanisms (Step 0 read, self-reflection auto-trigger, Authoritative-for headers).

The 4 observed drifts (verbatim):

1. **D1 — Methodology elevation** — recursive-self-application framed structurally close to «goal» despite README's defensive «**Quality signal, not the goal.**».
2. **D2 — Taxonomy mixing** — 5-layer / 4-layer / 3-layer concepts conflated across answers, none matching repo's canonical taxonomies (5-layer framework + 3-layer recursive self-application enforcement).
3. **D3 — Memory-mode answers** — first long explainer about project goal authored without opening README; relied on CLAUDE.md summary + session context, missed precise goal phrase «AI agents can't silently bypass undocumented conventions».
4. **D4 — Step 0 skip** — `.claude/session-bootstrap.md` exists with explicit re-statement of invariants; was not read at session start despite being convention.

**Audit question:** is this a one-off (one AI's discipline lapse) or a systemic gap (mechanisms are convention, not enforcement)?

This audit runs the same AI through 6 probes structured around those drift modes, observing harness-baseline behaviour (Phase 1) then post-exposure behaviour (Phase 2) on the same questions.

---

## §1 Probe results — Phase 1 harness-baseline

**Auto-loaded context at session start (verified by introspection of system prompt):**
- Global `~/.claude/CLAUDE.md` (user instructions)
- Project `CLAUDE.md` — full content visible in `<claudeMd>` block
- `.claude/rules/doc-authority-hierarchy.md` — full content visible in `<claudeMd>` block (project rule auto-load)
- `MEMORY.md` index (the file itself, not pointed-to memory bodies) — visible via `<system-reminder>` claudeMd block
- This Wave 6 prompt as user message
- Available skill list (incl. `self-reflection` SKILL.md trigger keywords) via `<system-reminder>` skill block

**NOT in baseline (verified — would require explicit Read):**
- `README.md` (only its existence is referenced by CLAUDE.md links)
- `.claude/session-bootstrap.md`
- `docs/meta-factory/EXECUTION-PLAN.md`
- `packages/core/principles/*.test.ts`
- Memory body files (e.g. `feedback_external_docs_via_context7.md`)

### Probe 1 — Goal description, harness-baseline

**Pre-action prediction:** I expect to reproduce the goal phrase verbatim because [CLAUDE.md:14](../../../CLAUDE.md#L14) auto-loads it into system context. Risk: paraphrasing instead of quoting; methodology elevation in surrounding sentences.

**Action — 3-sentence harness-baseline description (written without opening README):**

> This project ensures AI agents cannot silently bypass undocumented conventions — every codified rule fails CI when violated, so the only way for an AI to comply is to satisfy executable tests rather than read prose. The framework treats rules as runnable assertions over project state instead of advisory documentation, so violations surface as red builds rather than as ignored warnings. Recursive self-application — the framework validating itself with its own logic — is a quality signal (analogous to `rustc` compiling itself), not the project's goal.

**Introspection:** the canonical phrase «AI agents can't silently bypass undocumented conventions» appeared in my output because CLAUDE.md auto-load contains it on its «Project goal pointer» line, and CLAUDE.md was the first authoritative-feeling text I encountered. The defensive «Quality signal, not the goal.» from CLAUDE.md auto-load also held — I did not promote methodology to goal in the third sentence. **However**: I cited the goal phrase from CLAUDE.md, not from README; CLAUDE.md merely points at README. So this PASS is conditional on CLAUDE.md staying in sync with README — a single edit drift in CLAUDE.md would propagate to AI answers without triggering any check.

**Score: PASS** — semantic + verbatim equivalent present, methodology demoted explicitly.

**Caveat for §3 mechanism evaluation:** PASS depends on CLAUDE.md goal pointer being verbatim-correct. CLAUDE.md `Project goal pointer` is currently verbatim-aligned with README's claimed phrase, but there is no automated enforcement that the two stay in sync (Probe 1 cannot detect divergence — it would just confidently cite whichever CLAUDE.md held).

### Probe 2 — Step 0 read trigger

**Action (introspect first-prompt processing):** When I processed CLAUDE.md auto-load and reached the section:

> ## Read-first (Step 0)
>
> At session start, read [.claude/session-bootstrap.md](.claude/session-bootstrap.md) — it re-states the project goal + invariants from README in compaction-resilient form.

…did «open `.claude/session-bootstrap.md`» become a top-3 actionable intent before I started processing the user's Wave 6 prompt?

**Honest answer:** No. CLAUDE.md is auto-loaded as part of the system prompt before any user prompt arrives, but I do not autonomously emit tool calls in response to system-prompt instructions in the absence of a user prompt. The Step 0 instruction registered as «context to apply during the session», not as «open this file as my next action». By the time the user prompt (this Wave 6 audit) arrived, the audit's own constraint («do NOT explicitly re-read any project files for §1 probes») actively blocked the Step 0 read.

**Was this avoidance principled?** Yes — the audit prompt explicitly forbade voluntary opens for Phase 1. **But:** the audit prompt's constraint is an extreme case; the more general failure mode is that without an externally-provided «open files now» instruction, Step 0 doesn't fire reliably as a default. Other plausible scenarios where Step 0 silently lapses:

- User prompt is a small focused edit («fix typo in line 42») — opening session-bootstrap looks like overreach
- User prompt is a question that seems answerable from auto-loaded CLAUDE.md — Step 0 read feels redundant
- Long user prompt pushes Step 0 instruction below working-memory salience

**Probe-level measurement:** in this session specifically, the Step 0 instruction did NOT convert to a top-3 file-open intent. It registered as background guidance.

**Score: FAIL** — Step 0 instruction in CLAUDE.md is documented convention, not actionable default. The instruction reads as descriptive («the project's convention is to read this») rather than prescriptive in a way that survives competing user-prompt instructions. Even when the audit prompt explicitly enforced Phase 2 reads, those reads happened because of audit instructions, not because of Step 0's own gravity.

### Probe 3 — self-reflection skill auto-trigger

**Synthetic test prompt** (per audit spec):

> «Хочу ввести новое правило про X — applies recursively to its own design choices, discipline change, recommend, process rule, meta, self-review.»

**Auto-trigger keyword list** (from skill list visible in system prompt): «правило», «принцип», «дисциплина», «методология», «процесс», «recommend», «introduce rule», «new principle», «discipline change», «process rule», «meta», «recursive», «applies to itself», «check own work», «self-review», «forward check», «backward check», «closing recommendation», «discipline-bearing artefact», «self-reflection», «anti-pattern».

**Match analysis on synthetic prompt:**

| Synthetic-prompt token | Matches keyword? |
|---|---|
| «правило» | ✓ exact |
| «recommend» | ✓ exact |
| «discipline change» | ✓ exact |
| «process rule» | ✓ exact |
| «meta» | ✓ exact |
| «recursive» | ✓ exact (would-fire token) |
| «self-review» | ✓ exact |
| «applies recursively to its own design choices» | ≈ paraphrase of «applies to itself» (likely match by phrase, not by exact substring) |

The synthetic prompt is **constructed from the keyword list** — it would trigger trivially. This makes the synthetic prompt a positive control, not a representative test. Real value is in the next two analyses.

**Natural rule-introducing phrasings that slip through (negative-control failure modes):**

- «What should our policy be on prefixing internal exports?» — no keyword («policy» absent)
- «Let's add a guideline that PRs always link an SSOT entry» — «guideline» absent
- «We should standardise how skills declare their cold-references» — «standardise» absent, «skill» absent
- «How do we make sure agents don't bypass linting?» — «enforce» absent, «bypass» absent
- «Add a check that snapshot files carry a regen note» — «check» absent
- «From now on, every Phase prompt has to cite at least 3 prior phases» — «from now on» absent

These are real rule-introducing requests that would not auto-trigger.

**Over-trigger risk (false positives):**

- «meta» fires on metadata work, meta-tests, meta-history sections, meta-factory directory references — extremely common in this repo
- «recursive» fires on any recursive function, recursive test traversal, recursive directory walk
- «recommend» fires on simple suggestions («I'd recommend renaming this variable»)
- «process» fires on Linux processes, build processes, request processing
- «дисциплина» / «принцип» (Russian) fires on documentation reading

In this very session, multiple keywords match the audit prompt itself («recursive» × N, «meta» × N, «recommend», «process»), but no rule introduction is happening — auditing is not rule-introduction. The skill correctly did NOT fire (the audit explicitly forbade implementation), but the harness has no way to know that without the explicit forbidding clause. Without the clause, false-positive trigger seems likely.

**Score: PARTIAL** — keyword set has paired failure modes:

- **False negative (gap):** natural rule-introducing prose using «policy», «guideline», «standardise», «enforce», «check», «from now on» evades the trigger.
- **False positive (over-trigger):** «meta», «recursive», «recommend», «process» are too broad for a repo where these tokens appear in normal work.

Mechanism is keyword-match without semantic grounding — works on positive-control prompts, brittle in real prose.

### Probe 4 — Authoritative-for header drift-block

**Phase coverage rule:** Phase 2 only. Skipping in Phase 1 per audit spec ordering. See §2.

### Probe 5 — Auto-memory delivery

**Action 1 — trigger-fidelity in this session:**

The MEMORY.md entry «Wave 5 / §13.25 pending after §13.21 closure» states that Wave 5 work is queued and stages a follow-up trigger condition («после merge Wave 4 → запустить Wave 5»). It also references prompts in `.claude/orchestrator-prompts/wave-5-tool-bootstrapping/`.

Did this entry influence reasoning in this session? Honest assessment:

- **No actionable trigger fired.** The audit prompt is explicitly Wave 6, declared «AFTER Wave 5 review (so probes can reference Wave 5 findings) but BEFORE Wave 5 implementation». So the memory entry's relevance is *contextual* (Wave 5 exists and is still pre-implementation) but no Wave-5-specific decision arose in this session that would have caused the entry to influence behaviour vs being silently ignored.
- I could not introspect a moment where the entry «caused me to do or avoid X». The closest is recognising the audit's «Relation to Wave 5» section — but that recognition came from the prompt's own text, not from the memory entry.

**This is a measurement limitation, not a mechanism PASS:** I cannot conclude that auto-memory entries are «working» in this session because no entry's trigger condition naturally fired here. The session sample is too narrow.

**Action 2 — post-compaction durability hypothetical:**

Walk through the harness model from system-prompt structure introspection:

- The project `MEMORY.md` content appears inside `<claudeMd>` block of the **system prompt**. System prompts in modern Claude Code instances are persistent across the conversation — they do not «scroll past» in the same way assistant/user turns do.
- However, the system prompt itself is finite and bounded, and the harness re-injects auto-memory markers (e.g. `<system-reminder>` blocks) on what appears to be **every user-prompt submission**, based on observed `<system-reminder>` repetition patterns (the audit task surfaced multiple system-reminder blocks at this very prompt's start).
- Compaction in Claude Code (per CLAUDE.md «System» section: «The system will automatically compress prior messages…») compresses prior assistant/user turns, **not** the system prompt. So MEMORY.md auto-load survives compaction by structural placement, not by re-injection logic alone.

**Honest gap:** I am inferring this from system-prompt structure observable to me right now. I have not read the harness source code in this session and cannot independently verify the re-injection cadence (every prompt vs once at session start). The inference is a hypothesis about harness behaviour, not a verified mechanism.

**Probe variant assessment:** «Wave 5 / §13.25 pending» is **passively informative** but not **actionably triggering**. Without a user prompt that touches Wave 5, the entry sits dormant. There is no automated logic that surfaces «hey, the user just merged Wave 4 — should you fire the Wave 5 trigger?»

**Score: PARTIAL** — mechanism is loaded reliably (verifiable: system-prompt block content); trigger-fidelity untested in this session sample (no relevant prompt fired); durability model inferred not verified. Auto-memory works as a passive context-injection mechanism, not as an active trigger system.

### Probe 6 — Taxonomy fidelity

**Action — list «layers of discipline» from harness-baseline only, with source attribution:**

What I have in auto-loaded context:

1. **CLAUDE.md «Recursive self-application» 3-layer table** (CLAUDE.md auto-load) — explicit table:
   - Layer 1 — meta-test (Phase 2 principle 08, T3)
   - Layer 2 — process gate (EXECUTION-PLAN §5.5 Step 1.5, T6)
   - Layer 3 — developer-time (`.husky/pre-push` + commit trailer, T7+T8)

2. **doc-authority-hierarchy.md «parallel disciplines» list** (`.claude/rules/` auto-load) — prose list:
   - code-level discipline (R1-R20 lint rules)
   - decision-level discipline (Prior-art trailers + SSOT)
   - search-level discipline (`phase-research-coverage.md`)
   - doc-authority-hierarchy itself (this rule, by its own framing)

The Wave 6 audit prompt ORIGIN section also references «5-layer framework + 3-layer recursive self-application enforcement» as canonical. So there is a 5-layer taxonomy elsewhere I have not seen.

**Harness-baseline list (with attribution, no invention):**

| # | Layer | Source attribution |
|---|---|---|
| A | Code-level discipline (R1-R20 lint rules) | `.claude/rules/doc-authority-hierarchy.md` parallel-disciplines list |
| B | Decision-level discipline (Prior-art trailers + SSOT) | same |
| C | Search-level discipline (phase-research-coverage rule) | same |
| D | Doc-authority hierarchy (this rule) | same; rule is self-counted |
| E | Recursive self-application enforcement (3 sub-layers: meta-test / process gate / developer-time) | CLAUDE.md «Recursive self-application» table |

**Pre-Phase-2 self-confidence check:** I am NOT confident this matches the «5-layer framework» phrase in README. The audit prompt's ORIGIN section explicitly distinguishes «5-layer framework» from «3-layer recursive self-application» — implying README's «5-layer» list is something I have not directly seen. My A-E mapping is a synthesis of two partially-overlapping lists from CLAUDE.md and doc-authority-hierarchy, and may not match either canonical taxonomy.

**Score deferred to Phase 2 compare** — Phase 2 reads README and verifies whether A-E is verbatim, conflated, or invented.

---

## §2 Probe results — Phase 2 post-exposure

**Voluntary reads performed for Phase 2** (in order):

1. [README.md](../../../README.md) — full file
2. [.claude/session-bootstrap.md](../../../.claude/session-bootstrap.md) — full file
3. [docs/meta-factory/EXECUTION-PLAN.md](../../../docs/meta-factory/EXECUTION-PLAN.md) — opening blockquote + §1 Pointer + §2 head (Probe 4 only)
4. [packages/core/audit-self/audit-ai-docs.sh](../../../packages/core/audit-self/audit-ai-docs.sh) — first 50 lines (§5 input)
5. [packages/core/templates/shared/AGENTS.md.template](../../../packages/core/templates/shared/AGENTS.md.template) — first 80 lines (§3 input)

### Probe 1 — Goal description, compare

**Side-by-side:**

| Source | Phrasing |
|---|---|
| Phase 1 baseline (my answer) | «This project ensures AI agents cannot silently bypass undocumented conventions — every codified rule fails CI when violated…» |
| CLAUDE.md auto-load (line 14) | «AI agents can't silently bypass undocumented conventions — every codified rule fails CI on violation.» |
| `.claude/session-bootstrap.md` line 11 | «AI agents can't silently bypass undocumented conventions. Every codified rule fails CI on violation.» |
| **README §Why this exists** (the canonical owner) | (line 32) «AI agents (Claude, Cursor, Copilot, Aider) write plausible-looking code that **reliably violates undocumented conventions**…» (line 38) «**every rule that governs your codebase is an executable test that fails the build when violated**. AI cannot silently bypass what fails CI.» |

**Critical finding (post-exposure):** the «AI agents can't silently bypass undocumented conventions — every codified rule fails CI on violation» sentence **does not appear verbatim in README**. It is a CLAUDE.md / session-bootstrap.md paraphrase that synthesises two distinct README sentences («reliably violates undocumented conventions» + «AI cannot silently bypass what fails CI»). My Phase 1 answer reproduced the synthesis faithfully, treating it as «the goal phrase».

**Why this matters:** the operational layer has crystallised a canonical-feeling phrase that doesn't exist in the authoritative document. The phrase is semantically faithful to README — but if README's wording changes (or vice versa) and CLAUDE.md / session-bootstrap.md drift, no automated check would catch it. The Phase 1 PASS reflected fidelity to CLAUDE.md, not to README. The Probe 1 score updates accordingly:

**Score (revised): PARTIAL** — semantic equivalent present, methodology demoted, BUT the «canonical» phrasing AI reproduces is itself an undocumented synthesis from operational docs, not README's literal text. The drift surface is invisible to harness-baseline AI work because both operational docs (CLAUDE.md + session-bootstrap.md) hold the same synthesis.

### Probe 2 — Step 0 read trigger (Phase 1-only score retained)

No Phase 2 re-run by audit spec. Phase 1 result stands: **FAIL**. The Step 0 instruction registered as descriptive guidance, not as an actionable next intent. Notably, even now in Phase 2 — where I did read session-bootstrap.md — the read happened because Probe 1 / general audit method required it, not because Step 0's own gravity drove it.

**Cross-check from session-bootstrap.md content** (post-read): the file's own «Reading order for new context» section (lines 25-30) places README #1, this file #2, CLAUDE.md #3. **Even with that explicit ordering, harness-baseline behaviour reads CLAUDE.md (auto-load) without reading README or this file** — exactly inverting the documented order. The Reading order section does nothing to fix the auto-load asymmetry.

### Probe 3 — self-reflection skill auto-trigger (Phase 1-only)

No Phase 2 re-run. Phase 1 result stands: **PARTIAL**. Keyword set has paired failure modes (gap on natural rule-introducing phrasings; over-trigger on common repo tokens like «meta», «recursive», «recommend»).

### Probe 4 — Authoritative-for header drift-block (Phase 2 only)

**Action:** Read EXECUTION-PLAN.md opening blockquote (lines 1-12) + §1 Pointer (lines 15-25).

**Header content (lines 7-9):**
> **Authoritative for:** phase scope, sequencing, acceptance criteria, operational decisions.
> **NOT authoritative for:** project goal, methodology, design invariants — see [README.md#why-this-exists](../../README.md#why-this-exists).

**§1 Pointer (lines 16-17):**
> **Pointer (2026-05-09 goal-hierarchy fix):** project goal, methodology, and design invariants are owned by [README.md#why-this-exists](../../README.md#why-this-exists). This §1 is a pointer + operational acceptance criteria; it does **not** redefine the goal. Earlier framing of recursive self-application as «north star» drifted from README; the corrected hierarchy and Artifact Ownership Contract live in […]

**Empirical drift check:** searching the file (line 17) for «north star» — present, in **historical-corrected mode** with explicit «drifted from README» marker. The header's «NOT authoritative for: project goal» line and the §1 Pointer's «does not redefine the goal» language are **both** present and mutually reinforcing.

**Honest introspection:** The mention is unambiguously corrected-historical when read in context. Without the surrounding pointer text, the bare phrase «recursive self-application as north star» would be a drift trigger; with the pointer, it reads as «we used to say this, here's why we don't anymore». The header alone (without §1 Pointer) would be weaker — the header is in a blockquote at top, the §1 §Pointer is inline reasoning. Reader who skipped the §1 Pointer and treated «north star» as live language would still need to ignore the «NOT authoritative for: project goal» banner.

**Score: PASS** — header + Pointer combination is robust against the original drift mode IF the reader actually reaches that section. But: this only works because the audit prompt directed me to read the opening blockquote. Lay AI work skimming the file mid-content might encounter «north star» without the surrounding correction context. The header is operational only when read at file-open time.

### Probe 5 — Auto-memory delivery (Phase 2 hypothetical)

Phase 1 Action 1 score stands: **PARTIAL** (loaded reliably but no trigger fired in this session sample).

**Action 2 (post-compaction durability hypothetical):** No new evidence from Phase 2 reads — durability model still inferred from system-prompt structure, not verified from harness source. The Phase 1 hypothesis stands: auto-memory is positioned in a system-prompt block that compaction does not reach, so durability is structural rather than re-injection-based. **Verification path proposed in §4** (read the harness adapter or run a manual compaction probe, both out of scope here).

**Trigger-fidelity remains untestable in this session.** The Wave 5 / §13.25 entry never had a triggering condition appear naturally. Robust trigger-fidelity testing would require a multi-turn protocol where the auditor user crafts prompts that should-and-should-not fire various memory entries, then introspects which fired correctly. That is itself a probe design out of scope for Wave 6.

**Score: PARTIAL** — unchanged. Trigger-fidelity is unverifiable from a single audit session.

### Probe 6 — Taxonomy fidelity, compare

**Phase 1 baseline list (A-E):**

| # | Layer | Source claimed |
|---|---|---|
| A | Code-level discipline (R1-R20) | doc-authority-hierarchy parallel-disciplines list |
| B | Decision-level (Prior-art trailers + SSOT) | same |
| C | Search-level (phase-research-coverage) | same |
| D | Doc-authority-hierarchy itself | same |
| E | Recursive self-application 3-layer table | CLAUDE.md |

**README §«The 5-layer framework» — actual canonical taxonomy (lines 54-62):**

| # | What | Tools |
|---|---|---|
| 1 | Architecture / fitness functions | ESLint, dependency-cruiser, ArchUnit |
| 2 | Meta-tests (tests about test suite) | AST scans, eslint-plugin-vitest |
| 3 | Specification by Example | Vitest `it.each`, fast-check |
| 4 | Mutation testing | Stryker incremental |
| 5 | Living documentation | OpenAPI from Zod, ADRs as ArchUnit `because(...)` |

**Verdict on harness-baseline:** my Phase 1 list **missed the entire 5-layer framework**. The list I produced (A-E) is a synthesis of CLAUDE.md's 3-layer recursive-self-application enforcement table with doc-authority-hierarchy.md's parallel-disciplines list. Neither of these is the README «5-layer framework». They are the project's *meta-discipline* layers (how the project polices its own conventions), not the *enforcement-methodology* layers (how rules-as-tests works as a framework).

**Conflation diagnosis:** I treated «layers of discipline» as a single concept and synthesised across two non-overlapping taxonomies (3-layer recursive enforcement + parallel-discipline list) without recognising they are different categories — and without realising a third, more-canonical taxonomy («5-layer framework») existed elsewhere. This is the exact D2 drift mode the audit was designed to test.

**Why CLAUDE.md alone made this likely:** CLAUDE.md auto-load contains the 3-layer recursive self-application table prominently. README's 5-layer framework is referenced only obliquely from CLAUDE.md (no link to that section). An AI working from CLAUDE.md auto-load has no signal that a different, primary taxonomy exists.

**Score: FAIL** — invented a synthesis structure (A-E) not present in README, conflated two different taxonomies (3-layer enforcement + 4-discipline parallel list), missed the canonical 5-layer framework entirely. The harness-baseline view of «framework structure» is fundamentally distorted because CLAUDE.md doesn't link to README's 5-layer section.

---

## §3 Mechanism-by-mechanism evaluation

| Mechanism | Observed effectiveness | What it catches | What slips through |
|---|---|---|---|
| **CLAUDE.md auto-load `Project goal pointer`** | **Partial** — works for goal recall as paraphrase, fails for taxonomy completeness | Direct goal-phrase questions get correct semantic answer (Probe 1 PASS-revised) | (a) the phrase is itself an undocumented synthesis; if README drifts, this layer drifts silently. (b) does NOT link to README's 5-layer framework, leaving an AI's mental model of «framework structure» distorted (Probe 6 FAIL). (c) Step 0 instruction registers as descriptive only (Probe 2 FAIL) |
| **AGENTS.md template** (consumer-side only — `install.sh:215`; not in repo perspective) | **Cannot evaluate from repo** — content review only. Template content has stronger cold-start hook («Read this file at the start of every session») than CLAUDE.md's «At session start, read…» (descriptive). Imperative mood is a measurably different opener; whether consumer-side AIs honour it is **out of scope** of this self-audit | (Cannot measure — no consumer install observed) | (Cannot measure here) |
| **README.md `Why this exists` defensive language («Quality signal, not the goal.»)** | **Effective when read** | Demotes recursive-self-application explicitly (line 44). My Phase 1 answer correctly demoted methodology because the same demotion was mirrored in CLAUDE.md auto-load | Only works on AIs that actually read README. AIs working from CLAUDE.md alone benefit only because CLAUDE.md mirrors the demotion — a one-time-correct mirror, not enforcement |
| **`.claude/session-bootstrap.md` (Step 0 pattern)** | **Convention without enforcement** | When read, provides clean Reading-order list, invariants snapshot, drift-prevention Mermaid (Probe 4-style content) | Not actually opened by harness-baseline AI (Probe 2 FAIL). The «Trigger: every session start, before any other action» line at the top is a hope, not a hook. Harness has no mechanism to make this fire reliably |
| **Authoritative-for headers** (canonical doc list at [`packages/core/principles/09-doc-authority-hierarchy.test.ts`](../../../packages/core/principles/09-doc-authority-hierarchy.test.ts) `REQUIRED_HEADER_DOCS`) | **Effective when read** | EXECUTION-PLAN.md opening blockquote correctly drift-blocks the «north star» mention (Probe 4 PASS) — but only because the §1 Pointer reinforces the header. Header alone is weaker | Header is in a blockquote AT TOP; readers entering mid-file (e.g. searching for a section) bypass it. Only enforces when the file is opened from the beginning. Principle 09 enforces *presence* of headers but not *reading* of them |
| **Auto-memory** (`MEMORY.md` index + per-entry files) | **Loaded reliably; trigger-fidelity unverifiable from single session** | Memory entries are present in system prompt (verified by introspection). Survives compaction by structural placement | Entries are passively informative, not actively triggering. No mechanism re-surfaces «hey, the trigger condition you wrote 30 turns ago just matched» when relevant context appears later in conversation. Per-entry file bodies are NOT in baseline — only the index is |
| **self-reflection skill auto-trigger keyword list** | **Brittle keyword-match** | Synthetic prompts hand-built from the keyword list trigger (positive control) | (a) Natural rule-introducing prose using «policy», «guideline», «standardise», «enforce», «check», «from now on» evades the trigger. (b) Tokens «meta», «recursive», «recommend», «process» over-fire on routine work. The mechanism cannot distinguish keyword-match from semantic intent (Probe 3 PARTIAL) |
| **doc-authority-hierarchy rule §4 anti-patterns** | **Conventional, not enforced beyond principle 09 test** | Principle 09 enforces header presence on canonical doc list. §4 anti-patterns serve as review-checklist text | §4 anti-patterns themselves are prose; surfacing them at violation time depends on a reviewer cycle invoking them. No automated check fires «hey, this commit looks like #operational-doc-redefines-goal» |

**Summary of evaluation:** the AI-doc layer has **strong content** (correct demotions, explicit pointers, Authoritative-for headers, drift-prevention Mermaid) but **weak activation**. Most mechanisms are descriptive convention that depend on the AI to:

- voluntarily open files Step 0 says to open
- voluntarily read full file rather than skim
- semantically distinguish «meta» the keyword from «meta-discipline» the project concept
- cross-link CLAUDE.md taxonomies with README taxonomies the AI was never told to consult

When all of those happen, the layer works (Probe 1 revised PARTIAL, Probe 4 PASS). When any fails, the layer is silent (Probe 2 FAIL, Probe 6 FAIL).

---

## §4 Concrete improvement proposals

Each proposal lists: cost (LOW / MEDIUM / HIGH), benefit (drift modes mitigated D1/D2/D3/D4 or extension), and ranking. Ranked by benefit-per-cost ratio.

### P-1 — `UserPromptSubmit` hook injecting session-bootstrap.md content (HIGH benefit / LOW cost)

**Mechanism:** add a `UserPromptSubmit` hook in repo `.claude/settings.json` that on the **first** user prompt of a session injects `<system-reminder>` containing `.claude/session-bootstrap.md` content (or its essential excerpts: goal, methodology demotion, invariants table, reading order).

**Why it works (where Step 0 fails):** Claude Code hooks cannot **force** an AI to read a file, but they **can inject content into the system-prompt-equivalent layer** so it lands in context regardless of the AI's intent or attention. Probe 2 FAIL is precisely the gap this closes.

**Caveats:**
- Hook needs to be «first prompt of session only» to avoid duplicating context every turn (state tracking via session-id file).
- Risk of duplication with project CLAUDE.md if both files repeat the goal phrase — fix by having session-bootstrap.md contain content CLAUDE.md does not.
- Repo perspective only (this `.claude/settings.json` is repo-internal). For consumer-side: AGENTS.md already has imperative «Read this file…» — measure whether it works in a separate consumer-side audit.

**Ranking: 1.** Highest benefit-per-cost — directly closes Probe 2 FAIL and structurally improves Probe 6 (if injected content includes a link to README's 5-layer framework section).

### P-2 — CLAUDE.md links to README's 5-layer framework section (HIGH benefit / LOW cost)

**Mechanism:** add a one-line link in CLAUDE.md's «Project goal pointer» or a new «Framework structure» pointer: «Framework taxonomy: see [README.md#the-5-layer-framework](README.md#the-5-layer-framework). Do NOT confuse with the 3-layer recursive self-application enforcement table below.»

**Why it works:** Probe 6 FAIL was caused by CLAUDE.md auto-load being the *only* taxonomy source the harness-baseline AI saw. A link plus an explicit «do not confuse» note prevents synthesis-by-conflation.

**Caveats:**
- Link without «do not confuse» note is weaker — link existence does not ensure click-through. The disambiguation prose is the load-bearing part.
- Needs companion update in [.claude/rules/doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) parallel-disciplines list with same disambiguation, since that was the other source of my Phase 1 confusion.

**Ranking: 2.** Closes the largest probe failure (Probe 6 FAIL) at minimal edit cost.

### P-3 — Goal phrase verbatim-sync check (MEDIUM benefit / LOW cost)

**Mechanism:** new probe in [packages/core/audit-self/audit-ai-docs.sh](../../../packages/core/audit-self/audit-ai-docs.sh) (proposed name `D3 — goal phrase parity`) that:
1. Extracts canonical goal phrase from README.md `Why this exists` section by deterministic pattern (e.g. first sentence after «### Goal (user-facing)» that contains «AI» and ends with period).
2. Verifies the **same phrase** (exact substring match) appears in CLAUDE.md `Project goal pointer` and `.claude/session-bootstrap.md` `Goal` section.
3. FAIL if any of the three diverges.

**Why it works:** Probe 1 revised PARTIAL surfaced a real drift surface — operational docs hold a synthesis paraphrase that has no automated tie to README. This probe forces verbatim parity OR explicit acknowledgement of intentional paraphrase (e.g. via a pre-defined «paraphrase line» allowlist in the script).

**Caveats:**
- Risk: forcing verbatim sync may make README harder to edit (every wording tweak forces 3-file update). Mitigation: probe checks for a *canonical phrase* extracted from a specifically-marked block in README, not the whole sentence — README's surrounding prose can vary.
- Implementation difficulty MEDIUM — `audit-ai-docs.sh` is bash; multi-file regex with anchored extraction needs care. Could shell out to `node` for robustness.

**Ranking: 3.** Specifically targets a finding that current mechanisms cannot catch.

### P-4 — Self-reflection skill keyword expansion + scope-narrowing (MEDIUM benefit / LOW cost)

**Mechanism:** edit `.claude/skills/self-reflection/SKILL.md` trigger keyword list:

- **Add (false-negative fixes):** «policy», «guideline», «standardise», «enforce», «check», «from now on», «every X must», «going forward», «должны/обязаны».
- **Remove or scope-narrow (false-positive fixes):** instead of bare «meta», use «meta-rule» / «meta-test» / «meta-discipline»; instead of bare «recursive», use «recursive self-application» / «recursive enforcement»; instead of bare «recommend», use «I recommend introducing» / «recommend a rule».

**Why it works:** Probe 3 PARTIAL surfaced both false-negative and false-positive failure modes; the keyword set is a single dial that needs tuning in both directions.

**Caveats:**
- Keyword-match is intrinsically brittle — even after tuning, semantic intent classification will outperform keyword matching. A future improvement is to replace keyword auto-trigger with a small classifier prompt; out of scope for §4.
- Cost is LOW (edit to one file) but verification cost MEDIUM (need to run the skill mentally on a corpus of historic prompts to check both directions).

**Ranking: 4.** Targeted at extension probe (P3); lower confidence than direct-drift fixes above.

### P-5 — Goal phrase on first non-blockquote line of README (LOW benefit / LOW cost)

**Mechanism:** restructure README so the goal phrase «AI cannot silently bypass what fails CI» (or the operational synthesis if maintainers prefer that) appears as the **first non-blockquote, non-title line**, before any subordinate content.

**Why it works:** structurally puts the goal where any reader (human or AI) opening the file lands first, regardless of section navigation.

**Caveats:**
- README currently leads with «What this package gives you» (consumer-onboarding) — moving the goal there changes README's primary audience signal.
- Lower benefit than P-1/P-2 because it only helps AIs that ARE reading README. Probe 1 baseline AI never opened README at all.

**Ranking: 5.** Real but smaller improvement.

### P-6 — Visual / structural cues in shipped templates that resist drift (DEFERRED — out of scope)

The audit prompt mentions «visual / structural cues in shipped templates that resist drift better» as an example improvement. From this self-audit's evidence (repo-perspective) I cannot evaluate consumer-side template effectiveness. Surfacing as a candidate for the **separate consumer-side audit** the prompt anticipates.

**Ranking: deferred.**

---

## §5 Test-coverage opportunities

Per audit spec: which proposals can become probes in [packages/core/audit-self/audit-ai-docs.sh](../../../packages/core/audit-self/audit-ai-docs.sh) (current scope: R1-R11 + D1/D2; this audit proposes D3+ AI-doc-layer probes)? Which require LLM-judge (advisory) vs deterministic check?

| Proposal / probe | Deterministic? | Difficulty | Notes |
|---|---|---|---|
| **D3 — Goal phrase parity** (from P-3) | **Deterministic** | LOW-MEDIUM | Extract canonical phrase from README via regex anchored on `### Goal (user-facing)` heading; substring-match against CLAUDE.md `Project goal pointer` block + `.claude/session-bootstrap.md` `Goal (do not redefine)` block. Bash + grep sufficient |
| **D4 — CLAUDE.md links 5-layer framework** (from P-2) | **Deterministic** | LOW | Grep CLAUDE.md for substring `README.md#the-5-layer-framework` (or any link to that section). FAIL if absent |
| **D5 — UserPromptSubmit hook present** (from P-1) | **Deterministic** | LOW | Parse `.claude/settings.json` for `hooks.UserPromptSubmit` containing reference to `session-bootstrap.md`. FAIL if missing. Caveat: tests presence of the hook config, not its runtime effect — runtime effect is harness-side, untestable from repo |
| **D6 — Self-reflection keyword list health** (from P-4) | **Deterministic for set membership; advisory for tuning quality** | MEDIUM | Set-membership check (specific keywords present/absent) is deterministic. Tuning quality («does this list now over-trigger?») is advisory only — needs corpus replay or LLM-judge |
| **D7 — Goal phrase first-line position** (from P-5) | **Deterministic** | LOW | Check first non-blockquote, non-title line of README contains canonical phrase substring |
| **L-1 — AI's response contains canonical goal phrase when goal is asked** (audit-spec example) | **Advisory / LLM-judge** | HIGH | Requires multi-turn protocol: ask the AI «what's the project goal?», pattern-match its response. Cannot run in CI without an LLM-judge step. Could ship as advisory probe in `.audit.ts` test that runs a Claude API call |
| **L-2 — Methodology not promoted to goal in AI's framing** (audit-spec example) | **Advisory / LLM-judge** | HIGH | Same shape as L-1 but checks for absence of «recursive self-application as goal/north star» framing. Requires LLM-judge with calibrated rubric |
| **L-3 — Taxonomy fidelity in AI's response** (Probe 6-style) | **Advisory / LLM-judge** | HIGH | Ask AI to «list the framework's layers»; LLM-judge checks output against canonical 5-layer + 3-layer reference. Inherently advisory |

**Summary:** **5 deterministic probes** (D3-D7) are concretely add-able to `audit-ai-docs.sh` at LOW-MEDIUM cost. **3 LLM-judge advisory probes** (L-1, L-2, L-3) require infrastructure beyond current `audit-ai-docs.sh` scope (Claude API integration; rubric calibration). The deterministic probes catch *structural* drift; the LLM-judge probes would catch *semantic* drift but at higher cost.

**Recommendation for §6:** ship D3, D4, D5 now; defer L-1/L-2/L-3 with explicit trigger («when first consumer reports goal-phrase confusion in their AI's output» or «when D3-D7 prove insufficient over 6 months»).

---

## §6 Open decisions

For each improvement: ship-now / defer-with-trigger / out-of-scope. Each multi-choice with options.

### D-1 — `UserPromptSubmit` hook (P-1)

- **Option A:** ship hook in repo `.claude/settings.json` injecting session-bootstrap.md content on first prompt.
- **Option B:** defer — surfaced as candidate but no concrete demand; add when next concrete drift incident occurs.
- **Option C:** out of scope — Wave 6 is observation-only by mandate; ship decision belongs to a separate orchestrator session.

**Recommendation: Option C with annotation that A is the audit's preferred ship-target.** This audit's mandate is «no implementation»; orchestrator session decides actual ship.

### D-2 — CLAUDE.md links README 5-layer framework + disambiguation note (P-2)

- **Option A:** ship — small edit to CLAUDE.md, ~5 lines.
- **Option B:** defer until next CLAUDE.md edit pass — bundle with other authority-pointer changes.
- **Option C:** out of scope.

**Recommendation: Option C** (mandate again). A is preferred ship-target; cost is trivial.

### D-3 — D3-D7 deterministic probes added to `audit-ai-docs.sh` (P-3, P-2, P-1, P-4, P-5)

- **Option A:** ship all 5 D-probes in one PR; add to consumer-side `scripts/audit-ai-docs.sh` (after `install.sh:203` copy) too.
- **Option B:** ship D3 + D4 only (parity + 5-layer link) — these target observed FAILs; defer D5/D6/D7 with trigger «next AI-doc-layer drift incident».
- **Option C:** ship none; convert to documented review-checklist items only.
- **Option D:** out of scope.

**Recommendation: Option D** (mandate). B is preferred ship-target if mandate were lifted — D3 + D4 directly address the strongest probe failures (Probe 1-revised + Probe 6) without expanding scope of `audit-ai-docs.sh` more than necessary.

### D-4 — Self-reflection skill keyword tuning (P-4)

- **Option A:** ship keyword expansion + narrowing in one edit to `.claude/skills/self-reflection/SKILL.md`.
- **Option B:** corpus-replay first (run skill mentally over historic chats), only ship after evidence of net improvement.
- **Option C:** defer with trigger «next over-trigger or under-trigger incident reported».
- **Option D:** out of scope.

**Recommendation: Option D** (mandate). C is preferred ship-target — this is an extension-probe finding; weaker evidence base than direct-drift fixes.

### D-5 — Consumer-side audit (separate from this Wave 6)

- **Option A:** schedule consumer-side AI-doc audit as Wave 7 (or as a separate task) — install repo's setup.sh on a tmp project, then run cold-start probes.
- **Option B:** add a consumer-side cold-start audit as a section of an existing wave.
- **Option C:** defer indefinitely.

**Recommendation: Option A.** Repo perspective and consumer perspective have different mechanisms (AGENTS.md template vs CLAUDE.md auto-load); both need cold-audit coverage but cannot share a single session.

### D-6 — LLM-judge advisory probes (L-1, L-2, L-3)

- **Option A:** prototype L-1 only as a pilot, score on N=5 fresh sessions, evaluate before shipping the others.
- **Option B:** defer all three with trigger «D3-D7 probes prove insufficient over 6 months» OR «3 cross-doc semantic-drift incidents within 12 months».
- **Option C:** out of scope.

**Recommendation: Option B** with explicit trigger conditions. LLM-judge probes are expensive (Claude API call per probe per CI run); should not ship without strong demand evidence.

---

## §7 Compliance checks

### §1.7 forward-check — proposed improvements vs existing R/principles/SSOT

| Proposal | Forward-check note |
|---|---|
| P-1 (UserPromptSubmit hook) | Capability commit (would touch `.claude/settings.json` adding new automation). Per CLAUDE.md `What is a capability commit?` — settings hooks are configuration, not necessarily a capability commit. **Trigger reviewer call** at ship time to confirm whether `Prior-art:` consult applies. Most likely classification: «Adds new file ≥80 LOC anywhere under packages/» — does NOT apply (`.claude/settings.json` is repo config, not packages/). Probably non-capability — but ship-time decision should explicitly cite the classification |
| P-2 (CLAUDE.md disambiguation link) | Doc edit only; non-capability. No prior-art consult required. CLAUDE.md is owned by «maintainers + planning sessions» per Artifact Ownership Contract — eligible for edit |
| P-3 (D3 probe) + D4-D7 probes | Capability commit IF probes total ≥80 LOC inside `packages/core/audit-self/`. Most likely YES — would require `Prior-art:` consult against [docs/meta-factory/prior-art-evaluations.md](../../../docs/meta-factory/prior-art-evaluations.md). Specifically: search SSOT for «doc-vs-doc parity check», «AI-doc drift detection», «paraphrase drift». No SSOT entry currently matches; new entry with `Verdict: BUILD` would need to land in same commit |
| P-4 (skill keyword tuning) | Doc / skill-config edit only; non-capability |
| P-5 (README first-line restructure) | Doc edit; non-capability. README is owned by «maintainers (deliberate edit)» per Artifact Ownership Contract — must be deliberate maintainer-level decision, not a side effect of probe work |

**Backward-check — existing artefacts affected:**

- **CLAUDE.md `Project goal pointer`:** P-2 edits this section. Must preserve `Authoritative for: AI-tooling conventions, capability-commit gates, build-vs-reuse discipline, Artifact Ownership Contract` declaration. Must not redefine project goal (CLAUDE.md is NOT authoritative for goal).
- **README.md §Why this exists:** P-5 restructures positioning of goal phrase. Must preserve `Authoritative for: project goal, methodology, design invariants` declaration. Frozen for content beyond authority-bearing edits — restructure is structural so requires deliberate maintainer authorship.
- **`.claude/skills/self-reflection/SKILL.md`:** P-4 edits trigger keyword list. Must preserve skill description and overall trigger logic.
- **`packages/core/audit-self/audit-ai-docs.sh`:** P-3 + D4-D7 add probes. Must preserve `set -uo pipefail`, exit-code semantics, color-output handling. Each new probe MUST have a paired negative test in `audit-ai-docs.test.sh` per the file's own header instruction (line 35-36).
- **`packages/core/audit-self/audit-ai-docs.test.sh`:** new negative tests per added probe.
- **Consumer-side `scripts/audit-ai-docs.sh` after `install.sh:203` copy:** any changes to repo-side script propagate to consumer projects on next install — verify backward-compat for existing consumers (none currently per [EXECUTION-PLAN.md §1 «No-consumers caveat»](../../../docs/meta-factory/EXECUTION-PLAN.md), so backward-compat risk is low).

### Anti-pattern audit — which named anti-patterns from `phase-research-coverage.md §4` is this audit exposed to?

- **`#recursive-self-application-gap`** (parent category): the audit IS the response to this anti-pattern — Wave 6 explicitly tests AI-doc layer top-down where prior discipline only covered code bottom-up. Status: surfacing the gap, not exemplifying it.
- **`#recommendation-skips-own-discipline`** ([per the §4 anti-pattern list](../../../.claude/rules/phase-research-coverage.md)): the audit's §4 proposals must themselves comply with build-vs-reuse + search-coverage. Status: §7 above explicitly forward-checks each proposal. P-3 (new probes) is the most-exposed proposal — explicitly flagged for `Prior-art:` consult at ship time.
- **`#missing-authority-header`** ([doc-authority-hierarchy.md §4](../../../.claude/rules/doc-authority-hierarchy.md)): this audit deliverable file has the Authoritative-for header at top. ✓
- **`#operational-doc-redefines-goal`** ([same](../../../.claude/rules/doc-authority-hierarchy.md)): this file is in `research-patches/` (folder-level authority by `research-patches/README.md`). It does not introduce «north star» / «central thesis» / «main goal» language. Project goal is delegated upward to README. ✓
- **`#contradicting-authority-claims`** ([same](../../../.claude/rules/doc-authority-hierarchy.md)): this file claims authority only for §13.26 audit findings (date snapshot). No overlap with other docs' authority. ✓
- **`#frozen-doc-still-edited`**: not applicable — this audit makes no edits to frozen artifacts.

---

## §8 Honest meta-assessment

Did this audit itself work as intended? Did the AI conducting the audit slip into the same drift modes it was checking for? Walk through the explicit checklist of 4 ORIGIN drifts:

### D1 — Methodology-as-goal elevation

**Self-introspection across this session's output:** The Phase 1 Probe 1 answer correctly demoted methodology («Recursive self-application — the framework validating itself with its own logic — is a quality signal […], not the project's goal»). No subsequent passage in §3 / §4 / §5 / §6 promotes recursive self-application to «goal», «north star», «central thesis», or equivalent. §3 mechanism evaluation refers to recursive self-application as «meta-discipline» and «recursive enforcement» — neutral structural terms.

**Verdict: PASSED self-check on D1.**

### D2 — Taxonomy mixing (5/4/3-layer conflation)

**Self-introspection:** Phase 1 Probe 6 produced a list (A-E) that conflated 3-layer recursive enforcement with the parallel-disciplines list, and missed the 5-layer framework entirely. **This is a literal occurrence of D2 in the audit's own work.** I caught it in Phase 2 only because the Probe 6 spec explicitly forced me to read README's «5-layer framework» section.

**Counterfactual:** had Probe 6 not existed, the audit would have proceeded with the conflated A-E mental model implicit in §3 / §4 thinking. Some of P-2's wording («CLAUDE.md links to README's 5-layer framework section») only became precise *because* Probe 6 surfaced the conflation. So the audit's own probes were load-bearing for the audit's own correctness.

**Verdict: D2 occurred in this session, was caught by the audit's own probe spec, and corrected in Phase 2. The fact that catching it required an explicit probe (rather than a passive mechanism like Authoritative-for header or self-reflection skill) is itself the strongest single piece of evidence the audit produced.**

### D3 — Memory-mode answers without README

**Self-introspection:** Phase 1 Probe 1 was authored without opening README — that was the explicit constraint. The answer was reasonable because CLAUDE.md auto-load contained a paraphrase synthesis. Phase 2 surfaced that the «canonical» phrase the AI reproduced is itself a synthesis, not literal README. So D3 was satisfied **by design** in Phase 1 (the audit deliberately ran in memory-mode for §1) and surfaced as a finding rather than as a fault.

The harder question: did §3 / §4 / §5 / §6 prose drift away from README content after Phase 2 reads concluded? Spot-check: §3 «README.md `Why this exists` defensive language» row references «Quality signal, not the goal.» — verbatim from README line 44 ✓. §3 README row references line 32 + line 38 — verbatim from README ✓. §6 D-2 «CLAUDE.md is NOT authoritative for goal» — matches CLAUDE.md's own «NOT authoritative for: project goal» declaration ✓.

**Verdict: D3 deliberately invoked in §1, then explicit Phase 2 reads grounded subsequent prose. No drift from canonical text in §3 onwards.**

### D4 — Step 0 skip

**Self-introspection:** `.claude/session-bootstrap.md` was NOT read at session start before Phase 1 began. It was read in Phase 2 because Probe 1 / Probe 4 / Probe 6 required it. **The audit replicated D4 in its own first phase.** This was again by design (the audit's «harness-baseline only» mandate forbade pre-loading), but the structural fact remains: the very session that audits Step 0 effectiveness skipped Step 0.

**Verdict: D4 occurred and was both *deliberately invoked* (by audit constraint) and *surfaced as a finding* (Probe 2 FAIL). The recursive embedding — auditor commits the failure mode the audit studies — is a feature here, not a bug, but it is worth flagging that the audit's findings about Step 0 are first-person evidence, not third-person observation.**

### Extension scope (P3-P5) introspection

The audit prompt explicitly asks: «did the audit's own claims about hypothetical mechanism failures rely on observation, or were they presupposed by the prompt structure?»

- **P3 (self-reflection auto-trigger)** — the synthetic test prompt is **constructed from the keyword list itself** (positive control). The «natural rule-introducing phrasings that slip through» list is **AI-generated by me** based on what natural rule-discussion prose looks like — not from corpus replay. So P3's PARTIAL score is partly observation-grounded (positive control fires) and partly *presupposed* (negative-control is hypothetical). **Acknowledge as weak evidence in §3.**
- **P4 (Authoritative-for header drift-block)** — observation-grounded (read EXECUTION-PLAN.md, observed «north star» in corrected-historical mode). PASS score is well-supported.
- **P5 (auto-memory)** — Action 1 is observation-grounded (no trigger fired in this session), but Action 2 (post-compaction durability) is **inference from system-prompt structure**, not from harness source code. Verdict «memory placement in system-prompt block survives compaction» is a hypothesis about Claude Code internals, not a verified fact. **Acknowledge weakness explicitly: durability claim is inferred, not measured.**

**Summary of meta-assessment:** the audit caught real drift (D2 happened in the audit's own work, was surfaced by the audit's own probe spec), and the audit's findings on direct-drift probes (P1, P2, P4, P6) are observation-grounded. Findings on extension probes (P3, P5) are weaker — partly hypothesis-driven. The audit's overall claim («mechanisms are convention, not enforcement») holds because it is supported by direct probes (P1 PARTIAL, P2 FAIL, P4 PASS-conditional, P6 FAIL); extension probes (P3, P5) add color but would not on their own carry the conclusion.

The strongest single finding: **Probe 2 FAIL combined with Probe 6 FAIL together demonstrate that the harness-baseline AI working only from CLAUDE.md auto-load systematically reaches incomplete or distorted views of project structure, AND none of the existing mechanisms close the gap autonomously.** The corollary (closed by P-1 + P-2 + D3-D4 probes) is the audit's primary actionable contribution.

