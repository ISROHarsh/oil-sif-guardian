"""
Active Learning Prioritization Engine (Phase 20).
Optimizes expert HSE reviewer time by sampling high-information borderline reports,
model/rule disagreements, rare operational equipment, and vocabulary shift cases.
"""

from typing import List, Dict, Any, Optional
import math
import re
from pydantic import BaseModel, Field


class ActiveLearningCandidate(BaseModel):
    report_id: str
    narrative: str
    installation: str
    psif_probability: float
    model_priority: str
    rule_priority: str
    disagreement: bool
    information_value_score: float
    uncertainty_score: float
    sampling_reasons: List[str]
    suggested_action: str = "EXPERT_LABEL_REQUIRED"
    novel_terms: List[str] = []


class ActiveLearningSampler:
    """
    Heuristic-calibrated active learning sampler prioritizing:
    1. Maximum entropy / margin uncertainty (p ~ 0.50)
    2. Model vs Rule disagreement
    3. Rare equipment & hazardous energy exposures
    4. Out-of-distribution / novel terminology
    """

    RARE_EQUIPMENT = {
        "snubbing unit", "wireline unit", "coiled tubing", "top drive", "bop accumulator",
        "separator vessel", "desander", "pig launcher", "mud gas separator", "christmas tree"
    }

    KNOWN_CORE_VOCABULARY = {
        "tank", "permit", "gas", "confined", "space", "crane", "lift", "flange", "valve",
        "pressure", "drill", "rig", "pump", "pipe", "line", "fire", "ppe", "fall", "harness",
        "scaffold", "attendant", "spark", "hot", "work", "cold", "loto", "isolation", "leak"
    }

    def compute_information_value(
        self,
        psif_probability: float,
        model_priority: str,
        rule_priority: str,
        narrative: str,
        entities: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        reasons: List[str] = []
        score = 0.0

        # 1. Uncertainty Score (Peak at p = 0.50)
        dist_from_threshold = abs(psif_probability - 0.50)
        uncertainty = max(0.0, 1.0 - (dist_from_threshold * 2.0))
        score += uncertainty * 0.40

        if 0.40 <= psif_probability <= 0.60:
            reasons.append(f"Borderline probability ({psif_probability:.2f}) near decision threshold")
        elif uncertainty > 0.6:
            reasons.append(f"Moderate probability ambiguity ({psif_probability:.2f})")

        # 2. Model vs Rule Disagreement
        disagreement = False
        m_p = (model_priority or "LOW").upper()
        r_p = (rule_priority or "NONE").upper()
        if r_p not in ("NONE", "LOW") and m_p in ("LOW", "REVIEW"):
            disagreement = True
            score += 0.35
            reasons.append(f"Model ({m_p}) vs Deterministic Safety Rule ({r_p}) conflict")
        elif m_p == "HIGH" and r_p in ("NONE", "LOW"):
            disagreement = True
            score += 0.25
            reasons.append(f"Model signaled HIGH priority without matching deterministic rule")

        # 3. Rare Equipment & Extreme Energy Exposure
        text_lower = narrative.lower()
        matched_rare = [eq for eq in self.RARE_EQUIPMENT if eq in text_lower]
        if matched_rare:
            score += 0.15
            reasons.append(f"Rare operational equipment identified: {', '.join(matched_rare)}")

        # 4. Vocabulary Novelty / Out-of-Distribution
        tokens = re.findall(r"\b[a-z]{4,}\b", text_lower)
        novel_tokens = [t for t in set(tokens) if t not in self.KNOWN_CORE_VOCABULARY]
        flagged_novel = [t for t in novel_tokens if any(kw in t for kw in ["hydro", "toxic", "rupt", "valve", "blast", "vent", "spill", "hazard"])]
        if flagged_novel:
            score += 0.15
            reasons.append(f"Specialized novel terminology detected: {', '.join(flagged_novel[:3])}")

        # Normalize score to [0.0, 1.0]
        final_info_score = min(1.0, max(0.05, round(score, 4)))

        if not reasons:
            reasons.append("Routine operational sample for distribution validation")

        return {
            "information_value_score": final_info_score,
            "uncertainty_score": round(uncertainty, 4),
            "disagreement": disagreement,
            "sampling_reasons": reasons,
            "novel_terms": flagged_novel[:5]
        }

    def prioritize_reports(
        self,
        reports_data: List[Dict[str, Any]],
        limit: int = 20
    ) -> List[ActiveLearningCandidate]:
        candidates: List[ActiveLearningCandidate] = []

        for r in reports_data:
            narrative = r.get("narrative", "")
            prob = float(r.get("psif_probability", 0.50))
            m_p = r.get("model_priority", "LOW")
            r_p = r.get("rule_priority", "NONE")

            eval_res = self.compute_information_value(
                psif_probability=prob,
                model_priority=m_p,
                rule_priority=r_p,
                narrative=narrative,
                entities=r.get("entities")
            )

            candidates.append(
                ActiveLearningCandidate(
                    report_id=r.get("report_id", "UNKNOWN"),
                    narrative=narrative,
                    installation=r.get("installation", "Duliajan Production Bay"),
                    psif_probability=prob,
                    model_priority=m_p,
                    rule_priority=r_p,
                    disagreement=eval_res["disagreement"],
                    information_value_score=eval_res["information_value_score"],
                    uncertainty_score=eval_res["uncertainty_score"],
                    sampling_reasons=eval_res["sampling_reasons"],
                    suggested_action="EXPERT_LABEL_REQUIRED" if eval_res["information_value_score"] >= 0.50 else "STANDARD_SAMPLING",
                    novel_terms=eval_res["novel_terms"]
                )
            )

        candidates.sort(key=lambda c: c.information_value_score, reverse=True)
        return candidates[:limit]


active_learning_sampler = ActiveLearningSampler()
