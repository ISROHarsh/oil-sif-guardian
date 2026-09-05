"""
Tests for Token Attribution and Explainable Saliency Heatmaps.
"""

import pytest
from ml.models.token_attribution import TokenAttributionEngine, TokenAttributionResult


@pytest.fixture
def attribution_engine():
    return TokenAttributionEngine()


class TestTokenAttribution:

    def test_explain_high_psif_narrative(self, attribution_engine):
        narrative = "High pressure line kick at 5000 psi with whip check unlatched causing fatal blowout"
        result = attribution_engine.explain(narrative)

        assert isinstance(result, TokenAttributionResult)
        assert len(result.tokens) > 0
        assert result.saliency_balance > 0.0  # Risk dominated
        assert len(result.top_risk_amplifiers) > 0

        # Check offsets
        for t in result.tokens:
            sliced = narrative[t.start_char:t.end_char].lower()
            assert t.token in sliced or sliced in t.token

    def test_explain_empty_narrative(self, attribution_engine):
        result = attribution_engine.explain("")
        assert result.tokens == []
        assert result.saliency_balance == 0.0

    def test_mitigator_detection(self, attribution_engine):
        narrative = "Routine inspection completed with all safety devices intact and authorized permit"
        result = attribution_engine.explain(narrative)

        assert any(t.role in ("SAFETY_MITIGATOR", "NEUTRAL_CONTEXT") for t in result.tokens)
