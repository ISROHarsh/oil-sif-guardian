# OIL-SIF Guardian — Security, Privacy & RBAC Policy

## 1. Data Privacy & Confidentiality Protection

### 1.1 Zero Real OIL Production Data in Git
Under no circumstances may operational oilfield logs containing proprietary well coordinates, confidential reservoir data, or worker identifiers be committed to public or team-shared Git repositories.

### 1.2 Automated PII Redaction Pipeline
Before raw text is processed by embedding pipelines or displayed in wide analytics dashboards, it passes through the PII Redaction filter:
- Worker names mapped to roles (e.g. `John Doe` → `[OPERATOR]`).
- Phone numbers, badges, and Aadhaar/identification numbers sanitized via regex pattern matching.
- Original text is sealed in the write-once `raw_text` field with access restricted exclusively to authenticated HSE Lead Investigators.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Capability / Action | Field Reporter | HSE Reviewer | HSE Manager | System Admin |
|---|:---:|:---:|:---:|:---:|
| Ingest new safety report | ✅ | ✅ | ✅ | ✅ |
| View anonymized triage results | ✅ | ✅ | ✅ | ✅ |
| Validate/Override PSIF priority | ❌ | ✅ | ✅ | ❌ |
| Assign/close corrective actions | ❌ | ✅ | ✅ | ❌ |
| View unredacted raw text | ❌ | ✅ | ✅ | ❌ |
| View enterprise analytics & trends | ❌ | ✅ | ✅ | ✅ |
| Retrain / calibrate model versions | ❌ | ❌ | ❌ | ✅ |
| View system audit logs | ❌ | ❌ | ✅ | ✅ |
