"""
Automated Integration Tests for Curated Golden Precursor Scenarios.
Verifies the complete triage engine across the golden regression suite.
"""

import json
from pathlib import Path
from backend.app.services.triage_service import triage_service


def test_all_golden_scenarios():
    fixture_path = Path(__file__).resolve().parents[1] / "fixtures" / "golden_reports.json"
    assert fixture_path.exists(), "golden_reports.json fixture missing"

    with open(fixture_path, "r", encoding="utf-8") as f:
        scenarios = json.load(f)

    assert len(scenarios) >= 10, "Golden suite must contain at least 10 scenarios"

    for sc in scenarios:
        result = triage_service.triage(sc["narrative"])

        # Check Priority
        expected_priority = sc["expected_priority"]
        actual_priority = result.psif.priority

        if expected_priority == "HIGH":
            assert actual_priority == "HIGH", f"Scenario {sc['id']} ({sc['name']}) expected HIGH priority, got {actual_priority}"
        elif expected_priority == "LOW":
            assert actual_priority in ["LOW", "REVIEW"], f"Scenario {sc['id']} ({sc['name']}) expected LOW/REVIEW, got {actual_priority}"

        # Check Expected Rules (if specified)
        tagged_rule_names = [r.rule_name for r in result.life_saving_rules]
        for exp_rule in sc.get("expected_rules", []):
            assert exp_rule in tagged_rule_names, f"Scenario {sc['id']} expected rule '{exp_rule}' in {tagged_rule_names}"

        # Ensure Exposure Fingerprint is generated
        assert len(result.exposure_fingerprint) > 5
        assert "|" in result.exposure_fingerprint

        # Ensure Safety Reasoning is non-empty
        assert len(result.safety_reasoning) > 0
