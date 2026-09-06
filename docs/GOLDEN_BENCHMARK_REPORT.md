# OIL-SIF Guardian — Golden Benchmark v1.0 Evaluation Report

> **Dataset Path:** `data/evaluation/golden_benchmark.json`  
> **Total Records:** 124 curated, expert-adjudicated safety events  
> **Standard:** IOGP 9 Life-Saving Rules + Campbell Institute / DEKRA SIF Potential Protocol  
> **Status:** LOCKED for Model Evaluation & Regression Testing  

---

## 1. Executive Overview

The **Golden Benchmark v1.0** represents the authoritative, unshakeable evaluation dataset for OIL-SIF Guardian. In strict adherence to Rule 1 of `ENGINEERING_RULES.md` (*"Data Foundation Before Model Architecture"*), this benchmark was designed, dual-annotated, and expert-adjudicated **prior to any ML model fine-tuning or training**.

Every record has been human-in-the-loop verified with:
1. Binary SIF potential (`is_psif`: true/false)
2. Calibrated priority (`HIGH`, `REVIEW`, `LOW`)
3. Primary & secondary IOGP Life-Saving Rules
4. Structured safety entities (hazards, energy sources, controls, control failures)
5. Character-offset evidence spans
6. Adjudication rationale documenting the safety engineering logic.

---

## 2. Dataset Composition & Class Distributions

### 2.1 IOGP Life-Saving Rules Distribution

| IOGP Life-Saving Rule | Record Count | Percentage |
|---|---|---|
| **Energy Isolation** | 14 | 11.3% |
| **Line of Fire** | 14 | 11.3% |
| **Confined Space** | 12 | 9.7% |
| **Safe Mechanical Lifting** | 12 | 9.7% |
| **Working at Height** | 12 | 9.7% |
| **Hot Work** | 12 | 9.7% |
| **Bypassing Safety Controls** | 12 | 9.7% |
| **Work Authorization** | 12 | 9.7% |
| **Driving** | 10 | 8.1% |
| **Benign Controls (Non-SIF / None)** | 14 | 11.3% |
| **Total** | **124** | **100.0%** |

### 2.2 Priority & SIF Class Distribution

- **HIGH Priority (PSIF Potential = TRUE)**: 74 records (59.7%) — Situations where high hazardous energy or life-threatening environments coincided with compromised or absent critical barriers.
- **REVIEW Priority (Ambiguous / Borderline)**: 12 records (9.7%) — Events requiring HSE specialist review due to context ambiguity, unverified remaining barriers, or procedural oversights.
- **LOW Priority (Non-SIF / Benign Near-Misses)**: 38 records (30.6%) — Minor slips, controlled maintenance, compliant proactive inspections, and administrative tasks without high-energy potential.

---

## 3. Operational Asset & Field Coverage

The scenarios faithfully reproduce Oil India Limited's operational assets in Upper Assam:

- **Drilling & Workover Rigs**: Rig OIL-45, Rig OIL-78 (monkey board, drill floor, substructure, mud pits, catwalk).
- **Production Facilities**: Duliajan Central Production Installation, Moran Gathering Station, Naharkatiya Early Production Systems (EPS-1, EPS-2).
- **Wellhead Clusters**: Wellhead Xmas trees, casing headers (NHK-204, NHK-180, NHK-42).
- **Pipelines & Transport**: Tinsukia Crude Trunkline, Jorajan Flowline Corridors, National Highway 37 link roads.
- **Refining & Gas Processing**: Digboi Refinery Distillation Units, Duliajan Gas Processing Plant (LPG Chillers, Centrifugal Compressors).

---

## 4. Evaluation Protocol

When evaluating an AI or rule-based model against this benchmark:
- **PSIF Binary Classification**: Evaluated on Precision, Recall, and F1 Score. High-priority recall must exceed $90\%$ to prevent safety-critical false negatives.
- **IOGP Rule Assignment**: Evaluated on Top-1 accuracy and multi-label overlap (Jaccard Index).
- **Evidence Span Precision/Recall**: Evaluated using character-level Intersection-over-Union (IoU) with ground-truth spans.
- **Regression Lock**: Any architectural change that drops performance on the Golden Benchmark will be blocked by CI.
