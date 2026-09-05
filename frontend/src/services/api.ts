import {
  ReportResponse,
  ReportListResponse,
  AnalyticsOverview,
  ReviewInfo,
  CorrectiveAction
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

  async listReports(params?: {
    priority?: string;
    site?: string;
    review_status?: string;
    skip?: number;
    limit?: number;
  }): Promise<ReportListResponse> {
    const query = new URLSearchParams();
    if (params?.priority) query.append('priority', params.priority);
    if (params?.site) query.append('site', params.site);
    if (params?.review_status) query.append('review_status', params.review_status);
    if (params?.skip) query.append('skip', String(params.skip));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return await res.json();
  },

  async getReport(reportId: string): Promise<ReportResponse> {
    const res = await fetch(`${API_BASE}/reports/${reportId}`);
    if (!res.ok) throw new Error(`Failed to fetch report ${reportId}`);
    return await res.json();
  },

  async submitReview(
    reportId: string,
    payload: { reviewer_id: string; status: string; final_psif_label?: string; reviewer_notes?: string }
  ): Promise<ReviewInfo> {
    const res = await fetch(`${API_BASE}/reports/${reportId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to submit review');
    return await res.json();
  },

  async createCorrectiveAction(
    reportId: string,
    payload: { title: string; assigned_to: string; due_date?: string; status?: string; notes?: string }
  ): Promise<CorrectiveAction> {
    const res = await fetch(`${API_BASE}/reports/${reportId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to create corrective action');
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
  }
};
