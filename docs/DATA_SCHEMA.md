# OIL-SIF Guardian — Canonical Data Schema & Database Design

## 1. Canonical Safety Event Schema

Every safety report ingested into OIL-SIF Guardian is standardized into the Canonical Safety Event JSON representation. This schema serves as the single source of truth contract across ingestion, ML models, APIs, and the UI.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CanonicalSafetyEvent",
  "type": "object",
  "required": [
    "report_id",
    "report_timestamp",
    "report_type",
    "site",
    "raw_text",
    "normalized_text"
  ],
  "properties": {
    "report_id": {
      "type": "string",
      "description": "Unique immutable identifier for the safety report",
      "example": "OIL-2026-REP-001042"
    },
    "report_timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO-8601 timestamp when the incident/precursor occurred"
    },
    "report_type": {
      "type": "string",
      "enum": ["near_miss", "unsafe_act", "unsafe_condition", "incident", "hazard_observation"]
    },
    "site": {
      "type": "string",
      "example": "Duliajan Production Installation"
    },
    "location": {
      "type": "string",
      "example": "Gas Separator Station #4"
    },
    "department": {
      "type": "string",
      "example": "Mechanical Maintenance"
    },
    "activity": {
      "type": "string",
      "example": "Separator Vessel Inspection"
    },
    "equipment": {
      "type": "array",
      "items": { "type": "string" },
      "example": ["Gas Separator V-102", "Isolation Valve XV-401"]
    },
    "reporter_role": {
      "type": "string",
      "example": "Lead Operator"
    },
    "raw_text": {
      "type": "string",
      "description": "Unmodified original incident narrative (IMMUTABLE)"
    },
    "normalized_text": {
      "type": "string",
      "description": "Cleaned, standardized, PII-redacted incident narrative"
    },
    "entities": {
      "type": "object",
      "properties": {
        "hazards": { "type": "array", "items": { "type": "string" } },
        "energy_sources": { "type": "array", "items": { "type": "string" } },
        "exposures": { "type": "array", "items": { "type": "string" } },
        "controls": { "type": "array", "items": { "type": "string" } },
        "control_failures": { "type": "array", "items": { "type": "string" } },
        "consequences": { "type": "array", "items": { "type": "string" } }
      }
    },
    "psif": {
      "type": "object",
      "properties": {
        "probability": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
        "priority": { "type": "string", "enum": ["HIGH", "LOW", "REVIEW"] },
        "confidence": { "type": "string", "enum": ["HIGH", "MEDIUM", "LOW"] },
        "calibration_factor": { "type": "number" }
      }
    },
    "life_saving_rules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rule_name": { "type": "string" },
          "probability": { "type": "number" },
          "is_primary": { "type": "boolean" }
        }
      }
    },
    "evidence_spans": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "start_char": { "type": "integer" },
          "end_char": { "type": "integer" },
          "category": { "type": "string" }
        }
      }
    },
    "safety_reasoning": {
      "type": "array",
      "items": { "type": "string" }
    },
    "triggered_rules": {
      "type": "array",
      "items": { "type": "string" }
    },
    "exposure_fingerprint": {
      "type": "string",
      "example": "MAINTENANCE|CHEMICAL_ENERGY|CONFINED_SPACE|NO_GAS_TEST|FATALITY_POTENTIAL"
    },
    "review": {
      "type": "object",
      "properties": {
        "status": { "type": "string", "enum": ["PENDING", "CONFIRMED", "MODIFIED", "REJECTED"] },
        "reviewer_id": { "type": ["string", "null"] },
        "reviewer_notes": { "type": ["string", "null"] },
        "final_psif_label": { "type": ["string", "null"] },
        "reviewed_at": { "type": ["string", "null"], "format": "date-time" }
      }
    },
    "corrective_action": {
      "type": "object",
      "properties": {
        "action_id": { "type": ["string", "null"] },
        "action_title": { "type": ["string", "null"] },
        "assigned_to": { "type": ["string", "null"] },
        "due_date": { "type": ["string", "null"], "format": "date" },
        "status": { "type": "string", "enum": ["NOT_ASSIGNED", "OPEN", "IN_PROGRESS", "VERIFIED_CLOSED"] }
      }
    },
    "model_version": {
      "type": "string",
      "example": "psif-v1.0"
    }
  }
}
```

---

## 2. Relational Database Schema (SQLAlchemy / PostgreSQL + SQLite)

```text
┌─────────────────────────────────────────────────────────────┐
│                           reports                           │
├─────────────────────────────────────────────────────────────┤
│ id (PK, String/UUID)                                        │
│ report_id (Unique String, Indexed)                          │
│ report_timestamp (DateTime, Indexed)                        │
│ report_type (String)                                        │
│ site (String, Indexed)                                      │
│ location (String)                                           │
│ department (String)                                         │
│ activity (String)                                           │
│ raw_text (Text, Immutable)                                  │
│ normalized_text (Text)                                      │
│ created_at (DateTime)                                       │
│ updated_at (DateTime)                                       │
└──────────────┬───────────────────────────────┬──────────────┘
               │ 1:1                           │ 1:1
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│         predictions          │ │          reviews           │
├──────────────────────────────┤ ├────────────────────────────┤
│ id (PK, String/UUID)         │ │ id (PK, String/UUID)       │
│ report_id (FK -> reports.id) │ │ report_id (FK -> reports.id│
│ psif_probability (Float)     │ │ status (String: PENDING...)│
│ priority (String: HIGH/L/R)  │ │ reviewer_id (String)       │
│ confidence (String)          │ │ reviewer_notes (Text)      │
│ model_version (String)       │ │ final_psif_label (String)  │
│ reasoning_summary (Text)     │ │ reviewed_at (DateTime)     │
│ created_at (DateTime)        │ └────────────────────────────┘
└──────────────┬───────────────┘
               │ 1:M
               ├───────────────────────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      iogp_predictions        │ │     corrective_actions     │
├──────────────────────────────┤ ├────────────────────────────┤
│ id (PK, String/UUID)         │ │ id (PK, String/UUID)       │
│ prediction_id (FK)           │ │ report_id (FK -> reports.id│
│ rule_name (String)           │ │ title (String)             │
│ probability (Float)          │ │ assigned_to (String)       │
│ is_primary (Boolean)         │ │ due_date (Date)            │
└──────────────────────────────┘ │ status (String)            │
                                 │ closure_notes (Text)       │
                                 │ closed_at (DateTime)       │
                                 └────────────────────────────┘
```
