from typing import Optional, List
from datetime import datetime, timezone
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
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
    ReportListItem,
    BatchReportCreate,
    BatchIngestResponse,
    DataQualitySummaryResponse
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
from backend.app.services.ingestion_service import ingestion_service

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
        quality_score=report.quality_score,
        quality_grade=report.quality_grade,
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
    Ingests a new HSSE narrative, runs the preprocessing & triage pipeline,
    persists records with audit trail, and returns complete triage results.
    """
    report, _ = ingestion_service.process_single(payload, db=db, commit=True)
    return _build_report_response(report)


@router.post("/batch", response_model=BatchIngestResponse, status_code=status.HTTP_201_CREATED)
def batch_ingest_reports(payload: BatchReportCreate, db: Session = Depends(get_db)):
    """
    Batch ingests an array of safety reports, scoring each and identifying duplicates.
    """
    return ingestion_service.process_batch(payload.reports, db=db)


@router.post("/upload-csv", response_model=BatchIngestResponse, status_code=status.HTTP_201_CREATED)
async def upload_csv_reports(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Uploads and processes an incident dataset in CSV format.
    Automatically normalizes headers, expands abbreviations, masks PII, and runs triage.
    """
    filename = file.filename or ""
    if not filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a .csv or plain text table."
        )
    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_str = content_bytes.decode("latin-1")

    return ingestion_service.parse_and_process_csv(content_str, db=db)


@router.get("/quality-summary", response_model=DataQualitySummaryResponse)
def get_data_quality_summary(db: Session = Depends(get_db)):
    """
    Returns aggregated data quality metrics, grade distributions, and top deficiencies.
    """
    return ingestion_service.get_quality_summary(db=db)


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
            quality_score=r.quality_score,
            quality_grade=r.quality_grade,
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

