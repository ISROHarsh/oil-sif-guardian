# OIL-SIF Guardian — Functional & Technical Requirements

## 1. Functional Requirements (FR)

- **FR-01 (Report Ingestion)**: System must accept unstructured free-text safety narratives alongside optional operational metadata (site, location, equipment, activity).
- **FR-02 (Safety Information Extraction)**: System must extract key entities: Activity, Hazard, Hazardous Energy, Worker Exposure, Critical Controls, and Control Failures.
- **FR-03 (PSIF Prioritization)**: System must calculate a calibrated probability score [0.0 - 1.0] and assign operational priority (`HIGH`, `LOW`, `REVIEW`).
- **FR-04 (IOGP Life-Saving Rules Tagging)**: System must perform multi-label classification across the 9 IOGP rules with individual confidence probabilities.
- **FR-05 (Deterministic Safety Rules)**: System must enforce deterministic guardrails for fatal precursor patterns that trigger immediate HIGH prioritization.
- **FR-06 (Evidence-Based Explainability)**: System must identify and highlight exact text spans responsible for triage and generate a human-readable causal explanation.
- **FR-07 (HSE Human Review Workflow)**: System must provide an interface for HSE officers to validate, override, add notes, and sign off on classifications.
- **FR-08 (Corrective Action Management)**: System must allow creating, assigning, tracking, and verifying corrective actions tied to prioritized reports.
- **FR-09 (Organizational Precursor Analytics)**: System must aggregate precursor incidents into time-series trends, spike alarms, and SIF Exposure Fingerprints.

---

## 2. Non-Functional Requirements (NFR)

- **NFR-01 (Latency)**: API triage response time must be $< 1.5$ seconds for single narrative ingestion on CPU.
- **NFR-02 (Availability & Graceful Degradation)**: If ML inference fails or is offline, system must store the report and automatically mark it `PRIORITY: REVIEW` with a system alert.
- **NFR-03 (Data Integrity)**: Raw narratives must be immutable; all updates and review actions must generate audit log entries.
- **NFR-04 (Security & Compliance)**: Zero PII leakage in analytics; RBAC enforced on sensitive triage actions.
