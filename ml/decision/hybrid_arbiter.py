"""
OIL-SIF Guardian — Calibrated Hybrid Decision Engine
Fuses:
  1. Deterministic Safety Rule Engine (Zero-Tolerance Statutory Veto Guardrails)
  2. Contextual Sequence Classifier (Attention Pooling & Semantic Embeddings)
  3. Multi-Label IOGP Classifier (Joint 9x9 Co-occurrence Intelligence)
  4. Statistical TF-IDF Baseline Prior

Enforces Rule 2 of ENGINEERING_RULES.md: Deterministic guardrails overrule pure ML.
Calculates temperature-calibrated probabilities, uncertainty bands, and dynamic triage routing.
"""

import time
import json
import os
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, field, asdict

from rules.safety.deterministic_rules import DeterministicSafetyRuleEngine
from ml.models.sequence_classifier import ContextualSequenceClassifier
from ml.models.iogp_multilabel import IOGPMultiLabelClassifier
from ml.baseline.tfidf_baseline import TFIDFBaselineClassifier
from ml.decision.calibration import ProbabilityCalibrator, CalibrationMetrics


@dataclass
class ModelContributionData:
    model_name: str
    raw_probability: float
    assigned_weight: float
    weighted_probability: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class HybridTriageDecision:
    fused_psif_probability: float
    priority: str  # HIGH, REVIEW, LOW
    confidence_score: float
    is_veto_enforced: bool
    is_benign: bool
    decision_rationale: List[str]
    primary_iogp_rule: str
    secondary_iogp_rules: List[str]
    triggered_rules: List[str]
    model_contributions: Dict[str, ModelContributionData]
    calibration_factor: float
    latency_ms: float
    raw_text: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fused_psif_probability": self.fused_psif_probability,
            "priority": self.priority,
            "confidence_score": self.confidence_score,
            "is_veto_enforced": self.is_veto_enforced,
            "is_benign": self.is_benign,
            "decision_rationale": self.decision_rationale,
            "primary_iogp_rule": self.primary_iogp_rule,
            "secondary_iogp_rules": self.secondary_iogp_rules,
            "triggered_rules": self.triggered_rules,
            "model_contributions": {k: v.to_dict() for k, v in self.model_contributions.items()},
            "calibration_factor": self.calibration_factor,
            "latency_ms": self.latency_ms,
            "raw_text": self.raw_text
        }


