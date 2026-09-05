"""
Pydantic Schemas for Safety Report Ingestion and Canonical Representation.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.schemas.prediction import (
    PSIFSchema,
    IOGPRulePredictionSchema,
    EntitiesSchema,
    EvidenceSpanSchema
)
from backend.app.schemas.review import ReviewResponse
from backend.app.schemas.action import CorrectiveActionResponse


class ReportCreate(BaseModel):
    report_type: str = Field(default="near_miss", description="near_miss, unsafe_act, unsafe_condition, incident")
    site: str = Field(description="Operational asset / site", json_schema_extra={"example": "Duliajan Production Installation"})
    location: Optional[str] = Field(default=None, json_schema_extra={"example": "Separator Station #4"})
    department: Optional[str] = Field(default=None, json_schema_extra={"example": "Mechanical Maintenance"})
    activity: Optional[str] = Field(default=None, json_schema_extra={"example": "Separator Vessel Inspection"})
    equipment: Optional[List[str]] = Field(default=None, json_schema_extra={"example": ["Gas Separator V-102"]})
    reporter_role: Optional[str] = Field(default=None, json_schema_extra={"example": "Lead Operator"})
    narrative: str = Field(
        min_length=10,
        description="Detailed free-text safety narrative",
        json_schema_extra={"example": "During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside."}
    )


class ReportResponse(BaseModel):
    id: str
    report_id: str
    report_timestamp: datetime
    report_type: str
    site: str
    location: Optional[str] = None
    department: Optional[str] = None
    activity: Optional[str] = None
    equipment: Optional[List[str]] = None
    reporter_role: Optional[str] = None
    raw_text: str
    normalized_text: str
    psif: Optional[PSIFSchema] = None
    life_saving_rules: List[IOGPRulePredictionSchema] = Field(default_factory=list)
    entities: Optional[EntitiesSchema] = None
    evidence_spans: List[EvidenceSpanSchema] = Field(default_factory=list)
    triggered_rules: List[str] = Field(default_factory=list)
    safety_reasoning: List[str] = Field(default_factory=list)
    exposure_fingerprint: Optional[str] = None
    review: Optional[ReviewResponse] = None
    corrective_actions: List[CorrectiveActionResponse] = Field(default_factory=list)
    model_version: str = "psif-v1.0"
    created_at: datetime


class ReportListItem(BaseModel):
    id: str
    report_id: str
    report_timestamp: datetime
    report_type: str
    site: str
    location: Optional[str] = None
    activity: Optional[str] = None
    priority: str
    psif_probability: float
    primary_rule: Optional[str] = None
    review_status: str
    created_at: datetime


class ReportListResponse(BaseModel):
    total: int
    items: List[ReportListItem]
