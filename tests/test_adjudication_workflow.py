"""
Unit Tests for HITLAdjudicationEngine (Validation, Veto Protection, Agreement & Drift Metrics).
"""

import pytest
from ml.annotation.adjudicator import HITLAdjudicationEngine


def test_validate_adjudication_confirm_valid():
    res = HITLAdjudicationEngine.validate_adjudication(
        ai_priority="HIGH",
        is_veto_enforced=True,
        requested_priority="HIGH",
        decision="CONFIRMED",
        reviewer_role="HSE_OFFICER",
        reviewer_notes="Confirmed confined space entry without gas testing."
    )
    assert res["is_valid"] is True
    assert res["decision"] == "CONFIRMED"
    assert res["final_priority"] == "HIGH"
    assert res["veto_override_approved"] is False
    assert res["recalibration_flag"] is False


def test_validate_adjudication_modify_valid():
    res = HITLAdjudicationEngine.validate_adjudication(
        ai_priority="REVIEW",
        is_veto_enforced=False,
        requested_priority="HIGH",
        decision="MODIFIED",
        reviewer_role="HSE_OFFICER",
        reviewer_notes="Upgrading to HIGH: live electrical lines exposed directly to work crew.",
        override_reason_code="PRECURSOR_CONFIRMED"
    )
    assert res["is_valid"] is True
    assert res["decision"] == "MODIFIED"
    assert res["final_priority"] == "HIGH"
    assert res["recalibration_flag"] is True


def test_validate_adjudication_veto_downgrade_rejected_for_standard_role():
    with pytest.raises(ValueError, match="Statutory Safety Veto Invariant.*cannot be downgraded by role 'HSE_OFFICER'"):
        HITLAdjudicationEngine.validate_adjudication(
            ai_priority="HIGH",
            is_veto_enforced=True,
            requested_priority="LOW",
            decision="MODIFIED",
            reviewer_role="HSE_OFFICER",
            reviewer_notes="Vessel was actually de-pressurized and certified clean before entry.",
            override_reason_code="ENERGY_MITIGATED"
        )


def test_validate_adjudication_veto_downgrade_rejected_for_short_notes():
    with pytest.raises(ValueError, match="requires at least 30 characters"):
        HITLAdjudicationEngine.validate_adjudication(
            ai_priority="HIGH",
            is_veto_enforced=True,
            requested_priority="LOW",
            decision="MODIFIED",
            reviewer_role="HSE_LEAD",
            reviewer_notes="Safe.",
            override_reason_code="ENERGY_MITIGATED"
        )


def test_validate_adjudication_veto_downgrade_rejected_for_missing_reason_code():
    with pytest.raises(ValueError, match="valid override_reason_code is required"):
        HITLAdjudicationEngine.validate_adjudication(
            ai_priority="HIGH",
            is_veto_enforced=True,
            requested_priority="LOW",
            decision="MODIFIED",
            reviewer_role="SAFETY_MANAGER",
            reviewer_notes="Physical air gap isolation was installed and verified by certified instrument engineer.",
            override_reason_code=None
        )


def test_validate_adjudication_veto_downgrade_accepted_with_senior_signoff():
    res = HITLAdjudicationEngine.validate_adjudication(
        ai_priority="HIGH",
        is_veto_enforced=True,
        requested_priority="LOW",
        decision="MODIFIED",
        reviewer_role="HSE_OFFICER",
        reviewer_notes="Physical air gap isolation verified by certified instrument engineer; 0 LEL confirmed.",
        senior_signoff_by="HSE-CHIEF-01",
        override_reason_code="ENERGY_MITIGATED"
    )
    assert res["is_valid"] is True
    assert res["veto_override_approved"] is True
    assert res["final_priority"] == "LOW"
    assert res["recalibration_flag"] is True


def test_validate_adjudication_veto_downgrade_accepted_with_senior_role():
    res = HITLAdjudicationEngine.validate_adjudication(
        ai_priority="HIGH",
        is_veto_enforced=True,
        requested_priority="REVIEW",
        decision="MODIFIED",
        reviewer_role="SAFETY_MANAGER",
        reviewer_notes="Secondary containment remained intact and line pressure was isolated to 0 bar.",
        override_reason_code="ENERGY_MITIGATED"
    )
    assert res["is_valid"] is True
    assert res["veto_override_approved"] is True
    assert res["final_priority"] == "REVIEW"


def test_compute_metrics_empty():
    metrics = HITLAdjudicationEngine.compute_metrics(
        total_reports=10,
        pending_count=10,
        high_pending_count=3,
        adjudicated_records=[]
    )
    assert metrics["adjudicated_count"] == 0
    assert metrics["agreement_rate"] == 1.0
    assert metrics["drift_status"] == "NORMAL"


def test_compute_metrics_normal_alignment():
    records = [
        {"ai_priority": "HIGH", "final_priority": "HIGH", "override_reason_code": "PRECURSOR_CONFIRMED"},
        {"ai_priority": "HIGH", "final_priority": "HIGH", "override_reason_code": "PRECURSOR_CONFIRMED"},
        {"ai_priority": "REVIEW", "final_priority": "REVIEW", "override_reason_code": None},
        {"ai_priority": "LOW", "final_priority": "LOW", "override_reason_code": None},
        {"ai_priority": "HIGH", "final_priority": "HIGH", "override_reason_code": "PRECURSOR_CONFIRMED"},
    ]
    metrics = HITLAdjudicationEngine.compute_metrics(
        total_reports=10,
        pending_count=5,
        high_pending_count=2,
        adjudicated_records=records
    )
    assert metrics["adjudicated_count"] == 5
    assert metrics["agreement_rate"] == 1.0
    assert metrics["high_psif_agreement_rate"] == 1.0
    assert metrics["drift_status"] == "NORMAL"


def test_compute_metrics_drift_detection():
    # 3 out of 5 AI Highs downgraded -> 40% High agreement -> triggers DRIFT_DETECTED
    records = [
        {"ai_priority": "HIGH", "final_priority": "LOW", "override_reason_code": "ENERGY_MITIGATED"},
        {"ai_priority": "HIGH", "final_priority": "REVIEW", "override_reason_code": "FALSE_POSITIVE_KEYWORD"},
        {"ai_priority": "HIGH", "final_priority": "LOW", "override_reason_code": "ADMINISTRATIVE_ONLY"},
        {"ai_priority": "HIGH", "final_priority": "HIGH", "override_reason_code": "PRECURSOR_CONFIRMED"},
        {"ai_priority": "HIGH", "final_priority": "HIGH", "override_reason_code": "PRECURSOR_CONFIRMED"},
    ]
    metrics = HITLAdjudicationEngine.compute_metrics(
        total_reports=15,
        pending_count=10,
        high_pending_count=4,
        adjudicated_records=records
    )
    assert metrics["adjudicated_count"] == 5
    assert metrics["high_psif_agreement_rate"] == 0.40
    assert metrics["drift_status"] == "DRIFT_DETECTED"
    assert len(metrics["recommendations"]) >= 2