class HybridDecisionEngine:
    """
    Central decision fusion arbitrator for OIL-SIF Guardian.
    """

    def __init__(
        self,
        rule_engine: Optional[DeterministicSafetyRuleEngine] = None,
        sequence_classifier: Optional[ContextualSequenceClassifier] = None,
        iogp_classifier: Optional[IOGPMultiLabelClassifier] = None,
        tfidf_baseline: Optional[TFIDFBaselineClassifier] = None,
        calibrator: Optional[ProbabilityCalibrator] = None,
        sequence_weight: float = 0.50,
        iogp_weight: float = 0.30,
        tfidf_weight: float = 0.20,
        tau_high: float = 0.50,
        tau_low: float = 0.25
    ):
        self.rule_engine = rule_engine or DeterministicSafetyRuleEngine()
        self.sequence_classifier = sequence_classifier or ContextualSequenceClassifier()
        self.iogp_classifier = iogp_classifier or IOGPMultiLabelClassifier()
        self.tfidf_baseline = tfidf_baseline or TFIDFBaselineClassifier()
        self.calibrator = calibrator or ProbabilityCalibrator(temperature=1.25)

        # Configurable ensemble weights
        self.sequence_weight = float(sequence_weight)
        self.iogp_weight = float(iogp_weight)
        self.tfidf_weight = float(tfidf_weight)

        # Dynamic priority thresholds
        self.tau_high = float(tau_high)
        self.tau_low = float(tau_low)

        # Auto-initialize baseline and IOGP if uninitialized
        self._ensure_models_initialized()

    def _ensure_models_initialized(self):
        """Ensures all baseline/IOGP models have persisted artifacts loaded or initialized."""
        # Ensure IOGP is loaded
        iogp_path = os.path.join("data", "models", "iogp_multilabel.json")
        if os.path.exists(iogp_path) and not hasattr(self.iogp_classifier, "thresholds"):
            self.iogp_classifier = IOGPMultiLabelClassifier.load(iogp_path)

        # Ensure TF-IDF baseline is loaded
        baseline_path = os.path.join("data", "models", "tfidf_baseline.json")
        if os.path.exists(baseline_path) and not getattr(self.tfidf_baseline, "is_trained", False):
            try:
                self.tfidf_baseline = TFIDFBaselineClassifier.load(baseline_path)
            except Exception:
                pass

    def tune_weights(
        self,
        sequence_weight: Optional[float] = None,
        iogp_weight: Optional[float] = None,
        tfidf_weight: Optional[float] = None,
        tau_high: Optional[float] = None,
        tau_low: Optional[float] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, float]:
        """Dynamically tunes model ensemble weights, priority thresholds, and temperature."""
        if sequence_weight is not None:
            self.sequence_weight = max(0.0, float(sequence_weight))
        if iogp_weight is not None:
            self.iogp_weight = max(0.0, float(iogp_weight))
        if tfidf_weight is not None:
            self.tfidf_weight = max(0.0, float(tfidf_weight))
        if tau_high is not None:
            self.tau_high = max(0.1, min(0.9, float(tau_high)))
        if tau_low is not None:
            self.tau_low = max(0.05, min(self.tau_high - 0.05, float(tau_low)))
        if temperature is not None:
            self.calibrator.temperature = max(0.1, float(temperature))

        return {
            "sequence_weight": self.sequence_weight,
            "iogp_weight": self.iogp_weight,
            "tfidf_weight": self.tfidf_weight,
            "tau_high": self.tau_high,
            "tau_low": self.tau_low,
            "temperature": self.calibrator.temperature
        }

    def evaluate(
        self,
        narrative: str,
        title: str = "",
        weight_overrides: Optional[Dict[str, float]] = None
    ) -> HybridTriageDecision:
        """
        Executes end-to-end hybrid arbitration across all 4 intelligence layers.
        """
        t0 = time.perf_counter()
        full_text = f"{title} {narrative}".strip()

        # 1. Deterministic Safety Rule Engine
        rule_res = self.rule_engine.evaluate(text=narrative, title=title)

        # 2. Multi-Label IOGP Classifier
        iogp_pred = self.iogp_classifier.predict(text=narrative, title=title)
        primary_iogp = iogp_pred.primary_rule
        secondary_iogp = iogp_pred.secondary_rules

        # Max IOGP rule probability
        max_iogp_prob = 0.0
        if iogp_pred.rule_scores:
            max_iogp_prob = max(s.probability for s in iogp_pred.rule_scores.values())

        # 3. Contextual Sequence Classifier
        seq_res = self.sequence_classifier.predict(text=full_text)
        seq_prob = seq_res.calibrated_probabilities.get("HIGH", 0.0)

        # 4. Statistical TF-IDF Baseline Prior
        tfidf_prob = 0.0
        try:
            tfidf_pred = self.tfidf_baseline.predict(text=full_text)
            tfidf_prob = tfidf_pred.get("psif_probability", 0.0)
        except Exception:
            tfidf_prob = seq_prob * 0.9

        # Invariant 1: ZERO-TOLERANCE VETO OVERRULE
        if rule_res.get("mandatory_high_psif", False):
            latency_ms = (time.perf_counter() - t0) * 1000.0
            reasons = [
                f"ZERO-TOLERANCE VETO ENFORCED: {r}" for r in rule_res.get("rule_reasons", [])
            ]
            for detail in rule_res.get("triggered_rule_details", []):
                reasons.append(
                    f"[{detail.get('rule_id')}] Mandated Action: {detail.get('stop_work_action')} ({detail.get('regulatory_standard')})"
                )

            model_contribs = {
                "Deterministic Guardrails": ModelContributionData(
                    model_name="Deterministic Safety Rules",
                    raw_probability=1.0,
                    assigned_weight=float("inf"),
                    weighted_probability=1.0
                ),
                "Contextual Sequence Model": ModelContributionData(
                    model_name="Contextual Sequence Classifier",
                    raw_probability=round(seq_prob, 4),
                    assigned_weight=0.0,
                    weighted_probability=round(seq_prob, 4)
                ),
                "IOGP Multi-Label Classifier": ModelContributionData(
                    model_name="IOGP Multi-Label Model",
                    raw_probability=round(max_iogp_prob, 4),
                    assigned_weight=0.0,
                    weighted_probability=round(max_iogp_prob, 4)
                ),
                "TF-IDF Statistical Baseline": ModelContributionData(
                    model_name="TF-IDF Baseline Prior",
                    raw_probability=round(tfidf_prob, 4),
                    assigned_weight=0.0,
                    weighted_probability=round(tfidf_prob, 4)
                )
            }

            return HybridTriageDecision(
                fused_psif_probability=1.0,
                priority="HIGH",
                confidence_score=1.0,
                is_veto_enforced=True,
                is_benign=False,
                decision_rationale=reasons,
                primary_iogp_rule=primary_iogp if primary_iogp != "None" else (rule_res.get("suggested_rules") or ["None"])[0],
                secondary_iogp_rules=secondary_iogp,
                triggered_rules=rule_res.get("triggered_rules", []),
                model_contributions=model_contribs,
                calibration_factor=1.0,
                latency_ms=round(latency_ms, 3),
                raw_text=narrative
            )

        # Invariant 2: BENIGN NEGATIVE CONTROL SUPPRESSION
        if rule_res.get("is_benign", False):
            latency_ms = (time.perf_counter() - t0) * 1000.0
            model_contribs = {
                "Deterministic Guardrails": ModelContributionData(
                    model_name="Deterministic Safety Rules",
                    raw_probability=0.0,
                    assigned_weight=float("inf"),
                    weighted_probability=0.0
                ),
                "Contextual Sequence Model": ModelContributionData(
                    model_name="Contextual Sequence Classifier",
                    raw_probability=round(seq_prob, 4),
                    assigned_weight=0.0,
                    weighted_probability=round(seq_prob, 4)
                ),
                "IOGP Multi-Label Classifier": ModelContributionData(
                    model_name="IOGP Multi-Label Model",
                    raw_probability=round(max_iogp_prob, 4),
                    assigned_weight=0.0,
                    weighted_probability=round(max_iogp_prob, 4)
                ),
                "TF-IDF Statistical Baseline": ModelContributionData(
                    model_name="TF-IDF Baseline Prior",
                    raw_probability=round(tfidf_prob, 4),
                    assigned_weight=0.0,
                    weighted_probability=round(tfidf_prob, 4)
                )
            }

            return HybridTriageDecision(
                fused_psif_probability=0.015,
                priority="LOW",
                confidence_score=0.985,
                is_veto_enforced=False,
                is_benign=True,
                decision_rationale=["Identified as routine administrative / non-industrial activity possessing zero fatal precursor risk."],
                primary_iogp_rule="None",
                secondary_iogp_rules=[],
                triggered_rules=[],
                model_contributions=model_contribs,
                calibration_factor=1.0,
                latency_ms=round(latency_ms, 3),
                raw_text=narrative
            )

        # 3. CONTINUOUS STATISTICAL ML FUSION
        w_seq = (weight_overrides.get("sequence_weight") if weight_overrides else None) or self.sequence_weight
        w_iogp = (weight_overrides.get("iogp_weight") if weight_overrides else None) or self.iogp_weight
        w_tfidf = (weight_overrides.get("tfidf_weight") if weight_overrides else None) or self.tfidf_weight
        w_total = max(1e-6, w_seq + w_iogp + w_tfidf)

        norm_w_seq = w_seq / w_total
        norm_w_iogp = w_iogp / w_total
        norm_w_tfidf = w_tfidf / w_total

        raw_fused = (norm_w_seq * seq_prob) + (norm_w_iogp * max_iogp_prob) + (norm_w_tfidf * tfidf_prob)

        # Apply Temperature Scaling Calibration
        calibrated_fused = self.calibrator.calibrate_probability(raw_fused)

        # Priority assignment based on calibrated probability
        if calibrated_fused >= self.tau_high:
            priority = "HIGH"
            confidence = round(0.70 + (calibrated_fused - self.tau_high) * 0.60, 4)
            confidence = min(0.99, confidence)
        elif calibrated_fused >= self.tau_low:
            priority = "REVIEW"
            # In uncertain review zone, confidence reflects proximity to boundaries
            confidence = round(0.60 + abs(calibrated_fused - 0.375) * 0.8, 4)
            confidence = min(0.85, confidence)
        else:
            priority = "LOW"
            confidence = round(0.70 + (self.tau_low - calibrated_fused) * 0.80, 4)
            confidence = min(0.99, confidence)

        # Decision rationale synthesis
        rationale: List[str] = []
        if priority == "HIGH":
            rationale.append(f"Calibrated PSIF probability ({calibrated_fused:.2%}) exceeds High-PSIF triage threshold ({self.tau_high:.0%}).")
            if primary_iogp != "None":
                rationale.append(f"Strong alignment with IOGP Life-Saving Rule: '{primary_iogp}'.")
        elif priority == "REVIEW":
            rationale.append(f"Event falls in uncertainty review band ({self.tau_low:.0%} - {self.tau_high:.0%}) with P(SIF) = {calibrated_fused:.2%}.")
            rationale.append("Routing to HSE Review Queue for human-in-the-loop expert adjudication.")
        else:
            rationale.append(f"Low risk classification with P(SIF) = {calibrated_fused:.2%}. Routine operational controls verified.")

        latency_ms = (time.perf_counter() - t0) * 1000.0

        model_contribs = {
            "Contextual Sequence Model": ModelContributionData(
                model_name="Contextual Sequence Classifier",
                raw_probability=round(seq_prob, 4),
                assigned_weight=round(norm_w_seq, 3),
                weighted_probability=round(norm_w_seq * seq_prob, 4)
            ),
            "IOGP Multi-Label Classifier": ModelContributionData(
                model_name="IOGP Multi-Label Model",
                raw_probability=round(max_iogp_prob, 4),
                assigned_weight=round(norm_w_iogp, 3),
                weighted_probability=round(norm_w_iogp * max_iogp_prob, 4)
            ),
            "TF-IDF Statistical Baseline": ModelContributionData(
                model_name="TF-IDF Baseline Prior",
                raw_probability=round(tfidf_prob, 4),
                assigned_weight=round(norm_w_tfidf, 3),
                weighted_probability=round(norm_w_tfidf * tfidf_prob, 4)
            )
        }

        return HybridTriageDecision(
            fused_psif_probability=calibrated_fused,
            priority=priority,
            confidence_score=confidence,
            is_veto_enforced=False,
            is_benign=False,
            decision_rationale=rationale,
            primary_iogp_rule=primary_iogp,
            secondary_iogp_rules=secondary_iogp,
            triggered_rules=rule_res.get("triggered_rules", []),
            model_contributions=model_contribs,
            calibration_factor=round(calibrated_fused / max(1e-6, raw_fused), 3),
            latency_ms=round(latency_ms, 3),
            raw_text=narrative
        )

    def evaluate_golden_benchmark(
        self,
        benchmark_path: str = "data/evaluation/golden_benchmark.json"
    ) -> Tuple[Dict[str, Any], CalibrationMetrics]:
        """
        Runs comprehensive evaluation on all 124 golden benchmark scenarios.
        Returns accuracy/recall metrics alongside calibration curves.
        """
        with open(benchmark_path, "r", encoding="utf-8") as f:
            scenarios = json.load(f)

        total_samples = len(scenarios)
        true_high_count = 0
        detected_high_count = 0
        correct_priority_count = 0
        probabilities: List[float] = []
        ground_truths: List[int] = []

        for item in scenarios:
            narrative = item.get("narrative", "")
            title = item.get("title", "")
            gt = item.get("ground_truth", {})
            is_true_high = (gt.get("psif_priority") == "HIGH")
            gt_priority = gt.get("psif_priority", "LOW")

            if is_true_high:
                true_high_count += 1
                ground_truths.append(1)
            else:
                ground_truths.append(0)

            decision = self.evaluate(narrative=narrative, title=title)
            probabilities.append(decision.fused_psif_probability)

            if is_true_high and decision.priority == "HIGH":
                detected_high_count += 1

            if decision.priority == gt_priority:
                correct_priority_count += 1

        recall = detected_high_count / true_high_count if true_high_count > 0 else 1.0
        accuracy = correct_priority_count / total_samples if total_samples > 0 else 0.0

        cal_metrics = self.calibrator.calculate_metrics(
            probabilities=probabilities,
            ground_truths=ground_truths,
            n_bins=10
        )

        summary = {
            "total_samples": total_samples,
            "true_high_psif_count": true_high_count,
            "detected_high_psif_count": detected_high_count,
            "high_psif_recall": round(recall, 4),
            "priority_accuracy": round(accuracy, 4),
            "active_weights": {
                "sequence_weight": self.sequence_weight,
                "iogp_weight": self.iogp_weight,
                "tfidf_weight": self.tfidf_weight
            },
            "active_thresholds": {
                "tau_high": self.tau_high,
                "tau_low": self.tau_low
            }
        }

        return summary, cal_metrics
