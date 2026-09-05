# OIL-SIF Guardian — Model Card: PSIF Prioritization & IOGP Tagging

## 1. Model Details
- **Model Name**: OIL-SIF Guardian Hybrid Prioritizer (`psif-v1.0`)
- **Architecture**: Hybrid System combining Pretrained Domain Transformer Encoder + Multi-Label Classification Heads + Calibrated Decision Logic + Deterministic Safety Guardrails.
- **Intended Use**: Operational prioritization and decision support for Oil India Limited HSSE professionals to surface high-consequence precursors in incident reports.
- **Out-of-Scope Use**: Must NOT be used as an autonomous authority for legal liability determinations, automated disciplinary actions, or autonomous emergency shutdown triggers.

---

## 2. Intended Factors & Demographics
- **Target Domain**: Upstream, midstream, and pipeline oil & gas operations (drilling rigs, workover installations, crude oil collecting stations, gas compressor plants, pipeline right-of-way).
- **Language**: English, Indian Oil & Gas operational abbreviations (PTW, JSA, LOTO, BOP, H2S, ESP, DG set, manifold).

---

## 3. Evaluation Metrics & Safety Targets
- **Primary Metric**: Recall / Sensitivity on True PSIF Events ($\ge 92\%$). Safety prioritization demands minimizing False Negatives.
- **Secondary Metrics**: Precision ($\ge 75\%$), PR-AUC ($\ge 0.85$), Brier Calibration Score ($< 0.12$).
- **Multi-Label IOGP Metric**: Micro-F1 ($\ge 0.82$) across the 9 Life-Saving Rules.

---

## 4. Bias, Limitations & Safe Operation
- **Reporting Quality Bias**: Terse, poorly detailed incident narratives with omitted context will trigger a `REVIEW` priority rather than being discarded as low risk.
- **Fail-Safe Mechanism**: In the event of inference latency or service degradation, all incoming reports default to `PRIORITY: REVIEW` in the HSE queue rather than getting dropped or auto-classified as low risk.
