"""
OIL-SIF Guardian — Unit Tests for Calibrated Hybrid Decision Engine
Verifies Rule 2 zero-tolerance veto overrule, benign suppression,
continuous multi-model fusion, dynamic weight tuning, and 100% recall guarantee.
"""

import pytest
from ml.decision.hybrid_arbiter import HybridDecisionEngine


def test_zero_tolerance_veto_overrules_ml():
    engine = HybridDecisionEngine()
    narrative = (
        "Contractor worker entered crude storage tank TK-101 without atmospheric gas testing "
        "or positive isolation blind while standby hole watcher was absent."
    )
    decision = engine.evaluate(narrative=narrative, title="Tank Sludge Cleaning")

    assert decision.is_veto_enforced is True
    assert decision.priority == "HIGH"
    assert decision.fused_psif_probability == 1.0
    assert decision.confidence_score == 1.0
    assert decision.is_benign is False
    assert any("ZERO-TOLERANCE VETO ENFORCED" in r for r in decision.decision_rationale)
    assert decision.primary_iogp_rule == "Confined Space"
    assert len(decision.triggered_rules) > 0


def test_benign_negative_control_suppression():
    engine = HybridDecisionEngine()
    narrative = "Accounts clerk ordered stationery supplies and cleared paper jam in office laser printer on second floor."
    decision = engine.evaluate(narrative=narrative, title="Office Stationery Order")

    assert decision.is_veto_enforced is False
    assert decision.is_benign is True
    assert decision.priority == "LOW"
    assert decision.fused_psif_probability < 0.05
    assert decision.primary_iogp_rule == "None"


def test_continuous_ml_fusion_without_veto():
    engine = HybridDecisionEngine()
    narrative = "Operator noticed small hydraulic oil weep around flange bolt during routine daily walkaround in compressor shed."
    decision = engine.evaluate(narrative=narrative, title="Routine Flange Visual Check")

    assert decision.is_veto_enforced is False
    assert decision.is_benign is False
    assert 0.0 <= decision.fused_psif_probability <= 1.0
    assert decision.priority in ["LOW", "REVIEW"]
    assert len(decision.model_contributions) == 3


def test_dynamic_weight_tuning():
    engine = HybridDecisionEngine()
    updated = engine.tune_weights(
        sequence_weight=0.70,
        iogp_weight=0.20,
        tfidf_weight=0.10,
        tau_high=0.55,
        tau_low=0.20,
        temperature=1.40
    )

    assert updated["sequence_weight"] == 0.70
    assert updated["iogp_weight"] == 0.20
    assert updated["tfidf_weight"] == 0.10
    assert updated["tau_high"] == 0.55
    assert updated["tau_low"] == 0.20
    assert updated["temperature"] == 1.40


def test_golden_benchmark_100_percent_recall():
    """
    CRITICAL RULE: The hybrid arbiter must guarantee 100.0% recall (80/80)
    on all true High-PSIF scenarios in the 124-event golden evaluation benchmark.
    """
    engine = HybridDecisionEngine()
    summary, cal = engine.evaluate_golden_benchmark()

    assert summary["total_samples"] == 124
    assert summary["true_high_psif_count"] == 80
    assert summary["detected_high_psif_count"] == 80
    assert summary["high_psif_recall"] == 1.0
    assert cal.ece < 0.20
    assert cal.brier_score < 0.15
    assert len(cal.bins) == 10
