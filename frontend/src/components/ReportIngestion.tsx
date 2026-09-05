import React, { useState } from 'react';
import { Send, Sparkles, FileText, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ReportResponse } from '../types';

interface ReportIngestionProps {
  onTriageComplete: (report: ReportResponse) => void;
}

const DEMO_PRESETS = [
  {
    label: 'Tank Confined Space (Canonical Golden Demo)',
    site: 'Duliajan Production Installation',
    location: 'Separator Station #4',
    department: 'Mechanical Maintenance',
    activity: 'Separator Vessel Inspection',
    equipment: 'Gas Separator V-102',
    reporter_role: 'Lead Operator',
    narrative:
      'During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside.',
  },
  {
    label: 'Live Gas Line Flange Removal (Energy Isolation)',
    site: 'Moran Gathering Station',
    location: 'Manifold Skid B',
    department: 'Pipeline Operations',
    activity: 'Flange Unbolting',
    equipment: 'Main Gathering Line 12-inch',
    reporter_role: 'Maintenance Fitter',
    narrative:
      'Mechanical technician attempted to unbolt a pressurized gas line flange before closing isolation block valves. Stored energy was present without LOTO verification.',
  },
  {
    label: 'Crane Slewing Over Drill Floor (Line of Fire)',
    site: 'Drilling Rig OIL-45',
    location: 'Drill Floor / Catwalk',
    department: 'Drilling Services',
    activity: 'Tubular Handling',
    equipment: 'Hydraulic Rig Crane #2',
    reporter_role: 'Assistant Driller',
    narrative:
      'During rig operations, a roustabout was walking underneath the suspended load while the crane was slewing a 3-ton casing joint across the drill floor.',
  },
  {
    label: 'Routine Housekeeping (Low SIF Potential)',
    site: 'Digboi Central Store',
    location: 'Warehouse Bay 3',
    department: 'Materials Management',
    activity: 'Housekeeping',
    equipment: 'Wooden Storage Pallets',
    reporter_role: 'Warehouse Helper',
    narrative:
      'Warehouse helper noticed five empty wooden shipping pallets stacked unevenly behind store room and restacked them neatly against the exterior wall.',
  },
];

export const ReportIngestion: React.FC<ReportIngestionProps> = ({ onTriageComplete }) => {
  const [site, setSite] = useState(DEMO_PRESETS[0].site);
  const [location, setLocation] = useState(DEMO_PRESETS[0].location);
  const [department, setDepartment] = useState(DEMO_PRESETS[0].department);
  const [activity, setActivity] = useState(DEMO_PRESETS[0].activity);
  const [equipment, setEquipment] = useState(DEMO_PRESETS[0].equipment);
  const [reporterRole, setReporterRole] = useState(DEMO_PRESETS[0].reporter_role);
  const [narrative, setNarrative] = useState(DEMO_PRESETS[0].narrative);
  const [reportType, setReportType] = useState('near_miss');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof DEMO_PRESETS[0]) => {
    setSite(preset.site);
    setLocation(preset.location);
    setDepartment(preset.department);
    setActivity(preset.activity);
    setEquipment(preset.equipment);
    setReporterRole(preset.reporter_role);
    setNarrative(preset.narrative);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim() || narrative.length < 10) {
      setError('Please enter a detailed safety narrative (minimum 10 characters).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.submitReport({
        site,
        location,
        department,
        activity,
        equipment: equipment ? [equipment] : [],
        reporter_role: reporterRole,
        narrative,
        report_type: reportType,
      });

      onTriageComplete(result);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Scenario Selector Banner */}
      <div className="glass-panel p-5 border border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-300">
              Live Precursor Test Scenarios
            </span>
          </div>
          <span className="text-xs text-slate-400">Click to instantly populate canonical scenarios</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className="text-left p-2.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-xs transition group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                {p.label}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.activity}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Ingestion Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
              <FileText className="w-5 h-5 text-amber-400" />
              HSSE Incident & Precursor Intake
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit free-text incident narratives for automated SIF precursor extraction and Life-Saving Rules mapping.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-iogp text-xs">P0 Data Governance</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Operational Asset / Site *</label>
            <input
              type="text"
              className="form-input"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Platform</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Report Category</label>
            <select
              className="form-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="near_miss">Near Miss</option>
              <option value="unsafe_act">Unsafe Act</option>
              <option value="unsafe_condition">Unsafe Condition</option>
              <option value="incident">Incident</option>
              <option value="hazard_observation">Hazard Observation</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Operational Activity</label>
            <input
              type="text"
              className="form-input"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g. Tank Maintenance, Wireline, Lifting"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Equipment Involved</label>
            <input
              type="text"
              className="form-input"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Separator V-102, Crane, Mud Pump"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reporter Role</label>
            <input
              type="text"
              className="form-input"
              value={reporterRole}
              onChange={(e) => setReporterRole(e.target.value)}
              placeholder="e.g. Lead Operator, HSE Officer"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="flex items-center justify-between mb-1.5">
            <label className="form-label">Safety Incident Free-Text Narrative *</label>
            <span className="text-[11px] text-slate-400">
              PII automatically masked • Raw text preserved immutably
            </span>
          </div>
          <textarea
            rows={4}
            className="form-textarea font-mono text-sm leading-relaxed"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Describe what occurred, personnel positioning, energy sources, barriers present, and control failures..."
            required
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Adheres to OIL Canonical Safety Schema & IOGP Rule Taxonomy</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary px-6"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Hybrid Triage...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Analyze Incident Precursor</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
