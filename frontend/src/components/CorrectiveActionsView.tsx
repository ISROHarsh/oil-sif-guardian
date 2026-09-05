import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { CorrectiveAction, ReportListItem } from '../types';

export const CorrectiveActionsView: React.FC = () => {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // New action form state
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('Field Operations Superintendent');
  const [dueDate, setDueDate] = useState('2026-09-15');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const res = await api.listReports({ limit: 50 });
      setReports(res.items);
      if (res.items.length > 0) {
        setSelectedReportId(res.items[0].report_id);
        fetchActionsForReport(res.items[0].report_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActionsForReport = async (reportId: string) => {
    setLoading(true);
    try {
      const full = await api.getReport(reportId);
      setActions(full.corrective_actions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedReportId(rId);
    fetchActionsForReport(rId);
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId || !title.trim()) return;

    setSubmitting(true);
    try {
      const newAct = await api.createCorrectiveAction(selectedReportId, {
        title,
        assigned_to: assignedTo,
        due_date: dueDate,
        status: 'OPEN',
        notes,
      });

      setActions((prev) => [newAct, ...prev]);
      setTitle('');
      setNotes('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create corrective action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-400" />
            Corrective Action Lifecycle & Verification
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track and verify remedial controls dispatched to prevent SIF precursor recurrence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="form-select text-xs font-mono py-1.5 px-3 w-64"
            value={selectedReportId}
            onChange={handleReportChange}
          >
            {reports.map((r) => (
              <option key={r.id} value={r.report_id}>
                {r.report_id} — {r.priority} ({r.site})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Action</span>
          </button>
        </div>
      </div>

      {/* New Action Form */}
      {showForm && (
        <form onSubmit={handleCreateAction} className="glass-panel p-5 space-y-4 border border-amber-500/40">
          <h3 className="text-sm font-bold text-slate-200">
            Dispatch Corrective Action for {selectedReportId}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Action Title *</label>
              <input
                type="text"
                className="form-input text-xs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Conduct 100% calibration check of all atmospheric H2S monitors"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Completion Date *</label>
              <input
                type="date"
                className="form-input text-xs font-mono"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Action Assignee / Role *</label>
              <input
                type="text"
                className="form-input text-xs"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Implementation Notes</label>
              <input
                type="text"
                className="form-input text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific verification steps, field evidence required..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-xs"
            >
              {submitting ? 'Dispatching...' : 'Dispatch Corrective Action'}
            </button>
          </div>
        </form>
      )}

      {/* Actions List */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
          <span>Active Actions for {selectedReportId || 'Selected Report'}</span>
          <span className="text-xs font-mono text-slate-400">
            {actions.length} Action{actions.length === 1 ? '' : 's'}
          </span>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading corrective actions...</div>
        ) : actions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No corrective actions currently registered for this report. Click "New Action" above to dispatch remedial controls.
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((act) => (
              <div
                key={act.action_id}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-semibold">
                      {act.action_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        act.status === 'VERIFIED_CLOSED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-slate-100">{act.title}</div>
                  {act.notes && <div className="text-xs text-slate-400">{act.notes}</div>}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{act.assigned_to}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {act.due_date || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
