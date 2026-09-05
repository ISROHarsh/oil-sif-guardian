"""
Unit tests for DeterministicSafetyRuleEngine.
Verifies critical precursor signals on canonical oilfield scenarios.
"""

import sys
import os

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rules.safety.deterministic_rules import DeterministicSafetyRuleEngine


def test_confined_space_rule_trigger():
    engine = DeterministicSafetyRuleEngine()
    narrative = (
        "During maintenance, a contractor entered the tank to inspect an internal valve. "
        "Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside."
    )
    result = engine.evaluate(narrative)
    assert result["mandatory_high_psif"] is True
    assert any("RULE-CS-001" in r for r in result["triggered_rules"])
    assert any("RULE-WA-001" in r for r in result["triggered_rules"])
    assert "Confined Space" in result["suggested_rules"]
    assert "Work Authorization" in result["suggested_rules"]


def test_energy_isolation_rule_trigger():
    engine = DeterministicSafetyRuleEngine()
    narrative = "Fitter opened a pressurized gas line for valve replacement without isolation and LOTO verification."
    result = engine.evaluate(narrative)
    assert result["mandatory_high_psif"] is True
    assert any("RULE-EI-001" in r for r in result["triggered_rules"])
    assert "Energy Isolation" in result["suggested_rules"]


def test_lifting_line_of_fire_trigger():
    engine = DeterministicSafetyRuleEngine()
    narrative = "Rigger stood directly underneath the suspended load while crane was hoisting a 2-ton drill collar."
    result = engine.evaluate(narrative)
    assert result["mandatory_high_psif"] is True
    assert any("RULE-LIFT-001" in r for r in result["triggered_rules"])
    assert "Safe Mechanical Lifting" in result["suggested_rules"]
    assert "Line of Fire" in result["suggested_rules"]


def test_working_at_height_trigger():
    engine = DeterministicSafetyRuleEngine()
    narrative = "Roustabout was observed on the derrick monkey board working at height without safety harness tie-off."
    result = engine.evaluate(narrative)
    assert result["mandatory_high_psif"] is True
    assert any("RULE-WAH-001" in r for r in result["triggered_rules"])
    assert "Working at Height" in result["suggested_rules"]


def test_benign_event_does_not_trigger_mandatory_psif():
    engine = DeterministicSafetyRuleEngine()
    narrative = "Operator conducted routine visual perimeter walk around office building. Good housekeeping noted."
    result = engine.evaluate(narrative)
    assert result["mandatory_high_psif"] is False
    assert len(result["triggered_rules"]) == 0
    assert len(result["suggested_rules"]) == 0
