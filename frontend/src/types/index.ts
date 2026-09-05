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

// -------------------------------------------------------------
// Phase 3: Ontology, Barrier Taxonomy & Precursor Intelligence
// -------------------------------------------------------------

export interface DetectedBarrier {
  barrier_id: string;
  name: string;
  category: 'HARDWARE' | 'ADMINISTRATIVE' | 'HUMAN_ACTION';
  sub_type: string;
  state: 'EFFECTIVE' | 'DEGRADED' | 'FAILED' | 'BYPASSED' | 'ABSENT';
  evidence: string;
  severity_weight: number;
}

export interface BarrierAnalysisResult {
  detected_barriers: DetectedBarrier[];
  barrier_health_score: number;
  has_critical_failure: boolean;
  summary_by_category: Record<string, { total: number; failed: number; effective: number }>;
  failure_mechanisms: string[];
  sif_barrier_flag: 'CRITICAL_FAILURE' | 'DEGRADED' | 'EFFECTIVE' | 'NONE_DETECTED';
}

export interface BarrierDefinition {
  id: string;
  name: string;
  category: string;
  sub_type: string;
  description: string;
  iogp_rule_association: string;
}

export interface SIFFingerprintResult {
  fingerprint: string;
  activity: string;
  hazardous_energy: string;
  hazard: string;
  barrier_failure: string;
  iogp_rule: string;
  explanation: string;
}

export interface RegulatoryFramework {
  code: string;
  title: string;
  mandate: string;
}

export interface OntologyTerms {
  abbreviations: Record<string, string>;
  oil_facilities: string[];
  oil_operating_areas: string[];
  equipment: string[];
  hazards: string[];
  failure_modes: string[];
  energy_sources: Record<string, string[]>;
  regulatory_frameworks: RegulatoryFramework[];
}

export interface PrecursorCluster {
  cluster_id: string;
  theme: string;
  primary_iogp_rule: string;
  exposure_fingerprint: string;
  common_failure: string;
  hazard: string;
  reports_count: number;
  high_psif_count: number;
  recurrence_score: number;
  affected_facilities: string[];
  facility_count: number;
  barrier_breakdowns: {
    hardware_failed: number;
    admin_failed: number;
    human_failed: number;
  };
  sample_incidents: Array<{
    id: string;
    title: string;
    site: string;
    priority: string;
  }>;
}

export interface ClusterGraphNode {
  id: string;
  label: string;
  type: 'CLUSTER' | 'ASSET' | 'BARRIER' | 'INCIDENT';
  category: string;
  val: number;
  priority: string;
  fingerprint?: string;
}

