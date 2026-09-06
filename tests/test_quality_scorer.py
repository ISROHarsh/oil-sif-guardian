"""
Unit Tests for DataQualityScorer (Completeness, Detail, Energy Specificity, Barrier Information).
"""

import pytest
from ml.preprocessing.quality_scorer import DataQualityScorer


@pytest.fixture
def scorer():
    return DataQualityScorer()


def test_high_quality_detailed_report(scorer):
    text = (
        "During line clearing on separator V-102 at 1200 psi, crude oil leaked due to flange failure. "
        "The PTW was valid but isolation LOTO was bypassed. Attendant closed ESD valve immediately."
    )
    metadata = {
        "location": "Separator Station #4",
        "operational_area": "Production Installation",
        "event_date": "2026-03-01",
        "equipment_involved": "Separator V-102"
    }
    result = scorer.score_report(text, metadata)
    assert result.score >= 70.0
    assert result.grade in ["A", "B"]
    assert result.dimension_scores["narrative_depth"] > 20.0
    assert result.dimension_scores["hazard_specificity"] > 15.0
    assert result.dimension_scores["barrier_information"] > 10.0


def test_low_quality_sparse_report(scorer):
    text = "Gas leak observed."
    metadata = {}
    result = scorer.score_report(text, metadata)
    assert result.score < 50.0
    assert result.grade in ["D", "F"]
    assert len(result.issues) >= 2
    assert len(result.recommendations) >= 2


def test_empty_narrative(scorer):
    result = scorer.score_report("")
    assert result.score == 0.0
    assert result.grade == "F"
    assert "Incident narrative is completely empty" in result.issues[0]
