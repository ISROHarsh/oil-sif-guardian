"""
Tests for Safety Information Extraction Engine (NER, Gazetteers, BIO Tagging).
Verifies exact substring matching, character offsets, non-overlapping constraints,
and BIO tagging consistency according to Rule 2 of ENGINEERING_RULES.md.
"""

import pytest
from ml.extraction.safety_ner import SafetyNER, SafetyEntityCategory, EntitySpan, BIOTag


@pytest.fixture
def ner_engine():
    return SafetyNER()


class TestSafetyNER:

    def test_initialization_and_stats(self, ner_engine):
        stats = ner_engine.get_taxonomy_statistics()
        assert "supported_categories" in stats
        assert len(stats["supported_categories"]) == 8
        assert stats["builtin_terms_count"] > 100
        assert stats["trie_entries_loaded"] > 100
        assert stats["regex_patterns_count"] >= 5

    def test_exact_character_offsets_and_substring_match(self, ner_engine):
        narrative = (
            "During vessel cleanout at Early Production System EPS-1, workers were exposed to "
            "h2s gas inside separator vessel due to gas test omitted, resulting in fatal asphyxiation."
        )
        spans = ner_engine.extract_entities(narrative)

        assert len(spans) >= 4

        for span in spans:
            # Absolute constraint: character offsets must slice the exact substring from raw narrative!
            sliced = narrative[span.start_char:span.end_char]
            assert sliced == span.text, f"Mismatch: expected '{span.text}', got '{sliced}' at [{span.start_char}:{span.end_char}]"
            assert span.start_char >= 0
            assert span.end_char <= len(narrative)
            assert span.start_char < span.end_char

    def test_no_overlapping_spans(self, ner_engine):
        narrative = (
            "Rig OIL-45 experienced high pressure gas kick of 5000 psi during casing hoisting. "
            "Workers under suspended load in drop zone faced dropped object fatality because "
            "whip check unlatched and banksman absent."
        )
        spans = ner_engine.extract_entities(narrative)

        # Ensure spans are sorted by start_char
        for i in range(len(spans) - 1):
            curr_span = spans[i]
            next_span = spans[i + 1]
            assert curr_span.end_char <= next_span.start_char, (
                f"Overlap detected between span '{curr_span.text}' [{curr_span.start_char}:{curr_span.end_char}] "
                f"and '{next_span.text}' [{next_span.start_char}:{next_span.end_char}]"
            )

    def test_eight_safety_categories_represented(self, ner_engine):
        sample_scenarios = {
            SafetyEntityCategory.ACTIVITY: "Contractor was engaged in hydrotesting of gathering line.",
            SafetyEntityCategory.HAZARD: "Presence of h2s gas in dangerous concentrations.",
            SafetyEntityCategory.HAZARDOUS_ENERGY: "Accumulation of stored hydraulic pressure in line.",
            SafetyEntityCategory.WORKER_EXPOSURE: "Roustabout situated inside separator vessel without clearance.",
            SafetyEntityCategory.CRITICAL_CONTROL: "Double block and bleed was requested before opening valve.",
            SafetyEntityCategory.CONTROL_FAILURE: "Permit not issued and gas test omitted prior to entry.",
            SafetyEntityCategory.EQUIPMENT: "Testing the blowout preventer and choke manifold at wellhead.",
            SafetyEntityCategory.CREDIBLE_CONSEQUENCE: "Risk of fatal asphyxiation or crush fatality.",
        }

        for cat, text in sample_scenarios.items():
            spans = ner_engine.extract_entities(text)
            categories = [s.label for s in spans]
            assert cat in categories, f"Expected category {cat} to be extracted from '{text}', found: {categories}"

    def test_pattern_extraction_psi_and_kv_and_rigs(self, ner_engine):
        narrative = "Drilling Rig OIL-45 recorded 3500 psi line pack near 3.3 kv switchgear complying with OISD-105."
        spans = ner_engine.extract_entities(narrative)

        texts = [s.text.lower() for s in spans]
        labels = [s.label for s in spans]

        assert any("3500 psi" in t for t in texts)
        assert any("3.3 kv" in t for t in texts)
        assert any("oil-45" in t for t in texts)
        assert any("oisd-105" in t for t in texts)

    def test_bio_tagging_consistency(self, ner_engine):
        narrative = "During hot work at EPS-1, gas test omitted causing flash fire fatality."
        bio_tags = ner_engine.generate_bio_tags(narrative)

        assert len(bio_tags) > 0

        for idx, b in enumerate(bio_tags):
            # Token matches slice
            sliced = narrative[b.start_char:b.end_char]
            assert sliced == b.token, f"Token mismatch at [{b.start_char}:{b.end_char}]: '{b.token}' vs '{sliced}'"

            # Check BIO transition rules
            if b.tag.startswith("I-"):
                category = b.tag[2:]
                assert idx > 0, f"Sequence cannot begin with I-tag: {b.tag}"
                prev_tag = bio_tags[idx - 1].tag
                assert prev_tag in (f"B-{category}", f"I-{category}"), (
                    f"Invalid transition from {prev_tag} to {b.tag} at index {idx}"
                )

    def test_empty_and_whitespace_narratives(self, ner_engine):
        assert ner_engine.extract_entities("") == []
        assert ner_engine.extract_entities("   \n\t  ") == []
        assert ner_engine.generate_bio_tags("") == []
