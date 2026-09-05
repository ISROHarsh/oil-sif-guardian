"""
Tests for Contextual Sequence Classifier and Temperature Calibration.
"""

import pytest
from ml.models.sequence_classifier import ContextualSequenceClassifier, ModelPredictionResult, IOGP_NINE_RULES


@pytest.fixture
def classifier():
    clf = ContextualSequenceClassifier()
    # Fit with a small sample
    docs = [
        "Contractor entered separator vessel without gas test, fatal asphyxiation",
        "High pressure gas kick on rig floor at 5000 psi",
        "Routine housekeeping inspection completed safely, all tools stored"
    ]
    labels = ["HIGH", "HIGH", "LOW"]
    rules = [["Confined Space"], ["Line of Fire"], ["Work Authorization"]]
    clf.fit(docs, labels, rules)
    return clf


class TestContextualSequenceClassifier:

    def test_initialization(self, classifier):
        assert classifier.temperature == 1.35
        assert len(classifier.iogp_weights) == 9
        assert classifier.is_trained is True

    def test_predict_high_psif(self, classifier):
        text = "Vessel cleanout in confined space without gas testing, worker collapsed inside separator"
        res = classifier.predict(text)

        assert isinstance(res, ModelPredictionResult)
        assert res.predicted_class == "HIGH"
        assert res.calibrated_probabilities["HIGH"] > 0.5
        assert "Confined Space" in [r["rule_name"] for r in res.top_iogp_rules]
        assert res.inference_latency_ms >= 0

    def test_predict_low_psif(self, classifier):
        text = "Routine daily toolbox talk conducted, all ppe verified, work completed without incident"
        res = classifier.predict(text)

        assert res.predicted_class == "LOW"
        assert res.calibrated_probabilities["LOW"] > res.calibrated_probabilities["HIGH"]

    def test_temperature_scaling_effect(self):
        clf_high_t = ContextualSequenceClassifier(temperature=5.0)
        clf_low_t = ContextualSequenceClassifier(temperature=0.5)

        text = "Gas leak detected near flare knock out drum with minor alarm"
        res_high_t = clf_high_t.predict(text)
        res_low_t = clf_low_t.predict(text)

        # Higher temperature softens distribution (lower max probability)
        max_p_high_t = max(res_high_t.calibrated_probabilities.values())
        max_p_low_t = max(res_low_t.calibrated_probabilities.values())
        assert max_p_high_t < max_p_low_t

    def test_attention_weights_offsets(self, classifier):
        text = "Workers under suspended load during casing hoisting"
        res = classifier.predict(text)

        assert len(res.attention_weights) > 0
        for tok, weight, s_c, e_c in res.attention_weights:
            assert s_c < e_c
            sliced = text[s_c:e_c].lower()
            assert tok in sliced or sliced in tok
