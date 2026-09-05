"""
OIL-SIF Guardian — Token Attribution & Explainable Saliency Heatmap Engine
Computes token-level importance scores and maps them to exact character offsets
in the raw narrative for transparent, auditable model explainability.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Tuple, Optional
from ml.models.sequence_classifier import ContextualSequenceClassifier, ModelPredictionResult


@dataclass
class TokenAttributionItem:
    token: str
    saliency_score: float  # Normalized between -1.0 (strongly mitigates) to +1.0 (strongly amplifies High PSIF)
    start_char: int
    end_char: int
    role: str  # RISK_AMPLIFIER, NEUTRAL_CONTEXT, SAFETY_MITIGATOR
    color_hex: str
    rationale: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class TokenAttributionResult:
    narrative: str
    tokens: List[TokenAttributionItem]
    top_risk_amplifiers: List[Dict[str, Any]]
    top_mitigators: List[Dict[str, Any]]
    saliency_balance: float  # > 0 indicates risk-dominated; < 0 indicates safety-dominated
    predicted_sif_class: str
    confidence_level: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "narrative": self.narrative,
            "tokens": [t.to_dict() for t in self.tokens],
            "top_risk_amplifiers": self.top_risk_amplifiers,
            "top_mitigators": self.top_mitigators,
            "saliency_balance": self.saliency_balance,
            "predicted_sif_class": self.predicted_sif_class,
            "confidence_level": self.confidence_level,
        }


class TokenAttributionEngine:
    """
    Computes explainable token saliencies directly grounded in raw narrative character offsets.
    """

    def __init__(self, classifier: Optional[ContextualSequenceClassifier] = None):
        self.classifier = classifier or ContextualSequenceClassifier()

    def explain(self, narrative: str) -> TokenAttributionResult:
        """
        Extracts token attributions with exact character spans from raw narrative.
        """
        if not narrative or not narrative.strip():
            return TokenAttributionResult(
                narrative="",
                tokens=[],
                top_risk_amplifiers=[],
                top_mitigators=[],
                saliency_balance=0.0,
                predicted_sif_class="LOW",
                confidence_level="LOW"
            )

        pred = self.classifier.predict(narrative)
        raw_attentions = pred.attention_weights  # list of (tok, weight, s_c, e_c)

        token_items: List[TokenAttributionItem] = []
        for tok, score, s_c, e_c in raw_attentions:
            # Saliency role and hex color
            if score >= 0.25:
                role = "RISK_AMPLIFIER"
                # Color gradient from light crimson to dark red
                color = "#f43f5e" if score < 0.6 else "#e11d48"
                rationale = f"Strongly amplifies High-PSIF potential (+{int(score * 100)}%)"
            elif score <= -0.15:
                role = "SAFETY_MITIGATOR"
                color = "#10b981"  # Emerald green
                rationale = f"Mitigates SIF potential ({int(score * 100)}%)"
            else:
                role = "NEUTRAL_CONTEXT"
                color = "#94a3b8"  # Slate grey
                rationale = "Neutral context / operational term"

            token_items.append(TokenAttributionItem(
                token=tok,
                saliency_score=score,
                start_char=s_c,
                end_char=e_c,
                role=role,
                color_hex=color,
                rationale=rationale
            ))

        # Top risk amplifiers
        amplifiers = [
            {"token": t.token, "score": t.saliency_score, "offsets": [t.start_char, t.end_char]}
            for t in sorted(token_items, key=lambda x: -x.saliency_score)
            if t.role == "RISK_AMPLIFIER"
        ][:5]

        # Top mitigators
        mitigators = [
            {"token": t.token, "score": t.saliency_score, "offsets": [t.start_char, t.end_char]}
            for t in sorted(token_items, key=lambda x: x.saliency_score)
            if t.role == "SAFETY_MITIGATOR"
        ][:5]

        # Saliency balance
        avg_balance = round(sum(t.saliency_score for t in token_items) / max(1, len(token_items)), 3)

        return TokenAttributionResult(
            narrative=narrative,
            tokens=token_items,
            top_risk_amplifiers=amplifiers,
            top_mitigators=mitigators,
            saliency_balance=avg_balance,
            predicted_sif_class=pred.predicted_class,
            confidence_level=pred.confidence_level
        )
