"""
Tests for Causal Reasoner Synthesizer.
Verifies the 5-step causal flow chain:
  Activity -> Hazard & Energy -> Worker Exposure -> Barrier Failure -> Credible Consequence
"""

import pytest
from ml.extraction.safety_ner import SafetyNER
from ml.extraction.causal_reasoner import CausalReasoner, CausalStep, CausalReasoningResult


@pytest.fixture
def causal_engine():
    return CausalReasoner()


class TestCausalReasoner:

    def test_full_chain_synthesis(self, causal_engine):
        narrative = (
            "During vessel cleanout at EPS-1, contractor entered inside separator vessel "
            "with h2s gas present. Because gas test omitted and standby attendant absent, "
            "the worker collapsed with risk of fatal asphyxiation."
        )
        result = causal_engine.analyze(narrative)

        assert isinstance(result, CausalReasoningResult)
        assert len(result.steps) == 5

        # Check step keys
        keys = [s.node_key for s in result.steps]
        assert keys == ["ACTIVITY", "HAZARD_ENERGY", "WORKER_EXPOSURE", "BARRIER_FAILURE", "CREDIBLE_CONSEQUENCE"]

        # All 5 should have evidence
        assert result.completeness_score >= 0.8
        assert result.risk_level == "HIGH_PSIF"
        assert len(result.suggested_critical_controls) > 0
        assert "fatal asphyxiation" in result.causal_narrative.lower() or "asphyxiation" in result.causal_narrative.lower()

    def test_partial_chain_with_context(self, causal_engine):
        narrative = "High pressure line ruptured without whip check during pressure test."
        result = causal_engine.analyze(narrative, activity_context="Hydrotesting")

        assert result.steps[0].has_evidence is True  # Activity captured from context or text
        assert result.steps[1].has_evidence is True  # Hazard/energy
        assert result.completeness_score >= 0.4

    def test_suggested_controls_relevance(self, causal_engine):
        narrative = "Worker working at height without harness on derrick with risk of fatal fall."
        result = causal_engine.analyze(narrative)

        combined_suggestions = " ".join(result.suggested_critical_controls).lower()
        assert "harness" in combined_suggestions or "tie-off" in combined_suggestions or "fall" in combined_suggestions
