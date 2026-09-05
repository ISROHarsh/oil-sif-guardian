# OIL-SIF Guardian — REST API Specification & Contract

Version: `v1.0.0`
Base Path: `/api/v1`

---

## 1. Summary of Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | System liveness & readiness check |
| `POST` | `/reports` | Ingest a new safety report and execute AI triage |
| `GET` | `/reports` | List safety reports with filtering & pagination |
| `GET` | `/reports/{report_id}` | Retrieve comprehensive report details & predictions |
| `POST` | `/reports/{report_id}/review` | Submit human HSE review decision & override |
| `POST` | `/reports/{report_id}/actions` | Create or update a corrective action |
| `GET` | `/analytics/overview` | Executive metrics (total reports, PSIF rate, pending) |
| `GET` | `/analytics/trends` | Time-series precursor trends and spike alerts |
| `GET` | `/analytics/clusters` | Precursor clusters and SIF Exposure Fingerprints |

---

## 2. Endpoint Specifications

### 2.1 System Health
`GET /api/v1/health`

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "model_version": "psif-v1.0",
  "timestamp": "2026-09-05T17:30:00Z"
}
```

---

### 2.2 Ingest & Triage Report
`POST /api/v1/reports`

**Request Body**:
```json
{
  "report_type": "near_miss",
  "site": "Duliajan Production Installation",
  "location": "Separator Station #4",
  "department": "Mechanical Maintenance",
  "activity": "Separator Vessel Inspection",
  "equipment": ["Gas Separator V-102"],
  "reporter_role": "Lead Operator",
  "narrative": "During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside."
}
```

**Response `201 Created`**:
```json
{
  "report_id": "OIL-2026-REP-001042",
  "report_timestamp": "2026-09-05T17:30:00Z",
  "site": "Duliajan Production Installation",
  "location": "Separator Station #4",
  "raw_text": "During maintenance...",
  "normalized_text": "During maintenance...",
  "psif": {
    "probability": 0.94,
    "priority": "HIGH",
    "confidence": "HIGH"
  },
  "life_saving_rules": [
    {
      "rule_name": "Confined Space",
      "probability": 0.96,
      "is_primary": true
    },
    {
      "rule_name": "Work Authorization",
      "probability": 0.88,
      "is_primary": false
    }
  ],
  "entities": {
    "hazards": ["Hazardous / Toxic Atmosphere", "Confined Space Entry"],
    "energy_sources": ["Chemical", "Atmospheric"],
    "exposures": ["Worker entered tank interior"],
    "controls": ["Gas test", "Entry permit", "Safety attendant"],
    "control_failures": ["No gas test recorded", "Expired entry permit", "No attendant outside"]
  },
  "evidence_spans": [
    { "text": "entered the tank", "start_char": 34, "end_char": 50, "category": "EXPOSURE" },
    { "text": "Gas testing was not recorded", "start_char": 81, "end_char": 109, "category": "CONTROL_FAILURE" },
    { "text": "entry permit had expired", "start_char": 115, "end_char": 139, "category": "CONTROL_FAILURE" },
    { "text": "no attendant was positioned outside", "start_char": 149, "end_char": 184, "category": "CONTROL_FAILURE" }
  ],
  "triggered_rules": [
    "RULE-CS-001: Confined space entry with absent atmospheric gas verification",
    "RULE-WA-002: Active hazardous work performed under expired permit to work"
  ],
  "safety_reasoning": [
    "Worker entered a confined vessel with historical hydrocarbon service.",
    "Critical atmospheric testing was not recorded prior to or during entry.",
    "Statutory entry permit had expired, indicating absence of current risk assessment.",
    "Attendant barrier was absent, preventing emergency rescue signaling.",
    "Combination creates an unmitigated credible pathway to fatal asphyxiation."
  ],
  "review": {
    "status": "PENDING",
    "reviewer_id": null,
    "final_psif_label": null
  },
  "model_version": "psif-v1.0"
}
```

---

### 2.3 Submit HSE Human Review
`POST /api/v1/reports/{report_id}/review`

**Request Body**:
```json
{
  "reviewer_id": "HSE-OFFICER-742",
  "status": "CONFIRMED",
  "final_psif_label": "HIGH",
  "reviewer_notes": "Concur with high PSIF triage. Contractor work suspended immediately pending tool-box investigation."
}
```

**Response `200 OK`**:
```json
{
  "report_id": "OIL-2026-REP-001042",
  "review": {
    "status": "CONFIRMED",
    "reviewer_id": "HSE-OFFICER-742",
    "final_psif_label": "HIGH",
    "reviewer_notes": "Concur with high PSIF triage...",
    "reviewed_at": "2026-09-05T17:35:00Z"
  }
}
```

---

### 2.4 Create / Update Corrective Action
`POST /api/v1/reports/{report_id}/actions`

**Request Body**:
```json
{
  "title": "Mandatory contractor permit verification and confined space stand-down",
  "assigned_to": "Field Superintendent (Duliajan Station 4)",
  "due_date": "2026-09-12",
  "status": "OPEN",
  "notes": "Perform 100% audit of atmospheric gas testers and retraining on attendant duties."
}
```

**Response `200 OK`**:
```json
{
  "action_id": "ACT-2026-00089",
  "report_id": "OIL-2026-REP-001042",
  "title": "Mandatory contractor permit verification...",
  "assigned_to": "Field Superintendent (Duliajan Station 4)",
  "due_date": "2026-09-12",
  "status": "OPEN",
  "created_at": "2026-09-05T17:36:00Z"
}
```
