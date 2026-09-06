"""
Unit Tests for PrecursorSimilarityEngine (Vector Retrieval, Ranking, and Cosine Distance).
"""

import pytest
from ml.search.similarity_engine import PrecursorSimilarityEngine


@pytest.fixture
def sim_engine():
    return PrecursorSimilarityEngine()


def test_similarity_engine_corpus_loaded(sim_engine):
    assert len(sim_engine.corpus) > 0
    assert len(sim_engine.doc_vectors) == len(sim_engine.corpus)
    assert len(sim_engine.idf) > 100


def test_find_similar_confined_space(sim_engine):
    query = "Contractor entered separator vessel without atmosphere gas testing and without standby watch."
    matches = sim_engine.find_similar(query, top_k=3, min_score=0.10)
    assert len(matches) > 0
    top = matches[0]
    assert top["similarity_score"] > 0.15
    assert "Confined Space" in [top["primary_rule"]] + top.get("secondary_rules", [])
    assert len(top["shared_keywords"]) > 0


def test_find_similar_crane_lifting(sim_engine):
    query = "Crane hoist line parted while lifting drill collar, load dropped near mud pump area."
    matches = sim_engine.find_similar(query, top_k=3, min_score=0.10)
    assert len(matches) > 0
    top = matches[0]
    assert top["similarity_score"] >= 0.10
    assert top["priority"] in ["HIGH", "REVIEW"]


def test_find_similar_unrelated_returns_low_or_empty(sim_engine):
    query = "Quantum computing qubit entanglement algorithm with superconducting circuits."
    matches = sim_engine.find_similar(query, top_k=3, min_score=0.20)
    assert len(matches) == 0
