import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { CorrectiveAction, ReportListItem } from '../types';

interface ActionStats {
  total_actions: number;
  open_count: number;
  in_progress_count: number;
  verified_closed_count: number;
  overdue_count: number;
  closure_rate: number;
}

export const CorrectiveActionsView: React.FC = () => {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [stats, setStats] = useState<ActionStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('Field Operations Superintendent');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verification / Status update modal
  const [activeAction, setActiveAction] = useState<CorrectiveAction | null>(null);
  const [newStatus, setNewStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'VERIFIED_CLOSED'>('IN_PROGRESS');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('Er. Rajesh Baruah (Chief Safety Officer)');
  const [effectivenessRating, setEffectivenessRating] = useState<'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'RECURRENT_HAZARD'>('EFFECTIVE');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Recurrence analytics state
  const [recurrenceData, setRecurrenceData] = useState<{
    total_closed_actions: number;
    actions_with_recurrence: number;
    recurrence_rate: number;
    barrier_degradation_alarm: boolean;
    time_window_days: number;
    installation_breakdown: Record<string, number>;
    recurrence_records: Array<{
      action_id: string;
      report_id: string;
      action_title: string;
      installation: string;
      recurrence_count: number;
      recurring_report_ids: string[];
      recurrence_status: string;
    }>;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [acts, repList, rec] = await Promise.all([
        api.getActions(filterStatus || undefined),
        api.listReports({ limit: 100 }),
        api.getRecurrenceAnalytics(90).catch(() => null)
      ]);
      setActions(acts);
      setReports(repList.items);
      if (rec) setRecurrenceData(rec);

      // Compute stats
      const total = acts.length;
      const open = acts.filter((a) => a.status === 'OPEN').length;
      const prog = acts.filter((a) => a.status === 'IN_PROGRESS').length;
      const closed = acts.filter((a) => a.status === 'VERIFIED_CLOSED').length;
      const today = new Date().toISOString().split('T')[0];
      const overdue = acts.filter(
        (a) => a.status !== 'VERIFIED_CLOSED' && a.due_date && a.due_date < today
      ).length;

      setStats({
        total_actions: total,
        open_count: open,
        in_progress_count: prog,
        verified_closed_count: closed,
        overdue_count: overdue,
        closure_rate: total > 0 ? closed / total : 0
      });
    } catch (err) {
      console.error('Failed to load corrective actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const handleOpenCreate = () => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].report_id);
    }
    const future = new Date();
    future.setDate(future.getDate() + 14);
    setDueDate(future.toISOString().split('T')[0]);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId || !title.trim()) return;

    setSubmitting(true);
    try {
      const newAct = await api.createCorrectiveAction(selectedReportId, {
        title,
        assigned_to: assignedTo,
        due_date: dueDate || undefined,
        status: 'OPEN',
        notes
      });
      setActions((prev) => [newAct, ...prev]);
      setTitle('');
      setNotes('');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusModal = (act: CorrectiveAction) => {
    setActiveAction(act);
    setNewStatus(act.status as any);
    setVerificationNotes('');
    setEffectivenessRating('EFFECTIVE');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction) return;

    setUpdatingStatus(true);
    try {
      if (newStatus === 'VERIFIED_CLOSED') {
        const verified = await api.verifyAction(activeAction.action_id, {
          verified_by: verifiedBy,
          verification_notes: verificationNotes || 'Formal barrier verification completed and approved.',
          effectiveness_rating: effectivenessRating
        });
        setActions((prev) =>
          prev.map((a) => (a.action_id === verified.action_id ? verified : a))
        );
      } else {
        const updated = await api.updateAction(activeAction.action_id, {
          status: newStatus,
          notes: activeAction.notes
        });
        setActions((prev) =>
          prev.map((a) => (a.action_id === updated.action_id ? updated : a))
        );
      }
      setActiveAction(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update action status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const displayedActions = actions.filter((act) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      act.action_id.toLowerCase().includes(q) ||
      act.report_id.toLowerCase().includes(q) ||
      act.title.toLowerCase().includes(q) ||
      act.assigned_to.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-blue-500">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Actions</div>
            <div className="text-2xl font-black text-slate-100 font-mono">{stats?.total_actions ?? 0}</div>
            <div className="text-[10px] text-slate-400">Enterprise remedial tasks</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Tasks</div>
            <div className="text-2xl font-black text-amber-400 font-mono">{stats?.open_count ?? 0}</div>
            <div className="text-[10px] text-slate-400">Awaiting field execution</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-purple-500">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress</div>
            <div className="text-2xl font-black text-purple-400 font-mono">{stats?.in_progress_count ?? 0}</div>
            <div className="text-[10px] text-slate-400">Field works underway</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verified Closed</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{stats?.verified_closed_count ?? 0}</div>
            <div className="text-[10px] text-slate-400">
              Closure Rate: {stats ? `${(stats.closure_rate * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3 border-l-4 border-l-rose-500">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue Actions</div>
            <div className="text-2xl font-black text-rose-400 font-mono">{stats?.overdue_count ?? 0}</div>
            <div className="text-[10px] text-slate-400">Past compliance due date</div>
          </div>
        </div>
      </div>

      {/* Phase 19: Precursor Recurrence & Barrier Degradation Banner */}
      {recurrenceData && (
        <div className="card-nexa p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-amber-500 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Phase 19 Precursor Recurrence Intelligence
                </span>
                {recurrenceData.barrier_degradation_alarm ? (
                  <span className="badge-high text-[10px]">Barrier Degradation Alarm</span>
                ) : (
                  <span className="badge-low text-[10px]">No Systematic Recurrence</span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                Measures whether identical precursor patterns reappear after action closure across Oil India installations ({recurrenceData.time_window_days}-day window).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-muted block text-[10px]">Closed Actions:</span>
              <span className="font-bold text-foreground text-sm">{recurrenceData.total_closed_actions}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">With Recurrence:</span>
              <span className="font-bold text-amber-400 text-sm">{recurrenceData.actions_with_recurrence}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">Recurrence Rate:</span>
              <span className="font-bold text-foreground text-sm">{(recurrenceData.recurrence_rate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Control & Filter Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Action ID, report, title..."
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
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select py-1 px-2 text-xs bg-slate-900 border-slate-700 w-auto"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="IN_PROGRESS">In Progress Only</option>
              <option value="VERIFIED_CLOSED">Verified Closed Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="btn btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            title="Refresh Actions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="btn btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Corrective Action</span>
          </button>
        </div>
      </div>

      {/* Actions Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Loading enterprise corrective action log...
          </div>
        ) : displayedActions.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            Zero actions matching the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Action ID</th>
                  <th className="py-3 px-4">Report Ref</th>
                  <th className="py-3 px-4 font-sans">Action Description</th>
                  <th className="py-3 px-4 font-sans">Assignee</th>
                  <th className="py-3 px-4">Target Due Date</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedActions.map((act) => {
                  const isOverdue =
                    act.status !== 'VERIFIED_CLOSED' && act.due_date && act.due_date < todayStr;
                  return (
                    <tr key={act.action_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-amber-400">{act.action_id}</td>
                      <td className="py-3 px-4 text-blue-400 font-semibold">{act.report_id}</td>
                      <td className="py-3 px-4 font-sans text-slate-200 max-w-sm">
                        <div className="font-semibold text-xs text-slate-100">{act.title}</div>
                        {act.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{act.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">{act.assigned_to}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {act.due_date || 'N/A'}
                          </span>
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            act.status === 'VERIFIED_CLOSED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : act.status === 'IN_PROGRESS'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenStatusModal(act)}
                          className="btn btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-5 space-y-4 border border-amber-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Issue Enterprise Corrective Action</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="form-label text-xs">Originating Incident Report *</label>
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="form-select text-xs bg-slate-900 border-slate-700"
                  required
                >
                  {reports.map((r) => (
                    <option key={r.report_id} value={r.report_id}>
                      {r.report_id} — {r.site} ({r.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-xs">Action Title & Remedial Scope *</label>
                <input
                  type="text"
                  placeholder="e.g. Conduct ultrasonic wall thickness test & install certified blind"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="form-input text-xs bg-slate-900 border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">Assigned Responsibility *</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                    className="form-input text-xs bg-slate-900 border-slate-700"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Target Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="form-input text-xs bg-slate-900 border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs">Remedial Engineering Directives</label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, testing standard (e.g. API 510 / OISD-118 LOTO)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea text-xs bg-slate-900 border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Creating...' : 'Issue Corrective Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {activeAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-5 space-y-4 border border-blue-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Update Action Lifecycle — {activeAction.action_id}
                </h3>
              </div>
              <button
                onClick={() => setActiveAction(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 font-sans p-3 bg-slate-900/60 rounded border border-slate-800">
              <div className="font-bold text-slate-100 mb-1">{activeAction.title}</div>
              <div className="text-slate-400">Report: {activeAction.report_id} | Assignee: {activeAction.assigned_to}</div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="form-label text-xs">New Action Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'OPEN', label: 'OPEN' },
                    { key: 'IN_PROGRESS', label: 'IN PROGRESS' },
                    { key: 'VERIFIED_CLOSED', label: 'VERIFIED CLOSED' }
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setNewStatus(s.key as any)}
                      className={`py-2 px-2 rounded text-center text-xs font-bold transition border ${
                        newStatus === s.key
                          ? s.key === 'VERIFIED_CLOSED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : s.key === 'IN_PROGRESS'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {newStatus === 'VERIFIED_CLOSED' && (
                <div className="space-y-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>HSE Verification of Barrier Reinstatement</span>
                  </div>
                  <div>
                    <label className="form-label text-[11px]">Verifying Safety Inspector *</label>
                    <input
                      type="text"
                      value={verifiedBy}
                      onChange={(e) => setVerifiedBy(e.target.value)}
                      required
                      className="form-input text-xs bg-slate-950 border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="form-label text-[11px]">Barrier Effectiveness Rating *</label>
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {[
                        { key: 'EFFECTIVE', label: 'EFFECTIVE' },
                        { key: 'PARTIALLY_EFFECTIVE', label: 'PARTIAL' },
                        { key: 'RECURRENT_HAZARD', label: 'RECURRENT' }
                      ].map((r) => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setEffectivenessRating(r.key as any)}
                          className={`py-1 px-1.5 rounded text-center text-[10px] font-bold border transition ${
                            effectivenessRating === r.key
                              ? r.key === 'RECURRENT_HAZARD'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                                : r.key === 'PARTIALLY_EFFECTIVE'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="form-label text-[11px]">Field Verification Evidence *</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Field inspection confirmed clamp pressure rated, hydrotest passed, PTW closed..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      required={newStatus === 'VERIFIED_CLOSED'}
                      className="form-textarea text-xs bg-slate-950 border-slate-700"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="btn btn-primary text-xs"
                >
                  {updatingStatus ? 'Updating...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
