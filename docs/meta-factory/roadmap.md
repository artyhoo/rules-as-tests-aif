# Meta-Factory: Roadmap реализации

> Source: PROPOSAL.md §10 (split в Phase 1.D, 2026-05-07)
> Companion: [PROPOSAL.md](PROPOSAL.md) (overview)

---

## 10. Roadmap реализации

| Фаза | Содержание | Время | Зависимости |
|---|---|---|---|
| **0** | Закрыть Phase 1 + Phase 2 из предыдущего плана (R2 drift, manifest SSOT, depcruise --init) | 3 дня | — |
| **0.5** | Documentation alignment: создать `self-application.md` (reference), добавить §15 в этот PROPOSAL, переписать §6 (invariant с момента 0), вставить эту строку в Roadmap | 1-2 дня | 0 |
| **1** | Извлечь invariant core из текущего пакета | 2 недели | Phase 0 |
| **2** | Stack Detector (Layer 1) | 1 неделя | 1 |
| **3** | Research Agent (Layer 2) с allowlist + cache | 2 недели | 1 |
| **4** | Validator (Layer 4) с rule-tester + mutation + two-AI | 3 недели | 1 |
| **5** | Synthesizer Path A (Layer 3, conservative) | 2 недели | 3, 4 |
| **6** | Installer (Layer 5) с stateful install/resume | 1 неделя | 5 |
| **7** | Lock-файлы и diff-режим | 1 неделя | 6 |
| **8** | Acceptance test: воспроизведение canonical Next 15 | 1 неделя | 6 |
| **9** | Auto-upgrade Next 15 → 16 как E2E proof | 1 неделя | 8 |
| **10** | Synthesizer Path B (Layer 3, creative) | 4 недели | 9 |
| **11** | Документация, маркетинг, релиз 1.0 | 2 недели | 10 |

> Phase 0.5 introduced 2026-05-07 после обнаружения self-application gap (см. [docs/audits/2026-05-07-self-application-gap.md](../audits/2026-05-07-self-application-gap.md), [self-application.md](self-application.md)).

**Итого до 1.0** (без Path B): ~4 месяца full-time, в одного.
**С Path B**: ~5-6 месяцев.

С AI-помощью реалистично сжать в 1.5-2 раза.
