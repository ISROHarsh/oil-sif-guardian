"""
Tests for IOGPMultiLabelClassifier in ml/models/iogp_multilabel.py.
"""

import os
import pytest
from ml.models.iogp_multilabel import (
    IOGPMultiLabelClassifier,
    CANONICAL_IOGP_RULES,
    IOGPMultiLabelPrediction,
)


class TestIOGPMultiLabelClassifier:

    def test_canonical_rules_list(self):
        clf = IOGPMultiLabelClassifier()
        assert len(clf.rules) == 9
        assert "Confined Space" in clf.rules
        assert "Energy Isolation" in clf.rules
        assert "Line of Fire" in clf.rules
        assert "Safe Mechanical Lifting" in clf.rules
        assert "Working at Height" in clf.rules
        assert "Hot Work" in clf.rules
        assert "Bypassing Safety Controls" in clf.rules
        assert "Driving" in clf.rules
        assert "Work Authorization" in clf.rules

    def test_predict_single_confined_space(self):
        clf = IOGPMultiLabelClassifier()
        narrative = (
            "Fitter entered the interior of test separator vessel through open manway "
            "to clean heavy sludge without atmospheric gas test or standby attendant."
        )
        pred = clf.predict(narrative)
        assert isinstance(pred, IOGPMultiLabelPrediction)
        assert pred.primary_rule == "Confined Space"
        assert "Confined Space" in pred.triggered_rules
        assert pred.rule_scores["Confined Space"].probability >= 0.70
        assert pred.rule_scores["Confined Space"].is_triggered is True
        assert len(pred.rule_scores["Confined Space"].evidence_spans) > 0

    def test_predict_multi_label_confined_space_and_work_auth(self):
        clf = IOGPMultiLabelClassifier()
        narrative = (
            "Contractor descended into crude oil tank sump without permit to work (PTW) "
            "and without required gas testing or hole watch attendant present."
        )
        pred = clf.predict(narrative)
        assert "Confined Space" in pred.triggered_rules
        assert "Work Authorization" in pred.triggered_rules
        assert len(pred.triggered_rules) >= 2
        assert pred.primary_rule in ["Confined Space", "Work Authorization"]

    def test_predict_multi_label_energy_isolation_and_line_of_fire(self):
        clf = IOGPMultiLabelClassifier()
        narrative = (
            "Maintenance crew unbolted pressurized gas line flange before closing isolation block valves. "
            "Stored energy blew door open and 1200 psi gas expelled studs directly into work zone."
        )
        pred = clf.predict(narrative)
        assert "Energy Isolation" in pred.triggered_rules
        assert "Line of Fire" in pred.triggered_rules
        assert len(pred.co_occurrence_tags) > 0

    def test_benign_administrative_negative_control(self):
        clf = IOGPMultiLabelClassifier()
        narrative = (
            "Accounts clerk cleared paper jam in office laser printer on second floor admin block. "
            "Used ballpoint pen to unstick roller. No injury reported."
        )
        pred = clf.predict(narrative)
        assert pred.primary_rule == "None"
        assert len(pred.triggered_rules) == 0
        assert len(pred.secondary_rules) == 0
        for r in clf.rules:
            assert pred.rule_scores[r].is_triggered is False

    def test_co_occurrence_matrix_structure(self):
        clf = IOGPMultiLabelClassifier()
        data = clf.get_co_occurrence_matrix()
        assert len(data["rules"]) == 9
        assert len(data["matrix"]) == 9
        assert len(data["matrix"][0]) == 9
        assert len(data["top_pairs"]) > 0
        top = data["top_pairs"][0]
        assert "rule_1" in top
        assert "rule_2" in top
        assert top["co_occurrence_count"] >= 3

    def test_threshold_overrides(self):
        clf = IOGPMultiLabelClassifier()
        narrative = "Worker operated crane in yard."
        # Normal threshold might or might not trigger
        # Override to 0.99 ensures it does not trigger
        pred_strict = clf.predict(narrative, threshold_overrides={"Safe Mechanical Lifting": 0.99})
        assert pred_strict.rule_scores["Safe Mechanical Lifting"].is_triggered is False

        # Override to 0.10 ensures it triggers
        pred_sensitive = clf.predict(narrative, threshold_overrides={"Safe Mechanical Lifting": 0.10})
        assert pred_sensitive.rule_scores["Safe Mechanical Lifting"].is_triggered is True

    def test_serialization_and_deserialization(self, tmp_path):
        clf = IOGPMultiLabelClassifier()
        clf.thresholds["Confined Space"] = 0.42
        temp_file = str(tmp_path / "test_iogp_model.json")
        clf.save(temp_file)
        assert os.path.exists(temp_file)

        loaded = IOGPMultiLabelClassifier.load(temp_file)
        assert loaded.thresholds["Confined Space"] == 0.42
        assert len(loaded.rules) == 9
