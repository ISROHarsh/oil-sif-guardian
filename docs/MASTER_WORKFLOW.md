# OIL SIF Guardian — Master Recommended Workflow

## Executive Purpose & Identity

**OIL-SIF Guardian** is an explainable, human-in-the-loop SIF (Serious Injury and Fatality) precursor intelligence platform for Oil India Limited (OIL). It converts unstructured HSSE narratives into structured hazard, energy, exposure, and control-failure intelligence; prioritizes PSIF/SIF-potential reports; maps them to IOGP Life-Saving Rules; surfaces similar and recurring precursor patterns; and routes high-priority cases to HSE personnel for validation and corrective action.

> **Core Axiom:** `AI recommends. Evidence explains. HSE decides. Feedback improves the system.`

---

## 1. The Core Processing Chain

```text
OIL HSSE REPORT
      ↓
DATA VALIDATION & GOVERNANCE (PII Masking, Least-Privilege)
      ↓
TEXT NORMALIZATION & TERMINOLOGY MAPPING
      ↓
SAFETY INFORMATION EXTRACTION
(Activity, Hazard, Energy, Exposure, Control, Control Failure, Consequence)
      ↓
┌─────────────────┬─────────────────┬──────────────────┐
│   PSIF MODEL    │   IOGP TAGGER   │   SAFETY RULES   │
│ (Prioritization)│   (Multi-label) │ (Deterministic)  │
└────────┬────────┴────────┬────────┴─────────┬────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           ▼
                CALIBRATED HYBRID DECISION
                (HIGH / LOW / REVIEW priority)
                           ↓
                EXPLAINABILITY & EVIDENCE
                (Spans, Causal chain, Reasoning)
                           ↓
                   HSE REVIEW QUEUE
                (Human-in-the-Loop Override)
                           ↓
                   CORRECTIVE ACTION
                (Assign, Track, Verify)
                           ↓
           ORGANIZATIONAL PRECURSOR INTELLIGENCE
           (Similarity, Fingerprints, Trends, Clusters)
                           ↓
                    HUMAN FEEDBACK
                           ↓
                GOVERNED MODEL IMPROVEMENT
```

---

## 2. Two Layers of Intelligence

### Layer A — Case-Level Safety Intelligence
Answers: *"How should this individual report be triaged right now?"*
- NLP Extraction of safety entities
- PSIF / SIF-potential probability & priority
- IOGP Life-Saving Rule multi-label tagging
- Deterministic safety rules
- Calibrated confidence scoring
- Evidence-backed explanation & span extraction

### Layer B — Organization-Level Safety Intelligence
Answers: *"What is repeatedly going wrong across OIL assets?"*
- Semantic similarity & historical report retrieval
- SIF Exposure Fingerprints
- Precursor clustering & pattern discovery
- Trend analysis & emerging-risk spike detection
- Knowledge graph relationships
- Corrective-action recurrence tracking

---

## 3. The Safety Reasoning Model

The core innovation is transforming unstructured text into an explicit safety reasoning chain:

```text
EVENT → ACTIVITY → HAZARD → HAZARDOUS ENERGY → WORKER EXPOSURE
      → CRITICAL CONTROL → CONTROL FAILURE → CREDIBLE CONSEQUENCE
      → PSIF POTENTIAL → IOGP LIFE-SAVING RULES
```

Rather than shallow keyword matching (`"dangerous words" → SIF`), the platform represents the operational hazard mechanism:
- **Activity**: Maintenance
- **Equipment**: Separator vessel
- **Hazard**: Flammable & toxic atmosphere
- **Energy**: Chemical (hydrocarbon gas / H2S)
- **Exposure**: Worker inside confined vessel
- **Control Failure**: Gas test unrecorded, entry permit expired, attendant absent
- **Consequence**: Asphyxiation / Fatal toxicity
- **PSIF Priority**: HIGH
- **Rules**: Confined Space, Work Authorization

---

## 4. Phase-by-Phase Development Road

- **Phase 0**: Domain Definition, Safety Taxonomy, Canonical Event Schema & Project Foundation
- **Phase 1**: Data Acquisition, Validation, Normalization & PII Handling
- **Phase 2**: Annotation Guidelines, Seed Dataset & Gold Dataset v1
- **Phase 3**: Rule & TF-IDF Baseline Modeling
- **Phase 4**: Safety Information Extraction (NER + Domain Dictionaries)
- **Phase 5**: Core Transformer PSIF Prioritization Model & Probability Calibration
- **Phase 6**: IOGP Life-Saving Rules Multi-Label Classifier
- **Phase 7**: Deterministic Safety Rule Engine
- **Phase 8**: Calibrated Hybrid Decision Engine
- **Phase 9**: Evidence-Based Explainability & Span Highlighting
- **Phase 10**: HSE Human-in-the-Loop Review & Audit Logging
- **Phase 11**: Production Backend API (FastAPI)
- **Phase 12**: Semantic Similarity & Vector Retrieval (pgvector)
- **Phase 13**: Trend Detection & Cluster Intelligence
- **Phase 14**: SIF Exposure Fingerprint & Knowledge Graph
- **Phase 15**: HSSE Command Center Frontend UI
- **Phase 16**: MLOps, Versioning & Model Governance
- **Phase 17**: Security, RBAC & Privacy Hardening
- **Phase 18**: Staging Validation, Golden Regression Suite & Release

---

## 5. Explicit Project Boundaries & Safe Claims

### What the Platform IS:
- A decision-support prioritization tool for HSSE officers.
- An evidence-backed triage system that highlights why an incident possesses SIF potential.
- A precursor tracking engine discovering recurring control failures.

### What the Platform IS NOT:
- Not an autonomous fatality predictor.
- Not an autonomous disciplinary or shutdown authority.
- Not an autonomous legal compliance certifier.
