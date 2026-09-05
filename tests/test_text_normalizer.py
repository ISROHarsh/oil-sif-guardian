"""
Unit Tests for TextNormalizer (Unicode NFKC, Abbreviation Expansion, Punctuation Standardization).
"""

import pytest
from ml.preprocessing.normalizer import TextNormalizer


@pytest.fixture
def normalizer():
    return TextNormalizer()


def test_unicode_normalization_and_quotes(normalizer):
    text = "“Contractor entered vessel… BOP test was not completed!”"
    result = normalizer.normalize(text)
    assert '"' in result
    assert "..." in result
    assert "Blowout Preventer" in result


def test_oilfield_abbreviation_expansion(normalizer):
    text = "PTW was expired and LOTO was missing on the separator. H2S alarm was sounding."
    result = normalizer.normalize(text)
    assert "Permit to Work" in result
    assert "Lockout / Tagout" in result
    assert "Hydrogen Sulfide" in result


def test_preserves_technical_units_and_tags(normalizer):
    text = "Wellhead pressure was 5000 psi at 15m depth on line V-102 with 440V motor."
    result = normalizer.normalize(text)
    assert "5000 psi" in result
    assert "15m" in result
    assert "V-102" in result
    assert "440V" in result


def test_empty_and_whitespace_handling(normalizer):
    assert normalizer.normalize("") == ""
    assert normalizer.normalize("   \n\t  ") == ""
    multi_space = "Rig     floor    cleaning"
    assert normalizer.normalize(multi_space) == "Rig floor cleaning"
