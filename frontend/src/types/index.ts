export interface EvidenceSpan {
  text: string;
  start_char: number;
  end_char: number;
  category: string;
}

export interface IOGPRule {
  rule_name: string;
  probability: number;
  is_primary: boolean;
}

export interface Entities {
  hazards: string[];
  energy_sources: string[];
  exposures: string[];
  controls: string[];
  control_failures: string[];
  consequences: string[];
}

export interface PSIFInfo {
  probability: number;
  priority: 'HIGH' | 'LOW' | 'REVIEW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  calibration_factor?: number;
}

export interface ReviewInfo {
  status: 'PENDING' | 'CONFIRMED' | 'MODIFIED' | 'REJECTED';
  reviewer_id?: string | null;
  final_psif_label?: string | null;
  reviewer_notes?: string | null;
  reviewed_at?: string | null;
}

export interface CorrectiveAction {
  action_id: string;
  report_id: string;
  title: string;
  assigned_to: string;
  due_date?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'VERIFIED_CLOSED';
  notes?: string | null;
  created_at?: string;
}

export interface ReportResponse {
  id: string;
  report_id: string;
  report_timestamp: string;
  report_type: string;
  site: string;
  location?: string | null;
  department?: string | null;
  activity?: string | null;
  equipment?: string[] | null;
  reporter_role?: string | null;
  raw_text: string;
  normalized_text: string;
  quality_score?: number | null;
  quality_grade?: string | null;
  psif?: PSIFInfo | null;
  life_saving_rules: IOGPRule[];
  entities?: Entities | null;
  evidence_spans: EvidenceSpan[];
  triggered_rules: string[];
  safety_reasoning: string[];
  exposure_fingerprint?: string | null;
  review?: ReviewInfo | null;
  corrective_actions: CorrectiveAction[];
  model_version: string;
  created_at: string;
}

export interface ReportListItem {
  id: string;
  report_id: string;
  report_timestamp: string;
  report_type: string;
  site: string;
  location?: string | null;
  activity?: string | null;
  priority: 'HIGH' | 'LOW' | 'REVIEW';
  psif_probability: number;
  primary_rule?: string | null;
  review_status: string;
  quality_score?: number | null;
  quality_grade?: string | null;
  created_at: string;
}

export interface ReportListResponse {
  total: number;
  items: ReportListItem[];
}

export interface AnalyticsOverview {
  total_reports: number;
  high_psif_count: number;
  review_psif_count: number;
  low_psif_count: number;
  psif_rate_percent: number;
  pending_reviews: number;
  open_corrective_actions: number;
  top_life_saving_rules: { rule_name: string; count: number }[];
}

export interface DuplicateMatch {
  match_id: string;
  similarity: number;
  match_type: string;
  reason: string;
}

export interface BatchIngestItemResult {
  index: number;
  report_id?: string | null;
  status: 'SUCCESS' | 'REJECTED' | 'DUPLICATE_WARNING';
  quality_score: number;
  quality_grade: string;
  quality_issues: string[];
  duplicate_matches: DuplicateMatch[];
  psif_probability?: number | null;
  priority?: 'HIGH' | 'LOW' | 'REVIEW' | null;
  primary_rule?: string | null;
  error_message?: string | null;
}

export interface BatchIngestResponse {
  total_processed: number;
  successful_count: number;
  failed_count: number;
  duplicate_count: number;
  average_quality_score: number;
  grade_breakdown: Record<string, number>;
  items: BatchIngestItemResult[];
}

export interface CommonQualityIssue {
  issue: string;
  count: number;
  percentage: number;
}

export interface DataQualitySummary {
  total_reports: number;
  average_quality_score: number;
  grade_distribution: Record<string, number>;
  dimension_averages: {
    narrative_depth: number;
    metadata_completeness: number;
    hazard_specificity: number;
    barrier_information: number;
  };
  common_issues: CommonQualityIssue[];
}

