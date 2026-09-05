import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Filter,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Clock,
  Activity,
  History,
  TrendingUp,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sliders,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import {
  ReportResponse,
  PendingReviewItem,
  ReviewHistoryItem,
  ReviewMetricsData,
  AdjudicationRequest
} from '../types';

interface HSEReviewQueueProps {
  onSelectReport: (report: ReportResponse) => void;
}

const CANONICAL_IOGP_RULES = [
  'Bypassing Safety Controls',
  'Confined Space',
  'Driving',
  'Energy Isolation',
  'Hot Work',
  'Line of Fire',
  'Safe Mechanical Lifting',
  'Toxic Gas',
  'Work Authorization',
  'Working at Height'
];

const BARRIER_CATEGORIES = [
  'Physical Barrier / Containment',
  'Operational / Procedural Control',
  'Administrative / Permit-to-Work',
  'Gas Detection / Monitoring System',
  'Personal Protective Equipment (PPE)'
];

const STATUTORY_TAGS = [
  'OISD-105 (Work Permit)',
  'OISD-114 (Hazardous Area)',
  'OISD-118 (LOTO)',
  'OISD-137 (Flare System)',
  'OISD-141 (Rig Safety)',
  'OISD-152 (Structural Integrity)',
  'DGMS (OMR-2017)',
  'CEA Safety Reg 30',
  'Factories Act 1948',
  'PNGRB G.S.R. 808(E)'
];

const OVERRIDE_REASONS = [
  { code: 'PRECURSOR_CONFIRMED', label: 'Precursor Confirmed (Concur with AI assessment)' },
  { code: 'ENERGY_MITIGATED', label: 'Energy Mitigated (Hazard was isolated / depressurized to 0 psi)' },
  { code: 'FALSE_POSITIVE_KEYWORD', label: 'False Positive Keyword (Context was non-hazardous / training)' },
  { code: 'INCORRECT_ATTRIBUTION', label: 'Incorrect Attribution (Model misclassified activity or rule)' },
  { code: 'PHYSICAL_ISOLATION_CONFIRMED', label: 'Physical Isolation Confirmed (Air gap / blind flange verified)' },
  { code: 'EQUIPMENT_DECOMMISSIONED', label: 'Equipment Decommissioned (Vessel was out of service and purged)' },
  { code: 'ADMINISTRATIVE_ONLY', label: 'Administrative Only (Paperwork discrepancy with zero physical hazard)' },
  { code: 'IMMEDIATE_STAND_DOWN', label: 'Immediate Stand-down (Work stopped immediately before exposure)' },
  { code: 'OTHER', label: 'Other (Detailed in investigation notes)' }
];