export interface ClusterGraphLink {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface ClusterGraphData {
  nodes: ClusterGraphNode[];
  links: ClusterGraphLink[];
  total_nodes: number;
  total_links: number;
  cluster_count: number;
}

export interface BaselineModelStatus {
  is_trained: boolean;
  vocabulary_size: number;
  training_samples: number;
  model_path: string;
}

export interface BaselineEvaluationReport {
  model_name: string;
  total_samples: number;
  high_psif_recall: number;
  high_psif_precision: number;
  high_psif_f1: number;
  overall_accuracy: number;
  iogp_rule_match_rate: number;
  average_latency_ms: number;
  confusion_matrix: Record<string, Record<string, number>>;
}

export interface BaselineComparisonResult {
  timestamp: string;
  total_benchmark_samples: number;
  deterministic_rule_engine: BaselineEvaluationReport;
  tfidf_baseline: BaselineEvaluationReport;
  calibrated_hybrid: BaselineEvaluationReport;
  key_findings: string[];
}

// ==================== Phase 4: Safety NER & Extraction Types ====================

export interface EntitySpanItem {
  text: string;
  label: string;
  start_char: number;
  end_char: number;
  confidence: number;
  source: string;
  category_description?: string;
}

export interface CausalStepItem {
  step_id: number;
  node_key: string;
  title: string;
  category: string;
  detected_entities: string[];
  has_evidence: boolean;
  summary: string;
  icon_hint: string;
  severity_level: string;
}

export interface CausalFlowData {
  steps: CausalStepItem[];
  completeness_score: number;
  risk_level: string;
  causal_narrative: string;
  key_failure_mechanism: string;
  suggested_critical_controls: string[];
  audit_grounding: Record<string, EntitySpanItem[]>;
}

export interface ExtractionRequestData {
  narrative: string;
  activity?: string;
  site?: string;
}

export interface ExtractionResponseData {
  narrative: string;
  entities_by_category: Record<string, EntitySpanItem[]>;
  all_spans: EntitySpanItem[];
  causal_flow: CausalFlowData;
  summary_text: string;
  entity_counts: Record<string, number>;
  total_entities: number;
}

export interface BIOTokenItem {
  token: string;
  tag: string;
  start_char: number;
  end_char: number;
}

export interface BIOTaggingResponseData {
  narrative: string;
  tokens: BIOTokenItem[];
  total_tokens: number;
  entity_tokens_count: number;
  conll_format: string;
}

export interface NERTaxonomyResponseData {
  supported_categories: string[];
  category_descriptions: Record<string, string>;
  builtin_terms_count: number;
  terms_by_category: Record<string, number>;
  trie_entries_loaded: number;
  regex_patterns_count: number;
  engine: string;
}

// ==================== Phase 5: Sequence Modeling & Model Studio Types ====================

export interface SequencePredictResponseData {
  predicted_class: 'HIGH' | 'REVIEW' | 'LOW';
  raw_probabilities: Record<string, number>;
  calibrated_probabilities: Record<string, number>;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  temperature: number;
  iogp_rule_scores: Record<string, number>;
  top_iogp_rules: Array<{ rule_name: string; probability: number; is_primary: boolean }>;
  inference_latency_ms: number;
}

export interface TokenAttributionItemData {
  token: string;
  saliency_score: number;
  start_char: number;
  end_char: number;
  role: 'RISK_AMPLIFIER' | 'NEUTRAL_CONTEXT' | 'SAFETY_MITIGATOR';
  color_hex: string;
  rationale: string;
}

export interface TokenAttributionResponseData {
  narrative: string;
  tokens: TokenAttributionItemData[];
  top_risk_amplifiers: Array<{ token: string; score: number; offsets: [number, number] }>;
  top_mitigators: Array<{ token: string; score: number; offsets: [number, number] }>;
  saliency_balance: number;
  predicted_sif_class: string;
  confidence_level: string;
}

export interface EnsembleArbitrationResponseData {
  final_priority: 'HIGH' | 'REVIEW' | 'LOW';
  confidence_score: number;
  safety_override: boolean;
  override_reason?: string | null;
  rule_engine_decision: {
    priority: string;
    probability: number;
    triggered_rules: string[];
  };
  tfidf_decision: {
    priority: string;
    probabilities: Record<string, number>;
  };
  contextual_decision: {
    priority: string;
    calibrated_probabilities: Record<string, number>;
    confidence_level: string;
    temperature: number;
  };
  blended_probabilities: Record<string, number>;
  final_iogp_rules: Array<{ rule_name: string; probability: number; is_primary: boolean; source: string }>;
  arbitration_summary: string;
  latency_ms: number;
}

export interface ModelBenchmarkItemData {
  model_name: string;
  total_samples: number;
  high_psif_recall: number;
  high_psif_precision: number;
  high_psif_f1: number;
  overall_accuracy: number;
  iogp_rule_match_rate: number;
  average_latency_ms: number;
  confusion_matrix: Record<string, Record<string, number>>;
}

export interface FourWayBenchmarkResponseData {
  timestamp: string;
  total_benchmark_samples: number;
  deterministic_rule_engine: ModelBenchmarkItemData;
  tfidf_baseline: ModelBenchmarkItemData;
  contextual_sequence_classifier: ModelBenchmarkItemData;
  tri_model_ensemble: ModelBenchmarkItemData;
  key_findings: string[];
}

export interface ModelStatusResponseData {
  model_version: string;
  is_trained: boolean;
  temperature: number;
  vocabulary_size: number;
  training_samples: number;
  supported_rules: string[];
}

// -------------------------------------------------------------
// Phase 6: IOGP Life-Saving Rules Multi-Label Classifier
// -------------------------------------------------------------

export interface IOGPRuleResultData {
  rule_name: string;
  probability: number;
  threshold: number;
  is_triggered: boolean;
  rank: number;
  evidence_spans: string[];
}

export interface IOGPCoOccurrenceItemData {
  rule_a: string;
  rule_b: string;
  historical_co_occurrences: number;
  synergy_confidence: number;
}

export interface IOGPMultiLabelResponseData {
  primary_rule: string;
  secondary_rules: string[];
  triggered_rules: string[];
  rule_scores: Record<string, IOGPRuleResultData>;
  co_occurrence_tags: IOGPCoOccurrenceItemData[];
  latency_ms: number;
  raw_text: string;
}

export interface IOGPTopPairData {
  rule_1: string;
  rule_2: string;
  co_occurrence_count: number;
}

export interface IOGPMatrixResponseData {
  rules: string[];
  matrix: number[][];
  prevalence: Record<string, number>;
  top_pairs: IOGPTopPairData[];
}

export interface IOGPPerRuleReportData {
  rule_name: string;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  support: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface IOGPEvaluationReportResponseData {
  total_samples: number;
  hamming_loss: number;
  subset_accuracy: number;
  jaccard_similarity: number;
  micro_precision: number;
  micro_recall: number;
  micro_f1: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  primary_rule_accuracy: number;
  per_rule_metrics: Record<string, IOGPPerRuleReportData>;
  average_latency_ms: number;
  evaluated_at: string;
}

export interface IOGPThresholdUpdateResponseData {
  updated: boolean;
  current_thresholds: Record<string, number>;
  message: string;
}

export interface IOGPStatusResponseData {
  model_type: string;
  version: string;
  rules_count: number;
  canonical_rules: string[];
  current_thresholds: Record<string, number>;
  model_file: string;
  is_persisted: boolean;
}

