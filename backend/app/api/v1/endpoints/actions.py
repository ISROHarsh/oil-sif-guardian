"""
API Router for Corrective Action Assignment, Lifecycle Tracking, and Verification.
"""

from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.report import ReportModel, CorrectiveActionModel, AuditEventModel
from backend.app.schemas.action import (
    CorrectiveActionCreate,
    CorrectiveActionUpdate,
    CorrectiveActionResponse,
    CorrectiveActionStatsResponse
)

router = APIRouter()


@router.get("/actions/stats", response_model=CorrectiveActionStatsResponse)
@router.get("/stats", response_model=CorrectiveActionStatsResponse)
def get_actions_stats(db: Session = Depends(get_db)):
    """
    Returns enterprise-level statistics for all corrective actions.
    """
    total = db.query(CorrectiveActionModel).count()
    open_cnt = db.query(CorrectiveActionModel).filter(CorrectiveActionModel.status == "OPEN").count()
    prog_cnt = db.query(CorrectiveActionModel).filter(CorrectiveActionModel.status == "IN_PROGRESS").count()
    closed_cnt = db.query(CorrectiveActionModel).filter(CorrectiveActionModel.status == "VERIFIED_CLOSED").count()

    today_str = date.today().isoformat()
    overdue_cnt = db.query(CorrectiveActionModel).filter(
        CorrectiveActionModel.status != "VERIFIED_CLOSED",
        CorrectiveActionModel.due_date != None,
        CorrectiveActionModel.due_date < today_str
    ).count()

    closure_rate = round(closed_cnt / total, 4) if total > 0 else 0.0

    return CorrectiveActionStatsResponse(
        total_actions=total,
        open_count=open_cnt,
        in_progress_count=prog_cnt,
        verified_closed_count=closed_cnt,
        overdue_count=overdue_cnt,
        closure_rate=closure_rate
    )


@router.get("/actions/all", response_model=List[CorrectiveActionResponse])
@router.get("/all", response_model=List[CorrectiveActionResponse])
def list_all_actions(
    status: Optional[str] = Query(None, description="Filter by status (OPEN, IN_PROGRESS, VERIFIED_CLOSED)"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Lists all enterprise corrective actions across all oil installations.
    """
    query = db.query(CorrectiveActionModel).join(ReportModel, CorrectiveActionModel.report_id == ReportModel.id)
    if status:
        query = query.filter(CorrectiveActionModel.status == status.upper())

    actions = query.order_by(CorrectiveActionModel.created_at.desc()).offset(offset).limit(limit).all()

    return [
        CorrectiveActionResponse(
            action_id=a.action_id,
            report_id=a.report.report_id if a.report else "UNKNOWN",
            title=a.title,
            assigned_to=a.assigned_to,
            due_date=a.due_date,
            status=a.status,
            notes=a.notes,
            created_at=a.created_at,
            closed_at=a.closed_at
        )
        for a in actions
    ]


@router.patch("/actions/{action_id}", response_model=CorrectiveActionResponse)
@router.patch("/{action_id}", response_model=CorrectiveActionResponse)
def update_corrective_action(
    action_id: str,
    payload: CorrectiveActionUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates the lifecycle status, assignee, or verification notes of a corrective action.
    """
    action = db.query(CorrectiveActionModel).filter(CorrectiveActionModel.action_id == action_id).first()
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corrective action '{action_id}' not found."
        )

    old_status = action.status
    if payload.title is not None:
        action.title = payload.title
    if payload.assigned_to is not None:
        action.assigned_to = payload.assigned_to
    if payload.due_date is not None:
        action.due_date = payload.due_date

    now_utc = datetime.now(timezone.utc)
    if payload.status is not None:
        new_status = payload.status.upper()
        action.status = new_status
        if new_status == "VERIFIED_CLOSED" and not action.closed_at:
            action.closed_at = now_utc
        elif new_status != "VERIFIED_CLOSED":
            action.closed_at = None

    if payload.notes is not None:
        action.notes = payload.notes

    if payload.verification_notes:
        added = f"\n[Verified {now_utc.strftime('%Y-%m-%d %H:%M')} by {payload.verified_by or 'HSE Lead'}]: {payload.verification_notes}"
        action.notes = (action.notes or "") + added

    # Audit log
    db.add(AuditEventModel(
        report_id=action.report_id,
        action="CORRECTIVE_ACTION_UPDATED",
        actor_id=payload.verified_by or action.assigned_to,
        details=f"Action {action_id} transitioned from {old_status} to {action.status}. Notes: {payload.notes or payload.verification_notes or 'Status update'}"
    ))

    db.commit()
    db.refresh(action)

    report_ref = action.report.report_id if action.report else "UNKNOWN"
    return CorrectiveActionResponse(
        action_id=action.action_id,
        report_id=report_ref,
        title=action.title,
        assigned_to=action.assigned_to,
        due_date=action.due_date,
        status=action.status,
        notes=action.notes,
        created_at=action.created_at,
        closed_at=action.closed_at
    )


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