export const HSEReviewQueue: React.FC<HSEReviewQueueProps> = ({ onSelectReport }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'METRICS_HISTORY'>('QUEUE');

  // Queue state
  const [pendingReports, setPendingReports] = useState<PendingReviewItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ReviewHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<ReviewMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterVetoOnly, setFilterVetoOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Adjudication Modal state
  const [activeItem, setActiveItem] = useState<PendingReviewItem | null>(null);
  const [activeFullReport, setActiveFullReport] = useState<ReportResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form inputs
  const [reviewerId, setReviewerId] = useState('HSE-LEAD-OIL-01');
  const [reviewerRole, setReviewerRole] = useState<'HSE_OFFICER' | 'HSE_LEAD' | 'SAFETY_MANAGER' | 'CHIEF_SAFETY_OFFICER' | 'LEAD_AUDITOR'>('HSE_LEAD');
  const [decision, setDecision] = useState<'CONFIRMED' | 'MODIFIED' | 'REJECTED' | 'ESCALATED'>('CONFIRMED');
  const [finalPriority, setFinalPriority] = useState<'HIGH' | 'REVIEW' | 'LOW'>('HIGH');
  const [finalPrimaryRule, setFinalPrimaryRule] = useState<string>('');
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>([]);
  const [selectedStatutory, setSelectedStatutory] = useState<string[]>([]);
  const [overrideReason, setOverrideReason] = useState<string>('PRECURSOR_CONFIRMED');
  const [notes, setNotes] = useState<string>('');
  const [seniorSignoff, setSeniorSignoff] = useState<string>('');

  // Corrective action creation
  const [createAction, setCreateAction] = useState<boolean>(false);
  const [actionTitle, setActionTitle] = useState<string>('');
  const [actionAssignee, setActionAssignee] = useState<string>('');
  const [actionDueDate, setActionDueDate] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes, metricsRes] = await Promise.all([
        api.getPendingReviews({
          priority: filterPriority || undefined,
          veto_only: filterVetoOnly || undefined,
          limit: 100
        }),
        api.getReviewHistory({ limit: 20 }),
        api.getReviewMetrics()
      ]);
      setPendingReports(pendingRes);
      setHistoryItems(historyRes);
      setMetrics(metricsRes);
    } catch (err) {
      console.error('Failed to load review data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterPriority, filterVetoOnly]);

  const handleOpenAdjudication = async (item: PendingReviewItem) => {
    setActiveItem(item);
    setModalLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Initialize defaults based on AI suggestions
    setDecision('CONFIRMED');
    setFinalPriority(item.ai_priority);
    setFinalPrimaryRule(item.primary_rule || CANONICAL_IOGP_RULES[0]);
    setSelectedBarriers([]);
    setSelectedStatutory(item.statutory_citation ? [item.statutory_citation] : []);
    setOverrideReason('PRECURSOR_CONFIRMED');
    setNotes('');
    setSeniorSignoff('');
    setCreateAction(item.ai_priority === 'HIGH' || item.is_veto_enforced);
    setActionTitle(`Remediate safety gap for ${item.report_id} (${item.primary_rule || 'Critical Control'})`);
    setActionAssignee('HSE Field Operations Superintendent');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    setActionDueDate(futureDate.toISOString().split('T')[0]);

    try {
      const full = await api.getReport(item.report_id);
      setActiveFullReport(full);
      if (full.life_saving_rules && full.life_saving_rules.length > 0) {
        setFinalPrimaryRule(full.life_saving_rules[0].rule_name);
      }
    } catch (err) {
      console.error('Failed to fetch full report:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDecisionChange = (newDecision: 'CONFIRMED' | 'MODIFIED' | 'REJECTED' | 'ESCALATED') => {
    setDecision(newDecision);
    if (newDecision === 'CONFIRMED' && activeItem) {
      setFinalPriority(activeItem.ai_priority);
      setOverrideReason('PRECURSOR_CONFIRMED');
    } else if (newDecision === 'REJECTED') {
      setFinalPriority('LOW');
      setOverrideReason('FALSE_POSITIVE_KEYWORD');
    } else if (newDecision === 'MODIFIED') {
      if (overrideReason === 'PRECURSOR_CONFIRMED') {
        setOverrideReason('ENERGY_MITIGATED');
      }
    }
  };

  const handleToggleBarrier = (barrier: string) => {
    setSelectedBarriers((prev) =>
      prev.includes(barrier) ? prev.filter((b) => b !== barrier) : [...prev, barrier]
    );
  };

  const handleToggleStatutory = (tag: string) => {
    setSelectedStatutory((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const isVetoDowngrade = Boolean(
    activeItem?.is_veto_enforced && (finalPriority === 'LOW' || finalPriority === 'REVIEW' || decision === 'REJECTED')
  );

  const isSeniorRole = ['HSE_LEAD', 'SAFETY_MANAGER', 'CHIEF_SAFETY_OFFICER', 'LEAD_AUDITOR'].includes(reviewerRole);

  const handleSubmitAdjudication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    setSubmitting(true);
    setErrorMessage(null);

    const payload: AdjudicationRequest = {
      report_id: activeItem.report_id,
      reviewer_id: reviewerId,
      reviewer_role: reviewerRole,
      decision,
      final_priority: finalPriority,
      final_primary_rule: finalPrimaryRule,
      final_secondary_rules: activeFullReport?.life_saving_rules?.slice(1).map((r) => r.rule_name) || [],
      barrier_failures: selectedBarriers,
      statutory_tags: selectedStatutory,
      override_reason_code: overrideReason,
      reviewer_notes: notes,
      senior_signoff_by: seniorSignoff || (isSeniorRole ? reviewerId : undefined),
      create_corrective_action: createAction,
      action_title: createAction ? actionTitle : undefined,
      action_assignee: createAction ? actionAssignee : undefined,
      action_due_date: createAction ? actionDueDate : undefined
    };

    try {
      const res = await api.adjudicateReport(payload);
      setSuccessMessage(
        `Adjudication recorded! Verdict: ${res.final_priority}. Audit Event: ${res.audit_event_id.slice(0, 8)}...`
      );
      fetchData();
      setTimeout(() => {
        setActiveItem(null);
        setActiveFullReport(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit adjudication');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered reports in queue
  const displayedReports = pendingReports.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.report_id.toLowerCase().includes(q) ||
      r.site.toLowerCase().includes(q) ||
      r.raw_text.toLowerCase().includes(q) ||
      (r.primary_rule && r.primary_rule.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & HITL Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Adjudications</div>
            <div className="text-2xl font-black text-slate-100 font-mono">
              {metrics?.pending_count ?? pendingReports.length}
            </div>
            <div className="text-[10px] text-slate-400">Reports awaiting HSE sign-off</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-rose-500">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High-PSIF Unreviewed</div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {metrics?.high_priority_pending ?? 0}
            </div>
            <div className="text-[10px] text-slate-400">Mandatory statutory priority</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Human-AI Concurrence</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {metrics ? `${(metrics.agreement_rate * 100).toFixed(1)}%` : '100%'}
            </div>
            <div className="text-[10px] text-slate-400">High-PSIF Concordance: {metrics ? `${(metrics.high_psif_agreement_rate * 100).toFixed(1)}%` : '100%'}</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calibration Drift Status</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`badge font-bold tracking-wider ${
                  metrics?.drift_status === 'NORMAL'
                    ? 'badge-low'
                    : metrics?.drift_status === 'WARNING'
                    ? 'badge-review'
                    : 'badge-high'
                }`}
              >
                {metrics?.drift_status || 'NORMAL'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={metrics?.drift_alert_message}>
              {metrics?.drift_alert_message || 'Zero drift detected'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'QUEUE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Active Triage Queue</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {pendingReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('METRICS_HISTORY')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'METRICS_HISTORY'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Adjudication Analytics & Audit History</span>
            {historyItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {historyItems.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Active Review Queue Tab */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search report ID, narrative, site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input text-xs pl-3 pr-8 py-1.5 w-64 bg-slate-900 border-slate-700"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="form-select py-1 px-2 text-xs bg-slate-900 border-slate-700 w-auto"
                >
                  <option value="">All Priorities</option>
                  <option value="HIGH">High PSIF</option>
                  <option value="REVIEW">Review Required</option>
                  <option value="LOW">Low Risk</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterVetoOnly}
                  onChange={(e) => setFilterVetoOnly(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
                />
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Veto Guardrails Only
                </span>
              </label>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing {displayedReports.length} of {pendingReports.length} pending reports
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                Retrieving pending reports for HSE triage...
              </div>
            ) : displayedReports.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                Zero pending items match the current filters! All caught up.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Report ID</th>
                      <th className="py-3 px-4">AI Priority</th>
                      <th className="py-3 px-4">Calibrated P(SIF)</th>
                      <th className="py-3 px-4">Statutory Veto Guardrail</th>
                      <th className="py-3 px-4">Primary IOGP Rule</th>
                      <th className="py-3 px-4">Site / Installation</th>
                      <th className="py-3 px-4">Pending Age</th>
                      <th className="py-3 px-4 text-right">Adjudication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {displayedReports.map((item) => (
                      <tr
                        key={item.report_id}
                        onClick={() => handleOpenAdjudication(item)}
                        className={`hover:bg-slate-800/50 transition cursor-pointer ${
                          item.is_veto_enforced ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-200">
                          {item.report_id}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`badge ${
                              item.ai_priority === 'HIGH'
                                ? 'badge-high'
                                : item.ai_priority === 'REVIEW'
                                ? 'badge-review'
                                : 'badge-low'
                            }`}
                          >
                            {item.ai_priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          {(item.psif_probability * 100).toFixed(1)}%
                          <span className="text-[10px] text-slate-400 font-sans ml-1">
                            ({item.confidence})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.is_veto_enforced ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                              {item.statutory_citation || 'VETO TRIGGERED'}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-sans text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans text-blue-300 font-medium truncate max-w-xs">
                          {item.primary_rule || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300 truncate max-w-xs">
                          {item.site}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {item.days_pending === 0 ? 'Today' : `${item.days_pending}d ago`}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenAdjudication(item)}
                            className="btn btn-primary py-1 px-3 text-[11px] flex items-center gap-1 ml-auto"
                          >
                            <span>Adjudicate</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjudication Analytics & History Tab */}
      {activeTab === 'METRICS_HISTORY' && (
        <div className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3x3 Transition Matrix */}
            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Human-AI Priority Transition Matrix</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Total Adjudicated: {metrics?.adjudicated_count ?? 0}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="text-[10px] text-slate-400 font-mono uppercase bg-slate-900/60">
                    <tr>
                      <th className="p-2 text-left">AI Triage \ HSE Final</th>
                      <th className="p-2 text-rose-400">Final HIGH</th>
                      <th className="p-2 text-amber-400">Final REVIEW</th>
                      <th className="p-2 text-emerald-400">Final LOW</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    <tr>
                      <td className="p-2.5 text-left font-bold text-rose-400 bg-slate-900/30">AI: HIGH</td>
                      <td className="p-2.5 bg-emerald-500/10 text-emerald-300 font-bold">
                        {metrics?.priority_transitions?.HIGH_TO_HIGH ?? 0}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {metrics?.priority_transitions?.HIGH_TO_REVIEW ?? 0}
                      </td>
                      <td className="p-2.5 text-rose-400 font-semibold">
                        {metrics?.priority_transitions?.HIGH_TO_LOW ?? 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-left font-bold text-amber-400 bg-slate-900/30">AI: REVIEW</td>
                      <td className="p-2.5 text-amber-300 font-semibold">
                        {metrics?.priority_transitions?.REVIEW_TO_HIGH ?? 0}
                      </td>
                      <td className="p-2.5 bg-emerald-500/10 text-emerald-300 font-bold">
                        {metrics?.priority_transitions?.REVIEW_TO_REVIEW ?? 0}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {metrics?.priority_transitions?.REVIEW_TO_LOW ?? 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-left font-bold text-emerald-400 bg-slate-900/30">AI: LOW</td>
                      <td className="p-2.5 text-rose-400 font-semibold">
                        {metrics?.priority_transitions?.LOW_TO_HIGH ?? 0}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {metrics?.priority_transitions?.LOW_TO_REVIEW ?? 0}
                      </td>
                      <td className="p-2.5 bg-emerald-500/10 text-emerald-300 font-bold">
                        {metrics?.priority_transitions?.LOW_TO_LOW ?? 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-slate-400 italic">
                Diagonal values indicate perfect concurrence between AI and HSE Officer verdicts.
              </div>
            </div>

            {/* Drift Advisory Card */}
            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Model Governance & Drift Recommendations</h3>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Drift Status:</span>
                  <span
                    className={`badge ${
                      metrics?.drift_status === 'NORMAL'
                        ? 'badge-low'
                        : metrics?.drift_status === 'WARNING'
                        ? 'badge-review'
                        : 'badge-high'
                    }`}
                  >
                    {metrics?.drift_status || 'NORMAL'}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {metrics?.drift_alert_message}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Calibration Directives:
                </div>
                {metrics?.recommendations && metrics.recommendations.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {metrics.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400">Zero active alerts. System calibration stable.</div>
                )}
              </div>
            </div>
          </div>

          {/* Audit History Table */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Completed HSE Adjudication Audit Log</h3>
              </div>
            </div>

            {historyItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No completed adjudications logged yet. Review items from the active queue to populate.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Report ID</th>
                      <th className="py-2.5 px-3">Reviewer / Role</th>
                      <th className="py-2.5 px-3">Decision</th>
                      <th className="py-2.5 px-3">AI \ Final Priority</th>
                      <th className="py-2.5 px-3">Veto Override</th>
                      <th className="py-2.5 px-3">Reason Code</th>
                      <th className="py-2.5 px-3">Reviewed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {historyItems.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-200">{h.report_id}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">
                          {h.reviewer_id} <span className="text-slate-500 text-[10px]">({h.reviewer_role})</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {h.decision}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-400">{h.ai_priority}</span>
                          <span className="mx-1.5 text-slate-600">→</span>
                          <span
                            className={`font-bold ${
                              h.final_priority === 'HIGH'
                                ? 'text-rose-400'
                                : h.final_priority === 'REVIEW'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {h.final_priority}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {h.veto_override_approved ? (
                            <span className="text-rose-400 font-bold text-[10px] px-1.5 py-0.5 bg-rose-500/10 rounded border border-rose-500/30">
                              OVERRIDDEN
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">
                          {h.override_reason_code || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {h.reviewed_at ? new Date(h.reviewed_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side Adjudication Modal */}
      {activeItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="glass-panel w-full max-w-5xl max-h-[92vh] flex flex-col border border-amber-500/40 shadow-2xl shadow-amber-950/40">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  HSE Expert Adjudication & Triage Sign-off — <span className="font-mono text-amber-400">{activeItem.report_id}</span>
                </h3>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Side-by-Side Grid */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: AI Precursor Intelligence & Incident Evidence */}
              <div className="lg:col-span-5 space-y-4 border-r border-slate-800/80 pr-0 lg:pr-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>AI Precursor Intelligence</span>
                </div>

                {/* AI Score & Confidence Box */}
                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">AI Priority Suggestion:</span>
                    <span
                      className={`badge ${
                        activeItem.ai_priority === 'HIGH'
                          ? 'badge-high'
                          : activeItem.ai_priority === 'REVIEW'
                          ? 'badge-review'
                          : 'badge-low'
                      }`}
                    >
                      {activeItem.ai_priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Calibrated P(SIF):</span>
                    <span className="font-mono font-bold text-sm text-slate-100">
                      {(activeItem.psif_probability * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Confidence Band:</span>
                    <span className="font-mono text-xs text-slate-300">{activeItem.confidence}</span>
                  </div>
                </div>

                {/* Veto Guardrail Alert Banner */}
                {activeItem.is_veto_enforced && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>Statutory Safety Veto Triggered</span>
                    </div>
                    <div className="text-xs text-slate-200 font-sans">
                      {activeItem.veto_rule_name || 'Fatal precursor zero-tolerance guardrail active.'}
                    </div>
                    {activeItem.statutory_citation && (
                      <div className="text-[11px] text-rose-300 font-mono font-semibold">
                        Mandate: {activeItem.statutory_citation}
                      </div>
                    )}
                  </div>
                )}

                {/* Primary & Secondary Rules */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Predicted Life-Saving Rules:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeItem.primary_rule && (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">
                        ★ {activeItem.primary_rule} (Primary)
                      </span>
                    )}
                    {activeItem.secondary_rules.map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Narrative & Evidence Box */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>Incident Narrative:</span>
                    <span className="text-[10px] text-slate-500 font-mono">{activeItem.site}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono max-h-48 overflow-y-auto">
                    {activeItem.raw_text}
                  </div>
                </div>

                {/* Deep Dive Action */}
                {activeFullReport && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectReport(activeFullReport);
                      setActiveItem(null);
                    }}
                    className="btn btn-secondary w-full text-xs flex items-center justify-center gap-1.5 py-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full Extraction & Causal Reasoner</span>
                  </button>
                )}
              </div>

              {/* Right Column: Expert HSE Adjudication Form */}
              <div className="lg:col-span-7 space-y-4">
                <form onSubmit={handleSubmitAdjudication} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-300 rounded text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded text-xs flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Reviewer Role & Officer ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs">Reviewing Officer ID *</label>
                      <input
                        type="text"
                        value={reviewerId}
                        onChange={(e) => setReviewerId(e.target.value)}
                        required
                        className="form-input text-xs font-mono bg-slate-900 border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Reviewer Role *</label>
                      <select
                        value={reviewerRole}
                        onChange={(e: any) => setReviewerRole(e.target.value)}
                        className="form-select text-xs bg-slate-900 border-slate-700"
                      >
                        <option value="HSE_LEAD">Senior HSE Lead / Inspector</option>
                        <option value="SAFETY_MANAGER">Installation Safety Manager</option>
                        <option value="CHIEF_SAFETY_OFFICER">Chief Safety Officer (CSO)</option>
                        <option value="LEAD_AUDITOR">Lead Process Safety Auditor</option>
                        <option value="HSE_OFFICER">HSE Field Officer</option>
                      </select>
                    </div>
                  </div>

                  {/* Decision Verdict Segmented Control */}
                  <div>
                    <label className="form-label text-xs">Adjudication Verdict *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'CONFIRMED', label: 'CONFIRM', sub: 'Concur with AI' },
                        { key: 'MODIFIED', label: 'MODIFY', sub: 'Override Triage' },
                        { key: 'REJECTED', label: 'REJECT', sub: 'Declassify SIF' },
                        { key: 'ESCALATED', label: 'ESCALATE', sub: 'Urgent Shutdown' }
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleDecisionChange(item.key as any)}
                          className={`p-2 rounded-lg text-left transition border ${
                            decision === item.key
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="font-bold text-xs">{item.label}</div>
                          <div className="text-[10px] text-slate-400">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Cards */}
                  <div>
                    <label className="form-label text-xs">Final PSIF Priority Level *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'HIGH', label: 'HIGH SIF', desc: 'Fatal Precursor' },
                        { key: 'REVIEW', label: 'REVIEW', desc: 'Control Failure' },
                        { key: 'LOW', label: 'LOW RISK', desc: 'Minor Hazard' }
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setFinalPriority(p.key as any)}
                          className={`p-2.5 rounded-lg text-center transition border ${
                            finalPriority === p.key
                              ? p.key === 'HIGH'
                                ? 'bg-rose-500/25 text-rose-300 border-rose-500'
                                : p.key === 'REVIEW'
                                ? 'bg-amber-500/25 text-amber-300 border-amber-500'
                                : 'bg-emerald-500/25 text-emerald-300 border-emerald-500'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="font-bold text-xs">{p.label}</div>
                          <div className="text-[10px] opacity-75">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Veto Downgrade Guardrail Warning */}
                  {isVetoDowngrade && (
                    <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/50 space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Rule 2 Statutory Protection: Downgrading Codified Safety Veto</span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-snug">
                        This report triggers a deterministic safety rule ({activeItem.veto_rule_name || 'Tier-1 Veto'}).
                        Downgrading requires Senior HSE Lead sign-off, valid reason code, and minimum 30 characters justification.
                      </div>
                      {!isSeniorRole && (
                        <div className="pt-1">
                          <label className="form-label text-[11px] text-rose-300">Senior Lead Authorizer ID *</label>
                          <input
                            type="text"
                            placeholder="e.g. HSE-LEAD-CHIEF-01"
                            value={seniorSignoff}
                            onChange={(e) => setSeniorSignoff(e.target.value)}
                            required
                            className="form-input text-xs font-mono bg-slate-900 border-rose-500/40 text-slate-100"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Override Reason Code */}
                  {(decision === 'MODIFIED' || decision === 'REJECTED' || isVetoDowngrade) && (
                    <div>
                      <label className="form-label text-xs">Override Justification Category *</label>
                      <select
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="form-select text-xs bg-slate-900 border-slate-700"
                        required
                      >
                        {OVERRIDE_REASONS.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Primary IOGP Rule Dropdown */}
                  <div>
                    <label className="form-label text-xs">Primary IOGP Life-Saving Rule</label>
                    <select
                      value={finalPrimaryRule}
                      onChange={(e) => setFinalPrimaryRule(e.target.value)}
                      className="form-select text-xs bg-slate-900 border-slate-700"
                    >
                      {CANONICAL_IOGP_RULES.map((rule) => (
                        <option key={rule} value={rule}>
                          {rule}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Barrier Failure Checklist */}
                  <div className="space-y-1.5">
                    <label className="form-label text-xs">Barrier Failures Identified by HSE:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {BARRIER_CATEGORIES.map((cat) => (
                        <label
                          key={cat}
                          onClick={() => handleToggleBarrier(cat)}
                          className={`flex items-center gap-2 p-1.5 rounded text-[11px] cursor-pointer border transition ${
                            selectedBarriers.includes(cat)
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBarriers.includes(cat)}
                            onChange={() => {}}
                            className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
                          />
                          <span className="truncate">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Statutory Compliance Tags */}
                  <div className="space-y-1.5">
                    <label className="form-label text-xs">Statutory Tags (OISD / DGMS / CEA):</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUTORY_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleStatutory(tag)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                            selectedStatutory.includes(tag)
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rationale Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label text-xs mb-0">HSE Technical Investigation Rationale *</label>
                      <span
                        className={`text-[10px] font-mono ${
                          isVetoDowngrade && notes.length < 30
                            ? 'text-rose-400 font-bold'
                            : notes.length < 10
                            ? 'text-slate-500'
                            : 'text-emerald-400'
                        }`}
                      >
                        {notes.length} chars {isVetoDowngrade ? '(min 30 required)' : '(min 10)'}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="State technical basis for priority verdict, verified field mitigations, or reason for modifying AI triage..."
                      required
                      className="form-textarea text-xs bg-slate-900 border-slate-700"
                    />
                  </div>

                  {/* Corrective Action Section */}
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={createAction}
                        onChange={(e) => setCreateAction(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Provision Immediate Corrective Action</span>
                    </label>

                    {createAction && (
                      <div className="space-y-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <label className="form-label text-[11px]">Action Title *</label>
                          <input
                            type="text"
                            value={actionTitle}
                            onChange={(e) => setActionTitle(e.target.value)}
                            required={createAction}
                            className="form-input text-xs bg-slate-950 border-slate-700"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="form-label text-[11px]">Assignee *</label>
                            <input
                              type="text"
                              value={actionAssignee}
                              onChange={(e) => setActionAssignee(e.target.value)}
                              required={createAction}
                              className="form-input text-xs bg-slate-950 border-slate-700"
                            />
                          </div>
                          <div>
                            <label className="form-label text-[11px]">Due Date</label>
                            <input
                              type="date"
                              value={actionDueDate}
                              onChange={(e) => setActionDueDate(e.target.value)}
                              className="form-input text-xs bg-slate-950 border-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveItem(null)}
                      className="btn btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || Boolean(successMessage)}
                      className="btn btn-primary text-xs flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting Sign-off...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Sign-off & Update Audit Trail</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
