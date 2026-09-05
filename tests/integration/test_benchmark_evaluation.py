"""
Integration Test: Evaluates Platform Performance Against Locked Golden Benchmark (124 Scenarios).
"""

import json
from pathlib import Path
import pytest
from backend.app.services.triage_service import triage_service

BENCHMARK_PATH = Path(__file__).resolve().parents[2] / "data" / "evaluation" / "golden_benchmark.json"


def test_golden_benchmark_file_exists():
    assert BENCHMARK_PATH.exists()
    with open(BENCHMARK_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert len(data) >= 100


def test_system_performance_on_golden_benchmark():
    with open(BENCHMARK_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    total = len(records)
    high_psif_tp = 0
    high_psif_fn = 0
    high_psif_fp = 0
    correct_rules = 0

    for r in records:
        gt = r["ground_truth"]
        gt_priority = gt["psif_priority"]
        gt_rule = gt["primary_iogp_rule"]

        triage_res = triage_service.triage(
            narrative=r["narrative"],
            activity=r.get("activity", "Maintenance")
        )

        pred_priority = triage_res.psif.priority
        pred_rule = None
        for rule in triage_res.life_saving_rules:
            if rule.is_primary:
                pred_rule = rule.rule_name
                break
        if not pred_rule and triage_res.life_saving_rules:
            pred_rule = triage_res.life_saving_rules[0].rule_name

        # Track High PSIF Recall (critical safety metric)
        if gt_priority == "HIGH":
            if pred_priority == "HIGH":
                high_psif_tp += 1
            else:
                high_psif_fn += 1
        else:
            if pred_priority == "HIGH":
                high_psif_fp += 1

        # Track Rule Match
        if gt_rule is None:
            if not pred_rule or len(triage_res.life_saving_rules) == 0:
                correct_rules += 1
        else:
            if pred_rule == gt_rule or any(x.rule_name == gt_rule for x in triage_res.life_saving_rules):
                correct_rules += 1

    high_psif_recall = high_psif_tp / (high_psif_tp + high_psif_fn)
    rule_match_rate = correct_rules / total

    print(f"\n--- Golden Benchmark Evaluation ---")
    print(f"Total Evaluated: {total}")
    print(f"High-PSIF True Positives: {high_psif_tp}")
    print(f"High-PSIF False Negatives: {high_psif_fn}")
    print(f"High-PSIF False Positives: {high_psif_fp}")
    print(f"High-PSIF Recall: {high_psif_recall:.1%}")
    print(f"IOGP Rule Match Rate: {rule_match_rate:.1%}")

    # Safety Assertions:
    # 1. High-PSIF Recall must be >= 75% (safety-critical detection)
    assert high_psif_recall >= 0.75, f"High-PSIF Recall {high_psif_recall:.1%} fell below minimum safety target of 75%!"
    # 2. Rule Match Rate must be >= 70%
    assert rule_match_rate >= 0.70, f"Rule Match Rate {rule_match_rate:.1%} fell below target of 70%!"
