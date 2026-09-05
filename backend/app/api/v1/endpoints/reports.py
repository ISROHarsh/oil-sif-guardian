"""
API Router for Safety Report Ingestion and Retrieval.
"""

from typing import Optional, List
from datetime import datetime, timezone
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.report import (
    ReportModel,
    PredictionModel,
    IOGPPredictionModel,
    ReportEntityModel,
    EvidenceSpanModel,
    ReviewModel,
    AuditEventModel
)
from backend.app.schemas.report import (
    ReportCreate,
    ReportResponse,
    ReportListResponse,
    ReportListItem
)
from backend.app.schemas.prediction import (
    PSIFSchema,
    IOGPRulePredictionSchema,
    EntitiesSchema,
    EvidenceSpanSchema
)
from backend.app.schemas.review import ReviewResponse
from backend.app.schemas.action import CorrectiveActionResponse
from backend.app.services.triage_service import triage_service

router = APIRouter()


def _build_report_response(report: ReportModel) -> ReportResponse:
    pred = report.prediction
    psif_data = None
    iogp_rules = []
    evidence_spans = []
    reasoning = []
    fingerprint = None
    model_ver = "psif-v1.0"

    if pred:
        psif_data = PSIFSchema(
            probability=pred.psif_probability,
            priority=pred.priority,
            confidence=pred.confidence,
            calibration_factor=pred.calibration_factor
        )
        iogp_rules = [
            IOGPRulePredictionSchema(
                rule_name=r.rule_name,
                probability=r.probability,
                is_primary=r.is_primary
            )
            for r in pred.iogp_rules
        ]
        evidence_spans = [
            EvidenceSpanSchema(
                text=s.text,
                start_char=s.start_char,
                end_char=s.end_char,
                category=s.category
            )
            for s in pred.evidence_spans
        ]
        if pred.reasoning_summary:
            try:
                reasoning = json.loads(pred.reasoning_summary)
            except Exception:
                reasoning = [pred.reasoning_summary]
        fingerprint = pred.exposure_fingerprint
        model_ver = pred.model_version

    # Entities
    hazards, energy, exposures, controls, failures, consequences = [], [], [], [], [], []
    for ent in report.entities:
        if ent.category == "hazard":
            hazards.append(ent.value)
        elif ent.category == "energy":
            energy.append(ent.value)
        elif ent.category == "exposure":
            exposures.append(ent.value)
        elif ent.category == "control":
            controls.append(ent.value)
        elif ent.category == "control_failure":
            failures.append(ent.value)
        elif ent.category == "consequence":
            consequences.append(ent.value)

    entities_data = EntitiesSchema(
        hazards=hazards,
        energy_sources=energy,
        exposures=exposures,
        controls=controls,
        control_failures=failures,
        consequences=consequences
    )

    # Review
    review_data = None
    if report.review:
        review_data = ReviewResponse.model_validate(report.review)

    # Actions
    actions_data = [
        CorrectiveActionResponse.model_validate(act)
        for act in report.corrective_actions
    ]

    equip = []
    if report.equipment:
        try:
            equip = json.loads(report.equipment)
        except Exception:
            equip = [report.equipment]

    return ReportResponse(
        id=report.id,
        report_id=report.report_id,
        report_timestamp=report.report_timestamp,
        report_type=report.report_type,
        site=report.site,
        location=report.location,
        department=report.department,
        activity=report.activity,
        equipment=equip,
        reporter_role=report.reporter_role,
        raw_text=report.raw_text,
        normalized_text=report.normalized_text,
        psif=psif_data,
        life_saving_rules=iogp_rules,
        entities=entities_data,
        evidence_spans=evidence_spans,
        triggered_rules=[],
        safety_reasoning=reasoning,
        exposure_fingerprint=fingerprint,
        review=review_data,
        corrective_actions=actions_data,
        model_version=model_ver,
        created_at=report.created_at
    )


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def submit_report(payload: ReportCreate, db: Session = Depends(get_db)):
    """
    Ingests a new HSSE narrative, runs the hybrid triage engine,
    persists records with audit trail, and returns complete triage results.
    """
    # 1. Execute AI triage pipeline
    triage_result = triage_service.triage(
        narrative=payload.narrative,
        activity=payload.activity or "Maintenance"
    )

    # 2. Generate canonical Report ID
    rep_num = db.query(ReportModel).count() + 1001
    year = datetime.now(timezone.utc).year
    report_id = f"OIL-{year}-REP-{rep_num:06d}"

    # 3. Create Report record
    report = ReportModel(
        report_id=report_id,
        report_type=payload.report_type,
        site=payload.site,
        location=payload.location,
        department=payload.department,
        activity=payload.activity,
        equipment=json.dumps(payload.equipment) if payload.equipment else None,
        reporter_role=payload.reporter_role,
        raw_text=payload.narrative,
        normalized_text=triage_service.normalize_text(payload.narrative)
    )
    db.add(report)
    db.flush()

    # 4. Create Prediction record
    pred = PredictionModel(
        report_id=report.id,
        psif_probability=triage_result.psif.probability,
        priority=triage_result.psif.priority,
        confidence=triage_result.psif.confidence,
        calibration_factor=triage_result.psif.calibration_factor or 1.0,
        model_version=triage_result.model_version,
        reasoning_summary=json.dumps(triage_result.safety_reasoning),
        exposure_fingerprint=triage_result.exposure_fingerprint
    )
    db.add(pred)
    db.flush()

    # 5. Add IOGP rule predictions
    for r in triage_result.life_saving_rules:
        db.add(IOGPPredictionModel(
            prediction_id=pred.id,
            rule_name=r.rule_name,
            probability=r.probability,
            is_primary=r.is_primary
        ))

    # 6. Add Entities
    for h in triage_result.entities.hazards:
        db.add(ReportEntityModel(report_id=report.id, category="hazard", value=h))
    for e in triage_result.entities.energy_sources:
        db.add(ReportEntityModel(report_id=report.id, category="energy", value=e))
    for ex in triage_result.entities.exposures:
        db.add(ReportEntityModel(report_id=report.id, category="exposure", value=ex))
    for c in triage_result.entities.controls:
        db.add(ReportEntityModel(report_id=report.id, category="control", value=c))
    for cf in triage_result.entities.control_failures:
        db.add(ReportEntityModel(report_id=report.id, category="control_failure", value=cf))
    for cq in triage_result.entities.consequences:
        db.add(ReportEntityModel(report_id=report.id, category="consequence", value=cq))

    # 7. Add Evidence Spans
    for s in triage_result.evidence_spans:
        db.add(EvidenceSpanModel(
            prediction_id=pred.id,
            text=s.text,
            start_char=s.start_char,
            end_char=s.end_char,
            category=s.category
        ))

    # 8. Create default Pending Review record
    review = ReviewModel(
        report_id=report.id,
        status="PENDING",
        final_psif_label=triage_result.psif.priority
    )
    db.add(review)

    # 9. Audit log entry
    db.add(AuditEventModel(
        report_id=report.id,
        action="REPORT_INGESTION_AND_TRIAGE",
        actor_id=payload.reporter_role or "REPORTER",
        details=f"Ingested and triaged as {triage_result.psif.priority} priority (prob: {triage_result.psif.probability})"
    ))

    db.commit()
    db.refresh(report)

    resp = _build_report_response(report)
    resp.triggered_rules = triage_result.triggered_rules
    return resp


