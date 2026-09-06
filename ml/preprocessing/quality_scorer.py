"""
OIL-SIF Guardian — Data Quality Scorer.
Computes comprehensive quality, richness, and completeness scores (0-100)
for incident narrative and contextual metadata.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import re


@dataclass
class QualityScoreResult:
    score: float
    grade: str
    dimension_scores: Dict[str, float]
    issues: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": round(self.score, 1),
            "grade": self.grade,
            "dimension_scores": {k: round(v, 1) for k, v in self.dimension_scores.items()},
            "issues": self.issues,
            "recommendations": self.recommendations,
        }


class DataQualityScorer:
    """
    Evaluates incident report quality based on 4 domain dimensions:
    1. Narrative Depth & Structure (30%)
    2. Metadata Completeness (25%)
    3. Hazard & Energy Specificity (25%)
    4. Barrier & Control Failure Detail (20%)
    """

    CAUSAL_INDICATORS = [
        "because", "due to", "as a result", "resulting in", "caused by",
        "consequence", "failed", "failure", "ruptured", "leaked", "dropped",
        "struck", "ignited", "triggered", "while", "during", "when"
    ]

    ENERGY_AND_HAZARD_TERMS = [
        "pressure", "psi", "bar", "h2s", "gas", "hydrocarbon", "crude",
        "voltage", "electric", "height", "fall", "crane", "hoist", "suspended",
        "rig", "wellhead", "piping", "line", "flange", "valve", "manifold",
        "tank", "separator", "drilling", "chemical", "toxic", "acid",
        "fire", "explosion", "confined space", "trench", "excavation"
    ]

    BARRIER_TERMS = [
        "ptw", "permit", "jsa", "loto", "lockout", "isolation", "blind",
        "ppe", "harness", "lanyard", "lifeline", "gas detector", "lel",
        "interlock", "relief valve", "prv", "psv", "esd", "scada",
        "guard", "barricade", "signage", "procedure", "smp", "sop",
        "toolbox", "tbt", "bop", "preventer"
    ]

    def __init__(self):
        self._energy_regex = re.compile(
            r"\b(" + "|".join(re.escape(t) for t in self.ENERGY_AND_HAZARD_TERMS) + r")\b",
            re.IGNORECASE
        )
        self._barrier_regex = re.compile(
            r"\b(" + "|".join(re.escape(t) for t in self.BARRIER_TERMS) + r")\b",
            re.IGNORECASE
        )
        self._units_regex = re.compile(
            r"\b\d+(?:\.\d+)?\s*(?:psi|bar|kpa|mpa|kg|lbs|v|volt|kv|m|meters|ft|feet|ppm|%|c|f)\b",
            re.IGNORECASE
        )

    def score_report(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> QualityScoreResult:
        if not text or not text.strip():
            return QualityScoreResult(
                score=0.0,
                grade="F",
                dimension_scores={
                    "narrative_depth": 0.0,
                    "metadata_completeness": 0.0,
                    "hazard_specificity": 0.0,
                    "barrier_information": 0.0
                },
                issues=["Incident narrative is completely empty or missing."],
                recommendations=["Provide a descriptive narrative explaining what happened, where, and what equipment was involved."]
            )

        metadata = metadata or {}
        text_clean = text.strip()
        words = text_clean.split()
        word_count = len(words)
        lower_text = text_clean.lower()

        issues: List[str] = []
        recommendations: List[str] = []

        # 1. Narrative Depth (Max 30 pts)
        narrative_score = 0.0
        if word_count < 10:
            narrative_score += 5.0
            issues.append("Narrative is extremely brief (<10 words), lacking situational context.")
            recommendations.append("Elaborate on sequence of events leading up to the incident.")
        elif word_count < 25:
            narrative_score += 15.0
            issues.append("Narrative is concise (<25 words); additional operational context is beneficial.")
        elif word_count < 50:
            narrative_score += 24.0
        else:
            narrative_score += 27.0

        # Causal linkage bonus (up to 3 pts)
        causal_matches = sum(1 for c in self.CAUSAL_INDICATORS if c in lower_text)
        if causal_matches >= 2:
            narrative_score = min(30.0, narrative_score + 3.0)
        elif causal_matches == 1:
            narrative_score = min(30.0, narrative_score + 1.5)
        else:
            recommendations.append("Specify the direct mechanism or cause of the incident (e.g. 'due to', 'failed when').")

        # 2. Metadata Completeness (Max 25 pts)
        meta_score = 0.0
        if metadata.get("location") or metadata.get("site"):
            meta_score += 7.0
        else:
            issues.append("Missing specific geographic or field location.")
            recommendations.append("Record the exact well, rig, EPS, or pipeline section name.")

        if metadata.get("operational_area") or metadata.get("facility") or metadata.get("department"):
            meta_score += 6.0
        else:
            recommendations.append("Tag the operational area (e.g., Drilling, Production, Workover).")

        if metadata.get("event_date") or metadata.get("shift") or metadata.get("timestamp") or metadata.get("reporter_role"):
            meta_score += 6.0
        else:
            issues.append("Missing event date, shift timing, or reporter role.")

        if metadata.get("equipment_involved") or metadata.get("equipment_tag") or metadata.get("immediate_action_taken"):
            meta_score += 6.0
        else:
            recommendations.append("Log equipment tag/number and any immediate mitigation taken.")

        # 3. Hazard & Energy Specificity (Max 25 pts)
        hazard_score = 0.0
        hazard_matches = len(set(self._energy_regex.findall(lower_text)))
        if hazard_matches >= 4:
            hazard_score += 16.0
        elif hazard_matches >= 2:
            hazard_score += 12.0
        elif hazard_matches >= 1:
            hazard_score += 7.0
        else:
            issues.append("No specific high-hazard energies or equipment identified in narrative.")
            recommendations.append("Explicitly state energy sources present (e.g. pressure, toxic gas, suspended load).")

        # Quantifiable values (up to 9 pts)
        unit_matches = len(self._units_regex.findall(lower_text))
        if unit_matches >= 2:
            hazard_score = min(25.0, hazard_score + 9.0)
        elif unit_matches == 1:
            hazard_score = min(25.0, hazard_score + 5.0)

        # 4. Barrier & Control Information (Max 20 pts)
        barrier_score = 0.0
        barrier_matches = set(self._barrier_regex.findall(lower_text))
        if len(barrier_matches) >= 3:
            barrier_score += 15.0
        elif len(barrier_matches) >= 2:
            barrier_score += 11.0
        elif len(barrier_matches) >= 1:
            barrier_score += 7.0
        else:
            issues.append("No safety barriers, permits, or controls mentioned.")
            recommendations.append("Document status of controls: PTW, LOTO, gas detection, PPE, or physical guards.")

        # Barrier state indicators (failed, missing, bypassed, verified)
        barrier_states = ["bypassed", "missing", "failed", "tripped", "defective", "ignored", "inadequate", "valid", "active"]
        if any(s in lower_text for s in barrier_states) and barrier_matches:
            barrier_score = min(20.0, barrier_score + 5.0)

        # Total Calculation
        total = narrative_score + meta_score + hazard_score + barrier_score
        total = max(0.0, min(100.0, total))

        if total >= 85:
            grade = "A"
        elif total >= 70:
            grade = "B"
        elif total >= 55:
            grade = "C"
        elif total >= 40:
            grade = "D"
        else:
            grade = "F"

        return QualityScoreResult(
            score=total,
            grade=grade,
            dimension_scores={
                "narrative_depth": narrative_score,
                "metadata_completeness": meta_score,
                "hazard_specificity": hazard_score,
                "barrier_information": barrier_score
            },
            issues=issues,
            recommendations=recommendations
        )
