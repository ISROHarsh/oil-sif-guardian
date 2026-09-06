"""
Unit Tests for InterAnnotatorAgreement (Cohen's Kappa, Krippendorff's Alpha, Span F1 / IoU).
"""

import pytest
from ml.annotation.inter_annotator_agreement import InterAnnotatorAgreement


@pytest.fixture
def engine():
    return InterAnnotatorAgreement()


def test_cohens_kappa_perfect_agreement(engine):
    labels_a = ["HIGH", "LOW", "HIGH", "REVIEW", "LOW"]
    labels_b = ["HIGH", "LOW", "HIGH", "REVIEW", "LOW"]
    kappa = engine.calculate_cohens_kappa(labels_a, labels_b)
    assert kappa == 1.0
    assert "Almost Perfect" in engine.interpret_kappa(kappa)


def test_cohens_kappa_partial_agreement(engine):
    labels_a = ["HIGH", "HIGH", "LOW", "LOW", "HIGH", "REVIEW"]
    labels_b = ["HIGH", "REVIEW", "LOW", "LOW", "HIGH", "REVIEW"]
    kappa = engine.calculate_cohens_kappa(labels_a, labels_b)
    assert 0.60 <= kappa < 1.0
    assert "Substantial" in engine.interpret_kappa(kappa) or "Almost Perfect" in engine.interpret_kappa(kappa)


def test_cohens_kappa_complete_disagreement(engine):
    labels_a = ["HIGH", "HIGH", "HIGH"]
    labels_b = ["LOW", "LOW", "LOW"]
    kappa = engine.calculate_cohens_kappa(labels_a, labels_b)
    assert kappa <= 0.0


def test_krippendorffs_alpha_nominal(engine):
    # 4 items evaluated by 2 annotators with 1 disagreement
    matrix = [
        ["HIGH", "HIGH"],
        ["LOW", "LOW"],
        ["REVIEW", "REVIEW"],
        ["HIGH", "REVIEW"]
    ]
    alpha = engine.calculate_krippendorffs_alpha_nominal(matrix)
    assert alpha > 0.50


def test_span_overlap_jaccard_and_f1(engine):
    spans_a = [{"start_char": 10, "end_char": 30, "category": "HAZARD"}]
    spans_b = [{"start_char": 15, "end_char": 30, "category": "HAZARD"}]
    # Intersection = 15..30 (15 chars), Union = 10..30 (20 chars)
    # IoU = 15/20 = 0.75
    overlap = engine.calculate_span_overlap(spans_a, spans_b)
    assert overlap["char_iou"] == 0.75
    assert overlap["char_f1"] > 0.80


def test_full_agreement_report_generation(engine):
    batch_a = [
        {
            "item_id": "ITEM-1",
            "is_psif": True,
            "priority": "HIGH",
            "primary_rule": "Confined Space",
            "evidence_spans": [{"start_char": 0, "end_char": 20}]
        },
        {
            "item_id": "ITEM-2",
            "is_psif": False,
            "priority": "LOW",
            "primary_rule": "None",
            "evidence_spans": []
        }
    ]
    batch_b = [
        {
            "item_id": "ITEM-1",
            "is_psif": True,
            "priority": "HIGH",
            "primary_rule": "Confined Space",
            "evidence_spans": [{"start_char": 0, "end_char": 20}]
        },
        {
            "item_id": "ITEM-2",
            "is_psif": False,
            "priority": "LOW",
            "primary_rule": "None",
            "evidence_spans": []
        }
    ]
    report = engine.generate_full_report(batch_a, batch_b)
    assert report["total_items"] == 2
    assert report["disagreement_count"] == 0
    assert report["metrics"]["cohens_kappa_psif"] == 1.0
    assert report["metrics"]["meets_quality_targets"] is True
