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

// -------------------------------------------------------------
// Phase 2: Annotation Protocol & Golden Benchmark Interfaces
// -------------------------------------------------------------

export interface AnnotationItem {
  annotator_id: string;
  psif_priority: 'HIGH' | 'LOW' | 'REVIEW';
  primary_iogp_rule?: string | null;
  secondary_iogp_rules?: string[];
  hazards?: string[];
  control_failures?: string[];
  evidence_spans?: Array<{ text: string; category?: string; start_char?: number; end_char?: number }>;
  notes?: string;
}

export interface AnnotationPairInput {
  item_id: string;
  annotator_1: AnnotationItem;
  annotator_2: AnnotationItem;
  narrative?: string;
}

export interface AgreementResponse {
  total_items: number;
  cohens_kappa_priority: number;
  priority_interpretation: string;
  krippendorff_alpha_rules: number;
  rule_interpretation: string;
  span_iou_f1_score: number;
  priority_observed_agreement: number;
  rule_exact_agreement: number;
  overall_recommendation: string;
  confusion_matrix?: Record<string, Record<string, number>>;
}

export interface AdjudicationResponse {
  item_id: string;
  status: 'CONSENSUS' | 'DISPUTE_REQUIRED' | 'RESOLVED';
  confidence: number;
  consensus_priority?: string | null;
  consensus_primary_rule?: string | null;
  disputed_fields: string[];
  annotator_1: AnnotationItem;
  annotator_2: AnnotationItem;
  lead_resolution?: {
    lead_id: string;
    final_priority: string;
    final_primary_rule?: string | null;
    rationale: string;
    resolved_at?: string;
  } | null;
}

export interface GroundTruthInfo {
  is_psif: boolean;
  psif_priority: 'HIGH' | 'LOW' | 'REVIEW';
  primary_iogp_rule?: string | null;
  secondary_iogp_rules: string[];
  hazards: string[];
  energy_sources: string[];
  controls: string[];
  control_failures: string[];
  evidence_spans: Array<{ text: string; category: string }>;
  rationale: string;
}

export interface GoldenBenchmarkRecord {
  benchmark_id: string;
  title: string;
  site: string;
  location: string;
  activity: string;
  narrative: string;
  ground_truth: GroundTruthInfo;
  adjudicated_by: string;
  adjudicated_at: string;
}

export interface GoldenBenchmarkListResponse {
  total: number;
  items: GoldenBenchmarkRecord[];
}

export interface BenchmarkEvaluationItem {
  benchmark_id: string;
  title: string;
  ground_truth_priority: string;
  predicted_priority: string;
  priority_matched: boolean;
  ground_truth_rule?: string | null;
  predicted_rule?: string | null;
  rule_matched: boolean;
  psif_probability: number;
}

export interface BenchmarkEvaluationResponse {
  total_evaluated: number;
  high_psif_recall: number;
  high_psif_precision: number;
  high_psif_f1: number;
  high_psif_tp: number;
  high_psif_fn: number;
  high_psif_fp: number;
  rule_match_rate: number;
  evaluation_timestamp: string;
  details: BenchmarkEvaluationItem[];
}


