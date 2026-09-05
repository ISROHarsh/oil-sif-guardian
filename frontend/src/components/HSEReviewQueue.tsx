import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Filter,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { ReportListItem, ReportResponse } from '../types';

interface HSEReviewQueueProps {
  onSelectReport: (report: ReportResponse) => void;
}

export const HSEReviewQueue: React.FC<HSEReviewQueueProps> = ({ onSelectReport }) => {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');

  // Review modal state
  const [activeReport, setActiveReport] = useState<ReportResponse | null>(null);
  const [reviewerId, setReviewerId] = useState('HSE-OFFICER-OIL-01');
  const [reviewStatus, setReviewStatus] = useState<'CONFIRMED' | 'MODIFIED' | 'REJECTED'>('CONFIRMED');
  const [finalPsif, setFinalPsif] = useState<'HIGH' | 'REVIEW' | 'LOW'>('HIGH');
  const [notes, setNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.listReports({
        priority: selectedPriority || undefined,
        review_status: selectedStatus || undefined,
        limit: 50,
      });
      setReports(data.items);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedPriority, selectedStatus]);

  const handleOpenReview = async (item: ReportListItem) => {
    try {
      const full = await api.getReport(item.report_id);
      setActiveReport(full);
      setFinalPsif(full.psif?.priority || 'HIGH');
      setNotes(full.review?.reviewer_notes || '');
      setModalSuccess(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;

    setSubmittingReview(true);
    try {
      await api.submitReview(activeReport.report_id, {
        reviewer_id: reviewerId,
        status: reviewStatus,
        final_psif_label: finalPsif,
        reviewer_notes: notes,
      });
      setModalSuccess(true);
      fetchReports();
      setTimeout(() => {
        setActiveReport(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-400" />
          <h2 className="font-bold text-slate-100">HSE Human-in-the-Loop Review Queue</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Status:</span>
            <select
              className="form-select py-1.5 px-3 text-xs w-auto"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="MODIFIED">Modified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Priority:</span>
            <select
              className="form-select py-1.5 px-3 text-xs w-auto"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High SIF Potential</option>
              <option value="REVIEW">Review Required</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          <button
            onClick={fetchReports}
            className="btn btn-secondary py-1.5 px-3 text-xs"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Loading HSE review queue...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            All caught up! No reports matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Probability</th>
                  <th className="py-3 px-4">Primary Rule</th>
                  <th className="py-3 px-4">Site / Asset</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {reports.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => handleOpenReview(item)}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {item.report_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          item.priority === 'HIGH'
                            ? 'badge-high'
                            : item.priority === 'REVIEW'
                            ? 'badge-review'
                            : 'badge-low'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {(item.psif_probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-blue-400 font-sans">
                      {item.primary_rule || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans truncate max-w-xs">
                      {item.site}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {item.review_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenReview(item)}
                        className="btn btn-secondary py-1 px-2.5 text-[11px]"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-amber-500/40 shadow-glow-amber">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100">
                  HSE Decision & Triage Sign-off — {activeReport.report_id}
                </h3>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Review recorded successfully! Audit trail updated.</span>
              </div>
            )}

            {/* Narrative snippet */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-300">
              <div className="text-slate-400 mb-1 text-[11px] font-sans font-semibold uppercase">
                Incident Narrative:
              </div>
              {activeReport.raw_text}
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Reviewing Officer ID *</label>
                  <input
                    type="text"
                    className="form-input text-xs font-mono"
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Review Decision *</label>
                  <select
                    className="form-select text-xs"
                    value={reviewStatus}
                    onChange={(e: any) => setReviewStatus(e.target.value)}
                  >
                    <option value="CONFIRMED">CONFIRM (Concur with AI Triage)</option>
                    <option value="MODIFIED">MODIFY (Override Priority)</option>
                    <option value="REJECTED">REJECT (Declassify from SIF)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Final PSIF Priority Verdict</label>
                <div className="flex items-center gap-4">
                  {(['HIGH', 'REVIEW', 'LOW'] as const).map((p) => (
                    <label key={p} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="finalPsif"
                        value={p}
                        checked={finalPsif === p}
                        onChange={() => setFinalPsif(p)}
                      />
                      <span className={`badge ${p === 'HIGH' ? 'badge-high' : p === 'REVIEW' ? 'badge-review' : 'badge-low'}`}>
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">HSE Investigation & Triage Rationale *</label>
                <textarea
                  rows={3}
                  className="form-textarea text-xs"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="State basis for decision, actions taken in field, or reason for override..."
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onSelectReport(activeReport);
                    setActiveReport(null);
                  }}
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Explainability</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReport(null)}
                    className="btn btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview || modalSuccess}
                    className="btn btn-primary text-xs"
                  >
                    {submittingReview ? 'Submitting Sign-off...' : 'Sign-off & Update Audit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
