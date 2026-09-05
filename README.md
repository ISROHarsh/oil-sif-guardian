# OIL-SIF Guardian 🛡️
### Explainable, Human-in-the-Loop SIF Precursor Intelligence Platform

[![CI Pipeline](https://github.com/oil-india/oil-sif-guardian/actions/workflows/ci.yml/badge.svg)](https://github.com/oil-india/oil-sif-guardian/actions)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://react.dev)
[![IOGP 9 Life-Saving Rules](https://img.shields.io/badge/IOGP-Life--Saving_Rules-E65100.svg)](https://www.iogp.org/life-savingrules/)

> **Core Axiom:** `AI recommends. Evidence explains. HSE decides. Feedback improves the system.`

---

## 📌 Executive Summary

In upstream and midstream oil & gas operations, thousands of incident, near-miss, and hazard observation reports are logged each year. Critical **Serious Injury and Fatality (SIF)** precursors are frequently buried in massive narrative volumes—often misclassified as low-severity near misses until a catastrophic accident occurs.

**OIL-SIF Guardian** is an enterprise-grade, human-in-the-loop safety intelligence platform designed for **Oil India Limited (OIL)**. It transforms unstructured HSSE narratives into a structured chain of:

$$\text{Activity} \rightarrow \text{Hazard} \rightarrow \text{Hazardous Energy} \rightarrow \text{Worker Exposure} \rightarrow \text{Critical Control} \rightarrow \text{Control Failure} \rightarrow \text{Credible Consequence}$$

The platform prioritizes **Potential SIF (PSIF)** cases, maps them to **IOGP Life-Saving Rules**, provides **verifiable evidence highlights**, supports **HSE review and corrective action dispatch**, and uncovers **recurring precursor trends** across installations.

---

## 🏛️ Dual-Layer Intelligence Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│              LAYER A: CASE-LEVEL SAFETY INTELLIGENCE                    │
│                                                                         │
│  Unstructured HSSE Narrative                                            │
│        │                                                                │
│        ▼                                                                │
│  [Entity Extraction] ──> Hazard, Energy, Exposure, Controls, Failures   │
│        │                                                                │
│        ▼                                                                │
│  [Hybrid Decision Engine]                                               │
│    ├── Transformer PSIF Prioritizer (Probability & Calibration)         │
│    ├── IOGP 9 Life-Saving Rules Tagger (Multi-Label)                     │
│    └── Deterministic Safety Guardrails (Zero-Tolerance Rules)           │
│        │                                                                │
│        ▼                                                                │
│  [Explainability (XAI)] ──> Text Evidence Spans & Causal Logic          │
│        │                                                                │
│        ▼                                                                │
│  [HSE Review Queue] ──> Confirm / Modify / Reject + Corrective Actions  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          LAYER B: ORGANIZATIONAL PRECURSOR INTELLIGENCE                 │
│                                                                         │
│  ├── Semantic Vector Retrieval (Find historical similar precursor cases)│
│  ├── SIF Exposure Fingerprint (Normalized cross-asset hazard tuples)    │
│  ├── Emerging-Risk & Trend Spike Detection (Early warning alarms)       │
│  └── Governed Human Feedback Loop (Active learning & audit trace)       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.11+ (or Windows `py`)
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 1. Clone & Setup Environment
```bash
git clone https://github.com/oil-india/oil-sif-guardian.git
cd oil-sif-guardian
cp .env.example .env
```

### 2. Run Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs available at: `http://localhost:8000/docs`*

### 3. Run Frontend (React + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
*Command Center UI available at: `http://localhost:5173`*

### 4. Or Run Everything with Docker Compose
```bash
docker compose up --build
```

---

## 🧪 The Canonical Golden Scenario Test

Submit this canonical scenario from [docs/DEMO_RUNBOOK.md](file:///c:/Users/aritr/OneDrive/Documents/SIH_Project_26165/docs/DEMO_RUNBOOK.md):
> *"During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside."*

### Verified Platform Response:
- **PSIF Priority**: `HIGH` (Calibrated probability > 0.90)
- **IOGP Rules**: `Confined Space`, `Work Authorization`
- **Extracted Control Failures**: `No gas test recorded`, `Expired permit`, `No attendant`
- **Evidence Spans**: Highlights exact risk phrases in the incident text
- **HSE Action**: Routes immediately to priority queue for safety officer sign-off and corrective action assignment.

---

## 📂 Repository Layout

```text
oil-sif-guardian/
├── docs/                # Single source of truth specifications
│   ├── MASTER_WORKFLOW.md
│   ├── ENGINEERING_RULES.md
│   ├── ARCHITECTURE.md
│   ├── DATA_SCHEMA.md
│   ├── SAFETY_ONTOLOGY.md
│   ├── ANNOTATION_GUIDELINES.md
│   ├── API_CONTRACT.md
│   ├── MODEL_CARD.md
│   ├── DEMO_RUNBOOK.md
│   └── SECURITY.md
├── backend/             # FastAPI backend application
│   ├── app/             # Routers, schemas, models, services
│   └── tests/           # Pytest API & unit suites
├── frontend/            # React + TypeScript + Vite Command Center
├── rules/               # IOGP taxonomy & deterministic safety rules
├── tests/               # Golden scenario test fixtures & regression suite
├── data/                # Data dictionaries, sample records & labels
└── docker-compose.yml   # Multi-service containerization
```

---

## ⚖️ Governance & Safety Boundaries

1. **Decision Support Only**: The AI prioritizes and explains; qualified Oil India Limited safety personnel make all final operational decisions.
2. **Zero Confidential Data in Git**: Operational records and credentials remain protected under the strict privacy policies defined in [docs/SECURITY.md](file:///c:/Users/aritr/OneDrive/Documents/SIH_Project_26165/docs/SECURITY.md).
3. **Transparent Traceability**: Every triage action produces an immutable audit record logging the model version, calibration threshold, evidence spans, and reviewer sign-off.
