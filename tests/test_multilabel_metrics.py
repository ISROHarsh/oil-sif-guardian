"""
Tests for MultiLabelEvaluator in ml/evaluation/multilabel_metrics.py.
"""

import pytest
from ml.evaluation.multilabel_metrics import (
    MultiLabelEvaluator,
    MultiLabelBenchmarkReport,
)
from ml.models.iogp_multilabel import IOGPMultiLabelClassifier


class TestMultiLabelMetrics:

    def test_perfect_exact_match(self):
        evaluator = MultiLabelEvaluator(rules=["RuleA", "RuleB", "RuleC"])
        y_true = [{"RuleA", "RuleB"}, {"RuleC"}, set()]
        y_pred = [{"RuleA", "RuleB"}, {"RuleC"}, set()]

        report = evaluator.calculate_metrics(
            y_true_list=y_true,
            y_pred_list=y_pred,
            primary_true_list=["RuleA", "RuleC", "None"],
            primary_pred_list=["RuleA", "RuleC", "None"]
        )

        assert report.total_samples == 3
        assert report.subset_accuracy == 1.0
        assert report.hamming_loss == 0.0
        assert report.jaccard_similarity == 1.0
        assert report.macro_f1 == 1.0
        assert report.micro_f1 == 1.0
        assert report.primary_rule_accuracy == 1.0

    def test_hamming_loss_computation(self):
        evaluator = MultiLabelEvaluator(rules=["RuleA", "RuleB", "RuleC"])
        # Total bits = 2 samples * 3 rules = 6 bits
        # Sample 1: true={A, B}, pred={A} -> 1 false negative (RuleB) = 1 bit wrong
        # Sample 2: true={C}, pred={C, B} -> 1 false positive (RuleB) = 1 bit wrong
        # Total bits wrong = 2 / 6 = 0.3333
        y_true = [{"RuleA", "RuleB"}, {"RuleC"}]
        y_pred = [{"RuleA"}, {"RuleC", "RuleB"}]

        report = evaluator.calculate_metrics(y_true, y_pred)
        assert report.subset_accuracy == 0.0
        assert abs(report.hamming_loss - (2.0 / 6.0)) < 0.001
        assert report.per_rule_metrics["RuleA"].precision == 1.0
        assert report.per_rule_metrics["RuleA"].recall == 1.0
        assert report.per_rule_metrics["RuleB"].precision == 0.0
        assert report.per_rule_metrics["RuleB"].recall == 0.0

    def test_negative_controls_jaccard(self):
        evaluator = MultiLabelEvaluator(rules=["RuleA", "RuleB"])
        y_true = [set(), set()]
        y_pred = [set(), set()]
        report = evaluator.calculate_metrics(y_true, y_pred)
        assert report.subset_accuracy == 1.0
        assert report.jaccard_similarity == 1.0
        assert report.hamming_loss == 0.0

    def test_golden_benchmark_evaluation_success(self):
        clf = IOGPMultiLabelClassifier()
        evaluator = MultiLabelEvaluator()
        report = evaluator.evaluate_golden_benchmark(clf, "data/evaluation/golden_benchmark.json")

        assert isinstance(report, MultiLabelBenchmarkReport)
        assert report.total_samples == 124
        assert report.hamming_loss < 0.10
        assert report.macro_f1 > 0.70
        assert report.micro_f1 > 0.70
        assert report.primary_rule_accuracy > 0.80
        assert len(report.per_rule_metrics) == 9
        assert report.average_latency_ms < 10.0
