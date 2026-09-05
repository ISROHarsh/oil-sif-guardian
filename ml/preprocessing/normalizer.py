"""
OIL-SIF Guardian — Text Normalization Engine.
Cleans raw text, handles character encodings, and expands oilfield abbreviations
while preserving critical domain numbers, pressure ratings, and equipment tags.
"""

import unicodedata
import re
import json
from pathlib import Path
from typing import Dict, Optional


class TextNormalizer:
    def __init__(self, dictionary_path: Optional[Path] = None):
        self.abbreviations = self._load_abbreviations(dictionary_path)
        self._compile_abbreviation_patterns()

    def _load_abbreviations(self, dict_path: Optional[Path]) -> Dict[str, str]:
        if dict_path is None:
            dict_path = Path(__file__).resolve().parents[2] / "rules" / "dictionaries" / "safety_terms.json"

        if dict_path.exists():
            try:
                with open(dict_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("abbreviations", {})
            except Exception:
                pass

        # Fallback default Oilfield abbreviations
        return {
            "PTW": "Permit to Work",
            "JSA": "Job Safety Analysis",
            "JHA": "Job Hazard Analysis",
            "LOTO": "Lockout / Tagout",
            "BOP": "Blowout Preventer",
            "H2S": "Hydrogen Sulfide",
            "LEL": "Lower Explosive Limit",
            "TBT": "Toolbox Talk",
            "PPE": "Personal Protective Equipment",
            "SCBA": "Self-Contained Breathing Apparatus",
            "ESP": "Electrical Submersible Pump",
            "DBB": "Double Block and Bleed",
            "MOC": "Management of Change",
            "SIMOPS": "Simultaneous Operations",
            "DG": "Diesel Generator",
            "MCC": "Motor Control Center",
            "OCS": "Oil Collecting Station",
            "UPS": "Uninterruptible Power Supply"
        }

    def _compile_abbreviation_patterns(self):
        # Sort by key length descending so multi-word acronyms match first
        self.abbr_patterns = []
        for abbr, expansion in sorted(self.abbreviations.items(), key=lambda x: len(x[0]), reverse=True):
            # Match whole words only, case-insensitive
            pattern = re.compile(rf"\b{re.escape(abbr)}\b", re.IGNORECASE)
            self.abbr_patterns.append((pattern, f"{abbr} ({expansion})"))

    def normalize(self, text: str, expand_abbreviations: bool = True) -> str:
        """
        Executes complete normalization pipeline on an incident narrative:
        1. Unicode normalization (NFKC)
        2. Control character removal
        3. Whitespace standardization
        4. Oilfield abbreviation expansion (optional, default True)
        """
        if not text:
            return ""

        # 1. Unicode normalization (compatibility decomposition followed by canonical composition)
        cleaned = unicodedata.normalize("NFKC", text)

        # 2. Strip non-printable / control characters (keep standard newlines and tabs)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", cleaned)

        # 3. Standardize quotes and hyphens
        cleaned = re.sub(r"[\u2018\u2019\u201a\u201b]", "'", cleaned)
        cleaned = re.sub(r"[\u201c\u201d\u201e\u201f]", '"', cleaned)
        cleaned = re.sub(r"[\u2010\u2011\u2012\u2013\u2014\u2015]", "-", cleaned)

        # 4. Standardize spacing around punctuation
        cleaned = re.sub(r"\s+", " ", cleaned)
        cleaned = re.sub(r"\s+([,.:;!?])", r"\1", cleaned)

        # 5. Expand domain abbreviations while preserving original identifier in parens
        if expand_abbreviations:
            for pattern, replacement in self.abbr_patterns:
                # Avoid expanding if already expanded in parens
                cleaned = pattern.sub(replacement, cleaned)
                # Cleanup potential double expansions like PTW (Permit to Work) (Permit to Work)
                double_pattern = re.compile(r"(\([A-Za-z /]+\))\s*\1", re.IGNORECASE)
                cleaned = double_pattern.sub(r"\1", cleaned)

        return cleaned.strip()
