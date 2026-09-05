"""
Tests for Tri-Model Ensemble Arbitrator and 4-Way Benchmark Evaluator.
"""

import pytest
from ml.evaluation.ensemble_arbitrator import EnsembleArbitrator, EnsembleDecision, FourWayBenchmarkReport


@pytest.fixture
def arbitrator():
    return EnsembleArbitrator()


class TestEnsembleArbitrator:

    def test_arbitrate_deterministic_safety_veto(self, arbitrator):
        # Mandatory confined space breach -> rule engine triggers HIGH
        narrative = "Contractor entered separator vessel without gas test, attendant absent"
        decision = arbitrator.arbitrate(narrative)

        assert isinstance(decision, EnsembleDecision)
        assert decision.final_priority == "HIGH"
        assert decision.confidence_score >= 0.85
        assert len(decision.final_iogp_rules) > 0

    def test_arbitrate_benign_event(self, arbitrator):
        narrative = "Daily shift handover completed safely at Duliajan CTF with routine checks"
        decision = arbitrator.arbitrate(narrative)

        assert decision.final_priority in ("LOW", "REVIEW")

    def test_four_way_benchmark_evaluation(self, arbitrator):
        report = arbitrator.evaluate_four_way_benchmark()

        assert isinstance(report, FourWayBenchmarkReport)
        assert report.total_benchmark_samples == 124

        # Crucial safety invariant: Deterministic Rule Engine and Ensemble must achieve 100% High-PSIF recall!
        assert report.deterministic_rule_engine.high_psif_recall == 1.0
        assert report.tri_model_ensemble.high_psif_recall == 1.0

        # Tri-model ensemble accuracy should be >= 85%
        assert report.tri_model_ensemble.overall_accuracy >= 0.85
        assert len(report.key_findings) >= 3
