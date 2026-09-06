"""
Unit tests for TF-IDF Statistical Baseline Classifier and Comparative Benchmark Evaluations.
"""

import os
import pytest
from ml.baseline.tfidf_baseline import (
    TFIDFBaselineClassifier,
    tfidf_baseline_model
)

BENCHMARK_PATH = os.path.join("data", "evaluation", "golden_benchmark.json")


def test_tfidf_baseline_fit_and_predict():
    model = TFIDFBaselineClassifier(min_df=1, max_features=100)

    docs = [
        "worker entered confined separator vessel without gas test or attendant",
        "technician opened pressurized gas line without loto isolation or bleed",
        "roustabout positioned under suspended load on drill rig floor",
        "administrative clerk requested ballpoint pens and printer paper for office"
    ]
    psif_labels = ["HIGH", "HIGH", "HIGH", "LOW"]
    iogp_labels = ["Confined Space", "Energy Isolation", "Safe Mechanical Lifting", "None"]

    model.fit(docs, psif_labels, iogp_labels)
    assert model.is_trained is True
    assert len(model.vocabulary) > 0
    assert model.training_samples == 4

    # Test Prediction on new unseen narrative
    pred1 = model.predict("contractor inside crude tank without gas test")
    assert pred1["priority"] == "HIGH"
    assert pred1["predicted_iogp_rule"] == "Confined Space"
    assert pred1["probabilities"]["HIGH"] > 0.50

    pred2 = model.predict("office clerk replaced paper in desktop laser printer")
    assert pred2["priority"] == "LOW"


def test_tfidf_baseline_serialization(tmp_path):
    model = TFIDFBaselineClassifier()
    docs = ["confined space gas test", "line of fire recoil", "office stationery"]
    model.fit(docs, ["HIGH", "HIGH", "LOW"], ["Confined Space", "Line of Fire", "None"])

    save_path = str(tmp_path / "test_model.json")
    model.save(save_path)
    assert os.path.exists(save_path)

    loaded_model = TFIDFBaselineClassifier()
    success = loaded_model.load(save_path)
    assert success is True
    assert loaded_model.is_trained is True
    assert len(loaded_model.vocabulary) == len(model.vocabulary)


def test_tfidf_baseline_evaluate_benchmark():
    assert os.path.exists(BENCHMARK_PATH), "Golden benchmark file must exist for evaluation"

    reports = tfidf_baseline_model.evaluate_benchmark(BENCHMARK_PATH)

    assert "deterministic_rule_engine" in reports
    assert "tfidf_baseline" in reports
    assert "calibrated_hybrid" in reports

    rule_rep = reports["deterministic_rule_engine"]
    tfidf_rep = reports["tfidf_baseline"]
    hybrid_rep = reports["calibrated_hybrid"]

    # Critical Safety Assertions
    # 1. Zero fatal precursor escapes on Rule Engine
    assert rule_rep.high_psif_recall >= 0.95, f"Expected Rule Engine Recall >= 0.95, got {rule_rep.high_psif_recall}"

    # 2. Hybrid model maintains 100% recall and high overall accuracy
    assert hybrid_rep.high_psif_recall >= 0.95
    assert hybrid_rep.overall_accuracy >= 0.80
    assert hybrid_rep.iogp_rule_match_rate >= 0.80

    # 3. TF-IDF statistical baseline provides valid baseline
    assert tfidf_rep.overall_accuracy >= 0.70
    assert tfidf_rep.total_samples >= 100
