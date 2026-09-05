# OIL-SIF Guardian — Data Quality & Governance Report

## 1. Overview of Data Quality Framework

Safety reports in upstream and midstream operations vary dramatically in quality. Some reports contain extensive detail regarding isolation steps, gas monitoring readings, and barrier status; others consist of terse five-word entries (e.g. *"valve leaking on pad"*).

The **OIL-SIF Guardian Data Quality Framework** enforces automated measurement and scoring for every ingested report to:
1. Prevent garbage-in / garbage-out failures in machine learning prioritization.
2. Flag low-information reports for HSE operational enrichment.
3. Quantify narrative density and hazard information completeness.

---

## 2. Automated Quality Score Formulation

The automated **Data Quality Score ($Q$)** ranges from **0 to 100** points and is computed as a weighted sum of four dimension scores:

$$Q = 0.35 \times Q_{\text{narrative}} + 0.25 \times Q_{\text{metadata}} + 0.25 \times Q_{\text{hazard}} + 0.15 \times Q_{\text{control}}$$

### Dimension Breakdown:
1. **Narrative Depth ($Q_{\text{narrative}}$, 35 pts)**:
   - Evaluates token count, sentence structure, and vocabulary richness.
   - $< 15$ words $\rightarrow 10$ pts.
   - $15 - 40$ words $\rightarrow 25$ pts.
   - $> 40$ words with descriptive verbs and context $\rightarrow 35$ pts.
2. **Operational Metadata Completeness ($Q_{\text{metadata}}$, 25 pts)**:
   - Assesses presence of Site (8 pts), Location/Platform (7 pts), Equipment Identification (5 pts), and Activity (5 pts).
3. **Hazard & Energy Specificity ($Q_{\text{hazard}}$, 25 pts)**:
   - Detects explicit mention of high-energy mechanisms (Pressure, Mechanical, Electrical, Chemical/H2S, Gravity/Height).
   - Identifies worker positioning or line-of-fire exposure.
4. **Control & Barrier Information ($Q_{\text{control}}$, 15 pts)**:
   - Checks for references to critical safeguards (Permit to Work, LOTO, Gas Test, Attendant, Safety Harness, Rigging Inspection).

### Quality Bands:
- **Excellent ($80 - 100$)**: Highly rich report with comprehensive operational and barrier details. Immediate high-fidelity triage.
- **Good ($60 - 79$)**: Solid operational context; sufficient for reliable automated prioritization.
- **Fair ($40 - 59$)**: Basic narrative present; some operational context omitted.
- **Low / Flagged ($< 40$)**: Terse or ambiguous narrative. Flagged with warning badge for field safety coordinator follow-up.

---

## 3. PII Redaction & Confidentiality Rules
- Automated regex and heuristic masking redacts personal names, phone numbers, email addresses, and identification numbers.
- Redacted strings are substituted with deterministic tokens: `[WORKER_NAME]`, `[PHONE_REDACTED]`, `[EMAIL_REDACTED]`.
- Masked text is committed to `normalized_text`; unredacted text is stored strictly in `raw_text` with write-once permissions.

---

## 4. Duplicate Detection Protocol
- Cross-shift duplicates (e.g. night shift logging the same morning near miss) are detected via character n-gram Jaccard similarity and token hash comparison.
- Narratives with similarity $\ge 0.85$ to existing reports within a 7-day window are flagged as `IS_DUPLICATE: TRUE`.
