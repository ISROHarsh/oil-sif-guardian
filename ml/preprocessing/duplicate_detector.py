"""
OIL-SIF Guardian — Duplicate & Near-Duplicate Incident Detector.
Detects duplicate safety reports using exact hashing, character/token n-gram
Jaccard similarity, and operational context matching.
"""

from typing import List, Dict, Any, Optional, Set
import hashlib
import re


class DuplicateDetector:
    """
    Identifies duplicate and near-duplicate incident reports across historical batches.
    Prevents redundant HSE queue alerts and double-counting in precursor trends.
    """

    def __init__(self, exact_threshold: float = 0.98, near_threshold: float = 0.75):
        self.exact_threshold = exact_threshold
        self.near_threshold = near_threshold

    @staticmethod
    def compute_hash(text: str) -> str:
        """Computes SHA-256 checksum of lowercased, whitespace-collapsed text."""
        cleaned = re.sub(r"\s+", " ", text.lower().strip())
        return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

    @staticmethod
    def _get_ngrams(text: str, n: int = 3) -> Set[str]:
        cleaned = re.sub(r"[^\w\s]", "", text.lower())
        words = cleaned.split()
        if not words:
            return set()
        
        # Combine token unigrams and character 3-grams for robust matching
        token_set = set(words)
        char_ngrams = set()
        for word in words:
            if len(word) >= n:
                for i in range(len(word) - n + 1):
                    char_ngrams.add(word[i:i+n])
            else:
                char_ngrams.add(word)
        return token_set.union(char_ngrams)

    def calculate_similarity(self, text_a: str, text_b: str) -> float:
        """
        Calculates Jaccard similarity across combined token and character n-grams.
        Returns float between 0.0 and 1.0.
        """
        if not text_a or not text_b:
            return 0.0

        if text_a.strip().lower() == text_b.strip().lower():
            return 1.0

        set_a = self._get_ngrams(text_a)
        set_b = self._get_ngrams(text_b)

        if not set_a or not set_b:
            return 0.0

        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))

        return intersection / union if union > 0 else 0.0

    def find_duplicates(
        self,
        new_text: str,
        metadata: Optional[Dict[str, Any]] = None,
        existing_reports: Optional[List[Dict[str, Any]]] = None,
        threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Scans new report against a list of existing reports.
        Each existing report dict must have at least {'id': ..., 'raw_text': ...}
        Optional metadata fields: 'location', 'event_date', 'equipment_involved'.
        """
        if not existing_reports or not new_text:
            return []

        active_threshold = threshold or self.near_threshold
        new_hash = self.compute_hash(new_text)
        metadata = metadata or {}
        new_loc = str(metadata.get("location") or "").lower().strip()
        new_date = str(metadata.get("event_date") or "").strip()

        matches = []
        for existing in existing_reports:
            ex_id = existing.get("id") or existing.get("report_id")
            ex_text = existing.get("raw_text") or existing.get("text") or ""
            if not ex_text:
                continue

            ex_hash = self.compute_hash(ex_text)
            if new_hash == ex_hash:
                matches.append({
                    "match_id": ex_id,
                    "similarity": 1.0,
                    "match_type": "EXACT",
                    "reason": "Exact hash match after normalization."
                })
                continue

            sim = self.calculate_similarity(new_text, ex_text)
            if sim >= self.exact_threshold:
                matches.append({
                    "match_id": ex_id,
                    "similarity": round(sim, 3),
                    "match_type": "EXACT_EQUIVALENT",
                    "reason": f"Near-identical wording with similarity score {sim:.1%}."
                })
            elif sim >= active_threshold:
                # Check contextual overlap
                ex_meta = existing.get("metadata") or existing
                ex_loc = str(ex_meta.get("location") or "").lower().strip()
                ex_date = str(ex_meta.get("event_date") or "").strip()
                same_context = bool(new_loc and ex_loc and new_loc == ex_loc) and bool(new_date and ex_date and new_date == ex_date)

                matches.append({
                    "match_id": ex_id,
                    "similarity": round(sim, 3),
                    "match_type": "CONTEXTUAL_NEAR_DUPLICATE" if same_context else "NEAR_DUPLICATE",
                    "reason": f"Significant textual overlap ({sim:.1%})" + (" with identical location and date." if same_context else ".")
                })

        # Sort by highest similarity first
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        return matches