@router.get("", response_model=ReportListResponse)
def list_reports(
    priority: Optional[str] = Query(None, description="Filter by priority: HIGH, LOW, REVIEW"),
    site: Optional[str] = Query(None, description="Filter by site"),
    review_status: Optional[str] = Query(None, description="Filter by review status: PENDING, CONFIRMED, etc."),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns paginated list of safety reports with filtering capabilities.
    """
    query = db.query(ReportModel).join(ReportModel.prediction).join(ReportModel.review)

    if priority:
        query = query.filter(PredictionModel.priority == priority.upper())
    if site:
        query = query.filter(ReportModel.site == site)
    if review_status:
        query = query.filter(ReviewModel.status == review_status.upper())

    total = query.count()
    reports = query.order_by(ReportModel.report_timestamp.desc()).offset(skip).limit(limit).all()

    items = []
    for r in reports:
        primary_rule = None
        if r.prediction and r.prediction.iogp_rules:
            for rule in r.prediction.iogp_rules:
                if rule.is_primary:
                    primary_rule = rule.rule_name
                    break
            if not primary_rule and r.prediction.iogp_rules:
                primary_rule = r.prediction.iogp_rules[0].rule_name

        items.append(ReportListItem(
            id=r.id,
            report_id=r.report_id,
            report_timestamp=r.report_timestamp,
            report_type=r.report_type,
            site=r.site,
            location=r.location,
            activity=r.activity,
            priority=r.prediction.priority if r.prediction else "REVIEW",
            psif_probability=r.prediction.psif_probability if r.prediction else 0.5,
            primary_rule=primary_rule,
            review_status=r.review.status if r.review else "PENDING",
            created_at=r.created_at
        ))

    return ReportListResponse(total=total, items=items)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full details for a safety report by ID or business report_id.
    """
    report = db.query(ReportModel).filter(
        (ReportModel.id == report_id) | (ReportModel.report_id == report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Safety report '{report_id}' not found."
        )

    return _build_report_response(report)
