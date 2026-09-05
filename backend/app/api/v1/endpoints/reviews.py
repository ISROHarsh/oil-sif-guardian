"""
API Router for HSE Human-in-the-Loop Review Operations.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.report import ReportModel, ReviewModel, AuditEventModel
from backend.app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter()


@router.post("/{report_id}/review", response_model=ReviewResponse)
def submit_review(report_id: str, payload: ReviewCreate, db: Session = Depends(get_db)):
    """
    Records an HSE safety officer's human-in-the-loop review decision:
    CONFIRMED, MODIFIED, or REJECTED.
    """
    report = db.query(ReportModel).filter(
        (ReportModel.id == report_id) | (ReportModel.report_id == report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found."
        )

    review = report.review
    if not review:
        review = ReviewModel(report_id=report.id)
        db.add(review)

    review.reviewer_id = payload.reviewer_id
    review.status = payload.status.upper()
    review.final_psif_label = payload.final_psif_label.upper() if payload.final_psif_label else review.final_psif_label
    review.reviewer_notes = payload.reviewer_notes
    review.reviewed_at = datetime.now(timezone.utc)

    # Log audit event
    db.add(AuditEventModel(
        report_id=report.id,
        action="HSE_HUMAN_REVIEW",
        actor_id=payload.reviewer_id,
        details=f"Review status set to {review.status}. Final PSIF: {review.final_psif_label}. Notes: {review.reviewer_notes}"
    ))

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        report_id=report.report_id,
        status=review.status,
        reviewer_id=review.reviewer_id,
        final_psif_label=review.final_psif_label,
        reviewer_notes=review.reviewer_notes,
        reviewed_at=review.reviewed_at
    )
