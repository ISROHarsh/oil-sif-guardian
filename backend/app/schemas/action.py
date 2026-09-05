"""
Pydantic Schemas for Corrective Actions Management.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CorrectiveActionCreate(BaseModel):
    title: str = Field(description="Action summary", json_schema_extra={"example": "Audit gas testing logs & conduct safety stand-down"})
    assigned_to: str = Field(description="Responsible person / role", json_schema_extra={"example": "Field Operations Superintendent"})
    due_date: Optional[str] = Field(default=None, description="Target closure date (YYYY-MM-DD)", json_schema_extra={"example": "2026-09-15"})
    status: Optional[str] = Field(default="OPEN", description="OPEN, IN_PROGRESS, VERIFIED_CLOSED")
    notes: Optional[str] = Field(default=None)


class CorrectiveActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    action_id: str
    report_id: str
    title: str
    assigned_to: str
    due_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
