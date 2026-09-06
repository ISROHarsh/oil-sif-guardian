"""
OIL-SIF Guardian — Multi-Label Evaluation Suite
Comprehensive multi-label evaluation metrics for IOGP Life-Saving Rules:
Hamming Loss, Subset Accuracy (Exact Match Ratio), Jaccard Index, Micro/Macro F1,
and per-rule precision/recall breakdowns across the 124-event Golden Evaluation Dataset.
"""

import json
import time
from typing import List, Dict, Any, Set, Tuple, Optional
from dataclasses import dataclass, field, asdict
from ml.models.iogp_multilabel import IOGPMultiLabelClassifier, CANONICAL_IOGP_RULES


@dataclass
class PerRuleMetric:
    rule_name: str
    true_positives: int
    false_positives: int
    false_negatives: int
    true_negatives: int
    support: int
    precision: float
    recall: float
    f1: float


@dataclass
class MultiLabelBenchmarkReport:
    total_samples: int
    hamming_loss: float
    subset_accuracy: float
    jaccard_similarity: float
    micro_precision: float
    micro_recall: float
    micro_f1: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    primary_rule_accuracy: float
    per_rule_metrics: Dict[str, PerRuleMetric]
    average_latency_ms: float
    evaluated_at: str


class MultiLabelEvaluator:
    """
    Computes standard multi-label metrics for multi-output safety models.
    """

    def __init__(self, rules: Optional[List[str]] = None):
        self.rules = list(rules or CANONICAL_IOGP_RULES)

    def calculate_metrics(
        self,
        y_true_list: List[Set[str]],
        y_pred_list: List[Set[str]],
        primary_true_list: Optional[List[str]] = None,
        primary_pred_list: Optional[List[str]] = None,
        latencies: Optional[List[float]] = None
    ) -> MultiLabelBenchmarkReport:
        """
        Calculates Hamming Loss, Subset Accuracy, Micro/Macro F1, and per-rule metrics.
        """
        n_samples = len(y_true_list)
        if n_samples == 0:
            raise ValueError("Evaluation requires at least one sample.")

        n_labels = len(self.rules)
        total_bits = n_samples * n_labels
        incorrect_bits = 0
        exact_matches = 0
        jaccard_sum = 0.0

        per_rule_tp = {r: 0 for r in self.rules}
        per_rule_fp = {r: 0 for r in self.rules}
        per_rule_fn = {r: 0 for r in self.rules}
        per_rule_tn = {r: 0 for r in self.rules}

        for i in range(n_samples):
            true_set = y_true_list[i]
            pred_set = y_pred_list[i]

            # Exact Match (Subset Accuracy)
            if true_set == pred_set:
                exact_matches += 1

            # Jaccard / Multi-label sample accuracy
            union = true_set | pred_set
            intersection = true_set & pred_set
            if not union:
                # Both empty: perfect match on negative control
                jaccard_sum += 1.0
            else:
                jaccard_sum += len(intersection) / len(union)

            # Per-label bits
            for r in self.rules:
                in_true = r in true_set
                in_pred = r in pred_set

                if in_true and in_pred:
                    per_rule_tp[r] += 1
                elif not in_true and in_pred:
                    per_rule_fp[r] += 1
                    incorrect_bits += 1
                elif in_true and not in_pred:
                    per_rule_fn[r] += 1
                    incorrect_bits += 1
                else:
                    per_rule_tn[r] += 1

        hamming_loss = round(incorrect_bits / total_bits, 4)
        subset_acc = round(exact_matches / n_samples, 4)
        jaccard = round(jaccard_sum / n_samples, 4)

        # Micro Metrics
        total_tp = sum(per_rule_tp.values())
        total_fp = sum(per_rule_fp.values())
        total_fn = sum(per_rule_fn.values())

        micro_p = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
        micro_r = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
        micro_f1 = (2.0 * micro_p * micro_r / (micro_p + micro_r)) if (micro_p + micro_r) > 0 else 0.0

        # Per-Rule Metrics and Macro Metrics
        per_rule_results: Dict[str, PerRuleMetric] = {}
        macro_p_sum = 0.0
        macro_r_sum = 0.0
        macro_f1_sum = 0.0

        for r in self.rules:
            tp = per_rule_tp[r]
            fp = per_rule_fp[r]
            fn = per_rule_fn[r]
            tn = per_rule_tn[r]
            support = tp + fn

            p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = (2.0 * p * rec / (p + rec)) if (p + rec) > 0 else 0.0

            macro_p_sum += p
            macro_r_sum += rec
            macro_f1_sum += f1

            per_rule_results[r] = PerRuleMetric(
                rule_name=r,
                true_positives=tp,
                false_positives=fp,
                false_negatives=fn,
                true_negatives=tn,
                support=support,
                precision=round(p, 4),
                recall=round(rec, 4),
                f1=round(f1, 4)
            )

        macro_p = round(macro_p_sum / n_labels, 4)
        macro_r = round(macro_r_sum / n_labels, 4)
        macro_f1 = round(macro_f1_sum / n_labels, 4)

        # Primary Rule Accuracy
        primary_acc = 0.0
        if primary_true_list and primary_pred_list:
            pri_matches = sum(
                1 for t, p in zip(primary_true_list, primary_pred_list) if t == p
            )
            primary_acc = round(pri_matches / n_samples, 4)

        avg_lat = round(sum(latencies) / len(latencies), 3) if latencies else 0.0

        return MultiLabelBenchmarkReport(
            total_samples=n_samples,
            hamming_loss=hamming_loss,
            subset_accuracy=subset_acc,
            jaccard_similarity=jaccard,
            micro_precision=round(micro_p, 4),
            micro_recall=round(micro_r, 4),
            micro_f1=round(micro_f1, 4),
            macro_precision=macro_p,
            macro_recall=macro_r,
            macro_f1=macro_f1,
            primary_rule_accuracy=primary_acc,
            per_rule_metrics=per_rule_results,
            average_latency_ms=avg_lat,
            evaluated_at=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        )

    def evaluate_golden_benchmark(
        self,
        classifier: IOGPMultiLabelClassifier,
        benchmark_path: str = "data/evaluation/golden_benchmark.json"
    ) -> MultiLabelBenchmarkReport:
        """
        Loads all 124 golden evaluation scenarios and executes end-to-end multi-label evaluation.
        """
        with open(benchmark_path, "r", encoding="utf-8") as f:
            scenarios = json.load(f)

        y_true_list: List[Set[str]] = []
        y_pred_list: List[Set[str]] = []
        primary_true_list: List[str] = []
        primary_pred_list: List[str] = []
        latencies: List[float] = []

        for item in scenarios:
            narrative = item.get("narrative", "")
            gt = item.get("ground_truth", {})
            pri = gt.get("primary_iogp_rule", "None")
            secs = gt.get("secondary_iogp_rules", [])

            true_rules = set()
            if pri and pri != "None" and pri in self.rules:
                true_rules.add(pri)
            for s in secs:
                if s and s != "None" and s in self.rules:
                    true_rules.add(s)

            t0 = time.perf_counter()
            pred = classifier.predict(narrative)
            lat_ms = (time.perf_counter() - t0) * 1000.0
            latencies.append(lat_ms)

            pred_rules = set(pred.triggered_rules)

            y_true_list.append(true_rules)
            y_pred_list.append(pred_rules)
            primary_true_list.append(pri if pri in self.rules else "None")
            primary_pred_list.append(pred.primary_rule)

        return self.calculate_metrics(
            y_true_list=y_true_list,
            y_pred_list=y_pred_list,
            primary_true_list=primary_true_list,
            primary_pred_list=primary_pred_list,
            latencies=latencies
        )
