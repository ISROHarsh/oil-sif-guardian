# OIL-SIF Guardian — Annotation Guidelines & Quality Protocol

## 1. Objective of Gold Annotation

The primary goal of annotation is to establish an unassailable **Gold Dataset v1** for benchmarking and supervised training. Rather than blindly generating synthetic data or scraping noisy labels, human safety experts and HSE annotators label reports following rigorous criteria.

---

## 2. Core Labeling Criteria

### 2.1 PSIF Potential (Binary + Review)
- **PSIF = 1 (YES)**: The event involved high hazardous energy OR an entry into a life-threatening environment, AND critical controls were either absent, failed, or compromised, such that only fortunate timing, worker evasion, or chance prevented a fatal or permanently disabling outcome.
  - *Example*: Worker entered a separator vessel where hydrocarbons were previously stored without gas test or ventilation.
  - *Example*: Slings snapped on a 3-ton casing pipe while workers were rigging in the drop zone.
- **PSIF = 0 (NO)**: The event involved low energy, robust remaining barrier defenses, or trivial injury potential.
  - *Example*: Worker tripped on gravel walking between portacabins, sustaining a scraped knee.
  - *Example*: Office printer cord was slightly frayed, replaced immediately with power turned off.
- **NEEDS_REVIEW**: Narrative is ambiguous or key operational context is missing (e.g. pressure rating or exact worker position not stated).

### 2.2 IOGP Life-Saving Rules (Multi-Label)
A report can exhibit zero, one, or multiple rules simultaneously:
- A crane lifting tubulars over an unbarricaded gangway triggers:
  1. `Safe Mechanical Lifting`
  2. `Line of Fire`
  3. `Work Authorization` (if lift plan missing)

### 2.3 Evidence Span Labeling
Annotators must highlight the minimum necessary textual snippet proving:
- The hazard / energy presence.
- The control compromise or failure.
- The worker exposure position.

---

## 3. Dual-Annotation & Adjudication Protocol

```text
               UNLABELLED NARRATIVE
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   ANNOTATOR A                   ANNOTATOR B
   (HSE Analyst)                 (Field Safety Eng)
         │                             │
         └──────────────┬──────────────┘
                        ▼
                AGREEMENT CHECK
            (Cohen's Kappa / Fleiss' Kappa)
            ┌───────────┴───────────┐
            ▼                       ▼
      [AGREED]                [DISAGREED]
      Direct to Gold          Expert Adjudication Committee
      Dataset v1              (Lead HSE Specialist)
                                    │
                                    ▼
                              Adjudication Log
                                    │
                                    ▼
                              Gold Dataset v1
```

### Quality Metrics Targets
- **Cohen's Kappa (Inter-annotator agreement on PSIF)**: Target $\kappa \ge 0.75$.
- **Fleiss' Kappa (Multi-label IOGP rules)**: Target $\kappa \ge 0.70$.
- **Adjudication Ratio**: Tracked and capped at $< 15\%$ of records.
