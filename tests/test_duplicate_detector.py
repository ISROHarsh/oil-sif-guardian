"""
Unit Tests for DuplicateDetector (Exact Hashes, Near-Duplicates, Contextual Overlap).
"""

import pytest
from ml.preprocessing.duplicate_detector import DuplicateDetector


@pytest.fixture
def detector():
    return DuplicateDetector(exact_threshold=0.95, near_threshold=0.70)


def test_exact_hash_match(detector):
    text1 = "Contractor entered separator tank without gas testing or permit."
    text2 = "  contractor entered separator tank without gas testing or permit.  "
    existing = [{"id": "REP-001", "raw_text": text1}]
    matches = detector.find_duplicates(text2, existing_reports=existing)
    assert len(matches) == 1
    assert matches[0]["match_type"] == "EXACT"
    assert matches[0]["similarity"] == 1.0


def test_near_duplicate_match(detector):
    text1 = "Contractor entered separator tank without gas testing or permit on shift B."
    text2 = "Contractor entered separator vessel without gas testing or permit during shift B."
    existing = [{"id": "REP-001", "raw_text": text1}]
    matches = detector.find_duplicates(text2, existing_reports=existing)
    assert len(matches) == 1
    assert matches[0]["similarity"] >= 0.70
    assert matches[0]["match_id"] == "REP-001"


def test_distinct_reports_no_duplicate(detector):
    text1 = "Crane wire rope snapped during pipe hoist on drilling rig floor."
    text2 = "Contractor slipped on oily stairway near chemical injection skid."
    existing = [{"id": "REP-001", "raw_text": text1}]
    matches = detector.find_duplicates(text2, existing_reports=existing)
    assert len(matches) == 0
