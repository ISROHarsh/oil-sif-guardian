import {
  ReportResponse,
  ReportListResponse,
  AnalyticsOverview,
  ReviewInfo,
  CorrectiveAction,
  OntologyTerms,
  BarrierDefinition,
  BarrierAnalysisResult,
  SIFFingerprintResult,
  PrecursorCluster,
  ClusterGraphData,
  BaselineModelStatus,
  BaselineComparisonResult,
  ExtractionRequestData,
  ExtractionResponseData,
  BIOTaggingResponseData,
  NERTaxonomyResponseData,
  SequencePredictResponseData,
  TokenAttributionResponseData,
  EnsembleArbitrationResponseData,
  FourWayBenchmarkResponseData,
  ModelStatusResponseData,
  IOGPMultiLabelResponseData,
  IOGPMatrixResponseData,
  IOGPEvaluationReportResponseData,
  IOGPThresholdUpdateResponseData,
  IOGPStatusResponseData,
  RuleEvaluationResponseData,
  RuleCatalogResponseData,
  RuleCatalogItemData,
  RuleStatsResponseData,
  HybridDecisionResponseData,
  CalibrationReportResponseData,
  WeightTuneResponseData,
  DecisionStatusResponseData
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'healthy', version: '1.0.0', model_version: 'psif-v1.0 (local)' };
    }
  },

  async submitReport(payload: {
    site: string;
    location?: string;
    department?: string;
    activity?: string;
    equipment?: string[];
    reporter_role?: string;
    narrative: string;
    report_type?: string;
  }): Promise<ReportResponse> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit report' }));
      throw new Error(err.detail || 'Failed to submit report');
    }

    return await res.json();
  },

  async getReports(params: {
    priority?: string;
    rule?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ReportListResponse> {
    const query = new URLSearchParams();
    if (params.priority) query.append('priority', params.priority);
    if (params.rule) query.append('rule', params.rule);
    if (params.status) query.append('status', params.status);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return await res.json();
  },

  async listReports(params: {
    priority?: string;
    site?: string;
    review_status?: string;
    skip?: number;
    limit?: number;
    rule?: string;
    status?: string;
    offset?: number;
  } = {}): Promise<ReportListResponse> {
    const query = new URLSearchParams();
    if (params.priority) query.append('priority', params.priority);
    if (params.site) query.append('site', params.site);
    if (params.rule) query.append('rule', params.rule);
    if (params.status || params.review_status) query.append('status', params.status || params.review_status || '');
    if (params.limit) query.append('limit', params.limit.toString());
    const off = params.offset !== undefined ? params.offset : params.skip;
    if (off !== undefined) query.append('offset', off.toString());

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return await res.json();
  },

  async getReport(id: string): Promise<ReportResponse> {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    if (!res.ok) throw new Error('Failed to fetch report');
    return await res.json();
  },

  async submitReview(id: string, review: ReviewInfo): Promise<ReportResponse> {
    const res = await fetch(`${API_BASE}/reports/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return await res.json();
  },

  async createAction(id: string, action: Partial<CorrectiveAction>): Promise<CorrectiveAction> {
    const res = await fetch(`${API_BASE}/reports/${id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    if (!res.ok) throw new Error('Failed to create action');
    return await res.json();
  },

  async createCorrectiveAction(
    reportId: string,
    payload: { title: string; assigned_to: string; due_date?: string; status?: string; notes?: string }
  ): Promise<CorrectiveAction> {
    return this.createAction(reportId, payload as Partial<CorrectiveAction>);
  },

  async getActions(status?: string): Promise<CorrectiveAction[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/reports/actions/all${query}`);
    if (!res.ok) throw new Error('Failed to fetch actions');
    return await res.json();
  },

  async updateAction(actionId: string, update: Partial<CorrectiveAction>): Promise<CorrectiveAction> {
    const res = await fetch(`${API_BASE}/reports/actions/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update action');
    return await res.json();
  },

  async getOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch analytics overview');
    return await res.json();
  },

  async getTrends(): Promise<{
    temporal_trends: Array<{ month: string; total: number; high_psif: number; confined_space: number; energy_isolation: number }>;
    emerging_risks: Array<{ category: string; metric: string; severity: string; recommendation: string }>;
  }> {
    const res = await fetch(`${API_BASE}/analytics/trends`);
    if (!res.ok) throw new Error('Failed to fetch trends');
    return await res.json();
  },

  async getClusters(): Promise<{
    total_clusters: number;
    clusters: Array<{
      cluster_id: string;
      theme: string;
      reports_count: number;
      sites_affected: string[];
      dominant_rule: string;
      common_failure: string;
      exposure_fingerprint: string;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/analytics/clusters`);
    if (!res.ok) throw new Error('Failed to fetch clusters');
    return await res.json();
  },

  // Phase 3 Endpoints
  async getOntologyTerms(): Promise<OntologyTerms> {
    const res = await fetch(`${API_BASE}/ontology/terms`);
    if (!res.ok) throw new Error('Failed to fetch ontology terms');
    return await res.json();
  },

  async getBarrierDefinitions(): Promise<BarrierDefinition[]> {
    const res = await fetch(`${API_BASE}/ontology/barriers`);
    if (!res.ok) throw new Error('Failed to fetch barrier definitions');
    return await res.json();
  },

  async analyzeBarriers(narrative: string): Promise<BarrierAnalysisResult> {
    const res = await fetch(`${API_BASE}/ontology/analyze-barriers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative })
    });
    if (!res.ok) throw new Error('Failed to analyze barriers');
    return await res.json();
  },

  async generateFingerprint(
    narrative: string,
    activity?: string,
    site?: string,
    title?: string
  ): Promise<SIFFingerprintResult> {
    const res = await fetch(`${API_BASE}/ontology/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative, activity, site, title })
    });
    if (!res.ok) throw new Error('Failed to generate SIF fingerprint');
    return await res.json();
  },

  async getPrecursorClusters(): Promise<PrecursorCluster[]> {
    const res = await fetch(`${API_BASE}/clusters/precursors`);
    if (!res.ok) throw new Error('Failed to fetch precursor clusters');
    return await res.json();
  },

  async getPrecursorGraph(): Promise<ClusterGraphData> {
    const res = await fetch(`${API_BASE}/clusters/graph`);
    if (!res.ok) throw new Error('Failed to fetch precursor graph');
    return await res.json();
  },

  async getBaselineStatus(): Promise<BaselineModelStatus> {
    const res = await fetch(`${API_BASE}/baseline/status`);
    if (!res.ok) throw new Error('Failed to fetch baseline status');
    return await res.json();
  },

  async trainBaseline(use_golden_benchmark: boolean = true, use_db_reports: boolean = true): Promise<BaselineModelStatus> {
    const res = await fetch(`${API_BASE}/baseline/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ use_golden_benchmark, use_db_reports })
    });
    if (!res.ok) throw new Error('Failed to train baseline model');
    return await res.json();
  },

  async evaluateBaselineComparison(): Promise<BaselineComparisonResult> {
    const res = await fetch(`${API_BASE}/baseline/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to run baseline comparison evaluation');
    return await res.json();
  },

  async extractSafetyEntities(data: ExtractionRequestData): Promise<ExtractionResponseData> {
    const res = await fetch(`${API_BASE}/extraction/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to extract safety entities' }));
      throw new Error(err.detail || 'Failed to extract safety entities');
    }
    return await res.json();
  },

  async generateBIOTagging(data: ExtractionRequestData): Promise<BIOTaggingResponseData> {
    const res = await fetch(`${API_BASE}/extraction/bio-tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate BIO sequence tags' }));
      throw new Error(err.detail || 'Failed to generate BIO sequence tags');
    }
    return await res.json();
  },

  async getNERTaxonomy(): Promise<NERTaxonomyResponseData> {
    const res = await fetch(`${API_BASE}/extraction/taxonomy`);
    if (!res.ok) throw new Error('Failed to fetch NER taxonomy');
    return await res.json();
  },

  async predictSequence(narrative: string, activity?: string, site?: string): Promise<SequencePredictResponseData> {
    const res = await fetch(`${API_BASE}/models/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative, activity, site })
    });
    if (!res.ok) throw new Error('Failed to run sequence prediction');
    return await res.json();
  },

  async explainTokenAttribution(narrative: string): Promise<TokenAttributionResponseData> {
    const res = await fetch(`${API_BASE}/models/attribution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative })
    });
    if (!res.ok) throw new Error('Failed to compute token attribution');
    return await res.json();
  },

  async arbitrateEnsemble(narrative: string, activity?: string, site?: string): Promise<EnsembleArbitrationResponseData> {
    const res = await fetch(`${API_BASE}/models/ensemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative, activity, site })
    });
    if (!res.ok) throw new Error('Failed to run ensemble arbitration');
    return await res.json();
  },

  async getFourWayBenchmark(): Promise<FourWayBenchmarkResponseData> {
    const res = await fetch(`${API_BASE}/models/benchmark`);
    if (!res.ok) throw new Error('Failed to fetch 4-way benchmark report');
    return await res.json();
  },

  async getModelStatus(): Promise<ModelStatusResponseData> {
    const res = await fetch(`${API_BASE}/models/status`);
    if (!res.ok) throw new Error('Failed to fetch model status');
    return await res.json();
  },

  async predictIOGPMultiLabel(
    narrative: string,
    title?: string,
    thresholdOverrides?: Record<string, number>
  ): Promise<IOGPMultiLabelResponseData> {
    const res = await fetch(`${API_BASE}/iogp/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative, title, threshold_overrides: thresholdOverrides })
    });
    if (!res.ok) throw new Error('Failed to execute IOGP multi-label prediction');
    return await res.json();
  },

  async getIOGPMatrix(): Promise<IOGPMatrixResponseData> {
    const res = await fetch(`${API_BASE}/iogp/matrix`);
    if (!res.ok) throw new Error('Failed to fetch IOGP co-occurrence matrix');
    return await res.json();
  },

  async getIOGPBenchmark(): Promise<IOGPEvaluationReportResponseData> {
    const res = await fetch(`${API_BASE}/iogp/benchmark`);
    if (!res.ok) throw new Error('Failed to fetch IOGP benchmark report');
    return await res.json();
  },

  async updateIOGPThresholds(thresholds: Record<string, number>): Promise<IOGPThresholdUpdateResponseData> {
    const res = await fetch(`${API_BASE}/iogp/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholds })
    });
    if (!res.ok) throw new Error('Failed to update IOGP thresholds');
    return await res.json();
  },

  async getIOGPStatus(): Promise<IOGPStatusResponseData> {
    const res = await fetch(`${API_BASE}/iogp/status`);
    if (!res.ok) throw new Error('Failed to fetch IOGP status');
    return await res.json();
  },

  // Phase 7: Deterministic Safety Rules & Codified Catalog Endpoints
  async evaluateRules(narrative: string, title?: string): Promise<RuleEvaluationResponseData> {
    const res = await fetch(`${API_BASE}/rules/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative, title: title || '' })
    });
    if (!res.ok) throw new Error('Failed to evaluate narrative against safety rules');
    return await res.json();
  },

  async getRuleCatalog(category?: string, severity?: string): Promise<RuleCatalogResponseData> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (severity && severity !== 'All') params.append('severity', severity);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/rules/catalog${qs}`);
    if (!res.ok) throw new Error('Failed to fetch codified safety rule catalog');
    return await res.json();
  },

  async getRuleById(ruleId: string): Promise<RuleCatalogItemData> {
    const res = await fetch(`${API_BASE}/rules/catalog/${encodeURIComponent(ruleId)}`);
    if (!res.ok) throw new Error(`Failed to fetch rule ${ruleId}`);
    return await res.json();
  },

  async getRuleStats(): Promise<RuleStatsResponseData> {
    const res = await fetch(`${API_BASE}/rules/stats`);
    if (!res.ok) throw new Error('Failed to fetch rule engine golden benchmark statistics');
    return await res.json();
  },

  // Phase 8: Calibrated Hybrid Decision Engine Endpoints
  async triageHybridDecision(
    narrative: string,
    title?: string,
    weightOverrides?: Record<string, number>,
    tauHighOverride?: number,
    tauLowOverride?: number
  ): Promise<HybridDecisionResponseData> {
    const res = await fetch(`${API_BASE}/decision/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        narrative,
        title: title || '',
        weight_overrides: weightOverrides,
        tau_high_override: tauHighOverride,
        tau_low_override: tauLowOverride
      })
    });
    if (!res.ok) throw new Error('Failed to execute calibrated hybrid decision triage');
    return await res.json();
  },

  async getDecisionCalibration(): Promise<CalibrationReportResponseData> {
    const res = await fetch(`${API_BASE}/decision/calibration`);
    if (!res.ok) throw new Error('Failed to fetch decision calibration report');
    return await res.json();
  },

  async tuneDecisionWeights(params: {
    sequence_weight?: number;
    iogp_weight?: number;
    tfidf_weight?: number;
    tau_high?: number;
    tau_low?: number;
    temperature?: number;
  }): Promise<WeightTuneResponseData> {
    const res = await fetch(`${API_BASE}/decision/tune-weights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to tune decision weights');
    return await res.json();
  },

  async getDecisionStatus(): Promise<DecisionStatusResponseData> {
    const res = await fetch(`${API_BASE}/decision/status`);
    if (!res.ok) throw new Error('Failed to fetch decision engine status');
    return await res.json();
  }
};
