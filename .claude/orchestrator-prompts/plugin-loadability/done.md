# plugin-loadability — DONE
- Final PR: #794
- Closed: 2026-06-28
- Summary: shipped CC plugin now loads (`claude plugin tag --dry-run plugin` exit 0 on staging); principle 24 strengthened to catch both defects (real js-yaml frontmatter parse + V9 manifest-location assertion, paired-negative kept); P1 manifest relocated to plugin/.claude-plugin/, P2 frontmatter quoted (block scalar). Built autonomously via aif-handoff (task a5e4fae6), harvested via host-push. Follow-on CI fixes folded in same PR: js-yaml declared in both root + packages/core standalone locks; install byte-identical baselines regenerated for the P2-changed agent file.
