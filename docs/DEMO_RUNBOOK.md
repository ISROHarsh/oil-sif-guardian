# OIL-SIF Guardian — Golden Demo Runbook

> **Demonstration Goal:** Prove the complete end-to-end processing chain using the canonical industrial test scenario from Section 78 of the Master Workflow.

---

## 1. Quick Launch

### Option A: Local Full-Stack (Zero-Dependency)
```bash
# Terminal 1: Backend
cd backend
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm.cmd install
npm.cmd run dev
```

### Option B: Containerized Launch
```bash
docker compose up --build
```
Access points:
- **Command Center Dashboard**: `http://localhost:5173`
- **FastAPI Interactive Swagger Docs**: `http://localhost:8000/docs`

---

## 2. Canonical Scenario Walkthrough

### Scenario Narrative
> *"During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside."*

### Step-by-Step Demonstration Actions:
1. **Navigate to Report Ingestion**:
   - Site: `Duliajan Gas Processing Station`
   - Location: `Vessel Inspection Bay`
   - Activity: `Internal Tank Inspection`
   - Paste narrative into the text box and click **Analyze Incident Precursor**.
2. **Examine AI Explainability Results**:
   - Verify PSIF Priority: **HIGH** (Calibrated probability > 0.90).
   - Verify IOGP Badges: **Confined Space**, **Work Authorization**.
   - Inspect Evidence Spans: Notice highlighted tokens:
     - `entered the tank` (Exposure)
     - `Gas testing was not recorded` (Control Failure)
     - `entry permit had expired` (Control Failure)
     - `no attendant was positioned outside` (Control Failure)
   - Inspect Causal Reasoning Chain.
3. **Engage Human-in-the-Loop Review**:
   - Switch to **HSE Review Queue**.
   - Open the newly ingested report.
   - Click **Confirm High SIF Potential**.
   - Input reviewer notes: *"Confirmed hazardous confined space breach. Emergency stand-down initiated."*
4. **Assign Corrective Action**:
   - Assign to: `Duliajan Operations Superintendent`.
   - Set Due Date: `Next Friday`.
   - Action Title: *"Immediate audit of site gas monitors and permit renewal."*
   - Verify status transitions to `OPEN`.
5. **View Executive Precursor Trends**:
   - Switch to **Precursor Analytics**.
   - Observe the spike in `Confined Space` and `Energy Isolation` precursors.
   - View the SIF Exposure Fingerprint card.

---

## 3. Automated 5-Stage Golden Platform Verification

To instantaneously demonstrate total platform integrity across all 5 operational tiers (API & Security Headers, RBAC & Redaction, Rule 2 Zero-Miss Benchmark, MLOps Drift & Model Card, and Production Asset Bundles):

```bash
.venv\Scripts\python scripts/verify_platform.py
```
Expected outcome: All 5 stages pass with `100.0% High-PSIF Safety Recall` and zero false negatives under 0.5s.
