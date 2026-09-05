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
