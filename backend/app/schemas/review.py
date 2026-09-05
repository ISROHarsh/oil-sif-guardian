"""
Pydantic Schemas for Human-in-the-Loop HSE Review Workflow.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReviewCreate(BaseModel):
    reviewer_id: str = Field(description="ID of HSE reviewing officer", json_schema_extra={"example": "HSE-OFFICER-742"})
    status: str = Field(description="CONFIRMED, MODIFIED, or REJECTED", json_schema_extra={"example": "CONFIRMED"})
    final_psif_label: Optional[str] = Field(default="HIGH", description="HIGH, LOW, or REVIEW")
    reviewer_notes: Optional[str] = Field(default=None, json_schema_extra={"example": "Validated high SIF precursor. Contractor work stopped."})


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_id: str
    status: str
    reviewer_id: Optional[str] = None
    final_psif_label: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
