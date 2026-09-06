"""
OIL-SIF Guardian — Contextual Sequence Modeling & Model Studio Endpoints
Provides inference, token attribution heatmaps, ensemble arbitration, and 4-way benchmarking.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, List, Any

from backend.app.schemas.model_schemas import (
    SequencePredictRequest,
    SequencePredictResponse,
    TokenAttributionRequest,
    TokenAttributionResponse,
    TokenAttributionItemSchema,
    EnsembleArbitrationRequest,
    EnsembleArbitrationResponse,
    FourWayBenchmarkResponse,
    ModelBenchmarkItemSchema,
    ModelStatusResponse,
)
from ml.models.sequence_classifier import ContextualSequenceClassifier, IOGP_NINE_RULES
from ml.models.token_attribution import TokenAttributionEngine
from ml.evaluation.ensemble_arbitrator import EnsembleArbitrator

router = APIRouter()

# Persistent singletons
_classifier = ContextualSequenceClassifier()
_attribution_engine = TokenAttributionEngine(classifier=_classifier)
_ensemble_arbitrator = EnsembleArbitrator(contextual_classifier=_classifier)


@router.post("/predict", response_model=SequencePredictResponse, summary="Contextual sequence model inference")
def predict_sequence(req: SequencePredictRequest) -> SequencePredictResponse:
    """
    Executes contextual attention sequence classification for SIF priority and multi-label IOGP rules.
    """
    if not req.narrative or not req.narrative.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Narrative must not be empty."
        )

    res = _classifier.predict(req.narrative)

    return SequencePredictResponse(
        predicted_class=res.predicted_class,
        raw_probabilities=res.raw_probabilities,
        calibrated_probabilities=res.calibrated_probabilities,
        confidence_level=res.confidence_level,
        temperature=res.temperature,
        iogp_rule_scores=res.iogp_rule_scores,
        top_iogp_rules=res.top_iogp_rules,
        inference_latency_ms=res.inference_latency_ms
    )


@router.post("/attribution", response_model=TokenAttributionResponse, summary="Token-level attribution & saliency heatmap")
def explain_token_attribution(req: TokenAttributionRequest) -> TokenAttributionResponse:
    """
    Computes token-level importance and maps them to exact character offsets for UI heatmaps.
    """
    if not req.narrative or not req.narrative.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Narrative must not be empty."
        )

    res = _attribution_engine.explain(req.narrative)

    token_schemas = [
        TokenAttributionItemSchema(
            token=t.token,
            saliency_score=t.saliency_score,
            start_char=t.start_char,
            end_char=t.end_char,
            role=t.role,
            color_hex=t.color_hex,
            rationale=t.rationale
        ) for t in res.tokens
    ]

    return TokenAttributionResponse(
        narrative=res.narrative,
        tokens=token_schemas,
        top_risk_amplifiers=res.top_risk_amplifiers,
        top_mitigators=res.top_mitigators,
        saliency_balance=res.saliency_balance,
        predicted_sif_class=res.predicted_sif_class,
        confidence_level=res.confidence_level
    )


@router.post("/ensemble", response_model=EnsembleArbitrationResponse, summary="Tri-model ensemble arbitration")
def arbitrate_ensemble(req: EnsembleArbitrationRequest) -> EnsembleArbitrationResponse:
    """
    Arbitrates among Deterministic Safety Rules, TF-IDF Baseline, and Contextual Model.
    """
    if not req.narrative or not req.narrative.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Narrative must not be empty."
        )

    dec = _ensemble_arbitrator.arbitrate(
        narrative=req.narrative,
        activity=req.activity,
        site=req.site
    )

    return EnsembleArbitrationResponse(
        final_priority=dec.final_priority,
        confidence_score=dec.confidence_score,
        safety_override=dec.safety_override,
        override_reason=dec.override_reason,
        rule_engine_decision=dec.rule_engine_decision,
        tfidf_decision=dec.tfidf_decision,
        contextual_decision=dec.contextual_decision,
        blended_probabilities=dec.blended_probabilities,
        final_iogp_rules=dec.final_iogp_rules,
        arbitration_summary=dec.arbitration_summary,
        latency_ms=dec.latency_ms
    )


@router.get("/benchmark", response_model=FourWayBenchmarkResponse, summary="4-way model benchmark comparison on golden dataset")
def get_four_way_benchmark() -> FourWayBenchmarkResponse:
    """
    Runs head-to-head evaluation across all 124 golden benchmark scenarios.
    """
    try:
        report = _ensemble_arbitrator.evaluate_four_way_benchmark()
        return FourWayBenchmarkResponse(
            timestamp=report.timestamp,
            total_benchmark_samples=report.total_benchmark_samples,
            deterministic_rule_engine=ModelBenchmarkItemSchema(**report.deterministic_rule_engine.to_dict()),
            tfidf_baseline=ModelBenchmarkItemSchema(**report.tfidf_baseline.to_dict()),
            contextual_sequence_classifier=ModelBenchmarkItemSchema(**report.contextual_sequence_classifier.to_dict()),
            tri_model_ensemble=ModelBenchmarkItemSchema(**report.tri_model_ensemble.to_dict()),
            key_findings=report.key_findings
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Benchmark evaluation failed: {str(e)}"
        )


@router.get("/status", response_model=ModelStatusResponse, summary="Contextual sequence model status")
def get_model_status() -> ModelStatusResponse:
    """
    Returns the metadata, temperature, and vocabulary size of the contextual sequence classifier.
    """
    return ModelStatusResponse(
        model_version=_classifier.model_version,
        is_trained=_classifier.is_trained,
        temperature=_classifier.temperature,
        vocabulary_size=len(_classifier.vocab),
        training_samples=_classifier.training_samples,
        supported_rules=IOGP_NINE_RULES
    )
