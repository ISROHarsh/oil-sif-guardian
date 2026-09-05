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
    quality_score: Optional[float] = None
    quality_grade: Optional[str] = None
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
    quality_score: Optional[float] = None
    quality_grade: Optional[str] = None
    created_at: datetime


class ReportListResponse(BaseModel):
    total: int
    items: List[ReportListItem]


class BatchReportCreate(BaseModel):
    reports: List[ReportCreate] = Field(min_length=1, description="List of report payloads to batch ingest")


class BatchIngestItemResult(BaseModel):
    index: int
    report_id: Optional[str] = None
    status: str  # SUCCESS, REJECTED, DUPLICATE_WARNING
    quality_score: float
    quality_grade: str
    quality_issues: List[str] = Field(default_factory=list)
    duplicate_matches: List[Dict[str, Any]] = Field(default_factory=list)
    psif_probability: Optional[float] = None
    priority: Optional[str] = None
    primary_rule: Optional[str] = None
    error_message: Optional[str] = None


class BatchIngestResponse(BaseModel):
    total_processed: int
    successful_count: int
    failed_count: int
    duplicate_count: int
    average_quality_score: float
    grade_breakdown: Dict[str, int]
    items: List[BatchIngestItemResult]


class DataQualitySummaryResponse(BaseModel):
    total_reports: int
    average_quality_score: float
    grade_distribution: Dict[str, int]
    dimension_averages: Dict[str, float]
    common_issues: List[Dict[str, Any]]

