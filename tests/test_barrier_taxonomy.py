"""
Unit tests for Hierarchical Barrier Taxonomy, Swiss Cheese classifications, and degradation analysis.
"""

import pytest
from rules.barriers.barrier_taxonomy import (
    barrier_analyzer,
    BarrierCategory,
    BarrierState,
    BarrierAnalyzer
)


def test_barrier_catalog_completeness():
    catalog = barrier_analyzer.BARRIER_CATALOG
    assert len(catalog) >= 10

    categories = {b.category for b in catalog.values()}
    assert BarrierCategory.HARDWARE in categories
    assert BarrierCategory.ADMINISTRATIVE in categories
    assert BarrierCategory.HUMAN_ACTION in categories


def test_barrier_analysis_confined_space_failure():
    narrative = (
        "During maintenance at EPS-1, contractor entered crude oil separator without "
        "atmospheric gas testing and the standby attendant was absent."
    )
    result = barrier_analyzer.analyze(narrative)

    assert result.has_critical_failure is True
    assert result.sif_barrier_flag == "CRITICAL_FAILURE"
    assert result.barrier_health_score < 0.60
    assert len(result.detected_barriers) >= 2

    # Verify detected barriers
    b_ids = [b.barrier_id for b in result.detected_barriers]
    assert "HW-F&G-01" in b_ids or "HA-WATCH-01" in b_ids

    # Check degradation states
    states = [b.state for b in result.detected_barriers]
    assert BarrierState.ABSENT in states or BarrierState.FAILED in states


def test_barrier_analysis_energy_isolation_failure():
    narrative = (
        "Technician cracked open the 3-inch flowline flange on Rig OIL-45 without LOTO "
        "and without verifying zero energy. Residual pressure of 350 psi blew past the gasket."
    )
    result = barrier_analyzer.analyze(narrative)

    assert result.has_critical_failure is True
    assert result.barrier_health_score < 0.60
    b_ids = [b.barrier_id for b in result.detected_barriers]
    assert "AD-LOTO-01" in b_ids or "HW-CONT-01" in b_ids


def test_barrier_analysis_safe_lift_drop_zone():
    narrative = (
        "Roustabout stood directly under the suspended casing joint during pipe pickup "
        "without banksman signal."
    )
    result = barrier_analyzer.analyze(narrative)

    assert result.has_critical_failure is True
    b_ids = [b.barrier_id for b in result.detected_barriers]
    assert "HA-POS-01" in b_ids or "HA-RIGG-01" in b_ids


def test_barrier_analysis_intact_routine_inspection():
    narrative = (
        "HSE officer completed monthly visual inspection of fire extinguishers in office hallway. "
        "Pressure gauges were all within green zone."
    )
    result = barrier_analyzer.analyze(narrative)

    assert result.has_critical_failure is False
    assert result.barrier_health_score >= 0.80
    assert result.sif_barrier_flag in ("NONE_DETECTED", "EFFECTIVE")
