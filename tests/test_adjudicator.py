"""
Unit Tests for AdjudicationEngine (Automated Consensus, Dispute Routing, and Lead Resolution).
"""

import pytest
from ml.annotation.adjudicator import AdjudicationEngine


@pytest.fixture
def adjudicator():
    return AdjudicationEngine()


def test_adjudicate_pair_consensus(adjudicator):
    ann_a = {
        "raw_text": "Contractor entered vessel without permit.",
        "is_psif": True,
        "priority": "HIGH",
        "primary_rule": "Confined Space",
        "evidence_spans": [{"start_char": 0, "end_char": 20, "category": "EXPOSURE"}]
    }
    ann_b = {
        "raw_text": "Contractor entered vessel without permit.",
        "is_psif": True,
        "priority": "HIGH",
        "primary_rule": "Confined Space",
        "evidence_spans": [{"start_char": 0, "end_char": 20, "category": "EXPOSURE"}]
    }
    result = adjudicator.adjudicate_pair("REP-001", ann_a, ann_b)
    assert result["status"] == "CONSENSUS_APPROVED"
    assert result["is_psif"] is True
    assert result["priority"] == "HIGH"
    assert result["primary_rule"] == "Confined Space"
    assert len(result["conflicts"]) == 0


def test_adjudicate_pair_conflict_routing(adjudicator):
    ann_a = {
        "raw_text": "Crane moved load over walkway.",
        "is_psif": True,
        "priority": "HIGH",
        "primary_rule": "Safe Mechanical Lifting"
    }
    ann_b = {
        "raw_text": "Crane moved load over walkway.",
        "is_psif": False,
        "priority": "REVIEW",
        "primary_rule": "Line of Fire"
    }
    result = adjudicator.adjudicate_pair("REP-002", ann_a, ann_b)
    assert result["status"] == "REQUIRES_LEAD_ADJUDICATION"
    assert len(result["conflicts"]) >= 2
    assert "annotator_a" in result
    assert "annotator_b" in result


def test_resolve_dispute_by_lead(adjudicator):
    dispute_item = {
        "item_id": "REP-002",
        "raw_text": "Crane moved load over walkway.",
        "conflicts": ["Priority Conflict"]
    }
    resolved = adjudicator.resolve_dispute(
        dispute_item=dispute_item,
        lead_id="LEAD-SAFETY-01",
        final_is_psif=True,
        final_priority="HIGH",
        final_primary_rule="Safe Mechanical Lifting",
        rationale="Load slewed directly over active personnel; high kinetic potential."
    )
    assert resolved["status"] == "LEAD_ADJUDICATED"
    assert resolved["adjudicated_by"] == "LEAD-SAFETY-01"
    assert resolved["priority"] == "HIGH"
    assert "high kinetic potential" in resolved["adjudication_notes"]
