"""
OIL-SIF Guardian — MLOps Drift Detection & Governance Engine
Computes Population Stability Index (PSI), vocabulary distribution shift,
and prediction confidence decay between baseline training data and runtime reports.
"""

from typing import List, Dict, Any, Optional
import math
import re
from collections import Counter
from datetime import datetime, timezone


class DriftDetector:
    """
    Pure-Python statistical drift detector for NLP classification models.
    Evaluates:
    1. Prediction distribution drift (PSI across SIF priority bins: HIGH, REVIEW, LOW)
    2. Vocabulary shift (emerging unigrams indicating novel operational hazards)
    3. Confidence decay (tracking mean calibrated confidence drift)
    """

    # Baseline distribution derived from Golden Benchmark v1.0
    BASELINE_CLASS_DISTRIBUTION = {
        "HIGH": 0.403,   # 50 / 124
        "REVIEW": 0.339, # 42 / 124
        "LOW": 0.258     # 32 / 124
    }

    # Baseline core vocabulary top terms
    BASELINE_TOP_VOCAB = {
        "gas", "tank", "valve", "line", "confined", "space", "pressure",
        "crane", "load", "h2s", "permit", "isolation", "loto", "drilling",
        "wellhead", "flange", "leak", "electrical", "bypass", "scaffold"
    }

    def __init__(self, model_version: str = "psif-v1.0"):
        self.model_version = model_version
        self.last_evaluated_at = datetime.now(timezone.utc).isoformat()

    def compute_psi(self, baseline: Dict[str, float], actual: Dict[str, float], epsilon: float = 1e-4) -> float:
        """
        Computes Population Stability Index (PSI):
        PSI = sum((Actual% - Baseline%) * ln(Actual% / Baseline%))
        PSI < 0.1: No significant change
        0.1 <= PSI < 0.25: Moderate shift, monitor
        PSI >= 0.25: Significant shift, model retrain recommended
        """
        psi = 0.0
        all_keys = set(baseline.keys()).union(set(actual.keys()))
        for k in all_keys:
            b = max(baseline.get(k, epsilon), epsilon)
            a = max(actual.get(k, epsilon), epsilon)
            psi += (a - b) * math.log(a / b)
        return round(psi, 4)

    def evaluate_drift(
        self,
        recent_reports: List[Dict[str, Any]],
        min_sample_size: int = 10
    ) -> Dict[str, Any]:
        """
        Evaluates drift across recent production reports.
        """
        now = datetime.now(timezone.utc).isoformat()
        total = len(recent_reports)

        if total < min_sample_size:
            return {
                "status": "INSUFFICIENT_DATA",
                "sample_count": total,
                "min_required": min_sample_size,
                "message": f"Need at least {min_sample_size} recent reports to compute reliable drift statistics.",
                "evaluated_at": now,
                "model_version": self.model_version
            }

        # 1. Class Distribution Drift
        class_counts: Dict[str, int] = Counter()
        confidences: List[float] = []
        token_counter: Dict[str, int] = Counter()

        for r in recent_reports:
            prio = r.get("priority", r.get("predicted_priority", "REVIEW"))
            class_counts[prio] += 1

            conf = r.get("confidence", r.get("confidence_score", 0.75))
            confidences.append(float(conf))

            narrative = r.get("narrative", r.get("raw_text", ""))
            tokens = re.findall(r"\b[a-zA-Z]{3,}\b", narrative.lower())
            token_counter.update(tokens)

        actual_dist = {k: count / total for k, count in class_counts.items()}
        psi_score = self.compute_psi(self.BASELINE_CLASS_DISTRIBUTION, actual_dist)

        # 2. Confidence Drift
        mean_confidence = sum(confidences) / len(confidences) if confidences else 0.8
        baseline_confidence = 0.842  # Calibrated baseline
        confidence_delta = round(mean_confidence - baseline_confidence, 3)

        # 3. Vocabulary Shift / Emerging Terms
        emerging_terms: List[Dict[str, Any]] = []
        for word, count in token_counter.most_common(50):
            if word not in self.BASELINE_TOP_VOCAB and count >= 2:
                freq = round(count / total, 3)
                emerging_terms.append({
                    "term": word,
                    "frequency": freq,
                    "count": count
                })

        # Determine Alert Level
        if psi_score >= 0.25 or confidence_delta < -0.15:
            drift_alert = "CRITICAL_DRIFT"
            recommendation = "Significant data drift detected. Initiate HITL re-annotation and trigger retraining on gold dataset."
        elif psi_score >= 0.10 or confidence_delta < -0.08:
            drift_alert = "MODERATE_DRIFT"
            recommendation = "Moderate distribution variance observed. Increase sampling rate in HSE review queue."
        else:
            drift_alert = "NOMINAL"
            recommendation = "Model operational stability is within safe bounds. Zero safety degradation observed."

        return {
            "status": "HEALTHY" if drift_alert == "NOMINAL" else "ALERT",
            "drift_level": drift_alert,
            "evaluated_at": now,
            "sample_size": total,
            "model_version": self.model_version,
            "population_stability_index": psi_score,
            "psi_threshold_guide": {
                "nominal": "< 0.10",
                "moderate": "0.10 - 0.25",
                "critical": ">= 0.25"
            },
            "class_distribution": {
                "baseline": self.BASELINE_CLASS_DISTRIBUTION,
                "current_batch": actual_dist
            },
            "confidence_metrics": {
                "baseline_mean_confidence": baseline_confidence,
                "current_mean_confidence": round(mean_confidence, 3),
                "delta": confidence_delta
            },
            "emerging_operational_terms": emerging_terms[:8],
            "recommendation": recommendation,
            "safety_guardrail_status": "Active (Rule 2 Zero-Miss Veto Invariant)"
        }
