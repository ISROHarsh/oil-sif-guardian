"""
Unit tests for SIF Exposure Fingerprinting, Precursor Clustering, and Network Graph Generation.
"""

import pytest
from backend.app.services.precursor_cluster_service import (
    precursor_cluster_service,
    PrecursorClusterService
)


def test_generate_fingerprint_confined_space():
    narrative = "Contractor entered crude oil separator without gas testing and attendant had left."
    fp = precursor_cluster_service.generate_fingerprint(
        narrative, activity="Vessel Inspection", site="EPS-1"
    )

    assert fp.activity == "VESSEL_ENTRY"
    assert "CHEMICAL" in fp.hazardous_energy or "TOXIC" in fp.hazardous_energy
    assert "CONFINED" in fp.hazard
    assert fp.iogp_rule == "Confined Space"
    assert "|" in fp.raw_fingerprint
    components = fp.raw_fingerprint.split("|")
    assert len(components) == 5


def test_generate_fingerprint_energy_isolation():
    narrative = "Pipefitter opened live flowline without LOTO isolation. Trapped pressure 200 psi."
    fp = precursor_cluster_service.generate_fingerprint(
        narrative, activity="Valve Maintenance", site="Drilling Rig OIL-45"
    )

    assert "PRESSURE" in fp.hazardous_energy
    assert fp.iogp_rule == "Energy Isolation"
    assert "LOTO" in fp.barrier_failure or "ISOLATION" in fp.barrier_failure


def test_cluster_incidents_grouping():
    sample_incidents = [
        {
            "id": "INC-01",
            "title": "Tank entry without gas testing",
            "text": "Worker entered crude separator without gas testing and attendant was absent",
            "activity": "Vessel Cleanout",
            "site": "EPS-1",
            "priority": "HIGH"
        },
        {
            "id": "INC-02",
            "title": "Frac tank entry no testing",
            "text": "Technician stepped inside frac tank without gas testing certificate",
            "activity": "Internal Inspection",
            "site": "OCS-1 Naharkatia",
            "priority": "HIGH"
        },
        {
            "id": "INC-03",
            "title": "Rig floor hoist drop zone",
            "text": "Roustabout walked under suspended drill pipe on rig floor",
            "activity": "Lifting",
            "site": "Drilling Rig OIL-78",
            "priority": "HIGH"
        }
    ]

    clusters = precursor_cluster_service.cluster_incidents(sample_incidents)
    assert len(clusters) >= 2

    # Check for Confined Space cluster
    cs_clusters = [c for c in clusters if c["primary_iogp_rule"] == "Confined Space"]
    assert len(cs_clusters) >= 1
    total_cs_reports = sum(c["reports_count"] for c in cs_clusters)
    assert total_cs_reports == 2


def test_generate_cluster_graph():
    sample_incidents = [
        {
            "id": "INC-01",
            "title": "Tank entry without gas testing",
            "text": "Worker entered crude separator without gas testing",
            "site": "EPS-1",
            "priority": "HIGH"
        },
        {
            "id": "INC-02",
            "title": "Unbolted flange under pressure",
            "text": "Worker opened 300 psi line without loto",
            "site": "Drilling Rig OIL-45",
            "priority": "HIGH"
        }
    ]

    graph = precursor_cluster_service.generate_cluster_graph(sample_incidents)
    assert "nodes" in graph
    assert "links" in graph
    assert graph["total_nodes"] > 0
    assert graph["total_links"] > 0

    node_types = {n["type"] for n in graph["nodes"]}
    assert "CLUSTER" in node_types
    assert "ASSET" in node_types
    assert "BARRIER" in node_types
