"""
Unit tests for Domain Ontology, OIL facilities, equipment taxonomies, and regulatory standards.
"""

import os
import json
import pytest

TERMS_PATH = os.path.join("rules", "dictionaries", "safety_terms.json")


def test_safety_terms_json_exists_and_valid():
    assert os.path.exists(TERMS_PATH), "safety_terms.json does not exist"
    with open(TERMS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "abbreviations" in data
    assert "oil_facilities" in data
    assert "oil_operating_areas" in data
    assert "equipment" in data
    assert "hazards" in data
    assert "failure_modes" in data
    assert "energy_sources" in data
    assert "regulatory_frameworks" in data


def test_oil_facilities_taxonomy():
    with open(TERMS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    facilities = data["oil_facilities"]
    assert len(facilities) >= 15
    # Check for specific OIL operations
    assert any("OIL-45" in f for f in facilities)
    assert any("OIL-78" in f for f in facilities)
    assert any("EPS" in f for f in facilities)
    assert any("OCS" in f for f in facilities)
    assert any("GCP" in f for f in facilities)


def test_oil_operating_areas():
    with open(TERMS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    areas = data["oil_operating_areas"]
    assert "Duliajan" in areas
    assert "Naharkatia" in areas
    assert "Moran" in areas
    assert "Digboi" in areas
    assert "Baghjan" in areas


def test_indian_regulatory_standards():
    with open(TERMS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    regs = data["regulatory_frameworks"]
    assert len(regs) >= 4
    codes = [r["code"] for r in regs]
    assert any("OISD" in c for c in codes)
    assert any("DGMS" in c for c in codes)
    assert any("PNGRB" in c for c in codes)


def test_energy_sources_coverage():
    with open(TERMS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    energies = data["energy_sources"]
    expected = ["pressure", "mechanical", "gravity", "chemical", "thermal", "electrical"]
    for e in expected:
        assert e in energies
        assert len(energies[e]) > 0
