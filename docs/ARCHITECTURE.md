# OIL-SIF Guardian — System Architecture

## 1. High-Level Architectural Overview

OIL-SIF Guardian operates as a dual-layer intelligence platform:
1. **Layer A — Case-Level Safety Intelligence**: High-speed, explainable triage of newly ingested reports to prioritize high-risk precursor incidents for immediate human review.
2. **Layer B — Organization-Level Safety Intelligence**: Cross-incident pattern discovery, semantic clustering, emerging-risk detection, and SIF Exposure Fingerprint tracking across Oil India Limited operational assets.

```text
                                OIL HSSE DATA SOURCES
                      (Web Portal, CSV/Batch Ingest, ERP/API)
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │  INGESTION & GOVERNANCE│
                             │  - Validation          │
                             │  - PII Redaction       │
                             │  - Audit Timestamping  │
                             └───────────┬────────────┘
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │   NLP PREPROCESSING    │
                             │  - Normalization       │
                             │  - Domain Term Mapping │
                             │  - Language Detection  │
                             └───────────┬────────────┘
                                         │
                                         ▼
                     ┌────────────────────────────────────────┐
                     │      SAFETY INFORMATION EXTRACTION     │
                     │  - Activity       - Exposure           │
                     │  - Hazard         - Critical Control   │
                     │  - Energy Source  - Control Failure    │
                     └───────────────────┬────────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
   ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
   │   PSIF MODEL    │          │   IOGP TAGGER   │          │  SAFETY RULES   │
   │ Calibrated ML   │          │ Multi-label 9   │          │ Deterministic   │
   │ Prioritization  │          │ Life-Saving Rls │          │ Logic Guardrails│
   └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
            │                            │                            │
            └────────────────────────────┼────────────────────────────┘
                                         ▼
                             ┌────────────────────────┐
                             │ HYBRID DECISION ENGINE │
                             │  - Calibrated Score    │
                             │  - Priority: H / L / R │
                             │  - Confidence: H / M / L│
                             └───────────┬────────────┘
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │  EXPLAINABILITY (XAI)  │
                             │  - Evidence Spans      │
                             │  - Causal Chain        │
                             │  - Triggered Signals   │
                             └───────────┬────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         ┌─────────────────────┐                   ┌─────────────────────┐
         │  HSE REVIEW QUEUE   │                   │ ORGANIZATIONAL INTEL│
         │ - Human Validation  │                   │ - Vector Retrieval  │
         │ - Triage Override   │                   │ - Exposure Fingerpr.│
         │ - Corrective Action │                   │ - Trend & Anomaly   │
         └──────────┬──────────┘                   └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ HUMAN FEEDBACK LOOP │
         │ - Governed Retrain  │
         │ - Continuous Audit  │
         └─────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Data Ingestion & Governance Layer
- **Input Validation**: Ensures mandatory fields (`report_type`, `narrative`, `site`, `timestamp`) exist and conform to schema.
- **Privacy & PII Protection**: Detects and masks personal names, phone numbers, and identifying credentials using regex and entity recognizers before storing or training.
- **Audit Immutability**: Persists original narrative as `raw_text` (read-only) and sanitized narrative as `normalized_text`.

### 2.2 Safety Information Extraction (NLP)
Extracts key structured safety tokens using a hybrid combination of custom domain token classification, regular expressions, and Oil & Gas domain dictionaries:
- `ACTIVITY`: Maintenance, Drilling, Wireline, Tank Cleaning, Hot Work, Lifting.
- `HAZARD`: Flammable gas, High pressure, Suspended load, Confined space, Rotating part.
- `ENERGY_SOURCE`: Chemical, Pressure, Gravity, Mechanical, Electrical, Thermal.
- `EXPOSURE`: Worker inside vessel, Worker under load, Worker in line of fire.
- `CONTROL`: Gas test, Permit to Work (PTW), LOTO, Guard, Exclusion zone.
- `CONTROL_FAILURE`: No gas test, Bypassed interlock, Expired permit, Missing guard.

### 2.3 Model & Rule Evaluation (Hybrid Decision Layer)
1. **PSIF Classifier**: Evaluates likelihood that the event presented credible serious-injury or fatality potential. Produces a calibrated probability `[0.0, 1.0]`.
2. **IOGP Life-Saving Rules Tagger**: Multi-label classifier evaluating relevance against the 9 IOGP rules with individual sigmoid probabilities.
3. **Deterministic Safety Rules**: Codified expert safety logic providing safety guardrails (e.g. Tank Entry + Missing Gas Test = Mandatory High PSIF Signal).
4. **Hybrid Integrator**: Combines statistical predictions with deterministic rules:
   - If deterministic critical rule fires → Priority elevated to `HIGH` regardless of raw ML score.
   - If ML probability > 0.70 → Priority `HIGH`.
   - If ML probability between 0.40 and 0.70 → Priority `REVIEW`.
   - If ML probability < 0.40 → Priority `LOW`.

### 2.4 Explainability Subsystem
Generates human-interpretable reasoning rather than opaque numerical scores:
- **Evidence Spans**: Exact character offsets in the narrative highlighting critical risk statements.
- **Causal Reasoning Flow**: Dynamic text explaining the transition from Hazard + Energy to Control Failure and Consequence.
- **Triggered Signals**: Explicit itemization of triggered deterministic rules and high-weight model factors.

### 2.5 Human-in-the-Loop Review & Corrective Actions
- **Review Queue**: HSE officers can inspect prioritized reports, view evidence, and confirm, modify, or reject AI triages.
- **Corrective Action Tracking**: Direct assignment of corrective actions with owner, target due date, and verification status.
- **Feedback Store**: Human overrides are logged for active learning and governed retraining cycles.

### 2.6 Organizational Intelligence Engine
- **Vector Embeddings (pgvector)**: Computes dense semantic embeddings for narrative retrieval of similar historical incidents.
- **SIF Exposure Fingerprint**: Generates a standardized tuple `(Activity, Hazard, Energy, Exposure, Control Failure, Consequence)` enabling cross-site pattern discovery independent of wording.
- **Trend Detection**: Rolling z-score and rate-of-change monitors to alert on precursor spikes (e.g. rising Energy Isolation failures in drilling operations).
