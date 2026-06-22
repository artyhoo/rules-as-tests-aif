# plugin-packaging — DONE
- Final PR: #672
- Closed: 2026-06-22
- Summary: rules-as-tests-aif packaged as a Claude-Code-first plugin (in-repo marketplace; soft layer auto-triggering via a using-rules-as-tests SessionStart bootstrap) + an opt-in /install-enforcement seam that fetches the official install.sh for the hard layer, with an OpenCode degradation adapter and a principle-24 self-test; S0–S8 all merged to staging.

## Stage PRs (all merged to staging)
- S0–S1 + umbrella: #660 (incl. 654-kickoff contamination repair)
- S2 hook relocation (path-class audit): #664
- S3 using-rules-as-tests bootstrap + skills: #665
- S4 consumer-facing agents + principle-21 plugin-tree arm: #667
- S5 /install-enforcement fetch-and-wire seam (Option C, fetch-not-bundle): #669
- S6 principle 24 manifest-integrity + paired-negative (T15): #670
- S7 OpenCode degradation adapter: #671
- S8 README per-harness install + fetch ref → main: #672

## Residuals (surfaced, maintainer-owned — not auto-resolved)
- **Live `/plugin install` UX unproven from automation** — every stage proved the deterministic contract (env-var resolution, hook firing, seam wiring, manifest schema) offline; the genuine `/plugin marketplace add Yhooi2/rules-as-tests-aif` → `/plugin install` is a Claude-Code-session slash command and is the operator's final manual check.
- **Agent set divergence** — `install.sh` ships 6 agents; the plugin ships the 3 consumer-facing ones (`extension.json` SSOT). Deliberate curation vs. align — a maintainer call.
- **Reproducible plugin tag** — `fetch-and-wire.sh` tracks `main` (the latest framework release tag `v0.3.0` is 6 weeks stale on `install.sh`). Cutting a per-plugin release tag + pinning to it would make installs reproducible — a future release decision.
