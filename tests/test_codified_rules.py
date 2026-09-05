"""
OIL-SIF Guardian — Codified Safety Rulebook & Deterministic Veto Tests
Validates catalog schema integrity, regulatory statutory citations,
zero-tolerance stop-work veto enforcement, and 100% High-PSIF golden recall guarantee.
"""

import json
import os
import pytest
from rules.safety.catalog import CODIFIED_SAFETY_CATALOG, RuleSeverity, CodifiedRuleDefinition
from rules.safety.deterministic_rules import DeterministicSafetyRuleEngine
from ml.models.iogp_multilabel import CANONICAL_IOGP_RULES


def test_codified_catalog_integrity():
    """Verify that the codified safety catalog meets architectural and regulatory completeness."""
    assert len(CODIFIED_SAFETY_CATALOG) >= 35

    covered_categories = set()
    for rule_id, rule_def in CODIFIED_SAFETY_CATALOG.items():
        assert rule_id == rule_def.rule_id
        assert rule_id.startswith("RULE-")
        assert len(rule_def.rule_name) > 5
        assert isinstance(rule_def.severity, RuleSeverity)
        assert len(rule_def.description) > 10
        assert len(rule_def.failure_mechanism) > 10
        assert len(rule_def.regulatory_standard) > 5
        assert len(rule_def.stop_work_action) > 10
        assert isinstance(rule_def.prescribed_safeguards, list)
        covered_categories.add(rule_def.iogp_category)

    # Check all canonical 9 IOGP rules are covered in the catalog
    for canon in CANONICAL_IOGP_RULES:
        assert canon in covered_categories, f"Canonical IOGP rule '{canon}' missing from catalog"


def test_zero_tolerance_veto_with_catalog_enrichment():
    """Verify that a fatal precursor triggers zero-tolerance veto with full audit trail."""
    engine = DeterministicSafetyRuleEngine()
    narrative = (
        "Contractor fitter entered crude separator vessel TK-101 without atmospheric gas test or "
        "positive isolation blind while attendant left his post."
    )
    result = engine.evaluate(narrative, title="Separator Vessel Internal Inspection")

    assert result["mandatory_high_psif"] is True
    assert result["stop_work_required"] is True
    assert result["severity_level"] == RuleSeverity.ZERO_TOLERANCE_FATAL.value
    assert len(result["triggered_rule_details"]) > 0

    first_detail = result["triggered_rule_details"][0]
    assert "RULE-CS-001" in first_detail["rule_id"]
    assert "OISD" in first_detail["regulatory_standard"]
    assert "Stop-Work" in first_detail["stop_work_action"]

    # Audit trail verification
    assert len(result["audit_trail"]) > 0
    audit_entry = result["audit_trail"][0]
    assert audit_entry["action_status"] == "VETO_ENFORCED"
    assert audit_entry["rule_id"] == "RULE-CS-001"


def test_toxic_atmosphere_zero_tolerance():
    """Verify H2S / sour gas escape triggers zero-tolerance emergency evacuation protocol."""
    engine = DeterministicSafetyRuleEngine()
    narrative = "Pinhole leak on wellhead flowline released sour gas with high H2S concentration near manifold."
    result = engine.evaluate(narrative)

    assert result["mandatory_high_psif"] is True
    assert result["stop_work_required"] is True
    assert any("RULE-TOXIC-001" in r for r in result["triggered_rules"])
    assert any(d["rule_id"] == "RULE-TOXIC-001" for d in result["triggered_rule_details"])

    toxic_detail = next(d for d in result["triggered_rule_details"] if d["rule_id"] == "RULE-TOXIC-001")
    assert "OISD-STD-155" in toxic_detail["regulatory_standard"]
    assert "DGMS" in toxic_detail["regulatory_standard"]


def test_negative_control_suppression():
    """Verify benign non-industrial records are safely suppressed without false alarm."""
    engine = DeterministicSafetyRuleEngine()
    narrative = "Accounts clerk ordered stationery requisition and replenished ballpoint pens in administrative office."
    result = engine.evaluate(narrative, title="Office Stationery Order")

    assert result["mandatory_high_psif"] is False
    assert result["stop_work_required"] is False
    assert result["is_benign"] is True
    assert result["severity_level"] == RuleSeverity.BENIGN_ADMINISTRATIVE.value
    assert len(result["audit_trail"]) == 1
    assert result["audit_trail"][0]["status"] == "NEGATIVE_CONTROL_SUPPRESSED"


def test_golden_benchmark_100_percent_recall():
    """
    CRITICAL RULE: Deterministic safety guardrail overrule must guarantee
    100.0% recall on all true High-PSIF events in the 124-event golden evaluation benchmark.
    """
    benchmark_path = os.path.join("data", "evaluation", "golden_benchmark.json")
    assert os.path.exists(benchmark_path), "Golden benchmark file must exist"

    with open(benchmark_path, "r", encoding="utf-8") as f:
        benchmarks = json.load(f)

    engine = DeterministicSafetyRuleEngine()

    high_psif_events = [b for b in benchmarks if b.get("ground_truth", {}).get("psif_priority") == "HIGH"]
    assert len(high_psif_events) == 80, f"Expected 80 High-PSIF events in golden set, found {len(high_psif_events)}"

    detected_count = 0
    missed_events = []

    for event in high_psif_events:
        narrative = event.get("narrative", "")
        title = event.get("title", "")
        res = engine.evaluate(narrative, title)
        if res["mandatory_high_psif"]:
            detected_count += 1
        else:
            missed_events.append(event.get("benchmark_id", "UNKNOWN"))

    recall = detected_count / len(high_psif_events)
    assert recall == 1.0, f"Failed 100% recall guarantee! Detected: {detected_count}/{len(high_psif_events)}. Missed: {missed_events}"
