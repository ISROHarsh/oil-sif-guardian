"""
API Router for Corrective Action Assignment and Management.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.report import ReportModel, CorrectiveActionModel, AuditEventModel
from backend.app.schemas.action import CorrectiveActionCreate, CorrectiveActionResponse

router = APIRouter()


@router.post("/{report_id}/actions", response_model=CorrectiveActionResponse, status_code=status.HTTP_201_CREATED)
def create_corrective_action(report_id: str, payload: CorrectiveActionCreate, db: Session = Depends(get_db)):
    """
    Creates and attaches a corrective safety action to a prioritized incident report.
    """
    report = db.query(ReportModel).filter(
        (ReportModel.id == report_id) | (ReportModel.report_id == report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found."
        )

    act_num = db.query(CorrectiveActionModel).count() + 101
    year = datetime.now(timezone.utc).year
    action_id = f"ACT-{year}-{act_num:05d}"

    action = CorrectiveActionModel(
        report_id=report.id,
        action_id=action_id,
        title=payload.title,
        assigned_to=payload.assigned_to,
        due_date=payload.due_date,
        status=payload.status.upper() if payload.status else "OPEN",
        notes=payload.notes
    )
    db.add(action)

    # Log audit event
    db.add(AuditEventModel(
        report_id=report.id,
        action="CORRECTIVE_ACTION_CREATED",
        actor_id=payload.assigned_to,
        details=f"Created corrective action {action_id}: {payload.title} (due: {payload.due_date})"
    ))

    db.commit()
    db.refresh(action)

    return CorrectiveActionResponse(
        action_id=action.action_id,
        report_id=report.report_id,
        title=action.title,
        assigned_to=action.assigned_to,
        due_date=action.due_date,
        status=action.status,
        notes=action.notes,
        created_at=action.created_at,
        closed_at=action.closed_at
    )


@router.get("/{report_id}/actions", response_model=List[CorrectiveActionResponse])
def list_corrective_actions(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieves all corrective actions for a given report.
    """
    report = db.query(ReportModel).filter(
        (ReportModel.id == report_id) | (ReportModel.report_id == report_id)
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found."
        )

    return [
        CorrectiveActionResponse(
            action_id=a.action_id,
            report_id=report.report_id,
            title=a.title,
            assigned_to=a.assigned_to,
            due_date=a.due_date,
            status=a.status,
            notes=a.notes,
            created_at=a.created_at,
            closed_at=a.closed_at
        )
        for a in report.corrective_actions
    ]
